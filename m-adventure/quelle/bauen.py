# -*- coding: utf-8 -*-
"""Baut most.html und most-artifact.html aus build/ und der festen HTML-Huelle.
   Baut nie auf dem Ergebnis des letzten Laufs auf -- genau daran ist der
   Build schon einmal gescheitert: er hat sich selbst ins Skript-Tag gelegt."""
import base64, io, json, os, sys

H = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(H, 'build')
A = os.path.join(H, 'assets')

# Rastergrafiken bleiben Teil der einen spielbaren HTML-Datei. Die Quellen
# liegen separat im Projekt, der Build bettet sie als Data-URLs ein.
ASSETS = {
    'terrasse_podaca_2018': 'terrasse_podaca_2018.png',
    'rosko_polje_1953': 'rosko_polje_1953.png',
    'weide_rosko_1953': 'weide_rosko_1953.png',
    'kuca_1953': 'kuca_1953.png',
    'bruecke_1953': 'bruecke_1953.png',
    'mostar_1955': 'mostar_1955.png',
    'kaserne_1960': 'kaserne_1960.png',
    'sarajevo_1970': 'sarajevo_1970.png',
    'm_alt_sheet': 'm_alt_sheet_game.png',
    'm_kind_sheet': 'm_kind_sheet_game.png',
    'luka_sheet': 'luka_sheet_game.png',
    'lena_sheet': 'lena_sheet_game.png',
    'lena_alt_sheet': 'lena_alt_sheet_game.png',
    'dedo_sheet': 'dedo_sheet_game.png',
    'otac_sitz_sheet': 'otac_sheet_game.png',
    'otac_stand_sheet': 'otac_stand_sheet_game.png',
    'majka_sheet': 'majka_sheet_game.png',
    'petar_sheet': 'petar_sheet_game.png',
    'andrin_sheet': 'andrin_sheet_game.png',
    'm_schueler_sheet': 'm_schueler_sheet_game.png',
    'm_marine_sheet': 'm_marine_sheet_game.png',
    'm_sarajevo_sheet': 'm_sarajevo_sheet_game.png',
    'lehrer_sheet': 'lehrer_sheet_game.png',
    'tiko_sheet': 'tiko_sheet_game.png',
    'zdravko_sheet': 'zdravko_sheet_game.png',
    'admiral_sheet': 'admiral_sheet_game.png',
    'safet_sheet': 'safet_sheet_game.png',
    'm_alt_portrait': 'm_alt_portrait.png',
}

TEILE = """10_head 20_core 25_stil 26_bilder 27_vorlage 28_sprache 29_hr 29b_en 30_pal
40_rooms 41_rooms_kap1 50_props 51_bg_podaca 52_bg_jugend 53_bg_spaeter 55_bg_kap1
54_drawroom 60_state 70_obj_rahmen 71_obj_kap123 72_obj_kap4567 73_obj_kap1neu
75_seq 80_kapitel 81_dialoge 82_szenen2 90_interaktion 91_ui 92_dlgui 96_musik
97_cines 98_vorspann 93_karten 94_intro_menue 95_loop""".split()

fehlend = [t for t in TEILE if not os.path.exists(os.path.join(B, t + '.js'))]
if fehlend:
    sys.exit('ABBRUCH -- diese Bausteine fehlen: ' + ', '.join(fehlend))

eingebettet = {}
for name, datei in ASSETS.items():
    pfad = os.path.join(A, datei)
    if not os.path.exists(pfad):
        sys.exit('ABBRUCH -- Asset fehlt: ' + datei)
    with open(pfad, 'rb') as f:
        eingebettet[name] = 'data:image/png;base64,' + base64.b64encode(f.read()).decode('ascii')

stuecke = ['var EINGEBETTETE_BILDER = ' + json.dumps(eingebettet, separators=(',', ':')) + ';']
for t in TEILE:
    q = io.open(os.path.join(B, t + '.js'), encoding='utf-8').read()
    if '<!DOCTYPE' in q or '</script>' in q:
        sys.exit('ABBRUCH -- %s.js enthaelt HTML. Der Baustein ist kaputt.' % t)
    stuecke.append(q)
kern = '\n'.join(stuecke)

kopf = io.open(os.path.join(H, 'huelle_kopf.html'), encoding='utf-8').read()
fuss = io.open(os.path.join(H, 'huelle_fuss.html'), encoding='utf-8').read()

ziel = os.path.join(H, 'most.html')
io.open(ziel, 'w', encoding='utf-8').write(kopf + kern + fuss)
print('most.html          %d KB' % (os.path.getsize(ziel) / 1024))

# Fuer die Artefakt-Seite faellt die Huelle weg: die wird beim Veroeffentlichen
# gestellt. Nur das charset muss mit, sonst zerbroeseln die Umlaute.
art = os.path.join(H, 'most-artifact.html')
kopf_art = kopf[kopf.index('<meta charset'):]
kopf_art = kopf_art[:kopf_art.index('<script>') + len('<script>')]
io.open(art, 'w', encoding='utf-8').write(kopf_art + kern + fuss)
print('most-artifact.html %d KB' % (os.path.getsize(art) / 1024))
