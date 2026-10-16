"""Group-b shared props and helpers (Blue Lantern, cellar, tunnel, Pier 9, cold store, Calypso).

Everything here draws onto a core.Canvas through its primitives.  Ramps registered here are
prefixed 'b_'.
"""
from __future__ import annotations

import copy
import math

import numpy as np

import os

from core import ramp, RAMPS, BAYER4, noise2, vgrad, hgrad, radial, save_png
from scene import Scene

# ------------------------------------------------------------------ ramps (b_*) ----
ramp('b_velvet', '#05060f', '#090b1c', '#0e122b', '#141a3d', '#1b2452', '#243069', '#2f3f82', '#3e529c', '#5169b5')
ramp('b_club', '#06080f', '#0b0f1c', '#10172a', '#162039', '#1d2a49', '#26365b', '#31446d', '#3f5580', '#516a94')
ramp('b_smoke', '#1a2136', '#232c45', '#2d3854', '#384563', '#455373', '#536284', '#647596', '#7a8ba9')
ramp('b_char', '#060505', '#0d0a09', '#15100e', '#1e1613', '#291d17', '#35251c', '#432e21', '#553a28')
ramp('b_frost', '#1c2c40', '#2a3e56', '#3a526d', '#4d6884', '#62809c', '#7b99b3', '#97b3c9', '#b6cede', '#d4e5ef',
     '#eef7fb')
ramp('b_fish', '#141a20', '#20282f', '#2e3740', '#3e4852', '#505b66', '#65707b', '#7d8892', '#98a2ab', '#b7c0c7')
ramp('b_sodium', '#2b1404', '#4a2207', '#70340b', '#9a4b10', '#c46a18', '#e48d26', '#f7b043', '#ffd27a', '#fff0c0')
ramp('b_dawn', '#1f1530', '#33203f', '#4c2a4e', '#6a3557', '#8c435e', '#ad5663', '#c96f69', '#df8d72', '#eeae80',
     '#f7cd95', '#fde9bd')
ramp('b_dawnwater', '#120d1a', '#1d1528', '#2a1d36', '#3a2642', '#4d304b', '#643d52', '#7d4d58', '#985f5f', '#b47766',
     '#d09676')
ramp('b_overcast', '#3d454c', '#4b545b', '#5b636a', '#6b737a', '#7c848a', '#8f969b', '#a2a9ad', '#b6bbbe', '#c9cdcf',
     '#dcdfe0')
ramp('b_daywater', '#1a2227', '#222c32', '#2b373e', '#36434a', '#425057', '#4f5e65', '#5e6d73', '#6f7e83', '#839195')
ramp('b_dayfog', '#4a5258', '#596167', '#697177', '#7a8187', '#8b9298', '#9da3a8', '#afb4b8', '#c1c5c8')
ramp('b_lanternglass', '#0a1430', '#10204a', '#183068', '#22448a', '#2f5aa8', '#4274c2', '#5e90d8', '#84afe8', '#b4d2f6')
ramp('b_bottle_g', '#04100a', '#082014', '#0e3220', '#16472e', '#205e3c', '#2d784c', '#40935f', '#5fb07a')
ramp('b_bottle_a', '#140803', '#271106', '#3f1c09', '#5a2a0d', '#7a3c12', '#9c521a', '#bf6c25', '#de8c35', '#f2b05a')
ramp('b_mural_sea', '#0a1a1c', '#0f2629', '#163437', '#1f4446', '#2a5555', '#376664', '#477873', '#5a8a83')
ramp('b_hull', '#0b0c0d', '#141618', '#1d2023', '#272b2f', '#32373c', '#3e444a', '#4b5259', '#596169', '#69727a')
ramp('b_paint', '#26282a', '#383b3d', '#4c4f50', '#616463', '#777977', '#8d8e8a', '#a3a39d', '#b8b7b0', '#cccac1')
ramp('b_ember', '#1a0402', '#3a0a03', '#621405', '#8e2307', '#b8380a', '#dc5612', '#f27d22', '#fcab45', '#ffd889')
ramp('b_weathered', '#16130f', '#221e19', '#2f2a23', '#3e382f', '#4e463b', '#5f5648', '#716756', '#857a66', '#9a8f78')
ramp('b_warmsteel', '#120e0c', '#1f1915', '#2d2520', '#3c322a', '#4d4035', '#5f4f41', '#73614f', '#88745f', '#9f8a72')
ramp('b_tarp', '#0f120b', '#181c11', '#222818', '#2d3520', '#394329', '#465133', '#55613e', '#66724b')


def H(a, b):
    """Deterministic hash -> [0,1) for integer arrays/scalars."""
    v = np.sin(np.asarray(a, np.float64) * 12.9898 + np.asarray(b, np.float64) * 78.233) * 43758.5453
    return (v - np.floor(v)).astype(np.float32)


def bayer(w, h, x0=0, y0=0):
    b = np.tile(BAYER4, (h // 4 + 2, w // 4 + 2))
    return b[y0 % 4:y0 % 4 + h, x0 % 4:x0 % 4 + w]


# ------------------------------------------------------------------------- font ----
_G = {
    'A': ['.#.', '#.#', '###', '#.#', '#.#'], 'B': ['##.', '#.#', '##.', '#.#', '##.'],
    'C': ['.##', '#..', '#..', '#..', '.##'], 'D': ['##.', '#.#', '#.#', '#.#', '##.'],
    'E': ['###', '#..', '##.', '#..', '###'], 'F': ['###', '#..', '##.', '#..', '#..'],
    'G': ['.##', '#..', '#.#', '#.#', '.##'], 'H': ['#.#', '#.#', '###', '#.#', '#.#'],
    'I': ['###', '.#.', '.#.', '.#.', '###'], 'J': ['..#', '..#', '..#', '#.#', '.#.'],
    'K': ['#.#', '#.#', '##.', '#.#', '#.#'], 'L': ['#..', '#..', '#..', '#..', '###'],
    'M': ['#...#', '##.##', '#.#.#', '#...#', '#...#'], 'N': ['#..#', '##.#', '#.##', '#..#', '#..#'],
    'O': ['###', '#.#', '#.#', '#.#', '###'], 'P': ['##.', '#.#', '##.', '#..', '#..'],
    'Q': ['###', '#.#', '#.#', '##.', '.##'], 'R': ['##.', '#.#', '##.', '#.#', '#.#'],
    'S': ['.##', '#..', '.#.', '..#', '##.'], 'T': ['###', '.#.', '.#.', '.#.', '.#.'],
    'U': ['#.#', '#.#', '#.#', '#.#', '###'], 'V': ['#.#', '#.#', '#.#', '#.#', '.#.'],
    'W': ['#...#', '#...#', '#.#.#', '##.##', '#...#'], 'X': ['#.#', '#.#', '.#.', '#.#', '#.#'],
    'Y': ['#.#', '#.#', '.#.', '.#.', '.#.'], 'Z': ['###', '..#', '.#.', '#..', '###'],
    '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#', '##', '.#', '.#', '.#'],
    '2': ['##.', '..#', '.#.', '#..', '###'], '3': ['##.', '..#', '.#.', '..#', '##.'],
    '4': ['#.#', '#.#', '###', '..#', '..#'], '5': ['###', '#..', '##.', '..#', '##.'],
    '6': ['.##', '#..', '###', '#.#', '###'], '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'], '9': ['###', '#.#', '###', '..#', '##.'],
    '-': ['..', '..', '##', '..', '..'], '.': ['.', '.', '.', '.', '#'], ':': ['.', '#', '.', '#', '.'],
    '/': ['..#', '..#', '.#.', '#..', '#..'], '!': ['#', '#', '#', '.', '#'], "'": ['#', '#', '.', '.', '.'],
    ',': ['.', '.', '.', '#', '#'], ' ': ['..', '..', '..', '..', '..'], '#': ['#.#', '###', '#.#', '###', '#.#'],
    '°': ['##', '##', '..', '..', '..'], '+': ['...', '.#.', '###', '.#.', '...'],
    '|': ['#', '#', '#', '#', '#'],
}
_G['—'] = ['....', '....', '####', '....', '....']


def text_width(s, spacing=1, scale=1):
    w = 0
    for ch in s.upper():
        g = _G.get(ch, _G[' '])
        w += (len(g[0]) + spacing) * scale
    return max(0, w - spacing * scale)


def text(c, x, y, s, ramp_name, lum, emis=0.0, mirror=False, scale=1, spacing=1, wear=0.0, seed=0,
         center=False, narrow_i=False):
    """Draw text with the 3x5 font. Returns the width.  wear drops random pixels (stencil paint)."""
    s = s.upper()
    if narrow_i:
        s = s.replace('I', '|')
    w = text_width(s, spacing, scale)
    if center:
        x = x - w // 2
    rng = np.random.default_rng(seed)
    cx = 0
    pix = []
    for ch in s:
        g = _G.get(ch, _G[' '])
        gw = len(g[0])
        for r, row in enumerate(g):
            for k, v in enumerate(row):
                if v == '#':
                    for a in range(scale):
                        for b in range(scale):
                            pix.append((cx + k * scale + a, r * scale + b))
        cx += (gw + spacing) * scale
    for (px, py) in pix:
        if wear and rng.random() < wear:
            continue
        xx = x + (w - 1 - px if mirror else px)
        c.put(xx, y + py, ramp_name, lum, emis)
    return w


# -------------------------------------------------------------- ordered dither veils ----
def veil(c, x0, y0, x1, y1, density, ramp_name, lum, emis=None, dith=0.0):
    """Ordered-dither overlay: pixel is replaced where density(xx,yy) > bayer threshold.
    density and lum may be callables (absolute coords) or constants."""
    r = c.clip_region(x0, y0, x1, y1)
    if r[2] <= r[0] or r[3] <= r[1]:
        return
    hh, ww = r[3] - r[1], r[2] - r[0]
    yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
    xx += r[0]
    yy += r[1]
    d = density(xx, yy) if callable(density) else np.full(xx.shape, density, np.float32)
    b = bayer(ww, hh, r[0], r[1])
    m = d > b
    if not m.any():
        return
    c._apply(m, ramp_name, lum, emis=emis, dith=dith, region=r)


def fog_strokes(c, x0, x1, y0, y1, n, ramp_name, lum, seed=1, rx=(12, 40), ry=(.8, 2.2), dl=.05, dith=.35,
                emis=None, taper=None):
    """Painted fog: many thin horizontal ellipses (wisps).  taper(y)->0..1 scales lum offset by height."""
    rng = np.random.default_rng(seed)
    for _ in range(n):
        cx = rng.uniform(x0, x1)
        cy = rng.uniform(y0, y1)
        a = rng.uniform(*rx)
        b = rng.uniform(*ry)
        L = lum + rng.uniform(-dl, dl)
        if taper is not None:
            L = L * taper(cy)
        c.ellipse(cx, cy, a, b, ramp_name, L - .03, dith=dith, emis=emis)
        if b > 1.1:
            c.ellipse(cx + a * .1, cy - b * .2, a * .55, max(.6, b * .45), ramp_name, L + .04, dith=dith, emis=emis)


def fog_band(c, x0, y0, x1, y1, yc, thick, peak, ramp_name='fog', lum=.5, seed=3, scale=26, emis=None,
             lum_fn=None):
    """Horizontal fog bank centred on yc: density peaks at yc and fades over thick, broken by noise."""
    N = noise2(c.w, c.h, scale, seed, 3)

    def dens(xx, yy):
        t = np.clip(1 - np.abs(yy - yc) / thick, 0, 1)
        xi = np.clip(xx.astype(int), 0, c.w - 1)
        yi = np.clip(yy.astype(int), 0, c.h - 1)
        return peak * t * (0.35 + 1.1 * N[yi, xi])
    veil(c, x0, y0, x1, y1, dens, ramp_name, lum_fn or lum, emis=emis)


# ---------------------------------------------------------------- structured walls ----
def bricks(c, x0, y0, x1, y1, ramp_name='brick', bw=8, bh=4, base=.45, var=.1, mortar=.22, seed=1,
           grime=.1, light_top=.05, mask=None, emis=None, dith=None, off=0):
    """Frontal brick wall, running bond. mask: optional fn(xx,yy)->bool to restrict."""
    N = noise2(c.w, c.h, 18, seed + 7, 3)

    def fn(xx, yy):
        ry = np.floor((yy - y0) / bh)
        sh = (ry % 2) * (bw / 2) + off
        rx = np.floor((xx - x0 + sh) / bw)
        fx = (xx - x0 + sh) - rx * bw
        fy = (yy - y0) - ry * bh
        hsh = H(rx + seed * 31, ry + seed * 17)
        L = base + (hsh - .5) * 2 * var
        L = L + np.where(fy < 1.5, light_top, 0) + np.where(fy >= bh - 1, -.04, 0)
        L = np.where((fy < 1) | (fx < 1), mortar, L)
        xi = np.clip(xx.astype(int), 0, c.w - 1)
        yi = np.clip(yy.astype(int), 0, c.h - 1)
        return L - (N[yi, xi] - .5) * 2 * grime
    r = c.clip_region(x0, y0, x1, y1)
    if r[2] <= r[0] or r[3] <= r[1]:
        return
    if mask is None:
        c.rect(x0, y0, x1, y1, ramp_name, fn, emis=emis, dith=dith)
    else:
        hh, ww = r[3] - r[1], r[2] - r[0]
        yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
        xx += r[0]
        yy += r[1]
        m = mask(xx + .5, yy + .5)
        c._apply(m, ramp_name, fn, emis=emis, dith=dith, region=r)


def planks_h(c, x0, y0, x1, y1, ramp_name='wood', ph=4, base=.45, var=.08, seam=.2, seed=2, joint_every=40,
             grain=.03, dith=None, emis=None):
    """Horizontal boards with staggered butt joints."""
    def fn(xx, yy):
        k = np.floor((yy - y0) / ph)
        fy = (yy - y0) - k * ph
        L = base + (H(k, seed) - .5) * 2 * var
        L = L + np.sin(xx * .9 + k * 5.1) * grain + np.sin(xx * .23 + k) * grain
        jx = (xx - x0 + H(k, seed + 3) * joint_every) % joint_every
        L = np.where(fy < 1, seam, L)
        L = np.where(jx < 1, seam + .04, L)
        L = np.where((fy >= 1) & (fy < 2), L + .04, L)
        return L
    c.rect(x0, y0, x1, y1, ramp_name, fn, dith=dith, emis=emis)


def planks_v(c, x0, y0, x1, y1, ramp_name='wood', pw=5, base=.45, var=.08, seam=.2, seed=2, grain=.03,
             dith=None, emis=None, lit_edge=.05):
    def fn(xx, yy):
        k = np.floor((xx - x0) / pw)
        fx = (xx - x0) - k * pw
        L = base + (H(k, seed) - .5) * 2 * var
        L = L + np.sin(yy * .7 + k * 3.3) * grain
        L = np.where(fx < 1, seam, L)
        L = np.where((fx >= 1) & (fx < 2), L + lit_edge, L)
        return L
    c.rect(x0, y0, x1, y1, ramp_name, fn, dith=dith, emis=emis)


def frost_edge(c, x0, y0, x1, y1, seed=4, amount=.6, ramp_name='b_frost', lum=.75, top=True, scale=3):
    """Ragged frost crust along the top (or bottom) edge of a region."""
    N = noise2(c.w, c.h, scale, seed, 2)

    def dens(xx, yy):
        t = (yy - y0) / max(1, (y1 - y0))
        t = 1 - t if top else t
        xi = np.clip(xx.astype(int), 0, c.w - 1)
        yi = np.clip(yy.astype(int), 0, c.h - 1)
        return amount * (t ** 1.5) * (0.5 + N[yi, xi])
    veil(c, x0, y0, x1, y1, dens, ramp_name, lum, dith=0.3)


# ------------------------------------------------------------------- 3-D helpers ----
def rbox(c, p, cxw, czw, w, d, y0, y1, ang, ramp_name, lum_front=.55, lum_side=.38, lum_top=.75,
         faces_fn=None, back=False):
    """Box rotated by ang (deg) about the vertical axis, centred at world (cxw, czw).
    Local u axis (width w) is rotated from +X towards +Z by ang.  Returns dict of visible face polys
    keyed by 'u+','u-','v+','v-','top' (v+ = the face whose normal points to +Z at ang=0)."""
    a = math.radians(ang)
    ux, uz = math.cos(a), math.sin(a)
    vx, vz = -math.sin(a), math.cos(a)

    def corner(su, sv, y):
        X = cxw + ux * su * w / 2 + vx * sv * d / 2
        Z = czw + uz * su * w / 2 + vz * sv * d / 2
        return (X, y, Z)
    cam = (p.cx, p.E, p.D)
    faces = {
        'v+': ([(-1, 1), (1, 1)], (vx, vz)),
        'v-': ([(1, -1), (-1, -1)], (-vx, -vz)),
        'u+': ([(1, 1), (1, -1)], (ux, uz)),
        'u-': ([(-1, -1), (-1, 1)], (-ux, -uz)),
    }
    out = {}
    order = []
    for k, (cs, (nx, nz)) in faces.items():
        pts3 = [corner(cs[0][0], cs[0][1], y0), corner(cs[1][0], cs[1][1], y0),
                corner(cs[1][0], cs[1][1], y1), corner(cs[0][0], cs[0][1], y1)]
        mx = sum(q[0] for q in pts3) / 4
        mz = sum(q[2] for q in pts3) / 4
        vis = (cam[0] - mx) * nx + (cam[2] - mz) * nz > 0
        if vis or back:
            order.append((mz, k, pts3))
    order.sort()
    for mz, k, pts3 in order:
        pts = p.quad(pts3)
        L = lum_front if k == 'v+' else lum_side
        if faces_fn and k in faces_fn:
            L = faces_fn[k]
        c.poly(pts, ramp_name, L)
        out[k] = (pts, pts3)
    if y1 < p.E:
        pts3 = [corner(-1, -1, y1), corner(1, -1, y1), corner(1, 1, y1), corner(-1, 1, y1)]
        pts = p.quad(pts3)
        c.poly(pts, ramp_name, faces_fn.get('top', lum_top) if faces_fn else lum_top)
        out['top'] = (pts, pts3)
    return out


def lerp3(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def face_point(p, pts3, u, v):
    """Point on a quad face (pts3 = 4 corners bottom-left, bottom-right, top-right, top-left) at (u,v)."""
    bot = lerp3(pts3[0], pts3[1], u)
    top = lerp3(pts3[3], pts3[2], u)
    return p.P(*lerp3(bot, top, v))


# ------------------------------------------------------------------- mask helpers ----
def mask_of(c, shapes):
    """Full-canvas bool mask from shapes: ('poly', pts) | ('ellipse', cx, cy, rx, ry) | ('rect', x0, y0, x1, y1)."""
    full = np.zeros((c.h, c.w), bool)
    for sh in shapes:
        if sh[0] == 'poly':
            m, r = c.poly_mask(sh[1])
        elif sh[0] == 'ellipse':
            m, r = c.ellipse_mask(*sh[1:])
        else:
            x0, y0, x1, y1 = sh[1:]
            r = c.clip_region(x0, y0, x1, y1)
            m = np.ones((max(0, r[3] - r[1]), max(0, r[2] - r[0])), bool) if r[2] > r[0] and r[3] > r[1] else None
        if m is not None:
            full[r[1]:r[3], r[0]:r[2]] |= m
    return full


def apply_mask(c, m, ramp_name, lum, emis=None, dith=None):
    if not m.any():
        return
    c._apply(m, ramp_name, lum, emis=emis, dith=dith)


def outline_mask(m):
    """Pixels of m with at least one 4-neighbour outside m."""
    e = np.zeros_like(m)
    for ax, sh in ((0, 1), (0, -1), (1, 1), (1, -1)):
        e |= m & ~np.roll(m, sh, axis=ax)
    return e


# ------------------------------------------------------------------------- props ----
def cylinder(c, cx, top_y, bot_y, rx, ry, ramp_name, lum=.5, light=-1.0, k=.28, top_lum=None, rim=True,
             emis=None, dith=None, top=True):
    """Upright cylinder in screen space (oil drum, piling, tub, bollard). light=-1: lit from the left."""
    def body(xx, yy):
        u = np.clip((xx + .5 - cx) / max(rx, .5), -1, 1)
        return lum + (-u if light < 0 else u) * k - .12 * u * u
    c.rect(cx - rx, top_y, cx + rx, bot_y, ramp_name, body, emis=emis, dith=dith)
    c.ellipse(cx, bot_y, rx, ry, ramp_name, body, emis=emis, dith=dith)
    if top:
        tl = lum + .2 if top_lum is None else top_lum
        c.ellipse(cx, top_y, rx, ry, ramp_name, tl, emis=emis, dith=dith)
        if rim:
            full = mask_of(c, [('ellipse', cx, top_y, rx, ry)])
            full &= ~mask_of(c, [('ellipse', cx, top_y + .6, rx - 1, max(ry - 1, .5))])
            apply_mask(c, full, ramp_name, tl + .12, emis=emis, dith=0)


def barrel(c, cx, by, rw, h, ramp_name='oak', lum=.5, hoop='steel', hoop_lum=.45, light=-1, staves=7,
           top=True, eye_ry=.28, dark=0.0, chalk=None):
    """Upright barrel (bulging), x centre cx, floor contact by."""
    y0 = by - h
    r = c.clip_region(cx - rw - 1, y0 - rw * eye_ry - 1, cx + rw + 2, by + rw * eye_ry + 2)
    if r[2] <= r[0] or r[3] <= r[1]:
        return
    hh, ww = r[3] - r[1], r[2] - r[0]
    yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
    xx += r[0] + .5
    yy += r[1] + .5
    t = np.clip((yy - y0) / h, 0, 1)
    hw = rw * (0.84 + 0.16 * np.sin(np.pi * t))
    u = (xx - cx) / hw
    hb = rw * .84
    body = (np.abs(u) <= 1) & (yy >= y0) & (yy <= by)
    cap = (((xx - cx) / hb) ** 2 + ((yy - by) / max(hb * eye_ry, .5)) ** 2 <= 1)
    inside = body | cap
    uu = np.clip((xx - cx) / np.where(yy > by, hb, hw), -1, 1)
    ang = np.arcsin(uu)
    L = lum + (-uu if light < 0 else uu) * .22 - .14 * uu * uu - dark
    st = (ang / np.pi * staves) % 1.0
    L = np.where(st < .12, L - .14, L)
    L = L + np.sin(yy * 1.7 + np.floor(ang / np.pi * staves) * 5) * .015
    c._apply(inside, ramp_name, L, region=r)
    # hoops (curved down in the middle: viewed from above)
    for tt in (.1, .3, .7, .9):
        yh = y0 + h * tt
        hwt = rw * (0.84 + 0.16 * math.sin(math.pi * tt))
        for x in range(int(math.floor(cx - hwt)), int(math.ceil(cx + hwt)) + 1):
            uu1 = (x + .5 - cx) / hwt
            if abs(uu1) > 1:
                continue
            dy = hwt * eye_ry * math.sqrt(max(0, 1 - uu1 * uu1)) * .9
            yy1 = int(round(yh + dy))
            Lh = hoop_lum + (-uu1 if light < 0 else uu1) * .22 - .1 * uu1 * uu1 - dark
            c.put(x, yy1, hoop, Lh)
            c.put(x, yy1 + 1, hoop, Lh - .15)
    if top:
        hwt = rw * .84
        c.ellipse(cx, y0, hwt, hwt * eye_ry, ramp_name, lum - .08 - dark)
        c.ellipse(cx, y0 + .3, hwt - 1.5, max(hwt * eye_ry - 1, .6), ramp_name, lum + .08 - dark)
        for k in (-1, 1):
            c.hline(int(cx - hwt * .7), int(cx + hwt * .7), int(round(y0 + k * hwt * eye_ry * .35)), ramp_name,
                    lum - .12 - dark)
        c.put(int(cx + hwt * .3), int(y0), 'black', .3)
    if chalk:
        text(c, int(cx - text_width(chalk) / 2), int(y0 + h * .42), chalk, 'paper', .62 - dark, wear=.15, seed=3)


def barrel_end(c, cx, cy, r, ramp_name='oak', lum=.5, hoop='steel', light=-1, chalk=None, dark=0.0):
    """Barrel lying down, end facing the camera."""
    c.ellipse(cx, cy, r, r, hoop, .3 - dark)
    c.ellipse(cx, cy, r - 1, r - 1, ramp_name, radial(cx - r * .3 * (-light), cy - r * .3, r * 1.6, lum + .14 - dark,
                                                     lum - .2 - dark))
    for k in range(-2, 3):
        y = int(round(cy + k * r * .38))
        hw = math.sqrt(max(0, (r - 1) ** 2 - (y + .5 - cy) ** 2))
        c.hline(int(cx - hw + 1), int(cx + hw), y, ramp_name, lum - .22 - dark)
    # croze ring highlight
    for a in np.linspace(math.pi * 1.05, math.pi * 1.6, 8):
        c.put(int(round(cx + math.cos(a) * (r - 1))), int(round(cy + math.sin(a) * (r - 1))), hoop, .7 - dark)
    c.put(int(cx + r * .35), int(cy + r * .35), 'black', .2)
    if chalk:
        text(c, int(cx - text_width(chalk) / 2), int(cy - 2), chalk, 'paper', .7 - dark, wear=.2, seed=5)


def crate_box(c, p, X0, X1, Y0, Y1, Z0, Z1, ramp_name='oak', lum=.5, stencil=None, stencil_ramp='ink',
              stencil_lum=.2, seed=1, boards=4, brace=True, dark=0.0, stencil2=None, stencil_scale=1,
              side_lum=None, top_lum=None):
    """Wooden crate as a perspective box with boards, corner battens, diagonal brace and stencil."""
    d = p.box(c, X0, X1, Y0, Y1, Z0, Z1, ramp_name, front=lum - dark, top=(top_lum or lum + .18) - dark,
              side=(side_lum or lum - .16) - dark)
    fx0, fy0, fx1, fy1 = p.front_rect(X0, X1, Y0, Y1, Z1)
    fx0, fy0, fx1, fy1 = int(round(fx0)), int(round(fy0)), int(round(fx1)), int(round(fy1))
    hgt = fy1 - fy0
    for k in range(1, boards):
        y = fy0 + hgt * k // boards
        c.hline(fx0, fx1, y, ramp_name, lum - .25 - dark)
    rng = np.random.default_rng(seed)
    for k in range(boards):
        ya = fy0 + hgt * k // boards + 1
        yb = fy0 + hgt * (k + 1) // boards
        c.rect(fx0, ya, fx1, yb, ramp_name, lum + (rng.random() - .5) * .1 - dark, dith=.3)
        c.hline(fx0, fx1, ya, ramp_name, lum + .06 - dark)
    bw = max(2, (fx1 - fx0) // 9)
    c.rect(fx0, fy0, fx0 + bw, fy1, ramp_name, lum + .08 - dark)
    c.rect(fx1 - bw, fy0, fx1, fy1, ramp_name, lum - .02 - dark)
    c.vline(fx0 + bw, fy0, fy1, ramp_name, lum - .25 - dark)
    c.vline(fx1 - bw - 1, fy0, fy1, ramp_name, lum - .25 - dark)
    c.hline(fx0, fx1, fy0, ramp_name, lum + .16 - dark)
    if brace:
        c.line(fx0 + bw, fy1 - 2, fx1 - bw - 1, fy0 + 1, ramp_name, lum + .1 - dark)
        c.line(fx0 + bw, fy1 - 1, fx1 - bw - 1, fy0 + 2, ramp_name, lum - .2 - dark)
    for (nx, ny) in ((fx0 + 1, fy0 + 1), (fx1 - 2, fy0 + 1), (fx0 + 1, fy1 - 2), (fx1 - 2, fy1 - 2)):
        c.put(nx, ny, 'steel', .6 - dark)
    if stencil:
        cy = (fy0 + fy1) // 2 - (3 if stencil2 else 2) * stencil_scale
        text(c, (fx0 + fx1) // 2, cy, stencil, stencil_ramp, stencil_lum, wear=.06, seed=seed, center=True,
             scale=stencil_scale)
        if stencil2:
            text(c, (fx0 + fx1) // 2, cy + 6 * stencil_scale, stencil2, stencil_ramp, stencil_lum, wear=.06,
                 seed=seed + 1, center=True, scale=stencil_scale)
    return (fx0, fy0, fx1, fy1)


def bottle(c, x, by, h=9, ramp_name='b_bottle_g', lum=.45, emis=0.0, neck=3, w=3, label=None, label_lum=.6,
           hl=True, shape='wine'):
    """Bottle silhouette standing at (x, by): body w wide, neck 1px."""
    body_top = by - h + neck + 1
    if shape == 'flask':
        c.rect(x - w // 2, body_top, x - w // 2 + w, by, ramp_name, lum, emis=emis, dith=0)
    else:
        c.rect(x - w // 2, body_top + 1, x - w // 2 + w, by, ramp_name, lum, emis=emis, dith=0)
        if w >= 3:
            c.rect(x - w // 2 + 1, body_top, x - w // 2 + w - 1, body_top + 1, ramp_name, lum, emis=emis, dith=0)
    c.vline(x, by - h, body_top + 1, ramp_name, lum - .05, emis=emis)
    c.put(x, by - h, 'cream' if shape != 'flask' else ramp_name, .35)
    if hl:
        c.vline(x - w // 2, body_top + 1, by - 1, ramp_name, min(1, lum + .3), emis=emis)
    if label:
        c.rect(x - w // 2, by - h // 2 - 1, x - w // 2 + w, by - h // 2 + 1, label, label_lum, emis=emis * .5, dith=0)


def paper_lantern(c, x, y, r=5, ramp_name='b_lanternglass', lum=.7, emis=.9, string_top=0, string_ramp='ink',
                  ribs=True, tassel=True):
    """Round paper lantern centred (x,y) hanging from a string."""
    c.vline(x, string_top, int(y - r * .9), string_ramp, .35)
    ry = r * .92
    c.ellipse(x, y, r, ry, ramp_name, radial(x - r * .25, y - ry * .2, r * 1.25, lum + .2, lum - .25), emis=emis,
              dith=.4)
    if ribs:
        for k in range(-2, 3):
            yy = int(round(y + k * ry * .42))
            hw = r * math.sqrt(max(0, 1 - ((yy + .5 - y) / ry) ** 2))
            c.hline(int(round(x - hw + 1)), int(round(x + hw)), yy, ramp_name, lum - .2, emis=emis * .8)
    c.rect(x - 1, int(y - ry) - 1, x + 2, int(y - ry) + 1, 'ink', .4)
    c.rect(x - 1, int(y + ry), x + 2, int(y + ry) + 1, 'ink', .4)
    if tassel:
        c.vline(x, int(y + ry) + 1, int(y + ry) + 4, 'neonred', .5)


def cigarette_glow(c, x, y):
    c.put(x, y, 'b_ember', .9, emis=1)


def seated_patron(c, x, by, facing=1, ramp_name='b_club', lum=.18, rim='b_smoke', rim_lum=.55, hat=True,
                  woman=False, smoke=False, scale=1.0, rim_dir=None):
    """Silhouette of a seated figure from the waist up (at a table). x = centre, by = table-top y.
    rim_dir: +1/-1 side that catches the light (default = facing)."""
    s = scale
    f = facing
    tw, th = 7 * s, 12 * s
    hx = x + f * 1 * s
    hy = by - th - 4.5 * s
    shapes = [('poly', [(x - tw / 2, by), (x + tw / 2, by), (x + tw / 2 - 1 * s, by - th),
                        (x - tw / 2 + 1 * s, by - th)]),
              ('poly', [(x - tw / 2 - 1 * s, by - th + 3 * s), (x - tw / 2 + 2 * s, by - th - 1 * s),
                        (x + tw / 2 - 2 * s, by - th - 1 * s), (x + tw / 2 + 1 * s, by - th + 3 * s)]),
              ('rect', hx - 1 * s, hy + 1 * s, hx + 1.5 * s, by - th + 1),
              ('ellipse', hx, hy, 2.6 * s, 3.1 * s),
              ('poly', [(x + f * 2 * s, by - th + 4 * s), (x + f * 3.5 * s, by - th + 3 * s),
                        (x + f * 6 * s, by - 1), (x + f * 4 * s, by)])]
    if hat and not woman:
        shapes += [('rect', hx - 4 * s, hy - 2.4 * s, hx + 4 * s + 1, hy - 1.4 * s),
                   ('rect', hx - 2.6 * s, hy - 5.2 * s, hx + 2.6 * s + 1, hy - 2 * s)]
    if woman:
        shapes += [('ellipse', hx - f * 1 * s, hy - .5 * s, 3.4 * s, 3.4 * s),
                   ('ellipse', hx - f * 2.5 * s, hy + 2 * s, 2.2 * s, 2.6 * s)]
    m = mask_of(c, shapes)
    apply_mask(c, m, ramp_name, lum, dith=.2)
    d = f if rim_dir is None else rim_dir
    edge = m & ~np.roll(m, -d, axis=1)
    apply_mask(c, edge, rim, rim_lum, dith=0)
    top = m & ~np.roll(m, 1, axis=0)
    apply_mask(c, top & ~edge, rim, rim_lum - .15, dith=0)
    if hat and not woman:
        c.hline(int(hx - 2.6 * s), int(hx + 2.6 * s + 1), int(hy - 2.4 * s), 'neonblue', .3)
    if woman:
        c.put(int(hx + f * 2 * s), int(hy + 3 * s), 'cream', .55)
    if smoke:
        cigarette_glow(c, int(x + f * 6 * s), int(by - 2))
    return m


def figure_standing_sil(c, x, by, hgt=40, ramp_name='b_club', lum=.15, facing=1, hat=True):
    """Simple standing silhouette (for distant figures, feet at by)."""
    s = hgt / 50.0
    c.poly([(x - 4 * s, by), (x + 4 * s, by), (x + 5 * s, by - 30 * s), (x + 4 * s, by - 38 * s),
            (x - 4 * s, by - 38 * s), (x - 5 * s, by - 30 * s)], ramp_name, lum)
    c.ellipse(x + facing * .5 * s, by - 42 * s, 3 * s, 3.6 * s, ramp_name, lum)
    if hat:
        c.rect(x - 5 * s, by - 45 * s, x + 5 * s + 1, by - 44 * s, ramp_name, lum)
        c.rect(x - 3 * s, by - 48 * s, x + 3 * s + 1, by - 44 * s, ramp_name, lum)


def gull_perched(c, x, by, ramp_name='white', lum=.7, facing=1, emis=0.0, dark=0.0):
    """Small perched gull, feet at (x, by), ~5px tall."""
    f = facing
    c.rect(x - 2, by - 3, x + 2, by - 1, ramp_name, lum - dark, emis=emis)          # body
    c.put(x + 2 * f if f > 0 else x - 3, by - 2, ramp_name, lum - .1 - dark, emis=emis)
    c.rect(x - 2 * f if f > 0 else x + 1, by - 3, x - 2 * f + 2 if f > 0 else x + 3, by - 2, 'slate', .35 - dark,
           emis=emis)  # wing tips grey
    c.put(x + f * 1, by - 4, ramp_name, lum + .05 - dark, emis=emis)               # head
    c.put(x + f * 2, by - 4, ramp_name, lum - dark, emis=emis)
    c.put(x + f * 3, by - 4, 'gold', .7 - dark, emis=emis)                         # beak
    c.put(x - f * 3, by - 2, 'slate', .3 - dark, emis=emis)                        # tail
    c.put(x, by, 'gold', .4 - dark, emis=emis)


def gull_flying(c, x, y, phase, ramp_name='white', lum=.7, emis=0.0, s=1):
    """Gull in flight: phase 0 = wings up, 1 = level, 2 = down."""
    c.put(x, y, ramp_name, lum, emis=emis)
    c.put(x + 1, y, ramp_name, lum, emis=emis)
    if phase == 0:
        pts = [(-1, -1), (-2, -2), (-3, -2), (2, -1), (3, -2), (4, -2)]
    elif phase == 1:
        pts = [(-1, 0), (-2, 0), (-3, -1), (2, 0), (3, 0), (4, -1)]
    else:
        pts = [(-1, 0), (-2, 1), (-3, 1), (2, 0), (3, 1), (4, 1)]
    for (dx, dy) in pts:
        c.put(x + dx, y + dy, ramp_name, lum - .08, emis=emis)


def chain_v(c, x, y0, y1, ramp_name='steel', lum=.5, link=3):
    """Vertical chain: alternating link faces."""
    y = y0
    k = 0
    while y < y1:
        if k % 2 == 0:
            c.rect(x - 1, y, x + 2, y + link, ramp_name, lum - .15)
            c.vline(x - 1, y, y + link, ramp_name, lum + .15)
            c.put(x, y + 1, 'black', .2)
        else:
            c.vline(x, y, y + link, ramp_name, lum + .05)
        y += link - 1
        k += 1


def chain_sag(c, x0, y0, x1, y1, sag, ramp_name='steel', lum=.5):
    n = int(abs(x1 - x0) + abs(y1 - y0)) + 1
    prev = None
    for i in range(n + 1):
        t = i / n
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t)
        xi, yi = int(round(x)), int(round(y))
        if (xi, yi) != prev:
            c.put(xi, yi, ramp_name, lum + (.2 if i % 3 == 0 else -.1))
            prev = (xi, yi)


def rope_sag(c, x0, y0, x1, y1, sag, ramp_name='trench', lum=.5):
    n = int(abs(x1 - x0) + abs(y1 - y0)) + 1
    for i in range(n + 1):
        t = i / n
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t)
        c.put(int(round(x)), int(round(y)), ramp_name, lum + (.12 if i % 2 == 0 else -.05))


def rope_coil(c, cx, cy, rx, ry, ramp_name='trench', lum=.5, turns=4):
    for k in range(turns):
        f = 1 - k * .18
        c.ellipse(cx, cy - k * .9, rx * f, ry * f, ramp_name, lum - .12 + k * .05)
        c.ellipse(cx, cy - k * .9, rx * f - 1.2, max(ry * f - 1, .5), ramp_name, lum - .26 + k * .05)
    c.ellipse(cx, cy - turns * .9 + .5, rx * .35, ry * .35, 'black', .1)


def rivets_h(c, x0, x1, y, step=4, ramp_name='steel', lum=.6):
    for x in range(int(x0), int(x1), step):
        c.put(x, y, ramp_name, lum)
        c.put(x, y + 1, 'black', .25)


def rivets_v(c, x, y0, y1, step=4, ramp_name='steel', lum=.6):
    for y in range(int(y0), int(y1), step):
        c.put(x, y, ramp_name, lum)
        c.put(x + 1, y, 'black', .25)


def cobweb(c, x, y, size=10, dx=1, dy=1, ramp_name='fog', lum=.5):
    """Corner cobweb: radial threads + sagging arcs, anchored in a corner at (x,y)."""
    for a in np.linspace(0, math.pi / 2, 5):
        ex = x + dx * math.cos(a) * size
        ey = y + dy * math.sin(a) * size
        c.line(x, y, ex, ey, ramp_name, lum)
    for rr in (size * .45, size * .8):
        prev = None
        for a in np.linspace(0, math.pi / 2, 9):
            r2 = rr * (1 - .12 * math.sin(a * 2))
            px = int(round(x + dx * math.cos(a) * r2))
            py = int(round(y + dy * math.sin(a) * r2))
            if prev:
                c.line(prev[0], prev[1], px, py, ramp_name, lum - .08)
            prev = (px, py)


def light_shaft(c, pts, amount, motes=0, seed=3, mote_ramp='fog', mote_lum=.8):
    c.light_poly(pts, amount)
    if motes:
        rng = np.random.default_rng(seed)
        m, r = c.poly_mask(pts)
        if m is None:
            return
        ys, xs = np.nonzero(m)
        for i in rng.choice(len(xs), size=min(motes, len(xs)), replace=False):
            c.put(xs[i] + r[0], ys[i] + r[1], mote_ramp, mote_lum, emis=.6)


# ----------------------------------------------------------------- state helpers ----
def canvas_diff(base, alt, region=None):
    """Boolean mask of pixels that differ between two canvases (ramp name, lum, emis, dith, light)."""
    bn = np.array(base.names + ['__none__'])
    an = np.array(alt.names + ['__none__'])
    brid = np.where(base.rid >= 0, base.rid, len(base.names))
    arid = np.where(alt.rid >= 0, alt.rid, len(alt.names))
    d = bn[brid] != an[arid]
    d |= np.abs(base.lum - alt.lum) > 1e-5
    d |= np.abs(base.emis - alt.emis) > 1e-5
    d |= np.abs(base.dith - alt.dith) > 1e-5
    d |= np.abs(base.shade - alt.shade) > 1e-5
    d |= np.abs(base.extra - alt.extra) > 1e-5
    if region is not None:
        x0, y0, x1, y1 = region
        m = np.zeros_like(d)
        m[y0:y1, x0:x1] = True
        d &= m
    return d


def state_from(sc, name, alt, depth=None, baseline=None, region=None, grow=0):
    """Create state object `name` whose sprite = pixels of canvas `alt` that differ from the scene's
    current canvas.  Call after the base scene (incl. lighting) is complete."""
    base = sc.c
    d = canvas_diff(base, alt, region)
    if grow:
        g = d.copy()
        for dy in range(-grow, grow + 1):
            for dx in range(-grow, grow + 1):
                g |= np.roll(np.roll(d, dy, 0), dx, 1)
        d = g
    with sc.obj(name, state=True, depth=depth, baseline=baseline) as cc:
        oid = cc.cur_owner
        names = np.array(alt.names)
        ys, xs = np.nonzero(d & (alt.rid >= 0))
        for nm in set(names[alt.rid[ys, xs]]):
            cc.rid_of(nm)
        lut = np.array([cc.ids[n] for n in alt.names], np.int16)
        cc.rid[ys, xs] = lut[alt.rid[ys, xs]]
        cc.lum[d] = alt.lum[d]
        cc.emis[d] = alt.emis[d]
        cc.dith[d] = alt.dith[d]
        cc.shade[d] = alt.shade[d]
        cc.extra[d] = alt.extra[d]
        cc.owner[d] = oid
    return d


def palette_swap(c, mapping):
    """Variant helper: render materials painted with ramp A using ramp B instead (no repaint)."""
    new_ids = {}
    for name, rid in c.ids.items():
        tgt = mapping.get(name, name)
        if tgt in new_ids:            # collision: keep original name
            tgt = name
        new_ids[tgt] = rid
    c.ids = new_ids
    names = [None] * len(c.names)
    for n, rid in new_ids.items():
        names[rid] = n
    c.names = names


class owner0:
    """Context manager: draw on a canvas without claiming pixels for the current object
    (use inside variant functions that repaint, so state clones don't swallow the repaint)."""

    def __init__(self, c):
        self.c = c

    def __enter__(self):
        self.prev = getattr(self.c, 'cur_owner', None)
        if self.prev is not None:
            self.c.cur_owner = 0
        return self.c

    def __exit__(self, *a):
        if self.prev is not None:
            self.c.cur_owner = self.prev


def vignette(c, cx, cy, rx, ry, lo=.6, power=1.6):
    yy, xx = np.mgrid[0:c.h, 0:c.w].astype(np.float32)
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    c.shade *= np.clip(1 - (d ** power) * (1 - lo), lo, 1)


def night_ramp(name, k0=.3, k1=.55, k2=.8):
    """Register 'b_n_<name>': the ramp with its darkest entries crushed towards black."""
    nn = 'b_n_' + name
    if nn not in RAMPS:
        a = RAMPS[name].astype(np.float32).copy()
        a[0] *= k0
        if len(a) > 1:
            a[1] *= k1
        if len(a) > 2:
            a[2] *= k2
        RAMPS[nn] = np.clip(a, 0, 255).astype(np.uint8)
    return nn


def darken_all(c, skip=()):
    """Swap every ramp on canvas c to its crushed-black twin (for 'lights out' renders)."""
    mapping = {}
    for name in list(c.ids):
        if name in skip or name.startswith('b_n_'):
            continue
        mapping[name] = night_ramp(name)
    palette_swap(c, mapping)
    return mapping


class SceneB(Scene):
    """Scene that also exports per-variant anim strips, same convention as group C:
    anim_<name>_<variant>.png with the base strip's geometry, listed in
    meta['anims'][name]['variants']."""

    def export(self, variants=None, base_kw=None):
        self._vfns = dict(variants or {})
        return super().export(variants=variants, base_kw=base_kw)

    def _export_anims(self, folder, bg_kw):
        super()._export_anims(folder, bg_kw)
        for (name, fns, fps, depth) in getattr(self, 'anims_src', []):
            a = self.meta['anims'].get(name)
            if not a:
                continue
            x0, y0, fw, fh = a['x'], a['y'], a['w'], a['h']
            for vname, vfn in getattr(self, '_vfns', {}).items():
                strip = np.zeros((fh, fw * len(fns), 4), np.uint8)
                for i, fn in enumerate(fns):
                    cc = copy.deepcopy(self.c)
                    cc.cur_owner = 0
                    kw = vfn(cc) or {}
                    cc.cur_owner = 30000
                    fn(cc)
                    img = cc.render(**kw)
                    m = cc.owner == 30000
                    strip[:, i * fw:(i + 1) * fw, :3] = img[y0:y0 + fh, x0:x0 + fw]
                    strip[:, i * fw:(i + 1) * fw, 3] = np.where(m[y0:y0 + fh, x0:x0 + fw], 255, 0)
                save_png(strip, os.path.join(folder, f'anim_{name}_{vname}.png'))
                a.setdefault('variants', []).append(vname)
