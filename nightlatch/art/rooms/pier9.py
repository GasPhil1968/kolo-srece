"""Pier 9 (Ch1 night, Ch2/Ch7 day, epilogue dawn).  480 wide (scrolls).
Fish Exchange + cold store on the left, Gus's hut and brazier, the dock crane, and at the right end
the burnt, half-sunk wreck of the SS Meridian.  Variants are full repaints (sky, water, fog, light)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2, hx
from scene import Scene
from persp import Persp
import props_b as B

W, H = 480, 144
EDGE = 94            # back edge of the deck / foot of the warehouse walls
HORIZON = 60
SEED = 61

VAR = {
    'night': dict(sky='night', sky_top=.05, sky_bot=.42, haze='fog', haze_l=.2, water='water', water_l=.22,
                  fog='fog', fog_l=.34, fog_amt=.55, ambient=.36, lamps=True, windows=.75, sun=None, moon=True,
                  shore='night', shore_l=.16, city_lights=True, glint='b_sodium', calm=False,
                  hull='b_hull', hull_l=.42, char='b_char', char_l=0.0, deck='b_weathered', deck_l=.36),
    'day': dict(sky='b_overcast', sky_top=.55, sky_bot=.82, haze='b_dayfog', haze_l=.62, water='b_daywater', water_l=.5,
                fog='b_dayfog', fog_l=.7, fog_amt=.7, ambient=.64, lamps=False, windows=.12, sun=None, moon=False,
                shore='b_overcast', shore_l=.42, city_lights=False, glint='b_overcast', calm=False,
                hull='b_dayfog', hull_l=.3, char='b_overcast', char_l=.0, deck='b_weathered', deck_l=.46),
    'dawn': dict(sky='b_dawn', sky_top=.18, sky_bot=.96, haze='b_dawn', haze_l=.7, water='b_dawnwater', water_l=.5,
                 fog='b_dawn', fog_l=.72, fog_amt=.35, ambient=.5, lamps=False, windows=.35, sun=(346, HORIZON - 4),
                 moon=False, shore='b_dawn', shore_l=.34, city_lights=False, glint='b_dawn', calm=True,
                 hull='b_hull', hull_l=.3, char='b_char', char_l=0.0, deck='b_weathered', deck_l=.4),
}


def P_():
    return Persp(0, 480, 0, EDGE, horizon=-40, depth=360, cx=240)


def deck_y(Z):
    p = P_()
    return p.P(0, 0, Z)[1]


def paint(sc, st, var='night'):
    v = VAR[var]
    c = sc.c
    p = P_()
    g = {}
    rng = np.random.default_rng(5)

    # ====================================================================== sky ====
    Ns = noise2(W, H, 30, 7, 3)

    def skyfn(xx, yy):
        t = np.clip(yy / HORIZON, 0, 1)
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = v['sky_top'] + (v['sky_bot'] - v['sky_top']) * t ** 1.4
        L = L + (Ns[yi, xi] - .5) * (.08 if var != 'dawn' else .05)
        if v['sun']:
            sx, sy = v['sun']
            d = np.sqrt((xx - sx) ** 2 + ((yy - sy) * 2.2) ** 2)
            L = L + np.clip(1 - d / 160, 0, 1) ** 2 * .25
        if var == 'night':
            d = np.sqrt((xx - 430) ** 2 + ((yy - HORIZON) * 2.6) ** 2)
            L = L + np.clip(1 - d / 130, 0, 1) ** 1.5 * .26
        return L
    c.rect(0, 0, W, HORIZON + 2, v['sky'], skyfn, dith=.6)
    if var == 'dawn':
        # streaky clouds lit gold from below
        for (cy, x0, x1, L) in ((14, 200, 420, .55), (22, 150, 360, .62), (30, 260, 480, .7), (9, 300, 470, .5),
                                (38, 330, 480, .84)):
            for x in range(x0, x1):
                wv = math.sin(x * .05 + cy) * 1.5
                th = 1 + int(2 * math.sin((x - x0) / (x1 - x0) * math.pi))
                c.rect(x, int(cy + wv), x + 1, int(cy + wv) + th, 'b_dawn', L + (x - x0) / (x1 - x0) * .1, dith=.3)
        sx, sy = v['sun']
        c.ellipse(sx, sy, 7, 4, 'b_dawn', 1.0, emis=1)
        c.hline(sx - 30, sx + 30, sy + 1, 'b_dawn', .98, emis=1)
    elif var == 'night':
        # low clouds lit from below by the city, a hazy moon
        for k in range(5):
            cy = 10 + k * 7
            for x in range(0, W):
                n = Ns[cy, x]
                if n > .55:
                    c.put(x, cy + int(math.sin(x * .03 + k) * 2), 'night', .3 + (n - .55) * .6)
        c.ellipse(150, 16, 5, 5, 'fog', .62, emis=.6)
        c.ellipse(151, 15, 3, 3, 'fog', .78, emis=.7)
    else:
        for k in range(6):
            cy = 6 + k * 8
            for x in range(0, W):
                n = Ns[cy, x]
                if n > .5:
                    c.put(x, cy + int(math.sin(x * .02 + k) * 3), 'b_overcast', .66 + (n - .5) * .4)

    # ================================================================ far shore ====
    # rolling hills of the city across the harbour, Gull Hill with Halcyon House, cranes
    hill = []
    for x in range(0, W + 1, 4):
        y = HORIZON - 4 - 6 * math.sin(x * .013 + 1) - 3 * math.sin(x * .041)
        if 300 < x < 380:
            y -= 12 * math.sin((x - 300) / 80 * math.pi)        # Gull Hill
        hill.append((x, y))
    c.poly(hill + [(W, HORIZON + 1), (0, HORIZON + 1)], v['shore'], v['shore_l'], dith=.3)
    # city blocks along the far quay
    for k in range(40):
        x = int(rng.integers(0, W))
        w = int(rng.integers(4, 12))
        h = int(rng.integers(3, 12))
        c.rect(x, HORIZON - h, x + w, HORIZON + 1, v['shore'], v['shore_l'] + .04 + rng.random() * .05, dith=.2)
        if v['city_lights'] and rng.random() < .7:
            for j in range(int(rng.integers(1, 3))):
                c.put(x + int(rng.integers(0, w)), HORIZON - int(rng.integers(1, max(2, h))), 'lamp',
                      .5 + rng.random() * .3, emis=1)
    # Halcyon House on Gull Hill: pale block with a tower; lit windows at night
    hx0, hy0 = 330, HORIZON - 25
    c.rect(hx0, hy0, hx0 + 16, hy0 + 8, v['shore'], v['shore_l'] + .14, dith=.1)
    c.rect(hx0 + 6, hy0 - 4, hx0 + 10, hy0, v['shore'], v['shore_l'] + .16, dith=.1)
    if v['city_lights']:
        for wx in (hx0 + 2, hx0 + 5, hx0 + 12):
            c.put(wx, hy0 + 3, 'lamp', .7, emis=1)
    # distant harbour cranes
    for (x, h) in ((214, 16), (232, 12), (268, 18)):
        c.vline(x, HORIZON - h, HORIZON, v['shore'], v['shore_l'] + .06)
        c.line(x, HORIZON - h, x + 9, HORIZON - h - 4, v['shore'], v['shore_l'] + .06)
        if v['city_lights']:
            c.put(x + 9, HORIZON - h - 4, 'neonred', .6, emis=1)

    # ==================================================================== water ====
    Nw = noise2(W, H, 6, 21, 2)

    def waterfn(xx, yy):
        t = np.clip((yy - HORIZON) / (EDGE - HORIZON), 0, 1)
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        amp = .06 if v['calm'] else .1
        rip = np.sin(xx * (.12 + t * .1) + yy * (1.2 + t) + Nw[yi, xi] * 5) * amp
        L = v['water_l'] - t * .12 + rip
        return L
    c.rect(0, HORIZON, W, EDGE + 1, v['water'], waterfn, dith=.45)
    # bright line where the far water meets the shore
    c.hline(0, W, HORIZON, v['water'], v['water_l'] + .2)
    if var == 'dawn':
        # the sun's road on the water: broken horizontal glints, wider towards the pier
        sx, _ = v['sun']
        rr = np.random.default_rng(77)
        for y in range(HORIZON + 1, EDGE, 1):
            t = (y - HORIZON) / (EDGE - HORIZON)
            half = 2 + t * 22
            n = int(2 + t * 5)
            for _ in range(n):
                x = sx + rr.normal(0, half * .45)
                L_ = int(1 + rr.random() * (2 + t * 6))
                lum = .95 - abs(x - sx) / (half * 2.2)
                if lum > .55:
                    c.hline(int(x), int(x) + L_, y, 'b_dawnwater', lum, emis=.6)

    # ===================================================== the wreck of the SS Meridian ====
    wl = 84                                  # waterline
    g['wreck'] = (354, 8, 480, wl + 6)
    Nh = noise2(W, H, 3, 33, 2)
    # hull: bow sunk at the left, stern riding higher at the right; listing towards us
    deck_l, deck_r = (362, wl - 8), (480, wl - 40)
    hull = [(358, wl + 1), deck_l, (400, wl - 18), deck_r, (480, wl + 1)]

    HR, CR = v['hull'], v['char']

    def hullfn(xx, yy):
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = v['hull_l'] + (Nh[yi, xi] - .5) * .22
        L = np.where((xx % 12) < 1, L - .12, L)                 # plate seams
        L = np.where(((yy + xx * .27) % 9) < 1, L - .06, L)    # strakes following the sheer
        return L
    c.poly(hull, HR, hullfn)
    # burnt black from the waterline up, scorched blisters, rust bleeding down
    for x in range(358, 480):
        top = np.interp(x, [358, 362, 400, 480], [wl + 1, wl - 8, wl - 18, wl - 40])
        burn = int(4 + 6 * abs(math.sin(x * .07)) + 4 * Nh[60, x])
        c.vline(x, int(top) + 1, int(top) + 1 + burn, CR, .22 + Nh[40, x] * .15)
    for k in range(16):
        x = 366 + k * 7
        top = np.interp(x, [358, 362, 400, 480], [wl + 1, wl - 8, wl - 18, wl - 40])
        c.vline(x, int(top) + 6, min(wl, int(top) + 14 + (k % 3) * 4), 'rust' if var != 'day' else HR,
                .44 + (k % 2) * .08 if var != 'day' else v['hull_l'] - .1)
    # deck edge + a gap of sky through a burnt-out section of bulwark
    c.line(deck_l[0], deck_l[1], 400, wl - 18, 'b_hull', .62)
    c.line(400, wl - 18, deck_r[0], deck_r[1], HR, v['hull_l'] + .22)
    # the name, half burnt away
    B.text(c, 432, wl - 21, 'MER DIAN', 'paper' if var != 'day' else HR, .64 if var != 'day' else v['hull_l'] + .25,
           wear=.1, seed=12, narrow_i=True)
    c.rect(446, wl - 22, 450, wl - 15, CR, .25)                     # scorch where the I burnt off
    # portholes, some blown out
    for (x, y) in ((408, wl - 13), (420, wl - 16), (446, wl - 22), (458, wl - 25)):
        c.ellipse(x, y, 1.6, 1.6, 'black', .05)
        c.put(x - 1, y - 1, 'rust' if var != 'day' else HR, .6 if var != 'day' else v['hull_l'])
    # gutted bridge house amidships
    c.poly([(418, wl - 21), (419, wl - 38), (446, wl - 44), (448, wl - 28)], CR, .3)
    for k in range(4):
        c.rect(421 + k * 6, wl - 36 - k, 425 + k * 6, wl - 32 - k, 'black', .04)   # empty windows
        c.put(421 + k * 6, wl - 37 - k, CR, .55)
    c.poly([(446, wl - 44), (460, wl - 48), (462, wl - 33), (448, wl - 28)], CR, .2)   # collapsed wheelhouse
    c.line(419, wl - 38, 446, wl - 44, CR, .55)
    # funnel, tilted, scorched
    c.poly([(432, wl - 42), (441, wl - 44), (437, wl - 62), (428, wl - 60)], CR, .34)
    c.poly([(428, wl - 60), (437, wl - 62), (437, wl - 64), (428, wl - 62)], 'rust' if var != 'day' else HR, .5 if var != 'day' else .28)
    c.line(432, wl - 42, 428, wl - 60, CR, .5)
    # the bent foremast with sagging rigging
    mast = [(392, wl - 16), (391, wl - 44), (394, wl - 56), (402, wl - 64)]
    for a_, b_ in zip(mast, mast[1:]):
        c.line(a_[0], a_[1], b_[0], b_[1], CR, .42)
        c.line(a_[0] + 1, a_[1], b_[0] + 1, b_[1], CR, .24)
    c.line(386, wl - 40, 398, wl - 44, CR, .4)                                    # yard arm
    B.rope_sag(c, 402, wl - 64, 432, wl - 60, 5, CR, .34)
    B.rope_sag(c, 391, wl - 44, 366, wl - 9, 3, CR, .32)
    B.rope_sag(c, 386, wl - 40, 378, wl - 12, 2, CR, .28)
    B.rope_sag(c, 398, wl - 44, 418, wl - 21, 4, CR, .28)
    # cargo boom fallen across the foredeck
    c.line(372, wl - 9, 404, wl - 26, CR, .46)
    # water line: a pale scum line along the hull, swirl around the bow
    c.hline(358, 480, wl + 1, v['water'], v['water_l'] + .26)
    c.hline(352, 366, wl + 2, v['water'], v['water_l'] + .2)
    for (x, y) in ((402, wl - 64), (434, wl - 63), (454, wl - 47)):
        B.gull_perched(c, x, y, 'white', .64 if var != 'night' else .5)
    if var == 'night':
        rim = 'fog'
        c.line(deck_l[0], deck_l[1] - 1, 400, wl - 19, rim, .42)
        c.line(400, wl - 19, deck_r[0], deck_r[1] - 1, rim, .42)
        c.line(419, wl - 39, 446, wl - 45, rim, .4)
        c.line(428, wl - 61, 437, wl - 63, rim, .45)
        c.line(391, wl - 45, 393, wl - 57, rim, .36)
        for k in range(0, 18, 3):
            c.put(int(441 - k * .1), int(wl - 44 - k * .45), rim, .3)
    g['wl'] = wl

    # reflection of the wreck: dark broken bands
    for y in range(wl + 3, EDGE - 1):
        for x in range(372, 480):
            if (x * 5 + y * 3) % 7 < 3 and y < wl + 3 + (x - 360) * .12:
                c.put(x, y, 'b_char', .2)

    # ====================================================== fog banks ====
    fa = v['fog_amt']
    if var == 'night':
        # mist lying on the water, lit faintly by the city; thicker around the wreck
        B.fog_strokes(c, 190, 360, HORIZON - 2, HORIZON + 9, 36, 'fog', .12, seed=3, rx=(14, 46), ry=(.6, 1.8), dl=.03)
        B.fog_strokes(c, 340, W, wl - 1, wl + 5, 16, 'fog', .1, seed=8, rx=(10, 30), ry=(.6, 1.2), dl=.03)
        B.fog_strokes(c, 200, W, HORIZON + 14, EDGE - 4, 12, 'fog', .07, seed=13, rx=(10, 34), ry=(.5, 1.0), dl=.02)
    elif var == 'day':
        # heavy morning fog swallowing the far shore and the stern of the wreck
        B.fog_strokes(c, 190, 360, HORIZON - 16, HORIZON + 8, 70, 'b_dayfog', .72, seed=3, rx=(16, 60), ry=(1.2, 3.5))
        B.fog_strokes(c, 340, W, wl - 2, wl + 6, 22, 'b_dayfog', .62, seed=8, rx=(10, 34), ry=(.8, 1.8))
        B.fog_strokes(c, 196, W, HORIZON + 10, EDGE - 2, 22, 'b_dayfog', .6, seed=13, rx=(12, 40), ry=(.8, 1.6))
        B.fog_strokes(c, 0, W, 0, 30, 30, 'b_overcast', .8, seed=19, rx=(30, 80), ry=(1.5, 4))
    else:
        # a thin pink mist on the calm water
        B.fog_strokes(c, 190, 300, HORIZON - 1, HORIZON + 8, 22, 'b_dawn', .74, seed=3, rx=(16, 50), ry=(.6, 1.4))
        B.fog_strokes(c, 352, W, wl, wl + 5, 10, 'b_dawn', .6, seed=8, rx=(10, 26), ry=(.6, 1.2))

    # ==================================================== dock crane over the water ====
    cx0 = 300
    g['crane'] = (cx0 - 14, 0, 420, EDGE)
    tw = 12
    # tower legs (lattice) standing on the pier edge
    for (a, b) in ((cx0 - tw, cx0 - tw + 2), (cx0 + tw - 2, cx0 + tw)):
        c.rect(a, 18, b, EDGE - 2, 'rust', .42)
    for y in range(20, EDGE - 4, 8):
        c.line(cx0 - tw + 1, y, cx0 + tw - 2, y + 8, 'rust', .36)
        c.line(cx0 + tw - 2, y, cx0 - tw + 1, y + 8, 'rust', .3)
        c.hline(cx0 - tw, cx0 + tw, y, 'rust', .44)
    # cab
    c.rect(cx0 - 10, 8, cx0 + 8, 20, 'rust', .46)
    c.rect(cx0 - 8, 10, cx0 - 2, 15, 'glass', .3 if not v['lamps'] else .45, emis=.2 if v['lamps'] else 0)
    c.hline(cx0 - 11, cx0 + 9, 8, 'rust', .62)
    # jib reaching out over the water (lattice)
    jx, jy = 420, 2
    c.line(cx0 + 6, 16, jx, jy, 'rust', .46)
    c.line(cx0 + 6, 20, jx, jy + 3, 'rust', .36)
    for k in range(1, 12):
        t = k / 12
        x = cx0 + 6 + (jx - cx0 - 6) * t
        y1 = 16 + (jy - 16) * t
        y2 = 20 + (jy + 3 - 20) * t
        c.line(x, y1, x + 5, y2 - 1, 'rust', .32)
    # back-stay and counterweight
    c.line(cx0 - 2, 8, cx0 - 20, 18, 'rust', .38)
    c.rect(cx0 - 24, 16, cx0 - 14, 24, 'concrete', .32)
    # hoist cable and hook hanging over the water
    c.vline(jx - 2, jy + 3, 52, 'steel', .5)
    c.rect(jx - 4, 52, jx + 1, 55, 'steel', .5)
    c.line(jx - 2, 55, jx - 2, 58, 'steel', .6)
    c.line(jx - 2, 58, jx, 60, 'steel', .6)
    if v['lamps']:
        c.put(jx, jy, 'neonred', .8, emis=1)
    B.gull_perched(c, cx0 + 40, 14, 'white', .55)
    # rail track for the crane on the deck edge
    c.hline(cx0 - 30, cx0 + 30, EDGE - 1, 'steel', .5)

    # ========================================================= left warehouse (corrugated) ====
    lw0, lw1, lroof = 0, 74, 18
    def corr(xx, yy):
        return .4 + np.sin(xx * 1.6) * .08 + (Nh[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)] - .5) * .1
    c.poly([(lw0, lroof + 10), (lw1 - 30, lroof - 6), (lw1, lroof + 8), (lw1, EDGE), (lw0, EDGE)], 'steel', corr)
    c.line(lw0, lroof + 10, lw1 - 30, lroof - 6, 'steel', .66)
    c.line(lw1 - 30, lroof - 6, lw1, lroof + 8, 'steel', .5)
    # rust bleeding from the roof line
    for x in range(2, lw1 - 2, 5):
        c.vline(x, lroof + 10 - int((x / (lw1 - 30)) * 16) + 2, lroof + 22 + (x % 7), 'rust', .38)
    # big painted PIER 9
    B.text(c, 8, 34, 'PIER', 'white', .58, scale=2, wear=.08, seed=4)
    B.text(c, 48, 30, '9', 'white', .6, scale=4, wear=.06, seed=5)
    # sliding door, half open (dark interior)
    c.rect(10, EDGE - 40, 46, EDGE, 'steel', .32)
    c.rect(10, EDGE - 40, 26, EDGE, 'black', .1)
    c.hline(6, 50, EDGE - 41, 'steel', .6)
    for x in range(28, 46, 3):
        c.vline(x, EDGE - 39, EDGE, 'steel', .4)
    g['street'] = (0, 40, 10, H)

    # ===================================================== Brackwater Fish Exchange ====
    fx0, fx1 = 74, 200
    ftop = 14
    B.bricks(c, fx0, ftop, fx1, EDGE, 'brick', bw=8, bh=4, base=.42, var=.1, mortar=.2, seed=11, grime=.12, dith=.3)
    # stepped parapet against the sky
    c.rect(fx0, ftop - 4, fx1, ftop, 'brick', .5)
    c.rect(fx0 + 40, ftop - 9, fx1 - 40, ftop - 4, 'brick', .48)
    c.hline(fx0, fx1, ftop - 4, 'concrete', .62)
    c.hline(fx0 + 40, fx1 - 40, ftop - 9, 'concrete', .62)
    # sign band
    c.rect(fx0 + 4, ftop + 3, fx1 - 4, ftop + 12, 'felt', .32)
    c.hline(fx0 + 4, fx1 - 4, ftop + 3, 'felt', .5)
    B.text(c, (fx0 + fx1) // 2, ftop + 5, 'BRACKWATER FISH EXCHANGE', 'cream', .82, center=True, wear=.05, seed=6)
    # windows: upper row (one lit at night), lower loading door
    for k, wx in enumerate((fx0 + 8, fx0 + 30, fx0 + 52, fx0 + 74, fx0 + 96)):
        wy = ftop + 18
        lit = (k == 1) and v['lamps']
        c.rect(wx - 1, wy - 1, wx + 13, wy + 15, 'concrete', .5)
        if lit:
            c.rect(wx, wy, wx + 12, wy + 14, 'lamp', .6, emis=1)
        else:
            c.rect(wx, wy, wx + 12, wy + 14, 'glass', .26 if var == 'night' else .44, emis=.1)
        c.vline(wx + 6, wy, wy + 14, 'concrete', .42)
        c.hline(wx, wx + 12, wy + 7, 'concrete', .42)
        c.hline(wx - 2, wx + 14, wy + 15, 'concrete', .66)
        if k == 3:
            c.line(wx + 1, wy + 1, wx + 5, wy + 6, 'glass', .7)            # cracked pane
    # gutter + downpipe
    c.hline(fx0, fx1, ftop + 1, 'steel', .5)
    c.rect(fx1 - 6, ftop + 1, fx1 - 4, EDGE, 'steel', .4)
    c.vline(fx1 - 6, ftop + 1, EDGE, 'steel', .6)
    # loading bay door (rolling shutter) left of the cold store
    lbx0, lbx1 = fx0 + 8, fx0 + 52
    c.rect(lbx0 - 2, EDGE - 40, lbx1 + 2, EDGE, 'concrete', .4)
    for y in range(EDGE - 38, EDGE, 2):
        c.hline(lbx0, lbx1, y, 'steel', .42 + (y % 4) * .03)
    c.hline(lbx0, lbx1, EDGE - 38, 'steel', .22)
    # the COLD STORE door: heavy, insulated, big hinges and latch lever
    dx0, dx1 = 150, 178
    dy0 = EDGE - 44
    g['cold_door'] = (dx0, dy0, dx1, EDGE)
    c.rect(dx0 - 4, dy0 - 4, dx1 + 4, EDGE, 'concrete', .48)
    c.hline(dx0 - 4, dx1 + 4, dy0 - 4, 'concrete', .7)
    c.rect(dx0, dy0, dx1, EDGE, 'steel', hgrad(dx0, dx1, .56, .42))
    for x in range(dx0 + 3, dx1 - 1, 5):
        c.vline(x, dy0 + 2, EDGE - 2, 'steel', .36)
        c.vline(x + 1, dy0 + 2, EDGE - 2, 'steel', .64)
    for hy in (dy0 + 5, EDGE - 13):
        c.rect(dx0 - 3, hy, dx0 + 7, hy + 6, 'steel', .62)
        c.hline(dx0 - 3, dx0 + 7, hy, 'steel', .86)
        c.put(dx0 + 4, hy + 5, 'rust', .55)
    # latch housing + big lever
    c.rect(dx1 - 7, dy0 + 18, dx1 + 1, dy0 + 30, 'steel', .66)
    c.line(dx1 - 3, dy0 + 24, dx1 + 6, dy0 + 32, 'steel', .78)
    c.rect(dx1 + 5, dy0 + 31, dx1 + 8, dy0 + 34, 'red', .5)
    # stencil: COLD STORE over the door, keep-shut notice
    c.rect(dx0 - 7, dy0 - 14, dx1 + 7, dy0 - 6, 'cream', .66, dith=.2)
    B.text(c, (dx0 + dx1) // 2, dy0 - 13, 'COLD STORE', 'red', .38, center=True)
    c.rect(dx0 + 4, dy0 + 6, dx1 - 6, dy0 + 13, 'gold', .58, dith=.1)
    B.text(c, (dx0 + dx1) // 2 - 1, dy0 + 7, 'SHUT', 'ink', .12, center=True)
    # frost breathing out around the seal
    c.vline(dx1, dy0, EDGE, 'b_frost', .62)
    c.hline(dx0, dx1, EDGE - 1, 'b_frost', .55)
    # gooseneck lamp over the door
    c.line(dx0 + 14, dy0 - 16, dx0 + 14, dy0 - 22, 'steel', .5)
    c.line(dx0 + 14, dy0 - 22, dx0 + 20, dy0 - 22, 'steel', .5)
    c.poly([(dx0 + 17, dy0 - 22), (dx0 + 24, dy0 - 22), (dx0 + 23, dy0 - 19), (dx0 + 18, dy0 - 19)], 'felt', .4)
    if v['lamps']:
        c.hline(dx0 + 18, dx0 + 23, dy0 - 19, 'lamp', .9, emis=1)
    g['door_lamp'] = (dx0 + 20, dy0 - 18)

    # ================================================================== the deck ====
    zf = p.z_at_floor_y(H + 2)
    Nd = noise2(W, H, 3, 41, 2)
    zs = []
    Z = 0.0
    k = 0
    while Z < zf:
        zs.append((Z, k))
        Z += 7
        k += 1
    for (Z0, k) in zs:
        y0 = int(round(deck_y(Z0)))
        y1 = int(round(deck_y(Z0 + 7)))
        base = v['deck_l'] + (B.H(k, 2) - .5) * .1

        def plankfn(xx, yy, base=base, k=k):
            xi = np.clip(xx.astype(int), 0, W - 1)
            yi = np.clip(yy.astype(int), 0, H - 1)
            L = base + np.sin(xx * .7 + k * 3) * .02 + (Nd[yi, xi] - .5) * .1
            j = (xx + B.H(k, 7) * 60) % 60
            L = np.where(j < 1, .16, L)
            return L
        c.rect(0, y0, W, y1, v['deck'], plankfn, dith=.35)
        c.hline(0, W, y0, v['deck'], .12)
        # nail heads at the joists
        for x in range(int(B.H(k, 9) * 20), W, 22):
            c.put(x, y0 + 1, 'steel', .45)
    # curb log along the back edge where there is open water
    c.rect(200, EDGE - 2, W, EDGE + 1, 'wood', .46)
    c.hline(200, W, EDGE - 2, 'wood', .66)
    # wet sheen: puddles on the planks
    for (x, Z, w) in ((60, 40, 26), (226, 70, 34), (350, 30, 20), (420, 60, 28)):
        y = deck_y(Z)
        c.ellipse(x, y, w / 2, 1.6, 'water', .32 if var == 'night' else .5, dith=.3)
    g['puddles'] = [(60, 40, 26), (226, 70, 34), (350, 30, 20), (420, 60, 28)]

    # =============================================== deck clutter ====
    # a two-wheeled fish barrow by the crates
    hx_, hy_ = p.P(160, 0, 26)
    c.poly([(hx_ - 10, hy_ - 9), (hx_ + 8, hy_ - 9), (hx_ + 6, hy_ - 3), (hx_ - 8, hy_ - 3)], 'oak', .42)
    c.hline(int(hx_) - 10, int(hx_) + 8, int(hy_) - 9, 'oak', .62)
    c.line(hx_ + 8, hy_ - 8, hx_ + 18, hy_ - 4, 'oak', .5)
    c.ellipse(hx_ - 3, hy_ - 3, 3, 3, 'steel', .4)
    c.ellipse(hx_ - 3, hy_ - 3, 1, 1, 'steel', .65)
    for k in range(3):
        c.put(int(hx_) - 6 + k * 4, int(hy_) - 10, 'b_fish', .6)
    # heap of fishing net with cork floats near the hut
    nx_, ny_ = p.P(196, 0, 10)
    c.ellipse(nx_, ny_ - 2, 9, 3.5, 'b_tarp', .4)
    for k in range(12):
        a = k * .9
        c.put(int(nx_ + math.cos(a) * 6), int(ny_ - 2 + math.sin(a) * 2), 'b_tarp', .6)
    for (dx, dy) in ((-6, -3), (-1, -4), (4, -3), (7, -1)):
        c.put(int(nx_) + dx, int(ny_) + dy, 'gold', .55)
    # a dropped fish and scales glinting on the planks
    fx_, fy_ = p.P(330, 0, 52)
    c.hline(int(fx_), int(fx_) + 5, int(fy_), 'b_fish', .62)
    c.put(int(fx_) + 6, int(fy_) - 1, 'b_fish', .5)
    c.put(int(fx_) + 6, int(fy_) + 1, 'b_fish', .5)
    for (X, Z) in ((300, 40), (316, 60), (180, 48), (70, 66)):
        x_, y_ = p.P(X, 0, Z)
        c.put(int(x_), int(y_), 'b_fish', .8)

    # =============================================== bollards with mooring ropes ====
    g['bollards'] = []
    for (bx, Z, big) in ((216, 3, False), (344, 4, True), (468, 3, False)):
        x, y = p.P(bx, 0, Z)
        s = p.s(Z)
        r = (5 if big else 4) * s
        B.cylinder(c, x, y - 6 * s, y, r, r * .35, 'steel', .36, top=False)
        c.ellipse(x, y - 6 * s, r * 1.35, r * .45, 'steel', .5)
        c.ellipse(x, y - 6 * s - 1, r * 1.1, r * .35, 'steel', .62)
        g['bollards'].append((int(x), int(y), int(r)))
        # rope: loop around the bollard, running back over the edge to the water
        B.rope_sag(c, x - r, y - 4 * s, x + r, y - 4 * s, 2, 'trench', .55)
        B.rope_sag(c, x + r - 1, y - 4 * s, x + 18, EDGE - 1, 4, 'trench', .5)
    # coil of rope by the big bollard (hotspot 'bollard')
    bx, by, br = g['bollards'][1]
    B.rope_coil(c, bx - 14, by + 1, 7, 2.4, 'trench', .55)

    # ======================================================= pilings with gulls ====
    g['gulls'] = []
    for (x, top, h, gull) in ((384, EDGE - 9, 10, True), (398, EDGE - 6, 7, False), (450, EDGE - 11, 12, True),
                              (230, EDGE - 7, 8, True), (262, EDGE - 5, 6, False)):
        c.rect(x - 2, top, x + 2, EDGE - 1, 'wood', hgrad(x - 2, x + 2, .52, .28))
        c.ellipse(x, top, 2, 1, 'wood', .64)
        c.vline(x - 2, top + h - 4, EDGE - 1, 'olive', .3)       # weed line
        if gull:
            B.gull_perched(c, x, top, 'white', .7 if var != 'night' else .55, facing=1 if x % 2 else -1)
            g['gulls'].append((x, top))

    # ================================================ Gus's watchman's hut + brazier ====
    hx0, hx1 = 206, 238
    htop = EDGE - 50
    g['hut'] = (hx0 - 2, htop - 8, hx1 + 3, EDGE)
    B.planks_v(c, hx0, htop, hx1, EDGE, 'wood', pw=4, base=.4, seed=17, dith=.3)
    c.poly([(hx0 - 3, htop + 1), (hx1 + 3, htop - 5), (hx1 + 3, htop - 2), (hx0 - 3, htop + 4)], 'steel', .46)   # tin roof
    c.line(hx0 - 3, htop + 1, hx1 + 3, htop - 5, 'steel', .7)
    # stovepipe
    c.rect(hx1 - 7, htop - 16, hx1 - 4, htop - 3, 'steel', .35)
    c.rect(hx1 - 8, htop - 17, hx1 - 3, htop - 15, 'steel', .5)
    g['stovepipe'] = (hx1 - 6, htop - 17)
    # window with warm light and a little curtain; a logbook on the sill
    wx0, wy0 = hx0 + 5, htop + 8
    c.rect(wx0 - 1, wy0 - 1, wx0 + 13, wy0 + 11, 'wood', .55)
    if v['lamps'] or var == 'dawn':
        c.rect(wx0, wy0, wx0 + 12, wy0 + 10, 'lamp', .58, emis=1)
    else:
        c.rect(wx0, wy0, wx0 + 12, wy0 + 10, 'lamp', .34, emis=.4)
    c.vline(wx0 + 6, wy0, wy0 + 10, 'wood', .4)
    c.hline(wx0, wx0 + 12, wy0 + 5, 'wood', .4)
    c.poly([(wx0, wy0), (wx0 + 4, wy0), (wx0 + 2, wy0 + 10), (wx0, wy0 + 10)], 'red', .45)
    c.rect(wx0, wy0 + 11, wx0 + 6, wy0 + 13, 'red', .4)
    # door + sign
    c.rect(hx1 - 13, htop + 8, hx1 - 1, EDGE, 'wood', .3)
    c.hline(hx1 - 13, hx1 - 1, htop + 8, 'wood', .5)
    c.put(hx1 - 4, htop + 28, 'brass', .8)
    c.rect(hx0 + 1, htop + 24, hx0 + 25, htop + 30, 'paper', .6, dith=.1)
    B.text(c, hx0 + 2, htop + 25, 'GATE 9', 'ink', .15)
    # a chair and a lantern outside the hut
    c.rect(hx0 - 8, EDGE - 10, hx0 - 2, EDGE - 8, 'wood', .4)
    c.vline(hx0 - 8, EDGE - 8, EDGE, 'wood', .35)
    c.vline(hx0 - 3, EDGE - 8, EDGE, 'wood', .35)
    c.vline(hx0 - 8, EDGE - 18, EDGE - 10, 'wood', .4)
    # brazier: oil drum with punched holes, glowing coals (static occluder)
    bzx, bzZ = 250, 18
    bzx_s, bzy = p.P(bzx, 0, bzZ)
    s = p.s(bzZ)
    g['brazier'] = (int(bzx_s), int(bzy), s)
    with sc.obj('brazier', baseline=int(bzy) + 1):
        r = 6 * s
        B.cylinder(c, bzx_s, bzy - 14 * s, bzy, r, r * .35, 'rust', .4, top=False)
        for (dx, dy) in ((-3, -10), (0, -9), (3, -10), (-2, -6), (2, -6), (0, -4)):
            c.put(int(bzx_s + dx * s), int(bzy + dy * s), 'b_ember', .85, emis=1)
        c.ellipse(bzx_s, bzy - 14 * s, r, r * .35, 'b_ember', .7, emis=1)
        c.ellipse(bzx_s, bzy - 14 * s - 1, r * .7, r * .25, 'b_ember', .95, emis=1)
        for k in range(5):
            c.put(int(bzx_s - 4 + k * 2), int(bzy - 15 * s - (k % 2)), 'b_ember', 1.0, emis=1)
        c.hline(int(bzx_s - r), int(bzx_s + r) + 1, int(bzy - 14 * s), 'rust', .6)
        # legs (bricks)
        c.rect(int(bzx_s - r), int(bzy) - 1, int(bzx_s + r) + 1, int(bzy) + 1, 'brick', .35)
    g['brazier_top'] = (int(bzx_s), int(bzy - 15 * s))

    # ======================================================== stacked crates ====
    crb = int(deck_y(14))
    with sc.obj('crates_stack', baseline=crb):
        B.crate_box(c, p, 92, 126, 0, 16, 2, 14, 'oak', .5, stencil='B.F.E.', stencil_ramp='ink', stencil_lum=.15,
                    seed=21, boards=3)
        B.crate_box(c, p, 96, 122, 16, 30, 3, 13, 'oak', .54, stencil='FRAGILE', stencil_ramp='red', stencil_lum=.3,
                    seed=22, boards=2)
        B.crate_box(c, p, 126, 146, 0, 12, 3, 14, 'wood', .46, seed=23, boards=2, brace=False)
        # fish boxes with ice on top
        x, y = p.P(130, 12, 8)
        c.rect(int(x), int(y) - 3, int(x) + 14, int(y), 'oak', .4)
        for k in range(5):
            c.put(int(x) + 1 + k * 3, int(y) - 4, 'b_fish', .62)
    g['crates'] = (int(p.P(92, 30, 14)[0]), int(p.P(96, 30, 3)[1]) - 4, int(p.P(146, 0, 14)[0]), crb)
    # barrels by the left warehouse
    for (bx, Z) in ((54, 8), (66, 12)):
        x, y = p.P(bx, 0, Z)
        B.barrel(c, x, y, 6 * p.s(Z), 14 * p.s(Z), 'oak', .45, hoop='rust')

    # ============================================================ lamp posts ====
    g['lamps'] = []
    for li, (lx, Z) in enumerate(((86, 30), (264, 26), (434, 30))):
        x, y = p.P(lx, 0, Z)
        s = p.s(Z)
        top = y - 58 * s
        ctx = sc.obj(f'lamp_post{li + 1}', baseline=int(y))
        ctx.__enter__()
        c.rect(int(x) - 1, int(top), int(x) + 2, int(y), 'steel', .38)
        c.vline(int(x) - 1, int(top), int(y), 'steel', .58)
        c.rect(int(x) - 3, int(y) - 4, int(x) + 4, int(y), 'steel', .32)
        # swan-neck arm and the lamp head
        c.line(x, top, x + 6 * s, top - 3 * s, 'steel', .48)
        hx_, hy_ = x + 7 * s, top - 2 * s
        c.poly([(hx_ - 4, hy_ - 2), (hx_ + 4, hy_ - 2), (hx_ + 3, hy_ + 2), (hx_ - 3, hy_ + 2)], 'steel', .42)
        if v['lamps']:
            c.hline(int(hx_ - 3), int(hx_ + 4), int(hy_ + 2), 'b_sodium', .95, emis=1)
            c.hline(int(hx_ - 2), int(hx_ + 3), int(hy_ + 3), 'b_sodium', .8, emis=1)
        else:
            c.hline(int(hx_ - 3), int(hx_ + 4), int(hy_ + 2), 'glass', .5)
        ctx.__exit__(None, None, None)
        g['lamps'].append((int(x), int(y), int(hx_), int(hy_ + 3), s))

    # ==================================================== reflections on the water ====
    if v['lamps']:
        for (x, y, hx_, hy_, s) in g['lamps']:
            if hx_ > 196:
                for k, yy in enumerate(range(HORIZON + 8, EDGE, 2)):
                    w = 1 + (k % 3)
                    c.hline(hx_ - w + (k % 2), hx_ + w, yy, 'b_sodium', .55 + (k % 2) * .15, emis=.8)
        # crane warning light
        for yy in range(HORIZON + 4, HORIZON + 20, 3):
            c.put(420, yy, 'neonred', .5, emis=.8)
        # wet deck reflections below the lamps (vertical streaks)
        for (x, y, hx_, hy_, s) in g['lamps']:
            for yy in range(int(y) + 2, min(H, int(y) + 30), 2):
                c.put(hx_ + ((yy // 2) % 2), yy, 'b_sodium', .5, emis=.5)
    # ====================================================== foreground ====
    # a mooring post + coil of rope at the front right, cut by the frame
    with sc.obj('fg_post', baseline=160):
        c.rect(452, 118, 462, H, 'wood', hgrad(452, 462, .5, .26))
        c.ellipse(457, 118, 5, 2, 'wood', .62)
        c.rect(450, 126, 464, 129, 'steel', .4)
        B.rope_sag(c, 452, 130, 430, H + 2, 5, 'trench', .5)
    # fish crates at the front left, cut by the frame
    with sc.obj('fg_crates', baseline=160):
        c.rect(0, 124, 26, H, 'oak', vgrad(124, H, .44, .3))
        c.hline(0, 26, 124, 'oak', .66)
        c.hline(0, 26, 133, 'oak', .2)
        B.text(c, 4, 127, 'BFE', 'ink', .15)
        for k in range(6):
            c.put(2 + k * 4, 123, 'b_fish', .6)

    # ============================================================== lighting ====
    c.ambient = v['ambient']
    if v['lamps']:
        for (x, y, hx_, hy_, s) in g['lamps']:
            c.add_light(hx_, hy_ + 4, 70, .55, falloff=1.3)
            c.add_light(hx_, y + 4, 60, .3, ystretch=2.6)
            c.glow(hx_, hy_, 34, '#ffb040', .55)
            c.glow(hx_, hy_, 10, '#ffe0a0', .8)
        dlx, dly = g['door_lamp']
        c.add_light(dlx, dly + 8, 44, .4)
        c.glow(dlx, dly, 14, '#ffd080', .5)
        c.glow(150, 16, 20, '#c8d4e0', .25)                 # moon halo
        c.glow(420, 2, 6, '#ff3030', .6)
        c.glow(wx0 + 6, wy0 + 5, 16, '#ffb050', .5)
    if var == 'dawn':
        sx, sy = v['sun']
        c.add_light(sx, sy, 420, .32, falloff=.9)
        c.glow(sx, sy, 90, '#ffb070', .35)
        c.glow(sx, sy, 22, '#fff0c0', .6)
        c.glow(wx0 + 6, wy0 + 5, 10, '#ffb050', .3)
    if var == 'day':
        c.add_light(240, -40, 400, .12, falloff=.6)
    bx_, by_, s = g['brazier']
    c.add_light(bx_, by_ - 12, 60 if var == 'night' else 34, .55 if var == 'night' else .3, falloff=1.3)
    c.glow(bx_, by_ - 14, 18, '#ff7020', .7 if var == 'night' else .4)
    # contact shadows
    c.shadow_poly([(hx0 - 2, EDGE), (hx1 + 2, EDGE), (hx1 + 8, EDGE + 3), (hx0 - 2, EDGE + 3)], .4)
    c.shadow_ellipse(bx_, by_, 9, 2.5, .5)
    c.shadow_poly(p.quad([(90, 0, 1), (148, 0, 1), (148, 0, 16), (90, 0, 16)]), .45)
    if var == 'night':
        B.vignette(c, 240, 70, 330, 150, lo=.62)
    else:
        B.vignette(c, 240, 70, 360, 160, lo=.78)
    return g, p


def variant(name):
    def fn(c):
        alt = Scene('pier9', W, H, seed=SEED)
        paint(alt, set(), name)
        a = alt.c
        with B.owner0(c):
            pass
        # replace the whole picture (same geometry, new sky/water/light)
        c.rid = a.rid.copy()
        c.lum = a.lum.copy()
        c.emis = a.emis.copy()
        c.dith = a.dith.copy()
        c.extra = a.extra.copy()
        c.shade = a.shade.copy()
        c.names = list(a.names)
        c.ids = dict(a.ids)
        c.lights = list(a.lights)
        c.glows = list(a.glows)
        c.ambient = a.ambient
        c.owner = a.owner.copy()
        return None
    return fn


def build():
    sc = B.SceneB('pier9', W, H, seed=SEED)
    g, p = paint(sc, set(), 'night')

    def P2(X, Z):
        x, y = p.P(X, 0, Z)
        return (int(round(x)), int(round(y)))
    sc.hotspot('exit_street', rect=(0, 40, 12, 130), walk=(10, 118), face='left')
    dx0, dy0, dx1, dy1 = g['cold_door']
    sc.hotspot('cold_store_door', rect=(dx0 - 4, dy0 - 15, dx1 + 9, EDGE), walk=(164, 104), face='up')
    sc.hotspot('hut', rect=g['hut'], walk=(222, 102), face='up')
    bx_, by_, s = g['brazier']
    sc.hotspot('brazier', rect=(bx_ - 8, by_ - 22, bx_ + 9, by_ + 2), walk=(bx_ + 14, by_ + 6), face='left')
    sc.hotspot('wreck', rect=g['wreck'], walk=(424, 104), face='up')
    sc.hotspot('water', rect=(196, HORIZON + 6, 356, EDGE - 2), walk=(330, 104), face='up')
    gx = [q[0] for q in g['gulls'] if q[0] > 370]
    sc.hotspot('gulls', rect=(376, EDGE - 18, 458, EDGE), walk=(416, 102), face='up')
    sc.hotspot('crane', rect=(286, 0, 424, EDGE - 2), walk=(300, 104), face='up')
    sc.hotspot('crates', rect=g['crates'], walk=(118, 112), face='up')
    bx, by, br = g['bollards'][1]
    sc.hotspot('bollard', rect=(bx - 22, by - 12, bx + 8, by + 4), walk=(bx - 6, by + 8), face='up')
    lx, ly, lhx, lhy, ls = g['lamps'][1]
    sc.hotspot('lamp', rect=(lx - 4, lhy - 8, lhx + 6, ly), walk=(lx + 10, ly + 6), face='left')

    zf = p.z_at_floor_y(H - 4)
    poly = [P2(0, 6), P2(204, 6), P2(204, 4), P2(476, 4), P2(476, zf), P2(0, zf)]
    holes = [
        [P2(88, 0), P2(150, 0), P2(150, 18), P2(88, 18)],                 # crates
        [(bx_ - 9, by_ - 4), (bx_ + 9, by_ - 4), (bx_ + 9, by_ + 3), (bx_ - 9, by_ + 3)],   # brazier
        [(0, 120), (30, 120), (30, H), (0, H)],                           # fg crates
        [(446, 124), (470, 124), (470, H), (446, H)],                     # fg post
    ]
    sc.walkable(poly, holes=holes)
    sc.point('start', 18, 118, 'right')
    sc.point('from_map', 18, 118, 'right')
    sc.point('from_cold_store', 164, 106, 'down')
    sc.point('gus_spot', bx_ - 14, by_ + 2, 'right')
    sc.point('wreck_view', 424, 104, 'up')
    sc.point('nora_spot', 468, 100, 'up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(EDGE, p.char_scale(EDGE, 140), 140, 1.0)
    sc.meta['floor'] = 'wood'

    # ------------------------------------------------------------ animations ----
    # brazier smoke rising (grey; reads in every variant) + sparks
    tx, ty = g['brazier_top']

    def sfr(k):
        def f(cc):
            for j in range(10):
                yy = ty - 3 - j * 3 - (k % 3)
                xx = tx + int(round(math.sin((j + k) * .7) * (1 + j * .35))) + j // 3
                L = .55 - j * .03
                cc.ellipse(xx, yy, 1 + j * .2, 1 + j * .15, 'fog', L, dith=.5)
            if k % 2 == 0:
                cc.put(tx - 1 + k % 3, ty - 4 - k, 'b_ember', 1, emis=1)
        return f
    sc.anim('smoke', [sfr(k) for k in range(6)], fps=6)
    # stovepipe smoke
    px, py = g['stovepipe']

    def pfr(k):
        def f(cc):
            for j in range(6):
                yy = py - 2 - j * 3 - (k % 3)
                xx = px + int(round(math.sin((j + k) * .8) * (j * .3))) + j
                cc.ellipse(xx, yy, .8 + j * .25, .8 + j * .2, 'fog', .5 - j * .03, dith=.5)
        return f
    sc.anim('stove', [pfr(k) for k in range(6)], fps=5)
    # gulls circling over the wreck (3 frames of wing flap, drifting)
    def gfr(k):
        def f(cc):
            for i, (x, y) in enumerate(((360, 30), (392, 22), (456, 34))):
                ph = (k + i) % 3
                dx = int(math.sin((k + i * 2) / 6 * 2 * math.pi) * 6)
                dy = int(math.cos((k + i * 2) / 6 * 2 * math.pi) * 2)
                B.gull_flying(cc, x + dx, y + dy, ph, 'white', .75, emis=.4)
        return f
    sc.anim('gulls', [gfr(k) for k in range(6)], fps=6)
    return sc


VARIANTS = {'day': variant('day'), 'dawn': variant('dawn')}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
