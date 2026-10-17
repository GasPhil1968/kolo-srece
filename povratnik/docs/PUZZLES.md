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

---------------------------------------------------------------------------------------------------
## Chapter 7 – Ancona (Adriaküste, Mai 1507)

Theme: Mijo is sent as the payment and learns it from the man he kills. Everything the chapter asks of
the player is something Mijo already knows: Alessandro's lessons, the pasture, how weight works.

### 7.1 Wo es hell ist (harbour; observation)
- Goal: find the Greek among six identical warehouses.
- Clues: Alessandro's note ("Er wartet, wo es hell ist"); the warehouses are locked and dark ("In
  einem verschlossenen Speicher ist es nicht hell"); pigeons rise out of the last roof and drop back
  into it ("Das Dach ist offen"); in front of the last warehouse Mijo feels the pull he knows from four
  years with Alessandro ("Hier ist es stärker").
- Solution: the last gate (always enterable: it stands ajar; looking at it after the pigeons or the
  pull describes the light through the gap). → room change, journal `kampf`.
- Wrong attempts: gates 1–5 each have their own description and "Verschlossen."; the ducats on a gate
  → "Das Geld ist für den Griechen. Nicht für ein Tor."

### 7.2 Das Gespräch (before the fight)
- The talk always completes before anyone draws. The age question (truth or dodge) is answered in
  character; questions about Alessandro and Nikephoros' past can be asked in any order; offering the
  money ends the talk ("Das Geld ist nicht der Preis") – Mijo understands what he was sent as.
- Checkpoint `prefight`.

### 7.3 Der Kampf (six readable decisions)
- Each step shows the painted wind-up and one sentence about the opponent's body; the answers on
  offer differ by stance (standing: hoch / tief / ausweichen / hineingehen; on the ground: Kragen /
  Gewicht / Daumen / Schwert).
  1. Spitze sinkt bis zum Knie → tief parieren. 2. Klinge quer in Hüfthöhe, weit ausgeholt →
  ausweichen. 3. Hüfte eingedreht, Klinge hoch hinter der Schulter (Alessandro's own cut) →
  hineingehen; after a failure Alessandro's lesson is quoted. 4. Am Boden, er will heraus → Kragen
  halten. 5. Er rollt über Mijo → mit dem Gewicht drehen; after a failure the pasture lesson is
  quoted. 6. Arme hoch, Mijos linke Hand frei → Daumen.
- Wrong or late answers: shown (a cut, a stagger, being thrown), explained per wrong answer, and the
  same step comes again. Decision time 5 s, +35 % per failure (up to +140 %); unlimited with the
  relaxed-combat setting. No loss state. Repeating one answer never wins (unit-tested for every fight).
- Checkpoints `duel` (start of the fight) and `after`.

### 7.4 Danach (no puzzle; one forced choice)
- The thumb close-up, the talk on the floor, "Frag deinen Meister." Choice: strike / lower the sword.
  Lowering earns the rule ("Dann komme ich dir nach … So geht das bei uns.") and leaves only the strike.
- Execution in the painted pair frames (two blows, the head falls separately), then the Quickening
  (anticipation, two discharges into the sword hand, the roof breaking open, the likeness crumbling,
  darkness, exhaustion; reduced-flash mode dims every flash and discharge). Checkpoint `quickening`.

### 7.5 Das Tor (physical chain; Mijo's arms do not obey yet)
- Goal: get out through the gate, which opens inwards and is blocked by what the roof threw down.
- Initial state: planks and a roof beam before the gate; the hanging block (Lastrolle) on the tie beam
  above it, its rope thrown out; the rope coil and the hook on the floor; a full salt sack ("Schwerer
  als ich").
- Steps: (1) clear the planks (light; they go to the left of the gate) – the beam remains; lifting it
  by hand fails ("Die Arme gehorchen noch nicht"). (2) Rope + hook (inventory combination). (3) Rope
  with hook over the block. (4) Use the beam: the hook end is pulled down, the rope goes round both
  ends as a sling, the hook holds it. (5) Pulling the free end alone fails ("Am Ende muss etwas hängen,
  das schwerer ist als meine Arme"). (6) The salt sack at the free end: the sack sinks, the beam rises,
  the rope is made fast at the post; the beam hangs above the gate.
- Order: (2) and (3) are independent of (1); (4) needs (1) and (3); (6) needs (4). Steps (5) and the
  hand lift are optional observations.
- Wrong attempts: rope without hook on the block → "Ohne Gewicht am Ende fliegt das Tau nicht hoch
  genug"; hook alone → "Den Haken allein bekomme ich nicht über die Rolle"; hook and rope on the beam
  before the block → "Erst muss das Tau über die Rolle"; the sack before the hook holds → "Erst muss
  der Haken den Balken fassen". Nothing is consumed by a failed attempt.
- Visuals: pile → planks aside + beam → hook hanging under the block → rope from the block to the
  sling round the beam → the beam hanging above the gate, the sack by the post (derived crops of the
  same paintings, see docs/ASSETS.md).

### 7.6 Die Klinge (required for the exit)
- Reading the blade: the dead man's letters are readable for one moment ("Wie ein Ladenschild"): his
  name, Nikephoros, and a room in Rimini – Alessandro: "Ich habe einen bei mir. Der ist noch nicht lange
  dabei." – "Wie lange?" – "Kurz genug." Afterwards the letters are unreadable again. Taking the blade
  is optional (only after reading).
- The gate refuses until the blade is read ("Noch nicht. Auf seiner Klinge steht etwas.").
- End: "Er ging hinaus. Und der andere ging mit ihm."
