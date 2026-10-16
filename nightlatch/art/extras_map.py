"""NIGHT LATCH - city map of Brackwater (ui/map.png, 320x180).

A hand-tinted 1951 street map lying on Rook's desk at night: sepia ink on aged paper,
watercolour washes (sea blue, rose city blocks, green hill and parks), engraved coastal
lines and ripples, hachured Gull Hill, a rail line, piers and ships, a compass rose and a
cartouche; every travel destination is a small pictorial landmark drawn right at its pin.
Everything is painted into a core.Canvas and lit by the desk lamp (warm pool, dark edges).

Pin coordinates (src/content/locations.ts) - each landmark is centred on its pin:
  halcyon (50,36) cemetery (98,50) mission (124,60) cityhall (176,56) commission (214,66)
  precinct (150,80) gazette (116,96) pharmacy (86,112) office (156,104) hask (168,116)
  hotel (202,106) bellwether (244,94) lantern (226,128) pier9 (264,148) pier4 (194,154)
"""
from __future__ import annotations

import math
from contextlib import contextmanager

import numpy as np

from core import Canvas, noise2, out_path, save_png
import extras_common as EC
from extras_common import dilate4, dilate8, micro_text, micro_width

W, H = 320, 180

PINS = {
    'halcyon': (50, 36), 'cemetery': (98, 50), 'mission': (124, 60), 'cityhall': (176, 56),
    'commission': (214, 66), 'precinct': (150, 80), 'gazette': (116, 96), 'pharmacy': (86, 112),
    'office': (156, 104), 'hask': (168, 116), 'hotel': (202, 106), 'bellwether': (244, 94),
    'lantern': (226, 128), 'pier9': (264, 148), 'pier4': (194, 154),
}

# ------------------------------------------------------------------ geography -------------
LAND = [
    (-2, 21), (8, 18), (18, 15), (30, 14), (42, 15), (54, 14), (63, 16), (71, 20), (79, 26), (87, 32),
    (96, 36), (108, 38), (122, 39), (136, 38), (145, 35), (153, 31), (163, 28), (175, 26), (188, 24),
    (201, 23), (215, 24), (229, 26), (242, 29), (254, 33), (263, 38), (271, 44), (277, 51), (283, 57),
    (291, 61), (300, 62), (306, 65), (304, 71), (295, 75), (287, 81), (281, 89), (277, 99), (275, 109),
    (273, 117), (269, 124), (261, 129), (250, 132), (238, 134), (226, 136), (214, 137), (202, 138),
    (190, 139), (178, 141), (166, 144), (154, 148), (143, 152), (133, 155), (124, 156), (114, 155),
    (103, 152), (92, 149), (80, 146), (68, 145), (56, 145), (44, 146), (32, 148), (20, 148), (8, 147),
    (-2, 146)]

# the Brack, coming down from the hills into the estuary
RIVER = [(-2, 120), (8, 123), (16, 128), (22, 135), (26, 141), (30, 149)]

RAIL = [(-2, 101), (16, 102), (34, 105), (52, 110), (68, 117), (84, 123), (100, 127), (118, 130), (136, 133),
        (150, 136), (162, 137)]

BREAKWATER = [(304, 70), (308, 82), (311, 96), (312, 110)]


@contextmanager
def track(c):
    """Record which pixels are painted inside the block -> yields a list holding the mask."""
    holder = [np.zeros((c.h, c.w), bool)]
    orig_apply = c._apply
    orig_put = c.put

    def _apply(mask, ramp_name, lum, emis=None, dith=None, region=None):
        orig_apply(mask, ramp_name, lum, emis=emis, dith=dith, region=region)
        if region is not None:
            x0, y0, x1, y1 = region
            holder[0][y0:y1, x0:x1] |= np.broadcast_to(mask, (y1 - y0, x1 - x0))
        else:
            holder[0] |= mask

    def put(x, y, ramp_name, lum, emis=0.0):
        orig_put(x, y, ramp_name, lum, emis)
        x, y = int(x), int(y)
        if 0 <= x < c.w and 0 <= y < c.h:
            holder[0][y, x] = True
    c._apply = _apply
    c.put = put
    try:
        yield holder
    finally:
        c._apply = orig_apply
        c.put = orig_put


def full_mask(c, m, r):
    M = np.zeros((c.h, c.w), bool)
    if m is not None:
        M[r[1]:r[3], r[0]:r[2]] = m
    return M


def poly_full(c, pts):
    m, r = c.poly_mask(pts)
    return full_mask(c, m, r)


def thick_line_mask(pts, width):
    """Mask of a polyline with the given width (distance test, sub-pixel)."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32) + .5
    M = np.zeros((H, W), bool)
    r = width / 2.0
    for (x0, y0), (x1, y1) in zip(pts[:-1], pts[1:]):
        dx, dy = x1 - x0, y1 - y0
        L2 = dx * dx + dy * dy or 1
        t = np.clip(((xx - x0) * dx + (yy - y0) * dy) / L2, 0, 1)
        px, py = x0 + t * dx, y0 + t * dy
        M |= (xx - px) ** 2 + (yy - py) ** 2 <= r * r
    return M


def line_px(x0, y0, x1, y1):
    x0, y0, x1, y1 = int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1))
    pts = []
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
    err = dx + dy
    while True:
        pts.append((x0, y0))
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy
    return pts


def polyline_px(pts):
    out = []
    for a, b in zip(pts[:-1], pts[1:]):
        seg = line_px(*a, *b)
        out.extend(seg if not out else seg[1:])
    return out


def distance_from(mask, steps=24):
    """Chamfer-ish distance (in px) from the True pixels of mask, capped at `steps`."""
    d = np.full(mask.shape, steps + 1, np.float32)
    cur = mask.copy()
    d[cur] = 0
    for k in range(1, steps + 1):
        nxt = dilate8(cur) if k % 3 == 0 else dilate4(cur)
        new = nxt & ~cur
        d[new] = k
        cur = nxt
    return d


# ------------------------------------------------------------------ pictogram helpers ------
def outline(c, mask, lum=.15, ramp='e_ink', shadow=True):
    ring = dilate4(mask) & ~mask
    ys, xs = np.nonzero(ring)
    for y, x in zip(ys, xs):
        c.put(x, y, ramp, lum)
    if shadow:
        sh = EC.shift(mask | ring, 1, 1) & ~(mask | ring)
        c.shade[sh] *= .78


def facade(c, x0, y0, x1, y1, ramp, lum, side=2, side_k=.62, dith=.25):
    """Front face [x0,x1) x [y0,y1) plus a receding right side `side` px wide (darker)."""
    c.rect(x0, y0, x1, y1, ramp, lum, dith=dith)
    if side:
        c.poly([(x1, y0), (x1 + side, y0 - 1), (x1 + side, y1 - 1), (x1, y1)], ramp, lum * side_k, dith=dith)


def windows(c, x0, y0, x1, y1, dx=2, dy=3, lit=(), ramp='e_window', lum=.85, dark_ramp='e_ink', dark_lum=.75,
            seed=0, frac=.35):
    rng = np.random.default_rng(seed)
    for y in range(y0, y1, dy):
        for x in range(x0, x1, dx):
            if (x, y) in lit or rng.random() < frac:
                c.put(x, y, ramp, lum, emis=.6)
            else:
                c.put(x, y, dark_ramp, dark_lum)


def tree(c, x, y, r=1.6, lum=.55, ramp='e_green'):
    c.ellipse(x, y, r, r, ramp, lum, dith=.3)
    c.put(x - 1, y - 1, ramp, min(1, lum + .3))
    c.put(int(x + r * .7), int(y + r * .7), ramp, lum * .45)


def micro_label(c, x, y, s, lum=.55, ramp='e_ink', spacing=1, align='center'):
    return micro_text(c, x, y, s, ramp, lum, spacing=spacing, align=align)


# ------------------------------------------------------------------ the map ---------------
def build():
    c = Canvas(W, H, seed=51)
    c.default_dith = .5
    rng = np.random.default_rng(5)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

    land = poly_full(c, LAND)
    river = thick_line_mask(RIVER, 3.2) | thick_line_mask(RIVER[-2:], 4.5)
    land &= ~river
    water = ~land
    dcoast = distance_from(land, 26)          # distance of water pixels from the shore
    dsea = distance_from(water, 12)           # distance of land pixels from the water

    # ---- paper ----------------------------------------------------------------------
    N1 = noise2(W, H, 18, 3, 3)
    N2 = noise2(W, H, 3, 9, 2)
    paper = .82 + (N1 - .5) * .12 + (N2 - .5) * .06
    c.rect(0, 0, W, H, 'e_parch', paper, dith=.6)

    # ---- sea: watercolour wash, darker along the shore, engraved coast lines ---------
    sea_l = .66 - .2 * np.exp(-dcoast / 6.0) + (N1 - .5) * .1 + (N2 - .5) * .05
    sea_l = sea_l + .04 * np.clip((yy - 60) / 120, 0, 1)
    c._apply(water, 'e_sea', sea_l, dith=.65)
    for dd, l in ((2, .3), (4, .42), (7, .5)):
        ring = water & (dcoast == dd)
        c._apply(ring, 'e_sea', l, dith=0)
    # ripple marks across open water (avoid the label bands)
    for y in range(16, 166, 6):
        off = (y // 6) % 2 * 5
        for x in range(off + 2, W - 4, 10):
            jx = x + int(rng.integers(-2, 3))
            jy = y + int(rng.integers(-1, 2))
            if 0 <= jy < H - 1 and 0 <= jx < W - 3 and water[jy, jx:jx + 4].all() and dcoast[jy, jx] > 9:
                c.put(jx, jy, 'e_sea', .78)
                c.put(jx + 1, jy - 1, 'e_sea', .82)
                c.put(jx + 2, jy, 'e_sea', .78)
                c.put(jx + 3, jy - 1, 'e_sea', .74)
    # the lamp's shimmer on the varnished water (moonlit harbour highlight)
    for y in range(100, 166, 3):
        for x in range(150, 312, 7):
            jx = x + int(rng.integers(-3, 4)) + (y % 2) * 3
            if 0 <= jx < W - 2 and water[y, jx:jx + 2].all() and dcoast[y, jx] > 4 and rng.random() < .55:
                c.put(jx, y, 'e_sea', .92)
                c.put(jx + 1, y, 'e_sea', .86)

    # ---- land: coastline ink, hill, parks ----------------------------------------------
    # the seawall below St. Brigid's: a dressed-stone wall with buttresses
    sw = thick_line_mask([(84, 31), (96, 36), (108, 38), (122, 39), (136, 38), (146, 34)], 2.4)
    sw &= (dcoast <= 2) & water | (land & (dsea <= 1) & thick_line_mask([(84, 31), (96, 36), (108, 38), (122, 39), (136, 38), (146, 34)], 3.0))
    coast = land & (dsea == 1)
    c._apply(coast, 'e_ink', np.full((H, W), .55, np.float32), dith=0)
    shore2 = land & (dsea == 2)
    c._apply(shore2, 'e_parch', paper * .82, dith=.4)
    c._apply(sw, 'concrete', np.full((H, W), .95, np.float32) - .22 * ((xx.astype(int) % 4) == 0), dith=0)
    c._apply(dilate4(sw) & ~sw & water, 'e_ink', np.full((H, W), .35, np.float32), dith=0)

    # Gull Hill: an irregular rise with hachured slopes, woods, the lawns of Halcyon on top
    HN = noise2(W, H, 9, 21, 2)
    rr = np.sqrt(((xx - 46) / 42) ** 2 + ((yy - 40) / 31) ** 2) + (HN - .5) * .38
    hill = (rr <= 1) & land
    height = np.clip(1 - rr, 0, 1)
    woods = hill & (noise2(W, H, 6, 33, 2) > .47) & (height < .62)
    lawn = hill & (height >= .62)
    c._apply(hill, 'e_green', .7 + (N1 - .5) * .1 + height * .12, dith=.6)
    c._apply(woods, 'e_green', .5 + (N2 - .5) * .12, dith=.6)
    c._apply(lawn, 'e_green', .84 + (N2 - .5) * .06, dith=.5)
    # form lines (dotted contours)
    for lev in (.2, .45):
        band = hill & (np.abs(height - lev) < .025) & (((xx + yy) % 2) == 0)
        c._apply(band, 'e_hill', np.full((H, W), .45, np.float32), dith=0)
    # hachures: short strokes running downhill, darker and denser on the lee (south-east) side
    gy_, gx_ = np.gradient(height)
    for gy in range(12, 76, 2):
        for gx in range(2, 92, 2):
            jx = gx + int(rng.integers(-1, 2))
            jy = gy + int(rng.integers(-1, 2))
            if not (0 <= jx < W and 0 <= jy < H) or not hill[jy, jx] or lawn[jy, jx] or woods[jy, jx]:
                continue
            vx, vy = -gx_[jy, jx], -gy_[jy, jx]
            n = math.hypot(vx, vy)
            if n < 1e-4:
                continue
            vx, vy = vx / n, vy / n
            lee = vx * .7 + vy * .7          # >0: facing away from the light
            dens = .3 + .4 * (lee > 0) + .2 * min(1.0, n * 30)
            if rng.random() > dens:
                continue
            lum = .3 if lee > .2 else .45 if lee > -.3 else .6
            for t in range(3):
                px_, py_ = int(round(jx + vx * t)), int(round(jy + vy * t))
                if 0 <= px_ < W and 0 <= py_ < H and hill[py_, px_] and not lawn[py_, px_]:
                    c.put(px_, py_, 'e_hill', lum)
    # trees in the woods
    for ty in np.arange(17, 75, 3.2):
        for tx in np.arange(5 + (int(ty) % 2) * 1.6, 92, 3.4):
            jx, jy = tx + rng.uniform(-.8, .8), ty + rng.uniform(-.8, .8)
            ix, iy = int(jx), int(jy)
            if 0 <= ix < W and 0 <= iy < H and woods[iy, ix] and dsea[iy, ix] > 2 and rng.random() < .85:
                tree(c, jx, jy, r=1.5, lum=.34 + rng.random() * .16)
    summit = lawn
    # the winding drive up to Halcyon House
    drive = [(50, 41), (46, 46), (52, 50), (47, 55), (55, 60), (64, 63), (74, 64)]
    dm = thick_line_mask(drive, 1.5) & land
    c._apply(dm, 'e_road', np.full((H, W), .88, np.float32), dith=0)

    # ---- streets & blocks -------------------------------------------------------------
    urban = poly_full(c, [(68, 44), (90, 40), (150, 40), (180, 34), (250, 34), (276, 54), (276, 120),
                          (262, 126), (200, 132), (150, 140), (120, 152), (100, 150), (70, 140), (56, 120),
                          (60, 80), (66, 60)]) & land & ~hill
    streets = np.zeros((H, W), bool)
    mains = np.zeros((H, W), bool)
    for x in range(64, 280, 15):
        streets |= thick_line_mask([(x, 30), (x + 4, 170)], 1.6)
    for y in range(46, 150, 12):
        streets |= thick_line_mask([(40, y - 2), (290, y + 3)], 1.6)
    # main roads (wider, washed in yellow ochre)
    main_roads = [
        [(176, 62), (181, 100), (188, 139)],                    # Commission Ave: City Hall -> Pier 4
        [(58, 84), (120, 86), (200, 88), (276, 92)],            # Broad Street
        [(128, 79), (156, 107), (190, 138)],                    # Marrow Street (diagonal)
        [(140, 146), (178, 136), (214, 133), (246, 129), (266, 124)],   # Harbor Street
        [(96, 40), (140, 37), (176, 30), (226, 31), (262, 41), (282, 60)],  # the Esplanade / seawall road
        [(50, 44), (58, 56), (72, 62), (88, 66), (110, 70), (140, 74)],      # Gull Hill Road
        [(124, 66), (118, 90), (110, 120), (104, 146)],                       # Church Street
        [(0, 92), (30, 90), (58, 84)],                                        # West Road
    ]
    for rd in main_roads:
        mains |= thick_line_mask(rd, 2.6)
    streets |= mains
    blocks = urban & ~streets & ~river
    # city blocks: rose wash + fine hatching, sepia ink outline
    block_l = .6 + (N1 - .5) * .1 + ((xx + yy) % 4 == 0) * -.08
    c._apply(blocks, 'e_rose', block_l, dith=.5)
    bedge = blocks & ~(EC.shift(blocks, 1, 0) & EC.shift(blocks, -1, 0) & EC.shift(blocks, 0, 1) & EC.shift(blocks, 0, -1))
    c._apply(bedge & ((xx + yy) % 1 == 0), 'e_rose', np.full((H, W), .38, np.float32), dith=0)
    # main roads: pale ochre with ink edges
    road_px = mains & land & ~river
    c._apply(road_px, 'e_road', np.full((H, W), .82, np.float32) + (N2 - .5) * .06, dith=.4)
    edges = dilate4(road_px) & ~road_px & blocks
    c._apply(edges, 'e_rose', np.full((H, W), .3, np.float32), dith=0)

    # parks: City Hall square, Mission garden, the cemetery
    parks = [
        poly_full(c, [(166, 62), (190, 62), (191, 72), (165, 72)]),
        poly_full(c, [(84, 42), (112, 42), (113, 59), (85, 60)]),
        poly_full(c, [(232, 104), (252, 104), (253, 114), (231, 114)]),
    ]
    for pk in parks:
        pk &= land
        c._apply(pk, 'e_green', .62 + (N2 - .5) * .1, dith=.5)
        ring = dilate4(pk) & ~pk & land
        c._apply(ring, 'e_ink', np.full((H, W), .5, np.float32), dith=0)
    # paths in City Hall square
    for p in line_px(166, 67, 190, 67) + line_px(178, 62, 178, 72):
        c.put(*p, 'e_road', .9)
    for (tx, ty) in ((170, 64), (186, 64), (170, 70), (186, 70), (236, 107), (248, 107), (242, 111),
                     (236, 112), (249, 112)):
        tree(c, tx, ty, r=1.3, lum=.5)

    # ---- West End: a looser grid of small residential blocks with gardens -------------
    lanes = [((2, 99), (60, 93)), ((4, 112), (62, 104)), ((14, 126), (68, 117))]
    for (a, b) in lanes:
        lm = thick_line_mask([a, b], 1.3) & land & ~hill
        c._apply(lm, 'e_road', np.full((H, W), .8, np.float32), dith=0)
    west = poly_full(c, [(0, 88), (60, 82), (66, 100), (72, 128), (56, 140), (30, 144), (0, 140)]) & land & ~hill
    for by in range(90, 142, 7):
        for bx in range(2, 72, 8):
            x = bx + int(rng.integers(0, 2)) + ((by // 7) % 2) * 3
            y = by + int(rng.integers(0, 2))
            w_, h_ = int(rng.integers(4, 7)), int(rng.integers(3, 5))
            if x + w_ >= W or y + h_ >= H:
                continue
            blk = np.zeros((H, W), bool)
            blk[y:y + h_, x:x + w_] = True
            if not (blk & ~west).any() and rng.random() < .8 and not (blk & river).any():
                c._apply(blk, 'e_rose', .62 + (N2 - .5) * .1, dith=.4)
                c._apply(dilate4(blk) & ~blk, 'e_rose', np.full((H, W), .36, np.float32), dith=0)
            elif west[y + 1, x + 1] and rng.random() < .5:
                tree(c, x + 2, y + 2, r=1.4, lum=.45)
    for (x, y) in [(18, 110), (24, 118), (8, 120), (14, 126), (30, 124), (38, 140), (60, 138), (24, 140),
                   (70, 132), (12, 92), (2, 104)]:
        if land[y, x]:
            tree(c, x, y, r=1.5, lum=.45)
    # the Brack: a bridge where the West Road crosses
    bm = thick_line_mask([(16, 122), (20, 131)], 3.0) & river
    c._apply(bm, 'e_road', np.full((H, W), .85, np.float32), dith=0)
    c._apply(dilate4(bm) & ~bm & river, 'e_ink', np.full((H, W), .4, np.float32), dith=0)
    # Point Park on the east headland: lawns, trees and the old battery
    pp = poly_full(c, [(278, 50), (296, 60), (304, 66), (300, 70), (286, 76), (276, 70)]) & land
    c._apply(pp, 'e_green', .66 + (N2 - .5) * .08, dith=.5)
    c._apply(dilate4(pp) & ~pp & land, 'e_ink', np.full((H, W), .5, np.float32), dith=0)
    for (tx, ty) in ((282, 58), (288, 66), (296, 64), (281, 68), (292, 70)):
        tree(c, tx, ty, r=1.4, lum=.45)
    with track(c) as hold:
        c.poly([(288, 58), (292, 56), (296, 59), (294, 63), (289, 63)], 'concrete', .72)
        c.put(292, 57, 'concrete', .95)
    outline(c, hold[0], lum=.35, shadow=False)

    # ---- rail line (black and white dashes, a classic map railway) -------------------------
    rail_px = polyline_px([(int(x), int(y)) for x, y in RAIL])
    for i, (x, y) in enumerate(rail_px):
        if 0 <= x < W and 0 <= y < H:
            c.put(x, y, 'e_ink', .3)
    for i in range(1, len(rail_px) - 1, 3):
        (xa, ya), (xb, yb) = rail_px[i - 1], rail_px[i + 1]
        tx_, ty_ = xb - xa, yb - ya
        n = math.hypot(tx_, ty_) or 1
        nx_, ny_ = -ty_ / n, tx_ / n
        x, y = rail_px[i]
        for sgn in (-1, 1):
            px_, py_ = int(round(x + nx_ * sgn)), int(round(y + ny_ * sgn))
            if 0 <= px_ < W and 0 <= py_ < H:
                c.put(px_, py_, 'e_ink', .45)
    # Union Station: a long train shed with a glass roof
    with track(c) as hold:
        facade(c, 122, 125, 138, 130, 'cream', .78, side=1)
        c.rect(122, 123, 138, 125, 'glass', .7, dith=0)
        for xx_ in range(123, 138, 2):
            c.put(xx_, 124, 'glass', .95)
        c.rect(128, 127, 131, 130, 'e_ink', .4)
        c.put(124, 127, 'e_window', .9, emis=.6)
        c.put(135, 127, 'e_window', .9, emis=.6)
    outline(c, hold[0])
    # goods yard sidings near the docks
    for k in range(3):
        for (x, y) in line_px(140, 132 + k * 2, 162, 136 + k):
            c.put(x, y, 'e_ink', .35)

    # ---- breakwater + lighthouse --------------------------------------------------------
    bw = thick_line_mask(BREAKWATER, 2.2)
    c._apply(bw & water, 'concrete', np.full((H, W), .7, np.float32), dith=0)
    c._apply(dilate4(bw) & ~bw & water, 'e_ink', np.full((H, W), .35, np.float32), dith=0)

    # ---- landmarks ------------------------------------------------------------------------
    marks = {}
    for name, fn in LANDMARKS.items():
        with track(c) as hold:
            fn(c)
        marks[name] = hold[0]
        outline(c, hold[0])

    # ---- small dressing: cranes, warehouses, boats ------------------------------------------
    dressing(c, water, rng)

    # ---- labels ---------------------------------------------------------------------------
    labels(c)

    # ---- compass rose + cartouche + border --------------------------------------------------
    compass(c, 296, 33)
    cartouche(c)
    border(c)

    # ---- lamplight ------------------------------------------------------------------------
    c.ambient = .64
    c.add_light(168, 92, 250, .48, falloff=1.2)
    c.add_light(55, 40, 110, .1, falloff=1.4)
    vx = np.abs(xx - 160) / 160
    vy = np.abs(yy - 90) / 90
    c.shade *= np.clip(1.08 - .26 * (vx ** 3 + vy ** 3), .68, 1)
    # the map has been folded in thirds and in half: soft creases
    for X in (107, 213):
        c.shade[:, X] *= .84
        c.shade[:, X + 1] *= 1.06
    c.shade[90, :] *= .86
    c.shade[91, :] *= 1.05
    # coffee ring left by a cup on the harbour (the map lives on Rook's desk)
    ring = (np.abs(np.sqrt((xx - 296) ** 2 + (yy - 146) ** 2) - 11) < .9)
    c.shade[ring & ((xx + yy) % 3 != 0)] *= .8
    img = c.render()
    save_png(img, out_path('ui', 'map.png'))
    return img


# ------------------------------------------------------------------ landmark painters ------
def lm_halcyon(c):
    # Halcyon House: a grim white Victorian sanatorium on the summit, with a cupola tower,
    # two wings, a walled garden and the gate on the drive.
    x, y = 50, 36
    c.rect(36, 37, 65, 40, 'concrete', .55, dith=.3)                     # terrace / wall
    for xx_ in range(37, 65, 3):
        c.put(xx_, 37, 'concrete', .8)
    facade(c, 37, 29, 46, 37, 'white', .8)                                # west wing
    facade(c, 55, 29, 63, 37, 'white', .74, side=2)                        # east wing
    facade(c, 44, 25, 57, 37, 'white', .9, side=2)                         # main block
    c.poly([(36, 29), (41, 26), (47, 29)], 'slate', .55)                  # roofs
    c.poly([(54, 29), (59, 26), (65, 29)], 'slate', .45)
    c.poly([(43, 25), (50, 20), (58, 25)], 'slate', .5)
    c.rect(48, 15, 53, 21, 'white', .85, dith=.2)                         # cupola tower
    c.poly([(47, 15), (50, 11), (54, 15)], 'slate', .6)
    c.put(50, 10, 'e_ink', .5)                                            # finial
    c.put(50, 17, 'e_window', .9, emis=.7)
    windows(c, 38, 31, 45, 36, dx=2, dy=3, seed=1, frac=.15)
    windows(c, 45, 27, 56, 36, dx=2, dy=3, seed=2, frac=.2, lit={(49, 30)})
    windows(c, 56, 31, 63, 36, dx=2, dy=3, seed=3, frac=.15)
    c.rect(49, 33, 52, 37, 'e_ink', .45)                                   # door
    # dark poplars flanking the house
    for px_ in (34, 66):
        c.ellipse(px_, 30, 1.6, 5, 'e_green', .35, dith=.2)
        c.put(px_ - 1, 27, 'e_green', .6)


def lm_cemetery(c):
    # St. Brigid's graveyard: railings, headstones, crosses, a stone angel and a yew
    for (x, y) in ((88, 45), (92, 47), (96, 44), (101, 46), (105, 44), (108, 48), (89, 51), (93, 53),
                   (104, 52), (108, 55), (91, 56), (97, 57), (103, 57)):
        c.rect(x, y, x + 2, y + 3, 'concrete', .8, dith=0)
        c.put(x, y, 'concrete', .95)
        c.put(x + 1, y + 2, 'concrete', .45)
    for (x, y) in ((99, 50), (95, 49), (106, 50), (87, 54)):
        c.vline(x, y - 2, y + 2, 'white', .85)
        c.hline(x - 1, x + 2, y - 1, 'white', .85)
    # stone angel on a plinth
    c.rect(97, 52, 100, 55, 'concrete', .7, dith=0)
    c.rect(98, 49, 99, 52, 'white', .9)
    c.put(97, 50, 'white', .75)
    c.put(100, 50, 'white', .75)
    c.put(98, 48, 'white', .95)
    # yew trees
    for (x, y) in ((86, 47), (110, 52), (94, 59)):
        c.ellipse(x, y, 2, 2.4, 'e_green', .32, dith=.2)
        c.put(x - 1, y - 1, 'e_green', .6)


def lm_mission(c):
    # St. Brigid's church: nave, tall spire; the low mission hall beside it
    facade(c, 116, 56, 130, 65, 'concrete', .72, side=2)                  # nave
    c.poly([(115, 56), (123, 51), (132, 56)], 'slate', .45)              # nave roof
    facade(c, 119, 43, 124, 57, 'concrete', .82, side=1)                 # tower
    c.poly([(118, 43), (121, 31), (125, 43)], 'slate', .55)              # spire
    c.put(121, 30, 'brass', .9)
    c.put(121, 29, 'brass', .7)
    c.put(121, 46, 'e_window', .85, emis=.7)                              # belfry light
    for xw in (118, 122, 126):
        c.rect(xw, 58, xw + 1, 62, 'e_window', .75, emis=.5)              # lancet windows
    c.ellipse(127, 52, 1.1, 1.1, 'e_window', .7, emis=.5)                # rose window
    c.rect(122, 61, 125, 65, 'e_ink', .4)                                 # door
    # the mission hall with its soup-kitchen lamp
    facade(c, 132, 59, 141, 66, 'e_rose', .75, side=1)
    c.poly([(131, 59), (136, 56), (143, 59)], 'slate', .4)
    windows(c, 133, 61, 140, 65, dx=2, dy=3, seed=7, frac=.6)
    c.put(137, 64, 'e_window', .95, emis=.8)


def lm_cityhall(c):
    # City Hall: colonnaded block with a tall clock tower (clock face lit)
    facade(c, 164, 48, 189, 61, 'cream', .82, side=2)
    c.rect(163, 46, 190, 48, 'cream', .95, dith=0)                        # cornice
    for xc in range(165, 189, 3):
        c.vline(xc, 50, 60, 'cream', .62)                                 # columns
    c.rect(164, 60, 190, 62, 'cream', .6, dith=0)                         # steps
    c.poly([(173, 46), (177, 43), (181, 46)], 'cream', .7)
    facade(c, 172, 30, 182, 47, 'cream', .88, side=2)                     # tower
    c.poly([(171, 30), (177, 22), (183, 30)], 'slate', .55)              # tower roof
    c.vline(177, 18, 23, 'e_ink', .5)
    c.put(177, 17, 'brass', .9)
    c.ellipse(177, 35, 3.2, 3.2, 'paper', .98, emis=.8, dith=0)            # clock face
    c.line(177, 35, 177, 33, 'e_ink', .3)
    c.line(177, 35, 179, 36, 'e_ink', .3)
    c.put(177, 35, 'e_ink', .2)
    windows(c, 166, 51, 188, 58, dx=3, dy=4, seed=11, frac=.3)
    for yw in (41, 44):
        c.put(175, yw, 'e_window', .8, emis=.5)
        c.put(179, yw, 'e_window', .8, emis=.5)
    c.glow(177, 35, 6, '#ffe2a0', .35)


def lm_commission(c):
    # Harbor Commission: classical portico, dome with a flagstaff
    facade(c, 203, 59, 225, 71, 'tile', .8, side=2)
    c.poly([(202, 59), (214, 52), (227, 59)], 'tile', .92)                # pediment
    c.poly([(205, 58), (214, 54), (224, 58)], 'tile', .6)
    for xc in range(205, 225, 3):
        c.vline(xc, 60, 70, 'tile', .55)
    c.ellipse(214, 50, 4, 3, 'e_sea', .6)                                 # copper-green dome
    c.put(212, 49, 'e_sea', .9)
    c.vline(214, 42, 48, 'e_ink', .45)
    c.rect(215, 42, 219, 45, 'red', .7)                                   # flag
    c.put(215, 42, 'red', .9)
    windows(c, 206, 62, 224, 69, dx=3, dy=4, seed=13, frac=.35)
    c.rect(212, 66, 216, 71, 'e_ink', .4)


def lm_precinct(c):
    # 1st Precinct: solid brick station house, blue police lamps at the door
    facade(c, 142, 72, 159, 84, 'brick', .78, side=2)
    c.rect(141, 70, 161, 72, 'concrete', .7, dith=0)
    windows(c, 143, 74, 159, 82, dx=3, dy=3, seed=17, frac=.45)
    c.rect(148, 79, 152, 84, 'e_ink', .4)
    for xl in (147, 153):
        c.put(xl, 78, 'neonblue', 1.0, emis=1)
    c.glow(147, 78, 5, '#4a8cff', .45)
    c.glow(153, 78, 5, '#4a8cff', .45)
    c.vline(150, 64, 70, 'e_ink', .45)                                    # flagpole
    c.rect(151, 64, 154, 66, 'neonblue', .55)


def lm_gazette(c):
    # Brackwater Gazette: printing works with a roof billboard and a press chimney
    facade(c, 108, 90, 124, 101, 'brick', .7, side=2)
    c.rect(107, 88, 126, 90, 'concrete', .6, dith=0)
    c.rect(110, 82, 122, 87, 'paper', .95, dith=0)                       # rooftop sign board
    c.vline(111, 87, 89, 'e_ink', .4)
    c.vline(121, 87, 89, 'e_ink', .4)
    for xs in range(111, 121, 2):
        c.put(xs, 84, 'e_ink', .25)                                        # 'GAZETTE' lettering
        c.put(xs + 1, 85, 'e_ink', .35)
    c.rect(123, 79, 125, 88, 'brick', .55)                                # chimney
    c.put(124, 78, 'fog', .9)
    c.put(125, 76, 'fog', .8)
    c.put(124, 74, 'fog', .7)
    windows(c, 110, 92, 123, 100, dx=3, dy=3, seed=19, frac=.55)


def lm_pharmacy(c):
    # Kessler's Pharmacy: corner shop with a green show-globe and a mortar sign
    facade(c, 79, 106, 93, 117, 'tile', .78, side=2)
    c.poly([(78, 106), (86, 101), (96, 106)], 'slate', .45)
    c.rect(80, 110, 92, 114, 'glass', .6)                                 # shop window
    c.rect(80, 109, 93, 110, 'e_green', .7, dith=0)                       # awning
    c.ellipse(90, 112, 1.5, 1.5, 'e_green', .95, emis=.8)                 # green show globe
    c.glow(90, 112, 5, '#7cff8a', .4)
    c.rect(84, 113, 86, 117, 'e_ink', .4)
    # hanging mortar & pestle sign
    c.hline(93, 97, 106, 'e_ink', .4)
    c.ellipse(96, 108, 1.4, 1.1, 'brass', .85)
    c.put(97, 106, 'brass', .9)


def lm_office(c):
    # 14 Marrow St: a narrow three-storey brick building; one window lit on the 2nd floor
    facade(c, 150, 93, 160, 106, 'brick', .7, side=2)
    c.rect(149, 92, 162, 93, 'concrete', .65, dith=0)
    windows(c, 151, 95, 159, 105, dx=3, dy=3, seed=23, frac=0)
    c.rect(151, 98, 153, 100, 'e_window', .95, emis=.9)                   # Rook's office window
    c.glow(152, 99, 6, '#ffc870', .45)
    c.rect(154, 103, 156, 106, 'e_ink', .4)
    c.vline(161, 88, 92, 'e_ink', .4)                                     # fire escape / chimney
    c.put(161, 87, 'concrete', .7)


def lm_hask(c):
    # Hask's Lock & Key: shopfront under the office, with a big gilded key sign
    facade(c, 162, 113, 174, 121, 'wood', .8, side=1)
    c.rect(163, 115, 172, 118, 'glass', .55)
    c.rect(162, 112, 175, 113, 'red', .65, dith=0)                        # awning stripe
    c.hline(174, 179, 111, 'e_ink', .4)
    # the key: bow ring + shank + bit
    c.ellipse(170.5, 108.5, 1.7, 1.7, 'e_gold', .95)
    c.put(170, 108, 'e_ink', .3)
    c.hline(172, 178, 108, 'e_gold', .9)
    c.put(176, 109, 'e_gold', .7)
    c.put(177, 109, 'e_gold', .6)
    c.put(178, 109, 'e_gold', .7)


def lm_hotel(c):
    # Hotel Sorrento: a tall narrow hotel with a vertical red neon sign
    facade(c, 194, 90, 209, 112, 'e_rose', .72, side=2)
    c.rect(193, 88, 211, 90, 'concrete', .65, dith=0)
    c.rect(197, 85, 206, 88, 'concrete', .5)                              # water tank / roof
    windows(c, 196, 92, 208, 110, dx=3, dy=3, seed=29, frac=.3)
    c.rect(200, 108, 203, 112, 'e_ink', .4)
    # vertical neon sign on the left corner
    c.rect(191, 92, 193, 104, 'neonred', .95, emis=1, dith=0)
    for yy_ in range(93, 104, 2):
        c.put(192, yy_, 'neonred', .6, emis=1)
    c.glow(192, 98, 9, '#ff4050', .5)


def lm_bellwether(c):
    # Bellwether Apartments: a wide four-storey block, rows of windows, rooftop water tower
    facade(c, 233, 84, 255, 99, 'brick', .74, side=2)
    c.rect(232, 82, 257, 84, 'concrete', .65, dith=0)
    windows(c, 235, 86, 254, 98, dx=3, dy=3, seed=31, frac=.4)
    c.rect(242, 95, 246, 99, 'e_ink', .4)
    c.rect(249, 76, 253, 80, 'wood', .55)                                 # water tower
    c.poly([(248, 76), (251, 73), (254, 76)], 'wood', .4)
    c.vline(249, 80, 82, 'e_ink', .4)
    c.vline(253, 80, 82, 'e_ink', .4)


def lm_lantern(c):
    # The Blue Lantern: low club on Harbor Street, blue lantern sign glowing
    facade(c, 218, 123, 234, 133, 'brick', .62, side=2)
    c.rect(217, 121, 236, 123, 'concrete', .55, dith=0)
    c.rect(219, 126, 233, 130, 'neonblue', .5, emis=.4)                   # glowing windows
    c.rect(225, 129, 228, 133, 'e_ink', .4)
    c.hline(232, 238, 120, 'e_ink', .4)
    c.ellipse(237, 123, 1.6, 2.2, 'neonblue', .95, emis=1)                # the lantern
    c.put(237, 120, 'e_ink', .4)
    c.glow(237, 123, 8, '#3f88ff', .6)
    c.glow(226, 128, 9, '#3f88ff', .3)


def lm_pier9(c):
    # Pier 9: long timber pier, the cold store and sheds on it, the burnt hulk of the Meridian
    c.rect(259, 128, 268, 168, 'wood', .62, dith=.2)                      # pier deck
    for yp in range(130, 168, 2):
        c.hline(259, 268, yp, 'wood', .48)
    for yp in range(131, 168, 6):
        c.put(258, yp, 'wood', .3)
        c.put(268, yp, 'wood', .3)
    facade(c, 258, 133, 268, 143, 'concrete', .82, side=1)               # cold store
    c.poly([(257, 133), (263, 129), (270, 133)], 'slate', .5)
    c.put(262, 138, 'e_window', .8, emis=.6)
    facade(c, 259, 148, 267, 154, 'rust', .7, side=1)                     # shed
    c.poly([(258, 148), (263, 145), (268, 148)], 'rust', .45)
    # the Meridian: a burnt-out hull alongside, listing, her ribs showing through the plates
    hull = [(271, 149), (293, 146), (297, 149), (293, 156), (275, 157), (272, 154)]
    c.poly(hull, 'rust', .32)
    c.poly([(273, 151), (293, 148), (295, 150), (291, 154), (276, 155)], 'black', .5)    # gutted interior
    for xr in range(275, 294, 3):
        c.vline(xr, 147, 154, 'rust', .55)                                # charred ribs
        c.put(xr, 146, 'rust', .7)
    c.line(271, 149, 293, 146, 'rust', .62)                               # scorched gunwale
    c.rect(281, 140, 283, 147, 'black', .5)                               # stub of the funnel
    c.put(281, 140, 'rust', .6)
    c.line(286, 145, 289, 139, 'black', .5)                               # a fallen derrick
    c.put(278, 153, 'rust', .7)


def lm_pier4(c):
    # Pier 4: pier with a dockside crane and the MV Calypso moored alongside
    c.rect(189, 140, 198, 170, 'wood', .62, dith=.2)
    for yp in range(142, 170, 2):
        c.hline(189, 198, yp, 'wood', .48)
    # the Calypso: black hull, white superstructure, red funnel band
    hull = [(199, 150), (231, 149), (236, 153), (231, 160), (201, 161), (199, 158)]
    c.poly(hull, 'slate', .4)
    c.hline(200, 232, 150, 'slate', .75)
    c.hline(201, 230, 157, 'red', .45)
    facade(c, 217, 145, 226, 150, 'white', .85, side=1)                   # bridge house
    windows(c, 218, 146, 226, 148, dx=2, dy=2, seed=37, frac=.7)
    c.rect(220, 140, 223, 145, 'slate', .3)                               # funnel
    c.rect(220, 141, 223, 142, 'red', .7)
    c.vline(205, 143, 150, 'e_ink', .45)                                  # foremast + derrick
    c.hline(204, 207, 145, 'e_ink', .45)
    c.line(206, 146, 210, 150, 'e_ink', .6)
    c.vline(229, 144, 149, 'e_ink', .45)                                  # mainmast
    c.rect(207, 151, 214, 155, 'oak', .6)                                 # deck cargo
    c.rect(209, 151, 211, 152, 'oak', .8)
    c.put(234, 153, 'e_window', .9, emis=.8)                              # stern light
    # dockside crane on the pier root
    c.rect(190, 136, 193, 140, 'rust', .6)
    c.line(191, 136, 199, 128, 'rust', .7)
    c.line(192, 137, 200, 129, 'rust', .5)
    c.vline(200, 129, 135, 'e_ink', .4)
    c.put(200, 135, 'steel', .7)


LANDMARKS = {
    'halcyon': lm_halcyon, 'cemetery': lm_cemetery, 'mission': lm_mission, 'cityhall': lm_cityhall,
    'commission': lm_commission, 'precinct': lm_precinct, 'gazette': lm_gazette, 'pharmacy': lm_pharmacy,
    'office': lm_office, 'hask': lm_hask, 'hotel': lm_hotel, 'bellwether': lm_bellwether,
    'lantern': lm_lantern, 'pier9': lm_pier9, 'pier4': lm_pier4,
}


# ------------------------------------------------------------------ dressing --------------
def dressing(c, water, rng):
    # warehouses along the waterfront
    for (x, y, w, h) in ((236, 128, 10, 5), (248, 125, 8, 5), (170, 137, 9, 4), (156, 141, 9, 4),
                         (140, 147, 9, 4)):
        with track(c) as hold:
            facade(c, x, y, x + w, y + h, 'concrete', .7, side=1)
            c.poly([(x - 1, y), (x + w // 2, y - 2), (x + w + 1, y)], 'slate', .45)
        outline(c, hold[0], shadow=False)
    # harbour cranes (silhouettes) on the quays
    for (x, y, d) in ((247, 121, 1), (176, 133, -1)):
        with track(c) as hold:
            c.rect(x, y, x + 2, y + 6, 'rust', .55)
            c.line(x + 1, y, x + 1 + 7 * d, y - 6, 'rust', .7)
            c.vline(x + 1 + 7 * d, y - 6, y - 2, 'e_ink', .4)
        outline(c, hold[0], shadow=False, lum=.3)
    # lighthouse at the end of the breakwater
    with track(c) as hold:
        c.rect(311, 104, 314, 111, 'white', .9)
        c.hline(311, 314, 107, 'red', .7)
        c.rect(311, 102, 314, 104, 'e_window', 1.0, emis=1)
        c.put(312, 101, 'e_ink', .4)
    outline(c, hold[0], shadow=False)
    c.glow(312, 103, 10, '#ffe2a0', .5)
    # small craft: a tug and fishing boats
    for (x, y) in ((134, 146), (240, 150), (286, 110), (226, 162), (60, 156)):
        with track(c) as hold:
            c.poly([(x, y), (x + 7, y), (x + 6, y + 2), (x + 1, y + 2)], 'wood', .55)
            c.rect(x + 3, y - 2, x + 5, y, 'white', .8)
        outline(c, hold[0], shadow=False, lum=.3)
        c.put(x - 2, y + 1, 'e_sea', .85)
        c.put(x - 4, y + 1, 'e_sea', .8)


def labels(c):
    micro_label(c, 24, 66, 'GULL', lum=.25, ramp='e_hill')
    micro_label(c, 24, 72, 'HILL', lum=.25, ramp='e_hill')
    micro_label(c, 240, 15, 'BRACKWATER SOUND', lum=.36, ramp='e_sea', spacing=1)
    micro_label(c, 298, 124, 'OUTER', lum=.38, ramp='e_sea')
    micro_label(c, 298, 130, 'HARBOUR', lum=.38, ramp='e_sea')
    micro_label(c, 160, 161, 'INNER HARBOUR', lum=.38, ramp='e_sea')
    micro_label(c, 100, 160, 'BRACK ESTUARY', lum=.38, ramp='e_sea')
    micro_label(c, 102, 26, 'SEAWALL', lum=.4, ramp='e_sea')
    micro_label(c, 92, 74, 'OLD TOWN', lum=.5, ramp='e_ink')
    micro_label(c, 248, 50, 'DOWNTOWN', lum=.5, ramp='e_ink')
    micro_label(c, 28, 84, 'WEST END', lum=.45, ramp='e_ink')
    micro_label(c, 286, 44, 'THE POINT', lum=.42, ramp='e_ink')


def compass(c, cx, cy):
    with track(c) as hold:
        c.ellipse(cx, cy, 9.5, 9.5, 'e_parch', .9, dith=0)
        ring = None
        # 16-point star: long N/S/E/W points, short diagonals
        for ang, L, wdt in ((-90, 11, 2.2), (90, 9, 2.2), (0, 9, 2.2), (180, 9, 2.2),
                            (-45, 6, 1.6), (45, 6, 1.6), (135, 6, 1.6), (-135, 6, 1.6)):
            a = math.radians(ang)
            tipx, tipy = cx + math.cos(a) * L, cy + math.sin(a) * L
            px_, py_ = -math.sin(a) * wdt, math.cos(a) * wdt
            # two halves: lit half / shaded half
            c.poly([(cx, cy), (cx + px_, cy + py_), (tipx, tipy)], 'e_ink', .3, dith=0)
            c.poly([(cx, cy), (cx - px_, cy - py_), (tipx, tipy)], 'e_parch', .95, dith=0)
        c.put(cx, cy, 'red', .7)
    ring = (lambda: None)
    # outer ring
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32) + .5
    d = np.sqrt((xx - cx - .5) ** 2 + (yy - cy - .5) ** 2)
    rm = (np.abs(d - 9.5) < .55)
    c._apply(rm, 'e_ink', np.full((H, W), .4, np.float32), dith=0)
    micro_text(c, cx, cy - 18, 'N', 'e_ink', .3, align='center')


def cartouche(c):
    # bottom-left: framed title cartouche with a scale bar
    x0, y0, x1, y1 = 5, 145, 68, 166
    with track(c) as hold:
        c.rect(x0, y0, x1, y1, 'e_parch', .93, dith=.3)
        c.rect(x0 + 2, y0 + 2, x1 - 2, y0 + 3, 'e_ink', .45, dith=0)
        c.rect(x0 + 2, y1 - 3, x1 - 2, y1 - 2, 'e_ink', .45, dith=0)
        c.rect(x0 + 2, y0 + 2, x0 + 3, y1 - 2, 'e_ink', .45, dith=0)
        c.rect(x1 - 3, y0 + 2, x1 - 2, y1 - 2, 'e_ink', .45, dith=0)
        cx = (x0 + x1) // 2
        micro_text(c, cx, y0 + 5, 'BRACKWATER', 'e_redink', .55, align='center', spacing=1)
        c.hline(cx - 14, cx + 15, y0 + 11, 'e_ink', .6)
        # scale bar: alternating blocks
        sx = x0 + 7
        for k in range(4):
            if k % 2 == 0:
                c.rect(sx + k * 8, y0 + 13, sx + k * 8 + 8, y0 + 15, 'e_ink', .25, dith=0)
            else:
                c.rect(sx + k * 8, y0 + 13, sx + k * 8 + 8, y0 + 15, 'e_parch', .98, dith=0)
                c.hline(sx + k * 8, sx + k * 8 + 8, y0 + 12, 'e_ink', .25)
                c.hline(sx + k * 8, sx + k * 8 + 8, y0 + 15, 'e_ink', .25)
        c.vline(sx + 32, y0 + 12, y0 + 16, 'e_ink', .25)
        micro_text(c, sx + 36, y0 + 12, '1 MI', 'e_ink', .4)
    outline(c, hold[0], lum=.25)
    # ornaments at the corners
    for (x, y) in ((x0, y0), (x1 - 1, y0), (x0, y1 - 1), (x1 - 1, y1 - 1)):
        c.put(x, y, 'e_redink', .6)


def border(c):
    # neatline: thin double rule just inside the paper edge, plus a worn dark margin
    for (x0, y0, x1, y1, l) in ((0, 0, W, 1, .2), (0, H - 1, W, H, .2), (0, 0, 1, H, .2), (W - 1, 0, W, H, .2)):
        c.rect(x0, y0, x1, y1, 'e_ink', l, dith=0)
    for (x0, y0, x1, y1) in ((2, 2, W - 2, 3), (2, H - 3, W - 2, H - 2), (2, 2, 3, H - 2), (W - 3, 2, W - 2, H - 2)):
        c.rect(x0, y0, x1, y1, 'e_ink', .45, dith=0)
