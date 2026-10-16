"""Hask's Lock & Key - ground floor of 14 Marrow St. Evening rain, warm and cluttered."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad
from scene import Scene
from persp import Persp, plank_floor
import props_a as A

W, H = 320, 144
FLOOR = 94


def build():
    sc = Scene('hask_shop', W, H, seed=41)
    c = sc.c
    p = Persp(32, 284, 0, FLOOR, horizon=-56, depth=380)
    zf = p.z_at_floor_y(H + 2)
    P = lambda X, Y, Z: A.P(p, X, Y, Z)
    fy = lambda Z: int(p.P(0, 0, Z)[1])

    # ================================================================ shell ===========
    wall_fn = A.plaster(c, 0, 0, W, FLOOR, 'trench', base=.5, seed=9, stain=.07, top_dark=20, top_amt=.16)
    with sc.obj('_backwall'):
        c.rect(32, 0, 284, FLOOR, 'trench', wall_fn, dith=.5)
    with sc.obj('_lwall'):
        c.poly(A.side_quad(p, 32, 0, 160, 0, zf), 'trench', lambda xx, yy: wall_fn(xx, yy) - .08, dith=.5)
    with sc.obj('_rwall'):
        c.poly(A.side_quad(p, 284, 0, 160, 0, zf), 'trench', lambda xx, yy: wall_fn(xx, yy) - .06, dith=.5)
    c.rect(32, 0, 284, 4, 'a_walnut', .4, dith=0)
    c.hline(32, 284, 4, 'a_walnut', .6)
    for X in (32, 284):
        a, b = p.P(X, FLOOR - 4, 0), p.P(X, FLOOR - 4, zf)
        c.line(a[0], a[1], b[0], b[1], 'a_walnut', .5)
    # beadboard wainscot
    c.rect(32, 66, 284, FLOOR, 'oak', .42, dith=.2)
    for x in range(33, 284, 3):
        c.vline(x, 67, FLOOR - 4, 'oak', .3)
    c.rect(32, 64, 284, 67, 'oak', .55, dith=0)
    c.hline(32, 284, 64, 'oak', .75)
    c.rect(32, FLOOR - 4, 284, FLOOR, 'a_walnut', .35, dith=0)
    A.wainscot_side(c, p, 32, zf, h=28, rmp='oak', lum=.38, panel=400)
    A.wainscot_side(c, p, 284, zf, h=28, rmp='oak', lum=.4, panel=400)
    A.water_stain(c, 200, 6, 16, 6, .16, .1)
    with sc.obj('_floor'):
        plank_floor(c, p, 32, 284, 0, zf, 'oak', base=.46, plank_w=10, seed=7, gap_lum=.2, var=.09)
    # a worn path in front of the counter
    c.modulate(40, 112, 270, 146, lambda xx, yy: 1 + .1 * np.clip(1 - np.abs(yy - 122) / 14, 0, 1))

    # ribbed rubber mat worn in front of the counter, and rain tracked in from the street
    mq = p.quad([(84, .1, 47), (236, .1, 47), (236, .1, 60), (84, .1, 60)])
    c.poly(mq, 'a_iron', .42, dith=.3)
    for Z in range(48, 60, 2):
        a_, b_ = P(85, 0, Z), P(235, 0, Z)
        c.line(a_[0], a_[1], b_[0], b_[1], 'a_iron', .3)
    a_, b_ = P(84, 0, 60), P(236, 0, 60)
    c.line(a_[0], a_[1], b_[0], b_[1], 'a_iron', .6)
    pq = []
    for k in range(20):
        t = k / 20 * 2 * math.pi
        rr = 1 + .2 * math.sin(t * 3)
        pq.append((52 + 9 * rr * math.cos(t), .12, 60 + 5 * rr * math.sin(t)))
    c.poly(p.quad(pq), 'water', .38, emis=.2, dith=.3)
    for (X, Z) in ((48, 58), (55, 61), (50, 63)):
        x_, y_ = P(X, 0, Z)
        c.hline(x_, x_ + 2, y_, 'glass', .75, emis=.3)
    for (X, Z) in ((64, 66), (74, 70), (86, 72)):
        x_, y_ = P(X, 0, Z)
        c.put(x_, y_, 'water', .5)
        c.put(x_ + 1, y_, 'water', .45)

    # ======================================================== shop window ===========
    wx0, wy0, wx1, wy1 = 40, 12, 132, 62
    with sc.obj('_window'):
        c.rect(wx0 - 4, wy0 - 4, wx1 + 4, wy1 + 3, 'a_walnut', .45, dith=0)
        c.hline(wx0 - 4, wx1 + 4, wy0 - 4, 'a_walnut', .7)
        # the street outside: wet, a gas lamp, the shop across the road
        c.rect(wx0, wy0, wx1, wy1, 'night', vgrad(wy0, wy1, .32, .22), emis=.8, dith=.5)
        c.rect(wx0, wy0, wx1, wy0 + 30, 'brick', vgrad(wy0, wy0 + 30, .22, .3), emis=.4, dith=.4)
        for k, lx in enumerate(range(wx0 + 6, wx1 - 8, 15)):
            lit = k in (0, 3, 4)
            c.rect(lx, wy0 + 7, lx + 5, wy0 + 15, 'lamp' if lit else 'glass', .42 if lit else .2, emis=1 if lit else .4)
            c.hline(lx, lx + 5, wy0 + 11, 'brick', .25, emis=.4)
            c.hline(lx - 1, lx + 6, wy0 + 15, 'slate', .35, emis=.4)
        c.rect(wx0, wy0 + 30, wx1, wy0 + 33, 'slate', .3, emis=.4)               # kerb
        c.rect(wx0, wy0 + 33, wx1, wy1, 'water', vgrad(wy0 + 33, wy1, .4, .25), emis=.6, dith=.5)
        for k in range(wx0 + 3, wx1 - 3, 7):
            c.hline(k, k + 3, wy0 + 38 + (k % 3) * 3, 'water', .62, emis=.7)
        # gas lamp + its reflection
        glx = wx1 - 22
        c.vline(glx, wy0 + 6, wy0 + 33, 'black', .25)
        c.rect(glx - 2, wy0 + 2, glx + 3, wy0 + 7, 'lamp', .95, emis=1)
        c.vline(glx, wy0 + 36, wy1 - 4, 'lamp', .55, emis=.8)
        c.vline(glx + 1, wy0 + 40, wy1 - 6, 'lamp', .45, emis=.8)
        # a passer-by under an umbrella
        px_ = wx0 + 26
        c.ellipse(px_, wy0 + 21, 6, 2.2, 'black', .2, emis=.3)
        c.vline(px_, wy0 + 21, wy0 + 24, 'black', .2)
        c.rect(px_ - 2, wy0 + 23, px_ + 3, wy0 + 33, 'black', .18, emis=.3)
        A.rain_streaks(c, wx0, wy0, wx1, wy1, seed=6, n=36, lum=.62, emis=.4)
        # mullion + transom bar
        c.rect(wx0, wy0 + 12, wx1, wy0 + 13, 'a_walnut', .4)
        # reversed gold lettering
        mid = (wx0 + wx1) // 2
        w1 = A.text_w("HASK'S", scale=2)
        A.text(c, mid - w1 // 2, wy0 + 16, "HASK'S", 'gold', .7, mirror=True, scale=2, outline=('a_bakelite', .2))
        w2 = A.text_w('LOCK & KEY')
        A.text(c, mid - w2 // 2, wy0 + 29, 'LOCK & KEY', 'gold', .66, mirror=True, outline=('a_bakelite', .2))
        w3 = A.text_w('SAFES - EST. 1909')
        A.text(c, mid - w3 // 2, wy0 + 37, 'SAFES - EST. 1909', 'gold', .5, mirror=True)
        c.hline(mid - 20, mid + 20, wy0 + 27, 'gold', .55)
        # window display: velvet shelf with padlocks, and a big wooden key cut-out
        c.rect(wx0, wy1 - 6, wx1, wy1, 'red', .4, dith=.3)
        c.hline(wx0, wx1, wy1 - 6, 'red', .6)
        for k, px2 in enumerate(range(wx0 + 4, wx1 - 6, 9)):
            A.padlock_icon(c, px2, wy1 - 2, 'brass' if k % 2 else 'chrome', .6, size=1 + (k % 3 == 0))
        kx0, ky0 = wx0 + 10, wy0 + 46
        c.ellipse(kx0, ky0, 4, 4, 'gold', .6, dith=0)
        c.ellipse(kx0, ky0, 1.8, 1.8, 'red', .4, dith=0)
        c.rect(kx0 + 4, ky0 - 1, kx0 + 22, ky0 + 2, 'gold', .58, dith=0)
        c.hline(kx0 + 4, kx0 + 22, ky0 - 1, 'gold', .8)
        for tx in (kx0 + 16, kx0 + 19):
            c.rect(tx, ky0 + 2, tx + 2, ky0 + 5, 'gold', .55, dith=0)
        c.rect(wx0 - 6, wy1 + 1, wx1 + 6, wy1 + 4, 'a_walnut', .55, dith=0)  # sill
        c.hline(wx0 - 6, wx1 + 6, wy1 + 1, 'a_walnut', .78)


    # ======================================================== key wall + sign ======
    kw = (142, 18, 232, 68)
    with sc.obj('_keywall'):
        A.key_wall(c, *kw, seed=4, board='oak', lum=.44)
    c.rect(150, 7, 224, 14, 'cream', .7, dith=0)
    c.hline(150, 224, 7, 'cream', .88)
    A.text(c, 187 - A.text_w('KEYS CUT WHILE-U-WAIT') // 2, 8, 'KEYS CUT WHILE-U-WAIT', 'red', .5)

    # ========================================================= back-room curtain ====
    with sc.obj('_curtain'):
        A.curtain_doorway(c, 242, 30, 276, FLOOR, rmp='red', lum=.46, gap=2)
    # little clock over the curtain (Hask fixes clocks too)
    c.ellipse(259, 20, 5, 5, 'a_walnut', .5, dith=0)
    c.ellipse(259, 20, 3.8, 3.8, 'cream', .75, dith=0)
    c.line(259, 20, 259, 17, 'black', .2)
    c.line(259, 20, 261, 21, 'black', .2)

    # ========================================================= workbench + machine ==
    bz0, bz1, bH = 2, 16, 20
    A.box(c, p, 38, 134, bH - 2, bH, bz0, bz1, 'a_walnut', .5, top=.6, side=.4)
    A.box(c, p, 39, 133, 0, bH - 2, bz0, bz1, 'a_walnut', .4, side=.3)
    tyb = int(p.P(0, bH, 10)[1])
    # key-cutting machine: green cast-iron base, carriage with two vises, tracer (left) and cutter (right)
    mx, my = 98, tyb + 1
    c.poly([(mx - 13, my), (mx + 13, my), (mx + 11, my - 6), (mx - 11, my - 6)], 'teal', vgrad(my - 6, my, .62, .42),
           dith=.2)
    c.hline(mx - 11, mx + 11, my - 6, 'teal', .82)
    c.rect(mx - 9, my - 15, mx - 4, my - 6, 'teal', hgrad(mx - 9, mx - 4, .65, .45), dith=0)      # tracer post
    c.rect(mx + 4, my - 17, mx + 10, my - 6, 'teal', hgrad(mx + 4, mx + 10, .6, .4), dith=0)      # motor housing
    c.hline(mx + 4, mx + 10, my - 17, 'teal', .85)
    c.vline(mx - 9, my - 15, my - 6, 'teal', .8)
    # carriage with two vises holding the original key and a brass blank
    c.rect(mx - 11, my - 10, mx + 11, my - 8, 'chrome', .55, dith=0)
    c.hline(mx - 11, mx + 11, my - 10, 'chrome', .85)
    for vx in (mx - 6, mx + 6):
        c.rect(vx - 2, my - 13, vx + 3, my - 10, 'chrome', .62, dith=0)
        c.put(vx, my - 13, 'chrome', .95)
    c.hline(mx - 8, mx - 3, my - 14, 'chrome', .75)          # the original key
    c.hline(mx + 4, mx + 9, my - 14, 'brass', .9)           # the blank being cut
    c.put(mx + 3, my - 14, 'brass', .7)
    # cutter wheel with guard + tracer stylus
    c.ellipse(mx + 7, my - 19, 4.6, 4.6, 'chrome', .6, dith=0)
    c.ellipse(mx + 7, my - 19, 2.4, 2.4, 'a_iron', .35, dith=0)
    for k in range(0, 360, 45):
        r_ = math.radians(k)
        c.put(int(round(mx + 7 + math.cos(r_) * 4.6)), int(round(my - 19 + math.sin(r_) * 4.6)), 'chrome', .9)
    c.poly([(mx + 2, my - 25), (mx + 12, my - 25), (mx + 13, my - 20), (mx + 2, my - 21)], 'teal', .55, dith=0)
    c.hline(mx + 2, mx + 12, my - 25, 'teal', .8)
    c.vline(mx - 7, my - 19, my - 15, 'chrome', .8)
    c.put(mx - 7, my - 20, 'brass', .9)
    # crank lever on the front + a little pile of brass filings
    c.line(mx - 2, my - 8, mx - 4, my - 3, 'chrome', .7)
    c.ellipse(mx - 4, my - 2, 1.4, 1.2, 'red', .6, dith=0)
    for k in range(5):
        c.put(mx + 3 + k, my - 1 + (k % 2), 'brass', .85 - k * .05)
    # bench vise, tools on the bench, parts drawers
    c.rect(56, tyb - 5, 64, tyb, 'a_iron', .5, dith=0)
    c.rect(54, tyb - 7, 66, tyb - 5, 'a_iron', .6, dith=0)
    c.line(60, tyb - 7, 60, tyb - 11, 'chrome', .6)
    for k in range(5):
        c.rect(112 + k * 4, tyb - 8, 115 + k * 4, tyb, 'a_walnut', .5, dith=0)
        c.put(113 + k * 4, tyb - 5, 'brass', .8)
        c.put(113 + k * 4, tyb - 2, 'brass', .7)
    c.line(44, tyb - 1, 50, tyb - 3, 'chrome', .6)                 # file
    c.line(70, tyb - 1, 76, tyb - 1, 'red', .5)                     # screwdriver
    c.put(77, tyb - 1, 'chrome', .7)
    # gooseneck lamp clamped to the bench
    glx, gly = 80, tyb
    c.line(glx, gly, glx + 2, gly - 14, 'a_iron', .5)
    c.line(glx + 2, gly - 14, glx - 3, gly - 20, 'a_iron', .5)
    c.poly([(glx - 9, gly - 19), (glx - 3, gly - 23), (glx, gly - 19), (glx - 5, gly - 16)], 'a_bank', .5, dith=0)
    c.line(glx - 8, gly - 17, glx - 4, gly - 16, 'lamp', 1.0, emis=1)
    blamp = (glx - 6, gly - 15)

    # ========================================================== the counter =========
    cz0, cz1, cX0, cX1, cH = 28, 42, 64, 248, 22
    gX1 = 128                                     # glass padlock section ends here
    counter_base = fy(cz1) + 1
    # Hask's stool behind the counter
    sx_, sy_ = P(206, 0, 18)
    c.rect(sx_ - 4, sy_ - 13, sx_ + 4, sy_ - 11, 'a_walnut', .55, dith=0)
    for lx in (sx_ - 3, sx_ + 3):
        c.vline(lx, sy_ - 11, sy_, 'a_walnut', .4)
    with sc.obj('counter_o', baseline=counter_base):
        # glass display section (padlocks)
        A.box(c, p, cX0, gX1, 0, 6, cz0, cz1, 'a_walnut', .4, side=.3)
        A.box(c, p, cX0, gX1, 6, cH, cz0, cz1, 'glass', .3, top=.42, side=.26)
        gx0, gy0 = P(cX0, cH, cz1)
        gx1, gy1 = P(gX1, 6, cz1)
        c.rect(gx0 + 1, gy0 + 1, gx1 - 1, gy1, 'a_walnut', .2, dith=.3)      # interior
        c.hline(gx0 + 1, gx1 - 1, (gy0 + gy1) // 2 + 1, 'glass', .55)        # glass shelf
        rng = np.random.default_rng(3)
        for row, yy in enumerate(((gy0 + gy1) // 2, gy1 - 1)):
            x = gx0 + 3
            while x < gx1 - 6:
                sz = int(rng.integers(1, 3))
                A.padlock_icon(c, x, yy, ['brass', 'chrome', 'gold', 'a_iron'][int(rng.integers(0, 4))],
                               .55 + rng.random() * .2, size=sz)
                x += 5 + sz + int(rng.integers(0, 3))
        for k in range(3):
            c.put(gx0 + 3 + k, gy0 + 6 - k, 'white', .8, emis=.3)
            c.put(gx0 + 30 + k, gy0 + 6 - k, 'white', .6, emis=.3)
        c.rect(gx0, gy0, gx1, gy0 + 1, 'a_walnut', .55)
        c.vline(gx0, gy0, gy1 + 6, 'a_walnut', .55)
        c.vline(gx1 - 1, gy0, gy1 + 6, 'a_walnut', .4)
        # wooden section
        A.box(c, p, gX1, cX1 + 1, cH - 2, cH, cz0 - 1, cz1 + 1, 'oak', .55, top=.66, side=.42)
        A.box(c, p, gX1, cX1, 0, cH - 2, cz0, cz1, 'oak', .45, side=.32)
        fx0, fy0 = P(gX1, cH - 2, cz1)
        fx1, fy1 = P(cX1, 0, cz1)
        n = 5
        pw = (fx1 - fx0 - 4) / n
        for i in range(n):
            a = int(fx0 + 2 + i * pw) + 1
            b = int(fx0 + 2 + (i + 1) * pw) - 1
            c.rect(a, fy0 + 3, b, fy1 - 4, 'oak', .4, dith=.2)
            c.hline(a, b, fy0 + 3, 'oak', .28)
            c.vline(a, fy0 + 3, fy1 - 4, 'oak', .3)
            c.hline(a, b, fy1 - 5, 'oak', .6)
            c.vline(b - 1, fy0 + 3, fy1 - 4, 'oak', .56)
        c.rect(fx0, fy1 - 3, fx1, fy1, 'a_walnut', .32, dith=0)
        a, b = P(gX1, cH, cz1 + 1), P(cX1 + 1, cH, cz1 + 1)
        c.hline(a[0], b[0], a[1], 'oak', .85)
    with sc.obj('counter_items', baseline=counter_base):
        # on the counter: cash register, a dish of keys, the ledger, the cat
        regx, regy = P(222, cH, 33)
        A.cash_register(c, regx, regy, w=22, h=19)
        dkx, dky = P(150, cH, 37)
        c.ellipse(dkx, dky, 5, 1.6, 'chrome', .55, dith=0)
        for k in range(5):
            c.put(dkx - 3 + k * 2, dky - 1, 'brass', .8)
            c.put(dkx - 2 + k * 2, dky - 1, 'chrome', .75)
        ldx, ldy = P(172, cH, 38)
        A.open_book(c, ldx, ldy, w=14, h=4)
        c.line(ldx + 8, ldy - 1, ldx + 11, ldy - 4, 'black', .4)
        # the shop cat asleep on the counter
        ctx, cty = P(196, cH, 34)
        A.sleeping_cat(c, ctx, cty, facing=-1)
    # pendant lamp over the counter
    plx, ply = 168, 26
    A.lamp_shade_pendant(c, plx, ply, w=16, h=6, rmp='a_bank', on=True, cord_top=0)

    # ======================================================== street door (left wall)
    dz0, dz1 = 40, 72
    with sc.obj('_streetdoor'):
        c.poly(A.side_quad(p, 32, 0, 50, dz0 - 3, dz1 + 3), 'a_walnut', .4, dith=0)
        c.poly(A.side_quad(p, 32, 0, 47, dz0, dz1), 'a_walnut', .5, dith=.2)
        gq = A.side_quad(p, 32, 20, 43, dz0 + 3, dz1 - 3)
        c.poly(gq, 'night', vgrad(50, 110, .35, .22), emis=.8, dith=.5)
        gxs = [x for x, _ in gq]
        gys = [y for _, y in gq]
        A.rain_streaks(c, int(min(gxs)) + 1, int(min(gys)) + 2, int(max(gxs)), int(max(gys)) - 2, seed=3, n=10)
        # CLOSED/OPEN card hanging on its string (we see the CLOSED side)
        a_ = P(32, 36, (dz0 + dz1) / 2 - 4)
        b_ = P(32, 30, (dz0 + dz1) / 2 + 4)
        c.poly([a_, (b_[0], a_[1] + 1), b_, (a_[0], b_[1] - 1)], 'cream', .75, dith=0)
        c.line(a_[0] + 1, a_[1] - 1, (a_[0] + b_[0]) // 2, a_[1] - 5, 'black', .4)
        c.line(b_[0] - 1, a_[1], (a_[0] + b_[0]) // 2, a_[1] - 5, 'black', .4)
        c.put((a_[0] + b_[0]) // 2, (a_[1] + b_[1]) // 2, 'red', .5)
        kx_, ky_ = P(32, 22, dz1 - 4)
        c.put(kx_, ky_, 'brass', .9)
        c.put(kx_, ky_ + 1, 'brass', .6)
        # shop bell on a spring above the door
        bx_, by_ = P(32, 52, dz0 + 6)
        c.line(bx_, by_, bx_ + 3, by_ + 3, 'brass', .6)
        c.ellipse(bx_ + 3, by_ + 5, 2, 2, 'brass', .7, dith=0)
        c.put(bx_ + 2, by_ + 4, 'brass', 1.0)
        # door mat
        c.poly(p.quad([(33, .1, dz0 + 2), (46, .1, dz0 + 2), (46, .1, dz1 - 2), (33, .1, dz1 - 2)]), 'trench', .3, dith=.5)

    # ===================================================== stairs up (right wall) ====
    uz0, uz1 = 42, 66
    with sc.obj('_stairsup'):
        c.poly(A.side_quad(p, 284, 0, 50, uz0 - 3, uz1 + 3), 'a_walnut', .42, dith=0)
        q = A.side_quad(p, 284, 0, 46, uz0, uz1)
        ys = [y for _, y in q]
        c.poly(q, 'cream', vgrad(min(ys), max(ys), .62, .3), emis=.5, dith=.5)
        # steps rising away: risers as light bands, getting higher toward the back
        for k in range(7):
            Yk = 3 + k * 5
            a_, b_ = P(284, Yk, uz1 - 1), P(284, Yk, uz1 - 1 - (k + 1) * 3)
            c.line(a_[0], a_[1], b_[0], b_[1], 'a_walnut', .5 - k * .03)
            a2, b2 = P(284, Yk - 1, uz1 - 1), P(284, Yk - 1, uz1 - 1 - (k + 1) * 3)
            c.line(a2[0], a2[1], b2[0], b2[1], 'a_walnut', .3)
        a_, b_ = P(284, 22, uz1 - 1), P(284, 46, uz0 + 1)
        c.line(a_[0], a_[1], b_[0], b_[1], 'a_walnut', .35)
        # little enamel sign: OFFICES with an arrow
        s0, s1 = P(284, 58, uz0 + 2), P(284, 52, uz1 - 2)
        c.poly([s0, (s1[0], s0[1] + 2), s1, (s0[0], s1[1] - 2)], 'night', .5, dith=0)
        c.line(s0[0] + 1, (s0[1] + s1[1]) // 2, s1[0] - 1, (s0[1] + s1[1]) // 2 + 1, 'cream', .8)

    # stock shelf on the right wall above the stair door: boxed locks, a coil of chain
    for Y in (60, 74):
        q = p.quad([(284, Y, 30), (276, Y, 30), (276, Y, 70), (284, Y, 70)])
        c.poly(q, 'a_walnut', .55, dith=0)
        a_, b_ = P(276, Y, 30), P(276, Y, 70)
        c.line(a_[0], a_[1], b_[0], b_[1], 'a_walnut', .75)
        for k, Z in enumerate(range(33, 68, 6)):
            bx0_, by0_ = P(280, Y + 6 + (k % 2) * 2, Z)
            bx1_, by1_ = P(280, Y, Z + 4)
            c.rect(min(bx0_, bx1_), by0_, max(bx0_, bx1_) + 1, by1_, ['red', 'trench', 'cream', 'night'][k % 4],
                   .5 + (k % 3) * .06, dith=0)
    cx_, cy_ = P(280, 76, 52)
    c.ellipse(cx_, cy_ - 2, 3, 2, 'chrome', .55, dith=0)
    c.ellipse(cx_, cy_ - 2, 1.5, 1, 'a_iron', .3, dith=0)

    # ========================================================= display safe =========
    sfX0, sfX1, sfz0, sfz1, sfH = 250, 280, 6, 28, 30
    with sc.obj('safe_o', baseline=fy(sfz1) + 1):
        A.box(c, p, sfX0 - 1, sfX1 + 1, 0, 3, sfz0 - 1, sfz1 + 1, 'a_walnut', .4, top=.55, side=.3)   # plinth
        sr = A.ornate_safe(c, p, sfX0, sfX1, sfz0, sfz1, sfH, rmp='teal', lum=.5, name='HASK')
        fx0, fy0, fx1, fy1 = sr
        # price card on a string
        c.line(fx1 - 3, fy0 + 2, fx1 + 1, fy0 + 6, 'black', .4)
        c.rect(fx1 - 1, fy0 + 6, fx1 + 9, fy0 + 12, 'paper', .85, dith=0)
        A.text(c, fx1, fy0 + 7, '$40', 'red', .5)
    # ============================================================== lighting ========
    c.ambient = .44
    c.add_light(plx, ply + 8, 140, .62, falloff=1.3)                     # pendant over the counter
    c.add_light(plx, ply + 70, 70, .25, ystretch=1.8)
    c.add_light(blamp[0], blamp[1] + 2, 60, .5, falloff=1.5)            # bench lamp
    c.add_light(86, 40, 70, .2, falloff=1.2)                             # cold street light
    c.add_light(259, 70, 40, .25, falloff=1.4)                           # back room through the curtain
    c.add_light(305, 80, 40, .2)                                         # stairwell bulb
    c.glow(plx, ply + 1, 26, '#ffd27a', .5)
    c.glow(blamp[0], blamp[1], 14, '#ffd27a', .45)
    c.glow(wx1 - 22, wy0 + 4, 10, '#ffdca0', .5)
    c.glow(86, 38, 50, '#6f8fd0', .18)
    c.glow(259, 60, 14, '#ffb050', .3)
    c.shadow_poly(p.quad([(cX0 - 3, 0, cz0), (cX1 + 3, 0, cz0), (cX1 + 4, 0, cz1 + 6), (cX0 - 4, 0, cz1 + 6)]), .5)
    c.shadow_poly(p.quad([(sfX0 - 3, 0, sfz0 - 2), (sfX1 + 2, 0, sfz0 - 2), (sfX1 + 4, 0, sfz1 + 5), (sfX0 - 5, 0, sfz1 + 5)]),
                  .5)
    c.shade *= np.clip(1.18 - np.abs(np.arange(W)[None, :] - 160) / 240.0, .68, 1)
    c.shade *= np.clip(1.0 - (np.arange(H)[:, None] - 118) / 28.0 * .25, .75, 1)

    # ===================================================== interaction geometry =====
    cx0_, cy0_ = P(gX1, cH, cz0)
    cx1_, cy1_ = P(cX1, 0, cz1)
    gx0_, gy0_ = P(cX0, cH, cz0)
    gx1_, gy1_ = P(gX1, 0, cz1)
    sc.hotspot('window', rect=(wx0 - 4, wy0 - 4, wx1 + 4, wy1 + 3), walk=(86, 120), face='up')

    fl = p.quad([(34, 0, cz1 + 3), (282, 0, cz1 + 3), (282, 0, zf), (34, 0, zf)])
    sc.hotspot('key_wall', rect=(kw[0] - 2, kw[1] - 12, kw[2] + 2, kw[3] + 2), walk=(186, 120), face='up')
    sc.hotspot('curtain', rect=(239, 26, 279, 84), walk=(262, 120), face='up')
    sc.hotspot('machine', rect=(mx - 14, my - 27, mx + 15, my + 1), walk=(100, 120), face='up')
    sc.hotspot('exit_street', poly=[(int(x), int(y)) for x, y in A.side_quad(p, 32, 0, 50, dz0 - 3, dz1 + 3)],
               walk=(22, 122), face='left')
    sc.hotspot('exit_upstairs', poly=[(int(x), int(y)) for x, y in A.side_quad(p, 284, 0, 50, uz0 - 3, uz1 + 3)],
               walk=(294, 120), face='right')
    sc.hotspot('counter', rect=(int(p.P(gX1, 0, cz1)[0]), cy0_ - 1, cx1_ + 1, cy1_), walk=(186, 120), face='up')
    sc.hotspot('padlock_case', rect=(int(p.P(cX0, 0, cz1)[0]) - 1, gy0_ - 1, gx1_, gy1_), walk=(96, 120), face='up')
    sc.hotspot('register', rect=(regx - 12, regy - 21, regx + 15, regy + 1), walk=(222, 120), face='up')
    sc.hotspot('safe_display', rect=(int(p.P(sfX0, 0, sfz0)[0]) - 1, fy0 - 2, fx1 + 1, fy1 + 3), walk=(274, 114),
               face='up')
    ext = p.quad([(250, 0, cz0), (282, 0, cz0), (282, 0, cz1 + 4), (250, 0, cz1 + 4)])
    fp = lambda X0, X1, Z0, Z1: [(int(x), int(y)) for x, y in p.quad([(X0, 0, Z0), (X1, 0, Z0), (X1, 0, Z1), (X0, 0, Z1)])]
    poly = [P(34, 0, cz1 + 3), P(250, 0, cz1 + 3), P(250, 0, cz0 + 2), P(282, 0, cz0 + 2), P(282, 0, zf), P(34, 0, zf)]
    sc.walkable([(int(x), int(y)) for x, y in poly], holes=[fp(sfX0 - 4, sfX1 + 4, sfz0 - 3, sfz1 + 3)])
    sc.point('start', 150, 128, 'down')
    sc.point('from_map', 24, 122, 'right')
    sc.point('from_office', 292, 120, 'left')
    sc.point('hask_spot', 186, 99, 'down')
    sc.point('nora_spot', 236, 118, 'left')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, p.char_scale(FLOOR, 140), 140, 1.0)
    sc.meta['floor'] = 'wood'

    # ================================================================ anims =========
    # the cat's tail twitches now and then
    def tail(pos):
        def fn(cc):
            x0_, y0_ = ctx + 6, cty
            pts = {0: [(x0_, y0_ - 1), (x0_ + 1, y0_ - 1), (x0_ + 2, y0_ - 1)],
                   1: [(x0_, y0_ - 1), (x0_ + 1, y0_ - 2), (x0_ + 2, y0_ - 3)],
                   2: [(x0_, y0_ - 1), (x0_ + 1, y0_ - 2), (x0_ + 1, y0_ - 3), (x0_ + 2, y0_ - 4)]}[pos]
            for (px_, py_) in pts:
                cc.put(px_, py_, 'a_ginger', .6)
            cc.put(pts[-1][0], pts[-1][1], 'a_ginger', .75)
        return fn
    sc.anim('cat_tail', [tail(k) for k in (0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0)], fps=6, depth=counter_base + 1)
    sc.rain(wx0, wy0, wx1, wy1, kind='window')
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
