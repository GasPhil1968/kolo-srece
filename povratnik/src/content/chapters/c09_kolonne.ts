// Kapitel 9 – Die Kolonne. Von der Save nach Sarajevo, August 1878. Mijo is the interpreter of an
// occupation column. In the gorge he was shot through and lay seven minutes behind a dead horse; the
// wound has closed. A hole in the tunic and none in the man would give him away, so he makes himself a
// wounded man like eighteen others: the horse's blood on the coat, a dead soldier's field dressing,
// reddened, over the hole. At the head of the column a requisitioned carter's cart with a broken axle
// blocks the road; the captain shouts German at a man who understands only the tone. Mijo may not lift
// anything (he is wounded, on paper), so he works with words: the carter's real worry (who pays for horse
// and axle), a stamped receipt from the captain, a handspike from the dismantled gun. Then the report:
// only what a living man could have seen (the abatis burnt behind them, the crows back in the beeches).
// In the evening, in the tent, the interrogation: how to address the old farmer, what to translate into a
// record that keeps everything ("Quod non est in actis, non est in mundo"), and what makes a major stop.
import type { ChapterDef, RoomDef, ScriptCtx } from '../../core/content';
import type { Script } from '../../core/cmd';
import type { InsertSpec } from '../../core/cmd';
import { checkpoint, choice, endChapter, fade, insert, narrate, room, say, wait, walk } from '../../core/cmd';
import type { GameState } from '../../core/state';
import { T } from '../text/de/c09_kolonne';
import { flags, PC, persp2, R } from '../util';

const f = flags('ko');
const HM = 'ko_hm';
const FM = 'ko_fuhrmann';
const MAJOR = 'ko_major';
const BAUER = 'ko_bauer';
const SOLDAT = 'ko_soldat';
const C = { pc: '#d9cdb4', hm: '#b9c4d8', fm: '#e0d2a8', major: '#e3b08c', bauer: '#e8dcc2', soldat: '#c4c9d4' };
type Rect4 = [number, number, number, number];
const fl = (s: GameState, n: string) => !!s.flags[f(n)];
const is = (n: string) => (s: GameState) => fl(s, n);
const not = (n: string) => (s: GameState) => !fl(s, n);
const has = (s: GameState, item: string) => s.inventory.includes(item);

function* lines(actor: string, l: string | readonly string[]): Script {
  for (const t of typeof l === 'string' ? [l] : l) yield say(actor, t);
}

/** Lines of a scripted exchange: ['pc' | 'major' | 'n', text]. */
function* exchange(rows: readonly (readonly [string, string])[]): Script {
  for (const [who, t] of rows) {
    if (who === 'n') yield narrate(t);
    else yield say(who === 'pc' ? PC : MAJOR, t);
  }
}

// =========================================================================================== Die Enge

const HORSE: Rect4 = [378, 350, 246, 101];

function* lookSelf(c: ScriptCtx): Script {
  if (c.s.room !== 'ko_enge') {
    yield say(PC, T.self.later);
    return;
  }
  if (c.is(f('bandaged'))) {
    yield say(PC, T.self.bandaged);
    return;
  }
  if (c.is(f('bloody'))) {
    yield say(PC, T.self.bloody);
    return;
  }
  if (c.is(f('wound'))) {
    yield say(PC, T.self.woundAgain);
    return;
  }
  c.set(f('wound'));
  yield* lines(PC, T.self.wound);
  c.journal('tarnen');
}

function* smear(c: ScriptCtx): Script {
  if (!c.is(f('wound'))) {
    yield say(PC, T.self.beforeLook);
    return;
  }
  if (c.is(f('bloody'))) {
    yield say(PC, T.enge.pferd.enough);
    return;
  }
  yield walk(PC, 600, 458, { face: -1 });
  c.set(f('bloody'));
  yield* lines(PC, T.enge.pferd.smear);
  yield narrate(T.enge.pferd.smearN);
  yield checkpoint();
}

function* redden(c: ScriptCtx): Script {
  yield walk(PC, 600, 458, { face: -1 });
  c.drop('verband');
  c.give('verband_blutig');
  yield* lines(PC, T.enge.pferd.bandage);
}

function* takeDressing(c: ScriptCtx): Script {
  if (c.is(f('dressingTaken'))) {
    yield say(PC, T.enge.tornister.empty);
    return;
  }
  if (!c.is(f('wound'))) {
    yield say(PC, T.enge.tornister.noReason);
    return;
  }
  c.set(f('dressingTaken'));
  c.give('verband');
  yield* lines(PC, T.enge.tornister.take);
}

function* applyDressing(c: ScriptCtx): Script {
  if (!c.is(f('bloody'))) {
    yield say(PC, T.self.cleanCoat);
    return;
  }
  c.drop('verband_blutig');
  c.set(f('bandaged'));
  yield* lines(PC, T.self.apply);
  yield narrate(T.self.applyN);
  c.journal('tarnen', 'done');
  yield checkpoint();
}

function* forward(c: ScriptCtx): Script {
  if (!c.is(f('wound'))) {
    yield say(PC, T.enge.vorn.notLooked);
    return;
  }
  if (!c.is(f('bloody'))) {
    yield say(PC, T.enge.vorn.hole);
    return;
  }
  if (!c.is(f('bandaged'))) {
    yield say(PC, T.enge.vorn.noBandage);
    return;
  }
  yield fade(1, 0.8);
  for (const t of T.enge.vorn.out) yield narrate(t);
  yield room('ko_spitze', 'start');
}

const enge: RoomDef = {
  id: 'ko_enge',
  title: T.rooms.enge,
  bg: 'bg_enge',
  width: 1180,
  perspective: persp2(340, 130, 462, 192),
  walk: [
    {
      outer: [80, 466, 1110, 466, 1110, 430, 980, 404, 900, 394, 700, 383, 480, 384, 330, 394, 300, 436, 80, 450],
      holes: [
        [392, 456, 622, 456, 622, 428, 392, 428],
        [745, 459, 925, 459, 925, 428, 745, 428],
      ],
    },
  ],
  entries: { start: { x: 560, y: 420, face: 1 } },
  assets: ['prop_dead_horse', 'prop_fallen_soldier', 'prop_backpack', 'atlas/smoke_enge', 'prop_uniform_hole', 'prop_uniform_blood', 'prop_uniform_bandage'],
  layers: [
    { id: 'pferd', image: 'prop_dead_horse', x: 0, y: 0, rect: HORSE, depth: 452 },
    { id: 'soldat', image: 'prop_fallen_soldier', x: 0, y: 0, rect: [735, 365, 189, 90] as Rect4, depth: 455 },
    { id: 'tornister', image: 'prop_backpack', x: 0, y: 0, rect: [780, 394, 64, 46] as Rect4, depth: 456 },
  ],
  decor: [
    { id: 'rauch', character: 'smoke_enge', anim: 'stand', x: 702, y: 246, scale: 0.5, alpha: 0.7, depth: 246, visible: not('bandaged') },
    { id: 'rauch2', character: 'smoke_enge', anim: 'thin', x: 702, y: 246, scale: 0.45, alpha: 0.5, depth: 246, visible: is('bandaged') },
  ],
  hotspots: [
    {
      id: 'pferd',
      name: T.enge.pferd.name,
      shape: R(385, 352, 236, 98),
      walkTo: { x: 600, y: 458, face: -1 },
      priority: 2,
      verbs: ['look', 'use', 'take'],
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('bloody')) ? T.enge.pferd.lookAfter : T.enge.pferd.look),
        use: smear,
        take: T.enge.pferd.take,
      },
      items: { verband: redden, verband_blutig: T.enge.pferd.bandageDone },
    },
    {
      id: 'soldat',
      name: T.enge.soldat.name,
      shape: R(740, 368, 182, 86),
      walkTo: { x: 830, y: 462, face: -1 },
      priority: 2,
      verbs: ['look', 'talk', 'take'],
      on: { look: T.enge.soldat.look, talk: T.enge.soldat.talk, take: T.enge.soldat.take },
    },
    {
      id: 'tornister',
      name: T.enge.tornister.name,
      shape: R(778, 390, 70, 52),
      walkTo: { x: 812, y: 462, face: -1 },
      priority: 4,
      verbs: ['look', 'take'],
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('dressingTaken')) ? T.enge.tornister.lookEmpty : T.enge.tornister.look),
        take: takeDressing,
        use: takeDressing,
      },
    },
    {
      id: 'rauch',
      name: T.enge.rauch.name,
      shape: R(575, 130, 160, 125),
      walkTo: null,
      priority: 1,
      on: {
        look: function* (c: ScriptCtx): Script {
          c.set(f('sahRauch'));
          yield* lines(PC, c.is(f('bandaged')) ? T.enge.rauch.lookAfter : T.enge.rauch.look);
        },
      },
    },
    { id: 'hang', name: T.enge.hang.name, shape: R(760, 0, 420, 300), walkTo: null, priority: 0, on: { look: T.enge.hang.look } },
    { id: 'saettel', name: T.enge.saettel.name, shape: R(20, 315, 290, 125), walkTo: null, priority: 1, on: { look: T.enge.saettel.look } },
    { id: 'fels', name: T.enge.fels.name, shape: R(0, 0, 440, 300), walkTo: null, priority: -1, on: { look: T.enge.fels.look } },
    {
      id: 'vorn',
      name: T.enge.vorn.name,
      shape: R(1110, 300, 70, 170),
      walkTo: { x: 1092, y: 448, face: 1 },
      priority: 2,
      exit: { room: 'ko_spitze', entry: 'start' },
      exitDir: 'right',
      verbs: ['look', 'go'],
      on: { look: T.enge.vorn.look, go: forward },
    },
  ],
};

// ================================================================================ Die Spitze der Kolonne

const CART_BLOCK: Rect4 = [620, 127, 315, 218];
const CART_EMPTY: Rect4 = [620, 175, 315, 170];
const CART_ASIDE: Rect4 = [800, 178, 318, 173];

function* lookCart(c: ScriptCtx): Script {
  c.set(f('sahKarren'));
  if (c.is(f('lifted'))) yield say(PC, T.spitze.karren.lookDone);
  else if (c.is(f('unloaded'))) yield say(PC, T.spitze.karren.lookEmpty);
  else yield* lines(PC, T.spitze.karren.look);
  if (!c.is(f('lifted'))) c.journal('spitze', 'done');
}

function* unload(c: ScriptCtx): Script {
  c.drop('schein');
  yield say(FM, T.spitze.fuhrmann.giveA);
  yield fade(1, 0.6);
  c.set(f('unloaded'));
  yield narrate(T.spitze.fuhrmann.unloadN);
  yield fade(0, 0.6);
  c.journal('schein', 'done');
  c.journal('hebel');
  yield checkpoint();
}

function* lift(c: ScriptCtx): Script {
  c.drop('stange');
  yield fade(1, 0.6);
  c.set(f('lifted'));
  c.place(FM, { x: 760, y: 372, facing: -1 });
  for (const t of T.spitze.fuhrmann.liftN) yield narrate(t);
  yield fade(0, 0.6);
  yield say(FM, T.spitze.fuhrmann.liftA);
  c.journal('hebel', 'done');
  c.journal('melden');
  yield checkpoint();
}

function* giveReceipt(c: ScriptCtx): Script {
  yield say(PC, T.spitze.fuhrmann.give);
  yield* unload(c);
}

function* givePole(c: ScriptCtx): Script {
  if (!c.is(f('unloaded'))) {
    yield say(PC, T.spitze.fuhrmann.noSchein);
    return;
  }
  yield say(PC, T.spitze.fuhrmann.givePole);
  yield* lift(c);
}

/** The report: only what a living man could have seen from the road. */
function* report(c: ScriptCtx): Script {
  yield say(HM, T.spitze.hauptmann.hangQ);
  const o = T.spitze.hauptmann.hangOpts;
  const a: string = yield choice([
    { id: 'leer', text: o.leer },
    { id: 'elf', text: o.elf },
    { id: 'weiss', text: o.weiss },
  ]);
  if (a === 'elf') {
    yield say(PC, o.elf);
    yield say(HM, T.spitze.hauptmann.elfA);
    yield say(PC, T.spitze.hauptmann.elfM);
    return;
  }
  if (a === 'weiss') {
    yield say(PC, o.weiss);
    yield say(HM, T.spitze.hauptmann.weissA);
    return;
  }
  yield say(PC, o.leer);
  yield say(HM, T.spitze.hauptmann.woherQ);
  const w = T.spitze.hauptmann.woherOpts;
  const opts: { id: string; text: string }[] = [{ id: 'gesehen', text: w.gesehen }];
  if (c.is(f('sahRauch'))) opts.push({ id: 'rauch', text: w.rauch });
  if (c.is(f('sahKraehen'))) opts.push({ id: 'kraehen', text: w.kraehen });
  opts.push({ id: 'nichts', text: w.nichts });
  const b: string = yield choice(opts);
  yield say(PC, opts.find((x) => x.id === b)!.text);
  if (b === 'gesehen') {
    c.inc(f('suspicion'));
    yield say(HM, T.spitze.hauptmann.gesehenA);
    yield say(PC, T.spitze.hauptmann.gesehenM);
    yield narrate(T.spitze.hauptmann.gesehenN);
    return;
  }
  if (b === 'nichts') {
    yield say(HM, T.spitze.hauptmann.nichtsA);
    return;
  }
  c.set(f('reported'), b);
  yield say(HM, T.spitze.hauptmann.good);
  yield say(PC, T.spitze.hauptmann.goodM);
  yield narrate(T.spitze.hauptmann.goodN);
  yield say(HM, T.spitze.hauptmann.goodH);
  c.journal('melden', 'done');
  yield* evening(c);
}

function* evening(c: ScriptCtx): Script {
  yield fade(1, 1);
  for (const t of T.spitze.abend) yield narrate(t);
  yield room('ko_zelt', 'start');
}

function* spitzeEnter(c: ScriptCtx): Script {
  if (c.is(f('atHead'))) return;
  c.set(f('atHead'));
  yield narrate(T.spitze.enter);
  yield say(HM, T.spitze.shout);
  yield narrate(T.spitze.shoutN);
  yield say(PC, T.spitze.mijo);
  c.journal('spitze');
  yield checkpoint();
}

const spitze: RoomDef = {
  id: 'ko_spitze',
  title: T.rooms.spitze,
  bg: 'bg_kolonnespitze',
  width: 1220,
  perspective: persp2(250, 72, 460, 295),
  walk: [{ outer: [240, 468, 1100, 468, 1100, 452, 905, 444, 890, 382, 870, 352, 610, 348, 470, 355, 410, 372, 330, 420, 240, 440] }],
  entries: { start: { x: 290, y: 452, face: 1 } },
  assets: ['prop_karren_voll', 'prop_karren_leer', 'prop_karren_stein', 'prop_kisten_ko', 'prop_stange', 'prop_uniform_bandage', 'atlas/bird'],
  layers: [
    {
      id: 'karren',
      image: (s) => (fl(s, 'lifted') ? 'prop_karren_stein' : fl(s, 'unloaded') ? 'prop_karren_leer' : 'prop_karren_voll'),
      x: 0,
      y: 0,
      rect: CART_BLOCK,
      depth: 345,
      visible: not('unloaded'),
    },
    { id: 'karrenLeer', image: 'prop_karren_leer', x: 0, y: 0, rect: CART_EMPTY, depth: 345, visible: (s) => fl(s, 'unloaded') && !fl(s, 'lifted') },
    { id: 'karrenRand', image: 'prop_karren_stein', x: 0, y: 0, rect: CART_ASIDE, depth: 351, visible: is('lifted') },
    { id: 'kisten', image: 'prop_kisten_ko', x: 0, y: 0, rect: [462, 250, 84, 98] as Rect4, depth: 348, visible: is('unloaded') },
    { id: 'stange', image: 'prop_stange', x: 0, y: 0, rect: [330, 352, 250, 56] as Rect4, depth: 392, visible: (s) => !fl(s, 'poleTaken') },
  ],
  ambient: [{ fx: 'birds', x: 760, y: 10, params: { area: '760,10,440,110', count: 3, speed: 22, scale: 0.12 } }],
  hotspots: [],
  onEnter: spitzeEnter,
};

// The cart's hotspot follows its state (blocking, then at the roadside).
spitze.hotspots = [
  {
    id: 'karren',
    name: T.spitze.karren.name,
    shape: R(626, 132, 304, 210),
    visible: not('lifted'),
    walkTo: { x: 640, y: 372, face: 1 },
    priority: 1,
    verbs: ['look', 'use', 'take'],
    on: { look: lookCart, use: T.spitze.karren.lift, take: T.spitze.karren.lift },
    items: { stange: T.spitze.karren.pole },
  },
  { id: 'karrenRand', name: T.spitze.karren.name, shape: R(806, 182, 306, 166), visible: is('lifted'), walkTo: null, priority: 1, on: { look: lookCart } },
  { id: 'kisten', name: T.spitze.kisten.name, shape: R(462, 250, 84, 98), visible: is('unloaded'), walkTo: null, priority: 2, on: { look: T.spitze.kisten.look, take: T.spitze.karren.lift } },
  {
    id: 'stange',
    name: T.spitze.stange.name,
    shape: R(330, 352, 250, 56),
    visible: not('poleTaken'),
    walkTo: { x: 470, y: 420, face: -1 },
    priority: 3,
    verbs: ['look', 'take'],
    on: {
      look: T.spitze.stange.look,
      take: function* (c: ScriptCtx): Script {
        c.set(f('poleTaken'));
        c.give('stange');
        yield say(PC, T.spitze.stange.take);
      },
    },
  },
  { id: 'geschuetz', name: T.spitze.geschuetz.name, shape: R(300, 240, 330, 105), walkTo: null, priority: 0, on: { look: T.spitze.geschuetz.look } },
  {
    id: 'hang',
    name: T.spitze.hang.name,
    shape: R(700, 0, 520, 135),
    walkTo: null,
    priority: 0,
    on: {
      look: function* (c: ScriptCtx): Script {
        if (c.is(f('sahKraehen'))) {
          yield say(PC, T.spitze.hang.lookAgain);
          return;
        }
        c.set(f('sahKraehen'));
        yield* lines(PC, T.spitze.hang.look);
      },
    },
  },
  { id: 'planwagen', name: T.spitze.planwagen.name, shape: R(700, 135, 310, 135), visible: not('lifted'), walkTo: null, priority: -1, on: { look: T.spitze.planwagen.look } },
  { id: 'zelt', name: T.spitze.zelt.name, shape: R(0, 110, 250, 190), walkTo: null, priority: 0, on: { look: T.spitze.zelt.look } },
  { id: 'soldaten', name: T.spitze.soldaten.name, shape: R(210, 150, 360, 80), walkTo: null, priority: 0, on: { look: T.spitze.soldaten.look } },
  { id: 'munition', name: T.spitze.munition.name, shape: R(0, 290, 235, 135), walkTo: null, priority: 0, on: { look: T.spitze.munition.look } },
  {
    id: 'vorn',
    name: T.spitze.vorn.name,
    shape: R(1110, 380, 110, 90),
    walkTo: { x: 1090, y: 458, face: 1 },
    priority: 2,
    verbs: ['look', 'go'],
    on: { look: T.spitze.vorn.look, go: T.spitze.vorn.notYet },
  },
];

// ======================================================================================== Das Feldzelt

const HAND: InsertSpec = { w: 300, h: 400, bg: 'prop_hand_finger', crop: [0, 0, 112, 152] };

function* zeltEnter(c: ScriptCtx): Script {
  if (c.is(f('inTent'))) return;
  c.set(f('inTent'));
  yield narrate(T.zelt.enter);
  yield say(MAJOR, T.zelt.majorOpen);
  c.journal('verhoer');
  yield checkpoint();
}

function* lookHand(c: ScriptCtx): Script {
  if (c.is(f('sahHand'))) {
    yield say(PC, T.zelt.hand.lookAgain);
    return;
  }
  c.set(f('sahHand'));
  yield insert(HAND);
  yield* lines(PC, T.zelt.hand.look);
  yield insert(null);
}

function* lookRecord(c: ScriptCtx): Script {
  if (c.is(f('protocolCurse'))) {
    yield say(PC, T.zelt.protokoll.lookFluch);
    return;
  }
  if (c.is(f('sahProtokoll'))) {
    yield say(PC, T.zelt.protokoll.lookAgain);
    return;
  }
  c.set(f('sahProtokoll'));
  yield* lines(PC, T.zelt.protokoll.look);
}

function* leaveTent(c: ScriptCtx): Script {
  if (!c.is(f('stopped'))) {
    yield say(PC, T.zelt.ausgang.notYet);
    return;
  }
  yield fade(1, 1.2);
  c.journal('hinaus', 'done');
  for (const t of T.zelt.ausgang.out) yield narrate(t);
  yield endChapter();
}

const zelt: RoomDef = {
  id: 'ko_zelt',
  title: T.rooms.zelt,
  bg: 'bg_feldzelt',
  width: 980,
  perspective: persp2(400, 352, 460, 410),
  noWalk: true,
  walk: [{ outer: [200, 466, 320, 466, 320, 440, 200, 440] }],
  entries: { start: { x: 255, y: 456, face: 1 } },
  speakers: { [BAUER]: { x: 596, y: 150 } },
  assets: ['prop_bauer_seated', 'prop_hand_finger', 'prop_uniform_bandage'],
  layers: [{ id: 'bauer', image: 'prop_bauer_seated', x: 0, y: 0, rect: [470, 129, 252, 316] as Rect4, depth: 445 }],
  hotspots: [
    {
      id: 'bauer',
      name: T.names.bauer,
      shape: R(500, 135, 205, 305),
      walkTo: null,
      priority: 2,
      verbs: ['look', 'talk'],
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('stopped')) ? T.zelt.bauer.lookDone : c.is(f('asked')) ? T.zelt.bauer.lookAfter : T.zelt.bauer.look),
        talk: (c: ScriptCtx) => c.dialogue('ko_bauer'),
      },
    },
    { id: 'hand', name: T.zelt.hand.name, shape: R(606, 290, 52, 40), walkTo: null, priority: 5, verbs: ['look'], on: { look: lookHand } },
    {
      id: 'protokoll',
      name: T.zelt.protokoll.name,
      shape: R(0, 185, 250, 65),
      walkTo: null,
      priority: 2,
      verbs: ['look', 'take'],
      on: { look: lookRecord, take: T.zelt.protokoll.take },
    },
    { id: 'tisch', name: T.zelt.tisch.name, shape: R(0, 250, 310, 160), walkTo: null, priority: 1, on: { look: T.zelt.tisch.look } },
    { id: 'lampe', name: T.zelt.lampe.name, shape: R(378, 30, 66, 108), walkTo: null, priority: 2, on: { look: T.zelt.lampe.look } },
    { id: 'stuhl', name: T.zelt.stuhl.name, shape: R(705, 150, 70, 240), walkTo: null, priority: 1, on: { look: T.zelt.stuhl.look } },
    { id: 'schuessel', name: T.zelt.schuessel.name, shape: R(895, 225, 85, 60), walkTo: null, priority: 1, on: { look: T.zelt.schuessel.look } },
    {
      id: 'ausgang',
      name: T.zelt.ausgang.name,
      shape: R(372, 140, 132, 190),
      walkTo: null,
      priority: 1,
      verbs: ['look', 'go'],
      on: { look: T.zelt.ausgang.look, go: leaveTent },
    },
  ],
  onEnter: zeltEnter,
};

// ======================================================================================== the chapter

function* majorStops(c: ScriptCtx): Script {
  c.set(f('stopped'));
  yield* exchange(T.zelt.major.folgeLines);
  yield narrate(c.is(f('protocolCurse')) ? T.zelt.major.protokollFluch : T.zelt.major.protokollGut);
  c.journal('aufhoeren', 'done');
  c.journal('hinaus');
  yield checkpoint();
}

function* afterTranslation(c: ScriptCtx): Script {
  c.set(f('translated'));
  c.journal('uebersetzen', 'done');
  yield say(MAJOR, T.zelt.major.schlagt);
  yield narrate(T.zelt.major.schlagtN);
  c.journal('aufhoeren');
  yield checkpoint();
}

export const kolonneChapter: ChapterDef = {
  id: 'kolonne',
  title: T.title,
  dateline: T.dateline,
  card: { image: 'intro_kolonne', cine: 'cine_kolonne_a', lines: T.card },
  pc: {
    character: 'mijo1878',
    name: T.names.mijo,
    color: C.pc,
    attach: (s) => {
      const image = fl(s, 'bandaged') ? 'prop_uniform_bandage' : fl(s, 'bloody') ? 'prop_uniform_blood' : 'prop_uniform_hole';
      return { image, w: 0.09, h: 0.126 };
    },
  },
  start: { room: 'ko_enge', entry: 'start' },
  next: null,
  journal: T.journal,
  items: [
    { id: 'verband', name: T.items.verband.name, icon: 'verband', look: T.items.verband.look },
    { id: 'verband_blutig', name: T.items.verbandBlutig.name, icon: 'verband_blutig', look: T.items.verbandBlutig.look },
    { id: 'stange', name: T.items.stange.name, icon: 'stange', look: T.items.stange.look },
    { id: 'schein', name: T.items.schein.name, icon: 'zettel', look: T.items.schein.look },
  ],
  self: {
    name: T.self.name,
    visible: (s) => s.room !== 'ko_zelt',
    verbs: ['look'],
    on: { look: lookSelf },
    items: { verband: T.self.whiteBandage, verband_blutig: applyDressing },
  },
  actors: [
    {
      id: HM,
      name: T.names.hauptmann,
      character: 'hauptmann',
      color: C.hm,
      start: { room: 'ko_spitze', x: 520, y: 404, facing: 1 },
      talkOffset: 70,
      verbs: ['look', 'talk'],
      on: { look: T.spitze.hauptmann.look, talk: (c: ScriptCtx) => c.dialogue('ko_hm') },
    },
    {
      id: FM,
      name: T.names.fuhrmann,
      character: 'bauer',
      color: C.fm,
      start: { room: 'ko_spitze', x: 640, y: 372, facing: -1 },
      talkOffset: 70,
      verbs: ['look', 'talk'],
      on: { look: T.spitze.fuhrmann.look, talk: (c: ScriptCtx) => c.dialogue('ko_fm') },
      items: { schein: giveReceipt, stange: givePole },
    },
    {
      id: MAJOR,
      name: T.names.major,
      character: 'major',
      color: C.major,
      start: { room: 'ko_zelt', x: 840, y: 452, facing: -1 },
      verbs: ['look', 'talk'],
      on: { look: T.zelt.major.look, talk: (c: ScriptCtx) => c.dialogue('ko_major') },
    },
    { id: SOLDAT, name: T.names.soldat, character: 'soldat', color: C.soldat, start: { room: 'ko_zelt', x: 742, y: 404, facing: -1 }, verbs: ['look'], on: { look: T.zelt.soldat.look } },
    { id: BAUER, name: T.names.bauer, character: 'bauer', color: C.bauer, start: { room: 'ko_zelt', x: 596, y: 440, facing: -1, hidden: true }, verbs: [] },
  ],
  dialogues: [
    {
      id: 'ko_fm',
      actor: FM,
      open: function* (c: ScriptCtx): Script {
        if (!c.is(f('fmMet'))) {
          c.set(f('fmMet'));
          yield narrate(T.spitze.fuhrmann.first);
        }
        yield say(FM, c.is(f('lifted')) ? T.spitze.fuhrmann.openDone : T.spitze.fuhrmann.open);
      },
      bye: T.spitze.fuhrmann.byeSay,
      close: function* (): Script {
        yield say(FM, T.spitze.fuhrmann.bye);
      },
      options: [
        { id: 'order', text: T.spitze.fuhrmann.order, when: not('unloaded'), repeat: true, run: () => lines(FM, T.spitze.fuhrmann.orderA) },
        {
          id: 'ask',
          text: T.spitze.fuhrmann.ask,
          when: not('unloaded'),
          repeat: true,
          run: function* (c: ScriptCtx): Script {
            yield* lines(FM, T.spitze.fuhrmann.askA);
            if (!c.is(f('fmGrund'))) {
              c.set(f('fmGrund'));
              c.journal('schein');
            }
          },
        },
        { id: 'promise', text: T.spitze.fuhrmann.promise, when: (s) => fl(s, 'fmGrund') && !fl(s, 'unloaded') && !has(s, 'schein'), run: () => lines(FM, T.spitze.fuhrmann.promiseA) },
        { id: 'give', text: T.spitze.fuhrmann.give, when: (s) => has(s, 'schein'), exit: true, run: unload },
        { id: 'next', text: T.spitze.fuhrmann.next, when: (s) => fl(s, 'unloaded') && !fl(s, 'lifted'), repeat: true, run: () => lines(FM, T.spitze.fuhrmann.nextA) },
        { id: 'pole', text: T.spitze.fuhrmann.givePole, when: (s) => has(s, 'stange') && fl(s, 'unloaded'), exit: true, run: lift },
      ],
    },
    {
      id: 'ko_hm',
      actor: HM,
      open: function* (c: ScriptCtx): Script {
        if (!c.is(f('registered'))) {
          c.set(f('registered'));
          yield say(HM, T.spitze.hauptmann.first);
          yield say(PC, T.spitze.hauptmann.firstM);
          yield narrate(T.spitze.hauptmann.firstN);
          yield say(HM, T.spitze.hauptmann.firstH);
          yield narrate(T.spitze.hauptmann.firstN2);
          return;
        }
        yield say(HM, T.spitze.hauptmann.open);
      },
      bye: T.spitze.hauptmann.bye,
      options: [
        { id: 'warum', text: T.spitze.hauptmann.warum, repeat: true, run: () => lines(HM, T.spitze.hauptmann.warumA) },
        {
          id: 'schein',
          text: T.spitze.hauptmann.schein,
          when: (s) => fl(s, 'fmGrund') && !fl(s, 'unloaded') && !has(s, 'schein'),
          repeat: true,
          run: function* (c: ScriptCtx): Script {
            yield say(HM, T.spitze.hauptmann.scheinA);
            yield say(PC, T.spitze.hauptmann.scheinM);
            yield narrate(T.spitze.hauptmann.scheinN);
            yield say(HM, T.spitze.hauptmann.scheinH);
            c.give('schein');
          },
        },
        {
          id: 'melden',
          text: T.spitze.hauptmann.melden,
          when: not('reported'),
          repeat: true,
          exit: true,
          run: function* (c: ScriptCtx): Script {
            if (!c.is(f('lifted'))) {
              yield say(HM, T.spitze.hauptmann.meldenNotYet);
              return;
            }
            yield* report(c);
          },
        },
      ],
    },
    {
      id: 'ko_bauer',
      actor: BAUER,
      open: function* (c: ScriptCtx): Script {
        if (!c.is(f('asked'))) yield narrate(T.zelt.bauer.open);
      },
      bye: T.zelt.bauer.bye,
      options: [
        {
          id: 'hart',
          text: T.zelt.bauer.hart,
          when: not('asked'),
          repeat: true,
          run: function* (c: ScriptCtx): Script {
            const n = c.inc(f('fehlFrage'));
            for (const t of T.zelt.bauer.hartN) yield narrate(t);
            yield say(MAJOR, T.zelt.bauer.hartMajor);
            if (n >= 2) yield narrate(T.zelt.bauer.hartHint);
          },
        },
        {
          id: 'still',
          text: T.zelt.bauer.still,
          when: not('asked'),
          repeat: true,
          run: function* (c: ScriptCtx): Script {
            c.inc(f('fehlFrage'));
            yield narrate(T.zelt.bauer.stillN);
            yield say(MAJOR, T.zelt.bauer.stillMajor);
          },
        },
        {
          id: 'onkel',
          text: T.zelt.bauer.onkel,
          when: not('asked'),
          exit: true,
          run: function* (c: ScriptCtx): Script {
            for (const t of T.zelt.bauer.onkelN) yield narrate(t);
            yield* lines(BAUER, T.zelt.bauer.speech);
            yield narrate(T.zelt.bauer.speechN);
            c.set(f('asked'));
            c.journal('verhoer', 'done');
            c.journal('uebersetzen');
            yield checkpoint();
            yield say(MAJOR, T.zelt.bauer.majorNun);
            yield* c.dialogue('ko_major');
          },
        },
      ],
    },
    {
      id: 'ko_major',
      actor: MAJOR,
      open: function* (c: ScriptCtx): Script {
        if (!c.is(f('asked'))) {
          yield say(MAJOR, T.zelt.major.notYet);
        }
      },
      bye: (s) => (fl(s, 'stopped') ? T.zelt.major.done : T.zelt.major.bye),
      options: [
        {
          id: 'woertlich',
          text: T.zelt.major.woertlich,
          when: (s) => fl(s, 'asked') && !fl(s, 'translated'),
          repeat: true,
          run: function* (c: ScriptCtx): Script {
            yield* lines(PC, T.zelt.major.woertlichM);
            yield narrate(T.zelt.major.woertlichN);
            c.set(f('protocolCurse'));
            yield say(MAJOR, T.zelt.major.woertlichMajor);
            yield narrate(T.zelt.major.woertlichN2);
            yield* afterTranslation(c);
          },
        },
        {
          id: 'inhalt',
          text: T.zelt.major.inhalt,
          when: (s) => fl(s, 'asked') && !fl(s, 'translated'),
          repeat: true,
          run: function* (c: ScriptCtx): Script {
            yield* exchange(T.zelt.major.inhaltLines);
            yield* afterTranslation(c);
          },
        },
        {
          id: 'schweigen',
          text: T.zelt.major.schweigen,
          when: (s) => fl(s, 'asked') && !fl(s, 'translated'),
          repeat: true,
          run: function* (): Script {
            yield narrate(T.zelt.major.schweigenN);
            yield say(MAJOR, T.zelt.major.schweigenMajor);
          },
        },
        {
          id: 'mitleid',
          text: T.zelt.major.mitleid,
          when: (s) => fl(s, 'translated') && !fl(s, 'stopped'),
          repeat: true,
          run: function* (c: ScriptCtx): Script {
            const n = c.inc(f('fehlStop'));
            yield say(MAJOR, T.zelt.major.mitleidMajor);
            yield narrate(T.zelt.major.mitleidN);
            if (n >= 2) yield narrate(T.zelt.major.stopHint);
          },
        },
        {
          id: 'rang',
          text: T.zelt.major.rang,
          when: (s) => fl(s, 'translated') && !fl(s, 'stopped'),
          repeat: true,
          run: function* (c: ScriptCtx): Script {
            const n = c.inc(f('fehlStop'));
            yield say(MAJOR, T.zelt.major.rangMajor);
            yield narrate(T.zelt.major.rangN);
            if (n >= 2) yield narrate(T.zelt.major.stopHint);
          },
        },
        {
          id: 'hand',
          text: T.zelt.major.hand,
          when: (s) => fl(s, 'translated') && !fl(s, 'stopped') && fl(s, 'sahHand'),
          run: function* (c: ScriptCtx): Script {
            c.set(f('handArg'));
            yield* exchange(T.zelt.major.handLines);
          },
        },
        {
          id: 'folge',
          text: T.zelt.major.folge,
          when: (s) => fl(s, 'translated') && !fl(s, 'stopped'),
          exit: true,
          run: majorStops,
        },
      ],
    },
  ],
  hint: (s) => {
    if (s.room === 'ko_enge') {
      if (!fl(s, 'wound')) return { id: 'ko.wunde', steps: T.hints.wunde };
      if (!fl(s, 'bloody')) return { id: 'ko.blut', steps: T.hints.blut };
      if (!fl(s, 'bandaged')) {
        if (has(s, 'verband_blutig')) return { id: 'ko.anlegen', steps: T.hints.anlegen };
        if (has(s, 'verband')) return { id: 'ko.weiss', steps: T.hints.weiss };
        return { id: 'ko.verband', steps: T.hints.verband };
      }
      return { id: 'ko.vorn', steps: T.hints.vorn };
    }
    if (s.room === 'ko_spitze') {
      if (!fl(s, 'sahKarren') && !fl(s, 'unloaded')) return { id: 'ko.karren', steps: T.hints.karren };
      if (!fl(s, 'unloaded')) {
        if (has(s, 'schein')) return { id: 'ko.geben', steps: T.hints.geben };
        if (!fl(s, 'fmGrund')) return { id: 'ko.fuhrmann', steps: T.hints.fuhrmann };
        return { id: 'ko.schein', steps: T.hints.schein };
      }
      if (!fl(s, 'lifted')) return has(s, 'stange') ? { id: 'ko.stange', steps: T.hints.stange } : { id: 'ko.hebel', steps: T.hints.hebel };
      return { id: 'ko.melden', steps: T.hints.melden };
    }
    if (!fl(s, 'asked')) return { id: 'ko.onkel', steps: T.hints.onkel };
    if (!fl(s, 'translated')) return { id: 'ko.uebersetzen', steps: T.hints.uebersetzen };
    if (!fl(s, 'stopped')) return { id: 'ko.aufhoeren', steps: T.hints.aufhoeren };
    return { id: 'ko.hinaus', steps: T.hints.hinaus };
  },
  setup: (c: ScriptCtx) => {
    c.place(PC, { character: 'mijo1878', pose: 'stand', gait: 'walk' });
  },
  intro: function* (c: ScriptCtx): Script {
    yield narrate(T.intro.n1);
    yield narrate(T.intro.n2);
    yield wait(0.4);
    yield narrate(T.intro.n3);
    yield say(PC, T.intro.a);
    yield say(PC, T.intro.b);
    c.journal('tarnen');
  },
  rooms: [enge, spitze, zelt],
};
