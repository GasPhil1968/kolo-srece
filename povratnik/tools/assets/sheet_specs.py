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
    # --- Weide 1467 -----------------------------------------------------------------------------
    # The flock's goats: grazing/looking frames (fx_goat_graze, 192 px cells) and the same goat's
    # three-frame walk from sprites/animals.webp (row 0, 140 px cells). refH = standing height with
    # horns in each sheet's pixels, so both sheets render at the same size.
    'goat': {
        'src': 'fx/fx_goat_graze.webp', 'grid': (4, 2), 'refH': 157, 'anchor': (96, 184), 'walkSpeed': 70,
        'extra': {'w': {'src': 'sprites/animals.webp', 'grid': (3, 4)}},
        'anims': {
            'stand': {'frames': [0], 'loop': True},
            'graze': {'frames': timed([0, 1, 2, 3, 2, 3, 2, 4, 5, 6, 7], [4.6, .4, .9, .9, .9, .9, .9, 1.2, 1.4, 1.6, 1.4], 10), 'fps': 10, 'loop': True},
            'eat': {'frames': timed([1, 2, 3, 2, 3], [.4, .6, .6, .6, .6], 10), 'fps': 10, 'loop': True},
            'look': {'frames': [6], 'loop': True},
            'walk': {'frames': ['w0', 'w1', 'w2'], 'fps': 6, 'loop': True, 'refH': 103},
        },
    },
    # Ragusan caravan (props/prop_karawane_*): two rider types, a pack mule, a cloth bale.
    'reiter_a': {
        'src': 'props/prop_karawane_reiter.webp', 'grid': (4, 2), 'refH': 222, 'anchor': 'bottom', 'anchor_x': 128,
        'anims': {'stand': {'frames': [0], 'loop': True}, 'walk': {'frames': [0, 1, 2, 3], 'fps': 4, 'loop': True}},
    },
    'reiter_b': {
        'src': 'props/prop_karawane_reiter.webp', 'grid': (4, 2), 'refH': 222, 'anchor': 'bottom', 'anchor_x': 128,
        'anims': {'stand': {'frames': [4], 'loop': True}, 'walk': {'frames': [4, 5, 6, 7], 'fps': 4, 'loop': True}},
    },
    'maultier': {
        'src': 'props/prop_karawane_maultier.webp', 'grid': (4, 1), 'refH': 145, 'anchor': 'bottom', 'anchor_x': 96,
        'anims': {'stand': {'frames': [0], 'loop': True}, 'walk': {'frames': [0, 1, 2, 3], 'fps': 3.4, 'loop': True}},
    },
    'ballen': {
        'src': 'props/prop_karawane_ballen.webp', 'grid': (1, 1), 'refH': 48, 'anchor': 'bottom', 'defringe': False,
        'anims': {'stand': {'frames': [0], 'loop': True}},
    },
    'smoke': {
        'src': 'fx/fx_smoke_cycle.webp', 'grid': (4, 2), 'refH': 128, 'anchor': 'bottom', 'anchor_x': 64, 'defringe': False, 'clean': False,
        'anims': {'stand': {'frames': list(range(8)), 'fps': 5, 'loop': True}},
    },
    # --- Dorf 1473 ------------------------------------------------------------------------------
    # The Katib sitting down and writing (actors/katib_sit.webp, 4x3 cells of 192x240, native facing
    # left, feet on y=224). refH = his standing height in the same cells (frame 0).
    'katib_sit': {
        'src': 'actors/katib_sit.webp', 'grid': (4, 3), 'refH': 180, 'anchor': (114, 224), 'facing': -1,
        'anims': {
            'stand': {'frames': [0], 'loop': True},
            'sit': {'frames': timed([0, 1, 2, 3, 4, 5], [.18, .24, .28, .28, .30, .32], 25), 'fps': 25},
            'write': {'frames': timed([6, 7, 8, 9, 6, 7, 8, 9, 10, 11], [.34] * 8 + [.7, .6], 25), 'fps': 25, 'loop': True},
            'wait': {'frames': [5], 'loop': True},
            'pause': {'frames': timed([10, 11], [.9, .9], 25), 'fps': 25, 'loop': True},
        },
    },
    # Villagers waiting on the square (props/prop_village_crowd_fear.webp, 2x3 cells of 280x186):
    # the same six people with changing glances, timed as in the original timeline.
    'crowd': {
        'src': 'props/prop_village_crowd_fear.webp', 'grid': (2, 3), 'refH': 172, 'anchor': 'bottom', 'anchor_x': 140, 'clean': False,
        'anims': {'stand': {'frames': timed([0, 1, 0, 2, 5, 0, 3, 5, 0, 4, 5], [4.3, 1.4, 3.1, 2.1, 2.0, 3.7, 1.8, 1.6, 4.9, 1.1, 1.6], 10), 'fps': 10, 'loop': True}},
    },
    # --- 1476 ----------------------------------------------------------------------------------
    # Mijo at 21 (povratnik1476/*): all sheets share 270x240 cells, feet at (135, 214.5), a standing
    # figure 195 px tall (mijo_actions_frames.json referenceHeight), native facing right.
    'mijo1476': {
        'src': 'povratnik1476/mijo.webp', 'grid': (10, 8), 'refH': 195, 'anchor': (135, 214.5), 'walkSpeed': 120,
        'extra': {
            'a': {'src': 'povratnik1476/mijo_actions.png', 'grid': (6, 4), 'anchor': (135, 214.5)},
            'd': {'src': 'povratnik1476/mijo_death.png', 'grid': (4, 2), 'anchor': (135, 214.5)},
            'r': {'src': 'povratnik1476/mijo_recovery.png', 'grid': (4, 1), 'anchor': (135, 214.5)},
        },
        'anims': {
            'stand': {'frames': [12], 'loop': True},
            'walk': {'frames': [0, 1, 2, 3, 4, 5], 'fps': 8, 'loop': True},
            'slow': {'frames': [6, 7, 8, 9, 10, 11], 'fps': 4.5, 'loop': True, 'speed': 62},
            'weary': {'frames': ['a6', 'a7', 'a8', 'a9', 'a10', 'a11'], 'fps': 5.5, 'loop': True, 'speed': 80},
            'helmet': {'frames': [14, 15, 16, 17], 'fps': 4},
            'helmetStand': {'frames': [14], 'loop': True},
            'prone': {'frames': [18], 'loop': True},
            'proneLook': {'frames': [19], 'loop': True},
            'thrust': {'frames': [20, 21, 22, 23, 24], 'fps': 5},
            'retch': {'frames': [31, 32, 33, 34], 'fps': 4},
            'neck': {'frames': [41, 42, 43, 44], 'fps': 4},
            'sit': {'frames': [45, 46], 'fps': 0.6, 'loop': True},
            'rise': {'frames': [47, 48, 49, 50, 51, 52], 'fps': 4},
            'spit': {'frames': [53, 54, 55], 'fps': 3.5},
            'wash': {'frames': [62, 63, 64, 65], 'fps': 3.5},
            'freeze': {'frames': [66, 67], 'fps': 0.8, 'loop': True},
            'half': {'frames': [68, 69, 70], 'fps': 3},
            'listen': {'frames': [71, 72], 'fps': 0.7, 'loop': True},
            'raise': {'frames': [73, 74, 75], 'fps': 3},
            'lower': {'frames': [76, 77, 78, 79], 'fps': 3},
            'drink': {'frames': ['a0', 'a1', 'a2', 'a3', 'a4', 'a5'], 'fps': 1.6},
            'stumble': {'frames': ['a12', 'a13', 'a14', 'a15'], 'fps': 3.5},
            'sitdown': {'frames': ['a16', 'a17', 'a18', 'a19'], 'fps': 3},
            'rest': {'frames': ['a20', 'a21'], 'fps': 0.5, 'loop': True},
            'death': {'frames': ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'], 'fps': 2.5},
            'deathRest': {'frames': ['d7'], 'loop': True},
        },
    },
    # The raider (povratnik1476/attacker.png, 4 cells of 300x270): poised, raised, the horizontal cut,
    # follow-through. Non-graphic: no blood anywhere in the sheet.
    'raider': {
        'src': 'povratnik1476/attacker.png', 'grid': (4, 1), 'refH': 210, 'anchor': (150, 249.5),
        'anims': {'stand': {'frames': [0], 'loop': True}, 'strike': {'frames': [0, 1, 2, 3], 'fps': 3.2}, 'after': {'frames': [3], 'loop': True}},
    },
    # Ivo, a boy from the village (irregular frames, anchors from povratnik-1476-side-poses).
    'ivo': {
        'src': 'povratnik1476/ivo.webp', 'refH': 384,
        'rects': [[107, 15, 298, 355], [574, 15, 333, 355], [1042, 14, 325, 357], [196, 375, 154, 389], [625, 377, 152, 387],
                  [976, 391, 318, 373], [108, 760, 325, 348], [547, 760, 341, 348], [985, 765, 314, 343]],
        'anchors': [(93, 353), (95, 353), (97, 354), (74, 384), (72.5, 382), (148, 368), (163, 343), (185, 343), (154, 338)],
        'anims': {
            'stand': {'frames': [0], 'loop': True, 'refH': 354},
            'point': {'frames': [0, 1, 2], 'fps': 2.5, 'refH': 354},
            'pray': {'frames': [3, 4], 'fps': 1.2, 'loop': True},
            'walk': {'frames': [5, 6, 7, 8], 'fps': 9, 'loop': True},
        },
        'walkSpeed': 260,
    },
    # Stipan, a neighbour fetching water at night (5x4 cells of 320x320, feet at y 286).
    'stipan': {
        'src': 'povratnik1476/stipan.webp', 'grid': (5, 4), 'refH': 240, 'ground': 286,
        'anims': {
            'stand': {'frames': [0], 'loop': True},
            'walk': {'frames': [0, 1, 2, 3, 4, 5], 'fps': 7, 'loop': True},
            'near': {'frames': [6, 7, 8, 9], 'fps': 2.2},
            'recognize': {'frames': [10, 11], 'fps': 1.6},
            'drop': {'frames': [12, 13, 14, 15], 'fps': 4},
            'run': {'frames': [16, 17, 18, 19], 'fps': 10, 'loop': True},
        },
        'walkSpeed': 110,
    },
    # A woman on the path with a bundle on her head (irregular frames of one walk cycle).
    'frau': {
        'src': 'povratnik1476/frau.webp', 'refH': 335,
        'rects': [[31, 3, 194, 405], [314, 9, 206, 399], [576, 6, 203, 402], [841, 4, 214, 404], [1110, 6, 237, 402], [1406, 9, 224, 399],
                  [1670, 9, 241, 399], [23, 409, 218, 397], [310, 410, 184, 396], [577, 412, 198, 394], [852, 412, 224, 394],
                  [1135, 413, 219, 393], [1407, 415, 225, 391], [1663, 416, 221, 390]],
        'anchors': [(104.5, 400), (95.5, 394), (115, 397), (120.5, 399), (124, 397), (96.5, 394), (112.5, 394), (111, 392),
                    (100.5, 391), (108, 389), (109, 389), (100, 388), (97.5, 386), (105.5, 385)],
        'anims': {'stand': {'frames': [4], 'loop': True}, 'walk': {'frames': list(range(14)), 'fps': 7, 'loop': True}},
        'walkSpeed': 70,
    },
    # Dust of riders on the far ridge (two cloud shapes, slowly alternating).
    'staub': {
        'src': 'povratnik1476/staub.webp', 'refH': 232, 'clean': False, 'defringe': False,
        'rects': [[35, 253, 1057, 232], [1137, 297, 978, 194]], 'anchors': [(528.5, 116), (489, 97)],
        'anims': {'stand': {'frames': [0, 1], 'fps': 0.8, 'loop': True}},
    },
    # Water running from the spring spout (povratnik1476/water.png, 4x2 cells of 204x123).
    'quellwasser': {
        'src': 'povratnik1476/water.png', 'grid': (4, 2), 'refH': 123, 'anchor': (0, 0), 'clean': False, 'defringe': False,
        'anims': {'stand': {'frames': list(range(8)), 'fps': 10, 'loop': True}},
    },
    # --- Elf Tage, August 1476 ------------------------------------------------------------------
    # Mijo, same man as in Povratnik; every Elf Tage sheet is normalised to a 230 px standing figure
    # (the v7 work sheet to 245 px, drawn at 0.94 in the old build). Anim facing overrides keep the
    # painted direction where a sheet mixes directions.
    'mijo_et': {
        'src': 'elf-tage/mijo_emotions.png', 'grid': (4, 4), 'refH': 230, 'anchor': (140, 243), 'walkSpeed': 110,
        'extra': {
            'm': {'src': 'elf-tage/mijo_motion.png', 'grid': (4, 4), 'anchor': (180, 273)},
            'r': {'src': 'elf-tage/mijo_rescue.png', 'grid': (4, 4), 'anchor': (250, 254)},
            'k': {'src': 'elf-tage-v5/anim_mijo_kriechen.png', 'grid': (4, 3), 'anchor': (180, 274)},
            'v': {'src': 'elf-tage-v7/anim_mijo.png', 'grid': (4, 6), 'anchor': (150, 301)},
        },
        'anims': {
            'stand': {'frames': [0], 'loop': True},
            'sit': {'frames': [1, 2, 3], 'fps': 4},
            'sitRest': {'frames': [3], 'loop': True},
            'bread': {'frames': timed([4, 5, 6, 7, 6, 7], [.6, .6, .7, .9, .5, .9], 10), 'fps': 10},
            'coverFace': {'frames': timed([8, 9, 10], [.5, .6, 1.4], 10), 'fps': 10},
            'faceRest': {'frames': [10], 'loop': True},
            'sitDoor': {'frames': [11, 12], 'fps': 0.5, 'loop': True},
            'handOpen': {'frames': [13], 'loop': True},
            'handClosed': {'frames': [14], 'loop': True},
            'walk': {'frames': ['m8', 'm9', 'm10', 'm11', 'm12', 'm13'], 'fps': 8, 'loop': True},
            'mow': {'frames': timed(['m0', 'm1', 'm2', 'm3'], [.45, .35, .5, .7], 10), 'fps': 10},
            'carry': {'frames': ['r0', 'r1', 'r2', 'r3'], 'fps': 6, 'loop': True},
            'carryStand': {'frames': ['r0'], 'loop': True},
            'layDown': {'frames': ['r4', 'r5', 'r6', 'r7'], 'fps': 2.2},
            'forehead': {'frames': ['r8', 'r9'], 'fps': 1.2},
            'beam': {'frames': ['r10', 'r11', 'r12'], 'fps': 2.4},
            'crawl': {'frames': ['k' + str(i) for i in range(12)], 'fps': 10, 'loop': True, 'speed': 60},
            'crawlRest': {'frames': ['k0'], 'loop': True},
            'test': {'frames': ['v0', 'v1', 'v2', 'v1', 'v3'], 'fps': 3, 'refH': 245},
            'press': {'frames': ['v4', 'v5', 'v6', 'v7'], 'fps': 3, 'refH': 245},
            'pressHold': {'frames': ['v7'], 'loop': True, 'refH': 245},
            'tie': {'frames': ['v8', 'v9', 'v10', 'v11'], 'fps': 2.5, 'refH': 245},
            'pin': {'frames': ['v12', 'v13', 'v14', 'v15'], 'fps': 2.2, 'refH': 245},
            'lower': {'frames': ['v16', 'v17', 'v18', 'v19'], 'fps': 1.5, 'refH': 245},
            'block': {'frames': ['v20', 'v21', 'v22', 'v23'], 'fps': 2.5, 'refH': 245},
        },
    },
    # The uncle (elf-tage-v7/anim_uncle.png): mowing facing left, noticing, the whetstone offered and
    # withdrawn, walking off to the right, resuming, a frontal wait.
    'uncle_et': {
        'src': 'elf-tage-v7/anim_uncle.png', 'grid': (4, 6), 'refH': 245, 'anchor': (150, 301), 'facing': -1, 'walkSpeed': 90,
        'anims': {
            'stand': {'frames': [21], 'loop': True},
            'mow': {'frames': [0, 1, 2, 3, 4, 3, 2, 1], 'fps': 3.5, 'loop': True},
            'notice': {'frames': [5, 6, 7], 'fps': 2},
            'look': {'frames': [7], 'loop': True},
            'offer': {'frames': timed([6, 9, 10, 11], [.5, 1.6, .7, .9], 10), 'fps': 10},
            'lowered': {'frames': [11], 'loop': True},
            'walk': {'frames': [12, 13, 14, 15], 'fps': 5, 'loop': True, 'facing': 1},
            'resume': {'frames': [16, 17, 18, 19, 20], 'fps': 3},
            'wait': {'frames': [22], 'loop': True},
        },
    },
    'ziegen_et': {
        'src': 'elf-tage-v5/anim_ziegen.png', 'grid': (4, 1), 'refH': 116, 'anchor': (140, 144), 'facing': -1, 'clean': False,
        'anims': {'stand': {'frames': [0], 'loop': True}, 'huddle': {'frames': [0, 1, 2, 3], 'fps': 2.5}, 'huddled': {'frames': [3], 'loop': True}},
    },
    'frau_et': {
        'src': 'elf-tage-v5/anim_frau_gehalten.png', 'grid': (4, 1), 'refH': 232, 'anchor': (150, 244),
        'anims': {'stand': {'frames': [3], 'loop': True}, 'held': {'frames': timed([0, 1, 2, 3, 2, 1], [.5, .6, .9, .6, .4, .5], 10), 'fps': 10, 'loop': True}},
    },
    # The boy (elf-tage/boy.png). Frame 4 is skipped: it would flip his head to the other side.
    'boy_et': {
        'src': 'elf-tage/boy.png', 'grid': (4, 2), 'refH': 230, 'anchor': (140, 164),
        'anims': {
            'stand': {'frames': [2], 'loop': True},
            'under': {'frames': [0], 'loop': True},
            'limp': {'frames': [1], 'loop': True},
            'step': {'frames': [2], 'loop': True},
            'breath': {'frames': timed([2, 3, 2, 3], [.6, .8, .5, .9], 10), 'fps': 10},
            'awaken': {'frames': timed([3, 5, 6], [.6, 1.0, 1.2], 10), 'fps': 10},
            'seated': {'frames': [6], 'loop': True},
        },
    },
    # The father's bare feet and his jug (elf-tage/father_feet_jug.png): never more of him than this.
    'feet_et': {
        'src': 'elf-tage/father_feet_jug.png', 'grid': (4, 1), 'refH': 180, 'anchor': (110, 140), 'clean': False,
        'anims': {'stand': {'frames': [2], 'loop': True}, 'in': {'frames': [0, 1, 2], 'fps': 1.6}, 'away': {'frames': [2, 3], 'fps': 1.4}, 'gone': {'frames': [3], 'loop': True}},
    },
    'fire_et': {
        'src': 'elf-tage/environment_fire_smoke.png', 'grid': (3, 2), 'refH': 248, 'anchor': (160, 248), 'clean': False, 'defringe': False,
        'anims': {'stand': {'frames': [0, 1, 2, 3, 4, 5], 'fps': 9, 'loop': True}},
    },
    # Close-ups of Mijo's palm: the fresh cut, and the same palm that evening (elf-tage/uncle_hands.png 6/7).
    'hand_et': {
        'src': 'elf-tage/uncle_hands.png', 'grid': (4, 2), 'refH': 200, 'anchor': 'bottom', 'anchor_x': 140,
        'anims': {'stand': {'frames': [6], 'loop': True}, 'cut': {'frames': [6], 'loop': True}, 'healed': {'frames': [7], 'loop': True}},
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
    'prop_schublade_offen': 'props/prop_schublade_offen.webp',
    'prop_band': {'src': 'ui/inv.webp', 'crop': [0, 0, 88, 88]},
    # Weide 1467
    'prop_juniper': 'props/prop_juniper.webp',
    'prop_juniper_wool': 'props/prop_juniper_wool.webp',
    'prop_stone_sitters': 'props/prop_stone_sitters.webp',
    'prop_bread': 'props/prop_bread.webp',
    'prop_cheese': 'props/prop_cheese.webp',
    'fx_dust_mote': 'fx/fx_dust_mote.webp',
    # Dorf 1473
    'prop_counting_stall': 'props/prop_counting_stall.webp',
    'prop_stool': 'props/prop_stool.webp',
    'prop_tally13': 'props/prop_tally13.webp',
    'prop_tally9': 'props/prop_tally9.webp',
    'prop_herd_return': 'props/prop_herd_return.webp',
    # 1476
    'prop_fenster_nacht': 'povratnik1476/prop_fenster_nacht.webp',
    'prop_eimer_gefallen': 'povratnik1476/prop_eimer_gefallen.webp',
    # Elf Tage
    'prop_sense': 'elf-tage/prop_sense.png',
    'prop_tuch_krug_brot': 'elf-tage/prop_tuch_krug_brot.png',
    'prop_tuch_krug': 'elf-tage/prop_tuch_krug.png',
    # The jug alone, cut along its outline from the same painting (it stays when the cloth is taken).
    'prop_krug': {'src': 'elf-tage/prop_tuch_krug.png', 'poly': [[19, 9], [27, 3], [36, 0], [64, 0], [66, 6], [61, 12], [69, 22], [72, 36], [70, 46], [66, 53], [58, 57], [44, 58], [35, 56], [29, 51], [26, 43], [25, 31], [21, 25], [19, 17]]},
    # Rack states 0-5 and 7 (6, the rack lying flat on the wet floor, is not a state of the puzzle).
    **{f'prop_raufe_{i}': {'src': 'elf-tage-v7/raufe-zustaende.png', 'crop': [(i % 4) * 384, (i // 4) * 256, 384, 256]} for i in (0, 1, 2, 3, 4, 5, 7)},
    'prop_brett': {'clean': True, 'src': 'elf-tage-v7/raufe-zustaende.png', 'crop': [0, 512, 384, 256]},
    'prop_klotz': {'clean': True, 'src': 'elf-tage-v7/raufe-zustaende.png', 'crop': [384, 512, 384, 256]},
    'prop_seil': {'clean': True, 'src': 'elf-tage-v7/raufe-zustaende.png', 'crop': [768, 512, 384, 256]},
    'prop_wetzstein': {'clean': True, 'src': 'elf-tage-v7/raufe-zustaende.png', 'crop': [384, 768, 384, 256]},
    'prop_schwad': {'clean': True, 'src': 'elf-tage-v7/raufe-zustaende.png', 'crop': [768, 768, 384, 256]},
    'prop_balken': {'clean': True, 'src': 'puzzles-v6/props-states.png', 'crop': [256, 0, 256, 256]},
}

ICONS = {
    'band': {'src': 'ui/inv.webp', 'cell': (4, 4, 0)},
    'lupe': {'src': 'ui/inv.webp', 'cell': (4, 4, 1)},
    'zettel': {'src': 'ui/inv.webp', 'cell': (4, 4, 3)},
    'tasse': {'src': 'ui/inv.webp', 'cell': (4, 4, 11)},
    'dzezva': {'src': 'props/prop_sarajevo_dzezva.webp'},
    'wacholder': {'src': 'ui/inv.webp', 'cell': (4, 4, 9)},
    'kerbhoelzer': {'src': 'ui/inv.webp', 'cell': (4, 4, 13)},
    'kerbholz': {'src': 'props/prop_tally13.webp'},
    'krug': {'src': 'puzzles-v6/items-rescue.png', 'cell': (4, 4, 9)},
    'streifen': {'src': 'puzzles-v6/items-rescue.png', 'cell': (4, 4, 12)},
    'krug_schlinge': {'src': 'puzzles-v6/travel-tools.png', 'cell': (4, 4, 3)},
    'sense': {'src': 'elf-tage/prop_sense.png'},
    'brett': {'src': 'elf-tage-v7/raufe-zustaende.png', 'cell': (4, 4, 8)},
    'klotz': {'src': 'elf-tage-v7/raufe-zustaende.png', 'cell': (4, 4, 9)},
    'seil': {'src': 'elf-tage-v7/raufe-zustaende.png', 'cell': (4, 4, 10)},
    'wetzstein': {'src': 'elf-tage-v7/raufe-zustaende.png', 'cell': (4, 4, 13)},
    'tuch': {'src': 'puzzles-v6/items-rescue.png', 'cell': (4, 4, 8)},
    'tuch_nass': {'src': 'puzzles-v6/items-rescue.png', 'cell': (4, 4, 10)},
}
