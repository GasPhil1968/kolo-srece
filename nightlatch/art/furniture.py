"""Reusable props, drawn in screen space or through a Persp projection."""
from __future__ import annotations

import math
import numpy as np

from core import Canvas, noise2, vgrad, hgrad, radial
from persp import Persp


# ---------------------------------------------------------------- wall decorations ----
def wallpaper(c: Canvas, x0, y0, x1, y1, ramp, base=.45, stripe=8, motif=True, seed=5, stain=.12):
    N = noise2(c.w, c.h, 14, seed, 3)

    def fn(xx, yy):
        L = np.full(xx.shape, base, np.float32)
        sx = (xx - x0) % stripe
        L = L + np.where(sx < 1, -.08, 0) + np.where((sx >= stripe / 2) & (sx < stripe / 2 + 1), .05, 0)
        if motif:
            mx = (xx - x0 + stripe / 4) % stripe
            my = (yy - y0) % 10
            dia = (np.abs(mx - stripe / 4) + np.abs(my - 5) * .8) < 1.6
            L = L + np.where(dia, .09, 0)
        xi = np.clip(xx.astype(int), 0, c.w - 1)
        yi = np.clip(yy.astype(int), 0, c.h - 1)
        L = L - (N[yi, xi] - .5) * 2 * stain
        # water damage darker near the ceiling
        L = L - np.clip((y0 + 14 - yy) / 14, 0, 1) * .1
        return L
    c.rect(x0, y0, x1, y1, ramp, fn)


def picture_frame(c: Canvas, x0, y0, x1, y1, frame='gold', inner=None):
    c.rect(x0, y0, x1, y1, frame, .55)
    c.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, frame, .35)
    c.hline(x0, x1, y0, frame, .85)
    c.vline(x0, y0, y1, frame, .75)
    if inner:
        inner(x0 + 2, y0 + 2, x1 - 2, y1 - 2)


def storm_painting(c: Canvas, x0, y0, x1, y1):
    """A ship pitching in a storm - the artist had seen neither."""
    def inner(a, b, cx1, cy1):
        c.rect(a, b, cx1, cy1, 'night', vgrad(b, cy1, .35, .55))
        mid = (b + cy1) // 2 + 2
        for x in range(a, cx1):
            wave = int(math.sin(x * .7) * 1.5 + math.sin(x * .23) * 1.2)
            c.rect(x, mid + wave, x + 1, cy1, 'water', .45 + .1 * math.sin(x * .9))
            c.put(x, mid + wave, 'fog', .9)
        sx = (a + cx1) // 2
        c.poly([(sx - 5, mid - 1), (sx + 5, mid - 3), (sx + 4, mid + 1), (sx - 4, mid + 2)], 'wood', .3)
        c.vline(sx, mid - 9, mid - 1, 'wood', .2)
        c.poly([(sx + 1, mid - 9), (sx + 5, mid - 4), (sx + 1, mid - 3)], 'cream', .8)
    picture_frame(c, x0, y0, x1, y1, inner=inner)


# ---------------------------------------------------------------------- windows ----
def window_view_night(c: Canvas, x0, y0, x1, y1, seed=2, neon=True, sky='night'):
    """Night alley seen through a window: facing brick wall, lit windows, neon glow."""
    rng = np.random.default_rng(seed)
    c.rect(x0, y0, x1, y1, sky, vgrad(y0, y1, .15, .32), emis=.6)
    wall_top = y0 + (y1 - y0) // 5
    c.rect(x0, wall_top, x1, y1, 'brick', vgrad(wall_top, y1, .25, .4), emis=.3)
    for wy in range(wall_top + 3, y1 - 4, 9):
        for wx in range(x0 + 2 + (wy % 3), x1 - 4, 11):
            lit = rng.random() < .35
            if lit:
                c.rect(wx, wy, wx + 4, wy + 5, 'lamp', .55 + rng.random() * .2, emis=1)
                c.hline(wx, wx + 4, wy + 2, 'lamp', .35, emis=1)
            else:
                c.rect(wx, wy, wx + 4, wy + 5, 'glass', .2, emis=.4)
    if neon:
        nx = x1 - 6
        c.rect(nx - 1, y0, nx + 5, y1, 'black', .3)
        for i, ch in enumerate(range(y0 + 2, y1 - 4, 6)):
            c.rect(nx, ch, nx + 4, ch + 4, 'neonred', .75, emis=1)
            c.rect(nx + 1, ch + 1, nx + 3, ch + 3, 'neonred', .95, emis=1)


def rain_on_glass(c: Canvas, x0, y0, x1, y1, seed=9, density=.05):
    rng = np.random.default_rng(seed)
    n = int((x1 - x0) * (y1 - y0) * density)
    for _ in range(n):
        x = rng.integers(x0, x1)
        y = rng.integers(y0, y1)
        L = int(rng.integers(1, 4))
        for k in range(L):
            if y + k < y1:
                c.put(x, y + k, 'glass', .75 + .1 * (k == 0), emis=.5)


def sash_window(c: Canvas, x0, y0, x1, y1, frame='cream', frame_lum=.55, view=None, panes=(2, 3), sill=True,
                curtains='red'):
    view = view or (lambda a, b, cc, d: window_view_night(c, a, b, cc, d))
    view(x0 + 3, y0 + 3, x1 - 3, y1 - 3)
    rain_on_glass(c, x0 + 3, y0 + 3, x1 - 3, y1 - 3)
    # frame
    c.rect(x0, y0, x1, y0 + 3, frame, frame_lum + .1)
    c.rect(x0, y1 - 3, x1, y1, frame, frame_lum - .05)
    c.rect(x0, y0, x0 + 3, y1, frame, frame_lum)
    c.rect(x1 - 3, y0, x1, y1, frame, frame_lum - .1)
    cols, rows = panes
    for i in range(1, cols):
        x = x0 + 3 + (x1 - x0 - 6) * i // cols
        c.rect(x - 1, y0 + 3, x + 1, y1 - 3, frame, frame_lum - .05)
    for j in range(1, rows):
        y = y0 + 3 + (y1 - y0 - 6) * j // rows
        c.rect(x0 + 3, y - 1, x1 - 3, y + 1, frame, frame_lum + (.12 if j == rows // 2 + rows % 2 - 1 else 0))
    if sill:
        c.rect(x0 - 3, y1, x1 + 3, y1 + 3, frame, frame_lum + .15)
        c.hline(x0 - 3, x1 + 3, y1 + 3, frame, frame_lum - .3)
    if curtains:
        curtain(c, x0 - 9, y0 - 6, x0 + 6, y1 + 10, curtains, side='l')
        curtain(c, x1 - 6, y0 - 6, x1 + 9, y1 + 10, curtains, side='r')
        c.rect(x0 - 12, y0 - 8, x1 + 12, y0 - 6, 'brass', .6)
        c.hline(x0 - 12, x1 + 12, y0 - 8, 'brass', .85)


def curtain(c: Canvas, x0, y0, x1, y1, ramp, side='l', folds=3.0):
    def fn(xx, yy):
        t = (xx - x0) / max(1, x1 - x0)
        f = np.sin(t * math.pi * 2 * folds + (yy - y0) * .02) * .14
        tie = np.clip(1 - np.abs(yy - (y0 + (y1 - y0) * .62)) / 3, 0, 1) * .1
        edge = (t if side == 'l' else 1 - t)
        return .42 + f + tie - edge * .08
    # tied-back silhouette: narrower at the tie point
    tyy = y0 + int((y1 - y0) * .62)
    if side == 'l':
        pts = [(x0, y0), (x1, y0), (x1 - 4, tyy - 6), (x0 + 6, tyy), (x1 - 2, y1), (x0, y1)]
    else:
        pts = [(x0, y0), (x1, y0), (x1, y1), (x0 + 2, y1), (x1 - 6, tyy), (x0 + 4, tyy - 6)]
    c.poly(pts, ramp, fn)


# ------------------------------------------------------------------------- doors ----
def panel_door(c: Canvas, x0, y0, x1, y1, ramp='wood', lum=.45, frame='wood', frame_lum=.3, knob_side='r',
               keyhole=True, transom=None, gap_light=True):
    # frame / architrave
    c.rect(x0 - 3, y0 - 3, x1 + 3, y1, frame, frame_lum)
    c.hline(x0 - 3, x1 + 3, y0 - 3, frame, frame_lum + .3)
    c.vline(x0 - 3, y0 - 3, y1, frame, frame_lum + .2)
    c.rect(x0, y0, x1, y1, ramp, hgrad(x0, x1, lum + .06, lum - .06))
    w = x1 - x0
    h = y1 - y0
    m = 3
    pw = (w - 3 * m) // 2
    for row, (py0, py1) in enumerate([(y0 + m, y0 + int(h * .42)), (y0 + int(h * .42) + m, y1 - m - 1)]):
        for col in range(2):
            px0 = x0 + m + col * (pw + m)
            px1 = px0 + pw
            c.rect(px0, py0, px1, py1, ramp, lum - .08)
            c.hline(px0, px1, py0, ramp, lum - .2)
            c.vline(px0, py0, py1, ramp, lum - .16)
            c.hline(px0, px1, py1 - 1, ramp, lum + .14)
            c.vline(px1 - 1, py0, py1, ramp, lum + .1)
            c.rect(px0 + 2, py0 + 2, px1 - 2, py1 - 2, ramp, lum - .02)
    ky = y0 + int(h * .5)
    kx = x1 - 5 if knob_side == 'r' else x0 + 3
    c.rect(kx - 1, ky - 3, kx + 2, ky + 6, 'brass', .45)
    c.put(kx, ky - 1, 'brass', .95)
    c.put(kx + 1, ky - 1, 'brass', .7)
    c.put(kx, ky, 'brass', .6)
    if keyhole:
        c.put(kx, ky + 3, 'black', 0)
        c.put(kx, ky + 4, 'black', 0)
    if gap_light:
        c.hline(x0, x1, y1 - 1, 'lamp', .35, emis=1)
    if transom:
        c.rect(x0, y0 - 12, x1, y0 - 4, 'glass', .35, emis=.3)
        c.rect(x0, y0 - 5, x1, y0 - 3, frame, frame_lum)
    return (kx, ky)


# -------------------------------------------------------------------- furniture ----
def wardrobe(c: Canvas, p: Persp, X0, X1, Z0, Z1, H, ramp='wood', lum=.5, open_=False):
    front = lambda xx, yy: lum + np.sin(xx * 1.3) * .015
    p.box(c, X0, X1, 3, H, Z0, Z1, ramp, front=lum, top=lum + .1, side=lum - .18, lum_fn=front)
    p.box(c, X0 - 2, X1 + 2, H, H + 4, Z0, Z1 + 2, ramp, front=lum + .08, top=lum + .2, side=lum - .1)
    p.box(c, X0 + 1, X0 + 4, 0, 3, Z1 - 3, Z1, ramp, front=.25)
    p.box(c, X1 - 4, X1 - 1, 0, 3, Z1 - 3, Z1, ramp, front=.25)
    fx0, fy0, fx1, fy1 = p.front_rect(X0, X1, 3, H, Z1)
    fx0, fy0, fx1, fy1 = int(round(fx0)), int(round(fy0)), int(round(fx1)), int(round(fy1))
    mid = (fx0 + fx1) // 2
    if not open_:
        for (a, b) in [(fx0 + 2, mid - 1), (mid + 1, fx1 - 2)]:
            c.rect(a, fy0 + 3, b, fy1 - 3, ramp, lum - .06)
            c.hline(a, b, fy0 + 3, ramp, lum - .2)
            c.vline(a, fy0 + 3, fy1 - 3, ramp, lum - .18)
            c.hline(a, b, fy1 - 4, ramp, lum + .12)
            c.vline(b - 1, fy0 + 3, fy1 - 3, ramp, lum + .1)
        c.vline(mid, fy0 + 2, fy1 - 2, ramp, lum - .3)
        for kx in (mid - 3, mid + 2):
            c.put(kx, (fy0 + fy1) // 2, 'brass', .8)
            c.put(kx, (fy0 + fy1) // 2 + 1, 'brass', .4)
    return (fx0, fy0, fx1, fy1, mid)


def wardrobe_open_overlay(c: Canvas, rect, ramp='wood', lum=.5, hanger=True):
    fx0, fy0, fx1, fy1, mid = rect
    c.rect(fx0 + 2, fy0 + 2, fx1 - 2, fy1 - 2, 'black', .5)
    c.rect(fx0 + 2, fy0 + 2, fx1 - 2, fy0 + 4, ramp, .2)
    c.hline(fx0 + 3, fx1 - 3, fy0 + 7, 'brass', .4)
    # open doors swung towards the viewer (thin parallelograms)
    w = (fx1 - fx0) // 2
    c.poly([(fx0 - w + 3, fy0 + 3), (fx0 + 1, fy0 + 1), (fx0 + 1, fy1 - 1), (fx0 - w + 3, fy1 + 2)], ramp,
           lum - .05)
    c.poly([(fx1 - 1, fy0 + 1), (fx1 + w - 3, fy0 + 3), (fx1 + w - 3, fy1 + 2), (fx1 - 1, fy1 - 1)], ramp,
           lum + .02)
    c.vline(fx0 - w + 5, fy0 + 6, fy1 - 2, ramp, lum - .2)
    c.vline(fx1 + w - 5, fy0 + 6, fy1 - 2, ramp, lum - .15)
    return (fx0, fy0, fx1, fy1)


def coat_hanger(c: Canvas, x, y, ramp='steel', lum=.7):
    c.put(x, y, ramp, lum)
    c.put(x, y + 1, ramp, lum)
    c.line(x, y + 2, x - 5, y + 5, ramp, lum - .1)
    c.line(x, y + 2, x + 5, y + 5, ramp, lum)
    c.hline(x - 5, x + 6, y + 5, ramp, lum - .2)


def radiator(c: Canvas, x0, y0, x1, y1, ramp='cream', lum=.45):
    c.rect(x0, y0, x1, y1, ramp, lum - .2)
    for x in range(x0 + 1, x1 - 1, 3):
        c.rect(x, y0 + 1, x + 2, y1 - 1, ramp, vgrad(y0, y1, lum + .12, lum - .1))
        c.vline(x, y0 + 1, y1 - 1, ramp, lum + .2)
    c.hline(x0, x1, y0, ramp, lum + .25)
    c.rect(x0 + 1, y1, x0 + 3, y1 + 2, ramp, .2)
    c.rect(x1 - 3, y1, x1 - 1, y1 + 2, ramp, .2)
    c.rect(x1, y1 - 4, x1 + 4, y1 - 2, 'brass', .45)


def washbasin(c: Canvas, x0, y, w=18, ramp='white', lum=.6):
    c.rect(x0 + 6, y + 4, x0 + w - 6, y + 22, 'white', .35)
    c.vline(x0 + 6, y + 4, y + 22, 'white', .55)
    c.ellipse(x0 + w / 2, y + 2, w / 2, 3.5, ramp, lum + .1)
    c.ellipse(x0 + w / 2, y + 1.5, w / 2 - 2, 2.2, ramp, lum - .25)
    c.rect(x0, y + 2, x0 + w, y + 5, ramp, lum)
    c.hline(x0, x0 + w, y + 5, ramp, lum - .3)
    c.rect(x0 + w // 2 - 1, y - 4, x0 + w // 2 + 1, y - 1, 'chrome', .7)
    c.rect(x0 + w // 2 - 1, y - 4, x0 + w // 2 + 3, y - 3, 'chrome', .8)


def mirror(c: Canvas, x0, y0, x1, y1, frame='brass'):
    c.rect(x0, y0, x1, y1, frame, .45)
    c.hline(x0, x1, y0, frame, .8)
    c.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, 'glass', vgrad(y0, y1, .5, .25), emis=.25)
    c.line(x0 + 2, y1 - 4, x0 + 6, y0 + 2, 'glass', .75, emis=.3)
    c.line(x0 + 3, y1 - 3, x0 + 7, y0 + 3, 'glass', .62, emis=.3)


def nightstand(c: Canvas, p: Persp, X0, X1, Z0, Z1, H, ramp='wood', lum=.45):
    p.box(c, X0, X1, 2, H, Z0, Z1, ramp, front=lum, top=lum + .2, side=lum - .2)
    for X in (X0 + 1, X1 - 2):
        p.box(c, X, X + 1, 0, 2, Z1 - 2, Z1, ramp, front=.2)
    x0, y0, x1, y1 = p.front_rect(X0, X1, 2, H, Z1)
    y0, y1 = int(y0), int(y1)
    c.hline(int(x0) + 1, int(x1) - 1, y0 + 6, ramp, lum - .25)
    c.put((x0 + x1) // 2, y0 + 3, 'brass', .8)
    return p.P(X0, H, (Z0 + Z1) / 2)


def table_lamp(c: Canvas, x, y, ramp='cream', on=True):
    """x,y = base centre. Fabric shade with warm glow."""
    c.rect(x - 3, y - 1, x + 3, y + 1, 'brass', .5)
    c.vline(x, y - 9, y - 1, 'brass', .6)
    shade = [(x - 3, y - 15), (x + 3, y - 15), (x + 6, y - 8), (x - 6, y - 8)]
    if on:
        c.poly(shade, 'lamp', vgrad(y - 15, y - 8, .55, .78), emis=1)
        c.hline(x - 6, x + 7, y - 8, 'lamp', .9, emis=1)
    else:
        c.poly(shade, ramp, vgrad(y - 15, y - 8, .4, .3))


def telephone(c: Canvas, x, y):
    """1940s bakelite desk phone, x,y = bottom centre."""
    c.rect(x - 5, y - 4, x + 5, y, 'slate', .12)
    c.rect(x - 4, y - 6, x + 4, y - 4, 'slate', .2)
    c.hline(x - 4, x + 4, y - 6, 'slate', .45)
    c.ellipse(x, y - 3, 2, 1.4, 'cream', .55)
    c.put(x, y - 3, 'black', .2)
    # handset on the cradle
    c.rect(x - 6, y - 9, x + 6, y - 7, 'slate', .25)
    c.hline(x - 5, x + 5, y - 9, 'slate', .55)
    c.rect(x - 7, y - 9, x - 4, y - 6, 'slate', .3)
    c.rect(x + 4, y - 9, x + 7, y - 6, 'slate', .3)


def chair(c: Canvas, p: Persp, X0, X1, Z0, Z1, ramp='oak', lum=.5, seat_h=18, back_h=40, fabric=None):
    """Bentwood-style chair seen from the front-right; back towards the wall (Z0)."""
    leg = 2
    # back legs + back frame (behind the seat)
    for X in (X0, X1 - leg):
        p.box(c, X, X + leg, 0, back_h, Z0, Z0 + leg, ramp, front=lum - .05, side=lum - .2, top=lum + .2)
    p.box(c, X0, X1, back_h - 4, back_h, Z0, Z0 + leg, ramp, front=lum + .1, top=lum + .25)
    for X in range(int(X0) + 4, int(X1) - 3, 4):
        p.box(c, X, X + 1, seat_h + 3, back_h - 4, Z0, Z0 + 1, ramp, front=lum - .1)
    # seat
    p.box(c, X0 - 1, X1 + 1, seat_h, seat_h + 2, Z0, Z1, fabric or ramp, front=lum - .05, top=lum + .15,
          side=lum - .15)
    # front legs
    for X in (X0, X1 - leg):
        p.box(c, X, X + leg, 0, seat_h, Z1 - leg, Z1, ramp, front=lum, side=lum - .2)
    p.box(c, X0, X1, 6, 7, Z1 - 1, Z1, ramp, front=lum - .15)


def iron_bed(c: Canvas, p: Persp, X0, X1, Z0, Z1, frame='cream', sheet='paper', blanket='red', seed=4):
    """Bed with its head against the back wall, foot towards the camera."""
    rng = np.random.default_rng(seed)
    mh = 16  # mattress top
    # headboard posts + bars against the wall
    for X in (X0, X1 - 2):
        p.box(c, X, X + 2, 0, 36, Z0, Z0 + 2, frame, front=.55, side=.4)
    p.box(c, X0, X1, 30, 32, Z0, Z0 + 1, frame, front=.6)
    p.box(c, X0, X1, 20, 21, Z0, Z0 + 1, frame, front=.5)
    for X in range(int(X0) + 6, int(X1) - 3, 5):
        p.box(c, X, X + 1, 18, 31, Z0, Z0 + 1, frame, front=.5)
    # mattress block
    p.box(c, X0 + 1, X1 - 1, 9, mh, Z0 + 1, Z1 - 1, 'paper', front=.62, top=.72, side=.45)
    # pillow
    pts = p.quad([(X0 + 4, mh, Z0 + 2), (X1 - 4, mh, Z0 + 2), (X1 - 4, mh + 4, Z0 + 12), (X0 + 4, mh + 4, Z0 + 12)])
    c.poly(pts, sheet, .82)
    # rumpled blanket over the lower 2/3
    bz0 = Z0 + 14
    N = noise2(c.w, c.h, 5, seed, 2)

    def bl(xx, yy):
        xi = np.clip(xx.astype(int), 0, c.w - 1)
        yi = np.clip(yy.astype(int), 0, c.h - 1)
        return .5 + (N[yi, xi] - .5) * .5 + np.sin(xx * .5 + yy * .3) * .06
    pts = p.quad([(X0, mh + 1, bz0), (X1, mh + 1, bz0), (X1, mh + 1, Z1), (X0, mh + 1, Z1)])
    c.poly(pts, blanket, bl)
    a = p.P(X0, mh + 1, Z1)
    b = p.P(X1, 7, Z1)
    c.rect(a[0], a[1], b[0], b[1], blanket, vgrad(a[1], b[1], .45, .3))
    # sheet turned down
    pts = p.quad([(X0, mh + 2, bz0 - 3), (X1, mh + 2, bz0 - 3), (X1, mh + 2, bz0 + 2), (X0, mh + 2, bz0 + 2)])
    c.poly(pts, sheet, .7)
    # footboard
    for X in (X0, X1 - 2):
        p.box(c, X, X + 2, 0, 26, Z1 - 2, Z1, frame, front=.55, side=.4, top=.8)
    p.box(c, X0, X1, 22, 24, Z1 - 1, Z1, frame, front=.62)
    p.box(c, X0, X1, 12, 13, Z1 - 1, Z1, frame, front=.5)
    for X in range(int(X0) + 6, int(X1) - 3, 5):
        p.box(c, X, X + 1, 12, 23, Z1 - 1, Z1, frame, front=.48)
    for X in (X0, X1 - 2):
        x, y = p.P(X + 1, 26, Z1)
        c.ellipse(x, y - 1, 1.6, 1.6, 'brass', .8)
