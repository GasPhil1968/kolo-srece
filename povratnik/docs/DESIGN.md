# POVRATNIK – Chapter manifest (authoritative)

Source authority used for every decision: the 2026 rebuild brief first, the supplied chapter document
(REFERENCE/POVRATNIK-Kapitel-6-Elf-Tage.txt) second, established story continuity third, the old
implementation last. Old bugs are not requirements. The old project was audited chapter by chapter;
findings are summarised in docs/AUDIT.md.

Branding: the old code carried a "HIGHLANDER … Verwendet unter Lizenz" line behind a switch whose own
comment says the licence was never signed. The rebuild is brand-free: title POVRATNIK, subtitle
"Der Wiederkehrer". The frame character MacLeod is kept as supplied (name only, no franchise marks).

## Chapter order (preserved from the old game, including the deliberate jumps in time)

| # | id | Title | Date / place | Player | Rooms |
|---|----|-------|--------------|--------|-------|
| 1 | `sarajevo` | Der Band | Sarajevo, Frühjahr 1996 | MacLeod | Mijos Zimmer, Treppenabsatz, Gasse, Kafana, Sebilj |
| 2 | `weide` | Der Steinblock | Oberes Neretva-Tal, Frühsommer 1467 | Mijo, 12 | Weide, Karawane (Blick vom Stein), Im Haus |
| 3 | `dorf` | Der Dorfplatz | Neretva-Tal, September 1473 | Mijo, 18 | Das Dorf am Abend, Dorfplatz |
| 4 | `povratnik` | Povratnik (opens with the transition *Vierzig Sekunden*) | Sommer 1476 | Mijo, 21 | Die Senke, Das Grab, Der Rückweg, Das Dorf bei Nacht |
| 5 | `elftage` | Elf Tage | August 1476 | Mijo | Hof, Stall, Feld des Onkels, Kirchstufe, Gasse (Brand), Im brennenden Haus |
| 6 | `zaesur` | Zäsur | Sarajevo, später am selben Nachmittag, 1996 | MacLeod | Mijos Zimmer |
| 7 | `ancona` | Ancona | Adriaküste, Mai 1507 | Mijo (51, looks 21) | Hafen, Lagerhaus |
| 8 | `herberge` | Die Herberge | An der Straße nach Mailand, November 1512 | Mijo | Gaststube, Hof |
| 9 | `kolonne` | Die Kolonne | Von der Save nach Sarajevo, August 1878 | Mijo, Dolmetscher | Die Enge, Kolonnenspitze, Feldzelt |
| 10 | `lager` | Das Lager | An der Straße nach Sarajevo, September 1878 | Mijo | Lager, Stabszelt |
| 11 | `hochzeit` | Vor dem Dorf | Drina-Gebiet, 20. September 1878 | Mijo | Am Kamm, Die Gasse |
| 12 | `fremdesdorf` | Das fremde Dorf | Oberes Neretva-Tal, Oktober 1878 | Mijo | Der Steinblock, Das Dorf |

*Vierzig Sekunden* is the novel's very short fatal encounter in the pass. It is staged as a transition
(card, tableau, one decision, the fall) that leads straight into the 1476 return – never as a battle level.

The supplied arc ends at the church step in 1878 (Slaven: "Da hast du mich hingelegt. Dann bist du
gegangen."). The narrator closes the telling ("Das ist ein anderes Kapitel."); the game ends on the 1996
room. Nothing beyond the supplied material is adapted.

## Continuity facts used across chapters

- Mijo: born ~1455 in a village in the upper Neretva valley; 12 in 1467, 18 in 1473, killed at 21 in summer
  1476 while the village held a pass against raiders (borrowed iron cap, a spear, farm tools as weapons).
  He does not age after that. Immortals sense each other: *das Ziehen* ("ein Druck hinter den Augen, ein
  Ziehen in den Zähnen"); it says that someone is there, not who.
- Family: the father (40 in 1467, "sieht aus wie sechzig"), Anđa (mother; "Sechs geboren. Drei leben."),
  an uncle with a field. In 1476 the family keeps the door bolted, feeds him in silence (bread, the
  blue-patched cloth, the father's jug) and never shows itself. The father is never shown above the feet.
- The boy of the fire (1476) is laid on the top church step and sits up after Mijo has gone. In 1878 he is
  Slaven – an immortal who stayed twelve. In 1996 Mijo's Band has a last page with only "Slaven."; Mijo keeps
  a second full cup and writes letters that come back unopened ("jemandem, der noch nicht antwortet").
- Alessandro: condottiere, Mijo's teacher for four years in Italy; in 1507 he sent Mijo to the old
  Byzantine Nikephoros "mit hundert Dukaten" – Mijo was the payment. Mijo kills Nikephoros (first
  Quickening, Ancona) and in 1512 Alessandro (second Quickening, the inn yard). Only beheading ends an
  immortal; the Quickening carries the dead man in for a while: "Es geht nicht weg."
- 1878: Mijo is an army interpreter with the k. u. k. occupation troops. Theme: language as power – the
  father's lesson of 1467 ("Wer an einer Straße lebt, lernt zuerst zuzuhören"), Frano the interpreter of 1473
  and Mijo the interpreter of 1878 mirror each other.

## Persistent state between chapters

Each chapter starts with an empty inventory (the story jumps years or centuries). Story flags are global
and namespaced by chapter; a chapter that refers back (the Zäsur to the Sarajevo chapter, 1878 to 1476)
sets sensible defaults in its `setup` so the chapter menu can start it fresh.

| Flag | Set in | Read in |
|------|--------|---------|
| `sa.dzezvaRepaired` | Sarajevo (Halil rivets the džezva) | Zäsur (MacLeod refills his own cup from it) |
| `sa.sawSecondCup` | Sarajevo | Zäsur (MacLeod knows the cup) |
| `et.clothOn` | Elf Tage (blue cloth over the boy's face) | 1878 dialogue nuance |
| `ko.bandaged` | Kolonne (dressing worn) | Lager (Rehberger notices the bandage) |
| `ko.protocolCurse` | Kolonne (the farmer's curse translated literally into the record) | Lager (the record follows Mijo) |
| `ko.reported` | Kolonne (which evidence the captain accepted) | Lager |

## Interaction model (all chapters)

Left click on the floor walks; left click on a thing opens its verbs (Ansehen, Nehmen, Benutzen, Reden and
chapter verbs such as Kriechen, Tragen, Niederlegen, Beten); right click looks. Inventory items are used by
selecting them and clicking a target (thing, person or another item). Tab shows every interactive place, so
nothing needs pixel hunting. J opens the journal, H gives a hint for the current situation (each further
request is more concrete). Time only advances at story milestones; there is no real-time waiting and no
invisible deadline. Failed attempts never consume items and always explain the obstacle.

The game is completely silent. Everything formerly audible is shown or written (the father's cough,
breathing behind the door, the jug being set down, the woman's scream, the wedding drum).

Puzzle specifications per chapter: docs/PUZZLES.md. Saves: docs/SAVES.md. Assets: docs/ASSETS.md.
