"""Build the NIGHT LATCH extras: inventory icon atlas, city map, title screen + logo and
Pike's contact sheet.

    python3 art/build_extras.py            # everything
    python3 art/build_extras.py items map  # a subset (items, map, title, logo, contact)

Outputs (public/assets/):
    ui/items.png + ui/items.json   20x20 icons, Phaser 3 JSON-hash atlas (+ 'none' frame)
    ui/map.png                     320x180 city map of Brackwater (travel screen)
    ui/title.png                   320x180 title screen background
    ui/title_logo.png              'NIGHT LATCH' logo (transparent)
    docs/contact_sheet.png         Pike's contact strip (4 frames)
"""
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import extras_common  # noqa: E402,F401  (registers the e_ ramps)


def build_items():
    import extras_icons
    img, frames, _names = extras_icons.build_atlas()
    return f'{len(frames)} frames, atlas {img.shape[1]}x{img.shape[0]}'


def build_map():
    import extras_map
    extras_map.build()
    return 'ui/map.png'


def build_title():
    import extras_title
    extras_title.build_title()
    return 'ui/title.png'


def build_logo():
    import extras_title
    extras_title.build_logo()
    return 'ui/title_logo.png'


def build_contact():
    import extras_photo
    extras_photo.build()
    return 'docs/contact_sheet.png'


STEPS = {'items': build_items, 'map': build_map, 'title': build_title, 'logo': build_logo,
         'contact': build_contact}


def main(only=None):
    for name, fn in STEPS.items():
        if only and name not in only:
            continue
        t = time.time()
        info = fn()
        print(f'extras {name:8s} {time.time() - t:5.2f}s  {info}')


if __name__ == '__main__':
    main(sys.argv[1:] or None)
