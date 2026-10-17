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

---------------------------------------------------------------------------------------------------
## Chapter 8 – Die Herberge (An der Straße nach Mailand, November 1512)

Theme: the teacher knows every move he taught. The inn asks the player to *count*; the yard asks the
player to stop doing what was taught.

### 8.1 Wer? (inn; observation and inference, no items)
- Goal: find out who the pull belongs to.
- Initial state: Mijo at the table by the courtyard door, a plate in front of him; four carters playing
  cards, two watching; six coats on the rail over their table; a seventh coat, a riding coat with
  buttoned cuffs, alone on a peg by the courtyard door, a puddle under it.
- Steps: (1) eat – the pull comes (vignette of Mijo pulling off his glove and looking at the door).
  (2) Look at the carters: six, playing since yesterday ("als hätten sie seit gestern nichts anderes
  getan"); the watchers' boots are dry. (3) Look at the coat by the door: soaked to the collar, a puddle
  under it – someone came in out of the rain just now. The rail (six dry coats) is optional
  confirmation. (4) Deduction fires as soon as (1)–(3) are known: six carters since yesterday, six dry
  coats; the wet one belongs to none of them; its owner hung it up and went out again without it – "Damit
  ich ihn sehe." – "Alessandro."
- Wrong attempts: the door before eating ("Erst esse ich."), before knowing who ("Ich gehe nicht hinaus,
  ohne zu wissen, wer."); taking the coat ("Er hat ihn für mich hängen lassen."); talking to the carters
  (they do not look up).
- The old lantern gate and the 4/2/1 matching board are gone; the clue that used to be audible ("seit
  gestern gehört") is now visible (dry coats, dry boots, one dripping coat).

### 8.2 Im Hof: das Gespräch, dann der Kampf
- The talk completes before anyone draws: Alessandro ("Du bist spät."), one choice ("Kurz genug." /
  "Warum ich?" / silence), each answered in character, then "Fünf Jahre habe ich überlegt …" – "Gut. Dann
  fangen wir an." Mijo lays his cloak over the stair rail (the fight art shows him in waistcoat and
  shirt; he takes the cloak again afterwards).
- Fight (six steps; the inverse of Ancona): every taught answer is expected. "Kontern" is offered at
  every step and never works ("Den Gegenstoß hat er mir beigebracht. Er wartet darauf."). Mijo reads
  and parries: two-handed overhead → hoch; point low, stepping in → tief; shoulder dropped, body charge →
  ausweichen. Each success shows something about him (he waits where the taught half step goes; his left
  hand rests idle on the grip; he slips on the wet stones). Then: overhead again → Klinge binden (not
  parry-and-release; the lesson after a failure repeats the idle left hand); bound blades → Kragen
  greifen with the free left hand; he pushes, heavier → mit seinem Druck drehen (the pasture: let the
  bigger one come; hip throw).
- No loss state; decision time 5 s, growing after failures; unlimited in relaxed mode.
- Checkpoints `prefight`, `duel`, `after`, `quickening`.

### 8.3 Danach
- Last words lying in the wet ("Wo hast du das gelernt." – "Zu Hause." – "Das hast du mir in vier Jahren
  nie gezeigt." – "Du hast nie gefragt."), he asks to die properly, kneels; the execution in the painted
  pair frames.
- The second Quickening, distinct from Ancona's: blue arcs come over the wet stones from the body, a
  storm of arcs rises around Mijo, the rain is driven sideways, the wall lanterns flare and go out (the
  yard stays darker), boards and a barrel hoop fly; Mijo arches, is engulfed, buckles, kneels on his
  sword, rises. Reduced-flash mode dims the flashes and the additive arcs.
- Exit: the gate ("Die Straße nach Mailand. Sie führt weiter, mit mir oder ohne."). Optional looks: his
  saddled horse ("Er wollte nicht bleiben, egal wie es ausgeht."), the dark windows, the body.

## Chapter 9 – Die Kolonne (August 1878)

Three rooms, in story order: the gorge right after the ambush, the head of the column the same hour, the
interrogation tent that evening. Everything Mijo solves after the gorge he solves with words, because on
paper he is now a wounded man and may not lift anything.

### 9.1 Die Enge: a wounded man like eighteen others
- Situation: shot through (entry above the hip from behind, exit under the last rib), seven minutes
  behind a dead horse; the wound has closed. A hole in the tunic over healed skin would give him away.
  The torn tunic is drawn on Mijo (a patch pinned to a measured point of every frame) and changes with
  the steps below.
- Steps: (1) look at himself – the hole, the healed skin ("Ein Loch im Rock und keines im Mann.").
  (2) Use the horse: its blood smeared over the coat (a man with a bloody coat is not conspicuous after a
  fight; one without a wound is). (3) Take the field dressing from the fallen soldier's pack (refused
  before (1): "Ohne Grund fasse ich das Gepäck eines Toten nicht an."). (4) Combine dressing + horse: a
  white dressing over a gunshot wound would be wrong ("bleibt nicht weiß"). (5) Use the reddened
  dressing on himself (refused on a clean coat; the white dressing is refused with the reason).
- Exit "Nach vorn" explains each missing step. Observation for later: the abatis was set alight by
  the attackers when they left (look at the smoke).

### 9.2 Die Spitze der Kolonne: the carter, the receipt, the handspike, the report
- The requisitioned carter's cart (the one from the gorge, pulled on without its horse) blocks the road
  with a broken axle. The captain shouts German at a man who understands only the tone.
- Mijo may not unload or lift ("Mit einem Verband um den Leib hebe ich keine Kiste. Nicht, solange der
  Hauptmann herschaut.").
- Steps: (1) talk to the carter in his language; "Schaff den Karren weg" gets the same answer as the
  captain's shouting; "Was fehlt dir?" gives the real reason: horse and axle lost, nobody writes that
  down. (2) Ask the captain for a stamped requisition receipt (the argument: without it the man will not
  move, and without him the cart will not). (3) Give the receipt: the carter unloads. (4) Take the
  handspike lying by the dismantled mountain gun and give it to the carter: the axle is levered up,
  propped on a stone, the cart pushed to the roadside.
- The report (captain, "Ich melde, was ich weiß"): only what a living man could have seen. "Elf Mann,
  noch oben" (false, costs a day) and "Ich weiß es nicht" are refused; "niemand mehr" must be justified:
  "Ich habe gesehen, wie sie gegangen sind" makes the captain ask how a man with a hole in him watched
  them leave (recoverable); the abatis burnt behind them (seen in the gorge) or the crows back in the
  beeches (look at the slope) are accepted. The first talk with the captain also writes Mijo into the
  list: "Neunzehn Verwundete. Mit Ihnen."

### 9.3 Das Feldzelt: the interrogation
- Staged as a close tableau at the painting's own scale (no walking): Mijo, the old farmer on his chair,
  a soldier, the major.
- Stage 1 – address: the harsh "du" question (as the major asks it) and silence fail; after two
  failures the narrator states the custom. "Onkel. Wo sind sie?" works. The farmer's forty seconds are
  shown in his own language (ijekavian): not knowing, mowing hay when they took him, his brother killed
  at Nevesinje in 1875, a curse on the emperor.
- Stage 2 – translation: literal translation sets the persistent flag `ko.protocolCurse` (the curse is
  now an offence in the record); "Er sagt, er weiß es nicht." (the content) is the clean path; silence
  fails. Clue: the record book's motto "Quod non est in actis, non est in mundo".
- Stage 3 – the major orders more beating: pity and rank fail (after two failures the narrator says
  what the major listens to); the hand (two fingers missing, a scythe; close-up) is an optional
  argument; the consequence ("he will give you a name, any name … six dead you ordered yourself")
  stops it. The ending line reflects the record. Exit: "Bis Sarajevo waren es noch elf Tage."

## Chapter 10 – Das Lager (September 1878)

Two rooms: the camp by the washed-out road, the staff tent. The column waits three days; the chapter
is one inference across both rooms, carried by Zeman's question "what is wrong with my form?".

- (1) Talk to Zeman: eleven men in Vitina, seventeen names; the folder is on the crate (taking it before
  he has asked is refused). (2) Take the folder: the form (Parzelle, Eigentümer – one line –, Fläche)
  and his list. (3) Examine the list: one man, three names, all of them right (father's name,
  brotherhood, the tax scribe's invention). (4) In the staff tent, look at Zeman's sketch of Vitina:
  forty-three numbered fields, the pasture has no number – it belongs to nobody and to all ("Wie unsere,
  über der Straße, wo der Stein steht."). (5) Combine form + list: Mijo draws the missing column
  (Bruderschaft) and a line for the pasture (refused, with the reason, before (3) or (4)). (6) Tell Zeman
  "Auf Ihrem Formular fehlt eine Spalte": what a single name does (the field can be pledged; "In dreißig
  Jahren gehört das Tal einer Bank."). Zeman takes Vitina for an exception. (7) Use the form on the
  register box in the staff tent: fourteen villages, one name each, no pasture anywhere. (8) Tell Zeman:
  "ordentlich – das ist gefährlicher"; "Ohne Sie ginge es gar nicht." (6) and (7) can come in either
  order. Exit: the mended road; the form comes back from Vienna stamped "unzulässig".
- Rehberger (optional): notes everything under Landeskunde, including that Mijo's gunshot "heals fast"
  (`ko.bandaged`), and reports the farmer's fate according to `ko.protocolCurse` (court-martial in
  Travnik after the literal translation, released after the content translation).
