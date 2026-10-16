"""Gazette darkroom (Ch3). Base = red safelight (render remap 'safelight'), variant 'white'.

The far-right corner (wall timer + red grease-pencil writing) sits in deep shadow in the red
render and the writing is a state object whose base sprite is re-painted as plain wall (red
writing vanishes under red light).  In 'white' the corner is lit and the writing is red on
cream plaster.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import Light, vgrad, hgrad, radial, noise2
from persp import Persp
import props_c as C

W, H = 320, 144
FLOOR = 98
_V = {}
WRITING = ["ANISE = LETHE.", "THE 'SISTER'", "BROUGHT THE", "COFFEE.", "THERE IS", "NO SISTER."]


def P(p, X, Y, Z):
    x, y = p.P(X, Y, Z)
    return int(round(x)), int(round(y))


# ----------------------------------------------------------------------------- props ----
def bottle(c, x, y, label, lum=.5, w=10, h=19, cap='black'):
    """Brown gallon jug standing on a shelf, (x, y) = bottom-left."""
    c.rect(x + 1, y - h + 4, x + w - 1, y, 'c_amberglass', hgrad(x, x + w, lum + .15, lum - .15))
    c.rect(x, y - h + 6, x + w, y - 1, 'c_amberglass', hgrad(x, x + w, lum + .18, lum - .18))
    c.poly([(x + 1, y - h + 6), (x + w - 1, y - h + 6), (x + w - 3, y - h + 3), (x + 3, y - h + 3)],
           'c_amberglass', lum + .05)
    c.rect(x + 3, y - h, x + w - 3, y - h + 3, cap, .35)
    c.hline(x + 3, x + w - 3, y - h, cap, .6)
    c.vline(x + 1, y - h + 7, y - 2, 'c_amberglass', lum + .42)       # highlight
    # loop handle at the shoulder
    c.put(x + w - 2, y - h + 5, 'c_amberglass', lum - .2)
    c.put(x + w - 1, y - h + 6, 'c_amberglass', lum - .2)
    # paper label with lettering
    lw = C.text_w(label)
    lx0 = x + (w - lw) // 2 - 1
    c.rect(lx0, y - 12, lx0 + lw + 2, y - 4, 'paper', .86)
    c.hline(lx0, lx0 + lw + 2, y - 12, 'paper', .95)
    C.text(c, lx0 + 1, y - 11, label, 'black', .02)
    c.hline(lx0, lx0 + lw + 2, y - 5, 'paper', .7)


def tray(c, x0, y0, x1, y1, liquid, liq_lum):
    """Enamel developing tray seen from above, inside the sink."""
    c.rect(x0, y0, x1, y1, 'white', .7)
    c.hline(x0, x1, y0, 'white', .9)
    c.vline(x0, y0, y1, 'white', .8)
    c.hline(x0, x1, y1 - 1, 'white', .45)
    c.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, liquid, vgrad(y0, y1, liq_lum + .12, liq_lum - .05), dith=.3)
    c.hline(x0 + 2, x1 - 3, y0 + 2, liquid, liq_lum + .3)       # meniscus glint
    c.put(x0, (y0 + y1) // 2, 'white', .4)                       # pouring lip


def padlock(c, x, y, lum=.7):
    """Brass padlock hanging from the staple. (x, y) = top of the shackle."""
    c.rect(x - 3, y, x - 1, y + 5, 'steel', .85)
    c.rect(x + 2, y, x + 4, y + 5, 'steel', .65)
    c.hline(x - 2, x + 3, y - 1, 'steel', .95)
    c.rect(x - 5, y + 5, x + 6, y + 14, 'brass', hgrad(x - 5, x + 6, lum + .28, lum - .22))
    c.hline(x - 5, x + 6, y + 5, 'brass', 1.0)
    c.vline(x - 5, y + 5, y + 14, 'brass', lum + .3)
    c.rect(x - 1, y + 8, x + 2, y + 10, 'black', .0)
    c.put(x, y + 11, 'black', .0)
    c.hline(x - 4, x + 6, y + 14, 'brass', lum - .4)


def timer_clock(c, x, y, opened=False):
    """Darkroom wall timer: black square case, white face 0-60. (x, y) = top-left, 18 px."""
    s = 18
    if not opened:
        c.rect(x, y, x + s, y + s, 'black', .3)
        c.hline(x, x + s, y, 'black', .6)
        c.vline(x, y, y + s, 'black', .5)
        c.rect(x + 1, y + s, x + s + 1, y + s + 1, 'black', .1)
        cx, cy = x + s / 2, y + s / 2
        c.ellipse(cx, cy, 7, 7, 'paper', radial(cx - 2, cy - 2, 10, .9, .7))
        for k in range(12):
            a = math.radians(k * 30)
            c.put(int(cx + math.sin(a) * 5.6 - .5), int(cy - math.cos(a) * 5.6 - .5), 'black', .1 if k % 3 else .0)
        c.line(cx - .5, cy - .5, cx + 3, cy - 3, 'black', .05)        # hands
        c.line(cx - .5, cy - .5, cx - .5, cy - 5, 'red', .7)          # red sweep hand
        c.put(int(cx - .5), int(cy - .5), 'brass', .9)
        c.rect(x + 2, y + s - 3, x + 5, y + s - 1, 'chrome', .6)      # knob
        c.put(x + s - 3, y + 2, 'chrome', .7)                         # screw
        c.put(x + 2, y + 2, 'chrome', .7)
        # flex cable down the wall
        c.vline(x + s - 4, y + s + 1, y + s + 6, 'black', .4)
    else:
        # front bezel + face swung open on its left hinge: clockwork and an empty key clip inside
        c.rect(x, y, x + s, y + s, 'black', .3)
        c.hline(x, x + s, y, 'black', .6)
        c.rect(x + 2, y + 2, x + s - 2, y + s - 2, 'c_iron', .25)
        for gx, gy, r in ((x + 6, y + 6, 2.6), (x + 11, y + 9, 3.2), (x + 6, y + 13, 1.8)):
            c.ellipse(gx, gy, r, r, 'brass', .62)
            c.ellipse(gx, gy, r * .45, r * .45, 'brass', .3)
            c.put(int(gx - r * .6), int(gy - r * .6), 'brass', .95)
        # the spring clip where the key was held - now empty
        c.rect(x + 12, y + 13, x + 16, y + 15, 'steel', .7)
        c.put(x + 15, y + 12, 'steel', .85)
        # the swung-open face, seen almost edge-on, hanging off the left hinge
        c.ellipse(x - 4, y + s / 2, 3.2, 8.5, 'paper', hgrad(x - 7, x - 1, .5, .82))
        c.ellipse(x - 3.5, y + s / 2, 1.6, 7.6, 'paper', .9)
        c.vline(x - 1, y + 3, y + s - 3, 'black', .45)
        c.put(x - 1, y + 4, 'chrome', .8)
        c.put(x - 1, y + s - 5, 'chrome', .8)
        c.vline(x + s - 4, y + s + 1, y + s + 6, 'black', .4)


def stool(c, p, X, Z, lum=.48):
    """Three-legged wooden lab stool, seat 14 high."""
    sx, sy = P(p, X, 14, Z)
    fx, fy = P(p, X, 0, Z)
    k = p.s(Z)
    r = 6 * k
    for dx, dz, l in ((-5, -3, lum - .2), (5, -3, lum - .22), (0, 4, lum - .05)):
        a = P(p, X + dx * .6, 13, Z + dz * .5)
        b = P(p, X + dx, 0, Z + dz)
        c.line(a[0], a[1], b[0], b[1], 'oak', l)
        c.line(a[0] + 1, a[1], b[0] + 1, b[1], 'oak', l - .08)
    a = P(p, X - 4, 6, Z + 1)
    b = P(p, X + 4, 6, Z + 1)
    c.hline(a[0], b[0], a[1], 'oak', lum - .15)
    c.ellipse(sx, sy + 1, r, 2.4 * k, 'oak', lum - .18)
    c.ellipse(sx, sy, r, 2.2 * k, 'oak', radial(sx - 2, sy - 1, r * 1.3, lum + .22, lum - .02))
    return (sx, sy, fx, fy)


# ----------------------------------------------------------------------------- build ----
def build():
    sc = C.SceneC('darkroom', W, H, seed=31)
    c = sc.c
    p = Persp(24, 296, 0, FLOOR, horizon=-56, depth=380)
    zf = p.z_at_floor_y(H + 2)
    lay = C.Layer(c)
    alt = lay.alt('white')
    by = lambda Z: int(round(p.P(0, 0, Z)[1]))
    bx = lambda X, Z: int(round(p.P(X, 0, Z)[0]))

    # ---- shell ---------------------------------------------------------------------------
    WALL = 'c_plaster'
    wall_fn = C.noisy(vgrad(0, FLOOR, .66, .72), W, H, 7, .04, seed=4)
    c.rect(24, 0, 296, FLOOR, WALL, wall_fn)
    # chemical splash marks / grime low on the wall
    c.modulate(24, FLOOR - 30, 296, FLOOR, lambda xx, yy: 1 - .08 * np.clip((yy - (FLOOR - 30)) / 30, 0, 1))
    lw = p.quad([(24, 0, 0), (24, 0, zf), (24, 200, zf), (24, 200, 0)])
    c.poly(lw, WALL, .56)
    rw = p.quad([(296, 0, 0), (296, 0, zf), (296, 200, zf), (296, 200, 0)])
    c.poly(rw, WALL, .5)
    # matte-black panel behind the enlarger (painted to kill reflections)
    c.rect(190, 8, 240, FLOOR, 'slate', C.noisy(.36, W, H, 5, .03, seed=6))
    c.hline(190, 240, 8, 'slate', .5)
    c.vline(190, 8, FLOOR, 'slate', .46)
    # light-tight ventilation louvre high on the wall
    c.rect(28, 10, 54, 22, 'slate', .4)
    c.hline(28, 54, 10, 'slate', .62)
    for yy_ in range(12, 21, 2):
        c.hline(30, 52, yy_, 'black', .25)
        c.hline(30, 52, yy_ + 1, 'slate', .52)
    c.vline(54, 10, 22, 'slate', .2)
    # water pipe from the ceiling to the sink, and on to the corner
    c.rect(104, 0, 106, FLOOR - 40, 'steel', hgrad(104, 106, .62, .35))
    c.rect(104, FLOOR - 42, 112, FLOOR - 40, 'steel', .5)
    for yy_ in (14, 40):
        c.rect(103, yy_, 107, yy_ + 2, 'steel', .3)
    # skirting
    c.rect(24, FLOOR - 4, 296, FLOOR, 'slate', .3)
    c.hline(24, 296, FLOOR - 4, 'slate', .45)
    for X in (24, 296):
        c.poly(p.quad([(X, 0, 0), (X, 0, zf), (X, 4, zf), (X, 4, 0)]), 'slate', .28)
    # concrete floor with a drain and stains
    fl = p.quad([(24, 0, 0), (296, 0, 0), (296, 0, zf), (24, 0, zf)])
    N = noise2(W, H, 10, 9, 3)

    def floorfn(xx, yy):
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        X = p.cx + (xx - p.cx) / s
        Z = p.D * (1 - 1 / s)
        L = .56 + (N[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)] - .5) * .18
        # expansion joints
        L = np.where((np.abs(((X - 24) % 68)) < .9 / s) | (np.abs(Z % 45) < .8), L - .14, L)
        return L
    c.poly(fl, 'concrete', floorfn)
    dx_, dy_ = P(p, 150, 0, 46)
    c.ellipse(dx_, dy_, 5, 1.8, 'black', .3)
    for k in range(-3, 4, 2):
        c.vline(dx_ + k, dy_ - 1, dy_ + 2, 'steel', .5)
    c.ellipse(dx_ + 9, dy_ - 2, 9, 2.2, 'concrete', .36)         # old fixer stain
    # rubber mat in front of the sink
    mat = p.quad([(110, 0, 21), (188, 0, 21), (188, 0, 34), (110, 0, 34)])
    c.poly(mat, 'black', .35)
    for Z in range(23, 34, 3):
        a = P(p, 111, .1, Z)
        b = P(p, 187, .1, Z)
        c.hline(a[0], b[0], a[1], 'black', .48)

    # ---- the door with the hasp (left) -------------------------------------------------------------
    D0, D1 = 27, 51
    dtop = FLOOR - 46
    c.rect(D0 - 3, dtop - 3, D1 + 3, FLOOR, 'wood', .36)
    c.hline(D0 - 3, D1 + 3, dtop - 3, 'wood', .66)
    c.vline(D0 - 3, dtop - 3, FLOOR, 'wood', .55)
    c.rect(D0, dtop, D1, FLOOR, 'c_jade', C.grain_v(.4, .02, 1.1))
    for (a, b) in ((dtop + 3, dtop + 20), (dtop + 23, FLOOR - 4)):
        c.rect(D0 + 3, a, D1 - 3, b, 'c_jade', .34)
        c.hline(D0 + 3, D1 - 3, a, 'c_jade', .22)
        c.vline(D0 + 3, a, b, 'c_jade', .26)
        c.hline(D0 + 3, D1 - 3, b - 1, 'c_jade', .52)
        c.vline(D1 - 4, a, b, 'c_jade', .5)
    # black light-trap felt strip around the frame
    c.vline(D1, dtop, FLOOR, 'black', .2)
    c.hline(D0, D1, FLOOR - 1, 'black', .2)
    # knob + keyhole
    c.rect(D1 - 6, dtop + 24, D1 - 3, dtop + 27, 'brass', .6)
    c.put(D1 - 5, dtop + 24, 'brass', .95)
    # hasp on the inside: plate on the door + staple on the frame
    hy = dtop + 15
    c.rect(D1 - 9, hy - 1, D1 + 1, hy + 2, 'steel', .55)
    c.hline(D1 - 9, D1 + 1, hy - 1, 'steel', .8)
    for k in (D1 - 8, D1 - 5):
        c.put(k, hy, 'steel', .3)
    c.rect(D1 + 1, hy - 2, D1 + 4, hy + 3, 'steel', .5)
    c.rect(D1 + 2, hy - 1, D1 + 3, hy + 2, 'black', .1)
    _V['hasp'] = (D1 + 2, hy + 1)
    # Rook's hat dropped where he slumped
    hx, hy2 = P(p, 47, 0, 14)
    c.ellipse(hx, hy2 - 1, 7, 2.2, 'slate', .4)
    c.poly([(hx - 4, hy2 - 1), (hx - 3, hy2 - 6), (hx + 3, hy2 - 7), (hx + 4, hy2 - 1)], 'slate', .48)
    c.hline(hx - 4, hx + 5, hy2 - 2, 'black', .3)
    c.hline(hx - 2, hx + 3, hy2 - 6, 'slate', .66)

    # ---- small wall safelight, the switch and its note ----------------------------------------------
    sx0 = 62
    c.rect(sx0, 42, sx0 + 11, 50, 'black', .35)
    c.hline(sx0, sx0 + 11, 42, 'black', .6)
    c.rect(sx0 + 1, 47, sx0 + 10, 50, 'c_ruby', .85, emis=1)
    c.hline(sx0 + 1, sx0 + 10, 49, 'c_ruby', 1.0, emis=1)
    c.vline(sx0 + 5, 30, 42, 'black', .4)
    # bakelite switch with a strip of tape across it: NOT YET, in Rook's hand
    c.rect(63, 64, 72, 80, 'cream', .62)
    c.hline(63, 72, 64, 'cream', .8)
    c.vline(63, 64, 80, 'cream', .72)
    c.rect(66, 66, 69, 78, 'black', .2)
    c.poly([(59, 67), (75, 66), (75, 78), (59, 79)], 'paper', C.noisy(.85, W, H, 1, .04, seed=2, octaves=1))
    c.line(59, 67, 75, 66, 'paper', .97)
    c.line(59, 79, 75, 78, 'paper', .6)
    c.put(59, 68, 'paper', .5)                                                          # torn ends
    c.put(75, 77, 'paper', .5)
    C.text(c, 62, 68, 'NOT', 'black', .04)
    C.text(c, 62, 74, 'YET', 'black', .04)
    c.vline(67, 80, FLOOR - 4, 'slate', .35)            # conduit

    # ---- open cupboard: changing bag + box of photo paper -----------------------------------------
    CX0, CX1, CZ = 76, 104, 12
    p.box(c, CX0, CX1, 0, 56, 0, CZ, 'wood', front=.44, top=.6, side=.32)
    fx0, fy0, fx1, fy1 = [int(round(v)) for v in p.front_rect(CX0, CX1, 0, 56, CZ)]
    c.rect(fx0 + 2, fy0 + 2, fx1 - 2, fy1 - 6, 'black', .22)         # interior
    c.vline(fx0 + 2, fy0 + 2, fy1 - 6, 'wood', .25)
    shelves = [fy0 + 16, fy0 + 32, fy1 - 6]
    for sy in shelves:
        c.rect(fx0 + 2, sy - 1, fx1 - 2, sy + 1, 'wood', .55)
        c.hline(fx0 + 2, fx1 - 2, sy - 1, 'wood', .75)
    c.rect(fx0, fy1 - 6, fx1, fy1, 'wood', .38)
    c.hline(fx0, fx1, fy1 - 6, 'wood', .55)
    # top shelf: photo paper box (yellow) + a second box
    pb = (fx0 + 3, shelves[0] - 9, fx1 - 4, shelves[0] - 1)
    c.rect(pb[0], pb[1], pb[2], pb[3], 'c_amber', vgrad(pb[1], pb[3], .9, .74))
    c.hline(pb[0], pb[2], pb[1], 'c_amber', 1.0)
    c.vline(pb[2] - 1, pb[1], pb[3], 'c_amber', .55)
    C.text(c, pb[0] + 1, pb[1] + 2, 'PAPER', 'black', .02)
    c.hline(pb[0] + 1, pb[2] - 2, pb[3] - 1, 'red', .5)
    _V['paper_box'] = pb
    c.rect(fx0 + 3, pb[1] - 4, fx1 - 6, pb[1], 'paper', .6)          # older box on top
    c.hline(fx0 + 3, fx1 - 6, pb[1] - 4, 'paper', .75)
    # middle shelf: changing bag (black cloth with sleeves) draped
    cb = (fx0 + 2, shelves[1] - 11, fx1 - 2, shelves[1] + 6)
    c.poly([(cb[0] + 2, shelves[1] - 1), (cb[0] + 4, shelves[1] - 9), (cb[2] - 6, shelves[1] - 10),
            (cb[2] - 2, shelves[1] - 4), (cb[2] - 1, shelves[1] - 1)], 'slate', vgrad(shelves[1] - 10, shelves[1], .42, .28))
    for k in range(cb[0] + 5, cb[2] - 4, 3):
        c.line(k, shelves[1] - 8, k - 1, shelves[1] - 2, 'slate', .52)
    # a sleeve hangs over the shelf edge with its elastic cuff
    c.poly([(cb[2] - 9, shelves[1]), (cb[2] - 4, shelves[1]), (cb[2] - 4, shelves[1] + 6), (cb[2] - 8, shelves[1] + 7)],
           'slate', .38)
    c.hline(cb[2] - 8, cb[2] - 4, shelves[1] + 6, 'slate', .62)
    _V['bag'] = (cb[0], shelves[1] - 11, cb[2], shelves[1] + 8)
    # bottom shelf: graduates, funnels, film canisters
    c.rect(fx0 + 3, shelves[2] - 8, fx0 + 7, shelves[2] - 1, 'glass', .55, emis=.1)
    c.hline(fx0 + 3, fx0 + 7, shelves[2] - 8, 'glass', .8)
    c.poly([(fx0 + 9, shelves[2] - 7), (fx0 + 15, shelves[2] - 7), (fx0 + 12, shelves[2] - 3)], 'steel', .6)
    c.vline(fx0 + 12, shelves[2] - 3, shelves[2] - 1, 'steel', .5)
    for k in range(3):
        c.rect(fx1 - 9 + k * 3, shelves[2] - 4, fx1 - 7 + k * 3, shelves[2] - 1, 'chrome', .5 + k * .08)

    # ---- the sink with three trays + the bottle shelf --------------------------------------------------
    SX0, SX1, SZ = 108, 188, 20
    # back splash board
    c.rect(SX0, FLOOR - 40, SX1, FLOOR - 22, 'wood', C.grain_h(.36, .03, 1.2))
    c.hline(SX0, SX1, FLOOR - 40, 'wood', .55)
    # sink body: tarred wood box on legs
    p.box(c, SX0, SX1, 16, 24, 0, SZ, 'wood', front=.42, top=.5, side=.3)
    for X in (SX0 + 1, SX1 - 3):
        p.box(c, X, X + 2, 0, 16, SZ - 3, SZ - 1, 'wood', front=.3, side=.22)
    p.box(c, SX0 + 2, SX1 - 2, 4, 5, 2, SZ - 2, 'wood', front=.26, top=.32)       # lower shelf
    # inside of the sink (lead lining)
    ins = p.quad([(SX0 + 2, 24, 2), (SX1 - 2, 24, 2), (SX1 - 2, 24, SZ - 2), (SX0 + 2, 24, SZ - 2)])
    c.poly(ins, 'steel', .32)
    rim = P(p, SX0, 24, SZ)
    rim2 = P(p, SX1, 24, SZ)
    c.hline(rim[0], rim2[0], rim[1], 'wood', .7)
    # three trays: developer (brown), stop (amber), fixer (clear)
    tw = (SX1 - SX0 - 8) / 3
    trays = []
    for i, (liq, ll) in enumerate((('c_amberglass', .38), ('c_amber', .5), ('glass', .55))):
        X0 = SX0 + 4 + i * tw
        X1 = X0 + tw - 3
        a = P(p, X0, 24.5, 5)
        b = P(p, X1, 24.5, SZ - 4)
        tray(c, a[0], a[1], b[0], b[1], liq, ll)
        trays.append((a[0], a[1], b[0], b[1]))
    # tongs + thermometer
    t0 = trays[0]
    c.line(t0[2] - 3, t0[1] - 2, t0[2] - 8, t0[3] - 1, 'chrome', .7)
    c.line(t0[2] - 2, t0[1] - 2, t0[2] - 7, t0[3] - 1, 'chrome', .5)
    t2 = trays[2]
    c.line(t2[0] + 3, t2[1] - 3, t2[0] + 6, t2[3] - 1, 'glass', .8, emis=.1)
    c.put(t2[0] + 6, t2[3] - 1, 'red', .6)
    # time/temperature chart pinned to the splash board
    c.rect(SX0 + 3, FLOOR - 39, SX0 + 17, FLOOR - 28, 'paper', .82)
    c.hline(SX0 + 3, SX0 + 17, FLOOR - 39, 'paper', .95)
    c.hline(SX0 + 4, SX0 + 16, FLOOR - 37, 'black', .1)
    for k, ly in enumerate(range(FLOOR - 35, FLOOR - 29, 2)):
        c.hline(SX0 + 4, SX0 + 9, ly, 'black', .3)
        c.hline(SX0 + 11, SX0 + 15 - k, ly, 'black', .3)
    c.put(SX0 + 10, FLOOR - 39, 'red', .6)
    # faucet (gooseneck) from the splash board
    fxp = 150
    c.vline(fxp, FLOOR - 36, FLOOR - 28, 'chrome', .72)
    c.hline(fxp, fxp + 6, FLOOR - 36, 'chrome', .8)
    c.vline(fxp + 6, FLOOR - 36, FLOOR - 31, 'chrome', .6)
    c.rect(fxp - 2, FLOOR - 30, fxp + 3, FLOOR - 28, 'chrome', .5)
    c.put(fxp - 2, FLOOR - 31, 'red', .6)
    c.put(fxp + 2, FLOOR - 31, 'c_cobalt', .6)
    _V['drip'] = (fxp + 6, FLOOR - 30)
    # bottle shelf
    BS = FLOOR - 50
    c.rect(SX0 + 2, BS, SX1 - 2, BS + 3, 'wood', .55)
    c.hline(SX0 + 2, SX1 - 2, BS, 'wood', .78)
    c.hline(SX0 + 2, SX1 - 2, BS + 3, 'wood', .25)
    for X in (SX0 + 6, SX1 - 8):
        c.poly([(X, BS + 3), (X + 3, BS + 3), (X + 1, BS + 9)], 'steel', .45)
    bottles = {}
    centres = [int((t[0] + t[2]) / 2) for t in trays]
    for key, lab, cxp in (('dev', 'DEV', centres[0]), ('stop', 'STOP', centres[1]), ('fix', 'FIX', centres[2])):
        w = 14 if lab == 'STOP' else 12
        bottle(c, cxp - w // 2, BS, lab, lum=.5, w=w, h=20)
        bottles[key] = (cxp - w // 2 - 1, BS - 21, cxp + w // 2 + 1, BS + 1)
    # little extras on the shelf: wetting agent, a measuring jug
    c.rect(SX0 + 4, BS - 7, SX0 + 7, BS, 'c_amberglass', .55)
    c.rect(SX1 - 7, BS - 9, SX1 - 3, BS, 'glass', .6, emis=.1)
    c.hline(SX1 - 7, SX1 - 3, BS - 9, 'glass', .85)

    # ---- the enlarger bench + tank ----------------------------------------------------------------------
    BX0, BX1, BZ = 194, 238, 22
    p.box(c, BX0, BX1, 0, 24, 0, BZ, 'wood', front=.42, top=.56, side=.3,
          lum_fn=C.grain_h(.42, .025, 1.4, 3), top_fn=C.grain_h(.56, .02, .7, 4))
    bf = [int(round(v)) for v in p.front_rect(BX0, BX1, 0, 24, BZ)]
    c.hline(bf[0], bf[2], bf[1], 'wood', .78)
    c.rect(bf[0] + 3, bf[1] + 4, bf[2] - 3, bf[1] + 10, 'wood', .34)         # drawer
    c.hline(bf[0] + 3, bf[2] - 3, bf[1] + 4, 'wood', .22)
    c.hline(bf[0] + 3, bf[2] - 3, bf[1] + 10, 'wood', .6)
    c.hline((bf[0] + bf[2]) // 2 - 2, (bf[0] + bf[2]) // 2 + 2, bf[1] + 7, 'brass', .8)
    # developing tank (stainless) on the bench
    tx, ty = P(p, 200, 24, 13)
    c.rect(tx - 4, ty - 10, tx + 5, ty, 'chrome', hgrad(tx - 4, tx + 5, .9, .45))
    c.ellipse(tx + .5, ty - 10, 4.5, 1.4, 'chrome', .95)
    c.rect(tx - 1, ty - 13, tx + 2, ty - 10, 'black', .4)
    c.hline(tx - 1, tx + 2, ty - 13, 'black', .7)
    c.vline(tx - 3, ty - 9, ty - 1, 'chrome', 1.0)
    c.hline(tx - 4, tx + 5, ty - 4, 'chrome', .55)
    c.hline(tx - 4, tx + 5, ty, 'black', .2)
    _V['tank'] = (tx - 5, ty - 14, tx + 6, ty + 1)
    # enlarger: baseboard + easel, column, carriage, bellows, lamp house
    a = P(p, 206, 24.2, 3)
    b = P(p, 234, 24.2, 18)
    c.rect(a[0], a[1], b[0], b[1], 'slate', .45)                              # baseboard
    c.rect(a[0] + 2, a[1] + 1, b[0] - 5, b[1] - 1, 'white', .82)               # easel with paper
    c.hline(a[0] + 2, b[0] - 5, a[1] + 1, 'white', .95)
    c.rect(a[0] + 1, a[1] + 1, a[0] + 3, b[1] - 1, 'chrome', .6)
    c.hline(a[0], b[0], b[1], 'black', .3)
    colx = P(p, 230, 0, 4)[0]
    ctop = P(p, 230, 62, 4)[1]
    c.rect(colx - 2, ctop, colx + 2, a[1] + 1, 'chrome', hgrad(colx - 2, colx + 2, .8, .4))
    c.vline(colx - 2, ctop, a[1], 'chrome', .92)
    c.rect(colx - 3, ctop - 2, colx + 3, ctop, 'black', .5)
    # grease-pencil note on the column (white china marker: readable under the safelight)
    rng = np.random.default_rng(5)
    for k, yy in enumerate(range(ctop + 14, a[1] - 3, 2)):
        for xx in range(colx - 2, colx + 2):
            if rng.random() < .62:
                c.put(xx, yy, 'paper', .95)
    # carriage + arm + head
    hx_, hy_ = P(p, 218, 52, 9)
    c.rect(colx - 4, hy_ - 2, colx + 3, hy_ + 4, 'black', .5)                   # carriage
    c.hline(colx - 4, colx + 3, hy_ - 2, 'chrome', .8)
    c.rect(hx_ + 4, hy_ + 1, colx - 3, hy_ + 3, 'chrome', .55)                  # arm
    c.hline(hx_ + 4, colx - 3, hy_ + 1, 'chrome', .85)
    c.rect(hx_ - 6, hy_ - 7, hx_ + 6, hy_ + 2, 'slate', vgrad(hy_ - 7, hy_ + 2, .5, .3))   # lamp house
    c.hline(hx_ - 6, hx_ + 6, hy_ - 7, 'chrome', .85)
    c.vline(hx_ - 6, hy_ - 7, hy_ + 2, 'slate', .62)
    for k in range(hx_ - 4, hx_ + 5, 2):
        c.vline(k, hy_ - 5, hy_ - 2, 'black', .2)                          # vents
    c.ellipse(hx_, hy_ - 9, 4, 2, 'slate', .45)                               # lamp dome
    c.poly([(hx_ - 5, hy_ + 2), (hx_ + 5, hy_ + 2), (hx_ + 3, hy_ + 10), (hx_ - 3, hy_ + 10)], 'black', .32)  # bellows
    for yy in range(hy_ + 3, hy_ + 10, 2):
        c.hline(hx_ - 4, hx_ + 4, yy, 'slate', .55)
    c.rect(hx_ - 2, hy_ + 10, hx_ + 3, hy_ + 14, 'chrome', .6)                # lens
    c.hline(hx_ - 2, hx_ + 3, hy_ + 10, 'chrome', .95)
    c.put(hx_, hy_ + 14, 'c_ruby', .8, emis=.6)                                # red swing filter
    c.put(hx_ + 1, hy_ + 14, 'c_ruby', .7, emis=.6)
    c.line(hx_ + 6, hy_ - 4, hx_ + 9, hy_ - 12, 'black', .45)                  # cable
    c.line(hx_ + 9, hy_ - 12, colx + 6, ctop - 6, 'black', .45)
    _V['enlarger'] = (hx_ - 8, ctop - 4, colx + 5, b[1] + 1)

    # ---- far right corner: timer (only visible in white) + apron, pencil ------------------------------
    TIM = (277, 12)
    with lay.base():
        c.rect(TIM[0] - 1, TIM[1] - 1, TIM[0] + 20, TIM[1] + 26, 'c_plaster', wall_fn)
    timer_clock(alt, TIM[0], TIM[1])
    apr = p.quad([(296, 50, 30), (296, 50, 38), (296, 18, 40), (296, 18, 28)])
    c.poly(apr, 'black', .36)
    c.poly(p.quad([(296, 52, 32), (296, 52, 36), (296, 48, 36), (296, 48, 32)]), 'steel', .6)
    # the red grease pencil that wrote on the wall, dropped on the floor
    gx, gy = P(p, 266, 0, 12)
    c.line(gx, gy, gx + 4, gy - 1, 'c_greasered', .6)
    c.put(gx + 5, gy - 1, 'c_greasered', .9)

    # ---- drying line + clips ----------------------------------------------------------------------
    L0 = P(p, 24, 80, 30)
    L1 = P(p, 236, 78, 0)
    c.line(L0[0], L0[1], L1[0], L1[1], 'steel', .62)
    c.put(L1[0], L1[1], 'steel', .9)
    c.rect(L1[0] - 1, L1[1] - 1, L1[0] + 1, L1[1] + 2, 'steel', .5)
    c.rect(L0[0] - 2, L0[1] - 1, L0[0] + 1, L0[1] + 1, 'steel', .5)
    clips = []
    for x in (62, 90, 134, 162, 205):
        t = (x - L0[0]) / (L1[0] - L0[0])
        y = int(round(L0[1] + (L1[1] - L0[1]) * t))
        c.rect(x, y - 1, x + 2, y + 4, 'oak', .7)
        c.vline(x, y - 1, y + 4, 'oak', .88)
        c.put(x + 1, y + 1, 'steel', .7)
        clips.append((x, y))
    _V['line'] = (L0, L1)

    # ---- safelight hanging over the sink + the white bulb ----------------------------------------------
    SLx, SLy = 147, 22
    c.vline(SLx, 0, SLy - 5, 'black', .4)
    c.rect(SLx - 7, SLy - 5, SLx + 8, SLy + 4, 'black', .38)
    c.hline(SLx - 7, SLx + 8, SLy - 5, 'black', .68)
    c.vline(SLx - 7, SLy - 5, SLy + 4, 'black', .55)
    c.rect(SLx - 6, SLy + 2, SLx + 7, SLy + 5, 'c_ruby', .9, emis=1)
    c.hline(SLx - 5, SLx + 6, SLy + 4, 'c_ruby', 1.0, emis=1)
    BLx, BLy = 160, 10
    c.vline(BLx, 0, BLy - 3, 'black', .45)
    c.rect(BLx - 2, BLy - 3, BLx + 3, BLy, 'brass', .45)
    c.vline(BLx + 3, BLy - 2, BLy + 4, 'brass', .6)                             # pull chain
    c.put(BLx + 3, BLy + 5, 'brass', .8)
    with lay.base():
        c.ellipse(BLx + .5, BLy + 3, 3, 3.4, 'glass', .45)
        c.put(BLx - 1, BLy + 2, 'glass', .7)
    alt.ellipse(BLx + .5, BLy + 3, 3, 3.4, 'lamp', .97, emis=1)
    alt.put(BLx - 1, BLy + 2, 'lamp', 1.0, emis=1)

    # ---- stool (static) ---------------------------------------------------------------------------
    STX, STZ = 206, 36
    st_box = (P(p, STX - 9, 18, STZ - 6)[0], P(p, STX, 18, STZ)[1] - 6, P(p, STX + 9, 0, STZ + 6)[0], by(STZ + 6) + 2)
    snap_stool = C.snapshot(c, *st_box)
    stool_px = stool(c, p, STX, STZ)

    # ---- lighting -------------------------------------------------------------------------------
    lay.finalize()
    c.shadow_poly(p.quad([(SX0, 0, 0), (SX1, 0, 0), (SX1 + 2, 0, SZ + 4), (SX0, 0, SZ + 4)]), .45)
    c.shadow_poly(p.quad([(BX0, 0, 0), (BX1, 0, 0), (BX1 + 2, 0, BZ + 3), (BX0, 0, BZ + 3)]), .45)
    c.shadow_poly(p.quad([(CX0, 0, 0), (CX1, 0, 0), (CX1 + 1, 0, CZ + 3), (CX0, 0, CZ + 3)]), .4)
    c.shadow_ellipse(stool_px[2], stool_px[3], 8, 2.5, .4)
    base_shade = c.shade.copy()
    xx = np.arange(W)[None, :].astype(np.float32)
    yy = np.arange(H)[:, None].astype(np.float32)
    # red: the corner beyond the enlarger panel falls into deep shadow
    corner = np.clip((xx - 233) / 8.0, 0, 1)
    red_shade = base_shade * (1 - corner * .94) * np.clip(.72 + yy / 260, .72, 1)
    red_shade *= np.clip(1.3 - np.abs(xx - 125) / 190.0, .62, 1)
    red_lights = [Light(SLx, SLy + 6, 200, 1.5, falloff=1.15),
                  Light(SLx, 122, 120, .62, ystretch=2.3),
                  Light(sx0 + 5, 118, 70, .3, ystretch=2.2),
                  Light(sx0 + 5, 50, 110, 1.0, falloff=1.2),
                  Light(hx_, hy_ + 16, 36, .35)]
    c.lights = red_lights
    c.ambient = .42
    c.shade = red_shade.astype(np.float32)
    c.glows = [(SLx, SLy + 4, 28, (255, 40, 30), .55), (sx0 + 5, 49, 16, (255, 40, 30), .45)]
    _V['red'] = dict(lights=red_lights, ambient=.42, shade=c.shade.copy(), glows=list(c.glows))
    white_shade = base_shade * np.clip(1.2 - np.abs(xx - 160) / 260.0, .75, 1) * np.clip(.85 + yy / 500, .85, 1)
    _V['white'] = dict(lights=[Light(BLx, BLy + 4, 330, .64, falloff=1.0), Light(SLx, SLy + 6, 40, .15),
                               Light(BLx, BLy + 4, 60, .25)],
                       ambient=.54, shade=white_shade.astype(np.float32),
                       glows=[(BLx, BLy + 3, 30, (255, 240, 200), .55), (SLx, SLy + 4, 14, (255, 40, 30), .3),
                              (sx0 + 5, 49, 8, (255, 40, 30), .25)])
    _V['lay'] = lay

    # ---- state objects ---------------------------------------------------------------------------
    _V['corner_snap'] = C.snapshot(c, 236, 0, 300, FLOOR + 2)      # finished bare corner
    with sc.obj('padlock', state=True, depth=FLOOR) as cc:
        hxp, hyp = _V['hasp']
        padlock(cc, hxp, hyp - 3)
    with sc.obj('negatives_hung', state=True, depth=by(16)) as cc:
        for i, (x, y) in enumerate(clips[:3]):
            ln = 16 - i * 2
            cc.rect(x - 1, y + 3, x + 3, y + 3 + ln, 'black', .22)
            cc.vline(x - 1, y + 3, y + 3 + ln, 'slate', .45)
            for k in range(y + 4, y + 3 + ln, 2):
                cc.put(x - 1, k, 'paper', .6)
                cc.put(x + 2, k, 'paper', .5)
            for k in range(y + 6, y + 2 + ln, 5):
                cc.rect(x, k, x + 2, k + 3, 'slate', .5)
            cc.rect(x, y - 1, x + 2, y + 4, 'oak', .66)
            cc.vline(x, y - 1, y + 4, 'oak', .82)
            cc.put(x + 1, y + 2 + ln, 'glass', .8, emis=.2)          # drip at the end
    with sc.obj('clock_open', state=True, depth=FLOOR) as cc:
        _V['clock_open_oid'] = cc.cur_owner
        timer_clock(cc, TIM[0], TIM[1], opened=True)
    with sc.obj('stool_moved', state=True, depth=by(10) + 1) as cc:
        C.restore(cc, snap_stool)
        stool(cc, p, 289, 8)
    with sc.obj('writing', state=True, depth=FLOOR) as cc:
        _V['writing_oid'] = cc.cur_owner
        lines = [(240, 40, -.02), (243, 48, .03), (241, 56, -.03), (246, 64, .0), (244, 74, -.02), (245, 82, .02)]
        for i, (line, (x, y, sl)) in enumerate(zip(WRITING, lines)):
            C.text(cc, x, y, line, 'c_greasered', .66, slant=sl, seed=11 + i)
        # "NO SISTER." underlined twice, hard
        cc.line(245, 89, 285, 88, 'c_greasered', .72)
        cc.line(248, 91, 283, 90, 'c_greasered', .58)

    sc.base_state_fn = base_state

    # ---- anim: slow drip from the faucet ---------------------------------------------------------
    dpx, dpy = _V['drip']

    def drip(k):
        def f(cc):
            if k < 4:
                cc.put(dpx, dpy + k * 2, 'glass', .62, emis=.2)
            elif k == 4:
                cc.put(dpx - 1, dpy + 9, 'glass', .55, emis=.15)
                cc.put(dpx + 1, dpy + 9, 'glass', .55, emis=.15)
            else:
                cc.put(dpx, dpy, 'glass', .45 + .04 * k, emis=.15)
        return f
    sc.anim('drip', [drip(k) for k in range(8)], fps=4)

    # ---- interaction ------------------------------------------------------------------------------
    hxp, hyp = _V['hasp']
    sc.hotspot('door', rect=(D0 - 3, dtop - 3, D1 + 3, FLOOR), walk=(39, by(5)), face='up')
    sc.hotspot('padlock', rect=(hxp - 7, hyp - 6, hxp + 5, hyp + 12), walk=(45, by(5)), face='up')
    sc.hotspot('switch', rect=(58, 62, 76, 82), walk=(67, by(6)), face='up')
    sc.hotspot('cabinet', rect=(fx0 - 1, fy0 - 1, fx1 + 1, fy1), walk=(90, by(18)), face='up')
    pb = _V['paper_box']
    sc.hotspot('paper_box', rect=(pb[0] - 1, pb[1] - 5, pb[2] + 1, pb[3] + 1), walk=(90, by(18)), face='up')
    bg_ = _V['bag']
    sc.hotspot('changing_bag', rect=(bg_[0], bg_[1], bg_[2], bg_[3]), walk=(90, by(18)), face='up')
    sk0 = P(p, SX0, 24, SZ)
    sk1 = P(p, SX1, 0, SZ)
    sc.hotspot('sink', rect=(sk0[0], FLOOR - 41, sk1[0], sk1[1]), walk=(150, by(28)), face='up')
    ty0 = min(t[1] for t in trays) - 1
    ty1 = max(t[3] for t in trays) + 1
    sc.hotspot('trays', rect=(trays[0][0] - 1, ty0, trays[2][2] + 1, ty1), walk=(150, by(28)), face='up')
    for key in ('dev', 'stop', 'fix'):
        r = bottles[key]
        sc.hotspot('bottle_' + key, rect=r, walk=((r[0] + r[2]) // 2, by(28)), face='up')
    tk = _V['tank']
    sc.hotspot('tank', rect=tk, walk=(bx(200, 28), by(28)), face='up')
    en = _V['enlarger']
    sc.hotspot('enlarger', rect=en, walk=(bx(220, 28), by(28)), face='up')
    (l0, l1) = _V['line']
    t_ = (136 - l0[0]) / (l1[0] - l0[0])
    lm = (136, int(round(l0[1] + (l1[1] - l0[1]) * t_)))
    sc.hotspot('drying_line', poly=[(l0[0], l0[1] - 3), (lm[0], lm[1] - 3), (lm[0], lm[1] + 16), (l0[0], l0[1] + 6)],
               walk=(118, by(34)), face='up')
    sc.hotspot('safelight', rect=(SLx - 8, SLy - 6, SLx + 9, SLy + 6), walk=(148, by(28)), face='up')
    sc.hotspot('stool', rect=(stool_px[0] - 8, stool_px[1] - 4, stool_px[0] + 8, stool_px[3] + 1),
               walk=(bx(STX - 12, STZ + 8), by(STZ + 8)), face='right')
    sc.hotspot('clock', rect=(TIM[0] - 2, TIM[1] - 2, TIM[0] + 20, TIM[1] + 26), walk=(bx(286, 12), by(12)), face='up')
    sc.hotspot('writing', rect=(238, 37, 295, 93), walk=(bx(264, 14), by(14)), face='up')

    floor = [P(p, 26, 0, 3), P(p, 294, 0, 3), P(p, 294, 0, zf), P(p, 26, 0, zf)]
    holes = [
        [P(p, CX0 - 2, 0, 0), P(p, CX1 + 2, 0, 0), P(p, CX1 + 2, 0, CZ + 4), P(p, CX0 - 2, 0, CZ + 4)],
        [P(p, SX0 - 2, 0, 0), P(p, BX1 + 2, 0, 0), P(p, BX1 + 2, 0, SZ + 4), P(p, SX0 - 2, 0, SZ + 4)],
        [P(p, STX - 8, 0, STZ - 5), P(p, STX + 8, 0, STZ - 5), P(p, STX + 8, 0, STZ + 5), P(p, STX - 8, 0, STZ + 5)],
    ]
    floor = clip_floor(floor)
    sc.walkable(floor, holes=holes)
    sc.point('start', 112, by(52), 'down')
    sc.point('wake', 39, by(6), 'down')
    sc.point('clock_spot', bx(286, 12), by(12), 'up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, round(p.char_scale(FLOOR, 140), 3), 140, 1.0)
    sc.meta['floor'] = 'stone'
    C.order_hotspots(sc, ['padlock', 'switch', 'paper_box', 'changing_bag', 'bottle_dev', 'bottle_stop', 'bottle_fix',
                          'trays', 'tank', 'safelight', 'clock', 'writing', 'stool'])
    C.check(sc)
    return sc


def clip_floor(poly):
    return [(min(max(x, 0), W), min(max(y, 0), H)) for x, y in poly]


def _apply(c, key):
    v = _V[key]
    c.lights = [Light(L.x, L.y, L.r, L.i, falloff=L.falloff, cone=L.cone, ystretch=L.ystretch) for L in v['lights']]
    c.ambient = v['ambient']
    c.shade = v['shade'].copy()
    c.glows = list(v['glows'])


def base_state(cc):
    """Base (safelight) render for state objects.  Red grease pencil on cream plaster reflects the
    red safelight exactly like the wall does, and the timer corner is pitch dark: their base
    sprites are re-painted as the bare wall, so nothing shows until the white light is on."""
    if cc.cur_owner in (_V.get('writing_oid'), _V.get('clock_open_oid')):
        m = cc.owner == cc.cur_owner
        C.restore(cc, _V['corner_snap'], mask=m)
    return {'remap': 'safelight'}


def white(c):
    _apply(c, 'white')
    _V['lay'].apply(c, 'white')
    return None


VARIANTS = {'white': white}


def main():
    sc = build()
    sc.export(variants=VARIANTS, base_kw={'remap': 'safelight'})
    return sc


if __name__ == '__main__':
    main()
