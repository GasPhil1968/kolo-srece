import type { DialogDef } from '../../engine/types';
import { S, clue, sfx, wait } from '../dsl';

/** The telephone on Rook's desk. */
export const office_phone: DialogDef = {
  id: 'office_phone',
  npc: 'delaney',
  nodes: {
    root: {
      lines: [sfx('phone_pickup')],
      options: [
        {
          id: 'frank1', text: 'Call Frank Delaney at the precinct.', when: 'chapter=1 & !seen:office_phone.frank1', next: 'exit',
          say: false,
          do: [
            sfx('phone_dial'), wait(600),
            S('delaney', 'Delaney.'),
            'Frank. It’s Tom.',
            S('delaney', 'Tommy! Where the hell have you been? I’ve been worried sick.'),
            'I’ve been asking myself the same thing.',
            S('delaney', 'Listen to me. Stay away from the Marsh thing. Nora Marsh is a missing persons file, and you’re not police anymore.'),
            S('delaney', 'I mean it, Tommy.'),
            'How do you know I’m on the Marsh thing, Frank?',
            { wait: 500 },
            S('delaney', '...Mabel said. Look — come by the precinct sometime. We’ll get a drink. Like old times.'),
            sfx('phone_pickup'),
            'Mabel says she told him nothing but my debts.',
            clue('delaney_warning'), { person: 'delaney' },
          ],
        },
        {
          id: 'evelyn1', text: 'Call Harbourview 4-170.', when: 'clue:evelyn_phone & chapter<=2 & !seen:office_phone.evelyn1', next: 'exit',
          say: false,
          do: [
            sfx('phone_dial'), wait(700),
            S('evelyn', 'Hello?'),
            'Miss Marsh. Rook. Just checking in.',
            S('evelyn', 'Mr. Rook! Any news of my sister?'),
            'I’m pulling on threads.',
            S('evelyn', 'Pull harder. And call me every evening. I worry.'),
            sfx('phone_pickup'),
            'There was a lot of quiet on that line. The kind of quiet you get in a big building.',
          ],
        },
        { id: 'hang', text: 'Hang up.', next: 'exit', say: false, do: [sfx('phone_pickup')] },
      ],
    },
  },
};
