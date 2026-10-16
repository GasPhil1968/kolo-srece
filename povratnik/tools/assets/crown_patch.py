"""Restore a crown that was cut off in a character's idle cell, using the same character's own hair
from a walk frame. The walk frame is scaled and positioned by template matching on the head band just
below the cut, then only the missing rows above the cut are copied in. No pixels are invented.
"""
from __future__ import annotations

import numpy as np
from PIL import Image


def _resize(rgba: np.ndarray, k: float) -> np.ndarray:
    im = Image.fromarray(rgba)
    w, h = max(1, round(im.width * k)), max(1, round(im.height * k))
    return np.array(im.resize((w, h), Image.LANCZOS))


def restore_crown(idle: np.ndarray, walk: np.ndarray, band: int = 26, max_missing: int = 40) -> tuple[np.ndarray, dict]:
    """Return (patched idle cell, info). idle/walk are RGBA cells of the same character facing the same way."""
    a_i = idle[:, :, 3] > 127
    rows = np.nonzero(a_i.any(1))[0]
    t_i = rows[0]
    # Template: the head band just below the cut (opaque pixels only).
    tmpl = idle[t_i:t_i + band].astype(np.float32)
    tmask = tmpl[:, :, 3] > 127
    cols = np.nonzero(tmask.any(0))[0]
    c0, c1 = cols.min(), cols.max() + 1
    tmpl = tmpl[:, c0:c1]
    tmask = tmask[:, c0:c1]
    best = None
    a_w = walk[:, :, 3] > 127
    t_w = np.nonzero(a_w.any(1))[0][0]
    for k in np.arange(1.0, 1.30, 0.01):
        ws = _resize(walk, k).astype(np.float32)
        wm = ws[:, :, 3] > 127
        top = np.nonzero(wm.any(1))[0][0]
        # The cut lies some rows below the walk head top; search dy (cut row in scaled walk) and dx.
        for dy in range(top + 2, top + max_missing):
            if dy + band > ws.shape[0]:
                break
            for dx in range(-30, 31):
                x0 = c0 + dx
                if x0 < 0 or x0 + (c1 - c0) > ws.shape[1]:
                    continue
                cand = ws[dy:dy + band, x0:x0 + (c1 - c0)]
                cm = cand[:, :, 3] > 127
                both = tmask & cm
                if both.sum() < tmask.sum() * 0.6:
                    continue
                diff = np.abs(cand[:, :, :3] - tmpl[:, :, :3]).sum(2)
                # Penalise silhouette mismatch as well as colour difference.
                score = diff[both].mean() + 120.0 * (tmask ^ cm).sum() / max(1, tmask.sum())
                if best is None or score < best[0]:
                    best = (score, k, dy, dx, top)
    if best is None:
        return idle, {'patched': False}
    score, k, dy, dx, top = best
    ws = _resize(walk, k)
    missing = dy - top
    out = idle.copy()
    # Copy rows [top, dy) of the scaled walk frame into the idle cell above t_i, shifted by dx.
    for r in range(missing):
        src_r = dy - missing + r
        dst_r = t_i - missing + r
        if dst_r < 0:
            continue
        src = ws[src_r]
        for x in range(out.shape[1]):
            sx = x + dx
            if 0 <= sx < ws.shape[1] and src[sx, 3] > 0:
                out[dst_r, x] = src[sx]
    return out, {'patched': True, 'score': round(float(score), 1), 'scale': round(float(k), 3), 'rows': int(missing), 'dx': int(dx)}
