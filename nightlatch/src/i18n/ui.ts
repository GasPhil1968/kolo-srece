// German for the interface and the engine's own lines (content text lives in de.json).
// Templates use {0}, {1}… placeholders and are filled by f().
export const UI_DE: Record<string, string> = {
  // title & pause menu
  'Continue': 'Weiterspielen', 'New game': 'Neues Spiel', 'Load game': 'Spiel laden', 'Save game': 'Spiel speichern',
  'Settings': 'Einstellungen', 'Credits': 'Mitwirkende', 'PAUSED': 'PAUSE', 'Resume': 'Weiter', 'Quit to title': 'Zum Titelbild',
  'Tab/Space: show hotspots  N: notebook  M: map  H: hint': 'Tab/Leertaste: Stellen zeigen  N: Notizbuch  M: Karte  H: Tipp',
  'Tap and hold: look at  Two-finger tap: show hotspots': 'Lang drücken: ansehen  Zwei Finger tippen: Stellen zeigen',
  'SAVE GAME': 'SPIEL SPEICHERN', 'LOAD GAME': 'SPIEL LADEN', 'That save is damaged.': 'Dieser Spielstand ist beschädigt.',
  'Click a slot to save. Autosaves happen at milestones.': 'Platz wählen zum Speichern. Autosave bei jedem Meilenstein.',
  'Delete...': 'Löschen...', 'Back': 'Zurück', 'DELETE A SAVE': 'SPIELSTAND LÖSCHEN', 'Delete autosave': 'Autosave löschen',
  'Delete slot {0}': 'Platz {0} löschen', 'Auto': 'Auto', 'Slot {0}': 'Platz {0}', 'empty': 'leer',
  'SETTINGS': 'EINSTELLUNGEN', 'Music': 'Musik', 'Sound': 'Geräusche', 'Text speed': 'Textgeschwindigkeit',
  'Pixel-perfect': 'Pixelgenau', 'Hints': 'Tipps', 'Language': 'Sprache', 'Slow': 'Langsam', 'Normal': 'Normal', 'Fast': 'Schnell',
  'On': 'An', 'Off': 'Aus', 'Fullscreen': 'Vollbild', 'Leave fullscreen': 'Vollbild beenden',
  'Return to the title screen?': 'Zurück zum Titelbild?', 'Unsaved progress since the last autosave is lost.':
    'Fortschritt seit dem letzten Autosave geht verloren.', 'Yes': 'Ja', 'No': 'Nein',
  // map
  'Where to?': 'Wohin?', 'Go to {0}': 'Gehe zu {0}', '{0} (you are here)': '{0} (du bist hier)',
  // HUD
  'Notebook (N)': 'Notizbuch (N)', 'City map (M)': 'Stadtplan (M)', 'Hint (H)': 'Tipp (H)', 'Menu (Esc)': 'Menü (Esc)',
  'Show what? (right-click to cancel)': 'Was zeigen? (Rechtsklick: abbrechen)', 'Show what? (tap outside to cancel)':
    'Was zeigen? (daneben tippen: abbrechen)',
  'Use {0} with {1}': 'Benutze {0} mit {1}', 'Use {0} with...': 'Benutze {0} mit ...', '... more': '... mehr',
  "I can't leave from here.": 'Von hier komme ich nicht weg.', 'Hints are switched off in the settings.': 'Tipps sind in den Einstellungen aus.',
  'Hint: {0}': 'Tipp: {0}', 'Got: {0}': 'Erhalten: {0}', 'Notebook: {0}': 'Notizbuch: {0}', 'New location: {0}': 'Neuer Ort: {0}',
  'Deduction: {0}': 'Schlussfolgerung: {0}', 'New file: {0}': 'Neue Akte: {0}', 'Your pockets feel lighter.': 'Deine Taschen fühlen sich leichter an.',
  'Use': 'Benutze', 'Go to': 'Gehe zu', 'Talk to': 'Rede mit',
  // notebook
  'Case': 'Fall', 'Clues': 'Hinweise', 'People': 'Personen', 'Deduce': 'Folgern', 'Timeline': 'Zeitleiste',
  'CHAPTER {0}': 'KAPITEL {0}', 'Chapter {0} — {1}': 'Kapitel {0} — {1}',
  'Show what? (hold to cancel)': 'Was zeigen? (halten zum Abbrechen)',
  'Tap above/below a wheel to turn it. Hold to step back.': 'Über/unter ein Rad tippen, um es zu drehen. Halten, um zurückzugehen.', 'THE CASE': 'DER FALL', 'WHAT I KNOW': 'WAS ICH WEISS', 'Not much. Yet.': 'Nicht viel. Noch nicht.',
  '[ Ask for a hint ]': '[ Um einen Tipp bitten ]', 'Nothing yet.': 'Noch nichts.', '{0}-{1} of {2} (wheel)': '{0}-{1} von {2} (Rad)',
  '[ Read the document ]': '[ Dokument lesen ]', 'Link two clues that belong together.': 'Verbinde zwei Hinweise, die zusammengehören.',
  'FIRST': 'ERSTENS', 'SECOND': 'ZWEITENS', '[ Connect them ]': '[ Verbinden ]', '{0} deductions made.': '{0} Schlussfolgerungen.',
  "There's no timeline to put together right now.": 'Gerade gibt es keine Zeitleiste zu ordnen.', 'Settled.': 'Geklärt.',
  'Click a card, then a slot.': 'Erst eine Karte, dann einen Platz.', 'CARDS': 'KARTEN',
  "I'm missing {0} piece(s) of this.": 'Mir fehlen noch {0} Teil(e).', '[ Check the timeline ]': '[ Zeitleiste prüfen ]',
  // overlays
  'scroll v': 'weiter v', 'Click above/below a wheel to turn it. Right-click to step back.':
    'Über/unter einem Rad klicken zum Drehen. Rechtsklick: zurück.', 'Pull cables': 'Kabel ziehen',
  // engine lines
  'Nothing pressing. Maybe I should keep moving.': 'Nichts Dringendes. Vielleicht sollte ich weitermachen.',
  "It won't open.": 'Geht nicht auf.', "I've already worked that one out.": 'Das habe ich schon herausgefunden.',
  'The timeline is already settled.': 'Die Zeitleiste steht schon.',
  "That doesn't hold together. {0} of {1} events sit right.": 'Das passt nicht zusammen. {0} von {1} Ereignissen stimmen.',
  'Never mind.': 'Schon gut.', "I can't see a connection between those two.": 'Ich sehe keine Verbindung zwischen den beiden.',
  // credits headings
  'A Brackwater Mystery': 'Ein Brackwater-Krimi', 'Story & Design': 'Geschichte & Design',
  'Written, designed and directed by Claude': 'Geschrieben, entworfen und inszeniert von Claude', 'Art': 'Grafik',
  'All backgrounds, characters and interface': 'Alle Hintergründe, Figuren und Oberflächen', 'painted in code, pixel by pixel':
    'in Code gemalt, Pixel für Pixel', 'Music & Sound': 'Musik & Ton', 'Composed and synthesized from scratch': 'Von Grund auf komponiert und synthetisiert',
  'Engine': 'Technik', 'Cast': 'Besetzung', 'and the people of Brackwater': 'und die Menschen von Brackwater', 'In memory of': 'In Erinnerung an',
  'the fourteen men of the SS Meridian': 'die vierzehn Männer der SS Meridian', '(who never existed, and should not have died)':
    '(die es nie gab und die nicht hätten sterben dürfen)', 'Thanks for playing': 'Danke fürs Spielen',
  "There's a moment, just before you open your eyes,": 'Es gibt einen Moment, kurz bevor man die Augen öffnet,',
  "when you're nobody in particular.": 'in dem man niemand Bestimmtes ist.', 'These days it passes quicker.': 'Heutzutage vergeht er schneller.',
};
