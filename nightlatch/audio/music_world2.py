"""Mood music II: harbor, halcyon, bureau, sorrow, revelation, finale."""
from __future__ import annotations

import math

import numpy as np

from synth import rng, ns, filt, pan_gains, mix_at, SR
from harmony import (melody, check_melody, Ev, chord_at, two_feel_bass, walking_bass, voice_chords,
                     chorale, nm, transpose_evs)
from instruments import Piano, UprightBass, Mallet, Wind, StringSection, ReedOrgan, bell
from sequencer import Song
import grooves as G

WARN = []


def _check(evs, chords, name):
    WARN.extend(check_melody(evs, chords, name))


# ============================================================================ HARBOR
def _buoy_part(times_beats, seed='buoy', f=440.0, pan=0.55, level=0.35):
    def render(song, n_buf, part):
        out = np.zeros((2, n_buf))
        r = rng(seed)
        for k, b in enumerate(times_beats):
            v = 0.45 + 0.4 * r.random()
            y = bell(f * (1 + r.normal(0, 0.001)), 'buoy', v, seed=k % 5, length=6.0)
            y = filt(y, [('blp', 2600, 2), ('bhp', 200, 2)], tail=0.05)
            t = song.sec(b) + song.pre
            gl, gr = pan_gains(pan)
            mix_at(out[0], y, ns(t), level * v * gl * 1.41)
            mix_at(out[1], y, ns(t), level * v * gr * 1.41)
            if r.random() < 0.4:  # clapper bounces back
                t2 = t + 0.28 + 0.1 * r.random()
                mix_at(out[0], y, ns(t2), 0.4 * level * v * gl * 1.41)
                mix_at(out[1], y, ns(t2), 0.4 * level * v * gr * 1.41)
        return out
    return render


def harbor() -> Song:
    """Foggy waterfront: rubato (periodic tempo map), bass clarinet over a bowed drone and
    low strings; a buoy bell tolls irregularly in the distance.  D minor."""
    def tempo(b):
        return 60.0 + 3.5 * math.sin(2 * math.pi * 3 * b / 88.0) + 2.0 * math.sin(2 * math.pi * 7 * b / 88.0 + 1.0)
    s = Song('harbor', bpm=60, bars=22, swing=0.5, tempo=tempo, seed=71)
    ch = s.chords("""
        Dmadd9 | Dmadd9 | Bbmaj7#11 | Bbmaj7#11 | Gm6 | Gm6:2 Dmadd9/A:2 | A7sus4 | A7b9 |
        Dm9 | Dm9 | Ebmaj7#11 | Ebmaj7#11 | Gm9 | Gm9 | Em7b5 | A7b9 |
        Dmadd9 | Dmadd9 | Bbmaj7#11 | Bbmaj7#11 | A7sus4 | A7b9
    """)
    bcl = melody("""
        r:4 | r:4 | r:3 A2:1@.5 | D3:3@.56 F3:1@.54 | E3:4@.56 | Bb2:2@.52 A2:2@.5 |
        r:2 E3:1@.52 D3:1@.5 | C#3:3@.54!vib r:1 | r:1 F3:1@.56 A3:1@.58 C4:1@.6 | E4:3@.62!vib D4:1@.58 |
        Bb3:2@.58 G3:2@.55 | A3:4@.58!vib | Bb3:2@.56 A3:1@.54 G3:1@.52 | D3:4@.52 |
        G3:2@.55 Bb3:2@.56 | C#3:2@.54 Bb2:2@.5 | A2:4@.5 | r:2 D3:1@.5 F3:1@.52 |
        E3:3@.54 D3:1@.5 | r:4 | r:4 | r:4
    """, start=0)
    _check(bcl, ch, 'harbor/bcl')
    pad = []
    vo = voice_chords(ch, lo=46, hi=52, melody_evs=bcl, below_melody=False)
    for c, notes in zip(ch, vo):
        for m in notes:
            pad.append(Ev(c.t, c.d, m, 0.42, 'swell', True))
    drone = [Ev(c.t, c.d, 28 + ((c.bass - 28) % 12), 0.5, 'swell', True) for c in ch]
    buoy_times = [3, 10.5, 17, 25.5, 33, 41.5, 47, 55.5, 63, 70.5, 79, 85.5]
    s.bus('fog', 'harbor', -3.0)
    s.bus('hall', 'hall', -6.0)
    s.add('bass_clarinet', Wind('bass_clarinet', 'bcl_harbor'), bcl, gain_db=0.0, pan=-0.1, width=0.3,
          swing=False, feel_ms=30, jitter_ms=25, drift_ms=30, sends={'fog': -6, 'hall': -12},
          eq=[('hp', 50, 0.7), ('hs', 4000, 0.7, -2)])
    s.add('strings', StringSection('cellos', 'vc_harbor', sul_tasto=True), pad, gain_db=-7.0, pan=0.25,
          swing=False, sends={'fog': -4})
    s.add('drone', StringSection('basses', 'cb_harbor'), drone, gain_db=-5.0, pan=0.05, swing=False,
          sends={'fog': -8})
    s.add('buoy', _buoy_part(buoy_times), [], gain_db=-3.0, sends={'fog': 0})
    s.master_opts.update(target_rms_db=-21.5, eq=[('hs', 6000, 0.7, -3.0)], glue=0.6)
    return s


# ============================================================================ HALCYON
def halcyon() -> Song:
    """Halcyon House: a slightly detuned music-box/celesta waltz over a soft reed-organ pad,
    E minor, 84 BPM in 3/4 — with a periodic drag as if the spring were running down."""
    def tempo(b):
        return 84.0 - 7.0 * math.exp(-((b - 68.0) / 5.5) ** 2)
    s = Song('halcyon', bpm=84, bars=32, meter=3, swing=0.5, tempo=tempo, seed=81)
    ch = s.chords("""
        Em | EmMaj7 | Am6 | B7 | Em | Cmaj7#11 | F#m7b5 | B7 |
        Em | EmMaj7 | Am6 | D9 | Gmaj7 | Cmaj7#11 | F#m7b5 | B7 |
        Am6 | B7b9 | Em | C7 | Fmaj7 | B7b9 | Em | EmMaj7 |
        Em | EmMaj7 | Am6 | B7 | Em | Cmaj7#11 | F#m7b5 | B7b9
    """)
    mel = melody("""
        E5:2@.6 G5:1@.56 | F#5:3@.58 | C5:2@.56 B4:1@.52 | A4:2@.54 F#4:1@.5 |
        G4:1@.5 B4:1@.54 E5:1@.58 | G5:2@.6 F#5:1@.56 | E5:2@.56 C5:1@.52 | D#5:2@.56 B4:1@.5 |
        E5:2@.6 G5:1@.56 | F#5:2@.58 D#5:1@.54 | C5:2@.56 B4:1@.52 | A4:3@.52 |
        B4:1@.52 D5:1@.54 F#5:1@.58 | E5:2@.56 F#5:1@.56 | A5:2@.6 C5:1@.52 | B4:3@.52 |
        C5:2@.54 E5:1@.56 | D#5:2@.56 C5:1@.54 | B4:3@.52 | Bb4:2@.52 G4:1@.5 |
        A4:2@.52 C5:1@.54 | C5:2@.56 B4:1@.5 | G4:3@.5 | F#4:2@.5 B4:1@.52 |
        E5:2@.6 G5:1@.56 | F#5:3@.58 | C6:2@.6 B5:1@.56 | A5:3@.56 |
        G5:2@.58 E5:1@.54 | F#5:2@.56 E5:1@.54 | C5:2@.54 A4:1@.5 | D#5:2@.54 B4:1@.52
    """, start=0, meter=3)
    _check(mel, ch, 'halcyon/melody')
    acc = []
    for c in ch:
        root = 40 + ((c.root - 40) % 12)
        third = 52 + ((c.third() - 52) % 12)
        fifth = 52 + ((c.fifth() - 52) % 12)
        acc.append(Ev(c.t, 0.9, root, 0.46, '', True))
        for bt in (1, 2):
            acc.append(Ev(c.t + bt, 0.8, third, 0.32, '', True))
            acc.append(Ev(c.t + bt, 0.8, fifth, 0.3, '', True))
    cel = [Ev(e.b, e.d, e.m, e.v * 0.7, '', True) for e in mel if 24 <= e.b < 48 or 72 <= e.b < 96]
    organ = []
    vo = voice_chords(ch, lo=50, hi=57, melody_evs=mel)
    for c, notes in zip(ch, vo):
        for m in notes[:3]:
            organ.append(Ev(c.t, c.d, m, 0.42, '', True))
    r = rng('mbox-detune')
    det = {m: float(r.normal(0, 13.0)) for m in range(40, 100)}
    s.bus('hall', 'corridor', -5.0)
    s.add('musicbox', Mallet('musicbox', 'mbox_halcyon', detune_cents=lambda m: det[m] + 14.0, wobble=9.0,
                             spread=0.3), mel + acc, gain_db=-1.0, pan=0.1, swing=False, jitter_ms=5, drift_ms=4,
          sends={'hall': -6})
    s.add('celesta', Mallet('celesta', 'cel_halcyon', detune_cents=lambda m: -det[m] * 0.5), cel, gain_db=-4.0,
          pan=-0.3, swing=False, feel_ms=25, jitter_ms=8, sends={'hall': -4})
    s.add('organ', ReedOrgan('organ_halcyon', detune_cents=5.0, bright=0.55, bellows=0.08, global_cents=-9.0),
          organ, gain_db=-9.0, pan=-0.1, swing=False, sends={'hall': -6})
    s.master_opts.update(target_rms_db=-21.0, eq=[('hs', 9000, 0.7, -2.0), ('bhp', 60, 2)], glue=0.6)
    return s


# ============================================================================ BUREAU
def bureau() -> Song:
    """Police / commission / newspaper: nervous straight-eighths, staccato piano ostinato,
    bass riff, Harmon-trumpet stabs of the motif, ticking 16th hi-hat.  G minor, 100 BPM."""
    s = Song('bureau', bpm=100, bars=32, swing=0.5, seed=91)
    r = rng('bureau-gen')
    A = "Gm9 | Gm9 | Ebmaj7#11 | D7b9 | Gm9 | Gm9 | Cm9 | D7alt |"
    B = "Cm9 | F13 | Bbmaj9 | Ebmaj7#11 | Am7b5 | D7b9 | Gm9 | D7alt |"
    A3 = "Gm9 | Gm9 | Ebmaj7#11 | D7b9 | Gm9 | Ebmaj7#11 | Am7b5 | D7alt |"
    ch = s.chords(A + A + B + A3)
    stabA = """
        r:4 | r:1 D5:.5@.7!accent G5:.5@.66 Bb5:.5@.7 A5:1@.72 r:.5 | Eb5:.5@.7!accent D5:1@.66 r:2.5 |
        r:2.5 Eb5:.5@.66 F#5:1@.7 | r:4 | r:4 | r:2 G5:.5@.68 F5:.5@.64 Eb5:1@.66 | F#5:.5@.7 F5:.5@.66 r:3 |"""
    stabB = """
        r:1 G5:.5@.7!accent C6:.5@.72 Eb6:.5@.74 D6:1@.74 r:.5 | Ab5:.5@.72!accent G5:1@.68 r:2.5 |
        r:4 | r:2.5 D6:.5@.7 C6:.5@.68 B5:.5@.66 | r:2 C6:.5@.7 B5:.5@.66 A5:1@.66 | F#5:.5@.7 Eb5:.5@.68 r:3 |
        r:4 | r:4 |"""
    tpt = melody(stabA + stabA + stabB + stabA, start=0)
    _check(tpt, ch, 'bureau/tpt')
    vo = voice_chords(ch, lo=55, hi=62, melody_evs=tpt, below_melody=False)
    pno = []
    pats = [[0, 1, 1.5, 2.5, 3.5], [0, 0.5, 1.5, 2, 3], [0.5, 1.5, 2.5, 3, 3.5], [0, 1.5, 2, 3.5]]
    for i, c in enumerate(ch):
        pat = pats[(i + (i // 8)) % len(pats)]
        for k, x in enumerate(pat):
            acc = 1.12 if (x % 1) > 0.25 else 1.0
            for m in sorted(vo[i]):
                pno.append(Ev(c.t + x, 0.22, m, 0.5 * acc, '', True))
    # telegraph-like high single notes in the B section
    for i, c in enumerate(ch):
        if 64 <= c.t < 96:
            top = 84 + ((c.root + 7 - 84) % 12)
            for x in (0.25, 0.5, 1.75, 2.25, 3.25):
                pno.append(Ev(c.t + x, 0.12, top, 0.4, '', True))
    bass = []
    for c in ch:
        R = 31 + ((c.root - 31) % 12)
        nxt = chord_at(ch, (c.t + c.d) % 128 + 0.01)
        tgt = 31 + ((nxt.root - 31) % 12)
        third = R + ((c.third() - c.root) % 12)
        fifth = R + ((c.fifth() - c.root) % 12)
        for x, m, v in [(0, R, 0.7), (0.5, R, 0.5), (1.5, third, 0.6), (2, fifth, 0.62), (3, R + 12, 0.58),
                        (3.5, tgt + (1 if r.random() < 0.5 else -1), 0.55)]:
            bass.append(Ev(c.t + x, 0.42, m, v, '', True))
    kit = []
    for bar in range(32):
        b0 = bar * 4
        for k in range(16):
            x = k * 0.25
            v = 0.55 if k % 4 == 0 else (0.42 if k % 2 == 0 else 0.3)
            if k % 2 == 1 and r.random() < 0.35:
                continue
            kit.append((b0 + x, 'hat', v * (1 + r.normal(0, 0.06)), True))
        kit += [(b0, 'kick', 0.45, True), (b0 + 2.5, 'kick', 0.35, True), (b0 + 1, 'rim', 0.45, True),
                (b0 + 3, 'rim', 0.5, True)]
        if bar % 2 == 1:
            kit.append((b0 + 3.5, 'ohat', 0.28, True))
        if bar % 8 == 7:
            kit += [(b0 + 3 + k * 0.25, 'snare', 0.32 + 0.06 * k, True) for k in range(4)]
    s.bus('room', 'tile', -6.0)
    s.add('trumpet', Wind('trumpet_harmon', 'tpt_bureau', att=0.012, rel=0.06), tpt, gain_db=-1.0, pan=0.4,
          swing=False, jitter_ms=5, drift_ms=4, sends={'room': -10}, eq=[('hp', 300, 0.7)])
    s.add('piano', Piano('bureau_pno', bright=1.0, spread=0.9), pno, gain_db=-10.0, swing=False, jitter_ms=5,
          sends={'room': -14}, eq=[('hs', 6000, 0.7, -2.0)])
    s.add('bass', UprightBass('bureau_bass', sustain=0.7), bass, gain_db=-6.0, pan=-0.05, swing=False,
          jitter_ms=4, sends={'room': -18}, eq=[('pk', 100, 1.0, 2.0), ('pk', 1300, 1.4, 2.0), ('blp', 5000, 2)])
    s.add('drums', 'drums', kit, gain_db=1.0, swing=False, jitter_ms=3, drift_ms=2, sends={'room': -14})
    s.master_opts.update(target_rms_db=-20.0, glue=1.0, eq=[('ls', 70, 0.7, -2.5)])
    return s


# ============================================================================ SORROW
def sorrow() -> Song:
    """Mission / cemetery: a hymn in F minor turning to Ab major — clarinet carries the
    melody (the motif in long notes), strings sing a four-part chorale, piano underneath."""
    s = Song('sorrow', bpm=63, bars=24, swing=0.5, seed=101)
    ch = s.chords("""
        Fm/C:2 Fm:2 | Fm:2 C7/E:2 | Bbm/Db:2 C7:2 | Fm |
        Fm:2 Bbm:2 | Ab:2 Bbm:1 Ab/C:1 | Bbm:2 Fm/Ab:2 | C:2 C7:2 |
        Ab:2 Ab/C:2 | Ab:2 Eb/G:2 | Ab/Eb:2 Db:1 Ab/C:1 | Eb:2 Eb7:2 |
        Ab:2 Db:2 | Ab/C:2 Db:1 Ab/Eb:1 | Bbm7:2 Eb7:2 | Ab |
        Fm:2 Fm/Eb:2 | Db:2 Fm/C:2 | Bbm:2 C7/G:1 Fm/Ab:1 | C |
        Fm:2 Ab/Eb:2 | Db:2 Bbm:1 C7:1 | Fm/C:2 C7:2 | Fm:2 C:2
    """)
    sop = melody("""
        C5:2@.55 F5:2@.58 | Ab5:2@.6 G5:2@.56 | Db5:2@.55 C5:2@.52 | F5:4@.55 |
        Ab5:2@.58 Bb5:2@.6 | C6:2@.64 Db6:1@.66 C6:1@.62 | Bb5:2@.6 Ab5:2@.58 | G5:4@.55 |
        Eb5:2@.56 Ab5:2@.6 | C6:2@.64 Bb5:2@.6 | Eb6:2@.68 Db6:1@.66 C6:1@.62 | Bb5:4@.6 |
        C6:2@.64 Db6:2@.66 | Eb6:2@.7 F6:1@.72 Eb6:1@.68 | Db6:2@.64 Bb5:2@.6 | Ab5:4@.58 |
        F5:2@.6 Ab5:2@.62 | Db6:2@.68 C6:2@.64 | Bb5:1@.62 Ab5:1@.6 G5:1@.58 F5:1@.56 | E5:4@.56 |
        F5:2@.56 C6:2@.62 | Db6:2@.64 Bb5:1@.6 G5:1@.56 | Ab5:2@.56 G5:2@.54 | F5:2@.52 E5:2@.5
    """, start=0)
    _check(sop, ch, 'sorrow/soprano')
    sop_at = [next(e.m for e in sop if e.b <= c.t + 1e-6 < e.b + e.d) for c in ch]
    satb = chorale(ch, sop_at, ranges=((60, 92), (53, 86), (45, 75), (33, 56)))
    alto, tenor, bassv = [], [], []
    for c, (S_, A_, T_, B_) in zip(ch, satb):
        alto.append(Ev(c.t, c.d, A_, 0.5, '', True))
        tenor.append(Ev(c.t, c.d, T_, 0.48, '', True))
        bassv.append(Ev(c.t, c.d, B_, 0.52, '', True))
    clar = [e for e in sop if e.b < 32 or e.b >= 64]
    vln = [Ev(e.b, e.d, e.m, e.v * 0.9, '', True) for e in sop if e.b >= 32]
    # piano: quiet broken chorale (bass + inner voices), pedal per chord
    pno = []
    ped = []
    for c, (S_, A_, T_, B_) in zip(ch, satb):
        pno.append(Ev(c.t, c.d, B_ - 12 if B_ - 12 >= 29 else B_, 0.4, '', True))
        steps = int(c.d)
        seq = [T_, A_, T_, A_]
        for k in range(steps):
            st = c.t + k + (0.5 if k == 0 else 0.0)
            pno.append(Ev(st, c.t + c.d - st - 0.02, seq[k % 4], 0.3, '', True))
        ped.append((c.t + 0.08, c.t + c.d - 0.03))
    s.bus('church', 'church', -4.0)
    s.add('clarinet', Wind('clarinet', 'cl_sorrow'), clar, gain_db=-1.0, pan=-0.12, width=0.25, swing=False,
          feel_ms=25, jitter_ms=14, drift_ms=18, sends={'church': -9}, eq=[('hs', 5000, 0.7, -2)])
    s.add('violins', StringSection('violins', 'vln_sorrow'), vln, gain_db=-4.0, pan=-0.35, swing=False,
          jitter_ms=10, sends={'church': -6})
    s.add('violas', StringSection('violas', 'vla_sorrow', sul_tasto=True), alto + tenor, gain_db=-7.0, pan=0.15,
          swing=False, jitter_ms=10, sends={'church': -6})
    s.add('cellos', StringSection('cellos', 'vc_sorrow'), bassv, gain_db=-6.0, pan=0.35, swing=False,
          jitter_ms=10, sends={'church': -7})
    s.add('piano', Piano('sorrow_pno', bright=0.8), pno, gain_db=-11.0, pedal=ped, swing=False, jitter_ms=10,
          sends={'church': -8}, eq=[('hs', 4000, 0.7, -3)])
    s.master_opts.update(target_rms_db=-21.0, glue=0.6)
    return s


# ============================================================================ REVELATION
def revelation() -> Song:
    """Big-reveal bed: tremolo strings over a C pedal (Cm → Abmaj7#11 → Dm7b5 → Db → G7b9),
    timpani rolls, low brass swells, the motif in the horns.  12 bars at 72, loops."""
    s = Song('revelation', bpm=72, bars=12, swing=0.5, seed=111)
    ch = s.chords("""Cm | Cm | Cm | Cm | Abmaj7#11/C | Abmaj7#11/C | Dm7b5/C | Dm7b5/C |
                     Db/C | Db/C | G7b9/C | G7b9/C""")
    vln = []
    vla = []
    vc = []
    for (b0, d, vl, va, vcn) in [(0, 16, [79, 80], [60, 63, 67], [48, 55]),
                                 (16, 8, [72, 79], [56, 60], [48, 56]),
                                 (24, 8, [77, 80], [62, 65], [48, 53]),
                                 (32, 8, [77, 80], [61, 65], [48, 56]),
                                 (40, 8, [71, 77, 80], [62, 67], [48, 55])]:
        vln += [Ev(b0, d, m, 0.55, 'trem swell', True) for m in vl]
        vla += [Ev(b0, d, m, 0.5, 'trem', True) for m in va]
        vc += [Ev(b0, d, m, 0.5, 'swell', True) for m in vcn]
    cb = [Ev(0, 48, 36, 0.55, '', True)]
    horn = melody("""r:4 | r:4 | r:4 | r:3 G3:1@.6 | C4:3@.66 Eb4:1@.68 | D4:4@.7 | Ab3:3@.66 G3:1@.6 | G3:4@.55 |
                     r:4 | r:4 | r:4 | r:4""", start=0)
    _check(horn, ch, 'revelation/horn')
    brass = {'tbn1': [Ev(16, 8, 44, 0.6, 'swell', True), Ev(32, 8, 49, 0.7, 'swell', True), Ev(40, 8, 43, 0.75, 'swell', True)],
             'tbn2': [Ev(16, 8, 51, 0.55, 'swell', True), Ev(32, 8, 56, 0.65, 'swell', True), Ev(40, 8, 53, 0.7, 'swell', True)],
             'tuba': [Ev(16, 8, 24, 0.55, 'swell', True), Ev(32, 8, 25, 0.62, 'swell', True), Ev(40, 8, 31, 0.68, 'swell', True)]}
    from drums import timpani_roll
    perc = []
    for (b0, d, m, v0, v1) in [(8, 8, 36, 0.12, 0.55), (28, 4, 31, 0.15, 0.6), (40, 8, 36, 0.1, 0.62)]:
        for (t, k, v, p) in timpani_roll(0.0, s.sec(b0 + d) - s.sec(b0), m, v0, v1, rate=16.0, seed=b0):
            perc.append((b0 + t / s.sec(1.0), k, v, True))
    perc += [(16, 'timp:36', 0.6, True), (32, 'timp:31', 0.62, True), (0, 'timp:36', 0.66, True)]
    s.bus('hall', 'hall', -3.0)
    s.add('violins', StringSection('violins', 'vln_rev'), vln, gain_db=-6.0, pan=-0.35, swing=False, sends={'hall': -6})
    s.add('violas', StringSection('violas', 'vla_rev'), vla, gain_db=-8.0, pan=0.1, swing=False, sends={'hall': -6})
    s.add('cellos', StringSection('cellos', 'vc_rev'), vc, gain_db=-7.0, pan=0.35, swing=False, sends={'hall': -7})
    s.add('basses', StringSection('basses', 'cb_rev'), cb, gain_db=-8.0, pan=0.15, swing=False, sends={'hall': -8})
    s.add('horn', Wind('horn', 'horn_rev'), horn, gain_db=-3.0, pan=-0.15, swing=False, feel_ms=20, jitter_ms=10,
          sends={'hall': -4})
    for k, (nm_, ev) in enumerate(brass.items()):
        kind = 'tuba' if nm_ == 'tuba' else 'trombone'
        s.add(nm_, Wind(kind, 'rev_' + nm_), ev, gain_db=-8.0, pan=0.2 + 0.1 * k, swing=False, jitter_ms=10,
              sends={'hall': -5})
    s.add('timpani', 'drums', perc, gain_db=-5.0, swing=False, jitter_ms=3, sends={'hall': -8}, opts=dict(vel_range_db=30))
    s.master_opts.update(target_rms_db=-21.0, glue=0.8)
    return s


# ============================================================================ FINALE
def finale() -> Song:
    """Broadcast climax: driving 140 BPM in C minor — bass and string ostinati, brass
    section stating the motif, building through Eb to a triumphant bVI-bVII-i statement."""
    s = Song('finale', bpm=140, bars=52, swing=0.5, seed=121)
    r = rng('finale-gen')
    ch = s.chords("""
        Cm | Cm | Cm | Cm |
        Cm | Cm | Abmaj7 | Abmaj7 | Fm9 | Fm9 | G7b9 | G7alt |
        Cm | Cm | Abmaj7 | Abmaj7 | Fm9 | Dm7b5 | G7sus4 | G7b9 |
        Fm9 | Fm9 | Bb7#9 | Bb7#9 | Ebmaj9 | Ebmaj9 | Abmaj7#11 | Abmaj7#11 |
        Dm7b5 | Dm7b5 | G7b9 | G7b9 | Cm | Cm | Db7#11 | G7alt |
        Ab | Bb | Eb | Eb | Ab | Bb | Cm | Cm | Abmaj7 | Bb | G7sus4 | G7 | Cm | Cm | Db | G7alt
    """)
    tbn_motif = melody("""r:3 G3:1@.75 | C4:3@.8 Eb4:1@.82 | D4:4@.82 | Ab3:3@.8 G3:1@.75 | G3:4@.7 |""", start=12)
    tpt_motif = melody("""r:3 G4:1@.8 | C5:3@.85 Eb5:1@.86 | D5:4@.86 | Ab4:3@.84 G4:1@.8 | G4:4@.75 |""", start=44)
    horn_frag = melody("""r:3.5 C4:.5@.7 | F4:3@.74 Ab4:1@.76 | G4:4@.76 | Db4:3@.72 C4:1@.7 | C4:4@.66 |""", start=76)
    tpt_tri = melody("""
        r:3 G4:1@.85 | C5:3@.9 Eb5:1@.9 | D5:4@.9 | Bb4:2@.88 G4:2@.85 | Eb5:4@.9 |
        C5:3@.9 Eb5:1@.92 | F5:4@.94 | G5:3@.96 Eb5:1@.92 | C5:4@.9 | Ab5:2@.95 G5:2@.92 | F5:2@.9 D5:2@.88 |
        C5:4@.9 | B4:4@.88 | C5:4@.92 | r:4 | r:4 | r:4""", start=140)
    _check(tbn_motif + tpt_motif + horn_frag + tpt_tri, ch, 'finale/brass')
    # trumpet section stabs in the answers (bars 9-12, 17-20, 21-36 sparse)
    vo = voice_chords(ch, lo=62, hi=68)
    stabs = []
    for i, c in enumerate(ch):
        bar = int(c.t // 4)
        if bar in (8, 9, 10, 11, 16, 17, 18) or (20 <= bar < 35 and bar % 2 == 1):
            for x, d, v in [(1.5, 0.4, 0.75), (2.5, 0.35, 0.7), (3.5, 0.9, 0.85)]:
                if r.random() < 0.85:
                    src = vo[i + 1] if (x == 3.5 and i + 1 < len(vo)) else vo[i]
                    for m in sorted(src)[-3:]:
                        stabs.append(Ev(c.t + x, d, m, v, 'accent' if x == 3.5 else '', True))
    # trombone pads under the triumphant section
    pads = []
    vo2 = voice_chords(ch, lo=46, hi=53)
    for i, c in enumerate(ch):
        if c.t >= 144:
            for m in sorted(vo2[i])[:3]:
                pads.append(Ev(c.t, c.d * 0.95, m, 0.65, 'swell', True))
    # strings: 8th ostinato (violas), high tremolo violins in the climax
    vla = []
    for i, c in enumerate(ch):
        fifth = 55 + ((c.fifth() - 55) % 12)
        up = fifth + 1 if c.fam in ('min', 'hdim') else fifth + 2
        root_up = fifth + ((c.root - fifth) % 12)
        for k in range(8):
            m = fifth if k % 2 == 0 else root_up
            vla.append(Ev(c.t + 0.5 * k, 0.4, m, 0.55 + (0.08 if k % 4 == 0 else 0), 'marc', True))
    vln = []
    for i, c in enumerate(ch):
        if c.t >= 80:
            top = sorted(vo[i])[-2:]
            for m in top:
                vln.append(Ev(c.t, c.d, m + 12, 0.55 if c.t < 144 else 0.7, 'trem', True))
    # bass ostinato
    bass = []
    for c in ch:
        R = 28 + ((c.root - 28) % 12)
        third = R + ((c.third() - c.root) % 12)
        fifth = R + ((c.fifth() - c.root) % 12)
        for k, m in enumerate([R, R, R + 12, R, fifth, R, third, fifth]):
            bass.append(Ev(c.t + 0.5 * k, 0.42, m, 0.72 if k % 2 == 0 else 0.6, '', True))
    # drums
    kit = []
    for bar in range(52):
        b0 = bar * 4
        if bar < 4:
            kit += [(b0 + x, 'tom_lo' if x in (0, 2) else 'tom_mid', 0.55 + 0.1 * (x == 0), True) for x in (0, 1, 2, 3)]
            kit += [(b0 + x + 0.5, 'tom_hi', 0.35, True) for x in (0, 1, 2, 3)]
            continue
        hat = 'hat' if bar < 36 else 'ride'
        for k in range(8):
            kit.append((b0 + 0.5 * k, hat, (0.5 if k % 2 == 0 else 0.36) * (1 + r.normal(0, 0.05)), True))
        kit += [(b0 + 1, 'snare', 0.7, True), (b0 + 3, 'snare', 0.72, True), (b0, 'kick_hard', 0.7, True),
                (b0 + 2, 'kick_hard', 0.62, True)]
        if bar >= 36:
            kit += [(b0 + 1, 'kick_hard', 0.5, True), (b0 + 3, 'kick_hard', 0.5, True)]
        if r.random() < 0.4:
            kit.append((b0 + 2.5, 'snare', 0.3, True))
        if bar % 4 == 3:
            kit += [(b0 + 3 + 0.25 * k, 'snare' if k < 2 else 'tom_mid', 0.45 + 0.08 * k, True) for k in range(4)]
    for bar in (4, 12, 20, 36, 40, 44, 48):
        kit.append((bar * 4, 'crash', 0.6, True))
    kit += [(b * 4, 'timp:36', 0.8, True) for b in (4, 12, 36, 42, 48)] + [(b * 4, 'timp:31', 0.75, True) for b in (10, 18, 46)]
    kit += [(32 * 4 + 2 + 0.125 * k, 'snare', 0.25 + 0.025 * k, True) for k in range(16)]
    leads = tbn_motif + tpt_motif + horn_frag + tpt_tri
    stabs = G.drop_clashes(stabs, leads)
    pads = G.drop_clashes(pads, leads)
    vln = G.drop_clashes(vln, leads)
    vla = G.drop_clashes(vla, leads)
    s.bus('hall', 'hall', -5.0)
    s.bus('room', 'studio', -6.0)
    for k, (nm_, kind, ev, g, pan) in enumerate([
            ('tbn_motif', 'trombone', tbn_motif, -2.0, 0.2), ('tpt_motif', 'trumpet_open', tpt_motif, -2.0, -0.2),
            ('horn_frag', 'horn', horn_frag, -2.0, 0.1), ('tpt_tri', 'trumpet_open', tpt_tri, 0.0, -0.15),
            ('tpt_tri2', 'trumpet_open', transpose_evs(tpt_tri, -12), -5.0, 0.15)]):
        s.add(nm_, Wind(kind, 'fin_' + nm_), ev, gain_db=g, pan=pan, width=0.3, swing=False, jitter_ms=6, drift_ms=4,
              sends={'hall': -9})
    s.add('stabs', Wind('trumpet_cup', 'fin_stabs', att=0.012, rel=0.07), stabs, gain_db=-5.0, pan=-0.25, swing=False,
          jitter_ms=5, sends={'hall': -10, 'room': -12})
    s.add('pads', Wind('trombone', 'fin_pads'), pads, gain_db=-7.0, pan=0.3, swing=False, jitter_ms=8, sends={'hall': -6})
    s.add('violas', StringSection('violas', 'vla_fin'), vla, gain_db=-5.0, pan=0.2, swing=False, jitter_ms=4,
          sends={'hall': -10})
    s.add('violins', StringSection('violins', 'vln_fin'), vln, gain_db=-8.0, pan=-0.35, swing=False, sends={'hall': -8})
    s.add('bass', UprightBass('fin_bass', sustain=0.8, bright=1.2), bass, gain_db=-3.0, swing=False, jitter_ms=4,
          sends={'room': -16}, eq=[('pk', 100, 1.0, 2.5), ('pk', 1300, 1.4, 2.0), ('blp', 5000, 2)])
    s.add('drums', 'drums', kit, gain_db=2.0, swing=False, jitter_ms=3, drift_ms=2, sends={'room': -12, 'hall': -16})
    s.master_opts.update(target_rms_db=-19.0, glue=1.3, sat=0.15, eq=[('ls', 70, 0.7, -2.5)])
    return s
