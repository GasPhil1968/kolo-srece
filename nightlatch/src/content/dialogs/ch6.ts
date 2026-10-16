import type { DialogDef } from '../../engine/types';
import { S, clue, set } from '../dsl';

export const nora6: DialogDef = {
  id: 'nora6',
  npc: 'nora',
  nodes: {
    root: {
      options: [
        {
          id: 'eighth', text: 'What happened on the eighth?',
          do: [
            S('nora', 'I came to your office with my transcript. You read it twice. Then you poured yourself a drink and didn’t drink it.'),
            S('nora', 'You said, “They did it to me once. They’ll try again.” And then you made a plan.'),
            clue('nora_story'),
          ],
        },
        {
          id: 'plan', text: 'What was the plan?', when: 'seen:nora6.eighth',
          do: [
            S('nora', 'Split the pages. Hide me with Sister Agnes. Tell Deacon to lock you up if you ever came asking for me.'),
            S('nora', 'And make very sure you never knew where I was.'),
            S('nora', 'You said, “A man who can be made to forget can be made to remember the wrong things.”'),
          ],
        },
        {
          id: 'soup', text: 'You served me soup on Tuesday.', once: true,
          do: [S('nora', 'You said it was the best soup in Brackwater. It isn’t.'), S('nora', 'I nearly cried into the pot.')],
        },
        {
          id: 'page3', text: 'Where’s page three?',
          do: [S('nora', 'Safe. With me.'), S('nora', 'That’s all you get, Detective. You taught me that.')],
        },
        {
          id: 'why', text: 'Why did I take this on? Did I say?',
          do: [S('nora', 'You said you owed my father.'), S('nora', 'You didn’t say what.')],
        },
        {
          id: 'truth', text: 'Nora... Walter went aboard the Meridian because I asked him to.', when: 'clue:sent_walter & seen:nora6.why',
          once: true,
          do: [
            { wait: 900 },
            S('nora', '...I know, Tom.'),
            S('nora', 'Gus told me, last winter. He said you’d forgotten. I didn’t believe that either.'),
            S('nora', 'My father went because he wanted to. He’d been wanting to for months.'),
            S('nora', 'You just gave him a reason he could say out loud.'),
            set('c6_told_truth'),
          ],
        },
        {
          id: 'go', text: 'We have to move you. Now.', next: 'exit',
          do: [S('nora', 'Where?'), 'Somewhere I don’t know about.', S('nora', 'That’s the most romantic thing anyone’s ever said to me.')],
        },
      ],
    },
  },
};
