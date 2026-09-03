# -*- coding: utf-8 -*-
"""Spielt eine bearbeitete M-Spieltexte-DE.txt in den Build zurueck.
   Aufruf:  python3 import_texte.py <datei.txt> [--probe]
   --probe schreibt nichts, sondern zeigt nur, was sich aendern wuerde."""
import io, json, os, re, sys, shutil

H = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(H, 'build')
E = json.load(io.open(os.path.join(H, 'texte_index.json'), encoding='utf-8'))
NACH_ID = {e['id']: e for e in E}

quelle_txt = sys.argv[1] if len(sys.argv) > 1 else os.path.join(H, 'M-Spieltexte-DE.txt')
probe = '--probe' in sys.argv

RE_ZEILE = re.compile(r"^\[(T\d{4}|NEU)\s*·[^\]]*\]\s?(.*)$")

neu, unbekannt, weg, zusatz = {}, [], [], []
for nr, zeile in enumerate(io.open(quelle_txt, encoding='utf-8'), 1):
    zeile = zeile.rstrip('\n').rstrip('\r')
    m = RE_ZEILE.match(zeile)
    if not m:
        if zeile.startswith('['): unbekannt.append((nr, zeile[:70]))
        continue
    kennung, text = m.group(1), m.group(2)
    if kennung == 'NEU': zusatz.append((nr, text)); continue
    if kennung not in NACH_ID: unbekannt.append((nr, kennung)); continue
    if text.strip() == '[WEG]': weg.append(kennung); continue
    neu[kennung] = text.replace(' ↵ ', '\n').replace('↵', '\n')

geaendert = {k: v for k, v in neu.items() if v != NACH_ID[k]['text']}
fehlt = [e['id'] for e in E if e['id'] not in neu and e['id'] not in weg]

print('Gelesen:      %d Kennungen' % len(neu))
print('Geaendert:    %d' % len(geaendert))
print('Zum Entfernen:%d' % len(weg))
print('Neu markiert: %d' % len(zusatz))
print('Nicht in der Datei: %d' % len(fehlt))
if unbekannt:
    print('\nUnlesbare Zeilen (%d):' % len(unbekannt))
    for nr, z in unbekannt[:20]: print('   Zeile %d: %s' % (nr, z))
if weg:  print('\n[WEG] markiert:', ', '.join(weg))
if zusatz:
    print('\n[NEU] markiert:')
    for nr, t in zusatz: print('   Zeile %d: %s' % (nr, t[:80]))

if geaendert:
    print('\n%s' % ('─'*70))
    for k in sorted(geaendert)[:400]:
        print('  %s  ALT: %s' % (k, NACH_ID[k]['text'][:100]))
        print('  %s  NEU: %s' % (' '*len(k), geaendert[k][:100]))

if probe or not geaendert:
    print('\n(nichts geschrieben)'); sys.exit(0)

def escape(s):
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')

# Pro Datei von hinten nach vorn ersetzen, damit die Spannen gueltig bleiben.
proDatei = {}
for k, v in geaendert.items():
    e = NACH_ID[k]; proDatei.setdefault(e['datei'], []).append((e, v))

sicherung = os.path.join(H, 'build_sicherung')
if os.path.exists(sicherung): shutil.rmtree(sicherung)
shutil.copytree(B, sicherung)

for datei, liste in proDatei.items():
    p = os.path.join(B, datei); q = io.open(p, encoding='utf-8').read()
    for e, v in sorted(liste, key=lambda x: -x[0]['pos']):
        q = q[:e['pos']] + "'" + escape(v) + "'" + q[e['ende']:]
    io.open(p, 'w', encoding='utf-8').write(q)
    print('geschrieben: %s (%d Stellen)' % (datei, len(liste)))

# Kroatisch und Englisch haengen am deutschen Satz -- Schluessel mitziehen.
umbenannt = 0
for tab in ('29_hr.js', '29b_en.js'):
    p = os.path.join(B, tab)
    if not os.path.exists(p): continue
    q = io.open(p, encoding='utf-8').read(); vorher = q
    for k, v in geaendert.items():
        alt = NACH_ID[k]['text']
        muster = "'" + escape(alt) + "':"
        if muster in q:
            q = q.replace(muster, "'" + escape(v) + "':"); umbenannt += 1
    if q != vorher: io.open(p, 'w', encoding='utf-8').write(q)
print('Uebersetzungsschluessel mitgezogen: %d' % umbenannt)
print('\nSicherung des vorherigen Standes: build_sicherung/')
print('Jetzt neu bauen.')
