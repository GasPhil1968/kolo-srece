// Kapitel 8 – Die Herberge. An der Straße nach Mailand, November 1512, Regen. Mijo stops for the rain
// and nothing else. At the plate the pull comes. Who: six carters who have played since yesterday, six
// dry coats on the rail over their table – and a seventh coat by the courtyard door, soaked to the
// collar, a puddle under it. Someone came in out of the rain just now, hung it there and went out again
// without it: so that Mijo would see it. Alessandro. In the yard the talk comes before the swords; the
// fight is the inverse of Ancona: everything Alessandro taught him, Alessandro expects (the counter
// never works), so Mijo only reads him and parries until he binds the blades, takes the collar with the
// free left hand and lets him come over the hip like the bucks on the pasture. "Wo hast du das
// gelernt." – "Zu Hause." He asks to die properly. The second Quickening comes out of the wet stones:
// blue arcs, the storm, the lanterns bursting, the rain driven sideways; then the kneeling on the sword.
import type { ChapterDef, RoomDef, ScriptCtx } from '../../core/content';
import type { CombatDef } from '../../core/combat';
import type { Script } from '../../core/cmd';
import { checkpoint, choice, combat, endChapter, face, fade, fx, narrate, pose, room, say, shake, vignette, wait, walk } from '../../core/cmd';
import type { GameState } from '../../core/state';
import { T } from '../text/de/c08_herberge';
import { flags, PC, persp2, R } from '../util';

const f = flags('hg');
const ALE = 'hg_ale';
const PAIR = 'hg_paar';
const C = { pc: '#e6d2ae', ale: '#e2b778' };
type Rect4 = [number, number, number, number];
const fl = (s: GameState, n: string) => !!s.flags[f(n)];
const is = (n: string) => (s: GameState) => fl(s, n);
const not = (n: string) => (s: GameState) => !fl(s, n);

function* lines(actor: string, l: string | readonly string[]): Script {
  for (const t of typeof l === 'string' ? [l] : l) yield say(actor, t);
}

// ======================================================================================= Gaststube

const TABLE_SPOT = { x: 770, y: 432, face: -1 as const };
const COAT_SPOT = { x: 838, y: 334, face: 1 as const };
const DOOR_SPOT = { x: 896, y: 322, face: 1 as const };

function carter(id: string, character: string, x: number, phase: number) {
  return { id, character, anim: 'play', x, y: 298, scale: 0.667, depth: 298, phase };
}

function* eat(c: ScriptCtx): Script {
  if (c.is(f('eaten'))) {
    yield say(PC, T.stube.teller.again);
    return;
  }
  yield say(PC, T.stube.teller.eat);
  yield vignette('cine_hof_b', { captions: T.stube.teller.vignette, t: 5, fps: 2 });
  c.set(f('eaten'));
  yield narrate(T.stube.teller.eatN);
  yield* lines(PC, T.stube.teller.sense);
  yield narrate(T.stube.teller.senseN);
  c.journal('essen', 'done');
  c.journal('wer');
}

function* lookCarters(c: ScriptCtx): Script {
  if (c.is(f('sahFuhrleute'))) {
    yield say(PC, T.stube.fuhrleute.lookKnown);
    return;
  }
  c.set(f('sahFuhrleute'));
  yield* lines(PC, T.stube.fuhrleute.look);
}

function* lookRail(c: ScriptCtx): Script {
  c.set(f('sahMaentel'));
  yield* lines(PC, T.stube.maentel.look);
}

function* lookWetCoat(c: ScriptCtx): Script {
  if (c.is(f('erkannt'))) {
    yield say(PC, T.stube.nass.lookKnown);
    return;
  }
  c.set(f('sahNass'));
  yield* lines(PC, T.stube.nass.look);
}

/** Six carters since yesterday, six dry coats; the wet seventh belongs to none of them. */
function* deduce(c: ScriptCtx): Script {
  c.set(f('erkannt'));
  yield say(PC, T.stube.schluss.a);
  yield say(PC, T.stube.schluss.b);
  yield say(PC, T.stube.schluss.c);
  yield narrate(T.stube.schluss.n);
  yield say(PC, T.stube.schluss.name);
  c.journal('wer', 'done');
  c.journal('hof');
}

function* toYard(c: ScriptCtx): Script {
  if (!c.is(f('eaten'))) {
    yield say(PC, T.stube.tuer.first);
    return;
  }
  if (!c.is(f('erkannt'))) {
    yield say(PC, T.stube.tuer.notYet);
    return;
  }
  yield narrate(T.stube.tuer.out);
  yield room('hg_hof', 'tuer');
}

const stube: RoomDef = {
  id: 'hg_stube',
  title: T.rooms.stube,
  bg: 'bg_gaststube',
  width: 1060,
  perspective: persp2(404, 186, 462, 220),
  walk: [{ outer: [70, 462, 1000, 462, 1000, 330, 930, 318, 806, 318, 796, 404, 360, 404, 360, 420, 170, 420, 170, 404, 70, 404] }],
  entries: { start: TABLE_SPOT },
  assets: ['prop_coats6', 'prop_coat_wet', 'prop_pfuetze', 'prop_watchers', 'prop_plate_full', 'prop_plate_empty', 'prop_cards', 'occ_stube_tisch', 'cine_hof_b'],
  layers: [
    { id: 'maentel', image: 'prop_coats6', x: 0, y: 0, rect: [410.5, 61, 273, 123.5] as Rect4, depth: 'back' },
    { id: 'nass', image: 'prop_coat_wet', x: 0, y: 0, rect: [818, 150, 40, 115] as Rect4, depth: 'back' },
    { id: 'karten', image: 'prop_cards', x: 0, y: 0, rect: [488, 262, 80, 20] as Rect4, depth: 299 },
    { id: 'teller', image: (s) => (fl(s, 'eaten') ? 'prop_plate_empty' : 'prop_plate_full'), x: 0, y: 0, rect: [716, 266, 52, 15] as Rect4, depth: 299 },
    { id: 'tisch', image: 'occ_stube_tisch', x: 0, y: 0, rect: [249, 278, 559, 90] as Rect4, depth: 366 },
    { id: 'zuschauer', image: 'prop_watchers', x: 0, y: 0, rect: [178, 222, 170, 190] as Rect4, depth: 412 },
  ],
  decor: [
    carter('c1', 'carter1', 392, 0),
    carter('c2', 'carter2', 482, 3.7),
    carter('c3', 'carter3', 572, 7.9),
    carter('c4', 'carter4', 662, 11.3),
    { id: 'feuer', character: 'flame', x: 188, y: 302, scale: 0.58, alpha: 0.9, depth: 302 },
    { id: 'dampf', character: 'steam', x: 742, y: 266, scale: 0.12, alpha: 0.5, depth: 300, visible: not('eaten') },
  ],
  ambient: [{ fx: 'ripples', x: 798, y: 302, params: { spots: '798,302,80,18', alpha: 0.9, hz: 0.5 } }],
  hotspots: [
    {
      id: 'teller',
      name: T.stube.teller.name,
      shape: R(708, 256, 66, 28),
      walkTo: TABLE_SPOT,
      priority: 4,
      verbs: ['look', 'use'],
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('eaten')) ? T.stube.teller.lookAfter : T.stube.teller.look), use: eat, take: eat },
    },
    { id: 'karten', name: T.stube.karten.name, shape: R(486, 258, 84, 26), walkTo: null, priority: 4, on: { look: T.stube.karten.look } },
    {
      id: 'fuhrleute',
      name: T.stube.fuhrleute.name,
      shape: R(340, 186, 370, 92),
      walkTo: null,
      priority: 3,
      verbs: ['look', 'talk'],
      on: { look: lookCarters, talk: T.stube.fuhrleute.talk },
    },
    { id: 'zuschauer', name: T.stube.zuschauer.name, shape: R(184, 226, 160, 186), walkTo: null, priority: 3, verbs: ['look', 'talk'], on: { look: T.stube.zuschauer.look, talk: T.stube.fuhrleute.talk } },
    { id: 'maentel', name: T.stube.maentel.name, shape: R(410, 61, 274, 124), walkTo: null, priority: 2, on: { look: lookRail } },
    {
      id: 'nass',
      name: T.stube.nass.name,
      shape: R(812, 146, 52, 124),
      walkTo: COAT_SPOT,
      priority: 3,
      verbs: ['look', 'take'],
      on: { look: lookWetCoat, take: T.stube.nass.take },
    },
    { id: 'feuer', name: T.stube.feuer.name, shape: R(130, 180, 165, 135), walkTo: null, priority: 1, on: { look: T.stube.feuer.look } },
    {
      id: 'tuer',
      name: T.stube.tuer.name,
      shape: R(862, 138, 72, 176),
      walkTo: DOOR_SPOT,
      priority: 2,
      exit: { room: 'hg_hof', entry: 'tuer' },
      exitDir: 'right',
      verbs: ['look', 'go'],
      on: { look: T.stube.tuer.look, go: toYard },
    },
    { id: 'gestell', name: T.stube.gestell.name, shape: R(935, 115, 120, 230), walkTo: null, priority: 1, on: { look: T.stube.gestell.look } },
    { id: 'fenster', name: T.stube.fenster.name, shape: R(606, 148, 90, 86), walkTo: null, priority: 1, on: { look: T.stube.fenster.look } },
    { id: 'truhe', name: T.stube.truhe.name, shape: R(0, 282, 92, 90), walkTo: null, priority: 1, on: { look: T.stube.truhe.look } },
    { id: 'wandteppich', name: T.stube.wandteppich.name, shape: R(372, 186, 124, 40), walkTo: null, priority: 1, on: { look: T.stube.wandteppich.look } },
  ],
  rules: [
    {
      id: 'hg.schluss',
      when: (s) => s.room === 'hg_stube' && fl(s, 'eaten') && fl(s, 'sahFuhrleute') && fl(s, 'sahNass') && !fl(s, 'erkannt'),
      run: deduce,
    },
  ],
};

// =============================================================================================== Hof

const FIGHT_Y = 452;
const MX = 430;
const AX = 650;

export const herbergeDuel: CombatDef = {
  id: 'hg_duell',
  pc: PC,
  opp: ALE,
  pair: PAIR,
  actions: (['hoch', 'tief', 'weg', 'kontern', 'binden', 'kragen', 'drehen'] as const).map((id) => ({ id, label: T.kampf.actions[id] })),
  intro: { pose: { pc: 'guard', opp: 'guard', pcX: MX, oppX: 600 }, text: T.kampf.draw, time: 2.2 },
  window: 5,
  lateText: T.kampf.late,
  wonText: T.kampf.won,
  steps: [
    {
      id: 'high',
      cue: { pc: 'guard', opp: 'highCue', pcX: MX, oppX: 600 },
      cueText: T.kampf.high.cue,
      actions: ['hoch', 'tief', 'weg', 'kontern'],
      answer: 'hoch',
      success: { pc: 'parryHigh', opp: 'highCue', oppX: 575 },
      successText: T.kampf.high.good,
      successTime: 2.4,
      fail: { pc: 'hurt', opp: 'highHit', oppX: 560 },
      failText: T.kampf.high.fail,
      wrong: { tief: T.kampf.high.tief, weg: T.kampf.high.weg, kontern: T.kampf.high.kontern },
    },
    {
      id: 'low',
      cue: { pc: 'guard', opp: 'lowCue', pcX: MX, oppX: 600 },
      cueText: T.kampf.low.cue,
      actions: ['hoch', 'tief', 'weg', 'kontern'],
      answer: 'tief',
      success: { pc: 'parryLow', opp: 'lowHit', oppX: 590 },
      successText: T.kampf.low.good,
      successTime: 2.4,
      fail: { pc: 'hurt', opp: 'lowHit', oppX: 586 },
      failText: T.kampf.low.fail,
      wrong: { hoch: T.kampf.low.hoch, weg: T.kampf.low.weg, kontern: T.kampf.low.kontern },
    },
    {
      id: 'body',
      cue: { pc: 'guard', opp: 'bodyCue', pcX: MX, oppX: 600 },
      cueText: T.kampf.body.cue,
      actions: ['hoch', 'tief', 'weg', 'kontern'],
      answer: 'weg',
      success: { pc: 'dodge', opp: 'bodyHit', pcX: MX - 24, oppX: 578 },
      successText: T.kampf.body.good,
      successTime: 2.4,
      fail: { pc: 'hurt', opp: 'bodyHit', oppX: 548 },
      failText: T.kampf.body.fail,
      wrong: { hoch: T.kampf.body.hoch, tief: T.kampf.body.tief, kontern: T.kampf.body.kontern },
    },
    {
      id: 'bind',
      cue: { pc: 'guard', opp: 'highCue', pcX: MX, oppX: 572 },
      cueText: T.kampf.bind.cue,
      actions: ['hoch', 'binden', 'weg', 'kontern'],
      answer: 'binden',
      success: { pair: 'bind' },
      successText: T.kampf.bind.good,
      fail: { pc: 'hurt', opp: 'highHit', oppX: 560 },
      failText: T.kampf.bind.fail,
      wrong: { hoch: T.kampf.bind.hoch, kontern: T.kampf.bind.kontern, weg: T.kampf.bind.weg },
      lesson: T.kampf.bind.lesson,
    },
    {
      id: 'collar',
      cue: { pair: 'bind' },
      cueText: T.kampf.collar.cue,
      actions: ['kragen', 'drehen', 'weg', 'kontern'],
      answer: 'kragen',
      success: { pair: 'grip' },
      successText: T.kampf.collar.good,
      fail: { pc: 'hurt', opp: 'retreat', oppX: 610 },
      failText: T.kampf.collar.fail,
      wrong: { drehen: T.kampf.collar.drehen, weg: T.kampf.collar.weg, kontern: T.kampf.collar.kontern },
    },
    {
      id: 'turn',
      cue: { pair: 'gripHeld' },
      cueText: T.kampf.turn.cue,
      actions: ['kragen', 'drehen', 'weg', 'kontern'],
      answer: 'drehen',
      success: { pair: 'throw' },
      successText: T.kampf.turn.good,
      successTime: 3.2,
      fail: { pair: 'bind' },
      failText: T.kampf.turn.fail,
      wrong: { kragen: T.kampf.turn.kragen, weg: T.kampf.turn.weg, kontern: T.kampf.turn.kontern },
      lesson: T.kampf.turn.lesson,
    },
  ],
};

function* yardEnter(c: ScriptCtx): Script {
  if (c.is(f('met'))) return;
  c.set(f('met'));
  yield narrate(T.hof.enter);
  yield walk(PC, MX, FIGHT_Y, { face: 1 });
  yield* prefight(c);
}

function* prefight(c: ScriptCtx): Script {
  yield checkpoint('prefight');
  c.place(PC, { character: 'mijo1512', pose: 'stand', x: MX, y: FIGHT_Y, facing: 1, hidden: false });
  c.place(ALE, { x: AX, y: FIGHT_Y, facing: -1, hidden: false, pose: 'wait' });
  yield say(ALE, T.hof.vorher.a1);
  yield say(PC, T.hof.vorher.p1);
  yield say(ALE, T.hof.vorher.a2);
  const opts = T.hof.vorher.ask.map((o) => ({ id: o.id, text: o.text }));
  const pick: string = yield choice(opts);
  c.set(f('ask'), pick);
  if (pick !== 'still') yield say(PC, opts.find((o) => o.id === pick)!.text);
  yield say(ALE, pick === 'rimini' ? T.hof.vorher.rimini : pick === 'warum' ? T.hof.vorher.warum : T.hof.vorher.still);
  yield say(PC, T.hof.vorher.p2);
  yield say(ALE, T.hof.vorher.a3);
  yield say(PC, T.hof.vorher.p3);
  yield say(ALE, T.hof.vorher.a4);
  yield* duel(c);
}

function* duel(c: ScriptCtx): Script {
  yield checkpoint('duel');
  c.place(ALE, { x: AX, y: FIGHT_Y, facing: -1, hidden: false, pose: 'wait' });
  // The combat sheets show him in waistcoat and shirt: the cloak goes over the stair rail first.
  yield fade(0.6, 0.3);
  c.set(f('cloakOff'));
  c.place(PC, { character: 'mijo_hof', pose: 'guard', x: MX, y: FIGHT_Y, facing: 1, hidden: false });
  yield fade(0, 0.3);
  yield narrate(T.hof.vorher.mantel);
  yield combat(herbergeDuel.id);
  yield* afterDuel(c);
}

function* afterDuel(c: ScriptCtx): Script {
  yield checkpoint('after');
  c.set(f('won'));
  c.place(PC, { hidden: true });
  c.place(ALE, { hidden: true });
  c.place(PAIR, { hidden: false });
  yield pose(PAIR, 'down', { loop: true });
  yield narrate(T.nachher.n1);
  yield say(ALE, T.nachher.a1);
  yield say(PC, T.nachher.m1);
  yield say(ALE, T.nachher.a2);
  yield say(PC, T.nachher.m2);
  yield narrate(T.nachher.n2);
  yield say(ALE, T.nachher.a3);
  yield pose(PAIR, 'up', { loop: true });
  yield wait(0.6);
  yield narrate(T.nachher.n3);
  c.set(f('kneeling'));
  yield pose(PAIR, 'kneel', { loop: true });
  yield say(ALE, T.nachher.a4);
  yield narrate(T.nachher.strike);
  yield pose(PAIR, 'raise', { loop: true });
  yield wait(0.6);
  yield pose(PAIR, 'blow1', { rest: true });
  yield pose(PAIR, 'blow2', { rest: true });
  yield pose(PAIR, 'fall', { rest: true });
  yield wait(0.8);
  yield narrate(T.nachher.still);
  yield* quickening(c);
}

// ------------------------------------------------------------------------------ the second Quickening

const Q_FX = ['arc1', 'arc2', 'storm', 'burst', 'flash1', 'flash2', 'lamp1', 'lamp2', 'lamp3', 'lamp4', 'd1', 'd2', 'd3', 'res'];
const LAMPS: [number, number][] = [
  [48, 232],
  [168, 238],
  [674, 245],
  [150, 124],
];

function* quickening(c: ScriptCtx): Script {
  yield fade(0.7, 0.3);
  c.place(PAIR, { hidden: true });
  c.set(f('body'));
  c.place(PC, { character: 'mijo_hofq', pose: 'stand', x: MX, y: FIGHT_Y, facing: 1, hidden: false });
  yield fade(0, 0.3);
  yield* quickeningRun(c);
}

function* quickeningRun(c: ScriptCtx): Script {
  yield checkpoint('quickening');
  for (const n of Q_FX) yield fx(n, false);
  c.unset(f('storm'));
  // Anticipation: the arcs come over the wet stones from the body; he looks up.
  yield fx('arc1', true, { kind: 'sprite', character: 'hof_fx', anim: 'travel', x: 600, y: 444, x2: 470, y2: 452, dur: 2.6, scale: 0.42, add: 1, lit: 0, alpha: 0.9, depth: 453 });
  yield pose(PC, 'look', { rest: true });
  yield narrate(T.quickening.n1);
  yield pose(PC, 'open', { rest: true });
  // Impact: the storm of arcs, the flash, the lanterns bursting, the rain driven sideways.
  c.set(f('storm'));
  yield fx('arc1', false);
  yield fx('storm', true, { kind: 'sprite', character: 'hof_storm', anim: 'grow', x: 465, y: FIGHT_Y + 2, scale: 1.6, add: 1, lit: 0, alpha: 0.5, depth: 451 });
  yield fx('flash1', true, { kind: 'flash', dur: 0.55, alpha: 0.8, color: 0xd8e4ff });
  yield fx('burst', true, { kind: 'sprite', character: 'hof_fx', anim: 'burst', x: MX, y: FIGHT_Y + 4, scale: 1.1, add: 1, lit: 0, alpha: 0.85, depth: 454 });
  yield shake(1.1, 6);
  yield pose(PC, 'arcs', { rest: true, wait: false });
  for (let i = 0; i < LAMPS.length; i++) {
    const [x, y] = LAMPS[i];
    yield fx(`lamp${i + 1}`, true, { kind: 'glow', image: 'fx_neck', x, y, size: 70, grow: 0.25 + i * 0.18, hz: 9, alpha: 0.95, life: 1.2 });
  }
  yield fx('d1', true, { kind: 'sprite', character: 'debris_an', anim: 'hoop', x: 250, y: 280, x2: 120, y2: 440, delay: 0.3, spin: 9, scale: 0.3, dur: 0.9, fall: 1, life: 2.6, fadeOut: 0.9 });
  yield fx('d2', true, { kind: 'sprite', character: 'debris_an', anim: 'board', x: 800, y: 300, x2: 900, y2: 452, delay: 0.5, spin: -5, scale: 0.34, dur: 0.85, fall: 1, life: 2.6, fadeOut: 0.9 });
  yield fx('d3', true, { kind: 'sprite', character: 'debris_an', anim: 'plank2', x: 760, y: 250, x2: 700, y2: 440, delay: 0.8, spin: 4, scale: 0.3, dur: 0.9, fall: 1, life: 2.6, fadeOut: 0.9 });
  yield wait(1.4);
  c.set(f('lampsOut'));
  for (let i = 0; i < LAMPS.length; i++) yield fx(`lamp${i + 1}`, false);
  yield narrate(T.quickening.n3);
  // Loss of control: engulfed, the storm at its height.
  yield fx('flash1', false);
  yield fx('burst', false);
  yield fx('storm', true, { kind: 'sprite', character: 'hof_storm', anim: 'peak', x: 465, y: FIGHT_Y + 2, scale: 1.6, add: 1, lit: 0, alpha: 0.5, depth: 451 });
  yield pose(PC, 'engulfed', { loop: true });
  yield fx('flash2', true, { kind: 'flash', dur: 0.45, alpha: 0.6, color: 0xd8e4ff });
  yield shake(0.8, 4);
  yield narrate(T.quickening.n2);
  yield wait(1.6);
  // It passes: the storm falls apart, he buckles.
  yield fx('flash2', false);
  yield fx('storm', true, { kind: 'sprite', character: 'hof_storm', anim: 'fade', x: 465, y: FIGHT_Y + 2, scale: 1.6, add: 1, lit: 0, alpha: 0.45, depth: 451, life: 1.6, fadeOut: 0.6 });
  yield pose(PC, 'buckle', { rest: true });
  yield fx('res', true, { kind: 'sprite', character: 'hof_fx', anim: 'residual', x: MX, y: FIGHT_Y + 2, scale: 0.6, add: 1, lit: 0, alpha: 0.8, depth: 454, life: 1.4, fadeOut: 0.8 });
  c.unset(f('storm'));
  // Exhaustion: on one knee, on the sword.
  yield pose(PC, 'kneel', { loop: true });
  for (const n of Q_FX) yield fx(n, false);
  yield narrate(T.quickening.n4);
  yield wait(1.4);
  yield pose(PC, 'rise', { rest: true });
  yield pose(PC, 'standDone', { loop: true });
  yield say(PC, T.quickening.m1);
  yield fade(1, 0.9);
  c.unset(f('cloakOff'));
  c.place(PC, { character: 'mijo1512', pose: 'stand', gait: 'walk', x: 330, y: 436, facing: 1, hidden: false });
  c.place(ALE, { room: null });
  c.set(f('risen'));
  yield narrate(T.quickening.rise);
  yield fade(0, 0.9);
  c.journal('hof', 'done');
  c.journal('tor');
  yield checkpoint();
}

function* leave(c: ScriptCtx): Script {
  if (!c.is(f('risen'))) {
    yield say(PC, T.hof.tor.notYet);
    return;
  }
  yield walk(PC, 540, 312, { face: 1 });
  yield fade(1, 1.2);
  c.journal('tor', 'done');
  yield narrate(T.hof.tor.out);
  yield endChapter();
}

const hof: RoomDef = {
  id: 'hg_hof',
  title: T.rooms.hof,
  bg: 'bg_hof',
  width: 1080,
  perspective: persp2(300, 65, 452, 190),
  actorTint: 0xd6d2dc,
  shade: (s) => (fl(s, 'lampsOut') ? 0.3 : 0),
  shadeColor: 0x05070f,
  walk: [{ outer: [100, 462, 980, 462, 980, 420, 770, 345, 640, 305, 450, 305, 395, 302, 250, 322, 120, 312, 60, 312, 60, 400, 100, 420] }],
  entries: { tuer: { x: 86, y: 316, face: 1 } },
  speakers: {
    pc: { x: MX, y: 262 },
    [ALE]: (s) => (fl(s, 'kneeling') ? { x: 600, y: 330 } : { x: 624, y: 392 }),
  },
  assets: ['atlas/mijo_hof', 'atlas/ale_hof', 'atlas/hof_paar', 'atlas/mijo_hofq', 'atlas/hof_fx', 'atlas/hof_storm', 'atlas/debris_an', 'fx_neck', 'fx_rain', 'prop_pfuetze', 'prop_hof_body'],
  layers: [{ id: 'leiche', image: 'prop_hof_body', x: 0, y: 0, rect: [455.4, 387.7, 196.3, 78.8] as Rect4, depth: 400, visible: is('body') }],
  ambient: [
    { fx: 'rain', x: 0, y: 0, visible: not('storm'), params: { area: '0,0,1080,470', alpha: 0.26 } },
    { fx: 'rain', x: 1, y: 0, visible: is('storm'), params: { area: '0,0,1080,470', alpha: 0.42, vx: -420, vy: 900 } },
    { fx: 'ripples', x: 17, y: 392, params: { spots: '17,392,192,28;481,406,175,18', alpha: 0.75, hz: 0.7 } },
  ],
  hotspots: [
    {
      id: 'tor',
      name: T.hof.tor.name,
      shape: R(448, 204, 182, 94),
      walkTo: (s) => (fl(s, 'risen') ? { x: 540, y: 312, face: 1 as const } : null),
      priority: 1,
      exit: { room: 'hg_stube', entry: 'start' },
      exitDir: 'up',
      verbs: ['look', 'go'],
      on: { look: T.hof.tor.look, go: leave },
    },
    {
      id: 'pferd',
      name: T.hof.pferd.name,
      shape: R(925, 226, 95, 60),
      walkTo: null,
      priority: 2,
      verbs: ['look', 'take'],
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('risen')) ? T.hof.pferd.lookAfter : T.hof.pferd.look), take: T.hof.pferd.take },
    },
    {
      id: 'fenster',
      name: T.hof.fenster.name,
      shape: R(700, 120, 70, 70),
      walkTo: null,
      priority: 1,
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('lampsOut')) ? T.hof.fenster.lookAfter : T.hof.fenster.look) },
    },
    {
      id: 'treppe',
      name: T.hof.treppe.name,
      shape: R(220, 150, 170, 145),
      walkTo: null,
      priority: 1,
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('cloakOff')) ? T.hof.treppe.look : T.hof.treppe.lookAfter) },
    },
    { id: 'leiche', name: T.hof.leiche.name, shape: R(456, 388, 196, 78), visible: is('risen'), walkTo: null, priority: 3, verbs: ['look'], on: { look: T.hof.leiche.look } },
  ],
  prepare: (c: ScriptCtx) => {
    if (!c.is(f('met'))) c.place(ALE, { x: AX, y: FIGHT_Y, facing: -1, hidden: false, pose: 'wait' });
  },
  onEnter: yardEnter,
};

// ============================================================================================ chapter

export const herbergeChapter: ChapterDef = {
  id: 'herberge',
  title: T.title,
  dateline: T.dateline,
  card: { image: 'intro_hof', cine: 'cine_hof_a', lines: T.card },
  pc: { character: 'mijo1512', name: T.names.mijo, color: C.pc },
  start: { room: 'hg_stube', entry: 'start' },
  next: null,
  journal: T.journal,
  items: [],
  self: {
    name: T.names.mijo,
    visible: (s) => s.room === 'hg_stube' || fl(s, 'risen'),
    verbs: ['look'],
    on: { look: (c: ScriptCtx) => lines(PC, c.s.room === 'hg_stube' ? T.stube.self.look : T.hof.self.look) },
  },
  actors: [
    {
      id: ALE,
      name: T.names.alessandro,
      character: 'ale_hof',
      color: C.ale,
      start: { room: 'hg_hof', x: AX, y: FIGHT_Y, facing: -1, pose: 'wait' },
      verbs: ['look'],
      on: { look: T.hof.alessandro.look },
    },
    { id: PAIR, name: T.names.alessandro, character: 'hof_paar', color: C.ale, start: { room: 'hg_hof', x: MX, y: FIGHT_Y, facing: 1, pose: 'bind', hidden: true }, verbs: [] },
  ],
  dialogues: [],
  hint: (s) => {
    if (s.room === 'hg_stube') {
      if (!fl(s, 'eaten')) return { id: 'hg.essen', steps: T.hints.essen };
      if (!fl(s, 'erkannt')) return { id: 'hg.wer', steps: T.hints.wer };
      return { id: 'hg.hof', steps: T.hints.hof };
    }
    if (!fl(s, 'risen')) return { id: 'hg.kampf', steps: T.hints.kampf };
    return { id: 'hg.tor', steps: T.hints.tor };
  },
  setup: (c: ScriptCtx) => {
    c.place(PC, { character: 'mijo1512', pose: 'stand', gait: 'walk' });
  },
  intro: function* (c: ScriptCtx): Script {
    yield narrate(T.intro.n1);
    yield narrate(T.intro.n2);
    yield face(PC, -1);
    yield say(PC, T.intro.a);
    c.journal('essen');
  },
  resumes: { prefight, duel, after: afterDuel, quickening: quickeningRun },
  rooms: [stube, hof],
};
