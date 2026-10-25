import type { RoomDef } from '../../engine/types';
import { CH3_START } from '../story';
import { N, S, anim, clue, give, otherwise, pick, set, sfx, wait, when } from '../dsl';

const ch2End = [
  N('I came back to the Gazette at eight, when the night shift had gone home.'),
  set('c2_evening'),
  { npc: 'evelyn', room: 'gazette', at: 'from_map', face: 'right' as const },
  S('evelyn', 'Mr. Rook! I’ve been looking everywhere for you.'),
  'Miss Marsh. How did you find me?',
  S('evelyn', 'Your secretary told me. You look frozen. Here — coffee. I brought a thermos.'),
  anim('reach_side'), sfx('pour'),
  'Thanks.',
  wait(900),
  '...Anise.',
  { music: 'revelation' },
  'Somebody’s put anise in the coffee.',
  S('evelyn', 'Is something wrong, Mr. Rook?'),
  N('Kessler had said they’d hide it in anise. I had maybe twenty minutes before I’d do anything anyone told me to.'),
  'Excuse me, Miss Marsh. I need to... develop something.',
  { walk: 'from_darkroom' },
  sfx('door_close'),
  { fade: 'out' as const, ms: 600 },
  { npc: 'evelyn', hide: true },
  N('I remember the click of a padlock.'),
  N('After that, I don’t remember anything at all.'),
  set('c2_end'),
  ...CH3_START,
];

export const gazette: RoomDef = {
  id: 'gazette',
  name: 'Brackwater Gazette',
  music: [['c2_evening & chapter=2', 'revelation'], ['true', 'bureau']],
  amb: 'newsroom',
  variant: [['c2_evening & chapter=2', 'night'], ['true', '']],
  objects: { press_card: '!has:press_card & !c2_press_taken', darkroom_lamp_on: 'chapter=2 & c2_evening' },
  npcs: [{ id: 'abernathy', at: 'abernathy_spot', face: 'down', when: '!(chapter=2 & c2_evening)' }],
  enter: [{
    if: 'chapter=3 & !c3_gazette_after',
    then: [
      set('c3_gazette_after'),
      S('abernathy', 'You slept in my darkroom? Was it at least comfortable?'),
      'Like a coffin with better chemicals.',
    ],
  }],
  hotspots: {
    exit_street: {
      name: 'street door',
      look: ['The street door. Through the glass, delivery trucks wait for tomorrow’s lies.'],
      exit: { to: '', map: true },
    },
    editor_office: {
      name: 'editor’s office',
      look: ['Abernathy’s glass box. The blinds are half down, like his expectations.'],
      use: ['The door says EDITOR — KNOCK. The glass says he can see me anyway.'],
    },
    pike_desk: {
      name: 'Pike’s desk',
      look: ['Wendell Pike’s desk: a hat, a cold coffee cup with a skin on it, and papers in geological layers.'],
      use: ['Nothing on top but notes about the weather and a betting slip. Pike lost.'],
    },
    pike_drawer: {
      name: 'locked drawer',
      verb: 'Open',
      look: ['A desk drawer with a little three-wheel combination lock. Pike locked everything.'],
      use: [pick(
        when('cu_pike_lock', 'Empty now. I have what Pike left.'),
        otherwise(anim('reach_side'), { closeup: 'pike_lock' }),
      )],
    },
    corkboard: {
      name: 'cork board',
      look: ['Photographs, deadlines, a lost dog. A press card pinned at the corner.'],
      use: ['Photographs, deadlines, a lost dog. A press card pinned at the corner.'],
    },
    press_card: {
      name: 'press card',
      verb: 'Take',
      when: '!c2_press_taken',
      look: ['BRACKWATER GAZETTE — PRESS — No. 417 — W. PIKE. He’s smiling in the photo.', set('c2_saw_417')],
      use: [anim('reach_side'), give('press_card'), set('c2_press_taken'), set('c2_saw_417'),
        'No. 417. Pike won’t miss it where he is. I hope he gets to.'],
    },
    clippings: {
      name: 'clippings cabinet',
      verb: 'Search',
      look: ['The morgue: every story the Gazette ever printed, filed by a man who never threw anything away.'],
      use: [anim('reach_side'), sfx('drawer_open'),
        'MERIDIAN, 1949. “There is no evidence of foul play,” said Lt. Frank Delaney.', clue('clipping_meridian'),
        'And further down: “Det. Sgt. Thomas Rook suspended after erratic conduct.”', clue('clipping_suspension'),
        'I remember the suspension. I don’t remember the conduct.'],
    },
    darkroom_door: {
      name: 'darkroom door',
      verb: 'Enter',
      look: [pick(
        when('chapter>=3', 'The darkroom. I’ve seen enough of it for a lifetime.'),
        otherwise('The darkroom. A red lamp over the door says DO NOT OPEN WHEN LIT. It isn’t lit.'),
      )],
      use: [pick(
        when('chapter=2 & has:pike_camera & ded:i_was_drugged & has:minutes1 & clue:kerrigan & !c2_end', ...ch2End),
        when('chapter=2 & has:pike_camera', 'Abernathy says the darkroom’s free at eight. Before I sit in the dark with Pike’s film,',
          'I want to know more about what happened to me. And to the Meridian’s witnesses.'),
        when('chapter>=3', 'I’d rather not. My memories of that room are thin, and the ones I have smell of fixer.'),
        otherwise('Nothing for me to develop.'),
      )],
    },
    clock: {
      name: 'clock',
      look: ['A big newsroom clock, ten minutes fast so the reporters think they’re late. They’re always late.'],
    },
    typewriters: {
      name: 'typewriters',
      look: ['Rows of Underwoods, each one with an ashtray, a hat and a grudge.'],
      use: ['I type: “WHERE IS NORA MARSH”. The typewriter doesn’t know either.'],
    },
    tubes: {
      name: 'pneumatic tubes',
      look: ['Pneumatic tubes that carry copy upstairs at the speed of rumour.'],
      use: [sfx('steam'), 'Thwump. Somewhere upstairs a typesetter gets an empty canister and a lesson in disappointment.'],
    },
  },
};

export const darkroom: RoomDef = {
  id: 'darkroom',
  name: 'Gazette darkroom',
  music: 'locked',
  variant: [['c3_white', 'white']],
  objects: {
    padlock: '!c3_unlocked',
    negatives_hung: 'c3_neg_hung & !c3_neg_dry',
    clock_open: 'c3_clock_open',
    stool_moved: 'c3_stool_moved',
    writing: 'c3_white',
  },
  hotspots: {
    door: {
      name: 'door',
      verb: 'Open',
      look: [pick(when('c3_unlocked', 'The door. Unlocked. By me, for me.'), otherwise('The door, padlocked shut on the inside. My padlock. My side.'))],
      exit: { to: 'gazette', at: 'from_darkroom', when: 'c3_unlocked', blocked: [anim('reach_side'), sfx('door_locked'), 'Locked with my own padlock. I’d admire my work if I could remember doing it.'] },
      items: { padlock_key: [...unlock()] },
    },
    padlock: {
      name: 'padlock',
      when: '!c3_unlocked',
      look: ['My own padlock, from my office drawer. I’d know it anywhere. I’d also know where I put the key, if I were anyone else.'],
      use: [anim('reach_side'), sfx('door_locked'), 'Still locked. I did a good job. I hate that.'],
      items: { padlock_key: [...unlock()], lockpicks: ['I don’t have my picks. Past me thought of that too, probably.'] },
    },
    sink: {
      name: 'sink',
      verb: 'Wash in',
      look: ['A deep sink with running water, for washing film and hands that have touched fixer.'],
      use: [pick(
        when('c3_fix & !c3_washed', ...wash()),
        otherwise(sfx('pour'), 'Cold water on my face. It helps less than it should.'),
      )],
      items: { pike_camera: ['Water and cameras don’t mix. That much even I remember.'] },
    },
    trays: {
      name: 'developing trays',
      look: ['Three trays for printing: developer, stop bath, fixer. Every darkroom in the world, the same three trays.'],
      use: ['Prints come later. First the film.'],
    },
    bottle_dev: { name: 'developer', verb: 'Pour', look: ['A brown bottle: DEVELOPER (D-76). First in, eight minutes.'], use: [...pour('dev')] },
    bottle_stop: { name: 'stop bath', verb: 'Pour', look: ['A brown bottle: STOP BATH. It smells of vinegar. Thirty seconds, after the developer.'], use: [...pour('stop')] },
    bottle_fix: { name: 'fixer', verb: 'Pour', look: ['A brown bottle: FIXER. Smells of rotten eggs. Last, five minutes, and then you can breathe.'], use: [...pour('fix')] },
    tank: {
      name: 'developing tank',
      verb: 'Wash',
      look: [pick(
        when('c3_fix', 'Developed, stopped and fixed. It needs a wash.'),
        when('c3_film_in_tank', 'Pike’s film, loaded in the light-tight tank.'),
        otherwise('A light-tight developing tank. Film goes in, in total darkness, and chemistry goes in after it.'),
      )],
      use: [pick(
        when('c3_washed', 'Empty now.'),
        when('c3_fix', ...wash()),
        otherwise('It’s waiting for chemistry.'),
      )],
      items: { pike_camera: ['Film goes into the tank in total darkness. Even this red light would fog it. I need the changing bag.'] },
    },
    cabinet: {
      name: 'cabinet',
      look: ['A cabinet with a changing bag and a box of photographic paper on the shelf. Its brass lock is the only one in the darkroom.'],
      use: ['Locked. Photographers keep their chemicals locked, and their secrets in with them.'],
      items: {
        wire: [pick(
          when('!has:loupe & !c3_loupe_taken', anim('reach_side'), sfx('drawer_open'), set('c3_loupe_taken'), give('loupe'),
            'I work the wire in the lock. Three pins, one spring. Inside, behind the paper, a loupe on a cord.'),
          otherwise('The cabinet is empty now, apart from the paper.'),
        )],
      },
    },
    changing_bag: {
      name: 'changing bag',
      verb: 'Use',
      look: ['A light-tight black bag with two sleeves. You load film by feel, like a pickpocket in reverse.'],
      use: [pick(when('c3_film_in_tank', 'Done already.'), otherwise('I need something to load in it. The film’s still in Pike’s camera.'))],
      items: {
        pike_camera: [pick(
          when('c3_film_in_tank', 'The film’s already in the tank.'),
          otherwise(anim('reach_side'), sfx('camera_shutter'), 'Rewind, open the back, film onto the reel, reel into the tank, lid on.',
            'All by feel inside the bag. Threading a needle in your coat pocket. I’ve done both.', set('c3_film_in_tank')),
        )],
      },
    },
    paper_box: {
      name: 'photo paper',
      verb: 'Expose',
      look: ['A box of photographic paper. Safe under the red light; murder under a white one.'],
      use: [pick(
        when('has:contact_sheet', 'One contact sheet is enough.'),
        when('c3_neg_in_enlarger', ...printSheet()),
        otherwise('There’s nothing in the enlarger to print yet.'),
      )],
    },
    enlarger: {
      name: 'enlarger',
      verb: 'Use',
      look: ['The enlarger. Somebody has written on its column in grease pencil. My handwriting again.', { clue: 'darkroom_note' },
        { narrate: '“YOU DID THIS. THE KEY IS SAFE. DEVELOP THE FILM. NO WHITE LIGHT TILL THE PRINTS ARE FIXED. — T.”' }],
      use: [pick(
        when('has:contact_sheet', 'I’ve made my print.'),
        when('c3_neg_in_enlarger', ...printSheet()),
        otherwise('It needs negatives. Dry ones.'),
      )],
      items: {
        negatives: [pick(
          when('!c3_neg_dry', 'They’re still wet. Put wet negatives in an enlarger and you’ll print the drips.'),
          otherwise(anim('reach_side'), { take: 'negatives' }, set('c3_neg_in_enlarger'), 'Negatives in the carrier, emulsion side down.'),
        )],
      },
    },
    drying_line: {
      name: 'drying line',
      verb: 'Take from',
      look: [pick(when('c3_neg_hung & !c3_neg_dry', 'Pike’s negatives, drying on the line.'), otherwise('A drying line with wooden clips.'))],
      use: [pick(
        when('c3_neg_hung & !c3_neg_dry', anim('reach_side'), give('negatives'), set('c3_neg_dry'), 'Dry enough. I take them down.'),
        otherwise('Clips and nothing.'),
      )],
      items: {
        negatives: [pick(
          when('c3_neg_dry', 'They\u2019re dry already.'),
          otherwise(anim('reach_side'), { take: 'negatives' }, set('c3_neg_hung'), 'I clip them up to dry and give them a minute.', wait(800),
            'They should be dry now.'),
        )],
      },
    },
    safelight: {
      name: 'safelight',
      look: ['The safelight: a red lamp. Photographic paper can’t see red. Neither can I, much.'],
      use: ['I leave it on. The alternative is the dark, and I’ve had my fill.'],
    },
    switch: {
      name: 'light switch',
      verb: 'Flip',
      look: ['The white-light switch. A strip of tape across it says NOT YET, in my writing.'],
      use: [pick(
        when('c3_white', 'I’ll leave the light on now. I’ve earned it.'),
        when('has:contact_sheet', anim('reach_side'), { sfx: 'switch' }, set('c3_white'),
          'White light. The room goes from a mouth to a closet.', { music: 'revelation' },
          'And there, on the wall by the timer, writing I couldn’t see under the red lamp.', { doc: 'writing_doc' },
          { clue: 'no_sister' }, 'Red grease pencil. Invisible in red light.', 'There is no sister.'),
        when('c3_film_in_tank & !c3_washed', 'Not with film in the soup. Old me said not yet, and old me went to some trouble.'),
        otherwise('NOT YET, says the tape. Old me was very particular about that light.'),
      )],
    },
    stool: {
      name: 'stool',
      verb: 'Move',
      look: ['A wooden stool, the kind that wobbles to keep you awake.'],
      use: [pick(
        when('c3_stool_moved', 'It’s where I need it.'),
        when('c3_white & clue:photo_clock', anim('pickup_side'), set('c3_stool_moved'), 'I set the stool under the wall timer.'),
        otherwise('I sit on it. It wobbles. I get up.'),
      )],
    },
    clock: {
      name: 'wall timer',
      verb: 'Open',
      when: 'c3_white',
      look: [pick(when('c3_clock_open', 'The timer, back panel off. Empty now.'), otherwise('The darkroom timer clock, up high on the wall. Same one as in the photograph.'))],
      use: [pick(
        when('c3_clock_open', 'Nothing left inside but gears.'),
        when('!c3_stool_moved', 'Too high to reach. I need something to stand on.'),
        otherwise(anim('reach_side'), sfx('creak'), set('c3_clock_open'), give('padlock_key'),
          'The back panel slides off, just like in the picture. And hanging on a gear, one small steel key.', 'Thank you, me.'),
      )],
    },
    writing: {
      name: 'writing on the wall',
      when: 'c3_white',
      look: [{ doc: 'writing_doc' }, 'ANISE = LETHE. THE SISTER BROUGHT THE COFFEE. THERE IS NO SISTER.'],
    },
  },
};

function wash() {
  return [anim('reach_side'), sfx('pour'), set('c3_washed'), give('negatives'),
    'Into the sink for a wash. I unspool the film and hold it up to the safelight.', 'Negatives. Wet ones. Pike\u2019s last pictures.'];
}

function unlock() {
  return [anim('reach_side'), sfx('padlock_open'), { take: 'padlock_key' }, set('c3_unlocked'), 'Click. I’m out of my own trap.',
    'Time to find out who my client really is, and what Nora heard on the night of the third.',
    { unlock: 'commission' }, { unlock: 'cemetery' }, { unlock: 'precinct' },
    { autosave: 'Chapter 3 — Out of the darkroom' }];
}

function pour(stage: 'dev' | 'stop' | 'fix') {
  const order = { dev: 'c3_dev', stop: 'c3_stop', fix: 'c3_fix' };
  const prev = { dev: 'c3_film_in_tank', stop: 'c3_dev', fix: 'c3_stop' }[stage];
  const lines = {
    dev: ['Developer in. Eight minutes, agitate every thirty seconds.', 'I count them off. I’m good at counting. It’s remembering I have trouble with.'],
    stop: ['Stop bath. Thirty seconds of vinegar.'],
    fix: ['Fixer. Five minutes of rotten eggs. After this, the light can’t hurt it.'],
  }[stage];
  return [pick(
    when(order[stage], 'Done that already.'),
    when('!c3_film_in_tank', 'There’s no film in the tank yet.'),
    when(`!${prev}`, stage === 'stop' ? 'Stop bath before the developer would stop nothing at all.'
      : 'Fixer before the developer? I’d fix a blank roll for eternity. Developer first, then stop, then fix.'),
    otherwise(anim('reach_side'), sfx('pour'), set(order[stage]), ...lines.map((l) => l as string), wait(600)),
  )];
}

function printSheet() {
  return [anim('reach_side'), sfx('enlarger_hum'), 'I expose a sheet of paper under the enlarger and slide it through the trays.',
    'Developer, stop, fix. An image swims up out of the white like a drowned man.',
    give('contact_sheet'), { take: 'negatives' }, { doc: 'contact_sheet' },
    clue('photo_trucks'), clue('photo_handshake'),
    'Frame four is too small to make out. Whatever it shows, it isn’t Pike.'];
}

export { otherwise };
