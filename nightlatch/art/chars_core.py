"""Character sprite renderer: supersampled vector parts -> hard-edged pixel art.

Parts are drawn at SS x resolution into a part-id buffer with per-pixel shading, then each
SSxSS block takes its majority part (coverage threshold keeps thin limbs alive) and the mean
shade of that part, quantised onto the part's ramp without dithering.  A coloured
"selective outline" and internal contour lines finish the sprite.
"""
from __future__ import annotations

import math
import numpy as np

from core import RAMPS

SS = 4


class Sprite:
    def __init__(self, w: int, h: int, ox: float, oy: float, k: float = 1.0):
        self.k = k
        self.w, self.h = w, h
        self.W, self.H = w * SS, h * SS
        self.ox, self.oy = ox, oy          # final-pixel origin (feet centre)
        self.pid = np.zeros((self.H, self.W), np.int16)
        self.lum = np.zeros((self.H, self.W), np.float32)
        self.parts: list[tuple[str, int]] = [('', 0)]   # (ramp, outline_mode)
        self.overlay = []   # final-res pixel ops applied after downsampling

    # coordinate helpers: (x right, y up) in final pixels relative to origin
    rot_deg = 0.0
    pivot = (0.0, 0.0)
    shift = (0.0, 0.0)

    def T(self, x, y):
        """Pose space (x right, y up, final px) -> supersampled canvas coords."""
        if self.rot_deg:
            a = math.radians(self.rot_deg)
            px, py = self.pivot
            dx, dy = x - px, y - py
            x = px + dx * math.cos(a) - dy * math.sin(a)
            y = py + dx * math.sin(a) + dy * math.cos(a)
        x += self.shift[0]
        y += self.shift[1]
        return (self.ox + x * self.k) * SS, (self.oy - y * self.k) * SS

    def X(self, x):
        return (self.ox + x * self.k) * SS

    def Y(self, y):
        return (self.oy - y * self.k) * SS

    def new_part(self, ramp: str, outline: int = 1) -> int:
        self.parts.append((ramp, outline))
        return len(self.parts) - 1

    def _region(self, xs, ys, pad=2):
        x0 = max(0, int(min(xs)) - pad)
        x1 = min(self.W, int(max(xs)) + pad + 1)
        y0 = max(0, int(min(ys)) - pad)
        y1 = min(self.H, int(max(ys)) + pad + 1)
        return x0, y0, x1, y1

    def _write(self, part, mask, lum, region):
        x0, y0, x1, y1 = region
        P = self.pid[y0:y1, x0:x1]
        L = self.lum[y0:y1, x0:x1]
        P[mask] = part
        L[mask] = lum[mask] if isinstance(lum, np.ndarray) else lum

    # ---- shapes (coordinates in final px, y up) ---------------------------------------
    def capsule(self, part, a, b, ra, rb=None, base=.5, light=(-0.6, 0.8), shade_k=.22):
        """Tapered capsule from a to b with radii ra, rb (final px)."""
        rb = ra if rb is None else rb
        ax, ay = self.T(a[0], a[1])
        bx, by = self.T(b[0], b[1])
        Ra, Rb = ra * SS * self.k, rb * SS * self.k
        x0, y0, x1, y1 = self._region([ax - Ra, bx - Rb, ax + Ra, bx + Rb], [ay - Ra, by - Rb, ay + Ra, by + Rb])
        if x1 <= x0 or y1 <= y0:
            return
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32) + .5
        dx, dy = bx - ax, by - ay
        L2 = dx * dx + dy * dy
        t = np.clip(((xx - ax) * dx + (yy - ay) * dy) / max(L2, 1e-6), 0, 1)
        px, py = ax + dx * t, ay + dy * t
        R = Ra + (Rb - Ra) * t
        ddx, ddy = xx - px, yy - py
        d = np.sqrt(ddx * ddx + ddy * ddy)
        mask = d <= R
        # cylindrical shading: signed lateral offset vs light direction (screen space, y down)
        lx, ly = light[0], -light[1]
        nrm = (ddx * lx + ddy * ly) / np.maximum(R, 1e-3)
        lum = base + shade_k * (-nrm) * .9 - .06 * (d / np.maximum(R, 1e-3)) ** 2
        lum = np.where(nrm < 0, lum + .02, lum)
        self._write(part, mask, lum.astype(np.float32), (x0, y0, x1, y1))

    def poly(self, part, pts, base=.5, grad=None, light=(-0.6, 0.8), shade_k=.15):
        P = [self.T(x, y) for x, y in pts]
        xs = [p[0] for p in P]
        ys = [p[1] for p in P]
        x0, y0, x1, y1 = self._region(xs, ys, 1)
        if x1 <= x0 or y1 <= y0:
            return
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32) + .5
        inside = np.zeros(xx.shape, bool)
        n = len(P)
        j = n - 1
        for i in range(n):
            xi, yi = P[i]
            xj, yj = P[j]
            cond = (yi > yy) != (yj > yy)
            with np.errstate(divide='ignore', invalid='ignore'):
                xint = (xj - xi) * (yy - yi) / ((yj - yi) if yj != yi else 1e-9) + xi
            inside ^= cond & (xx < xint)
            j = i
        cx = sum(xs) / n
        cy = sum(ys) / n
        span = max(max(xs) - min(xs), max(ys) - min(ys), 1)
        lx, ly = light[0], -light[1]
        lum = base + shade_k * (-((xx - cx) * lx + (yy - cy) * ly) / span) * 2
        if grad is not None:
            g0, g1 = grad   # top -> bottom luminance offsets
            t = np.clip((yy - min(ys)) / max(1, (max(ys) - min(ys))), 0, 1)
            lum = lum + g0 + (g1 - g0) * t
        self._write(part, inside, lum.astype(np.float32), (x0, y0, x1, y1))

    def ellipse(self, part, c, rx, ry, base=.5, light=(-0.6, 0.8), shade_k=.25, rot=0.0):
        cx, cy = self.T(c[0], c[1])
        RX, RY = rx * SS * self.k, ry * SS * self.k
        rot = rot - math.radians(self.rot_deg)
        R = max(RX, RY)
        x0, y0, x1, y1 = self._region([cx - R, cx + R], [cy - R, cy + R])
        if x1 <= x0 or y1 <= y0:
            return
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32) + .5
        dx, dy = xx - cx, yy - cy
        if rot:
            ca, sa = math.cos(rot), math.sin(rot)
            dx, dy = dx * ca + dy * sa, -dx * sa + dy * ca
        nx, ny = dx / RX, dy / RY
        d = nx * nx + ny * ny
        mask = d <= 1
        lx, ly = light[0], -light[1]
        lum = base + shade_k * (-(nx * lx + ny * ly)) - .08 * d
        self._write(part, mask, lum.astype(np.float32), (x0, y0, x1, y1))

    # ---- final-res pixel overlay ----------------------------------------------------------
    def px(self, x, y, ramp, idx_or_lum, kind='lum'):
        """Queue a final-resolution pixel (x right, y up, relative to origin)."""
        X, Y = self.T(x, y)
        self.overlay.append((X / SS, Y / SS, ramp, idx_or_lum, kind))

    # ---- downsample + outline -------------------------------------------------------------
    def render(self, outline_color=None) -> np.ndarray:
        h, w = self.h, self.w
        pid = self.pid.reshape(h, SS, w, SS).transpose(0, 2, 1, 3).reshape(h, w, SS * SS)
        lum = self.lum.reshape(h, SS, w, SS).transpose(0, 2, 1, 3).reshape(h, w, SS * SS)
        nparts = len(self.parts)
        counts = np.zeros((h, w, nparts), np.int16)
        for k in range(nparts):
            counts[..., k] = (pid == k).sum(-1)
        filled = SS * SS - counts[..., 0]
        cnt_fg = counts.copy()
        cnt_fg[..., 0] = -1
        # prefer the part drawn last when tied (higher id = drawn later = in front)
        tie = np.arange(nparts)[None, None, :] * 1e-3
        best = np.argmax(cnt_fg + tie, -1)
        opaque = filled >= max(1, int(SS * SS * .34))
        out_pid = np.where(opaque, best, 0)
        # mean luminance of the winning part
        sel = pid == out_pid[..., None]
        L = np.where(sel, lum, 0).sum(-1) / np.maximum(sel.sum(-1), 1)
        rgba = np.zeros((h, w, 4), np.uint8)
        shade_idx = np.zeros((h, w), np.int16)
        for k in range(1, nparts):
            m = out_pid == k
            if not m.any():
                continue
            cols = RAMPS[self.parts[k][0]]
            n = len(cols)
            idx = np.clip(np.round(L * (n - 1)), 1, n - 1).astype(int)
            rgba[m, :3] = cols[idx[m]]
            rgba[m, 3] = 255
            shade_idx[m] = idx[m]
        # internal contours: where a front part meets a different part, darken the pixel of
        # the part that is drawn later (in front) if it is lower on screen or to the side
        pad = np.pad(out_pid, 1)
        for (dy, dx) in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nb = pad[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
            edge = (out_pid > 0) & (nb > 0) & (nb != out_pid) & (out_pid > nb)
            for k in range(1, nparts):
                if self.parts[k][1] < 2:
                    continue
                m = edge & (out_pid == k)
                if m.any():
                    cols = RAMPS[self.parts[k][0]]
                    idx = np.clip(shade_idx[m] - 2, 0, len(cols) - 1)
                    rgba[m, :3] = cols[idx]
        # selective outline: transparent pixels next to the sprite get the darkest shade of the
        # neighbouring part (or a global colour)
        out = rgba.copy()
        alpha = rgba[..., 3] > 0
        pada = np.pad(out_pid, 1)
        for (dy, dx) in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nb = pada[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
            m = (~alpha) & (nb > 0) & (out[..., 3] == 0)
            if not m.any():
                continue
            for k in np.unique(nb[m]):
                mk = m & (nb == k)
                if self.parts[k][1] == 0:
                    continue
                cols = RAMPS[self.parts[k][0]]
                col = np.array(outline_color, np.uint8) if outline_color is not None else (cols[0] // 2 + 4)
                out[mk, :3] = col
                out[mk, 3] = 255
        # overlay pixels (faces, buttons, highlights)
        blk = int(round(self.k)) if self.k >= 1.5 else 1
        for (fx, fy, ramp, v, kind) in self.overlay:
            X0 = int(round(fx - (blk - 1) / 2))
            Y0 = int(round(fy - (blk - 1) / 2))
            if kind == 'rgb':
                col = v
            else:
                cols = RAMPS[ramp]
                idx = v if kind == 'idx' else int(np.clip(round(v * (len(cols) - 1)), 0, len(cols) - 1))
                col = cols[idx]
            for Y in range(Y0, Y0 + blk):
                for X in range(X0, X0 + blk):
                    if 0 <= X < w and 0 <= Y < h:
                        out[Y, X, :3] = col
                        out[Y, X, 3] = 255
        return out


def rot(v, ang_deg):
    a = math.radians(ang_deg)
    return (v[0] * math.cos(a) - v[1] * math.sin(a), v[0] * math.sin(a) + v[1] * math.cos(a))


def add(a, b):
    return (a[0] + b[0], a[1] + b[1])


def limb(origin, length, ang_deg):
    """Point at `length` from origin, angle measured from straight down, positive = forward."""
    a = math.radians(ang_deg)
    return (origin[0] + length * math.sin(a), origin[1] - length * math.cos(a))
