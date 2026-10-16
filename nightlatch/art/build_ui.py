"""Interface art: HUD panel, buttons, slots, notebook, documents, close-up widgets, pins,
portraits. Packed into public/assets/ui/ui.png + ui.json (Phaser JSON-hash atlas)."""
from __future__ import annotations

import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import Canvas, RAMPS, hx, noise2, out_path, save_png, vgrad, hgrad
from font import glyph_array

FRAMES: dict[str, np.ndarray] = {}


def add(name, rgba):
    FRAMES[name] = rgba


def canvas_rgba(c: Canvas, mask=None):
    rgb = c.render(glow=bool(c.glows))
    a = np.where(c.rid >= 0, 255, 0).astype(np.uint8) if mask is None else mask
    return np.dstack([rgb, a])


def text_px(img, x, y, s, col):
    """Stamp pixel-font text into an RGBA array."""
    from font import G
    for ch in s:
        g = glyph_array(ch if ch in G else '?')
        h, w = g.shape
        ys, xs = np.nonzero(g)
        for yy, xx in zip(ys, xs):
            Y, X = y + yy, x + xx
            if 0 <= Y < img.shape[0] and 0 <= X < img.shape[1]:
                img[Y, X, :3] = col
                img[Y, X, 3] = 255
        x += w + 1
    return x


def text_width(s):
    return sum(glyph_array(c if c in __import__('font').G else '?').shape[1] + 1 for c in s) - 1


# ------------------------------------------------------------------------- panel ----
def build_panel():
    W, H = 320, 36
    c = Canvas(W, H, 3)
    c.ambient = 1.0
    N = noise2(W, H, 6, 4, 3)

    def wood(xx, yy):
        xi = xx.astype(int)
        yi = yy.astype(int)
        grain = np.sin(xx * .09 + np.sin(yy * .7) * 2.2 + N[yi, xi] * 5) * .06
        return .36 + grain + (N[yi, xi] - .5) * .12
    c.rect(0, 0, W, H, 'wood', wood)
    # brass trim
    c.rect(0, 0, W, 2, 'brass', .7, dith=0)
    c.hline(0, W, 0, 'brass', .95)
    c.hline(0, W, 2, 'wood', .12)
    # sentence strip (recessed)
    c.rect(48, 3, 272, 13, 'ink', .4, dith=0)
    c.hline(48, 272, 13, 'wood', .55)
    # inventory well
    c.rect(46, 14, 274, 35, 'wood', .18, dith=0)
    c.hline(46, 274, 14, 'wood', .08)
    c.hline(46, 274, 34, 'wood', .5)
    c.vline(46, 14, 35, 'wood', .08)
    c.vline(273, 14, 35, 'wood', .5)
    # button wells
    for x in (3, 26, 275, 298):
        c.rect(x, 13, x + 20, 33, 'wood', .2, dith=0)
        c.hline(x, x + 20, 13, 'wood', .08)
        c.hline(x, x + 20, 33, 'wood', .55)
    # brass corner screws
    for (x, y) in ((2, 5), (317, 5), (2, 31), (317, 31), (46, 6), (273, 6)):
        c.put(x, y, 'brass', .8)
        c.put(x + 1, y, 'brass', .5)
    c.rect(0, H - 1, W, H, 'wood', .1, dith=0)
    add('panel', canvas_rgba(c))


def build_slots():
    for name, hi in (('slot', False), ('slot_hi', True)):
        W, H = 26, 20
        c = Canvas(W, H, 5)
        c.ambient = 1.0
        c.rect(0, 0, W, H, 'wood', .12, dith=0)
        c.rect(1, 1, W - 1, H - 1, 'red' if not hi else 'red', vgrad(1, H, .18, .3) if not hi else vgrad(1, H, .3, .42))
        c.hline(1, W - 1, 1, 'wood', .05)
        c.vline(1, 1, H - 1, 'wood', .05)
        if hi:
            for (x0, y0, x1, y1) in ((0, 0, W, 1), (0, H - 1, W, H), (0, 0, 1, H), (W - 1, 0, W, H)):
                c.rect(x0, y0, x1, y1, 'brass', .8, dith=0)
        add(name, canvas_rgba(c))


def icon_canvas(draw, hi):
    W = H = 20
    c = Canvas(W, H, 9)
    c.ambient = 1.0
    draw(c, 1.08 if hi else 1.0)
    rgba = canvas_rgba(c)
    # selective dark outline
    a = rgba[..., 3] > 0
    pad = np.pad(a, 1)
    edge = np.zeros_like(a)
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        edge |= pad[1 + dy:1 + dy + H, 1 + dx:1 + dx + W]
    edge &= ~a
    rgba[edge] = (12, 8, 6, 255)
    if hi:
        rgba[..., :3] = np.clip(rgba[..., :3].astype(int) + 22, 0, 255)
    return rgba


def build_buttons():
    def notebook(c, k):
        c.rect(4, 3, 16, 17, 'red', vgrad(3, 17, .45 * k, .3 * k))
        c.rect(5, 4, 15, 16, 'red', .5 * k)
        c.rect(15, 4, 17, 16, 'paper', .8)
        c.vline(16, 4, 16, 'paper', .6)
        c.vline(11, 3, 17, 'black', .9)
        c.rect(7, 7, 10, 8, 'brass', .8)
    def mapicon(c, k):
        pts = [(3, 5), (8, 3), (12, 5), (17, 3), (17, 15), (12, 17), (8, 15), (3, 17)]
        c.poly(pts, 'paper', .75 * k)
        c.poly([(8, 3), (12, 5), (12, 17), (8, 15)], 'paper', .55 * k)
        c.line(5, 13, 10, 9, 'red', .6)
        c.line(10, 9, 15, 11, 'red', .6)
        c.put(15, 11, 'red', .8)
        c.put(14, 10, 'red', .8)
    def hint(c, k):
        c.rect(9, 9, 11, 18, 'oak', .7 * k)
        c.ellipse(10, 8, 1.6, 2, 'red', .6)
        c.ellipse(10, 5, 2.2, 3.5, 'lamp', .8 * k, emis=1)
        c.ellipse(10, 6, 1.2, 1.6, 'lamp', 1.0, emis=1)
    def menu(c, k):
        c.ellipse(10, 13, 8, 2.6, 'slate', .4 * k)
        c.poly([(5, 13), (6, 6), (10, 5), (14, 6), (15, 13)], 'slate', .5 * k)
        c.rect(5, 10, 15, 12, 'black', .9)
        c.put(10, 6, 'slate', .8)
    for name, fn in (('btn_notebook', notebook), ('btn_map', mapicon), ('btn_hint', hint), ('btn_menu', menu)):
        add(name, icon_canvas(fn, False))
        add(name + '_hi', icon_canvas(fn, True))
    for name, d in (('arrow_l', -1), ('arrow_r', 1)):
        img = np.zeros((16, 8, 4), np.uint8)
        col = np.array(hx('#d9a945'))
        for y in range(4, 12):
            w = 4 - abs(y - 7.5) + .5
            for x in range(8):
                xx = x if d > 0 else 7 - x
                if xx < w + 1:
                    img[y, x, :3] = col if y < 8 else col * .75
                    img[y, x, 3] = 255
        add(name, img)
    m = np.zeros((7, 7, 4), np.uint8)
    for y in range(7):
        for x in range(7):
            d = (x - 3) ** 2 + (y - 3) ** 2
            if d <= 9:
                m[y, x] = (20, 14, 8, 255) if d > 4 else (255, 220, 120, 255)
    add('marker', m)
    for name, hi in (('btn_close', False), ('btn_close_hi', True)):
        img = np.zeros((11, 11, 4), np.uint8)
        img[..., :3] = hx('#3a1a12') if not hi else hx('#7a2a1a')
        img[..., 3] = 255
        img[0, :, :3] = img[:, 0, :3] = hx('#d9a945')
        img[-1, :, :3] = img[:, -1, :3] = hx('#7c531b')
        for i in range(3, 8):
            for j in (i, 10 - i):
                img[i, j, :3] = (240, 220, 180)
        add(name, img)
    dlg = np.zeros((32, 32, 4), np.uint8)
    dlg[..., :3] = hx('#0b0a10')
    dlg[..., 3] = 235
    dlg[0, :, :3] = hx('#7c531b')
    dlg[0, :, 3] = 255
    add('dialog_bg', dlg)
    for name, on in (('check_off', False), ('check_on', True)):
        img = np.zeros((7, 7, 4), np.uint8)
        img[0, :] = img[-1, :] = img[:, 0] = img[:, -1] = (60, 50, 70, 255)
        if on:
            for (x, y) in ((1, 3), (2, 4), (3, 5), (4, 4), (5, 3), (5, 2), (6, 1)):
                img[y, min(x, 6)] = (150, 40, 30, 255)
        add(name, img)


# ------------------------------------------------------------------ documents ----
def paper_sheet(W, H, ramp, base, lines=None, seed=1, torn=False, fold=False):
    c = Canvas(W, H, seed)
    c.ambient = 1.0
    N = noise2(W, H, 9, seed, 3)

    def fn(xx, yy):
        xi = xx.astype(int)
        yi = yy.astype(int)
        return base + (N[yi, xi] - .5) * .1 - (np.abs(xx - W / 2) / W) * .05
    c.rect(0, 0, W, H, ramp, fn)
    if lines:
        col, step, start = lines
        for y in range(start, H - 4, step):
            c.hline(6, W - 6, y, col, .55, emis=0)
    if fold:
        c.hline(2, W - 2, H // 2, ramp, base - .12)
    # edge shading
    c.hline(0, W, H - 1, ramp, base - .25)
    c.vline(W - 1, 0, H, ramp, base - .2)
    rgba = canvas_rgba(c)
    if torn:
        rng = np.random.default_rng(seed)
        for x in range(W):
            d = int(rng.integers(0, 3))
            rgba[:d, x, 3] = 0
    return rgba


def build_docs():
    add('doc_paper', paper_sheet(250, 156, 'paper', .8, seed=2))
    add('doc_note', paper_sheet(236, 156, 'cream', .82, lines=('glass', 10, 20), seed=3, torn=True))
    news = paper_sheet(256, 160, 'paper', .7, seed=4)
    news[18:19, 8:248, :3] = (60, 54, 44)
    news[20:21, 8:248, :3] = (60, 54, 44)
    add('doc_newspaper', news)
    carbon = paper_sheet(244, 156, 'glass', .88, seed=5)
    add('doc_carbon', carbon)
    f = paper_sheet(252, 158, 'oak', .82, seed=6, fold=False)
    f[0:8, 180:244, 3] = 255
    f[2:3, 186:240, :3] = (120, 90, 50)
    add('doc_file', f)
    ph = np.zeros((150, 252, 4), np.uint8)
    ph[...] = (24, 22, 24, 255)
    ph[2:-2, 2:-2] = (34, 31, 33, 255)
    add('doc_photo', ph)
    tg = paper_sheet(246, 150, 'gold', .78, seed=7)
    for y in (30, 58, 86):
        tg[y:y + 1, 8:238, :3] = (150, 120, 60)
    add('doc_telegram', tg)
    add('doc_card', paper_sheet(220, 140, 'cream', .9, lines=('red', 12, 24), seed=8))


# -------------------------------------------------------------- close-up widgets ----
def build_closeups():
    c = Canvas(170, 104, 10)
    c.ambient = 1.0
    c.rect(0, 0, 170, 104, 'steel', vgrad(0, 104, .55, .3))
    c.rect(6, 6, 164, 98, 'steel', vgrad(6, 98, .42, .25))
    for (x, y) in ((10, 10), (159, 10), (10, 93), (159, 93)):
        c.ellipse(x, y, 2.5, 2.5, 'chrome', .7)
        c.hline(x - 1, x + 2, y, 'chrome', .3)
    c.rect(20, 40, 150, 66, 'black', .6, dith=0)
    add('lock_plate', canvas_rgba(c))
    c = Canvas(22, 32, 11)
    c.ambient = 1.0
    c.rect(0, 0, 22, 32, 'brass', lambda xx, yy: .35 + .45 * np.cos((yy - 16) / 16 * 1.4))
    for y in range(2, 32, 4):
        c.hline(0, 22, y, 'brass', .25)
    c.rect(2, 9, 20, 23, 'black', .4, dith=0)
    add('wheel', canvas_rgba(c))
    for name, up in (('wheel_up', True), ('wheel_dn', False)):
        img = np.zeros((10, 16, 4), np.uint8)
        for y in range(10):
            w = (y if up else 9 - y) * .8
            for x in range(16):
                if abs(x - 7.5) <= w:
                    img[y, x] = (*hx('#d9a945'), 255) if abs(x - 7.5) < w - 1 else (*hx('#5a3a12'), 255)
        add(name, img)
    for name, hi in (('btn_try', False), ('btn_try_hi', True)):
        img = np.zeros((14, 46, 4), np.uint8)
        img[...] = (*hx('#7c531b' if not hi else '#be8a33'), 255)
        img[0, :, :3] = hx('#ecc864')
        img[-1, :, :3] = hx('#3a240b')
        label = 'TRY'
        tw = text_width(label)
        text_px(img, (46 - tw) // 2, 3, label, hx('#1f1306'))
        add(name, img)
    c = Canvas(286, 112, 12)
    c.ambient = 1.0
    c.rect(0, 0, 286, 112, 'black', vgrad(0, 112, 1.0, .6))
    c.rect(4, 4, 282, 108, 'ink', .7)
    for (x, y) in ((8, 8), (277, 8), (8, 103), (277, 103)):
        c.ellipse(x, y, 2, 2, 'chrome', .6)
    add('patch_panel', canvas_rgba(c))
    j = np.zeros((11, 11, 4), np.uint8)
    for y in range(11):
        for x in range(11):
            d = ((x - 5) ** 2 + (y - 5) ** 2) ** .5
            if d <= 5.2:
                j[y, x] = (*hx('#be8a33'), 255) if d > 2.6 else (*hx('#050505'), 255)
                if 2.6 < d <= 3.4 and y < 5:
                    j[y, x, :3] = hx('#f8e49a')
    add('jack', j)


# ------------------------------------------------------------- notebook & menus ----
def build_notebook():
    W, H = 300, 164
    c = Canvas(W, H, 13)
    c.ambient = 1.0
    c.rect(0, 0, W, H, 'red', vgrad(0, H, .32, .22))
    N = noise2(W, H, 7, 13, 3)

    def page(xx, yy):
        xi = xx.astype(int)
        yi = yy.astype(int)
        return .86 + (N[yi, xi] - .5) * .06
    c.rect(6, 6, W // 2 - 2, H - 6, 'cream', page)
    c.rect(W // 2 + 2, 6, W - 6, H - 6, 'cream', page)
    for y in range(24, H - 8, 10):
        c.hline(14, W // 2 - 8, y + 9, 'glass', .62)
        c.hline(W // 2 + 8, W - 14, y + 9, 'glass', .62)
    c.rect(W // 2 - 2, 6, W // 2 + 2, H - 6, 'red', .2)
    c.vline(W // 2, 6, H - 6, 'black', .8)
    c.vline(20, 6, H - 6, 'red', .55)
    c.vline(W // 2 + 16, 6, H - 6, 'red', .55)
    add('notebook', canvas_rgba(c))
    img = np.zeros((12, 50, 4), np.uint8)
    img[...] = (*hx('#d8c9a6'), 255)
    img[0, :, :3] = hx('#efe2c9')
    img[:, 0, :3] = img[:, -1, :3] = hx('#8f7e66')
    add('tab', img)
    c = Canvas(210, 146, 14)
    c.ambient = 1.0
    c.rect(0, 0, 210, 146, 'wood', vgrad(0, 146, .5, .3))
    c.rect(5, 5, 205, 141, 'ink', vgrad(5, 141, .55, .35))
    c.rect(5, 5, 205, 6, 'brass', .7, dith=0)
    c.rect(5, 140, 205, 141, 'brass', .45, dith=0)
    add('menu_panel', canvas_rgba(c))
    for name, col, hi in (('pin', '#c0281e', False), ('pin_hi', '#ff5040', True), ('pin_here', '#ecc864', False)):
        img = np.zeros((11, 9, 4), np.uint8)
        for y in range(11):
            for x in range(9):
                d = ((x - 4) ** 2 + (y - 3.5) ** 2) ** .5
                if d <= 3.6:
                    img[y, x] = (*hx(col), 255)
                    if d > 2.8:
                        img[y, x, :3] = (20, 10, 8)
                    elif x < 4 and y < 3:
                        img[y, x, :3] = (255, 240, 220)
        for y in range(7, 11):
            img[y, 4] = (40, 30, 30, 255)
        add(name, img)


def build_portraits():
    """Head-and-shoulders portraits rendered from the same character models at 2.4x."""
    from chars_core import Sprite
    from chars_body import front_pose
    from chars_draw import draw_front
    from characters import CHARACTERS
    ids = {'mabel': 'mabel', 'evelyn': 'evelyn', 'nora': 'nora', 'deacon': 'deacon_stand', 'sal': 'sal',
           'pettibone': 'pettibone', 'delaney': 'delaney', 'gus': 'gus', 'kessler': 'kessler',
           'abernathy': 'abernathy', 'pike': 'pike', 'agnes': 'agnes', 'kerrigan': 'kerrigan', 'lillian': 'lillian',
           'pruett': 'pruett', 'vey': 'vey', 'crane': 'crane', 'pruitt': 'pruitt', 'barnaby': 'barnaby', 'hask': 'hask',
           'cobb': 'cobb', 'kroll': 'kroll', 'morrow': 'morrow'}
    for pid, cid in ids.items():
        spec = dict(CHARACTERS[cid])
        spec['kind'] = 'stander'
        k = 1.8
        sp = Sprite(28, 28, 14, 97, k=k)
        P = front_pose(None, spec)
        draw_front(sp, P, spec)
        img = sp.render()
        frame = np.zeros((28, 28, 4), np.uint8)
        frame[...] = (*hx('#2a2420'), 255)
        frame[1:-1, 1:-1] = (*hx('#5a5040'), 255)
        a = img[..., 3:4] / 255.0
        frame[..., :3] = (frame[..., :3] * (1 - a) + img[..., :3] * a).astype(np.uint8)
        add('face_' + pid, frame)


# ------------------------------------------------------------------------- pack ----
def pack():
    names = sorted(FRAMES, key=lambda n: -FRAMES[n].shape[0])
    W = 512
    x = y = row_h = 0
    pos = {}
    for n in names:
        h, w = FRAMES[n].shape[:2]
        if x + w > W:
            x = 0
            y += row_h + 1
            row_h = 0
        pos[n] = (x, y)
        x += w + 1
        row_h = max(row_h, h)
    H = y + row_h + 1
    atlas = np.zeros((H, W, 4), np.uint8)
    frames = {}
    for n, (px, py) in pos.items():
        img = FRAMES[n]
        h, w = img.shape[:2]
        atlas[py:py + h, px:px + w] = img
        frames[n] = {'frame': {'x': px, 'y': py, 'w': w, 'h': h}, 'rotated': False, 'trimmed': False,
                     'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'sourceSize': {'w': w, 'h': h}}
    folder = out_path('ui')
    os.makedirs(folder, exist_ok=True)
    save_png(atlas, os.path.join(folder, 'ui.png'))
    with open(os.path.join(folder, 'ui.json'), 'w') as f:
        json.dump({'frames': frames, 'meta': {'image': 'ui.png', 'size': {'w': W, 'h': H}, 'scale': '1'}}, f)


def main():
    FRAMES.clear()
    build_panel()
    build_slots()
    build_buttons()
    build_docs()
    build_closeups()
    build_notebook()
    build_portraits()
    pack()


if __name__ == '__main__':
    main()
