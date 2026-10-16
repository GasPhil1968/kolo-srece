"""St. Brigid's Mission hall (Ch2, Ch3, Ch6). Base = overcast day, variant 'dawn'.

Whitewashed refectory: trestle tables with a few down-and-outs (day) / sleepers (dawn), the
iron range with the soup cauldron beside the serving counter (the headscarfed volunteer stands
behind it), a tall stained-glass lancet of St. Brigid whose colours fall across the flagstones,
a crucifix with a votive light, the open office door with the wall telephone inside, a notice
board, the side door to the churchyard and the bell rope.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import Light, vgrad, hgrad, radial, noise2
from persp import Persp
import furniture as F
import props_c as C

W, H = 320, 144
FLOOR = 92
_V = {}
P = C.P
WIN = (190, 216, 6, 64)        # stained glass lancet (screen box on the back wall)


# ----------------------------------------------------------------------------- props ----
def lancet_mask(x0, x1, y0, y1):
    """Pointed-arch window shape as a polygon."""
    cx = (x0 + x1) / 2
    hw = (x1 - x0) / 2
    pts = [(x0, y1), (x0, y0 + hw * 1.2)]
    for k in range(1, 8):
        t = k / 8
        a = math.pi / 2 * t
        pts.append((cx - hw * math.cos(a) ** .9, y0 + hw * 1.2 * (1 - math.sin(a))))
    pts.append((cx, y0))
    for k in range(7, 0, -1):
        t = k / 8
        a = math.pi / 2 * t
        pts.append((cx + hw * math.cos(a) ** .9, y0 + hw * 1.2 * (1 - math.sin(a))))
    pts += [(x1, y0 + hw * 1.2), (x1, y1)]
    return pts


def stained_glass(c, bright=0.0, emis=.85):
    """St. Brigid with her lamp over her rush cross; cobalt quarries, ruby/amber border."""
    x0, x1, y0, y1 = WIN
    b = bright
    shape = lancet_mask(x0, x1, y0, y1)
    m, r = c.poly_mask(shape)
    # cobalt quarries (diamond lattice)
    c.poly(shape, 'c_cobalt', lambda xx, yy: .5 + b + .1 * np.sin(xx * .9) * np.sin(yy * .7), emis=emis, dith=.2)
    # border ring of alternating ruby / amber
    inner = lancet_mask(x0 + 3, x1 - 3, y0 + 3, y1 - 2)
    mi, ri = c.poly_mask(inner)
    border = np.zeros((c.h, c.w), bool)
    border[r[1]:r[3], r[0]:r[2]] = m
    inner_full = np.zeros((c.h, c.w), bool)
    inner_full[ri[1]:ri[3], ri[0]:ri[2]] = mi
    border &= ~inner_full
    yy, xx = np.mgrid[0:c.h, 0:c.w]
    alt_ = ((yy // 4 + xx // 4) % 2 == 0)
    C.set_pixels(c, border & alt_, 'c_ruby', .55 + b, emis=emis, dith=.2)
    C.set_pixels(c, border & ~alt_, 'c_amber', .6 + b, emis=emis, dith=.2)
    # the saint: green cloak, white veil, gold halo, holding a lamp
    cx = (x0 + x1) // 2
    c.ellipse(cx, y0 + 18, 5, 5, 'c_amber', .75 + b, emis=emis)                      # halo
    c.ellipse(cx, y0 + 18, 2.4, 3, 'paper', .78 + b, emis=emis)                      # face/veil
    c.poly([(cx - 3, y0 + 15), (cx + 3, y0 + 15), (cx + 4, y0 + 22), (cx - 4, y0 + 22)], 'paper', .7 + b, emis=emis)
    c.poly([(cx - 4, y0 + 22), (cx + 4, y0 + 22), (cx + 7, y0 + 44), (cx - 7, y0 + 44)], 'c_emerald',
           vgrad(y0 + 22, y0 + 44, .62 + b, .48 + b), emis=emis)                       # cloak
    c.line(cx, y0 + 24, cx - 2, y0 + 43, 'c_emerald', .36 + b, emis=emis)
    c.line(cx + 3, y0 + 26, cx + 4, y0 + 43, 'c_emerald', .4 + b, emis=emis)
    c.rect(cx + 4, y0 + 27, cx + 8, y0 + 31, 'c_amber', .9 + b, emis=1)              # the lamp
    c.put(cx + 6, y0 + 26, 'c_amber', 1.0, emis=1)
    c.poly([(cx - 3, y0 + 44), (cx + 3, y0 + 44), (cx + 5, y0 + 47), (cx - 5, y0 + 47)], 'c_ruby', .5 + b, emis=emis)
    # St. Brigid's cross in the bottom panel
    by_ = y1 - 8
    c.rect(x0 + 4, by_ - 5, x1 - 4, y1 - 2, 'c_ruby', .5 + b, emis=emis)
    c.rect(cx - 1, by_ - 4, cx + 1, by_ + 5, 'c_amber', .8 + b, emis=emis)
    c.rect(cx - 5, by_ - 1, cx + 6, by_ + 1, 'c_amber', .8 + b, emis=emis)
    c.rect(cx - 2, by_ - 2, cx + 3, by_ + 3, 'c_amber', .6 + b, emis=emis)
    # lead cames
    for yl in (y0 + 13, y0 + 48, by_ - 6):
        c.hline(x0 + 1, x1 - 1, yl, 'black', .15)
    c.vline(x0 + 3, y0 + 12, y1, 'black', .15)
    c.vline(x1 - 4, y0 + 12, y1, 'black', .15)
    for k in range(0, 36, 6):                                                          # quarry diagonals
        c.line(x0 + 3, y0 + 18 + k, x0 + 8, y0 + 13 + k, 'black', .2)
        c.line(x1 - 4, y0 + 18 + k, x1 - 9, y0 + 13 + k, 'black', .2)
    return shape


def stone_surround(c, shape, x0, x1, y0, y1):
    outer = lancet_mask(x0 - 3, x1 + 3, y0 - 3, y1 + 2)
    c.poly(outer, 'c_stone', .56)
    for k in range(4):
        c.hline(x0 - 3, x0, y1 - 8 - k * 12, 'c_stone', .35)
        c.hline(x1, x1 + 3, y1 - 6 - k * 12, 'c_stone', .35)
    c.rect(x0 - 5, y1, x1 + 5, y1 + 3, 'c_stone', .7)
    c.hline(x0 - 5, x1 + 5, y1 + 3, 'c_stone', .3)


def trestle_table(c, p, X0, X1, Z0, Z1, Ht=19, lum=.5):
    for X in (X0 + 4, X1 - 6):
        a = P(p, X, Ht - 1, (Z0 + Z1) / 2)
        b1 = P(p, X - 4, 0, Z1 - 2)
        b2 = P(p, X + 4, 0, Z1 - 2)
        c.line(a[0], a[1], b1[0], b1[1], 'oak', lum - .2)
        c.line(a[0] + 1, a[1], b2[0], b2[1], 'oak', lum - .25)
        c.line(a[0], a[1], b1[0] - 1, b1[1], 'oak', lum - .1)
    ma = P(p, X0 + 4, 7, (Z0 + Z1) / 2)
    mb = P(p, X1 - 6, 7, (Z0 + Z1) / 2)
    c.hline(ma[0], mb[0], ma[1], 'oak', lum - .22)
    p.box(c, X0, X1, Ht - 2, Ht, Z0, Z1, 'oak', front=lum, top=lum + .14, side=lum - .1,
          top_fn=C.grain_h(lum + .14, .03, .55, int(X0)))
    a = P(p, X0, Ht, Z1)
    b = P(p, X1, Ht, Z1)
    c.hline(a[0], b[0], a[1], 'oak', lum + .32)
    # plank seams on the top
    for X in range(int(X0) + 15, int(X1), 15):
        q = P(p, X, Ht, Z0)
        r = P(p, X, Ht, Z1)
        c.line(q[0], q[1], r[0], r[1], 'oak', lum - .05)


def bench(c, p, X0, X1, Z0, Z1, Hb=11, lum=.46):
    for X in (X0 + 3, X1 - 5):
        p.box(c, X, X + 2, 0, Hb, Z0, Z1, 'oak', front=lum - .18, side=lum - .25, top=lum)
    p.box(c, X0, X1, Hb - 2, Hb, Z0, Z1, 'oak', front=lum, top=lum + .16, side=lum - .1)
    a = P(p, X0, Hb, Z1)
    b = P(p, X1, Hb, Z1)
    c.hline(a[0], b[0], a[1], 'oak', lum + .3)


def bowl(c, x, y, steam=False):
    c.ellipse(x, y, 3, 1.2, 'white', .62)
    c.hline(x - 2, x + 3, y - 1, 'white', .85)
    c.hline(x - 1, x + 2, y, 'c_amber', .38)


def diner_back(c, x, y, k=1.0, coat='slate', lum=.3, hat=True):
    """Figure on the near bench, back to the camera, hunched. (x, y) = seat point."""
    sw = int(7 * k)
    top = y - int(17 * k)
    c.poly([(x - sw, y), (x - sw + 1, top + 4), (x - 3, top), (x + 3, top), (x + sw - 1, top + 4), (x + sw, y)],
           coat, vgrad(top, y, lum + .06, lum - .06))
    c.line(x, top + 2, x, y - 2, coat, lum - .1)
    hx, hy = x, top - int(3 * k)
    c.ellipse(hx, hy, 2.8 * k, 3 * k, 'black', .5)
    if hat:
        c.ellipse(hx, hy - 2 * k, 4.5 * k, 1.2 * k, 'slate', lum - .05)
        c.rect(hx - 3 * k, hy - 5 * k, hx + 3 * k, hy - 2 * k, 'slate', lum + .02)
    c.hline(x - sw, x + sw, y, coat, lum - .15)


def sleeper_slumped(c, x, y, k=1.0, coat='c_navy', lum=.3):
    """Man asleep with his head on his arms on the table. (x, y) = table edge."""
    c.ellipse(x, y - 4 * k, 8 * k, 4 * k, coat, lum)
    c.ellipse(x - 1, y - 6 * k, 6 * k, 3 * k, coat, lum + .06)
    c.ellipse(x + 2 * k, y - 6 * k, 3 * k, 2.6 * k, 'black', .45)          # head on the arms
    c.ellipse(x + 2 * k, y - 8 * k, 4.4 * k, 1.2 * k, 'slate', .3)        # hat tipped forward
    c.rect(x - 7 * k, y - 2, x + 7 * k, y, coat, lum - .06)


def sleeper_lying(c, x0, x1, y, lum=.3):
    """Man asleep on a bench under his coat. (x0..x1, y) = bench top line."""
    c.poly([(x0, y), (x0 + 3, y - 5), (x1 - 8, y - 6), (x1 - 2, y - 4), (x1, y)], 'trench',
           vgrad(y - 6, y, lum + .1, lum - .05))
    for k in range(x0 + 5, x1 - 6, 6):
        c.line(k, y - 5, k + 2, y - 1, 'trench', lum - .1)
    c.ellipse(x1 - 3, y - 4, 2.5, 2.2, 'black', .45)
    c.ellipse(x1 - 2, y - 6, 3.5, 1, 'slate', .3)
    c.rect(x0 - 2, y - 3, x0 + 1, y, 'black', .4)                             # boots
    c.put(x0 - 2, y - 4, 'black', .5)


# ----------------------------------------------------------------------------- build ----
def build():
    sc = C.SceneC('mission', W, H, seed=61)
    c = sc.c
    p = Persp(30, 290, 0, FLOOR, horizon=-60, depth=400)
    zf = p.z_at_floor_y(H + 2)
    lay = C.Layer(c)
    alt = lay.alt('dawn')
    by = lambda Z: int(round(p.P(0, 0, Z)[1]))
    bx = lambda X, Z: int(round(p.P(X, 0, Z)[0]))

    # ---- shell: whitewash over stone, timber posts, flagstone floor -------------------------------
    wall = C.noisy(vgrad(0, FLOOR, .62, .7), W, H, 8, .04, seed=5)
    c.rect(30, 0, 290, FLOOR, 'c_plaster', wall)
    # damp bloom and old patching
    for (sx, sy, r) in ((60, 70, 14), (250, 20, 18), (140, 80, 10)):
        c.modulate(sx - r, sy - r, sx + r, sy + r,
                   lambda xx, yy, sx=sx, sy=sy, r=r: 1 - .1 * np.clip(1 - np.hypot(xx - sx, yy - sy) / r, 0, 1))
    c.rect(30, FLOOR - 8, 290, FLOOR, 'c_stone', C.noisy(.42, W, H, 3, .05, seed=6))      # stone plinth
    c.hline(30, 290, FLOOR - 8, 'c_stone', .62)
    for X in range(34, 290, 13):
        c.vline(X, FLOOR - 7, FLOOR, 'c_stone', .3)
    for X0, X1, k in ((30, 30, .78), (290, 290, .72)):
        q = p.quad([(X0, 8, 0), (X0, 8, zf), (X0, 220, zf), (X0, 220, 0)])
        c.poly(q, 'c_plaster', C.noisy(.6 * k, W, H, 8, .04, seed=X0))
        q = p.quad([(X0, 0, 0), (X0, 0, zf), (X0, 8, zf), (X0, 8, 0)])
        c.poly(q, 'c_stone', .4 * k)
    # timber posts
    for X in (68, 184):
        c.rect(X - 2, 0, X + 2, FLOOR - 8, 'oak', hgrad(X - 2, X + 2, .45, .3))
        c.vline(X - 2, 0, FLOOR - 8, 'oak', .58)
    c.rect(30, 0, 290, 4, 'oak', .34)                                                     # wall plate
    c.hline(30, 290, 4, 'oak', .5)
    # flagstones
    hy, cx, E, D = p.hy, p.cx, p.E, p.D
    Nf = noise2(W, H, 6, 13, 2)

    def flags(xx, yy):
        s = np.maximum((yy - hy) / E, 1e-3)
        X = cx + (xx - cx) / s
        Z = D * (1 - 1 / s)
        row = np.floor(Z / 16)
        off = (row % 2) * 11 + (row % 3) * 5
        col = np.floor((X + off) / 22)
        fx = (X + off) / 22 - col
        fz = Z / 16 - row
        h = np.sin(col * 12.9898 + row * 78.233) * 43758.5453
        h = h - np.floor(h)
        L = .46 + (h - .5) * .14 + (Nf[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)] - .5) * .12
        gw = .7 / s
        L = np.where((fx < gw / 22) | (fz < gw / 16 * 1.3), .24, L)
        return L
    fl = p.quad([(30, 0, 0), (290, 0, 0), (290, 0, zf), (30, 0, zf)])
    c.poly(fl, 'concrete', flags)
    # worn path from the street door to the counter
    c.modulate(0, FLOOR, W, H, lambda xx, yy: 1 + .07 * np.clip(1 - np.abs((yy - FLOOR) - (xx - 40) * .35) / 12, 0, 1))

    # ---- street door (arched) ----------------------------------------------------------------
    D0, D1 = 40, 64
    dtop = FLOOR - 48
    arch = [(D0, FLOOR), (D0, dtop + 10)] + [((D0 + D1) / 2 - 12 * math.cos(a), dtop + 10 - 10 * math.sin(a))
                                              for a in np.linspace(0, math.pi, 12)][1:-1] + [(D1, dtop + 10), (D1, FLOOR)]
    outer = [(D0 - 3, FLOOR), (D0 - 3, dtop + 10)] + [((D0 + D1) / 2 - 15 * math.cos(a), dtop + 10 - 13 * math.sin(a))
                                                       for a in np.linspace(0, math.pi, 12)][1:-1] + [(D1 + 3, dtop + 10), (D1 + 3, FLOOR)]
    c.poly(outer, 'c_stone', .55)
    c.poly(arch, 'wood', C.grain_v(.4, .03, 1.1))
    for X in range(D0 + 4, D1, 5):
        c.vline(X, dtop + 2, FLOOR, 'wood', .26)
    c.vline((D0 + D1) // 2, dtop, FLOOR, 'wood', .2)
    for yy in (dtop + 16, FLOOR - 12):
        c.rect(D0, yy, D1, yy + 2, 'black', .3)                                         # strap hinges
        c.hline(D0, D1 - 6, yy, 'black', .5)
        for X in range(D0 + 2, D1 - 6, 5):
            c.put(X, yy + 1, 'steel', .6)
    c.ellipse((D0 + D1) // 2 + 4, FLOOR - 24, 2, 2, 'black', .5)                        # ring handle
    c.ellipse((D0 + D1) // 2 + 4, FLOOR - 24, 1, 1, 'c_plaster', .5)
    c.hline(D0, D1, FLOOR - 1, 'c_sky', .5, emis=.6)                                     # daylight under it
    C.text(c, 37, dtop - 21, 'WELCOME', 'c_navy', .45)
    c.hline(39, 66, dtop - 15, 'c_navy', .35)
    # donated clothes crate by the door
    cr = P(p, 70, 0, 12)
    p.box(c, 66, 82, 0, 10, 4, 14, 'oak', front=.4, top=.5, side=.3)
    c.poly([(cr[0] - 3, cr[1] - 10), (cr[0] + 3, cr[1] - 14), (cr[0] + 9, cr[1] - 12), (cr[0] + 13, cr[1] - 9)],
           'c_navy', .4)
    c.poly([(cr[0] + 2, cr[1] - 11), (cr[0] + 7, cr[1] - 15), (cr[0] + 12, cr[1] - 10)], 'red', .38)

    # ---- kitchen wall: clerestory windows, shelves, SOUP board ----------------------------------------
    for (a, b) in ((92, 106), (122, 136)):
        shape = lancet_mask(a, b, 8, 26)
        with lay.base():
            c.poly(shape, 'c_sky', vgrad(8, 26, .82, .68), emis=.85, dith=.25)
        alt.poly(shape, 'c_chrys', vgrad(8, 26, .5, .8), emis=1, dith=.25)
        c.vline((a + b) // 2, 12, 26, 'black', .25)
        c.hline(a, b, 18, 'black', .25)
        c.rect(a - 2, 26, b + 2, 28, 'c_stone', .62)
    # shelves with bowls, mugs, jars
    for sy in (44, 56):
        c.rect(74, sy, 148, sy + 2, 'oak', .5)
        c.hline(74, 148, sy, 'oak', .72)
        for X in (78, 144):
            c.poly([(X, sy + 2), (X + 2, sy + 2), (X, sy + 6)], 'oak', .35)
    for i, X in enumerate(range(78, 112, 6)):
        c.ellipse(X + 2, 42.5, 2.6, 1.2, 'white', .7)
        c.hline(X, X + 5, 41, 'white', .55)
        c.ellipse(X + 2, 40.5, 2.4, 1.0, 'white', .78)
    for i, X in enumerate(range(116, 144, 5)):
        c.rect(X, 39, X + 3, 44, 'white' if i % 2 else 'c_cobalt', .62 if i % 2 else .45)
        c.put(X + 3, 41, 'white', .5)
    for i, X in enumerate(range(78, 146, 9)):
        h_ = 6 + (i % 3) * 2
        c.rect(X, 56 - h_, X + 5, 56, 'glass' if i % 2 else 'c_amberglass', .5, emis=.05)
        c.rect(X, 56 - h_, X + 5, 56 - h_ + 2, 'paper', .7 if i % 2 else .5)
    # SOUP chalkboard
    c.rect(72, 26, 92, 38, 'oak', .5)
    c.rect(73, 27, 91, 37, 'black', .35)
    C.text(c, 75, 28, 'SOUP', 'paper', .72)
    c.hline(75, 89, 34, 'paper', .5)
    c.hline(75, 85, 36, 'paper', .45)

    # ---- iron range + cauldron + stovepipe ------------------------------------------------------------
    SX0, SX1, SZ0, SZ1 = 152, 182, 0, 14
    c.rect(174, 0, 179, 66, 'c_iron', hgrad(174, 179, .5, .25))                       # stovepipe
    c.vline(174, 0, 66, 'c_iron', .66)
    for yy in (20, 40):
        c.rect(173, yy, 180, yy + 2, 'c_iron', .4)
    c.ellipse(176.5, 30, 3.2, 1.0, 'c_iron', .6)                                       # damper
    p.box(c, SX0, SX1, 2, 20, SZ0, SZ1, 'c_iron', front=.36, top=.42, side=.24,
          lum_fn=lambda xx, yy: .36 + .04 * np.sin(xx * 1.7))
    for X in (SX0 + 1, SX1 - 3):
        p.box(c, X, X + 2, 0, 2, SZ1 - 3, SZ1 - 1, 'c_iron', front=.3)
    sf0 = P(p, SX0, 20, SZ1)
    sf1 = P(p, SX1, 2, SZ1)
    c.hline(sf0[0], sf1[0], sf0[1], 'c_iron', .72)
    c.rect(sf0[0] - 1, sf0[1] + 2, sf1[0] + 1, sf0[1] + 4, 'chrome', .55)             # towel rail
    c.hline(sf0[0] - 1, sf1[0] + 1, sf0[1] + 2, 'chrome', .85)
    c.rect(sf0[0] + 3, sf0[1] + 3, sf0[0] + 8, sf0[1] + 11, 'paper', .7)               # tea towel
    c.hline(sf0[0] + 3, sf0[0] + 8, sf0[1] + 6, 'red', .5)
    # firebox door with the glow (glow layer: day = flames, dawn = embers)
    fb0 = (sf0[0] + 12, sf0[1] + 6)
    c.rect(fb0[0], fb0[1], fb0[0] + 12, fb0[1] + 9, 'c_iron', .42)
    c.hline(fb0[0], fb0[0] + 12, fb0[1], 'c_iron', .7)
    with lay.base():
        for k in range(fb0[0] + 2, fb0[0] + 11, 2):
            c.vline(k, fb0[1] + 2, fb0[1] + 7, 'c_ember', .82, emis=1)
    for k in range(fb0[0] + 2, fb0[0] + 11, 2):
        alt.vline(k, fb0[1] + 3, fb0[1] + 7, 'c_ember', .5, emis=1)
    _V['firebox'] = (fb0[0] + 6, fb0[1] + 5)
    c.rect(sf0[0] + 3, sf1[1] - 7, sf1[0] - 3, sf1[1] - 1, 'c_iron', .3)               # ash door
    c.hline(sf0[0] + 3, sf1[0] - 3, sf1[1] - 7, 'c_iron', .55)
    c.put(sf1[0] - 5, sf1[1] - 4, 'brass', .7)
    # cauldron on the hotplate
    kx, ky = P(p, 164, 20, 7)
    c.ellipse(kx, ky - 2, 10, 3, 'c_iron', .25)
    c.rect(kx - 10, ky - 13, kx + 11, ky - 2, 'c_iron', hgrad(kx - 10, kx + 11, .5, .22))
    c.vline(kx - 9, ky - 12, ky - 3, 'c_iron', .72)
    c.ellipse(kx + .5, ky - 13, 10.5, 2.6, 'c_iron', .55)
    c.ellipse(kx + .5, ky - 13, 9, 1.8, 'c_amber', .42)                                # the soup
    c.hline(kx - 6, kx + 3, ky - 14, 'c_amber', .62)
    c.rect(kx - 12, ky - 11, kx - 10, ky - 9, 'c_iron', .4)                            # handles
    c.rect(kx + 11, ky - 11, kx + 13, ky - 9, 'c_iron', .4)
    c.line(kx + 4, ky - 14, kx + 12, ky - 26, 'chrome', .72)                          # ladle
    c.line(kx + 5, ky - 14, kx + 13, ky - 26, 'chrome', .45)
    _V['pot'] = (kx, ky - 15)
    # kettle on the side + coal scuttle + the cat
    ke = P(p, 178, 20, 6)
    c.ellipse(ke[0], ke[1] - 3, 3.5, 3, 'chrome', radial(ke[0] - 1, ke[1] - 5, 5, .85, .4))
    c.line(ke[0] + 3, ke[1] - 4, ke[0] + 6, ke[1] - 7, 'chrome', .6)
    c.line(ke[0] - 3, ke[1] - 6, ke[0] + 2, ke[1] - 8, 'black', .45)
    cs = P(p, 188, 0, 8)
    c.poly([(cs[0] - 4, cs[1]), (cs[0] + 4, cs[1]), (cs[0] + 5, cs[1] - 7), (cs[0] - 3, cs[1] - 8)], 'c_iron', .38)
    c.ellipse(cs[0], cs[1] - 8, 3, 1, 'black', .25)
    cat = P(p, 186, 0, 22)
    c.ellipse(cat[0], cat[1] - 2, 5, 2.4, 'c_tan', .52)
    c.ellipse(cat[0] + 4, cat[1] - 3, 2.2, 2, 'c_tan', .58)
    c.put(cat[0] + 3, cat[1] - 5, 'c_tan', .6)
    c.put(cat[0] + 5, cat[1] - 5, 'c_tan', .6)
    c.line(cat[0] - 5, cat[1] - 1, cat[0] - 1, cat[1], 'c_tan', .4)
    c.hline(cat[0] - 3, cat[0] + 2, cat[1] - 2, 'c_tan', .4)

    # ---- serving counter (occluder: the volunteer stands behind it) ------------------------------------
    KX0, KX1, KZ0, KZ1 = 76, 148, 12, 24
    KH = 22
    with sc.obj('counter', baseline=by(KZ1) + 1):
        p.box(c, KX0, KX1, 0, KH - 2, KZ0, KZ1, 'oak', front=.44, top=.5, side=.3,
              lum_fn=C.grain_v(.44, .025, 1.0, 3))
        k0 = P(p, KX0, KH - 2, KZ1)
        k1 = P(p, KX1, 0, KZ1)
        for X in range(k0[0] + 6, k1[0], 7):
            c.vline(X, k0[1] + 2, k1[1] - 2, 'oak', .3)
        c.rect(k0[0], k1[1] - 3, k1[0], k1[1], 'oak', .3)
        p.box(c, KX0 - 1, KX1 + 1, KH - 2, KH, KZ0 - 1, KZ1 + 1, 'steel', front=.55, top=.62, side=.4,
              top_fn=C.noisy(.6, W, H, 3, .05, seed=9))                                 # zinc top
        t0 = P(p, KX0 - 1, KH, KZ1 + 1)
        t1 = P(p, KX1 + 1, KH, KZ1 + 1)
        c.hline(t0[0], t1[0], t0[1], 'steel', .9)
        # stack of tin bowls, bread basket, a mug of spoons, the alms tin
        bs = P(p, 86, KH, 18)
        for i in range(4):
            c.ellipse(bs[0], bs[1] - 1 - i * 1.4, 4, 1.4, 'steel', .5 + i * .08)
        c.hline(bs[0] - 3, bs[0] + 4, bs[1] - 6, 'steel', .9)
        bb = P(p, 104, KH, 17)
        c.ellipse(bb[0], bb[1] - 1, 7, 2.5, 'c_tan', .45)
        for i, dx in enumerate((-4, 0, 4)):
            c.ellipse(bb[0] + dx, bb[1] - 3, 3, 1.8, 'oak', .7 - i * .05)
            c.put(bb[0] + dx - 1, bb[1] - 4, 'oak', .9)
        c.hline(bb[0] - 7, bb[0] + 7, bb[1], 'c_tan', .3)
        ms = P(p, 118, KH, 16)
        c.rect(ms[0] - 2, ms[1] - 4, ms[0] + 2, ms[1], 'white', .65)
        for dx in (-1, 0, 1):
            c.vline(ms[0] + dx, ms[1] - 7, ms[1] - 4, 'chrome', .8)
        for i, X in enumerate((128, 134, 140)):
            bw_ = P(p, X, KH, 20)
            bowl(c, bw_[0], bw_[1])
        al = P(p, 144, KH, 22)
        c.rect(al[0] - 3, al[1] - 6, al[0] + 3, al[1], 'brass', hgrad(al[0] - 3, al[0] + 3, .75, .4))
        c.hline(al[0] - 2, al[0] + 2, al[1] - 6, 'black', .2)
        c.rect(k0[0] + 18, k0[1] + 4, k0[0] + 59, k0[1] + 11, 'paper', .72)           # hand-lettered sign
        c.hline(k0[0] + 18, k0[0] + 59, k0[1] + 4, 'paper', .86)
        C.text(c, k0[0] + 20, k0[1] + 5, 'GOD BLESS', 'c_navy', .42)
    _V['counter'] = (KX0, KX1, KZ0, KZ1, KH)

    # ---- stained glass lancet (day: overcast / dawn: sun behind it) -----------------------------------------
    x0, x1, y0, y1 = WIN
    stone_surround(c, None, x0, x1, y0, y1)
    with lay.base():
        stained_glass(c, bright=0.0, emis=.8)
    stained_glass(alt, bright=.22, emis=1.0)
    _V['glass_snap'] = C.snapshot(c, x0, y0, x1, y1)

    # ---- crucifix + votive light -----------------------------------------------------------------
    CRX = 226
    c.rect(CRX - 1, 14, CRX + 2, 44, 'wood', hgrad(CRX - 1, CRX + 2, .5, .25))
    c.rect(CRX - 8, 21, CRX + 9, 24, 'wood', vgrad(21, 24, .5, .28))
    c.vline(CRX - 1, 14, 44, 'wood', .62)
    c.hline(CRX - 8, CRX + 9, 21, 'wood', .62)
    c.rect(CRX - 1, 23, CRX + 2, 33, 'cream', .78)                                      # corpus
    c.ellipse(CRX + .5, 21.5, 1.3, 1.5, 'cream', .82)
    c.line(CRX - 6, 22, CRX - 1, 24, 'cream', .75)
    c.line(CRX + 7, 22, CRX + 2, 24, 'cream', .75)
    c.vline(CRX, 33, 37, 'cream', .7)
    c.rect(CRX - 4, 15, CRX + 5, 17, 'paper', .7)                                        # INRI plaque
    c.rect(CRX - 5, 48, CRX + 6, 50, 'oak', .55)                                         # little shelf
    c.hline(CRX - 5, CRX + 6, 48, 'oak', .75)
    c.rect(CRX - 1, 44, CRX + 2, 48, 'c_ruby', .6, emis=.8)                              # votive glass
    c.put(CRX, 43, 'lamp', .9, emis=1)
    _V['votive'] = (CRX, 43)

    # ---- the office: interior behind the open door -------------------------------------------------------
    O0, O1, OZ = 236, 258, -26
    ob0 = P(p, O0 - 4, 0, OZ)
    ob1 = P(p, O1 + 4, 0, OZ)
    c.rect(O0, FLOOR - 50, O1, FLOOR, 'c_plaster', .44)                                  # inside, dimmer
    c.rect(ob0[0], FLOOR - 52, ob1[0], ob0[1], 'c_plaster', vgrad(FLOOR - 52, ob0[1], .5, .44))
    c.poly(p.quad([(O0 - 4, 0, OZ), (O1 + 4, 0, OZ), (O1 + 4, 0, 0), (O0 - 4, 0, 0)]), 'oak',
           C.grain_h(.36, .03, .7))                                                      # board floor
    c.poly(p.quad([(O0, 0, 0), (O0, 0, OZ), (O0, 60, OZ), (O0, 60, 0)]), 'c_plaster', .36)  # left inner wall
    # Sister Agnes's desk with the black telephone, a crucifix on the wall above it
    p.box(c, O1 - 10, O1 + 4, 0, 20, -18, -8, 'oak', front=.4, top=.52, side=.3)
    dk0 = P(p, O1 - 3, 20, -14)
    c.rect(dk0[0] + 1, dk0[1] - 2, dk0[0] + 6, dk0[1], 'paper', .78)                      # letters
    ph = P(p, 252, 20, -12)
    F.telephone(c, ph[0], ph[1])
    c.line(ph[0] + 5, ph[1] - 1, ph[0] + 8, ph[1] + 4, 'black', .4)                         # the cord
    _V['phone'] = (ph[0] - 8, ph[1] - 11, ph[0] + 9, ph[1] + 3)
    cx_, cy_ = P(p, 242, 38, OZ)
    c.rect(cx_ - 1, cy_ - 4, cx_ + 1, cy_ + 5, 'wood', .38)
    c.rect(cx_ - 3, cy_ - 2, cx_ + 4, cy_, 'wood', .38)
    c.put(cx_, cy_ - 1, 'cream', .7)
    # the door itself: open inward, against the left inner wall
    c.poly(p.quad([(O0 + 1, 0, -2), (O0 + 1, 0, -18), (O0 + 1, 46, -18), (O0 + 1, 46, -2)]), 'wood', .42)
    c.poly(p.quad([(O0 + 1, 20, -14), (O0 + 1, 20, -16), (O0 + 1, 24, -16), (O0 + 1, 24, -14)]), 'brass', .7)
    # door frame
    c.rect(O0 - 3, FLOOR - 51, O0, FLOOR, 'oak', .4)
    c.rect(O1, FLOOR - 51, O1 + 3, FLOOR, 'oak', .34)
    c.rect(O0 - 3, FLOOR - 54, O1 + 3, FLOOR - 50, 'oak', .5)
    c.hline(O0 - 3, O1 + 3, FLOOR - 54, 'oak', .72)
    c.vline(O0 - 3, FLOOR - 54, FLOOR, 'oak', .58)
    c.rect(O0 - 2, FLOOR - 62, O1 + 2, FLOOR - 55, 'paper', .72)
    c.hline(O0 - 2, O1 + 2, FLOOR - 62, 'paper', .86)
    C.text(c, O0 - 1, FLOOR - 61, 'OFFICE', 'c_navy', .42)
    # notice board
    nb = (262, 38, 280, 62)
    c.rect(nb[0] - 1, nb[1] - 1, nb[2] + 1, nb[3] + 1, 'oak', .5)
    c.rect(nb[0], nb[1], nb[2], nb[3], 'c_cork', C.noisy(.55, W, H, 1.5, .1, seed=4, octaves=1), dith=.8)
    for (x, y, w, h, col) in ((263, 39, 8, 11, 'paper'), (272, 40, 7, 7, 'cream'), (264, 51, 7, 9, 'cream'),
                              (272, 49, 7, 12, 'paper')):
        c.rect(x, y, x + w, y + h, col, .76)
        for ly in range(y + 2, y + h - 1, 2):
            c.hline(x + 1, x + w - 2, ly, 'black', .38)
        c.put(x + w // 2, y, 'red', .7)
    c.rect(272, 41, 279, 43, 'red', .5)                                                   # "LOST" poster header
    _V['notice'] = nb

    # ---- right wall: churchyard door, stoup, bell rope ---------------------------------------------------
    cd = p.quad([(290, 0, 12), (290, 0, 34), (290, 40, 34), (290, 46, 23), (290, 40, 12)])
    c.poly(p.quad([(290, 0, 10), (290, 0, 36), (290, 42, 36), (290, 49, 23), (290, 42, 10)]), 'c_stone', .45)
    c.poly(cd, 'wood', .36)
    for Z in (16, 20, 24, 28, 32):
        a_ = P(p, 290, 0, Z)
        b_ = P(p, 290, 40, Z)
        c.line(a_[0], a_[1], b_[0], b_[1], 'wood', .24)
    w0 = p.quad([(290, 34, 20), (290, 34, 26), (290, 26, 26), (290, 26, 20)])
    with lay.base():
        c.poly(w0, 'fog', .72, emis=.8)
    alt.poly(w0, 'c_chrys', .6, emis=1)
    hn = P(p, 290, 20, 31)
    c.rect(hn[0] - 1, hn[1] - 1, hn[0] + 2, hn[1] + 2, 'black', .5)
    _V['cdoor'] = cd
    # holy-water stoup on the back wall next to the post
    c.ellipse(271, 70, 3, 1.5, 'c_stone', .66)
    c.rect(269, 70, 274, 73, 'c_stone', .5)
    # bell rope with a striped sally, its frayed end looped up out of reach on a cleat
    rx = 283
    c.vline(rx, 0, 46, 'c_tan', .55)
    c.vline(rx + 1, 0, 46, 'c_tan', .32)
    for k, yy in enumerate(range(26, 38, 2)):
        col = ('red', 'paper', 'c_cobalt')[k % 3]
        c.rect(rx - 1, yy, rx + 3, yy + 2, col, .62)
    c.line(rx, 46, rx + 2, 48, 'c_tan', .5)                                            # the loop
    c.line(rx + 2, 48, rx + 4, 46, 'c_tan', .5)
    c.line(rx + 4, 46, rx + 4, 33, 'c_tan', .45)
    c.rect(rx + 3, 31, rx + 7, 33, 'black', .5)                                        # cleat, high up
    c.line(rx + 5, 31, rx + 4, 27, 'c_tan', .45)                                       # frayed tail
    c.put(rx + 3, 26, 'c_tan', .55)
    c.put(rx + 5, 26, 'c_tan', .4)
    _V['rope'] = (rx - 3, 0, rx + 8, 50)

    # ---- tables, benches and the people ----------------------------------------------------------------
    TL = (54, 140, 46, 58)
    TR = (172, 262, 46, 58)
    for (X0, X1, Z0, Z1) in (TL, TR):
        bench(c, p, X0 + 2, X1 - 2, Z0 - 8, Z0 - 3)                                    # far bench
    snap_people = C.snapshot(c, 0, 0, W, H)
    # day diners (far benches, facing us) - removed at dawn
    diners = [(70, 'c_navy', True, .32, 0), (92, 'slate', False, .3, 1), (122, 'c_tan', True, .28, 2),
              (190, 'slate', True, .3, 3), (238, 'c_navy', False, .28, 4)]
    before = lay.painted.copy()
    with lay.base():
        for (X, coat, hat, lum, sd) in diners:
            x_, y_ = P(p, X, 19, 50)
            C.seated_figure(c, x_, y_, k=p.s(42) * .95, ramp_coat=coat, lum=lum, hat=hat, seed=sd,
                            facing=(-1 if sd % 2 else 1))
    m_day = lay.painted & ~before
    # dawn: the hall is empty but for one sleeper slumped over the left table
    ids = np.array([alt.rid_of(n) for n in snap_people['names']] + [-1], np.int32)
    alt.rid[m_day] = ids[snap_people['rid'][m_day]]
    alt.lum[m_day] = snap_people['lum'][m_day]
    alt.emis[m_day] = snap_people['emis'][m_day]
    alt.dith[m_day] = snap_people['dith'][m_day]
    sl_x, sl_y = P(p, 92, 19, 50)
    msl = C.mask_of(c, lambda t: sleeper_slumped(t, sl_x, sl_y, k=p.s(46)))
    with lay.base():
        C.restore(c, snap_people, mask=msl & ~m_day)                                    # mark, unchanged
    sleeper_slumped(alt, sl_x, sl_y, k=p.s(46))
    # tables
    for (X0, X1, Z0, Z1), nm in ((TL, 'table_l'), (TR, 'table_r')):
        with sc.obj(nm, baseline=by(Z1) + 1):
            trestle_table(c, p, X0, X1, Z0, Z1)
            for X in range(int(X0) + 10, int(X1) - 6, 18):
                b_ = P(p, X, 19, Z0 + 4)
                bowl(c, b_[0], b_[1])
            if nm == 'table_r':
                kb = P(p, 214, 19, Z0 + 4)                                              # Kerrigan's place
                bowl(c, kb[0], kb[1])
                cup = P(p, 222, 19, Z0 + 5)
                c.rect(cup[0], cup[1] - 3, cup[0] + 3, cup[1], 'steel', .6)
            else:
                lf = P(p, 104, 19, 52)
                c.ellipse(lf[0], lf[1] - 1, 4, 1.6, 'oak', .7)                          # heel of bread
    # near benches (occluders too, so walkers behind them are cut correctly)
    for (X0, X1, Z0, Z1), nm in ((TL, 'bench_l'), (TR, 'bench_r')):
        with sc.obj(nm, baseline=by(Z1 + 8) + 1):
            bench(c, p, X0 + 2, X1 - 2, Z1 + 3, Z1 + 8)
    # a day diner on the near bench, his back to us
    snap2 = C.snapshot(c, 0, 0, W, H)
    nx_, ny_ = P(p, 108, 11, 63)
    before = lay.painted.copy()
    with lay.base():
        diner_back(c, nx_, ny_, k=p.s(63), coat='c_tan', lum=.3, hat=True)
    m2 = lay.painted & ~before
    ids2 = np.array([alt.rid_of(n) for n in snap2['names']] + [-1], np.int32)
    alt.rid[m2] = ids2[snap2['rid'][m2]]
    alt.lum[m2] = snap2['lum'][m2]
    alt.emis[m2] = snap2['emis'][m2]
    alt.dith[m2] = snap2['dith'][m2]
    # dawn: a man asleep along the near bench of the right table, under his coat
    s0 = P(p, 200, 11, 64)
    s1 = P(p, 236, 11, 64)
    msl2 = C.mask_of(c, lambda t: sleeper_lying(t, s0[0], s1[0], s0[1]))
    with lay.base():
        C.restore(c, snap2, mask=msl2 & ~lay.painted)
    sleeper_lying(alt, s0[0], s1[0], s0[1])

    # ---- hanging lamps over the tables (on by day, off at dawn) ---------------------------------------
    LAMPS = [(106, 76, 52), (250, 76, 52)]
    lamp_px = []
    for (X, Y, Z) in LAMPS:
        x_, y_ = P(p, X, Y, Z)
        lamp_px.append((x_, y_))
        with lay.base():
            C.pendant_lamp(c, x_, y_, w=13, on=True, shade='white', lum=.55)
        C.pendant_lamp(alt, x_, y_, w=13, on=False, shade='white', lum=.4)

    # ---- coloured light from the lancet falling on the flagstones ------------------------------------
    floor_rid = c.ids['concrete']
    gs = _V['glass_snap']
    gx0, gy0, gx1, gy1 = gs['r']

    def projection(slope, skew, gain, emis):
        """Floor pixels lit through the window: returns (mask, ramp-index map, lum)."""
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        s = np.maximum((yy + .5 - hy) / E, 1e-3)
        X = cx + (xx + .5 - cx) / s
        Z = D * (1 - 1 / s)
        Yw = Z * slope
        Xw = X - Z * skew
        sx = (np.floor(Xw / 3) * 3 + 1).astype(int)                 # blotchy: the sun's disc blurs
        sy = (np.floor((FLOOR - Yw) / 4) * 4 + 2).astype(int)
        ok = (c.rid == floor_rid) & (yy > FLOOR) & (sx >= gx0) & (sx < gx1) & (sy >= gy0) & (sy < gy1)
        rmap = np.full((H, W), -1, np.int32)
        lmap = np.zeros((H, W), np.float32)
        ii = np.nonzero(ok)
        gr = gs['rid'][sy[ii] - gy0, sx[ii] - gx0]
        gl = gs['lum'][sy[ii] - gy0, sx[ii] - gx0]
        good = gr >= 0
        names = gs['names']
        glass_names = {'c_cobalt', 'c_ruby', 'c_amber', 'c_emerald', 'paper'}
        keep = np.array([good[k] and names[gr[k]] in glass_names for k in range(len(gr))], bool)
        m = np.zeros((H, W), bool)
        m[ii[0][keep], ii[1][keep]] = True
        rmap[ii[0][keep], ii[1][keep]] = gr[keep]
        lmap[ii[0][keep], ii[1][keep]] = gl[keep]
        return m, rmap, lmap

    m_d, r_d, l_d = projection(1.15, .12, .5, .3)
    m_a, r_a, l_a = projection(.5, -.28, .7, .5)
    base_floor = C.snapshot(c, 0, 0, W, H)
    names = gs['names']

    def soften(m, r=2):
        """Box-blurred coverage of a mask (0..1)."""
        f = m.astype(np.float32)
        for _ in range(2):
            g = np.zeros_like(f)
            n = 0
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    g += np.roll(np.roll(f, dy, 0), dx, 1)
                    n += 1
            f = g / n
        return f
    bay = np.tile(C.BAYER4, (H // 4 + 1, W // 4 + 1))[:H, :W]

    def paint_patch(cc, m, rmap, lmap, dens, base_k, add, emis):
        cov = soften(m) * dens
        on = m & (bay < cov)
        for gi in np.unique(rmap[on]):
            mm = on & (rmap == gi)
            nm = names[gi]
            if nm == 'paper':
                nm = 'c_amber'
            L = np.clip(c.lum * base_k + lmap * .25 + add, 0, 1)
            C.set_pixels(cc, mm, nm, L, emis=emis, dith=.3)
    with lay.base():
        both = m_d | m_a
        C.restore(c, base_floor, mask=both)                                              # mark all, unchanged
        paint_patch(c, m_d, r_d, l_d, .5, .55, .14, .12)
    # dawn: plain floor where the day patch was, a long blazing patch elsewhere
    ids_f = np.array([alt.rid_of(n) for n in base_floor['names']] + [-1], np.int32)
    alt.rid[both] = ids_f[base_floor['rid'][both]]
    alt.lum[both] = base_floor['lum'][both]
    alt.emis[both] = base_floor['emis'][both]
    alt.dith[both] = base_floor['dith'][both]
    paint_patch(alt, m_a, r_a, l_a, .9, .3, .55, .6)
    # dawn light beam through the dusty air: a sparse ordered dither of gold, densest at the glass
    ys_, xs_ = np.nonzero(m_a)
    if len(xs_):
        beam = [(WIN[0] + 2, WIN[3] - 2), (WIN[0] + 2, WIN[2] + 14), (WIN[1] - 2, WIN[2] + 14),
                (WIN[1] - 2, WIN[3] - 2), (int(xs_.max()) - 4, int(ys_.min()) + 4), (int(xs_.min()) + 6, int(ys_.max()))]
        _V['beam'] = beam
        bm, br = c.poly_mask(beam)
        full = np.zeros((H, W), bool)
        full[br[1]:br[3], br[0]:br[2]] = bm
        gl_m = np.zeros((H, W), bool)
        gm, gr_ = c.poly_mask(lancet_mask(*WIN))
        gl_m[gr_[1]:gr_[3], gr_[0]:gr_[2]] = gm
        yy_, xx_ = np.mgrid[0:H, 0:W]
        dens = np.clip(.09 - (yy_ - WIN[3]) / 900.0, .03, .09)
        dust = full & ~gl_m & (bay < dens) & ~both & (c.emis < .5)
        with lay.base():
            C.restore(c, base_floor, mask=dust)
        ids_d = np.array([alt.rid_of(n) for n in base_floor['names']] + [-1], np.int32)
        alt.rid[dust] = alt.rid_of('c_chrys')
        alt.lum[dust] = .66
        alt.emis[dust] = .35
        alt.dith[dust] = 0

    # ---- lighting ------------------------------------------------------------------------------------
    lay.finalize()
    for (X0, X1, Z0, Z1) in (TL, TR):
        c.shadow_poly(p.quad([(X0, 0, Z0 - 8), (X1, 0, Z0 - 8), (X1 + 3, 0, Z1 + 9), (X0, 0, Z1 + 9)]), .32)
    c.shadow_poly(p.quad([(KX0, 0, KZ0 - 1), (KX1, 0, KZ0 - 1), (KX1 + 2, 0, KZ1 + 4), (KX0, 0, KZ1 + 4)]), .4)
    c.shadow_poly(p.quad([(SX0, 0, 0), (SX1, 0, 0), (SX1 + 2, 0, SZ1 + 3), (SX0, 0, SZ1 + 3)]), .35)
    base_shade = c.shade.copy()
    xx = np.arange(W)[None, :].astype(np.float32)
    yy = np.arange(H)[:, None].astype(np.float32)
    topd = np.clip(.8 + yy / 180, .8, 1)
    fbx, fby = _V['firebox']
    day_lights = [Light(203, 36, 130, .35, falloff=1.2),
                  Light(fbx, fby, 70, .55, falloff=1.4), Light(fbx, fby + 26, 50, .3, ystretch=2.2)]
    for (x_, y_) in lamp_px:
        day_lights.append(Light(x_, y_ + 4, 80, .55, falloff=1.4, cone=(90, 60)))
        day_lights.append(Light(x_, y_ + 52, 40, .25, ystretch=2.4))
    day_lights += [Light(99, 18, 60, .2), Light(129, 18, 60, .2), Light(52, 88, 30, .25, ystretch=2.5)]
    c.lights = day_lights
    c.ambient = .46
    vd = np.clip(1.2 - np.abs(xx - 165) / 260.0, .7, 1)
    c.shade = (base_shade * vd * topd).astype(np.float32)
    c.glows = [(203, 34, 34, (120, 150, 255), .22), (fbx, fby, 18, (255, 140, 60), .45),
               (_V['votive'][0], _V['votive'][1], 6, (255, 120, 80), .4)] + \
              [(x_, y_ + 2, 18, (255, 225, 170), .35) for (x_, y_) in lamp_px]
    _V['day'] = dict(lights=day_lights, ambient=.46, shade=c.shade.copy(), glows=list(c.glows))
    dawn_lights = [Light(203, 40, 150, .55, falloff=1.1),
                   Light(185, 130, 90, .45, ystretch=1.6),
                   Light(fbx, fby, 50, .45, falloff=1.4), Light(99, 18, 50, .25), Light(129, 18, 50, .25)]
    vda = np.clip(1.25 - np.abs(xx - 185) / 230.0, .55, 1)
    ex = np.zeros((H, W), np.float32)
    if 'beam' in _V:
        tmp = C.Canvas(W, H)
        tmp.light_poly(_V['beam'], .14)
        ex = tmp.extra
    _V['dawn'] = dict(extra=ex, lights=dawn_lights, ambient=.3, shade=(base_shade * vda * topd).astype(np.float32),
                      glows=[(203, 36, 46, (255, 170, 120), .5), (fbx, fby, 12, (255, 100, 40), .4),
                             (_V['votive'][0], _V['votive'][1], 7, (255, 120, 80), .45),
                             (99, 17, 14, (255, 180, 120), .35), (129, 17, 14, (255, 180, 120), .35)])
    _V['lay'] = lay

    # ---- anims: steam from the cauldron, the fire, the votive flame -----------------------------------
    px_, py_ = _V['pot']

    def steam(k):
        def f(cc):
            for j in range(3):
                for i in range(12):
                    t = (i + k * 2 + j * 4) % 12
                    yy_ = py_ - t * 2
                    xx_ = px_ - 5 + j * 5 + int(round(math.sin((t + j * 2) * .55 + k * .8) * (1 + t * .25)))
                    if (t + j) % 3 != 2:
                        cc.put(xx_, yy_, 'c_steam', .82 - t * .045)
                        if t > 4 and (t + k) % 2 == 0:
                            cc.put(xx_ + 1, yy_, 'c_steam', .7 - t * .04)
        return f
    sc.anim('steam', [steam(k) for k in range(6)], fps=6)

    def fire(k):
        def f(cc):
            dawn_ = getattr(cc, '_variant', '') == 'dawn'
            for i, X in enumerate(range(fb0[0] + 2, fb0[0] + 11, 2)):
                h_ = (2 + (i * 5 + k) % 3) if dawn_ else (3 + (i * 7 + k * 3) % 4)
                cc.vline(X, fb0[1] + 7 - h_, fb0[1] + 7, 'c_ember', (.45 if dawn_ else .7) + ((i + k) % 3) * .1, emis=1)
        return f
    sc.anim('fire', [fire(k) for k in range(4)], fps=8)

    vx, vy = _V['votive']

    def flame(k):
        def f(cc):
            cc.put(vx, vy - (k % 2), 'lamp', .95, emis=1)
            if k in (1, 2):
                cc.put(vx + (1 if k == 1 else 0), vy - 2, 'lamp', .8, emis=1)
        return f
    sc.anim('votive', [flame(k) for k in range(4)], fps=5)

    # ---- interaction ------------------------------------------------------------------------------------
    sc.hotspot('exit_street', poly=C.ipoly(outer), walk=(52, by(10)), face='up')
    cdq = _V['cdoor']
    sc.hotspot('exit_cemetery', poly=[(int(x), int(y)) for x, y in cdq], walk=(bx(284, 26), by(26)), face='right')
    sf = P(p, SX0, 40, SZ0)
    sf2 = P(p, SX1, 0, SZ1)
    sc.hotspot('stove', rect=(sf[0], py_ - 6, sf2[0] + 1, sf2[1]), walk=(bx(166, 30), by(30)), face='up')
    k0 = P(p, KX0, KH + 8, KZ0)
    k1 = P(p, KX1, 0, KZ1)
    sc.hotspot('counter', rect=(k0[0], k0[1], k1[0], k1[1]), walk=(bx(112, 32), by(32)), face='up')
    t0 = P(p, TR[0], 30, TR[2])
    t1 = P(p, TR[1], 0, TR[3] + 8)
    l0 = P(p, TL[0], 30, TL[2])
    l1 = P(p, TL[1], 0, TL[3] + 8)
    sc.hotspot('tables', poly=[(l0[0], l0[1]), (t1[0], t0[1]), (t1[0], t1[1]), (l0[0], l1[1])],
               walk=(bx(156, 74), by(74)), face='up')
    sc.hotspot('window', poly=[(int(x), int(y)) for x, y in lancet_mask(*WIN)], walk=(bx(203, 30), by(30)), face='up')
    sc.hotspot('notice_board', rect=(nb[0] - 1, nb[1] - 1, nb[2] + 1, nb[3] + 1), walk=(bx(273, 26), by(26)), face='up')
    sc.hotspot('office_phone', rect=_V['phone'], walk=(bx(247, -6), by(-6)), face='up')
    sc.hotspot('office_door', rect=(O0 - 3, FLOOR - 62, O1 + 3, FLOOR), walk=(bx(247, 8), by(8)), face='up')
    sc.hotspot('crucifix', rect=(CRX - 9, 13, CRX + 10, 51), walk=(bx(226, 28), by(28)), face='up')
    sc.hotspot('bell_rope', rect=_V['rope'], walk=(bx(272, 22), by(22)), face='up')
    # walkable: hall floor + the office doorway, minus counter, stove, tables, crate
    def wall_hit(X):
        edge = 0 if X < 160 else W
        s_ = (edge - 160) / (X - 160)
        return p.D * (1 - 1 / s_)
    zl, zr = wall_hit(32), wall_hit(288)
    floor = [P(p, 32, 0, 3), P(p, O0 + 1, 0, 3), P(p, O0 + 1, 0, -10), P(p, O1 - 1, 0, -10), P(p, O1 - 1, 0, 3),
             P(p, 288, 0, 3), P(p, 288, 0, zr), (W, H), (0, H), P(p, 32, 0, zl)]
    holes = [[P(p, KX0 - 2, 0, 3), P(p, SX1 + 6, 0, 3), P(p, SX1 + 6, 0, KZ1 + 4), P(p, KX0 - 2, 0, KZ1 + 4)],
             [P(p, 64, 0, 3), P(p, 84, 0, 3), P(p, 84, 0, 16), P(p, 64, 0, 16)]]
    for (X0, X1, Z0, Z1) in (TL, TR):
        holes.append([P(p, X0 - 1, 0, Z0 - 10), P(p, X1 + 1, 0, Z0 - 10), P(p, X1 + 1, 0, Z1 + 10), P(p, X0 - 1, 0, Z1 + 10)])
    sc.walkable(floor, holes=holes)
    sc.point('start', 58, by(30), 'right')
    sc.point('from_map', 58, by(30), 'right')
    sc.point('from_cemetery', bx(278, 28), by(28), 'left')
    sc.point('agnes_spot', bx(232, 22), by(22), 'down')
    sc.point('volunteer_spot', bx(112, 6), by(6), 'down')
    sc.point('kerrigan_spot', bx(214, 41), by(41), 'down')
    sc.point('phone_spot', bx(247, -6), by(-6), 'up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, round(p.char_scale(FLOOR, 140), 3), 140, 1.0)
    sc.meta['floor'] = 'stone'
    sc.rain(WIN[0] + 2, WIN[2] + 4, WIN[1] - 2, WIN[3] - 2, density=.6, kind='window')
    C.order_hotspots(sc, ['office_phone', 'crucifix', 'office_door', 'notice_board', 'bell_rope', 'window', 'stove',
                          'counter', 'tables'])
    C.check(sc, npc=('volunteer_spot', 'kerrigan_spot'))
    return sc


def _apply(c, key):
    v = _V[key]
    if 'extra' in v:
        c.extra = v['extra'].copy()
    c.lights = [Light(L.x, L.y, L.r, L.i, falloff=L.falloff, cone=L.cone, ystretch=L.ystretch) for L in v['lights']]
    c.ambient = v['ambient']
    c.shade = v['shade'].copy()
    c.glows = list(v['glows'])


def dawn(c):
    _apply(c, 'dawn')
    _V['lay'].apply(c, 'dawn')
    return None


VARIANTS = {'day': lambda c: None, 'dawn': dawn}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
