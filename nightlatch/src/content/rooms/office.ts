import type { RoomDef } from '../../engine/types';
import { S, anim, clue, give, otherwise, pick, set, sfx, wait, when } from '../dsl';
import { transcribe } from '../dialogs/recurring';
import { ch4Arrest } from './halcyon';
import { ch7Plan } from './calypso';

/** Rook's office, 14 Marrow Street. Visited in every chapter. */
export const office: RoomDef = {
  id: 'office',
  name: "Rook's office",
  music: [['chapter=4 & c4_escaped', 'revelation'], ['true', 'office']],
  amb: 'rain_window',
  npcs: [
    {
      id: 'mabel', at: 'mabel_spot', face: 'right',
      items: { steno_pad: [{ if: '!clue:steno_transcript', then: transcribe(), else: [S('mabel', 'I\u2019ve read it, Tom. Once was enough.')] }] },
    },
    { id: 'evelyn', at: 'client_spot', face: 'left', when: 'chapter=1 & !c1_hired' },
  ],
  enter: [{ if: 'chapter=4 & c4_escaped & !c4_arrest', then: ch4Arrest }, {
    once: 'c1_office_first',
    do: [
      S('mabel', 'Six days, Tom. Six days without a call, a postcard, or a body.'),
      S('mabel', 'I was about to start interviewing replacements.'),
      'Hello, Mabel.',
      S('mabel', 'There’s a lady waiting for you. She’s been here since nine.'),
      { person: 'mabel' },
    ],
  }],
  hotspots: {
    exit_door: {
      name: 'door',
      look: ['THOMAS ROOK — PRIVATE INQUIRIES, backwards through frosted glass. From in here it reads like a confession.'],
      exit: { to: '', map: true },
    },
    exit_stairs_down: {
      name: 'stairs down to Hask’s',
      look: ['The back stairs down to Hask’s Lock & Key.'],
      exit: { to: 'hask_shop', at: 'from_office' },
    },
    mabel_desk: {
      name: 'Mabel’s desk',
      look: ['Mabel’s desk: a typewriter, an ashtray shaped like Niagara Falls, and order. Terrifying order.'],
      use: [S('mabel', 'Hands off, Tom. I know where everything is, which is more than you can say.')],
    },
    typewriter: {
      name: 'typewriter',
      look: ['Mabel’s Underwood. She types faster than I think.'],
      use: [S('mabel', 'Don’t touch my typewriter.')],
    },
    rook_desk: {
      name: 'my desk',
      look: ['My desk. Under the dust there’s a blotter, and under the blotter, more dust.'],
      use: ['Nothing on it I need. Nothing on it anybody needs.'],
    },
    drawer: {
      name: 'desk drawer',
      verb: 'Open',
      look: ['The drawer where I keep the things I shouldn’t.'],
      use: [anim('reach_side'), sfx('drawer_open'), pick(
        when('chapter=1', 'A bottle of rye, half empty. Or half full, if you’re the kind of drunk who’s also an optimist.',
          'I’ll pass. I’ve had enough of other people’s ideas about what goes in my glass.'),
        otherwise('The rye’s still there. So am I. Neither of us is going anywhere tonight.'),
      )],
    },
    phone: {
      name: 'telephone',
      verb: 'Use',
      look: ['A black telephone. It rings when it wants something.'],
      use: [{ dialog: 'office_phone' }],
    },
    lamp: {
      name: 'desk lamp',
      look: ['A green banker’s lamp. The only banker in Brackwater I trust.'],
      use: ['I leave it on. It makes the office look like somebody works here.'],
    },
    window: {
      name: 'window',
      look: ['Marrow Street in the rain. The neon from the laundry across the road turns the puddles pink.'],
      use: [anim('reach_side'), 'The sash is swollen shut. Like everything else in this building, including the landlord.'],
    },
    blinds: {
      name: 'blinds',
      look: ['Venetian blinds. They cut the street light into neat stripes, like a jail with good taste.'],
      use: ['I part the slats. Nobody watching. Nobody I can see.'],
    },
    filing_cabinet: {
      name: 'filing cabinet',
      verb: 'Search',
      look: ['Two drawers of cases. Cheating husbands, missing dogs, one missing husband who turned out to be a dog.'],
      use: [anim('reach_side'), sfx('drawer_open'), pick(
        when('!clue:meridian_file', 'My file on the Meridian fire.', { doc: 'meridian_file' }, clue('meridian_file'),
          'It’s thinner than I remember. Then again, so am I.'),
        otherwise('The Meridian file. Still thin. Still mine.', { doc: 'meridian_file' }),
      )],
    },
    coat_rack: {
      name: 'coat rack',
      look: ['A coat rack. It’s holding up better than I am.'],
      use: ['My coat stays on. It’s that kind of week.'],
    },
    client_chair: {
      name: 'client chair',
      look: ['The client chair. Many sad stories have been told in it, most of them about money.'],
      use: ['That’s for clients. I don’t have the money to hire me.'],
    },
    cooler: {
      name: 'water cooler',
      verb: 'Drink from',
      look: ['A water cooler with a paper cone dispenser and a philosophy of its own.'],
      use: [anim('reach_side'), sfx('pour'), 'Water. It tastes of the pipes and the century.'],
    },
    photo: {
      name: 'framed photo',
      look: ['Me and Frank Delaney, 1938, the day we made detective.', 'Frank still has his hair. I still have my nose.'],
      use: ['I straighten it. Frank’s grin straightens with it.'],
    },
    calendar: {
      name: 'calendar',
      look: ['October 1951, courtesy of Kessler’s Pharmacy. The ninth is circled: LANTERN 11, in my writing.'],
      use: ['Tearing off the pages won’t give me the days back.'],
    },
    safe: {
      name: 'safe',
      verb: 'Open',
      look: ['My safe. The combination is my mother’s birthday. The contents are my father’s watch and four dollars.'],
      use: [anim('reach_side'), sfx('safe_tick'), wait(300), 'Watch. Four dollars. My life’s savings, give or take the watch.'],
    },
    fern: {
      name: 'fern',
      look: ['Mabel’s fern. She fed it while I was gone. It looks better than I do.'],
      use: ['I’d water it, but Mabel would know.'],
    },
  },
};

export const hask_shop: RoomDef = {
  id: 'hask_shop',
  name: 'Hask’s Lock & Key',
  music: 'office',
  amb: 'rain_street',
  npcs: [{
    id: 'hask', at: 'hask_spot', face: 'down',
    items: {
      retainer: [S('hask', 'Put your money away, Thomas. Those picks are in my drawer, and you know how to open a drawer.')],
      padlock: [{ dialog: 'hask', node: 'root' }],
    },
  }],
  enter: [{ if: 'chapter=7 & c7_escaped & !c7_planned', then: ch7Plan }],
  hotspots: {
    exit_street: {
      name: 'street door',
      look: ['The shop door. HASK — LOCK & KEY in gold leaf, backwards from in here.'],
      exit: { to: '', map: true },
    },
    exit_upstairs: {
      name: 'stairs up to the office',
      look: ['The back stairs to my office.'],
      exit: { to: 'office', at: 'from_hask' },
    },
    picks_drawer: {
      name: 'locked drawer under the counter',
      look: ['A drawer under the counter, locked. A leather roll shows at the back: my lock picks, I’d bet on it.'],
      use: ['Locked. Hask locks his drawers the way other men breathe.'],
      items: {
        wire: [pick(
          when('!has:lockpicks & !c3_picks_taken', anim('reach_side'), sfx('drawer_open'), set('c3_picks_taken'), give('lockpicks'),
            'The wire finds the tumblers one at a time. The drawer slides out, and my picks are there in their roll, exactly where Hask would leave them.'),
          otherwise('The drawer is empty now, apart from the wire I left in the lock.'),
        )],
      },
    },
    counter: {
      name: 'counter',
      look: ['Oak, scarred by sixty years of keys being slapped down on it by people who’ve lost the other one.'],
      use: [S('hask', 'If you lean on my counter, Thomas, you buy my counter.')],
    },
    key_wall: {
      name: 'key blanks',
      look: ['Hundreds of key blanks on hooks, waiting to become somebody’s front door.'],
      use: ['I don’t touch Hask’s blanks. I like my fingers where they are.'],
    },
    machine: {
      name: 'key-cutting machine',
      look: ['A key-cutting machine. Hask can copy a key from a pencil rubbing and a bad description.'],
      use: [S('hask', 'Hands off the machine. It bites.')],
    },
    padlock_case: {
      name: 'padlock case',
      look: ['Padlocks under glass: brass, steel, a few that look like they’ve done time.'],
      use: ['Locked. Of course it’s locked. It’s a locksmith’s.'],
    },
    safe_display: {
      name: 'display safe',
      look: ['A big display safe with its door open to show how thick it is. It’s thick.'],
      use: ['I resist the urge to climb in and shut the door. It’s been that kind of week.'],
    },
    register: {
      name: 'cash register',
      look: ['A brass cash register that rings like a fire alarm when Hask makes a sale. It’s quiet a lot.'],
      use: [S('hask', 'That’s my register, Thomas. Yours is upstairs, and it’s empty.')],
    },
    curtain: {
      name: 'back-room curtain',
      look: ['A curtain to Hask’s back room, where he keeps the things he doesn’t put in the window.'],
      use: [S('hask', 'Back room’s private.')],
    },
    window: {
      name: 'shop window',
      look: ['Rain on gold lettering. Across the street, the laundry’s neon blinks like it’s trying to tell me something.'],
    },
  },
};
