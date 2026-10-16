"""Render every character's animation sheets.

Output per character:  public/assets/chars/<id>@<k>.png  (grid of 64x64 frames, 16 columns)
                       public/assets/chars/<id>.json     (animations -> frame indices, fps, loop)
The feet anchor of every frame is at (32, 62).
"""
from __future__ import annotations

import json
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import save_png, out_path
from chars_core import Sprite, limb
from chars_body import side_pose, front_pose, BASE
from chars_draw import draw_side, draw_front
from characters import CHARACTERS

FW, FH = 64, 64
OX, OY = 32, 62
COLS = 16
SIZES = (1.0, 0.86, 0.74)


# --------------------------------------------------------------------- custom poses ----
def pose_side(spec, *, lean=0.0, tA=1.5, kA=4.0, tB=-1.5, kB=4.0, aA=4.0, eA=12.0, aB=-2.0, eB=8.0,
              hip_drop=0.0, head_tilt=0.0):
    H = spec.get('height', 1.0)
    P = {}
    hip = (0.0, BASE['hip'] * H)
    for leg, t, k in (('A', tA, kA), ('B', tB, kB)):
        knee = limb(hip, BASE['thigh'] * H, t)
        ankle = limb(knee, BASE['shin'] * H, t - k)
        P['knee' + leg], P['ankle' + leg] = knee, ankle
    low = min(P['ankleA'][1], P['ankleB'][1])
    dy = 1.4 - low
    for k in list(P):
        P[k] = (P[k][0], P[k][1] + dy)
    hip = (hip[0], hip[1] + dy)
    P['hip'] = hip
    ly = (BASE['shoulder'] - BASE['hip']) * H
    sh = (hip[0] + math.sin(math.radians(lean)) * ly, hip[1] + math.cos(math.radians(lean)) * ly)
    P['shoulder'] = sh
    P['neck'] = (sh[0] + .4 + math.sin(math.radians(lean)) * 2.2, sh[1] + 2.2 * math.cos(math.radians(lean)))
    hl = math.radians(lean + head_tilt)
    P['head'] = (P['neck'][0] + .5 + math.sin(hl) * 4.0, P['neck'][1] + 4.3 * math.cos(hl))
    for arm, a, e in (('A', aA, eA), ('B', aB, eB)):
        el = limb(sh, BASE['uarm'] * H, a)
        wr = limb(el, BASE['farm'] * H, a + e)
        P['elbow' + arm], P['wrist' + arm] = el, wr
    return P


def pose_sit_side(spec, arms='lap', seat=13.0):
    H = spec.get('height', 1.0)
    P = {}
    hip = (0.0, seat)
    P['hip'] = hip
    for leg, dx in (('A', 0.0), ('B', -.6)):
        knee = (hip[0] + BASE['thigh'] * H * .95 + dx, seat + .6)
        ankle = (knee[0] + .8, 1.4)
        P['knee' + leg], P['ankle' + leg] = knee, ankle
    ly = (BASE['shoulder'] - BASE['hip']) * H
    sh = (hip[0] + .4, hip[1] + ly)
    P['shoulder'] = sh
    P['neck'] = (sh[0] + .6, sh[1] + 2.2)
    P['head'] = (P['neck'][0] + .6, P['neck'][1] + 4.3)
    if arms == 'lap':
        aa, ea = 25, 55
    elif arms == 'forward':   # piano keys / typewriter
        aa, ea = 35, 50
    else:
        aa, ea = 10, 30
    for arm, a, e in (('A', aa, ea), ('B', aa - 6, ea + 4)):
        el = limb(sh, BASE['uarm'] * H, a)
        wr = limb(el, BASE['farm'] * H, a + e)
        P['elbow' + arm], P['wrist' + arm] = el, wr
    return P


def pose_sit_front(spec, seat=13.0):
    H = spec.get('height', 1.0)
    P = front_pose(None, spec)
    d = BASE['hip'] * H - seat
    for k in list(P):
        if isinstance(P[k], tuple):
            P[k] = (P[k][0], P[k][1] - d)
    hw = 2.0 * spec.get('build', 1.0)
    for side, sx in (('L', -1), ('R', 1)):
        P['knee' + side] = (sx * hw * 1.25, seat - 3.6)
        P['ankle' + side] = (sx * hw * 1.2, 1.4)
        P['footz' + side] = 1.0
    P['lap'] = seat   # thighs point at the viewer: draw their lit tops as a lap
    for side, sx in (('L', -1), ('R', 1)):   # hands resting on the knees
        sh = P['shoulder' + side]
        P['elbow' + side] = (sh[0] + sx * .9, sh[1] - 6.2)
        P['wrist' + side] = (sx * hw * 1.15, seat - 2.0)
    return P


def front_reach(spec, up=True):
    P = front_pose(None, spec, back=True)
    sh = P['shoulderR']
    P['elbowR'] = (sh[0] + .8, sh[1] + 5.0 if up else sh[1] - 2)
    P['wristR'] = (sh[0] + .2, sh[1] + 11.0 if up else sh[1] - 6)
    return P


# --------------------------------------------------------------------- frame drawing ----
def frame(spec, k, view, P, talk=0, blink=False, rot=0.0, pivot=(0, 0), shift=(0, 0)):
    sp = Sprite(FW, FH, OX, OY, k=k)
    sp.rot_deg = rot
    sp.pivot = pivot
    sp.shift = shift
    if view == 'side':
        draw_side(sp, P, spec, talk=talk, blink=blink)
    elif view == 'front':
        draw_front(sp, P, spec, talk=talk, blink=blink)
    else:
        draw_front(sp, P, spec, back=True)
    return sp.render()


def anims_for(spec, k):
    """Return dict anim -> (list of frames, fps, loop)."""
    kind = spec.get('kind', 'stander')
    A = {}
    idle_s = pose_side(spec)
    idle_f = front_pose(None, spec)
    if kind in ('player', 'walker'):
        A['walk_side'] = ([frame(spec, k, 'side', side_pose(i / 8, spec=spec)) for i in range(8)], 10, True)
        A['walk_down'] = ([frame(spec, k, 'front', front_pose(i / 6, spec)) for i in range(6)], 8, True)
        A['walk_up'] = ([frame(spec, k, 'back', front_pose(i / 6, spec, back=True)) for i in range(6)], 8, True)
        A['idle_up'] = ([frame(spec, k, 'back', front_pose(None, spec, back=True))], 1, True)
    if kind != 'sitter':
        A['idle_side'] = ([frame(spec, k, 'side', idle_s), frame(spec, k, 'side', idle_s, blink=True)], 1, True)
        A['idle_down'] = ([frame(spec, k, 'front', idle_f), frame(spec, k, 'front', idle_f, blink=True)], 1, True)
        A['talk_side'] = ([frame(spec, k, 'side', idle_s, talk=t) for t in (1, 2, 0, 2)], 8, True)
        A['talk_down'] = ([frame(spec, k, 'front', idle_f, talk=t) for t in (1, 2, 0, 2)], 8, True)
        gest = pose_side(spec, aA=55, eA=-40)
        A['gesture_side'] = ([frame(spec, k, 'side', gest, talk=t) for t in (1, 2, 0)], 6, False)
    else:
        arms = spec.get('sit_arms', 'lap')
        view = spec.get('sit_view', 'side')
        if view == 'side':
            P = pose_sit_side(spec, arms)
            A['idle_side'] = ([frame(spec, k, 'side', P), frame(spec, k, 'side', P, blink=True)], 1, True)
            A['talk_side'] = ([frame(spec, k, 'side', P, talk=t) for t in (1, 2, 0, 2)], 8, True)
            if arms == 'forward':   # playing/typing: hands bob
                fr = []
                for i in range(4):
                    Q = dict(P)
                    for arm, off in (('A', i % 2), ('B', (i + 1) % 2)):
                        w = Q['wrist' + arm]
                        Q['wrist' + arm] = (w[0], w[1] + .8 * off)
                    fr.append(frame(spec, k, 'side', Q))
                A['play_side'] = (fr, 6, True)
        else:
            P = pose_sit_front(spec)
            A['idle_down'] = ([frame(spec, k, 'front', P), frame(spec, k, 'front', P, blink=True)], 1, True)
            A['talk_down'] = ([frame(spec, k, 'front', P, talk=t) for t in (1, 2, 0, 2)], 8, True)
    if kind == 'player':
        A['reach_side'] = ([frame(spec, k, 'side', pose_side(spec, aA=45, eA=10)),
                            frame(spec, k, 'side', pose_side(spec, aA=80, eA=5))], 8, False)
        A['pickup_side'] = ([frame(spec, k, 'side', pose_side(spec, lean=18, tA=30, kA=40, tB=-5, kB=30, aA=30, eA=20)),
                             frame(spec, k, 'side', pose_side(spec, lean=38, tA=55, kA=95, tB=10, kB=80, aA=45, eA=10))],
                            8, False)
        A['use_up'] = ([frame(spec, k, 'back', front_reach(spec, False)), frame(spec, k, 'back', front_reach(spec, True))],
                       6, False)
        A['use_down'] = ([frame(spec, k, 'front', front_pose(None, spec))], 6, False)
        # waking up: lying on the back -> sitting -> kneeling -> standing
        lie = pose_side(spec, tA=0, kA=0, tB=-2, kB=0, aA=10, eA=10, aB=-6, eB=12)
        sit = pose_side(spec, lean=-8, tA=88, kA=10, tB=86, kB=20, aA=-20, eA=10)
        kneel = pose_side(spec, lean=8, tA=60, kA=95, tB=-10, kB=100, aA=25, eA=20)
        A['wake'] = ([frame(spec, k, 'side', lie, rot=90, pivot=(0, BASE['hip']), shift=(-6, -18)),
                      frame(spec, k, 'side', sit, shift=(-4, -9)),
                      frame(spec, k, 'side', kneel, shift=(0, -4)),
                      frame(spec, k, 'side', idle_s)], 3, False)
        A['lie'] = ([frame(spec, k, 'side', lie, rot=90, pivot=(0, BASE['hip']), shift=(-6, -18))], 1, True)
        A['shiver_side'] = ([frame(spec, k, 'side', pose_side(spec, aA=30, eA=95, aB=26, eB=95)),
                             frame(spec, k, 'side', pose_side(spec, aA=30, eA=95, aB=26, eB=95, head_tilt=4))], 8, True)
    if spec.get('lies'):   # lying down (e.g. on a bunk), and talking while lying there
        lie = pose_side(spec, tA=0, kA=0, tB=-2, kB=0, aA=10, eA=10, aB=-6, eB=12)
        rot = dict(rot=90, pivot=(0, BASE['hip']), shift=(1, -18))
        A['lie'] = ([frame(spec, k, 'side', lie, **rot), frame(spec, k, 'side', lie, blink=True, **rot)], 1, True)
        A['lie_talk'] = ([frame(spec, k, 'side', lie, talk=t, **rot) for t in (1, 2, 0, 2)], 8, True)
    if spec.get('aim'):
        A['aim_side'] = ([frame(spec, k, 'side', pose_side(spec, aA=88, eA=2))], 1, True)
    if spec.get('slump'):
        A['slump_down'] = ([frame(spec, k, 'front', pose_sit_front(spec, seat=9))], 1, True)
    return A


def build_char(cid, spec):
    folder = out_path('chars')
    os.makedirs(folder, exist_ok=True)
    meta = {'id': cid, 'frameW': FW, 'frameH': FH, 'anchorX': OX, 'anchorY': OY, 'sizes': [], 'anims': {}}
    for k in (SIZES if spec.get('sizes', True) else (1.0,)):
        A = anims_for(spec, k)
        frames = []
        index = {}
        for name, (fr, fps, loop) in A.items():
            index[name] = (list(range(len(frames), len(frames) + len(fr))), fps, loop)
            frames.extend(fr)
        rows = (len(frames) + COLS - 1) // COLS
        sheet = np.zeros((rows * FH, COLS * FW, 4), np.uint8)
        for i, f in enumerate(frames):
            r, c = divmod(i, COLS)
            sheet[r * FH:(r + 1) * FH, c * FW:(c + 1) * FW] = f
        tag = f'{int(round(k * 100))}'
        save_png(sheet, os.path.join(folder, f'{cid}@{tag}.png'))
        meta['sizes'].append({'k': k, 'file': f'chars/{cid}@{tag}.png'})
        meta['anims'] = {n: {'frames': fr, 'fps': fps, 'loop': loop} for n, (fr, fps, loop) in index.items()}
    meta['color'] = spec.get('color', '#ffffff')
    with open(os.path.join(folder, f'{cid}.json'), 'w') as f:
        json.dump(meta, f)


def main(only=None):
    ids = only or list(CHARACTERS)
    for cid in ids:
        build_char(cid, CHARACTERS[cid])
    with open(out_path('chars', 'index.json'), 'w') as f:
        json.dump(sorted(CHARACTERS), f)


if __name__ == '__main__':
    main(sys.argv[1:] or None)
