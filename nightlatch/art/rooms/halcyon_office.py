"""Chapter 4 - Dr. Lucian Vey's office & records, Halcyon House.  Grey rainy morning.

A mahogany-panelled study that ticks.  Vey collects clocks: a shelf of them runs under the
cornice, a Vienna regulator and a longcase beat on the walls, a metronome waits on the desk.
The filing cabinets are labelled by year; the one marked 1949 holds Rook's file.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
from persp import Persp, plank_floor
import props_d as D

W, H = 320, 144
FLOOR = 96
BX0, BX1 = 44, 276
T_H, T_M = 10, 8          # the time on (almost) every clock

DOOR = (56, 51, 80, FLOOR)
WINDOW = (158, 30, 206, 80)
REG = (218, 30, 232, 78)                # Vienna regulator
MED = (236, 36, 256, 66)                # medicine cabinet (wall)
DESK = dict(X0=150, X1=214, Z0=26, Z1=44, H=20)
CAB = dict(X0=85, w=18, n=4, Z1=14, H=32, years=('1948', '1949', '1950', '1951'))
LONG = dict(X0=258, X1=274, Z0=0, Z1=8, H=50)


def build():
    sc = Scene('halcyon_office', W, H, seed=61)
    c = sc.c
    p = Persp(BX0, BX1, 0, FLOOR, horizon=-60, depth=360)
    zfront = p.z_at_floor_y(H + 2)
    zedge = 112
    fuv = D.floor_uv(p)
    rng = np.random.default_rng(9)

    # ----------------------------------------------------------------- shell ----------
    # back wall: tall upper panels, dado rail, raised-panel wainscot, baseboard
    D.panelling(c, BX0, 5, BX1, 60, 'd_mahog', .44, pw=29, raised=False, margin=3, grain=.05)
    c.rect(BX0, 0, BX1, 5, 'd_mahog', .25, dith=0)                    # cornice
    c.hline(BX0, BX1, 3, 'd_mahog', .55)
    c.hline(BX0, BX1, 4, 'd_mahog', .2)
    D.panelling(c, BX0, 62, BX1, FLOOR - 4, 'd_mahog', .4, pw=22, raised=True, margin=3, grain=.04)
    c.rect(BX0, 59, BX1, 62, 'd_mahog', .55, dith=0)                  # dado rail
    c.hline(BX0, BX1, 59, 'd_mahog', .78)
    c.hline(BX0, BX1, 62, 'd_mahog', .2)
    c.rect(BX0, FLOOR - 4, BX1, FLOOR, 'd_mahog', .3, dith=0)
    c.hline(BX0, BX1, FLOOR - 4, 'd_mahog', .55)
    # side walls (panelled, in perspective)
    for X, sgn in ((BX0, 1), (BX1, -1)):
        f = D.side_uv(p, X)

        def sw(xx, yy, f=f):
            Z, Y, s = f(xx, yy)
            L = np.full(xx.shape, .36, np.float32)
            L = np.where((Z % 26) < 2.2, .5, L)                      # stiles
            L = np.where(((Z % 26) >= 2.2) & ((Z % 26) < 3.6), .24, L)
            L = np.where((Y > 34) & (Y < 37), .5, L)                  # dado rail
            L = np.where((Y < 4), .28, L)
            L = L + np.sin(Z * 1.3 + Y * .2) * .02
            return L
        pts = p.quad([(X, 0, 0), (X, 0, zedge), (X, 220, zedge), (X, 220, 0)])
        c.poly(pts, 'd_mahog', sw, dith=.3)
    # floor: dark oak boards
    plank_floor(c, p, BX0, BX1, 0, zedge, 'wood', base=.46, plank_w=11, seed=8, gap_lum=.2, var=.07)

    # ---------------------------------------------------------- the clock shelf ------
    c.rect(BX0 + 2, 22, BX1 - 2, 25, 'd_mahog', .55, dith=0)
    c.hline(BX0 + 2, BX1 - 2, 22, 'd_mahog', .8)
    c.hline(BX0 + 2, BX1 - 2, 25, 'd_mahog', .15)
    for bxk in range(BX0 + 10, BX1 - 4, 36):
        c.poly([(bxk, 25), (bxk + 3, 25), (bxk + 3, 30), (bxk, 26)], 'd_mahog', .4, dith=0)
    c.shadow_poly([(BX0 + 2, 25), (BX1 - 2, 25), (BX1 - 2, 29), (BX0 + 2, 27)], .35)
    kinds = ['tambour', 'balloon', 'carriage', 'gothic', 'drum', 'dome', 'square', 'lantern', 'tambour',
             'alarm', 'balloon', 'gothic', 'square', 'drum', 'tambour', 'carriage', 'balloon', 'dome', 'gothic']
    cases = ['d_mahog', 'oak', 'wood', 'd_mahog', 'oak', 'wood']
    x = BX0 + 5
    clocks_bbox = []
    for i, k in enumerate(kinds):
        mm = (T_M + int(rng.integers(-2, 3))) % 60
        hh = T_H
        stopped = False
        if i == 12:
            hh, mm, stopped = 10, 40, True          # the one that stopped at twenty to eleven
        bb = D.mantel_clock(c, x, 22, k, hh, mm, case=cases[i % len(cases)], case_lum=.5 + rng.random() * .12,
                            stopped=stopped)
        clocks_bbox.append(bb)
        x = bb[2] + 2 + int(rng.integers(0, 2))
        if x > BX1 - 16:
            break

    # ----------------------------------------------------------------- the door ------
    x0, y0, x1, y1 = DOOR
    c.rect(x0 - 3, y0 - 3, x1 + 3, y1, 'd_mahog', .3, dith=0)
    c.hline(x0 - 3, x1 + 3, y0 - 3, 'd_mahog', .62)
    c.vline(x0 - 3, y0 - 3, y1, 'd_mahog', .5)
    c.rect(x0, y0, x1, y1, 'oak', hgrad(x0, x1, .5, .42), dith=.2)
    gx0, gy0, gx1, gy1 = x0 + 3, y0 + 3, x1 - 3, y0 + 22
    c.rect(gx0 - 1, gy0 - 1, gx1 + 1, gy1 + 1, 'oak', .3, dith=0)
    c.rect(gx0, gy0, gx1, gy1, 'cream', vgrad(gy0, gy1, .8, .66), emis=.8, dith=.4)      # frosted glass, lit corridor
    D.text(c, gx0 + 5, gy0 + 3, 'DR.', 'oak', .25, emis=.5, mirror=True)
    D.text(c, gx0 + 4, gy0 + 10, 'VEY', 'oak', .25, emis=.5, mirror=True)
    c.hline(gx0 + 2, gx1 - 2, gy0 + 17, 'oak', .4, emis=.5)
    # lower panels
    for (a, b) in ((x0 + 3, (x0 + x1) // 2 - 1), ((x0 + x1) // 2 + 1, x1 - 3)):
        c.rect(a, gy1 + 4, b, y1 - 3, 'oak', .4, dith=0)
        c.hline(a, b, gy1 + 4, 'oak', .25)
        c.vline(a, gy1 + 4, y1 - 3, 'oak', .28)
        c.hline(a, b, y1 - 4, 'oak', .62)
        c.vline(b - 1, gy1 + 4, y1 - 3, 'oak', .58)
    c.rect(x1 - 5, 74, x1 - 2, 79, 'brass', .55, dith=0)
    c.put(x1 - 4, 75, 'brass', .95)
    c.put(x1 - 4, 77, 'black', .0)
    c.hline(x0 + 1, x1 - 1, FLOOR - 1, 'cream', .7, emis=1)          # corridor light under the door

    # big round wall clock above the door (sweep second hand animates)
    WC = (68.5, 38.5, 8.5)

    def wall_clock(cc, sec):
        D.clock_face(cc, WC[0], WC[1], WC[2], T_H, T_M, face='paper', face_lum=.9, rim='d_mahog', rim_lum=.55,
                     rim_w=2, sec=sec, sec_ramp='red', sec_lum=.75)
    c.ellipse(WC[0] + 1, WC[1] + 1, WC[2], WC[2], 'd_mahog', .12)
    wall_clock(c, 12)
    c.put(int(WC[0]) - 5, int(WC[1]) - 6, 'paper', 1.0)

    # ----------------------------------------------------------------- the window -----
    wx0, wy0, wx1, wy1 = WINDOW

    def lawn_view(a, b, cc, d):
        # grey rain sky, Gull Hill lawn, poplars, the wall, patients huddled in white (fire drill)
        c.rect(a, b, cc, d, 'fog', vgrad(b, d, .72, .55), emis=.9, dith=.5)
        hz = b + 13
        c.rect(a, hz - 3, cc, hz + 1, 'fog', .45, emis=.85, dith=.4)        # far hills in mist
        for k in range(a, cc):
            hh_ = int(2 * math.sin(k * .21) + 1.5 * math.sin(k * .07))
            c.vline(k, hz - 4 + hh_, hz, 'fog', .38, emis=.85)
        c.rect(a, hz, cc, d, 'grass', vgrad(hz, d, .55, .7), emis=.75, dith=.5)
        c.rect(a, hz + 3, cc, hz + 6, 'concrete', .5, emis=.75, dith=0)      # the perimeter wall
        c.hline(a, cc, hz + 3, 'concrete', .7, emis=.75)
        for tx in (a + 2, a + 30, cc - 4):                                    # poplars
            for t in range(16):
                wdt = int(2.5 * math.sin(math.pi * (t + 1) / 17))
                c.hline(tx - wdt + t // 6, tx + wdt + 1 + t // 6, hz + 4 - t, 'grass', .3 + (t % 3) * .03, emis=.7)
        # gravel path
        c.poly([(a + 18, d), (a + 26, d), (a + 30, hz + 8), (a + 28, hz + 8)], 'paper', .55, emis=.75, dith=.3)
        # patients in white gowns huddled under the trees, a nurse in a dark cape
        for k, (px, ph) in enumerate(((a + 33, 6), (a + 35, 6), (a + 37, 7), (a + 39, 6), (a + 42, 6), (a + 36, 5),
                                      (a + 40, 5))):
            D.tiny_person(c, px - 22, hz + 12 + (k % 3), ph, body='white', body_lum=.85, head='skin', head_lum=.6,
                          legs='white', legs_lum=.6, emis=.8)
        D.tiny_person(c, a + 6, hz + 13, 7, body='night', body_lum=.3, head='skin', head_lum=.6, legs='night',
                      legs_lum=.2, emis=.8, hat='white', hat_lum=.9)
        for k, px in enumerate((cc - 16, cc - 12, cc - 9)):
            D.tiny_person(c, px, hz + 9 + k % 2, 5, body='white', body_lum=.8, head='skin', head_lum=.55,
                          legs='white', legs_lum=.6, emis=.8)
        D.rain_on_pane(c, a, b, cc, d, seed=4, density=.022, ramp_name='fog', lum=.9, emis=.8)
    lawn_view(wx0 + 3, wy0 + 3, wx1 - 3, wy1 - 3)
    # sash frame
    fr = 'cream'
    c.rect(wx0, wy0, wx1, wy0 + 3, fr, .62, dith=0)
    c.rect(wx0, wy1 - 3, wx1, wy1, fr, .5, dith=0)
    c.rect(wx0, wy0, wx0 + 3, wy1, fr, .58, dith=0)
    c.rect(wx1 - 3, wy0, wx1, wy1, fr, .45, dith=0)
    c.rect(wx0 + 3, (wy0 + wy1) // 2 - 1, wx1 - 3, (wy0 + wy1) // 2 + 2, fr, .6, dith=0)    # meeting rail
    for k in (1, 2):
        xx = wx0 + 3 + (wx1 - wx0 - 6) * k // 3
        c.vline(xx, wy0 + 3, wy1 - 3, fr, .5)
    for yy in ((wy0 + (wy0 + wy1) // 2) // 2, ((wy0 + wy1) // 2 + wy1) // 2):
        c.hline(wx0 + 3, wx1 - 3, yy, fr, .5)
    c.rect(wx0 - 3, wy1, wx1 + 3, wy1 + 3, fr, .66, dith=0)          # sill
    c.hline(wx0 - 3, wx1 + 3, wy1 + 3, fr, .3)
    # heavy green velvet drapes + pelmet
    D_ = 'felt'
    for (a, b, side) in ((wx0 - 12, wx0 + 5, 'l'), (wx1 - 5, wx1 + 12, 'r')):
        def drape(xx, yy, a=a, b=b, side=side):
            t = (xx - a) / (b - a)
            fold = np.sin(t * math.pi * 4.2 + (yy - wy0) * .01) * .14
            edge = (t if side == 'l' else 1 - t)
            return .48 + fold - edge * .1 - np.clip((yy - 80) / 40, 0, 1) * .08
        if side == 'l':
            pts = [(a, wy0 - 4), (b, wy0 - 4), (b - 3, 56), (a + 9, 64), (b - 2, FLOOR - 2), (a, FLOOR - 2)]
        else:
            pts = [(a, wy0 - 4), (b, wy0 - 4), (b, FLOOR - 2), (a + 2, FLOOR - 2), (b - 9, 64), (a + 3, 56)]
        c.poly(pts, D_, drape, dith=.3)
    for (tx, ty) in ((wx0 - 4, 62), (wx1 + 4, 62)):                     # gold tie-backs
        c.rect(tx - 3, ty, tx + 3, ty + 2, 'gold', .6, dith=0)
        c.put(tx, ty + 3, 'gold', .5)
    c.rect(wx0 - 14, wy0 - 7, wx1 + 14, wy0 - 2, D_, .4, dith=0)      # pelmet
    c.hline(wx0 - 14, wx1 + 14, wy0 - 7, D_, .62)
    for k in range(wx0 - 13, wx1 + 13, 4):
        c.put(k, wy0 - 2, 'gold', .55)
        c.put(k + 1, wy0 - 1, 'gold', .45)

    # ------------------------------------------------------------ filing cabinets ------
    cx0, cw_, n = CAB['X0'], CAB['w'], CAB['n']
    cab_fronts = []
    for i in range(n):
        X0 = cx0 + i * cw_
        X1 = X0 + cw_ - 1
        p.box(c, X0, X1, 0, CAB['H'], 0, CAB['Z1'], 'oak', front=.5, top=.62, side=.36)
        fx0, fy0, fx1, fy1 = [int(round(v)) for v in p.front_rect(X0, X1, 0, CAB['H'], CAB['Z1'])]
        cab_fronts.append((fx0, fy0, fx1, fy1))
        c.vline(fx1 - 1, fy0, fy1, 'oak', .3)
        c.hline(fx0, fx1, fy0, 'oak', .75)
        dh = (fy1 - fy0 - 2) / 4
        for k in range(4):
            a = int(fy0 + 1 + k * dh)
            b = int(fy0 + 1 + (k + 1) * dh) - 1
            c.rect(fx0 + 1, a, fx1 - 2, b, 'oak', .46, dith=0)
            c.hline(fx0 + 1, fx1 - 2, a, 'oak', .66)
            c.hline(fx0 + 1, fx1 - 2, b, 'oak', .25)
            c.rect(fx0 + 5, b - 3, fx1 - 6, b - 1, 'brass', .6, dith=0)        # cup pull
            c.hline(fx0 + 5, fx1 - 6, b - 1, 'brass', .3)
            if k > 0:
                c.rect(fx0 + 6, a + 1, fx1 - 7, a + 3, 'paper', .6, dith=0)   # label holder
        # year card on the top drawer
        yr = CAB['years'][i]
        a = int(fy0 + 1)
        tw = D.text_w(yr)
        tx0 = fx0 + (fx1 - fx0 - 1 - tw) // 2
        c.rect(tx0 - 1, a + 1, tx0 + tw + 1, a + 8, 'brass', .42, dith=0)        # brass label frame
        c.hline(tx0 - 1, tx0 + tw + 1, a + 1, 'brass', .7)
        c.rect(tx0, a + 2, tx0 + tw, a + 7, 'paper', .7, dith=0)
        D.text(c, tx0, a + 2, yr, 'd_mahog', .2)
    c.shadow_poly(p.quad([(cx0 - 1, 0, CAB['Z1']), (cx0 + n * cw_, 0, CAB['Z1']), (cx0 + n * cw_, 0, CAB['Z1'] + 4),
                          (cx0 - 1, 0, CAB['Z1'] + 4)]), .35)
    # clocks on top of the cabinets
    topy = int(p.P(0, CAB['H'], 7)[1])
    D.mantel_clock(c, 92, topy, 'dome', T_H, T_M, case='d_mahog')
    D.mantel_clock(c, 107, topy, 'carriage', T_H, T_M + 1)
    D.mantel_clock(c, 118, topy, 'alarm', T_H, T_M - 1)
    D.mantel_clock(c, 130, topy, 'lantern', T_H, T_M)
    D.mantel_clock(c, 140, topy, 'drum', T_H, T_M + 1)
    c.rect(118, topy, 128, topy + 1, 'paper', .7, dith=0)            # a stack of index cards

    # diplomas above the cabinets
    def diploma(a, b, cc, d, seal='red'):
        c.rect(a, b, cc, d, 'black', .25, dith=0)
        c.rect(a + 1, b + 1, cc - 1, d - 1, 'gold', .55, dith=0)
        c.hline(a + 1, cc - 1, b + 1, 'gold', .85)
        c.rect(a + 2, b + 2, cc - 2, d - 2, 'paper', .82, dith=0)
        c.hline(a + 4, cc - 4, b + 4, 'black', .35)
        for yy in range(b + 6, d - 5, 2):
            c.hline(a + 4, cc - 4 - (yy % 3), yy, 'paper', .5)
        c.ellipse(cc - 6, d - 5, 2, 2, seal, .6, dith=0)
        c.put(cc - 7, d - 2, seal, .5)
        c.put(cc - 5, d - 2, seal, .5)
        c.shadow_poly([(cc, b + 2), (cc + 2, b + 3), (cc + 2, d + 2), (a + 2, d + 2), (a + 1, d)], .4)
    diploma(91, 32, 109, 46)
    diploma(113, 29, 133, 47, 'brass')
    diploma(137, 32, 153, 46)

    # ------------------------------------------------------------ Vienna regulator -----
    rx0, ry0, rx1, ry1 = REG
    rcx = (rx0 + rx1) / 2
    c.poly([(rx0 - 1, ry0 + 4), (rcx, ry0 - 2), (rx1 + 1, ry0 + 4)], 'd_mahog', .5, dith=0)       # pediment
    c.put(int(rcx), ry0 - 3, 'brass', .8)
    c.rect(rx0, ry0 + 4, rx1, ry1, 'd_mahog', .45, dith=0)
    c.vline(rx0, ry0 + 4, ry1, 'd_mahog', .65)
    c.vline(rx1 - 1, ry0 + 4, ry1, 'd_mahog', .25)
    c.poly([(rx0, ry1), (rx1, ry1), (rcx + 1, ry1 + 5), (rcx - 1, ry1 + 5)], 'd_mahog', .4, dith=0)
    c.put(int(rcx), ry1 + 5, 'brass', .7)
    D.clock_face(c, rcx, ry0 + 12, 5.6, T_H, T_M, face='paper', face_lum=.88, rim='brass', rim_lum=.6)
    TRUNK = (rx0 + 2, ry0 + 20, rx1 - 2, ry1 - 2)

    def reg_trunk(cc, ang):
        a, b, c2, d = TRUNK
        cc.rect(a, b, c2, d, 'd_mahog', .16, dith=0)
        cc.rect(a + 1, b, a + 3, b + 14, 'brass', .45, dith=0)        # weights on their chains
        cc.rect(c2 - 3, b, c2 - 1, b + 12, 'brass', .45, dith=0)
        cc.vline(a + 1, b, b + 14, 'brass', .7)
        cc.vline(c2 - 3, b, b + 12, 'brass', .7)
        D.pendulum(cc, (a + c2) / 2, b, (d - b) - 4, ang, rod='brass', rod_lum=.55, bob='brass', bob_r=2.6, bob_lum=.72)
        cc.line(a, d - 1, a + 3, b + 6, 'glass', .55, emis=.3)        # glass reflection
    reg_trunk(c, 0)
    c.hline(TRUNK[0] - 1, TRUNK[2] + 1, TRUNK[1] - 1, 'brass', .6)

    # ------------------------------------------------------------- medicine cabinet ----
    mx0, my0, mx1, my1 = MED
    c.rect(mx0, my0, mx1, my1, 'white', .55, dith=0)
    c.hline(mx0, mx1, my0, 'white', .8)
    c.vline(mx1 - 1, my0, my1, 'white', .3)
    c.rect(mx0 + 2, my0 + 2, mx1 - 2, my1 - 2, 'glass', .25, dith=0)
    shelves = (my0 + 10, my0 + 19, my1 - 2)
    vial_r = ['glass', 'neonblue', 'lamp', 'glass', 'felt', 'neonblue', 'lamp', 'glass', 'chrome']
    for si, sy in enumerate(shelves):
        c.hline(mx0 + 2, mx1 - 2, sy, 'white', .7)
        xx = mx0 + 3
        while xx < mx1 - 3:
            r_ = vial_r[(xx * 7 + si * 3) % len(vial_r)]
            hgt = 3 + (xx + si) % 4
            c.rect(xx, sy - hgt, xx + 2, sy, r_, .55, emis=.2, dith=0)
            c.put(xx, sy - hgt, r_, .9, emis=.3)
            c.put(xx, sy - hgt - 1, 'black', .3)
            xx += 3
    # a row of identical small vials with white labels: L-7
    for k in range(5):
        c.rect(mx0 + 3 + k * 3, my0 + 5, mx0 + 5 + k * 3, my0 + 10, 'glass', .7, emis=.3, dith=0)
        c.put(mx0 + 3 + k * 3, my0 + 7, 'paper', .95)
        c.put(mx0 + 3 + k * 3, my0 + 4, 'neonred', .5)
    c.line(mx0 + 3, my1 - 3, mx0 + 8, my0 + 3, 'glass', .85, emis=.4)       # glass glint
    c.rect(mx0 + 7, my0 - 6, mx1 - 7, my0, 'white', .7, dith=0)               # red cross plate
    c.rect(mx0 + 9, my0 - 5, mx1 - 9, my0 - 1, 'neonred', .55, dith=0)
    c.put((mx0 + mx1) // 2, my0 - 5, 'white', .9)
    c.put((mx0 + mx1) // 2, my0 - 2, 'white', .9)
    c.put((mx0 + mx1) // 2 - 1, my0 - 3, 'white', .9)
    c.put((mx0 + mx1) // 2 + 1, my0 - 3, 'white', .9)
    c.put((mx0 + mx1) // 2, my0 - 3, 'white', .9)
    c.put((mx0 + mx1) // 2, my0 - 4, 'white', .9)
    c.rect(mx1 - 4, (my0 + my1) // 2 - 2, mx1 - 2, (my0 + my1) // 2 + 2, 'chrome', .6, dith=0)   # catch
    # enamel instrument stand below it (kidney dish, syringe in a tray)
    s0 = p.P(238, 26, 6)
    p.box(c, 238, 254, 22, 24, 1, 10, 'white', front=.5, top=.7, side=.4)
    for X in (239, 252):
        p.box(c, X, X + 1, 0, 22, 8, 9, 'chrome', front=.55)
        p.box(c, X, X + 1, 0, 22, 1, 2, 'chrome', front=.45)
    kx, ky = p.P(242, 24, 5)
    c.ellipse(kx + 2, ky, 3, 1, 'chrome', .7, dith=0)
    sx_, sy_ = p.P(248, 24, 6)
    c.line(int(sx_), int(sy_), int(sx_) + 4, int(sy_) - 1, 'glass', .8, emis=.3)
    c.put(int(sx_) + 5, int(sy_) - 1, 'chrome', .9)

    # ------------------------------------------------------------- longcase clock ------
    L = LONG
    p.box(c, L['X0'], L['X1'], 0, L['H'], L['Z0'], L['Z1'], 'd_mahog', front=.48, top=.6, side=.34)
    lx0, ly0, lx1, ly1 = [int(round(v)) for v in p.front_rect(L['X0'], L['X1'], 0, L['H'], L['Z1'])]
    c.rect(lx0 - 1, ly0 - 2, lx1 + 1, ly0 + 1, 'd_mahog', .6, dith=0)        # hood cornice
    c.hline(lx0 - 1, lx1 + 1, ly0 - 2, 'd_mahog', .8)
    c.put(lx0, ly0 - 3, 'brass', .8)
    c.put(lx1 - 1, ly0 - 3, 'brass', .8)
    c.put((lx0 + lx1) // 2, ly0 - 4, 'brass', .9)
    lcx = (lx0 + lx1) / 2
    c.ellipse(lcx, ly0 + 6, 5.5, 3.5, 'night', .5, dith=0)                   # moon-phase arch
    c.ellipse(lcx - 2, ly0 + 5, 1.5, 1.5, 'paper', .9, dith=0)
    D.clock_face(c, lcx, ly0 + 9.5, 5.4, T_H, T_M, face='paper', face_lum=.86, rim='brass', rim_lum=.62)
    c.vline(lx0, ly0, ly1, 'd_mahog', .66)
    LTR = (lx0 + 4, ly0 + 19, lx1 - 4, ly1 - 12)

    def long_trunk(cc, ang):
        a, b, c2, d = LTR
        cc.rect(a - 1, b - 1, c2 + 1, d + 1, 'brass', .5, dith=0)
        cc.rect(a, b, c2, d, 'd_mahog', .14, dith=0)
        D.pendulum(cc, (a + c2) / 2, b - 6, (d - b) + 2, ang, rod='brass', rod_lum=.5, bob='brass', bob_r=2.4,
                   bob_lum=.75)
        cc.put(a, b + 1, 'glass', .8, emis=.4)
    long_trunk(c, 0)
    c.rect(lx0 + 2, ly1 - 9, lx1 - 2, ly1 - 3, 'd_mahog', .4, dith=0)      # base panel
    c.hline(lx0 + 2, lx1 - 2, ly1 - 9, 'd_mahog', .62)

    # ---------------------------------------------------- bookcase (left side wall) -----
    BK = dict(X0=BX0, X1=BX0 + 10, Z0=16, Z1=52, H=64)
    p.box(c, BK['X0'], BK['X1'], 0, BK['H'], BK['Z0'], BK['Z1'], 'd_mahog', front=.42, top=.55, side=.4)
    Xf = BK['X1']
    shelf_Y = [4, 18, 32, 46, 60]
    book_r = ['red', 'felt', 'denim', 'trench', 'd_mahog', 'red', 'olive', 'denim', 'paper', 'plum']
    for si in range(len(shelf_Y) - 1):
        Ya, Yb = shelf_Y[si] + 1, shelf_Y[si + 1]
        # back of the shelf (dark)
        D.pquad(c, p, [(Xf, Ya, BK['Z0'] + 1), (Xf, Ya, BK['Z1'] - 1), (Xf, Yb, BK['Z1'] - 1), (Xf, Yb, BK['Z0'] + 1)],
                'd_mahog', .12, dith=0)
        Z = BK['Z0'] + 1.5
        while Z < BK['Z1'] - 2:
            th = 1.2 + rng.random() * 1.6
            hb = (Yb - Ya) * (.62 + rng.random() * .32)
            r_ = book_r[int(rng.integers(0, len(book_r)))]
            if rng.random() < .1:
                Z += th
                continue
            D.pquad(c, p, [(Xf, Ya, Z), (Xf, Ya, Z + th), (Xf, Ya + hb, Z + th), (Xf, Ya + hb, Z)], r_,
                    .42 + rng.random() * .2, dith=0)
            bx_, by_ = p.P(Xf, Ya + hb * .7, Z + th / 2)
            c.put(int(bx_), int(by_), 'gold', .7)
            Z += th + .15
        D.pquad(c, p, [(Xf, Yb - 1.4, BK['Z0']), (Xf, Yb - 1.4, BK['Z1']), (Xf, Yb, BK['Z1']), (Xf, Yb, BK['Z0'])],
                'd_mahog', .55, dith=0)
    # phrenology bust on top of the bookcase
    bx_, by_ = p.P(BK['X0'] + 5, BK['H'], 26)
    bx_, by_ = int(bx_), int(by_)
    c.rect(bx_ - 3, by_ - 2, bx_ + 3, by_, 'white', .55, dith=0)
    c.ellipse(bx_, by_ - 8, 4, 5.4, 'white', radial(bx_ + 2, by_ - 11, 7, .85, .45), dith=.2)
    c.line(bx_ - 2, by_ - 12, bx_ + 3, by_ - 9, 'black', .4)
    c.line(bx_ - 3, by_ - 9, bx_ + 1, by_ - 6, 'black', .4)
    c.put(bx_ + 3, by_ - 8, 'skin', .45)

    # ------------------------------------------------------------------ the rug -------
    D.persian_rug(c, p, 92, 238, 30, 82, seed=5, field='red', border='denim', trim='gold')

    # ------------------------------------------------------------ Vey's chair ----------
    # high-backed oxblood leather wing chair, a dark shape against the window
    ch = dict(X0=170, X1=194, Z=14)
    ca = p.P(ch['X0'], 0, ch['Z'])
    cb = p.P(ch['X1'], 0, ch['Z'])
    ctop = p.P(ch['X0'], 38, ch['Z'])[1]
    cxa, cxb = ca[0], cb[0]
    cmid = (cxa + cxb) / 2
    back = [(cxa + 3, ctop + 4), (cxa + 5, ctop + 1), (cmid, ctop - 1), (cxb - 5, ctop + 1), (cxb - 3, ctop + 4),
            (cxb - 3, ca[1]), (cxa + 3, ca[1])]
    c.poly(back, 'blood', lambda xx, yy: .2 + np.where(((xx.astype(int) * 3 + yy.astype(int)) % 7) == 0, .04, 0)
           + np.clip((yy - ctop) / 30, 0, 1) * -.05, dith=.3)
    for side in (-1, 1):                                                        # the wings
        ex = cxa + 1 if side < 0 else cxb - 1
        c.poly([(ex, ctop + 5), (ex - side * 3, ctop + 3), (ex - side * 3, ctop + 16), (ex, ctop + 18)], 'blood',
               .28, dith=0)
    c.line(cxa + 5, ctop + 1, cmid, ctop - 1, 'blood', .5)
    c.line(cmid, ctop - 1, cxb - 5, ctop + 1, 'blood', .42)
    for k in range(int(cxa) + 6, int(cxb) - 4, 4):                             # buttons
        for yy_ in (ctop + 6, ctop + 12):
            c.put(k, yy_, 'blood', .16)
    for k in range(int(cxa) + 5, int(cxb) - 4, 2):                             # brass nails
        c.put(k, int(ctop) + 1 + (1 if abs(k - cmid) > 6 else 0), 'brass', .7)

    # ------------------------------------------------------------------ the desk -------
    dk = DESK
    X0, X1, Z0, Z1, DH = dk['X0'], dk['X1'], dk['Z0'], dk['Z1'], dk['H']
    c.shadow_poly(p.quad([(X0 - 2, 0, Z0 - 2), (X1 + 2, 0, Z0 - 2), (X1 + 3, 0, Z1 + 4), (X0 - 3, 0, Z1 + 4)]), .5)
    p.box(c, X0, X1, 0, DH, Z0, Z1, 'd_mahog', front=.46, top=.6, side=.32,
          lum_fn=lambda xx, yy: .46 + np.sin(xx * 1.9 + yy * .2) * .025)
    fx0, fy0, fx1, fy1 = [int(round(v)) for v in p.front_rect(X0, X1, 0, DH, Z1)]
    # top: green leather inset, moulded edge
    c.hline(fx0, fx1, fy0, 'd_mahog', .82)
    c.hline(fx0, fx1, fy0 + 1, 'd_mahog', .3)
    ins = p.quad([(X0 + 4, DH, Z0 + 3), (X1 - 4, DH, Z0 + 3), (X1 - 4, DH, Z1 - 3), (X0 + 4, DH, Z1 - 3)])
    c.poly(ins, 'felt', .5, dith=.3)
    for a_, b_ in zip(ins, ins[1:] + ins[:1]):
        c.line(a_[0], a_[1], b_[0], b_[1], 'gold', .45)
    # pedestals + drawers on the front, kneehole in the middle
    pw_ = int((fx1 - fx0) * .3)
    for (a, b) in ((fx0 + 2, fx0 + 2 + pw_), (fx1 - 2 - pw_, fx1 - 2)):
        rows = 3
        dh = (fy1 - fy0 - 6) / rows
        for k in range(rows):
            ya = int(fy0 + 3 + k * dh)
            yb = int(fy0 + 3 + (k + 1) * dh) - 1
            c.rect(a, ya, b, yb, 'd_mahog', .44, dith=0)
            c.hline(a, b, ya, 'd_mahog', .64)
            c.hline(a, b, yb, 'd_mahog', .22)
            c.vline(b - 1, ya, yb, 'd_mahog', .28)
            c.rect((a + b) // 2 - 2, (ya + yb) // 2, (a + b) // 2 + 2, (ya + yb) // 2 + 1, 'brass', .65, dith=0)
    ka, kb = fx0 + 3 + pw_, fx1 - 3 - pw_
    c.rect(ka, fy0 + 9, kb, fy1, 'black', .25, dith=0)                       # kneehole
    c.rect(ka + 2, fy0 + 9, kb - 2, fy0 + 11, 'd_mahog', .2, dith=0)
    DRAWER = (ka, fy0 + 3, kb, fy0 + 8)                                      # centre drawer
    c.rect(*DRAWER, 'd_mahog', .48, dith=0)
    c.hline(ka, kb, fy0 + 3, 'd_mahog', .66)
    c.hline(ka, kb, fy0 + 8, 'd_mahog', .22)
    c.rect((ka + kb) // 2 - 3, fy0 + 5, (ka + kb) // 2 + 3, fy0 + 7, 'brass', .6, dith=0)
    c.put((ka + kb) // 2, fy0 + 6, 'black', .0)                              # keyhole
    c.put((ka + kb) // 2 - 3, fy0 + 5, 'brass', .9)
    c.hline(fx0, fx1, fy1 - 1, 'd_mahog', .2)
    # --- on the desk
    # banker's lamp (back left)
    lpx, lpy = p.P(160, DH, 30)
    lpx, lpy = int(lpx), int(lpy)
    c.rect(lpx - 3, lpy - 1, lpx + 4, lpy + 1, 'brass', .5, dith=0)
    c.vline(lpx, lpy - 8, lpy - 1, 'brass', .65)
    c.poly([(lpx - 6, lpy - 8), (lpx + 7, lpy - 8), (lpx + 5, lpy - 11), (lpx - 4, lpy - 11)], 'felt',
           vgrad(lpy - 11, lpy - 8, .6, .85), emis=.45, dith=0)
    c.hline(lpx - 5, lpx + 7, lpy - 8, 'lamp', .9, emis=1)
    c.hline(lpx - 3, lpx + 5, lpy - 11, 'felt', .9, emis=.5)
    # appointment book (open, front right, with a red ribbon)
    ab = p.quad([(190, DH, 33), (208, DH, 33), (208, DH, 42), (190, DH, 42)])
    c.poly(ab, 'paper', .78, dith=0)
    a0, a1 = p.P(199, DH, 33), p.P(199, DH, 42)
    c.line(int(a0[0]), int(a0[1]), int(a1[0]), int(a1[1]), 'paper', .45)
    for Z in (35, 37, 39):
        q0, q1 = p.P(191.5, DH, Z), p.P(198, DH, Z)
        D.scribble(c, int(q0[0]), int(q0[1]), int(q1[0] - q0[0]), 'ink', .4, seed=int(Z))
        q0, q1 = p.P(200, DH, Z), p.P(206.5, DH, Z)
        D.scribble(c, int(q0[0]), int(q0[1]), int(q1[0] - q0[0]), 'ink', .4, seed=int(Z) + 9)
    c.line(int(a1[0]), int(a1[1]), int(a1[0]) + 1, int(a1[1]) + 4, 'red', .6)       # ribbon
    ABOOK = (int(ab[0][0]) - 1, int(ab[0][1]) - 2, int(ab[2][0]) + 2, int(ab[2][1]) + 4)
    # inkstand + pens, a pocket watch hanging from a little stand (for the sessions), files
    ix, iy = p.P(176, DH, 31)
    ix, iy = int(ix), int(iy)
    c.rect(ix - 4, iy - 1, ix + 5, iy + 1, 'brass', .55, dith=0)
    c.rect(ix - 3, iy - 3, ix - 1, iy - 1, 'glass', .3, dith=0)
    c.rect(ix + 2, iy - 3, ix + 4, iy - 1, 'glass', .3, dith=0)
    c.line(ix - 1, iy - 2, ix + 1, iy - 7, 'black', .35)
    c.line(ix + 4, iy - 2, ix + 6, iy - 6, 'black', .35)
    wx_, wy_ = p.P(172, DH, 40)
    wx_, wy_ = int(wx_), int(wy_)
    c.vline(wx_ - 3, wy_ - 9, wy_, 'brass', .55)
    c.hline(wx_ - 3, wx_ + 1, wy_ - 9, 'brass', .65)
    c.vline(wx_, wy_ - 9, wy_ - 6, 'gold', .6)
    D.clock_face(c, wx_ + .5, wy_ - 4.5, 2.2, T_H, T_M, face='paper', face_lum=.9, rim='gold', rim_lum=.8,
                 ticks=False)
    c.rect(wx_ - 5, wy_, wx_ + 2, wy_ + 1, 'brass', .45, dith=0)
    for k in range(3):                                                        # patient files
        q = p.quad([(196, DH + k, 27.5), (209, DH + k, 27.5), (209, DH + k, 31.5), (196, DH + k, 31.5)])
        c.poly(q, 'trench', .62 - k * .04, dith=0)
        c.line(q[3][0], q[3][1], q[2][0], q[2][1], 'trench', .4)
    # metronome (back right corner of the desk)
    MX, MY = [int(v) for v in p.P(186, DH, 29)]
    METRO = (MX, MY)

    def metronome(cc, ang):
        x, y = METRO
        cc.poly([(x - 4, y), (x + 4, y), (x + 2, y - 13), (x - 2, y - 13)], 'wood', hgrad(x - 4, x + 4, .6, .38), dith=0)
        cc.rect(x - 2, y - 11, x + 2, y - 2, 'black', .15, dith=0)
        a = math.radians(ang)
        tx = x + math.sin(a) * 12
        ty = y - 2 - math.cos(a) * 12
        cc.line(x, y - 2, int(round(tx)), int(round(ty)), 'chrome', .8)
        wx2 = x + math.sin(a) * 7
        wy2 = y - 2 - math.cos(a) * 7
        cc.rect(int(round(wx2)) - 1, int(round(wy2)), int(round(wx2)) + 1, int(round(wy2)) + 2, 'brass', .75, dith=0)
        cc.hline(x - 4, x + 4, y, 'wood', .25)
    METRO_SNAP = D.snapshot(c, MX - 8, MY - 16, MX + 9, MY + 1)
    metronome(c, 0)
    DESK_TOP = (fx0, int(p.P(0, DH, Z0)[1]) - 14, fx1, fy0 + 2)

    # ------------------------------------------------- gramophone (right wall) ---------
    GR = dict(X0=258, X1=274, Z0=56, Z1=72, H=20)
    c.shadow_poly(p.quad([(GR['X0'] - 2, 0, GR['Z0'] - 2), (GR['X1'], 0, GR['Z0'] - 2), (GR['X1'], 0, GR['Z1'] + 3),
                          (GR['X0'] - 3, 0, GR['Z1'] + 3)]), .5)
    p.box(c, GR['X0'], GR['X1'], 0, GR['H'], GR['Z0'], GR['Z1'], 'wood', front=.5, top=.62, side=.38)
    gfx0, gfy0, gfx1, gfy1 = [int(round(v)) for v in p.front_rect(GR['X0'], GR['X1'], 0, GR['H'], GR['Z1'])]
    c.rect(gfx0 + 2, gfy0 + 3, gfx1 - 2, gfy1 - 3, 'wood', .4, dith=0)        # cabinet doors
    c.vline((gfx0 + gfx1) // 2, gfy0 + 3, gfy1 - 3, 'wood', .2)
    c.put((gfx0 + gfx1) // 2 - 2, (gfy0 + gfy1) // 2, 'brass', .8)
    c.put((gfx0 + gfx1) // 2 + 1, (gfy0 + gfy1) // 2, 'brass', .8)
    tb = p.P(266, GR['H'], 64)
    tbx, tby = int(tb[0]), int(tb[1])
    c.rect(tbx - 6, tby - 4, tbx + 6, tby, 'wood', .55, dith=0)              # the machine box
    c.hline(tbx - 6, tbx + 6, tby - 4, 'wood', .78)
    c.ellipse(tbx, tby - 5, 5, 1.4, 'black', .2, dith=0)                      # record
    c.put(tbx, tby - 5, 'red', .6)
    c.line(tbx + 4, tby - 6, tbx - 1, tby - 8, 'chrome', .75)                 # tone arm
    c.line(tbx + 4, tby - 6, tbx + 5, tby - 14, 'brass', .6)                  # horn neck
    # flower horn opening towards the room (left)
    hcx, hcy = tbx - 4, tby - 24
    c.poly([(tbx + 5, tby - 14), (tbx + 3, tby - 16), (hcx + 2, hcy + 4), (hcx + 4, hcy + 9)], 'brass', .6, dith=0)
    c.ellipse(hcx, hcy + 3, 6.5, 8.5, 'brass', radial(hcx - 2, hcy, 9, .82, .45), dith=.2)
    c.ellipse(hcx - 1, hcy + 3, 4.2, 6.2, 'brass', .25, dith=0)
    c.ellipse(hcx - 1.5, hcy + 3.5, 2, 3, 'black', .1, dith=0)
    for k in range(-5, 6, 3):
        c.line(hcx + 1, hcy + 3, int(hcx + 1 + k * .2), int(hcy + 3 + k * 1.4), 'brass', .7)
    MUSIC = (hcx - 8, hcy - 6, gfx1 + 1, gfy1)

    # potted aspidistra in the front right corner
    px_, py_ = p.P(58, 0, 62)
    px_, py_ = int(px_), int(py_)
    c.poly([(px_ - 5, py_ - 9), (px_ + 6, py_ - 9), (px_ + 4, py_), (px_ - 3, py_)], 'brick', .5, dith=0)
    c.hline(px_ - 5, px_ + 6, py_ - 9, 'brick', .75)
    for k in range(9):
        ang = -1.9 + k * .45
        L_ = 10 + (k % 3) * 4
        ex, ey = px_ + math.cos(ang) * L_, py_ - 9 + math.sin(ang) * L_ - 6
        c.line(px_, py_ - 9, int(ex), int(ey), 'felt', .55 + (k % 2) * .12)
        c.line(px_ + 1, py_ - 9, int(ex) + 1, int(ey), 'felt', .4)

    # ------------------------------------------------------------------ lighting -------
    c.ambient = .5
    c.add_light(182, 46, 170, .6, falloff=1.1)                    # grey daylight from the window
    c.add_light(110, -30, 200, .3, falloff=1.0)                   # ceiling lamp off-screen
    c.add_light(282, 90, 60, .28)                                 # reflected light on the right wall
    c.add_light(lpx, lpy - 6, 64, .62, falloff=1.3)               # banker's lamp
    c.add_light(lpx, lpy + 2, 46, .35, ystretch=2.5)              # lamp pool on the desk
    c.add_light(72, 62, 40, .22)                                  # frosted door glass
    c.add_light(72, FLOOR + 2, 30, .25, ystretch=3)
    c.glow(lpx, lpy - 8, 22, '#ffd890', .5)
    c.glow(182, 54, 60, '#b8c8d0', .16)
    c.glow(72, 62, 16, '#fff0c8', .2)
    # window light falling across the rug in front of the desk
    c.light_poly([(158, 118), (212, 118), (226, 140), (148, 140)], .1)
    # vignette + corners
    c.shade *= np.clip(1.2 - np.abs(np.arange(W)[None, :] - 170) / 260.0, .74, 1)
    c.shade *= np.clip(1.08 - np.abs(np.arange(H)[:, None] - 60) / 280.0, .82, 1)

    # ------------------------------------------------------------- state objects -------
    with sc.obj('cabinet_open', state=True, depth=107) as cc:
        # the top drawer of the 1949 cabinet pulled right out, label and all
        i = 1
        X0c = cx0 + i * cw_
        X1c = X0c + cw_ - 1
        fx0c, fy0c, fx1c, fy1c = cab_fronts[i]
        dh = (fy1c - fy0c - 2) / 4
        cav = (fx0c + 1, int(fy0c + 1), fx1c - 2, int(fy0c + 1 + dh) - 1)
        cc.rect(*cav, 'black', .04, dith=0)                                   # empty slot
        cc.hline(cav[0], cav[2], cav[1], 'oak', .3)
        Yt, Yb_ = CAB['H'] - 1.5, CAB['H'] - 1 - (CAB['H'] - 2) / 4
        Zo = CAB['Z1'] + 12
        # drawer sides + inside
        for Xs in (X0c + 1, X1c - 2):
            D.pquad(cc, p, [(Xs, Yb_, CAB['Z1'] - 3), (Xs, Yb_, Zo), (Xs, Yt, Zo), (Xs, Yt, CAB['Z1'] - 3)], 'oak', .38,
                    dith=0)
        inside = p.quad([(X0c + 2, Yt, CAB['Z1'] - 3), (X1c - 2, Yt, CAB['Z1'] - 3), (X1c - 2, Yt, Zo), (X0c + 2, Yt, Zo)])
        cc.poly(inside, 'oak', .15, dith=0)
        # hanging files seen from above, tabs sticking up
        for k in range(9):
            Zf = CAB['Z1'] - 2 + k * 1.45
            q0 = p.P(X0c + 2.5, Yt + .4, Zf)
            q1 = p.P(X1c - 2.5, Yt + .4, Zf)
            cc.line(int(q0[0]), int(q0[1]), int(q1[0]), int(q1[1]), 'trench', .58 + (k % 3) * .07)
            tx, ty = p.P(X0c + 3 + (k * 5) % 10, Yt + 1.6, Zf)
            cc.put(int(tx), int(ty), 'paper', .85)
            cc.put(int(tx) + 1, int(ty), 'paper', .8 if k != 4 else .6)
        # one file half drawn up - a red tab: ROOK, T.
        q = p.quad([(X0c + 5, Yt, CAB['Z1'] + 5), (X1c - 4, Yt, CAB['Z1'] + 5), (X1c - 4, Yt + 4, CAB['Z1'] + 5.2),
                    (X0c + 5, Yt + 4, CAB['Z1'] + 5.2)])
        cc.poly(q, 'trench', .8, dith=0)
        tx, ty = q[3]
        cc.rect(int(tx), int(ty), int(tx) + 4, int(ty) + 1, 'neonred', .62, dith=0)
        # drawer front with its label and pull
        ofx0, ofy0, ofx1, ofy1 = [int(round(v)) for v in p.front_rect(X0c + 1, X1c - 1, Yb_, Yt + .5, Zo)]
        cc.rect(ofx0, ofy0, ofx1, ofy1, 'oak', .5, dith=0)
        cc.hline(ofx0, ofx1, ofy0, 'oak', .75)
        cc.hline(ofx0, ofx1, ofy1 - 1, 'oak', .25)
        cc.vline(ofx1 - 1, ofy0, ofy1, 'oak', .3)
        yr = CAB['years'][i]
        tw = D.text_w(yr)
        tx0 = ofx0 + (ofx1 - ofx0 - tw) // 2
        cc.rect(tx0 - 1, ofy0 + 1, tx0 + tw + 1, ofy0 + 8, 'brass', .42, dith=0)
        cc.rect(tx0, ofy0 + 2, tx0 + tw, ofy0 + 7, 'paper', .75, dith=0)
        D.text(cc, tx0, ofy0 + 2, yr, 'd_mahog', .2)
        cc.rect(ofx0 + 5, ofy1 - 4, ofx1 - 6, ofy1 - 2, 'brass', .65, dith=0)
        cc.hline(ofx0 + 5, ofx1 - 6, ofy1 - 2, 'brass', .3)
        cc.shadow_poly([(ofx0, ofy1), (ofx1, ofy1), (ofx1 + 2, ofy1 + 6), (ofx0 + 1, ofy1 + 6)], .3)

    # a few more clocks wherever there is a flat surface
    sx_, sy_ = p.P(246, 24, 5)
    D.mantel_clock(c, int(sx_) - 4, int(sy_), 'alarm', T_H, T_M)
    bt_ = p.P(BK['X0'] + 5, BK['H'], 40)
    D.mantel_clock(c, int(bt_[0]) - 4, int(bt_[1]), 'drum', T_H, T_M - 1, case='d_mahog')

    # ------------------------------------------------------------- animations ----------
    sc.anim('wall_clock', [lambda cc, s=s: wall_clock(cc, s) for s in range(60)], fps=1)
    swing = [math.sin(2 * math.pi * k / 12) for k in range(12)]
    sc.anim('regulator', [lambda cc, a=a: reg_trunk(cc, a * 9) for a in swing], fps=6)
    sc.anim('longcase', [lambda cc, a=a: long_trunk(cc, a * 7) for a in swing[3:] + swing[:3]], fps=6)
    msw = [math.sin(2 * math.pi * k / 8) for k in range(8)]
    sc.anim('metronome', [lambda cc, a=a: (D.restore(cc, METRO_SNAP), metronome(cc, a * 26)) for a in msw], fps=8)

    # ---------------------------------------------------------- interaction geometry ---
    door_walk = (72, 104)
    sc.hotspot('exit_corridor', rect=(x0 - 3, y0 - 3, x1 + 3, y1), walk=door_walk, face='up')
    sc.hotspot('clocks', rect=(BX0 + 2, 4, BX1 - 2, 27), walk=(130, 112), face='up')
    sc.hotspot('cabinets', rect=(cab_fronts[0][0], cab_fronts[0][1] - 14, cab_fronts[-1][2], cab_fronts[0][3]),
               walk=(118, 110), face='up')
    f49 = cab_fronts[1]
    sc.hotspot('cabinet_1949', rect=(f49[0], f49[1], f49[2], f49[3]), walk=(104, 110), face='up')
    sc.hotspot('diplomas', rect=(90, 28, 154, 48), walk=(124, 110), face='up')
    sc.hotspot('window', rect=(wx0 - 2, wy0 - 2, wx1 + 2, 82), walk=(226, 108), face='up')
    sc.hotspot('desk', rect=(fx0, DESK_TOP[1], fx1, fy1), walk=(182, 124), face='up')
    sc.hotspot('drawer', rect=(DRAWER[0] - 1, DRAWER[1] - 1, DRAWER[2] + 1, DRAWER[3] + 2), walk=(182, 124), face='up')
    sc.hotspot('appt_book', rect=ABOOK, walk=(198, 124), face='up')
    sc.hotspot('medicine', rect=(mx0 - 1, my0 - 7, mx1 + 1, my1 + 1), walk=(244, 108), face='up')
    sc.hotspot('music_box', rect=MUSIC, walk=(262, 128), face='right')
    # an extra: the clocks on the walls also answer to 'clocks' via the regulator/longcase hotspots
    sc.hotspot('regulator', rect=(rx0 - 1, ry0 - 3, rx1 + 1, ry1 + 6), walk=(226, 108), face='up')
    sc.hotspot('longcase', rect=(lx0 - 1, ly0 - 4, lx1 + 1, ly1), walk=(258, 110), face='up')

    # walkable floor: in front of the furniture; holes for the desk, the gramophone cabinet
    def W3(X, Z):
        x_, y_ = p.P(X, 0, Z)
        return (int(round(x_)), int(round(y_)))
    fl = [W3(58, 6), W3(86, 6), W3(86, 18), W3(236, 18), W3(236, 12), W3(256, 12), W3(256, 14), W3(274, 14),
          W3(274, zfront), W3(BX0 + 14, zfront), W3(BX0 + 14, 46), W3(58, 46)]
    desk_fp = [W3(X0 - 4, Z0 - 6), W3(X1 + 4, Z0 - 6), W3(X1 + 4, Z1 + 3), W3(X0 - 4, Z1 + 3)]
    gr_fp = [W3(GR['X0'] - 4, GR['Z0'] - 3), W3(276, GR['Z0'] - 3), W3(276, GR['Z1'] + 3), W3(GR['X0'] - 4, GR['Z1'] + 3)]
    plant_fp = [W3(BX0, 56), W3(66, 56), W3(66, 68), W3(BX0, 68)]
    sc.walkable(fl, holes=[desk_fp, gr_fp, plant_fp])
    sc.point('start', *door_walk, face='down')
    sc.point('desk_spot', 182, 124, face='up')
    sc.point('cabinet_spot', 104, 110, face='up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, round(p.char_scale(FLOOR, 140), 3), 140, 1.0)
    sc.meta['floor'] = 'wood'
    sc.rain(wx0 + 3, wy0 + 3, wx1 - 3, wy1 - 3, kind='window')
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
