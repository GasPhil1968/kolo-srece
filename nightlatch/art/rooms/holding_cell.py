"""Holding cell, 1st Precinct (Ch5). Night, one bare bulb outside the bars.

Seen from inside the cell: solid back wall on the left (bunk, high barred window, graffiti),
the cell front of bars on the right with the cell door; beyond the bars the duty corridor:
Pruitt's desk, the key hook by the desk (keys_far), a pillar hook near the bars (keys_near),
a wall clock, a radiator and the door to the front office.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, noise2
from persp import Persp
import furniture as F
import props_c as C

W, H = 320, 144
FLOOR = 100
_V = {}
P = C.P
BX0, BX1 = 140, 296          # bars span (back-plane X)
DOOR = (204, 226)            # cell door within the bars


def key_ring(c, x, y, lum=.7):
    """Big jailer's ring with five keys, hanging from (x, y)."""
    c.put(x, y, 'steel', .85)
    c.ellipse(x + .5, y + 5, 4.2, 4.2, 'brass', lum + .1)
    c.ellipse(x + .5, y + 5, 3.0, 3.0, 'brass', 0.0)
    c.ellipse(x + .5, y + 5, 3.0, 3.0, 'black', .05)
    c.put(x - 3, y + 3, 'brass', 1.0)
    c.put(x - 2, y + 2, 'brass', 1.0)
    for i, (dx, ln) in enumerate(((-4, 7), (-2, 9), (0, 10), (2, 8), (4, 7))):
        kx = x + dx
        top = y + 8 + abs(dx) // 3
        c.vline(kx, top, top + ln, 'steel', lum + .12 - abs(dx) * .03)
        c.rect(kx - 1, top - 1, kx + 1, top + 1, 'steel', lum + .25)              # bow
        c.put(kx + (1 if dx >= 0 else -1), top + ln - 2, 'steel', lum)            # bit
        c.put(kx + (1 if dx >= 0 else -1), top + ln - 1, 'steel', lum - .15)


def build():
    sc = C.SceneC('holding_cell', W, H, seed=53)
    c = sc.c
    p = Persp(44, 296, 0, FLOOR, horizon=-50, depth=360, cx=170)
    zf = p.z_at_floor_y(H + 2)
    by = lambda Z: int(round(p.P(0, 0, Z)[1]))
    bx = lambda X, Z: int(round(p.P(X, 0, Z)[0]))
    ZW = -70                               # far wall of the duty corridor

    # ================================ beyond the bars: the duty corridor ==============================
    fw0 = P(p, 120, 0, ZW)
    fw1 = P(p, 330, 0, ZW)
    # far wall: green dado, cream above
    c.rect(130, 0, 300, fw0[1], 'c_plaster', C.noisy(vgrad(0, fw0[1], .5, .56), W, H, 7, .03, seed=2))
    dado = P(p, 0, 22, ZW)[1]
    c.rect(130, dado, 300, fw0[1], 'c_mint', vgrad(dado, fw0[1], .44, .38))
    c.hline(130, 300, dado, 'c_mint', .25)
    c.hline(130, 300, fw0[1] - 1, 'black', .3)
    # corridor floor (worn lino) between the far wall and the bars
    fl = p.quad([(120, 0, ZW), (330, 0, ZW), (330, 0, 0), (120, 0, 0)])
    hy, cx, E, D = p.hy, p.cx, p.E, p.D

    def cfloor(xx, yy):
        s = np.maximum((yy - hy) / E, 1e-3)
        X = cx + (xx - cx) / s
        Z = D * (1 - 1 / s)
        chk = ((np.floor(X / 14) + np.floor(Z / 14)) % 2 == 0)
        return np.where(chk, .5, .38)
    c.poly(fl, 'c_lino', cfloor)
    # door to the front office (left)
    d0 = P(p, 140, 44, ZW)
    d1 = P(p, 162, 0, ZW)
    c.rect(d0[0] - 2, d0[1] - 2, d1[0] + 2, d1[1], 'steel', .3)
    c.rect(d0[0], d0[1], d1[0], d1[1], 'c_mint', .4)
    c.rect(d0[0] + 3, d0[1] + 4, d1[0] - 3, d0[1] + 14, 'lamp', .5, emis=.8)      # lit office beyond
    for k in range(d0[0] + 4, d1[0] - 3, 3):
        c.vline(k, d0[1] + 4, d0[1] + 14, 'steel', .4)
    c.rect(d1[0] - 4, d0[1] + 20, d1[0] - 2, d0[1] + 23, 'chrome', .7)
    c.hline(d0[0], d1[0], d1[1] - 1, 'lamp', .4, emis=.8)                          # light under it
    # wall clock (2:40 a.m.)
    ckx, cky = P(p, 252, 50, ZW)
    C.round_clock(c, ckx, cky, r=6, hh=2, mm=10, face='paper', rim='steel')
    _V['clock'] = (ckx, cky)
    # notice board + duty roster
    nb0 = P(p, 186, 44, ZW)
    nb1 = P(p, 208, 30, ZW)
    c.rect(nb0[0], nb0[1], nb1[0], nb1[1], 'c_cork', .5)
    c.rect(nb0[0] + 1, nb0[1] + 1, nb0[0] + 7, nb0[1] + 8, 'paper', .75)
    c.rect(nb0[0] + 9, nb0[1] + 2, nb0[0] + 16, nb0[1] + 9, 'paper', .7)
    c.hline(nb0[0] + 2, nb0[0] + 6, nb0[1] + 3, 'black', .3)
    # radiator under it
    r0 = P(p, 222, 16, ZW)
    r1 = P(p, 250, 2, ZW)
    F.radiator(c, r0[0], r0[1], r1[0], r1[1], ramp='c_mint', lum=.5)
    # key hook board by the desk (keys_far hangs here)
    kh = P(p, 296, 36, ZW)
    c.rect(kh[0] - 4, kh[1] - 3, kh[0] + 5, kh[1] + 3, 'oak', .45)
    c.hline(kh[0] - 4, kh[0] + 5, kh[1] - 3, 'oak', .7)
    c.put(kh[0], kh[1], 'steel', .9)
    c.put(kh[0], kh[1] + 1, 'steel', .6)
    c.put(kh[0] + 3, kh[1], 'steel', .7)
    _V['hook_far'] = (kh[0], kh[1] + 1)
    # pin-up calendar by the hook
    cl = P(p, 306, 46, ZW)
    c.rect(cl[0], cl[1], cl[0] + 7, cl[1] + 10, 'paper', .7)
    c.rect(cl[0] + 1, cl[1] + 1, cl[0] + 6, cl[1] + 5, 'skin', .5)
    for ly in range(cl[1] + 6, cl[1] + 10, 2):
        c.hline(cl[0] + 1, cl[0] + 6, ly, 'black', .35)

    # pillar near the bars with a hook (keys_near hangs here)
    PX0, PX1, PZ0, PZ1 = 170, 178, -26, -18
    p.box(c, PX0, PX1, 0, 140, PZ0, PZ1, 'c_plaster', front=.5, top=.5, side=.36)
    p.box(c, PX0 - .5, PX1 + .5, 0, 22, PZ0, PZ1 + .5, 'c_mint', front=.42, side=.3)
    hn = P(p, (PX0 + PX1) / 2, 30, PZ1 + .5)
    c.hline(hn[0] - 1, hn[0] + 2, hn[1], 'steel', .85)
    c.put(hn[0] + 1, hn[1] - 1, 'steel', .7)
    _V['hook_near'] = (hn[0], hn[1] + 1)
    c.rect(hn[0] - 3, hn[1] - 14, hn[0] + 4, hn[1] - 6, 'paper', .62)            # "NO SMOKING" card
    c.hline(hn[0] - 2, hn[0] + 3, hn[1] - 12, 'red', .5)
    c.hline(hn[0] - 2, hn[0] + 2, hn[1] - 9, 'black', .35)

    # Pruitt's desk with a lamp, phone, logbook, mug and a pulp magazine
    DX0, DX1, DZ0, DZ1 = 240, 288, -52, -38
    _V['desk'] = (DX0, DX1, DZ0, DZ1)
    # chair behind the desk (Pruitt sits here)
    chx, chy = P(p, 264, 0, -58)
    c.rect(chx - 6, chy - 26, chx + 6, chy - 13, 'oak', vgrad(chy - 26, chy - 13, .5, .38))
    c.hline(chx - 6, chx + 6, chy - 26, 'oak', .7)
    with sc.obj('duty_desk', baseline=by(DZ1) + 1):
        C.big_desk(c, p, DX0, DX1, DZ0, DZ1, Hd=22, ramp='oak', lum=.46, seed=5)
        lx, ly = P(p, 248, 22, -46)
        c.rect(lx - 1, ly - 6, lx + 1, ly, 'brass', .6)
        c.rect(lx - 3, ly - 1, lx + 3, ly + 1, 'brass', .45)
        c.poly([(lx - 5, ly - 6), (lx + 5, ly - 6), (lx + 4, ly - 9), (lx - 4, ly - 9)], 'c_jade', .75, emis=.45)
        c.hline(lx - 5, lx + 6, ly - 6, 'lamp', .9, emis=1)
        F.telephone(c, *P(p, 282, 22, -46))
        b0 = P(p, 256, 22, -46)
        c.rect(b0[0], b0[1] - 2, b0[0] + 10, b0[1] + 1, 'c_navy', .5)           # logbook
        c.rect(b0[0] + 1, b0[1] - 2, b0[0] + 9, b0[1] - 1, 'paper', .8)
        mg = P(p, 270, 22, -42)
        c.poly([(mg[0] - 4, mg[1]), (mg[0] + 4, mg[1] - 1), (mg[0] + 5, mg[1] + 2), (mg[0] - 3, mg[1] + 3)],
               'c_amber', .7)                                                    # TRUE CASES pulp
        c.rect(mg[0] - 2, mg[1], mg[0] + 2, mg[1] + 2, 'red', .5)
        C.coffee_cup(c, *P(p, 276, 22, -40))
        th = P(p, 262, 22, -44)
        c.rect(th[0] - 1, th[1] - 8, th[0] + 2, th[1], 'c_jade', hgrad(th[0] - 1, th[0] + 2, .7, .4))   # thermos
        c.rect(th[0] - 1, th[1] - 10, th[0] + 2, th[1] - 8, 'steel', .7)
        c.hline(th[0] - 1, th[0] + 2, th[1] - 4, 'steel', .6)
    _V['lamp'] = (lx, ly)

    # snapshot of the corridor before the bars: used to "open" the cell door
    _V['door_snap'] = C.snapshot(c, DOOR[0] - 4, 0, DOOR[1] + 4, FLOOR + 1)

    # ================================ the cell ===================================================
    # solid back wall X 44..140: painted cinder block
    c.rect(44, 0, BX0, FLOOR, 'c_plaster', .52)
    N = noise2(W, H, 5, 7, 2)

    def blocks(xx, yy):
        row = np.floor(yy / 7)
        off = (row % 2) * 8
        mx = ((xx + off) % 16) < 1
        my = (yy % 7) < 1
        L = .54 + (N[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)] - .5) * .12
        return np.where(mx | my, L - .12, L)
    c.rect(44, 0, BX0, FLOOR - 34, 'c_plaster', blocks)

    def blocks_lo(xx, yy):
        return blocks(xx, yy) - .1
    c.rect(44, FLOOR - 34, BX0, FLOOR, 'c_mint', blocks_lo)
    c.rect(44, FLOOR - 35, BX0, FLOOR - 33, 'c_mint', .25)
    # side walls (cell): left and right, same paint
    for X, k in ((44, .86), (296, .8)):
        hi = p.quad([(X, 34, 0), (X, 34, zf), (X, 220, zf), (X, 220, 0)])
        lo = p.quad([(X, 0, 0), (X, 0, zf), (X, 34, zf), (X, 34, 0)])
        c.poly(hi, 'c_plaster', C.noisy(.46 * k, W, H, 5, .04, seed=X))
        c.poly(lo, 'c_mint', C.noisy(.4 * k, W, H, 5, .04, seed=X + 1))
        c.poly(p.quad([(X, 33, 0), (X, 33, zf), (X, 35, zf), (X, 35, 0)]), 'c_mint', .22)
    # concrete floor with a drain
    cf = p.quad([(44, 0, 0), (296, 0, 0), (296, 0, zf), (44, 0, zf)])
    N2 = noise2(W, H, 9, 11, 3)

    def cfl(xx, yy):
        return .5 + (N2[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)] - .5) * .2
    c.poly(cf, 'concrete', cfl)
    dr = P(p, 170, 0, 40)
    c.ellipse(dr[0], dr[1], 4, 1.5, 'black', .3)
    for k in range(-2, 3, 2):
        c.vline(dr[0] + k, dr[1] - 1, dr[1] + 2, 'steel', .45)
    c.ellipse(dr[0] - 6, dr[1] + 2, 7, 2, 'concrete', .36)          # damp stain

    # high barred window with rain (night)
    wx0, wy0, wx1, wy1 = 76, 18, 104, 34
    c.rect(wx0 - 2, wy0 - 2, wx1 + 2, wy1 + 3, 'concrete', .38)
    c.rect(wx0, wy0, wx1, wy1, 'night', vgrad(wy0, wy1, .3, .42), emis=.9, dith=.3)
    c.rect(wx0, wy1 - 5, wx1, wy1, 'brick', .2, emis=.7)
    c.put(wx0 + 6, wy1 - 3, 'lamp', .6, emis=1)
    c.put(wx1 - 5, wy1 - 2, 'lamp', .5, emis=1)
    F.rain_on_glass(c, wx0, wy0, wx1, wy1, seed=4, density=.06)
    for X in range(wx0 + 3, wx1, 5):
        c.vline(X, wy0, wy1, 'steel', .5)
        c.vline(X + 1, wy0, wy1, 'steel', .28)
    c.hline(wx0 - 2, wx1 + 2, wy1 + 2, 'concrete', .55)
    # rain trickle stain down the wall from the window
    c.modulate(wx0 + 4, wy1 + 3, wx0 + 9, FLOOR - 36, lambda xx, yy: .9 - .04 * np.sin(yy * .7))

    # graffiti scratched into the paint
    G = 'c_plaster'
    gl = .78
    # somebody's calendar: thirty days scratched off
    gx0, gy0 = 47, 38
    for r in range(6):
        c.hline(gx0, gx0 + 25, gy0 + r * 4, G, gl - .04)
    for k in range(7):
        c.vline(gx0 + k * 4, gy0, gy0 + 21, G, gl - .04)
    for r in range(5):
        for k in range(6):
            x_, y_ = gx0 + k * 4 + 1, gy0 + r * 4 + 1
            c.put(x_, y_, G, gl)
            c.put(x_ + 2, y_ + 2, G, gl)
            c.put(x_ + 1, y_ + 1, G, gl)
            c.put(x_ + 2, y_, G, gl - .08)
            c.put(x_, y_ + 2, G, gl - .08)
    # anchor (Barnaby's?)
    ax, ay = 120, 44
    c.vline(ax, ay, ay + 9, G, gl)
    c.hline(ax - 2, ax + 3, ay + 2, G, gl)
    c.ellipse(ax + .5, ay - 1, 1.4, 1.4, G, gl)
    c.ellipse(ax + .5, ay - 1, .6, .6, 'c_plaster', .5)
    c.line(ax - 4, ay + 6, ax, ay + 9, G, gl)
    c.line(ax + 4, ay + 6, ax, ay + 9, G, gl)
    C.text(c, 76, 54, 'REPENT', G, gl)
    C.text(c, 80, 40, 'B.T.', G, gl - .05)
    C.text(c, 80, 46, '3/49', G, gl - .05)
    C.text(c, 96, 44, 'J.K.', G, gl - .08)
    # freshly pencilled, dark graphite
    C.text(c, 108, 20, 'DELANEY', 'slate', .22, slant=.03)
    C.text(c, 108, 27, 'IS A RAT', 'slate', .22, slant=.03)
    c.line(108, 34, 137, 35, 'slate', .3)
    _V['graffiti'] = (45, 18, 139, 62)

    # iron bunk bolted to the back wall, thin striped mattress
    KX0, KX1, KZ0, KZ1 = 50, 132, 0, 18
    KH = 13
    for X in (KX0 + 1, KX1 - 3):
        p.box(c, X, X + 2, 0, KH, KZ1 - 3, KZ1 - 1, 'steel', front=.38, side=.28)
    p.box(c, KX0, KX1, KH - 3, KH, KZ0, KZ1, 'steel', front=.42, top=.45, side=.3)
    mat_top = p.quad([(KX0 + 1, KH + 3, KZ0 + 1), (KX1 - 1, KH + 3, KZ0 + 1), (KX1 - 1, KH + 3, KZ1 - 1), (KX0 + 1, KH + 3, KZ1 - 1)])
    Nm = noise2(W, H, 3, 21, 2)

    def ticking(xx, yy):
        st = np.where((xx.astype(int) % 4) < 1, -.08, 0)
        n = (Nm[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)] - .5) * .2
        sag = -np.clip(1 - np.abs(xx - 95) / 30, 0, 1) * .06
        return .5 + st + n + sag
    c.poly(mat_top, 'c_tan', ticking)
    m0 = P(p, KX0 + 1, KH + 3, KZ1 - 1)
    m1 = P(p, KX1 - 1, KH, KZ1 - 1)
    c.rect(m0[0], m0[1], m1[0], m1[1] + 1, 'c_tan', vgrad(m0[1], m1[1], .44, .32))
    for k in range(m0[0], m1[0], 4):
        c.vline(k, m0[1], m1[1] + 1, 'c_tan', .26)
    c.hline(m0[0], m1[0], m0[1], 'c_tan', .66)
    c.hline(m0[0], m1[0], m1[1] + 1, 'c_tan', .2)
    c.ellipse(m0[0] + 30, m0[1] - 3, 6, 1.6, 'c_tan', .34)            # old stain
    # stained pillow
    pl = p.quad([(KX0 + 3, KH + 5, 2), (KX0 + 18, KH + 5, 2), (KX0 + 18, KH + 5, 9), (KX0 + 3, KH + 5, 9)])
    c.poly(pl, 'paper', .58)
    pc = P(p, KX0 + 10, KH + 5, 5)
    c.ellipse(pc[0] + 2, pc[1], 2.5, 1, 'c_amber', .36)
    c.hline(P(p, KX0 + 3, 0, 9)[0], P(p, KX0 + 18, 0, 9)[0], P(p, 0, KH + 5, 9)[1], 'paper', .75)
    # chains holding the bunk to the wall
    for X in (KX0 + 4, KX1 - 4):
        a = P(p, X, 34, 0)
        b = P(p, X, KH, KZ1 - 2)
        for t in range(0, 12):
            xq = int(round(a[0] + (b[0] - a[0]) * t / 11))
            yq = int(round(a[1] + (b[1] - a[1]) * t / 11))
            c.put(xq, yq, 'steel', .6 if t % 2 else .4)
        c.rect(a[0] - 1, a[1] - 1, a[0] + 2, a[1] + 1, 'steel', .5)
    _V['bunk'] = (KX0, KX1, KZ0, KZ1, KH)

    # slop bucket in the front-left corner
    bk = P(p, 54, 0, 52)
    kk = p.s(52)
    bw = int(6 * kk)
    c.poly([(bk[0] - bw, bk[1] - 12), (bk[0] + bw, bk[1] - 12), (bk[0] + bw - 2, bk[1]), (bk[0] - bw + 2, bk[1])],
           'steel', hgrad(bk[0] - bw, bk[0] + bw, .78, .38))
    c.vline(bk[0] - bw + 1, bk[1] - 11, bk[1] - 1, 'steel', .95)
    c.ellipse(bk[0], bk[1] - 12, bw, 2, 'steel', .85)
    c.ellipse(bk[0], bk[1] - 12, bw - 1.5, 1.2, 'black', .2)
    c.hline(bk[0] - bw + 1, bk[0] + bw - 1, bk[1] - 7, 'steel', .4)
    c.line(bk[0] - bw, bk[1] - 12, bk[0] - 2, bk[1] - 18, 'steel', .55)            # handle
    c.line(bk[0] - 2, bk[1] - 18, bk[0] + bw, bk[1] - 12, 'steel', .5)
    c.hline(bk[0] - bw + 2, bk[0] + bw - 2, bk[1], 'black', .2)
    _V['bucket'] = (bk[0] - bw - 1, bk[1] - 19, bk[0] + bw + 1, bk[1] + 1)
    # tin plate with cold beans + spoon, a crumpled sports page
    tp = P(p, 140, 0, 24)
    c.ellipse(tp[0], tp[1] - 1, 5, 1.6, 'steel', .6)
    c.ellipse(tp[0], tp[1] - 1, 3.4, 1, 'c_mud', .5)
    c.line(tp[0] + 3, tp[1] - 2, tp[0] + 7, tp[1] - 4, 'steel', .8)
    np_ = p.quad([(98, .1, 30), (114, .1, 28), (116, .1, 36), (100, .1, 38)])
    c.poly(np_, 'paper', .5)
    c.line(*P(p, 101, 0, 31), *P(p, 112, 0, 30), 'paper', .32)
    c.line(*P(p, 102, 0, 34), *P(p, 113, 0, 33), 'paper', .32)
    # tallies scratched on the right wall
    for k in range(9):
        a_ = P(p, 296, 46, 8 + k * 2.2)
        b_ = P(p, 296, 38, 8 + k * 2.2)
        c.line(a_[0], a_[1], b_[0], b_[1], 'c_plaster', .62)
    a_ = P(p, 296, 40, 6)
    b_ = P(p, 296, 45, 18)
    c.line(a_[0], a_[1], b_[0], b_[1], 'c_plaster', .62)
    # tin cup + cigarette butts
    tc = P(p, 150, 0, 30)
    c.rect(tc[0], tc[1] - 3, tc[0] + 3, tc[1], 'steel', .62)
    c.vline(tc[0], tc[1] - 3, tc[1], 'steel', .85)
    for (X, Z) in ((120, 34), (128, 30), (236, 44)):
        x_, y_ = P(p, X, 0, Z)
        c.hline(x_, x_ + 2, y_, 'paper', .7)

    # the bulb outside the bars (key light)
    BLX, BLY = P(p, 196, 74, -30)
    c.vline(BLX, 0, BLY - 4, 'black', .45)
    c.rect(BLX - 2, BLY - 5, BLX + 3, BLY - 2, 'steel', .45)
    c.ellipse(BLX + .5, BLY, 2.6, 3, 'lamp', .97, emis=1)
    c.put(BLX - 1, BLY - 1, 'lamp', 1.0, emis=1)
    _V['bulb'] = (BLX, BLY)

    # ================================ the bars (cell front) ======================================
    top_band = P(p, 0, 74, 0)[1]
    low_band = P(p, 0, 8, 0)[1]
    _V['bands'] = (top_band, low_band)

    def bar(cc, X, y0=0, y1=FLOOR, body=.24, rim=.8):
        """Backlit round bar, green paint over rust: dark body, rim light on the side facing the bulb."""
        rr = X < BLX
        cc.vline(X, y0, y1, 'c_mint', (body if rr else rim) * .9)
        cc.vline(X + 1, y0, y1, 'c_mint', (rim if rr else body) * .9)
        for k in range(5):                                       # rust where the paint has flaked
            yy_ = y0 + 6 + ((X * 37 + k * 53) % max(1, (y1 - y0 - 8)))
            cc.put(X + (k % 2), yy_, 'rust', .55)
            if k % 2:
                cc.put(X + (k % 2), yy_ + 1, 'rust', .4)

    def band(cc, x0, x1, yb):
        cc.rect(x0, yb - 1, x1, yb + 2, 'c_mint', .28)
        cc.hline(x0, x1, yb - 1, 'c_mint', .66)
        cc.hline(x0, x1, yb + 1, 'c_mint', .16)
        for X in range(x0 + 2, x1, 6):
            cc.put(X, yb, 'c_mint', .8)
        for X in range(x0 + 5, x1, 17):
            cc.put(X, yb + 1, 'rust', .5)

    def door_panel(cc, dx):
        """The sliding cell door, shifted dx px to the right."""
        x0, x1 = DOOR[0] + dx, DOOR[1] + dx
        for X in range(x0 + 2, x1 - 1, 5):
            bar(cc, X, 4, FLOOR - 2)
        for X in (x0, x1 - 2):
            bar(cc, X, 4, FLOOR - 2, body=.3, rim=.85)
        for yb in (top_band, low_band):
            band(cc, x0, x1, yb)
        cc.rect(x0, FLOOR - 3, x1, FLOOR - 1, 'steel', .3)
        lb0, lb1 = x0, x0 + 8
        ly0 = P(p, 0, 34, 0)[1]
        cc.rect(lb0, ly0, lb1, ly0 + 9, 'steel', hgrad(lb0, lb1, .56, .3))
        cc.hline(lb0, lb1, ly0, 'steel', .85)
        cc.vline(lb0, ly0, ly0 + 9, 'steel', .7)
        cc.rect(lb0 + 3, ly0 + 3, lb0 + 5, ly0 + 6, 'black', .05)
        cc.put(lb0 + 4, ly0 + 7, 'black', .1)
        cc.put(lb0 + 6, ly0 + 2, 'brass', .7)

    bars_x = []
    for X in range(BX0 + 4, BX1 - 2, 6):
        if DOOR[0] - 4 <= X <= DOOR[1] + 2:
            continue
        bars_x.append(X)
    _V['bars_x'] = bars_x

    def fixed_bars(cc, xlo=0, xhi=W):
        for X in (BX0 - 2, BX1 - 1, DOOR[0] - 3, DOOR[1] + 1):
            if xlo - 4 <= X <= xhi:
                cc.rect(X, 0, X + 3, FLOOR, 'c_mint', .24)
                bar(cc, X + (0 if X < BLX else 1), 0, FLOOR, body=.26, rim=.82)
        for X in bars_x:
            if xlo - 2 <= X <= xhi:
                bar(cc, X)
        for yb in (top_band, low_band):
            band(cc, max(BX0 - 2, xlo - 3), min(BX1 + 3, xhi + 3), yb) if xlo > 0 else None
        if xlo <= 0:
            for yb in (top_band, low_band):
                band(cc, BX0 - 2, DOOR[0] - 3, yb)
                band(cc, DOOR[1] + 1, BX1 + 3, yb)
    _V['fixed_bars'] = fixed_bars

    with sc.obj('bars', baseline=FLOOR + 1):
        # sliding-door track above the door (runs to the right, over the fixed bars)
        c.rect(DOOR[0] - 4, 4, DOOR[1] + 30, 7, 'steel', .34)
        c.hline(DOOR[0] - 4, DOOR[1] + 30, 4, 'steel', .7)
        for X in range(DOOR[0], DOOR[1] + 28, 9):
            c.put(X, 5, 'steel', .85)
        fixed_bars(c)
        # top beam + floor rail
        c.rect(BX0 - 2, 0, BX1 + 3, 3, 'steel', .32)
        c.hline(BX0 - 2, BX1 + 3, 3, 'steel', .15)
        c.rect(BX0 - 2, FLOOR - 1, BX1 + 3, FLOOR + 1, 'steel', .4)
        c.hline(BX0 - 2, BX1 + 3, FLOOR - 1, 'steel', .66)
    # the sliding door panel is part of the background only (cell_open replaces it)
    door_panel(c, 0)

    # ================================ lighting ==================================================
    # shadows of the bars fanning across the cell floor (light at the bulb, X 196, Z -30)
    LXw, LZw = 196.0, -30.0
    for X in bars_x + [DOOR[0] - 2, DOOR[1] + 1, BX0, BX1]:
        Xc = X + .5
        dxw, dzw = Xc - LXw, 0 - LZw
        t1 = (zf + 4) / dzw
        q = [(Xc - .8, 0, 0.5), (Xc + .8, 0, .5), (Xc + .8 + dxw * t1 * 1.08, 0, zf + 4), (Xc - .8 + dxw * t1 * .92, 0, zf + 4)]
        c.shadow_poly(p.quad(q), .45)
    # shadow of the bunk and bucket
    c.shadow_poly(p.quad([(KX0, 0, KZ0), (KX1, 0, KZ0), (KX1 + 3, 0, KZ1 + 3), (KX0, 0, KZ1 + 3)]), .5)
    c.shadow_ellipse(bk[0], bk[1], 8, 2.5, .45)
    # the duty desk and pillar cast shadows on the corridor floor
    c.shadow_poly(p.quad([(DX0, 0, DZ0), (DX1, 0, DZ0), (DX1 + 6, 0, DZ1 + 4), (DX0 + 4, 0, DZ1 + 4)]), .45)
    c.shadow_poly(p.quad([(PX0, 0, PZ0), (PX1, 0, PZ0), (PX1 - 6, 0, PZ1 + 10), (PX0 - 8, 0, PZ1 + 10)]), .4)
    xx = np.arange(W)[None, :].astype(np.float32)
    yy = np.arange(H)[:, None].astype(np.float32)
    vign = np.clip(1.25 - np.hypot((xx - 190) / 220.0, (yy - 60) / 160.0), .45, 1)
    c.shade *= vign.astype(np.float32)
    c.ambient = .24
    c.add_light(BLX, BLY + 2, 190, 1.15, falloff=1.35)
    c.add_light(BLX, by(-10), 90, .45, ystretch=2.2)
    c.add_light(lx, ly - 6, 46, .7, falloff=1.4)
    c.add_light((wx0 + wx1) // 2, wy1, 60, .3)                      # cold window light
    c.add_light((d0[0] + d1[0]) // 2, d1[1], 24, .3, ystretch=2.5)  # light under the office door
    c.glow(BLX, BLY, 30, '#ffc070', .6)
    c.glow(lx, ly - 7, 14, '#ffc070', .4)
    c.glow((wx0 + wx1) // 2, (wy0 + wy1) // 2, 16, '#6080c0', .25)

    # ================================ state objects =============================================
    def redraw_bars(cc, x0, x1):
        """Bars in front of a state object: repaint them with owner 0 so they cut the sprite."""
        oid = cc.cur_owner
        cc.cur_owner = 0
        _V['fixed_bars'](cc, x0, x1)
        cc.cur_owner = oid

    hfx, hfy = _V['hook_far']
    with sc.obj('keys_far', state=True, depth=by(ZW) + 1) as cc:
        key_ring(cc, hfx, hfy, lum=.62)
        redraw_bars(cc, hfx - 6, hfx + 6)
    hnx, hny = _V['hook_near']
    with sc.obj('keys_near', state=True, depth=by(PZ1) + 1) as cc:
        key_ring(cc, hnx, hny, lum=.66)
        redraw_bars(cc, hnx - 6, hnx + 6)
    with sc.obj('blanket', state=True, depth=by(KZ1) + 1) as cc:
        # grey army blanket, rumpled at the foot of the bunk and hanging over the edge
        t0 = P(p, KX1 - 34, KH + 4, KZ0 + 3)
        t1 = P(p, KX1 - 2, KH + 4, KZ0 + 3)
        t2 = P(p, KX1 - 1, KH + 4, KZ1)
        t3 = P(p, KX1 - 36, KH + 4, KZ1)
        heap = [(t0[0] + 2, t0[1] - 1), (t0[0] + 10, t0[1] - 3), (t0[0] + 20, t0[1] - 2), (t1[0], t1[1] - 1),
                (t2[0] + 1, t2[1]), (t3[0], t3[1])]
        cc.poly(heap, 'slate', C.noisy(vgrad(t0[1] - 3, t2[1], .56, .44), W, H, 2, .05, seed=3))
        # fold ridges
        cc.line(t0[0] + 6, t0[1], t0[0] + 14, t3[1] - 1, 'slate', .66)
        cc.line(t0[0] + 7, t0[1] + 1, t0[0] + 15, t3[1], 'slate', .3)
        cc.line(t0[0] + 18, t0[1] - 1, t0[0] + 24, t3[1] - 1, 'slate', .64)
        cc.line(t0[0] + 19, t0[1], t0[0] + 25, t3[1], 'slate', .3)
        # the part hanging over the front edge, wavy hem
        fy = t3[1]
        hang = [(t3[0], fy), (t2[0] + 1, fy)]
        hem = []
        for i, x in enumerate(range(t2[0] + 1, t3[0] - 1, -3)):
            hem.append((x, fy + 9 + (2 if i % 2 else 0)))
        cc.poly(hang + hem, 'slate', vgrad(fy, fy + 11, .5, .34))
        for x in range(t3[0] + 3, t2[0], 5):
            cc.vline(x, fy + 1, fy + 8, 'slate', .3)
            cc.vline(x + 1, fy + 1, fy + 7, 'slate', .6)
        cc.line(t3[0], fy + 6, t2[0], fy + 7, 'red', .38)                  # faded stripe
        cc.hline(t3[0], t2[0] + 1, fy, 'slate', .7)
        pts = [t0, t1, t2, t3]
        fr0, fr1 = (t3[0], fy), (t2[0], fy + 9)
    _V['blanket'] = (fr0[0] - 1, pts[0][1] - 2, fr1[0] + 1, fr1[1] + 3)
    with sc.obj('cell_open', state=True, depth=FLOOR) as cc:
        # the door slid open to the right, behind the fixed bars
        m = np.zeros((H, W), bool)
        m[8:FLOOR - 1, DOOR[0]:DOOR[1]] = True
        C.restore(cc, _V['door_snap'], mask=m)
        for yb in _V['bands']:                       # the bands belong to the door: gone too
            m2 = np.zeros((H, W), bool)
            m2[yb - 1:yb + 2, DOOR[0]:DOOR[1]] = True
            C.restore(cc, _V['door_snap'], mask=m2)
        door_panel(cc, DOOR[1] - DOOR[0] + 3)
        oid = cc.cur_owner
        cc.cur_owner = 0
        _V['fixed_bars'](cc, DOOR[1], DOOR[1] + 2 * (DOOR[1] - DOOR[0]) + 6)
        cc.cur_owner = oid

    # ================================ anim: a moth around the bulb ===============================
    def moth(k):
        def f(cc):
            a = k / 8 * math.tau
            mx = BLX + math.cos(a) * 6
            my = BLY + math.sin(a * 2) * 3 - 1
            cc.put(int(round(mx)), int(round(my)), 'paper', .55)
            cc.put(int(round(mx)) + (1 if k % 2 else -1), int(round(my)), 'paper', .4)
        return f
    sc.anim('moth', [moth(k) for k in range(8)], fps=10)

    # ================================ interaction ===============================================
    sc.hotspot('bars', rect=(BX0 - 2, 6, DOOR[0] - 4, FLOOR), walk=(bx(170, 6), by(6)), face='up')
    sc.hotspot('cell_door', rect=(DOOR[0] - 4, 6, DOOR[1] + 4, FLOOR + 1), walk=(bx(215, 6), by(6)), face='up')
    sc.hotspot('keys', rect=(hfx - 5, hfy - 2, hfx + 6, hfy + 16), walk=(bx(262, 6), by(6)), face='up')
    sc.hotspot('keys_near', rect=(hnx - 5, hny - 2, hnx + 6, hny + 16), walk=(bx(178, 6), by(6)), face='up')
    k0 = P(p, DX0, 30, DZ0)
    k1 = P(p, DX1, 0, DZ1)
    sc.hotspot('desk', rect=(k0[0], k0[1], k1[0], k1[1]), walk=(bx(262, 6), by(6)), face='up')
    sc.hotspot('blanket', rect=_V['blanket'], walk=(bx(118, KZ1 + 8), by(KZ1 + 8)), face='up')
    b0 = P(p, KX0, KH + 6, KZ0)
    b1 = P(p, KX1, 0, KZ1)
    sc.hotspot('bunk', rect=(b0[0], b0[1], b1[0], b1[1]), walk=(bx(90, KZ1 + 8), by(KZ1 + 8)), face='up')
    sc.hotspot('bucket', rect=_V['bucket'], walk=(bx(66, 50), by(50)), face='left')
    sc.hotspot('graffiti', rect=_V['graffiti'], walk=(bx(96, KZ1 + 8), by(KZ1 + 8)), face='up')
    sc.hotspot('window', rect=(wx0 - 3, wy0 - 3, wx1 + 3, wy1 + 4), walk=(bx(90, KZ1 + 8), by(KZ1 + 8)), face='up')
    sc.hotspot('clock', rect=(ckx - 8, cky - 8, ckx + 9, cky + 9), walk=(bx(200, 6), by(6)), face='up')

    floor = [P(p, 46, 0, 3), P(p, 294, 0, 3), P(p, 294, 0, zf), P(p, 46, 0, zf)]
    floor = [(min(max(x, 0), W), min(max(y, 0), H)) for x, y in floor]
    holes = [[P(p, KX0 - 2, 0, 0), P(p, KX1 + 2, 0, 0), P(p, KX1 + 2, 0, KZ1 + 3), P(p, KX0 - 2, 0, KZ1 + 3)],
             [P(p, 46, 0, 46), P(p, 62, 0, 46), P(p, 62, 0, 58), P(p, 46, 0, 58)]]
    sc.walkable(floor, holes=holes)
    sc.point('start', bx(200, 34), by(34), 'up')
    sc.point('wake', bx(180, 30), by(30), 'down')
    sc.point('barnaby_spot', bx(72, KZ1 + 3), by(KZ1 + 3), 'right')
    sc.point('bars_spot', bx(178, 6), by(6), 'up')
    sc.point('pruitt_spot', bx(264, -56), by(-56), 'down')
    # NPC beyond the bars: perspective scale (the room's linear scale would be extrapolated)
    sc.meta['points']['pruitt_spot']['scale'] = round(p.char_scale(by(-56), 140), 3)
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, round(p.char_scale(FLOOR, 140), 3), 140, 1.0)
    sc.meta['floor'] = 'stone'
    sc.rain(wx0, wy0, wx1, wy1, kind='window')
    C.order_hotspots(sc, ['keys_near', 'keys', 'clock', 'desk', 'cell_door', 'bars', 'blanket', 'bunk', 'window',
                          'graffiti', 'bucket'])
    C.check(sc, npc=('barnaby_spot', 'pruitt_spot'))
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
