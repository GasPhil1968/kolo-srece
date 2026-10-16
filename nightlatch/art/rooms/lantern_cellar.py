"""Chapter 6 - the Blue Lantern's Prohibition cellar.  Brick vaults, grey dawn through a pavement
grating, one weak bulb by the stairs.  The wine rack hides the old smugglers' tunnel."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
from persp import Persp, floor_poly
import props_b as B

W, H = 320, 144
FLOOR = 100
SEED = 41


def P_():
    return Persp(20, 300, 0, FLOOR, horizon=-52, depth=380)


def arch_mask(cx, spring_y, rx, ry, x0, x1, y_bottom):
    """Mask fn for an opening: rectangle below spring_y, semi-ellipse above."""
    def m(xx, yy):
        rect = (xx >= x0) & (xx < x1) & (yy >= spring_y) & (yy < y_bottom)
        top = (((xx - cx) / rx) ** 2 + ((yy - spring_y) / ry) ** 2 <= 1) & (yy < spring_y)
        return rect | top
    return m


def voussoirs(c, cx, cy, r_in, r_out, a0, a1, n, ramp='brick', lum=.5, seed=3, key=True):
    """Ring of wedge bricks around an arch (angles in degrees, 180 = left, 360 = right, y up)."""
    rng = np.random.default_rng(seed)
    for k in range(n):
        t0 = math.radians(a0 + (a1 - a0) * k / n)
        t1 = math.radians(a0 + (a1 - a0) * (k + 1) / n)
        pts = [(cx + math.cos(t0) * r_in, cy + math.sin(t0) * r_in), (cx + math.cos(t0) * r_out, cy + math.sin(t0) * r_out),
               (cx + math.cos(t1) * r_out, cy + math.sin(t1) * r_out), (cx + math.cos(t1) * r_in, cy + math.sin(t1) * r_in)]
        L = lum + (rng.random() - .5) * .14
        if key and k == n // 2:
            L += .08
        c.poly(pts, ramp, L)
        c.line(pts[0][0], pts[0][1], pts[1][0], pts[1][1], ramp, .18)


def vault_top(c, p):
    """End wall of the barrel vault: the back wall ends in a shallow curve; above it the vault's
    underside recedes towards us in deep shadow (brick courses converging on the vanishing point)."""
    cx, cy, r = 160, 360, 350          # circle through ~(20, 12), (160, 10), (300, 12)
    def curve_y(x):
        return cy - math.sqrt(max(0, r * r - (x - cx) ** 2))

    def vfn(xx, yy):
        # angle from the vanishing point gives the course; distance gives the transverse joints
        ang = np.arctan2(yy - p.hy, xx - p.cx)
        dist = np.sqrt((xx - p.cx) ** 2 + (yy - p.hy) ** 2)
        k = np.floor(ang * 60)
        fr = ang * 60 - k
        L = .26 + (B.H(k, 5) - .5) * .08
        L = np.where(fr < .14, .1, L)
        j = (np.log(dist) * 16 + (k % 2) * .5) % 1.0
        L = np.where(j < .1, .12, L)
        return L - np.clip((curve_y(160) + 12 - yy) / 40, 0, .1)

    def vmask(xx, yy):
        return yy < (cy - np.sqrt(np.maximum(0, r * r - (xx - cx) ** 2)))
    r_ = c.clip_region(0, 0, W, 40)
    yy, xx = np.mgrid[r_[1]:r_[3], r_[0]:r_[2]].astype(np.float32) + .5
    m = vmask(xx, yy)
    c._apply(m, 'brick', vfn, region=r_)
    # the arch ring (header bricks) along the curve
    for x in range(0, W):
        y = curve_y(x + .5)
        c.put(x, int(round(y)), 'brick', .22)
        c.put(x, int(round(y)) + 1, 'brick', .58 if (x // 5) % 2 else .5)
        c.put(x, int(round(y)) + 2, 'brick', .46)
    return curve_y


def paint(sc, st):
    c = sc.c
    p = P_()
    zfront = p.z_at_floor_y(H + 2)
    g = {}

    # ================================================================ back wall ====
    B.bricks(c, 20, 0, 300, FLOOR, 'brick', bw=8, bh=4, base=.44, var=.1, mortar=.2, seed=4, grime=.12)
    N = noise2(W, H, 5, 9, 2)
    B.veil(c, 20, FLOOR - 16, 300, FLOOR, lambda xx, yy: np.clip((yy - (FLOOR - 16)) / 16, 0, 1) * .45 *
           (0.4 + N[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)]), 'concrete', .4)
    for X, base in ((20, .3), (300, .28)):
        pts = p.quad([(X, 0, 0), (X, 0, zfront), (X, 150, zfront), (X, 150, 0)])

        def sidefn(xx, yy, X=X, base=base):
            s = np.maximum((xx - p.cx) / (X - p.cx), 1e-3)
            Z = p.D * (1 - 1 / s)
            Y = p.E - (yy - p.hy) / s
            ry_ = np.floor(Y / 4)
            sh = (ry_ % 2) * 4
            rz = np.floor((Z + sh) / 8)
            fz = (Z + sh) - rz * 8
            fy = Y - ry_ * 4
            L = base + (B.H(rz, ry_) - .5) * .12
            L = np.where((fy < 1) | (fz < 1.2 / s), .14, L)
            return L
        c.poly(pts, 'brick', sidefn)
    curve_y = vault_top(c, p)
    # floor: old flagstones, damp
    fl = floor_poly(p, 20, 300, 0, zfront)
    Nf = noise2(W, H, 7, 12, 3)

    def floorfn(xx, yy):
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        X = p.cx + (xx - p.cx) / s
        Z = p.D * (1 - 1 / s)
        row = np.floor(Z / 18)
        sh = (row % 2) * 13
        col = np.floor((X + sh) / 26)
        fx = (X + sh) - col * 26
        fz = Z - row * 18
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = .4 + (B.H(col, row) - .5) * .12 + (Nf[yi, xi] - .5) * .12
        L = np.where((fx < 1.1 / s) | (fz < 1.1 / s * 1.4), .17, L)
        return L
    c.poly(fl, 'concrete', floorfn)
    # a puddle under the grating
    px_, py_ = p.P(262, 0, 44)
    c.ellipse(px_, py_, 14, 3, 'water', .3, dith=.3)
    c.ellipse(px_ + 2, py_, 9, 2, 'water', .42, dith=.2)

    # =========================================================== stairs + door ====
    land_y = FLOOR - 44
    sx_bot, sx_top = 106, 56
    g['stairs'] = (sx_top, land_y, sx_bot, FLOOR)
    n = 9
    rise = (FLOOR - land_y) / n
    run = (sx_bot - sx_top) / n
    c.poly([(sx_top, land_y + 3), (sx_bot, FLOOR), (sx_top, FLOOR)], 'brick', .16)
    for k in range(n):
        x1 = sx_bot - k * run
        x0 = x1 - run - 3
        y = FLOOR - (k + 1) * rise
        c.rect(int(x0), int(y), int(x1) + 1, int(y + 2), 'oak', .6)
        c.hline(int(x0), int(x1) + 1, int(y), 'oak', .82)
        c.rect(int(x0) + 1, int(y + 2), int(x1), int(y + rise), 'oak', .26)
        c.put(int(x1), int(y) + 1, 'oak', .2)
    c.line(sx_bot + 2, FLOOR, sx_top - 2, land_y + 2, 'oak', .46)
    c.line(sx_bot + 2, FLOOR - 1, sx_top - 2, land_y + 1, 'oak', .34)
    c.rect(20, land_y, sx_top + 2, land_y + 3, 'oak', .56)
    c.hline(20, sx_top + 2, land_y, 'oak', .76)
    c.vline(sx_top, land_y + 3, FLOOR, 'oak', .32)
    c.vline(23, land_y + 3, FLOOR, 'oak', .28)
    dx0, dx1 = 26, 50
    dy0 = land_y - 45
    g['door'] = (dx0, dy0, dx1, land_y)
    c.rect(dx0 - 3, dy0 - 3, dx1 + 3, land_y, 'oak', .3)
    B.planks_v(c, dx0, dy0, dx1, land_y, 'oak', pw=4, base=.42, seed=5)
    c.rect(dx0, dy0 + 6, dx1, dy0 + 8, 'oak', .28)
    c.rect(dx0, land_y - 9, dx1, land_y - 7, 'oak', .28)
    c.line(dx0 + 1, land_y - 8, dx1 - 2, dy0 + 8, 'oak', .3)
    c.hline(dx0 + 1, dx1 - 1, land_y - 1, 'b_sodium', .6, emis=1)
    c.put(dx1 - 5, dy0 + 24, 'b_sodium', .75, emis=1)                  # keyhole light
    for hy in (dy0 + 4, land_y - 12):
        c.rect(dx0, hy, dx0 + 12, hy + 2, 'steel', .35)
        c.put(dx0 + 1, hy, 'steel', .6)
    # handrail
    c.line(sx_bot + 3, FLOOR - 24, sx_top + 1, land_y - 22, 'oak', .62)
    c.line(sx_bot + 3, FLOOR - 23, sx_top + 1, land_y - 21, 'oak', .34)
    c.vline(sx_bot + 3, FLOOR - 24, FLOOR, 'oak', .46)
    c.vline(sx_top + 1, land_y - 22, land_y, 'oak', .46)
    # barrels racked under the stairs (ends facing us)
    bb = FLOOR - 1
    g['barrels'] = (62, FLOOR - 33, 100, FLOOR)
    c.rect(60, bb - 1, 102, bb + 1, 'oak', .3)
    for (cx_, cy_, r_, ch) in ((69, bb - 8, 8, 'XX'), (86, bb - 8, 8, None), (77.5, bb - 23, 8, '24')):
        B.barrel_end(c, cx_, cy_, r_, 'oak', .52, chalk=ch)
    c.put(92, bb - 26, 'paper', .4)                                    # cobweb anchor
    B.cobweb(c, sx_top + 1, land_y + 4, 10, 1, 1, 'fog', .45)
    # hurricane-lantern hook on the wall beside the stairs foot
    hkx, hky = 112, 58
    g['hook'] = (hkx, hky)
    c.rect(hkx - 1, hky - 2, hkx + 2, hky, 'steel', .5)
    c.line(hkx, hky, hkx + 2, hky + 3, 'steel', .62)
    c.put(hkx + 1, hky + 4, 'steel', .55)
    # the bare bulb on a cord by the stairs
    blx, bly = 88, 26
    g['bulb'] = (blx, bly)
    c.vline(blx, 0, bly - 2, 'ink', .4)
    c.rect(blx - 1, bly - 3, blx + 2, bly - 1, 'brass', .5)
    c.ellipse(blx + .5, bly + 1, 2, 2.4, 'lamp', .9, emis=1)

    # ==================================================== mural (mermaid + lantern) ====
    mx0, my0, mx1, my1 = 118, 12, 200, 50
    g['mural'] = (mx0, my0, mx1, my1)
    Np = noise2(W, H, 4, 21, 3)
    r = c.clip_region(mx0, my0, mx1, my1)
    yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32)
    xi = np.clip(xx.astype(int), 0, W - 1)
    yi = np.clip(yy.astype(int), 0, H - 1)
    inner = (xx >= mx0 + 2) & (xx < mx1 - 2) & (yy >= my0 + 2) & (yy < my1 - 2)
    m = inner | (Np[yi, xi] > .4)
    c._apply(m, 'cream', lambda X_, Y_: .6 + (Np[np.clip(Y_.astype(int), 0, H - 1), np.clip(X_.astype(int), 0, W - 1)] - .5) * .12,
             region=r)
    # night sea & sky
    c.rect(mx0 + 4, my0 + 4, mx1 - 4, my1 - 14, 'b_mural_sea', vgrad(my0 + 4, my1 - 14, .5, .66), dith=.4)
    c.rect(mx0 + 4, my1 - 14, mx1 - 4, my1 - 4, 'b_mural_sea', vgrad(my1 - 14, my1 - 4, .42, .28), dith=.4)
    for k in range(4):
        y = my1 - 14 + k * 3
        for x in range(mx0 + 4, mx1 - 4):
            if (x + k * 3) % 7 < 4:
                c.put(x, y + int(math.sin(x * .5 + k) * 1.2), 'b_mural_sea', .5 - k * .05)
    c.ellipse(mx1 - 12, my0 + 8, 2.5, 2.5, 'cream', .85)              # painted moon
    # rock + mermaid (left), arm and lantern reaching to the right
    rkx = mx0 + 18
    c.poly([(rkx - 13, my1 - 4), (rkx - 9, my1 - 11), (rkx + 3, my1 - 14), (rkx + 13, my1 - 9), (rkx + 16, my1 - 4)],
           'slate', .42)
    c.hline(rkx - 8, rkx + 5, my1 - 13, 'slate', .64)
    c.put(rkx + 9, my1 - 10, 'slate', .6)
    # tail: from the hips on the rock, sweeping left and down, fluke up at the left
    tail = [(rkx + 1, my1 - 13), (rkx + 7, my1 - 14), (rkx + 6, my1 - 19), (rkx + 1, my1 - 20), (rkx - 5, my1 - 17),
            (rkx - 10, my1 - 13), (rkx - 9, my1 - 11)]
    c.poly(tail, 'teal', .74)
    c.line(rkx - 9, my1 - 12, rkx + 5, my1 - 15, 'teal', .9)
    c.poly([(rkx - 10, my1 - 13), (rkx - 16, my1 - 17), (rkx - 14, my1 - 12)], 'teal', .74)
    c.poly([(rkx - 10, my1 - 13), (rkx - 15, my1 - 9), (rkx - 12, my1 - 10)], 'teal', .55)
    for k in range(5):
        c.put(rkx - 6 + k * 2, my1 - 16 + (k % 2), 'teal', .86)          # scales glint
    # torso, head, flowing red hair
    c.poly([(rkx + 1, my1 - 19), (rkx + 6, my1 - 19), (rkx + 7, my1 - 27), (rkx + 2, my1 - 28)], 'skin', .64)
    c.ellipse(rkx + 4.5, my1 - 31, 2.6, 3, 'skin', .7)
    c.poly([(rkx + 1, my1 - 34), (rkx + 6, my1 - 35), (rkx + 7, my1 - 32), (rkx + 3, my1 - 29), (rkx + 1, my1 - 22),
            (rkx - 2, my1 - 24), (rkx - 1, my1 - 30)], 'red', .56)
    c.put(rkx + 6, my1 - 31, 'ink', .15)                                   # eye, looking right
    c.put(rkx + 7, my1 - 29, 'red', .7)                                    # lips
    # arm reaching right, lantern held high
    c.line(rkx + 6, my1 - 26, rkx + 18, my1 - 28, 'skin', .64)
    c.line(rkx + 6, my1 - 25, rkx + 18, my1 - 27, 'skin', .5)
    lnx, lny = rkx + 21, my1 - 31
    c.vline(lnx, lny - 3, lny, 'gold', .65)
    c.rect(lnx - 2, lny, lnx + 3, lny + 6, 'gold', .82)
    c.rect(lnx - 1, lny + 1, lnx + 2, lny + 5, 'b_sodium', .92)
    # painted beam from the lantern towards the right edge of the mural (towards the rack)
    tipx = mx1 - 5
    for (dy, frac, lum) in ((-5, .55, .52), (0, 1.0, .72), (5, .7, .55), (-9, .3, .45), (9, .35, .45)):
        c.line(lnx + 4, lny + 3, lnx + 4 + (tipx - lnx - 4) * frac, lny + 3 + dy * frac, 'gold', lum)
    c.poly([(tipx - 4, lny + 1), (tipx, lny + 3), (tipx - 4, lny + 5)], 'gold', .8)
    # painted ship far away
    c.poly([(mx1 - 26, my1 - 12), (mx1 - 18, my1 - 12), (mx1 - 20, my1 - 10), (mx1 - 24, my1 - 10)], 'wood', .4)
    c.vline(mx1 - 22, my1 - 18, my1 - 12, 'wood', .4)
    c.poly([(mx1 - 22, my1 - 18), (mx1 - 19, my1 - 13), (mx1 - 22, my1 - 13)], 'cream', .72)
    for x in range(mx0 + 2, mx1 - 2, 2):
        c.put(x, my0 + 2, 'trench', .52)
        c.put(x, my1 - 3, 'trench', .46)
    for y in range(my0 + 2, my1 - 2, 2):
        c.put(mx0 + 2, y, 'trench', .52)
        c.put(mx1 - 3, y, 'trench', .46)
    for (a, b, w_, h_) in ((mx1 - 12, my0 + 3, 7, 4), (mx0 + 5, my0 + 18, 4, 6), (mx0 + 44, my1 - 8, 6, 4)):
        B.bricks(c, a, b, a + w_, b + h_, 'brick', base=.4, seed=4, grime=.1)
    c.line(mx0 + 58, my1 - 3, mx0 + 61, my1 - 10, 'cream', .3)
    c.line(mx0 + 61, my1 - 10, mx0 + 59, my1 - 15, 'cream', .3)

    # ================================================= wine rack in its arched niche ====
    ax0, ax1 = 208, 252
    acx = (ax0 + ax1) / 2
    spring = 46
    arx = (ax1 - ax0) / 2
    g['rack'] = (ax0, int(spring - arx), ax1, FLOOR)
    g['arch'] = (acx, spring, arx)
    voussoirs(c, acx, spring, arx, arx + 6, 180, 360, 13, lum=.52, seed=7)
    for x0_, x1_ in ((ax0 - 6, ax0), (ax1, ax1 + 6)):
        B.bricks(c, x0_, spring, x1_, FLOOR, 'brick', bw=6, bh=4, base=.52, var=.08, seed=8, off=2)
    am = arch_mask(acx, spring, arx, arx, ax0, ax1, FLOOR)
    r = c.clip_region(ax0, spring - arx, ax1, FLOOR)
    yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32) + .5
    c._apply(am(xx, yy), 'wood', .16, region=r)
    rng = np.random.default_rng(17)
    cell = 6
    cells = []
    for gy in range(int(spring - arx) + 4, FLOOR - 4, cell):
        for gx in range(ax0 + 2, ax1 - 3, cell):
            pts_ok = all(am(np.array([px]), np.array([py]))[0] for (px, py) in
                         ((gx + .5, gy + .5), (gx + cell - .5, gy + .5), (gx + cell / 2, gy + cell / 2)))
            if pts_ok:
                cells.append((gx, gy))
    for (gx, gy) in cells:
        c.line(gx, gy, gx + cell, gy + cell, 'wood', .44)
        c.line(gx + cell, gy, gx, gy + cell, 'wood', .36)
    pick = min(cells, key=lambda q: abs(q[0] - (acx + 6)) + abs(q[1] - 66))
    for (gx, gy) in cells:
        cx_, cy_ = gx + cell // 2, gy + cell // 2
        if (gx, gy) == pick:
            continue
        if rng.random() < .84:
            col = ['b_bottle_g', 'b_bottle_g', 'b_bottle_a', 'ink'][int(rng.integers(0, 4))]
            c.ellipse(cx_, cy_, 1.6, 1.6, col, .36)
            c.put(cx_, cy_, col, .18)
            c.put(cx_ - 1, cy_ - 1, 'concrete', .5)                     # dust
    # the one clean bottle: Chateau Lanterne 1924, pulled a little forward, gold foil
    bcx, bcy = pick[0] + cell // 2, pick[1] + cell // 2
    c.ellipse(bcx, bcy, 2.2, 2.2, 'b_bottle_g', .66)
    c.put(bcx - 1, bcy - 1, 'b_bottle_g', .98)
    c.rect(bcx - 1, bcy - 1, bcx + 1, bcy + 1, 'gold', .85)
    c.put(bcx + 1, bcy + 2, 'b_bottle_g', .3)
    g['bottle'] = (bcx, bcy)
    c.vline(ax0 + 1, spring, FLOOR, 'wood', .42)
    c.vline(ax1 - 2, spring, FLOOR, 'wood', .42)
    c.hline(ax0 + 1, ax1 - 1, FLOOR - 2, 'wood', .46)
    B.cobweb(c, ax0 + 3, int(spring - arx) + 16, 7, 1, 1, 'fog', .55)
    # draught has swept a clean arc in the dust at the rack foot
    for t in np.linspace(0, math.pi, 20):
        x = acx - math.cos(t) * 14
        y = FLOOR + 2 + math.sin(t) * 3
        c.put(int(x), int(y), 'concrete', .58)

    # ===================================== poster "THE BLUE LANTERN - EST. 1924" ====
    px0, py0, px1, py1 = 258, 20, 292, 60
    g['poster'] = (px0, py0, px1, py1)
    c.rect(px0, py0, px1, py1, 'cream', vgrad(py0, py1, .72, .52), dith=.3)
    c.rect(px0 + 2, py0 + 2, px1 - 2, py0 + 15, 'b_velvet', .42, dith=.2)
    lx_, ly_ = (px0 + px1) // 2, py0 + 9
    for k in range(-3, 4):
        c.line(lx_, ly_, lx_ + k * 3, py0 + 3, 'gold', .5)
    c.rect(lx_ - 2, ly_ - 2, lx_ + 3, ly_ + 4, 'b_lanternglass', .72)
    c.hline(lx_ - 2, lx_ + 3, ly_ - 3, 'gold', .72)
    B.text(c, (px0 + px1) // 2, py0 + 18, 'THE BLUE', 'b_velvet', .35, center=True)
    B.text(c, (px0 + px1) // 2, py0 + 24, 'LANTERN', 'b_velvet', .35, center=True)
    c.hline(px0 + 3, px1 - 3, py0 + 31, 'red', .42)
    B.text(c, (px0 + px1) // 2, py0 + 33, 'EST 1924', 'red', .38, center=True, narrow_i=True)
    c.poly([(px1 - 4, py1), (px1, py1), (px1, py1 - 4)], 'brick', .38)     # torn corner
    B.veil(c, px0, py0, px1, py1, lambda xx, yy: np.clip(1 - np.abs(xx - (px0 + 5)) / 5, 0, 1) *
           np.clip((yy - py0 - 4) / 24, 0, 1) * .3, 'paper', .38)
    c.put(px0, py0, 'steel', .6)
    c.put(px1 - 1, py0, 'steel', .6)

    # ============================================= grating (high on the right wall) ====
    gr = p.quad([(300, 84, 18), (300, 84, 52), (300, 100, 52), (300, 100, 18)])
    g['grating'] = gr
    c.poly(gr, 'fog', .62, emis=.75)
    for Z in range(20, 52, 4):
        a, b = p.P(300, 84, Z), p.P(300, 100, Z)
        c.line(a[0], a[1], b[0], b[1], 'steel', .25)
    a, b = p.P(300, 92, 18), p.P(300, 92, 52)
    c.line(a[0], a[1], b[0], b[1], 'steel', .25)
    a, b = p.P(300, 84, 18), p.P(300, 84, 52)
    c.line(a[0], a[1], b[0], b[1], 'concrete', .66)
    sh = [p.P(300, 100, 18), p.P(300, 100, 52), p.P(236, 0, 74), p.P(248, 0, 36)]
    B.light_shaft(c, sh, .3, motes=24, seed=4)
    g['shaft'] = sh

    # ======================================== the little 1920s bar (against the wall) ====
    bX0, bX1, bZ0, bZ1 = 120, 198, 6, 18
    base_y = int(p.P(0, 0, bZ1)[1])
    g['bar_base'] = base_y
    # shelf above the bar (the 151 rum stands here, state object)
    shx0, shx1, shy = 124, 196, 60
    c.rect(shx0, shy, shx1, shy + 2, 'oak', .52)
    c.hline(shx0, shx1, shy, 'oak', .74)
    for x in (shx0 + 4, shx1 - 5):
        c.line(x, shy + 2, x + 3, shy + 7, 'steel', .4)
    rum_x = shx0 + 30
    for k, x in enumerate(range(shx0 + 3, shx1 - 3, 5)):
        if abs(x - rum_x) < 4:
            continue
        B.bottle(c, x, shy, 8 + (k % 3), ['b_bottle_g', 'b_bottle_a', 'ink', 'b_bottle_g'][k % 4], .34, w=3, hl=True,
                 label='paper' if k % 2 else None, label_lum=.42)
        c.put(x - 1, shy - 8 - (k % 3) + 1, 'concrete', .55)            # dust caps
    g['rum'] = (rum_x, shy)
    with sc.obj('old_bar', baseline=base_y):
        def barfront(xx, yy):
            k = np.floor((xx - 120) / 7)
            fx = (xx - 120) - k * 7
            return .44 + np.where(fx < 1, -.16, 0) + np.where(fx > 5.5, .06, 0)
        p.box(c, bX0, bX1, 0, 20, bZ0, bZ1, 'wood', front=.44, top=.56, side=.3, lum_fn=barfront)
        p.box(c, bX0 - 2, bX1 + 2, 20, 23, bZ0 - 1, bZ1 + 2, 'oak', front=.48, top=.58, side=.36)
        a = p.P(bX0 - 2, 23, bZ1 + 2)
        b = p.P(bX1 + 2, 23, bZ1 + 2)
        c.line(a[0], a[1], b[0], b[1], 'oak', .8)
        fx0, fy0, fx1, fy1 = p.front_rect(bX0, bX1, 0, 20, bZ1)
        mxf = (fx0 + fx1) / 2
        for k in range(-5, 6):
            c.line(mxf, fy1 - 3, mxf + k * 4, fy0 + 4, 'wood', .55)
        c.ellipse(mxf, fy1 - 3, 3, 2, 'brass', .6)
        # brass foot rail
        r0 = p.P(bX0, 3, bZ1 + 3)
        r1 = p.P(bX1, 3, bZ1 + 3)
        c.hline(int(r0[0]), int(r1[0]), int(r0[1]), 'brass', .62)
        # dust sheet thrown over the right end, soda siphon, glasses
        top = lambda X, f: p.P(X, 23, bZ0 + (bZ1 - bZ0) * f)
        t0, t1 = top(bX0 + 50, .5), top(bX1 + 2, .5)
        c.poly([(t0[0], t0[1] - 1), (t1[0] + 1, t1[1] - 1), (t1[0] + 3, fy0 + 14), (t1[0] - 14, fy0 + 10),
                (t0[0] + 4, t0[1] + 3)], 'paper', .55)
        c.line(t1[0] - 14, fy0 + 10, t1[0] + 3, fy0 + 14, 'paper', .34)
        sx, sy = top(bX0 + 12, .5)
        c.rect(int(sx) - 1, int(sy) - 8, int(sx) + 2, int(sy), 'glass', .55)
        c.rect(int(sx) - 1, int(sy) - 10, int(sx) + 3, int(sy) - 8, 'chrome', .7)
        c.put(int(sx) + 3, int(sy) - 9, 'chrome', .5)
        for gxo in (24, 29):
            gx, gy = top(bX0 + gxo, .5)
            c.rect(int(gx), int(gy) - 3, int(gx) + 2, int(gy), 'glass', .6)
            c.put(int(gx), int(gy) - 3, 'white', .8)
    g['bar'] = (int(p.P(bX0 - 2, 23, bZ1)[0]), int(p.P(0, 23, bZ1 + 2)[1]) - 10, int(p.P(bX1 + 2, 0, bZ1)[0]), base_y)
    # demijohn on the floor at the end of the bar
    B.cylinder(c, 206 - 6, FLOOR - 9, FLOOR + 2, 5, 2, 'b_bottle_g', .35, top=False)
    c.ellipse(200, FLOOR - 9, 5, 4, 'b_bottle_g', .42)
    c.rect(199, FLOOR - 15, 202, FLOOR - 11, 'b_bottle_g', .48)
    c.put(198, FLOOR - 8, 'b_bottle_g', .78)

    # ======================================================= broken player piano ====
    ppX0, ppX1, ppZ0, ppZ1 = 258, 296, 2, 14
    p.box(c, ppX0, ppX1, 0, 34, ppZ0, ppZ1, 'wood', front=.42, top=.52, side=.3)
    fx0, fy0, fx1, fy1 = p.front_rect(ppX0, ppX1, 0, 34, ppZ1)
    fx0, fy0, fx1, fy1 = int(fx0), int(fy0), int(fx1), int(fy1)
    g['piano'] = (fx0, fy0, fx1, fy1)
    c.rect(fx0 + 4, fy0 + 3, fx1 - 4, fy0 + 12, 'glass', .3)
    c.rect(fx0 + 6, fy0 + 5, fx1 - 6, fy0 + 7, 'wood', .55)
    c.hline(fx0 + 6, fx1 - 6, fy0 + 9, 'paper', .5)
    c.line(fx0 + 5, fy0 + 11, fx0 + 12, fy0 + 4, 'glass', .55)
    ky = fy0 + 16
    c.rect(fx0 - 1, ky, fx1 + 1, ky + 3, 'wood', .5)
    c.rect(fx0 + 1, ky, fx1 - 1, ky + 2, 'paper', .78)
    for x in range(fx0 + 2, fx1 - 2, 3):
        c.put(x, ky, 'ink', .15)
    for x in (fx0 + 9, fx0 + 10, fx0 + 22):
        c.vline(x, ky, ky + 2, 'black', .1)
    c.rect(fx0 + 4, fy0 + 21, fx1 - 4, fy1 - 2, 'wood', .34)
    c.poly([(fx0 + 12, fy0 + 23), (fx0 + 22, fy0 + 22), (fx0 + 20, fy1 - 4), (fx0 + 13, fy1 - 3)], 'black', .2)
    c.line(fx0 + 12, fy0 + 23, fx0 + 20, fy1 - 4, 'wood', .55)
    for x in (fx0 + 15, fx0 + 20):
        c.rect(x, fy1 - 2, x + 3, fy1, 'brass', .6)
    tx_, ty_ = p.P(ppX0 + 12, 34, (ppZ0 + ppZ1) / 2)
    rbx, rby = int(tx_), int(ty_)
    g['roll_box'] = (rbx, rby)
    c.rect(rbx, rby - 5, rbx + 15, rby, 'red', .48)
    c.hline(rbx, rbx + 15, rby - 5, 'red', .72)
    c.rect(rbx + 2, rby - 4, rbx + 13, rby - 1, 'paper', .78)
    c.hline(rbx + 3, rbx + 12, rby - 3, 'ink', .4)
    c.vline(rbx + 15, rby - 5, rby, 'red', .25)
    c.rect(rbx + 20, rby - 3, rbx + 22, rby, 'paper', .7)              # candle stub
    c.put(rbx + 20, rby - 4, 'ink', .3)
    sx, sy = p.P(266, 0, 30)
    c.ellipse(int(sx) - 4, int(sy) - 3, 4, 2.5, 'wood', .45)           # stool knocked over
    c.line(int(sx) - 1, int(sy) - 2, int(sx) + 8, int(sy) - 4, 'wood', .4)
    c.line(int(sx) - 2, int(sy), int(sx) + 7, int(sy) + 1, 'wood', .35)

    # ================================================================ crates ====
    cr_base = int(p.P(0, 0, 92)[1])
    with sc.obj('crates_obj', baseline=cr_base):
        B.crate_box(c, p, 40, 72, 0, 18, 74, 92, 'oak', .5, stencil='CANADIAN', stencil2='RYE', stencil_ramp='ink',
                    stencil_lum=.15, seed=3, boards=3)
        B.crate_box(c, p, 44, 70, 18, 32, 77, 89, 'oak', .54, stencil='MAPLE', stencil2='SYRUP', stencil_ramp='ink',
                    stencil_lum=.15, seed=4, boards=3)
        tx, ty = p.P(57, 32, 83)
        c.rect(int(tx) - 4, int(ty) - 2, int(tx) + 6, int(ty), 'gold', .55)
        c.vline(int(tx), int(ty) - 6, int(ty) - 1, 'b_bottle_g', .5)
        c.vline(int(tx) + 3, int(ty) - 5, int(ty) - 1, 'b_bottle_a', .55)
    g['crates'] = (max(0, int(p.P(40, 32, 92)[0])), int(p.P(44, 32, 77)[1]) - 7, int(p.P(72, 0, 92)[0]), min(H, cr_base))
    # the crate Rook wakes up on (front, left of centre)
    wk_base = int(p.P(0, 0, 74)[1])
    with sc.obj('wake_crate', baseline=wk_base):
        B.crate_box(c, p, 100, 124, 0, 13, 60, 74, 'oak', .5, stencil='B.L.', stencil_ramp='ink', stencil_lum=.2,
                    seed=9, boards=2, brace=False)
        tx, ty = p.P(104, 13, 66)
        c.poly([(tx - 2, ty), (tx + 12, ty - 1), (tx + 13, ty + 3), (tx - 1, ty + 4)], 'b_velvet', .42)
    g['wake_crate'] = (int(p.P(100, 13, 74)[0]), int(p.P(100, 13, 60)[1]), int(p.P(124, 0, 74)[0]), wk_base)

    # =================================================== state: rack swung open ====
    if 'rack_open' in st:
        r = c.clip_region(ax0, spring - arx, ax1, FLOOR)
        yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32) + .5
        m = am(xx, yy)
        d = np.sqrt(((xx - acx) / arx) ** 2 + ((yy - (spring + 10)) / (FLOOR - spring + 10)) ** 2)
        c._apply(m, 'brick', np.clip(.3 * (1 - np.clip(1.1 - d, 0, 1) * .92), 0, 1), region=r)
        for k, sc_ in enumerate((.8, .62, .46, .33)):
            rr = arx * sc_
            cy2 = spring + (1 - sc_) * 18
            for a in np.linspace(math.pi, 2 * math.pi, 26):
                c.put(int(round(acx + math.cos(a) * rr)), int(round(cy2 + math.sin(a) * rr)), 'brick', .32 - k * .05)
            c.hline(int(acx - rr), int(acx + rr), int(FLOOR - (1 - sc_) * 26), 'concrete', .22 - k * .03)
        c.ellipse(acx, spring + 16, arx * .28, arx * .3, 'black', 0)
        c.poly([(ax0 + 2, FLOOR), (ax1 - 2, FLOOR), (acx + 4, FLOOR - 22), (acx - 4, FLOOR - 22)], 'water', .12)
        c.line(acx - 1, FLOOR - 2, acx, FLOOR - 18, 'water', .38)
        rx0 = ax0 - 2
        top0 = spring - arx + 4
        q = [(rx0, top0), (rx0 - 11, top0 + 5), (rx0 - 11, FLOOR + 5), (rx0, FLOOR)]
        c.poly(q, 'oak', hgrad(rx0 - 11, rx0, .42, .3))
        for k in range(1, 3):
            x = rx0 - k * 4
            c.line(x, top0 + k * 2 - 1, x, FLOOR + k * 2, 'oak', .24)           # plank seams of the back
        for y in range(int(top0) + 10, FLOOR, 14):
            t = (y - top0) / (FLOOR - top0)
            c.line(rx0 - 10, y + 5 - t * 1, rx0 - 1, y, 'oak', .52)            # battens
        c.line(rx0 - 11, top0 + 5, rx0 - 11, FLOOR + 5, 'oak', .62)
        c.line(rx0, top0, rx0 - 11, top0 + 5, 'oak', .66)
        for hy in (top0 + 8, FLOOR - 10):
            c.rect(rx0 - 1, hy, rx0 + 2, hy + 3, 'steel', .5)                   # hinges
        for (a, b) in ((acx - 6, 62), (acx + 3, 54), (acx - 2, 76)):
            c.put(int(a), int(b), 'fog', .5, emis=.3)

    # =================================================== state: lantern on the hook ====
    if 'lantern_hook' in st:
        hkx, hky = g['hook']
        lx, ly = hkx + 1, hky + 4
        # wire bail arching over the cap
        c.put(lx - 2, ly + 1, 'steel', .6)
        c.put(lx + 2, ly + 1, 'steel', .6)
        c.hline(lx - 1, lx + 2, ly, 'steel', .7)
        c.rect(lx - 2, ly + 2, lx + 3, ly + 4, 'rust', .62)              # chimney cap
        c.hline(lx - 2, lx + 3, ly + 2, 'rust', .82)
        c.ellipse(lx + .5, ly + 8.5, 3.6, 4.4, 'glass', radial(lx - 1, ly + 7, 6, .78, .4))   # glass globe
        c.vline(lx - 1, ly + 6, ly + 11, 'white', .82)                   # glint
        for xg in (lx - 3, lx + 4):                                      # wire guard
            c.vline(xg, ly + 6, ly + 11, 'steel', .5)
        c.hline(lx - 3, lx + 5, ly + 8, 'steel', .45)
        c.put(lx, ly + 10, 'ink', .3)                                    # cold wick
        c.rect(lx - 3, ly + 12, lx + 5, ly + 15, 'rust', .58)            # empty fount
        c.hline(lx - 3, lx + 5, ly + 12, 'rust', .8)
        c.hline(lx - 3, lx + 5, ly + 15, 'rust', .3)
        c.put(lx + 4, ly + 13, 'brass', .7)                              # filler cap

    # =================================================== state: 151 rum on the shelf ====
    if 'rum' in st:
        rx, ry = g['rum']
        B.bottle(c, rx, ry, 12, 'b_bottle_a', .66, w=4, hl=True, label='red', label_lum=.58)
        c.rect(rx - 2, ry - 6, rx + 2, ry - 4, 'paper', .85)
        c.put(rx, ry - 12, 'red', .6)

    # ================================================================ lighting ====
    c.ambient = .4
    blx, bly = g['bulb']
    c.add_light(blx, bly + 4, 120, .52, falloff=1.3)
    c.glow(blx, bly + 1, 14, '#ffc070', .65)
    gx_, gy_ = p.P(300, 92, 35)
    c.add_light(gx_ - 30, gy_ + 40, 120, .42, falloff=1.2)
    c.glow(gx_, gy_, 34, '#c0d0e0', .35)
    c.add_light(244, 124, 60, .28, ystretch=2.5)
    c.glow(244, 118, 44, '#9fb4cc', .22)
    c.glow(gx_ - 20, gy_ + 30, 50, '#a8b8c8', .12)
    c.shadow_poly(p.quad([(bX0 - 4, 0, bZ0), (bX1 + 4, 0, bZ0), (bX1 + 4, 0, bZ1 + 5), (bX0 - 4, 0, bZ1 + 5)]), .45)
    c.shadow_poly(p.quad([(ppX0, 0, ppZ0), (ppX1, 0, ppZ0), (ppX1, 0, ppZ1 + 3), (ppX0, 0, ppZ1 + 3)]), .4)
    c.shadow_poly(p.quad([(38, 0, 72), (74, 0, 72), (74, 0, 94), (38, 0, 94)]), .45)
    c.shadow_poly(p.quad([(98, 0, 58), (126, 0, 58), (126, 0, 76), (98, 0, 76)]), .4)
    c.shadow_poly([(58, FLOOR), (104, FLOOR), (106, FLOOR + 3), (56, FLOOR + 3)], .45)
    B.vignette(c, 170, 70, 210, 140, lo=.5)
    return g, p


STATES = [
    ('rack_open', {'rack_open'}, 4),
    ('lantern_hook', {'lantern_hook'}, 5),
    ('rum', {'rum'}, 5),
]


def build():
    sc = Scene('lantern_cellar', W, H, seed=SEED)
    g, p = paint(sc, set())
    for name, sts, depth in STATES:
        alt = Scene('lantern_cellar', W, H, seed=SEED)
        paint(alt, sts)
        B.state_from(sc, name, alt.c, depth=depth)

    # ----------------------------------------------------------- interaction -------
    sx_top, land_y, sx_bot, fl = g['stairs']
    sc.hotspot('stairs', poly=[(sx_top, land_y - 4), (sx_bot + 6, FLOOR - 26), (sx_bot + 6, FLOOR), (sx_top, FLOOR)],
               walk=(112, 106), face='left')
    dx0, dy0, dx1, dy1 = g['door']
    sc.hotspot('door', rect=(dx0 - 3, dy0 - 3, dx1 + 3, dy1), walk=(110, 106), face='left')
    ax0, _, ax1, _ = g['rack']
    acx, spring, arx = g['arch']
    sc.hotspot('rack', rect=(ax0 - 4, int(spring - arx) - 4, ax1 + 4, FLOOR), walk=(int(acx), 106), face='up')
    bx, by = g['bottle']
    sc.hotspot('bottle_1924', rect=(bx - 3, by - 3, bx + 4, by + 4), walk=(int(acx) + 4, 106), face='up')
    mx0, my0, mx1, my1 = g['mural']
    sc.hotspot('mural', rect=(mx0, my0, mx1, my1), walk=(160, 112), face='up')
    px0, py0, px1, py1 = g['poster']
    sc.hotspot('poster', rect=(px0 - 1, py0 - 1, px1 + 1, py1 + 1), walk=(266, 112), face='up')
    f = g['piano']
    sc.hotspot('player_piano', rect=(f[0] - 1, f[1] + 4, f[2] + 1, f[3]), walk=(278, 112), face='up')
    rbx, rby = g['roll_box']
    sc.hotspot('roll_box', rect=(rbx - 1, rby - 6, rbx + 16, rby + 2), walk=(270, 112), face='up')
    gr = g['grating']
    sc.hotspot('grating', poly=[(int(x), int(y)) for x, y in gr], walk=(286, 120), face='right')
    hkx, hky = g['hook']
    sc.hotspot('lantern_hook', rect=(hkx - 5, hky - 3, hkx + 7, hky + 22), walk=(112, 106), face='up')
    rx, ry = g['rum']
    sc.hotspot('rum', rect=(rx - 4, ry - 14, rx + 5, ry + 1), walk=(rx, 112), face='up')
    sc.hotspot('barrels', rect=g['barrels'], walk=(84, 117), face='up')
    cr = g['crates']
    sc.hotspot('crates', rect=cr, walk=(62, 124), face='left')
    sc.hotspot('exit_tunnel', rect=(ax0 + 2, int(spring - arx) + 2, ax1 - 2, FLOOR), walk=(int(acx), 104), face='up')
    # extra: the old bar
    b = g['bar']
    sc.hotspot('old_bar', rect=b, walk=(160, 112), face='up')

    zf = p.z_at_floor_y(H + 2)
    def P2(X, Z):
        x, y = p.P(X, 0, Z)
        return (int(round(x)), int(round(y)))
    poly = [P2(108, 6), P2(118, 6), P2(118, 24), P2(202, 24), P2(204, 4), P2(256, 4), P2(256, 18),
            P2(296, 18), P2(296, zf), P2(24, zf), P2(24, 100), P2(60, 100), P2(62, 30), P2(104, 30)]
    holes = [
        [P2(96, 56), P2(128, 56), P2(128, 78), P2(96, 78)],         # wake crate
        [P2(30, 70), P2(76, 70), P2(76, 120), P2(30, 120)],         # liquor crates
    ]
    sc.walkable(poly, holes=holes)
    sc.point('start', 156, 124, 'down')
    sc.point('wake', 126, 134, 'left')
    sc.point('tunnel_mouth', int(acx), 104, 'up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, p.char_scale(FLOOR, 140), 140, 1.0)
    sc.meta['floor'] = 'stone'

    # ---------------------------------------------------------- animations -------
    # feet passing the pavement grating (silhouettes against the dawn)
    def feet(k):
        def f(cc):
            if k >= 6:
                return
            Zs = 20 + k * 6
            for off, shoe in ((0, 0), (5, 1)):
                Z = Zs + off
                if not (19 <= Z <= 51):
                    continue
                a = p.P(300, 100, Z)
                b = p.P(300, 91, Z + 1)
                lift = 2 if (k + shoe) % 2 else 0
                cc.line(a[0], a[1] - 1 - lift, b[0], b[1], 'ink', .15)
                cc.line(a[0] + 1, a[1] - 1 - lift, b[0] + 1, b[1], 'ink', .2)
                cc.put(a[0] + 1, a[1] - lift - 1, 'ink', .1)
                cc.put(a[0] + 2, a[1] - lift - 1, 'ink', .1)
        return f
    sc.anim('feet', [feet(k) for k in range(12)], fps=6)
    # dust motes drifting in the shaft
    rng = np.random.default_rng(8)
    sh = g['shaft']
    motes = []
    m, r = sc.c.poly_mask(sh)
    ys, xs = np.nonzero(m)
    for i in rng.choice(len(xs), 18, replace=False):
        motes.append((xs[i] + r[0], ys[i] + r[1]))

    def mfr(k):
        def f(cc):
            for i, (x, y) in enumerate(motes):
                yy = y + ((k + i) % 6) - 3
                xx = x + int(math.sin((k + i) * .8) * 1.5)
                cc.put(xx, yy, 'fog', .85, emis=.5)
        return f
    sc.anim('motes', [mfr(k) for k in range(6)], fps=4)
    # bulb flicker
    blx, bly = g['bulb']

    def bfr(level):
        def f(cc):
            cc.ellipse(blx + .5, bly + 1, 2, 2.4, 'lamp', .9 * level, emis=1)
        return f
    sc.anim('bulb', [bfr(1)] * 6 + [bfr(.6), bfr(1), bfr(.75)], fps=8)
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
