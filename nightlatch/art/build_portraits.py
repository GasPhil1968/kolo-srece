"""Speech portraits: head and shoulders of every character, drawn at twice the sprite size.

    python3 art/build_portraits.py

Each character's costume (characters.py) is drawn facing the viewer with the same drawing code
as the sprites, but at 2x resolution, so the face keeps more detail than an upscaled sprite.
Writes public/assets/portraits/<id>.png (calm), <id>_o.png (speaking) and <id>_b.png (blinking),
56 x 56 pixels each.
"""
import json
import os

from PIL import Image

from characters import CHARACTERS
from chars_body import front_pose
from chars_core import Sprite
from chars_draw import draw_front

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
OUT = os.path.join(ROOT, 'public', 'assets', 'portraits')
K = 2.0                    # drawing scale, relative to the sprite (2 = 56 pixels across the face frame)
CANVAS = 128               # 64 pixels of sprite at 2x
ORIGIN = (64, 120)         # feet centre, in canvas pixels
BOX = (36, 9, 92, 65)     # head and the top of the shoulders
SIZE = 56


# variant suffix -> (mouth open, eyes shut): calm, speaking, blinking
VARIANTS = {'': (0, False), '_o': (1, False), '_b': (0, True)}


def portrait(cid, talk=0, blink=False):
    spec = CHARACTERS[cid]
    sp = Sprite(CANVAS, CANVAS, ORIGIN[0], ORIGIN[1], k=K)
    draw_front(sp, front_pose(None, spec), spec, talk=talk, blink=blink)
    full = Image.fromarray(sp.render(), 'RGBA')
    return full.crop(BOX)


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = json.load(open(os.path.join(ROOT, 'public', 'assets', 'manifest.json'), encoding='utf8'))
    made = 0
    for cid in manifest['chars']:
        for suffix, (talk, blink) in VARIANTS.items():
            portrait(cid, talk, blink).save(os.path.join(OUT, f'{cid}{suffix}.png'))
            made += 1
    print(f'portraits: {made} written to {os.path.relpath(OUT, ROOT)}')


if __name__ == '__main__':
    main()
