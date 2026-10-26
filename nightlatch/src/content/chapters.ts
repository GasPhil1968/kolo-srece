import type { ChapterDef, ObjectiveDef } from '../engine/types';

const O = (id: string, text: string, done: string, hints: string[], when?: string): ObjectiveDef => ({ id, text, done, hints, when });

export const CHAPTERS: ChapterDef[] = [
  {
    n: 1,
    title: 'Room Nine',
    sub: 'Monday, October 15, 1951',
    complete: 'c1_end',
    objectives: [
      O('c1_escape', 'Get out of Room 9.', 'visited:hotel_lobby', [
        'The door is locked from the outside, but the key is still in the lock on the far side.',
        'If something on the other side could catch the key, I could pull it under the door. The mattress might be hiding something flat.',
        'Slide the newspaper (under the mattress) under the door. Straighten the wardrobe’s hanger on the radiator, push the key out through the keyhole, then pull the paper back.',
      ]),
      O('c1_how', 'Find out how I got here.', 'clue:two_men', [
        'The night clerk downstairs might remember who carried me in.',
        'Ask Pettibone at the front desk who brought me.',
      ], 'visited:hotel_lobby'),
      O('c1_coat', 'Get my coat back.', 'has:lighter', [
        'Pettibone is holding my coat behind the desk.',
        'House rules: key for coat. Give Pettibone the room key.',
      ], 'visited:hotel_lobby'),
      O('c1_office', 'Go to my office on Marrow Street.', 'visited:office', [
        'My office is on Marrow Street.',
        'Leave the hotel by the street door and pick my office on the city map.',
      ], 'has:lighter'),
      O('c1_mabel', 'Find out what Mabel knows.', 'clue:ask_piano', [
        'Mabel ran the office while I was gone.',
        'Ask Mabel whether I told her anything before I left.',
      ], 'visited:office'),
      O('c1_client', 'Hear out the client.', 'c1_hired', [
        'There’s a woman waiting in the client chair.',
        'Talk to Evelyn Marsh and take the case.',
      ], 'visited:office'),
      O('c1_flat', 'Search Nora’s apartment.', 'clue:nora_letter & clue:lamplighter_record', [
        'Evelyn gave me a key to Nora’s flat at the Bellwether Apartments.',
        'Typists throw away carbon paper. And somebody left a record on the gramophone.',
        'Take the carbon paper from the wastebasket and use it on the window; play the gramophone.',
      ], 'c1_hired'),
      O('c1_piano', '“Ask the piano.”', 'clue:on_ice', [
        'Mabel’s message and Nora’s record point at the same man.',
        'In the Notebook’s Deduce tab, link “Ask the piano” with “Lullaby of the Lamplighter”.',
        'Then go to the Blue Lantern and ask Deacon to play “Lullaby of the Lamplighter”.',
      ], 'clue:ask_piano'),
      O('c1_pier', 'Go to Pier 9.', 'c1_end', [
        'Deacon says I hid my proof “on ice” at Pier 9.',
        'Pick Pier 9 on the city map.',
      ], 'clue:on_ice'),
    ],
  },
  {
    n: 2,
    title: 'On Ice',
    sub: 'Tuesday, October 16, 1951',
    complete: 'c2_end',
    objectives: [
      O('c2_ice', 'Find what I hid \u201con ice\u201d.', 'has:minutes1', [
        'My notebook\u2019s back cover says: \u201cOn ice \u2014 B3.\u201d The cod hang in lettered rows.',
        'The third cod in row B has something inside it. I need something sharp.',
        'Take the ice pick from the workbench and use it on the third cod in row B.',
      ]),
      O('c2_out', 'Get out of the cold store.', 'c2_door_open', [
        'The door\u2019s inside release has lost its handle. The handle is frozen into the brine tub.',
        'Salt melts ice. Then the handle needs fitting, and the frozen spindle needs warming.',
        'Rock salt on the tub, ice pick on the tub, handle on the spindle, lighter on the spindle, then turn it.',
      ]),
      O('c2_crates', 'See what\u2019s in the hospital crates.', 'has:vial | clue:lethe_identified', [
        'The crates marked HALCYON HOUSE are nailed shut.',
        'Pry a crate open with the ice pick.',
      ]),
      O('c2_gus', 'Ask the watchman about the Meridian.', 'clue:gus_hammering', [
        'Gus Tolliver has watched Pier 9 for forty years.',
        'Talk to Gus about the Meridian.',
      ], 'c2_door_open'),
      O('c2_vial', 'Find out what\u2019s in the vial.', 'clue:lethe_identified', [
        'A pharmacist could analyse the vial.',
        'Give the vial to Kessler at his pharmacy, go somewhere else, and come back for the result.',
      ], 'has:vial | c2_vial_testing'),
      O('c2_drugged', 'Work out what happened to my six days.', 'ded:i_was_drugged', [
        'What Kessler told me about L-7, and the six days missing from my life.',
        'In the Notebook, link \u201cL-7 is scopolamine\u201d with \u201cSix days gone\u201d.',
      ], 'clue:lethe_identified'),
      O('c2_pike', 'Look into Wendell Pike, the missing reporter.', 'has:pike_camera', [
        'Kessler mentioned Halcyon House; so did the crates. The Gazette had a reporter on it.',
        'Ask Abernathy at the Gazette about Pike, then about Pike\u2019s desk. Pike\u2019s press card is on the cork board.',
        'Pike\u2019s drawer opens with his press number: 4-1-7.',
      ], 'clue:shipping_label | clue:lethe_identified'),
      O('c2_kerrigan', 'Find the dockhand from Pike\u2019s notes.', 'clue:kerrigan', [
        'Pike says Mick Kerrigan is at St. Brigid\u2019s Mission.',
        'Ask Sister Agnes for Kerrigan, then ask Kerrigan about the Meridian.',
      ], 'clue:pike_notes'),
      O('c2_film', 'Develop Pike\u2019s film in the Gazette darkroom.', 'c2_end', [
        'Abernathy said the darkroom\u2019s free after the night shift.',
        'Go to the Gazette and use the darkroom door.',
      ], 'has:pike_camera & ded:i_was_drugged & has:minutes1 & clue:kerrigan'),
    ],
  },
  {
    n: 3,
    title: 'Safelight',
    sub: 'Wednesday, October 17, 1951',
    complete: 'c3_end',
    objectives: [
      O('c3_film', 'Develop the film.', 'has:contact_sheet', [
        'Film can\u2019t see even a red light. It goes into the tank inside the changing bag.',
        'Developer, stop bath, fixer, in that order; then wash, dry, enlarge and print.',
        'Camera on the changing bag; pour developer, stop, fixer; wash at the sink; hang the negatives, take them down, put them in the enlarger, expose the paper.',
      ]),
      O('c3_key', 'Find where I hid the key.', 'c3_unlocked', [
        'The last frame on the roll shows where I put the key. It\u2019s in a dark corner.',
        'Once the prints are made, the white light is safe. Something high on the wall needs a stool.',
        'Flip the light switch, move the stool, open the wall timer, and use the key on the padlock.',
      ]),
      O('c3_sister', 'Find out who \u201cEvelyn Marsh\u201d really is.', 'ded:evelyn_impostor & ded:evelyn_nurse', [
        'Nora\u2019s family, and Evelyn\u2019s telephone number, might say something.',
        'The Marsh grave at St. Brigid\u2019s cemetery; the police reverse directory at the precinct.',
        'Link \u201cEvelyn Marsh\u2019s story\u201d with \u201cThe Marsh headstone\u201d, and \u201cHarbourview 4-170, traced\u201d with \u201cEvelyn\u2019s watch\u201d.',
      ], 'c3_unlocked'),
      O('c3_minutes', 'Find out what Nora heard on October 3.', 'clue:steno_transcript', [
        'Nora worked in the typing pool at the Harbor Commission.',
        'Lillian knows where Nora\u2019s steno pad went. Persuade her to get Miss Pruett away \u2014 show her some proof.',
        'Take the pad from Miss Pruett\u2019s OUT tray and give it to Mabel to read.',
      ], 'c3_unlocked'),
      O('c3_grave', 'Visit Walter Marsh\u2019s grave.', 'clue:flowers', [
        'Walter is buried at St. Brigid\u2019s.',
        'Look at the card in the flowers on the Marsh grave.',
      ], 'c3_unlocked'),
      O('c3_picks', 'Get my lock picks back from Hask.', 'has:lockpicks', [
        'Hask, downstairs from my office, is holding my picks as collateral.',
        'His drawer is locked. The wire from my hanger should do.',
      ], 'c3_unlocked'),
      O('c3_hill', 'Get inside Halcyon House.', 'c3_end', [
        'Everything points up Gull Hill. Pick Halcyon House on the city map.',
        'The gate is chained, but the wall can be climbed with something to stand on.',
        'Use the ash-can and crate under the oak limb.',
      ], 'map:halcyon'),
    ],
  },
  {
    n: 4,
    title: 'Room Eight',
    sub: 'Thursday, October 18, 1951',
    complete: 'c4_end',
    objectives: [
      O('c4_out', 'Get out of Room 8.', 'c4_door_open', [
        'The sign across the corridor says what they do in a fire.',
        'Smoke, not fire. The vent leads to the corridor. Breakfast might help \u2014 press the call button.',
        'Flatten the spoon on the concrete; open the vent; slit the mattress; wet the straw with the cup; straw in the vent; light it with the matches.',
      ]),
      O('c4_files', 'Search Dr. Vey\u2019s records.', 'has:halcyon_files', [
        'The records office is locked. I have my picks.',
        'Pick the records office lock. The key to the 1949 cabinet is in Vey\u2019s desk drawer.',
      ], 'c4_door_open'),
      O('c4_pike', 'Help Patient 14 remember who he is.', 'clue:pike_recalls', [
        'Patient 14 is Wendell Pike.',
        'Show Pike his own press card.',
      ], 'c4_door_open'),
      O('c4_escape', 'Get out of Halcyon House.', 'c4_escaped', [
        'Nobody checks the laundry.',
        'Climb into the laundry cart in the corridor.',
      ], 'has:halcyon_files'),
    ],
  },
  {
    n: 5,
    title: 'Holding',
    sub: 'Thursday night, October 18, 1951',
    complete: 'c5_end',
    objectives: [
      O('c5_box', 'Get the Meridian evidence in front of me.', 'c5_box', [
        'Officer Pruitt admires my old cases.',
        'Pruitt will carry a message to the evidence room for a man who asks nicely. Find something to write with and something to write on.',
      ]),
      O('c5_hatch', 'Prove the hatch was locked.', 'clue:hatch_locked', [
        'Delaney\u2019s report says the hatch was found open.',
        'Ask Pruitt what the report says about the hatch, then show him the padlock.',
      ], 'c5_box'),
      O('c5_timeline', 'Put the night of the fire in order.', 'tl_meridian_night', [
        'The gate log, Gus\u2019s statement, the roster, the fire log and Delaney\u2019s report all have times.',
        'Open the Notebook\u2019s Timeline tab and order the six cards by time.',
      ], 'c5_box'),
      O('c5_out', 'Get out of the cell.', 'c5_cell_open', [
        'Show Pruitt the times. Then the keys might come closer.',
        'Barnaby says: swing something. Take the blanket and use it on the keys, then the keys on the door.',
      ], 'clue:hatch_locked'),
      O('c5_things', 'Get my things back.', 'c5_drawer', [
        'Frank locked my belongings in his own desk.',
        'Use the cell keys on the drawer of Delaney\u2019s desk.',
      ], 'c5_cell_open'),
      O('c5_padlock', 'Find out where the padlock came from.', 'clue:padlock_order', [
        'A locksmith would know a padlock.',
        'Show Hask the Meridian padlock.',
      ], 'c5_drawer'),
      O('c5_warn', 'Warn Deacon.', 'c5_end', [
        'Frank plans to follow Deacon to Nora.',
        'Go to the Blue Lantern.',
      ], 'c5_drawer & clue:padlock_order'),
    ],
  },
  {
    n: 6,
    title: 'The Lantern Cellar',
    sub: 'Saturday, October 20, 1951 \u2014 before dawn',
    complete: 'c6_end',
    objectives: [
      O('c6_listen', 'Find out what\u2019s happening outside.', 'clue:overheard', ['Voices from the street.', 'Listen at the pavement grating.']),
      O('c6_where', 'Work out where Nora is hiding.', 'ded:nora_at_mission', [
        'Who did I see in a headscarf? Who leaves flowers at dawn?',
        'In the Notebook, link \u201cThe volunteer\u201d with \u201cFresh flowers\u201d (or \u201cThe Sunday visitor\u201d).',
      ]),
      O('c6_way', 'Find another way out of the cellar.', 'c6_rack_open', [
        'Speakeasies always had a back door. Watch a flame for a draft; the mural and the poster point somewhere.',
        'Pull the clean bottle of 1924 on the wine rack.',
      ]),
      O('c6_light', 'Get some light for the tunnel.', 'has:lantern_lit', [
        'There\u2019s an old lantern, but it\u2019s dry. Something on the shelf would burn.',
        'Fill the lantern with the 151-proof rum, then light it with the lighter.',
      ], 'c6_rack_open'),
      O('c6_page', 'Look in the piano-roll box.', 'has:minutes2', ['Deacon\u2019s old player piano has a box on top.', 'Open the piano-roll box.']),
      O('c6_nora', 'Get to Nora before they do.', 'c6_end', [
        'The tunnel runs down to the seawall below St. Brigid\u2019s.',
        'Go through the tunnel and climb the ladder.',
      ], 'has:lantern_lit & ded:nora_at_mission'),
    ],
  },
  {
    n: 7,
    title: 'Below the Waterline',
    sub: 'Saturday, October 20, 1951',
    complete: 'c7_end',
    objectives: [
      O('c7_light', 'Get some light.', 'c7_lit', [
        'They took my coat, but not my hat.',
        'Examine my hat in the inventory, then use the matches on the ship\u2019s lantern.',
      ]),
      O('c7_nora', 'Reach Nora.', 'c7_contact', ['Someone moved on the other side of the bulkhead.', 'Knock on the vent pipe.']),
      O('c7_up', 'Get up to the hatch.', 'c7_out', [
        'The cargo net hangs out of reach. The light crates could make a step.',
        'Drag the first Halcyon crate; push the oil drum; stack the second crate. Ask Nora for something sharp, then cut the tarpaulin from the net.',
      ], 'c7_lit'),
      O('c7_free', 'Free Nora.', 'c7_nora_free', ['Her hatch is bolted on deck.', 'Slide the bolt on the forward hatch.'], 'c7_out'),
      O('c7_kroll', 'Get past Kroll.', 'c7_barrels', [
        'Kroll watches the gangway. Something noisy would draw him off.',
        'Cut the rope lashing the barrels with Walter\u2019s knife.',
      ], 'c7_out'),
      O('c7_case', 'Get my evidence back.', 'c7_case_open', [
        'Delaney\u2019s briefcase is in the captain\u2019s cabin.',
        'Frank uses one number for everything: his badge. Look at the briefcase, then try 2-2-6.',
      ], 'c7_barrels'),
      O('c7_off', 'Get off the ship with Nora.', 'c7_escaped', ['Down the gangway while Kroll is busy.', 'Use the gangway.'], 'c7_case_open & c7_nora_free'),
      O('c7_key', 'Get a key to the WBRK booth.', 'has:booth_key', ['Hask fitted City Hall\u2019s locks.', 'Ask Hask about a key for the booth.'], 'c7_planned'),
      O('c7_pass', 'Get into the gala.', 'has:press_pass', ['A newspaperman would have a pass.', 'The captain kept blank accreditation forms. The purser kept a stamp. Put them together.'], 'c7_planned'),
      O('c7_log', 'Get Gus\u2019s own log.', 'has:gus_log', ['Gus keeps his own watch log.', 'Ask Gus for his log, for Walter.'], 'c7_planned'),
      O('c7_antidote', 'Get something to clear my head.', 'has:antidote', ['Kessler mentioned physostigmine.', 'Ask Kessler for physostigmine.'], 'c7_planned'),
      O('c7_go', 'Go to City Hall.', 'c7_end', ['Crane speaks at nine.', 'Pick City Hall on the map.'], 'map:cityhall'),
    ],
  },
  {
    n: 8,
    title: 'On Air',
    sub: 'Saturday, October 20, 1951 \u2014 8:47 PM',
    complete: 'game_complete',
    objectives: [
      O('c8_clear', 'Clear my head.', 'c8_clear', ['My notes say the antidote comes first.', 'Examine the physostigmine ampoule in the inventory.']),
      O('c8_patch', 'Patch the booth into the program line.', 'c8_patched', [
        'The engineer\u2019s card on the wall says how.',
        'Read the card, then use the patch bay: connect BOOTH MIC to PROGRAM LINE.',
      ], 'c8_clear'),
      O('c8_lamp', 'Keep Frank from knowing we\u2019re live.', 'c8_bulb', ['The ON AIR lamp would give it away.', 'Unscrew the ON AIR bulb.'], 'c8_clear'),
      O('c8_nine', 'Wait for Crane to go on the air.', 'c8_nine', ['Crane speaks at nine.', 'Use the clock.'], 'c8_clear'),
      O('c8_live', 'Take the air.', 'c8_live', ['The transmitter switch takes a key.', 'Use the booth key on the transmitter.'], 'c8_patched & c8_bulb & c8_nine'),
      O('c8_case', 'Tell Brackwater the truth, in order.', 'c8_s4', [
        'My notes: the padlock, the ship, the hospital, the minutes.',
        'Show the padlock, the Calypso papers, the Halcyon files, then page three of the transcript.',
      ], 'c8_live'),
      O('c8_frank', 'Get Frank to tell it himself.', 'c8_confessed', [
        'Frank doesn\u2019t know the booth is live.',
        'On the talkback: show him the gate log, then remind him about Walter.',
      ], 'c8_s4'),
      O('c8_roof', 'Go after Frank.', 'c8_surrender', [
        'Frank ran up, not down.',
        'On the roof, hold out the thing Frank gave me in 1938.',
      ], 'c8_confessed'),
      O('c8_end', 'Say goodbye to Pier 9.', 'game_complete', ['Nora is waiting.', 'Talk to Nora.'], 'c8_dawn'),
    ],
  },
];
