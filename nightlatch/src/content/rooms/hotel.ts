import type { RoomDef } from '../../engine/types';
import { S, anim, clue, give, otherwise, pick, set, sfx, take, wait, when } from '../dsl';
import { coatExchange } from '../dialogs/ch1';

export const hotel_room: RoomDef = {
  id: 'hotel_room',
  name: 'Room 9, Hotel Sorrento',
  music: [['chapter=1 & !c1_room9_open', 'locked'], ['true', 'locked']],
  amb: 'rain_window',
  objects: {
    wardrobe_open: 'c1_wardrobe_open',
    hanger: 'c1_wardrobe_open & !c1_hanger_taken',
    hat: '!c1_hat_taken',
    newspaper_door: 'c1_paper_door',
  },
  hotspots: {
    door: {
      name: 'door',
      verb: 'Open',
      look: [pick(
        when('c1_room9_open', 'The door to the corridor. Unlocked, finally.'),
        otherwise("Locked. And there's a key in it — on the far side."),
      )],
      exit: {
        to: 'hotel_lobby',
        at: 'from_stairs',
        when: 'c1_room9_open',
        blocked: [anim('reach_side'), sfx('door_locked'), {
          random: [["Locked tight. Somebody tucked me in."], ["Still locked. Doors are like that."],
            ["I rattle it. It rattles back."]],
        }],
      },
      items: {
        key9: [anim('reach_side'), sfx('unlock'), set('c1_room9_open'),
          'The lock gives with a clack like a dropped billiard ball.'],
        wire: ['The keyhole is the part of the door that wants wire.'],
        newspaper: ['Under the door would be better than against it.'],
      },
    },
    keyhole: {
      name: 'keyhole',
      verb: 'Look through',
      look: [pick(
        when('!c1_key_pushed', anim('reach_side'),
          'Through the keyhole: a brass key, sitting in the lock on the corridor side.',
          'Beyond it, a strip of hall carpet the color of old liver.'),
        otherwise("Just the corridor now. The key's gone from the lock."),
      )],
      use: [pick(
        when('!c1_key_pushed', anim('reach_side'),
          'Through the keyhole: a brass key, sitting in the lock on the corridor side.',
          'Beyond it, a strip of hall carpet the color of old liver.'),
        otherwise("Just the corridor now. The key's gone from the lock."),
      )],
      items: {
        wire: [pick(
          when('c1_key_pushed', "The key's already out."),
          when('c1_paper_door', anim('reach_side'), sfx('metal_clank'),
            'I feed the wire into the keyhole and push. Something gives on the far side...',
            sfx('key_drop'), '...and lands with a soft pat. On paper, by the sound of it.', set('c1_key_pushed')),
          otherwise("If I push the key out now, it'll drop onto the hall carpet and stay there.",
            'I need something on the far side to catch it first.'),
        )],
        hanger: ["It's too bent for a keyhole. I'd need to straighten it first."],
        key9: ["That's the key. I'm trying to get it on this side, not put it back."],
      },
    },
    gap: {
      name: 'gap under the door',
      verb: 'Look at',
      when: '!c1_paper_door',
      look: ['A good half-inch between the door and the floor. Management economizes on wood.'],
      use: ['I put my eye to the gap. Hall carpet. Somebody’s shoes went past recently. Shoes do that.'],
      items: {
        newspaper: [anim('pickup_side'), sfx('paper_slide'), take('newspaper'), set('c1_paper_door'),
          'I slide the newspaper under the door and leave a corner on my side.', 'Fishing tackle, Sorrento style.'],
        wire: ['Pushing wire under a door gets me nothing but a wire under a door.'],
        hanger: ['The hanger would fit. It just wouldn’t do anything when it got there.'],
      },
    },
    newspaper_door: {
      name: 'newspaper',
      verb: 'Pull',
      when: 'c1_paper_door',
      look: [pick(
        when('c1_key_pushed', 'The corner of the newspaper. There’s a little weight on the far end now.'),
        otherwise('The corner of my newspaper, poking back under the door.'),
      )],
      use: [pick(
        when('c1_key_pushed', anim('pickup_side'), sfx('paper_slide'), 'Slowly does it...', { unset: 'c1_paper_door' },
          give('newspaper'), give('key9'), set('c1_key_got'),
          'The key comes home on page one, lying across the missing stenographer.'),
        otherwise(anim('pickup_side'), { unset: 'c1_paper_door' }, give('newspaper'),
          'I pull the paper back. Nothing on it but the news.'),
      )],
      items: {
        wire: ['The wire goes through the keyhole, not under the door.'],
      },
    },
    bed: {
      name: 'bed',
      verb: 'Search',
      look: ['The sheets have the look of a crime scene. The victim was sleep.'],
      use: [pick(
        when('!c1_newspaper_found', anim('pickup_side'), 'Under the mattress...', set('c1_newspaper_found'),
          give('newspaper'), '...a newspaper. Somebody’s idea of a pillow mint.', { doc: 'gazette_oct15' },
          'Monday, October the fifteenth.', 'The last thing I remember is Tuesday the ninth.',
          'Six days. Somebody owes me six days.', clue('lost_days'),
          'And a missing stenographer on the front page. Pretty girl. Never seen her in my life.'),
        otherwise('Nothing else under there but lumps and regret.'),
      )],
    },
    wardrobe: {
      name: 'wardrobe',
      verb: 'Open',
      look: [pick(
        when('c1_wardrobe_open & !c1_hanger_taken', 'Empty, except for one wire hanger and the ghost of somebody’s mothballs.'),
        when('c1_wardrobe_open', 'Empty. Even the mothballs moved out.'),
        otherwise('A wardrobe big enough to hide a body.'),
      )],
      use: [pick(
        when('!c1_wardrobe_open', anim('reach_side'), sfx('creak'), set('c1_wardrobe_open'),
          'No body. Not even mine. Just one wire hanger.'),
        when('!c1_hanger_taken', anim('reach_side'), set('c1_hanger_taken'), give('hanger')),
        otherwise('Empty. I already took the only thing worth taking, which was a coat hanger. That’s the Sorrento for you.'),
      )],
    },
    hanger: {
      name: 'coat hanger',
      verb: 'Take',
      when: 'c1_wardrobe_open & !c1_hanger_taken',
      look: ['A wire coat hanger. Of everything in this room, the only thing with ambition.'],
      use: [anim('reach_side'), set('c1_hanger_taken'), give('hanger')],
    },
    radiator: {
      name: 'radiator',
      verb: 'Touch',
      look: ['A cast-iron radiator, painted so many times it’s mostly paint.'],
      use: ['Warm. The only thing in this room that is.'],
      items: {
        hanger: [anim('pickup_side'), sfx('metal_clank'), take('hanger'), give('wire'),
          'I hook the hanger behind the pipe and lean on it until it gives up being a hanger.'],
        wire: ['It’s as straight as it’s going to get.'],
      },
    },
    window: {
      name: 'window',
      verb: 'Open',
      look: ['Rain, four floors of it. A neon sign spells HOTEL SORRENTO at nobody in particular.'],
      use: [anim('reach_side'), 'Painted shut. Probably to keep the guests in. Or the view out.'],
      items: {
        wire: ['I could scratch my name in the paint. That would show them.'],
      },
    },
    mirror: {
      name: 'mirror',
      verb: 'Look in',
      look: [
        'A bruise over my left eye the color of a ripe plum. A week of beard.',
        'Whoever dressed me tied my tie like they were angry at it.',
      ],
      use: [
        'A bruise over my left eye the color of a ripe plum. A week of beard.',
        'Whoever dressed me tied my tie like they were angry at it.',
      ],
    },
    basin: {
      name: 'washbasin',
      verb: 'Use',
      look: ['A washbasin with a crack in it shaped like Florida.'],
      use: [anim('reach_side'), sfx('pour'), 'I splash cold water on my face. My face stays the same. Worth a try.'],
    },
    painting: {
      name: 'painting',
      verb: 'Straighten',
      look: ['A ship in a storm. The artist had never seen either.'],
      use: ['I straighten it. It immediately looks worse.'],
    },
    lamp: {
      name: 'lamp',
      verb: 'Switch off',
      look: ['A bedside lamp with a shade the color of weak tea.'],
      use: ['I’ll leave it on. I’ve been in the dark long enough.'],
    },
    phone: {
      name: 'telephone',
      verb: 'Use',
      look: ['Somebody cut the cord. Clean, with a knife.'],
      use: [sfx('phone_pickup'), 'Dead. Deader than a doornail. At least a doornail holds a door up.'],
    },
    nightstand: {
      name: 'nightstand',
      verb: 'Open',
      look: ['A nightstand with a drawer. Hotels always leave you something in the drawer.'],
      use: [anim('reach_side'), sfx('drawer_open'), {
        once: 'c1_bible', do: ["A Bible. Somebody has underlined 'Seek, and ye shall find.'", 'An optimist.'],
        else: ['Just the Bible. Still underlined. Still optimistic.'],
      }],
    },
    chair: {
      name: 'chair',
      verb: 'Sit on',
      look: ['A chair. Not a comfortable one. They don’t make those for rooms like this.'],
      use: ['I’d rather stand. If I sit down I might not get up until Thursday.'],
    },
    hat: {
      name: 'hat',
      verb: 'Take',
      when: '!c1_hat_taken',
      look: ['My hat, hanging on the bedpost like it’s waiting for me to come to my senses.'],
      use: [anim('reach_side'), set('c1_hat_taken'), 'I put it on. Something crackles in the band.',
        clue('hat_note'), { doc: 'hat_note' }, 'My handwriting. I don’t remember writing it.',
        'Trust Mabel. Don’t drink anything Sal pours.', 'Sal who?'],
    },
  },
};

export const hotel_lobby: RoomDef = {
  id: 'hotel_lobby',
  name: 'Hotel Sorrento',
  music: 'city',
  amb: 'rain_street',
  npcs: [{
    id: 'pettibone', at: 'pettibone_spot', face: 'down',
    items: {
      key9: coatExchange,
      retainer: [S('pettibone', 'Keep your money, Mr. Rook. You\u2019re paid up till Tuesday.')],
    },
  }],
  enter: [{
    once: 'c1_lobby_first',
    do: [
      S('pettibone', 'Well, look who’s up. Morning, Mr. Rook.'),
      S('pettibone', 'You look like you got hit by a streetcar and the streetcar won.'),
      { person: 'pettibone' },
    ],
  }],
  hotspots: {
    exit_stairs: {
      name: 'stairs to Room 9',
      look: ['Four flights up to Room 9. I’ve seen enough of Room 9.'],
      exit: { to: 'hotel_room', at: 'door_in' },
    },
    exit_street: {
      name: 'street door',
      look: ['The street door. Rain is pressed against the glass like it wants to come in.'],
      exit: {
        to: '', map: true, when: 'has:lighter',
        blocked: ['Not without my coat. My wallet’s in it.', 'And it’s raining hard enough to drown a duck.'],
      },
    },
    desk: {
      name: 'front desk',
      verb: 'Look at',
      look: ['Mahogany, once. Now mostly cigarette burns held together by varnish.'],
      use: ['Mahogany, once. Now mostly cigarette burns held together by varnish.'],
    },
    bell: {
      name: 'desk bell',
      verb: 'Ring',
      look: ['A brass bell. The universal sign for “I’m in a hurry and you’re not.”'],
      use: [sfx('glass_clink'), S('pettibone', 'I’m right here, Mr. Rook. I’ve been right here since 1934.')],
    },
    register: {
      name: 'guest register',
      verb: 'Read',
      look: [{ doc: 'register' }, clue('register'), '‘Patient sleeps.’ Not guest. Patient.'],
      use: [{ doc: 'register' }, clue('register'), '‘Patient sleeps.’ Not guest. Patient.'],
    },
    cubbies: {
      name: 'key cubbies',
      look: ['Pigeonholes for room keys. Most of them are full. The Sorrento is not having a good decade.'],
      use: ['Pettibone would take that personally.'],
    },
    fern: {
      name: 'fern',
      look: ['A potted fern that has given up on everything except living.'],
      use: ['I leave it be. We have a lot in common.'],
    },
    armchair: {
      name: 'armchair',
      verb: 'Sit in',
      look: ['An armchair with its stuffing coming out. It has seen things.'],
      use: ['No. If I sit down, I’ll sleep, and I’ve done enough of that this week.'],
    },
    phone_booth: {
      name: 'phone booth',
      verb: 'Use',
      look: ['A phone booth: wood, glass, and the smell of every cigar smoked in it since Coolidge.'],
      use: [pick(
        when('has:lighter & !c1_called_mabel', sfx('phone_dial'), wait(500),
          S('mabel', 'Rook Investigations.'), 'Mabel. It’s me.',
          S('mabel', 'Tom? Where have you BEEN? Six days, Tom!'), S('mabel', 'You get over here this minute.'),
          set('c1_called_mabel'), 'Yes, Mabel.'),
        when('!has:lighter', 'My nickels are in my coat. My coat is behind the desk.'),
        otherwise('I’ve already been told to get over there this minute. Twice would be pushing it.'),
      )],
    },
    fan: {
      name: 'ceiling fan',
      look: ['A ceiling fan, pushing the same air around since 1928.'],
      use: ['Out of reach. Like most things at the Sorrento.'],
    },
  },
};
