import type { DialogDef, RoomDef } from '../../engine/types';
import { N, S, anim, clue, give, otherwise, pick, set, sfx, take, wait, when } from '../dsl';

const LIT = 'c7_lit';

export const calypso_hold: RoomDef = {
  id: 'calypso_hold',
  name: 'Hold of the MV Calypso',
  music: 'locked',
  amb: 'ship_hold',
  variant: [[LIT, 'lit']],
  objects: {
    crate1_moved: 'c7_crate1',
    crate2_moved: 'c7_crate2',
    stack: 'c7_crate2',
    drum_moved: 'c7_drum',
    crate_broken: 'c7_rocks',
    lantern_lit: LIT,
    hatch_open: 'c7_out',
  },
  hotspots: {
    hatch: {
      name: 'hatch',
      look: [pick(
        when('c7_out', 'The cut tarpaulin flaps against a slice of night sky.'),
        otherwise('High above: the hatch. A crack of gray light between the boards, and a tarpaulin over them.'),
      )],
      exit: {
        to: 'calypso_deck', at: 'start', when: 'c7_out',
        blocked: [pick(
          when('!c7_crate2', 'It’s twelve feet up. I can jump about one of those.'),
          otherwise('I need to be up at the net to do anything about the hatch.'),
        )],
      },
    },
    lantern: {
      name: 'ship’s lantern',
      verb: 'Light',
      look: [pick(when(LIT, 'A ship’s lantern on a hook, burning steady.'), otherwise('In the gray from the hatch I can just make out a lantern hanging from a hook.'))],
      use: [pick(when(LIT, 'It’s lit. I like it lit.'), otherwise('I can’t light it with good intentions. I need a flame.'))],
      items: {
        hat_matches: [pick(
          when(LIT, 'It’s already burning.'),
          otherwise(anim('reach_side'), sfx('match'), take('hat_matches'), set(LIT), { music: 'locked' },
            'The first match flares and dies. The second one takes.',
            'Lantern light. Crates, chains, a drum of oil, and a hold that smells of chemistry and rocks.'),
        )],
      },
    },
    pipe: {
      name: 'vent pipe',
      verb: 'Knock on',
      look: ['A ventilation pipe through the forward bulkhead. It hums when the engine turns over.'],
      use: [{ dialog: 'nora7' }],
      items: {
        hat_matches: ['I’m not posting my last light to Nora. We need it here.'],
      },
    },
    bulkhead: {
      name: 'forward bulkhead',
      verb: 'Knock on',
      look: ['Riveted steel between this hold and the next. I heard somebody move on the other side.'],
      use: [{ dialog: 'nora7' }],
    },
    net: {
      name: 'cargo net',
      verb: 'Climb',
      when: LIT,
      look: ['A cargo net hanging from the hatch coaming. Its bottom edge is a good two feet above my reach.'],
      use: [pick(
        when('c7_out', 'The way out is up there and open.'),
        when('c7_crate2 & has:walter_knife', ...cutOut()),
        when('c7_crate2', anim('reach_side'), 'Up the crates, up the net. I push at a hatch board: it lifts an inch and stops.',
          'Tarpaulin, lashed down tight on the outside. If I had a blade...', set('c7_at_hatch')),
        when('c7_crate1', 'One crate isn’t enough. Two might be.'),
        otherwise(anim('reach_side'), 'Too high. I’d need something to stand on.'),
      )],
      items: {
        walter_knife: [pick(when('c7_crate2 & !c7_out', ...cutOut()), when('c7_out', 'Done.'), otherwise('I need to get up there first.'))],
      },
    },
    stack: {
      name: 'stacked crates',
      verb: 'Climb',
      when: 'c7_crate2',
      look: ['Two Halcyon crates stacked under the net. Enough to stand on, if I don’t think about it.'],
      use: [pick(
        when('c7_out', 'No need.'),
        when('has:walter_knife', ...cutOut()),
        otherwise(anim('reach_side'), 'Up the crates, up the net. A hatch board lifts an inch against the tarpaulin outside. I need a blade.',
          set('c7_at_hatch')),
      )],
      items: { walter_knife: [pick(when('c7_out', 'Done.'), otherwise(...cutOut()))] },
    },
    crates_heavy: {
      name: 'MACHINE PARTS crates',
      verb: 'Move',
      when: LIT,
      look: [pick(when('c7_rocks', 'One of them is open. Harbor stone, packed in straw.'), otherwise('Crates stencilled GULLWING — MACHINE PARTS. Forty of them, by Barnaby’s count.'))],
      use: ['I can’t shift one. Must be very heavy machines.', 'Or rocks.'],
      items: {
        walter_knife: [pick(
          when('c7_rocks', 'I’ve seen enough rocks.'),
          otherwise(anim('pickup_side'), sfx('pry'), set('c7_rocks'), clue('rocks_seen'),
            'I work the blade under a slat and lever it up.', 'Harbor stone, packed in straw. Forty cases of insured rocks.',
            'The Calypso isn’t meant to arrive anywhere. She’s meant to sink.'),
        )],
      },
    },
    crate1: {
      name: 'Halcyon crate',
      verb: 'Drag',
      when: LIT + ' & !c7_crate1',
      look: ['A crate stencilled HALCYON HOUSE — L-7. Light. Vials and straw.'],
      use: [anim('pickup_side'), sfx('wood_crack'), set('c7_crate1'), 'I drag it under the cargo net. It’s light enough — vials and straw.'],
    },
    crate2: {
      name: 'second Halcyon crate',
      verb: 'Drag',
      when: LIT + ' & !c7_crate2',
      look: [pick(when('c7_drum', 'The second light crate, free now.'), otherwise('Another light Halcyon crate, wedged in behind the oil drum.'))],
      use: [pick(
        when('!c7_drum', 'It’s wedged in behind the oil drum. The drum would have to move first.'),
        when('!c7_crate1', anim('pickup_side'), 'Free now, but there’s nothing to stack it on yet. The first crate should go under the net.'),
        otherwise(anim('pickup_side'), sfx('wood_crack'), set('c7_crate2'), 'I heave it up onto the first one. A stack. A short, wobbly stack.'),
      )],
    },
    drum: {
      name: 'oil drum',
      verb: 'Push',
      when: LIT,
      look: [pick(when('c7_drum', 'The oil drum, pushed aside.'), otherwise('A half-full oil drum, sitting on the corner of a crate.'))],
      use: [pick(
        when('c7_drum', 'It’s moved as far as it’s going.'),
        otherwise(anim('pickup_side'), sfx('barrels'), set('c7_drum'), 'I put my shoulder to it. It rolls a yard and sulks.'),
      )],
    },
    bilge: {
      name: 'bilge',
      look: ['Black bilge water sloshing in the channels. It smells like the bottom of every harbor in the world.'],
    },
    chains: {
      name: 'chains',
      look: ['Cargo chains on the deck plates, rusted together like an argument nobody won.'],
    },
  },
};

function cutOut() {
  return [anim('reach_side'), sfx('rope_cut'), 'Up the crates, onto the net, knife into the canvas.',
    'Walter’s blade goes through the tarpaulin like it’s been waiting two years to do it.',
    sfx('hatch_creak'), set('c7_out'), 'I shove the board aside. Night air. Fog. Out.',
    { autosave: 'Chapter 7 — Out of the hold' }];
}

export const nora7: DialogDef = {
  id: 'nora7',
  npc: 'nora',
  nodes: {
    root: {
      lines: [{
        once: 'c7_contact',
        do: [
          { sfx: 'metal_clank' }, 'I rap on the pipe. Three short, three long, three short.',
          S('nora', 'Tom? Tom! You’re alive!'),
          'Nora. Are you hurt?',
          S('nora', 'Bruised. Angry. They threw me in the forward hold. There’s a ladder on my side, but the hatch is bolted.'),
          set('c7_contact'),
        ],
      }],
      options: [
        {
          id: 'call', text: 'Nora — the telephone. I called them.', once: true,
          do: [
            S('nora', 'I know. I saw your face. You weren’t there, Tom. Somebody else was using you.'),
            S('nora', 'They told you to call. Before. At Halcyon.'),
            '“When you find her, do call.”',
            S('nora', 'Then they used you. That’s not the same as you doing it.'),
          ],
        },
        {
          id: 'ship', text: 'Do you know where we are?',
          do: [S('nora', 'The Calypso. I heard Delaney. She sails at two, and she doesn’t come back.'), S('nora', 'Neither do we.')],
        },
        {
          id: 'things', text: 'Did you see where they took my coat?',
          do: [S('nora', 'Delaney took it up to the captain’s cabin. And all your papers. He was laughing.'), S('nora', 'He laughs a lot.')],
        },
        {
          id: 'knife', text: 'Have you got anything sharp?', when: '!has:walter_knife & !c7_out',
          do: [
            S('nora', 'Papa’s knife. I had it in my boot. They didn’t look in my boot.'),
            S('nora', 'It’ll fit through the pipe. Hold your hand under the end.'),
            { sfx: 'metal_clank' }, give('walter_knife'),
            'A bone-handled pocket knife, engraved W.M.',
            S('nora', 'Bring it back to me, Tom. It’s all I’ve got of him.'),
          ],
        },
        {
          id: 'plan', text: 'Hang on. I’m getting out, and then I’m getting you out.', next: 'exit',
          do: [S('nora', 'Hurry. I can hear them loading upstairs.')],
        },
      ],
    },
  },
};

export const calypso_deck: RoomDef = {
  id: 'calypso_deck',
  name: 'Deck of the MV Calypso',
  music: 'harbor',
  amb: 'harbor',
  objects: {
    fwd_bolt_open: 'c7_nora_free',
    barrels: '!c7_barrels',
    barrels_fallen: 'c7_barrels',
  },
  npcs: [
    { id: 'kroll', at: 'kroll_spot', face: 'left', when: 'chapter=7 & !c7_barrels', talk: [S('kroll', '...'), 'Kroll’s not a conversationalist.'] },
    { id: 'kroll', at: 'barrels_spot', face: 'right', when: 'chapter=7 & c7_barrels & !c7_escaped', talk: ['I’d rather not remind him I exist.'] },
    { id: 'nora', at: 'nora_spot', face: 'down', when: 'chapter=7 & c7_nora_free & !c7_escaped', talk: [{ dialog: 'nora7deck' }] },
  ],
  enter: [{ once: 'c7_deck_first', do: [N('Fog on the deck, harbor lights smeared like butter. At the gangway, a cigarette glowing at the height of a big man’s mouth.'), 'Kroll.'] }],
  hotspots: {
    hatch: {
      name: 'cargo hatch',
      look: ['The hatch I came out of, tarpaulin cut and flapping.'],
      exit: { to: 'calypso_hold', at: 'stack_spot', when: '!c7_escaped', blocked: ['I’m done with holds.'] },
    },
    fwd_hatch: {
      name: 'forward hatch',
      verb: 'Open',
      look: [pick(when('c7_nora_free', 'The forward hatch, open.'), otherwise('The forward hatch. A slide bolt holds it from this side. Nora’s down there.'))],
      use: [...freeNora()],
    },
    bolt: {
      name: 'slide bolt',
      verb: 'Slide',
      look: ['A heavy slide bolt on the forward hatch.'],
      use: [...freeNora()],
    },
    lifeboat: {
      name: 'lifeboat',
      look: ['A lifeboat on its davits, cover lashed down. Big enough to hide behind.'],
      use: ['Not tonight. The lifeboat’s for people who are leaving by sea. We’re leaving by gangway.'],
    },
    barrels: {
      name: 'barrels',
      when: '!c7_barrels',
      look: ['A stack of empty oil barrels, lashed against the rail with one rope.'],
      use: ['Lashed tight. One rope holds the lot.'],
    },
    rope: {
      name: 'lashing rope',
      verb: 'Untie',
      when: '!c7_barrels',
      look: ['One rope holding a dozen empty barrels on a sloping deck. A sailor’s faith in knots.'],
      use: ['The knot’s soaked and swollen. Untying it would take till Easter.'],
      items: {
        walter_knife: [anim('reach_side'), sfx('rope_cut'), set('c7_barrels'), sfx('barrels'), { shake: 300 },
          'One cut. The barrels go down the deck like a brass band falling down a staircase.',
          S('kroll', 'What the hell...?'),
          N('Kroll went aft to look at the barrels the way a bull goes to look at a gate.')],
      },
    },
    exit_cabin: {
      name: 'captain’s cabin',
      look: ['The wheelhouse, and under it the captain’s cabin. Lamplight behind a curtain.'],
      exit: {
        to: 'calypso_cabin', at: 'start', when: 'c7_barrels',
        blocked: ['Not with Kroll watching the deck. He’d see me before I got halfway.'],
      },
    },
    gangway: {
      name: 'gangway',
      verb: 'Go down',
      look: [pick(when('c7_barrels', 'The gangway, unguarded for the moment.'), otherwise('The gangway down to Pier 4, with Kroll at the top of it.'))],
      use: [pick(
        when('!c7_barrels', 'Past Kroll? I’ve got one face. I’d like to keep it.'),
        when('!c7_nora_free', 'Not without Nora.'),
        when('!c7_case_open', 'Not without my evidence. Everything I’ve got is in that cabin.'),
        otherwise(...escapeShip()),
      )],
    },
    derrick: {
      name: 'cargo derrick',
      look: ['A cargo derrick, boom swung in. It loaded forty cases of rocks with a straight face.'],
    },
    rail: {
      name: 'rail',
      look: ['The rail, wet with fog. Below, black water slapping the hull.'],
    },
  },
};

function freeNora() {
  return [pick(
    when('c7_nora_free', 'She’s out.'),
    otherwise(anim('reach_side'), sfx('metal_clank'), set('c7_nora_free'), 'The bolt slides back. The hatch lifts. Nora climbs out into the fog.',
      { npc: 'nora', room: 'calypso_deck', at: 'nora_spot', face: 'down' },
      S('nora', 'Tom.'), S('nora', 'I’ll hide behind the lifeboat. Get your things. Then get us off this ship.')),
  )];
}

function escapeShip() {
  return [N('We went down the gangway like two people who had every right to be there. Nobody stopped us. Kroll was still arguing with the barrels.'),
    set('c7_escaped'), { npc: 'nora', hide: true }, { npc: 'kroll', hide: true },
    { fade: 'out' as const, ms: 600 },
    N('Hask hid us in his back room, among the safes, with the curtain drawn.'),
    { goto: 'hask_shop', at: 'from_map' }];
}

export const nora7deck: DialogDef = {
  id: 'nora7deck',
  npc: 'nora',
  nodes: {
    root: {
      options: [
        { id: 'wait', text: 'Stay down. I’ll be quick.', next: 'exit', do: [S('nora', 'Be quick and be quiet. You’re usually only one of those.')] },
        {
          id: 'knife', text: 'Your father’s knife.', when: 'has:walter_knife', next: 'exit',
          do: [S('nora', 'Keep it for now. You’re the one with things to cut.')],
        },
      ],
    },
  },
};

export const calypso_cabin: RoomDef = {
  id: 'calypso_cabin',
  name: 'Captain’s cabin, MV Calypso',
  music: 'locked',
  amb: 'ship_hold',
  objects: { coat: 'true', briefcase_open: 'cu_briefcase_lock' },
  hotspots: {
    calendar: {
      name: 'calendar',
      look: ['A ship chandler’s calendar, October 1951. The twentieth is circled in red: tonight. Next to it, in pencil: “SAIL 0300.”'],
    },
    clock: {
      name: 'ship’s clock',
      look: ['A brass ship’s clock and a barometer that’s pointing at CHANGE. It isn’t wrong.'],
    },
    sea_chest: {
      name: 'sea chest',
      look: ['The captain’s sea chest. Brass corners, a name painted out.'],
      use: [anim('reach_side'), 'Socks, a Bible with a flask hollowed into it, and nothing that helps me. A practical man, the captain.'],
    },
    exit_deck: {
      name: 'door',
      look: ['The door back out to the deck.'],
      exit: { to: 'calypso_deck', at: 'cabin_spot' },
    },
    coat: {
      name: 'my coat',
      look: ['My coat on a hook. Frank always did hang his coats up nicely.'],
      use: ['The pockets are empty. Frank’s thorough. Everything will be in that briefcase.'],
    },
    briefcase: {
      name: 'briefcase',
      verb: 'Open',
      look: ['Frank’s briefcase, with a three-wheel combination lock.', clue('badge_226'),
        'Frank used the same three numbers for everything, even when we were rookies sharing a locker: his badge. Two-two-six.',
        'Some things they can’t take out of my head. They’re in too deep.'],
      use: [pick(
        when('cu_briefcase_lock', 'Open and empty. Frank’s going to be very disappointed.'),
        otherwise(anim('reach_side'), { closeup: 'briefcase_lock' }),
      )],
    },
    chart_table: {
      name: 'chart table',
      look: ['A chart of the coast with a pencilled course out past the shelf, to where the water gets very deep, very fast.'],
    },
    porthole: {
      name: 'porthole',
      look: ['Fog and the lights of Pier 4. Somewhere out there, Kroll is counting barrels.'],
    },
    bottle: {
      name: 'whisky bottle',
      look: ['Scotch, the expensive kind. Frank’s, by the label.'],
      use: ['No. I know exactly what goes in Frank’s drinks.'],
    },
    telegram: {
      name: 'telegram',
      look: ['A telegram form pinned to the bulkhead.', { narrate: '“TO GULLWING: CALYPSO LOST AT SEA EXPECTED. CLAIM PAPERS READY. — A.C.”' },
        clue('telegram'), 'A.C. Augustus Crane, pricing a ship and three lives by telegram.'],
    },
    bunk: {
      name: 'bunk',
      look: ['The captain’s bunk. The captain seems to sleep elsewhere tonight, like a man who knows his ship’s not coming home.'],
    },
  },
};

/** Ch7, at Hask's: Nora's page three and the plan. */
export const ch7Plan = [
  N('Hask put the kettle on the gas ring and the CLOSED sign in the window, and asked no questions. He never does.'),
  { npc: 'nora', room: 'hask_shop', at: 'nora_spot', face: 'left' as const },
  S('nora', 'You still have Papa’s knife?'),
  'Right here.',
  S('nora', 'The handle unscrews. He kept his union card in it.'),
  { narrate: 'The bone handle came apart in her fingers. Inside, folded tight as a cigarette paper: the last page.' },
  give('minutes3'), clue('broadcast_plan'),
  { doc: 'minutes3' },
  '“Rook is your department, Lieutenant Delaney.” Names. All of them.',
  'The Gazette won’t print it — Crane holds their loan. The police are Frank’s. Every door in this city has his coat on the hook.',
  S('nora', 'Then we don’t use a door.'),
  S('nora', 'Tonight at nine, Crane goes on the radio. Every set in Brackwater will be tuned in to hear him.'),
  'So we take the radio.',
  S('hask', 'You will need a key to the WBRK booth. I fitted those locks in 1938. I can help.'),
  set('c7_planned'),
  'A key from Hask. A way into the gala. Something to keep my head clear if they get a needle into me again.',
  'And Gus’s own log, for the night of the fire. Gus said he’d give it to me when he trusted me.',
  { autosave: 'Chapter 7 — The plan' },
];

export { wait };
