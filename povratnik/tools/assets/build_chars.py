"""Shared character sheets -> per-character atlases with planted-foot anchors.

Source (old project): sprites/char_0N.webp (3 x 4 cells of 220 px: stand, two walk frames;
one character per row) and sprites/walk_0N.webp (8 x 4 cells of 200 px: eight-frame walk).
Rows are characters, all facing right. Both sheets normalise figures to their cell height,
so each animation carries its own reference height (refH) for scale normalisation.
"""
from __future__ import annotations

import json
import os
import sys

import numpy as np
from PIL import Image

from common import GENERATED, PUBLIC, ROOT, Atlas, Frame, bbox, defringe, ensure_dir, flat_top, keep_main_blob, load_rgba, pack, ref, torso_center_x
from crown_patch import restore_crown

CACHE = os.path.join(ROOT, '.cache', 'crowns')


def patched_idle(key: str, idle: np.ndarray, walk_cells: list[np.ndarray]) -> tuple[np.ndarray, dict]:
    """Idle cell with its cut-off crown restored from the best-matching walk frame (cached)."""
    ensure_dir(CACHE)
    cpath = os.path.join(CACHE, f'{key}.png')
    ipath = os.path.join(CACHE, f'{key}.json')
    if os.path.exists(cpath) and os.path.exists(ipath):
        return np.array(Image.open(cpath).convert('RGBA')), json.load(open(ipath))
    best = None
    for col, w in enumerate(walk_cells):
        out, info = restore_crown(idle, w)
        if info.get('patched') and (best is None or info['score'] < best[1]['score']):
            best = (out, {**info, 'walkCol': col})
    if best is None:
        return idle, {'patched': False}
    Image.fromarray(best[0]).save(cpath)
    json.dump(best[1], open(ipath, 'w'))
    return best

# key: (sheet number, row)  -- mapping verified against the old art.js table and visually
SHARED = {
    'macleod': (1, 0), 'mijo1467': (1, 1), 'mijo1473': (1, 2), 'mijo1996': (1, 3),
    'mijo1507': (2, 0), 'mijo1512': (2, 1), 'mijo1878': (2, 2), 'alessandro': (2, 3),
    'nedzad': (3, 0), 'halil': (3, 1), 'otac': (3, 2), 'andja': (3, 3),
    'komsija': (4, 0), 'emin': (4, 1), 'katib': (4, 2), 'frano': (4, 3),
    'ivan': (5, 0), 'rehberger': (5, 1), 'zeman': (5, 2), 'hauptmann': (5, 3),
    'slaven': (6, 0), 'bauer': (6, 1), 'major': (6, 2), 'soldat': (6, 3),
    'nikephoros': (7, 0), 'braut': (7, 1), 'haendler': (7, 2), 'dorfalter': (7, 3),
}

WALK_FPS = 9
WALK_SPEED = 150  # world px / s at perspective scale 1
WALK_SHORTEN = 0.985  # a walking figure is slightly shorter than the same figure standing
FLAT_TOP_LIMIT = 0.62  # crown cut off in the idle cell (straight wide top edge)
FORCE_WALK_STAND: set[str] = set()
# Hats, turbans and tied-back hair have naturally flat tops; their idle cells were checked visually and are complete.
FORCE_IDLE = {'macleod', 'emin', 'katib', 'soldat', 'dorfalter'}
# Sheets whose idle cells are painted facing left (the walk cycles all face right): the stand animation
# carries its own facing so the renderer mirrors it the right way.
STAND_FACES_LEFT = {2}
# Points measured on single frames (offsets from the planted feet, source pixels, as painted): where
# something is attached to the figure. mijo1878: the exit wound on the tunic front under the last rib
# (shown as a torn hole, then smeared with blood, then a dressing).
POINTS = {
    'mijo1878': {'stand_0': [[-12, -132]], **{f'walk_{i}': [[16, -104]] for i in range(8)}},
}


def cell(img: np.ndarray, cx: int, cy: int, cw: int, ch: int) -> np.ndarray:
    return img[cy * ch:(cy + 1) * ch, cx * cw:(cx + 1) * cw]


def clean(c: np.ndarray, stats: dict) -> np.ndarray:
    c, r = keep_main_blob(c)
    stats['fragments'] += r
    return c


def frame_from_cell(name: str, c: np.ndarray, ground: int, ax_cell: float, stats: dict) -> Frame:
    c, n = defringe(c)
    stats['defringed'] += n
    b = bbox(c[:, :, 3])
    if b is None:
        raise RuntimeError(f'empty cell for {name}')
    x0, y0, x1, y1 = b
    trimmed = c[y0:y1, x0:x1]
    return Frame(name, trimmed, ax_cell - x0, ground - y0)


def build(keys: list[str] | None = None) -> dict:
    out_dir = os.path.join(PUBLIC, 'chars')
    ensure_dir(out_dir)
    meta: dict = {}
    sheets: dict = {}
    for key, (n, row) in SHARED.items():
        if keys and key not in keys:
            continue
        if n not in sheets:
            sheets[n] = (load_rgba(ref(f'sprites/char_0{n}.webp')), load_rgba(ref(f'sprites/walk_0{n}.webp')))
        char, walk = sheets[n]
        stats = {'defringed': 0, 'fragments': 0}
        atlas = Atlas(key)
        # walk (eight phases)
        cells = [clean(cell(walk, i, row, 200, 200), stats) for i in range(8)]
        boxes = [bbox(c[:, :, 3]) for c in cells]
        ground = max(bb[3] for bb in boxes if bb)
        walk_h = max(bb[3] - bb[1] for bb in boxes if bb)
        for i, (c, bb) in enumerate(zip(cells, boxes)):
            axw = torso_center_x(c[:, :, 3], bb[1], bb[3])
            atlas.frames.append(frame_from_cell(f'walk_{i}', c, ground, axw, stats))
        # stand: the idle cell, unless its crown is cut off in the source art; then the walk phase
        # with the feet closest together (passing pose) stands in, at the walk sheet's scale.
        sc = clean(cell(char, 0, row, 220, 220), stats)
        b = bbox(sc[:, :, 3])
        assert b, key
        ft = flat_top(sc[:, :, 3])
        stand_source = f'sprites/char_0{n}.webp row {row} col 0'
        if (ft > FLAT_TOP_LIMIT and key not in FORCE_IDLE) or key in FORCE_WALK_STAND:
            # The crown is cut off in the source art: restore it from the character's own walk frame.
            fixed, info = patched_idle(key, sc, cells)
            if info.get('patched'):
                sc = fixed
                stand_source = (f'sprites/char_0{n}.webp row {row} col 0, crown ({info["rows"]} rows) restored from '
                                f'walk_0{n} col {info["walkCol"]} at scale {info["scale"]}')
            b = bbox(sc[:, :, 3])
        stand_h = b[3] - b[1]
        ax = torso_center_x(sc[:, :, 3], b[1], b[3])
        atlas.frames.append(frame_from_cell('stand_0', sc, b[3], ax, stats))
        frames = pack(atlas, out_dir)
        stand_anim = {'frames': ['stand_0'], 'fps': 1, 'loop': True, 'refH': stand_h}
        if n in STAND_FACES_LEFT and stand_source.startswith(f'sprites/char_0{n}.webp'):
            stand_anim['facing'] = -1
        meta[key] = {
            'atlas': f'chars/{key}',
            'walkSpeed': WALK_SPEED,
            'anims': {
                'stand': stand_anim,
                'walk': {'frames': [f'walk_{i}' for i in range(8)], 'fps': WALK_FPS, 'loop': True,
                         'refH': round(walk_h / WALK_SHORTEN, 1)},
            },
            'frames': frames,
            'source': {'stand': stand_source, 'walk': f'sprites/walk_0{n}.webp row {row}'},
        }
        if key in POINTS:
            meta[key]['points'] = POINTS[key]
        print(f'{key:12s} stand_h={stand_h} walk_h={walk_h} flat={ft:.2f} fragments={stats["fragments"]} defringed={stats["defringed"]}  stand<-{stand_source}')
    return meta


def main() -> None:
    keys = sys.argv[1:] or None
    meta = build(keys)
    ensure_dir(GENERATED)
    path = os.path.join(GENERATED, 'characters.shared.json')
    old = {}
    if keys and os.path.exists(path):
        old = json.load(open(path))
    old.update(meta)
    with open(path, 'w') as fh:
        json.dump(old, fh, indent=1, sort_keys=True)
    print('wrote', path, len(old), 'characters')


if __name__ == '__main__':
    main()
