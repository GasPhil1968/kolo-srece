"""Synthesized instruments for NIGHT LATCH.

All tonal instruments are band-limited by construction (additive partials below Nyquist or
band-limited wavetables).  Struck/plucked instruments render cached per-pitch samples
(velocity layers, round-robin variants); wind instruments render whole legato phrases with
continuous phase so slurs, scoops, falls and vibrato behave like a player.
"""
from __future__ import annotations

import math
import os
import zlib
from dataclasses import dataclass, field

import numpy as np

from synth import (SR, NYQ, TAU, ns, tvec, mtof, undb, rng, seed_of, mix_at, pan_gains,
                   filt, phase_cycles, make_table, table_read, lfo_noise, white, wander, bl_table)

_TAB: dict = {}


def _memo_table(key, fn):
    t = _TAB.get(key)
    if t is None:
        t = fn()
        _TAB[key] = t
    return t

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(HERE, 'cache', 'samples')
_SRC_HASH = 0
for _f in ('instruments.py', 'drums.py'):  # cached samples depend on both generators
    with open(os.path.join(HERE, _f), 'rb') as _fh:
        _SRC_HASH = zlib.crc32(_fh.read(), _SRC_HASH)
_MEM: dict = {}


def cached(parts, fn) -> np.ndarray:
    key = '%08x' % seed_of(_SRC_HASH, *parts)
    arr = _MEM.get(key)
    if arr is not None:
        return arr
    path = os.path.join(CACHE_DIR, key + '.npy')
    if os.path.exists(path):
        try:
            arr = np.load(path)
            _MEM[key] = arr
            return arr
        except Exception:
            pass
    arr = np.asarray(fn(), dtype=np.float32)
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        tmp = '%s.%d.tmp' % (path, os.getpid())
        with open(tmp, 'wb') as fh:
            np.save(fh, arr)
        os.replace(tmp, path)
    except OSError:
        pass
    _MEM[key] = arr
    return arr


@dataclass
class Note:
    t: float            # onset (s, relative to the render buffer)
    d: float            # duration (s)
    m: float            # MIDI pitch (float allowed)
    v: float = 0.7      # velocity 0..1
    fl: str = ''        # flags: scoop fall accent stacc slur ghost vib swell marc trem
    pan: float | None = None
    x: dict = field(default_factory=dict)

    def has(self, flag: str) -> bool:
        return flag in self.fl.split()


def _raised_cos(n: int) -> np.ndarray:
    return 0.5 - 0.5 * np.cos(np.pi * np.arange(n) / max(n, 1))


def _ramp_in(n: int, sec: float) -> np.ndarray:
    e = np.ones(n)
    a = min(n, max(2, ns(sec)))
    e[:a] = _raised_cos(a)
    return e


def _release_env(n_total: int, n_off: int, tau: float, fade: float = 0.004) -> np.ndarray:
    env = np.ones(n_total)
    if n_off >= n_total:
        return env
    k = np.arange(n_total - n_off) / SR
    env[n_off:] = np.exp(-k / max(tau, 1e-3))
    # guarantee zero at the end of the buffer
    f = min(ns(fade), n_total)
    env[n_total - f:] *= np.linspace(1, 0, f)
    return env


# =============================================================================== PIANO
class Piano:
    """Additive acoustic piano: inharmonic stiff-string partials, strike-position comb,
    velocity-dependent hammer brightness, two-stage decay, detuned unisons (beating),
    hammer knock + soundboard thump, dampers and sustain pedal."""

    LAYERS = (0.3, 0.5, 0.7, 0.9)

    def __init__(self, name: str = 'grand', bright: float = 1.0, decay: float = 1.0,
                 knock: float = 1.0, max_len: float = 8.0, detune: float = 1.0,
                 spread: float = 0.6, vel_range_db: float = 30.0, hammer: float = 1.0):
        self.name = name
        self.bright = bright
        self.decay = decay
        self.knock = knock
        self.max_len = max_len
        self.detune = detune
        self.spread = spread
        self.vel_range_db = vel_range_db
        self.hammer = hammer

    # -- sample synthesis -----------------------------------------------------
    def _synth(self, midi: int, v: float, var: int) -> np.ndarray:
        r = rng('piano', self.name, midi, v, var)
        stretch = 0.9 * ((midi - 60) / 12.0) ** 3
        f0 = float(mtof(midi)) * 2 ** (stretch / 1200.0)
        B = float(np.clip(0.00015 * 2 ** ((midi - 60) / 12.0 * 1.1), 4e-5, 0.012))
        T60 = float(np.interp(midi, [21, 36, 48, 60, 72, 84, 96, 108],
                              [15, 12, 10, 8.5, 6.5, 4.6, 2.7, 1.2])) * self.decay
        length = min(self.max_len, max(1.2, T60 * 1.6))
        n = ns(length)
        t = tvec(n)
        fc = (700 + 4300 * v ** 1.7) * self.bright
        beta = 1.0 / (8.0 + r.uniform(-0.6, 0.6))
        kmax = int(min(64, 15500 / f0))
        kmax = max(kmax, 1)
        k = np.arange(1, kmax + 1)
        fk = k * f0 * np.sqrt(1 + B * k * k)
        valid = fk < 17000
        amp = k ** -0.55 / np.sqrt(1 + (fk / fc) ** 4)
        amp *= 0.3 + 0.7 * np.abs(np.sin(np.pi * k * beta))
        amp *= fk ** 2 / (fk ** 2 + 95.0 ** 2)
        amp *= valid
        sig1 = 6.907755 / T60
        sig = sig1 + 3.3e-7 * (fk ** 2 - f0 ** 2) * (1.0 / max(self.decay, 0.2))
        w_after = float(np.interp(midi, [21, 50, 80, 108], [0.28, 0.22, 0.15, 0.08]))
        n_str = 1 if midi < 32 else (2 if midi < 45 else 3)
        att = max(ns(0.003 + 0.003 * (1 - v)), 8)
        onset = np.ones(n)
        onset[:att] = _raised_cos(att)
        y = np.zeros(n)
        peak = amp.max()
        for i in range(kmax):
            if amp[i] < peak * 1e-4:
                continue
            s1, s2 = sig[i] * 1.5, sig[i] * 0.4
            # life until -80 dB relative to the strongest partial
            rel_db = 20 * math.log10(amp[i] / peak)
            life = (80 + rel_db) / 8.686 / s2
            m = min(n, ns(life) + 1)
            tt = t[:m]
            env = (1 - w_after) * np.exp(-s1 * tt) + w_after * np.exp(-s2 * tt)
            if i < 6 and n_str > 1:
                # detuned unison strings → beating
                comp = np.sin(TAU * fk[i] * tt)
                wsum = 1.0
                for s, ws in zip(range(1, n_str), (0.35, 0.2)):
                    cents = r.normal(0, 0.45 * self.detune)
                    comp += ws * np.sin(TAU * fk[i] * 2 ** (cents / 1200.0) * tt)
                    wsum += ws
                comp /= wsum
            else:
                comp = np.sin(TAU * fk[i] * tt)
            y[:m] += amp[i] * env * comp
        y *= onset
        # hammer knock (felt on string, a few ms) + soundboard thump
        kn = ns(0.03)
        nz = r.standard_normal(kn) * np.exp(-tvec(kn) / 0.004)
        nz = filt(nz, [('bp', 900 + 1500 * v, 0.8)], tail=0.01)
        thump_f = 75 + r.uniform(-8, 8) + 0.3 * (midi - 40)
        th = np.sin(TAU * thump_f * tvec(kn)) * np.exp(-tvec(kn) / 0.012)
        kscale = self.knock * (0.012 + 0.03 * max(0, (midi - 60) / 48)) * (0.4 + 0.6 * v) * peak
        y[:kn] += kscale * (nz * 0.9 + th * 0.8 * self.hammer) * _ramp_in(kn, 0.0015)
        # fade the very end of the sample
        fl = ns(0.25)
        y[-fl:] *= np.linspace(1, 0, fl) ** 2
        y /= (np.max(np.abs(y)) + 1e-12)
        return y

    def sample(self, midi: int, v: float, var: int) -> np.ndarray:
        layer = min(self.LAYERS, key=lambda L: abs(L - v))
        return cached(('piano', self.name, self.bright, self.decay, self.knock, self.max_len,
                       self.detune, self.hammer, midi, layer, var % 2),
                      lambda: self._synth(midi, layer, var % 2)), layer

    def level(self, v: float) -> float:
        return float(undb(-self.vel_range_db * (1 - np.clip(v, 0, 1))))

    def damper_tau(self, midi: int) -> float:
        if midi >= 89:
            return 99.0
        return float(np.interp(midi, [21, 50, 70, 88], [0.35, 0.16, 0.09, 0.06]))

    def render(self, notes, n: int, pedal=None) -> np.ndarray:
        out = np.zeros((2, n))
        for idx, nt in enumerate(notes):
            midi = int(round(nt.m))
            smp, layer = self.sample(midi, nt.v, idx)
            off = nt.t + nt.d
            if pedal:
                for (pd, pu) in pedal:
                    if pd <= off < pu:
                        off = max(off, pu)
                        break
            n_off = ns(off - nt.t)
            tau = self.damper_tau(midi)
            total = min(smp.size, n_off + ns(min(6 * tau, 9.0)) + 1)
            if total <= 0:
                continue
            seg = smp[:total].astype(float) * _release_env(total, n_off, tau)
            g = self.level(nt.v) * 2.22  # calibrated: single note v=.65 → -20 dBFS RMS (1 s)
            pan = nt.pan if nt.pan is not None else float(np.clip((midi - 62) / 30.0, -1, 1)) * self.spread
            gl, gr = pan_gains(pan)
            st = ns(nt.t)
            mix_at(out[0], seg, st, g * gl * 1.414)
            mix_at(out[1], seg, st, g * gr * 1.414)
        return out


# =============================================================================== BASS
class UprightBass:
    """Plucked upright bass (gut strings): harmonic partials with pluck-position comb,
    frequency-dependent damping, tension pitch glide, finger noise, legato muting."""

    LAYERS = (0.35, 0.6, 0.85)

    def __init__(self, name: str = 'upright', sustain: float = 1.0, bright: float = 1.0,
                 vel_range_db: float = 16.0):
        self.name = name
        self.sustain = sustain
        self.bright = bright
        self.vel_range_db = vel_range_db

    def _synth(self, midi: int, v: float, var: int) -> np.ndarray:
        r = rng('bass', self.name, midi, v, var)
        f0 = float(mtof(midi))
        T60 = float(np.interp(midi, [28, 40, 55, 70], [3.0, 2.5, 1.9, 1.3])) * self.sustain
        n = ns(min(4.0, T60 * 1.3))
        t = tvec(n)
        beta = 0.21 + r.uniform(-0.025, 0.025)
        kmax = int(min(48, 6000 / f0))
        k = np.arange(1, kmax + 1)
        fk = k * f0 * np.sqrt(1 + 2.5e-5 * k * k)
        fc = (450 + 1300 * v) * self.bright
        amp = np.abs(np.sin(np.pi * k * beta)) / k ** 1.1 / np.sqrt(1 + (fk / fc) ** 4)
        amp *= fk ** 2 / (fk ** 2 + 48.0 ** 2)
        sig1 = 6.907755 / T60
        sig = sig1 * (1 + (fk / 380.0) ** 2)
        glide_tau = 0.05
        g = 0.0045 * v * glide_tau * (1 - np.exp(-t / glide_tau))  # extra phase time (pitch glide)
        tw = t + g
        y = np.zeros(n)
        for i in range(kmax):
            env = 0.7 * np.exp(-sig[i] * 1.5 * t) + 0.3 * np.exp(-sig[i] * 0.5 * t)
            y += amp[i] * env * np.sin(TAU * fk[i] * tw + r.uniform(-0.2, 0.2))
        att = ns(0.004)
        y[:att] *= _raised_cos(att)
        # finger/string noise
        kn = ns(0.025)
        nz = r.standard_normal(kn) * np.exp(-tvec(kn) / 0.006)
        nz = filt(nz, [('lp', 1400, 0.7), ('hp', 120, 0.7)], tail=0.01)
        y[:kn] += nz * amp.max() * (0.05 + 0.05 * v) * _ramp_in(kn, 0.0015)
        fl = ns(0.2)
        y[-fl:] *= np.linspace(1, 0, fl) ** 2
        y /= np.max(np.abs(y)) + 1e-12
        return y

    def sample(self, midi, v, var):
        layer = min(self.LAYERS, key=lambda L: abs(L - v))
        return cached(('bass', self.name, self.sustain, self.bright, midi, layer, var % 2),
                      lambda: self._synth(midi, layer, var % 2)), layer

    def render(self, notes, n: int, legato: bool = True) -> np.ndarray:
        """Mono output (bass sits in the centre)."""
        out = np.zeros(n)
        srt = sorted(notes, key=lambda q: q.t)
        for idx, nt in enumerate(srt):
            midi = int(round(nt.m))
            smp, layer = self.sample(midi, nt.v, idx)
            off = nt.t + nt.d
            if legato and idx + 1 < len(srt):
                nxt = srt[idx + 1].t
                if nxt < off + 0.15:
                    off = min(off, nxt + 0.012)
            n_off = max(ns(off - nt.t), ns(0.03))
            tau = 0.045 if not nt.has('ghost') else 0.02
            total = min(smp.size, n_off + ns(0.3))
            seg = smp[:total].astype(float) * _release_env(total, n_off, tau)
            if nt.has('slide'):
                pass
            g = float(undb(-self.vel_range_db * (1 - nt.v))) * 0.876  # calibrated to -20 dBFS
            if nt.has('ghost'):
                g *= 0.45
            mix_at(out, seg, ns(nt.t), g)
        return out


# =============================================================================== MALLETS / BELLS
MALLET_PRESETS = {
    # ratios, amps, t60 multipliers (relative to fundamental T60), fundamental T60 curve
    'vibes':    dict(ratios=[1.0, 3.98, 9.85], amps=[1.0, 0.22, 0.05], tmul=[1.0, 0.28, 0.1],
                     t60=([41, 60, 77, 89], [9.0, 7.0, 4.5, 3.0]), att=0.004, noise=0.04,
                     noise_f=2500, dtau=0.14, cal=9.1),
    'celesta':  dict(ratios=[1.0, 2.0, 2.76, 5.40, 8.93], amps=[1.0, 0.07, 0.12, 0.04, 0.015],
                     tmul=[1.0, 0.4, 0.22, 0.1, 0.06], t60=([60, 72, 84, 96, 108], [2.6, 2.1, 1.6, 1.1, 0.7]),
                     att=0.004, noise=0.05, noise_f=1800, dtau=0.25, cal=13.3),
    'musicbox': dict(ratios=[1.0, 2.01, 6.27, 17.55], amps=[1.0, 0.08, 0.5, 0.12],
                     tmul=[1.0, 0.5, 0.25, 0.08], t60=([60, 72, 84, 96, 108], [3.0, 2.4, 1.8, 1.2, 0.8]),
                     att=0.003, noise=0.2, noise_f=6000, dtau=9.0, cal=13.2),
    'glock':    dict(ratios=[1.0, 2.76, 5.40], amps=[1.0, 0.25, 0.08], tmul=[1.0, 0.25, 0.1],
                     t60=([72, 96, 108], [3.5, 2.2, 1.4]), att=0.003, noise=0.06, noise_f=6000, dtau=9.0, cal=14.0),
}


class Mallet:
    """Modal struck instrument (vibraphone, celesta, music box, glockenspiel)."""

    def __init__(self, kind: str = 'vibes', name: str = '', tremolo: float = 0.0,
                 trem_rate: float = 4.5, bright: float = 1.0, spread: float = 0.4,
                 vel_range_db: float = 22.0, detune_cents=None, wobble: float = 0.0):
        self.kind = kind
        self.p = MALLET_PRESETS[kind]
        self.name = name or kind
        self.tremolo = tremolo
        self.trem_rate = trem_rate
        self.bright = bright
        self.spread = spread
        self.vel_range_db = vel_range_db
        self.detune_cents = detune_cents  # callable(midi) -> cents, or None
        self.wobble = wobble

    def _synth(self, midi: float, v: float, var: int):
        p = self.p
        r = rng('mallet', self.name, midi, v, var)
        f0 = float(mtof(midi))
        T60 = float(np.interp(midi, *p['t60']))
        n = ns(min(10.0, T60 * 1.2 + 0.1))
        ratios = np.array(p['ratios'])
        amps = np.array(p['amps']) * np.r_[1.0, (0.5 + 0.8 * v * self.bright) * np.ones(len(ratios) - 1)]
        tm = np.array(p['tmul']) * T60
        freqs = f0 * ratios * (1 + r.normal(0, 0.0007, len(ratios)) * np.r_[0, np.ones(len(ratios) - 1)])
        amps = np.where(freqs < 17500, amps, 0.0)
        att = ns(p['att'])
        onset = np.ones(n)
        onset[:att] = _raised_cos(att)
        t = tvec(n)
        fund = amps[0] * np.exp(-6.907755 * t / tm[0]) * np.sin(TAU * freqs[0] * t) * onset
        rest = np.zeros(n)
        for i in range(1, len(ratios)):
            if amps[i] <= 0:
                continue
            m = min(n, ns(tm[i] * 1.6) + 1)
            rest[:m] += amps[i] * np.exp(-6.907755 * t[:m] / tm[i]) * np.sin(TAU * freqs[i] * t[:m] + r.uniform(0, 1)) * onset[:m]
        kn = ns(0.012)
        nz = r.standard_normal(kn) * np.exp(-tvec(kn) / 0.0018)
        nz = filt(nz, [('bp', p['noise_f'], 0.9)], tail=0.005)
        rest[:kn] += nz * p['noise'] * (0.5 + v) * _ramp_in(kn, 0.001)
        fl = ns(0.08)
        fund[-fl:] *= np.linspace(1, 0, fl)
        rest[-fl:] *= np.linspace(1, 0, fl)
        sc = np.max(np.abs(fund + rest)) + 1e-12
        return np.vstack([fund / sc, rest / sc])

    def sample(self, midi, v, var):
        layer = 0.4 if v < 0.55 else 0.8
        return cached(('mallet', self.name, self.kind, self.bright, round(float(midi), 3), layer, var % 2),
                      lambda: self._synth(midi, layer, var % 2)), layer

    def render(self, notes, n: int, pedal=None, t_abs0: float = 0.0) -> np.ndarray:
        out = np.zeros((2, n))
        dtau = self.p['dtau']
        for idx, nt in enumerate(notes):
            midi = float(nt.m)
            if self.detune_cents is not None:
                midi += self.detune_cents(int(round(nt.m))) / 100.0
            smp, layer = self.sample(midi, nt.v, idx)
            off = nt.t + nt.d
            if pedal:
                for (pd, pu) in pedal:
                    if pd <= off < pu:
                        off = pu
                        break
            n_off = ns(off - nt.t)
            total = min(smp.shape[1], n_off + ns(min(6 * dtau, 9.0)) + 1)
            fund = smp[0, :total].astype(float)
            rest = smp[1, :total].astype(float)
            if self.tremolo > 0:
                ta = (np.arange(total) + ns(nt.t)) / SR + t_abs0
                fund = fund * (1 - self.tremolo * (0.5 + 0.5 * np.sin(TAU * self.trem_rate * ta)))
            seg = (fund + rest) * _release_env(total, n_off, dtau)
            g = float(undb(-self.vel_range_db * (1 - nt.v))) * 0.25 * float(undb(self.p.get('cal', 0.0)))
            pan = nt.pan if nt.pan is not None else float(np.clip((nt.m - 72) / 24.0, -1, 1)) * self.spread
            gl, gr = pan_gains(pan)
            st = ns(nt.t)
            mix_at(out[0], seg, st, g * gl * 1.414)
            mix_at(out[1], seg, st, g * gr * 1.414)
        if self.wobble > 0:
            out = wobble(out, self.wobble, rate=0.37, seed=self.name)
        return out


def wobble(x: np.ndarray, cents: float, rate: float = 0.35, seed='w') -> np.ndarray:
    """Global slow pitch wobble (worn spring / tape) via a modulated fractional delay."""
    n = x.shape[-1]
    r = rng('wobble', seed)
    lfo = 0.7 * np.sin(TAU * rate * tvec(n) + r.uniform(0, TAU)) + 0.3 * lfo_noise(n, rate * 1.7, r)
    ratio = 2 ** (cents / 1200.0) - 1
    amp_s = ratio / (TAU * rate)  # delay amplitude (s) giving ~cents deviation
    d = (amp_s * (lfo + 1.2)) * SR + 2
    pos = np.arange(n) - d
    pos = np.clip(pos, 0, n - 1)
    if x.ndim == 1:
        return np.interp(pos, np.arange(n), x)
    return np.vstack([np.interp(pos, np.arange(n), ch) for ch in x])


BELL_PRESETS = {
    'church': dict(ratios=[0.5, 1.0, 1.183, 1.506, 2.0, 2.514, 2.662, 3.011, 4.166, 5.433, 6.796],
                   amps=[0.45, 0.5, 0.42, 0.22, 0.7, 0.28, 0.2, 0.25, 0.12, 0.08, 0.05],
                   t60=[14, 9, 7, 4.5, 4.5, 2.8, 2.4, 2.0, 1.3, 1.0, 0.7]),
    'buoy':   dict(ratios=[1.0, 1.19, 1.51, 2.0, 2.52, 3.02, 4.1, 5.4],
                   amps=[0.6, 0.35, 0.2, 0.8, 0.3, 0.25, 0.12, 0.06],
                   t60=[6, 4.5, 3, 3.2, 2, 1.6, 1.0, 0.7]),
    'clock':  dict(ratios=[0.5, 1.0, 1.2, 1.5, 2.0, 2.6, 3.0, 4.2],
                   amps=[0.5, 0.6, 0.35, 0.2, 0.6, 0.2, 0.18, 0.08],
                   t60=[7, 5.5, 4, 3, 3, 2, 1.6, 1.0]),
    'fire':   dict(ratios=[1.0, 2.32, 2.85, 4.16, 5.43],
                   amps=[1.0, 0.5, 0.3, 0.25, 0.12],
                   t60=[1.6, 1.0, 0.8, 0.5, 0.35]),
    'phone':  dict(ratios=[1.0, 2.71, 2.98, 5.1, 6.6],
                   amps=[1.0, 0.45, 0.3, 0.2, 0.1],
                   t60=[1.2, 0.7, 0.6, 0.35, 0.25]),
}


def bell(f_nominal: float, kind: str = 'church', v: float = 0.8, seed=0, length=None,
         t60_scale: float = 1.0) -> np.ndarray:
    """One bell strike (mono).  f_nominal = frequency of ratio 1.0 partial."""
    p = BELL_PRESETS[kind]
    r = rng('bell', kind, f_nominal, seed)
    ratios = np.array(p['ratios'])
    t60 = np.array(p['t60']) * t60_scale
    L = length or float(t60.max() * 0.9)
    n = ns(L)
    t = tvec(n)
    y = np.zeros(n)
    for i, (rt, a, T) in enumerate(zip(ratios, p['amps'], t60)):
        f = f_nominal * rt
        if f > 17000:
            continue
        # doublet: two close modes → slow warble
        df = f * r.uniform(0.0004, 0.0018)
        a2 = a * (0.6 + 0.4 * v ** (1 + i * 0.3))
        env = np.exp(-6.907755 * t / T)
        y += a2 * env * (np.sin(TAU * f * t + r.uniform(0, TAU)) * 0.6 + np.sin(TAU * (f + df) * t + r.uniform(0, TAU)) * 0.4)
    att = ns(0.003)
    y[:att] *= _raised_cos(att)
    kn = ns(0.02)
    nz = r.standard_normal(kn) * np.exp(-tvec(kn) / 0.003)
    y[:kn] += filt(nz, [('bp', f_nominal * 3, 0.7)], tail=0.005) * 0.25 * v * _ramp_in(kn, 0.001)
    fl = ns(min(0.3, L * 0.2))
    y[-fl:] *= np.linspace(1, 0, fl)
    return y / (np.max(np.abs(y)) + 1e-12)


# =============================================================================== WINDS (additive)
WIND_PRESETS = {
    'trumpet_harmon': dict(cal=-0.3, 
        formant=[(100, -40), (300, -28), (550, -15), (800, -6), (1150, -1), (1550, 0), (1900, -1.5),
                 (2400, -5), (3100, -7), (3900, -4.5), (4600, -7), (6000, -17), (8500, -30), (14000, -55)],
        slope=3.2, breath=-34, breath_band=[('bp', 3500, 0.7)], breath_pm=0.6,
        vib_cents=11, vib_rate=5.3, vib_delay=0.32, vib_min=0.7, att=0.028, rel=0.10,
        port=0.04, dip=0.55, drift=3.5, range_db=16, gain=1.0, odd_even=None, scoop=35),
    'trumpet_open': dict(cal=0.4, 
        formant=[(100, -30), (250, -14), (500, -4), (800, 0), (1200, 2), (1600, 0), (2500, -4),
                 (3500, -9), (5000, -17), (8000, -29), (12000, -46)],
        slope=4.2, breath=-40, breath_band=[('bp', 2500, 0.7)], breath_pm=0.5,
        vib_cents=13, vib_rate=5.4, vib_delay=0.3, vib_min=0.7, att=0.026, rel=0.11,
        port=0.04, dip=0.5, drift=3.0, range_db=18, gain=1.0, odd_even=None, scoop=30),
    'trumpet_cup': dict(cal=2.2, 
        formant=[(100, -34), (300, -18), (600, -4), (900, 0), (1300, -1), (1800, -6), (2600, -14),
                 (4000, -24), (7000, -40)],
        slope=3.0, breath=-38, breath_band=[('bp', 2000, 0.7)], breath_pm=0.5,
        vib_cents=8, vib_rate=5.4, vib_delay=0.3, vib_min=0.8, att=0.02, rel=0.08,
        port=0.03, dip=0.45, drift=3.0, range_db=16, gain=1.0, odd_even=None, scoop=25),
    'tenor': dict(cal=-2.7, 
        formant=[(70, -12), (140, -3), (260, 0), (480, 1), (750, -2), (1150, -1), (1600, -5),
                 (2400, -7), (3200, -12), (4500, -22), (7000, -36), (10000, -50)],
        slope=2.4, breath=-17, breath_band=[('bp', 1800, 0.6), ('hp', 600, 0.7)], breath_pm=0.8,
        vib_cents=24, vib_rate=4.9, vib_delay=0.25, vib_min=0.55, att=0.045, rel=0.12,
        port=0.05, dip=0.62, drift=4.0, range_db=16, gain=1.0, odd_even=None, scoop=70),
    'clarinet': dict(cal=2.5, 
        formant=[(100, -8), (400, 0), (1000, -2), (1600, -5), (2500, -11), (4000, -21), (7000, -35),
                 (10000, -48)],
        slope=2.8, breath=-33, breath_band=[('bp', 2500, 0.8)], breath_pm=0.5,
        vib_cents=6, vib_rate=5.2, vib_delay=0.4, vib_min=0.9, att=0.04, rel=0.12,
        port=0.035, dip=0.6, drift=2.5, range_db=18, gain=1.0, odd_even=(1700, 3200, -22), scoop=0),
    'bass_clarinet': dict(cal=1.5, 
        formant=[(50, -8), (120, 0), (350, 0), (700, -4), (1300, -11), (2500, -22), (5000, -38),
                 (9000, -52)],
        slope=2.6, breath=-26, breath_band=[('bp', 1400, 0.7)], breath_pm=0.7,
        vib_cents=7, vib_rate=4.8, vib_delay=0.45, vib_min=1.0, att=0.05, rel=0.15,
        port=0.045, dip=0.6, drift=3.0, range_db=18, gain=1.0, odd_even=(850, 1800, -20), scoop=0),
    'trombone': dict(cal=3.6, 
        formant=[(50, -26), (120, -9), (250, -2), (450, 0), (650, -1), (1100, -6), (1900, -12),
                 (3200, -22), (6000, -38), (10000, -52)],
        slope=5.0, breath=-42, breath_band=[('bp', 1200, 0.7)], breath_pm=0.4,
        vib_cents=6, vib_rate=5.0, vib_delay=0.45, vib_min=1.2, att=0.045, rel=0.16,
        port=0.06, dip=0.5, drift=2.5, range_db=22, gain=1.0, odd_even=None, scoop=0),
    'horn': dict(cal=3.4, 
        formant=[(50, -22), (120, -8), (250, -1), (400, 0), (650, -4), (1100, -13), (1900, -24),
                 (3500, -38), (7000, -55)],
        slope=4.0, breath=-44, breath_band=[('bp', 900, 0.7)], breath_pm=0.4,
        vib_cents=4, vib_rate=5.0, vib_delay=0.5, vib_min=1.5, att=0.06, rel=0.2,
        port=0.06, dip=0.5, drift=2.5, range_db=20, gain=1.0, odd_even=None, scoop=0),
    'tuba': dict(cal=2.4, 
        formant=[(25, -14), (55, -3), (110, 0), (220, -2), (450, -9), (900, -19), (1800, -32),
                 (4000, -50)],
        slope=4.0, breath=-44, breath_band=[('bp', 500, 0.7)], breath_pm=0.4,
        vib_cents=3, vib_rate=4.6, vib_delay=0.5, vib_min=1.5, att=0.06, rel=0.2,
        port=0.07, dip=0.5, drift=2.0, range_db=20, gain=1.0, odd_even=None, scoop=0),
}


def _smoothstep(u):
    u = np.clip(u, 0.0, 1.0)
    return u * u * (3 - 2 * u)


class Wind:
    """Additive wind/brass lead rendered phrase by phrase."""

    HOP = 32

    def __init__(self, kind: str, name: str = '', **over):
        self.kind = kind
        self.p = dict(WIND_PRESETS[kind])
        self.p.update(over)
        self.name = name or kind
        r = rng('windphase', self.name)
        self.phases = r.uniform(0, TAU, 128)
        f = np.array(self.p['formant'], dtype=float)
        self._flog = np.log2(f[:, 0])
        self._fdb = f[:, 1]

    def _formant_db(self, freq: np.ndarray) -> np.ndarray:
        return np.interp(np.log2(np.maximum(freq, 10.0)), self._flog, self._fdb)

    @staticmethod
    def phrases(notes, gap: float = 0.07):
        srt = sorted(notes, key=lambda q: q.t)
        out, cur = [], []
        for nt in srt:
            if cur and nt.t - (cur[-1].t + cur[-1].d) > gap:
                out.append(cur)
                cur = []
            cur.append(nt)
        if cur:
            out.append(cur)
        return out

    def render(self, notes, n: int) -> np.ndarray:
        out = np.zeros(n)
        for ph in self.phrases(notes):
            y, st = self._phrase(ph)
            mix_at(out, y, st)
        return out

    def _phrase(self, notes):
        p = self.p
        r = rng('phrase', self.name, round(notes[0].t, 3), round(notes[0].m, 2))
        hop = self.HOP
        t0 = notes[0].t - 0.03
        t_end = notes[-1].t + notes[-1].d + p['rel'] * 3 + 0.05
        st = ns(t0)
        t0 = st / SR
        nA = ns(t_end - t0)
        nc = nA // hop + 3
        tc = t0 + np.arange(nc) * hop / SR
        # ---------------- articulation decisions (made once per note)
        slurs = [False]
        for i in range(1, len(notes)):
            prev, cur = notes[i - 1], notes[i]
            gap = cur.t - (prev.t + prev.d)
            slurs.append(cur.has('slur') or (gap < 0.005 and not cur.has('tongue') and not cur.has('accent')
                                             and r.random() < p.get('slur_prob', 0.35)))
        # ---------------- pitch (semitones)
        P = np.full(nc, float(notes[0].m))
        for i in range(1, len(notes)):
            prev, cur = notes[i - 1], notes[i]
            slur = slurs[i]
            T = p['port'] if slur else 0.014
            if cur.has('gliss'):
                T = min(0.25, cur.d * 0.5)
            P += (cur.m - prev.m) * _smoothstep((tc - (cur.t - T * 0.6)) / T)
        # scoops (into flagged notes, sometimes automatically into longer phrase starts)
        for i, nt in enumerate(notes):
            s = 0.0
            if nt.has('scoop'):
                s = p['scoop'] / 100.0 * (1.3 if nt.d > 0.5 else 0.9)
            elif p['scoop'] and (i == 0 or nt.t - (notes[i - 1].t + notes[i - 1].d) > 0.02) and nt.d > 0.35 and r.random() < 0.3:
                s = p['scoop'] / 100.0 * 0.6
            if s > 0:
                Ts = 0.07 + 0.05 * min(1, nt.d)
                u = np.clip((tc - nt.t) / Ts, 0, 1)
                w = (tc >= nt.t - 0.01)
                P -= s * (1 - (1 - (1 - u) ** 2)) * w
            if nt.has('fall'):
                Tf = min(0.4, nt.d * 0.6)
                u = np.clip((tc - (nt.t + nt.d - Tf)) / Tf, 0, 1)
                P -= (2.5 + 2 * r.random()) * u ** 2.2
        # vibrato
        vib = np.zeros(nc)
        rate = p['vib_rate'] * (1 + 0.04 * lfo_noise(nc, 0.5, r, periodic=False))
        vph = np.cumsum(rate) * hop / SR + r.uniform(0, 1)
        for nt in notes:
            if nt.d < p['vib_min'] and not nt.has('vib'):
                continue
            depth = p['vib_cents'] / 100.0 * (1.4 if nt.has('vib') else 1.0)
            ramp = np.clip((tc - nt.t - p['vib_delay']) / 0.35, 0, 1)
            endf = np.clip((nt.t + nt.d - tc) / 0.08, 0, 1)
            vib += depth * ramp * endf * (tc < nt.t + nt.d)
        P += vib * np.sin(TAU * vph)
        P += p['drift'] / 100.0 * lfo_noise(nc, 0.8, r, periodic=False)
        # ---------------- amplitude
        rd = p['range_db']
        A = np.zeros(nc)
        ends = [nt.t + nt.d for nt in notes]
        for i, nt in enumerate(notes):
            L = float(undb(-rd * (1 - nt.v)))
            if nt.has('accent'):
                L *= 1.25
            if nt.has('ghost'):
                L *= 0.4
            a_end = notes[i + 1].t if i + 1 < len(notes) else ends[i]
            seg = (tc >= nt.t - 0.004) & (tc < a_end)
            shape = np.ones(nc)
            if nt.d > 1.0 and not nt.has('fall'):
                u = np.clip((tc - nt.t) / nt.d, 0, 1)
                shape = undb(2.0 * np.sin(np.pi * np.minimum(u * 1.25, 1.0)) - 2.5 * u)
            elif nt.d > 0.3:
                u = np.clip((tc - nt.t) / nt.d, 0, 1)
                shape = undb(-1.5 * u)
            A = np.where(seg, L * shape, A)
        # smooth level steps
        kw = max(1, int(0.012 * SR / hop))
        A = np.convolve(A, np.ones(kw) / kw, mode='same')
        # tongued dips
        for i, nt in enumerate(notes):
            if i == 0:
                continue
            prev = notes[i - 1]
            if not slurs[i]:
                dip = p['dip'] if nt.t - (prev.t + prev.d) < 0.03 else 0.15
                w = 0.016
                A *= 1 - (1 - dip) * np.exp(-0.5 * ((tc - nt.t + 0.004) / w) ** 2)
        # phrase attack & release
        att = p['att'] * (0.6 if notes[0].has('accent') else 1.0)
        A *= _smoothstep((tc - notes[0].t + 0.002) / att)
        rel = p['rel'] * (0.5 if notes[-1].has('stacc') else 1.0)
        A *= 1 - _smoothstep((tc - ends[-1] + rel * 0.3) / rel)
        for nt in notes:
            if nt.has('fall'):
                Tf = min(0.4, nt.d * 0.6)
                u = np.clip((tc - (nt.t + nt.d - Tf)) / Tf, 0, 1)
                A *= 1 - 0.85 * u ** 1.5
        # brightness: follows level, plus attack transient
        Lref = float(undb(-rd * 0.1))
        B = np.clip(A / Lref, 0, 1.2) ** 0.7
        for i, nt in enumerate(notes):
            boost = 0.25 if (i == 0 or nt.t - ends[i - 1] > 0.005) else 0.12
            if nt.has('accent'):
                boost += 0.2
            B += boost * np.exp(-np.maximum(tc - nt.t, 0) / 0.045) * (tc >= nt.t - 0.003)
        B = np.clip(B, 0, 1.3)
        # ---------------- audio synthesis
        ta = np.arange(nA)
        tcs = np.arange(nc) * hop
        Pa = np.interp(ta, tcs, P)
        fa = mtof(Pa)
        ph = phase_cycles(fa)
        fc_min = float(mtof(P.min()))
        K = int(min(90, 16500 / fc_min))
        fcon = mtof(P)
        y = np.zeros(nA)
        oe = p['odd_even']
        for k in range(1, K + 1):
            fk = k * fcon
            gdb = self._formant_db(fk) - (k - 1) * p['slope'] * np.clip(1.0 - B, 0, 1)
            if oe is not None and k % 2 == 0:
                lo, hi, att_db = oe
                gdb = gdb + att_db * np.clip((hi - fk) / (hi - lo), 0, 1)
            amp = A * undb(gdb)
            amp *= np.clip((17500 - fk) / 1500.0, 0, 1)
            if amp.max() < 2e-5:
                continue
            y += np.interp(ta, tcs, amp) * np.sin(TAU * k * ph + self.phases[k % 128])
        # breath noise (pitch-synchronous)
        if p['breath'] > -80:
            nz = filt(r.standard_normal(nA), p['breath_band'], tail=0.02)
            nz /= np.std(nz) + 1e-12
            chiff = np.zeros(nc)
            for i, nt in enumerate(notes):
                if i == 0 or nt.t - ends[i - 1] > 0.005:
                    chiff += 0.8 * np.exp(-np.maximum(tc - nt.t, 0) / 0.03) * (tc >= nt.t - 0.002) * float(undb(-rd * (1 - nt.v)))
            Br = undb(p['breath']) * (A + chiff * A.max()) * 3.0
            y += np.interp(ta, tcs, Br) * nz * (1 + p['breath_pm'] * np.sin(TAU * ph))
        y *= p['gain'] * 0.2 * float(undb(p.get('cal', 0.0)))
        # hard guarantee: start and end at zero
        y[:ns(0.002)] *= np.linspace(0, 1, ns(0.002))
        y[-ns(0.005):] *= np.linspace(1, 0, ns(0.005))
        return y, st


# =============================================================================== STRINGS / ORGAN (wavetable ensembles)
STRING_SECTIONS = {
    'violins': dict(cal=1.8, players=5, detune=6.0, vib=11.0, eq=[('pk', 290, 1.2, 3), ('pk', 2700, 1.0, 3),
                                                         ('pk', 1500, 1.5, -2.5), ('blp', 7500, 2), ('bhp', 180, 2)]),
    'violas':  dict(cal=-0.9, players=4, detune=6.0, vib=10.0, eq=[('pk', 240, 1.2, 3), ('pk', 1900, 1.0, 2),
                                                         ('blp', 6000, 2), ('bhp', 120, 2)]),
    'cellos':  dict(cal=-1.2, players=4, detune=5.0, vib=9.0, eq=[('pk', 180, 1.0, 3), ('pk', 600, 1.4, 1.5),
                                                        ('pk', 1900, 1.0, 1.5), ('blp', 5000, 2), ('bhp', 55, 2)]),
    'basses':  dict(cal=-2.6, players=3, detune=4.0, vib=6.0, eq=[('pk', 90, 1.0, 3), ('pk', 400, 1.4, 1),
                                                        ('blp', 3000, 2), ('bhp', 30, 2)]),
}


class StringSection:
    """Bowed string section: several detuned players per note, each with its own vibrato,
    timing and bow noise; supports swells, marcato, sustained tremolo."""

    def __init__(self, section: str = 'violins', name: str = '', players=None, bright: float = 1.0,
                 vel_range_db: float = 22.0, sul_tasto: bool = False):
        self.sec = section
        self.p = STRING_SECTIONS[section]
        self.name = name or section
        self.players = players or self.p['players']
        self.bright = bright
        self.vel_range_db = vel_range_db
        self.sul_tasto = sul_tasto

    def _table(self, f_top: float, var: int):
        semi = int(round(12 * np.log2(f_top / 440.0)))
        key = ('str', self.name, self.sul_tasto, semi, var % 6)

        def build():
            r = rng('strtab', self.name, var % 6)
            u1, u2 = r.uniform(0.8, 1.6), r.uniform(0, 6)

            def spec(k):
                a = 1.0 / k ** (1.0 if not self.sul_tasto else 1.35)
                return a * (1 + 0.25 * np.sin(k * u1 + u2))
            return bl_table(spec, 440.0 * 2 ** ((semi + 0.5) / 12), size=4096)
        return _memo_table(key, build)

    def render(self, notes, n: int) -> np.ndarray:
        out = np.zeros(n)
        bow = np.zeros(n)
        for idx, nt in enumerate(notes):
            r = rng('strnote', self.name, idx, round(nt.t, 3), nt.m)
            f0 = float(mtof(nt.m))
            att = 0.12
            if nt.has('swell'):
                att = max(0.3, nt.d * 0.55)
            elif nt.has('marc'):
                att = 0.035
            elif nt.has('soft'):
                att = 0.35
            rel = 0.35 if not nt.has('marc') else 0.18
            if nt.has('stacc'):
                rel = 0.12
            total_t = nt.d + rel * 3
            for pl in range(self.players):
                dt = r.uniform(0, 0.025)
                nn = ns(total_t + dt)
                if nn <= 0:
                    continue
                t = tvec(nn)
                cents = r.normal(0, self.p['detune'] * 0.6)
                vrate = r.uniform(5.0, 6.2)
                vdep = self.p['vib'] * r.uniform(0.7, 1.2) / 1200.0
                vramp = np.clip((t - 0.18) / 0.4, 0, 1)
                fm = 1 + vdep * vramp * np.sin(TAU * vrate * t + r.uniform(0, TAU)) * math.log(2)
                fm *= 2 ** ((cents + 2.5 * wander(nn, 0.7, r)) / 1200.0)
                freq = f0 * fm
                ph = phase_cycles(freq, phase0=r.uniform(0, 1))
                tab = self._table(f0 * 1.02, idx * 7 + pl)
                w = table_read(tab, ph)
                env = np.ones(nn)
                a = max(ns(att), 8)
                env[:a] = _smoothstep(np.arange(a) / a) if not nt.has('swell') else (np.arange(a) / a) ** 1.6
                if nt.has('swell'):
                    # swell up then down towards the end
                    u = np.clip(t / max(nt.d, 0.1), 0, 1)
                    env *= 0.35 + 0.65 * np.sin(np.pi * np.clip(u * 0.9, 0, 1)) ** 0.8
                env *= _release_env(nn, ns(nt.d - dt * 0.5), rel / 2.2, fade=0.02)
                env *= undb(1.2 * wander(nn, 1.2, r))
                if nt.has('trem'):
                    rate = r.uniform(12.5, 15.5) * (1 + 0.05 * wander(nn, 2.0, r))
                    tph = np.cumsum(rate) / SR + r.uniform(0, 1)
                    tm = 0.45 + 0.55 * (0.5 + 0.5 * np.cos(TAU * tph)) ** 1.5
                    env *= tm
                g = float(undb(-self.vel_range_db * (1 - nt.v))) / self.players
                mix_at(out, w * env * g, ns(nt.t + dt))
                # bow noise
                bn = r.standard_normal(nn) * env * g * (0.05 if not nt.has('trem') else 0.09)
                mix_at(bow, bn, ns(nt.t + dt))
        bow = filt(bow, [('bp', 3500, 0.8)], tail=0.02)
        y = out + bow * self.bright
        y = filt(y, self.p['eq'] + ([('hs', 3000, 0.7, -4)] if self.sul_tasto else []), tail=0.1)
        return y * 0.5 * float(undb(self.p.get('cal', 0.0)))


class ReedOrgan:
    """Harmonium / reed organ pad: two slightly detuned reed ranks, slow speaking attack,
    bellows pressure wobble."""

    def __init__(self, name: str = 'reed', detune_cents: float = 4.0, bright: float = 0.8,
                 bellows: float = 0.06, global_cents: float = 0.0):
        self.name = name
        self.detune = detune_cents
        self.bright = bright
        self.bellows = bellows
        self.gc = global_cents

    def render(self, notes, n: int) -> np.ndarray:
        out = np.zeros(n)
        for idx, nt in enumerate(notes):
            r = rng('reed', self.name, idx, round(nt.t, 3))
            f0 = float(mtof(nt.m)) * 2 ** (self.gc / 1200)
            rel = 0.16
            nn = ns(nt.d + rel * 3)
            t = tvec(nn)
            for rank, cents in enumerate((0.0, self.detune)):
                def spec(k, rank=rank):
                    a = k ** -0.8 * np.where(k % 2 == 1, 1.25, 1.0)
                    return a * np.exp(-k * f0 / (2600.0 * self.bright + 400))
                tab = _memo_table(('reed', self.name, round(float(nt.m), 2), rank, self.bright, self.gc),
                                  lambda spec=spec: bl_table(spec, f0 * 1.01))
                freq = f0 * 2 ** ((cents + 1.0 * wander(nn, 0.3, r)) / 1200.0)
                ph = phase_cycles(np.full(nn, freq) if np.isscalar(freq) else freq, phase0=r.uniform(0, 1))
                w = table_read(tab, ph)
                env = np.ones(nn)
                a = ns(0.07 + 0.03 * r.random())
                env[:a] = _smoothstep(np.arange(a) / a)
                env *= _release_env(nn, ns(nt.d), rel / 2.5, fade=0.02)
                g = float(undb(-14 * (1 - nt.v))) * (0.55 if rank else 0.6)
                mix_at(out, w * env * g, ns(nt.t))
        # bellows: slow pressure wobble on the whole instrument
        rr = rng('bellows', self.name)
        wob = 1 + self.bellows * (0.6 * np.sin(TAU * 0.55 * tvec(n) + rr.uniform(0, TAU)) + 0.4 * lfo_noise(n, 0.8, rr))
        out *= wob
        out = filt(out, [('pk', 450, 0.8, 2.5), ('blp', 3200 * self.bright + 600, 2), ('bhp', 70, 2)], tail=0.05)
        return out * 0.35 * float(undb(-4.3))
