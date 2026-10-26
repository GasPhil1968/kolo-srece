"""Speech portraits: the face of every character, cut from the front-facing frame of its sprite.

    python3 art/build_portraits.py

Reads public/assets/chars/<id>@100.png (frame 2 is the character facing the viewer; the head is
about 12 pixels across) and writes public/assets/portraits/<id>.png, 56x56, one per character.
Replace these with painted portraits later; the game only needs the same file names.
"""
import json
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
CHARS = os.path.join(ROOT, 'public', 'assets', 'chars')
OUT = os.path.join(ROOT, 'public', 'assets', 'portraits')
FRAME = 2
BOX = (18, 6, 46, 34)  # 28 x 28 pixels around the head and shoulders
SIZE = 56


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = json.load(open(os.path.join(ROOT, 'public', 'assets', 'manifest.json'), encoding='utf8'))
    made = 0
    for cid in manifest['chars']:
        sheet = Image.open(os.path.join(CHARS, f'{cid}@100.png')).convert('RGBA')
        frame_w = frame_h = 64
        cols = sheet.width // frame_w
        fx, fy = (FRAME % cols) * frame_w, (FRAME // cols) * frame_h
        face = sheet.crop((fx + BOX[0], fy + BOX[1], fx + BOX[2], fy + BOX[3]))
        face.resize((SIZE, SIZE), Image.NEAREST).save(os.path.join(OUT, f'{cid}.png'))
        made += 1
    print(f'portraits: {made} written to {os.path.relpath(OUT, ROOT)}')


if __name__ == '__main__':
    main()
