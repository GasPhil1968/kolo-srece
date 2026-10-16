import type { RoomDef } from '../../engine/types';
import { CH2_START } from '../story';
import { N, S, anim, clue, give, otherwise, pick, set, sfx, take, wait, when } from '../dsl';

export const pier9: RoomDef = {
  id: 'pier9',
  name: 'Pier 9',
  music: [['chapter=8', 'ending'], ['true', 'harbor']],
  amb: 'harbor',
  variant: [['chapter=1', ''], ['chapter=8', 'dawn'], ['true', 'day']],
  npcs: [
    { id: 'gus', at: 'gus_spot', face: 'left', when: 'chapter>=2' },
    { id: 'nora', at: 'nora_spot', face: 'left', when: 'chapter=8 & c8_dawn', talk: [{ dialog: 'epilogue' }] },
  ],
  enter: [
    {
      if: 'chapter=1 & clue:on_ice & !c1_end',
      then: [
        N('Pier 9 at midnight. Fog thick enough to lean on.'),
        { walk: 'from_cold_store' },
        'The cold store door is open a crack. Somebody’s expecting me. Or somebody’s expecting somebody.',
        anim('reach_side'), sfx('creak'), wait(600),
        { sfx: 'sap' }, { shake: 300 }, { fade: 'out', ms: 300 },
        { set: 'c1_end' },
        { music: null },
        wait(900),
        N('Somewhere between the sap and the floor, I lost a few more minutes.'),
        N('At least this time I knew which ones.'),
        ...CH2_START,
      ],
    },
  ],
  hotspots: {
    exit_street: {
      name: 'Harbor Street',
      look: ['Back towards Harbor Street and the rest of the city.'],
      exit: { to: '', map: true },
    },
    cold_store_door: {
      name: 'cold store door',
      look: ['BRACKWATER FISH EXCHANGE — COLD STORE. Four inches of insulated oak.'],
      exit: {
        to: 'cold_store', at: 'door_spot', when: 'chapter=2 & c2_door_open',
        blocked: [pick(
          when('chapter>=3', 'I’ve seen enough of the inside of that door for one lifetime.'),
          otherwise('Locked.'),
        )],
      },
    },
    hut: {
      name: 'watchman’s hut',
      look: ['Gus’s hut: a stove, a stool, a kettle and forty years of gull stories.'],
    },
    brazier: {
      name: 'brazier',
      look: ['A brazier of coals. The only warm thing on the waterfront, including the people.'],
      use: [anim('reach_side'), 'I warm my hands. It helps more than I’d admit.'],
    },
    wreck: {
      name: 'wreck of the Meridian',
      look: ['What’s left of the SS Meridian. They never raised her. Too expensive, they said.', 'Too many questions, I’d say.'],
      use: ['There’s nothing to be done for her from here.'],
    },
    water: {
      name: 'harbor',
      look: ['Black water and the reflections of things that aren’t there anymore.'],
    },
    gulls: {
      name: 'gulls',
      look: ['The gulls regard me with professional suspicion.'],
      use: [sfx('gull'), 'The gull and I come to an understanding. The understanding is that it hates me.'],
    },
    crane: {
      name: 'dock crane',
      look: ['A dock crane, head bowed in the fog like it’s praying for overtime.'],
    },
    crates: {
      name: 'crates',
      look: ['Crates stencilled with half the ports of the world. None of them are going anywhere tonight.'],
    },
    bollard: {
      name: 'bollard',
      look: ['An iron bollard with a hawser on it, thick as my arm. The ship it belonged to is long gone.'],
    },
    lamp: {
      name: 'lamp post',
      look: ['A sodium lamp making a small orange argument against the fog. The fog is winning.'],
    },
  },
};

export const cold_store: RoomDef = {
  id: 'cold_store',
  name: 'Cold store, Pier 9',
  music: 'locked',
  amb: 'freezer_hum',
  objects: {
    handle_fitted: 'c2_handle_fitted',
    fish_cut: 'c2_fish_cut',
    ice_pick: '!c2_pick_taken',
    tub_salted: 'c2_salted & !c2_handle_taken',
    handle_in_ice: '!c2_handle_taken',
    crate_open: 'c2_crate_open',
    door_open: 'c2_door_open',
  },
  hotspots: {
    door: {
      name: 'door',
      verb: 'Open',
      look: [pick(
        when('c2_door_open', 'Open. Gray morning outside, and air that\u2019s merely cold.'),
        otherwise('A cold-store door, four inches thick, latched from the outside.'),
      )],
      exit: {
        to: 'pier9', at: 'from_cold_store', when: 'c2_door_open',
        blocked: [anim('reach_side'), sfx('door_locked'), 'It doesn\u2019t budge. Neither would I, in its place.'],
      },
      items: {
        ice_pick: ['I could chip at it until Easter. The release is the way out.'],
        lighter: ['Warming the whole door would take a week. The release spindle is the part that matters.'],
      },
    },
    spindle: {
      name: 'release spindle',
      verb: 'Turn',
      look: [pick(
        when('c2_handle_fitted & !c2_thawed', 'The handle\u2019s on. The spindle\u2019s frozen into its bushing.'),
        when('c2_handle_fitted', 'Handle on, ice gone. Time to leave.'),
        otherwise('The square end of the release rod. Somebody took the handle off. Somebody didn\u2019t want me letting myself out.'),
      )],
      use: [pick(
        when('c2_door_open', 'It\u2019s open. I\u2019m not tempting fate twice.'),
        when('c2_handle_fitted & c2_thawed', anim('reach_side'), sfx('unlock'), sfx('door_open'), set('c2_door_open'),
          'The latch lifts outside with a clunk I feel in my teeth.', 'The door swings open on a gray morning.',
          { autosave: 'Chapter 2 \u2014 Out of the cold' }),
        when('c2_handle_fitted', anim('reach_side'), 'It won\u2019t turn. The spindle\u2019s frozen solid.'),
        otherwise('I can\u2019t turn a square spindle with my fingers. I\u2019ve tried. My fingers have opinions about it now.'),
      )],
      items: {
        release_handle: [anim('reach_side'), sfx('metal_clank'), take('release_handle'), set('c2_handle_fitted'),
          'The handle slides onto the spindle like it missed it.'],
        lighter: [pick(
          when('c2_thawed', 'It\u2019s thawed already.'),
          otherwise(anim('reach_side'), sfx('lighter'), 'I run the flame along the rod until the frost weeps.', wait(500),
            set('c2_thawed'), 'That should loosen it.'),
        )],
        ice_pick: ['I\u2019d snap the pick before I turned anything with it.'],
      },
    },
    fish_rows: {
      name: 'frozen cod',
      look: ['Rows of frozen cod hanging from the beam, stencilled A, B and C. They stare at me like a jury.'],
      use: [pick(
        when('clue:pocketbook', 'On ice, B3, my notebook says. Row B, third fish along.'),
        otherwise('Cod. A great deal of cod.'),
      )],
    },
    fish_b3: {
      name: 'third cod in row B',
      verb: 'Search',
      look: [pick(
        when('c2_fish_cut', 'I\u2019ve already performed surgery on that one.'),
        otherwise('Row B, third along. It\u2019s got a bulge in its belly that isn\u2019t fish.'),
      )],
      use: [pick(
        when('c2_fish_cut', 'I\u2019ve already performed surgery on that one.'),
        when('has:ice_pick', ...fishCut()),
        otherwise('There\u2019s something inside it, but it\u2019s frozen solid. I need something sharp.'),
      )],
      items: {
        ice_pick: [pick(when('c2_fish_cut', 'Once was plenty.'), otherwise(...fishCut()))],
      },
    },
    workbench: {
      name: 'workbench',
      verb: 'Search',
      look: ['A workbench crusted with frost and fish scales.'],
      use: [pick(
        when('!c2_pick_taken', anim('reach_side'), sfx('ice_chip'), give('ice_pick'), set('c2_pick_taken'),
          'An ice pick, frozen to the bench. It comes free with a crack.'),
        otherwise('Nothing else on it but frozen scales.'),
      )],
    },
    ice_pick: {
      name: 'ice pick',
      verb: 'Take',
      when: '!c2_pick_taken',
      look: ['An ice pick, frozen to the bench.'],
      use: [anim('reach_side'), sfx('ice_chip'), give('ice_pick'), set('c2_pick_taken'), 'It comes free with a crack.'],
    },
    salt: {
      name: 'sack of rock salt',
      verb: 'Take some',
      look: ['ROCK SALT \u2014 FOR BRINE & DE-ICING. Somebody stencils everything around here.'],
      use: [pick(
        when('has:rock_salt', 'I\u2019ve got a fistful already. Any more and I\u2019d be a pretzel.'),
        when('c2_salted', 'The tub\u2019s salted already.'),
        otherwise(anim('pickup_side'), sfx('salt'), give('rock_salt'), 'A fistful of rock salt.'),
      )],
    },
    tub: {
      name: 'brine tub',
      verb: 'Pull at',
      look: [pick(
        when('c2_handle_taken', 'Just slush now, and the smell of a very old sea.'),
        when('c2_salted', 'The salt\u2019s eating into the ice. The handle\u2019s nearly loose.'),
        otherwise('A brine tub frozen solid. Frozen into it, like a fly in amber: the door\u2019s release handle.',
          'Somebody has a sense of humor.'),
      )],
      use: [pick(
        when('c2_handle_taken', 'Slush. I\u2019ve had what I wanted from it.'),
        when('c2_salted & has:ice_pick', ...handleFree()),
        when('c2_salted', 'The ice has gone soft. I just need something to chip it with.'),
        otherwise(anim('pickup_side'), 'I can\u2019t pull it out. The ice has a better grip on it than I do.'),
      )],
      items: {
        rock_salt: [anim('pickup_side'), sfx('salt'), take('rock_salt'), set('c2_salted'),
          'I pack the salt around the handle. Salt melts ice, even in here.', wait(700), 'Give it a minute.', wait(700),
          'There. It\u2019s going soft around the edges. Like me.'],
        ice_pick: [pick(
          when('c2_handle_taken', 'Nothing left to dig out.'),
          when('c2_salted', ...handleFree()),
          otherwise(anim('pickup_side'), sfx('ice_chip'), 'The pick just skates off. That ice is harder than a landlord.'),
        )],
        lighter: ['I\u2019d be a fish stick before that thawed.'],
      },
    },
    crates: {
      name: 'Halcyon crates',
      verb: 'Open',
      look: ['Crates stencilled HALCYON HOUSE \u2014 MEDICAL \u2014 KEEP COLD. Hospital supplies, packed in among the cod.'],
      use: [pick(
        when('c2_crate_open & !has:vial', anim('pickup_side'), give('vial'), 'I take another vial. Evidence keeps.'),
        when('c2_crate_open', 'Straw and vials. I\u2019ve got the one I need.'),
        otherwise('Nailed shut. I need something to pry with.'),
      )],
      items: {
        ice_pick: [pick(
          when('c2_crate_open', 'It\u2019s already open.'),
          otherwise(anim('pickup_side'), sfx('pry'), set('c2_crate_open'), give('vial'), clue('shipping_label'),
            'I lever the lid up. Straw, and rows of little vials of something clear. L-7.',
            'The label says HALCYON HOUSE, GULL HILL. Shipped by Gullwing Holdings, aboard the MV Calypso.',
            'I pocket one. Somebody owes me an explanation, and this might be the down payment.',
            'Otto Kessler, the pharmacist on Lyme Street, could tell me what\u2019s in it.', { unlock: 'pharmacy' }),
        )],
      },
    },
    thermometer: {
      name: 'thermometer',
      look: ['Fourteen degrees Fahrenheit and falling. My blood is filing a complaint.'],
      use: ['Tapping it doesn\u2019t make it any warmer. I check anyway.'],
    },
    coil: {
      name: 'refrigeration coil',
      look: ['The refrigeration coil and its fan, pushing the cold around so it can get into everything.'],
      use: ['There\u2019s no switch on this side. That would be too convenient.'],
      items: { lighter: ['I\u2019d need a bigger lighter. About the size of the sun.'] },
    },
    bulb: {
      name: 'caged bulb',
      look: ['A bare bulb in a wire cage. It hums like it\u2019s got something on its mind.'],
    },
  },
};

function fishCut() {
  return [anim('reach_side'), sfx('ice_chip'), 'Chipping at a frozen cod with an ice pick. My mother had hopes for me.',
    sfx('wood_crack'), set('c2_fish_cut'), give('minutes1'),
    'An oilskin packet. Inside, a typed page \u2014 and a note in my own handwriting.',
    N('\u201cRook \u2014 if you\u2019re reading this, you\u2019re you again. \u2014 Rook.\u201d'),
    { doc: 'minutes1' }, clue('minutes1_clue'),
    'Page one of three. Whatever I found, I didn\u2019t keep it in one place.', 'Smart. Smelly, but smart.'];
}

function handleFree() {
  return [anim('pickup_side'), sfx('ice_chip'), give('release_handle'), set('c2_handle_taken'),
    'The softened ice gives way. One release handle, slightly pickled.'];
}

export { S };
