"""Chapter 4 - Room 8, Halcyon House: padded isolation cell. Cold, sterile light.

Rook wakes on the cot.  The steel door (wired-glass observation window, food hatch) is on
the back wall left; the cot is bolted to the floor on the right under the ventilation grate;
between them the padding has been torn away to bare concrete - where, in November 1949, a
man scratched his initials near the cot leg.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
from persp import Persp, wall_left, wall_right
import props_d as D

W, H = 320, 144
FLOOR = 104
BX0, BX1 = 72, 248

# door on the back wall (screen rect) + details
DOOR = (86, 58, 110, FLOOR)            # x0, y0, x1, y1 of the leaf
WIN = (91, 64, 105, 74)                # observation window (glass area)
HATCH = (91, 83, 105, 88)              # food hatch slot
VENT = (199, 30, 219, 42)              # ventilation grate (screen rect)
COT = dict(X0=184, X1=234, Z0=1, Z1=19, top=15)


def build():
    sc = Scene('halcyon_cell', W, H, seed=48)
    c = sc.c
    p = Persp(BX0, BX1, 0, FLOOR, horizon=-44, depth=300)
    zfront = p.z_at_floor_y(H + 2)
    zedge = 150                    # side walls continue past the screen edges
    N = noise2(W, H, 9, 31, 3)

    # ------------------------------------------------------------------ walls --------
    def back_uv(xx, yy):
        return xx - BX0, yy

    D.quilt_surface(c, [(BX0, 0), (BX1, 0), (BX1, FLOOR - 4), (BX0, FLOOR - 4)], back_uv, 'd_pad', base=.66,
                    amp=.22, cw=16, ch=12, seam=.3, hi=.8, btn=.2, btn_hi=.78, dith=.4)
    for X, sgn in ((BX0, 1), (BX1, -1)):
        f = D.side_uv(p, X)

        def uv(xx, yy, f=f, sgn=sgn):
            Z, Y, s = f(xx, yy)
            return Z * sgn, FLOOR - Y
        pts = p.quad([(X, 4, 0), (X, 4, zedge), (X, 260, zedge), (X, 260, 0)])
        D.quilt_surface(c, pts, uv, 'd_pad', base=.56, amp=.22, cw=16, ch=12, lu=-.25 * sgn, seam=.24, hi=.7,
                        btn=.16, btn_hi=.66, dith=.4)
    # concrete kick strip along the base of the walls
    c.rect(BX0, FLOOR - 4, BX1, FLOOR, 'concrete', vgrad(FLOOR - 4, FLOOR, .5, .36), dith=.3)
    c.hline(BX0, BX1, FLOOR - 4, 'concrete', .62)
    for X in (BX0, BX1):
        pts = p.quad([(X, 0, 0), (X, 0, zedge), (X, 4, zedge), (X, 4, 0)])
        c.poly(pts, 'concrete', .4, dith=.3)
        pts = p.quad([(X, 4, 0), (X, 4, zedge), (X, 4.6, zedge), (X, 4.6, 0)])
        c.poly(pts, 'concrete', .55, dith=0)
    # corners: the padding bulges, seam of shadow
    c.vline(BX0, 0, FLOOR, 'd_pad', .18)
    c.vline(BX1 - 1, 0, FLOOR, 'd_pad', .18)

    # ------------------------------------------------------------------ floor --------
    fuv = D.floor_uv(p)

    def floor_fn(xx, yy):
        X, Z, s = fuv(xx, yy)
        size = 22
        i = np.floor((X - BX0) / size)
        j = np.floor(Z / size)
        fx = (X - BX0) / size - i
        fz = Z / size - j
        rng = ((i * 7 + j * 13) % 5) * .012
        L = .5 + rng
        gw = .8 / s / size
        L = np.where((fx < gw) | (fz < gw * 1.4), .36, L)
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = L - (N[yi, xi] - .5) * .12
        return L
    fl_pts = p.quad([(BX0, 0, 0), (BX1, 0, 0), (BX1, 0, zedge), (BX0, 0, zedge)])
    c.poly(fl_pts, 'tile', floor_fn, dith=.45)
    # sheen: the lamp reflected in the polished linoleum
    c.light_poly([(150, FLOOR), (170, FLOOR), (176, 128), (144, 128)], .12)
    c.light_poly([(154, FLOOR), (166, FLOOR), (168, 116), (152, 116)], .1)
    # floor drain in the middle
    dx, dy = p.P(150, 0, 40)
    c.ellipse(dx, dy, 7, 2.4, 'steel', .3, dith=0)
    c.ellipse(dx, dy - .3, 6, 1.9, 'steel', .5, dith=0)
    for k in range(-4, 5, 2):
        c.vline(int(dx) + k, int(dy) - 1, int(dy) + 2, 'black', .2)
    c.hline(int(dx) - 5, int(dx) + 5, int(dy) - 2, 'steel', .7)
    D.stain(c, dx + 4, dy + 1, 16, 4, 'tile', .8, seed=4)
    D.stain(c, 120, 128, 12, 3, 'tile', .85, seed=6)
    # heel scuffs by the door
    for (x, y) in ((92, 110), (104, 113), (99, 117), (112, 108)):
        c.line(x, y, x + 3, y - 1, 'tile', .3)

    # ------------------------------------------------------- torn padding / concrete --
    # a narrow vertical tear beside the cot, widening near the floor
    torn = [(163, 47), (166, 45), (168, 48), (171, 46), (173, 50), (172, 57), (174, 63), (173, 70), (175, 76),
            (176, 82), (178, 88), (179, 94), (181, 100), (158, 100), (159, 94), (158, 88), (160, 82), (161, 75),
            (162, 68), (161, 61), (163, 55)]
    cxm = 169
    big = [(x + (2 if x > cxm else -2), y + (-2 if y < 52 else 0)) for x, y in torn]
    c.poly(big, 'cream', .34, dith=.2)                     # canvas backing at the ragged edge
    Nc = noise2(W, H, 2.5, 77, 2)

    def conc(xx, yy):
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        return .5 + (Nc[yi, xi] - .5) * .2 - np.clip((yy - 88) / 20, 0, 1) * .04
    c.poly(torn, 'concrete', conc, dith=.3)
    c.hline(164, 173, 69, 'concrete', .34)                 # form-work seam
    for (x, y) in ((167, 58), (165, 75), (172, 81), (163, 90), (176, 95)):
        c.put(x, y, 'concrete', .24)
        c.put(x + 1, y + 1, 'concrete', .68)
    rng = np.random.default_rng(5)
    for (x, y) in big:
        for k in range(3):
            c.put(x + int(rng.integers(-2, 3)), y + int(rng.integers(-2, 2)), 'paper', .66 + rng.random() * .16)
    # curled padding flaps
    c.poly([(157, 60), (161, 62), (160, 70), (155, 67)], 'd_pad', .76, dith=.2)
    c.line(157, 60, 155, 67, 'd_pad', .42)
    c.poly([(176, 72), (181, 75), (180, 82), (176, 78)], 'd_pad', .68, dith=.2)
    c.line(181, 75, 180, 82, 'd_pad', .38)
    # the spoon-polished patch (where something has been rubbed against the concrete)
    c.line(165, 64, 170, 63, 'concrete', .7)
    # years of grime: hand smears by the door, a tide-mark, a brown splash
    D.stain(c, 124, 66, 5, 7, 'd_pad', .8, seed=11)
    D.stain(c, 132, 92, 9, 4, 'd_pad', .82, seed=12)
    D.stain(c, 236, 70, 6, 9, 'd_pad', .84, seed=13)
    D.stain(c, 84, 40, 7, 5, 'd_pad', .86, seed=14)
    c.modulate(BX0, 86, BX1, FLOOR - 4, lambda xx, yy: 1 - np.clip((yy - 86) / 14, 0, 1) * .12)
    # scratches near the cot leg - tiny, faint, legible up close
    D.text(c, 162, 86, 'T.R.', 'concrete', .7, shadow=('concrete', .26))
    D.text(c, 160, 93, '11/49', 'concrete', .7, shadow=('concrete', .26))
    for (x, y) in ((176, 87), (177, 87), (178, 88)):
        c.put(x, y, 'concrete', .62)                        # a stray gouge
    # eight days counted off above the initials: 2-9 November 1949
    for k in range(4):
        c.vline(164 + k * 2, 78, 83, 'concrete', .3)
        c.vline(163 + k * 2, 78, 83, 'concrete', .66)
    c.line(162, 83, 170, 78, 'concrete', .66)
    for k in range(3):
        c.vline(173 + k * 2, 78, 83, 'concrete', .3)
        c.vline(172 + k * 2, 78, 83, 'concrete', .66)

    # ------------------------------------------------------------------ the door -----
    x0, y0, x1, y1 = DOOR
    c.rect(x0 - 3, y0 - 3, x1 + 3, y1, 'steel', .42, dith=.2)
    c.hline(x0 - 3, x1 + 3, y0 - 3, 'steel', .7)
    c.vline(x0 - 3, y0 - 3, y1, 'steel', .6)
    c.vline(x1 + 2, y0 - 3, y1, 'steel', .28)
    c.rect(x0 - 1, y0 - 1, x1 + 1, y1, 'black', .3)
    # number plate above the door
    c.rect(95, 50, 101, 56, 'cream', .72, dith=0)
    c.hline(95, 101, 56, 'steel', .3)
    D.text(c, 97, 51, '8', 'black', .2)
    door_fn = lambda xx, yy: .5 + np.sin(xx * .9) * .01 - (yy - y0) / (y1 - y0) * .08
    c.rect(x0, y0, x1, y1, 'd_green', door_fn, dith=.3)
    c.hline(x0, x1, y0, 'd_green', .75)
    c.vline(x0, y0, y1, 'd_green', .68)
    c.vline(x1 - 1, y0, y1, 'd_green', .32)
    # rivet rows
    for yy in (y0 + 2, y1 - 3):
        for xx in range(x0 + 2, x1 - 1, 4):
            D.rivet(c, xx, yy, 'd_green', .6)
    # heavy hinges (left)
    for hy_ in (y0 + 6, y1 - 12):
        c.rect(x0 - 2, hy_, x0 + 3, hy_ + 6, 'steel', .45, dith=0)
        c.vline(x0 - 2, hy_, hy_ + 6, 'steel', .7)
        c.hline(x0 - 2, x0 + 3, hy_ + 6, 'steel', .2)
    # lock plate (no handle on the inside)
    c.rect(x1 - 6, y0 + 20, x1 - 2, y0 + 30, 'steel', .55, dith=0)
    c.hline(x1 - 6, x1 - 2, y0 + 20, 'steel', .8)
    c.put(x1 - 4, y0 + 25, 'black', .0)
    c.put(x1 - 4, y0 + 26, 'black', .0)
    # observation window: steel frame + wired glass onto the corridor
    wx0, wy0, wx1, wy1 = WIN
    c.rect(wx0 - 2, wy0 - 2, wx1 + 2, wy1 + 2, 'steel', .35, dith=0)
    c.hline(wx0 - 2, wx1 + 2, wy0 - 2, 'steel', .65)
    c.hline(wx0 - 2, wx1 + 2, wy1 + 1, 'steel', .2)

    def corridor_view(a, b, cc, d):
        # opposite corridor wall: cream paint, green dado, the fire procedure notice
        c.rect(a, b, cc, d, 'cream', vgrad(b, d, .82, .7), emis=.85, dith=.2)
        c.rect(a, b + 7, cc, d, 'd_green', .6, emis=.85, dith=0)
        c.hline(a, cc, b + 7, 'd_green', .32, emis=.85)
        c.rect(a + 2, b + 1, a + 9, b + 6, 'paper', .95, emis=.9, dith=0)     # notice card
        c.hline(a + 2, a + 9, b + 1, 'neonred', .6, emis=.9)
        c.hline(a + 3, a + 8, b + 3, 'paper', .55, emis=.9)
        c.hline(a + 3, a + 7, b + 5, 'paper', .55, emis=.9)
        c.vline(cc - 3, b, d, 'chrome', .55, emis=.8)                         # a pipe
    D.wire_glass(c, wx0, wy0, wx1, wy1, wire='steel', wire_lum=.5, step=4, emis=.35, view=corridor_view)
    c.put(wx0, wy0, 'white', .95, emis=.7)
    c.put(wx0 + 1, wy0, 'white', .85, emis=.7)
    c.put(wx0, wy0 + 1, 'white', .85, emis=.7)
    # food hatch (closed): flap with a hinge line and a pull ring
    hx0, hy0, hx1, hy1 = HATCH
    c.rect(hx0 - 1, hy0 - 1, hx1 + 1, hy1 + 1, 'steel', .25, dith=0)
    c.rect(hx0, hy0, hx1, hy1, 'steel', vgrad(hy0, hy1, .58, .44), dith=0)
    c.hline(hx0, hx1, hy0, 'steel', .75)
    c.hline(hx0, hx1, hy1 - 1, 'steel', .3)
    c.put((hx0 + hx1) // 2, hy0 + 2, 'steel', .2)
    c.put((hx0 + hx1) // 2 - 1, hy0 + 2, 'steel', .85)
    # dents and scuffs at the bottom of the door (kicked)
    for (x, y) in ((93, 98), (101, 96), (97, 100), (104, 99)):
        c.put(x, y, 'd_green', .25)
        c.put(x + 1, y - 1, 'd_green', .7)
    c.hline(88, 108, FLOOR - 1, 'black', .2)
    # light leaking under the door
    c.hline(x0 + 1, x1 - 1, FLOOR - 1, 'd_cold', .7, emis=1)

    # call button by the door
    c.rect(114, 73, 121, 85, 'steel', .5, dith=0)
    c.hline(114, 121, 73, 'steel', .8)
    c.vline(120, 73, 85, 'steel', .28)
    c.hline(114, 121, 84, 'steel', .25)
    c.ellipse(117.5, 78.5, 2.2, 2.2, 'steel', .3, dith=0)
    c.ellipse(117.5, 78.3, 1.6, 1.6, 'neonred', .62, dith=0)
    c.put(117, 77, 'neonred', .9)
    D.screw(c, 115, 74, 'chrome', .55)
    D.screw(c, 118, 82, 'chrome', .55)

    # loudspeaker grille above the door (recessed box, round grille behind mesh)
    c.rect(89, 18, 107, 34, 'steel', .32, dith=0)
    c.hline(89, 107, 18, 'steel', .62)
    c.vline(106, 18, 34, 'steel', .2)
    c.hline(89, 107, 33, 'steel', .2)
    c.ellipse(98, 26, 6.5, 6.5, 'steel', .2, dith=0)
    for yy in range(21, 32):
        for xx in range(92, 105):
            if (xx - 98) ** 2 + (yy - 26) ** 2 <= 38 and (xx + yy) % 2 == 0:
                c.put(xx, yy, 'steel', .52)
    for (sx, sy) in ((90, 19), (105, 19), (90, 32), (105, 32)):
        c.put(sx, sy, 'chrome', .7)
    c.line(107, 26, 116, 26, 'black', .3)    # conduit along the wall
    c.line(116, 26, 116, 2, 'black', .3)
    c.line(117, 26, 117, 2, 'steel', .4)

    # caged lamp at the top of the back wall (cold, sterile)
    lx, ly = 160, 9
    c.rect(lx - 10, 0, lx + 10, 3, 'steel', .5, dith=0)           # wall plate
    c.hline(lx - 10, lx + 10, 2, 'steel', .22)
    c.rect(lx - 3, 3, lx + 3, 5, 'steel', .4, dith=0)             # bracket
    c.ellipse(lx, 10.5, 5.2, 5.2, 'd_cold', .9, emis=1, dith=0)    # frosted bulb
    c.ellipse(lx - 1, 9.5, 2.6, 2.6, 'd_cold', 1.0, emis=1, dith=0)
    for k in (-4, 0, 4):                                          # wire cage
        for t in range(5, 16):
            xx = lx + k * math.sin(math.pi * (t - 5) / 11) * 1.4
            c.put(int(round(xx)), t, 'steel', .32)
    c.hline(lx - 5, lx + 6, 10, 'steel', .4)
    c.hline(lx - 3, lx + 4, 15, 'steel', .4)
    c.put(lx, 16, 'steel', .5)

    # ventilation grate high on the back wall
    vx0, vy0, vx1, vy1 = VENT
    c.rect(vx0 - 2, vy0 - 2, vx1 + 2, vy1 + 2, 'steel', .4, dith=0)
    c.hline(vx0 - 2, vx1 + 2, vy0 - 2, 'steel', .72)
    c.vline(vx1 + 1, vy0 - 2, vy1 + 2, 'steel', .22)
    c.hline(vx0 - 2, vx1 + 2, vy1 + 1, 'steel', .22)
    c.rect(vx0, vy0, vx1, vy1, 'black', .15)
    for yy in range(vy0, vy1, 2):
        c.hline(vx0, vx1, yy, 'steel', .62)
        c.hline(vx0 + 1, vx1, yy + 1, 'steel', .22)
    for (sx, sy) in ((vx0 - 1, vy0 - 1), (vx1, vy0 - 1), (vx0 - 1, vy1), (vx1, vy1)):
        D.screw(c, sx, sy, 'chrome', .7)
    # grime streaks under the vent
    for k, L in ((0, 14), (5, 9), (12, 18), (17, 7)):
        c.modulate(vx0 + k, vy1 + 2, vx0 + k + 2, vy1 + 2 + L, lambda xx, yy, L=L, vy1=vy1: 0.86 + (yy - vy1) / (L + 4) * .12)

    # -------------------------------------------------------------- props on floor -----
    # enamel slop bucket with lid (back left corner)
    bx, by = p.P(80, 0, 26)
    bx, by = int(bx), int(by)
    c.shadow_ellipse(bx + 6, by, 9, 2.5, .5)
    c.poly([(bx, by - 10), (bx + 11, by - 10), (bx + 10, by), (bx + 1, by)], 'white',
           hgrad(bx, bx + 11, .72, .36), dith=.3)
    c.hline(bx + 1, bx + 10, by - 1, 'white', .3)
    c.ellipse(bx + 5.5, by - 10, 6, 1.8, 'white', .82, dith=0)       # lid
    c.ellipse(bx + 5.5, by - 10.3, 4.5, 1.1, 'white', .66, dith=0)
    c.rect(bx + 4, by - 13, bx + 7, by - 11, 'white', .5, dith=0)    # lid knob
    c.hline(bx, bx + 11, by - 8, 'denim', .45)                       # blue enamel rim band
    for t in range(0, 11):                                           # wire bail handle
        hx_ = bx - 1 + t * 1.3
        hy_ = by - 8 + int(round(-2.5 * math.sin(math.pi * t / 10)))
        c.put(int(hx_), hy_ - 3, 'steel', .55)
    c.put(bx + 3, by - 5, 'black', .2)        # chipped enamel
    c.put(bx + 4, by - 5, 'black', .3)
    # crushed paper cup by the drain
    ux, uy = p.P(120, 0, 52)
    c.poly([(ux, uy - 2), (ux + 3, uy - 3), (ux + 4, uy), (ux + 1, uy + 1)], 'paper', .78, dith=0)
    c.put(ux + 2, uy - 1, 'paper', .45)

    # ------------------------------------------------------------------- the cot ------
    X0, X1, Z0, Z1, top = COT['X0'], COT['X1'], COT['Z0'], COT['Z1'], COT['top']
    RAIL0, RAIL1 = 8, 11                 # frame rail heights
    MT = 15                              # mattress top
    # dark space under the cot (shadow on the wall and the floor)
    c.shadow_poly(p.quad([(X0 + 1, 0, 0), (X1 + 3, 0, 0), (X1 + 3, RAIL0, 0), (X0 + 1, RAIL0, 0)]), .45)
    c.shadow_poly(p.quad([(X0 - 1, 0, Z0), (X1 + 3, 0, Z0), (X1 + 3, 0, Z1 + 3), (X0 - 1, 0, Z1 + 3)]), .55)

    def leg(X, Z):
        fx, fy = p.P(X + 1, 0, Z + 1)
        c.rect(fx - 2, fy - 1, fx + 3, fy + 1, 'steel', .35, dith=0)      # bolted floor plate
        c.put(fx - 2, fy - 1, 'chrome', .75)
        c.put(fx + 2, fy - 1, 'chrome', .75)
        p.box(c, X, X + 2, 0, RAIL1, Z, Z + 2, 'd_green', front=.45, side=.3, top=.55)
    for X in (X0, X1 - 2):
        leg(X, Z0 + 1)
    # frame: end rails + front rail
    p.box(c, X0, X0 + 2, RAIL0, RAIL1 + 2, Z0, Z1, 'd_green', front=.5, top=.62, side=.4)
    p.box(c, X1 - 2, X1, RAIL0, RAIL1 + 2, Z0, Z1, 'd_green', front=.5, top=.62, side=.4)
    p.box(c, X0, X1, RAIL0, RAIL1, Z1 - 2, Z1, 'd_green', front=.52, top=.65, side=.4)
    # thin mattress, striped ticking
    def tick_top(xx, yy):
        X, Z, s = fuv(xx, yy)
        return .62 + np.where((np.floor(yy) % 3) == 0, -.12, 0)

    def tick_front(xx, yy):
        return .5 + np.where((np.floor(yy) % 2) == 0, -.08, .02)
    p.box(c, X0 + 1, X1 - 1, RAIL1, MT, Z0 + 1, Z1 - 1, 'd_cold', front=.5, top=.62, side=.36,
          lum_fn=tick_front, top_fn=lambda xx, yy: .64 + np.where((np.floor(yy) % 3) == 0, -.12, 0))
    ma, mb = p.P(X0 + 1, MT, Z1 - 1), p.P(X1 - 1, MT, Z1 - 1)
    c.hline(int(ma[0]), int(mb[0]), int(ma[1]), 'd_cold', .85)              # piped edge catching the light
    ma2 = p.P(X0 + 1, RAIL1, Z1 - 1)
    c.hline(int(ma[0]), int(mb[0]), int(ma2[1]), 'd_cold', .28)
    for X in range(X0 + 6, X1 - 4, 8):                                       # mattress tufts
        tx, ty = p.P(X, MT, (Z0 + Z1) / 2)
        c.put(int(tx), int(ty), 'd_cold', .35)
    # front legs
    for X in (X0, X1 - 2):
        leg(X, Z1 - 2)
    # pillow at the head end (right) - a thin, flat hospital pillow
    pa = p.P(X1 - 14, MT, Z1 - 4)
    pb = p.P(X1 - 2, MT, Z0 + 3)
    pcx, pcy = (pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 - 2
    c.ellipse(pcx, pcy, 7, 3.6, 'white', radial(pcx - 3, pcy - 2, 9, .92, .5), dith=.3)
    c.hline(int(pcx) - 4, int(pcx) + 3, int(pcy) - 3, 'white', .95)
    c.put(int(pcx) - 1, int(pcy), 'white', .45)                       # the dent of a head
    c.put(int(pcx), int(pcy), 'white', .4)
    c.put(int(pcx) + 1, int(pcy) + 1, 'white', .5)
    # grey wool blanket thrown back, spilling over the front rail (he has just woken up)
    Nb = noise2(W, H, 3, 21, 2)

    def wool(xx, yy):
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        return .68 + (Nb[yi, xi] - .5) * .35 + np.sin(xx * .8 + yy * .4) * .07
    tl = p.P(X0 + 2, MT + 1, Z0 + 3)
    tr = p.P(X0 + 27, MT + 1, Z0 + 4)
    fr = p.P(X0 + 30, MT, Z1)
    fl = p.P(X0 + 1, MT, Z1)
    c.poly([tl, (tl[0] + 9, tl[1] - 1), tr, (tr[0] + 2, tr[1] + 3), fr, fl], 'slate', wool, dith=.4)
    # hanging part over the front: draped folds with a scalloped hem
    hang_top = fl[1]
    for X in range(X0 + 1, X0 + 30):
        hx_, hy_ = p.P(X, MT, Z1)
        drop = 7 + int(2.2 * math.sin(X * .7)) + (2 if 8 < X - X0 < 20 else 0)
        for t in range(drop):
            L = .62 - t * .025 + .08 * math.sin(X * .9)
            c.put(int(hx_), int(hy_) + t, 'slate', L)
        c.put(int(hx_), int(hy_) + drop, 'slate', .22)
    c.hline(int(fl[0]), int(fr[0]), int(fl[1]), 'slate', .78)          # rolled edge catches the light
    c.line(int(tl[0]) + 3, int(tl[1]) + 2, int(tl[0]) + 12, int(fl[1]) - 1, 'slate', .32)   # a fold
    # restraint straps hanging over the front rail, brass buckles
    for X in (X0 + 34, X0 + 43):
        sx, sy = p.P(X, RAIL1, Z1)
        sx, sy = int(sx), int(sy)
        c.rect(sx, sy, sx + 2, sy + 8, 'trench', vgrad(sy, sy + 8, .5, .32), dith=0)
        c.vline(sx, sy, sy + 8, 'trench', .62)
        c.rect(sx - 1, sy + 4, sx + 3, sy + 6, 'brass', .55, dith=0)
        c.put(sx - 1, sy + 4, 'brass', .9)
        c.put(sx + 1, sy + 5, 'black', .2)


    # ------------------------------------------------------------------ lighting -------
    c.ambient = .5
    c.add_light(lx, ly + 2, 210, 1.0, falloff=1.25)          # caged lamp (cold)
    c.add_light(160, -30, 240, .35, falloff=1.0)             # general ceiling fill
    c.add_light(98, 69, 26, .25)                             # corridor light through the window
    c.add_light(98, FLOOR + 2, 26, .25, ystretch=3)          # under the door
    c.glow(lx, ly + 1, 40, '#d8fff0', .5)
    c.glow(lx, ly + 1, 14, '#f0fff8', .5)
    c.glow(98, 69, 10, '#fff2c8', .25)
    # ambient occlusion: wall/floor seam and room corners
    c.shade *= np.clip(.82 + np.abs(np.arange(H)[:, None] - FLOOR) / 30.0, .82, 1)
    for X in (BX0, BX1):
        xs = np.arange(W)[None, :]
        c.shade *= np.clip(.86 + np.abs(xs - X) / 40.0, .86, 1)
    c.shade *= np.clip(1.18 - np.abs(np.arange(W)[None, :] - 160) / 230.0, .66, 1)
    c.shade *= np.clip(1.1 - (np.arange(H)[:, None] - 100) / 140.0, .74, 1)
    yy_, xx_ = np.mgrid[0:H, 0:W].astype(np.float32)
    c.shade *= np.clip(1.25 - np.sqrt(((xx_ - 160) / 190) ** 2 + ((yy_ - 50) / 120) ** 2) * .55, .6, 1)

    # ------------------------------------------------------------ state objects -------
    with sc.obj('hatch_open', state=True, depth=FLOOR - 1) as cc:
        cc.rect(hx0, hy0, hx1, hy1, 'cream', vgrad(hy0, hy1, .85, .6), emis=1, dith=0)    # bright corridor
        cc.hline(hx0, hx1, hy0, 'd_cold', .9, emis=1)
        cc.rect(hx0 + 2, hy0 + 1, hx0 + 6, hy1, 'd_green', .5, emis=.8, dith=0)          # far wall dado
        # flap folded down into a ledge (perspective plate)
        pts = [(hx0 - 1, hy1), (hx1 + 1, hy1), (hx1 + 3, hy1 + 3), (hx0 - 3, hy1 + 3)]
        cc.poly(pts, 'steel', .62, dith=0)
        cc.hline(hx0 - 3, hx1 + 3, hy1 + 3, 'steel', .85)
        cc.hline(hx0 - 3, hx1 + 3, hy1 + 4, 'steel', .3)
        cc.line(hx0 - 3, hy1 + 4, hx0 - 1, hy1 + 7, 'chrome', .5)                       # chain stays
        cc.line(hx1 + 3, hy1 + 4, hx1 + 1, hy1 + 7, 'chrome', .5)
    with sc.obj('tray', state=True, depth=FLOOR) as cc:
        ty = hy1 + 1
        cc.poly([(hx0 - 2, ty + 1), (hx1 + 2, ty + 1), (hx1 + 3, ty + 3), (hx0 - 3, ty + 3)], 'steel', .7, dith=0)
        cc.hline(hx0 - 3, hx1 + 3, ty + 3, 'steel', .4)
        # tin cup (water), spoon, paper pill cup
        cc.rect(hx0 + 1, ty - 4, hx0 + 5, ty + 2, 'chrome', hgrad(hx0 + 1, hx0 + 5, .75, .45), dith=0)
        cc.hline(hx0 + 1, hx0 + 5, ty - 4, 'chrome', .95)
        cc.put(hx0 + 5, ty - 2, 'chrome', .6)
        cc.put(hx0 + 6, ty - 2, 'chrome', .5)
        cc.put(hx0 + 6, ty - 1, 'chrome', .5)
        cc.line(hx0 + 8, ty + 2, hx0 + 12, ty + 1, 'chrome', .85)
        cc.put(hx0 + 7, ty + 2, 'chrome', .7)
        cc.rect(hx1 - 4, ty - 2, hx1 - 1, ty + 2, 'paper', .85, dith=0)
        cc.put(hx1 - 3, ty - 2, 'white', .6)
        cc.put(hx1 - 2, ty - 2, 'neonred', .6)
    with sc.obj('grate_open', state=True, depth=FLOOR - 2) as cc:
        # dark duct behind, grate hanging by one screw
        cc.rect(vx0, vy0, vx1, vy1, 'black', .08)
        cc.rect(vx0 + 2, vy0 + 2, vx1 - 2, vy1 - 1, 'black', .02)
        cc.hline(vx0, vx1, vy0, 'steel', .3)
        cc.line(vx0 + 3, vy0 + 1, vx0 + 6, vy0 + 4, 'ink', .7)          # cobweb
        cc.line(vx0 + 1, vy0 + 4, vx0 + 6, vy0 + 4, 'ink', .6)
        pts = [(vx1 - 1, vy1), (vx1 + 2, vy1 + 1), (vx1 - 5, vy1 + 20), (vx1 - 9, vy1 + 18)]
        cc.poly(pts, 'steel', .5, dith=0)
        for k in range(2, 18, 3):
            ax, ay = vx1 + 1 - k * .38, vy1 + 1 + k
            cc.line(int(ax - 3), int(ay - 1), int(ax + 1), int(ay), 'steel', .2)
        cc.line(vx1 + 2, vy1 + 1, vx1 - 5, vy1 + 20, 'steel', .78)
        D.screw(cc, vx1, vy1, 'chrome', .7)
    with sc.obj('mattress_torn', state=True, depth=114) as cc:
        sx0, sy0 = p.P(X0 + 18, top + 1, Z1 - 1)
        sx1, sy1 = p.P(X0 + 32, top + 1, Z1 - 1)
        sx0, sy0, sx1 = int(sx0), int(sy0), int(sx1)
        cc.poly([(sx0, sy0 - 1), (sx1, sy0 - 2), (sx1 - 2, sy0 + 2), (sx0 + 2, sy0 + 2)], 'black', .15, dith=0)
        rng2 = np.random.default_rng(12)
        for k in range(26):
            x = sx0 + int(rng2.integers(0, sx1 - sx0))
            y = sy0 - 1 + int(rng2.integers(-3, 3))
            L = int(rng2.integers(2, 5))
            ang = rng2.random() * math.pi
            cc.line(x, y, x + int(math.cos(ang) * L), y - int(abs(math.sin(ang)) * L), 'gold', .5 + rng2.random() * .35)
        # straw on the floor below
        for k in range(16):
            fx_, fy_ = p.P(X0 + 14 + rng2.random() * 22, 0, Z1 + 1 + rng2.random() * 8)
            cc.line(int(fx_), int(fy_), int(fx_) + int(rng2.integers(-2, 3)), int(fy_) - int(rng2.integers(0, 2)), 'gold',
                    .45 + rng2.random() * .3)
    with sc.obj('smoke', state=True, depth=FLOOR + 40) as cc:
        rng3 = np.random.default_rng(3)
        cx_, cy_ = (vx0 + vx1) / 2, (vy0 + vy1) / 2
        # a thick plume rolling out of the vent, rising and spreading along the top of the walls
        puffs = []
        for k in range(9):                      # the column out of the grate
            t = k / 8
            puffs.append((cx_ + math.sin(k * 1.3) * 3 - t * 6, cy_ - t * 26, 5 + t * 6, 4 + t * 3))
        for k in range(10):                     # rolling left under the ceiling
            t = k / 9
            puffs.append((cx_ - 14 - t * 150, 8 + math.sin(k * 2.1) * 3 + t * 4, 9 + t * 8, 5 + t * 2))
        for k in range(6):                      # and right
            t = k / 5
            puffs.append((cx_ + 14 + t * 90, 7 + math.sin(k * 1.7) * 3 + t * 4, 9 + t * 7, 5 + t * 2))
        puffs = [(x + rng3.normal(0, 2), y + rng3.normal(0, 1.5), rx * (.75 + rng3.random() * .5),
                  ry * (.8 + rng3.random() * .4)) for (x, y, rx, ry) in puffs]
        for i, (px_, py_, rx, ry) in enumerate(puffs):
            fade = 1.0 if i < 9 else max(.35, 1 - (abs(px_ - cx_) / 190))
            # dithered halo, then a shaded core (lit from the lamp above)
            D.dfill_ellipse(cc, px_, py_, rx * 1.25, ry * 1.3, 'fog', .6, density=.55 * fade)
            if fade > .5:
                cc.ellipse(px_, py_, rx * .8, ry * .75, 'fog', radial(px_ - rx * .35, py_ - ry * .5, rx * 1.3, .95, .45),
                           dith=.6)
                for t in range(int(rx * 1.2)):                          # darker underside of each billow
                    xx2 = px_ - rx * .6 + t
                    yy2 = py_ + ry * .75 * math.sqrt(max(0, 1 - ((xx2 - px_) / (rx * .8)) ** 2)) - 1
                    cc.put(int(xx2), int(yy2), 'fog', .42)
            else:
                D.dfill_ellipse(cc, px_, py_, rx * .8, ry * .75, 'fog', .85, density=.8 * fade, soft=False)
        # wisps curling out of the slats
        for k in range(5):
            y = vy0 + 2 * k + 1
            cc.line(vx0 - 2, y, vx0 - 6 - k, y - 3, 'fog', .75)
            cc.line(vx1 + 1, y, vx1 + 5 + k, y - 4, 'fog', .7)
    with sc.obj('door_open', state=True, depth=FLOOR + 1) as cc:
        # the corridor beyond: green dado, cream wall, white tile floor, bright light
        cc.rect(x0, y0, x1, y1, 'cream', vgrad(y0, y1, .95, .7), emis=1, dith=.3)
        cc.rect(x0, y0 + 22, x1, y1 - 8, 'd_green', .62, emis=.9, dith=.2)
        cc.hline(x0, x1, y0 + 22, 'd_green', .35, emis=.9)
        cc.rect(x0, y1 - 8, x1, y1, 'tile', vgrad(y1 - 8, y1, .75, .9), emis=1, dith=.4)
        for xx in range(x0, x1, 4):
            cc.line(xx, y1 - 8, xx - 2 + (xx - x0) // 6, y1 - 1, 'tile', .55, emis=1)
        cc.hline(x0, x1, y1 - 5, 'tile', .6, emis=1)
        cc.rect(x0 + 10, y0 + 8, x0 + 18, y0 + 18, 'paper', .95, emis=1, dith=0)   # FIRE PROCEDURE notice
        cc.rect(x0 + 10, y0 + 8, x0 + 18, y0 + 10, 'neonred', .6, emis=1, dith=0)
        for k in range(12, 18, 2):
            cc.hline(x0 + 11, x0 + 17, y0 + k, 'paper', .55, emis=1)
        cc.ellipse(x0 + 5, y0 + 12, 2.5, 2.5, 'neonred', .62, emis=1, dith=0)   # fire bell
        cc.put(x0 + 4, y0 + 11, 'neonred', .95, emis=1)
        # haze of smoke drifting in the corridor
        D.dfill_rect(cc, x0, y0, x1, y0 + 14, 'fog', .85, .3, emis=.8)
        # the door leaf swung outwards (thin dark edge on the hinge side)
        cc.poly([(x0, y0), (x0 + 5, y0 - 2), (x0 + 5, y1 + 1), (x0, y1)], 'd_green', .35, dith=0)
        cc.vline(x0 + 5, y0 - 2, y1 + 1, 'd_green', .6)
        # light spilling into the cell
        spill = [(x0 + 1, y1), (x1 - 1, y1), (x1 + 14, 143), (x0 - 4, 143)]
        m, r = cc.poly_mask(spill)
        cc.poly(spill, 'tile', floor_fn, dith=.45)
        cc.light_poly(spill, .45)

    # ------------------------------------------------------------- animation ----------
    def moth(k):
        def fn(cc):
            ang = k / 6 * 2 * math.pi
            mx = lx + int(round(math.cos(ang) * 9))
            my = ly + 4 + int(round(math.sin(ang * 2) * 3))
            cc.put(mx, my, 'cream', .55)
            cc.put(mx + (1 if k % 2 else -1), my - 1, 'cream', .75)
        return fn
    sc.anim('moth', [moth(k) for k in range(6)], fps=10)

    # ------------------------------------------------------- interaction geometry -----
    cot_l, cot_t = p.P(X0, top + 4, Z0)
    cot_r, cot_b = p.P(X1, 0, Z1)
    vent_spot = (206, 120)
    door_spot = (98, 112)
    sc.hotspot('door', rect=(x0 - 3, y0 - 3, x1 + 3, y1), walk=door_spot, face='up')
    sc.hotspot('window', rect=(wx0 - 3, wy0 - 3, wx1 + 3, wy1 + 3), walk=door_spot, face='up')
    sc.hotspot('hatch', rect=(hx0 - 3, hy0 - 2, hx1 + 3, hy1 + 5), walk=door_spot, face='up')
    sc.hotspot('button', rect=(113, 72, 122, 86), walk=(118, 112), face='up')
    sc.hotspot('vent', rect=(vx0 - 4, vy0 - 4, vx1 + 4, vy1 + 4), walk=vent_spot, face='up')
    sc.hotspot('cot', rect=(int(cot_l) - 1, int(cot_t), int(cot_r) + 1, int(cot_b) + 1), walk=(214, 120), face='up')
    m0, m1 = p.P(X0 + 1, top + 2, Z0), p.P(X1 - 1, top - 2, Z1)
    sc.hotspot('mattress', rect=(int(m0[0]), int(m0[1]) - 2, int(m1[0]), int(m1[1]) + 1), walk=(196, 120), face='up')
    sc.hotspot('concrete', poly=[(161, 46), (172, 43), (176, 62), (177, 80), (183, 100), (156, 100), (157, 80), (159, 62)],
               walk=(166, 112), face='up')
    sc.hotspot('speaker', rect=(88, 17, 108, 35), walk=(112, 110), face='up')
    sc.hotspot('scratches', rect=(158, 84, 180, 100), walk=(170, 112), face='up')

    fl = p.quad([(BX0 + 2, 0, 2), (BX1 - 2, 0, 2), (BX1 - 2, 0, zfront), (BX0 + 2, 0, zfront)])
    cot_fp = p.quad([(X0 - 3, 0, 0), (X1 + 3, 0, 0), (X1 + 3, 0, Z1 + 3), (X0 - 3, 0, Z1 + 3)])
    bucket_fp = p.quad([(74, 0, 20), (98, 0, 20), (98, 0, 34), (74, 0, 34)])
    sc.walkable([(int(x), int(y)) for x, y in fl],
                holes=[[(int(x), int(y)) for x, y in cot_fp], [(int(x), int(y)) for x, y in bucket_fp]])
    sc.point('start', 160, 124, 'down')
    sc.point('wake', 209, 99, 'down')          # on the cot (mattress surface)
    sc.point('vent_spot', *vent_spot, face='up')
    sc.point('door_spot', *door_spot, face='up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, round(p.char_scale(FLOOR, 140), 3), 140, 1.0)
    sc.meta['floor'] = 'tile'
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
