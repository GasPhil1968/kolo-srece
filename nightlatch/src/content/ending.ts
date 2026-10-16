// Watchers (story beats that fire when conditions come together) and the epilogue.
import type { DialogDef, Script } from '../engine/types';
import { N, S, set } from './dsl';

export const EPILOGUE: Script = [
  { fade: 'out', ms: 900 },
  { music: 'ending' },
  N('Augustus Crane was arrested on the steps of his own centenary, still holding his speech. It was a good speech. Nobody ever heard it.'),
  N('Dr. Vey was found in his office at one in the morning, winding his clocks. Vivian Hale was found at the railway station with a one-way ticket and a suitcase of files she hadn’t had time to burn.'),
  {
    if: 'c4_promise_pike',
    then: [N('I went back up Gull Hill for Wendell Pike, like I’d promised. By Tuesday he knew my name. By Thursday he was shouting at Abernathy, and Abernathy was shouting back, and both of them looked very happy about it.')],
    else: [N('They brought Wendell Pike down Gull Hill on Monday. By Thursday he was shouting at Abernathy, and Abernathy was shouting back, and both of them looked very happy about it.')],
  },
  N('On Monday morning the Meridian case was reopened by a young detective named Daniel Pruitt. He asked me to look over his notes. They were very good notes.'),
  { set: 'c8_dawn' },
  { goto: 'pier9', at: 'wreck_view' },
  N('Pier 9, at dawn. The fog had gone somewhere else to be miserable. The Meridian’s ribs stood up out of the water, pink in the first light.'),
  { dialog: 'epilogue' },
];

export const epilogue: DialogDef = {
  id: 'epilogue',
  npc: 'nora',
  nodes: {
    root: {
      lines: [{ once: 'c8_ep_intro', do: [S('nora', 'I thought I’d find you here.'), 'I thought I’d find me here too. It’s nice when something works out.'] }],
      options: [
        {
          id: 'truth', text: 'Nora, there’s something I have to tell you about your father.', when: '!c6_told_truth',
          do: [
            'Walter went aboard the Meridian that night because I asked him to. He signed the gate log “for Sgt. Rook”.',
            { wait: 1000 },
            S('nora', 'I know, Tom. Gus told me, last winter. He said you’d forgotten.'),
            S('nora', 'He went because he wanted to. He’d been wanting to for months. You gave him a reason he could say out loud.'),
            set('c6_told_truth'),
          ],
        },
        {
          id: 'after', text: 'You knew. And you came to me anyway.', when: 'c6_told_truth',
          do: [
            S('nora', 'That was my father: he went because it was right, and he knew what it might cost.'),
            S('nora', 'And you went back for him two years later, with half your mind gone. That’s you.'),
            S('nora', 'I think he’d have liked the company.'),
          ],
        },
        {
          id: 'knife', text: 'Your father’s knife. I promised it back.', when: 'has:walter_knife',
          do: [{ take: 'walter_knife' }, S('nora', 'Thank you.'), S('nora', 'He used to cut the string on the Sunday paper with it. That’s all it was ever for, until this week.')],
        },
        {
          id: 'now', text: 'What will you do now?',
          do: [
            S('nora', 'Type somebody else’s minutes for a while. Something dull. Tonnage. Tariffs. Weather.'),
            S('nora', 'And you could use a secretary who reads shorthand.'),
            'I have one. She’s sixty-one and terrifying.',
            S('nora', 'Then you could use two.'),
          ],
        },
        {
          id: 'go', text: 'Come on. Mabel will want to feed us.', when: 'seen:epilogue.after', next: 'exit',
          do: [
            S('nora', 'Is she a good cook?'),
            'She’s a terrible cook. She’ll feed us anyway. That’s the kind of people we’ve got left.',
            { fade: 'out', ms: 1200 },
            N('There’s a moment, just before you open your eyes, when you’re nobody in particular.'),
            N('These days, it passes quicker.'),
            { set: 'game_complete' },
            { end: true },
          ],
        },
      ],
    },
  },
};

/** One-shot beats that fire after any action once their conditions hold. */
export const WATCH: { id: string; when: string; do: Script }[] = [
  {
    id: 'c3_halcyon',
    when: 'chapter=3 & ded:evelyn_impostor & ded:evelyn_nurse & clue:steno_transcript & clue:flowers & has:lockpicks & c3_unlocked',
    do: [
      'Evelyn works at Halcyon House. Pike went up Gull Hill and never came down. The Meridian’s witnesses went up and came down empty.',
      'If anybody knows where the bodies are buried — or the memories — it’s Dr. Vey.',
      'Time I paid Halcyon House a visit. After dark, and not by the front gate.',
      { unlock: 'halcyon' },
      { autosave: 'Chapter 3 — Gull Hill' },
    ],
  },
  {
    id: 'c5_deacon',
    when: 'chapter=5 & c5_drawer & clue:padlock_order',
    do: ['Frank’s going to follow Deacon to Nora. I have to warn him. Tonight.', 'The Blue Lantern.'],
  },
  {
    id: 'c7_ready',
    when: 'chapter=7 & c7_planned & has:booth_key & has:press_pass & has:gus_log & has:antidote',
    do: [
      'A key to the booth. A pass to the gala. Gus’s log. And an hour of clear head in a glass ampoule.',
      'Everything I need is in my pockets. It’s a strange feeling. I could get used to it.',
      'City Hall. Nine o’clock.',
      { unlock: 'cityhall' },
      { autosave: 'Chapter 7 — Ready' },
    ],
  },
  {
    id: 'c8_epilogue',
    when: 'c8_epilogue_ready',
    do: EPILOGUE,
  },
];
