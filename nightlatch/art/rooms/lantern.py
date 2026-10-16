"""The Blue Lantern jazz club, Harbor Street (Ch1-6).  400 wide, scrolls.  Smoky, blue, intimate."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
from persp import Persp, floor_poly
import props_b as B

W, H = 400, 144
FLOOR = 86
SEED = 31
STAGE_Y = 6          # stage platform height (world units)
STAGE_Z = 36         # stage front edge depth
STAGE_X = (172, 270)
BAR_X = (280, 348)
BAR_Z = (26, 36)
BAR_H = 22


def P_():
    return Persp(14, 386, 0, FLOOR, horizon=-70, depth=420)


def wall_fn(x0, base, seed):
    N = noise2(W, H, 16, seed, 3)

    def fn(xx, yy):
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        # damask-ish diamond lattice + vertical pinstripes
        mx = (xx - x0) % 12
        my = yy % 14
        dia = (np.abs(mx - 6) * 1.15 + np.abs(my - 7)) < 2.2
        ring = np.abs((np.abs(mx - 6) * 1.15 + np.abs(my - 7)) - 5.2) < .55
        L = base + np.where(dia, .07, 0) + np.where(ring, .045, 0)
        L = L + np.where(mx < 1, -.04, 0)
        L = L - (N[yi, xi] - .5) * .1
        return L
    return fn


def velvet_fn(x0, x1, base, folds=11):
    def fn(xx, yy):
        t = (xx - x0) / max(1, x1 - x0)
        f = np.sin(t * math.pi * 2 * folds + np.sin(yy * .05) * .4)
        return base + f * .13 + np.clip(f, 0, 1) ** 6 * .12
    return fn


def piano(c, p, cxw, czw, ang, st=None):
    """Upright piano rotated so the keyboard faces right-front.  Returns key geometry."""
    w, d, y0, y1 = 36, 14, STAGE_Y, STAGE_Y + 34
    a = math.radians(ang)
    ux, uz = math.cos(a), math.sin(a)
    vx, vz = -math.sin(a), math.cos(a)
    out = B.rbox(c, p, cxw, czw, w, d, y0, y1, ang, 'wood', lum_front=.42, lum_side=.3, lum_top=.5)
    g = {}
    # panels on the keyboard face (v+): lower panel, fallboard, upper panel with music desk
    if 'v+' in out:
        pts, pts3 = out['v+']
        # outline / mouldings
        for (u0, u1, v0, v1, L) in ((.08, .92, .05, .45, .36), (.08, .92, .62, .95, .38)):
            q = [B.face_point(p, pts3, u0, v0), B.face_point(p, pts3, u1, v0), B.face_point(p, pts3, u1, v1),
                 B.face_point(p, pts3, u0, v1)]
            c.poly(q, 'wood', L)
            c.line(q[3][0], q[3][1], q[2][0], q[2][1], 'wood', L + .2)
            c.line(q[0][0], q[0][1], q[1][0], q[1][1], 'wood', L - .14)
        # music sheet on the desk
        q = [B.face_point(p, pts3, .3, .66), B.face_point(p, pts3, .62, .66), B.face_point(p, pts3, .62, .9),
             B.face_point(p, pts3, .3, .9)]
        c.poly(q, 'paper', .72)
        for k in range(4):
            a0 = B.face_point(p, pts3, .33, .7 + k * .05)
            a1 = B.face_point(p, pts3, .59, .7 + k * .05)
            c.line(a0[0], a0[1], a1[0], a1[1], 'paper', .45)
        # brass candle sconces on the front corners
        for u in (.04, .96):
            q = B.face_point(p, pts3, u, .8)
            c.put(q[0], q[1], 'brass', .8)
            c.put(q[0], q[1] - 1, 'paper', .85)
    # keyboard shelf protruding from the keyboard face
    kc = (cxw + vx * (d / 2 + 3), czw + vz * (d / 2 + 3))
    kb = B.rbox(c, p, kc[0], kc[1], w - 4, 6, STAGE_Y + 18, STAGE_Y + 21, ang, 'wood', lum_front=.36,
                lum_side=.3, lum_top=.5)
    if 'top' in kb:
        pts, pts3 = kb['top']
        # keys: white strip near the front edge with black keys
        # top quad corners: (-1,-1),(1,-1),(1,1),(-1,1) in (u,v)
        def tp(u, v):
            X = kc[0] + ux * u * (w - 4) / 2 + vx * v * 3
            Z = kc[1] + uz * u * (w - 4) / 2 + vz * v * 3
            return p.P(X, STAGE_Y + 21, Z)
        q = [tp(-.94, -.2), tp(.94, -.2), tp(.94, .9), tp(-.94, .9)]
        c.poly(q, 'paper', .86)
        n = 22
        for k in range(n):
            u = -.94 + 1.88 * k / n
            if k % 7 in (0, 1, 3, 4, 5):
                a0 = tp(u + .03, -.2)
                a1 = tp(u + .03, .35)
                c.line(a0[0], a0[1], a1[0], a1[1], 'ink', .15)
        g['keys'] = tp(0, .5)
    # toe blocks / legs under the keyboard
    for u in (-.85, .85):
        X = cxw + ux * u * w / 2 + vx * (d / 2 + 2)
        Z = czw + uz * u * w / 2 + vz * (d / 2 + 2)
        B.rbox(c, p, X, Z, 3, 4, STAGE_Y, STAGE_Y + 18, ang, 'wood', lum_front=.35, lum_side=.26, lum_top=.45)
    g['top'] = out.get('top')
    g['v'] = (vx, vz)
    g['u'] = (ux, uz)
    return g


def double_bass(c, x, by, h=46, lean=.18):
    """Double bass leaning back at an angle; x,by = endpin on the floor."""
    def P(t, off=0.0):
        # point along the instrument axis (t=0 endpin, t=1 scroll), offset perpendicular
        ax = x + lean * h * t + off
        ay = by - h * t
        return ax, ay
    # body: lower bout, waist, upper bout as stacked ellipses along the axis
    for (t, rx, ry) in ((.18, 8.5, 7.5), (.33, 6.2, 5), (.45, 7, 6)):
        cx, cy = P(t)
        c.ellipse(cx, cy, rx, ry, 'oak', radial(cx - 3, cy - 3, rx * 1.6, .62, .3))
    # c-bout dark edges & f-holes
    cx, cy = P(.33)
    c.put(int(cx - 4), int(cy), 'oak', .2)
    c.put(int(cx + 4), int(cy), 'oak', .2)
    for s_ in (-1, 1):
        fx, fy = P(.3, s_ * 3)
        c.line(fx, fy - 3, fx + .5, fy + 3, 'black', .1)
    # bridge + tailpiece
    bx, byy = P(.28)
    c.hline(int(bx) - 2, int(bx) + 3, int(byy), 'oak', .8)
    tx, ty = P(.12)
    c.line(tx, ty, bx, byy, 'black', .2)
    # neck + fingerboard + scroll
    n0 = P(.5)
    n1 = P(.95)
    c.line(n0[0], n0[1], n1[0], n1[1], 'black', .25)
    c.line(n0[0] + 1, n0[1], n1[0] + 1, n1[1], 'black', .15)
    sx_, sy_ = P(1.0)
    c.ellipse(sx_, sy_, 1.6, 2.2, 'oak', .5)
    c.put(int(sx_) - 2, int(sy_) + 2, 'brass', .7)
    c.put(int(sx_) + 2, int(sy_) + 3, 'brass', .7)
    # strings (light catching)
    for s_ in (-1, 1):
        a = P(.14, s_ * .7)
        b = P(.92, s_ * .4)
        c.line(a[0], a[1], b[0], b[1], 'brass', .55)
    # endpin
    c.line(x, by, x + 1, by - 3, 'chrome', .6)


def stool(c, x, by, top_y, seat='red'):
    """Bar stool: chrome pedestal, round red leather seat."""
    c.ellipse(x, by, 5, 1.5, 'chrome', .35)
    c.vline(x, top_y + 2, by, 'chrome', .7)
    c.vline(x + 1, top_y + 2, by, 'chrome', .4)
    c.hline(x - 3, x + 4, (top_y + by) // 2 + 3, 'chrome', .55)
    c.ellipse(x, top_y + 1, 5.5, 2, seat, .4)
    c.ellipse(x, top_y, 5.5, 2, seat, radial(x - 2, top_y - 1, 7, .72, .38))
    c.hline(x - 5, x + 6, top_y + 2, 'chrome', .5)


def round_table(c, p, X, Z, r=10, cloth=True, chairs=(), candle=True, seed=0):
    """Small round café table with a white cloth and a candle lamp.  Returns screen info."""
    th = 20
    cx, cy = p.P(X, th, Z)
    _, fy = p.P(X, 0, Z)
    s = p.s(Z)
    rx = r * s
    ry = r * s * .32
    # pedestal (mostly hidden by the cloth)
    c.rect(int(cx) - 1, int(cy), int(cx) + 2, int(fy), 'black', .4)
    c.ellipse(cx, fy, rx * .5, ry * .5, 'black', .35)
    if cloth:
        # hanging cloth with folds, then the round top
        drop = 9 * s
        def clothfn(xx, yy):
            u = (xx - cx) / rx
            return .6 - u * .16 - np.clip((yy - cy) / drop, 0, 1) * .2 + np.sin(xx * 1.3) * .04
        c.poly([(cx - rx, cy), (cx + rx, cy), (cx + rx * .96, cy + drop), (cx - rx * .96, cy + drop)], 'b_smoke',
               clothfn)
        c.ellipse(cx, cy + drop, rx * .96, ry * .5, 'b_smoke', .45)
        c.ellipse(cx, cy, rx, ry, 'b_smoke', radial(cx, cy, rx * 1.1, .92, .6))
    else:
        c.ellipse(cx, cy + 1, rx, ry, 'wood', .3)
        c.ellipse(cx, cy, rx, ry, 'wood', .5)
    info = {'cx': cx, 'cy': cy, 'fy': fy, 'rx': rx, 'ry': ry, 's': s}
    if candle:
        # red glass candle lamp in a net
        lx, ly = int(cx), int(cy)
        c.rect(lx - 1, ly - 4, lx + 2, ly, 'red', .55, emis=.5)
        c.put(lx, ly - 4, 'red', .8, emis=.8)
        c.put(lx, ly - 5, 'b_sodium', .95, emis=1)
        c.put(lx, ly - 6, 'b_sodium', .75, emis=1)
        info['candle'] = (lx, ly - 5)
    return info


def bentwood_chair(c, x, by, facing=1, s=1.0, lum=.3):
    """Small bentwood chair seen from the side-front (dark)."""
    sh = int(10 * s)
    bh = int(22 * s)
    c.vline(x, by - sh, by, 'wood', lum)
    c.vline(x + int(6 * s), by - sh, by, 'wood', lum - .05)
    c.hline(x - 1, x + int(7 * s), by - sh, 'wood', lum + .15)
    bx = x - 1 if facing > 0 else x + int(6 * s)
    c.vline(bx, by - bh, by - sh, 'wood', lum + .05)
    c.line(bx, by - bh, bx + facing * 3, by - bh - 1, 'wood', lum + .1)


def paint(sc, st):
    c = sc.c
    p = P_()
    zfront = p.z_at_floor_y(H + 2)
    g = {}

    # ===================================================================== shell ====
    c.rect(14, 0, 386, FLOOR, 'b_club', wall_fn(14, .4, 3))
    # crown moulding shadow at the very top
    c.rect(14, 0, 386, 3, 'b_club', .15)
    # wainscot (dark wood panels) + dado rail
    wy = FLOOR - 20
    c.rect(14, wy, 386, FLOOR, 'wood', .34)
    for x in range(18, 386, 18):
        c.rect(x, wy + 4, x + 14, FLOOR - 4, 'wood', .3)
        c.hline(x, x + 14, wy + 4, 'wood', .18)
        c.vline(x, wy + 4, FLOOR - 4, 'wood', .2)
        c.hline(x, x + 14, FLOOR - 5, 'wood', .46)
        c.vline(x + 13, wy + 4, FLOOR - 4, 'wood', .42)
    c.rect(14, wy - 2, 386, wy + 1, 'wood', .5)
    c.hline(14, 386, wy - 2, 'brass', .55)
    c.rect(14, FLOOR - 3, 386, FLOOR, 'wood', .22)
    # side walls (slivers)
    lw = p.quad([(14, 0, 0), (14, 0, zfront), (14, 160, zfront), (14, 160, 0)])
    c.poly(lw, 'b_club', .26)
    rw = p.quad([(386, 0, 0), (386, 0, zfront), (386, 160, zfront), (386, 160, 0)])
    c.poly(rw, 'b_club', .24)
    for X in (14, 386):
        pts = p.quad([(X, 0, 0), (X, 0, zfront), (X, 20, zfront), (X, 20, 0)])
        c.poly(pts, 'wood', .26)

    # floor: polished dark planks, dance floor in front of the stage
    def floorfn(xx, yy):
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        X = p.cx + (xx - p.cx) / s
        Z = p.D * (1 - 1 / s)
        k = np.floor((X - 14) / 11)
        frac = (X - 14) / 11 - k
        L = .36 + (B.H(k, 3) - .5) * .1 + np.sin(X * 1.3 + k * 7) * .02
        L = np.where(frac < .8 / s / 11 * 1.4, .16, L)
        jz = (Z + k * 37) % 80
        L = np.where(jz < 1.0, .2, L)
        return L
    fl = floor_poly(p, 14, 386, 0, zfront)
    c.poly(fl, 'wood', floorfn)
    dz0, dz1 = STAGE_Z, STAGE_Z + 30
    dance = p.quad([(STAGE_X[0] + 4, 0, dz0), (STAGE_X[1] - 4, 0, dz0), (STAGE_X[1] - 4, 0, dz1),
                    (STAGE_X[0] + 4, 0, dz1)])

    def dancefn(xx, yy):
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        X = p.cx + (xx - p.cx) / s
        Z = p.D * (1 - 1 / s)
        i = np.floor((X - STAGE_X[0]) / 10)
        j = np.floor((Z - dz0) / 7.5)
        return np.where((i + j) % 2 == 0, .46, .16)
    c.poly(dance, 'tile', dancefn, dith=.3)

    # ============================================================== entrance door ====
    dx0, dx1 = 20, 46
    dy0, dy1 = FLOOR - 44, FLOOR
    g['door'] = (dx0, dy0, dx1, dy1)
    c.rect(dx0 - 4, dy0 - 5, dx1 + 4, dy1, 'wood', .3)
    c.hline(dx0 - 4, dx1 + 4, dy0 - 5, 'brass', .6)
    # padded leather door, brass studs in a diamond grid, small round window
    c.rect(dx0, dy0, dx1, dy1, 'red', hgrad(dx0, dx1, .42, .3))
    for yy in range(dy0 + 3, dy1 - 2, 6):
        for xx in range(dx0 + 3 + ((yy - dy0) // 6) % 2 * 3, dx1 - 2, 6):
            c.put(xx, yy, 'brass', .8)
            c.put(xx + 1, yy + 1, 'red', .2)
    wcx, wcy = (dx0 + dx1) // 2, dy0 + 12
    c.ellipse(wcx, wcy, 6, 6, 'brass', .7)
    c.ellipse(wcx, wcy, 5, 5, 'night', .35, emis=.7)
    c.put(wcx - 2, wcy - 2, 'neonred', .7, emis=1)       # street neon through the porthole
    c.put(wcx + 1, wcy + 1, 'b_sodium', .7, emis=1)
    c.vline(dx1 - 4, dy0 + 22, dy0 + 28, 'brass', .85)  # push bar
    c.put(dx1 - 4, dy0 + 21, 'brass', 1)
    c.rect(dx0, dy1 - 2, dx1, dy1, 'brass', .45)        # kick plate
    # EXIT sign above the door
    c.rect(dx0 + 3, dy0 - 13, dx1 - 3, dy0 - 7, 'red', .3)
    B.text(c, (dx0 + dx1) // 2, dy0 - 12, 'EXIT', 'neonred', .85, emis=1, center=True)
    # brass coat hooks + umbrella stand by the door
    for hx_ in (50, 54):
        c.put(hx_, 50, 'brass', .8)
        c.put(hx_, 51, 'brass', .5)
    B.cylinder(c, 52, FLOOR - 12, FLOOR, 3.5, 1.2, 'brass', .5)
    c.line(50, FLOOR - 12, 48, FLOOR - 24, 'black', .4)       # umbrella handle
    c.put(48, FLOOR - 25, 'black', .5)
    c.line(54, FLOOR - 12, 55, FLOOR - 20, 'red', .3)

    # ===================================================== front window + neon sign ====
    wx0, wy0, wx1, wy1 = 60, 18, 104, 62
    g['window'] = (wx0, wy0, wx1, wy1)
    # rainy street outside: wet dark, a lamp, the far side of Harbor Street
    c.rect(wx0, wy0, wx1, wy1, 'night', vgrad(wy0, wy1, .26, .14), emis=.7)
    # far side of the street: dark shopfronts, a lit window, wet pavement sheen
    c.rect(wx0, wy0 + 26, wx1, wy1, 'night', vgrad(wy0 + 26, wy1, .2, .32), emis=.7)
    c.rect(wx0 + 4, wy0 + 27, wx0 + 14, wy0 + 33, 'lamp', .5, emis=.85)
    c.rect(wx0 + 30, wy0 + 26, wx0 + 38, wy0 + 32, 'lamp', .38, emis=.8)
    c.hline(wx0, wx1, wy0 + 36, 'b_sodium', .45, emis=.8)
    c.vline(98, wy0 + 6, wy1, 'black', .3)
    c.ellipse(98, wy0 + 6, 2, 1.5, 'b_sodium', .85, emis=1)
    rng = np.random.default_rng(5)
    for _ in range(40):
        x = int(rng.integers(wx0, wx1))
        y = int(rng.integers(wy0, wy1))
        c.put(x, y, 'glass', .7, emis=.5)
        if rng.random() < .5:
            c.put(x, y + 1, 'glass', .6, emis=.5)
    # neon sign hanging in the window, seen from behind: reversed letters
    c.vline(70, wy0, wy0 + 6, 'chrome', .4)
    c.vline(94, wy0, wy0 + 6, 'chrome', .4)
    B.text(c, 66, wy0 + 7, 'BLUE', 'b_lanternglass', .95, emis=1, mirror=True, scale=2, spacing=1)
    B.text(c, 66, wy0 + 19, 'LANTERN', 'b_lanternglass', .9, emis=1, mirror=True, scale=1, spacing=1)
    # red neon lantern icon
    lix, liy = 101 - 5, wy0 + 31
    for (a, b) in ((0, 0), (1, 0), (2, 0), (-1, 1), (3, 1), (-1, 2), (3, 2), (-1, 3), (3, 3), (0, 4), (1, 4), (2, 4),
                   (1, -1)):
        c.put(lix + a, liy + b, 'neonred', .9, emis=1)
    c.put(lix + 1, liy + 2, 'b_sodium', .95, emis=1)
    # tube back-mounts (dark) and wiring
    c.hline(64, 98, wy0 + 17, 'black', .3)
    # frame + mullion + sill
    c.rect(wx0 - 3, wy0 - 3, wx1 + 3, wy0, 'wood', .4)
    c.rect(wx0 - 3, wy1, wx1 + 3, wy1 + 3, 'wood', .48)
    c.hline(wx0 - 3, wx1 + 3, wy1, 'wood', .66)
    c.rect(wx0 - 3, wy0, wx0, wy1, 'wood', .36)
    c.rect(wx1, wy0, wx1 + 3, wy1, 'wood', .3)
    c.rect(wx0 + 21, wy0, wx0 + 23, wy1, 'wood', .38)
    # half café curtain on a brass rod
    c.hline(wx0 - 2, wx1 + 2, wy0 + 30, 'brass', .7)
    for x in range(wx0, wx1):
        f = math.sin((x - wx0) * .9)
        c.vline(x, wy0 + 31, wy1, 'b_velvet', .3 + f * .1)
        if (x - wx0) % 3 == 0:
            c.put(x, wy1 - 1, 'gold', .5)
    # small table under the window? no: radiator-like ledge with a plant
    c.rect(wx0 + 2, wy1 + 3, wx0 + 8, wy1 + 9, 'brick', .4)
    c.poly([(wx0 + 1, wy1 + 3), (wx0 + 5, wy1 - 6), (wx0 + 9, wy1 + 3)], 'felt', .45)

    # =============================================================== coat check ====
    cx0, cx1 = 106, 130
    cy0 = 36
    g['coat'] = (cx0, cy0, cx1, FLOOR)
    # recess (dark interior) with coats on a rail
    c.rect(cx0 - 3, cy0 - 3, cx1 + 3, FLOOR, 'wood', .32)
    c.hline(cx0 - 3, cx1 + 3, cy0 - 3, 'brass', .55)
    c.rect(cx0, cy0, cx1, FLOOR, 'b_club', vgrad(cy0, FLOOR, .16, .1))
    c.hline(cx0 + 1, cx1 - 1, cy0 + 9, 'brass', .5)
    rng = np.random.default_rng(12)
    cols = ['trench', 'slate', 'b_club', 'mauve', 'trench', 'denim', 'slate']
    for k, x in enumerate(range(cx0 + 3, cx1 - 2, 4)):
        col = cols[k % len(cols)]
        L = .3 + rng.random() * .15
        c.put(x + 1, cy0 + 8, 'chrome', .6)
        c.poly([(x - 1, cy0 + 10), (x + 3, cy0 + 10), (x + 4, cy0 + 30), (x - 2, cy0 + 30)], col, L)
        c.vline(x + 1, cy0 + 11, cy0 + 29, col, L - .12)
    # hat shelf with fedoras
    c.hline(cx0 + 1, cx1 - 1, cy0 + 4, 'wood', .45)
    for x in (cx0 + 5, cx0 + 14, cx0 + 23):
        c.ellipse(x, cy0 + 3, 4, 1.2, 'slate', .32)
        c.rect(x - 2, cy0, x + 3, cy0 + 3, 'slate', .38)
        c.hline(x - 2, x + 3, cy0 + 2, 'black', .4)
    # dutch half-door counter
    hy = FLOOR - 22
    c.rect(cx0, hy, cx1, FLOOR, 'wood', hgrad(cx0, cx1, .46, .36))
    c.rect(cx0 + 3, hy + 5, cx1 - 3, FLOOR - 3, 'wood', .38)
    c.hline(cx0 + 3, cx1 - 3, hy + 5, 'wood', .26)
    c.rect(cx0 - 2, hy - 2, cx1 + 2, hy + 1, 'wood', .56)
    c.hline(cx0 - 2, cx1 + 2, hy - 2, 'wood', .74)
    # bell, tip saucer, claim tickets
    c.ellipse(cx0 + 8, hy - 3, 2.5, 1.6, 'brass', .78)
    c.put(cx0 + 8, hy - 5, 'brass', .95)
    c.ellipse(cx1 - 8, hy - 2, 3, 1, 'white', .7)
    c.put(cx1 - 9, hy - 3, 'gold', .9)
    c.rect(cx0 + 14, hy - 4, cx0 + 17, hy - 2, 'neonred', .5)
    # sign above: CHECK ROOM
    c.rect(cx0 - 1, cy0 - 12, cx1 + 1, cy0 - 5, 'b_club', .16)
    c.rect(cx0, cy0 - 11, cx1, cy0 - 6, 'gold', .3)
    B.text(c, (cx0 + cx1) // 2, cy0 - 11, 'CHECK', 'gold', .85, center=True)
    # little lamp inside the nook
    c.put(cx1 - 4, cy0 + 1, 'b_sodium', .9, emis=1)

    # =================================================================== poster ====
    px0, py0, px1, py1 = 137, 20, 161, 61
    g['poster'] = (px0, py0, px1, py1)
    c.rect(px0 - 1, py0 - 1, px1 + 1, py1 + 1, 'gold', .45)
    c.rect(px0, py0, px1, py1, 'cream', vgrad(py0, py1, .78, .6), dith=.2)
    c.rect(px0 + 1, py0 + 1, px1 - 1, py0 + 14, 'b_velvet', .45)
    # illustration: a pianist silhouette at a keyboard under a blue lantern
    c.ellipse(px0 + 17, py0 + 5, 2.5, 2.5, 'b_lanternglass', .9, emis=.4)
    c.vline(px0 + 17, py0 + 1, py0 + 3, 'ink', .4)
    c.ellipse(px0 + 7, py0 + 6, 2, 2.4, 'black', .1)
    c.rect(px0 + 5, py0 + 8, px0 + 10, py0 + 14, 'black', .1)
    c.rect(px0 + 10, py0 + 10, px1 - 2, py0 + 12, 'white', .85)
    for x in range(px0 + 11, px1 - 2, 2):
        c.put(x, py0 + 10, 'black', .1)
    B.text(c, (px0 + px1) // 2, py0 + 16, 'DEACON', 'red', .42, center=True)
    B.text(c, (px0 + px1) // 2, py0 + 22, 'BOONE', 'red', .42, center=True)
    B.text(c, (px0 + px1) // 2, py0 + 28, 'TRIO', 'ink', .25, center=True, narrow_i=True)
    c.rect(px0, py1 - 7, px1, py1, 'red', .45)
    B.text(c, (px0 + px1) // 2, py1 - 6, 'NIGHTLY', 'cream', .88, center=True, narrow_i=True)
    c.put(px1 - 1, py0, 'cream', .3)        # peeling corner
    c.put(px1 - 2, py0, 'cream', .4)
    c.put(px0, py0, 'steel', .7)            # tacks
    c.put(px1 - 1, py1 - 1, 'steel', .6)

    # ==================================================================== stage ====
    sx0, sx1 = STAGE_X
    # velvet backdrop on the back wall
    bdx0, bdx1 = sx0 - 2, sx1 + 2
    c.rect(bdx0, 4, bdx1, FLOOR, 'b_velvet', velvet_fn(bdx0, bdx1, .38, folds=13))
    # swagged valance with gold fringe
    for k in range(6):
        a = bdx0 + k * (bdx1 - bdx0) / 6
        b = bdx0 + (k + 1) * (bdx1 - bdx0) / 6
        pts = [(a, 4)]
        for t in np.linspace(0, 1, 9):
            pts.append((a + (b - a) * t, 12 + 6 * math.sin(t * math.pi)))
        pts.append((b, 4))
        c.poly(pts, 'b_velvet', vgrad(4, 18, .55, .35))
        for t in np.linspace(0, 1, 12):
            xx = a + (b - a) * t
            yy = 12 + 6 * math.sin(t * math.pi)
            c.vline(int(xx), int(yy), int(yy) + 2, 'gold', .65)
    c.rect(bdx0 - 1, 2, bdx1 + 1, 5, 'gold', .5)
    c.hline(bdx0 - 1, bdx1 + 1, 2, 'gold', .8)
    # side drapes gathered with gold tie-backs
    for (a, b, side) in ((bdx0 - 6, bdx0 + 8, 'l'), (bdx1 - 8, bdx1 + 6, 'r')):
        c.rect(a, 2, b, FLOOR, 'b_velvet', velvet_fn(a, b, .5, folds=2))
        ty = 52
        c.rect(a, ty, b, ty + 2, 'gold', .7)
    # emblem on the backdrop: round sign with a lantern
    ex, ey = 220, 32
    c.ellipse(ex, ey, 11, 11, 'gold', .5)
    c.ellipse(ex, ey, 10, 10, 'b_velvet', .2)
    c.ellipse(ex, ey + 1, 4, 5, 'b_lanternglass', .7, emis=.6)
    c.rect(ex - 2, ey - 6, ex + 3, ey - 4, 'gold', .7)
    c.rect(ex - 2, ey + 6, ex + 3, ey + 7, 'gold', .7)
    c.vline(ex, ey - 9, ey - 6, 'gold', .6)
    for k in range(-1, 2):
        c.hline(ex - 3, ex + 4, ey + 1 + k * 2, 'b_lanternglass', .5, emis=.5)
    # stage platform: top + front riser with footlights
    stop = p.quad([(sx0, STAGE_Y, 0), (sx1, STAGE_Y, 0), (sx1, STAGE_Y, STAGE_Z), (sx0, STAGE_Y, STAGE_Z)])
    def stagefn(xx, yy):
        s = np.maximum((yy - p.hy) / (p.E - STAGE_Y), 1e-3)
        X = p.cx + (xx - p.cx) / s
        k = np.floor((X - sx0) / 9)
        frac = (X - sx0) / 9 - k
        L = .5 + (B.H(k, 9) - .5) * .08
        return np.where(frac < .1, .3, L)
    c.poly(stop, 'oak', stagefn)
    fx0, fy0, fx1, fy1 = p.front_rect(sx0, sx1, 0, STAGE_Y, STAGE_Z)
    c.rect(fx0, fy0, fx1, fy1, 'wood', .3)
    c.hline(int(fx0), int(fx1), int(fy0), 'oak', .75)
    for x in range(int(fx0) + 4, int(fx1) - 2, 8):
        c.rect(x, int(fy0) + 2, x + 2, int(fy0) + 4, 'b_sodium', .85, emis=1)
    g['stage_front'] = (fx0, fy0, fx1, fy1)
    # side steps (left end)
    p.box(c, sx0 - 10, sx0, 0, 3, 14, 30, 'oak', front=.4, top=.55, side=.3)

    # --- drum kit (stage right, at the back) --------------------------------------
    dkx, dky = p.P(259, STAGE_Y, 9)
    dkx, dky = int(dkx), int(dky)
    c.ellipse(dkx, dky - 7, 7, 7, 'white', .55)                # bass drum front head
    c.ellipse(dkx, dky - 7, 6, 6, 'white', .72)
    B.text(c, dkx - 3, dky - 9, 'DB', 'red', .45)
    c.rect(dkx - 13, dky - 12, dkx - 7, dky - 9, 'chrome', .55)  # snare
    c.vline(dkx - 10, dky - 9, dky, 'chrome', .5)
    c.vline(dkx + 9, dky - 26, dky, 'chrome', .5)               # cymbal stand
    c.ellipse(dkx + 9, dky - 26, 6, 1.2, 'brass', .7)
    c.put(dkx + 7, dky - 27, 'brass', .95)
    c.vline(dkx - 15, dky - 18, dky, 'chrome', .45)             # hi-hat
    c.ellipse(dkx - 15, dky - 18, 4, 1, 'brass', .65)
    # --- double bass leaning against the backdrop ---------------------------------
    bx_, by_ = p.P(232, STAGE_Y, 6)
    double_bass(c, int(bx_), int(by_), h=44, lean=-.12)
    # --- piano ------------------------------------------------------------------
    pg = piano(c, p, 188, 15, -52)
    g['piano_geo'] = pg
    vx, vz = pg['v']
    ux, uz = pg['u']
    # bench in front of the keys
    bcx, bcz = 188 + vx * 15 + ux * 4, 15 + vz * 15 + uz * 4
    B.rbox(c, p, bcx, bcz, 16, 7, STAGE_Y + 9, STAGE_Y + 12, -52, 'wood', lum_front=.36, lum_side=.28,
           lum_top=.52)
    for su in (-1, 1):
        for sv in (-1, 1):
            X = bcx + ux * su * 6 + vx * sv * 2.5
            Z = bcz + uz * su * 6 + vz * sv * 2.5
            a_, b_ = p.P(X, STAGE_Y, Z), p.P(X, STAGE_Y + 9, Z)
            c.line(a_[0], a_[1], b_[0], b_[1], 'wood', .3)
    g['bench'] = (bcx, bcz)
    # things on the piano top: a glass of rye, an ashtray, a candle
    if pg['top']:
        tpts = pg['top'][0]
        mx = sum(q[0] for q in tpts) / 4
        my = sum(q[1] for q in tpts) / 4
        c.rect(int(mx) + 3, int(my) - 4, int(mx) + 6, int(my), 'b_bottle_a', .55, emis=.2)
        c.hline(int(mx) + 3, int(mx) + 6, int(my) - 4, 'white', .8)
        c.ellipse(int(mx) - 5, int(my), 2.5, 1, 'glass', .5)
        c.put(int(mx) - 5, int(my) - 1, 'b_ember', .9, emis=1)
        g['piano_top'] = (mx, my)
    # --- mic stand ---------------------------------------------------------------
    mx_, my_ = p.P(250, STAGE_Y, 26)
    mx_, my_ = int(mx_), int(my_)
    c.ellipse(mx_, my_, 4, 1.2, 'chrome', .4)
    c.vline(mx_, my_ - 40, my_, 'chrome', .72)
    c.vline(mx_ + 1, my_ - 40, my_, 'chrome', .4)
    c.rect(mx_ - 2, my_ - 47, mx_ + 3, my_ - 40, 'chrome', vgrad(my_ - 47, my_ - 40, .85, .45))
    for y in range(my_ - 46, my_ - 41, 2):
        c.hline(mx_ - 1, mx_ + 2, y, 'chrome', .3)
    c.line(mx_ + 1, my_ - 38, mx_ + 6, my_ - 20, 'black', .3)    # cable
    c.line(mx_ + 6, my_ - 20, mx_ + 4, my_, 'black', .3)
    g['mic'] = (mx_, my_)

    # ====================================================================== bar ====
    bx0, bx1 = BAR_X
    bz0, bz1 = BAR_Z
    # back-bar: mirror, shelves of backlit bottles, cash register
    mbx0, mbx1 = bx0 + 2, bx1 - 2
    c.rect(mbx0 - 3, 14, mbx1 + 3, FLOOR, 'wood', .3)
    c.rect(mbx0 - 3, 12, mbx1 + 3, 16, 'wood', .48)
    c.hline(mbx0 - 3, mbx1 + 3, 12, 'brass', .6)
    c.rect(mbx0, 18, mbx1, 62, 'glass', vgrad(18, 62, .5, .3), emis=.35)
    # mirror reflections: diagonal sheen + faint blue lanterns reflected
    for k in range(3):
        c.line(mbx0 + 10 + k * 25, 60, mbx0 + 22 + k * 25, 20, 'glass', .62, emis=.4)
    shelves = (30, 44, 58)
    rng = np.random.default_rng(44)
    bottles_r = ['b_bottle_a', 'b_bottle_g', 'b_bottle_a', 'red', 'b_bottle_g', 'paper', 'b_bottle_a', 'glass']
    for si, sy in enumerate(shelves):
        c.rect(mbx0 - 1, sy, mbx1 + 1, sy + 2, 'glass', .75, emis=.5)
        c.hline(mbx0 - 1, mbx1 + 1, sy + 2, 'b_sodium', .7, emis=1)      # hidden strip light
        x = mbx0 + 2
        while x < mbx1 - 3:
            r_ = bottles_r[int(rng.integers(0, len(bottles_r)))]
            h_ = int(rng.integers(8, 12))
            w_ = 3 if rng.random() < .75 else 4
            L = .5 + rng.random() * .25
            B.bottle(c, x + 1, sy, h_, r_, L, emis=.75, w=w_, label='paper' if rng.random() < .5 else None,
                     label_lum=.7)
            x += w_ + 1 + int(rng.integers(0, 2))
    # COCKTAILS neon above the mirror
    B.text(c, (mbx0 + mbx1) // 2, 6, 'COCKTAILS', 'neonred', .9, emis=1, center=True)
    # back counter + cash register
    c.rect(mbx0 - 3, 62, mbx1 + 3, 66, 'wood', .5)
    c.hline(mbx0 - 3, mbx1 + 3, 62, 'wood', .7)
    rx_, ry_ = mbx1 - 12, 62
    c.rect(rx_ - 6, ry_ - 9, rx_ + 6, ry_, 'brass', vgrad(ry_ - 9, ry_, .7, .4))
    c.rect(rx_ - 4, ry_ - 12, rx_ + 4, ry_ - 9, 'brass', .55)
    c.rect(rx_ - 3, ry_ - 12, rx_ + 3, ry_ - 10, 'paper', .85, emis=.3)
    for k in range(3):
        c.hline(rx_ - 5, rx_ + 5, ry_ - 7 + k * 2, 'brass', .35)
    # glasses upside down on the back counter
    for x in range(mbx0 + 2, mbx0 + 30, 4):
        c.rect(x, 58, x + 2, 62, 'glass', .62, emis=.3)
        c.put(x, 58, 'white', .85)
    # PRIVATE door at the far right of the back wall (to the cellar)
    pdx0, pdx1 = 355, 384
    pdy0 = FLOOR - 44
    g['private'] = (pdx0, pdy0, pdx1, FLOOR)
    c.rect(pdx0 - 3, pdy0 - 3, pdx1 + 3, FLOOR, 'wood', .26)
    c.rect(pdx0, pdy0, pdx1, FLOOR, 'wood', hgrad(pdx0, pdx1, .4, .3))
    for (a, b, cc_, d) in ((pdx0 + 3, pdy0 + 3, pdx1 - 3, pdy0 + 18), (pdx0 + 3, pdy0 + 22, pdx1 - 3, FLOOR - 4)):
        c.rect(a, b, cc_, d, 'wood', .33)
        c.hline(a, cc_, b, 'wood', .2)
        c.hline(a, cc_, d - 1, 'wood', .48)
    c.rect(pdx0 + 1, pdy0 + 7, pdx1 - 1, pdy0 + 13, 'paper', .72, dith=.1)
    B.text(c, (pdx0 + pdx1) // 2, pdy0 + 8, 'PRIVATE', 'red', .3, center=True, narrow_i=True)
    c.put(pdx0 + 3, pdy0 + 24, 'brass', .9)
    c.rect(pdx0 + 2, pdy0 + 24, pdx0 + 4, pdy0 + 28, 'brass', .55)
    c.hline(pdx0, pdx1, FLOOR - 1, 'b_sodium', .5, emis=1)      # light under the door
    # red caged bulb over the door
    c.ellipse((pdx0 + pdx1) / 2, pdy0 - 7, 2, 2, 'neonred', .7, emis=1)
    c.hline(pdx0 + 8, pdx1 - 8, pdy0 - 5, 'steel', .5)
    # crates of empties stacked by the private door

    # bar counter (static occluder: Sal stands behind it)
    bar_base = int(p.P(0, 0, bz1)[1])
    g['bar_base'] = bar_base
    with sc.obj('bar_counter', baseline=bar_base):
        def barfront(xx, yy):
            k = np.floor((xx - 270) / 8)
            fx = (xx - 270) - k * 8
            L = .42 + np.where(fx < 1, -.14, 0) + np.where(fx > 6.5, .07, 0)
            return L
        p.box(c, bx0, bx1, 0, BAR_H, bz0, bz1, 'wood', front=.42, top=.6, side=.3, lum_fn=barfront)
        # thick rounded bar top (overhangs), polished
        p.box(c, bx0 - 2, bx1 + 2, BAR_H, BAR_H + 3, bz0 - 1, bz1 + 2, 'oak', front=.5, top=.62, side=.4)
        tx0_, ty0_, tx1_, ty1_ = p.front_rect(bx0 - 2, bx1 + 2, BAR_H, BAR_H + 3, bz1 + 2)
        c.hline(int(tx0_), int(tx1_), int(ty0_), 'oak', .9)
        c.hline(int(tx0_), int(tx1_), int(ty1_) - 1, 'oak', .3)
        # brass foot rail
        r0 = p.P(bx0, 4, bz1 + 3)
        r1 = p.P(bx1, 4, bz1 + 3)
        c.rect(int(r0[0]), int(r0[1]), int(r1[0]), int(r0[1]) + 2, 'brass', .62)
        c.hline(int(r0[0]), int(r1[0]), int(r0[1]), 'brass', .95)
        for X in range(bx0 + 6, bx1, 18):
            a_ = p.P(X, 4, bz1 + 3)
            b_ = p.P(X, 0, bz1 + 1)
            c.line(a_[0], a_[1], b_[0], b_[1], 'brass', .5)
        # things on the bar top
        def top_pt(X, Zf):
            return p.P(X, BAR_H + 3, bz0 + (bz1 - bz0) * Zf)
        tx, ty = top_pt(bx0 + 30, .45)
        c.vline(int(tx), int(ty) - 9, int(ty), 'chrome', .8)          # beer tap
        c.rect(int(tx) - 1, int(ty) - 13, int(tx) + 2, int(ty) - 9, 'red', .55)
        c.put(int(tx) + 1, int(ty) - 9, 'chrome', .5)
        tx, ty = top_pt(bx0 + 10, .5)
        c.rect(int(tx) - 1, int(ty) - 4, int(tx) + 2, int(ty), 'glass', .6, emis=.3)   # tumbler
        c.rect(int(tx) - 1, int(ty) - 2, int(tx) + 2, int(ty), 'b_bottle_a', .6, emis=.4)
        tx, ty = top_pt(bx0 + 52, .5)
        c.ellipse(int(tx), int(ty), 3, 1, 'glass', .45)                # ashtray
        c.put(int(tx) + 1, int(ty) - 1, 'paper', .85)
        c.put(int(tx) + 2, int(ty) - 1, 'b_ember', .9, emis=1)
        g['ashtray'] = (int(tx) + 2, int(ty) - 1)
        tx, ty = top_pt(bx0 + 66, .4)
        c.rect(int(tx) - 1, int(ty) - 7, int(tx) + 2, int(ty), 'chrome', vgrad(ty - 7, ty, .9, .5))  # shaker
        c.put(int(tx), int(ty) - 8, 'chrome', .7)
        tx, ty = top_pt(bx0 + 42, .55)
        c.ellipse(int(tx), int(ty) - 1, 3, 1.4, 'white', .7)            # peanut bowl
        c.hline(int(tx) - 2, int(tx) + 2, int(ty) - 2, 'oak', .7)
        # bar rag
        tx, ty = top_pt(bx0 + 22, .7)
        c.rect(int(tx) - 2, int(ty) - 1, int(tx) + 3, int(ty) + 1, 'white', .6)
    # stools in front of the bar
    with sc.obj('stools', baseline=int(p.P(0, 0, bz1 + 9)[1])):
        for X in (bx0 + 12, bx0 + 34, bx0 + 56):
            fx_, fy_ = p.P(X, 0, bz1 + 9)
            _, ty_ = p.P(X, 17, bz1 + 9)
            stool(c, int(fx_), int(fy_), int(ty_))

    # ====================================================================== palm ====
    plx, ply = p.P(272, 0, 44)
    plx, ply = int(plx), int(ply)
    g['palm'] = (plx, ply)
    # brass-banded pot
    c.poly([(plx - 7, ply - 13), (plx + 7, ply - 13), (plx + 5, ply), (plx - 5, ply)], 'brass',
           hgrad(plx - 7, plx + 7, .62, .32))
    c.rect(plx - 8, ply - 15, plx + 8, ply - 12, 'brass', .7)
    c.hline(plx - 8, plx + 8, ply - 15, 'brass', .95)
    c.ellipse(plx, ply - 14, 6, 1.4, 'wood', .2)
    g['palm_leaves'] = draw_palm(c, plx, ply - 15, wilted=('palm_wilted' in st))

    # ================================================================== tables ====
    g['tables'] = {}
    return g, p


def seated(c, x, floor_y, s, facing=1, kind='man', back=False, smoke=False, lean=0.0, table_y=None,
           ramp='b_club', lum=.16, rim='b_smoke', rim_lum=.58, rim_dir=None):
    """Seated silhouette.  x = hip position, floor_y = feet line, s = scale (1.0 ~ person at the front).
    facing +1 right / -1 left; back=True: seen from behind (facing away)."""
    f = facing
    seat = floor_y - 13 * s
    sh_y = seat - 17 * s
    hx = x + f * (2 + lean) * s if not back else x
    hy = sh_y - 5 * s
    shapes = []
    if not back:
        # thighs forward, shins down
        shapes += [('poly', [(x - 3 * s, seat - 3 * s), (x + f * 10 * s, seat - 3 * s), (x + f * 10 * s, seat + 1 * s),
                             (x - 3 * s, seat + 1 * s)]),
                   ('poly', [(x + f * 7 * s, seat - 2 * s), (x + f * 10.5 * s, seat - 2 * s),
                             (x + f * 10.5 * s, floor_y), (x + f * 7.5 * s, floor_y)]),
                   ('poly', [(x + f * 7 * s, floor_y - 1.5 * s), (x + f * 13 * s, floor_y - 1.5 * s),
                             (x + f * 13 * s, floor_y), (x + f * 7 * s, floor_y)])]
    # torso (slightly leaning forward)
    tw = 9 * s
    lx = f * lean * s
    shapes += [('poly', [(x - tw / 2, seat + 1 * s), (x + tw / 2, seat + 1 * s), (x + tw / 2 + lx, sh_y + 2 * s),
                         (x + tw / 2 - 1 * s + lx, sh_y), (x - tw / 2 + 1 * s + lx, sh_y),
                         (x - tw / 2 + lx, sh_y + 2 * s)]),
               ('rect', hx - 1.2 * s, hy + 2 * s, hx + 1.5 * s, sh_y + 1),
               ('ellipse', hx, hy, 2.8 * s, 3.3 * s)]
    if kind == 'man':
        shapes += [('rect', hx - 4.5 * s, hy - 2.6 * s, hx + 4.5 * s + 1, hy - 1.5 * s),
                   ('rect', hx - 2.8 * s, hy - 5.6 * s, hx + 2.8 * s + 1, hy - 2.2 * s)]
    else:
        shapes += [('ellipse', hx - f * 1.2 * s, hy - .6 * s, 3.6 * s, 3.4 * s),
                   ('ellipse', hx - f * 2.6 * s, hy + 2.2 * s, 2.2 * s, 2.8 * s)]
    if table_y is not None and not back:
        # forearm resting on the table
        shapes += [('poly', [(x + f * 1 * s + lx, sh_y + 2 * s), (x + f * 4 * s + lx, sh_y + 1 * s),
                             (x + f * 9 * s, table_y - 1), (x + f * 7 * s, table_y + 1)]),
                   ('poly', [(x + f * 6 * s, table_y - 1.5 * s), (x + f * 12 * s, table_y - 1.5 * s),
                             (x + f * 12 * s, table_y), (x + f * 6 * s, table_y)])]
    m = B.mask_of(c, shapes)
    B.apply_mask(c, m, ramp, lum, dith=.15)
    d = f if rim_dir is None else rim_dir
    edge = m & ~np.roll(m, -d, axis=1)
    B.apply_mask(c, edge, rim, rim_lum, dith=0)
    top = m & ~np.roll(m, 1, axis=0)
    B.apply_mask(c, top & ~edge, rim, rim_lum - .18, dith=0)
    if kind == 'man':
        c.hline(int(hx - 2.8 * s), int(hx + 2.8 * s + 1), int(hy - 2.6 * s), 'neonblue', .3)
    else:
        c.put(int(hx + f * 2.2 * s), int(hy + 3 * s), 'cream', .7)          # earring
        c.put(int(hx + f * 1.4 * s), int(hy + 1 * s), 'red', .5)             # lipstick
    tip = None
    if smoke:
        if table_y is not None and not back:
            tip = (int(x + f * 12 * s) + f, int(table_y - 2 * s))
        else:
            tip = (int(hx + f * 4 * s), int(hy + 2 * s))
        c.put(tip[0], tip[1], 'b_ember', .95, emis=1)
        c.put(tip[0] - f, tip[1], 'paper', .8)
    return m, tip


def chair_back(c, x, floor_y, s, side=-1, lum=.32):
    """Bentwood chair seen side-on: the back rises on `side` of the sitter."""
    seat = floor_y - 13 * s
    bx = x + side * 4 * s
    c.line(bx, floor_y, bx, seat - 15 * s, 'wood', lum)
    c.line(bx + side * 1, floor_y, bx + side * 1, seat - 14 * s, 'wood', lum - .1)
    c.line(bx, seat - 15 * s, bx - side * 3 * s, seat - 16 * s, 'wood', lum + .12)
    c.line(x - side * 6 * s, floor_y, x - side * 6 * s, seat, 'wood', lum - .05)
    c.hline(int(x - 6 * s), int(x + 6 * s), int(seat), 'wood', lum + .1)


def table_group(sc, c, p, name, X, Z, r, people=(), candle=True, extras=None):
    """Table + chairs + seated patrons as one static occluder.  people: list of dicts."""
    s = p.s(Z)
    _, fy = p.P(X, 0, Z)
    ks = (fy + 70) / 210.0             # character scale at this depth
    base = int(fy + 3 * s)
    info = None
    tips = []
    with sc.obj(name, baseline=base):
        # sitters behind or beside the table first
        for pp in people:
            if pp.get('front'):
                continue
            px_ = p.P(X + pp['dx'], 0, Z + pp.get('dz', 0))[0]
            pfy = p.P(X + pp['dx'], 0, Z + pp.get('dz', 0))[1]
            chair_back(c, px_, pfy, ks, side=-pp['facing'])
            _, ty_ = p.P(X, 20, Z)
            m, tip = seated(c, px_, pfy, ks, facing=pp['facing'], kind=pp.get('kind', 'man'), smoke=pp.get('smoke'),
                            lean=pp.get('lean', 1.0), table_y=ty_, rim_dir=pp.get('rim'))
            if tip:
                tips.append(tip)
        info = round_table(c, p, X, Z, r=r, candle=candle)
        if extras:
            extras(c, info)
        for pp in people:
            if not pp.get('front'):
                continue
            px_, pfy = p.P(X + pp['dx'], 0, Z + pp.get('dz', 0))
            m, tip = seated(c, px_, pfy, ks * 1.0, facing=pp['facing'], kind=pp.get('kind', 'man'), back=True,
                            smoke=pp.get('smoke'), rim_dir=pp.get('rim', 1))
            # chair back in front of the sitter
            seat = pfy - 13 * ks
            c.rect(int(px_ - 5 * ks), int(seat - 9 * ks), int(px_ + 5 * ks) + 1, int(seat - 8 * ks), 'wood', .4)
            c.line(px_ - 5 * ks, seat - 8 * ks, px_ - 5 * ks, pfy, 'wood', .34)
            c.line(px_ + 5 * ks, seat - 8 * ks, px_ + 5 * ks, pfy, 'wood', .3)
            c.hline(int(px_ - 5 * ks), int(px_ + 5 * ks) + 1, int(seat), 'wood', .38)
            if tip:
                tips.append(tip)
    info['base'] = base
    info['tips'] = tips
    info['fy'] = fy
    return info


def draw_lantern_world(c, p, X, Y, Z, r=6):
    x, y = p.P(X, Y, Z)
    s = p.s(Z)
    B.paper_lantern(c, int(x), int(y), r=max(3, r * s), string_top=0, lum=.72, emis=.9)
    fx, fy = p.P(X, 0, Z)
    FLOOR_POOLS.append((int(fx), int(fy), s))
    return (int(x), int(y), r * s)


FLOOR_POOLS = []


def garland(c, x0, y0, x1, y1, sag, n, r=2.5):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t)
        pts.append((x, y))
    for i in range(1, len(pts)):
        c.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 'ink', .4)
    out = []
    for i in range(1, n):
        x, y = pts[i]
        cols = ['b_lanternglass', 'b_lanternglass', 'neonred', 'b_lanternglass', 'b_sodium']
        col = cols[i % len(cols)]
        lum = .62 if col != 'b_sodium' else .55
        c.ellipse(x, y + r + 1, r, r * .9, col, radial(x - 1, y + r, r * 1.5, lum + .25, lum - .15), emis=.9, dith=.3)
        c.hline(int(x - r + 1), int(x + r), int(y + r + 1), col, lum - .2, emis=.7)
        out.append((int(x), int(y + r + 1), col))
    return out


def draw_palm(c, x, y, wilted=False):
    """Kentia palm fronds from (x, y), back-lit by the bar.  Returns bbox."""
    rng = np.random.default_rng(9)
    fr = [(-150, 26), (-128, 31), (-104, 34), (-82, 31), (-60, 28), (-36, 25), (-170, 19), (-12, 20), (-116, 22),
          (-68, 22)]
    xs, ys = [x], [y]
    for fi, (ang, L) in enumerate(fr):
        if wilted:
            # collapsed: fronds flop outwards over the rim and hang, tips no lower than the pot base
            side = -1 if ang < -90 else 1
            ang = -90 + side * (35 + abs(ang + 90) * .7)
            L = L * .62
        a = math.radians(ang)
        pts = []
        for t in np.linspace(0, 1, 18):
            if wilted:
                droop = (t ** 1.6) * L * 1.7
            else:
                droop = (t ** 2) * (L * .45)
            yy_ = y + math.sin(a) * L * t + droop
            if wilted:
                yy_ = min(yy_, y + 13)
            pts.append((x + math.cos(a) * L * t, yy_))
        col = 'felt' if not wilted else ('olive' if fi % 3 else 'trench')
        base_l = .62 if not wilted else .46
        for i in range(1, len(pts)):
            c.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], col, base_l - .15)
        for i in range(2, len(pts) - 1):
            t = i / len(pts)
            ll = (1 - t) * 6 + 2
            px_, py_ = pts[i]
            for sgn in (-1, 1):
                dx = math.cos(a + sgn * 1.2) * ll * .6
                dy = math.sin(a + sgn * 1.2) * ll * .6 + ll * (.55 if not wilted else 1.1)
                if wilted:
                    dy = min(dy, y + 14 - py_)
                lum = base_l + .08 * sgn + rng.random() * .08
                if wilted and rng.random() < .4:
                    c.line(px_, py_, px_ + dx, py_ + dy, 'trench', .42)
                    c.put(px_ + dx, py_ + dy, 'trench', .25)
                else:
                    c.line(px_, py_, px_ + dx, py_ + dy, col, lum)
                    # back-light from the bar on the right-hand leaflet tips
                    if sgn > 0 and not wilted and fi % 2 == 0:
                        c.put(px_ + dx, py_ + dy, 'b_sodium', .55, emis=.4)
                xs.append(px_ + dx)
                ys.append(py_ + dy)
        xs += [q[0] for q in pts]
        ys += [q[1] for q in pts]
    if wilted:
        # dead leaves dropped around the pot
        for k in range(6):
            c.line(x - 10 + k * 4, y + 14 + (k % 2), x - 8 + k * 4, y + 15 + (k % 2), 'trench', .38)
    return (int(min(xs)), int(min(ys)), int(max(xs)) + 1, int(max(ys)) + 1)


def build():
    sc = Scene('lantern', W, H, seed=SEED)
    st = set()
    g, p = paint(sc, st)
    c = sc.c
    finish(sc, g, p, st)
    alt = Scene('lantern', W, H, seed=SEED)
    ga, pa = paint(alt, {'palm_wilted'})
    finish(alt, ga, pa, {'palm_wilted'})
    B.state_from(sc, 'palm_wilted', alt.c, depth=3)
    interaction(sc, g, p)
    return sc


def finish(sc, g, p, st):
    """Tables, patrons, lanterns, smoke and the lighting rig (shared by base and state renders)."""
    c = sc.c
    # --- tables with patrons (static occluders) ----------------------------------------
    def drink_extras(c_, info):
        x, y = int(info['cx']) + 4, int(info['cy'])
        c_.rect(x, y - 3, x + 2, y, 'glass', .6, emis=.2)
        c_.put(x, y - 3, 'white', .9)
        x2 = int(info['cx']) - 6
        c_.ellipse(x2, y - 1, 3.5, 1.2, 'slate', .3)          # a hat left on the table
        c_.rect(x2 - 2, y - 4, x2 + 3, y - 1, 'slate', .36)
        c_.hline(x2 - 2, x2 + 3, y - 2, 'black', .4)
        c_.rect(x - 1, y - 6, x + 1, y - 4, 'paper', .85)     # reserved card
    t1 = table_group(sc, c, p, 'table1', 86, 66, 9, people=[
        {'dx': -15, 'facing': 1, 'kind': 'man', 'lean': 1.5, 'rim': 1},
        {'dx': 15, 'facing': -1, 'kind': 'woman', 'smoke': True, 'lean': .5, 'rim': 1}])
    t2 = table_group(sc, c, p, 'table2', 160, 100, 9, people=[
        {'dx': 2, 'dz': 10, 'facing': 1, 'kind': 'man', 'front': True, 'smoke': True, 'rim': 1}])
    t3 = table_group(sc, c, p, 'table3', 236, 80, 8, people=[], extras=drink_extras)
    t4 = table_group(sc, c, p, 'table4', 328, 104, 9, people=[
        {'dx': 14, 'facing': -1, 'kind': 'man', 'lean': 2.0, 'rim': -1}])
    g['tables'] = {'table1': t1, 'table2': t2, 'table3': t3, 'table4': t4}
    # lone drinker hunched at the bar (on the left stool), back to us
    bx0 = BAR_X[0]
    sx_, sfy = p.P(bx0 + 12, 0, BAR_Z[1] + 9)
    ks = (sfy + 70) / 210.0
    with sc.obj('bar_patron', baseline=int(sfy) + 1):
        seat = sfy - 18 * ks
        sh_y = seat - 16 * ks
        shapes = [('poly', [(sx_ - 5 * ks, seat), (sx_ + 5 * ks, seat), (sx_ + 6 * ks, sh_y + 3 * ks),
                            (sx_ + 2 * ks, sh_y - 1 * ks), (sx_ - 4 * ks, sh_y), (sx_ - 6 * ks, sh_y + 4 * ks)]),
                  ('ellipse', sx_ + 1.5 * ks, sh_y - 2 * ks, 2.8 * ks, 3 * ks),
                  ('rect', sx_ - 3 * ks, sh_y - 5.5 * ks, sx_ + 6 * ks, sh_y - 4.4 * ks),
                  ('rect', sx_ - 1.2 * ks, sh_y - 8.2 * ks, sx_ + 4 * ks, sh_y - 4.8 * ks),
                  ('poly', [(sx_ - 4 * ks, seat), (sx_ + 4 * ks, seat), (sx_ + 3 * ks, sfy - 6 * ks),
                            (sx_ - 3 * ks, sfy - 6 * ks)])]
        m = B.mask_of(c, shapes)
        B.apply_mask(c, m, 'b_club', .15, dith=.15)
        e = m & ~np.roll(m, 1, axis=1)
        B.apply_mask(c, e, 'b_sodium', .5, dith=0)
        tp = m & ~np.roll(m, 1, axis=0)
        B.apply_mask(c, tp & ~e, 'b_smoke', .45, dith=0)
    g['bar_patron'] = (int(sx_), int(sh_y))

    # --- foreground: the back of an empty bentwood chair, cut by the frame ---------------
    with sc.obj('fg_chair', baseline=170):
        shapes = [('poly', [(0, 112), (5, 110), (10, 111), (13, 114), (12, 144), (8, 144), (9, 117), (5, 115), (2, 116),
                            (2, 144), (0, 144)]),
                  ('rect', 0, 128, 14, 131)]
        m = B.mask_of(c, shapes)
        B.apply_mask(c, m, 'wood', .14, dith=0)
        e = m & ~np.roll(m, -1, axis=1)
        B.apply_mask(c, e, 'b_smoke', .4, dith=0)
        top = m & ~np.roll(m, 1, axis=0)
        B.apply_mask(c, top, 'oak', .5, dith=0)

    # --- lanterns ---------------------------------------------------------------------
    lan = []
    FLOOR_POOLS.clear()
    lan.append(draw_lantern_world(c, p, 62, 82, 66, 6))
    lan.append(draw_lantern_world(c, p, 150, 96, 100, 5.5))
    lan.append(draw_lantern_world(c, p, 244, 80, 80, 5.5))
    lan.append(draw_lantern_world(c, p, 372, 84, 44, 5.5))
    gar = garland(c, 0, 4, 164, 6, 9, 9) + garland(c, 352, 3, 400, 4, 4, 3)
    g['lanterns'] = lan
    g['garland'] = gar

    # --- reflections on the polished floor -------------------------------------------
    c.light_poly([(58, FLOOR), (106, FLOOR), (116, FLOOR + 22), (52, FLOOR + 22)], .07)
    c.glow(82, FLOOR + 8, 26, '#3f6fff', .22)
    fx0, fy0, fx1, fy1 = g['stage_front']
    for x in range(int(fx0) + 5, int(fx1) - 2, 8):
        for k, L in ((3, .5), (5, .38), (8, .3)):
            c.put(x, int(fy1) + k, 'b_sodium', L, emis=.6)
    # litter on the floor: a Blue Lantern matchbook, butts, peanut shells by the bar
    mbx, mby = p.P(120, 0, 84)
    c.rect(int(mbx), int(mby), int(mbx) + 3, int(mby) + 2, 'b_lanternglass', .5)
    c.put(int(mbx), int(mby), 'paper', .8)
    for (X, Z) in ((70, 92), (140, 70), (300, 66), (212, 104), (60, 40)):
        bx_, by_ = p.P(X, 0, Z)
        c.hline(int(bx_), int(bx_) + 2, int(by_), 'paper', .62)
    rng2 = np.random.default_rng(71)
    for _ in range(14):
        X = rng2.uniform(282, 350)
        Z = rng2.uniform(46, 58)
        bx_, by_ = p.P(X, 0, Z)
        c.put(int(bx_), int(by_), 'oak', .7)

    # tip jar on the piano top
    if g.get('piano_top'):
        mx, my = g['piano_top']
        jx, jy = int(mx) - 1, int(my) + 1
        c.rect(jx - 1, jy - 5, jx + 2, jy, 'glass', .55, emis=.25)
        c.put(jx, jy - 3, 'felt', .7)
        c.put(jx + 1, jy - 2, 'felt', .6)
        c.hline(jx - 1, jx + 2, jy - 5, 'glass', .85, emis=.3)

    # --- smoke haze (dithered, drifting layers under the ceiling) -------------------------
    N = noise2(W, H, 24, 61, 3)
    def haze(xx, yy):
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        band = np.clip(1 - np.abs(yy - 22) / 20, 0, 1)
        return band * np.clip(N[yi, xi] * 1.3 - .45, 0, 1) * .42
    B.veil(c, 14, 0, 386, 50, haze, 'b_smoke', .36)

    # --- lighting ---------------------------------------------------------------------
    c.ambient = .38
    # stage spotlight on the piano (key light) + visible beam in the smoke
    c.add_light(194, 56, 80, .7, falloff=1.25)
    c.light_poly([(184, 0), (204, 0), (234, 96), (158, 96)], .1)
    N2 = noise2(W, H, 6, 62, 2)
    def beam(xx, yy):
        t = np.clip(yy / 96, 0, 1)
        xl = 184 + (158 - 184) * t
        xr = 204 + (234 - 204) * t
        inside = (xx >= xl) & (xx <= xr)
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        return np.where(inside, (1 - t) * .22 * N2[yi, xi], 0)
    B.veil(c, 150, 0, 240, 50, beam, 'b_smoke', .7, emis=.3)
    # footlights wash the backdrop bottom
    c.add_light(217, 100, 70, .3, ystretch=3.5)
    # back-bar glow
    c.add_light(314, 44, 72, .5, falloff=1.4)
    c.add_light(314, 100, 70, .22, ystretch=3)
    # neon window
    c.add_light(82, 40, 64, .36)
    # candles
    for t in g['tables'].values():
        if 'candle' in t:
            x, y = t['candle']
            c.add_light(x, y, 26 * t['s'], .42, falloff=1.4)
            c.glow(x, y, 8 * t['s'], '#ffb060', .7)
    # lanterns
    for (x, y, r) in lan:
        c.add_light(x, y, 34, .22)
        c.glow(x, y, r * 3.2, '#4f7fff', .5)
    for (fx, fy, s) in FLOOR_POOLS:
        c.add_light(fx, fy, 34 * s, .2, ystretch=3.2)
        c.glow(fx, fy, 22 * s, '#2c56c8', .22)
    for (x, y, col) in gar:
        c.glow(x, y, 7, '#ff5050' if col == 'neonred' else ('#ffb060' if col == 'b_sodium' else '#5080ff'), .45)
    # neon signs & bulbs
    c.glow(82, 32, 30, '#3f7dff', .65)
    c.glow(96, 52, 10, '#ff3040', .6)
    c.glow(314, 8, 26, '#ff4050', .45)
    c.glow(33, 33, 12, '#ff3040', .5)
    c.glow(369, 35, 8, '#ff3040', .55)
    c.glow(194, 44, 50, '#c0d4ff', .16)
    c.add_light(124, 40, 30, .35)                              # coat-check lamp
    c.glow(126, 37, 10, '#ffb060', .4)
    c.add_light(272, 70, 40, .25)                              # bar spill on the palm
    c.glow(314, 40, 60, '#ffb060', .2)
    c.glow(213, 33, 14, '#4f7fff', .35)
    # contact shadows
    sx0, sx1 = STAGE_X
    fx0, fy0, fx1, fy1 = g['stage_front']
    c.shadow_poly([(fx0, fy1), (fx1, fy1), (fx1 + 4, fy1 + 4), (fx0 - 4, fy1 + 4)], .45)
    for t in g['tables'].values():
        c.shadow_ellipse(t['cx'], t['fy'], t['rx'] * 1.1, t['ry'] * .7, .5)
    bz1 = BAR_Z[1]
    c.shadow_poly(p.quad([(BAR_X[0], 0, bz1), (BAR_X[1], 0, bz1), (BAR_X[1], 0, bz1 + 6), (BAR_X[0], 0, bz1 + 6)]),
                  .4)
    plx, ply = g['palm']
    c.shadow_ellipse(plx, ply, 9, 2.5, .5)
    # vignette: dark corners, light in the middle band
    B.vignette(c, 200, 60, 270, 130, lo=.6)


def interaction(sc, g, p):
    T = g['tables']
    dx0, dy0, dx1, dy1 = g['door']
    sc.hotspot('exit_street', rect=(dx0 - 3, dy0 - 4, dx1 + 3, dy1), walk=(34, 98), face='up')
    pdx0, pdy0, pdx1, pdy1 = g['private']
    sc.hotspot('exit_cellar', rect=(pdx0 - 2, pdy0 - 2, pdx1 + 2, pdy1), walk=(370, 98), face='up')
    # piano: screen bbox of the instrument
    sc.hotspot('piano', poly=[(156, 46), (200, 46), (204, 92), (156, 96)], walk=(196, 106), face='up')
    fx0, fy0, fx1, fy1 = g['stage_front']
    sc.hotspot('stage', rect=(int(fx0) + 46, 44, int(fx1), int(fy1)), walk=(232, 106), face='up')
    bb = g['bar_base']
    sc.hotspot('bar', rect=(282, 80, 352, bb), walk=(320, 108), face='up')
    sc.hotspot('bottles', rect=(282, 18, 346, 62), walk=(304, 108), face='up')
    plx, ply = g['palm']
    sc.hotspot('palm', rect=(plx - 16, ply - 46, plx + 16, ply), walk=(plx - 4, ply + 8), face='up')
    t1, t2, t3, t4 = T['table1'], T['table2'], T['table3'], T['table4']
    tb = lambda t: (int(t['cx'] - t['rx']), int(t['cy'] - 6), int(t['cx'] + t['rx']), int(t['fy']))
    sc.hotspot('tables', rect=tb(t3), walk=(int(t3['cx']) - 18, int(t3['fy']) + 6), face='right')
    px0, py0, px1, py1 = g['poster']
    sc.hotspot('poster', rect=(px0 - 2, py0 - 2, px1 + 2, py1 + 2), walk=(150, 100), face='up')
    cx0, cy0, cx1, cy1 = g['coat']
    sc.hotspot('coat_check', rect=(cx0 - 3, cy0 - 13, cx1 + 3, cy1), walk=(123, 98), face='up')
    sc.hotspot('patrons', poly=[(int(t1['cx'] - 26), int(t1['cy'] - 26)), (int(t1['cx'] + 26), int(t1['cy'] - 26)),
                                (int(t1['cx'] + 26), int(t1['fy'])), (int(t1['cx'] - 26), int(t1['fy']))],
               walk=(int(t1['cx']), int(t1['fy']) + 8), face='up')

    # walkable floor: back lane along the wall on the left, in front of the stage & bar,
    # a passage behind the bar's end to the PRIVATE door
    zf = p.z_at_floor_y(H + 2)
    def P2(X, Z):
        x, y = p.P(X, 0, Z)
        return (int(round(x)), int(round(y)))
    poly = [P2(18, 6), P2(150, 6), P2(156, STAGE_Z + 3), P2(352, BAR_Z[1] + 12), P2(352, 8), P2(384, 8),
            P2(384, zf), P2(18, zf)]
    holes = []
    for t in (t1, t2, t3, t4):
        x, fy, rx = t['cx'], t['fy'], t['rx']
        holes.append([(int(x - rx - 16), int(fy - 6)), (int(x + rx + 16), int(fy - 6)),
                      (int(x + rx + 16), int(fy + 4)), (int(x - rx - 16), int(fy + 4))])
    holes.append([(plx - 10, ply - 5), (plx + 10, ply - 5), (plx + 10, ply + 3), (plx - 10, ply + 3)])
    holes.append([(0, 126), (18, 126), (18, 146), (0, 146)])
    sc.walkable(poly, holes=holes)

    sc.point('start', 34, 100, 'down')
    sc.point('from_map', 34, 100, 'down')
    sc.point('from_cellar', 370, 100, 'down')
    bcx, bcz = g['bench']
    x, y = p.P(bcx, STAGE_Y, bcz)
    sc.point('deacon_spot', int(round(x)) + 1, int(round(y)), 'left')
    sx, sy = p.P(314, 0, 14)
    sc.point('sal_spot', int(round(sx)), int(round(sy)), 'down')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, p.char_scale(FLOOR, 140), 140, 1.0)
    sc.meta['floor'] = 'wood'
    sc.meta['npc_notes'] = {'deacon_spot': 'seated on the piano bench, facing left towards the keys (on the stage)',
                            'sal_spot': 'behind the bar counter (occluder bar_counter, baseline > spot y)'}

    # --- animations -------------------------------------------------------------------
    tips = []
    for t in (t1, t2, t3, t4):
        tips += t.get('tips', [])
    tips.append(g['ashtray'])
    if g.get('piano_top'):
        mx, my = g['piano_top']
        tips.append((int(mx) - 5, int(my) - 1))
    smoke_frames = []
    for k in range(6):
        def fr(cc, k=k):
            for i, (x, y) in enumerate(tips):
                ph = k + i * 2
                for j in range(7):
                    yy = y - 2 - j * 2 - (ph % 2)
                    xx = x + int(round(math.sin((j + ph) * .9) * (1 + j * .25)))
                    if j < 6:
                        cc.put(xx, yy, 'b_smoke', .78 - j * .06, emis=.25)
                    if j > 2 and (j + ph) % 3 == 0:
                        cc.put(xx + 1, yy, 'b_smoke', .6, emis=.2)
        smoke_frames.append(fr)
    sc.anim('smoke', smoke_frames, fps=5)
    # candle flicker
    cands = [t['candle'] for t in (t1, t2, t3, t4) if 'candle' in t]
    def cfr(k):
        def f(cc):
            for i, (x, y) in enumerate(cands):
                kk = (k + i) % 3
                cc.put(x, y, 'b_sodium', [.95, .85, 1.0][kk], emis=1)
                cc.put(x, y - 1, 'b_sodium', [.75, .9, .6][kk], emis=1)
                cc.put(x + (1 if kk == 2 else 0), y - 2 if kk == 1 else y - 1, 'b_sodium', .7, emis=1)
        return f
    sc.anim('candles', [cfr(k) for k in range(3)], fps=7)
    # neon: the last N of LANTERN stutters
    def nfr(on):
        def f(cc):
            # reversed "LANTERN": the N is the left-most glyph on the second line
            for (a, b) in ((0, 0), (0, 1), (0, 2), (0, 3), (0, 4), (1, 1), (2, 2), (3, 0), (3, 1), (3, 2), (3, 3), (3, 4)):
                cc.put(66 + a, 18 + 19 + b, 'b_lanternglass', .9 if on else .25, emis=1 if on else .2)
        return f
    sc.anim('neon', [nfr(True)] * 5 + [nfr(False), nfr(True), nfr(False)], fps=6)


VARIANTS = {}


def main():
    sc = build()
    wx0, wy0, wx1, wy1 = 60, 18, 104, 62
    sc.rain(wx0, wy0, wx1, wy1, kind='window')
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
