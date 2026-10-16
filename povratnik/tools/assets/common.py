"""Shared helpers for the POVRATNIK asset pipeline.

The pipeline only re-uses existing artwork from the old project (read-only reference):
verified frame extraction, transparent-padding crops, defringing of matte remnants,
atlas packing, WebP conversion and metadata. It never draws new imagery.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PUBLIC = os.path.join(ROOT, 'public', 'assets')
GENERATED = os.path.join(ROOT, 'src', 'content', 'generated')


def ref_root() -> str:
    """Location of the extracted old project (read-only)."""
    r = os.environ.get('POVRATNIK_REF')
    if not r or not os.path.isdir(r):
        raise SystemExit('Set POVRATNIK_REF to the extracted old project directory (the folder containing assets/ and js/).')
    return r


def ref(path: str) -> str:
    return os.path.join(ref_root(), 'assets', path)


def load_rgba(path: str) -> np.ndarray:
    return np.array(Image.open(path).convert('RGBA'))


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def bbox(alpha: np.ndarray, thr: int = 24):
    ys, xs = np.nonzero(alpha > thr)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def defringe(rgba: np.ndarray, lum_jump: float = 55.0, sat_max: float = 0.22) -> tuple[np.ndarray, int]:
    """Remove light matte remnants on silhouette edges.

    Edge pixels (opaque with a transparent 4-neighbour) that are clearly lighter and greyer than
    the opaque interior around them are replaced with the median colour of their opaque interior
    neighbours. Returns the cleaned image and the number of changed pixels.
    """
    img = rgba.copy()
    a = img[:, :, 3] > 127
    H, W = a.shape
    pad = np.pad(a, 1, constant_values=False)
    edge = a & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
    rgb = img[:, :, :3].astype(np.float32)
    lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
    mx = rgb.max(2)
    mn = rgb.min(2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    interior = a & ~edge
    changed = 0
    ys, xs = np.nonzero(edge)
    for y, x in zip(ys, xs):
        y0, y1, x0, x1 = max(0, y - 2), min(H, y + 3), max(0, x - 2), min(W, x + 3)
        m = interior[y0:y1, x0:x1]
        if m.sum() < 3:
            continue
        nb = rgb[y0:y1, x0:x1][m]
        nl = lum[y0:y1, x0:x1][m]
        if lum[y, x] - np.median(nl) > lum_jump and sat[y, x] < sat_max:
            img[y, x, :3] = np.median(nb, axis=0).astype(np.uint8)
            changed += 1
    return img, changed


def bleed(rgba: np.ndarray, iterations: int = 3) -> np.ndarray:
    """Copy edge colours into fully transparent neighbours (prevents dark/white halos when filtered)."""
    img = rgba.copy()
    a = img[:, :, 3] > 0
    rgb = img[:, :, :3].astype(np.int32)
    filled = a.copy()
    for _ in range(iterations):
        acc = np.zeros_like(rgb)
        cnt = np.zeros(a.shape, np.int32)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            sh = np.roll(filled, (dy, dx), (0, 1))
            sc = np.roll(rgb, (dy, dx), (0, 1))
            acc += sc * sh[:, :, None]
            cnt += sh
        new = (~filled) & (cnt > 0)
        rgb[new] = (acc[new] / cnt[new][:, None]).astype(np.int32)
        filled |= new
    img[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    return img


def torso_center_x(alpha: np.ndarray, top: int, bottom: int, lo: float = 0.28, hi: float = 0.52) -> float:
    """Median x of opaque pixels in the torso band of a figure (stable anchor across a walk cycle)."""
    h = bottom - top
    y0 = int(top + h * lo)
    y1 = max(y0 + 1, int(top + h * hi))
    band = alpha[y0:y1] > 127
    xs = np.nonzero(band)[1]
    if len(xs) == 0:
        xs = np.nonzero(alpha > 127)[1]
    return float(np.median(xs))


@dataclass
class Frame:
    name: str
    img: np.ndarray  # trimmed RGBA
    ax: float  # anchor in trimmed frame pixels
    ay: float


@dataclass
class Atlas:
    key: str
    frames: list[Frame] = field(default_factory=list)


def pack(atlas: Atlas, out_dir: str, max_w: int = 2048, pad: int = 2, quality: int = 92) -> dict:
    """Shelf-pack frames into one WebP + Phaser JSON-hash atlas. Returns frame metadata."""
    ensure_dir(out_dir)
    frames = sorted(atlas.frames, key=lambda f: -f.img.shape[0])
    x = y = shelf_h = 0
    W = 0
    placed = []
    for f in frames:
        h, w = f.img.shape[:2]
        if x + w + pad > max_w:
            x = 0
            y += shelf_h + pad
            shelf_h = 0
        placed.append((f, x, y))
        x += w + pad
        shelf_h = max(shelf_h, h)
        W = max(W, x)
    H = y + shelf_h
    sheet = np.zeros((H, W, 4), np.uint8)
    meta_frames = {}
    jf = {}
    for f, fx, fy in placed:
        h, w = f.img.shape[:2]
        sheet[fy:fy + h, fx:fx + w] = f.img
        jf[f.name] = {
            'frame': {'x': fx, 'y': fy, 'w': w, 'h': h},
            'rotated': False,
            'trimmed': False,
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h},
            'sourceSize': {'w': w, 'h': h},
        }
        meta_frames[f.name] = {'w': w, 'h': h, 'ax': round(f.ax / w, 5), 'ay': round(f.ay / h, 5)}
    sheet = bleed(sheet)
    img_name = f'{atlas.key}.webp'
    Image.fromarray(sheet, 'RGBA').save(os.path.join(out_dir, img_name), 'WEBP', quality=quality, method=6, exact=True)
    with open(os.path.join(out_dir, f'{atlas.key}.json'), 'w') as fh:
        json.dump({'frames': jf, 'meta': {'image': img_name, 'size': {'w': W, 'h': H}, 'scale': '1',
                                          'app': 'povratnik tools/assets'}}, fh, separators=(',', ':'))
    return meta_frames


def save_webp(img: Image.Image, path: str, quality: int = 90, lossless: bool = False) -> None:
    ensure_dir(os.path.dirname(path))
    if lossless:
        img.save(path, 'WEBP', lossless=True, method=6, exact=True)
    else:
        img.save(path, 'WEBP', quality=quality, method=6, exact=True)
