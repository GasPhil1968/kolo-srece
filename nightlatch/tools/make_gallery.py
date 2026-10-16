"""Build docs/screenshots/ from the browser test screenshots (reports/screens/).

The game renders at 320x180 and the tests capture it at 4x, so a nearest-neighbour /4 gives the
exact native frame. Usage: python3 tools/make_gallery.py
"""
import glob
import os

from PIL import Image

SRC = 'reports/screens'
OUT = 'docs/screenshots'
os.makedirs(OUT, exist_ok=True)


def native(path):
    im = Image.open(path).convert('RGB')
    return im.resize((im.width // 4, im.height // 4), Image.NEAREST)


# every room, native resolution, in a 6-column sheet
rooms = sorted(glob.glob(f'{SRC}/rooms/*.png'))
rooms = [r for r in rooms if not r.endswith(('_first.png', '_last.png'))]
cols, pad = 6, 4
w, h = 320, 180
rows = (len(rooms) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w + (cols + 1) * pad, rows * h + (rows + 1) * pad), (12, 10, 14))
for i, r in enumerate(rooms):
    sheet.paste(native(r), (pad + (i % cols) * (w + pad), pad + (i // cols) * (h + pad)))
sheet.save(f'{OUT}/rooms.png', optimize=True)

# a few full frames at 2x for the README
for name in ('title', 'room9_start', 'notebook', 'hint', 'menu', 'settings'):
    p = f'{SRC}/{name}.png'
    if os.path.exists(p):
        im = native(p)
        im.resize((im.width * 2, im.height * 2), Image.NEAREST).save(f'{OUT}/{name}.png', optimize=True)
for p in sorted(glob.glob(f'{SRC}/tour/*.png')):
    im = native(p)
    name = os.path.basename(p).split('_', 1)[1]
    im.resize((im.width * 2, im.height * 2), Image.NEAREST).save(f'{OUT}/{name}', optimize=True)
for p in sorted(glob.glob(f'{SRC}/playthrough/*.png')):
    im = native(p)
    im.resize((im.width * 2, im.height * 2), Image.NEAREST).save(f'{OUT}/{os.path.basename(p)}', optimize=True)
print(f'{len(rooms)} rooms -> {OUT}/rooms.png')
