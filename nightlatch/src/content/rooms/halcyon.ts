import type { DialogDef, RoomDef } from '../../engine/types';
import { CH4_START, CH5_START } from '../story';
import { N, S, anim, clue, give, otherwise, pick, set, sfx, take, wait, when } from '../dsl';

/** Ch3's last stop: the wall of Halcyon House, and the welcome committee. */
const gateCapture = [
  { walk: 'wall_spot' },
  'Ash-can, crate, oak limb, wall. Halcyon House keeps its rest very private, and its ladders very public.',
  anim('reach_side'), sfx('crate_creak'),
  { npc: 'vivian', room: 'halcyon_gate', at: 'start', face: 'right' as const },
  S('vivian', 'Good evening, Mr. Rook.'),
  { face: 'left' as const },
  'Miss Marsh.',
  S('vivian', 'Nurse Hale. Vivian, to my friends. You have so very few of those left.'),
  'Where’s Nora?',
  S('vivian', 'Exactly what we would like to ask you. Again.'),
  sfx('sap'), { shake: 250 },
  N('A pinch in the neck, like a wasp with a medical degree.'),
  { fade: 'out' as const, ms: 900 },
  { npc: 'vivian', hide: true },
  set('c3_end'),
  ...CH4_START,
];

export const halcyon_gate: RoomDef = {
  id: 'halcyon_gate',
  name: 'Halcyon House',
  music: 'halcyon',
  amb: 'rain_street',
  enter: [{
    once: 'c3_gate_arrive',
    do: [
      N('Gull Hill at dusk, in the rain. Halcyon House sat at the top like a wedding cake left out in the weather.'),
      'The gate’s chained. The wall isn’t high. Neither am I, but I’m motivated.',
    ],
  }],
  hotspots: {
    gate: {
      name: 'gate',
      look: ['Wrought iron, eight feet, with spikes on top that somebody has bothered to sharpen. The chain is new.'],
      use: [anim('reach_side'), sfx('chain_rattle'), 'Chained and padlocked. Halcyon House keeps its rest very private.'],
      items: { lockpicks: ['Not with the whole front of the house watching. There’s a figure in that lit window.'] },
    },
    plaque: {
      name: 'plaque',
      look: ['HALCYON HOUSE — REST HOSPITAL — EST. 1888. “Rest Is The Cure.”', 'Somebody should tell the cure that it’s been resting long enough.'],
    },
    wall: {
      name: 'wall',
      look: ['A high wall with ivy, and broken bottle glass set along the top. Ivy is nature’s ladder. Glass is nature’s opinion.'],
      use: ['I can’t get a grip from the ground. I need something to stand on.'],
    },
    ashcan: {
      name: 'ash-can and crate',
      look: ['An ash-can with a crate on top of it, right under the oak limb. Somebody’s been using this as a step. Somebody with a key, presumably, who felt like exercise.'],
      use: [{ if: 'chapter=3 & !c3_end', then: gateCapture, else: ['Not again.'] }],
    },
    oak: {
      name: 'oak tree',
      look: ['An old oak on the inside of the wall. One limb hangs over the top like an invitation.'],
      use: ['I can’t reach it from the ground. From the top of that ash-can, maybe.'],
    },
    van: {
      name: 'laundry van',
      look: ['A laundry van parked by the side gate. BRACKWATER STEAM LAUNDRY — WE TAKE IN EVERYTHING.'],
      use: [anim('reach_side'), 'Locked. Laundry is a serious business up here.'],
    },
    building: {
      name: 'Halcyon House',
      look: ['A white Victorian pile with barred windows. Some of the windows are lit. None of them look warm.', 'In one of them, somebody is standing very still, watching the gate.'],
    },
  },
};

const fireAlarm = [
  anim('reach_side'), sfx('match'), take('matches'), set('c4_smoke'),
  N('The damp straw caught, sulked, and filled the vent with fat gray smoke. The vent did the rest.'),
  wait(900), sfx('alarm_bell'), { shake: 300 },
  S('kroll', 'Fire! Fire on B corridor!'),
  'Running feet. Somebody shouting about procedure.',
  wait(600), sfx('unlock'), set('c4_door_open'),
  'And somebody, God bless procedure, has just unlocked every door on the corridor.',
  { autosave: 'Chapter 4 — Smoke, not fire' },
];

export const halcyon_cell: RoomDef = {
  id: 'halcyon_cell',
  name: 'Room 8, Halcyon House',
  music: 'locked',
  amb: 'sanatorium',
  objects: {
    hatch_open: 'c4_tray & !c4_tray_taken',
    tray: 'c4_tray & !c4_tray_taken',
    mattress_torn: 'c4_mattress_torn',
    grate_open: 'c4_grate_open',
    smoke: 'c4_smoke',
    door_open: 'c4_door_open',
  },
  hotspots: {
    door: {
      name: 'door',
      look: [pick(when('c4_door_open', 'Open. Smoke and shouting in the corridor.'), otherwise('Steel, with no handle on this side. Hospitals are thoughtful like that.'))],
      exit: {
        to: 'halcyon_corridor', at: 'start', when: 'c4_door_open',
        blocked: [anim('reach_side'), 'No handle, no keyhole, no mercy.'],
      },
    },
    window: {
      name: 'observation window',
      verb: 'Look through',
      look: ['Through the wired glass: a white-tiled corridor, and a sign on the opposite wall.', clue('fire_procedure'),
        { narrate: 'FIRE — RING THE BELL — UNLOCK ALL ROOMS — PATIENTS TO THE LAWN.' }],
      use: ['Through the wired glass: a white-tiled corridor, and a sign on the opposite wall.', clue('fire_procedure'),
        { narrate: 'FIRE — RING THE BELL — UNLOCK ALL ROOMS — PATIENTS TO THE LAWN.' }],
    },
    hatch: {
      name: 'food hatch',
      verb: 'Take from',
      look: [pick(when('c4_tray & !c4_tray_taken', 'A tray on the hatch ledge.'), otherwise('A food hatch. It opens from the outside, when they feel like it.'))],
      use: [pick(
        when('c4_tray & !c4_tray_taken', anim('reach_side'), give('spoon'), give('cup'), give('pills'), set('c4_tray_taken'),
          'A tin spoon, a cup of water and two white pills. Breakfast of the forgotten.',
          'I’ll take the pills later. Much later. Never.'),
        otherwise('Shut. Pushing it gets me nowhere, slowly.'),
      )],
    },
    button: {
      name: 'call button',
      verb: 'Press',
      look: ['A call button. PRESS FOR ATTENDANT. Press hard enough and maybe you get one.'],
      use: [pick(
        when('c4_tray', 'I’ve had breakfast. Twice would make them suspicious.'),
        otherwise(anim('reach_side'), sfx('buzzer'), wait(900), sfx('creak'), set('c4_tray'),
          S('kroll', 'Breakfast. Eat it all. Doctor’s orders.'), 'The hatch slides open and a tray slides in.'),
      )],
    },
    vent: {
      name: 'ventilation grate',
      verb: 'Search',
      look: [pick(
        when('c4_smoke', 'The vent, pouring smoke out into the corridor.'),
        when('c4_grate_open', 'The vent’s open. It breathes out into the corridor.'),
        otherwise('A ventilation grate, high on the wall, held on by four screws. I can reach it standing on the cot.'),
      )],
      use: [pick(
        when('c4_grate_open & !c4_stash_taken', anim('reach_side'), give('matches'), set('c4_stash_taken'),
          'Matches, wrapped in a scrap of paper. There’s writing on the paper.', clue('pike_note'),
          { narrate: '“If you’re reading this you’re in Room 8. The grate leads to the corridor. Smoke, not fire. — W.P., Patient 14”' },
          'Pike. Pike was in this room too.'),
        when('c4_grate_open', 'Just air, going somewhere I’d like to go.'),
        otherwise('The screws need a screwdriver. I left mine in my other life.'),
      )],
      items: {
        flat_spoon: [pick(
          when('c4_grate_open', 'It’s off already.'),
          otherwise(anim('reach_side'), sfx('metal_clank'), set('c4_grate_open'),
            'Four screws, one flattened spoon, a lot of patience. The grate comes away.',
            'Somebody’s been here before me. There’s a twist of paper wedged inside.'),
        )],
        spoon: ['The handle’s too round to turn a screw. I’d need to flatten it.'],
        damp_straw: [pick(
          when('c4_straw_in', 'There’s straw in there already.'),
          when('c4_grate_open', anim('reach_side'), take('damp_straw'), set('c4_straw_in'), 'I stuff the damp straw into the vent.'),
          otherwise('The grate’s in the way.'),
        )],
        straw: ['Dry straw would just burn. I want smoke, not a cremation.'],
        matches: [pick(
          when('c4_smoke', 'It’s smoking nicely.'),
          when('c4_straw_in', ...fireAlarm),
          when('c4_grate_open', 'There’s nothing in the vent to light. Yet.'),
          otherwise('Through a grate? I’d just singe the paint.'),
        )],
      },
    },
    cot: {
      name: 'cot',
      look: ['A cot bolted to the floor. Even the furniture’s a patient here.'],
      use: ['I lie down. Then I remember where I am and get up.'],
    },
    mattress: {
      name: 'mattress',
      verb: 'Tear',
      look: [pick(when('c4_mattress_torn', 'Slit open. Straw spills out of it like an old man’s beard.'), otherwise('A thin mattress, stuffed with straw by the crackle of it.'))],
      use: [pick(
        when('c4_mattress_torn & !has:straw & !has:damp_straw & !c4_straw_in', anim('pickup_side'), give('straw'), 'Another handful of straw.'),
        when('c4_mattress_torn', 'I’ve got what straw I need.'),
        otherwise('The ticking’s too tough to tear with my fingers.'),
      )],
      items: {
        flat_spoon: [pick(
          when('c4_mattress_torn', 'Already opened.'),
          otherwise(anim('pickup_side'), sfx('cloth_rip'), set('c4_mattress_torn'), give('straw'),
            'I slit the ticking. Straw. Old straw, dry as a sermon.'),
        )],
        spoon: ['A round spoon won’t cut ticking. It needs an edge.'],
      },
    },
    concrete: {
      name: 'bare concrete',
      look: ['A strip of floor where the padding’s been torn away. Rough concrete. Somebody did that with their fingernails.'],
      use: ['I’d rather not think about the fingernails.'],
      items: {
        spoon: [anim('pickup_side'), sfx('spoon_scrape'), take('spoon'), give('flat_spoon'),
          'I grind the spoon’s handle against the concrete until it’s flat as a screwdriver.',
          'It takes a while. I’ve got nothing but while.'],
      },
    },
    speaker: {
      name: 'loudspeaker',
      look: ['A loudspeaker grille. Quiet now. I preferred it that way.'],
      use: ['Hello? Nothing. It only talks when it wants something.'],
    },
    scratches: {
      name: 'scratches',
      look: ['Scratched low beside the cot leg: T.R. 11/49.', clue('been_here'), { music: 'revelation' },
        'Those are my initials. November, two years ago.', 'I’ve been in this room before.'],
    },
  },
};

const escape = [
  anim('pickup_side'), 'I climb into the laundry cart and pull a sheet over my head. Dignity can wait in the corridor.',
  { fade: 'out' as const, ms: 700 }, sfx('van'),
  N('Nobody checks the laundry. Laundry’s beneath everybody.'),
  N('The van stopped at the bottom of Gull Hill so the driver could light a cigarette. I rolled out with the sheets and walked home the long way.'),
  set('c4_escaped'),
  { goto: 'office', at: 'from_map' },
];

export const halcyon_corridor: RoomDef = {
  id: 'halcyon_corridor',
  name: 'Halcyon House, B corridor',
  music: 'halcyon',
  amb: 'sanatorium',
  npcs: [{ id: 'pike', at: 'pike_spot', face: 'left', talk: [{ dialog: 'pike4' }], items: { press_card: [] } }],
  enter: [{ once: 'c4_corridor', do: [N('The corridor was empty. Through the barred windows the patients stood on the lawn in their dressing gowns, being counted by nurses who couldn’t count.')] }],
  hotspots: {
    notice: {
      name: 'fire notice',
      look: ['FIRE PROCEDURE. On the bell, all staff escort patients to the front lawn. Do not use the service stairs. Do not panic. Do not discuss the drill with visitors.', 'Somebody wrote this expecting nothing to ever burn here. Somebody was wrong.'],
    },
    service_door: {
      name: 'service stairs',
      look: ['The service stairs, down to the kitchens and the laundry. STAFF ONLY.'],
      use: [anim('reach_side'), sfx('door_locked'), 'Locked from the other side. The only things that leave this way are sheets and secrets.'],
    },
    exit_cell: {
      name: 'Room 8',
      look: ['Room 8. My room, twice now. I’d like it to stay a set of two.'],
      exit: { to: 'halcyon_cell', at: 'door_spot' },
    },
    ward_door: {
      name: 'ward',
      look: ['Ward B: beds in rows, all empty. Everyone’s on the lawn.'],
      use: ['Nothing in there but the smell of other people’s bad dreams.'],
    },
    exit_office: {
      name: 'records office',
      look: [pick(when('c4_office_open', 'The records office. Dr. Vey’s.'), otherwise('A door marked RECORDS — DR. L. VEY. Locked.'))],
      exit: {
        to: 'halcyon_office', at: 'start', when: 'c4_office_open',
        blocked: [anim('reach_side'), sfx('door_locked'), 'Locked. Dr. Vey doesn’t like his records wandering.'],
      },
      items: {
        lockpicks: [pick(
          when('c4_office_open', 'It’s open.'),
          otherwise(anim('reach_side'), sfx('lock_click'), set('c4_office_open'), 'Tension wrench, rake, a little prayer to Hask.', 'Click.'),
        )],
      },
    },
    station: {
      name: 'nurses’ station',
      look: ['The nurses’ station. A telephone, a sign-out board, and a key hook with no keys on it.'],
    },
    roster: {
      name: 'patient roster',
      look: ['Room 14: PIKE, W. Room 8 — my room — has no name on it. Just a dash.', 'They don’t even give you a name here. They give you a number and a dash.'],
    },
    key_hook: {
      name: 'key hook',
      look: ['An empty key hook. The keys are on Kroll’s belt, out on the lawn.'],
    },
    laundry_cart: {
      name: 'laundry cart',
      verb: 'Climb into',
      look: ['A laundry cart full of dirty sheets, waiting for the van.'],
      use: [pick(
        when('has:halcyon_files', ...escape),
        otherwise('A man could hide in there. I’ve still got business in this building first.'),
      )],
    },
    windows: {
      name: 'windows',
      look: ['Patients on the lawn in dressing gowns, nurses with clipboards. Somebody is ringing a handbell for no reason at all.'],
    },
    fire_bell: {
      name: 'fire bell',
      look: ['The fire bell, ringing its brass heart out. God bless it.'],
    },
    portrait: {
      name: 'portrait',
      look: ['The founder, 1888. Under the frame: “Rest Is The Cure.” Someone has scratched underneath: “FOR WHOM?”'],
    },
    wheelchair: {
      name: 'wheelchair',
      look: ['An empty wheelchair, waiting for someone with nowhere to go.'],
    },
  },
};

export const halcyon_office: RoomDef = {
  id: 'halcyon_office',
  name: 'Dr. Vey’s office',
  music: 'halcyon',
  amb: 'clock_ticks',
  objects: { cabinet_open: 'c4_cabinet_open' },
  hotspots: {
    regulator: {
      name: 'wall clock',
      look: ['A Vienna regulator, beating like a polite heart. Eight minutes past ten, same as all the others.'],
      use: ['I leave it alone. In this office, I suspect stopping a clock counts as a symptom.'],
    },
    longcase: {
      name: 'grandfather clock',
      look: ['A longcase clock taller than me, with a moon dial that’s smiling at something private.', 'Of all the clocks in the room, one has stopped: a little carriage clock with cracked glass, at twenty to eleven.'],
      use: ['The pendulum swings on without my help. It’s the only thing in Halcyon House that does.'],
    },
    exit_corridor: {
      name: 'door',
      look: ['The door back to the corridor.'],
      exit: { to: 'halcyon_corridor', at: 'from_office' },
    },
    desk: {
      name: 'desk',
      look: ['Dr. Vey’s desk: a blotter, an appointment book, a fountain pen and a silence you could cut with a scalpel.'],
    },
    drawer: {
      name: 'desk drawer',
      verb: 'Open',
      look: ['The desk drawer.'],
      use: [pick(
        when('c4_cabinet_key', 'Prescription pads and peppermints. The doctor has a sweet tooth.'),
        otherwise(anim('reach_side'), sfx('drawer_open'), set('c4_cabinet_key'),
          'A small brass key on a tag marked 1949.', 'Dr. Vey files his sins by year.'),
      )],
    },
    appt_book: {
      name: 'appointment book',
      verb: 'Read',
      look: ['Dr. Vey’s appointment book.'],
      use: [anim('reach_side'), { sfx: 'page_turn' }, 'Saturday the 20th: “Gala, 9 P.M. Calypso loads 23:00, sails 02:00.”', clue('calypso_schedule'),
        'Friday: “L.D. — the girl?” with a question mark someone has gone over three times.'],
    },
    cabinet_1949: {
      name: 'cabinet marked 1949',
      verb: 'Open',
      look: ['A filing cabinet labelled 1949.'],
      use: [pick(
        when('c4_cabinet_open & has:halcyon_files', 'I have what I came for. I wish I didn’t.'),
        when('c4_cabinet_open', anim('reach_side'), give('halcyon_files'), 'I take the files back.'),
        when('c4_cabinet_key', ...readFile()),
        otherwise('Locked. The key will be somewhere close; doctors keep their secrets within reach.'),
      )],
      items: {
        lockpicks: [pick(when('c4_cabinet_open', 'Open already.'), otherwise(...readFile()))],
      },
    },
    cabinets: {
      name: 'filing cabinets',
      look: ['Cabinets labelled by year: 1946, 1947, 1948, 1950, 1951. Fifty-one is the fattest.'],
      use: ['1949 is the year I care about.'],
    },
    medicine: {
      name: 'medicine cabinet',
      look: ['Rows of little vials marked L-7. Enough to make a whole city forget its own name.'],
      use: ['I have one vial already. One is evidence. A cabinetful is a confession.'],
    },
    clocks: {
      name: 'clocks',
      look: ['Dozens of clocks, every one ticking at a slightly different speed.', 'Dr. Vey doesn’t collect time. He collects ways of losing it.'],
    },
    diplomas: {
      name: 'diplomas',
      look: ['Vienna, Zurich, Edinburgh. Dr. Lucian Vey, doctor of the mind. Mine, apparently, on occasion.'],
    },
    window: {
      name: 'window',
      look: ['The lawn. The nurses are starting to look back towards the house. Time’s short.'],
    },
    music_box: {
      name: 'music box',
      verb: 'Wind',
      look: ['A music box with a dancing couple on the lid.'],
      use: [{ music: 'halcyon' }, 'A waltz, for people who’ve stopped dancing.'],
    },
  },
};

function readFile() {
  return [anim('reach_side'), sfx('cabinet_open'), set('c4_cabinet_open'), give('halcyon_files'),
    'ROOK, Thomas.', { doc: 'rook_file' }, clue('rook_file'), clue('witness_files'), { music: 'revelation' },
    'Referred by Det. Lt. F. Delaney.', wait(700), 'Frank.',
    'Frank Delaney put me in here.',
    'I didn’t drink myself off the force. Frank drank me off it, a needle at a time.',
    'And every witness to the Meridian walked through the same door, with Frank holding it open.',
    { autosave: 'Chapter 4 — The file' }];
}

export const pike4: DialogDef = {
  id: 'pike4',
  npc: 'pike',
  nodes: {
    root: {
      lines: [{ once: 'c4_pike_intro', do: [S('pike', 'Do I know you? I feel like I know you.'), S('pike', 'I keep a list of people I feel like I know. It’s a short list.')] }],
      options: [
        {
          id: 'name', text: 'You’re Wendell Pike.',
          do: [S('pike', 'That name... is it mine?'), S('pike', 'They call me Fourteen.'), { person: 'pike' }],
        },
        {
          id: 'gazette', text: 'You worked at the Gazette.',
          do: [S('pike', 'Gazette... a man with a green visor. He shouts.'), S('pike', 'He isn’t angry. He just shouts. I think I liked him.')],
        },
        {
          id: 'come', text: 'Come with me, Pike. Now, while they’re outside.',
          do: [
            S('pike', 'Out there? I don’t remember out there. I’d get lost.'),
            S('pike', 'I’ll wait. You come back for me.'),
            'I’ll come back. I promise.',
            set('c4_promise_pike'),
          ],
        },
        { id: 'bye', text: 'Hang on, Pike.', next: 'exit', do: [S('pike', 'Hang on to what?')] },
      ],
    },
  },
};

/** Showing Pike his own press card. */
export const pikeCard = [
  S('pike', 'That’s me. That’s... four-one-seven. That’s my number. I used it for everything.'),
  S('pike', 'The trucks. Trucks at the back gate, at night, with crates marked G — Gullwing.'),
  S('pike', 'And a man in a camel coat, with a gold lighter. He laughed while the doctor talked.'),
  S('pike', 'He laughed.'),
  clue('pike_recalls'),
  S('pike', 'Keep the card. I lose things. I lose everything.'),
];

/** Chapter 4's ending: arrested in my own office. */
export const ch4Arrest = [
  S('mabel', 'Tom! Where in God’s name have you been? You look like...'),
  'Like a man who just read his own medical file.',
  'Mabel, Frank Delaney put me in that place in ’49. He’s in this with Crane and Vey up to his hat brim.',
  S('mabel', 'Frank? Frank brought me carnations.'),
  'Carnations are a funeral flower, Mabel.',
  sfx('door_open'),
  { npc: 'delaney', room: 'office', at: 'from_map', face: 'right' as const },
  S('delaney', 'Tommy.'),
  S('delaney', 'Thomas Rook, you’re under arrest for the abduction of Nora Marsh. Her sister swore out a complaint.'),
  'Her sister doesn’t exist, Frank.',
  S('delaney', 'Neither will you, soon enough. Nothing personal, Tommy. It never was.'),
  sfx('punch'), { shake: 300 }, { fade: 'out' as const, ms: 500 },
  { npc: 'delaney', hide: true },
  set('c4_arrest'), set('c4_end'),
  ...CH5_START,
];

halcyon_corridor.npcs![0].items = { press_card: pikeCard };
