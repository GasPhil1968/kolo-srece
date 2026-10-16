"""Bellwether Apartments 3B - Nora Marsh's flat (Ch1). Ransacked; grey rainy daylight + desk lamp."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, noise2
from scene import Scene
from persp import Persp, plank_floor
import furniture as F
import props_a as A

W, H = 320, 144
FLOOR = 92


def build():
    sc = Scene('nora_flat', W, H, seed=51)
    c = sc.c
    p = Persp(40, 280, 0, FLOOR, horizon=-64, depth=400)
    zf = p.z_at_floor_y(H + 2)
    P = lambda X, Y, Z: A.P(p, X, Y, Z)
    fy = lambda Z: int(p.P(0, 0, Z)[1])

    # ================================================================ shell ===========
    with sc.obj('_backwall'):
        F.wallpaper(c, 40, 0, 280, FLOOR, 'a_nora', base=.58, stripe=9, motif=True, seed=12, stain=.06)
    with sc.obj('_lwall'):
        c.poly(A.side_quad(p, 40, 0, 160, 0, zf), 'a_nora', lambda xx, yy: .5 + .03 * ((xx.astype(int) % 5) == 0), dith=.4)
    with sc.obj('_rwall'):
        c.poly(A.side_quad(p, 280, 0, 160, 0, zf), 'a_nora', lambda xx, yy: .52 + .03 * ((xx.astype(int) % 5) == 0),
               dith=.4)
    c.rect(40, 0, 280, 3, 'cream', .4, dith=0)                       # picture moulding at the ceiling
    c.hline(40, 280, 3, 'cream', .6)
    c.rect(40, FLOOR - 4, 280, FLOOR, 'cream', .48, dith=0)            # skirting
    c.hline(40, 280, FLOOR - 4, 'cream', .66)
    A.wainscot_side(c, p, 40, zf, h=4, rmp='cream', lum=.45, panel=999)
    A.wainscot_side(c, p, 280, zf, h=4, rmp='cream', lum=.48, panel=999)
    A.water_stain(c, 182, 4, 12, 5, .14, .08)
    with sc.obj('_floor'):
        plank_floor(c, p, 40, 280, 0, zf, 'oak', base=.5, plank_w=9, seed=11, gap_lum=.24, var=.08)
    # braided rag rug, kicked askew
    N = noise2(W, H, 2, 4, 1)

    def rugfn(xx, yy):
        X, _, Z = A.inv_hplane(p, xx, yy)
        d = np.sqrt(((X - 150) / 44) ** 2 + ((Z - 62) / 17) ** 2)
        ring = np.floor(d * 7) % 3
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        return .46 + ring * .09 + (N[yi, xi] - .5) * .08
    rug_m = []
    for k in range(40):
        a = k / 40 * 2 * math.pi
        rug_m.append((150 + 44 * math.cos(a) + (6 if math.cos(a) > .6 and math.sin(a) > 0 else 0), .1,
                      62 + 17 * math.sin(a)))
    c.poly(p.quad(rug_m), 'a_damask', rugfn, dith=.3)

    # ======================================================== window + fire escape ====
    wx0, wy0, wx1, wy1 = 154, 16, 206, 68
    with sc.obj('window_o'):
        c.rect(wx0 - 4, wy0 - 4, wx1 + 4, wy1 + 3, 'cream', .55, dith=0)
        c.hline(wx0 - 4, wx1 + 4, wy0 - 4, 'cream', .75)
        # outside: grey sky strip, wet brick wall next door, the iron fire escape
        c.rect(wx0, wy0, wx1, wy1, 'a_skyday', vgrad(wy0, wy1, .78, .55), emis=.85, dith=.5)
        c.rect(wx0, wy0 + 12, wx1, wy1, 'brick', vgrad(wy0 + 12, wy1, .5, .4), emis=.55, dith=.4)
        for yy in range(wy0 + 14, wy1, 4):
            off = 0 if (yy // 4) % 2 else 3
            c.hline(wx0, wx1, yy, 'brick', .3, emis=.5)
            for xx in range(wx0 + off, wx1, 6):
                c.put(xx, yy + 1, 'brick', .32, emis=.5)
                c.put(xx, yy + 2, 'brick', .32, emis=.5)
        c.rect(wx0 + 30, wy0 + 20, wx1 - 6, wy0 + 32, 'glass', .35, emis=.5)   # neighbour's window
        c.vline(wx0 + 38, wy0 + 20, wy0 + 32, 'cream', .45, emis=.5)
        # fire escape: landing grating, railing, ladder going up
        gy = wy1 - 14
        c.rect(wx0, gy, wx1, gy + 2, 'black', .25, emis=.3)
        for xx in range(wx0, wx1, 2):
            c.put(xx, gy + 1, 'a_iron', .45, emis=.3)
        c.hline(wx0, wx1, gy - 9, 'black', .22, emis=.3)
        for xx in range(wx0 + 2, wx1, 5):
            c.vline(xx, gy - 9, gy, 'black', .22, emis=.3)
        for xx in (wx0 + 10, wx0 + 18):
            c.vline(xx, wy0, gy - 9, 'black', .2, emis=.3)
        for yy in range(wy0 + 2, gy - 9, 4):
            c.hline(wx0 + 10, wx0 + 18, yy, 'black', .2, emis=.3)
        c.rect(wx0, gy + 2, wx1, wy1, 'water', .45, emis=.4, dith=.4)            # rain water below
        A.rain_streaks(c, wx0, wy0, wx1, wy1, seed=8, n=50, rmp='a_skyday', lum=.95, emis=.5)
        # sashes: top sash fixed, bottom sash raised a crack - the intruder's way in
        mid = (wy0 + wy1) // 2
        c.rect(wx0, mid - 2, wx1, mid + 1, 'cream', .58, dith=0)
        c.hline(wx0, wx1, mid - 2, 'cream', .78)
        c.vline((wx0 + wx1) // 2, wy0, mid - 2, 'cream', .55)
        c.rect(wx0, wy1 - 6, wx1, wy1 - 4, 'cream', .6, dith=0)                 # raised sash bottom rail
        c.rect(wx0, wy1 - 4, wx1, wy1, 'a_skyday', .5, emis=.8, dith=.3)        # the open crack
        c.rect(wx0 - 6, wy1 + 1, wx1 + 6, wy1 + 4, 'cream', .66, dith=0)       # sill
        c.hline(wx0 - 6, wx1 + 6, wy1 + 1, 'cream', .85)
        for k in range(4):                                                     # rain wet on the sill
            c.put(wx0 + 6 + k * 11, wy1 + 2, 'glass', .7)
        # lace curtains, one blowing in through the gap
        F.curtain(c, wx0 - 9, wy0 - 6, wx0 + 6, wy1 + 10, 'cream', side='l', folds=2.5)
        c.poly([(wx1 - 6, wy0 - 6), (wx1 + 9, wy0 - 6), (wx1 + 9, wy1 - 6), (wx1 + 2, wy1 + 6), (wx1 - 8, wy1 + 2)],
               'cream', lambda xx, yy: .55 + np.sin(xx * 1.1) * .08, dith=.3)
        c.rect(wx0 - 12, wy0 - 8, wx1 + 12, wy0 - 6, 'brass', .6, dith=0)
        c.hline(wx0 - 12, wx1 + 12, wy0 - 8, 'brass', .85)
    # wet streak down the wall under the window
    c.modulate(wx0 + 10, wy1 + 4, wx0 + 16, FLOOR - 4, lambda xx, yy: .86 + 0 * xx)

    # Nora's calendar - the 3rd circled (the night session)
    A.calendar(c, 52, 22, month='OCT', year='1951', circle=3, first_dow=1, picture=True)
    # framed print on the left wall: a lighthouse (the lamplighter's tune)
    fq_ = A.side_quad(p, 40, 44, 66, 18, 40)
    c.poly(fq_, 'a_walnut', .5, dith=0)
    iq_ = A.side_quad(p, 40, 46, 64, 20.5, 37.5)
    c.poly(iq_, 'night', vgrad(28, 52, .55, .35), dith=.3)
    sq_ = A.side_quad(p, 40, 46, 50, 20.5, 37.5)
    c.poly(sq_, 'water', .5, dith=0)
    a_, b_ = P(40, 50, 29), P(40, 60, 29)
    c.line(a_[0], a_[1], b_[0], b_[1], 'cream', .8)
    c.put(*P(40, 61, 29), 'lamp', 1.0)
    a_, b_ = P(40, 61, 29), P(40, 59, 35)
    c.line(a_[0], a_[1], b_[0], b_[1], 'lamp', .6)
    # ceiling light: frosted bowl on three chains (off - it's daytime)
    c.vline(170, 0, 4, 'brass', .5)
    for dx in (-4, 0, 4):
        c.line(170, 4, 170 + dx, 8, 'brass', .45)
    c.ellipse(170, 9, 6, 2.4, 'cream', vgrad(7, 11, .75, .5), dith=.2)
    c.put(170, 12, 'brass', .6)

    # ========================================================= bed (left) ============
    bX0, bX1, bz1 = 42, 80, 58
    with sc.obj('bed_o', baseline=fy(bz1) + 1):
        F.iron_bed(c, p, bX0, bX1, 0, bz1, frame='cream', sheet='paper', blanket='sage', seed=6)
        # ransacked: blanket dragged off the side, pillow slit, feathers
        q = p.quad([(bX1 - 2, 17, 18), (bX1 + 4, 8, 20), (bX1 + 6, 0, 30), (bX1 + 5, 0, 48), (bX1 - 2, 17, 46)])
        c.poly(q, 'sage', lambda xx, yy: .48 + np.sin(xx * .9 + yy * .4) * .07, dith=.3)
        pl = P(56, 22, 8)
        c.ellipse(pl[0], pl[1], 6, 2, 'paper', .85, dith=0)
        c.line(pl[0] - 3, pl[1], pl[0] + 3, pl[1] - 1, 'paper', .5)
        rng = np.random.default_rng(4)
        for k in range(10):
            fx_, fy_ = P(rng.uniform(46, 96), 0 if k > 4 else 18, rng.uniform(8, 70))
            c.put(fx_, fy_, 'white', .85)

    # ============================================== dressing table + oval mirror ======
    dX0, dX1, dzz, dHt = 86, 116, 12, 18
    with sc.obj('dresser_o'):
        c.ellipse(101, 40, 9, 12, 'cream', .6, dith=0)
        c.ellipse(101, 40, 7.6, 10.6, 'glass', vgrad(28, 52, .62, .35), emis=.35, dith=.4)
        c.line(97, 46, 103, 32, 'glass', .85, emis=.4)
        c.line(98, 48, 104, 34, 'glass', .7, emis=.4)
        A.box(c, p, dX0, dX1, dHt - 2, dHt, 0, dzz + 1, 'cream', .58, top=.7, side=.44)
        A.box(c, p, dX0 + 1, dX1 - 1, 0, dHt - 2, 0, dzz, 'cream', .5, side=.36)
        fx0, fy0 = P(dX0 + 1, dHt - 2, dzz)
        fx1, fy1 = P(dX1 - 1, 0, dzz)
        # two drawers yanked out, things spilling
        for (a, b) in ((fx0 + 2, fx0 + 13), (fx1 - 13, fx1 - 2)):
            c.rect(a - 1, fy0 + 1, b + 1, fy0 + 7, 'cream', .62, dith=0)
            c.hline(a - 1, b + 1, fy0 + 1, 'cream', .82)
            c.rect(a, fy0 + 2, b, fy0 + 4, 'black', .15)
            c.put((a + b) // 2, fy0 + 5, 'brass', .8)
        c.line(fx1 - 6, fy0 + 6, fx1 - 4, fy0 + 12, 'red', .55)                  # a scarf hanging out
        c.line(fx1 - 5, fy0 + 6, fx1 - 3, fy0 + 11, 'red', .4)
        ty = int(p.P(0, dHt, 6)[1])
        for k, (bx_, col) in enumerate(((92, 'a_globe_r'), (96, 'a_jarglass'), (110, 'a_amberglass'))):
            if k == 1:                                                           # knocked over
                c.rect(bx_, ty - 2, bx_ + 4, ty, col, .6, dith=0)
            else:
                c.rect(bx_, ty - 4, bx_ + 2, ty, col, .6, dith=0)
                c.put(bx_ + 1, ty - 5, 'brass', .7)
        c.rect(102, ty - 2, 107, ty, 'a_walnut', .5, dith=0)                     # hairbrush
        c.ellipse(116, fy1 + 1, 3, 1, 'white', .9, dith=0)                       # spilled face powder

    # ============================================================ bookshelf ==========
    with sc.obj('bookshelf_o'):
        A.box(c, p, 120, 148, 0, 44, 0, 10, 'a_walnut', .46, top=.6, side=.34)
        bx0_, by0_ = P(120, 44, 10)
        bx1_, by1_ = P(148, 0, 10)
        A.bookshelf(c, bx0_, by0_, bx1_, by1_, rmp='a_walnut', lum=.46, shelves=4, seed=9, gaps=.4)
        # shorthand manuals dumped on the floor in front
        for k, (X, Z, col) in enumerate(((124, 16, 'felt'), (131, 18, 'red'), (138, 15, 'night'), (128, 22, 'trench'),
                                         (143, 21, 'felt'))):
            q = p.quad([(X - 3, .2 + k * .3, Z - 2), (X + 3, .2 + k * .3, Z - 2.6), (X + 3.5, .2 + k * .3, Z + 2),
                        (X - 2.5, .2 + k * .3, Z + 2.6)])
            c.poly(q, col, .5, dith=0)
            x_, y_ = P(X, 0, Z + 2.6)
            c.hline(x_ - 2, x_ + 3, y_, 'paper', .7)

    # ================================================= desk under the window =========
    kX0, kX1, kz0, kz1, kH = 156, 206, 6, 26, 20
    with sc.obj('desk_o', baseline=fy(kz1) + 1):
        A.box(c, p, kX0 - 1, kX1 + 1, kH - 2, kH, kz0 - 1, kz1 + 1, 'oak', .56, top=.66, side=.42)
        A.box(c, p, kX0, kX1, 0, kH - 2, kz0, kz1, 'oak', .46, side=.34)
        fx0, fy0 = P(kX0, kH - 2, kz1)
        fx1, fy1 = P(kX1, 0, kz1)
        c.rect(fx0 + 2, fy0 + 2, fx1 - 2, fy0 + 7, 'oak', .5, dith=0)
        c.rect(fx0 + 3, fy0 + 7, fx1 - 3, fy1, 'oak', .2, dith=.3)               # knee space
        c.rect(fx1 - 14, fy0 + 7, fx1 - 2, fy1, 'oak', .46, dith=.2)            # drawer pedestal
        for i in range(3):
            c.hline(fx1 - 14, fx1 - 2, fy0 + 8 + i * 4, 'oak', .3)
        # the centre drawer hangs open, empty
        c.rect(fx0 + 12, fy0 + 3, fx0 + 30, fy0 + 9, 'oak', .58, dith=0)
        c.hline(fx0 + 12, fx0 + 30, fy0 + 3, 'oak', .78)
        c.rect(fx0 + 13, fy0 + 4, fx0 + 29, fy0 + 6, 'black', .2)
    dty = int(p.P(0, kH, 15)[1])
    # Remington portable: two-tone, a blank sheet in it
    A.typewriter(c, 178, dty + 1, ramp_name='a_olivegray', paper=True, w=15)
    tlx, tly = P(197, kH, 12)
    # desk lamp with a cream shade, still burning
    c.rect(tlx - 3, tly - 1, tlx + 3, tly + 1, 'brass', .55, dith=0)
    c.vline(tlx, tly - 10, tly - 1, 'brass', .6)
    c.poly([(tlx - 3, tly - 16), (tlx + 3, tly - 16), (tlx + 6, tly - 9), (tlx - 6, tly - 9)], 'lamp',
           vgrad(tly - 16, tly - 9, .55, .78), emis=1, dith=.2)
    c.hline(tlx - 6, tlx + 7, tly - 9, 'lamp', .95, emis=1)
    # papers spilling off the desk
    for k in range(3):
        a_ = P(160 + k * 4, kH + .2, 18 + k * 2)
        c.poly([(a_[0], a_[1]), (a_[0] + 7, a_[1] - 1), (a_[0] + 8, a_[1] + 2), (a_[0] + 1, a_[1] + 3)], 'paper', .82,
               dith=0)
    # wastebasket beside the desk with the crumpled carbon sheet
    wbx, wby = P(214, 0, 20)
    with sc.obj('wastebasket_o', baseline=wby + 1):
        A.wastebasket(c, wbx, wby, h=9, w=8, rmp='a_iron', lum=.45, paper=False)
        c.ellipse(wbx - 2, wby - 10, 1.6, 1.2, 'paper', .78, dith=0)
    snap = A.snapshot(c)
    with sc.obj('_carbon'):
        c.poly([(wbx - 2, wby - 10), (wbx + 3, wby - 13), (wbx + 6, wby - 9), (wbx + 3, wby - 8), (wbx, wby - 9)], 'night',
               .3, dith=0)
        c.line(wbx + 1, wby - 11, wbx + 4, wby - 10, 'night', .5)
        c.put(wbx + 3, wby - 12, 'night', .55)
    carbon_oid = sc.objects[-1]['id']

    # ======================================================== family photo (crooked) ===
    px0, py0 = 216, 30
    pts = [(px0, py0), (px0 + 15, py0 + 2), (px0 + 13, py0 + 21), (px0 - 2, py0 + 19)]
    c.poly(pts, 'a_walnut', .5, dith=0)
    c.poly([(px0 + 2, py0 + 2), (px0 + 13, py0 + 4), (px0 + 11, py0 + 19), (px0, py0 + 17)], 'cream', .66, dith=.2)
    # Walter (tall, cap) and young Nora
    c.rect(px0 + 4, py0 + 6, px0 + 7, py0 + 17, 'trench', .3, dith=0)
    c.rect(px0 + 4, py0 + 4, px0 + 7, py0 + 6, 'cream', .82, dith=0)
    c.hline(px0 + 3, px0 + 8, py0 + 4, 'trench', .2)
    c.rect(px0 + 8, py0 + 10, px0 + 11, py0 + 17, 'paper', .7, dith=0)
    c.rect(px0 + 8, py0 + 8, px0 + 10, py0 + 10, 'cream', .82, dith=0)
    c.put(px0 + 9, py0 + 7, 'oak', .35)
    c.line(px0 + 7, py0 + 3, px0 + 9, py0 - 4, 'black', .35)                   # hanging wire
    c.line(px0 + 9, py0 - 4, px0 + 1, py0 + 1, 'black', .35)
    c.put(px0 + 9, py0 - 5, 'brass', .7)
    # pale rectangle where it used to hang straight
    c.modulate(px0 - 1, py0 - 2, px0 + 15, py0 + 18, lambda xx, yy: 1.0 + .06 * 0)

    # ========================================================= kitchenette ===========
    qX0, qX1, qz1, qH = 232, 280, 20, 22
    with sc.obj('kitchen_o'):
        # wall cupboard, doors flung open
        c.rect(236, 24, 276, 50, 'cream', .55, dith=.2)
        c.hline(236, 276, 24, 'cream', .75)
        c.rect(238, 26, 274, 48, 'cream', .25, dith=0)
        for sx in range(240, 272, 7):
            c.rect(sx, 38, sx + 4, 46, ['red', 'felt', 'paper', 'trench', 'glass'][(sx // 7) % 5], .5, dith=0)
        c.hline(238, 274, 37, 'cream', .6)
        c.poly([(236, 24), (228, 27), (228, 50), (236, 50)], 'cream', .62, dith=.2)
        c.poly([(276, 24), (284, 27), (284, 50), (276, 50)], 'cream', .45, dith=.2)
        A.box(c, p, qX0, qX1, qH - 2, qH, 0, qz1 + 1, 'a_olivegray', .55, top=.66, side=.4)
        A.box(c, p, qX0, qX1, 0, qH - 2, 0, qz1, 'cream', .5, side=.38)
        fx0, fy0 = P(qX0, qH - 2, qz1)
        fx1, fy1 = P(qX1, 0, qz1)
        for k in range(3):
            a = fx0 + 2 + k * (fx1 - fx0 - 4) // 3
            b = fx0 + 2 + (k + 1) * (fx1 - fx0 - 4) // 3 - 1
            c.rect(a, fy0 + 3, b, fy1 - 2, 'cream', .55, dith=.2)
            c.vline(b - 1, fy0 + 3, fy1 - 2, 'cream', .38)
            c.put(b - 3, fy0 + 6, 'chrome', .8)
        # sink + tap, gas ring + kettle
        sx_, sy_ = P(244, qH, 8)
        c.ellipse(sx_, sy_, 6, 1.6, 'chrome', .45, dith=0)
        c.ellipse(sx_, sy_, 4.6, 1, 'a_iron', .3, dith=0)
        c.line(sx_, sy_ - 1, sx_, sy_ - 6, 'chrome', .7)
        c.line(sx_, sy_ - 6, sx_ + 3, sy_ - 6, 'chrome', .7)
        gx_, gy_ = P(266, qH, 10)
        c.rect(gx_ - 7, gy_ - 2, gx_ + 7, gy_, 'black', .3, dith=0)
        for ox in (-4, 4):
            c.ellipse(gx_ + ox, gy_ - 2, 2.4, .8, 'a_iron', .5, dith=0)
        c.ellipse(gx_ + 4, gy_ - 5, 3, 2.6, 'chrome', .6, dith=0)
        c.line(gx_ + 7, gy_ - 6, gx_ + 9, gy_ - 8, 'chrome', .6)
        # the flour tin, knocked over at the front edge; flour pouring down
        tx_, ty_ = P(238, qH, 18)
        c.rect(tx_ - 1, ty_ - 4, tx_ + 7, ty_, 'red', .55, dith=0)
        c.ellipse(tx_ - 1, ty_ - 2, 1.4, 2.2, 'white', .7, dith=0)
        c.hline(tx_, tx_ + 7, ty_ - 3, 'white', .8)
        c.put(tx_ + 3, ty_ - 2, 'white', .6)
        c.vline(tx_ - 2, ty_ + 1, fy1 - 1, 'white', .78)
        c.vline(tx_ - 3, ty_ + 3, fy1, 'white', .68)
    # flour on the floor, with a heel-plated footprint walking toward the door
    fq = []
    for k in range(24):
        a = k / 24 * 2 * math.pi
        rr = 1 + .25 * math.sin(a * 3) + .15 * math.cos(a * 5)
        fq.append((237 + 14 * rr * math.cos(a), .15, 37 + 14 * rr * math.sin(a)))
    with sc.obj('_flour'):
        c.poly(p.quad(fq), 'white', .92, dith=.2)
        c.poly(p.quad([(232, .14, 21), (240, .14, 21), (241, .14, 27), (231, .14, 27)]), 'white', .85, dith=.2)
        for k in range(14):
            a = k * 1.7
            c.put(*P(236 + 17 * math.cos(a), 0, 33 + 10 * math.sin(a)), 'white', .75)
        # footprint: sole + separate heel with a nail plate
        # footprint, hand-pixelled: sole, instep gap, heel with its iron plate (pointing to the door)
        fx_, fy_ = P(237, 0, 37)
        foot = ['.##.', '####', '####', '.##.', '....', '.##.', '.==.']
        for r, row in enumerate(foot):
            for k, ch in enumerate(row):
                if ch == '#':
                    c.put(fx_ - 1 + k, fy_ - 4 + r, 'oak', .42)
                elif ch == '=':
                    c.put(fx_ - 1 + k, fy_ - 4 + r, 'chrome', .78)
        # fading floury prints toward the door
        for k, (X, Z) in enumerate(((254, 46), (264, 55), (272, 63))):
            x_, y_ = P(X, 0, Z)
            c.put(x_, y_, 'white', .55 - k * .08)
            c.put(x_ + 1, y_, 'white', .5 - k * .08)

    # ======================================================== door (right wall) =======
    ez0, ez1 = 44, 72
    with sc.obj('_door'):
        c.poly(A.side_quad(p, 280, 0, 50, ez0 - 3, ez1 + 3), 'cream', .5, dith=0)
        c.poly(A.side_quad(p, 280, 0, 47, ez0, ez1), 'a_walnut', .45, dith=.2)
        for (y0_, y1_) in ((26, 43), (4, 22)):
            c.poly(A.side_quad(p, 280, y0_, y1_, ez0 + 4, ez1 - 4), 'a_walnut', .38, dith=.2)
        kx_, ky_ = P(280, 22, ez0 + 3)
        c.put(kx_, ky_, 'brass', .9)
        c.put(kx_, ky_ + 1, 'brass', .6)
        # door left ajar? no - but the chain hangs loose, the lock plate scratched
        a_, b_ = P(280, 30, ez0 + 2), P(280, 26, ez0 + 7)
        c.line(a_[0], a_[1], b_[0], b_[1], 'chrome', .6)
        # 3B in brass
        nx_, ny_ = P(280, 40, (ez0 + ez1) / 2)
        c.put(nx_, ny_, 'brass', .8)
        c.put(nx_ + 1, ny_ + 1, 'brass', .7)

    # ======================================================== gramophone (left front) ==
    gX0, gX1, gz0, gz1, gH = 92, 108, 66, 80, 13
    with sc.obj('gramophone_o', baseline=fy(gz1) + 1):
        tx0, ty0 = P(gX0 + 1, gH, (gz0 + gz1) / 2)
        tx1, _ = P(gX1 - 1, gH, (gz0 + gz1) / 2)
        cxx = (tx0 + tx1) // 2
        c.ellipse(cxx, ty0, (tx1 - tx0) / 2 + 2, 2.6, 'oak', .5, dith=0)              # round table top
        c.ellipse(cxx, ty0 - .5, (tx1 - tx0) / 2 + 1, 1.8, 'oak', .66, dith=0)
        _, fl_y = P(0, 0, (gz0 + gz1) / 2)
        c.rect(cxx - 1, ty0 + 2, cxx + 1, fl_y, 'a_walnut', .45, dith=0)
        c.line(cxx, fl_y - 2, cxx - 5, fl_y, 'a_walnut', .4)
        c.line(cxx, fl_y - 2, cxx + 5, fl_y, 'a_walnut', .4)
        A.gramophone(c, cxx + 1, ty0 - 1, horn='brass', box_r='oak', record=True)
        gram_rect = (cxx - 18, ty0 - 36, cxx + 10, fl_y + 1)
    # record sleeve dropped on the floor beside it
    q = p.quad([(112, .2, 74), (120, .2, 73), (121, .2, 81), (113, .2, 82)])
    c.poly(q, 'night', .5, dith=0)
    sx_, sy_ = P(116, 0, 77.5)
    c.ellipse(sx_, sy_, 2, .9, 'red', .55, dith=0)

    # ================================================ papers strewn + overturned chair =
    A.scatter_papers(c, p, 92, 232, 34, 92, n=16, seed=7,
                     avoid=lambda X, Z: (X > 214 and Z < 40) or (X < 122 and Z > 62) or (X < 152 and 38 < Z < 54))
    with sc.obj('chair_o', baseline=fy(52) + 1):
        A.overturned_chair(c, p, 132, 46, rmp='oak', lum=.6)

    # ============================================================== lighting ==========
    c.ambient = .42
    c.add_light(180, 46, 170, .5, falloff=1.25)                         # grey daylight
    c.add_light(178, 108, 90, .32, ystretch=2.0)                        # window light on the floor
    c.add_light(tlx, tly - 10, 60, .5, falloff=1.5)                     # desk lamp
    c.glow(tlx, tly - 12, 16, '#ffc773', .45)
    c.glow(180, 40, 44, '#b8c8d8', .22)
    # soft window-shaped patch of daylight on the floor
    pq = p.quad([(150, 0, 30), (210, 0, 30), (226, 0, 78), (138, 0, 78)])
    m_, r_ = c.poly_mask(pq)
    patch = np.zeros((H, W), bool)
    patch[r_[1]:r_[3], r_[0]:r_[2]] = m_
    xx, yy = A.grid(c)
    ids = {r['name']: r['id'] for r in sc.objects}
    fl_m = (c.owner == ids['_floor'])
    c.extra[patch & fl_m & A.dither_field(np.clip(1.4 - (yy - 100) / 40, 0, 1))] += .16
    c.shadow_poly(p.quad([(bX0, 0, 0), (bX1 + 6, 0, 0), (bX1 + 8, 0, bz1 + 4), (bX0, 0, bz1 + 4)]), .4)
    c.shadow_poly(p.quad([(kX0 - 3, 0, kz0), (kX1 + 3, 0, kz0), (kX1 + 4, 0, kz1 + 5), (kX0 - 4, 0, kz1 + 5)]), .4)
    c.shadow_poly(p.quad([(qX0 - 2, 0, 0), (qX1, 0, 0), (qX1, 0, qz1 + 4), (qX0 - 4, 0, qz1 + 4)]), .4)
    c.shadow_ellipse(92, fy(71), 12, 3, .4)
    c.shade *= np.clip(1.16 - np.abs(np.arange(W)[None, :] - 175) / 220.0, .66, 1)
    c.shade *= np.clip(.82 + np.arange(H)[:, None] / 300.0, .82, 1)

    # carbon_gone: the basket as it looks once the carbon sheet is taken
    carbon_m = c.owner == carbon_oid
    A.restore_state(sc, 'carbon_gone', snap, carbon_m, depth=fy(20) + 1)

    # ===================================================== interaction geometry =======
    bx0h, by0h = P(bX0, 36, 0)
    bx1h, by1h = P(bX1, 0, bz1)
    dx0h, dy0h = P(kX0, kH, kz0)
    dx1h, dy1h = P(kX1, 0, kz1)
    sc.hotspot('window', rect=(wx0 - 6, wy0 - 6, wx1 + 6, wy1 + 4), walk=(190, 112), face='up')
    sc.hotspot('photo', rect=(px0 - 3, py0 - 6, px0 + 16, py0 + 22), walk=(222, 110), face='up')
    sc.hotspot('bookshelf', rect=(118, 48, 150, FLOOR + 2), walk=(134, 108), face='up')
    sc.hotspot('dresser', rect=(88, 26, 118, fy(dzz) + 1), walk=(104, 106), face='up')
    sc.hotspot('bed', rect=(bx0h - 4, by0h, bx1h + 6, by1h), walk=(92, 116), face='left')
    sc.hotspot('desk', rect=(dx0h - 1, dy0h + 4, dx1h + 1, dy1h), walk=(170, 112), face='up')
    sc.hotspot('typewriter', rect=(168, dty - 17, 190, dty + 2), walk=(180, 112), face='up')
    sc.hotspot('wastebasket', rect=(wbx - 6, wby - 15, wbx + 7, wby + 1), walk=(214, 110), face='up')
    sc.hotspot('exit_door', poly=[(int(x), int(y)) for x, y in A.side_quad(p, 280, 0, 50, ez0 - 3, ez1 + 3)],
               walk=(288, 120), face='right')
    sc.hotspot('flour', poly=[(int(x), int(y)) for x, y in p.quad([(222, 0, 18), (252, 0, 18), (252, 0, 36), (222, 0, 36)])],
               walk=(236, 118), face='up')
    sc.hotspot('papers', poly=[(int(x), int(y)) for x, y in p.quad([(112, 0, 52), (206, 0, 52), (214, 0, 92), (104, 0, 92)])],
               walk=(150, 128), face='down')

    fl = p.quad([(42, 0, 4), (278, 0, 4), (278, 0, zf), (42, 0, zf)])
    sc.hotspot('gramophone', rect=gram_rect, walk=(110, 136), face='left')
    fp = lambda X0, X1, Z0, Z1: [(int(x), int(y)) for x, y in p.quad([(X0, 0, Z0), (X1, 0, Z0), (X1, 0, Z1), (X0, 0, Z1)])]
    holes = [fp(30, bX1 + 8, -2, bz1 + 4), fp(dX0 - 2, 150, -2, 16), fp(kX0 - 4, kX1 + 4, -2, kz1 + 4),
             fp(qX0 - 4, 290, -2, qz1 + 4), fp(gX0 - 4, gX1 + 4, gz0 - 2, gz1 + 3), fp(116, 150, 40, 52),
             fp(208, 222, 12, 24)]
    sc.walkable([(int(x), int(y)) for x, y in fl], holes=holes)
    sc.point('start', 160, 126, 'down')
    sc.point('from_map', 286, 124, 'left')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, p.char_scale(FLOOR, 140), 140, 1.0)
    sc.meta['floor'] = 'wood'

    sc.anim('curtain', curtain_frames(wx1, wy0, wy1), fps=4, depth=1)
    sc.rain(wx0, wy0, wx1, wy1, kind='window')
    return sc


def curtain_frames(wx1, wy0, wy1):
    """The lace curtain stirring in the draught from the open sash."""
    fns = []
    for k, d in enumerate((0, 2, 4, 2)):
        def fn(c, d=d):
            c.poly([(wx1 - 6, wy0 - 6), (wx1 + 9, wy0 - 6), (wx1 + 9, wy1 - 6), (wx1 + 2 - d, wy1 + 6 + d // 2),
                    (wx1 - 8 - d, wy1 + 2)], 'cream', lambda xx, yy: .55 + np.sin(xx * 1.1 + d) * .08, dith=.3)
        fns.append(fn)
    return fns


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
