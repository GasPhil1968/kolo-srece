"""Shared helpers for the NIGHT LATCH extras (inventory icons, city map, title, photos).

Registers the extra colour ramps (prefix ``e_``), a 3x5 micro font for map labels and
small print, and a few mask utilities (dilate / shift / selective outline).
"""
from __future__ import annotations

import numpy as np

from core import RAMPS, ramp, hx

# ---------------------------------------------------------------- extra ramps ---------
# (dark -> light, hue-shifted: cool / desaturated shadows, warm highlights)
ramp('e_money', '#0c140f', '#16241a', '#233626', '#334a33', '#456141', '#5b7a52', '#769466', '#97af84', '#bfcfa9')
ramp('e_manila', '#241a0d', '#3e2e17', '#5b4423', '#7a5c31', '#987641', '#b39054', '#c9a96b', '#dcc28a', '#ecdcb0')
ramp('e_bone', '#2a2219', '#463b2c', '#655742', '#86765a', '#a59473', '#c0b08e', '#d7caab', '#e9e0c8', '#f7f2e3')
ramp('e_telegram', '#2b2109', '#4a3b11', '#6e5a1a', '#927a25', '#b39832', '#cfb547', '#e3cc64', '#f0e08f', '#faf0c0')
ramp('e_straw', '#2a1c07', '#47300c', '#6b4b13', '#8f671c', '#b08427', '#cca23a', '#e1be55', '#efd57f', '#f9eab0')
ramp('e_wetstraw', '#100f0a', '#1b1a10', '#282717', '#36341e', '#454126', '#554f2e', '#665e37', '#796e42', '#8c7f4f')
ramp('e_flame', '#3a1004', '#772806', '#b9500d', '#e8801b', '#fbb03a', '#ffd76e', '#fff1b8', '#fffbe8')
ramp('e_blueflame', '#071237', '#102a75', '#1f4fbd', '#4787ea', '#8dbcff', '#d2e6ff')
ramp('e_amber', '#170603', '#2b0d05', '#451808', '#62250b', '#83360f', '#a54c16', '#c46820', '#de8c3a', '#f2b565')
ramp('e_oilskin', '#18170a', '#292811', '#3d3b19', '#545021', '#6b672a', '#857f34', '#a09840', '#bab052', '#d2c86e')
ramp('e_leather', '#130906', '#22110a', '#341b0f', '#482614', '#5d321a', '#743f21', '#8c4e29', '#a46033', '#ba7441')
ramp('e_steno', '#1d241f', '#2f3a31', '#445145', '#5b6a5b', '#748572', '#8f9e8a', '#a9b7a2', '#c4d0bb', '#dfe8d5')
ramp('e_sepia', '#0f0905', '#1d130b', '#2d1f12', '#3f2d1b', '#533e26', '#685033', '#7e6443', '#957955', '#ad8f69',
     '#c4a67f', '#d8bd98', '#e9d4b2')
ramp('e_film', '#040303', '#0a0807', '#110e0c', '#1a1612', '#25201b', '#332c25')
ramp('e_ink', '#0b0806', '#160f0b', '#221811', '#2f2218', '#3d2d20')
ramp('e_parch', '#1d150d', '#2e2216', '#433220', '#5a442c', '#735839', '#8c6d48', '#a48459', '#ba9a6c', '#cdb082',
     '#dcc499', '#e8d6b2')
ramp('e_sea', '#0a1218', '#122029', '#1b2e3a', '#263f4c', '#33515f', '#436574', '#567a88', '#6d909b', '#87a6ad',
     '#a5bdbe')
ramp('e_rose', '#2a1714', '#40231f', '#58322b', '#714338', '#8a5647', '#a16a57', '#b6806a', '#c8977f', '#d7ad96')
ramp('e_green', '#141a0e', '#212a17', '#2f3b21', '#3f4d2c', '#516138', '#647546', '#788a56', '#8d9e68', '#a3b27d')
ramp('e_hill', '#22180e', '#352616', '#4a361f', '#604729', '#775a34', '#8d6d40', '#a3814f', '#b79560')
ramp('e_road', '#2c2318', '#41352a', '#5a4b3b', '#74634f', '#8f7d66', '#a9977e', '#c1b096', '#d6c7ad', '#e6d9c2')
ramp('e_redink', '#1e0605', '#3a0b09', '#5c120e', '#7f1a14', '#a1261c', '#bd3a29', '#d4573f')
ramp('e_gold', '#1b1004', '#3a2408', '#5e3b0e', '#865617', '#ad7422', '#cf9630', '#e8b746', '#f6d66e', '#fdf0b0')
ramp('e_neon', '#2a0a04', '#5a1806', '#93300c', '#cc5212', '#f07d22', '#ffaa45', '#ffd27e', '#fff0c4')
ramp('e_wall', '#07080c', '#0c0e14', '#11141c', '#171b25', '#1e2330', '#262c3b', '#303747', '#3c4455')
ramp('e_asphalt', '#040508', '#080a0f', '#0c0f16', '#11151e', '#171c27', '#1e2431', '#262d3c', '#303849', '#3c4558')
ramp('e_skyfog', '#0a0d16', '#10141f', '#161b29', '#1d2333', '#252c3e', '#2f3749', '#3a4355', '#475062', '#565f70')
ramp('e_window', '#2a1606', '#4e2b0b', '#7a4511', '#a8641a', '#d08a2a', '#eab14a', '#f8d585', '#fff0c0')
ramp('e_tan', '#1a120b', '#2b1f13', '#3f2e1c', '#554026', '#6d5331', '#86683e', '#a0804e', '#b89862', '#cfb27a')


def rgb_of(name: str, i: int) -> np.ndarray:
    cols = RAMPS[name]
    return cols[int(np.clip(i, 0, len(cols) - 1))].astype(np.int32)


# ---------------------------------------------------------------- micro font ----------
MICRO: dict[str, tuple[str, ...]] = {}


def _m(ch, *rows):
    MICRO[ch] = rows


_m('A', '.#.', '#.#', '###', '#.#', '#.#')
_m('B', '##.', '#.#', '##.', '#.#', '##.')
_m('C', '.##', '#..', '#..', '#..', '.##')
_m('D', '##.', '#.#', '#.#', '#.#', '##.')
_m('E', '###', '#..', '##.', '#..', '###')
_m('F', '###', '#..', '##.', '#..', '#..')
_m('G', '.##', '#..', '#.#', '#.#', '.##')
_m('H', '#.#', '#.#', '###', '#.#', '#.#')
_m('I', '###', '.#.', '.#.', '.#.', '###')
_m('J', '..#', '..#', '..#', '#.#', '.#.')
_m('K', '#.#', '#.#', '##.', '#.#', '#.#')
_m('L', '#..', '#..', '#..', '#..', '###')
_m('M', '#...#', '##.##', '#.#.#', '#...#', '#...#')
_m('N', '#..#', '##.#', '#.##', '#..#', '#..#')
_m('O', '.#.', '#.#', '#.#', '#.#', '.#.')
_m('P', '##.', '#.#', '##.', '#..', '#..')
_m('Q', '.#.', '#.#', '#.#', '##.', '.##')
_m('R', '##.', '#.#', '##.', '#.#', '#.#')
_m('S', '.##', '#..', '.#.', '..#', '##.')
_m('T', '###', '.#.', '.#.', '.#.', '.#.')
_m('U', '#.#', '#.#', '#.#', '#.#', '###')
_m('V', '#.#', '#.#', '#.#', '#.#', '.#.')
_m('W', '#...#', '#...#', '#.#.#', '#.#.#', '.#.#.')
_m('X', '#.#', '#.#', '.#.', '#.#', '#.#')
_m('Y', '#.#', '#.#', '.#.', '.#.', '.#.')
_m('Z', '###', '..#', '.#.', '#..', '###')
_m('0', '###', '#.#', '#.#', '#.#', '###')
_m('1', '.#.', '##.', '.#.', '.#.', '###')
_m('2', '##.', '..#', '.#.', '#..', '###')
_m('3', '##.', '..#', '.#.', '..#', '##.')
_m('4', '#.#', '#.#', '###', '..#', '..#')
_m('5', '###', '#..', '##.', '..#', '##.')
_m('6', '.##', '#..', '###', '#.#', '###')
_m('7', '###', '..#', '.#.', '.#.', '.#.')
_m('8', '###', '#.#', '###', '#.#', '###')
_m('9', '###', '#.#', '###', '..#', '##.')
_m(' ', '..', '..', '..', '..', '..')
_m('.', '.', '.', '.', '.', '#')
_m(',', '.', '.', '.', '#', '#')
_m('-', '...', '...', '###', '...', '...')
_m("'", '#', '#', '.', '.', '.')
_m('&', '.#.', '#.#', '.#.', '#.#', '.##')
_m('/', '..#', '..#', '.#.', '#..', '#..')
_m(':', '.', '#', '.', '#', '.')
_m('°', '#', '.', '.', '.', '.')

# A slightly taller 3x6 condensed set is not needed; the 7 px font lives in font.py.


def micro_width(s: str, spacing: int = 1) -> int:
    w = 0
    for ch in s:
        g = MICRO.get(ch.upper(), MICRO[' '])
        w += len(g[0]) + spacing
    return max(0, w - spacing)


def micro_mask(s: str, spacing: int = 1) -> np.ndarray:
    w = micro_width(s, spacing)
    m = np.zeros((5, max(w, 1)), bool)
    x = 0
    for ch in s:
        g = MICRO.get(ch.upper(), MICRO[' '])
        gw = len(g[0])
        for yy, row in enumerate(g):
            for xx, c in enumerate(row):
                if c == '#':
                    m[yy, x + xx] = True
        x += gw + spacing
    return m


def micro_text(c, x, y, s, ramp_name, lum, emis=0.0, spacing=1, align='left'):
    """Write micro text onto a core.Canvas (x,y = top-left, or centre x with align='center')."""
    m = micro_mask(s, spacing)
    if align == 'center':
        x = int(round(x - m.shape[1] / 2))
    elif align == 'right':
        x = int(x - m.shape[1])
    ys, xs = np.nonzero(m)
    for yy, xx in zip(ys, xs):
        c.put(x + xx, y + yy, ramp_name, lum, emis)
    return m.shape[1]


# ---------------------------------------------------------------- masks ---------------
def shift(m: np.ndarray, dy: int, dx: int, fill=False) -> np.ndarray:
    """Return m shifted so that out[y, x] = m[y - dy, x - dx]."""
    h, w = m.shape
    out = np.full_like(m, fill)
    ys0, ys1 = max(0, dy), min(h, h + dy)
    xs0, xs1 = max(0, dx), min(w, w + dx)
    out[ys0:ys1, xs0:xs1] = m[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
    return out


def dilate4(m: np.ndarray) -> np.ndarray:
    return m | shift(m, 1, 0) | shift(m, -1, 0) | shift(m, 0, 1) | shift(m, 0, -1)


def dilate8(m: np.ndarray) -> np.ndarray:
    out = m.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dy or dx:
                out |= shift(m, dy, dx)
    return out


def bayer4(h: int, w: int) -> np.ndarray:
    from core import BAYER4
    return np.tile(BAYER4, (h // 4 + 1, w // 4 + 1))[:h, :w]


def hexrgb(h: str) -> np.ndarray:
    return np.array(hx(h), np.int32)
