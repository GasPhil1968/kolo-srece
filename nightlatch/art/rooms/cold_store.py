"""Chapter 2 - the walk-in freezer at the Pier 9 cold store.  Frost on everything, one caged bulb."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
from persp import Persp, floor_poly
import props_b as B

W, H = 320, 144
FLOOR = 94
SEED = 21


def P_():
    return Persp(34, 286, 0, FLOOR, horizon=-56, depth=380)


def frost_wall_fn(x0, y0, base, seed, panel=18, seam=.2):
    N = noise2(W, H, 6, seed, 3)
    N2 = noise2(W, H, 2, seed + 5, 1)

    def fn(xx, yy):
        k = np.floor((xx - x0) / panel)
        fx = (xx - x0) - k * panel
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = base + (N[yi, xi] - .5) * .22 + (N2[yi, xi] > .82) * .1
        L = np.where(fx < 1, L - .16, L)
        L = np.where((fx >= 1) & (fx < 2), L + .08, L)
        # frost thickens towards the ceiling
        L = L + np.clip((30 - yy) / 30, 0, 1) * .18
        return L
    return fn


def icicles(c, x0, x1, y, seed, maxlen=6, step=(2, 5), ramp='b_frost', lum=.8):
    rng = np.random.default_rng(seed)
    x = x0
    while x < x1:
        L = int(rng.integers(1, maxlen + 1))
        c.vline(x, y, y + L, ramp, lum)
        c.put(x, y, ramp, lum + .12)
        if L > 3:
            c.put(x, y + L - 1, ramp, lum - .2)
        x += int(rng.integers(step[0], step[1] + 1))


def sparkle(c, pts_mask_fn, n, seed, region):
    rng = np.random.default_rng(seed)
    x0, y0, x1, y1 = region
    for _ in range(n):
        x = int(rng.integers(x0, x1))
        y = int(rng.integers(y0, y1))
        if pts_mask_fn(x, y):
            c.put(x, y, 'b_frost', .98, emis=.35)


def fish(c, x, top, length=24, lum=.55, seed=0, stitched=False, cut=False):
    """Frozen cod hanging tail-up from a hook at (x, top): forked tail, olive back (left),
    pale lateral line, silver belly (right), head down with an open mouth."""
    rng = np.random.default_rng(seed)
    L = length + int(rng.integers(-2, 2))
    w = 3.0 + rng.random() * .5
    x = int(x)
    # tail fork
    c.poly([(x - 4, top), (x - 1, top + 4), (x + 1, top + 4), (x + 4, top), (x + 2, top + 6), (x - 2, top + 6)],
           'b_fish', lum - .05)
    c.put(x - 4, top, 'b_fish', lum + .2)
    c.put(x + 4, top, 'b_fish', lum - .1)
    c.put(x, top + 2, 'b_fish', lum - .3)
    y0 = top + 5
    rows = []
    for i in range(L):
        t = i / (L - 1)
        hw = .8 + (w - .8) * min(1, math.sin(min(1.0, t * 1.3) * math.pi / 2) ** 1.2)
        if t > .82:
            hw *= 1 - (t - .82) * 1.6
        rows.append((y0 + i, hw))
    if cut:
        # split down the belly: halves splayed, red flesh, the paper inside
        for (y, hw) in rows:
            xl0, xl1 = int(round(x - hw - 2)), x - 1
            xr0, xr1 = x + 1, int(round(x + hw + 2))
            c.hline(xl0, xl1, y, 'olive', .45)
            c.put(xl0, y, 'olive', .62)
            c.hline(xr0, xr1 + 1, y, 'b_fish', lum)
            c.put(xr1, y, 'b_fish', lum - .25)
            c.hline(x - 1, x + 1, y, 'red', .38)
        c.rect(x - 1, y0 + 6, x + 2, y0 + 12, 'paper', .82)
        c.put(x, y0 + 6, 'paper', .98)
        c.put(x + 1, y0 + 11, 'paper', .55)
        for k in range(0, L - 4, 3):
            c.put(x - 2, y0 + k, 'red', .55)
        return
    for (y, hw) in rows:
        xa, xb = int(round(x - hw)), int(round(x + hw))
        c.hline(xa, x, y, 'olive', .42 + rng.random() * .05)
        c.hline(x, xb + 1, y, 'b_fish', lum + .05)
        c.put(xa, y, 'olive', .3)
        c.put(xb, y, 'b_fish', lum + .28)
        c.put(x, y, 'paper', .62)                      # lateral line
    # mottling on the back
    for k in range(4):
        c.put(x - 1 - int(rng.integers(0, 2)), y0 + 4 + int(rng.integers(0, L - 8)), 'olive', .22)
    # head: gill cover, eye, open mouth at the bottom
    hy = y0 + L
    c.hline(x - 2, x + 2, hy - 7, 'b_fish', lum - .25)
    c.put(x - 1, hy - 4, 'black', .1)
    c.put(x - 2, hy - 4, 'paper', .9)
    c.rect(x - 1, hy - 1, x + 2, hy + 1, 'mauve', .25)
    c.put(x + 1, hy + 1, 'b_fish', lum - .1)             # chin barbel
    # pectoral fin
    c.put(int(x + w) + 1, hy - 9, 'gold', .4)
    c.put(int(x + w) + 1, hy - 8, 'gold', .32)
    c.put(int(x + w), hy - 8, 'gold', .5)
    # frost crystals
    for i in range(0, L, 3):
        c.put(x - 1 - int(rng.integers(0, 2)), y0 + i, 'b_frost', .9)
    if stitched:
        for i in range(int(L * .28), int(L * .78), 2):
            c.put(x + 1, y0 + i, 'paper', .95)
            c.put(x + 2, y0 + i + 1, 'paper', .8)
            c.put(x + 3, y0 + i, 'paper', .7)


def wall_fn(x0, base, seed, panel=21):
    N = noise2(W, H, 7, seed, 3)
    N2 = noise2(W, H, 2, seed + 5, 1)

    def fn(xx, yy):
        k = np.floor((xx - x0) / panel)
        fx = (xx - x0) - k * panel
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = base + (N[yi, xi] - .5) * .1 + (H_(k) - .5) * .05
        L = L + (N2[yi, xi] > .86) * .07
        L = np.where(fx < 1, L - .14, L)
        L = np.where((fx >= 1) & (fx < 2), L + .07, L)
        L = L + np.clip((26 - yy) / 26, 0, 1) ** 1.5 * .22          # frost crust near the ceiling
        L = L + np.clip((yy - 70) / 20, 0, 1) * .06                   # frost drift above the kick plate
        return L
    return fn


def H_(k):
    v = np.sin(k * 12.9898) * 43758.5453
    return v - np.floor(v)


def fish_box(c, x0, y0, w, h, lum=.42, seed=0, label=None):
    """Wooden fish box seen from the front, fish tails poking out of crushed ice."""
    rng = np.random.default_rng(seed)
    c.rect(x0, y0, x0 + w, y0 + h, 'oak', vgrad(y0, y0 + h, lum + .05, lum - .1))
    c.hline(x0, x0 + w, y0, 'oak', lum + .2)
    c.vline(x0, y0, y0 + h, 'oak', lum - .15)
    c.vline(x0 + w - 1, y0, y0 + h, 'oak', lum - .18)
    c.hline(x0, x0 + w, y0 + h // 2, 'oak', lum - .2)
    if label:
        B.text(c, x0 + w // 2, y0 + 1, label, 'ink', .15, center=True, wear=.1, seed=seed)
    # ice heap + tails
    for k in range(w // 3):
        tx = x0 + 1 + k * 3 + int(rng.integers(0, 2))
        c.put(tx, y0 - 1, 'b_frost', .85)
        if rng.random() < .55:
            c.put(tx, y0 - 2, 'b_fish', .55)
            c.put(tx - 1, y0 - 3, 'b_fish', .5)
            c.put(tx + 1, y0 - 3, 'b_fish', .62)


def paint(sc, st):
    c = sc.c
    p = P_()
    zfront = p.z_at_floor_y(H + 2)
    g = {}

    # --- shell ---------------------------------------------------------------------
    c.rect(34, 0, 286, FLOOR, 'b_frost', wall_fn(34, .4, 3))
    c.hline(34, 286, 30, 'b_frost', .22)
    c.hline(34, 286, 31, 'b_frost', .58)
    for x in range(34 + 10, 286, 21):
        c.put(x, 29, 'steel', .65)
        c.put(x, 32, 'steel', .6)
    # kick plate (diamond plate steel)
    def kick(xx, yy):
        d = ((xx + yy * 2) % 6 < 1) | ((xx - yy * 2) % 6 < 1)
        return np.where(d, .44, .32) + (yy - (FLOOR - 7)) * -.01
    c.rect(34, FLOOR - 7, 286, FLOOR, 'steel', kick, dith=.2)
    c.hline(34, 286, FLOOR - 7, 'b_frost', .78)
    # frost crust along the top of the back wall
    B.frost_edge(c, 34, 0, 286, 16, seed=8, amount=1.0, lum=.86, scale=4)
    # side walls (panelled, receding, darker)
    lw = p.quad([(34, 0, 0), (34, 0, zfront), (34, 140, zfront), (34, 140, 0)])
    c.poly(lw, 'b_frost', side_fn(p, 34, .3, 7))
    rw = p.quad([(286, 0, 0), (286, 0, zfront), (286, 140, zfront), (286, 140, 0)])
    c.poly(rw, 'b_frost', side_fn(p, 286, .27, 9))
    for X, sgn in ((34, 1), (286, -1)):
        pts = p.quad([(X, 0, 0), (X, 0, zfront), (X, 7, zfront), (X, 7, 0)])
        c.poly(pts, 'steel', .3)
        a, b = p.P(X, 7, 0), p.P(X, 7, zfront)
        c.line(a[0], a[1], b[0], b[1], 'b_frost', .7)
    # corner frost columns
    c.vline(34, 0, FLOOR, 'b_frost', .7)
    c.vline(285, 0, FLOOR, 'b_frost', .62)

    # concrete floor: slabs, frost drifts, drain, drag marks
    fl = floor_poly(p, 34, 286, 0, zfront)
    N = noise2(W, H, 9, 31, 3)
    Nf = noise2(W, H, 3, 32, 2)

    def floorfn(xx, yy):
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        X = p.cx + (xx - p.cx) / s
        Z = p.D * (1 - 1 / s)
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = .34 + (N[yi, xi] - .5) * .12
        sx = (X - 34) % 42
        sz = Z % 30
        L = np.where((sx < .9 / s * 1.3) | (sz < .9 / s * 1.6), .19, L)
        edge = np.clip(1 - np.minimum(X - 34, 286 - X) / 34, 0, 1) + np.clip(1 - Z / 18, 0, 1) * .8
        L = L + edge * (.2 + (Nf[yi, xi] - .5) * .34)
        return L
    c.poly(fl, 'ice', floorfn)
    # drain grate
    dg = p.quad([(150, 0, 52), (172, 0, 52), (172, 0, 64), (150, 0, 64)])
    c.poly(dg, 'steel', .16)
    for X in range(152, 172, 3):
        a, b = p.P(X, 0, 52), p.P(X, 0, 64)
        c.line(a[0], a[1], b[0], b[1], 'steel', .48)
    # frozen puddle around the drain
    px_, py_ = p.P(184, 0, 72)
    c.ellipse(px_, py_, 16, 3.5, 'ice', .5, dith=.25)
    c.ellipse(px_ + 1, py_, 12, 2.4, 'ice', .6, dith=.2)
    c.hline(int(px_) - 9, int(px_) - 2, int(py_) - 1, 'b_frost', .95)
    c.put(int(px_) + 4, int(py_) + 1, 'b_frost', .9)
    # drag marks: two heel furrows from the door to where Rook was dropped
    for off in (-3, 3):
        prev = None
        for i in range(0, 41):
            t = i / 40
            X = 58 + (150 - 58) * t + off * (1 - t * .3)
            Z = 6 + (78 - 6) * t ** 1.1
            x, y = p.P(X + math.sin(t * 9) * 1.5, 0, Z)
            if prev:
                c.line(prev[0], prev[1], x, y, 'ice', .2)
            prev = (x, y)
    # cigarette butt by the door
    cbx, cby = p.P(82, 0, 14)
    c.hline(int(cbx), int(cbx) + 2, int(cby), 'paper', .8)
    c.put(int(cbx) + 2, int(cby), 'trench', .5)

    # --- door (left on the back wall) ---------------------------------------------------
    dx0, dx1 = 42, 70
    dy0, dy1 = FLOOR - 46, FLOOR
    g['door'] = (dx0, dy0, dx1, dy1)
    c.rect(dx0 - 5, dy0 - 5, dx1 + 5, dy1, 'steel', .4)
    c.hline(dx0 - 5, dx1 + 5, dy0 - 5, 'b_frost', .88)
    c.vline(dx0 - 5, dy0 - 5, dy1, 'b_frost', .62)
    c.vline(dx1 + 4, dy0 - 5, dy1, 'steel', .2)
    c.rect(dx0 - 2, dy0 - 2, dx1 + 2, dy1, 'steel', .2)
    # rubber seal with frost
    c.rect(dx0 - 1, dy0 - 1, dx1 + 1, dy1, 'b_frost', .62, dith=.6)
    # insulated leaf: steel skin with quilted vertical ribs
    c.rect(dx0, dy0, dx1, dy1, 'steel', hgrad(dx0, dx1, .58, .44))
    for x in range(dx0 + 3, dx1 - 1, 5):
        c.vline(x, dy0 + 2, dy1 - 2, 'steel', .34)
        c.vline(x + 1, dy0 + 2, dy1 - 2, 'steel', .66)
    B.frost_edge(c, dx0, dy0, dx1, dy0 + 16, seed=5, amount=.9, lum=.86)
    c.rect(dx0, dy1 - 5, dx1, dy1, 'b_frost', vgrad(dy1 - 5, dy1, .55, .82))
    # hinges (left), rust
    for hy in (dy0 + 5, dy1 - 13):
        c.rect(dx0 - 4, hy, dx0 + 6, hy + 6, 'steel', .6)
        c.hline(dx0 - 4, dx0 + 6, hy, 'steel', .85)
        c.vline(dx0 - 1, hy, hy + 6, 'steel', .3)
        c.put(dx0 + 3, hy + 5, 'rust', .55)
        c.vline(dx0 + 3, hy + 6, hy + 9, 'rust', .35)
    # stencil on the door (drawn after the hinges)
    c.rect(dx0 + 1, dy0 + 6, dx1 - 1, dy0 + 19, 'paper', .72, dith=.2)
    c.hline(dx0 + 1, dx1 - 1, dy0 + 6, 'b_frost', .9)
    B.text(c, (dx0 + dx1) // 2, dy0 + 7, 'SAFETY', 'red', .4, center=True)
    B.text(c, (dx0 + dx1) // 2, dy0 + 13, 'EXIT', 'red', .4, center=True)
    # latch housing + release plate with the bare square spindle
    sx, sy = dx1 - 8, dy0 + 27
    g['spindle'] = (sx, sy)
    c.rect(sx - 5, sy - 7, sx + 6, sy + 8, 'chrome', .6)
    c.hline(sx - 5, sx + 6, sy - 7, 'chrome', .85)
    c.vline(sx + 5, sy - 7, sy + 8, 'steel', .36)
    c.hline(sx - 5, sx + 6, sy + 7, 'steel', .36)
    for (a, b) in ((sx - 4, sy - 6), (sx + 4, sy - 6), (sx - 4, sy + 6), (sx + 4, sy + 6)):
        c.put(a, b, 'steel', .3)
    c.rect(sx - 2, sy - 2, sx + 3, sy + 3, 'steel', .3)
    c.rect(sx - 1, sy - 1, sx + 2, sy + 2, 'chrome', .9)
    c.put(sx - 1, sy - 1, 'b_frost', .99)
    c.put(sx + 1, sy + 1, 'steel', .45)
    c.rect(dx1 - 2, sy - 3, dx1 + 3, sy + 4, 'steel', .5)           # latch bolt housing
    # scratch marks on the door
    for (a, b) in ((dx0 + 7, dy0 + 23), (dx0 + 9, dy0 + 22), (dx0 + 11, dy0 + 24)):
        c.line(a, b, a + 1, b + 8, 'steel', .82)

    # --- thermometer (round dial) + temperature log -----------------------------------------
    tx, ty = 86, 54
    g['thermo'] = (tx, ty)
    c.ellipse(tx, ty, 7, 7, 'brass', .6)
    c.ellipse(tx, ty, 6, 6, 'brass', .32)
    c.ellipse(tx, ty, 5, 5, 'paper', .8, dith=.2)
    for a in range(0, 360, 30):
        r = math.radians(a)
        c.put(int(round(tx + math.cos(r) * 4)), int(round(ty + math.sin(r) * 4)), 'ink', .2)
    # blue sector (below zero) and the needle buried in it
    for a in range(100, 200, 12):
        r = math.radians(a)
        c.put(int(round(tx + math.cos(r) * 3)), int(round(ty + math.sin(r) * 3)), 'neonblue', .5)
    c.line(tx, ty, tx - 4, ty + 1, 'red', .72)
    c.put(tx, ty, 'ink', .1)
    c.put(tx - 3, ty - 3, 'b_frost', .98)
    c.put(tx - 2, ty - 4, 'b_frost', .92)
    c.put(tx + 5, ty - 5, 'brass', .92)
    # clipboard with the temperature log on a nail
    c.put(tx, ty + 10, 'steel', .7)
    c.rect(tx - 5, ty + 11, tx + 6, ty + 25, 'oak', .5)
    c.rect(tx - 4, ty + 13, tx + 5, ty + 25, 'paper', .78, dith=.2)
    c.rect(tx - 2, ty + 11, tx + 3, ty + 13, 'steel', .7)
    for k in range(5):
        c.hline(tx - 3, tx + 3 - (k % 3), ty + 15 + k * 2, 'ink', .4)
    c.hline(tx - 4, tx + 5, ty + 13, 'b_frost', .9)

    # --- the beam with the fish rows ----------------------------------------------------
    bz = 8
    xa, ya = p.P(98, 62, bz)
    xb, yb = p.P(230, 58, bz)
    xa, ya, xb, yb = int(xa), int(ya), int(xb), int(yb)
    g['beam'] = (xa, ya, xb, yb)
    for x in (xa + 10, xb - 11):
        c.rect(x, 0, x + 2, ya, 'steel', .45)
        c.vline(x, 0, ya, 'b_frost', .72)
        c.rect(x - 1, ya - 2, x + 3, ya, 'steel', .6)
    c.rect(xa, ya, xb, yb, 'oak', vgrad(ya, yb, .55, .32))
    c.hline(xa, xb, ya, 'b_frost', .92)
    c.hline(xa, xb, yb, 'oak', .16)
    icicles(c, xa + 1, xb - 1, yb + 1, 4, maxlen=3, step=(3, 7))
    g['fish'] = {}
    for gi, letter in enumerate('ABC'):
        gx0 = xa + 4 + gi * 44
        mx = gx0 + 18
        # white stencil plate with the row letter, centred over the group
        c.rect(mx - 4, ya - 9, mx + 5, ya, 'paper', .78, dith=.15)
        c.hline(mx - 4, mx + 5, ya - 9, 'b_frost', .95)
        c.vline(mx + 4, ya - 9, ya, 'paper', .5)
        B.text(c, mx - 1, ya - 7, letter, 'red', .45)
        c.put(mx - 4, ya - 9, 'steel', .5)
        for k in range(4):
            x = gx0 + 3 + k * 10
            top = yb + 1
            c.vline(x, top - 1, top + 2, 'steel', .72)
            c.put(x + 1, top + 2, 'steel', .5)
            c.put(x - 1, top + 1, 'steel', .5)
            name = f'{letter}{k + 1}'
            g['fish'][name] = (x, top)
            seed = 100 + gi * 10 + k
            if name == 'B3':
                fish(c, x, top + 3, 24, seed=seed, lum=.6, stitched=True, cut='fish_cut' in st)
            else:
                fish(c, x, top + 3, 24, seed=seed)

    # --- refrigeration unit + fan (upper right) ---------------------------------------
    ux0, uy0, ux1, uy1 = 238, 8, 282, 38
    g['coil'] = (ux0, uy0, ux1, uy1)
    c.rect(ux0, uy0, ux1, uy1, 'steel', vgrad(uy0, uy1, .52, .36))
    c.hline(ux0, ux1, uy0, 'b_frost', .92)
    c.vline(ux0, uy0, uy1, 'steel', .66)
    c.vline(ux1 - 1, uy0, uy1, 'steel', .22)
    c.hline(ux0, ux1, uy1 - 1, 'steel', .2)
    for y in range(uy0 + 3, uy1 - 2, 2):
        c.hline(ux0 + 22, ux1 - 3, y, 'b_frost', .66)
        c.hline(ux0 + 22, ux1 - 3, y + 1, 'steel', .22)
    B.frost_edge(c, ux0 + 21, uy0 + 1, ux1 - 2, uy1 - 1, seed=17, amount=.7, lum=.88, top=False)
    fx, fy = ux0 + 11, (uy0 + uy1) // 2
    g['fan'] = (fx, fy)
    c.ellipse(fx, fy, 9.5, 9.5, 'steel', .62)
    c.ellipse(fx, fy, 8.5, 8.5, 'steel', .1)
    for a in range(0, 360, 90):
        r = math.radians(a + 15)
        for t in np.linspace(1.5, 6.5, 8):
            w = 1.6 * math.sin(t / 6.5 * math.pi)
            cx_ = fx + math.cos(r) * t - math.sin(r) * .8
            cy_ = fy + math.sin(r) * t + math.cos(r) * .8
            c.ellipse(cx_, cy_, max(w, .6), max(w, .6), 'steel', .45)
    for rr in (4, 7):
        for a in np.linspace(0, 2 * math.pi, 44):
            c.put(int(round(fx + math.cos(a) * rr)), int(round(fy + math.sin(a) * rr)), 'steel', .58)
    c.ellipse(fx, fy, 1.5, 1.5, 'steel', .75)
    c.rect(ux0 + 23, uy1 - 8, ux1 - 4, uy1 - 2, 'gold', .62, dith=.1)
    B.text(c, ux0 + 25, uy1 - 7, 'NH3', 'ink', .1)
    # pipes
    c.rect(ux1 - 7, 0, ux1 - 3, uy0, 'steel', hgrad(ux1 - 7, ux1 - 3, .62, .3))
    c.rect(ux0 + 4, 0, ux0 + 7, uy0, 'steel', hgrad(ux0 + 4, ux0 + 7, .58, .3))
    c.rect(36, 3, ux0 + 7, 7, 'steel', vgrad(3, 7, .62, .3))
    B.frost_edge(c, 36, 1, ux0 + 7, 9, seed=19, amount=.85, lum=.88)
    icicles(c, 38, ux0 + 6, 7, 21, maxlen=6, step=(2, 7))
    icicles(c, ux0 + 1, ux1 - 1, uy1, 23, maxlen=8, step=(2, 4))
    B.veil(c, ux0, uy1, ux1, uy1 + 20, lambda xx, yy: np.clip(1 - (yy - uy1) / 20, 0, 1) * .5, 'b_frost', .72)

    # --- refrigerant line along the lower back wall, with a valve wheel ----------------------
    c.rect(96, 80, 236, 84, 'steel', vgrad(80, 84, .62, .28))
    c.hline(96, 236, 80, 'b_frost', .9)
    for x in range(104, 236, 26):
        c.rect(x, 79, x + 2, 86, 'steel', .5)
        c.put(x, 86, 'steel', .3)
    vx_, vy_ = 206, 82
    c.vline(vx_, 74, 80, 'steel', .5)
    c.ellipse(vx_, 72, 4, 2, 'red', .45)
    c.ellipse(vx_, 72, 2.5, 1, 'steel', .2)
    c.put(vx_ - 3, 71, 'red', .75)
    icicles(c, 97, 235, 84, 31, maxlen=3, step=(3, 8))
    # hose reel on the left wall
    hx_, hy_ = 18, 56
    c.rect(hx_ - 1, hy_ - 9, hx_ + 2, hy_ + 9, 'steel', .4)
    c.ellipse(hx_, hy_, 6, 8, 'red', .32)
    for k in range(3):
        c.ellipse(hx_, hy_, 5 - k * 1.4, 7 - k * 2, 'red', .42 + k * .06)
    c.ellipse(hx_, hy_, 1.5, 2, 'steel', .6)
    c.line(hx_ + 3, hy_ + 7, hx_ + 5, hy_ + 22, 'red', .35)
    B.frost_edge(c, hx_ - 6, hy_ - 9, hx_ + 7, hy_, seed=33, amount=.8, lum=.85)

    # --- fish boxes stacked in the back-left corner -----------------------------------
    fish_box(c, 72, 86, 19, 9, .42, seed=3, label='BFE')
    fish_box(c, 74, 77, 16, 9, .46, seed=4)
    c.hline(71, 92, 95, 'black', .3)

    # --- workbench (back right, under the unit) -----------------------------------------
    wz0, wz1 = 4, 22
    wbX0, wbX1 = 236, 284
    for X in (wbX0 + 1, wbX1 - 3):
        p.box(c, X, X + 2, 0, 18, wz0, wz0 + 2, 'oak', front=.28)
    p.box(c, wbX0 + 1, wbX1 - 1, 4, 6, wz0 + 1, wz1 - 2, 'oak', front=.3, top=.42)
    p.box(c, wbX0, wbX1, 18, 21, wz0, wz1, 'oak', front=.46, top=.62, side=.32)
    for X in (wbX0 + 1, wbX1 - 3):
        p.box(c, X, X + 2, 0, 18, wz1 - 3, wz1 - 1, 'oak', front=.36, side=.25)
    tx0, ty0, tx1, ty1 = p.front_rect(wbX0, wbX1, 18, 21, wz1)
    g['bench'] = (int(tx0), int(ty0), int(tx1), int(ty1))
    c.hline(int(tx0), int(tx1), int(ty0), 'b_frost', .88)
    sxw, syw = p.P(242, 21, 12)
    c.rect(int(sxw) - 3, int(syw) - 1, int(sxw) + 4, int(syw) + 1, 'brass', .55)
    c.vline(int(sxw), int(syw) - 8, int(syw) - 1, 'brass', .62)
    c.hline(int(sxw) - 4, int(sxw) + 5, int(syw) - 8, 'brass', .75)
    c.vline(int(sxw) - 4, int(syw) - 8, int(syw) - 5, 'brass', .45)
    c.vline(int(sxw) + 4, int(syw) - 8, int(syw) - 5, 'brass', .45)
    c.hline(int(sxw) - 5, int(sxw) - 2, int(syw) - 5, 'brass', .5)
    c.hline(int(sxw) + 3, int(sxw) + 6, int(syw) - 5, 'brass', .5)
    lx_, ly_ = p.P(258, 21, 10)
    c.rect(int(lx_) - 4, int(ly_) - 2, int(lx_) + 4, int(ly_) + 1, 'red', .38)
    c.hline(int(lx_) - 4, int(lx_) + 4, int(ly_) - 2, 'paper', .72)
    ux_, uy_ = p.P(276, 21, 9)
    c.ellipse(int(ux_), int(uy_) - 1, 2.5, 2, 'trench', .62)
    c.put(int(ux_) - 1, int(uy_) - 2, 'trench', .85)
    c.line(int(ux_) + 2, int(uy_), int(ux_) + 4, int(uy_) + 5, 'trench', .55)
    mx_, my_ = p.P(268, 21, 6)
    c.rect(int(mx_) - 1, int(my_) - 4, int(mx_) + 2, int(my_), 'white', .62)
    c.put(int(mx_) + 2, int(my_) - 3, 'white', .45)
    c.hline(int(mx_) - 1, int(mx_) + 2, int(my_) - 4, 'black', .3)
    bx_, by_ = p.P(250, 0, 15)
    B.cylinder(c, int(bx_), int(by_) - 7, int(by_), 3.5, 1.2, 'steel', .46)
    c.line(int(bx_) - 3, int(by_) - 7, int(bx_), int(by_) - 11, 'steel', .5)
    c.line(int(bx_), int(by_) - 11, int(bx_) + 3, int(by_) - 7, 'steel', .5)
    B.frost_edge(c, int(tx0), int(ty0), int(tx1), int(ty0) + 4, seed=27, amount=.6, lum=.86)
    # frozen gloves on a nail above the bench
    c.put(262, 50, 'steel', .7)
    c.poly([(259, 51), (264, 51), (265, 58), (262, 59), (259, 57)], 'trench', .38)
    c.poly([(262, 52), (267, 52), (267, 59), (264, 60)], 'trench', .46)
    c.hline(259, 267, 51, 'b_frost', .85)

    # --- brine tub (left, near the door) ----------------------------------------------------
    tcx, tcz = 94, 44
    tbx, tby = p.P(tcx, 0, tcz)
    tbx, tby = int(tbx), int(tby)
    trx = 15
    ttop = tby - 14
    g['tub'] = (tbx, tby, trx, ttop)

    def tubfn(xx, yy):
        u = np.clip((xx + .5 - tbx) / trx, -1, 1)
        st_ = (np.arcsin(u) / np.pi * 9) % 1
        return .52 - u * .22 - .1 * u * u + np.where(st_ < .14, -.12, 0)
    c.rect(tbx - trx, ttop, tbx + trx, tby, 'oak', tubfn)
    c.ellipse(tbx, tby, trx, 3.5, 'oak', tubfn)
    for hy in (ttop + 3, tby - 3):
        c.rect(tbx - trx, hy, tbx + trx, hy + 2, 'steel', hgrad(tbx - trx, tbx + trx, .62, .3))
    c.ellipse(tbx, ttop, trx, 4, 'oak', .4)
    c.ellipse(tbx, ttop + .5, trx - 2, 3, 'ice', .64, dith=.4)
    c.ellipse(tbx - 3, ttop - 1, 6, 1.6, 'b_frost', .86, dith=.2)
    c.line(tbx - 6, ttop, tbx + 2, ttop + 2, 'ice', .42)
    c.line(tbx + 2, ttop + 2, tbx + 8, ttop + 1, 'ice', .44)
    c.hline(tbx - trx + 1, tbx + trx - 1, ttop - 4, 'b_frost', .82)
    B.text(c, tbx - 8, tby - 10, 'BRINE', 'paper', .55, wear=.03, seed=9)
    if 'tub_salted' in st:
        c.ellipse(tbx, ttop + .5, trx - 2, 3, 'ice', .34, dith=.5)
        c.ellipse(tbx + 2, ttop + 1, 7, 1.6, 'ice', .22, dith=.3)
        for k in range(12):
            a = k * .62
            c.put(int(tbx + math.cos(a) * (trx - 3)), int(ttop + math.sin(a) * 2.2), 'white', .9)
        c.hline(tbx - 5, tbx - 1, ttop - 1, 'b_frost', .92)
        for x in (tbx - 9, tbx + 4, tbx + 10):
            c.vline(x, ttop + 3, ttop + 8, 'ice', .28)
    if 'handle_in_ice' in st:
        hl = .45 if 'tub_salted' not in st else .62
        c.line(tbx - 7, ttop - 1, tbx + 5, ttop + 2, 'steel', hl + .22)
        c.line(tbx - 7, ttop, tbx + 5, ttop + 3, 'steel', hl)
        c.rect(tbx - 9, ttop - 3, tbx - 6, ttop + 3, 'steel', hl + .1)
        c.put(tbx - 8, ttop - 3, 'steel', hl + .4)
        c.rect(tbx + 4, ttop + 1, tbx + 8, ttop + 4, 'red', .52)
        c.put(tbx + 4, ttop + 1, 'red', .8)

    # --- sack of rock salt (front left) --------------------------------------------------
    sx_, sy_ = p.P(54, 0, 86)
    sx_, sy_ = int(sx_), int(sy_)
    g['salt'] = (sx_, sy_)
    sack = [(sx_ - 11, sy_), (sx_ + 11, sy_), (sx_ + 12, sy_ - 10), (sx_ + 9, sy_ - 20), (sx_ + 4, sy_ - 23),
            (sx_ - 5, sy_ - 23), (sx_ - 10, sy_ - 19), (sx_ - 12, sy_ - 9)]
    Ns = noise2(W, H, 2, 41, 1)

    def sackfn(xx, yy):
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        weave = ((xx + yy) % 2 == 0) * .04
        return .6 - (xx - sx_) / 26 * .28 + (Ns[yi, xi] - .5) * .1 + weave - np.clip((yy - sy_ + 6) / 6, 0, 1) * .12
    c.poly(sack, 'trench', sackfn)
    c.ellipse(sx_ - .5, sy_ - 22, 8, 2.5, 'trench', .66)
    c.ellipse(sx_ - .5, sy_ - 22, 6.5, 1.8, 'white', .8, dith=.3)
    for (a, b) in ((-3, -23), (1, -22), (3, -23), (-1, -21)):
        c.put(sx_ + a, sy_ + b, 'white', .98)
    B.text(c, sx_ - 7, sy_ - 16, 'ROCK', 'red', .36, wear=.08, seed=2)
    B.text(c, sx_ - 7, sy_ - 10, 'SALT', 'red', .36, wear=.08, seed=3)
    for k in range(9):
        c.put(sx_ + 12 + k * 2 - (k % 3), sy_ - 1 + (k % 2), 'white', .82)
    c.rect(sx_ + 13, sy_ - 3, sx_ + 18, sy_ - 1, 'steel', .58)
    c.hline(sx_ + 18, sx_ + 22, sy_ - 2, 'oak', .52)

    # --- Halcyon crates (front right, stacked) ----------------------------------------------
    cz0, cz1 = 70, 94
    cX0, cX1 = 238, 278
    base_y = int(p.P(0, 0, cz1)[1])
    g['crates_base'] = base_y
    with sc.obj('crates_stack', baseline=base_y):
        B.crate_box(c, p, cX0, cX1, 0, 22, cz0, cz1, 'oak', .56, stencil='HALCYON', stencil2='HOUSE',
                    stencil_ramp='red', stencil_lum=.3, seed=5, boards=3)
        B.crate_box(c, p, cX0 + 4, cX1 - 4, 22, 38, cz0 + 3, cz1 - 4, 'oak', .58, stencil='MEDICAL',
                    stencil2='KEEP COLD', stencil_ramp='red', stencil_lum=.3, seed=6, boards=3)
        top = p.quad([(cX0 + 4, 38, cz0 + 3), (cX1 - 4, 38, cz0 + 3), (cX1 - 4, 38, cz1 - 4),
                      (cX0 + 4, 38, cz1 - 4)])
        if 'crate_open' in st:
            c.poly(top, 'gold', .4)
            N3 = noise2(W, H, 1.5, 51, 1)
            m, r = c.poly_mask(top)
            if m is not None:
                ys, xs = np.nonzero(m)
                for yy_, xx_ in zip(ys, xs):
                    if N3[yy_ + r[1], xx_ + r[0]] > .58:
                        c.put(xx_ + r[0], yy_ + r[1], 'gold', .72)
            for k in range(5):
                vx, vy = p.P(cX0 + 11 + k * 5, 38, cz0 + 10 + (k % 2) * 5)
                c.vline(int(vx), int(vy) - 4, int(vy), 'glass', .78, emis=.2)
                c.put(int(vx), int(vy) - 5, 'white', .85)
            # lid leaning against the stack, nails out
            l0 = p.P(cX1 - 4, 38, cz0 + 3)
            lid = [(l0[0] - 30, l0[1] - 2), (l0[0] - 2, l0[1] - 12), (l0[0] + 1, l0[1] - 8), (l0[0] - 27, l0[1] + 3)]
            c.poly(lid, 'oak', .6)
            c.line(lid[0][0], lid[0][1], lid[1][0], lid[1][1], 'oak', .78)
            c.line(lid[3][0], lid[3][1], lid[2][0], lid[2][1], 'oak', .36)
            for t in (.15, .5, .85):
                nx = lid[0][0] + (lid[1][0] - lid[0][0]) * t
                ny = lid[0][1] + (lid[1][1] - lid[0][1]) * t
                c.put(int(nx), int(ny) - 1, 'steel', .85)
        else:
            c.poly(top, 'oak', .66)
            for k in range(1, 4):
                a = p.P(cX0 + 4, 38, cz0 + 3 + k * (cz1 - cz0 - 7) / 4)
                b = p.P(cX1 - 4, 38, cz0 + 3 + k * (cz1 - cz0 - 7) / 4)
                c.line(a[0], a[1], b[0], b[1], 'oak', .44)
            a = p.P(cX0 + 4, 38, cz1 - 4)
            b = p.P(cX1 - 4, 38, cz1 - 4)
            c.line(a[0], a[1], b[0], b[1], 'b_frost', .92)
    g['crates'] = (int(p.P(cX0, 38, cz1)[0]) - 2, int(p.P(cX0 + 4, 38, cz0)[1]) - 2,
                   min(W, int(p.P(cX1, 0, cz1)[0]) + 1), min(H, base_y))

    # --- the caged bulb ---------------------------------------------------------------------
    lbx, lby = 160, 13
    g['bulb'] = (lbx, lby)
    c.vline(lbx, 0, lby - 6, 'ink', .4)
    c.rect(lbx - 2, lby - 7, lbx + 3, lby - 4, 'brass', .5)
    c.ellipse(lbx + .5, lby, 3, 3.5, 'b_sodium', .9, emis=1)
    c.ellipse(lbx + .5, lby - .5, 1.6, 2, 'b_sodium', 1.0, emis=1)
    for a in (-4, 0, 4):
        c.line(lbx + .5, lby - 5, lbx + .5 + a, lby + 4, 'steel', .55)
    c.hline(lbx - 4, lbx + 5, lby + 4, 'steel', .55)
    c.hline(lbx - 3, lbx + 4, lby - 2, 'steel', .5)
    c.hline(lbx - 4, lbx + 5, lby + 1, 'steel', .5)

    # --- ice pick on the bench (state) ------------------------------------------------------
    ipx, ipy = p.P(250, 21, 11)
    g['ice_pick'] = (int(ipx), int(ipy))
    if 'ice_pick' in st:
        x, y = int(ipx), int(ipy)
        # lying diagonally on the bench top: wooden handle lower-left, spike up-right
        c.line(x - 7, y + 2, x - 2, y, 'wood', .5)
        c.line(x - 7, y + 1, x - 2, y - 1, 'wood', .78)
        c.put(x - 1, y - 1, 'brass', .8)
        c.line(x, y - 1, x + 9, y - 4, 'chrome', .95)
        c.line(x, y, x + 8, y - 3, 'steel', .4)
        c.put(x + 9, y - 4, 'white', .9, emis=.4)

    # --- handle fitted on the spindle (state) ------------------------------------------------
    if 'handle_fitted' in st:
        x, y = g['spindle']
        c.rect(x - 2, y - 2, x + 3, y + 3, 'steel', .72)
        c.rect(x - 9, y - 1, x, y + 2, 'steel', .66)
        c.hline(x - 9, x, y - 1, 'steel', .9)
        c.rect(x - 13, y - 2, x - 8, y + 3, 'red', .52)
        c.put(x - 12, y - 2, 'red', .78)
        c.put(x, y, 'b_frost', .92)

    # --- door open (state) ------------------------------------------------------------------
    if 'door_open' in st:
        dx0, dy0, dx1, dy1 = g['door']
        c.rect(dx0 - 1, dy0 - 1, dx1 + 1, dy1, 'fog', vgrad(dy0, dy1, .64, .4), emis=.6)
        c.rect(dx0 + 4, dy0 + 6, dx0 + 13, dy0 + 17, 'fog', .92, emis=.85)
        c.vline(dx0 + 8, dy0 + 6, dy0 + 17, 'fog', .45, emis=.6)
        c.hline(dx0 + 4, dx0 + 13, dy0 + 11, 'fog', .5, emis=.6)
        c.rect(dx1 - 12, dy1 - 18, dx1 - 1, dy1 - 6, 'oak', .3, emis=.3)
        c.rect(dx1 - 9, dy1 - 26, dx1 - 3, dy1 - 18, 'oak', .26, emis=.3)
        c.rect(dx0, dy1 - 6, dx1 + 1, dy1, 'concrete', .48, emis=.4)
        leaf = [(dx0 - 1, dy0 - 1), (dx0 - 12, dy0 - 5), (dx0 - 12, dy1 + 6), (dx0 - 1, dy1)]
        c.poly(leaf, 'steel', hgrad(dx0 - 12, dx0, .52, .32))
        c.poly([(dx0 - 12, dy0 - 5), (dx0 - 15, dy0 - 4), (dx0 - 15, dy1 + 7), (dx0 - 12, dy1 + 6)], 'b_frost', .62)
        for k in range(3):
            xx_ = dx0 - 3 - k * 3
            c.line(xx_, dy0 + k - 1, xx_, dy1 + 1 + k * 2, 'steel', .64)
        c.light_poly([(dx0, dy1), (dx1, dy1), (dx1 + 24, H), (dx0 - 4, H)], .2)

    # cold light cone under the bulb and frost glitter near it
    c.light_poly([(lbx - 3, lby + 4), (lbx + 4, lby + 4), (lbx + 70, FLOOR + 30), (lbx - 70, FLOOR + 30)], .07)
    rng = np.random.default_rng(77)
    for _ in range(60):
        x = int(rng.normal(lbx, 70))
        y = int(rng.uniform(0, 18))
        if 34 < x < 286:
            c.put(x, y, 'b_frost', .99, emis=.3)

    # --- lighting ---------------------------------------------------------------------------
    c.ambient = .42
    c.add_light(lbx, lby + 2, 210, .74, falloff=1.2)
    c.add_light(lbx, 116, 120, .26, ystretch=2.6)
    c.glow(lbx, lby, 26, '#ffe6a8', .75)
    c.glow(lbx, lby + 30, 110, '#a8c8ec', .12)
    c.shadow_poly(p.quad([(wbX0, 0, wz0), (wbX1, 0, wz0), (wbX1, 0, wz1 + 2), (wbX0, 0, wz1 + 2)]), .45)
    c.shadow_ellipse(tbx, tby + 1, trx + 3, 4, .5)
    c.shadow_ellipse(sx_, sy_ + 1, 14, 3.5, .45)
    c.shadow_poly(p.quad([(cX0 - 4, 0, cz0 - 2), (cX1, 0, cz0 - 2), (cX1, 0, cz1 + 3), (cX0 - 6, 0, cz1 + 3)]), .45)
    # the beam and fish cast a soft shadow band on the wall below them
    c.shadow_poly([(xa + 2, yb + 30), (xb - 2, yb + 30), (xb + 6, yb + 44), (xa - 6, yb + 44)], .18)
    B.vignette(c, 160, 64, 210, 140, lo=.55)
    return g, p


def side_fn(p, X, base, seed):
    N = noise2(W, H, 7, seed, 3)

    def fn(xx, yy):
        s = np.maximum((xx - p.cx) / (X - p.cx), 1e-3)
        Z = p.D * (1 - 1 / s)
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = base + (N[yi, xi] - .5) * .1
        L = np.where((Z % 34) < 1.2 * s, L - .12, L)
        L = L + np.clip((30 - yy) / 30, 0, 1) * .15
        return L
    return fn


STATES = [
    # name, extra states drawn for the alt render, depth
    ('door_open', {'door_open'}, 8),
    ('handle_fitted', {'handle_fitted'}, 5),
    ('fish_cut', {'fish_cut'}, 4),
    ('ice_pick', {'ice_pick'}, 4),
    ('tub_salted', {'tub_salted'}, 3),
    ('handle_in_ice', {'handle_in_ice'}, 6),
    ('crate_open', {'crate_open'}, None),
]


def build():
    sc = Scene('cold_store', W, H, seed=SEED)
    g, p = paint(sc, set())
    for name, sts, depth in STATES:
        alt = Scene('cold_store', W, H, seed=SEED)
        paint(alt, sts)
        if name == 'crate_open':
            depth = g['crates_base'] + 1
        B.state_from(sc, name, alt.c, depth=depth)
    c = sc.c

    # --- interaction geometry ------------------------------------------------------------
    dx0, dy0, dx1, dy1 = g['door']
    sc.hotspot('door', rect=(dx0 - 4, dy0 - 4, dx1 + 4, dy1), walk=(60, 104), face='up')
    sx, sy = g['spindle']
    sc.hotspot('spindle', rect=(sx - 5, sy - 6, sx + 6, sy + 7), walk=(64, 104), face='up')
    fx0 = g['beam'][0]
    fx1 = g['beam'][2]
    sc.hotspot('fish_rows', rect=(fx0, g['beam'][1] - 2, fx1, g['fish']['A1'][1] + 30), walk=(160, 106), face='up')
    bx, by = g['fish']['B3']
    sc.hotspot('fish_b3', rect=(bx - 5, by - 1, bx + 6, by + 28), walk=(bx, 106), face='up')
    b = g['bench']
    sc.hotspot('workbench', rect=(b[0] - 2, b[1] - 10, b[2] + 1, b[3] + 22), walk=(258, 108), face='up')
    ix, iy = g['ice_pick']
    sc.hotspot('ice_pick', rect=(ix - 9, iy - 7, ix + 11, iy + 4), walk=(250, 108), face='up')
    sx_, sy_ = g['salt']
    sc.hotspot('salt', rect=(sx_ - 13, sy_ - 25, sx_ + 13, sy_ + 2), walk=(sx_ + 24, sy_ + 4), face='left')
    tbx, tby, trx, ttop = g['tub']
    sc.hotspot('tub', rect=(tbx - trx - 1, ttop - 6, tbx + trx + 1, tby + 4), walk=(tbx + 4, tby + 8), face='up')
    cr = g['crates']
    sc.hotspot('crates', rect=cr, walk=(240, 128), face='right')
    tx, ty = g['thermo']
    sc.hotspot('thermometer', rect=(tx - 8, ty - 8, tx + 9, ty + 15), walk=(104, 104), face='up')
    u = g['coil']
    sc.hotspot('coil', rect=(u[0] - 2, u[1] - 2, u[2] + 2, u[3] + 8), walk=(232, 106), face='up')
    lbx, lby = g['bulb']
    sc.hotspot('bulb', rect=(lbx - 6, lby - 8, lbx + 7, lby + 6), walk=(160, 116), face='up')

    # walkable floor minus tub, sack, crates, bench
    zf = p.z_at_floor_y(H + 2)
    fl = p.quad([(38, 0, 12), (282, 0, 12), (282, 0, zf), (38, 0, zf)])
    holes = [
        p.quad([(74, 0, 34), (112, 0, 34), (112, 0, 54), (74, 0, 54)]),      # tub
        p.quad([(36, 0, 74), (70, 0, 74), (70, 0, 92), (36, 0, 92)]),        # sack
        p.quad([(232, 0, 64), (300, 0, 64), (300, 0, 120), (232, 0, 120)]),    # crates
        p.quad([(228, 0, 0), (290, 0, 0), (290, 0, 26), (228, 0, 26)]),      # bench
    ]
    sc.walkable([(int(x), int(y)) for x, y in fl], holes=[[(int(x), int(y)) for x, y in h] for h in holes])
    sc.point('start', 160, 122, 'down')
    sc.point('wake', 150, 126, 'down')
    sc.point('door_spot', 60, 104, 'up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, p.char_scale(FLOOR, 140), 140, 1.0)
    sc.meta['floor'] = 'stone'

    # fan animation (3 frames, rotating blades)
    fx, fy = g['fan']

    def fan_frame(k):
        def f(cc):
            cc.ellipse(fx, fy, 7, 7, 'steel', .1)
            for a in range(4):
                r = math.radians(a * 90 + k * 30)
                for t in np.linspace(1.5, 6.5, 8):
                    w = 1.6 * math.sin(t / 6.5 * math.pi)
                    px = fx + math.cos(r) * t
                    py = fy + math.sin(r) * t
                    cc.ellipse(px - math.sin(r) * .8, py + math.cos(r) * .8, max(w, .6), max(w, .6), 'steel', .5)
            for rr in (4, 7):
                for a in np.linspace(0, 2 * math.pi, 40):
                    cc.put(int(round(fx + math.cos(a) * rr)), int(round(fy + math.sin(a) * rr)), 'steel', .55)
            cc.ellipse(fx, fy, 1.5, 1.5, 'steel', .75)
        return f
    sc.anim('fan', [fan_frame(k) for k in range(3)], fps=12)

    # bulb flicker (cold filament: mostly steady, sometimes dips)
    def bulb_frame(level):
        def f(cc):
            cc.ellipse(lbx + .5, lby, 3, 3.5, 'b_sodium', .9 * level, emis=1)
            cc.ellipse(lbx + .5, lby - .5, 1.6, 2, 'b_sodium', 1.0 * level, emis=1)
            for a in (-4, 0, 4):
                cc.line(lbx + .5, lby - 5, lbx + .5 + a, lby + 4, 'steel', .5)
            cc.hline(lbx - 4, lbx + 5, lby + 1, 'steel', .45)
        return f
    sc.anim('bulb', [bulb_frame(1), bulb_frame(1), bulb_frame(1), bulb_frame(.7), bulb_frame(1),
                     bulb_frame(1), bulb_frame(.82), bulb_frame(1)], fps=6)
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
