"""Ambience loops (30-60 s, seamless).

Each loop is built circularly: noise beds are generated as exactly-periodic FFT noise, slow
modulations are periodic, discrete events (drops, gulls, typewriters...) are written into an
extended buffer and folded back over the loop point, and reverb is applied as a circular
convolution.  The wrap is therefore just another sample step."""
from __future__ import annotations

import math

import numpy as np

from synth import (SR, TAU, ns, tvec, rng, filt, colored, lfo_noise, fold_loop, pan_gains, mix_at, undb,
                   convolve, rms, partials)
from reverb import make_ir
from mixing import limit
import foley as F
from foley import burst, impact, modal, bubble, stick_slip


class Loop:
    def __init__(self, name: str, seconds: int, buses=('dry',)):
        self.name = name
        self.sec = float(seconds)
        self.L = ns(seconds)
        self.r = rng('amb', name)
        self.tail = ns(10.0)
        self.bus = {b: np.zeros((2, self.L + self.tail)) for b in buses}
        self.cfg = {}

    def reverb_bus(self, name: str, ir: str, wet_db: float = 0.0, dry: bool = False, **over):
        self.bus[name] = np.zeros((2, self.L + self.tail))
        self.cfg[name] = (ir, wet_db, dry, over)

    def add(self, sig, t: float, pan: float = 0.0, gain: float = 1.0, bus: str = 'dry'):
        sig = np.asarray(sig, float)
        if sig.ndim == 2:
            st = sig * gain
        else:
            gl, gr = pan_gains(pan)
            st = np.vstack([sig * gl, sig * gr]) * 1.414 * gain
        start = ns(t % self.sec)
        b = self.bus[bus]
        if start + st.shape[1] > b.shape[1]:
            # very long event: fold it ourselves
            st = fold_loop(st, self.L, 0)
            mix_at(b, np.roll(st, start, axis=1), 0)
        else:
            mix_at(b, st, start)

    def bed(self, st, bus: str = 'dry', gain: float = 1.0):
        st = np.asarray(st, float)
        if st.ndim == 1:
            st = np.vstack([st, st])
        self.bus[bus][:, :self.L] += st[:, :self.L] * gain

    def noise(self, slope: float = -3.0, spec=None, width: float = 0.35):
        """Exactly periodic stereo noise bed (unit-ish RMS), mid-heavy by default."""
        r = self.r
        m = colored(self.L, r, slope, periodic=True)
        s = colored(self.L, r, slope, periodic=True)
        if spec:
            m = filt(m, spec, circular=True, tail=0.3)
            s = filt(s, spec, circular=True, tail=0.3)
        st = np.vstack([m + width * s, m - width * s])
        return st / (rms(st) + 1e-12)

    def lfo(self, rate: float, depth_db: float = 2.0):
        return undb(depth_db * lfo_noise(self.L, rate, self.r, periodic=True))

    def poisson(self, rate: float, t0: float = 0.0, t1: float | None = None):
        t1 = self.sec if t1 is None else t1
        t = t0
        out = []
        while True:
            t += self.r.exponential(1.0 / rate)
            if t >= t1:
                return out
            out.append(t)

    def finish(self, target_rms_db: float = -22.0, eq=None, width: float = 0.7) -> np.ndarray:
        out = np.zeros((2, self.L))
        for name, b in self.bus.items():
            y = fold_loop(b, self.L, 0)
            if name in self.cfg:
                ir, wet_db, keep_dry, over = self.cfg[name]
                w = convolve(y, make_ir(ir, **over), circular=True)
                out += w * float(undb(wet_db))
                if keep_dry:
                    out += y
            else:
                out += y
        out = filt(out, [('bhp', 30, 2), ('blp', 14500, 2)] + (eq or []), circular=True, tail=0.5)
        m = 0.5 * (out[0] + out[1])
        sd = 0.5 * (out[0] - out[1]) * width
        out = np.vstack([m + sd, m - sd])
        out *= undb(target_rms_db) / (rms(out) + 1e-12)
        out = limit(out, -1.5, circular=True)
        return rotate_to_quiet(out)


def rotate_to_quiet(y: np.ndarray) -> np.ndarray:
    """Start the (periodic) loop at its calmest moment: lowest high-passed energy in a 20 ms
    window.  The content is unchanged; only the wrap point moves away from transients."""
    hp = filt(y.mean(axis=0), [('bhp', 2000, 2)], circular=True, tail=0.05)
    w = ns(0.02)
    e = np.convolve(hp * hp, np.ones(w) / w, mode='same')
    e[:w] = e[-w:] = np.inf
    k = int(np.argmin(e))
    return np.roll(y, -k, axis=1)


def impulse_bank(A: Loop, rate: float, bands, q: float = 6.0, amp_sigma: float = 0.8, pan_spread: float = 0.6,
                 decay=None, mod=None):
    """Dense droplet/crackle texture: Poisson impulses split over resonant bands (periodic)."""
    r = A.r
    out = np.zeros((2, A.L))
    for f in bands:
        times = A.poisson(rate / len(bands))
        imp = np.zeros((2, A.L))
        for t in times:
            k = ns(t) % A.L
            a = math.exp(r.normal(0, amp_sigma))
            p = r.uniform(-pan_spread, pan_spread)
            gl, gr = pan_gains(p)
            imp[0, k] += a * gl
            imp[1, k] += a * gr
        spec = [('bp', f, q)] if decay is None else decay(f)
        out += filt(imp, spec, circular=True, tail=0.1)
    if mod is not None:
        out *= mod
    return out / (rms(out) + 1e-12)


def loopify(y: np.ndarray, L: int, xfade: int) -> np.ndarray:
    """Make a continuous (non-periodic) render of length >= L + xfade loop seamlessly."""
    out = y[..., :L].copy()
    w = 0.5 - 0.5 * np.cos(np.pi * np.arange(xfade) / xfade)
    out[..., :xfade] = y[..., :xfade] * w + y[..., L:L + xfade] * (1 - w)
    return out


# ============================================================================ rain
def rain_window():
    A = Loop('rain_window', 40)
    r = A.r
    A.reverb_bus('room', 'room', -8.0)
    bed = A.noise(-2.0, [('bhp', 250, 2), ('blp', 4500, 2), ('pk', 1100, 0.8, 2)], 0.3) * A.lfo(0.05, 1.5)
    A.bed(bed, gain=0.55)
    drops = impulse_bank(A, 110, [2300, 2900, 3500, 4200, 5000, 6100, 3100, 3900], q=9, amp_sigma=0.9)
    A.bed(drops, gain=0.35)
    # rivulets: little bubbly trickles down the glass
    for t0 in (5.0, 17.5, 31.0):
        n_b = int(r.integers(14, 24))
        for k in range(n_b):
            t = t0 + k * r.uniform(0.04, 0.11)
            A.add(bubble(r, r.uniform(1300, 2600) * (1 + 0.15 * k / n_b), r.uniform(0.015, 0.03), 0.35),
                  t, pan=r.uniform(-0.3, 0.3), gain=0.18 * r.uniform(0.5, 1.0))
    # heavy drips from the window frame
    t = 0.7
    while t < 40:
        A.add(F.drip(r, r.uniform(700, 1100)), t, pan=0.45, gain=0.35 * r.uniform(0.7, 1.0), bus='room')
        t += r.uniform(1.4, 2.2)
    # distant thunder (very low)
    n = ns(6.0)
    th = filt(r.standard_normal(n), [('blp', 140, 1), ('bhp', 25, 1)], tail=0.2)
    tt = tvec(n)
    th *= np.clip(tt / 0.8, 0, 1) * np.exp(-tt / 2.0) * (1 + 0.5 * np.sin(TAU * 1.3 * tt))
    A.add(th / (np.std(th) + 1e-9), 23.0, 0.0, 0.25, 'room')
    return A.finish(-23.0, eq=[('hs', 7000, 0.7, -3)])


def rain_street():
    A = Loop('rain_street', 40)
    r = A.r
    A.reverb_bus('out', 'outdoor', -6.0)
    hiss = A.noise(-1.0, [('bhp', 400, 2), ('blp', 9000, 2), ('pk', 3000, 0.7, 2)], 0.5) * A.lfo(0.07, 1.2)
    body = A.noise(-3.0, [('bp', 600, 0.8)], 0.5)
    A.bed(hiss, gain=0.6)
    A.bed(body, gain=0.3)
    splash = impulse_bank(A, 420, [1800, 2400, 3100, 3900, 4800, 5900, 7200], q=3, amp_sigma=0.7, pan_spread=0.9)
    A.bed(splash, gain=0.35)
    for t in A.poisson(11.0):
        A.add(bubble(r, r.uniform(800, 2600), r.uniform(0.02, 0.05), 0.5), t, pan=r.uniform(-0.8, 0.8),
              gain=0.12 * math.exp(r.normal(0, 0.5)))
    # gutter / downspout on the left
    for t in A.poisson(38.0):
        A.add(bubble(r, r.uniform(280, 900), r.uniform(0.03, 0.07), 0.3), t, pan=-0.65, gain=0.12 * r.uniform(0.4, 1))
    # two cars on the wet street
    for (t0, direction) in ((7.0, 1), (26.0, -1)):
        y, pan, _ = F.car_pass(r, 6.0, wet=True)
        st = np.zeros((2, y.size))
        p = pan * direction
        st[0] = y * np.cos((p + 1) * np.pi / 4) * 1.41
        st[1] = y * np.sin((p + 1) * np.pi / 4) * 1.41
        A.add(st, t0, gain=0.35, bus='out')
    return A.finish(-22.0)


# ============================================================================ harbor
def harbor():
    A = Loop('harbor', 60)
    r = A.r
    A.reverb_bus('fog', 'harbor', 0.0)
    A.reverb_bus('near', 'outdoor', -8.0, dry=False)
    t = tvec(A.L)
    # waves: periodic swells (integer cycles per loop) drive a low water noise
    sw = (0.5 + 0.5 * np.sin(TAU * 19 / 60 * t)) ** 2 * 0.6 + (0.5 + 0.5 * np.sin(TAU * 13 / 60 * t + 1.3)) ** 3 * 0.4
    water = A.noise(-3.0, [('bhp', 110, 2), ('blp', 900, 2)], 0.4)
    A.bed(water * (0.35 + 0.65 * sw), gain=0.6)
    hi = A.noise(-2.0, [('bp', 2200, 0.7)], 0.5)
    A.bed(hi * sw ** 2, gain=0.12)
    # slaps against the pilings near the swell peaks
    for k in range(19):
        tp = (k + 0.25) * 60 / 19 + r.uniform(-0.15, 0.15)
        A.add(burst(r, 0.4, [('blp', 1600, 0.7), ('bhp', 90, 0.7)], 0.006, 0.07), tp, pan=r.uniform(-0.5, 0.2),
              gain=0.35 * r.uniform(0.6, 1.0), bus='near')
    wind = F.wind(r, 60, 120, 900, 0.08, periodic=True)
    A.bed(np.vstack([wind, np.roll(wind, ns(0.013))]), gain=0.12)
    for t0, pan in ((6.0, 0.6), (29.5, -0.5), (47.0, 0.3)):
        A.add(F.gull_call(r, int(r.integers(3, 6))), t0, pan, 0.22, 'fog')
    for t0 in (2.0, 22.0, 42.0):
        A.add(F.foghorn(r, 3.0, 148.0), t0, -0.15, 0.5, 'fog')
    for t0 in (11.0, 18.5, 35.0, 44.5, 53.0):
        d = r.uniform(0.6, 1.2)
        f0 = r.uniform(0.8, 1.3)
        cr = stick_slip(r, d, [(0, 25 * f0), (d * 0.6, 45 * f0), (d, 30 * f0)],
                        [(350 * f0, 1.0), (800 * f0, 0.6), (1500 * f0, 0.3)], q=11,
                        amp_pts=[(0, 0), (0.1, 1), (d * 0.8, 0.7), (d, 0)])
        A.add(cr, t0, r.uniform(-0.6, 0.6), 0.25, 'near')
    for t0 in (15.0, 40.0):
        A.add(F.bell_strike(880, 'buoy', 0.5, seed=int(t0)), t0, 0.7, 0.05, 'fog')
    return A.finish(-23.0)


# ============================================================================ interiors with people
def club_chatter():
    A = Loop('club_chatter', 45)
    r = A.r
    A.reverb_bus('club', 'club', -2.0, dry=True)
    mur = F.murmur(r, 45, voices=18, female_frac=0.4)
    A.bed(filt(mur, [('blp', 4500, 1)], circular=True), 'club', 0.5)
    A.bed(A.noise(-4.0, [('bp', 300, 0.6)], 0.4), gain=0.05)
    for t0 in A.poisson(0.22):
        g1 = modal(r, np.array([2310, 4120, 6020]) * r.uniform(0.85, 1.2), [1, .5, .3], [.5, .3, .2], 0.8)
        A.add(g1 / (np.abs(g1).max() + 1e-9), t0, r.uniform(-0.7, 0.7), 0.12, 'club')
    for t0 in (9.0, 24.0, 38.0):
        fem = r.random() < 0.5
        A.add(F.laugh(r, r.uniform(190, 240) if fem else r.uniform(110, 150), fem), t0, r.uniform(-0.6, 0.6),
              0.18, 'club')
    for t0 in (15.0, 33.0):
        A.add(impact(r, [180, 420, 1100], [1, .6, .3], [.1, .07, .04], [('blp', 1500, .7)], dur=0.3, noise_gain=0.4),
              t0, 0.4, 0.15, 'club')
    return A.finish(-24.0)


def crowd_gala():
    A = Loop('crowd_gala', 40)
    r = A.r
    A.reverb_bus('hall', 'hall', -1.0, dry=True)
    mur = F.murmur(r, 40, voices=28, female_frac=0.5, rate=4.8)
    A.bed(filt(mur, [('blp', 5500, 1)], circular=True), 'hall', 0.5)
    for t0 in A.poisson(0.45):
        g1 = modal(r, np.array([2580, 4490, 6430]) * r.uniform(0.9, 1.15), [1, .5, .3], [.7, .4, .25], 1.0)
        A.add(g1 / (np.abs(g1).max() + 1e-9), t0, r.uniform(-0.8, 0.8), 0.1, 'hall')
    for t0 in (6.0, 17.0, 27.0, 35.0):
        fem = r.random() < 0.6
        A.add(F.laugh(r, r.uniform(190, 250) if fem else r.uniform(110, 150), fem), t0, r.uniform(-0.7, 0.7),
              0.13, 'hall')
    # a little polite applause
    for k in range(9):
        t0 = 30.0 + r.uniform(0, 0.8)
        rate = r.uniform(4.5, 6.0)
        for j in range(int(r.integers(4, 9))):
            clap = burst(r, 0.05, [('bp', r.uniform(1200, 2500), 0.9)], 0.0005, 0.008)
            A.add(clap, t0 + j / rate, r.uniform(-0.8, 0.8), 0.08 * (1 - j / 10), 'hall')
    return A.finish(-24.0)


def typing_pool():
    A = Loop('typing_pool', 40)
    r = A.r
    A.reverb_bus('room', 'studio', -3.0, dry=True)
    for ty in range(5):
        dist = 0.25 + 0.7 * ty / 4
        pan = r.uniform(-0.8, 0.8)
        t = r.uniform(0, 3)
        keys = 0
        line = int(r.integers(35, 60))
        while t < 40:
            for _ in range(int(r.integers(3, 9))):
                y = F.keystroke(r, typist=ty, v=r.uniform(0.6, 1.0))
                y = filt(y, [('blp', 8000 - 4000 * dist, 0.7)], tail=0.01)
                A.add(y, t, pan, 0.4 * (1 - 0.6 * dist), 'room')
                t += r.uniform(0.09, 0.15)
                keys += 1
            t += r.uniform(0.12, 0.45)
            if keys > line:
                A.add(F.carriage_return(r), t, pan, 0.35 * (1 - 0.6 * dist), 'room')
                t += 1.4 + r.uniform(0.2, 1.0)
                keys = 0
                line = int(r.integers(35, 60))
            if r.random() < 0.05:
                t += r.uniform(1.0, 3.0)
    mur = F.murmur(r, 40, voices=3, female_frac=0.7)
    A.bed(filt(mur, [('blp', 3000, 1)], circular=True), 'room', 0.08)
    A.bed(A.noise(-4.0, [('bp', 250, 0.6)], 0.3), gain=0.04)
    return A.finish(-24.0)


def newsroom():
    A = Loop('newsroom', 45)
    r = A.r
    A.reverb_bus('room', 'studio', -3.0, dry=True)
    for ty in range(3):
        pan = (-0.5, 0.2, 0.7)[ty]
        t = r.uniform(0, 2)
        keys = 0
        while t < 45:
            for _ in range(int(r.integers(3, 8))):
                A.add(F.keystroke(r, typist=10 + ty, v=r.uniform(0.6, 1.0)), t, pan, 0.45, 'room')
                t += r.uniform(0.08, 0.14)
                keys += 1
            t += r.uniform(0.1, 0.4)
            if keys > 45:
                A.add(F.carriage_return(r), t, pan, 0.4, 'room')
                t += 1.6
                keys = 0
    for t0, pan in ((9.0, 0.6), (31.0, -0.7)):
        for k in range(2):
            A.add(F.ringer(r, 1.4, 1180, 1520, 20.0), t0 + 3.0 * k, pan, 0.18, 'room')
    for t0 in (17.0, 38.5):
        A.add(F.pneumatic(r), t0, -0.3, 0.35, 'room')
    for t0, d in ((3.5, 3.5), (24.0, 4.5)):
        A.add(F.teletype(r, d), t0, 0.5, 0.3, 'room')
    mur = F.murmur(r, 45, voices=8, female_frac=0.3, rate=5.0)
    A.bed(filt(mur, [('blp', 4000, 1)], circular=True), 'room', 0.25)
    return A.finish(-23.0)


def precinct():
    A = Loop('precinct', 40)
    r = A.r
    A.reverb_bus('tile', 'tile', -3.0, dry=True)
    mur = F.murmur(r, 40, voices=6, female_frac=0.1, rate=4.2)
    A.bed(filt(mur, [('blp', 3500, 1)], circular=True), 'tile', 0.25)
    A.add(F.teletype(r, 5.0), 12.0, 0.6, 0.28, 'tile')
    for k in range(2):
        A.add(F.ringer(r, 1.4, 1100, 1450, 20.0), 26.0 + 3.0 * k, -0.6, 0.15, 'tile')
    t = 2.0
    while t < 40:
        A.add(F.keystroke(r, typist=21, v=r.uniform(0.5, 0.9)), t, -0.3, 0.22, 'tile')
        t += r.uniform(0.1, 0.18) if r.random() > 0.15 else r.uniform(0.6, 2.5)
    for t0, n_st in ((4.0, 6), (33.0, 5)):
        for k in range(n_st):
            A.add(F.footstep(r, 'stone', 0.8), t0 + k * 0.56, -0.7 + 1.4 * k / n_st, 0.25, 'tile')
    A.add(impact(r, [72, 140, 260, 520], [1, .8, .6, .3], [.25, .18, .12, .08], [('blp', 1800, .7)], dur=0.6),
          19.0, 0.8, 0.25, 'tile')
    A.add(stick_slip(r, 0.6, [(0, 30), (0.6, 50)], [(500, 1), (1100, 0.5)], q=9, amp_pts=[(0, 0), (0.1, 1), (0.6, 0)]),
          35.5, -0.2, 0.12, 'tile')
    return A.finish(-24.0)


# ============================================================================ institutions & spaces
def sanatorium():
    A = Loop('sanatorium', 45)
    r = A.r
    A.reverb_bus('hall', 'corridor', 0.0)
    vent = A.noise(-4.0, [('bhp', 40, 2), ('blp', 600, 2)], 0.3) * A.lfo(0.04, 1.0)
    A.bed(vent, gain=0.3)
    t = tvec(A.L)
    hum = 0.03 * np.sin(TAU * 120 * t) + 0.012 * np.sin(TAU * 240 * t + 1)
    A.bed(np.vstack([hum, hum]))
    for t0, n_st, g, d in ((8.0, 10, 0.3, 1), (29.0, 8, 0.18, -1)):
        for k in range(n_st):
            u = k / (n_st - 1)
            A.add(F.footstep(r, 'tile', 0.9), t0 + k * 0.58, d * (-0.7 + 1.4 * u), g * (0.5 + 0.5 * math.sin(math.pi * u)), 'hall')
    A.add(impact(r, [72, 140, 260, 520], [1, .8, .6, .3], [.25, .18, .12, .08], [('blp', 1500, .7)], dur=0.6),
          22.5, -0.6, 0.18, 'hall')
    cough = F.gasp_voice(r, 120) * 0.8
    A.add(cough, 37.0, 0.7, 0.06, 'hall')
    A.add(cough, 37.35, 0.7, 0.05, 'hall')
    A.add(stick_slip(r, 0.8, [(0, 60), (0.8, 90)], [(2200, 1), (3400, 0.5)], q=20, amp_pts=[(0, 0), (0.2, 1), (0.8, 0)]),
          15.0, 0.5, 0.03, 'hall')
    return A.finish(-26.0, eq=[('hs', 6000, 0.7, -3)])


def ship_hold():
    A = Loop('ship_hold', 45)
    r = A.r
    A.reverb_bus('hold', 'hold', -2.0, dry=True)
    t = tvec(A.L)
    # engine throb: 47 Hz drone pulsed at 1.8 Hz (81 pulses per loop -> periodic)
    pulse = (0.5 + 0.5 * np.cos(TAU * 81 / 45 * t)) ** 2.5
    tone = np.sin(TAU * 47 * t) + 0.5 * np.sin(TAU * 94 * t + 1) + 0.25 * np.sin(TAU * 141 * t + 2)
    rumble = A.noise(-6.0, [('blp', 180, 2), ('bhp', 25, 2)], 0.2)
    eng = (tone * 0.12 * (0.4 + 0.6 * pulse))
    A.bed(np.vstack([eng, eng]) + rumble * 0.25 * (0.5 + 0.5 * pulse), gain=0.8)
    sw = (0.5 + 0.5 * np.sin(TAU * 7 / 45 * t)) ** 2
    slosh = A.noise(-3.0, [('bhp', 60, 2), ('blp', 500, 2)], 0.4)
    A.bed(slosh * (0.3 + 0.7 * sw), gain=0.35)
    for t0 in (3.0, 9.5, 17.0, 24.0, 31.5, 39.0):
        d = r.uniform(0.8, 1.6)
        f0 = r.uniform(0.6, 1.0)
        cr = stick_slip(r, d, [(0, 12 * f0), (d * 0.6, 24 * f0), (d, 14 * f0)],
                        [(110 * f0, 1.0), (260 * f0, 0.7), (560 * f0, 0.35)], q=10,
                        amp_pts=[(0, 0), (0.2, 1), (d * 0.8, 0.8), (d, 0)])
        A.add(cr, t0, r.uniform(-0.8, 0.8), 0.4, 'hold')
    for t0 in (13.0, 34.0):
        n = ns(2.5)
        tt = tvec(n)
        f = 95 * (1 + 0.25 * np.sin(np.pi * tt / 2.5))
        g = np.sin(TAU * np.cumsum(f) / SR) * np.sin(np.pi * tt / 2.5) ** 2
        g += 0.4 * np.sin(TAU * np.cumsum(f * 2.7) / SR) * np.sin(np.pi * tt / 2.5) ** 3
        A.add(g, t0, r.uniform(-0.5, 0.5), 0.12, 'hold')
    for t0 in (20.0, 41.0):
        for k in range(int(r.integers(4, 9))):
            f = r.uniform(2500, 4000)
            A.add(impact(r, [f, f * 1.5], [1, .5], [.06, .04], [('bp', f, 1.5)], dur=0.08, noise_gain=0.4),
                  t0 + k * r.uniform(0.06, 0.14), 0.6, 0.06, 'hold')
    return A.finish(-23.0)


def freezer_hum():
    A = Loop('freezer_hum', 30)
    r = A.r
    A.reverb_bus('metal', 'metal', -6.0, dry=True)
    t = tvec(A.L)
    mod = 1 + 0.05 * lfo_noise(A.L, 0.3, r, periodic=True)
    hum = (0.3 * np.sin(TAU * 60 * t) + 1.0 * np.sin(TAU * 120 * t + 0.3) + 0.4 * np.sin(TAU * 180 * t + 1)
           + 0.25 * np.sin(TAU * 240 * t + 2) + 0.12 * np.sin(TAU * 300 * t) + 0.08 * np.sin(TAU * 360 * t + 1.5))
    motor = 0.35 * np.sin(TAU * 58.7 * t) + 0.15 * np.sin(TAU * 117.4 * t + 0.7)
    A.bed(np.vstack([hum, hum]) * mod * 0.05 + np.vstack([motor, motor]) * 0.04)
    fan = A.noise(-3.0, [('bhp', 60, 2), ('blp', 1800, 2)], 0.3) * (1 + 0.25 * np.sin(TAU * 47 * t))
    A.bed(fan, gain=0.12)
    hiss = A.noise(0.0, [('bhp', 3500, 2), ('blp', 9000, 2)], 0.4) * A.lfo(0.15, 3.0)
    A.bed(hiss, gain=0.02)
    for t0 in A.poisson(0.3):
        f = r.uniform(1800, 4200)
        A.add(impact(r, [f, f * 1.38, f * 2.1], [1, .5, .3], [.25, .15, .1], [('bp', f, 2)], dur=0.35, noise_gain=0.3),
              t0, r.uniform(-0.8, 0.8), 0.05, 'metal')
    return A.finish(-24.0)


def tunnel():
    A = Loop('tunnel', 40)
    r = A.r
    A.reverb_bus('tun', 'tunnel', 0.0, dry=True)
    w = F.wind(r, 40, 60, 450, 0.06, periodic=True)
    moan = filt(w, [('bp', 140, 4)], circular=True, tail=0.3)
    A.bed(np.vstack([w, np.roll(w, ns(0.02))]) * 0.08 + np.vstack([moan, moan]) * 0.06)
    for period, f, pan, g in ((2.3, 1250, -0.4, 0.5), (3.7, 1700, 0.5, 0.35), (5.3, 950, 0.1, 0.4)):
        t = r.uniform(0, period)
        while t < 40:
            A.add(F.drip(r, f), t, pan, g * r.uniform(0.7, 1.0), 'tun')
            t += period * r.uniform(0.92, 1.08)
    for tt in A.poisson(22.0):
        A.add(bubble(r, r.uniform(450, 1300), r.uniform(0.02, 0.05), 0.35), tt, -0.7, 0.04, 'tun')
    for k in range(6):
        A.add(impact(r, [r.uniform(900, 2200)], [1], [0.06], [('bp', 2500, 1)], dur=0.08, noise_gain=0.6),
              27.0 + 0.09 * k + r.uniform(0, 0.05), 0.6, 0.12 * (1 - k / 7), 'tun')
    return A.finish(-25.0)


def cemetery_wind():
    A = Loop('cemetery_wind', 45)
    r = A.r
    A.reverb_bus('out', 'outdoor', -3.0, dry=True)
    g = lfo_noise(A.L, 0.09, r, periodic=True)
    w = F.wind(r, 45, 180, 1400, 0.09, periodic=True, whistle=0.25)
    w2 = F.wind(r, 45, 180, 1400, 0.09, periodic=True)
    A.bed(np.vstack([w + 0.3 * w2, w - 0.3 * w2]), gain=0.3)
    leaves = impulse_bank(A, 160, [2500, 3300, 4400, 5600, 7000], q=2.0, amp_sigma=0.9, pan_spread=0.9,
                          mod=np.clip(0.2 + 0.8 * g, 0, None) ** 2)
    A.bed(leaves, gain=0.12)
    for t0, pan in ((7.0, -0.6), (21.0, 0.5), (36.0, -0.2)):
        A.add(F.crow_caw(r, int(r.integers(2, 4))), t0, pan, 0.16, 'out')
    return A.finish(-24.0)


def clock_ticks():
    A = Loop('clock_ticks', 30)
    r = A.r
    A.reverb_bus('room', 'room', -6.0, dry=True)
    clocks = [(1.0, -0.6, 0.5), (0.5, 0.4, 0.3), (0.75, -0.2, 0.35), (1.2, 0.7, 0.4), (0.6, -0.8, 0.25),
              (30 / 36, 0.15, 0.32), (1.5, 0.55, 0.45), (0.4, -0.4, 0.2)]
    for k, (per, pan, g) in enumerate(clocks):
        n_t = int(round(30 / per))
        off = r.uniform(0, per)
        for j in range(n_t):
            A.add(F.clock_tick(r, kind=k, tock=(j % 2 == 1)), off + j * per + r.normal(0, 0.002), pan,
                  g * (1.0 if j % 2 == 0 else 0.85), 'room')
    A.bed(A.noise(-4.0, [('bp', 300, 0.6)], 0.3), gain=0.01)
    return A.finish(-25.0)


def night_city():
    A = Loop('night_city', 50)
    r = A.r
    A.reverb_bus('far', 'outdoor', 0.0, dry=False)
    rumble = A.noise(-5.0, [('blp', 350, 2), ('bhp', 30, 2)], 0.5) * A.lfo(0.03, 3.0)
    A.bed(rumble, gain=0.35)
    w = F.wind(r, 50, 200, 1500, 0.06, periodic=True)
    A.bed(np.vstack([w, np.roll(w, ns(0.017))]), gain=0.05)
    for t0, d in ((4.0, 1), (21.0, -1), (39.0, 1)):
        y, pan, _ = F.car_pass(r, 7.0, wet=True, speed=0.6)
        y = filt(y, [('blp', 1800, 0.7)], tail=0.05)
        st = np.vstack([y * np.cos((pan * d + 1) * np.pi / 4), y * np.sin((pan * d + 1) * np.pi / 4)]) * 1.41
        A.add(st, t0, gain=0.25, bus='far')
    for t0, nb in ((14.0, 3), (38.0, 2)):
        A.add(filt(F.dog_bark(r, nb), [('blp', 2500, 0.7)], tail=0.02), t0, 0.6 if t0 < 20 else -0.5, 0.12, 'far')
    A.add(filt(F.foghorn(r, 3.0, 140.0), [('blp', 600, 0.7)], tail=0.05), 29.0, -0.3, 0.12, 'far')
    return A.finish(-27.0)


AMB = {
    'rain_window': rain_window, 'rain_street': rain_street, 'harbor': harbor, 'club_chatter': club_chatter,
    'freezer_hum': freezer_hum, 'typing_pool': typing_pool, 'newsroom': newsroom, 'sanatorium': sanatorium,
    'ship_hold': ship_hold, 'crowd_gala': crowd_gala, 'tunnel': tunnel, 'cemetery_wind': cemetery_wind,
    'clock_ticks': clock_ticks, 'precinct': precinct, 'night_city': night_city,
}
