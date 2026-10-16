"""Chapter 8 - WBRK broadcast booth, City Hall.  Saturday 20 October 1951, 8:47 PM.

A dark little booth of perforated acoustic tile.  Through the big double-glazed window the
centennial gala blazes below: chandeliers, white tables, evening dress, and at the far end
Commissioner Crane at a lectern bristling with microphones.  Under the window the console with
its meter bridge; a ribbon microphone hangs on its boom; to the right the patch bay, the
engineer's card and the transmitter with its key switch; the door is locked from inside.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
from persp import Persp
import props_d as D

W, H = 320, 144
FLOOR = 100
BX0, BX1 = 24, 296
DOOR = (30, 52, 56, FLOOR)
ONAIR = (29, 40, 57, 49)
TALK = (61, 63, 71, 80)
WIN = (80, 12, 240, 70)
PATCH = (246, 26, 270, 68)
CARD = (247, 72, 261, 86)
CLOCK = (258.5, 13.5, 8)
TX = dict(X0=272, X1=294, Z0=2, Z1=20, H=66)
CONS = dict(X0=78, X1=244, Z0=4, Z1=24, Hf=18, Hb=24, Hm=34)
TT = dict(X0=26, X1=58, Z0=36, Z1=62, H=20)
TIME = (8, 47)


def gala_view(c, x0, y0, x1, y1, rng):
    """The centennial gala seen from the booth: a lit scene behind glass (all emissive)."""
    w, h = x1 - x0, y1 - y0
    E = 1.0
    # far wall of the hall: warm cream, pilasters, tall arched windows with red drapes
    c.rect(x0, y0, x1, y1, 'cream', vgrad(y0, y1, .62, .5), emis=E, dith=.5)
    for k, px in enumerate(range(x0 - 6, x1 + 10, 26)):
        c.rect(px, y0, px + 5, y0 + 30, 'cream', hgrad(px, px + 5, .82, .55), emis=E, dith=.3)     # pilaster
        c.hline(px - 1, px + 6, y0 + 3, 'gold', .7, emis=E)
        ax = px + 13
        c.rect(ax - 5, y0 + 6, ax + 6, y0 + 28, 'night', vgrad(y0 + 6, y0 + 28, .3, .2), emis=E, dith=.3)
        c.ellipse(ax + .5, y0 + 6, 5.5, 4, 'night', .32, emis=E, dith=0)
        for dx in (-5, 5):
            c.rect(ax + dx - (1 if dx < 0 else 0), y0 + 4, ax + dx + (1 if dx < 0 else 2), y0 + 28, 'red', .55,
                   emis=E, dith=.3)
    c.rect(x0, y0 + 28, x1, y0 + 31, 'gold', .55, emis=E, dith=0)                       # gallery rail
    c.hline(x0, x1, y0 + 28, 'gold', .85, emis=E)
    # bunting swags along the gallery
    cols = ['red', 'white', 'neonblue']
    for k in range(x0, x1, 12):
        for t in range(12):
            yy = y0 + 31 + int(3 * math.sin(math.pi * t / 12))
            c.put(k + t, yy, cols[(k // 12) % 3], .65 if cols[(k // 12) % 3] != 'white' else .85, E)
            c.put(k + t, yy + 1, cols[(k // 12) % 3], .45, E)
    # the stage at the far end: banner, seal, lectern, Crane in a spotlight
    cx = x0 + int(w * .73)
    c.rect(cx - 27, y0 + 8, cx + 28, y0 + 17, 'red', .55, emis=E, dith=0)
    c.hline(cx - 27, cx + 28, y0 + 8, 'gold', .8, emis=E)
    c.hline(cx - 27, cx + 28, y0 + 16, 'gold', .7, emis=E)
    D.text(c, cx - 23, y0 + 10, '1851', 'paper', .95, emis=E)
    D.text(c, cx + 10, y0 + 10, '1951', 'paper', .95, emis=E)
    c.ellipse(cx + .5, y0 + 12.5, 5, 5, 'gold', .75, emis=E, dith=0)                   # city seal
    c.ellipse(cx + .5, y0 + 12.5, 3, 3, 'neonblue', .5, emis=E, dith=0)
    c.put(cx, y0 + 12, 'paper', .9, E)
    st_y = y0 + 34
    c.rect(cx - 28, st_y, cx + 28, st_y + 5, 'red', vgrad(st_y, st_y + 5, .5, .35), emis=E, dith=0)   # stage apron
    c.hline(cx - 28, cx + 28, st_y, 'gold', .8, emis=E)
    # spotlight cone on the lectern
    c.ellipse(cx + .5, st_y - 3, 12, 6, 'lamp', radial(cx, st_y - 3, 12, .95, .7), emis=E, dith=.5)   # spotlight pool
    c.rect(cx - 3, st_y - 6, cx + 4, st_y, 'oak', .5, emis=E, dith=0)                  # lectern
    c.hline(cx - 4, cx + 5, st_y - 6, 'oak', .8, emis=E)
    for mx in (cx - 2, cx + 1, cx + 3):
        c.vline(mx, st_y - 9, st_y - 6, 'chrome', .7, emis=E)
        c.put(mx, st_y - 10, 'chrome', .95, E)
    c.rect(cx - 1, st_y - 8, cx + 2, st_y - 7, 'white', .9, emis=E, dith=0)            # WBRK mic flag
    # Crane: white hair, black tails, behind the lectern
    c.rect(cx - 1, st_y - 12, cx + 2, st_y - 6, 'black', .2, emis=E, dith=0)
    c.rect(cx - 1, st_y - 15, cx + 2, st_y - 12, 'skin', .7, emis=E, dith=0)
    c.hline(cx - 1, cx + 2, st_y - 15, 'white', .95, E)
    c.put(cx, st_y - 10, 'white', .9, E)
    # dignitaries seated on the stage, the band to the left of it
    for k, sx in enumerate((cx - 22, cx - 17, cx - 12, cx + 10, cx + 15, cx + 20)):
        D.tiny_person(c, sx, st_y, 6, body='black', body_lum=.2, head='skin', head_lum=.65, legs='black', legs_lum=.15,
                      emis=E, hair='white' if k == 4 else None)
    for k in range(6):
        bx = x0 + 8 + k * 5
        D.tiny_person(c, bx, st_y + 6 + (k % 2), 6, body='white', body_lum=.8, head='skin', head_lum=.6,
                      legs='black', legs_lum=.2, emis=E)
        c.put(bx + 2, st_y + 3 + (k % 2), 'brass', .95, E)                              # a glint of brass
    # the floor: rows of round tables in white linen, guests in evening dress, candles
    c.rect(x0, st_y + 5, x1, y1, 'd_mahog', vgrad(st_y + 5, y1, .45, .55), emis=E, dith=.5)
    gown = ['red', 'neonblue', 'plum', 'felt', 'gold', 'mauve', 'paper']
    rows = [(st_y + 9, 4, 2.0, 5), (st_y + 15, 6, 2.6, 7), (y1 - 3, 8, 3.3, 9)]
    for ri, (ty, rx, ry, ph) in enumerate(rows):
        step = rx * 2 + 9 + ri * 3
        for k, tx in enumerate(range(x0 + 4 + (ri * 7) % 11, x1 + 4, step)):
            # guests behind the table
            for g in range(-1, 2):
                gx = tx + g * (rx - 1)
                ramp_ = 'black' if (k + g + ri) % 3 else gown[(k * 3 + g + ri) % len(gown)]
                D.tiny_person(c, gx, ty - 1, ph, body=ramp_, body_lum=.25 if ramp_ == 'black' else .6,
                              head='skin', head_lum=.62, legs=ramp_, legs_lum=.2, emis=E)
            c.ellipse(tx + .5, ty, rx, ry, 'white', .9, emis=E, dith=0)
            c.hline(int(tx - rx + 1), int(tx + rx), int(ty + ry - .5), 'white', .6, E)
            c.put(tx, int(ty - 1), 'lamp', 1.0, E)                                       # candle
            c.put(tx + 2, int(ty), 'glass', .9, E)
            # guests in front of the table (backs to us)
            if ri > 0:
                for g in (-1, 1):
                    gx = tx + g * rx
                    D.tiny_person(c, gx, int(ty + ry + ph * .6), ph, body='black', body_lum=.22, head='skin',
                                  head_lum=.45, legs='black', legs_lum=.15, emis=E, hair='black')
    # a waiter crossing with a tray
    D.tiny_person(c, x1 - 30, y1 - 10, 9, body='white', body_lum=.9, head='skin', head_lum=.6, legs='black',
                  legs_lum=.2, emis=E, arms_up=True)
    c.hline(x1 - 34, x1 - 29, y1 - 20, 'chrome', .9, E)
    # chandeliers hanging into the view (near, at our eye level)
    for (chx, chy, r_) in ((x0 + 22, y0 + 9, 12), (x0 + 60, y0 + 6, 10)):
        c.vline(chx, y0, chy - 6, 'brass', .55, E)                                  # chain
        c.ellipse(chx + .5, chy - 6, 2.5, 1.2, 'brass', .7, emis=E, dith=0)         # canopy
        # crystal body: a tapering cascade of drops
        for t in range(0, 15):
            wdt = r_ * math.sin(math.pi * min(1, (t + 2) / 15)) * (1 - t / 22)
            y = chy - 4 + t
            for xx in range(int(chx - wdt), int(chx + wdt) + 1):
                if (xx + t) % 2 == 0:
                    c.put(xx, y, 'ice', .62 + .3 * ((xx * 7 + t * 3) % 5 == 0), E)
        # two rings of arms with candle bulbs
        for (ty_, tw) in ((chy, r_ * .95), (chy + 5, r_ * .7)):
            c.ellipse(chx + .5, ty_ + .5, tw, 1.3, 'brass', .7, emis=E, dith=0)
            n = max(4, int(tw * .9))
            for k in range(n):
                xx = chx + (k / (n - 1) - .5) * 2 * tw * .92
                c.put(int(round(xx)), ty_ - 1, 'lamp', 1.0, E)
                c.put(int(round(xx)), ty_ - 2, 'white', 1.0, E)
        c.vline(chx, chy + 9, chy + 13, 'ice', .95, E)
        c.put(chx, chy + 14, 'white', 1.0, E)
    return [(x0 + 22, y0 + 9), (x0 + 60, y0 + 6), (cx, st_y - 8)]


def build():
    sc = Scene('radio_booth', W, H, seed=88)
    c = sc.c
    p = Persp(BX0, BX1, 0, FLOOR, horizon=-50, depth=300)
    zfront = p.z_at_floor_y(H + 2)
    zedge = 96
    rng = np.random.default_rng(3)

    # ------------------------------------------------------------- acoustic tile walls --
    def acoustic(u, v, base=.5):
        tu, tv = u % 12, v % 12
        L = base + ((np.floor(u / 12) * 5 + np.floor(v / 12) * 3) % 4) * .015
        holes = ((np.floor(tu) % 3) == 1) & ((np.floor(tv) % 3) == 1)
        L = np.where(holes, L - .17, L)
        L = np.where((tu < 1) | (tv < 1), L - .12, L)
        return L
    c.rect(BX0, 0, BX1, FLOOR - 6, 'd_acou', lambda xx, yy: acoustic(xx - BX0, yy), dith=.2)
    c.rect(BX0, FLOOR - 6, BX1, FLOOR, 'wood', .35, dith=0)                     # skirting
    c.hline(BX0, BX1, FLOOR - 6, 'wood', .55)
    for X, sgn in ((BX0, 1), (BX1, -1)):
        f = D.side_uv(p, X)

        def sw(xx, yy, f=f):
            Z, Y, s = f(xx, yy)
            return acoustic(Z * 1.0, (FLOOR - Y) * 1.0, .42)
        c.poly(p.quad([(X, 6, 0), (X, 6, zedge), (X, 220, zedge), (X, 220, 0)]), 'd_acou', sw, dith=.2)
        c.poly(p.quad([(X, 0, 0), (X, 0, zedge), (X, 6, zedge), (X, 6, 0)]), 'wood', .3, dith=0)
    # carpet
    fuv = D.floor_uv(p)
    Nf = noise2(W, H, 2, 14, 2)

    def carpet(xx, yy):
        X, Z, s = fuv(xx, yy)
        L = .5 + (Nf[np.clip(yy.astype(int), 0, H - 1), np.clip(xx.astype(int), 0, W - 1)] - .5) * .14
        L = L + np.where(((np.floor(X / 8) + np.floor(Z / 8)) % 2) == 0, .03, 0)
        return L
    c.poly(p.quad([(BX0, 0, 0), (BX1, 0, 0), (BX1, 0, zedge), (BX0, 0, zedge)]), 'plum', carpet, dith=.4)
    # rundown pages knocked to the floor, a coil of microphone cable
    for (X, Z, ang) in ((70, 30, .3), (78, 36, -.2), (112, 44, .5), (230, 40, -.4)):
        q = [(X, 0, Z), (X + 9, 0, Z + ang * 3), (X + 9 - ang * 4, 0, Z + 7 + ang * 3), (X - ang * 4, 0, Z + 7)]
        c.poly(p.quad([(a_, .3, b_) for (a_, _, b_) in q]), 'paper', .62, dith=0)
        l0 = p.P(X + 2, .3, Z + 2)
        c.hline(int(l0[0]), int(l0[0]) + 6, int(l0[1]), 'ink', .45)
    for t in range(40):
        a = t / 40 * 2 * math.pi * 2.3
        r_ = 5 - t * .06
        X, Z = 132 + math.cos(a) * r_, 46 + math.sin(a) * r_ * .9
        x_, y_ = p.P(X, .4, Z)
        c.put(int(x_), int(y_), 'black', .35)
    # cable trough along the floor from the console to the transmitter
    c.poly(p.quad([(150, .2, 24), (282, .2, 24), (282, .2, 28), (150, .2, 28)]), 'steel', .4, dith=0)

    # --------------------------------------------------------------- the window -------
    wx0, wy0, wx1, wy1 = WIN
    glints = gala_view(c, wx0 + 3, wy0 + 3, wx1 - 3, wy1 - 3, rng)
    # double glazing reflections
    for (ax, L) in ((wx0 + 52, .7), (wx0 + 56, .62), (wx1 - 36, .66)):
        for t in range(0, wy1 - wy0 - 6):
            x = ax + t // 2
            if wx0 + 3 <= x < wx1 - 3 and (t % 13) < 4:
                c.put(x, wy1 - 4 - t, 'cream', L, .8)
    c.rect(wx0, wy0, wx1, wy0 + 3, 'wood', .45, dith=0)
    c.rect(wx0, wy1 - 3, wx1, wy1, 'wood', .4, dith=0)
    c.rect(wx0, wy0, wx0 + 3, wy1, 'wood', .42, dith=0)
    c.rect(wx1 - 3, wy0, wx1, wy1, 'wood', .35, dith=0)
    c.hline(wx0, wx1, wy0, 'wood', .65)
    c.vline((wx0 + wx1) // 2, wy0 + 3, wy1 - 3, 'wood', .3)                       # pane division
    c.vline((wx0 + wx1) // 2 + 1, wy0 + 3, wy1 - 3, 'wood', .5)
    # WBRK call letters above the window
    c.rect(140, 4, 182, 11, 'black', .2, dith=0)
    D.text(c, 151, 5, 'WBRK', 'lamp', .55)
    c.line(142, 9, 147, 6, 'lamp', .5)
    c.line(175, 9, 180, 6, 'lamp', .5)

    # ----------------------------------------------------------------- the door --------
    x0, y0, x1, y1 = DOOR
    c.rect(x0 - 3, y0 - 3, x1 + 3, y1, 'wood', .3, dith=0)
    c.hline(x0 - 3, x1 + 3, y0 - 3, 'wood', .55)
    # padded soundproof door: buttoned leatherette
    D.quilt_surface(c, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], lambda xx, yy: (xx * 1.0, yy * 1.0), 'red', base=.4,
                    amp=.22, cw=8, ch=8, seam=.18, hi=.55, btn=.12, dith=.3)
    c.rect(x0 + 8, y0 + 6, x1 - 8, y0 + 14, 'wood', .3, dith=0)                   # small window
    c.rect(x0 + 9, y0 + 7, x1 - 9, y0 + 13, 'glass', .22, emis=.3, dith=0)
    c.put(x0 + 10, y0 + 8, 'glass', .8, emis=.5)
    # brass lock with the key turned in it
    c.rect(x1 - 6, 74, x1 - 2, 82, 'brass', .55, dith=0)
    c.put(x1 - 5, 75, 'brass', .95)
    c.rect(x1 - 5, 78, x1 - 3, 80, 'brass', .8, dith=0)
    c.put(x1 - 7, 79, 'brass', .7)
    c.put(x1 - 8, 79, 'brass', .6)
    c.hline(x0 + 1, x1 - 1, FLOOR - 1, 'lamp', .5, emis=1)                         # corridor light under the door
    # ON AIR lamp box (unlit: the bulb a ghost behind dark red glass)
    ox0, oy0, ox1, oy1 = ONAIR
    c.rect(ox0 - 1, oy0 - 1, ox1 + 1, oy1 + 1, 'black', .25, dith=0)
    c.rect(ox0, oy0, ox1, oy1, 'neonred', .2, dith=0)
    D.text(c, ox0 + 3, oy0 + 2, 'ON AIR', 'neonred', .5)
    c.hline(ox0, ox1, oy0, 'neonred', .35)
    c.rect(ox0 + 10, oy1 + 1, ox0 + 18, oy1 + 3, 'steel', .4, dith=0)             # bracket
    # talkback intercom box beside the door
    tx0, ty0, tx1, ty1 = TALK
    c.rect(tx0, ty0, tx1, ty1, 'steel', .45, dith=0)
    c.hline(tx0, tx1, ty0, 'steel', .72)
    c.vline(tx1 - 1, ty0, ty1, 'steel', .25)
    for yy in range(ty0 + 2, ty0 + 9, 2):
        c.hline(tx0 + 2, tx1 - 2, yy, 'black', .3)
    c.rect(tx0 + 3, ty1 - 6, tx1 - 3, ty1 - 2, 'chrome', .5, dith=0)              # TALK bar
    c.hline(tx0 + 3, tx1 - 3, ty1 - 6, 'chrome', .85)
    c.put(tx1 - 3, ty0 + 10, 'neonred', .5)                                        # pilot lamp (off)
    c.line(tx0 + 5, ty1, tx0 + 5, FLOOR - 6, 'black', .3)                          # cable

    # -------------------------------------------------------- patch bay + the card -----
    px0, py0, px1, py1 = PATCH
    c.rect(px0 - 1, py0 - 1, px1 + 1, py1 + 1, 'black', .25, dith=0)
    c.rect(px0, py0, px1, py1, 'steel', .32, dith=0)
    for row in range(8):
        yy = py0 + 2 + row * 5
        c.rect(px0 + 1, yy - 1, px1 - 1, yy, 'paper', .55, dith=0)                 # designation strip
        for col in range(6):
            xx = px0 + 2 + col * 4
            c.put(xx, yy + 2, 'black', .05)
            c.put(xx + 1, yy + 2, 'chrome', .7)
    # patch cords looping between jacks
    for (a, b, sag, r_) in (((px0 + 2, py0 + 9), (px0 + 14, py0 + 24), 6, 'neonred'),
                            ((px0 + 10, py0 + 14), (px0 + 22, py0 + 34), 8, 'black'),
                            ((px0 + 6, py0 + 29), (px0 + 18, py0 + 39), 5, 'neonblue')):
        for t in range(21):
            u = t / 20
            x = a[0] + (b[0] - a[0]) * u
            y = a[1] + (b[1] - a[1]) * u + math.sin(math.pi * u) * sag
            c.put(int(x), int(y), r_, .55 if r_ != 'black' else .2)
    c.rect(px0, py0 - 5, px1, py0 - 1, 'black', .25, dith=0)
    D.text(c, px0 + 1, py0 - 5, 'PATCH', 'paper', .55)
    # engineer's instruction card, pinned
    cx0, cy0, cx1, cy1 = CARD
    c.rect(cx0, cy0, cx1, cy1, 'paper', .85, dith=0)
    c.rect(cx0, cy0, cx1, cy0 + 2, 'neonred', .5, dith=0)
    for k in range(4):
        c.hline(cx0 + 2, cx1 - 2 - (k % 2) * 3, cy0 + 4 + k * 2, 'ink', .4)
    c.put((cx0 + cx1) // 2, cy0, 'chrome', .95)
    c.shadow_poly([(cx1, cy0 + 1), (cx1 + 1, cy0 + 2), (cx1 + 1, cy1 + 1), (cx0 + 1, cy1 + 1), (cx0 + 1, cy1)], .35)

    # ------------------------------------------------------------- the clock ----------
    def wall_clock(cc, hh=TIME[0], mm=TIME[1]):
        # the dial with hour + minute hands only; the sweep second hand is the 'clock' anim
        D.clock_face(cc, CLOCK[0], CLOCK[1], CLOCK[2], hh, mm, face='paper', face_lum=.9, rim='chrome',
                     rim_lum=.6, rim_w=2)

    def second_hand(cc, sec):
        # just the red sweep hand and the centre cap, so it composites over either dial (8:47 or clock_nine)
        rr = CLOCK[2] - 2
        a = sec / 60.0 * 2 * math.pi
        ex = CLOCK[0] + math.sin(a) * (rr - .6)
        ey = CLOCK[1] - math.cos(a) * (rr - .6)
        cc.line(math.floor(CLOCK[0]), math.floor(CLOCK[1]), math.floor(ex), math.floor(ey), 'neonred', .7)
        cc.put(math.floor(CLOCK[0]), math.floor(CLOCK[1]), 'black', .35)
    c.ellipse(CLOCK[0] + 1, CLOCK[1] + 1, CLOCK[2], CLOCK[2], 'black', .1)
    wall_clock(c)

    # ---------------------------------------------------------- transmitter rack -------
    T = TX
    p.box(c, T['X0'], T['X1'], 0, T['H'], T['Z0'], T['Z1'], 'steel', front=.42, top=.55, side=.3)
    fx0, fy0, fx1, fy1 = [int(round(v)) for v in p.front_rect(T['X0'], T['X1'], 0, T['H'], T['Z1'])]
    c.hline(fx0, fx1, fy0, 'steel', .7)
    c.vline(fx0, fy0, fy1, 'steel', .6)
    c.rect(fx0 + 2, fy0 + 3, fx1 - 2, fy0 + 9, 'black', .25, dith=0)
    D.text(c, fx0 + 4, fy0 + 4, 'WBRK', 'brass', .7)
    for k, mx in enumerate((fx0 + 6, fx1 - 7)):                                    # plate & grid meters
        c.ellipse(mx + .5, fy0 + 16.5, 4, 4, 'black', .2, dith=0)
        c.ellipse(mx + .5, fy0 + 16.5, 3, 3, 'd_amber', .7, emis=.8, dith=0)
        c.line(mx, fy0 + 18, mx - 2 + k * 3, fy0 + 14, 'black', .2)
    for k in range(4):                                                             # toggles + pilot lamps
        xx = fx0 + 3 + k * 4
        c.rect(xx, fy0 + 24, xx + 2, fy0 + 26, 'chrome', .55, dith=0)
        c.put(xx + 1, fy0 + 23, 'chrome', .9)
        c.put(xx + 1, fy0 + 28, ('neonred', 'felt', 'lamp', 'felt')[k], .8, .8)
    # the key switch: a big bakelite knob with a pointer, plate BOOTH / HALL / OFF
    KS = (fx0 + (fx1 - fx0) // 2, fy0 + 38)
    c.rect(KS[0] - 8, KS[1] - 6, KS[0] + 8, KS[1] + 6, 'black', .2, dith=0)
    c.rect(KS[0] - 7, KS[1] - 5, KS[0] + 7, KS[1] + 5, 'paper', .7, dith=0)
    c.ellipse(KS[0] + .5, KS[1] + 1.5, 3.4, 3.4, 'black', .3, dith=0)
    c.line(KS[0], KS[1] + 1, KS[0] - 2, KS[1] - 2, 'paper', .9)
    for (dx, dy) in ((-5, -3), (0, -4), (5, -3)):
        c.put(KS[0] + dx, KS[1] + dy, 'black', .2)
    for yy in range(fy0 + 48, fy1 - 4, 2):                                         # louvres
        c.hline(fx0 + 3, fx1 - 3, yy, 'black', .25)
    c.rect(fx0 - 1, fy1 - 3, fx1 + 1, fy1, 'steel', .3, dith=0)
    c.put(fx1 - 4, fy0 + 30, 'neonred', .9, 1)                                     # red pilot: carrier on

    # ------------------------------------------------------------- the console ---------
    K = CONS
    c.shadow_poly(p.quad([(K['X0'] - 2, 0, K['Z1']), (K['X1'] + 2, 0, K['Z1']), (K['X1'] + 4, 0, K['Z1'] + 6),
                          (K['X0'] - 4, 0, K['Z1'] + 6)]), .45)
    # base cabinet
    p.box(c, K['X0'], K['X1'], 0, K['Hf'], K['Z0'], K['Z1'], 'oak', front=.36, top=.5, side=.28,
          lum_fn=lambda xx, yy: .36 + np.where((xx.astype(int) % 18) == 0, -.08, 0))
    # meter bridge (vertical, at the back)
    mb = p.quad([(K['X0'] + 2, K['Hb'], K['Z0'] + 1), (K['X1'] - 2, K['Hb'], K['Z0'] + 1), (K['X1'] - 2, K['Hm'], K['Z0'] + 1),
                 (K['X0'] + 2, K['Hm'], K['Z0'] + 1)])
    c.poly(mb, 'steel', .32, dith=0)
    mbx0, mby0 = int(mb[3][0]), int(mb[3][1])
    mbx1, mby1 = int(mb[1][0]), int(mb[1][1])
    c.hline(mbx0, mbx1, mby0, 'steel', .62)
    METERS = [(116, mby0 + 2), (138, mby0 + 2), (176, mby0 + 2), (198, mby0 + 2)]

    def vu(cc, mx, my, ang):
        cc.rect(mx, my, mx + 13, my + 7, 'black', .2, dith=0)
        cc.rect(mx + 1, my + 1, mx + 12, my + 7, 'd_amber', vgrad(my, my + 7, .82, .62), emis=1, dith=0)
        for k in range(5):
            cc.put(mx + 2 + k * 2, my + 2 + (1 if k in (0, 4) else 0), 'black', .3, .5)
        cc.put(mx + 10, my + 2, 'neonred', .6, .8)
        cc.put(mx + 11, my + 3, 'neonred', .6, .8)
        a = math.radians(ang)
        px_, py_ = mx + 6.5, my + 8
        cc.line(int(px_), int(py_) - 1, int(round(px_ + math.sin(a) * 6)), int(round(py_ - math.cos(a) * 6)), 'black', .1)
    for i, (mx, my) in enumerate(METERS):
        vu(c, mx, my, (-30, -10, 5, -20)[i])
    for k in range(6):                                                             # indicator lamps
        c.put(158 + k * 3 - 6, mby0 + 4, ('felt', 'lamp', 'felt', 'neonred', 'felt', 'lamp')[k], .75, .9)
    # sloped control surface
    top = p.quad([(K['X0'], K['Hf'], K['Z1']), (K['X1'], K['Hf'], K['Z1']), (K['X1'], K['Hb'], K['Z0'] + 2),
                  (K['X0'], K['Hb'], K['Z0'] + 2)])
    c.poly(top, 'steel', .42, dith=.2)
    # faders (channel strips), knobs, keys
    for i, X in enumerate(range(K['X0'] + 10, K['X1'] - 8, 12)):
        a = p.P(X, K['Hb'] - 1, K['Z0'] + 4)
        b = p.P(X, K['Hf'] + 1, K['Z1'] - 3)
        c.line(int(a[0]), int(a[1]), int(b[0]), int(b[1]), 'black', .15)          # fader slot
        u = (.3, .55, .45, .2, .7, .4, .6, .35, .5, .25, .65, .45, .3, .5)[i % 14]
        fx = a[0] + (b[0] - a[0]) * u
        fy = a[1] + (b[1] - a[1]) * u
        c.rect(int(fx) - 2, int(fy) - 1, int(fx) + 3, int(fy) + 1, 'black', .3, dith=0)
        c.hline(int(fx) - 2, int(fx) + 3, int(fy) - 1, 'paper', .75)
        for (dx, kk) in ((-4, 0), (4, 1)):
            kx, ky = p.P(X + dx, K['Hb'] - 1.4, K['Z0'] + 5 + kk * 2)
            c.ellipse(kx, ky, 1.5, 1.2, 'black', .3, dith=0)
            c.put(int(kx), int(ky) - 1, 'chrome', .8)
        kx, ky = p.P(X, K['Hf'] + .4, K['Z1'] - 1)
        c.rect(int(kx) - 1, int(ky) - 1, int(kx) + 2, int(ky) + 1, ('neonred', 'paper', 'felt')[i % 3], .55, dith=0)
    fr = p.quad([(K['X0'], K['Hf'], K['Z1']), (K['X1'], K['Hf'], K['Z1'])])
    c.line(fr[0][0], fr[0][1], fr[1][0], fr[1][1], 'chrome', .75)                  # arm-rest rail
    # on the console: rundown on a clipboard, coffee, ashtray with a cigarette still going
    cb = p.quad([(206, K['Hf'] + 3, K['Z1'] - 9), (222, K['Hf'] + 2.4, K['Z1'] - 9), (222, K['Hf'] + 1, K['Z1'] - 2),
                 (206, K['Hf'] + 1.6, K['Z1'] - 2)])
    c.poly(cb, 'paper', .8, dith=0)
    c.rect(int(cb[0][0]) + 5, int(cb[0][1]) - 1, int(cb[0][0]) + 10, int(cb[0][1]) + 1, 'chrome', .8, dith=0)
    for k in range(3):
        a0 = p.P(208, K['Hf'] + 2.2 - k * .4, K['Z1'] - 7 + k * 1.6)
        c.hline(int(a0[0]), int(a0[0]) + 10, int(a0[1]), 'ink', .4)
    mx_, my_ = p.P(96, K['Hf'] + 1, K['Z1'] - 3)
    c.rect(int(mx_) - 2, int(my_) - 4, int(mx_) + 2, int(my_), 'white', .7, dith=0)  # coffee mug
    c.put(int(mx_) + 2, int(my_) - 3, 'white', .55)
    c.hline(int(mx_) - 1, int(mx_) + 1, int(my_) - 4, 'wood', .3)
    ax_, ay_ = p.P(228, K['Hf'] + 1, K['Z1'] - 3)
    c.ellipse(ax_, ay_, 3, 1.2, 'glass', .5, dith=0)
    c.line(int(ax_), int(ay_) - 1, int(ax_) + 4, int(ay_) - 2, 'paper', .9)
    c.put(int(ax_) + 5, int(ay_) - 2, 'neonred', .9, 1)

    # ----------------------------------------------- ribbon microphone on its boom ----
    sx, sy = p.P(92, 0, 26)
    bx_, by_ = p.P(92, 44, 26)
    c.ellipse(sx, sy, 5, 1.6, 'black', .3, dith=0)
    c.vline(int(sx), int(by_), int(sy), 'chrome', .55)
    c.vline(int(sx) + 1, int(by_), int(sy), 'steel', .35)
    MIC = (124, 54)
    c.line(int(sx), int(by_), MIC[0], MIC[1] - 9, 'chrome', .6)                     # boom arm
    c.line(int(sx), int(by_) + 1, MIC[0], MIC[1] - 8, 'steel', .3)
    c.line(int(sx) - 6, int(by_) - 2, int(sx), int(by_), 'steel', .5)               # counterweight
    c.rect(int(sx) - 9, int(by_) - 4, int(sx) - 5, int(by_), 'black', .3, dith=0)
    c.vline(MIC[0], MIC[1] - 9, MIC[1] - 6, 'chrome', .6)
    # the capsule (rounded, ribbed grille) + call-letter flag
    c.ellipse(MIC[0] + .5, MIC[1], 4, 5.6, 'chrome', radial(MIC[0] - 1.5, MIC[1] - 2.5, 6, .85, .35), dith=.2)
    for k in range(-4, 5, 2):
        c.hline(MIC[0] - 2, MIC[0] + 3, MIC[1] + k, 'steel', .3)
    c.vline(MIC[0], MIC[1] - 5, MIC[1] + 6, 'steel', .5)
    c.rect(MIC[0] - 5, MIC[1] + 6, MIC[0] + 6, MIC[1] + 11, 'black', .2, dith=0)
    c.rect(MIC[0] - 4, MIC[1] + 7, MIC[0] + 5, MIC[1] + 10, 'paper', .8, dith=0)
    c.hline(MIC[0] - 3, MIC[0] + 4, MIC[1] + 8, 'neonred', .5)
    c.line(MIC[0], MIC[1] + 11, int(sx) + 2, int(sy) - 30, 'black', .3)            # cable down the stand

    # ---------------------------------------------------- engineer's swivel chair ------
    chx, chz = 206, 36
    cxs, cys = p.P(chx, 0, chz)
    cxs, cys = int(cxs), int(cys)
    c.shadow_ellipse(cxs, cys, 9, 2.4, .55)
    for k in (-6, -2, 3, 7):
        c.put(cxs + k, cys - (1 if abs(k) < 4 else 0), 'black', .3)
    c.line(cxs - 6, cys, cxs + 7, cys - 1, 'chrome', .4)
    c.vline(cxs, cys - 10, cys, 'chrome', .55)
    c.ellipse(cxs + .5, cys - 11, 7, 2.2, 'wood', .45, dith=0)
    c.ellipse(cxs + .5, cys - 11.5, 6, 1.6, 'red', .4, dith=0)
    c.rect(cxs - 5, cys - 22, cxs + 6, cys - 14, 'red', .38, dith=0)               # back, turned away
    c.hline(cxs - 5, cxs + 6, cys - 22, 'red', .55)
    c.vline(cxs, cys - 14, cys - 11, 'chrome', .5)
    # headphones hung on the chair
    c.ellipse(cxs + 6, cys - 17, 2, 2.5, 'black', .3, dith=0)
    c.line(cxs + 6, cys - 20, cxs + 3, cys - 23, 'black', .3)

    # ---------------------------------------------- turntables (left foreground) -------
    T2 = TT
    p.box(c, T2['X0'], T2['X1'], 0, T2['H'], T2['Z0'], T2['Z1'], 'wood', front=.42, top=.5, side=.34)
    TURNS = []
    for (X, Z) in ((42, 42), (42, 56)):
        tx_, ty_ = p.P(X, T2['H'], Z)
        s_ = p.s(Z)
        rx_, ry_ = 9 * s_, 2.6 * s_
        c.ellipse(tx_, ty_, rx_ + 1, ry_ + .6, 'black', .25, dith=0)
        c.ellipse(tx_, ty_ - .5, rx_, ry_, 'black', .12, dith=0)                    # record
        c.ellipse(tx_, ty_ - .5, rx_ * .35, ry_ * .35, 'red', .55, dith=0)          # label
        c.put(int(tx_), int(ty_ - .5), 'chrome', .9)
        TURNS.append((tx_, ty_, rx_, ry_))
        # tone arm
        ax2, ay2 = p.P(X + 11, T2['H'] + 1, Z - 3)
        c.line(int(ax2), int(ay2), int(tx_ + rx_ * .45), int(ty_ - 1), 'chrome', .75)
        c.ellipse(ax2, ay2, 1.5, 1, 'chrome', .6, dith=0)
    # transcription discs in sleeves leaning against the cabinet
    dx_, dy_ = p.P(T2['X1'] + 1, 0, 50)
    for k in range(3):
        c.poly([(dx_ + k * 2, dy_ - 14 + k), (dx_ + 3 + k * 2, dy_ - 15 + k), (dx_ + 4 + k * 2, dy_ + 1), (dx_ + k * 2 + 1, dy_ + 1)],
               ('paper', 'trench', 'paper')[k], .6 - k * .08, dith=0)

    # gooseneck work lamp clamped to the right end of the console
    ga = p.P(240, K['Hb'], K['Z0'] + 3)
    gb = (int(ga[0]) + 6, int(ga[1]) - 16)
    for t in range(13):
        u = t / 12
        x = ga[0] + (gb[0] - ga[0]) * u + math.sin(u * math.pi) * -5
        y = ga[1] + (gb[1] - ga[1]) * u
        c.put(int(x), int(y), 'chrome', .6 - (t % 2) * .15)
    c.poly([(gb[0] - 4, gb[1] + 1), (gb[0] + 3, gb[1] - 2), (gb[0] + 5, gb[1] + 3), (gb[0] - 2, gb[1] + 5)], 'felt', .5, dith=0)
    c.line(gb[0] - 2, gb[1] + 5, gb[0] + 5, gb[1] + 3, 'lamp', .95, emis=1)
    GL = (gb[0] + 1, gb[1] + 4)

    # ---------------------------------------------------------------- lighting --------
    c.ambient = .46
    c.add_light(160, 46, 200, .62, falloff=1.15)                  # the hall's light through the window
    c.add_light(GL[0], GL[1] + 2, 70, .5, falloff=1.3)            # gooseneck work lamp
    c.add_light(GL[0] - 4, 104, 40, .3, ystretch=2.4)
    c.light_poly([(96, 116), (226, 116), (250, 143), (70, 143)], .1)
    c.add_light(160, 96, 120, .3, ystretch=2.2)                   # spill across the console and floor
    c.add_light(158, mby0 + 4, 60, .25)                           # meter glow
    c.add_light(43, FLOOR + 2, 26, .3, ystretch=3)                # corridor under the door
    c.glow(160, 40, 110, '#ffd890', .22)
    for (gx, gy) in glints[:2]:
        c.glow(gx, gy, 18, '#fff0c0', .5)
    c.glow(glints[2][0], glints[2][1], 14, '#fff8e0', .35)
    c.glow(158, mby0 + 5, 30, '#ffb040', .2)
    c.glow(GL[0], GL[1], 12, '#ffd080', .4)
    c.shade *= np.clip(1.22 - np.abs(np.arange(W)[None, :] - 165) / 230.0, .7, 1)
    c.shade *= np.clip(1.08 - np.abs(np.arange(H)[:, None] - 50) / 220.0, .78, 1)

    # ----------------------------------------------------------- state objects --------
    with sc.obj('onair_lit', state=True, depth=FLOOR - 2) as cc:
        D.dfill_rect(cc, ox0 - 8, oy0 - 6, ox1 + 8, oy1 + 7, 'neonred', .32,
                     lambda xx, yy: np.clip(1 - np.sqrt(((xx - (ox0 + ox1) / 2) / 20) ** 2 + ((yy - (oy0 + oy1) / 2) / 9) ** 2), 0, 1) * .8,
                     emis=.7)
        cc.rect(ox0 - 1, oy0 - 1, ox1 + 1, oy1 + 1, 'black', .25, dith=0)
        cc.rect(ox0, oy0, ox1, oy1, 'neonred', vgrad(oy0, oy1, .9, .75), emis=1, dith=0)
        D.text(cc, ox0 + 3, oy0 + 2, 'ON AIR', 'white', 1.0, emis=1)
        cc.hline(ox0, ox1, oy0, 'neonred', 1.0, emis=1)
    with sc.obj('bulb_removed', state=True, depth=FLOOR - 2) as cc:
        # the red front swung down on its hinge, an empty socket inside
        cc.rect(ox0, oy0, ox1, oy1, 'black', .12, dith=0)
        cc.ellipse((ox0 + ox1) / 2 + .5, (oy0 + oy1) / 2 + .5, 2.5, 2.5, 'brass', .5, dith=0)
        cc.ellipse((ox0 + ox1) / 2 + .5, (oy0 + oy1) / 2 + .5, 1.3, 1.3, 'black', .1, dith=0)
        cc.rect(ox0 + 1, oy1 + 1, ox1 - 1, oy1 + 3, 'neonred', .3, dith=0)
        cc.hline(ox0 + 1, ox1 - 1, oy1 + 3, 'black', .3)
    with sc.obj('clock_nine', state=True, depth=FLOOR - 2) as cc:
        # nine o'clock (flag c8_nine): the whole dial redrawn opaque, so no 8:47 hand can show through
        wall_clock(cc, 9, 0)

    # --------------------------------------------------------------- animations -------
    def meters(k):
        def fn(cc):
            for i, (mx, my) in enumerate(METERS):
                ang = -32 + 30 * abs(math.sin(k * 1.7 + i * 1.3)) + (8 if (k + i) % 3 == 0 else 0)
                vu(cc, mx, my, ang)
        return fn
    sc.anim('meters', [meters(k) for k in range(8)], fps=6)
    sc.anim('clock', [lambda cc, s=s: second_hand(cc, s) for s in range(60)], fps=1, depth=FLOOR - 1)

    def turntable(k):
        def fn(cc):
            for (tx_, ty_, rx_, ry_) in TURNS:
                cc.ellipse(tx_, ty_ - .5, rx_, ry_, 'black', .12, dith=0)
                for t in range(3):
                    a = (k / 4 + t / 3) * 2 * math.pi
                    cc.put(int(round(tx_ + math.cos(a) * rx_ * .7)), int(round(ty_ - .5 + math.sin(a) * ry_ * .7)),
                           'chrome', .45)
                cc.ellipse(tx_, ty_ - .5, rx_ * .35, ry_ * .35, 'red', .55, dith=0)
                a = k / 4 * 2 * math.pi
                cc.put(int(round(tx_ + math.cos(a) * rx_ * .25)), int(round(ty_ - .5 + math.sin(a) * ry_ * .25)), 'paper', .9)
                cc.put(int(tx_), int(ty_ - .5), 'chrome', .9)
        return fn
    sc.anim('turntable', [turntable(k) for k in range(4)], fps=8)

    def sparkle(k):
        def fn(cc):
            r2 = np.random.default_rng(100 + k)
            for (gx, gy) in glints[:2]:
                for t in range(4):
                    x = gx + int(r2.integers(-11, 12))
                    y = gy + int(r2.integers(-3, 9))
                    cc.put(x, y, 'white', 1.0, 1)
        return fn
    sc.anim('chandeliers', [sparkle(k) for k in range(4)], fps=4)

    # ------------------------------------------------------- interaction geometry -----
    door_spot = (44, 110)
    sc.hotspot('door', rect=(x0 - 3, y0 - 3, x1 + 3, y1), walk=door_spot, face='up')
    sc.hotspot('onair_lamp', rect=(ox0 - 2, oy0 - 2, ox1 + 2, oy1 + 4), walk=door_spot, face='up')
    sc.hotspot('talkback', rect=(tx0 - 1, ty0 - 1, tx1 + 1, ty1 + 1), walk=(66, 110), face='up')
    sc.hotspot('window', rect=(wx0, wy0, wx1, wy1 - 6), walk=(160, 116), face='up')
    sc.hotspot('console', poly=[(int(mb[3][0]), int(mb[3][1])), (int(mb[2][0]), int(mb[2][1])), (int(top[1][0]), int(top[1][1])),
                                (int(top[1][0]), int(p.P(0, 0, K['Z1'])[1])), (int(top[0][0]), int(p.P(0, 0, K['Z1'])[1])),
                                (int(top[0][0]), int(top[0][1]))], walk=(160, 116), face='up')
    sc.hotspot('mic', rect=(MIC[0] - 6, MIC[1] - 10, MIC[0] + 7, MIC[1] + 12), walk=(124, 116), face='up')
    sc.hotspot('patch_bay', rect=(px0 - 2, py0 - 6, px1 + 2, py1 + 2), walk=(259, 110), face='up')
    sc.hotspot('card', rect=(cx0 - 1, cy0 - 1, cx1 + 2, cy1 + 2), walk=(258, 110), face='up')
    sc.hotspot('clock', rect=(int(CLOCK[0] - CLOCK[2]) - 1, int(CLOCK[1] - CLOCK[2]) - 1, int(CLOCK[0] + CLOCK[2]) + 2,
                              int(CLOCK[1] + CLOCK[2]) + 2), walk=(259, 110), face='up')
    sc.hotspot('transmitter', rect=(fx0 - 1, fy0 - 2, fx1 + 1, fy1), walk=(276, 116), face='up')
    tt0 = p.P(T2['X0'], T2['H'], T2['Z0'])
    tt1 = p.P(T2['X1'], 0, T2['Z1'])
    sc.hotspot('turntable', rect=(0, int(tt0[1]) - 4, int(p.P(T2['X1'], 0, T2['Z0'])[0]) + 2, int(tt1[1])), walk=(56, 126),
               face='left')
    # extras
    sc.hotspot('chair', rect=(cxs - 7, cys - 24, cxs + 9, cys + 2), walk=(186, 128), face='right')

    def W3(X, Z):
        x_, y_ = p.P(X, 0, Z)
        return (int(round(x_)), int(round(y_)))
    fl = [W3(BX0 + 2, 4), W3(K['X0'] - 3, 4), W3(K['X0'] - 3, K['Z1'] + 3), W3(K['X1'] + 3, K['Z1'] + 3),
          W3(K['X1'] + 3, 6), W3(T['X0'] - 2, 6), W3(T['X0'] - 2, T['Z1'] + 3), W3(BX1 - 2, T['Z1'] + 3),
          W3(BX1 - 2, zfront), W3(BX0 + 2, zfront)]
    holes = [[W3(T2['X0'] - 6, T2['Z0'] - 3), W3(T2['X1'] + 5, T2['Z0'] - 3), W3(T2['X1'] + 5, zfront + 5),
              W3(T2['X0'] - 6, zfront + 5)],
             [W3(chx - 9, chz - 5), W3(chx + 9, chz - 5), W3(chx + 9, chz + 5), W3(chx - 9, chz + 5)],
             [W3(86, K['Z1'] + 1), W3(98, K['Z1'] + 1), W3(98, 30), W3(86, 30)]]
    sc.walkable(fl, holes=holes)
    sc.point('start', 160, 122, face='up')
    sc.point('wake', 50, 106, face='down')
    sc.point('console_spot', 160, 116, face='up')
    sc.point('door_spot', *door_spot, face='up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, round(p.char_scale(FLOOR, 140), 3), 140, 1.0)
    sc.meta['floor'] = 'carpet'
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
