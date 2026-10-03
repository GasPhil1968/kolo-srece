# Šargija — Žica i trzalica (mit Engine-Grafiken v2)

`index.html` ist das Spiel aus `shargija-netlify-neu.zip`. Der Grafik-Adapter aus
`shargija-engine-v2/engine-adapter.js` steckt innerhalb der IIFE direkt vor
`prefsLoad(); applyLang();`. `assets/` enthält die 64 PNGs und `manifest.json` der Lieferung.

Abweichungen von der Lieferung:
- `assets/ui_panel_normal.png` war abgeschnitten (nur die oberen 218 von 800 Zeilen enthielten Daten);
  neu erzeugt aus `source-art/masters/ui_screen_panel.png`, und zwar mit denselben Schritten wie
  `tools/build-assets.cjs` (bereinigen, zuschneiden, auf 1600×800 skalieren).
- Ergänzende CSS-Regeln am Ende des Adapter-Stylesheets: Der Rahmen liegt auf `#veil` und bekommt
  Innenabstand; die Song-Karten-Buttons nutzen die Control-Grafik; die Hintergrundgröße ausgewählter
  Chips ist fixiert; das Kartenraster schrumpft nicht mehr unter seinen Inhalt, damit `fitVeil()`
  korrekt verkleinert. Ohne diese Regel verdecken die Karten bei 667×375 den BACK-Button
  (betrifft auch das Original).

- Notenbahn: Rauten, offene Ringe und Vorschlagsnoten werden mit den `note_*`-PNGs gezeichnet
  (Rückfall auf die Vektorform, solange ein Bild nicht geladen ist); Bahn, Trefferlinie,
  Hochformat-Hinweis und theme-color sind auf die neue Palette umgefärbt.
- `_headers`: Cache-Regeln für `preview.jpg` und `/assets/*`.

Für Netlify (shargija.netlify.app) reicht der Inhalt dieses Ordners ohne `README.md`; nicht geladen
werden `environment_full`, `dancer_female`, `dancer_male`, `fx_*`, `instrument_peg`,
`instrument_head_base_*` und `note_pointer_*`.

- Saitenklang (AudioWorklet): Schnarren am Bund, das jede Periode neu einsetzt, solange die Saite laut
  schwingt; Anschlagsbiegung (kräftige Schläge beginnen bis ~8 Cent zu hoch und sinken in ~0,15 s);
  Gleiten beim Umgreifen auf der klingenden Saite (22 ms); schnelles Tremolo dämpft die Melodiesaite
  weniger. Regler in `SOUND` (`buzz`, `bend`, `glide`, `trem`; 0 = aus, 1 = abgestimmt); mit `#dev`
  im Browser über `SARGIJA.SOUND` live änderbar.

- Lieder: die Zeilen schließen ohne die frühere Pause von 1,6 Schlägen (und 2,2 zwischen den Runden)
  im Takt aneinander an. Krajiško kolo (230 → 192 ms) und Brzo kolo (220 → 183 ms) sind getanzte Lieder
  (`dance`, `accel`): sie ziehen über das Stück gleichmäßig an; in der Demo füllen leichte Schläge die
  Pausen. Taktraster, Tänzer und Scheinwerfer folgen dem aktuellen Tempo (`beatAt`); zum Sevdah wiegen
  die Tänzer nur.

- Kein Musiker hinter dem Instrument (`buildPlayer` bleibt leer, die Hände tragen ihre Ärmel selbst);
  Sprache heißt „BKS“ statt „SRPSKI“; Einstellungen mit größerer Schrift, schlichten, kontrastreichen
  Chips und Sprache in der rechten Spalte.

- Greifhand in zwei Lagen (`hand_fret_back` hinter dem Hals, `hand_fret_front` davor), Einstellungen
  mit 20-px-Namen und 13–14-px-Untertiteln, Intro/Bećar nebeneinander, größerer ZURÜCK-Knopf.

Prüfung: `node tools/shargija-check.js <ausgabeordner> [BxH]` öffnet das Spiel in Chromium,
besucht alle Menüs, startet ein Lied und meldet Fehler und fehlende Bilder.

Klang: `node tools/shargija-render.js <datei.wav> [0|1|2] [html]` rendert eine feste Testphrase
(Melodie, Tremolo, Legato, harte Schläge) offline; `SOUND='{"buzz":0}'` setzt Regler für den Lauf.
