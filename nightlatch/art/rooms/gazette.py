"""Brackwater Gazette newsroom (Ch2-3, Ch7). 400 wide. Base = rainy day, variant 'night'."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import Light, vgrad, hgrad, radial, noise2
from persp import Persp, plank_floor
import furniture as F
import props_c as C

W, H = 400, 144
FLOOR = 88
_V = {}


def P(p, X, Y, Z):
    x, y = p.P(X, Y, Z)
    return int(round(x)), int(round(y))


# ----------------------------------------------------------------------------- props ----
def regulator_case(c, x, y):
    c.rect(x - 7, y + 3, x + 8, y + 36, 'oak', C.grain_v(.42, .03, 1.3))
    c.vline(x - 7, y + 3, y + 36, 'oak', .6)
    c.poly([(x - 8, y + 3), (x + 9, y + 3), (x + 5, y - 1), (x - 4, y - 1)], 'oak', .55)
    c.hline(x - 4, x + 6, y - 1, 'oak', .8)
    c.rect(x - 8, y + 2, x + 9, y + 4, 'oak', .6)
    c.hline(x - 8, x + 9, y + 2, 'oak', .85)
    c.rect(x - 6, y + 36, x + 7, y + 38, 'oak', .5)
    c.poly([(x - 3, y + 38), (x + 4, y + 38), (x + .5, y + 41)], 'oak', .45)


def clock_face(c, x, y, hh, mm):
    C.round_clock(c, x + .5, y + 10, r=5.5, hh=hh, mm=mm, face='paper', rim='brass')


def clock_pend(c, x, y, ang):
    """Pendulum window of the regulator (redrawn by the anim)."""
    c.rect(x - 4, y + 18, x + 5, y + 34, 'black', .45)
    c.vline(x - 4, y + 18, y + 34, 'oak', .3)
    a = math.radians(ang)
    px = x + .5 + math.sin(a) * 11
    for t in range(0, 11):
        c.put(int(round(x + .5 + math.sin(a) * t)), y + 19 + t, 'brass', .55)
    c.ellipse(px, y + 31, 2.2, 2.2, 'brass', .72)
    c.put(int(px - 1), y + 30, 'brass', .98)
    c.line(x - 3, y + 33, x + 3, y + 21, 'glass', .55, emis=.2)


def card_cabinet(c, p, X0, X1, Z0, Z1, Hh, cols=3, rows=9):
    p.box(c, X0, X1, 0, Hh, Z0, Z1, 'oak', front=.46, top=.62, side=.3, lum_fn=C.grain_v(.46, .02, 1.1))
    p.box(c, X0 - 1, X1 + 1, Hh, Hh + 2, Z0, Z1 + 1, 'oak', front=.58, top=.7, side=.38)
    fx0, fy0, fx1, fy1 = [int(round(v)) for v in p.front_rect(X0, X1, 0, Hh, Z1)]
    dw = (fx1 - fx0 - 2) / cols
    dh = (fy1 - fy0 - 6) / rows
    for j in range(rows):
        for i in range(cols):
            a = int(round(fx0 + 1 + i * dw))
            b = int(round(fx0 + 1 + (i + 1) * dw)) - 1
            u = int(round(fy0 + 2 + j * dh))
            v = int(round(fy0 + 2 + (j + 1) * dh)) - 1
            c.rect(a, u, b, v, 'oak', .5 + ((i * 7 + j * 3) % 5) * .012)
            c.hline(a, b, u, 'oak', .66)
            c.vline(b, u, v + 1, 'oak', .25)
            mx = (a + b) // 2
            c.put(mx - 1, u + 1, 'paper', .75)
            c.put(mx, u + 1, 'paper', .7)
            c.put(mx, u + 2, 'brass', .7)
    c.rect(fx0, fy1 - 4, fx1, fy1, 'oak', .3)
    # one drawer pulled out, cards standing up
    a = int(round(fx0 + 1 + 1 * dw))
    b = int(round(fx0 + 1 + 2 * dw)) - 1
    u = int(round(fy0 + 2 + 4 * dh))
    c.rect(a - 1, u - 1, b + 1, u + 4, 'oak', .64)
    c.hline(a - 1, b + 1, u - 1, 'oak', .82)
    for k in range(a, b + 1, 2):
        c.vline(k, u - 3, u - 1, 'paper', .82)
    return fx0, fy0, fx1, fy1


def news_bundle(c, x, y, w=12, h=6):
    c.rect(x, y - h, x + w, y, 'paper', vgrad(y - h, y, .72, .55))
    for k in range(y - h + 1, y, 2):
        c.hline(x, x + w, k, 'paper', .5)
    c.rect(x - 1, y - h - 2, x + w + 1, y - h, 'paper', .8)
    c.hline(x, x + w - 4, y - h - 1, 'black', .3)
    c.vline(x + w // 2, y - h - 2, y, 'c_tan', .55)
    c.hline(x - 1, x + w + 1, y - h // 2, 'c_tan', .5)


# ----------------------------------------------------------------------------- build ----
def build():
    sc = C.SceneC('gazette', W, H, seed=23)
    c = sc.c
    p = Persp(36, 364, 0, FLOOR, horizon=-62, depth=420)
    zf = p.z_at_floor_y(H + 2)
    WALL = 'c_plaster'
    lay = C.Layer(c)
    alt = lay.alt('night')

    # ---- editor's office interior (seen through the glass partition, X 94..170) -------------
    OX0, OX1, OZ = 94, 170, -44
    ob = P(p, OX0, 0, OZ)
    ob2 = P(p, OX1, 0, OZ)
    c.rect(OX0, 0, OX1, FLOOR, 'c_tan', .36)
    c.rect(ob[0], 0, ob2[0], ob[1], 'c_tan', vgrad(0, ob[1], .42, .36))
    c.rect(ob[0], ob[1] - 15, ob2[0], ob[1], 'wood', C.grain_h(.36, .03, 1.3))
    c.hline(ob[0], ob2[0], ob[1] - 15, 'wood', .58)
    c.poly(p.quad([(OX0, 0, 0), (OX0, 0, OZ), (OX0, 140, OZ), (OX0, 140, 0)]), 'c_tan', .28)
    c.poly(p.quad([(OX0, 0, 0), (OX0, 0, OZ), (OX0, 15, OZ), (OX0, 15, 0)]), 'wood', .26)
    # office window with blinds
    wx0, wx1, wy0, wy1 = ob[0] + 5, ob[0] + 29, 30, 56
    with lay.base():
        c.rect(wx0, wy0, wx1, wy1, 'c_sky', .74, emis=.8, dith=.2)
        for yy in range(wy0 + 1, wy1, 2):
            c.hline(wx0, wx1, yy, 'cream', .58, emis=.55)
    alt.rect(wx0, wy0, wx1, wy1, 'night', .22, emis=.9, dith=.2)
    for yy in range(wy0 + 1, wy1, 2):
        alt.hline(wx0, wx1, yy, 'cream', .3, emis=.3)
    c.rect(wx0 - 1, wy0 - 2, wx1 + 1, wy0, 'wood', .4)
    c.rect(wx0 - 1, wy1, wx1 + 1, wy1 + 2, 'wood', .45)
    c.vline(wx0 - 1, wy0, wy1, 'wood', .35)
    c.vline(wx1, wy0, wy1, 'wood', .3)
    c.vline(wx1 - 3, wy0 + 1, wy1 + 5, 'paper', .5)
    # bookshelf with bound volumes
    bx0 = ob2[0] - 25
    c.rect(bx0, 25, bx0 + 22, ob[1], 'wood', .3)
    for sy in (33, 43, 53, 63):
        c.rect(bx0 + 1, sy - 8, bx0 + 21, sy, 'black', .3)
        x = bx0 + 1
        k = 0
        while x < bx0 + 20:
            bw = 1 + (k * 7 % 3 == 0)
            col = ('red', 'c_jade', 'oak', 'c_navy', 'brass')[(k * 3 + sy) % 5]
            c.rect(x, sy - 7 + (k % 3 == 1), x + bw, sy, col, .4 + (k % 2) * .1)
            x += bw + (k % 4 == 3)
            k += 1
        c.hline(bx0, bx0 + 22, sy, 'wood', .55)
    # framed front pages
    for fx, fy in ((ob[0] + 34, 28), (ob[0] + 34, 42)):
        c.rect(fx, fy, fx + 13, fy + 11, 'black', .3)
        c.rect(fx + 1, fy + 1, fx + 12, fy + 10, 'paper', .72)
        c.rect(fx + 2, fy + 2, fx + 11, fy + 4, 'black', .3)
        c.rect(fx + 2, fy + 5, fx + 6, fy + 9, 'slate', .45)
        for ly in range(fy + 5, fy + 10, 2):
            c.hline(fx + 7, fx + 11, ly, 'paper', .45)
    # editor's desk, banker's lamp (always on), phone, papers
    C.big_desk(c, p, 104, 150, -34, -18, Hd=22, ramp='wood', lum=.38, seed=4)
    elx, ely = P(p, 112, 22, -24)
    c.rect(elx - 1, ely - 6, elx + 1, ely, 'brass', .6)
    c.rect(elx - 3, ely - 1, elx + 3, ely + 1, 'brass', .45)
    c.poly([(elx - 5, ely - 6), (elx + 5, ely - 6), (elx + 4, ely - 9), (elx - 4, ely - 9)], 'c_jade', .72, emis=.45)
    c.hline(elx - 5, elx + 6, ely - 6, 'lamp', .85, emis=1)
    c.hline(elx - 4, elx + 5, ely - 9, 'c_jade', .9, emis=.5)
    tx, ty = P(p, 141, 22, -26)
    F.telephone(c, tx, ty)
    C.paper_stack(c, *P(p, 120, 22, -21), w=8, n=3, seed=2)
    nx, ny = P(p, 128, 22, -19)
    c.rect(nx - 4, ny - 2, nx + 5, ny, 'brass', .6)          # name plate
    C.coat_rack(c, ob[0] + 3, ob[1] + 2, h=36)
    c.ellipse(ob[0] + 1, ob[1] - 33, 4, 1.2, 'slate', .3)
    c.rect(ob[0] - 1, ob[1] - 36, ob[0] + 3, ob[1] - 33, 'slate', .35)
    c.rect(ob[0] + 4, ob[1] - 30, ob[0] + 8, ob[1] - 14, 'trench', vgrad(0, 1, .4, .4))   # raincoat

    # ---- main back wall ----------------------------------------------------------------------
    wall_fn = C.noisy(vgrad(0, FLOOR, .48, .58), W, H, 9, .03, seed=7)
    for (a, b) in ((36, OX0), (OX1, 364)):
        c.rect(a, 0, b, FLOOR, WALL, wall_fn)
    c.rect(OX0, 0, OX1, 26, WALL, wall_fn)
    # damp stains under the picture rail
    for sx in (60, 205, 300):
        c.modulate(sx - 6, 12, sx + 7, 30, lambda xx, yy, sx=sx: 1 - .1 * np.clip(1 - np.abs(xx - sx) / 7, 0, 1)
                   * np.clip(1 - (yy - 12) / 18, 0, 1))
    c.poly(p.quad([(36, 0, 0), (36, 0, zf), (36, 200, zf), (36, 200, 0)]), WALL, .4)
    c.poly(p.quad([(364, 0, 0), (364, 0, zf), (364, 200, zf), (364, 200, 0)]), WALL, .36)
    WH = 22
    for (a, b) in ((36, OX0), (OX1, 364)):
        c.rect(a, FLOOR - WH, b, FLOOR, 'wood', C.grain_h(.4, .03, 1.4))
    for X in range(36, 364, 14):
        if OX0 - 2 <= X <= OX1:
            continue
        c.vline(X, FLOOR - WH + 3, FLOOR - 3, 'wood', .26)
        c.vline(X + 1, FLOOR - WH + 3, FLOOR - 3, 'wood', .5)
    for (a, b) in ((36, OX0), (OX1, 364)):
        c.rect(a, FLOOR - WH - 2, b, FLOOR - WH, 'wood', .55)
        c.hline(a, b, FLOOR - WH - 2, 'wood', .78)
        c.rect(a, FLOOR - 3, b, FLOOR, 'wood', .25)
    for X in (36, 364):
        c.poly(p.quad([(X, 0, 0), (X, 0, zf), (X, WH, zf), (X, WH, 0)]), 'wood', .3)
        c.poly(p.quad([(X, WH, 0), (X, WH, zf), (X, WH + 2, zf), (X, WH + 2, 0)]), 'wood', .52)
    c.rect(36, 10, 364, 12, 'wood', .45)
    c.hline(36, 364, 10, 'wood', .7)
    c.rect(36, 0, 364, 3, WALL, .3)
    for ty_, lum in ((4, .6), (7, .5)):
        c.rect(36, ty_, 364, ty_ + 2, 'brass', lum)
        c.hline(36, 364, ty_, 'brass', lum + .3)
        for X in range(48, 364, 36):
            c.rect(X, ty_ - 1, X + 2, ty_ + 3, 'brass', .35)

    plank_floor(c, p, 36, 364, 0, zf, 'oak', base=.44, plank_w=11, seed=12, gap_lum=.2, var=.07)
    N = noise2(W, H, 6, 3, 2)

    def wear(xx, yy):
        return 1 + np.clip(1 - np.abs(yy - 126) / 14, 0, 1) * .12 * (N[np.clip(yy.astype(int), 0, H - 1),
                                                                        np.clip(xx.astype(int), 0, W - 1)] + .3)
    c.modulate(0, 112, W, H, wear)

    # ---- street door + EXIT sign ------------------------------------------------------------
    D0, D1 = 42, 62
    dtop = FLOOR - 44
    c.rect(D0 - 3, dtop - 3, D1 + 3, FLOOR, 'wood', .3)
    c.hline(D0 - 3, D1 + 3, dtop - 3, 'wood', .6)
    c.vline(D0 - 3, dtop - 3, FLOOR, 'wood', .5)
    c.rect(D0, dtop, D1, FLOOR, 'wood', C.grain_v(.42, .02, 1.2))
    c.rect(D0 + 3, dtop + 3, D1 - 3, dtop + 22, 'c_frost', vgrad(dtop + 3, dtop + 22, .62, .5), emis=.35)
    c.line(D0 + 4, dtop + 20, D1 - 4, dtop + 10, 'c_frost', .4, emis=.3)      # banister shadow
    c.line(D0 + 4, dtop + 21, D1 - 4, dtop + 11, 'c_frost', .44, emis=.3)
    C.pane_glint(c, D0 + 3, dtop + 3, D1 - 3, dtop + 22)
    c.rect(D0 + 3, dtop + 25, D1 - 3, FLOOR - 4, 'wood', .36)
    c.hline(D0 + 3, D1 - 3, dtop + 25, 'wood', .25)
    c.rect(D1 - 5, dtop + 23, D1 - 3, dtop + 27, 'brass', .65)
    c.put(D1 - 4, dtop + 24, 'brass', .95)
    c.hline(D0, D1, FLOOR - 1, 'lamp', .3, emis=.6)
    with lay.base():
        c.rect(D0 + 1, dtop - 12, D1 - 1, dtop - 5, 'black', .4)
        C.text(c, D0 + 3, dtop - 11, 'EXIT', 'red', .5)
    alt.rect(D0 + 1, dtop - 12, D1 - 1, dtop - 5, 'black', .4)
    C.text(alt, D0 + 3, dtop - 11, 'EXIT', 'neonred', .9, emis=1)
    c.hline(D0 + 1, D1 - 1, dtop - 5, 'black', .2)
    c.vline(52, dtop - 16, dtop - 12, 'black', .4)
    bx_, by_ = P(p, 40, 0, 26)
    news_bundle(c, bx_, by_, 12, 6)
    news_bundle(c, bx_ + 1, by_ - 6, 11, 5)

    # ---- clippings cabinet (the morgue) -------------------------------------------------------
    cab = card_cabinet(c, p, 68, 90, 0, 10, 44, cols=3, rows=9)
    c.rect(66, FLOOR - 59, 94, FLOOR - 51, 'black', .32)
    c.hline(66, 94, FLOOR - 59, 'black', .6)
    C.text(c, 68, FLOOR - 58, 'MORGUE', 'paper', .78)

    # ---- glass partition of the editor's office -------------------------------------------------
    PT, GL = 60, 24
    py_top, py_gl = FLOOR - PT, FLOOR - GL
    with sc.obj('partition', baseline=FLOOR):
        c.rect(OX0, py_gl, OX1, FLOOR, 'wood', C.grain_h(.42, .03, 1.5))
        for X in range(OX0 + 2, OX1 - 22, 12):
            c.rect(X + 1, py_gl + 3, X + 10, FLOOR - 4, 'wood', .37)
            c.hline(X + 1, X + 10, py_gl + 3, 'wood', .24)
            c.vline(X + 1, py_gl + 3, FLOOR - 4, 'wood', .28)
            c.hline(X + 1, X + 10, FLOOR - 5, 'wood', .55)
        c.rect(OX0, py_gl - 2, OX1, py_gl, 'wood', .6)
        c.hline(OX0, OX1, py_gl - 2, 'wood', .82)
        c.rect(OX0, FLOOR - 3, OX1, FLOOR, 'wood', .25)
        c.shade[py_top:py_gl - 2, OX0:OX1] *= .8
        c.rect(OX0 - 2, py_top - 3, OX1 + 2, py_top, 'wood', .5)
        c.hline(OX0 - 2, OX1 + 2, py_top - 3, 'wood', .78)
        DX0, DX1 = OX1 - 22, OX1 - 2
        mulls = (OX0, OX0 + 18, OX0 + 36, DX0 - 2, OX1 - 2)
        for i in range(len(mulls) - 1):
            a, b = mulls[i] + 2, mulls[i + 1]
            if a < DX0:
                C.pane_glint(c, a, py_top, b, py_gl - 2)
        for X in mulls:
            c.rect(X, py_top, X + 2, py_gl - 2, 'wood', .45)
            c.vline(X, py_top, py_gl - 2, 'wood', .64)
        # door
        c.rect(DX0, py_top + 6, DX1, FLOOR, 'wood', C.grain_v(.45, .02, 1.3))
        c.vline(DX0, py_top + 6, FLOOR, 'wood', .64)
        c.rect(DX0 + 2, py_top + 8, DX1 - 2, py_gl + 2, 'c_frost', vgrad(py_top + 8, py_gl, .62, .48), emis=.3)
        C.pane_glint(c, DX0 + 2, py_top + 8, DX1 - 2, py_gl + 2)
        c.hline(DX0 + 4, DX1 - 4, py_top + 15, 'gold', .7)
        c.hline(DX0 + 4, DX1 - 4, py_top + 17, 'gold', .5)
        c.rect(DX0 + 2, py_gl + 5, DX1 - 2, FLOOR - 4, 'wood', .38)
        c.hline(DX0 + 2, DX1 - 2, py_gl + 5, 'wood', .26)
        c.rect(DX1 - 4, py_gl + 1, DX1 - 2, py_gl + 5, 'brass', .7)
        c.put(DX1 - 3, py_gl + 2, 'brass', 1.0)
        # EDITOR plate over the door
        plx = (DX0 + DX1) // 2 - 13
        c.rect(plx, py_top - 2, plx + 27, py_top + 6, 'black', .3)
        c.rect(plx + 1, py_top - 1, plx + 26, py_top + 5, 'brass', .5)
        c.hline(plx + 1, plx + 26, py_top - 1, 'brass', .9)
        C.text(c, plx + 2, py_top, 'EDITOR', 'black', .12)
    # NO SMOKING sign (under a permanent haze)
    c.rect(100, 14, 146, 22, 'paper', .7)
    c.hline(100, 146, 14, 'paper', .86)
    c.hline(100, 146, 21, 'paper', .5)
    C.text(c, 102, 16, 'NO SMOKING', 'red', .58)

    # ---- pneumatic tube station (asymmetric: receiver bend + send box) ------------------------------
    TX = 184
    # receiver tube: comes down, bends right, drops into a wire basket
    c.rect(TX - 6, 3, TX - 3, 46, 'brass', hgrad(TX - 6, TX - 3, .82, .42))
    c.vline(TX - 6, 3, 46, 'brass', .95)
    c.ellipse(TX - 2, 47, 4, 3, 'brass', .6)
    c.rect(TX - 1, 45, TX + 3, 49, 'brass', .55)
    c.rect(TX + 3, 44, TX + 5, 50, 'black', .2)               # open mouth
    c.hline(TX - 1, TX + 3, 45, 'brass', .9)
    for jy in (16, 32):
        c.rect(TX - 7, jy, TX - 2, jy + 2, 'brass', .38)
    c.rect(TX + 1, 54, TX + 13, 60, 'steel', .28)
    for k in range(TX + 1, TX + 14, 2):
        c.vline(k, 54, 60, 'steel', .58)
    c.hline(TX + 1, TX + 13, 54, 'steel', .78)
    c.line(TX + 1, 54, TX - 1, 50, 'steel', .5)
    c.rect(TX + 3, 52, TX + 10, 55, 'brass', hgrad(TX + 3, TX + 10, .85, .45))      # canister
    c.rect(TX + 3, 52, TX + 4, 55, 'c_iron', .55)
    # send tube: second pipe into a brass box with a hinged door
    c.rect(TX + 1, 3, TX + 4, 62, 'brass', hgrad(TX + 1, TX + 4, .75, .38))
    c.vline(TX + 1, 3, 54, 'brass', .9)
    c.rect(TX - 4, 62, TX + 9, 74, 'brass', hgrad(TX - 4, TX + 9, .62, .34))
    c.hline(TX - 4, TX + 9, 62, 'brass', .9)
    c.rect(TX - 2, 64, TX + 6, 71, 'brass', .36)
    c.ellipse(TX + 2, 67.5, 2.2, 2.2, 'black', .25)
    c.put(TX + 1, 66, 'brass', .9)
    c.rect(TX + 7, 66, TX + 9, 69, 'black', .4)
    c.rect(TX - 6, 76, TX + 12, 81, 'paper', .7)              # dispatch slip pad
    c.hline(TX - 5, TX + 11, 77, 'black', .35)
    c.hline(TX - 5, TX + 6, 79, 'black', .35)
    c.ellipse(TX - 9, 52, 2, 2, 'brass', .7)                  # arrival bell
    c.put(TX - 10, 51, 'brass', .98)
    c.vline(TX - 9, 49, 50, 'black', .4)

    # ---- regulator clock --------------------------------------------------------------------------
    CX, CY = 210, 16
    regulator_case(c, CX, CY)
    with lay.base():
        clock_face(c, CX, CY, 10, 40)
    clock_face(alt, CX, CY, 9, 25)
    clock_pend(c, CX, CY, 0)

    # ---- windows + radiators ------------------------------------------------------------------------
    WINS = ((222, 248), (256, 282))
    with lay.base():
        for i, (a, b) in enumerate(WINS):
            C.city_day(c, a + 2, 18, b - 2, 60, seed=4 + i)
    for i, (a, b) in enumerate(WINS):
        C.city_night(alt, a + 2, 18, b - 2, 60, seed=4 + i)
    for i, (a, b) in enumerate(WINS):
        F.rain_on_glass(c, a + 2, 18, b - 2, 60, seed=40 + i, density=.025)
        C.tall_window(c, a, 16, b, 62)
        F.radiator(c, a + 2, 68, b - 2, FLOOR - 3, ramp='c_iron', lum=.5)
    C.paper_stack(c, 258, 61, w=8, n=3, seed=9)
    c.rect(229, 58, 233, 61, 'c_amberglass', .5)        # forgotten bottle on the sill
    c.put(230, 57, 'c_amberglass', .7)

    # ---- cork board ---------------------------------------------------------------------------------
    KB = (288, 26, 328, 58)
    kx0, ky0, kx1, ky1 = KB
    c.rect(kx0 - 2, ky0 - 2, kx1 + 2, ky1 + 2, 'oak', .5)
    c.hline(kx0 - 2, kx1 + 2, ky0 - 2, 'oak', .78)
    c.vline(kx0 - 2, ky0 - 2, ky1 + 2, 'oak', .66)
    c.rect(kx0, ky0, kx1, ky1, 'c_cork', C.noisy(.55, W, H, 1.5, .1, seed=31, octaves=1), dith=.8)
    items = [
        (290, 28, 10, 8, 'photo'), (302, 29, 9, 12, 'clip'), (313, 27, 11, 8, 'photo'),
        (291, 39, 8, 10, 'clip'), (300, 43, 12, 9, 'photo'), (314, 38, 9, 7, 'note'),
        (289, 50, 10, 6, 'map'), (318, 47, 9, 9, 'clip'),
    ]
    for (x, y, w, h, kind) in items:
        c.rect(x + 1, y + 1, x + w + 1, y + h + 1, 'c_cork', .28)
        if kind == 'photo':
            c.rect(x, y, x + w, y + h, 'paper', .84)
            c.rect(x + 1, y + 1, x + w - 1, y + h - 2, 'slate', vgrad(y, y + h, .58, .35))
            c.rect(x + 2, y + h - 5, x + w - 2, y + h - 2, 'slate', .25)
            c.put(x + w // 2, y + 3, 'slate', .78)
        elif kind == 'clip':
            c.rect(x, y, x + w, y + h, 'paper', .66)
            c.hline(x + 1, x + w - 1, y + 1, 'black', .25)
            for ly in range(y + 3, y + h - 1, 2):
                c.hline(x + 1, x + w - 1 - (ly % 3), ly, 'paper', .4)
        elif kind == 'map':
            c.rect(x, y, x + w, y + h, 'cream', .7)
            c.line(x + 1, y + h - 2, x + w - 2, y + 1, 'c_cobalt', .5)
            c.put(x + w - 3, y + 2, 'neonred', .7)
        else:
            c.rect(x, y, x + w, y + h, 'cream', .8)
            for ly in range(y + 2, y + h - 1, 2):
                c.hline(x + 1, x + w - 2, ly, 'c_cobalt', .45)
        c.put(x + w // 2, y, ('neonred', 'gold', 'neonblue')[(x + y) % 3], .72)
    c.line(295, 32, 305, 47, 'red', .58)
    c.line(305, 47, 318, 31, 'red', .58)
    CARD = (306, 50, 317, 57)
    c.rect(CARD[0], CARD[1], CARD[2], CARD[3], 'c_cork', .74, dith=.2)
    c.put((CARD[0] + CARD[2]) // 2, CARD[1], 'neonred', .75)

    # ---- darkroom door -------------------------------------------------------------------------------
    R0, R1 = 336, 356
    rtop = FLOOR - 44
    c.rect(R0 - 3, rtop - 3, R1 + 3, FLOOR, 'black', .35)
    c.hline(R0 - 3, R1 + 3, rtop - 3, 'black', .7)
    c.vline(R0 - 3, rtop - 3, FLOOR, 'black', .6)
    c.rect(R0, rtop, R1, FLOOR, 'slate', C.grain_v(.28, .015, 1.0))
    c.rect(R0 + 3, rtop + 22, R1 - 3, FLOOR - 4, 'slate', .22)
    c.hline(R0 + 3, R1 - 3, rtop + 22, 'slate', .14)
    c.rect(R0 + 2, rtop + 5, R1 - 2, rtop + 18, 'paper', .7)
    c.hline(R0 + 2, R1 - 2, rtop + 5, 'paper', .85)
    C.text(c, R0 + 3, rtop + 6, 'DARK', 'black', .2)
    C.text(c, R0 + 3, rtop + 12, 'ROOM', 'black', .2, sp=0)
    c.rect(R1 - 5, rtop + 24, R1 - 3, rtop + 28, 'brass', .6)
    c.put(R1 - 4, rtop + 25, 'brass', .95)
    c.hline(R0, R1, FLOOR - 1, 'black', .1)
    LAMP = ((R0 + R1) // 2, rtop - 9)
    lx_, ly_ = LAMP
    c.rect(lx_ - 6, ly_ - 3, lx_ + 7, ly_ + 4, 'black', .35)
    c.hline(lx_ - 6, lx_ + 7, ly_ - 3, 'black', .7)
    c.rect(lx_ - 5, ly_ - 2, lx_ + 6, ly_ + 3, 'red', .32)
    c.hline(lx_ - 4, lx_ + 5, ly_ - 1, 'red', .45)
    c.vline(lx_ + 8, 3, ly_ + 1, 'black', .4)                 # conduit
    c.hline(lx_ + 7, lx_ + 9, ly_, 'black', .4)

    # ---- right wall: framed headline, water cooler ---------------------------------------------------
    fr = p.quad([(364, 66, 12), (364, 66, 30), (364, 46, 30), (364, 46, 12)])
    c.poly(fr, 'black', .35)
    c.poly(p.quad([(364, 64, 14), (364, 64, 28), (364, 48, 28), (364, 48, 14)]), 'paper', .62)
    c.poly(p.quad([(364, 62, 15), (364, 62, 27), (364, 58, 27), (364, 58, 15)]), 'black', .3)
    c.poly(p.quad([(364, 56, 15), (364, 56, 20), (364, 50, 20), (364, 50, 15)]), 'slate', .45)
    wcx, wcy = P(p, 357, 0, 64)
    with sc.obj('cooler', baseline=wcy):
        k = p.s(64)
        c.rect(wcx - 6, wcy - 20, wcx + 6, wcy, 'cream', hgrad(wcx - 6, wcx + 6, .66, .4))
        c.vline(wcx - 6, wcy - 20, wcy, 'cream', .8)
        c.hline(wcx - 6, wcx + 6, wcy - 20, 'cream', .85)
        c.rect(wcx - 5, wcy - 2, wcx + 5, wcy, 'black', .3)
        c.rect(wcx - 3, wcy - 15, wcx + 1, wcy - 13, 'chrome', .7)
        c.ellipse(wcx, wcy - 28, 6, 8, 'glass', radial(wcx - 2, wcy - 31, 9, .8, .35), emis=.2)
        c.rect(wcx - 2, wcy - 22, wcx + 2, wcy - 20, 'glass', .5, emis=.1)
        c.line(wcx - 3, wcy - 33, wcx - 3, wcy - 25, 'glass', .95, emis=.3)
        c.hline(wcx - 5, wcx + 6, wcy - 25, 'glass', .32, emis=.1)
        c.rect(wcx - 10, wcy - 24, wcx - 7, wcy - 13, 'chrome', .55)    # cup dispenser
        c.vline(wcx - 10, wcy - 24, wcy - 13, 'chrome', .82)
    C.coffee_cup(c, *P(p, 348, 0, 70))                  # paper cup dropped
    C.crumple(c, *P(p, 352, 0, 76))

    # ---- desk islands --------------------------------------------------------------------------------
    islands = [(100, 160, 34, 56, 1), (198, 264, 34, 56, 2)]
    chairs = []
    for (X0, X1, Z0, Z1, sd) in islands:
        with sc.obj(f'desks{sd}', baseline=int(p.P(0, 0, Z1)[1]) + 1):
            C.big_desk(c, p, X0, X1, Z0, Z1, Hd=22, ramp='oak', lum=.44, seed=sd)
            t1 = P(p, X0 + 14, 22, Z1 - 4)
            t2 = P(p, X1 - 16, 22, Z1 - 4)
            C.typewriter(c, t1[0], t1[1], w=14)
            C.typewriter(c, t2[0], t2[1], w=14, paper=sd == 2)
            for X in (X0 + 16, X1 - 18):
                x_, y_ = P(p, X, 22, Z0 + 6)
                c.rect(x_ - 6, y_ - 4, x_ + 6, y_, 'black', .35)
                c.hline(x_ - 6, x_ + 6, y_ - 4, 'black', .6)
                c.rect(x_ - 3, y_ - 9, x_ + 3, y_ - 4, 'paper', .78)
            C.paper_stack(c, *P(p, (X0 + X1) // 2 - 6, 22, Z1 - 6), w=9, n=3, seed=sd)
            ax, ay = P(p, (X0 + X1) // 2 + 6, 22, Z1 - 3)
            C.ashtray(c, ax, ay, smoking=(sd == 1))
            C.coffee_cup(c, *P(p, X0 + 30, 22, Z0 + 10))
            sx, sy = P(p, X1 - 6, 22, Z0 + 8)
            c.vline(sx, sy - 7, sy, 'chrome', .7)
            for k in range(3):
                c.rect(sx - 2, sy - 2 - k * 2, sx + 3, sy - 1 - k * 2, 'paper', .75 - k * .05)
            c.rect(sx - 2, sy, sx + 3, sy + 1, 'black', .3)
            if sd == 2:   # in/out trays
                ix, iy = P(p, X0 + 40, 22, Z0 + 6)
                c.rect(ix - 5, iy - 3, ix + 5, iy, 'c_iron', .45)
                c.rect(ix - 4, iy - 4, ix + 4, iy - 3, 'paper', .78)
        for (X, turn) in ((X0 + 14, -1), (X1 - 16, 1)):
            x_, y_ = P(p, X, 0, Z1 + 9)
            chairs.append((x_, y_, p.s(Z1 + 9), turn))
    for i, (x_, y_, k, turn) in enumerate(chairs):
        with sc.obj(f'chair{i}', baseline=y_):
            C.office_chair(c, x_ + turn, y_, k=k, ramp='oak', lum=.44, turn=turn)
    # a jacket slung over the first chair
    jx, jy, jk, _ = chairs[0]
    c.poly([(jx - 8, jy - int(29 * jk)), (jx + 6, jy - int(29 * jk)), (jx + 5, jy - int(14 * jk)),
            (jx - 9, jy - int(12 * jk))], 'c_navy', vgrad(jy - 30, jy - 12, .5, .35))
    c.hline(jx - 8, jx + 6, jy - int(29 * jk), 'c_navy', .7)

    # ---- Pike's desk ----------------------------------------------------------------------------------
    PX0, PX1, PZ0, PZ1 = 286, 330, 34, 54
    with sc.obj('pike_desk', baseline=int(p.P(0, 0, PZ1)[1]) + 1):
        peds = C.big_desk(c, p, PX0, PX1, PZ0, PZ1, Hd=22, ramp='wood', lum=.46, seed=7)
        fx0, fy0, fx1, fy1 = peds['r']
        lkx, lky = (fx0 + fx1) // 2, fy0 + 4
        c.rect(lkx - 5, lky - 3, lkx + 6, lky + 3, 'black', .3)
        c.rect(lkx - 4, lky - 2, lkx + 5, lky + 2, 'brass', .6)
        c.hline(lkx - 4, lkx + 5, lky - 2, 'brass', .95)
        for k in range(3):
            c.vline(lkx - 3 + k * 3, lky - 1, lky + 2, 'black', .25)
            c.put(lkx - 3 + k * 3, lky, 'paper', .9)
        _V['drawer'] = (fx0, fy0, fx1, fy0 + 9)
        t = P(p, PX0 + 13, 22, PZ1 - 5)
        C.typewriter(c, t[0], t[1], w=14)
        for i, (X, Z, n) in enumerate(((PX0 + 27, PZ1 - 4, 5), (PX0 + 36, PZ0 + 6, 7), (PX0 + 4, PZ0 + 5, 4))):
            C.paper_stack(c, *P(p, X, 22, Z), w=9, n=n, seed=20 + i)
        ax, ay = P(p, PX1 - 5, 22, PZ1 - 3)
        C.ashtray(c, ax, ay, smoking=False)
        for dx in (-2, 0, 2):
            c.put(ax + dx, ay - 1, 'paper', .82)
        C.coffee_cup(c, *P(p, PX1 - 13, 22, PZ0 + 8))
        F.telephone(c, *P(p, PX1 - 6, 22, PZ0 + 7))
        # Pike's fedora on the front-left corner
        hx, hy = P(p, PX0 + 6, 22, PZ1 - 6)
        c.ellipse(hx, hy, 7.5, 2.2, 'c_tan', .3)
        c.hline(hx - 6, hx + 7, hy - 1, 'c_tan', .42)
        c.poly([(hx - 4, hy - 1), (hx - 4, hy - 5), (hx - 2, hy - 7), (hx + 3, hy - 7), (hx + 5, hy - 5), (hx + 5, hy - 1)],
               'c_tan', hgrad(hx - 4, hx + 5, .5, .3))
        c.hline(hx - 4, hx + 6, hy - 2, 'black', .25)
        c.hline(hx - 4, hx + 6, hy - 3, 'black', .35)
        c.vline(hx, hy - 7, hy - 4, 'c_tan', .22)          # crown pinch
        c.hline(hx - 2, hx + 3, hy - 7, 'c_tan', .64)
        c.hline(hx - 7, hx + 8, hy + 1, 'c_tan', .2)
    pcx, pcy = P(p, PX0 + 26, 0, PZ1 + 13)
    with sc.obj('pike_chair', baseline=pcy):
        C.office_chair(c, pcx, pcy, k=p.s(PZ1 + 13), ramp='oak', lum=.46, turn=2)
    wbx, wby = P(p, PX1 + 7, 0, PZ1 - 3)
    with sc.obj('basket', baseline=wby):
        C.wastebasket(c, wbx, wby)
    for (X, Z) in ((PX1 + 13, PZ1 + 2), (PX0 - 6, PZ1 + 16), (PX1 + 3, PZ1 + 18), (262, 72), (150, 94)):
        C.crumple(c, *P(p, X, 0, Z))
    sh = p.quad([(170, .2, 76), (184, .2, 74), (186, .2, 84), (172, .2, 86)])
    c.poly(sh, 'paper', .68)
    c.line(*P(p, 173, 0, 78), *P(p, 182, 0, 77), 'paper', .45)
    c.line(*P(p, 173, 0, 81), *P(p, 181, 0, 80), 'paper', .45)

    # ---- hanging green lamps ------------------------------------------------------------------------
    LAMPS = [(130, 66, 46, True), (231, 66, 46, False), (308, 66, 44, False)]
    lamp_px = []
    for (X, Y, Z, day_on) in LAMPS:
        x_, y_ = P(p, X, Y, Z)
        lamp_px.append((x_, y_, day_on))
        if day_on:
            C.pendant_lamp(c, x_, y_, w=15, on=True, shade='c_jade', lum=.5)
        else:
            with lay.base():
                C.pendant_lamp(c, x_, y_, w=15, on=False, shade='c_jade', lum=.45)
            C.pendant_lamp(alt, x_, y_, w=15, on=True, shade='c_jade', lum=.55)

    # ---- lighting -----------------------------------------------------------------------------------
    lay.finalize()
    for (X0, X1, Z0, Z1, sd) in islands:
        c.shadow_poly(p.quad([(X0 - 2, 0, Z0 - 2), (X1 + 2, 0, Z0 - 2), (X1 + 4, 0, Z1 + 4), (X0 - 2, 0, Z1 + 4)]), .4)
    c.shadow_poly(p.quad([(PX0 - 2, 0, PZ0 - 2), (PX1 + 2, 0, PZ0 - 2), (PX1 + 4, 0, PZ1 + 4), (PX0 - 2, 0, PZ1 + 4)]), .4)
    c.shadow_poly(p.quad([(66, 0, 0), (92, 0, 0), (93, 0, 12), (66, 0, 12)]), .4)
    for (x_, y_, k, t) in chairs + [(pcx, pcy, 1, 0)]:
        c.shadow_ellipse(x_, y_, 8, 2.5, .35)
    c.shadow_ellipse(wcx, wcy, 9, 3, .35)
    base_shade = c.shade.copy()
    topdark = np.clip(.74 + np.arange(H)[:, None] / 150.0, .74, 1).astype(np.float32)

    # day: grey window light, one lamp burning over the left island
    la = lamp_px[0]
    day_lights = [Light(235, 40, 160, .44, falloff=1.25), Light(269, 40, 160, .32, falloff=1.25),
                  Light(la[0], la[1] + 4, 64, .5, falloff=1.4, cone=(90, 62)),
                  Light(la[0], 82, 42, .4, falloff=1.3, ystretch=1.8),
                  Light(la[0], la[1] + 40, 40, .2, ystretch=2.2),
                  Light(elx, ely - 8, 40, .45)]
    c.lights = day_lights
    c.extra[:] = 0
    for (a, b) in WINS:
        for k, amt in enumerate((.05, .05, .05)):
            c.light_poly([(a + 1 + k * 3, 89), (b - 1 - k * 2, 89), (b + 26 - k * 3, 132 - k * 12), (a + 9 + k * 4, 132 - k * 12)], amt)
    day_extra = c.extra.copy()
    vday = np.clip(1.2 - np.abs(np.arange(W)[None, :] - 215) / 300.0, .68, 1).astype(np.float32)
    c.ambient = .44
    c.shade = base_shade * vday * topdark
    _V['day'] = dict(lights=day_lights, ambient=.44, extra=day_extra, shade=c.shade.copy(),
                     glows=[(235, 38, 40, (200, 215, 230), .22), (269, 38, 40, (200, 215, 230), .18),
                            (la[0], la[1] + 2, 20, (255, 200, 120), .4), (elx, ely - 7, 10, (255, 200, 120), .35)])
    c.glows = list(_V['day']['glows'])

    # night: every lamp on, windows dark
    n_lights = []
    for (x_, y_, _) in lamp_px:
        n_lights.append(Light(x_, y_ + 2, 84, 1.3, falloff=1.75, cone=(90, 56)))
        n_lights.append(Light(x_, 82, 46, .8, falloff=1.3, ystretch=1.8))          # pool on the desk tops
        n_lights.append(Light(x_, y_ + 60, 50, .3, ystretch=2.4))
    n_lights.append(Light(elx, ely - 8, 46, .7, falloff=1.4))
    n_lights.append(Light(52, 92, 24, .3, ystretch=2.5))
    n_lights.append(Light(CX, CY + 24, 30, .55))                                   # lamp spill on the clock
    n_lights.append(Light(52, dtop - 8, 16, .35))
    vn = np.clip(1.3 - np.abs(np.arange(W)[None, :] - 215) / 240.0, .5, 1)
    nshade = (base_shade * vn * (topdark ** 2) * .95).astype(np.float32)
    _V['night'] = dict(lights=n_lights, ambient=.2, extra=np.zeros_like(day_extra), shade=nshade,
                       glows=[(x_, y_ + 2, 24, (255, 190, 110), .5) for (x_, y_, _) in lamp_px] +
                             [(elx, ely - 7, 14, (255, 200, 120), .45), (52, dtop - 8, 14, (255, 60, 60), .45)])
    _V['lay'] = lay

    # ---- state objects --------------------------------------------------------------------------------
    with sc.obj('press_card', state=True, depth=FLOOR) as cc:
        x0, y0, x1, y1 = CARD
        cc.rect(x0 + 1, y0 + 1, x1 + 1, y1 + 1, 'c_cork', .25)
        cc.rect(x0, y0, x1, y1, 'paper', .84)
        cc.rect(x0, y0, x1, y0 + 2, 'c_cobalt', .6)
        C.text(cc, x0 + 1, y0 + 2, '417', 'black', .15, sp=0)
        cc.rect(x1 - 3, y0 + 3, x1 - 1, y1 - 1, 'slate', .55)
        cc.put((x0 + x1) // 2, y0, 'neonred', .8)
    with sc.obj('darkroom_lamp_on', state=True, depth=FLOOR) as cc:
        C.dither_fill(cc, lx_ - 13, ly_ - 9, lx_ + 14, ly_ + 14,
                      lambda xx, yy: np.clip(1 - np.hypot(xx - lx_ - .5, (yy - ly_) * 1.25) / 13.5, 0, 1) * .85,
                      'neonred', .4, emis=.55)
        cc.rect(lx_ - 6, ly_ - 3, lx_ + 7, ly_ + 4, 'black', .35)
        cc.rect(lx_ - 5, ly_ - 2, lx_ + 6, ly_ + 3, 'neonred', .82, emis=1)
        cc.rect(lx_ - 3, ly_ - 1, lx_ + 4, ly_ + 2, 'neonred', 1.0, emis=1)
        cc.hline(lx_ - 4, lx_ + 5, ly_ - 1, 'neonred', 1.0, emis=1)

    # ---- anims ---------------------------------------------------------------------------------------
    def pend(a):
        return lambda cc: clock_pend(cc, CX, CY, a)
    sc.anim('pendulum', [pend(a) for a in (0, 8, 13, 8, 0, -8, -13, -8)], fps=6)
    smx, smy = P(p, (100 + 160) // 2 + 6, 22, 56 - 3)
    smx += 5
    smy -= 2

    def smoke(k):
        def f(cc):
            for i in range(10):
                yy = smy - i
                xx = smx + int(round(math.sin((i + k * 1.7) * .65) * (.6 + i * .18)))
                if (i + k) % 5 != 4:
                    cc.put(xx, yy, 'c_steam', .62 - i * .035)
        return f
    sc.anim('smoke', [smoke(k) for k in range(6)], fps=5, depth=int(p.P(0, 0, 56)[1]) + 2)

    # ---- interaction ---------------------------------------------------------------------------------
    by = lambda Z: int(round(p.P(0, 0, Z)[1]))
    bx = lambda X, Z: int(round(p.P(X, 0, Z)[0]))
    sc.hotspot('exit_street', rect=(D0 - 3, dtop - 13, D1 + 3, FLOOR + 1), walk=(52, by(9)), face='up')
    sc.hotspot('editor_office', rect=(OX0, py_top - 3, OX1, FLOOR), walk=(bx((DX0 + DX1) // 2, 9), by(9)), face='up')
    sc.hotspot('pike_desk', poly=[P(p, PX0 - 1, 30, PZ0), P(p, PX1 + 1, 30, PZ0), P(p, PX1 + 1, 0, PZ1),
                                  P(p, PX0 - 1, 0, PZ1)], walk=(bx(300, PZ1 + 20), by(PZ1 + 20)), face='up')
    d = _V['drawer']
    sc.hotspot('pike_drawer', rect=(d[0] - 1, d[1] - 1, d[2] + 1, d[3] + 1), walk=(bx(320, PZ1 + 20), by(PZ1 + 20)),
               face='up')
    sc.hotspot('corkboard', rect=(kx0 - 2, ky0 - 2, kx1 + 2, ky1 + 2), walk=(bx(302, 17), by(17)), face='up')
    sc.hotspot('press_card', rect=(CARD[0] - 1, CARD[1] - 1, CARD[2] + 1, CARD[3] + 1), walk=(bx(311, 17), by(17)),
               face='up')
    sc.hotspot('clippings', rect=(cab[0] - 2, FLOOR - 59, cab[2] + 2, cab[3]), walk=(bx(79, 17), by(17)), face='up')
    sc.hotspot('darkroom_door', rect=(R0 - 3, ly_ - 4, R1 + 3, FLOOR + 1), walk=(bx(346, 9), by(9)), face='up')
    sc.hotspot('clock', rect=(CX - 9, CY - 2, CX + 10, CY + 42), walk=(bx(CX, 14), by(14)), face='up')
    t1 = P(p, 198, 30, 34)
    sc.hotspot('typewriters', rect=(t1[0], t1[1] - 4, bx(264, 56) + 1, int(p.P(0, 20, 56)[1]) + 1),
               walk=(bx(231, 76), by(76)), face='up')
    sc.hotspot('tubes', rect=(TX - 11, 30, TX + 14, 82), walk=(bx(TX, 14), by(14)), face='up')

    # floor polygon clipped to the screen: follows the side walls until they leave the screen
    def wall_hit(X):
        # depth where the wall X reaches the screen edge (x=0 or x=W)
        edge = 0 if X < 200 else W
        s_ = (edge - 200) / (X - 200)
        return p.D * (1 - 1 / s_)
    zl, zr = wall_hit(38), wall_hit(362)
    fl = [P(p, 38, 0, 3), P(p, 362, 0, 3), P(p, 362, 0, zr), (W, H), (0, H), P(p, 38, 0, zl)]
    holes = []
    for (X0, X1, Z0, Z1, sd) in islands:
        holes.append([P(p, X0 - 3, 0, Z0 - 2), P(p, X1 + 3, 0, Z0 - 2), P(p, X1 + 3, 0, Z1 + 12), P(p, X0 - 3, 0, Z1 + 12)])
    holes.append([P(p, PX0 - 3, 0, PZ0 - 2), P(p, PX1 + 3, 0, PZ0 - 2), P(p, PX1 + 3, 0, PZ1 + 16), P(p, PX0 - 3, 0, PZ1 + 16)])
    holes.append([P(p, 64, 0, 0), P(p, 93, 0, 0), P(p, 93, 0, 14), P(p, 64, 0, 14)])
    holes.append([P(p, 349, 0, 58), P(p, 364, 0, 58), P(p, 364, 0, 70), P(p, 349, 0, 70)])
    sc.walkable(fl, holes=holes)
    sc.point('start', 60, by(26), 'right')
    sc.point('from_map', 60, by(26), 'right')
    sc.point('from_darkroom', bx(346, 15), by(15), 'down')
    ax_, ay_ = P(p, 140, 0, -10)
    sc.point('abernathy_spot', ax_, ay_, 'down')
    sc.point('pike_desk_spot', bx(306, PZ1 + 20), by(PZ1 + 20), 'up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, round(p.char_scale(FLOOR, 140), 3), 140, 1.0)
    sc.meta['floor'] = 'wood'
    sc.rain(224, 18, 280, 60, kind='window')
    C.order_hotspots(sc, ['press_card', 'pike_drawer', 'clock', 'tubes', 'darkroom_door', 'corkboard', 'pike_desk'])
    C.check(sc, npc=('abernathy_spot',))
    return sc


def _apply(c, key):
    v = _V[key]
    c.lights = [Light(L.x, L.y, L.r, L.i, falloff=L.falloff, cone=L.cone, ystretch=L.ystretch) for L in v['lights']]
    c.ambient = v['ambient']
    c.extra = v['extra'].copy()
    c.shade = v['shade'].copy()
    c.glows = list(v['glows'])


def night(c):
    _apply(c, 'night')
    _V['lay'].apply(c, 'night')
    return None


VARIANTS = {'day': lambda c: None, 'night': night}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
