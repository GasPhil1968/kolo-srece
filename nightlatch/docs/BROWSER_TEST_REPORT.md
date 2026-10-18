# Night Latch — Browser test report

Generated 2026-10-18T11:39:41.275Z by `npm run e2e` (`tests/e2e/run.ts`): Playwright driving Chromium against the production build.

> These are automated browser tests. They use real mouse clicks and key presses on the game canvas; no human played these sessions.

**5 of 5 cases passed, 62 of 62 checks.**

## ✅ Title screen and menu (4 s)

- ✔ title menu offers New game
- ✔ title menu offers Settings and Credits
- ✔ canvas renders at native 320x180
- ✔ nearest-neighbour scaling (image-rendering: pixelated)
- ✔ credits open from the title menu
- ✔ credits close on click

## ✅ New game and mouse interaction in Room 9 (14 s)

- ✔ new game starts in Room 9 (hotel_room)
- ✔ chapter 1
- ✔ hovering a hotspot names verb and object
- ✔ right-click looks (an action runs)
- ✔ left-click walks over and takes the hat
- ✔ the hat note is filed in the notebook
- ✔ searching the bed finds the newspaper
- ✔ clicking an inventory slot picks the item up
- ✔ right-click drops a held item
- ✔ right-click on an item examines it
- ✔ notebook button opens the notebook
- ✔ Escape closes the notebook
- ✔ the city map is unavailable while locked in
- ✔ hint button gives a hint (hint tier advances)
- ✔ a clue's document opens from the notebook
- ✔ N opens the notebook

## ✅ Save, load and settings through the pause menu (13 s)

- ✔ menu button opens the pause menu
- ✔ saving to slot 1 writes the save
- ✔ after saving, the wardrobe is opened
- ✔ loading slot 1 restores the saved state
- ✔ loaded game is in the saved room
- ✔ inventory icons are drawn after loading
- ✔ autosave slot exists after the chapter opening
- ✔ music volume setting changes and persists
- ✔ settings survive a page reload
- ✔ title offers Continue once a save exists

## ✅ Every room renders (screenshots) (53 s)

- ✔ room hotel_room loads and renders
- ✔ room hotel_lobby loads and renders
- ✔ room office loads and renders
- ✔ room nora_flat loads and renders
- ✔ room lantern loads and renders
- ✔ room cold_store loads and renders
- ✔ room pier9 loads and renders
- ✔ room pharmacy loads and renders
- ✔ room gazette loads and renders
- ✔ room mission loads and renders
- ✔ room darkroom loads and renders
- ✔ room cemetery loads and renders
- ✔ room commission loads and renders
- ✔ room precinct loads and renders
- ✔ room hask_shop loads and renders
- ✔ room halcyon_gate loads and renders
- ✔ room halcyon_cell loads and renders
- ✔ room halcyon_corridor loads and renders
- ✔ room halcyon_office loads and renders
- ✔ room holding_cell loads and renders
- ✔ room lantern_cellar loads and renders
- ✔ room tunnel loads and renders
- ✔ room calypso_hold loads and renders
- ✔ room calypso_deck loads and renders
- ✔ room calypso_cabin loads and renders
- ✔ room radio_booth loads and renders
- ✔ room clocktower loads and renders
- ✔ frame rate stays near 60 FPS in every room (software-rendered Chromium)

```json
{
 "rooms": 27,
 "fpsMin": 60,
 "fpsAvg": 61
}
```

## ✅ Complete playthrough with real mouse input (307 s)

- ✔ the game can be finished from New game to the ending
- ✔ all eight chapters were played

```json
{
 "steps": 140,
 "clicks": 576,
 "minutes": 5.1,
 "tail": [
  "  choose broadcast.frank",
  "  choose frank_talkback.early",
  "  show gate_log",
  "  choose frank_talkback.padlock",
  "  choose frank_talkback.walter",
  "[c8.door]",
  "use hs:door",
  "[c8.roof]",
  "use npc:delaney",
  "  choose roof.show",
  "  show lighter",
  "  choose epilogue.after",
  "  choose epilogue.knife",
  "  choose epilogue.now",
  "  choose epilogue.go"
 ]
}
```

Screenshots: `reports/screens/` (title, menus, notebook, every room, chapter openings and the ending).
