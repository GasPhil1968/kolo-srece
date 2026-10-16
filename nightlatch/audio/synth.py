"""DSP core for the NIGHT LATCH audio pipeline (pure numpy, no scipy).

Conventions
-----------
* Sample rate SR = 44100, float64 buffers, mono = shape (n,), stereo = shape (2, n).
* Static filters are applied in the frequency domain (exact biquad / analog-prototype
  responses evaluated on the FFT grid).  ``circular=True`` treats the buffer as one period
  of a loop, so filter ringing wraps around the loop point instead of being cut.
* Time-varying timbre is produced additively (per-partial envelopes) or with band-limited
  wavetables / polyBLEP oscillators, never with naive aliasing waveforms.
"""
from __future__ import annotations

import math
import zlib

import numpy as np

SR = 44100
NYQ = SR / 2.0
TAU = 2.0 * math.pi


# ----------------------------------------------------------------------------- basics
def undb(d):
    return 10.0 ** (np.asarray(d, dtype=float) / 20.0)


def todb(a):
    return 20.0 * np.log10(np.maximum(np.abs(np.asarray(a, dtype=float)), 1e-12))


def mtof(m):
    return 440.0 * 2.0 ** ((np.asarray(m, dtype=float) - 69.0) / 12.0)


def ftom(f):
    return 69.0 + 12.0 * np.log2(np.asarray(f, dtype=float) / 440.0)


def ns(sec: float) -> int:
    return int(round(float(sec) * SR))


def tvec(n: int) -> np.ndarray:
    return np.arange(n, dtype=float) / SR


def seed_of(*parts) -> int:
    return zlib.crc32(repr(parts).encode('utf-8')) & 0x7FFFFFFF


def rng(*parts) -> np.random.Generator:
    return np.random.default_rng(seed_of(*parts))


def next_fast_len(n: int) -> int:
    """Smallest 5-smooth integer >= n (fast FFT size)."""
    n = max(int(n), 1)
    best = 1 << (n - 1).bit_length()
    p5 = 1
    while p5 < best:
        p35 = p5
        while p35 < best:
            q = -(-n // p35)
            cand = p35 * (1 << (q - 1).bit_length())
            if cand < best:
                best = cand
            p35 *= 3
        p5 *= 5
    return best


def mix_at(buf: np.ndarray, sig: np.ndarray, start: int, gain: float = 1.0) -> None:
    """Add ``sig`` into ``buf`` starting at sample ``start`` (clipped to the buffer)."""
    n = sig.shape[-1]
    s0 = max(0, start)
    s1 = min(buf.shape[-1], start + n)
    if s1 <= s0:
        return
    if gain == 1.0:
        buf[..., s0:s1] += sig[..., s0 - start:s1 - start]
    else:
        buf[..., s0:s1] += gain * sig[..., s0 - start:s1 - start]


def fold_loop(buf: np.ndarray, length: int, pre: int = 0) -> np.ndarray:
    """Fold an extended render (``pre`` samples of pre-roll, then the loop, then tail)
    circularly into exactly ``length`` samples."""
    out = np.zeros(buf.shape[:-1] + (length,))
    total = buf.shape[-1]
    # sample i of buf corresponds to loop time (i - pre) mod length
    idx = 0
    while idx < total:
        seg_start_time = (idx - pre) % length
        take = min(length - seg_start_time, total - idx)
        out[..., seg_start_time:seg_start_time + take] += buf[..., idx:idx + take]
        idx += take
    return out


def pan_gains(pan: float):
    """Constant-power pan law; pan in [-1, 1]."""
    th = (float(np.clip(pan, -1, 1)) + 1.0) * math.pi / 4.0
    return math.cos(th), math.sin(th)


def to_stereo(mono: np.ndarray, pan: float = 0.0, width: float = 0.0) -> np.ndarray:
    """Pan a mono signal; centre = unity gain in each channel (+3 dB at the extremes)."""
    gl, gr = pan_gains(pan)
    return np.vstack([mono * gl, mono * gr]) * math.sqrt(2.0)


def fade(x: np.ndarray, fin: float = 0.005, fout: float = 0.005) -> np.ndarray:
    """Raised-cosine fade in/out (seconds)."""
    x = np.array(x, dtype=float, copy=True)
    n = x.shape[-1]
    a = min(ns(fin), n // 2)
    r = min(ns(fout), n // 2)
    if a > 0:
        x[..., :a] *= 0.5 - 0.5 * np.cos(np.pi * np.arange(a) / a)
    if r > 0:
        x[..., n - r:] *= 0.5 + 0.5 * np.cos(np.pi * (np.arange(r) + 1) / r)
    return x


def normalize_peak(x: np.ndarray, peak_db: float = -1.0) -> np.ndarray:
    p = np.max(np.abs(x))
    if p <= 0:
        return x
    return x * (undb(peak_db) / p)


def rms(x) -> float:
    x = np.asarray(x, dtype=float)
    return float(np.sqrt(np.mean(x * x) + 1e-30))


# ----------------------------------------------------------------------------- filters
def _biquad(kind: str, f0: float, q: float = 0.7071, gain_db: float = 0.0):
    f0 = float(np.clip(f0, 1.0, NYQ * 0.999))
    w0 = TAU * f0 / SR
    cw, sw = math.cos(w0), math.sin(w0)
    alpha = sw / (2.0 * q)
    A = 10.0 ** (gain_db / 40.0)
    if kind == 'lp':
        b = ((1 - cw) / 2, 1 - cw, (1 - cw) / 2)
        a = (1 + alpha, -2 * cw, 1 - alpha)
    elif kind == 'hp':
        b = ((1 + cw) / 2, -(1 + cw), (1 + cw) / 2)
        a = (1 + alpha, -2 * cw, 1 - alpha)
    elif kind == 'bp':  # 0 dB peak
        b = (alpha, 0.0, -alpha)
        a = (1 + alpha, -2 * cw, 1 - alpha)
    elif kind == 'notch':
        b = (1.0, -2 * cw, 1.0)
        a = (1 + alpha, -2 * cw, 1 - alpha)
    elif kind == 'pk':
        b = (1 + alpha * A, -2 * cw, 1 - alpha * A)
        a = (1 + alpha / A, -2 * cw, 1 - alpha / A)
    elif kind in ('ls', 'hs'):
        sq = 2.0 * math.sqrt(A) * alpha
        if kind == 'ls':
            b = (A * ((A + 1) - (A - 1) * cw + sq), 2 * A * ((A - 1) - (A + 1) * cw),
                 A * ((A + 1) - (A - 1) * cw - sq))
            a = ((A + 1) + (A - 1) * cw + sq, -2 * ((A - 1) + (A + 1) * cw),
                 (A + 1) + (A - 1) * cw - sq)
        else:
            b = (A * ((A + 1) + (A - 1) * cw + sq), -2 * A * ((A - 1) + (A + 1) * cw),
                 A * ((A + 1) + (A - 1) * cw - sq))
            a = ((A + 1) - (A - 1) * cw + sq, 2 * ((A - 1) - (A + 1) * cw),
                 (A + 1) - (A - 1) * cw - sq)
    else:
        raise ValueError(kind)
    return b, a


def response(spec, f: np.ndarray) -> np.ndarray:
    """Complex/real frequency response of a filter spec evaluated at frequencies f (Hz).

    spec items:
      ('lp'|'hp'|'bp'|'notch', f0, q)            RBJ biquads (causal)
      ('pk'|'ls'|'hs', f0, q, gain_db)          RBJ EQ biquads
      ('lp1'|'hp1', fc)                          first-order (bilinear)
      ('blp'|'bhp', fc, order)                   Butterworth via cascaded biquads
      ('curve', [(f, db), ...])                  zero-phase magnitude, log-f interpolation
      ('tilt', db_per_oct, f_ref)                zero-phase spectral tilt
      callable(f) -> H
    """
    f = np.asarray(f, dtype=float)
    if f.ndim == 1 and f.size > 262144 and not callable(spec):
        # evaluate on a fine uniform grid and interpolate (filters are smooth at 0.7 Hz scale)
        g = np.linspace(0.0, NYQ, 131073)
        Hg = response(spec, g)
        return np.interp(f, g, Hg.real) + 1j * np.interp(f, g, Hg.imag)
    H = np.ones_like(f, dtype=complex)
    if callable(spec):
        return H * spec(f)
    z1 = np.exp(-1j * TAU * f / SR)
    z2 = z1 * z1
    for item in spec:
        if callable(item):
            H = H * item(f)
            continue
        kind = item[0]
        if kind in ('lp', 'hp', 'bp', 'notch'):
            q = item[2] if len(item) > 2 else 0.7071
            b, a = _biquad(kind, item[1], q)
            H = H * (b[0] + b[1] * z1 + b[2] * z2) / (a[0] + a[1] * z1 + a[2] * z2)
        elif kind in ('pk', 'ls', 'hs'):
            q = item[2] if len(item) > 2 else 0.7071
            g = item[3] if len(item) > 3 else 0.0
            b, a = _biquad(kind, item[1], q, g)
            H = H * (b[0] + b[1] * z1 + b[2] * z2) / (a[0] + a[1] * z1 + a[2] * z2)
        elif kind in ('lp1', 'hp1'):
            fc = float(np.clip(item[1], 1.0, NYQ * 0.999))
            K = math.tan(math.pi * fc / SR)
            if kind == 'lp1':
                b0 = b1 = K / (1 + K)
            else:
                b0 = 1 / (1 + K)
                b1 = -b0
            a1 = (K - 1) / (K + 1)
            H = H * (b0 + b1 * z1) / (1 + a1 * z1)
        elif kind in ('blp', 'bhp'):
            order = int(item[2]) if len(item) > 2 else 4
            base = 'lp' if kind == 'blp' else 'hp'
            if order % 2 == 1:
                H = H * response([(base + '1', item[1])], f)
            for k in range(1, order // 2 + 1):
                th = math.pi * (2 * k - 1) / (2 * order)
                if order % 2 == 1:
                    th = math.pi * k / order
                q = 1.0 / (2.0 * math.cos(th)) if order % 2 == 0 else 1.0 / (2.0 * math.cos(th))
                b, a = _biquad(base, item[1], q)
                H = H * (b[0] + b[1] * z1 + b[2] * z2) / (a[0] + a[1] * z1 + a[2] * z2)
        elif kind == 'curve':
            pts = np.array(item[1], dtype=float)
            lf = np.log2(np.maximum(f, 1.0))
            g = np.interp(lf, np.log2(pts[:, 0]), pts[:, 1])
            H = H * undb(g)
        elif kind == 'tilt':
            slope, fref = item[1], item[2] if len(item) > 2 else 1000.0
            H = H * undb(slope * np.log2(np.maximum(f, 20.0) / fref))
        else:
            raise ValueError(kind)
    return H


def filt(x: np.ndarray, spec, circular: bool = False, tail: float = 0.4,
         keep_tail: bool = False) -> np.ndarray:
    """Filter a mono/stereo buffer with a frequency-domain response (see ``response``)."""
    x = np.asarray(x, dtype=float)
    n = x.shape[-1]
    if n == 0:
        return x.copy()
    t = ns(tail)
    if circular:
        t = min(t, n)
    N = next_fast_len(n + 2 * t + 16)
    X = np.fft.rfft(x, N, axis=-1)
    f = np.fft.rfftfreq(N, 1.0 / SR)
    H = response(spec, f)
    y = np.fft.irfft(X * H, N, axis=-1)
    if keep_tail and not circular:
        return y[..., :n + t].copy()
    out = y[..., :n].copy()
    if circular and t > 0:
        out[..., :t] += y[..., n:n + t]
        out[..., n - t:] += y[..., N - t:]
    return out


def dc_block(x: np.ndarray, fc: float = 18.0, circular: bool = False) -> np.ndarray:
    return filt(x, [('bhp', fc, 2)], circular=circular, tail=1.0)


def convolve(x: np.ndarray, h: np.ndarray, circular: bool = False, keep_tail: bool = True) -> np.ndarray:
    """FFT convolution.  x: (..., n), h: (..., m) broadcastable.  circular folds the tail."""
    x = np.asarray(x, dtype=float)
    h = np.asarray(h, dtype=float)
    n, m = x.shape[-1], h.shape[-1]
    N = next_fast_len(n + m)
    y = np.fft.irfft(np.fft.rfft(x, N, axis=-1) * np.fft.rfft(h, N, axis=-1), N, axis=-1)
    if circular:
        out = y[..., :n].copy()
        tail = y[..., n:n + m]
        k = 0
        while k < tail.shape[-1]:
            seg = tail[..., k:k + n]
            out[..., :seg.shape[-1]] += seg
            k += n
        return out
    return y[..., :n + m - 1] if keep_tail else y[..., :n]


# ----------------------------------------------------------------------------- noise
def white(n: int, r: np.random.Generator) -> np.ndarray:
    return r.standard_normal(n)


def colored(n: int, r: np.random.Generator, slope_db_oct: float = -3.0, f_lo: float = 20.0,
            f_hi: float = NYQ, periodic: bool = False) -> np.ndarray:
    """Noise with a power-law spectrum (dB/oct), unit RMS.  periodic=True → exact period n."""
    N = n if periodic else next_fast_len(n)
    f = np.fft.rfftfreq(N, 1.0 / SR)
    mag = undb(slope_db_oct * np.log2(np.maximum(f, f_lo) / 1000.0))
    mag[f < f_lo * 0.5] = 0.0
    mag[f > f_hi] = 0.0
    ph = r.uniform(0, TAU, f.size)
    y = np.fft.irfft(mag * np.exp(1j * ph), N)[:n]
    return y / (rms(y) + 1e-12)


def shaped_noise(n: int, r: np.random.Generator, spec, periodic: bool = False) -> np.ndarray:
    """Noise with magnitude given by filter spec; unit RMS."""
    N = n if periodic else next_fast_len(n)
    f = np.fft.rfftfreq(N, 1.0 / SR)
    mag = np.abs(response(spec, f))
    ph = r.uniform(0, TAU, f.size)
    y = np.fft.irfft(mag * np.exp(1j * ph), N)[:n]
    return y / (rms(y) + 1e-12)


def lfo_noise(n: int, rate_hz: float, r: np.random.Generator, periodic: bool = True) -> np.ndarray:
    """Smooth random control signal (unit std) with bandwidth ~rate_hz.  Exactly periodic
    over n samples when periodic=True."""
    hop = max(1, int(SR / max(rate_hz * 16.0, 1e-3)))
    m = max(8, int(math.ceil(n / hop)))
    v = r.standard_normal(m)
    F = np.fft.rfft(v)
    fr = np.fft.rfftfreq(m, hop / SR)
    F *= np.exp(-0.5 * (fr / max(rate_hz, 1e-6)) ** 2)
    F[0] = 0.0
    c = np.fft.irfft(F, m)
    c /= (np.std(c) + 1e-12)
    pos = np.arange(n) * (m / n) if periodic else np.arange(n) / hop
    i0 = np.floor(pos).astype(int)
    fr_ = pos - i0
    i0 %= m
    i1 = (i0 + 1) % m
    w = 0.5 - 0.5 * np.cos(np.pi * fr_)
    return c[i0] * (1 - w) + c[i1] * w


# ----------------------------------------------------------------------------- envelopes
def env_points(points, n: int, shape: str = 'lin') -> np.ndarray:
    """Breakpoint envelope: points = [(time_s, value), ...] → array of n samples.
    shape 'lin' or 'cos' (smooth S-curves between points)."""
    pts = np.array(points, dtype=float)
    t = tvec(n)
    if shape == 'lin':
        return np.interp(t, pts[:, 0], pts[:, 1])
    idx = np.clip(np.searchsorted(pts[:, 0], t, side='right') - 1, 0, len(pts) - 2)
    t0, t1 = pts[idx, 0], pts[idx + 1, 0]
    v0, v1 = pts[idx, 1], pts[idx + 1, 1]
    u = np.clip((t - t0) / np.maximum(t1 - t0, 1e-9), 0, 1)
    w = 0.5 - 0.5 * np.cos(np.pi * u)
    out = v0 + (v1 - v0) * w
    out[t >= pts[-1, 0]] = pts[-1, 1]
    out[t <= pts[0, 0]] = pts[0, 1]
    return out


def attack_release(n: int, attack: float, release: float, gate: float | None = None,
                   curve: float = 1.0) -> np.ndarray:
    """Attack (raised cosine) → sustain 1 → release (exp-ish) starting at gate (s)."""
    env = np.ones(n)
    a = max(1, ns(attack))
    a = min(a, n)
    env[:a] = (0.5 - 0.5 * np.cos(np.pi * np.arange(a) / a)) ** curve
    if gate is not None:
        g = min(ns(gate), n)
        r = max(1, ns(release))
        k = np.arange(n - g)
        rel = np.exp(-k / (r / 4.0))
        rel *= np.clip(1.0 - k / (r * 1.25), 0, 1)  # reach zero
        env[g:] *= rel
    return env


def decay_env(n: int, t60: float) -> np.ndarray:
    return np.exp(-6.907755 * tvec(n) / max(t60, 1e-4))


# ----------------------------------------------------------------------------- oscillators
def phase_cycles(freq, n: int | None = None, phase0: float = 0.0) -> np.ndarray:
    """Integrate an instantaneous frequency (Hz, scalar or array) to phase in cycles."""
    if np.isscalar(freq):
        return phase0 + float(freq) * tvec(int(n))
    f = np.asarray(freq, dtype=float)
    ph = np.empty_like(f)
    ph[0] = 0.0
    np.cumsum(f[:-1] / SR, out=ph[1:])
    return ph + phase0


def make_table(amps, phases=None, size: int = 4096) -> np.ndarray:
    """Single-cycle wavetable from harmonic amplitudes (harmonic 1 = amps[0])."""
    amps = np.asarray(amps, dtype=float)
    K = min(len(amps), size // 2 - 1)
    spec = np.zeros(size // 2 + 1, dtype=complex)
    ph = np.zeros(K) if phases is None else np.asarray(phases, dtype=float)[:K]
    spec[1:K + 1] = amps[:K] * (size / 2.0) * np.exp(1j * (ph - np.pi / 2))
    return np.fft.irfft(spec, size)


def table_read(table: np.ndarray, ph: np.ndarray) -> np.ndarray:
    size = table.size
    idx = (ph % 1.0) * size
    i0 = idx.astype(np.int64)
    fr = idx - i0
    i0 %= size
    i1 = (i0 + 1) % size
    return table[i0] + (table[i1] - table[i0]) * fr


def bl_table(spectrum_fn, f_top: float, size: int = 4096, rolloff_start: float = 0.75,
             phases=None) -> np.ndarray:
    """Band-limited table: harmonics k with k*f_top below ~18 kHz (soft taper near limit)."""
    kmax = max(1, int(min(18500.0, NYQ * 0.92) / max(f_top, 1.0)))
    kmax = min(kmax, size // 2 - 2)
    k = np.arange(1, kmax + 1)
    a = np.asarray(spectrum_fn(k), dtype=float)
    taper = np.clip((kmax - k) / max(1.0, kmax * (1 - rolloff_start)), 0, 1) ** 0.5
    taper[k <= kmax * rolloff_start] = 1.0
    return make_table(a * taper, phases, size)


def blep_saw(ph: np.ndarray, inc: np.ndarray) -> np.ndarray:
    """polyBLEP sawtooth from phase (cycles) and per-sample increment (f/SR)."""
    t = ph % 1.0
    inc = np.broadcast_to(np.asarray(inc, dtype=float), t.shape)
    y = 2.0 * t - 1.0
    m = t < inc
    x = t[m] / inc[m]
    y[m] -= x + x - x * x - 1.0
    m = t > 1.0 - inc
    x = (t[m] - 1.0) / inc[m]
    y[m] -= x * x + x + x + 1.0
    return y


def blep_square(ph: np.ndarray, inc: np.ndarray, pw: float = 0.5) -> np.ndarray:
    t = ph % 1.0
    inc = np.broadcast_to(np.asarray(inc, dtype=float), t.shape)
    y = np.where(t < pw, 1.0, -1.0)

    def blep(tt, dt):
        out = np.zeros_like(tt)
        m = tt < dt
        x = tt[m] / dt[m]
        out[m] = x + x - x * x - 1.0
        m = tt > 1.0 - dt
        x = (tt[m] - 1.0) / dt[m]
        out[m] = x * x + x + x + 1.0
        return out
    y += blep(t, inc)
    y -= blep((t - pw) % 1.0, inc)
    return y


def partials(freqs, amps, t60s, n: int, phases=None, onset=None, floor_db: float = -80.0) -> np.ndarray:
    """Sum of exponentially decaying sinusoids (static frequencies).  Each partial is only
    computed until it falls below floor_db, which keeps long inharmonic sounds cheap."""
    out = np.zeros(n)
    freqs = np.atleast_1d(np.asarray(freqs, dtype=float))
    amps = np.atleast_1d(np.asarray(amps, dtype=float))
    t60s = np.broadcast_to(np.asarray(t60s, dtype=float), freqs.shape)
    peak = np.max(np.abs(amps)) + 1e-12
    for i in range(freqs.size):
        f, a, T = freqs[i], amps[i], max(float(t60s[i]), 1e-3)
        if a == 0 or f >= NYQ * 0.95 or f <= 0:
            continue
        lvl = 20 * math.log10(abs(a) / peak)
        life = T * (lvl - floor_db) / 60.0
        if life <= 0:
            continue
        m = min(n, ns(life) + 1)
        tt = tvec(m)
        ph0 = 0.0 if phases is None else phases[i]
        seg = a * np.exp(-6.907755 * tt / T) * np.sin(TAU * f * tt + ph0)
        if onset is not None:
            seg *= onset[:m] if onset.size >= m else np.pad(onset, (0, m - onset.size), constant_values=1.0)
        out[:m] += seg
    return out


# ----------------------------------------------------------------------------- STFT
def stft(x: np.ndarray, nfft: int = 2048, hop: int = 512, circular: bool = False) -> np.ndarray:
    win = np.hanning(nfft + 1)[:-1]
    n = x.size
    if circular:
        xp = np.concatenate([x[-nfft:], x, x[:nfft]])
        off = nfft
    else:
        xp = np.pad(x, (nfft, nfft))
        off = nfft
    starts = np.arange(off - nfft // 2, off + n - nfft // 2, hop)
    frames = np.lib.stride_tricks.sliding_window_view(xp, nfft)[starts]
    return np.fft.rfft(frames * win, axis=-1)


def istft(X: np.ndarray, n: int, nfft: int = 2048, hop: int = 512, circular: bool = False) -> np.ndarray:
    win = np.hanning(nfft + 1)[:-1]
    frames = np.fft.irfft(X, nfft, axis=-1) * win
    L = n + 2 * nfft
    out = np.zeros(L)
    wsum = np.zeros(L)
    off = nfft
    for i in range(frames.shape[0]):
        s = off - nfft // 2 + i * hop
        out[s:s + nfft] += frames[i]
        wsum[s:s + nfft] += win * win
    if circular:
        y = out[off:off + n].copy()
        w = wsum[off:off + n].copy()
        y[:nfft] += out[off + n:off + n + nfft]
        w[:nfft] += wsum[off + n:off + n + nfft]
        y[n - nfft:] += out[off - nfft:off]
        w[n - nfft:] += wsum[off - nfft:off]
        return y / np.maximum(w, 1e-3)
    return out[off:off + n] / np.maximum(wsum[off:off + n], 1e-3)


# ----------------------------------------------------------------------------- dynamics / misc
def moving_avg(x: np.ndarray, w: int, circular: bool = False) -> np.ndarray:
    """Centered moving average along the last axis (window w samples)."""
    w = max(1, int(w))
    n = x.shape[-1]
    h = w // 2
    if circular:
        if n <= w + 1:
            reps = (w // max(n, 1)) + 3
            xt = np.concatenate([x] * reps, axis=-1)
            res = moving_avg(xt, w, circular=False)
            mid = (reps // 2) * n
            return res[..., mid:mid + n]
        xp = np.concatenate([x[..., n - h - 1:], x, x[..., :w]], axis=-1)
        c = np.cumsum(xp, axis=-1)
        c = np.concatenate([np.zeros(x.shape[:-1] + (1,)), c], axis=-1)
        start = (h + 1) - h
        idx = np.arange(n) + start
        return (c[..., idx + w] - c[..., idx]) / w
    xp = np.concatenate([np.repeat(x[..., :1], h, axis=-1), x, np.repeat(x[..., -1:], w, axis=-1)], axis=-1)
    c = np.cumsum(xp, axis=-1)
    c = np.concatenate([np.zeros(x.shape[:-1] + (1,)), c], axis=-1)
    idx = np.arange(n)
    return (c[..., idx + w] - c[..., idx]) / w


def moving_min(x: np.ndarray, w: int, circular: bool = False) -> np.ndarray:
    """Centered running minimum (van Herk / Gil-Werman, vectorised).  1-D only."""
    w = max(1, int(w))
    n = x.size
    h = w // 2
    if circular:
        xp = np.concatenate([x[n - h:] if h > 0 else x[:0], x, x[:w]])
    else:
        xp = np.concatenate([np.full(h, x[0]), x, np.full(w, x[-1])])
    m = xp.size
    nb = -(-m // w)
    pad = nb * w - m
    xb = np.concatenate([xp, np.full(pad, np.inf)]).reshape(nb, w)
    pre = np.minimum.accumulate(xb, axis=1).ravel()
    suf = np.minimum.accumulate(xb[:, ::-1], axis=1)[:, ::-1].ravel()
    i = np.arange(n)
    # window [i, i+w-1] in xp coordinates
    return np.minimum(suf[i], pre[i + w - 1])


def softclip(x: np.ndarray, drive: float = 1.0) -> np.ndarray:
    if drive <= 0:
        return x
    return np.tanh(drive * x) / math.tanh(drive)


def saturate(x: np.ndarray, amount: float = 0.2, even: float = 0.1) -> np.ndarray:
    """Gentle tube-ish saturation (odd tanh + a little even harmonic), level-preserving
    for small signals."""
    y = (1 - amount) * x + amount * np.tanh(x * 1.5) / 1.5
    y = y + even * amount * (x * x - np.mean(x * x))
    return y


def resample_fft(x: np.ndarray, n_out: int) -> np.ndarray:
    n = x.shape[-1]
    X = np.fft.rfft(x, axis=-1)
    k = min(X.shape[-1], n_out // 2 + 1)
    Y = np.zeros(x.shape[:-1] + (n_out // 2 + 1,), dtype=complex)
    Y[..., :k] = X[..., :k]
    return np.fft.irfft(Y, n_out, axis=-1) * (n_out / n)


def stereo_width(x: np.ndarray, width: float) -> np.ndarray:
    m = 0.5 * (x[0] + x[1])
    s = 0.5 * (x[0] - x[1]) * width
    return np.vstack([m + s, m - s])


def haas_stereo(mono: np.ndarray, delay_ms: float = 12.0, amount: float = 0.5, pan: float = 0.0) -> np.ndarray:
    """Pseudo-stereo from mono: decorrelated by a short delay on the side signal."""
    d = ns(delay_ms / 1000.0)
    dl = np.concatenate([np.zeros(d), mono[:-d]]) if d > 0 else mono
    side = (mono - dl) * 0.5 * amount
    gl, gr = pan_gains(pan)
    return np.vstack([(mono + side) * gl * 1.4142, (mono - side) * gr * 1.4142])


def wander(n: int, rate: float, r: np.random.Generator, hop: int = 64) -> np.ndarray:
    """Cheap smooth random modulation (unit-ish std): three detuned sinusoids evaluated at
    control rate and linearly interpolated.  Not periodic; for per-note variation."""
    m = n // hop + 2
    tc = np.arange(m) * (hop / SR)
    y = np.zeros(m)
    for k in range(3):
        f = rate * r.uniform(0.45, 1.6)
        y += np.sin(TAU * f * tc + r.uniform(0, TAU))
    y *= 0.8165
    return np.interp(np.arange(n), np.arange(m) * hop, y)
