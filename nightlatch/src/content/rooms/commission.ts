import type { DialogDef, RoomDef } from '../../engine/types';
import { N, S, anim, clue, give, otherwise, pick, set, when } from '../dsl';

const convinced = [
  S('lillian', '...Oh, Nora. What did you get yourself into?'),
  S('lillian', 'All right. For Nora.'),
  { sfx: 'phone_dial' },
  S('lillian', 'Miss Pruett? It’s Lillian. The Commissioner’s secretary rang down — he wants you upstairs. Now, he said.'),
  S('pruett', 'Hmph. Now, he says. Everything is now with that man.'),
  { walk: 'from_map', who: 'pruett' }, { sfx: 'door_close' },
  set('c3_pruett_away'),
  S('lillian', 'You’ve got two minutes. Maybe three. She takes the stairs like a bishop.'),
];

export const commission: RoomDef = {
  id: 'commission',
  name: 'Harbor Commission',
  music: 'bureau',
  amb: 'typing_pool',
  objects: { steno_pad: '!c3_pad_taken' },
  npcs: [
    { id: 'lillian', at: 'lillian_spot', face: 'right', pose: 'play_side', when: 'chapter>=3' },
    { id: 'pruett', at: 'pruett_spot', face: 'down', when: '!c3_pruett_away' },
  ],
  enter: [{ if: 'c3_pruett_away & c3_pad_taken', then: [{ unset: 'c3_pruett_away' }] }],
  hotspots: {
    exit_street: {
      name: 'street door',
      look: ['The door back out to Front Street.'],
      exit: { to: '', map: true },
    },
    nora_desk: {
      name: 'Nora’s desk',
      look: ['Nora’s desk, cleared. A blotter, a pencil cup, and a dent in the varnish where her typewriter used to be.'],
      use: ['Nothing left in the drawers but a stick of gum and a hairpin. They cleaned it like a crime scene.'],
    },
    pruett_desk: {
      name: 'Miss Pruett’s desk',
      look: ['Miss Pruett’s desk. Pencils sharpened to a point you could operate with.'],
      use: [pick(
        when('c3_pruett_away', 'Letterhead on the blotter: GULLWING HOLDINGS, addressed to the Commissioner. Personal.', clue('crane_gullwing'),
          'Crane owns the line that owned the Meridian.'),
        otherwise(S('pruett', 'Can I help you? I sincerely doubt it.')),
      )],
    },
    out_tray: {
      name: 'OUT tray',
      verb: 'Search',
      look: ['Miss Pruett’s OUT tray. A stenographer’s notebook sits on top of the pile.'],
      use: [pick(
        when('c3_pad_taken', 'Nothing else in there worth a felony.'),
        when('c3_pruett_away', anim('reach_side'), give('steno_pad'), set('c3_pad_taken'),
          'Nora’s steno pad. Pitman shorthand, page after page.', 'I can’t read a word of it. But I know somebody who can.'),
        otherwise(S('pruett', 'Hands off my tray, young man. That is Commission property.')),
      )],
    },
    diary: {
      name: 'appointment diary',
      verb: 'Read',
      look: ['The Commissioner’s appointment diary, open on Miss Pruett’s desk.'],
      use: [pick(
        when('c3_pruett_away', anim('reach_side'), 'Saturday the 20th: CENTENARY GALA — RADIO ADDRESS, WBRK, 9 P.M.', clue('gala'),
          'Under that, a reminder in a different hand: “Calypso — Pier 4 — Sat. night.”'),
        otherwise(S('pruett', 'That diary is not reading material.')),
      )],
    },
    portrait: {
      name: 'portrait',
      look: ['Augustus Crane, Harbor Commissioner. The painter was paid by the inch and the flattery.', { person: 'crane' }],
    },
    chart: {
      name: 'harbor chart',
      look: ['A chart of the harbor, every pier and channel. Somebody has circled Pier 4 in red pencil, and Pier 9 in black.'],
    },
    cabinets: {
      name: 'filing cabinets',
      look: ['Cabinets full of tonnage, tariffs and tedium.'],
      use: ['Locked. Even the boredom is locked up here.'],
    },
    clock: {
      name: 'clock',
      look: ['An electric clock that hums. Thirty typists type in time with it.'],
    },
    typists: {
      name: 'typists',
      look: ['Thirty women typing like rain on a tin roof.'],
      use: ['They don’t stop for anybody. That’s why the harbor runs.'],
    },
    stairs_door: {
      name: 'Commissioner’s stair',
      look: ['A door marked COMMISSIONER — MOST PRIVATE. Not just private. Most.'],
      use: ['I’m not ready for the Commissioner. I’m not sure the Commissioner’s ready for me.'],
    },
  },
};

export const lillian: DialogDef = {
  id: 'lillian',
  npc: 'lillian',
  nodes: {
    root: {
      lines: [{ once: 'c3_lillian_intro', do: [S('lillian', 'You’re not from Accounts. Accounts don’t wear hats like that.'), { person: 'lillian' }] }],
      options: [
        {
          id: 'nora', text: 'You sat next to Nora Marsh?',
          do: [
            S('lillian', 'Two years, side by side. She types faster than me, but I gossip faster than her.'),
            S('lillian', 'They told us she’s off sick. Sick my foot.'),
          ],
        },
        {
          id: 'session', text: 'What happened on October third?',
          do: [
            S('lillian', 'The night session. The Commissioner had a private meeting after hours, and Nora took the minutes.'),
            S('lillian', 'She came out white as a sheet. Next morning she asked me if I knew what scopo-something was.'),
            clue('oct3_session'),
          ],
        },
        {
          id: 'who', text: 'Who was at the meeting?', when: 'seen:lillian.session',
          do: [
            S('lillian', 'The Commissioner. A doctor from up the hill — thin, with a cane, wouldn’t look at anybody.'),
            S('lillian', 'And a police lieutenant. A big man in a lovely camel-hair coat. He winked at me.'),
            clue('meeting_attendees'),
          ],
        },
        {
          id: 'pad', text: 'Where are Nora’s shorthand notes?', when: 'seen:lillian.session',
          do: [
            S('lillian', 'Her steno pad? They cleared her desk on Friday. Miss Pruett put the pad in her OUT tray, for “filing”.'),
            S('lillian', 'Nothing Miss Pruett files is ever seen again.'),
            set('c3_know_pad'),
          ],
        },
        {
          id: 'favor', text: 'Could you get Miss Pruett away from her desk?', when: 'c3_know_pad & !c3_pruett_away & !c3_pad_taken',
          do: [
            S('lillian', 'And lose my job? I like my job. I like it more than I like most people.'),
            S('lillian', 'Give me one good reason, mister. A real one.'),
            set('c3_lillian_asked'),
          ],
        },
        {
          id: 'proof', text: 'Look at this.', say: false, when: 'c3_lillian_asked & !c3_pruett_away & !c3_pad_taken',
          present: {
            minutes1: ['This is Nora’s. Page one of what she heard that night.', ...convinced],
            contact_sheet: ['Halcyon House. The doctor with the cane, shaking hands with your lieutenant.', ...convinced],
            vial: ['Somebody put this in my drink and took six days of my life. The same people are looking for Nora.', ...convinced],
            nora_photo: [S('lillian', 'I know what she looks like. That’s not a reason, that’s a picture.')],
            default: [S('lillian', 'What am I supposed to make of that?')],
          },
        },
        { id: 'bye', text: 'Thanks, Lillian.', next: 'exit', do: [S('lillian', 'If you find her, tell her I’ve been watering her plant.')] },
      ],
    },
  },
};

export const pruett: DialogDef = {
  id: 'pruett',
  npc: 'pruett',
  nodes: {
    root: {
      lines: [{ once: 'c3_pruett_intro', do: [S('pruett', 'Do you have an appointment?'), 'I have a question.', S('pruett', 'Those are not the same thing.'), { person: 'pruett' }] }],
      options: [
        {
          id: 'pad', text: 'I’d like to see Nora Marsh’s notes.',
          do: [S('pruett', 'Miss Marsh’s work belongs to the Commission. It will be filed.'), 'Where?', S('pruett', 'Appropriately.')],
        },
        {
          id: 'crane', text: 'Can I see the Commissioner?',
          do: [S('pruett', 'The Commissioner is preparing his centenary address. He sees no one.'), S('pruett', 'Least of all you, whoever you are.')],
        },
        { id: 'bye', text: 'Good day, Miss Pruett.', next: 'exit', do: [S('pruett', 'Is it?')] },
      ],
    },
  },
};

export { N };
