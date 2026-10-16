import type { DialogDef, RoomDef } from '../../engine/types';
import { CH8_START } from '../story';
import { N, S, anim, clue, give, otherwise, pick, set, sfx, take, wait, when } from '../dsl';

const ch7End = [
  N('City Hall glittered like a wedding cake at a funeral. Tuxedos, furs, a string quartet, and Augustus Crane shaking every hand in the room.'),
  S('nora', 'I’ll find Captain Morrow and bring him up to the booth at nine. Whatever happens, keep talking.'),
  'Keeping talking is the one thing I’ve never had trouble with.',
  N('The service corridor behind the hall was empty. Then it wasn’t.'),
  S('vivian', 'Mr. Rook.'),
  sfx('sap'), { shake: 250 },
  N('The same wasp, the same medical degree. I had perhaps a minute before the floor started making suggestions.'),
  N('I remember a door with WBRK on it, Hask’s key, and the sound of a lock turning on the right side of me for once.'),
  { fade: 'out' as const, ms: 900 },
  set('c7_end'),
  ...CH8_START,
];

export const radio_booth: RoomDef = {
  id: 'radio_booth',
  name: 'WBRK booth, City Hall',
  music: [['c8_live', 'finale'], ['chapter=8', 'revelation'], ['true', 'bureau']],
  amb: 'crowd_gala',
  objects: { onair_lit: 'c8_live & !c8_bulb', bulb_removed: 'c8_bulb' },
  enter: [{ if: 'chapter=7 & !c7_end', then: ch7End }],
  hotspots: {
    chair: {
      name: 'engineer’s chair',
      look: ['The engineer’s swivel chair, with his headphones hung over the back. He went down to watch the speech. Lucky him.'],
      use: ['If I sit down now, I won’t get up again until Tuesday.'],
    },
    door: {
      name: 'door',
      look: [pick(
        when('c8_confessed', 'Frank’s stopped pounding on it. Frank’s running.'),
        otherwise('The booth door, locked from inside. Frank is on the other side of it, pounding.'),
      )],
      exit: {
        to: 'clocktower', at: 'start', when: 'c8_confessed',
        blocked: [pick(
          when('chapter=8', 'My own handwriting says: don’t open the door. Not for Frank. Not for anyone.'),
          otherwise('Not now.'),
        )],
      },
    },
    window: {
      name: 'window',
      look: [pick(
        when('c8_live', 'Below, the gala has stopped dancing. Every face is turned up to the radio speakers. Crane stands at the podium like a man who’s just heard his own obituary.'),
        when('c8_nine', 'Crane at the podium, in the spotlight, smiling for the whole city.'),
        otherwise('The gala hall below: chandeliers, champagne, and Augustus Crane rehearsing his smile at the podium.'),
      )],
    },
    console: {
      name: 'mixing console',
      look: ['A WBRK mixing console. Faders, knobs and VU needles. My notes call it “the piano with opinions”.'],
      use: ['The faders are set. What matters is the patch bay and the transmitter key.'],
    },
    patch_bay: {
      name: 'patch bay',
      verb: 'Patch',
      look: ['A patch bay: rows of jacks, labelled, and a tangle of cables. The card on the wall says what goes where.'],
      use: [pick(
        when('cu_patch_booth', 'Booth mic to the program line. Patched.'),
        when('!c8_clear', 'The jacks swim in front of my eyes like tadpoles. I need my head clear first.'),
        otherwise(anim('reach_side'), { closeup: 'patch_booth' }),
      )],
    },
    transmitter: {
      name: 'transmitter key',
      verb: 'Turn',
      look: ['The transmitter switch: HALL / BOOTH. It takes a key.'],
      use: ['It takes a key. Luckily, I have one. Hask cut it this afternoon.'],
      items: {
        booth_key: [pick(
          when('c8_live & !c8_confessed', 'We’re already on the air. The whole city is waiting for the man at the microphone.', { dialog: 'broadcast' }),
          when('c8_live', 'We’re on the air.'),
          when('!c8_clear', 'My hands won’t go where I tell them. Antidote first, my notes say.'),
          when('!cu_patch_booth', 'The booth mic isn’t patched to the program line yet. I’d be talking to myself. Again.'),
          when('!c8_bulb', 'The ON AIR lamp is over the door, and the door has a window.', 'If Frank sees it light up, he’ll pull the fuse. The bulb comes out first.'),
          when('!c8_nine', 'Not yet. Crane isn’t on. I want his audience, not his warm-up.'),
          otherwise(anim('reach_side'), sfx('switch'), set('c8_live'), { music: 'finale' },
            'The key turns. HALL goes dark on the board. BOOTH goes bright.',
            N('Below, Crane opened his mouth to speak to Brackwater, and Brackwater heard me instead.'),
            { dialog: 'broadcast' }),
        )],
      },
    },
    onair_lamp: {
      name: 'ON AIR lamp',
      verb: 'Unscrew',
      when: '!c8_bulb',
      look: ['An ON AIR lamp over the door. When it lights, everybody outside knows the booth is live.'],
      use: [pick(
        when('!c8_clear', 'I reach for it and miss it by a foot. The room’s still swimming.'),
        otherwise(anim('reach_side'), sfx('switch'), give('bulb'), set('c8_bulb'), 'I unscrew the bulb with my hat brim. It’s hot.',
          'Now nobody outside will know we’re live. Including Frank.'),
      )],
    },
    mic: {
      name: 'microphone',
      look: ['A ribbon microphone on a boom. It hears everything. That’s the idea.'],
      use: [pick(
        when('c8_live & !c8_confessed', { dialog: 'broadcast' }),
        when('c8_live', 'It\u2019s still live. Brackwater can hear me breathing.'),
        otherwise('Not yet. It\u2019s not connected to anything that matters.'),
      )],
    },
    talkback: {
      name: 'talkback box',
      verb: 'Press',
      look: ['A talkback box: a speaker and a button that talks to the corridor outside the door.'],
      use: [pick(
        when('c8_confessed', 'Nobody left out there to talk to.'),
        when('c8_told', { dialog: 'frank_talkback' }),
        when('c8_live', 'I’ll talk to Frank when the city’s heard the rest.'),
        otherwise(S('delaney', 'Tommy? Tommy, open the door. You’re sick. You don’t know what you’re doing.'), 'I know exactly what I’m doing, Frank. For once.'),
      )],
    },
    clock: {
      name: 'clock',
      look: [pick(when('c8_nine', 'Nine o’clock and a little after.'), otherwise('Eight forty-seven. Crane goes on the air at nine.'))],
      use: [pick(
        when('c8_nine', 'It’s nine. Time to work.'),
        when('!c8_clear', 'I can’t even read the clock. The numbers keep swapping places.'),
        otherwise('I watch the second hand go round. And round. Thirteen times, while my head clears.', wait(800), sfx('clock_bong'), set('c8_nine'),
          N('Nine o’clock. Below, the quartet stopped. Augustus Crane stepped up to the podium and the WBRK engineer gave him his cue.'),
          S('crane', 'Citizens of Brackwater. One hundred years ago...')),
      )],
    },
    card: {
      name: 'engineer’s card',
      verb: 'Read',
      look: [clue('patch_card'), { narrate: 'TO TAKE THE AIR FROM THE BOOTH: 1. PATCH BOOTH MIC → PROGRAM LINE.  2. TRANSMITTER KEY → BOOTH.' }],
      use: [clue('patch_card'), { narrate: 'TO TAKE THE AIR FROM THE BOOTH: 1. PATCH BOOTH MIC → PROGRAM LINE.  2. TRANSMITTER KEY → BOOTH.' }],
    },
    turntable: {
      name: 'turntables',
      look: ['Two turntables for records. Tonight’s program doesn’t need music. It needs a confession.'],
    },
  },
};

/** The broadcast: the case in four movements, then the talkback. */
export const broadcast: DialogDef = {
  id: 'broadcast',
  npc: 'crane',
  nodes: {
    root: {
      lines: [{
        once: 'c8_broadcast_intro',
        do: [
          'Good evening, Brackwater. My name is Thomas Rook. Some of you will remember me as a policeman. Some of you will remember me as a drunk.',
          'Neither of those is quite true, and I\u2019m going to tell you why.',
          'Two years ago, on the twenty-first of October, the freighter Meridian burned at Pier 9 with fourteen men in her forward hold.',
        ],
      }],
      options: [
        {
          id: 'show1', text: 'Show them what really happened to the hatch...', say: false, when: '!c8_s1',
          present: {
            padlock: [
              'This is the padlock from the Meridian\u2019s forward hatch, out of the police department\u2019s own evidence box.',
              'It is still locked, through a hasp the firemen had to saw off the deck. That hatch wasn\u2019t open. Somebody locked fourteen men in.',
              S('crane', '...Turn that off. Somebody turn that off!'),
              set('c8_s1'), N('Below, nobody was dancing anymore.'),
            ],
            gate_log: ['The gate log comes later. First, the hatch.'],
            gus_log: ['Gus\u2019s log comes later. First, the hatch.'],
            default: ['No \u2014 that comes later. Start with the hatch. Start with the padlock.'],
          },
        },
        {
          id: 'show2', text: 'Show them why the ship had to burn...', say: false, when: 'c8_s1 & !c8_s2',
          present: {
            calypso_manifest: [
              'The Meridian and the Calypso both belong to Gullwing Holdings. Gullwing belongs to Commissioner Augustus Crane.',
              'Tonight the Calypso was to sail with forty cases of \u201cmachine parts\u201d, insured for four hundred thousand dollars. They are rocks. I\u2019ve seen them.',
              'And a telegram: \u201cCALYPSO LOST AT SEA EXPECTED. CLAIM PAPERS READY. A.C.\u201d',
              set('c8_s2'),
            ],
            default: ['No. Before the people, the money. The ship\u2019s own papers.'],
          },
        },
        {
          id: 'show3', text: 'Show them what happened to the witnesses...', say: false, when: 'c8_s2 & !c8_s3',
          present: {
            halcyon_files: [
              'Three men saw what happened on that pier. All three were taken to Halcyon House on Gull Hill and came down with no memory of it.',
              'So did the reporter who went looking. So did I. This is my own file: \u201cMeridian inquiry memories suppressed. Recommend reinforcement.\u201d',
              'The drug is called Lethe. Ask Otto Kessler, the pharmacist on Lyme Street, what it does.',
              set('c8_s3'),
            ],
            vial: [
              'This is Lethe: scopolamine, refined at Halcyon House. It makes a man obedient, and then it makes him forget.',
              'Three witnesses, a reporter and a detective went up Gull Hill and came down empty. The files are in Dr. Vey\u2019s cabinet marked 1949.',
              set('c8_s3'),
            ],
            default: ['No. The witnesses. What happened to the people who saw.'],
          },
        },
        {
          id: 'show4', text: 'Show them who gave the orders...', say: false, when: 'c8_s3 & !c8_s4',
          present: {
            minutes3: [
              'On the third of this month a stenographer named Nora Marsh took down a private meeting in the Commissioner\u2019s office. Three pages.',
              'Present: Commissioner Crane. Dr. Lucian Vey. And Lieutenant Frank Delaney of the Brackwater police.',
              '\u201cRook is your department, Lieutenant Delaney. You handled him once.\u201d',
              'Nora Marsh is Walter Marsh\u2019s daughter. Walter was one of the fourteen.',
              set('c8_s4'), set('c8_told'),
              N('Down in the hall, Augustus Crane was trying to leave by a door that two policemen had decided to stand in front of.'),
            ],
            minutes1: ['Page one has the names smudged by a cod. Page three is the one with the names.'],
            minutes2: ['Page two is the plan. Page three has the names.'],
            default: ['No. Who gave the orders. Nora\u2019s pages.'],
          },
        },
        {
          id: 'pause', text: '(Cover the microphone and check my notes.)', say: false, when: '!c8_s4', next: 'exit',
          do: ['I put my hand over the microphone. Brackwater could wait ten seconds. It had waited two years.'],
        },
        {
          id: 'frank', text: '(Press the talkback to the corridor.)', say: false, when: 'c8_s4', next: 'exit',
          do: ['There\u2019s one more voice you should hear tonight. He\u2019s right outside my door.', { dialog: 'frank_talkback' }],
        },
      ],
    },
  },
};

export const frank_talkback: DialogDef = {
  id: 'frank_talkback',
  npc: 'delaney',
  nodes: {
    root: {
      lines: [{
        once: 'c8_talkback',
        do: [
          sfx('switch'),
          S('delaney', 'Tommy. Open the door. Whatever you think you’re doing in there, it’s over. The fuse is pulled.'),
          N('The ON AIR lamp was dark. Frank thought the booth was dead. Frank was talking to the whole city.'),
        ],
      }],
      options: [
        {
          id: 'early', text: 'You were on Pier 9 at twenty-five past ten, Frank.', say: false, when: '!c8_f1',
          present: {
            gate_log: ['Your car came through the harbor gate at twenty-five past ten. Your report says half past eleven.',
              S('delaney', 'So I was early. So what? Half the department was early to something.'), set('c8_f1')],
            gus_log: ['Gus Tolliver wrote you down at twenty-five past ten, going aboard with a bag.',
              S('delaney', 'Gus Tolliver is a drunk who talks to birds.'), set('c8_f1')],
            default: [S('delaney', 'What are you waving at me through the glass, Tommy? I can’t see a thing.')],
          },
        },
        {
          id: 'padlock', text: 'You bought twenty padlocks for Gullwing in September ’49.', when: 'clue:padlock_order & !c8_f2', say: false,
          do: ['Twenty padlocks, Frank. Hask’s ledger. You signed for them. You haggled.', S('delaney', '...That old man never forgets a thing.'), set('c8_f2')],
        },
        {
          id: 'walter', text: 'Walter Marsh was in that hold, Frank. He signed in “for Sgt. Rook”.', when: 'clue:sent_walter & c8_f1', say: false,
          do: [
            'Walter Marsh signed in at the gate “for Sgt. Rook”. You read that log. You knew he was in that hold. You knew he was mine.',
            { wait: 1000 },
            S('delaney', '...I did what I was told!'),
            S('delaney', 'Crane wanted it quiet. Fourteen dockhands, Tommy — you think anybody in this town would have cared?'),
            S('delaney', 'I put the lock on that hatch and I walked away and I didn’t look back. I didn’t look back once!'),
            S('delaney', 'And then you wouldn’t let it lie. You never let anything lie. So I took you up the hill. For your own good. For both our goods.'),
            { wait: 900 },
            'Frank.',
            'The ON AIR lamp’s not broken. I took the bulb out.',
            S('delaney', '...What?'),
            'You’re on the air, Frank. You’ve been on the air the whole time.',
            { wait: 600 }, sfx('door_open'),
            N('I heard him run. Not down. Up. Up was where Frank always went when he was in trouble.'),
            set('c8_confessed'), { music: 'revelation' },
            { autosave: 'Chapter 8 — The confession' },
          ],
          next: 'exit',
        },
        { id: 'wait', text: '(Let go of the talkback.)', say: false, next: 'exit', do: [] },
      ],
    },
  },
};

export const clocktower: RoomDef = {
  id: 'clocktower',
  name: 'City Hall clock tower',
  music: 'finale',
  amb: 'rain_street',
  npcs: [{ id: 'delaney', at: 'delaney_spot', face: 'left', pose: 'aim_side', when: '!c8_surrender', talk: [{ dialog: 'roof' }] }],
  enter: [{
    once: 'c8_roof',
    do: [
      N('The clock face lit the ledge from behind like a stage. Frank stood at the edge with the city under him and his service revolver in his hand.'),
      S('delaney', 'Stay there, Tommy.'),
      S('delaney', 'You know what they do to cops in prison? They do it every day.'),
    ],
  }],
  hotspots: {
    exit_door: {
      name: 'stair door',
      look: ['The door back down the tower stairs.'],
      exit: { to: 'radio_booth', at: 'door_spot', when: 'c8_surrender', blocked: ['I’m not leaving Frank up here alone.'] },
    },
    clock: {
      name: 'clock face',
      look: ['The great clock face, backwards from here. The hands are about to meet at ten.'],
    },
    ledge: {
      name: 'ledge',
      look: ['A narrow ledge, wet with rain, and nothing beyond it but a hundred feet of air and Brackwater.'],
      use: ['I’m not going nearer the edge than Frank is.'],
    },
    city: {
      name: 'city',
      look: ['Brackwater, every window lit. Every one of those windows has a radio, and every radio heard Frank.'],
    },
    gargoyle: {
      name: 'gargoyle',
      look: ['A stone gargoyle with a face like a disappointed alderman.'],
    },
  },
};

export const roof: DialogDef = {
  id: 'roof',
  npc: 'delaney',
  nodes: {
    root: {
      options: [
        {
          id: 'gun', text: 'Put it down, Frank.', when: '!c8_surrender',
          do: [S('delaney', 'You were the best friend I ever had, Tommy. You know that? The best.'), S('delaney', 'And I ate your mind with a spoon.')],
        },
        {
          id: 'why', text: 'Why, Frank? Money?', when: '!c8_surrender',
          do: [
            S('delaney', 'Money, at first. Then because it was too late to be anything else.'),
            S('delaney', 'You lock one hatch, Tommy, and every door after that is the same door.'),
          ],
        },
        {
          id: 'show', text: '(Hold something out to him.)', say: false, when: '!c8_surrender',
          present: {
            lighter: [
              { narrate: 'I held out the Zippo. Rain ran off the engraving: To Tommy — from Frank. Partners. 1938.' },
              'You gave me this the day we made detective. You said it was so I’d always have a light, even in the dark.',
              'I’ve been in the dark a long time, Frank. You put me there. I still carried it.',
              { wait: 1200 },
              S('delaney', '...Partners.'),
              N('He looked at the lighter for a long time. Then he turned the revolver around and held it out to me, butt first.'),
              { anim: 'reach_side' },
              S('delaney', 'Take it, Tommy. Before I change my mind.'),
              set('c8_surrender'), { npc: 'delaney', hide: true },
              { npc: 'morrow', room: 'clocktower', at: 'start', face: 'right' },
              S('morrow', 'Frank Delaney. On my authority. Easy now.'),
              N('Captain Morrow took him down the tower stairs. Frank didn’t look back. He’d had a lot of practice.'),
              { npc: 'morrow', hide: true },
              { dialog: 'epilogue_trigger' },
            ],
            padlock: [S('delaney', 'I know what it is, Tommy. I put it on the hatch. Showing me won’t make me jump. Or not jump.')],
            gate_log: [S('delaney', 'Paper. It’s all paper. They’ll burn it like they burned the ship.')],
            default: [S('delaney', 'Put that away. Whatever it is, it doesn’t change anything.'),
              'Evidence won’t reach him now. It has to be something that’s only ours.'],
          },
        },
        {
          id: 'think', text: '(Say nothing. Think.)', say: false, when: '!c8_surrender', next: 'exit',
          do: ['Frank wasn’t going to be argued off that ledge. Not by a cop, anyway. Maybe by a partner.'],
        },
      ],
    },
  },
};

/** Tiny dialog used only to chain into the epilogue script from inside a present branch. */
export const epilogue_trigger: DialogDef = {
  id: 'epilogue_trigger',
  npc: 'nora',
  nodes: { root: { lines: [{ set: 'c8_epilogue_ready' }], options: [] } },
};

export { anim, clue, give, otherwise, take };
