"""Main-theme family: title, ending (credits), chapter sting, discovery/danger stingers.

THE NIGHT LATCH MOTIF (scale degrees in minor):  5(low) - 1 - b3 - 2 | b6(low) - 5(low)
In C minor:  G4 | C5 Eb5 D5 | Ab4 G4  — a rising question that drops a tritone (D→Ab)
and falls shut on the dominant like a latch clicking home.
"""
from __future__ import annotations

import numpy as np

from synth import rng
from harmony import melody, check_melody, Ev, shift_evs, transpose_evs, chord_at
from instruments import Piano, UprightBass, Mallet, Wind, StringSection
from sequencer import Song
import grooves as G
from harmony import two_feel_bass, walking_bass

WARN = []


def _check(evs, chords, name):
    WARN.extend(check_melody(evs, chords, name))


# ============================================================================ TITLE
def title() -> Song:
    s = Song('title', bpm=72, bars=28, swing=0.64, seed=3)
    r = rng('title-gen')
    ch = s.chords("""
        Cm9 | Abmaj7#11 | Dm7b5 | G7b9:2 G7alt:2 |
        Cm9 | Dm7b5 G7b9 | Fm9 | Bb7#9:2.5 Bb13:1.5 | Ebmaj9 | Abmaj7#11 | Dm7b5 G7b9 | Cm9 Bb13 |
        Fm9 | Bb13 | Ebmaj9 | Cm9 | Fm9 | Bb7b9 | Ebmaj7 | Dm7b5 G7b9 |
        Cm9 | Dm7b5 G7b9 | Fm9 | Bb7#9 Bb13 | Ebmaj9 | Abmaj7#11 | Dm7b5 G7b9 | Cm9 Ab7#11:1 G7alt:1
    """)
    # --- trumpet (Harmon mute) -------------------------------------------------
    A1 = melody("""
        G4:.5 |
        C5:1.5@.62 Eb5:.5@.66 D5:2@.64 | Ab4:2.5@.6!scoop G4:1@.55 C5:.5@.6 |
        F5:1.5@.66 Ab5:.5@.7 G5:2@.66 | Db5:2.5@.64!scoop C5:1.5@.6 |
        r:.5 Bb4:.5@.58 Eb5:.5@.62 F5:.5@.64 G5:2@.68 | F5:1@.66 Eb5:.5@.62 D5:2.5@.64 |
        C5:1@.62 Ab4:1@.6 B4:1.5@.62 D5:.5@.6 | Eb5:2@.62 r:2
    """, start=15.5, pickup=0.5)
    B = melody("""
        Ab5:1.5@.7!scoop G5:.5@.66 F5:1@.66 Eb5:1@.64 | D5:3@.66 r:1 |
        r:4 | r:3.5 C5:.5@.66 |
        F5:1.5@.72 Ab5:.5@.74 C6:2@.78!vib | B5:1.5@.76 Bb5:.5@.72 Ab5:2@.7 |
        G5:2@.68 F5:1@.64 Eb5:1@.62 | D5:1@.62 F5:1@.62 Ab4:1.5@.6 G4:.5@.58
    """, start=48)
    A2 = melody("""
        C5:1.5@.62 Eb5:.5@.66 D5:2@.64 | Ab4:2.5@.6 G4:1@.55 C5:.5@.6 |
        F5:1.5@.66 Ab5:.5@.7 G5:2@.66 | Db5:1.5@.64 C5:.5@.6 Bb4:1@.58 G4:1@.56 |
        r:.5 Bb4:.5@.6 Eb5:.5@.64 G5:.5@.68 Bb5:2@.72!vib | C6:1@.72 Bb5:.5@.68 G5:.5@.64 D5:2@.62 |
        C5:1@.6 Ab4:1@.58 B4:1.5@.6 D5:.5@.58 | C5:2@.55!vib r:2
    """, start=80)
    tpt = A1 + B + A2
    _check(tpt, ch, 'title/tpt')
    # --- vibraphone: intro motif, bridge answers, soft fills ---------------------
    vib_intro = melody("""
        r:3.5 G4:.5@.5 | C5:1.5@.55 Eb5:.5@.58 D5:2@.56 | Ab4:2.5@.52 G4:1.5@.48 | r:4
    """, start=0)
    vib_bridge = melody("""
        r:3 Bb5:.5@.5 C6:.5@.52 |
        D6:1@.56 Bb5:.5@.52 G5:.5@.5 D6:1@.55 C6:1@.52 | Bb5:1.5@.55 G5:.5@.5 Eb5:1.5@.5 r:.5
    """, start=52)
    vib_tag = melody("C5:1@.45 Db5:.5@.45 Eb5:.5@.42", start=110, check_bars=False)
    vib_a2 = melody("""
        r:2 G4:2@.36 | r:2 D5:2@.34 | r:2 Eb5:2@.36 | r:2 D5:2@.34 |
        r:2 D5:2@.34 | r:2 G4:2@.32 | r:4 | r:4
    """, start=80)
    vibes = vib_intro + vib_bridge + vib_a2 + vib_tag
    _check(vib_intro + vib_bridge, ch, 'title/vibes')
    # --- piano ------------------------------------------------------------------
    pno, ped = G.ballad_piano(ch, r, melody_evs=tpt + vibes, v=0.42, restrike=0.4)
    # --- bass: two-feel in the A sections, walking in the bridge -----------------
    b1 = two_feel_bass([c for c in ch if c.t < 48], 48, r, start=0, vel=0.6)
    b2 = walking_bass([c for c in ch if 48 <= c.t < 80], 32, r, start=48, vel=0.62, skip_prob=0.1)
    b3 = two_feel_bass([c for c in ch if c.t >= 80], 32, r, start=80, vel=0.6)
    bass = b1 + b2 + b3
    # --- drums: swirl everywhere, taps from A1, a little busier in the bridge ----
    kit = G.brush_ballad(16, 8, r, v=0.42, busy=0.2) + G.brush_ballad(48, 8, r, v=0.5, busy=0.45) \
        + G.brush_ballad(80, 8, r, v=0.42, busy=0.25)
    kit += G.chick(16, 24, v=0.35) + G.feather(16, 24, v=0.16, beats=(0, 2))
    kit += [(110 + 2 / 3 * k, 'tap', 0.3 + 0.08 * k, True) for k in range(3)]
    # --- assemble ------------------------------------------------------------------
    s.bus('plate', 'plate', -3.0)
    s.bus('room', 'studio', -6.0)
    s.add('trumpet', Wind('trumpet_harmon', 'tpt_title'), tpt, gain_db=0.0, pan=-0.12, width=0.25,
          sends={'plate': -9, 'room': -16}, feel_ms=22, jitter_ms=12, drift_ms=10,
          eq=[('hp', 250, 0.7), ('pk', 1700, 0.9, -2.0), ('pk', 3000, 1.0, 1.0)])
    s.add('vibes', Mallet('vibes', 'vibes_title', tremolo=0.22, trem_rate=4.1), vibes, gain_db=0.0,
          pedal=[(c.t + 0.1, c.t + c.d - 0.05) for c in ch], sends={'plate': -8, 'room': -18},
          feel_ms=10, jitter_ms=8)
    s.add('piano', Piano('grand_title', bright=0.9), pno, gain_db=-6.5, pedal=ped,
          sends={'room': -14, 'plate': -20}, feel_ms=14, jitter_ms=7,
          eq=[('ls', 180, 0.7, 1.0), ('hs', 6000, 0.7, -2.0)])
    s.add('bass', UprightBass('bass_title', sustain=1.35), bass, gain_db=-5.5, pan=-0.05,
          sends={'room': -20}, feel_ms=-4, jitter_ms=7,
          eq=[('pk', 95, 1.0, 3.0), ('pk', 650, 1.2, -2.0), ('pk', 1300, 1.4, 1.5), ('blp', 5000, 2)])
    s.add('swirl', 'swirl', [], gain_db=-12.0, sends={'room': -14},
          opts=dict(level=0.12, circle_beats=2.0, accent=0.4))
    s.add('brushes', 'drums', kit, gain_db=5.0, sends={'room': -12}, feel_ms=2, jitter_ms=5)
    s.master_opts.update(target_rms_db=-20.0, eq=[('ls', 120, 0.7, 0.5), ('hs', 9000, 0.7, -1.0)], glue=0.8)
    return s


# ============================================================================ ENDING (credits)
def ending() -> Song:
    """Main theme in C major, full warm arrangement.  The trumpet plays open (the mute is
    off); in the last A the latch tritone 'heals' (Ab→A, Db→D) — the room opens."""
    s = Song('ending', bpm=72, bars=36, swing=0.63, seed=11)
    r = rng('ending-gen')
    ch = s.chords("""
        Cmaj9 | Am9 | Dm9 | G13sus4:2 G13:2 |
        Cmaj9 | Fm6:2 Bb9:2 | Fmaj9 | Bbm6:2.5 Eb9:1.5 | Am9 | D9 | Dm9:2 G13:2 | Cmaj9:2 G7b9:2 |
        Cmaj9 | Fm6:2 Bb9:2 | Fmaj9 | Bbm6:2.5 Eb9:1.5 | Am9 | D9 | Dm9:2 G13:2 | Em7:2 A7b9:2 |
        Am9 | D9 | Gmaj9 | Cmaj9 | F#m7b5 | B7b9 | Em9 | Dm9:2 G13:2 |
        Cmaj9 | Dm9:2 G13:2 | Fmaj9 | Em7:2 A7b9:2 | Dm9 | G13 | Cmaj9 | Dm9:2 G13:2
    """)
    A = """
        C5:1.5@.64 E5:.5@.68 D5:2@.66 | Ab4:2.5@.62!scoop G4:1@.58 C5:.5@.62 |
        F5:1.5@.68 A5:.5@.72 G5:2@.68 | Db5:2.5@.64 C5:1.5@.62 |
        r:.5 E4:.5@.6 A4:.5@.62 B4:.5@.64 C5:2@.66 | B4:1@.64 A4:.5@.6 F#4:2.5@.6 |
        F4:1@.6 A4:1@.62 B4:1.5@.64 D5:.5@.6 |"""
    tpt_A = melody("G4:.5 |" + A + " E5:2@.62 r:1.5 G4:.5@.58", start=15.5, pickup=0.5)
    vln_A2 = melody(A.replace('!scoop', '') + " E5:2@.6 r:2", start=48, transpose=12, vel=0.6)
    tpt_B = melody("""
        E5:1.5@.68 D5:.5@.64 C5:1@.64 B4:1@.62 | A4:3@.64 r:1 |
        r:.5 D5:.5@.64 G5:.5@.68 A5:.5@.7 B5:2@.74!vib | A5:1@.72 G5:.5@.68 E5:2.5@.68 |
        A5:1.5@.74 G5:.5@.7 F#5:1@.7 E5:1@.68 | D#5:2@.7 C5:1@.66 B4:1@.64 |
        B4:1@.64 E5:1@.66 G5:1.5@.7 F#5:.5@.66 | F5:1@.66 E5:1@.64 D5:1.5@.62 G4:.5@.6
    """, start=80)
    A3 = """
        C5:1.5@.7 E5:.5@.72 D5:2@.7 | A4:2.5@.68 G4:1@.64 C5:.5@.66 |
        F5:1.5@.72 A5:.5@.76 G5:2@.72 | D5:2@.7 C#5:2@.66 |
        r:.5 A4:.5@.64 D5:.5@.66 E5:.5@.68 F5:2@.72 | E5:1@.68 D5:.5@.64 B4:2.5@.64 |
        C5:3@.62!vib r:1 | r:4"""
    tpt_A3 = melody(A3, start=112)
    vln_A3 = melody(A3.replace('!vib', ''), start=112, transpose=12, vel=0.58)
    tpt = tpt_A + tpt_B + tpt_A3
    _check(tpt + vln_A2, ch, 'ending/lead')
    vib = melody("""
        r:3.5 G4:.5@.5 | C5:1.5@.55 E5:.5@.58 D5:2@.56 | A4:2.5@.52 G4:1.5@.48 | r:4
    """, start=0)
    vib += melody("r:1 D5:.5@.5 E5:.5@.5 G5:1@.52 A5:1@.5", start=140, check_bars=False)
    vib += melody("r:3 B5:.5@.5 G5:.5@.48", start=84, check_bars=False)
    _check(vib, ch, 'ending/vibes')
    lead_all = tpt + vln_A2 + vln_A3 + vib
    pno, ped = G.ballad_piano(ch, r, melody_evs=lead_all, v=0.42, restrike=0.35)
    pad = G.pad_chords(ch, lo=53, hi=60, v=0.42, melody_evs=lead_all)
    cello = [Ev(c.t, c.d, 36 + ((c.bass - 36) % 12) + 12, 0.45, '', True) for c in ch]
    bass = two_feel_bass([c for c in ch if c.t < 48], 48, r, start=0, vel=0.6) \
        + walking_bass([c for c in ch if 48 <= c.t < 112], 64, r, start=48, vel=0.62, skip_prob=0.1) \
        + two_feel_bass([c for c in ch if c.t >= 112], 32, r, start=112, vel=0.62)
    kit = G.brush_ballad(16, 8, r, v=0.42, busy=0.25) + G.brush_swing(48, 16, r, v=0.42) \
        + G.brush_ballad(112, 8, r, v=0.46, busy=0.35)
    kit += G.chick(16, 32, v=0.33) + G.feather(16, 32, v=0.15, beats=(0, 2))
    s.bus('plate', 'plate', -3.0)
    s.bus('hall', 'hall', -4.0)
    s.add('trumpet', Wind('trumpet_open', 'tpt_end'), tpt, gain_db=-1.5, pan=-0.1, width=0.25,
          sends={'plate': -10, 'hall': -14}, feel_ms=18, jitter_ms=11, drift_ms=9,
          eq=[('hp', 160, 0.7), ('hs', 6000, 0.7, -2.0)])
    s.add('violins', StringSection('violins', 'vln_end'), vln_A2 + vln_A3, gain_db=-3.0, pan=-0.35,
          sends={'hall': -8}, feel_ms=12, jitter_ms=8)
    s.add('violas', StringSection('violas', 'vla_end'), pad, gain_db=-9.0, pan=0.15, sends={'hall': -8},
          swing=False, jitter_ms=10)
    s.add('cellos', StringSection('cellos', 'vc_end'), cello, gain_db=-10.0, pan=0.4, sends={'hall': -9},
          swing=False, jitter_ms=10)
    s.add('vibes', Mallet('vibes', 'vibes_end', tremolo=0.2, trem_rate=4.0), vib, gain_db=-1.0, pan=0.35,
          pedal=[(c.t + 0.1, c.t + c.d - 0.05) for c in ch], sends={'plate': -8}, feel_ms=8)
    s.add('piano', Piano('grand_end', bright=0.95), pno, gain_db=-7.0, pedal=ped,
          sends={'hall': -14, 'plate': -20}, feel_ms=12, jitter_ms=7,
          eq=[('ls', 180, 0.7, 1.0), ('hs', 6000, 0.7, -1.5)])
    s.add('bass', UprightBass('bass_end', sustain=1.35), bass, gain_db=-5.5, pan=-0.05,
          sends={'hall': -22}, feel_ms=-4, jitter_ms=7,
          eq=[('pk', 95, 1.0, 3.0), ('pk', 650, 1.2, -2.0), ('pk', 1300, 1.4, 1.5), ('blp', 5000, 2)])
    s.add('swirl', 'swirl', [], gain_db=-12.0, sends={'hall': -16}, opts=dict(level=0.12, circle_beats=2.0))
    s.add('brushes', 'drums', kit, gain_db=5.0, sends={'hall': -14}, feel_ms=2, jitter_ms=5)
    s.master_opts.update(target_rms_db=-19.5, eq=[('ls', 120, 0.7, 0.8), ('hs', 9000, 0.7, -0.8)], glue=0.8)
    return s


# ============================================================================ CHAPTER STING
def chapter() -> Song:
    """6-8 s chapter-card sting: the motif on Harmon trumpet over Cm9 → Dm7b5 → CmMaj9,
    with a brush swell and a low bass/piano anchor.  Non-looping."""
    s = Song('chapter', bpm=76, bars=2, swing=0.6, loop=False, pre=0.5, tail=4.0, seed=5, max_len=7.6,
             fade_out=1.2)
    ch = s.chords("Cm9:4 | Dm7b5:1.5 CmMaj9:2.5")
    tpt = melody("G4:.5@.6 C5:1.5@.66 Eb5:.5@.68 D5:1.5@.66 | Ab4:1.5@.64!scoop G4:2.5@.56!vib", start=0,
                 check_bars=False)
    pno = []
    for c, vo in zip(ch, [[48, 55, 63, 70, 74], [50, 56, 60, 65]]):
        for k, m in enumerate(vo):
            pno.append(Ev(c.t + 0.03 * k, c.d + (2.0 if c is ch[-1] else 0), m, 0.5, '', True))
    for k, m in enumerate([36, 55, 59, 62, 63, 67]):
        pno.append(Ev(5.5 + 0.025 * k, 4.0, m, 0.48, '', True))
    bass = [Ev(0, 3.8, 36, 0.66, '', True), Ev(4, 1.4, 38, 0.6, '', True), Ev(5.5, 3.5, 36, 0.62, '', True)]
    vib = melody("r:5.5 Eb6:.5@.42 D6:.5@.4 B5:1.5@.38", start=0, check_bars=False)
    kit = [(0.0, 'kick', 0.35, True), (5.5, 'tap', 0.4, True), (5.5, 'kick', 0.3, True)]
    s.bus('plate', 'plate', -3.0)
    s.add('trumpet', Wind('trumpet_harmon', 'tpt_ch'), tpt, gain_db=-1.5, pan=-0.08, sends={'plate': -8},
          feel_ms=12, jitter_ms=6, swing=True, eq=[('hp', 250, 0.7), ('pk', 1700, 0.9, -2.5)])
    s.add('piano', Piano('grand_ch'), pno, gain_db=-8.0, pedal=[(0.1, 3.95), (4.1, 9.5)], sends={'plate': -14},
          jitter_ms=3)
    s.add('bass', UprightBass('bass_ch', sustain=1.5), bass, gain_db=-4.0, sends={'plate': -20}, jitter_ms=3)
    s.add('vibes', Mallet('vibes', 'vibes_ch', tremolo=0.25), vib, gain_db=-4.0, pan=0.35,
          pedal=[(5.4, 9.5)], sends={'plate': -6})
    s.add('swirl', 'swirl', [], gain_db=-14.0, sends={'plate': -12}, opts=dict(level=0.12, circle_beats=2.0))
    s.add('kit', 'drums', kit, gain_db=-2.0, sends={'plate': -12})
    s.master_opts.update(target_rms_db=-20.0, glue=0.5)
    return s


def chapter_sting() -> Song:
    """~2.8 s chapter-card sting (rendered mono as sfx 'chapter'): the latch's fall D5→Ab4→G4
    on Harmon trumpet over a dark, rolled CmMaj9, low bass and a brushed-cymbal swell."""
    s = Song('chapter_sting', bpm=92, bars=1, swing=0.5, loop=False, pre=0.3, tail=3.0, seed=6, max_len=2.9,
             fade_out=0.8)
    tpt = melody("D5:.5@.68 Ab4:.5@.64!scoop G4:2.5@.56!vib", start=0.2, check_bars=False)
    pno = [Ev(0.03 * k, 3.6, m, 0.55 - 0.02 * k, '', True) for k, m in enumerate([36, 43, 51, 55, 59, 62])]
    bass = [Ev(0.0, 3.6, 36, 0.72, '', True)]
    kit = [(0.0, 'brushcym', 0.55, True), (0.0, 'kick', 0.3, True), (1.2, 'tap', 0.25, True)]
    s.bus('plate', 'plate', -3.0)
    s.add('trumpet', Wind('trumpet_harmon', 'tpt_chsfx'), tpt, gain_db=-2.0, pan=0.0, swing=False, jitter_ms=3,
          sends={'plate': -7}, eq=[('hp', 250, 0.7), ('pk', 1700, 0.9, -2.5)])
    s.add('piano', Piano('grand_chsfx', bright=0.85), pno, gain_db=-7.0, pedal=[(0.0, 4.0)], swing=False, jitter_ms=2,
          sends={'plate': -12}, eq=[('hs', 5000, 0.7, -2.0)])
    s.add('bass', UprightBass('bass_chsfx', sustain=1.6), bass, gain_db=-5.0, swing=False, jitter_ms=1,
          sends={'plate': -18})
    s.add('kit', 'drums', kit, gain_db=-1.0, swing=False, jitter_ms=1, sends={'plate': -10})
    s.master_opts.update(target_rms_db=-19.0, glue=0.5)
    return s


# ============================================================================ STINGERS
def stinger_clue() -> Song:
    """Discovery: celesta + vibes run up the motif's head, answered by a bright Ebmaj9."""
    s = Song('stinger_clue', bpm=96, bars=1, swing=0.5, loop=False, pre=0.3, tail=3.0, seed=2, max_len=2.8,
             fade_out=0.9)
    run = melody("G5:.25@.62 C6:.25@.66 Eb6:.25@.7 D6:1.25@.72", start=0, check_bars=False)
    chord = [Ev(1.0 + 0.05 * k, 3.0, m, 0.55 + 0.03 * k, '', True) for k, m in enumerate([63, 67, 70, 74, 77, 82])]
    pno = [Ev(1.0 + 0.03 * k, 3.0, m, 0.45, '', True) for k, m in enumerate([51, 58, 62, 65, 67])]
    s.bus('plate', 'plate', -2.0)
    s.add('celesta', Mallet('celesta', 'cel_clue'), run, gain_db=-1.0, pan=-0.2, sends={'plate': -8}, swing=False,
          jitter_ms=2)
    s.add('vibes', Mallet('vibes', 'vib_clue', tremolo=0.3, trem_rate=5.0), run + chord, gain_db=-3.0, pan=0.25,
          pedal=[(0, 6)], sends={'plate': -6}, swing=False, jitter_ms=2)
    s.add('piano', Piano('grand_clue', bright=1.1), pno, gain_db=-10.0, pedal=[(0.9, 6)], sends={'plate': -12},
          swing=False, jitter_ms=2)
    s.master_opts.update(target_rms_db=-19.0, glue=0.3)
    return s


def stinger_danger() -> Song:
    """Danger: low brass sforzando cluster + timpani + tremolo strings, choked into the room."""
    s = Song('stinger_danger', bpm=90, bars=1, swing=0.5, loop=False, pre=0.3, tail=3.0, seed=4, max_len=2.9,
             fade_out=0.9)
    brass_notes = {'tbn1': 43, 'tbn2': 49, 'horn1': 55, 'horn2': 56, 'tuba': 24}
    s.bus('hall', 'hall', -3.0)
    for k, (nm_, m) in enumerate(brass_notes.items()):
        kind = 'tuba' if nm_ == 'tuba' else ('horn' if 'horn' in nm_ else 'trombone')
        ev = [Ev(0.0, 1.6, m, 0.95, 'accent', True)]
        s.add(nm_, Wind(kind, 'dz_' + nm_), ev, gain_db=-4.0, pan=-0.3 + 0.15 * k, sends={'hall': -6}, swing=False,
              jitter_ms=4)
    vln = [Ev(0.0, 2.2, m, 0.7, 'trem marc', True) for m in (79, 80, 86)]
    s.add('violins', StringSection('violins', 'vln_dz'), vln, gain_db=-6.0, pan=-0.3, sends={'hall': -6}, swing=False)
    kit = [(0.0, 'timp:36', 0.95, True), (0.0, 'kick_hard', 0.8, True), (0.02, 'crash', 0.55, True)]
    kit += [(0.25 + 0.06 * k, 'timp:36', 0.5 - 0.03 * k, True) for k in range(8)]
    s.add('perc', 'drums', kit, gain_db=-1.0, sends={'hall': -8}, swing=False)
    s.master_opts.update(target_rms_db=-18.0, glue=0.6)
    return s
