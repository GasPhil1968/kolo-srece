"""Chapter 4 - Halcyon House, ground-floor corridor (480 wide).  Grey rain outside; fire drill.

White glazed tile and institutional green paint.  Room 8 stands open on the left; the fire bell
is still ringing; through the barred windows the patients huddle on the lawn under the rain.
The nurses' station is deserted - roster board, key board - and down at the end the Director's
door and a laundry cart parked by the service stairs.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
from persp import Persp
import props_d as D

W, H = 480, 144
FLOOR = 100
BX0, BX1 = 20, 460
DADO = 70                      # top of the tiled wainscot

DOOR8 = (30, 55, 54, FLOOR)
BELL = (70, 40)
WINDOWS = [(102, 28, 146, 82), (204, 28, 248, 82)]
PORTRAIT = (160, 32, 190, 72)
WARD = (276, 50, 318, FLOOR)
STATION = dict(X0=328, X1=390, Z0=0, Z1=20, H=22)
OFFICE = (404, 52, 430, FLOOR)


def build():
    sc = Scene('halcyon_corridor', W, H, seed=70)
    c = sc.c
    p = Persp(BX0, BX1, 0, FLOOR, horizon=-56, depth=420)
    zfront = p.z_at_floor_y(H + 2)
    zedge = 130
    fuv = D.floor_uv(p)
    N = noise2(W, H, 11, 5, 3)
    rng = np.random.default_rng(4)

    # ------------------------------------------------------------------ walls ----------
    def paint(xx, yy):
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        return .6 + (N[yi, xi] - .5) * .1 - np.clip((14 - yy) / 14, 0, 1) * .08
    c.rect(BX0, 0, BX1, DADO, 'd_green', paint, dith=.35)
    # glazed white tile wainscot (subway bond) with a dark green cap course
    def tiles(xx, yy):
        row = np.floor((yy - DADO - 3) / 4)
        off = np.where(row % 2 == 0, 0, 4)
        fx = (xx - BX0 + off) % 8
        fy = (yy - DADO - 3) % 4
        L = .74 + ((np.floor((xx - BX0 + off) / 8) * 7 + row * 3) % 5) * .012
        L = np.where(fy < 1, .46, L)
        L = np.where(fx < 1, .5, L)
        L = np.where((fy >= 1) & (fy < 2) & (fx >= 1), L + .1, L)    # glaze highlight
        return L
    c.rect(BX0, DADO + 3, BX1, FLOOR - 3, 'tile', tiles, dith=.15)
    c.rect(BX0, DADO, BX1, DADO + 3, 'd_green', .32, dith=0)
    c.hline(BX0, BX1, DADO, 'd_green', .55)
    c.rect(BX0, FLOOR - 3, BX1, FLOOR, 'd_green', .28, dith=0)
    c.hline(BX0, BX1, FLOOR - 3, 'd_green', .45)
    # crazed / chipped tiles
    for k in range(18):
        x = int(rng.integers(BX0 + 4, BX1 - 4))
        y = int(rng.integers(DADO + 5, FLOOR - 5))
        c.put(x, y, 'tile', .35)
        c.put(x + 1, y, 'tile', .45)
    # side walls (thin slivers at both ends)
    for X in (BX0, BX1):
        f = D.side_uv(p, X)

        def sw(xx, yy, f=f):
            Z, Y, s = f(xx, yy)
            return np.where(Y < (FLOOR - DADO), .5 + np.where((Y % 4) < .8, -.15, 0), .5)
        pts = p.quad([(X, 0, 0), (X, 0, zedge), (X, 260, zedge), (X, 260, 0)])
        c.poly(pts, 'd_green', .42, dith=.3)
        pts2 = p.quad([(X, 3, 0), (X, 3, zedge), (X, FLOOR - DADO, zedge), (X, FLOOR - DADO, 0)])
        c.poly(pts2, 'tile', sw, dith=.2)

    # ------------------------------------------------------------------ floor ----------
    fl = p.quad([(BX0, 0, 0), (BX1, 0, 0), (BX1, 0, zedge), (BX0, 0, zedge)])
    m, r = c.poly_mask(fl)
    yy, xx = np.mgrid[r[1]:r[3], r[0]:r[2]].astype(np.float32)
    X, Z, s = fuv(xx + .5, yy + .5)
    size = 10.0
    i = np.floor((X - BX0) / size)
    j = np.floor(Z / size)
    fx = (X - BX0) / size - i
    fz = Z / size - j
    gw = .7 / s / size
    grout = (fx < gw) | (fz < gw * 1.3)
    dark = ((i + j) % 2 == 1)
    Nf = N[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)]
    wear = (Nf - .5) * .14
    c._apply(m, 'tile', .64 + wear, dith=.35, region=r)
    c._apply(m & dark, 'd_green', .46 + wear, dith=.35, region=r)
    c._apply(m & grout, 'tile', .4, dith=0, region=r)
    # long polished sheen down the middle of the corridor
    c.light_poly([(BX0, 108), (BX1, 108), (BX1, 116), (BX0, 116)], .06)

    # ----------------------------------------------------------- windows (barred) ------
    def lawn(a, b, cc, d, seed):
        c.rect(a, b, cc, d, 'fog', vgrad(b, d, .74, .58), emis=.9, dith=.5)
        hz = b + 14
        for k in range(a, cc):
            hh = int(2 * math.sin(k * .19 + seed) + 1.5 * math.sin(k * .07))
            c.vline(k, hz - 4 + hh, hz, 'fog', .44, emis=.85)
        c.rect(a, hz, cc, d, 'grass', vgrad(hz, d, .5, .68), emis=.75, dith=.5)
        c.rect(a, hz + 2, cc, hz + 4, 'concrete', .55, emis=.75, dith=0)          # perimeter wall
        c.hline(a, cc, hz + 2, 'concrete', .72, emis=.75)
        for tx in ((a + 6, cc - 8) if seed == 0 else (a + 12,)):
            for t in range(18):
                wdt = int(3 * math.sin(math.pi * (t + 1) / 19))
                c.hline(tx - wdt + t // 7, tx + wdt + 1 + t // 7, hz + 3 - t, 'grass', .3 + (t % 3) * .03, emis=.7)
        # patients in white, huddled; nurses in navy capes with white caps; one umbrella
        prng = np.random.default_rng(seed + 3)
        base = a + (14 if seed == 0 else 8)
        for k in range(9 if seed == 0 else 7):
            px = base + int(prng.integers(0, 22))
            py = hz + 12 + int(prng.integers(0, 6))
            D.tiny_person(c, px, py, 7 + int(prng.integers(0, 2)), body='white', body_lum=.82, head='skin',
                          head_lum=.6, legs='white', legs_lum=.6, emis=.8)
        for k in range(2):
            px = base - 4 + k * 28
            D.tiny_person(c, px, hz + 16, 8, body='night', body_lum=.3, head='skin', head_lum=.62, legs='night',
                          legs_lum=.2, emis=.8, hat='white', hat_lum=.95)
        if seed == 0:
            ux, uy = base + 18, hz + 6
            c.poly([(ux - 5, uy + 2), (ux, uy - 2), (ux + 5, uy + 2)], 'black', .2, emis=.6, dith=0)
            c.vline(ux, uy + 2, uy + 8, 'black', .3, emis=.6)
        D.rain_on_pane(c, a, b, cc, d, seed=seed + 11, density=.02, ramp_name='fog', lum=.92, emis=.8)
    for wi, (wx0, wy0, wx1, wy1) in enumerate(WINDOWS):
        # deep reveal
        c.rect(wx0 - 4, wy0 - 4, wx1 + 4, wy1 + 4, 'd_green', .42, dith=0)
        c.hline(wx0 - 4, wx1 + 4, wy0 - 4, 'd_green', .62)
        c.rect(wx0 - 1, wy0 - 1, wx1 + 1, wy1 + 1, 'd_green', .24, dith=0)
        lawn(wx0 + 2, wy0 + 2, wx1 - 2, wy1 - 2, wi)
        c.rect(wx0, wy0, wx1, wy0 + 2, 'cream', .66, dith=0)
        c.rect(wx0, wy1 - 2, wx1, wy1, 'cream', .5, dith=0)
        c.rect(wx0, wy0, wx0 + 2, wy1, 'cream', .6, dith=0)
        c.rect(wx1 - 2, wy0, wx1, wy1, 'cream', .46, dith=0)
        my = (wy0 + wy1) // 2
        c.rect(wx0 + 2, my - 1, wx1 - 2, my + 1, 'cream', .62, dith=0)
        c.vline((wx0 + wx1) // 2, wy0 + 2, wy1 - 2, 'cream', .5)
        # iron bars in front of the glass
        for bx in range(wx0 + 4, wx1 - 2, 5):
            c.vline(bx, wy0 - 1, wy1 + 1, 'black', .3)
            c.vline(bx + 1, wy0 - 1, wy1 + 1, 'steel', .45)
        for by in (wy0 + 6, wy1 - 8):
            c.hline(wx0 - 1, wx1 + 1, by, 'steel', .4)
            c.hline(wx0 - 1, wx1 + 1, by + 1, 'black', .3)
        # sill + radiator below
        c.rect(wx0 - 6, wy1 + 4, wx1 + 6, wy1 + 7, 'tile', .82, dith=0)
        c.hline(wx0 - 6, wx1 + 6, wy1 + 7, 'tile', .4)
        rx0, rx1 = wx0 + 4, wx1 - 4
        c.rect(rx0, 90, rx1, FLOOR - 4, 'cream', .45, dith=0)
        for k in range(rx0 + 1, rx1 - 1, 3):
            c.rect(k, 91, k + 2, FLOOR - 5, 'cream', vgrad(91, FLOOR - 5, .6, .4), dith=0)
            c.vline(k, 91, FLOOR - 5, 'cream', .72)
        sc.rain(wx0 + 2, wy0 + 2, wx1 - 2, wy1 - 2, kind='window')

    # ------------------------------------------------------ Room 8 (open door) ---------
    x0, y0, x1, y1 = DOOR8
    c.rect(x0 - 3, y0 - 3, x1 + 3, y1, 'steel', .42, dith=0)
    c.hline(x0 - 3, x1 + 3, y0 - 3, 'steel', .7)
    c.vline(x0 - 3, y0 - 3, y1, 'steel', .6)
    # the padded cell beyond (quilted, cold-lit)
    D.quilt_surface(c, [(x0, y0), (x1, y0), (x1, y1 - 4), (x0, y1 - 4)], lambda xx, yy: (xx * 1.0, yy * 1.0), 'd_pad',
                    base=.72, amp=.2, cw=12, ch=9, seam=.34, hi=.85, btn=.25, dith=.3)
    c.rect(x0, y1 - 4, x1, y1, 'tile', .55, dith=0)
    c.rect(x0 + 13, y1 - 16, x1, y1 - 10, 'd_cold', .6, dith=0)       # the cot's edge
    c.rect(x0 + 13, y1 - 10, x1, y1 - 9, 'd_green', .3, dith=0)
    D.dfill_rect(c, x0, y0, x1, y0 + 12, 'fog', .8, .35)              # last of the smoke
    # the steel door swung out into the corridor (towards us, hinged on the left)
    leaf = [(x0 - 1, y0 - 1), (x0 - 12, y0 + 3), (x0 - 12, y1 + 9), (x0 - 1, y1)]
    c.poly(leaf, 'd_green', hgrad(x0 - 12, x0, .55, .4), dith=.2)
    c.line(x0 - 12, y0 + 3, x0 - 12, y1 + 9, 'd_green', .7)
    c.line(x0 - 1, y0 - 1, x0 - 12, y0 + 3, 'd_green', .75)
    c.poly([(x0 - 9, y0 + 10), (x0 - 4, y0 + 8), (x0 - 4, y0 + 16), (x0 - 9, y0 + 18)], 'cream', .7, emis=.3, dith=0)
    c.poly([(x0 - 10, y0 + 27), (x0 - 3, y0 + 25), (x0 - 3, y0 + 28), (x0 - 10, y0 + 30)], 'steel', .45, dith=0)
    # stencilled 8 on the wall above
    c.rect(x0 + 6, y0 - 13, x1 - 6, y0 - 5, 'cream', .7, dith=0)
    D.text(c, (x0 + x1) // 2 - 1, y0 - 12, '8', 'black', .2)
    c.hline(x0 + 6, x1 - 6, y0 - 5, 'd_green', .3)

    # ------------------------------------------------- fire bell + procedure notice ----
    bx, by = BELL
    c.rect(bx - 2, by - 7, bx + 3, by - 4, 'steel', .5, dith=0)       # bracket
    c.ellipse(bx + .5, by + .5, 6, 6, 'neonred', radial(bx - 2, by - 2, 8, .8, .4), dith=.2)
    c.ellipse(bx + .5, by + .5, 2, 2, 'neonred', .3, dith=0)
    c.put(bx - 2, by - 3, 'neonred', 1.0)
    c.put(bx + .5, by + .5, 'steel', .7)
    # pull-station box and conduit
    c.vline(bx, by + 7, 64, 'steel', .4)
    c.rect(bx - 4, 64, bx + 5, 76, 'neonred', .5, dith=0)
    c.hline(bx - 4, bx + 5, 64, 'neonred', .75)
    c.rect(bx - 2, 66, bx + 3, 70, 'white', .8, dith=0)
    c.rect(bx - 1, 71, bx + 2, 75, 'black', .2, dith=0)
    c.put(bx, 72, 'chrome', .8)
    # FIRE PROCEDURE notice (white card, red header)
    nx0, ny0 = 82, 38
    c.rect(nx0, ny0, nx0 + 18, ny0 + 22, 'paper', .85, dith=0)
    c.rect(nx0, ny0, nx0 + 18, ny0 + 5, 'neonred', .55, dith=0)
    D.text(c, nx0 + 2, ny0, 'FIRE', 'white', .9)
    for k, w_ in enumerate((14, 12, 14, 9, 13)):
        c.hline(nx0 + 2, nx0 + 2 + w_, ny0 + 8 + k * 3, 'ink', .45)
    for (px_, py_) in ((nx0 + 1, ny0 + 1), (nx0 + 16, ny0 + 1)):
        c.put(px_, py_, 'brass', .9)
    c.shadow_poly([(nx0 + 18, ny0 + 1), (nx0 + 20, ny0 + 2), (nx0 + 20, ny0 + 24), (nx0 + 1, ny0 + 24), (nx0 + 1, ny0 + 22),
                   (nx0 + 18, ny0 + 22)], .3)
    # red fire extinguisher bucket rack
    for k in range(2):
        ex = 86 + k * 6
        c.rect(ex, 82, ex + 5, 89, 'neonred', vgrad(82, 89, .62, .4), dith=0)
        c.hline(ex, ex + 5, 82, 'neonred', .8)
        c.hline(ex + 1, ex + 4, 80, 'steel', .5)
    c.hline(84, 99, 89, 'steel', .4)

    # ------------------------------------------------------------- the founder --------
    px0, py0, px1, py1 = PORTRAIT
    c.rect(px0 - 3, py0 - 3, px1 + 3, py1 + 3, 'gold', .5, dith=0)
    c.hline(px0 - 3, px1 + 3, py0 - 3, 'gold', .85)
    c.vline(px0 - 3, py0 - 3, py1 + 3, 'gold', .7)
    c.hline(px0 - 3, px1 + 3, py1 + 2, 'gold', .3)
    c.rect(px0 - 1, py0 - 1, px1 + 1, py1 + 1, 'gold', .3, dith=0)
    c.rect(px0, py0, px1, py1, 'plum', radial((px0 + px1) / 2, py0 + 12, 30, .4, .12), dith=.5)
    pcx = (px0 + px1) // 2
    # black frock coat, white collar, mutton-chop whiskers, cold eyes
    c.poly([(px0 + 2, py1), (px0 + 5, py0 + 24), (pcx - 2, py0 + 21), (pcx + 3, py0 + 21), (px1 - 5, py0 + 24),
            (px1 - 2, py1)], 'black', .32, dith=.2)
    c.poly([(pcx - 3, py0 + 21), (pcx + 3, py0 + 21), (pcx + 1, py0 + 30), (pcx - 1, py0 + 30)], 'white', .8, dith=0)
    c.vline(pcx, py0 + 22, py0 + 29, 'black', .2)
    c.ellipse(pcx + .5, py0 + 14, 5, 6.5, 'skin', radial(pcx - 2, py0 + 11, 8, .72, .38), dith=.3)
    c.poly([(pcx - 5, py0 + 14), (pcx - 3, py0 + 21), (pcx - 1, py0 + 18)], 'white', .62, dith=0)       # whiskers
    c.poly([(pcx + 6, py0 + 14), (pcx + 4, py0 + 21), (pcx + 2, py0 + 18)], 'white', .58, dith=0)
    c.hline(pcx - 4, pcx + 6, py0 + 8, 'white', .55)                                                  # receding hair
    c.put(pcx - 2, py0 + 13, 'black', .1)
    c.put(pcx + 2, py0 + 13, 'black', .1)
    c.hline(pcx - 1, pcx + 2, py0 + 17, 'skin', .3)
    c.poly([(px0 + 4, py1 - 5), (px0 + 10, py1 - 7), (px0 + 11, py1 - 3), (px0 + 4, py1 - 2)], 'skin', .45, dith=0)   # hand on a book
    c.rect(px0 + 2, py1 - 4, px0 + 11, py1, 'red', .35, dith=0)
    c.rect(pcx - 6, py1 + 5, pcx + 7, py1 + 8, 'brass', .6, dith=0)          # brass plaque
    c.hline(pcx - 5, pcx + 6, py1 + 6, 'brass', .3)
    c.shadow_poly([(px1 + 3, py0 - 1), (px1 + 6, py0 + 1), (px1 + 6, py1 + 6), (px0, py1 + 6), (px0 - 2, py1 + 3),
                   (px1 + 3, py1 + 3)], .35)
    # a bench under the portrait with a forgotten slipper
    p.box(c, 158, 194, 10, 12, 2, 10, 'oak', front=.5, top=.62, side=.35)
    for X in (159, 192):
        p.box(c, X, X + 2, 0, 10, 8, 10, 'oak', front=.38)
        p.box(c, X, X + 2, 0, 10, 2, 4, 'oak', front=.3)
    sx, sy = p.P(170, 0, 16)
    c.poly([(sx, sy - 1), (sx + 5, sy - 2), (sx + 6, sy), (sx, sy + 1)], 'denim', .55, dith=0)
    c.put(sx + 1, sy - 1, 'white', .7)

    # ------------------------------------------------------------- wheelchair ---------
    # an old cane-backed wheelchair parked in profile against the wall, facing left
    wcx, wcz = 252, 8
    gx_, gy_ = p.P(wcx + 12, 0, wcz + 5)
    gx_, gy_ = int(gx_), int(gy_)
    c.shadow_ellipse(gx_ + 1, gy_, 15, 3, .55)
    def wheel(cx_, cy_, r_, lum=.55):
        c.ellipse(cx_, cy_, r_, r_, 'black', .22, dith=0)
        c.ellipse(cx_, cy_, r_ - 1.2, r_ - 1.2, 'steel', lum, dith=0)
        c.ellipse(cx_, cy_, r_ - 2.2, r_ - 2.2, 'd_green', .5, dith=0)       # the wall behind, through the spokes
        for k in range(10):
            ang = k / 10 * 2 * math.pi
            c.line(int(cx_), int(cy_), int(round(cx_ + math.cos(ang) * (r_ - 1.6))),
                   int(round(cy_ + math.sin(ang) * (r_ - 1.6))), 'steel', lum + .1)
        c.ellipse(cx_, cy_, 1.2, 1.2, 'chrome', .85, dith=0)
    # rear (big) wheel, frame, seat, back, arm, footrest, caster
    wx_, wy_ = gx_ + 4, gy_ - 9
    wheel(wx_ + 1, wy_ - 1, 9, .45)                                           # far wheel (offset)
    c.line(wx_ - 12, wy_ - 4, wx_ + 2, wy_ - 4, 'steel', .6)                  # seat rail
    c.poly([(wx_ - 12, wy_ - 7), (wx_ + 3, wy_ - 7), (wx_ + 3, wy_ - 4), (wx_ - 12, wy_ - 4)], 'trench', .62, dith=0)
    for k in range(wx_ - 11, wx_ + 3, 2):
        c.put(k, wy_ - 6, 'trench', .4)
    c.poly([(wx_ + 1, wy_ - 24), (wx_ + 5, wy_ - 25), (wx_ + 5, wy_ - 7), (wx_ + 1, wy_ - 7)], 'trench', .55, dith=0)
    for k in range(wy_ - 23, wy_ - 8, 2):
        c.hline(wx_ + 2, wx_ + 5, k, 'trench', .35)
    c.line(wx_ + 5, wy_ - 25, wx_ + 8, wy_ - 27, 'steel', .65)               # push handle
    c.line(wx_ - 10, wy_ - 13, wx_ + 1, wy_ - 13, 'oak', .6)                  # arm rest
    c.vline(wx_ - 10, wy_ - 13, wy_ - 7, 'steel', .55)
    c.line(wx_ - 12, wy_ - 4, wx_ - 15, wy_ + 4, 'steel', .55)                # leg to footrest
    c.hline(wx_ - 18, wx_ - 14, wy_ + 4, 'steel', .7)
    c.line(wx_ - 8, wy_ - 4, wx_ - 10, wy_ + 6, 'steel', .5)
    c.ellipse(wx_ - 10, wy_ + 7, 2.2, 2.2, 'black', .3, dith=0)               # caster
    c.put(wx_ - 10, wy_ + 7, 'chrome', .7)
    wheel(wx_ - 1, wy_, 9, .6)                                               # near wheel
    c.rect(wx_ - 9, wy_ - 10, wx_ - 1, wy_ - 7, 'slate', .65, dith=0)         # folded blanket on the seat
    c.hline(wx_ - 9, wx_ - 1, wy_ - 10, 'slate', .85)
    WHEEL_R = (wx_ - 20, wy_ - 28, wx_ + 11, gy_ + 2)

    # ------------------------------------------------------------- ward doors --------
    x0, y0, x1, y1 = WARD
    c.rect(x0 - 3, y0 - 3, x1 + 3, y1, 'd_green', .3, dith=0)
    c.hline(x0 - 3, x1 + 3, y0 - 3, 'd_green', .55)
    mid = (x0 + x1) // 2
    for (a, b) in ((x0, mid), (mid, x1)):
        c.rect(a, y0, b, y1, 'cream', hgrad(a, b, .62, .52), dith=.2)
        c.vline(a, y0, y1, 'cream', .72)
        c.vline(b - 1, y0, y1, 'cream', .38)
        c.ellipse((a + b) / 2, y0 + 12, 5, 5, 'steel', .4, dith=0)          # porthole
        c.ellipse((a + b) / 2, y0 + 12, 3.8, 3.8, 'glass', .38, emis=.4, dith=0)
        c.put(int((a + b) / 2) - 2, y0 + 10, 'glass', .85, emis=.6)
        c.rect(a + 2, y1 - 12, b - 2, y1 - 2, 'steel', .5, dith=0)           # kick plates
        c.hline(a + 2, b - 2, y1 - 12, 'steel', .75)
        c.rect(a + 3 if a == x0 else b - 6, y0 + 24, a + 6 if a == x0 else b - 3, y0 + 26, 'chrome', .7, dith=0)
    c.vline(mid, y0, y1, 'black', .2)
    # chain and padlock through the push bars (the ward is locked during the drill)
    for k in range(-6, 7):
        c.put(mid + k, y0 + 25 + (abs(k) % 2), 'steel', .6)
    c.rect(mid - 2, y0 + 26, mid + 2, y0 + 30, 'brass', .55, dith=0)
    c.put(mid - 1, y0 + 26, 'brass', .9)
    c.rect(x0 + 4, y0 - 14, x1 - 4, y0 - 6, 'cream', .7, dith=0)
    D.text(c, x0 + 7, y0 - 13, 'WARD B', 'black', .2)

    # ---------------------------------------------------------- nurses' station -------
    st = STATION
    # roster board on the wall behind the counter: names, a grid and pegs
    rx0, ry0, rx1, ry1 = 334, 36, 366, 64
    c.rect(rx0, ry0, rx1, ry1, 'oak', .4, dith=0)
    c.rect(rx0 + 1, ry0 + 1, rx1 - 1, ry1 - 1, 'black', .22, dith=0)
    D.text(c, rx0 + 3, ry0 + 2, 'ROSTER', 'white', .7)
    for k in range(7):
        yy_ = ry0 + 9 + k * 3
        c.hline(rx0 + 2, rx1 - 2, yy_ + 2, 'slate', .3)
        D.scribble(c, rx0 + 3, yy_, 13, 'white', .62, seed=k + 3)
        for q in range(3):
            if (k * 3 + q) % 4:
                c.put(rx0 + 20 + q * 4, yy_, 'white', .8)
    c.put(rx0 + 28, ry0 + 9 + 3 * 3, 'neonred', .7)               # one red peg: Room 8
    # key board with hooks and keys
    kx0, ky0, kx1, ky1 = 370, 40, 386, 60
    c.rect(kx0, ky0, kx1, ky1, 'oak', .46, dith=0)
    c.hline(kx0, kx1, ky0, 'oak', .7)
    for row in range(3):
        for col in range(4):
            hx_ = kx0 + 2 + col * 4
            hy_ = ky0 + 3 + row * 6
            c.put(hx_, hy_, 'brass', .8)
            if (row * 4 + col) not in (5, 10):
                c.vline(hx_, hy_ + 1, hy_ + 4, 'brass', .62)
                c.put(hx_, hy_ + 4, 'brass', .45)
                c.put(hx_ + 1, hy_ + 2, 'brass', .5)
    c.put(kx0 + 2 + 1 * 4, ky0 + 3 + 1 * 6 + 1, 'black', .3)      # empty hook
    # wall clock above the station (one of Vey's)
    D.clock_face(c, 360.5, 24.5, 6.5, 10, 5, face='paper', face_lum=.9, rim='d_mahog', rim_lum=.5, rim_w=2)
    # the counter, a glass screen, telephone, sign-in book, a medicine trolley
    p.box(c, st['X0'], st['X1'], 0, st['H'], st['Z0'], st['Z1'], 'oak', front=.5, top=.66, side=.35)
    fx0, fy0, fx1, fy1 = [int(round(v)) for v in p.front_rect(st['X0'], st['X1'], 0, st['H'], st['Z1'])]
    for k in range(fx0 + 4, fx1 - 3, 10):
        c.rect(k, fy0 + 4, k + 7, fy1 - 4, 'oak', .44, dith=0)
        c.hline(k, k + 7, fy0 + 4, 'oak', .3)
        c.hline(k, k + 7, fy1 - 5, 'oak', .66)
    c.hline(fx0, fx1, fy0, 'oak', .85)
    c.rect(fx0, fy1 - 3, fx1, fy1, 'oak', .28, dith=0)
    c.rect(fx0 + 14, fy0 + 9, fx0 + 30, fy0 + 15, 'paper', .85, dith=0)       # "PLEASE RING"
    D.text(c, fx0 + 15, fy0 + 10, 'RING', 'ink', .4)
    tx_, ty_ = p.P(352, st['H'], 10)
    from furniture import telephone
    telephone(c, int(tx_), int(ty_))
    bk = p.quad([(366, st['H'], 9), (380, st['H'], 9), (380, st['H'], 16), (366, st['H'], 16)])
    c.poly(bk, 'paper', .8, dith=0)
    a0, a1 = p.P(373, st['H'], 9), p.P(373, st['H'], 16)
    c.line(int(a0[0]), int(a0[1]), int(a1[0]), int(a1[1]), 'paper', .5)
    lx_, ly_ = p.P(336, st['H'], 6)
    c.rect(int(lx_) - 2, int(ly_) - 1, int(lx_) + 2, int(ly_) + 1, 'chrome', .5, dith=0)       # desk bell
    c.ellipse(int(lx_), int(ly_) - 2, 2.5, 1.6, 'chrome', .8, dith=0)
    c.shadow_poly(p.quad([(st['X0'], 0, st['Z1']), (st['X1'], 0, st['Z1']), (st['X1'] + 2, 0, st['Z1'] + 4),
                          (st['X0'] - 2, 0, st['Z1'] + 4)]), .3)

    # ----------------------------------------------------------- the Director's door ---
    x0, y0, x1, y1 = OFFICE
    c.rect(x0 - 4, y0 - 4, x1 + 4, y1, 'd_mahog', .4, dith=0)
    c.hline(x0 - 4, x1 + 4, y0 - 4, 'd_mahog', .7)
    c.rect(x0 - 6, y0 - 8, x1 + 6, y0 - 4, 'd_mahog', .5, dith=0)            # pediment
    c.hline(x0 - 6, x1 + 6, y0 - 8, 'd_mahog', .8)
    c.rect(x0, y0, x1, y1, 'oak', hgrad(x0, x1, .52, .44), dith=.2)
    gx0, gy0, gx1, gy1 = x0 + 3, y0 + 3, x1 - 3, y0 + 22
    c.rect(gx0, gy0, gx1, gy1, 'cream', vgrad(gy0, gy1, .7, .55), emis=.35, dith=.4)
    D.text(c, gx0 + 3, gy0 + 3, 'DR.', 'gold', .7)
    D.text(c, gx0 + 2, gy0 + 9, 'VEY', 'gold', .7)
    c.hline(gx0 + 2, gx1 - 2, gy0 + 16, 'gold', .55)
    for (a, b) in ((x0 + 3, (x0 + x1) // 2 - 1), ((x0 + x1) // 2 + 1, x1 - 3)):
        c.rect(a, gy1 + 4, b, y1 - 3, 'oak', .42, dith=0)
        c.hline(a, b, gy1 + 4, 'oak', .28)
        c.hline(a, b, y1 - 4, 'oak', .64)
        c.vline(b - 1, gy1 + 4, y1 - 3, 'oak', .6)
    c.rect(x1 - 5, 75, x1 - 2, 80, 'brass', .6, dith=0)
    c.put(x1 - 4, 76, 'brass', .95)
    c.put(x1 - 4, 78, 'black', .0)
    c.rect(x0 + 4, y0 - 15, x1 - 4, y0 - 10, 'brass', .6, dith=0)            # RECORDS plate
    c.hline(x0 + 5, x1 - 5, y0 - 13, 'black', .3)
    c.hline(x0 + 6, x1 - 7, y0 - 11, 'black', .3)

    # ------------------------------------------------- service door + laundry cart ----
    # service door on the right end wall (perspective)
    sd = p.quad([(BX1, 0, 30), (BX1, 0, 52), (BX1, 46, 52), (BX1, 46, 30)])
    c.poly(sd, 'steel', .45, dith=0)
    for a_, b_ in zip(sd, sd[1:] + sd[:1]):
        c.line(a_[0], a_[1], b_[0], b_[1], 'steel', .25)
    win_ = p.quad([(BX1, 30, 36), (BX1, 30, 46), (BX1, 40, 46), (BX1, 40, 36)])
    c.poly(win_, 'glass', .35, emis=.3, dith=0)
    lbl = p.quad([(BX1, 42, 34), (BX1, 42, 48), (BX1, 45, 48), (BX1, 45, 34)])
    c.poly(lbl, 'cream', .7, dith=0)
    # the cart: a canvas bin on a steel frame, heaped with sheets
    CT = dict(X0=424, X1=448, Z0=26, Z1=40, H=18)
    c.shadow_poly(p.quad([(CT['X0'] - 2, 0, CT['Z0'] - 1), (CT['X1'] + 2, 0, CT['Z0'] - 1), (CT['X1'] + 3, 0, CT['Z1'] + 3),
                          (CT['X0'] - 3, 0, CT['Z1'] + 3)]), .5)
    cart_front = int(round(p.P(0, 0, CT['Z1'])[1]))
    with sc.obj('laundry_cart', baseline=cart_front):
        for X in (CT['X0'] + 1, CT['X1'] - 2):
            for Z in (CT['Z0'] + 1, CT['Z1'] - 1):
                wx_, wy_ = p.P(X, 0, Z)
                c.ellipse(wx_, wy_ - 1, 1.6, 1.6, 'black', .3, dith=0)
        p.box(c, CT['X0'], CT['X1'], 3, 5, CT['Z0'], CT['Z1'], 'steel', front=.55, top=.6, side=.4)
        for X in (CT['X0'], CT['X1'] - 1):
            for Z in (CT['Z0'], CT['Z1'] - 1):
                p.box(c, X, X + 1, 3, CT['H'], Z, Z + 1, 'steel', front=.6, side=.45)
        p.box(c, CT['X0'], CT['X1'], 5, CT['H'] - 1, CT['Z0'] + .5, CT['Z1'] - .5, 'paper', front=.62, top=.5, side=.45,
              lum_fn=lambda xx, yy: .6 + np.sin(xx * .9) * .04 - (yy % 5 == 0) * .05)
        cfx0, cfy0, cfx1, cfy1 = [int(round(v)) for v in p.front_rect(CT['X0'], CT['X1'], 5, CT['H'], CT['Z1'])]
        c.hline(cfx0, cfx1, cfy0, 'steel', .75)
        c.rect(cfx0 + 4, cfy0 + 4, cfx1 - 4, cfy0 + 8, 'paper', .5, dith=0)
        D.text(c, cfx0 + 3, cfy0 + 4, 'H.H.', 'denim', .4)
        # heap of linen
        Nl = noise2(W, H, 3, 17, 2)
        top_ = p.quad([(CT['X0'] + 1, CT['H'], CT['Z0'] + 1), (CT['X1'] - 1, CT['H'], CT['Z0'] + 1),
                       (CT['X1'] - 1, CT['H'], CT['Z1'] - 1), (CT['X0'] + 1, CT['H'], CT['Z1'] - 1)])
        heap = [(top_[0][0], top_[0][1]), (top_[0][0] + 5, top_[0][1] - 6), (top_[0][0] + 12, top_[0][1] - 8),
                (top_[1][0] - 3, top_[1][1] - 5), (top_[1][0] + 1, top_[1][1] + 1), (top_[2][0] + 1, top_[2][1]),
                (top_[3][0] - 1, top_[3][1])]

        def linen(xx, yy):
            xi = np.clip(xx.astype(int), 0, W - 1)
            yi = np.clip(yy.astype(int), 0, H - 1)
            return .76 + (Nl[yi, xi] - .5) * .4
        c.poly(heap, 'white', linen, dith=.3)
        c.line(int(top_[0][0]) + 4, int(top_[0][1]) - 3, int(top_[1][0]) - 6, int(top_[1][1]) - 1, 'white', .5)
        c.poly([(cfx1 - 9, cfy0), (cfx1 - 3, cfy0), (cfx1 - 4, cfy0 + 10), (cfx1 - 7, cfy0 + 8)], 'white', .72, dith=0)  # a sheet hanging over
        c.vline(cfx1 - 1, cfy0 - 4, cfy0 + 2, 'steel', .6)                       # push handle
        c.hline(cfx1 - 1, cfx1 + 3, cfy0 - 4, 'steel', .7)
    CART_R = (cfx0 - 3, int(top_[0][1]) - 10, cfx1 + 5, cart_front + 2)

    # exposed heating pipes along the top of the wall, dropping to the radiators
    c.rect(BX0, 13, BX1, 16, 'cream', .55, dith=0)
    c.hline(BX0, BX1, 13, 'cream', .75)
    c.hline(BX0, BX1, 16, 'd_green', .25)
    for k in range(BX0 + 14, BX1, 40):
        c.rect(k, 12, k + 2, 17, 'steel', .45, dith=0)
    for (wx0, wy0, wx1, wy1) in WINDOWS:
        c.rect(wx1 + 7, 16, wx1 + 9, 92, 'cream', .5, dith=0)
        c.vline(wx1 + 7, 16, 92, 'cream', .7)
        c.rect(wx1 - 4, 91, wx1 + 9, 93, 'cream', .5, dith=0)

    # framed patients' rules between the second window and the ward doors
    rx0_, ry0_ = 258, 30
    c.rect(rx0_, ry0_, rx0_ + 14, ry0_ + 18, 'wood', .4, dith=0)
    c.rect(rx0_ + 1, ry0_ + 1, rx0_ + 13, ry0_ + 17, 'paper', .78, dith=0)
    c.hline(rx0_ + 3, rx0_ + 11, ry0_ + 3, 'ink', .35)
    for k in range(5):
        c.hline(rx0_ + 2, rx0_ + 12 - (k % 2) * 2, ry0_ + 6 + k * 2, 'ink', .5)
    c.put(rx0_ + 7, ry0_ - 1, 'brass', .8)
    c.shadow_poly([(rx0_ + 14, ry0_ + 1), (rx0_ + 15, ry0_ + 2), (rx0_ + 15, ry0_ + 19), (rx0_ + 1, ry0_ + 19), (rx0_ + 1, ry0_ + 18),
                   (rx0_ + 14, ry0_ + 18)], .3)

    # ------------------------------------------------------------- ceiling globes ------
    for gx in (80, 240, 400):
        c.vline(gx, 0, 8, 'black', .35)
        c.rect(gx - 2, 8, gx + 3, 10, 'brass', .5, dith=0)
        c.ellipse(gx + .5, 15, 6, 5.5, 'cream', radial(gx - 1, 13, 7, 1.0, .75), emis=1, dith=.3)
        c.hline(gx - 3, gx + 4, 20, 'cream', .6, emis=1)
    # smoke still hanging under the ceiling at the Room 8 end

    # wall vent the smoke came through
    c.rect(56, 6, 68, 12, 'steel', .4, dith=0)
    for k in range(7, 12, 2):
        c.hline(57, 67, k, 'black', .25)

    # ------------------------------------------------------------- lighting -----------
    c.ambient = .5
    for gx in (80, 240, 400):
        c.add_light(gx, 18, 110, .45, falloff=1.3)
        c.glow(gx, 15, 18, '#fff4d0', .45)
        c.light_poly([(gx - 5, 21), (gx + 6, 21), (gx + 30, DADO), (gx - 29, DADO)], .07)   # soft cone on the wall
    for (wx0, wy0, wx1, wy1) in WINDOWS:
        c.add_light((wx0 + wx1) // 2, (wy0 + wy1) // 2, 70, .32)
        # daylight through the bars, falling on the floor
        for k, bxk in enumerate(range(wx0 + 2, wx1 - 2, 5)):
            c.light_poly([(bxk + 2, FLOOR + 2), (bxk + 6, FLOOR + 2), (bxk + 12, 138), (bxk + 7, 138)], .3)
        c.glow((wx0 + wx1) // 2, (wy0 + wy1) // 2, 34, '#c0d0d8', .2)
    c.add_light(42, 80, 40, .3)                                          # cold light from Room 8
    c.glow(70, 40, 10, '#ff4040', .3)
    c.shade *= np.clip(1.12 - (np.arange(H)[:, None] - 70) / 200.0, .76, 1)
    c.shade[:, :40] *= np.clip(np.arange(40)[None, :] / 40.0 * .3 + .7, .7, 1)
    c.shade[:, 440:] *= np.clip((480 - np.arange(440, 480)[None, :]) / 40.0 * .3 + .7, .7, 1)

    # ----------------------------------------------------------- animation (bell) ------
    def bell_frame(k):
        def fn(cc):
            off = (-1, 1, -1, 1)[k]
            cc.ellipse(bx + .5 + off * .4, by + .5, 6, 6, 'neonred', radial(bx - 2, by - 2, 8, .8, .4), dith=.2)
            cc.ellipse(bx + .5, by + .5, 2, 2, 'neonred', .3, dith=0)
            cc.put(bx - 2, by - 3, 'neonred', 1.0)
            hx_ = bx + .5 + off * 3
            cc.rect(int(hx_) - 1, by + 4, int(hx_) + 1, by + 6, 'steel', .7, dith=0)         # striker
            if k % 2 == 0:
                for (ax, ay, bx2, by2) in ((bx - 9, by - 3, bx - 11, by - 5), (bx - 9, by + 3, bx - 11, by + 5),
                                          (bx + 10, by - 3, bx + 12, by - 5), (bx + 10, by + 3, bx + 12, by + 5)):
                    cc.line(ax, ay, bx2, by2, 'neonred', .9)
        return fn
    sc.anim('fire_bell', [bell_frame(k) for k in range(4)], fps=12)

    # ---------------------------------------------------------- interaction geometry ---
    x0, y0, x1, y1 = DOOR8
    sc.hotspot('exit_cell', rect=(x0 - 12, y0 - 3, x1 + 3, y1 + 4), walk=(44, 106), face='up')
    sc.hotspot('fire_bell', rect=(bx - 8, by - 8, bx + 9, 77), walk=(72, 106), face='up')
    sc.hotspot('windows', poly=[(98, 24), (151, 24), (151, 85), (199, 85), (199, 24), (252, 24), (252, 88), (98, 88)],
               walk=(124, 106), face='up')
    sc.hotspot('portrait', rect=(px0 - 4, py0 - 4, px1 + 4, py1 + 9), walk=(176, 110), face='up')
    sc.hotspot('wheelchair', rect=WHEEL_R, walk=(262, 116), face='up')
    sc.hotspot('ward_door', rect=(WARD[0] - 3, WARD[1] - 15, WARD[2] + 3, WARD[3]), walk=(297, 106), face='up')
    sc.hotspot('station', rect=(fx0, fy0 - 10, fx1, fy1), walk=(358, 118), face='up')
    sc.hotspot('roster', rect=(rx0 - 1, ry0 - 1, rx1 + 1, ry1 + 1), walk=(350, 118), face='up')
    sc.hotspot('key_hook', rect=(kx0 - 1, ky0 - 1, kx1 + 1, ky1 + 1), walk=(378, 118), face='up')
    sc.hotspot('exit_office', rect=(OFFICE[0] - 6, OFFICE[1] - 15, OFFICE[2] + 6, OFFICE[3]), walk=(417, 106),
               face='up')
    sc.hotspot('laundry_cart', rect=CART_R, walk=(414, 124), face='right')
    # extras
    sc.hotspot('notice', rect=(nx0 - 1, ny0 - 1, nx0 + 19, ny0 + 23), walk=(92, 106), face='up')
    sc.hotspot('service_door', poly=[(int(v[0]), int(v[1])) for v in sd], walk=(463, 106), face='right')

    def W3(X, Z):
        x_, y_ = p.P(X, 0, Z)
        return (int(round(x_)), int(round(y_)))
    fl_poly = [W3(BX0 + 2, 3), W3(st['X0'] - 2, 3), W3(st['X0'] - 2, st['Z1'] + 4), W3(st['X1'] + 2, st['Z1'] + 4),
               W3(st['X1'] + 2, 3), W3(BX1 - 2, 3), W3(BX1 - 2, zfront), W3(BX0 + 2, zfront)]
    holes = [[W3(wcx - 6, wcz - 8), W3(wcx + 26, wcz - 8), W3(wcx + 26, wcz + 12), W3(wcx - 6, wcz + 12)],
             [W3(156, 1), W3(196, 1), W3(196, 13), W3(156, 13)],
             [W3(CT['X0'] - 3, CT['Z0'] - 3), W3(CT['X1'] + 3, CT['Z0'] - 3), W3(CT['X1'] + 3, CT['Z1'] + 3),
              W3(CT['X0'] - 3, CT['Z1'] + 3)],
             [W3(82, 1), W3(100, 1), W3(100, 7), W3(82, 7)]]
    sc.walkable(fl_poly, holes=holes)
    sc.point('start', 44, 108, face='down')
    sc.point('from_office', 417, 108, face='down')
    sc.point('pike_spot', 226, 112, face='up')
    sc.point('cart_spot', 414, 124, face='right')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, round(p.char_scale(FLOOR, 140), 3), 140, 1.0)
    sc.meta['floor'] = 'tile'
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
