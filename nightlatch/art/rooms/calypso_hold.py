"""Chapter 7 - the cargo hold of the MV Calypso, Pier 4.  Base render is dark: one crack of light
from the hatch, the faint glow of the vent pipe (Nora's side) and a glint on the ship's lantern.
Variant 'lit': the whole hold in warm lantern light."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
from persp import Persp, floor_poly
import props_b as B

W, H = 320, 144
FLOOR = 100
SEED = 71
LANTERN = (116, 62)       # screen position of the lantern body centre (set in paint)


def P_():
    return Persp(40, 280, 0, FLOOR, horizon=-50, depth=360)


def paint(sc, st):
    c = sc.c
    p = P_()
    zfront = p.z_at_floor_y(H + 2)
    g = {}
    Nn = noise2(W, H, 5, 7, 3)

    # ======================================================= forward bulkhead ====
    def bulk(xx, yy):
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = .42 + (Nn[yi, xi] - .5) * .14
        k = np.floor((xx - 40) / 30)
        fx = (xx - 40) - k * 30
        L = np.where(fx < 1, L - .16, L)                       # plate seams
        L = np.where((yy % 26) < 1, L - .14, L)
        return L
    c.rect(40, 0, 280, FLOOR, 'steel', bulk, dith=.35)
    # vertical stiffeners with rivet rows
    for x in range(54, 280, 30):
        c.rect(x, 0, x + 4, FLOOR, 'steel', hgrad(x, x + 4, .56, .3))
        B.rivets_v(c, x - 3, 4, FLOOR - 4, 5, 'steel', .62)
        B.rivets_v(c, x + 6, 4, FLOOR - 4, 5, 'steel', .5)
    for y in range(26, FLOOR, 26):
        B.rivets_h(c, 40, 280, y + 2, 5, 'steel', .56)
    # rust: streaks from every rivet row, a tide mark of old bilge water
    rng = np.random.default_rng(4)
    for _ in range(40):
        x = int(rng.integers(40, 280))
        y = int(rng.integers(4, FLOOR - 20))
        c.vline(x, y, y + int(rng.integers(4, 16)), 'rust', .38 + rng.random() * .1)
    B.veil(c, 40, FLOOR - 12, 280, FLOOR, lambda xx, yy: np.clip((yy - FLOOR + 12) / 12, 0, 1) * .5, 'rust', .3)
    # stencils on the bulkhead
    B.text(c, 70, 30, 'NO 2 HOLD', 'paper', .46, wear=.2, seed=3)
    B.text(c, 228, 30, 'FWD', 'paper', .44, wear=.2, seed=4)
    c.line(242, 32, 250, 32, 'paper', .44)
    c.put(249, 31, 'paper', .44)
    c.put(249, 33, 'paper', .44)

    # ============================================= hull sides with frames (ribs) ====
    for X, base, sgn in ((40, .32, 1), (280, .3, -1)):
        pts = p.quad([(X, 0, 0), (X, 0, zfront), (X, 160, zfront), (X, 160, 0)])

        def sidefn(xx, yy, X=X, base=base):
            s = np.maximum((xx - p.cx) / (X - p.cx), 1e-3)
            Z = p.D * (1 - 1 / s)
            xi = np.clip(xx.astype(int), 0, W - 1)
            yi = np.clip(yy.astype(int), 0, H - 1)
            L = base + (Nn[yi, xi] - .5) * .14
            L = np.where((Z % 22) < 1.2 * s, L - .14, L)
            return L
        c.poly(pts, 'steel', sidefn)
        # frames: deep flat bars standing proud of the plating
        for Z in range(8, int(zfront) + 22, 22):
            a = p.P(X, 0, Z)
            b = p.P(X, 160, Z)
            a2 = p.P(X + sgn * 6, 0, Z)
            b2 = p.P(X + sgn * 6, 160, Z)
            c.poly([a, b, b2, a2], 'steel', .5 if sgn > 0 else .26)
            c.line(a2[0], a2[1], b2[0], b2[1], 'steel', .64 if sgn > 0 else .4)
            # rivets along the frame
            for Y in range(4, 150, 7):
                q = p.P(X + sgn * 3, Y, Z)
                c.put(q[0], q[1], 'steel', .62)
    # the bilge turn: plating curving into the floor at both sides
    for X, sgn in ((40, 1), (280, -1)):
        for Z in range(0, int(zfront) + 2, 2):
            a = p.P(X, 6, Z)
            b = p.P(X + sgn * 10, 0, Z)
            c.line(a[0], a[1], b[0], b[1], 'steel', .3)

    # ==================================================== deckhead + the hatch ====
    # heavy deck beams across the top of the frame
    c.rect(0, 0, W, 10, 'steel', vgrad(0, 10, .2, .34))
    for x in range(0, W, 26):
        c.rect(x, 0, x + 6, 14, 'steel', hgrad(x, x + 6, .44, .22))
        c.hline(x, x + 6, 14, 'steel', .5)
    # hatch opening: boards with the tarpaulin over them, a crack of light between two boards
    hx0, hx1 = 116, 204
    g['hatch'] = (hx0, 0, hx1, 18)
    c.rect(hx0 - 4, 10, hx1 + 4, 18, 'steel', vgrad(10, 18, .5, .3))     # coaming
    c.hline(hx0 - 4, hx1 + 4, 17, 'steel', .62)
    for k, x in enumerate(range(hx0, hx1, 11)):
        c.rect(x, 0, x + 10, 10, 'wood', .34 + (k % 2) * .04)
        c.vline(x + 10, 0, 10, 'black', .05)
    crack_x = hx0 + 43
    g['crack'] = crack_x
    c.vline(crack_x, 0, 10, 'fog', .9, emis=1)
    c.put(crack_x, 10, 'fog', .7, emis=.8)
    # cargo net hanging from the coaming (diamond mesh, sagging, gathered at the bottom)
    nx0, nx1, ny0, ny1 = 134, 186, 18, 64
    g['net'] = (nx0, ny0, nx1, ny1)
    for k in range(9):
        t = k / 8
        xa = nx0 + (nx1 - nx0) * t
        xb = 150 + (172 - 150) * t
        pts = []
        for j in range(13):
            u = j / 12
            x = xa + (xb - xa) * u + math.sin(u * math.pi) * (t - .5) * 6
            y = ny0 + (ny1 - ny0) * u
            pts.append((x, y))
        for a_, b_ in zip(pts, pts[1:]):
            c.line(a_[0], a_[1], b_[0], b_[1], 'b_tarp', .5)
    for j in range(1, 12):
        u = j / 12
        y = ny0 + (ny1 - ny0) * u
        xl = nx0 + (150 - nx0) * u
        xr = nx1 + (172 - nx1) * u
        for i in range(8):
            t0, t1 = i / 8, (i + 1) / 8
            ya = y + (1 if i % 2 else -1) * 1.2
            c.line(xl + (xr - xl) * t0, y, xl + (xr - xl) * t1, ya, 'b_tarp', .44)
    c.rect(156, ny1 - 2, 166, ny1 + 2, 'b_tarp', .55)                   # gathered knot
    c.vline(161, ny1 + 2, ny1 + 8, 'b_tarp', .5)

    # ========================================================== floor (tank top) ====
    fl = floor_poly(p, 40, 280, 0, zfront)

    def floorfn(xx, yy):
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        X = p.cx + (xx - p.cx) / s
        Z = p.D * (1 - 1 / s)
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        L = .34 + (Nn[yi, xi] - .5) * .12
        L = np.where(((X - 40) % 40) < 1 / s * 1.2, L - .14, L)
        L = np.where((Z % 30) < 1 / s * 1.4, L - .12, L)
        return L
    c.poly(fl, 'steel', floorfn)
    # bilge water: an oily pool in the middle and a gutter along the left side
    bx, by = p.P(150, 0, 62)
    c.ellipse(bx, by, 36, 5, 'water', .26, dith=.3)
    c.ellipse(bx + 4, by, 26, 3.4, 'water', .34, dith=.3)
    for k in range(5):                                                   # oil sheen
        c.hline(int(bx) - 18 + k * 8, int(bx) - 14 + k * 8, int(by) - 1 + (k % 2), 'mauve', .5)
    gx0, gy0 = p.P(46, 0, 10)
    gx1, gy1 = p.P(46, 0, zfront)
    c.line(gx0, gy0, gx1, gy1, 'water', .3)
    c.line(gx0 + 2, gy0, gx1 + 4, gy1, 'water', .22)
    g['bilge'] = (int(bx), int(by))

    # ================================================================ stanchion ====
    stX, stZ = 120, 36
    sx, sy = p.P(stX, 0, stZ)
    s = p.s(stZ)
    c.rect(int(sx) - 2, 14, int(sx) + 2, int(sy), 'steel', hgrad(sx - 2, sx + 2, .34, .14))
    c.vline(int(sx) - 2, 14, int(sy), 'steel', .72)
    c.rect(int(sx) - 4, int(sy) - 2, int(sx) + 4, int(sy), 'steel', .4)
    c.rect(int(sx) - 4, 14, int(sx) + 4, 16, 'steel', .44)
    for k, y in enumerate(range(int(sy) - 14, int(sy) - 2, 3)):              # hazard band
        c.rect(int(sx) - 2, y, int(sx) + 2, y + 3, 'gold' if k % 2 == 0 else 'black', .55 if k % 2 == 0 else .2)
    # hook for the lantern
    lhx, lhy = int(sx) - 3, int(sy) - 60
    c.line(lhx + 1, lhy, lhx - 3, lhy, 'steel', .6)
    c.line(lhx - 3, lhy, lhx - 3, lhy + 3, 'steel', .6)
    g['lantern'] = (lhx - 3, lhy + 4)
    g['stanchion'] = (int(sx), int(sy))

    # ============================================================== the lantern ====
    lx, ly = g['lantern']
    # ship's lantern (brass, fresnel glass) hanging from the hook
    c.vline(lx, ly - 1, ly + 1, 'brass', .6)
    c.rect(lx - 3, ly + 1, lx + 4, ly + 3, 'brass', .5)
    c.hline(lx - 3, lx + 4, ly + 1, 'brass', .8)
    c.rect(lx - 3, ly + 3, lx + 4, ly + 10, 'glass', vgrad(ly + 3, ly + 10, .55, .32))
    for yy in (ly + 5, ly + 7):
        c.hline(lx - 3, lx + 4, yy, 'glass', .62)                        # fresnel ridges
    c.vline(lx - 3, ly + 3, ly + 10, 'brass', .5)
    c.vline(lx + 3, ly + 3, ly + 10, 'brass', .4)
    c.rect(lx - 4, ly + 10, lx + 5, ly + 13, 'brass', .52)
    c.put(lx - 2, ly + 4, 'white', .9, emis=.35)                        # the one glint that finds it
    c.put(lx + 2, ly + 2, 'brass', .9, emis=.25)
    c.put(lx, ly + 8, 'ink', .3)                                         # wick
    if 'lantern_lit' in st:
        c.ellipse(lx + .5, ly + 7, 1.5, 2.5, 'lamp', .95, emis=1)
        c.put(lx, ly + 5, 'lamp', 1.0, emis=1)
        c.rect(lx - 2, ly + 4, lx + 3, ly + 10, 'lamp', .78, emis=1)
        c.put(lx, ly + 6, 'lamp', 1.0, emis=1)

    # ====================================================== vent pipe (to Nora) ====
    vx, vy = 196, 50
    g['pipe'] = (vx, vy)
    # trunk coming down from the deckhead and an elbow into the bulkhead with a grille
    c.rect(vx - 3, 14, vx + 3, vy - 4, 'steel', hgrad(vx - 3, vx + 3, .6, .28))
    for y in range(22, vy - 4, 10):
        c.rect(vx - 4, y, vx + 4, y + 2, 'steel', .5)                     # flanges
    c.ellipse(vx, vy, 8, 8, 'steel', .5)
    c.ellipse(vx, vy, 6.5, 6.5, 'steel', .2)
    for k in range(-5, 6, 2):
        c.hline(vx - int(math.sqrt(max(0, 36 - k * k))), vx + int(math.sqrt(max(0, 36 - k * k))), vy + k, 'fog', .3,
                emis=.55)                                                # faint light from the other side
    for a in range(0, 360, 45):
        r_ = math.radians(a)
        c.put(int(round(vx + math.cos(r_) * 7.5)), int(round(vy + math.sin(r_) * 7.5)), 'steel', .7)
    B.text(c, vx - 6, vy + 11, 'VENT', 'paper', .45, wear=.1, seed=6)

    # ============================================ heavy crates: GULLWING machine parts ====
    hb = int(p.P(0, 0, 52)[1])
    with sc.obj('heavy_crates', baseline=hb):
        B.crate_box(c, p, 210, 278, 0, 26, 4, 24, 'oak', .5, stencil='GULLWING', stencil2='MACHINE PARTS',
                    stencil_ramp='ink', stencil_lum=.15, seed=41, boards=4)
        B.crate_box(c, p, 216, 272, 26, 46, 6, 22, 'oak', .52, stencil='GULLWING', stencil_ramp='ink', stencil_lum=.15,
                    seed=42, boards=3)
        fr = B.crate_box(c, p, 204, 258, 0, 22, 32, 52, 'oak', .54, stencil='GULLWING', stencil2='MACHINE PARTS',
                         stencil_ramp='ink', stencil_lum=.15, seed=43, boards=4)
        g['heavy_front'] = fr
        if 'crate_broken' in st:
            fx0, fy0, fx1, fy1 = fr
            # two slats pried off: rocks and straw inside
            c.rect(fx0 + 6, fy0 + 6, fx1 - 6, fy0 + 15, 'black', .1)
            for (ax, ay, r_) in ((fx0 + 10, fy0 + 11, 3), (fx0 + 17, fy0 + 10, 3.5), (fx0 + 25, fy0 + 12, 3),
                                 (fx0 + 31, fy0 + 10, 2.5), (fx0 + 14, fy0 + 14, 2.5), (fx0 + 22, fy0 + 14, 2.5)):
                c.ellipse(ax, ay, r_, r_ * .8, 'concrete', .48)
                c.put(int(ax - 1), int(ay - 1), 'concrete', .7)
            c.hline(fx0 + 6, fx1 - 6, fy0 + 15, 'gold', .45)
            # the pried slats lying on the floor
            c.line(fx0 + 2, fy1 + 4, fx0 + 22, fy1 + 1, 'oak', .6)
            c.line(fx0 + 12, fy1 + 7, fx0 + 34, fy1 + 5, 'oak', .55)
            c.put(fx0 + 22, fy1 + 1, 'steel', .8)
    g['heavy'] = (int(p.P(204, 46, 52)[0]), int(p.P(216, 46, 6)[1]) - 2, int(p.P(278, 0, 24)[0]) + 4, hb)

    # ==================================================== odds and ends ====
    # fire bucket on the bulkhead
    c.put(70, 46, 'steel', .6)
    c.poly([(66, 48), (75, 48), (74, 57), (67, 57)], 'red', .45)
    c.hline(66, 75, 48, 'red', .7)
    c.line(66, 48, 70, 45, 'steel', .5)
    c.line(75, 48, 70, 45, 'steel', .5)
    # empty sacks heaped by the bulkhead, a coil of hawser
    sx2, sy2 = p.P(172, 0, 8)
    c.ellipse(sx2, sy2 - 3, 10, 4, 'trench', .42)
    c.ellipse(sx2 + 5, sy2 - 6, 7, 3, 'trench', .5)
    c.line(sx2 - 6, sy2 - 4, sx2 + 2, sy2 - 6, 'trench', .3)
    rx2, ry2 = p.P(76, 0, 22)
    B.rope_coil(c, rx2, ry2 - 1, 9, 3, 'trench', .5, turns=4)
    # a broken pallet leaning on the left hull
    a = p.P(44, 0, 70)
    c.poly([(a[0] + 2, a[1]), (a[0] + 6, a[1] - 26), (a[0] + 10, a[1] - 24), (a[0] + 7, a[1] + 1)], 'wood', .4)
    for k in range(4):
        c.line(a[0] + 3 + k * .9, a[1] - 4 - k * 6, a[0] + 9 + k * .9, a[1] - 3 - k * 6, 'wood', .55)
    # a smashed bottle near the bilge
    bx3, by3 = p.P(196, 0, 70)
    for (dx, dy) in ((0, 0), (2, -1), (3, 1), (-2, 1)):
        c.put(int(bx3) + dx, int(by3) + dy, 'b_bottle_g', .6)

    # ==================================================== chains ====
    B.chain_v(c, 290, 14, 96, 'steel', .5, link=3)
    B.chain_sag(c, 262, 14, 300, 30, 26, 'steel', .5)
    cx_, cy_ = p.P(262, 0, 70)
    for k in range(6):
        c.ellipse(cx_ + k * 3 - 8, cy_ - (k % 2) * 2, 4, 2, 'steel', .42 + (k % 2) * .08)
        c.ellipse(cx_ + k * 3 - 8, cy_ - (k % 2) * 2, 2.5, 1, 'steel', .2)
    g['chains'] = (int(cx_) - 14, 14, 300, int(cy_) + 4)

    # ====================================== light crates / drum (state-dependent) ====
    c1 = 'N' if ({'crate1_moved', 'stack'} & st) else 'A'
    drum = 'D2' if ({'drum_moved', 'crate2_moved', 'stack'} & st) else 'D'
    c2 = 'S' if 'stack' in st else ('gone' if 'crate2_moved' in st else 'B')
    if 'crate2_moved' in st or 'stack' in st:
        c1 = 'N'

    def halcyon(X0, X1, Y0, Z0, Z1, seed):
        return B.crate_box(c, p, X0, X1, Y0, Y0 + 16, Z0, Z1, 'wood', .56, stencil='HALCYON', stencil2='L-7',
                           stencil_ramp='red', stencil_lum=.32, seed=seed, boards=2)
    # crate 2 at B (behind the drum)
    if c2 == 'B':
        halcyon(96, 120, 0, 8, 24, 52)
    # crate 1 at A (left, free)
    if c1 == 'A':
        halcyon(52, 76, 0, 44, 60, 51)
    # the stack position under the net
    if c1 == 'N':
        halcyon(140, 164, 0, 26, 42, 51)
    if c2 == 'S':
        halcyon(142, 166, 16, 27, 41, 52)
    # oil drum
    DX, DZ = (108, 32) if drum == 'D' else (80, 24)
    dx_, dy_ = p.P(DX, 0, DZ)
    ds = p.s(DZ)
    B.cylinder(c, dx_, dy_ - 22 * ds, dy_, 7 * ds, 2.4 * ds, 'red', .38, top=True, top_lum=.45)
    for t in (.3, .7):
        yy = dy_ - 22 * ds * t
        c.hline(int(dx_ - 7 * ds), int(dx_ + 7 * ds), int(yy), 'red', .22)
        c.hline(int(dx_ - 7 * ds), int(dx_ + 7 * ds), int(yy) - 1, 'red', .5)
    B.text(c, int(dx_) - 5, int(dy_ - 22 * ds * .55), 'OIL', 'paper', .55, wear=.1, seed=9)
    c.ellipse(dx_ + 2 * ds, dy_ - 22 * ds, 1.4, .8, 'black', .1)          # bung
    g['drum'] = (int(dx_), int(dy_), ds)
    g['A'] = p.P(64, 16, 52)
    g['B'] = p.P(108, 16, 16)
    g['N'] = p.P(152, 16, 34)

    # ============================================== hatch open (state) ====
    if 'hatch_open' in st:
        # a board pushed up and the tarpaulin slit: night sky and fog light pour in
        c.rect(hx0 + 33, 0, hx0 + 55, 10, 'night', vgrad(0, 10, .3, .45), emis=.8)
        c.poly([(hx0 + 33, 10), (hx0 + 44, 0), (hx0 + 47, 0), (hx0 + 36, 10)], 'wood', .5)
        c.put(hx0 + 40, 2, 'fog', .8, emis=1)
        c.put(hx0 + 50, 4, 'fog', .7, emis=1)
        c.line(hx0 + 33, 9, hx0 + 55, 9, 'b_tarp', .55)

    # ================================================================ lighting ====
    c.ambient = .045
    # the crack of daylight/lamplight from the deck: a thin shaft to the floor
    cx = g['crack']
    B.light_shaft(c, [(cx, 10), (cx + 1, 10), (cx + 14, FLOOR + 14), (cx - 8, FLOOR + 14)], .5, motes=18, seed=5)
    c.add_light(cx + 3, FLOOR + 10, 46, .45, ystretch=2.4)
    c.add_light(cx, 30, 34, .28)
    c.glow(cx, 4, 10, '#d8e4f0', .6)
    # a sliver of the crack light catches the lantern's brass and glass
    lx_, ly_ = g['lantern']
    c.add_light(lx_, ly_ + 6, 14, .32)
    # Nora's side glows faintly through the vent grille
    c.add_light(vx, vy, 22, .3)
    c.glow(vx, vy, 10, '#a0b8d0', .3)
    # contact shadows
    c.shadow_poly(p.quad([(204, 0, 2), (280, 0, 2), (280, 0, 54), (204, 0, 54)]), .5)
    return g, p


STATES = [
    ('crate1_moved', {'crate1_moved'}, 2),
    ('drum_moved', {'drum_moved'}, 3),
    ('crate2_moved', {'crate1_moved', 'drum_moved', 'crate2_moved'}, 4),
    ('stack', {'crate1_moved', 'drum_moved', 'crate2_moved', 'stack'}, 5),
    ('crate_broken', {'crate_broken'}, None),
    ('lantern_lit', {'lantern_lit'}, 6),
    ('hatch_open', {'hatch_open'}, 6),
]


def lit_variant(c):
    lx, ly = LANTERN
    back = {n: n[4:] for n in c.ids if n.startswith('b_n_')}
    back['b_n_steel'] = 'b_warmsteel'
    B.palette_swap(c, back)
    c.ambient = .26
    c.add_light(lx, ly + 6, 240, .82, falloff=1.2)
    c.add_light(lx + 30, 124, 160, .3, ystretch=2.2)
    c.glow(lx, ly + 6, 120, '#ff9a40', .16)
    c.glow(lx, ly + 6, 24, '#ffd080', .6)
    return None


def build():
    sc = B.SceneB('calypso_hold', W, H, seed=SEED)
    g, p = paint(sc, set())
    B.darken_all(sc.c)
    global LANTERN
    LANTERN = g['lantern']
    hb = g['heavy'][3]
    for name, sts, depth in STATES:
        alt = Scene('calypso_hold', W, H, seed=SEED)
        paint(alt, sts)
        B.darken_all(alt.c)
        region = None
        if name == 'crate_broken':
            depth = hb + 1
        if name == 'hatch_open':
            region = (g['hatch'][0] - 6, 0, g['hatch'][2] + 6, 22)
        if name == 'lantern_lit':
            lx_, ly_ = g['lantern']
            region = (lx_ - 8, ly_ - 4, lx_ + 9, ly_ + 16)
        B.state_from(sc, name, alt.c, depth=depth, region=region)

    def P2(X, Z):
        x, y = p.P(X, 0, Z)
        return (int(round(x)), int(round(y)))
    hx0, _, hx1, _ = g['hatch']
    sc.hotspot('hatch', rect=(hx0 - 4, 0, hx1 + 4, 18), walk=(158, 110), face='up')
    nx0, ny0, nx1, ny1 = g['net']
    sc.hotspot('net', rect=(nx0, ny0, nx1, ny1 + 8), walk=(158, 112), face='up')
    hx, hy, hx2, hb = g['heavy']
    sc.hotspot('crates_heavy', rect=(hx, hy, hx2, hb), walk=(222, 132), face='up')
    ax, ay = g['A']
    sc.hotspot('crate1', rect=(int(ax) - 18, int(ay) - 4, int(ax) + 18, int(ay) + 22), walk=(int(ax) + 26, int(ay) + 20),
               face='left')
    bx, by = g['B']
    sc.hotspot('crate2', rect=(int(bx) - 14, int(by) - 3, int(bx) + 14, int(by) + 18), walk=(126, 116), face='left')
    dx, dy, ds = g['drum']
    sc.hotspot('drum', rect=(dx - 9, int(dy - 26 * ds), dx + 9, dy + 3), walk=(dx + 14, dy + 6), face='left')
    lx, ly = g['lantern']
    sc.hotspot('lantern', rect=(lx - 6, ly - 3, lx + 7, ly + 15), walk=(128, 108), face='up')
    vx, vy = g['pipe']
    sc.hotspot('pipe', rect=(vx - 9, 14, vx + 9, vy + 17), walk=(vx, 108), face='up')
    sc.hotspot('bulkhead', rect=(60, 20, 120, 60), walk=(88, 104), face='up')
    bx_, by_ = g['bilge']
    sc.hotspot('bilge', rect=(bx_ - 36, by_ - 5, bx_ + 36, by_ + 6), walk=(bx_ - 40, by_ + 6), face='right')
    sc.hotspot('chains', rect=g['chains'], walk=(276, 132), face='right')
    Nx, Ny = g['N']
    sc.hotspot('stack', rect=(int(Nx) - 16, int(Ny) - 20, int(Nx) + 16, int(Ny) + 22), walk=(int(Nx), int(Ny) + 26),
               face='up')

    zf = p.z_at_floor_y(H - 4)
    poly = [P2(48, 4), P2(272, 4), P2(272, zf), P2(48, zf)]
    holes = [
        [P2(200, 0), P2(282, 0), P2(282, 56), P2(200, 56)],         # heavy crates
        [P2(92, 4), P2(124, 4), P2(124, 26), P2(92, 26)],           # crate 2 (B)
        [P2(48, 40), P2(80, 40), P2(80, 64), P2(48, 64)],           # crate 1 (A)
        [P2(98, 26), P2(118, 26), P2(118, 38), P2(98, 38)],         # drum
        [P2(116, 32), P2(124, 32), P2(124, 40), P2(116, 40)],       # stanchion
    ]
    sc.walkable(poly, holes=holes)
    sc.point('start', 170, 126, 'down')
    sc.point('wake', 176, 130, 'down')
    sc.point('pipe_spot', vx, 108, 'up')
    sc.point('stack_spot', int(Nx), int(Ny) + 26, 'up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, p.char_scale(FLOOR, 140), 140, 1.0)
    sc.meta['floor'] = 'metal'
    sc.meta['state_notes'] = ('crate states are cumulative: crate2_moved implies crate1_moved+drum_moved, '
                              'stack implies all three; draw order follows depth')

    # dust motes in the crack of light
    cx = g['crack']
    rng = np.random.default_rng(3)
    motes = [(cx + int(rng.integers(-3, 6)), int(rng.integers(14, 96))) for _ in range(10)]

    def mfr(k):
        def f(cc):
            for i, (x, y) in enumerate(motes):
                cc.put(x + int(math.sin((k + i) * .9) * 1.5), y + ((k + i) % 5) - 2, 'fog', .85, emis=.6)
        return f
    sc.anim('motes', [mfr(k) for k in range(5)], fps=4)
    # water dripping into the bilge
    bx_, by_ = g['bilge']

    def dfr(k):
        def f(cc):
            if k < 4:
                cc.put(bx_ + 10, int(20 + (by_ - 20) * k / 4), 'water', .7, emis=.3)
            else:
                r = k - 3
                for a in np.linspace(0, 2 * math.pi, 8 + r * 4):
                    cc.put(int(round(bx_ + 10 + math.cos(a) * r * 2)), int(round(by_ + math.sin(a) * r * .6)), 'water',
                           .6, emis=.25)
        return f
    sc.anim('drip', [dfr(k) for k in range(7)], fps=6)
    return sc


VARIANTS = {'lit': lit_variant}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
