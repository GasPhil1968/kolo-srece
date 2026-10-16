"""One-point perspective helpers for interiors.

World units are back-wall pixels: X runs left-right, Y is height above the floor, Z is the
distance from the back wall towards the camera.  P(X, Y, Z) projects to screen space.
"""
from __future__ import annotations

import numpy as np

from core import Canvas


class Persp:
    def __init__(self, bx0, bx1, by0, by1, horizon, depth, cx=None):
        """bx0..bx1 / by0..by1: back wall on screen. horizon: screen y of the eye line.
        depth: camera distance from the back wall (back-wall pixel units)."""
        self.bx0, self.bx1, self.by0, self.by1 = bx0, bx1, by0, by1
        self.hy = horizon
        self.E = by1 - horizon            # eye height above the floor
        self.D = float(depth)
        self.cx = (bx0 + bx1) / 2 if cx is None else cx

    def s(self, Z):
        return self.D / (self.D - Z)

    def P(self, X, Y, Z):
        s = self.s(Z)
        return (self.cx + (X - self.cx) * s, self.hy + (self.E - Y) * s)

    def z_at_floor_y(self, y):
        """Depth Z of the floor point that appears at screen y."""
        s = (y - self.hy) / self.E
        return self.D * (1 - 1 / s)

    def X_at(self, sx, Z):
        return self.cx + (sx - self.cx) / self.s(Z)

    def char_scale(self, y, y_ref):
        """Relative scale of a character whose feet are at screen y, 1.0 at y_ref."""
        return (y - self.hy) / (y_ref - self.hy)

    # ---- faces -------------------------------------------------------------------
    def quad(self, pts3):
        return [self.P(*p) for p in pts3]

    def box(self, c: Canvas, X0, X1, Y0, Y1, Z0, Z1, ramp, front=.55, top=.78, side=.38,
            lum_fn=None, top_fn=None, side_fn=None, outline=None, faces='auto'):
        """Axis-aligned box. Draws visible faces (back faces skipped)."""
        drawn = {}
        # side faces first (they are behind the front face on screen)
        if faces == 'auto' or 'l' in faces:
            if X0 > self.cx and (faces != 'auto' or True):
                pts = self.quad([(X0, Y0, Z0), (X0, Y0, Z1), (X0, Y1, Z1), (X0, Y1, Z0)])
                if X0 > self.cx:
                    drawn['l'] = c.poly(pts, ramp, side_fn or side)
        if faces == 'auto' or 'r' in faces:
            if X1 < self.cx:
                pts = self.quad([(X1, Y0, Z0), (X1, Y0, Z1), (X1, Y1, Z1), (X1, Y1, Z0)])
                drawn['r'] = c.poly(pts, ramp, side_fn or side)
        # top face visible when below the eye
        if Y1 < self.E:
            pts = self.quad([(X0, Y1, Z0), (X1, Y1, Z0), (X1, Y1, Z1), (X0, Y1, Z1)])
            drawn['t'] = c.poly(pts, ramp, top_fn or top)
        # front face
        pts = self.quad([(X0, Y0, Z1), (X1, Y0, Z1), (X1, Y1, Z1), (X0, Y1, Z1)])
        drawn['f'] = c.poly(pts, ramp, lum_fn or front)
        if outline:
            r, l = outline
            fr = self.quad([(X0, Y0, Z1), (X1, Y0, Z1), (X1, Y1, Z1), (X0, Y1, Z1)])
            for a, b in zip(fr, fr[1:] + fr[:1]):
                c.line(a[0], a[1], b[0], b[1], r, l)
        return drawn

    def front_rect(self, X0, X1, Y0, Y1, Z):
        a = self.P(X0, Y1, Z)
        b = self.P(X1, Y0, Z)
        return a[0], a[1], b[0], b[1]


def floor_poly(p: Persp, X0, X1, Z0, Z1):
    return p.quad([(X0, 0, Z0), (X1, 0, Z0), (X1, 0, Z1), (X0, 0, Z1)])


def plank_floor(c: Canvas, p: Persp, X0, X1, Z0, Z1, ramp='wood', base=.5, plank_w=14, seed=3,
                gap_lum=.18, var=.12):
    """Floorboards running towards the viewer (seams converge on the vanishing point)."""
    pts = floor_poly(p, X0, X1, Z0, Z1)
    rng = np.random.default_rng(seed)
    n = int((X1 - X0) / plank_w) + 2
    lums = base + (rng.random(n) - .5) * 2 * var
    hy, cx, E = p.hy, p.cx, p.E

    def fn(xx, yy):
        s = (yy - hy) / E
        X = cx + (xx - cx) / np.maximum(s, 1e-3)
        k = np.floor((X - X0) / plank_w).astype(int)
        k = np.clip(k, 0, n - 1)
        frac = (X - X0) / plank_w - np.floor((X - X0) / plank_w)
        L = lums[k]
        # grain: thin streaks along the plank
        grain = np.sin((X * 1.7 + k * 13.1)) * .03 + np.sin(X * .45 + k) * .02
        L = L + grain
        # seam
        seam_w = 0.7 / np.maximum(s, 1e-3) / plank_w * 1.2
        L = np.where(frac < seam_w, gap_lum, L)
        # end joints at staggered depths
        Z = p.D * (1 - 1 / np.maximum(s, 1e-3))
        jz = (Z + k * 37.0) % 90.0
        L = np.where(jz < 0.9 * 1, gap_lum + .05, L)
        return L
    c.poly(pts, ramp, fn)
    return pts


def tile_floor(c: Canvas, p: Persp, X0, X1, Z0, Z1, ramp='tile', ramp2=None, size=16, base=.55, alt=.35,
               grout=.25, checker=True):
    pts = floor_poly(p, X0, X1, Z0, Z1)
    hy, cx, E, D = p.hy, p.cx, p.E, p.D

    def fn(xx, yy):
        s = np.maximum((yy - hy) / E, 1e-3)
        X = cx + (xx - cx) / s
        Z = D * (1 - 1 / s)
        i = np.floor((X - X0) / size)
        j = np.floor(Z / size)
        fx = (X - X0) / size - i
        fz = Z / size - j
        L = np.where(((i + j) % 2 == 0) | (not checker), base, alt)
        gw = 0.9 / s / size
        L = np.where((fx < gw) | (fz < gw * 1.2), grout, L)
        return L
    c.poly(pts, ramp, fn)
    return pts


def wall_back(c: Canvas, p: Persp, ramp, lum, top=None):
    y0 = p.by0 if top is None else top
    c.rect(p.bx0, y0, p.bx1, p.by1, ramp, lum)


def wall_left(c: Canvas, p: Persp, ramp, lum, height, Zn):
    pts = p.quad([(p.bx0, 0, 0), (p.bx0, 0, Zn), (p.bx0, height, Zn), (p.bx0, height, 0)])
    c.poly(pts, ramp, lum)
    return pts


def wall_right(c: Canvas, p: Persp, ramp, lum, height, Zn):
    pts = p.quad([(p.bx1, 0, 0), (p.bx1, 0, Zn), (p.bx1, height, Zn), (p.bx1, height, 0)])
    c.poly(pts, ramp, lum)
    return pts


def side_wall_fn(p: Persp, base, X, stripe=None, stripe_lum=.06, noise=None):
    """Lum fn for a side wall: depth-darkening plus optional perspective stripes."""
    hy, cx, E, D = p.hy, p.cx, p.E, p.D

    def fn(xx, yy):
        s = np.maximum((xx - cx) / (X - cx), 1e-3)
        Z = D * (1 - 1 / s)
        L = np.full(xx.shape, base, np.float32)
        if stripe:
            L = L + np.where((Z % stripe) < stripe / 2, stripe_lum, 0)
        return L
    return fn


def baseboard_back(c, p: Persp, h=4, ramp='wood', lum=.35):
    c.rect(p.bx0, p.by1 - h, p.bx1, p.by1, ramp, lum)
    c.hline(p.bx0, p.bx1, p.by1 - h, ramp, lum + .25)


def baseboard_side(c, p: Persp, X, Zn, h=4, ramp='wood', lum=.3):
    pts = p.quad([(X, 0, 0), (X, 0, Zn), (X, h, Zn), (X, h, 0)])
    c.poly(pts, ramp, lum)
