"""Kessler's Pharmacy (Ch2-7). Evening, rain outside, warm lamplight, red and green show globes."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, radial, noise2
from scene import Scene
from persp import Persp
import props_a as A

W, H = 320, 144
FLOOR = 96


def build():
    sc = Scene('pharmacy', W, H, seed=61)
    c = sc.c
    p = Persp(44, 276, 0, FLOOR, horizon=-60, depth=400)
    zf = p.z_at_floor_y(H + 2)
    zw = p.D * (1 - (p.cx - p.bx0) / (p.cx + 4))      # side walls reach past the screen edge
    P = lambda X, Y, Z: A.P(p, X, Y, Z)
    fy = lambda Z: int(p.P(0, 0, Z)[1])

    # ================================================================ shell ===========
    wall_fn = A.plaster(c, 0, 0, W, FLOOR, 'cream', base=.5, seed=13, stain=.05, top_dark=16, top_amt=.15)
    with sc.obj('_backwall'):
        c.rect(44, 0, 276, FLOOR, 'cream', wall_fn, dith=.5)
    with sc.obj('_lwall'):
        c.poly(A.side_quad(p, 44, 0, 160, 0, zw), 'cream', lambda xx, yy: wall_fn(xx, yy) - .1, dith=.5)
    with sc.obj('_rwall'):
        c.poly(A.side_quad(p, 276, 0, 160, 0, zw), 'cream', lambda xx, yy: wall_fn(xx, yy) - .08, dith=.5)
    c.rect(44, 0, 276, 5, 'a_walnut', .42, dith=0)                            # cornice
    c.hline(44, 276, 5, 'a_walnut', .65)
    for X in (44, 276):
        a, b = p.P(X, FLOOR - 5, 0), p.P(X, FLOOR - 5, zw)
        c.line(a[0], a[1], b[0], b[1], 'a_walnut', .55)
    A.wainscot_side(c, p, 44, zw, h=26, rmp='a_walnut', lum=.36, panel=24)
    A.wainscot_side(c, p, 276, zw, h=26, rmp='a_walnut', lum=.4, panel=24)

    # white mosaic floor with a black border band
    fq = p.quad([(44, 0, 0), (276, 0, 0), (276, 0, zf), (44, 0, zf)])
    N = noise2(W, H, 6, 5, 2)

    def floorfn(xx, yy):
        X, _, Z = A.inv_hplane(p, xx, yy)
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        size = 5.0
        fx = (X - 44) / size - np.floor((X - 44) / size)
        fz = Z / size - np.floor(Z / size)
        gw = .75 / s / size
        g = (fx < gw) | (fz < gw * 1.2)
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = .56 + (N[yi, xi] - .5) * .08 + (((np.floor((X - 44) / size) + np.floor(Z / size)) % 7) == 0) * .06
        return np.where(g, .34, L)
    with sc.obj('_floor'):
        c.poly(fq, 'cream', floorfn, dith=.3)
        m, r = c.poly_mask(fq)
        yy_, xx_ = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32) + .5
        X_, _, Z_ = A.inv_hplane(p, xx_, yy_)
        band = m & (((X_ > 50) & (X_ < 56)) | ((X_ > 264) & (X_ < 270)) | ((Z_ > 4) & (Z_ < 9)))
        c._apply(band, 'black', .9, region=r, dith=0)

    # =========================================== back wall: diploma, calendar, shelves =
    A.framed_photo(c, 48, 14, 70, 32, frame='gold',
                   inner=lambda a, b, cc, d: (c.rect(a, b, cc, d, 'paper', .85, dith=0),
                                              A.scribble(c, a + 2, b + 2, cc - 2, 'black', .45, seed=4),
                                              A.scribble(c, a + 3, b + 5, cc - 3, 'black', .5, seed=5),
                                              A.scribble(c, a + 2, b + 8, cc - 4, 'black', .5, seed=6),
                                              c.ellipse(cc - 3, d - 2, 1.6, 1.6, 'red', .6, dith=0)))
    with sc.obj('_shelvesL'):
        A.jar_shelves(c, 74, 8, 140, 70, shelves=4, seed=3, rmp='a_walnut', lum=.48)
    with sc.obj('_shelvesR'):
        A.jar_shelves(c, 180, 8, 234, 70, shelves=4, seed=8, rmp='a_walnut', lum=.48)
    # crown over the shelving
    c.rect(72, 5, 236, 9, 'a_walnut', .55, dith=0)
    c.hline(72, 236, 5, 'a_walnut', .78)

    # ----------------------------------------------------- lab doorway + bead curtain -
    lx0, lx1, ly0 = 142, 178, 46
    with sc.obj('_labdoor'):
        c.rect(lx0 - 4, ly0 - 10, lx1 + 4, FLOOR, 'a_walnut', .5, dith=0)
        c.ellipse((lx0 + lx1) / 2, ly0 + 2, (lx1 - lx0) / 2 + 4, 12, 'a_walnut', .5, dith=0)
        c.hline(lx0 - 4, lx1 + 4, ly0 - 10, 'a_walnut', .75)
        # the lab beyond: white tiles, a cool lamp, a glimpse of glassware
        m_, r_ = c.ellipse_mask((lx0 + lx1) / 2, ly0 + 2, (lx1 - lx0) / 2, 10)
        arch = np.zeros((H, W), bool)
        arch[r_[1]:r_[3], r_[0]:r_[2]] = m_
        arch[ly0 + 2:FLOOR, lx0:lx1] = True
        c._apply(arch[r_[1]:FLOOR, lx0 - 4:lx1 + 4], 'a_fluor', .5, emis=.5,
                 region=(lx0 - 4, r_[1], lx1 + 4, FLOOR), dith=.5)
        c.rect(lx0 + 4, 54, lx1 - 4, 60, 'tile', .55, emis=.4)                # lab bench
        for k in range(4):
            c.rect(lx0 + 7 + k * 6, 48, lx0 + 9 + k * 6, 54, 'a_jarglass', .7, emis=.5)
        c.put(lx0 + 20, 46, 'a_globe_g', .9, emis=1)
    pre_beads = A.snapshot(c)
    with sc.obj('_beads'):
        A.bead_curtain(c, lx0, ly0 - 6, lx1, FLOOR - 1, seed=4, sway=0)
    bead_oid = sc.objects[-1]['id']
    # restore the arch shape over the beads' top corners
    c.ellipse((lx0 + lx1) / 2, ly0 - 9, (lx1 - lx0) / 2 + 3, 4, 'a_walnut', .5, dith=0)
    c.rect(lx0 - 2, ly0 - 12, lx1 + 2, ly0 - 8, 'a_walnut', .5, dith=0)
    for x in range(lx0, lx1):
        t = (x - (lx0 + lx1) / 2) / ((lx1 - lx0) / 2)
        ytop = int(ly0 + 2 - 10 * math.sqrt(max(0, 1 - t * t)))
        c.rect(x, ly0 - 8, x + 1, ytop, 'a_walnut', .5)
    # carved pediment between the shelf units, with a gilt mortar-and-pestle emblem
    c.rect(lx0 - 6, 8, lx1 + 6, ly0 - 26, 'a_walnut', .4, dith=.2)
    c.ellipse((lx0 + lx1) / 2, ly0 - 26, (lx1 - lx0) / 2 + 2, 9, 'a_walnut', .5, dith=.2)
    c.hline(lx0 - 6, lx1 + 6, 8, 'a_walnut', .7)
    ex_, ey_ = (lx0 + lx1) // 2, ly0 - 31
    c.ellipse(ex_, ey_ + 1, 4.4, 2.6, 'gold', .65, dith=0)                    # the mortar bowl
    c.rect(ex_ - 4, ey_ - 1, ex_ + 5, ey_ + 1, 'gold', .5, dith=0)
    c.rect(ex_ - 2, ey_ + 3, ex_ + 3, ey_ + 5, 'gold', .55, dith=0)           # foot
    c.line(ex_ + 1, ey_, ex_ + 5, ey_ - 6, 'gold', .8)                        # pestle
    c.put(ex_ + 5, ey_ - 7, 'gold', .95)
    for sx_ in (-12, 12):
        c.line(ex_ + sx_ - 3, ey_ + 2, ex_ + sx_ + 3, ey_ - 1, 'gold', .45)  # scroll flourishes
    # name board over the arch
    c.rect(lx0 - 8, ly0 - 26, lx1 + 8, ly0 - 15, 'a_walnut', .35, dith=0)
    c.hline(lx0 - 8, lx1 + 8, ly0 - 26, 'a_walnut', .6)
    A.text(c, (lx0 + lx1) // 2 - A.text_w('KESSLER') // 2, ly0 - 23, 'KESSLER', 'gold', .72)
    c.hline(lx0 - 4, lx1 + 4, ly0 - 17, 'gold', .5)

    # ------------------------------------------------------------ poison cabinet -----
    px0, py0, px1, py1 = 238, 18, 268, 62
    with sc.obj('_poison'):
        c.rect(px0 - 2, py0 - 3, px1 + 2, py1 + 2, 'a_walnut', .32, dith=0)
        c.hline(px0 - 2, px1 + 2, py0 - 3, 'a_walnut', .55)
        c.rect(px0, py0, px1, py1, 'black', .25, dith=0)
        rng = np.random.default_rng(7)
        for sy in (py0 + 13, py0 + 26, py1 - 2):
            c.hline(px0, px1, sy, 'a_walnut', .45)
            x = px0 + 2
            while x < px1 - 4:
                w = int(rng.integers(2, 4))
                h = int(rng.integers(5, 10))
                c.rect(x, sy - h, x + w, sy, ['night', 'a_amberglass', 'a_globe_g'][int(rng.integers(0, 3))], .4,
                       dith=0)
                c.put(x, sy - h - 1, 'black', .3)
                x += w + 1
        # glass door: frame + reflection, red POISON label with skull, padlock
        c.rect(px0, py0, px1, py0 + 1, 'a_walnut', .5)
        c.vline((px0 + px1) // 2, py0, py1, 'a_walnut', .45)
        for k in range(3):
            c.put(px0 + 2 + k, py0 + 8 - k, 'white', .6)
            c.put(px0 + 17 + k, py0 + 10 - k, 'white', .5)
        c.rect(px0 + 3, py0 + 15, px1 - 3, py0 + 23, 'red', .55, dith=0)
        c.hline(px0 + 3, px1 - 3, py0 + 15, 'red', .75)
        A.text(c, (px0 + px1) // 2 - A.text_w('POISON') // 2, py0 + 17, 'POISON', 'paper', .85)
        sx_, sy_ = (px0 + px1) // 2, py0 + 5
        c.rect(sx_ - 2, sy_ - 2, sx_ + 3, sy_ + 2, 'white', .85, dith=0)        # skull
        c.put(sx_ - 1, sy_ - 1, 'black', .1)
        c.put(sx_ + 1, sy_ - 1, 'black', .1)
        c.line(sx_ - 3, sy_ + 3, sx_ + 3, sy_ + 5, 'white', .75)
        c.line(sx_ + 3, sy_ + 3, sx_ - 3, sy_ + 5, 'white', .75)
        A.padlock_icon(c, (px0 + px1) // 2 - 2, py1 - 12, 'brass', .7, size=2)

    # calendar on the right wall, foreshortened (drawn flat then squeezed into perspective)
    cq = A.side_quad(p, 276, 44, 76, 8, 24)
    c.poly(cq, 'paper', .8, dith=0)
    hq = A.side_quad(p, 276, 68, 76, 8, 24)
    c.poly(hq, 'red', .55, dith=0)
    for Y in (50, 54, 58, 62):
        a_, b_ = P(276, Y, 10), P(276, Y, 22)
        c.line(a_[0], a_[1], b_[0], b_[1], 'black', .45)
    cxx_, cyy_ = P(276, 59, 16)
    c.put(cxx_, cyy_, 'blood', .8)
    c.put(cxx_, cyy_ - 2, 'blood', .8)
    cal_q = [(int(x), int(y)) for x, y in cq]

    # ============================================================== the counter =========
    cz0, cz1, cX0, cX1, cH = 24, 38, 72, 236, 22
    with sc.obj('counter_o', baseline=fy(cz1) + 1):
        A.box(c, p, cX0, cX1, 0, cH - 3, cz0, cz1, 'a_walnut', .52, side=.36)
        A.box(c, p, cX0 - 1.5, cX1 + 1.5, cH - 3, cH, cz0 - 1.5, cz1 + 1.5, 'a_marble', .7, top=.8, side=.55)
        fx0, fy0 = P(cX0, cH - 3, cz1)
        fx1, fy1 = P(cX1, 0, cz1)
        n = 6
        pw = (fx1 - fx0 - 4) / n
        for i in range(n):
            a = int(fx0 + 2 + i * pw) + 1
            b = int(fx0 + 2 + (i + 1) * pw) - 1
            c.rect(a, fy0 + 3, b, fy1 - 4, 'a_walnut', .47, dith=.2)
            c.hline(a, b, fy0 + 3, 'a_walnut', .26)
            c.vline(a, fy0 + 3, fy1 - 4, 'a_walnut', .28)
            c.hline(a, b, fy1 - 5, 'a_walnut', .62)
            c.vline(b - 1, fy0 + 3, fy1 - 4, 'a_walnut', .58)
            # carved roundel
            c.ellipse((a + b) / 2, (fy0 + fy1) / 2, 2.2, 2.2, 'a_walnut', .55, dith=0)
        c.rect(fx0, fy1 - 3, fx1, fy1, 'black', .55, dith=0)
        a_, b_ = P(cX0 - 1.5, cH, cz1 + 1.5), P(cX1 + 1.5, cH, cz1 + 1.5)
        c.hline(a_[0], b_[0], a_[1], 'a_marble', .95)
        # marble veins on the top
        for k in range(6):
            va = P(cX0 + 10 + k * 27, cH, cz0)
            vb = P(cX0 + 24 + k * 27, cH, cz1)
            c.line(va[0], va[1], vb[0], vb[1], 'a_marble', .5)
    with sc.obj('counter_items', baseline=fy(cz1) + 1):
        # brass apothecary scales
        scx, scy = P(98, cH, 31)
        c.rect(scx - 6, scy - 2, scx + 7, scy, 'a_walnut', .5, dith=0)
        c.rect(scx, scy - 14, scx + 1, scy - 2, 'brass', .65, dith=0)
        c.line(scx - 8, scy - 12, scx + 9, scy - 13, 'brass', .75)
        c.put(scx, scy - 15, 'brass', .95)
        for (pxs, pys) in ((scx - 8, scy - 12), (scx + 9, scy - 13)):
            c.line(pxs, pys, pxs - 2, pys + 6, 'brass', .45)
            c.line(pxs, pys, pxs + 2, pys + 6, 'brass', .45)
            c.ellipse(pxs, pys + 7, 3.4, 1.2, 'brass', .7, dith=0)
        c.rect(scx + 7, scy - 8, scx + 9, scy - 6, 'brass', .9, dith=0)            # weight on the pan
        # counter bell
        bx_, by_ = P(222, cH, 33)
        A.desk_bell(c, bx_, by_)
        # mortar and pestle, a jar of peppermints, the prescription book
        mx_, my_ = P(124, cH, 30)
        c.ellipse(mx_, my_ - 2, 3.4, 2.6, 'white', .7, dith=0)
        c.ellipse(mx_, my_ - 4, 3, .9, 'white', .4, dith=0)
        c.line(mx_ + 1, my_ - 4, mx_ + 4, my_ - 9, 'white', .82)
        jx_, jy_ = P(140, cH, 28)
        c.rect(jx_ - 3, jy_ - 9, jx_ + 3, jy_, 'glass', .55, emis=.2, dith=.2)
        for k in range(5):
            c.put(jx_ - 2 + k, jy_ - 2 - (k % 2) * 2, 'red' if k % 2 else 'white', .75)
            c.put(jx_ - 2 + (k + 2) % 5, jy_ - 5, 'white' if k % 2 else 'red', .7)
        c.rect(jx_ - 3, jy_ - 11, jx_ + 3, jy_ - 9, 'chrome', .6, dith=0)
        pbx, pby = P(200, cH, 35)
        A.open_book(c, pbx, pby, w=14, h=4)
        # card: Rx
        rcx, rcy = P(160, cH, 34)
        c.rect(rcx - 4, rcy - 6, rcx + 4, rcy - 1, 'paper', .85, dith=0)
        A.text(c, rcx - 3, rcy - 6, 'RX', 'red', .55)

    # ======================================================== window + show globes ======
    wz0, wz1 = 12, 62
    with sc.obj('_window'):
        c.poly(A.side_quad(p, 44, 24, 88, wz0 - 3, wz1 + 3), 'a_walnut', .45, dith=0)
        wq = A.side_quad(p, 44, 27, 85, wz0, wz1)
        ys = [y for _, y in wq]
        c.poly(wq, 'night', vgrad(min(ys), max(ys), .38, .22), emis=.8, dith=.5)
        # street lamp glow + wet reflections seen through the glass
        lx_, ly_ = P(44, 70, 30)
        c.put(lx_, ly_, 'lamp', 1.0, emis=1)
        c.put(lx_, ly_ + 1, 'lamp', .8, emis=1)
        for Z in range(wz0 + 3, wz1 - 2, 5):
            a_, b_ = P(44, 30, Z), P(44, 36, Z + 1)
            c.line(a_[0], a_[1], b_[0], b_[1], 'water', .55, emis=.6)
        for Z in (28, 45):
            a_, b_ = P(44, 27, Z), P(44, 85, Z)
            c.line(a_[0], a_[1], b_[0], b_[1], 'a_walnut', .45)
        xs = [x for x, _ in wq]
        A.rain_streaks(c, int(min(xs)) + 1, int(min(ys)) + 1, int(max(xs)) - 1, int(max(ys)) - 2, seed=5, n=20)
        # display ledge
        c.poly(p.quad([(44, 26, wz0), (64, 26, wz0), (64, 26, wz1), (44, 26, wz1)]), 'a_walnut', .58, dith=0)
        fl_a, fl_b = P(64, 26, wz0), P(64, 26, wz1)
        c.line(fl_a[0], fl_a[1], fl_b[0], fl_b[1], 'a_walnut', .75)
        q2 = p.quad([(64, 0, wz1), (64, 26, wz1), (44, 26, wz1), (44, 0, wz1)])
        c.poly(q2, 'a_walnut', .42, dith=.2)
    win_box = (int(min(xs)), int(min(ys)), int(max(xs)) + 1, int(max(ys)) + 1)
    globes = []
    for (Z, rmp, col) in ((24, 'a_globe_r', '#ff2a3a'), (50, 'a_globe_g', '#2cff70')):
        gx, gy = p.P(54, 46, Z)
        rr = 8 * p.s(Z)
        with sc.obj('_globe'):
            A.show_globe(c, gx, gy, rr, rmp, on=True)
        globes.append((gx, gy, rr, col))

    # ======================================================= street door (left wall) ===
    dz0, dz1 = 72, 96
    with sc.obj('_door'):
        c.poly(A.side_quad(p, 44, 0, 50, dz0 - 3, dz1 + 3), 'a_walnut', .4, dith=0)
        c.poly(A.side_quad(p, 44, 0, 47, dz0, dz1), 'a_walnut', .5, dith=.2)
        gq = A.side_quad(p, 44, 18, 43, dz0 + 3, dz1 - 3)
        c.poly(gq, 'night', .3, emis=.75, dith=.4)
        a_, b_ = P(44, 26, dz0 + 3), P(44, 26, dz1 - 3)
        c.line(a_[0], a_[1], b_[0], b_[1], 'gold', .55)
        bx2, by2 = P(44, 52, dz0 + 5)
        c.ellipse(bx2 + 2, by2 + 4, 1.8, 1.8, 'brass', .75, dith=0)
        c.line(bx2, by2, bx2 + 2, by2 + 3, 'brass', .6)

    # ================================================== newspaper rack + penny scale ====
    with sc.obj('rack_o', baseline=fy(78) + 1):
        rx0_, ry0_ = P(258, 30, 76)
        rx1_, ry1_ = P(274, 0, 76)
        for xx in (rx0_, rx1_):
            c.vline(xx, ry0_, ry1_, 'a_iron', .5)
        for k in range(3):
            yy = ry0_ + 3 + k * 9
            c.hline(rx0_, rx1_, yy + 6, 'a_iron', .55)
            for j, xx in enumerate(range(rx0_ + 1, rx1_ - 3, 6)):
                c.rect(xx, yy, xx + 6, yy + 7, 'paper', .7 + .06 * ((j + k) % 2), dith=0)
                c.hline(xx + 1, xx + 5, yy + 1, 'black', .4)
                A.scribble(c, xx + 1, yy + 3, xx + 5, 'black', .5, seed=j + k)
        c.rect(rx0_ - 1, ry0_ - 6, rx1_ + 1, ry0_ - 1, 'red', .55, dith=0)
        A.text(c, rx0_ + 1, ry0_ - 6, 'NEWS', 'paper', .85) if A.text_w('NEWS') <= rx1_ - rx0_ else None
        rack_rect = (rx0_ - 2, ry0_ - 7, rx1_ + 2, ry1_)
    with sc.obj('scale_o', baseline=fy(50) + 1):
        psx, psy = P(266, 0, 48)
        A.penny_scale(c, psx, psy)

    # pendant lamps over the counter
    pend = [(106, 30), (214, 30)]
    for (lx_, ly_) in pend:
        c.vline(lx_, 0, ly_ - 6, 'black', .35)
        c.ellipse(lx_, ly_ - 3, 5, 4.5, 'white', radial(lx_ - 1, ly_ - 4, 6, 1.0, .7), emis=1, dith=.3)
        c.rect(lx_ - 2, ly_ - 9, lx_ + 3, ly_ - 7, 'brass', .6, dith=0)

    # ============================================================= lighting =============
    c.ambient = .42
    for (lx_, ly_) in pend:
        c.add_light(lx_, ly_ + 4, 100, .5, falloff=1.35)
        c.add_light(lx_ + (6 if lx_ > 160 else -6), 124, 56, .28, ystretch=2.4)      # pool on the tiles
        c.glow(lx_, ly_ - 3, 20, '#ffe2a8', .5)
    c.add_light(160, 80, 50, .25, falloff=1.3)                         # lab light through the beads
    c.glow(160, 50, 26, '#c8ffd8', .18)
    for gx, gy, rr, col in globes:
        c.add_light(gx, gy, 46, .3, falloff=1.4)
        c.glow(gx, gy, rr * 2.6, col, .5)
    c.add_light(30, 50, 60, .2)                                        # street through the window
    # coloured pools from the globes on the tiles (dithered tints)
    xx, yy = A.grid(c)
    ids = {r['name']: r['id'] for r in sc.objects}
    fl_m = c.owner == ids['_floor']
    for (gx, gy, rr, col), tag, Z in zip(globes, ('gred', 'ggreen'), (24, 50)):
        fx_, fy_ = p.P(72, 0, Z + 8)
        fld = np.clip(1 - np.sqrt(((xx - fx_) / 40) ** 2 + ((yy - fy_) / 13) ** 2), 0, 1)
        A.tint_mask(c, fl_m & A.dither_field(fld * 2.2), tag, col, k=.65, lift=.3)
        c.extra[fl_m] += (fld[fl_m] ** 1.3) * .22
    c.shadow_poly(p.quad([(cX0 - 3, 0, cz0), (cX1 + 3, 0, cz0), (cX1 + 4, 0, cz1 + 6), (cX0 - 4, 0, cz1 + 6)]), .5)
    c.shadow_ellipse(278, fy(50), 10, 3, .4)
    c.shade *= np.clip(1.2 - np.abs(np.arange(W)[None, :] - 160) / 230.0, .7, 1)
    c.shade *= np.clip(1.0 - (np.arange(H)[:, None] - 120) / 26.0 * .22, .78, 1)

    # =================================================== interaction geometry ==========
    sc.hotspot('exit_street', poly=[(int(x), int(y)) for x, y in A.side_quad(p, 44, 0, 50, dz0 - 3, dz1 + 3)],
               walk=(24, 132), face='left')
    sc.hotspot('shelves', poly=[(72, 6), (236, 6), (236, 72), (lx1 + 4, 72), (lx1 + 4, ly0 - 26), (lx0 - 4, ly0 - 26),
                                (lx0 - 4, 72), (72, 72)], walk=(130, 120), face='up')
    cx0_, cy0_ = P(cX0, cH, cz0)
    cx1_, cy1_ = P(cX1, 0, cz1)
    sc.hotspot('counter', rect=(int(p.P(cX0, 0, cz1)[0]), cy0_ - 1, cx1_ + 1, cy1_), walk=(170, 120), face='up')
    sc.hotspot('lab_door', rect=(lx0 - 4, ly0 - 26, lx1 + 4, cy0_ - 1), walk=(160, 120), face='up')
    sc.hotspot('poison_cabinet', rect=(px0 - 2, py0 - 3, px1 + 2, py1 + 2), walk=(244, 120), face='up')
    g0, g1 = globes
    sc.hotspot('globes', rect=(int(g1[0] - g1[2]) - 2, int(g0[1] - g0[2]) - 4, int(g0[0] + g0[2]) + 3,
                               int(g1[1] + g1[2]) + 8), walk=(66, 116), face='left')
    sc.hotspot('newspapers', rect=rack_rect, walk=(268, 140), face='right')
    sc.hotspot('scales', rect=(scx - 12, scy - 17, scx + 13, scy + 1), walk=(100, 120), face='up')
    sc.hotspot('bell', rect=(bx_ - 5, by_ - 8, bx_ + 5, by_ + 1), walk=(220, 120), face='up')

    poly = [P(46, 0, cz1 + 4), P(274, 0, cz1 + 4), P(274, 0, zf), P(46, 0, zf)]
    fp = lambda X0, X1, Z0, Z1: [(int(x), int(y)) for x, y in p.quad([(X0, 0, Z0), (X1, 0, Z0), (X1, 0, Z1), (X0, 0, Z1)])]
    holes = [fp(250, 280, 70, 82), fp(256, 280, 42, 54), fp(40, 66, 8, 66)]
    sc.walkable([(int(x), int(y)) for x, y in poly], holes=holes)
    sc.point('start', 160, 128, 'down')
    sc.point('from_map', 30, 132, 'right')
    sc.point('kessler_spot', 168, 100, 'down')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, p.char_scale(FLOOR, 140), 140, 1.0)
    sc.meta['floor'] = 'tile'

    # ================================================================ anims ==============
    counter_top = int(p.P(0, cH, cz0)[1]) - 2
    bead_m = (c.owner == bead_oid)
    bead_m[counter_top:, :] = False

    def bead_frame(sway):
        def fn(cc):
            keep = {k: getattr(cc, k).copy() for k in ('rid', 'lum', 'emis', 'dith')}
            own0 = cc.owner.copy()
            for k, v in pre_beads.items():
                getattr(cc, k)[bead_m] = v[bead_m]
            A.bead_curtain(cc, lx0, ly0 - 6, lx1, counter_top, seed=4, sway=sway)
            outside = ~bead_m
            for k, v in keep.items():
                getattr(cc, k)[outside] = v[outside]
            cc.owner[outside] = own0[outside]
            cc.owner[bead_m] = cc.cur_owner
        return fn
    sc.anim('beads', [bead_frame(s_) for s_ in (0, 1.2, 2.0, 1.2, 0, -1.0)], fps=5, depth=10)
    sc.rain(win_box[0], win_box[1], win_box[2], win_box[3], kind='window')
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
