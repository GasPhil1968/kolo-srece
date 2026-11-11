"""Chapter cards for the chapter select: the opening room of each chapter, shrunk to a card.

    python3 art/build_chapter_cards.py

Writes public/assets/ui/chapter_cards.png: eight 64 x 29 frames in a row, chapter 1 first.
"""
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOMS = os.path.join(HERE, '..', 'public', 'assets', 'rooms')
OUT = os.path.join(HERE, '..', 'public', 'assets', 'ui', 'chapter_cards.png')
# the locked room each chapter opens in (a lit variant where the plain one is too dark to read)
OPENINGS = ['hotel_room/bg.png', 'cold_store/bg.png', 'darkroom/bg.png', 'halcyon_cell/bg.png',
            'holding_cell/bg.png', 'lantern_cellar/bg.png', 'calypso_hold/bg_lit.png', 'radio_booth/bg.png']
W, H = 64, 29


def main():
    sheet = Image.new('RGBA', (W * len(OPENINGS), H))
    for i, rel in enumerate(OPENINGS):
        bg = Image.open(os.path.join(ROOMS, rel)).convert('RGBA')
        sheet.paste(bg.resize((W, H), Image.BOX), (i * W, 0))
    sheet.save(OUT)
    print(f'chapter cards: {len(OPENINGS)} written to {os.path.relpath(OUT, os.path.join(HERE, ".."))}')


if __name__ == '__main__':
    main()
