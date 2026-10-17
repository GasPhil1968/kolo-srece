// Kapitel 7 – Ancona. May 1507. Alessandro sends Mijo with a hundred ducats to a Greek who waits at the
// harbour "where it is light". The harbour: six warehouses, five locked and dark; pigeons rise from the
// open roof of the last one, and in front of it Mijo feels the pull he knows from Alessandro. Inside:
// Nikephoros, the old Byzantine. The talk ends before anyone draws ("Das Geld ist nicht der Preis").
// The fight is six readable decisions (two of them lessons Mijo already has: Alessandro's hip turn and
// the pasture's way of letting the bigger one roll); a wrong answer is shown, explained and the same
// moment comes again. Then the thumb nobody uses, the talk on the floor, the two blows, the head. The
// first Quickening: glow at the neck, the discharge into the sword hand, the roof breaking open, the
// pigeons leaving, the likeness crumbling over the body, the second discharge, darkness, exhaustion.
// Afterwards the gate is blocked (planks, then a roof beam; Mijo's arms will not obey yet): the hook on
// the rope, the rope over the hanging block, the sling round the beam, and a sack of salt that is
// heavier than he is at the free end. On the blade the dead man's letters, readable for one moment:
// his name, and a room in Rimini where Alessandro said "Kurz genug".
import type { ChapterDef, RoomDef, ScriptCtx } from '../../core/content';
import type { CombatDef } from '../../core/combat';
import type { InsertSpec, Script } from '../../core/cmd';
import { checkpoint, choice, combat, endChapter, fade, fx, insert, narrate, pose, room, say, shake, wait, waitActor, walk } from '../../core/cmd';
import type { GameState } from '../../core/state';
import { T } from '../text/de/c07_ancona';
import { flags, PC, persp2, R } from '../util';

const f = flags('an');
const PAIR = 'an_paar';
const NIK = 'an_nik';
const ALE = 'an_alessandro';
const C = { pc: '#e9d7b0', nik: '#d8c8b0', ale: '#e6bf86' };
type Rect4 = [number, number, number, number];
const fl = (s: GameState, n: string) => !!s.flags[f(n)];
const is = (n: string) => (s: GameState) => fl(s, n);
const not = (n: string) => (s: GameState) => !fl(s, n);
const all =
  (...c: ((s: GameState) => boolean)[]) =>
  (s: GameState) =>
    c.every((x) => x(s));

function* lines(actor: string, l: string | readonly string[]): Script {
  for (const t of typeof l === 'string' ? [l] : l) yield say(actor, t);
}

// =========================================================================================== harbour

const GATES: { rect: [number, number, number, number]; spot: { x: number; y: number } }[] = [
  { rect: [212, 242, 60, 95], spot: { x: 242, y: 410 } },
  { rect: [386, 248, 52, 80], spot: { x: 412, y: 410 } },
  { rect: [556, 255, 40, 62], spot: { x: 576, y: 424 } },
  { rect: [679, 262, 30, 52], spot: { x: 694, y: 424 } },
  { rect: [762, 262, 28, 46], spot: { x: 776, y: 424 } },
];
const GATE6_SPOT = { x: 860, y: 448, face: 1 as const };

/** Pigeons rising out of the open roof of the last warehouse and dropping back in. */
function pigeon(id: string, offset: number, path: [number, number][]) {
  return { id, character: 'bird', x: path[0][0], y: path[0][1], scale: 0.085, depth: -30000, motion: { path, speed: 34, period: 7.5, offset, fade: 8, anim: 'stand' } };
}

function* senseOnce(c: ScriptCtx): Script {
  if (c.is(f('sensed'))) return;
  c.set(f('sensed'));
  yield* lines(PC, T.hafen.sense);
}

function* enterWarehouse(c: ScriptCtx): Script {
  yield* senseOnce(c);
  yield say(PC, T.hafen.tor6.ajar);
  yield narrate(T.hafen.tor6.go);
  yield fade(1, 0.8);
  c.journal('speicher', 'done');
  c.journal('kampf');
  yield narrate(T.hafen.tor6.enter);
  yield room('an_lager', 'tor');
}

const hafen: RoomDef = {
  id: 'an_hafen',
  title: T.rooms.hafen,
  bg: 'bg_hafen',
  width: 1300,
  perspective: persp2(404, 162, 458, 186),
  walk: [{ outer: [70, 462, 882, 462, 944, 404, 880, 404, 880, 420, 500, 420, 500, 404, 70, 404] }],
  entries: { start: { x: 150, y: 452, face: 1 } },
  assets: ['atlas/bird'],
  decor: [
    pigeon('p1', 0, [[830, 168], [838, 140], [852, 112], [866, 104], [858, 128], [834, 166]]),
    pigeon('p2', 2.6, [[826, 170], [820, 138], [828, 108], [846, 100], [842, 132], [828, 168]]),
    pigeon('p3', 5.1, [[834, 168], [850, 132], [872, 118], [880, 130], [856, 150], [836, 168]]),
    {
      id: 'haendler',
      character: 'haendler',
      x: 300,
      y: 410,
      motion: {
        path: [
          [300, 410],
          [660, 412],
          [300, 410],
        ],
        speed: 30,
        period: 24,
      },
    },
  ],
  ambient: [{ fx: 'birds', x: 980, y: 40, params: { area: '960,30,320,90', count: 3, speed: 30, scale: 0.12 } }],
  hotspots: [
    { id: 'speicher', name: T.hafen.speicher.name, shape: R(0, 0, 870, 245), walkTo: null, on: { look: T.hafen.speicher.look } },
    ...GATES.map((g, i) => ({
      id: `tor${i + 1}`,
      name: T.hafen.tore[i].name,
      shape: R(...g.rect),
      walkTo: g.spot,
      priority: 2,
      verbs: ['look', 'use'],
      on: { look: T.hafen.tore[i].look, use: T.hafen.locked },
      items: { an_dukaten: T.hafen.dukatenTor },
    })),
    {
      id: 'tor6',
      name: T.hafen.tor6.name,
      shape: R(816, 262, 30, 48),
      walkTo: GATE6_SPOT,
      priority: 3,
      exit: { room: 'an_lager', entry: 'tor' },
      exitDir: 'up',
      verbs: ['look', 'go'],
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('pigeons')) || c.is(f('sensed')) ? T.hafen.tor6.lookKnown : T.hafen.tor6.look),
        go: enterWarehouse,
      },
      items: { an_dukaten: T.hafen.dukatenTor },
    },
    {
      id: 'tauben',
      name: T.hafen.tauben.name,
      shape: R(796, 92, 96, 82),
      walkTo: null,
      priority: 2,
      on: {
        look: function* (c: ScriptCtx): Script {
          c.set(f('pigeons'));
          yield* lines(PC, T.hafen.tauben.look);
        },
      },
    },
    { id: 'schiffe', name: T.hafen.schiffe.name, shape: R(920, 60, 380, 270), walkTo: null, on: { look: T.hafen.schiffe.look } },
    { id: 'wasser', name: T.hafen.wasser.name, shape: R(1040, 330, 260, 140), walkTo: null, priority: 1, on: { look: T.hafen.wasser.look } },
    { id: 'poller', name: T.hafen.poller.name, shape: R(738, 350, 90, 56), walkTo: { x: 782, y: 432, face: 1 as const }, priority: 1, on: { look: T.hafen.poller.look } },
    { id: 'kisten', name: T.hafen.kisten.name, shape: R(0, 300, 225, 90), walkTo: null, priority: 1, on: { look: T.hafen.kisten.look } },
    {
      id: 'haendler',
      name: T.hafen.haendler.name,
      decor: 'haendler',
      walkTo: null,
      priority: 4,
      verbs: ['look', 'talk'],
      on: { look: T.hafen.haendler.look, talk: T.hafen.haendler.talk },
    },
  ],
  rules: [
    {
      // In front of the last warehouse the pull starts (he knows it from four years with Alessandro).
      id: 'an.sense',
      when: (s) => s.room === 'an_hafen' && (s.actors[PC]?.x ?? 0) > 730 && !fl(s, 'sensed'),
      run: senseOnce,
    },
  ],
};

// ========================================================================================= warehouse

// The pair is painted with Mijo on the left and Nikephoros on the right, feet on one line.
const PAIR_X = 470;
const FLOOR_Y = 446;
/** Where the dead man's neck is once he lies (start of every discharge). */
const NECK = { x: 608, y: 398 };
/** Mijo's place for the Quickening (the turned-away frame of the pair). */
const QX = 345;
/** In front of the pile at the gate; at the door once it is free; by the blade. */
const GATE_SPOT = { x: 494, y: 352, face: -1 as const };
const DOOR_SPOT = { x: 412, y: 312, face: 1 as const };
const BLADE_SPOT = { x: 262, y: 452, face: 1 as const };

const THUMB: InsertSpec = { w: 480, h: 270, sprite: { character: 'thumb_an', anim: 'press', x: 240, y: 270, scale: 1.25 } };
const RIMINI: InsertSpec = { w: 450, h: 279, bg: 'mem_rimini', crop: [0, 0, 300, 186] };

const FLOOR = [20, 468, 1020, 468, 1020, 400, 940, 398, 860, 392, 820, 350, 760, 318];
const FLOOR_END = [200, 322, 150, 362, 132, 394, 20, 396];
const WALK_WHOLE = [{ outer: [...FLOOR, 300, 312, ...FLOOR_END] }];
/** Planks and beam before the gate (the cleared planks lie to its left). */
const WALK_BLOCKED = [{ outer: [...FLOOR, 482, 318, 482, 344, 258, 344, 258, 318, ...FLOOR_END] }];
/** Beam hoisted: a way up to the door between the planks and the sack at the post. */
const WALK_FREE = [{ outer: [...FLOOR, 446, 318, 446, 308, 380, 308, 380, 344, 258, 344, 258, 318, ...FLOOR_END] }];

const risen = is('risen');
const ruined = is('ruined');

// ------------------------------------------------------------------------------------ before the fight

function* prefight(c: ScriptCtx): Script {
  yield checkpoint('prefight');
  c.place(PC, { hidden: true, x: 369, y: FLOOR_Y, facing: 1 });
  c.place(PAIR, { hidden: false });
  yield pose(PAIR, 'stand', { loop: true });
  yield wait(0.8);
  yield pose(PAIR, 'mijoTalk', { loop: true });
  yield say(PC, T.vorher.m1);
  yield pose(PAIR, 'nikTalk', { loop: true });
  yield say(NIK, T.vorher.n1);
  yield pose(PAIR, 'belt', { loop: true });
  yield narrate(T.vorher.belt);
  yield pose(PAIR, 'nikTalk', { loop: true });
  yield say(NIK, T.vorher.n2);
  const age: string = yield choice([
    { id: 'true', text: T.vorher.ageTrue },
    { id: 'dodge', text: T.vorher.ageDodge },
  ]);
  yield pose(PAIR, 'mijoTalk', { loop: true });
  yield say(PC, age === 'true' ? T.vorher.ageTrue : T.vorher.ageDodge);
  yield pose(PAIR, 'nikTalk', { loop: true });
  yield say(NIK, age === 'true' ? T.vorher.ageTrueA : T.vorher.ageDodgeA);
  c.set(f('age'), age);
  // Questions in any order; the money ends the talk (and tells Mijo what he was sent as).
  const asked = new Set<string>();
  for (;;) {
    const opts = T.vorher.ask.filter((o) => !asked.has(o.id)).map((o) => ({ id: o.id, text: o.text }));
    const pick: string = yield choice(opts);
    asked.add(pick);
    yield pose(PAIR, 'mijoTalk', { loop: true });
    yield say(PC, T.vorher.ask.find((o) => o.id === pick)!.text);
    yield pose(PAIR, 'nikTalk', { loop: true });
    if (pick === 'meister') {
      c.set(f('askedMaster'));
      yield say(NIK, T.vorher.meisterA);
      continue;
    }
    if (pick === 'woher') {
      yield say(NIK, T.vorher.woherA);
      yield say(NIK, T.vorher.woherB);
      continue;
    }
    yield say(NIK, T.vorher.geldA);
    yield pose(PAIR, 'belt', { loop: true });
    yield narrate(T.vorher.geldN);
    break;
  }
  yield pose(PAIR, 'stand', { loop: true });
  yield narrate(T.vorher.end);
  yield* duel(c);
}

// ------------------------------------------------------------------------------------------ the fight

const steps = T.kampf;
export const anconaDuel: CombatDef = {
  id: 'an_duell',
  pc: PC,
  pair: PAIR,
  actions: (['hoch', 'tief', 'weg', 'hinein', 'kragen', 'gewicht', 'daumen', 'schwert'] as const).map((id) => ({ id, label: T.kampf.actions[id] })),
  intro: { pose: { pair: 'draw' }, text: T.kampf.draw, time: 2.4 },
  window: 5,
  lateText: T.kampf.late,
  wonText: T.kampf.won,
  steps: [
    {
      id: 'low',
      cue: { pair: 'lowCue' },
      cueText: steps.low.cue,
      actions: ['hoch', 'tief', 'weg', 'hinein'],
      answer: 'tief',
      success: { pair: 'lowGood' },
      successText: steps.low.good,
      fail: { pair: 'hurt' },
      failText: steps.low.fail,
      wrong: { hoch: steps.low.hoch, weg: steps.low.weg, hinein: steps.low.hinein },
    },
    {
      id: 'hip',
      cue: { pair: 'hipCue' },
      cueText: steps.hip.cue,
      actions: ['hoch', 'tief', 'weg', 'hinein'],
      answer: 'weg',
      success: { pair: 'hipGood' },
      successText: steps.hip.good,
      fail: { pair: 'hurt' },
      failText: steps.hip.fail,
      wrong: { hoch: steps.hip.hoch, tief: steps.hip.tief, hinein: steps.hip.hinein },
    },
    {
      id: 'turn',
      cue: { pair: 'turnCue' },
      cueText: steps.turn.cue,
      actions: ['hoch', 'tief', 'weg', 'hinein'],
      answer: 'hinein',
      success: { pair: 'turnGood' },
      successText: steps.turn.good,
      successTime: 3.4,
      fail: { pair: 'hurt' },
      failText: steps.turn.fail,
      wrong: { weg: steps.turn.weg, hoch: steps.turn.hoch, tief: steps.turn.tief },
      lesson: steps.turn.lesson,
    },
    {
      id: 'grip',
      cue: { pair: 'gripCue' },
      cueText: steps.grip.cue,
      actions: ['kragen', 'gewicht', 'daumen', 'schwert'],
      answer: 'kragen',
      success: { pair: 'gripGood' },
      successText: steps.grip.good,
      fail: { pair: 'gripFail' },
      failText: steps.grip.fail,
      wrong: { schwert: steps.grip.schwert, daumen: steps.grip.daumen, gewicht: steps.grip.gewicht },
    },
    {
      id: 'weight',
      cue: { pair: 'weightCue' },
      cueText: steps.weight.cue,
      actions: ['kragen', 'gewicht', 'daumen', 'schwert'],
      answer: 'gewicht',
      success: { pair: 'weightGood' },
      successText: steps.weight.good,
      successTime: 2.4,
      fail: { pair: 'weightFail' },
      failText: steps.weight.fail,
      wrong: { kragen: steps.weight.kragen, schwert: steps.weight.schwert, daumen: steps.weight.daumen },
      lesson: steps.weight.lesson,
    },
    {
      id: 'thumb',
      cue: { pair: 'thumbCue' },
      cueText: steps.thumb.cue,
      actions: ['kragen', 'gewicht', 'daumen', 'schwert'],
      answer: 'daumen',
      success: { pair: 'thumbGood' },
      successText: steps.thumb.good,
      successTime: 2.2,
      fail: { pair: 'thumbFail' },
      failText: steps.thumb.fail,
      wrong: { kragen: steps.thumb.kragen, gewicht: steps.thumb.gewicht, schwert: steps.thumb.schwert },
    },
  ],
};

function* duel(c: ScriptCtx): Script {
  yield checkpoint('duel');
  c.place(PC, { hidden: true });
  c.place(PAIR, { hidden: false });
  yield pose(PAIR, 'stand', { loop: true });
  yield combat(anconaDuel.id);
  yield* afterDuel(c);
}

// ----------------------------------------------------------------------------------- after the fight

function* afterDuel(c: ScriptCtx): Script {
  yield checkpoint('after');
  c.set(f('won'));
  c.place(PC, { hidden: true });
  c.place(PAIR, { hidden: false });
  yield pose(PAIR, 'thumbCue', { loop: true });
  yield insert(THUMB);
  yield wait(6.4);
  yield narrate(T.kampf.fair);
  yield insert(null);
  yield pose(PAIR, 'pin', { rest: true });
  yield wait(0.6);
  yield pose(PAIR, 'after', { loop: true });
  yield narrate(T.nachher.n1);
  yield say(PC, T.nachher.m1);
  yield say(NIK, T.nachher.f1);
  yield say(NIK, T.nachher.f2);
  yield pose(PAIR, 'takeSword', { rest: true });
  yield narrate(T.nachher.n2);
  yield say(NIK, T.nachher.f3);
  yield say(PC, T.nachher.m2);
  yield say(NIK, T.nachher.f4);
  yield pose(PAIR, 'kneels', { loop: true });
  // There is no other way out of this room. Lowering the sword only earns the rule.
  let lowered = false;
  for (;;) {
    const opts = [{ id: 'strike', text: T.nachher.strike }, ...(lowered ? [] : [{ id: 'lower', text: T.nachher.lower }])];
    const pick: string = yield choice(opts);
    if (pick === 'lower') {
      lowered = true;
      c.set(f('lowered'));
      yield say(NIK, T.nachher.lowerA);
      continue;
    }
    break;
  }
  yield pose(PAIR, 'blow1', { rest: true });
  yield narrate(T.nachher.blow1);
  yield narrate(T.nachher.blow1b);
  yield pose(PAIR, 'blow2', { rest: true });
  yield narrate(T.nachher.blow2);
  yield pose(PAIR, 'cut', { loop: true });
  yield fx('head', true, { kind: 'sprite', character: 'head_an', anim: 'roll', x: 560, y: 312, x2: 760, y2: FLOOR_Y, arc: 26, dur: 0.75, fall: 1, scale: 0.69, depth: 447 });
  yield wait(0.75);
  c.set(f('headDown'));
  yield fx('head', false);
  yield wait(0.5);
  yield pose(PAIR, 'fall', { rest: true });
  yield pose(PAIR, 'turnAway', { loop: true });
  yield narrate(T.nachher.still);
  yield* quickening(c);
}

// ---------------------------------------------------------------------------------- the Quickening

/** Everything the Quickening switches on, so that it can all be switched off again. */
const Q_FX = ['neck', 'salt', 'bolt1', 'flash1', 'bolt2', 'flash2', 'spirit', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'dust1', 'dust2', 'dust3', 'dust4', 'b1', 'b2', 'b3', 'b4'];

function* debrisFirst(): Script {
  // The roof gives: planks through both holes, the beam onto the gate, the pigeons out.
  const deb = (name: string, anim: string, x: number, y: number, x2: number, y2: number, o: { delay: number; spin: number; scale: number; dur: number }) =>
    fx(name, true, { kind: 'sprite', character: 'debris_an', anim, x, y, x2, y2, fall: 1, life: 2.6, fadeOut: 0.9, ...o });
  yield deb('d1', 'plank', 265, 30, 205, 420, { delay: 0.15, spin: 5, scale: 0.42, dur: 0.9 });
  yield deb('d2', 'board', 300, 42, 250, 436, { delay: 0.4, spin: -4, scale: 0.34, dur: 0.85 });
  yield deb('d3', 'plank2', 705, 75, 748, 350, { delay: 0.25, spin: 3, scale: 0.28, dur: 0.7 });
  yield deb('d4', 'hoop', 690, 80, 812, 372, { delay: 0.5, spin: 9, scale: 0.26, dur: 0.8 });
  const dust = (name: string, x: number, y: number, delay: number, scale: number) =>
    fx(name, true, { kind: 'sprite', character: 'debris_an', anim: 'dust', x, y, delay, scale, life: 2.4, fadeOut: 1.2, alpha: 0.8 });
  yield dust('dust1', 205, 420, 1.05, 0.55);
  yield dust('dust2', 412, 318, 0.1, 0.42);
  yield dust('dust3', 748, 352, 0.95, 0.32);
  const bird = (name: string, x: number, y: number, x2: number, y2: number, delay: number, facing: number) =>
    fx(name, true, { kind: 'sprite', character: 'bird', anim: 'stand', x, y, x2, y2, dur: 1.3, delay, facing, scale: 0.16, life: 1.3, fadeOut: 0.3, depth: 200 });
  yield bird('b1', 520, 170, 262, 12, 0.05, -1);
  yield bird('b2', 560, 150, 282, 0, 0.2, -1);
  yield bird('b3', 600, 190, 708, 62, 0.12, 1);
  yield bird('b4', 640, 160, 720, 58, 0.3, 1);
}

function* debrisSecond(): Script {
  yield fx('d5', true, { kind: 'sprite', character: 'debris_an', anim: 'board', x: 240, y: 25, x2: 150, y2: 440, delay: 0.1, spin: 6, scale: 0.38, dur: 0.9, fall: 1, life: 2.6, fadeOut: 0.9 });
  yield fx('d6', true, { kind: 'sprite', character: 'debris_an', anim: 'plank2', x: 712, y: 70, x2: 690, y2: 340, delay: 0.3, spin: -5, scale: 0.26, dur: 0.75, fall: 1, life: 2.6, fadeOut: 0.9 });
  yield fx('dust4', true, { kind: 'sprite', character: 'debris_an', anim: 'dust', x: 150, y: 440, delay: 1.0, scale: 0.55, life: 2.4, fadeOut: 1.2, alpha: 0.8 });
}

function* quickening(c: ScriptCtx): Script {
  // Cut from the turned-away pair figure to Mijo alone, the body on the salt, the head where it lies.
  yield fade(0.8, 0.35);
  c.place(PAIR, { hidden: true });
  c.set(f('body'));
  c.place(PC, { character: 'mijo_q', hidden: false, x: QX, y: FLOOR_Y, facing: 1, pose: 'stand', gait: 'walk' });
  yield fade(0, 0.35);
  yield* quickeningRun(c);
}

function* quickeningRun(c: ScriptCtx): Script {
  yield checkpoint('quickening');
  for (const n of Q_FX) yield fx(n, false);
  // Anticipation: light at the neck, the salt beginning to glitter, Mijo stiffening.
  yield fx('neck', true, { kind: 'glow', image: 'fx_neck', x: NECK.x, y: NECK.y, size: 72, grow: 2.0, hz: 3, alpha: 0.85, depth: 401 });
  yield fx('salt', true, { kind: 'sprite', character: 'debris_an', anim: 'salt', x: 600, y: 430, scale: 0.5, lit: 0, alpha: 0.75, depth: 402 });
  yield pose(PC, 'stiffen', { rest: true, wait: false });
  yield narrate(T.quickening.n1);
  yield waitActor(PC);
  // Impact: the first discharge into the sword hand; the roof breaks open.
  yield fx('bolt1', true, { kind: 'bolt', atlas: 'qbolt', anim: 'one', ax: NECK.x, ay: NECK.y, to: PC, n: 2 });
  yield fx('flash1', true, { kind: 'flash', dur: 0.5, alpha: 0.85 });
  yield shake(1.2, 7);
  c.set(f('ruined'));
  yield* debrisFirst();
  yield pose(PC, 'strike1', { rest: true });
  yield pose(PC, 'strike1Hold', { loop: true });
  yield wait(0.75);
  yield fx('bolt1', false);
  yield fx('flash1', false);
  // Loss of control.
  yield pose(PC, 'collapse', { rest: true });
  yield pose(PC, 'spasm', { loop: true });
  yield narrate(T.quickening.n2);
  yield fx('spirit', true, { kind: 'sprite', character: 'spirit_an', anim: 'crumble', x: 560, y: 440, scale: 0.89, lit: 0, alpha: 0.9, life: 3.4, fadeOut: 0.9, depth: 441 });
  yield wait(1.2);
  yield narrate(T.quickening.n3);
  // The second discharge.
  yield fx('bolt2', true, { kind: 'bolt', atlas: 'qbolt', anim: 'two', ax: NECK.x, ay: NECK.y, to: PC, n: 2 });
  yield fx('flash2', true, { kind: 'flash', dur: 0.6, alpha: 0.8 });
  yield shake(0.9, 5);
  yield* debrisSecond();
  yield pose(PC, 'strike2', { rest: true });
  yield pose(PC, 'strike2Hold', { loop: true });
  yield wait(0.9);
  for (const n of Q_FX) yield fx(n, false);
  yield narrate(T.nachher.drop);
  // Exhaustion.
  yield fade(0.9, 0.8);
  c.set(f('swordDown'));
  yield pose(PC, 'folded', { loop: true });
  yield wait(1.2);
  yield fade(0, 1.2);
  yield pose(PC, 'recover', { rest: true });
  yield pose(PC, 'breathe', { loop: true });
  yield wait(1.6);
  yield pose(PC, 'sitBack', { rest: true });
  yield pose(PC, 'kneelRest', { loop: true });
  yield say(PC, T.quickening.n4);
  yield fade(1, 0.9);
  c.place(PC, { character: 'mijo1507', pose: 'stand', x: BLADE_SPOT.x, y: BLADE_SPOT.y, facing: 1, hidden: false });
  c.place(NIK, { room: null });
  c.set(f('risen'));
  yield narrate(T.quickening.rise);
  yield fade(0, 0.9);
  c.journal('kampf', 'done');
  c.journal('tor');
  c.journal('klinge');
  yield checkpoint();
}

// ------------------------------------------------------------------------------------------ the gate

function* clearPlanks(c: ScriptCtx): Script {
  yield fade(0.7, 0.4);
  c.set(f('planksMoved'));
  yield wait(0.3);
  yield fade(0, 0.4);
  yield say(PC, T.lager.haufen.clear);
}

function* liftByHand(c: ScriptCtx): Script {
  c.set(f('triedLift'));
  yield shake(0.25, 2);
  yield say(PC, T.lager.balken.lift);
}

function* useBeam(c: ScriptCtx): Script {
  if (c.is(f('hooked'))) {
    yield say(PC, T.lager.balken.hooked);
    return;
  }
  if (!c.is(f('rigged'))) {
    yield* liftByHand(c);
    return;
  }
  c.set(f('hooked'));
  yield say(PC, T.lager.balken.hook);
}

function* rig(c: ScriptCtx): Script {
  if (c.is(f('rigged'))) {
    yield say(PC, T.lager.rolle.done);
    return;
  }
  c.drop('an_tau_haken');
  c.set(f('rigged'));
  yield say(PC, T.lager.rolle.throw);
}

function* pullRope(c: ScriptCtx): Script {
  if (!c.is(f('hooked'))) {
    yield say(PC, T.lager.zug.pullEarly);
    return;
  }
  c.set(f('triedPull'));
  yield say(PC, T.lager.zug.pull);
  yield shake(0.3, 3);
  yield say(PC, T.lager.zug.weak);
}

/** The sack at the free end: heavier than his arms, together they bring the beam up. */
function* hoist(c: ScriptCtx): Script {
  if (!c.is(f('hooked'))) {
    yield say(PC, T.lager.zug.sackEarly);
    return;
  }
  c.drop('an_salzsack');
  yield say(PC, T.lager.zug.sack);
  yield fade(0.85, 0.6);
  c.set(f('beamUp'));
  yield wait(0.5);
  yield fade(0, 0.6);
  yield say(PC, T.lager.zug.sackDone);
  c.journal('tor', 'done');
}

function* leave(c: ScriptCtx): Script {
  if (!c.is(f('beamUp'))) {
    yield say(PC, T.lager.tor.blocked);
    return;
  }
  if (!c.is(f('read'))) {
    yield say(PC, T.lager.tor.notYet);
    return;
  }
  yield walk(PC, DOOR_SPOT.x, DOOR_SPOT.y - 2, { face: 1 });
  yield fade(1, 1.1);
  yield narrate(T.lager.tor.out);
  yield endChapter();
}

// ----------------------------------------------------------------------------------------- the blade

function* readBlade(c: ScriptCtx): Script {
  if (c.is(f('read'))) {
    yield say(PC, T.lager.klinge.again);
    return;
  }
  yield narrate(T.lager.klinge.read);
  c.set(f('named'));
  yield say(PC, T.lager.klinge.name1);
  yield insert(RIMINI);
  yield narrate(T.lager.klinge.mem1);
  yield say(ALE, T.lager.klinge.memA1);
  yield say(NIK, T.lager.klinge.memB);
  yield say(ALE, T.lager.klinge.memA2);
  yield insert(null);
  yield narrate(T.lager.klinge.mem2);
  c.set(f('read'));
  c.journal('klinge', 'done');
}

function* takeBlade(c: ScriptCtx): Script {
  if (!c.is(f('read'))) {
    yield say(PC, T.lager.klinge.takeFirst);
    return;
  }
  c.set(f('swordTaken'));
  c.give('an_klinge');
  yield say(PC, T.lager.klinge.take);
}

const lager: RoomDef = {
  id: 'an_lager',
  title: T.rooms.lager,
  bg: (s) => (fl(s, 'ruined') ? 'bg_lagerhaus_zerstoert' : 'bg_lagerhaus'),
  width: 1040,
  perspective: persp2(302, 60, 450, 236),
  walk: (s) => (fl(s, 'beamUp') ? WALK_FREE : fl(s, 'ruined') ? WALK_BLOCKED : WALK_WHOLE),
  entries: { tor: { x: 369, y: FLOOR_Y, face: 1 } },
  speakers: {
    pc: { x: 381, y: 205 },
    [NIK]: (s) => (fl(s, 'won') ? { x: 556, y: 288 } : { x: 566, y: 205 }),
  },
  assets: [
    'bg_lagerhaus_zerstoert',
    'atlas/duel_an',
    'atlas/thumb_an',
    'atlas/head_an',
    'atlas/mijo_q',
    'atlas/spirit_an',
    'atlas/debris_an',
    'atlas/qbolt',
    'atlas/bird',
    'fx_neck',
    'mem_rimini',
    'prop_salz',
    'prop_remains_an',
    'prop_klinge',
    'prop_bretter_an',
    'prop_querbalken',
    'prop_rollblock',
    'prop_schlinge',
    'prop_seil_an',
    'prop_hakentau',
    'prop_balken_hoch',
    'prop_tau',
    'prop_haken',
    'prop_salzsack',
  ],
  layers: [
    { id: 'salz', image: 'prop_salz', x: 0, y: 0, rect: [420, 404, 330, 37] as Rect4, alpha: 0.75, depth: 380, visible: is('body') },
    { id: 'leiche', image: 'prop_remains_an', x: 0, y: 0, rect: [430.6, 381.2, 230.7, 65.0] as Rect4, depth: 400, visible: is('body') },
    { id: 'klinge', image: 'prop_klinge', x: 0, y: 0, rect: [318, 426, 112, 28] as Rect4, depth: 430, visible: all(is('swordDown'), not('swordTaken')) },
    // The gate after the roof came down.
    { id: 'rollblock', image: 'prop_rollblock', x: 0, y: 0, rect: [402.3, 110, 19.8, 42.35] as Rect4, depth: 302, visible: all(ruined, not('beamUp')) },
    { id: 'hakentau', image: 'prop_hakentau', x: 0, y: 0, rect: [399.3, 151, 15.6, 32] as Rect4, depth: 303, visible: all(is('rigged'), not('hooked')) },
    { id: 'bretterTor', image: 'prop_bretter_an', x: 0, y: 0, rect: [368.75, 243.75, 108.9, 68.75] as Rect4, depth: 312, visible: all(ruined, not('planksMoved')) },
    { id: 'bretterSeite', image: 'prop_bretter_an', x: 0, y: 0, rect: [262, 250, 108.9, 68.75] as Rect4, depth: 319, visible: is('planksMoved') },
    { id: 'balken', image: 'prop_querbalken', x: 0, y: 0, rect: [352.8, 304, 114.4, 28.05] as Rect4, depth: 332, visible: all(ruined, not('hooked')) },
    { id: 'seil', image: 'prop_seil_an', x: 0, y: 0, rect: [408.2, 150, 6.6, 118.8] as Rect4, depth: 320, visible: all(is('hooked'), not('beamUp')) },
    { id: 'schlinge', image: 'prop_schlinge', x: 0, y: 0, rect: [347.3, 260.25, 128.7, 75.9] as Rect4, depth: 336, visible: all(is('hooked'), not('beamUp')) },
    { id: 'hoch', image: 'prop_balken_hoch', x: 0, y: 0, rect: [347.3, 110, 128.7, 126.5] as Rect4, depth: 302, visible: is('beamUp') },
    { id: 'sackPfosten', image: 'prop_salzsack', x: 0, y: 0, rect: [452, 286, 20, 17.5] as Rect4, depth: 304, visible: is('beamUp') },
    // Thrown out of the pulley and off the rope when the roof came down; the sack was always there.
    { id: 'tau', image: 'prop_tau', x: 0, y: 0, rect: [150, 420, 70, 40] as Rect4, depth: 460, visible: all(ruined, not('tauTaken')) },
    { id: 'haken', image: 'prop_haken', x: 0, y: 0, rect: [820, 428, 30, 36] as Rect4, depth: 464, visible: all(ruined, not('hakenTaken')) },
    { id: 'salzsack', image: 'prop_salzsack', x: 0, y: 0, rect: [880, 384, 66, 66] as Rect4, depth: 450, visible: not('sackTaken') },
  ],
  decor: [{ id: 'kopf', character: 'head_an', anim: 'stand', x: 760, y: FLOOR_Y, visible: is('headDown') }],
  hotspots: [
    {
      id: 'tor',
      name: T.lager.tor.name,
      shape: R(378, 238, 66, 66),
      visible: risen,
      walkTo: (s) => (fl(s, 'beamUp') ? DOOR_SPOT : GATE_SPOT),
      priority: 1,
      exit: { room: 'an_hafen', entry: 'start' },
      exitDir: 'up',
      verbs: ['look', 'go'],
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('beamUp')) ? T.lager.tor.lookFree : T.lager.tor.look), go: leave },
    },
    {
      id: 'haufen',
      name: T.lager.haufen.name,
      shape: R(352, 244, 128, 90),
      visible: all(risen, not('planksMoved')),
      walkTo: GATE_SPOT,
      priority: 3,
      verbs: ['look', 'take', 'use'],
      on: { look: T.lager.haufen.look, take: clearPlanks, use: clearPlanks },
      anyItem: () => T.lager.haufen.look[1],
    },
    {
      id: 'balken',
      name: T.lager.balken.name,
      shape: R(348, 298, 124, 40),
      visible: all(risen, is('planksMoved'), not('beamUp')),
      walkTo: GATE_SPOT,
      priority: 4,
      verbs: ['look', 'use', 'take'],
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('hooked')) ? T.lager.balken.lookHooked : T.lager.balken.look),
        use: useBeam,
        take: (c: ScriptCtx) => (c.is(f('hooked')) ? lines(PC, T.lager.balken.hooked) : liftByHand(c)),
      },
      items: {
        an_tau_haken: T.lager.balken.hookFirst,
        an_tau: T.lager.balken.tauOnly,
        an_haken: T.lager.balken.hakenOnly,
        an_salzsack: hoist,
      },
    },
    {
      id: 'rolle',
      name: T.lager.rolle.name,
      shape: R(394, 104, 36, 84),
      visible: all(risen, not('beamUp')),
      walkTo: GATE_SPOT,
      priority: 3,
      verbs: (s) => (fl(s, 'rigged') ? ['look', 'pull'] : ['look']),
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('rigged')) ? T.lager.rolle.lookRigged : T.lager.rolle.look), pull: pullRope },
      items: { an_tau_haken: rig, an_tau: T.lager.rolle.tauOnly, an_haken: T.lager.rolle.hakenOnly, an_salzsack: hoist },
    },
    {
      id: 'haengt',
      name: T.lager.haengt.name,
      shape: R(347, 196, 129, 44),
      visible: all(risen, is('beamUp')),
      walkTo: null,
      priority: 3,
      on: { look: T.lager.haengt.look },
    },
    {
      id: 'bretter',
      name: T.lager.bretter.name,
      shape: R(262, 250, 109, 69),
      visible: all(risen, is('planksMoved')),
      walkTo: null,
      priority: 2,
      on: { look: T.lager.bretter.look },
    },
    {
      id: 'leiche',
      name: T.lager.leiche.name,
      shape: R(431, 378, 231, 68),
      visible: risen,
      walkTo: null,
      priority: 2,
      verbs: ['look'],
      on: { look: T.lager.leiche.look },
    },
    { id: 'kopf', name: T.lager.kopf.name, decor: 'kopf', visible: risen, walkTo: null, priority: 3, verbs: ['look'], on: { look: T.lager.kopf.look } },
    {
      id: 'klinge',
      name: (s) => (fl(s, 'read') ? T.items.klinge.nameRead : T.lager.klinge.name),
      shape: R(314, 420, 120, 38),
      visible: all(risen, not('swordTaken')),
      walkTo: BLADE_SPOT,
      priority: 5,
      verbs: ['look', 'read', 'take'],
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('read')) ? T.lager.klinge.lookRead : T.lager.klinge.look),
        read: readBlade,
        take: takeBlade,
      },
    },
    {
      id: 'tau',
      name: T.lager.tau.name,
      shape: R(146, 414, 78, 50),
      visible: all(risen, not('tauTaken')),
      walkTo: { x: 252, y: 448, face: -1 as const },
      priority: 4,
      verbs: ['look', 'take'],
      on: {
        look: T.lager.tau.look,
        take: function* (c: ScriptCtx): Script {
          c.set(f('tauTaken'));
          c.give('an_tau');
          yield say(PC, T.lager.tau.take);
        },
      },
    },
    {
      id: 'haken',
      name: T.lager.haken.name,
      shape: R(814, 422, 42, 46),
      visible: all(risen, not('hakenTaken')),
      walkTo: { x: 784, y: 458, face: 1 as const },
      priority: 4,
      verbs: ['look', 'take'],
      on: {
        look: T.lager.haken.look,
        take: function* (c: ScriptCtx): Script {
          c.set(f('hakenTaken'));
          c.give('an_haken');
          yield say(PC, T.lager.haken.take);
        },
      },
    },
    {
      id: 'salzsack',
      name: T.lager.salzsack.name,
      shape: R(876, 380, 74, 74),
      visible: all(risen, not('sackTaken')),
      walkTo: { x: 850, y: 452, face: 1 as const },
      priority: 4,
      verbs: ['look', 'take'],
      on: {
        look: T.lager.salzsack.look,
        take: function* (c: ScriptCtx): Script {
          c.set(f('sackTaken'));
          c.give('an_salzsack');
          yield say(PC, T.lager.salzsack.take);
        },
      },
    },
    { id: 'dach', name: T.lager.dach.name, shape: R(222, 0, 120, 66), visible: risen, walkTo: null, priority: 1, on: { look: T.lager.dach.look } },
    { id: 'dach2', name: T.lager.dach.name, shape: R(668, 52, 74, 44), visible: risen, walkTo: null, priority: 1, on: { look: T.lager.dach.look } },
  ],
  prepare: (c: ScriptCtx) => {
    if (!c.is(f('won'))) {
      c.place(PC, { hidden: true, x: 369, y: FLOOR_Y, facing: 1 });
      c.place(PAIR, { hidden: false, pose: 'stand' });
    }
  },
  onEnter: function* (c: ScriptCtx): Script {
    if (c.is(f('met'))) return;
    c.set(f('met'));
    yield* prefight(c);
  },
};

// ============================================================================================ chapter

export const anconaChapter: ChapterDef = {
  id: 'ancona',
  title: T.title,
  dateline: T.dateline,
  card: { image: 'intro_akt2', cine: 'cine_akt2_a', lines: T.card },
  pc: { character: 'mijo1507', name: T.names.mijo, color: C.pc },
  start: { room: 'an_hafen', entry: 'start' },
  next: 'herberge',
  journal: T.journal,
  items: [
    { id: 'an_dukaten', name: T.items.dukaten.name, icon: 'dukaten', look: T.items.dukaten.look },
    { id: 'an_zettel', name: T.items.zettel.name, icon: 'zettel', look: T.items.zettel.look },
    { id: 'an_tau', name: T.items.tau.name, icon: 'tau', look: T.items.tau.look, combine: { an_haken: combineRope } },
    { id: 'an_haken', name: T.items.haken.name, icon: 'haken', look: T.items.haken.look, combine: { an_tau: combineRope } },
    { id: 'an_tau_haken', name: T.items.tauHaken.name, icon: 'tau_haken', look: T.items.tauHaken.look },
    { id: 'an_salzsack', name: T.items.salzsack.name, icon: 'salzsack', look: T.items.salzsack.look },
    {
      id: 'an_klinge',
      name: (s) => (fl(s, 'read') ? T.items.klinge.nameRead : T.items.klinge.name),
      icon: 'klinge',
      look: (c: ScriptCtx) => lines(PC, c.is(f('read')) ? T.items.klinge.lookRead : T.items.klinge.look),
    },
  ],
  self: {
    name: T.names.mijo,
    visible: (s) => s.room === 'an_hafen' || fl(s, 'risen'),
    verbs: ['look'],
    on: { look: (c: ScriptCtx) => lines(PC, c.s.room === 'an_hafen' ? T.hafen.self : T.lager.self) },
  },
  actors: [
    {
      id: PAIR,
      name: T.names.paar,
      character: 'duel_an',
      color: C.nik,
      start: { room: 'an_lager', x: PAIR_X, y: FLOOR_Y, facing: 1, pose: 'stand' },
      verbs: [],
    },
    {
      id: NIK,
      name: (s) => (fl(s, 'named') ? T.names.nikephoros : T.names.fremder),
      character: 'spirit_an',
      color: C.nik,
      start: { room: 'an_lager', x: 566, y: FLOOR_Y, facing: -1, hidden: true },
      verbs: [],
    },
    { id: ALE, name: T.names.alessandro, character: 'alessandro', color: C.ale, start: { room: null, x: 0, y: 0, facing: 1, hidden: true }, verbs: [] },
  ],
  dialogues: [],
  hint: (s) => {
    if (s.room === 'an_hafen') return { id: 'an.speicher', steps: T.hints.speicher };
    if (!fl(s, 'risen')) return { id: 'an.kampf', steps: T.hints.kampf };
    if (!fl(s, 'planksMoved')) return { id: 'an.bretter', steps: T.hints.bretter };
    if (!fl(s, 'beamUp')) return { id: 'an.tor', steps: T.hints.tor };
    if (!fl(s, 'read')) return { id: 'an.klinge', steps: T.hints.klinge };
    return { id: 'an.raus', steps: T.hints.raus };
  },
  setup: (c: ScriptCtx) => {
    c.give('an_zettel');
    c.give('an_dukaten');
    c.place(PC, { character: 'mijo1507', pose: 'stand', gait: 'walk' });
  },
  intro: function* (c: ScriptCtx): Script {
    yield narrate(T.intro.n1);
    yield say(PC, T.intro.a);
    c.journal('speicher');
  },
  resumes: { prefight, duel, after: afterDuel, quickening: quickeningRun },
  rooms: [hafen, lager],
};

function* combineRope(c: ScriptCtx): Script {
  c.drop('an_tau');
  c.drop('an_haken');
  c.give('an_tau_haken');
  yield say(PC, T.items.combine);
}
