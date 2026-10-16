"""Music theory for NIGHT LATCH: note & chord parsing, bar-checked melody notation,
voice-led jazz voicings, walking bass, comping rhythms, chorale voicing, an improviser
and a melody/harmony clash checker.

Times here are in beats (float).  Off-beat eighths are written straight (x.5) and swung
later by the sequencer."""
from __future__ import annotations

import math
import re
from dataclasses import dataclass, field

import numpy as np

PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def pc_of(name: str) -> int:
    m = re.fullmatch(r'([A-G])(bb|b|##|#)?', name)
    if not m:
        raise ValueError('bad pitch class %r' % name)
    v = PC[m.group(1)]
    acc = m.group(2) or ''
    v += {'': 0, 'b': -1, 'bb': -2, '#': 1, '##': 2}[acc]
    return v % 12


def nm(name: str) -> int:
    """'Eb4' -> 63 (C4 = 60)."""
    m = re.fullmatch(r'([A-G])(bb|b|##|#)?(-?\d)', name)
    if not m:
        raise ValueError('bad note %r' % name)
    base = PC[m.group(1)] + {'': 0, 'b': -1, 'bb': -2, '#': 1, '##': 2}[m.group(2) or '']
    return base + 12 * (int(m.group(3)) + 1)


NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']


def name_of(m: int) -> str:
    return '%s%d' % (NAMES[m % 12], m // 12 - 1)


# ----------------------------------------------------------------------------- chords
QUAL = {
    '': (0, 4, 7), 'maj': (0, 4, 7), 'm': (0, 3, 7),
    '6': (0, 4, 7, 9), '69': (0, 4, 7, 9, 14), 'add9': (0, 4, 7, 14),
    'm6': (0, 3, 7, 9), 'm69': (0, 3, 7, 9, 14), 'madd9': (0, 3, 7, 14),
    'maj7': (0, 4, 7, 11), 'maj9': (0, 4, 7, 11, 14), 'maj7#11': (0, 4, 7, 11, 14, 18),
    'maj13': (0, 4, 7, 11, 14, 21), 'maj7#5': (0, 4, 8, 11),
    'm7': (0, 3, 7, 10), 'm9': (0, 3, 7, 10, 14), 'm11': (0, 3, 7, 10, 14, 17), 'm13': (0, 3, 7, 10, 14, 21),
    'mMaj7': (0, 3, 7, 11), 'mMaj9': (0, 3, 7, 11, 14),
    '7': (0, 4, 7, 10), '9': (0, 4, 7, 10, 14), '13': (0, 4, 7, 10, 14, 21),
    '7b9': (0, 4, 7, 10, 13), '7#9': (0, 4, 7, 10, 15), '7b13': (0, 4, 10, 14, 20),
    '7#11': (0, 4, 7, 10, 14, 18), '7alt': (0, 4, 10, 13, 15, 20), '13b9': (0, 4, 10, 13, 21),
    '7b9b13': (0, 4, 10, 13, 20), '9#11': (0, 4, 10, 14, 18), '13#11': (0, 4, 10, 14, 18, 21),
    '7#5': (0, 4, 8, 10), '9#5': (0, 4, 8, 10, 14), '7b5': (0, 4, 6, 10),
    '7sus4': (0, 5, 7, 10), '9sus4': (0, 5, 7, 10, 14), '13sus4': (0, 5, 10, 14, 21),
    'sus4': (0, 5, 7), 'sus2': (0, 2, 7),
    'm7b5': (0, 3, 6, 10), 'm9b5': (0, 3, 6, 10, 14), 'm11b5': (0, 3, 6, 10, 17),
    'dim': (0, 3, 6), 'dim7': (0, 3, 6, 9), 'aug': (0, 4, 8),
}


def family(q: str) -> str:
    if q in ('m7b5', 'm9b5', 'm11b5'):
        return 'hdim'
    if q in ('dim', 'dim7'):
        return 'dim'
    if q.startswith('mMaj'):
        return 'mmaj'
    if q.startswith('maj') or q in ('', '6', '69', 'add9'):
        return 'maj'
    if q.startswith('m'):
        return 'min'
    if 'sus' in q:
        return 'sus'
    if q == 'aug':
        return 'aug'
    return 'dom'


@dataclass
class Chord:
    sym: str
    root: int          # pitch class
    q: str
    bass: int          # pitch class of bass (slash chords)
    t: float = 0.0     # start (beats)
    d: float = 4.0     # duration (beats)

    @property
    def ivals(self):
        return QUAL[self.q]

    @property
    def fam(self):
        return family(self.q)

    def pcs(self) -> set:
        return {(self.root + i) % 12 for i in self.ivals}

    def core(self) -> list:
        """Guide tones etc: root, 3rd, 5th, 7th (as available)."""
        iv = [i % 12 for i in self.ivals]
        return [(self.root + i) % 12 for i in iv[:4]]

    def third(self) -> int:
        iv = self.ivals
        for x in (3, 4, 5, 2):
            if x in iv:
                return (self.root + x) % 12
        return (self.root + 4) % 12

    def seventh(self):
        for x in (10, 11, 9):
            if x in self.ivals:
                return (self.root + x) % 12
        return None

    def fifth(self) -> int:
        for x in (7, 6, 8):
            if x in self.ivals:
                return (self.root + x) % 12
        return (self.root + 7) % 12

    def scale(self) -> set:
        """Chord scale (pitch classes) used for passing tones."""
        r = self.root
        f = self.fam
        iv = set(i % 12 for i in self.ivals)
        if f == 'maj':
            base = {0, 2, 4, 7, 9, 11} | ({6} if 18 in self.ivals or 6 in iv else {5})
        elif f == 'min':
            base = {0, 2, 3, 5, 7, 9, 10} if 8 not in iv else {0, 2, 3, 5, 7, 8, 10}
        elif f == 'mmaj':
            base = {0, 2, 3, 5, 7, 9, 11}
        elif f == 'hdim':
            base = {0, 2, 3, 5, 6, 8, 10}
        elif f == 'dim':
            base = {0, 2, 3, 5, 6, 8, 9, 11}
        elif f == 'sus':
            base = {0, 2, 5, 7, 9, 10}
        elif f == 'aug':
            base = {0, 2, 4, 6, 8, 10}
        else:  # dominant
            if 13 in self.ivals or 15 in self.ivals or 20 in self.ivals:
                base = {0, 1, 3, 4, 6, 8, 10} if self.q == '7alt' else {0, 1, 3, 4, 7, 8, 10}
                if self.q in ('7b9', '13b9'):
                    base = {0, 1, 3, 4, 6, 7, 9, 10}  # half-whole diminished
            elif 18 in self.ivals or 6 in iv:
                base = {0, 2, 4, 6, 7, 9, 10}
            else:
                base = {0, 2, 4, 5, 7, 9, 10}
        return {(r + x) % 12 for x in base} | {(r + i) % 12 for i in self.ivals}

    def allowed(self) -> set:
        """Pitch classes acceptable as sustained melody notes over this chord."""
        f = self.fam
        r = self.root
        extra = {'maj': {2, 6, 9}, 'min': {2, 5, 9}, 'mmaj': {2, 5, 9}, 'hdim': {2, 5, 8},
                 'dim': {2, 5, 8, 11}, 'sus': {2, 9}, 'aug': {2, 6}, 'dom': {1, 2, 3, 6, 8, 9}}[f]
        if f == 'min' and 8 in [i % 12 for i in self.ivals]:
            extra |= {8}
        return self.pcs() | {(r + x) % 12 for x in extra}


def parse_chord(sym: str, t: float = 0.0, d: float = 4.0) -> Chord:
    m = re.fullmatch(r'([A-G](?:b|#)?)([^/]*)(?:/([A-G](?:b|#)?))?', sym)
    if not m:
        raise ValueError('bad chord %r' % sym)
    root = pc_of(m.group(1))
    q = m.group(2)
    q = {'-7': 'm7', 'ø': 'm7b5', 'ø7': 'm7b5', 'o7': 'dim7', 'M7': 'maj7', '^7': 'maj7', '-': 'm'}.get(q, q)
    if q not in QUAL:
        raise ValueError('unknown chord quality %r in %r' % (q, sym))
    bass = pc_of(m.group(3)) if m.group(3) else root
    return Chord(sym, root, q, bass, t, d)


def progression(text: str, meter: int = 4, start: float = 0.0) -> list:
    """'Cm9 | Dm7b5 G7b9 | Fm9:3 Bb7:1 | %' → list of Chord with beat times.
    Chords in a bar share it equally unless durations are given; '%' repeats the bar."""
    out = []
    bars = [b.strip() for b in text.strip().strip('|').split('|')]
    t = start
    prev_bar = None
    for bar in bars:
        toks = bar.split()
        if toks == ['%']:
            toks = prev_bar
        prev_bar = toks
        durs = []
        syms = []
        for tok in toks:
            if ':' in tok:
                s, dd = tok.split(':')
                syms.append(s)
                durs.append(float(eval(dd)))
            else:
                syms.append(tok)
                durs.append(None)
        known = sum(d for d in durs if d is not None)
        unk = sum(1 for d in durs if d is None)
        rest = (meter - known) / unk if unk else 0.0
        durs = [d if d is not None else rest for d in durs]
        if abs(sum(durs) - meter) > 1e-6:
            raise ValueError('bar %r does not add up to %d beats' % (bar, meter))
        for s, dd in zip(syms, durs):
            out.append(parse_chord(s, t, dd))
            t += dd
    return out


def chord_at(chords, b: float):
    for c in chords:
        if c.t - 1e-9 <= b < c.t + c.d - 1e-9:
            return c
    return chords[-1] if b >= chords[-1].t else chords[0]


# ----------------------------------------------------------------------------- melody notation
DUR = {'w': 4.0, 'h': 2.0, 'q': 1.0, 'e': 0.5, 's': 0.25, 'h.': 3.0, 'q.': 1.5, 'e.': 0.75,
       't': 1 / 3, 'qt': 2 / 3, 'ht': 4 / 3}


@dataclass
class Ev:
    b: float          # start beat
    d: float          # duration (beats)
    m: int            # midi (or -1 rest)
    v: float = 0.7
    fl: str = ''
    straight: bool = False


def _dur(s: str) -> float:
    if s in DUR:
        return DUR[s]
    if '/' in s:
        a, c = s.split('/')
        return float(a) / float(c)
    return float(s)


def melody(text: str, start: float = 0.0, meter: int = 4, pickup: float = 0.0, vel: float = 0.7,
           transpose: int = 0, check_bars: bool = True) -> list:
    """Parse 'G4:e | C5:q.@.8!scoop Eb5:e D5:h | Ab4:h. ~:e r:e ...'.

    token  = PITCH:DUR[@VEL][!flag...]    rest = r:DUR    tie = ~:DUR (extends previous)
    PITCH  = C4, Eb5, F#3 ...  DUR = number | fraction | w h q e s q. h. e. t qt
    Bars are separated by '|' and must add up to ``meter`` beats (the first bar may be a
    pickup of length ``pickup``; then ``start`` is the beat where the pickup begins)."""
    evs = []
    t = start
    bars = [b for b in text.strip().split('|')]
    for bi, bar in enumerate(bars):
        bar_t0 = t
        for tok in bar.split():
            fl = ''
            if '!' in tok:
                tok, *flags = tok.split('!')
                fl = ' '.join(flags)
            v = vel
            if '@' in tok:
                tok, vs = tok.split('@')
                v = float(vs)
            p, ds = tok.split(':')
            straight = ds.endswith('t') or ds in ('t', 'qt', 'ht') or '/3' in ds
            d = _dur(ds)
            if p == 'r':
                pass
            elif p == '~':
                if evs:
                    evs[-1].d += d
            else:
                evs.append(Ev(t, d, nm(p) + transpose, v, fl, straight))
            t += d
        if check_bars:
            L = t - bar_t0
            want = pickup if (bi == 0 and pickup) else meter
            if bi == len(bars) - 1 and L < want - 1e-6 and L > 0:
                raise ValueError('last bar %d short: %.3f beats in %r' % (bi, L, bar))
            if abs(L - want) > 1e-6 and not (bi == len(bars) - 1 and abs(L) < 1e-9):
                raise ValueError('bar %d has %.3f beats (want %g): %r' % (bi, L, want, bar))
    return evs


def transpose_evs(evs, semis: int):
    return [Ev(e.b, e.d, e.m + semis, e.v, e.fl, e.straight) for e in evs]


def shift_evs(evs, beats: float):
    return [Ev(e.b + beats, e.d, e.m, e.v, e.fl, e.straight) for e in evs]


def check_melody(evs, chords, name: str = '', strict_beats: bool = True) -> list:
    """Return warnings for sustained/strong-beat melody notes outside the chord's allowed set."""
    warns = []
    for e in evs:
        if e.m < 0:
            continue
        strong = abs(e.b - round(e.b)) < 1e-6
        if e.d < 0.75 and not (strong and e.d >= 0.5):
            continue
        c = chord_at(chords, e.b + 1e-6)
        if (e.m % 12) not in c.allowed():
            # a passing note that resolves by step within half a beat is fine
            warns.append('%s: beat %.2f %s over %s' % (name, e.b, name_of(e.m), c.sym))
    return warns


# ----------------------------------------------------------------------------- voicings
ROOTLESS = {
    'maj7': [(4, 7, 11, 14), (11, 14, 16, 19)], 'maj9': [(4, 7, 11, 14), (11, 14, 16, 19)],
    'maj13': [(4, 9, 11, 14), (11, 14, 16, 21)], 'maj7#11': [(4, 11, 14, 18), (11, 14, 16, 18)],
    '6': [(4, 7, 9, 14), (9, 14, 16, 19)], '69': [(4, 7, 9, 14), (9, 14, 16, 19)],
    'add9': [(4, 7, 12, 14), (7, 12, 14, 16)], 'maj7#5': [(4, 8, 11, 14), (11, 14, 16, 20)],
    'm7': [(3, 7, 10, 14), (10, 14, 15, 19)], 'm9': [(3, 7, 10, 14), (10, 14, 15, 19)],
    'm11': [(3, 10, 14, 17), (5, 10, 15, 19)], 'm13': [(3, 9, 10, 14), (10, 14, 15, 21)],
    'm6': [(3, 7, 9, 14), (9, 14, 15, 19)], 'm69': [(3, 7, 9, 14), (9, 14, 15, 19)],
    'madd9': [(3, 7, 12, 14), (7, 12, 14, 15)],
    'mMaj7': [(3, 7, 11, 14), (11, 14, 15, 19)], 'mMaj9': [(3, 7, 11, 14), (11, 14, 15, 19)],
    '7': [(4, 9, 10, 14), (10, 14, 16, 21)], '9': [(4, 9, 10, 14), (10, 14, 16, 21)],
    '13': [(4, 9, 10, 14), (10, 14, 16, 21)],
    '7b9': [(4, 9, 10, 13), (10, 13, 16, 21)], '13b9': [(4, 9, 10, 13), (10, 13, 16, 21)],
    '7#9': [(4, 10, 15, 19), (10, 15, 16, 19)], '7alt': [(4, 8, 10, 15), (10, 15, 16, 20)],
    '7b13': [(4, 8, 10, 14), (10, 14, 16, 20)], '7b9b13': [(4, 8, 10, 13), (10, 13, 16, 20)],
    '7#11': [(4, 10, 14, 18), (10, 14, 16, 18)], '9#11': [(4, 10, 14, 18), (10, 14, 16, 18)],
    '13#11': [(4, 9, 10, 18), (10, 14, 16, 21)], '7#5': [(4, 8, 10, 14), (10, 14, 16, 20)],
    '9#5': [(4, 8, 10, 14), (10, 14, 16, 20)], '7b5': [(4, 6, 10, 14), (10, 14, 16, 18)],
    '7sus4': [(5, 7, 10, 14), (10, 14, 17, 19)], '9sus4': [(5, 7, 10, 14), (10, 14, 17, 19)],
    '13sus4': [(5, 9, 10, 14), (10, 14, 17, 21)],
    'm7b5': [(3, 6, 10, 12), (10, 12, 15, 18)], 'm9b5': [(3, 6, 10, 14), (10, 14, 15, 18)],
    'm11b5': [(3, 6, 10, 17), (10, 15, 17, 18)],
    'dim7': [(3, 6, 9, 12), (6, 9, 12, 15)], 'dim': [(3, 6, 12, 15), (6, 12, 15, 18)],
    'aug': [(4, 8, 12, 16), (8, 12, 16, 20)],
    '': [(4, 7, 12, 16), (7, 12, 16, 19)], 'maj': [(4, 7, 12, 16), (7, 12, 16, 19)],
    'm': [(3, 7, 12, 15), (7, 12, 15, 19)], 'sus4': [(5, 7, 12, 17), (7, 12, 17, 19)],
    'sus2': [(2, 7, 12, 14), (7, 12, 14, 19)],
}


def _placements(chord: Chord, lo: int, hi: int, forms=None):
    cands = []
    for fi, form in enumerate(forms or ROOTLESS[chord.q]):
        base = chord.root + form[0]
        # lowest note in [lo, hi]
        for o in range(-2, 9):
            low = base + 12 * o
            if lo <= low <= hi:
                cands.append((fi, [chord.root + x + 12 * o for x in form]))
    return cands


def _vl_cost(a, b) -> float:
    if a is None:
        return 0.0
    a = sorted(a)
    b = sorted(b)
    if len(a) == len(b):
        return float(sum(abs(x - y) for x, y in zip(a, b)))
    return float(sum(min(abs(x - y) for y in a) for x in b))


def voice_chords(chords, lo: int = 50, hi: int = 58, top_limit=None, melody_evs=None,
                 forms_override=None, below_melody: bool = True) -> list:
    """Viterbi voice leading over rootless 4-note voicings (A/B forms).
    top_limit: max allowed top note; melody_evs: avoid m9 clashes & keep below melody."""
    cand = []
    for c in chords:
        cs = _placements(c, lo, hi, forms_override.get(c.q) if forms_override else None)
        if not cs:
            cs = _placements(c, lo - 6, hi + 6)
        cand.append(cs)
    n = len(chords)
    INF = 1e18
    cost = [[INF] * len(cs) for cs in cand]
    back = [[-1] * len(cs) for cs in cand]

    def local(i, v):
        c = chords[i]
        pen = 0.0
        top = max(v)
        if top_limit is not None and top > top_limit:
            pen += (top - top_limit) * 3
        if melody_evs:
            mel = _mel_over(melody_evs, c)
            if mel:
                mlow = min(mel)
                if below_melody and top > mlow - 2:
                    pen += (top - mlow + 2) * 8.0
                for x in v:
                    for mm in mel:
                        if (mm - x) % 12 == 1 and mm > x:
                            pen += 4.0
        # muddy low intervals
        sv = sorted(v)
        for a, b in zip(sv, sv[1:]):
            if b - a <= 3 and a < 50:
                pen += 3.0
        return pen

    for j, (fi, v) in enumerate(cand[0]):
        cost[0][j] = local(0, v)
    for i in range(1, n):
        for j, (fj, v) in enumerate(cand[i]):
            lc = local(i, v)
            best, bk = INF, -1
            for k, (fk, u) in enumerate(cand[i - 1]):
                c = cost[i - 1][k] + _vl_cost(u, v) + lc
                if c < best:
                    best, bk = c, k
            cost[i][j] = best
            back[i][j] = bk
    j = int(np.argmin(cost[-1]))
    out = [None] * n
    for i in range(n - 1, -1, -1):
        out[i] = cand[i][j][1]
        j = back[i][j]
    # resolve remaining clashes with the melody: nothing at/above the melody, maj7 under a
    # melody root becomes a 6th, other m9/m2 tensions are dropped
    if melody_evs:
        for i, c in enumerate(chords):
            mel = _mel_over(melody_evs, c, min_d=0.5)
            if not mel:
                continue
            mlow = min(mel)
            v = sorted(out[i])
            above = [x for x in v if x >= mlow - 1]
            if below_melody and above and len(v) - len(above) >= 3:
                v = [x for x in v if x < mlow - 1]
            elif below_melody and above:
                v = [x - 12 if x >= mlow - 1 else x for x in v]
            ess = {c.third(), c.seventh()}
            keep = []
            for x in v:
                bad = any((mm - x) % 12 == 1 and mm > x for mm in mel)
                if bad and c.fam == 'maj' and (x - c.root) % 12 == 11:
                    keep.append(x - 2)
                    continue
                if bad and (x % 12) not in ess:
                    continue
                keep.append(x)
            if len(keep) >= 2:
                out[i] = sorted(set(keep))
    return out


def _mel_over(melody_evs, c, min_d: float = 0.0):
    return [e.m for e in melody_evs if e.m >= 0 and e.d >= min_d
            and e.b < c.t + c.d - 0.05 and e.b + e.d > c.t + 0.05]


def shell(chord: Chord, low: int = 36, wide: bool = False) -> list:
    """Left-hand shell: root + 7th (or 10th) in the bass register."""
    r = chord.bass
    root = low + ((r - low) % 12)
    sev = chord.seventh()
    if wide or sev is None:
        third = chord.third()
        return [root, root + 12 + ((third - r) % 12)]
    return [root, root + ((sev - r) % 12)]


# ----------------------------------------------------------------------------- bass lines
def walking_bass(chords, total_beats: float, rng: np.random.Generator, lo: int = 28, hi: int = 50,
                 center: int = 40, start: float = 0.0, skip_prob: float = 0.12, vel: float = 0.66,
                 two_feel_until: float | None = None, meter: int = 4, melody_evs=None) -> list:
    """Viterbi walking bass: roots on chord arrivals, chord/scale tones in between, chromatic
    or dominant approach into each change; occasional ghosted triplet skips."""
    beats = np.arange(start, start + total_beats, 1.0)
    cands = list(range(lo, hi + 1))
    nb = len(beats)
    INF = 1e18
    # per-beat local costs
    local = np.zeros((nb, len(cands)))
    for i, b in enumerate(beats):
        c = chord_at(chords, b + 1e-6)
        first = abs(b - c.t) < 1e-6 or i == 0
        nxt = chord_at(chords, b + 1 + 1e-6)
        approach = (abs(b + 1 - (c.t + c.d)) < 1e-6)
        pcs_core = set(c.core())
        sc = c.scale()
        for j, m in enumerate(cands):
            p = m % 12
            if first:
                if p == c.bass:
                    lc = 0.0
                elif p == c.root:
                    lc = 1.5
                elif p == c.fifth():
                    lc = 3.0
                elif p == c.third():
                    lc = 3.5
                elif p in pcs_core:
                    lc = 6.0
                else:
                    lc = 20.0
            elif approach:
                tgt = nxt.bass
                d = (p - tgt) % 12
                if d in (1, 11):
                    lc = 0.2
                elif p == (tgt + 7) % 12:
                    lc = 0.5
                elif d in (2, 10) and p in sc:
                    lc = 0.6
                elif p in pcs_core:
                    lc = 1.6
                elif p in sc:
                    lc = 2.2
                else:
                    lc = 6.0
            else:
                if p in pcs_core:
                    lc = 0.5
                elif p in sc:
                    lc = 0.9
                else:
                    lc = 5.0
            lc += 0.25 * ((m - center) / 6.0) ** 2
            lc += rng.uniform(0, 0.9)
            if melody_evs:
                for e in melody_evs:
                    if e.m >= 0 and e.b < b + 0.9 and e.b + e.d > b + 0.1 and (e.m - m) % 12 == 1:
                        lc += 2.5
            local[i, j] = lc
    trans = np.zeros((len(cands), len(cands)))
    for a, ma in enumerate(cands):
        for bb, mb in enumerate(cands):
            iv = abs(ma - mb)
            trans[a, bb] = {0: 2.8, 1: 0.0, 2: 0.0, 3: 0.35, 4: 0.45, 5: 0.8, 6: 2.2, 7: 0.9, 8: 1.8,
                            9: 1.9, 10: 2.4, 11: 2.8, 12: 1.3}.get(iv, 6.0)
    cost = local[0].copy()
    back = np.zeros((nb, len(cands)), dtype=int)
    for i in range(1, nb):
        tot = cost[:, None] + trans
        back[i] = np.argmin(tot, axis=0)
        cost = tot[back[i], np.arange(len(cands))] + local[i]
    j = int(np.argmin(cost))
    line = [0] * nb
    for i in range(nb - 1, -1, -1):
        line[i] = cands[j]
        j = back[i][j]
    evs = []
    for i, b in enumerate(beats):
        v = vel * (1.06 if (b - start) % meter == 0 else 1.0) * (1 + rng.normal(0, 0.05))
        if two_feel_until is not None and b < two_feel_until:
            if (b - start) % 2 != 0:
                continue
            evs.append(Ev(b, 1.9, line[i], v))
            continue
        nxt_change = abs(b + 1 - chord_at(chords, b + 1e-6).t - chord_at(chords, b + 1e-6).d) < 1e-6
        if nxt_change and rng.random() < skip_prob and i + 1 < nb:
            # triplet skip: X (2/3) + ghost (1/3)
            evs.append(Ev(b, 2 / 3, line[i], v, '', True))
            evs.append(Ev(b + 2 / 3, 1 / 3, line[i] + rng.choice([0, 0, -1, 1]), v * 0.75, 'ghost', True))
        else:
            evs.append(Ev(b, 0.95, line[i], v))
    return evs


def two_feel_bass(chords, total_beats: float, rng: np.random.Generator, lo: int = 28, hi: int = 50,
                  start: float = 0.0, pickup_prob: float = 0.25, vel: float = 0.62, meter: int = 4) -> list:
    evs = []
    b = start
    prev = None
    while b < start + total_beats - 1e-6:
        c = chord_at(chords, b + 1e-6)
        first = abs(b - c.t) < 1e-6
        nxt = chord_at(chords, b + 2 + 1e-6)
        change_next = abs(b + 2 - (c.t + c.d)) < 1e-6
        if first:
            p = c.bass
        else:
            # beat 3 of a two-feel is a long note: chord tones only (approaches are pickups)
            sev = c.seventh()
            opts = [c.fifth(), c.third(), sev if sev is not None else c.fifth(), c.bass]
            p = opts[int(rng.choice(len(opts), p=[0.55, 0.2, 0.15, 0.1]))]
        # nearest octave to previous within range
        cands = [m for m in range(lo, hi + 1) if m % 12 == p]
        if prev is None:
            m = min(cands, key=lambda x: abs(x - 38))
        else:
            m = min(cands, key=lambda x: abs(x - prev) + (3 if abs(x - prev) > 9 else 0))
        dur = 1.9
        pick = change_next and rng.random() < pickup_prob
        if pick:
            dur = 1.45
        evs.append(Ev(b, dur, m, vel * (1 + rng.normal(0, 0.05))))
        if pick:
            tgt = nxt.bass
            ap = [x for x in range(lo, hi + 1) if x % 12 in ((tgt + 1) % 12, (tgt - 1) % 12, (tgt + 7) % 12)]
            am = min(ap, key=lambda x: abs(x - m))
            evs.append(Ev(b + 1.5, 0.45, am, vel * 0.85))
        prev = m
        b += 2
    return evs


# ----------------------------------------------------------------------------- comping
SWING_CELLS = [
    ([(0.0, 0.45)], 1.0), ([(1.5, 0.4)], 1.0), ([(0.0, 0.7), (1.5, 0.4)], 1.4),
    ([(1.0, 0.35), (3.0, 0.35)], 0.8), ([(0.5, 0.35), (2.5, 0.5)], 0.7), ([(2.5, 0.5)], 0.9),
    ([(1.0, 0.3), (2.5, 0.7)], 0.8), ([(-0.5, 1.0)], 0.9), ([(-0.5, 0.6), (2.0, 0.4)], 0.7),
    ([], 0.6), ([(0.0, 0.35), (1.0, 0.3), (2.5, 0.45)], 0.4),
]


def comp_rhythm(chords, bars: int, rng: np.random.Generator, meter: int = 4, start: float = 0.0,
                density: float = 1.0, melody_evs=None) -> list:
    """Return list of (beat, dur, chord_index) hits.  Anticipations take the next chord."""
    hits = []
    for bar in range(bars):
        b0 = start + bar * meter
        busy = 0.0
        if melody_evs:
            busy = sum(e.d for e in melody_evs if e.m >= 0 and b0 <= e.b < b0 + meter) / meter
        weights = []
        for cell, w in SWING_CELLS:
            n = len(cell)
            ww = w * (density ** n if n else (1.5 - density) + busy)
            if busy > 0.6 and n > 1:
                ww *= 0.5
            weights.append(max(ww, 0.01))
        weights = np.array(weights) / sum(weights)
        cell = SWING_CELLS[int(rng.choice(len(SWING_CELLS), p=weights))][0]
        for (o, d) in cell:
            hb = b0 + o
            if hb < start:
                hb += bars * meter  # wrap first-bar anticipation to the loop end
            # chords that change mid-bar: make sure each chord gets at least one hit
            hits.append((hb, d))
        # ensure chord changes inside the bar are articulated
        for c in chords:
            if b0 < c.t < b0 + meter and not any(abs(h[0] - c.t) < 0.6 or (c.t - 0.6 < h[0] < c.t + 0.6) for h in hits):
                hits.append((c.t - (0.5 if rng.random() < 0.4 else 0.0), 0.45))
    out = []
    for hb, d in sorted(hits):
        # anticipation (off-beat within 0.5 before a change) takes the next chord
        q = hb + 0.51
        if q >= start + bars * meter:
            q = start + ((q - start) % (bars * meter))
        c = chord_at(chords, q)
        idx = chords.index(c)
        out.append((hb, d, idx))
    return out


# ----------------------------------------------------------------------------- chorale (SATB)
def chorale(chords, soprano: list, rng=None, ranges=((60, 79), (53, 72), (46, 66), (36, 58))) -> list:
    """Four-part voicing.  soprano: list of midi (one per chord, or None to choose).
    Returns list of (S, A, T, B).  Minimises motion; avoids parallel 5ths/8ves, crossing,
    spacing > octave between upper voices; doubles root preferably; bass = chord bass."""
    states = []
    for i, c in enumerate(chords):
        pcs = sorted(c.pcs())
        core = [c.root, c.third(), c.fifth()] + ([c.seventh()] if c.seventh() is not None else [])
        sop_opts = [soprano[i]] if soprano[i] is not None else [m for m in range(*ranges[0]) if m % 12 in core]
        bass_opts = [m for m in range(ranges[3][0], ranges[3][1] + 1) if m % 12 == c.bass]
        alts = [m for m in range(ranges[1][0], ranges[1][1] + 1) if m % 12 in pcs]
        tens = [m for m in range(ranges[2][0], ranges[2][1] + 1) if m % 12 in pcs]
        st = []
        for S in sop_opts:
            for B in bass_opts:
                for A in alts:
                    if not (A < S and S - A <= 12):
                        continue
                    for T in tens:
                        if not (T < A and A - T <= 12 and T > B):
                            continue
                        have = {S % 12, A % 12, T % 12, B % 12}
                        need = {c.root, c.third()} | ({c.seventh()} if c.seventh() is not None else set())
                        miss = len(need - have)
                        if miss > 0 and len(need) <= 3:
                            if miss > 1 or (c.third() not in have):
                                continue
                        pen = 2.0 * miss
                        if c.fifth() not in have:
                            pen += 0.5
                        pcs_list = [S % 12, A % 12, T % 12, B % 12]
                        if c.seventh() is not None and pcs_list.count(c.seventh()) > 1:
                            pen += 3
                        if pcs_list.count(c.third()) > 1 and c.fam in ('dom',):
                            pen += 3
                        st.append(((S, A, T, B), pen))
        if not st:
            raise ValueError('no chorale voicing for %s' % c.sym)
        states.append(st)
    INF = 1e18
    cost = [[p for (_, p) in st] for st in states]
    back = [[-1] * len(st) for st in states]
    for i in range(1, len(states)):
        newc = []
        for j, (v, p) in enumerate(states[i]):
            best, bk = INF, -1
            for k, (u, q) in enumerate(states[i - 1]):
                c = cost[i - 1][k] + p
                mv = sum(abs(a - b) for a, b in zip(u[:3], v[:3])) + 0.3 * abs(u[3] - v[3])
                c += mv * 0.6
                # parallel fifths / octaves between any pair
                for x in range(4):
                    for y in range(x + 1, 4):
                        i1 = (u[x] - u[y]) % 12
                        i2 = (v[x] - v[y]) % 12
                        if i1 == i2 and i1 in (0, 7) and u[x] != v[x]:
                            c += 25
                # big leaps in inner voices
                for x in (1, 2):
                    if abs(u[x] - v[x]) > 7:
                        c += 4
                if c < best:
                    best, bk = c, k
            newc.append(best)
            back[i][j] = bk
        cost[i] = newc
    j = int(np.argmin(cost[-1]))
    out = [None] * len(states)
    for i in range(len(states) - 1, -1, -1):
        out[i] = states[i][j][0]
        j = back[i][j]
    return out


# ----------------------------------------------------------------------------- improviser
def improvise(chords, b0: float, b1: float, rng: np.random.Generator, lo: int, hi: int,
              center: int | None = None, density: float = 0.75, vel: float = 0.68,
              quote=None, quote_at: float | None = None) -> list:
    """Bebop-flavoured improvised line: chord tones on strong beats, scale/chromatic passing
    tones on off-beats, enclosures, phrase arcs, rests, occasional triplets and a quote."""
    center = center or (lo + hi) // 2
    evs = []
    b = b0 + float(rng.choice([0.0, 0.5, 1.0]))
    cur = center + int(rng.integers(-3, 4))
    direction = 1 if rng.random() < 0.5 else -1
    while b < b1 - 1.0:
        if quote and quote_at is not None and b <= quote_at < b + 4 and not any(e.fl == 'quote' for e in evs):
            for e in quote:
                evs.append(Ev(quote_at + e.b, e.d, e.m, e.v, 'quote', e.straight))
            b = quote_at + max(e.b + e.d for e in quote) + 1.0
            continue
        plen = float(rng.choice([2, 3, 4, 4, 5, 6, 7]) * density + 1)
        pend = min(b + plen, b1 - 0.5)
        while b < pend:
            c = chord_at(chords, b + 1e-6)
            strong = abs(b - round(b)) < 1e-6
            # rhythm choice
            r = rng.random()
            if r < 0.1 and strong and b + 1 <= pend:
                trip = True
                durs = [1 / 3] * 3
            else:
                trip = False
                durs = [0.5] if r < 0.82 else [1.0]
            for d in durs:
                c = chord_at(chords, b + 1e-6)
                strong = abs(b - round(b)) < 1e-6 and (round(b) % 2 == 0)
                tones = sorted({m for m in range(lo, hi + 1) if m % 12 in set(c.core()) | {c.third(), (c.root + 14) % 12}})
                scale = sorted({m for m in range(lo, hi + 1) if m % 12 in c.scale()})
                if rng.random() < 0.18:
                    direction = -direction
                if cur > hi - 3:
                    direction = -1
                if cur < lo + 3:
                    direction = 1
                if strong:
                    pool = [m for m in tones if 0 < (m - cur) * direction <= 4] or [min(tones, key=lambda m: abs(m - cur))]
                    nxt = pool[0] if direction > 0 else pool[-1]
                else:
                    if rng.random() < 0.22:
                        step = direction * int(rng.choice([3, 4, 5]))
                        pool = [m for m in tones if abs(m - (cur + step)) <= 1] or scale
                        nxt = min(pool, key=lambda m: abs(m - (cur + step)))
                    else:
                        pool = [m for m in scale if 0 < (m - cur) * direction <= 2]
                        nxt = (pool[0] if direction > 0 else pool[-1]) if pool else cur + direction
                        if rng.random() < 0.12:
                            nxt = cur + direction  # chromatic passing
                nxt = int(np.clip(nxt, lo, hi))
                v = vel + 0.18 * (nxt - center) / max(hi - lo, 1) + rng.normal(0, 0.04)
                if not strong and rng.random() < 0.15:
                    v *= 0.7
                evs.append(Ev(b, d, nxt, float(np.clip(v, 0.3, 1.0)), '', trip))
                cur = nxt
                b += d
        # phrase ending: lengthen last note to a chord tone, maybe fall
        if evs:
            last = evs[-1]
            c = chord_at(chords, last.b + 1e-6)
            tones = [m for m in range(lo, hi + 1) if m % 12 in c.core()]
            last.m = min(tones, key=lambda m: abs(m - last.m))
            last.d = float(rng.choice([0.5, 1.0, 1.5]))
            if last.d >= 1.0 and rng.random() < 0.35:
                last.fl = 'fall' if rng.random() < 0.4 else 'vib'
            b = last.b + last.d
        b += float(rng.choice([0.5, 1.0, 1.5, 2.0, 2.5]))
        # start phrases on off-beats often
        if rng.random() < 0.5:
            b = math.floor(b) + 0.5
    return [e for e in evs if e.b + e.d <= b1 + 1e-6]


def find_clashes(lead, others, chords, min_overlap: float = 0.4, label: str = '') -> list:
    """Sustained m2/m9 collisions between a lead line and accompaniment notes.  A b9 against
    the bass root of a dominant b9/alt chord is intended and not reported."""
    out = []
    for L in lead:
        if L.m < 0 or 'ghost' in L.fl:
            continue
        for O in others:
            if O.m < 0 or 'ghost' in O.fl:
                continue
            ov = min(L.b + L.d, O.b + O.d) - max(L.b, O.b)
            if ov < min_overlap:
                continue
            iv = L.m - O.m
            if abs(iv) in (1, 13):
                c = chord_at(chords, max(L.b, O.b) + 1e-6)
                if c.fam == 'dom' and (L.m - c.root) % 12 in (1, 3) and (O.m % 12) == c.root:
                    continue
                out.append('%s beat %.2f: lead %s vs %s (%s)' % (label, max(L.b, O.b), name_of(L.m), name_of(O.m), c.sym))
    return out
