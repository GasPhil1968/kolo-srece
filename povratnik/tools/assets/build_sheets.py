"""Chapter sprite sheets, props and inventory icons from the original artwork.

* SHEETS: frame extraction from regular grids or explicit rectangles, fragment and fringe clean-up,
  planted anchors, per-animation timing -> atlases (public/assets/atlas) + character metadata
  (src/content/generated/characters.sheets.json, same format as the shared characters).
* PROPS: single images copied unchanged (WebP) or converted (PNG) -> public/assets/props.
* ICONS: inventory icons cropped from icon sheets or props -> public/assets/items (96 px).

Run: POVRATNIK_REF=<old project> python3 tools/assets/build_sheets.py [keys...]
"""
from __future__ import annotations

import json
import os
import shutil
import sys

import numpy as np
from PIL import Image, ImageDraw

from common import GENERATED, PUBLIC, Atlas, Frame, bbox, defringe, ensure_dir, keep_main_blob, load_rgba, pack, ref, save_webp, torso_center_x
from sheet_specs import ICONS, PROPS, SHEETS


def grid_rects(spec: dict, img: np.ndarray) -> list[tuple[int, int, int, int]]:
    if 'rects' in spec:
        return [tuple(r) for r in spec['rects']]
    cols, rows = spec['grid']
    cw = spec.get('cell', (img.shape[1] // cols, img.shape[0] // rows))[0]
    ch = spec.get('cell', (img.shape[1] // cols, img.shape[0] // rows))[1]
    return [(c * cw, r * ch, cw, ch) for r in range(rows) for c in range(cols)]


def apply_patch(cell: np.ndarray, patch: dict) -> np.ndarray:
    """Paste an object image into a cell, rotated about its anchor point: an item a painted hand is
    missing in a single frame (a sword the neighbouring frames show) is put back from the same artwork."""
    import math
    obj = Image.open(ref(patch['src'])).convert('RGBA')
    ax, ay = patch['anchor']
    pad = int(max(obj.width, obj.height) * 2)
    big = Image.new('RGBA', (pad, pad), (0, 0, 0, 0))
    big.alpha_composite(obj, (int(pad / 2 - ax), int(pad / 2 - ay)))
    rot = big.rotate(-math.degrees(patch.get('rot', 0.0)), resample=Image.BICUBIC, center=(pad / 2, pad / 2))
    base = Image.fromarray(cell)
    hx, hy = patch['at']
    base.alpha_composite(rot, (int(hx - pad / 2), int(hy - pad / 2)))
    return np.array(base)


def source_cells(spec: dict) -> list[np.ndarray]:
    img = load_rgba(ref(spec['src']))
    cells = []
    patches = spec.get('patches', {})
    for i, (x, y, w, h) in enumerate(grid_rects(spec, img)):
        c = img[y:y + h, x:x + w].copy()
        for patch in patches.get(i, []):
            c = apply_patch(c, patch)
        if spec.get('clean', True):
            c, _ = keep_main_blob(c, near=spec.get('near', 6))
        cells.append(c)
    return cells


def build_sheet(key: str, spec: dict) -> dict:
    """Frames are ints (cells of the main source) or '<prefix><n>' strings for cells of an `extra` source
    (e.g. a walk cycle painted on another sheet of the same animal)."""
    sources = {'': spec, **{p: {**spec, **{k: v for k, v in sub.items()}} for p, sub in spec.get('extra', {}).items()}}
    for p, sub in spec.get('extra', {}).items():  # extra sources default to their own anchoring
        for k in ('anchors', 'anchor', 'anchor_x', 'ground', 'rects', 'patches'):
            if k not in sub:
                sources[p].pop(k, None)
    cells_by = {p: source_cells(src) for p, src in sources.items()}
    anims: dict = spec['anims']

    def split(fid):
        if isinstance(fid, int):
            return '', fid
        p = fid.rstrip('0123456789')
        return p, int(fid[len(p):])

    used = sorted({f for a in anims.values() for f in a['frames']}, key=lambda f: (split(f)[0], split(f)[1]))
    atlas = Atlas(key)
    for prefix, src in sources.items():
        mine = [split(f)[1] for f in used if split(f)[0] == prefix]
        if not mine:
            continue
        cells = cells_by[prefix]
        anchor_mode = src.get('anchor', 'feet')
        # Ground line per source (planted feet): lowest opaque row over the frames used.
        ground_all = max((bbox(cells[i][:, :, 3]) or (0, 0, 0, 0))[3] for i in mine)
        fixed_x = src.get('anchor_x')
        for i in mine:
            c = cells[i]
            if src.get('defringe', True):
                c, _ = defringe(c)
            b = bbox(c[:, :, 3])
            if b is None:
                raise SystemExit(f'{key}: empty frame {prefix}{i}')
            x0, y0, x1, y1 = b
            if 'anchors' in src:  # per-frame explicit anchors (rect-relative)
                ax, gy = src['anchors'][i]
            elif anchor_mode == 'feet':
                gy = src.get('ground', ground_all)
                ax = fixed_x if fixed_x is not None else torso_center_x(c[:, :, 3], y0, y1)
            elif anchor_mode == 'bottom':  # seated figures, props: bottom centre of the cell content
                gy = src.get('ground', ground_all)
                ax = fixed_x if fixed_x is not None else c.shape[1] / 2
            else:  # explicit [ax, ay] in cell coordinates
                ax, gy = anchor_mode
            # Trim with padding so the anchor stays inside the frame.
            pad = 1
            tx0, ty0 = max(0, min(x0, int(ax)) - pad), max(0, y0 - pad)
            tx1, ty1 = min(c.shape[1], max(x1, int(ax) + 1) + pad), min(c.shape[0], max(y1, int(gy)) + pad)
            trimmed = c[ty0:ty1, tx0:tx1]
            atlas.frames.append(Frame(f'f{prefix}{i}', trimmed, ax - tx0, gy - ty0))
    frames_meta = pack(atlas, os.path.join(PUBLIC, 'atlas'))
    meta_anims = {}
    for name, a in anims.items():
        meta_anims[name] = {
            'frames': [f'f{i}' for i in a['frames']],
            'fps': a.get('fps', 8),
            'loop': a.get('loop', False),
            'refH': a.get('refH', spec['refH']),
        }
        if 'speed' in a:
            meta_anims[name]['speed'] = a['speed']
        if 'facing' in a:
            meta_anims[name]['facing'] = a['facing']
    out = {
        'atlas': f'atlas/{key}',
        'walkSpeed': spec.get('walkSpeed', 150),
        'anims': meta_anims,
        'frames': frames_meta,
        'source': spec['src'] + ''.join(f' + {sub["src"]}' for sub in spec.get('extra', {}).values()),
        'facing': spec.get('facing', 1),
    }
    if 'points' in spec:
        # Measured points per cell (cell coordinates), e.g. the end points of each discharge. The cells
        # are anchored at their origin, so these are also offsets from the anchor.
        pts = json.load(open(ref(spec['points'])))['endpointSourceAnchors']
        out['points'] = {f'f{i}': pts[i] for i in sorted({split(f)[1] for f in used if split(f)[0] == ''})}
    if 'anchorPoints' in spec:
        # Points measured by eye in each cell, given as offsets from the anchor (source pixels).
        out['points'] = {f'f{i}': [list(p) for p in pts] for i, pts in spec['anchorPoints'].items()}
    return out


def build_props(only: set[str]) -> dict:
    out = {}
    for key, spec in PROPS.items():
        if only and key not in only:
            continue
        src = spec if isinstance(spec, str) else spec['src']
        dst = os.path.join(PUBLIC, 'props', f'{key}.webp')
        ensure_dir(os.path.dirname(dst))
        im = Image.open(ref(src))
        crop = None if isinstance(spec, str) else spec.get('crop')
        # Top-left corner of the output inside the crop (pieces cut from one painting are placed
        # against each other with it).
        ox, oy = 0, 0
        processed = not isinstance(spec, str) and any(k in spec for k in ('crop', 'poly', 'clean', 'rotate', 'tile', 'mul', 'gain', 'cloth'))
        if src.endswith('.webp') and not processed:
            shutil.copyfile(ref(src), dst)
        else:
            im = im.convert('RGBA')
            if crop:  # [x, y, w, h]
                x, y, w, h = crop
                im = im.crop((x, y, x + w, y + h))
            if not isinstance(spec, str) and spec.get('poly'):
                # Keep only the pixels inside a polygon (one object standing on another, e.g. the jug
                # lifted off the cloth it stood on), then trim.
                mask = Image.new('L', im.size, 0)
                ImageDraw.Draw(mask).polygon([tuple(p) for p in spec['poly']], fill=255)
                a = np.array(im)
                a[:, :, 3] = (a[:, :, 3].astype(np.uint16) * (np.array(mask) // 255)).astype(np.uint8)
                b = bbox(a[:, :, 3], 20)
                im = Image.fromarray(a).crop(b) if b else Image.fromarray(a)
                if b:
                    ox, oy = ox + b[0], oy + b[1]
            if not isinstance(spec, str) and spec.get('rotate'):
                # Turned about its centre (a beam lying level instead of askew); no longer aligned.
                im = im.rotate(spec['rotate'], resample=Image.BICUBIC, expand=True)
                ox, oy = 0, 0
            if not isinstance(spec, str) and spec.get('tile'):
                # A rope made longer by repeating a stretch of the same rope (a whole number of twists).
                n = int(spec['tile'])
                long = Image.new('RGBA', (im.width, im.height * n), (0, 0, 0, 0))
                for i in range(n):
                    long.alpha_composite(im, (0, i * im.height))
                im = long
            if not isinstance(spec, str) and (spec.get('mul') or spec.get('gain')):
                # Colour multiplied (wet cloth is darker and cooler) and alpha raised (a faint ripple
                # strip made dense enough to read as a puddle on a dark floor).
                a = np.array(im).astype(np.float32)
                if spec.get('mul'):
                    a[:, :, :3] *= np.array(spec['mul'], np.float32)
                if spec.get('gain'):
                    a[:, :, 3] *= float(spec['gain'])
                im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
            if not isinstance(spec, str) and spec.get('cloth'):
                # A patch of uniform cloth matched to the colour of the uniform it is worn on: only the
                # blue cloth is shifted (weighted by how blue a pixel is); skin, blood and linen keep theirs.
                a = np.array(im).astype(np.float32)
                rgb = a[:, :, :3]
                w = np.clip((rgb[:, :, 2] - rgb[:, :, 0] - 4) / 12, 0, 1)[..., None]
                ratio = np.array(spec['cloth'][1], np.float32) / np.array(spec['cloth'][0], np.float32)
                a[:, :, :3] = rgb * (1 - w) + rgb * ratio * w
                im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
            if not isinstance(spec, str) and spec.get('clean'):
                # A single object cut from an icon sheet: drop slivers of the neighbouring cells, trim.
                a, _ = keep_main_blob(np.array(im), near=spec.get('near', 8))
                b = bbox(a[:, :, 3], 20)
                im = Image.fromarray(a).crop(b) if b else Image.fromarray(a)
                if b:
                    ox, oy = ox + b[0], oy + b[1]
            save_webp(im, dst, quality=92)
            im = Image.open(dst)
        out[key] = {'file': f'props/{key}.webp', 'w': im.width, 'h': im.height, 'source': src}
        if crop and not (not isinstance(spec, str) and spec.get('rotate')):
            out[key]['origin'] = [crop[0] + ox, crop[1] + oy]
    return out


def build_icons(only: set[str]) -> None:
    out_dir = os.path.join(PUBLIC, 'items')
    ensure_dir(out_dir)
    for key, spec in ICONS.items():
        if only and key not in only:
            continue
        im = Image.open(ref(spec['src'])).convert('RGBA')
        if 'cell' in spec:
            cols, rows, idx = spec['cell']
            cw, ch = im.width // cols, im.height // rows
            x, y = (idx % cols) * cw, (idx // cols) * ch
            im = im.crop((x, y, x + cw, y + ch))
        elif 'crop' in spec:
            im = im.crop(tuple(spec['crop']))
        a = np.array(im)
        a, _ = keep_main_blob(a, near=spec.get('near', 10))
        b = bbox(a[:, :, 3], 20)
        if b is None:
            raise SystemExit(f'icon {key}: empty')
        im = Image.fromarray(a).crop(b)
        size = 96
        s = min((size - 8) / im.width, (size - 8) / im.height)
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        canvas.alpha_composite(im, ((size - im.width) // 2, (size - im.height) // 2))
        save_webp(canvas, os.path.join(out_dir, f'{key}.webp'), quality=92)
        print('icon', key)


def check_unique_keys() -> None:
    """A key written twice in sheet_specs.py silently replaces the first entry (a Python dict literal):
    refuse to build until every sheet, prop and icon key is unique."""
    import ast
    src = open(os.path.join(os.path.dirname(__file__), 'sheet_specs.py')).read()
    for node in ast.walk(ast.parse(src)):
        if isinstance(node, ast.Assign) and isinstance(node.value, ast.Dict) and isinstance(node.targets[0], ast.Name):
            keys = [k.value for k in node.value.keys if isinstance(k, ast.Constant)]
            dup = sorted({k for k in keys if keys.count(k) > 1})
            if dup:
                raise SystemExit(f'sheet_specs.{node.targets[0].id}: duplicate keys {dup}')


def main() -> None:
    check_unique_keys()
    only = set(sys.argv[1:])
    path = os.path.join(GENERATED, 'characters.sheets.json')
    chars = json.load(open(path)) if os.path.exists(path) else {}
    for key, spec in SHEETS.items():
        if only and key not in only:
            continue
        chars[key] = build_sheet(key, spec)
        print('sheet', key, len(chars[key]['frames']), 'frames')
    ensure_dir(GENERATED)
    with open(path, 'w') as fh:
        json.dump(chars, fh, indent=1, sort_keys=True)
    props = build_props(only)
    ipath = os.path.join(GENERATED, 'images.json')
    images = json.load(open(ipath)) if os.path.exists(ipath) else {}
    images.update(props)
    with open(ipath, 'w') as fh:
        json.dump(images, fh, indent=1, sort_keys=True)
    build_icons(only)


if __name__ == '__main__':
    main()
