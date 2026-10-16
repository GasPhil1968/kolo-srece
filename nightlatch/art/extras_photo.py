"""NIGHT LATCH - Pike's contact sheet (public/assets/docs/contact_sheet.png, 232x58, opaque).

A strip of four sepia contact prints on black film rebate with sprocket holes and edge
printing. Frames (see src/content/docs.ts 'contact_sheet'):
  1. Night: a truck marked GULLWING unloading crates at an iron back gate of a big white
     building (Halcyon House).
  2. Two men shaking hands: a thin man with round glasses (Vey) and a big man in a camel
     coat and hat, face hidden by the brim, a gold lighter glinting in his hand (Delaney).
  3. Blurred - Pike's hand moved; the frame is ruined.
  4. The darkroom's wall timer, back panel open, a small key hanging inside.
Each frame is painted into its own core.Canvas with the 'e_sepia' ramp, lit, grain-dithered.
"""
from __future__ import annotations

import math

import numpy as np

from core import Canvas, noise2, out_path, save_png
import extras_common as EC
from extras_common import micro_mask

FW, FH = 52, 38          # frame size
SW, SH = 232, 58         # strip size
FRAME_X = (6, 62, 118, 174)
FRAME_Y = 8


def _canvas(seed):
    c = Canvas(FW, FH, seed)
    c.default_dith = .8
    return c


def _text(c, x, y, s, lum, spacing=1, ramp='e_sepia'):
    m = micro_mask(s, spacing)
    ys, xs = np.nonzero(m)
    for yy, xx in zip(ys, xs):
        c.put(x + xx, y + yy, ramp, lum)
    return m.shape[1]


def _finish(c, grain_seed, vignette=.35):
    yy, xx = np.mgrid[0:FH, 0:FW].astype(np.float32)
    v = ((xx - FW / 2) / (FW / 2)) ** 2 + ((yy - FH / 2) / (FH / 2)) ** 2
    c.shade *= np.clip(1 - vignette * v * .6, .5, 1)
    img = c.render()
    # film grain: a little luminance noise, kept on the sepia ramp by re-quantising
    rng = np.random.default_rng(grain_seed)
    g = rng.normal(0, 6, img.shape[:2])
    out = np.clip(img.astype(np.float32) + g[..., None], 0, 255)
    return out.astype(np.uint8)


# ------------------------------------------------------------------ frame 1 --------------
def frame_truck():
    c = _canvas(101)
    # night sky over the roof
    c.rect(0, 0, FW, FH, 'e_sepia', lambda X, Y: .1 + .02 * Y / FH, dith=.9)
    # the big white building behind the wall: pale render, dark windows, a drainpipe
    c.rect(0, 1, FW, 20, 'e_sepia', .62, dith=.6)
    c.rect(0, 1, FW, 3, 'e_sepia', .75, dith=.3)                 # cornice
    c.hline(0, FW, 3, 'e_sepia', .35)
    for wy in (6, 12):
        for wx in range(3, FW, 8):
            c.rect(wx, wy, wx + 3, wy + 4, 'e_sepia', .12, dith=.2)
            c.hline(wx, wx + 3, wy + 4, 'e_sepia', .8)
    c.put(27, 13, 'e_sepia', .85)                                # one lit window
    c.put(28, 13, 'e_sepia', .8)
    c.vline(36, 1, 20, 'e_sepia', .35)
    # stone wall with the iron back gate (left)
    c.rect(0, 15, FW, 30, 'e_sepia', .42, dith=.6)
    for yb in range(16, 30, 3):
        for xb in range(-2 + (yb % 2) * 3, FW, 6):
            c.hline(xb, xb + 5, yb, 'e_sepia', .3)
    c.rect(1, 11, 4, 30, 'e_sepia', .58, dith=.4)                 # gate pillars
    c.rect(14, 11, 17, 30, 'e_sepia', .5, dith=.4)
    c.rect(4, 15, 14, 30, 'e_sepia', .2, dith=.4)                 # the open yard behind
    for xb in range(4, 14, 2):
        c.vline(xb, 16, 30, 'e_sepia', .06)                       # iron bars
    c.hline(4, 14, 17, 'e_sepia', .06)
    c.hline(4, 14, 24, 'e_sepia', .06)
    for xb in range(4, 14, 2):
        c.put(xb, 15, 'e_sepia', .06)                             # spear tips
    # lamp on the left pillar
    c.rect(1, 8, 4, 11, 'e_sepia', 1.0, emis=1, dith=0)
    c.hline(0, 5, 7, 'e_sepia', .15)
    # the truck: box van, rear doors open toward the gate, GULLWING on the side
    c.rect(17, 12, 52, 28, 'e_sepia', .8, dith=.3)
    c.hline(17, 52, 12, 'e_sepia', .95)
    c.hline(17, 52, 27, 'e_sepia', .45)
    c.rect(15, 13, 17, 27, 'e_sepia', .3, dith=0)                 # dark open rear
    c.rect(13, 13, 15, 27, 'e_sepia', .6, dith=.2)                # swung door
    letters = {'G': ['.##', '#..', '#.#', '#.#', '.##'], 'U': ['#.#', '#.#', '#.#', '#.#', '###'],
               'L': ['#..', '#..', '#..', '#..', '###'], 'W': ['#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'],
               'I': ['#', '#', '#', '#', '#'], 'N': ['#..#', '##.#', '#.##', '#..#', '#..#']}
    tx = 18
    for ch in 'GULLWING':
        g = letters[ch]
        for j, row in enumerate(g):
            for i, cc in enumerate(row):
                if cc == '#':
                    c.put(tx + i, 17 + j, 'e_sepia', .08)
        tx += len(g[0]) + 1
    c.hline(19, 51, 23, 'e_sepia', .5)                            # pin-stripe
    c.hline(19, 51, 15, 'e_sepia', .55)
    # chassis, mudguards and wheels (the cab noses out of the frame on the right)
    c.rect(17, 28, 52, 30, 'e_sepia', .12, dith=0)
    for wx in (23, 44):
        c.ellipse(wx, 30.5, 3.4, 2.6, 'e_sepia', .55, dith=0)        # mudguard catching the lamp
        c.ellipse(wx, 31, 3.0, 3.0, 'e_sepia', .05, dith=0)
        c.ellipse(wx, 31, 1.3, 1.3, 'e_sepia', .6, dith=0)           # hub

    # crates stacked by the gate
    for (x0, y0) in ((4, 25), (8, 25), (6, 21)):
        c.rect(x0, y0, x0 + 4, y0 + 4, 'e_sepia', .85, dith=.2)
        c.hline(x0, x0 + 4, y0 + 2, 'e_sepia', .55)
        c.vline(x0, y0, y0 + 4, 'e_sepia', .6)
    # a man carrying a crate from the van to the gate
    c.rect(10, 18, 13, 26, 'e_sepia', .06, dith=0)                # body
    c.ellipse(11.5, 16, 1.6, 1.8, 'e_sepia', .08, dith=0)         # head / cap
    c.hline(9, 14, 14, 'e_sepia', .08)                            # cap peak
    c.rect(10, 26, 11, 30, 'e_sepia', .06, dith=0)                # legs
    c.rect(12, 26, 13, 30, 'e_sepia', .06, dith=0)
    c.rect(8, 19, 12, 22, 'e_sepia', .92, dith=0)                 # the crate he carries
    c.hline(8, 12, 20, 'e_sepia', .6)
    # wet ground catching the lamp
    c.rect(0, 30, FW, FH, 'e_sepia', lambda X, Y: .2 + .14 * np.exp(-((X - 6) / 14) ** 2), dith=.8)
    for k in range(6):
        c.hline(2 + k, 6 + k, 31 + k, 'e_sepia', .7 - k * .08)    # lamp reflection streak
    c.ambient = .62
    c.add_light(3, 9, 44, .9, falloff=1.3)
    c.glow(2.5, 9.5, 8, '#ffffff', .4)
    return _finish(c, 11)


# ------------------------------------------------------------------ frame 2 --------------
def frame_handshake():
    c = _canvas(202)
    # night by the porch: a single lamp overhead, a dark wall behind, wet steps
    c.rect(0, 0, FW, FH, 'e_sepia', lambda X, Y: .12 + .05 * np.exp(-((X - 12) / 14) ** 2 - ((Y - 4) / 10) ** 2), dith=.9)
    # a door behind the big man, its frosted pane lit from inside: his hat in silhouette
    c.rect(30, 0, 48, 30, 'e_sepia', .2, dith=.3)                 # door
    c.rect(32, 0, 46, 15, 'e_sepia', .9, emis=.8, dith=.4)        # lit pane
    c.hline(32, 46, 15, 'e_sepia', .3)
    c.vline(39, 0, 15, 'e_sepia', .55)                            # glazing bar
    c.rect(3, 2, 7, 4, 'e_sepia', 1.0, emis=1, dith=0)            # the porch lamp (left)
    c.rect(0, 32, FW, FH, 'e_sepia', .2, dith=.6)                 # steps
    c.hline(0, FW, 32, 'e_sepia', .45)
    # --- Vey (left): thin, balding, round glasses, dark suit, reaching out -------------------
    c.poly([(4, 38), (5, 18), (9, 15), (15, 15), (18, 18), (19, 38)], 'e_sepia', .1, dith=.3)  # suit
    c.line(9, 15, 5, 20, 'e_sepia', .42)                           # lamplit shoulder
    c.line(5, 20, 5, 34, 'e_sepia', .3)
    c.poly([(10, 15), (12, 21), (14, 15)], 'e_sepia', .85, dith=0)   # shirt front
    c.vline(12, 16, 20, 'e_sepia', .12)                           # tie
    c.rect(11, 13, 14, 15, 'e_sepia', .55, dith=0)                # neck
    c.ellipse(12.5, 9, 3.2, 3.9, 'e_sepia', .6, dith=.2)           # head
    c.rect(10, 5, 15, 7, 'e_sepia', .9, dith=0)                   # bald crown in the lamplight
    c.put(9, 9, 'e_sepia', .35)
    c.put(16, 9, 'e_sepia', .35)
    for gx in (11, 14):                                           # round spectacles, glinting
        for (dx, dy) in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            c.put(gx + dx, 9 + dy, 'e_sepia', .08)
        c.put(gx, 9, 'e_sepia', 1.0)
    c.put(12, 9, 'e_sepia', .08)
    c.hline(12, 14, 12, 'e_sepia', .3)                            # thin mouth
    c.poly([(16, 18), (19, 17), (24, 22), (22, 24)], 'e_sepia', .12, dith=0)    # his arm
    c.put(22, 21, 'e_sepia', .9)                                  # cuff
    # --- the big man (right): camel coat, hat brim hiding the face -------------------------
    c.poly([(28, 38), (28, 19), (32, 14), (46, 14), (51, 19), (52, 38)], 'e_sepia',
           lambda X, Y: .72 - (X - 28) * .012 - (Y - 14) * .008, dith=.4)                # camel coat
    c.poly([(32, 14), (36, 14), (37, 22), (30, 22)], 'e_sepia', .85, dith=.2)       # lamplit lapel/shoulder
    c.line(38, 21, 38, 38, 'e_sepia', .28)                                      # coat edge
    c.hline(29, 51, 29, 'e_sepia', .32)                                         # belt
    c.rect(35, 11, 42, 15, 'e_sepia', .18, dith=0)                              # collar
    c.rect(34, 7, 43, 12, 'e_sepia', .05, dith=0)                               # face lost in shadow
    c.put(36, 11, 'e_sepia', .25)
    c.put(37, 11, 'e_sepia', .28)
    c.poly([(35, 7), (35, 3), (37, 1), (41, 1), (43, 3), (43, 7)], 'e_sepia', .1, dith=0)   # hat crown
    c.hline(35, 43, 5, 'e_sepia', .03)                                          # band
    c.hline(37, 41, 1, 'e_sepia', .3)
    c.poly([(29, 8), (48, 6), (48, 8), (30, 10)], 'e_sepia', .08, dith=0)        # brim, pulled down
    c.line(30, 8, 47, 6, 'e_sepia', .32)
    c.poly([(30, 20), (33, 22), (27, 26), (25, 24)], 'e_sepia', .45, dith=0)    # his arm across
    # the handshake, lit from above against the dark wall
    c.rect(22, 21, 28, 25, 'e_sepia', .72, dith=0)
    c.hline(22, 28, 21, 'e_sepia', .95)
    c.hline(23, 27, 23, 'e_sepia', .45)
    c.put(22, 22, 'e_sepia', .9)
    # his other hand low at his side, a lighter glinting in it
    c.rect(45, 27, 48, 31, 'e_sepia', .55, dith=0)
    c.rect(46, 25, 48, 28, 'e_sepia', .85, dith=0)
    c.ambient = .55
    c.add_light(8, 4, 40, .8, falloff=1.1)
    c.add_light(39, 8, 24, .35, falloff=1.2)
    c.glow(5, 3, 6, '#fff4d0', .5)
    c.glow(47, 25, 5, '#fff4d0', .6)
    out = _finish(c, 22)
    star = EC.hexrgb('#fff3d6')
    for (dx, dy) in ((0, -2), (0, 2), (-2, 0), (2, 0), (0, -1), (0, 1), (-1, 0), (1, 0), (0, 0)):
        out[25 + dy, 47 + dx] = star
    return out


# ------------------------------------------------------------------ frame 3 --------------
def frame_blurred():
    c = _canvas(303)
    # the same scene smeared sideways: horizontal streaks of light and dark, a light leak
    base = noise2(FW, FH, 6, 77, 2)
    streak = np.zeros((FH, FW), np.float32)
    for y in range(FH):
        row = noise2(FW, 1, 9, 100 + y // 3, 1)[0]
        streak[y] = row
    lum = .18 + .35 * streak + .15 * (base - .5)
    yy, xx = np.mgrid[0:FH, 0:FW].astype(np.float32)
    # smeared bright shapes (the lit doorway / the lamp dragged across the frame)
    for (y0, x0, x1, l) in ((8, 10, 40, .55), (9, 12, 44, .6), (10, 14, 46, .5), (21, 4, 30, .45),
                            (22, 6, 34, .5), (27, 20, 50, .35)):
        lum[y0, x0:x1] = np.maximum(lum[y0, x0:x1], np.linspace(l, l * .4, x1 - x0))
    # a diagonal smear of the figures
    for k in range(18):
        x = 8 + k * 2
        y = 30 - k
        if 0 <= y < FH and 0 <= x < FW - 6:
            lum[y, x:x + 6] *= .4
    # light leak burning in from the right edge
    leak = np.clip((xx - 34) / 18, 0, 1) ** 1.5 * (0.7 + .3 * np.sin(yy * .4))
    lum = lum + leak * .7
    c.rect(0, 0, FW, FH, 'e_sepia', np.clip(lum, 0, 1), dith=1.0)
    # a hair / scratch on the negative
    for (x, y) in ((12, 30), (13, 29), (15, 29), (16, 28), (18, 28), (19, 27)):
        c.put(x, y, 'e_sepia', .95)
    c.ambient = 1.0
    return _finish(c, 33, vignette=.2)


# ------------------------------------------------------------------ frame 4 --------------
def frame_timer():
    c = _canvas(404)
    # flash photograph of the darkroom wall: the timer's case, back panel swung open,
    # clockwork inside, and a small key hanging from a hook in the case
    c.rect(0, 0, FW, FH, 'e_sepia', lambda X, Y: .5 - .006 * Y, dith=.8)        # painted wall
    c.vline(46, 0, FH, 'e_sepia', .38)                                         # the pipe
    c.vline(47, 0, FH, 'e_sepia', .6)
    # the case (seen from the back, open), with its shadow on the wall
    c.rect(15, 6, 39, 35, 'e_sepia', .2, dith=.3)                              # shadow
    c.rect(12, 3, 36, 32, 'e_sepia', .3, dith=.3)                              # case rim
    c.rect(14, 5, 34, 30, 'e_sepia', .12, dith=.4)                             # dark interior
    c.hline(12, 36, 3, 'e_sepia', .6)
    c.vline(12, 3, 32, 'e_sepia', .55)
    # the back panel swung open on its hinge (right), seen edge-on in perspective
    c.poly([(36, 3), (44, 7), (44, 31), (36, 32)], 'e_sepia', .62, dith=.3)
    c.poly([(36, 3), (44, 7), (44, 8), (36, 5)], 'e_sepia', .85, dith=0)
    for yh in (8, 26):
        c.rect(35, yh, 37, yh + 2, 'e_sepia', .85, dith=0)                     # hinges
    # clockwork: a big gear, a small gear, the spring barrel
    def gear(cx, cy, r, teeth, lum):
        c.ellipse(cx, cy, r, r, 'e_sepia', lum, dith=.2)
        for k in range(teeth):
            a = 2 * math.pi * k / teeth
            c.put(cx + math.cos(a) * (r + .8), cy + math.sin(a) * (r + .8), 'e_sepia', lum)
        c.ellipse(cx, cy, r * .45, r * .45, 'e_sepia', lum * .45, dith=0)
        c.put(cx, cy, 'e_sepia', .95)
    gear(20, 11, 4.2, 12, .62)
    gear(28.5, 14, 2.6, 8, .55)
    c.ellipse(25, 22, 3.4, 3.4, 'e_sepia', .45, dith=.2)                       # spring barrel
    for k in range(3):
        c.ellipse(25, 22, 2.6 - k * .8, 2.6 - k * .8, 'e_sepia', .3 + k * .15, dith=0)
    c.line(22, 27, 32, 27, 'e_sepia', .4)                                      # bridge plate
    # the key on its hook: brass hook, string, a small bright key
    c.put(18, 18, 'e_sepia', .9)                                               # hook
    c.put(18, 19, 'e_sepia', .7)
    c.line(18, 19, 17, 22, 'e_sepia', .75)                                     # string
    c.line(18, 19, 19, 22, 'e_sepia', .75)
    c.ellipse(18, 23.5, 2.3, 2.3, 'e_sepia', .95, dith=0)                      # key bow
    c.put(18, 23, 'e_sepia', .1)
    c.put(18, 24, 'e_sepia', .1)
    c.rect(18, 26, 19, 31, 'e_sepia', .9, dith=0)                              # shank
    c.rect(19, 29, 21, 30, 'e_sepia', .85, dith=0)                             # bit
    c.put(20, 31, 'e_sepia', .85)
    c.put(17, 22, 'e_sepia', 1.0, emis=1)                                      # flash glint
    # a strip of the dial ring showing at the case edge
    c.vline(11, 6, 29, 'e_sepia', .85)
    c.ambient = .6
    c.add_light(10, 6, 50, .55, falloff=1.1)                                   # the flash, upper left
    c.glow(17, 24, 4, '#ffffff', .45)
    return _finish(c, 44)


# ------------------------------------------------------------------ the strip ------------
def build():
    strip = Canvas(SW, SH, seed=505)
    strip.ambient = 1.0
    N = noise2(SW, SH, 3, 5, 2)
    strip.rect(0, 0, SW, SH, 'e_film', .78 + (N - .5) * .2, dith=.8)             # film rebate
    # sprocket holes (print black), slightly rounded
    for x0 in range(3, SW - 4, 7):
        for (y0, y1) in ((2, 5), (53, 56)):
            m = np.zeros((SH, SW), bool)
            m[y0:y1, x0:x0 + 4] = True
            m[y0, x0] = m[y0, x0 + 3] = m[y1 - 1, x0] = m[y1 - 1, x0 + 3] = False
            strip._apply(m, 'e_film', 0.0, dith=0)
            strip.put(x0 + 1, y0, 'e_film', .25)
            strip.put(x0 + 2, y0, 'e_film', .2)
    # edge printing: frame numbers and the film type, light on the dark rebate
    labels = ['12', '12A', '13', '13A', '14', '14A', '15', '15A']
    for i, fx in enumerate(FRAME_X):
        x = fx + 2
        _text(strip, x, 47, labels[2 * i], .62, ramp='e_sepia')
        _text(strip, fx + 30, 47, labels[2 * i + 1], .58, ramp='e_sepia')
        # little arrow
        strip.put(fx + 27, 49, 'e_sepia', .3)
        strip.put(fx + 26, 48, 'e_sepia', .3)
        strip.put(fx + 26, 50, 'e_sepia', .3)
    img = strip.render()
    # edge text 'SAFETY FILM' above the frames (between the holes)
    rng = np.random.default_rng(7)
    frames = (frame_truck(), frame_handshake(), frame_blurred(), frame_timer())
    for fx, fr in zip(FRAME_X, frames):
        img[FRAME_Y:FRAME_Y + FH, fx:fx + FW] = fr
        # thin dark frame line round each print
        img[FRAME_Y - 1, fx - 1:fx + FW + 1] = EC.hexrgb('#050403')
        img[FRAME_Y + FH, fx - 1:fx + FW + 1] = EC.hexrgb('#050403')
        img[FRAME_Y - 1:FRAME_Y + FH + 1, fx - 1] = EC.hexrgb('#050403')
        img[FRAME_Y - 1:FRAME_Y + FH + 1, fx + FW] = EC.hexrgb('#050403')
    # dust specks and a fibre on the print (printed white)
    for _ in range(14):
        x, y = int(rng.integers(0, SW)), int(rng.integers(0, SH))
        img[y, x] = np.clip(img[y, x].astype(int) + 60, 0, 255)
    save_png(img, out_path('docs', 'contact_sheet.png'))
    return img
