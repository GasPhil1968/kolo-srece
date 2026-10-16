"""Sequencer: tempo map, swing, humanisation, part rendering, loop folding, buses, mix.

A Song holds Parts (instrument + events in beats + mix settings).  Rendering happens in an
extended buffer (pre-roll for pickups, tail for ringing notes); loops are then folded
circularly to exactly one period, and every later process (EQ, compression, reverb,
mastering) runs circularly too, so the loop point is seamless by construction.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np

from synth import SR, ns, rng, filt, fold_loop, to_stereo, lfo_noise, undb, haas_stereo
from reverb import make_ir
from synth import convolve
from instruments import Note, Piano, UprightBass, Mallet, Wind, StringSection, ReedOrgan
from harmony import Ev, progression, melody
import drums as D
from mixing import compress, master, k_weight


@dataclass
class Part:
    name: str
    inst: object
    events: list
    gain_db: float = 0.0
    pan: float = 0.0
    width: float = 0.0          # haas width for mono sources
    eq: list | None = None
    sends: dict = field(default_factory=dict)   # bus -> dB
    feel_ms: float = 0.0        # +late / -early
    jitter_ms: float = 6.0
    drift_ms: float = 6.0
    vel_jitter: float = 0.05
    swing: bool = True
    pedal: list | None = None   # [(beat_down, beat_up)]
    comp: dict | None = None
    kind: str = ''
    opts: dict = field(default_factory=dict)


class Song:
    def __init__(self, name: str, bpm: float, bars: int, meter: int = 4, swing: float = 0.62,
                 loop: bool = True, tempo=None, pre: float = 4.0, tail: float = 8.0, seed: int = 0,
                 max_len: float | None = None, fade_out: float = 0.6):
        self.name = name
        self.bpm = bpm
        self.bars = bars
        self.meter = meter
        self.swing_ratio = swing
        self.loop = loop
        self.total_beats = bars * meter
        self.tempo = tempo
        self.pre = pre
        self.tail = tail
        self.parts: list[Part] = []
        self.buses: dict = {}
        self.seed = seed
        self.max_len = max_len
        self.fade_out = fade_out
        self.rng = rng('song', name, seed)
        self._time_map()
        self.master_opts = dict(target_rms_db=-20.0, ceiling_db=-1.5, eq=None, glue=1.0, sat=0.0, width=None)

    # ---------------------------------------------------------------- time
    def _time_map(self):
        if self.tempo is None:
            self._spb = 60.0 / self.bpm
            self.Lsec = self.total_beats * self._spb
        else:
            res = 64
            nb = int(self.total_beats * res) + 1
            bb = np.arange(nb) / res
            bpm = np.array([self.tempo(b) for b in bb])
            dt = 60.0 / bpm / res
            self._tb = bb
            self._ts = np.concatenate([[0.0], np.cumsum(dt[:-1])])
            self.Lsec = float(self._ts[-1] + dt[-1])
        self.L = ns(self.Lsec)

    def sec(self, b: float) -> float:
        if self.tempo is None:
            return b * self._spb
        if b < 0:
            return b * 60.0 / self.tempo(0.0)
        if b > self.total_beats:
            return self.Lsec + (b - self.total_beats) * 60.0 / self.tempo(self.total_beats)
        return float(np.interp(b, self._tb, self._ts))

    def swung(self, b: float, ratio: float | None = None) -> float:
        r = self.swing_ratio if ratio is None else ratio
        fb = math.floor(b + 1e-9)
        p = b - fb
        if p <= 0.5:
            q = p * (r / 0.5)
        else:
            q = r + (p - 0.5) * ((1 - r) / 0.5)
        return fb + q

    def beat_times(self, b0: float, b1: float):
        return [self.sec(b) + self.pre for b in np.arange(b0, b1 + 1e-9, 1.0)]

    # ---------------------------------------------------------------- building
    def chords(self, text: str, start: float = 0.0):
        ch = progression(text, self.meter, start)
        self._chords = ch
        return ch

    def bus(self, name: str, ir: str, gain_db: float = 0.0, **over):
        self.buses[name] = dict(ir=ir, gain_db=gain_db, over=over)

    def add(self, name: str, inst, events, **kw) -> Part:
        p = Part(name, inst, list(events), **kw)
        if not p.kind:
            p.kind = self._kind(inst)
        self.parts.append(p)
        return p

    @staticmethod
    def _kind(inst):
        if isinstance(inst, Piano):
            return 'piano'
        if isinstance(inst, UprightBass):
            return 'bass'
        if isinstance(inst, Mallet):
            return 'mallet'
        if isinstance(inst, Wind):
            return 'wind'
        if isinstance(inst, StringSection):
            return 'strings'
        if isinstance(inst, ReedOrgan):
            return 'organ'
        if inst == 'drums':
            return 'drums'
        if inst == 'swirl':
            return 'swirl'
        if callable(inst):
            return 'custom'
        raise ValueError('unknown instrument %r' % (inst,))

    # ---------------------------------------------------------------- render
    def _humanize(self, part: Part):
        r = rng('hum', self.name, part.name, self.seed)
        n_ctl = 4096
        drift = lfo_noise(n_ctl, 0.02 * n_ctl / max(self.Lsec, 1.0), r, periodic=True) if part.drift_ms > 0 else np.zeros(n_ctl)

        def drift_at(t):
            pos = (t / max(self.Lsec, 1e-6)) % 1.0 * n_ctl
            i = int(pos) % n_ctl
            return drift[i] * part.drift_ms / 1000.0
        return r, drift_at

    def _notes(self, part: Part):
        r, drift_at = self._humanize(part)
        out = []
        for e in part.events:
            sw = part.swing and not e.straight
            b_on = self.swung(e.b) if sw else e.b
            b_off = self.swung(e.b + e.d) if sw else e.b + e.d
            t_on = self.sec(b_on)
            t_off = self.sec(b_off)
            off = part.feel_ms / 1000.0 + drift_at(t_on) + r.normal(0, part.jitter_ms / 1000.0)
            if 'roll' in e.fl:
                pass
            dur = max(0.02, t_off - t_on + r.normal(0, part.jitter_ms / 3000.0))
            v = float(np.clip(e.v * (1 + r.normal(0, part.vel_jitter)), 0.03, 1.0))
            nt = Note(t_on + off + self.pre, dur, e.m, v, e.fl)
            if hasattr(e, 'x') and e.x:
                nt.x = dict(e.x)
            if hasattr(e, 'pan') and getattr(e, 'pan') is not None:
                nt.pan = e.pan
            out.append(nt)
        return out

    def _drum_events(self, part: Part):
        r, drift_at = self._humanize(part)
        out = []
        for ev in part.events:
            b, kind, v = ev[0], ev[1], ev[2]
            straight = len(ev) > 3 and ev[3]
            bb = b if (straight or not part.swing) else self.swung(b)
            t = self.sec(bb)
            t += part.feel_ms / 1000.0 + drift_at(t) + r.normal(0, part.jitter_ms / 1000.0)
            vv = float(np.clip(v * (1 + r.normal(0, part.vel_jitter)), 0.03, 1.0))
            out.append((t + self.pre, kind, vv))
        return out

    def render_part(self, part: Part, n_buf: int) -> np.ndarray:
        k = part.kind
        if k == 'drums':
            y = D.render_hits(self._drum_events(part), n_buf, **part.opts)
        elif k == 'swirl':
            bt = self.beat_times(-8, self.total_beats + 16)
            y = D.brush_swirl(n_buf, bt, seed=part.name, **part.opts)
        elif k == 'custom':
            y = part.inst(self, n_buf, part)
        else:
            notes = self._notes(part)
            if k == 'piano':
                ped = [(self.sec(a) + self.pre, self.sec(b) + self.pre) for a, b in (part.pedal or [])]
                y = part.inst.render(notes, n_buf, pedal=ped)
            elif k == 'mallet':
                ped = [(self.sec(a) + self.pre, self.sec(b) + self.pre) for a, b in (part.pedal or [])]
                y = part.inst.render(notes, n_buf, pedal=ped, t_abs0=-self.pre)
            else:
                y = part.inst.render(notes, n_buf)
        if y.ndim == 1:
            y = haas_stereo(y, 11.0, part.width, part.pan) if part.width > 0 else to_stereo(y, part.pan)
        return y

    def render(self, verbose: bool = False):
        pre_n = ns(self.pre)
        n_buf = pre_n + self.L + ns(self.tail)
        L = self.L if self.loop else n_buf - pre_n
        mix = np.zeros((2, L))
        sends = {b: np.zeros((2, L)) for b in self.buses}
        stems = {}
        for part in self.parts:
            y = self.render_part(part, n_buf)
            if self.loop:
                y = fold_loop(y, self.L, pre_n)
            else:
                y = y[:, pre_n:]
            if part.eq:
                y = filt(y, part.eq, circular=self.loop, tail=0.3)
            if part.comp:
                y = compress(y, circular=self.loop, **part.comp)
            y = y * float(undb(part.gain_db))
            if verbose:
                kw = k_weight(y[:, ::2] if y.shape[1] > 400000 else y)
                stems[part.name] = (float(np.sqrt(np.mean(y * y)) + 1e-12), float(np.sqrt(np.mean(kw * kw)) + 1e-12))
            mix += y
            for bname, sdb in part.sends.items():
                sends[bname] += y * float(undb(sdb))
        for bname, cfg in self.buses.items():
            s = sends[bname]
            if not np.any(s):
                continue
            ir = make_ir(cfg['ir'], **cfg['over'])
            wet = convolve(s, ir, circular=self.loop, keep_tail=False)
            mix += wet[:, :L] * float(undb(cfg['gain_db']))
        if verbose:
            tot = np.sqrt(np.mean(mix * mix)) + 1e-12
            kmix = k_weight(mix[:, ::2] if mix.shape[1] > 400000 else mix)
            ktot = np.sqrt(np.mean(kmix * kmix)) + 1e-12
            for k_, (v_, kv) in stems.items():
                print('   stem %-12s rms %6.1f dB   K-weighted %6.1f dB  (rel mix)' % (
                    k_, 20 * math.log10(v_ / tot), 20 * math.log10(kv / ktot)))
        if not self.loop:
            # trim trailing near-silence
            env = np.max(np.abs(mix), axis=0)
            thr = env.max() * 10 ** (-70 / 20)
            last = int(np.nonzero(env > thr)[0][-1]) if np.any(env > thr) else L - 1
            end = min(L, last + ns(0.05))
            if self.max_len is not None:
                end = min(end, ns(self.max_len))
            mix = mix[:, :end]
            f = min(ns(self.fade_out), end // 3)
            mix[:, -f:] *= np.cos(np.linspace(0, np.pi / 2, f)) ** 2
        out = master(mix, circular=self.loop, **self.master_opts)
        if not self.loop:
            a = ns(0.004)
            out[:, :a] *= np.linspace(0, 1, a)
        return out
