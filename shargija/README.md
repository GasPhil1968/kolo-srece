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

Prüfung: `node tools/shargija-check.js <ausgabeordner> [BxH]` öffnet das Spiel in Chromium,
besucht alle Menüs, startet ein Lied und meldet Fehler und fehlende Bilder.
