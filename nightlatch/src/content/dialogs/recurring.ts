// Characters who appear across several chapters.
import type { DialogDef } from '../../engine/types';
import { S, clue, give, set, take } from '../dsl';

export const mabel: DialogDef = {
  id: 'mabel',
  npc: 'mabel',
  nodes: {
    root: {
      options: [
        // ------------------------------------------------------------ chapter 1
        {
          id: 'ninth', text: 'What happened on the ninth?', when: 'chapter=1',
          do: [
            S('mabel', 'You went out about ten. Said you were meeting someone at the Lantern.'),
            S('mabel', 'Said if you weren’t back by morning, I should feed the fern and not call the police.'),
            'Did you?',
            S('mabel', 'I fed the fern.'),
          ],
        },
        {
          id: 'nora', text: 'Who’s Nora Marsh?', when: 'chapter=1 & (clue:lost_days | has:nora_photo)',
          do: [
            S('mabel', 'The girl who came in on the eighth. Scared stiff, holding a folder like it was a life preserver.'),
            S('mabel', 'You two talked behind that door for an hour. Then you put on your hat and walked her out.'),
            'Where to?',
            S('mabel', 'You didn’t say. You were very careful not to say.'),
            clue('nora_visit'), { person: 'nora' },
          ],
        },
        {
          id: 'told', text: 'Did I tell you anything before I left?', when: 'chapter=1',
          do: [
            S('mabel', '...You told me that if you ever came back here not knowing your own name,'),
            S('mabel', 'I should tell you one thing and one thing only.'),
            'Which is?',
            S('mabel', '“Ask the piano.”'),
            'That’s it?',
            S('mabel', 'That’s it. You were very pleased with yourself.'),
            clue('ask_piano'), { person: 'mabel' },
          ],
        },
        {
          id: 'calls', text: 'Has anybody been calling?', when: 'chapter=1',
          do: [
            S('mabel', 'Frank Delaney, twice. Very concerned. Very warm.'),
            S('mabel', 'He asked if you’d left anything here. I told him only debts.'),
            { person: 'delaney' },
          ],
        },
        {
          id: 'client', text: 'Who’s the lady?', when: 'chapter=1 & !c1_hired',
          do: [
            S('mabel', 'Says she’s a Miss Evelyn Marsh. She’s been here since nine.'),
            S('mabel', 'I gave her coffee. She didn’t drink it.'),
          ],
        },
        {
          id: 'shorthand', text: 'You used to take shorthand, didn’t you?', when: 'chapter<=3', once: true,
          do: [
            S('mabel', 'Twelve years in the county court, Tom. I could take down a fistfight in Pitman and give you the score.'),
            clue('mabel_shorthand'),
          ],
        },
        // ------------------------------------------------------------ chapter 2
        {
          id: 'drugged', text: 'Mabel, somebody drugged me. For six days.', when: 'chapter=2 & ded:i_was_drugged', once: true,
          do: [
            S('mabel', 'I knew it wasn’t the bottle.'),
            S('mabel', 'You never could hold a secret or a drink for six days.'),
          ],
        },
        {
          id: 'pike', text: 'Ever hear of a reporter named Wendell Pike?', when: 'chapter>=2 & chapter<=3 & clue:pike_missing', once: true,
          do: [
            S('mabel', 'The Gazette fellow? He came by in August, wanting to talk to you about Halcyon House.'),
            S('mabel', 'You were out on the Delmonico divorce. He left a card and never came back.'),
            'Nobody comes back from Halcyon House, Mabel. Not all of them, anyway.',
          ],
        },
        // ------------------------------------------------------------ chapter 3
        {
          id: 'pad', text: 'Can you read this shorthand?', when: 'chapter=3 & has:steno_pad & !clue:steno_transcript', say: false,
          do: [...transcribe()],
        },
        {
          id: 'fake', text: 'Evelyn Marsh isn’t Nora’s sister.', when: 'chapter>=3 & ded:evelyn_impostor', once: true,
          do: [S('mabel', 'I never liked her shoes.'), S('mabel', 'Nobody who means well wears shoes like that to a second-floor office.')],
        },
        {
          id: 'nurse', text: 'She’s a nurse at Halcyon House.', when: 'chapter>=3 & ded:evelyn_nurse', once: true,
          do: [S('mabel', 'That explains the hands. Cold as a doorknob in January.'), S('mabel', 'She asked twice whether you kept anything in the safe.')],
        },
        {
          id: 'frank', text: 'What do you make of Frank Delaney?', when: 'chapter>=3 & ded:camel_coat', once: true,
          do: [
            S('mabel', 'Frank brought me flowers when you were... away, in ’49. Carnations.'),
            S('mabel', 'I always thought carnations were a funeral flower.'),
          ],
        },
        // ------------------------------------------------------------ chapter 5+
        {
          id: 'escaped', text: 'I need you to forget you saw me tonight.', when: 'chapter=5', once: true,
          do: [
            S('mabel', 'Tom, the radio says you kidnapped that girl.'),
            'The radio says a lot of things. Most of them are advertisements.',
            S('mabel', 'I never believed it. Go on. I didn’t see you. I don’t even see well.'),
          ],
        },
        {
          id: 'plan', text: 'Tonight I put it all on the radio, Mabel.', when: 'chapter=7 & c7_planned', once: true,
          do: [
            S('mabel', 'On Crane’s own broadcast? Tom Rook, you were always a fool.'),
            S('mabel', 'Go and be one properly. I’ll keep the fern alive.'),
          ],
        },
        { id: 'bye', text: 'Hold the fort, Mabel.', next: 'exit', do: [S('mabel', 'Somebody has to.')] },
      ],
    },
  },
};

export function transcribe() {
  return [
    'Mabel, can you read this? It’s Nora’s.',
    S('mabel', 'Pitman. Neat, too. Give it here.'),
    { narrate: 'Mabel read it with a pencil in her teeth, the way other people read the racing results.' },
    S('mabel', '“...The Calypso sails on the twenty-first with the last of it. After that, the Meridian business is buried at sea.”'),
    S('mabel', '“The remaining witnesses have been treated. Two more to admit.”'),
    S('mabel', '“And Rook? He’s been sniffing round the Marsh girl.”'),
    S('mabel', '“Rook is your department, Lieutenant. You handled him once.”'),
    { wait: 600 },
    S('mabel', 'The last pages are gone, Tom. Torn out clean along the spine.'),
    clue('steno_transcript'), { doc: 'steno_transcript' },
    'Handled me once.',
    'I’d like very much to remember being handled.',
  ];
}

export const sal: DialogDef = {
  id: 'sal',
  npc: 'sal',
  nodes: {
    root: {
      lines: [{
        once: 'c1_sal_intro',
        do: [S('sal', 'Rook! Hey... you look... good. Rested.'), 'I’ve been resting for six days, Sal. Know anything about that?',
          S('sal', 'Me? I know drinks. Drinks I know.'), { person: 'sal' }],
      }],
      options: [
        {
          id: 'tuesday', text: 'Was I in here Tuesday night?', when: 'chapter<=2',
          do: [
            S('sal', 'Tuesday? Sure. You had a drink, you left. Like always.'),
            'Who was I with?',
            S('sal', 'Nobody. A girl. Maybe. It was busy.'),
            'You’ve been polishing that glass since I walked in, Sal.',
            S('sal', 'It’s a very dirty glass.'),
          ],
        },
        {
          id: 'drink', text: 'Pour me a drink.', when: 'chapter=1 & !c1_drink_offered',
          do: [
            S('sal', 'On the house! Anisette. The good stuff.'),
            set('c1_drink_offered'),
            { pick: [
              { when: 'clue:hat_note', do: [
                'On the house. That’s generous, Sal.',
                S('sal', 'For an old friend!'),
                { narrate: 'Sal turned to the register. The potted palm by the bar got an anisette.' },
                { sfx: 'pour' }, set('c1_palm'), clue('sal_drink'),
                'Delicious.',
              ] },
              { do: ['On second thought, it’s a little early. Even for me.', S('sal', '...Sure. Sure, Rook. Whatever you say.')] },
            ] },
          ],
        },
        {
          id: 'confess', text: 'Who told you to put scopolamine in my drink, Sal?', when: 'chapter>=2 & chapter<=4 & clue:lethe_identified & !clue:sal_confession',
          do: [
            S('sal', 'Scopo-what? I don’t — Rook, keep your voice down.'),
            'Anisette, Sal. They hide it in anisette.',
            { wait: 600 },
            S('sal', 'I didn’t know what it was! They said it’d make you sleepy so a fella could talk to you.'),
            S('sal', 'A cop. He’s got my brother Tony’s markers. Two grand. He says the word, Tony goes in the river.'),
            'Which cop?',
            S('sal', 'I can’t, Rook. He’d kill Tony. I’m not a brave man. I’m a bartender.'),
            S('sal', '...He wears a nice coat. That’s all I’m saying. That’s more than I should.'),
            clue('sal_confession'),
          ],
        },
        {
          id: 'sorry', text: 'Relax, Sal. I’m not here to break anything.', when: 'clue:sal_confession & chapter<=5', once: true,
          do: [S('sal', 'I’m sorry, Rook. For what it’s worth.'), 'It’s worth a drink. A clean one. Some other time.'],
        },
        {
          id: 'deacon', text: 'Is Deacon playing tonight?', when: 'chapter<=4',
          do: [S('sal', 'Deacon’s always playing. Deacon was playing when they built the place around him.')],
        },
        { id: 'bye', text: 'See you, Sal.', next: 'exit', do: [S('sal', 'Sure. Sure.')] },
      ],
    },
  },
};

export const deacon: DialogDef = {
  id: 'deacon',
  npc: 'deacon',
  nodes: {
    root: {
      lines: [{
        once: 'c1_deacon_intro',
        do: [S('deacon', 'Evening, Tom.'), 'Do I know you?', { wait: 400 }, S('deacon', '...Ah. So they did it.'), { person: 'deacon' }],
      }],
      options: [
        { id: 'did', text: 'Did what?', when: 'chapter=1 & !clue:on_ice', do: [S('deacon', 'Nothing. Request a song or let a man play.')] },
        {
          id: 'piano', text: 'Somebody told me to ask the piano.', when: 'chapter=1 & clue:ask_piano & !ded:piano_is_deacon',
          do: [S('deacon', 'The piano doesn’t talk, Tom. It plays.'), S('deacon', 'You want something from it, you ask it for a song.')],
        },
        {
          id: 'lullaby_early', text: 'Play “Lullaby of the Lamplighter”.', when: 'chapter=1 & clue:lamplighter_record & !ded:piano_is_deacon',
          do: [S('deacon', 'That’s a sad old song for a Monday.'), S('deacon', 'Who told you to ask for that one?')],
        },
        {
          id: 'lullaby', text: 'Play “Lullaby of the Lamplighter”.', when: 'chapter=1 & ded:piano_is_deacon & !clue:on_ice',
          do: [
            { music: 'lullaby' }, set('c1_deacon_lullaby'), { wait: 800 },
            S('deacon', '...That’s the one. That’s the one you said you’d ask for.'),
            S('deacon', 'You came in here on the eighth with Walter Marsh’s girl. You asked me to keep her safe.'),
            S('deacon', 'I am.'),
            'Where is she?',
            S('deacon', 'No.'),
            S('deacon', 'You made me promise. You said: “If I come back asking, it means they’ve got a leash on me.”'),
            S('deacon', 'I didn’t understand it then. Looking at you now, I’m starting to.'),
            clue('deacon_promise'),
            'What was I working on?',
            S('deacon', 'The Meridian. Same as always, these two years. Only this time you had proof, or the start of it.'),
            S('deacon', 'You said the proof was on ice. Pier 9.'),
            S('deacon', 'That’s all you told me, and I wish you’d told me less.'),
            clue('on_ice'), { unlock: 'pier9' },
            'Who’s “they”, Deacon?',
            S('deacon', 'If you knew on Tuesday, you don’t now. That’s the whole point, isn’t it?'),
            { autosave: 'Chapter 1 — The piano' },
          ],
        },
        {
          id: 'nora', text: 'Do you know Nora Marsh?', when: 'chapter=1 & has:nora_photo & !clue:on_ice',
          do: [S('deacon', 'Pretty name. Lots of pretty names come through here.'), S('deacon', 'Most of them leave again.')],
        },
        {
          id: 'walter', text: 'You knew Walter Marsh?', when: 'clue:on_ice & chapter<=5', once: true,
          do: [
            S('deacon', 'Forty years. We came over on the same boat and worked the same docks, till my hands went to the keys.'),
            S('deacon', 'He came in Saturdays and asked for the Lullaby. Said it was the only song that ever got Nora to sleep.'),
          ],
        },
        {
          id: 'where2', text: 'Deacon, where is she?', when: 'chapter>=2 & chapter<=4',
          do: [S('deacon', 'Safe.'), S('deacon', 'Ask me again and I’ll play you the Lullaby till you cry. I’m not telling you, Tom. You told me not to.')],
        },
        {
          id: 'drugged', text: 'They drugged me, Deacon. That’s the leash.', when: 'chapter>=2 & chapter<=4 & ded:i_was_drugged', once: true,
          do: [
            S('deacon', 'Then you were right to make me promise.'),
            S('deacon', 'Whatever they can put in your head, they can take out of it. Including her.'),
          ],
        },
        { id: 'bye', text: 'Keep playing, Deacon.', next: 'exit', do: [S('deacon', 'Always do.')] },
      ],
    },
  },
};

export const hask: DialogDef = {
  id: 'hask',
  npc: 'hask',
  nodes: {
    root: {
      lines: [{
        once: 'hask_intro',
        do: [S('hask', 'Thomas. You owe me for a padlock.'), 'Good to see you too, Hask.', { person: 'hask' }],
      }],
      options: [
        {
          id: 'padlock', text: 'What padlock?', when: 'chapter<=3',
          do: [
            S('hask', 'The one you bought on the eighth. Steel, laminated, a good honest lock. You said you’d pay me Friday.'),
            S('hask', 'You left your lock picks as collateral. I am a patient man. I am also seventy-five.'),
          ],
        },
        {
          id: 'picks', text: 'Can I have my picks back?', when: 'chapter<=4 & !has:lockpicks & !c3_picks_paid',
          do: [S('hask', 'When I see money, Thomas, I will see my way to the drawer.')],
        },
        {
          id: 'teach', text: 'You taught me to pick locks, didn’t you?', once: true,
          do: [
            S('hask', 'In 1932. You were a skinny patrolman who locked himself out of his own precinct.'),
            S('hask', 'I taught you to pick a lock so you would stop breaking my doors. Now you break other people’s.'),
          ],
        },
        {
          id: 'meridian_lock', text: 'Hask, look at this padlock.', when: 'chapter=5 & has:padlock & !clue:padlock_order', say: false,
          do: [
            'Hask, look at this padlock.',
            S('hask', 'Brackwater Lock Company, model 9, brass shackle. Burnt.'),
            S('hask', 'I know this lock, Thomas. I sold twenty of them in September of ’49. To Gullwing Holdings.'),
            S('hask', 'A big policeman came to collect them. He haggled. Nobody haggles with me.'),
            { narrate: 'Hask took down a ledger thick as a church Bible and ran a finger down a column.' },
            S('hask', 'Here. “Twenty padlocks, model 9. Received: F. Delaney.”'),
            clue('padlock_order'),
            'Frank bought the padlock.',
          ],
        },
        {
          id: 'key', text: 'Can you cut a key for the WBRK booth at City Hall?', when: 'chapter=7 & c7_planned & !has:booth_key',
          do: [
            S('hask', 'I fitted every lock in City Hall in 1938. I kept the bitting cards. I keep everything.'),
            { narrate: 'The key machine screamed for a minute and a half. Hask blew the brass dust off and held up the key.' },
            give('booth_key'),
            S('hask', 'This is not the first time I have helped you break the law, Thomas.'),
            S('hask', 'It is the first time I have agreed with you.'),
          ],
        },
        { id: 'bye', text: 'See you, Hask.', next: 'exit', do: [S('hask', 'Lock the door behind you. Everybody forgets.')] },
      ],
    },
  },
};

/** Paying Hask for the padlock gets the lock picks back. */
export const payHask = [
  'Fifty dollars. Keep the change, and keep the lecture.',
  take('retainer'), set('c3_picks_paid'),
  S('hask', 'The padlock was four dollars. I will keep the change and give you the lecture anyway.'),
  { sfx: 'drawer_open' }, give('lockpicks'),
  S('hask', 'Your picks. Pick only what is yours, Thomas. Or what ought to be.'),
];

export const delaney: DialogDef = {
  id: 'delaney',
  npc: 'delaney',
  nodes: {
    root: {
      lines: [{
        once: 'c3_delaney_intro',
        do: [
          S('delaney', 'Tommy! Sit down, sit down. You look like hell.'),
          S('delaney', 'Here.'), { narrate: 'Frank lit my cigarette with a gold lighter. There was a gull engraved on it.' },
          clue('gull_lighter'), { person: 'delaney' },
        ],
      }],
      options: [
        {
          id: 'nora', text: 'What do you know about Nora Marsh?', when: 'chapter=3',
          do: [
            S('delaney', 'Missing persons. A grown woman. She probably ran off with a sailor, Tommy. They do.'),
            S('delaney', 'Stay out of it. You’re not police anymore. You don’t have the protection.'),
          ],
        },
        {
          id: 'meridian', text: 'Tell me about the Meridian, Frank.', when: 'chapter=3',
          do: [
            S('delaney', 'That’s closed. Galley fire. A tragedy.'),
            S('delaney', 'You almost lost your mind over that case, Tommy. I’m not letting you do it twice.'),
          ],
        },
        {
          id: 'fortynine', text: 'What happened to me in ’49?', when: 'chapter=3',
          do: [
            S('delaney', 'You hit the bottle. Hard. I covered for you as long as I could.'),
            S('delaney', 'I even got you into a rest home for a week. You don’t remember? No? Well. That’s the bottle for you.'),
            clue('rest_home'),
          ],
        },
        {
          id: 'lighter', text: 'Nice lighter.', when: 'chapter=3 & clue:gull_lighter', once: true,
          do: [
            S('delaney', 'This? A present from a friend. A gull, see? For the harbor.'),
            'I still carry yours.',
            S('delaney', '...The Zippo? Partners, 1938. God, we were young.'),
          ],
        },
        {
          id: 'directory', text: 'Mind if I use your reverse directory?', when: 'chapter=3 & !c3_directory_ok',
          do: [S('delaney', 'Ask Danny at the desk. Tell him I said it’s fine.'), S('delaney', 'Just don’t go making trouble with it.'), set('c3_directory_ok')],
        },
        { id: 'bye', text: 'See you around, Frank.', next: 'exit', do: [S('delaney', 'Get some sleep, Tommy. Real sleep.')] },
      ],
    },
  },
};

export const pruitt: DialogDef = {
  id: 'pruitt',
  npc: 'pruitt',
  nodes: {
    root: {
      lines: [{
        once: 'c3_pruitt_intro',
        do: [S('pruitt', 'Mr. Rook! Gosh. I read about the Vandermeer case at the academy.'), { person: 'pruitt' }],
      }],
      options: [
        {
          id: 'vandermeer', text: 'The Vandermeer case?', when: 'chapter=3', once: true,
          do: [
            S('pruitt', 'The pearl in the parrot cage! You figured the parrot swallowed the receipt, not the pearl!'),
            'The parrot did most of the work.',
          ],
        },
        {
          id: 'directory', text: 'Can I use the reverse directory?', when: 'chapter=3 & !c3_directory_ok',
          do: [
            S('pruitt', 'It’s police use only, Mr. Rook...'),
            S('pruitt', '...but you were police. Go on. Just put it back where it was.'),
            set('c3_directory_ok'),
          ],
        },
        { id: 'bye', text: 'Keep up the good work, Officer.', next: 'exit', do: [S('pruitt', 'Yes sir! I mean — yes, Mr. Rook.')] },
      ],
    },
  },
};
