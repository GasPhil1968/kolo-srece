"""Foreground occluders cut from the room paintings themselves.

A figure that walks behind a wall, a table or a doorframe must disappear behind the painted object.
Each occluder is the painted object's own pixels, cut out of the background along a hand-traced
outline (room coordinates) with an anti-aliased edge. The room draws it as a layer at the object's
ground line, so figures further back are hidden and figures in front stay visible. Nothing is
repainted: outside the outline the layer is transparent.

Run: POVRATNIK_REF=<old project> python3 tools/assets/build_occluders.py [keys...]
Writes public/assets/props/<key>.webp and src/content/generated/images.json entries with the layer
rectangle (x, y, w, h) in room coordinates.
"""
from __future__ import annotations

import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

from common import GENERATED, PUBLIC, ensure_dir, ref, save_webp

SS = 4  # supersampling for the anti-aliased outline

OCCLUDERS = {
    # Weide: the dry-stone wall on the right. The missing goat walks behind it before she climbs out.
    'occ_weide_wall': {
        'bg': 'bg/bg_weide.webp',
        'poly': [738, 360, 736, 341, 760, 333, 778, 331, 800, 322, 825, 313, 846, 307, 866, 303, 890, 299, 913, 295,
                 936, 289, 955, 284, 972, 281, 995, 276, 1031, 276, 1046, 281, 1060, 284, 1089, 284, 1108, 281,
                 1125, 278, 1150, 276, 1180, 275, 1180, 352, 1060, 352, 960, 364, 800, 367],
    },
    # Im Haus: the low bench in front of the chest. Someone standing behind it is hidden to the knees.
    'occ_kuca_bench': {
        'bg': 'bg/bg_kuca.webp',
        'poly': [375, 350, 378, 340, 463, 340, 467, 350, 463, 357, 463, 402, 451, 402, 450, 358, 432, 358, 432, 417, 415, 417,
                 415, 358, 393, 358, 393, 409, 376, 409, 378, 360],
    },
    # Rückweg 1476: the big juniper beside the path; Mijo hides behind it when the woman passes.
    'occ_rw_juniper': {
        'bg': 'povratnik1476/bg_rueckweg.webp',
        'poly': [639, 369, 650, 352, 657, 340, 670, 312, 690, 300, 701, 292, 718, 276, 726, 266, 733, 248, 739, 236, 756, 244,
                 770, 248, 783, 238, 795, 229, 812, 224, 826, 220, 842, 214, 857, 210, 870, 212, 882, 214, 889, 224, 895, 230,
                 908, 233, 920, 236, 934, 242, 945, 249, 958, 255, 970, 260, 984, 271, 995, 279, 1008, 287, 1020, 293, 1030, 305,
                 1045, 323, 1058, 330, 1070, 335, 1082, 345, 1089, 356, 1086, 368, 1080, 376, 1070, 386, 1046, 394, 1020, 399,
                 990, 402, 957, 405, 920, 407, 882, 408, 850, 407, 820, 405, 790, 401, 745, 396, 712, 391, 682, 385, 660, 380, 645, 376],
    },
    # Gaststube 1512: the long table's front board, apron and benches, drawn over the card players
    # sitting behind it (their waists vanish behind the table, as the painting implies).
    'occ_stube_tisch': {
        'bg': 'bg/bg_gaststube_clean.webp',
        'poly': [296, 279, 766, 279, 766, 300, 806, 304, 806, 366, 250, 366, 250, 304, 296, 300],
    },
}


def build(key: str, spec: dict) -> dict:
    src = ref(spec['bg'])
    im = Image.open(src).convert('RGBA')
    pts = spec['poly']
    xs, ys = pts[0::2], pts[1::2]
    x0, y0 = max(0, int(min(xs)) - 1), max(0, int(min(ys)) - 1)
    x1, y1 = min(im.width, int(max(xs)) + 2), min(im.height, int(max(ys)) + 2)
    w, h = x1 - x0, y1 - y0
    mask = Image.new('L', (w * SS, h * SS), 0)
    ImageDraw.Draw(mask).polygon([((x - x0) * SS, (y - y0) * SS) for x, y in zip(xs, ys)], fill=255)
    mask = mask.resize((w, h), Image.LANCZOS)
    crop = np.array(im.crop((x0, y0, x1, y1)))
    crop[:, :, 3] = np.minimum(crop[:, :, 3], np.array(mask))
    dst = os.path.join(PUBLIC, 'props', f'{key}.webp')
    ensure_dir(os.path.dirname(dst))
    save_webp(Image.fromarray(crop), dst, quality=94)
    return {'file': f'props/{key}.webp', 'w': w, 'h': h, 'x': x0, 'y': y0, 'source': spec['bg'], 'derived': 'occluder cut along a traced outline'}


def main() -> None:
    only = set(sys.argv[1:])
    ipath = os.path.join(GENERATED, 'images.json')
    images = json.load(open(ipath)) if os.path.exists(ipath) else {}
    for key, spec in OCCLUDERS.items():
        if only and key not in only:
            continue
        images[key] = build(key, spec)
        print('occluder', key, images[key]['x'], images[key]['y'], images[key]['w'], images[key]['h'])
    with open(ipath, 'w') as fh:
        json.dump(images, fh, indent=1, sort_keys=True)


if __name__ == '__main__':
    main()
