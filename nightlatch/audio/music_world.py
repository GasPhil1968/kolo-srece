"""Location & mood music: locked, office, lantern, lullaby, city."""
from __future__ import annotations

import numpy as np

from synth import rng
from harmony import (melody, check_melody, Ev, chord_at, two_feel_bass, walking_bass, improvise,
                     voice_chords, shell, nm, transpose_evs, shift_evs)
from instruments import Piano, UprightBass, Mallet, Wind, StringSection, ReedOrgan
from sequencer import Song
import grooves as G

WARN = []


def _check(evs, chords, name):
    WARN.extend(check_melody(evs, chords, name))


# ============================================================================ LOCKED
def locked() -> Song:
    """Locked-room tension: ticking woodblock clock, pizzicato '1-5-b6-5' ostinato (the
    latch's fall in miniature), celesta fragments of the motif, low string swells and
    muffled piano clusters.  Straight time, 60 BPM, 20 bars."""
    s = Song('locked', bpm=60, bars=20, swing=0.5, seed=21)
    r = rng('locked-gen')
    ch = s.chords("""
        Cm | Cm | Cm | Cm | Abmaj7/C | Abmaj7/C | Fm/C | Fm/C | Cm | Cm | Abmaj7/C | Abmaj7/C |
        Db | Db | G7b9 | G7b9 | Cm | Cm | Cm | Abmaj7/C
    """)
    # clock: tick-tock every beat, mechanical
    clock = []
    for b in range(80):
        clock.append((b, 'wb_hi' if b % 2 == 0 else 'wb_lo', 0.5 if b % 2 == 0 else 0.42, True))
    # pizzicato ostinato: root, 5, b6, 5
    roots = {0: 36, 1: 36, 2: 36, 3: 36, 4: 36, 5: 36, 6: 36, 7: 36, 8: 36, 9: 36, 10: 36, 11: 36,
             12: 37, 13: 37, 14: 31, 15: 31, 16: 36, 17: 36, 18: 36, 19: 36}
    pizz = []
    for bar in range(20):
        rt = roots[bar]
        b0 = bar * 4
        vv = 0.62 if 4 <= bar < 16 else 0.52
        pizz += [Ev(b0, 0.5, rt, vv), Ev(b0 + 1.5, 0.4, rt + 7, vv * 0.8), Ev(b0 + 2, 0.4, rt + 8, vv * 0.9),
                 Ev(b0 + 3, 0.5, rt + 7, vv * 0.75)]
        if bar in (7, 11, 15) :
            pizz.append(Ev(b0 + 3.5, 0.3, rt + 6, vv * 0.6))
    # celesta: fragments of the motif, high and far
    cel = melody("""
        r:4 | r:4 | r:4 | r:3 G5:1@.5 | C6:1.5@.55 Eb6:.5@.55 D6:2@.5 | r:4 | Ab5:3@.5 G5:1@.45 | r:4 |
        r:4 | r:2 Eb6:1@.45 D6:1@.45 | C6:3@.45 r:1 | r:4 | Ab5:1.5@.5 Db6:.5@.5 F6:2@.5 | r:4 |
        Ab5:2@.5 B5:2@.5 | D6:3@.45 r:1 | r:4 | r:3 G5:1@.4 | C6:1.5@.42 Eb6:.5@.42 D6:2@.42 | Ab5:4@.4
    """, start=0)
    _check(cel, ch, 'locked/celesta')
    # low string swells (cellos + basses), violas add tension in the Db/G section
    vc = []
    bs = []
    for (b0, dur, notes_vc, note_b) in [(0, 16, [48, 55], 36), (16, 8, [44, 51], 36), (24, 8, [41, 48], 36),
                                        (32, 16, [48, 55], 36), (48, 8, [49, 56], 37), (56, 8, [43, 50], 31),
                                        (64, 16, [48, 55], 36)]:
        for m in notes_vc:
            vc.append(Ev(b0, dur, m, 0.5, 'swell', True))
        bs.append(Ev(b0, dur, note_b, 0.5, 'swell', True))
    vla = [Ev(48, 8, 56, 0.42, 'swell', True), Ev(48, 8, 65, 0.4, 'swell', True),
           Ev(56, 8, 55, 0.45, 'swell trem', True), Ev(56, 8, 56, 0.45, 'swell trem', True)]
    # muffled piano clusters on off-beats
    clusters = []
    for bar in range(20):
        if bar % 2 == 1 and r.random() < 0.85:
            b = bar * 4 + float(r.choice([0.5, 1.5, 2.5, 3.5]))
            c = chord_at(ch, b + 0.01)
            base = 48 + ((c.root - 48) % 12)
            for k, iv in enumerate([0, 1, 7] if r.random() < 0.6 else [3, 4, 10]):
                clusters.append(Ev(b + 0.01 * k, 1.2, base + iv, 0.42, '', True))
    # soft heartbeat on the low drum in the tense middle section
    kit = clock
    kit += [(b, 'kick', 0.32, True) for bar in range(8, 16) for b in (bar * 4, bar * 4 + 0.4)]
    s.bus('room', 'corridor', -9.0)
    s.bus('far', 'hall', -6.0)
    s.add('clock', 'drums', kit, gain_db=-3.0, swing=False, jitter_ms=1.0, drift_ms=0, vel_jitter=0.03,
          sends={'room': -14}, opts=dict(pan_scale=1.0))
    s.add('pizz', UprightBass('pizz_locked', sustain=0.45, bright=1.2), pizz, gain_db=-4.5, pan=-0.1,
          swing=False, jitter_ms=4, sends={'room': -12}, eq=[('pk', 110, 1.0, 2.0), ('blp', 4500, 2)])
    s.add('celesta', Mallet('celesta', 'cel_locked'), cel, gain_db=-5.0, pan=0.35, swing=False, jitter_ms=6,
          sends={'far': -2, 'room': -10})
    s.add('cellos', StringSection('cellos', 'vc_locked', sul_tasto=True), vc, gain_db=-10.0, pan=0.25,
          swing=False, sends={'far': -8})
    s.add('basses', StringSection('basses', 'cb_locked'), bs, gain_db=-10.0, pan=0.1, swing=False, sends={'far': -10})
    s.add('violas', StringSection('violas', 'vla_locked', sul_tasto=True), vla, gain_db=-10.0, pan=-0.3,
          swing=False, sends={'far': -6})
    s.add('clusters', Piano('muffled', bright=0.45, decay=0.3, knock=1.6, hammer=1.5), clusters, gain_db=-9.0,
          swing=False, jitter_ms=5, sends={'room': -10}, eq=[('blp', 1800, 2), ('ls', 200, 0.7, 2)])
    s.master_opts.update(target_rms_db=-21.5, glue=0.6, eq=[('ls', 150, 0.7, -2.0), ('hs', 2500, 0.7, 2.0)])
    return s


# ============================================================================ OFFICE
def office() -> Song:
    """Rook's office: solo piano with upright bass, Eb major ballad, 66 BPM.  Kept in the
    middle register so it sits under rain ambience."""
    s = Song('office', bpm=66, bars=24, swing=0.6, seed=31)
    r = rng('office-gen')
    ch = s.chords("""
        Ebmaj9 | Abm6:2 Db9:2 | Gm7:2 C7b9:2 | Fm9 | Bb13 | Gm7:2 C7b9:2 | Fm9:2 Bb7b9:2 | Ebmaj9:2 Bb7sus4:2 |
        Ebmaj9 | Abm6:2 Db9:2 | Gm7:2 C7b9:2 | Fm9 | Bb13 | Gm7:2 C7b9:2 | Fm9:2 Bb7b9:2 | Ebmaj9:2 Eb7:2 |
        Abmaj7 | Abm6:2 Db9:2 | Gm7 | C7b9 | Fm9 | Bb13 | Gm7:2 C7b9:2 | Fm9:2 Bb7b9:2
    """)
    mel = melody("""
        Eb5:1.5@.6 G5:.5@.62 F5:2@.6 | B4:2.5@.56 Bb4:1.5@.52 |
        r:.5 D5:.5@.55 G5:.5@.58 Bb5:.5@.6 Db6:1.5@.62 C6:.5@.58 | Ab5:2.5@.6 G5:.5@.56 F5:1@.55 |
        G5:1.5@.58 F5:.5@.55 D5:2@.55 | Bb4:1@.52 D5:1@.54 E5:1.5@.56 Db5:.5@.52 |
        C5:2@.55 B4:1@.52 Ab4:1@.5 | G4:3@.5 r:.5 Bb4:.5@.52 |
        Eb5:1.5@.6 G5:.5@.62 F5:1@.6 Eb5:.5@.56 F5:.5@.58 | B4:2.5@.56 Bb4:1.5@.52 |
        r:.5 D5:.5@.55 G5:.5@.58 Bb5:.5@.6 Db6:1@.62 C6:1@.58 | Ab5:2@.6 G5:1@.56 F5:1@.55 |
        D5:1.5@.56 C5:.5@.54 Bb4:2@.52 | G4:1@.5 Bb4:1@.52 Db5:1@.54 E5:1@.55 |
        Ab5:2@.58 G5:1@.55 F5:1@.54 | Eb5:2@.55 r:1 Db5:1@.52 |
        C5:1.5@.58 Eb5:.5@.6 G5:2@.62 | B4:1.5@.58 Bb4:.5@.55 Ab4:2@.54 |
        Bb4:1@.55 D5:1@.56 F5:1.5@.58 E5:.5@.55 | E5:2@.58 Db5:1@.55 Bb4:1@.52 |
        Ab4:1.5@.54 C5:.5@.55 Eb5:1@.56 G5:1@.58 | F5:3@.56 r:1 |
        G5:1.5@.56 F5:.5@.54 E5:1@.54 Db5:1@.52 | C5:2@.52 r:1.5 Bb4:.5@.5
    """, start=0)
    _check(mel, ch, 'office/melody')
    comp, ped = G.ballad_piano(ch, r, melody_evs=mel, v=0.36, lo=50, hi=56, restrike=0.3, fills=False,
                               lh_low=36, wide_lh=0.6)
    bass = two_feel_bass(ch, 96, r, start=0, vel=0.55, pickup_prob=0.2)
    s.bus('room', 'room', -5.0)
    s.bus('plate', 'plate', -7.0)
    s.add('melody', Piano('office_pno', bright=0.85), mel, gain_db=-4.0, pedal=ped, feel_ms=18, jitter_ms=12,
          drift_ms=14, sends={'room': -10, 'plate': -16}, eq=[('hs', 5000, 0.7, -3.0)])
    s.add('comp', Piano('office_pno', bright=0.85), comp, gain_db=-8.5, pedal=ped, feel_ms=12, jitter_ms=8,
          sends={'room': -10, 'plate': -18}, eq=[('hs', 5000, 0.7, -3.0), ('ls', 200, 0.7, 1.0)])
    s.add('bass', UprightBass('office_bass', sustain=1.4, bright=0.85), bass, gain_db=-7.0, pan=0.05,
          feel_ms=-3, jitter_ms=8, sends={'room': -14},
          eq=[('pk', 90, 1.0, 2.5), ('pk', 650, 1.2, -2.5), ('blp', 3500, 2)])
    s.master_opts.update(target_rms_db=-20.5, eq=[('hs', 8000, 0.7, -0.5)], glue=0.7)
    return s


# ============================================================================ LANTERN
def lantern() -> Song:
    """The Blue Lantern: medium swing in Bb minor, piano trio + breathy tenor.  Intro vamp,
    32-bar AABA head, 16-bar tenor solo, 4-bar piano send-off.  Diegetic: roomy, lo-fi."""
    s = Song('lantern', bpm=132, bars=56, swing=0.63, seed=41)
    r = rng('lantern-gen')
    A1 = "Bbm9 | Cm7b5 F7b9 | Bbm9 | Fm7b5 Bb7b9 | Ebm9 | Ab13 | Gbmaj7#11 | Cm7b5 F7b9 |"
    A2 = "Bbm9 | Cm7b5 F7b9 | Bbm9 | Fm7b5 Bb7b9 | Ebm9 | Ab13 | Gbmaj7#11 | Fm7b5 Bb7b9 |"
    B = "Ebm9 Ab13 | Dbmaj9 | Ebm9 Ab13 | Dbmaj9 | Dm7 G7b9 | Gbmaj7#11 | Cm7b5 | F7alt |"
    A3 = "Bbm9 | Cm7b5 F7b9 | Bbm9 | Fm7b5 Bb7b9 | Ebm9 | Ab13 | Gbmaj7#11 | Cm7b5 F7b9 |"
    intro = "Bbm9 | Cm7b5 F7b9 | Bbm9 | Cm7b5 F7b9 |"
    ch = s.chords(intro + A1 + A2 + B + A3 + A1 + A2 + intro)
    headA = """
        Bb3:1.5@.66 Db4:.5@.7 C4:2@.68 | Gb3:2@.64 F3:1@.6 r:.5 Ab3:.5@.62 |
        Db4:1@.66 C4:.5@.62 Bb3:.5@.6 Ab3:1@.62 F3:1@.6 | Ab3:1@.62 B3:1@.64 D4:1.5@.66 F4:.5@.66 |
        Gb4:1.5@.72 F4:.5@.68 Eb4:1@.66 Db4:1@.64 | C4:2@.66 F4:1@.68 Eb4:1@.64 |
        Db4:1@.64 F4:.5@.66 Ab4:.5@.7 C5:2@.74!vib |"""
    head = melody("F3:.5 |" + headA + " Bb4:1@.68 Gb4:1@.64 A3:1@.62 r:.5 F3:.5@.6 |", start=15.5, pickup=0.5)
    head += melody(headA + " B4:1@.68 Ab4:1@.64 F4:1@.62 r:1 |", start=48)
    head += melody("""
        Gb4:1@.68 Bb4:1@.7 C5:1@.72 F4:1@.66 | Ab4:1.5@.7 F4:.5@.66 Eb4:2@.66 |
        Db4:.5@.64 Eb4:.5@.66 Gb4:.5@.68 Bb4:.5@.7 C5:1@.72 Bb4:1@.68 | Ab4:3@.68!vib r:1 |
        A4:1@.7 F4:1@.66 B4:1@.7 Ab4:1@.66 | Bb4:2@.7 C5:1@.72 Db5:1@.74 |
        Eb5:1.5@.76 D5:.5@.72 C5:1@.7 Gb4:1@.66 | A4:2@.68!fall r:1.5 F3:.5@.6 |
    """, start=80)
    head += melody(headA + " Bb3:2@.62 r:2 |", start=112)
    _check(head, ch, 'lantern/head')
    solo = improvise(ch, 144, 207.5, rng('lantern-solo'), lo=nm('Bb2'), hi=nm('D5'), center=nm('F3') + 3,
                     density=0.8, vel=0.66,
                     quote=transpose_evs(melody("F3:.5 Bb3:1.5 Db4:.5 C4:1.5", check_bars=False), 12), quote_at=175.5)
    tenor = head + solo
    # piano: comping under the horn, fills + bluesy right hand in the intro/send-off
    comp = G.swing_comp(ch, 56, r, melody_evs=tenor, v=0.5, lo=51, hi=58, density=0.95, below_melody=False)
    fills = melody("""
        r:2.5 F5:.5@.55 Ab5:.5@.58 Bb5:.5@.6 | Eb6:1@.62 D6:.5@.58 C6:.5@.56 A5:1@.55 Gb5:1@.52 |
        r:1 F5:.5@.55 E5:.5@.52 F5:.5@.56 Ab5:.5@.58 C6:.5@.6 Bb5:.5@.56 | Ab5:1.5@.55 r:2.5
    """, start=208)
    fills += melody("""
        r:2.5 Bb5:.5@.5 Db6:.5@.52 F6:.5@.55 | Eb6:1@.55 D6:.5@.52 C6:.5@.5 A5:1@.5 r:1 |
        r:4 | r:2 F5:.5@.5 Ab5:.5@.52 B5:.5@.54 D6:.5@.56
    """, start=0)
    _check(fills, ch, 'lantern/fills')
    bass = walking_bass(ch, 224, r, start=0, vel=0.66, skip_prob=0.14, melody_evs=tenor + fills)
    kit = G.ride_pattern(0, 56, r, v=0.5) + G.chick(0, 56, v=0.45) + G.feather(0, 56, v=0.17) \
        + G.snare_comp(16, 40, r, density=0.32, v=0.3)
    for b in (12, 44, 76, 108, 140, 172, 204, 220):
        kit += G.fill_triplets(b + 3, r, v=0.45)
    kit += [(16, 'crash', 0.4), (144, 'crash', 0.42), (208, 'crash', 0.35)]
    s.bus('club', 'club', -3.0)
    s.add('tenor', Wind('tenor', 'tenor_lantern'), tenor, gain_db=1.0, pan=0.12, width=0.3, feel_ms=16,
          jitter_ms=10, drift_ms=9, sends={'club': -7}, eq=[('hp', 90, 0.7), ('pk', 2500, 1.0, 1.0)])
    s.add('piano', Piano('lantern_pno', bright=1.0, spread=0.5), comp + fills, gain_db=-7.0, feel_ms=8,
          jitter_ms=8, sends={'club': -9})
    s.add('bass', UprightBass('lantern_bass', sustain=1.0), bass, gain_db=-6.0, pan=-0.08, feel_ms=-6, jitter_ms=6,
          sends={'club': -16}, eq=[('pk', 100, 1.0, 2.5), ('pk', 700, 1.2, -2.0), ('pk', 1400, 1.5, 2.0), ('blp', 5000, 2)])
    s.add('drums', 'drums', kit, gain_db=3.0, feel_ms=0, jitter_ms=4, drift_ms=3, sends={'club': -10})
    s.master_opts.update(target_rms_db=-20.0, eq=[('bhp', 90, 2), ('blp', 9000, 2), ('pk', 1200, 0.8, 1.5)],
                         glue=1.4, sat=0.25, width=0.7)
    return s


# ============================================================================ LULLABY
def lullaby() -> Song:
    """'Lullaby of the Lamplighter' — Deacon's waltz for Walter Marsh.  Solo piano, F major,
    3/4.  Its first four notes are the Night Latch motif before it was broken (5-1-3-2)."""
    s = Song('lullaby', bpm=76, bars=20, meter=3, swing=0.56, seed=51)
    r = rng('lullaby-gen')
    ch = s.chords("""
        Fmaj7 | C7sus4:2 C7:1 |
        Fmaj7 | Gm7:2 C7:1 | Am7:2 Dm7:1 | Gm7:2 C7:1 |
        Fmaj7 | Gm7:2 C7:1 | Bbmaj7 | C7sus4:2 C7:1 |
        Dm7 | Gm7 | C7 | Fmaj7:2 D7b9:1 |
        Gm7:2 C7:1 | C7sus4:2 C7:1 | Fmaj7 | Bbmaj7 |
        Dm9 | Gm7:2 C7:1
    """)
    mel = melody("""
        r:3 | r:2 C5:1@.5 |
        F5:2@.58 A5:1@.6 | G5:3@.56 | E5:2@.55 F5:1@.54 | D5:2@.52 C5:1@.5 |
        F5:2@.58 A5:1@.6 | G5:2@.58 C6:1@.62 | Bb5:2@.6 A5:1@.58 | G5:3@.55 |
        D6:2@.62 C6:1@.6 | Bb5:2@.58 A5:1@.56 | G5:2@.55 A5:1@.56 | A5:2@.56 F#5:1@.54 |
        Bb5:2@.58 D5:1@.52 | C5:2@.52 E5:1@.54 | F5:3@.55 | r:1 A4:1@.42 C5:1@.44 |
        F5:3@.42 | r:3
    """, start=0, meter=3)
    _check(mel, ch, 'lullaby/melody')
    # left hand: flowing broken chords in eighths (root, 5th, 10th, 5th, 9th/7th, 5th)
    lh = []
    ped = []
    for c in ch:
        root = 41 + ((c.bass - 41) % 12)  # F2..E3
        fifth = root + 7
        third = root + 12 + ((c.third() - c.root) % 12)
        sev = c.seventh()
        if c.fam == 'maj' or sev is None:
            upper = root + 14  # 9th instead of maj7 (no m9 against a melody root)
        else:
            upper = root + 12 + ((sev - c.root) % 12)
        pat = [root, fifth, third, fifth, upper, fifth]
        steps = int(round(c.d * 2))
        for k in range(steps):
            m = pat[k % len(pat)]
            lh.append(Ev(c.t + 0.5 * k, 0.5 * (steps - k), m, 0.34 + (0.06 if k == 0 else 0), '', False))
        ped.append((c.t + 0.08, c.t + c.d - 0.03))
    s.bus('room', 'studio', -4.0)
    s.add('melody', Piano('lull_pno', bright=0.9), mel, gain_db=-3.0, pedal=ped, feel_ms=20, jitter_ms=12,
          drift_ms=16, sends={'room': -8})
    s.add('lh', Piano('lull_pno', bright=0.9), lh, gain_db=-7.5, pedal=ped, feel_ms=10, jitter_ms=9,
          sends={'room': -8}, eq=[('hs', 5000, 0.7, -2.0)])
    s.master_opts.update(target_rms_db=-21.0, eq=[('hs', 8000, 0.7, -1.5)], glue=0.6)
    return s


# ============================================================================ CITY
def city() -> Song:
    """Investigation / travel: F minor blues at 110, walking bass, brushes, vibraphone lead,
    piano comping.  Intro vamp + 3 choruses (head, vibes solo, head)."""
    s = Song('city', bpm=110, bars=40, swing=0.62, seed=61)
    r = rng('city-gen')
    blues = "Fm9 | Bbm9 | Fm9 | Cm7b5 F7b9 | Bbm9 | Bbm9 | Fm9 | Fm9 | Db9 | C7#9 | Fm9 Db9 | Gm7b5 C7b9 |"
    ch = s.chords("Fm9 | Fm9 | Db9 | C7#9 |" + blues * 3)
    head_txt = """
        F5:1.5@.66 Ab5:.5@.7 G5:2@.66 | Db5:2.5@.64 C5:1@.6 r:.5 |
        r:.5 C5:.5@.6 Eb5:.5@.62 F5:.5@.64 Ab5:1@.66 G5:.5@.62 F5:.5@.6 | Eb5:2@.64 r:1.5 F5:.5@.62 |
        Bb5:1.5@.68 Db6:.5@.7 C6:2@.68 | Ab5:2.5@.66 F5:1@.62 r:.5 |
        r:.5 C5:.5@.6 Eb5:.5@.62 F5:.5@.64 Ab5:1@.66 G5:.5@.62 F5:.5@.6 | C5:2@.6 r:2 |
        B4:1.5@.64 Ab4:.5@.62 F5:2@.66 | E5:1@.66 Eb5:1@.64 C5:1@.62 Bb4:1@.6 |
        Ab4:2@.62 F5:1@.64 Eb5:1@.62 | Db5:1@.62 Bb4:1@.6 E5:1@.64 r:.5"""
    head1 = melody("C5:.5@.6 |" + head_txt + " C5:.5@.6 |", start=15.5, pickup=0.5)
    head2 = melody("C5:.5@.6 |" + head_txt + " r:.5 |", start=111.5, pickup=0.5)
    vib_solo = improvise(ch, 64.5, 111.0, rng('city-solo'), lo=nm('C4'), hi=nm('F6'), center=nm('Ab5'),
                         density=0.75, vel=0.62)
    vib = head1 + vib_solo + head2
    _check(head1 + head2, ch, 'city/head')
    comp = G.swing_comp(ch, 40, r, melody_evs=vib, v=0.46, lo=50, hi=57, density=0.85)
    bass = walking_bass(ch, 160, r, start=0, vel=0.66, skip_prob=0.12, melody_evs=vib)
    kit = G.brush_swing(0, 40, r, v=0.46) + G.chick(0, 40, v=0.42) + G.feather(0, 40, v=0.16)
    for b in (12, 60, 108, 156):
        kit += G.fill_triplets(b + 3, r, v=0.42, kinds=('tap', 'tap', 'slap', 'slap'))
    s.bus('room', 'studio', -4.0)
    s.bus('plate', 'plate', -6.0)
    s.add('swirl', 'swirl', [], gain_db=-15.0, sends={'room': -14}, opts=dict(level=0.12, circle_beats=1.0))
    s.add('vibes', Mallet('vibes', 'vib_city', tremolo=0.18, trem_rate=5.2, spread=0.6), vib, gain_db=1.0, pan=0.4,
          feel_ms=6, jitter_ms=8, sends={'plate': -9, 'room': -14},
          pedal=[(c.t + 0.05, c.t + c.d - 0.05) for c in ch])
    s.add('piano', Piano('city_pno', bright=0.95, spread=0.85), comp, gain_db=-5.0, feel_ms=10, jitter_ms=8,
          sends={'room': -12}, eq=[('hs', 6000, 0.7, -2.0)])
    s.add('bass', UprightBass('city_bass'), bass, gain_db=-4.5, pan=-0.05, feel_ms=-5, jitter_ms=6,
          sends={'room': -18}, eq=[('pk', 100, 1.0, 2.5), ('pk', 700, 1.2, -2.0), ('pk', 1400, 1.5, 1.5), ('blp', 5000, 2)])
    s.add('brushes', 'drums', kit, gain_db=3.5, jitter_ms=4, drift_ms=3, sends={'room': -12})
    s.master_opts.update(target_rms_db=-20.0, eq=[('hs', 9000, 0.7, -1.0)], glue=1.0)
    return s
