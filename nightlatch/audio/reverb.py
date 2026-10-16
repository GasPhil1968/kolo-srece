"""Synthesized room impulse responses + FFT convolution reverb.

An IR is built from decorrelated stereo noise split into octave bands, each band decaying
with its own RT60 (air/absorption makes highs die faster), plus discrete early reflections,
pre-delay and an echo-density build-up.  Different rooms (club, office, sanatorium corridor,
church, harbor, plate...) are presets of the same generator.
"""
from __future__ import annotations

import numpy as np

from synth import SR, ns, rng, filt, convolve, undb

BANDS = np.array([63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000], dtype=float)


def _band_masks(f: np.ndarray) -> np.ndarray:
    """Smooth octave-band partition of unity on a frequency grid."""
    lf = np.log2(np.maximum(f, 1.0))
    lb = np.log2(BANDS)
    masks = np.zeros((BANDS.size, f.size))
    for i in range(BANDS.size):
        if i == 0:
            m = np.where(lf <= lb[0], 1.0, 0.0)
        else:
            m = np.zeros_like(lf)
        if i > 0:
            u = np.clip((lf - lb[i - 1]) / (lb[i] - lb[i - 1]), 0, 1)
            m = np.where((lf > lb[i - 1]) & (lf <= lb[i]), np.sin(0.5 * np.pi * u) ** 2, m)
        if i < BANDS.size - 1:
            u = np.clip((lf - lb[i]) / (lb[i + 1] - lb[i]), 0, 1)
            m = np.where((lf > lb[i]) & (lf < lb[i + 1]), np.cos(0.5 * np.pi * u) ** 2, m)
        else:
            m = np.where(lf >= lb[i], 1.0, m)
        masks[i] = m
    return masks


PRESETS = {
    # rt: mid-band RT60 (s); lo/hi: RT multipliers at 63 Hz / 16 kHz; pre: pre-delay;
    # er: list of (delay_s, gain) early reflections; build: echo-density build-up (s)
    'plate':  dict(rt=1.9, lo=0.8, hi=0.55, pre=0.018, er=[], build=0.004, width=1.0,
                   lowcut=180, highcut=9000),
    'studio': dict(rt=1.3, lo=0.9, hi=0.45, pre=0.012,
                   er=[(0.007, 0.55), (0.011, 0.4), (0.017, 0.35), (0.023, 0.3), (0.031, 0.22)],
                   build=0.02, width=0.9, lowcut=120, highcut=8000),
    'room':   dict(rt=0.55, lo=1.1, hi=0.5, pre=0.004,
                   er=[(0.003, 0.7), (0.0055, 0.55), (0.009, 0.45), (0.013, 0.35), (0.019, 0.25)],
                   build=0.012, width=0.8, lowcut=100, highcut=7000),
    'club':   dict(rt=1.05, lo=1.25, hi=0.35, pre=0.008,
                   er=[(0.006, 0.6), (0.010, 0.5), (0.015, 0.45), (0.021, 0.4), (0.029, 0.3), (0.041, 0.22)],
                   build=0.025, width=0.85, lowcut=90, highcut=5500),
    'hall':   dict(rt=2.3, lo=1.2, hi=0.45, pre=0.024,
                   er=[(0.017, 0.35), (0.026, 0.3), (0.035, 0.28), (0.047, 0.22), (0.061, 0.18)],
                   build=0.06, width=1.0, lowcut=110, highcut=8000),
    'church': dict(rt=4.2, lo=1.15, hi=0.4, pre=0.035,
                   er=[(0.031, 0.3), (0.047, 0.28), (0.066, 0.24), (0.088, 0.2), (0.12, 0.16)],
                   build=0.09, width=1.0, lowcut=100, highcut=7000),
    'corridor': dict(rt=3.0, lo=1.0, hi=0.6, pre=0.012,
                     er=[(0.012 * k, 0.6 * 0.82 ** k) for k in range(1, 14)],  # flutter echo
                     build=0.05, width=0.9, lowcut=150, highcut=9000),
    'harbor': dict(rt=2.6, lo=1.0, hi=0.3, pre=0.06,
                   er=[(0.13, 0.35), (0.21, 0.28), (0.29, 0.22), (0.37, 0.16), (0.52, 0.12)],
                   build=0.25, width=1.0, lowcut=80, highcut=4000, density=0.35),
    'tunnel': dict(rt=2.8, lo=1.3, hi=0.4, pre=0.02,
                   er=[(0.055 * k, 0.55 * 0.78 ** k) for k in range(1, 12)],
                   build=0.08, width=0.8, lowcut=70, highcut=6000),
    'tile':   dict(rt=1.2, lo=0.9, hi=0.7, pre=0.006,
                   er=[(0.004, 0.6), (0.008, 0.5), (0.0125, 0.45), (0.018, 0.35), (0.025, 0.3)],
                   build=0.015, width=0.85, lowcut=120, highcut=10000),
    'metal':  dict(rt=0.9, lo=0.8, hi=0.8, pre=0.003,
                   er=[(0.0041 * k, 0.55 * 0.85 ** k) for k in range(1, 18)],
                   build=0.01, width=0.7, lowcut=150, highcut=9000),
    'hold':   dict(rt=1.6, lo=1.3, hi=0.45, pre=0.008,
                   er=[(0.0063 * k, 0.5 * 0.86 ** k) for k in range(1, 14)],
                   build=0.03, width=0.85, lowcut=60, highcut=6000),
    'outdoor': dict(rt=1.2, lo=1.0, hi=0.4, pre=0.03,
                    er=[(0.09, 0.25), (0.17, 0.18), (0.26, 0.12)],
                    build=0.15, width=1.0, lowcut=80, highcut=6000, density=0.5),
    'booth':  dict(rt=0.35, lo=1.0, hi=0.6, pre=0.002,
                   er=[(0.002, 0.6), (0.0037, 0.5), (0.0055, 0.4)],
                   build=0.006, width=0.6, lowcut=120, highcut=9000),
}

_IR_CACHE: dict = {}


def make_ir(name: str = 'plate', seed: int = 7, **over) -> np.ndarray:
    key = (name, seed, tuple(sorted(over.items())))
    if key in _IR_CACHE:
        return _IR_CACHE[key]
    p = dict(PRESETS[name])
    p.update(over)
    rt = float(p['rt'])
    length = rt * 1.25 + p['pre'] + 0.1
    n = ns(length)
    r = rng('ir', name, seed)
    noise = r.standard_normal((2, n))
    density = p.get('density', 1.0)
    if density < 1.0:
        # sparser (outdoor) tails: keep only the strongest grains
        g = np.abs(r.standard_normal((2, n)))
        noise *= (g > np.quantile(g, 1 - density)) / np.sqrt(density)
    N = n
    F = np.fft.rfft(noise, axis=-1)
    f = np.fft.rfftfreq(N, 1 / SR)
    masks = _band_masks(f)
    t = np.arange(n) / SR
    # RT per band: interpolate multipliers in log-frequency (lo at 63 Hz, 1 at 1 kHz, hi at 16 kHz)
    lb = np.log2(BANDS)
    mult = np.interp(lb, [np.log2(63), np.log2(1000), np.log2(16000)], [p['lo'], 1.0, p['hi']])
    tail = np.zeros((2, n))
    pre = ns(p['pre'])
    tt = np.maximum(t - p['pre'], 0)
    for i in range(BANDS.size):
        band = np.fft.irfft(F * masks[i], N, axis=-1)
        tail += band * np.exp(-6.907755 * tt / (rt * mult[i]))
    # echo density build-up after pre-delay
    build = max(p['build'], 0.002)
    ramp = np.clip((t - p['pre']) / build, 0, 1)
    tail *= np.sin(0.5 * np.pi * ramp) ** 2
    tail[:, :pre] = 0.0
    # early reflections (slightly smeared impulses, alternating L/R emphasis)
    er = np.zeros((2, n))
    smear = np.hanning(9)
    smear /= smear.sum()
    for j, (d, g) in enumerate(p['er']):
        k = ns(d)
        if k + 9 >= n:
            continue
        lr = 0.75 + 0.25 * (1 if j % 2 == 0 else -1)
        jit = int(r.integers(0, 3))
        er[0, k:k + 9] += g * lr * smear * 2.2
        er[1, k + jit:k + jit + 9] += g * (1.5 - lr) * smear * 2.2
    # normalise tail energy so that er gains are relative to a unit-energy tail
    tail /= np.sqrt(np.sum(tail ** 2) / 2.0) + 1e-12
    er_e = np.sqrt(np.sum(er ** 2) / 2.0)
    er_level = p.get('er_level', 0.5)
    ir = tail + er * (er_level / er_e) if er_e > 0 else tail
    # stereo width
    w = p.get('width', 1.0)
    m = 0.5 * (ir[0] + ir[1])
    s = 0.5 * (ir[0] - ir[1]) * w
    ir = np.vstack([m + s, m - s])
    ir = filt(ir, [('bhp', p['lowcut'], 2), ('blp', p['highcut'], 2)], tail=0.05)
    # final fade so the IR ends at exactly zero
    fl = ns(0.05)
    ir[:, -fl:] *= np.linspace(1, 0, fl)
    ir /= np.sqrt(np.sum(ir ** 2) / 2.0) + 1e-12
    _IR_CACHE[key] = ir
    return ir


def reverb(x: np.ndarray, name: str = 'plate', circular: bool = False, keep_tail: bool = True,
           seed: int = 7, **over) -> np.ndarray:
    """Return the 100% wet stereo reverb of mono/stereo x (unit-energy IR)."""
    ir = make_ir(name, seed, **over)
    if x.ndim == 1:
        x = np.vstack([x, x]) * 0.7071
    y = convolve(x, ir, circular=circular, keep_tail=keep_tail)
    return y
