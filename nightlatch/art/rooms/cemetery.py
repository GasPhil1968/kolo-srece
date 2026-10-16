"""St. Brigid's churchyard (Ch3, Ch6). Overcast, fog, crows.

Ground-plane perspective (horizon y=30).  Left: the church's gable end with the side door back
into the mission, its flank receding into the fog.  Behind: rows of crooked stones growing paler
with distance, the weeping angel, poplars and the iron railings with the street gate and a lit
lamp.  Centre-right, the focal point: the Marsh double headstone (state 'flowers': bronze and
white chrysanthemums with a small card).  Foreground: Cobb's fresh grave with the spoil heap and
shovel; a Celtic cross frames the right edge; a dead tree full of crows.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, noise2
from persp import Persp
import props_c as C

W, H = 320, 144
HZ = 30
BASE = 100
_V = {}
P = C.P


def headstone(c, p, X, Z, w=10, h=14, kind='round', lum=.5, tilt=0., ramp='c_stone', moss=.3, seed=0, text=True,
              contrast=1.0):
    rng = np.random.default_rng(seed)
    s = p.s(Z)
    x, y = P(p, X, 0, Z)
    hw = max(1.5, w * s / 2)
    hh = h * s
    t = tilt * s
    if kind == 'round':
        pts = [(x - hw, y), (x - hw + t * .3, y - hh * .78)]
        for a in np.linspace(math.pi, 0, 9):
            pts.append((x + math.cos(a) * hw + t, y - hh * .78 - math.sin(a) * hh * .22))
        pts.append((x + hw + t * .3, y))
    elif kind == 'cross':
        aw = max(1.0, hw * .35)
        pts = [(x - aw, y), (x - aw + t * .5, y - hh * .62), (x - hw + t * .6, y - hh * .62),
               (x - hw + t * .7, y - hh * .8), (x - aw + t * .75, y - hh * .8), (x - aw + t, y - hh),
               (x + aw + t, y - hh), (x + aw + t * .75, y - hh * .8), (x + hw + t * .7, y - hh * .8),
               (x + hw + t * .6, y - hh * .62), (x + aw + t * .5, y - hh * .62), (x + aw, y)]
    elif kind == 'gothic':
        pts = [(x - hw, y), (x - hw + t * .5, y - hh * .7), (x + t, y - hh), (x + hw + t * .5, y - hh * .7), (x + hw, y)]
    elif kind == 'obelisk':
        pts = [(x - hw, y), (x - hw * .6 + t, y - hh * .9), (x + t, y - hh), (x + hw * .6 + t, y - hh * .9), (x + hw, y)]
    else:
        pts = [(x - hw, y), (x - hw + t, y - hh), (x + hw + t, y - hh), (x + hw, y)]
    N = noise2(c.w, c.h, 2.5, seed + 7, 2)
    k = contrast

    def fn(xx, yy):
        n = N[np.clip(yy.astype(int), 0, c.h - 1), np.clip(xx.astype(int), 0, c.w - 1)]
        return lum + ((n - .5) * .16 + np.clip((xx - x) / max(hw, 1), -1, 1) * -.06) * k
    c.poly(pts, ramp, fn)
    c.line(pts[-1][0], pts[-1][1], pts[-2][0], pts[-2][1], ramp, lum - .16 * k)
    c.line(pts[0][0], pts[0][1], pts[1][0], pts[1][1], ramp, lum + .12 * k)
    if moss > 0:
        for i in range(int(hw * hh * moss * .25)):
            mx = x + rng.uniform(-hw + 1, hw - 1)
            my = y - rng.uniform(0, hh * .45)
            c.put(int(mx), int(my), 'c_moss', .42 + rng.random() * .2)
    if text and hh > 9 and kind not in ('cross', 'obelisk'):
        for i in range(3):
            ly = int(y - hh * .62 + i * max(2, hh * .14))
            lw = int(hw * (.66 - i * .12))
            c.hline(int(x - lw + t * .4), int(x + lw + t * .4), ly, ramp, lum - .18 * k)
    c.hline(int(x - hw), int(x + hw + 1), int(y), 'c_moss', .25)
    return pts


def chrysanthemums(c, x, y, seed=3):
    """Stone vase of bronze, yellow and white chrysanthemums. (x, y) = vase base."""
    rng = np.random.default_rng(seed)
    c.poly([(x - 3, y), (x + 4, y), (x + 5, y - 6), (x - 4, y - 6)], 'c_stone', hgrad(x - 4, x + 5, .76, .44))
    c.hline(x - 4, x + 6, y - 6, 'c_stone', .86)
    c.hline(x - 3, x + 4, y - 1, 'c_stone', .36)
    for dx in (-6, -3, 0, 3, 6):
        c.line(x + dx * .3, y - 6, x + dx, y - 11, 'c_emerald', .4)
    for i in range(7):
        lx = x + rng.uniform(-8, 8)
        ly = y - rng.uniform(7, 12)
        c.put(int(lx), int(ly), 'c_emerald', .5)
        c.put(int(lx) + 1, int(ly) + 1, 'c_emerald', .3)
    blooms = []
    cols = ('c_chrys', 'c_chrys', 'paper', 'c_ember', 'c_chrys', 'paper')
    for i in range(12):
        bx = x + rng.uniform(-8, 8)
        by = y - rng.uniform(10, 18)
        blooms.append((bx, by, cols[i % len(cols)]))
    for bx, by, col in sorted(blooms, key=lambda b: b[1]):
        base = {'c_chrys': .66, 'paper': .82, 'c_ember': .62}[col]
        c.ellipse(bx, by, 2.0, 1.7, col, base)
        c.put(int(bx - .5), int(by - 1), col, min(1, base + .3))
        c.put(int(bx + 1), int(by + .5), col, base - .25)
        c.put(int(bx), int(by), col, base - .1)
    return blooms


def poplar(c, x, ybase, h, w, lum=.5, seed=0):
    rng = np.random.default_rng(seed)
    pts = []
    for i in range(14):
        t = i / 13
        yy = ybase - h * t
        ww = w * (1 - t ** 1.6) * (.85 + rng.random() * .3)
        pts.append((x - ww / 2, yy))
    right = []
    for i in range(14):
        t = i / 13
        yy = ybase - h * t
        ww = w * (1 - t ** 1.6) * (.85 + rng.random() * .3)
        right.append((x + ww / 2, yy))
    c.poly(pts + right[::-1], 'fog', lum, emis=.6, dith=.6)
    c.vline(int(x), int(ybase - 3), int(ybase), 'fog', lum - .08, emis=.6)


# ----------------------------------------------------------------------------- build ----
def build():
    sc = C.SceneC('cemetery', W, H, seed=71)
    c = sc.c
    p = Persp(0, 320, 0, BASE, horizon=HZ, depth=400, cx=160)
    zf = p.z_at_floor_y(H + 2)
    by = lambda Z: int(round(p.P(0, 0, Z)[1]))
    bx = lambda X, Z: int(round(p.P(X, 0, Z)[0]))
    Zr = -170                                     # railings line

    # ---- sky ------------------------------------------------------------------------------------
    Nsky = noise2(W, H, 26, 3, 3)

    def sky(xx, yy):
        n = Nsky[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)]
        sun = np.clip(1 - np.hypot(xx - 150, (yy - 12) * 1.4) / 40, 0, 1) ** 1.6 * .18
        return .5 + yy / 170 + (n - .5) * .12 + sun
    c.rect(0, 0, W, 90, 'fog', sky, emis=.9, dith=.7)

    # ---- far skyline (roofs, chimneys, a spire, cranes) -------------------------------------------------
    rng = np.random.default_rng(12)
    x = 40
    sl = 58
    while x < W:
        w = int(rng.integers(7, 18))
        h = int(rng.integers(3, 11))
        kind = rng.integers(0, 3)
        top = sl - h
        if kind == 0:   # gable
            c.poly([(x, sl + 8), (x, top + 3), (x + w / 2, top - 2), (x + w, top + 3), (x + w, sl + 8)], 'fog', .62,
                   emis=.9, dith=.15)
        else:
            c.rect(x, top, x + w, sl + 8, 'fog', .62 - kind * .01, emis=.9, dith=.15)
        if rng.random() < .5:
            cxp = x + int(rng.integers(1, max(2, w - 2)))
            c.rect(cxp, top - 3, cxp + 2, top, 'fog', .6, emis=.9)
        x += w
    c.poly([(196, sl + 2), (196, 36), (198, 24), (200, 36), (200, sl + 2)], 'fog', .6, emis=.9)    # distant spire
    for (cx_, ch) in ((244, 32), (262, 27)):
        c.vline(cx_, sl - ch, sl + 4, 'fog', .58, emis=.9)
        c.line(cx_ - 9, sl - ch + 2, cx_ + 13, sl - ch, 'fog', .58, emis=.9)
        c.line(cx_, sl - ch, cx_ + 7, sl - ch + 9, 'fog', .6, emis=.9)
    C.fog_band(c, 0, 44, W, 66, .0, .35, lum=.7, emis=.9)

    # ---- street beyond the railings, poplars, the gate lamp --------------------------------------------
    st = p.quad([(-500, 0, -900), (900, 0, -900), (900, 0, Zr), (-500, 0, Zr)])
    c.poly(st, 'fog', vgrad(by(-900), by(Zr), .6, .54), emis=.6)
    for i, X in enumerate(range(90, 420, 46)):
        x_, y_ = P(p, X + (i % 2) * 12, 0, -320)
        poplar(c, x_, y_, 30 + (i % 3) * 6, 9, lum=.52 - (i % 2) * .02, seed=i)
    lp = P(p, 334, 0, Zr - 14)
    lt = P(p, 334, 40, Zr - 14)
    c.vline(lp[0], lt[1], lp[1], 'fog', .3, emis=.5)
    c.rect(lp[0] - 2, lt[1] - 4, lp[0] + 3, lt[1], 'fog', .32, emis=.5)
    c.rect(lp[0] - 1, lt[1] - 3, lp[0] + 2, lt[1] - 1, 'lamp', .75, emis=1)
    _V['streetlamp'] = (lp[0], lt[1] - 2)

    # ---- the ground: grass with tufts, gravel paths ---------------------------------------------------------
    Ng = noise2(W, H, 3, 23, 3)
    gr = p.quad([(-600, 0, Zr), (900, 0, Zr), (900, 0, zf + 5), (-600, 0, zf + 5)])

    def grass(xx, yy):
        n = Ng[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)]
        tuft = (((xx.astype(int) * 7 + yy.astype(int) * 13) % 11) == 0) * .1
        fog = np.clip((100 - yy) / 30, 0, 1) * .12
        return .4 + (n - .5) * .28 + tuft + fog
    c.poly(gr, 'sage', grass)
    Np = noise2(W, H, 1.2, 31, 1)

    def gravel(xx, yy):
        n = Np[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)]
        return .48 + (n - .5) * .3 + np.clip((100 - yy) / 40, 0, 1) * .1
    path = []
    for t in np.linspace(0, 1, 16):
        X = 40 + t * 380
        Zc = 92 + 8 * math.sin(t * 3.0) - t * 22
        path.append((X, Zc))
    ptop = [P(p, X, 0, Z - 9) for X, Z in path]
    pbot = [P(p, X, 0, Z + 9) for X, Z in path]
    c.poly(ptop + pbot[::-1], 'c_tan', gravel)
    # side path up to the Marsh grave, and the main walk out to the gate
    c.poly([P(p, 216, 0, 46), P(p, 236, 0, 46), P(p, 240, 0, 76), P(p, 214, 0, 76)], 'c_tan', gravel)
    c.poly([P(p, 326, 0, Zr), P(p, 346, 0, Zr), P(p, 380, 0, 70), P(p, 340, 0, 70)], 'c_tan', gravel)

    # ---- far rows of stones, paler with distance ----------------------------------------------------------
    rngg = np.random.default_rng(4)
    rows = [(-150, .64, .5), (-125, .61, .55), (-98, .58, .65), (-72, .55, .75), (-46, .52, .85), (-20, .5, .95)]
    for (Z, lum, ctr) in rows:
        X = 66 + rngg.uniform(0, 16)
        while X < 400:
            kind = ('round', 'round', 'cross', 'gothic', 'slab', 'round', 'obelisk')[int(rngg.integers(0, 7))]
            skip = (112 < X < 140 and -80 < Z < -30) or (196 < X < 260 and Z > -40) or (296 < X < 340 and Z > -60)
            if not skip:
                hgt = rngg.uniform(9, 15) * (1.6 if kind == 'obelisk' else 1)
                headstone(c, p, X, Z, w=rngg.uniform(7, 11), h=hgt, kind=kind, lum=lum,
                          tilt=rngg.uniform(-1.8, 1.8), seed=int(rngg.integers(0, 999)), moss=.15 * ctr, text=ctr > .7,
                          contrast=ctr)
            X += rngg.uniform(20, 34)

    # ---- railings + gate ---------------------------------------------------------------------------------
    top = P(p, 0, 12, Zr)[1]
    a = P(p, 60, 0, Zr)
    b = P(p, 500, 0, Zr)
    c.hline(a[0], b[0], top + 2, 'fog', .34, emis=.4)
    c.hline(a[0], b[0], a[1] - 2, 'fog', .34, emis=.4)
    gate = (318, 352)
    X = 60.0
    while X < 520:
        if not (gate[0] < X < gate[1]):
            x_, y_ = P(p, X, 0, Zr)
            c.vline(x_, top, y_, 'fog', .32, emis=.4)
            c.put(x_, top - 1, 'fog', .4, emis=.4)
        X += 3.4
    for X in gate:
        p.box(c, X - 2.5, X + 2.5, 0, 16, Zr - 2, Zr + 2, 'c_stone', front=.58, top=.66, side=.46)
    # the lych-gate roof over the gate
    for X in gate:
        p.box(c, X - 1.5, X + 1.5, 16, 26, Zr - 1.5, Zr + 1.5, 'oak', front=.4, side=.3, top=.5)
    ra = P(p, gate[0] - 5, 26, Zr)
    rb = P(p, gate[1] + 5, 26, Zr)
    rt = P(p, (gate[0] + gate[1]) / 2, 34, Zr)
    c.poly([(ra[0], ra[1]), (rt[0], rt[1]), (rb[0], rb[1]), (rb[0], rb[1] + 1), (ra[0], ra[1] + 1)], 'slate', .36)
    c.line(ra[0], ra[1], rt[0], rt[1], 'slate', .52)
    c.line(rt[0], rt[1], rb[0], rb[1], 'slate', .3)
    # the open gate leaves
    for (Xh, Xe, Ze) in ((gate[0] + 2, gate[0] + 6, Zr + 30), (gate[1] - 2, gate[1] - 4, Zr + 32)):
        for t in np.linspace(0, 1, 6):
            xb_, yb_ = P(p, Xh + (Xe - Xh) * t, 0, Zr + (Ze - Zr) * t)
            yt_ = P(p, Xh + (Xe - Xh) * t, 12, Zr + (Ze - Zr) * t)[1]
            c.vline(xb_, yt_, yb_, 'fog', .3, emis=.3)
        c.line(*P(p, Xh, 11, Zr), *P(p, Xe, 11, Ze), 'fog', .3, emis=.3)
        c.line(*P(p, Xh, 2, Zr), *P(p, Xe, 2, Ze), 'fog', .3, emis=.3)

    # ---- the stone angel: one wing broken off, pointing at the sky ------------------------------------
    AX, AZ = 126, -56
    p.box(c, AX - 7, AX + 7, 0, 12, AZ - 5, AZ + 5, 'c_stone', front=.54, top=.66, side=.4)
    p.box(c, AX - 8, AX + 8, 10, 12, AZ - 6, AZ + 6, 'c_stone', front=.64, top=.7, side=.44)
    tp = P(p, AX, 12, AZ)
    s_ = p.s(AZ)
    hgt = int(28 * s_)
    hx_, hy_ = tp[0], tp[1] - hgt
    # intact left wing, tall behind the shoulder
    c.poly([(hx_ - 3, hy_ + 9), (hx_ - 9, hy_ - 1), (hx_ - 11, hy_ + 4), (hx_ - 9, hy_ + 16), (hx_ - 4, hy_ + 17)],
           'c_stone', .56)
    for k in range(3):
        c.line(hx_ - 5 - k, hy_ + 4 + k * 3, hx_ - 8, hy_ + 13 - k, 'c_stone', .72)
    # the broken right wing: a jagged stump
    c.poly([(hx_ + 3, hy_ + 9), (hx_ + 7, hy_ + 5), (hx_ + 8, hy_ + 8), (hx_ + 6, hy_ + 9), (hx_ + 7, hy_ + 12),
            (hx_ + 4, hy_ + 14)], 'c_stone', .44)
    c.put(hx_ + 7, hy_ + 6, 'c_stone', .74)
    # robe
    c.poly([(tp[0] - 5, tp[1]), (tp[0] + 5, tp[1]), (tp[0] + 4, hy_ + 9), (tp[0] - 3, hy_ + 9)],
           'c_stone', hgrad(tp[0] - 5, tp[0] + 5, .7, .46))
    for k in (-2, 1, 3):
        c.line(tp[0] + k, tp[1] - 1, tp[0] + k * .6, hy_ + 11, 'c_stone', .44)
    # head tipped back, right arm raised, finger to the sky
    c.ellipse(hx_ - .5, hy_ + 6, 2.3, 2.5, 'c_stone', .68)
    c.put(hx_ - 1, hy_ + 4, 'c_stone', .86)
    c.line(hx_ + 2, hy_ + 10, hx_ + 4, hy_ + 4, 'c_stone', .66)
    c.line(hx_ + 4, hy_ + 4, hx_ + 5, hy_ - 3, 'c_stone', .62)
    c.put(hx_ + 5, hy_ - 4, 'c_stone', .8)
    c.line(hx_ - 2, hy_ + 10, hx_ - 3, hy_ + 15, 'c_stone', .5)                      # left arm at the side
    for k in range(7):
        c.put(tp[0] - 3 + k, tp[1] - 2 - (k * 3) % 8, 'c_moss', .48)
    # the broken-off wing lying in the grass by the plinth
    fb = P(p, AX + 10, 0, AZ + 4)
    c.poly([(fb[0] - 3, fb[1]), (fb[0] + 3, fb[1] - 2), (fb[0] + 4, fb[1]), (fb[0], fb[1] + 1)], 'c_stone', .6)
    c.put(fb[0] + 2, fb[1] - 2, 'c_moss', .45)
    _V['angel'] = (tp[0] - 13, hy_ - 6, tp[0] + 12, by(AZ + 6) + 2)
    _V['angel_head'] = (hx_ + 5, hy_ - 4)

    # ---- the dead tree (right, behind the Marsh grave) ------------------------------------------------------
    TX, TZ = 304, -34
    tb = P(p, TX, 0, TZ)
    tips = []

    def branch(x, y, ang, ln, wdt, depth):
        if depth == 0 or ln < 3:
            return
        x2 = x + math.cos(ang) * ln
        y2 = y - math.sin(ang) * ln
        for k in range(max(1, int(round(wdt)))):
            c.line(x + k - wdt / 2, y, x2 + k * .5 - wdt / 4, y2, 'c_bark', .3 + (k == 0) * .12)
        tips.append((x2, y2, ang, depth))
        r = np.random.default_rng(int(x * 7 + y * 13 + depth))
        for da in (-.42 - r.random() * .22, .36 + r.random() * .26):
            branch(x2, y2, ang + da, ln * (.66 + r.random() * .12), max(1, wdt * .6), depth - 1)
    c.poly([(tb[0] - 4, tb[1]), (tb[0] + 5, tb[1]), (tb[0] + 3, tb[1] - 44), (tb[0] - 2, tb[1] - 44)], 'c_bark',
           hgrad(tb[0] - 4, tb[0] + 5, .46, .26))
    c.line(tb[0] - 5, tb[1], tb[0] - 9, tb[1] + 2, 'c_bark', .32)
    c.line(tb[0] + 5, tb[1], tb[0] + 9, tb[1] + 1, 'c_bark', .32)
    for k in range(5):
        c.put(tb[0] - 2 + k, tb[1] - 10 - k * 6, 'c_moss', .4)
    branch(tb[0] + 1, tb[1] - 42, math.radians(104), 24, 4, 5)
    branch(tb[0], tb[1] - 34, math.radians(148), 24, 3, 4)
    branch(tb[0], tb[1] - 24, math.radians(170), 16, 2, 3)
    branch(tb[0] + 2, tb[1] - 30, math.radians(40), 12, 2, 3)
    _V['tree'] = (tb[0] - 52, 0, W, min(96, tb[1] + 2))
    _V['tips'] = tips

    # ---- the Marsh grave: black granite double headstone, kerbed plot ------------------------------------------
    MX0, MX1, MZ = 198, 246, 16
    with sc.obj('marsh_plot', baseline=by(MZ + 26) + 1):
        p.box(c, MX0 + 2, MX1 - 2, 0, 1.6, MZ + 2, MZ + 26, 'c_stone', front=.66, top=.72, side=.5)
        inner = [P(p, MX0 + 4, 1.7, MZ + 4), P(p, MX1 - 4, 1.7, MZ + 4), P(p, MX1 - 4, 1.7, MZ + 24), P(p, MX0 + 4, 1.7, MZ + 24)]
        c.poly(inner, 'paper', C.noisy(.5, W, H, 1, .14, seed=8, octaves=1))         # white marble chippings
    hs_l = P(p, MX0 + 3, 0, MZ)
    hs_r = P(p, MX1 - 3, 0, MZ)
    yb = hs_l[1]
    ht = int(23 * p.s(MZ))
    mid = (hs_l[0] + hs_r[0]) // 2
    ar = 7
    pts = [(hs_l[0], yb), (hs_l[0], yb - ht + ar)]
    for a in np.linspace(math.pi, 0, 9):
        pts.append(((hs_l[0] + mid) / 2 + math.cos(a) * (mid - hs_l[0]) / 2, yb - ht + ar - math.sin(a) * ar))
    pts.append((mid, yb - ht + ar + 1))
    for a in np.linspace(math.pi, 0, 9):
        pts.append(((mid + hs_r[0]) / 2 + math.cos(a) * (hs_r[0] - mid) / 2, yb - ht + ar - math.sin(a) * ar))
    pts += [(hs_r[0], yb - ht + ar), (hs_r[0], yb)]
    with sc.obj('marsh_stone', baseline=yb + 1):
        c.rect(hs_l[0] - 3, yb - 4, hs_r[0] + 4, yb + 1, 'c_stone', .66)
        c.hline(hs_l[0] - 3, hs_r[0] + 4, yb - 4, 'c_stone', .84)
        c.poly(pts, 'slate', lambda xx, yy: .34 + (xx - hs_l[0]) / 500 - (yy - (yb - ht)) / 260)
        # polished highlights catching the grey sky
        c.line(hs_l[0] + 2, yb - ht + ar + 1, hs_l[0] + 2, yb - 6, 'slate', .7)
        c.line(hs_l[0] + 4, yb - ht + 2, hs_l[0] + 9, yb - ht, 'slate', .66)
        c.line(mid + 3, yb - ht + 2, mid + 8, yb - ht, 'slate', .62)
        c.vline(hs_r[0] - 1, yb - ht + ar, yb - 4, 'slate', .2)
        # inscription (incised, lighter): crosses, two name blocks, MARSH across the base
        for (x0_, x1_) in ((hs_l[0] + 3, mid - 2), (mid + 2, hs_r[0] - 3)):
            cxn = (x0_ + x1_) // 2
            c.vline(cxn, yb - ht + 2, yb - ht + 7, 'slate', .8)
            c.hline(cxn - 1, cxn + 2, yb - ht + 3, 'slate', .8)
            c.hline(x0_ + 2, x1_ - 2, yb - ht + 10, 'slate', .76)
            c.hline(x0_ + 3, x1_ - 3, yb - ht + 12, 'slate', .66)
            c.hline(x0_ + 4, x1_ - 4, yb - ht + 14, 'slate', .66)
        C.text(c, mid - 13, yb - 11, 'MARSH', 'slate', .82)
        c.hline(hs_l[0] + 5, hs_r[0] - 5, yb - 5, 'slate', .6)
        c.vline(mid, yb - ht + ar + 1, yb - 12, 'slate', .24)
    _V['marsh'] = (hs_l[0] - 4, yb - ht - 2, hs_r[0] + 5, by(MZ + 26) + 1)

    # ---- the church: gable end with the side door, flank receding ----------------------------------------
    CXR, CZ = 72, 66                         # right edge of the gable end, its depth
    # flank (side wall) from the gable corner back into the fog
    Nw = noise2(W, H, 4, 17, 2)

    def stonework(xx, yy, base=.5, fogk=0.0):
        n = Nw[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)]
        jb = ((yy.astype(int) % 6) == 0)
        jv = (((xx.astype(int) + (yy.astype(int) // 6) * 5) % 11) == 0)
        L = base + (n - .5) * .14
        return np.where(jb | jv, L - .12, L)
    flank = p.quad([(CXR, 0, CZ), (CXR, 0, -240), (CXR, 64, -240), (CXR, 64, CZ)])

    def flank_fn(xx, yy):
        s = np.maximum((xx - p.cx) / (CXR - p.cx), 1e-3)
        Z = p.D * (1 - 1 / s)
        fog = np.clip((CZ - Z) / 300, 0, 1)
        return stonework(xx, yy, .5) * (1 - fog * .25) + fog * .22
    c.poly(flank, 'c_stone', flank_fn)
    roof = p.quad([(CXR, 64, CZ), (CXR, 64, -240), (CXR - 30, 96, -240), (CXR - 30, 96, CZ)])
    c.poly(roof, 'slate', lambda xx, yy: .36 + (yy - 0) / 300)
    for Zb in (-180, -110, -40, 30):
        p.box(c, CXR, CXR + 6, 0, 48, Zb - 5, Zb + 5, 'c_stone', front=.5, top=.62, side=.4)
    for (Z0, Z1) in ((-150, -130), (-80, -60), (-10, 10)):
        q = p.quad([(CXR, 26, Z0), (CXR, 26, Z1), (CXR, 50, Z1), (CXR, 56, (Z0 + Z1) / 2), (CXR, 50, Z0)])
        c.poly(q, 'c_navy', .34, emis=.15)
        c.line(*P(p, CXR, 26, (Z0 + Z1) / 2), *P(p, CXR, 50, (Z0 + Z1) / 2), 'c_stone', .5)
        c.poly(p.quad([(CXR, 26, Z0), (CXR, 26, Z1), (CXR, 24, Z1), (CXR, 24, Z0)]), 'c_stone', .7)
    # gable end wall facing us (frontal at Z=CZ)
    ge0 = P(p, -200, 0, CZ)
    ge1 = P(p, CXR, 64, CZ)
    c.rect(0, ge1[1], ge1[0], ge0[1], 'c_stone', lambda xx, yy: stonework(xx, yy, .54))
    peak = P(p, CXR - 60, 110, CZ)
    c.poly([(ge1[0], ge1[1]), (peak[0], peak[1]), (0, peak[1]), (0, ge1[1])], 'c_stone',
           lambda xx, yy: stonework(xx, yy, .54))
    c.line(ge1[0], ge1[1], peak[0], peak[1], 'slate', .5)
    c.line(ge1[0] + 1, ge1[1], peak[0] + 1, peak[1], 'slate', .3)
    c.vline(ge1[0], ge1[1], ge0[1], 'c_stone', .72)                         # quoin edge
    for yq in range(ge1[1], ge0[1], 6):
        c.hline(ge1[0] - 4, ge1[0], yq, 'c_stone', .7)
    # the side door (frontal) with a stone arch, two steps and a lantern
    D0, D1 = 36, 60
    dl = P(p, D0, 0, CZ)
    dr = P(p, D1, 37, CZ)
    dcx = (dl[0] + dr[0]) / 2
    rad = (dr[0] - dl[0]) / 2
    arch = [(dl[0], dl[1]), (dl[0], dr[1] + rad)] + [(dcx - rad * math.cos(a), dr[1] + rad - rad * math.sin(a))
                                                    for a in np.linspace(0, math.pi, 12)][1:-1] + [(dr[0], dr[1] + rad), (dr[0], dl[1])]
    surround = [(dl[0] - 3, dl[1]), (dl[0] - 3, dr[1] + rad)] + \
               [(dcx - (rad + 3) * math.cos(a), dr[1] + rad - (rad + 3) * math.sin(a)) for a in np.linspace(0, math.pi, 12)][1:-1] + \
               [(dr[0] + 3, dr[1] + rad), (dr[0] + 3, dl[1])]
    c.poly(surround, 'c_stone', .7)
    c.poly(arch, 'wood', C.grain_v(.4, .03, 1.1))
    for X in range(int(dl[0]) + 4, int(dr[0]), 5):
        c.vline(X, int(dr[1] - rad * .2), dl[1], 'wood', .26)
    for yy_ in (int(dr[1] + 12), dl[1] - 12):
        c.rect(dl[0], yy_, dr[0], yy_ + 2, 'black', .32)
        c.hline(dl[0], dr[0] - 6, yy_, 'black', .55)
    c.ellipse(dr[0] - 6, (dr[1] + dl[1]) // 2 + 4, 2, 2, 'black', .55)
    c.ellipse(dr[0] - 6, (dr[1] + dl[1]) // 2 + 4, 1, 1, 'c_stone', .5)
    st0 = P(p, D0 - 4, 2, CZ + 4)
    st1 = P(p, D1 + 4, 0, CZ + 8)
    c.rect(st0[0], dl[1], st1[0], st1[1], 'c_stone', .62)
    c.hline(st0[0], st1[0], dl[1], 'c_stone', .82)
    c.rect(st0[0] - 2, st1[1] - 3, st1[0] + 2, st1[1], 'c_stone', .56)
    c.hline(st0[0] - 2, st1[0] + 2, st1[1] - 3, 'c_stone', .76)
    lx_, ly_ = int(dr[0] + 9), int(dr[1] - 4)
    c.rect(lx_ - 2, ly_ - 5, lx_ + 3, ly_ + 2, 'black', .4)
    c.rect(lx_ - 1, ly_ - 4, lx_ + 2, ly_ + 1, 'lamp', .7, emis=1)
    c.hline(lx_ - 3, lx_ + 4, ly_ - 6, 'black', .5)
    _V['door'] = C.ipoly(surround)
    _V['door_lamp'] = (lx_, ly_ - 1)
    _V['church_base'] = ge0[1]

    # ---- the fresh grave: mounded yellow clay, no stone yet; Cobb's shovel in the spare earth -------------
    GX0, GX1, GZ0, GZ1 = 112, 134, 74, 104
    rim = [P(p, GX0, 0, GZ0), P(p, GX1, 0, GZ0), P(p, GX1, 0, GZ1), P(p, GX0, 0, GZ1)]
    RH = 4.5
    top_ = [P(p, GX0 + 4, RH, GZ0 + 4), P(p, GX1 - 4, RH, GZ0 + 4), P(p, GX1 - 4, RH, GZ1 - 4), P(p, GX0 + 4, RH, GZ1 - 4)]
    Nc = noise2(W, H, 1.3, 43, 2)

    def clay(base):
        def f(xx, yy):
            n = Nc[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)]
            return base + (n - .5) * .22
        return f
    c.poly(rim, 'c_clay', clay(.36))                                                     # footprint / far slope
    c.poly([top_[3], top_[2], rim[2], rim[3]], 'c_clay', clay(.46))                      # near slope
    c.poly([top_[1], rim[1], rim[2], top_[2]], 'c_clay', clay(.4))                       # right slope
    c.poly(top_, 'c_clay', clay(.6))                                                     # rounded top
    c.line(top_[0][0], top_[0][1], top_[1][0], top_[1][1], 'c_clay', .72)
    for k in range(3):                                                                   # rain rivulets
        a_ = P(p, GX0 + 6 + k * 6, RH, GZ1 - 4)
        b_ = P(p, GX0 + 5 + k * 6, 0, GZ1)
        c.line(a_[0], a_[1], b_[0], b_[1], 'c_clay', .3)
    rng_c = np.random.default_rng(5)
    for k in range(22):                                                                  # clods
        X = rng_c.uniform(GX0 + 2, GX1 - 2)
        Z = rng_c.uniform(GZ0 + 2, GZ1 - 2)
        q = P(p, X, RH * .8, Z)
        c.put(q[0], q[1], 'c_clay', .74 if k % 3 else .22)
    c.hline(rim[3][0], rim[2][0] + 1, rim[3][1], 'c_mud', .3)
    # a puddle collecting at the foot of the mound
    pf = P(p, (GX0 + GX1) / 2, 0, GZ1 + 3)
    c.ellipse(pf[0], pf[1], 6, 1.2, 'fog', .62, emis=.4)
    with sc.obj('spoil', baseline=by(GZ1) + 1):
        base_pts = [P(p, GX1 + 3, 0, GZ0 - 2), P(p, GX1 + 20, 0, GZ0 + 2), P(p, GX1 + 24, 0, GZ1 - 4),
                    P(p, GX1 + 3, 0, GZ1)]
        mt = P(p, GX1 + 13, 8, (GZ0 + GZ1) / 2 - 2)
        Nm = noise2(W, H, 1.5, 41, 2)

        def earth(xx, yy):
            n = Nm[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)]
            return .52 + (n - .5) * .3 - (yy - mt[1]) / 90 - (xx - mt[0]) / 120
        c.poly([base_pts[0], base_pts[1], mt], 'c_mud', lambda xx, yy: earth(xx, yy) - .1)
        c.poly([base_pts[3], base_pts[0], mt, base_pts[1], base_pts[2]], 'c_mud', earth)
        for k in range(10):                                                              # clay mixed in
            q = (base_pts[3][0] + (base_pts[2][0] - base_pts[3][0]) * ((k * 29) % 11) / 11,
                 mt[1] + 3 + (base_pts[2][1] - mt[1] - 4) * ((k * 13) % 7) / 7)
            c.put(int(q[0]), int(q[1]), 'c_clay', .6)
        for k in range(18):
            q = (base_pts[3][0] + (base_pts[2][0] - base_pts[3][0]) * ((k * 37) % 13) / 13,
                 mt[1] + 2 + (base_pts[2][1] - mt[1] - 3) * ((k * 17) % 11) / 11)
            c.put(int(q[0]), int(q[1]), 'c_mud', .72 if k % 3 else .3)
        sh0 = (mt[0] + 1, mt[1] + 3)
        sh1 = (mt[0] - 4, mt[1] - 24)
        c.line(sh0[0], sh0[1], sh1[0], sh1[1], 'oak', .62)
        c.line(sh0[0] + 1, sh0[1], sh1[0] + 1, sh1[1], 'oak', .4)
        c.rect(sh1[0] - 3, sh1[1] - 3, sh1[0] + 4, sh1[1], 'oak', .55)
        c.rect(sh1[0] - 1, sh1[1] - 2, sh1[0] + 2, sh1[1] - 1, 'black', .2)
        c.hline(sh1[0] - 3, sh1[0] + 4, sh1[1] - 3, 'oak', .82)
        c.poly([(sh0[0] - 3, sh0[1]), (sh0[0] + 4, sh0[1]), (sh0[0] + 3, sh0[1] + 4), (sh0[0] - 2, sh0[1] + 4)],
               'steel', .7)
        c.hline(sh0[0] - 3, sh0[0] + 4, sh0[1], 'steel', .9)
        _V['shovel'] = (sh1[0] - 5, sh1[1] - 5, sh0[0] + 6, sh0[1] + 6)
    _V['fresh'] = rim
    lt_ = P(p, GX0 - 8, 0, GZ0 + 2)
    c.rect(lt_[0] - 3, lt_[1] - 3, lt_[0] + 4, lt_[1], 'steel', .58)                         # Cobb's lunch tin
    c.hline(lt_[0] - 3, lt_[0] + 4, lt_[1] - 3, 'steel', .82)
    c.rect(lt_[0] + 6, lt_[1] - 7, lt_[0] + 8, lt_[1], 'c_amberglass', .55)                 # and his bottle
    c.put(lt_[0] + 6, lt_[1] - 7, 'c_amberglass', .9)

    # ---- nearer stones, the Celtic cross framing the right edge -----------------------------------------------
    headstone(c, p, 176, 40, w=9, h=13, kind='round', lum=.48, tilt=1.2, seed=5, moss=.4)
    headstone(c, p, 160, 6, w=8, h=11, kind='gothic', lum=.5, tilt=-1.4, seed=6, moss=.35)
    headstone(c, p, 96, 30, w=10, h=13, kind='slab', lum=.5, tilt=1.2, seed=8, moss=.3, text=False)
    an = P(p, 96, 8, 30)
    c.vline(an[0], an[1] - 4, an[1] + 4, 'c_stone', .28)                              # carved anchor
    c.hline(an[0] - 2, an[0] + 3, an[1] - 2, 'c_stone', .28)
    c.put(an[0], an[1] - 5, 'c_stone', .28)
    c.line(an[0] - 3, an[1] + 2, an[0], an[1] + 4, 'c_stone', .28)
    c.line(an[0] + 3, an[1] + 2, an[0], an[1] + 4, 'c_stone', .28)
    headstone(c, p, 270, 20, w=7, h=14, kind='cross', lum=.5, tilt=-.8, seed=9, moss=.2)
    CCX, CCZ = 248, 140
    with sc.obj('celtic_cross', baseline=by(CCZ) + 1):
        cx_, cy_ = P(p, CCX, 0, CCZ)
        s2 = p.s(CCZ)
        c.rect(cx_ - int(6 * s2), cy_ - int(5 * s2), cx_ + int(6 * s2), cy_, 'c_stone', .44)
        c.hline(cx_ - int(6 * s2), cx_ + int(6 * s2), cy_ - int(5 * s2), 'c_stone', .62)
        c.rect(cx_ - int(2.5 * s2), cy_ - int(40 * s2), cx_ + int(2.5 * s2), cy_ - int(5 * s2), 'c_stone',
               hgrad(cx_ - 4, cx_ + 4, .56, .32))
        cy2 = cy_ - int(33 * s2)
        c.ellipse(cx_, cy2, 6.5 * s2, 6.5 * s2, 'c_stone', .5)
        c.ellipse(cx_, cy2, 4.5 * s2, 4.5 * s2, 'sage', .5)
        c.rect(cx_ - int(2.5 * s2), cy2 - int(8 * s2), cx_ + int(2.5 * s2), cy2 + int(7 * s2), 'c_stone', .52)
        c.rect(cx_ - int(10 * s2), cy2 - int(2.5 * s2), cx_ + int(10 * s2), cy2 + int(2.5 * s2), 'c_stone',
               vgrad(cy2 - 4, cy2 + 4, .6, .4))
        c.vline(cx_ - int(2.5 * s2), cy_ - int(40 * s2), cy_ - 5, 'c_stone', .72)
        c.hline(cx_ - int(10 * s2), cx_ + int(10 * s2), cy2 - int(2.5 * s2), 'c_stone', .74)
        for k in range(12):
            c.put(cx_ - 3 + (k * 5) % 7, cy_ - 6 - (k * 7) % 34, 'c_moss', .5)
        # knotwork hint
        for k in range(-2, 3):
            c.put(cx_ + k, cy2 + (k % 2), 'c_stone', .3)
    # puddles on the path reflecting the grey sky, wet leaves
    for (X, Z, rw) in ((200, 108, 7), (300, 92, 5), (86, 118, 6)):
        px_, py_ = P(p, X, 0, Z)
        k_ = p.s(Z)
        c.ellipse(px_, py_, rw * k_, 1.6 * k_, 'fog', .66, emis=.5)
        c.hline(int(px_ - rw * k_ * .5), int(px_ + rw * k_ * .3), py_ - 1, 'fog', .85, emis=.6)
    rngl = np.random.default_rng(31)
    for i in range(60):
        X = rngl.uniform(30, 380)
        Z = rngl.uniform(60, zf)
        lx, ly = P(p, X, 0, Z)
        if 0 <= lx < W and 100 <= ly < H:
            col = ('c_chrys', 'c_mud', 'rust')[i % 3]
            c.put(lx, ly, col, .35 + rngl.random() * .2)
    # tufts of long grass at the bottom edge
    rngt = np.random.default_rng(77)
    for i in range(40):
        gx = int(rngt.uniform(0, W))
        gy = int(rngt.uniform(132, 144))
        c.line(gx, gy, gx + int(rngt.integers(-2, 3)), gy - int(rngt.integers(2, 5)), 'sage', .55 + rngt.random() * .2)

    # ---- lighting -----------------------------------------------------------------------------------
    xx = np.arange(W)[None, :].astype(np.float32)
    yy = np.arange(H)[:, None].astype(np.float32)
    vign = np.clip(1.25 - np.hypot((xx - 210) / 270.0, (yy - 80) / 140.0), .62, 1)
    c.shade *= vign.astype(np.float32)
    c.shadow_ellipse(mid, yb + 3, 30, 5, .28)
    c.shadow_ellipse(*P(p, CCX, 0, CCZ), 14, 3, .3)
    c.shadow_ellipse(*P(p, GX1 + 12, 0, GZ1), 18, 4, .25)
    c.ambient = .6
    c.add_light(150, 10, 240, .3, falloff=1.0)
    c.add_light(mid, yb - 30, 70, .12)                         # a touch of extra light on the focal stone
    c.add_light(*_V['streetlamp'], 26, .3)
    c.add_light(*_V['door_lamp'], 30, .4)
    c.glow(150, 12, 70, (225, 230, 240), .16)
    c.glow(*_V['streetlamp'], 10, (255, 200, 120), .45)
    c.glow(*_V['door_lamp'], 12, (255, 190, 110), .5)

    # ---- state: chrysanthemums + the small card ------------------------------------------------------------
    with sc.obj('flowers', state=True, depth=yb + 2) as cc:
        vx, vy = mid + 20, yb + 4
        chrysanthemums(cc, vx, vy, seed=3)
        cc.poly([(vx - 11, vy - 6), (vx - 4, vy - 8), (vx - 3, vy - 3), (vx - 10, vy - 1)], 'paper', .9)
        cc.line(vx - 9, vy - 5, vx - 5, vy - 6, 'c_navy', .45)
        cc.line(vx - 9, vy - 3, vx - 6, vy - 4, 'c_navy', .45)
        cc.line(vx - 4, vy - 7, vx - 1, vy - 11, 'c_emerald', .35)
        _V['card'] = (vx - 12, vy - 9, vx - 2, vy)
        _V['flowers'] = (vx - 10, vy - 20, vx + 11, vy + 1)

    # ---- anim: crows ---------------------------------------------------------------------------------
    tips = _V['tips']
    good = [t for t in tips if t[3] in (2, 3) and t[1] > 4]
    good = sorted(good, key=lambda t: t[0])
    perch = [good[0], good[len(good) // 2], good[-1]] if len(good) >= 3 else tips[:3]
    rail = P(p, 186, 12, Zr)
    ah = _V['angel_head']

    def crows(k):
        def f(cc):
            x1, y1 = int(perch[0][0]), int(perch[0][1])
            C.crow(cc, x1, y1, pose='perch', facing=(1 if k < 4 else -1), lum=.36)
            x2, y2 = int(perch[1][0]), int(perch[1][1])
            C.crow(cc, x2, y2, pose=('flap' if k in (3, 4, 5) else 'perch'), facing=-1, lum=.34)
            x3, y3 = int(perch[2][0]), int(perch[2][1])
            C.crow(cc, x3, y3, pose='perch', facing=(-1 if k % 6 < 3 else 1), lum=.35)
            C.crow(cc, rail[0], rail[1] - 1, pose=('peck' if k in (1, 2, 6) else 'perch'), facing=1, lum=.34)
            C.crow(cc, ah[0] + 1, ah[1] - 2, pose='perch', facing=(1 if k in (0, 1, 2, 3, 7) else -1), lum=.33)
        return f
    sc.anim('crows', [crows(k) for k in range(8)], fps=3)

    # ---- interaction --------------------------------------------------------------------------------------
    sc.hotspot('exit_mission', poly=_V['door'], walk=(bx(48, CZ + 13), by(CZ + 13)), face='up')
    sc.hotspot('exit_street', poly=[(292, 97), (320, 97), (320, 144), (304, 144)], walk=(310, 126), face='right')
    sc.hotspot('card', rect=_V['card'], walk=(bx(226, 52), by(52)), face='up')
    sc.hotspot('flowers', rect=_V['flowers'], walk=(bx(226, 52), by(52)), face='up')
    sc.hotspot('marsh_grave', rect=_V['marsh'], walk=(bx(226, 52), by(52)), face='up')
    sc.hotspot('angel', rect=_V['angel'], walk=(bx(132, 56), by(56)), face='up')
    sc.hotspot('tree', rect=_V['tree'], walk=(bx(292, 60), by(60)), face='up')
    sc.hotspot('shovel', rect=_V['shovel'], walk=(bx(162, 98), by(98)), face='left')
    sc.hotspot('graves', poly=[(70, 62), (200, 62), (196, 98), (70, 98)], walk=(bx(150, 56), by(56)), face='up')
    sc.hotspot('fresh_grave', poly=C.ipoly(_V['fresh']), walk=(bx(106, 106), by(106)), face='right')
    zl = (lambda X: p.D * (1 - 1 / ((0 - p.cx) / (X - p.cx))))(30)
    band = [P(p, 0, 0, CZ + 9), P(p, CXR + 2, 0, CZ + 9), P(p, CXR + 2, 0, 50), P(p, 420, 0, 50), (W, H), (0, H)]
    band = [(min(max(x, 0), W), min(max(y, 0), H)) for x, y in band]
    holes = [C.ipoly([P(p, GX0 - 4, 0, GZ0 - 3), P(p, GX1 + 25, 0, GZ0 - 3), P(p, GX1 + 25, 0, GZ1 + 5),
                      P(p, GX0 - 4, 0, GZ1 + 5)]),
             C.ipoly([P(p, CCX - 8, 0, CCZ - 5), P(p, CCX + 8, 0, CCZ - 5), P(p, CCX + 8, 0, CCZ + 5),
                      P(p, CCX - 8, 0, CCZ + 5)])]
    sc.walkable(band, holes=holes)
    sc.point('start', 304, by(84), 'left')
    sc.point('from_map', 304, by(84), 'left')
    sc.point('from_mission', bx(52, CZ + 16), by(CZ + 16), 'right')
    sc.point('cobb_spot', bx(104, 90), by(90), 'right')
    sc.point('grave_spot', bx(226, 52), by(52), 'up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    yfar = by(50)
    sc.scale(yfar, round(p.char_scale(yfar, 140), 3), 140, 1.0)
    sc.meta['floor'] = 'grass'
    sc.rain(0, 0, W, H, density=.35, kind='outdoor')
    C.order_hotspots(sc, ['card', 'flowers', 'marsh_grave', 'shovel', 'fresh_grave', 'angel', 'exit_mission', 'exit_street',
                          'tree', 'graves'])
    C.check(sc, npc=('cobb_spot',))
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
