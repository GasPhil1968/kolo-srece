"""Accompaniment generators: drum patterns (brushes / ride / straight), ballad piano with
pedalling, swing comping, fills.  All output events are in beats."""
from __future__ import annotations

import numpy as np

from harmony import Ev, chord_at, voice_chords, shell, comp_rhythm


# ----------------------------------------------------------------------------- drums
def ride_pattern(b0: int, bars: int, rng, meter: int = 4, v: float = 0.6, kind: str = 'ride'):
    ev = []
    for bar in range(bars):
        s = b0 + bar * meter
        for beat in range(meter):
            vb = v * (1.0 if beat % 2 == 1 else 0.88) * (1 + rng.normal(0, 0.05))
            ev.append((s + beat, kind, vb))
            if beat % 2 == 1 and rng.random() < 0.93:
                ev.append((s + beat + 0.5, kind, v * 0.62 * (1 + rng.normal(0, 0.06))))
    return ev


def chick(b0: int, bars: int, meter: int = 4, v: float = 0.5, beats=(1, 3)):
    return [(b0 + bar * meter + bt, 'chick', v) for bar in range(bars) for bt in beats]


def feather(b0: int, bars: int, meter: int = 4, v: float = 0.22, beats=None):
    beats = beats if beats is not None else range(meter)
    return [(b0 + bar * meter + bt, 'kick', v) for bar in range(bars) for bt in beats]


def snare_comp(b0: int, bars: int, rng, meter: int = 4, density: float = 0.35, v: float = 0.35):
    """Sparse snare/rim comping: ghost notes on swung off-beats and triplet 'a's."""
    ev = []
    for bar in range(bars):
        s = b0 + bar * meter
        for beat in range(meter):
            if rng.random() < density * 0.5:
                ev.append((s + beat + 0.5, 'snare', v * rng.uniform(0.6, 1.0)))
            if rng.random() < density * 0.25:
                ev.append((s + beat + 2 / 3, 'snare', v * rng.uniform(0.5, 0.8), True))
        if rng.random() < density * 0.3:
            ev.append((s + float(rng.choice([1.5, 2.5, 3.5])), 'snare', v * 1.8))
    return ev


def fill_triplets(b: float, rng, v: float = 0.55, kinds=('snare', 'snare', 'tom_mid', 'tom_lo')):
    """One-beat (or two) triplet fill starting at beat b."""
    ev = []
    n = int(rng.choice([3, 6]))
    for i in range(n):
        k = kinds[min(len(kinds) - 1, int(i * len(kinds) / n))]
        ev.append((b + i / 3, k, v * (0.75 + 0.25 * i / max(n - 1, 1)), True))
    return ev


def brush_ballad(b0: int, bars: int, rng, meter: int = 4, v: float = 0.5, busy: float = 0.3):
    """Right-hand brush taps for a ballad (the swirl is a separate continuous part)."""
    ev = []
    for bar in range(bars):
        s = b0 + bar * meter
        for beat in range(meter):
            if beat % 2 == 1:
                ev.append((s + beat, 'slap', v * (1 + rng.normal(0, 0.06))))
            elif rng.random() < busy * 0.5:
                ev.append((s + beat, 'tap', v * 0.45))
            if rng.random() < busy * 0.35:
                ev.append((s + beat + 0.5, 'tap', v * 0.4))
        if rng.random() < busy * 0.3:
            ev.append((s + meter - 1 + 2 / 3, 'tap', v * 0.5, True))
    return ev


def brush_swing(b0: int, bars: int, rng, meter: int = 4, v: float = 0.5):
    """Brush 'ride' rhythm on the snare: 1, 2, 2&, 3, 4, 4& with slaps on 2 and 4."""
    ev = []
    for bar in range(bars):
        s = b0 + bar * meter
        for beat in range(meter):
            if beat % 2 == 1:
                ev.append((s + beat, 'slap', v * (1 + rng.normal(0, 0.05))))
                if rng.random() < 0.9:
                    ev.append((s + beat + 0.5, 'tap', v * 0.45))
            else:
                ev.append((s + beat, 'tap', v * 0.62))
    return ev


def straight_kit(b0: int, bars: int, rng, meter: int = 4, v: float = 0.6, hat16: bool = False,
                 snare_beats=(1, 3), kick_pat=(0, 2.5), hat_kind='hat'):
    ev = []
    for bar in range(bars):
        s = b0 + bar * meter
        step = 0.25 if hat16 else 0.5
        k = 0
        x = 0.0
        while x < meter - 1e-9:
            acc = 1.0 if abs(x - round(x)) < 1e-9 else (0.6 if abs((x % 1) - 0.5) < 1e-9 else 0.45)
            ev.append((s + x, hat_kind, v * 0.7 * acc * (1 + rng.normal(0, 0.06)), True))
            x += step
            k += 1
        for bt in snare_beats:
            ev.append((s + bt, 'snare', v * (1 + rng.normal(0, 0.05)), True))
        for bt in kick_pat:
            ev.append((s + bt, 'kick_hard', v * 0.9, True))
    return ev


# ----------------------------------------------------------------------------- piano
def ballad_piano(chords, rng, melody_evs=None, v: float = 0.45, lo: int = 53, hi: int = 60,
                 restrike: float = 0.45, roll_beats: float = 0.03, lh_low: int = 36,
                 fills: bool = True, total_beats: float | None = None, wide_lh: float = 0.4):
    """Sustained two-handed ballad comping with legato pedalling.
    Returns (events, pedal) in beats."""
    rh = voice_chords(chords, lo=lo, hi=hi, melody_evs=melody_evs)
    ev = []
    pedal = []
    for i, c in enumerate(chords):
        b = c.t
        held = melody_evs is not None and any(e.m >= 0 and e.b < b - 0.05 and e.b + e.d > b - 0.55 for e in melody_evs)
        anticip = rng.random() < 0.18 and i > 0 and not held
        bb = b - 0.5 if anticip else b
        lh = shell(c, lh_low, wide=rng.random() < wide_lh)
        for k, m in enumerate(lh):
            ev.append(Ev(b + k * 0.01, c.d, m, v * 1.05 * (1 if k == 0 else 0.85), '', True))
        for k, m in enumerate(sorted(rh[i])):
            ev.append(Ev(bb + 0.02 + k * roll_beats, c.d - (bb - b), m, v * (0.85 + 0.1 * k / 3), '', anticip is False))
        pedal.append((b + 0.12, b + c.d - 0.03))
        if c.d >= 4 and rng.random() < restrike:
            rb = b + float(rng.choice([2.0, 2.5, 3.0]))
            busy = melody_evs and any(abs(e.b - rb) < 0.3 for e in melody_evs)
            if not busy:
                top = sorted(rh[i])[1:]
                for k, m in enumerate(top):
                    ev.append(Ev(rb + k * roll_beats * 0.7, b + c.d - rb, m, v * 0.7))
        if fills and melody_evs is not None:
            # melody rests inside this chord → a small answering fill
            end = c.t + c.d
            sounding = [e for e in melody_evs if e.m >= 0 and e.b < end and e.b + e.d > c.t]
            covered = 0.0
            for e in sounding:
                covered += min(e.b + e.d, end) - max(e.b, c.t)
            if c.d - covered >= 1.5 and rng.random() < 0.6:
                last_end = max([e.b + e.d for e in sounding if e.b + e.d <= end] or [c.t])
                fb = max(last_end + 0.5, c.t + 0.5)
                fb = float(np.ceil(fb * 2) / 2)
                if end - fb >= 1.0:
                    scale = sorted(m for m in range(67, 86) if m % 12 in c.scale())
                    tones = [m for m in scale if m % 12 in c.pcs()]
                    start = int(rng.choice(tones[len(tones) // 2:])) if tones else scale[-1]
                    nfill = int(min(4, (end - fb) / 0.5))
                    m = start
                    for k in range(nfill):
                        # pedal holds the fill until the chord ends
                        ev.append(Ev(fb + k * 0.5, end - (fb + k * 0.5), m, v * 0.75 * (1 - 0.08 * k)))
                        idx = scale.index(m) if m in scale else 0
                        m = scale[max(0, idx - int(rng.choice([1, 1, 2])))]
    return ev, pedal


def swing_comp(chords, bars: int, rng, melody_evs=None, v: float = 0.5, lo: int = 50, hi: int = 58,
               density: float = 1.0, start: float = 0.0, meter: int = 4, with_lh: bool = False,
               below_melody: bool = True):
    """Medium-swing comping hits with rootless voicings; notes that would form a m2/m9
    against the melody sounding during the hit are left out."""
    vo = voice_chords(chords, lo=lo, hi=hi, melody_evs=melody_evs, below_melody=below_melody)
    hits = comp_rhythm(chords, bars, rng, meter, start, density, melody_evs)
    ev = []
    for (b, d, ci) in hits:
        acc = 1.15 if (b % 1) > 0.25 else 1.0
        notes = sorted(vo[ci])
        if melody_evs:
            mel = [e.m for e in melody_evs if e.m >= 0 and e.b < b + d and e.b + e.d > b + 0.05]
            keep = [m for m in notes if not any(abs(mm - m) % 12 in (1, 11) and abs(mm - m) in (1, 11, 13) for mm in mel)]
            if len(keep) < 2:
                continue
            notes = keep
        for k, m in enumerate(notes):
            ev.append(Ev(b, d, m, v * acc * (0.9 + 0.05 * k)))
        if with_lh:
            c = chords[ci]
            ev.append(Ev(b, d, shell(c, 40)[0], v * 0.8))
    return ev


def pad_chords(chords, lo: int = 55, hi: int = 63, v: float = 0.5, legato: float = 1.0, melody_evs=None):
    vo = voice_chords(chords, lo=lo, hi=hi, melody_evs=melody_evs)
    ev = []
    for c, notes in zip(chords, vo):
        for m in notes:
            ev.append(Ev(c.t, c.d * legato, m, v, '', True))
    return ev


def drop_clashes(evs, melody_evs, min_overlap: float = 0.2):
    """Remove accompaniment notes that would form a m2/m9 with a sounding melody note."""
    out = []
    for e in evs:
        bad = False
        for m in melody_evs:
            if m.m < 0:
                continue
            ov = min(e.b + e.d, m.b + m.d) - max(e.b, m.b)
            if ov >= min_overlap and abs(m.m - e.m) in (1, 13):
                bad = True
                break
        if not bad:
            out.append(e)
    return out
