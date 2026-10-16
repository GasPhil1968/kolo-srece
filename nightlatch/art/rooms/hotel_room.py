"""Chapter 1 - Room 9, Hotel Sorrento. Pre-dawn, rain, red neon through the window."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from core import vgrad, hgrad, radial, noise2
from scene import Scene
from persp import Persp, plank_floor, wall_left, wall_right, side_wall_fn
import furniture as F

W, H = 320, 144
FLOOR = 94


def build():
    sc = Scene('hotel_room', W, H, seed=11)
    c = sc.c
    p = Persp(40, 280, 0, FLOOR, horizon=-60, depth=400)
    zfront = p.z_at_floor_y(H + 2)

    # --- shell -------------------------------------------------------------------
    F.wallpaper(c, 40, 0, 280, FLOOR, 'teal', base=.46, stripe=8, seed=3)
    # picture rail + crown shadow
    c.rect(40, 26, 280, 28, 'wood', .4)
    c.hline(40, 280, 26, 'wood', .6)
    c.rect(40, 0, 280, 4, 'teal', .2)
    wall_left(c, p, 'teal', side_wall_fn(p, .34, 40, stripe=10, stripe_lum=.04), 200, zfront)
    wall_right(c, p, 'teal', side_wall_fn(p, .3, 280, stripe=10, stripe_lum=.04), 200, zfront)
    plank_floor(c, p, 40, 280, 0, zfront, 'wood', base=.42, plank_w=12, seed=5)
    # baseboards
    c.rect(40, FLOOR - 4, 280, FLOOR, 'wood', .3)
    c.hline(40, 280, FLOOR - 4, 'wood', .5)
    for X, side in ((40, 'l'), (280, 'r')):
        pts = p.quad([(X, 0, 0), (X, 0, zfront), (X, 4, zfront), (X, 4, 0)])
        c.poly(pts, 'wood', .26)
    # worn rug
    rug = p.quad([(96, 0, 34), (206, 0, 34), (206, 0, 78), (96, 0, 78)])
    N = noise2(W, H, 3, 8, 2)

    def rugfn(xx, yy):
        s = np.maximum((yy - p.hy) / p.E, 1e-3)
        X = p.cx + (xx - p.cx) / s
        Z = p.D * (1 - 1 / s)
        border = (np.abs(X - 96) < 4) | (np.abs(X - 206) < 4) | (np.abs(Z - 34) < 3) | (np.abs(Z - 78) < 3)
        pattern = ((np.floor(X / 6) + np.floor(Z / 5)) % 2 == 0)
        L = np.where(border, .55, np.where(pattern, .42, .36))
        xi = np.clip(xx.astype(int), 0, W - 1)
        yi = np.clip(yy.astype(int), 0, H - 1)
        return L - (N[yi, xi] - .5) * .25
    c.poly(rug, 'red', rugfn)

    # --- door (back wall, left) ----------------------------------------------------
    door = (52, 48, 76, FLOOR)
    with sc.obj('door'):
        kx, ky = F.panel_door(c, *door, ramp='wood', lum=.42, transom=True)
        # "9" on the door
        c.rect(62, 52, 66, 53, 'brass', .8)
        c.vline(65, 52, 58, 'brass', .8)
        c.vline(62, 52, 55, 'brass', .8)
        c.hline(62, 66, 55, 'brass', .8)

    # --- washbasin + mirror ----------------------------------------------------------
    F.mirror(c, 88, 42, 104, 60)
    F.washbasin(c, 87, 72, w=18)
    c.rect(86, 66, 107, 68, 'cream', .55)   # glass shelf
    c.put(90, 65, 'glass', .7, emis=.3)
    c.put(91, 64, 'glass', .6, emis=.3)
    c.rect(100, 63, 102, 66, 'chrome', .5)

    # --- wardrobe --------------------------------------------------------------------
    wr = F.wardrobe(c, p, 116, 148, 0, 12, 54, ramp='wood', lum=.48)
    with sc.obj('wardrobe_open', state=True) as cc:
        F.wardrobe_open_overlay(cc, wr, ramp='wood', lum=.48)
    with sc.obj('hanger', state=True, depth=200) as cc:
        hid = cc.cur_owner
        cc.cur_owner = 0          # interior drawn for correct context, not part of the sprite
        F.wardrobe_open_overlay(cc, wr, ramp='wood', lum=.48)
        cc.cur_owner = hid
        F.coat_hanger(cc, (wr[0] + wr[2]) // 2 + 4, wr[1] + 8)

    # --- window + radiator ---------------------------------------------------------------
    F.sash_window(c, 162, 32, 204, 72, frame='cream', frame_lum=.5, panes=(2, 3), curtains='mauve')
    F.radiator(c, 168, 78, 198, 91, ramp='cream', lum=.45)

    # --- painting over the bed -----------------------------------------------------------
    F.storm_painting(c, 230, 34, 258, 52)

    # --- nightstand, lamp, phone --------------------------------------------------------
    with sc.obj('nightstand', baseline=int(p.P(0, 0, 16)[1])):
        top = F.nightstand(c, p, 208, 222, 2, 16, 15, ramp='wood', lum=.42)
    lx, ly = p.P(212, 15, 8)
    F.table_lamp(c, int(lx), int(ly), on=True)
    tx, ty = p.P(219, 15, 11)
    F.telephone(c, int(tx), int(ty))
    c.line(int(tx) + 4, int(ty) - 1, int(tx) + 7, int(ty) + 5, 'black', .5)   # the cut cord
    c.line(int(tx) + 7, int(ty) + 5, int(tx) + 6, int(ty) + 9, 'black', .5)

    # --- bed --------------------------------------------------------------------------
    bed_front = int(p.P(0, 0, 50)[1])
    with sc.obj('bed', baseline=bed_front):
        F.iron_bed(c, p, 226, 266, 0, 50, frame='cream', sheet='paper', blanket='red')

    # hat hanging on the left foot post
    hx, hy = p.P(227, 27, 50)
    hx, hy = int(hx), int(hy)
    with sc.obj('hat', state=True, depth=bed_front + 1) as cc:
        cc.ellipse(hx + 1, hy + 1, 7, 2, 'slate', .32)
        cc.poly([(hx - 3, hy + 1), (hx - 2, hy - 5), (hx + 4, hy - 6), (hx + 5, hy + 1)], 'slate', .42)
        cc.hline(hx - 3, hx + 6, hy - 1, 'black', .5)
        cc.hline(hx - 1, hx + 4, hy - 5, 'slate', .6)

    # --- chair (foreground left) ---------------------------------------------------------
    cz = 66
    with sc.obj('chair', baseline=int(p.P(0, 0, cz + 14)[1])):
        F.chair(c, p, 64, 82, cz, cz + 14, ramp='oak', lum=.48, seat_h=18, back_h=40, fabric='mauve')

    # empty bottle + butts by the bed
    bx, by = p.P(214, 0, 30)
    c.rect(int(bx), int(by) - 7, int(bx) + 3, int(by), 'felt', .5)
    c.rect(int(bx) + 1, int(by) - 10, int(bx) + 2, int(by) - 7, 'felt', .6)
    c.put(int(bx), int(by) - 6, 'felt', .85)

    # newspaper slid under the door (state)
    with sc.obj('newspaper_door', state=True, depth=10) as cc:
        pts = p.quad([(54, .2, 0), (72, .2, 0), (74, .2, 8), (52, .2, 8)])
        cc.poly(pts, 'paper', .7)
        cc.hline(56, 70, int(p.P(0, 0, 3)[1]), 'paper', .45)
        cc.hline(56, 68, int(p.P(0, 0, 5)[1]), 'paper', .45)

    # --- lighting -------------------------------------------------------------------------
    c.ambient = .46
    c.add_light(int(lx), int(ly) - 10, 120, .75, falloff=1.4)      # bedside lamp
    c.add_light(183, 52, 70, .32, falloff=1.2)                     # window / neon
    c.add_light(64, 95, 30, .3, ystretch=2.5)                      # light under door
    c.add_light(64, 30, 60, .18)                                   # corridor light via transom
    c.glow(int(lx), int(ly) - 11, 26, '#ffb860', .55)
    c.glow(200, 50, 46, '#ff3040', .35)
    # shadow under bed and furniture
    c.shadow_poly(p.quad([(226, 0, 2), (266, 0, 2), (266, 0, 50), (226, 0, 50)]), .45)
    c.shadow_ellipse(73, int(p.P(0, 0, cz + 7)[1]), 14, 4, .4)
    # vignette at the edges
    c.shade *= np.clip(1.15 - np.abs(np.arange(W)[None, :] - 170) / 260.0, .7, 1)

    # --- interaction geometry --------------------------------------------------------------
    sc.hotspot('door', rect=(50, 46, 78, FLOOR - 2), walk=(64, 100), face='up')
    sc.hotspot('keyhole', rect=(kx - 3, ky + 1, kx + 4, ky + 7), walk=(70, 100), face='up')
    sc.hotspot('gap', rect=(50, FLOOR - 3, 78, FLOOR + 3), walk=(64, 100), face='up')
    sc.hotspot('mirror', rect=(86, 40, 106, 61), walk=(96, 100), face='up')
    sc.hotspot('basin', rect=(84, 62, 108, 92), walk=(96, 100), face='up')
    sc.hotspot('wardrobe', rect=(wr[0] - 2, wr[1] - 6, wr[2] + 2, wr[3] + 2), walk=(132, 104), face='up')
    sc.hotspot('hanger', rect=(wr[0] + 8, wr[1] + 6, wr[2] - 4, wr[1] + 16), walk=(132, 104), face='up')
    sc.hotspot('window', rect=(160, 30, 206, 74), walk=(184, 100), face='up')
    sc.hotspot('radiator', rect=(166, 76, 200, 93), walk=(184, 100), face='up')
    sc.hotspot('painting', rect=(229, 33, 259, 53), walk=(214, 112), face='up')
    sc.hotspot('lamp', rect=(int(lx) - 7, int(ly) - 16, int(lx) + 7, int(ly)), walk=(214, 112), face='up')
    sc.hotspot('phone', rect=(int(tx) - 6, int(ty) - 9, int(tx) + 7, int(ty) + 1), walk=(214, 112), face='up')
    sc.hotspot('nightstand', rect=(int(p.P(208, 0, 16)[0]), int(ly), int(p.P(222, 0, 16)[0]), int(p.P(0, 0, 16)[1])),
               walk=(214, 112), face='up')
    bx0, by0 = p.P(226, 36, 0)
    bx1, by1 = p.P(266, 0, 50)
    sc.hotspot('bed', rect=(int(bx0), int(by0), int(bx1), int(by1)), walk=(214, 124), face='right')
    sc.hotspot('hat', rect=(hx - 5, hy - 8, hx + 7, hy + 4), walk=(214, 130), face='right')
    chx0, chy0 = p.P(64, 38, cz)
    chx1, chy1 = p.P(82, 0, cz + 14)
    sc.hotspot('chair', rect=(int(chx0) - 2, int(chy0), int(chx1) + 2, int(chy1)), walk=(96, 128), face='left')
    sc.hotspot('newspaper_door', rect=(50, FLOOR - 1, 78, FLOOR + 6), walk=(64, 104), face='up')

    # walkable floor (screen space) minus the bed and nightstand footprint
    fl = p.quad([(42, 0, 2), (278, 0, 2), (278, 0, zfront), (42, 0, zfront)])
    bed_fp = p.quad([(206, 0, 0), (270, 0, 0), (270, 0, 56), (206, 0, 56)])
    chair_fp = p.quad([(60, 0, cz - 2), (86, 0, cz - 2), (86, 0, cz + 16), (60, 0, cz + 16)])
    sc.walkable([(int(x), int(y)) for x, y in fl], holes=[[(int(x), int(y)) for x, y in bed_fp],
                                                         [(int(x), int(y)) for x, y in chair_fp]])
    sc.point('start', 150, 118, 'down')
    sc.point('wake', 140, 112, 'down')
    sc.point('door_in', 64, 100, 'down')
    sc.meta['persp'] = {'hy': p.hy, 'E': p.E}
    sc.scale(FLOOR, p.char_scale(FLOOR, 140), 140, 1.0)
    sc.meta['floor'] = 'wood'
    return sc


VARIANTS = {}


def main():
    sc = build()
    sc.rain(165, 35, 201, 69, kind='window')
    sc.export(variants=VARIANTS)
    return sc


if __name__ == '__main__':
    main()
