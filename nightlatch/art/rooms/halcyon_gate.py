"""Halcyon House - the gate on Gull Hill (Ch3 end, Ch4 escape, Ch8 epilogue).  Dusk, rain.

A high ivy-grown wall, stone pillars and a chained wrought-iron gate; through the bars the
gravel drive climbs to a grim white Victorian house with a few lit windows, poplars bending in
the wind against a bruised sunset.  A laundry van waits by the side gate; an old oak leans a
branch over the wall where an ash-can stands - the only way in that isn't through the front.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
import props_d as D

W, H = 320, 144
WALL_TOP = 50
WALL_BASE = 110
PIL_L = (106, 128)
PIL_R = (192, 214)
GATE = (128, 192)
ROAD_Y = 113


def build():
    sc = Scene('halcyon_gate', W, H, seed=33)
    c = sc.c
    rng = np.random.default_rng(12)
    N = noise2(W, H, 14, 2, 4)
    N2 = noise2(W, H, 4, 9, 2)

    def nz(xx, yy, n=N):
        return n[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)]

    # ------------------------------------------------------------------- sky -----------
    SKY_H = 64
    yy, xx = np.mgrid[0:SKY_H, 0:W].astype(np.float32)
    t = np.clip(yy / 62.0, 0, 1)
    base = .1 + t ** 1.5 * .6
    base += np.clip(1 - np.sqrt(((xx - 120) / 170) ** 2 + ((yy - 58) / 24) ** 2), 0, 1) * .22
    Nc = noise2(W * 2, SKY_H * 4, 22, 41, 3)
    nv = Nc[np.clip((yy * 3.2).astype(int), 0, SKY_H * 4 - 1), np.clip((xx * .8 + yy * 1.5).astype(int), 0, W * 2 - 1)]
    thr = .52 + t * .08
    cloud = nv > thr
    rim = cloud & ~np.vstack([cloud[1:, :], np.zeros((1, W), bool)])          # bottom edge of a cloud
    rim2 = cloud & ~np.vstack([cloud[2:, :], np.zeros((2, W), bool)]) & ~rim
    L = np.where(cloud, .16 + t * .22 + (nv - thr) * -.3, base)
    L = np.where(rim, base + .1, L)
    L = np.where(rim2, (base + .1 + .16 + t * .22) / 2, L)
    c._apply(np.ones((SKY_H, W), bool), 'd_dusk', L, emis=1, dith=.55, region=(0, 0, W, SKY_H))
    c._apply(cloud & ~rim & ~rim2, 'dusk', np.clip(.3 + t * .3 + (nv - thr) * -.4, 0, 1), emis=1, dith=.5,
             region=(0, 0, W, SKY_H))
    # ------------------------------------------------------------ Gull Hill -----------
    def hill_y(x):
        return 60 - 13 * math.exp(-((x - 170) / 95) ** 2) + 2 * math.sin(x * .05)
    for x in range(W):
        hy = int(round(hill_y(x)))
        c.vline(x, hy, 72, 'night', .2 + .03 * math.sin(x * .3))
        c.put(x, hy, 'd_dusk', .35, emis=.8)                 # rim light along the crest

    # ------------------------------------------------------------ the house ------------
    def house():
        F = 'white'
        base = 49
        # wings
        c.rect(118, 28, 150, base, F, hgrad(118, 150, .5, .42), emis=.15, dith=.3)
        c.rect(188, 30, 232, base, F, hgrad(188, 232, .48, .38), emis=.15, dith=.3)
        # main block
        c.rect(146, 20, 194, base, F, hgrad(146, 194, .55, .44), emis=.15, dith=.3)
        # mansard roofs (slate, wet)
        c.poly([(116, 28), (122, 21), (148, 21), (152, 28)], 'd_stone', .35, dith=.2)
        c.poly([(186, 30), (191, 24), (229, 24), (234, 30)], 'd_stone', .32, dith=.2)
        c.poly([(144, 20), (150, 12), (190, 12), (196, 20)], 'd_stone', .38, dith=.2)
        for (x0, x1, y) in ((122, 148, 21), (191, 229, 24), (150, 190, 12)):
            c.hline(x0, x1, y, 'd_stone', .6)
        # dormers
        for dx in (126, 136, 196, 208, 220, 156, 182):
            dy = 22 if dx < 150 else (25 if dx > 190 else 13)
            c.rect(dx, dy + 1, dx + 4, dy + 6, F, .45, emis=.15, dith=0)
            c.poly([(dx - 1, dy + 1), (dx + 2, dy - 2), (dx + 5, dy + 1)], 'd_stone', .45, dith=0)
            c.rect(dx + 1, dy + 2, dx + 3, dy + 5, 'glass', .15, dith=0)
        # central tower with a pyramid roof and iron cresting
        c.rect(162, 4, 178, base, F, hgrad(162, 178, .6, .46), emis=.15, dith=.3)
        c.poly([(160, 4), (170, -8), (180, 4)], 'd_stone', .4, dith=0)
        c.vline(170, -12, -6, 'black', .4)
        c.hline(160, 181, 4, F, .65, emis=.15)
        for k in range(161, 180, 2):
            c.put(k, 3, 'black', .3)
        c.rect(166, 6, 174, 12, 'glass', .2, dith=0)                     # tower clock / round window
        c.ellipse(170, 9, 3, 3, 'paper', .45, emis=.5, dith=0)
        # chimneys
        for (cx_, cy_) in ((128, 16), (144, 15), (198, 18), (224, 19), (186, 8)):
            c.rect(cx_, cy_, cx_ + 3, cy_ + 8, 'brick', .3, dith=0)
            c.hline(cx_ - 1, cx_ + 4, cy_, 'brick', .45)
        # cornices & string courses
        for (x0, x1, y) in ((118, 150, 36), (146, 194, 31), (188, 232, 38), (146, 194, 40), (162, 178, 20)):
            c.hline(x0, x1, y, F, .7, emis=.15)
        # windows: mostly dark, a handful lit
        lit = {(124, 30), (156, 33), (182, 42), (212, 40), (170, 24), (140, 42), (226, 32)}
        for (x0, x1, ys) in ((120, 148, (30, 41)), (148, 192, (22, 33, 42)), (190, 230, (32, 41)), (164, 176, (14, 24, 34))):
            for wx in range(x0 + 2, x1 - 2, 6 if x0 != 164 else 6):
                for wy in ys:
                    if (wx, wy) in lit:
                        c.rect(wx, wy, wx + 2, wy + 4, 'lamp', .72, emis=1, dith=0)
                        c.put(wx, wy, 'lamp', .95, emis=1)
                    else:
                        c.rect(wx, wy, wx + 2, wy + 4, 'glass', .12, dith=0)
                        c.put(wx, wy, 'glass', .35, emis=.3)
        # one lit window with a figure standing in it (watching the gate)
        c.rect(182, 42, 184, 46, 'lamp', .7, emis=1, dith=0)
        c.vline(183, 43, 46, 'black', .2)
        c.put(183, 42, 'black', .2)
        # porch with columns + lit fanlight (the front door)
        c.rect(162, 42, 178, base, F, .42, emis=.1, dith=0)
        c.rect(167, 44, 173, base, 'lamp', .55, emis=1, dith=0)
        c.ellipse(170, 44, 3, 2, 'lamp', .8, emis=1, dith=0)
        for k in (163, 166, 174, 177):
            c.vline(k, 42, base, F, .7, emis=.1)
    house()
    # ---------------------------------------------------- poplars bending in the wind --
    def poplar(x, ybase, h, w, lean=.22, lum=.16):
        for t in range(h):
            u = t / h
            wd = w * math.sin(math.pi * min(1, (u + .08))) ** .6 * (1 - u * .35)
            cx_ = x + lean * (t ** 1.35) / (h ** .35)
            y = ybase - t
            c.hline(int(cx_ - wd), int(cx_ + wd) + 1, y, 'teal', lum + .05 * math.sin(t * .9 + x), emis=.05)
            if t % 3 == 0 and wd > 1:
                c.put(int(cx_ - wd), y, 'teal', lum + .12)         # leaves catching the sky
        c.vline(int(x), ybase, ybase + 3, 'wood', .2)
    for (x, yb, h_, w_, ln) in ((104, 56, 38, 3.2, .26), (112, 54, 30, 2.6, .22), (232, 56, 40, 3.4, .3),
                               (242, 57, 30, 2.6, .26), (252, 58, 24, 2.2, .24), (92, 58, 26, 2.4, .22),
                               (150, 50, 20, 2, .2), (196, 50, 22, 2.2, .22)):
        poplar(x, yb, h_, w_, ln)

    # --------------------------------------------- grounds behind the gate (lawn/drive) --
    gl, gr = GATE
    c.rect(gl - 6, 52, gr + 6, WALL_BASE, 'grass', vgrad(52, WALL_BASE, .18, .3), dith=.5)
    for x in range(gl - 6, gr + 6):
        c.put(x, int(round(hill_y(x))) + 1, 'grass', .3)
    # drive: pale gravel climbing to the porch, low box hedges either side, two lamp posts
    drive = [(150, WALL_BASE), (172, WALL_BASE), (172, 80), (169, 60), (168, 52), (166, 52), (164, 60), (158, 80)]
    c.poly(drive, 'paper', lambda xx, yy: .3 + (yy - 52) / 58 * .18 + (nz(xx, yy, N2) - .5) * .12, dith=.5)
    for side in (-1, 1):
        pts = [(161 + side * 13, WALL_BASE), (161 + side * 16, WALL_BASE), (166 + side * 3, 56), (166 + side * 2, 56)]
        c.poly(pts, 'felt', .32, dith=.3)
    for (lx, ly, hh) in ((152, 80, 9), (176, 80, 9), (160, 62, 5), (172, 62, 5)):
        c.vline(lx, ly - hh, ly, 'black', .3)
        c.rect(lx - 1, ly - hh - 2, lx + 2, ly - hh + 1, 'lamp', .8, emis=1, dith=0)
        c.glow(lx, ly - hh, 7, '#ffd070', .45)

    # ------------------------------------------------------------- the oak (left) ------
    # inside the wall: a black, twisted oak against the sky; one heavy limb over the wall
    def branch(x0, y0, x1, y1, w0, w1, L=.2):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for t in range(n + 1):
            u = t / max(1, n)
            x = x0 + (x1 - x0) * u + math.sin(u * 6 + x0) * 1.2
            y = y0 + (y1 - y0) * u
            w = w0 + (w1 - w0) * u
            c.hline(int(x - w / 2), int(x + w / 2) + 1, int(y), 'wood', L)
            c.put(int(x - w / 2), int(y), 'd_dusk', .3, emis=.6)                 # rim of afterglow
    branch(40, WALL_TOP, 36, 30, 7, 5)
    branch(37, 32, 14, 16, 4, 1.5)
    branch(38, 30, 50, 10, 4, 1.5)
    branch(36, 24, 26, 4, 2.5, 1)
    branch(48, 18, 70, 12, 2, 1)
    branch(39, 38, 70, 44, 4.5, 3.5, .22)
    branch(70, 44, 92, 50, 3.5, 2.5, .22)
    branch(92, 50, 101, 57, 2.5, 1, .22)
    branch(64, 43, 74, 36, 1.5, 1)
    # sparse late-autumn foliage in clumps
    for (bx, by, rx, ry) in ((16, 14, 9, 5), (30, 6, 10, 5), (52, 8, 11, 5), (68, 12, 9, 4), (8, 26, 8, 4),
                             (44, 22, 8, 4), (76, 38, 7, 4), (96, 52, 6, 3), (86, 47, 5, 3)):
        D.dfill_ellipse(c, bx, by, rx, ry, 'teal', .16, density=.9)
        D.dfill_ellipse(c, bx - 2, by - 2, rx * .6, ry * .5, 'olive', .3, density=.45)

    # ---------------------------------------------------------------- the wall ---------
    def stone(xx, yy):
        row = np.floor((yy - WALL_TOP - 4) / 7)
        off = (row % 2) * 7
        bw = 14
        fx = (xx + off) % bw
        fy = (yy - WALL_TOP - 4) % 7
        blk = np.floor((xx + off) / bw) * 13 + row * 7
        L = .5 + ((blk % 7) - 3) * .022 + (nz(xx, yy, N2) - .5) * .14
        L = np.where((fy < 1) | (fx < 1), .2, L)
        L = np.where((fy >= 1) & (fy < 2) & (fx >= 1), L + .08, L)              # top edge of each block
        L = L - np.clip((yy - 96) / 20, 0, 1) * .08                              # rising damp
        return L
    for (x0, x1) in ((0, PIL_L[0]), (PIL_R[1], W)):
        c.rect(x0, WALL_TOP + 4, x1, WALL_BASE, 'concrete', stone, dith=.3)
        c.rect(x0, WALL_TOP, x1, WALL_TOP + 4, 'slate', .42, dith=0)          # coping
        c.hline(x0, x1, WALL_TOP, 'slate', .62)
        c.hline(x0, x1, WALL_TOP + 4, 'black', .25)
        # broken glass set in the coping (glinting)
        for x in range(x0 + 2, x1 - 1, 3):
            hh = 1 + (x * 7) % 3
            c.vline(x, WALL_TOP - hh, WALL_TOP, 'glass', .55 + (x % 5) * .06, emis=.3)
            if x % 4 == 0:
                c.put(x, WALL_TOP - hh, 'glass', .95, emis=.7)
        # moss and black rain streaks
        for k in range(x0 + 3, x1 - 2, 9):
            L_ = int(6 + (k * 13) % 14)
            c.modulate(k, WALL_TOP + 4, k + 2, WALL_TOP + 4 + L_, lambda xx, yy, L_=L_: .78 + (yy - WALL_TOP) / (L_ + 8) * .2)
    # enamel sign on the right wall: PRIVATE
    SIGN = (240, 56, 270, 67)
    c.rect(*SIGN, 'white', .7, dith=0)
    c.rect(SIGN[0] + 1, SIGN[1] + 1, SIGN[2] - 1, SIGN[3] - 1, 'denim', .4, dith=0)
    D.text(c, SIGN[0] + 2, SIGN[1] + 3, 'PRIVATE', 'white', .85)
    c.put(SIGN[0], SIGN[1], 'rust', .4)
    c.put(SIGN[2] - 1, SIGN[3] - 1, 'rust', .45)
    c.put(SIGN[0] + 1, SIGN[3] - 2, 'rust', .35)

    # ----------------------------------------------------------------- ivy -------------
    def ivy(pts, seed, dens=1.0):
        """Dense ivy: a dark mass, then hundreds of small leaves catching the light from above-left."""
        m, r = c.poly_mask(pts)
        if m is None:
            return
        Ni = noise2(W, H, 3, seed, 2)
        yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32)
        v = Ni[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)]
        mass = m & (v > .3 / dens)
        c._apply(mass, 'grass', .14 + (v - .5) * .1, dith=0, region=r)
        lr = np.random.default_rng(seed)
        for y in range(r[1], r[3], 2):
            for x in range(r[0] + (y % 4) // 2, r[2], 3):
                jx = x + int(lr.integers(-1, 2))
                jy = y + int(lr.integers(-1, 2))
                if not (r[0] <= jx < r[2] - 1 and r[1] + 1 <= jy < r[3]):
                    continue
                if not mass[jy - r[1], jx - r[0]]:
                    continue
                L = .3 + lr.random() * .22
                c.put(jx, jy, 'grass', L)
                c.put(jx + 1, jy, 'grass', L - .08)
                c.put(jx, jy + 1, 'grass', L - .14)
                if lr.random() < .45:
                    c.put(jx, jy - 1, 'grass', min(.95, L + .3))         # wet highlight
                if lr.random() < .08:
                    c.put(jx + 1, jy + 1, 'olive', .55)                   # an autumn leaf
    ivy([(0, 46), (30, 44), (58, 47), (76, 52), (82, 70), (70, 92), (64, 110), (40, 110), (30, 86), (8, 96), (0, 100)], 5)
    ivy([(84, 49), (104, 48), (106, 66), (98, 76), (90, 66)], 7, .9)
    ivy([(214, 48), (232, 50), (236, 60), (224, 64), (218, 80), (214, 82)], 8, .9)
    ivy([(286, 48), (320, 46), (320, 104), (306, 90), (296, 70)], 9)
    for x in range(4, 80, 6):                           # tendrils hanging over the coping
        L_ = 3 + (x * 7) % 9
        for t in range(L_):
            c.put(x + (t // 3) % 2, WALL_TOP + t, 'grass', .45 - t * .02)

    # ----------------------------------------------------------- pillars + gate ---------
    for (x0, x1), lit in ((PIL_L, True), (PIL_R, False)):
        def pil(xx, yy, x0=x0):
            row = np.floor((yy - 34) / 8)
            fy = (yy - 34) % 8
            L = .5 + ((row % 3) - 1) * .02 + (nz(xx, yy, N2) - .5) * .12
            L = np.where(fy < 1, .26, L)
            L = L + np.clip(1 - (xx - x0) / 6, 0, 1) * .08 - np.clip((xx - x0 - 14) / 8, 0, 1) * .12
            return L
        c.rect(x0, 34, x1, WALL_BASE + 2, 'concrete', pil, dith=.3)
        c.vline(x0, 34, WALL_BASE + 2, 'concrete', .66)
        c.vline(x1 - 1, 34, WALL_BASE + 2, 'concrete', .22)
        c.rect(x0 - 3, 29, x1 + 3, 35, 'slate', .5, dith=0)               # cap
        c.hline(x0 - 3, x1 + 3, 29, 'slate', .75)
        c.hline(x0 - 3, x1 + 3, 34, 'black', .25)
        c.rect(x0 - 2, WALL_BASE - 2, x1 + 2, WALL_BASE + 3, 'concrete', .38, dith=0)   # plinth
        c.hline(x0 - 2, x1 + 2, WALL_BASE - 2, 'concrete', .55)
        # iron lantern on the cap
        lx = (x0 + x1) // 2
        c.rect(lx - 1, 25, lx + 2, 29, 'black', .3, dith=0)
        c.poly([(lx - 4, 16), (lx + 5, 16), (lx + 4, 25), (lx - 3, 25)], 'black', .28, dith=0)
        if lit:
            c.rect(lx - 2, 17, lx + 3, 24, 'd_amber', .78, emis=1, dith=0)
            c.rect(lx - 1, 18, lx + 2, 22, 'd_amber', .95, emis=1, dith=0)
        else:
            c.rect(lx - 2, 17, lx + 3, 24, 'glass', .18, dith=0)
            c.line(lx - 2, 18, lx + 2, 23, 'glass', .5, emis=.3)            # cracked pane
        c.vline(lx - 2, 16, 25, 'black', .25)
        c.vline(lx + 2, 16, 25, 'black', .25)
        c.poly([(lx - 5, 16), (lx + .5, 11), (lx + 6, 16)], 'black', .3, dith=0)
        c.put(lx, 10, 'black', .4)
    # brass plaque on the left pillar
    PLQ = (PIL_L[0] + 3, 70, PIL_L[1] - 3, 82)
    c.rect(*PLQ, 'brass', .55, dith=0)
    c.hline(PLQ[0], PLQ[2], PLQ[1], 'brass', .85)
    c.vline(PLQ[2] - 1, PLQ[1], PLQ[3], 'brass', .32)
    c.hline(PLQ[0], PLQ[2], PLQ[3] - 1, 'brass', .3)
    D.text(c, PLQ[0] + 3, PLQ[1] + 2, 'H H', 'brass', .25)
    c.hline(PLQ[0] + 2, PLQ[2] - 2, PLQ[1] + 8, 'brass', .3)
    c.hline(PLQ[0] + 4, PLQ[2] - 4, PLQ[1] + 10, 'brass', .32)
    for (sx, sy) in ((PLQ[0] + 1, PLQ[1] + 1), (PLQ[2] - 2, PLQ[1] + 1), (PLQ[0] + 1, PLQ[3] - 2), (PLQ[2] - 2, PLQ[3] - 2)):
        c.put(sx, sy, 'brass', .9)
    c.modulate(PLQ[0], PLQ[3], PLQ[2], PLQ[3] + 10, lambda xx, yy: .8 + (yy - PLQ[3]) / 12 * .2)   # verdigris drip
    for k in range(PLQ[0] + 2, PLQ[2] - 2, 4):
        c.vline(k, PLQ[3], PLQ[3] + 3 + k % 3, 'teal', .45)

    # the gate: two leaves of bars with spear heads, rails, an arch with iron letters
    for x in range(gl + 1, gr, 4):
        top = 46 if x in range(gl + 1, gl + 6) or x in range(gr - 5, gr) else 52 + int(4 * math.sin(math.pi * (x - gl) / (gr - gl)) * -1)
        top = 52 - int(round(3 * math.sin(math.pi * (x - gl) / (gr - gl))))
        c.vline(x, top, WALL_BASE + 1, 'black', .28)
        c.vline(x + 1, top + 1, WALL_BASE + 1, 'steel', .32)
        c.poly([(x - 1, top), (x + .5, top - 4), (x + 2, top)], 'black', .35, dith=0)    # spear head
        c.put(x, top - 2, 'brass', .5)
    for y in (60, 64, 98, 102):
        c.hline(gl, gr, y, 'black', .3)
        c.hline(gl, gr, y + 1, 'steel', .4)
    # scroll panel between the rails
    for k in range(gl + 3, gr - 3, 8):
        for t in range(12):
            a = t / 12 * 2 * math.pi
            c.put(int(k + 2 + math.cos(a) * 2.5), int(81 + math.sin(a) * 4), 'black', .35)
    c.vline(160, 46, WALL_BASE + 1, 'black', .22)                   # meeting stiles
    c.vline(161, 46, WALL_BASE + 1, 'steel', .45)
    # heavy chain and padlock
    for k in range(-7, 8):
        yk = 82 + int(abs(k) * .5)
        c.put(160 + k, yk, 'steel', .7 if k % 2 else .45)
        c.put(160 + k, yk + 1, 'black', .2)
    c.rect(158, 85, 163, 91, 'brass', .52, dith=0)
    c.hline(158, 163, 85, 'brass', .85)
    c.put(160, 88, 'black', .1)
    c.ellipse(160.5, 84, 2, 2, 'steel', .6, dith=0)
    # iron arch over the gate: two arcs with a lettered band between, scrolls at the springing
    def arc_y(k, base, rise):
        u = (k - (gl - 2)) / (gr - gl + 4)
        return base - int(round(rise * math.sin(math.pi * u)))
    for k in range(gl - 2, gr + 3):
        c.put(k, arc_y(k, 37, 4), 'black', .35)
        c.put(k, arc_y(k, 37, 4) + 1, 'steel', .32)
        c.put(k, arc_y(k, 46, 3), 'black', .35)
        c.put(k, arc_y(k, 46, 3) + 1, 'steel', .3)
    for k in (gl - 1, gl + 1, gr - 2, gr):
        c.vline(k, arc_y(k, 37, 4), arc_y(k, 46, 3) + 2, 'black', .32)
    for (sx, sgn) in ((gl + 4, 1), (gr - 5, -1)):
        for t in range(10):
            a_ = t / 10 * 2 * math.pi
            c.put(int(sx + math.cos(a_) * 2), int(49 + math.sin(a_) * 2), 'black', .4)
    for k in range(gl - 1, gr + 2):                                     # dark iron band
        y_a = arc_y(k, 37, 4) + 2
        y_b = arc_y(k, 46, 3)
        c.vline(k, y_a, y_b, 'black', .18)
    tw = D.text_w('HALCYON HOUSE')
    D.text(c, 160 - tw // 2, 38, 'HALCYON HOUSE', 'gold', .62)
    for k in range(gl + 4, gr - 4):
        if (k - gl) % 7 == 0:
            c.put(k, arc_y(k, 37, 4) - 1, 'black', .35)          # little finials on the arch
    # a crow on the arch
    c.poly([(176, 31), (180, 30), (182, 32), (179, 34), (175, 33)], 'black', .15, dith=0)
    c.put(182, 31, 'black', .2)
    c.put(176, 34, 'black', .2)

    # ------------------------------------------------------------- side gate (right) --
    # the tradesmen's gate: an arched opening with a lamp; the van stands in front of it
    sg = (280, 60, 304, WALL_BASE)
    c.rect(sg[0] - 3, sg[1] - 2, sg[2] + 3, sg[3], 'concrete', .55, dith=0)
    c.ellipse((sg[0] + sg[2]) / 2, sg[1], (sg[2] - sg[0]) / 2 + 3, 6, 'concrete', .55, dith=0)
    c.ellipse((sg[0] + sg[2]) / 2, sg[1] + 1, (sg[2] - sg[0]) / 2, 5, 'wood', .3, dith=0)
    c.rect(*sg, 'wood', lambda xx, yy: .34 + np.where((xx.astype(int) % 4) == 0, -.1, 0), dith=.2)
    c.hline(sg[0], sg[2], sg[1] + 8, 'black', .3)
    c.put((sg[0] + sg[2]) // 2, sg[1] - 7, 'black', .4)
    c.rect((sg[0] + sg[2]) // 2 - 2, sg[1] - 12, (sg[0] + sg[2]) // 2 + 3, sg[1] - 7, 'lamp', .6, emis=1, dith=0)
    c.hline((sg[0] + sg[2]) // 2 - 3, (sg[0] + sg[2]) // 2 + 4, sg[1] - 13, 'black', .35)
    c.glow((sg[0] + sg[2]) // 2, sg[1] - 9, 12, '#ffc060', .4)

    # ------------------------------------------------------------ pavement + road -------
    c.rect(0, WALL_BASE, W, ROAD_Y, 'slate', .4, dith=.2)            # kerb-side pavement
    c.hline(0, W, WALL_BASE, 'slate', .22)
    c.rect(0, ROAD_Y, W, ROAD_Y + 2, 'concrete', .55, dith=0)        # kerb
    c.hline(0, W, ROAD_Y, 'concrete', .72)

    # wet cobbles, rows growing towards the viewer, each with a rain-slick top edge
    c.rect(0, ROAD_Y + 2, W, H, 'night', .12, dith=0)
    rows = []
    y = ROAD_Y + 3
    hgt = 2.4
    while y < H:
        rows.append((int(y), int(round(hgt))))
        y += round(hgt) + 1
        hgt += .45
    crng = np.random.default_rng(31)
    for ri, (ry_, rh) in enumerate(rows):
        cw_ = int(rh * 2.2) + 2
        x = -int(crng.integers(0, cw_))
        while x < W:
            w_ = cw_ + int(crng.integers(-1, 2))
            L = .3 + crng.random() * .08 + ri * .006
            c.rect(x + 1, ry_, x + w_, ry_ + rh, 'night', L, dith=.3)
            c.hline(x + 2, x + w_ - 1, ry_, 'night', L + .16)               # wet top edge
            c.put(x + 1, ry_ + rh - 1, 'night', L - .08)
            x += w_ + 1
    ROWS = rows

    def streak(cc, lx_, ramp_, L0, spread=2.0, y0=ROAD_Y + 3, y1=H, step=1):
        # broken reflection of a light source in the wet cobbles: dashes on the slick top edges
        jr = np.random.default_rng(lx_ * 31 + 7)
        for (ry_, rh) in ROWS:
            if ry_ < y0 or ry_ >= y1:
                continue
            fall = (ry_ - y0) / max(1, (H - y0))
            if jr.random() < .18 + fall * .2:
                continue                                           # a gap between wet cobbles
            wdt = max(1, int(round(spread + fall * spread * 1.5 + jr.integers(-1, 2))))
            L = L0 * (1 - fall * .55) * (.8 + jr.random() * .3)
            j = int(jr.integers(-2, 3))
            cc.hline(lx_ - wdt + j, lx_ + wdt + 1 + j, ry_, ramp_, L, emis=1)
            if rh > 3 and jr.random() < .5:
                k2 = int(jr.integers(-1, 2))
                cc.hline(lx_ - wdt // 2 + k2, lx_ + wdt // 2 + 1 + k2, ry_ + 1, ramp_, L * .7, emis=1)
    lantern_x0 = (PIL_L[0] + PIL_L[1]) // 2
    streak(c, 27, 'lamp', .66, 2.5)                                  # street lamp
    streak(c, lantern_x0, 'd_amber', .6, 1.5)                        # gate lantern
    streak(c, 152, 'lamp', .42, 1)                                   # the drive lamps, through the bars
    streak(c, 176, 'lamp', .42, 1)
    # gutter + drain
    c.hline(0, W, ROAD_Y + 2, 'black', .2)
    c.rect(186, ROAD_Y + 2, 196, ROAD_Y + 5, 'black', .15, dith=0)
    for k in range(187, 196, 2):
        c.vline(k, ROAD_Y + 2, ROAD_Y + 5, 'steel', .4)
    # puddles: irregular, holding the sky's afterglow and the lights
    PUDDLES = [((64, 133, 20, 4), (80, 131, 12, 3), (50, 135, 10, 2.5)),
               ((150, 125, 18, 3.2), (166, 126, 14, 3), (138, 127, 9, 2.4)),
               ((240, 139, 16, 3.4), (252, 137, 9, 2.4)),
               ((10, 122, 10, 2.2), (20, 121, 7, 1.8))]
    REFL = [(lantern_x0, 'd_amber', .8), (152, 'lamp', .62), (176, 'lamp', .62), (27, 'lamp', .8)]

    def puddle(cc, parts):
        for (px, py, rx, ry) in parts:
            cc.ellipse(px, py, rx, ry, 'water', .2, emis=.4, dith=0)
        for (px, py, rx, ry) in parts:
            cc.ellipse(px, py - .3, rx - 1.2, ry - .8, 'd_dusk', vgrad(py - ry, py + ry, .58, .34), emis=.9, dith=.5)
        x0_ = int(min(p_[0] - p_[2] for p_ in parts))
        x1_ = int(max(p_[0] + p_[2] for p_ in parts))
        y0_ = int(min(p_[1] - p_[3] for p_ in parts))
        y1_ = int(max(p_[1] + p_[3] for p_ in parts))
        def inside(x, y):
            return any(((x + .5 - px) / (rx - 1.2)) ** 2 + ((y + .5 - py) / (ry - .8)) ** 2 <= 1 for (px, py, rx, ry) in parts)
        for x in range(x0_, x1_ + 1):
            dark = (gl < x < gr and (x - gl - 1) % 4 == 0) and ((x - gl) // 4) % 2 == 0
            pil = PIL_L[0] <= x < PIL_L[1] or PIL_R[0] <= x < PIL_R[1]
            for y in range(y0_, y1_ + 1):
                if not inside(x, y):
                    continue
                if dark:
                    cc.put(x, y, 'black', .2)
                elif pil:
                    cc.put(x, y, 'concrete', .32, .4)
        for (lx_, r_, L_) in REFL:
            for y in range(y0_, y1_ + 1):
                for x in range(lx_ - 1, lx_ + 2):
                    if inside(x, y) and (y + x) % 3 != 0:
                        cc.put(x, y, r_, L_ - (y - y0_) * .04, 1)
        for (px, py, rx, ry) in parts:
            cc.hline(int(px - rx + 3), int(px + rx - 2), int(py - ry + 1), 'water', .6, emis=.6)
    for parts in PUDDLES:
        puddle(c, parts)
    # wet leaves
    for k in range(40):
        x = int(rng.integers(0, W))
        y = int(rng.integers(ROAD_Y + 4, H))
        c.put(x, y, 'rust' if k % 3 else 'olive', .5 + rng.random() * .2)

    # --------------------------------------------- ash-can + crates (climbing spot) -----
    ax, ay = 58, 112
    c.shadow_ellipse(ax + 7, ay + 1, 12, 2.5, .5)
    c.rect(ax, ay - 16, ax + 13, ay, 'steel', hgrad(ax, ax + 13, .55, .28), dith=.2)
    for yy_ in (ay - 13, ay - 7, ay - 2):
        c.hline(ax, ax + 13, yy_, 'steel', .65)
        c.hline(ax, ax + 13, yy_ + 1, 'steel', .2)
    c.ellipse(ax + 6.5, ay - 17, 8, 2, 'steel', .6, dith=0)          # lid
    c.rect(ax + 5, ay - 20, ax + 9, ay - 18, 'steel', .5, dith=0)
    c.hline(ax - 1, ax + 14, ay - 17, 'steel', .78)
    p_ = [(ax + 15, ay - 9), (ax + 27, ay - 10), (ax + 28, ay), (ax + 15, ay)]   # an upturned crate
    c.poly(p_, 'oak', .4, dith=0)
    for k in range(ay - 8, ay, 3):
        c.hline(ax + 15, ax + 28, k, 'oak', .25)
    c.hline(ax + 15, ax + 27, ay - 10, 'oak', .62)
    c.vline(ax + 21, ay - 9, ay, 'oak', .3)

    # --------------------------------------------------------------- street lamp ------
    slx = 18
    c.rect(slx - 3, 108, slx + 4, 122, 'black', .3, dith=0)
    c.vline(slx, 26, 110, 'black', .3)
    c.vline(slx + 1, 26, 110, 'steel', .32)
    c.hline(slx - 2, slx + 4, 60, 'black', .4)
    c.line(slx + 1, 30, slx + 8, 28, 'black', .35)
    c.poly([(slx + 4, 24), (slx + 13, 24), (slx + 11, 31), (slx + 6, 31)], 'black', .3, dith=0)
    c.rect(slx + 6, 31, slx + 12, 34, 'lamp', .85, emis=1, dith=0)
    c.hline(slx + 7, slx + 11, 34, 'lamp', 1.0, emis=1)

    # ----------------------------------------------------------- the laundry van -------
    with sc.obj('van', baseline=126):
        # 1940s panel truck in profile, nose to the left; rear box runs off the edge
        c.shadow_poly([(206, 124), (W, 124), (W, 129), (208, 128)], .55)
        body = lambda xx, yy: .56 - (yy - 70) / 44 * .14 + np.where(yy < 73, .1, 0)
        # rear wheel arch (dark) then the body
        c.rect(262, 70, W, 113, 'cream', body, dith=.3)
        c.hline(263, W, 70, 'cream', .85)
        c.put(262, 71, 'cream', .7)
        c.ellipse(300, 116, 11, 9, 'black', .1, dith=0)
        # cab with slanted windscreen
        c.poly([(240, 89), (245, 76), (250, 72), (263, 70), (263, 113), (240, 113)], 'cream',
               lambda xx, yy: .6 - (yy - 70) / 44 * .14, dith=.3)
        c.line(240, 89, 245, 76, 'cream', .8)
        c.line(245, 76, 250, 72, 'cream', .85)
        c.poly([(246, 78), (250, 75), (259, 75), (259, 88), (243, 88)], 'glass', .28, emis=.25, dith=0)
        c.line(245, 87, 250, 77, 'glass', .7, emis=.4)
        c.vline(262, 72, 113, 'cream', .38)                       # door seam
        c.vline(241, 90, 112, 'cream', .38)
        c.rect(255, 92, 259, 94, 'chrome', .75, dith=0)           # door handle
        # long hood sloping to a vertical nose
        c.poly([(240, 89), (240, 104), (215, 104), (215, 95), (218, 92)], 'cream', hgrad(215, 240, .66, .56), dith=.3)
        c.line(218, 92, 240, 89, 'cream', .85)
        for k in range(222, 236, 3):
            c.line(k, 95, k + 1, 100, 'cream', .38)               # louvres
        c.rect(213, 93, 216, 107, 'chrome', vgrad(93, 107, .75, .45), dith=0)   # grille edge-on
        for k in range(94, 107, 2):
            c.put(214, k, 'black', .3)
        # front wheel, then the bulbous fender over it
        c.ellipse(232, 117, 8, 8, 'black', .16, dith=0)
        c.ellipse(232, 117, 4.4, 4.4, 'chrome', .5, dith=0)
        c.ellipse(232, 117, 1.8, 1.8, 'chrome', .9, dith=0)
        fender = [(212, 113), (212, 105), (215, 101), (221, 98), (232, 97), (242, 99), (247, 104), (248, 112),
                  (243, 112), (241, 108), (237, 106), (227, 106), (223, 108), (221, 113)]
        c.poly(fender, 'cream', lambda xx, yy: .55 - (yy - 97) / 16 * .2, dith=.2)
        c.line(215, 101, 221, 98, 'cream', .82)
        c.line(221, 98, 242, 99, 'cream', .8)
        c.ellipse(219.5, 100.5, 2.6, 2.6, 'chrome', .75, dith=0)  # headlamp pod
        c.ellipse(218.8, 100.5, 1.6, 1.8, 'lamp', .45, dith=0)
        c.rect(206, 109, 222, 113, 'chrome', vgrad(109, 113, .9, .5), dith=0)   # bumper
        c.put(206, 109, 'chrome', 1.0)
        # running board and rear wheel
        c.rect(247, 111, 290, 114, 'cream', .4, dith=0)
        c.hline(247, 290, 111, 'cream', .6)
        c.ellipse(300, 117, 8, 8, 'black', .16, dith=0)
        c.ellipse(300, 117, 4.4, 4.4, 'chrome', .5, dith=0)
        c.ellipse(300, 117, 1.8, 1.8, 'chrome', .9, dith=0)
        # sign-writing on the panel
        c.hline(266, W, 78, 'red', .45)
        c.hline(266, W, 100, 'red', .45)
        D.text(c, 270, 82, 'BRACKWATER', 'red', .5)
        D.text(c, 274, 90, 'LAUNDRY', 'denim', .4)
        for k in range(264, W, 4):                                # rain beading on the roof
            c.put(k, 71, 'white', .9)
        for k in range(222, 240, 4):
            c.put(k, 91, 'white', .85)

    # ------------------------------------------------------------ lighting -------------
    c.ambient = .42
    lantern_x = (PIL_L[0] + PIL_L[1]) // 2
    c.add_light(lantern_x, 21, 78, .62, falloff=1.25)          # lit gate lantern
    c.add_light(slx + 9, 33, 110, .62, falloff=1.25)           # street lamp
    c.add_light(slx + 9, 128, 70, .35, ystretch=3.5)           # its pool on the road
    c.add_light(lantern_x, 120, 60, .3, ystretch=3)
    c.add_light(170, 40, 120, .18)                             # sky glow
    c.glow(lantern_x, 21, 20, '#ffcc70', .55)
    c.glow(slx + 9, 32, 26, '#ffbe60', .6)
    c.glow(170, 46, 60, '#c06070', .12)
    for (wx, wy) in ((125, 32), (157, 35), (171, 26), (213, 42), (227, 34), (141, 44)):
        c.glow(wx, wy, 6, '#ffd070', .35)
    c.shade *= np.clip(1.18 - np.abs(np.arange(W)[None, :] - 150) / 260.0, .7, 1)
    c.shade *= np.clip(.86 + np.arange(H)[:, None] / 300.0, .86, 1.1)

    # ------------------------------------------------------------ animations -----------
    def ripples(k):
        def full(cc):
            for parts in PUDDLES:
                puddle(cc, parts)
            for i, parts in enumerate(PUDDLES):
                for j, (px, py, rx, ry) in enumerate(parts):
                    ph = (k + i * 2 + j * 3) % 6
                    if ph >= 5:
                        continue
                    r_ = 1 + ph * .9
                    ox = px + ((i * 17 + j * 11) % max(1, int(rx))) - rx * .45
                    for t in range(12):
                        a_ = t / 12 * 2 * math.pi
                        x_ = int(round(ox + math.cos(a_) * r_))
                        y_ = int(round(py + math.sin(a_) * r_ * .3))
                        if ((x_ + .5 - px) / (rx - 1.2)) ** 2 + ((y_ + .5 - py) / (ry - .8)) ** 2 <= 1:
                            cc.put(x_, y_, 'water', .8 - ph * .08, .6)
        return full
    sc.anim('puddles', [ripples(k) for k in range(6)], fps=8)

    def flicker(k):
        def fn(cc):
            lx = lantern_x
            L = (.78, .7, .84, .74)[k]
            cc.rect(lx - 2, 17, lx + 3, 24, 'd_amber', L, emis=1, dith=0)
            cc.rect(lx - 1, 18, lx + 2, 22, 'd_amber', L + .15, emis=1, dith=0)
        return fn
    sc.anim('lantern', [flicker(k) for k in range(4)], fps=5)

    # ----------------------------------------------------------- interaction geometry ---
    sc.hotspot('wall', poly=[(0, 44), (104, 44), (104, 110), (0, 110)], walk=(64, 120), face='up')
    sc.hotspot('gate', rect=(gl - 2, 33, gr + 2, WALL_BASE + 1), walk=(160, 118), face='up')
    sc.hotspot('plaque', rect=(PLQ[0] - 2, PLQ[1] - 2, PLQ[2] + 2, PLQ[3] + 3), walk=(118, 118), face='up')
    sc.hotspot('building', poly=[(116, 10), (160, 4), (170, -6), (180, 4), (234, 22), (234, 49), (116, 49)],
               walk=(176, 120), face='up')
    sc.hotspot('van', poly=[(205, 92), (244, 72), (W - 1, 68), (W - 1, 126), (205, 126)], walk=(200, 131), face='right')
    # extras
    sc.hotspot('ashcan', rect=(ax - 2, ay - 21, ax + 29, ay + 1), walk=(70, 118), face='up')
    sc.hotspot('oak', poly=[(0, 4), (80, 4), (102, 52), (100, 58), (80, 52), (60, 46), (0, 46)], walk=(80, 120),
               face='up')

    holes = [[(205, 113), (W, 113), (W, 128), (205, 128)],
             [(ax - 2, 113), (ax + 30, 113), (ax + 30, 116), (ax - 2, 116)],
             [(slx - 5, 113), (slx + 6, 113), (slx + 6, 124), (slx - 5, 124)]]
    sc.walkable([(0, 114), (W, 114), (W, 143), (0, 143)], holes=holes)
    sc.point('start', 30, 132, face='right')
    sc.point('wall_spot', 70, 118, face='up')
    sc.scale(114, .84, 140, 1.0)
    sc.meta['floor'] = 'stone'
    sc.rain(0, 0, W, H, density=1.0, kind='outdoor')
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
