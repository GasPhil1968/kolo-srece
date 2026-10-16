import type { RoomDef } from '../../engine/types';
import { CH6_START } from '../story';
import { N, S, anim, clue, give, otherwise, pick, set, sfx, when } from '../dsl';

const ch5End = [
  N('The Lantern after closing. Chairs upside down on the tables, and Deacon alone at the piano, playing for nobody.'),
  S('deacon', 'Tom! They\u2019re looking for you all over town. The radio says you kidnapped that girl.'),
  'Frank\u2019s going to tail you to her, Deacon. Tomorrow. It\u2019s in his own pocketbook.',
  S('deacon', 'Then he\u2019ll tail me to nowhere in particular.'),
  'We have to move her.',
  S('deacon', 'Come downstairs. We\u2019ll talk where nobody listens.'),
  { walk: 'from_cellar' as const },
  sfx('door_open'),
  { fade: 'out' as const, ms: 500 },
  N('I went down the cellar steps first. Behind me I heard the door shut, and a bolt slide home.'),
  S('deacon', 'Forgive me, Tom. You made me promise.'),
  set('c5_end'), set('c5_deacon_gone'),
  ...CH6_START,
];

export const lantern: RoomDef = {
  id: 'lantern',
  name: 'The Blue Lantern',
  music: [['c1_deacon_lullaby', 'lullaby'], ['true', 'lantern']],
  amb: 'club_chatter',
  objects: { palm_wilted: 'c1_palm' },
  npcs: [
    { id: 'deacon', at: 'deacon_spot', face: 'right', pose: 'play_side', when: '!c5_deacon_gone' },
    { id: 'sal', at: 'sal_spot', face: 'down' },
  ],
  enter: [
    { once: 'c1_lantern_first', do: ['The Blue Lantern. Smoke, blue paper lanterns, and Deacon Boone’s piano holding it all together.'] },
    { if: 'chapter=5 & c5_drawer & clue:padlock_order & !c5_end', then: ch5End },
  ],
  hotspots: {
    exit_street: {
      name: 'door to Harbor Street',
      look: ['The street door. The neon outside spells BLUE LANTERN backwards on the wet glass.'],
      exit: { to: '', map: true },
    },
    exit_cellar: {
      name: 'door marked PRIVATE',
      look: ['A door behind the bar marked PRIVATE. Sal’s cellar.'],
      exit: {
        to: 'lantern_cellar', at: 'start', when: 'false',
        blocked: [S('sal', 'Hey, hey. That’s private, Rook. Private means private.')],
      },
    },
    piano: {
      name: 'piano',
      look: ['An upright that’s been played every night since Prohibition. You can hear every one of those nights in it.'],
      use: ['Not while Deacon’s at it. Nobody touches that piano but Deacon.'],
    },
    stage: {
      name: 'stage',
      look: ['A stage the size of a dining table. A bass leans in the corner like a drunk waiting for a cab.'],
    },
    bar: {
      name: 'bar',
      look: ['Mahogany, brass rail, and forty years of elbows.'],
      use: ['I’ll talk to Sal instead. The bar never listens.'],
    },
    bottles: {
      name: 'bottles',
      look: ['Bottles lit from behind like stained glass in a church where they worship rye.'],
    },
    palm: {
      name: 'potted palm',
      look: [pick(
        when('c1_palm', 'The palm looks like it lost an argument with an anisette.'),
        otherwise('A potted palm. It’s seen more of the Lantern than I have.'),
      )],
      use: [pick(
        when('c1_palm', 'Poor thing. Whatever was in that glass, it wasn’t meant for a plant. Or for me.'),
        otherwise('It’s a palm. It doesn’t need anything from me.'),
      )],
    },
    tables: {
      name: 'tables',
      look: ['Little round tables with candle lamps. Every one of them has a story, and none of them are talking.'],
    },
    poster: {
      name: 'poster',
      look: ['DEACON BOONE TRIO — NIGHTLY. The trio has been a duo since 1947 and a solo since 1949. Nobody’s changed the poster.'],
    },
    coat_check: {
      name: 'coat check',
      look: ['The coat check. The girl who works it is on her break, which judging by the dust is permanent.'],
    },
    patrons: {
      name: 'patrons',
      look: ['Couples, loners, a sailor asleep on his hat. Nobody looks up. That’s the Lantern’s whole appeal.'],
      use: ['They’re not here to talk. They’re here to not be anywhere else.'],
    },
  },
};

export const lantern_cellar: RoomDef = {
  id: 'lantern_cellar',
  name: 'Cellar of the Blue Lantern',
  music: 'locked',
  amb: 'tunnel',
  objects: { rack_open: 'c6_rack_open', lantern_hook: '!c6_lantern_taken', rum: '!c6_rum_taken' },
  hotspots: {
    old_bar: {
      name: 'old bar',
      look: ['The old speakeasy bar, from when the Lantern sold its gin downstairs. There’s still a ring on the wood where somebody’s glass sat for ten years.'],
      use: ['I lean on it for old times’ sake. It doesn’t remember me either.'],
    },
    stairs: {
      name: 'stairs',
      look: ['Wooden stairs up to the bolted door. Every one of them creaks a different note.'],
      use: ['I climb up, lean on the door, climb down again. Exercise.'],
    },
    door: {
      name: 'door',
      look: ['Solid oak, bolted on the other side. Deacon builds things to last. Including grudges, apparently.'],
      use: [anim('reach_side'), sfx('door_locked'), 'Bolted from the stairs side. Deacon, you sentimental old crook.'],
      items: { lockpicks: ['It’s a bolt, not a lock. There’s nothing on this side to pick.'] },
    },
    grating: {
      name: 'pavement grating',
      verb: 'Listen at',
      look: ['A grating up at pavement level. Gray light, rain, and the occasional pair of shoes.'],
      use: [pick(
        when('!clue:overheard',
          N('Voices on the pavement above. A woman’s heels, and a man who walks like a wardrobe.'),
          S('vivian', 'The old man left at four. Delaney’s men are on him.'),
          S('kroll', 'And he goes to the girl?'),
          S('vivian', 'He goes to the girl. Then Halcyon for her, and tonight the Calypso for the rest of it.'),
          clue('overheard'),
          'Deacon thinks locking me up keeps Nora safe. He’s walking them straight to her.',
          'And I don’t even know where she is.',
          { autosave: 'Chapter 6 — Voices' }),
        otherwise('Just feet and rain now.'),
      )],
    },
    rack: {
      name: 'wine rack',
      look: [pick(
        when('c6_rack_open', 'The rack has swung out on a hinge. Behind it, a brick tunnel breathing cold air.'),
        otherwise('An old wine rack built into the back wall. Most of the bottles are empty and furred with dust.'),
      )],
      use: [pick(
        when('c6_rack_open', 'It’s open. The tunnel’s waiting.'),
        otherwise(anim('reach_side'), 'It’s fixed to the wall. Fixed, or hinged.'),
      )],
      items: {
        lighter: [anim('reach_side'), sfx('lighter'), 'The flame leans towards the rack and flutters. There’s air moving behind it.',
          clue('draft'), 'Wine racks don’t breathe.'],
      },
    },
    bottle_1924: {
      name: 'clean bottle',
      verb: 'Pull',
      when: '!c6_rack_open',
      look: ['One bottle is cleaner than the others, as if somebody handles it: CHÂTEAU LANTERNE, 1924.'],
      use: [anim('reach_side'), sfx('creak'), 'I pull the bottle of ’24. It tilts — and something clicks inside the wall.',
        sfx('hatch_creak'), set('c6_rack_open'), 'The whole rack swings out on a hinge. Behind it: a brick tunnel, breathing cold air.',
        { autosave: 'Chapter 6 — The ’24' }],
    },
    mural: {
      name: 'mural',
      look: ['A mural of a mermaid holding up a lantern. The lantern points straight at the wine rack.',
        'Either bad composition or a very old joke.'],
    },
    poster: {
      name: 'poster',
      look: ['THE BLUE LANTERN — EST. 1924. FINE MUSIC, FINER COMPANY.', clue('est_1924'),
        'Deacon told me once: in the old days, you knocked twice and asked for a bottle of the ’24.'],
    },
    player_piano: {
      name: 'player piano',
      look: ['A broken player piano, older than the club. Somebody’s left a piano-roll box on top.'],
      use: ['I press a key. The piano coughs. Neither of us enjoys it.'],
    },
    roll_box: {
      name: 'piano-roll box',
      verb: 'Open',
      look: ['A piano-roll box: LULLABY OF THE LAMPLIGHTER.'],
      use: [pick(
        when('!c6_roll_opened', anim('reach_side'), set('c6_roll_opened'), give('minutes2'),
          'No roll inside — just two folded papers.', 'Page two of the transcript. And a note, in a woman’s hand.',
          clue('nora_letter2'), { doc: 'nora_letter2' }),
        otherwise('Empty now. The Lullaby lives in Deacon’s hands anyway.'),
      )],
    },
    lantern_hook: {
      name: 'hurricane lantern',
      verb: 'Take',
      when: '!c6_lantern_taken',
      look: ['An old hurricane lantern on a hook. Prohibition-era lighting.'],
      use: [anim('reach_side'), give('lantern'), set('c6_lantern_taken'), 'The tank’s bone dry. It’s a lantern in name only.'],
    },
    rum: {
      name: 'dusty bottle',
      verb: 'Take',
      when: '!c6_rum_taken',
      look: ['A dusty bottle on the shelf: SMUGGLERS’ RUM, 151 PROOF.'],
      use: [anim('reach_side'), give('rum'), set('c6_rum_taken'), 'A hundred and fifty-one proof. It’s less a drink than a fuel.'],
    },
    barrels: {
      name: 'barrels',
      look: ['Empty barrels. Prohibition ended in ’33, but nobody told the barrels.'],
    },
    crates: {
      name: 'crates',
      look: ['Crates of empty bottles, waiting for a party that ended twenty years ago.'],
      use: ['I sat on one of these last night and woke up a prisoner. I’ll stand.'],
    },
    exit_tunnel: {
      name: 'tunnel',
      when: 'c6_rack_open',
      look: ['A brick tunnel, low and wet, heading downhill toward the harbor.'],
      exit: {
        to: 'tunnel', at: 'start', when: 'c6_rack_open & has:lantern_lit',
        blocked: ['Into a smugglers’ tunnel in the pitch dark? I need a light. A proper one.'],
      },
    },
  },
};

export const tunnel: RoomDef = {
  id: 'tunnel',
  name: 'Smugglers’ tunnel',
  music: 'harbor',
  amb: 'tunnel',
  enter: [{ once: 'c6_tunnel', do: [N('The tunnel ran downhill under Harbor Street, the way Prohibition ran: wet, crooked and towards the water.')] }],
  hotspots: {
    trolley: {
      name: 'hand trolley',
      look: ['A rusted hand trolley on the rails, built for rolling rum barrels under Harbor Street while the police looked the other way.'],
      use: [anim('reach_side'), sfx('metal_clank'), 'It moves an inch, screams like a gull, and stops. So much for a quiet getaway.'],
    },
    exit_back: {
      name: 'back to the cellar',
      look: ['Back towards the Lantern’s cellar.'],
      exit: { to: 'lantern_cellar', at: 'tunnel_mouth' },
    },
    ladder: {
      name: 'iron ladder',
      verb: 'Climb',
      look: ['An iron ladder up to a grate. Daylight, and the smell of the seawall.'],
      exit: {
        to: 'mission', at: 'start', when: 'ded:nora_at_mission',
        blocked: ['Up there is the seawall below St. Brigid’s. But where am I going? I don’t even know where she is.',
          'Think, Rook. Everything you need is in the notebook.'],
      },
    },
    crates: {
      name: 'rotten crates',
      look: ['Rotten crates stencilled CANADIAN MAPLE SYRUP. The syrup was eighty proof.'],
    },
    rails: {
      name: 'rails',
      look: ['Narrow-gauge rails for trolleys of bootleg. The rust has won.'],
    },
    side_passage: {
      name: 'side passage',
      look: ['A side passage, collapsed. Somebody wanted it forgotten. I know the feeling.'],
      use: ['Bricks and mud. Nobody’s going that way.'],
    },
  },
};
