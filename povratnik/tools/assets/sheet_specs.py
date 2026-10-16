"""Frame and asset tables for build_sheets.py. Every entry names its source in the old project.

Sheet anims: frame indices into the sheet (row-major for grids, list order for explicit rects).
`durations` (seconds per listed frame) expand into repeated frames at `fps`, so irregular timings
of the original art are kept. `refH` is the source-pixel height of the figure standing upright
(seated figures: estimated from head size), used to normalise scale with the room perspective.
"""


def timed(frames, durations, fps):
    out = []
    for f, d in zip(frames, durations):
        out += [f] * max(1, round(d * fps))
    return out


SHEETS = {
    # --- Sarajevo 1996 -------------------------------------------------------------------------
    'nedzad_bar': {
        'src': 'sarajevo-v4/nedzad-polish.webp', 'grid': (4, 4), 'refH': 280,
        'anims': {
            'stand': {'frames': [15], 'loop': True},
            'polish': {'frames': timed(range(8), [0.7] * 8, 10) + timed([12], [1.4], 10), 'fps': 10, 'loop': True},
            'wipe': {'frames': timed([8, 9, 10, 11], [0.8] * 4, 10), 'fps': 10, 'loop': True},
            'gesture': {'frames': [13, 14, 13], 'fps': 2},
            'rest': {'frames': [12], 'loop': True},
        },
    },
    'halil_anvil': {
        'src': 'actors/halil_hammer.webp', 'grid': (4, 3), 'refH': 300, 'anchor': 'bottom', 'facing': -1,
        'anims': {
            'stand': {'frames': [0], 'loop': True},
            'hammer': {'frames': timed(range(12), [.34, .15, .13, .20, .12, .13, .12, .12, .12, .14, .15, .38], 25), 'fps': 25, 'loop': True},
            'rest': {'frames': [11], 'loop': True},
        },
    },
    'kafana_man': {
        'src': 'sarajevo-v6/kafana-seated-chairs.webp',
        'rects': [[89, 17, 296, 456], [490, 15, 295, 458], [890, 15, 295, 458], [1291, 16, 295, 457]],
        'anchors': [(119, 453), (118.5, 455), (118.5, 455), (118.5, 454)], 'refH': 640,
        'anims': {'stand': {'frames': timed([0, 1, 2, 3], [6, 2, 1.4, 3.4], 5), 'fps': 5, 'loop': True}},
    },
    'kafana_woman': {
        'src': 'sarajevo-v6/kafana-seated-chairs.webp',
        'rects': [[104, 476, 268, 449], [514, 476, 269, 449], [890, 476, 292, 449], [1331, 476, 264, 449]],
        'anchors': [(180.5, 446), (180.5, 446), (204, 446), (178.5, 446)], 'refH': 640,
        'anims': {'stand': {'frames': timed([0, 1, 2, 3], [3.2, 4, 2.4, 3.2], 5), 'fps': 5, 'loop': True}},
    },
    'kafana_rakija': {
        'src': 'sarajevo-v6/kafana-blue-rakija.webp', 'grid': (4, 2), 'refH': 470,
        'anims': {'stand': {'frames': timed(range(8), [5.2, .65, .65, .8, 1, .7, 1.1, 2.7], 10), 'fps': 10, 'loop': True}},
    },
    'sebilj_water': {
        'src': 'sarajevo-v3/sebilj-water.png', 'grid': (4, 2), 'refH': 160, 'anchor': 'bottom', 'anchor_x': 80, 'defringe': False,
        'anims': {'stand': {'frames': list(range(8)), 'fps': 8.3, 'loop': True}},
    },
    'pigeon': {
        'src': 'fx/fx_pigeon_idle.webp', 'grid': (4, 2), 'refH': 60, 'anchor': (64, 118), 'defringe': False,
        'anims': {
            'stand': {'frames': timed(range(8), [2, 1, 1.2, 2, 1, 1.6, 1.2, 2], 10), 'fps': 10, 'loop': True},
        },
    },
    'bird': {
        'src': 'fx/fx_bird.webp', 'grid': (4, 1), 'refH': 40, 'anchor': 'bottom', 'anchor_x': 64, 'defringe': False,
        'anims': {'stand': {'frames': [0, 1, 2, 3], 'fps': 12, 'loop': True}},
    },
    'steam': {
        'src': 'fx/fx_steam_cycle.webp', 'grid': (4, 2), 'refH': 128, 'anchor': 'bottom', 'anchor_x': 64, 'defringe': False, 'clean': False,
        'anims': {'stand': {'frames': list(range(8)), 'fps': 6, 'loop': True}},
    },
    'flame': {
        'src': 'sprites/fire.webp', 'grid': (8, 1), 'refH': 112, 'anchor': 'bottom', 'anchor_x': 56, 'defringe': False,
        'anims': {'stand': {'frames': list(range(8)), 'fps': 10, 'loop': True}},
    },
}

PROPS = {
    # Sarajevo 1996
    'prop_lampe_aus': 'props/prop_lampe_aus.webp',
    'prop_lampe_an': 'props/prop_lampe_an.webp',
    'prop_lupe': 'props/prop_lupe.webp',
    'prop_notes': 'props/prop_sarajevo_notes.webp',
    'prop_dzezva': 'props/prop_sarajevo_dzezva.webp',
    'prop_tasse_voll': 'props/prop_tasse_voll.webp',
    'prop_tasse_leer': 'props/prop_tasse_leer.webp',
    'prop_hausnummer3': 'props/prop_hausnummer3.webp',
    'prop_strassenschild': 'props/prop_strassenschild.webp',
    'prop_rose': 'props/prop_sarajevo_rose.webp',
    'prop_fensterplane': 'props/prop_fensterplane.webp',
    'prop_muelltonne': 'props/prop_muelltonne.webp',
    'prop_kafana_schild': 'props/prop_kafana_schild.webp',
    'prop_tasse_kafana': 'props/prop_tasse_kafana.webp',
    'prop_radio_aus': 'props/prop_radio_aus.webp',
    'prop_radio_an': 'props/prop_radio_an.webp',
    'prop_zeitung': 'props/prop_zeitung.webp',
    'prop_kaffeestand': 'props/prop_kaffeestand.webp',
    'prop_kafana_counter': 'sarajevo-v6/kafana-counter.webp',
    'prop_band': {'src': 'ui/inv.webp', 'crop': [0, 0, 88, 88]},
}

ICONS = {
    'band': {'src': 'ui/inv.webp', 'cell': (4, 4, 0)},
    'lupe': {'src': 'ui/inv.webp', 'cell': (4, 4, 1)},
    'zettel': {'src': 'ui/inv.webp', 'cell': (4, 4, 3)},
    'tasse': {'src': 'ui/inv.webp', 'cell': (4, 4, 11)},
    'dzezva': {'src': 'props/prop_sarajevo_dzezva.webp'},
}
