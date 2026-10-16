"""Hotel Sorrento lobby (Ch1). Pre-dawn, rain outside, tired 1920s grandeur."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad
from scene import Scene
from persp import Persp
import furniture as F
import props_a as A

W, H = 320, 144
FLOOR = 92
NEON = '#ff3048'


def build():
    sc = Scene('hotel_lobby', W, H, seed=31)
    c = sc.c
    p = Persp(40, 284, 0, FLOOR, horizon=-60, depth=400)
    zf = p.z_at_floor_y(H + 2)
    P = lambda X, Y, Z: A.P(p, X, Y, Z)
    fy = lambda Z: int(p.P(0, 0, Z)[1])

    # ================================================================ shell ===========
    with sc.obj('_backwall'):
        A.damask(c, 40, 0, 284, FLOOR, 'a_damask', base=.5, cell=(10, 14), amp=.1, seed=6)
    for X in (40, 284):
        q = A.side_quad(p, X, 0, 160, 0, zf)
        with sc.obj('_lwall' if X == 40 else '_rwall'):
            c.poly(q, 'a_damask', lambda xx, yy: .42 + .04 * np.sin(yy * .9) * 0, dith=.4)
    # cornice with dentils
    c.rect(40, 0, 284, 7, 'cream', .45, dith=.3)
    c.hline(40, 284, 6, 'cream', .62)
    c.hline(40, 284, 7, 'black', .25)
    for x in range(41, 284, 4):
        c.rect(x, 3, x + 2, 6, 'cream', .58, dith=0)
    for X in (40, 284):
        a, b = p.P(X, FLOOR - 6, 0), p.P(X, FLOOR - 6, zf)
        c.line(a[0], a[1], b[0], b[1], 'cream', .5)
    A.crack(c, 205, 7, 10, 'cream', .25, seed=2)
    A.water_stain(c, 262, 12, 14, 8, .2, .1)
    A.water_stain(c, 96, 10, 9, 5, .16, .1)
    # mahogany wainscot (back + sides)
    A.wainscot_back(c, 40, 284, 60, FLOOR, 'a_mahog', .44, panel=22)
    A.wainscot_side(c, p, 284, zf, h=32, rmp='a_mahog', lum=.4, panel=22)
    A.wainscot_side(c, p, 40, zf, h=32, rmp='a_mahog', lum=.36, panel=22)

    # marble floor
    with sc.obj('_floor'):
        A.cabochon_floor(c, p, 40, 284, 0, zf, size=17, light='cream', seed=4, cracks=14, lum_l=.44, lum_d=.55)

    # =========================================================== street door ===========
    dx0, dx1, dy0 = 100, 136, 46
    with sc.obj('_door'):
        # pilasters + pediment
        for px in (92, 140):
            c.rect(px, 18, px + 5, FLOOR, 'cream', hgrad(px, px + 5, .62, .42), dith=.2)
            c.vline(px + 1, 22, FLOOR - 4, 'cream', .7)
            c.rect(px - 1, 16, px + 6, 20, 'cream', .66, dith=0)
            c.hline(px - 1, px + 6, 16, 'cream', .85)
            c.rect(px - 1, FLOOR - 4, px + 6, FLOOR, 'cream', .45, dith=0)
        c.rect(90, 12, 147, 17, 'cream', .58, dith=0)
        c.hline(90, 147, 12, 'cream', .8)
        c.hline(90, 147, 17, 'black', .3)
        c.rect(dx0 - 4, 26, dx1 + 4, FLOOR, 'a_mahog', .38, dith=0)
        c.hline(dx0 - 4, dx1 + 4, 26, 'a_mahog', .62)
        # transom: frosted glass, glowing faintly from the street; gold letters reversed
        tx0, ty0, tx1, ty1 = dx0, 29, dx1, 43
        A.frosted_glass(c, tx0, ty0, tx1, ty1, rmp='glass', lum=.62, emis=.85, hot=(dx1 - 6, ty0 + 3, 16), seed=8)
        for s_, yy in (('HOTEL', ty0 + 2), ('SORRENTO', ty0 + 8)):
            w = A.text_w(s_)
            A.text(c, (tx0 + tx1) // 2 - w // 2, yy, s_, 'gold', .62, mirror=True, outline=('a_bakelite', .25))
        c.rect(dx0 - 1, ty1, dx1 + 1, ty1 + 3, 'a_mahog', .45, dith=0)
        c.hline(dx0 - 1, dx1 + 1, ty1, 'a_mahog', .7)
        # double doors with clear glass: the rainy street before dawn
        mid = (dx0 + dx1) // 2
        for (a, b) in ((dx0, mid), (mid, dx1)):
            c.rect(a, dy0, b, FLOOR, 'a_mahog', hgrad(a, b, .46, .38), dith=.2)
            gx0, gy0, gx1, gy1 = a + 3, dy0 + 3, b - 3, dy0 + 28
            c.rect(gx0, gy0, gx1, gy1, 'night', vgrad(gy0, gy1, .32, .2), emis=.8, dith=.5)
            # buildings across the street
            c.rect(gx0, gy0 + 3, gx1, gy1 - 7, 'brick', .2, emis=.4, dith=.4)
            for k in range(2):
                c.rect(gx0 + 2 + k * 6, gy0 + 6, gx0 + 4 + k * 6, gy0 + 10, 'lamp', .45 if (a + k) % 3 else .2,
                       emis=1)
            # wet street with neon reflections
            c.rect(gx0, gy1 - 7, gx1, gy1, 'water', vgrad(gy1 - 7, gy1, .35, .22), emis=.6, dith=.5)
            for k in range(3):
                c.hline(gx0 + 1 + k * 2, gx0 + 4 + k * 2, gy1 - 5 + k * 2, 'water', .6, emis=.7)
            c.rect(a + 2, gy1 + 2, b - 2, FLOOR - 4, 'a_mahog', .36, dith=.2)
            c.hline(a + 2, b - 2, gy1 + 2, 'a_mahog', .24)
            c.hline(a + 2, b - 2, FLOOR - 5, 'a_mahog', .58)
            c.rect(a, FLOOR - 3, b, FLOOR, 'brass', .42, dith=0)
            c.hline(a, b, FLOOR - 3, 'brass', .7)
            A.rain_streaks(c, gx0, gy0, gx1, gy1, seed=a, n=14)
        # street lamp glowing in the left pane, neon sign edge in the right pane
        c.put(dx0 + 7, dy0 + 8, 'lamp', 1.0, emis=1)
        c.put(dx0 + 8, dy0 + 8, 'lamp', .8, emis=1)
        c.vline(dx0 + 7, dy0 + 9, dy0 + 24, 'black', .2)
    with sc.obj('_doorneon'):
        c.rect(dx1 - 7, dy0 + 4, dx1 - 4, dy0 + 18, 'neonred', .9, emis=1)
        c.rect(dx1 - 6, dy0 + 5, dx1 - 5, dy0 + 17, 'neonred', 1.0, emis=1)
    door_neon_oid = sc.objects[-1]['id']
    with sc.obj('_door2'):
        c.vline(mid, dy0, FLOOR, 'black', .25)
        for hx in (mid - 3, mid + 2):
            c.rect(hx, dy0 + 30, hx + 1, dy0 + 38, 'brass', .7)
            c.put(hx, dy0 + 30, 'brass', .95)
        # door mat
        c.poly(p.quad([(dx0 - 2, .1, 2), (dx1 + 2, .1, 2), (dx1 + 2, .1, 12), (dx0 - 2, .1, 12)]), 'trench', .35,
               dith=.5)
        mx_, my_ = P(118, 0, 7)
        A.text(c, mx_ - 7, my_ - 2, 'WELCOME', 'trench', .5)
    # wall sconces beside the door (one dead)
    for sx, on in ((84, True), (153, False)):
        c.rect(sx, 38, sx + 2, 44, 'brass', .5, dith=0)
        c.poly([(sx - 2, 32), (sx + 4, 32), (sx + 3, 38), (sx - 1, 38)], 'cream' if not on else 'lamp',
               .55 if not on else .8, emis=1 if on else 0, dith=0)
        if on:
            c.glow(sx + 1, 34, 16, '#ffbf6a', .4)

    # ================================================= staircase up to the rooms ========
    sX0, sX1 = 40, 84
    steps = 9
    with sc.obj('_upper'):
        # opening to the upper corridor at the top of the stairs
        c.rect(42, 0, 86, 38, 'a_damask', vgrad(0, 38, .18, .3), dith=.5)
        c.rect(42, 0, 86, 4, 'cream', .3)
        c.rect(52, 6, 66, 38, 'a_mahog', .22, dith=.3)               # a room door up there
        c.put(64, 22, 'brass', .6)
        A.text(c, 57, 10, '7', 'brass', .5)
        c.rect(74, 14, 76, 18, 'lamp', .8, emis=1)                    # corridor sconce
        c.glow(75, 15, 12, '#ffb860', .35)
        c.rect(42, 34, 86, 38, 'red', .3, dith=.3)                    # corridor runner
        c.vline(86, 0, 38, 'cream', .55)
        c.vline(87, 0, 38, 'cream', .35)
    # tall window on the left wall above the stairs: grey pre-dawn light and rain
    with sc.obj('_lwin'):
        c.poly(A.side_quad(p, 40, 58, 150, 18, 70), 'cream', .55, dith=0)
        c.poly(A.side_quad(p, 40, 62, 150, 22, 66), 'a_skyday', vgrad(-10, 46, .55, .3), emis=.8, dith=.5)
        for Z in (36.7, 51.3):
            a_, b_ = P(40, 62, Z), P(40, 150, Z)
            c.line(a_[0], a_[1], b_[0], b_[1], 'cream', .6)
        for Y in (88, 114):
            a_, b_ = P(40, Y, 22), P(40, Y, 66)
            c.line(a_[0], a_[1], b_[0], b_[1], 'cream', .6)
        a_, b_ = P(40, 59, 18), P(40, 59, 70)
        c.line(a_[0], a_[1] + 1, b_[0], b_[1] + 1, 'cream', .8)
        lw_box = (min(P(40, 62, 66)[0], P(40, 150, 66)[0]), 0, P(40, 62, 22)[0] + 1, P(40, 62, 66)[1])
        A.rain_streaks(c, lw_box[0] + 1, 0, lw_box[2] - 1, lw_box[3] - 2, seed=12, n=26, rmp='a_skyday', lum=.85)
    stair_base = fy(80)
    with sc.obj('stairs', baseline=stair_base):
        old = c.default_dith
        c.default_dith = .25
        for k in range(steps - 1, -1, -1):
            Z0 = 80 - 8 * (k + 1) if k < steps - 1 else 0
            Z1 = 80 - 8 * k
            Yt = 6 * (k + 1)
            p.box(c, sX0, sX1, 0, Yt, Z0, Z1, 'a_mahog', front=.44, top=.62, side=.36)
            tz0 = Z0 if k < steps - 1 else Z1 - 12
            c.poly(p.quad([(48, Yt + .05, tz0), (76, Yt + .05, tz0), (76, Yt + .05, Z1), (48, Yt + .05, Z1)]), 'red', .64)
            c.poly(p.quad([(48, Yt - 6, Z1 + .05), (76, Yt - 6, Z1 + .05), (76, Yt, Z1 + .05), (48, Yt, Z1 + .05)]), 'red',
                   .46)
            a_, b_ = P(48, Yt - 6, Z1 + .1), P(76, Yt - 6, Z1 + .1)
            c.hline(a_[0], b_[0] + 1, a_[1] - 1, 'brass', .85)
            a_, b_ = P(48, Yt, Z1 + .1), P(76, Yt, Z1 + .1)
            c.hline(a_[0], b_[0] + 1, a_[1], 'red', .8)
            for X in (50, 74):
                a_, b_ = P(X, Yt, tz0), P(X, Yt, Z1)
                c.line(a_[0], a_[1], b_[0], b_[1], 'gold', .55)
            for (xa, xb) in ((sX0, 48), (76, sX1)):
                a_, b_ = P(xa, Yt, Z1), P(xb, Yt, Z1)
                c.hline(a_[0], b_[0], a_[1], 'a_mahog', .78)
        c.default_dith = old
        # closed stringer on the open side: moulding following the slope + a sunk panel
        for d, l in ((0, .7), (1, .5), (4, .28)):
            a_, b_ = P(sX1, 5 - d, 80), P(sX1, 6 * steps - d, 6)
            c.line(a_[0], a_[1], b_[0], b_[1], 'a_mahog', l)
        # balustrade: cream balusters, mahogany rail
        rail = lambda Z: 26.5 + (78 - Z) * (82 - 26.5) / (78 - 4)
        for k in range(steps):
            Yt = 6 * (k + 1)
            for Zb in (80 - 8 * k - 2.2, 80 - 8 * k - 6):
                if Zb > 77:
                    continue
                a_ = P(sX1 - 1, Yt, Zb)
                b_ = P(sX1 - 1, rail(Zb), Zb)
                c.line(a_[0], a_[1], b_[0], b_[1], 'cream', .72)
                c.put(a_[0], a_[1] - 1, 'cream', .9)
                c.put(a_[0], (a_[1] + b_[1]) // 2, 'cream', .5)
        for d, l in ((-1, .82), (0, .58), (1, .4), (2, .28)):
            a_ = P(sX1 - 1, rail(78) - d, 78)
            b_ = P(sX1 - 1, rail(2) - d, 2)
            c.line(a_[0], a_[1], b_[0], b_[1], 'a_mahog', l)
        # newel post with a brass ball
        A.box(c, p, sX1 - 4, sX1 + 2, 0, 30, 76, 82, 'a_mahog', .56, top=.72, side=.42)
        A.box(c, p, sX1 - 5, sX1 + 3, 28, 31, 75, 83, 'a_mahog', .66, top=.82, side=.5)
        nx, ny = P(sX1 - 1, 31, 79)
        c.ellipse(nx, ny - 2, 2.7, 2.7, 'brass', .7, dith=0)
        c.put(nx - 1, ny - 3, 'brass', 1.0)
        c.put(nx, ny - 4, 'brass', .9)
        fx_, fy_ = P(sX1 - 4, 22, 82)
        c.hline(fx_, fx_ + 6, fy_, 'a_mahog', .35)
        c.hline(fx_, fx_ + 6, fy_ + 12, 'a_mahog', .35)

    # =============================================== armchair, fern, painting =========
    # painting: the Bay of Sorrento, Vesuvius smoking in the distance
    def bay(a, b, cc, d):
        c.rect(a, b, cc, d, 'dusk', vgrad(b, d, .75, .45), dith=.5)
        c.rect(a, b + (d - b) * 2 // 3, cc, d, 'water', .55, dith=.5)
        c.poly([(a + 6, b + 13), (a + 14, b + 6), (a + 22, b + 13)], 'mauve', .55, dith=.2)
        c.put(a + 14, b + 4, 'fog', .7)
        c.put(a + 15, b + 3, 'fog', .6)
        c.poly([(cc - 12, d - 6), (cc, d - 9), (cc, d - 4), (cc - 10, d - 3)], 'sage', .45, dith=.3)
        c.rect(cc - 7, d - 9, cc - 5, d - 6, 'cream', .7)
        for k in range(a + 2, cc - 2, 4):
            c.put(k, b + (d - b) * 2 // 3 + 2, 'white', .6)
    F.picture_frame(c, 148, 22, 184, 46, frame='gold', inner=bay)
    c.hline(148, 184, 46, 'a_damask', .25)
    ach_y = fy(14)
    with sc.obj('armchair_o', baseline=ach_y):
        A.wingback_chair(c, 163, ach_y, w=26, rmp='sage', lum=.48)
    # side table with ashtray and a pulp magazine left behind
    stx, sty = 144, fy(12)
    c.rect(stx - 5, sty - 13, stx + 5, sty - 11, 'a_walnut', .55, dith=0)
    c.hline(stx - 5, stx + 5, sty - 13, 'a_walnut', .72)
    c.vline(stx, sty - 11, sty, 'a_walnut', .45)
    c.hline(stx - 3, stx + 3, sty - 1, 'a_walnut', .4)
    A.ashtray(c, stx + 1, sty - 14, butts=2)
    # brass spittoon beside the armchair - tired grandeur
    spx, spy = P(138, 0, 22)
    c.ellipse(spx, spy - 2, 3.4, 2.4, 'brass', vgrad(spy - 5, spy, .75, .4), dith=0)
    c.ellipse(spx, spy - 4, 2.6, .9, 'brass', .85, dith=0)
    c.ellipse(spx, spy - 4, 1.4, .5, 'black', .2, dith=0)
    c.put(spx - 2, spy - 3, 'brass', 1.0)
    # umbrella stand left of the door, one forgotten umbrella
    usx, usy = P(90, 0, 10)
    c.rect(usx - 3, usy - 9, usx + 3, usy, 'a_iron', hgrad(usx - 3, usx + 3, .55, .35), dith=0)
    c.hline(usx - 3, usx + 3, usy - 9, 'a_iron', .7)
    c.line(usx - 1, usy - 9, usx - 3, usy - 21, 'black', .35)
    c.poly([(usx - 1, usy - 10), (usx + 1, usy - 10), (usx - 1, usy - 19), (usx - 3, usy - 19)], 'red', .4, dith=0)
    c.line(usx + 1, usy - 9, usx + 2, usy - 17, 'a_walnut', .5)
    c.put(usx + 3, usy - 18, 'a_walnut', .6)
    # fern on a tall stand
    fnx, fny = 184, fy(12)
    c.rect(fnx - 3, fny - 18, fnx + 3, fny - 16, 'a_walnut', .55, dith=0)
    c.vline(fnx - 2, fny - 16, fny, 'a_walnut', .45)
    c.vline(fnx + 2, fny - 16, fny, 'a_walnut', .35)
    A.potted_fern(c, fnx, fny - 17, size=1.25, pot='brass', leaf='felt', seed=9, droop=1.2)

    # ================================================== front desk + cubbies ===========
    cub, slots = A.key_cubbies(c, 198, 34, cols=8, rows=4, cw=7, ch=8, rmp='a_mahog', lum=.48, seed=5, missing=(9,))
    # number 9's hook is empty (Rook has the key) - mark it
    for n, sx, sy in slots:
        if n == 9:
            c.put(sx + 3, sy + 2, 'brass', .9)
    # wall clock above the cubbies: twenty to six
    ckx, cky = 228, 22
    c.ellipse(ckx, cky, 7, 7, 'a_mahog', .5, dith=0)
    c.ellipse(ckx, cky, 5.6, 5.6, 'cream', .78, dith=0)
    for k in range(12):
        a = k / 12 * 2 * math.pi
        c.put(int(round(ckx + math.sin(a) * 4.5)), int(round(cky - math.cos(a) * 4.5)), 'black', .35)
    c.line(ckx, cky, ckx - 2, cky + 3, 'black', .1)       # hour hand ~5:40
    c.line(ckx, cky, ckx - 3, cky - 3, 'black', .1)       # minute hand
    c.put(ckx, cky, 'brass', .8)
    # door to the clerk's office (half hidden)
    c.rect(262, 46, 280, FLOOR, 'a_mahog', .36, dith=.2)
    c.rect(260, 43, 282, 46, 'a_mahog', .5, dith=0)
    c.hline(260, 282, 43, 'a_mahog', .7)
    A.frosted_glass(c, 265, 50, 277, 63, rmp='a_frost', lum=.5, emis=.7, hot=(271, 54, 8), seed=4)
    A.scribble(c, 267, 56, 275, 'a_bakelite', .3, seed=3)
    c.put(266, 76, 'brass', .7)
    dz0, dz1, dX0, dX1, dH = 20, 38, 184, 256, 24
    desk_base = fy(dz1) + 1
    with sc.obj('desk_o', baseline=desk_base):
        A.box(c, p, dX0 - 1, dX1 + 1, dH - 3, dH, dz0 - 1, dz1 + 1, 'a_marble', .62, top=.72, side=.5)
        A.box(c, p, dX0, dX1, 0, dH - 3, dz0, dz1, 'a_mahog', .48, side=.34)
        fx0, fy0 = P(dX0, dH - 3, dz1)
        fx1, fy1 = P(dX1, 0, dz1)
        # raised panels
        n = 4
        pw = (fx1 - fx0 - 4) / n
        for i in range(n):
            a = int(fx0 + 2 + i * pw) + 1
            b = int(fx0 + 2 + (i + 1) * pw) - 1
            c.rect(a, fy0 + 4, b, fy1 - 5, 'a_mahog', .42, dith=.2)
            c.hline(a, b, fy0 + 4, 'a_mahog', .28)
            c.vline(a, fy0 + 4, fy1 - 5, 'a_mahog', .3)
            c.hline(a, b, fy1 - 6, 'a_mahog', .64)
            c.vline(b - 1, fy0 + 4, fy1 - 5, 'a_mahog', .58)
            c.rect(a + 3, fy0 + 7, b - 3, fy1 - 8, 'a_mahog', .5, dith=.2)
        c.rect(fx0, fy1 - 3, fx1, fy1, 'a_mahog', .3, dith=0)
        c.hline(fx0, fx1, fy1 - 3, 'a_mahog', .58)
        a, b = P(dX0 - 1, dH, dz1 + 1), P(dX1 + 1, dH, dz1 + 1)
        c.hline(a[0], b[0], a[1], 'a_marble', .88)
        # brass trim strip
        c.hline(fx0, fx1, fy0 + 2, 'brass', .6)
    with sc.obj('desk_items', baseline=desk_base):
        # on the desk: banker's lamp, register, bell, pen stand, pulp magazine, card
        lampx, lampy = P(194, dH, 26)
        A.banker_lamp(c, lampx, lampy, on=True, w=15)
        regx, regy = P(222, dH, 36)
        A.open_book(c, regx, regy, w=16, h=5, tilt=0)
        c.line(regx + 9, regy - 2, regx + 13, regy - 6, 'black', .4)          # pen on a chain
        belx, bely = P(240, dH, 35)
        A.desk_bell(c, belx, bely)
        pmx, pmy = P(248, dH, 28)
        c.poly([(pmx - 4, pmy), (pmx + 4, pmy - 1), (pmx + 5, pmy - 4), (pmx - 3, pmy - 3)], 'gold', .7, dith=0)
        c.poly([(pmx - 2, pmy - 1), (pmx + 2, pmy - 2), (pmx + 2, pmy - 3), (pmx - 2, pmy - 2)], 'red', .6, dith=0)
        c.rect(*P(206, dH, 34), *(np.array(P(206, dH, 34)) + (5, 1)), 'paper', .8)
        c.put(P(206, dH, 34)[0] + 1, P(206, dH, 34)[1] - 1, 'paper', .7)

    # ======================================================== phone booth ==============
    bz0, bz1, bX0, bX1, bH = 52, 82, 252, 284, 48
    booth_base = fy(bz1) + 1
    with sc.obj('phone_booth_o', baseline=booth_base):
        bt = A.phone_booth(c, p, bX0, bX1, bz0, bz1, bH, rmp='a_mahog', lum=.5, light=True)

    # ======================================================== chandelier + fan =========
    chx, chy = 132, 20
    bulbs = A.chandelier(c, chx, chy, arms=5, span=22, drop=20, lit=(1, 0, 1, 1, 0))
    fanx, fany = 262, 9
    c.rect(fanx, 0, fanx + 1, fany - 2, 'brass', .45)
    c.rect(fanx - 3, fany - 3, fanx + 4, fany, 'brass', .5, dith=0)
    c.hline(fanx - 3, fanx + 4, fany - 3, 'brass', .75)

    # ============================================================ lighting =============
    c.ambient = .42
    c.add_light(chx, chy - 4, 105, .34, falloff=1.25)                    # dim chandelier
    c.add_light(lampx, lampy - 9, 80, .72, falloff=1.45)                # banker's lamp
    c.add_light(lampx + 20, lampy + 4, 60, .3, ystretch=2.0)
    c.add_light(118, 70, 60, .28, falloff=1.2)                           # street through the door
    c.add_light(118, 104, 46, .4, ystretch=2.6)                          # neon pool on the marble
    c.add_light(bt[4][0] + 10, bt[4][1] + 4, 40, .4, falloff=1.4)        # booth dome light
    c.add_light(75, 16, 30, .25)                                         # upstairs sconce
    c.add_light(84, 36, 40, .3)                                          # lit sconce by the door
    for bx, by, on in bulbs:
        if on:
            c.glow(bx, by, 7, '#ffd890', .5)
    c.glow(chx, chy - 6, 30, '#ffb860', .2)
    c.glow(lampx, lampy - 11, 22, '#ffcf73', .55)
    c.glow(lampx, lampy - 13, 8, '#4dff95', .25)
    c.glow(dx1 - 5, dy0 + 11, 16, '#ff2b45', .55)
    c.glow(118, 36, 30, '#9fb8ff', .18)
    c.glow(bt[4][0] + 10, bt[4][1] + 2, 12, '#ffd28a', .35)
    # neon reflection on the wet marble in front of the door: tinted pool + streaks
    xx, yy = A.grid(c)
    own = c.owner
    ids = {r['name']: r['id'] for r in sc.objects}
    floor_m = own == ids['_floor']
    fld = np.clip(1 - np.sqrt(((xx - 122) / 34) ** 2 + ((yy - 100) / 11) ** 2), 0, 1) ** .8
    pool = floor_m & A.dither_field(fld * 1.9)
    streak = floor_m & (np.abs(xx - (dx1 - 5)) < 2) & (yy < 114) & (yy > FLOOR) & A.dither_field(
        np.clip(1.2 - (yy - FLOOR) / 22, 0, 1))
    A.tint_mask(c, pool | streak, 'neon', NEON, k=.6, lift=.25)
    c.extra[streak] += .35
    refl = floor_m & (np.abs(xx - 118) < 16) & (yy > FLOOR) & (yy < FLOOR + 14)
    c.extra[refl] += .12 * (1 - (yy[refl] - FLOOR) / 14)
    # furniture shadows
    c.shadow_poly(p.quad([(dX0 - 4, 0, dz0), (dX1 + 4, 0, dz0), (dX1 + 6, 0, dz1 + 6), (dX0 - 6, 0, dz1 + 6)]), .5)
    c.shadow_ellipse(163, ach_y + 1, 16, 3.5, .45)
    c.shadow_poly(p.quad([(bX0 - 3, 0, bz0), (bX1, 0, bz0), (bX1, 0, bz1 + 5), (bX0 - 6, 0, bz1 + 5)]), .45)
    c.shadow_poly(p.quad([(sX1, 0, 0), (sX1 + 8, 0, 0), (sX1 + 8, 0, 80), (sX1, 0, 82)]), .35)
    c.shade *= np.clip(1.2 - np.abs(np.arange(W)[None, :] - 165) / 230.0, .7, 1)
    c.shade *= np.clip(1.0 - (np.arange(H)[:, None] - 112) / 34.0 * .3, .7, 1)

    # ================================================== interaction geometry ==========
    stair_poly = [P(sX0, 0, 82), P(sX1 + 3, 0, 82), P(sX1 + 2, 36, 81), P(sX1, 6 * steps + 30, 4), P(sX1, 6 * steps + 40, 0),
                  P(sX0, 6 * steps + 40, 0)]
    sc.hotspot('fan', rect=(fanx - 30, 0, fanx + 31, 18), walk=(258, 118), face='up')

    fl = p.quad([(42, 0, 4), (282, 0, 4), (282, 0, zf), (42, 0, zf)])
    sc.hotspot('exit_stairs', poly=[(max(0, x), max(0, y)) for x, y in stair_poly], walk=(44, 138), face='up')
    sc.hotspot('exit_street', rect=(dx0 - 4, 27, dx1 + 4, FLOOR), walk=(118, 98), face='up')
    sc.hotspot('cubbies', rect=cub, walk=(214, 116), face='up')
    sc.hotspot('armchair', rect=(149, ach_y - 31, 176, ach_y + 1), walk=(162, 108), face='up')
    sc.hotspot('fern', rect=(fnx - 9, fny - 36, fnx + 6, fny - 14), walk=(186, 110), face='up')
    sc.hotspot('desk', rect=(fx0 - 1, int(p.P(0, dH, dz0)[1]) - 1, fx1 + 1, fy1), walk=(222, 116), face='up')
    sc.hotspot('register', rect=(regx - 9, regy - 7, regx + 14, regy + 1), walk=(222, 116), face='up')
    sc.hotspot('bell', rect=(belx - 4, bely - 6, belx + 4, bely + 1), walk=(238, 116), face='up')
    sc.hotspot('phone_booth', rect=(int(p.P(bX0, 0, bz0)[0]), bt[1] - 4, bt[2] + 1, bt[3]), walk=(292, 138), face='up')
    fp = lambda X0, X1, Z0, Z1: [(int(x), int(y)) for x, y in p.quad([(X0, 0, Z0), (X1, 0, Z0), (X1, 0, Z1), (X0, 0, Z1)])]
    holes = [fp(30, 94, -2, 84),                       # staircase
             fp(dX0 - 6, dX1 + 6, -2, dz1 + 4),        # desk + clerk's side
             fp(136, 196, -2, 24),                     # armchair, side table, fern
             fp(bX0 - 6, 290, bz0 - 4, bz1 + 4),       # phone booth
             fp(255, 290, -2, 30)]                     # office door corner
    sc.walkable([(int(x), int(y)) for x, y in fl], holes=holes)
    sc.point('start', 46, 138, 'right')
    sc.point('from_stairs', 46, 138, 'right')
    sc.point('from_map', 118, 100, 'down')
    sc.point('pettibone_spot', 224, 95, 'down')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, p.char_scale(FLOOR, 140), 140, 1.0)
    sc.meta['floor'] = 'tile'

    # ================================================================ anims ============
    sc.anim('neon', A.owner_dim_frames(door_neon_oid, [1, 1, 1, 1, 1, 1, 1, .35, 1, .15, 1, 1, 1, 1]), fps=8, depth=1)
    sc.anim('fan', A.fan_frames(fanx + .5, fany + 1, R=27, ry=.34, blades=4, frames=4, ramp_name='oak', lum=.62),
            fps=6, depth=200)
    sc.rain(dx0 + 3, dy0 + 3, dx1 - 3, dy0 + 28, kind='window')
    sc.rain(lw_box[0], 0, lw_box[2], lw_box[3], kind='window')
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
