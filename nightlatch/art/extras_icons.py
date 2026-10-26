"""NIGHT LATCH inventory icons (20x20) -> ui/items.png + ui/items.json (Phaser JSON-hash atlas).

Each icon is painted at native resolution into a core.Canvas (ramp + luminance), with
consistent upper-left lighting (per-part bevels, cylinder / sphere shading helpers), then
rendered without dithering and given a 1 px selective outline (the darkest shade of the
neighbouring material; near-black on the shadow side).
"""
from __future__ import annotations

import json
import math
import os
import re
import zlib

import numpy as np
from PIL import Image

from core import Canvas, RAMPS, out_path, noise2
import extras_common as EC
from extras_common import shift, dilate4, MICRO

W = H = 20
LX, LY, LZ = -0.62, -0.68, 0.40
_n = math.sqrt(LX * LX + LY * LY + LZ * LZ)
LX, LY, LZ = LX / _n, LY / _n, LZ / _n


# ------------------------------------------------------------------ shading fns ----------
def lin(l, k=.08, cx=10, cy=10):
    """Planar shading: brighter toward the upper-left."""
    return lambda X, Y: l + k * ((cx - X) + (cy - Y)) / 10.0


def sph(cx, cy, r, lo, hi, ry=None, spec=0.0):
    ry = ry or r

    def f(X, Y):
        dx = (X - cx) / r
        dy = (Y - cy) / ry
        nz = np.sqrt(np.clip(1 - dx * dx - dy * dy, 0, 1))
        b = np.clip(dx * LX + dy * LY + nz * LZ, 0, 1)
        out = lo + (hi - lo) * b
        if spec:
            out = out + spec * (b > .95)
        return out
    return f


def cyl(ax, ay, bx, by, r, lo, hi, spec=0.0):
    """Cylinder whose axis runs A->B with half-width r; shading across the axis."""
    ux, uy = bx - ax, by - ay
    n = math.hypot(ux, uy) or 1
    ux, uy = ux / n, uy / n
    nx, ny = -uy, ux

    def f(X, Y):
        s = np.clip(((X - ax) * nx + (Y - ay) * ny) / r, -1, 1)
        nz = np.sqrt(np.clip(1 - s * s, 0, 1))
        b = np.clip(s * nx * LX + s * ny * LY + nz * LZ, 0, 1)
        out = lo + (hi - lo) * b
        if spec:
            out = out + spec * (b > .93)
        return out
    return f


# ------------------------------------------------------------------ icon canvas ----------
class Ico:
    def __init__(self, seed=0):
        self.c = Canvas(W, H, seed)
        self.c.ambient = 1.0
        self.c.default_dith = 0.0
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        self.X = xx + .5
        self.Y = yy + .5
        self.rng = np.random.default_rng(seed + 17)
        self.post = []          # callables(rgba) run after the outline pass
        self.glows = []
        self.no_outline = np.zeros((H, W), bool)   # pixels that never receive an outline

    # ---- masks ------------------------------------------------------------------------
    @staticmethod
    def empty():
        return np.zeros((H, W), bool)

    def rect(self, x0, y0, x1, y1):
        """Inclusive rectangle mask."""
        m = self.empty()
        m[max(0, y0):max(0, y1 + 1), max(0, x0):max(0, x1 + 1)] = True
        return m

    def poly(self, pts):
        m, r = self.c.poly_mask(pts)
        M = self.empty()
        if m is not None:
            M[r[1]:r[3], r[0]:r[2]] = m
        return M

    def ell(self, cx, cy, rx, ry):
        m, r = self.c.ellipse_mask(cx, cy, rx, ry)
        M = self.empty()
        if m is not None:
            M[r[1]:r[3], r[0]:r[2]] = m
        return M

    def line(self, *pts):
        """Polyline (Bresenham) mask through integer points."""
        M = self.empty()
        for (x0, y0), (x1, y1) in zip(pts[:-1], pts[1:]):
            x0, y0, x1, y1 = int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1))
            dx, dy = abs(x1 - x0), -abs(y1 - y0)
            sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
            err = dx + dy
            while True:
                if 0 <= x0 < W and 0 <= y0 < H:
                    M[y0, x0] = True
                if x0 == x1 and y0 == y1:
                    break
                e2 = 2 * err
                if e2 >= dy:
                    err += dy
                    x0 += sx
                if e2 <= dx:
                    err += dx
                    y0 += sy
        if len(pts) == 1:
            x, y = pts[0]
            M[int(y), int(x)] = True
        return M

    def pix(self, pts):
        M = self.empty()
        for x, y in pts:
            if 0 <= x < W and 0 <= y < H:
                M[int(y), int(x)] = True
        return M

    def rows(self, x, y, rows, ch='#'):
        """Mask from ascii rows (character ch marks set pixels)."""
        M = self.empty()
        for j, r in enumerate(rows):
            for i, c in enumerate(r):
                if c in ch and 0 <= x + i < W and 0 <= y + j < H:
                    M[y + j, x + i] = True
        return M

    def digit(self, x, y, s):
        M = self.empty()
        cx = x
        for chh in s:
            g = MICRO[chh]
            for j, r in enumerate(g):
                for i, c in enumerate(r):
                    if c == '#' and 0 <= cx + i < W and 0 <= y + j < H:
                        M[y + j, cx + i] = True
            cx += len(g[0]) + 1
        return M

    @property
    def opaque(self):
        return self.c.rid >= 0

    # ---- painting ---------------------------------------------------------------------
    def paint(self, M, ramp, lum, bevel=(.1, .1), sep=0.0, dith=0.0, emis=None):
        """Fill mask M with a material; bevel=(hi, lo) lights the upper-left edge pixels and
        darkens the lower-right ones; sep>0 darkens existing pixels around M (contact line)."""
        if not M.any():
            return M
        L = lum(self.X, self.Y) if callable(lum) else np.full((H, W), lum, np.float32)
        L = np.asarray(L, np.float32).copy()
        if bevel:
            hi, lo = bevel
            up = shift(M, 1, 0)
            left = shift(M, 0, 1)
            down = shift(M, -1, 0)
            right = shift(M, 0, -1)
            tl = M & (~up | ~left)
            br = M & (~down | ~right)
            L = L + hi * tl - lo * br
        if sep:
            ring = dilate4(M) & ~M & self.opaque
            self.c.lum[ring] *= (1 - sep)
        self.c._apply(M, ramp, np.clip(L, 0, 1), emis=emis, dith=dith)
        return M

    def px(self, pts, ramp, lum, emis=None):
        if isinstance(pts, tuple):
            pts = [pts]
        return self.paint(self.pix(pts), ramp, lum, bevel=None, emis=emis)

    def darken(self, M, k=.5):
        M = M & self.opaque
        self.c.lum[M] *= k

    def lighten(self, M, add=.15):
        M = M & self.opaque
        self.c.lum[M] = np.clip(self.c.lum[M] + add, 0, 1)

    def glow(self, cx, cy, r, color, alpha=.6):
        self.glows.append((cx, cy, r, EC.hexrgb(color), alpha))

    # ---- output -----------------------------------------------------------------------
    def render(self, outline=True):
        rgb = self.c.render(glow=False).astype(np.int32)
        A = self.opaque.copy()
        out = np.zeros((H, W, 4), np.uint8)
        out[A, :3] = rgb[A]
        out[A, 3] = 255
        if outline:
            names = self.c.names
            O = dilate4(A) & ~A & ~self.no_outline
            for y, x in zip(*np.nonzero(O)):
                lit, shd = [], []
                if y + 1 < H and A[y + 1, x]:
                    lit.append((y + 1, x))
                if x + 1 < W and A[y, x + 1]:
                    lit.append((y, x + 1))
                if y - 1 >= 0 and A[y - 1, x]:
                    shd.append((y - 1, x))
                if x - 1 >= 0 and A[y, x - 1]:
                    shd.append((y, x - 1))
                cand = shd or lit
                best = None
                for (ny, nx) in cand:
                    base = RAMPS[names[self.c.rid[ny, nx]]][0].astype(np.int32)
                    if best is None or base.sum() < best.sum():
                        best = base
                if shd:
                    col = best * .45
                else:
                    col = best * .95 + 2
                out[y, x, :3] = np.clip(col, 0, 255).astype(np.uint8)
                out[y, x, 3] = 255
        if self.glows:
            bay = EC.bayer4(H, W)
            for (cx, cy, r, col, a0) in self.glows:
                d = np.sqrt((self.X - cx) ** 2 + (self.Y - cy) ** 2) / r
                f = np.clip(1 - d, 0, 1) ** 1.3 * a0
                q = np.floor(f * 4 + (bay - .5) * .9 + .5) / 4.0
                q = np.clip(q, 0, 1)
                empty = out[..., 3] == 0
                m = empty & (q > 0)
                out[m, :3] = col
                out[m, 3] = (q[m] * 255).astype(np.uint8)
                # warm the opaque pixels a touch
                lit = (out[..., 3] == 255) & (f > .05)
                mix = np.clip(f * .5, 0, .5)[..., None]
                out[lit, :3] = np.clip(out[lit, :3] * (1 - mix[lit]) + col[None, :] * mix[lit], 0, 255).astype(np.uint8)
        for fn in self.post:
            fn(out)
        return out


# ------------------------------------------------------------------ reusable parts -------
def typed_lines(ic, x0, x1, ys, ramp='paper', lum=.38, seed=0, indent=None):
    rng = np.random.default_rng(seed)
    for k, y in enumerate(ys):
        x = x0 + (indent[k] if indent else 0)
        end = x1 - int(rng.integers(0, 3))
        while x <= end:
            n = int(rng.integers(1, 4))
            xe = min(end, x + n - 1)
            ic.paint(ic.rect(x, y, xe, y), ramp, lum, bevel=None)
            x = xe + 2


def scribble(ic, x0, x1, y, ramp, lum, seed=0):
    """Handwriting: a wavy broken stroke."""
    rng = np.random.default_rng(seed)
    pts = []
    x = x0
    while x <= x1:
        if rng.random() < .82:
            dy = int(rng.integers(-1, 1)) if (x % 3 == 0) else 0
            pts.append((x, y + dy))
        x += 1
    ic.px(pts, ramp, lum)


def evidence_mark(ic, x=17, y=2):
    """Brass 'important' glint: a small four-point sparkle (drawn after the outline)."""
    def fn(out):
        gold = EC.hexrgb('#f6d66e')
        hot = EC.hexrgb('#fffbe0')
        dark = EC.hexrgb('#2a1a06')
        arms = [(x, y - 1), (x, y + 1), (x - 1, y), (x + 1, y)]
        tips = [(x, y - 2), (x, y + 2), (x - 2, y), (x + 2, y)]
        ring = set()
        for (px_, py_) in arms + tips + [(x, y)]:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ring.add((px_ + dx, py_ + dy))
        ring -= set(arms + tips + [(x, y)])
        for (px_, py_) in ring:
            if 0 <= px_ < W and 0 <= py_ < H and out[py_, px_, 3] == 0:
                out[py_, px_] = (*dark, 200)
        for (px_, py_) in tips:
            if 0 <= px_ < W and 0 <= py_ < H:
                out[py_, px_] = (*gold, 255)
        for (px_, py_) in arms:
            if 0 <= px_ < W and 0 <= py_ < H:
                out[py_, px_] = (*gold, 255)
        out[y, x] = (*hot, 255)
    ic.post.append(fn)


# =========================================================================================
#                                           ICONS
# =========================================================================================
ICONS = {}


def icon(name, evidence=False):
    def deco(fn):
        ICONS[name] = (fn, evidence)
        return fn
    return deco


# ------------------------------------------------------------------ chapter 1 ------------
@icon('newspaper')
def _newspaper(ic):
    # folded broadsheet: left half lit, right half turned slightly away
    back = ic.rect(4, 4, 18, 17)
    ic.paint(back, 'paper', .5, bevel=(.05, .1))
    left = ic.rect(2, 2, 9, 16)
    right = ic.rect(10, 2, 16, 16)
    ic.paint(left, 'paper', lin(.86, .06), bevel=(.08, .1))
    ic.paint(right, 'paper', lin(.74, .05), bevel=(.04, .1))
    ic.paint(ic.rect(10, 2, 10, 16), 'paper', .6, bevel=None)       # the fold
    # masthead (blackletter-ish) across both halves
    ic.px([(x, 4) for x in range(4, 16) if x not in (7, 11)], 'ink', .2)
    ic.px([(4, 3), (8, 3), (12, 3), (15, 3), (6, 5), (13, 5)], 'ink', .25)
    ic.paint(ic.rect(3, 7, 15, 7), 'paper', .45, bevel=None)       # rule
    # headline
    ic.px([(x, 9) for x in range(4, 9)] + [(x, 9) for x in range(11, 15)], 'ink', .35)
    # photo block on the right
    ic.paint(ic.rect(11, 11, 15, 14), 'slate', lin(.4, .1), bevel=None)
    ic.px([(12, 12), (13, 12)], 'slate', .75)
    # columns
    typed_lines(ic, 4, 8, [11, 13, 15], 'paper', .45, seed=3)
    typed_lines(ic, 11, 15, [16], 'paper', .42, seed=5)


@icon('hanger')
def _hanger(ic):
    hook = ic.pix([(8, 3), (9, 2), (10, 2), (11, 2), (12, 3), (12, 4), (11, 5), (10, 6)])
    neck = ic.pix([(10, 7), (10, 8)])
    body = ic.line((10, 8), (2, 14)) | ic.line((10, 8), (17, 14)) | ic.line((2, 15), (17, 15)) | ic.pix([(2, 15), (17, 15)])
    ic.paint(body, 'chrome', .55, bevel=None)
    # light the upper-left facing wire
    ic.paint(ic.line((9, 9), (2, 14)), 'chrome', .78, bevel=None)
    ic.paint(ic.line((11, 9), (17, 14)), 'chrome', .5, bevel=None)
    ic.paint(ic.line((3, 15), (16, 15)), 'chrome', .6, bevel=None)
    ic.paint(hook, 'chrome', .7, bevel=None)
    ic.px([(9, 2), (10, 2)], 'chrome', .95)
    ic.px([(12, 4), (11, 5)], 'chrome', .45)
    ic.paint(neck, 'chrome', .4, bevel=None)
    ic.px([(10, 7)], 'chrome', .85)
    ic.px([(5, 12), (13, 15)], 'chrome', 1.0)


@icon('wire')
def _wire(ic):
    # the hanger, unwound: a long stiff wire with the old twist kinked in the middle and a
    # little pick-bend at the tip
    ic.paint(ic.line((2, 18), (8, 12)), 'chrome', .6, bevel=None)
    ic.paint(ic.line((11, 9), (16, 4)), 'chrome', .6, bevel=None)
    twist = ic.pix([(9, 12), (9, 11), (10, 11), (10, 10), (11, 10), (12, 9)])
    ic.paint(twist, 'chrome', .5, bevel=None)
    ic.px([(9, 11), (10, 10)], 'chrome', .95)
    ic.px([(8, 12), (11, 9)], 'chrome', .35)
    tip = ic.pix([(17, 4), (18, 4), (18, 5)])
    ic.paint(tip, 'chrome', .75, bevel=None)
    ic.px([(4, 16), (13, 7), (15, 5)], 'chrome', .92)
    ic.px([(2, 18)], 'chrome', .35)


@icon('loupe')
def _loupe(ic):
    # a brass ring on a short handle, with the cord looped over the top
    import math
    ring = [(round(9 + 5 * math.cos(math.radians(a))), round(8 + 5 * math.sin(math.radians(a)))) for a in range(0, 360, 5)]
    lens = ic.ell(9, 8, 3, 3)
    ic.paint(ic.pix(ring), 'brass', .7, bevel=None)
    ic.paint(lens, 'chrome', .35, bevel=None)
    ic.paint(ic.line((13, 12), (18, 17)), 'brass', .55, bevel=None)
    ic.px([(4, 4), (3, 3)], 'brass', .9)


@icon('sleep_draught')
def _sleep_draught(ic):
    # a tin cup with the water clouded by the crushed pills
    ic.paint(ic.poly([(4, 5), (16, 5), (14, 18), (6, 18)]), 'steel', .6, bevel=None)
    ic.paint(ic.poly([(6, 9), (14, 9), (13, 16), (7, 16)]), 'cream', .45, bevel=None)
    ic.px([(8, 11), (11, 13), (12, 11)], 'white', .9)


@icon('ring_keys')
def _ring_keys(ic):
    # a brass split ring with a key hanging off it
    import math
    ring = [(round(8 + 5 * math.cos(math.radians(a))), round(7 + 5 * math.sin(math.radians(a)))) for a in range(0, 360, 5)]
    ic.paint(ic.pix(ring), 'brass', .7, bevel=None)
    ic.paint(ic.line((11, 11), (17, 17)), 'brass', .6, bevel=None)
    ic.paint(ic.line((15, 15), (18, 13)), 'brass', .6, bevel=None)


@icon('pencil')
def _pencil(ic):
    # a stub of carpenter's pencil, chewed at one end
    ic.paint(ic.line((4, 16), (15, 5)), 'paper', .7, bevel=None)
    ic.paint(ic.line((5, 15), (14, 6)), 'brass', .55, bevel=None)
    ic.paint(ic.line((15, 5), (17, 3)), 'red', .6, bevel=None)


@icon('cigarette_paper')
def _cigarette_paper(ic):
    # a folded cigarette paper
    ic.paint(ic.poly([(4, 6), (16, 5), (15, 15), (5, 16)]), 'cream', .6, bevel=None)
    ic.paint(ic.line((5, 9), (14, 8)), 'paper', .35, bevel=None)


@icon('pruitt_note')
def _pruitt_note(ic):
    # the note: capitals on a folded paper
    ic.paint(ic.poly([(3, 4), (17, 4), (16, 16), (4, 16)]), 'cream', .7, bevel=None)
    ic.paint(ic.line((5, 8), (15, 8)), 'black', .5, bevel=None)
    ic.paint(ic.line((5, 12), (13, 12)), 'black', .5, bevel=None)


@icon('blank_form')
def _blank_form(ic):
    # an empty accreditation form with a header line and a stamp box
    ic.paint(ic.poly([(3, 3), (17, 3), (17, 17), (3, 17)]), 'cream', .6, bevel=None)
    ic.paint(ic.line((5, 6), (15, 6)), 'black', .45, bevel=None)
    ic.paint(ic.line((5, 10), (12, 10)), 'paper', .3, bevel=None)


@icon('rubber_stamp')
def _rubber_stamp(ic):
    # a wooden-handled rubber stamp
    ic.paint(ic.poly([(6, 3), (14, 3), (14, 8), (6, 8)]), 'brass', .5, bevel=None)
    ic.paint(ic.line((10, 8), (10, 14)), 'brass', .5, bevel=None)
    ic.paint(ic.poly([(6, 14), (14, 14), (14, 17), (6, 17)]), 'red', .6, bevel=None)


@icon('key9')
def _key9(ic):
    # wooden fob (left), brass ring (top), brass key hanging (right)
    tag = ic.poly([(2, 7), (4, 5), (8, 5), (9, 7), (9, 16), (7, 18), (4, 18), (2, 16)])
    ic.paint(tag, 'oak', lin(.62, .1), bevel=(.12, .14))
    ic.px([(3, 9), (3, 12), (8, 14)], 'oak', .5)       # grain
    ic.px([(5, 7)], 'wood', .1)                        # hole
    nine = ic.digit(4, 10, '9')
    ic.paint(nine, 'wood', .12, bevel=None)
    ring = ic.ell(8.5, 4.5, 2.6, 2.6) & ~ic.ell(8.5, 4.5, 1.4, 1.4)
    ic.paint(ring, 'brass', sph(8.5, 4.5, 2.6, .35, .95), bevel=None, sep=.4)
    # key
    bow = ic.ell(13.5, 6.5, 2.8, 2.5) & ~ic.ell(13.5, 6.5, 1.0, 0.9)
    ic.paint(bow, 'brass', sph(13.5, 6.5, 2.8, .35, .95), bevel=(.05, .1), sep=.35)
    shaft = ic.rect(13, 9, 14, 18)
    ic.paint(shaft, 'brass', cyl(13, 9, 13, 18, 1.4, .35, .9), bevel=None)
    ic.paint(ic.rect(12, 10, 15, 10), 'brass', .55, bevel=None)   # collar
    bit = ic.rows(15, 13, ['##', '#.', '##', '##', '#.', '#.'])
    ic.paint(bit, 'brass', .55, bevel=(.1, .1))
    ic.px([(13, 11), (13, 12)], 'brass', .95)


@icon('lighter')
def _lighter(ic):
    front = ic.poly([(4, 3), (12, 3), (13, 4), (13, 17), (12, 18), (5, 18), (4, 17)])
    side = ic.rect(14, 4, 15, 17) | ic.pix([(14, 3)]) | ic.pix([(14, 18)])

    def brushed(X, Y):
        xs = np.floor(X - 4).astype(int)
        band = np.array([.62, .9, 1.0, .82, .66, .55, .5, .58, .7, .48], np.float32)
        return band[np.clip(xs, 0, 9)] - (Y - 3) * .006
    ic.paint(front, 'chrome', brushed, bevel=(.04, .1))
    ic.paint(side, 'chrome', lambda X, Y: .36 - (X - 14) * .08, bevel=None)
    # lid seam + hinge
    ic.paint(ic.rect(4, 7, 13, 7), 'chrome', .25, bevel=None)
    ic.px([(14, 6), (14, 8)], 'chrome', .7)
    ic.px([(15, 6), (15, 8)], 'chrome', .5)
    ic.px([(14, 7), (15, 7)], 'chrome', .2)
    # lid top highlight
    ic.paint(ic.rect(5, 3, 11, 3), 'chrome', .95, bevel=None)
    # engraving (a script flourish)
    ic.px([(6, 11), (7, 10), (8, 11), (9, 11), (10, 10), (7, 13), (8, 13), (9, 14), (10, 13)], 'chrome', .32)
    ic.px([(5, 9), (5, 10)], 'chrome', 1.0)


@icon('matchbook')
def _matchbook(ic):
    # open matchbook: cover flipped up (inside: my scrawl), comb of matches, navy base flap
    cover = ic.poly([(3, 1), (16, 1), (16, 8), (3, 8)])
    ic.paint(cover, 'cream', lin(.72, .06), bevel=(.08, .1))
    scribble(ic, 5, 9, 4, 'denim', .45, seed=4)
    scribble(ic, 10, 14, 4, 'denim', .45, seed=9)
    ic.px([(5, 6), (6, 6), (7, 6)], 'denim', .5)
    # match comb: sticks + red heads
    sticks = ic.rect(3, 10, 16, 12)
    ic.paint(sticks, 'cream', .6, bevel=None)
    for x in range(3, 17):
        if x % 2 == 1:
            ic.px([(x, 10), (x, 11)], 'cream', .85)
        else:
            ic.px([(x, 10), (x, 11), (x, 12)], 'cream', .45)
    heads = ic.empty()
    for x in range(3, 17, 2):
        heads |= ic.pix([(x, 9), (x, 8)])
    ic.paint(heads, 'red', .75, bevel=None)
    for x in range(3, 17, 2):
        ic.px([(x, 8)], 'neonred', .82)
    # navy base panel with the Blue Lantern mark + striker
    base = ic.rect(2, 12, 17, 18)
    ic.paint(base, 'neonblue', lin(.42, .06), bevel=(.12, .1), sep=.4)
    ic.paint(ic.rect(9, 13, 10, 15), 'lamp', .85, bevel=None, emis=.5)    # the little lantern
    ic.px([(9, 13), (10, 13)], 'neonblue', .75)
    ic.px([(8, 14), (11, 14)], 'neonblue', .65)
    ic.paint(ic.rect(2, 17, 17, 18), 'rust', lambda X, Y: .3 + .15 * ((X.astype(int) % 2) == 0), bevel=None)
    ic.px([(5, 13), (14, 13)], 'chrome', .85)     # staple


@icon('pocketbook')
def _pocketbook(ic):
    pages = ic.poly([(5, 4), (16, 4), (17, 5), (17, 18), (6, 18)])
    ic.paint(pages, 'paper', .78, bevel=(.05, .1))
    for y in range(6, 18, 2):
        ic.px([(17, y)], 'paper', .55)
    ic.px([(x, 18) for x in range(7, 17, 2)], 'paper', .55)
    cover = ic.poly([(3, 2), (14, 2), (15, 3), (15, 16), (14, 17), (3, 17)])
    ic.paint(cover, 'e_leather', lin(.42, .1), bevel=(.2, .12))
    # spine
    ic.paint(ic.rect(3, 2, 4, 17), 'e_leather', .3, bevel=None)
    ic.px([(4, y) for y in range(3, 17, 3)], 'e_leather', .5)
    # elastic strap
    ic.paint(ic.rect(12, 2, 12, 17), 'black', .5, bevel=None)
    ic.px([(12, 3)], 'slate', .45)
    # torn page stubs sticking out at the top
    ic.paint(ic.pix([(7, 1), (8, 1), (10, 1)]), 'paper', .9, bevel=None)
    # blind-stamped initials
    ic.px([(7, 7), (8, 7), (9, 7)], 'e_leather', .6)
    ic.px([(7, 8)], 'e_leather', .25)


@icon('apt_key')
def _apt_key(ic):
    # Nora's Yale latchkey (steel) with a red ribbon bow tied through the head
    head = ic.ell(8.0, 7.5, 3.6, 3.6)
    ic.paint(head, 'chrome', sph(8.0, 7.5, 3.6, .38, 1.0), bevel=(.06, .12))
    ic.paint(ic.pix([(7, 6), (6, 6)]), 'black', .15, bevel=None)
    blade = ic.poly([(10, 9), (11, 8), (18, 15), (18, 16), (16, 17), (9, 11)])
    ic.paint(blade, 'chrome', cyl(10, 10, 17, 16, 1.6, .38, .92), bevel=(.04, .1), sep=.3)
    for (x, y) in ((11, 12), (13, 14), (15, 16)):
        ic.c.rid[y, x] = -1
    ic.px([(12, 10), (14, 12), (16, 14)], 'chrome', 1.0)
    bow = ic.rows(1, 1, ['.##.##.',
                         '#..#..#',
                         '.##.##.',
                         '..#.#..',
                         '.#...#.',
                         '#.....#'])
    ic.paint(bow, 'neonred', .55, bevel=None, sep=.35)
    ic.px([(2, 1), (5, 1), (1, 2), (4, 2)], 'neonred', .8)
    ic.px([(4, 3)], 'red', .45)
    ic.px([(1, 6), (7, 6)], 'red', .55)


@icon('nora_photo')
def _nora_photo(ic):
    card = ic.poly([(3, 1), (17, 2), (16, 18), (2, 17)])
    ic.paint(card, 'white', lin(.86, .05), bevel=(.05, .1))
    img = ic.poly([(4, 3), (15, 4), (14, 15), (3, 14)])
    ic.paint(img, 'e_sepia', lambda X, Y: .62 - (Y - 3) * .012 - (X - 4) * .01, bevel=None)
    # hair framing the face
    hair = ic.rows(5, 4, ['..####...',
                          '.######..',
                          '########.',
                          '###..###.',
                          '##....##.',
                          '##....##.',
                          '##....###',
                          '.#.....##',
                          '.......##'])
    ic.paint(hair, 'e_sepia', .12, bevel=None)
    face = ic.rows(7, 7, ['####', '####', '####', '####', '.##.'])
    ic.paint(face, 'e_sepia', lambda X, Y: .86 - (X - 7) * .05, bevel=None)
    ic.px([(7, 8), (9, 8)], 'e_sepia', .1)     # eyes
    ic.px([(8, 10)], 'e_sepia', .6)            # nose shadow
    ic.px([(8, 11)], 'e_sepia', .35)           # lips
    # coat collar + shoulders
    sh = ic.rows(4, 12, ['...#...##.', '.#####.###', '##########'])
    ic.paint(sh & img, 'e_sepia', .25, bevel=None)
    ic.px([(8, 12)], 'e_sepia', .75)           # pale throat/blouse
    # bent corner
    ic.paint(ic.pix([(16, 16), (15, 17), (16, 17)]), 'white', .55, bevel=None)


@icon('retainer')
def _retainer(ic):
    def bill(x0, y0, l, k):
        b = ic.rect(x0, y0, x0 + 12, y0 + 6)
        ic.paint(b, 'e_money', lin(l, .05), bevel=(.1, .12), sep=.45)
        ic.paint(ic.rect(x0 + 1, y0 + 1, x0 + 11, y0 + 1) | ic.rect(x0 + 1, y0 + 5, x0 + 11, y0 + 5)
                 | ic.rect(x0 + 1, y0 + 1, x0 + 1, y0 + 5) | ic.rect(x0 + 11, y0 + 1, x0 + 11, y0 + 5),
                 'e_money', l - .2, bevel=None)
        oval = ic.ell(x0 + 6.5, y0 + 3.5, 2.2, 1.8)
        ic.paint(oval, 'e_money', l - .3, bevel=None)
        ic.px([(x0 + 6, y0 + 3)], 'e_money', l + .05)
        ic.px([(x0 + 2, y0 + 2), (x0 + 10, y0 + 4)], 'e_money', k)
    bill(1, 3, .72, .35)
    bill(4, 7, .68, .3)
    bill(6, 11, .78, .35)
    # paper band
    ic.paint(ic.rect(10, 10, 11, 18), 'paper', .82, bevel=(.05, .1), sep=.3)


@icon('carbon')
def _carbon(ic):
    sheet = ic.poly([(2, 3), (13, 2), (17, 2), (17, 17), (3, 18)])
    ic.paint(sheet, 'denim', lin(.2, .06), bevel=(.25, .05))
    # backwards ghost typing
    rng = np.random.default_rng(5)
    for y in range(5, 17, 2):
        for x in range(4, 16):
            if rng.random() < .55:
                ic.px([(x, y)], 'denim', .42)
    # curled corner (matte back of the sheet)
    curl = ic.poly([(12, 2), (17, 2), (17, 7)])
    ic.paint(curl, 'slate', lin(.55, .1), bevel=(.1, .1), sep=.3)
    ic.px([(13, 2), (14, 2)], 'slate', .8)


# ------------------------------------------------------------------ chapter 2 ------------
@icon('ice_pick')
def _ice_pick(ic):
    handle = ic.poly([(1, 16), (2, 14), (6, 10), (8, 10), (10, 12), (10, 13), (5, 18), (3, 19), (1, 18)])
    ic.paint(handle, 'oak', cyl(2, 18, 9, 11, 2.6, .3, .82), bevel=(.04, .1))
    ic.px([(3, 16), (5, 14), (7, 12)], 'oak', .45)                     # grain
    ic.px([(2, 15), (4, 13)], 'oak', .9)
    ferrule = ic.pix([(8, 9), (9, 9), (9, 10), (10, 10), (10, 11), (11, 11)])
    ic.paint(ferrule, 'chrome', .8, bevel=None, sep=.35)
    ic.px([(8, 9), (9, 9)], 'chrome', 1.0)
    spike = ic.line((10, 9), (17, 2))
    ic.paint(spike, 'chrome', .78, bevel=None)
    ic.paint(ic.line((11, 9), (17, 3)), 'chrome', .42, bevel=None)
    ic.px([(18, 1)], 'chrome', .7)
    # frost
    ic.px([(12, 7), (14, 5), (16, 3), (2, 17), (6, 15), (8, 11)], 'ice', .98)
    ic.px([(13, 7), (15, 5)], 'ice', .75)


@icon('rock_salt')
def _rock_salt(ic):
    paper = ic.poly([(1, 13), (6, 10), (15, 10), (19, 14), (16, 18), (3, 18)])
    ic.paint(paper, 'e_manila', lin(.5, .08), bevel=(.1, .12))
    ic.px([(5, 17), (9, 17), (14, 17)], 'e_manila', .3)
    crystals = [(9, 4, 3, 3), (6, 6, 3, 3), (11, 6, 3, 3), (4, 9, 3, 3), (8, 8, 3, 3), (12, 9, 3, 2),
                (14, 8, 3, 3), (6, 11, 3, 3), (10, 11, 3, 3), (14, 12, 3, 2), (3, 12, 2, 2), (8, 13, 3, 2),
                (12, 13, 2, 2), (16, 12, 2, 2)]
    for i, (x, y, w, h) in enumerate(crystals):
        m = ic.rect(x, y, x + w - 1, y + h - 1)
        if (i % 3) == 0:
            m &= ~ic.pix([(x + w - 1, y)])
        if (i % 4) == 1:
            m &= ~ic.pix([(x, y + h - 1)])
        ic.paint(m, 'ice', .62 + .08 * ((i * 7) % 3), bevel=(.25, .22), sep=.25)
    ic.px([(9, 4), (6, 6), (11, 6), (14, 8)], 'white', 1.0)


@icon('release_handle')
def _release_handle(ic):
    grip = ic.poly([(2, 4), (3, 3), (16, 3), (17, 4), (17, 6), (16, 7), (3, 7), (2, 6)])
    ic.paint(grip, 'steel', cyl(2, 5, 17, 5, 2.2, .25, .8), bevel=(.05, .08))
    stem = ic.rect(8, 7, 11, 14)
    ic.paint(stem, 'steel', cyl(9.5, 7, 9.5, 14, 2, .25, .78), bevel=None, sep=.4)
    sock = ic.rect(6, 13, 13, 18)
    ic.paint(sock, 'steel', lin(.45, .1), bevel=(.15, .12), sep=.4)
    ic.paint(ic.rect(8, 15, 11, 17), 'black', .15, bevel=None)      # the square socket
    ic.px([(8, 15), (9, 15), (10, 15)], 'black', .5)
    # rust
    ic.px([(4, 6), (14, 6), (10, 12), (12, 18), (6, 17)], 'rust', .45)
    ic.px([(15, 5), (7, 14)], 'rust', .6)
    ic.px([(5, 4), (9, 8)], 'steel', 1.0)


def _transcript_page(ic, num, x0=3, y0=1, x1=14, y1=18, seed=0, lines=(5, 7, 9, 11, 13, 15)):
    page = ic.poly([(x0, y0), (x1, y0), (x1 + 1, y0 + 1), (x1 + 1, y1), (x0, y1)])
    ic.paint(page, 'paper', lin(.9, .04), bevel=(.05, .1))
    ic.paint(ic.rect(x0 + 1, y0 + 2, x0 + 6, y0 + 2), 'ink', .3, bevel=None)     # heading
    typed_lines(ic, x0 + 1, x1 - 1, [y for y in lines if y <= y1 - 2], 'paper', .4, seed=seed,
                indent=[4 if y < y0 + 8 else 0 for y in lines])
    # page number, written large in red pencil in the corner
    n = ic.digit(x1 - 3, y0 + 2, str(num))
    ic.paint(n, 'e_redink', .72, bevel=None)
    return page


@icon('minutes1', evidence=True)
def _minutes1(ic):
    _transcript_page(ic, 1, y1=12, seed=11, lines=(5, 7, 9, 11))
    # oilskin packet folded around the bottom of the page
    pk = ic.poly([(1, 10), (16, 9), (17, 17), (15, 18), (1, 18)])
    ic.paint(pk, 'e_oilskin', lin(.6, .1), bevel=(.15, .12), sep=.45)
    ic.paint(ic.line((2, 11), (9, 14), (16, 10)), 'e_oilskin', .36, bevel=None)    # flap fold
    ic.px([(3, 11), (4, 12), (14, 11)], 'e_oilskin', .85)
    ic.px([(6, 16), (11, 17), (15, 15)], 'e_oilskin', .8)
    ic.px([(9, 15)], 'e_oilskin', .3)


@icon('minutes2', evidence=True)
def _minutes2(ic):
    # folded small: the page shows its fold creases, number 2
    page = _transcript_page(ic, 2, seed=21)
    crease_h = ic.rect(3, 10, 15, 10) & page
    crease_v = ic.rect(9, 1, 9, 18) & page
    ic.paint(crease_h, 'paper', .55, bevel=None)
    ic.paint(crease_v & ~ic.rect(0, 0, 19, 4), 'paper', .62, bevel=None)
    # lower half turned away from the light, upper-right quarter lifted
    ic.darken(ic.rect(3, 11, 15, 18) & page & ~crease_h, .82)
    ic.darken(ic.rect(10, 11, 15, 18) & page, .9)
    ic.lighten(ic.rect(3, 9, 15, 9) & page, .08)


@icon('minutes3', evidence=True)
def _minutes3(ic):
    back = ic.poly([(5, 2), (16, 2), (17, 17), (6, 18)])
    ic.paint(back, 'paper', .58, bevel=(.04, .1))
    _transcript_page(ic, 3, x0=2, x1=13, seed=61, lines=(5, 7, 9, 11, 13))
    # the names, underlined twice in red pencil
    ic.px([(4, 15), (5, 15), (6, 15), (8, 15), (9, 15), (10, 15), (11, 15)], 'ink', .25)
    ic.paint(ic.rect(3, 16, 12, 16), 'e_redink', .72, bevel=None)
    ic.px([(4, 17), (5, 17), (7, 17), (8, 17), (10, 17)], 'e_redink', .6)


@icon('vial', evidence=True)
def _vial(ic):
    glass = ic.poly([(6, 5), (13, 5), (13, 17), (12, 18), (7, 18), (6, 17)])
    ic.paint(glass, 'ice', cyl(6, 12, 13, 12, 3.4, .45, .85), bevel=None)
    air = ic.rect(7, 5, 12, 8)
    ic.paint(air, 'ice', cyl(6, 12, 13, 12, 3.4, .3, .6), bevel=None)
    liquid = ic.rect(7, 9, 12, 17) & glass
    ic.paint(liquid, 'ice', cyl(6, 12, 13, 12, 3.4, .62, 1.0), bevel=None)
    ic.paint(ic.rect(7, 9, 12, 9), 'white', .9, bevel=None)              # meniscus
    ic.paint(ic.rect(7, 6, 7, 17), 'white', .98, bevel=None)             # glint
    # grey rubber stopper, rounded, seated in the neck
    st = ic.rect(7, 1, 12, 5) & ~ic.pix([(7, 1), (12, 1)])
    ic.paint(st, 'slate', cyl(7, 3, 12, 3, 2.8, .35, .85), bevel=(.05, .1), sep=.3)
    ic.paint(ic.rect(8, 5, 11, 5), 'slate', .3, bevel=None)
    # label with a red band
    lab = ic.rect(6, 11, 13, 15)
    ic.paint(lab, 'paper', lin(.86, .05), bevel=(.05, .1))
    ic.paint(ic.rect(6, 11, 13, 11), 'e_redink', .75, bevel=None)
    l7 = ic.rows(8, 12, ['#.###', '#...#', '#..#.', '##.#.'])          # 'L7'
    ic.paint(l7, 'e_redink', .45, bevel=None)


@icon('press_card')
def _press_card(ic):
    card = ic.poly([(1, 4), (18, 4), (18, 16), (1, 16)])
    ic.paint(card, 'cream', lin(.82, .05), bevel=(.06, .12))
    ic.paint(ic.rect(1, 4, 18, 6), 'red', lin(.6, .05), bevel=(.12, .02))
    # 'PRESS' knocked out of the band
    ic.px([(4, 5), (6, 5), (8, 5), (10, 5), (12, 5), (14, 5), (15, 5)], 'cream', .9)
    # photo
    ph = ic.rect(3, 8, 7, 14)
    ic.paint(ph, 'slate', .65, bevel=None)
    ic.paint(ic.rows(3, 9, ['.###.', '.###.', '..#..', '#####', '#####', '#####'], '#') & ph, 'slate', .3, bevel=None)
    ic.paint(ic.rows(4, 9, ['###', '###']), 'skin', .75, bevel=None)
    ic.px([(4, 9), (6, 9)], 'skin', .5)
    typed_lines(ic, 9, 16, [8, 10, 12], 'cream', .4, seed=31)
    ic.paint(ic.rect(9, 14, 13, 14), 'denim', .45, bevel=None)       # signature
    ic.px([(15, 14), (16, 13)], 'red', .55)                          # number stamp


@icon('pike_camera')
def _pike_camera(ic):
    body = ic.poly([(1, 6), (18, 6), (18, 15), (1, 15)])
    ic.paint(body, 'black', lin(.6, .1), bevel=(.35, .05))
    # leatherette texture
    for y in range(8, 15, 2):
        ic.px([(x, y) for x in range(2, 18, 3)], 'black', .2)
    # chrome top plate + viewfinder + shutter button
    ic.paint(ic.rect(1, 5, 18, 6), 'chrome', lin(.75, .1), bevel=(.15, .1))
    ic.paint(ic.rect(2, 3, 5, 4), 'chrome', lin(.6, .1), bevel=(.2, .1))
    ic.px([(3, 4)], 'glass', .8)
    ic.paint(ic.rect(15, 3, 16, 4), 'chrome', .8, bevel=(.1, .2))
    # bellows square + lens
    bel = ic.rect(6, 7, 13, 14)
    ic.paint(bel, 'black', .5, bevel=None)
    ic.paint(ic.rect(7, 8, 12, 13), 'black', .3, bevel=None)
    ic.paint(ic.rect(6, 7, 13, 7) | ic.rect(6, 7, 6, 14), 'black', .75, bevel=None)
    rim = ic.ell(9.5, 10.5, 3.2, 3.2) & ~ic.ell(9.5, 10.5, 2.0, 2.0)
    ic.paint(rim, 'chrome', sph(9.5, 10.5, 3.2, .3, 1.0), bevel=None)
    glass = ic.ell(9.5, 10.5, 2.0, 2.0)
    ic.paint(glass, 'glass', sph(9.5, 10.5, 2.0, .05, .5), bevel=None)
    ic.px([(9, 9)], 'white', .95)
    ic.px([(10, 11)], 'neonblue', .5)
    # counter window
    ic.px([(16, 9)], 'lamp', .7, emis=.5)
    ic.px([(16, 8), (15, 9)], 'chrome', .6)


# ------------------------------------------------------------------ chapter 3 ------------
@icon('negatives')
def _negatives(ic):
    strip = ic.poly([(1, 6), (18, 4), (18, 13), (1, 15)])
    ic.paint(strip, 'e_amber', lambda X, Y: .3 + .04 * (10 - X) / 10, bevel=(.12, .05))
    # sprocket holes along both edges
    for x in range(2, 18, 2):
        yt = int(6 - x * 2 / 19) + 1
        yb = int(15 - x * 2 / 19) - 1
        ic.px([(x, yt), (x, yb)], 'e_amber', .7)
    # two frames with inverted images
    f1 = ic.poly([(2, 8), (9, 7), (9, 12), (2, 13)])
    f2 = ic.poly([(11, 7), (18, 6), (18, 11), (11, 12)])
    ic.paint(f1, 'e_amber', .55, bevel=None)
    ic.paint(f2, 'e_amber', .5, bevel=None)
    ic.paint(ic.rect(4, 8, 7, 11) & f1, 'e_amber', .15, bevel=None)      # a bright building -> dark
    ic.px([(5, 9), (6, 10)], 'e_amber', .4)
    ic.paint(ic.rect(13, 8, 14, 11) & f2, 'e_amber', .18, bevel=None)    # two figures
    ic.paint(ic.rect(16, 8, 17, 11) & f2, 'e_amber', .12, bevel=None)
    ic.px([(15, 9)], 'e_amber', .85)
    # light catching the base
    ic.px([(2, 7), (10, 6), (17, 5)], 'e_amber', .9)


@icon('contact_sheet', evidence=True)
def _contact_sheet(ic):
    sh = ic.rect(2, 1, 15, 18)
    ic.paint(sh, 'white', lin(.88, .05), bevel=(.05, .1))
    for row, y in enumerate((3, 8, 13)):
        strip = ic.rect(3, y, 14, y + 3)
        ic.paint(strip, 'black', .4, bevel=None)
        for k, x in enumerate((4, 9)):
            ic.paint(ic.rect(x, y + 1, x + 3, y + 2), 'e_sepia', .55 + .12 * ((row + k) % 2), bevel=None)
            ic.px([(x + (row + k) % 3, y + 2)], 'e_sepia', .15)
            ic.px([(x + 3, y + 1)], 'e_sepia', .95)
        ic.px([(x, y) for x in range(4, 14, 2)] + [(x, y + 3) for x in range(4, 14, 2)], 'black', .7)
    # grease-pencil ring around one frame
    ic.px([(8, 7), (13, 7), (8, 12), (13, 12)], 'e_redink', .8)


@icon('padlock_key')
def _padlock_key(ic):
    # small steel key on a loop of twine
    string = ic.line((4, 1), (2, 3), (2, 6), (5, 8)) | ic.line((4, 1), (6, 2), (7, 5))
    ic.paint(string, 'oak', .72, bevel=None)
    ic.px([(2, 4), (3, 7)], 'oak', .5)
    bow = ic.ell(8.5, 8.0, 2.9, 2.9) & ~ic.ell(8.5, 8.0, 1.1, 1.1)
    ic.paint(bow, 'steel', sph(8.5, 8, 2.9, .38, 1.0), bevel=(.05, .1), sep=.3)
    blade = ic.poly([(10, 10), (11, 9), (17, 15), (16, 16)])
    ic.paint(blade, 'steel', cyl(10, 10, 16, 16, 1.2, .45, .98), bevel=None)
    ic.paint(ic.pix([(15, 16), (14, 15), (16, 17), (13, 14)]), 'steel', .55, bevel=None)
    ic.px([(12, 11), (14, 13)], 'steel', 1.0)


@icon('steno_pad', evidence=True)
def _steno_pad(ic):
    back = ic.rect(3, 3, 15, 18)
    ic.paint(back, 'e_tan', .45, bevel=(.05, .1))
    page = ic.rect(2, 3, 14, 17)
    ic.paint(page, 'e_steno', lin(.88, .04), bevel=(.06, .1))
    ic.paint(ic.rect(8, 4, 8, 17), 'e_redink', .62, bevel=None)       # centre rule
    # flowing Pitman outlines: thin strokes and hooks, two columns
    strokes = [[(3, 6), (4, 5), (5, 5)], [(6, 6), (6, 7)],
               [(10, 5), (11, 6), (12, 6)], [(13, 5)],
               [(3, 9), (4, 9), (5, 10)], [(10, 9), (11, 8)], [(12, 9), (13, 9)],
               [(4, 12), (5, 13)], [(6, 12)], [(10, 12), (11, 12), (12, 13)],
               [(3, 15), (4, 15)], [(5, 14), (6, 15)], [(11, 15), (12, 14), (13, 14)]]
    for st in strokes:
        ic.px(st, 'denim', .35)
    # spiral binding along the top
    for x in range(3, 15, 2):
        ic.px([(x, 1), (x, 2)], 'chrome', .85)
        ic.px([(x, 3)], 'chrome', .35)


@icon('lockpicks')
def _lockpicks(ic):
    roll = ic.poly([(1, 9), (14, 9), (14, 17), (1, 17)])
    ic.paint(roll, 'e_leather', lin(.55, .08), bevel=(.15, .1))
    # the rolled-up end
    rr = ic.poly([(14, 7), (17, 7), (18, 8), (18, 17), (17, 18), (14, 18)])
    ic.paint(rr, 'e_leather', cyl(14, 12, 18, 12, 2.2, .25, .7), bevel=None, sep=.3)
    ic.px([(16, 7), (16, 12), (16, 17)], 'e_leather', .85)
    # stitched pockets
    for x in (4, 7, 10, 13):
        ic.px([(x, y) for y in range(10, 17, 2)], 'e_leather', .3)
    # picks
    picks = [(3, 3, 'hook'), (6, 2, 'rake'), (9, 4, 'diamond'), (12, 3, 'hook')]
    for (x, top, kind) in picks:
        m = ic.rect(x, top, x, 10)
        ic.paint(m, 'chrome', .78, bevel=None)
        if kind == 'hook':
            ic.px([(x - 1, top), (x - 1, top + 1)], 'chrome', .6)
        elif kind == 'rake':
            ic.px([(x - 1, top + 1), (x - 1, top + 3)], 'chrome', .6)
        else:
            ic.px([(x - 1, top + 1), (x + 1, top + 1)], 'chrome', .55)
        ic.px([(x, top)], 'chrome', 1.0)
    # tie
    ic.paint(ic.line((1, 13), (1, 15)), 'e_leather', .6, bevel=None)


# ------------------------------------------------------------------ chapter 4 ------------
def _spoon_body(ic, flat=False):
    cx, cy = 14.0, 5.6
    dx = ic.X - cx
    dy = ic.Y - cy
    a = (dx + dy) / math.sqrt(2)
    b = (dx - dy) / math.sqrt(2)
    rot = (a / 3.2) ** 2 + (b / 4.6) ** 2 <= 1.0
    ic.paint(rot, 'tile', sph(cx, cy, 4.2, .35, .85), bevel=(.12, .12))
    inner = ((a / 2.1) ** 2 + (b / 3.3) ** 2 <= 1.0)
    # concave: dark top-left, bright lower-right inside the bowl
    ic.paint(inner, 'tile', lambda X, Y: .45 + .06 * ((X - cx) + (Y - cy)), bevel=None)
    ic.px([(15, 7)], 'white', 1.0)
    if not flat:
        handle = ic.line((11, 9), (3, 17))
        ic.paint(handle, 'tile', .66, bevel=None)
        ic.paint(ic.line((10, 9), (3, 16)), 'tile', .82, bevel=None)
        end = ic.pix([(2, 17), (3, 18), (2, 18)])
        ic.paint(end, 'tile', .7, bevel=None)
    else:
        handle = ic.line((11, 9), (8, 12))
        ic.paint(handle, 'tile', .66, bevel=None)
        ic.paint(ic.line((10, 9), (8, 11)), 'tile', .82, bevel=None)
        # the end of the handle hammered flat and ground to a screwdriver blade
        blade = ic.poly([(6, 11), (9, 12), (4, 18), (1, 18), (1, 16)])
        ic.paint(blade, 'tile', lin(.62, .12), bevel=(.2, .15))
        ic.paint(ic.line((1, 17), (1, 18), (3, 18)), 'chrome', 1.0, bevel=None)   # bright ground edge
        ic.px([(3, 15), (4, 14), (5, 15)], 'tile', .38)                          # grinding scratches
        ic.px([(3, 16), (6, 13)], 'chrome', .95)
        ic.paint(ic.pix([(6, 18), (8, 17)]), 'chrome', .8, bevel=None)           # filings


@icon('spoon')
def _spoon(ic):
    _spoon_body(ic, flat=False)


@icon('flat_spoon')
def _flat_spoon(ic):
    _spoon_body(ic, flat=True)


@icon('cup')
def _cup(ic):
    body = ic.poly([(3, 6), (14, 6), (14, 16), (13, 18), (4, 18), (3, 16)])
    ic.paint(body, 'tile', cyl(3, 12, 14, 12, 5.6, .25, .78), bevel=None)
    ic.px([(5, 9), (5, 12), (5, 15)], 'tile', .9)
    ic.px([(11, 10), (12, 14)], 'tile', .3)
    # handle
    hd = ic.rows(14, 8, ['###', '..#', '..#', '..#', '###'])
    ic.paint(hd, 'tile', .5, bevel=None, sep=.0)
    ic.px([(15, 8), (16, 9)], 'tile', .75)
    # rim + water
    rim = ic.ell(8.5, 6.0, 5.6, 2.2)
    ic.paint(rim, 'tile', .9, bevel=None)
    water = ic.ell(8.5, 6.2, 4.6, 1.4)
    ic.paint(water, 'water', lambda X, Y: .55 + .06 * (X - 8.5) / 4, bevel=None)
    ic.px([(6, 6), (7, 6)], 'ice', .95)
    # dents
    ic.px([(9, 13), (10, 13)], 'tile', .42)


@icon('pills', evidence=True)
def _pills(ic):
    def pill(cx, cy, r):
        side = ic.ell(cx, cy + 1.4, r, r * .62)
        ic.paint(side, 'white', .45, bevel=None, sep=.4)
        top = ic.ell(cx, cy, r, r * .62)
        ic.paint(top, 'white', sph(cx, cy, r, .6, 1.0, ry=r * .62), bevel=(.08, .04))
        ic.paint(ic.line((cx - r + 2, cy), (cx + r - 2, cy)), 'white', .55, bevel=None)
    pill(7.0, 7.5, 5.2)
    pill(12.0, 12.5, 5.2)


@icon('matches')
def _matches(ic):
    # three matches in a twist of paper (a cone, twisted shut at the bottom)
    for (x0, y0, x1, y1) in ((8, 9, 5, 4), (10, 9, 10, 3), (12, 9, 15, 4)):
        ic.paint(ic.line((x0, y0), (x1, y1)), 'cream', .78, bevel=None)
    for (x, y) in ((4, 2), (9, 1), (15, 2)):
        ic.paint(ic.rect(x, y, x + 1, y + 2), 'red', .7, bevel=(.22, .15))
    cone = ic.poly([(3, 8), (17, 7), (13, 15), (11, 17), (9, 17)])
    ic.paint(cone, 'paper', lin(.84, .08), bevel=(.1, .14), sep=.3)
    ic.paint(ic.line((5, 9), (10, 15)), 'paper', .58, bevel=None)       # folds
    ic.paint(ic.line((12, 9), (11, 14)), 'paper', .62, bevel=None)
    ic.px([(4, 8), (6, 8), (8, 8)], 'paper', 1.0)
    tail = ic.pix([(10, 18), (9, 18), (11, 18)])
    ic.paint(tail, 'paper', .6, bevel=None)
    ic.px([(14, 9), (15, 9)], 'denim', .45)                             # pencil marks


def _straw_bundle(ic, ramp, damp=False):
    rng = np.random.default_rng(5)
    cx, cy = 9.5, 10.5
    n = 11
    for i in range(n):
        t = (i - (n - 1) / 2) / ((n - 1) / 2)          # -1 .. 1
        w = t * 1.2
        # waist point (perpendicular offset to the 45-degree axis)
        wx, wy = cx + w * .7, cy + w * .7
        a_top = math.radians(-45 + t * 32 + rng.uniform(-5, 5))
        a_bot = math.radians(135 - t * 30 + rng.uniform(-5, 5))
        rt = 9.5 + rng.uniform(-1.5, 1.0)
        rb = 8.5 + rng.uniform(-1.5, 1.0)
        top = (min(18, max(1, wx + math.cos(a_top) * rt)), min(18, max(1, wy + math.sin(a_top) * rt)))
        bot = (min(18, max(1, wx + math.cos(a_bot) * rb)), min(18, max(1, wy + math.sin(a_bot) * rb)))
        l = .5 + .4 * rng.random()
        ic.paint(ic.line(bot, (wx, wy), top), ramp, l, bevel=None)
    # twisted binding round the waist
    tie = ic.line((7, 11), (10, 8)) | ic.line((8, 12), (11, 9))
    ic.paint(tie, ramp, .25, bevel=None)
    ic.px([(8, 10), (10, 9)], ramp, .55)
    if damp:
        ic.c.lum[ic.opaque] *= .9
        for (x, y) in ((4, 15), (8, 16), (2, 12)):
            ic.paint(ic.pix([(x, y + 1), (x, y + 2)]), 'ice', .55, bevel=None)
            ic.px([(x, y + 2)], 'ice', .95)
        ic.paint(ic.pix([(6, 18)]), 'ice', .8, bevel=None)
        ic.px([(12, 6), (14, 4), (5, 13), (9, 9)], 'ice', .9)     # wet sheen
    else:
        ic.px([(15, 3), (16, 6), (13, 2)], ramp, 1.0)


@icon('straw')
def _straw(ic):
    _straw_bundle(ic, 'e_straw')


@icon('damp_straw')
def _damp_straw(ic):
    _straw_bundle(ic, 'e_wetstraw', damp=True)


@icon('halcyon_files', evidence=True)
def _halcyon_files(ic):
    back = ic.poly([(3, 4), (7, 4), (8, 3), (12, 3), (13, 4), (16, 4), (16, 17), (3, 17)])
    ic.paint(back, 'e_manila', .5, bevel=(.05, .1))
    papers = ic.rect(3, 5, 15, 7)
    ic.paint(papers, 'paper', .85, bevel=(.04, .1))
    ic.px([(5, 5), (9, 5), (13, 6)], 'paper', .6)
    front = ic.poly([(1, 7), (16, 7), (16, 18), (1, 18)])
    ic.paint(front, 'e_manila', lin(.7, .06), bevel=(.12, .12), sep=.35)
    ic.paint(ic.rect(3, 9, 10, 11), 'paper', .9, bevel=None)
    ic.px([(4, 10), (5, 10), (6, 10), (7, 10), (8, 10)], 'ink', .3)
    st = ic.line((5, 16), (13, 13)) | ic.line((5, 15), (13, 12))
    ic.paint(st, 'e_redink', .7, bevel=None)
    ic.px([(7, 15), (10, 14), (11, 13)], 'e_redink', .45)
    clip = ic.rows(12, 5, ['.##', '#.#', '#.#', '#.#', '.#.'])
    ic.paint(clip, 'chrome', .85, bevel=None)


# ------------------------------------------------------------------ chapter 5 ------------
@icon('blanket')
def _blanket(ic):
    # a grey wool prison blanket, rolled and tied: spiral end, two cords, dark end stripes
    body = ic.poly([(5, 4), (17, 4), (18, 5), (18, 15), (17, 16), (5, 16)])
    ic.paint(body, 'fog', cyl(10, 4, 10, 16, 6.0, .12, .72), bevel=None)
    # loose outer flap hanging from the far end
    flap = ic.poly([(14, 15), (18, 15), (18, 18), (16, 19), (14, 17)])
    ic.paint(flap, 'fog', lin(.3, .06), bevel=(.1, .08))
    ic.paint(ic.rect(15, 16, 17, 16) & flap, 'slate', .25, bevel=None)
    # stripes near the far end
    for x in (15, 16):
        ic.darken(ic.rect(x, 4, x, 16) & body, .62 if x == 15 else .8)
    # spiral end
    end = ic.ell(4.5, 10.0, 3.3, 6.2)
    ic.paint(end, 'fog', .6, bevel=(.1, .1), sep=.35)
    ring1 = ic.ell(4.6, 10.0, 2.3, 4.5) & ~ic.ell(4.6, 10.0, 1.4, 3.3)
    ring2 = ic.ell(4.7, 10.2, .9, 1.9)
    ic.paint(ring1, 'fog', .28, bevel=None)
    ic.paint(ring2, 'fog', .2, bevel=None)
    ic.px([(4, 6), (3, 7), (3, 12)], 'fog', .85)
    # two cords
    for x in (8, 13):
        cord = ic.rect(x, 3, x, 17)
        ic.paint(cord, 'e_tan', cyl(x, 3, x, 17, .8, .35, .75), bevel=None, sep=.35)
        ic.px([(x, 3), (x, 17)], 'e_tan', .4)
        ic.px([(x, 6), (x, 9)], 'e_tan', .85)
    # wool fuzz
    rng = np.random.default_rng(3)
    for _ in range(30):
        x, y = int(rng.integers(5, 18)), int(rng.integers(4, 16))
        if ic.opaque[y, x] and ic.c.names[ic.c.rid[y, x]] == 'fog':
            ic.c.lum[y, x] = np.clip(ic.c.lum[y, x] + rng.choice([-.07, .07]), 0, 1)


@icon('cell_keys')
def _cell_keys(ic):
    ring = ic.ell(7.5, 6.5, 5.0, 4.6) & ~ic.ell(7.5, 6.5, 3.8, 3.4)
    ic.paint(ring, 'steel', sph(7.5, 6.5, 5.0, .35, .95), bevel=None)
    ic.px([(4, 3), (5, 2)], 'steel', 1.0)
    # key 1: hanging straight down
    b1 = ic.ell(6.5, 11.5, 1.8, 1.8) & ~ic.pix([(6, 11)])
    ic.paint(b1, 'steel', sph(6.5, 11.5, 1.8, .3, .8), bevel=None, sep=.3)
    ic.paint(ic.rect(6, 13, 7, 18), 'steel', cyl(6, 13, 6, 18, 1.0, .35, .75), bevel=None)
    ic.paint(ic.rows(3, 15, ['###', '#..', '###', '.##']), 'steel', .5, bevel=None)
    # key 2: swinging to the right
    b2 = ic.ell(11.5, 10.5, 1.8, 1.8) & ~ic.pix([(11, 10)])
    ic.paint(b2, 'steel', sph(11.5, 10.5, 1.8, .3, .8), bevel=None, sep=.3)
    sh2 = ic.line((12, 12), (17, 17)) | ic.line((13, 12), (18, 17))
    ic.paint(sh2, 'steel', .6, bevel=None)
    ic.paint(ic.rows(14, 16, ['#..', '##.', '.##']), 'steel', .45, bevel=None)
    ic.px([(14, 14), (16, 16)], 'steel', .95)
    # old iron rust touches
    ic.px([(7, 17), (17, 17), (11, 11)], 'rust', .5)


@icon('padlock', evidence=True)
def _padlock(ic):
    # the sawn-off hasp, hanging in the shackle (drawn first, the shackle passes through it)
    hasp = ic.poly([(1, 7), (6, 3), (8, 5), (2, 10)])
    ic.paint(hasp, 'rust', lin(.55, .08), bevel=(.15, .12))
    ic.px([(1, 7), (1, 8), (2, 9)], 'chrome', .95)                    # bright sawn edge
    ic.px([(3, 6), (4, 7)], 'rust', .25)
    shackle = ic.ell(10.0, 7.0, 5.0, 6.0) & ~ic.ell(10.0, 7.0, 2.9, 4.0) & ic.rect(0, 0, 19, 9)
    ic.paint(shackle, 'steel', sph(10.0, 6.0, 5.2, .32, .95), bevel=None, sep=.3)
    ic.paint(ic.pix([(6, 4), (7, 5)]), 'rust', .5, bevel=None)         # hasp in front of the leg
    body = ic.poly([(3, 9), (17, 9), (18, 10), (18, 16), (16, 18), (5, 18), (3, 16), (2, 15), (2, 10)])
    N = noise2(W, H, 3, 4, 2)
    scorch = np.clip((ic.X - 3) / 15 * .6 + (ic.Y - 9) / 9 * .5 + (N - .5) * .9, 0, 1)

    def brass(X, Y):
        base = .72 - (X - 3) * .012 - (Y - 9) * .02
        return base * (1 - .85 * (scorch > .62)) * (1 - .35 * (scorch > .48))
    ic.paint(body, 'brass', brass, bevel=(.12, .1), sep=.35)
    ic.paint(ic.rect(3, 10, 17, 10) & body, 'brass', .9, bevel=None)
    ic.darken(ic.rect(3, 10, 17, 10) & (scorch > .55), .3)
    soot = (scorch > .8) & body
    ic.paint(soot, 'black', .35, bevel=None)
    # keyhole
    kh = ic.pix([(10, 12), (11, 12), (10, 13), (11, 13), (10, 14), (10, 15)])
    ic.paint(kh, 'black', .05, bevel=None)
    ic.px([(4, 11), (5, 11), (4, 12)], 'brass', 1.0)


@icon('gate_log', evidence=True)
def _gate_log(ic):
    left = [(2, 18), (3, 16), (2, 14), (3, 12), (2, 10), (3, 8), (2, 6), (3, 4)]
    page = ic.poly([(2, 2), (15, 2), (15, 18)] + left)
    ic.paint(page, 'cream', lin(.88, .05), bevel=(.05, .1))
    for y in (6, 9, 12, 15):
        ic.paint(ic.rect(3, y, 14, y) & page, 'e_sea', .78, bevel=None)    # pale blue ruling
    ic.paint(ic.rect(6, 3, 6, 17) & page, 'e_redink', .78, bevel=None)    # red column rule
    ic.paint(ic.rect(3, 3, 14, 3) & page, 'ink', .4, bevel=None)         # header
    for k, y in enumerate((5, 8, 11, 14, 17)):
        ic.px([(4, y), (5, y)], 'ink', .35)
        scribble(ic, 7, 12, y, 'ink', .32, seed=40 + k)
    ic.px([(9, 8), (10, 8), (11, 8), (12, 8), (13, 8)], 'e_redink', .75)   # 'for Sgt. Rook' underlined


def _lantern(ic, mode='dry'):
    lit = mode == 'lit'
    # bail handle
    bail = ic.line((4, 7), (4, 4), (5, 2), (7, 1), (12, 1), (14, 2), (15, 4), (15, 7))
    ic.paint(bail, 'steel', .55, bevel=None)
    ic.px([(5, 2), (7, 1), (8, 1), (4, 4)], 'steel', .9)
    # side tubes and the top crossbar
    tl = ic.rect(2, 6, 3, 16)
    tr = ic.rect(16, 6, 17, 16)
    ic.paint(tl, 'red', cyl(2, 10, 4, 10, 1.1, .3, .8), bevel=None)
    ic.paint(tr, 'red', cyl(16, 10, 18, 10, 1.1, .2, .55), bevel=None)
    ic.paint(ic.rect(2, 6, 17, 6), 'red', .55, bevel=None)
    # globe
    globe = ic.ell(9.5, 10.6, 4.4, 4.4)
    if lit:
        ic.paint(globe, 'e_flame', sph(9.5, 10.6, 4.4, .55, .9), bevel=None, emis=1.0)
        flame = ic.rows(9, 8, ['.#', '##', '##', '##'])
        ic.paint(flame, 'e_flame', 1.0, bevel=None, emis=1.0)
        ic.px([(9, 12), (10, 12)], 'e_blueflame', .75)
    else:
        ic.paint(globe, 'glass', sph(9.5, 10.6, 4.4, .2, .62), bevel=None)
        ic.darken(globe & ic.rect(0, 0, 19, 7), .7)                       # soot at the top
        ic.paint(ic.rect(8, 13, 11, 14), 'steel', .35, bevel=None)       # burner inside
        ic.paint(ic.rect(9, 12, 10, 12), 'black', .45 if mode == 'dry' else .2, bevel=None)
        if mode == 'fueled':
            ic.px([(9, 12), (10, 12)], 'e_amber', .55)
        ic.px([(6, 9), (6, 10), (7, 8)], 'white', .95)                   # glass glints
        ic.px([(13, 12)], 'white', .7)
    # guard wires in front of the globe
    for x in (7, 12):
        m = ic.rect(x, 7, x, 14) & globe
        ic.paint(m, 'steel', .7 if not lit else .2, bevel=None)
    ic.paint(ic.rect(5, 10, 14, 10) & globe & ~ic.rect(8, 9, 11, 11), 'steel', .6 if not lit else .2, bevel=None)
    # cap with vent
    cap = ic.poly([(6, 7), (7, 4), (12, 4), (13, 7)])
    ic.paint(cap, 'red', lin(.62, .12), bevel=(.15, .1))
    ic.paint(ic.rect(8, 3, 11, 3), 'red', .5, bevel=None)
    ic.px([(8, 5), (10, 5)], 'red', .25)
    # burner collar + fount
    ic.paint(ic.rect(6, 15, 13, 15), 'brass', .55, bevel=None)
    tank = ic.poly([(2, 16), (17, 16), (18, 17), (18, 18), (17, 18), (2, 18), (1, 18), (1, 17)])
    ic.paint(tank, 'red', cyl(10, 15.5, 10, 19.5, 2.4, .25, .78), bevel=None, sep=.35)
    ic.paint(ic.rect(3, 16, 16, 16), 'red', .8, bevel=None)
    ic.px([(15, 15), (16, 15)], 'steel', .6)                              # filler cap
    # rust
    ic.px([(4, 18), (12, 18), (16, 9), (3, 12)], 'rust', .5)
    ic.px([(13, 18), (2, 15)], 'rust', .62)
    if mode == 'fueled':
        # brimming with rum: the fount glistens amber, rum runs over the filler and drips
        ic.paint(ic.rect(2, 16, 17, 16) & tank, 'e_amber', lambda X, Y: .78 + .1 * ((X.astype(int) % 3) == 0), bevel=None)
        ic.paint(ic.rect(14, 15, 16, 15), 'e_amber', 1.0, bevel=None)
        ic.paint(ic.pix([(16, 17), (16, 18), (15, 18)]), 'e_amber', .85, bevel=None)
        ic.px([(5, 17), (6, 17), (9, 18), (10, 18)], 'e_amber', .62)
        drop = ic.pix([(18, 16)])
        ic.paint(drop, 'e_amber', .9, bevel=None)
    if lit:
        ic.glow(9.5, 10.6, 11.5, '#ffb24a', .8)
        for (x, y) in ((2, 8), (16, 8), (3, 11)):
            ic.px([(x, y)], 'red', .95)


@icon('lantern')
def _lantern_dry(ic):
    _lantern(ic, 'dry')


@icon('lantern_fueled')
def _lantern_fueled(ic):
    _lantern(ic, 'fueled')


@icon('lantern_lit')
def _lantern_lit(ic):
    _lantern(ic, 'lit')


@icon('rum')
def _rum(ic):
    body = ic.poly([(4, 9), (6, 7), (13, 7), (15, 9), (15, 18), (14, 19), (5, 19), (4, 18)])
    ic.paint(body, 'e_amber', cyl(4, 13, 15, 13, 5.4, .1, .55), bevel=None)
    neck = ic.rect(8, 3, 11, 7)
    ic.paint(neck, 'e_amber', cyl(8, 5, 12, 5, 2.1, .12, .55), bevel=None)
    ic.paint(ic.rect(7, 3, 12, 3), 'e_amber', .4, bevel=None)          # lip
    cork = ic.rect(8, 1, 11, 2)
    ic.paint(cork, 'oak', lin(.6, .1), bevel=(.12, .12))
    ic.paint(ic.pix([(8, 3), (8, 4), (11, 3)]), 'blood', .55, bevel=None)    # wax drip
    lab = ic.rect(4, 10, 15, 16)
    ic.paint(lab, 'cream', lin(.76, .05), bevel=None)
    ic.paint(ic.rect(4, 10, 15, 10) | ic.rect(4, 16, 15, 16), 'e_redink', .6, bevel=None)
    ic.paint(ic.digit(5, 11, '151'), 'e_redink', .45, bevel=None)
    ic.px([(5, 9), (5, 17), (5, 18), (9, 4), (9, 5)], 'e_amber', .95)
    # dust on the shoulders and the cork
    rng = np.random.default_rng(2)
    for _ in range(12):
        x, y = int(rng.integers(5, 15)), int(rng.integers(6, 10))
        if ic.opaque[y, x] and ic.c.names[ic.c.rid[y, x]] == 'e_amber':
            ic.px([(x, y)], 'fog', .5 + .2 * rng.random())
    ic.px([(9, 1), (10, 1)], 'fog', .6)


@icon('hat')
def _hat(ic):
    # Rook's grey fedora: teardrop-pinched crown, black band with a bow, snap brim
    brim = ic.ell(10.0, 14.2, 9.4, 3.3)
    ic.paint(brim, 'slate', lambda X, Y: .7 + .06 * (10 - X) / 10 - .08 * (Y - 13.5), bevel=(.15, .0))
    under = brim & ~ic.ell(10.0, 13.6, 9.4, 3.1)
    ic.paint(under, 'slate', .3, bevel=None)                       # turned-down front edge
    ic.px([(1, 14), (18, 14)], 'slate', .45)
    crown = ic.poly([(5, 13), (5, 7), (6, 4), (8, 2), (10, 3), (12, 2), (14, 4), (15, 7), (15, 13)])
    ic.paint(crown, 'slate', cyl(5, 8, 15, 8, 5.2, .32, .9), bevel=(.1, .1), sep=.35)
    ic.paint(ic.pix([(10, 3), (10, 4), (10, 5), (9, 6), (11, 6)]), 'slate', .38, bevel=None)    # pinch
    ic.px([(7, 3), (6, 5), (6, 6)], 'slate', 1.0)
    band = ic.rect(5, 10, 15, 12)
    ic.paint(band, 'black', lambda X, Y: .55 - .04 * (X - 5), bevel=None)
    ic.px([(5, 10), (6, 10), (7, 10)], 'black', .85)
    ic.paint(ic.pix([(4, 10), (3, 10), (3, 11), (4, 12)]), 'black', .6, bevel=None)       # the bow
    ic.px([(13, 9)], 'red', .75)                                   # a match head tucked in the band


@icon('hat_matches')
def _hat_matches(ic):
    # two matches, crossed, tied with a twist of grey hatband ribbon
    for (a, b) in (((3, 18), (14, 4)), ((16, 18), (5, 4))):
        ic.paint(ic.line(a, b), 'cream', .78, bevel=None)
        ic.paint(ic.line((a[0] + (1 if a[0] < 10 else -1), a[1]), (b[0] + (1 if a[0] < 10 else -1), b[1])), 'cream', .55, bevel=None)
    for (x, y) in ((14, 1), (4, 1)):
        ic.paint(ic.rect(x, y, x + 1, y + 3) & ~ic.pix([(x, y)]) | ic.pix([(x + 1, y)]), 'red', .72, bevel=(.22, .15))
    knot = ic.rows(7, 9, ['.####.', '######', '.####.'])
    ic.paint(knot, 'slate', cyl(10, 9, 10, 12, 1.6, .3, .7), bevel=None, sep=.4)
    tails = ic.pix([(6, 12), (5, 13), (13, 12), (14, 13)])
    ic.paint(tails, 'slate', .45, bevel=None)


@icon('walter_knife')
def _walter_knife(ic):
    handle = ic.poly([(1, 15), (8, 8), (11, 10), (11, 11), (4, 18), (2, 18), (1, 17)])
    ic.paint(handle, 'e_bone', cyl(2, 18, 9, 11, 2.3, .35, .95), bevel=(.05, .1))
    ic.paint(ic.poly([(7, 9), (8, 8), (11, 10), (10, 11)]), 'brass', .7, bevel=None)     # bolster
    ic.paint(ic.pix([(1, 16), (2, 17), (1, 15), (3, 18)]), 'brass', .55, bevel=None)
    ic.px([(4, 14), (5, 14), (6, 13)], 'e_bone', .4)       # W.M.
    ic.px([(4, 15), (6, 14)], 'e_bone', .45)
    blade = ic.poly([(10, 8), (17, 1), (18, 1), (18, 2), (12, 10)])
    ic.paint(blade, 'chrome', lin(.62, .12), bevel=None)
    ic.paint(ic.line((11, 8), (17, 2)), 'chrome', .95, bevel=None)    # edge bevel
    ic.px([(18, 1)], 'white', 1.0)
    ic.px([(12, 9), (13, 8)], 'chrome', .4)


@icon('calypso_manifest', evidence=True)
def _calypso_manifest(ic):
    man = ic.poly([(1, 1), (13, 1), (14, 2), (14, 15), (1, 15)])
    ic.paint(man, 'paper', lin(.82, .05), bevel=(.06, .1))
    ic.paint(ic.rect(2, 2, 12, 3), 'ink', .3, bevel=None)
    for y in range(5, 15, 2):
        ic.paint(ic.rect(2, y, 13, y), 'paper', .5, bevel=None)
    ic.paint(ic.rect(6, 5, 6, 14) | ic.rect(10, 5, 10, 14), 'paper', .5, bevel=None)
    typed_lines(ic, 2, 5, [6, 8, 10, 12], 'paper', .3, seed=51)
    tel = ic.poly([(6, 8), (18, 8), (18, 18), (6, 18)])
    ic.paint(tel, 'e_telegram', lin(.75, .06), bevel=(.1, .12), sep=.4)
    ic.paint(ic.rect(7, 9, 17, 9), 'e_telegram', .45, bevel=None)
    for y in (12, 15):
        strip = ic.rect(7, y, 17, y + 1)
        ic.paint(strip, 'white', .9, bevel=None)
        typed_lines(ic, 8, 16, [y], 'white', .35, seed=y)
    ic.px([(16, 10), (17, 10)], 'red', .6)


@icon('booth_key')
def _booth_key(ic):
    bow = ic.poly([(2, 4), (4, 2), (7, 2), (9, 4), (9, 7), (7, 9), (4, 9), (2, 7)]) & ~ic.ell(5.5, 5.5, 1.1, 1.1)
    ic.paint(bow, 'e_gold', sph(5.5, 5.5, 3.6, .42, 1.0), bevel=(.1, .12))
    blade = ic.poly([(8, 7), (9, 6), (17, 14), (15, 16)])
    ic.paint(blade, 'e_gold', cyl(8, 7, 16, 15, 1.5, .48, 1.0), bevel=None)
    teeth = ic.pix([(11, 12), (13, 14), (12, 14), (14, 16), (10, 11)])
    ic.paint(teeth, 'e_gold', .62, bevel=None)
    ic.px([(10, 8), (12, 10), (14, 12)], 'white', 1.0)
    # the freshly cut teeth still glowing warm
    ic.px([(10, 11), (12, 14), (14, 16)], 'e_neon', .75)
    ic.px([(11, 12), (13, 14)], 'e_neon', .6)
    # heat shimmer + a curl of brass swarf
    ic.paint(ic.pix([(17, 17), (18, 16), (16, 18)]), 'e_neon', .55, bevel=None)
    ic.paint(ic.pix([(4, 15), (5, 14), (6, 14), (7, 15), (7, 16)]), 'e_gold', .82, bevel=None)


@icon('press_pass')
def _press_pass(ic):
    card = ic.rect(3, 5, 17, 18)
    ic.paint(card, 'black', lin(.55, .05), bevel=(.25, .05))
    border = ic.rect(4, 6, 16, 6) | ic.rect(4, 17, 16, 17) | ic.rect(4, 6, 4, 17) | ic.rect(16, 6, 16, 17)
    ic.paint(border, 'e_gold', .7, bevel=None)
    ic.px([(4, 6), (16, 6)], 'e_gold', 1.0)
    # PRESS band
    ic.paint(ic.rect(5, 10, 15, 12), 'e_gold', lin(.8, .05), bevel=None)
    ic.px([(6, 11), (7, 11), (9, 11), (10, 11), (12, 11), (14, 11)], 'black', .3)
    ic.px([(6, 14), (7, 14), (8, 14), (9, 14), (10, 14), (11, 14), (12, 14), (13, 14), (14, 14)], 'e_gold', .5)   # name line
    # ribbon rosette
    tails = ic.poly([(4, 4), (6, 4), (6, 11), (5, 10), (4, 11)]) | ic.poly([(7, 4), (9, 4), (9, 10), (8, 9), (7, 10)])
    ic.paint(tails, 'neonred', lin(.45, .08), bevel=(.1, .1), sep=.3)
    ros = ic.ell(6.5, 4.0, 3.2, 2.8)
    ic.paint(ros, 'neonred', sph(6.5, 4.0, 3.2, .3, .8), bevel=None)
    ic.px([(6, 4), (7, 4), (6, 5)], 'e_gold', .9)
    ic.px([(4, 3), (9, 3), (4, 5), (9, 5)], 'neonred', .35)


@icon('gus_log', evidence=True)
def _gus_log(ic):
    pages = ic.poly([(4, 6), (16, 6), (16, 18), (4, 18)])
    ic.paint(pages, 'paper', .78, bevel=(.04, .1))
    for y in range(8, 18, 2):
        ic.px([(16, y)], 'paper', .55)
    # gull feather pressed between the pages, sticking out to the right
    vane = ic.poly([(11, 10), (16, 7), (18, 5), (18, 7), (16, 10), (12, 12)])
    ic.paint(vane, 'white', lin(.86, .1), bevel=(.08, .12))
    ic.paint(ic.line((12, 11), (16, 9), (18, 6)), 'white', .55, bevel=None)
    ic.paint(ic.pix([(18, 5), (17, 5)]), 'slate', .3, bevel=None)
    cover = ic.poly([(1, 4), (14, 4), (14, 17), (1, 17)])
    ic.paint(cover, 'teal', lin(.5, .08), bevel=(.2, .1), sep=.3)
    ic.paint(ic.rect(1, 4, 2, 17), 'e_leather', .45, bevel=None)         # leather spine
    ic.paint(ic.poly([(11, 14), (14, 14), (14, 17), (11, 17)]) & ic.poly([(14, 13), (14, 17), (10, 17)]),
             'e_leather', .5, bevel=None)
    ic.paint(ic.rect(5, 7, 11, 9), 'paper', .8, bevel=None)              # label
    ic.px([(6, 8), (7, 8), (8, 8), (9, 8), (10, 8)], 'ink', .4)
    ic.px([(3, 12), (6, 14), (9, 11)], 'teal', .3)                       # wear


@icon('antidote')
def _antidote(ic):
    # syringe (diagonal) + ampoule (upright, right)
    barrel = ic.poly([(3, 12), (9, 6), (12, 9), (6, 15)])
    ic.paint(barrel, 'ice', cyl(4.5, 13.5, 10.5, 7.5, 2.0, .35, .8), bevel=None)
    liquid = ic.poly([(6, 9), (9, 6), (12, 9), (9, 12)])
    ic.paint(liquid & barrel, 'e_sea', cyl(4.5, 13.5, 10.5, 7.5, 2.0, .55, .95), bevel=None)
    for k in range(3):
        ic.px([(5 + k * 2, 11 - k * 2)], 'ink', .35)
    ic.paint(ic.poly([(1, 12), (3, 10), (8, 15), (6, 17)]) & ~barrel, 'chrome', .7, bevel=None)
    ic.paint(ic.line((5, 15), (2, 18)) | ic.line((4, 15), (2, 17)), 'chrome', .55, bevel=None)
    ic.paint(ic.pix([(1, 18), (2, 18), (1, 17), (3, 18)]), 'chrome', .8, bevel=None)
    ic.paint(ic.pix([(12, 7), (11, 6)]), 'chrome', .7, bevel=None)
    ic.paint(ic.line((12, 6), (15, 3)), 'chrome', .9, bevel=None)
    ic.px([(4, 12), (6, 10), (8, 8)], 'white', .95)
    # glass ampoule: bulb tip, pinched neck, body
    tip = ic.rect(15, 4, 16, 6) & ~ic.pix([(15, 4)])
    neck = ic.rect(15, 8, 16, 8)
    shoulder = ic.pix([(15, 7), (16, 7)])
    amp = ic.poly([(14, 9), (17, 9), (17, 16), (16, 17), (15, 17), (14, 16)])
    ic.paint(amp | tip | neck | shoulder, 'e_amber', cyl(14, 13, 17, 13, 1.8, .45, .95), bevel=None)
    ic.paint(neck, 'e_amber', .35, bevel=None)
    ic.paint(ic.rect(14, 12, 17, 13), 'paper', .85, bevel=None)
    ic.px([(14, 10), (14, 15), (15, 5)], 'white', .95)


# ------------------------------------------------------------------ chapter 8 ------------
@icon('self_notes')
def _self_notes(ic):
    a = ic.poly([(1, 2), (12, 1), (13, 13), (2, 14)])
    ic.paint(a, 'paper', lin(.8, .05), bevel=(.05, .1))
    for k, y in enumerate((4, 6, 8, 10)):
        scribble(ic, 3, 10, y, 'denim', .45, seed=70 + k)
    b = ic.poly([(7, 7), (18, 6), (18, 18), (7, 18)])
    ic.paint(b, 'cream', lin(.86, .05), bevel=(.06, .1), sep=.35)
    for k, y in enumerate((9, 11, 13)):
        scribble(ic, 9, 16, y, 'denim', .4, seed=80 + k)
    ic.px([(9, 16), (10, 15), (11, 16), (12, 16), (13, 15), (14, 16)], 'red', .6)    # underlined
    ic.paint(ic.line((15, 15), (17, 15)), 'red', .62, bevel=None)


@icon('bulb')
def _bulb(ic):
    glass = ic.ell(10.0, 7.2, 6.1, 6.2) | ic.poly([(6, 10), (14, 10), (12, 14), (8, 14)])
    ic.paint(glass, 'neonred', sph(10.0, 7.2, 6.1, .3, .85, ry=6.2), bevel=None)
    # filament
    ic.paint(ic.line((9, 12), (8, 8), (12, 8), (11, 12)), 'neonred', .2, bevel=None)
    ic.px([(9, 8), (10, 8), (11, 8)], 'e_neon', .6)
    ic.px([(7, 4), (6, 5), (6, 6), (8, 3)], 'white', .95)
    # screw base
    base = ic.rect(7, 14, 12, 17) | ic.rect(9, 18, 10, 18)
    ic.paint(base, 'brass', cyl(7, 16, 12, 16, 3, .3, .9), bevel=None, sep=.35)
    for y in (15, 17):
        ic.paint(ic.rect(7, y, 12, y), 'brass', .35, bevel=None)
    ic.paint(ic.rect(9, 18, 10, 18), 'black', .4, bevel=None)


# ------------------------------------------------------------------ fallback -------------
def _fallback(ic):
    card = ic.rect(4, 3, 15, 17)
    ic.paint(card, 'paper', lin(.8, .05), bevel=(.06, .1))
    typed_lines(ic, 6, 13, [6, 8, 10, 12, 14], 'paper', .4, seed=1)


# =========================================================================================
def item_ids(path=None):
    path = path or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'content', 'items.ts')
    try:
        txt = open(path, encoding='utf-8').read()
    except OSError:
        return list(ICONS.keys())
    return re.findall(r"\bI\(\s*'([A-Za-z0-9_]+)'", txt)


def render_icon(name):
    fn, ev = ICONS[name]
    ic = Ico(seed=zlib.crc32(name.encode()) % 1000)
    fn(ic)
    if ev:
        evidence_mark(ic)
    return ic.render()


def build_atlas(cols=10):
    ids = item_ids()
    missing = [i for i in ids if i not in ICONS]
    for m in missing:
        print('  [items] WARNING: no icon for', m, '- using a placeholder')
    names = ['none'] + ids + [k for k in ICONS if k not in ids]
    n = len(names)
    rows = (n + cols - 1) // cols
    cell = W + 2
    img = np.zeros((rows * cell, cols * cell, 4), np.uint8)
    frames = {}
    for i, name in enumerate(names):
        x = (i % cols) * cell + 1
        y = (i // cols) * cell + 1
        if name == 'none':
            ic_img = np.zeros((H, W, 4), np.uint8)
        elif name in ICONS:
            ic_img = render_icon(name)
        else:
            ic = Ico(seed=i)
            _fallback(ic)
            ic_img = ic.render()
        img[y:y + H, x:x + W] = ic_img
        frames[name] = {
            'frame': {'x': x, 'y': y, 'w': W, 'h': H},
            'rotated': False,
            'trimmed': False,
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': W, 'h': H},
            'sourceSize': {'w': W, 'h': H},
        }
    folder = out_path('ui')
    os.makedirs(folder, exist_ok=True)
    Image.fromarray(img, 'RGBA').save(os.path.join(folder, 'items.png'), optimize=True)
    meta = {'frames': frames,
            'meta': {'app': 'NIGHT LATCH art/build_extras.py', 'version': '1.0', 'image': 'items.png',
                     'format': 'RGBA8888', 'size': {'w': int(img.shape[1]), 'h': int(img.shape[0])}, 'scale': '1'}}
    with open(os.path.join(folder, 'items.json'), 'w') as f:
        json.dump(meta, f, indent=1)
    return img, frames, names
