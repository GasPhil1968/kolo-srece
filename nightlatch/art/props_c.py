"""Group C helpers (gazette, darkroom, precinct, holding_cell, mission, cemetery).

* `c_*` ramps
* a tiny variable-width pixel font (`text`, `text_w`)
* `SceneC`: Scene that (a) renders base state objects with the base render kwargs (needed for
  the darkroom's safelight remap) and (b) also exports per-variant anim strips
  (`anim_<name>_<variant>.png`, listed in meta['anims'][name]['variants']).
* `Layer`: pixels that differ between variants (window views, lamps on/off).  The base look is
  painted normally; the variant look is painted into a scratch canvas and swapped in by the
  variant function only where the base pixels are still visible.
* `snapshot` / `restore`: re-paint a region as it was earlier (used by state objects that must
  "erase" something, e.g. an opened cell door or a moved stool).
* `check(sc)`: validates walk points / points against the walkable polygons.
* shared props (lamps, clocks, desks, typewriters, cabinets, glass partitions, fog, crows...).
"""
from __future__ import annotations

import copy
import math
import os

import numpy as np

from core import Canvas, ramp, noise2, vgrad, hgrad, radial, save_png, BAYER4
from scene import Scene
from persp import Persp

# --------------------------------------------------------------------------- ramps ----
ramp('c_mint', '#0d1513', '#152320', '#1f322c', '#2a4339', '#365546', '#446853', '#557b62', '#6a8f73',
     '#82a386', '#9eb99c')
ramp('c_lino', '#121110', '#1c1915', '#27221c', '#332c24', '#40372c', '#4f4436', '#605241', '#73624d',
     '#87735a')
ramp('c_cork', '#1e1209', '#2f1d0f', '#432a16', '#5a391d', '#714a26', '#895c31', '#a2703e', '#b9864f',
     '#cc9d66')
ramp('c_amberglass', '#0f0604', '#1d0c06', '#2f1408', '#441d0b', '#5b280e', '#743512', '#8f4418',
     '#ab5821', '#c7722f')
ramp('c_stone', '#121514', '#1c201e', '#272c29', '#343a36', '#424944', '#525953', '#636a63', '#767c74',
     '#8b9087', '#a3a69c')
ramp('c_moss', '#0e1208', '#18200c', '#232f11', '#2f3f17', '#3c4f1e', '#4b6026', '#5c7230', '#70853c')
ramp('c_mud', '#0e0806', '#180e09', '#24150d', '#311d11', '#3f2616', '#4e301c', '#5f3b23', '#71482b')
ramp('c_chrys', '#2b0f04', '#4a1c06', '#6e2d09', '#93420d', '#b65a12', '#d4761c', '#eb9a2e', '#f8c04f',
     '#ffe08a')
ramp('c_ruby', '#1c0306', '#3a060c', '#5e0b14', '#86121d', '#ad1d28', '#d03237', '#ea5a4f', '#fb8e78')
ramp('c_cobalt', '#050a24', '#0a1541', '#102163', '#183287', '#2448ab', '#3762cb', '#5584e3', '#80aef2')
ramp('c_amber', '#2a1403', '#4a2606', '#6f3b0a', '#975410', '#bd6f17', '#dc8f24', '#f0b23e', '#fbd572')
ramp('c_emerald', '#04140a', '#082513', '#0e3a1e', '#155129', '#1e6a36', '#2a8545', '#3fa158', '#62bd73')
ramp('c_violet', '#120720', '#200d38', '#311552', '#441f6d', '#5a2c88', '#733ea3', '#9058bd', '#b07ed4')
ramp('c_iron', '#07080a', '#0e1013', '#16181c', '#1f2226', '#2a2c30', '#36373a', '#454341', '#57524b',
     '#6d655a')
ramp('c_sky', '#3b4652', '#4d5966', '#616d79', '#76828d', '#8c97a1', '#a3acb4', '#bac1c7', '#d1d6da',
     '#e6e9eb')
ramp('c_frost', '#28323a', '#38444d', '#4a5761', '#5d6b75', '#717f89', '#87949c', '#9eaab0', '#b6c0c4',
     '#cdd5d7')
ramp('c_jade', '#07140e', '#0c2216', '#123220', '#18432b', '#1f5537', '#286844', '#337c52', '#429161',
     '#57a873')
ramp('c_navy', '#07090f', '#0c111c', '#121a2a', '#19243a', '#21304b', '#2b3d5e', '#374c71', '#465e86')
ramp('c_plaster', '#24211d', '#36312b', '#4a443b', '#5f574c', '#756c5e', '#8c8271', '#a49985', '#bbb19b',
     '#d1c8b1', '#e4dcc6')
ramp('c_ember', '#1a0402', '#360804', '#5a1006', '#841c08', '#ad2f0b', '#d24a12', '#ec7322', '#fba146',
     '#ffd08a')
ramp('c_steam', '#4d5156', '#5e6267', '#707479', '#83878b', '#979a9d', '#abadaf', '#c0c1c2', '#d4d5d5')
ramp('c_bark', '#0a0907', '#13110d', '#1d1a14', '#28231b', '#332d23', '#3f382c', '#4c4436')
ramp('c_crow', '#030304', '#08080b', '#0f0f14', '#17171e', '#22222b', '#2e2f3a')
ramp('c_greasered', '#2a0405', '#4a080a', '#6e0e10', '#941517', '#b51e1e', '#cf2b26', '#e2402f')
ramp('c_clay', '#1e1407', '#33230c', '#4b3612', '#644a19', '#7d5f22', '#97752d', '#ae8b3a', '#c3a04a', '#d6b65f')
ramp('c_tan', '#1b140d', '#2a2015', '#3b2d1e', '#4d3b27', '#604a31', '#745a3c', '#896b48', '#9f7d55',
     '#b59163')

# --------------------------------------------------------------------------- font ----
_G = {
    'A': ".#.|#.#|###|#.#|#.#", 'B': "##.|#.#|##.|#.#|##.", 'C': ".##|#..|#..|#..|.##",
    'D': "##.|#.#|#.#|#.#|##.", 'E': "###|#..|##.|#..|###", 'F': "###|#..|##.|#..|#..",
    'G': ".##|#..|#.#|#.#|.##", 'H': "#.#|#.#|###|#.#|#.#", 'I': "###|.#.|.#.|.#.|###",
    'J': "..#|..#|..#|#.#|.#.", 'K': "#.#|#.#|##.|#.#|#.#", 'L': "#..|#..|#..|#..|###",
    'M': "#...#|##.##|#.#.#|#...#|#...#", 'N': "#..#|##.#|#.##|#..#|#..#", 'O': "###|#.#|#.#|#.#|###",
    'P': "##.|#.#|##.|#..|#..", 'Q': ".#.|#.#|#.#|##.|.##", 'R': "##.|#.#|##.|#.#|#.#",
    'S': ".##|#..|.#.|..#|##.", 'T': "###|.#.|.#.|.#.|.#.", 'U': "#.#|#.#|#.#|#.#|###",
    'V': "#.#|#.#|#.#|#.#|.#.", 'W': "#...#|#...#|#.#.#|##.##|#...#", 'X': "#.#|#.#|.#.|#.#|#.#",
    'Y': "#.#|#.#|.#.|.#.|.#.", 'Z': "###|..#|.#.|#..|###",
    '0': ".#.|#.#|#.#|#.#|.#.", '1': ".#.|##.|.#.|.#.|###", '2': "##.|..#|.#.|#..|###",
    '3': "##.|..#|.#.|..#|##.", '4': "#.#|#.#|###|..#|..#", '5': "###|#..|##.|..#|##.",
    '6': ".##|#..|##.|#.#|.#.", '7': "###|..#|.#.|.#.|.#.", '8': ".#.|#.#|.#.|#.#|.#.",
    '9': ".#.|#.#|.##|..#|##.",
    '.': ".|.|.|.|#", ',': ".|.|.|#|#", "'": "#|#|.|.|.", '"': "#.#|#.#|...|...|...",
    '=': "...|###|...|###|...", '-': "...|...|###|...|...", ':': ".|#|.|#|.", '/': "..#|..#|.#.|#..|#..",
    '!': "#|#|#|.|#", '?': "##.|..#|.#.|...|.#.", ' ': "..|..|..|..|..", '#': "#.#|###|#.#|###|#.#",
    '&': ".#.|#.#|.#.|#.#|.##", '+': "...|.#.|###|.#.|...", '(': ".#|#.|#.|#.|.#", ')': "#.|.#|.#|.#|#.",
    '*': "#.#|.#.|#.#|...|...", '%': "#.#|..#|.#.|#..|#.#",
}
FONT = {k: v.split('|') for k, v in _G.items()}


def text_w(s: str, sp: int = 1, scale: int = 1) -> int:
    w = 0
    for ch in s:
        g = FONT.get(ch.upper(), FONT['?'])
        w += (len(g[0]) + sp) * scale
    return w - sp * scale


def text(c: Canvas, x, y, s: str, ramp_name: str, lum, emis=0.0, sp=1, scale=1, jitter=0, seed=0,
         mirror=False, slant=0.0, thick=0.0, lum_fn=None):
    """Draw text with its top-left at (x, y).  jitter: random +-px per glyph (handwriting);
    slant: y offset per px of x (rising/falling lines); thick: chance of a doubled pixel."""
    rng = np.random.default_rng(seed)
    glyphs = [FONT.get(ch.upper(), FONT['?']) for ch in s]
    if mirror:
        glyphs = [[row[::-1] for row in g] for g in glyphs[::-1]]
    cx = x
    for g in glyphs:
        gw = len(g[0])
        dy = int(rng.integers(-jitter, jitter + 1)) if jitter else 0
        dx = int(rng.integers(0, 2)) if jitter > 1 else 0
        for r, row in enumerate(g):
            for k, v in enumerate(row):
                if v != '#':
                    continue
                px = cx + k * scale + dx
                py = y + r * scale + dy + int(round(slant * (cx - x)))
                L = lum_fn(px, py) if lum_fn else lum
                for a in range(scale):
                    for b in range(scale):
                        c.put(px + a, py + b, ramp_name, L, emis)
                if thick and rng.random() < thick:
                    c.put(px + scale, py, ramp_name, L * .92, emis)
        cx += (gw + sp) * scale
    return cx


# ------------------------------------------------------------------------ SceneC ----
class SceneC(Scene):
    """Scene with base-kwargs for state objects and per-variant anim strips."""

    def export(self, variants=None, base_kw=None):
        self._vfns = dict(variants or {})
        self._base_kw = dict(base_kw or {})
        return super().export(variants=variants, base_kw=base_kw)

    def _export_objects(self, c, bg, folder, variant, vfn=None):
        if not variant and vfn is None:
            if getattr(self, 'base_state_fn', None):
                vfn = self.base_state_fn
            elif getattr(self, '_base_kw', None):
                kw = dict(self._base_kw)
                vfn = (lambda cc: dict(kw))
        return super()._export_objects(c, bg, folder, variant, vfn=vfn)

    def _export_anims(self, folder, bg_kw):
        super()._export_anims(folder, bg_kw)
        for (name, fns, fps, depth) in getattr(self, 'anims_src', []):
            a = self.meta['anims'].get(name)
            if not a:
                continue
            x0, y0, fw, fh = a['x'], a['y'], a['w'], a['h']
            for vname, vfn in getattr(self, '_vfns', {}).items():
                strip = np.zeros((fh, fw * len(fns), 4), np.uint8)
                for i, fn in enumerate(fns):
                    cc = copy.deepcopy(self.c)
                    cc.cur_owner = 0
                    kw = vfn(cc) or {}
                    cc.cur_owner = 30000
                    cc._variant = vname          # frame functions may look at getattr(cc, '_variant', '')
                    fn(cc)
                    img = cc.render(**kw)
                    m = cc.owner == 30000
                    strip[:, i * fw:(i + 1) * fw, :3] = img[y0:y0 + fh, x0:x0 + fw]
                    strip[:, i * fw:(i + 1) * fw, 3] = np.where(m[y0:y0 + fh, x0:x0 + fw], 255, 0)
                save_png(strip, os.path.join(folder, f'anim_{name}_{vname}.png'))
                a.setdefault('variants', []).append(vname)


# ------------------------------------------------------------------------- layers ----
class Layer:
    """Variant-dependent pixels.

        lay = Layer(sc.c)
        with lay.base():            # draw the base look on sc.c
            ...
        alt = lay.alt('night')      # scratch canvas: draw the night look with the same geometry
        ...
        lay.finalize()              # after all drawing (records which base pixels stay visible)
        lay.apply(cc, 'night')      # inside the variant fn
    """

    _count = 0

    def __init__(self, c: Canvas):
        self.c = c
        self.painted = np.zeros((c.h, c.w), bool)
        self.prev_owner = np.zeros((c.h, c.w), np.int32)
        self.alts: dict[str, Canvas] = {}
        self.visible = None
        Layer._count += 1
        self._marker = 29000 + Layer._count

    class _Ctx:
        def __init__(self, lay):
            self.lay = lay

        def __enter__(self):
            c = self.lay.c
            self.prev = c.cur_owner
            self.owner_before = c.owner.copy()
            c.cur_owner = self.lay._marker
            return c

        def __exit__(self, *a):
            c = self.lay.c
            m = c.owner == self.lay._marker
            self.lay.painted |= m
            self.lay.prev_owner[m] = self.prev
            c.owner[m] = self.prev
            c.cur_owner = self.prev
            return False

    def base(self):
        return Layer._Ctx(self)

    def alt(self, name: str) -> Canvas:
        if name not in self.alts:
            self.alts[name] = Canvas(self.c.w, self.c.h, self.c.seed)
        return self.alts[name]

    def mark(self, mask):
        """Register existing pixels (unchanged) as layer pixels."""
        c = self.c
        m = mask & ~self.painted
        self.painted |= m
        self.prev_owner[m] = c.owner[m]

    def alt_copy(self, name, mask):
        """Copy the current base pixels into the alt canvas for `mask` (a starting point)."""
        alt = self.alt(name)
        c = self.c
        ids = np.array([alt.rid_of(n) for n in c.names] + [-1], np.int32)
        alt.rid[mask] = ids[c.rid[mask]]
        alt.lum[mask] = c.lum[mask]
        alt.emis[mask] = c.emis[mask]
        alt.dith[mask] = c.dith[mask]

    def finalize(self):
        c = self.c
        self.snap_rid = c.rid.copy()
        self.snap_lum = c.lum.copy()
        self.snap_emis = c.emis.copy()
        self.visible = self.painted.copy()

    def apply(self, cc: Canvas, name: str):
        alt = self.alts.get(name)
        if alt is None or self.visible is None:
            return
        same = (cc.rid == self.snap_rid) & (cc.lum == self.snap_lum) & (cc.emis == self.snap_emis)
        own = cc.owner == self.prev_owner
        m = self.visible & same & own & (alt.rid >= 0)
        if not m.any():
            return
        ids = np.array([cc.rid_of(n) for n in alt.names] + [-1], np.int32)
        cc.rid[m] = ids[alt.rid[m]]
        cc.lum[m] = alt.lum[m]
        cc.emis[m] = alt.emis[m]
        cc.dith[m] = alt.dith[m]


def snapshot(c: Canvas, x0, y0, x1, y1):
    x0, y0, x1, y1 = c.clip_region(x0, y0, x1, y1)
    return {'r': (x0, y0, x1, y1), 'rid': c.rid[y0:y1, x0:x1].copy(), 'lum': c.lum[y0:y1, x0:x1].copy(),
            'emis': c.emis[y0:y1, x0:x1].copy(), 'dith': c.dith[y0:y1, x0:x1].copy(), 'names': list(c.names)}


def restore(cc: Canvas, snap, mask=None):
    """Paint the snapshot back (owner = cc.cur_owner).  mask: full-size bool array limiting it."""
    x0, y0, x1, y1 = snap['r']
    m = np.ones((y1 - y0, x1 - x0), bool) if mask is None else mask[y0:y1, x0:x1].copy()
    m &= snap['rid'] >= 0
    ids = np.array([cc.rid_of(n) for n in snap['names']] + [-1], np.int32)
    R = cc.rid[y0:y1, x0:x1]
    R[m] = ids[snap['rid'][m]]
    cc.lum[y0:y1, x0:x1][m] = snap['lum'][m]
    cc.emis[y0:y1, x0:x1][m] = snap['emis'][m]
    cc.dith[y0:y1, x0:x1][m] = snap['dith'][m]
    cc.owner[y0:y1, x0:x1][m] = cc.cur_owner


# ------------------------------------------------------------------------- checks ----
def _inside(poly, x, y):
    n = len(poly)
    j = n - 1
    ins = False
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi:
            ins = not ins
        j = i
    return ins


def walkable_at(meta, x, y):
    for wa in meta['walk']:
        if _inside(wa['poly'], x, y) and not any(_inside(h, x, y) for h in wa.get('holes', [])):
            return True
    return False


def check(sc: Scene, npc=()):
    """Print problems: walk points or (non-NPC) points outside the walkable area."""
    bad = []
    for hid, hs in sc.meta['hotspots'].items():
        if 'walk' not in hs or 'face' not in hs:
            bad.append(f'hotspot {hid}: missing walk/face')
            continue
        if not walkable_at(sc.meta, *hs['walk']):
            bad.append(f'hotspot {hid}: walk {hs["walk"]} not walkable')
    for pid, p in sc.meta['points'].items():
        if pid in npc:
            continue
        if not walkable_at(sc.meta, p['x'], p['y']):
            bad.append(f'point {pid}: ({p["x"]},{p["y"]}) not walkable')
    for b in bad:
        print('  !!', sc.name, b)
    return bad


def ipoly(pts):
    return [(int(round(x)), int(round(y))) for x, y in pts]


# ---------------------------------------------------------------- lum helpers ----
def grain_h(base, amp=.035, freq=1.9, seed=0):
    """Horizontal wood grain for frontal faces."""
    ph = (seed * 1.37) % 6.28

    def f(xx, yy):
        return base + amp * np.sin(yy * freq + np.sin(xx * .23 + ph) * 1.6) + amp * .5 * np.sin(xx * .9 + yy * .2)
    return f


def grain_v(base, amp=.035, freq=1.7, seed=0):
    ph = (seed * 1.37) % 6.28

    def f(xx, yy):
        return base + amp * np.sin(xx * freq + np.sin(yy * .19 + ph) * 1.8) + amp * .4 * np.sin(yy * .7)
    return f


def noisy(base, w, h, scale=4, amp=.06, seed=0, octaves=2):
    N = noise2(w, h, scale, seed, octaves)

    def f(xx, yy):
        b = base(xx, yy) if callable(base) else base
        xi = np.clip(xx.astype(int), 0, w - 1)
        yi = np.clip(yy.astype(int), 0, h - 1)
        return b + (N[yi, xi] - .5) * 2 * amp
    return f


def dither_fill(c: Canvas, x0, y0, x1, y1, density, ramp_name, lum, emis=0.0, offset=0):
    """Replace a Bayer-dithered fraction of the pixels in a rect (density: float or fn(xx,yy))."""
    x0, y0, x1, y1 = c.clip_region(x0, y0, x1, y1)
    if x1 <= x0 or y1 <= y0:
        return
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    d = density(xx, yy) if callable(density) else np.full(xx.shape, density, np.float32)
    bay = BAYER4[((yy.astype(int) + offset) % 4), (xx.astype(int) % 4)]
    m = bay < d
    L = lum(xx, yy) if callable(lum) else lum
    c._apply(m, ramp_name, L, emis=emis, dith=0.0, region=(x0, y0, x1, y1))


def dither_poly(c: Canvas, pts, density, ramp_name, lum, emis=0.0):
    m, r = c.poly_mask(pts)
    if m is None:
        return
    x0, y0, x1, y1 = r
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    d = density(xx, yy) if callable(density) else density
    bay = BAYER4[(yy.astype(int) % 4), (xx.astype(int) % 4)]
    mm = m & (bay < d)
    L = lum(xx, yy) if callable(lum) else lum
    c._apply(mm, ramp_name, L, emis=emis, dith=0.0, region=r)


def recolor(c: Canvas, mask_region, ramp_name, lum_scale=1.0, lum_add=0.0, emis=None):
    """Re-assign existing pixels inside a polygon/rect to another ramp keeping their lum."""
    kind, data = mask_region
    if kind == 'rect':
        x0, y0, x1, y1 = c.clip_region(*data)
        m = np.ones((y1 - y0, x1 - x0), bool)
        r = (x0, y0, x1, y1)
    else:
        m, r = c.poly_mask(data)
        if m is None:
            return
    x0, y0, x1, y1 = r
    L = c.lum[y0:y1, x0:x1] * lum_scale + lum_add
    E = c.emis[y0:y1, x0:x1].copy() if emis is None else emis
    c._apply(m, ramp_name, L, emis=None, dith=None, region=r)
    if emis is None:
        c.emis[y0:y1, x0:x1][m] = E[m]
    else:
        c.emis[y0:y1, x0:x1][m] = emis


# ------------------------------------------------------------------- generic props ----
def pendant_lamp(c: Canvas, x, y, w=14, on=True, shade='c_jade', cord_top=0, lum=.5):
    """Enamel pendant lamp, (x, y) = centre of the shade's lower rim."""
    c.vline(x, cord_top, y - 5, 'black', .35)
    c.rect(x - 1, y - 6, x + 1, y - 4, 'brass', .55)
    hw = w // 2
    pts = [(x - 2, y - 5), (x + 2, y - 5), (x + hw, y), (x - hw, y)]
    c.poly(pts, shade, hgrad(x - hw, x + hw, lum + .18, lum - .12))
    c.hline(x - hw, x + hw + 1, y, shade, lum + .3)
    c.line(x - 2, y - 5, x - hw + 1, y - 1, shade, lum + .35)
    if on:
        c.hline(x - hw + 1, x + hw, y + 1, 'lamp', .75, emis=1)
        c.rect(x - 2, y + 1, x + 2, y + 3, 'lamp', .95, emis=1)
    else:
        c.hline(x - hw + 1, x + hw, y + 1, 'white', .45)
        c.rect(x - 2, y + 1, x + 2, y + 3, 'white', .55)


def round_clock(c: Canvas, x, y, r=7, hh=10, mm=10, face='paper', rim='brass', numerals=True, emis=0.0):
    """Wall clock centred on (x, y)."""
    c.ellipse(x, y, r + 1.4, r + 1.4, rim, .45, emis=emis)
    c.ellipse(x - .4, y - .4, r + .6, r + .6, rim, .7, emis=emis)
    c.ellipse(x, y, r, r, face, radial(x - 2, y - 2, r * 1.6, .85, .62), emis=emis)
    if numerals:
        for k in range(12):
            a = math.radians(k * 30)
            px = x + math.sin(a) * (r - 1.6)
            py = y - math.cos(a) * (r - 1.6)
            c.put(int(round(px - .5)), int(round(py - .5)), 'black', .25 if k % 3 else .05, emis * .5)
    ah = math.radians((hh % 12 + mm / 60) * 30)
    am = math.radians(mm * 6)
    c.line(x - .5, y - .5, x - .5 + math.sin(ah) * r * .5, y - .5 - math.cos(ah) * r * .5, 'black', .05)
    c.line(x - .5, y - .5, x - .5 + math.sin(am) * r * .8, y - .5 - math.cos(am) * r * .8, 'black', .1)
    c.put(int(x - .5), int(y - .5), 'brass', .9)


def filing_cabinet(c: Canvas, p: Persp, X0, X1, Z0, Z1, H, ramp_name='olive', lum=.5, drawers=4, labels=True):
    p.box(c, X0, X1, 0, H, Z0, Z1, ramp_name, front=lum, top=lum + .2, side=lum - .2)
    fx0, fy0, fx1, fy1 = p.front_rect(X0, X1, 0, H, Z1)
    fx0, fy0, fx1, fy1 = int(round(fx0)), int(round(fy0)), int(round(fx1)), int(round(fy1))
    c.hline(fx0, fx1, fy0, ramp_name, lum + .3)
    dh = (fy1 - fy0 - 2) / drawers
    for i in range(drawers):
        a = int(round(fy0 + 1 + i * dh))
        b = int(round(fy0 + 1 + (i + 1) * dh))
        c.rect(fx0 + 1, a + 1, fx1 - 1, b, ramp_name, lum - .04)
        c.hline(fx0 + 1, fx1 - 1, a, ramp_name, lum - .3)
        c.hline(fx0 + 1, fx1 - 1, b - 1, ramp_name, lum + .12)
        mx = (fx0 + fx1) // 2
        if labels:
            c.rect(mx - 2, a + 2, mx + 2, a + 4, 'paper', .7)
        c.hline(mx - 2, mx + 2, a + 5, 'chrome', .75)
        c.hline(mx - 1, mx + 1, a + 6, 'chrome', .35)
    c.hline(fx0, fx1, fy1 - 1, 'black', .2)
    return fx0, fy0, fx1, fy1


def water_cooler(c: Canvas, x, y, water='glass', body='cream'):
    """(x, y) = floor centre. ~30 px tall."""
    c.rect(x - 5, y - 16, x + 5, y, body, hgrad(x - 5, x + 5, .62, .4))
    c.vline(x - 5, y - 16, y, body, .75)
    c.hline(x - 5, x + 5, y - 16, body, .8)
    c.rect(x - 4, y - 2, x + 4, y, 'black', .3)
    c.rect(x + 1, y - 13, x + 4, y - 11, 'chrome', .7)
    c.put(x + 3, y - 10, 'chrome', .9)
    # inverted bottle
    c.ellipse(x, y - 24, 5, 7, water, radial(x - 2, y - 27, 8, .75, .35), emis=.15)
    c.rect(x - 2, y - 18, x + 2, y - 16, water, .5, emis=.1)
    c.line(x - 3, y - 28, x - 3, y - 21, water, .9, emis=.25)
    c.hline(x - 4, x + 5, y - 22, water, .3, emis=.1)
    # paper cup dispenser
    c.rect(x + 6, y - 22, x + 8, y - 12, 'chrome', .55)
    c.vline(x + 6, y - 22, y - 12, 'chrome', .8)


def coat_rack(c: Canvas, x, y, h=44, ramp_name='wood', lum=.45):
    """Bentwood coat stand, (x, y) = floor centre."""
    c.vline(x, y - h, y, ramp_name, lum)
    c.vline(x + 1, y - h, y, ramp_name, lum - .15)
    for dx in (-5, 5):
        c.line(x, y - 3, x + dx, y, ramp_name, lum - .05)
    for dx, dy in ((-4, -h + 4), (4, -h + 4), (-3, -h + 9), (4, -h + 10)):
        c.line(x, y + dy - 2, x + dx, y + dy, ramp_name, lum + .1)
    c.ellipse(x + .5, y - h, 1.6, 1.2, ramp_name, lum + .2)


def typewriter(c: Canvas, x, y, w=14, ramp_name='black', lum=.5, paper=True, facing='front'):
    """1940s office typewriter seen from the front-top. (x, y) = front-bottom centre."""
    hw = w // 2
    # body: trapezoid sloping back
    c.poly([(x - hw, y), (x + hw, y), (x + hw - 1, y - 4), (x - hw + 1, y - 4)], ramp_name, .32)
    c.poly([(x - hw + 1, y - 4), (x + hw - 1, y - 4), (x + hw - 2, y - 7), (x - hw + 2, y - 7)], ramp_name, .42)
    # key rows (light dots)
    for row, ry in enumerate((y - 2, y - 4, y - 6)):
        for kx in range(x - hw + 2 + row % 2, x + hw - 1, 2):
            c.put(kx, ry, 'paper', .62 - row * .07)
    c.hline(x - 3, x + 4, y - 1, 'paper', .5)        # space bar
    # carriage + platen
    c.rect(x - hw - 1, y - 9, x + hw + 1, y - 7, ramp_name, .25)
    c.hline(x - hw - 1, x + hw + 1, y - 9, ramp_name, .7)
    c.put(x - hw - 2, y - 9, 'chrome', .8)   # return lever
    c.put(x - hw - 3, y - 10, 'chrome', .7)
    if paper:
        c.rect(x - hw + 3, y - 15, x + hw - 3, y - 8, 'paper', vgrad(y - 15, y - 8, .85, .7))
        for ly in range(y - 13, y - 9, 2):
            c.hline(x - hw + 4, x + hw - 5, ly, 'paper', .5)
    c.hline(x - hw, x + hw, y, 'black', .05)


def paper_stack(c: Canvas, x, y, w=8, n=4, lum=.7, seed=0, ramp_name='paper'):
    """Stack of loose papers, (x, y) = bottom-left of the stack's front edge."""
    rng = np.random.default_rng(seed)
    for i in range(n):
        dx = int(rng.integers(-1, 2))
        c.rect(x + dx, y - 1 - i, x + dx + w, y - i, ramp_name, lum - .12 + (i == n - 1) * .1 - (i % 2) * .06)
    top = y - n
    c.rect(x, top - 2, x + w, top, ramp_name, lum + .08)
    c.hline(x + 1, x + w - 2, top - 1, ramp_name, lum - .15)


def ashtray(c: Canvas, x, y, smoking=True):
    c.ellipse(x, y, 3, 1.2, 'glass', .45)
    c.hline(x - 2, x + 3, y - 1, 'glass', .75)
    c.put(x - 1, y, 'paper', .55)
    c.put(x + 1, y, 'paper', .5)
    c.put(x, y - 1, 'paper', .7)
    if smoking:
        c.hline(x + 2, x + 5, y - 1, 'paper', .85)
        c.put(x + 5, y - 1, 'neonred', .8, emis=1)


def coffee_cup(c: Canvas, x, y, ramp_name='white'):
    c.rect(x - 1, y - 3, x + 2, y, ramp_name, .7)
    c.vline(x - 1, y - 3, y, ramp_name, .85)
    c.put(x + 2, y - 2, ramp_name, .55)
    c.hline(x - 1, x + 2, y - 3, 'wood', .2)
    c.hline(x - 2, x + 3, y, ramp_name, .5)


def glass_streaks(c: Canvas, x0, y0, x1, y1, ramp_name='glass', lum=.7, step=11, emis=.3):
    """Diagonal reflection streaks on a pane."""
    for k in range(x0 - (y1 - y0), x1, step):
        for t in range(0, y1 - y0):
            px = k + t // 2
            py = y1 - 1 - t
            if x0 <= px < x1 and y0 <= py < y1 and (t % 7) < 4:
                c.put(px, py, ramp_name, lum, emis)


def fog_band(c: Canvas, x0, y0, x1, y1, d0, d1, lum=.6, ramp_name='fog', emis=.4, offset=0, wobble=None):
    """Dithered fog: density d0 at y0 .. d1 at y1 (vertical), optional wobble fn(xx)->dy."""
    def dens(xx, yy):
        yv = yy + (wobble(xx) if wobble else 0)
        t = np.clip((yv - y0) / max(1, y1 - y0), 0, 1)
        return d0 + (d1 - d0) * t
    dither_fill(c, x0, y0, x1, y1, dens, ramp_name, lum, emis=emis, offset=offset)


def crow(c: Canvas, x, y, pose='perch', facing=1, lum=.35):
    """Small crow (~7x5 px). (x, y) = feet."""
    f = facing
    if pose == 'perch':
        c.poly([(x - 3 * f, y - 2), (x + 2 * f, y - 4), (x + 3 * f, y - 2), (x, y - 1)], 'c_crow', lum)
        c.rect(min(x - 3 * f, x - 1), y - 3, max(x - 3 * f, x - 1) + 1, y - 1, 'c_crow', lum - .1)
        c.ellipse(x + 2 * f, y - 5, 1.6, 1.4, 'c_crow', lum + .05)
        c.put(x + 4 * f, y - 5, 'c_crow', lum + .3)
        c.put(x + 2 * f + f, y - 6, 'c_crow', lum + .45)          # eye glint
        c.line(x - 3 * f, y - 2, x - 5 * f, y - 1, 'c_crow', lum - .1)   # tail
        c.put(x, y, 'c_crow', lum - .2)
    elif pose == 'peck':
        c.poly([(x - 3 * f, y - 4), (x + 2 * f, y - 3), (x + 3 * f, y - 1), (x - 1 * f, y - 1)], 'c_crow', lum)
        c.ellipse(x + 3 * f, y - 1, 1.4, 1.2, 'c_crow', lum + .05)
        c.put(x + 5 * f, y, 'c_crow', lum + .3)
        c.line(x - 3 * f, y - 4, x - 5 * f, y - 5, 'c_crow', lum - .1)
    elif pose == 'flap':
        c.ellipse(x, y - 3, 2.5, 1.4, 'c_crow', lum)
        c.ellipse(x + 3 * f, y - 4, 1.4, 1.2, 'c_crow', lum + .05)
        c.put(x + 5 * f, y - 4, 'c_crow', lum + .3)
        c.line(x - 1, y - 4, x - 4 * f, y - 9, 'c_crow', lum - .05)
        c.line(x, y - 4, x - 2 * f, y - 10, 'c_crow', lum - .05)
        c.line(x + 1, y - 4, x + 3 * f, y - 9, 'c_crow', lum - .05)
        c.line(x - 2 * f, y - 3, x - 5 * f, y - 2, 'c_crow', lum - .1)
    elif pose == 'fly':
        c.ellipse(x, y, 2.4, 1.1, 'c_crow', lum)
        c.line(x - 1, y, x - 4, y - 3, 'c_crow', lum - .05)
        c.line(x + 1, y, x + 4, y - 3, 'c_crow', lum - .05)
        c.put(x + 3 * f, y, 'c_crow', lum + .2)
    elif pose == 'glide':
        c.ellipse(x, y, 2.4, 1.1, 'c_crow', lum)
        c.line(x - 2, y, x - 6, y + 1, 'c_crow', lum - .05)
        c.line(x + 2, y, x + 6, y + 1, 'c_crow', lum - .05)
        c.put(x + 3 * f, y, 'c_crow', lum + .2)


def seated_figure(c: Canvas, x, y, k=1.0, ramp_coat='slate', lum=.3, hat=True, hunch=1.0, facing=0, seed=0,
                  bowl=True, skin='skin'):
    """Painted background figure sitting at a table seen from the front-ish.
    (x, y) = point where the torso meets the table top (table edge).  k = scale."""
    rng = np.random.default_rng(seed)
    sh = int(round(13 * k))      # torso height above the table
    sw = int(round(7 * k))       # half shoulder width
    hy = y - sh
    # torso / shoulders hunched forward
    c.poly([(x - sw, y), (x - sw + 1, hy + 4 * k), (x - sw + 3, hy + 1), (x + sw - 3, hy + 1),
            (x + sw - 1, hy + 4 * k), (x + sw, y)], ramp_coat, vgrad(hy, y, lum + .08, lum - .08))
    # collar line
    c.line(x - 2, hy + 1, x, hy + 4 * k, ramp_coat, lum - .12)
    c.line(x + 2, hy + 1, x, hy + 4 * k, ramp_coat, lum - .12)
    # head
    hx = x + facing * k
    hcy = hy - 2 * k + hunch * 2 * k
    c.ellipse(hx, hcy, 2.6 * k, 3.0 * k, skin, .32)
    c.put(int(hx + facing * 1.4 * k), int(hcy), skin, .45)
    if hat:
        c.ellipse(hx, hcy - 2.4 * k, 4.2 * k, 1.1 * k, 'slate', lum - .08)
        c.rect(hx - 2.4 * k, hcy - 5.6 * k, hx + 2.6 * k, hcy - 2.4 * k, 'slate', lum - .02)
        c.hline(int(hx - 2.4 * k), int(hx + 2.6 * k), int(hcy - 3.0 * k), 'black', .3)
    else:
        c.ellipse(hx, hcy - 1.8 * k, 2.7 * k, 1.8 * k, 'black', .6)
    # arms resting on the table
    c.poly([(x - sw, y - 3 * k), (x - 1, y - 1), (x - 1, y + 1), (x - sw - 1, y)], ramp_coat, lum - .02)
    c.poly([(x + sw, y - 3 * k), (x + 1, y - 1), (x + 1, y + 1), (x + sw + 1, y)], ramp_coat, lum - .06)
    c.rect(x - 2, y - 1, x + 2, y + 1, skin, .35)
    if bowl:
        c.ellipse(x, y + 1, 3 * k, 1.2, 'white', .5)
        c.hline(int(x - 2 * k), int(x + 2 * k), int(y), 'c_amber', .35)


# --------------------------------------------------------------- office furniture ----
def P(p, X, Y, Z):
    x, y = p.P(X, Y, Z)
    return int(round(x)), int(round(y))


def city_day(c, x0, y0, x1, y1, seed=1):
    """Rainy overcast day across the street: roofline, water tower, brick facade."""
    rng = np.random.default_rng(seed)
    c.rect(x0, y0, x1, y1, 'c_sky', vgrad(y0, y1, .8, .62), emis=.85, dith=.35)
    base = int(y0 + (y1 - y0) * .42)
    x = x0
    while x < x1:
        w = int(rng.integers(4, 10))
        h = int(rng.integers(1, 8))
        c.rect(x, base - h, x + w, y1, 'fog', .66, emis=.8, dith=.2)
        if rng.random() < .3:
            c.rect(x + 1, base - h - 3, x + 2, base - h, 'fog', .6, emis=.8)      # chimney
        x += w
    if seed % 2 == 0:   # water tower on a roof
        tx = x0 + (x1 - x0) // 2
        c.rect(tx - 3, base - 12, tx + 4, base - 5, 'fog', .55, emis=.8, dith=0)
        c.poly([(tx - 4, base - 12), (tx + 5, base - 12), (tx + .5, base - 16)], 'fog', .52, emis=.8)
        for dx in (-3, 3):
            c.line(tx + dx, base - 5, tx + dx * 1.3, base, 'fog', .5, emis=.8)
    nb = int(y0 + (y1 - y0) * .62)
    c.rect(x0, nb, x1, y1, 'brick', vgrad(nb, y1, .52, .44), emis=.6, dith=.3)
    for wy in range(nb + 4, y1 - 2, 7):
        for wx in range(x0 + 2, x1 - 3, 6):
            c.rect(wx, wy, wx + 3, wy + 4, 'c_sky', .42, emis=.6, dith=0)
            c.hline(wx, wx + 3, wy + 2, 'c_sky', .3, emis=.6)
    c.hline(x0, x1, nb, 'fog', .72, emis=.7)
    c.hline(x0, x1, nb + 1, 'brick', .3, emis=.5)


def city_night(c, x0, y0, x1, y1, seed=1):
    rng = np.random.default_rng(seed)
    c.rect(x0, y0, x1, y1, 'night', vgrad(y0, y1, .26, .42), emis=.9, dith=.35)
    base = int(y0 + (y1 - y0) * .42)
    x = x0
    while x < x1:
        w = int(rng.integers(4, 10))
        h = int(rng.integers(1, 8))
        c.rect(x, base - h, x + w, y1, 'night', .14, emis=.9, dith=.2)
        if rng.random() < .45:
            c.put(x + int(rng.integers(1, max(2, w - 1))), base - h + 2, 'lamp', .7, emis=1)
        x += w
    if seed % 2 == 0:
        tx = x0 + (x1 - x0) // 2
        c.rect(tx - 3, base - 12, tx + 4, base - 5, 'night', .1, emis=.9, dith=0)
        c.poly([(tx - 4, base - 12), (tx + 5, base - 12), (tx + .5, base - 16)], 'night', .1, emis=.9)
        c.put(tx + 1, base - 17, 'neonred', .9, emis=1)          # aircraft warning lamp
    nb = int(y0 + (y1 - y0) * .62)
    c.rect(x0, nb, x1, y1, 'brick', vgrad(nb, y1, .2, .14), emis=.7, dith=.3)
    for wy in range(nb + 4, y1 - 2, 7):
        for wx in range(x0 + 2, x1 - 3, 6):
            lit = rng.random() < .4
            c.rect(wx, wy, wx + 3, wy + 4, 'lamp' if lit else 'night', .6 if lit else .18, emis=1, dith=0)
            if lit and rng.random() < .5:
                c.hline(wx, wx + 3, wy + 2, 'lamp', .4, emis=1)
    c.hline(x0, x1, nb, 'night', .35, emis=.8)


def tall_window(c, x0, y0, x1, y1):
    fr = 'c_jade'
    c.rect(x0, y0, x1, y0 + 2, fr, .45)
    c.rect(x0, y1 - 2, x1, y1, fr, .35)
    c.rect(x0, y0, x0 + 2, y1, fr, .42)
    c.rect(x1 - 2, y0, x1, y1, fr, .3)
    mid = (y0 + y1) // 2
    c.rect(x0 + 2, mid - 1, x1 - 2, mid + 1, fr, .5)
    c.hline(x0 + 2, x1 - 2, mid - 1, fr, .72)
    cx = (x0 + x1) // 2
    c.vline(cx, y0 + 2, y1 - 2, fr, .38)
    for yy in ((y0 + mid) // 2, (mid + y1) // 2):
        c.hline(x0 + 2, x1 - 2, yy, fr, .38)
    c.hline(x0, x1, y0, fr, .7)
    c.vline(x0, y0, y1, fr, .6)
    c.rect(x0 - 2, y1, x1 + 2, y1 + 2, 'c_plaster', .66)
    c.hline(x0 - 2, x1 + 2, y1 + 2, 'c_plaster', .3)
    # half-drawn roller blind with pull ring
    c.rect(x0 + 2, y0 + 2, x1 - 2, y0 + 8, 'cream', vgrad(y0 + 2, y0 + 8, .5, .64), emis=.3)
    c.hline(x0 + 2, x1 - 2, y0 + 8, 'wood', .5)
    c.put(cx, y0 + 9, 'paper', .7)
    c.put(cx, y0 + 10, 'paper', .5)


def office_chair(c, x, y, k=1.0, ramp='oak', lum=.45, turn=0):
    """1940s wooden swivel chair seen from behind. (x, y) = floor centre. turn: skew in px."""
    def S(v):
        return int(round(v * k))
    # four splayed legs with casters
    sy = y - S(12)
    for dx, l in ((-7, .38), (7, .3), (-3, .45), (4, .4)):
        c.line(x, sy + 1, x + S(dx), y - (1 if abs(dx) < 5 else 0), 'black', l)
        c.put(x + S(dx), y - (1 if abs(dx) < 5 else 0) + 1, 'chrome', .5)
    c.rect(x - 1, sy - S(2), x + 2, sy + 2, 'c_iron', .45)          # swivel iron
    c.hline(x - 1, x + 2, sy - S(2), 'c_iron', .7)
    # saddle seat (rear edge seen from above)
    c.poly([(x - S(8) + turn, y - S(16)), (x + S(8) + turn, y - S(16)), (x + S(7), y - S(13)), (x - S(7), y - S(13))],
           ramp, vgrad(y - S(16), y - S(13), lum + .18, lum - .05))
    c.hline(x - S(7), x + S(7), y - S(13), ramp, lum - .22)
    # curved bow back on spindles
    bx = x + turn
    top = y - S(30)
    c.poly([(bx - S(9), top + S(1)), (bx + S(9), top + S(1)), (bx + S(8), top + S(5)), (bx - S(8), top + S(5))],
           ramp, hgrad(bx - 9, bx + 9, lum + .2, lum - .08))
    c.hline(bx - S(8), bx + S(8), top, ramp, lum + .34)
    c.hline(bx - S(7), bx + S(7), top + S(5), ramp, lum - .25)
    for dx in (-6, -2, 2, 6):
        c.line(bx + S(dx), top + S(5), x + S(dx * .8), y - S(16), ramp, lum - .02 - abs(dx) * .01)


def big_desk(c, p, X0, X1, Z0, Z1, Hd=22, ramp='oak', lum=.46, seed=0, peds=('l', 'r')):
    """Office desk, sitting side towards the camera: two pedestals and a kneehole."""
    pw = 12
    p.box(c, X0 + pw, X1 - pw, 4, Hd - 2, Z0 + 2, Z0 + 4, ramp, front=lum - .26, top=lum - .2, side=lum - .3)
    out = {}
    for side in peds:
        a, b = (X0, X0 + pw) if side == 'l' else (X1 - pw, X1)
        p.box(c, a, b, 0, Hd - 2, Z0, Z1 - 1, ramp, front=lum - .02, top=lum + .1, side=lum - .2,
              lum_fn=grain_h(lum - .02, .025, 1.6, seed + (side == 'r')))
        fx0, fy0, fx1, fy1 = [int(round(v)) for v in p.front_rect(a, b, 0, Hd - 2, Z1 - 1)]
        n = 3
        dh = (fy1 - fy0 - 2) / n
        for i in range(n):
            u = int(round(fy0 + 1 + i * dh))
            v = int(round(fy0 + 1 + (i + 1) * dh))
            c.hline(fx0 + 1, fx1 - 1, u, ramp, lum - .3)
            c.hline(fx0 + 1, fx1 - 1, v - 1, ramp, lum + .16)
            mx = (fx0 + fx1) // 2
            c.hline(mx - 1, mx + 2, u + (v - u) // 2, 'brass', .72)
            c.put(mx - 1, u + (v - u) // 2 + 1, 'brass', .35)
        c.hline(fx0, fx1, fy1 - 1, 'black', .15)
        c.vline(fx0, fy0, fy1, ramp, lum + .12)
        out[side] = (fx0, fy0, fx1, fy1)
    p.box(c, X0 - 1, X1 + 1, Hd - 2, Hd, Z0 - 1, Z1, ramp, front=lum + .12, top=lum + .16, side=lum - .05,
          top_fn=grain_h(lum + .16, .02, .8, seed))
    a = P(p, X0 - 1, Hd, Z1)
    b = P(p, X1 + 1, Hd, Z1)
    c.hline(a[0], b[0], a[1], ramp, lum + .34)
    return out


def wastebasket(c, x, y, full=True):
    c.poly([(x - 4, y - 8), (x + 4, y - 8), (x + 3, y), (x - 3, y)], 'c_iron', hgrad(x - 4, x + 4, .6, .3))
    for k in range(x - 3, x + 4, 2):
        c.vline(k, y - 7, y, 'c_iron', .22)
    c.hline(x - 4, x + 5, y - 8, 'c_iron', .75)
    if full:
        for dx, dy in ((-2, -9), (1, -10), (3, -9), (-1, -11), (2, -12)):
            c.ellipse(x + dx, y + dy, 1.6, 1.3, 'paper', .72 + dx * .02)


def crumple(c, x, y, lum=.7):
    c.ellipse(x, y - 1, 1.6, 1.2, 'paper', lum)
    c.put(x - 1, y - 2, 'paper', lum + .15)
    c.put(x + 1, y - 1, 'paper', lum - .22)


def pane_glint(c, x0, y0, x1, y1):
    """Two short diagonal reflections in the upper-left of a glass pane."""
    for off, L in ((2, .66), (4, .55)):
        n = min(x1 - x0, y1 - y0) // 3
        for t in range(0, n):
            px, py = x0 + off + t, y0 + 1 + n - t
            if x0 <= px < x1 and y0 <= py < y1:
                c.put(px, py, 'c_frost', L, emis=.35)


def set_pixels(c: Canvas, mask, ramp_name, lum, emis=0.0, dith=None):
    """Write pixels for a full-size boolean mask directly (lum: float or full-size array).
    Sets the owner buffer to c.cur_owner when the canvas has one (scene canvases)."""
    if not mask.any():
        return
    rid = c.rid_of(ramp_name)
    c.rid[mask] = rid
    c.lum[mask] = lum[mask] if isinstance(lum, np.ndarray) else lum
    c.emis[mask] = emis[mask] if isinstance(emis, np.ndarray) else emis
    c.dith[mask] = c.default_dith if dith is None else dith
    if hasattr(c, 'owner'):
        c.owner[mask] = c.cur_owner


def mask_of(c: Canvas, draw):
    """Boolean mask of the pixels a drawing function touches (drawn on a scratch canvas)."""
    t = Canvas(c.w, c.h, c.seed)
    draw(t)
    return t.rid >= 0


def order_hotspots(sc: Scene, first):
    """Put the listed hotspot ids first (specific before general) - for click resolution that
    takes the first match."""
    hs = sc.meta['hotspots']
    new = {k: hs[k] for k in first if k in hs}
    for k, v in hs.items():
        if k not in new:
            new[k] = v
    sc.meta['hotspots'] = new
