"""Rook's office - 14 Marrow St, 2nd floor (Ch1-8). Night, rain, red neon through the blinds."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from core import hgrad, noise2
from scene import Scene
from persp import Persp, plank_floor
import props_a as A

W, H = 320, 144
FLOOR = 96
NEON = '#ff3a64'
LIGHT = (500.0, 225.0, -130.0)     # the HOTEL sign across the street (off to the right)
LIGHT2 = (-90.0, 150.0, -170.0)    # a blue-white street lamp down to the left
STREET = '#9ec4ff'


def build():
    sc = Scene('office', W, H, seed=21)
    c = sc.c
    p = Persp(44, 276, 0, FLOOR, horizon=-64, depth=420)
    zf = p.z_at_floor_y(H + 2)
    zw = p.D * (1 - (p.cx - p.bx0) / (p.cx + 4))      # side walls reach past the screen edge
    P = lambda X, Y, Z: A.P(p, X, Y, Z)
    fy = lambda Z: int(p.P(0, 0, Z)[1])

    # ============================================================== shell ==========
    wall_fn = A.plaster(c, 0, 0, W, FLOOR, 'a_owall', base=.62, seed=4, stain=.06, top_dark=24, top_amt=.2)
    with sc.obj('_backwall'):
        c.rect(44, 0, 276, FLOOR, 'a_owall', wall_fn, dith=.5)
    with sc.obj('_lwall'):
        c.poly(A.side_quad(p, 44, 0, 140, 0, zw), 'a_owall', lambda xx, yy: wall_fn(xx, yy) - .1, dith=.5)
    with sc.obj('_rwall'):
        c.poly(A.side_quad(p, 276, 0, 140, 0, zw), 'a_owall', lambda xx, yy: wall_fn(xx, yy) - .05, dith=.5)
    c.rect(44, 0, 276, 3, 'a_owall', .25, dith=.3)
    c.rect(44, 21, 276, 23, 'a_walnut', .45, dith=0)                 # picture rail
    c.hline(44, 276, 21, 'a_walnut', .68)
    for X in (44, 276):
        a, b = p.P(X, FLOOR - 21, 0), p.P(X, FLOOR - 21, zw)
        c.line(a[0], a[1], b[0], b[1], 'a_walnut', .55)
    c.vline(44, 0, FLOOR, 'a_owall', .28)
    c.vline(275, 0, FLOOR, 'a_owall', .32)
    A.wainscot_back(c, 44, 276, 64, FLOOR, 'a_walnut', .44, panel=26)
    with sc.obj('_lwainscot'):
        A.wainscot_side(c, p, 44, zw, h=32, lum=.36)
    with sc.obj('_rwainscot'):
        A.wainscot_side(c, p, 276, zw, h=32, lum=.4)
    A.water_stain(c, 74, 7, 18, 7, .2, .12)
    A.water_stain(c, 250, 4, 10, 4, .15, .1)
    A.crack(c, 154, 23, 14, 'a_owall', .24, seed=3)
    A.crack(c, 103, 3, 9, 'a_owall', .26, seed=8)

    # floor + worn rug
    with sc.obj('_floor'):
        plank_floor(c, p, 44, 276, 0, zf, 'wood', base=.46, plank_w=11, seed=5, gap_lum=.18, var=.1)
    N = noise2(W, H, 3, 8, 2)
    rx0, rx1, rz0, rz1 = 150, 262, 54, 96

    def rugfn(xx, yy):
        X, _, Z = A.inv_hplane(p, xx, yy)
        b = np.minimum(np.minimum(np.abs(X - rx0), np.abs(X - rx1)), np.minimum(np.abs(Z - rz0), np.abs(Z - rz1)))
        border = b < 5
        inner = (b >= 6.5) & (b < 7.6)
        cxr, czr = (rx0 + rx1) / 2, (rz0 + rz1) / 2
        med = (np.abs(X - cxr) / 26 + np.abs(Z - czr) / 11) < 1
        med2 = (np.abs(X - cxr) / 15 + np.abs(Z - czr) / 6.5) < 1
        pat = ((np.floor(X / 5) + np.floor(Z / 4)) % 3 == 0)
        L = np.where(border, .6, np.where(inner, .72, .5))
        L = np.where(~border & pat, L - .06, L)
        L = np.where(med & ~border, .62, L)
        L = np.where(med2 & ~border, .42, L)
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        return L - np.clip((N[yi, xi] - .55) * 3, 0, 1) * .14
    with sc.obj('_rug'):
        c.poly(p.quad([(rx0, .1, rz0), (rx1, .1, rz0), (rx1, .1, rz1), (rx0, .1, rz1)]), 'a_damask', rugfn, dith=.5)
    for X in range(rx0 + 2, rx1 - 1, 3):
        x, y = P(X, 0, rz1)
        c.vline(x, y, y + 2, 'cream', .5)

    # ============================================================ back wall props ===
    # --- frosted glass door, lettering mirrored (we are inside) --------------------------
    dx0, dx1, dy0 = 48, 84, 50
    with sc.obj('_door'):
        c.rect(dx0 - 4, dy0 - 15, dx1 + 4, FLOOR, 'a_walnut', .42, dith=0)
        c.hline(dx0 - 4, dx1 + 4, dy0 - 15, 'a_walnut', .72)
        c.vline(dx0 - 4, dy0 - 15, FLOOR, 'a_walnut', .6)
        c.vline(dx1 + 3, dy0 - 15, FLOOR, 'a_walnut', .25)
        # transom, tilted open on its chain, lit by the corridor
        A.frosted_glass(c, dx0 + 1, dy0 - 12, dx1 - 1, dy0 - 5, lum=.6, emis=.9, hot=(66, dy0 - 10, 14), seed=7)
        c.hline(dx0 + 1, dx1 - 1, dy0 - 12, 'a_walnut', .3)
        c.hline(dx0 + 1, dx1 - 1, dy0 - 6, 'a_walnut', .55)
        c.line(dx1 - 4, dy0 - 12, dx1 - 2, dy0 - 16, 'chrome', .6)
        A.text(c, 60, dy0 - 11, '21', 'a_bakelite', .3, mirror=True)
        c.rect(dx0 - 1, dy0 - 1, dx1 + 1, FLOOR, 'black', .2)
        c.rect(dx0, dy0, dx1, FLOOR, 'a_walnut', hgrad(dx0, dx1, .5, .4), dith=.2)
        gx0, gy0, gx1, gy1 = dx0 + 2, dy0 + 2, dx1 - 2, dy0 + 29
        A.frosted_glass(c, gx0, gy0, gx1, gy1, lum=.66, emis=.92, hot=(64, gy0 + 4, 20), seed=3)
        c.rect(gx0 - 1, gy0 - 1, gx1 + 1, gy0, 'a_walnut', .3)
        c.hline(gx0 - 1, gx1 + 1, gy1, 'a_walnut', .65)
        # shadow of the landing banister on the glass
        c.hline(gx0, gx1, gy1 - 5, 'a_frost', .5, emis=.92)
        for k in range(6):
            c.vline(gx0 + 3 + k * 5, gy1 - 4, gy1, 'a_frost', .52, emis=.92)
        ink, il = 'a_bakelite', .3
        mid = (gx0 + gx1) // 2

        def line(s, y):
            A.text(c, mid - A.text_w(s) // 2, y, s, ink, il, mirror=True)
        line('THOMAS', gy0 + 1)
        line('ROOK', gy0 + 7)
        c.hline(mid - 7, mid + 8, gy0 + 13, ink, il)
        line('PRIVATE', gy0 + 15)
        line('INQUIRIES', gy0 + 21)
        c.rect(dx0 + 3, gy1 + 3, dx1 - 3, FLOOR - 6, 'a_walnut', .4, dith=.2)
        c.hline(dx0 + 3, dx1 - 3, gy1 + 3, 'a_walnut', .25)
        c.vline(dx0 + 3, gy1 + 3, FLOOR - 6, 'a_walnut', .28)
        c.hline(dx0 + 3, dx1 - 3, FLOOR - 7, 'a_walnut', .62)
        c.rect(dx0 + 1, FLOOR - 5, dx1 - 1, FLOOR - 1, 'brass', .42, dith=.2)
        c.hline(dx0 + 1, dx1 - 1, FLOOR - 5, 'brass', .7)
        kx, ky = dx1 - 5, gy1 + 5
        c.rect(kx - 1, ky - 2, kx + 2, ky + 6, 'brass', .45, dith=0)
        c.ellipse(kx + .5, ky + 1, 2.2, 2.0, 'brass', .62, dith=0)
        c.put(kx, ky, 'brass', .95)
        c.put(kx, ky + 4, 'black', 0)
        for hy in (dy0 + 5, FLOOR - 13):
            c.rect(dx0, hy, dx0 + 1, hy + 4, 'brass', .55)
        c.hline(dx0, dx1, FLOOR - 1, 'lamp', .5, emis=1)

    # --- back stairs on the left wall: open doorway, steps going down to Hask's -----------
    sz0, sz1 = 46, 74
    with sc.obj('_stairs'):
        stq = A.stairwell_doorway(c, p, 44, sz0, sz1, h=45, frame='a_walnut', flum=.42)
    # fire extinguisher on the left wall, near the front
    ex_t = P(44, 30, 88)
    ex_b = P(44, 14, 88)
    c.rect(ex_t[0] - 2, ex_t[1], ex_t[0] + 2, ex_b[1], 'red', hgrad(ex_t[0] - 2, ex_t[0] + 2, .7, .4), dith=0)
    c.ellipse(ex_t[0], ex_t[1], 2, 1.2, 'red', .75, dith=0)
    c.rect(ex_t[0] - 1, ex_t[1] - 3, ex_t[0] + 1, ex_t[1], 'brass', .6, dith=0)
    c.line(ex_t[0] + 1, ex_t[1] - 2, ex_t[0] + 3, ex_t[1] + 4, 'black', .3)
    c.hline(ex_t[0] - 2, ex_t[0] + 2, (ex_t[1] + ex_b[1]) // 2, 'cream', .6)
    c.vline(ex_t[0] - 2, ex_t[1], ex_b[1], 'red', .85)

    # --- wall decorations -------------------------------------------------------------
    cal = A.calendar(c, 109, 33, month='OCT', year='1951', circle=9, first_dow=1)
    A.framed_photo(c, 136, 38, 150, 50, frame='a_walnut',
                   inner=lambda a, b, cc, d: (c.rect(a, b, cc, d, 'paper', .82, dith=0),
                                              A.scribble(c, a + 1, b + 1, cc - 1, 'black', .4, seed=2),
                                              A.scribble(c, a + 1, b + 3, cc - 2, 'black', .45, seed=3),
                                              c.put((a + cc) // 2, d - 2, 'red', .6),
                                              c.put((a + cc) // 2 + 1, d - 2, 'red', .5)))

    def cops(a, b, cc, d):
        A.two_cops_photo(c, a, b, cc, d)
        A.text(c, cc - 7, d - 6, '38', 'cream', .3)
    A.framed_photo(c, 174, 36, 196, 56, frame='a_walnut', inner=cops)
    c.rect(90, 57, 93, 62, 'cream', .62, dith=0)                     # light switch + conduit
    c.put(91, 59, 'black', .3)
    c.vline(91, 23, 57, 'a_owall', .38)
    # wall clock on the right wall (foreshortened)
    ckx, cky = P(276, 58, 30)
    c.ellipse(ckx + 1, cky, 2.6, 5.2, 'a_walnut', .45, dith=0)
    c.ellipse(ckx + 1, cky, 1.8, 4.2, 'cream', .7, dith=0)
    c.line(ckx + 1, cky, ckx + 1, cky - 3, 'black', .2)
    c.line(ckx + 1, cky, ckx + 2, cky + 1, 'black', .2)

    # --- window with venetian blinds, the HOTEL sign across the street -----------------
    wx0, wy0, wx1, wy1 = 208, 9, 268, 76
    c.rect(wx0 - 4, wy0 - 4, wx1 + 4, wy1 + 2, 'a_walnut', .42, dith=0)
    c.hline(wx0 - 4, wx1 + 4, wy0 - 4, 'a_walnut', .65)
    A.city_night(c, wx0, wy0, wx1, wy1, seed=6, wall_top=wy0 + 6, lit=.35)
    c.modulate(wx0, wy0, wx1, wy1, lambda xx, yy: 1 + .6 * np.clip(1 - np.hypot(xx - 256, (yy - 42) * .6) / 24, 0, 1))
    with sc.obj('_neon'):
        nx0, nx1, ny0, ny1 = 249, 265, 11, 75
        c.rect(nx0, ny0, nx1, ny1, 'black', .3, emis=.5)
        for (a, b, cc, d) in ((nx0, ny0, nx1, ny0 + 1), (nx0, ny1 - 1, nx1, ny1), (nx0, ny0, nx0 + 1, ny1),
                              (nx1 - 1, ny0, nx1, ny1)):
            c.rect(a, b, cc, d, 'neonblue', .82, emis=1)
        for i, ch in enumerate('HOTEL'):
            A.text(c, nx0 + 5, ny0 + 3 + i * 12, ch, 'neonred', .82, emis=1, scale=2)
            A.text(c, nx0 + 5, ny0 + 3 + i * 12, ch, 'neonred', .98, emis=1, scale=1)
    neon_oid = sc.objects[-1]['id']
    A.rain_streaks(c, wx0, wy0, wx1, wy1, seed=4, n=50)
    c.rect(wx0, 42, wx1, 44, 'a_walnut', .4, dith=0)                    # meeting rail
    A.venetian_blinds(c, wx0, wy0, wx1, wy1, pitch=4, slat=2, rmp='paper', lum=.3,
                      rim=('a_neon_pink', .45, .5), seed=2)
    c.rect(wx0 - 6, wy1 + 2, wx1 + 6, wy1 + 5, 'a_walnut', .58, dith=0)   # sill
    c.hline(wx0 - 6, wx1 + 6, wy1 + 2, 'a_walnut', .8)
    c.hline(wx0 - 6, wx1 + 6, wy1 + 5, 'black', .2)

    # --- water cooler + filing cabinets -----------------------------------------------
    with sc.obj('cooler_o', baseline=fy(14)):
        A.water_cooler(c, 158, fy(10), scale=1.0)
    fc = []
    with sc.obj('filing_o', baseline=fy(14)):
        fc.append(A.filing_cabinet(c, p, 168, 184, 0, 14, 30, drawers=4, rmp='a_olivegray', lum=.52))
        fc.append(A.filing_cabinet(c, p, 185, 201, 0, 14, 30, drawers=4, rmp='a_olivegray', lum=.5))
        fx0, fy0, fx1, fy1, dh = fc[0]
        a = int(fy0 + 1 + dh)
        b = int(fy0 + 1 + 2 * dh)
        c.rect(fx0, a - 1, fx1, b + 1, 'black', .15)
        c.rect(fx0 - 1, a + 1, fx1 + 1, b + 2, 'a_olivegray', .58, dith=0)
        c.hline(fx0 - 1, fx1 + 1, a + 1, 'a_olivegray', .78)
        for k, xx in enumerate(range(fx0, fx1 - 1, 3)):
            c.rect(xx, a - 2 - (k % 2), xx + 3, a + 1, 'paper' if k % 3 else 'trench', .62 + .1 * (k % 2), dith=0)
        mx = (fx0 + fx1) // 2
        c.hline(mx - 2, mx + 2, a + 5, 'chrome', .8)
        top = fy0
        c.rect(171, top - 6, 182, top, 'trench', .48, dith=.2)            # file box
        c.hline(171, 182, top - 6, 'trench', .66)
        c.rect(173, top - 4, 178, top - 2, 'paper', .72, dith=0)
        c.rect(186, top - 8, 199, top, 'a_walnut', .48, dith=.2)          # cathedral radio
        c.hline(186, 199, top - 8, 'a_walnut', .7)
        c.rect(188, top - 6, 193, top - 2, 'cream', .45, dith=.4)
        c.put(196, top - 5, 'brass', .75)
        c.put(196, top - 3, 'brass', .6)
        c.line(198, top - 8, 202, top - 16, 'chrome', .5)

    # --- coat rack with Mabel's coat + umbrella -------------------------------------------
    cry = fy(12)
    with sc.obj('coat_rack_o', baseline=cry):
        A.coat_rack(c, 95, cry, h=46, rmp='a_walnut', lum=.52)
        top = cry - 44
        c.poly([(93, top + 3), (98, top + 3), (101, top + 24), (99, top + 30), (91, top + 30), (89, top + 22)], 'plum',
               hgrad(89, 101, .58, .36), dith=.3)
        c.line(95, top + 4, 95, top + 29, 'plum', .3)
        c.hline(91, 99, top + 13, 'plum', .25)
        c.ellipse(96, top + 1, 4, 1.5, 'a_mahog', .42, dith=0)
        c.rect(94, top - 2, 99, top + 1, 'a_mahog', .52, dith=0)
        c.line(99, top - 1, 103, top - 5, 'cream', .72)
        c.line(102, cry - 2, 105, cry - 26, 'black', .3)
        c.poly([(101, cry - 3), (103, cry - 3), (106, cry - 22), (104, cry - 24)], 'night', .32, dith=0)
        c.put(105, cry - 27, 'a_walnut', .6)
        c.put(106, cry - 27, 'a_walnut', .6)

    # ======================================================== Mabel's desk area =========
    mz0, mz1, mX0, mX1, mH = 16, 34, 104, 150, 21
    A.swivel_chair(c, 128, fy(9), w=14, back_h=17, leather='a_bakelite', lum=.42)
    with sc.obj('mabel_desk_o', baseline=fy(mz1 + 1)):
        A.box(c, p, mX0, mX1, mH - 2, mH, mz0 - 1, mz1 + 1, 'oak', .52, top=.64, side=.4)
        A.box(c, p, mX0 + 1, mX1 - 1, 0, mH - 2, mz0, mz1, 'oak', .44, top=.5, side=.32)
        fx0, fy0 = P(mX0 + 1, mH - 2, mz1)
        fx1, fy1 = P(mX1 - 1, 0, mz1)
        c.hline(fx0, fx1, fy0 + 4, 'oak', .3)
        c.rect(fx0 + 3, fy0 + 6, fx1 - 18, fy1 - 1, 'oak', .36, dith=.3)
        for i in range(3):
            yy = fy0 + 5 + i * 6
            c.hline(fx1 - 16, fx1 - 1, yy, 'oak', .28)
            c.rect(fx1 - 10, yy + 2, fx1 - 6, yy + 3, 'brass', .66, dith=0)
        c.rect((fx0 + fx1) // 2 - 3, fy0 + 1, (fx0 + fx1) // 2 + 2, fy0 + 2, 'brass', .62, dith=0)
        tx0, ty0 = P(mX0, mH, mz1 + 1)
        c.hline(tx0, P(mX1, mH, mz1 + 1)[0], ty0, 'oak', .8)
    with sc.obj('mabel_items', baseline=fy(mz1 + 1)):
        tyb = int(p.P(0, mH, 24)[1])
        A.typewriter(c, 125, tyb + 1, paper=True)
        A.potted_fern(c, 108, tyb + 2, size=.85, pot='brick', leaf='felt', seed=5)
        A.phone_desk(c, 143, tyb + 1)
        ash_x, ash_y = P(136, mH, 31)
        A.ashtray(c, ash_x, ash_y, butts=4, smoking=True)
        sx, sy = P(112, mH, 31)
        c.rect(sx - 3, sy - 1, sx + 3, sy + 1, 'paper', .86, dith=0)           # steno pad + pencil
        c.hline(sx - 3, sx + 3, sy - 2, 'a_walnut', .4)
        c.line(sx + 5, sy, sx + 9, sy - 1, 'gold', .7)
        lx, ly = P(147, mH, 18)                                                  # gooseneck lamp
        c.rect(lx - 2, ly - 1, lx + 2, ly, 'a_iron', .5, dith=0)
        c.line(lx, ly - 1, lx - 1, ly - 9, 'a_iron', .52)
        c.line(lx - 1, ly - 9, lx - 5, ly - 12, 'a_iron', .52)
        c.poly([(lx - 9, ly - 11), (lx - 4, ly - 14), (lx - 2, ly - 11), (lx - 6, ly - 8)], 'a_olivegray', .5, dith=0)
        c.line(lx - 8, ly - 9, lx - 4, ly - 8, 'lamp', .9, emis=1)
        mlamp = (lx - 6, ly - 8)

    # ========================================================== Rook's desk =============
    rz0, rz1, rX0, rX1, rH = 22, 46, 198, 272, 22
    A.exec_chair(c, 236, fy(12), w=24, back_h=33, seat_h=12, leather='a_mahog', lum=.4,
                 rim=('a_neon_pink', .62, .7))
    with sc.obj('rook_desk_o', baseline=fy(rz1 + 1)):
        A.box(c, p, rX0 - 1, rX1 + 1, rH - 2, rH, rz0 - 1, rz1 + 1, 'a_mahog', .56, top=.64, side=.42)
        A.box(c, p, rX0, rX1, 0, rH - 2, rz0, rz1, 'a_mahog', .46, side=.32)
        fx0, fy0 = P(rX0, rH - 2, rz1)
        fx1, fy1 = P(rX1, 0, rz1)
        pw = 24
        dhh = (fy1 - fy0 - 5) / 3
        for (a, b) in ((fx0 + 2, fx0 + pw), (fx1 - pw, fx1 - 2)):
            c.rect(a, fy0 + 2, b, fy1 - 2, 'a_mahog', .5, dith=.25)
            c.vline(a, fy0 + 2, fy1 - 2, 'a_mahog', .64)
            c.vline(b - 1, fy0 + 2, fy1 - 2, 'a_mahog', .3)
            for i in range(3):
                y0_ = int(fy0 + 3 + i * dhh)
                y1_ = int(fy0 + 3 + (i + 1) * dhh)
                c.hline(a + 1, b - 1, y1_ - 1, 'a_mahog', .26)
                c.hline(a + 1, b - 1, y0_, 'a_mahog', .64)
                mx = (a + b) // 2
                c.rect(mx - 3, y0_ + 3, mx + 3, y0_ + 4, 'brass', .64, dith=0)
                c.put(mx - 3, y0_ + 3, 'brass', .92)
        c.rect(fx0 + pw + 1, fy0 + 2, fx1 - pw - 1, fy1 - 3, 'a_mahog', .4, dith=.25)
        for k in range(3):
            xx = fx0 + pw + 4 + k * ((fx1 - fx0 - 2 * pw - 8) // 2)
            c.vline(xx, fy0 + 4, fy1 - 5, 'a_mahog', .5)
        c.hline(fx0 + pw + 1, fx1 - pw - 1, fy0 + 2, 'a_mahog', .3)
        # the rye drawer (right pedestal, middle) pulled out a little; bottle neck showing
        a, b = fx1 - pw, fx1 - 2
        y0_ = int(fy0 + 3 + dhh)
        c.rect(a, y0_ - 2, b, y0_, 'black', .05)
        c.rect(a - 1, y0_, b + 1, int(y0_ + dhh), 'a_mahog', .56, dith=.2)
        c.hline(a - 1, b + 1, y0_, 'a_mahog', .8)
        mx = (a + b) // 2
        c.rect(mx - 3, y0_ + 3, mx + 3, y0_ + 4, 'brass', .7, dith=0)
        c.rect(a + 4, y0_ - 5, a + 7, y0_, 'a_amberglass', .55, dith=0)
        c.rect(a + 5, y0_ - 7, a + 6, y0_ - 5, 'a_amberglass', .72, dith=0)
        c.put(a + 5, y0_ - 8, 'red', .55)
        c.put(a + 4, y0_ - 4, 'a_amberglass', .95)
        drawer_rect = (a - 2, y0_ - 9, b + 2, int(y0_ + dhh) + 1)
        tx0, ty0 = P(rX0 - 1, rH, rz1 + 1)
        c.hline(tx0, P(rX1 + 1, rH, rz1 + 1)[0], ty0, 'a_mahog', .84)
    # desk top: blotter, folder, lamp, phone, ashtray, cup, files, newspaper
    c.poly(p.quad([(220, rH + .1, 28), (252, rH + .1, 28), (252, rH + .1, 42), (220, rH + .1, 42)]), 'a_bank', .32, dith=.3)
    for (X, Z) in ((220, 28), (252, 28), (220, 42), (252, 42)):
        x, y = P(X, rH, Z)
        c.put(x, y, 'brass', .82)
    c.poly(p.quad([(228, rH + .2, 31), (241, rH + .2, 31), (242, rH + .2, 40), (227, rH + .2, 40)]), 'paper', .84, dith=0)
    for Z in (33, 35, 37):
        a_, b_ = P(230, rH, Z), P(239, rH, Z)
        A.scribble(c, a_[0], a_[1], b_[0], 'black', .45, seed=Z)
    c.poly(p.quad([(236, rH + .3, 33), (250, rH + .3, 32), (251, rH + .3, 41), (237, rH + .3, 42)]), 'trench', .64, dith=0)
    c.hline(*P(238, rH, 36)[:1], P(249, rH, 36)[0], P(238, rH, 36)[1], 'red', .45)
    lampx, lampy = P(212, rH, 30)
    A.banker_lamp(c, lampx, lampy, on=True, w=17)
    phx, phy = P(262, rH, 34)
    A.phone_desk(c, phx, phy)
    A.ashtray(c, *P(257, rH, 43), butts=5, smoking=False)
    gx_, gy_ = P(250, rH, 38)
    c.rect(gx_ - 1, gy_ - 4, gx_ + 2, gy_, 'glass', .55, emis=.2, dith=0)
    c.rect(gx_ - 1, gy_ - 2, gx_ + 2, gy_, 'a_amberglass', .6, dith=0)
    c.put(gx_ - 1, gy_ - 4, 'white', .85)
    cx_, cy_ = P(244, rH, 26)
    c.ellipse(cx_, cy_, 3, 1, 'white', .6, dith=0)
    c.rect(cx_ - 2, cy_ - 4, cx_ + 2, cy_ - 1, 'white', .72, dith=0)
    c.ellipse(cx_, cy_ - 4, 2, .8, 'a_bakelite', .5, dith=0)
    c.put(cx_ + 2, cy_ - 3, 'white', .55)
    for k in range(4):
        x0_, y0_ = P(266, rH + k * 1.2, 26)
        c.rect(x0_ - 5, y0_ - 2 - k, x0_ + 4, y0_ - k, 'trench' if k % 2 else 'paper', .56 + .05 * k, dith=0)
    nx_, ny_ = P(203, rH, 40)
    c.poly([(nx_, ny_), (nx_ + 9, ny_ - 1), (nx_ + 10, ny_ + 2), (nx_ + 1, ny_ + 3)], 'paper', .72, dith=0)
    c.hline(nx_ + 2, nx_ + 8, ny_ + 1, 'black', .4)

    # ==================================================== client chair + safe ==========
    cz0, cz1 = 58, 70
    with sc.obj('client_chair_o', baseline=fy(cz1)):
        A.wood_chair_back(c, p, 176, 192, cz0, cz1, rmp='oak', lum=.52, seat_h=12, back_h=27)
    sfz0, sfz1 = 62, 80
    with sc.obj('safe_o', baseline=fy(sfz1)):
        safe_rect = A.iron_safe(c, p, 257, 276, sfz0, sfz1, 19, rmp='a_iron', lum=.58)
        for k in range(3):
            a_, b_ = P(259, 19 + k, 72)
            c.rect(a_, b_ - 2, a_ + 11, b_, 'paper', .58 + k * .06, dith=0)
    wbx, wby = P(194, 0, 50)
    with sc.obj('wastebasket_o', baseline=wby):
        A.wastebasket(c, wbx - 4, wby, h=8, w=7, rmp='a_iron', lum=.42, paper=True, seed=2)
    # a missed shot at the basket
    bx_, by_ = P(186, 0, 56)
    c.ellipse(bx_, by_ - 1, 1.6, 1.3, 'paper', .7, dith=0)

    # ceiling fan motor (blades are an anim layer)
    fanx, fany = 150, 9
    c.rect(fanx, 0, fanx + 1, fany - 2, 'a_iron', .45)
    c.rect(fanx - 3, fany - 3, fanx + 4, fany, 'brass', .48, dith=0)
    c.hline(fanx - 3, fanx + 4, fany - 3, 'brass', .72)

    # ============================================================ lighting ===============
    c.ambient = .43
    c.add_light(lampx, lampy - 10, 95, .8, falloff=1.45)                  # banker's lamp
    c.add_light(lampx + 16, lampy + 6, 64, .35, ystretch=2.2)
    c.add_light(mlamp[0], mlamp[1] + 2, 60, .58, falloff=1.5)             # Mabel's gooseneck
    c.add_light(64, 62, 72, .32, falloff=1.2)                             # corridor via the glass
    c.add_light(66, 100, 40, .34, ystretch=2.6)                           # spill under the door
    c.add_light(252, 40, 64, .22, falloff=1.2)                            # neon
    c.add_light(36, 118, 30, .14, ystretch=1.4)                           # warm glow up the stairwell
    c.glow(lampx, lampy - 12, 26, '#ffcf73', .55)
    c.glow(lampx, lampy - 14, 9, '#4dff95', .25)
    c.glow(mlamp[0], mlamp[1], 16, '#ffc066', .45)
    c.glow(64, 62, 34, '#ffd8a0', .22)
    c.glow(256, 42, 36, '#ff2850', .4)
    c.shadow_poly(p.quad([(rX0 - 4, 0, rz0), (rX1 + 4, 0, rz0), (rX1 + 6, 0, rz1 + 5), (rX0 - 6, 0, rz1 + 5)]), .5)
    c.shadow_poly(p.quad([(mX0 - 2, 0, mz0), (mX1 + 2, 0, mz0), (mX1 + 4, 0, mz1 + 4), (mX0 - 4, 0, mz1 + 4)]), .45)
    c.shadow_poly(p.quad([(150, 0, 0), (203, 0, 0), (203, 0, 18), (150, 0, 18)]), .4)
    c.shadow_ellipse(184, fy((cz0 + cz1) / 2) + 1, 13, 4, .45)
    c.shadow_poly(p.quad([(255, 0, sfz0 - 2), (276, 0, sfz0 - 2), (276, 0, sfz1 + 4), (253, 0, sfz1 + 4)]), .45)

    # --- venetian blind stripes from the neon, projected and occluded ---------------------
    win = (wx0, wx1, FLOOR - wy1, FLOOR - wy0)
    bent = None
    occl = [(rX0 - 1, rX1 + 1, 0, rH, rz0 - 1, rz1 + 1), (224, 248, 0, 45, 6, 18), (176, 192, 0, 27, cz0, cz1),
            (257, 276, 0, 19, sfz0, sfz1), (mX0, mX1, 0, mH, mz0 - 1, mz1 + 1), (150, 201, 0, 30, 0, 14)]
    xx, yy = A.grid(c)
    own = c.owner
    ids = {r['name']: r['id'] for r in sc.objects}

    def hmask(X0, X1, Z0, Z1, Y):
        m = np.zeros((H, W), bool)
        m_, r_ = c.poly_mask(p.quad([(X0, Y, Z0), (X1, Y, Z0), (X1, Y, Z1), (X0, Y, Z1)]))
        if m_ is not None:
            m[r_[1]:r_[3], r_[0]:r_[2]] = m_
        return m

    def lit_on(mask, Q, occ):
        return mask & A.blind_lit(Q, LIGHT, win, pitch=4, gap=2.0, bent=bent, occluders=occ)
    floor_m = (own == ids['_floor']) | (own == ids['_rug'])
    lit = lit_on(floor_m, A.inv_hplane(p, xx, yy, 0), occl)
    lit[1:] |= lit[:-1] & floor_m[1:]            # thicken the bands a little
    lit |= lit_on(hmask(rX0 - 1, rX1 + 1, rz0 - 1, rz1 + 1, rH), A.inv_hplane(p, xx, yy, rH), occl[1:2])
    lit |= lit_on(hmask(mX0, mX1, mz0 - 1, mz1 + 1, mH) & (own == ids['mabel_desk_o']), A.inv_hplane(p, xx, yy, mH), ())
    lit |= lit_on((own == ids['_lwall']) | (own == ids['_lwainscot']), A.inv_xplane(p, xx, yy, 44), occl)
    # light weakens with the distance travelled from the blinds: bright near the desk, soft far away
    Qf = A.inv_hplane(p, xx, yy, 0)
    dist = np.sqrt((Qf[0] - 236) ** 2 + (Qf[2]) ** 2 + 30 ** 2)
    strength = np.clip(1.25 - dist / 150, .35, 1.0)
    strength = np.where(floor_m, strength, .9)
    c.extra[lit] += .78 * strength[lit]
    haze = A.beam_haze(c, p, A.inv_hplane(p, xx, yy, 0), lit & floor_m, LIGHT, amount=.2, samples=3000, steps=48)
    A.tint_mask(c, (haze > .42) & ~lit & (c.emis < .5), 'haze', NEON, k=.26, lift=.06)
    A.tint_mask(c, lit & A.dither_field(np.clip(strength * 1.5, 0, 1)), 'neon', NEON, k=.72, lift=.3)
    # second source: the street lamp throws cooler bands across the right wall beside the window
    rw_m = (own == ids['_rwall']) | (own == ids['_rwainscot'])
    Qr = A.inv_xplane(p, xx, yy, 276)
    lit2 = rw_m & A.blind_lit(Qr, LIGHT2, win, pitch=4, gap=2.0, occluders=occl)
    d2 = np.clip(1.2 - Qr[2] / 90, .4, 1)
    c.extra[lit2] += .66 * d2[lit2]
    A.tint_mask(c, lit2 & A.dither_field(np.clip(d2 * 1.4, 0, 1)), 'street', STREET, k=.6, lift=.25)

    c.shade *= np.clip(1.18 - np.abs(np.arange(W)[None, :] - 168) / 270.0, .72, 1)
    c.shade *= np.clip(.8 + np.arange(H)[:, None] / 170.0, .8, 1)

    # =================================================== interaction geometry ============
    mx0, _ = P(mX0, 0, mz1)
    mx1, my1 = P(mX1, 0, mz1)
    gx0_, gy0_ = P(rX0, rH, rz0)
    gx1_, gy1_ = P(rX1, 0, rz1)
    chx0, chy0 = P(176, 27, cz1)
    chx1, chy1 = P(192, 0, cz1)
    sc.hotspot('exit_door', rect=(dx0 - 4, dy0 - 15, dx1 + 4, FLOOR), walk=(66, 102), face='up')
    sc.hotspot('exit_stairs_down', poly=[(int(x), int(y)) for x, y in A.side_quad(p, 44, 0, 50, sz0 - 3, sz1 + 3)],
               walk=(46, 120), face='left')
    sc.hotspot('window', rect=(wx0 - 4, wy0 - 4, wx1 + 4, 40), walk=(240, 122), face='up')
    sc.hotspot('blinds', rect=(wx0, 40, wx1, wy1 + 2), walk=(240, 122), face='up')
    sc.hotspot('calendar', rect=(cal[0] - 1, cal[1] - 3, cal[2] + 1, cal[3] + 1), walk=(120, 116), face='up')
    sc.hotspot('photo', rect=(173, 35, 197, 57), walk=(186, 108), face='up')
    sc.hotspot('filing_cabinet', rect=(fc[0][0] - 1, fc[0][1] - 9, fc[1][2] + 1, fc[1][3]), walk=(184, 108), face='up')
    sc.hotspot('cooler', rect=(150, 60, 168, 101), walk=(158, 108), face='up')
    sc.hotspot('coat_rack', rect=(88, cry - 50, 106, cry), walk=(92, 108), face='up')
    sc.hotspot('mabel_desk', rect=(mx0 - 1, int(p.P(0, mH, mz0)[1]) - 1, mx1 + 1, my1), walk=(124, 116), face='up')
    sc.hotspot('typewriter', rect=(115, tyb - 18, 136, tyb + 2), walk=(124, 116), face='up')
    sc.hotspot('fern', rect=(98, tyb - 14, 115, tyb + 3), walk=(108, 116), face='up')
    sc.hotspot('rook_desk', rect=(gx0_ - 2, gy0_ - 2, gx1_ + 2, gy1_), walk=(222, 122), face='up')
    sc.hotspot('drawer', rect=drawer_rect, walk=(256, 121), face='up')
    sc.hotspot('phone', rect=(phx - 9, phy - 10, phx + 9, phy + 1), walk=(252, 121), face='up')
    sc.hotspot('lamp', rect=(lampx - 9, lampy - 17, lampx + 9, lampy + 1), walk=(214, 122), face='up')
    sc.hotspot('client_chair', rect=(chx0 - 2, chy0 - 2, chx1 + 2, chy1 + 1), walk=(170, 128), face='right')
    sc.hotspot('safe', rect=(safe_rect[0] - 4, safe_rect[1] - 6, safe_rect[2] + 2, safe_rect[3] + 2), walk=(258, 138),
               face='right')

    fl = p.quad([(46, 0, 6), (274, 0, 6), (274, 0, zf), (46, 0, zf)])
    fp = lambda X0, X1, Z0, Z1: [(int(x), int(y)) for x, y in p.quad([(X0, 0, Z0), (X1, 0, Z0), (X1, 0, Z1), (X0, 0, Z1)])]
    holes = [fp(mX0 - 4, mX1 + 3, 0, mz1 + 3), fp(150, 204, 0, 16), fp(rX0 - 4, 278, 0, rz1 + 3),
             fp(174, 194, cz0 - 2, cz1 + 2), fp(253, 278, sfz0 - 2, sfz1 + 3), fp(88, 103, 4, 16)]
    sc.walkable([(int(x), int(y)) for x, y in fl], holes=holes)
    sc.point('start', 150, 124, 'down')
    sc.point('from_map', 66, 104, 'down')
    sc.point('from_hask', 48, 122, 'right')
    sc.point('mabel_spot', 128, 100, 'down')
    sc.point('client_spot', 166, 124, 'right')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, p.char_scale(FLOOR, 140), 140, 1.0)
    sc.meta['floor'] = 'wood'

    # ============================================================ animations ============
    sc.anim('fan', A.fan_frames(fanx + .5, fany + 1, R=27, ry=.34, blades=4, frames=4, ramp_name='a_walnut', lum=.6),
            fps=10, depth=200)
    sc.anim('smoke', A.smoke_frames(ash_x + 5, ash_y - 4, height=22, frames=8, lum=.55, drift=.25), fps=7,
            depth=fy(mz1 + 1))
    sc.anim('neon', A.owner_dim_frames(neon_oid, [1, 1, 1, 1, 1, .45, 1, .2, 1, 1, 1, 1]), fps=8, depth=1)
    sc.rain(wx0, wy0, wx1, wy1, kind='window')
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
