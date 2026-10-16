"""Backgrounds and full-frame images -> WebP at native resolution (no resampling).

Keys are the names the game uses; values are the ACTIVE source files of the old project
(see docs/ASSETS.md for how each variant was chosen).
"""
from __future__ import annotations

import json
import os
import shutil
import sys

from PIL import Image

from common import GENERATED, PUBLIC, ensure_dir, ref, save_webp

BACKGROUNDS = {
    # Sarajevo 1996
    'bg_prolog': 'sarajevo-v3/prolog.webp',
    'bg_landing': 'sarajevo-v4/landing.webp',
    'bg_gasse': 'sarajevo-v3/gasse.webp',
    'bg_kafana': 'sarajevo-v6/kafana-room.webp',
    'bg_sebilj': 'bg/bg_sebilj_no_pigeons.webp',
    # 1467 / 1473
    'bg_weide': 'bg/bg_weide.webp',
    'bg_kuca': 'bg/bg_kuca.webp',
    'bg_taltest': 'bg/bg_taltest.webp',
    'bg_dorfabend': 'bg/bg_dorfabend.webp',
    'bg_dorfplatz': 'bg/bg_dorfplatz.webp',
    # 1476
    'bg_pass_senke_vorher': 'povratnik1476/bg_pass_senke_vorher.webp',
    'bg_pass_senke': 'povratnik1476/bg_pass_senke.webp',
    'bg_pass_grab': 'povratnik1476/bg_pass_grab.webp',
    'bg_rueckweg': 'povratnik1476/bg_rueckweg.webp',
    'bg_dorf_1476_nacht': 'povratnik1476/bg_dorf_1476_nacht.webp',
    # Elf Tage (v5 set is the active one)
    'bg_et_stall_nacht': 'elf-tage-v5/backgrounds/bg_stall_nacht.png',
    'bg_et_stall_tag': 'elf-tage-v5/backgrounds/bg_stall_tag.png',
    'bg_et_hof': 'elf-tage-v5/backgrounds/bg_hof.png',
    'bg_et_feld': 'elf-tage-v5/backgrounds/bg_feld.png',
    'bg_et_feld_gemaeht': 'elf-tage-v5/backgrounds/bg_feld_gemaeht.png',
    'bg_et_kirche': 'elf-tage-v5/backgrounds/bg_kirchstufe.png',
    'bg_et_kirche_nacht': 'elf-tage-v5/backgrounds/bg_kirchstufe_nacht.png',
    'bg_et_brand': 'elf-tage-v5/backgrounds/bg_haus_brand.png',
    'bg_et_innen': 'elf-tage-v5/backgrounds/bg_rauch_innen.png',
    # Ancona
    'bg_hafen': 'ancona-v2/port-clean.webp',
    'bg_lagerhaus': 'bg/bg_lagerhaus.webp',
    'bg_lagerhaus_zerstoert': 'ancona-v6/bg_lagerhaus_zerstoert.png',
    # Herberge / Hof
    'bg_gaststube': 'bg/bg_gaststube_clean.webp',
    'bg_hof': 'bg/bg_hof.webp',
    # 1878
    'bg_enge': 'bg/bg_enge.webp',
    'bg_kolonnespitze': 'bg/bg_kolonnespitze.webp',
    'bg_feldzelt': 'bg/bg_feldzelt.webp',
    'bg_lager': 'bg/bg_lager.webp',
    'bg_stabszelt': 'bg/bg_stabszelt_scaled.webp',
    'bg_hochzeit': 'bg/bg_hochzeit.webp',
    'bg_dorfgasse': 'wedding-polish/dorfgasse-1878.webp',
    'bg_steinblock78': 'village-polish/bg_steinblock78_1878.webp',
    'bg_fremdesdorf': 'village-polish/bg_fremdesdorf_1878.webp',
    'bg_ending': 'bg/bg_ending.webp',
}

# Full-screen images for chapter cards and menus (960 x 600) and the logo.
SCREENS = {
    'intro_opening': 'intros/intro_opening.webp',
    'intro_prolog': 'intros/intro_prolog.webp',
    'intro_kap1': 'intros/intro_kap1.webp',
    'intro_kap2': 'intros/intro_kap2.webp',
    'intro_zaesur': 'intros/intro_zaesur.webp',
    'intro_akt2': 'intros/intro_akt2.webp',
    'intro_hof': 'intros/intro_hof.webp',
    'intro_kolonne': 'intros/intro_kolonne.webp',
    'intro_lager': 'intros/intro_lager.webp',
    'intro_hochzeit': 'intros/intro_hochzeit.webp',
    'intro_fremdesdorf': 'intros/intro_fremdesdorf.webp',
    'menu_keyart': 'menu/menu-keyart.webp',
    'logo': 'intros/cine_title.webp',
}


def main() -> None:
    only = set(sys.argv[1:])
    meta = {}
    for group, table, sub in (('bg', BACKGROUNDS, 'bg'), ('screen', SCREENS, 'screens')):
        for key, src in table.items():
            if only and key not in only:
                continue
            im = Image.open(ref(src))
            out = os.path.join(PUBLIC, sub, f'{key}.webp')
            if src.endswith('.webp'):
                # Already WebP: copy the original bytes (no generation loss).
                ensure_dir(os.path.dirname(out))
                shutil.copyfile(ref(src), out)
            else:
                im = im.convert('RGBA') if 'A' in im.getbands() else im.convert('RGB')
                save_webp(im, out, quality=90)
            meta[key] = {'file': f'{sub}/{key}.webp', 'w': im.width, 'h': im.height, 'source': src}
            print(f'{key:24s} {im.width}x{im.height} {os.path.getsize(out)//1024} KiB  <- {src}')
    ensure_dir(GENERATED)
    path = os.path.join(GENERATED, 'images.json')
    old = json.load(open(path)) if os.path.exists(path) else {}
    old.update(meta)
    with open(path, 'w') as fh:
        json.dump(old, fh, indent=1, sort_keys=True)


if __name__ == '__main__':
    main()
