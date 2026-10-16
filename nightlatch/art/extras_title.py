"""NIGHT LATCH - title screen background (ui/title.png) and logo (ui/title_logo.png).

Title: a rain-soaked Brackwater street at night in one-point perspective. A lone figure in
a trench coat and fedora waits under a cast-iron street lamp (left); neon signs (red HOTEL,
blue lantern) bleed into the wet asphalt; the City Hall clock tower and harbour cranes hang
in the fog at the end of the street. The logo area (top centre) is kept dark and calm and
the centre band where the menu sits is dark wet asphalt. The game animates the rain.

Logo: hand-built art-deco lettering in brass with a bevel, a keyhole cut through the A of
LATCH, a thin rule and a subtle warm glow; transparent background.
"""
from __future__ import annotations

import numpy as np

from core import Canvas, noise2, out_path, save_png, RAMPS
import extras_common as EC
from extras_common import dilate4, dilate8, shift

W, H = 320, 180
F, CX, CY = 150.0, 165.0, 92.0       # focal length, vanishing point
CAMH = 1.6                           # eye height (m)


def P(X, up, Z):
    """World (X right, up = height above the street, Z forward) -> screen."""
    return (CX + X * F / Z, CY + (CAMH - up) * F / Z)


def Pm(X, up, Z):
    """Mirror image in the wet ground (reflection of a point at height up)."""
    return (CX + X * F / Z, CY + (CAMH + up) * F / Z)


def quad(X0, up0, Z0, X1, up1, Z1, plane='x'):
    """Axis-aligned rectangle in world space -> screen polygon.
    plane='x': constant X (a facade), spans up0..up1 and Z0..Z1.
    plane='z': constant Z (faces the viewer), spans X0..X1 and up0..up1."""
    if plane == 'x':
        return [P(X0, up0, Z0), P(X0, up0, Z1), P(X0, up1, Z1), P(X0, up1, Z0)]
    return [P(X0, up0, Z0), P(X1, up0, Z0), P(X1, up1, Z0), P(X0, up1, Z0)]


def mask_of(c, pts):
    m, r = c.poly_mask(pts)
    M = np.zeros((c.h, c.w), bool)
    if m is not None:
        M[r[1]:r[3], r[0]:r[2]] = m
    return M


# =========================================================================================
#                                           TITLE
# =========================================================================================
def build_title():
    c = Canvas(W, H, seed=77)
    c.default_dith = .55
    rng = np.random.default_rng(9)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    N1 = noise2(W, H, 14, 4, 3)
    N2 = noise2(W, H, 4, 8, 2)
    N3 = noise2(W, H, 2, 12, 1)

    # ---- sky: dark overcast; the harbour fog glows low down at the end of the street ---------
    sky = .08 + .46 * np.clip((yy - 30) / 62, 0, 1) ** 1.8 + (N1 - .5) * .07
    glow_ = np.exp(-((xx - 178) / 40) ** 2) * np.clip((yy - 44) / 48, 0, 1) ** 1.2
    sky += .5 * glow_
    c.rect(0, 0, W, H, 'e_skyfog', sky, dith=.75)
    c.emis[:] = np.clip(glow_ * 1.2, 0, .9)         # the fog is lit from below: self-luminous

    # ---- the far shore, seen down the street: clock tower, cranes, a freighter --------------
    sil = .07
    # City Hall clock tower, just left of the vanishing point
    tx = 151
    c.rect(tx - 3, 71, tx + 5, 93, 'e_skyfog', sil, dith=0)
    c.rect(tx - 4, 60, tx + 6, 72, 'e_skyfog', sil + .04, dith=0)             # clock stage
    for yb in range(74, 92, 4):
        c.put(tx - 1, yb, 'e_window', .5, emis=.4)                             # tower slit windows
        c.put(tx + 3, yb + 2, 'e_window', .45, emis=.4)
    c.hline(tx - 5, tx + 7, 60, 'e_skyfog', sil + .1)
    c.hline(tx - 5, tx + 7, 71, 'e_skyfog', sil + .1)
    c.poly([(tx - 4, 60), (tx + 1, 50), (tx + 6, 60)], 'e_skyfog', sil, dith=0)
    c.vline(tx + 1, 46, 51, 'e_skyfog', sil)
    c.ellipse(tx + 1, 65.5, 3.4, 3.4, 'paper', .92, emis=.9, dith=0)       # the lit clock face
    for (px_, py_) in ((tx + 1, 63), (tx + 1, 64), (tx + 1, 65), (tx + 2, 65), (tx + 3, 66)):
        c.put(px_, py_, 'e_skyfog', .15)                                   # hands: ten to nine
    c.glow(tx + 1, 65.5, 14, '#ffe6b0', .4)
    c.glow(tx + 1, 65.5, 5, '#fff4d8', .45)
    # far-shore roofline and a freighter at the quay
    x = 128
    while x < 230:
        w_ = int(rng.integers(4, 11))
        h_ = int(rng.integers(2, 7))
        c.rect(x, 92 - h_, x + w_, 93, 'e_skyfog', sil + .1, dith=0)
        if rng.random() < .6:
            c.put(int(x + rng.integers(1, max(2, w_ - 1))), 92 - int(rng.integers(1, h_ + 1)), 'e_window', .6, emis=.6)
        x += w_
    c.poly([(160, 87), (207, 87), (204, 92), (163, 92)], 'e_skyfog', sil, dith=0)
    c.rect(186, 82, 197, 87, 'e_skyfog', sil + .04, dith=0)
    c.rect(190, 78, 193, 82, 'e_skyfog', sil, dith=0)
    c.hline(160, 207, 87, 'e_skyfog', sil + .2)
    for px_ in (166, 170, 174, 178, 199, 203):
        c.put(px_, 89, 'e_window', .75, emis=.7)
    for px_ in (188, 191, 194):
        c.put(px_, 84, 'e_window', .8, emis=.7)
    # two dockside cranes
    for (bx, top, jib, d) in ((171, 68, 18, 1), (201, 72, 16, -1)):
        c.rect(bx, top, bx + 3, 93, 'e_skyfog', sil, dith=0)
        for yk in range(top + 2, 92, 4):
            c.line(bx, yk, bx + 2, yk + 2, 'e_skyfog', sil + .25)
        tipx = bx + 1 + d * jib
        c.line(bx + 1, top + 1, tipx, top - 5, 'e_skyfog', sil - .02)
        c.line(bx + 1, top + 2, tipx, top - 4, 'e_skyfog', sil)
        c.line(bx + 1, top - 4, tipx, top - 5, 'e_skyfog', sil)
        c.vline(bx + 1, top - 4, top + 1, 'e_skyfog', sil)
        c.vline(tipx, top - 4, top + 7, 'e_skyfog', sil + .06)
        c.put(bx + 1, top - 5, 'neonred', 1.0, emis=1)
        c.glow(bx + 1, top - 5, 4, '#ff3030', .45)
    # harbour water beyond the quay, with the far lights shimmering on it
    c.rect(118, 93, 236, 97, 'water', .3, dith=.5)
    for k in range(60):
        x0 = int(rng.integers(130, 226))
        y0 = int(rng.integers(93, 97))
        c.hline(x0, x0 + int(rng.integers(1, 3)), y0, 'e_window', .4 + .25 * rng.random(), emis=.35)
    c.hline(150, 154, 94, 'paper', .7, emis=.5)                                 # the clock's reflection
    c.hline(151, 153, 96, 'paper', .55, emis=.4)

    # ---- left side: brick terrace at X = -6 -------------------------------------------------
    LX = -6.0
    left_bld = [(2.6, 12.0, 15, 'brick', .3), (12.0, 21.0, 11, 'e_wall', .42), (21.0, 33.0, 12, 'brick', .27),
                (33.0, 46.0, 8, 'e_wall', .38), (46.0, 72.0, 6, 'brick', .3)]
    for (z0, z1, h_, ramp_, l_) in left_bld:
        c.poly(quad(LX, 0, z0, 0, h_, z1), ramp_, l_ + (N2 - .5)[0, 0] * 0, dith=.6)
        c.poly(quad(LX, h_ - .55, z0, 0, h_, z1), ramp_, l_ * 1.7, dith=.2)    # cornice catches the glow
        a, b = P(LX, h_, z0), P(LX, 0, z0)
        c.line(a[0], a[1], b[0], b[1], ramp_, l_ * .6)                        # party wall edge
    # brick courses + pilasters on the near building
    for up in np.arange(.25, 15, .5):
        a = P(LX, up, 2.6)
        b = P(LX, up, 12.0)
        c.line(a[0], a[1], b[0], b[1], 'brick', .2)
    for zp in (2.6, 6.2, 9.2, 12.0):
        for up in np.arange(0, 15, .05):
            x_, y_ = P(LX, up, zp)
            if 0 <= x_ < W and 0 <= y_ < H:
                c.put(x_, y_, 'brick', .45)
    # shopfront under the lamp: a recessed door with a lit transom, a dark display window
    c.poly(quad(LX, 0, 6.6, 0, 2.5, 8.3), 'e_wall', .2, dith=.2)                 # door recess
    c.poly(quad(LX, 2.1, 6.9, 0, 2.45, 8.0), 'e_window', .4, emis=.3, dith=0)       # transom
    for zt in (7.25, 7.6):
        a, b = P(LX, 2.1, zt), P(LX, 2.45, zt)
        c.line(a[0], a[1], b[0], b[1], 'black', .4)
    c.poly(quad(LX, .1, 6.9, 0, 2.0, 8.0), 'wood', .25, dith=.2)                 # door
    c.poly(quad(LX, .5, 3.2, 0, 2.6, 5.9), 'glass', .14, dith=.3)                # display window
    for (zg_, up_) in ((3.6, 2.2), (4.4, 1.6), (5.2, 1.0)):
        a, b = P(LX, up_ + .5, zg_), P(LX, up_, zg_ + .5)
        c.line(a[0], a[1], b[0], b[1], 'glass', .55)                             # lamplight on the glass
    c.poly(quad(LX, 2.8, 2.9, 0, 3.4, 6.2), 'e_wall', .3, dith=.2)               # sign board
    # upper windows (dark) with sills
    for (z0, z1) in ((3.4, 5.4), (9.8, 11.4)):
        for up0 in (4.2, 7.6, 11.0):
            c.poly(quad(LX, up0, z0, 0, up0 + 2.0, z1), 'glass', .12, dith=.3)
            c.poly(quad(LX, up0 - .25, z0 - .2, 0, up0, z1 + .2), 'concrete', .42, dith=0)
    # a few lit windows down the street
    for (z0, up0, w_, l_) in ((14.5, .8, 2.2, .5), (25.0, 3.8, 1.6, .7), (36.0, 4.0, 1.8, .7)):
        c.poly(quad(LX, up0, z0, 0, up0 + 1.6, z0 + w_), 'e_window', l_, emis=.55, dith=.2)
    a_, b_ = P(LX, .8, 15.6), P(LX, 2.4, 15.6)
    c.line(a_[0], a_[1], b_[0], b_[1], 'black', .4)                               # mullion

    # ---- right side: the hotel and shopfronts at X = +12 ------------------------------------
    RX = 12.0
    right_bld = [(13.0, 21.0, 16, 'e_wall', .42), (21.0, 30.0, 12, 'brick', .32), (30.0, 44.0, 14, 'e_wall', .38),
                 (44.0, 72.0, 8, 'brick', .3)]
    for (z0, z1, h_, ramp_, l_) in right_bld:
        c.poly(quad(RX, 0, z0, 0, h_, z1), ramp_, l_, dith=.6)
        c.poly(quad(RX, h_ - .6, z0, 0, h_, z1), ramp_, l_ * 1.5, dith=.2)
        a, b = P(RX, h_, z0), P(RX, 0, z0)
        c.line(a[0], a[1], b[0], b[1], ramp_, l_ * .6)
    lit_windows = []
    for (z0, z1, h_, _, _) in right_bld:
        for up0 in np.arange(3.6, h_ - 1.5, 3.2):
            for zw in np.arange(z0 + .8, z1 - 1.2, 2.6):
                wx_, wy_ = P(RX, up0 + .85, zw + .6)
                in_logo = (48 <= wx_ <= 274) and (10 <= wy_ <= 68)
                lit = rng.random() < .2 and not in_logo
                c.poly(quad(RX, up0, zw, 0, up0 + 1.7, zw + 1.2),
                       'e_window' if lit else 'glass', .6 if lit else .18, emis=.6 if lit else None, dith=.2)
                if lit:
                    lit_windows.append((zw, up0))
    # a silhouette at one lit window of the hotel (somebody watching the street)
    zw, upw = 17.0, 6.8
    c.poly(quad(RX, upw, zw, 0, upw + 1.7, zw + 1.2), 'e_window', .68, emis=.7, dith=0)
    hx_, hy_ = P(RX, upw + 1.1, zw + .6)
    c.put(hx_, hy_, 'black', .3)
    c.put(hx_, hy_ + 1, 'black', .3)
    c.put(hx_ - 1, hy_ + 2, 'black', .3)
    c.put(hx_, hy_ + 2, 'black', .3)
    # shop windows at street level, with awnings
    for (z0, z1, lit) in ((14.0, 19.0, False), (22.0, 23.4, False), (31.0, 37.0, False), (45.0, 52.0, True)):
        c.poly(quad(RX, .6, z0, 0, 2.8, z1), 'e_window' if lit else 'glass', .45 if lit else .14,
               emis=.5 if lit else None, dith=.3)
        c.poly(quad(RX, 2.8, z0 - .3, 0, 3.3, z1 + .3), 'e_wall', .3, dith=.2)
    # hotel entrance canopy
    c.poly([P(RX, 3.1, 15.0), P(RX - 2.2, 3.1, 15.0), P(RX - 2.2, 3.1, 18.5), P(RX, 3.1, 18.5)], 'red', .3, dith=.3)
    c.poly([P(RX - 2.2, 3.1, 15.0), P(RX - 2.2, 2.7, 15.0), P(RX - 2.2, 2.7, 18.5), P(RX - 2.2, 3.1, 18.5)],
           'red', .45, dith=0)
    c.poly(quad(RX, .2, 15.6, 0, 2.6, 17.9), 'e_window', .3, emis=.25, dith=.3)    # lobby doors
    for zd in (16.2, 16.8, 17.4):
        a, b = P(RX - .02, .2, zd), P(RX - .02, 2.6, zd)
        c.line(a[0], a[1], b[0], b[1], 'black', .4)

    # ---- the ground: wet asphalt, sidewalks, kerbs ------------------------------------------
    ground = yy >= CY + 1
    zg = np.where(ground, (CAMH * F) / np.maximum(yy + .5 - CY, .5), 999)
    Xg = (xx + .5 - CX) * zg / F
    street = ground & (Xg > -3) & (Xg < 9)
    walk_l = ground & (Xg <= -3) & (Xg > LX)
    walk_r = ground & (Xg >= 9) & (Xg < RX)
    far = zg > 72
    asph = .19 + (N2 - .5) * .1 + .04 * np.sin(Xg * 2.1) + .06 * np.exp(-zg / 40) * 0
    c._apply(street & ~far, 'e_asphalt', asph, dith=.6)
    c._apply(far & ground & (xx > 110) & (xx < 245), 'water', .26 + (N2 - .5) * .08, dith=.5)
    slab = ((np.floor(zg / 1.5) + np.floor(Xg / 1.5)) % 2 == 0)
    c._apply(walk_l & ~far, 'concrete', .25 + .05 * slab + (N2 - .5) * .1, dith=.5)
    c._apply(walk_r & ~far, 'concrete', .23 + .05 * slab + (N2 - .5) * .1, dith=.5)
    # quay edge + railing at the end of the street
    qy = P(0, 0, 72)[1]
    c.hline(110, 245, int(qy), 'concrete', .4)
    for xr in range(112, 244, 3):
        c.put(xr, int(qy) - 1, 'black', .4)
    c.hline(110, 245, int(qy) - 2, 'black', .35)
    # kerbs: a lit top edge and a dark face
    for Xk, lit_ in ((-3.0, .62), (9.0, .42)):
        for z in np.arange(2.6, 72, .02):
            x_, y_ = P(Xk, .14, z)
            x2, y2 = P(Xk, 0, z)
            if 0 <= x_ < W and 0 <= y_ < H:
                c.put(x_, y_, 'concrete', lit_)
            if 0 <= x2 < W and 0 <= y2 < H and int(y2) != int(y_):
                c.put(x2, y2, 'concrete', .12)
    # tram rails converging on the harbour
    for Xr in (2.0, 3.5, 5.6, 7.1):
        for z in np.arange(2.8, 72, .03):
            x_, y_ = P(Xr, 0, z)
            if 0 <= x_ < W and 0 <= y_ < H:
                c.put(x_, y_, 'chrome', .3 if Xr < 4 else .24)
    # puddles: patches of the ground that mirror the sky
    def _pud(sx_, sy_, rX, rZ):
        Z_ = CAMH * F / (sy_ - CY)
        return ((sx_ - CX) * Z_ / F, Z_, rX, rZ)
    puddles = [_pud(282, 160, .95, .55), _pud(246, 121, .75, 1.0), _pud(62, 154, 1.0, .45),
               _pud(28, 171, .9, .35), _pud(258, 140, .5, .5), _pud(80, 140, .55, .5)]
    pud = np.zeros((H, W), bool)
    NP = noise2(W, H, 5, 17, 2)
    for (pX, pZ, rX, rZ) in puddles:
        dd = ((Xg - pX) / rX) ** 2 + ((zg - pZ) / rZ) ** 2
        pud |= ground & (dd <= 1 + (NP - .5) * 1.4)
        pud |= ground & (((Xg - pX - rX * .7) / (rX * .5)) ** 2 + ((zg - pZ + rZ * .3) / (rZ * .6)) ** 2 <= 1 + (NP - .5))
    # each puddle mirrors the sky: dark at its near edge, brightening toward its far edge,
    # with a thin lit rim where the far edge catches the fog glow
    pl = np.zeros((H, W), np.float32)
    for (pX, pZ, rX, rZ) in puddles:
        m_ = pud & (np.abs(Xg - pX) < rX * 2.2) & (np.abs(zg - pZ) < rZ * 2.2)
        t_ = np.clip((zg - (pZ - rZ)) / (2 * rZ), 0, 1)
        pl = np.where(m_, .08 + .3 * t_ ** 1.5, pl)
    c._apply(pud, 'e_skyfog', pl + (N3 - .5) * .05, dith=.6)
    puddle_mask = pud.copy()
    rim = pud & ~shift(pud, 1, 0)
    c._apply(rim, 'e_skyfog', np.full((H, W), .5, np.float32), dith=0)
    rip_ = pud & (((yy.astype(int) * 7 + (xx.astype(int) // 3) * 5) % 13) == 0) & ~rim
    c._apply(rip_, 'e_skyfog', np.full((H, W), .4, np.float32), dith=0)

    # ---- reflections in the wet ground -------------------------------------------------------
    def reflect_rect(X0, X1, up0, up1, Z, ramp_, lum_, emis_=.7, rip=1, gaps=.35, mask=None):
        x0, ya = Pm(X0, up0, Z)
        x1, yb = Pm(X1, up1, Z)
        xa, xb = sorted((x0, x1))
        for y in range(int(ya), int(yb) + 1):
            if not (0 <= y < H):
                continue
            k = (y - ya) / max(1, (yb - ya))
            if rng.random() < gaps * (.5 + 1.2 * k) or (y % 3 == 2 and rng.random() < .6):
                continue
            off = int(rng.integers(-rip, rip + 1))
            wcut = int(rng.integers(0, 2 + int(k * 3)))
            wet = 1.0 if pud[y, int(np.clip((xa + xb) / 2, 0, W - 1))] else .62
            for x in range(int(xa) + off + wcut, int(xb) + 1 + off - wcut):
                if 0 <= x < W and ground[y, x]:
                    c.put(x, y, ramp_, lum_ * (1 - .65 * k) * wet, emis=emis_)

    # ---- red HOTEL sign (projecting from the hotel) ------------------------------------------
    sz = 15.0
    sx0, sy1 = P(RX - 1.35, 2.9, sz)
    sx1, sy0 = P(RX, 8.4, sz)
    c.rect(sx0 - 1, sy0 - 1, sx1 + 1, sy1 + 1, 'black', .35, dith=0)
    c.rect(sx0, sy0, sx1, sy1, 'neonred', .22, dith=0)
    c.rect(sx0, sy0, sx1, sy0 + 1, 'neonred', .5, emis=.6, dith=0)
    letters = {'H': ['#.#', '#.#', '###', '#.#', '#.#'], 'O': ['###', '#.#', '#.#', '#.#', '###'],
               'T': ['###', '.#.', '.#.', '.#.', '.#.'], 'E': ['###', '#..', '##.', '#..', '###'],
               'L': ['#..', '#..', '#..', '#..', '###']}
    lx0 = int(round((sx0 + sx1) / 2)) - 1
    for i, ch in enumerate('HOTEL'):
        ly = int(sy0) + 4 + i * 9
        for j, row in enumerate(letters[ch]):
            for k, cc in enumerate(row):
                if cc == '#':
                    c.put(lx0 + k, ly + j, 'neonred', 1.0, emis=1)
    for yb in range(int(sy0) + 1, int(sy1), 2):
        on = (yb // 2) % 2 == 0
        c.put(int(sx0), yb, 'lamp' if on else 'neonred', .95 if on else .5, emis=1 if on else .4)
        c.put(int(sx1) - 1, yb + 1, 'lamp' if on else 'neonred', .95 if on else .5, emis=1 if on else .4)
    c.glow((sx0 + sx1) / 2, (sy0 + sy1) / 2, 30, '#ff3848', .5)
    c.glow((sx0 + sx1) / 2, (sy0 + sy1) / 2, 12, '#ff6a6a', .4)
    reflect_rect(RX - 1.35, RX, 2.9, 8.4, sz, 'neonred', .85, rip=1)
    reflect_rect(RX - .9, RX - .45, 3.2, 8.0, sz, 'neonred', 1.0, rip=1, gaps=.5)
    c.line(sx1, sy0 + 3, sx1 + 4, sy0 + 2, 'black', .5)                        # brackets
    c.line(sx1, sy1 - 3, sx1 + 4, sy1 - 4, 'black', .5)
    # ---- the Blue Lantern's sign further down ---------------------------------------------
    bz = 25.0
    bx0, by1 = P(RX - 1.3, 2.5, bz)
    bx1, by0 = P(RX - .1, 4.4, bz)
    bcx, bcy = (bx0 + bx1) / 2, (by0 + by1) / 2
    c.ellipse(bcx, bcy, (bx1 - bx0) / 2 + .6, (by1 - by0) / 2 + .4, 'neonblue', .92, emis=1, dith=0)
    c.hline(bcx - 2, bcx + 3, by0 - .5, 'black', .5)
    c.hline(bcx - 1, bcx + 2, by1 + .5, 'black', .5)
    c.put(bcx, by0 - 2, 'black', .5)
    c.glow(bcx, bcy, 20, '#3f88ff', .55)
    c.glow(bcx, bcy, 7, '#a0d0ff', .4)
    reflect_rect(RX - 1.3, RX - .1, 2.5, 4.4, bz, 'neonblue', .8, rip=1)
    c.poly(quad(RX - .05, .1, 23.6, 0, 2.5, 25.6), 'neonblue', .32, emis=.4, dith=.3)     # club door
    reflect_rect(RX - .1, RX, .1, 2.5, 24.6, 'neonblue', .45, rip=1)
    # lit hotel lobby + far shop window + clock reflect too
    reflect_rect(RX - .1, RX, .2, 2.6, 16.7, 'e_window', .5, rip=1)
    reflect_rect(RX - .1, RX, .6, 2.8, 48.0, 'e_window', .45, rip=1)

    # ---- the street lamp ------------------------------------------------------------------
    LZ, LXp = 6.3, -5.35
    lb = P(LXp, 0, LZ)
    lt = P(LXp, 4.3, LZ)
    lxp = int(round(lb[0]))
    gy0 = int(round(lb[1]))
    c.rect(lxp - 2, gy0 - 4, lxp + 3, gy0 + 1, 'black', .4, dith=0)               # base
    c.rect(lxp - 1, gy0 - 8, lxp + 2, gy0 - 4, 'black', .38, dith=0)
    c.hline(lxp - 2, lxp + 3, gy0 - 4, 'slate', .5)
    top_y = int(round(lt[1]))
    c.rect(lxp, top_y + 6, lxp + 1, gy0 - 8, 'black', .42, dith=0)              # post
    c.vline(lxp, top_y + 7, gy0 - 8, 'slate', .55)                              # lamp-lit edge
    c.hline(lxp - 3, lxp + 4, top_y + 9, 'black', .45)                          # ladder bar
    c.put(lxp - 3, top_y + 10, 'black', .45)
    c.put(lxp + 3, top_y + 10, 'black', .45)
    LAMP = ['.....k.....',
            '....kkk....',
            '..kkkkkkk..',
            '.kkkkkkkkk.',
            '..kLLkLLk..',
            '..kLWkWLk..',
            '..kLWkWLk..',
            '..kLLkLLk..',
            '...kLkLk...',
            '...kkkkk...',
            '....kkk....']
    lg = {'k': ('black', .42, 0.0), 'L': ('lamp', .78, 1.0), 'W': ('lamp', 1.0, 1.0)}
    hx0, hy0 = lxp - 5, top_y - 4
    for j, row in enumerate(LAMP):
        for i, ch in enumerate(row):
            if ch in lg:
                r_, l_, e_ = lg[ch]
                c.put(hx0 + i, hy0 + j, r_, l_, emis=e_)
    lampx, lampy = hx0 + 5, hy0 + 6
    c.glow(lampx, lampy, 40, '#ffb050', .5)
    c.glow(lampx, lampy, 16, '#ffd890', .55)
    c.glow(lampx, lampy, 5, '#fff2c8', .5)
    cone = [(lampx - 3, lampy + 4), (lampx + 3, lampy + 4), (lampx + 40, gy0 + 12), (lampx - 30, gy0 + 12)]
    c.light_poly(cone, .14)
    c.add_light(lampx, lampy, 90, .8, falloff=1.5)
    c.add_light(lampx + 10, lampy + 52, 44, .75, falloff=1.1, ystretch=.8)     # the wall behind him
    c.add_light(lampx + 6, gy0 + 4, 46, .6, ystretch=2.4, falloff=1.2)
    reflect_rect(LXp - .25, LXp + .25, 3.9, 4.6, LZ, 'lamp', .9, rip=1, gaps=.25)

    # warm pool of lamplight on the wet flagstones
    pcx, pcy = lampx + 8, gy0 + 3
    dpool = np.sqrt(((xx - pcx) / 30) ** 2 + ((yy - pcy) / 8) ** 2)
    bay = EC.bayer4(H, W)
    pool = ground & (dpool < 1) & (bay < (1 - dpool) * 1.4)
    c._apply(pool, 'lamp', np.clip(.42 - dpool * .3, .1, 1), emis=.55, dith=0)
    hot = ground & (dpool < .45) & (bay < (.45 - dpool) * 3)
    c._apply(hot, 'lamp', np.full((H, W), .62, np.float32), emis=.7, dith=0)

    # ---- the man under the lamp ----------------------------------------------------------
    fz, fX = 6.3, -4.6
    fb = P(fX, 0, fz)
    draw_figure(c, int(round(fb[0])), int(round(fb[1])), lampx, lampy)

    # ---- foreground details: a drain, a sodden newspaper in the gutter ----------------------
    gx, gy = P(-3.0, 0, 3.6)
    c.rect(gx - 7, gy, gx + 1, gy + 3, 'black', .28, dith=0)
    for k in range(int(gx) - 6, int(gx) + 1, 2):
        c.vline(k, int(gy) + 1, int(gy) + 3, 'slate', .4)
    npx, npy = 22, 166
    paper_pts = [(npx, npy), (npx + 15, npy - 2), (npx + 19, npy + 4), (npx + 3, npy + 7)]
    c.poly(paper_pts, 'paper', .5, dith=.3)
    c.line(npx + 3, npy + 2, npx + 13, npy + 1, 'paper', .3)
    c.line(npx + 4, npy + 4, npx + 14, npy + 3, 'paper', .3)
    c.rect(npx + 5, npy, npx + 9, npy + 1, 'ink', .4, dith=0)                     # masthead
    c.line(npx + 15, npy - 1, npx + 18, npy + 3, 'paper', .7)

    # ---- lighting --------------------------------------------------------------------------
    c.ambient = .5
    c.add_light(sx0 + 6, sy0 + 26, 72, .38, falloff=1.4)        # red neon spill
    c.add_light(bcx, bcy + 4, 36, .3, falloff=1.4)               # blue neon spill
    c.add_light(178, 88, 90, .2, falloff=1.4)                    # fog glow at the end of the street
    menu = np.exp(-((xx - 160) / 78) ** 4 - ((yy - 134) / 40) ** 4)
    c.shade *= 1 - .38 * menu
    logo = np.exp(-((xx - 160) / 118) ** 4 - ((yy - 38) / 26) ** 4)
    c.shade *= 1 - .22 * logo
    c.shade *= np.clip(1.12 - .5 * ((np.abs(xx - 160) / 160) ** 2.6 + (np.abs(yy - 90) / 90) ** 2.6), .58, 1)
    img = c.render()
    sky_id = c.ids.get('e_skyfog', -99)
    water_id = c.ids.get('water', -99)
    facade = ((c.rid != sky_id) & (c.rid != water_id) & (yy < CY + 1)).astype(np.float32)
    img = fog_overlay(img, yy, xx, N1, facade)
    img = mirror_puddles(img, puddle_mask, rng)
    save_png(img, out_path('ui', 'title.png'))
    return img


def mirror_puddles(img, pud, rng):
    """Puddles mirror the scene above the horizon (good for the sky, signs and far facades):
    sample the rendered image reflected about the horizon, darken it, ripple alternate rows
    and give each puddle a thin bright far rim."""
    out = img.copy()
    src = img.astype(np.float32)
    ys, xs = np.nonzero(pud)
    for y, x in zip(ys, xs):
        ysrc = int(round(CY - (y - CY) * 1.15))
        off = ((y // 2) % 3) - 1
        xsrc = int(np.clip(x + off, 0, W - 1))
        if 0 <= ysrc < H:
            col = src[ysrc, xsrc] * .62 + src[y, x] * .22
        else:
            col = src[y, x]
        if y % 4 == 3:
            col = col * .75
        out[y, x] = np.clip(col, 0, 255).astype(np.uint8)
    yy_, xx_ = np.mgrid[0:H, 0:W]
    rim = pud & ~shift(pud, 1, 0) & (((xx_ * 3 + yy_) % 5) != 0)
    out[rim] = np.clip(out[rim].astype(np.float32) * .65 + np.array(EC.hexrgb('#7d8aa0'), np.float32) * .35, 0, 255).astype(np.uint8)
    return out


def fog_overlay(img, yy, xx, N, facade=None):
    """Fog: a dithered blend toward a cool fog colour: aerial perspective on the facades (by
    depth), thick over the far harbour, a thin mist along the ground."""
    fog_col = np.array(EC.hexrgb('#56627a'), np.float32)
    canyon = np.exp(-((xx - 176) / 52) ** 2)
    ground = yy >= CY + 1
    zg = (CAMH * F) / np.maximum(yy + .5 - CY, .5)
    zl = 6.0 * F / np.maximum(CX - (xx + .5), .5)
    zr = 12.0 * F / np.maximum((xx + .5) - CX, .5)
    zf = np.where(ground, zg, np.where(xx < CX, zl, zr))
    depth = np.clip((zf - 11) / 70, 0, 1) ** .8 * facade
    f = np.exp(-((yy - 91) / 4) ** 2) * .45 * canyon * (0.6 + .7 * N)
    f += np.exp(-((yy - 84) / 12) ** 2) * .1 * canyon
    f += np.exp(-((yy - 122) / 10) ** 2) * .06 * (0.4 + N)                       # mist on the street
    f += depth * .3 * (.8 + .4 * N)
    bay = EC.bayer4(H, W)
    q = np.floor(f * 6 + (bay - .5) * .9 + .5) / 6.0
    q = np.clip(q, 0, .6)
    out = img.astype(np.float32) * (1 - q[..., None]) + fog_col[None, None, :] * q[..., None]
    return np.clip(out, 0, 255).astype(np.uint8)


# ------------------------------------------------------------------ the figure ------------
# Trench coat and fedora, three-quarter view, collar up, hands in the pockets, a cigarette;
# lit from above-left by the street lamp (rim light on the hat, shoulder and coat edge).
FIGURE = [
    '........aab........',
    '.......aaabbb......',
    '......aaaBbbbb.....',
    '......aabbbbbb.....',
    '......kkkkkkkk.....',
    '...aaaaaabbbbbbbb..',
    '....BBBBBBBBBBBBBB.',
    '.......ffffff......',
    '.......fffFFe......',
    '......LlcccccD.....',
    '.....LLlccccccD....',
    '....LLlcccccccrD...',
    '...LLlccccccccccr..',
    '...Llcccccccccccr..',
    '...LlcccDccccccccr.',
    '...LlcccDccccccccr.',
    '...LlccccDcccccccr.',
    '...LlccccDcccccccr.',
    '...Llcccccccccccr..',
    '...LlcccccccccccrD.',
    '...LKKKKKKKKKKKKKr.',
    '...LlccccccKccccr..',
    '...LlcccccDccccccr.',
    '...LlccccccDcccccr.',
    '..LLlcccccccccccccr',
    '..LlcccDcccccccccr.',
    '..LlcccDccccDccccr.',
    '..LlccccccccDccccr.',
    '.LLlcccccccccDcccr.',
    '.LlccccD...ccDcccr.',
    '.LlcccD.....cccccr.',
    'LLlccc......ccccr..',
    'Llccc........cccr..',
    '....pPp......ppd...',
    '....pPp......ppd...',
    '....pPp......ppd...',
    '....pPp......ppd...',
    '....pPp......ppd...',
    '....pPp......ppd...',
    '....pPp......ppd...',
    '....pPp......ppd...',
    '....pPp......ppd...',
    '...sssS.....ssss...',
    '..SSssss....sssss..',
]
FIG_LEGEND = {
    'a': ('slate', .68), 'b': ('slate', .24), 'B': ('black', .4), 'k': ('black', .2),
    'f': ('skin', .08), 'F': ('skin', .5), 'e': ('e_neon', 1.0),
    'L': ('trench', .72), 'l': ('trench', .3), 'c': ('trench', .07), 'D': ('black', .3), 'K': ('black', .25),
    'r': ('neonred', .45), 'p': ('slate', .08), 'P': ('slate', .3), 'd': ('neonred', .3),
    's': ('black', .15), 'S': ('slate', .5),
}


def draw_figure(c, fx, fy, lampx=None, lampy=None):
    """fx, fy: the point between the feet on the ground. Pixels are emissive so the figure
    keeps its designed values (a dark silhouette with lamplit rims) under the scene lights."""
    h = len(FIGURE)
    w = len(FIGURE[0])
    x0, y0 = fx - w // 2, fy - h + 1
    # long shadow on the wet pavement, away from the lamp (down-right, toward us)
    shadow = [(fx - 4, fy - 1), (fx + 4, fy - 1), (fx + 30, fy + 16), (fx + 16, fy + 17)]
    c.shadow_poly(shadow, .5)
    # the figure's reflection: a dark, rippled, inverted silhouette in the lit wet pavement
    for j, row in enumerate(FIGURE):
        ry = fy + 1 + (h - 1 - j) // 2
        if ry >= H or j < 14:
            continue
        off = (j // 2) % 2
        for i, ch in enumerate(row):
            if ch != '.':
                c.put(x0 + i + off, ry, 'e_asphalt', .1, emis=1.0)
    for j, row in enumerate(FIGURE):
        for i, ch in enumerate(row):
            if ch == '.':
                continue
            ramp_, lum_ = FIG_LEGEND[ch]
            c.put(x0 + i, y0 + j, ramp_, lum_, emis=1.0)
    # cigarette smoke curling up into the lamplight
    ex, ey = x0 + 12, y0 + 8
    for k, (dx, dy) in enumerate(((1, -1), (1, -2), (2, -3), (1, -4), (2, -6), (3, -7), (2, -9), (3, -11), (4, -12))):
        if k % 3 != 2:
            c.put(ex + dx, ey + dy - 1, 'fog', .66 - k * .035, emis=.5)
    c.glow(ex, ey, 3, '#ff8030', .5)


# =========================================================================================
#                                           LOGO
# =========================================================================================
# Art-deco capitals, 30 px tall: thick verticals (5 px), thin cross strokes (2-3 px).
LH = 30


def _glyph_mask(ch, wid):
    m = np.zeros((LH, wid), bool)
    T = 5    # thick stroke
    t = 3    # thin stroke
    yy_, xx_ = np.mgrid[0:LH, 0:wid].astype(np.float32) + .5

    def R(x0, y0, x1, y1):
        m[max(0, y0):max(0, y1), max(0, x0):max(0, x1)] = True

    def D(x0, y0, x1, y1, w_):
        dx, dy = x1 - x0, y1 - y0
        L2 = dx * dx + dy * dy
        tt = np.clip(((xx_ - x0) * dx + (yy_ - y0) * dy) / L2, 0, 1)
        px_, py_ = x0 + tt * dx, y0 + tt * dy
        m[((xx_ - px_) ** 2 + (yy_ - py_) ** 2) <= (w_ / 2) ** 2] = True

    def round_corner(cx_, cy_, r_out, r_in, quad_):
        d = np.sqrt((xx_ - cx_) ** 2 + (yy_ - cy_) ** 2)
        qx = (xx_ - cx_) * quad_[0] >= 0
        qy = (yy_ - cy_) * quad_[1] >= 0
        m[(d <= r_out) & (d >= r_in) & qx & qy] = True

    if ch == 'N':
        R(0, 0, T, LH)
        R(wid - t, 0, wid, LH)
        D(2.5, 1.5, wid - 2.0, LH - 1.5, 5.0)
    elif ch == 'I':
        R(0, 0, T, LH)
    elif ch == 'G':
        R(0, 6, T, LH - 6)
        R(6, 0, wid - 3, t)
        R(6, LH - t, wid - 6, LH)
        round_corner(6, 6, 6.2, 6.2 - T, (-1, -1))
        round_corner(6, LH - 6, 6.2, 6.2 - T, (-1, 1))
        R(wid - T, LH // 2, wid, LH - 6)
        round_corner(wid - 6, LH - 6, 6.2, 6.2 - T, (1, 1))
        R(wid // 2, LH // 2, wid, LH // 2 + t)
        R(wid - t, 2, wid, 9)
        round_corner(wid - 4, 4, 4.2, 4.2 - t, (1, -1))
    elif ch == 'H':
        R(0, 0, T, LH)
        R(wid - T, 0, wid, LH)
        R(T, LH // 2 - 1, wid - T, LH // 2 + 2)
    elif ch == 'T':
        R(0, 0, wid, t + 1)
        R(wid // 2 - 2, 0, wid // 2 + 3, LH)
    elif ch == 'L':
        R(0, 0, T, LH)
        R(0, LH - t - 1, wid, LH)
    elif ch == 'A':
        # tall pointed deco A, solid; a keyhole is cut through it (see _keyhole)
        cxm = wid / 2
        inside = (np.abs(xx_ - cxm) <= ((yy_ + 1.5) / (LH + 1.5)) * (wid / 2)) & (yy_ > 0)
        m[inside] = True
        R(int(cxm) - 1, 0, int(cxm) + 1, 2)
        notch = (np.abs(xx_ - cxm) <= (yy_ - (LH - 7)) * .9) & (yy_ > LH - 7)   # notch between the legs
        m[notch] = False
    elif ch == 'C':
        R(0, 6, T, LH - 6)
        R(6, 0, wid - 3, t)
        R(6, LH - t, wid - 3, LH)
        round_corner(6, 6, 6.2, 6.2 - T, (-1, -1))
        round_corner(6, LH - 6, 6.2, 6.2 - T, (-1, 1))
        R(wid - t, 2, wid, 9)
        R(wid - t, LH - 9, wid, LH - 2)
        round_corner(wid - 4, 4, 4.2, 4.2 - t, (1, -1))
        round_corner(wid - 4, LH - 4, 4.2, 4.2 - t, (1, 1))
    return m


KEYHOLE = ['..ddd..',
           '.ddLLL.',
           'dLLLLLL',
           'dLLLLLL',
           'dLLLLLL',
           '.dLLLL.',
           '..dLL..',
           '..dLL..',
           '.dLLLL.',
           '.dLLLL.',
           'dLLLLLL',
           'dLLLLLL']


def _keyhole(m, wid):
    """Cut a classic keyhole (hand-drawn stamp) through the solid A."""
    hole = np.zeros_like(m)
    x0 = int(round(wid / 2 - 3.5))
    y0 = 9
    for j, row in enumerate(KEYHOLE):
        for i, ch in enumerate(row):
            if ch != '.':
                hole[y0 + j, x0 + i] = True
    m = m.copy()
    m[hole] = False
    return m, hole


def build_logo():
    word1 = [('N', 17), ('I', 5), ('G', 17), ('H', 17), ('T', 16)]
    word2 = [('L', 14), ('A', 22), ('T', 16), ('C', 16), ('H', 17)]
    gap, space = 4, 12
    pad = 9
    ext = 3                                   # extrusion depth (px, toward bottom-right)
    width = sum(w for _, w in word1) + gap * (len(word1) - 1) + space + sum(w for _, w in word2) + gap * (len(word2) - 1)
    Wl = width + pad * 2 + ext
    Hl = LH + pad * 2 + 9 + ext
    glyphs = np.zeros((Hl, Wl), bool)
    hole_mask = np.zeros((Hl, Wl), bool)
    x = pad
    top = pad
    for word in (word1, word2):
        for k, (ch, wid) in enumerate(word):
            gm = _glyph_mask(ch, wid)
            if ch == 'A':
                gm, hole = _keyhole(gm, wid)
                hole_mask[top:top + LH, x:x + wid] |= hole
            glyphs[top:top + LH, x:x + wid] |= gm
            x += wid + gap
        x += space - gap
    # deco rule under the words, with a centre lozenge and end ticks
    ry = top + LH + ext + 4
    rule = np.zeros_like(glyphs)
    cxl = (pad + Wl - pad - ext) // 2
    rule[ry, pad + 2:Wl - pad - ext - 2] = True
    rule[ry - 1, pad + 2:pad + 5] = True
    rule[ry + 1, pad + 2:pad + 5] = True
    rule[ry - 1, Wl - pad - ext - 5:Wl - pad - ext - 2] = True
    rule[ry + 1, Wl - pad - ext - 5:Wl - pad - ext - 2] = True
    for d in range(4):
        rule[ry - d, cxl - 4 + d:cxl + 5 - d] = True
        rule[ry + d, cxl - 4 + d:cxl + 5 - d] = True
    solid = glyphs | rule

    yy_, xx_ = np.mgrid[0:Hl, 0:Wl].astype(np.float32)
    out = np.zeros((Hl, Wl, 4), np.uint8)
    # ---- extrusion: the letters' depth, dark bronze, toward the bottom-right ---------------
    extr = np.zeros_like(solid)
    for k in range(1, ext + 1):
        extr |= shift(glyphs, k, k)
    extr &= ~glyphs
    ecol = [EC.hexrgb('#5a3a12'), EC.hexrgb('#3a240b'), EC.hexrgb('#24160a')]
    for k in range(ext, 0, -1):
        mk = shift(glyphs, k, k) & extr
        out[mk, :3] = ecol[min(k - 1, 2)]
        out[mk, 3] = 255
    # ---- face: brass banded like polished metal (sky / horizon / ground) -------------------
    ramp_ = RAMPS['brass']
    n = len(ramp_)
    rel = (yy_ - top) / LH
    band = np.select([rel < .08, rel < .44, rel < .5, rel < .53, rel < .85, rel >= .85],
                     [.98, .82 - (rel - .08) * .55, .3, .9, .5 + (rel - .53) * .3, .78], .6)
    up = shift(glyphs, 1, 0)
    left = shift(glyphs, 0, 1)
    down = shift(glyphs, -1, 0)
    right = shift(glyphs, 0, -1)
    tl = glyphs & (~up | ~left)
    br = glyphs & (~down | ~right)
    lum = band + .14 * tl - .3 * br
    # bevel around the keyhole: brass just below/right of the cut catches the light
    kh_ring = dilate4(hole_mask) & glyphs
    lum = np.where(kh_ring & (shift(hole_mask, 1, 0) | shift(hole_mask, 0, 1)), 1.0, lum)
    idx = np.clip(np.floor(np.clip(lum, 0, 1) * (n - 1) + .5), 0, n - 1).astype(int)
    out[glyphs, :3] = ramp_[idx[glyphs]]
    out[glyphs, 3] = 255
    # rule: thin polished brass
    rl = np.where(xx_ < cxl, .9, .7)
    ridx = np.clip(np.floor(rl * (n - 1) + .5), 0, n - 1).astype(int)
    out[rule, :3] = ramp_[ridx[rule]]
    out[rule, 3] = 255
    # glints: tiny four-point sparkles on a few top-left corners
    for (gx, gy) in ((pad + 1, top + 1), (pad + 17 + gap + 5 + gap + 2, top + 1)):
        out[gy, gx, :3] = EC.hexrgb('#fffbe8')
    # ---- outline round letters + extrusion + rule ------------------------------------------
    body = glyphs | extr | rule
    ol = dilate8(body) & ~body & ~hole_mask
    out[ol, :3] = EC.hexrgb('#100804')
    out[ol, 3] = 255
    # the keyhole glows: warm light from the room behind the door
    hm = hole_mask & ~ol
    ky0 = np.nonzero(hole_mask)[0].min()
    ky1 = np.nonzero(hole_mask)[0].max()
    # the inner wall of the cut, in shadow, shows along the hole's upper-left edge (stamp 'd')
    wall = np.zeros_like(hm)
    kys, kxs = np.nonzero(hole_mask)
    kx0, ky0_ = kxs.min(), kys.min()
    for j, row in enumerate(KEYHOLE):
        for i, ch in enumerate(row):
            if ch == 'd':
                wall[ky0_ + j, kx0 + i] = True
    for y, xk in zip(*np.nonzero(hm)):
        t_ = np.clip((y - ky0) / max(1, ky1 - ky0), 0, 1)
        col = EC.hexrgb('#fff0b8') * (1 - t_) + EC.hexrgb('#ffae48') * t_
        if wall[y, xk]:
            col = EC.hexrgb('#6a3410')
        out[y, xk, :3] = col.astype(np.uint8)
        out[y, xk, 3] = 255
    # ---- soft glow (dithered alpha) ----------------------------------------------------------
    bay = EC.bayer4(Hl, Wl)
    dist = np.full((Hl, Wl), 99.0, np.float32)
    cur = body | ol
    dist[cur] = 0
    for k in range(1, 8):
        nxt = dilate8(cur) if k % 2 else dilate4(cur)
        dist[nxt & ~cur] = k
        cur = nxt
    g = np.clip(1 - dist / 8, 0, 1) ** 1.7 * .55
    g[body | ol | hole_mask] = 0
    q = np.clip(np.floor(g * 4 + (bay - .5) * .9 + .5) / 4.0, 0, 1)
    gm = q > 0
    out[gm, :3] = EC.hexrgb('#c87628')
    out[gm, 3] = (q[gm] * 150).astype(np.uint8)
    # a cone of light spilling down out of the keyhole
    kx = int(round(np.mean(np.nonzero(hole_mask)[1])))
    for k in range(1, 8):
        y = ky1 + 1 + k + ext
        for dx in range(-(k // 2) - 1, k // 2 + 2):
            if 0 <= y < Hl and 0 <= kx + dx < Wl and out[y, kx + dx, 3] < 200:
                a_ = int(150 - k * 17)
                if a_ > out[y, kx + dx, 3]:
                    out[y, kx + dx, :3] = EC.hexrgb('#f0a040')
                    out[y, kx + dx, 3] = a_
    ys, xs = np.nonzero(out[..., 3] > 0)
    out = out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    save_png(out, out_path('ui', 'title_logo.png'))
    return out
