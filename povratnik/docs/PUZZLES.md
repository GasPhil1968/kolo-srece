# POVRATNIK – Puzzle specifications

Every puzzle lists: goal, initial state, discoverable clues, dependencies, valid solution paths,
plausible wrong attempts with their feedback, persistent effects, animations, save/load behaviour and
recovery. Flags are namespaced per chapter (`sa.`, `we.`, …). Failed attempts never consume items.
All puzzles are covered by the chapter solvers in `tools/sim/solvers.ts`, which finish each chapter
from any state reached by random play (see docs/TESTING.md).

---------------------------------------------------------------------------------------------------
## Chapter 1 – Der Band (Sarajevo, Frühjahr 1996)

Theme: MacLeod must learn to *see* before Mijo will tell. The city is polite: it answers what is asked,
nothing more.

### 1.1 Der Band auf den Tisch (tutorial: using an item on the world)
- Goal: put the Band (the ledger of immortals Mijo left in MacLeod's shop) on Mijo's coffee table.
- Initial state: Band and Zettel in the inventory; Mijo at the window; MacLeod at the door.
- Clues: Mijo says "Legt ihn auf den Tisch." Hint level 3 explains the inventory mechanic.
- Solution: select the Band, click the coffee table (also accepted on either cup). → `sa.band`, the
  Band appears on the table, Mijo says "Fragt." and the conversation opens.
- Wrong attempts: Band on Mijo → "Er nimmt ihn nicht. Er zeigt auf den Tisch."; leaving through the
  door → "Der gehört auf Mijos Tisch." (the exit explains itself, it does not silently fail).
- Save/load: state is a flag; loading restores the prop on the table.

### 1.2 Kaffee für Mijo (main chain)
- Goal: bring Mijo fresh coffee in his own džezva.
- Initial state after the conversation (`sa.task`): the džezva stands empty on the table.
- Dependencies and steps:
  1. Take the džezva (only after the task – before: "Nicht ohne Grund …"). Inspect it: a loose rivet,
     "Voll würde sie tropfen."
  2. Repair: use it on Halil at the Sebilj. Discoverable clues: the inspection text; Nedžad refuses a
     leaking pot and names Halil; the newspaper in the Kafana announces that the coppersmiths return
     (the Sebilj lies at the top end of the alley). Halil recognises his great-grandfather's mark –
     made "für einen jungen Mann aus Nummer drei" – sets the rivet with MacLeod holding the handle
     (Halil's hammer animation). → `sa.repaired`.
  3. Fill: use the repaired džezva on Nedžad. He measures "eine Prise mehr, als ein Mann braucht" (the
     second cup). → `sa.full`; item name becomes "Džezva mit Kaffee".
  4. Pour: back in the room a third cup now waits on the table (Mijo set it while MacLeod was away).
     Use the džezva on Mijo's cup, the third cup, the table or Mijo. MacLeod fills both; reaching for the
     second cup earns "Die nicht." → `sa.poured`, steam rises from both cups.
- Alternative orders: Nedžad can be visited first (he explains the leak), Halil can be found without
  Nedžad, the rose can be seen at any time.
- Wrong attempts: leaking džezva on Nedžad → refusal with the reason and Halil's name; full džezva on
  Halil → "Kaffee trage ich nicht über den Platz."; džezva on the second cup → "Die nicht."; on other
  things → "Damit kocht man Kaffee. Hier nicht."
- Persistent effects: the repaired džezva is used again in the Zäsur (chapter 6).
- Save/load: all steps are flags/items; the pour/report sequence starts from a checkpoint.

### 1.3 Was die Stadt verschweigt (inference)
- Goal: tell Mijo what the city keeps silent.
- Clues (observation, not dialogue exhaustion): the red-filled crater in the alley – "Die Steine um den
  Rand sind blank getreten. In der Mitte nicht." (people step around it). Nedžad deflects to Halil.
  Halil, asked about it only after MacLeod has seen it, explains: three people queueing for water in the
  winter of 1992; "Die Stadt verschweigt ihre Narben … Aus Höflichkeit."
- Solution: after pouring, Mijo asks "Und? Was habt Ihr gesehen?". Only observations MacLeod actually
  made are offered. The answer about the poured-out craters (requires `sa.halilRose`) ends the chapter.
- Plausible wrong answers each get a specific reply and "Geht noch einmal hinunter. Nicht zum Kaffee.
  Zum Hinsehen.": the coffee for two ("Das ist mein Schweigen. Nicht das der Stadt."), the
  great-grandfather's džezva ("Arithmetik, kein Geheimnis"), the two alphabets ("Das ist Lärm"),
  "Die Stadt ist ruhig" ("Ruhig ist, wenn niemand etwas sagt. Das ist nicht dasselbe."). Talking to Mijo
  again repeats the question; nothing is lost.
- End: Mijo: "Setzt Euch." – the original cinematic of the two men at the table, with Mijo's first
  sentences of the story → chapter 2.
- Save/load: the report runs after a checkpoint; a save during it reloads at the poured state and the
  question is asked again by talking to Mijo.
