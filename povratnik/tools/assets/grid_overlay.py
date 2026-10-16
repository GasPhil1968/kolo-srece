"""Authoring aid: draw a labelled coordinate grid over a background (for walk areas and hotspots)."""
import sys
from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
step = int(sys.argv[3]) if len(sys.argv) > 3 else 50
x0 = int(sys.argv[4]) if len(sys.argv) > 4 else 0
x1 = int(sys.argv[5]) if len(sys.argv) > 5 else None
im = Image.open(src).convert('RGB')
if x1 is not None:
    im = im.crop((x0, 0, x1, im.height))
d = ImageDraw.Draw(im, 'RGBA')
for x in range(0, im.width, step):
    gx = x + x0
    major = gx % (step * 2) == 0
    d.line([(x, 0), (x, im.height)], fill=(255, 255, 0, 120 if major else 55), width=1)
    if major:
        d.text((x + 2, 2), str(gx), fill=(255, 255, 0, 255))
        d.text((x + 2, im.height - 12), str(gx), fill=(255, 255, 0, 255))
for y in range(0, im.height, step):
    major = y % (step * 2) == 0
    d.line([(0, y), (im.width, y)], fill=(0, 255, 255, 120 if major else 55), width=1)
    if major:
        d.text((2, y + 1), str(y), fill=(0, 255, 255, 255))
im.save(out, quality=88)
print(im.size)
