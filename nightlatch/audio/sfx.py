"""Sound effects for NIGHT LATCH (mono, short, natural).  Each generator returns a mono float
array; build_audio normalises, checks and encodes them.  ROLE sets the loudness class used
for the manifest volume."""
from __future__ import annotations

import math

import numpy as np

from synth import SR, TAU, ns, tvec, rng, filt, partials, undb, mix_at, wander, colored, blep_saw, phase_cycles
from reverb import reverb
import foley as F
from foley import burst, impact, modal, grains, stick_slip, bubble, safe, env_ad
from instruments import Mallet, Note, bell


def _rv(y, room='room', wet=0.25, **over):
    """Add a touch of room to a mono effect (returns mono)."""
    w = reverb(y, room, circular=False, keep_tail=True, **over)
    w = 0.5 * (w[0] + w[1])
    out = np.zeros(w.size)
    out[:y.size] += y
    out += wet * w
    return out


def _cat(*parts):
    """parts: (t, signal, gain) — sum into one buffer."""
    end = max(ns(t) + s.size for t, s, g in parts)
    out = np.zeros(end)
    for t, s, g in parts:
        mix_at(out, s, ns(t), g)
    return out


def _clickm(r, f=3500, tau=0.0015, dur=0.03, q=1.0):
    return burst(r, dur, [('bp', f, q)], 0.0004, tau)


# ============================================================================ footsteps
def footstep(surface, var):
    def fn():
        r = rng('step', surface, var)
        y = F.footstep(r, surface, 1.0)
        if surface in ('tile', 'stone', 'metal'):
            y = _rv(y, 'tile' if surface != 'metal' else 'metal', 0.12)
        return y
    return fn


# ============================================================================ doors & locks
def door_open():
    r = rng('door_open')
    latch = impact(r, [1300, 2900, 4700], [1, .6, .4], [.05, .03, .02], [('bp', 3500, 1)], dur=0.12, noise_gain=0.6)
    creak = stick_slip(r, 0.9, [(0, 35), (0.3, 55), (0.9, 42)], [(420, 1.0), (980, 0.6), (1700, 0.3)], q=10,
                       amp_pts=[(0, 0), (0.1, 1), (0.7, 0.8), (0.9, 0)])
    air = burst(r, 0.8, [('bp', 400, 0.6)], 0.2, 0.3)
    return _rv(_cat((0, latch, 0.5), (0.12, creak, 0.9), (0.15, air, 0.35)), 'room', 0.2)


def door_close():
    r = rng('door_close')
    slam = impact(r, [72, 140, 260, 520, 1100], [1, .8, .6, .35, .2], [.25, .18, .12, .08, .05], [('blp', 1800, .7)],
                  noise_tau=0.01, noise_gain=0.8, dur=0.7)
    latch = impact(r, [1500, 3100, 5200], [1, .6, .3], [.04, .03, .02], [('bp', 4000, 1)], dur=0.1, noise_gain=0.6)
    rattle = grains(r, 0.25, lambda t: 60 * math.exp(-t / 0.08),
                    lambda rr, a: impact(rr, [2100, 3600], [1, .5], [.02, .015], [('bp', 3000, 1)], dur=0.04) * a * 0.2)
    return _rv(_cat((0, slam, 1.0), (0.012, latch, 0.5), (0.03, rattle, 0.5)), 'room', 0.25)


def door_locked():
    r = rng('door_locked')
    parts = []
    t = 0.0
    for k in range(4):
        h = impact(r, [1100, 2400, 3900], [1, .7, .4], [.05, .03, .02], [('bp', 3000, 1)], dur=0.1, noise_gain=0.5)
        th = impact(r, [90, 190, 380], [1, .6, .3], [.1, .07, .05], [('blp', 900, .7)], dur=0.25, noise_gain=0.4)
        parts += [(t, h, 0.7), (t + 0.01, th, 0.9)]
        t += r.uniform(0.13, 0.19)
    return _rv(_cat(*parts), 'room', 0.2)


def unlock():
    r = rng('unlock')
    insert = burst(r, 0.18, [('bp', 4500, 1.2)], 0.02, 0.06)
    clicks = [(0.25 + 0.07 * k, impact(r, [2200, 3800, 6000], [1, .6, .3], [.03, .02, .012], [('bp', 4500, 1)], dur=0.06,
                                         noise_gain=0.5), 0.35) for k in range(3)]
    bolt = impact(r, [180, 520, 1400, 2900], [1, .8, .5, .3], [.12, .08, .05, .03], [('bp', 1800, 0.8)], dur=0.35,
                  noise_gain=0.6)
    return _rv(_cat((0, insert, 0.4), *clicks, (0.5, bolt, 1.0)), 'room', 0.15)


def lock_click():
    r = rng('lock_click')
    a = impact(r, [1700, 3300, 5100], [1, .6, .35], [.04, .025, .015], [('bp', 4200, 1)], dur=0.1, noise_gain=0.7)
    b = impact(r, [240, 700, 1500], [1, .6, .3], [.06, .04, .03], [('bp', 1200, .8)], dur=0.15, noise_gain=0.3)
    return _rv(_cat((0, a, 1.0), (0.008, b, 0.6)), 'room', 0.1)


def padlock_open():
    r = rng('padlock')
    click = impact(r, [1900, 3600, 5800], [1, .6, .3], [.05, .03, .02], [('bp', 4500, 1)], dur=0.1, noise_gain=0.6)
    spring = modal(r, [2300, 3450, 5600], [1, .5, .3], [.25, .18, .1], 0.4)
    shackle = impact(r, [800, 1650, 2700], [1, .6, .4], [.08, .05, .03], [('bp', 2000, 1)], dur=0.2, noise_gain=0.4)
    return _rv(_cat((0, click, 0.8), (0.05, spring / (np.abs(spring).max() + 1e-9), 0.35), (0.07, shackle, 0.7)), 'room', 0.12)


def creak():
    r = rng('creak')
    y = stick_slip(r, 1.4, [(0, 28), (0.5, 48), (1.0, 62), (1.4, 40)], [(380, 1.0), (850, 0.7), (1600, 0.35)], q=12,
                   amp_pts=[(0, 0), (0.15, 1), (1.1, 0.9), (1.4, 0)])
    return _rv(y, 'room', 0.2)


def drawer_open():
    r = rng('drawer_open')
    slide = stick_slip(r, 0.45, [(0, 120), (0.45, 180)], [(600, 0.6), (1400, 0.5), (2800, 0.3)], q=4, jitter=0.4,
                       amp_pts=[(0, 0), (0.05, 1), (0.4, 0.8), (0.45, 0)])
    slide += 0.5 * burst(r, 0.45, [('bp', 1800, 0.7)], 0.05, 0.2)
    bump = impact(r, [140, 330, 760], [1, .6, .3], [.1, .06, .04], [('blp', 1500, .7)], dur=0.25, noise_gain=0.5)
    rattle = impact(r, [2600, 3900], [1, .6], [.05, .03], [('bp', 3000, 1)], dur=0.1, noise_gain=0.4)
    return _rv(_cat((0, slide, 0.6), (0.43, bump, 0.8), (0.45, rattle, 0.2)), 'room', 0.15)


def drawer_close():
    r = rng('drawer_close')
    slide = stick_slip(r, 0.3, [(0, 180), (0.3, 120)], [(600, 0.6), (1400, 0.5), (2800, 0.3)], q=4, jitter=0.4,
                       amp_pts=[(0, 0), (0.04, 1), (0.3, 1)])
    bang = impact(r, [110, 250, 600, 1300], [1, .8, .5, .3], [.15, .1, .06, .04], [('blp', 2000, .7)], dur=0.35,
                  noise_gain=0.8)
    return _rv(_cat((0, slide, 0.5), (0.3, bang, 1.0)), 'room', 0.2)


def cabinet_open():
    r = rng('cabinet')
    roll = burst(r, 0.6, [('bp', 900, 0.8)], 0.04, 0.4) * (1 + 0.6 * np.sin(TAU * 34 * tvec(ns(0.6))))
    tick = grains(r, 0.55, 70, lambda rr, a: impact(rr, [2800, 4300], [1, .5], [.015, .01], [('bp', 3500, 1)], dur=0.03) * a * 0.15)
    clank = impact(r, [310, 720, 1450, 2600], [1, .8, .5, .3], [.3, .2, .12, .07], [('bp', 1500, .8)], dur=0.6, noise_gain=0.5)
    return _rv(_cat((0, roll, 0.5), (0, tick, 0.6), (0.58, clank, 0.9)), 'metal', 0.18)


# ============================================================================ inventory & paper
def pickup():
    r = rng('pickup')
    swish = burst(r, 0.16, [('bp', 2500, 0.6)], 0.03, 0.05)
    tock = impact(r, [420, 980], [1, .4], [.05, .03], [('blp', 2000, .7)], dur=0.1, noise_gain=0.2)
    return _cat((0, swish, 0.5), (0.06, tock, 0.8))


def combine():
    r = rng('combine')
    a = impact(r, [900, 2100, 3700], [1, .6, .3], [.05, .03, .02], [('bp', 3000, 1)], dur=0.1, noise_gain=0.5)
    b = impact(r, [1300, 2800, 4600], [1, .6, .3], [.06, .04, .02], [('bp', 3500, 1)], dur=0.12, noise_gain=0.5)
    snick = burst(r, 0.05, [('bp', 6000, 2)], 0.001, 0.008)
    return _cat((0, a, 0.8), (0.11, b, 0.9), (0.16, snick, 0.4))


def paper_rustle():
    r = rng('paper_rustle')
    env = lambda t: 900 * math.sin(math.pi * min(t / 0.7, 1.0)) ** 0.7 + 50
    y = grains(r, 0.7, env, lambda rr, a: burst(rr, 0.006, [('bp', rr.uniform(1500, 7500), 1.2)], 0.0004, 0.0012) * a, 0.7)
    y += 0.3 * burst(r, 0.7, [('bp', 3000, 0.6)], 0.08, 0.3)
    return y


def paper_slide():
    r = rng('paper_slide')
    n = ns(0.55)
    y = filt(r.standard_normal(n), [('bp', 2600, 0.7), ('hs', 6000, 0.7, -6)], tail=0.02)
    y *= np.sin(np.pi * np.clip(tvec(n) / 0.55, 0, 1)) ** 1.5 * (1 + 0.3 * wander(n, 12, r))
    return y


def page_turn():
    r = rng('page_turn')
    n = ns(0.45)
    t = tvec(n)
    lo = filt(r.standard_normal(n), [('bp', 1200, 0.7)], tail=0.02)
    hi = filt(r.standard_normal(n), [('bp', 4500, 0.7)], tail=0.02)
    u = np.clip(t / 0.35, 0, 1)
    y = (lo * (1 - u) + hi * u) * np.sin(np.pi * u) ** 2
    flap = burst(r, 0.06, [('blp', 1500, 0.7)], 0.002, 0.01)
    mix_at(y, flap, ns(0.33), 2.0)
    return y


def pencil():
    r = rng('pencil')
    parts = []
    t = 0.0
    for k in range(9):
        d = r.uniform(0.05, 0.12)
        n = ns(d)
        s = filt(r.standard_normal(n), [('bp', r.uniform(3000, 5000), 1.0)], tail=0.01)
        s *= np.sin(np.pi * np.arange(n) / n) ** 0.7 * (1 + 0.5 * np.sin(TAU * r.uniform(30, 60) * tvec(n)))
        parts.append((t, s, r.uniform(0.5, 1.0)))
        t += d + r.uniform(0.01, 0.05)
    tap = burst(r, 0.03, [('bp', 2500, 1)], 0.001, 0.004)
    parts.append((t + 0.05, tap, 0.8))
    return _cat(*parts)


def key_drop():
    r = rng('key_drop')
    tink = modal(r, [3100, 4700, 6900, 8800], [1, .6, .4, .2], [.12, .08, .05, .04], 0.25)
    tink /= np.abs(tink).max() + 1e-9
    tink2 = modal(r, [3350, 5100, 7400], [1, .5, .3], [.08, .05, .04], 0.15)
    tink2 /= np.abs(tink2).max() + 1e-9
    paper = burst(r, 0.2, [('bp', 2500, 0.7)], 0.002, 0.03)
    thud = burst(r, 0.12, [('blp', 600, 0.7)], 0.002, 0.02)
    return _rv(_cat((0, thud, 0.5), (0.0, tink, 0.6), (0.005, paper, 0.5), (0.11, tink2, 0.3)), 'room', 0.15)


# ============================================================================ impacts & tools
def metal_clank():
    r = rng('metal_clank')
    y = impact(r, [190, 470, 980, 1630, 2420, 3600], [1, .9, .7, .5, .35, .2], [.9, .7, .5, .35, .25, .15],
               [('bp', 2500, 0.7)], noise_tau=0.004, noise_gain=0.6, dur=1.2)
    return _rv(y, 'metal', 0.3)


def chain():
    r = rng('chain')
    def link(rr, a):
        f = rr.uniform(2200, 4200)
        return impact(rr, [f, f * 1.47, f * 2.2], [1, .6, .3], [.06, .04, .03], [('bp', f, 1.5)], dur=0.08, noise_gain=0.4) * a
    y = grains(r, 0.9, lambda t: 70 * math.exp(-((t - 0.3) / 0.3) ** 2) + 8, link, 0.5)
    return _rv(y, 'room', 0.15)


def pry():
    r = rng('pry')
    groan = stick_slip(r, 1.0, [(0, 18), (0.6, 30), (1.0, 45)], [(180, 1.0), (420, 0.7), (900, 0.4)], q=8,
                       amp_pts=[(0, 0), (0.1, 0.6), (0.8, 1.0), (1.0, 0.2)])
    cracks = [(0.85 + 0.03 * k, wood_crack_core(rng('prycrack', k)), 0.5 - 0.1 * k) for k in range(3)]
    return _rv(_cat((0, groan, 0.6), *cracks), 'room', 0.15)


def wood_crack_core(r):
    sharp = burst(r, 0.05, [('bhp', 800, 1), ('blp', 7000, 1)], 0.0004, 0.004)
    body = impact(r, [160, 380, 900, 1800], [1, .7, .4, .2], [.08, .05, .03, .02], [('bp', 2000, 0.6)], dur=0.25, noise_gain=0.5)
    spl = grains(r, 0.2, lambda t: 300 * math.exp(-t / 0.05), lambda rr, a: burst(rr, 0.004, [('bp', rr.uniform(2000, 6000), 1.5)], 0.0003, 0.001) * a * 0.4)
    return _cat((0, sharp, 1.0), (0, body, 0.8), (0.005, spl, 0.7))


def wood_crack():
    return _rv(wood_crack_core(rng('wood_crack')), 'room', 0.2)


def glass_clink():
    r = rng('glass_clink')
    g1 = modal(r, [2310, 4120, 6020, 7900], [1, .5, .35, .2], [.6, .35, .25, .15], 0.9)
    g2 = modal(r, [2580, 4490, 6430], [1, .45, .3], [.5, .3, .2], 0.8)
    y = _cat((0, g1 / (np.abs(g1).max() + 1e-9), 0.8), (0.004, g2 / (np.abs(g2).max() + 1e-9), 0.6))
    return _rv(y, 'room', 0.15)


def pour():
    r = rng('pour')
    dur = 1.6
    n = ns(dur)
    stream = filt(r.standard_normal(n), [('bp', 1500, 0.8)], tail=0.02) * 0.25
    def g(rr, a):
        tt = rr.random()
        return bubble(rr, 500 + 1600 * tt + rr.uniform(-100, 100), rr.uniform(0.015, 0.04), 0.5, a)
    gl = grains(r, dur, lambda t: 70 * (0.3 + min(t / 0.2, 1)) * (1 if t < 1.35 else max(0, 1 - (t - 1.35) / 0.25)), g, 0.4)
    env = np.clip(tvec(n) / 0.05, 0, 1) * np.clip((dur - tvec(n)) / 0.25, 0, 1)
    return _rv((stream + gl * 0.5) * env, 'room', 0.12)


def lighter():
    r = rng('lighter')
    lid = modal(r, [3400, 5200, 7600], [1, .6, .3], [.18, .12, .08], 0.3)
    lid /= np.abs(lid).max() + 1e-9
    wheel = burst(r, 0.05, [('bp', 4000, 1)], 0.001, 0.012)
    flame = burst(r, 0.7, [('blp', 1500, 0.7), ('bhp', 150, 0.7)], 0.03, 0.25)
    return _rv(_cat((0, lid, 0.6), (0.35, wheel, 0.9), (0.37, flame, 0.5)), 'room', 0.1)


def match():
    r = rng('match')
    n = ns(0.16)
    scratch = filt(r.standard_normal(n), [('bp', 3500, 0.8)], tail=0.01) * np.sin(np.pi * np.arange(n) / n) ** 0.5
    flare = burst(r, 0.8, [('blp', 2500, 0.7), ('bhp', 120, 0.7)], 0.01, 0.25)
    crackle = grains(r, 0.4, 40, lambda rr, a: burst(rr, 0.004, [('bp', 3000, 1)], 0.0003, 0.001) * a * 0.4)
    return _rv(_cat((0, scratch, 0.8), (0.14, flare, 0.7), (0.15, crackle, 0.6)), 'room', 0.1)


def fire_crackle():
    r = rng('fire')
    dur = 2.0
    n = ns(dur)
    roar = filt(colored(n, r, -6.0), [('blp', 700, 0.7), ('bhp', 60, 0.7)], tail=0.05) * (1 + 0.3 * wander(n, 2, r))
    pops = grains(r, dur, 18, lambda rr, a: burst(rr, 0.01, [('bhp', 1200, 1), ('blp', rr.uniform(4000, 9000), 1)], 0.0003, rr.uniform(0.0008, 0.003)) * a, 0.7)
    y = roar * 0.25 + pops
    return y * np.clip(tvec(n) / 0.1, 0, 1) * np.clip((dur - tvec(n)) / 0.3, 0, 1)


def steam():
    r = rng('steam')
    n = ns(1.2)
    y = filt(r.standard_normal(n), [('bhp', 2500, 2), ('pk', 5500, 1, 4), ('blp', 11000, 2)], tail=0.02)
    t = tvec(n)
    return y * np.clip(t / 0.06, 0, 1) * np.exp(-np.maximum(t - 0.4, 0) / 0.35) * (1 + 0.15 * wander(n, 15, r))


def typewriter():
    r = rng('typewriter')
    parts = []
    t = 0.0
    for k in range(8):
        parts.append((t, F.keystroke(r, typist=1, v=r.uniform(0.7, 1.0)), 1.0))
        t += r.uniform(0.09, 0.16) + (0.15 if k == 4 else 0)
    return _rv(_cat(*parts), 'room', 0.18)


def phone_ring():
    r = rng('phone_ring')
    return _rv(F.ringer(r, 1.6, 1180, 1520, 20.0, 'phone', 0.5), 'room', 0.2)


def phone_pickup():
    r = rng('phone_pickup')
    clunk = impact(r, [220, 600, 1400, 2900], [1, .7, .4, .2], [.08, .05, .03, .02], [('bp', 1500, .8)], dur=0.25, noise_gain=0.5)
    hook = impact(r, [2500, 4200], [1, .5], [.03, .02], [('bp', 3500, 1)], dur=0.06, noise_gain=0.5)
    ding = bell(1520, 'phone', 0.4, seed=3, length=0.6)
    return _rv(_cat((0, hook, 0.6), (0.03, ding, 0.12), (0.12, clunk, 0.9)), 'room', 0.15)


def phone_dial():
    r = rng('phone_dial')
    parts = []
    t = 0.0
    for digit in (4, 7):
        wind_n = digit + 2
        for k in range(wind_n):
            parts.append((t + k * 0.045, impact(r, [2600, 4100], [1, .5], [.02, .012], [('bp', 3500, 1)], dur=0.03, noise_gain=0.5), 0.3))
        t += wind_n * 0.045 + 0.08
        stop = impact(r, [1800, 3000], [1, .5], [.03, .02], [('bp', 2500, 1)], dur=0.05, noise_gain=0.5)
        parts.append((t, stop, 0.6))
        t += 0.12
        ret = digit * 0.1 + 0.08
        n = ns(ret)
        whirr = filt(r.standard_normal(n), [('bp', 700, 2)], tail=0.02) * 0.25 + 0.2 * np.sin(TAU * 95 * tvec(n))
        whirr *= np.clip(tvec(n) / 0.02, 0, 1) * np.clip((ret - tvec(n)) / 0.03, 0, 1)
        parts.append((t, whirr, 0.5))
        for k in range(digit):
            parts.append((t + 0.04 + k * 0.1, impact(r, [1500, 3200], [1, .4], [.02, .01], [('bp', 2500, 1)], dur=0.03, noise_gain=0.3), 0.25))
        t += ret + 0.25
    return _rv(_cat(*parts), 'room', 0.1)


# ============================================================================ interface & stingers (non-musical)
def ui_click():
    r = rng('ui_click')
    y = impact(r, [1800, 3600], [1, .4], [.025, .015], [('bp', 3000, 1.2)], dur=0.05, noise_gain=0.4)
    return y


def ui_hover():
    r = rng('ui_hover')
    y = impact(r, [2600, 5200], [1, .3], [.018, .01], [('bp', 4500, 1.5)], dur=0.035, noise_gain=0.2)
    return y


def error():
    r = rng('error')
    thunk = impact(r, [110, 175, 330], [1, .6, .25], [.12, .08, .05], [('blp', 700, .7)], noise_tau=0.006, noise_gain=0.5, dur=0.35)
    return _rv(thunk, 'room', 0.1)


def _mallet_notes(kind, notes, dur, name, tremolo=0.0):
    m = Mallet(kind, name, tremolo=tremolo)
    y = m.render(notes, ns(dur), pedal=[(0, dur)])
    return 0.5 * (y[0] + y[1])


def clue():
    y = _mallet_notes('vibes', [Note(0.0, 0.6, 84, 0.75), Note(0.07, 0.6, 91, 0.7)], 1.0, 'sfx_clue', 0.25)
    y += 0.6 * _mallet_notes('celesta', [Note(0.0, 0.5, 96, 0.6)], 1.0, 'sfx_clue_cel')
    return _rv(y, 'plate', 0.25)


def deduction():
    y = _mallet_notes('vibes', [Note(0.0, 0.5, 79, 0.65), Note(0.0, 0.5, 74, 0.5),
                                Note(0.32, 1.1, 84, 0.72), Note(0.32, 1.1, 76, 0.55), Note(0.32, 1.1, 79, 0.5)], 1.6,
                        'sfx_ded', 0.25)
    return _rv(y, 'plate', 0.25)


def danger():
    r = rng('danger')
    n = ns(1.4)
    t = tvec(n)
    boom = np.sin(TAU * np.cumsum(38 + 30 * np.exp(-t / 0.08)) / SR) * env_ad(n, 0.003, 0.35)
    hit = burst(r, 1.4, [('blp', 400, 0.7)], 0.002, 0.06)
    cl = np.zeros(n)
    for f in (65.4, 69.3, 98.0, 103.8):
        cl += np.sin(TAU * f * t + r.uniform(0, 6)) * np.exp(-t / 0.5)
    cl = filt(cl, [('blp', 600, 0.7)], tail=0.05)
    return _rv(boom * 1.0 + hit * 0.4 + cl * 0.25, 'hall', 0.2)


def heartbeat():
    r = rng('heartbeat')
    def beat(a):
        n = ns(0.25)
        t = tvec(n)
        return np.sin(TAU * np.cumsum(55 + 25 * np.exp(-t / 0.03)) / SR) * env_ad(n, 0.004, 0.05) * a
    return _cat((0, beat(1.0), 1.0), (0.2, beat(0.7), 1.0), (0.85, beat(1.0), 0.9), (1.05, beat(0.7), 0.9))


def thud():
    r = rng('thud')
    body = impact(r, [55, 90, 160, 330], [1, .8, .5, .25], [.25, .18, .1, .06], [('blp', 700, 0.7)], noise_tau=0.012, noise_gain=0.8, dur=0.7)
    cloth = burst(r, 0.3, [('bp', 2500, 0.6)], 0.005, 0.06)
    rattle = impact(r, [700, 1500], [1, .5], [.05, .03], [('bp', 1200, 1)], dur=0.1, noise_gain=0.3)
    return _rv(_cat((0, body, 1.0), (0.0, cloth, 0.3), (0.09, rattle, 0.25)), 'room', 0.2)


def sap():
    """A leather sap on a skull: a dull, heavy thwock (no ring of metal), a body thump and the
    victim's ears ringing."""
    r = rng('sap')
    smack = impact(r, [210, 390, 760], [1, .8, .45], [.16, .12, .08], [('bp', 700, 0.7)], noise_tau=0.012,
                   noise_gain=0.45, dur=0.4)
    low = impact(r, [70, 115, 160], [1, .7, .4], [.3, .22, .15], [('blp', 300, .7)], dur=0.5, noise_gain=0.25)
    n = ns(1.2)
    tt = tvec(n)
    ring = (np.sin(TAU * 3600 * tt) + 0.4 * np.sin(TAU * 3611 * tt)) * np.exp(-tt / 0.45) * np.clip(tt / 0.08, 0, 1) * 0.1
    return _cat((0, smack, 1.0), (0, low, 1.0), (0.06, ring, 1.0))


def alarm_bell():
    r = rng('alarm')
    dur = 3.0
    out = np.zeros(ns(dur + 0.6))
    b = bell(880, 'fire', 0.8, seed=1, length=1.5)
    t = 0.0
    while t < dur:
        mix_at(out, b, ns(t), 0.25 * (0.8 + 0.2 * r.random()))
        t += 1.0 / 16.0
    tt = tvec(out.size)
    out *= np.where(tt > dur, np.exp(-(tt - dur) / 0.15), 1.0)
    return _rv(out, 'corridor', 0.2)


def switch():
    r = rng('switch')
    a = impact(r, [1500, 3200, 5400], [1, .6, .3], [.03, .02, .012], [('bp', 3800, 1)], dur=0.06, noise_gain=0.6)
    b = impact(r, [400, 1100], [1, .5], [.04, .03], [('bp', 900, 1)], dur=0.08, noise_gain=0.3)
    return _rv(_cat((0, b, 0.5), (0.012, a, 1.0)), 'room', 0.1)


def buzzer():
    r = rng('buzzer')
    dur = 1.0
    n = ns(dur)
    ph = phase_cycles(120.0, n)
    y = np.tanh(3 * np.sin(TAU * ph)) + 0.3 * blep_saw(ph * 2, np.full(n, 240 / SR))
    y = filt(y, [('pk', 1800, 2, 6), ('blp', 5000, 1)], tail=0.02)
    y += 0.1 * filt(r.standard_normal(n), [('bp', 3000, 1)], tail=0.02) * (1 + np.sin(TAU * 120 * tvec(n)))
    return _rv(y * np.clip(tvec(n) / 0.01, 0, 1) * np.clip((dur - tvec(n)) / 0.02, 0, 1), 'room', 0.15)


def radio_static():
    r = rng('static')
    dur = 1.6
    n = ns(dur)
    hiss = filt(r.standard_normal(n), [('bp', 2500, 0.5)], tail=0.02) * 0.4
    crack = grains(r, dur, 25, lambda rr, a: burst(rr, 0.006, [('bhp', 500, 1)], 0.0003, rr.uniform(0.0005, 0.003)) * a, 0.9)
    hum = 0.05 * np.sin(TAU * 60 * tvec(n))
    y = (hiss * (1 + 0.5 * wander(n, 3, r)) + crack + hum)
    return y * np.clip(tvec(n) / 0.02, 0, 1) * np.clip((dur - tvec(n)) / 0.1, 0, 1)


def radio_tune():
    r = rng('tune')
    dur = 2.2
    n = ns(dur)
    t = tvec(n)
    stat = filt(r.standard_normal(n), [('bp', 2000, 0.5)], tail=0.02) * 0.35
    f = 400 + 2600 * (0.5 + 0.5 * np.cos(TAU * t / 2.4)) * np.exp(-t / 3)
    whistle = np.sin(TAU * np.cumsum(f) / SR) * 0.25 * (0.5 + 0.5 * np.sin(np.pi * np.clip(t / dur, 0, 1)))
    vo = F.voice(r, dur, 130, 5.0) * 0.25
    vo = filt(vo, [('bp', 1500, 0.8)], tail=0.02) * np.exp(-((t - 1.2) / 0.25) ** 2)
    music = np.zeros(n)
    for fr in (392, 494, 587):
        music += np.sin(TAU * fr * t) * np.exp(-((t - 1.75) / 0.18) ** 2) * 0.12
    y = stat * (1 - 0.6 * np.exp(-((t - 1.75) / 0.3) ** 2)) + whistle + vo + music
    return y * np.clip(t / 0.03, 0, 1) * np.clip((dur - t) / 0.15, 0, 1)


def crowd_gasp():
    r = rng('gasp')
    out = np.zeros(ns(1.2))
    for k in range(14):
        fem = r.random() < 0.45
        g = F.gasp_voice(r, r.uniform(180, 240) if fem else r.uniform(100, 150), fem)
        mix_at(out, g, ns(r.uniform(0, 0.12)), r.uniform(0.4, 1.0))
    return _rv(out, 'hall', 0.35)


def gramophone():
    r = rng('gramophone')
    dur = 1.0
    n = ns(dur)
    drop = impact(r, [120, 340, 900], [1, .5, .3], [.05, .04, .03], [('blp', 1200, .7)], dur=0.15, noise_gain=0.6)
    surface = filt(r.standard_normal(n), [('bp', 3000, 0.6)], tail=0.02) * 0.08
    rot = 0.5 + 0.5 * np.sin(TAU * 1.3 * tvec(n))
    crack = grains(r, dur, 30, lambda rr, a: burst(rr, 0.004, [('bhp', 1500, 1)], 0.0002, rr.uniform(0.0004, 0.0015)) * a * 0.6, 0.8)
    rumble = filt(r.standard_normal(n), [('blp', 80, 0.7)], tail=0.05) * 0.15
    y = _cat((0, drop, 1.0), (0.05, surface * (0.7 + 0.3 * rot) + crack + rumble, 1.0))
    return y


def safe_tick():
    r = rng('safe_tick')
    return _rv(impact(r, [2400, 4100, 6300], [1, .6, .3], [.035, .02, .012], [('bp', 4500, 1.2)], dur=0.06, noise_gain=0.4), 'metal', 0.12)


def wheel_click():
    r = rng('wheel_click')
    a = impact(r, [1700, 3100, 4900], [1, .6, .3], [.045, .03, .02], [('bp', 3500, 1)], dur=0.08, noise_gain=0.5)
    b = impact(r, [600, 1300], [1, .5], [.04, .03], [('bp', 1100, 1)], dur=0.06, noise_gain=0.3)
    return _rv(_cat((0, a, 1.0), (0.018, b, 0.5)), 'metal', 0.12)


# ============================================================================ outdoors & nature
def splash():
    r = rng('splash')
    dur = 1.4
    n = ns(dur)
    body = burst(r, dur, [('blp', 2500, 0.7), ('bhp', 80, 0.7)], 0.004, 0.18) * 1.2
    spray = burst(r, dur, [('bhp', 2000, 0.7)], 0.01, 0.25) * 0.4
    bub = grains(r, dur, lambda t: 80 * math.exp(-t / 0.4), lambda rr, a: bubble(rr, rr.uniform(400, 2200), rr.uniform(0.02, 0.06), 0.5, a), 0.5)
    drops = grains(r, dur, lambda t: 25 * math.exp(-((t - 0.5) / 0.3) ** 2), lambda rr, a: F.drip(rr, rr.uniform(900, 2200)) * a * 0.3, 0.5)
    return _rv(body + spray + bub * 0.4 + drops, 'outdoor', 0.2)


def gull():
    return _rv(F.gull_call(rng('gull_sfx'), 4), 'outdoor', 0.3)


def foghorn():
    y = F.foghorn(rng('foghorn_sfx'), 3.0, 148.0)
    return _rv(y, 'harbor', 0.5)


def church_bell():
    y = bell(392.0, 'church', 0.85, seed=2, length=5.0)
    return _rv(y, 'outdoor', 0.35)


def clock_bong():
    y = bell(262.0, 'clock', 0.7, seed=4, length=3.5)
    y = filt(y, [('blp', 3500, 0.7)], tail=0.05)
    return _rv(y, 'room', 0.25)


def ice_chip():
    r = rng('ice_chip')
    crack = burst(r, 0.04, [('bhp', 1500, 1), ('blp', 9000, 1)], 0.0003, 0.003)
    hit = impact(r, [1800, 3300, 5200], [1, .6, .3], [.04, .03, .02], [('bp', 3500, 1)], dur=0.1, noise_gain=0.8)
    shards = grains(r, 0.35, lambda t: 120 * math.exp(-t / 0.08),
                    lambda rr, a: modal(rr, [rr.uniform(4000, 9000)], [1], [0.04], 0.05) * a * 0.3, 0.6)
    return _rv(_cat((0, crack, 1.0), (0, hit, 0.6), (0.01, shards, 0.7)), 'metal', 0.15)


def salt():
    r = rng('salt')
    dur = 1.3
    y = grains(r, dur, lambda t: 1600 * math.sin(math.pi * min(t / dur, 1.0)) ** 0.5 + 30,
               lambda rr, a: burst(rr, 0.004, [('bp', rr.uniform(2500, 8000), 2)], 0.0002, 0.0007) * a, 0.6)
    pour_n = burst(r, dur, [('bp', 5000, 0.6)], 0.05, 0.6) * 0.15
    return y + pour_n


def cloth_rip():
    r = rng('rip')
    dur = 0.7
    n = ns(dur)
    t = tvec(n)
    rate = 400 + 900 * np.sin(np.pi * np.clip(t / dur, 0, 1))
    y = grains(r, dur, lambda tt: 400 + 900 * math.sin(math.pi * min(tt / dur, 1)),
               lambda rr, a: burst(rr, 0.005, [('bp', rr.uniform(1500, 5000), 1.5)], 0.0003, 0.0012) * a, 0.5)
    y += 0.3 * filt(r.standard_normal(n), [('bp', 2500, 0.8)], tail=0.02) * np.sin(np.pi * np.clip(t / dur, 0, 1))
    return y


def straw():
    r = rng('straw')
    dur = 0.9
    y = grains(r, dur, lambda t: 500 * math.sin(math.pi * min(t / dur, 1)) ** 0.6 + 20,
               lambda rr, a: burst(rr, 0.008, [('bp', rr.uniform(1800, 6500), 1.2)], 0.0004, 0.002) * a, 0.7)
    y += 0.25 * burst(r, dur, [('bp', 3000, 0.6)], 0.1, 0.4)
    return y


def spoon_scrape():
    r = rng('spoon')
    y = stick_slip(r, 0.9, [(0, 140), (0.45, 220), (0.9, 160)], [(1900, 1.0), (3100, 0.8), (4700, 0.5), (850, 0.4)],
                   q=14, jitter=0.5, amp_pts=[(0, 0), (0.06, 1), (0.8, 0.9), (0.9, 0)])
    grit = burst(r, 0.9, [('bp', 6000, 0.8)], 0.05, 0.5) * 0.3
    return _rv(y + grit, 'tile', 0.15)


def smoke_whoosh():
    r = rng('smoke')
    dur = 1.3
    n = ns(dur)
    t = tvec(n)
    lo = filt(r.standard_normal(n), [('bp', 450, 0.6)], tail=0.02)
    hi = filt(r.standard_normal(n), [('bp', 1600, 0.6)], tail=0.02)
    u = np.clip(t / dur, 0, 1)
    y = (lo * (1 - u) + hi * u) * np.sin(np.pi * u) ** 1.5
    return y


def barrels():
    r = rng('barrels')
    dur = 3.0
    out = np.zeros(ns(dur + 1.0))
    for b in range(3):
        t0 = 0.15 * b + r.uniform(0, 0.1)
        # rolling: rumble modulated by stave rotation
        roll_d = r.uniform(1.6, 2.4)
        n = ns(roll_d)
        tt = tvec(n)
        rate = 6 + 4 * tt / roll_d
        rum = filt(r.standard_normal(n), [('bp', 260 + 60 * b, 1.2)], tail=0.05) * (0.5 + 0.5 * np.sin(TAU * np.cumsum(rate) / SR) ** 2)
        rum *= np.clip(tt / 0.1, 0, 1) * np.clip((roll_d - tt) / 0.3, 0, 1)
        mix_at(out, rum, ns(t0), 0.5)
        # tumbling bounces
        tb = t0
        for k in range(int(r.integers(3, 6))):
            tb += r.uniform(0.25, 0.6)
            if tb > dur - 0.2:
                break
            f0 = r.uniform(130, 210)
            hit = impact(r, [f0, f0 * 1.8, f0 * 3.1, f0 * 5.3], [1, .7, .4, .2], [.35, .25, .15, .08],
                         [('blp', 2500, .7)], noise_tau=0.006, noise_gain=0.7, dur=0.6)
            mix_at(out, hit, ns(tb), 0.9 * (1 - 0.12 * k))
    return _rv(out, 'outdoor', 0.2)


def rope_cut():
    r = rng('rope')
    saw = grains(r, 0.45, lambda t: 140, lambda rr, a: burst(rr, 0.01, [('bp', rr.uniform(1500, 4000), 1.2)], 0.0005, 0.003) * a, 0.6)
    snap = burst(r, 0.08, [('bhp', 600, 1), ('blp', 6000, 1)], 0.0004, 0.006)
    whip = burst(r, 0.25, [('bp', 900, 0.8)], 0.01, 0.06)
    return _cat((0, saw, 0.6), (0.45, snap, 1.0), (0.46, whip, 0.6))


def hatch_creak():
    r = rng('hatch')
    groan = stick_slip(r, 1.3, [(0, 14), (0.7, 26), (1.2, 20)], [(140, 1.0), (330, 0.7), (760, 0.4)], q=9,
                       amp_pts=[(0, 0), (0.15, 0.8), (1.0, 1.0), (1.3, 0)])
    clunk = impact(r, [95, 210, 520, 1300], [1, .7, .4, .2], [.3, .2, .1, .05], [('blp', 1500, .7)], dur=0.6, noise_gain=0.6)
    return _rv(_cat((0, groan, 0.8), (1.25, clunk, 1.0)), 'hold', 0.25)


def ship_creak():
    r = rng('shipcreak')
    a = stick_slip(r, 1.6, [(0, 10), (0.8, 22), (1.6, 12)], [(110, 1.0), (260, 0.8), (540, 0.4)], q=10,
                   amp_pts=[(0, 0), (0.3, 1), (1.3, 0.8), (1.6, 0)])
    return _rv(a, 'hold', 0.3)


def camera_shutter():
    r = rng('shutter')
    a = impact(r, [1600, 3300, 5600], [1, .6, .3], [.03, .02, .012], [('bp', 4000, 1)], dur=0.05, noise_gain=0.6)
    b = impact(r, [1300, 2900, 4800], [1, .6, .3], [.035, .02, .012], [('bp', 3500, 1)], dur=0.06, noise_gain=0.6)
    wind_ = burst(r, 0.12, [('bp', 3000, 1)], 0.01, 0.04)
    return _rv(_cat((0, a, 1.0), (0.065, b, 0.8), (0.12, wind_, 0.25)), 'room', 0.1)


def enlarger_hum():
    r = rng('enlarger')
    dur = 1.0
    n = ns(dur)
    t = tvec(n)
    y = 0.6 * np.sin(TAU * 120 * t) + 0.25 * np.sin(TAU * 240 * t) + 0.15 * np.sin(TAU * 360 * t) + 0.12 * np.sin(TAU * 60 * t)
    y += 0.08 * filt(r.standard_normal(n), [('bp', 2400, 2)], tail=0.02) * (1 + np.sin(TAU * 120 * t))
    return y * np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / 0.08, 0, 1)


def drip():
    return _rv(F.drip(rng('drip_sfx'), 1500), 'tile', 0.3)


def punch():
    r = rng('punch')
    thump = impact(r, [70, 140, 300], [1, .6, .3], [.12, .08, .05], [('blp', 600, .7)], noise_tau=0.01, noise_gain=0.8, dur=0.3)
    slap = burst(r, 0.08, [('bp', 2200, 0.7)], 0.0006, 0.008)
    return _cat((0, thump, 1.0), (0.002, slap, 0.6))


def gun_cock():
    r = rng('gun')
    a = impact(r, [1900, 3500, 5600], [1, .6, .35], [.04, .025, .015], [('bp', 4000, 1)], dur=0.07, noise_gain=0.6)
    rot = burst(r, 0.1, [('bp', 5000, 1.5)], 0.01, 0.03)
    b = impact(r, [2400, 4200, 6500], [1, .6, .35], [.05, .03, .02], [('bp', 4800, 1)], dur=0.08, noise_gain=0.7)
    return _rv(_cat((0, a, 0.7), (0.04, rot, 0.3), (0.16, b, 1.0)), 'room', 0.12)


def cell_door():
    r = rng('cell')
    dur = 1.6
    n = ns(dur)
    t = tvec(n)
    roll = filt(r.standard_normal(n), [('bp', 450, 1.0)], tail=0.05) * (1 + 0.5 * np.sin(TAU * 22 * t))
    roll += 0.4 * filt(r.standard_normal(n), [('bp', 1800, 2.0)], tail=0.05)
    roll *= np.clip(t / 0.1, 0, 1) * np.clip((1.4 - t) / 0.1, 0, 1)
    clang = impact(r, [160, 410, 860, 1420, 2300, 3500], [1, .9, .7, .5, .35, .2], [.9, .7, .5, .35, .25, .15],
                   [('bp', 2000, .7)], noise_gain=0.7, dur=1.2)
    return _rv(_cat((0, roll, 0.5), (1.38, clang, 1.0)), 'tile', 0.3)


def van():
    r = rng('van')
    dur = 3.0
    n = ns(dur)
    t = tvec(n)
    eng = F.engine(r, dur, [(0, 900), (0.4, 1800), (1.2, 2300), (1.6, 1700), (3.0, 2100)], cyl=6,
                   load_pts=[(0, 0.7), (0.4, 1), (3, 0.9)])
    crunch = grains(r, 1.0, lambda tt: 300 * math.exp(-tt / 0.4),
                    lambda rr, a: burst(rr, 0.006, [('bp', rr.uniform(1500, 5000), 1)], 0.0003, 0.0015) * a, 0.6)
    dist = 1.0 / (1 + (t / 1.3) ** 2)
    y = eng * (0.3 + 0.7 * dist)
    y = filt(y, [('blp', 2500, 0.7)], tail=0.05)
    lo = filt(y, [('blp', 700, 0.7)], tail=0.05)
    y = y * dist + lo * (1 - dist)
    out = _cat((0, y, 1.0), (0.3, crunch, 0.35))[:n]
    out *= np.clip(t / 0.15, 0, 1) * np.clip((dur - t) / 0.4, 0, 1)
    return _rv(out, 'outdoor', 0.2)


def chain_rattle():
    """A heavy iron gate chain shaken twice against the bars, padlock knocking."""
    r = rng('chain_rattle')
    def link(rr, a):
        f = rr.uniform(900, 2300)
        return impact(rr, [f, f * 1.52, f * 2.31, f * 3.4], [1, .7, .45, .2], [.12, .09, .06, .04],
                      [('bp', f * 1.4, 1.2)], noise_tau=0.002, noise_gain=0.45, dur=0.2, jitter=0.02) * a
    parts = []
    for k, t0 in enumerate((0.0, 0.34)):
        shake = grains(r, 0.3, lambda t: 140 * math.exp(-t / 0.09) + 10, link, 0.45)
        parts.append((t0, shake, 0.75 if k == 0 else 0.6))
        bar = impact(r, [410, 1130, 2210, 3480], [1, .7, .4, .2], [.7, .45, .3, .2], [('bp', 1800, .8)],
                     noise_tau=0.003, noise_gain=0.4, dur=0.8)
        parts.append((t0 + 0.012, bar, 0.45 if k == 0 else 0.35))
        thump = impact(r, [120, 230], [1, .6], [.12, .08], [('blp', 600, .7)], dur=0.25, noise_gain=0.3)
        parts.append((t0, thump, 0.45))
    lock = impact(r, [760, 1650, 2900], [1, .6, .3], [.15, .1, .06], [('bp', 1500, 1)], dur=0.3, noise_gain=0.5)
    parts.append((0.5, lock, 0.5))
    return _rv(_cat(*parts), 'outdoor', 0.25)


def crate_creak():
    """Stepping up onto an ash-can and a wooden crate: the can's lid flexes ('oil-can' bonk),
    the crate creaks under the load."""
    r = rng('crate_creak')
    flex = impact(r, [180, 410, 960, 1700], [1, .8, .45, .25], [.28, .2, .12, .08], [('blp', 1500, .7)],
                  noise_tau=0.006, noise_gain=0.35, dur=0.5)
    lid = grains(r, 0.12, lambda t: 90, lambda rr, a: impact(rr, [rr.uniform(1800, 3000)], [1], [0.05], [('bp', 2500, 1)],
                                                             dur=0.06, noise_gain=0.3) * a * 0.3, 0.4)
    creak_ = stick_slip(r, 0.55, [(0, 22), (0.3, 38), (0.55, 30)], [(260, 1.0), (620, 0.7), (1350, 0.35)], q=10,
                        jitter=0.25, amp_pts=[(0, 0), (0.06, 1.0), (0.4, 0.8), (0.55, 0)])
    tick = wood_crack_core(rng('crate_tick'))
    return _rv(_cat((0, flex, 0.8), (0.01, lid, 0.6), (0.12, creak_, 0.9), (0.42, tick, 0.18)), 'outdoor', 0.15)


def chapter():
    """Chapter-card sting (2-3 s), rendered from the music engine and folded to mono."""
    import music_main
    y = music_main.chapter_sting().render()
    return 0.5 * (y[0] + y[1])


# ============================================================================ registry
SFX = {}
for _s in ('wood', 'stone', 'metal', 'carpet', 'tile', 'grass', 'water'):
    for _v in (1, 2, 3):
        SFX['footstep_%s_%d' % (_s, _v)] = footstep(_s, _v)
for _name in ['door_open', 'door_close', 'door_locked', 'unlock', 'lock_click', 'padlock_open', 'creak',
              'drawer_open', 'drawer_close', 'cabinet_open', 'pickup', 'combine', 'paper_rustle', 'paper_slide',
              'page_turn', 'pencil', 'key_drop', 'metal_clank', 'chain', 'pry', 'wood_crack', 'glass_clink', 'pour',
              'lighter', 'match', 'fire_crackle', 'steam', 'typewriter', 'phone_ring', 'phone_pickup', 'phone_dial',
              'ui_click', 'ui_hover', 'error', 'clue', 'deduction', 'danger', 'heartbeat', 'thud', 'sap', 'alarm_bell',
              'switch', 'buzzer', 'radio_static', 'radio_tune', 'crowd_gasp', 'gramophone', 'safe_tick', 'wheel_click',
              'splash', 'gull', 'foghorn', 'church_bell', 'clock_bong', 'ice_chip', 'salt', 'cloth_rip', 'straw',
              'spoon_scrape', 'smoke_whoosh', 'barrels', 'rope_cut', 'hatch_creak', 'ship_creak', 'camera_shutter',
              'enlarger_hum', 'drip', 'punch', 'gun_cock', 'cell_door', 'van', 'chain_rattle', 'crate_creak',
              'chapter']:
    SFX[_name] = globals()[_name]

# hard length caps (seconds, a fade-out is applied) for effects with a specified duration
MAXLEN = {'alarm_bell': 3.4, 'barrels': 3.2, 'van': 3.2, 'gramophone': 1.0, 'enlarger_hum': 1.0,
          'phone_ring': 2.4, 'foghorn': 4.5, 'church_bell': 4.5, 'clock_bong': 3.2, 'clue': 1.6, 'deduction': 2.0,
          'danger': 2.2, 'heartbeat': 1.4, 'stinger': 3.0, 'chain_rattle': 0.9, 'crate_creak': 0.8,
          'chapter': 2.9}
for _k in SFX:
    if _k.startswith('footstep'):
        MAXLEN[_k] = 0.7


def trim(y, floor_db: float = -50.0, maxlen=None, fade: float = 0.04):
    """Cut the decayed tail (envelope below floor_db re peak) and apply a short fade."""
    y = np.asarray(y, float)
    env = np.convolve(np.abs(y), np.ones(256) / 256, mode='same')
    thr = env.max() * 10 ** (floor_db / 20)
    idx = np.nonzero(env > thr)[0]
    end = int(idx[-1]) + ns(0.02) if idx.size else y.size
    if maxlen is not None:
        end = min(end, ns(maxlen))
    end = min(end, y.size)
    y = y[:end].copy()
    f = min(ns(fade), y.size // 3)
    if f > 0:
        y[-f:] *= np.cos(np.linspace(0, np.pi / 2, f)) ** 2
    return y


# loudness class → target loudness (LUFS) used for the manifest volume
ROLE = {
    'ui': -30.0, 'foot': -25.0, 'small': -25.0, 'medium': -22.0, 'large': -19.0, 'signal': -21.0,
}
ROLE_OF = {k: 'foot' for k in SFX if k.startswith('footstep')}
ROLE_OF.update({k: 'ui' for k in ('ui_click', 'ui_hover')})
ROLE_OF.update({k: 'signal' for k in ('clue', 'deduction', 'error', 'danger', 'chapter')})
ROLE_OF.update({k: 'small' for k in ('pickup', 'combine', 'paper_rustle', 'paper_slide', 'page_turn', 'pencil',
                                     'key_drop', 'lock_click', 'safe_tick', 'wheel_click', 'switch', 'lighter', 'match',
                                     'drip', 'ice_chip', 'salt', 'straw', 'camera_shutter', 'enlarger_hum', 'gun_cock',
                                     'glass_clink', 'pour', 'gramophone', 'radio_static', 'radio_tune', 'heartbeat')})
ROLE_OF.update({k: 'large' for k in ('door_close', 'metal_clank', 'thud', 'sap', 'alarm_bell', 'splash', 'foghorn',
                                     'church_bell', 'barrels', 'cell_door', 'van', 'punch', 'crowd_gasp')})
for _k in SFX:
    ROLE_OF.setdefault(_k, 'medium')
