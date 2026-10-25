import type { DialogDef } from '../../engine/types';
import { S, clue, give, set } from '../dsl';

export const pettibone: DialogDef = {
  id: 'pettibone',
  npc: 'pettibone',
  nodes: {
    root: {
      options: [
        {
          id: 'who', text: 'Who brought me here?',
          do: [
            S('pettibone', 'Two gents, Tuesday night. You were out cold.'),
            S('pettibone', 'The big one did the talking. Camel-hair coat, very nice. I noticed, because I’ll never own one.'),
            S('pettibone', 'The other one never said a word. Smelled like a hospital. You know — that clean smell that isn’t.'),
            'Did the big one leave a name?',
            S('pettibone', 'He signed the book. “Mr. Smith.” I get a lot of Smiths. It’s a popular name in the hotel trade.'),
            clue('two_men'),
          ],
        },
        {
          id: 'locked', text: 'Why was my door locked from the outside?',
          do: [
            S('pettibone', 'The big fella asked me to. Said you sleepwalk.'),
            S('pettibone', 'I respect a Do Not Disturb sign, Mr. Rook. It’s practically my religion.'),
            'You’re a lapsed something, Pettibone.',
          ],
        },
        {
          id: 'paid', text: 'Who paid for the room?',
          do: [
            S('pettibone', 'Cash, a week in advance. New bills.'),
            S('pettibone', 'Anybody pays a week in advance at the Sorrento, I don’t ask questions. I don’t want to know what a man would do with the answers.'),
          ],
        },
        {
          id: 'coat', text: 'Have you got my coat?', when: '!has:lighter',
          do: [
            S('pettibone', 'Sure, they left it with me. But house rules: you give me the room key, I give you the coat.'),
            S('pettibone', 'Otherwise people walk off with the keys and I’m running a hotel with no doors.'),
            set('c1_coat_rule'),
          ],
        },
        {
          id: 'day', text: 'What day is it?',
          do: [S('pettibone', 'Monday. All day, if it’s anything like the last one.')],
        },
        {
          id: 'book', text: 'What are you reading?', once: true,
          do: [
            S('pettibone', 'Astounding Tales. A fella wakes up on Mars with no memory and has to figure out who put him there.'),
            'How does it end?',
            S('pettibone', 'Don’t know. Somebody tore out the last pages.'),
            'That’s going around.',
          ],
        },
        { id: 'bye', text: 'Thanks, Pettibone.', next: 'exit', do: [S('pettibone', 'Don’t mention it. I mean that. Don’t mention it to anybody.')] },
      ],
    },
  },
};

/** Returning the room key to Pettibone gets the coat back. */
export const coatExchange = [
  S('pettibone', 'One key, one coat. Pleasure doing business.'),
  { take: 'key9' },
  { anim: 'pickup_side' },
  give('lighter'), give('matchbook'), give('pocketbook'),
  'My coat. My lighter, my matchbook from the Blue Lantern... and my notebook.',
  { doc: 'pocketbook' }, clue('pocketbook'),
  'Every page after the eighth, torn out. Somebody wanted my week more than I did.',
  'The matchbook says Tuesday, eleven o’clock, the Blue Lantern. And my office is on Marrow Street — if I’ve still got one.',
  { unlock: 'office' }, { unlock: 'hotel', silent: true }, { unlock: 'lantern' }, { unlock: 'hask', silent: true },
  { autosave: 'Chapter 1 — Hotel Sorrento' },
];

export const evelyn: DialogDef = {
  id: 'evelyn',
  npc: 'evelyn',
  nodes: {
    root: {
      lines: [{
        once: 'c1_evelyn_intro',
        do: [
          S('evelyn', 'Mr. Rook? I’m Evelyn Marsh. Nora’s sister.'),
          S('evelyn', 'Your secretary tells me you’ve been... away.'),
          'I’ve been asking myself where.',
        ],
      }],
      options: [
        {
          id: 'what', text: 'What can I do for you, Miss Marsh?',
          do: [
            S('evelyn', 'You can find my sister. The police won’t.'),
            S('evelyn', 'A grown woman, they say. She’ll turn up.'),
            S('evelyn', 'Nora doesn’t “turn up”, Mr. Rook. She’s the most dependable person I know.'),
            clue('evelyn_claim'), { person: 'evelyn' }, { person: 'nora' },
          ],
        },
        {
          id: 'why', text: 'Why come to me?',
          do: [
            S('evelyn', 'Nora mentioned you. She said you were the only honest man in Brackwater.'),
            'That’s not a big field.',
            S('evelyn', 'She said that too.'),
          ],
        },
        {
          id: 'about', text: 'Tell me about Nora.',
          do: [
            S('evelyn', 'She types for the Harbor Commission. She lives at the Bellwether, number 3B.'),
            S('evelyn', 'Our father died two years ago, in the Meridian fire. Since then she’s been... intense.'),
            'Intense how?',
            S('evelyn', 'She reads things she isn’t supposed to.'),
          ],
        },
        {
          id: 'reach', text: 'Where can I reach you?',
          do: [
            S('evelyn', 'I’m staying with friends up on the hill. You can leave word at Harbourview 4-170.'),
            S('evelyn', 'I’d like a report every evening, if it’s not too much trouble.'),
            clue('evelyn_phone'),
          ],
        },
        {
          id: 'take', text: 'I’ll take the case.', when: 'seen:evelyn.what', next: 'exit',
          do: [
            S('evelyn', 'Thank you. Here — a photograph of her.'),
            give('nora_photo'), give('retainer'),
            S('evelyn', 'And fifty dollars, to begin with.'),
            'That’s very prompt.',
            S('evelyn', 'I’m a very prompt woman.'),
            { if: '!clue:evelyn_phone', then: [S('evelyn', 'You can leave word for me at Harbourview 4-170. A report every evening, please.'), clue('evelyn_phone')] },
            S('evelyn', 'Please, Mr. Rook. Find her before anyone else does.'),
            { narrate: 'As she stood to go, I noticed a little gold watch pinned upside down to her lapel. And under the perfume, carbolic soap.' },
            clue('evelyn_watch'),
            set('c1_hired'), { unlock: 'bellwether' },
            { walk: 'from_map', who: 'evelyn' }, { sfx: 'door_close' }, { npc: 'evelyn', hide: true },
            S('mabel', 'Before anyone else does. Funny thing to say.'),
            'Funny how?',
            S('mabel', 'Not ha-ha funny.'),
            { autosave: 'Chapter 1 — The client' },
          ],
        },
        { id: 'bye', text: 'Excuse me a moment.', next: 'exit', do: [S('evelyn', 'Of course. I’ll wait. I’m good at it.')] },
      ],
    },
  },
};
