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

from common import GENERATED, PUBLIC, Atlas, Frame, bbox, defringe, ensure_dir, load_rgba, pack, ref, torso_center_x

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


def cell(img: np.ndarray, cx: int, cy: int, cw: int, ch: int) -> np.ndarray:
    return img[cy * ch:(cy + 1) * ch, cx * cw:(cx + 1) * cw]


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
        stats = {'defringed': 0}
        atlas = Atlas(key)
        # stand
        sc = cell(char, 0, row, 220, 220)
        b = bbox(sc[:, :, 3])
        assert b, key
        stand_h = b[3] - b[1]
        ax = torso_center_x(sc[:, :, 3], b[1], b[3])
        atlas.frames.append(frame_from_cell('stand_0', sc, b[3], ax, stats))
        # walk
        cells = [cell(walk, i, row, 200, 200) for i in range(8)]
        boxes = [bbox(c[:, :, 3]) for c in cells]
        ground = max(bb[3] for bb in boxes if bb)
        walk_h = max(bb[3] - bb[1] for bb in boxes if bb)
        for i, (c, bb) in enumerate(zip(cells, boxes)):
            axw = torso_center_x(c[:, :, 3], bb[1], bb[3])
            atlas.frames.append(frame_from_cell(f'walk_{i}', c, ground, axw, stats))
        frames = pack(atlas, out_dir)
        meta[key] = {
            'atlas': f'chars/{key}',
            'walkSpeed': WALK_SPEED,
            'anims': {
                'stand': {'frames': ['stand_0'], 'fps': 1, 'loop': True, 'refH': stand_h},
                'walk': {'frames': [f'walk_{i}' for i in range(8)], 'fps': WALK_FPS, 'loop': True,
                         'refH': round(walk_h / WALK_SHORTEN, 1)},
            },
            'frames': frames,
            'source': {'stand': f'sprites/char_0{n}.webp row {row} col 0', 'walk': f'sprites/walk_0{n}.webp row {row}'},
        }
        print(f'{key:12s} stand_h={stand_h} walk_h={walk_h} ground={ground} defringed={stats["defringed"]}')
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
