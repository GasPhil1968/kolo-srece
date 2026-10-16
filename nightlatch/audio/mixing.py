"""Mix-bus and mastering processors (vectorised, loop-aware)."""
from __future__ import annotations

import numpy as np

from synth import SR, ns, filt, moving_avg, moving_min, undb, todb, rms


def _mono_power(x: np.ndarray) -> np.ndarray:
    return (x * x).mean(axis=0) if x.ndim == 2 else x * x


def compress(x: np.ndarray, thresh_db: float = -24.0, ratio: float = 2.0, attack: float = 0.01,
             release: float = 0.18, knee_db: float = 6.0, window: float = 0.02,
             circular: bool = False, makeup_db: float = 0.0) -> np.ndarray:
    """Feed-forward RMS compressor with soft knee.  Gain smoothing is symmetric (offline
    lookahead): running-min hold over attack+release/2, then a moving average."""
    p = moving_avg(_mono_power(x), max(1, ns(window)), circular)
    lvl = 10 * np.log10(p + 1e-20)
    over = lvl - thresh_db
    slope = 1.0 / ratio - 1.0
    gr = np.where(over <= -knee_db / 2, 0.0,
                  np.where(over >= knee_db / 2, slope * over, slope * (over + knee_db / 2) ** 2 / (2 * knee_db)))
    g = moving_min(gr, max(1, ns(attack + release * 0.5)), circular)
    g = moving_avg(g, max(1, ns(release)), circular)
    return x * undb(g + makeup_db)


def limit(x: np.ndarray, ceiling_db: float = -1.5, circular: bool = False) -> np.ndarray:
    """Transparent lookahead peak limiter; guarantees |y| <= ceiling."""
    c = float(undb(ceiling_db))
    pk = np.max(np.abs(x), axis=0) if x.ndim == 2 else np.abs(x)
    need = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    gdb = 20 * np.log10(need)
    if gdb.min() >= 0:
        return x
    g1 = moving_min(gdb, ns(0.008), circular)
    g1 = moving_avg(g1, ns(0.006), circular)
    g2 = moving_min(gdb, ns(0.08), circular)
    g2 = moving_avg(g2, ns(0.06), circular)
    g = np.minimum(g1, g2 * 0.5 + g1 * 0.5)
    y = x * undb(g)
    # numerical safety
    m = np.max(np.abs(y))
    if m > c:
        y *= c / m
    return y


def k_weight(x: np.ndarray, circular: bool = False) -> np.ndarray:
    return filt(x, [('hs', 1680, 0.707, 4.0), ('hp', 38, 0.5)], circular=circular, tail=0.2)


def loudness(x: np.ndarray) -> float:
    """Approximate integrated loudness (LUFS, BS.1770 K-weighting with absolute + relative
    gating on 400 ms blocks)."""
    if x.ndim == 1:
        x = x[None]
    y = k_weight(x)
    blk = ns(0.4)
    hop = ns(0.1)
    n = y.shape[-1]
    p = np.sum(y * y, axis=0) if y.shape[0] == 2 else 2 * y[0] * y[0]
    if n < blk:
        return float(-0.691 + 10 * np.log10(np.mean(p) + 1e-20))
    c = np.concatenate([[0.0], np.cumsum(p)])
    starts = np.arange(0, n - blk + 1, hop)
    z = (c[starts + blk] - c[starts]) / blk
    l = -0.691 + 10 * np.log10(z + 1e-20)
    keep = l > -70
    if not np.any(keep):
        return -70.0
    zr = z[keep]
    rel = -0.691 + 10 * np.log10(zr.mean()) - 10
    keep2 = l > max(rel, -70)
    return float(-0.691 + 10 * np.log10(z[keep2].mean() + 1e-20))


def master(x: np.ndarray, circular: bool, target_rms_db: float = -20.0, ceiling_db: float = -1.5,
           eq=None, glue: float = 1.0, sat: float = 0.0, width: float | None = None) -> np.ndarray:
    """EQ → glue compression → saturation → RMS normalisation → limiter → DC block."""
    y = x
    spec = [('bhp', 28, 2)] + (eq or [])
    y = filt(y, spec, circular=circular, tail=0.6)
    if width is not None and y.ndim == 2:
        m = 0.5 * (y[0] + y[1])
        s = 0.5 * (y[0] - y[1]) * width
        y = np.vstack([m + s, m - s])
    if glue > 0:
        r = rms(y)
        thr = 20 * np.log10(r + 1e-12) + 4.0
        y = compress(y, thresh_db=thr, ratio=1.0 + 1.0 * glue, attack=0.015, release=0.25,
                     window=0.03, circular=circular)
    if sat > 0:
        pk = np.max(np.abs(y)) + 1e-12
        z = y / pk
        z = (1 - sat) * z + sat * np.tanh(1.6 * z) / np.tanh(1.6)
        y = z * pk
    # normalise RMS, then limit, iterate once so the limiter does not drag RMS down much
    for _ in range(3):
        y = y * (undb(target_rms_db) / (rms(y) + 1e-12))
        y = limit(y, ceiling_db, circular=circular)
        if abs(20 * np.log10(rms(y) + 1e-12) - target_rms_db) < 0.25:
            break
    return y
