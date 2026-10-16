"""Group D props and helpers: Halcyon House, MV Calypso, City Hall (WBRK booth + clock tower).

Everything here draws onto a core.Canvas (or a Scene canvas).  Ramps registered by this module
are prefixed `d_`.
"""
from __future__ import annotations

import math
import numpy as np

from core import ramp, BAYER4, noise2, vgrad, hgrad, radial
from persp import Persp

# ------------------------------------------------------------------------------ ramps ----
# quilted asylum padding: cold sage-grey shadows -> pale cream highlights
ramp('d_pad', '#141b19', '#1e2824', '#2a3631', '#38453f', '#47554d', '#58665d', '#6b796e', '#808d80',
     '#98a493', '#b2bba8', '#cbd1bd', '#e1e4d2')
# institutional green paint (Halcyon corridors, steel doors)
ramp('d_green', '#0c1714', '#13221d', '#1a2f27', '#233d32', '#2d4c3e', '#395c4b', '#476d59', '#588068',
     '#6c9479', '#84a98d')
# backlit opal glass / warm emissive dial
ramp('d_amber', '#1c0f05', '#38200a', '#5a3510', '#7e4e18', '#a46a22', '#c5892f', '#e0a843', '#f2c665',
     '#fde296', '#fff4d4')
# rich red-brown mahogany for Dr. Vey's panelling
ramp('d_mahog', '#0f0605', '#1b0b08', '#2a110c', '#3b1810', '#4d2015', '#61291a', '#763320', '#8c3f28',
     '#a34e33', '#bb6340')
# dusk sky glow over Gull Hill (purple -> bruised rose -> dirty amber)
ramp('d_dusk', '#120c1c', '#1d1328', '#2b1a35', '#3c2240', '#512a47', '#6b344c', '#88424f', '#a55a54',
     '#bf785c', '#d69b6c')
# cold fluorescent white (sterile light, bulbs)
ramp('d_cold', '#1d2a33', '#2d3f4a', '#41565f', '#577077', '#708a8e', '#8ca5a6', '#aac0bd', '#c9dad3',
     '#e6f1ea', '#f8fffb')
# acoustic tile / broadcast booth walls (warm grey-beige)
ramp('d_acou', '#14110f', '#201b18', '#2e2723', '#3d3530', '#4e443d', '#61564c', '#76695d', '#8c7f70',
     '#a49685', '#bcaf9c')
# ship's enamel paint (cabin bulkheads): creamy white going olive in shadow
ramp('d_enamel', '#1b1a12', '#2a281c', '#3b3828', '#4e4a36', '#635e46', '#7a7458', '#938c6c', '#ada682',
     '#c6bf9a', '#ddd7b4')
# wet slate roof / tower stone at night (blue-violet)
ramp('d_stone', '#07080f', '#0d1019', '#141925', '#1c2332', '#262f41', '#323c50', '#404b60', '#515c71',
     '#667084', '#7e8798')


# ------------------------------------------------------------------------------- font ----
_F = {
    'A': ['.#.', '#.#', '###', '#.#', '#.#'], 'B': ['##.', '#.#', '##.', '#.#', '##.'],
    'C': ['.##', '#..', '#..', '#..', '.##'], 'D': ['##.', '#.#', '#.#', '#.#', '##.'],
    'E': ['###', '#..', '##.', '#..', '###'], 'F': ['###', '#..', '##.', '#..', '#..'],
    'G': ['.##', '#..', '#.#', '#.#', '.##'], 'H': ['#.#', '#.#', '###', '#.#', '#.#'],
    'I': ['###', '.#.', '.#.', '.#.', '###'], 'J': ['..#', '..#', '..#', '#.#', '.#.'],
    'K': ['#.#', '#.#', '##.', '#.#', '#.#'], 'L': ['#..', '#..', '#..', '#..', '###'],
    'M': ['#...#', '##.##', '#.#.#', '#...#', '#...#'], 'N': ['#..#', '##.#', '#.##', '#..#', '#..#'],
    'O': ['.#.', '#.#', '#.#', '#.#', '.#.'], 'P': ['##.', '#.#', '##.', '#..', '#..'],
    'Q': ['.#.', '#.#', '#.#', '#.#', '.##'], 'R': ['##.', '#.#', '##.', '#.#', '#.#'],
    'S': ['.##', '#..', '.#.', '..#', '##.'], 'T': ['###', '.#.', '.#.', '.#.', '.#.'],
    'U': ['#.#', '#.#', '#.#', '#.#', '###'], 'V': ['#.#', '#.#', '#.#', '#.#', '.#.'],
    'W': ['#...#', '#...#', '#.#.#', '##.##', '#...#'], 'X': ['#.#', '#.#', '.#.', '#.#', '#.#'],
    'Y': ['#.#', '#.#', '.#.', '.#.', '.#.'], 'Z': ['###', '..#', '.#.', '#..', '###'],
    '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#', '##', '.#', '.#', '.#'],
    '2': ['##.', '..#', '.#.', '#..', '###'], '3': ['##.', '..#', '.#.', '..#', '##.'],
    '4': ['#.#', '#.#', '###', '..#', '..#'], '5': ['###', '#..', '##.', '..#', '##.'],
    '6': ['.##', '#..', '###', '#.#', '###'], '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'], '9': ['###', '#.#', '###', '..#', '##.'],
    '.': ['.', '.', '.', '.', '#'], ',': ['.', '.', '.', '#', '#'], ':': ['.', '#', '.', '#', '.'],
    '/': ['..#', '..#', '.#.', '#..', '#..'], '-': ['..', '..', '##', '..', '..'],
    "'": ['#', '#', '.', '.', '.'], '!': ['#', '#', '#', '.', '#'], '?': ['##.', '..#', '.#.', '...', '.#.'],
    '#': ['#.#', '###', '#.#', '###', '#.#'], '+': ['...', '.#.', '###', '.#.', '...'],
    ' ': ['..', '..', '..', '..', '..'], '=': ['...', '###', '...', '###', '...'],
}


def text_w(s: str, sp=1) -> int:
    return sum(len(_F.get(ch, _F[' '])[0]) + sp for ch in s.upper()) - sp


def text(c, x, y, s: str, ramp_name, lum, emis=0.0, mirror=False, sp=1, shadow=None):
    """3x5 pixel font (M/W/N wider). mirror=True draws the string as seen from behind glass."""
    s = s.upper()
    W = text_w(s, sp)
    cx = x
    for ch in s:
        g = _F.get(ch, _F[' '])
        gw = len(g[0])
        for j, row in enumerate(g):
            for i, v in enumerate(row):
                if v == '#':
                    px = cx + i
                    if mirror:
                        px = x + W - 1 - (px - x)
                    if shadow is not None:
                        c.put(px + 1, y + j + 1, shadow[0], shadow[1])
                    c.put(px, y + j, ramp_name, lum, emis)
        cx += gw + sp
    return W


def scribble(c, x0, y, w, ramp_name, lum, seed=0, gap=.25, emis=0.0):
    """Implied handwriting/typing: a 1-px line with word gaps."""
    rng = np.random.default_rng(seed)
    x = x0
    while x < x0 + w:
        n = int(rng.integers(2, 6))
        for k in range(n):
            if x + k < x0 + w:
                c.put(x + k, y + (1 if rng.random() < .15 else 0), ramp_name, lum, emis)
        x += n + 1


# ----------------------------------------------------------------------- dithering ----
def bayer(h, w, x0=0, y0=0):
    b = np.tile(BAYER4, (h // 4 + 2, w // 4 + 2))
    return b[y0 % 4:y0 % 4 + h, x0 % 4:x0 % 4 + w]


def dfill(c, region, mask, ramp_name, lum, density, emis=None, dith=.0):
    """Apply `mask` (region-shaped bool) thinned by an ordered-dither threshold: density in 0..1
    (scalar or region-shaped array).  Gives pixel-art translucency (smoke, haze, net curtains)."""
    x0, y0, x1, y1 = region
    if x1 <= x0 or y1 <= y0:
        return
    B = bayer(y1 - y0, x1 - x0, x0, y0)
    m = mask & (B < density)
    if m.any():
        c._apply(m, ramp_name, lum, emis=emis, dith=dith, region=region)


def dfill_rect(c, x0, y0, x1, y1, ramp_name, lum, density, emis=None):
    r = c.clip_region(x0, y0, x1, y1)
    if r[2] <= r[0] or r[3] <= r[1]:
        return
    hh, ww = r[3] - r[1], r[2] - r[0]
    yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32)
    dens = density(xx, yy) if callable(density) else density
    L = lum(xx, yy) if callable(lum) else lum
    dfill(c, r, np.ones((hh, ww), bool), ramp_name, L, dens, emis=emis)


def dfill_ellipse(c, cx, cy, rx, ry, ramp_name, lum, density=.5, soft=True, emis=None):
    """Soft dithered blob: density falls off towards the rim when soft."""
    r = c.clip_region(cx - rx - 1, cy - ry - 1, cx + rx + 2, cy + ry + 2)
    if r[2] <= r[0] or r[3] <= r[1]:
        return
    yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32)
    d = np.sqrt(((xx + .5 - cx) / max(rx, .1)) ** 2 + ((yy + .5 - cy) / max(ry, .1)) ** 2)
    m = d <= 1
    dens = density * (np.clip(1.25 - d, 0, 1) if soft else 1.0)
    L = lum(xx, yy) if callable(lum) else lum
    dfill(c, r, m, ramp_name, L, dens, emis=emis)


def dfill_poly(c, pts, ramp_name, lum, density=.5, emis=None):
    m, r = c.poly_mask(pts)
    if m is None:
        return
    yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32)
    dens = density(xx, yy) if callable(density) else density
    L = lum(xx, yy) if callable(lum) else lum
    dfill(c, r, m, ramp_name, L, dens, emis=emis)


# ------------------------------------------------------------------- perspective ----
def side_uv(p: Persp, X):
    """Map screen (xx, yy) on the side wall plane X=const to wall coords (Z depth, Y height)."""
    def f(xx, yy):
        s = np.maximum((xx - p.cx) / (X - p.cx), 1e-3)
        Z = p.D * (1 - 1 / s)
        Y = p.E - (yy - p.hy) / s
        return Z, Y, s
    return f


def floor_uv(p: Persp):
    def f(xx, yy):
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        X = p.cx + (xx - p.cx) / s
        Z = p.D * (1 - 1 / s)
        return X, Z, s
    return f


def pline(c, p: Persp, a, b, ramp_name, lum, emis=0.0):
    """Line between two world points (X, Y, Z)."""
    x0, y0 = p.P(*a)
    x1, y1 = p.P(*b)
    c.line(x0, y0, x1, y1, ramp_name, lum, emis)


def pquad(c, p: Persp, pts3, ramp_name, lum, **kw):
    return c.poly(p.quad(pts3), ramp_name, lum, **kw)


# --------------------------------------------------------------------- quilting ----
def quilt_lum(u, v, cw=16.0, ch=12.0, base=.62, amp=.2, lu=0.0):
    """Diamond-tufted cushion shading in wall coords (u right, v DOWN)."""
    a = u / cw + v / ch
    b = u / cw - v / ch
    fa = a - np.floor(a)
    fb = b - np.floor(b)
    hgt = np.sin(np.pi * fa) * np.sin(np.pi * fb)
    dv = np.sin(np.pi * (fb - fa))          # >0 on the upper slope (faces the ceiling light)
    du = np.sin(np.pi * (fa + fb))          # >0 on the left slope
    return base + amp * (.5 * (hgt - .6) + .5 * dv + lu * du)


def quilt_surface(c, pts, uv_fn, ramp_name='d_pad', base=.62, amp=.2, cw=16.0, ch=12.0, lu=0.0,
                  seam=.24, hi=None, btn=.14, btn_hi=None, dith=.35, emis=None):
    """Fill polygon `pts` with diamond tufting.  uv_fn(xx, yy) -> (u, v) wall coords (v down).
    Seams are found as contours of the lattice so they stay 1 px wide under perspective."""
    m, r = c.poly_mask(pts)
    if m is None:
        return None
    x0, y0, x1, y1 = r
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    u, v = uv_fn(xx + .5, yy + .5)
    L = quilt_lum(u, v, cw, ch, base, amp, lu)
    c._apply(m, ramp_name, L, dith=dith, region=r, emis=emis)
    A = np.floor(u / cw + v / ch)
    B = np.floor(u / cw - v / ch)

    def edges(K):
        e = np.zeros(K.shape, bool)
        e[:, :-1] |= K[:, :-1] != K[:, 1:]
        e[:-1, :] |= K[:-1, :] != K[1:, :]
        return e
    ea, eb = edges(A), edges(B)
    sm = (ea | eb) & m
    if hi is not None:
        h = np.zeros_like(sm)
        h[1:, :] |= ea[:-1, :]          # pixel below an up-right seam
        h[1:, :] |= eb[:-1, :]
        h &= m & ~sm
        c._apply(h, ramp_name, hi, dith=0, region=r)
    c._apply(sm, ramp_name, seam, dith=0, region=r)
    cross = ea & eb
    bt = cross.copy()
    bt[1:, :] |= cross[:-1, :]
    bt[:, 1:] |= cross[:, :-1]
    bt &= m
    c._apply(bt, ramp_name, btn, dith=0, region=r)
    if btn_hi is not None:
        ys, xs = np.nonzero(cross & m)
        for (j, i) in zip(ys.tolist(), xs.tolist()):
            if j > 0 and i > 0 and m[j - 1, i - 1]:
                c.put(x0 + i - 1, y0 + j - 1, ramp_name, btn_hi)
    return m, r


# ---------------------------------------------------------------------- clocks ----
def clock_face(c, cx, cy, r, hh, mm, face='paper', face_lum=.85, rim='brass', rim_lum=.55, rim_w=1,
               hands='black', hands_lum=.15, ticks=True, mirror=False, emis=0.0, sec=None, sec_ramp='red',
               sec_lum=.7, roman=False, hand_w=1):
    """Round dial centred on (cx, cy) (use .5 offsets for pixel-centred discs)."""
    if rim_w > 0:
        c.ellipse(cx, cy, r, r, rim, rim_lum, dith=.2)
    rr = r - rim_w
    c.ellipse(cx, cy, rr, rr, face, face_lum, emis=emis, dith=.15)
    sgn = -1 if mirror else 1
    if ticks and rr >= 3:
        for i in range(12):
            a = i / 12 * 2 * math.pi
            big = i % 3 == 0
            rad = rr - (1.2 if rr > 5 else .9)
            x = cx + sgn * math.sin(a) * rad
            y = cy - math.cos(a) * rad
            c.put(math.floor(x), math.floor(y), hands, hands_lum + (.0 if big else .25), emis * .5)
            if big and rr >= 8:
                x2 = cx + sgn * math.sin(a) * (rad - 1)
                y2 = cy - math.cos(a) * (rad - 1)
                c.put(math.floor(x2), math.floor(y2), hands, hands_lum, emis * .5)
    ah = ((hh % 12) + mm / 60.0) / 12 * 2 * math.pi
    am = mm / 60.0 * 2 * math.pi
    lh = rr * .5
    lm = rr * .78
    for (ang, L, w) in ((ah, lh, hand_w), (am, lm, 1)):
        ex = cx + sgn * math.sin(ang) * L
        ey = cy - math.cos(ang) * L
        c.line(math.floor(cx), math.floor(cy), math.floor(ex), math.floor(ey), hands, hands_lum, emis * .3)
        if w > 1:
            c.line(math.floor(cx) + 1, math.floor(cy), math.floor(ex) + 1, math.floor(ey), hands, hands_lum, emis * .3)
    if sec is not None:
        a = sec / 60.0 * 2 * math.pi
        ex = cx + sgn * math.sin(a) * (rr - .6)
        ey = cy - math.cos(a) * (rr - .6)
        c.line(math.floor(cx), math.floor(cy), math.floor(ex), math.floor(ey), sec_ramp, sec_lum, emis * .3)
    c.put(math.floor(cx), math.floor(cy), hands, hands_lum + .2, emis * .3)


# ---------------------------------------------------------------- small details ----
def rivet(c, x, y, ramp_name='steel', lum=.6):
    c.put(x, y, ramp_name, lum + .25)
    c.put(x + 1, y + 1, ramp_name, lum - .3)


def screw(c, x, y, ramp_name='chrome', lum=.6, slot='/'):
    c.put(x, y, ramp_name, lum)
    c.put(x + 1, y, ramp_name, lum - .15)
    c.put(x, y + 1, ramp_name, lum - .2)
    c.put(x + 1, y + 1, ramp_name, lum - .35)
    if slot == '/':
        c.put(x + 1, y, ramp_name, lum - .45)
        c.put(x, y + 1, ramp_name, lum - .45)


def wire_glass(c, x0, y0, x1, y1, ramp_name='glass', lum=.45, wire='steel', wire_lum=.55, step=3, emis=.4,
               view=None):
    """Georgian wired glass: diamond wire mesh over a view (callable view(x0,y0,x1,y1))."""
    if view:
        view(x0, y0, x1, y1)
    else:
        c.rect(x0, y0, x1, y1, ramp_name, vgrad(y0, y1, lum + .1, lum - .1), emis=emis)
    for k in range(-(y1 - y0), (x1 - x0) + (y1 - y0), step):
        for t in range(0, y1 - y0):
            xa = x0 + k + t
            xb = x0 + k + (y1 - y0) - t
            ya = y0 + t
            if x0 <= xa < x1:
                c.put(xa, ya, wire, wire_lum, emis * .5)
    for k in range(0, (x1 - x0) + 2 * (y1 - y0), step):
        for t in range(0, y1 - y0):
            xb = x0 + k - t
            if x0 <= xb < x1:
                c.put(xb, y0 + t, wire, wire_lum - .1, emis * .5)


def glass_glint(c, x0, y0, x1, y1, ramp_name='glass', lum=.85, emis=.6):
    """Two diagonal reflection strokes across a pane."""
    h = y1 - y0
    for off, L in ((2, lum), (5, lum - .15)):
        for t in range(0, min(h, x1 - x0)):
            x = x0 + off + t
            y = y1 - 1 - t
            if x0 <= x < x1 and y0 <= y < y1 and (t % 7) < 4:
                c.put(x, y, ramp_name, L, emis)


def tiny_person(c, x, y, h, body='white', body_lum=.6, head='skin', head_lum=.6, legs=None, legs_lum=.3,
                arms_up=False, skirt=False, emis=0.0, hat=None, hat_lum=.3, facing=0, hair=None):
    """Small far-away figure (h = height in px, feet at (x, y)).  For crowds and lawns."""
    x = int(x)
    y = int(y)
    hh = max(1, round(h * .16))           # head height
    hw = max(1, round(h * .13))
    sw = max(2, round(h * .28))           # shoulder width
    leg_h = round(h * .45)
    torso_top = y - h + hh
    hip = y - leg_h
    legs = legs or body
    # legs / skirt
    if skirt:
        c.poly([(x - sw / 2 + .2, hip), (x + sw / 2 - .2, hip), (x + sw / 2 + .6, y - 2), (x - sw / 2 - .6, y - 2)], body,
               body_lum - .05, emis=emis, dith=0)
        c.vline(x - 1, y - 2, y, legs, legs_lum, emis)
        c.vline(x + (1 if sw > 2 else 0), y - 2, y, legs, legs_lum, emis)
    else:
        lw = max(1, sw // 2 - (0 if sw > 3 else 1))
        c.rect(x - lw, hip, x, y, legs, legs_lum, emis=emis, dith=0)
        c.rect(x + (1 if sw > 3 else 0), hip, x + 1 + (1 if sw > 3 else 0) + max(0, lw - 1), y, legs, legs_lum - .06,
               emis=emis, dith=0)
    # torso
    c.poly([(x - sw / 2, torso_top + 1), (x + sw / 2 + 1, torso_top + 1), (x + sw / 2, hip + 1), (x - sw / 2 + 1, hip + 1)],
           body, body_lum, emis=emis, dith=0)
    c.hline(int(x - sw / 2 + 1), int(x + sw / 2), torso_top + 1, body, body_lum + .15, emis)
    if arms_up:
        c.vline(int(x - sw / 2) - 1, torso_top - 2, torso_top + 3, body, body_lum - .1, emis)
    # head
    hx0 = x - hw // 2
    c.rect(hx0, y - h, hx0 + hw + (0 if hw > 1 else 1), y - h + hh + (1 if h > 9 else 0), head, head_lum, emis=emis, dith=0)
    if hair:
        c.hline(hx0, hx0 + hw + (0 if hw > 1 else 1), y - h, hair, .3, emis)
    if hat:
        c.hline(hx0 - 1, hx0 + hw + 1, y - h, hat, hat_lum, emis)


def rain_on_pane(c, x0, y0, x1, y1, seed=3, density=.04, ramp_name='glass', lum=.8, emis=.5):
    rng = np.random.default_rng(seed)
    n = int((x1 - x0) * (y1 - y0) * density)
    for _ in range(n):
        x = int(rng.integers(x0, x1))
        y = int(rng.integers(y0, y1))
        L = int(rng.integers(1, 4))
        for k in range(L):
            if y + k < y1:
                c.put(x, y + k, ramp_name, lum - .1 * k, emis)


def stain(c, cx, cy, rx, ry, ramp_name, lum_mul=.85, seed=1):
    """Darken existing luminance in an irregular blob (water stains, grime)."""
    N = noise2(c.w, c.h, max(2, rx / 2), seed, 2)

    def fn(xx, yy):
        d = np.sqrt(((xx - cx) / max(rx, .5)) ** 2 + ((yy - cy) / max(ry, .5)) ** 2)
        xi = np.clip(xx.astype(int), 0, c.w - 1)
        yi = np.clip(yy.astype(int), 0, c.h - 1)
        t = np.clip(1 - d + (N[yi, xi] - .5) * .9, 0, 1)
        return 1 - (1 - lum_mul) * np.clip(t * 2, 0, 1)
    c.modulate(cx - rx - 2, cy - ry - 2, cx + rx + 3, cy + ry + 3, fn)


def drop_shadow_rect(c, x0, y0, x1, y1, amount=.35):
    c.shadow_poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], amount)


# ------------------------------------------------------------------- clock styles ----
def mantel_clock(c, x, yb, kind, hh, mm, case='d_mahog', case_lum=.5, face='paper', face_lum=.85, stopped=False):
    """Small shelf clock, x = left edge, yb = the shelf surface (first row below the clock).
    Returns the bbox (x0, y0, x1, y1)."""
    cl = case_lum
    if kind == 'tambour':                       # 'Napoleon hat'
        w = 15
        for i in range(w):
            t = i / (w - 1)
            top = yb - 4 - int(round(5 * math.sin(math.pi * t) ** .7))
            c.vline(x + i, top, yb - 1, case, cl + .14 * (1 - t) - .04)
            c.put(x + i, top, case, cl + .3 * (1 - t))
        c.rect(x - 1, yb - 2, x + w + 1, yb, case, cl - .1, dith=0)
        c.hline(x - 1, x + w + 1, yb - 2, case, cl + .22)
        clock_face(c, x + w / 2, yb - 5.5, 3.6, hh, mm, face=face, face_lum=face_lum, rim='brass', rim_lum=.65)
        return (x - 1, yb - 10, x + w + 1, yb)
    if kind == 'balloon':
        w = 9
        c.ellipse(x + 4.5, yb - 9, 4.6, 4.6, case, cl + .05, dith=.2)
        c.poly([(x + 2, yb - 6), (x + 7, yb - 6), (x + 6, yb - 3), (x + 3, yb - 3)], case, cl - .05, dith=0)
        c.rect(x + 1, yb - 3, x + 8, yb, case, cl, dith=0)
        c.hline(x + 1, x + 8, yb - 3, case, cl + .25)
        c.put(x + 4, yb - 14, 'brass', .8)
        clock_face(c, x + 4.5, yb - 9, 3.2, hh, mm, face=face, face_lum=face_lum, rim='brass', rim_lum=.6)
        return (x, yb - 14, x + 9, yb)
    if kind == 'carriage':
        w = 7
        c.rect(x, yb - 9, x + w, yb, 'brass', .5, dith=0)
        c.rect(x + 1, yb - 8, x + w - 1, yb - 1, 'glass', .35, dith=0)
        c.vline(x, yb - 9, yb, 'brass', .75)
        c.hline(x, x + w, yb - 9, 'brass', .85)
        c.hline(x + 2, x + 5, yb - 11, 'brass', .7)          # carrying handle
        c.put(x + 1, yb - 10, 'brass', .6)
        c.put(x + 5, yb - 10, 'brass', .6)
        clock_face(c, x + 3.5, yb - 5.5, 2.3, hh, mm, face=face, face_lum=face_lum, rim_w=0, ticks=False)
        return (x, yb - 11, x + w, yb)
    if kind == 'drum':
        c.rect(x + 2, yb - 2, x + 7, yb, case, cl - .1, dith=0)
        c.ellipse(x + 4.5, yb - 6, 4.2, 4.2, 'brass', .55, dith=.2)
        clock_face(c, x + 4.5, yb - 6, 3.4, hh, mm, face=face, face_lum=face_lum, rim='brass', rim_lum=.8)
        return (x, yb - 11, x + 9, yb)
    if kind == 'gothic':                        # steeple clock
        w = 9
        c.rect(x, yb - 9, x + w, yb, case, cl, dith=0)
        c.poly([(x, yb - 9), (x + w / 2, yb - 17), (x + w, yb - 9)], case, cl + .1, dith=0)
        c.vline(x, yb - 13, yb, case, cl + .2)
        c.vline(x + w - 1, yb - 13, yb, case, cl - .15)
        c.put(x, yb - 14, 'brass', .8)
        c.put(x + w - 1, yb - 14, 'brass', .8)
        c.rect(x + 2, yb - 4, x + w - 2, yb - 1, 'glass', .4, dith=0)    # tablet window
        c.put(x + 3, yb - 3, 'gold', .7)
        clock_face(c, x + w / 2, yb - 8.5, 2.6, hh, mm, face=face, face_lum=face_lum, rim_w=0, ticks=False)
        return (x, yb - 17, x + w, yb)
    if kind == 'dome':                          # skeleton clock under a glass dome
        w = 11
        c.rect(x, yb - 2, x + w, yb, case, cl - .05, dith=0)
        c.hline(x, x + w, yb - 2, case, cl + .2)
        cx_, cy_ = x + 5.5, yb - 8
        # the glass dome: only its outline and reflections (the wall shows through)
        for t in range(40):
            a = t / 39 * math.pi
            px_ = cx_ - math.cos(a) * 4.8
            py_ = cy_ + 4 - math.sin(a) * 9
            c.put(int(px_), int(py_), 'glass', .6, .3)
        c.vline(x + 1, yb - 7, yb - 2, 'glass', .55, .3)
        c.vline(x + 9, yb - 7, yb - 2, 'glass', .5, .3)
        c.put(x + 3, yb - 12, 'white', .95, .5)
        c.put(x + 2, yb - 10, 'white', .85, .5)
        # the skeleton movement: two pillars, a fretted plate, a white chapter ring
        c.vline(x + 3, yb - 9, yb - 2, 'brass', .6)
        c.vline(x + 8, yb - 9, yb - 2, 'brass', .5)
        c.ellipse(cx_, yb - 9, 2.6, 2.6, 'paper', .85, dith=0)
        c.ellipse(cx_, yb - 9, 1.4, 1.4, 'brass', .6, dith=0)
        c.put(int(cx_), yb - 10, 'black', .2)
        c.put(int(cx_) + 1, yb - 10, 'black', .2)
        c.ellipse(cx_, yb - 4.5, 1.6, 1.6, 'brass', .7, dith=0)
        return (x, yb - 15, x + w, yb)
    if kind == 'lantern':
        w = 7
        c.rect(x + 1, yb - 9, x + w - 1, yb - 1, 'brass', .45, dith=0)
        c.rect(x, yb - 2, x + w, yb, 'brass', .4, dith=0)
        c.rect(x, yb - 10, x + w, yb - 8, 'brass', .6, dith=0)
        c.ellipse(x + 3.5, yb - 12, 2.6, 2, 'brass', .7, dith=0)       # bell
        c.put(x + 3, yb - 15, 'brass', .9)
        clock_face(c, x + 3.5, yb - 5, 2.4, hh, mm, face=face, face_lum=face_lum, rim_w=0, ticks=False)
        return (x, yb - 15, x + w, yb)
    if kind == 'alarm':
        c.ellipse(x + 1.5, yb - 9, 1.8, 1.8, 'chrome', .7, dith=0)
        c.ellipse(x + 6.5, yb - 9, 1.8, 1.8, 'chrome', .6, dith=0)
        c.ellipse(x + 4, yb - 5, 3.6, 3.6, 'chrome', .55, dith=0)
        clock_face(c, x + 4, yb - 5, 2.9, hh, mm, face=face, face_lum=face_lum, rim_w=0, ticks=False)
        c.put(x + 1, yb, 'chrome', .4)
        c.put(x + 6, yb, 'chrome', .4)
        return (x, yb - 11, x + 8, yb)
    # 'square' plain box clock
    c.rect(x, yb - 9, x + 9, yb, case, cl, dith=0)
    c.hline(x, x + 9, yb - 9, case, cl + .25)
    c.vline(x + 8, yb - 9, yb, case, cl - .2)
    c.rect(x + 1, yb - 8, x + 8, yb - 1, face, face_lum - .1, dith=0)
    clock_face(c, x + 4.5, yb - 4.5, 3.2, hh, mm, face=face, face_lum=face_lum, rim_w=0)
    if stopped:
        c.line(x + 2, yb - 7, x + 6, yb - 3, 'white', .95)       # cracked glass
        c.line(x + 6, yb - 3, x + 7, yb - 6, 'white', .9)
    return (x, yb - 9, x + 9, yb)


def pendulum(c, px, py, length, ang_deg, rod='brass', rod_lum=.6, bob='brass', bob_r=2.5, bob_lum=.7):
    a = math.radians(ang_deg)
    bx = px + math.sin(a) * length
    by = py + math.cos(a) * length
    c.line(px, py, bx, by, rod, rod_lum)
    c.ellipse(bx, by, bob_r, bob_r, bob, bob_lum, dith=0)
    c.put(int(bx - bob_r * .4), int(by - bob_r * .4), bob, min(1, bob_lum + .3))
    return bx, by


def panelling(c, x0, y0, x1, y1, ramp_name='d_mahog', lum=.45, pw=20, raised=True, margin=3, seed=0, grain=.04):
    """Frame-and-panel wainscot (frontal)."""
    c.rect(x0, y0, x1, y1, ramp_name, lambda xx, yy: lum + np.sin(xx * 1.7 + np.sin(yy * .3) * 2) * grain * .5,
           dith=.25)
    n = max(1, int(round((x1 - x0) / pw)))
    step = (x1 - x0) / n
    for i in range(n):
        a = int(round(x0 + i * step)) + margin
        b = int(round(x0 + (i + 1) * step)) - margin
        ta, tb = y0 + margin, y1 - margin
        if b - a < 3 or tb - ta < 3:
            continue
        pl = lum + (.04 if raised else -.05)
        c.rect(a, ta, b, tb, ramp_name, lambda xx, yy, pl=pl: pl + np.sin(xx * 2.3 + yy * .15) * grain, dith=.25)
        hi, lo = (lum + .22, lum - .2) if raised else (lum - .2, lum + .18)
        c.hline(a, b, ta, ramp_name, hi)
        c.vline(a, ta, tb, ramp_name, hi - .05)
        c.hline(a, b, tb - 1, ramp_name, lo)
        c.vline(b - 1, ta, tb, ramp_name, lo + .04)


def persian_rug(c, p, X0, X1, Z0, Z1, seed=3, field='red', border='denim', trim='gold'):
    fuv = floor_uv(p)
    pts = p.quad([(X0, 0, Z0), (X1, 0, Z0), (X1, 0, Z1), (X0, 0, Z1)])
    m, r = c.poly_mask(pts)
    if m is None:
        return pts
    yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32)
    X, Z, s = fuv(xx + .5, yy + .5)
    u = (X - X0) / (X1 - X0)
    v = (Z - Z0) / (Z1 - Z0)
    bw = 6.0
    du = np.minimum(X - X0, X1 - X)
    dz = np.minimum(Z - Z0, Z1 - Z)
    db = np.minimum(du, dz * 1.0)
    N = noise2(c.w, c.h, 2, seed, 2)
    nz = (N[np.clip(yy.astype(int), 0, c.h - 1), np.clip(xx.astype(int), 0, c.w - 1)] - .5) * .18
    # field with a central medallion and a lattice motif
    cu, cv = (u - .5) * 2, (v - .5) * 2
    med = (np.abs(cu) * 1.0 + np.abs(cv) * 1.25) < .55
    med_in = (np.abs(cu) * 1.0 + np.abs(cv) * 1.25) < .32
    lat = ((np.floor(X / 5) + np.floor(Z / 4)) % 2 == 0)
    Lf = np.where(lat, .5, .42) + nz
    c._apply(m, field, Lf, dith=.3, region=r)
    c._apply(m & med & ~med_in, border, .5 + nz, dith=.3, region=r)
    c._apply(m & med_in, field, .66 + nz, dith=.3, region=r)
    c._apply(m & (db < bw), border, .45 + np.where(((np.floor(X / 3) + np.floor(Z / 3)) % 2) == 0, .08, -.04) + nz,
             dith=.3, region=r)
    c._apply(m & (np.abs(db - bw) < .9), trim, .55 + nz, dith=0, region=r)
    c._apply(m & (db < 1.2), trim, .45 + nz, dith=0, region=r)
    return pts


# --------------------------------------------------------------- anim helpers ----
def snapshot(c, x0, y0, x1, y1):
    """Copy a region of the paint buffers (before drawing something that will move in an anim)."""
    x0, y0, x1, y1 = c.clip_region(x0, y0, x1, y1)
    sl = (slice(y0, y1), slice(x0, x1))
    return dict(region=(x0, y0, x1, y1), rid=c.rid[sl].copy(), lum=c.lum[sl].copy(), emis=c.emis[sl].copy(),
                dith=c.dith[sl].copy())


def restore(cc, snap):
    """Paint a snapshot back into an anim frame canvas, owned by the frame (so it covers the static copy)."""
    x0, y0, x1, y1 = snap['region']
    sl = (slice(y0, y1), slice(x0, x1))
    cc.rid[sl] = snap['rid']
    cc.lum[sl] = snap['lum']
    cc.emis[sl] = snap['emis']
    cc.dith[sl] = snap['dith']
    if hasattr(cc, 'owner'):
        cc.owner[sl] = cc.cur_owner
