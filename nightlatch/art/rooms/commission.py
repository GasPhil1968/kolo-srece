"""Harbor Commission typing pool (Ch3). Overcast daylight + fluorescent tubes; sickly institutional green."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, noise2
from scene import Scene
from persp import Persp
import furniture as F
import props_a as A

W, H = 320, 144
FLOOR = 92

# desks: (X0, X1, Z0, Z1, occupant) occupant: dict for a painted typist, 'nora', 'lillian'
ROW_A = (22, 36)
ROW_B = (54, 68)
TYPISTS = [
    (58, 90, ROW_A, dict(hair='a_walnut', hair_l=.3, blouse='white', blouse_l=.66, look=0)),
    (98, 130, ROW_A, dict(hair='gold', hair_l=.55, blouse='a_skyday', blouse_l=.6, look=1)),
    (138, 170, ROW_A, dict(hair='black', hair_l=.3, blouse='mauve', blouse_l=.62, look=0)),
    (178, 206, ROW_A, dict(hair='rust', hair_l=.45, blouse='cream', blouse_l=.66, look=-1)),
    (58, 90, ROW_B, dict(hair='a_bakelite', hair_l=.4, blouse='a_mint', blouse_l=.66, look=0)),
    (98, 130, ROW_B, 'nora'),
    (138, 170, ROW_B, 'lillian'),
    (178, 210, ROW_B, dict(hair='a_walnut', hair_l=.45, blouse='white', blouse_l=.62, look=-1)),
]


def build():
    sc = Scene('commission', W, H, seed=71)
    c = sc.c
    p = Persp(40, 280, 0, FLOOR, horizon=-64, depth=420)
    zf = p.z_at_floor_y(H + 2)
    P = lambda X, Y, Z: A.P(p, X, Y, Z)
    fy = lambda Z: int(p.P(0, 0, Z)[1])

    # ================================================================ shell ===========
    wall_fn = A.plaster(c, 0, 0, W, FLOOR, 'a_mint', base=.62, seed=21, stain=.04, top_dark=14, top_amt=.1, grain=.02)
    with sc.obj('_backwall'):
        c.rect(40, 0, 280, FLOOR, 'a_mint', wall_fn, dith=.45)
    with sc.obj('_lwall'):
        c.poly(A.side_quad(p, 40, 0, 160, 0, zf), 'a_mint', lambda xx, yy: wall_fn(xx, yy) - .08, dith=.45)
    with sc.obj('_rwall'):
        c.poly(A.side_quad(p, 280, 0, 160, 0, zf), 'a_mint', lambda xx, yy: wall_fn(xx, yy) - .06, dith=.45)
    # darker green dado + black skirting (institutional two-tone paint)
    c.rect(40, 62, 280, FLOOR, 'sage', .42, dith=.3)
    c.hline(40, 280, 62, 'sage', .62)
    c.rect(40, FLOOR - 3, 280, FLOOR, 'black', .5, dith=0)
    for X, L in ((40, .36), (280, .4)):
        c.poly(A.side_quad(p, X, 0, 30, 0, zf), 'sage', L, dith=.3)
        a_, b_ = P(X, 30, 0), P(X, 30, zf)
        c.line(a_[0], a_[1], b_[0], b_[1], 'sage', L + .2)
        c.poly(A.side_quad(p, X, 0, 3, 0, zf), 'black', .5, dith=0)
    c.rect(40, 0, 280, 3, 'a_mint', .4, dith=0)
    A.water_stain(c, 128, 3, 12, 4, .14, .08)

    # speckled linoleum, two-tone squares, worn path
    fq = p.quad([(40, 0, 0), (280, 0, 0), (280, 0, zf), (40, 0, zf)])
    N = noise2(W, H, 1.6, 9, 1)
    N2 = noise2(W, H, 24, 3, 2)

    def linofn(xx, yy):
        X, _, Z = A.inv_hplane(p, xx, yy)
        size = 14.0
        i = np.floor((X - 40) / size)
        j = np.floor(Z / size)
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        fx = (X - 40) / size - i
        fz = Z / size - j
        gw = .6 / s / size
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = np.where((i + j) % 2 == 0, .6, .52) + (N[yi, xi] - .5) * .12 - (N2[yi, xi] - .5) * .08
        return np.where((fx < gw) | (fz < gw * 1.2), .3, L)
    with sc.obj('_floor'):
        c.poly(fq, 'a_olivegray', linofn, dith=.4)

    # ======================================================== back wall decoration =====
    # big harbour chart
    def chart(a, b, cc, d):
        c.rect(a, b, cc, d, 'paper', .78, dith=.2)
        c.poly([(a, b + 6), (a + 14, b + 4), (a + 22, b + 10), (a + 20, d - 6), (a + 30, d), (a, d)], 'cream', .62,
               dith=.2)                                                          # land
        c.poly([(cc, b), (cc - 10, b + 3), (cc - 14, b + 12), (cc, b + 16)], 'cream', .62, dith=.2)
        for k in range(5):                                                         # depth contours
            c.line(a + 4 + k * 3, b + 3 + k * 4, cc - 8 - k * 2, b + 12 + k * 3, 'night', .55)
        for (xx, yy) in ((a + 30, b + 8), (a + 38, b + 20), (a + 24, b + 26)):
            c.put(xx, yy, 'night', .4)
        cx_, cy_ = cc - 10, d - 8                                                   # compass rose
        c.line(cx_ - 5, cy_, cx_ + 5, cy_, 'red', .5)
        c.line(cx_, cy_ - 5, cx_, cy_ + 5, 'red', .5)
        c.line(cx_ - 3, cy_ - 3, cx_ + 3, cy_ + 3, 'night', .45)
        c.line(cx_ + 3, cy_ - 3, cx_ - 3, cy_ + 3, 'night', .45)
        c.put(cx_, cy_ - 6, 'red', .7)
        # piers sticking out, pier 4 and pier 9 marked
        for k, px_ in enumerate((a + 16, a + 22, a + 28)):
            c.rect(px_, d - 9 - k, px_ + 2, d - 5, 'a_walnut', .5)
        c.ellipse(a + 23, d - 11, 3, 2, 'red', .6, dith=0)
        c.put(a + 23, d - 13, 'red', .8)
        A.text(c, a + 2, b + 1, 'BRACKWATER', 'night', .45) if A.text_w('BRACKWATER') < cc - a - 2 else None
    F.picture_frame(c, 44, 12, 100, 54, frame='a_walnut', inner=chart)

    # windows onto the harbour cranes
    wins = [(106, 152), (172, 218)]
    with sc.obj('_windows'):
        for i, (wx0, wx1) in enumerate(wins):
            wy0, wy1 = 10, 60
            c.rect(wx0 - 3, wy0 - 3, wx1 + 3, wy1 + 3, 'cream', .62, dith=0)
            A.harbour_view(c, wx0, wy0, wx1, wy1, seed=3 + i, cranes=2 if i == 0 else 1)
            A.rain_streaks(c, wx0, wy0, wx1, wy1, seed=10 + i, n=26, rmp='a_skyday', lum=.95, emis=.5)
            # steel casement mullions
            for k in (1, 2):
                xx = wx0 + (wx1 - wx0) * k // 3
                c.vline(xx, wy0, wy1, 'a_iron', .5)
            for yy in (wy0 + 17, wy0 + 34):
                c.hline(wx0, wx1, yy, 'a_iron', .5)
            c.rect(wx0 - 5, wy1 + 2, wx1 + 5, wy1 + 4, 'cream', .7, dith=0)
            c.hline(wx0 - 5, wx1 + 5, wy1 + 2, 'cream', .85)
            # radiator under the window
            F.radiator(c, wx0 + 4, wy1 + 7, wx1 - 4, wy1 + 20, ramp='cream', lum=.5)
    # wall clock between the windows: twenty past ten
    ckx, cky = 162, 24
    c.ellipse(ckx, cky, 8, 8, 'black', .4, dith=0)
    c.ellipse(ckx, cky, 6.6, 6.6, 'white', .8, dith=0)
    for k in range(12):
        a_ = k / 12 * 2 * math.pi
        c.put(int(round(ckx + math.sin(a_) * 5.4)), int(round(cky - math.cos(a_) * 5.4)), 'black', .3)
    c.line(ckx, cky, ckx + 4, cky + 2, 'black', .1)         # minute hand at 4 (:20)
    c.line(ckx, cky, ckx - 2, cky - 3, 'black', .1)         # hour hand ~10
    c.put(ckx, cky, 'red', .6)
    c.vline(ckx, 3, cky - 8, 'black', .35)
    # portrait of Commissioner Crane
    def crane(a, b, cc, d):
        c.rect(a, b, cc, d, 'a_walnut', vgrad(b, d, .45, .28), dith=.3)
        mx_ = (a + cc) // 2
        c.poly([(mx_ - 7, d), (mx_ - 6, b + 16), (mx_ + 6, b + 16), (mx_ + 7, d)], 'black', .35, dith=0)   # coat
        c.poly([(mx_ - 2, b + 16), (mx_ + 2, b + 16), (mx_, b + 22)], 'white', .8, dith=0)
        c.put(mx_, b + 18, 'red', .6)
        c.ellipse(mx_, b + 10, 4, 5.4, 'skin', .6, dith=.2)                              # head
        c.rect(mx_ - 4, b + 4, mx_ + 5, b + 7, 'white', .75, dith=0)                     # white hair
        c.hline(mx_ - 2, mx_ + 3, b + 12, 'white', .7)                                   # moustache
        c.put(mx_ - 2, b + 9, 'black', .15)
        c.put(mx_ + 2, b + 9, 'black', .15)
        c.hline(mx_ - 1, mx_ + 2, b + 14, 'mauve', .45)
    F.picture_frame(c, 224, 12, 246, 46, frame='gold', inner=crane)
    c.rect(229, 47, 241, 50, 'brass', .6, dith=0)
    c.hline(229, 241, 47, 'brass', .85)

    # door to the Commissioner's stair: frosted glass PRIVATE, brass plate
    sx0, sx1, sy0 = 250, 276, 46
    with sc.obj('_stairsdoor'):
        c.rect(sx0 - 3, sy0 - 3, sx1 + 3, FLOOR, 'a_walnut', .4, dith=0)
        c.hline(sx0 - 3, sx1 + 3, sy0 - 3, 'a_walnut', .65)
        c.rect(sx0, sy0, sx1, FLOOR, 'a_walnut', hgrad(sx0, sx1, .52, .42), dith=.2)
        A.frosted_glass(c, sx0 + 3, sy0 + 3, sx1 - 3, sy0 + 22, rmp='a_frost', lum=.55, emis=.6,
                        hot=((sx0 + sx1) / 2, sy0 + 6, 10), seed=6)
        A.text(c, (sx0 + sx1) // 2 - A.text_w('PRIVATE') // 2, sy0 + 10, 'PRIVATE', 'black', .3)
        c.put(sx1 - 4, sy0 + 26, 'brass', .9)
        c.put(sx1 - 4, sy0 + 27, 'brass', .6)
        c.rect(sx0 + 4, sy0 - 12, sx1 - 4, sy0 - 6, 'brass', .55, dith=0)
        A.scribble(c, sx0 + 6, sy0 - 9, sx1 - 6, 'black', .35, seed=3)

    # ============================================================ desks + typists ======
    dH = 18
    ids_desk = {}
    for (X0, X1, (Z0, Z1), occ) in TYPISTS:
        mid = (X0 + X1) / 2
        tx, ty = P(mid, 0, Z0 - 7)
        if isinstance(occ, dict):
            # painted typist seated behind the desk (chair back behind her)
            cyb = fy(Z0 - 9)
            c.rect(tx - 5, cyb - 24, tx + 6, cyb - 15, 'a_olivegray', .42, dith=.2)
            head_top = int(p.P(mid, 34, Z0 - 7)[1])
            A.typist(c, tx, head_top, scale=p.s(Z0 - 7), **occ)
            # her chair back peeking out
        else:
            # empty office chair, pushed back (Lillian's turned aside)
            cyb = fy(Z0 - 6)
            off = 4 if occ == 'lillian' else 0
            c.rect(tx - 5 + off, cyb - 22, tx + 5 + off, cyb - 13, 'a_olivegray', .45, dith=.2)
            c.hline(tx - 5 + off, tx + 5 + off, cyb - 22, 'a_olivegray', .65)
            c.rect(tx - 1 + off, cyb - 13, tx + 1 + off, cyb - 9, 'a_iron', .4)
        base = fy(Z1) + 1
        name = f'desk_{X0}_{Z0}'
        with sc.obj(name, baseline=base):
            A.box(c, p, X0, X1, dH - 2, dH, Z0, Z1, 'oak', .58, top=.68, side=.44)
            A.box(c, p, X0 + 1, X1 - 1, 0, dH - 2, Z0 + 1, Z1, 'a_olivegray', .5, side=.38)
            fx0, fy0 = P(X0 + 1, dH - 2, Z1)
            fx1, fy1 = P(X1 - 1, 0, Z1)
            c.rect(fx0 + 2, fy0 + 2, fx1 - 2, fy1 - 1, 'a_olivegray', .44, dith=.2)
            c.hline(fx0 + 2, fx1 - 2, fy0 + 6, 'a_olivegray', .3)
            c.rect((fx0 + fx1) // 2 - 2, fy0 + 3, (fx0 + fx1) // 2 + 2, fy0 + 4, 'chrome', .7, dith=0)
            a_, b_ = P(X0, dH, Z1), P(X1, dH, Z1)
            c.hline(a_[0], b_[0], a_[1], 'oak', .8)
        ids_desk[(X0, Z0)] = (name, base)
        # desk-top things
        ttx, tty = P(mid, dH, (Z0 + Z1) / 2)
        if occ == 'nora':
            # typewriter under its dust cover, a wilted flower, her name card
            c.poly([(ttx - 8, tty), (ttx + 8, tty), (ttx + 6, tty - 8), (ttx - 6, tty - 8)], 'a_olivegray', .32, dith=.3)
            c.hline(ttx - 6, ttx + 6, tty - 8, 'a_olivegray', .5)
            vx, vy = P(X0 + 4, dH, Z0 + 4)
            c.rect(vx, vy - 4, vx + 2, vy, 'glass', .6, emis=.2)
            c.line(vx + 1, vy - 4, vx + 3, vy - 8, 'olive', .45)
            c.put(vx + 3, vy - 8, 'mauve', .5)
            c.put(vx + 4, vy - 7, 'mauve', .45)
            nx_, ny_ = P(X1 - 7, dH, Z1 - 2)
            c.rect(nx_ - 5, ny_ - 3, nx_ + 6, ny_, 'paper', .8, dith=0)
            c.hline(nx_ - 3, nx_ + 4, ny_ - 2, 'black', .4)
            nora_rect = (P(X0, dH, Z0)[0] - 1, P(X0, dH + 14, Z0)[1], P(X1, 0, Z1)[0] + 1, fy(Z1))
        elif occ == 'lillian':
            A.typewriter(c, ttx, tty + 1, ramp_name='black', paper=True, w=15, paper_h=4)
            cpx, cpy = P(X1 - 5, dH, Z0 + 5)
            c.rect(cpx - 1, cpy - 3, cpx + 2, cpy, 'white', .75, dith=0)              # coffee, lipstick on rim
            c.put(cpx, cpy - 3, 'red', .6)
            kx_, ky_ = P(X0 + 5, dH, Z1 - 3)
            c.ellipse(kx_, ky_ - 1, 2.6, 1.2, 'gold', .6, dith=0)                     # compact
            lillian_x = P(mid, 0, Z1 + 6)[0]
        else:
            A.typewriter(c, ttx, tty + 1, ramp_name='black' if X0 % 3 else 'a_olivegray', paper=True, w=15, paper_h=3)
            px_, py_ = P(X1 - 5, dH, Z0 + 4)
            c.rect(px_ - 3, py_ - 3, px_ + 3, py_, 'paper', .78, dith=0)              # paper stack
            c.hline(px_ - 3, px_ + 3, py_ - 2, 'paper', .6)

    # ======================================================== Miss Pruett's desk =======
    qX0, qX1, qZ0, qZ1, qH = 210, 246, 14, 30, 20
    with sc.obj('pruett_desk_o', baseline=fy(qZ1) + 1):
        A.box(c, p, qX0 - 1, qX1 + 1, qH - 2, qH, qZ0 - 1, qZ1 + 1, 'a_walnut', .56, top=.66, side=.42)
        A.box(c, p, qX0, qX1, 0, qH - 2, qZ0, qZ1, 'a_walnut', .48, side=.34)
        fx0, fy0 = P(qX0, qH - 2, qZ1)
        fx1, fy1 = P(qX1, 0, qZ1)
        c.rect(fx0 + 2, fy0 + 2, fx1 - 2, fy1 - 2, 'a_walnut', .42, dith=.2)
        c.rect(fx0 + 6, fy0 + 5, fx1 - 6, fy0 + 12, 'brass', .6, dith=0)               # brass name plate
        c.hline(fx0 + 6, fx1 - 6, fy0 + 5, 'brass', .85)
        A.text(c, (fx0 + fx1) // 2 - A.text_w('PRUETT') // 2, fy0 + 6, 'PRUETT', 'a_bakelite', .25)
        a_, b_ = P(qX0 - 1, qH, qZ1 + 1), P(qX1 + 1, qH, qZ1 + 1)
        c.hline(a_[0], b_[0], a_[1], 'a_walnut', .82)
    with sc.obj('pruett_items', baseline=fy(qZ1) + 1):
        # her things: phone, appointment diary (open), OUT tray (wire basket), pencil cup
        dyx, dyy = P(218, qH, 26)
        A.open_book(c, dyx, dyy, w=12, h=4)
        c.put(dyx - 3, dyy - 3, 'red', .6)                    # a red ribbon marker
        A.phone_desk(c, *P(228, qH, 18))
        otx, oty = P(240, qH, 26)
        c.rect(otx - 6, oty - 4, otx + 6, oty, 'chrome', .4, dith=0)
        for k in range(otx - 6, otx + 6, 2):
            c.vline(k, oty - 4, oty, 'chrome', .7)
        c.hline(otx - 6, otx + 6, oty - 4, 'chrome', .85)
        c.rect(otx - 5, oty - 2, otx + 5, oty - 1, 'paper', .8, dith=0)        # a few forms in it
        tray_rect = (otx - 7, oty - 9, otx + 7, oty + 1)
        A.text(c, otx - 5, oty - 9, 'OUT', 'black', .4)

    # ==================================================== filing cabinets (right wall) ==
    cab_polys = []
    with sc.obj('cabinets_o', baseline=fy(92) + 1):
        for (Z0, Z1) in ((40, 58), (58, 76), (76, 94)):
            A.box(c, p, 262, 280, 0, 30, Z0, Z1, 'a_mint', .62, top=.8, side=.66)
            fa, fb = P(262, 30, Z0), P(262, 0, Z0)
            c.line(fa[0], fa[1], fb[0], fb[1], 'a_mint', .9)
            ta, tb = P(262, 30, Z0), P(262, 30, Z1)
            c.line(ta[0], ta[1], tb[0], tb[1], 'a_mint', .95)
            # drawer fronts on the visible (left) face
            for k in range(4):
                Y0, Y1 = 2 + k * 7, 8 + k * 7
                q = A.side_quad(p, 262, Y0, Y1, Z0 + 1.5, Z1 - 1.5)
                c.poly(q, 'a_mint', .6, dith=0)
                a_, b_ = P(262, Y1, Z0 + 1.5), P(262, Y1, Z1 - 1.5)
                c.line(a_[0], a_[1], b_[0], b_[1], 'a_mint', .4)
                hx_, hy_ = P(262, Y0 + 3, (Z0 + Z1) / 2)
                c.put(hx_, hy_, 'chrome', .85)
                c.put(hx_ + 1, hy_, 'chrome', .6)
            cab_polys.append(A.side_quad(p, 262, 0, 30, Z0, Z1))
        # an open drawer with bulging files on the middle cabinet
        a_ = P(254, 22, 66)
        c.poly([P(262, 23, 61), P(252, 23, 61), P(252, 16, 61), P(252, 16, 72), P(262, 16, 72)], 'a_mint', .7,
               dith=0)
        oa, ob = P(252, 23, 61), P(252, 16, 61)
        c.line(oa[0], oa[1], ob[0], ob[1], 'a_mint', .9)
        for k in range(4):
            fa = P(255 + k * 2, 24 + (k % 2), 62)
            fb = P(255 + k * 2, 24 + (k % 2), 71)
            c.line(fa[0], fa[1], fb[0], fb[1], 'paper' if k % 2 else 'trench', .7)
        # potted rubber plant on top
        pxp, pyp = P(271, 30, 85)
        A.potted_fern(c, pxp, pyp, size=.8, pot='brick', leaf='felt', seed=14)

    # water cooler near the left wall
    with sc.obj('cooler_o', baseline=fy(30) + 1):
        A.water_cooler(c, *P(52, 0, 26), scale=1.05)

    # ======================================================= street door (left wall) ===
    ez0, ez1 = 64, 94
    with sc.obj('_streetdoor'):
        c.poly(A.side_quad(p, 40, 0, 50, ez0 - 3, ez1 + 3), 'a_walnut', .4, dith=0)
        c.poly(A.side_quad(p, 40, 0, 47, ez0, ez1), 'a_walnut', .5, dith=.2)
        c.poly(A.side_quad(p, 40, 24, 43, ez0 + 3, ez1 - 3), 'a_frost', .55, emis=.5, dith=.3)
        a_, b_ = P(40, 34, ez0 + 6), P(40, 33, ez1 - 6)
        c.line(a_[0], a_[1], b_[0], b_[1], 'black', .35)
        kx_, ky_ = P(40, 22, ez1 - 4)
        c.put(kx_, ky_, 'brass', .9)

    # fluorescent fixtures (one tube flickers: anim)
    fixtures = [(56, 96, 9), (130, 190, 7), (226, 266, 9)]
    for (a_, b_, y_) in fixtures:
        A.fluorescent(c, a_, b_, y_, on=True)

    # ============================================================= lighting =============
    c.ambient = .6
    for (a_, b_, y_) in fixtures:
        c.add_light((a_ + b_) / 2, y_ + 10, 110, .3, falloff=1.2)
        c.glow((a_ + b_) / 2, y_ + 1, (b_ - a_) * .6, '#e8ffe8', .25)
    for (wx0, wx1) in wins:
        c.add_light((wx0 + wx1) / 2, 40, 80, .2, falloff=1.1)
        c.glow((wx0 + wx1) / 2, 35, 34, '#cfe0ee', .16)
    c.add_light(160, 125, 150, .18, ystretch=1.6)
    c.add_light(285, 100, 60, .2)
    for (X0, X1, (Z0, Z1), occ) in TYPISTS:
        c.shadow_poly(p.quad([(X0 - 2, 0, Z0 - 8), (X1 + 2, 0, Z0 - 8), (X1 + 3, 0, Z1 + 4), (X0 - 3, 0, Z1 + 4)]), .35)
    c.shadow_poly(p.quad([(qX0 - 2, 0, qZ0 - 6), (qX1 + 2, 0, qZ0 - 6), (qX1 + 3, 0, qZ1 + 4), (qX0 - 3, 0, qZ1 + 4)]), .35)
    c.shadow_poly(p.quad([(256, 0, 40), (262, 0, 40), (262, 0, 96), (256, 0, 96)]), .3)
    c.shade *= np.clip(1.15 - np.abs(np.arange(W)[None, :] - 160) / 300.0, .8, 1)

    # steno pad in the OUT tray (state): small green shorthand pad with a spiral top
    with sc.obj('steno_pad', state=True, depth=fy(qZ1) + 2) as cc:
        cc.rect(otx - 5, oty - 7, otx + 4, oty - 1, 'paper', .88, dith=0)
        cc.rect(otx - 5, oty - 7, otx + 4, oty - 5, 'felt', .62, dith=0)
        for k in range(otx - 5, otx + 4, 2):
            cc.put(k, oty - 8, 'chrome', .85)
        cc.hline(otx - 4, otx + 3, oty - 4, 'night', .5)
        cc.hline(otx - 4, otx + 1, oty - 2, 'night', .5)

    # =================================================== interaction geometry ==========
    allc = [pt for q in cab_polys for pt in q]
    qx0, qy0 = P(qX0, qH, qZ0)
    qx1, qy1 = P(qX1, 0, qZ1)
    sc.hotspot('chart', rect=(44, 12, 100, 54), walk=(96, 109), face='up')
    sc.hotspot('portrait', rect=(223, 11, 247, 51), walk=(236, 112), face='up')
    sc.hotspot('clock', rect=(152, 14, 172, 34), walk=(156, 109), face='up')
    sc.hotspot('stairs_door', rect=(sx0 - 3, sy0 - 12, sx1 + 3, FLOOR), walk=(262, 110), face='up')
    sc.hotspot('cabinets', rect=(int(min(x for x, _ in allc)), int(min(y for _, y in allc)) - 2, W, int(max(y for _, y in allc))),
               walk=(282, 128), face='right')
    sc.hotspot('typists', rect=(52, 58, 212, 98), walk=(134, 109), face='up')
    sc.hotspot('nora_desk', rect=nora_rect, walk=(116, 130), face='up')
    sc.hotspot('pruett_desk', rect=(qx0 - 1, qy0 - 1, qx1 + 1, qy1), walk=(228, 112), face='up')
    sc.hotspot('diary', rect=(dyx - 8, dyy - 6, dyx + 8, dyy + 1), walk=(222, 112), face='up')
    sc.hotspot('out_tray', rect=tray_rect, walk=(240, 112), face='up')

    # walkable: front strip + the aisle between the rows + Pruett's approach
    fpq = lambda X0, X1, Z0, Z1: [(int(x), int(y)) for x, y in p.quad([(X0, 0, Z0), (X1, 0, Z0), (X1, 0, Z1), (X0, 0, Z1)])]
    poly = [P(42, 0, ROW_A[1] + 3), P(212, 0, ROW_A[1] + 3), P(212, 0, qZ1 + 4), P(258, 0, qZ1 + 4),
            P(258, 0, 38), P(260, 0, 38), P(260, 0, zf), P(42, 0, zf)]
    holes = [fpq(X0 - 3, X1 + 3, Z0 - 2, Z1 + 3) for (X0, X1, (Z0, Z1), occ) in TYPISTS if (Z0, Z1) == ROW_B]
    holes.append(fpq(36, 66, 18, ROW_A[1] + 4))
    sc.hotspot('exit_street', poly=[(int(x), int(y)) for x, y in A.side_quad(p, 40, 0, 50, ez0 - 3, ez1 + 3)],
               walk=(28, 130), face='left')
    sc.walkable([(int(x), int(y)) for x, y in poly], holes=holes)
    sc.point('start', 108, 134, 'down')
    sc.point('from_map', 30, 130, 'right')
    sc.point('lillian_spot', int(lillian_x) + 2, fy(ROW_B[1] + 8), 'down')
    sc.point('pruett_spot', 228, fy(6), 'down')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, p.char_scale(FLOOR, 140), 140, 1.0)
    sc.meta['floor'] = 'tile'

    # ================================================================ anims ==============
    a_, b_, y_ = fixtures[1]

    def tube(level):
        def fn(cc):
            cc.hline(a_ + 1, b_ - 1, y_ + 1, 'a_fluor', .95 * level + .3 * (1 - level), emis=level)
        return fn
    sc.anim('tube', [tube(l_) for l_ in (1, 1, 1, 1, 1, 1, .2, 1, .1, 1, 1, 1, 1, 1, 1, 1)], fps=10, depth=200)
    for (wx0, wx1) in wins:
        sc.rain(wx0, 10, wx1, 60, kind='window')
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
