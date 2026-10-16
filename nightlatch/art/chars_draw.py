"""Draw a posed, costumed figure into a Sprite (side / front / back views)."""
from __future__ import annotations

import math

from chars_core import Sprite
from chars_body import head_side, head_front, hat, shoe_side


def _leg_side(sp, hip, knee, ankle, spec, dark, toe_dir=1, bare=False):
    pants = spec.get('pants', 'slate')
    legs_r = spec.get('legs', pants)
    shoes = spec.get('shoes', 'wood')
    hem = spec.get('hem_y', 12)
    part = sp.new_part(legs_r if spec.get('skirt') else pants, 2)
    w = spec.get('leg_w', 1.0)
    base = .5 - dark
    if spec.get('skirt'):
        sp.capsule(part, knee, ankle, 1.25 * w, 1.0 * w, base=base + .08)
        sp.capsule(part, (hip[0] + (knee[0] - hip[0]) * .6, hip[1] + (knee[1] - hip[1]) * .6), knee, 1.5 * w, 1.3 * w,
                   base=base + .08)
    else:
        sp.capsule(part, hip, knee, 2.0 * w, 1.75 * w, base=base)
        sp.capsule(part, knee, ankle, 1.75 * w, 1.45 * w, base=base)
    shoe_side(sp, ankle, toe_dir, shoes, .45 - dark * .6)


def _arm_side(sp, sh, el, wr, spec, dark, sleeve=None):
    sleeve = sleeve or spec.get('sleeve', spec.get('top', 'trench'))
    part = sp.new_part(sleeve, 2)
    base = .6 - dark
    w = spec.get('arm_w', 1.0)
    sp.capsule(part, sh, el, 1.75 * w, 1.55 * w, base=base)
    sp.capsule(part, el, wr, 1.55 * w, 1.4 * w, base=base)
    cuff = spec.get('cuff')
    if cuff:
        cp = sp.new_part(cuff, 1)
        dx, dy = wr[0] - el[0], wr[1] - el[1]
        L = math.hypot(dx, dy) or 1
        sp.capsule(cp, (wr[0] - dx / L * .8, wr[1] - dy / L * .8), wr, 1.35, base=.7)
    hand = sp.new_part(spec.get('gloves', spec.get('skin', 'skin')), 1)
    dx, dy = wr[0] - el[0], wr[1] - el[1]
    L = math.hypot(dx, dy) or 1
    sp.ellipse(hand, (wr[0] + dx / L * 1.0, wr[1] + dy / L * 1.0), 1.25, 1.35, base=.6 - dark)


def draw_side(sp: Sprite, P, spec, talk=0, blink=False):
    top = spec.get('top', 'trench')
    hip, sh = P['hip'], P['shoulder']
    # far arm, far leg
    _arm_side(sp, (sh[0] - .4, sh[1] - .6), P['elbowB'], P['wristB'], spec, .14)
    _leg_side(sp, (hip[0] - .3, hip[1]), P['kneeB'], P['ankleB'], spec, .13)
    _leg_side(sp, hip, P['kneeA'], P['ankleA'], spec, 0.0)
    # torso garment
    part = sp.new_part(top, 2)
    nx, ny = P['neck']
    belly = spec.get('belly', 0.0)
    bw = spec.get('build', 1.0)
    waist_y = hip[1] + 2.4
    style = spec.get('style', 'coat')
    hem_y = spec.get('hem_y', 12)
    kx_min = min(P['kneeA'][0], P['kneeB'][0])
    kx_max = max(P['kneeA'][0], P['kneeB'][0])
    if style in ('coat', 'dress', 'habit', 'robe', 'labcoat'):
        flare = spec.get('flare', 2.0)
        if hem_y < 8:   # long skirts follow the ankles
            ax_min = min(P['ankleA'][0], P['ankleB'][0])
            ax_max = max(P['ankleA'][0], P['ankleB'][0])
            hb, hf = min(kx_min, ax_min) - flare, max(kx_max, ax_max) + flare
        else:
            hb, hf = kx_min - flare, kx_max + flare
        pts = [(nx - 2.2 * bw, ny - .5), (sh[0] - 3.6 * bw, sh[1] + .1), (sh[0] - 3.9 * bw, sh[1] - 6),
               (hip[0] - 3.4 * bw, waist_y), (hb, hem_y + .6), (hb + .6, hem_y - .2), (hf - .6, hem_y - .2),
               (hf, hem_y + .6), (hip[0] + 3.5 * bw + belly * .6, waist_y),
               (sh[0] + 3.9 * bw + belly, sh[1] - 7), (sh[0] + 3.6 * bw, sh[1] - 2), (nx + 2.2, ny - 1.4)]
    else:   # jacket / tunic / sweater / vest: to the hip
        pts = [(nx - 2.2 * bw, ny - .5), (sh[0] - 3.6 * bw, sh[1] + .1), (sh[0] - 3.9 * bw, sh[1] - 6),
               (hip[0] - 3.5 * bw, waist_y - 1), (hip[0] - 3.7 * bw, hip[1] - 1.6), (hip[0] + 3.9 * bw + belly * .4,
                                                                                    hip[1] - 1.6),
               (hip[0] + 3.7 * bw + belly * .6, waist_y), (sh[0] + 3.9 * bw + belly, sh[1] - 7),
               (sh[0] + 3.6 * bw, sh[1] - 2), (nx + 2.2, ny - 1.4)]
    sp.poly(part, pts, base=.52, grad=(.06, -.08))
    if spec.get('apron'):
        ap = sp.new_part(spec['apron'], 2)
        sp.poly(ap, [(sh[0] + 1.2, sh[1] - 9), (hip[0] + 3.2 + belly * .6, waist_y), (kx_max + 1.8, 8),
                     (kx_max - .4, 8), (hip[0] + 1.0, waist_y - 2)], base=.7)
    if spec.get('belt'):
        bp = sp.new_part(spec.get('belt_ramp', top), 0)
        sp.poly(bp, [(hip[0] - 3.4 * bw, waist_y + .4), (hip[0] + 3.5 * bw + belly * .6, waist_y + .4),
                     (hip[0] + 3.5 * bw + belly * .6, waist_y - .7), (hip[0] - 3.4 * bw, waist_y - .7)], base=.25)
    # collar / shirt at the throat
    shirt = spec.get('shirt')
    if shirt:
        spp = sp.new_part(shirt, 0)
        sp.poly(spp, [(nx + .8, ny - .4), (nx + 2.1, ny - 1.2), (nx + 2.4, ny - 3.6), (nx + 1.2, ny - 2.0)], base=.75)
    if spec.get('collar_up'):
        cp = sp.new_part(top, 2)
        sp.poly(cp, [(nx - 2.2, ny - 1.0), (nx - 1.8, ny + 1.6), (nx + .2, ny + .9), (nx + .8, ny - 1.6)], base=.66)
    # near arm
    _arm_side(sp, sh, P['elbowA'], P['wristA'], spec, 0.0)
    head_side(sp, P, spec, talk=talk, blink=blink)
    hat(sp, P, spec, 'side')
    if spec.get('extra_side'):
        spec['extra_side'](sp, P)


def _leg_front(sp, hip, knee, ankle, spec, dark, footz):
    pants = spec.get('pants', 'slate')
    skirt = spec.get('skirt')
    part = sp.new_part(spec.get('legs', pants) if skirt else pants, 2)
    w = spec.get('leg_w', 1.0)
    if skirt:
        sp.capsule(part, knee, ankle, 1.2 * w, 1.0 * w, base=.55 - dark)
    else:
        sp.capsule(part, hip, knee, 2.1 * w, 1.85 * w, base=.5 - dark)
        sp.capsule(part, knee, ankle, 1.85 * w, 1.55 * w, base=.48 - dark)
    shoe = sp.new_part(spec.get('shoes', 'wood'), 2)
    sp.ellipse(shoe, (ankle[0], ankle[1] - 1.1 - footz * .3), 1.7, 1.3 + max(0, -footz) * .25, base=.42 - dark * .5)


def _lap_front(sp, P, spec):
    """Seated, facing us: the thighs come towards the viewer, so we see their lit tops as a
    lap reaching down to rounded knees, with the shins dropping away in shadow beneath."""
    pants = spec.get('pants', 'slate')
    seat = P['lap']
    w = spec.get('leg_w', 1.0)
    shadow = sp.new_part(pants, 2)
    lap = sp.new_part(pants, 1)
    for side in ('L', 'R'):
        hx = P['hip' + side][0]
        kx, ky = P['knee' + side]
        sp.ellipse(shadow, (kx, ky - 1.6), 2.0 * w, 1.1, base=.22)
        sp.capsule(lap, (hx * .6, seat + .6), (kx, ky + .9), 2.35 * w, 2.15 * w, base=.62)
        sp.ellipse(lap, (kx, ky + .4), 2.0 * w, 1.25, base=.72)


def _arm_front(sp, sh, el, wr, spec, dark):
    sleeve = spec.get('sleeve', spec.get('top', 'trench'))
    part = sp.new_part(sleeve, 2)
    w = spec.get('arm_w', 1.0)
    sp.capsule(part, sh, el, 1.85 * w, 1.6 * w, base=.5 - dark)
    sp.capsule(part, el, wr, 1.6 * w, 1.45 * w, base=.5 - dark)
    if spec.get('cuff'):
        cp = sp.new_part(spec['cuff'], 1)
        sp.capsule(cp, (wr[0], wr[1] + .9), wr, 1.4, base=.72)
    hand = sp.new_part(spec.get('gloves', spec.get('skin', 'skin')), 1)
    sp.ellipse(hand, (wr[0], wr[1] - 1.2), 1.3, 1.45, base=.6 - dark)


def draw_front(sp: Sprite, P, spec, talk=0, blink=False, back=False):
    top = spec.get('top', 'trench')
    bw = spec.get('build', 1.0)
    for side, dk in (('L', 0.0), ('R', .08)):
        _leg_front(sp, P['hip' + side], P['knee' + side], P['ankle' + side], spec, dk, P['footz' + side])
    part = sp.new_part(top, 2)
    shy = P['shoulderL'][1]
    hipy = P['hipL'][1]
    waist = hipy + 2.4
    belly = spec.get('belly', 0.0)
    style = spec.get('style', 'coat')
    hem_y = spec.get('hem_y', 12)
    ww = 4.3 * bw + belly * .5
    if style in ('coat', 'dress', 'habit', 'robe', 'labcoat'):
        flare = spec.get('flare', 2.0) * .6
        hx = max(abs(P['kneeL'][0]), abs(P['kneeR'][0])) + 2.6 + flare
        pts = [(-1.6, shy + 2.0), (-5.6 * bw, shy + .4), (-5.4 * bw, shy - 6), (-ww, waist), (-hx, hem_y),
               (-.6, hem_y + (1.2 if style == 'coat' else 0)), (.6, hem_y + (1.2 if style == 'coat' else 0)),
               (hx, hem_y), (ww, waist), (5.4 * bw, shy - 6), (5.6 * bw, shy + .4), (1.6, shy + 2.0)]
    else:
        pts = [(-1.6, shy + 2.0), (-5.6 * bw, shy + .4), (-5.4 * bw, shy - 6), (-ww, waist), (-4.6 * bw, hipy - 1.8),
               (4.6 * bw, hipy - 1.8), (ww, waist), (5.4 * bw, shy - 6), (5.6 * bw, shy + .4), (1.6, shy + 2.0)]
    sp.poly(part, pts, base=.5, grad=(.08, -.06), shade_k=.12)
    if not back:
        shirt = spec.get('shirt')
        vbot = shy - (5.5 if style != 'dress' else 3.0)
        if shirt:
            spp = sp.new_part(shirt, 0)
            sp.poly(spp, [(-1.7, shy + 2.1), (1.7, shy + 2.1), (0, vbot)], base=.78)
        if spec.get('tie'):
            tp = sp.new_part(spec['tie'], 0)
            sp.poly(tp, [(-.55, shy + 1.8), (.55, shy + 1.8), (.75, vbot + 1.0), (0, vbot - .4), (-.75, vbot + 1.0)],
                    base=.55)
        if spec.get('lapels', style in ('coat', 'jacket')):
            lp = sp.new_part(top, 0)
            sp.poly(lp, [(-1.8, shy + 2.0), (-3.2, shy + .4), (-.4, vbot + .2)], base=.68)
            sp.poly(lp, [(1.8, shy + 2.0), (3.2, shy + .4), (.4, vbot + .2)], base=.62)
        if spec.get('apron'):
            ap = sp.new_part(spec['apron'], 2)
            sp.poly(ap, [(-3.4, waist + 4), (3.4, waist + 4), (4.0, 8), (-4.0, 8)], base=.72)
        for (bx, by) in spec.get('buttons', [(-1.2, shy - 8.5), (1.2, shy - 8.5), (-1.2, shy - 12),
                                             (1.2, shy - 12)] if style == 'coat' else []):
            sp.px(bx, by, spec.get('button_ramp', 'black'), 1, kind='idx')
    if spec.get('belt'):
        bp = sp.new_part(spec.get('belt_ramp', top), 0)
        sp.poly(bp, [(-ww, waist + .5), (ww, waist + .5), (ww, waist - .6), (-ww, waist - .6)], base=.22)
        if not back:
            sp.px(0, waist, 'brass', 6, kind='idx')
    if back and style == 'coat':
        sp.px(0, hem_y + 1, top, 1, kind='idx')
        sp.px(0, hem_y + 2, top, 1, kind='idx')
    if spec.get('collar_up'):
        cp = sp.new_part(top, 2)
        sp.poly(cp, [(-3.2, shy + 1.0), (-2.4, shy + 3.8), (-1.2, shy + 2.6)], base=.66)
        sp.poly(cp, [(3.2, shy + 1.0), (2.4, shy + 3.8), (1.2, shy + 2.6)], base=.6)
    if P.get('lap') and not back:
        _lap_front(sp, P, spec)
    for side, dk in (('L', 0.0), ('R', .08)):
        _arm_front(sp, P['shoulder' + side], P['elbow' + side], P['wrist' + side], spec, dk)
    head_front(sp, P, spec, talk=talk, blink=blink, back=back)
    hat(sp, P, spec, 'back' if back else 'front')
    if spec.get('extra_front') and not back:
        spec['extra_front'](sp, P)
