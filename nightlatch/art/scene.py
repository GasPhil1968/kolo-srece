"""Scene wrapper: background + object layers + metadata export.

Objects drawn inside `with scene.obj(name, baseline=..)` are tracked by an owner buffer, so
they can be exported as sprites (for depth occlusion or state changes) with exactly the
lighting of the finished background.
"""
from __future__ import annotations

import copy
import json
import os
from contextlib import contextmanager

import numpy as np

from core import Canvas, save_png, out_path


class Scene:
    def __init__(self, name: str, w: int, h: int = 144, seed: int = 7):
        self.name = name
        self.c = Canvas(w, h, seed)
        self.c.owner = np.zeros((h, w), np.int16)
        self.c.cur_owner = 0
        self._wrap_apply(self.c)
        self.objects: list[dict] = []
        self.state_canvases: dict[str, Canvas] = {}
        self.meta: dict = {'name': name, 'w': w, 'h': h, 'hotspots': {}, 'walk': [], 'points': {},
                           'objects': {}, 'variants': [], 'anims': {}}

    @staticmethod
    def _wrap_apply(c: Canvas):
        orig = c._apply.__func__

        def _apply(self, mask, ramp_name, lum, emis=None, dith=None, region=None):
            orig(self, mask, ramp_name, lum, emis=emis, dith=dith, region=region)
            if region is not None:
                x0, y0, x1, y1 = region
                self.owner[y0:y1, x0:x1][mask] = self.cur_owner
            else:
                self.owner[mask] = self.cur_owner
        import types
        c._apply = types.MethodType(_apply, c)
        orig_put = c.put.__func__

        def put(self, x, y, ramp_name, lum, emis=0.0):
            orig_put(self, x, y, ramp_name, lum, emis)
            x, y = int(x), int(y)
            if 0 <= x < self.w and 0 <= y < self.h:
                self.owner[y, x] = self.cur_owner
        c.put = types.MethodType(put, c)

    @contextmanager
    def obj(self, name: str, baseline: int | None = None, state: bool = False, depth: int | None = None):
        """Draw an object. state=True keeps it out of the background (drawn on a clone)."""
        oid = len(self.objects) + 1
        rec = {'name': name, 'id': oid, 'baseline': baseline, 'state': state, 'depth': depth}
        self.objects.append(rec)
        if state:
            clone = copy.deepcopy(self.c)   # deepcopy re-binds the wrapped methods
            clone.cur_owner = oid
            self.state_canvases[name] = clone
            yield clone
        else:
            prev = self.c.cur_owner
            self.c.cur_owner = oid
            yield self.c
            self.c.cur_owner = prev

    def anim(self, name: str, draw_fns, fps: float = 8, depth: int | None = None, variant_fns=None):
        """Ambient animation: each draw_fn(canvas) draws one frame on a clone of the background.
        Frames are exported as a horizontal strip anim_<name>.png (union bounding box)."""
        self.anims_src = getattr(self, 'anims_src', [])
        self.anims_src.append((name, draw_fns, fps, depth))

    def _export_anims(self, folder, bg_kw):
        for (name, fns, fps, depth) in getattr(self, 'anims_src', []):
            frames, masks = [], []
            aid = 30000
            for fn in fns:
                cc = copy.deepcopy(self.c)
                cc.cur_owner = aid
                fn(cc)
                frames.append(cc.render(**bg_kw))
                masks.append(cc.owner == aid)
            union = np.zeros_like(masks[0])
            for m in masks:
                union |= m
            if not union.any():
                continue
            ys, xs = np.nonzero(union)
            x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
            fw, fh = x1 - x0, y1 - y0
            strip = np.zeros((fh, fw * len(frames), 4), np.uint8)
            for i, (img, m) in enumerate(zip(frames, masks)):
                strip[:, i * fw:(i + 1) * fw, :3] = img[y0:y1, x0:x1]
                strip[:, i * fw:(i + 1) * fw, 3] = np.where(m[y0:y1, x0:x1], 255, 0)
            save_png(strip, os.path.join(folder, f'anim_{name}.png'))
            self.meta['anims'][name] = {'x': int(x0), 'y': int(y0), 'w': int(fw), 'h': int(fh),
                                        'frames': len(frames), 'fps': fps, 'depth': depth}

    def rain(self, x0, y0, x1, y1, density=1.0, kind='window'):
        """Region where the game draws animated rain streaks (window = behind glass, outdoor = full)."""
        self.meta.setdefault('rain', []).append({'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0,
                                                 'density': density, 'kind': kind})

    # metadata helpers ----------------------------------------------------------------
    def hotspot(self, hid: str, rect=None, poly=None, walk=None, face=None):
        hs = {}
        if rect is not None:
            x0, y0, x1, y1 = rect
            hs['poly'] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
        if poly is not None:
            hs['poly'] = [list(p) for p in poly]
        if walk is not None:
            hs['walk'] = list(walk)
        if face is not None:
            hs['face'] = face
        self.meta['hotspots'][hid] = hs

    def walkable(self, poly, holes=None):
        self.meta['walk'].append({'poly': [list(p) for p in poly], 'holes': [[list(p) for p in h] for h in (holes or [])]})

    def point(self, pid: str, x, y, face=None):
        self.meta['points'][pid] = {'x': x, 'y': y, **({'face': face} if face else {})}

    def scale(self, y_far, s_far, y_near, s_near):
        self.meta['scale'] = {'yFar': y_far, 'sFar': s_far, 'yNear': y_near, 'sNear': s_near}

    # export ---------------------------------------------------------------------------
    def export(self, variants: dict | None = None, base_kw: dict | None = None):
        """variants: name -> callable(canvas_copy) -> render kwargs dict (or None)."""
        base_kw = base_kw or {}
        folder = out_path('rooms', self.name)
        os.makedirs(folder, exist_ok=True)
        bg = self.c.render(**base_kw)
        save_png(bg, os.path.join(folder, 'bg.png'))
        self._export_objects(self.c, bg, folder, '')
        for vname, fn in (variants or {}).items():
            cc = copy.deepcopy(self.c)
            kw = fn(cc) or {}
            img = cc.render(**kw)
            save_png(img, os.path.join(folder, f'bg_{vname}.png'))
            self.meta['variants'].append(vname)
            self._export_objects(cc, img, folder, vname, vfn=fn)
        self._export_anims(folder, base_kw)
        with open(os.path.join(folder, 'room.json'), 'w') as f:
            json.dump(self.meta, f, indent=1)
        return bg

    def _export_objects(self, c: Canvas, bg: np.ndarray, folder: str, variant: str, vfn=None):
        suffix = ('_' + variant) if variant else ''
        for rec in self.objects:
            name = rec['name']
            if rec['state']:
                sc = copy.deepcopy(self.state_canvases[name])
                if vfn is not None:
                    kw = vfn(sc) or {}
                else:
                    kw = {}
                img = sc.render(**kw)
                mask = sc.owner == rec['id']
            else:
                if rec['baseline'] is None and rec['depth'] is None:
                    continue
                img = bg
                mask = c.owner == rec['id']
            if not mask.any():
                continue
            ys, xs = np.nonzero(mask)
            x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
            rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
            rgba[..., :3] = img[y0:y1, x0:x1]
            rgba[..., 3] = np.where(mask[y0:y1, x0:x1], 255, 0)
            save_png(rgba, os.path.join(folder, f'obj_{name}{suffix}.png'))
            if not variant:
                self.meta['objects'][name] = {'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0),
                                              'baseline': rec['baseline'], 'state': rec['state'],
                                              'depth': rec['depth']}
            else:
                self.meta['objects'].setdefault(name, {}).setdefault('variants', []).append(variant)
