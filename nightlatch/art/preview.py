"""Compose a room preview (background + chosen state objects + anim frame 0) and upscale.

usage: python3 art/preview.py <room> [state1,state2] [variant] [--debug] [--out file.png]
--debug draws walkable polygons (green), hotspots (yellow) with walk points (cyan) and
named points (red), so interaction geometry can be checked against the art.
"""
import json, os, sys
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'assets', 'rooms')
SCRATCH = '/tmp/claude-0/-home-user-kolo-srece/6c97336e-6769-5f60-9596-454c3ff23451/scratchpad/prev'


def compose(room, states=(), variant='', scale=4, debug=False):
    d = os.path.join(ROOT, room)
    meta = json.load(open(os.path.join(d, 'room.json')))
    bg = Image.open(os.path.join(d, f'bg{"_" + variant if variant else ""}.png')).convert('RGBA')
    objs = sorted(meta['objects'].items(), key=lambda kv: (kv[1].get('depth') or kv[1].get('baseline') or 0))
    for name, o in objs:
        if o.get('state') and name not in states:
            continue
        fn = os.path.join(d, f'obj_{name}{"_" + variant if variant and variant in o.get("variants", []) else ""}.png')
        if os.path.exists(fn):
            bg.alpha_composite(Image.open(fn).convert('RGBA'), (o['x'], o['y']))
    for name, a in meta.get('anims', {}).items():
        fn = os.path.join(d, f'anim_{name}.png')
        if os.path.exists(fn):
            strip = Image.open(fn).convert('RGBA')
            bg.alpha_composite(strip.crop((0, 0, a['w'], a['h'])), (a['x'], a['y']))
    img = bg.resize((bg.width * scale, bg.height * scale), Image.NEAREST)
    if debug:
        dr = ImageDraw.Draw(img)
        S = scale
        for wa in meta.get('walk', []):
            dr.polygon([(x * S, y * S) for x, y in wa['poly']], outline=(0, 255, 0))
            for hole in wa.get('holes', []):
                dr.polygon([(x * S, y * S) for x, y in hole], outline=(0, 160, 0))
        for hid, hs in meta.get('hotspots', {}).items():
            if 'poly' in hs:
                dr.polygon([(x * S, y * S) for x, y in hs['poly']], outline=(255, 230, 0))
                x0 = min(p[0] for p in hs['poly']) * S
                y0 = min(p[1] for p in hs['poly']) * S
                dr.text((x0 + 2, y0 + 1), hid, fill=(255, 255, 120))
            if 'walk' in hs:
                wx, wy = hs['walk']
                dr.ellipse((wx * S - 4, wy * S - 4, wx * S + 4, wy * S + 4), outline=(0, 255, 255))
        for pid, p in meta.get('points', {}).items():
            dr.ellipse((p['x'] * S - 5, p['y'] * S - 5, p['x'] * S + 5, p['y'] * S + 5), fill=(255, 40, 40))
            dr.text((p['x'] * S + 6, p['y'] * S - 6), pid, fill=(255, 120, 120))
    return img


if __name__ == '__main__':
    args = [a for a in sys.argv[1:]]
    debug = '--debug' in args
    out = None
    if '--out' in args:
        i = args.index('--out')
        out = args[i + 1]
        del args[i:i + 2]
    args = [a for a in args if a != '--debug']
    room = args[0]
    states = args[1].split(',') if len(args) > 1 and args[1] else []
    variant = args[2] if len(args) > 2 else ''
    os.makedirs(SCRATCH, exist_ok=True)
    out = out or os.path.join(SCRATCH, f'{room}{"_" + variant if variant else ""}{"_dbg" if debug else ""}.png')
    compose(room, states, variant, 4, debug).save(out)
    print(out)
