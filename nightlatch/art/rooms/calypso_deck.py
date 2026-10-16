"""Chapter 7 - the deck of the MV Calypso at Pier 4.  400 wide (scrolls), night fog.
Bow (left): forward hatch with the slide bolt, the cargo derrick.  Middle: the main hatch Rook cuts
his way out of, the lifeboat on its davits.  Right: the lashed barrels, the gangway (Kroll), the
deckhouse with the captain's cabin door and the wheelhouse above."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
from persp import Persp, floor_poly
import props_b as B

W, H = 400, 144
RAIL = 92            # far rail foot (deck edge)
SEED = 81


def P_():
    return Persp(0, 400, 0, RAIL, horizon=-40, depth=360)


def paint(sc, st):
    c = sc.c
    p = P_()
    zfront = p.z_at_floor_y(H + 2)
    g = {}
    rng = np.random.default_rng(3)

    # ================================================================ sky + pier ====
    Ns = noise2(W, H, 30, 7, 3)

    def skyfn(xx, yy):
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        return .06 + np.clip(yy / 74, 0, 1) ** 1.6 * .48 + (Ns[yi, xi] - .5) * .06
    c.rect(0, 0, W, RAIL, 'night', skyfn, dith=.6)
    # distant harbour: far shore lights, a lighthouse blink on the right
    for k in range(60):
        x = int(rng.integers(0, W))
        y = int(rng.integers(52, 60))
        c.put(x, y, 'lamp', .4 + rng.random() * .3, emis=.9)
    c.hline(0, W, 60, 'night', .36)
    # Pier 4 beyond the rail: warehouse silhouettes, cranes, lamps in the fog
    for (x0, x1, top) in ((0, 70, 30), (64, 150, 40), (236, 320, 34), (318, 400, 44)):
        c.rect(x0, top, x1, RAIL, 'night', vgrad(top, RAIL, .1, .06), dith=.2)
        c.hline(x0, x1, top, 'night', .2)
        for wx in range(x0 + 6, x1 - 6, 13):
            if rng.random() < .35:
                c.rect(wx, top + 8, wx + 4, top + 12, 'lamp', .5, emis=.9)
    B.text(c, 92, 48, 'PIER 4', 'night', .3, scale=2)
    for (x, h) in ((176, 50), (204, 44)):
        c.vline(x, RAIL - h, RAIL, 'night', .24)
        c.line(x, RAIL - h, x + 18, RAIL - h - 6, 'night', .24)
        c.put(x + 18, RAIL - h - 6, 'neonred', .7, emis=1)
    # the pier's edge just below the rail line, with bollards and a waiting truck
    c.rect(0, RAIL - 22, W, RAIL - 18, 'wood', .3)
    c.hline(0, W, RAIL - 22, 'wood', .42)
    for x in (24, 120, 210, 350):
        c.rect(x, RAIL - 26, x + 4, RAIL - 22, 'steel', .4)
    c.rect(236, RAIL - 34, 266, RAIL - 22, 'night', .32)               # a van on the pier (Halcyon laundry?)
    c.rect(258, RAIL - 40, 266, RAIL - 33, 'night', .34)
    c.ellipse(242, RAIL - 22, 3, 3, 'black', .2)
    c.ellipse(260, RAIL - 22, 3, 3, 'black', .2)
    c.put(265, RAIL - 30, 'lamp', .6, emis=.8)
    # pier lamps (sodium) beyond the rail
    plamps = []
    for x in (40, 160, 300):
        c.vline(x, 44, RAIL, 'night', .3)
        c.hline(x - 3, x + 4, 44, 'night', .32)
        c.hline(x - 2, x + 3, 45, 'b_sodium', .95, emis=1)
        plamps.append((x, 45))
    g['plamps'] = plamps
    # fog: wisps over the pier and in front of the warehouses
    B.fog_strokes(c, 0, W, 18, 40, 14, 'fog', .08, seed=3, rx=(20, 60), ry=(.8, 1.6), dl=.02)
    B.fog_strokes(c, 0, W, 64, 82, 12, 'fog', .12, seed=4, rx=(12, 36), ry=(.6, 1.2), dl=.02)

    # ============================================================= the deck ====
    fl = floor_poly(p, -100, 500, 0, zfront)
    Nd = noise2(W, H, 4, 13, 2)

    def deckfn(xx, yy):
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        X = p.cx + (xx - p.cx) / s
        Z = p.D * (1 - 1 / s)
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = .44 + (Nd[yi, xi] - .5) * .14
        L = np.where(((X + 6) % 48) < 1 / s * 1.3, L - .16, L)      # plate butts
        L = np.where((Z % 26) < 1 / s * 1.4, L - .12, L)            # plate seams
        return L
    c.poly(fl, 'b_hull', deckfn)
    # rust patches, wet sheen, a painted walkway line
    for _ in range(14):
        X = rng.uniform(0, 400)
        Z = rng.uniform(6, 80)
        x, y = p.P(X, 0, Z)
        c.ellipse(x, y, rng.uniform(3, 9), rng.uniform(1, 2.5), 'rust', .32, dith=.5)
    for (X, Z, w) in ((60, 70, 30), (226, 60, 36), (300, 84, 26)):
        x, y = p.P(X, 0, Z)
        c.ellipse(x, y, w / 2, 1.8, 'water', .32, dith=.3)
    # bulwark + rail along the far side
    c.rect(0, RAIL - 9, W, RAIL, 'b_paint', vgrad(RAIL - 9, RAIL, .42, .3))
    c.hline(0, W, RAIL - 9, 'b_paint', .7)
    c.hline(0, W, RAIL - 1, 'b_hull', .2)
    for x in range(0, W, 16):
        c.vline(x, RAIL - 9, RAIL, 'b_paint', .22)
    for x in range(4, W, 9):
        c.put(x, RAIL - 5, 'rust', .5)
    # pipe rail on stanchions above the bulwark
    c.hline(0, W, RAIL - 18, 'b_paint', .6)
    c.hline(0, W, RAIL - 17, 'b_paint', .34)
    for x in range(6, W, 22):
        c.vline(x, RAIL - 18, RAIL - 9, 'b_paint', .46)
    g['rail'] = (0, RAIL - 19, W, RAIL)

    # ============================================================ gangway gap ====
    gx0, gx1 = 300, 324
    g['gangway'] = (gx0, gx1)
    c.rect(gx0, RAIL - 19, gx1, RAIL, 'night', vgrad(RAIL - 19, RAIL, .2, .3))
    # redraw the pier behind the gap
    c.rect(gx0, RAIL - 6, gx1, RAIL, 'wood', .28)
    # gangway plank going down over the side, with rope hand-lines
    c.poly([(gx0 + 3, RAIL), (gx1 - 3, RAIL), (gx1 + 8, RAIL - 18), (gx0 + 12, RAIL - 18)], 'wood', .5)
    for k in range(6):
        y = RAIL - 2 - k * 3
        x0_ = gx0 + 3 + 9 * (k + 1) / 6
        c.hline(int(x0_), int(x0_ + 17), int(y), 'wood', .72)
    c.line(gx0 + 3, RAIL, gx0 + 12, RAIL - 18, 'wood', .3)
    c.line(gx1 - 3, RAIL, gx1 + 8, RAIL - 18, 'wood', .64)
    c.line(gx0 + 2, RAIL - 12, gx0 + 12, RAIL - 20, 'trench', .5)
    c.line(gx1 - 2, RAIL - 12, gx1 + 6, RAIL - 20, 'trench', .5)
    for x in (gx0 + 1, gx1 - 2):
        c.vline(x, RAIL - 22, RAIL, 'b_paint', .62)
        c.put(x, RAIL - 23, 'b_paint', .82)
    # a life ring on the rail by the gangway
    c.ellipse(gx0 - 8, RAIL - 12, 5, 5, 'red', .5)
    c.ellipse(gx0 - 8, RAIL - 12, 2.5, 2.5, 'night', .2)
    for a in (0, 90, 180, 270):
        r_ = math.radians(a + 45)
        c.put(int(gx0 - 8 + math.cos(r_) * 4), int(RAIL - 12 + math.sin(r_) * 4), 'white', .8)

    # =================================================== deckhouse + wheelhouse ====
    dh0, dh1 = 334, 400
    dtop = 34
    g['deckhouse'] = (dh0, dtop, dh1)
    # front wall (white paint gone grey, rust weeping from the rivets)
    c.rect(dh0, dtop, dh1, RAIL + 4, 'b_paint', hgrad(dh0, dh1, .55, .44))
    for y in range(dtop + 4, RAIL, 9):
        B.rivets_h(c, dh0 + 2, dh1, y, 6, 'b_paint', .72)
    for _ in range(12):
        x = int(rng.integers(dh0 + 2, dh1))
        y = int(rng.integers(dtop + 4, RAIL - 6))
        c.vline(x, y, y + int(rng.integers(3, 9)), 'rust', .45)
    c.vline(dh0, dtop, RAIL + 4, 'b_paint', .75)
    # the cabin door (exit_cabin): steel door with a high sill and dogs
    cdx0, cdx1 = 344, 366
    cdy0 = RAIL + 4 - 45
    g['cabin'] = (cdx0, cdy0, cdx1, RAIL + 4)
    c.rect(cdx0 - 2, cdy0 - 2, cdx1 + 2, RAIL + 4, 'b_paint', .3)
    c.rect(cdx0, cdy0, cdx1, RAIL - 1, 'b_paint', hgrad(cdx0, cdx1, .5, .38))
    c.rect(cdx0 + 2, cdy0 + 2, cdx1 - 2, cdy0 + 4, 'b_paint', .62)
    c.ellipse((cdx0 + cdx1) / 2, cdy0 + 11, 4, 4, 'brass', .5)                 # porthole in the door
    c.ellipse((cdx0 + cdx1) / 2, cdy0 + 11, 3, 3, 'lamp', .5, emis=.8)
    for y in (cdy0 + 8, RAIL - 10):
        c.rect(cdx1 - 4, y, cdx1 - 1, y + 3, 'steel', .6)                       # dogs
    c.rect(cdx0 - 2, RAIL - 2, cdx1 + 2, RAIL + 4, 'b_paint', .46)             # sill
    c.hline(cdx0 - 2, cdx1 + 2, RAIL - 2, 'b_paint', .7)
    # stencil + caged bulkhead lamp over the door
    B.text(c, cdx0, cdy0 - 9, 'CAPT.', 'ink', .22)
    c.rect(cdx1 + 5, cdy0 - 4, cdx1 + 10, cdy0 + 2, 'steel', .4)
    c.ellipse(cdx1 + 7.5, cdy0 - 1, 2, 2, 'lamp', .9, emis=1)
    g['door_lamp'] = (cdx1 + 7, cdy0 - 1)
    # portholes along the deckhouse
    for x in (374, 390):
        c.ellipse(x, cdy0 + 12, 4, 4, 'brass', .55)
        c.ellipse(x, cdy0 + 12, 3, 3, 'glass', .3, emis=.3)
        c.put(x - 1, cdy0 + 11, 'glass', .7, emis=.4)
    c.ellipse(390, cdy0 + 12, 3, 3, 'lamp', .45, emis=.9)                      # the captain's light is on
    # wheelhouse on top: windows with a dim glow, a searchlight, the funnel behind
    c.rect(dh0 + 8, dtop - 22, dh1, dtop, 'b_paint', hgrad(dh0 + 8, dh1, .6, .48))
    c.hline(dh0 + 6, dh1, dtop - 22, 'b_paint', .8)
    for k, x in enumerate(range(dh0 + 12, dh1 - 2, 9)):
        c.rect(x, dtop - 18, x + 7, dtop - 10, 'glass', .26, emis=.3)
        if k == 2:
            c.rect(x, dtop - 18, x + 7, dtop - 10, 'lamp', .3, emis=.6)
    c.rect(dh0 - 4, dtop - 2, dh1, dtop + 1, 'b_paint', .7)                    # bridge wing deck
    c.vline(dh0 - 2, dtop + 1, dtop + 12, 'b_paint', .5)
    # ladder up to the bridge
    for x in (dh0 + 2, dh0 + 6):
        c.vline(x, dtop + 1, RAIL + 2, 'steel', .5)
    for y in range(dtop + 4, RAIL, 5):
        c.hline(dh0 + 2, dh0 + 7, y, 'steel', .6)
    # funnel (behind the wheelhouse, against the sky) with a band
    c.poly([(372, dtop - 22), (396, dtop - 22), (394, 0), (376, 0)], 'b_hull', .3)
    c.rect(374, 2, 396, 7, 'red', .4)
    c.hline(374, 396, 2, 'red', .6)
    g['funnel'] = (386, 0)
    # masthead light and aerial
    c.vline(352, 0, dtop - 22, 'steel', .4)
    c.put(352, 4, 'white', 1, emis=1)

    # ============================================================ cargo derrick ====
    mx_, my_ = p.P(84, 0, 34)
    mx_, my_ = int(mx_), int(my_)
    base_d = my_
    g['derrick'] = (mx_ - 14, 0, mx_ + 66, my_)
    with sc.obj('derrick', baseline=base_d):
        c.rect(mx_ - 3, 0, mx_ + 3, my_, 'b_hull', hgrad(mx_ - 3, mx_ + 3, .52, .24))
        c.vline(mx_ - 3, 0, my_, 'b_hull', .66)
        c.rect(mx_ - 6, my_ - 4, mx_ + 6, my_, 'b_hull', .34)
        # crosstree
        c.rect(mx_ - 12, 10, mx_ + 13, 13, 'b_hull', .4)
        # the boom angled up over the main hatch
        c.line(mx_ + 2, my_ - 26, mx_ + 64, 22, 'b_hull', .5)
        c.line(mx_ + 2, my_ - 25, mx_ + 64, 23, 'b_hull', .3)
        c.rect(mx_ - 2, my_ - 30, mx_ + 5, my_ - 24, 'b_hull', .42)           # gooseneck
        # topping lift + cargo fall with hook
        c.line(mx_, 11, mx_ + 64, 22, 'steel', .4)
        c.vline(mx_ + 64, 23, 56, 'steel', .45)
        c.rect(mx_ + 62, 56, mx_ + 67, 59, 'steel', .5)
        c.line(mx_ + 64, 59, mx_ + 66, 62, 'steel', .6)
        # cargo lamp on the crosstree, aimed at the main hatch
        c.rect(mx_ + 4, 14, mx_ + 10, 18, 'steel', .4)
        c.hline(mx_ + 5, mx_ + 10, 18, 'lamp', .85, emis=1)
        g['cargo_lamp'] = (mx_ + 7, 18)
        # winch at the foot
        c.rect(mx_ + 6, my_ - 10, mx_ + 16, my_, 'steel', .4)
        c.ellipse(mx_ + 11, my_ - 6, 4, 4, 'steel', .5)
        c.ellipse(mx_ + 11, my_ - 6, 2, 2, 'rust', .5)
    # stays running up out of frame
    c.line(mx_, 0, mx_ - 40, RAIL - 18, 'steel', .32)
    c.line(mx_, 4, mx_ + 120, RAIL - 18, 'steel', .28)

    # ============================================================ forward hatch ====
    fh = (16, 64, 20, 38)                    # X0, X1, Z0, Z1
    fb = int(p.P(0, 0, fh[3])[1])
    with sc.obj('fwd_hatch_obj', baseline=fb):
        p.box(c, fh[0], fh[1], 0, 7, fh[2], fh[3], 'b_paint', front=.42, top=.5, side=.3)
        top = p.quad([(fh[0] + 2, 7.2, fh[2] + 2), (fh[1] - 2, 7.2, fh[2] + 2), (fh[1] - 2, 7.2, fh[3] - 2),
                      (fh[0] + 2, 7.2, fh[3] - 2)])
        c.poly(top, 'b_hull', .54)
        # steel lid with a hinge line and handles
        a, b = p.P(fh[0] + 2, 7.3, fh[2] + 6), p.P(fh[1] - 2, 7.3, fh[2] + 6)
        c.line(a[0], a[1], b[0], b[1], 'b_hull', .3)
        for X in (fh[0] + 10, fh[1] - 10):
            q = p.P(X, 7.4, fh[3] - 5)
            c.hline(int(q[0]) - 2, int(q[0]) + 3, int(q[1]), 'steel', .66)
        B.text(c, int(p.P(fh[0] + 13, 3, fh[3])[0]), int(p.P(0, 5.5, fh[3])[1]), 'NO 1', 'paper', .6,
               wear=.05, seed=5)
    fx0, fy0, fx1, fy1 = p.front_rect(fh[0], fh[1], 0, 7, fh[3])
    g['fwd'] = (int(fx0), int(p.P(fh[0], 7, fh[2])[1]) - 2, int(fx1), int(fy1))
    # the slide bolt on the front of the coaming (right half): keeper plate + staple, bolt shot or drawn
    bx_, by_ = int(fx1) - 16, int((fy0 + fy1) / 2)
    g['bolt'] = (bx_, by_)
    c.rect(bx_ - 2, by_ - 3, bx_ + 12, by_ + 3, 'steel', .36)                  # backing plate
    c.hline(bx_ - 2, bx_ + 12, by_ - 3, 'steel', .6)
    c.rect(bx_ - 6, by_ - 2, bx_ - 3, by_ + 2, 'steel', .5)                    # staple on the lid edge
    if 'fwd_bolt_open' in st:
        c.rect(bx_ + 3, by_ - 1, bx_ + 15, by_ + 1, 'chrome', .82)            # bolt drawn back
        c.hline(bx_ + 3, bx_ + 15, by_ - 1, 'chrome', .98)
        c.vline(bx_ + 13, by_ - 4, by_ - 1, 'chrome', .85)                     # knob turned up
        c.put(bx_ + 13, by_ - 5, 'chrome', 1.0)
        c.rect(bx_ - 5, by_ - 1, bx_ - 3, by_ + 1, 'black', .05)               # empty staple
    else:
        c.rect(bx_ - 7, by_ - 1, bx_ + 9, by_ + 1, 'chrome', .82)             # bolt shot home through the staple
        c.hline(bx_ - 7, bx_ + 9, by_ - 1, 'chrome', .98)
        c.vline(bx_ + 7, by_ + 1, by_ + 4, 'chrome', .85)                      # knob down, locked
        c.put(bx_ + 7, by_ + 4, 'chrome', 1.0)
    # anchor windlass and chain at the very bow
    wx_, wy_ = p.P(10, 0, 70)
    c.rect(int(wx_) - 6, int(wy_) - 10, int(wx_) + 10, int(wy_), 'b_hull', .4)
    c.ellipse(wx_ + 2, wy_ - 7, 5, 4, 'steel', .5)
    for k in range(6):
        c.ellipse(wx_ + 14 + k * 4, wy_ - 1, 2.5, 1.4, 'steel', .5 - (k % 2) * .1)

    # =============================================================== main hatch ====
    mh = (100, 196, 16, 52)
    mb = int(p.P(0, 0, mh[3])[1])
    g['main_base'] = mb
    with sc.obj('main_hatch_obj', baseline=mb):
        p.box(c, mh[0], mh[1], 0, 9, mh[2], mh[3], 'b_hull', front=.46, top=.5, side=.3)
        # hatch boards under a tarpaulin, battened down with wedges
        top = p.quad([(mh[0] + 2, 9.2, mh[2] + 2), (mh[1] - 2, 9.2, mh[2] + 2), (mh[1] - 2, 9.2, mh[3] - 2),
                      (mh[0] + 2, 9.2, mh[3] - 2)])
        c.poly(top, 'b_tarp', lambda xx, yy: .44 + np.sin(xx * .3) * .04)
        for X in range(mh[0] + 12, mh[1] - 4, 12):
            a, b = p.P(X, 9.3, mh[2] + 2), p.P(X, 9.3, mh[3] - 2)
            c.line(a[0], a[1], b[0], b[1], 'b_tarp', .32)
        fx0, fy0, fx1, fy1 = p.front_rect(mh[0], mh[1], 0, 9, mh[3])
        for x in range(int(fx0) + 6, int(fx1) - 4, 12):
            c.rect(x, int(fy0) + 2, x + 3, int(fy0) + 5, 'wood', .55)               # wedges
        c.hline(int(fx0), int(fx1), int(fy0) + 1, 'steel', .55)                     # batten bar
        # the slit Rook cut in the tarpaulin, the board pushed up
        sx0, sy0 = p.P(148, 9.4, 30)
        sx1, sy1 = p.P(160, 9.4, 40)
        c.poly([(sx0, sy0), (sx1 + 6, sy0), (sx1 + 4, sy1), (sx0 - 2, sy1)], 'black', .05)
        c.line(sx0 - 2, sy1, sx0 + 2, sy0 - 6, 'b_tarp', .6)                       # flap peeled back
        c.line(sx0 + 2, sy0 - 6, sx1 + 6, sy0 - 3, 'b_tarp', .55)
        c.poly([(sx0 + 1, sy0 - 1), (sx1 + 2, sy0 - 3), (sx1 + 4, sy0), (sx0 + 2, sy0 + 1)], 'wood', .55)
        g['slit'] = (int(sx0), int(sy0))
    g['main'] = (int(p.P(mh[0], 9, mh[3])[0]), int(p.P(mh[0], 9, mh[2])[1]) - 2, int(p.P(mh[1], 0, mh[3])[0]), mb)

    # ================================================================ lifeboat ====
    lb_base = int(p.P(0, 0, 14)[1])
    g['lifeboat_base'] = lb_base
    with sc.obj('lifeboat', baseline=lb_base):
        # davits: two curved arms from the deck up and over
        for X in (206, 262):
            x0_, y0_ = p.P(X, 0, 4)
            pts = [(x0_, y0_), (x0_ - 1, y0_ - 30), (x0_ + 3, y0_ - 44), (x0_ + 10, y0_ - 46)]
            for a_, b_ in zip(pts, pts[1:]):
                c.line(a_[0], a_[1], b_[0], b_[1], 'b_paint', .62)
                c.line(a_[0] + 1, a_[1], b_[0] + 1, b_[1], 'b_paint', .36)
            c.vline(int(x0_ + 10), int(y0_ - 46), int(y0_ - 26), 'trench', .5)     # falls
        # the boat: white hull, wooden gunwale, canvas cover, in chocks
        bx0, bx1 = p.P(200, 0, 12)[0], p.P(272, 0, 12)[0]
        by0 = lb_base - 30
        hull = [(bx0 - 2, by0 + 8), (bx1 + 4, by0 + 8), (bx1 - 2, by0 + 20), (bx0 + 6, by0 + 20)]
        c.poly(hull, 'white', vgrad(by0 + 8, by0 + 20, .62, .42))
        c.poly([(bx1 + 4, by0 + 8), (bx1 + 10, by0 + 4), (bx1 + 6, by0 + 12)], 'white', .55)     # bow
        c.hline(int(bx0) - 2, int(bx1) + 6, int(by0) + 8, 'wood', .55)
        c.hline(int(bx0) - 2, int(bx1) + 4, int(by0) + 9, 'wood', .35)
        c.poly([(bx0 - 1, by0 + 8), (bx0 + 6, by0 + 2), (bx1 - 4, by0 + 1), (bx1 + 6, by0 + 7)], 'b_tarp', .48)
        for k in range(1, 6):
            x = bx0 + (bx1 - bx0) * k / 6
            c.line(x, by0 + 2, x + 1, by0 + 8, 'b_tarp', .34)
        B.text(c, int(bx0) + 14, int(by0) + 12, 'CALYPSO', 'ink', .22)
        # chocks
        for X in (212, 258):
            q = p.P(X, 0, 12)
            c.rect(int(q[0]) - 3, by0 + 18, int(q[0]) + 4, lb_base, 'b_hull', .42)
    g['lifeboat'] = (int(p.P(200, 0, 12)[0]) - 4, lb_base - 50, int(p.P(272, 0, 12)[0]) + 12, lb_base)

    # ========================================== barrels: lashed stack / fallen ====
    bsx, bsZ = 282, 12
    bx_c, by_c = p.P(bsx, 0, bsZ)
    s = p.s(bsZ)
    g['barrels_xy'] = (int(bx_c), int(by_c))
    if 'barrels' in st:
        def one(X, Z, lift=0.0, top=True):
            x, y = p.P(X, 0, Z)
            ss = p.s(Z)
            B.barrel(c, x, y - lift * ss, 5.6 * ss, 15 * ss, 'oak', .6, hoop='steel', hoop_lum=.55, light=1,
                     top=top, staves=6)
        for X in (270, 282, 294):
            one(X, 4, top=False)
        for X in (276, 288):
            one(X, 4, lift=15.5, top=True)
        for X in (264, 276, 288, 300):
            one(X, 12, top=True)
        # rope lashing: around the front row and over the top tier to ring bolts in the deck
        ss = p.s(12)
        x0_, y0_ = p.P(258, 6, 13)
        x1_, y1_ = p.P(306, 6, 13)
        c.line(x0_, y0_, x1_, y1_, 'trench', .7)
        c.line(x0_, y0_ + 1, x1_, y1_ + 1, 'trench', .45)
        x0_, y0_ = p.P(258, 12, 13)
        x1_, y1_ = p.P(306, 12, 13)
        c.line(x0_, y0_, x1_, y1_, 'trench', .7)
        c.line(x0_, y0_ + 1, x1_, y1_ + 1, 'trench', .45)
        tx0, ty0 = p.P(272, 31, 4)
        tx1, ty1 = p.P(292, 31, 4)
        c.line(x0_ - 2, y0_, tx0, ty0, 'trench', .62)
        c.line(tx0, ty0, tx1, ty1, 'trench', .62)
        c.line(tx1, ty1, x1_ + 2, y1_, 'trench', .62)
        c.ellipse(bx_c - 26 * s, by_c + 3, 1.6, 1, 'steel', .6)
        c.ellipse(bx_c + 26 * s, by_c + 3, 1.6, 1, 'steel', .6)
        c.line(bx_c - 26 * s, by_c + 3, x0_ - 2, y0_ + 6, 'trench', .6)
        c.line(bx_c + 26 * s, by_c + 3, x1_ + 2, y1_ + 6, 'trench', .6)
    if 'barrels_fallen' in st:
        # barrels rolled down the deck towards the bow, one still rocking against the hatch
        for (X, Z, k) in ((236, 40, 0), (210, 58, 1), (252, 74, 2), (196, 30, 3), (278, 50, 4)):
            x, y = p.P(X, 0, Z)
            ss = p.s(Z)
            r_ = 6 * ss
            L = 15 * ss
            # lying on the side, seen at an angle: body + elliptical end
            ang = [.15, -.25, .35, -.1, .2][k]
            c.poly([(x - L / 2, y - 2 * r_), (x + L / 2, y - 2 * r_ + ang * 6), (x + L / 2, y + ang * 6), (x - L / 2, y)],
                   'oak', .54)
            for t in (.2, .8):
                xx = x - L / 2 + L * t
                c.line(xx, y - 2 * r_ + ang * 6 * t, xx, y + ang * 6 * t, 'rust', .5)
            c.ellipse(x + L / 2, y - r_ + ang * 6, r_ * .55, r_, 'oak', .66)
            c.ellipse(x + L / 2, y - r_ + ang * 6, r_ * .35, r_ * .7, 'oak', .46)
            c.hline(int(x - L / 2), int(x + L / 2), int(y - 2 * r_ + ang * 3), 'oak', .74)
            c.shadow_ellipse(x, y + 1, L * .6, 2, .35)
        # the cut lashing lying on the deck
        c.line(bx_c - 24 * s, by_c, bx_c - 6 * s, by_c - 2, 'trench', .55)
        c.line(bx_c - 6 * s, by_c - 2, bx_c + 10 * s, by_c + 3, 'trench', .5)
        c.line(bx_c + 12 * s, by_c, bx_c + 26 * s, by_c, 'trench', .5)
    # the ring bolts stay in the deck either way
    if 'barrels' not in st:
        c.ellipse(bx_c - 26 * s, by_c + 3, 1.6, 1, 'steel', .6)
        c.ellipse(bx_c + 26 * s, by_c + 3, 1.6, 1, 'steel', .6)

    # ================================================= ventilator cowls & bitts ====
    def cowl(X, Z, hgt=22, name=None):
        x, y = p.P(X, 0, Z)
        ss = p.s(Z)
        r_ = 4.2 * ss
        top = y - hgt * ss
        B.cylinder(c, x, top + 4 * ss, y, r_, r_ * .35, 'b_paint', .62, light=1, top=False)
        c.rect(int(x - r_ - 1), int(y) - 2, int(x + r_) + 2, int(y), 'b_paint', .4)          # deck flange
        # the trumpet mouth turned towards us: white rim, red inside
        c.ellipse(x, top, r_ * 1.9, r_ * 1.7, 'b_paint', .7)
        c.ellipse(x, top + .5, r_ * 1.5, r_ * 1.35, 'red', .42)
        c.ellipse(x - r_ * .2, top + r_ * .35, r_ * .9, r_ * .8, 'red', .22)
        c.put(int(x - r_ * 1.6), int(top - r_ * .6), 'white', .9)
        return (int(x), int(y), int(top), r_)
    with sc.obj('cowl_aft', baseline=int(p.P(0, 0, 8)[1]) + 1):
        g['cowl1'] = cowl(52, 8, 20)
    fz = 74
    fcb = int(p.P(0, 0, fz)[1]) + 1
    with sc.obj('cowl_fwd', baseline=fcb):
        g['cowl2'] = cowl(290, fz, 22)
    # double mooring bitts + a coil of hawser at the front right
    bz = 78
    bb_ = int(p.P(0, 0, bz)[1]) + 1
    with sc.obj('bitts', baseline=bb_):
        for X in (318, 330):
            x, y = p.P(X, 0, bz)
            ss = p.s(bz)
            B.cylinder(c, x, y - 9 * ss, y, 3.2 * ss, 1.2 * ss, 'b_hull', .45, light=1, top_lum=.6)
            c.ellipse(x, y - 9 * ss, 3.8 * ss, 1.4 * ss, 'b_hull', .62)
        x0_, y0_ = p.P(318, 5, bz)
        x1_, y1_ = p.P(330, 5, bz)
        for k in range(3):
            c.line(x0_, y0_ + k * 2 - 2, x1_, y1_ - k * 2 + 2, 'trench', .62)            # figure-eight turns
        c.line(x1_ + 3, y1_, x1_ + 26, y1_ - 26, 'trench', .5)                            # line running to the rail
        rx_, ry_ = p.P(344, 0, bz + 4)
        B.rope_coil(c, rx_, ry_, 9 * p.s(bz), 3 * p.s(bz), 'trench', .58, turns=4)
    g['bitts'] = (int(p.P(316, 9, bz)[0]) - 4, int(p.P(316, 9, bz)[1]) - 6, int(rx_ + 14), bb_)
    g['cowl_fwd_base'] = fcb

    # ============================================================== lighting ====
    c.ambient = .4
    dlx, dly = g['door_lamp']
    c.add_light(dlx, dly + 6, 70, .5, falloff=1.3)
    c.add_light(dlx - 10, RAIL + 24, 60, .26, ystretch=2.5)
    c.glow(dlx, dly, 14, '#ffd080', .65)
    for (x, y) in plamps:
        c.glow(x, y, 26, '#ffb040', .45)
        c.add_light(x, y, 50, .2)
    c.glow(352, 4, 8, '#ffffff', .6)
    c.glow(390, RAIL - 28, 8, '#ffb050', .4)
    c.add_light(200, 40, 260, .12, falloff=.8)          # diffuse fog glow over the deck
    clx, cly = g['cargo_lamp']
    c.add_light(36, 100, 56, .38, ystretch=1.6)          # spill from the derrick lamp over the forward hatch
    c.add_light(150, 112, 90, .42, ystretch=2.2)          # cargo lamp pool over the main hatch
    c.light_poly([(clx - 1, cly), (clx + 2, cly), (196, 118), (110, 118)], .05)
    c.glow(clx, cly, 12, '#ffe0a0', .55)
    # contact shadows
    c.shadow_poly(p.quad([(mh[0] - 2, 0, mh[2] - 1), (mh[1] + 2, 0, mh[2] - 1), (mh[1] + 2, 0, mh[3] + 3),
                          (mh[0] - 2, 0, mh[3] + 3)]), .35)
    c.shadow_poly(p.quad([(fh[0] - 2, 0, fh[2] - 1), (fh[1] + 2, 0, fh[2] - 1), (fh[1] + 2, 0, fh[3] + 3),
                          (fh[0] - 2, 0, fh[3] + 3)]), .35)
    c.shadow_poly(p.quad([(198, 0, 6), (276, 0, 6), (276, 0, 16), (198, 0, 16)]), .35)
    B.vignette(c, 200, 70, 260, 150, lo=.62)
    return g, p


STATES = [
    ('fwd_bolt_open', {'fwd_bolt_open'}, None),
    ('barrels', {'barrels'}, None),
    ('barrels_fallen', {'barrels_fallen'}, 3),
]


def build():
    sc = Scene('calypso_deck', W, H, seed=SEED)
    g, p = paint(sc, set())
    for name, sts, depth in STATES:
        alt = Scene('calypso_deck', W, H, seed=SEED)
        paint(alt, sts)
        if name == 'barrels':
            depth = g['barrels_xy'][1] + 1
        if name == 'fwd_bolt_open':
            depth = g['fwd'][3] + 1
        B.state_from(sc, name, alt.c, depth=depth)

    def P2(X, Z):
        x, y = p.P(X, 0, Z)
        return (int(round(x)), int(round(y)))
    mx0, my0, mx1, mb = g['main']
    sc.hotspot('hatch', rect=(mx0, my0, mx1, mb), walk=(150, mb + 8), face='up')
    fx0, fy0, fx1, fy1 = g['fwd']
    sc.hotspot('fwd_hatch', rect=(fx0, fy0, fx1, fy1), walk=((fx0 + fx1) // 2, fy1 + 8), face='up')
    bx_, by_ = g['bolt']
    sc.hotspot('bolt', rect=(bx_ - 8, by_ - 6, bx_ + 16, by_ + 6), walk=(bx_ + 4, fy1 + 8), face='up')
    sc.hotspot('lifeboat', rect=g['lifeboat'], walk=(236, g['lifeboat_base'] + 10), face='up')
    bxc, byc = g['barrels_xy']
    sc.hotspot('barrels', rect=(bxc - 20, byc - 50, bxc + 20, byc + 2), walk=(bxc - 4, byc + 10), face='up')
    sc.hotspot('rope', rect=(bxc - 24, byc - 26, bxc + 24, byc - 10), walk=(bxc + 6, byc + 10), face='up')
    cdx0, cdy0, cdx1, cdy1 = g['cabin']
    sc.hotspot('exit_cabin', rect=(cdx0 - 2, cdy0 - 10, cdx1 + 2, cdy1), walk=((cdx0 + cdx1) // 2, cdy1 + 6), face='up')
    gx0, gx1 = g['gangway']
    sc.hotspot('gangway', rect=(gx0, RAIL - 24, gx1 + 6, RAIL + 2), walk=((gx0 + gx1) // 2, RAIL + 6), face='up')
    sc.hotspot('derrick', rect=g['derrick'], walk=(72, 118), face='up')
    sc.hotspot('rail', rect=(100, RAIL - 20, 196, RAIL), walk=(150, RAIL + 3), face='up')

    zf = p.z_at_floor_y(H - 4)
    poly = [P2(-60, 2), P2(332, 2), P2(332, 6), P2(400, 6), P2(400, zf), P2(-60, zf)]
    holes = [
        [P2(96, 12), P2(200, 12), P2(200, 56), P2(96, 56)],          # main hatch
        [P2(12, 16), P2(68, 16), P2(68, 42), P2(12, 42)],            # forward hatch
        [P2(196, 0), P2(278, 0), P2(278, 16), P2(196, 16)],          # lifeboat chocks
        [P2(74, 28), P2(100, 28), P2(100, 38), P2(74, 38)],          # derrick foot + winch
        [P2(280, 68), P2(300, 68), P2(300, 78), P2(280, 78)],        # foreground cowl
        [P2(310, 72), P2(358, 72), P2(358, 86), P2(310, 86)],        # bitts + coil
        [P2(42, 4), P2(62, 4), P2(62, 12), P2(42, 12)],              # aft cowl
    ]
    sc.walkable(poly, holes=holes)
    sc.point('start', 150, g['main_base'] + 8, 'down')
    nb = g['lifeboat_base']
    sc.point('nora_spot', 238, nb - 4, 'left')
    sc.point('kroll_spot', (gx0 + gx1) // 2, RAIL + 4, 'down')
    sc.point('barrels_spot', bxc - 4, byc + 10, 'up')
    sc.point('cabin_spot', (cdx0 + cdx1) // 2, cdy1 + 6, 'up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(RAIL, p.char_scale(RAIL, 140), 140, 1.0)
    sc.meta['floor'] = 'metal'
    sc.meta['npc_notes'] = {'nora_spot': 'behind the lifeboat (occluder lifeboat, baseline > spot y)',
                            'kroll_spot': 'at the head of the gangway, by the rail gap'}

    # ------------------------------------------------------------ animations ----
    fx, fy = g['funnel']

    def sfr(k):
        def f(cc):
            # smoke torn sideways by the wind off the funnel top, drifting left along the skyline
            for j in range(9):
                t = (j + k / 4) / 9
                xx = fx - 8 - t * 60
                yy = 3 + t * 9 + math.sin((j + k) * 1.3) * 1.2
                cc.ellipse(xx, yy, 2.5 + t * 5, 1.4 + t * 1.6, 'fog', .34 - t * .12, dith=.5)
        return f
    sc.anim('funnel', [sfr(k) for k in range(4)], fps=4)
    # crane warning lights on the pier blink
    def bfr(on):
        def f(cc):
            for (x, h) in ((176, 50), (204, 44)):
                cc.put(x + 18, RAIL - h - 6, 'neonred', .7 if on else .15, emis=1 if on else 0)
        return f
    sc.anim('blink', [bfr(True), bfr(True), bfr(False)], fps=2)
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
