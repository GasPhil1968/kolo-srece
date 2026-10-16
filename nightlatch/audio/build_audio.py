#!/usr/bin/env python3
"""Render, verify and encode all NIGHT LATCH audio.

    cd nightlatch && python3 audio/build_audio.py            # everything
    python3 audio/build_audio.py title harbor footstep_wood_1  # selected ids
    python3 audio/build_audio.py music | amb | sfx             # a whole category
    options: --jobs N (parallel workers, default = CPU count), --list

Outputs
  public/assets/audio/{music,amb,sfx}/<id>.mp3   (44.1 kHz; music stereo V4, amb V5, sfx mono V4)
  public/assets/audio/manifest.json              (file, duration, loop, volume, samples)
  audio/REPORT.md                                (per-asset duration, peak, RMS, loudness, seam checks)
  audio/cache/wav/<cat>/<id>.wav                 (16-bit intermediate renders, gitignored)
  audio/cache/analysis/<id>.json                 (decoded-file measurements, gitignored)
"""
from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys
import time
import wave
from concurrent.futures import ProcessPoolExecutor, as_completed

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import numpy as np  # noqa: E402

ROOT = os.path.normpath(os.path.join(HERE, '..'))
OUT = os.path.join(ROOT, 'public', 'assets', 'audio')
CACHE = os.path.join(HERE, 'cache')
SR = 44100
FFMPEG = os.environ.get('FFMPEG', '/usr/bin/ffmpeg' if os.path.exists('/usr/bin/ffmpeg') else 'ffmpeg')

MUSIC = {
    # id: (module, function)
    'title': ('music_main', 'title'), 'ending': ('music_main', 'ending'), 'chapter': ('music_main', 'chapter'),
    'stinger_clue': ('music_main', 'stinger_clue'), 'stinger_danger': ('music_main', 'stinger_danger'),
    'locked': ('music_world', 'locked'), 'office': ('music_world', 'office'), 'lantern': ('music_world', 'lantern'),
    'lullaby': ('music_world', 'lullaby'), 'city': ('music_world', 'city'),
    'harbor': ('music_world2', 'harbor'), 'halcyon': ('music_world2', 'halcyon'), 'bureau': ('music_world2', 'bureau'),
    'sorrow': ('music_world2', 'sorrow'), 'revelation': ('music_world2', 'revelation'),
    'finale': ('music_world2', 'finale'),
}

# in-game loudness targets (LUFS after applying the manifest volume)
TARGET = {'music': -23.0, 'sting': -21.0, 'amb': -31.0}
QUALITY = {'music': 4, 'amb': 5, 'sfx': 4}


def amb_ids():
    import ambience
    return list(ambience.AMB)


def sfx_ids():
    import sfx
    return list(sfx.SFX)


def all_assets():
    out = [('music', k) for k in MUSIC]
    out += [('amb', k) for k in amb_ids()]
    out += [('sfx', k) for k in sfx_ids()]
    return out


# ----------------------------------------------------------------------------- render
def render(cat: str, aid: str):
    """Return (float array (ch, n), loop flag, meta)."""
    if cat == 'music':
        import importlib
        mod, fn = MUSIC[aid]
        m = importlib.import_module(mod)
        song = getattr(m, fn)()
        y = song.render()
        meta = {'bpm': song.bpm, 'bars': song.bars, 'meter': song.meter,
                'warnings': list(getattr(m, 'WARN', []))}
        return y, song.loop, meta
    if cat == 'amb':
        import ambience
        y = ambience.AMB[aid]()
        return y, True, {}
    import sfx
    import foley
    y = sfx.SFX[aid]()
    y = sfx.trim(y, -50.0, sfx.MAXLEN.get(aid), fade=0.08 if aid in sfx.MAXLEN else 0.03)
    y = foley.safe(np.asarray(y, float), fin=0.0015, fout=0.008)
    y = foley.norm(y, -1.0)
    return y[None, :], False, {'role': sfx.ROLE_OF[aid]}


def write_wav16(path: str, y: np.ndarray) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    r = np.random.default_rng(0)
    d = (r.random(y.shape) - r.random(y.shape)) / 32768.0  # TPDF dither
    q = np.clip(np.round((y + d) * 32767.0), -32768, 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(y.shape[0])
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(q.T.tobytes())


def encode(y: np.ndarray, path: str, quality: int) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    ch = y.shape[0]
    raw = np.ascontiguousarray(y.T.astype('<f4')).tobytes()
    cmd = [FFMPEG, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', str(ch), '-i', 'pipe:0',
           '-c:a', 'libmp3lame', '-q:a', str(quality), '-ar', str(SR), '-ac', str(ch),
           '-map_metadata', '-1', '-id3v2_version', '0', '-write_id3v1', '0', path]
    subprocess.run(cmd, input=raw, check=True)


def decode(path: str, ch: int) -> np.ndarray:
    cmd = [FFMPEG, '-v', 'error', '-i', path, '-f', 'f32le', '-ac', str(ch), '-ar', str(SR), 'pipe:1']
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype='<f4').reshape(-1, ch).T.astype(float)


# ----------------------------------------------------------------------------- analysis
def analyse(y: np.ndarray, loop: bool) -> dict:
    from mixing import loudness
    a = {}
    a['finite'] = bool(np.all(np.isfinite(y)))
    pk = float(np.max(np.abs(y)))
    a['peak_dbfs'] = round(20 * math.log10(pk + 1e-12), 2)
    a['rms_dbfs'] = round(20 * math.log10(float(np.sqrt(np.mean(y * y))) + 1e-12), 2)
    a['lufs'] = round(loudness(y), 2)
    a['dc'] = float(np.max(np.abs(np.mean(y, axis=1))))
    d1 = np.abs(np.diff(y, axis=1))
    p999 = float(np.percentile(d1, 99.9)) + 1e-12
    if loop:
        jump = float(np.max(np.abs(y[:, 0] - y[:, -1])))
        a['seam_jump_ratio'] = round(jump / p999, 3)
        # second-difference (click) energy across the seam vs the whole file
        w = 64
        z = np.concatenate([y[:, -w:], y[:, :w]], axis=1)
        d2s = float(np.max(np.abs(np.diff(z, 2, axis=1))))
        d2 = float(np.percentile(np.abs(np.diff(y, 2, axis=1)), 99.9)) + 1e-12
        a['seam_click_ratio'] = round(d2s / d2, 3)
        k = int(0.05 * SR)
        rh = float(np.sqrt(np.mean(y[:, :k] ** 2))) + 1e-12
        rt = float(np.sqrt(np.mean(y[:, -k:] ** 2))) + 1e-12
        a['seam_rms_delta_db'] = round(20 * math.log10(rh / rt), 2)
        # RMS continuity on a 10 ms grid around the seam compared with the typical step
        g = int(0.01 * SR)
        nb = y.shape[1] // g
        blk = np.sqrt(np.mean(y[:, :nb * g].reshape(y.shape[0], nb, g) ** 2, axis=(0, 2))) + 1e-9
        steps = np.abs(np.diff(20 * np.log10(blk)))
        a['seam_rms_step_db'] = round(float(abs(20 * math.log10(blk[0] / blk[-1]))), 2)
        a['typ_rms_step_db_p95'] = round(float(np.percentile(steps, 95)), 2)
    else:
        a['start_abs'] = float(np.max(np.abs(y[:, :8])))
        a['end_abs'] = float(np.max(np.abs(y[:, -8:])))
    return a


def volume_for(cat: str, aid: str, lufs: float, meta: dict) -> float:
    if cat == 'sfx':
        import sfx
        tgt = sfx.ROLE[meta.get('role', 'medium')]
    elif cat == 'music' and aid in ('chapter', 'stinger_clue', 'stinger_danger'):
        tgt = TARGET['sting']
    else:
        tgt = TARGET[cat]
    v = 10 ** ((tgt - lufs) / 20.0)
    return round(float(min(1.0, max(0.05, v))), 2)


# ----------------------------------------------------------------------------- one asset
def build_one(cat: str, aid: str) -> dict:
    t0 = time.time()
    y, loop, meta = render(cat, aid)
    y = np.asarray(y, float)
    if not np.all(np.isfinite(y)):
        raise RuntimeError('%s: non-finite samples' % aid)
    if cat == 'amb':
        from mixing import limit
        y = limit(y, -1.5, circular=True)
    pk = np.max(np.abs(y))
    if pk > 10 ** (-1.5 / 20):
        y *= 10 ** (-1.5 / 20) / pk
    write_wav16(os.path.join(CACHE, 'wav', cat, aid + '.wav'), y)
    mp3 = os.path.join(OUT, cat, aid + '.mp3')
    q = QUALITY[cat]
    for attempt in range(4):
        encode(y, mp3, q)
        dec = decode(mp3, y.shape[0])
        dpk = 20 * math.log10(float(np.max(np.abs(dec))) + 1e-12)
        if dpk <= -1.0:
            break
        y *= 10 ** ((-1.1 - dpk) / 20)
    a = analyse(dec, loop)
    a['samples_src'] = int(y.shape[1])
    a['samples_dec'] = int(dec.shape[1])
    a['length_ok'] = a['samples_src'] == a['samples_dec']
    a['duration'] = round(dec.shape[1] / SR, 3)
    a['loop'] = bool(loop)
    a['channels'] = int(y.shape[0])
    a['bytes'] = os.path.getsize(mp3)
    a['category'] = cat
    a['id'] = aid
    a['volume'] = volume_for(cat, aid, a['lufs'], meta)
    a['meta'] = meta
    a['render_s'] = round(time.time() - t0, 1)
    os.makedirs(os.path.join(CACHE, 'analysis'), exist_ok=True)
    with open(os.path.join(CACHE, 'analysis', '%s_%s.json' % (cat, aid)), 'w') as fh:
        json.dump(a, fh, indent=1)
    return a


def _worker(job):
    cat, aid = job
    try:
        return build_one(cat, aid)
    except Exception as e:  # report and continue with the other assets
        import traceback
        traceback.print_exc()
        return {'id': aid, 'category': cat, 'error': repr(e)}


# ----------------------------------------------------------------------------- manifest & report
def load_analyses(assets):
    res = {}
    for cat, aid in assets:
        p = os.path.join(CACHE, 'analysis', '%s_%s.json' % (cat, aid))
        if os.path.exists(p):
            with open(p) as fh:
                res[(cat, aid)] = json.load(fh)
    return res


def write_manifest(assets, an):
    man = {'music': {}, 'amb': {}, 'sfx': {}}
    for cat, aid in assets:
        a = an.get((cat, aid))
        if not a or 'error' in a:
            continue
        man[cat][aid] = {'file': '%s/%s.mp3' % (cat, aid), 'duration': a['duration'], 'loop': a['loop'],
                         'volume': a['volume'], 'samples': a['samples_dec']}
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'manifest.json'), 'w') as fh:
        json.dump(man, fh, indent=1)
    return man


def write_report(assets, an):
    lines = ['# NIGHT LATCH — audio build report', '',
             'Generated by `audio/build_audio.py`. Every value below is measured on the **decoded MP3** '
             '(ffmpeg, gapless LAME header honoured), not on the pre-encode render.', '',
             '* **peak** = sample peak dBFS (must be <= -1.0); **RMS** dBFS; **LUFS** = BS.1770-style integrated '
             'loudness (K-weighted, gated).',
             '* Loop seam columns (loops only): **jump** = |x[0]-x[N-1]| divided by the 99.9th percentile of '
             'sample-to-sample steps in the file (< 1 means the wrap is an ordinary step); **click** = largest '
             'second difference within 64 samples of the seam / 99.9th percentile of the file; **dRMS** = RMS '
             'change between the last and first 10 ms block vs. the p95 block-to-block change in the file.',
             '* **len** = decoded sample count equals the rendered sample count (gapless).',
             '* One-shots list the absolute sample value at the very start/end (should be ~0: no clicks).', '']
    total = 0
    problems = []
    for cat, title in (('music', 'Music'), ('amb', 'Ambience'), ('sfx', 'Sound effects')):
        lines += ['## %s' % title, '']
        if cat == 'sfx':
            lines += ['| id | dur s | peak | RMS | LUFS | start/end | len | KB | volume |',
                      '|---|---:|---:|---:|---:|---|---|---:|---:|']
        else:
            lines += ['| id | dur s | loop | peak | RMS | LUFS | seam jump | seam click | dRMS (p95) | len | KB | volume |',
                      '|---|---:|---|---:|---:|---:|---:|---:|---|---|---:|---:|']
        for c, aid in assets:
            if c != cat:
                continue
            a = an.get((c, aid))
            if not a:
                lines.append('| %s | (not built) |' % aid)
                continue
            if 'error' in a:
                lines.append('| %s | ERROR %s |' % (aid, a['error']))
                problems.append(aid + ': ' + a['error'])
                continue
            total += a['bytes']
            ok_len = 'ok' if a['length_ok'] else 'MISMATCH'
            if a['peak_dbfs'] > -1.0:
                problems.append('%s peak %.2f' % (aid, a['peak_dbfs']))
            if not a['finite']:
                problems.append('%s non-finite' % aid)
            if not a['length_ok']:
                problems.append('%s length mismatch' % aid)
            if cat == 'sfx':
                lines.append('| %s | %.2f | %.1f | %.1f | %.1f | %.4f / %.4f | %s | %.0f | %.2f |' % (
                    aid, a['duration'], a['peak_dbfs'], a['rms_dbfs'], a['lufs'], a['start_abs'], a['end_abs'],
                    ok_len, a['bytes'] / 1024, a['volume']))
            elif a['loop']:
                if a['seam_jump_ratio'] > 1.0 or a['seam_click_ratio'] > 1.5:
                    problems.append('%s seam jump %.2f click %.2f' % (aid, a['seam_jump_ratio'], a['seam_click_ratio']))
                lines.append('| %s | %.2f | yes | %.1f | %.1f | %.1f | %.3f | %.3f | %.2f (%.2f) dB | %s | %.0f | %.2f |' % (
                    aid, a['duration'], a['peak_dbfs'], a['rms_dbfs'], a['lufs'], a['seam_jump_ratio'],
                    a['seam_click_ratio'], a['seam_rms_step_db'], a['typ_rms_step_db_p95'], ok_len, a['bytes'] / 1024,
                    a['volume']))
            else:
                lines.append('| %s | %.2f | no | %.1f | %.1f | %.1f | start %.4f | end %.4f | — | %s | %.0f | %.2f |' % (
                    aid, a['duration'], a['peak_dbfs'], a['rms_dbfs'], a['lufs'], a['start_abs'], a['end_abs'],
                    ok_len, a['bytes'] / 1024, a['volume']))
        lines.append('')
    lines += ['## Totals', '', '* Encoded size: **%.2f MB** across %d files.' % (total / 1048576, len(an)), '']
    lines += ['## Checks', '']
    if problems:
        lines += ['* PROBLEMS:'] + ['  * ' + p for p in problems]
    else:
        lines += ['* All files finite, peak <= -1 dBFS, decoded length == rendered length, loop seams continuous.']
    warns = [w for a in an.values() for w in (a.get('meta') or {}).get('warnings', [])]
    if warns:
        lines += ['', '### Composition notes (intentional passing tones flagged by the harmony checker)', '']
        lines += ['* ' + w for w in sorted(set(warns))]
    with open(os.path.join(HERE, 'REPORT.md'), 'w') as fh:
        fh.write('\n'.join(lines) + '\n')
    return total, problems


# ----------------------------------------------------------------------------- main
def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('ids', nargs='*', help='asset ids or categories (music, amb, sfx); default: everything')
    ap.add_argument('--jobs', type=int, default=os.cpu_count() or 2)
    ap.add_argument('--list', action='store_true')
    args = ap.parse_args(argv)
    assets = all_assets()
    if args.list:
        for cat, aid in assets:
            print(cat, aid)
        return 0
    if args.ids:
        sel = []
        known = {aid for _, aid in assets}
        for x in args.ids:
            if x in ('music', 'amb', 'sfx'):
                sel += [a for a in assets if a[0] == x]
            elif x in known:
                sel += [a for a in assets if a[1] == x]
            else:
                print('unknown asset id %r (use --list)' % x, file=sys.stderr)
                return 2
    else:
        sel = assets
    # longest jobs first for load balancing
    weight = {'music': 3, 'amb': 2, 'sfx': 1}
    sel = sorted(dict.fromkeys(sel), key=lambda a: -weight[a[0]])
    t0 = time.time()
    results = []
    if args.jobs <= 1 or len(sel) == 1:
        for job in sel:
            results.append(_worker(job))
            _progress(results[-1])
    else:
        with ProcessPoolExecutor(max_workers=args.jobs) as ex:
            futs = [ex.submit(_worker, j) for j in sel]
            for f in as_completed(futs):
                results.append(f.result())
                _progress(results[-1])
    an = load_analyses(assets)
    write_manifest(assets, an)
    total, problems = write_report(assets, an)
    print('built %d asset(s) in %.0fs; library size %.2f MB; problems: %d' % (
        len(results), time.time() - t0, total / 1048576, len(problems)))
    for p in problems:
        print('  !', p)
    return 1 if any('error' in r for r in results) else 0


def _progress(a):
    if 'error' in a:
        print('  FAILED %-22s %s' % (a['id'], a['error']), flush=True)
    else:
        print('  %-6s %-22s %6.2fs  peak %6.2f  rms %6.2f  lufs %6.2f  %s  (%.0fs)' % (
            a['category'], a['id'], a['duration'], a['peak_dbfs'], a['rms_dbfs'], a['lufs'],
            ('seam %.2f/%.2f' % (a['seam_jump_ratio'], a['seam_click_ratio'])) if a['loop'] else 'one-shot',
            a['render_s']), flush=True)


if __name__ == '__main__':
    sys.exit(main())
