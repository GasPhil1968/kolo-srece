"""Shared props and helpers for the group-"a" rooms (hotel_lobby, office, hask_shop, nora_flat,
pharmacy, commission).

Contents
* extra ramps (prefixed ``a_``)
* a tiny pixel font (3x5 caps, digits, punctuation) with mirroring for lettering seen through
  glass from the wrong side
* ramp tinting: coloured light is faked by swapping pixels onto hue-shifted copies of their ramp
* inverse perspective helpers + venetian-blind light stripes projected from a point source
* animation frame builders (ceiling fan, smoke/steam, flicker)
* props: banker's lamp, typewriter, filing cabinet, water cooler, coat rack, calendar, potted
  fern, safe, wastebasket, chairs, frosted-glass door, venetian blinds, street views ...
"""
from __future__ import annotations

import math
import numpy as np

from core import RAMPS, ramp, hx, vgrad, hgrad, radial, noise2
from persp import Persp

# ----------------------------------------------------------------------------- ramps ----
ramp('a_mahog', '#0f0706', '#1a0c09', '#28120d', '#381912', '#4a2117', '#5e2b1d', '#753624', '#8e432c', '#a95536')
ramp('a_frost', '#3b3428', '#5b5039', '#7e6f50', '#a28f68', '#c3ad80', '#dcc699', '#efdcb4', '#fbf0d2')
ramp('a_bank', '#03120a', '#062012', '#0b321d', '#11482a', '#196239', '#237e4a', '#33995e', '#4fb779', '#82d69d')
ramp('a_owall', '#0e0f10', '#161818', '#1f2220', '#2a2c28', '#363832', '#44443b', '#545244', '#66624f', '#7b765d', '#938b6c')
ramp('a_olivegray', '#0e100f', '#161a18', '#1f2522', '#29302c', '#343d37', '#414b44', '#4f5a52', '#5f6b62', '#738074')
ramp('a_bakelite', '#080605', '#110c0a', '#1a1310', '#251b16', '#31241d', '#3e2e25')
ramp('a_damask', '#120a0b', '#1d1012', '#2a171a', '#391f22', '#49272a', '#5a3133', '#6c3c3c', '#7f4946')
ramp('a_marble', '#262422', '#3a3733', '#504c46', '#68635b', '#817b71', '#9b9488', '#b4ad9f', '#cbc4b5', '#e0d9ca')
ramp('a_vmarble', '#08100e', '#0e1916', '#15241f', '#1d302a', '#263d35', '#304b41', '#3d5b4f')
ramp('a_mint', '#141d18', '#1e2a23', '#29382f', '#35473c', '#43574a', '#536858', '#647a68', '#788d7a', '#90a28f', '#aab9a6')
ramp('a_nora', '#151a14', '#1f261d', '#2a3227', '#364032', '#434e3d', '#525e4a', '#626e58', '#757f68', '#8a927b', '#a1a78f')
ramp('a_walnut', '#0e0805', '#180e08', '#24150c', '#311d10', '#402615', '#50301a', '#623b20', '#764827', '#8b5730')
ramp('a_jarglass', '#0b1210', '#12201c', '#1b302a', '#26423a', '#33564c', '#436c60', '#588477', '#719c8f', '#93b8ab')
ramp('a_amberglass', '#1c0c02', '#331604', '#4f2307', '#6e330b', '#8f4510', '#b05b17', '#cc7622', '#e29633', '#f2b85a')
ramp('a_globe_r', '#1f0206', '#3d040b', '#600712', '#870c1b', '#ae1626', '#d42634', '#ef4a4c', '#ff7d70', '#ffb8a6')
ramp('a_globe_g', '#021409', '#04240f', '#073818', '#0b4f23', '#11682f', '#1b843d', '#2fa250', '#55c06c', '#93dd9c')
ramp('a_beads', '#160b06', '#2a150a', '#43200f', '#5e2e14', '#7b3e1a', '#9a5223', '#b8692f', '#d48640')
ramp('a_iron', '#0b0d0e', '#121517', '#1a1e21', '#23282c', '#2d3338', '#383f45', '#454d54', '#545d65', '#67717a')
ramp('a_skyday', '#40474e', '#4f575e', '#5f676e', '#70787e', '#81898e', '#939a9e', '#a5abae', '#b8bdbf')
ramp('a_fluor', '#4b5249', '#646b60', '#7e8578', '#989f91', '#b3b9aa', '#ccd2c2', '#e3e8d8', '#f4f8ec')
ramp('a_ginger', '#2a1206', '#4a210b', '#6e3412', '#93491a', '#b86224', '#d47e35', '#e89d52', '#f4bd78')
ramp('a_neon_pink', '#2b0716', '#4d0c27', '#78123c', '#a51b52', '#d02d6a', '#ef4f88', '#ff83ab', '#ffc0d4')


# ------------------------------------------------------------------------- font ----
_G = {
    'A': '.#.|#.#|###|#.#|#.#', 'B': '##.|#.#|##.|#.#|##.', 'C': '.##|#..|#..|#..|.##',
    'D': '##.|#.#|#.#|#.#|##.', 'E': '###|#..|##.|#..|###', 'F': '###|#..|##.|#..|#..',
    'G': '.##|#..|#.#|#.#|.##', 'H': '#.#|#.#|###|#.#|#.#', 'I': '#|#|#|#|#',
    'J': '..#|..#|..#|#.#|.#.', 'K': '#.#|#.#|##.|#.#|#.#', 'L': '#..|#..|#..|#..|###',
    'M': '#...#|##.##|#.#.#|#...#|#...#', 'N': '#..#|##.#|#.##|#..#|#..#',
    'O': '.#.|#.#|#.#|#.#|.#.', 'P': '##.|#.#|##.|#..|#..', 'Q': '.#.|#.#|#.#|#.#|.##',
    'R': '##.|#.#|##.|#.#|#.#', 'S': '.##|#..|.#.|..#|##.', 'T': '###|.#.|.#.|.#.|.#.',
    'U': '#.#|#.#|#.#|#.#|###', 'V': '#.#|#.#|#.#|#.#|.#.', 'W': '#...#|#...#|#.#.#|##.##|#...#',
    'X': '#.#|#.#|.#.|#.#|#.#', 'Y': '#.#|#.#|.#.|.#.|.#.', 'Z': '###|..#|.#.|#..|###',
    '0': '###|#.#|#.#|#.#|###', '1': '.#|##|.#|.#|.#', '2': '##.|..#|.#.|#..|###',
    '3': '##.|..#|.#.|..#|##.', '4': '#.#|#.#|###|..#|..#', '5': '###|#..|##.|..#|##.',
    '6': '.##|#..|###|#.#|###', '7': '###|..#|.#.|.#.|.#.', '8': '###|#.#|###|#.#|###',
    '9': '###|#.#|###|..#|##.', '.': '.|.|.|.|#', ',': '.|.|.|#|#', "'": '#|#|.|.|.',
    '-': '...|...|###|...|...', '&': '.#.|#.#|.#.|#.#|.##', '/': '..#|..#|.#.|#..|#..',
    ':': '.|#|.|#|.', '!': '#|#|#|.|#', '?': '##.|..#|.#.|...|.#.', '~': '....|....|####|....|....',
    '#': '#.#|###|#.#|###|#.#', '%': '#.#|..#|.#.|#..|#.#', '$': '.##|##.|.#.|.##|##.',
    '(': '.#|#.|#.|#.|.#', ')': '#.|.#|.#|.#|#.', '=': '...|###|...|###|...', '+': '...|.#.|###|.#.|...',
    ' ': '..|..|..|..|..',
}
FONT = {k: [row for row in v.split('|')] for k, v in _G.items()}


def text_w(s: str, spacing=1, scale=1):
    w = 0
    for i, ch in enumerate(s.upper()):
        g = FONT.get(ch, FONT[' '])
        w += len(g[0]) * scale + (spacing * scale if i < len(s) - 1 else 0)
    return w


def text(c, x, y, s, ramp_name, lum, emis=0.0, mirror=False, spacing=1, scale=1, outline=None):
    """Draw text with top-left at (x, y). mirror=True renders it as seen from behind glass.
    outline=(ramp, lum) draws a 1px outline (drawn first)."""
    s = s.upper()
    cells = []
    cx = 0
    for i, ch in enumerate(s):
        g = FONT.get(ch, FONT[' '])
        gw = len(g[0])
        for r, row in enumerate(g):
            for k, v in enumerate(row):
                if v == '#':
                    cells.append((cx + k, r))
        cx += gw + spacing
    total = cx - spacing
    pix = []
    for (u, v) in cells:
        if mirror:
            u = total - 1 - u
        for a in range(scale):
            for b in range(scale):
                pix.append((x + u * scale + a, y + v * scale + b))
    if outline:
        pset = set(pix)
        for (px, py) in pix:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1)):
                q = (px + dx, py + dy)
                if q not in pset:
                    c.put(q[0], q[1], outline[0], outline[1])
    for (px, py) in pix:
        c.put(px, py, ramp_name, lum, emis)
    return total * scale


def scribble(c, x0, y, x1, ramp_name, lum, seed=0, emis=0.0, gap=.25):
    """A line of illegible small print: short dashes with gaps."""
    rng = np.random.default_rng(seed)
    x = x0
    while x < x1:
        n = int(rng.integers(1, 5))
        for k in range(n):
            if x + k < x1:
                c.put(x + k, y, ramp_name, lum, emis)
        x += n + (1 if rng.random() > gap else 2)


# ----------------------------------------------------------------------- tinting ----
def tinted(name: str, tag: str, rgb, k=.65, lift=.15, gamma=.8):
    """Register (once) a copy of ramp `name` lit by coloured light `rgb`; returns its name.
    Lighter entries take more of the tint (light colours highlights, not shadows)."""
    tname = f'a_{name}__{tag}'
    if tname in RAMPS:
        return tname
    src = RAMPS[name].astype(np.float32)
    n = len(src)
    col = np.array(hx(rgb) if isinstance(rgb, str) else rgb, np.float32)
    out = []
    for i, c0 in enumerate(src):
        t = (i / max(1, n - 1)) ** gamma
        w = k * (.35 + .65 * t)
        lum0 = c0.mean()
        lit = col / 255.0 * (lum0 * 1.15 + 40 * t) + c0 * .25
        c1 = c0 * (1 - w) + lit * w + col * lift * t * .35
        out.append(np.clip(c1, 0, 255))
    RAMPS[tname] = np.array(out, np.uint8)
    return tname


def tint_mask(c, mask, tag, rgb, k=.65, lift=.15, skip=()):
    """Swap every pixel in mask to the tinted version of its own ramp."""
    rids = np.unique(c.rid[mask])
    for rid in rids:
        if rid < 0:
            continue
        name = c.names[rid]
        if name in skip or '__' in name:
            continue
        tn = tinted(name, tag, rgb, k, lift)
        m = mask & (c.rid == rid)
        c.rid[m] = c.rid_of(tn)


# ------------------------------------------------------------ inverse perspective ----
def grid(c, region=None):
    if region is None:
        yy, xx = np.mgrid[0:c.h, 0:c.w].astype(np.float32)
    else:
        x0, y0, x1, y1 = region
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    return xx + .5, yy + .5


def inv_hplane(p: Persp, xx, yy, h=0.0):
    """Screen -> world on the horizontal plane Y=h (floor h=0, table tops h>0)."""
    s = np.maximum((yy - p.hy) / max(p.E - h, 1e-3), 1e-3)
    Z = p.D * (1 - 1 / s)
    X = p.cx + (xx - p.cx) / s
    return X, np.full_like(X, h), Z


def inv_xplane(p: Persp, xx, yy, Xw):
    """Screen -> world on the vertical plane X=Xw (side walls, box sides)."""
    s = np.maximum((xx - p.cx) / (Xw - p.cx), 1e-3)
    Z = p.D * (1 - 1 / s)
    Y = p.E - (yy - p.hy) / s
    return np.full_like(Z, Xw), Y, Z


def inv_zplane(p: Persp, xx, yy, Zw):
    s = p.s(Zw)
    X = p.cx + (xx - p.cx) / s
    Y = p.E - (yy - p.hy) / s
    return X, Y, np.full_like(X, Zw)


def seg_hits_box(Q, W, box):
    """Vectorised segment(Q->W) vs axis-aligned box test (X0,X1,Y0,Y1,Z0,Z1)."""
    X0, X1, Y0, Y1, Z0, Z1 = box
    tmin = np.zeros_like(Q[0])
    tmax = np.ones_like(Q[0])
    for a, lo, hi in ((0, X0, X1), (1, Y0, Y1), (2, Z0, Z1)):
        d = W[a] - Q[a]
        with np.errstate(divide='ignore', invalid='ignore'):
            t1 = (lo - Q[a]) / d
            t2 = (hi - Q[a]) / d
        ta = np.where(np.abs(d) < 1e-6, np.where((Q[a] >= lo) & (Q[a] <= hi), -np.inf, np.inf), np.minimum(t1, t2))
        tb = np.where(np.abs(d) < 1e-6, np.where((Q[a] >= lo) & (Q[a] <= hi), np.inf, -np.inf), np.maximum(t1, t2))
        tmin = np.maximum(tmin, ta)
        tmax = np.minimum(tmax, tb)
    return tmin < tmax - 1e-4


def blind_lit(Q, L, win, pitch=3.0, gap=1.2, bent=None, occluders=()):
    """Is world point Q lit by point light L through a window with venetian blinds in plane Z=0?
    win=(X0,X1,Y0,Y1); light passes where (Y-Y0) % pitch < gap. bent: list of (x0,x1,y0,y1)
    extra open regions on the window (a bent slat). Returns bool array."""
    Qx, Qy, Qz = Q
    Lx, Ly, Lz = L
    with np.errstate(divide='ignore', invalid='ignore'):
        t = Qz / (Qz - Lz)
    Wx = Qx + t * (Lx - Qx)
    Wy = Qy + t * (Ly - Qy)
    X0, X1, Y0, Y1 = win
    ok = (Qz > 0) & (Wx >= X0) & (Wx <= X1) & (Wy >= Y0) & (Wy <= Y1)
    g = ((Wy - Y0) % pitch) < gap
    if bent:
        for (a, b, c0, d) in bent:
            g |= (Wx >= a) & (Wx <= b) & (Wy >= c0) & (Wy <= d)
    ok &= g
    if occluders:
        W = (Wx, Wy, np.zeros_like(Wx))
        for box in occluders:
            ok &= ~seg_hits_box((Qx, Qy, Qz), W, box)
    return ok


# --------------------------------------------------------------------- animation ----
def fan_frames(cx, cy, R=22, ry=.36, blades=4, frames=4, ramp_name='oak', lum=.55, w_root=2.0, w_tip=6.5):
    """Ceiling fan blades seen from slightly below; returns list of frame fns.
    Blade widths are in world units and projected with the same ellipse as the blade axis."""
    fns = []
    for f in range(frames):
        def fn(c, f=f):
            base = f * (2 * math.pi / blades) / frames + .3
            order = sorted(((math.sin(base + b * 2 * math.pi / blades), base + b * 2 * math.pi / blades)
                            for b in range(blades)))
            for sa_, a in order:
                ca, sa = math.cos(a), math.sin(a)
                ax, ay = ca, sa * ry                 # blade axis on screen
                px, py = -sa, ca * ry                # blade width direction on screen
                r0, r1 = 3.0, R
                pts = [(cx + ax * r0 + px * w_root / 2, cy + ay * r0 + py * w_root / 2),
                       (cx + ax * r1 + px * w_tip / 2, cy + ay * r1 + py * w_tip / 2),
                       (cx + ax * r1 - px * w_tip / 2, cy + ay * r1 - py * w_tip / 2),
                       (cx + ax * r0 - px * w_root / 2, cy + ay * r0 - py * w_root / 2)]
                L = lum + .12 * ca * .5 - (.1 if sa < 0 else 0)
                c.poly(pts, ramp_name, L, dith=.15)
                # lit leading edge + dark trailing edge
                c.line(pts[0][0], pts[0][1], pts[1][0], pts[1][1], ramp_name, L + .18)
                c.line(pts[3][0], pts[3][1], pts[2][0], pts[2][1], ramp_name, L - .2)
            c.ellipse(cx, cy, 3.4, 1.8, 'brass', .52, dith=0)
            c.hline(int(cx) - 2, int(cx) + 3, int(cy) - 1, 'brass', .8)
            c.put(int(cx), int(cy) + 2, 'brass', .4)
        fns.append(fn)
    return fns


def smoke_frames(x, y, height=18, frames=6, ramp_name='fog', lum=.55, drift=.35, seed=3, width=1.0):
    """A thin curling smoke wisp rising from (x, y)."""
    fns = []
    for f in range(frames):
        def fn(c, f=f):
            ph = f / frames * 2 * math.pi
            for k in range(height):
                t = k / height
                sway = math.sin(k * .45 - ph) * (.4 + t * 2.2) * width + k * drift * t
                xx = x + sway
                yy = y - k
                a = 1 - t
                if (k + f) % 7 == 6 and t > .4:
                    continue
                c.put(int(round(xx)), int(yy), ramp_name, lum * (.55 + .45 * a), emis=.35)
                if t > .45 and (k % 3 == 0):
                    c.put(int(round(xx + 1)), int(yy), ramp_name, lum * .55 * a + .1, emis=.3)
        fns.append(fn)
    return fns


def steam_frames(x, y, height=14, frames=6, ramp_name='white', lum=.6, spread=3.0, puffs=3):
    fns = []
    for f in range(frames):
        def fn(c, f=f):
            for pidx in range(puffs):
                ph = (f / frames + pidx / puffs) % 1.0
                yy = y - ph * height
                xx = x + math.sin(ph * 5 + pidx * 2) * spread * ph + (pidx - 1) * 1.5
                r = .8 + ph * 2.2
                if ph > .9:
                    continue
                c.ellipse(xx, yy, r, r * .8, ramp_name, lum * (1 - ph * .6), emis=.4, dith=.8)
        fns.append(fn)
    return fns


def owner_dim_frames(owner_id, levels, ramp_override=None):
    """Flicker: frames that re-emit the pixels of an existing object at reduced intensity.
    levels: list of multipliers (1.0 = unchanged frame drawn anyway)."""
    fns = []
    for lv in levels:
        def fn(c, lv=lv):
            m = c.owner == owner_id
            c.lum[m] = c.lum[m] * lv
            c.emis[m] = c.emis[m] * (.4 + .6 * lv)
            c.owner[m] = c.cur_owner
        fns.append(fn)
    return fns


# ------------------------------------------------------------------------ props ----
def box(c, p, X0, X1, Y0, Y1, Z0, Z1, rmp, front, top=None, side=None, dith=.3, **kw):
    old = c.default_dith
    c.default_dith = dith
    d = p.box(c, X0, X1, Y0, Y1, Z0, Z1, rmp, front=front, top=front + .18 if top is None else top,
              side=front - .14 if side is None else side, **kw)
    c.default_dith = old
    return d


def P(p, X, Y, Z):
    x, y = p.P(X, Y, Z)
    return int(round(x)), int(round(y))


def banker_lamp(c, x, y, on=True, w=15):
    """Green glass banker's lamp, (x, y) = bottom centre of the base."""
    hw = w // 2
    c.ellipse(x, y - 1, hw - 2, 1.6, 'brass', .45, dith=0)
    c.hline(x - hw + 3, x + hw - 2, y - 2, 'brass', .8)
    c.rect(x - 1, y - 9, x + 1, y - 2, 'brass', .55, dith=0)
    c.put(x - 1, y - 8, 'brass', .9)
    c.rect(x - 4, y - 10, x + 4, y - 9, 'brass', .6, dith=0)     # arm
    c.rect(x - 4, y - 11, x - 3, y - 9, 'brass', .5, dith=0)
    c.rect(x + 3, y - 11, x + 4, y - 9, 'brass', .5, dith=0)
    # shade: long half-cylinder seen from the front
    top, bot = y - 15, y - 10
    pts = [(x - hw + 2, bot), (x - hw + 3, top + 1), (x - hw + 5, top), (x + hw - 5, top), (x + hw - 3, top + 1),
           (x + hw - 2, bot)]
    c.poly(pts, 'a_bank', vgrad(top, bot, .78, .45), emis=.55 if on else 0, dith=.25)
    c.hline(x - hw + 5, x + hw - 4, top, 'a_bank', .95, emis=.6 if on else 0)
    c.hline(x - hw + 4, x + hw - 6, top + 1, 'a_bank', .88, emis=.6 if on else 0)
    if on:
        c.hline(x - hw + 2, x + hw - 2, bot, 'lamp', .95, emis=1)
        c.hline(x - hw + 3, x + hw - 3, bot + 1, 'lamp', .7, emis=1)
    else:
        c.hline(x - hw + 2, x + hw - 2, bot, 'a_bank', .25)
    c.put(x + hw - 3, bot - 1, 'brass', .8)
    c.put(x - 1, top - 1, 'brass', .7)
    return (x, bot + 1)


def typewriter(c, x, y, ramp_name='black', paper=True, w=17, lit=.0, paper_h=8):
    """Office typewriter front view, (x, y) = bottom centre."""
    hw = w // 2
    # body
    c.poly([(x - hw, y), (x + hw + 1, y), (x + hw - 1, y - 5), (x - hw + 2, y - 5)], ramp_name, .55, dith=0)
    c.rect(x - hw + 2, y - 8, x + hw, y - 5, ramp_name, .45, dith=0)
    c.hline(x - hw + 2, x + hw, y - 8, 'slate', .55)
    # keys: rows of tiny round keys
    for r, yy in enumerate((y - 2, y - 4)):
        for kx in range(x - hw + 2 + r, x + hw - 1, 2):
            c.put(kx, yy, 'cream', .62 - r * .05)
    c.hline(x - hw + 3, x + hw - 2, y - 1, 'slate', .3)
    # platen + carriage
    c.rect(x - hw - 1, y - 11, x + hw + 2, y - 8, ramp_name, .5, dith=0)
    c.hline(x - hw - 1, x + hw + 2, y - 11, 'slate', .6)
    c.rect(x - hw - 3, y - 11, x - hw - 1, y - 9, 'chrome', .6, dith=0)   # return lever
    c.put(x - hw - 4, y - 12, 'chrome', .8)
    c.put(x + hw + 2, y - 10, 'chrome', .55)
    if paper:
        c.rect(x - 4, y - 10 - paper_h, x + 4, y - 10, 'paper', vgrad(y - 10 - paper_h, y - 10, .9, .75), dith=0)
        for k in range(2, paper_h, 2):
            c.hline(x - 3, x + 3 - (k // 2) % 3, y - 10 - paper_h + k, 'paper', .55)
    c.put(x, y - 6, 'brass', .7)
    c.put(x + 1, y - 6, 'brass', .5)


def ashtray(c, x, y, butts=3, smoking=False, rmp='glass'):
    c.ellipse(x, y, 4, 1.6, rmp, .5, dith=0)
    c.ellipse(x, y - .5, 2.6, .9, rmp, .18, dith=0)
    c.hline(x - 3, x + 3, y + 1, rmp, .3)
    for i in range(butts):
        bx = x - 2 + i * 2
        c.put(bx, y - 1, 'paper', .85)
        c.put(bx + 1, y - 1 - (i % 2), 'paper', .7)
    if smoking:
        c.put(x + 3, y - 2, 'paper', .95)
        c.put(x + 4, y - 2, 'paper', .9)
        c.put(x + 5, y - 3, 'lamp', .8, emis=1)


def potted_fern(c, x, y, size=1.0, pot='brick', leaf='felt', seed=2, droop=1.0):
    """Fern in a clay pot, (x, y) = bottom centre of the pot."""
    rng = np.random.default_rng(seed)
    pw = int(4 * size) + 1
    ph = int(5 * size) + 1
    c.poly([(x - pw, y - ph), (x + pw, y - ph), (x + pw - 1, y), (x - pw + 1, y)], pot, .45, dith=.2)
    c.rect(x - pw - 1, y - ph - 2, x + pw + 1, y - ph, pot, .58, dith=0)
    c.hline(x - pw - 1, x + pw + 1, y - ph - 2, pot, .75)
    c.vline(x - pw + 1, y - ph, y, pot, .6)
    base = (x, y - ph - 2)
    fronds = int(9 * size) + 3
    for i in range(fronds):
        a = -math.pi / 2 + (i / (fronds - 1) - .5) * 2.7 + rng.normal(0, .08)
        L = (9 + rng.random() * 6) * size
        pts = []
        for k in range(int(L)):
            t = k / L
            ang = a + math.copysign(t * t * 1.3 * droop, math.cos(a))
            px = base[0] + math.cos(ang) * k
            py = base[1] + math.sin(ang) * k * .8 + t * t * 4 * size * droop
            pts.append((px, py))
        for k, (px, py) in enumerate(pts):
            lum = .55 + .2 * (k / len(pts)) - (.15 if i % 2 else 0)
            c.put(int(px), int(py), leaf, lum)
            if k % 2 == 0 and k > 1:
                ang2 = a + (math.pi / 2)
                for sgn in (-1, 1):
                    c.put(int(px + math.cos(ang2) * sgn), int(py + math.sin(ang2) * sgn + .6), leaf,
                          lum - .12 + .1 * (sgn > 0))


def wastebasket(c, x, y, h=9, w=7, rmp='a_iron', lum=.4, paper=True, seed=4):
    hw = w / 2
    c.poly([(x - hw - 1, y - h), (x + hw + 1, y - h), (x + hw, y), (x - hw, y)], rmp, hgrad(x - hw, x + hw, lum + .1, lum - .1),
           dith=.2)
    for k in range(int(x - hw), int(x + hw) + 1, 2):
        c.vline(k, y - h + 1, y, rmp, lum - .15)
    c.ellipse(x, y - h, hw + 1, 1.3, rmp, lum + .15, dith=0)
    c.ellipse(x, y - h, hw, .8, 'black', .2, dith=0)
    if paper:
        rng = np.random.default_rng(seed)
        for i in range(4):
            px = x - hw + 1 + rng.random() * (w - 2)
            c.ellipse(px, y - h - 1 - rng.random(), 1.6, 1.3, 'paper', .7 + rng.random() * .2, dith=0)


def filing_cabinet(c, p, X0, X1, Z0, Z1, H, drawers=4, rmp='a_olivegray', lum=.5, open_drawer=None, labels=True):
    """Steel filing cabinet against the back wall. open_drawer = index from the top (pulled out)."""
    box(c, p, X0, X1, 0, H, Z0, Z1, rmp, lum, top=lum + .22, side=lum - .18)
    fx0, fy0 = P(p, X0, H, Z1)
    fx1, fy1 = P(p, X1, 0, Z1)
    dh = (fy1 - fy0 - 2) / drawers
    for i in range(drawers):
        a = int(fy0 + 1 + i * dh)
        b = int(fy0 + 1 + (i + 1) * dh)
        c.rect(fx0 + 1, a + 1, fx1 - 1, b, rmp, lum + .04, dith=0)
        c.hline(fx0 + 1, fx1 - 1, b - 1, rmp, lum - .2)
        c.hline(fx0 + 1, fx1 - 1, a + 1, rmp, lum + .16)
        mx = (fx0 + fx1) // 2
        if labels:
            c.rect(mx - 2, a + 3, mx + 2, a + 5, 'paper', .72, dith=0)
        c.hline(mx - 2, mx + 2, a + 6, 'chrome', .72)
        c.put(mx - 2, a + 7, 'chrome', .4)
        c.put(mx + 1, a + 7, 'chrome', .4)
    c.vline(fx0, fy0, fy1, rmp, lum + .2)
    c.vline(fx1 - 1, fy0, fy1, rmp, lum - .22)
    c.hline(fx0, fx1, fy1, 'black', .2)
    return (fx0, fy0, fx1, fy1, dh)


def water_cooler(c, x, y, scale=1.0):
    """Floor-standing cooler with a blue glass bottle, (x, y) = bottom centre."""
    s = scale
    w = int(6 * s)
    # cabinet
    c.rect(x - w, int(y - 22 * s), x + w, y, 'cream', hgrad(x - w, x + w, .62, .42), dith=.2)
    c.vline(x - w, int(y - 22 * s), y, 'cream', .75)
    c.hline(x - w, x + w, int(y - 22 * s), 'cream', .8)
    c.rect(x - w + 2, int(y - 12 * s), x + w - 2, int(y - 3 * s), 'cream', .45, dith=.2)
    c.rect(x - w + 1, y - 1, x + w - 1, y, 'black', .2)
    # spigot + drip tray
    c.rect(x - 1, int(y - 19 * s), x + 2, int(y - 17 * s), 'chrome', .7, dith=0)
    c.put(x, int(y - 16 * s), 'chrome', .5)
    c.rect(x - 3, int(y - 13 * s), x + 4, int(y - 12 * s), 'chrome', .5, dith=0)
    # bottle
    by = int(y - 22 * s)
    c.rect(x - 1, by - 2, x + 2, by, 'glass', .45, emis=.15, dith=0)
    c.ellipse(x + .5, by - 9 * s, 5.5 * s, 7.5 * s, 'glass', vgrad(by - 16 * s, by - 2, .62, .4), emis=.2, dith=.4)
    c.rect(int(x - 5 * s), int(by - 9 * s), int(x + 6 * s), int(by - 5 * s), 'glass', .48, emis=.2, dith=.4)
    c.hline(int(x - 4 * s), int(x + 5 * s), int(by - 11 * s), 'glass', .75, emis=.2)   # water line
    c.vline(int(x - 3 * s), int(by - 14 * s), int(by - 5 * s), 'glass', .85, emis=.25)  # glint
    c.put(int(x - 2 * s), int(by - 15 * s), 'white', .9)
    # paper cup dispenser
    c.rect(x + w, int(y - 18 * s), x + w + 2, int(y - 9 * s), 'chrome', .45, dith=0)
    c.put(x + w + 1, int(y - 8 * s), 'paper', .8)


def coat_rack(c, x, y, h=48, rmp='a_walnut', lum=.5):
    c.vline(x, y - h, y - 2, rmp, lum)
    c.vline(x + 1, y - h, y - 2, rmp, lum - .2)
    c.ellipse(x + .5, y - h - 1, 1.6, 1.6, rmp, lum + .2, dith=0)
    for dx in (-5, -3, 3, 6):
        c.line(x, y - 1, x + dx, y + 1, rmp, lum - .1)
    for dx, dy in ((-4, 3), (4, 3), (-3, 6), (4, 7)):
        c.line(x + (1 if dx > 0 else 0), y - h + dy + 2, x + dx, y - h + dy, rmp, lum + .1)
        c.put(x + dx, y - h + dy - 1, 'brass', .7)


def calendar(c, x0, y0, month='OCT', year='1951', circle=9, first_dow=1, days=31, rmp='paper', lum=.78,
             picture=True):
    """Wall calendar: picture panel, month header, day grid (1px dots), a circled day.
    first_dow: weekday index (0=Sun) of the 1st. Returns rect."""
    w = 22
    hdr = 8 if picture else 0
    h = hdr + 23
    c.rect(x0, y0, x0 + w, y0 + h, rmp, lum, dith=0)
    c.vline(x0 + w - 1, y0, y0 + h, rmp, lum - .2)
    c.hline(x0, x0 + w, y0 + h - 1, rmp, lum - .25)
    c.put(x0 + w // 2, y0 - 2, 'brass', .7)
    c.line(x0 + w // 2, y0 - 2, x0 + 2, y0, 'black', .4)
    c.line(x0 + w // 2, y0 - 2, x0 + w - 3, y0, 'black', .4)
    if picture:   # a pin-up-ish harbour painting
        c.rect(x0 + 1, y0 + 1, x0 + w - 1, y0 + hdr, 'night', vgrad(y0, y0 + hdr, .7, .5), dith=.3)
        c.rect(x0 + 1, y0 + hdr - 3, x0 + w - 1, y0 + hdr, 'water', .55, dith=.3)
        c.poly([(x0 + 6, y0 + hdr - 3), (x0 + 13, y0 + hdr - 3), (x0 + 12, y0 + hdr - 2), (x0 + 7, y0 + hdr - 2)],
               'red', .6, dith=0)
        c.vline(x0 + 9, y0 + 2, y0 + hdr - 3, 'cream', .7)
    yy = y0 + hdr + 1
    text(c, x0 + 2, yy, month, 'red', .62)
    text(c, x0 + w - 2 - text_w(year[2:]), yy, year[2:], 'black', .35)
    gy = yy + 7
    c.hline(x0 + 1, x0 + w - 1, gy - 1, rmp, lum - .3)
    pos = None
    for d in range(1, days + 1):
        i = d - 1 + first_dow
        col, row = i % 7, i // 7
        px = x0 + 2 + col * 3
        py = gy + 1 + row * 3
        sunday = col == 0
        c.put(px, py, 'red' if sunday else 'black', .5 if sunday else .3)
        c.put(px + 1, py, 'red' if sunday else 'black', .5 if sunday else .3)
        if d == circle:
            pos = (px, py)
    if pos:
        px, py = pos
        for (dx, dy) in ((-1, -1), (0, -2), (1, -2), (2, -1), (3, 0), (2, 1), (1, 2), (0, 2), (-1, 1), (-2, 0)):
            c.put(px + dx, py + dy, 'blood', .75)
    return (x0, y0, x0 + w, y0 + h)


def framed_photo(c, x0, y0, x1, y1, frame='a_walnut', inner=None, glass=True):
    c.rect(x0, y0, x1, y1, frame, .55, dith=0)
    c.hline(x0, x1, y0, frame, .8)
    c.vline(x0, y0, y1, frame, .7)
    c.hline(x0, x1, y1 - 1, frame, .3)
    c.rect(x0 + 2, y0 + 2, x1 - 2, y1 - 2, 'paper', .78, dith=0)   # mat
    if inner:
        inner(x0 + 3, y0 + 3, x1 - 3, y1 - 3)
    if glass:
        c.put(x0 + 3, y0 + 3, 'white', .95)
        c.put(x0 + 4, y0 + 3, 'white', .8)


def two_cops_photo(c, a, b, cc, d):
    """Sepia photo: two young policemen in caps, arm in arm."""
    c.rect(a, b, cc, d, 'cream', vgrad(b, d, .62, .48), dith=.3)
    c.rect(a, d - 3, cc, d, 'cream', .4, dith=.3)
    w = cc - a
    for i, x in enumerate((a + w // 3, a + 2 * w // 3 + 1)):
        top = b + 2 + (i == 1)
        c.rect(x - 2, top + 4, x + 2, d, 'trench', .28, dith=0)        # tunic
        c.rect(x - 1, top + 1, x + 1, top + 4, 'cream', .75, dith=0)    # face
        c.rect(x - 2, top, x + 2, top + 1, 'trench', .2, dith=0)        # cap
        c.hline(x - 2, x + 3, top + 1, 'trench', .15)
        c.put(x, top + 6, 'brass', .9)                                  # badge
    c.hline(a + w // 3 + 2, a + 2 * w // 3, b + 8, 'trench', .32)       # arms linked


def iron_safe(c, p, X0, X1, Z0, Z1, H, rmp='a_iron', lum=.45, label='', open_=False):
    box(c, p, X0, X1, 2, H, Z0, Z1, rmp, lum, top=lum + .2, side=lum - .15)
    # feet
    for X in (X0 + 1, X1 - 3):
        box(c, p, X, X + 2, 0, 2, Z1 - 2, Z1, rmp, .2)
    fx0, fy0 = P(p, X0, H, Z1)
    fx1, fy1 = P(p, X1, 2, Z1)
    c.rect(fx0 + 2, fy0 + 2, fx1 - 2, fy1 - 2, rmp, lum + .05, dith=.2)
    c.hline(fx0 + 2, fx1 - 2, fy0 + 2, rmp, lum - .2)
    c.vline(fx0 + 2, fy0 + 2, fy1 - 2, rmp, lum - .2)
    c.hline(fx0 + 2, fx1 - 2, fy1 - 3, rmp, lum + .22)
    c.vline(fx1 - 3, fy0 + 2, fy1 - 2, rmp, lum + .18)
    # gold pinstripe border
    c.hline(fx0 + 4, fx1 - 4, fy0 + 4, 'gold', .55)
    c.hline(fx0 + 4, fx1 - 4, fy1 - 5, 'gold', .45)
    c.vline(fx0 + 4, fy0 + 4, fy1 - 4, 'gold', .5)
    c.vline(fx1 - 5, fy0 + 4, fy1 - 4, 'gold', .45)
    # dial + handle
    mx = (fx0 + fx1) // 2
    my = fy0 + (fy1 - fy0) * 2 // 5
    c.ellipse(mx, my, 3.2, 3.2, 'chrome', .55, dith=0)
    c.ellipse(mx, my, 1.8, 1.8, 'chrome', .3, dith=0)
    c.put(mx, my - 3, 'white', .9)
    c.put(mx - 1, my - 2, 'chrome', .9)
    c.rect(mx - 1, my + 5, mx + 2, my + 6, 'brass', .65, dith=0)
    c.line(mx + 1, my + 5, mx + 4, my + 8, 'brass', .6)
    c.put(mx - 1, my - 6, 'gold', .7)
    if label:
        text(c, mx - text_w(label) // 2, fy1 - 10, label, 'gold', .6)
    return (fx0, fy0, fx1, fy1)


def venetian_blinds(c, x0, y0, x1, y1, pitch=4, slat=2, rmp='paper', lum=.32, rim=None, cord=True, seed=1,
                    bent=None, sag=0):
    """Slats over an already painted window view (gaps keep the view). Backlit: slats dark with
    a lit lower lip. rim=(ramp, lum, emis) colours the lip (neon spill). bent=(x0, x1, y) widens a
    gap (someone peeked). sag: the right end of the slats drops by up to `sag` px."""
    rng = np.random.default_rng(seed)
    c.rect(x0 - 2, y0 - 4, x1 + 2, y0, rmp, lum + .14, dith=0)        # head rail
    c.hline(x0 - 2, x1 + 2, y0 - 4, rmp, lum + .34)
    c.hline(x0 - 2, x1 + 2, y0 - 1, 'black', .2)

    def eye(xx):
        if not bent:
            return None
        bx0, bx1, by = bent
        if not (bx0 <= xx < bx1):
            return None
        k = 1 - abs((xx - bx0) / max(1, bx1 - bx0 - 1) * 2 - 1)
        d = k ** .7 * 2.6
        return (by - d, by + d)
    y = y0
    while y < y1 - 1:
        for xx in range(x0, x1):
            dy = int(round(sag * (xx - x0) / max(1, x1 - x0) * ((y - y0) / max(1, y1 - y0))))
            e = eye(xx)
            for s in range(slat):
                yy = y + s + dy
                if yy >= y1:
                    continue
                if e and e[0] <= yy <= e[1]:
                    continue
                L = lum + (.0 if s == 0 else -.08) + rng.normal(0, .008)
                c.put(xx, yy, rmp, L)
            yy = y + slat - 1 + dy
            if rim and yy < y1 and not (e and e[0] <= yy <= e[1]):
                c.put(xx, yy, rim[0], rim[1], rim[2])
        y += pitch
    if bent:
        bx0, bx1, by = bent
        for xx in range(bx0, bx1):
            e = eye(xx)
            c.put(xx, int(math.floor(e[0])) - 1, rmp, lum + .12)
            c.put(xx, int(math.ceil(e[1])) + 1, rmp, lum - .05)
    c.rect(x0 - 2, y1 - 1, x1 + 2, y1 + 2, rmp, lum + .05, dith=0)   # bottom rail
    c.hline(x0 - 2, x1 + 2, y1 - 1, rmp, lum + .25)
    if cord:
        for xx in (x0 + (x1 - x0) // 4, x1 - (x1 - x0) // 4):
            for yy in range(y0, y1, 1):
                if (yy - y0) % pitch >= slat:
                    c.put(xx, yy, rmp, lum - .12)
        c.vline(x1 - 3, y1 + 2, y1 + 16, rmp, lum)
        c.rect(x1 - 4, y1 + 16, x1 - 1, y1 + 18, rmp, lum + .15, dith=0)
        c.vline(x1 - 6, y1 + 2, y1 + 12, rmp, lum - .05)
        c.put(x1 - 6, y1 + 12, rmp, lum + .2)


def city_night(c, x0, y0, x1, y1, seed=3, wall_top=None, brick='brick', lit=.35, glow_rgb=None, wet=True):
    """Facade across a rainy street at night: brick, windows (some lit), cornice, a bit of sky."""
    rng = np.random.default_rng(seed)
    c.rect(x0, y0, x1, y1, 'night', vgrad(y0, y1, .22, .36), emis=.7, dith=.6)
    wt = y0 + (y1 - y0) // 6 if wall_top is None else wall_top
    c.rect(x0, wt, x1, y1, brick, vgrad(wt, y1, .2, .32), emis=.35, dith=.5)
    c.rect(x0, wt, x1, wt + 2, 'slate', .35, emis=.3, dith=0)
    for wy in range(wt + 4, y1 - 3, 11):
        for wx in range(x0 + 2 + (wy * 3) % 5, x1 - 4, 9):
            if rng.random() < lit:
                c.rect(wx, wy, wx + 5, wy + 7, 'lamp', .45 + rng.random() * .25, emis=1, dith=.4)
                c.hline(wx, wx + 5, wy + 3, 'lamp', .3, emis=1)
                if rng.random() < .5:
                    c.rect(wx, wy, wx + 2, wy + 7, 'red', .3, emis=.8)   # a curtain
            else:
                c.rect(wx, wy, wx + 5, wy + 7, 'glass', .22 + rng.random() * .1, emis=.4, dith=.3)
            c.hline(wx - 1, wx + 6, wy + 7, 'slate', .4, emis=.3)


def rain_streaks(c, x0, y0, x1, y1, seed=9, n=None, rmp='glass', lum=.75, emis=.5, length=(2, 5)):
    """Static drops + runs on glass."""
    rng = np.random.default_rng(seed)
    n = n or int((x1 - x0) * (y1 - y0) * .035)
    for _ in range(n):
        x = int(rng.integers(x0, x1))
        y = int(rng.integers(y0, y1))
        L = int(rng.integers(*length))
        for k in range(L):
            if y + k < y1:
                c.put(x, y + k, rmp, lum - k * .05 + (.1 if k == L - 1 else 0), emis)


def frosted_glass(c, x0, y0, x1, y1, rmp='a_frost', lum=.7, emis=.85, hot=None, seed=5):
    """Backlit frosted glass with a soft bright spot (hot=(x, y, r)) and fine mottling."""
    N = noise2(c.w, c.h, 2.5, seed, 2)

    def fn(xx, yy):
        L = np.full(xx.shape, lum, np.float32)
        if hot:
            hxx, hyy, r = hot
            d = np.sqrt((xx - hxx) ** 2 + ((yy - hyy) * 1.2) ** 2) / r
            L = L + np.clip(1 - d, 0, 1) * .22
        L = L - np.clip((yy - y0) / max(1, y1 - y0), 0, 1) * .14
        xi = np.clip(xx.astype(int), 0, c.w - 1)
        yi = np.clip(yy.astype(int), 0, c.h - 1)
        return L + (N[yi, xi] - .5) * .06
    c.rect(x0, y0, x1, y1, rmp, fn, emis=emis, dith=.7)


def wood_chair_back(c, p, X0, X1, Z0, Z1, rmp='oak', lum=.5, seat_h=12, back_h=26):
    """Plain wooden chair facing the back wall (we see its back), legs and seat."""
    leg = 1.6
    for X in (X0, X1 - leg):
        box(c, p, X, X + leg, 0, seat_h, Z0, Z0 + leg, rmp, lum - .15)
    box(c, p, X0 - .5, X1 + .5, seat_h, seat_h + 1.6, Z0, Z1, rmp, lum, top=lum + .15, side=lum - .2)
    for X in (X0, X1 - leg):
        box(c, p, X, X + leg, 0, back_h, Z1 - leg, Z1, rmp, lum + .05, side=lum - .15)
    box(c, p, X0, X1, back_h - 4, back_h, Z1 - leg, Z1, rmp, lum + .1, top=lum + .28)
    box(c, p, X0, X1, seat_h + 6, seat_h + 8, Z1 - leg, Z1, rmp, lum)
    # spindles
    for k in range(1, 4):
        X = X0 + (X1 - X0) * k / 4 - .4
        box(c, p, X, X + .8, seat_h + 8, back_h - 4, Z1 - leg, Z1 - .5, rmp, lum - .08)


def swivel_chair(c, x, y, w=20, back_h=26, rmp='a_bakelite', lum=.5, leather='a_mahog', lit_top=.0):
    """High-backed leather desk chair facing the camera, (x, y) = floor centre."""
    hw = w // 2
    # star base
    c.hline(x - hw + 2, x + hw - 2, y, 'a_iron', .3)
    c.rect(x - 1, y - 7, x + 1, y, 'a_iron', .35, dith=0)
    # seat
    c.rect(x - hw + 1, y - 10, x + hw - 1, y - 7, leather, .32, dith=.3)
    c.hline(x - hw + 1, x + hw - 1, y - 10, leather, .5)
    # back (tufted)
    top = y - 10 - back_h
    c.poly([(x - hw + 2, y - 10), (x - hw, top + 4), (x - hw + 3, top), (x + hw - 3, top), (x + hw, top + 4),
            (x + hw - 2, y - 10)], leather, vgrad(top, y - 10, .42, .25), dith=.35)
    for ty in range(top + 4, y - 12, 5):
        for tx in range(x - hw + 4 + (ty // 5) % 2 * 2, x + hw - 3, 4):
            c.put(tx, ty, leather, .15)
    c.hline(x - hw + 3, x + hw - 3, top, leather, .6 + lit_top)
    c.put(x - hw + 2, top + 1, 'brass', .6)
    c.put(x + hw - 3, top + 1, 'brass', .6)
    # arms
    c.rect(x - hw - 1, y - 16, x - hw + 2, y - 9, leather, .38, dith=0)
    c.rect(x + hw - 2, y - 16, x + hw + 1, y - 9, leather, .3, dith=0)
    c.hline(x - hw - 1, x - hw + 2, y - 16, leather, .55)
    c.hline(x + hw - 2, x + hw + 1, y - 16, leather, .5)


def phone_desk(c, x, y, rmp='a_bakelite', lum=.5):
    """1940s candlestick-free cradle phone, (x, y) bottom centre (front view, bigger than F.telephone)."""
    c.poly([(x - 6, y), (x + 6, y), (x + 5, y - 5), (x - 5, y - 5)], rmp, lum, dith=0)
    c.hline(x - 5, x + 5, y - 5, rmp, lum + .25)
    c.ellipse(x, y - 2, 2.2, 1.6, 'cream', .6, dith=0)
    c.put(x, y - 2, 'black', .1)
    c.rect(x - 2, y - 7, x + 2, y - 5, rmp, lum - .1, dith=0)
    # handset
    c.rect(x - 6, y - 9, x + 7, y - 7, rmp, lum + .05, dith=0)
    c.hline(x - 5, x + 6, y - 9, rmp, lum + .35)
    c.rect(x - 8, y - 9, x - 5, y - 6, rmp, lum + .1, dith=0)
    c.rect(x + 5, y - 9, x + 8, y - 6, rmp, lum, dith=0)
    c.hline(x - 8, x - 5, y - 9, rmp, lum + .3)


def lamp_shade_pendant(c, x, y, w=12, h=5, rmp='a_bank', on=True, cord_top=0):
    """Hanging lamp with a conical shade; (x, y) = bottom centre of the shade."""
    c.vline(x, cord_top, y - h, 'black', .35)
    hw = w // 2
    c.poly([(x - 2, y - h), (x + 2, y - h), (x + hw, y), (x - hw, y)], rmp, vgrad(y - h, y, .7, .45),
           emis=.4 if on else 0, dith=.25)
    c.hline(x - 1, x + 2, y - h, rmp, .9, emis=.4 if on else 0)
    if on:
        c.hline(x - hw + 1, x + hw, y, 'lamp', .95, emis=1)
        c.put(x, y + 1, 'lamp', 1.0, emis=1)
        c.put(x + 1, y + 1, 'lamp', .85, emis=1)


# ------------------------------------------------------------------ wall surfaces ----
def plaster(c, x0, y0, x1, y1, rmp, base=.55, seed=1, stain=.07, top_dark=18, top_amt=.14, grain=.03, dith=.5):
    """Painted plaster: broad blotches, fine grain, darker towards the ceiling."""
    N = noise2(c.w, c.h, 20, seed, 3)
    N2 = noise2(c.w, c.h, 2.2, seed + 7, 1)

    def fn(xx, yy):
        xi = np.clip(xx.astype(int), 0, c.w - 1)
        yi = np.clip(yy.astype(int), 0, c.h - 1)
        L = base + (N[yi, xi] - .5) * 2 * stain + (N2[yi, xi] - .5) * 2 * grain
        L = L - np.clip((y0 + top_dark - yy) / max(1, top_dark), 0, 1) * top_amt
        return L
    return fn


def water_stain(c, cx, cy, rx, ry, amt=.18, rim=.12):
    def fn(xx, yy):
        d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
        inside = np.clip(1 - d, 0, 1)
        ring = np.clip(1 - np.abs(d - .92) / .1, 0, 1)
        wob = 1 + .0 * xx
        return wob * (1 - amt * np.sqrt(inside) - rim * ring)
    c.modulate(cx - rx - 2, cy - ry - 2, cx + rx + 2, cy + ry + 2, fn)


def crack(c, x, y, length, rmp, lum, seed=0, dx=.35, down=True):
    rng = np.random.default_rng(seed)
    fx = float(x)
    for k in range(length):
        c.put(int(fx), y + (k if down else -k), rmp, lum)
        fx += rng.normal(0, .55) + dx * (1 if rng.random() > .5 else -1) * .3
        if rng.random() < .12:      # small branch
            c.put(int(fx) + 1, y + (k if down else -k) + 1, rmp, lum + .05)


def wainscot_back(c, x0, x1, y_top, y_floor, rmp='a_walnut', lum=.42, panel=24, rail=True, seed=3):
    """Panelled dado on a frontal wall."""
    c.rect(x0, y_top, x1, y_floor, rmp, lum, dith=.3)
    for px in range(x0 + 3, x1 - 6, panel):
        a, b = px, min(px + panel - 4, x1 - 3)
        c.rect(a, y_top + 5, b, y_floor - 7, rmp, lum - .06, dith=.3)
        c.hline(a, b, y_top + 5, rmp, lum - .22)
        c.vline(a, y_top + 5, y_floor - 7, rmp, lum - .18)
        c.hline(a, b, y_floor - 8, rmp, lum + .14)
        c.vline(b - 1, y_top + 5, y_floor - 7, rmp, lum + .1)
        c.rect(a + 2, y_top + 7, b - 2, y_floor - 9, rmp, lum - .02, dith=.3)
    if rail:
        c.rect(x0, y_top - 1, x1, y_top + 2, rmp, lum + .12, dith=0)
        c.hline(x0, x1, y_top - 1, rmp, lum + .32)
        c.hline(x0, x1, y_top + 2, rmp, lum - .25)
    c.rect(x0, y_floor - 4, x1, y_floor, rmp, lum - .08, dith=0)     # skirting
    c.hline(x0, x1, y_floor - 4, rmp, lum + .2)
    c.hline(x0, x1, y_floor - 1, 'black', .15)


def side_quad(p, X, Y0, Y1, Z0, Z1):
    return p.quad([(X, Y0, Z0), (X, Y0, Z1), (X, Y1, Z1), (X, Y1, Z0)])


def wainscot_side(c, p, X, Zn, h=32, rmp='a_walnut', lum=.36, panel=26):
    c.poly(side_quad(p, X, 0, h, 0, Zn), rmp, lum, dith=.3)
    a = p.P(X, h, 0)
    b = p.P(X, h, Zn)
    c.line(a[0], a[1], b[0], b[1], rmp, lum + .3)
    a = p.P(X, h - 2, 0)
    b = p.P(X, h - 2, Zn)
    c.line(a[0], a[1], b[0], b[1], rmp, lum - .2)
    a = p.P(X, 4, 0)
    b = p.P(X, 4, Zn)
    c.line(a[0], a[1], b[0], b[1], rmp, lum + .15)
    Z = panel
    while Z < Zn:
        a = p.P(X, h - 3, Z)
        b = p.P(X, 5, Z)
        c.line(a[0], a[1], b[0], b[1], rmp, lum - .14)
        Z += panel


def exec_chair(c, x, y, w=24, back_h=30, seat_h=12, leather='a_mahog', lum=.4, rim=None, arms=True):
    """Tall tufted leather desk chair facing the camera, (x, y) = floor centre.
    rim=(ramp, lum, emis): a backlight line along the top/right edge."""
    hw = w // 2
    sy = y - seat_h
    top = sy - back_h
    pts = [(x - hw + 1, sy)]
    pts.append((x - hw, top + 6))
    for i in range(9):
        t = i / 8
        pts.append((x - hw + 1 + t * (w - 2), top + 3 - math.sin(math.pi * t) * 3))
    pts.append((x + hw, top + 6))
    pts.append((x + hw - 1, sy))
    c.poly(pts, leather, vgrad(top, sy, lum + .06, lum - .14), dith=.35)
    # tufting: diamond grid
    for row, ty in enumerate(range(top + 6, sy - 3, 4)):
        for tx in range(x - hw + 3 + (row % 2) * 2, x + hw - 2, 4):
            c.put(tx, ty, leather, lum - .25)
            c.put(tx, ty - 1, leather, lum + .08)
    # nailhead trim
    for k in range(0, len(pts) - 1):
        a, b = pts[k], pts[k + 1]
        n = int(max(abs(b[0] - a[0]), abs(b[1] - a[1])) / 2)
        for i in range(n):
            t = i / max(1, n)
            px = a[0] + (b[0] - a[0]) * t
            py = a[1] + (b[1] - a[1]) * t
            ix = px + (1.5 if px < x else -1.5)
            iy = py + (1.5 if py < sy - 4 else 0)
            if i % 2 == 0:
                c.put(int(ix), int(iy), 'brass', .55)
    if rim:
        rr, rl, re = rim
        for i in range(1, 10):
            a = pts[i]
            c.put(int(a[0]), int(a[1]), rr, rl, re)
        for yy in range(int(top + 6), sy - 2):
            c.put(x + hw - 1, yy, rr, rl * .85, re)
    if arms:
        for sgn in (-1, 1):
            ax = x + sgn * (hw - 1)
            c.rect(min(ax, ax + sgn * 4), sy - 8, max(ax, ax + sgn * 4) + 1, sy + 2, leather, lum - .05 - .05 * (sgn > 0),
                   dith=.2)
            c.ellipse(ax + sgn * 2, sy - 8, 2.6, 1.6, leather, lum + .08, dith=0)
    c.rect(x - hw + 2, sy - 2, x + hw - 1, sy + 2, leather, lum - .02, dith=.3)
    c.hline(x - hw + 2, x + hw - 1, sy - 2, leather, lum + .15)
    c.rect(x - 1, sy + 2, x + 1, y - 1, 'a_iron', .35, dith=0)
    c.hline(x - hw + 3, x + hw - 3, y - 1, 'a_iron', .3)


def stairwell_doorway(c, p, X, Z0, Z1, h=46, frame='a_walnut', flum=.4, wall='cream'):
    """Open doorway in a side wall at X, revealing a dim stairwell: its far wall lit by a bare
    bulb, a handrail and the top steps dropping away. Returns the opening quad."""
    c.poly(side_quad(p, X, 0, h + 3, Z0 - 3, Z1 + 3), frame, flum, dith=0)
    q = side_quad(p, X, 0, h, Z0, Z1)
    ys = [y for _, y in q]
    xs = [x for x, _ in q]
    # far wall of the stairwell, warm and dim, brighter near the bulb
    bx, by = p.P(X, h - 8, (Z0 + Z1) / 2)
    c.poly(q, wall, radial(bx, by, 24, .7, .22, ystretch=.7), emis=.55, dith=.6)
    # handrail descending towards the front
    for d in (0, 1):
        a = p.P(X, h - 18 - d, Z0 + 1)
        b = p.P(X, 6 - d, Z1 - 1)
        c.line(a[0], a[1], b[0], b[1], 'a_walnut', .55 - .3 * d)
    # balusters
    for k in range(1, 4):
        t = k / 4
        Zk = Z0 + 1 + t * (Z1 - Z0 - 2)
        Yk = (h - 18) + t * (6 - (h - 18))
        a = p.P(X, Yk, Zk)
        b = p.P(X, max(0, Yk - 9), Zk)
        c.line(a[0], a[1], b[0], b[1], 'a_walnut', .35)
    # the top steps falling away (dark)
    for k in range(4):
        Yv = 1 + k * 2.2
        a = p.P(X, Yv, Z0 + 1)
        b = p.P(X, Yv, Z0 + 4 + k * 3)
        c.line(a[0], a[1], b[0], b[1], 'wood', .2)
    # the bare bulb
    c.put(int(bx), int(by), 'lamp', 1.0, emis=1)
    c.put(int(bx), int(by) - 1, 'lamp', .7, emis=1)
    a = p.P(X, h, (Z0 + Z1) / 2)
    c.line(a[0], a[1], bx, by - 2, 'black', .3)
    # door leaf swung out of sight: just its edge at the far jamb
    a = p.P(X, 0, Z0)
    b = p.P(X, h, Z0)
    c.line(a[0], a[1], b[0], b[1], frame, flum + .22)
    return q


def beam_haze(c, p, Q, lit, L, amount=.08, samples=2500, steps=40, seed=1, blur=1):
    """Dusty-air light shaft: march from lit surface points Q[lit] towards the light until the
    window plane (Z=0), project the samples and add a faint, normalised additive glow."""
    rng = np.random.default_rng(seed)
    idx = np.flatnonzero(lit.ravel())
    if len(idx) == 0:
        return
    pick = rng.choice(idx, size=min(samples, len(idx)), replace=False)
    Qx, Qy, Qz = (a.ravel()[pick] for a in Q)
    Lx, Ly, Lz = L
    t_end = Qz / (Qz - Lz)
    acc = np.zeros((c.h, c.w), np.float32)
    for k in range(steps):
        t = (k + rng.random(len(pick))) / steps * t_end
        X = Qx + t * (Lx - Qx)
        Y = Qy + t * (Ly - Qy)
        Z = Qz + t * (Lz - Qz)
        s = p.D / (p.D - Z)
        sx = (p.cx + (X - p.cx) * s).astype(int)
        sy = (p.hy + (p.E - Y) * s).astype(int)
        ok = (sx >= 0) & (sx < c.w) & (sy >= 0) & (sy < c.h)
        np.add.at(acc, (sy[ok], sx[ok]), 1.0)
    for _ in range(blur):
        acc = (acc + np.roll(acc, 1, 0) + np.roll(acc, -1, 0) + np.roll(acc, 1, 1) + np.roll(acc, -1, 1)) / 5
    if acc.max() > 0:
        acc = np.clip(acc / np.percentile(acc[acc > 0], 92), 0, 1)
    c.extra += acc * amount
    return acc


# ------------------------------------------------------------------ lobby & shops ----
def marble_floor(c, p, X0, X1, Z0, Z1, size=18, light='a_marble', dark='a_vmarble', seed=3, cracks=10,
                 lum_l=.62, lum_d=.5, grout=.22):
    """Checkerboard marble in perspective with veins, worn patches and a few cracks.
    Draws the light tiles then overpaints the dark ones. Returns the floor quad."""
    pts = p.quad([(X0, 0, Z0), (X1, 0, Z0), (X1, 0, Z1), (X0, 0, Z1)])
    N = noise2(c.w * 2, c.h * 2, 9, seed, 3)
    rng = np.random.default_rng(seed)

    def uv(xx, yy):
        X, _, Z = inv_hplane(p, xx, yy)
        return X, Z

    def vein(X, Z, k):
        xi = np.clip(((X - X0) * .9).astype(int) % (c.w * 2), 0, c.w * 2 - 1)
        zi = np.clip((Z * 1.6).astype(int) % (c.h * 2), 0, c.h * 2 - 1)
        v = N[zi, xi]
        return np.abs(np.sin(v * 9 + X * .05 * k + Z * .08)) < .12

    def fn_l(xx, yy):
        X, Z = uv(xx, yy)
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        fx = (X - X0) / size - np.floor((X - X0) / size)
        fz = Z / size - np.floor(Z / size)
        L = np.full(xx.shape, lum_l, np.float32)
        L = np.where(vein(X, Z, 1), L - .12, L)
        gw = .8 / s / size
        L = np.where((fx < gw) | (fz < gw * 1.3), grout + .1, L)
        return L

    def fn_d(xx, yy):
        X, Z = uv(xx, yy)
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        fx = (X - X0) / size - np.floor((X - X0) / size)
        fz = Z / size - np.floor(Z / size)
        L = np.full(xx.shape, lum_d, np.float32)
        L = np.where(vein(X, Z, 2), L + .2, L)
        gw = .8 / s / size
        L = np.where((fx < gw) | (fz < gw * 1.3), grout, L)
        return L
    c.poly(pts, light, fn_l, dith=.35)
    m, r = c.poly_mask(pts)
    hh, ww = m.shape
    yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32) + .5
    X, Z = uv(xx, yy)
    i = np.floor((X - X0) / size)
    j = np.floor(Z / size)
    dm = m & (((i + j) % 2) == 1)
    c._apply(dm, dark, fn_d(xx, yy), region=r, dith=.35)
    # cracks: jagged polylines across tiles (world space -> screen)
    for _ in range(cracks):
        Xc = rng.uniform(X0 + 10, X1 - 10)
        Zc = rng.uniform(Z0 + 6, Z1 - 4)
        ang = rng.uniform(0, math.pi)
        prev = p.P(Xc, 0, Zc)
        for k in range(int(rng.integers(4, 9))):
            ang += rng.normal(0, .5)
            Xc += math.cos(ang) * 3
            Zc += math.sin(ang) * 2
            cur = p.P(Xc, 0, Zc)
            c.line(prev[0], prev[1], cur[0], cur[1], 'black', .35)
            prev = cur
    return pts


def damask(c, x0, y0, x1, y1, rmp, base=.45, cell=(10, 14), amp=.1, seed=6, stain=.06):
    """Faded damask wallpaper: repeating fleur medallion in a drop-repeat, plus stains."""
    cw, ch = cell
    N = noise2(c.w, c.h, 16, seed, 3)

    def fn(xx, yy):
        u = (xx - x0) % cw
        row = np.floor((yy - y0) / ch)
        u = (xx - x0 + (row % 2) * cw / 2) % cw
        v = (yy - y0) % ch
        du = np.abs(u - cw / 2) / (cw / 2)
        dv = np.abs(v - ch / 2) / (ch / 2)
        lozenge = (du + dv * .9) < .62
        core = (du * 1.4 + np.abs(v - ch / 2 + 1) / (ch / 2)) < .38
        stem = (du < .12) & (v > ch * .62) & (v < ch * .9)
        L = np.full(xx.shape, base, np.float32)
        L = np.where(lozenge, L + amp, L)
        L = np.where(core, L - amp * .7, L)
        L = np.where(stem, L + amp * .6, L)
        xi = np.clip(xx.astype(int), 0, c.w - 1)
        yi = np.clip(yy.astype(int), 0, c.h - 1)
        return L - (N[yi, xi] - .5) * 2 * stain
    c.rect(x0, y0, x1, y1, rmp, fn, dith=.35)


def wingback_chair(c, x, y, w=26, rmp='a_damask', lum=.5, sag=True, legs='a_walnut'):
    """Sagging wingback armchair facing the camera, (x, y) = floor centre."""
    hw = w // 2
    seat = y - 9
    top = y - 30
    # back with wings
    back = [(x - hw + 3, seat), (x - hw + 2, top + 5), (x - hw + 5, top), (x + hw - 5, top), (x + hw - 2, top + 5),
            (x + hw - 3, seat)]
    c.poly(back, rmp, vgrad(top, seat, lum + .05, lum - .12), dith=.4)
    for sgn in (-1, 1):                      # wings
        wx = x + sgn * (hw - 2)
        c.poly([(wx, top + 4), (wx + sgn * 3, top + 7), (wx + sgn * 3, seat - 4), (wx, seat - 2)], rmp,
               lum - .02 - (.08 if sgn > 0 else 0), dith=.3)
    # seat cushion sagging
    c.poly([(x - hw + 2, seat - 3), (x + hw - 2, seat - 3), (x + hw - 1, seat + 2), (x - hw + 1, seat + 2)], rmp,
           lum + .08, dith=.3)
    if sag:
        c.ellipse(x - 1, seat - 1, hw - 5, 1.4, rmp, lum - .14, dith=.3)
    c.hline(x - hw + 3, x + hw - 3, seat - 3, rmp, lum + .2)
    # rolled arms
    for sgn in (-1, 1):
        ax = x + sgn * (hw - 1)
        c.rect(min(ax, ax + sgn * 4), seat - 8, max(ax, ax + sgn * 4) + 1, y - 3, rmp,
               lum - .02 - .07 * (sgn > 0), dith=.3)
        c.ellipse(ax + sgn * 2, seat - 8, 3, 2, rmp, lum + .1 - .06 * (sgn > 0), dith=.2)
    # skirt + legs
    c.rect(x - hw - 1, y - 4, x + hw + 2, y - 1, rmp, lum - .2, dith=.3)
    for lx in (x - hw, x + hw):
        c.rect(lx, y - 1, lx + 2, y + 1, legs, .4, dith=0)
    # a worn patch and a loose thread of stuffing
    c.put(x + 3, seat - 12, rmp, lum + .22)
    c.put(x + 4, seat - 12, rmp, lum + .18)
    c.put(x - hw + 1, seat - 2, 'cream', .7)


def chandelier(c, x, y, arms=5, span=18, drop=18, lit=(1, 1, 0, 1, 1), rmp='brass', top=0):
    """Small brass chandelier with candle bulbs; (x, y) = bottom of the central stem."""
    c.vline(x, top, y - drop + 4, rmp, .4)
    for k in range(3):
        c.put(x, y - drop + 2 + k * 3, rmp, .7)
    c.rect(x - 1, y - drop + 4, x + 2, y, rmp, .5, dith=0)
    c.ellipse(x + .5, y - 5, 3, 2, rmp, .55, dith=0)
    c.put(x, y + 1, rmp, .6)
    c.put(x, y + 2, 'glass', .7)
    bulbs = []
    for i in range(arms):
        t = i / (arms - 1) * 2 - 1
        ex = x + t * span / 2
        ey = y - 5 - (1 - abs(t)) * 2 - (abs(t) < .3) * 1
        c.line(x, y - 5, ex, ey + 2, rmp, .55)
        c.line(ex, ey + 2, ex, ey - 1, rmp, .5)
        c.put(int(ex), int(ey - 1), rmp, .75)
        on = lit[i % len(lit)]
        c.rect(int(ex) - 1, int(ey) - 4, int(ex) + 1, int(ey) - 1, 'cream', .8, dith=0)
        if on:
            c.put(int(ex), int(ey) - 5, 'lamp', 1.0, emis=1)
            c.put(int(ex) - 1, int(ey) - 5, 'lamp', .8, emis=1)
            c.put(int(ex), int(ey) - 6, 'lamp', .8, emis=1)
        else:
            c.put(int(ex), int(ey) - 5, 'glass', .3)
        bulbs.append((int(ex), int(ey) - 5, on))
    # crystal drops
    for i in range(arms):
        t = i / (arms - 1) * 2 - 1
        c.put(int(x + t * span / 2.6), int(y - 1 + abs(t) * 2), 'glass', .85, emis=.4)
    return bulbs


def key_cubbies(c, x0, y0, cols=7, rows=4, cw=7, ch=8, rmp='a_mahog', lum=.45, seed=2, missing=(),
                labels=True):
    """Pigeonhole grid with room keys on hooks below each hole and notes in some."""
    rng = np.random.default_rng(seed)
    w, h = cols * cw + 2, rows * ch + 2
    c.rect(x0 - 2, y0 - 3, x0 + w + 2, y0 + h + 1, rmp, lum + .05, dith=0)
    c.hline(x0 - 2, x0 + w + 2, y0 - 3, rmp, lum + .3)
    c.rect(x0, y0, x0 + w, y0 + h, rmp, lum - .25, dith=0)
    slots = []
    n = 0
    for r in range(rows):
        for k in range(cols):
            n += 1
            sx = x0 + 1 + k * cw
            sy = y0 + 1 + r * ch
            c.rect(sx, sy, sx + cw - 1, sy + ch - 1, rmp, .14, dith=0)
            c.hline(sx, sx + cw - 1, sy, 'black', .1)
            c.hline(sx, sx + cw - 1, sy + ch - 2, rmp, lum - .1)
            c.vline(sx + cw - 1, sy, sy + ch, rmp, lum + .1)
            c.hline(sx, sx + cw, sy + ch - 1, rmp, lum + .18)
            if rng.random() < .3:            # a letter or a note waiting
                c.rect(sx + 1, sy + 2, sx + cw - 2, sy + ch - 3, 'paper', .7 + rng.random() * .15, dith=0)
            if labels:
                c.put(sx + cw // 2, sy + ch - 1, 'brass', .55)
            # key hanging on the hook below the hole
            if n not in missing and rng.random() < .72:
                kx = sx + cw // 2 - 1
                ky = sy + 2
                c.put(kx + 2, ky, 'brass', .8)
                c.vline(kx + 2, ky + 1, ky + 4, 'brass', .65)
                c.put(kx + 1, ky + 3, 'brass', .55)
                c.rect(kx + 1, ky + 4, kx + 4, ky + 5, 'red' if rng.random() < .5 else 'brass', .55, dith=0)
            slots.append((n, sx, sy))
    return (x0 - 2, y0 - 3, x0 + w + 2, y0 + h + 1), slots


def desk_bell(c, x, y):
    c.ellipse(x, y, 3.6, 1.2, 'a_walnut', .4, dith=0)
    c.ellipse(x, y - 2.5, 3.2, 2.8, 'brass', vgrad(y - 5, y, .85, .45), dith=0)
    c.hline(x - 3, x + 4, y - 1, 'brass', .4)
    c.put(x - 1, y - 4, 'brass', 1.0)
    c.put(x - 2, y - 3, 'brass', .9)
    c.rect(x, y - 7, x + 1, y - 5, 'brass', .75, dith=0)
    c.put(x, y - 7, 'brass', 1.0)


def open_book(c, x, y, w=14, h=5, rmp='paper', lum=.84, lines=True, tilt=0):
    """Open register / ledger lying on a surface, (x, y) = centre of the near edge."""
    hw = w // 2
    c.poly([(x - hw - 1, y + 1), (x + hw + 1, y + 1), (x + hw + tilt, y - h), (x - hw + tilt, y - h)], 'a_mahog', .3,
           dith=0)
    c.poly([(x - hw, y), (x, y), (x + tilt, y - h + 1), (x - hw + 1 + tilt, y - h + 1)], rmp, lum, dith=0)
    c.poly([(x + 1, y), (x + hw, y), (x + hw - 1 + tilt, y - h + 1), (x + 1 + tilt, y - h + 1)], rmp, lum - .07,
           dith=0)
    c.vline(x, y - h + 1, y + 1, rmp, lum - .35)
    if lines:
        for k in range(2, h, 2):
            yy = y - k + 1
            scribble(c, x - hw + 2, yy, x - 1, 'night', .35, seed=k)
            scribble(c, x + 2, yy, x + hw - 1, 'night', .35, seed=k + 5)


def phone_booth(c, p, X0, X1, Z0, Z1, H, rmp='a_mahog', lum=.5, light=True):
    """Wooden phone booth against a side wall; folding glass door on the front (Z1) face.
    Returns the screen rect of the front face."""
    box(c, p, X0, X1, 0, H, Z0, Z1, rmp, lum, top=lum + .15, side=lum - .12)
    box(c, p, X0 - 1, X1 + 1, H, H + 3, Z0 - 1, Z1 + 1, rmp, lum + .1, top=lum + .25, side=lum - .02)
    fx0, fy0 = P(p, X0, H, Z1)
    fx1, fy1 = P(p, X1, 0, Z1)
    w = fx1 - fx0
    # interior seen through the glass door, lit by the dome light
    gx0, gy0, gx1, gy1 = fx0 + 3, fy0 + 9, fx1 - 3, fy1 - 14
    mid = (gx0 + gx1) // 2
    c.rect(gx0, gy0, gx1, gy1, 'oak', radial(mid, gy0, (gy1 - gy0) * 1.1, .7 if light else .3, .25),
           emis=.45 if light else 0, dith=.4)
    px, py = mid, gy0 + 13
    c.rect(px - 4, py - 7, px + 4, py + 5, 'a_bakelite', .5, dith=0)          # wall phone box
    c.hline(px - 4, px + 4, py - 7, 'a_bakelite', .75)
    c.ellipse(px, py - 1, 2.6, 2.6, 'chrome', .72, dith=0)                    # dial
    c.ellipse(px, py - 1, 1.2, 1.2, 'cream', .7, dith=0)
    c.rect(px - 2, py + 3, px + 3, py + 4, 'chrome', .6, dith=0)              # coin slots
    c.rect(px + 5, py - 6, px + 7, py + 2, 'a_bakelite', .55, dith=0)         # receiver on its hook
    c.put(px + 5, py - 6, 'a_bakelite', .85)
    c.line(px + 6, py + 2, px + 4, py + 9, 'black', .3)
    c.rect(gx0 + 1, gy1 - 6, gx1 - 1, gy1 - 3, 'oak', .5, dith=0)            # seat
    c.hline(gx0 + 1, gx1 - 1, gy1 - 6, 'oak', .72)
    c.rect(gx0 + 2, py + 9, gx0 + 8, py + 11, 'paper', .72, dith=0)          # directory on a chain
    c.line(gx0 + 5, py + 9, gx0 + 6, py + 6, 'chrome', .5)
    # folding door: glass leaves with light mullions + a soft sheen
    for xx in (gx0, mid, gx1 - 1):
        c.vline(xx, gy0, gy1, rmp, lum + .18)
    for yy in (gy0 + (gy1 - gy0) // 3, gy0 + 2 * (gy1 - gy0) // 3):
        c.hline(gx0, gx1, yy, rmp, lum + .08)
    for k in range(3):
        c.put(gx0 + 2 + k, gy0 + 5 - k, 'white', .62, emis=.3)
        c.put(mid + 2 + k, gy0 + 8 - k, 'white', .55, emis=.3)
    # lower wood panel + handle
    c.rect(fx0 + 3, gy1 + 1, fx1 - 3, fy1 - 3, rmp, lum - .05, dith=.2)
    c.hline(fx0 + 3, fx1 - 3, gy1 + 1, rmp, lum + .2)
    c.rect(mid - 1, (gy0 + gy1) // 2 + 6, mid + 1, (gy0 + gy1) // 2 + 10, 'brass', .65, dith=0)
    # sign panel: TELEPHONE (lit)
    c.rect(fx0 + 3, fy0 + 2, fx1 - 3, fy0 + 8, 'cream', .7, emis=.6 if light else 0, dith=0)
    t = 'TELEPHONE'
    if text_w(t) <= w - 6:
        text(c, (fx0 + fx1) // 2 - text_w(t) // 2, fy0 + 3, t, 'night', .25)
    else:
        text(c, (fx0 + fx1) // 2 - text_w('PHONE') // 2, fy0 + 3, 'PHONE', 'night', .25)
    if light:
        c.put(mid, gy0 + 2, 'lamp', 1.0, emis=1)
        c.put(mid + 1, gy0 + 2, 'lamp', .8, emis=1)
    return (fx0, fy0, fx1, fy1, (gx0, gy0, gx1, gy1))


BAYER = (np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) + .5) / 16


def dither_field(field):
    """Bool mask from a [0,1] field using ordered dithering (soft edges for ramp-swap tints)."""
    h, w = field.shape
    bay = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w]
    return field > bay


def cabochon_floor(c, p, X0, X1, Z0, Z1, size=18, light='a_marble', dark='a_vmarble', seed=3, cracks=10,
                   lum_l=.5, lum_d=.55, border=7, inset=3.6, grout=.3):
    """Large cream marble slabs with small dark diamond insets at the corners and a dark border band."""
    pts = p.quad([(X0, 0, Z0), (X1, 0, Z0), (X1, 0, Z1), (X0, 0, Z1)])
    N = noise2(c.w, c.h, 7, seed, 3)
    N2 = noise2(c.w, c.h, 30, seed + 3, 2)
    rng = np.random.default_rng(seed)
    m, r = c.poly_mask(pts)
    yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32) + .5
    X, _, Z = inv_hplane(p, xx, yy)
    s = np.maximum((yy - p.hy) / p.E, 1e-3)
    u = (X - X0 - border) / size
    v = (Z - Z0 - border) / size
    fu, fv = u - np.floor(u), v - np.floor(v)
    du = np.minimum(fu, 1 - fu) * size
    dv = np.minimum(fv, 1 - fv) * size
    ins = (du + dv) < inset
    gw = .75 / s
    grout_m = (du < gw * .5) | (dv < gw * .7)
    bord = (X < X0 + border) | (X > X1 - border) | (Z < Z0 + border)
    xi = np.clip(xx.astype(int), 0, c.w - 1)
    yi = np.clip(yy.astype(int), 0, c.h - 1)
    vein = np.abs(np.sin(N[yi, xi] * 10 + X * .04 + Z * .06)) < .1
    Ll = lum_l + (N2[yi, xi] - .5) * .1 - vein * .08
    Ll = np.where(grout_m, grout + .08, Ll)
    Ld = lum_d + vein * .18
    dm = m & (ins | bord)
    lm = m & ~dm
    c._apply(lm, light, Ll, region=r, dith=.35)
    c._apply(dm, dark, np.where(bord & grout_m, grout, Ld), region=r, dith=.35)
    for _ in range(cracks):
        Xc = rng.uniform(X0 + 12, X1 - 12)
        Zc = rng.uniform(Z0 + 8, Z1 - 4)
        ang = rng.uniform(0, math.pi)
        prev = p.P(Xc, 0, Zc)
        for k in range(int(rng.integers(3, 8))):
            ang += rng.normal(0, .6)
            Xc += math.cos(ang) * 3
            Zc += math.sin(ang) * 2
            cur = p.P(Xc, 0, Zc)
            c.line(prev[0], prev[1], cur[0], cur[1], dark, .25)
            prev = cur
    return pts


def padlock_icon(c, x, y, rmp='brass', lum=.6, size=1):
    """Tiny padlock, (x, y) = bottom-left of the body."""
    w, h = 3 + size, 3 + size
    c.rect(x, y - h, x + w, y, rmp, lum, dith=0)
    c.hline(x, x + w, y - h, rmp, lum + .25)
    c.put(x + w // 2, y - h // 2, 'black', .2)
    c.vline(x + 1 - (size > 1), y - h - 2 - size, y - h, 'chrome', .7)
    c.vline(x + w - 2 + (size > 1), y - h - 2 - size, y - h, 'chrome', .55)
    c.hline(x + 1 - (size > 1), x + w - 1 + (size > 1), y - h - 2 - size, 'chrome', .8)


def key_wall(c, x0, y0, x1, y1, seed=4, board='oak', lum=.42):
    """Pegboard crowded with key blanks on hooks, in labelled sections."""
    rng = np.random.default_rng(seed)
    c.rect(x0 - 2, y0 - 2, x1 + 2, y1 + 2, 'a_walnut', .45, dith=0)
    c.hline(x0 - 2, x1 + 2, y0 - 2, 'a_walnut', .7)
    c.rect(x0, y0, x1, y1, board, lum, dith=.3)
    for yy in range(y0 + 1, y1, 3):
        for xx in range(x0 + 1 + (yy // 3) % 2, x1, 3):
            c.put(xx, yy, board, lum - .2)
    rows = list(range(y0 + 3, y1 - 6, 8))
    for r, ry in enumerate(rows):
        # section label strip
        c.hline(x0 + 1, x1 - 1, ry - 2, 'paper', .55)
        x = x0 + 2
        while x < x1 - 3:
            n = int(rng.integers(2, 5))          # keys stacked on one hook
            mat = 'brass' if rng.random() < .65 else ('chrome' if rng.random() < .7 else 'gold')
            c.put(x + 1, ry, 'black', .3)           # hook
            for k in range(n):
                kx = x + k % 2
                ky = ry + 1 + k // 2
                c.put(kx, ky, mat, .55 + rng.random() * .3)
                c.put(kx + 1, ky, mat, .45 + rng.random() * .2)
            c.vline(x + 1, ry + 2, ry + 5 + int(rng.integers(0, 2)), mat, .5 + rng.random() * .3)
            c.put(x + 1, ry + 1, mat, .9)
            x += int(rng.integers(3, 5))


def cash_register(c, x, y, w=22, h=18):
    """Ornate brass cash register, (x, y) = bottom centre."""
    hw = w // 2
    c.rect(x - hw, y - 5, x + hw, y, 'brass', vgrad(y - 5, y, .62, .4), dith=.2)       # drawer
    c.hline(x - hw, x + hw, y - 5, 'brass', .82)
    c.rect(x - 2, y - 3, x + 2, y - 2, 'black', .3)
    c.poly([(x - hw + 1, y - 5), (x + hw - 1, y - 5), (x + hw - 3, y - h + 5), (x - hw + 3, y - h + 5)], 'brass',
           hgrad(x - hw, x + hw, .7, .45), dith=.25)
    # scrollwork + keys
    for r in range(3):
        yy = y - 7 - r * 3
        for kx in range(x - hw + 3 + r, x + hw - 3 - r, 2):
            c.put(kx, yy, 'cream', .75 - r * .05)
            c.put(kx, yy + 1, 'black', .2)
    # marquee with the amount window
    c.rect(x - hw + 3, y - h, x + hw - 3, y - h + 5, 'brass', .62, dith=0)
    c.hline(x - hw + 3, x + hw - 3, y - h, 'brass', .9)
    c.ellipse(x, y - h, hw - 4, 2.5, 'brass', .66, dith=0)
    c.rect(x - 5, y - h + 1, x + 5, y - h + 4, 'cream', .82, dith=0)
    c.hline(x - 4, x + 4, y - h + 2, 'black', .35)
    # crank on the side
    c.line(x + hw, y - 8, x + hw + 3, y - 10, 'brass', .6)
    c.put(x + hw + 3, y - 11, 'black', .3)
    c.put(x - hw + 2, y - h + 6, 'brass', 1.0)


def curtain_doorway(c, x0, y0, x1, y1, rmp='red', lum=.45, gap=3, light='lamp', frame='a_walnut', seed=2):
    """Doorway closed by a heavy curtain on rings, parted slightly, light leaking through."""
    c.rect(x0 - 3, y0 - 4, x1 + 3, y1, frame, .42, dith=0)
    c.hline(x0 - 3, x1 + 3, y0 - 4, frame, .65)
    mid = (x0 + x1) // 2
    c.rect(mid - gap, y0, mid + gap, y1, light, vgrad(y0, y1, .55, .3), emis=.8, dith=.5)
    c.vline(mid, y0 + 6, y1, 'black', .3)                                   # someone's shadow beyond
    for (a, b, side) in ((x0, mid - gap + 1, 'l'), (mid + gap - 1, x1, 'r')):
        def fn(xx, yy, a=a, b=b, side=side):
            t = (xx - a) / max(1, b - a)
            folds = np.sin(t * math.pi * 5 + (yy - y0) * .015) * .14
            edge = (1 - t) if side == 'r' else t
            return lum + folds - .06 * (1 - edge) + vgrad(y0, y1, .04, -.06)(xx, yy)
        c.rect(a, y0, b, y1, rmp, fn, dith=.4)
    c.rect(x0 - 2, y0 - 2, x1 + 2, y0, 'brass', .55, dith=0)                 # rod + rings
    for xx in range(x0, x1 + 1, 3):
        c.put(xx, y0, 'brass', .8)
    c.hline(x0, x1, y1 - 1, 'black', .25)


def sleeping_cat(c, x, y, rmp='a_ginger', lum=.55, facing=1):
    """Curled-up cat seen from the front-side, (x, y) = bottom centre."""
    f = facing
    c.ellipse(x, y - 3, 7, 3.2, rmp, vgrad(y - 6, y, lum + .12, lum - .15), dith=.2)
    c.ellipse(x + f * 6, y - 4, 3.2, 2.8, rmp, lum + .08, dith=0)          # head
    for ex in (x + f * 4, x + f * 7):                                     # ears
        c.put(ex, y - 7, rmp, lum + .15)
        c.put(ex, y - 8, rmp, lum + .05)
    c.hline(x + f * 5 - (f < 0) * 1, x + f * 5 + 2 - (f < 0) * 3, y - 4, 'black', .2)   # closed eye
    c.put(x + f * 8, y - 3, 'cream', .6)                                  # muzzle
    for k in (-4, -1, 2):                                                 # tabby stripes
        c.vline(x + k * f, y - 5, y - 3, rmp, lum - .2)
    # tail curled around the front
    c.hline(x - 6, x + 3, y, rmp, lum - .05)
    c.put(x + 4, y - 1, rmp, lum)
    c.put(x - 7, y - 1, rmp, lum - .1)
    c.hline(x - 5, x + 2, y - 1, rmp, lum + .1)


def ornate_safe(c, p, X0, X1, Z0, Z1, H, rmp='teal', lum=.42, name='HASK & SON'):
    """Showroom safe: dark green enamel, gold scrollwork, painted vignette, brass dial + handle."""
    box(c, p, X0, X1, 3, H, Z0, Z1, rmp, lum, top=lum + .22, side=lum - .14)
    box(c, p, X0 - 1, X1 + 1, 0, 3, Z0 - 1, Z1 + 1, 'a_walnut', .4, top=.55, side=.3)
    fx0, fy0 = P(p, X0, H, Z1)
    fx1, fy1 = P(p, X1, 3, Z1)
    mx = (fx0 + fx1) // 2
    c.rect(fx0 + 2, fy0 + 2, fx1 - 2, fy1 - 2, rmp, lum + .04, dith=.2)
    c.hline(fx0, fx1, fy0, rmp, lum + .3)
    c.vline(fx0, fy0, fy1, rmp, lum + .2)
    # double gold border with corner flourishes
    for d, L in ((3, .62), (5, .45)):
        c.hline(fx0 + d, fx1 - d, fy0 + d, 'gold', L)
        c.hline(fx0 + d, fx1 - d, fy1 - d - 1, 'gold', L - .05)
        c.vline(fx0 + d, fy0 + d, fy1 - d, 'gold', L)
        c.vline(fx1 - d - 1, fy0 + d, fy1 - d, 'gold', L - .05)
    for (cx_, cy_, sx, sy) in ((fx0 + 7, fy0 + 7, 1, 1), (fx1 - 8, fy0 + 7, -1, 1), (fx0 + 7, fy1 - 8, 1, -1),
                               (fx1 - 8, fy1 - 8, -1, -1)):
        c.put(cx_, cy_, 'gold', .8)
        c.put(cx_ + sx, cy_, 'gold', .6)
        c.put(cx_, cy_ + sy, 'gold', .6)
        c.put(cx_ + 2 * sx, cy_ + sy, 'gold', .5)
    # painted vignette (harbour at sunset) in an oval
    vy = fy0 + 11
    c.ellipse(mx, vy, 9, 4.2, 'gold', .6, dith=0)
    c.ellipse(mx, vy, 8, 3.4, 'dusk', vgrad(vy - 3, vy + 3, .8, .5), dith=.3)
    c.rect(mx - 7, vy + 1, mx + 8, vy + 3, 'water', .55, dith=.3)
    c.poly([(mx - 3, vy + 1), (mx + 1, vy - 2), (mx + 4, vy + 1)], 'mauve', .5, dith=0)
    c.put(mx + 5, vy - 2, 'lamp', .9)
    # maker's name
    if name and text_w(name) <= fx1 - fx0 - 12:
        text(c, mx - text_w(name) // 2, vy + 6, name, 'gold', .66)
    # dial + handle
    dy = vy + 17
    c.ellipse(mx, dy, 4.4, 4.4, 'brass', .45, dith=0)
    c.ellipse(mx, dy, 3.4, 3.4, 'chrome', .6, dith=0)
    c.ellipse(mx, dy, 1.4, 1.4, 'chrome', .35, dith=0)
    for k in range(8):
        a = k / 8 * 2 * math.pi
        c.put(int(round(mx + math.cos(a) * 3)), int(round(dy + math.sin(a) * 3)), 'black', .3)
    c.put(mx - 1, dy - 3, 'white', .95)
    c.put(mx, dy - 5, 'red', .6)
    c.rect(mx + 7, dy - 1, mx + 9, dy + 7, 'brass', .6, dith=0)
    c.put(mx + 7, dy - 1, 'brass', 1.0)
    c.line(mx + 8, dy + 7, mx + 12, dy + 7, 'brass', .55)
    return (fx0, fy0, fx1, fy1)


# ------------------------------------------------------------- state-object helpers ----
def snapshot(c):
    return {k: getattr(c, k).copy() for k in ('rid', 'lum', 'emis', 'dith')}


def restore_state(sc, name, snap, mask, depth=None, baseline=None):
    """State object made of the pre-snapshot pixels under `mask` (e.g. 'carbon_gone' = the basket
    as it looked before the paper was drawn). Call after all lighting is set up."""
    with sc.obj(name, state=True, depth=depth, baseline=baseline) as cc:
        for k, v in snap.items():
            getattr(cc, k)[mask] = v[mask]
        cc.owner[mask] = cc.cur_owner


# ----------------------------------------------------------------------- flat props ----
def gramophone(c, x, y, horn='brass', box_r='a_walnut', record=True):
    """Gramophone with a big flared horn pointing up-left, (x, y) = bottom centre of the box."""
    c.rect(x - 8, y - 7, x + 8, y, box_r, vgrad(y - 7, y, .66, .42), dith=.2)
    c.hline(x - 8, x + 8, y - 7, box_r, .82)
    c.hline(x - 8, x + 8, y - 1, 'brass', .55)
    c.rect(x - 3, y - 5, x + 3, y - 2, box_r, .45, dith=0)
    c.put(x, y - 4, 'brass', .8)
    c.line(x + 8, y - 4, x + 11, y - 3, 'brass', .62)               # crank
    c.put(x + 11, y - 2, 'black', .3)
    if record:
        c.ellipse(x, y - 8, 7, 1.5, 'black', .22, dith=0)
        c.ellipse(x, y - 8, 2, .6, 'red', .6, dith=0)
        c.put(x - 5, y - 9, 'slate', .62)
    # tone arm rising to the horn
    c.line(x + 5, y - 8, x + 4, y - 14, 'brass', .62)
    c.line(x + 4, y - 14, x + 1, y - 17, 'brass', .68)
    # flared horn opening up and to the left, bell facing the viewer
    hx_, hy_ = x - 9, y - 27
    c.poly([(x + 2, y - 16), (x, y - 19), (hx_ + 2, hy_ + 1), (hx_ + 8, hy_ + 9)], horn, .55, dith=.25)
    c.ellipse(hx_, hy_, 7.5, 6.5, horn, .72, dith=.2)
    c.ellipse(hx_ + 1, hy_ + 1, 5, 4.2, horn, .32, dith=.2)
    c.ellipse(hx_ + 2, hy_ + 2, 2, 1.6, horn, .15, dith=0)
    for k in range(8):
        a = k / 8 * 2 * math.pi
        c.put(int(round(hx_ + math.cos(a) * 7)), int(round(hy_ + math.sin(a) * 6)), horn, .92 if k in (4, 5) else .6)


def scatter_papers(c, p, X0, X1, Z0, Z1, n=12, seed=3, rmp='paper', avoid=None):
    """Sheets of paper strewn on the floor (perspective-flat quads), varied size/tone, some written on."""
    rng = np.random.default_rng(seed)
    out = []
    for i in range(n):
        Xc = rng.uniform(X0, X1)
        Zc = rng.uniform(Z0, Z1)
        if avoid and avoid(Xc, Zc):
            continue
        a = rng.uniform(0, math.pi)
        w, h = 5 + rng.random() * 4, 7 + rng.random() * 4
        corners = []
        for (u, v) in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)):
            corners.append((Xc + u * math.cos(a) - v * math.sin(a), .15, Zc + u * math.sin(a) + v * math.cos(a)))
        q = p.quad(corners)
        L = .62 + rng.random() * .2
        c.poly(q, rmp, L, dith=0)
        # a curled edge catches the light
        c.line(q[0][0], q[0][1], q[1][0], q[1][1], rmp, L + .12)
        cx_, cy_ = p.P(Xc, 0, Zc)
        if rng.random() < .45:
            c.hline(int(cx_) - 1, int(cx_) + 2, int(cy_), 'night', .55)
        out.append((Xc, Zc))
    return out


def overturned_chair(c, p, X, Z, rmp='oak', lum=.55):
    """A kitchen chair knocked over backwards: backrest flat on the floor, seat standing on edge,
    four legs sticking out towards the camera."""
    # backrest lying on the floor (pointing left)
    back = p.quad([(X - 14, .4, Z - 3), (X, .4, Z - 3), (X, .4, Z + 3), (X - 14, .4, Z + 3)])
    c.poly(back, rmp, lum - .08, dith=.2)
    for k in range(4):
        a, b = p.P(X - 12 + k * 3.5, .45, Z - 3), p.P(X - 12 + k * 3.5, .45, Z + 3)
        c.line(a[0], a[1], b[0], b[1], rmp, lum - .28)
    a, b = p.P(X - 14, .5, Z - 3), p.P(X, .5, Z - 3)
    c.line(a[0], a[1], b[0], b[1], rmp, lum + .15)
    # seat on edge: a vertical slab facing the camera
    sx0, sy0 = p.P(X, 11, Z + 4)
    sx1, sy1 = p.P(X + 2, 0, Z + 4)
    c.rect(int(sx0), int(sy0), int(sx1) + 1, int(sy1), rmp, lum + .12, dith=0)
    c.vline(int(sx0), int(sy0), int(sy1), rmp, lum + .28)
    # legs sticking up/right, with a stretcher
    for (dy, dz) in ((10, -2), (10, 4), (1, -2), (1, 4)):
        a = p.P(X + 2, dy, Z + dz)
        b = p.P(X + 15, dy + 1.5, Z + dz)
        c.line(a[0], a[1], b[0], b[1], rmp, lum + .05 + (.1 if dz > 0 else -.08))
    a, b = p.P(X + 10, 10.8, Z - 2), p.P(X + 10, 2, Z - 2)
    c.line(a[0], a[1], b[0], b[1], rmp, lum - .1)
    for (dy, dz) in ((10, 4), (1, 4)):
        x_, y_ = p.P(X + 15, dy + 1.5, Z + dz)
        c.put(int(x_), int(y_), rmp, lum + .25)


def bookshelf(c, x0, y0, x1, y1, rmp='a_walnut', lum=.45, shelves=4, seed=5, gaps=.25, fallen=None):
    """Frontal bookcase with books of varied height/colour; gaps where books were pulled out."""
    rng = np.random.default_rng(seed)
    c.rect(x0, y0, x1, y1, rmp, lum, dith=.2)
    c.hline(x0, x1, y0, rmp, lum + .25)
    c.vline(x0, y0, y1, rmp, lum + .15)
    c.vline(x1 - 1, y0, y1, rmp, lum - .15)
    sh = (y1 - y0 - 4) / shelves
    cols = ['red', 'night', 'felt', 'trench', 'paper', 'mauve', 'oak', 'teal']
    for i in range(shelves):
        a = int(y0 + 2 + i * sh)
        b = int(y0 + 2 + (i + 1) * sh)
        c.rect(x0 + 2, a, x1 - 2, b - 1, rmp, .14, dith=0)
        c.hline(x0 + 1, x1 - 1, b - 1, rmp, lum + .2)
        x = x0 + 2
        while x < x1 - 3:
            if rng.random() < gaps:
                if rng.random() < .5:   # a book lying flat / leaning
                    c.rect(x, b - 3, x + 5, b - 1, cols[int(rng.integers(0, len(cols)))], .5, dith=0)
                x += int(rng.integers(3, 6))
                continue
            bw = int(rng.integers(1, 3))
            bh = int(rng.integers(int(sh * .55), int(sh) - 1))
            col = cols[int(rng.integers(0, len(cols)))]
            L = .4 + rng.random() * .25
            c.rect(x, b - 1 - bh, x + bw, b - 1, col, L, dith=0)
            c.put(x, b - bh, col, L + .2)
            if bh > 4:
                c.put(x, b - 1 - bh // 2, 'gold', .6)
            x += bw + (1 if rng.random() < .2 else 0)


# ----------------------------------------------------------------------- pharmacy ----
def jar(c, x, y, w=5, h=7, glass='a_jarglass', lum=.55, label=True, lid='brass', contents=None, seed=0):
    """Apothecary jar standing on a shelf, (x, y) = bottom-left."""
    c.rect(x, y - h, x + w, y, glass, hgrad(x, x + w, lum + .15, lum - .1), emis=.15, dith=.25)
    if contents:
        c.rect(x + 1, y - h // 2, x + w - 1, y - 1, contents[0], contents[1], dith=.2)
    c.vline(x + 1, y - h + 1, y - 1, glass, lum + .3, emis=.2)       # glint
    c.rect(x - (w > 4), y - h - 2, x + w + (w > 4), y - h, lid, .6, dith=0)
    c.put(x + w // 2, y - h - 3, lid, .8)
    if label and h >= 6:
        ly = y - h + 2 + (h > 8)
        c.rect(x + 1, ly, x + w - 1, ly + 2, 'paper', .82, dith=0)
        c.hline(x + 1, x + w - 1, ly, 'gold', .55)


def jar_shelves(c, x0, y0, x1, y1, shelves=4, seed=3, rmp='a_walnut', lum=.45):
    """Open walnut shelving packed with apothecary jars, carboys and bottles."""
    rng = np.random.default_rng(seed)
    c.rect(x0, y0, x1, y1, rmp, .2, dith=.3)                               # dark back of the case
    sh = (y1 - y0) / shelves
    glasses = [('a_jarglass', .55), ('a_jarglass', .45), ('a_amberglass', .5), ('glass', .5), ('white', .55),
               ('a_globe_g', .35)]
    for i in range(shelves):
        b = int(y0 + (i + 1) * sh)
        a = int(y0 + i * sh)
        x = x0 + 2
        while x < x1 - 6:
            g, L = glasses[int(rng.integers(0, len(glasses)))]
            w = int(rng.integers(3, 7))
            h = int(rng.integers(max(4, int(sh * .4)), max(5, int(sh) - 4)))
            if x + w > x1 - 2:
                break
            cont = None
            if g in ('a_jarglass', 'glass') and rng.random() < .5:
                cont = (['red', 'felt', 'cream', 'a_amberglass', 'mauve'][int(rng.integers(0, 5))], .5)
            if g == 'white':
                jar(c, x, b - 2, w, h, 'white', .6, label=True, lid='white', seed=i)
                c.hline(x, x + w, b - 2 - h // 2, 'night', .45)              # blue band on porcelain
            else:
                jar(c, x, b - 2, w, h, g, L, label=rng.random() < .85, lid='brass' if rng.random() < .7 else 'a_walnut',
                    contents=cont)
            x += w + int(rng.integers(1, 3))
        # the shelf board with a brass label rail
        c.rect(x0, b - 2, x1, b, rmp, lum + .1, dith=0)
        c.hline(x0, x1, b - 2, rmp, lum + .3)
        c.hline(x0, x1, b, 'black', .2)
        for lx in range(x0 + 4, x1 - 4, 9):
            c.put(lx, b - 1, 'brass', .7)
    # carved uprights
    for xx in (x0, x1 - 3):
        c.rect(xx, y0, xx + 3, y1, rmp, lum + .05, dith=0)
        c.vline(xx, y0, y1, rmp, lum + .25)


def show_globe(c, x, y, r, rmp, on=True, stand='brass'):
    """Pharmacy show globe: a big glass carboy of coloured liquid on a pedestal, (x, y) = globe centre."""
    c.rect(x - 2, y + r - 1, x + 3, y + r + 5, stand, .55, dith=0)          # neck/pedestal
    c.rect(x - 4, y + r + 5, x + 5, y + r + 7, stand, .7, dith=0)
    c.ellipse(x + .5, y, r, r, rmp, radial(x - r * .3, y - r * .35, r * 1.6, .98, .45), emis=.85 if on else .2,
              dith=.4)
    c.ellipse(x + .5, y - r - 1, 1.6, 1.2, rmp, .6, emis=.6 if on else 0, dith=0)   # stopper finial
    c.put(x, y - r - 3, stand, .8)
    c.put(int(x - r * .45), int(y - r * .45), 'white', 1.0, emis=1)
    c.put(int(x - r * .45) + 1, int(y - r * .45), 'white', .85, emis=1)
    c.put(int(x - r * .45), int(y - r * .45) + 1, 'white', .8, emis=1)


def bead_curtain(c, x0, y0, x1, y1, seed=2, sway=0.0, cols=('a_beads', 'red', 'gold', 'a_beads'), back=None):
    """Strings of wooden beads hanging in a doorway. back=(ramp, lum, emis) paints the room beyond."""
    rng = np.random.default_rng(seed)
    if back:
        c.rect(x0, y0, x1, y1, back[0], vgrad(y0, y1, back[1], back[1] * .6), emis=back[2], dith=.5)
    for i, x in enumerate(range(x0 + 1, x1 - 1, 2)):
        ph = rng.random() * 6
        for y in range(y0 + 1, y1 - 1):
            t = (y - y0) / max(1, y1 - y0)
            dx = math.sin(ph + y * .15) * sway * t
            if (y + i) % 2 == 0:
                col = cols[(y // 3 + i) % len(cols)]
                c.put(int(round(x + dx)), y, col, .55 + .25 * ((y // 2 + i) % 2))
            else:
                c.put(int(round(x + dx)), y, 'black', .25)


def penny_scale(c, x, y):
    """Coin-operated 'YOUR WEIGHT' scale, (x, y) = bottom centre."""
    c.rect(x - 6, y - 3, x + 6, y, 'chrome', .5, dith=0)                    # platform
    c.hline(x - 6, x + 6, y - 3, 'chrome', .78)
    c.rect(x - 2, y - 22, x + 2, y - 3, 'red', hgrad(x - 2, x + 2, .65, .4), dith=0)
    c.ellipse(x, y - 27, 5, 5, 'red', .55, dith=0)
    c.ellipse(x, y - 27, 3.6, 3.6, 'cream', .82, emis=.3, dith=0)
    c.line(x, y - 27, x + 2, y - 29, 'black', .2)
    c.rect(x - 1, y - 18, x + 1, y - 16, 'chrome', .8, dith=0)              # coin slot
    c.put(x, y - 33, 'chrome', .8)


# --------------------------------------------------------------------- commission ----
def typist(c, x, top, scale=1.0, hair='a_walnut', hair_l=.35, blouse='white', blouse_l=.62, skin='skin', look=0,
           seed=0):
    """Seated typist seen from the front over her desk: head + shoulders + forearms.
    (x, top) = top of the head. look: -1/0/1 head turned left/centre/right."""
    s = scale
    hw = int(round(3 * s))
    hh = int(round(4 * s)) + 1
    # shoulders / blouse
    sy = top + hh + 1
    c.poly([(x - hw - 3, sy + 2), (x - hw, sy), (x + hw + 1, sy), (x + hw + 4, sy + 2), (x + hw + 5, sy + 12),
            (x - hw - 4, sy + 12)], blouse, vgrad(sy, sy + 12, blouse_l + .08, blouse_l - .14), dith=.2)
    c.vline(x, sy + 1, sy + 4, blouse, blouse_l - .2)                   # placket
    c.put(x - 1, sy, blouse, blouse_l + .15)
    c.put(x + 1, sy, blouse, blouse_l + .15)
    # neck + face
    c.rect(x - 1, sy - 1, x + 2, sy + 1, skin, .55, dith=0)
    c.rect(x - hw + 1, top + 1, x + hw, top + hh + 1, skin, hgrad(x - hw, x + hw, .7, .55), dith=0)
    ex = x + look
    c.put(ex - 1, top + 3, 'black', .2)
    c.put(ex + 1, top + 3, 'black', .2)
    c.put(ex, top + hh - 1, 'red', .5)                                  # lipstick
    # hair: rolled 40s style
    c.rect(x - hw, top - 1, x + hw + 1, top + 2, hair, hair_l, dith=0)
    c.rect(x - hw - 1, top + 1, x - hw + 1, top + hh + 2, hair, hair_l - .05, dith=0)
    c.rect(x + hw, top + 1, x + hw + 2, top + hh + 2, hair, hair_l - .08, dith=0)
    c.hline(x - hw, x + hw, top - 1, hair, hair_l + .15)
    # forearms reaching to the keys
    c.line(x - hw - 3, sy + 8, x - 2, sy + 12, blouse, blouse_l - .05)
    c.line(x + hw + 4, sy + 8, x + 3, sy + 12, blouse, blouse_l - .1)


def fluorescent(c, x0, x1, y, on=True, chain_top=0):
    """Hanging two-tube fluorescent fixture."""
    for xx in (x0 + 3, x1 - 3):
        c.vline(xx, chain_top, y - 2, 'a_iron', .45)
    c.rect(x0, y - 2, x1, y, 'a_olivegray', .55, dith=0)
    c.hline(x0, x1, y - 2, 'a_olivegray', .75)
    for k, yy in enumerate((y, y + 1)):
        c.hline(x0 + 1, x1 - 1, yy, 'a_fluor', .95 if on else .35, emis=1 if on else 0)
    c.put(x0, y, 'a_olivegray', .4)
    c.put(x1 - 1, y, 'a_olivegray', .4)


def harbour_view(c, x0, y0, x1, y1, seed=2, cranes=2):
    """Overcast harbour through a window: grey sky, gantry cranes, a freighter, choppy water."""
    rng = np.random.default_rng(seed)
    c.rect(x0, y0, x1, y1, 'a_skyday', vgrad(y0, y1, .82, .6), emis=.85, dith=.6)
    wl = y0 + (y1 - y0) * 3 // 4
    # far shore / warehouses
    c.rect(x0, wl - 6, x1, wl, 'fog', .45, emis=.7, dith=.3)
    for k in range(x0, x1, 7):
        h_ = int(rng.integers(2, 6))
        c.rect(k, wl - 6 - h_, k + 5, wl - 6, 'fog', .4, emis=.7)
    # freighter
    sx = x0 + (x1 - x0) // 3
    c.poly([(sx, wl - 2), (sx + 22, wl - 2), (sx + 19, wl + 2), (sx + 2, wl + 2)], 'slate', .35, emis=.6, dith=0)
    c.rect(sx + 14, wl - 6, sx + 19, wl - 2, 'cream', .6, emis=.6)
    c.vline(sx + 8, wl - 10, wl - 2, 'slate', .3, emis=.6)
    # cranes: lattice towers with jibs
    for i in range(cranes):
        cx = x0 + 6 + i * (x1 - x0 - 12) // max(1, cranes - 1) if cranes > 1 else (x0 + x1) // 2
        top = y0 + 6 + i * 3
        for lx in (cx - 2, cx + 2):
            c.vline(lx, top, wl, 'slate', .25, emis=.6)
        for yy in range(top + 2, wl, 4):
            c.line(cx - 2, yy, cx + 2, yy + 3, 'slate', .3, emis=.6)
        jdir = 1 if i % 2 == 0 else -1
        c.line(cx, top, cx + jdir * 16, top + 3, 'slate', .25, emis=.6)
        c.line(cx, top + 2, cx + jdir * 16, top + 3, 'slate', .3, emis=.6)
        c.line(cx - jdir * 6, top + 2, cx, top, 'slate', .25, emis=.6)
        c.vline(cx + jdir * 12, top + 3, top + 12, 'black', .3, emis=.5)     # hook cable
        c.rect(cx - 3, wl - 4, cx + 4, wl, 'rust', .35, emis=.5)
    # water
    c.rect(x0, wl, x1, y1, 'water', vgrad(wl, y1, .55, .4), emis=.75, dith=.5)
    for k in range(10):
        xx = int(rng.integers(x0, x1 - 3))
        yy = int(rng.integers(wl + 1, y1))
        c.hline(xx, xx + 3, yy, 'fog', .7, emis=.7)
