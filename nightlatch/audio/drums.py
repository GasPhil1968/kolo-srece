"""Percussion synthesis: jazz brushes, ride, hi-hat, kick, snare, toms, crash, woodblock,
rim click, timpani.  Discrete hits are cached samples with round-robin variants; the brush
swirl is a continuous noise texture driven by the beat grid."""
from __future__ import annotations

import math

import numpy as np

from synth import (SR, TAU, ns, tvec, rng, filt, mix_at, pan_gains, stft, istft, undb,
                   partials, lfo_noise)
from instruments import cached, _raised_cos, _ramp_in


def _env_exp(n, tau, att=0.002):
    e = np.exp(-tvec(n) / tau)
    a = max(2, ns(att))
    e[:a] *= _raised_cos(a)
    return e


def _end_fade(y, sec=0.01):
    f = min(len(y), ns(sec))
    y[-f:] *= np.linspace(1, 0, f)
    return y


def _wash(n, r, t60_fn, spec_db_fn, nfft=1024, hop=256):
    """Noise whose spectrum decays per frequency (metallic cymbal wash)."""
    x = r.standard_normal(n + nfft)
    X = stft(x, nfft, hop)
    f = np.fft.rfftfreq(nfft, 1 / SR)
    tt = (np.arange(X.shape[0]) * hop) / SR
    T = t60_fn(f)
    M = np.exp(-6.907755 * tt[:, None] / T[None, :]) * undb(spec_db_fn(f))[None, :]
    y = istft(X * M, n + nfft, nfft, hop)[:n]
    return y


# ----------------------------------------------------------------------------- hit synthesis
def _brush_tap(v, var, slap=False):
    r = rng('brushtap', v, var, slap)
    n = ns(0.45)
    nz = r.standard_normal(n)
    body = filt(nz, [('hp', 900, 0.7), ('lp', 6000, 0.7), ('pk', 3200, 1.2, 3)], tail=0.02)
    tau = 0.028 if not slap else 0.045
    y = body * _env_exp(n, tau, 0.0025)
    wires = filt(r.standard_normal(n), [('bp', 3500, 0.9)], tail=0.02) * _env_exp(n, 0.09 if slap else 0.07, 0.004)
    y += wires * (0.35 if slap else 0.25)
    head = (np.sin(TAU * 188 * tvec(n)) + 0.5 * np.sin(TAU * 331 * tvec(n) + 1)) * _env_exp(n, 0.035, 0.003)
    y += head * (0.25 if slap else 0.12)
    return _end_fade(y / (np.abs(y).max() + 1e-12))


def _ride(v, var):
    r = rng('ride', v, var)
    n = ns(4.2)

    def t60(f):
        return np.clip(4.2 * (1800.0 / np.maximum(f, 200)) ** 0.55, 0.25, 5.0)

    def sdb(f):
        return -5 * np.log2(np.maximum(f, 300) / 3500) ** 2 * 0.5 - 30 * (f < 400) - 6 * np.clip(np.log2(np.maximum(f, 1) / 8000), 0, 3)
    wash = _wash(n, r, t60, sdb)
    wash = filt(wash, [('bhp', 350, 2)], tail=0.02)
    wash /= np.abs(wash).max() + 1e-12
    # metallic partials (bell/ping)
    k = 70
    fr = np.exp(r.uniform(np.log(600), np.log(9000), k))
    am = r.uniform(0.2, 1.0, k) * (fr / 3000) ** -0.6
    T = np.clip(3.5 * (2000 / fr) ** 0.5 * r.uniform(0.6, 1.3, k), 0.3, 5.0)
    part = partials(fr, am, T, n, phases=r.uniform(0, TAU, k))
    part /= np.abs(part).max() + 1e-12
    ping_f = r.uniform(2900, 3600)
    ping = partials([ping_f, ping_f * 1.47, ping_f * 2.09], [1, 0.5, 0.3], [0.9, 0.6, 0.4], n)
    ping /= np.abs(ping).max() + 1e-12
    y = wash * 0.55 + part * 0.35 + ping * (0.35 + 0.25 * v)
    # stick click
    kn = ns(0.006)
    click = filt(r.standard_normal(kn), [('bp', 6500, 0.8)], tail=0.003) * _env_exp(kn, 0.0012, 0.0006)
    y[:kn] += click * 0.6
    att = ns(0.0015)
    y[:att] *= _raised_cos(att)
    return _end_fade(y / (np.abs(y).max() + 1e-12), 0.2)


def _crash(v, var):
    r = rng('crash', v, var)
    n = ns(3.5)

    def t60(f):
        return np.clip(2.8 * (2500.0 / np.maximum(f, 200)) ** 0.35, 0.4, 3.5)

    def sdb(f):
        return -4 * np.log2(np.maximum(f, 300) / 5000) ** 2 * 0.4
    wash = _wash(n, r, t60, sdb)
    wash = filt(wash, [('bhp', 300, 2)], tail=0.02)
    wash /= np.abs(wash).max() + 1e-12
    k = 50
    fr = np.exp(r.uniform(np.log(400), np.log(9000), k))
    part = partials(fr, r.uniform(0.2, 1, k), np.clip(2.5 * (2000 / fr) ** 0.4, 0.3, 3.0), n, phases=r.uniform(0, TAU, k))
    part /= np.abs(part).max() + 1e-12
    y = wash * 0.8 + part * 0.25
    # cymbal "bloom": energy builds over the first ~20 ms
    y *= 1 - 0.5 * np.exp(-tvec(n) / 0.015)
    att = ns(0.002)
    y[:att] *= _raised_cos(att)
    return _end_fade(y / (np.abs(y).max() + 1e-12), 0.2)


def _brush_cymbal(v, var):
    """A wire brush swept across a suspended cymbal: crash wash with a soft swelling attack."""
    y = _crash(v, var)
    n = y.size
    a = ns(0.07)
    y[:a] *= (0.5 - 0.5 * np.cos(np.pi * np.arange(a) / a)) ** 1.5
    y = filt(y, [('blp', 7500, 0.7), ('ls', 600, 0.7, -3)], tail=0.02)
    return _end_fade(y / (np.abs(y).max() + 1e-12), 0.2)


def _hat(v, var, kind='closed'):
    r = rng('hat', v, var, kind)
    if kind == 'open':
        n, tau = ns(0.9), 0.28
    elif kind == 'chick':
        n, tau = ns(0.15), 0.018
    else:
        n, tau = ns(0.25), 0.032 + 0.01 * v
    nz = r.standard_normal(n)
    hi = filt(nz, [('bhp', 5200 if kind != 'chick' else 2500, 2), ('pk', 7800, 1, 3), ('hs', 11000, 0.7, -6)], tail=0.01)
    k = 24
    fr = np.exp(r.uniform(np.log(4500), np.log(11000), k))
    met = partials(fr, r.uniform(0.3, 1, k), np.full(k, tau * 6.9 * 1.2), n, phases=r.uniform(0, TAU, k))
    y = hi / (np.abs(hi).max() + 1e-12) + 0.5 * met / (np.abs(met).max() + 1e-12)
    y *= _env_exp(n, tau, 0.001)
    if kind == 'chick':
        body = filt(r.standard_normal(n), [('bp', 1100, 1.2)], tail=0.01) * _env_exp(n, 0.012, 0.002)
        y = y * 0.6 + body * 0.5
    return _end_fade(y / (np.abs(y).max() + 1e-12))


def _kick(v, var, soft=True):
    r = rng('kick', v, var, soft)
    n = ns(0.6)
    t = tvec(n)
    f = 50 + 38 * np.exp(-t / 0.035)
    ph = np.cumsum(f) / SR
    y = np.sin(TAU * ph) * _env_exp(n, 0.16 if soft else 0.22, 0.003)
    beater = filt(r.standard_normal(n), [('lp', 1800 if not soft else 900, 0.7)], tail=0.01) * _env_exp(n, 0.004, 0.001)
    y += beater * (0.25 if not soft else 0.12)
    return _end_fade(y / (np.abs(y).max() + 1e-12))


def _snare(v, var, rim=False):
    r = rng('snare', v, var, rim)
    n = ns(0.5)
    t = tvec(n)
    modes = (np.sin(TAU * 182 * t) + 0.6 * np.sin(TAU * 287 * t + 0.5) + 0.4 * np.sin(TAU * 335 * t + 1.2)) * _env_exp(n, 0.05, 0.0015)
    wires = filt(r.standard_normal(n), [('bp', 3200, 0.7), ('hs', 7000, 0.7, -3)], tail=0.01) * _env_exp(n, 0.085 + 0.04 * v, 0.002)
    click = filt(r.standard_normal(n), [('bp', 5000, 1.0)], tail=0.01) * _env_exp(n, 0.002, 0.0007)
    y = modes * (0.55 if not rim else 0.8) + wires * (0.75 + 0.25 * v) + click * (0.5 if not rim else 0.9)
    return _end_fade(y / (np.abs(y).max() + 1e-12))


def _tom(v, var, f0=120.0):
    r = rng('tom', v, var, f0)
    n = ns(0.9)
    t = tvec(n)
    f = f0 * (1 + 0.12 * np.exp(-t / 0.05))
    y = np.sin(TAU * np.cumsum(f) / SR) * _env_exp(n, 0.22, 0.002)
    y += 0.3 * np.sin(TAU * np.cumsum(f * 1.58) / SR + 0.4) * _env_exp(n, 0.1, 0.002)
    y += filt(r.standard_normal(n), [('bp', 2500, 0.7)], tail=0.01) * _env_exp(n, 0.012, 0.001) * 0.3
    return _end_fade(y / (np.abs(y).max() + 1e-12))


def _woodblock(v, var, f0=1050.0):
    r = rng('wb', v, var, f0)
    n = ns(0.25)
    f1 = f0 * (1 + r.normal(0, 0.004))
    y = partials([f1, f1 * 1.58, f1 * 2.71, f1 * 3.9], [1, 0.45, 0.25, 0.08], [0.11, 0.07, 0.045, 0.03], n)
    y += filt(r.standard_normal(n), [('bp', f0 * 2, 1.0)], tail=0.01) * _env_exp(n, 0.0025, 0.0008) * 0.4
    att = ns(0.0012)
    y[:att] *= _raised_cos(att)
    return _end_fade(y / (np.abs(y).max() + 1e-12))


def _rim(v, var):
    r = rng('rim', v, var)
    n = ns(0.2)
    y = partials([520, 1630, 2950], [1, 0.6, 0.3], [0.08, 0.05, 0.035], n)
    y += filt(r.standard_normal(n), [('bp', 3000, 0.8)], tail=0.01) * _env_exp(n, 0.004, 0.0008) * 0.6
    att = ns(0.001)
    y[:att] *= _raised_cos(att)
    return _end_fade(y / (np.abs(y).max() + 1e-12))


def _timpani(v, var, midi=43.0):
    r = rng('timp', v, var, midi)
    f = 440.0 * 2 ** ((midi - 69) / 12)
    n = ns(4.0)
    t = tvec(n)
    ratios = np.array([1.0, 1.504, 1.742, 2.0, 2.245, 2.494, 2.8, 2.98])
    amps = np.array([1.0, 0.5, 0.22, 0.3, 0.14, 0.11, 0.06, 0.05]) * np.r_[1, (0.5 + 0.7 * v) * np.ones(7)]
    T = np.array([3.2, 1.8, 0.9, 1.2, 0.7, 0.6, 0.4, 0.35])
    glide = 1 + 0.012 * v * np.exp(-t / 0.08)
    y = np.zeros(n)
    for rt, a, TT in zip(ratios, amps, T):
        ph = np.cumsum(f * rt * glide) / SR
        y += a * np.exp(-6.907755 * t / TT) * np.sin(TAU * ph + r.uniform(0, 1))
    thump = filt(r.standard_normal(n), [('lp', 500 + 900 * v, 0.7), ('hp', 40, 0.7)], tail=0.02) * _env_exp(n, 0.03, 0.002)
    y += thump * 0.5
    att = ns(0.003)
    y[:att] *= _raised_cos(att)
    return _end_fade(y / (np.abs(y).max() + 1e-12), 0.2)


GEN = {
    'tap': lambda v, k: _brush_tap(v, k, False),
    'slap': lambda v, k: _brush_tap(v, k, True),
    'ride': _ride,
    'crash': _crash,
    'brushcym': _brush_cymbal,
    'hat': lambda v, k: _hat(v, k, 'closed'),
    'ohat': lambda v, k: _hat(v, k, 'open'),
    'chick': lambda v, k: _hat(v, k, 'chick'),
    'kick': lambda v, k: _kick(v, k, True),
    'kick_hard': lambda v, k: _kick(v, k, False),
    'snare': lambda v, k: _snare(v, k, False),
    'rimshot': lambda v, k: _snare(v, k, True),
    'tom_hi': lambda v, k: _tom(v, k, 170.0),
    'tom_mid': lambda v, k: _tom(v, k, 128.0),
    'tom_lo': lambda v, k: _tom(v, k, 92.0),
    'wb_hi': lambda v, k: _woodblock(v, k, 1180.0),
    'wb_lo': lambda v, k: _woodblock(v, k, 880.0),
    'rim': _rim,
}

PAN = {'brushcym': -0.3, 'tap': -0.1, 'slap': -0.1, 'ride': 0.45, 'crash': -0.35, 'hat': -0.4, 'ohat': -0.4, 'chick': -0.4,
       'kick': 0.0, 'kick_hard': 0.0, 'snare': -0.08, 'rimshot': -0.08, 'tom_hi': 0.2, 'tom_mid': 0.3,
       'tom_lo': 0.4, 'wb_hi': 0.2, 'wb_lo': 0.2, 'rim': -0.1}

GAIN = {'brushcym': 0.4, 'tap': 0.5, 'slap': 0.65, 'ride': 0.32, 'crash': 0.45, 'hat': 0.22, 'ohat': 0.25, 'chick': 0.2,
        'kick': 0.55, 'kick_hard': 0.7, 'snare': 0.55, 'rimshot': 0.6, 'tom_hi': 0.55, 'tom_mid': 0.55,
        'tom_lo': 0.6, 'wb_hi': 0.4, 'wb_lo': 0.4, 'rim': 0.4}


def hit(kind: str, v: float, var: int) -> np.ndarray:
    layer = 0.4 if v < 0.6 else 0.85
    if kind.startswith('timp'):
        midi = float(kind.split(':')[1])
        return cached(('timp', midi, layer, var % 4), lambda: _timpani(layer, var % 4, midi))
    return cached(('drum', kind, layer, var % 4), lambda: GEN[kind](layer, var % 4))


def render_hits(events, n: int, vel_range_db: float = 24.0, pan_scale: float = 1.0) -> np.ndarray:
    """events: list of (t, kind, v[, pan])."""
    out = np.zeros((2, n))
    counters: dict = {}
    for ev in events:
        t, kind, v = ev[0], ev[1], ev[2]
        c = counters.get(kind, 0)
        counters[kind] = c + 1
        smp = hit(kind, v, c).astype(float)
        base = kind.split(':')[0]
        g = GAIN.get(base, 0.5) * float(undb(-vel_range_db * (1 - v)))
        pan = ev[3] if len(ev) > 3 else PAN.get(base, 0.0) * pan_scale
        gl, gr = pan_gains(pan)
        st = ns(t)
        mix_at(out[0], smp, st, g * gl * 1.414)
        mix_at(out[1], smp, st, g * gr * 1.414)
    return out


def brush_swirl(n: int, beat_times, level: float = 0.12, seed=0, circle_beats: float = 1.0,
                accent: float = 0.5, t_offset: float = 0.0) -> np.ndarray:
    """Continuous brush sweep on the snare.  beat_times: onset (s) of every beat; one circle
    per ``circle_beats`` beats.  Returns stereo."""
    r = rng('swirl', seed)
    nz = r.standard_normal(n)
    bright = filt(nz, [('bhp', 2200, 2), ('blp', 9000, 2), ('pk', 5000, 1.0, 2)], tail=0.02)
    dark = filt(nz, [('bhp', 900, 2), ('blp', 4500, 2)], tail=0.02)
    bt = np.asarray(beat_times, dtype=float)
    t = tvec(n) + t_offset
    # beat phase (continuous, in beats) by interpolating over beat onsets
    idx = np.arange(bt.size, dtype=float)
    bpos = np.interp(t, bt, idx, left=np.nan, right=np.nan)
    if bt.size > 1:
        per = bt[1] - bt[0]
        lo = t < bt[0]
        bpos[lo] = (t[lo] - bt[0]) / per
        hi = t > bt[-1]
        per2 = bt[-1] - bt[-2]
        bpos[hi] = bt.size - 1 + (t[hi] - bt[-1]) / per2
    ph = (bpos / circle_beats) % 1.0
    # the stroke is fastest (loudest, brightest) in the middle of each half-circle
    stroke = 0.5 - 0.5 * np.cos(TAU * 2 * ph)
    env = 0.35 + 0.65 * stroke ** 1.3
    env *= 1 + accent * 0.4 * (ph < 0.15)
    env *= undb(1.5 * lfo_noise(n, 0.6, r, periodic=False))
    mixb = np.clip(stroke, 0, 1)
    y = (bright * mixb + dark * (1 - mixb) * 0.6) * env * level
    st = np.vstack([y * 0.95, np.roll(y, ns(0.0007)) * 0.85])
    return st


def timpani_roll(t0: float, dur: float, midi: float, v0: float, v1: float, rate: float = 17.0, seed=0):
    """Return hit events for a single-stroke timpani roll (crescendo v0→v1)."""
    r = rng('troll', t0, midi, seed)
    ev = []
    t = t0
    k = 0
    while t < t0 + dur:
        u = (t - t0) / max(dur, 1e-6)
        v = v0 + (v1 - v0) * u ** 1.3
        v *= 1 + r.normal(0, 0.06) + (0.04 if k % 2 == 0 else -0.04)
        ev.append((t + r.normal(0, 0.004), 'timp:%g' % midi, float(np.clip(v, 0.05, 1.0)), 0.15 if k % 2 else 0.25))
        t += 1.0 / (rate * (1 + 0.04 * r.normal()))
        k += 1
    return ev
