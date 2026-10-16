import type { NpcDef } from '../engine/types';

const N = (id: string, name: string, color: string, sprite: string, extra: Partial<NpcDef> = {}): NpcDef => ({
  id,
  name,
  color,
  sprite,
  talk: [{ dialog: id }],
  ...extra,
});

export const NPCS: Record<string, NpcDef> = Object.fromEntries(
  [
    N('pettibone', 'Pettibone', '#d8d0a0', 'pettibone', {
      look: ['The night clerk. Thin as a receipt, with a pulp magazine called ASTOUNDING TALES open under his elbow.'],
    }),
    N('mabel', 'Mabel', '#c9b6e8', 'mabel', {
      look: ['Mabel Finch. Sixty-one, a cardigan, a cigarette, and the patience of a woman who has worked for me for six years.'],
    }),
    N('evelyn', 'Evelyn Marsh', '#e8a0a8', 'evelyn', {
      look: [
        'Mid-thirties, good gloves, and a little gold watch pinned upside down on her lapel.',
        'Under the perfume there’s something sharper. Carbolic soap.',
        { clue: 'evelyn_watch' },
      ],
    }),
    N('vivian', 'Vivian Hale', '#e8a0a8', 'vivian', {
      look: ['Evelyn Marsh in a nurse’s cape. The watch on her lapel finally makes sense.'],
      talk: [{ say: 'Not now, Mr. Rook. You need your rest.', who: 'vivian' }],
    }),
    N('sal', 'Sal', '#a8d8a0', 'sal', {
      look: ['Sal Moretti, bartender. He’s polishing a glass that was clean ten minutes ago.'],
    }),
    N('deacon', 'Deacon', '#ffd08a', 'deacon', {
      look: ['Deacon Boone. Thirty years at the Lantern’s piano. His hands know things his face won’t say.'],
    }),
    N('deacon_stand', 'Deacon', '#ffd08a', 'deacon_stand', {
      look: ['Deacon Boone, away from his piano. He looks smaller without it.'],
      talk: [{ dialog: 'deacon' }],
    }),
    N('delaney', 'Frank Delaney', '#9fd0ff', 'delaney', {
      look: ['Frank Delaney. Big, warm, camel-hair coat. We walked a beat together in ’31. He still walks like he owns it.'],
    }),
    N('gus', 'Gus', '#a0c8e8', 'gus', {
      look: ['Gus Tolliver, night watchman. A beard like a gull’s nest and eyes that don’t miss much.'],
    }),
    N('kessler', 'Kessler', '#c0e8e0', 'kessler', {
      look: ['Otto Kessler, pharmacist. Half-moon glasses and a white coat starched stiff enough to stand on its own.'],
    }),
    N('abernathy', 'Abernathy', '#e8c890', 'abernathy', {
      look: ['Harold Abernathy, editor. Green visor, rolled sleeves, and the complexion of a man who lives on deadlines and coffee.'],
    }),
    N('agnes', 'Sister Agnes', '#e0e0f0', 'agnes', {
      look: ['Sister Agnes. Black habit, white coif, and the stance of a sergeant major.'],
    }),
    N('volunteer', 'volunteer', '#ffb8a0', 'nora_volunteer', {
      look: ['A young woman in a headscarf ladling soup. She keeps her face turned to the pot.'],
    }),
    N('nora', 'Nora', '#ffb8a0', 'nora', {
      look: ['Nora Marsh. Smaller than her photograph, and a great deal more determined.'],
      talk: [{
        if: 'chapter=6', then: [{ dialog: 'nora6' }],
        else: [{ say: 'Go on, Tom. Get your key from Hask, and your log from Gus. I’ll be ready at nine.', who: 'nora' }],
      }],
    }),
    N('kerrigan', 'Kerrigan', '#d0c0a0', 'kerrigan', {
      look: ['A man in a worn jacket hunched over his soup, holding the spoon like it might get away.'],
    }),
    N('lillian', 'Lillian', '#ffe0a0', 'lillian', {
      look: ['A typist with a blonde wave and a pencil behind her ear, typing a hundred words a minute and listening to everything.'],
    }),
    N('pruett', 'Miss Pruett', '#c8c8d8', 'pruett', {
      look: ['Miss Pruett, the Commissioner’s secretary. Gray suit, gray bun, gray stare.'],
    }),
    N('pruitt', 'Officer Pruitt', '#a8c8ff', 'pruitt', {
      look: ['A young patrolman with a fresh haircut and a uniform he hasn’t grown into.'],
    }),
    N('barnaby', 'Barnaby', '#b8d8c8', 'barnaby', {
      look: ['My cellmate. A sailor in a striped jersey, with a beard that has hosted several meals.'],
    }),
    N('kroll', 'Kroll', '#e0e0e0', 'kroll', {
      look: ['A Halcyon orderly the size of a refrigerator, in a white tunic.'],
      talk: [{ say: '...', who: 'kroll' }, 'Kroll’s not a conversationalist.'],
    }),
    N('pike', 'Patient 14', '#d8e8c8', 'pike', {
      look: ['A man in a hospital robe, wandering the corridor as if looking for a word he dropped.'],
      talk: [{ dialog: 'pike4' }],
    }),
    N('hask', 'Hask', '#f0c890', 'hask', {
      look: ['Ignatius Hask. Locksmith, seventy-five, moustache like a push broom.'],
    }),
    N('cobb', 'Cobb', '#c8b890', 'cobb', {
      look: ['The gravedigger, leaning on his shovel like it owes him money.'],
    }),
    N('vey', 'Dr. Vey', '#b8e0c8', 'vey', {
      look: ['Dr. Lucian Vey. Thin as a clock hand and about as warm.'],
      talk: [{ say: 'We will talk later, Mr. Rook. We always do.', who: 'vey' }],
    }),
    N('crane', 'Commissioner Crane', '#f0d0d0', 'crane', {
      look: ['Augustus Crane, in a dinner jacket that cost more than my building.'],
      talk: [{ say: 'Not now. I have a city to address.', who: 'crane' }],
    }),
    N('morrow', 'Captain Morrow', '#a8c8ff', 'morrow', {
      look: ['Captain Morrow. Gray moustache, tired eyes, honest shoes.'],
      talk: [{ say: 'Later, Rook. I’ve got a lieutenant to book.', who: 'morrow' }],
    }),
    N('voice', 'Voice', '#b8e0c8', 'vey', { look: [], talk: ['There’s nobody there to talk to. Just a voice.'] }),
  ].map((n) => [n.id, n]),
);
