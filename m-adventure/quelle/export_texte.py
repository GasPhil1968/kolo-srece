# -*- coding: utf-8 -*-
"""Zieht jeden angezeigten deutschen Text aus dem Build in eine bearbeitbare Datei.
   Gegenstueck: import_texte.py spielt die bearbeitete Datei zurueck."""
import io, re, json, os, sys

BUILD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build')

DATEIEN = [
  ('98_vorspann.js',    'Vorspann'),
  ('94_intro_menue.js', 'Hauptmenue'),
  ('93_karten.js',      'Kapitelkarten'),
  ('40_rooms.js',       'Raumtitel'),
  ('41_rooms_kap1.js',  'Raumtitel Kapitel 1'),
  ('60_state.js',       'Gegenstaende'),
  ('90_interaktion.js', 'Verben und Standardantworten'),
  ('91_ui.js',          'Bedienleiste'),
  ('70_obj_rahmen.js',  'Prolog - Terrasse und Garage'),
  ('73_obj_kap1neu.js', 'Kapitel 1 - Weide, Haus, Dorfweg'),
  ('71_obj_kap123.js',  'Kapitel 1 Hof und Bruecke / Kapitel 2 / Kapitel 3'),
  ('72_obj_kap4567.js', 'Kapitel 4 bis 7'),
  ('82_szenen2.js',     'Schalter, Telefon, Kombinationen'),
  ('81_dialoge.js',     'Dialoge'),
  ('80_kapitel.js',     'Kapitelwechsel und Szenen'),
  ('97_cines.js',       'Zwischensequenzen'),
]

SPRECHER = {
  'PL':'M.', 'NARR':'Erzaehler', 'null':'Erzaehler', 'A':'M.', 'a':'M.',
  'actor':'Figur', 'reihe':'Figur',
  'NPC.luka':'Luka', 'NPC.lena':'L.', 'NPC.otac':'Vater', 'NPC.majka':'Mutter',
  'NPC.andrin':'Der Fremde', 'NPC.lehrer':'Der Lehrer', 'NPC.tiko':'Josip Broz Tiko',
  'NPC.zdravko':'Narednik Zdravko', 'NPC.admiral':'Admiral Pivopija',
  'NPC.safet':'Safet Susovic', 'NPC.yilmaz':'Yilmaz', 'NPC.krause':'Meister Krause',
  'NPC.sommer':'Frau Sommer', 'NPC.jure':'Jure', 'NPC.dedo':'Dedo',
  'NPC.mann':'Der Mann', 'NPC.gestalt':'Die Gestalt', 'NPC.beamter':'Der Beamte',
}

MUSTER = [
  (r"say:\s*\[\s*([A-Za-z_$][\w.$]*)\s*,\s*",  'Replik',   1),
  (r"say\(\s*([A-Za-z_$][\w.$]*)\s*,\s*",      'Replik',   1),
  (r"\bt:\s*",        'Antwort',      0),
  (r"\bname:\s*",     'Bezeichnung',  0),
  (r"\btitle:\s*",    'Raumtitel',    0),
  (r"\blook:\s*",     'Beschreibung', 0),
  (r"\bdesc:\s*",     'Gegenstand',   0),
  (r"\bzitat:\s*",    'Zitat',        0),
  (r"\btext:\s*",     'Bildtext',     0),
  (r"\bansehen:\s*",  'Ansehen',      0),
  (r"\bnehmen:\s*",   'Nehmen',       0),
  (r"\bbenutzen:\s*", 'Benutzen',     0),
  (r"\breden:\s*",    'Reden',        0),
  (r"\bgeben:\s*",    'Geben',        0),
  (r"schauen\(\s*'[^']*'\s*,\s*", 'Erster Blick', 0),
  (r"flashNote\(\s*", 'Meldung',      0),
  (r"\blabel:\s*",    'Menuezeile',   0),
]

AUS = re.compile(r"^(#[0-9a-fA-F]{3,8}|rgba?\(.*|center|left|right|bold |italic |lighter|"
                 r"source-over|saturation|overlay|pixelated|de|hr|en|pixel|gouache|tusche|"
                 r"riso|async|ok|base|alt|\s*)$")

def einen_string(t, i):
    if i >= len(t) or t[i] != "'": return None, i + 1
    i += 1; out = []
    while i < len(t):
        c = t[i]
        if c == '\\':
            n = t[i+1] if i+1 < len(t) else ''
            if n == 'u':
                try: out.append(chr(int(t[i+2:i+6], 16))); i += 6; continue
                except Exception: pass
            out.append({'n':'\n','t':'\t',"'":"'",'\\':'\\'}.get(n, n)); i += 2; continue
        if c == "'": return ''.join(out), i + 1
        out.append(c); i += 1
    return ''.join(out), i

def strings_ab(t, pos):
    i = pos
    while i < len(t) and t[i] in ' \t\r\n': i += 1
    if i >= len(t): return [], i
    tr = []
    if t[i] == '[':
        i += 1; tiefe = 1
        while i < len(t) and tiefe > 0:
            c = t[i]
            if   c == '[': tiefe += 1; i += 1
            elif c == ']': tiefe -= 1; i += 1
            elif c == "'":
                s, i2 = einen_string(t, i)
                if s is not None: tr.append((s, i, i2))
                i = i2
            elif c in '({': break
            else: i += 1
        return tr, i
    if t[i] == "'":
        s, i2 = einen_string(t, i)
        if s is not None: tr.append((s, i, i2))
        return tr, i2
    return [], i

# Fundort: naechstes vorangehendes  id:'...'  oder  function name
RE_INTERN = re.compile(r"(draw\s*:\s*function|factor\s*:|clip\s*:)")
def ist_intern(quelle, pos):
    a = quelle.rfind('{', 0, pos); b = quelle.find('}', pos)
    if a < 0 or b < 0: return False
    return bool(RE_INTERN.search(quelle[a:b]))

RE_ID   = re.compile(r"\bid:\s*'([^']+)'")
RE_FN   = re.compile(r"\bfunction\s+([A-Za-z_$][\w$]*)\s*\(")
RE_NODE = re.compile(r"^\s*([a-z][\w]*)\s*:\s*function", re.M)
VERBEN  = {'ansehen','nehmen','benutzen','reden','geben','oeffnen','ziehen','druecken',
           'schauen','draw','update','init','enter','leave','tick','npcs','marks'}

def fundort(quelle, pos):
    besser, wert = -1, None
    for rx in (RE_ID, RE_FN, RE_NODE):
        for m in rx.finditer(quelle, 0, pos):
            if m.group(1) in VERBEN: continue
            if m.start() > besser: besser, wert = m.start(), m.group(1)
    return wert or '-'

eintraege = []
for datei, abschnitt in DATEIEN:
    p = os.path.join(BUILD, datei)
    if not os.path.exists(p): continue
    quelle = io.open(p, encoding='utf-8').read()
    roh = []
    for muster, art, hat_sprecher in MUSTER:
        for m in re.finditer(muster, quelle):
            spr = SPRECHER.get(m.group(1), m.group(1)) if hat_sprecher else None
            texte, ende = strings_ab(quelle, m.end())
            if art == 'Erster Blick':
                r = re.match(r"\s*,\s*", quelle[ende:ende+400])
                if r:
                    s2, e2 = einen_string(quelle, ende + r.end())
                    if s2: texte.append((s2, ende + r.end(), e2))
            for s, spos, epos in texte:
                if not s or AUS.match(s) or len(s) < 2: continue
                if art == 'Bezeichnung' and ist_intern(quelle, spos): continue
                roh.append({'pos':spos, 'ende':epos, 'art':art, 'sprecher':spr, 'text':s})
    gesehen = set(); roh.sort(key=lambda e: e['pos'])
    for e in roh:
        if e['pos'] in gesehen: continue
        gesehen.add(e['pos'])
        e['datei'] = datei; e['abschnitt'] = abschnitt
        e['zeile'] = quelle.count('\n', 0, e['pos']) + 1
        e['ort'] = fundort(quelle, e['pos'])
        eintraege.append(e)

for i, e in enumerate(eintraege, 1): e['id'] = 'T%04d' % i

json.dump(eintraege, io.open(os.path.join(os.path.dirname(BUILD), 'texte_index.json'),
          'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('Eintraege:', len(eintraege))
