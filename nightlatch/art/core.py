"""NIGHT LATCH pixel-art core.

Every background is painted into two buffers: a *ramp id* (which material colour ramp a
pixel belongs to) and a *luminance* (0..1 position on that ramp).  Light sources then scale
luminance, and the result is quantised onto the ramp with ordered (Bayer) dithering.  This
reproduces the look of hand-shaded early-90s VGA art: few shades per material, cool
shadows, warm highlights, dithered transitions.
"""
from __future__ import annotations

import math
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(ROOT, '..', 'public', 'assets'))

BAYER4 = (np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) + 0.5) / 16.0


def hx(h: str):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


RAMPS: dict[str, np.ndarray] = {}


def ramp(name: str, *colors: str):
    RAMPS[name] = np.array([hx(c) for c in colors], np.uint8)


# --- master ramps (dark -> light, hue-shifted: cool shadows, warm lights) -------------
ramp('ink', '#05060a', '#0a0c13', '#10131d', '#171b28')
ramp('night', '#090b15', '#0f1726', '#152239', '#1d304d', '#284263', '#36577a', '#4a6f92', '#6688a6', '#88a5bc')
ramp('slate', '#101117', '#1a1c24', '#262933', '#343843', '#444955', '#575d69', '#6d7380', '#868c98', '#a3a8b2')
ramp('teal', '#0b1213', '#111c1c', '#182726', '#213431', '#2b423d', '#37534b', '#47665a', '#5b7b6c', '#749282')
ramp('mauve', '#140c13', '#1f121b', '#2d1a26', '#3d2432', '#4f2f3f', '#633c4d', '#7a4d5d', '#93626f')
ramp('wood', '#110907', '#1c0f0a', '#29160e', '#381f13', '#492818', '#5c331e', '#714025', '#894f2e', '#a2613a')
ramp('oak', '#1d120b', '#301e12', '#452b19', '#5b3a21', '#734b2a', '#8c5d34', '#a6713f', '#be874f', '#d49f66')
ramp('brick', '#150a09', '#23100d', '#341712', '#461f17', '#59281c', '#6c3222', '#803d29', '#954b33')
ramp('skin', '#2a1410', '#43211a', '#613226', '#824634', '#a25d43', '#bf7856', '#d6956c', '#e8b388')
ramp('lamp', '#3d1d08', '#6b3510', '#9a5318', '#c77822', '#e89e35', '#f7c15a', '#ffdf8e', '#fff3c8')
ramp('neonred', '#2a0508', '#4d0a10', '#7a111a', '#a81b24', '#d42d33', '#f05a52', '#ff8f7f', '#ffc9bb')
ramp('neonblue', '#06102a', '#0a1d4a', '#0f2e70', '#16469a', '#2464c4', '#3f88e6', '#6eaef7', '#b0d6ff')
ramp('brass', '#1f1306', '#3a240b', '#5a3a12', '#7c531b', '#9e6e26', '#be8a33', '#d9a945', '#ecc864', '#f8e49a')
ramp('steel', '#0e1115', '#191e25', '#252c35', '#333b46', '#434c58', '#56606c', '#6c7682', '#858f9a', '#a3abb4')
ramp('paper', '#28241e', '#3d382f', '#554e42', '#6f6756', '#8a816c', '#a59c84', '#bfb79d', '#d7d0b6', '#ebe6d0')
ramp('red', '#190709', '#2b0b10', '#420f17', '#5a1520', '#731c28', '#8d2532', '#a7333e', '#c0464d')
ramp('felt', '#07110c', '#0c1c14', '#12281d', '#193727', '#224732', '#2c583e', '#386b4c', '#487f5c')
ramp('trench', '#1e170e', '#302516', '#45361f', '#5b4829', '#725b34', '#8a6f40', '#a3844e', '#ba9a62', '#d0b179')
ramp('glass', '#090f18', '#0e1d31', '#152c47', '#1e3d5d', '#294f73', '#36658b', '#4c7ea3', '#6b9aba')
ramp('water', '#04070d', '#08101d', '#0d192d', '#13243e', '#1b3150', '#254063', '#325276', '#44688b', '#5e819f')
ramp('fog', '#2f3843', '#3c4651', '#4a5560', '#59646f', '#6a7580', '#7c8792', '#909aa4', '#a6aeb6')
ramp('tile', '#1d2022', '#303537', '#464c4d', '#5e6564', '#777f7c', '#919893', '#acb1aa', '#c6cbc2', '#dee2d8')
ramp('sage', '#0e1612', '#17241d', '#213429', '#2c4536', '#385744', '#466a52', '#567d62', '#6a9274', '#82a888')
ramp('blood', '#080000', '#170203', '#2b0405', '#420708', '#5c0a0b', '#780f0f', '#951615', '#b4201d', '#d4302a', '#f04a3c')
ramp('concrete', '#121212', '#1d1d1c', '#292927', '#363533', '#454441', '#56544f', '#686660', '#7c7973', '#928f88')
ramp('rust', '#180b06', '#2b1409', '#411e0e', '#582913', '#703419', '#894220', '#a2532a')
ramp('ice', '#0c1420', '#132131', '#1b3045', '#273f59', '#34516d', '#456583', '#5a7c99', '#7495b0', '#94b2c7', '#bcd2e0')
ramp('cream', '#2a241d', '#40372c', '#594d3d', '#736550', '#8f7e66', '#ab987d', '#c5b296', '#ddcbb0', '#efe2c9')
ramp('dusk', '#0b0812', '#140e20', '#1d1430', '#271b40', '#322451', '#3f2f63', '#4f3d75', '#634f88', '#7c679c')
ramp('gold', '#241604', '#46300a', '#6b4a10', '#906619', '#b48526', '#d4a53a', '#ecc659', '#fbe48d')
ramp('chrome', '#101317', '#1f252c', '#323a44', '#48525e', '#606b78', '#7c8794', '#9aa4af', '#bcc4cc', '#e2e7ec')
ramp('olive', '#11120a', '#1c1e10', '#282b17', '#353920', '#43482a', '#535935', '#646b41', '#777f4f')
ramp('plum', '#12080f', '#1f0e1a', '#2e1527', '#3e1d35', '#4f2644', '#623054', '#783d66')
ramp('white', '#3a3a3e', '#56565b', '#727378', '#8f9095', '#acadb1', '#c7c8cb', '#e0e1e2', '#f4f4f2')
ramp('black', '#030304', '#08080a', '#0e0e11', '#151519', '#1d1d22')
ramp('safelight', '#050000', '#120101', '#220203', '#360405', '#4c0607', '#640a0a', '#7e0f0e', '#9b1714', '#ba221c', '#d93a2c')
ramp('grass', '#08100a', '#0e1a10', '#152617', '#1e341e', '#284426', '#335430', '#41663b')
ramp('denim', '#0b0f17', '#131a27', '#1c2638', '#26334a', '#32425d', '#405471', '#516887')


def noise2(w: int, h: int, scale: float, seed: int = 0, octaves: int = 1, persistence: float = .5) -> np.ndarray:
    """Fractal value noise in [0,1]."""
    rng = np.random.default_rng(seed)
    total = np.zeros((h, w), np.float32)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        s = max(scale / (2 ** o), 1.0)
        gw, gh = int(w / s) + 3, int(h / s) + 3
        grid = rng.random((gh, gw)).astype(np.float32)
        ys = np.arange(h, dtype=np.float32) / s
        xs = np.arange(w, dtype=np.float32) / s
        y0 = np.floor(ys).astype(int)
        x0 = np.floor(xs).astype(int)
        fy = ys - y0
        fx = xs - x0
        fy = fy * fy * (3 - 2 * fy)
        fx = fx * fx * (3 - 2 * fx)
        a = grid[y0][:, x0]
        b = grid[y0][:, x0 + 1]
        c = grid[y0 + 1][:, x0]
        d = grid[y0 + 1][:, x0 + 1]
        top = a + (b - a) * fx[None, :]
        bot = c + (d - c) * fx[None, :]
        total += amp * (top + (bot - top) * fy[:, None])
        norm += amp
        amp *= persistence
    return total / norm


class Light:
    def __init__(self, x, y, radius, intensity=1.0, *, falloff=1.6, cone=None, ystretch=1.0, flicker=0.0):
        self.x, self.y, self.r, self.i = x, y, radius, intensity
        self.falloff = falloff
        self.cone = cone          # (angle_deg, half_width_deg) pointing direction
        self.ystretch = ystretch  # >1 squashes the pool vertically (floor pools)

    def field(self, w, h):
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        dx = xx - self.x
        dy = (yy - self.y) * self.ystretch
        d = np.sqrt(dx * dx + dy * dy) / self.r
        f = np.clip(1 - d, 0, 1) ** self.falloff
        if self.cone is not None:
            ang, half = self.cone
            a = np.degrees(np.arctan2(yy - self.y, xx - self.x))
            diff = np.abs((a - ang + 180) % 360 - 180)
            f *= np.clip(1 - (diff - half) / 8.0, 0, 1)
        return f * self.i


class Canvas:
    def __init__(self, w: int, h: int, seed: int = 1):
        self.w, self.h = w, h
        self.rid = np.full((h, w), -1, np.int16)
        self.lum = np.zeros((h, w), np.float32)
        self.emis = np.zeros((h, w), np.float32)
        self.dith = np.ones((h, w), np.float32)
        self.extra = np.zeros((h, w), np.float32)   # additive light painted directly (blinds, shafts)
        self.shade = np.ones((h, w), np.float32)    # multiplicative shadow mask
        self.names: list[str] = []
        self.ids: dict[str, int] = {}
        self.lights: list[Light] = []
        self.ambient = 0.55
        self.seed = seed
        self.rng = np.random.default_rng(seed)
        self.glows = []   # (x, y, r, rgb, strength)
        self.default_dith = 0.55

    # ---- bookkeeping -------------------------------------------------------------
    def rid_of(self, name: str) -> int:
        if name not in self.ids:
            if name not in RAMPS:
                raise KeyError('unknown ramp ' + name)
            self.ids[name] = len(self.names)
            self.names.append(name)
        return self.ids[name]

    def _apply(self, mask, ramp_name, lum, emis=None, dith=None, region=None):
        """mask: bool array (full size or region-sized); lum: float or array broadcastable."""
        if region is not None:
            x0, y0, x1, y1 = region
            sl = (slice(y0, y1), slice(x0, x1))
        else:
            sl = (slice(None), slice(None))
        rid = self.rid_of(ramp_name)
        R = self.rid[sl]
        L = self.lum[sl]
        if callable(lum):
            hh, ww = R.shape
            yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
            if region is not None:
                yy += region[1]
                xx += region[0]
            lum = lum(xx, yy)
        lum_arr = np.broadcast_to(np.asarray(lum, np.float32), R.shape)
        R[mask] = rid
        L[mask] = lum_arr[mask]
        if emis is not None:
            self.emis[sl][mask] = emis
        else:
            self.emis[sl][mask] = 0
        if dith is not None:
            self.dith[sl][mask] = dith
        else:
            self.dith[sl][mask] = self.default_dith

    def clip_region(self, x0, y0, x1, y1):
        x0, y0 = max(0, int(math.floor(x0))), max(0, int(math.floor(y0)))
        x1, y1 = min(self.w, int(math.ceil(x1))), min(self.h, int(math.ceil(y1)))
        return x0, y0, x1, y1

    # ---- primitives --------------------------------------------------------------
    def rect(self, x0, y0, x1, y1, ramp_name, lum, **kw):
        """Fill [x0,x1) x [y0,y1)."""
        r = self.clip_region(x0, y0, x1, y1)
        if r[2] <= r[0] or r[3] <= r[1]:
            return
        mask = np.ones((r[3] - r[1], r[2] - r[0]), bool)
        self._apply(mask, ramp_name, lum, region=r, **kw)

    def poly_mask(self, pts):
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        r = self.clip_region(min(xs), min(ys), max(xs) + 1, max(ys) + 1)
        if r[2] <= r[0] or r[3] <= r[1]:
            return None, r
        hh, ww = r[3] - r[1], r[2] - r[0]
        yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
        xx += r[0] + 0.5
        yy += r[1] + 0.5
        inside = np.zeros((hh, ww), bool)
        n = len(pts)
        j = n - 1
        for i in range(n):
            xi, yi = pts[i]
            xj, yj = pts[j]
            cond = ((yi > yy) != (yj > yy))
            with np.errstate(divide='ignore', invalid='ignore'):
                xint = (xj - xi) * (yy - yi) / ((yj - yi) if yj != yi else 1e-9) + xi
            inside ^= cond & (xx < xint)
            j = i
        return inside, r

    def poly(self, pts, ramp_name, lum, **kw):
        m, r = self.poly_mask(pts)
        if m is None:
            return None
        self._apply(m, ramp_name, lum, region=r, **kw)
        return m, r

    def ellipse_mask(self, cx, cy, rx, ry):
        r = self.clip_region(cx - rx - 1, cy - ry - 1, cx + rx + 2, cy + ry + 2)
        if r[2] <= r[0] or r[3] <= r[1]:
            return None, r
        hh, ww = r[3] - r[1], r[2] - r[0]
        yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
        xx += r[0] + 0.5 - cx
        yy += r[1] + 0.5 - cy
        m = (xx / max(rx, .01)) ** 2 + (yy / max(ry, .01)) ** 2 <= 1.0
        return m, r

    def ellipse(self, cx, cy, rx, ry, ramp_name, lum, **kw):
        m, r = self.ellipse_mask(cx, cy, rx, ry)
        if m is None:
            return
        self._apply(m, ramp_name, lum, region=r, **kw)

    def put(self, x, y, ramp_name, lum, emis=0.0):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            self.rid[y, x] = self.rid_of(ramp_name)
            self.lum[y, x] = lum
            self.emis[y, x] = emis
            self.dith[y, x] = 0.0

    def line(self, x0, y0, x1, y1, ramp_name, lum, emis=0.0):
        x0, y0, x1, y1 = int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1))
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            self.put(x0, y0, ramp_name, lum, emis)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy

    def hline(self, x0, x1, y, ramp_name, lum, emis=0.0):
        self.rect(x0, y, x1, y + 1, ramp_name, lum, emis=emis, dith=0.0)

    def vline(self, x, y0, y1, ramp_name, lum, emis=0.0):
        self.rect(x, y0, x + 1, y1, ramp_name, lum, emis=emis, dith=0.0)

    def modulate(self, x0, y0, x1, y1, fn):
        """Multiply existing luminance in a region by fn(xx,yy) (array)."""
        r = self.clip_region(x0, y0, x1, y1)
        if r[2] <= r[0] or r[3] <= r[1]:
            return
        hh, ww = r[3] - r[1], r[2] - r[0]
        yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
        xx += r[0]
        yy += r[1]
        self.lum[r[1]:r[3], r[0]:r[2]] *= fn(xx, yy)

    def shadow_poly(self, pts, amount):
        m, r = self.poly_mask(pts)
        if m is None:
            return
        sub = self.shade[r[1]:r[3], r[0]:r[2]]
        sub[m] *= (1 - amount)

    def shadow_ellipse(self, cx, cy, rx, ry, amount):
        m, r = self.ellipse_mask(cx, cy, rx, ry)
        if m is None:
            return
        sub = self.shade[r[1]:r[3], r[0]:r[2]]
        hh, ww = sub.shape
        yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
        xx += r[0] + .5 - cx
        yy += r[1] + .5 - cy
        d = np.sqrt((xx / rx) ** 2 + (yy / ry) ** 2)
        f = np.clip(1 - d, 0, 1) ** .6
        sub *= (1 - amount * f)

    def light_poly(self, pts, amount):
        """Paint additive light (e.g. stripes through blinds)."""
        m, r = self.poly_mask(pts)
        if m is None:
            return
        self.extra[r[1]:r[3], r[0]:r[2]][m] += amount

    def add_light(self, *a, **k):
        L = Light(*a, **k)
        self.lights.append(L)
        return L

    def glow(self, x, y, r, color, strength=0.5):
        self.glows.append((x, y, r, hx(color) if isinstance(color, str) else color, strength))

    # ---- rendering ---------------------------------------------------------------
    def lightmap(self):
        lm = np.full((self.h, self.w), self.ambient, np.float32)
        for L in self.lights:
            lm += L.field(self.w, self.h)
        lm += self.extra
        lm *= self.shade
        return lm

    def render(self, remap: str | None = None, glow=True) -> np.ndarray:
        lm = self.lightmap()
        v = np.where(self.emis > 0, self.lum * (1 - self.emis) * lm + self.lum * self.emis, self.lum * lm)
        v = np.clip(v, 0, 1)
        h, w = self.h, self.w
        bay = np.tile(BAYER4, (h // 4 + 1, w // 4 + 1))[:h, :w]
        out = np.zeros((h, w, 3), np.uint8)
        for name, rid in self.ids.items():
            m = self.rid == rid
            if not m.any():
                continue
            cols = RAMPS[name]
            n = len(cols)
            t = (bay - 0.5) * self.dith + 0.5
            idx = np.clip(np.floor(v * (n - 1) + t), 0, n - 1).astype(int)
            out[m] = cols[idx[m]]
        if remap:
            out = remap_image(out, remap)
        if glow and self.glows:
            out = apply_glows(out, self.glows)
        return out

    def save(self, path, **kw):
        img = self.render(**kw)
        save_png(img, path)
        return img


def luminance(rgb: np.ndarray) -> np.ndarray:
    return (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]) / 255.0


def remap_image(rgb: np.ndarray, ramp_name: str, gain=1.0) -> np.ndarray:
    cols = RAMPS[ramp_name]
    n = len(cols)
    y = np.clip(luminance(rgb.astype(np.float32)) * gain, 0, 1)
    h, w = y.shape
    bay = np.tile(BAYER4, (h // 4 + 1, w // 4 + 1))[:h, :w]
    idx = np.clip(np.floor(y * (n - 1) + bay), 0, n - 1).astype(int)
    return cols[idx]


def apply_glows(rgb: np.ndarray, glows) -> np.ndarray:
    """Additive bloom quantised into dithered bands so it reads as pixel art."""
    h, w = rgb.shape[:2]
    out = rgb.astype(np.float32)
    bay = np.tile(BAYER4, (h // 4 + 1, w // 4 + 1))[:h, :w]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    for (x, y, r, col, s) in glows:
        d = np.sqrt((xx - x) ** 2 + (yy - y) ** 2) / r
        f = np.clip(1 - d, 0, 1) ** 2 * s
        q = np.floor(f * 5 + (bay - .5) * .6 + .5) / 5.0
        out += q[..., None] * np.array(col, np.float32)[None, None, :] * 0.55
    return np.clip(out, 0, 255).astype(np.uint8)


def save_png(img: np.ndarray, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if img.shape[-1] == 4:
        Image.fromarray(img, 'RGBA').save(path, optimize=True)
    else:
        Image.fromarray(img, 'RGB').save(path, optimize=True)


def out_path(*parts):
    return os.path.join(OUT, *parts)


# ---- shading helpers ---------------------------------------------------------------
def vgrad(y0, y1, l0, l1):
    """Return lum fn: vertical gradient from l0 at y0 to l1 at y1."""
    def f(xx, yy):
        t = np.clip((yy - y0) / max(1e-6, (y1 - y0)), 0, 1)
        return l0 + (l1 - l0) * t
    return f


def hgrad(x0, x1, l0, l1):
    def f(xx, yy):
        t = np.clip((xx - x0) / max(1e-6, (x1 - x0)), 0, 1)
        return l0 + (l1 - l0) * t
    return f


def radial(cx, cy, r, l0, l1, ystretch=1.0):
    def f(xx, yy):
        d = np.sqrt((xx - cx) ** 2 + ((yy - cy) * ystretch) ** 2) / r
        t = np.clip(d, 0, 1)
        return l0 + (l1 - l0) * t
    return f


def with_noise(fn, w, h, scale, amp, seed=0, octaves=2):
    """Wrap a lum fn (or constant) and add value noise (absolute coords)."""
    N = noise2(w, h, scale, seed, octaves)

    def f(xx, yy):
        base = fn(xx, yy) if callable(fn) else np.full(xx.shape, fn, np.float32)
        xi = np.clip(xx.astype(int), 0, w - 1)
        yi = np.clip(yy.astype(int), 0, h - 1)
        return base + (N[yi, xi] - 0.5) * 2 * amp
    return f
