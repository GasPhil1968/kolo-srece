"""Chapter 7 - captain's cabin of the MV Calypso, Pier 4.  Night, fog; one swinging lamp.

Riveted cream-painted bulkheads over varnished panelling, deck beams low overhead.  Rook's coat
hangs on a hook by the door; Delaney's briefcase sits on the chart table with a three-wheel
combination lock; a bottle of whisky, a telegraph form pinned to the bulkhead, the bunk under a
porthole full of fog and harbour lights.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
from persp import Persp, plank_floor
import props_d as D

W, H = 320, 144
FLOOR = 102
BX0, BX1 = 56, 264
WAINS = 72                  # top of the panelled wainscot
DOOR = (64, 56, 88, FLOOR)
HOOK = (98, 52)
TABLE = dict(X0=110, X1=178, Z0=2, Z1=22, H=22)
BUNK = dict(X0=186, X1=262, Z0=0, Z1=24, H=18)
PORT = (219.5, 38.5, 11)
LAMP = (156, 4)             # where the lamp hangs from


def build():
    sc = Scene('calypso_cabin', W, H, seed=27)
    c = sc.c
    p = Persp(BX0, BX1, 0, FLOOR, horizon=-40, depth=260)
    zfront = p.z_at_floor_y(H + 2)
    zedge = 100
    rng = np.random.default_rng(5)

    # ------------------------------------------------------------------ bulkheads ------
    def enamel(xx, yy):
        L = .58 - np.clip((yy - 10) / 70, 0, 1) * .04
        L = L + np.where(((xx - BX0) % 52) < 1, -.16, 0) + np.where(((xx - BX0) % 52) == 1, .08, 0)   # plate seams
        return L
    c.rect(BX0, 0, BX1, WAINS, 'd_enamel', enamel, dith=.3)
    for sx in range(BX0, BX1, 52):                                   # rivet rows along the seams
        for yy in range(4, WAINS - 2, 4):
            D.rivet(c, sx + 2, yy, 'd_enamel', .6)
    for yy in (24,):
        c.hline(BX0, BX1, yy, 'd_enamel', .42)
        for xx in range(BX0 + 3, BX1, 4):
            D.rivet(c, xx, yy + 2, 'd_enamel', .6)
    D.panelling(c, BX0, WAINS, BX1, FLOOR - 3, 'wood', .48, pw=26, raised=True, margin=3, grain=.05)
    c.rect(BX0, WAINS - 2, BX1, WAINS + 1, 'oak', .6, dith=0)          # capping rail
    c.hline(BX0, BX1, WAINS - 2, 'oak', .82)
    c.rect(BX0, FLOOR - 3, BX1, FLOOR, 'wood', .3, dith=0)
    # rust weeping from a few rivets
    for (x, y, L) in ((110, 30, 8), (163, 14, 6), (250, 54, 10), (72, 40, 7)):
        for t in range(L):
            c.put(x + (t // 4), y + t, 'rust', .5 - t * .03)
    # side walls: enamel over panelling
    for X in (BX0, BX1):
        f = D.side_uv(p, X)

        def sw(xx, yy, f=f):
            Z, Y, s = f(xx, yy)
            L = np.full(xx.shape, .5, np.float32)
            L = np.where((Z % 40) < 1.2, .36, L)
            return L

        def swp(xx, yy, f=f):
            Z, Y, s = f(xx, yy)
            L = np.full(xx.shape, .42, np.float32) + np.sin(Z * 2.1) * .02
            L = np.where((Z % 22) < 2, .3, L)
            L = np.where((Y > FLOOR - WAINS - 3) & (Y < FLOOR - WAINS), .62, L)
            return L
        c.poly(p.quad([(X, FLOOR - WAINS, 0), (X, FLOOR - WAINS, zedge), (X, 240, zedge), (X, 240, 0)]), 'd_enamel', sw,
               dith=.3)
        c.poly(p.quad([(X, 0, 0), (X, 0, zedge), (X, FLOOR - WAINS, zedge), (X, FLOOR - WAINS, 0)]), 'wood', swp, dith=.3)
    # deck: worn teak planks
    plank_floor(c, p, BX0, BX1, 0, zedge, 'oak', base=.4, plank_w=9, seed=3, gap_lum=.15, var=.06)
    # a threadbare rug in front of the chart table
    rug = p.quad([(104, .2, 30), (184, .2, 30), (184, .2, 54), (104, .2, 54)])
    fuv = D.floor_uv(p)

    def rugfn(xx, yy):
        X, Z, s = fuv(xx, yy)
        stripe = (np.floor((X - 104) / 6) % 3 == 0)
        edge = (np.abs(X - 104) < 3) | (np.abs(X - 184) < 3) | (np.abs(Z - 30) < 2) | (np.abs(Z - 54) < 2)
        return np.where(edge, .55, np.where(stripe, .48, .38))
    c.poly(rug, 'denim', rugfn, dith=.4)

    # --------------------------------------------------------------- the door -----------
    x0, y0, x1, y1 = DOOR
    c.rect(x0 - 3, y0 - 3, x1 + 3, y1, 'steel', .35, dith=0)
    c.hline(x0 - 3, x1 + 3, y0 - 3, 'steel', .6)
    c.rect(x0, y0, x1, y1 - 4, 'd_enamel', hgrad(x0, x1, .55, .45), dith=.2)
    for (cx_, cy_) in ((x0, y0), (x1 - 1, y0)):                         # rounded corners
        c.put(cx_, cy_, 'steel', .35)
    c.vline(x0, y0 + 1, y1 - 4, 'd_enamel', .7)
    c.vline(x1 - 1, y0, y1 - 4, 'd_enamel', .3)
    c.rect(x0 - 3, y1 - 5, x1 + 3, y1, 'steel', vgrad(y1 - 5, y1, .62, .38), dith=0)   # the high sill
    c.hline(x0 - 3, x1 + 3, y1 - 5, 'steel', .8)
    # deadlight port in the door: fog outside
    c.ellipse(76.5, 68.5, 4.5, 4.5, 'brass', .55, dith=0)
    c.ellipse(76.5, 68.5, 3.2, 3.2, 'fog', .45, emis=.6, dith=.3)
    c.put(75, 67, 'fog', .8, emis=.7)
    # dogs (lever latches) on the latch side
    for yy in (62, 78, 92):
        c.rect(x1 - 4, yy, x1 - 1, yy + 2, 'steel', .55, dith=0)
        c.line(x1 - 3, yy + 1, x1 + 2, yy - 2, 'steel', .7)
    for yy in (60, 90):                                                 # hinges
        c.rect(x0 - 2, yy, x0 + 2, yy + 4, 'steel', .5, dith=0)
    c.rect(x0 + 6, y0 - 9, x1 - 6, y0 - 4, 'brass', .55, dith=0)        # brass plate
    c.hline(x0 + 7, x1 - 7, y0 - 7, 'brass', .25)
    # speaking tube with a whistle cap beside the door
    c.vline(57, 0, 64, 'brass', .45)
    c.vline(58, 0, 64, 'brass', .65)
    c.ellipse(58, 66, 2.5, 2.5, 'brass', .6, dith=0)
    c.put(57, 65, 'brass', .95)

    # coat hook (the coat itself is a state object)
    hx, hy = HOOK
    c.rect(hx - 2, hy - 1, hx + 3, hy + 2, 'brass', .5, dith=0)
    c.line(hx, hy + 1, hx + 2, hy + 4, 'brass', .7)
    c.put(hx + 3, hy + 3, 'brass', .85)

    # ---------------------------------------------------------- above the chart table --
    # chart rack with rolled charts
    c.rect(110, 12, 178, 29, 'oak', .42, dith=0)                       # pigeonhole rack
    c.hline(110, 178, 12, 'oak', .7)
    c.hline(110, 178, 29, 'oak', .2)
    for row, yy0 in enumerate((14, 21)):
        for k, xx0 in enumerate(range(112, 176, 6)):
            c.rect(xx0, yy0, xx0 + 5, yy0 + 6, 'black', .15, dith=0)      # the hole
            if (k * 3 + row * 5) % 7 in (2,):
                continue                                                   # an empty slot
            r_ = 2.0 + ((k + row) % 3) * .25
            c.ellipse(xx0 + 2.5, yy0 + 3.2, r_, r_, 'paper', .7 + ((k + row) % 2) * .08, dith=0)
            c.put(xx0 + 2, yy0 + 3, 'paper', .4)                          # the roll's spiral
            c.put(xx0 + 3, yy0 + 3, 'paper', .5)
            if (k + row) % 4 == 0:
                c.put(xx0 + 1, yy0 + 5, 'neonred', .5)                    # a tag
    for xx0 in range(111, 178, 6):
        c.vline(xx0, 13, 28, 'oak', .52)
    c.hline(110, 178, 20, 'oak', .55)
    c.line(150, 27, 168, 31, 'paper', .7)                              # one chart pulled half out
    c.line(150, 28, 168, 32, 'paper', .5)
    # pin-up calendar, OCTOBER 1951
    c.rect(112, 32, 126, 54, 'paper', .78, dith=0)
    c.rect(113, 33, 125, 42, 'cream', .5, dith=0)
    c.ellipse(119, 37, 2, 2.5, 'skin', .6, dith=0)                      # the pin-up (a mere suggestion)
    c.rect(117, 39, 121, 42, 'red', .55, dith=0)
    c.put(118, 35, 'gold', .7)
    for k in range(4):
        c.hline(114, 124, 45 + k * 2, 'ink', .4)
    c.put(120, 47, 'neonred', .7)                                        # a date circled: the 20th
    c.put(119, 32, 'chrome', .9)
    # the telegraph form, pinned: pasted tape strips
    tg = (130, 34, 146, 50)
    c.rect(*tg, 'paper', .82, dith=0)
    c.rect(tg[0], tg[1], tg[2], tg[1] + 3, 'gold', .55, dith=0)
    for k in range(3):
        c.rect(tg[0] + 2, tg[1] + 5 + k * 3, tg[2] - 2 - (k % 2) * 3, tg[1] + 7 + k * 3, 'white', .9, dith=0)
        c.hline(tg[0] + 3, tg[2] - 4 - (k % 2) * 3, tg[1] + 6 + k * 3, 'ink', .3)
    c.put((tg[0] + tg[2]) // 2, tg[1], 'neonred', .8)
    c.shadow_poly([(tg[2], tg[1] + 1), (tg[2] + 1, tg[1] + 2), (tg[2] + 1, tg[3] + 1), (tg[0] + 1, tg[3] + 1), (tg[0] + 1, tg[3])],
                  .3)
    # ship's clock and barometer, brass, side by side
    D.clock_face(c, 156.5, 41.5, 6.5, 11, 52, face='paper', face_lum=.88, rim='brass', rim_lum=.7, rim_w=2)
    c.ellipse(171.5, 41.5, 6.5, 6.5, 'brass', .65, dith=0)
    c.ellipse(171.5, 41.5, 4.5, 4.5, 'paper', .8, dith=0)
    c.line(171, 41, 168, 38, 'black', .2)
    c.line(171, 41, 174, 39, 'brass', .9)
    for k in range(5):
        a = math.radians(-140 + k * 70)
        c.put(int(171.5 + math.cos(a) * 3.5), int(41.5 + math.sin(a) * 3.5), 'black', .3)

    # ---------------------------------------------------------------- chart table ------
    T = TABLE
    c.shadow_poly(p.quad([(T['X0'] - 1, 0, T['Z1']), (T['X1'] + 1, 0, T['Z1']), (T['X1'] + 2, 0, T['Z1'] + 4),
                          (T['X0'] - 2, 0, T['Z1'] + 4)]), .4)
    p.box(c, T['X0'], T['X1'], 0, T['H'], T['Z0'], T['Z1'], 'oak', front=.42, top=.58, side=.3)
    fx0, fy0, fx1, fy1 = [int(round(v)) for v in p.front_rect(T['X0'], T['X1'], 0, T['H'], T['Z1'])]
    for k in range(3):                                                  # wide shallow chart drawers
        ya = fy0 + 3 + k * 7
        c.rect(fx0 + 2, ya, fx1 - 2, ya + 6, 'oak', .46, dith=0)
        c.hline(fx0 + 2, fx1 - 2, ya, 'oak', .66)
        c.hline(fx0 + 2, fx1 - 2, ya + 6, 'oak', .22)
        for kx in (fx0 + 14, fx1 - 15):
            c.rect(kx, ya + 2, kx + 4, ya + 4, 'brass', .65, dith=0)
    c.hline(fx0, fx1, fy0, 'oak', .85)
    # fiddle rail on the table edge
    c.hline(fx0, fx1, fy0 - 1, 'oak', .5)
    # the chart: coastline, soundings, a pencilled course
    ch = p.quad([(T['X0'] + 3, T['H'], T['Z0'] + 2), (T['X1'] - 22, T['H'], T['Z0'] + 2), (T['X1'] - 22, T['H'], T['Z1'] - 2),
                 (T['X0'] + 3, T['H'], T['Z1'] - 2)])
    c.poly(ch, 'paper', .78, dith=0)
    for t in range(30):
        X = T['X0'] + 6 + t * 1.2
        Z = T['Z0'] + 6 + 4 * math.sin(t * .4) + 2 * math.sin(t * 1.3)
        xx_, yy_ = p.P(X, T['H'], Z)
        c.put(int(xx_), int(yy_), 'trench', .45)
    for k in range(10):
        X = T['X0'] + 8 + (k * 7) % 34
        Z = T['Z0'] + 10 + (k * 5) % 8
        xx_, yy_ = p.P(X, T['H'], Z)
        c.put(int(xx_), int(yy_), 'denim', .45)
    a0 = p.P(T['X0'] + 10, T['H'], T['Z1'] - 4)
    a1 = p.P(T['X1'] - 26, T['H'], T['Z0'] + 5)
    c.line(int(a0[0]), int(a0[1]), int(a1[0]), int(a1[1]), 'ink', .35)
    # parallel rule + dividers
    r0, r1 = p.P(T['X0'] + 6, T['H'] + .4, T['Z1'] - 5), p.P(T['X0'] + 24, T['H'] + .4, T['Z1'] - 7)
    c.line(int(r0[0]), int(r0[1]), int(r1[0]), int(r1[1]), 'wood', .25)
    c.line(int(r0[0]), int(r0[1]) + 1, int(r1[0]), int(r1[1]) + 1, 'brass', .6)
    dv = p.P(T['X0'] + 30, T['H'], T['Z1'] - 5)
    c.line(int(dv[0]), int(dv[1]), int(dv[0]) - 3, int(dv[1]) - 5, 'chrome', .8)
    c.line(int(dv[0]) + 3, int(dv[1]), int(dv[0]) - 3, int(dv[1]) - 5, 'chrome', .65)
    # whisky bottle and a glass (left end)
    bx_, by_ = p.P(T['X0'] + 6, T['H'], T['Z0'] + 8)
    bx_, by_ = int(bx_), int(by_)
    c.rect(bx_ - 2, by_ - 11, bx_ + 3, by_, 'lamp', vgrad(by_ - 11, by_, .45, .3), dith=0)
    c.rect(bx_ - 1, by_ - 15, bx_ + 2, by_ - 11, 'lamp', .35, dith=0)
    c.rect(bx_ - 1, by_ - 16, bx_ + 2, by_ - 15, 'black', .2, dith=0)
    c.rect(bx_ - 2, by_ - 8, bx_ + 3, by_ - 4, 'paper', .75, dith=0)    # label
    c.hline(bx_ - 1, bx_ + 2, by_ - 6, 'red', .5)
    c.vline(bx_ - 2, by_ - 11, by_, 'lamp', .8)
    gx_, gy_ = bx_ + 7, by_ + 1
    c.rect(gx_, gy_ - 4, gx_ + 3, gy_, 'glass', .45, emis=.2, dith=0)
    c.rect(gx_, gy_ - 2, gx_ + 3, gy_, 'lamp', .5, dith=0)
    c.put(gx_, gy_ - 4, 'glass', .85, emis=.3)
    BOTTLE = (bx_ - 4, by_ - 17, gx_ + 5, gy_ + 2)
    # Delaney's briefcase (upright, three-wheel lock) - the closed state is part of the bg
    bcx, bcy = p.P(150, T['H'], T['Z0'] + 13)
    bcx, bcy = int(bcx), int(bcy)
    BRIEF = (bcx - 11, bcy - 14, bcx + 12, bcy + 1)

    def briefcase_closed(cc):
        x0b, y0b, x1b, y1b = BRIEF
        cc.rect(x0b, y0b + 3, x1b, y1b, 'rust', hgrad(x0b, x1b, .62, .45), dith=.2)
        cc.hline(x0b + 1, x1b - 1, y0b + 3, 'rust', .8)
        cc.put(x0b, y0b + 3, 'rust', .4)
        cc.put(x1b - 1, y0b + 3, 'rust', .4)
        cc.rect(x0b + 8, y0b, x1b - 8, y0b + 1, 'rust', .55, dith=0)    # handle
        cc.vline(x0b + 8, y0b, y0b + 3, 'rust', .45)
        cc.vline(x1b - 9, y0b, y0b + 3, 'rust', .45)
        cc.hline(x0b + 1, x1b - 1, y0b + 7, 'rust', .35)                # flap edge
        for kx in (x0b + 3, x1b - 5):                                   # brass catches
            cc.rect(kx, y0b + 6, kx + 2, y0b + 9, 'brass', .7, dith=0)
        cc.rect(bcx - 4, y0b + 8, bcx + 5, y0b + 12, 'brass', .45, dith=0)   # combination plate
        for k in range(3):
            cc.put(bcx - 3 + k * 3, y0b + 10, 'paper', .85)
            cc.put(bcx - 3 + k * 3, y0b + 9, 'brass', .9)
        cc.hline(x0b, x1b, y1b - 1, 'rust', .25)
        cc.put(x0b + 2, y1b - 3, 'gold', .8)                             # gold monogram F.D.
        cc.put(x0b + 4, y1b - 3, 'gold', .8)
    briefcase_closed(c)

    # ----------------------------------------------------------------- the bunk -------
    B = BUNK
    # porthole above the bunk: night fog, harbour lights, rain on the glass
    pcx, pcy, pr = PORT
    c.ellipse(pcx + 1, pcy + 1, pr + 1, pr + 1, 'd_enamel', .25, dith=0)
    c.ellipse(pcx, pcy, pr, pr, 'brass', radial(pcx - 4, pcy - 4, pr * 1.6, .85, .35), dith=.2)
    for k in range(8):
        a = k / 8 * 2 * math.pi
        c.put(int(pcx + math.cos(a) * (pr - 1.3)), int(pcy + math.sin(a) * (pr - 1.3)), 'brass', .3)
    gr = pr - 3

    def port_view(cc):
        cc.ellipse(pcx, pcy, gr, gr, 'water', vgrad(pcy - gr, pcy + gr, .52, .3), emis=.8, dith=.5)
        cc.ellipse(pcx, pcy - 2, gr, gr - 2, 'fog', vgrad(pcy - gr, pcy, .5, .35), emis=.8, dith=.5)
        cc.rect(int(pcx - gr), int(pcy + 1), int(pcx + gr), int(pcy + 3), 'black', .3, emis=.5, dith=0)   # the far pier
        for (lx_, ly_) in ((pcx - 4, pcy), (pcx + 3, pcy + 1), (pcx + 6, pcy - 1)):
            cc.put(int(lx_), int(ly_), 'lamp', .95, 1)
            cc.vline(int(lx_), int(ly_) + 2, int(pcy + gr - 1), 'lamp', .5, 1)    # reflection on the water
        cc.put(int(pcx - 1), int(pcy - 4), 'neonred', .8, 1)                         # a mast light
        D.rain_on_pane(cc, int(pcx - gr), int(pcy - gr), int(pcx + gr), int(pcy + gr), seed=6, density=.03,
                       ramp_name='fog', lum=.85, emis=.8)
    port_view(c)
    c.line(int(pcx - gr + 2), int(pcy + 2), int(pcx - 2), int(pcy - gr + 2), 'fog', .9, emis=.6)   # glass glint
    D.screw(c, int(pcx - pr) - 2, int(pcy) - 1, 'brass', .7)
    c.rect(int(pcx + pr), int(pcy) - 2, int(pcx + pr) + 3, int(pcy) + 2, 'brass', .6, dith=0)       # dog
    # shelf with books + fiddle rail over the bunk's head end
    c.rect(234, 50, 262, 52, 'oak', .55, dith=0)
    for k, bxk in enumerate(range(236, 258, 3)):
        hh = 6 + (k % 3)
        c.rect(bxk, 50 - hh, bxk + 2, 50, ('red', 'denim', 'felt', 'trench')[k % 4], .5, dith=0)
    c.hline(234, 262, 47, 'brass', .55)
    # bunk box: built-in berth with a lee board and drawers
    p.box(c, B['X0'], B['X1'], 0, B['H'] - 4, B['Z0'], B['Z1'], 'oak', front=.44, top=.5, side=.3)
    bfx0, bfy0, bfx1, bfy1 = [int(round(v)) for v in p.front_rect(B['X0'], B['X1'], 0, B['H'] - 4, B['Z1'])]
    for (a, b) in ((bfx0 + 3, (bfx0 + bfx1) // 2 - 2), ((bfx0 + bfx1) // 2 + 2, bfx1 - 3)):
        c.rect(a, bfy0 + 3, b, bfy1 - 3, 'oak', .4, dith=0)
        c.hline(a, b, bfy0 + 3, 'oak', .25)
        c.hline(a, b, bfy1 - 4, 'oak', .6)
        c.rect((a + b) // 2 - 2, (bfy0 + bfy1) // 2, (a + b) // 2 + 2, (bfy0 + bfy1) // 2 + 1, 'brass', .65, dith=0)
    # mattress, grey blanket, pillow
    p.box(c, B['X0'] + 1, B['X1'] - 1, B['H'] - 4, B['H'], B['Z0'] + 1, B['Z1'] - 2, 'paper', front=.55, top=.66, side=.4)
    Nb = noise2(W, H, 3, 8, 2)
    blank = p.quad([(B['X0'] + 2, B['H'] + .5, B['Z0'] + 2), (B['X1'] - 16, B['H'] + .5, B['Z0'] + 2),
                    (B['X1'] - 16, B['H'] + .5, B['Z1'] - 1), (B['X0'] + 2, B['H'] + .5, B['Z1'] - 1)])
    c.poly(blank, 'slate', lambda xx, yy: .52 + (Nb[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)]
                                                 - .5) * .3, dith=.3)
    c.line(int(blank[3][0]), int(blank[3][1]), int(blank[2][0]), int(blank[2][1]), 'slate', .3)
    for k in range(3):                                                  # navy stripes on the blanket
        X = B['X0'] + 10 + k * 4
        q0, q1 = p.P(X, B['H'] + .5, B['Z0'] + 2), p.P(X, B['H'] + .5, B['Z1'] - 1)
        c.line(int(q0[0]), int(q0[1]), int(q1[0]), int(q1[1]), 'denim', .4)
    pa = p.P(B['X1'] - 9, B['H'] + 2, (B['Z0'] + B['Z1']) / 2)
    c.ellipse(pa[0], pa[1], 7, 3, 'white', radial(pa[0] - 2, pa[1] - 1, 8, .9, .55), dith=.3)
    # lee board along the front of the bunk
    lb = p.quad([(B['X0'], B['H'] - 2, B['Z1']), (B['X1'], B['H'] - 2, B['Z1']), (B['X1'], B['H'] + 3, B['Z1']),
                 (B['X0'], B['H'] + 3, B['Z1'])])
    c.poly(lb, 'oak', .52, dith=0)
    c.line(lb[3][0], lb[3][1], lb[2][0], lb[2][1], 'oak', .8)
    # a cap on the bunk post, oilskins on the right wall
    cp = p.P(B['X0'] + 2, B['H'] + 5, B['Z1'])
    c.ellipse(cp[0], cp[1], 5, 1.6, 'black', .25, dith=0)
    c.rect(int(cp[0]) - 3, int(cp[1]) - 4, int(cp[0]) + 4, int(cp[1]), 'black', .3, dith=0)
    c.hline(int(cp[0]) - 3, int(cp[0]) + 4, int(cp[1]) - 2, 'gold', .65)     # captain's cap with gold braid
    c.put(int(cp[0]), int(cp[1]) - 3, 'gold', .9)
    ok = p.quad([(BX1, 30, 46), (BX1, 30, 60), (BX1, 70, 58), (BX1, 70, 48)])
    c.poly(ok, 'gold', .5, dith=.3)                                     # yellow oilskins
    c.line(ok[0][0], ok[0][1], ok[3][0], ok[3][1], 'gold', .7)
    sw_ = p.P(BX1, 72, 53)
    c.rect(int(sw_[0]) - 2, int(sw_[1]) - 3, int(sw_[0]) + 3, int(sw_[1]) + 1, 'gold', .4, dith=0)   # sou'wester
    # sea chest at the foot of the bunk
    SC = dict(X0=232, X1=258, Z0=32, Z1=46, H=12)
    c.shadow_poly(p.quad([(SC['X0'] - 2, 0, SC['Z0']), (SC['X1'] + 2, 0, SC['Z0']), (SC['X1'] + 2, 0, SC['Z1'] + 3),
                          (SC['X0'] - 2, 0, SC['Z1'] + 3)]), .45)
    p.box(c, SC['X0'], SC['X1'], 0, SC['H'], SC['Z0'], SC['Z1'], 'wood', front=.45, top=.55, side=.32)
    sfx0, sfy0, sfx1, sfy1 = [int(round(v)) for v in p.front_rect(SC['X0'], SC['X1'], 0, SC['H'], SC['Z1'])]
    for k in (sfx0 + 3, sfx1 - 5):
        c.vline(k, sfy0, sfy1, 'brass', .45)
    c.rect((sfx0 + sfx1) // 2 - 2, sfy0 + 2, (sfx0 + sfx1) // 2 + 2, sfy0 + 5, 'brass', .6, dith=0)
    c.line(sfx1, sfy0 + 4, sfx1 + 3, sfy0 + 7, 'trench', .5)            # rope becket
    # framed photograph of the Calypso, a pair of sea boots, an empty bottle rolled under the table
    c.rect(188, 28, 204, 41, 'black', .25, dith=0)
    c.rect(189, 29, 203, 40, 'paper', vgrad(29, 40, .55, .7), dith=0)
    c.hline(190, 202, 36, 'denim', .45)
    c.poly([(192, 35), (201, 35), (199, 37), (193, 37)], 'black', .3, dith=0)
    c.vline(196, 31, 35, 'black', .3)
    c.put(198, 32, 'black', .3)
    c.put(196, 28, 'brass', .8)
    for (X, Z) in ((176, 40), (181, 41)):
        bx2, by2 = p.P(X, 0, Z)
        bx2, by2 = int(bx2), int(by2)
        c.rect(bx2, by2 - 9, bx2 + 4, by2, 'black', .3, dith=0)
        c.rect(bx2, by2 - 2, bx2 + 6, by2, 'black', .25, dith=0)
        c.vline(bx2, by2 - 9, by2, 'black', .45)
    eb = p.P(150, 0, 30)
    c.line(int(eb[0]), int(eb[1]), int(eb[0]) + 7, int(eb[1]) - 1, 'felt', .5)
    c.line(int(eb[0]), int(eb[1]) - 1, int(eb[0]) + 7, int(eb[1]) - 2, 'felt', .62)
    c.put(int(eb[0]) + 8, int(eb[1]) - 2, 'black', .3)
    # ashtray with a cigar on the chart table
    at = p.P(T['X1'] - 8, T['H'], T['Z0'] + 6)
    c.ellipse(at[0], at[1], 3, 1.2, 'glass', .45, dith=0)
    c.line(int(at[0]) - 1, int(at[1]) - 1, int(at[0]) + 4, int(at[1]) - 2, 'wood', .35)
    c.put(int(at[0]) + 5, int(at[1]) - 2, 'lamp', .7, 1)
    # life ring on the left wall
    lr_ = p.P(BX0, 46, 34)
    c.ellipse(lr_[0], lr_[1], 4.5, 9, 'neonred', .5, dith=0)
    c.ellipse(lr_[0], lr_[1], 2.2, 5, 'd_enamel', .45, dith=0)
    for k in (-6, 0, 6):
        c.rect(int(lr_[0]) - 4, int(lr_[1]) + k, int(lr_[0]) + 4, int(lr_[1]) + k + 2, 'white', .8, dith=0) if k != 0 else None
    c.rect(int(lr_[0]) - 4, int(lr_[1]) - 1, int(lr_[0]) - 1, int(lr_[1]) + 1, 'white', .8, dith=0)

    # ------------------------------------------------------------ deck beams overhead --
    c.rect(BX0, 0, BX1, 3, 'd_enamel', .4, dith=0)
    c.hline(BX0, BX1, 3, 'd_enamel', .2)
    for (yb, hgt, L) in ((0, 7, .35),):
        c.rect(0, yb, W, yb + hgt, 'd_enamel', vgrad(yb, yb + hgt, .45, .28), dith=0)
        c.hline(0, W, yb + hgt, 'black', .3)
        for k in range(4, W, 10):
            D.rivet(c, k, yb + 3, 'd_enamel', .55)
    c.rect(0, 7, W, 9, 'steel', .45, dith=0)                            # a pipe run under the beam
    c.hline(0, W, 7, 'steel', .7)
    for k in range(20, W, 60):
        c.rect(k, 6, k + 3, 10, 'steel', .3, dith=0)

    # ------------------------------------------------------------- the hanging lamp -----
    LX, LY = LAMP
    LL = 26

    def lamp(cc, ang):
        a = math.radians(ang)
        ex = LX + math.sin(a) * LL
        ey = LY + math.cos(a) * LL
        cc.line(LX, LY + 6, int(round(ex)), int(round(ey)) - 6, 'brass', .55)
        cc.put(LX, LY + 6, 'brass', .8)
        ex, ey = int(round(ex)), int(round(ey))
        cc.ellipse(ex + .5, ey - 6, 5, 1.6, 'brass', .65, dith=0)       # cap
        cc.put(ex, ey - 8, 'brass', .85)
        cc.ellipse(ex + .5, ey - .5, 4.2, 5.2, 'lamp', radial(ex, ey, 5, 1.0, .7), emis=1, dith=0)   # glass globe
        cc.rect(ex - 1, ey - 2, ex + 2, ey + 2, 'white', 1.0, emis=1, dith=0)                          # flame
        for dx in (-4, 0, 4):
            cc.vline(ex + dx, ey - 5, ey + 4, 'brass', .4)                                            # guard wires
        cc.hline(ex - 4, ex + 5, ey - 1, 'brass', .45)
        cc.ellipse(ex + .5, ey + 5, 5, 1.8, 'brass', .6, dith=0)        # fount
        cc.put(ex, ey + 7, 'brass', .8)
    LAMP_SNAP = D.snapshot(c, LX - 9, LY + 4, LX + 10, LY + LL + 10)
    lamp(c, 0)

    # ------------------------------------------------------------------ lighting -------
    c.ambient = .33
    c.add_light(LX, LY + LL, 175, 1.0, falloff=1.4)                    # hurricane lamp
    c.add_light(LX, 118, 80, .3, ystretch=2.6)                         # its pool on the deck
    c.add_light(pcx, pcy, 24, .2)                                      # porthole
    c.glow(LX, LY + LL, 30, '#ffb860', .55)
    c.glow(pcx, pcy, 14, '#a0b8d0', .18)
    c.shade *= np.clip(1.22 - np.abs(np.arange(W)[None, :] - 156) / 200.0, .58, 1)
    c.shade *= np.clip(1.06 - np.abs(np.arange(H)[:, None] - 70) / 200.0, .76, 1)

    # ------------------------------------------------------------- state objects -------
    with sc.obj('coat', state=True, depth=FLOOR - 4) as cc:
        # Rook's trench coat hanging from the hook: collar, shoulders, belt, folds
        cxc = hx + 1
        coat = [(cxc - 3, hy + 2), (cxc + 4, hy + 2), (cxc + 8, hy + 7), (cxc + 9, hy + 24), (cxc + 8, hy + 44),
                (cxc - 7, hy + 44), (cxc - 8, hy + 24), (cxc - 7, hy + 7)]

        def fold(xx, yy):
            return .58 + np.sin((xx - cxc) * 1.4) * .07 - np.clip((yy - hy) / 60, 0, 1) * .12 + np.clip((cxc - xx) / 10, 0, 1) * .06
        cc.poly(coat, 'trench', fold, dith=.3)
        cc.poly([(cxc - 3, hy + 2), (cxc + 4, hy + 2), (cxc + 2, hy + 9), (cxc - 1, hy + 9)], 'trench', .42, dith=0)   # collar
        cc.rect(cxc - 8, hy + 22, cxc + 9, hy + 24, 'trench', .38, dith=0)                       # belt
        cc.rect(cxc - 1, hy + 21, cxc + 2, hy + 25, 'brass', .6, dith=0)
        cc.line(cxc + 2, hy + 24, cxc + 4, hy + 34, 'trench', .38)                             # belt end
        cc.line(cxc - 4, hy + 9, cxc - 5, hy + 43, 'trench', .4)                               # front edge
        for yy in (hy + 12, hy + 17, hy + 28):
            cc.put(cxc - 3, yy, 'black', .3)
        cc.line(cxc + 6, hy + 8, cxc + 7, hy + 42, 'trench', .35)
        cc.hline(cxc - 7, cxc + 8, hy + 44, 'trench', .3)
    with sc.obj('briefcase_open', state=True, depth=fy1 + 1) as cc:
        x0b, y0b, x1b, y1b = BRIEF
        # cover the closed case with the table top, then the case lying open
        cc.poly(p.quad([(140, T['H'], T['Z0'] + 4), (162, T['H'], T['Z0'] + 4), (162, T['H'], T['Z0'] + 16),
                        (140, T['H'], T['Z0'] + 16)]), 'oak', .58, dith=0)
        cc.rect(x0b - 2, y0b, x1b + 2, y0b + 9, 'd_enamel', .55, dith=.3)      # bulkhead behind
        cc.rect(x0b - 2, y0b + 9, x1b + 2, y1b - 1, 'd_enamel', .5, dith=.3)
        bx0, by0 = x0b - 3, y1b - 8
        cc.rect(bx0, by0, x1b + 3, y1b, 'rust', .42, dith=0)                     # case bottom (open, seen from above)
        cc.rect(bx0 + 1, by0 + 1, x1b + 2, y1b - 1, 'rust', .22, dith=0)
        cc.poly([(bx0, by0), (x1b + 3, by0), (x1b + 1, by0 - 9), (bx0 + 2, by0 - 9)], 'rust', .55, dith=0)   # lid, flipped up
        cc.hline(bx0 + 2, x1b + 1, by0 - 9, 'rust', .8)
        cc.rect(bx0 + 4, by0 - 6, x1b - 1, by0 - 2, 'rust', .35, dith=0)        # lid pocket
        # papers: the manifest with a red stamp, the telegram
        cc.rect(bx0 + 2, by0 + 1, bx0 + 13, y1b - 1, 'paper', .85, dith=0)
        for k in range(3):
            cc.hline(bx0 + 3, bx0 + 11, by0 + 2 + k * 2, 'ink', .35)
        cc.rect(bx0 + 8, by0 + 4, bx0 + 12, by0 + 6, 'neonred', .5, dith=0)
        cc.rect(bx0 + 14, by0 + 2, x1b + 1, y1b - 2, 'gold', .6, dith=0)
        cc.hline(bx0 + 15, x1b, by0 + 3, 'white', .9)
        cc.hline(bx0 + 15, x1b - 2, by0 + 5, 'white', .9)
        for kx in (bx0 + 1, x1b + 1):
            cc.rect(kx, by0 - 1, kx + 2, by0 + 1, 'brass', .7, dith=0)

    # ---------------------------------------------------------------- animation --------
    swing = [math.sin(2 * math.pi * k / 10) * 5 for k in range(10)]

    def lamp_frame(ang):
        def fn(cc):
            D.restore(cc, LAMP_SNAP)
            lamp(cc, ang)
        return fn
    sc.anim('lamp', [lamp_frame(a) for a in swing], fps=5)

    # ------------------------------------------------------------ interaction geometry -
    sc.hotspot('exit_deck', rect=(x0 - 3, y0 - 10, x1 + 3, y1), walk=(76, 110), face='up')
    sc.hotspot('coat', rect=(hx - 9, hy - 2, hx + 12, hy + 46), walk=(100, 110), face='up')
    sc.hotspot('chart_table', rect=(fx0, int(p.P(0, T['H'], T['Z0'])[1]) - 2, fx1, fy1), walk=(142, 120), face='up')
    sc.hotspot('telegram', rect=(tg[0] - 1, tg[1] - 1, tg[2] + 2, tg[3] + 2), walk=(138, 120), face='up')
    sc.hotspot('bottle', rect=BOTTLE, walk=(122, 120), face='up')
    sc.hotspot('briefcase', rect=(BRIEF[0] - 4, BRIEF[1] - 2, BRIEF[2] + 4, BRIEF[3] + 1), walk=(152, 120), face='up')
    sc.hotspot('porthole', rect=(int(pcx - pr) - 2, int(pcy - pr) - 2, int(pcx + pr) + 4, int(pcy + pr) + 2), walk=(218, 122),
               face='up')
    bt = p.P(B['X0'], B['H'] + 4, B['Z0'])
    sc.hotspot('bunk', rect=(bfx0, int(bt[1]), bfx1, bfy1), walk=(212, 124), face='up')
    # extras
    sc.hotspot('calendar', rect=(111, 31, 127, 55), walk=(122, 120), face='up')
    sc.hotspot('clock', rect=(149, 34, 179, 49), walk=(162, 120), face='up')
    sc.hotspot('sea_chest', rect=(sfx0 - 1, int(p.P(0, SC['H'], SC['Z0'])[1]) - 1, sfx1 + 4, sfy1), walk=(226, 134),
               face='right')

    def W3(X, Z):
        x_, y_ = p.P(X, 0, Z)
        return (int(round(x_)), int(round(y_)))
    fl = [W3(BX0 + 2, 6), W3(T['X0'] - 3, 6), W3(T['X0'] - 3, T['Z1'] + 4), W3(B['X0'] - 3, T['Z1'] + 4),
          W3(B['X0'] - 3, B['Z1'] + 4), W3(BX1 - 2, B['Z1'] + 4), W3(BX1 - 2, zfront), W3(BX0 + 2, zfront)]
    holes = [[W3(SC['X0'] - 3, SC['Z0'] - 3), W3(BX1, SC['Z0'] - 3), W3(BX1, SC['Z1'] + 3), W3(SC['X0'] - 3, SC['Z1'] + 3)]]
    sc.walkable(fl, holes=holes)
    sc.point('start', 78, 112, face='down')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, round(p.char_scale(FLOOR, 140), 3), 140, 1.0)
    sc.meta['floor'] = 'wood'
    sc.rain(int(pcx - gr), int(pcy - gr), int(pcx + gr), int(pcy + gr), density=.6, kind='window')
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
