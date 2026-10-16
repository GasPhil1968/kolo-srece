// Temporary development room to verify rendering, walking and scale.
import type { ChapterDef } from '../../core/content';
import { say } from '../../core/cmd';

export const sandbox: ChapterDef = {
  id: 'sandbox',
  title: 'Werkstatt',
  dateline: 'Sarajevo, Frühjahr 1996',
  card: { image: 'intro_prolog', lines: ['Ein Testraum.'] },
  pc: { character: 'macleod', name: 'MacLeod', color: '#9fc4e8' },
  start: { room: 'sb_prolog', entry: 'door' },
  next: null,
  journal: {},
  hint: () => null,
  items: [],
  dialogues: [],
  actors: [
    { id: 'mijo96', name: 'Mijo', character: 'mijo1996', color: '#e8c38a', start: { room: 'sb_prolog', x: 830, y: 430, facing: -1 }, on: { talk: [ 'Später.' ] } },
  ],
  rooms: [
    {
      id: 'sb_prolog',
      title: 'Mijos Zimmer',
      bg: 'bg_prolog',
      width: 1280,
      walk: [{ outer: [60, 462, 1230, 462, 1180, 395, 100, 395] }],
      perspective: { farY: 395, farScale: 0.78, nearY: 462, nearScale: 1.0 },
      entries: { door: { x: 640, y: 430, face: 1 } },
      hotspots: [
        { id: 'regal', name: 'Bücherregal', shape: { x: 40, y: 100, w: 200, h: 220 }, walkTo: { x: 150, y: 420, face: -1 }, on: { look: 'Bücher in vier Sprachen.' } },
      ],
      onEnter: function* () {
        yield say('pc', 'Ein Zimmer über der Miljacka.');
      },
    },
  ],
};
