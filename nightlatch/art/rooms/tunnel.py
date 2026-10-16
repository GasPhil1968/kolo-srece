"""Chapter 6 - the smugglers' tunnel from the Blue Lantern cellar to the seawall below St. Brigid's.
400 wide (scrolls).  Low brick vault, ankle-deep water over the old rails, lit by Rook's lantern."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
from persp import Persp, floor_poly
import props_b as B

W, H = 400, 144
FLOOR = 94
SPRING = 40          # where the far wall turns into the vault
SEED = 51


def P_():
    return Persp(0, 400, 0, FLOOR, horizon=-50, depth=360)


def paint(sc, st):
    c = sc.c
    p = P_()
    zfront = p.z_at_floor_y(H + 2)
    g = {}
    N = noise2(W, H, 6, 3, 3)
    N2 = noise2(W, H, 22, 4, 3)

    # ================================================================ the vault ====
    def vaultfn(xx, yy):
        # courses get taller towards the top (the vault curving over towards the viewer)
        t = np.clip((SPRING - yy) / SPRING, 0, 1)
        u = t ** 1.35 * 9.0                         # course index (non-linear)
        k = np.floor(u)
        fr = u - k
        sh = (k % 2) * 5
        col = np.floor((xx + sh) / (9 + t * 6))
        fx = (xx + sh) - col * (9 + t * 6)
        L = .46 + (B.H(col, k) - .5) * .1 - t * .34
        L = np.where(fr < .12 + t * .02, .1, L)
        L = np.where(fx < 1, .16, L)
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = L - (N2[yi, xi] - .5) * .14
        return L
    c.rect(0, 0, W, SPRING, 'brick', vaultfn, dith=.25)
    # far wall
    B.bricks(c, 0, SPRING, W, FLOOR, 'brick', bw=8, bh=4, base=.44, var=.12, mortar=.16, seed=9, grime=.12, dith=.25,
             light_top=.08)
    # springing course: a projecting band of headers
    c.rect(0, SPRING - 1, W, SPRING + 2, 'brick', .5)
    c.hline(0, W, SPRING - 1, 'brick', .66)
    for x in range(0, W, 4):
        c.put(x, SPRING + 1, 'brick', .22)
    # damp: dark streaks running down from the springing, white efflorescence, green slime low down
    rng = np.random.default_rng(3)
    for _ in range(26):
        x = int(rng.integers(0, W))
        L = int(rng.integers(8, 40))
        w = int(rng.integers(1, 4))
        c.rect(x, SPRING + 2, x + w, SPRING + 2 + L, 'brick', .22, dith=.6)
    B.veil(c, 0, FLOOR - 14, W, FLOOR, lambda xx, yy: np.clip((yy - (FLOOR - 14)) / 14, 0, 1) * .7 *
           (.3 + N[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)]), 'olive', .38)
    # pilasters with transverse vault ribs give the long wall its rhythm
    for px in (100, 194, 340):
        pw = 10
        B.bricks(c, px, 5, px + pw, FLOOR, 'brick', bw=5, bh=4, base=.5, var=.08, mortar=.22, seed=px, grime=.1,
                 off=1)
        c.vline(px, 5, FLOOR, 'brick', .64)
        c.vline(px + pw, 5, FLOOR, 'brick', .14)
        c.vline(px + pw + 1, SPRING, FLOOR, 'brick', .2)
        c.rect(px - 2, SPRING - 2, px + pw + 2, SPRING + 2, 'brick', .56)     # impost block
        c.hline(px - 2, px + pw + 2, SPRING - 2, 'brick', .72)
        # the rib darkens as it curves overhead
        c.modulate(px, 5, px + pw, SPRING - 2, lambda xx, yy: .55 + .45 * np.clip((yy - 5) / (SPRING - 7), 0, 1))
        # slime run down the pilaster foot
        c.rect(px + 2, FLOOR - 10, px + 5, FLOOR, 'olive', .34, dith=.5)
    # the near edge of the vault (cut-away section) closing the top of the frame
    c.rect(0, 0, W, 5, 'brick', .1)
    for x in range(0, W, 7):
        c.vline(x, 0, 5, 'black', .2)
    c.hline(0, W, 5, 'brick', .36)
    # roots through the vault + calcite straws only along the crack lines
    for (rx, rlen) in ((60, 14), (132, 9), (198, 18), (346, 11)):
        x = rx
        for y in range(5, 5 + rlen):
            c.put(x, y, 'trench', .32)
            if y % 4 == 0:
                x += 1 if (y // 4) % 2 else -1
                c.put(x + 1, y, 'trench', .25)
    for (x, y, L) in ((257, 8, 3), (260, 14, 2), (255, 20, 4), (120, 20, 2), (301, 24, 3)):
        c.vline(x, y, y + L, 'paper', .55)
        c.put(x, y + L, 'paper', .8)
    # an old caged work-lamp hanging dead from the vault
    c.vline(150, 5, 18, 'ink', .4)
    c.rect(148, 18, 153, 20, 'rust', .45)
    c.ellipse(150.5, 22, 2.5, 2.5, 'glass', .25)
    c.line(148, 20, 147, 24, 'rust', .4)
    c.line(153, 20, 154, 24, 'rust', .4)
    B.cobweb(c, 0, 6, 12, 1, 1, 'fog', .4)
    B.cobweb(c, W - 1, 6, 10, -1, 1, 'fog', .4)

    # ================================================================ the floor ====
    # stone ledge along the foot of the wall, then the flooded rail bed
    ledge = p.quad([(0, 3, 0), (400, 3, 0), (400, 3, 9), (0, 3, 9)])
    c.poly(ledge, 'concrete', .42)
    a, b = p.P(0, 3, 9), p.P(400, 3, 9)
    c.line(a[0], a[1], b[0], b[1], 'concrete', .62)
    lf = p.quad([(0, 0, 9), (400, 0, 9), (400, 3, 9), (0, 3, 9)])
    c.poly(lf, 'concrete', .26)
    bed = floor_poly(p, -200, 600, 9, zfront)
    Nf = noise2(W, H, 4, 13, 2)

    def bedfn(xx, yy):
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        X = p.cx + (xx - p.cx) / s
        Z = p.D * (1 - 1 / s)
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = .32 + (Nf[yi, xi] - .5) * .14
        # sleepers every 14 units, running towards the viewer
        k = np.floor(X / 14)
        fx = X / 14 - k
        sl = (fx > .25) & (fx < .62) & (Z > 26) & (Z < 66)
        L = np.where(sl, .44 + (B.H(k, 3) - .5) * .12, L)
        return L
    c.poly(bed, 'wood', bedfn)
    # rails (two, running left-right) - the rail heads catch the light
    rails = []
    for Z in (32, 60):
        a0, a1 = p.P(-200, 2, Z), p.P(600, 2, Z)
        y = p.P(0, 2, Z)[1]
        c.rect(0, int(y), W, int(y) + 2, 'rust', .45)
        c.hline(0, W, int(y), 'steel', .62)
        rails.append(int(y))
    g['rails_y'] = rails
    # water over the bed: dark, reflective, broken by ripples; the rails show through dimly
    wz0 = 14
    water = floor_poly(p, -200, 600, wz0, 84)
    Nw = noise2(W, H, 9, 17, 2)

    def waterfn(xx, yy):
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        rip = np.sin(xx * .35 + yy * 1.7 + Nw[yi, xi] * 6) * .05
        L = .3 + rip + (Nw[yi, xi] - .5) * .1
        # reflected vault (dark band) + reflected wall brightness near the far edge
        L = L + np.clip(1 - (yy - 100) / 10, 0, 1) * .08
        return L
    m, r = c.poly_mask(water)
    # keep the rails and some sleepers visible through the shallow water: dithered transparency
    yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32)
    bay = B.bayer(r[2] - r[0], r[3] - r[1], r[0], r[1])
    keep = np.zeros_like(m)
    for ry in rails:
        keep |= (yy >= ry) & (yy <= ry + 1) & (bay < .55)
    shallow = (bay < .25) & (Nw[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)] > .55)
    c._apply(m & ~keep & ~shallow, 'water', waterfn, region=r, dith=.3)
    # reflection of the lit brick wall in the water just below the ledge, broken by ripples
    y_w = p.P(0, 0, wz0)[1]
    for y in range(int(y_w) + 1, int(y_w) + 12):
        t = (y - y_w) / 12
        for x in range(0, W):
            ph = math.sin(x * .22 + y * 1.3) + math.sin(x * .07 + y * .5)
            if ph > -.2 + t * 1.6:
                continue
            if (x + y) % 2 == 0 and t > .5:
                continue
            c.put(x, y, 'brick', .3 - t * .14 + (.06 if (x // 4 + y) % 3 == 0 else 0))
    # sleepers seen through the shallow water as dark bars
    for X in range(-200, 600, 28):
        a = p.P(X + 4, 0, 34)
        b = p.P(X + 4, 0, 58)
        c.line(a[0], a[1], b[0], b[1], 'water', .2)
    # floating debris: a plank, a bottle, a sodden newspaper
    pxl, pyl = p.P(286, 0, 46)
    c.poly([(pxl - 12, pyl), (pxl + 10, pyl - 2), (pxl + 11, pyl), (pxl - 11, pyl + 2)], 'wood', .4)
    c.hline(int(pxl) - 10, int(pxl) + 9, int(pyl) - 1, 'wood', .58)
    bxl, byl = p.P(176, 0, 70)
    c.rect(int(bxl), int(byl) - 1, int(bxl) + 4, int(byl) + 1, 'b_bottle_g', .5)
    c.put(int(bxl) + 4, int(byl), 'b_bottle_g', .7)
    c.put(int(bxl) + 1, int(byl) - 1, 'b_bottle_g', .85)
    nxl, nyl = p.P(110, 0, 76)
    c.poly([(nxl, nyl), (nxl + 9, nyl - 1), (nxl + 10, nyl + 2), (nxl + 1, nyl + 3)], 'paper', .4)
    # foam lines along the rails & ripples
    for ry in rails:
        for x in range(0, W, 3):
            if (x * 7) % 11 < 4:
                c.put(x, ry - 1, 'water', .62)
    # near rubble edge (dry ballast) at the very front
    fr_ = floor_poly(p, -200, 600, 84, zfront)
    c.poly(fr_, 'concrete', lambda xx, yy: .3 + (Nf[np.clip(yy.astype(int), 0, H - 1),
           np.clip(xx.astype(int), 0, W - 1)] - .5) * .3)
    for _ in range(70):
        x = int(rng.integers(0, W))
        y = int(rng.integers(int(p.P(0, 0, 84)[1]), H))
        c.put(x, y, 'concrete', .55)
        c.put(x + 1, y, 'concrete', .2)
    yfront = int(p.P(0, 0, 84)[1])
    c.hline(0, W, yfront, 'water', .55)

    # ============================================ left: the way back to the cellar ====
    ax0, ax1, ay0 = 6, 46, 46
    g['back_arch'] = (ax0, ay0 - 20, ax1, FLOOR)
    acx = (ax0 + ax1) / 2
    arx = (ax1 - ax0) / 2
    am = lambda xx, yy: ((xx >= ax0) & (xx < ax1) & (yy >= ay0) & (yy < FLOOR)) | \
        ((((xx - acx) / arx) ** 2 + ((yy - ay0) / arx) ** 2 <= 1) & (yy < ay0))
    r = c.clip_region(ax0, ay0 - arx, ax1, FLOOR + 1)
    yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32) + .5
    d = np.sqrt(((xx - acx) / arx) ** 2 + ((yy - (ay0 + 14)) / 40) ** 2)
    c._apply(am(xx, yy), 'brick', np.clip(.26 - (1 - np.clip(d, 0, 1)) * .24, 0, 1), region=r)
    for k, s_ in enumerate((.82, .64, .48)):
        rr = arx * s_
        for a in np.linspace(math.pi, 2 * math.pi, 30):
            c.put(int(round(acx + math.cos(a) * rr)), int(round(ay0 + (1 - s_) * 12 + math.sin(a) * rr)), 'brick', .3 - k * .06)
    # faint warm light far back (the cellar)
    c.ellipse(acx, ay0 + 26, 3, 5, 'lamp', .3, emis=.5)
    for k in range(13):
        t0 = math.pi + math.pi * k / 13
        t1 = math.pi + math.pi * (k + 1) / 13
        pts = [(acx + math.cos(t0) * arx, ay0 + math.sin(t0) * arx), (acx + math.cos(t0) * (arx + 5), ay0 + math.sin(t0) * (arx + 5)),
               (acx + math.cos(t1) * (arx + 5), ay0 + math.sin(t1) * (arx + 5)), (acx + math.cos(t1) * arx, ay0 + math.sin(t1) * arx)]
        c.poly(pts, 'brick', .5 + (k % 2) * .06)
    # painted direction marks by the arch
    c.rect(52, 52, 74, 60, 'paper', .5, dith=.4)
    B.text(c, 54, 54, 'BL', 'red', .4)
    c.line(63, 56, 70, 56, 'red', .4)
    c.put(64, 55, 'red', .4)
    c.put(64, 57, 'red', .4)
    B.text(c, 54, 62, 'NO 3', 'paper', .5, wear=.25, seed=5)

    # ============================================= the collapsed side passage ====
    sx0, sx1, sy0 = 232, 284, 52
    scx, srx = (sx0 + sx1) / 2, (sx1 - sx0) / 2
    g['side'] = (sx0 - 6, int(sy0 - srx) - 6, sx1 + 6, FLOOR + 8)
    sm = lambda xx, yy: ((xx >= sx0) & (xx < sx1) & (yy >= sy0) & (yy < FLOOR)) | \
        ((((xx - scx) / srx) ** 2 + ((yy - sy0) / srx) ** 2 <= 1) & (yy < sy0))
    r = c.clip_region(sx0, sy0 - srx, sx1, FLOOR)
    yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32) + .5
    c._apply(sm(xx, yy), 'brick', .1, region=r)
    # voussoirs, some fallen (gaps)
    for k in range(15):
        if k in (6, 7, 9):
            continue
        t0 = math.pi + math.pi * k / 15
        t1 = math.pi + math.pi * (k + 1) / 15
        drop = 3 if k in (5, 8, 10) else 0
        pts = [(scx + math.cos(t0) * srx, sy0 + math.sin(t0) * srx + drop),
               (scx + math.cos(t0) * (srx + 6), sy0 + math.sin(t0) * (srx + 6) + drop),
               (scx + math.cos(t1) * (srx + 6), sy0 + math.sin(t1) * (srx + 6) + drop),
               (scx + math.cos(t1) * srx, sy0 + math.sin(t1) * srx + drop)]
        c.poly(pts, 'brick', .48 + (k % 3) * .05)
    # a crack running up from the arch into the vault
    pts = [(scx, sy0 - srx - 6), (scx - 3, sy0 - srx - 14), (scx + 2, sy0 - srx - 20), (scx - 1, 4)]
    for a_, b_ in zip(pts, pts[1:]):
        c.line(a_[0], a_[1], b_[0], b_[1], 'black', .1)
    # rubble cone filling the passage and spilling out onto the ledge and into the water
    rub = [(sx0 - 14, FLOOR + 10), (sx0 - 4, FLOOR - 6), (sx0 + 6, sy0 + 2), (scx - 4, sy0 - srx + 12),
           (scx + 10, sy0 - 6), (sx1 + 2, FLOOR - 10), (sx1 + 16, FLOOR + 12)]
    c.poly(rub, 'brick', .3)
    rng2 = np.random.default_rng(23)
    for _ in range(230):
        x = rng2.uniform(sx0 - 12, sx1 + 14)
        ytop = np.interp(x, [q[0] for q in rub], [q[1] for q in rub])
        y = rng2.uniform(ytop, FLOOR + 10)
        w, h = int(rng2.integers(2, 6)), int(rng2.integers(2, 4))
        L = .28 + rng2.random() * .3
        c.rect(int(x), int(y), int(x) + w, int(y) + h, 'brick', L)
        c.hline(int(x), int(x) + w, int(y), 'brick', min(.85, L + .3))
        c.put(int(x) + w - 1, int(y) + h - 1, 'brick', .12)
    for (x, y) in ((sx0 + 2, FLOOR - 4), (scx + 8, FLOOR - 2), (scx - 6, sy0 + 14)):
        c.poly([(x, y), (x + 9, y - 2), (x + 10, y + 4), (x + 1, y + 5)], 'concrete', .42)
        c.line(x, y, x + 9, y - 2, 'concrete', .66)
    # broken timber props
    c.line(sx0 + 4, FLOOR - 2, scx + 6, sy0 - srx + 10, 'wood', .5)
    c.line(sx0 + 5, FLOOR - 2, scx + 7, sy0 - srx + 10, 'wood', .32)
    c.line(sx1 - 2, FLOOR + 4, sx1 - 14, sy0 + 6, 'wood', .46)
    c.line(sx1 - 1, FLOOR + 4, sx1 - 13, sy0 + 6, 'wood', .3)
    c.rect(scx - 10, sy0 - srx + 8, scx + 16, sy0 - srx + 11, 'wood', .4)      # header beam, slanted
    # a dark gap at the top of the rubble: air moving
    c.ellipse(scx + 3, sy0 - srx + 16, 4, 2, 'black', .05)

    # ============================================================ rotting crates ====
    cr_base = int(p.P(0, 0, 18)[1])
    with sc.obj('crates_obj', baseline=cr_base):
        B.crate_box(c, p, 118, 146, 0, 16, 2, 18, 'wood', .5, stencil='MAPLE', stencil2='SYRUP', stencil_ramp='ink',
                    stencil_lum=.15, seed=31, boards=3)
        B.crate_box(c, p, 146, 168, 0, 14, 4, 18, 'wood', .46, seed=32, boards=3, brace=False)
        B.crate_box(c, p, 122, 144, 16, 30, 4, 16, 'wood', .52, seed=33, boards=2)
        # a broken crate: staves sprung, bottles in straw
        bx, by = p.P(172, 0, 14)
        c.poly([(bx, by), (bx + 18, by), (bx + 16, by - 9), (bx + 2, by - 11)], 'wood', .35)
        c.line(bx + 2, by - 11, bx - 3, by - 16, 'wood', .55)
        c.line(bx + 16, by - 9, bx + 22, by - 14, 'wood', .5)
        c.rect(bx + 3, by - 9, bx + 15, by - 6, 'gold', .4)
        for k in range(4):
            c.vline(bx + 5 + k * 3, by - 13, by - 7, 'b_bottle_g', .45)
            c.put(bx + 5 + k * 3, by - 14, 'b_bottle_g', .7)
        # mould & fungus on the crates
        for (x_, y_) in ((p.P(124, 4, 18)[0], p.P(124, 4, 18)[1]), (p.P(150, 3, 18)[0], p.P(150, 3, 18)[1])):
            c.put(int(x_), int(y_), 'paper', .7)
            c.put(int(x_) + 1, int(y_) - 1, 'paper', .6)
    g['crates'] = (int(p.P(118, 30, 18)[0]) - 2, int(p.P(122, 30, 4)[1]) - 2, int(bx) + 24, cr_base)

    # ================================================= the rusted trolley (left) ====
    tX0, tX1, tZ0, tZ1 = 70, 100, 28, 64
    tr_base = int(p.P(0, 0, tZ1)[1])
    with sc.obj('trolley', baseline=tr_base):
        p.box(c, tX0, tX1, 5, 17, tZ0 + 2, tZ1 - 2, 'rust', front=.42, top=.5, side=.3)
        fx0, fy0, fx1, fy1 = p.front_rect(tX0, tX1, 5, 17, tZ1 - 2)
        for x in range(int(fx0) + 3, int(fx1) - 1, 4):
            c.put(x, int(fy0) + 2, 'rust', .7)
            c.put(x, int(fy1) - 2, 'rust', .7)
        c.hline(int(fx0), int(fx1), int(fy0), 'rust', .66)
        # wheels sunk in the water
        for X in (tX0 + 5, tX1 - 5):
            wx, wy = p.P(X, 4, tZ1 - 2)
            c.ellipse(wx, wy, 3.5, 3.5, 'steel', .35)
            c.ellipse(wx, wy, 1.5, 1.5, 'rust', .55)
        # a few bottles still in it
        tx, ty = p.P(80, 17, (tZ0 + tZ1) / 2)
        for k in range(3):
            c.vline(int(tx) + k * 3, int(ty) - 5, int(ty), 'b_bottle_a', .45)
    g['trolley'] = (int(p.P(tX0, 17, tZ1)[0]), int(p.P(tX0, 17, tZ0)[1]) - 6, int(p.P(tX1, 0, tZ1)[0]), tr_base)

    # ===================================================== conduit, rings, sconces ====
    # old cable on porcelain insulators along the wall
    for x in range(0, W, 30):
        c.put(x + 10, SPRING + 6, 'white', .6)
    for x in range(0, W):
        y = SPRING + 6 + int(2.2 * math.sin(((x + 10) % 30) / 30 * math.pi))
        c.put(x, y, 'ink', .3)
    # iron mooring rings / lantern brackets
    for x in (100, 196, 330):
        c.ellipse(x, 66, 2.5, 2.5, 'rust', .5)
        c.ellipse(x, 66, 1.2, 1.2, 'brick', .3)
        c.rect(x - 1, 61, x + 2, 64, 'rust', .55)
    # chalk tally marks + "ST.B ->" pointing right
    for k in range(5):
        c.line(204 + k * 2, 72, 204 + k * 2, 78, 'paper', .55)
    c.line(203, 77, 214, 73, 'paper', .5)
    c.rect(300, 54, 330, 62, 'paper', .5, dith=.4)
    B.text(c, 302, 56, 'ST.B', 'red', .4)
    c.line(320, 58, 327, 58, 'red', .4)
    c.put(326, 57, 'red', .4)
    c.put(326, 59, 'red', .4)

    # ====================================== the ladder & grate at the far right ====
    lx0, lx1 = 368, 384
    shaft_x0, shaft_x1 = 360, 392
    g['ladder'] = (lx0 - 2, 0, lx1 + 2, FLOOR + 4)
    # vertical shaft cut up through the vault
    c.rect(shaft_x0, 0, shaft_x1, SPRING + 2, 'concrete', vgrad(0, SPRING, .5, .3))
    B.bricks(c, shaft_x0, 0, shaft_x0 + 4, SPRING + 2, 'brick', base=.36, seed=12)
    B.bricks(c, shaft_x1 - 4, 0, shaft_x1, SPRING + 2, 'brick', base=.3, seed=13)
    # the grate at the top: grey daylight through bars
    c.rect(shaft_x0 + 4, 0, shaft_x1 - 4, 6, 'fog', .85, emis=.9)
    for x in range(shaft_x0 + 6, shaft_x1 - 4, 3):
        c.vline(x, 0, 6, 'steel', .2)
    c.hline(shaft_x0 + 4, shaft_x1 - 4, 6, 'steel', .3)
    # iron ladder: stiles + rungs, rusted
    for x in (lx0, lx1):
        c.rect(x, 2, x + 2, FLOOR + 2, 'rust', hgrad(x, x + 2, .6, .35))
        for y in range(10, FLOOR, 12):
            c.rect(x - 1, y, x + 3, y + 2, 'rust', .4)              # wall brackets
    for y in range(6, FLOOR, 6):
        c.hline(lx0 + 2, lx1, y, 'rust', .55)
        c.hline(lx0 + 2, lx1, y + 1, 'rust', .25)
    # light shaft from the grate falling down the ladder onto the water
    B.light_shaft(c, [(shaft_x0 + 4, 6), (shaft_x1 - 4, 6), (shaft_x1 + 10, FLOOR + 30), (shaft_x0 - 10, FLOOR + 30)],
                  .22, motes=20, seed=7)
    # a drift of leaves & litter washed down the shaft
    for k in range(10):
        c.put(364 + k * 3, FLOOR + 6 + (k % 3), 'olive', .45 + (k % 2) * .1)

    # ============================================================ rats' eyes ====
    for (x, y) in ((214, FLOOR + 1), (300, FLOOR + 2)):
        c.put(x, y, 'neonred', .6, emis=.8)
        c.put(x + 2, y, 'neonred', .6, emis=.8)

    # ================================================================ lighting ====
    c.ambient = .26
    c.add_light(200, 74, 190, .62, falloff=1.25)               # lantern-ish pool in the middle
    c.add_light(200, 116, 150, .26, ystretch=2.4)
    c.glow(200, 70, 90, '#ffb060', .06)
    c.add_light(376, 30, 110, .45, falloff=1.2)               # daylight down the shaft
    c.glow(376, 3, 30, '#d0dce8', .45)
    c.glow(acx, ay0 + 26, 12, '#ffb060', .25)
    c.shadow_poly(p.quad([(116, 0, 0), (196, 0, 0), (196, 0, 22), (116, 0, 22)]), .4)
    c.shadow_poly(p.quad([(tX0 - 2, 0, tZ0), (tX1 + 2, 0, tZ0), (tX1 + 2, 0, tZ1 + 3), (tX0 - 2, 0, tZ1 + 3)]), .35)
    # vertical vignette: the vault and the near edge fall off into darkness
    yy = np.arange(H, dtype=np.float32)[:, None]
    c.shade *= np.clip(.45 + (yy / 40), .45, 1) * np.clip(1.25 - (yy - 100) / 120, .7, 1)
    B.vignette(c, 200, 80, 300, 160, lo=.55)
    return g, p


def build():
    sc = Scene('tunnel', W, H, seed=SEED)
    g, p = paint(sc, set())

    ax0, ay, ax1, ay1 = g['back_arch']
    sc.hotspot('exit_back', rect=(0, ay, ax1 + 4, FLOOR + 6), walk=(18, 116), face='left')
    l = g['ladder']
    sc.hotspot('ladder', rect=l, walk=(376, 112), face='up')
    sc.hotspot('crates', rect=g['crates'], walk=(150, 112), face='up')
    ry0, ry1 = g['rails_y']
    sc.hotspot('rails', poly=[(110, ry0 - 3), (330, ry0 - 3), (330, ry1 + 4), (110, ry1 + 4)], walk=(220, 124),
               face='down')
    sc.hotspot('side_passage', rect=g['side'], walk=(258, 112), face='up')
    sc.hotspot('trolley', rect=g['trolley'], walk=(110, 126), face='left')

    def P2(X, Z):
        x, y = p.P(X, 0, Z)
        return (int(round(x)), int(round(y)))
    zf = p.z_at_floor_y(H - 6)
    poly = [P2(-60, 12), P2(460, 12), P2(460, zf), P2(-60, zf)]
    holes = [
        [P2(114, 0), P2(200, 0), P2(200, 24), P2(114, 24)],               # crates
        [P2(66, 24), P2(104, 24), P2(104, 68), P2(66, 68)],               # trolley
        [P2(212, 6), P2(300, 6), P2(300, 22), P2(212, 22)],               # rubble spill
    ]
    sc.walkable(poly, holes=holes)
    sc.point('start', 22, 118, 'right')
    sc.point('end', 374, 116, 'up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(100, p.char_scale(100, 140), 140, 1.0)
    sc.meta['floor'] = 'water'
    sc.meta['light'] = {'follow_player': True, 'note': 'bg is lit for a lantern carried by Rook'}

    # ---------------------------------------------------------- animations ----
    # drips from the vault into the water + spreading ring
    drips = [(150, 104), (262, 118), (340, 108), (60, 126)]

    def dfr(k):
        def f(cc):
            for i, (x, y) in enumerate(drips):
                ph = (k + i * 3) % 8
                if ph < 4:
                    yy = int(SPRING + 6 + (y - SPRING - 6) * (ph / 4))
                    cc.put(x, yy, 'paper', .75, emis=.4)
                else:
                    r = ph - 3
                    for a in np.linspace(0, 2 * math.pi, 10 + r * 4):
                        cc.put(int(round(x + math.cos(a) * r * 1.8)), int(round(y + math.sin(a) * r * .5)), 'water',
                               .7 - r * .08, emis=.3)
        return f
    sc.anim('drips', [dfr(k) for k in range(8)], fps=8)
    # glints sliding on the water
    rng = np.random.default_rng(4)
    glints = [(int(rng.integers(0, W)), int(rng.integers(102, 128))) for _ in range(28)]

    def gfr(k):
        def f(cc):
            for i, (x, y) in enumerate(glints):
                if (i + k) % 3 == 0:
                    cc.hline(x + k, x + k + 2, y, 'water', .78, emis=.4)
        return f
    sc.anim('water', [gfr(k) for k in range(3)], fps=4)
    # rats' eyes blink
    def rfr(on):
        def f(cc):
            for (x, y) in ((214, FLOOR + 1), (300, FLOOR + 2)):
                L = .6 if on else .05
                cc.put(x, y, 'neonred', L, emis=.8 if on else 0)
                cc.put(x + 2, y, 'neonred', L, emis=.8 if on else 0)
        return f
    sc.anim('rats', [rfr(True)] * 7 + [rfr(False)], fps=4)
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.rain(362, 0, 390, 40, density=.6, kind='outdoor')
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
