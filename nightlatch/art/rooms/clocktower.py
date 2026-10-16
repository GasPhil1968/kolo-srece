"""Chapter 8 finale - the City Hall clock tower, night, rain.

A narrow wet ledge runs behind the great illuminated dial: from back here the opal glass glows
amber, the numerals read backwards and the hands are black shadows.  At the corner of the
tower the balustrade gives onto nothing at all - Brackwater spread out far below in the rain,
its streets drawn in lamps, the harbour black, the gala's searchlights sweeping the clouds.
A gargoyle spits rainwater into the dark.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
import props_d as D

W, H = 320, 144
DIAL = (100.5, 50.5, 60)            # centre x, y, outer radius
TOWER_R = 194                       # right edge of the tower wall
WALK_Y = 112                        # back edge of the walkway
DOOR = (6, 64, 30, 114)
SKY_OWNER = 999
TIME = (9, 24)                      # what the clock says (front view)


def roman_strokes(num):
    """Strokes for a roman numeral in glyph units (u across, v up), centred on u=0, v from 0 to 1."""
    glyphs = []
    for ch in num:
        if ch == 'I':
            glyphs.append((1.0, [((0, 0), (0, 1))]))
        elif ch == 'V':
            glyphs.append((3.0, [((-1.5, 1), (0, 0)), ((1.5, 1), (0, 0))]))
        else:
            glyphs.append((3.0, [((-1.5, 1), (1.5, 0)), ((1.5, 1), (-1.5, 0))]))
    gap = 1.2
    total = sum(w for w, _ in glyphs) + gap * (len(glyphs) - 1)
    u = -total / 2
    out = []
    for w, strokes in glyphs:
        cu = u + w / 2
        for (a, b) in strokes:
            out.append(((a[0] + cu, a[1]), (b[0] + cu, b[1])))
        out.append(((cu - w / 2 - .4, 1), (cu + w / 2 + .4, 1)))       # serifs
        out.append(((cu - w / 2 - .4, 0), (cu + w / 2 + .4, 0)))
        u += w + gap
    return out


def build():
    sc = Scene('clocktower', W, H, seed=99)
    c = sc.c
    rng = np.random.default_rng(21)
    dcx, dcy, R = DIAL

    # ------------------------------------------------------------------ sky -----------
    c.cur_owner = SKY_OWNER
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    Nc = noise2(W * 2, H * 3, 20, 77, 3)
    nv = Nc[np.clip((yy * 2.6).astype(int), 0, H * 3 - 1), np.clip((xx * .7 + yy * 1.2).astype(int), 0, W * 2 - 1)]
    t = np.clip(yy / 70.0, 0, 1)
    L = .14 + t ** 1.8 * .38 + (nv - .5) * .22
    city_glow = np.clip(1 - np.abs(yy - 64) / 34, 0, 1) * np.clip((xx - 150) / 120, 0, 1)
    c._apply(np.ones((H, W), bool), 'night', L + city_glow * .14, emis=1, dith=.6, region=(0, 0, W, H))
    # low cloud belly lit from beneath by the city (bruised pink)
    glow_m = (yy > 40) & (yy < 66) & (nv > .5) & (xx > 160)
    c._apply(glow_m, 'd_dusk', .38 + (nv - .5) * .6, emis=1, dith=.6, region=(0, 0, W, H))
    c.cur_owner = 0

    # --------------------------------------------------------------- the city ---------
    HZ = 62                                          # horizon of the bay, far below and away
    # the bay: black water with a few ship lights, the far shore, the lighthouse
    c.rect(TOWER_R - 10, HZ - 2, W, HZ + 6, 'water', vgrad(HZ - 2, HZ + 6, .3, .2), emis=1, dith=.4)
    for x in range(TOWER_R - 10, W):
        hh = int(2 + 1.5 * math.sin(x * .07) + math.sin(x * .23))
        c.vline(x, HZ - 2 - hh, HZ - 2, 'night', .2, emis=1)                       # far headland
    for (lx, ly) in ((228, HZ + 1), (252, HZ + 3), (271, HZ + 2), (300, HZ + 4)):
        c.put(lx, ly, 'lamp', .9, 1)
        c.put(lx, ly + 1, 'lamp', .4, 1)
    c.put(312, HZ - 6, 'white', 1.0, 1)                                               # lighthouse
    c.vline(312, HZ - 5, HZ - 2, 'night', .35, emis=1)
    # the city: blocks of dark roofs with lit windows, street lamps in converging lines
    cr = np.random.default_rng(8)
    for band, (y0, y1, bh, wl) in enumerate(((HZ + 6, HZ + 14, 3, .7), (HZ + 12, HZ + 26, 5, .75), (HZ + 22, HZ + 44, 8, .8),
                                             (HZ + 38, 120, 12, .85))):
        x = TOWER_R - 14 - band * 6
        while x < W:
            bw = int(cr.integers(4 + band * 2, 9 + band * 4))
            top = int(cr.integers(y0, y0 + max(2, (y1 - y0) // 2)))
            c.rect(x, top, x + bw, y1 + 6, 'night', .22 + band * .02 + cr.random() * .04, emis=1, dith=.2)
            c.hline(x, x + bw, top, 'night', .38, 1)
            # windows
            for wy in range(top + 2, y1 + 4, 2 + band // 2):
                for wx in range(x + 1, x + bw - 1, 2 + band // 2):
                    r_ = cr.random()
                    if r_ < .2:
                        c.put(wx, wy, 'lamp', wl - cr.random() * .2, 1)
                    elif r_ < .23:
                        c.put(wx, wy, 'neonblue', .7, 1)
            x += bw + int(cr.integers(1, 3 + band))
    # streets: chains of sodium lamps converging towards the harbour
    for (sx0, sy0, sx1, sy1) in ((200, 120, 300, HZ + 8), (232, 120, 286, HZ + 10), (TOWER_R, HZ + 30, W, HZ + 24),
                                 (TOWER_R, HZ + 44, W, HZ + 36), (280, 120, 250, HZ + 9)):
        n = 22
        for k in range(n):
            u = k / (n - 1)
            x = sx0 + (sx1 - sx0) * u
            y = sy0 + (sy1 - sy0) * u
            if k % 2 == 0:
                c.put(int(x), int(y), 'lamp', .95 - u * .3, 1)
    # landmarks: a church spire, the gasholder, harbour cranes against the water
    c.poly([(214, HZ + 18), (218, HZ - 2), (222, HZ + 18)], 'night', .3, emis=1, dith=0)
    c.vline(218, HZ - 6, HZ - 1, 'night', .35, emis=1)
    c.put(218, HZ + 4, 'lamp', .8, 1)
    c.ellipse(262, HZ + 12, 7, 5, 'night', .26, emis=1, dith=0)
    for k in range(256, 269, 3):
        c.vline(k, HZ + 8, HZ + 17, 'night', .34, emis=1)
    for (cx2, top) in ((290, HZ - 10), (302, HZ - 8)):
        c.vline(cx2, top, HZ + 2, 'night', .3, emis=1)
        c.line(cx2, top, cx2 - 9, top + 4, 'night', .3, emis=1)
        c.line(cx2, top, cx2 + 4, top + 2, 'night', .3, emis=1)
        c.put(cx2, top - 1, 'neonred', .8, 1)
    # neon: a red sign, a blue one (the Blue Lantern, somewhere down by the water)
    c.rect(246, HZ + 30, 251, HZ + 32, 'neonred', .8, emis=1, dith=0)
    c.rect(268, HZ + 16, 271, HZ + 17, 'neonblue', .85, emis=1, dith=0)
    c.rect(222, HZ + 40, 226, HZ + 42, 'neonred', .7, emis=1, dith=0)
    # rain haze over the city
    hz_y, hz_x = np.mgrid[HZ - 8:HZ + 12, TOWER_R - 10:W].astype(np.float32)
    c.lum[HZ - 8:HZ + 12, TOWER_R - 10:W] += np.clip(1 - np.abs(hz_y - HZ - 1) / 9, 0, 1) * .12      # rain haze
    for (gx, gy, gr_, col) in ((250, HZ + 30, 40, '#ffb060'), (290, HZ + 14, 30, '#ffc070')):
        c.glow(gx, gy, gr_, col, .18)

    # ------------------------------------------------------- the tower wall + dial -----
    Ns = noise2(W, H, 3, 4, 2)

    def stone(xx, yy):
        row = np.floor(yy / 9)
        off = (row % 2) * 9
        fx = (xx + off) % 18
        fy = yy % 9
        L = .5 + ((np.floor((xx + off) / 18) * 7 + row * 3) % 5) * .02 + (Ns[np.clip(yy.astype(int), 0, H - 1),
                                                                              np.clip(xx.astype(int), 0, W - 1)] - .5) * .14
        L = np.where((fy < 1) | (fx < 1), .26, L)
        L = np.where((fy >= 1) & (fy < 2) & (fx >= 1), L + .08, L)
        return L
    c.rect(0, 0, TOWER_R, WALK_Y, 'd_stone', stone, dith=.3)
    # the tower's corner buttress and a carved cornice band
    c.rect(TOWER_R - 12, 0, TOWER_R, WALK_Y, 'd_stone', lambda xx, yy: stone(xx, yy) + .06, dith=.3)
    c.vline(TOWER_R - 12, 0, WALK_Y, 'd_stone', .3)
    c.vline(TOWER_R - 1, 0, WALK_Y, 'd_stone', .7)
    c.vline(TOWER_R, 0, WALK_Y, 'black', .2)
    # warm light bleeding onto the stone around the dial (dithered ramp mix)
    def warm_density(xx, yy):
        d = np.sqrt((xx - dcx) ** 2 + (yy - dcy) ** 2)
        return np.clip(1 - (d - R) / 38, 0, 1) ** 1.3 * .85
    m_all = np.ones((WALK_Y, TOWER_R), bool)
    yyw, xxw = np.mgrid[0:WALK_Y, 0:TOWER_R].astype(np.float32)
    D.dfill(c, (0, 0, TOWER_R, WALK_Y), m_all, 'trench', stone(xxw, yyw) * .9, warm_density(xxw, yyw))
    # dial surround: a carved stone ring
    c.ellipse(dcx, dcy, R + 5, R + 5, 'trench', .42, dith=.3)
    c.ellipse(dcx, dcy, R + 3, R + 3, 'trench', .62, dith=.2)
    c.ellipse(dcx, dcy, R + 1.5, R + 1.5, 'black', .2, dith=0)
    for k in range(24):                                                   # voussoir joints
        a = k / 24 * 2 * math.pi
        c.line(int(dcx + math.cos(a) * (R + 1.5)), int(dcy + math.sin(a) * (R + 1.5)),
               int(dcx + math.cos(a) * (R + 5)), int(dcy + math.sin(a) * (R + 5)), 'trench', .3)

    # the backlit opal glass
    Ng = noise2(W, H, 6, 31, 2)

    def glass(xx, yy):
        d = np.sqrt((xx - dcx) ** 2 + (yy - dcy) ** 2) / R
        a = np.arctan2(yy - dcy, xx - dcx)
        pane = (np.floor((a + math.pi) / (2 * math.pi) * 12) * 7 + np.floor(d * 3) * 3) % 5
        L = .92 - d ** 1.6 * .32 + pane * .015 + (Ng[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)] - .5) * .08
        return L
    c.ellipse(dcx, dcy, R, R, 'd_amber', glass, emis=1, dith=.45)
    # hands, seen from behind: dark shadows through the glass (mirrored)
    hh, mm = TIME
    ah = -((hh % 12) + mm / 60) / 12 * 2 * math.pi              # mirrored angles
    am = -(mm / 60) * 2 * math.pi

    def hand(ang, L1, wbase, wtip, tail):
        ux, uy = math.sin(ang), -math.cos(ang)
        nx, ny = -uy, ux
        pts = [(dcx - ux * tail + nx * wbase * .6, dcy - uy * tail + ny * wbase * .6),
               (dcx + ux * L1 * .7 + nx * wbase, dcy + uy * L1 * .7 + ny * wbase),
               (dcx + ux * L1, dcy + uy * L1),
               (dcx + ux * L1 * .7 - nx * wbase, dcy + uy * L1 * .7 - ny * wbase),
               (dcx - ux * tail - nx * wbase * .6, dcy - uy * tail - ny * wbase * .6)]
        c.poly(pts, 'd_amber', .07, emis=1, dith=0)
        c.line(dcx + ux * L1 * .7 + nx * wbase * 1.6, dcy + uy * L1 * .7 + ny * wbase * 1.6,
               dcx + ux * L1 * .7 - nx * wbase * 1.6, dcy + uy * L1 * .7 - ny * wbase * 1.6, 'd_amber', .07, 1)
    hand(am, R * .8, 1.8, .5, 10)
    hand(ah, R * .52, 3.2, 1, 7)
    # iron glazing bars: rings + radial spokes
    for rr in (R - 1, R * .76, R * .42):
        for k in range(int(2 * math.pi * rr * 1.2)):
            a = k / (2 * math.pi * rr * 1.2) * 2 * math.pi
            c.put(int(dcx + math.cos(a) * rr), int(dcy + math.sin(a) * rr), 'black', .25)
    for k in range(12):
        a = (k + .5) / 12 * 2 * math.pi
        c.line(int(dcx + math.cos(a) * 8), int(dcy + math.sin(a) * 8), int(dcx + math.cos(a) * R * .76),
               int(dcy + math.sin(a) * R * .76), 'black', .25)
    # minute track + mirrored roman numerals in the chapter ring
    for k in range(60):
        a = k / 60 * 2 * math.pi
        r0 = R - (5 if k % 5 == 0 else 3.5)
        c.line(int(round(dcx - math.sin(a) * r0)), int(round(dcy - math.cos(a) * r0)),
               int(round(dcx - math.sin(a) * (R - 2))), int(round(dcy - math.cos(a) * (R - 2))), 'black', .22)
    nums = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
    gh, gs = 8.0, 1.9                                     # glyph height, unit size (px)
    Rn = R * .76 + 2
    for i, num in enumerate(nums):
        th = i / 12 * 2 * math.pi
        rx_, ry_ = math.sin(th), -math.cos(th)            # outward (front view)
        tx_, ty_ = math.cos(th), math.sin(th)             # tangent, clockwise
        for (a, b) in roman_strokes(num):
            pts = []
            for (u, v) in (a, b):
                X = dcx + tx_ * u * gs + rx_ * (Rn + v * gh)
                Y = dcy + ty_ * u * gs + ry_ * (Rn + v * gh)
                pts.append((2 * dcx - X, Y))              # seen from behind: mirrored
            c.line(pts[0][0], pts[0][1], pts[1][0], pts[1][1], 'black', .2)
            c.line(pts[0][0] + .6, pts[0][1] + .4, pts[1][0] + .6, pts[1][1] + .4, 'black', .25)
    # the motion works on our side of the glass: an iron gearbox at the centre
    c.rect(int(dcx) - 7, int(dcy) - 5, int(dcx) + 8, int(dcy) + 6, 'black', .25, dith=0)
    c.hline(int(dcx) - 7, int(dcx) + 8, int(dcy) - 5, 'steel', .55)
    for (gx, gy, gr_) in ((dcx - 3, dcy, 3.2), (dcx + 4, dcy + 2, 2.2)):
        c.ellipse(gx, gy, gr_, gr_, 'brass', .45, dith=0)
        for k in range(10):
            a = k / 10 * 2 * math.pi
            c.put(int(gx + math.cos(a) * (gr_ + .8)), int(gy + math.sin(a) * (gr_ + .8)), 'brass', .6)
        c.put(int(gx), int(gy), 'black', .2)
    # rain streaming down the glass, catching the light
    for k in range(60):
        x = int(dcx - R + rng.random() * 2 * R)
        y = int(dcy - R + rng.random() * 2 * R)
        if (x - dcx) ** 2 + (y - dcy) ** 2 < (R - 3) ** 2:
            for j in range(int(rng.integers(2, 6))):
                c.put(x, y + j, 'd_amber', .98 if j == 0 else .84, 1)

    # ------------------------------------------------------------ the stairs door -----
    x0, y0, x1, y1 = DOOR
    c.rect(x0 - 3, y0 - 6, x1 + 3, y1, 'd_stone', .42, dith=0)
    c.ellipse((x0 + x1) / 2, y0, (x1 - x0) / 2 + 3, 9, 'd_stone', .42, dith=0)
    c.ellipse((x0 + x1) / 2, y0, (x1 - x0) / 2, 7, 'black', .1, dith=0)
    c.rect(x0, y0, x1, y1, 'black', .1, dith=0)
    # warm stairwell light through the open door: steps going down
    c.rect(x0 + 2, y0 + 4, x1, y1, 'lamp', vgrad(y0, y1, .38, .6), emis=1, dith=.4)
    for k in range(5):
        sy = y1 - 2 - k * 7
        c.hline(x0 + 2 + k, x1, sy, 'lamp', .78, emis=1)
        c.rect(x0 + 2 + k, sy + 1, x1, sy + 3, 'lamp', .45, emis=1, dith=0)
    # the door leaf swung open against the wall (seen edge-on, left)
    c.poly([(x0 - 1, y0 - 4), (x0 + 5, y0 - 2), (x0 + 5, y1 + 1), (x0 - 1, y1)], 'wood', .35, dith=0)
    c.vline(x0 + 5, y0 - 2, y1 + 1, 'wood', .55)
    c.put(x0 + 3, (y0 + y1) // 2, 'brass', .8)
    c.glow((x0 + x1) / 2, y1 - 10, 26, '#ffb060', .35)

    # --------------------------------------------------------- the walkway (ledge) ----
    c.rect(0, WALK_Y, W, H, 'd_stone', .38, dith=.3)
    rows = [(WALK_Y, 4), (WALK_Y + 5, 6), (WALK_Y + 12, 8), (WALK_Y + 21, 11)]
    for (ry_, rh) in rows:
        w_ = rh * 4
        x = -int(rng.integers(0, w_))
        while x < W:
            ww = w_ + int(rng.integers(-3, 4))
            L = .42 + rng.random() * .06
            c.rect(x + 1, ry_ + 1, x + ww, min(H, ry_ + rh + 1), 'd_stone', L, dith=.3)
            c.hline(x + 1, x + ww, ry_ + 1, 'd_stone', L + .14)
            x += ww + 1
    # the dial's glow reflected on the wet slabs, broken into streaks
    for k in range(70):
        x = int(dcx - R * .9 + rng.random() * R * 1.8)
        y = int(WALK_Y + 2 + rng.random() * (H - WALK_Y - 2))
        L_ = int(rng.integers(2, 7))
        c.hline(x, x + L_, y, 'd_amber', .55 + rng.random() * .3, emis=.85)
    # warm light on the near slabs (dithered mix), cold on the right
    yy2, xx2 = np.mgrid[WALK_Y:H, 0:W].astype(np.float32)
    dens = np.clip(1 - np.abs(xx2 - dcx) / 110, 0, 1) * np.clip(1 - (yy2 - WALK_Y) / 50, .3, 1) * .55
    D.dfill(c, (0, WALK_Y, W, H), np.ones((H - WALK_Y, W), bool), 'trench', .4, dens)
    # puddles with the glow in them
    for (px, py, rx, ry) in ((70, 130, 18, 3), (128, 122, 12, 2.2), (232, 134, 16, 3)):
        c.ellipse(px, py, rx, ry, 'water', .25, emis=.5, dith=0)
        c.ellipse(px, py, rx - 1.5, ry - .8, 'd_amber' if px < 180 else 'night', .62 if px < 180 else .4, emis=.9, dith=.5)
    # the front lip of the ledge and the drop beneath it
    c.rect(0, H - 4, W, H, 'night', .14, emis=1, dith=0)
    for k in range(0, W, 7):
        c.put(k + (k * 3) % 5, H - 2, 'lamp', .7 if k % 3 else .4, 1)
    c.rect(0, H - 6, W, H - 4, 'd_stone', .55, dith=0)
    c.hline(0, W, H - 6, 'd_stone', .75)
    # lead flashing + gutter along the back edge
    c.hline(0, W, WALK_Y, 'black', .2)
    c.hline(0, TOWER_R, WALK_Y - 1, 'd_stone', .62)

    # ------------------------------------------------ balustrade over the drop ---------
    BAL_Y0, BAL_Y1 = 90, WALK_Y
    bx0, bx1 = TOWER_R, 282
    c.rect(bx0, BAL_Y0, bx1, BAL_Y0 + 4, 'd_stone', .52, dith=0)                  # coping rail
    c.hline(bx0, bx1, BAL_Y0, 'd_stone', .78)
    c.hline(bx0, bx1, BAL_Y0 + 4, 'black', .25)
    c.rect(bx0, BAL_Y1 - 4, bx1, BAL_Y1, 'd_stone', .45, dith=0)                  # plinth
    c.hline(bx0, bx1, BAL_Y1 - 4, 'd_stone', .62)
    for k in range(bx0 + 3, bx1 - 2, 7):                                          # vase balusters
        for y in range(BAL_Y0 + 4, BAL_Y1 - 4):
            u = (y - BAL_Y0 - 4) / (BAL_Y1 - BAL_Y0 - 8)
            wv = 1.2 + 1.4 * math.sin(math.pi * u) ** 2 * (1 if u > .35 else .5)
            c.hline(int(k - wv), int(k + wv) + 1, y, 'd_stone', .42 + (.12 if u < .5 else 0))
            c.put(int(k - wv), y, 'd_stone', .62)
    c.rect(bx1, BAL_Y0 - 6, bx1 + 12, BAL_Y1, 'd_stone', hgrad(bx1, bx1 + 12, .55, .35), dith=.2)   # corner pier
    c.hline(bx1 - 1, bx1 + 13, BAL_Y0 - 6, 'd_stone', .78)

    # -------------------------------------------------------------- the gargoyle ------
    # a crouching grotesque on the corner pier, leaning out over the drop, spout in its jaws
    gx, gy = bx1 + 4, BAL_Y0 - 6
    body = [(gx - 8, gy), (gx - 9, gy - 8), (gx - 6, gy - 14), (gx, gy - 17), (gx + 6, gy - 17), (gx + 9, gy - 14),
            (gx + 12, gy - 10), (gx + 12, gy - 4), (gx + 9, gy)]
    c.poly(body, 'd_stone', hgrad(gx - 9, gx + 12, .34, .5), dith=.2)
    # head: heavy brow, snout pushed forward and down, open jaws (the spout)
    head = [(gx + 5, gy - 16), (gx + 8, gy - 24), (gx + 13, gy - 25), (gx + 17, gy - 22), (gx + 20, gy - 19),
            (gx + 19, gy - 16), (gx + 15, gy - 15), (gx + 17, gy - 13), (gx + 13, gy - 11), (gx + 8, gy - 12)]
    c.poly(head, 'd_stone', hgrad(gx + 5, gx + 20, .38, .58), dith=.2)
    c.line(gx + 9, gy - 23, gx + 6, gy - 30, 'd_stone', .5)                        # horns
    c.line(gx + 10, gy - 23, gx + 8, gy - 30, 'd_stone', .38)
    c.line(gx + 13, gy - 25, gx + 15, gy - 31, 'd_stone', .52)
    c.put(gx + 16, gy - 32, 'd_stone', .5)
    c.hline(gx + 11, gx + 17, gy - 21, 'd_stone', .22)                             # brow shadow
    c.put(gx + 15, gy - 20, 'neonred', .55, .6)                                     # glinting eye
    c.line(gx + 15, gy - 15, gx + 19, gy - 16, 'black', .1)                         # gaping mouth
    c.put(gx + 18, gy - 17, 'd_stone', .7)                                          # fang
    c.put(gx + 16, gy - 14, 'd_stone', .65)
    # folded bat wing behind, ribs catching the dial's light
    wing = [(gx - 6, gy - 13), (gx - 14, gy - 28), (gx - 11, gy - 31), (gx - 7, gy - 26), (gx - 4, gy - 30),
            (gx - 1, gy - 22), (gx + 2, gy - 17)]
    c.poly(wing, 'd_stone', .3, dith=0)
    c.line(gx - 6, gy - 13, gx - 14, gy - 28, 'trench', .45)
    c.line(gx - 3, gy - 15, gx - 7, gy - 26, 'd_stone', .45)
    c.line(gx, gy - 17, gx - 4, gy - 30, 'd_stone', .42)
    # forelegs gripping the edge
    for k in (gx + 4, gx + 8):
        c.vline(k, gy - 7, gy, 'd_stone', .45)
        c.put(k + 1, gy, 'd_stone', .62)
        c.put(k - 1, gy, 'd_stone', .55)
    c.line(gx - 9, gy - 8, gx - 4, gy - 16, 'trench', .42)                         # warm rim from the dial
    c.line(gx - 6, gy - 14, gx, gy - 17, 'trench', .48)
    SPOUT = (gx + 19, gy - 15)

    # --------------------------------------------------------- lighting -----------------
    c.ambient = .42
    c.add_light(dcx, dcy, 175, .7, falloff=1.25)                  # the dial
    c.add_light(dcx, 128, 120, .35, ystretch=2.2)                 # its glow on the ledge
    c.add_light(18, 100, 40, .3)                                  # stairwell light
    c.add_light(290, 70, 90, .18)                                 # city glow on the corner
    c.glow(dcx, dcy, 95, '#ffb050', .3)
    c.glow(dcx, dcy, 40, '#fff0c0', .2)
    c.shade *= np.clip(.86 + np.arange(H)[:, None] / 500.0, .86, 1.2)

    # ------------------------------------------------------------- animations ---------
    def spout(k):
        def fn(cc):
            sx_, sy_ = SPOUT
            for t in range(34):
                x = sx_ + 2 + t * .18 + t * t * .004
                y = sy_ + t
                if 0 <= y < H:
                    wob = ((t + k * 2) % 4 == 0)
                    cc.put(int(x + (1 if wob else 0)), int(y), 'fog', .85 if (t + k) % 3 else .6, .7)
                    if t % 5 == (k % 5):
                        cc.put(int(x) + 1, int(y), 'white', .95, .8)
        return fn
    sc.anim('spout', [spout(k) for k in range(5)], fps=10, depth=200)

    def searchlights(k):
        def fn(cc):
            sky = cc.owner == SKY_OWNER
            for (ox, base, amp, wdt) in ((236, -66, 14, 2.2), (300, -110, 10, 1.8)):
                ang = math.radians(base + amp * math.sin(2 * math.pi * k / 12 + ox))
                dx, dy = math.cos(ang), math.sin(ang)
                ex, ey = ox + dx * 240, 150 + dy * 240
                nx, ny = -dy, dx
                pts = [(ox - nx * .5, 150 - ny * .5), (ox + nx * .5, 150 + ny * .5), (ex + nx * wdt * 6, ey + ny * wdt * 6),
                       (ex - nx * wdt * 6, ey - ny * wdt * 6)]
                m, r = cc.poly_mask(pts)
                if m is None:
                    continue
                yy_, xx_ = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32)
                dist = np.sqrt((xx_ - ox) ** 2 + (yy_ - 150) ** 2)
                # soft edges: distance from the beam axis
                ax_d = np.abs((xx_ - ox) * nx + (yy_ - 150) * ny) / np.maximum(1, dist / 240 * wdt * 6)
                gain = np.clip(1 - ax_d, 0, 1) ** .7 * np.clip(.3 - dist / 240 * .16, .08, .3)
                mm = m & sky[r[1]:r[3], r[0]:r[2]]
                sub = cc.lum[r[1]:r[3], r[0]:r[2]]
                sub[mm] += gain[mm]
                cc.owner[r[1]:r[3], r[0]:r[2]][mm] = 30000
        return fn
    sc.anim('searchlights', [searchlights(k) for k in range(12)], fps=3)

    def lighthouse(k):
        def fn(cc):
            cc.put(312, HZ - 6, 'white' if k < 2 else 'night', 1.0 if k < 2 else .3, 1)
            if k == 0:
                cc.put(311, HZ - 6, 'white', .8, 1)
                cc.put(313, HZ - 6, 'white', .8, 1)
        return fn
    sc.anim('lighthouse', [lighthouse(k) for k in range(6)], fps=4)

    # --------------------------------------------------- interaction geometry ---------
    sc.hotspot('exit_door', rect=(x0 - 3, y0 - 9, x1 + 3, y1), walk=(22, 122), face='left')
    sc.hotspot('clock', poly=[(int(dcx + math.cos(a) * (R + 2)), int(min(WALK_Y - 1, dcy + math.sin(a) * (R + 2))))
                              for a in np.linspace(0, 2 * math.pi, 24, endpoint=False)], walk=(100, 122), face='up')
    sc.hotspot('city', poly=[(TOWER_R + 2, 30), (W, 30), (W, BAL_Y0 - 22), (bx1 - 2, BAL_Y0 - 1), (TOWER_R + 2, BAL_Y0 - 1)],
               walk=(240, 118), face='up')
    sc.hotspot('ledge', poly=[(TOWER_R, BAL_Y0), (bx1, BAL_Y0), (bx1, WALK_Y + 1), (TOWER_R, WALK_Y + 1)], walk=(236, 118),
               face='up')
    sc.hotspot('gargoyle', rect=(gx - 15, gy - 33, gx + 21, gy + 2), walk=(278, 120), face='right')

    sc.walkable([(4, 116), (288, 116), (300, 124), (304, 137), (2, 137)])
    sc.point('start', 24, 124, face='right')
    sc.point('rook_spot', 196, 126, face='right')
    sc.point('delaney_spot', 266, 120, face='left')
    sc.scale(116, .88, 140, 1.0)
    sc.meta['floor'] = 'stone'
    sc.rain(0, 0, W, H, density=1.2, kind='outdoor')
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
