"""1st Precinct (Ch3 day, Ch5 night). 400 wide. Base = rainy day, variant 'night'.

Left: street door, bench under wanted posters, the duty officer's raised front desk (Pruitt).
Centre: door to the holding cells, evidence room door.  Right: Delaney's glass-walled office.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from core import Light, vgrad, hgrad, radial, noise2
from persp import Persp, tile_floor
import furniture as F
import props_c as C

W, H = 400, 144
FLOOR = 88
_V = {}
P = C.P


def wanted_poster(c, x, y, w=13, h=17, seed=0, reward=True):
    rng = np.random.default_rng(seed)
    c.rect(x + 1, y + 1, x + w + 1, y + h + 1, 'c_mint', .2)
    c.rect(x, y, x + w, y + h, 'paper', vgrad(y, y + h, .78, .66))
    c.hline(x + 1, x + w - 1, y + 1, 'black', .2)               # WANTED bar
    c.hline(x + 2, x + w - 2, y + 2, 'black', .2)
    # mug shot
    fx = x + w // 2
    c.rect(x + 3, y + 4, x + w - 3, y + 11, 'slate', .62)
    c.ellipse(fx, y + 7, 2.2, 2.6, 'slate', .3)
    c.rect(fx - 3, y + 9, fx + 4, y + 11, 'slate', .25)
    if rng.random() < .5:
        c.hline(fx - 2, fx + 3, y + 5, 'slate', .15)          # hat brim
    for ly in range(y + 12, y + h - 1, 2):
        c.hline(x + 2, x + w - 2 - int(rng.integers(0, 4)), ly, 'paper', .42)
    if reward:
        c.hline(x + 2, x + 7, y + h - 2, 'red', .5)
    c.put(x + w // 2, y, 'brass', .8)
    if rng.random() < .4:                                     # curling corner
        c.put(x + w - 1, y + h - 1, 'paper', .95)
        c.put(x + w - 2, y + h - 1, 'paper', .5)


def bench(c, p, X0, X1, Z0, Z1, lum=.42):
    seat = 12
    for X in (X0 + 2, X1 - 4):
        p.box(c, X, X + 2, 0, seat, Z1 - 3, Z1 - 1, 'oak', front=lum - .15, side=lum - .25)
    p.box(c, X0, X1, seat, seat + 2, Z0, Z1, 'oak', front=lum + .05, top=lum + .2, side=lum - .1,
          top_fn=C.grain_h(lum + .2, .03, .9))
    p.box(c, X0, X1, seat + 6, seat + 16, Z0, Z0 + 2, 'oak', front=lum, top=lum + .15,
          lum_fn=C.grain_h(lum, .03, 1.2))
    for X in range(int(X0) + 4, int(X1) - 2, 8):
        p.box(c, X, X + 1, seat + 2, seat + 6, Z0, Z0 + 1, 'oak', front=lum - .1)
    a = P(p, X0, seat + 2, Z1)
    b = P(p, X1, seat + 2, Z1)
    c.hline(a[0], b[0], a[1], 'oak', lum + .35)


def globe_lamp(c, x, y, on=True, r=4):
    """Opal glass ceiling globe on a rod. (x, y) = globe centre."""
    c.vline(x, 0, y - r - 1, 'black', .4)
    c.rect(x - 2, y - r - 2, x + 3, y - r, 'brass', .5)
    if on:
        c.ellipse(x + .5, y, r, r, 'cream', radial(x - 1, y - 1, r * 1.6, 1.0, .75), emis=1)
    else:
        c.ellipse(x + .5, y, r, r, 'cream', radial(x - 1, y - 1, r * 1.6, .62, .38), emis=.2)
        c.put(x - 1, y - 2, 'white', .85)


def build():
    sc = C.SceneC('precinct', W, H, seed=41)
    c = sc.c
    p = Persp(36, 364, 0, FLOOR, horizon=-62, depth=420)
    zf = p.z_at_floor_y(H + 2)
    lay = C.Layer(c)
    alt = lay.alt('night')
    by = lambda Z: int(round(p.P(0, 0, Z)[1]))
    bx = lambda X, Z: int(round(p.P(X, 0, Z)[0]))

    # ---- shell: two-tone institutional paint ----------------------------------------------------
    WAIN = 30                                  # height of the green dado
    upper = C.noisy(vgrad(0, FLOOR - WAIN, .54, .62), W, H, 8, .03, seed=3)
    lower = C.noisy(vgrad(FLOOR - WAIN, FLOOR, .5, .44), W, H, 6, .03, seed=4)
    c.rect(36, 0, 364, FLOOR - WAIN, 'c_plaster', upper)
    c.rect(36, FLOOR - WAIN, 364, FLOOR, 'c_mint', lower)
    c.rect(36, FLOOR - WAIN - 2, 364, FLOOR - WAIN, 'c_mint', .3)
    c.hline(36, 364, FLOOR - WAIN - 2, 'c_mint', .2)
    c.rect(36, FLOOR - 3, 364, FLOOR, 'black', .35)
    for X, lumw in ((36, .9), (364, .82)):
        hi = p.quad([(X, WAIN, 0), (X, WAIN, zf), (X, 200, zf), (X, 200, 0)])
        lo = p.quad([(X, 0, 0), (X, 0, zf), (X, WAIN, zf), (X, WAIN, 0)])
        c.poly(hi, 'c_plaster', .5 * lumw)
        c.poly(lo, 'c_mint', .44 * lumw)
        c.poly(p.quad([(X, WAIN - 1, 0), (X, WAIN - 1, zf), (X, WAIN + 1, zf), (X, WAIN + 1, 0)]), 'c_mint', .25)
        c.poly(p.quad([(X, 0, 0), (X, 0, zf), (X, 3, zf), (X, 3, 0)]), 'black', .3)
    c.rect(36, 0, 364, 4, 'c_plaster', .3)
    # water stain + a long crack
    c.modulate(150, 4, 176, 30, lambda xx, yy: 1 - .1 * np.clip(1 - np.hypot(xx - 163, (yy - 8) * .6) / 14, 0, 1))
    c.line(250, 6, 254, 14, 'c_plaster', .38)
    c.line(254, 14, 252, 22, 'c_plaster', .38)
    # linoleum floor, worn
    tile_floor(c, p, 36, 364, 0, zf, ramp='c_lino', size=14, base=.6, alt=.44, grout=.32)
    N = noise2(W, H, 7, 5, 2)
    c.modulate(0, FLOOR, W, H, lambda xx, yy: 1 + (N[np.clip(yy.astype(int), 0, H - 1),
                                                     np.clip(xx.astype(int), 0, W - 1)] - .5) * .25)

    mat = p.quad([(38, .1, 4), (64, .1, 4), (66, .1, 22), (38, .1, 22)])
    c.poly(mat, 'c_tan', C.noisy(.36, W, H, 2, .06, seed=8))
    for Z in range(6, 22, 3):
        a_ = P(p, 39, .1, Z)
        b_ = P(p, 65, .1, Z)
        c.hline(a_[0], b_[0], a_[1], 'c_tan', .28)
    # muddy footprints from the door to the desk
    for i, (X, Z) in enumerate(((52, 26), (58, 32), (66, 36), (76, 42), (86, 44), (98, 47), (110, 46))):
        x_, y_ = P(p, X + (i % 2) * 3, 0, Z)
        c.hline(x_, x_ + 2, y_, 'c_mud', .45)
        c.put(x_ + 1, y_ - 1, 'c_mud', .38)
    # ---- street door (far left) --------------------------------------------------------------
    D0, D1 = 40, 62
    dtop = FLOOR - 44
    c.rect(D0 - 3, dtop - 12, D1 + 3, FLOOR, 'oak', .34)
    c.hline(D0 - 3, D1 + 3, dtop - 12, 'oak', .62)
    c.vline(D0 - 3, dtop - 12, FLOOR, 'oak', .52)
    with lay.base():
        c.rect(D0, dtop - 9, D1, dtop - 2, 'c_sky', .7, emis=.7)                 # transom (day)
    alt.rect(D0, dtop - 9, D1, dtop - 2, 'night', .3, emis=.9)
    c.rect(D0, dtop, D1, FLOOR, 'oak', C.grain_v(.42, .02, 1.2))
    c.vline(D0 + 10, dtop, FLOOR, 'oak', .25)
    for (a, b) in ((D0 + 2, D0 + 9), (D0 + 12, D1 - 2)):
        with lay.base():
            c.rect(a, dtop + 3, b, dtop + 22, 'c_frost', vgrad(dtop + 3, dtop + 22, .66, .54), emis=.4)
        alt.rect(a, dtop + 3, b, dtop + 22, 'c_frost', vgrad(dtop + 3, dtop + 22, .36, .28), emis=.5)
        alt.ellipse((a + b) / 2, dtop + 9, 2.5, 2.5, 'c_emerald', .8, emis=1)    # green lamp outside
        C.pane_glint(c, a, dtop + 3, b, dtop + 22)
        c.rect(a, dtop + 25, b, FLOOR - 4, 'oak', .36)
    c.rect(D0 + 7, dtop + 22, D0 + 9, dtop + 26, 'brass', .7)
    c.rect(D0 + 12, dtop + 22, D0 + 14, dtop + 26, 'brass', .7)
    c.hline(D0, D1, FLOOR - 1, 'c_sky', .45, emis=.5)
    # coat stand + umbrella by the door
    C.coat_rack(c, D1 + 6, by(8), h=40)
    c.rect(D1 + 3, by(8) - 34, D1 + 9, by(8) - 22, 'c_navy', vgrad(0, 1, .4, .4))    # uniform raincoat
    c.hline(D1 + 3, D1 + 9, by(8) - 34, 'c_navy', .6)
    c.line(D1 + 1, by(8) - 2, D1 + 3, by(8) - 16, 'black', .4)                       # umbrella
    c.poly([(D1, by(8) - 4), (D1 + 3, by(8) - 16), (D1 + 5, by(8) - 4)], 'black', .32)

    # ---- bench + wanted posters ----------------------------------------------------------------
    for i, (x, y) in enumerate(((74, 30), (89, 28), (82, 49))):
        wanted_poster(c, x, y, seed=i + 2, reward=i % 2 == 0)
    # newly pinned: MISSING - WENDELL PIKE (crisper paper, red header, a press photo)
    mx, my = 101, 33
    c.rect(mx + 1, my + 1, mx + 17, my + 22, 'c_mint', .2)
    c.rect(mx, my, mx + 16, my + 21, 'paper', vgrad(my, my + 21, .9, .8))
    c.rect(mx + 1, my + 1, mx + 15, my + 4, 'red', .5)
    c.hline(mx + 2, mx + 14, my + 2, 'paper', .8)
    c.rect(mx + 4, my + 6, mx + 12, my + 14, 'slate', .6)
    c.ellipse(mx + 8, my + 9, 2, 2.3, 'slate', .3)
    c.rect(mx + 5, my + 11, mx + 11, my + 14, 'slate', .25)
    c.hline(mx + 5, mx + 11, my + 7, 'slate', .2)                      # hat brim
    for ly in (my + 16, my + 18):
        c.hline(mx + 2, mx + 14, ly, 'black', .35)
    c.put(mx + 8, my, 'red', .8)
    wanted_poster(c, 97, 54, seed=9, reward=True)
    c.rect(72, 22, 120, 27, 'black', .3)
    C.text(c, 76, 22, 'WANTED', 'paper', .78)
    c.put(118, 24, 'red', .6)
    bench(c, p, 70, 120, 1, 11)
    nx_, ny_ = P(p, 100, 14, 7)
    c.poly([(nx_ - 6, ny_), (nx_ + 6, ny_ - 1), (nx_ + 7, ny_ + 2), (nx_ - 5, ny_ + 3)], 'paper', .72)
    c.hline(nx_ - 4, nx_ + 4, ny_ + 1, 'paper', .45)
    c.put(nx_ - 3, ny_, 'black', .3)
    # spittoon + butts
    sx_, sy_ = P(p, 124, 0, 9)
    c.ellipse(sx_, sy_ - 2, 3, 2, 'brass', .5)
    c.ellipse(sx_, sy_ - 3, 2, .8, 'black', .2)
    c.hline(sx_ - 3, sx_ + 4, sy_ - 1, 'brass', .3)
    for (X, Z) in ((90, 16), (100, 20), (128, 14)):
        x_, y_ = P(p, X, 0, Z)
        c.hline(x_, x_ + 2, y_, 'paper', .7)

    C.text(c, 139, 10, '1ST PRECINCT', 'c_mint', .3)
    C.text(c, 138, 9, '1ST PRECINCT', 'gold', .62)
    # ---- behind the front desk: duty board, radio, clock -----------------------------------------
    c.rect(136, 22, 190, 46, 'black', .3)                              # duty roster blackboard
    c.rect(137, 23, 189, 45, 'c_jade', .22)
    c.rect(136, 22, 190, 23, 'oak', .6)
    c.rect(136, 45, 190, 47, 'oak', .45)
    C.text(c, 140, 25, 'DUTY', 'paper', .62)
    for k, ly in enumerate(range(32, 44, 3)):
        c.hline(140, 152 + (k * 5) % 9, ly, 'paper', .5)
        c.hline(158, 168 + (k * 3) % 7, ly, 'paper', .45)
        c.put(175 + k, ly, 'paper', .5)
    c.rect(172, 46, 184, 48, 'paper', .7)                               # chalk + rag
    C.round_clock(c, 200, 18, r=7, hh=3, mm=10)
    c.vline(200, 4, 9, 'black', .4)
    _V['clock'] = (200, 18)
    # police radio on a wall shelf
    c.rect(140, 52, 176, 54, 'oak', .55)
    c.hline(140, 176, 52, 'oak', .8)
    c.rect(144, 40 + 6, 166, 52, 'slate', hgrad(144, 166, .45, .3))
    c.hline(144, 166, 46, 'slate', .62)
    c.rect(146, 48, 156, 51, 'c_amber', .6, emis=.4)                     # dial window
    c.vline(150, 48, 51, 'black', .3)
    c.ellipse(160, 49.5, 1.6, 1.6, 'chrome', .7)
    c.ellipse(164, 49.5, 1.2, 1.2, 'chrome', .6)
    c.line(170, 52, 172, 44, 'black', .4)                                # mic on its stand
    c.ellipse(172, 43, 1.5, 1.5, 'chrome', .7)

    # ---- cells door + evidence door ------------------------------------------------------------
    E0, E1 = 206, 228
    c.rect(E0 - 3, dtop - 3, E1 + 3, FLOOR, 'steel', .32)
    c.hline(E0 - 3, E1 + 3, dtop - 3, 'steel', .58)
    c.vline(E0 - 3, dtop - 3, FLOOR, 'steel', .5)
    c.rect(E0, dtop, E1, FLOOR, 'c_mint', C.grain_v(.36, .01, 1.0))
    c.rect(E0 + 5, dtop + 6, E1 - 5, dtop + 16, 'black', .22)            # barred window
    with lay.base():
        c.rect(E0 + 6, dtop + 7, E1 - 6, dtop + 15, 'c_mint', .45, emis=.3)
    alt.rect(E0 + 6, dtop + 7, E1 - 6, dtop + 15, 'lamp', .45, emis=.8)   # corridor bulb at night
    for X in range(E0 + 7, E1 - 5, 3):
        c.vline(X, dtop + 6, dtop + 16, 'steel', .6)
    c.rect(E1 - 6, dtop + 22, E1 - 3, dtop + 27, 'chrome', .55)
    c.put(E1 - 5, dtop + 23, 'chrome', .9)
    c.rect(E0 + 2, FLOOR - 8, E1 - 2, FLOOR - 3, 'steel', .4)              # kick plate
    c.rect(E0 - 1, dtop - 11, E1 + 1, dtop - 4, 'black', .35)
    C.text(c, E0 + 2, dtop - 10, 'CELLS', 'paper', .78)
    # evidence room: steel door, padlocked hasp
    V0, V1 = 238, 262
    c.rect(V0 - 3, dtop - 3, V1 + 3, FLOOR, 'steel', .3)
    c.hline(V0 - 3, V1 + 3, dtop - 3, 'steel', .55)
    c.rect(V0, dtop, V1, FLOOR, 'steel', hgrad(V0, V1, .5, .38))
    for X in (V0 + 1, V1 - 2):
        for yy in range(dtop + 2, FLOOR - 1, 5):
            c.put(X, yy, 'steel', .78)
    for yy in (dtop + 1, (dtop + FLOOR) // 2, FLOOR - 2):
        for X in range(V0 + 2, V1 - 1, 4):
            c.put(X, yy, 'steel', .75)
    c.rect(V0 + 6, dtop + 6, V1 - 6, dtop + 14, 'black', .25)            # wire-mesh window
    for X in range(V0 + 6, V1 - 6, 2):
        for yy in range(dtop + 6, dtop + 14, 2):
            c.put(X + (yy // 2) % 2, yy, 'steel', .55)
    c.rect(V0 + 3, dtop + 17, V1 - 3, dtop + 30, 'paper', .74)
    c.hline(V0 + 3, V1 - 3, dtop + 17, 'paper', .9)
    C.text(c, V0 + 4, dtop + 18, 'KEEP', 'red', .55)
    C.text(c, V0 + 5, dtop + 24, 'OUT', 'red', .55)
    c.rect(V1 - 6, dtop + 32, V1 - 2, dtop + 34, 'steel', .7)             # hasp
    c.rect(V1 - 5, dtop + 34, V1 - 1, dtop + 39, 'brass', hgrad(V1 - 5, V1 - 1, .8, .45))
    c.put(V1 - 3, dtop + 36, 'black', .1)
    c.rect(V0 - 4, dtop - 11, V1 + 6, dtop - 4, 'black', .38)
    C.text(c, V0 - 2, dtop - 10, 'EVIDENCE', 'paper', .78)

    # narrow window with rain
    W0, W1 = 272, 286
    with lay.base():
        C.city_day(c, W0 + 2, 18, W1 - 2, 60, seed=3)
    C.city_night(alt, W0 + 2, 18, W1 - 2, 60, seed=3)
    F.rain_on_glass(c, W0 + 2, 18, W1 - 2, 60, seed=12, density=.03)
    C.tall_window(c, W0, 16, W1, 62)
    F.radiator(c, W0, 68, W1, FLOOR - 4, ramp='c_mint', lum=.5)

    # ---- Delaney's office: interior first (glass box X 290..364, Z 0..34) ------------------------
    OX0, OZ = 290, 34
    # back wall of the office: wood panelling to the dado, cream above (it's the same wall)
    c.rect(OX0, FLOOR - WAIN, 364, FLOOR, 'wood', C.grain_h(.4, .03, 1.3))
    c.hline(OX0, 364, FLOOR - WAIN, 'wood', .62)
    for X in range(OX0 + 6, 364, 12):
        c.vline(X, FLOOR - WAIN + 2, FLOOR - 3, 'wood', .28)
    # window with venetian blinds
    BW0, BW1 = 334, 360
    with lay.base():
        c.rect(BW0, 26, BW1, 58, 'c_sky', .8, emis=.8, dith=.2)
    alt.rect(BW0, 26, BW1, 58, 'night', .26, emis=.9, dith=.2)
    alt.rect(BW0 + 14, 30, BW1 - 4, 36, 'neonblue', .6, emis=1)           # neon across the street
    for yy in range(27, 58, 2):
        c.hline(BW0, BW1, yy, 'cream', .62, emis=.4)
    c.rect(BW0 - 2, 24, BW1 + 2, 26, 'wood', .5)
    c.rect(BW0 - 2, 58, BW1 + 2, 60, 'wood', .55)
    c.vline(BW1 - 3, 26, 63, 'paper', .5)
    # framed photo: Frank and Commissioner Crane at the yacht club, both holding a cup
    c.rect(314, 34, 330, 48, 'gold', .5)
    c.hline(314, 330, 34, 'gold', .85)
    c.rect(316, 36, 328, 46, 'c_sky', vgrad(36, 46, .7, .5))           # sky over the water
    c.vline(318, 36, 42, 'slate', .4)                                   # a mast
    c.hline(316, 328, 43, 'slate', .45)
    c.ellipse(319, 40, 1.4, 1.6, 'slate', .3)                           # Frank (big)
    c.rect(317, 42, 322, 46, 'slate', .25)
    c.ellipse(326, 40, 1.2, 1.4, 'slate', .32)                          # Crane (thin)
    c.rect(324, 42, 328, 46, 'slate', .3)
    c.rect(322, 41, 324, 44, 'gold', .9)                                # the cup between them
    c.put(321, 41, 'gold', .7)
    c.put(324, 41, 'gold', .7)
    _V['photo'] = (313, 33, 331, 49)
    # filing cabinet (left-back corner of the office)
    fc = C.filing_cabinet(c, p, 292, 306, 0, 9, 36, 'olive', .48, drawers=4)
    _V['cabinet'] = fc
    c.rect(fc[0] + 2, fc[1] - 3, fc[0] + 8, fc[1], 'paper', .72)        # files on top
    # Delaney's leather chair behind the desk
    chx, chy = P(p, 328, 0, 3)
    c.rect(chx - 7, chy - 30, chx + 7, chy - 18, 'red', vgrad(chy - 30, chy - 18, .42, .3))
    c.hline(chx - 7, chx + 7, chy - 30, 'red', .6)
    c.ellipse(chx, chy - 30, 7, 1.5, 'red', .5)
    for k in range(chx - 5, chx + 6, 3):
        c.put(k, chy - 26, 'brass', .7)
    # desk
    DX0, DX1, DZ0, DZ1 = 310, 346, 6, 16
    with sc.obj('delaney_desk_obj', baseline=by(DZ1) + 1):
        peds = C.big_desk(c, p, DX0, DX1, DZ0, DZ1, Hd=22, ramp='wood', lum=.44, seed=9)
        fr = peds['r']
        lkx, lky = (fr[0] + fr[2]) // 2, fr[1] + 3
        c.rect(lkx - 1, lky - 1, lkx + 2, lky + 2, 'brass', .8)             # drawer lock
        c.put(lkx, lky, 'black', .1)
        _V['drawer'] = (fr[0] - 1, fr[1], fr[2] + 1, fr[1] + 8)
        # desk top: lamp, blotter, phone, gold lighter, ashtray
        elx, ely = P(p, 341, 22, 9)
        c.rect(elx - 1, ely - 6, elx + 1, ely, 'brass', .6)
        c.rect(elx - 3, ely - 1, elx + 3, ely + 1, 'brass', .45)
        with lay.base():
            c.poly([(elx - 5, ely - 6), (elx + 5, ely - 6), (elx + 4, ely - 9), (elx - 4, ely - 9)], 'c_jade', .5)
            c.hline(elx - 5, elx + 6, ely - 6, 'c_jade', .3)
        alt.poly([(elx - 5, ely - 6), (elx + 5, ely - 6), (elx + 4, ely - 9), (elx - 4, ely - 9)], 'c_jade', .78, emis=.45)
        alt.hline(elx - 5, elx + 6, ely - 6, 'lamp', .9, emis=1)
        bl0 = P(p, 318, 22, 11)
        bl1 = P(p, 334, 22, 16)
        c.rect(bl0[0], bl0[1], bl1[0], bl1[1], 'felt', .45)
        c.hline(bl0[0], bl1[0], bl0[1], 'felt', .65)
        F.telephone(c, *P(p, 330, 22, 9))
        gx, gy = P(p, 337, 22, 14)
        c.rect(gx, gy - 2, gx + 2, gy, 'gold', .85)                         # the gold gull lighter
        c.put(gx, gy - 3, 'gold', 1.0)
        C.ashtray(c, *P(p, 345, 22, 15), smoking=False)
        fx_, fy_ = P(p, 314, 22, 8)
        c.rect(fx_, fy_ - 6, fx_ + 5, fy_, 'gold', .55)                    # desk photo frame
        c.rect(fx_ + 1, fy_ - 5, fx_ + 4, fy_ - 1, 'slate', .55)
        c.put(fx_ + 2, fy_ - 4, 'slate', .8)
        pn = P(p, 326, 22, 14)
        c.line(pn[0], pn[1], pn[0] + 5, pn[1] - 1, 'black', .3)            # fountain pen
        c.put(pn[0] + 5, pn[1] - 1, 'gold', .9)
    # coat rack in the right-back corner (camel coat is a state)
    rkx, rky = P(p, 356, 0, 6)
    C.coat_rack(c, rkx, rky, h=42, ramp_name='wood', lum=.45)
    c.ellipse(rkx - 3, rky - 41, 4, 1.2, 'slate', .32)                  # grey fedora on top
    c.rect(rkx - 5, rky - 44, rkx - 1, rky - 41, 'slate', .4)
    _V['rack'] = (rkx, rky)
    # inside the office everything is seen through glass: a touch darker, cooler
    c.shade[20:FLOOR + 14, OX0:364] *= .9

    # ---- the glass partition (front at Z=34, left side at X=290) -------------------------------------
    with sc.obj('partition', baseline=by(OZ) + 1):
        # left side partition (perspective), glass with a wooden base and frame
        c.poly(p.quad([(OX0, 0, 0), (OX0, 0, OZ), (OX0, 5, OZ), (OX0, 5, 0)]), 'wood', .4)
        c.poly(p.quad([(OX0, 52, 0), (OX0, 52, OZ), (OX0, 56, OZ), (OX0, 56, 0)]), 'wood', .5)
        c.poly(p.quad([(OX0, 13, 0), (OX0, 13, OZ), (OX0, 15, OZ), (OX0, 15, 0)]), 'wood', .45)
        c.poly(p.quad([(OX0, 5, 0), (OX0, 5, OZ), (OX0, 13, OZ), (OX0, 13, 0)]), 'c_frost', .5)
        # front partition
        fa = P(p, OX0, 0, OZ)
        fb = P(p, 364, 0, OZ)
        top = P(p, OX0, 56, OZ)[1]
        gl = P(p, OX0, 5, OZ)[1]
        mid = P(p, OX0, 14, OZ)[1]
        c.rect(fa[0], mid, fb[0], gl, 'c_frost', vgrad(mid, gl, .58, .5), emis=.2)     # frosted band
        c.rect(fa[0], gl, fb[0], fa[1], 'wood', .42)
        c.hline(fa[0], fb[0], gl, 'wood', .7)
        c.rect(fa[0], top, fb[0], top + 4, 'wood', .5)
        c.hline(fa[0], fb[0], top, 'wood', .78)
        c.rect(fa[0], mid - 1, fb[0], mid + 1, 'wood', .46)
        c.hline(fa[0], fb[0], mid - 1, 'wood', .66)
        dxa = bx(300, OZ)
        dxb = bx(318, OZ)
        posts = [fa[0], dxa - 2, dxb, bx(342, OZ), fb[0] - 2]
        for X in posts:
            c.rect(X, top, X + 2, fa[1], 'wood', .44)
            c.vline(X, top, fa[1], 'wood', .66)
        for i in range(len(posts) - 1):
            a_, b_ = posts[i] + 2, posts[i + 1]
            if a_ >= dxa - 1 and b_ <= dxb + 1:
                continue
            C.pane_glint(c, a_, top + 4, b_, mid - 1)
        # the door (frosted upper pane with gold lettering)
        c.rect(dxa, top + 6, dxb, fa[1], 'wood', C.grain_v(.45, .02, 1.3))
        c.vline(dxa, top + 6, fa[1], 'wood', .66)
        c.rect(dxa + 2, top + 8, dxb - 2, mid - 6, 'c_frost', vgrad(top + 8, mid, .62, .5), emis=.3)
        C.pane_glint(c, dxa + 2, top + 8, dxb - 2, mid - 6)
        c.hline(dxa + 3, dxb - 3, top + 13, 'gold', .75)
        c.hline(dxa + 3, dxb - 3, top + 15, 'gold', .55)
        c.rect(dxa + 2, mid - 3, dxb - 2, fa[1] - 4, 'wood', .38)
        c.hline(dxa + 2, dxb - 2, mid - 3, 'wood', .25)
        c.rect(dxb - 4, mid - 8, dxb - 2, mid - 4, 'brass', .75)
        c.put(dxb - 3, mid - 7, 'brass', 1.0)
        # gold leaf lettering on the big pane
        lx0 = dxb + 5
        C.text(c, lx0 + 4, top + 7, 'LT.', 'black', .1)
        C.text(c, lx0 + 3, top + 6, 'LT.', 'gold', .8)
        C.text(c, lx0 + 1, top + 13, 'F. DELANEY', 'black', .1)
        C.text(c, lx0, top + 12, 'F. DELANEY', 'gold', .85)
        C.text(c, lx0 + 5, top + 20, 'HOMICIDE', 'black', .1)
        C.text(c, lx0 + 4, top + 19, 'HOMICIDE', 'gold', .7)
    _V['door'] = (dxa, top, dxb, fa[1])

    # ---- the front desk (raised counter) ---------------------------------------------------------
    FX0, FX1, FZ0, FZ1 = 124, 196, 18, 32
    HD = 26
    with sc.obj('front_desk', baseline=by(FZ1) + 1):
        p.box(c, FX0, FX1, 0, HD, FZ0, FZ1, 'oak', front=.42, top=.56, side=.3,
              lum_fn=C.grain_h(.42, .025, 1.5, 2), top_fn=C.grain_h(.56, .02, .7, 3))
        f0 = P(p, FX0, HD, FZ1)
        f1 = P(p, FX1, 0, FZ1)
        # raised panels on the front
        pw = (f1[0] - f0[0] - 4) / 4
        for i in range(4):
            a_ = int(f0[0] + 2 + i * pw) + 1
            b_ = int(f0[0] + 2 + (i + 1) * pw) - 1
            c.rect(a_, f0[1] + 5, b_, f1[1] - 4, 'oak', .38)
            c.hline(a_, b_, f0[1] + 5, 'oak', .25)
            c.vline(a_, f0[1] + 5, f1[1] - 4, 'oak', .3)
            c.hline(a_, b_, f1[1] - 5, 'oak', .58)
            c.vline(b_ - 1, f0[1] + 5, f1[1] - 4, 'oak', .52)
        c.rect(f0[0], f1[1] - 3, f1[0], f1[1], 'oak', .3)
        c.hline(f0[0], f1[0], f0[1], 'oak', .8)
        c.rect(f0[0], f0[1] + 1, f1[0], f0[1] + 3, 'oak', .5)
        # brass rail along the front edge
        rail = P(p, FX0, HD + 4, FZ1 + 1)
        rail2 = P(p, FX1, HD + 4, FZ1 + 1)
        c.hline(rail[0], rail2[0], rail[1], 'brass', .75)
        for X in range(FX0 + 2, FX1, 14):
            a_ = P(p, X, HD, FZ1 + 1)
            c.vline(a_[0], rail[1], a_[1], 'brass', .55)
        # nameplate sign on the front
        nx = (f0[0] + f1[0]) // 2 - 25
        c.rect(nx, f0[1] + 9, nx + 51, f0[1] + 16, 'black', .35)
        c.hline(nx, nx + 51, f0[1] + 9, 'black', .6)
        C.text(c, nx + 2, f0[1] + 10, 'DUTY OFFICER', 'brass', .82)
        # desk top: banker's lamp, the reverse directory, bell, phone, blotter, trays
        dlx, dly = P(p, 134, HD, 24)
        c.rect(dlx - 1, dly - 6, dlx + 1, dly, 'brass', .6)
        c.rect(dlx - 3, dly - 1, dlx + 3, dly + 1, 'brass', .45)
        with lay.base():
            c.poly([(dlx - 5, dly - 6), (dlx + 5, dly - 6), (dlx + 4, dly - 9), (dlx - 4, dly - 9)], 'c_jade', .5)
            c.hline(dlx - 5, dlx + 6, dly - 6, 'c_jade', .3)
        alt.poly([(dlx - 5, dly - 6), (dlx + 5, dly - 6), (dlx + 4, dly - 9), (dlx - 4, dly - 9)], 'c_jade', .78, emis=.45)
        alt.hline(dlx - 5, dlx + 6, dly - 6, 'lamp', .92, emis=1)
        # the reverse directory: fat red-bound book lying open on the right
        rx, ry = P(p, 178, HD, 27)
        c.poly([(rx - 9, ry), (rx + 9, ry), (rx + 8, ry - 4), (rx - 8, ry - 4)], 'paper', .82)
        c.vline(rx, ry - 4, ry, 'paper', .45)
        for ly in range(ry - 3, ry, 1):
            c.hline(rx - 7, rx - 1, ly, 'paper', .58 + (ly % 2) * .1)
            c.hline(rx + 1, rx + 7, ly, 'paper', .58 + (ly % 2) * .1)
        c.hline(rx - 9, rx + 9, ry, 'red', .45)
        c.rect(rx - 9, ry + 1, rx + 9, ry + 2, 'red', .35)
        _V['directory'] = (rx - 10, ry - 6, rx + 10, ry + 3)
        bx_, by_ = P(p, 160, HD, 29)
        c.ellipse(bx_, by_ - 1, 2.4, 1.6, 'brass', .7)                    # call bell
        c.put(bx_ - 1, by_ - 2, 'brass', 1.0)
        c.put(bx_, by_ - 3, 'brass', .8)
        F.telephone(c, *P(p, 150, HD, 22))
        b0 = P(p, 140, HD, 22)
        b1 = P(p, 160, HD, 28)
        c.rect(b0[0], b0[1], b1[0], b1[1], 'felt', .45)                 # blotter + forms
        c.rect(b0[0] + 2, b0[1], b0[0] + 8, b1[1] - 1, 'paper', .78)
        C.coffee_cup(c, *P(p, 190, HD, 22))
        lb = P(p, 166, HD, 24)
        c.rect(lb[0] - 5, lb[1] - 3, lb[0] + 6, lb[1], 'c_navy', .42)        # the duty logbook
        c.hline(lb[0] - 5, lb[0] + 6, lb[1] - 3, 'c_navy', .62)
        c.rect(lb[0] - 4, lb[1] - 3, lb[0] + 5, lb[1] - 2, 'paper', .78)

    # ---- hanging globe lamps ----------------------------------------------------------------------
    GL = [(124, 82, 60), (250, 82, 60)]
    gl_px = []
    for (X, Y, Z) in GL:
        x_, y_ = P(p, X, Y, Z)
        gl_px.append((x_, y_))
        with lay.base():
            globe_lamp(c, x_, y_, on=True)
        globe_lamp(alt, x_, y_, on=False)

    # ---- lighting ----------------------------------------------------------------------------------
    lay.finalize()
    c.shadow_poly(p.quad([(FX0 - 1, 0, FZ0 - 1), (FX1 + 1, 0, FZ0 - 1), (FX1 + 3, 0, FZ1 + 5), (FX0 - 1, 0, FZ1 + 5)]), .42)
    c.shadow_poly(p.quad([(70, 0, 0), (120, 0, 0), (121, 0, 13), (70, 0, 13)]), .35)
    c.shadow_poly(p.quad([(DX0 - 1, 0, DZ0 - 1), (DX1 + 1, 0, DZ0 - 1), (DX1 + 2, 0, DZ1 + 3), (DX0 - 1, 0, DZ1 + 3)]), .35)
    base_shade = c.shade.copy()
    xx = np.arange(W)[None, :].astype(np.float32)
    yy = np.arange(H)[:, None].astype(np.float32)
    topdark = np.clip(.78 + yy / 160.0, .78, 1)
    day_lights = [Light(x_, y_ + 2, 150, .52, falloff=1.3) for (x_, y_) in gl_px]
    day_lights += [Light(x_, y_ + 100, 52, .3, ystretch=2.6) for (x_, y_) in gl_px]
    day_lights += [Light(279, 40, 90, .3), Light(347, 42, 70, .25), Light(52, 62, 50, .2)]
    vday = np.clip(1.2 - np.abs(xx - 205) / 300.0, .7, 1)
    c.lights = day_lights
    c.ambient = .42
    c.shade = (base_shade * vday * topdark).astype(np.float32)
    c.glows = [(x_, y_, 18, (255, 240, 210), .4) for (x_, y_) in gl_px]
    _V['day'] = dict(lights=day_lights, ambient=.42, shade=c.shade.copy(), glows=list(c.glows))
    n_lights = [Light(dlx, dly - 6, 70, 1.1, falloff=1.5),
                Light(dlx, dly + 30, 50, .35, ystretch=2.3),
                Light(elx, ely - 6, 60, 1.0, falloff=1.5),
                Light(elx + 10, ely + 26, 40, .3, ystretch=2.3),
                Light((E0 + E1) // 2, dtop + 11, 26, .5),
                Light(52, dtop + 12, 40, .35),
                Light(347, 32, 30, .25)]
    vn = np.clip(1.3 - np.abs(xx - 210) / 230.0, .5, 1)
    _V['night'] = dict(lights=n_lights, ambient=.24, shade=(base_shade * vn * topdark ** 2).astype(np.float32),
                       glows=[(dlx, dly - 7, 18, (255, 200, 120), .5), (elx, ely - 7, 16, (255, 200, 120), .45),
                              ((E0 + E1) // 2, dtop + 11, 10, (255, 190, 110), .35),
                              (52, dtop + 10, 12, (90, 255, 140), .4), (350, 33, 10, (80, 140, 255), .35)])
    _V['lay'] = lay

    # ---- state: camel coat on the rack ---------------------------------------------------------------
    with sc.obj('coat_on_rack', state=True, depth=by(6)) as cc:
        x, y = rkx, rky
        cc.poly([(x - 2, y - 38), (x + 3, y - 38), (x + 8, y - 30), (x + 8, y - 8), (x + 5, y - 6), (x - 3, y - 6),
                 (x - 6, y - 9), (x - 5, y - 30)], 'trench', hgrad(x - 6, x + 8, .7, .45))
        cc.line(x, y - 36, x - 1, y - 8, 'trench', .38)                     # front opening
        cc.line(x - 4, y - 31, x - 2, y - 24, 'trench', .82)                # lapel
        cc.line(x + 4, y - 32, x + 6, y - 26, 'trench', .32)
        cc.hline(x - 5, x + 7, y - 20, 'trench', .5)                        # belt
        cc.put(x + 6, y - 20, 'brass', .8)
        cc.poly([(x - 1, y - 40), (x + 2, y - 40), (x + 3, y - 37), (x - 2, y - 37)], 'trench', .6)  # collar

    # ---- anim: ceiling fan? no - flickering corridor light behind the cells door -----------------------
    # the radiator under the window hisses: little puffs of steam from its valve (variant-neutral)
    vx_, vy_ = W1 + 2, FLOOR - 7

    def hiss(k):
        def f(cc):
            if k < 5:
                for i in range(k + 1):
                    px = vx_ + 1 + i
                    py = vy_ - 1 - i - (i * k) % 2
                    cc.put(px, py, 'c_steam', .82 - i * .1)
                    if i > 1:
                        cc.put(px, py - 1, 'c_steam', .7 - i * .1)
        return f
    sc.anim('radiator', [hiss(k) for k in range(10)], fps=6)

    # ---- interaction ---------------------------------------------------------------------------------
    sc.hotspot('exit_street', rect=(D0 - 3, dtop - 12, D1 + 3, FLOOR + 1), walk=(51, by(10)), face='up')
    f0 = P(p, FX0, HD + 4, FZ1)
    f1 = P(p, FX1, 0, FZ1)
    sc.hotspot('front_desk', rect=(f0[0], f0[1], f1[0], f1[1]), walk=(bx(150, FZ1 + 12), by(FZ1 + 12)), face='up')
    d = _V['directory']
    sc.hotspot('directory', rect=d, walk=(bx(178, FZ1 + 12), by(FZ1 + 12)), face='up')
    b0 = P(p, 70, 30, 1)
    b1 = P(p, 120, 0, 11)
    sc.hotspot('bench', rect=(b0[0], b0[1], b1[0], b1[1]), walk=(bx(95, 22), by(22)), face='up')
    sc.hotspot('posters', rect=(72, 21, 120, 69), walk=(bx(95, 22), by(22)), face='up')
    sc.hotspot('exit_cells', rect=(E0 - 3, dtop - 12, E1 + 3, FLOOR + 1), walk=(bx((E0 + E1) // 2, 9), by(9)), face='up')
    sc.hotspot('evidence_door', rect=(V0 - 5, dtop - 12, V1 + 6, FLOOR + 1), walk=(bx((V0 + V1) // 2, 9), by(9)), face='up')
    dd = _V['door']
    sc.hotspot('delaney_door', rect=(dd[0], dd[1], dd[2] + 1, dd[3] + 1), walk=(bx(309, OZ + 6), by(OZ + 6)), face='up')
    dk0 = P(p, DX0, 24, DZ0)
    dk1 = P(p, DX1, 0, DZ1)
    sc.hotspot('delaney_desk', rect=(dk0[0], dk0[1] - 4, dk1[0], dk1[1]), walk=(bx(322, 26), by(26)), face='up')
    dr = _V['drawer']
    sc.hotspot('desk_drawer', rect=dr, walk=(bx(340, 26), by(26)), face='up')
    sc.hotspot('coat_rack', rect=(rkx - 8, rky - 46, rkx + 9, rky + 1), walk=(bx(354, 27), by(27)), face='up')
    ph = _V['photo']
    sc.hotspot('delaney_photo', rect=ph, walk=(bx(322, 26), by(26)), face='up')
    sc.hotspot('delaney_cabinet', rect=(fc[0] - 1, fc[1] - 3, fc[2] + 1, fc[3]), walk=(bx(300, 26), by(26)), face='up')

    # walkable: main floor + back aisle + office strip, joined through the office door
    def wall_hit(X):
        edge = 0 if X < 200 else W
        s_ = (edge - 200) / (X - 200)
        return p.D * (1 - 1 / s_)
    zl, zr = wall_hit(38), wall_hit(362)
    outline = [P(p, 38, 0, 3), P(p, 287, 0, 3), P(p, 287, 0, OZ + 3), P(p, 301, 0, OZ + 3), P(p, 301, 0, OZ - 2),
               P(p, 293, 0, OZ - 2), P(p, 293, 0, 21), P(p, 362, 0, 21), P(p, 362, 0, OZ - 2), P(p, 317, 0, OZ - 2),
               P(p, 317, 0, OZ + 3), P(p, 362, 0, OZ + 3), P(p, 362, 0, zr), (W, H), (0, H), P(p, 38, 0, zl)]
    holes = [[P(p, FX0 - 3, 0, 3), P(p, FX1 + 3, 0, 3), P(p, FX1 + 3, 0, FZ1 + 4), P(p, FX0 - 3, 0, FZ1 + 4)],
             [P(p, 68, 0, 3), P(p, 122, 0, 3), P(p, 122, 0, 14), P(p, 68, 0, 14)],
             [P(p, 59, 0, 3), P(p, 68, 0, 3), P(p, 68, 0, 11), P(p, 59, 0, 11)]]
    sc.walkable(outline, holes=holes)
    sc.point('start', 52, by(30), 'right')
    sc.point('from_map', 52, by(30), 'right')
    sc.point('from_cells', bx((E0 + E1) // 2, 14), by(14), 'down')
    sc.point('pruitt_spot', bx(160, 8), by(8), 'down')
    sc.point('delaney_spot', bx(328, 3), by(3), 'down')
    sc.point('drawer_spot', bx(340, 26), by(26), 'up')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, round(p.char_scale(FLOOR, 140), 3), 140, 1.0)
    sc.meta['floor'] = 'tile'
    sc.rain(W0 + 2, 18, W1 - 2, 60, kind='window')
    sc.rain(BW0, 26, BW1, 58, kind='window')
    C.order_hotspots(sc, ['directory', 'desk_drawer', 'delaney_photo', 'coat_rack', 'delaney_cabinet', 'delaney_desk',
                          'delaney_door', 'posters', 'front_desk'])
    C.check(sc, npc=('pruitt_spot', 'delaney_spot'))
    return sc


def _apply(c, key):
    v = _V[key]
    c.lights = [Light(L.x, L.y, L.r, L.i, falloff=L.falloff, cone=L.cone, ystretch=L.ystretch) for L in v['lights']]
    c.ambient = v['ambient']
    c.shade = v['shade'].copy()
    c.glows = list(v['glows'])


def night(c):
    _apply(c, 'night')
    _V['lay'].apply(c, 'night')
    return None


VARIANTS = {'day': lambda c: None, 'night': night}


def main():
    sc = build()
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
