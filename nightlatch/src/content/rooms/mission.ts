import type { RoomDef, DialogDef } from '../../engine/types';
import { N, S, anim, clue, otherwise, pick, sfx, when } from '../dsl';
import { CH6_MISSION } from '../story';

export const mission: RoomDef = {
  id: 'mission',
  name: 'St. Brigid’s Mission',
  music: [['chapter=6', 'sorrow'], ['true', 'sorrow']],
  amb: 'rain_window',
  variant: [['chapter=6', 'dawn']],
  npcs: [
    { id: 'agnes', at: 'agnes_spot', face: 'down', when: 'chapter>=2 & chapter<=6 & !c6_phone' },
    { id: 'volunteer', at: 'volunteer_spot', face: 'down', when: 'chapter>=2 & chapter<=5' },
    { id: 'kerrigan', at: 'kerrigan_spot', face: 'down', pose: 'idle_down', when: 'chapter>=2 & chapter<=7' },
    { id: 'nora', at: 'volunteer_spot', face: 'down', when: 'chapter=6 & c6_met_nora & !c6_phone' },
  ],
  enter: [
    {
      once: 'mission_first',
      do: [
        N('St. Brigid’s Mission. Soup, prayers, and nobody asks your name.'),
        N('Behind the counter a young woman in a headscarf glanced up when I came in — and turned her face to the pot.'),
        clue('volunteer'),
      ],
    },
    { if: 'chapter=6 & ded:nora_at_mission & !c6_met_nora', then: CH6_MISSION },
  ],
  hotspots: {
    bell_rope: {
      name: 'bell rope',
      look: ['The bell rope, frayed at the end and looped up out of reach of small boys and large drunks.'],
      use: ['If I ring it, Sister Agnes will ring me.'],
    },
    exit_street: {
      name: 'street door',
      look: ['The door to the street. It’s never locked. Sister Agnes says God has a key anyway.'],
      exit: { to: '', map: true, when: '!(chapter=6 & c6_met_nora)', blocked: ['Not now. Not without Nora.'] },
    },
    exit_cemetery: {
      name: 'door to the churchyard',
      look: ['A side door to St. Brigid’s churchyard.'],
      exit: { to: 'cemetery', at: 'from_mission', when: '!(chapter=6 & c6_met_nora)', blocked: ['Not now.'] },
    },
    stove: {
      name: 'stove',
      look: ['A black iron stove the size of a car, with a cauldron of soup that has been simmering since the Great War.'],
      use: [anim('reach_side'), 'I warm my hands. It’s the most hospitable thing in Brackwater.'],
    },
    counter: {
      name: 'serving counter',
      look: ['A scrubbed counter with a stack of tin bowls and a ladle.'],
      use: ['I’ll wait my turn.'],
    },
    tables: {
      name: 'tables',
      look: ['Long trestle tables. Men in borrowed coats eat slowly, the way you eat when you don’t know when the next one is.'],
      use: ['They don’t want conversation. They want soup.'],
    },
    window: {
      name: 'stained glass',
      look: ['St. Brigid in stained glass, holding a lamp. The rain makes her weep.'],
    },
    notice_board: {
      name: 'notice board',
      look: ['Notices: LOST — ONE MEMORY, ANSWERS TO “JACK”. It’s a joke. I think it’s a joke.', 'Under it, a church bazaar and a list of names for the night beds.'],
    },
    office_door: {
      name: 'office door',
      look: ['Sister Agnes’s office. Through the open door, a desk, a crucifix and a telephone.'],
      use: [S('agnes', 'That’s my office, Mr. Rook. The Lord and I keep the books in there.')],
    },
    office_phone: {
      name: 'telephone',
      look: ['A black telephone on Sister Agnes’s desk.'],
      use: [pick(
        when('chapter=6', 'I don’t need to call anyone.'),
        otherwise('It’s not my telephone.'),
      )],
    },
    crucifix: {
      name: 'crucifix',
      look: ['A wooden crucifix, worn smooth where people touch it on the way out.'],
    },
  },
};

export const cemetery: RoomDef = {
  id: 'cemetery',
  name: 'St. Brigid’s Cemetery',
  music: 'sorrow',
  amb: 'cemetery_wind',
  objects: { flowers: 'true' },
  npcs: [{ id: 'cobb', at: 'cobb_spot', face: 'left', when: 'chapter>=3 & chapter<=7' }],
  hotspots: {
    fresh_grave: {
      name: 'fresh grave',
      look: ['A fresh grave, mounded with yellow clay. No stone yet. The rain is already busy flattening it.'],
      use: ['I’m not digging. Not tonight, and not without a warrant and a better shovel.'],
    },
    exit_mission: {
      name: 'mission door',
      look: ['The side door back into the Mission.'],
      exit: { to: 'mission', at: 'from_cemetery' },
    },
    exit_street: {
      name: 'lych-gate',
      look: ['The lych-gate to the street.'],
      exit: { to: '', map: true },
    },
    marsh_grave: {
      name: 'Marsh grave',
      verb: 'Read',
      look: ['RUTH MARSH, 1901–1947, BELOVED WIFE OF WALTER, MOTHER OF THEIR ONLY CHILD, NORA.',
        'And newer letters underneath: WALTER MARSH, 1897–1949. LOST WITH THE MERIDIAN.', clue('only_child'),
        'Their only child.'],
      use: ['RUTH MARSH, 1901–1947, BELOVED WIFE OF WALTER, MOTHER OF THEIR ONLY CHILD, NORA.', clue('only_child'),
        'Their only child. So who’s Evelyn?'],
    },
    flowers: {
      name: 'chrysanthemums',
      look: ['Chrysanthemums, still fresh. Someone was here this week.'],
      use: ['I leave them be. They aren’t mine to touch.'],
    },
    card: {
      name: 'card',
      verb: 'Read',
      look: ['A card tucked into the flowers: “Papa — I’m being brave. Soon. N.” Dated Sunday the 14th.', clue('flowers'),
        'Sunday. Five days after she vanished. She was alive and free on Sunday, and she was here.'],
      use: ['“Papa — I’m being brave. Soon. N.” Dated Sunday the 14th.', clue('flowers'),
        'She was alive on Sunday. Alive, and close.'],
    },
    angel: {
      name: 'stone angel',
      look: ['A stone angel with a broken wing, pointing at the sky as if to say “it came from up there”.'],
    },
    tree: {
      name: 'dead tree',
      look: ['A dead oak full of crows. The crows look like they’re waiting for a verdict.'],
      use: [sfx('gull'), 'The crows shuffle and stay put. Nobody leaves a good funeral early.'],
    },
    shovel: {
      name: 'shovel',
      look: ['Cobb’s shovel, standing in a fresh pile of earth.'],
      use: ['That’s Cobb’s shovel. A man’s shovel is his shovel.'],
    },
    graves: {
      name: 'headstones',
      look: ['Dockers, fishermen, a sea captain with an anchor carved on his stone. Brackwater buries its own close to the water.'],
    },
  },
};

export const cobb: DialogDef = {
  id: 'cobb',
  npc: 'cobb',
  nodes: {
    root: {
      lines: [{ once: 'c3_cobb_intro', do: [S('cobb', 'Visiting or measuring?'), 'Visiting.', S('cobb', 'Pity. Measuring’s better money.'), { person: 'cobb' }] }],
      options: [
        {
          id: 'visitors', text: 'Does anyone visit the Marsh grave?',
          do: [
            S('cobb', 'The girl does. Comes at dawn on Sundays. Wears a headscarf, keeps her head down.'),
            S('cobb', 'Brings chrysanthemums. Her dad liked chrysanthemums, she told me once.'),
            S('cobb', 'Didn’t see her face, this last Sunday. Didn’t want me to.'),
            clue('scarf'),
          ],
        },
        {
          id: 'digging', text: 'Who’s the fresh grave for?',
          do: [S('cobb', 'Nobody yet. You dig ahead in my line of work.'), S('cobb', 'Saves rushing.')],
        },
        {
          id: 'meridian', text: 'Did you bury the men from the Meridian?',
          do: [
            S('cobb', 'Six of them here. The rest went to the Catholic ground and the sea.'),
            S('cobb', 'Closed coffins, every one. You don’t forget a week like that.'),
            S('cobb', 'Unless somebody makes you.'),
          ],
        },
        { id: 'bye', text: 'Thanks, Cobb.', next: 'exit', do: [S('cobb', 'See you again. Everybody does, eventually.')] },
      ],
    },
  },
};

export { otherwise, when };
