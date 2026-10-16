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
from PIL import Image

from common import GENERATED, PUBLIC, Atlas, Frame, bbox, defringe, ensure_dir, keep_main_blob, load_rgba, pack, ref, save_webp, torso_center_x
from sheet_specs import ICONS, PROPS, SHEETS


def grid_rects(spec: dict, img: np.ndarray) -> list[tuple[int, int, int, int]]:
    if 'rects' in spec:
        return [tuple(r) for r in spec['rects']]
    cols, rows = spec['grid']
    cw = spec.get('cell', (img.shape[1] // cols, img.shape[0] // rows))[0]
    ch = spec.get('cell', (img.shape[1] // cols, img.shape[0] // rows))[1]
    return [(c * cw, r * ch, cw, ch) for r in range(rows) for c in range(cols)]


def source_cells(spec: dict) -> list[np.ndarray]:
    img = load_rgba(ref(spec['src']))
    cells = []
    for (x, y, w, h) in grid_rects(spec, img):
        c = img[y:y + h, x:x + w].copy()
        if spec.get('clean', True):
            c, _ = keep_main_blob(c, near=spec.get('near', 6))
        cells.append(c)
    return cells


def build_sheet(key: str, spec: dict) -> dict:
    """Frames are ints (cells of the main source) or '<prefix><n>' strings for cells of an `extra` source
    (e.g. a walk cycle painted on another sheet of the same animal)."""
    sources = {'': spec, **{p: {**spec, **{k: v for k, v in sub.items()}} for p, sub in spec.get('extra', {}).items()}}
    for p, sub in spec.get('extra', {}).items():  # extra sources default to their own anchoring
        for k in ('anchors', 'anchor', 'anchor_x', 'ground', 'rects'):
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
    return {
        'atlas': f'atlas/{key}',
        'walkSpeed': spec.get('walkSpeed', 150),
        'anims': meta_anims,
        'frames': frames_meta,
        'source': spec['src'] + ''.join(f' + {sub["src"]}' for sub in spec.get('extra', {}).values()),
        'facing': spec.get('facing', 1),
    }


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
        if src.endswith('.webp') and not crop:
            shutil.copyfile(ref(src), dst)
        else:
            im = im.convert('RGBA')
            if crop:
                im = im.crop(tuple(crop))
            save_webp(im, dst, quality=92)
            im = Image.open(dst)
        out[key] = {'file': f'props/{key}.webp', 'w': im.width, 'h': im.height, 'source': src}
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


def main() -> None:
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
