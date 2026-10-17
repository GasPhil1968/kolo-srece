// Kapitel 11 – Vor dem Dorf. Drina-Gebiet, 20. September 1878. Yesterday shots from this village, five
// wounded; today the company has to pass through it, and the captain wants bayonets and the double. In
// the old game the clue was a wedding drum one had to hear; here everything is seen: white linen from
// house to house, lights in the windows in daylight, and – through the captain's own field glass – too
// many people in good clothes and saddled horses under festive blankets: guests, half of them from
// elsewhere. Whoever shoots today hits his own guests. Mijo talks the captain out of the bayonets (only
// what he has seen counts as an argument) and into a plan: march through, rifles slung, keep distance,
// and return every greeting – for which he needs something in his hand (the train wagon's field flask).
// In the lane an old man raises a bottle in his doorway; Mijo raises the flask. The next day there were
// shots from the same village again.
import type { ChapterDef, RoomDef, ScriptCtx } from '../../core/content';
import type { InsertSpec, Script } from '../../core/cmd';
import { checkpoint, choice, endChapter, fade, insert, narrate, pose, room, say, wait, walk } from '../../core/cmd';
import type { GameState } from '../../core/state';
import { T } from '../text/de/c11_hochzeit';
import { flags, PC, persp2, R } from '../util';

const f = flags('hz');
const HM = 'hz_hm';
const TOAST = 'hz_toast';
const C = { pc: '#d9cdb4', hm: '#b9c4d8' };
type Rect4 = [number, number, number, number];
const fl = (s: GameState, n: string) => !!s.flags[f(n)];
const not = (n: string) => (s: GameState) => !fl(s, n);
const has = (s: GameState, item: string) => s.inventory.includes(item);

function* lines(actor: string, l: string | readonly string[]): Script {
  for (const t of typeof l === 'string' ? [l] : l) yield say(actor, t);
}

// =========================================================================================== Am Kamm

const GLASS: InsertSpec = { w: 520, h: 250, bg: 'bg_hochzeit', crop: [690, 175, 420, 202], sprite: { character: 'gaeste_hz', anim: 'stand', x: 260, y: 236, scale: 0.92 } };

function* lookVillage(c: ScriptCtx): Script {
  if (c.is(f('glas'))) {
    if (c.is(f('gaeste'))) {
      yield say(PC, T.kamm.dorf.glasAgain);
      return;
    }
    c.set(f('hochzeit'));
    c.set(f('gaeste'));
    yield insert(GLASS);
    yield* lines(PC, T.kamm.dorf.glas);
    yield insert(null);
    return;
  }
  if (c.is(f('hochzeit'))) {
    yield say(PC, T.kamm.dorf.lookAgain);
    return;
  }
  c.set(f('hochzeit'));
  yield* lines(PC, T.kamm.dorf.look);
}

function* takeFlask(c: ScriptCtx): Script {
  if (c.has('feldflasche') || c.is(f('flasche'))) {
    yield say(PC, T.kamm.wagen.lookAfter);
    return;
  }
  c.set(f('flasche'));
  c.give('feldflasche');
  yield* lines(PC, T.kamm.flasche.take);
}

function* order(c: ScriptCtx): Script {
  yield say(PC, T.kamm.hauptmann.grussFlasche);
  yield pose(HM, 'point', { loop: true });
  yield say(HM, T.kamm.hauptmann.befehl);
  yield pose(HM, 'stand', { loop: true });
  yield narrate(T.kamm.hauptmann.befehlN);
  c.set(f('befehl'));
  c.journal('befehl', 'done');
  c.journal('gruss');
  yield checkpoint();
}

/** "Heute schießt da unten keiner." – only what Mijo has seen counts. */
function* argue(c: ScriptCtx): Script {
  const H = T.kamm.hauptmann;
  yield pose(HM, 'crossed', { loop: true });
  yield say(HM, H.woher);
  const opts: { id: string; text: string }[] = [];
  if (c.is(f('hochzeit'))) opts.push({ id: 'hochzeit', text: H.gruende.hochzeit });
  opts.push({ id: 'gefuehl', text: H.gruende.gefuehl }, { id: 'gestern', text: H.gruende.gestern });
  const a: string = yield choice(opts);
  yield say(PC, opts.find((o) => o.id === a)!.text);
  if (a !== 'hochzeit') {
    yield say(HM, a === 'gefuehl' ? H.gefuehlA : H.gesternA);
    yield pose(HM, 'stand', { loop: true });
    return;
  }
  yield pose(HM, 'village', { loop: true });
  yield say(HM, H.hochzeitA);
  const g: { id: string; text: string }[] = [];
  if (c.is(f('gaeste'))) g.push({ id: 'gaeste', text: H.gaesteOpts.gaeste });
  g.push({ id: 'alles', text: H.gaesteOpts.alles });
  const b: string = yield choice(g);
  yield say(PC, g.find((o) => o.id === b)!.text);
  if (b !== 'gaeste') {
    yield pose(HM, 'stand', { loop: true });
    yield say(HM, H.allesA);
    return;
  }
  yield pose(HM, 'gesture', { loop: true });
  yield say(HM, H.gaesteA);
  for (;;) {
    const p: string = yield choice([
      { id: 'laufen', text: H.plan.laufen },
      { id: 'wald', text: H.plan.wald },
      { id: 'gruss', text: H.plan.gruss },
    ]);
    yield say(PC, p === 'laufen' ? H.plan.laufen : p === 'wald' ? H.plan.wald : H.plan.gruss);
    if (p === 'laufen') {
      yield say(HM, H.laufenA);
      continue;
    }
    if (p === 'wald') {
      yield say(HM, H.waldA);
      continue;
    }
    break;
  }
  c.set(f('plan'));
  yield pose(HM, 'hip', { loop: true });
  yield say(HM, H.grussA);
  if (c.has('feldflasche')) {
    yield* order(c);
    return;
  }
  yield say(PC, H.grussOhne);
  yield say(HM, H.grussOhneA);
  yield pose(HM, 'stand', { loop: true });
}

function* down(c: ScriptCtx): Script {
  if (!c.is(f('befehl'))) {
    yield say(PC, T.kamm.weg.notYet);
    return;
  }
  yield fade(1, 0.8);
  yield narrate(T.kamm.weg.out);
  yield room('hz_gasse', 'start');
}

const kamm: RoomDef = {
  id: 'hz_kamm',
  title: T.rooms.kamm,
  bg: 'bg_hochzeit',
  width: 1220,
  perspective: persp2(340, 185, 462, 225),
  walk: [{ outer: [60, 466, 1180, 466, 1180, 432, 960, 402, 820, 372, 700, 334, 600, 322, 520, 342, 400, 372, 250, 384, 60, 402] }],
  entries: { start: { x: 160, y: 440, face: 1 } },
  assets: ['atlas/hauptmann_hz', 'atlas/infanterie', 'atlas/gaeste_hz', 'prop_field_flask'],
  layers: [{ id: 'flasche', image: 'prop_field_flask', x: 0, y: 0, rect: [247, 231, 29, 49] as Rect4, depth: 330, visible: not('flasche') }],
  decor: [
    { id: 's1', character: 'infanterie', anim: 'stand', x: 332, y: 398, facing: 1 },
    { id: 's2', character: 'infanterie', anim: 'look', x: 384, y: 390, facing: 1, phase: 0.3 },
  ],
  hotspots: [
    { id: 'dorf', name: T.kamm.dorf.name, shape: R(700, 130, 520, 175), walkTo: null, priority: 1, on: { look: lookVillage } },
    {
      id: 'wagen',
      name: T.kamm.wagen.name,
      shape: R(0, 150, 245, 200),
      walkTo: null,
      priority: 0,
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('flasche')) ? T.kamm.wagen.lookAfter : T.kamm.wagen.look) },
    },
    {
      id: 'flasche',
      name: T.kamm.flasche.name,
      shape: R(242, 226, 40, 58),
      visible: not('flasche'),
      walkTo: { x: 262, y: 404, face: -1 },
      priority: 3,
      verbs: ['look', 'take'],
      on: { look: T.kamm.wagen.look, take: takeFlask },
    },
    { id: 'kompanie', name: T.names.kompanie, decor: 's1', walkTo: null, priority: 2, verbs: ['look', 'talk'], on: { look: T.kamm.kompanie.look, talk: T.kamm.kompanie.talk } },
    { id: 'kompanie2', name: T.names.kompanie, decor: 's2', walkTo: null, priority: 2, verbs: ['look', 'talk'], on: { look: T.kamm.kompanie.look, talk: T.kamm.kompanie.talk } },
    { id: 'fluss', name: T.kamm.fluss.name, shape: R(420, 140, 280, 80), walkTo: null, priority: 0, on: { look: T.kamm.fluss.look } },
    { id: 'kamm', name: T.kamm.kamm.name, shape: R(420, 60, 800, 70), walkTo: null, priority: -1, on: { look: T.kamm.kamm.look } },
    {
      id: 'weg',
      name: T.kamm.weg.name,
      shape: R(560, 300, 180, 50),
      walkTo: { x: 640, y: 332, face: 1 },
      priority: 2,
      verbs: ['look', 'go'],
      on: { look: T.kamm.weg.look, go: down },
    },
  ],
};

// =========================================================================================== Die Gasse

const OLD_X = 405;
const OLD_Y = 372;
const MARCH: [number, number][] = [
  [-60, 446],
  [1380, 446],
];
const RUN: [number, number][] = [
  [-80, 414],
  [700, 414],
];

function soldier(i: number) {
  return { id: `m${i}`, character: 'infanterie', anim: 'walk', x: 0, y: 446, motion: { path: MARCH, speed: 46, period: 9, offset: -i * 2.25, fade: 50 } };
}

function* greet(c: ScriptCtx): Script {
  if (c.is(f('gruss'))) {
    yield say(PC, T.gasse.alter.lookDone);
    return;
  }
  yield walk(PC, OLD_X - 72, OLD_Y + 8, { face: 1 });
  yield fade(0.35, 0.25);
  c.set(f('toasting'));
  c.place(PC, { hidden: true });
  c.place(TOAST, { hidden: false, x: OLD_X - 36, y: OLD_Y + 4 });
  yield fade(0, 0.25);
  yield pose(TOAST, 'toast', { rest: true, wait: false });
  for (const t of T.gasse.alter.toast) {
    yield narrate(t);
    yield wait(0.3);
  }
  yield pose(TOAST, 'after', { loop: true });
  yield fade(0.35, 0.25);
  c.set(f('gruss'));
  c.unset(f('toasting'));
  c.place(TOAST, { hidden: true });
  c.place(PC, { hidden: false, x: OLD_X - 72, y: OLD_Y + 8, facing: 1 });
  yield fade(0, 0.25);
  yield say(PC, T.gasse.alter.after);
  c.journal('gruss', 'done');
  yield checkpoint();
}

function* laneEnd(c: ScriptCtx): Script {
  if (!c.is(f('gruss'))) {
    yield* lines(PC, T.gasse.ende.notYet);
    return;
  }
  yield fade(1, 1.2);
  for (const t of T.gasse.ende.out) yield narrate(t);
  yield endChapter();
}

const gasse: RoomDef = {
  id: 'hz_gasse',
  title: T.rooms.gasse,
  bg: 'bg_dorfgasse',
  width: 1320,
  perspective: persp2(380, 135, 462, 180),
  walk: [{ outer: [60, 466, 1290, 466, 1290, 404, 1040, 386, 860, 362, 700, 352, 560, 356, 430, 368, 300, 376, 60, 396] }],
  entries: { start: { x: 110, y: 440, face: 1 } },
  speakers: { [TOAST]: { x: OLD_X - 36, y: 230 } },
  assets: ['atlas/infanterie', 'atlas/kinder_hz', 'atlas/toast_hz', 'prop_oldman_up', 'prop_oldman_down', 'prop_window_cloth'],
  layers: [
    { id: 'alter', image: (s) => (fl(s, 'gruss') ? 'prop_oldman_down' : 'prop_oldman_up'), x: 0, y: 0, rect: [OLD_X - 40, OLD_Y - 128, 80, 128] as Rect4, depth: OLD_Y, visible: not('toasting') },
    { id: 'fenster', image: 'prop_window_cloth', x: 0, y: 0, rect: [466, 146, 38, 46] as Rect4, depth: 'back' },
  ],
  decor: [
    soldier(0),
    soldier(1),
    soldier(2),
    soldier(3),
    { id: 'kinder', character: 'kinder_hz', anim: 'walk', x: 0, y: 414, relHeight: 1, motion: { path: RUN, speed: 70, period: 18, offset: 3, fade: 40 } },
  ],
  hotspots: [
    {
      id: 'alter',
      name: T.names.alter,
      shape: R(OLD_X - 40, OLD_Y - 128, 80, 128),
      visible: not('toasting'),
      walkTo: { x: OLD_X - 72, y: OLD_Y + 8, face: 1 },
      priority: 3,
      verbs: ['look', 'talk', 'take'],
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('gruss')) ? T.gasse.alter.lookDone : T.gasse.alter.look),
        talk: T.gasse.alter.talk,
        take: T.gasse.alter.take,
        use: (c: ScriptCtx) => lines(PC, c.is(f('gruss')) ? T.gasse.alter.lookDone : T.gasse.alter.empty),
      },
      items: { feldflasche: greet },
    },
    { id: 'fenster', name: T.gasse.fenster.name, shape: R(460, 140, 50, 56), walkTo: null, priority: 2, on: { look: T.gasse.fenster.look } },
    { id: 'kinder', name: T.gasse.kinder.name, decor: 'kinder', walkTo: null, priority: 2, on: { look: T.gasse.kinder.look } },
    { id: 'soldaten', name: T.gasse.soldaten.name, decor: 'm0', walkTo: null, priority: 1, on: { look: T.gasse.soldaten.look } },
    { id: 'tuecher', name: T.gasse.tuecher.name, shape: R(50, 40, 380, 150), walkTo: null, priority: 0, on: { look: T.gasse.tuecher.look } },
    {
      id: 'ende',
      name: T.gasse.ende.name,
      shape: R(1230, 360, 90, 110),
      walkTo: { x: 1270, y: 440, face: 1 },
      priority: 2,
      verbs: ['look', 'go'],
      on: { look: T.gasse.ende.look, go: laneEnd },
    },
  ],
  onEnter: function* (c: ScriptCtx): Script {
    if (c.is(f('inLane'))) return;
    c.set(f('inLane'));
    yield narrate(T.gasse.enter);
    yield checkpoint();
  },
};

// ======================================================================================== the chapter

export const hochzeitChapter: ChapterDef = {
  id: 'hochzeit',
  title: T.title,
  dateline: T.dateline,
  card: { image: 'intro_hochzeit', cine: 'cine_hochzeit_a', lines: T.card },
  pc: { character: 'mijo1878', name: T.names.mijo, color: C.pc },
  start: { room: 'hz_kamm', entry: 'start' },
  next: null,
  journal: T.journal,
  items: [{ id: 'feldflasche', name: T.items.flasche.name, icon: 'feldflasche', look: T.items.flasche.look }],
  actors: [
    {
      id: HM,
      name: T.names.hauptmann,
      character: 'hauptmann_hz',
      color: C.hm,
      start: { room: 'hz_kamm', x: 500, y: 424, facing: 1, pose: 'stand' },
      talkOffset: 96,
      verbs: ['look', 'talk'],
      on: { look: T.kamm.hauptmann.look, talk: (c: ScriptCtx) => c.dialogue('hz_hm') },
      items: { feldflasche: (c: ScriptCtx) => (fl(c.s, 'plan') && !fl(c.s, 'befehl') ? order(c) : lines(PC, T.kamm.hauptmann.flascheFrueh)) },
    },
    { id: TOAST, name: T.names.alter, character: 'toast_hz', color: '#e6d6b8', start: { room: 'hz_gasse', x: OLD_X - 36, y: OLD_Y + 4, facing: 1, pose: 'stand', hidden: true }, verbs: [] },
  ],
  dialogues: [
    {
      id: 'hz_hm',
      actor: HM,
      open: function* (c: ScriptCtx): Script {
        if (!c.is(f('met'))) {
          c.set(f('met'));
          for (const [, t] of T.kamm.hauptmann.first) yield say(HM, t);
          c.journal('befehl');
          return;
        }
        yield say(HM, c.is(f('befehl')) ? T.kamm.hauptmann.openDone : T.kamm.hauptmann.open);
      },
      bye: T.kamm.hauptmann.bye,
      options: [
        {
          id: 'glas',
          text: T.kamm.hauptmann.glas,
          when: not('glas'),
          run: function* (c: ScriptCtx): Script {
            yield pose(HM, 'gesture', { loop: true });
            yield say(HM, T.kamm.hauptmann.glasA);
            yield narrate(T.kamm.hauptmann.glasN);
            yield pose(HM, 'stand', { loop: true });
            c.set(f('glas'));
          },
        },
        { id: 'keiner', text: T.kamm.hauptmann.keiner, when: (s) => !fl(s, 'plan'), repeat: true, exit: true, run: argue },
        { id: 'habe', text: T.kamm.hauptmann.habe, when: (s) => fl(s, 'plan') && !fl(s, 'befehl') && has(s, 'feldflasche'), exit: true, run: order },
      ],
    },
  ],
  hint: (s) => {
    if (s.room === 'hz_gasse') return fl(s, 'gruss') ? { id: 'hz.ende', steps: T.hints.ende } : { id: 'hz.gruss', steps: T.hints.gruss };
    if (fl(s, 'befehl')) return { id: 'hz.weg', steps: T.hints.weg };
    if (!fl(s, 'met')) return { id: 'hz.hauptmann', steps: T.hints.hauptmann };
    if (!fl(s, 'hochzeit')) return { id: 'hz.hochzeit', steps: T.hints.hochzeit };
    if (!fl(s, 'gaeste')) return { id: 'hz.gaeste', steps: T.hints.gaeste };
    if (!fl(s, 'plan')) return { id: 'hz.reden', steps: T.hints.reden };
    return { id: 'hz.flasche', steps: T.hints.flasche };
  },
  setup: (c: ScriptCtx) => {
    c.place(PC, { character: 'mijo1878', pose: 'stand', gait: 'walk' });
  },
  intro: function* (c: ScriptCtx): Script {
    yield narrate(T.intro.n1);
    yield say(PC, T.intro.a);
    c.journal('befehl');
  },
  rooms: [kamm, gasse],
};
