import type { DialogDef, RoomDef } from '../../engine/types';
import { N, S, anim, clue, give, otherwise, pick, set, sfx, take, when } from '../dsl';

export const precinct: RoomDef = {
  id: 'precinct',
  name: '1st Precinct',
  music: [['chapter=5', 'revelation'], ['true', 'bureau']],
  amb: 'precinct',
  variant: [['chapter=5', 'night']],
  objects: { coat_on_rack: 'chapter=3' },
  npcs: [
    { id: 'pruitt', at: 'pruitt_spot', face: 'down', when: 'chapter=3' },
    { id: 'delaney', at: 'delaney_spot', face: 'down', when: 'chapter=3' },
  ],
  enter: [{
    if: 'chapter=5 & !c5_precinct_seen',
    then: [set('c5_precinct_seen'), N('The squad room at two in the morning: one lamp, one radio playing to nobody, and no Danny Pruitt.')],
  }],
  hotspots: {
    exit_street: {
      name: 'street door',
      look: ['The front door of the 1st Precinct. I used to walk through it every morning.'],
      exit: {
        to: '', map: true, when: 'chapter!=5 | c5_drawer',
        blocked: ['Not without my things. They’re somewhere in this building, and so is whatever Frank was hiding.'],
      },
    },
    front_desk: {
      name: 'front desk',
      look: ['The duty desk. A blotter, a bell, and the logbook of every drunk in Brackwater.'],
    },
    directory: {
      name: 'reverse directory',
      verb: 'Consult',
      look: ['The police reverse directory: look up a number, get the address. Police use only.'],
      use: [pick(
        when('clue:phone_halcyon', 'I know what I need to know. Harbourview 4-170 is Halcyon House.'),
        when('c3_directory_ok & clue:evelyn_phone', anim('reach_side'), { sfx: 'page_turn' }, 'Harbourview... 4-170...',
          'HALCYON HOUSE REST HOSPITAL, GULL HILL.', clue('phone_halcyon'), 'My client lives in a sanatorium.'),
        when('c3_directory_ok', 'I don’t have a number worth looking up yet.'),
        otherwise('Police use only. I should ask before I help myself.'),
      )],
    },
    bench: {
      name: 'bench',
      look: ['A wooden bench polished by the trousers of the accused.'],
      use: ['I’ve done my time on that bench. Both ends of it.'],
    },
    posters: {
      name: 'wanted posters',
      look: ['WANTED posters. A forger, two bank robbers, and — newly pinned — MISSING: WENDELL PIKE. Nobody’s looking very hard.'],
    },
    exit_cells: {
      name: 'cells corridor',
      look: ['The corridor to the holding cells. I’ve been on both sides of those bars.'],
      exit: { to: 'holding_cell', at: 'start', when: 'chapter=5', blocked: ['I’d rather not visit the cells. They have a way of keeping visitors.'] },
    },
    evidence_door: {
      name: 'evidence room',
      look: ['The evidence room. Two years ago the Meridian’s padlock went in there and nobody took it out again.'],
      use: [pick(
        when('chapter=5', 'Danny already brought me the box that matters.'),
        otherwise('Locked. Evidence rooms usually are, when they’re honest.'),
      )],
    },
    delaney_door: {
      name: 'Delaney’s office',
      look: ['LT. F. DELANEY — HOMICIDE, in gold on the glass.'],
    },
    delaney_desk: {
      name: 'Delaney’s desk',
      look: ['Frank’s desk: a blotter, a framed photograph, a fountain pen that cost more than my car.'],
      use: [pick(
        when('chapter=3', S('delaney', 'Help you, Tommy? That’s my desk you’re eyeing.')),
        otherwise('Papers about other people’s murders. Nothing about his own.'),
      )],
    },
    desk_drawer: {
      name: 'desk drawer',
      verb: 'Open',
      look: ['A locked drawer in Frank’s desk.'],
      use: [pick(
        when('chapter=3', 'Not with Frank sitting six inches from it.'),
        when('c5_drawer', 'Empty, except for Frank’s spare cufflinks.'),
        when('has:cell_keys', ...openDrawer()),
        otherwise('Locked. There’s a small key for it somewhere, probably on a ring.'),
      )],
      items: {
        cell_keys: [pick(when('c5_drawer', 'Already open.'), otherwise(...openDrawer()))],
        lockpicks: ['My picks are in there somewhere. That’s rather the problem.'],
      },
    },
    coat_rack: {
      name: 'coat rack',
      look: [pick(
        when('chapter=3', 'A camel-hair coat on Frank’s rack. Expensive. Frank always did like a good coat.', clue('delaney_coat')),
        otherwise('An empty coat rack. Frank’s wearing his camel hair tonight. He’d be cold without it.'),
      )],
    },
    delaney_photo: {
      name: 'framed photograph',
      look: ['Frank with Commissioner Crane at the yacht club, both holding a cup. The cup is bigger than Frank’s salary.'],
    },
    delaney_cabinet: {
      name: 'filing cabinet',
      look: ['Frank’s filing cabinet. Closed cases, mostly. He closes a lot of cases.'],
      use: ['Locked. Frank locks things.'],
    },
  },
};

function openDrawer() {
  return [anim('reach_side'), sfx('unlock'), sfx('drawer_open'), set('c5_drawer'),
    'The little brass key on the ring fits. Inside: an envelope with my name on it, and Frank’s pocketbook.',
    { unstash: true as const },
    'My coat’s contents, my picks, everything they took off me.',
    { narrate: 'Frank’s pocketbook, in his round schoolboy hand: “Sat — Calypso loads 23:00. Tail Boone. He’ll lead us to the girl.”' },
    clue('delaney_plan'),
    'Boone. Deacon. They’re going to follow Deacon to Nora.',
    { autosave: 'Chapter 5 — Delaney’s drawer' }];
}

export const holding_cell: RoomDef = {
  id: 'holding_cell',
  name: 'Holding cell, 1st Precinct',
  music: 'locked',
  amb: 'rain_window',
  objects: {
    keys_far: '!c5_keys_moved & !has:cell_keys & !c5_cell_open',
    keys_near: 'c5_keys_moved & !has:cell_keys & !c5_cell_open',
    blanket: '!c5_blanket',
    cell_open: 'c5_cell_open',
  },
  npcs: [
    { id: 'barnaby', at: 'barnaby_spot', face: 'down', pose: 'idle_down' },
    { id: 'pruitt', at: 'pruitt_spot', face: 'down', when: 'chapter=5 & !c5_pruitt_gone', talk: [{ dialog: 'pruitt5' }] },
  ],
  hotspots: {
    bars: {
      name: 'bars',
      look: ['Iron bars painted green over rust. They’ve held better men. Mostly worse.'],
      use: ['I rattle them. They rattle back. It’s a conversation we’ve had before.'],
    },
    cell_door: {
      name: 'cell door',
      verb: 'Open',
      look: [pick(when('c5_cell_open', 'Open. I find I like it that way.'), otherwise('The cell door. Locked. That’s rather the point of the place.'))],
      exit: {
        to: 'precinct', at: 'from_cells', when: 'c5_cell_open',
        blocked: [anim('reach_side'), sfx('door_locked'), 'Locked. That’s rather the point of the place.'],
      },
      items: {
        cell_keys: [pick(
          when('c5_cell_open', 'It’s open.'),
          otherwise(anim('reach_side'), sfx('unlock'), sfx('cell_door'), set('c5_cell_open'), 'The lock turns like it’s been waiting for me.',
            S('barnaby', 'Good luck, mate. Me, I’ve got a bunk and three meals. You go and save the world.'),
            { autosave: 'Chapter 5 — Out of the cell' }),
        )],
        lockpicks: ['They took my picks with everything else.'],
      },
    },
    keys: {
      name: 'key ring',
      verb: 'Reach for',
      when: '!c5_keys_moved & !has:cell_keys & !c5_cell_open',
      look: ['A ring of keys on a hook by the duty desk. Ten feet away. It might as well be Cleveland.'],
      use: ['Too far. Much too far.'],
      items: { blanket: ['Even a good throw won’t reach that far.'] },
    },
    keys_near: {
      name: 'key ring',
      verb: 'Reach for',
      when: 'c5_keys_moved & !has:cell_keys & !c5_cell_open',
      look: ['The key ring, on the hook beside the bars. Just out of arm’s reach. Danny has a sense of humor. Or a conscience.'],
      use: [anim('reach_side'), 'Two inches short. My arms have let me down before.'],
      items: {
        blanket: [anim('reach_side'), sfx('chain'), give('cell_keys'),
          'I cast the blanket through the bars like a fisherman, let it settle over the hook, and reel it in.',
          'The key ring comes with it.', S('barnaby', 'Lovely cast, mate. Lovely.')],
      },
    },
    desk: {
      name: 'duty desk',
      look: ['The duty desk: a lamp, a logbook and a thermos of coffee that isn’t mine.'],
    },
    bunk: {
      name: 'bunk',
      look: ['A bunk with a blanket and Barnaby on it, in that order.'],
      use: [S('barnaby', 'Mine, mate. There’s a floor going spare.')],
    },
    blanket: {
      name: 'blanket',
      verb: 'Take',
      when: '!c5_blanket',
      look: ['A gray wool blanket. It has been sneezed on by better men than me.'],
      use: [anim('pickup_side'), give('blanket'), set('c5_blanket'), S('barnaby', 'Take it. I’ve got my beard.')],
    },
    bucket: {
      name: 'bucket',
      look: ['A bucket. Let’s not.'],
      use: ['Let’s really not.'],
    },
    graffiti: {
      name: 'graffiti',
      look: ['Initials, dates, somebody’s calendar of thirty crossed-off days — and, freshly pencilled: DELANEY IS A RAT.', 'Interesting.'],
    },
    window: {
      name: 'window',
      look: ['A barred window up near the ceiling. Rain, and the smell of the harbor.'],
      use: ['Too high, too small, too barred.'],
    },
    clock: {
      name: 'clock',
      look: ['Ten past two. Of course it’s ten past two.'],
    },
  },
};

export const barnaby: DialogDef = {
  id: 'barnaby',
  npc: 'barnaby',
  nodes: {
    root: {
      lines: [{ once: 'c5_barnaby_intro', do: [S('barnaby', 'Barnaby. Able seaman, retired against my will.'), { person: 'barnaby' }] }],
      options: [
        {
          id: 'calypso', text: 'What ship did you sail on?',
          do: [
            S('barnaby', 'The Calypso, till last month. Gullwing ship. Same owners as the Meridian, God rest her.'),
            S('barnaby', 'Last run we carried crates for the hill — the hospital — and forty cases marked MACHINE PARTS.'),
            S('barnaby', 'I dropped one. Rocks, mate. Harbor rocks packed in straw. For the insurers, I reckon.'),
            clue('calypso_rocks'),
          ],
        },
        {
          id: 'why', text: 'What are you in for?',
          do: [S('barnaby', 'Drunk, disorderly and singing. They’d let the first two go. The singing they hold against a man.')],
        },
        {
          id: 'lieutenant', text: 'Has the Lieutenant been down here?',
          do: [
            S('barnaby', 'At shift change. Told young Danny you’re to see nobody and eat nothing.'),
            S('barnaby', 'Then he stood there watching you sleep, like a man looking at a dog he’s fond of and has to put down.'),
          ],
        },
        {
          id: 'keys', text: 'Any ideas how to reach those keys?', when: 'c5_keys_moved & !has:cell_keys & !c5_cell_open',
          do: [S('barnaby', 'Arms like ours were made for hauling, not reaching.'), S('barnaby', 'Swing something, mate. A sailor uses what he’s got.')],
        },
        { id: 'bye', text: 'Get some sleep, Barnaby.', next: 'exit', do: [S('barnaby', 'Sleep’s the one thing they can’t take off you in here.')] },
      ],
    },
  },
};

const boxScript = [
  S('pruitt', '...Five minutes.'),
  { walk: 'from_map', who: 'pruitt' },
  { wait: 900 },
  { narrate: 'Danny came back with a cardboard box older than his badge and slid it through the food slot.' },
  { walk: 'pruitt_spot', who: 'pruitt' },
  give('padlock'), give('gate_log'), set('c5_box'),
  'A scorched brass padlock, still shut through a sawn-off hasp. The harbor gate log. A fire brigade log, a shift roster.',
  'Gus’s statement, stamped DISREGARDED. And Frank’s report.',
  clue('report_open_hatch'), clue('report_time'), clue('gus_statement'), clue('shift_roster'), clue('fire_log'),
  clue('gate_walter'), clue('gate_delaney'),
  { doc: 'delaney_report' },
];

export const pruitt5: DialogDef = {
  id: 'pruitt5',
  npc: 'pruitt',
  nodes: {
    root: {
      lines: [{ once: 'c5_pruitt_intro', do: [S('pruitt', 'Mr. Rook. I’m not supposed to talk to you. Lieutenant’s orders.'), { person: 'pruitt' }] }],
      options: [
        {
          id: 'charge', text: 'What am I charged with, kid?',
          do: [
            S('pruitt', 'Abduction of Nora Marsh. Her sister swore out a complaint. The Lieutenant brought you in himself.'),
            'Her sister doesn’t exist, Danny.',
            S('pruitt', '...That’s not what the paperwork says.'),
          ],
        },
        {
          id: 'vandermeer', text: 'You studied the Vandermeer case.', when: '!c5_rapport',
          do: [
            S('pruitt', 'The parrot! Everybody at the academy knows the parrot.'),
            'Then you know I don’t make things up.',
            S('pruitt', '...No sir. You didn’t. Not about the parrot.'),
            set('c5_rapport'),
          ],
        },
        {
          id: 'box', text: 'Bring me the Meridian evidence box. Five minutes.', when: 'c5_rapport & !c5_box',
          do: [
            S('pruitt', 'I could lose my badge, Mr. Rook.'),
            'And if I’m wrong you can laugh at me for the rest of your career.',
            S('barnaby', 'Go on, son. Live a little. The worst he can do is be right.'),
            ...boxScript,
          ],
        },
        {
          id: 'report', text: 'Danny — what does the Lieutenant’s report say about the hatch?', when: 'c5_box & !clue:hatch_locked',
          do: [S('pruitt', '“Forward hold hatch found open; men overcome by smoke before they could climb out.”'), set('c5_report_read')],
        },
        {
          id: 'present', text: 'Then explain this.', say: false, when: 'c5_report_read & !clue:hatch_locked',
          present: {
            padlock: [
              'Then explain this. The padlock off the Meridian’s forward hatch.',
              'Still locked through the hasp. The firemen had to saw the hasp off the deck to open that hatch.',
              S('pruitt', '...But if the hatch was locked, then...'),
              'Then somebody locked fourteen men in a burning hold, Danny.',
              clue('hatch_locked'), { music: 'revelation' },
            ],
            gate_log: ['The gate log tells us who came and went. It doesn’t tell us about the hatch.'],
            default: [S('pruitt', 'I don’t see what that’s got to do with the hatch, Mr. Rook.')],
          },
        },
        {
          id: 'who', text: 'Somebody was on that pier before the fire.', when: 'clue:hatch_locked & !tl_meridian_night',
          do: [S('pruitt', 'Who?'), 'I need to put the night in order first. Give me a minute with my notebook.'],
        },
        {
          id: 'times', text: 'Look at the times, Danny.', when: 'tl_meridian_night & clue:hatch_locked & !c5_keys_moved',
          do: [
            'The gate log has the Lieutenant’s car coming through at twenty-five past ten.',
            'His own report says he arrived at half past eleven, after the alarm.',
            'He was on that pier an hour before the fire. Before the hammering.',
            { wait: 900 },
            S('pruitt', '...The Lieutenant lied in his report.'),
            S('pruitt', 'Fourteen men.'),
            { wait: 600 },
            S('pruitt', 'I’m going to get a coffee, Mr. Rook. Takes me about ten minutes.'),
            S('pruitt', 'The keys are on the hook. And the hook is... about here.'),
            { sfx: 'chain' }, set('c5_keys_moved'),
            { walk: 'from_map', who: 'pruitt' }, set('c5_pruitt_gone'),
            S('barnaby', 'Well, I never. An honest copper. Somebody ought to stuff him.'),
          ],
        },
        { id: 'bye', text: 'Never mind, Danny.', next: 'exit', do: [S('pruitt', 'Yes, Mr. Rook.')] },
      ],
    },
  },
};

export { take };
