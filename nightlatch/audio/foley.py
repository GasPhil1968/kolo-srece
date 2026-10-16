"""Foley primitives shared by sound effects and ambiences.

Everything is physically-motivated synthesis: modal impacts (sum of damped modes),
stick-slip friction (creaks, scrapes), granular textures (rain, paper, gravel, salt),
bubble resonances (Minnaert chirps), formant-filtered voices (murmur, laughter, gasps),
animal calls, bells, motors and vehicles.  All generators return mono float arrays that
start and end at zero."""
from __future__ import annotations

import math

import numpy as np

from synth import (SR, TAU, ns, tvec, rng, filt, partials, phase_cycles, blep_saw, stft, istft,
                   undb, mix_at, lfo_noise, wander, colored)
from instruments import bell as _bell


# ----------------------------------------------------------------------------- envelopes & safety
def env_ad(n: int, attack: float, tau: float) -> np.ndarray:
    t = tvec(n)
    e = np.exp(-t / max(tau, 1e-4))
    a = max(2, ns(attack))
    a = min(a, n)
    e[:a] *= 0.5 - 0.5 * np.cos(np.pi * np.arange(a) / a)
    return e


def safe(y: np.ndarray, fin: float = 0.001, fout: float = 0.006, hp: float = 25.0) -> np.ndarray:
    """DC-free, zero at both ends."""
    y = filt(y, [('bhp', hp, 2)], tail=0.05)
    n = y.size
    a = min(n // 4, max(2, ns(fin)))
    b = min(n // 4, max(2, ns(fout)))
    y[:a] *= 0.5 - 0.5 * np.cos(np.pi * np.arange(a) / a)
    y[n - b:] *= 0.5 + 0.5 * np.cos(np.pi * (np.arange(b) + 1) / b)
    return y


def norm(y: np.ndarray, peak_db: float = -1.0) -> np.ndarray:
    p = np.max(np.abs(y))
    return y * (undb(peak_db) / p) if p > 0 else y


def place(buf: np.ndarray, sig: np.ndarray, t: float, gain: float = 1.0) -> None:
    mix_at(buf, sig, ns(t), gain)


# ----------------------------------------------------------------------------- basic generators
def burst(r, dur: float, spec, attack: float = 0.001, tau: float = 0.01) -> np.ndarray:
    n = ns(dur)
    y = filt(r.standard_normal(n), spec, tail=0.02) * env_ad(n, attack, tau)
    return y


def modal(r, freqs, amps, t60s, dur: float, jitter: float = 0.0, attack: float = 0.0008) -> np.ndarray:
    freqs = np.asarray(freqs, float) * (1 + r.normal(0, jitter, len(freqs)))
    n = ns(dur)
    y = partials(freqs, amps, t60s, n, phases=r.uniform(0, TAU, len(freqs)))
    a = max(2, ns(attack))
    y[:a] *= 0.5 - 0.5 * np.cos(np.pi * np.arange(a) / a)
    return y


def impact(r, modes, amps, t60s, noise_spec, noise_tau=0.004, noise_gain=0.5, dur=0.5, jitter=0.03,
           v: float = 1.0):
    y = modal(r, modes, amps, t60s, dur, jitter)
    y /= np.max(np.abs(y)) + 1e-12
    nz = burst(r, dur, noise_spec, 0.0006, noise_tau)
    nz /= np.max(np.abs(nz)) + 1e-12
    return (y + noise_gain * nz) * v


def grains(r, dur: float, rate, grain_fn, jitter_amp: float = 0.5) -> np.ndarray:
    """Poisson grain cloud.  rate: scalar or callable(t)->grains/s.  grain_fn(r, amp)->array."""
    n = ns(dur)
    out = np.zeros(n + ns(0.5))
    t = 0.0
    rmax = rate if np.isscalar(rate) else max(rate(x) for x in np.linspace(0, dur, 200))
    while t < dur:
        t += r.exponential(1.0 / max(rmax, 1e-6))
        if t >= dur:
            break
        if not np.isscalar(rate) and r.random() > rate(t) / rmax:
            continue
        amp = math.exp(r.normal(0, jitter_amp))
        g = grain_fn(r, amp)
        mix_at(out, g, ns(t))
    return out[:n]


def stick_slip(r, dur: float, rate_pts, resonances, q: float = 8.0, jitter: float = 0.15,
               amp_pts=None) -> np.ndarray:
    """Creak / scrape: an irregular impulse train whose rate follows rate_pts [(t, Hz)],
    excited through resonant bandpasses."""
    n = ns(dur)
    pts = np.array(rate_pts, float)
    tt = tvec(n)
    rate = np.interp(tt, pts[:, 0], pts[:, 1])
    rate *= 1 + jitter * wander(n, 6.0, r)
    ph = np.cumsum(rate) / SR
    k = np.floor(ph)
    imp = np.zeros(n)
    idx = np.nonzero(np.diff(k) > 0)[0] + 1
    imp[idx] = 1.0 + 0.5 * r.standard_normal(idx.size)
    if amp_pts is not None:
        ap = np.array(amp_pts, float)
        imp *= np.interp(tt, ap[:, 0], ap[:, 1])
    y = np.zeros(n)
    for f, g in resonances:
        y += g * filt(imp, [('bp', f, q)], tail=0.05)
    y += 0.15 * filt(imp, [('bp', 3000, 1.0)], tail=0.02)
    return y


def bubble(r, f0: float, dur: float = 0.04, rise: float = 0.3, amp: float = 1.0) -> np.ndarray:
    """Minnaert bubble: damped sinusoid with upward chirp."""
    n = ns(dur)
    t = tvec(n)
    f = f0 * (1 + rise * t / dur)
    y = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / (dur * 0.3))
    a = ns(0.0008)
    y[:a] *= np.linspace(0, 1, a)
    return y * amp


def wind(r, dur: float, lo: float = 150, hi: float = 1200, gust_rate: float = 0.12, periodic: bool = False,
         whistle: float = 0.0) -> np.ndarray:
    """Wind: noise through a slowly moving band, gusts in level and brightness."""
    n = ns(dur)
    base = colored(n, r, -3.0, periodic=periodic)
    hp = filt(base, [('bhp', lo, 2), ('blp', hi, 2)], circular=periodic, tail=0.1)
    hb = filt(base, [('bhp', lo * 2.5, 2), ('blp', hi * 3, 2)], circular=periodic, tail=0.1)
    g = lfo_noise(n, gust_rate, r, periodic=periodic)
    lvl = undb(4.0 * g)
    bright = np.clip(0.5 + 0.35 * g, 0, 1)
    y = (hp * (1 - bright) + hb * bright) * lvl
    if whistle > 0:
        for f in (520, 760):
            w = filt(base, [('bp', f, 25.0)], circular=periodic, tail=0.2)
            y += whistle * w / (np.std(w) + 1e-9) * np.std(y) * np.clip(g, 0, None) ** 2
    return y / (np.std(y) + 1e-12)


# ----------------------------------------------------------------------------- voices (formant synthesis)
VOWELS = {
    'a': (730, 1090, 2440), 'e': (530, 1840, 2480), 'i': (300, 2250, 3000), 'o': (570, 840, 2410),
    'u': (320, 870, 2240), '@': (500, 1500, 2500), 'ae': (660, 1720, 2410),
}


def _formant_filter(x: np.ndarray, F: np.ndarray, gains=(1.0, 0.6, 0.35), bws=(90, 120, 170),
                    nfft: int = 1024, hop: int = 256) -> np.ndarray:
    """Time-varying formant filter.  F: (frames, 3) formant frequencies per STFT frame."""
    X = stft(x, nfft, hop)
    nf = X.shape[0]
    if F.shape[0] != nf:
        idx = np.linspace(0, F.shape[0] - 1, nf)
        F = np.vstack([np.interp(idx, np.arange(F.shape[0]), F[:, k]) for k in range(3)]).T
    f = np.fft.rfftfreq(nfft, 1 / SR)[None, :]
    E = np.zeros((nf, f.shape[1]))
    for k in range(3):
        E += gains[k] / (1 + ((f - F[:, k:k + 1]) / bws[k]) ** 2)
    return istft(X * E, x.size, nfft, hop)


def voice(r, dur: float, f0: float = 120.0, rate: float = 4.5, female: bool = False, pause: float = 0.6,
          breath: float = 0.08, laugh: bool = False) -> np.ndarray:
    """Unintelligible speech-like voice (babble element)."""
    n = ns(dur)
    hop = 256
    nfr = n // hop + 2
    tf = np.arange(nfr) * hop / SR
    f0c = np.zeros(nfr)
    amp = np.zeros(nfr)
    voiced = np.zeros(nfr)
    F = np.zeros((nfr, 3))
    t = r.uniform(0, 0.6)
    scale = 1.17 if female else 1.0
    vkeys = list(VOWELS)
    while t < dur:
        nsyl = int(r.integers(3, 11)) if not laugh else int(r.integers(4, 8))
        phrase_f0 = f0 * math.exp(r.normal(0, 0.08))
        for k in range(nsyl):
            sd = r.uniform(0.11, 0.26) if not laugh else r.uniform(0.15, 0.2)
            i0, i1 = int(t * SR / hop), int(min(t + sd, dur) * SR / hop)
            if i0 >= nfr:
                break
            i1 = min(i1, nfr - 1)
            decl = 1.15 - 0.3 * k / max(nsyl - 1, 1)
            ff = phrase_f0 * decl * math.exp(r.normal(0, 0.06))
            if laugh:
                ff = phrase_f0 * (1.35 - 0.06 * k)
            seg = np.arange(i0, i1 + 1)
            u = (seg - i0) / max(i1 - i0, 1)
            f0c[seg] = ff * (1 + 0.04 * np.sin(np.pi * u))
            env = np.sin(np.pi * np.clip(u * 1.1, 0, 1)) ** 0.6
            a_s = math.exp(r.normal(0, 0.3)) * (0.9 ** k if laugh else 1.0)
            amp[seg] = np.maximum(amp[seg], env * a_s)
            vw = VOWELS['a'] if laugh else VOWELS[vkeys[int(r.integers(len(vkeys)))]]
            F[seg] = np.array(vw) * scale * (1 + r.normal(0, 0.05, 3))
            voiced[seg] = 1.0 if (laugh or r.random() > 0.12) else 0.0
            t += sd + (r.uniform(0.0, 0.05) if not laugh else 0.03)
        t += r.exponential(pause) + 0.15
    # smooth controls
    def sm(x, w=5):
        return np.convolve(x, np.ones(w) / w, mode='same')
    f0c = np.where(f0c > 0, f0c, f0)
    f0s = sm(f0c, 7)
    amps = sm(amp, 4)
    vs = sm(voiced, 3)
    for k in range(3):
        F[:, k] = np.where(F[:, k] > 0, F[:, k], VOWELS['@'][k] * scale)
        F[:, k] = sm(F[:, k], 9)
    ta = np.arange(n)
    tc = np.arange(nfr) * hop
    f0a = np.interp(ta, tc, f0s) * (1 + 0.01 * wander(n, 5.0, r))
    ph = phase_cycles(f0a)
    src = blep_saw(ph, f0a / SR)
    src = filt(src, [('lp1', 900)], tail=0.02)
    nz = r.standard_normal(n)
    va = np.interp(ta, tc, vs)
    exc = src * va + nz * (breath + (1 - va) * 0.5) * (0.35 if not laugh else 0.6)
    y = _formant_filter(exc, F)
    y *= np.interp(ta, tc, amps)
    return y / (np.std(y) + 1e-9)


def murmur(r, dur: float, voices: int = 16, female_frac: float = 0.4, periodic: bool = True,
           rate: float = 4.5) -> np.ndarray:
    """Crowd murmur: many voices at different distances (returns stereo, periodic)."""
    n = ns(dur)
    out = np.zeros((2, n))
    for k in range(voices):
        fem = r.random() < female_frac
        f0 = r.uniform(175, 245) if fem else r.uniform(90, 150)
        v = voice(r, dur + 1.0, f0, rate, female=fem, pause=r.uniform(0.4, 1.6))
        dist = r.uniform(0.0, 1.0)
        v = filt(v, [('blp', 5500 - 3500 * dist, 1), ('bhp', 90, 1)], tail=0.05)
        g = 0.9 * (1 - 0.6 * dist)
        pan = r.uniform(-0.8, 0.8)
        # wrap the extra second for periodicity
        y = v[:n].copy()
        y[:ns(1.0)] += v[n:n + ns(1.0)] if periodic else 0
        out[0] += y * g * math.cos((pan + 1) * math.pi / 4) * 1.41
        out[1] += y * g * math.sin((pan + 1) * math.pi / 4) * 1.41
    return out / (np.std(out) + 1e-9)


def laugh(r, f0: float = 160.0, female: bool = False) -> np.ndarray:
    y = voice(r, 1.6, f0, female=female, laugh=True, pause=5.0, breath=0.2)
    return safe(y * env_ad(y.size, 0.01, 0.9))


def gasp_voice(r, f0=140.0, female=False) -> np.ndarray:
    n = ns(0.7)
    nz = r.standard_normal(n)
    vw = VOWELS['o' if r.random() < 0.5 else 'a']
    F = np.tile(np.array(vw, float) * (1.17 if female else 1.0), (n // 256 + 2, 1))
    y = _formant_filter(nz, F, gains=(1.0, 0.8, 0.5), bws=(160, 200, 260))
    t = tvec(n)
    env = np.clip(t / 0.03, 0, 1) * np.exp(-np.maximum(t - 0.08, 0) / 0.18)
    ph = phase_cycles(f0 * (1.4 - 0.4 * t / 0.7))
    vo = blep_saw(ph, np.full(n, f0 / SR)) * 0.15 * np.exp(-t / 0.12)
    return (y / (np.std(y) + 1e-9) + vo) * env


# ----------------------------------------------------------------------------- animals
def gull_call(r, syllables: int = 4, f_hi: float = 1900, f_lo: float = 1050) -> np.ndarray:
    out = []
    for k in range(syllables):
        d = r.uniform(0.17, 0.27) * (1.25 if k == 0 else 1.0)
        n = ns(d)
        t = tvec(n)
        fa = f_hi * (1 - 0.06 * k) * math.exp(r.normal(0, 0.03))
        fb = f_lo * math.exp(r.normal(0, 0.04))
        u = t / d
        f = fa * (fb / fa) ** (u ** 0.7)
        f *= 1 + 0.02 * np.sin(TAU * 70 * t)  # roughness
        ph = np.cumsum(f) / SR
        y = np.zeros(n)
        for h, a in [(1, 1.0), (2, 0.55), (3, 0.3), (4, 0.15)]:
            y += a * np.sin(TAU * h * ph)
        y += 0.25 * filt(r.standard_normal(n), [('bp', 2500, 1.2)], tail=0.01)
        env = np.sin(np.pi * np.clip(u * 1.05, 0, 1)) ** 0.5 * (1 - 0.3 * u)
        out.append(y * env)
        out.append(np.zeros(ns(r.uniform(0.05, 0.12))))
    y = np.concatenate(out)
    return safe(y)


def crow_caw(r, n_caws: int = 3) -> np.ndarray:
    out = []
    for k in range(n_caws):
        d = r.uniform(0.25, 0.38)
        n = ns(d)
        t = tvec(n)
        u = t / d
        f0 = r.uniform(520, 650) * (1 - 0.12 * u)
        ph = np.cumsum(f0 * (1 + 0.08 * r.standard_normal(n).cumsum() / np.sqrt(np.arange(1, n + 1)))) / SR
        src = blep_saw(ph, f0 / SR)
        rough = 1 + 0.6 * np.sign(np.sin(TAU * 85 * t)) * r.uniform(0.5, 1.0)
        nz = r.standard_normal(n) * 0.6
        x = src * rough + nz
        F = np.tile(np.array([1150, 1900, 3000.0]), (n // 256 + 2, 1))
        y = _formant_filter(x, F, gains=(1.0, 0.8, 0.4), bws=(220, 300, 400))
        env = np.clip(u / 0.08, 0, 1) * np.clip((1 - u) / 0.25, 0, 1)
        out.append(y / (np.std(y) + 1e-9) * env)
        out.append(np.zeros(ns(r.uniform(0.18, 0.35))))
    return safe(np.concatenate(out))


def dog_bark(r, n_barks: int = 2) -> np.ndarray:
    out = []
    for k in range(n_barks):
        d = r.uniform(0.13, 0.2)
        n = ns(d)
        t = tvec(n)
        u = t / d
        f0 = r.uniform(380, 520) * (1.25 - 0.45 * u)
        ph = np.cumsum(f0) / SR
        src = blep_saw(ph, f0 / SR) + 0.5 * r.standard_normal(n)
        F = np.tile(np.array([700, 1400, 2600.0]), (n // 256 + 2, 1))
        y = _formant_filter(src, F, gains=(1.0, 0.7, 0.3), bws=(200, 250, 350))
        env = np.clip(u / 0.06, 0, 1) * np.exp(-np.maximum(u - 0.3, 0) * 4)
        out.append(y / (np.std(y) + 1e-9) * env)
        out.append(np.zeros(ns(r.uniform(0.18, 0.3))))
    return safe(np.concatenate(out))


# ----------------------------------------------------------------------------- horns, bells, engines
def foghorn(r, dur: float = 3.0, f0: float = 148.0) -> np.ndarray:
    """Diaphone foghorn: rich reed tone, slow speaking attack, the falling 'grunt' at the end."""
    n = ns(dur + 0.8)
    t = tvec(n)
    pitch = np.ones(n)
    pitch *= 1 - 0.03 * np.exp(-t / 0.25)
    grunt_t = dur - 0.15
    pitch *= 1 - 0.28 * np.clip((t - grunt_t) / 0.55, 0, 1) ** 1.5
    f = f0 * pitch * (1 + 0.003 * wander(n, 3.0, r))
    ph = phase_cycles(f)
    y = blep_saw(ph, f / SR) * 0.6 + 0.4 * np.sign(np.sin(TAU * ph)) * 0.5
    y = filt(y, [('blp', 1300, 2), ('pk', 450, 1.0, 4), ('bhp', 60, 2)], tail=0.05)
    env = np.clip(t / 0.35, 0, 1) ** 1.5 * np.clip((dur + 0.6 - t) / 0.6, 0, 1)
    y *= env
    return safe(y / (np.max(np.abs(y)) + 1e-12))


def bell_strike(f: float, kind: str, v: float = 0.8, seed=0, length=None, t60_scale=1.0) -> np.ndarray:
    return _bell(f, kind, v, seed=seed, length=length, t60_scale=t60_scale)


def ringer(r, dur: float = 1.5, f1: float = 1180.0, f2: float = 1520.0, rate: float = 20.0,
           kind: str = 'phone', tail: float = 0.5) -> np.ndarray:
    """Electromechanical bell ringer: a clapper alternately striking two gongs."""
    n = ns(dur + tail)
    out = np.zeros(n + ns(1.5))
    b1 = _bell(f1, kind, 0.7, seed=1, length=1.2)
    b2 = _bell(f2, kind, 0.7, seed=2, length=1.2)
    t = 0.0
    k = 0
    while t < dur:
        g = 0.6 + 0.4 * r.random()
        mix_at(out, b1 if k % 2 == 0 else b2, ns(t), g * 0.35)
        t += 1.0 / (rate * (1 + 0.03 * r.normal()))
        k += 1
    y = out[:n]
    # clapper damps the gongs when it stops: fast decay after dur
    tt = tvec(n)
    y *= np.where(tt > dur, np.exp(-(tt - dur) / 0.12), 1.0)
    return safe(y)


def engine(r, dur: float, rpm_pts, cyl: int = 6, load_pts=None, rough: float = 0.3) -> np.ndarray:
    """Combustion engine: firing-rate harmonics + exhaust noise pulsed at firing rate."""
    n = ns(dur)
    t = tvec(n)
    rp = np.array(rpm_pts, float)
    rpm = np.interp(t, rp[:, 0], rp[:, 1])
    ff = rpm / 60.0 * cyl / 2.0
    ff *= 1 + 0.01 * wander(n, 4.0, r)
    ph = np.cumsum(ff) / SR
    y = np.zeros(n)
    for h, a in [(0.5, 0.5), (1, 1.0), (2, 0.6), (3, 0.35), (4, 0.25), (6, 0.12)]:
        y += a * np.sin(TAU * h * ph + r.uniform(0, TAU))
    pulse = (0.5 + 0.5 * np.cos(TAU * ph)) ** 3
    ex = filt(r.standard_normal(n), [('blp', 900, 1), ('bhp', 50, 1)], tail=0.05) * (0.4 + rough * pulse)
    y = y * 0.5 + ex * 1.2
    if load_pts is not None:
        lp = np.array(load_pts, float)
        y *= np.interp(t, lp[:, 0], lp[:, 1])
    return y / (np.std(y) + 1e-9)


def car_pass(r, dur: float = 5.0, wet: bool = True, peak_t=None, speed: float = 1.0) -> np.ndarray:
    """A car passing by (mono with built-in distance envelope); returns (mono, pan_curve)."""
    n = ns(dur)
    t = tvec(n)
    tc = peak_t if peak_t is not None else dur * 0.5
    tau = 0.9 / speed
    prox = 1.0 / (1.0 + ((t - tc) / tau) ** 2)
    hiss = filt(r.standard_normal(n), [('bhp', 400, 2), ('blp', 6000 if wet else 3000, 2), ('pk', 2500, 0.8, 4 if wet else 0)], tail=0.05)
    hiss /= np.std(hiss) + 1e-9
    dop = 1 + 0.06 * np.tanh((tc - t) / (tau * 0.6))
    eng = engine(r, dur, [(0, 1500), (dur, 1500)], cyl=6) * 0.6
    eng = filt(eng, [('blp', 400, 1)], tail=0.05)
    y = (hiss * (0.8 if wet else 0.35) + eng * 0.5) * prox ** 1.2
    y = y * (0.4 + 0.6 * prox)
    pan = np.tanh((t - tc) / tau) * 0.8
    return y, pan, dop


# ----------------------------------------------------------------------------- mechanisms
def keystroke(r, typist: int = 0, v: float = 1.0) -> np.ndarray:
    rr = rng('typist', typist)
    base = rr.uniform(0.85, 1.15)
    modes = np.array([170, 1150, 2500, 3900, 5600]) * base
    y = impact(r, modes, [0.8, 0.6, 0.5, 0.35, 0.2], [0.05, 0.03, 0.02, 0.015, 0.01],
               [('bp', 4200 * base, 0.8)], noise_tau=0.0015, noise_gain=0.8, dur=0.12, jitter=0.05)
    # key-return click
    rel = impact(r, modes * 1.3, [0.3, 0.4, 0.4, 0.3, 0.2], [0.03, 0.02, 0.015, 0.01, 0.008],
                 [('bp', 5000, 1.0)], noise_tau=0.001, noise_gain=0.6, dur=0.06, jitter=0.05)
    out = np.zeros(ns(0.2))
    out[:y.size] += y
    mix_at(out, rel * 0.25, ns(r.uniform(0.05, 0.08)))
    return out * v


def carriage_return(r) -> np.ndarray:
    out = np.zeros(ns(1.3))
    b = _bell(2650, 'phone', 0.6, seed=7, length=0.9)
    mix_at(out, b, 0, 0.35)
    t0 = 0.25
    for k in range(9):
        c = impact(r, [900, 2300, 4100], [1, 0.6, 0.4], [0.02, 0.012, 0.01], [('bp', 4000, 1)], dur=0.04, noise_gain=0.6)
        mix_at(out, c, ns(t0 + k * 0.035), 0.25)
    slide = burst(r, 0.28, [('bp', 1800, 0.7)], 0.03, 0.15)
    mix_at(out, slide, ns(t0 + 0.05), 0.25)
    clunk = impact(r, [150, 420, 1300], [1, 0.6, 0.3], [0.08, 0.05, 0.03], [('lp', 2000, 0.7)], dur=0.2)
    mix_at(out, clunk, ns(t0 + 0.36), 0.6)
    return safe(out)


def teletype(r, dur: float = 3.0) -> np.ndarray:
    n = ns(dur)
    out = np.zeros(n + ns(0.2))
    t = 0.0
    while t < dur:
        for c in range(int(r.integers(2, 4))):
            k = impact(r, [700, 1900, 3400, 5200], [0.7, 0.6, 0.5, 0.3], [0.025, 0.018, 0.012, 0.009],
                       [('bp', 3800, 1)], dur=0.05, noise_gain=0.7)
            mix_at(out, k, ns(t + c * 0.012), 0.3 * r.uniform(0.6, 1.0))
        t += 0.1 * r.uniform(0.92, 1.08)
    hum = np.sin(TAU * 60 * tvec(n)) * 0.04 + filt(r.standard_normal(n), [('bp', 240, 2)], tail=0.05) * 0.03
    out[:n] += hum
    return safe(out[:n])


def pneumatic(r) -> np.ndarray:
    n = ns(1.1)
    t = tvec(n)
    nz = r.standard_normal(n)
    # whoosh: band sweeps up then down as the carrier approaches
    lo = filt(nz, [('bp', 500, 1.0)], tail=0.05)
    hi = filt(nz, [('bp', 1800, 1.0)], tail=0.05)
    u = np.clip(t / 0.55, 0, 1)
    w = np.sin(np.pi * u) ** 2
    y = (lo * (1 - u) + hi * u) * w * 0.6
    thunk = impact(r, [95, 240, 610, 1600], [1, 0.7, 0.4, 0.2], [0.12, 0.08, 0.05, 0.03], [('lp', 1500, 0.7)], dur=0.5)
    mix_at(y, thunk, ns(0.55), 1.2)
    clank = impact(r, [1200, 2650, 4100], [1, 0.6, 0.3], [0.15, 0.1, 0.06], [('bp', 3000, 1)], dur=0.3)
    mix_at(y, clank, ns(0.6), 0.3)
    return safe(y)


def clock_tick(r, kind: int = 0, tock: bool = False) -> np.ndarray:
    rr = rng('clock', kind)
    body = rr.uniform(380, 900) * (0.92 if tock else 1.0)
    metal = rr.uniform(2600, 5200) * (0.95 if tock else 1.0)
    y = impact(r, [body, body * 2.3, metal, metal * 1.5], [0.6, 0.3, 0.6, 0.3],
               [0.05, 0.03, 0.025, 0.015], [('bp', metal, 1.5)], noise_tau=0.0008, noise_gain=0.5, dur=0.09, jitter=0.01)
    y2 = impact(r, [metal * 1.1, metal * 1.7], [0.5, 0.3], [0.015, 0.01], [('bp', metal, 1.5)], dur=0.03, noise_gain=0.4)
    out = np.zeros(ns(0.12))
    out[:y.size] += y
    mix_at(out, y2 * 0.4, ns(rr.uniform(0.004, 0.012)))
    return safe(out)


def footstep(r, surface: str, v: float = 1.0) -> np.ndarray:
    """Heel + ball contact on a surface."""
    def contact(level):
        if surface == 'wood':
            y = impact(r, [110, 230, 470, 880, 1500], [1, 0.8, 0.5, 0.3, 0.2], [0.09, 0.07, 0.05, 0.035, 0.02],
                       [('bp', 2200, 0.9)], noise_tau=0.0025, noise_gain=0.45, dur=0.25, jitter=0.06)
        elif surface == 'stone':
            y = impact(r, [95, 180, 2600, 4100], [0.8, 0.5, 0.3, 0.2], [0.04, 0.03, 0.02, 0.015],
                       [('bp', 3500, 0.7)], noise_tau=0.003, noise_gain=1.0, dur=0.2, jitter=0.08)
            y += 0.25 * burst(r, 0.2, [('bp', 5000, 1.0)], 0.004, 0.03)[:y.size]
        elif surface == 'metal':
            y = impact(r, [180, 410, 820, 1350, 2100, 3050], [0.6, 1, 0.7, 0.5, 0.4, 0.25],
                       [0.35, 0.3, 0.25, 0.18, 0.12, 0.08], [('bp', 3000, 0.8)], noise_tau=0.002, noise_gain=0.5,
                       dur=0.6, jitter=0.05)
        elif surface == 'carpet':
            y = burst(r, 0.18, [('blp', 550, 1), ('bhp', 50, 1)], 0.006, 0.03) * 2.0
            y += 0.15 * burst(r, 0.18, [('bp', 3000, 0.8)], 0.01, 0.04)
        elif surface == 'tile':
            y = impact(r, [120, 1900, 2850, 4300, 6200], [0.6, 0.8, 0.7, 0.5, 0.3], [0.04, 0.04, 0.03, 0.02, 0.015],
                       [('bp', 4000, 0.8)], noise_tau=0.0015, noise_gain=0.8, dur=0.2, jitter=0.04)
        elif surface == 'grass':
            def g(rr, a):
                return burst(rr, 0.012, [('bp', rr.uniform(2500, 7000), 1.5)], 0.0005, 0.002) * a
            y = grains(r, 0.22, lambda tt: 600 * math.exp(-tt / 0.07), g, 0.6)
            y += 0.6 * burst(r, 0.22, [('blp', 300, 1)], 0.008, 0.035)
        elif surface == 'water':
            y = burst(r, 0.35, [('blp', 2200, 1), ('bhp', 120, 1)], 0.004, 0.07) * 1.2
            for k in range(int(r.integers(3, 7))):
                mix_at(y, bubble(r, r.uniform(700, 2400), r.uniform(0.02, 0.05), 0.4, 0.5), ns(r.uniform(0.01, 0.2)))
        else:
            raise ValueError(surface)
        return y * level
    out = np.zeros(ns(0.7 if surface == 'metal' else 0.45))
    h = contact(1.0)
    mix_at(out, h, 0)
    toe = contact(0.55)
    mix_at(out, toe, ns(r.uniform(0.045, 0.085)))
    return safe(out * v)


def drip(r, f: float = 1400.0, wet: float = 1.0) -> np.ndarray:
    n = ns(0.35)
    y = np.zeros(n)
    tap = burst(r, 0.01, [('bp', 3000, 1)], 0.0004, 0.0012)
    y[:tap.size] += tap * 0.4
    mix_at(y, bubble(r, f * math.exp(r.normal(0, 0.08)), 0.06, 0.6, 1.0), ns(0.003))
    return safe(y)
