import type { ClueDef, DeductionDef, PersonDef, TimelineDef } from '../engine/types';

const C = (id: string, title: string, text: string, extra: Partial<ClueDef> = {}): ClueDef => ({ id, title, text, ...extra });

export const CLUES: Record<string, ClueDef> = Object.fromEntries(
  [
    // ---------------------------------------------------------------- chapter 1 ----
    C('hat_note', 'Note in my hatband', "In my own handwriting: 'If you're reading this, they got to you. Don't drink anything Sal pours. Trust Mabel.'", { doc: 'hat_note' }),
    C('lost_days', 'Six days gone', "The paper says Monday, October 15. The last thing I remember is Tuesday the 9th."),
    C('pocketbook', 'My torn notebook', "Every page after Oct 8 torn out. Last entry: 'N.M. came by. Believe her.' On the back cover: 'On ice — B3. Sorry about the smell.'", { doc: 'pocketbook' }),
    C('two_men', 'The two men', 'Pettibone: two men carried me in on Tuesday night. A big man in a camel-hair coat did the talking. The quiet one smelled like a hospital.'),
    C('register', 'The hotel register', "'Mr. Smith & cousin. Do not disturb. Patient sleeps.' Patient. Not guest."),
    C('ask_piano', "'Ask the piano'", 'What I told Mabel to tell me if I ever came back not knowing my own name. Apparently I was pleased with myself.'),
    C('mabel_shorthand', "Mabel's twelve years", 'Before she ran my office, Mabel took shorthand in the county court for twelve years.'),
    C('nora_visit', 'Nora came to me', 'Mabel: Nora Marsh came to the office on Oct 8 with a folder. We talked behind a closed door for an hour, then left together.'),
    C('evelyn_claim', "Evelyn Marsh's story", "Says she's Nora's older sister, lives out of town, came as soon as she heard. Hired me to find Nora."),
    C('evelyn_watch', "Evelyn's watch", 'She wears a little watch pinned upside down on her lapel, and smells faintly of carbolic soap.'),
    C('evelyn_phone', 'Harbourview 4-170', "Evelyn's number. She wants a report from me every evening."),
    C('meridian_file', 'The Meridian file', 'SS Meridian burned at Pier 9 on Oct 21, 1949. Fourteen dead. Ruled accidental; case closed by Lt. Frank Delaney. My own file on it is thinner than I remember.', { doc: 'meridian_file' }),
    C('delaney_warning', "Frank's warning", "Frank Delaney, on the phone: 'Stay away from the Marsh thing, Tommy. You're not police anymore.'"),
    C('nora_letter', "Nora's letter", "A carbon of a letter Nora wrote me: she found proof at the Commission that the Meridian fire was no accident. Her father, Walter, died in it.", { doc: 'carbon_letter' }),
    C('nora_list', 'Three names', 'A notepad from the Sorrento, pressed into the drawer under a spare pair of stockings. Three names: D. Boone, E. Marsh, T. Rook. The word LANTERN is underlined twice, and Rook is crossed out.'),
    C('lamplighter_record', "'Lullaby of the Lamplighter'", "The record on Nora's gramophone. Deacon Boone Trio. Deacon plays piano at the Blue Lantern."),
    C('family_photo', 'Father and daughter', "A photo in Nora's flat: 'Walter and Nora, Coney Pier, 1946.' Just the two of them."),
    C('searched_flat', 'Someone searched the flat', 'Whoever tossed the place was after papers. They even opened the flour tin.'),
    C('deacon_promise', "Deacon's promise", "I brought Nora to Deacon on the 8th and asked him to keep her safe — and never to tell me where. 'If I come back asking, it means they've got a leash on me.'"),
    C('on_ice', 'The proof is on ice', "Deacon: I told him the proof was 'on ice'. Pier 9."),
    C('sal_drink', "Sal's free drink", 'Sal was very keen to buy me a drink. The palm I poured it into has taken a turn.'),
    // ---------------------------------------------------------------- chapter 2 ----
    C('minutes1_clue', 'Transcript, page one', "Minutes of a private night session, Oct 3. Present: Commissioner A. Crane, Dr. L. Vey, and a police lieutenant — the name's run where the fish leaked.", { doc: 'minutes1' }),
    C('shipping_label', 'Halcyon crates', 'Medical crates in the cold store, consigned to Halcyon House, Gull Hill. Shipped by Gullwing Holdings aboard the MV Calypso.'),
    C('gus_saw', 'Gus saw me', 'Gus watched two men drag me into the cold store last night — one in a camel-hair coat, one in a white jacket under his raincoat.'),
    C('gus_hammering', 'Hammering in the hold', "Gus heard hammering at the Meridian's hatch about half an hour before the fire. A big detective with a nice coat told him he was drunk."),
    C('lethe_identified', 'L-7 is scopolamine', "Kessler: refined scopolamine with a barbiturate. A dosed man does what he's told, smiling, and remembers nothing afterwards."),
    C('anise', 'Hidden in anise', "Kessler: it's bitter. They'd hide it in something strong — anise, licorice."),
    C('halcyon_scopolamine', "Halcyon's supplier", 'Halcyon House bought scopolamine from Kessler for years, then two years ago found another supplier.'),
    C('pike_missing', 'Wendell Pike', 'Gazette reporter. Went up Gull Hill in August to write about Halcyon House. His landlady says he came home once, not knowing her name.'),
    C('clipping_meridian', 'The 1949 clipping', "'There is no evidence of foul play,' said Lt. Frank Delaney."),
    C('clipping_suspension', 'My suspension', "November 1949: Det. Sgt. Thomas Rook suspended for 'erratic conduct.' I remember the suspension. I don't remember the conduct."),
    C('pike_notes', "Pike's notes", "Three Meridian dockhands — Doyle, Kerrigan, Fisk — admitted to Halcyon in Nov '49, discharged without memories. Referred by 'a police lieutenant'. Paid by 'G.H.'", { doc: 'pike_notes' }),
    C('mission_forgotten', 'The forgotten', 'Sister Agnes: they come down from the hill with clean shirts and empty heads. The Mission gives them soup and new names.'),
    C('kerrigan', "Kerrigan's nightmare", "Mick Kerrigan remembers a big man putting a padlock on the hatch. 'Go home, Mick.' Then fire. Then a white room."),
    C('volunteer', 'The volunteer', "A young volunteer in a headscarf at the Mission. She served my soup and wouldn't look me in the eye."),
    // ---------------------------------------------------------------- chapter 3 ----
    C('darkroom_note', 'Note on the enlarger', "My handwriting: 'You did this. The key is safe. Develop the film. No white light till the prints are fixed.'"),
    C('photo_trucks', 'Photo: the back gate', "Gullwing trucks unloading crates at Halcyon House's back gate, at night."),
    C('photo_handshake', 'Photo: the handshake', 'Dr. Vey shaking hands with a big man in a good coat. His face is lost under his hat brim, but there’s a gold lighter in his hand.'),
    C('photo_clock', 'Photo: the timer', "The darkroom's wall timer, back panel open, a key hanging inside. I photographed my own hiding place."),
    C('no_sister', 'THERE IS NO SISTER', "Red grease pencil on the darkroom wall, invisible under a red light: 'Anise = Lethe. The sister brought the coffee. There is no sister.'"),
    C('only_child', 'The Marsh headstone', "'Ruth Marsh, 1901–1947, beloved wife of Walter, mother of their only child, Nora.'"),
    C('flowers', 'Fresh flowers', "Chrysanthemums on Walter's grave, with a card: 'Papa — I'm being brave. Soon. N.' Dated Sunday the 14th."),
    C('scarf', 'The Sunday visitor', 'Cobb the gravedigger: the girl comes at dawn on Sundays, in a headscarf.'),
    C('oct3_session', 'The night session', 'Lillian: on Oct 3, Nora took the minutes of a private night session. She came out white as a sheet.'),
    C('meeting_attendees', 'Who was in the room', 'The Commissioner, a thin doctor with a cane, and a big police lieutenant in a lovely camel-hair coat.'),
    C('gala', 'Saturday at nine', "Crane's diary: Commission centenary gala, radio address on WBRK, Saturday Oct 20, 9 PM."),
    C('crane_gullwing', 'Gullwing letterhead', "Gullwing Holdings correspondence on the Commissioner's own blotter. Crane owns the line that owned the Meridian."),
    C('steno_transcript', 'What Nora heard', "Mabel's reading of the shorthand: 'The Calypso sails the 21st... the remaining witnesses have been treated... Rook is your department. You handled him once.'", { doc: 'steno_transcript' }),
    C('delaney_coat', "Frank's coat", "A camel-hair coat hanging in Frank Delaney's office."),
    C('gull_lighter', 'A gold lighter', 'Frank lit my cigarette with a gold lighter engraved with a gull.'),
    C('rest_home', "Frank's rest home", "Frank: 'I got you into a rest home in '49. You don't remember? That's the bottle for you.'"),
    C('phone_halcyon', 'Harbourview 4-170, traced', 'The reverse directory says Harbourview 4-170 rings at Halcyon House, Gull Hill.'),
    C('sal_confession', 'Sal talks', "A cop holds Sal's brother's gambling markers. He had Sal put something in my drink on the 9th. 'He wears a nice coat.'"),
    // ---------------------------------------------------------------- chapter 4 ----
    C('welcome_back', "'Welcome back'", "The voice on the loudspeaker said welcome back. And: 'When you find her — do call.'"),
    C('been_here', 'T.R. 11/49', "Scratched low beside the cot in Room 8: my initials and November 1949. I've been here before."),
    C('fire_procedure', 'Fire procedure', 'Sign in the corridor: FIRE — ring the bell, unlock ALL rooms, patients to the lawn.'),
    C('pike_note', 'Smoke, not fire', "Pike's note in the vent: the grate leads to the corridor. 'Smoke, not fire.'"),
    C('pike_recalls', 'Pike remembers', "With his press card in his hand, Pike remembered trucks at the back gate — and 'the man in the camel coat with the gull lighter.'"),
    C('rook_file', 'My Halcyon file', "ROOK, Thomas. Room 8, 2–9 Nov 1949. Referred by Det. Lt. F. Delaney. L-series. 'Meridian inquiry memories suppressed. Recommend reinforcement if inquiry resumes.'", { doc: 'rook_file' }),
    C('witness_files', 'The other files', 'Doyle, Kerrigan, Fisk in 1949; Pike in 1951. Every one of them referred by Lt. F. Delaney.'),
    C('calypso_schedule', "Vey's appointment book", "'Sat 20 — Gala, 9 PM. Calypso loads Sat 23:00, sails 02:00.'"),
    // ---------------------------------------------------------------- chapter 5 ----
    C('calypso_rocks', "Barnaby's cargo", "The Calypso is a Gullwing ship. Last run she carried crates for the hill and 'machine parts' that were rocks — for the insurers."),
    C('report_open_hatch', "Report: 'hatch found open'", "Delaney's 1949 report: 'Forward hold hatch found open; men overcome by smoke.'", { doc: 'delaney_report' }),
    C('report_time', "Delaney 'arrives'", "Delaney's report: 'Arrived on scene 23:30, after the alarm.'", { time: '23:30', doc: 'delaney_report' }),
    C('gus_statement', 'Hammering at the hatch', "Gus's 1949 statement: hammering at the forward hatch, 'about twenty to eleven'. Dismissed: 'witness intoxicated'.", { time: '22:40', doc: 'gus_statement' }),
    C('shift_roster', 'The night shift', 'Shift roster: fourteen men logged into the forward hold for night loading at 23:00.', { time: '23:00' }),
    C('fire_log', 'Fire reported', 'Fire brigade log: fire aboard SS Meridian reported 23:15.', { time: '23:15' }),
    C('gate_walter', 'Walter signs in', "Harbor gate log: W. Marsh, 22:05. Remarks: 'for Sgt. Rook'.", { time: '22:05', doc: 'gate_log' }),
    C('gate_delaney', "Delaney's car at the gate", 'Harbor gate log: BPD car 1147, Lt. F. Delaney, 22:25.', { time: '22:25', doc: 'gate_log' }),
    C('hatch_locked', 'The hatch was locked', "The evidence padlock is still locked through the hasp the firemen sawed off. The hatch wasn't open. Somebody locked fourteen men in."),
    C('delaney_lied', 'Delaney lied', 'His car came through the harbor gate at 22:25 — before the hammering, before the fire. His report says he arrived at 23:30.'),
    C('sent_walter', "'For Sgt. Rook'", 'Walter Marsh went aboard the Meridian that night because I asked him to.'),
    C('delaney_plan', "Delaney's pocketbook", "'Sat — Calypso loads 23:00. Tail Boone. He'll lead us to the girl.'"),
    C('padlock_order', 'Twenty padlocks', 'Hask sold Gullwing Holdings twenty of these padlocks in September 1949. Frank Delaney signed for them. He haggled.'),
    // ---------------------------------------------------------------- chapter 6 ----
    C('deacon_note', "Deacon's note", "'You made me promise: if I come asking for her, lock me up. She's safe. Stay put till Sunday.'", { doc: 'deacon_note' }),
    C('overheard', 'Voices at the grating', "Vivian and Kroll on the pavement: Deacon left at four, Delaney's men are on him. 'He'll lead us to her.'"),
    C('draft', 'A draft', "My lighter's flame leans towards the old wine rack. Air is moving behind it."),
    C('est_1924', 'Established 1924', "The mermaid's lantern points at the wine rack. The poster says the Lantern opened in 1924. Deacon once told me the password was 'a bottle of the '24'."),
    C('nora_letter2', "Nora's note", "'My father talked about you. He said you were the only cop who ever shook his hand.'", { doc: 'nora_letter2' }),
    C('nora_story', "Nora's account", 'On the 8th I read her transcript twice, split the pages, hid her with Sister Agnes and made sure I never knew where. "A man who can be made to forget can be made to remember the wrong things."'),
    C('the_call', 'The call', "I dialled Harbourview 4-170 and told them where she was. I don't remember deciding to."),
    // ---------------------------------------------------------------- chapter 7 ----
    C('rocks_seen', 'Rocks for the insurers', "The 'machine parts' crates are full of harbor stone. The Calypso is meant to sink, like the Meridian burned."),
    C('badge_226', "Frank's number", 'Frank used his old badge number for everything, even when we were rookies: 2-2-6.'),
    C('telegram', 'The telegram', "'CALYPSO LOST AT SEA EXPECTED. CLAIM PAPERS READY. — A.C.'"),
    C('broadcast_plan', 'The plan', "Crane goes on WBRK at nine. Every radio in Brackwater will be tuned in. Get into the booth and put the evidence on the air."),
    // ---------------------------------------------------------------- chapter 8 ----
    C('self_notes', 'My own instructions', 'You are in the WBRK booth. You locked it yourself. Open it for nobody. Crane is on at nine. Antidote first.', { doc: 'self_notes' }),
    C('patch_card', "Engineer's card", 'To take the air from the booth: patch BOOTH MIC to PROGRAM LINE, then turn the transmitter key to BOOTH.'),
  ].map((c) => [c.id, c]),
);

const D = (id: string, a: string[], b: string[], title: string, text: string, extra: Partial<DeductionDef> = {}): DeductionDef =>
  ({ id, a, b, title, text, ...extra });

export const DEDUCTIONS: Record<string, DeductionDef> = Object.fromEntries(
  [
    D('piano_is_deacon', ['ask_piano'], ['lamplighter_record'], "Deacon is 'the piano'",
      "I told Mabel to send me to 'the piano'. Nora's record is by the Deacon Boone Trio. Deacon knows something.", {
        then: ["'Ask the piano.' Deacon Boone plays piano at the Blue Lantern — and Nora kept his record on her turntable.", 'Time I requested a song.'],
      }),
    D('i_was_drugged', ['lethe_identified'], ['lost_days', 'pocketbook'], 'I was drugged',
      "Six missing days, a drug that makes a man obedient and forgetful. Somebody didn't knock me out. They switched me off.", {
        then: ["Six days gone, and a drug that makes a man do as he's told and forget he did it.", "Nobody hit me hard enough to lose a week. Somebody switched me off.", { set: 'knows_drugged' }],
      }),
    D('evelyn_impostor', ['evelyn_claim'], ['only_child', 'family_photo', 'no_sister'], 'Evelyn is an impostor',
      "Walter and Ruth Marsh had one child. 'Evelyn Marsh' is somebody else.", {
        then: ["Nora was an only child. So who is the woman paying me fifty dollars to find her?", 'Somebody who wants Nora found more than Nora does.'],
      }),
    D('evelyn_nurse', ['phone_halcyon'], ['evelyn_watch'], 'Evelyn is a Halcyon nurse',
      'A watch pinned upside down so it can be read at a glance, carbolic soap, and a number that rings at Halcyon House. She’s a nurse — Dr. Vey’s nurse.', {
        then: ['Nurses pin their watches upside down so they can read them while they take a pulse.', "Carbolic soap. A number that rings on Gull Hill. My client works at Halcyon House."],
      }),
    D('camel_coat', ['two_men', 'gus_saw', 'meeting_attendees', 'sal_confession', 'photo_handshake'], ['delaney_coat', 'gull_lighter'],
      'The man in the camel coat', "The big man in the camel-hair coat keeps turning up: at the hotel, at the cold store, at Crane's night session. Frank wears camel hair.", {
        then: ['A big man in a camel-hair coat, with a gold lighter. Dumping me at the Sorrento, dragging me into the cold store, sitting in on Crane’s night session.', 'Frank Delaney owns a coat like that.', "I don't like where that sentence ends."],
      }),
    D('nora_at_mission', ['volunteer'], ['flowers', 'scarf'], 'Nora is at St. Brigid’s',
      'Fresh flowers on her father’s grave in St. Brigid’s churchyard, a headscarfed girl at dawn — and a headscarfed volunteer next door who wouldn’t look at me.', {
        then: ['A girl in a headscarf leaves flowers on Walter’s grave at dawn. Next door, a girl in a headscarf ladles soup and won’t meet my eye.', 'She was standing three feet from me. Nora is at St. Brigid’s Mission.'],
      }),
  ].map((d) => [d.id, d]),
);

export const TIMELINES: Record<string, TimelineDef> = {
  meridian_night: {
    id: 'meridian_night',
    title: 'The night of October 21, 1949',
    when: 'chapter=5 & has:gate_log & !tl_meridian_night',
    order: ['gate_walter', 'gate_delaney', 'gus_statement', 'shift_roster', 'fire_log', 'report_time'],
    solved: [
      { clue: 'delaney_lied' },
      { clue: 'sent_walter' },
      'Ten past ten, Walter signs in. Twenty-five past, Frank drives through the gate. Twenty to eleven, somebody hammers a hasp onto the forward hatch.',
      'Eleven, fourteen men go down into the hold. Quarter past, fire. And at half past, according to his own report, Frank Delaney ‘arrives’.',
      'He was there an hour before the fire.',
      { wait: 600 },
      "And Walter Marsh signed in at the gate 'for Sgt. Rook'.",
      'For me. I sent him aboard.',
      { music: 'sorrow' },
    ],
  },
};

const P = (id: string, name: string, text: string, notes: [string, string][] = [], portrait?: string): PersonDef =>
  ({ id, name, text, notes, portrait: portrait ?? id });

export const PEOPLE: Record<string, PersonDef> = Object.fromEntries(
  [
    P('mabel', 'Mabel Finch', 'My secretary. Sixty-one, chain-smoker, ex-court stenographer. Has seen me at my worst and charges accordingly.', [
      ['clue:ask_piano', "Kept my message for six days: 'Ask the piano.'"],
      ['clue:steno_transcript', 'Read Nora’s Pitman shorthand like a morning paper.'],
    ]),
    P('evelyn', "'Evelyn Marsh'", "My client. Says she's Nora's older sister. Pays in new bills.", [
      ['ded:evelyn_impostor', 'Nora was an only child. Evelyn is lying.'],
      ['ded:evelyn_nurse', 'A Halcyon House nurse. Real name: Vivian Hale.'],
    ]),
    P('nora', 'Nora Marsh', 'Stenographer at the Harbor Commission, 26. Missing since the 9th. Her father Walter died in the Meridian fire.', [
      ['clue:nora_visit', 'Came to me on the 8th with a folder.'],
      ['clue:deacon_promise', 'I hid her myself. Then I made sure I couldn’t find her.'],
      ['ded:nora_at_mission', 'Hiding at St. Brigid’s Mission as a soup volunteer.'],
    ]),
    P('deacon', 'Deacon Boone', 'Piano man at the Blue Lantern for thirty years. Walter Marsh’s oldest friend.', [
      ['clue:deacon_promise', 'Keeping a promise I asked him to keep against me.'],
    ]),
    P('sal', 'Sal Moretti', 'Bartender at the Blue Lantern. Polishes the same glass when he’s nervous.', [
      ['clue:sal_confession', 'Put something in my drink on the 9th because a cop owns his brother’s debts.'],
    ]),
    P('pettibone', 'Mr. Pettibone', 'Night clerk at the Hotel Sorrento. Reads pulp. Respects Do Not Disturb signs as a religion.'),
    P('delaney', 'Lt. Frank Delaney', 'My old partner. Homicide lieutenant. Big, warm, good coats.', [
      ['ded:camel_coat', 'The man in the camel-hair coat?'],
      ['clue:rook_file', 'Signed me into Halcyon House in November 1949.'],
      ['clue:delaney_lied', 'At the Meridian an hour before the fire. Lied in his report.'],
    ]),
    P('gus', 'Gus Tolliver', 'Night watchman on Pier 9 since before the pier. Talks to gulls. Nobody listens to Gus.', [
      ['clue:gus_hammering', 'Heard hammering on the Meridian’s hatch before the fire.'],
    ]),
    P('kessler', 'Otto Kessler', 'Pharmacist on Lyme Street. Half-moon glasses, whole-moon conscience.'),
    P('abernathy', 'Harold Abernathy', 'Editor of the Brackwater Gazette. Shirtsleeves, green visor, overdraft.'),
    P('pike', 'Wendell Pike', 'Gazette reporter, missing since August after going up Gull Hill.', [
      ['clue:pike_recalls', 'Patient 14 at Halcyon House. Remembering, slowly.'],
    ]),
    P('agnes', 'Sister Agnes', 'Runs St. Brigid’s Mission. Feeds the forgotten and forgets nothing.'),
    P('kerrigan', 'Mick Kerrigan', 'Meridian deckhand. Came down from Gull Hill in 1950 with no memory of the fire, except at night.'),
    P('lillian', 'Lillian Gray', 'Typist at the Harbor Commission, Nora’s desk neighbour. Gossip with a conscience.'),
    P('pruett', 'Miss Pruett', 'The Commissioner’s secretary. Guards the OUT tray like the crown jewels.'),
    P('vey', 'Dr. Lucian Vey', 'Director of Halcyon House Rest Hospital. Collects clocks.', [
      ['clue:lethe_identified', 'His hospital buys the drug that ate my week.'],
      ['clue:rook_file', 'Treated me in 1949. Recommended reinforcement.'],
    ]),
    P('crane', 'Augustus Crane', 'Harbor Commissioner. Philanthropist, speechmaker, shipowner.', [
      ['clue:crane_gullwing', 'Owns Gullwing Holdings — and owned the Meridian.'],
    ]),
    P('pruitt', 'Officer Danny Pruitt', 'Desk officer at the 1st Precinct. Studied my old cases at the academy, poor kid.'),
    P('barnaby', 'Barnaby', 'Cellmate. Former Calypso deckhand. A philosopher of the bottle.'),
    P('hask', 'Ignatius Hask', 'Locksmith, ground floor of my building. Taught me to pick locks. Still disapproves.'),
    P('cobb', 'Cobb', 'Gravedigger at St. Brigid’s. Knows who visits whom.'),
    P('kroll', 'Kroll', 'Halcyon orderly. Built like a cold store door.'),
    P('morrow', 'Captain Morrow', 'Frank’s superior. Honest, as far as anybody knows.'),
  ].map((p) => [p.id, p]),
);
