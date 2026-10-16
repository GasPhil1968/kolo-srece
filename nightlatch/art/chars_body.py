"""Human figure model: poses (side/front/back), gait, costumes."""
from __future__ import annotations

import math

from chars_core import Sprite, limb, rot

# ------------------------------------------------------------------------- poses ----
# All coordinates in final pixels, origin at the feet, y up.  Side view faces +x.

BASE = dict(hip=23.0, shoulder=39.0, neck=41.2, head=45.6, thigh=11.2, shin=10.6, uarm=8.2, farm=7.6)


def side_pose(phase=None, *, lean=0.0, bob=True, arm_swing=1.0, stride=1.0, spec=None):
    """Walk pose at phase in [0,1) or idle (phase=None)."""
    s = spec or {}
    H = s.get('height', 1.0)
    P = {}
    if phase is None:
        tA, tB, kA, kB = 1.5, -1.5, 4.0, 4.0
        aA, aB, eA, eB = 4.0, -2.0, 12.0, 8.0
        bobv = 0.0
    else:
        w = 2 * math.pi * phase
        tA = 24 * stride * math.sin(w)
        tB = -tA
        kA = 6 + 42 * max(0.0, math.sin(w + 1.15)) ** 1.6 * stride
        kB = 6 + 42 * max(0.0, math.sin(w + 1.15 + math.pi)) ** 1.6 * stride
        aA = -20 * arm_swing * math.sin(w)
        aB = -aA
        eA = 14 + 10 * max(0.0, -math.sin(w))
        eB = 14 + 10 * max(0.0, math.sin(w))
        bobv = 0.7 * math.cos(2 * w) if bob else 0.0
    hip = (0.0, BASE['hip'] * H)
    thigh, shin = BASE['thigh'] * H, BASE['shin'] * H
    for leg, t, k in (('A', tA, kA), ('B', tB, kB)):
        knee = limb(hip, thigh, t)
        ankle = limb(knee, shin, t - k)
        P['knee' + leg] = knee
        P['ankle' + leg] = ankle
    # ground the lowest foot
    low = min(P['ankleA'][1], P['ankleB'][1])
    dy = 1.4 - low
    for k in list(P):
        P[k] = (P[k][0], P[k][1] + dy)
    hip = (hip[0], hip[1] + dy)
    P['hip'] = hip
    # torso
    ly = BASE['shoulder'] * H - BASE['hip'] * H
    shoulder = (hip[0] + math.sin(math.radians(lean)) * ly, hip[1] + math.cos(math.radians(lean)) * ly)
    P['shoulder'] = shoulder
    P['neck'] = (shoulder[0] + .4 + math.sin(math.radians(lean)) * 2.2, shoulder[1] + 2.2)
    P['head'] = (P['neck'][0] + .5 + math.sin(math.radians(lean)) * 4, P['neck'][1] + 4.3)
    ua, fa = BASE['uarm'] * H, BASE['farm'] * H
    for arm, a, e in (('A', aA, eA), ('B', aB, eB)):
        el = limb(shoulder, ua, a + lean)
        wr = limb(el, fa, a + e + lean)
        P['elbow' + arm] = el
        P['wrist' + arm] = wr
    P['bob'] = bobv
    P['phase'] = phase
    return P


def front_pose(phase=None, spec=None, back=False):
    s = spec or {}
    H = s.get('height', 1.0)
    P = {}
    hw = 2.0 * s.get('build', 1.0)
    if phase is None:
        liftL = liftR = 0.0
        fwdL = fwdR = 0.0
        armL = armR = 0.0
        bob = 0.0
    else:
        w = 2 * math.pi * phase
        liftL = max(0.0, math.sin(w)) * 2.2
        liftR = max(0.0, -math.sin(w)) * 2.2
        fwdL = -math.cos(w) * 1.2
        fwdR = math.cos(w) * 1.2
        armL = math.cos(w) * 1.3
        armR = -armL
        bob = .6 * abs(math.cos(w)) - .3
    hipy = BASE['hip'] * H + bob
    P['hipL'] = (-hw, hipy)
    P['hipR'] = (hw, hipy)
    for side, sx, lift, fwd in (('L', -1, liftL, fwdL), ('R', 1, liftR, fwdR)):
        ank = (sx * hw * 1.05, 1.4 + lift + fwd * (0.6 if not back else -0.6))
        knee = (sx * hw * 1.0 + sx * .15 * lift, (hipy + ank[1]) / 2 + .6 + lift * .3)
        P['knee' + side] = knee
        P['ankle' + side] = ank
        P['footz' + side] = fwd if not back else -fwd
    sh = BASE['shoulder'] * H + bob
    sw = 5.3 * s.get('build', 1.0)
    P['shoulderL'] = (-sw, sh)
    P['shoulderR'] = (sw, sh)
    for side, sx, a in (('L', -1, armL), ('R', 1, armR)):
        el = (sx * (sw + .7), sh - BASE['uarm'] * H + .4 + (a * .35 if not back else -a * .35))
        wr = (sx * (sw + .5), el[1] - BASE['farm'] * H + .6 + a * .6 * (1 if not back else -1))
        P['elbow' + side] = el
        P['wrist' + side] = wr
    P['neck'] = (0.0, sh + 2.2)
    P['head'] = (0.0, sh + 6.6)
    P['bob'] = bob
    return P


# ------------------------------------------------------------------- costume parts ----
def shoe_side(sp: Sprite, ankle, toe_dir, ramp, base, part=None):
    part = part or sp.new_part(ramp, 2)
    ax, ay = ankle
    tx = ax + 3.6 * toe_dir
    pts = [(ax - 1.4 * toe_dir, ay + .6), (ax - 1.5 * toe_dir, ay - 1.4), (tx + .4 * toe_dir, ay - 1.4),
           (tx + .3 * toe_dir, ay - .3), (ax + 1.4 * toe_dir, ay + .8)]
    sp.poly(part, pts, base=base, shade_k=.1)
    return part


def head_side(sp: Sprite, P, spec, facing=1, talk=0, blink=False):
    skin = spec.get('skin', 'skin')
    hx, hy = P['head']
    neck = sp.new_part(skin, 1)
    sp.capsule(neck, (P['neck'][0] - .2, P['neck'][1] - 1.8), (P['neck'][0], P['neck'][1] + 1.0), 1.4, base=.42)
    hp = sp.new_part(skin, 1)
    sp.ellipse(hp, (hx, hy), 3.6 * spec.get('headw', 1), 4.2, base=.6, shade_k=.22)
    # jaw / chin forward
    sp.poly(hp, [(hx - 1.5, hy - 3.2), (hx + 2.7, hy - 3.6), (hx + 3.5, hy - 2.0), (hx + 3.4, hy + .5), (hx, hy + 1)],
            base=.58)
    # nose
    sp.poly(hp, [(hx + 3.2, hy + .9), (hx + 4.5, hy - .6), (hx + 3.3, hy - .9)], base=.6)
    # hair
    hs = spec.get('hair_style', 'short')
    hr = spec.get('hair', 'black')
    if hs != 'bald':
        hpart = sp.new_part(hr, 1)
        if hs in ('short', 'slick'):
            sp.poly(hpart, [(hx - 3.5, hy + 2.6), (hx + 1.2, hy + 4.3), (hx + 2.8, hy + 3.2), (hx + .6, hy + 2.8),
                            (hx - 1.0, hy + 1.6), (hx - 1.4, hy - 1.6), (hx - 3.0, hy - 2.4), (hx - 3.6, hy)],
                    base=.45)
        elif hs == 'wave':   # women's 40s waves to the shoulder
            sp.poly(hpart, [(hx - 3.8, hy + 2.8), (hx + 1.6, hy + 4.6), (hx + 3.6, hy + 2.6), (hx + 1.0, hy + 2.6),
                            (hx - .8, hy + 1.2), (hx - 1.0, hy - 2.0), (hx - .2, hy - 4.6), (hx - 3.6, hy - 5.4),
                            (hx - 4.4, hy - 2.0)], base=.5)
        elif hs == 'bun':
            sp.poly(hpart, [(hx - 3.6, hy + 2.6), (hx + 1.4, hy + 4.3), (hx + 3.0, hy + 2.8), (hx + .6, hy + 2.8),
                            (hx - 1.0, hy + 1.6), (hx - 1.4, hy - 1.6), (hx - 3.2, hy - 1.2)], base=.55)
            sp.ellipse(hpart, (hx - 3.6, hy + 1.6), 1.8, 1.8, base=.5)
        elif hs == 'veil':
            sp.poly(hpart, [(hx - 4.4, hy + 4.4), (hx + 2.4, hy + 4.6), (hx + 2.6, hy + 2.6), (hx + 1.6, hy + 2.6),
                            (hx + 1.2, hy - 2.6), (hx - 1.0, hy - 5.8), (hx - 5.0, hy - 7.0), (hx - 4.8, hy)],
                    base=.35)
    # ear
    if hs not in ('veil',):
        ear = sp.new_part(skin, 0)
        sp.ellipse(ear, (hx - .3, hy - .2), .9, 1.3, base=.48)
    # face pixels
    ex, ey = hx + 1.6, hy + .4
    if blink:
        sp.px(ex, ey, skin, 2, kind='idx')
    else:
        sp.px(ex, ey, 'black', 0, kind='idx')
        sp.px(ex + 1, ey, skin, 6, kind='idx')
    sp.px(ex - .2, ey - 1.6, skin, 6, kind='idx')
    sp.px(ex, ey + 1.1, hr if hs != 'bald' else skin, 1, kind='idx')
    sp.px(ex + 1, ey + 1.1, hr if hs != 'bald' else skin, 1, kind='idx')
    my = hy - 2.3
    if talk == 1:
        sp.px(hx + 2.8, my, 'blood', 1, kind='idx')
        sp.px(hx + 2.8, my - .9, 'blood', 1, kind='idx')
    elif talk == 2:
        sp.px(hx + 2.8, my, 'blood', 1, kind='idx')
        sp.px(hx + 2.0, my, 'blood', 2, kind='idx')
    else:
        sp.px(hx + 2.8, my, skin, 2, kind='idx')
    if spec.get('moustache'):
        sp.px(hx + 3.0, my + .9, hr, 0, kind='idx')
        sp.px(hx + 2.1, my + .9, hr, 0, kind='idx')
    if spec.get('glasses'):
        sp.px(ex, ey, 'chrome', 6, kind='idx')
        sp.px(ex + .9, ey, 'chrome', 4, kind='idx')
        sp.px(ex - 1, ey + .1, 'chrome', 3, kind='idx')
    if spec.get('beard'):
        bp = sp.new_part(spec.get('beard'), 1)
        sp.poly(bp, [(hx - .6, hy - 1.0), (hx + 3.4, hy - 1.2), (hx + 3.0, hy - 4.2), (hx + .4, hy - 4.4)], base=.6)


def head_front(sp: Sprite, P, spec, talk=0, blink=False, back=False):
    skin = spec.get('skin', 'skin')
    hx, hy = P['head']
    neck = sp.new_part(skin, 1)
    sp.capsule(neck, (0, P['neck'][1] - 2.0), (0, P['neck'][1] + 1.0), 1.5, base=.4)
    hs = spec.get('hair_style', 'short')
    hr = spec.get('hair', 'black')
    if hs != 'veil':
        ear = sp.new_part(skin, 1)
        sp.ellipse(ear, (hx - 3.4, hy - .2), .9, 1.3, base=.5)
        sp.ellipse(ear, (hx + 3.4, hy - .2), .9, 1.3, base=.45)
    hp = sp.new_part(skin, 1)
    sp.ellipse(hp, (hx, hy), 3.4 * spec.get('headw', 1), 4.1, base=.62, shade_k=.18)
    sp.poly(hp, [(hx - 3.0, hy - 1.0), (hx + 3.0, hy - 1.0), (hx + 1.6, hy - 4.0), (hx - 1.6, hy - 4.0)], base=.6)
    if hs != 'bald':
        hpart = sp.new_part(hr, 1)
        if back:
            if hs == 'wave':
                sp.poly(hpart, [(hx - 3.8, hy + 3), (hx + 3.8, hy + 3), (hx + 4.2, hy - 4.8), (hx - 4.2, hy - 4.8)],
                        base=.5)
            elif hs == 'veil':
                sp.poly(hpart, [(hx - 4.4, hy + 4.4), (hx + 4.4, hy + 4.4), (hx + 5.0, hy - 7.2), (hx - 5.0, hy - 7.2)],
                        base=.35)
            else:
                sp.ellipse(hpart, (hx, hy + .6), 3.5, 3.8, base=.45)
                if hs == 'bun':
                    sp.ellipse(hpart, (hx, hy + 1.2), 1.9, 1.9, base=.55)
        else:
            if hs in ('short', 'slick'):
                sp.poly(hpart, [(hx - 3.5, hy + 1.6), (hx - 2.6, hy + 4.0), (hx + 2.6, hy + 4.0), (hx + 3.5, hy + 1.6),
                                (hx + 2.6, hy + 2.6), (hx - 2.6, hy + 2.6)], base=.45)
            elif hs == 'wave':
                sp.poly(hpart, [(hx - 4.0, hy + 2.0), (hx - 2.4, hy + 4.6), (hx + 2.6, hy + 4.6), (hx + 4.0, hy + 2.0),
                                (hx + 4.2, hy - 4.6), (hx + 3.0, hy - 4.8), (hx + 3.0, hy + 1.6), (hx - 2.0, hy + 2.8),
                                (hx - 3.0, hy + 1.2), (hx - 3.0, hy - 4.8), (hx - 4.2, hy - 4.6)], base=.5)
            elif hs == 'bun':
                sp.poly(hpart, [(hx - 3.6, hy + 1.6), (hx - 2.4, hy + 4.2), (hx + 2.4, hy + 4.2), (hx + 3.6, hy + 1.6),
                                (hx + 2.4, hy + 2.8), (hx - 2.4, hy + 2.8)], base=.55)
                sp.ellipse(hpart, (hx, hy + 4.6), 1.8, 1.3, base=.5)
            elif hs == 'veil':
                sp.poly(hpart, [(hx - 4.6, hy + 2.0), (hx - 3.0, hy + 4.8), (hx + 3.0, hy + 4.8), (hx + 4.6, hy + 2.0),
                                (hx + 5.0, hy - 7.0), (hx + 3.2, hy - 7.0), (hx + 3.0, hy + 2.0), (hx - 3.0, hy + 2.0),
                                (hx - 3.2, hy - 7.0), (hx - 5.0, hy - 7.0)], base=.35)
                wp = sp.new_part('white', 1)
                sp.poly(wp, [(hx - 3.2, hy + 2.6), (hx + 3.2, hy + 2.6), (hx + 3.0, hy + 1.8), (hx - 3.0, hy + 1.8)],
                        base=.8)
    if back:
        return
    # face pixels
    for sx in (-1, 1):
        ex = hx + sx * 1.4
        ey = hy + .3
        if blink:
            sp.px(ex, ey, skin, 2, kind='idx')
        else:
            sp.px(ex, ey, 'black', 0, kind='idx')
        sp.px(ex, ey + 1.2, hr if hs != 'bald' else skin, 1, kind='idx')
        sp.px(ex + sx * .9, ey + 1.0, hr if hs != 'bald' else skin, 1, kind='idx')
        if spec.get('glasses'):
            sp.px(ex + sx * .9, ey, 'chrome', 5, kind='idx')
            sp.px(ex - sx * .9 if sx < 0 else ex, ey + .1, 'chrome', 6, kind='idx')
    sp.px(hx + .2, hy - 1.0, skin, 3, kind='idx')
    my = hy - 2.4
    if spec.get('lipstick'):
        mc = ('neonred', 3)
    else:
        mc = (skin, 2)
    if talk == 1:
        sp.px(hx, my, 'blood', 1, kind='idx')
        sp.px(hx, my - .9, 'blood', 2, kind='idx')
    elif talk == 2:
        sp.px(hx - .6, my, 'blood', 1, kind='idx')
        sp.px(hx + .6, my, 'blood', 1, kind='idx')
    else:
        sp.px(hx - .5, my, mc[0], mc[1], kind='idx')
        sp.px(hx + .5, my, mc[0], mc[1], kind='idx')
    if spec.get('moustache'):
        for dx in (-1.1, 0, 1.1):
            sp.px(hx + dx, my + .9, hr, 0, kind='idx')
    if spec.get('beard'):
        bp = sp.new_part(spec.get('beard'), 1)
        sp.poly(bp, [(hx - 3.0, hy - .8), (hx + 3.0, hy - .8), (hx + 1.8, hy - 4.6), (hx - 1.8, hy - 4.6)], base=.6)
        sp.px(hx, my, 'blood', 1 if talk else 2, kind='idx')


def hat(sp: Sprite, P, spec, view='side'):
    kind = spec.get('hat')
    if not kind:
        return
    ramp = spec.get('hat_ramp', 'slate')
    hx, hy = P['head']
    part = sp.new_part(ramp, 2)
    band = sp.new_part(spec.get('band_ramp', 'black'), 2)
    if kind == 'fedora':
        if view == 'side':
            sp.poly(part, [(hx - 5.3, hy + 2.9), (hx + 5.9, hy + 2.6), (hx + 6.4, hy + 2.0), (hx + 2.0, hy + 2.3),
                           (hx - 2.0, hy + 2.2), (hx - 5.5, hy + 2.2)], base=.45)
            sp.poly(part, [(hx - 2.9, hy + 2.6), (hx - 2.5, hy + 6.5), (hx + .2, hy + 7.0), (hx + 2.5, hy + 6.5),
                           (hx + 3.1, hy + 2.6)], base=.5)
            sp.poly(band, [(hx - 2.9, hy + 2.5), (hx + 3.1, hy + 2.5), (hx + 3.0, hy + 3.5), (hx - 2.8, hy + 3.5)],
                    base=.6)
            sp.px(hx + .4, hy + 6.4, ramp, .9)
        else:
            sp.ellipse(part, (hx, hy + 2.6), 6.0, 1.3, base=.42, shade_k=.1)
            sp.poly(part, [(hx - 3.2, hy + 2.6), (hx - 2.9, hy + 6.4), (hx - .6, hy + 6.9), (hx, hy + 6.2),
                           (hx + .6, hy + 6.9), (hx + 2.9, hy + 6.4), (hx + 3.2, hy + 2.6)], base=.5)
            sp.poly(band, [(hx - 3.2, hy + 2.6), (hx + 3.2, hy + 2.6), (hx + 3.15, hy + 3.6), (hx - 3.15, hy + 3.6)],
                    base=.6)
            if view == 'front':
                sp.poly(part, [(hx - 3.2, hy + 2.2), (hx + 3.2, hy + 2.2), (hx + 3.0, hy + 1.7), (hx - 3.0, hy + 1.7)],
                        base=.2, shade_k=0)
    elif kind == 'cap':     # flat cap / watch cap
        if view == 'side':
            sp.poly(part, [(hx - 3.6, hy + 1.6), (hx - 3.0, hy + 4.6), (hx + 1.2, hy + 5.0), (hx + 3.4, hy + 3.6),
                           (hx + 5.4, hy + 2.6), (hx + 3.4, hy + 2.0)], base=.5)
        else:
            sp.poly(part, [(hx - 3.8, hy + 1.6), (hx - 3.4, hy + 4.4), (hx, hy + 5.2), (hx + 3.4, hy + 4.4),
                           (hx + 3.8, hy + 1.6)], base=.5)
    elif kind == 'police':
        if view == 'side':
            sp.poly(part, [(hx - 3.4, hy + 2.6), (hx - 3.8, hy + 5.6), (hx + 3.8, hy + 5.8), (hx + 3.2, hy + 2.6)],
                    base=.45)
            sp.poly(band, [(hx + 1.6, hy + 2.8), (hx + 5.4, hy + 1.8), (hx + 4.2, hy + 2.8)], base=.3)
        else:
            sp.poly(part, [(hx - 3.6, hy + 2.6), (hx - 4.4, hy + 5.6), (hx + 4.4, hy + 5.6), (hx + 3.6, hy + 2.6)],
                    base=.45)
            sp.poly(band, [(hx - 3.4, hy + 2.0), (hx + 3.4, hy + 2.0), (hx + 3.4, hy + 2.9), (hx - 3.4, hy + 2.9)],
                    base=.3)
            sp.px(hx, hy + 4.2, 'brass', 6, kind='idx')
    elif kind == 'nurse':
        if view == 'side':
            sp.poly(part, [(hx - 2.6, hy + 3.0), (hx - 1.8, hy + 5.4), (hx + 2.4, hy + 5.2), (hx + 2.2, hy + 3.4)],
                    base=.8)
        else:
            sp.poly(part, [(hx - 3.0, hy + 3.2), (hx - 2.4, hy + 5.6), (hx + 2.4, hy + 5.6), (hx + 3.0, hy + 3.2)],
                    base=.8)
    elif kind == 'visor':
        if view != 'back':
            sp.poly(part, [(hx - 3.6, hy + 2.6), (hx + 3.6, hy + 2.6), (hx + (5.6 if view == 'side' else 3.8), hy + 1.6),
                           (hx - (1.0 if view == 'side' else 3.8), hy + 1.6)], base=.5)
    elif kind == 'pillbox':
        if view == 'side':
            sp.poly(part, [(hx - 1.6, hy + 3.4), (hx - 1.2, hy + 5.4), (hx + 2.8, hy + 5.2), (hx + 2.6, hy + 3.2)],
                    base=.5)
            sp.px(hx + 2.8, hy + 5.6, 'felt', 6, kind='idx')
        else:
            sp.poly(part, [(hx - 2.2, hy + 3.6), (hx - 2.0, hy + 5.6), (hx + 2.0, hy + 5.6), (hx + 2.2, hy + 3.6)],
                    base=.5)
