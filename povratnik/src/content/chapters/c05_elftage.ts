// Kapitel 5 – Elf Tage. August 1476. The family door stays bolted in every state. Four visits – the first
// night, the third morning, the sixth day, the eleventh night – in the stall beside the house, the yard,
// the uncle's field, the church steps and a burning house in the lane below. The father is only ever a
// cough behind the boards and a pair of bare feet. Puzzles: the old hay rack (weight on a pin, a lever,
// securing the load, lowering it under control), the uncle's whetstone, and smoke and a burning beam in
// the house. The cut hand of the third morning, closed by evening, is why Mijo walks into the fire.
import type { ChapterDef, RoomDef, ScriptCtx } from '../../core/content';
import type { InsertSpec, Script } from '../../core/cmd';
import { checkpoint, choice, endChapter, fade, insert, narrate, pose, room, say, shake, timeCard, wait, walk } from '../../core/cmd';
import type { GameState } from '../../core/state';
import { T } from '../text/de/c05_elftage';
import { flags, PC, persp2, R } from '../util';

const f = flags('et');
const ONKEL = 'et_onkel';
const JUNGE = 'et_junge';
const ZIEGEN = 'et_ziegen';
const FRAU = 'et_frau';
const C = { pc: '#e9d7b0', onkel: '#d2c3a0', frau: '#e0b49a', junge: '#e6d2b4', ziegen: '#cfc6b0' };
type Rect4 = [number, number, number, number];

/** The four visits and the cuts between them. */
type Phase = 'pre' | 'n1' | 'm3' | 'e3' | 'p6' | 'd6' | 'e6' | 'n11';
const ORDER: Phase[] = ['pre', 'n1', 'm3', 'e3', 'p6', 'd6', 'e6', 'n11'];
const phase = (s: GameState): Phase => (typeof s.flags[f('phase')] === 'string' ? (s.flags[f('phase')] as Phase) : 'pre');
const at = (...ps: Phase[]) => (s: GameState) => ps.includes(phase(s));
const from = (p: Phase) => (s: GameState) => ORDER.indexOf(phase(s)) >= ORDER.indexOf(p);
const fl = (s: GameState, n: string) => !!s.flags[f(n)];
const is = (n: string) => (s: GameState) => fl(s, n);
const not = (n: string) => (s: GameState) => !fl(s, n);
const num = (s: GameState, n: string) => (typeof s.flags[f(n)] === 'number' ? (s.flags[f(n)] as number) : 0);
const setPhase = (c: ScriptCtx, p: Phase) => c.set(f('phase'), p);

function* lines(actor: string, l: string | readonly string[]): Script {
  for (const t of typeof l === 'string' ? [l] : l) yield say(actor, t);
}

/** The scythe is for his field only. */
const scytheElsewhere = (item: string) => (item === 'sense' ? T.stall.sense.notNow : undefined);

// ------------------------------------------------------------------------------- close-ups

/** The gap under a closed door: only feet and the jug are ever seen of the father. */
function feetAt(door: 'stall' | 'house', anim: string): InsertSpec {
  return door === 'stall'
    ? { w: 520, h: 176, bg: 'bg_et_hof', crop: [120, 330, 300, 101], shade: 0.5, band: 58, tint: 0x9aa2bc, sprite: { character: 'feet_et', anim, x: 250, y: 166, scale: 1.75 } }
    : { w: 520, h: 176, bg: 'bg_et_stall_nacht', crop: [340, 372, 300, 101], shade: 0.25, band: 58, tint: 0x8c8274, sprite: { character: 'feet_et', anim, x: 260, y: 166, scale: 1.75 } };
}

/** Mijo's palm, raised into the light of the stall. */
function palm(anim: 'cut' | 'healed'): InsertSpec {
  return anim === 'cut'
    ? { w: 360, h: 280, bg: 'bg_et_stall_tag', crop: [330, 120, 240, 187], sprite: { character: 'hand_et', anim, x: 180, y: 270, scale: 2.05 } }
    : { w: 360, h: 280, bg: 'bg_et_stall_nacht', crop: [330, 120, 240, 187], shade: 0.1, tint: 0xd8cbb8, sprite: { character: 'hand_et', anim, x: 180, y: 270, scale: 2.05 } };
}

// ------------------------------------------------------------------------------------ the yard

const DOOR_SPOT = { x: 662, y: 312, face: 1 as const };
const FOOD_SPOT = { x: 204, y: 332, face: 1 as const };

function* doorTalk(c: ScriptCtx): Script {
  if (phase(c.s) === 'm3' && !c.is(f('va'))) {
    c.set(f('va'));
    yield say(PC, T.hof.tuer.talk);
    yield insert(feetAt('house', 'away'));
    yield wait(1.4);
    yield narrate(T.hof.tuer.feetN);
    yield insert(null);
    return;
  }
  yield say(PC, c.is(f('va')) ? c.pick('et.door', [T.hof.tuer.talkAgain, T.hof.tuer.talkLater]) : T.hof.tuer.talkLater);
}

function* foodLook(c: ScriptCtx): Script {
  c.set(f('clothSeen'));
  yield say(PC, T.hof.essen.look);
}

function* eatScript(c: ScriptCtx): Script {
  if (!c.is(f('clothSeen'))) {
    yield say(PC, T.hof.essen.takeFirst);
    return;
  }
  yield walk(PC, FOOD_SPOT.x, FOOD_SPOT.y, { face: 1 });
  yield pose(PC, 'sit', { rest: true });
  c.set(f('eaten'));
  yield pose(PC, 'bread', { rest: true });
  yield pose(PC, 'coverFace', { rest: true });
  yield narrate(T.hof.essen.eatN);
  yield wait(0.8);
  yield fade(0.6, 0.3);
  c.place(PC, { pose: 'stand' });
  c.set(f('clothTaken'));
  c.give('tuch');
  yield fade(0, 0.3);
  yield say(PC, T.hof.essen.cloth);
  c.journal('family', 'done');
  c.journal('bed');
}

/** Through the shed door into the first night. */
function* stallDoor(c: ScriptCtx): Script {
  if (phase(c.s) !== 'pre') {
    yield room('et_stall', 'hof');
    return;
  }
  yield fade(1, 0.9);
  c.journal('door', 'done');
  setPhase(c, 'n1');
  yield timeCard(T.visits.v1);
  yield room('et_stall', 'night');
}

const hof: RoomDef = {
  id: 'et_hof',
  title: T.rooms.hof,
  bg: 'bg_et_hof',
  width: 960,
  perspective: persp2(294, 175, 446, 230),
  shade: (s) => (phase(s) === 'e6' ? 0.22 : 0),
  shadeColor: 0x3a1c10,
  walk: [{ outer: [20, 465, 950, 465, 950, 430, 900, 400, 860, 380, 830, 340, 780, 315, 740, 306, 620, 306, 560, 302, 470, 298, 400, 295, 250, 290, 200, 292, 120, 296, 60, 305, 20, 330] }],
  entries: {
    start: DOOR_SPOT,
    stall: { x: 150, y: 312, face: 1 },
    feld: { x: 930, y: 445, face: -1 },
    kirche: { x: 40, y: 400, face: 1 },
  },
  assets: ['prop_tuch_krug_brot', 'prop_tuch_krug', 'prop_krug', 'atlas/feet_et', 'bg_et_stall_nacht'],
  layers: [
    { id: 'essen', image: (s) => (fl(s, 'eaten') ? 'prop_tuch_krug' : 'prop_tuch_krug_brot'), x: 0, y: 0, rect: [226, 300, 82, 47] as Rect4, depth: 'back', visible: (s) => phase(s) === 'm3' && !fl(s, 'clothTaken') },
    { id: 'krug', image: 'prop_krug', x: 0, y: 0, rect: [236, 300, 30, 33] as Rect4, depth: 'back', visible: (s) => from('m3')(s) && (fl(s, 'clothTaken') || from('p6')(s)) },
    { id: 'klotz', image: 'prop_klotz', x: 0, y: 0, rect: [312, 268, 40, 27] as Rect4, depth: 'back', visible: not('klotzTaken') },
  ],
  hotspots: [
    {
      id: 'tuer',
      name: T.hof.tuer.name,
      shape: R(638, 100, 98, 198),
      walkTo: DOOR_SPOT,
      verbs: ['look', 'use', 'knock', 'talk'],
      on: { look: T.hof.tuer.look, use: T.hof.tuer.use, knock: T.hof.tuer.knock, talk: doorTalk },
      // No item and no answer opens it.
      anyItem: () => T.hof.tuer.use,
    },
    { id: 'haus', name: T.hof.haus.name, shape: R(400, 40, 560, 250), walkTo: null, priority: -1, on: { look: T.hof.haus.look }, anyItem: scytheElsewhere },
    {
      id: 'essen',
      name: T.hof.essen.name,
      shape: R(254, 298, 58, 50),
      visible: (s) => phase(s) === 'm3' && !fl(s, 'clothTaken'),
      walkTo: FOOD_SPOT,
      priority: 2,
      verbs: ['look', 'take', 'eat'],
      on: { look: foodLook, take: eatScript, eat: eatScript },
    },
    {
      id: 'krug',
      name: T.hof.krug.name,
      shape: R(230, 294, 34, 40),
      visible: from('m3'),
      walkTo: FOOD_SPOT,
      priority: 3,
      on: { look: T.hof.krug.look, take: T.hof.krug.look },
    },
    {
      id: 'klotz',
      name: T.hof.klotz.name,
      shape: R(308, 262, 48, 36),
      visible: not('klotzTaken'),
      walkTo: { x: 330, y: 304, face: -1 as const },
      priority: 2,
      verbs: ['look', 'take'],
      on: {
        look: T.hof.klotz.look,
        take: function* (c: ScriptCtx): Script {
          c.set(f('klotzTaken'));
          c.give('klotz');
          yield say(PC, T.hof.klotz.take);
        },
      },
    },
    {
      id: 'stall',
      name: T.hof.stall.name,
      shape: R(40, 110, 195, 185),
      walkTo: { x: 150, y: 306, face: -1 as const },
      exit: { room: 'et_stall', entry: 'hof' },
      exitDir: 'left',
      verbs: ['go', 'look'],
      on: { go: stallDoor, look: (c: ScriptCtx) => lines(PC, phase(c.s) === 'pre' ? T.hof.stall.look : T.hof.stall.lookLater) },
      anyItem: scytheElsewhere,
    },
    {
      id: 'feld',
      name: T.hof.feld.name,
      shape: R(905, 300, 55, 170),
      walkTo: { x: 938, y: 448, face: 1 as const },
      exit: { room: 'et_feld', entry: 'hof' },
      exitDir: 'right',
      exitBlocked: (s) => (from('d6')(s) ? null : T.hof.feld.notYet),
      on: { look: T.hof.feld.look },
    },
    {
      id: 'kirche',
      name: T.hof.kirche.name,
      shape: R(0, 300, 40, 170),
      walkTo: { x: 26, y: 400, face: -1 as const },
      exit: { room: 'et_kirche', entry: 'hof' },
      exitDir: 'left',
      exitBlocked: (s) => (phase(s) === 'e6' ? null : T.hof.kirche.notYet),
      on: { look: T.hof.kirche.look },
    },
  ],
  rules: [{ id: 'evening', when: (s) => eveningDue(s), run: eveningScript }],
};

// ----------------------------------------------------------------------------------- the stall

/** Rack states: 0 hanging on the pin, 1 block under the right edge, 2 lever wedged, 3 rope tied over
 * the post, 4 pin out (hanging on the rope), 5 lowered (right side too low), 6 supported: a bed. */
const rack = (s: GameState) => num(s, 'rack');
const RACK_IMAGE = ['prop_raufe_0', 'prop_raufe_0', 'prop_raufe_2', 'prop_raufe_3', 'prop_raufe_4', 'prop_raufe_5', 'prop_raufe_7'];
const RACK_RECT: Rect4 = [268, 113, 361, 241];
const PIN_SPOT = { x: 668, y: 372, face: -1 as const };
const LEVER_SPOT = { x: 430, y: 368, face: 1 as const };
const BLOCK_SPOT = { x: 478, y: 370, face: 1 as const };
const BED_SPOT = { x: 450, y: 368, face: 1 as const };
const SIT_DOOR = { x: 282, y: 364, face: -1 as const };
const night = (s: GameState) => {
  const p = phase(s);
  return p === 'n1' || p === 'e3' || (p === 'p6' && !fl(s, 'doorOpened'));
};

function* goatsLook(c: ScriptCtx): Script {
  if (phase(c.s) === 'n1') {
    yield pose(ZIEGEN, 'huddle', { rest: true });
    c.place(ZIEGEN, { pose: 'huddled' });
    yield say(PC, T.stall.ziegen.look);
    c.set(f('goats'));
    yield* nightPasses(c);
    return;
  }
  yield say(PC, T.stall.ziegen.lookLater);
}

function* boardsLook(c: ScriptCtx): Script {
  const p = phase(c.s);
  if (p === 'n1') {
    yield narrate(T.stall.bretter.cough);
    yield narrate(T.stall.bretter.coughN);
    c.set(f('cough'));
    yield* nightPasses(c);
    return;
  }
  yield say(PC, p === 'pre' || p === 'm3' || p === 'd6' ? T.stall.bretter.look : T.stall.bretter.later);
}

/** After the goats and the boards, a cut to the light of the third morning. */
function* nightPasses(c: ScriptCtx): Script {
  if (!c.is(f('goats')) || !c.is(f('cough')) || phase(c.s) !== 'n1') return;
  yield walk(PC, 420, 368, { face: 1 });
  yield pose(PC, 'sit', { rest: true });
  c.place(PC, { pose: 'faceRest' });
  yield narrate(T.stall.bretter.nightCut);
  yield fade(1, 1.4);
  c.journal('night', 'done');
  setPhase(c, 'm3');
  c.place(ZIEGEN, { pose: 'stand' });
  c.place(PC, { pose: 'stand', x: 420, y: 370, facing: 1 });
  yield checkpoint();
  yield timeCard(T.visits.v2);
  yield fade(0, 1);
  c.journal('family');
}

function* testPin(c: ScriptCtx): Script {
  yield walk(PC, PIN_SPOT.x, PIN_SPOT.y, { face: -1 });
  c.set(f('pulling'));
  yield pose(PC, 'test');
  c.unset(f('pulling'));
  c.place(PC, { pose: 'stand' });
  yield say(PC, T.stall.raufe.test);
}

function* blockOnRack(c: ScriptCtx): Script {
  const r = rack(c.s);
  if (r === 5) {
    yield walk(PC, BLOCK_SPOT.x, BLOCK_SPOT.y, { face: 1 });
    yield say(PC, T.stall.raufe.support);
    yield pose(PC, 'block');
    c.drop('klotz');
    c.set(f('rack'), 6);
    c.place(PC, { pose: 'stand' });
    yield say(PC, T.stall.raufe.done);
    c.journal('bed', 'done');
    return;
  }
  if (r === 4) {
    yield say(PC, T.stall.raufe.lowerFirst);
    return;
  }
  if (r >= 1) {
    yield say(PC, T.stall.raufe.blockTwice);
    return;
  }
  yield walk(PC, BLOCK_SPOT.x, BLOCK_SPOT.y, { face: 1 });
  yield pose(PC, 'block');
  c.drop('klotz');
  c.set(f('rack'), 1);
  c.place(PC, { pose: 'stand' });
  yield say(PC, T.stall.raufe.blockSet);
}

function* plankOnRack(c: ScriptCtx): Script {
  const r = rack(c.s);
  if (r >= 2) {
    yield say(PC, r >= 4 ? T.stall.raufe.lookFree : T.stall.raufe.lifted);
    return;
  }
  yield walk(PC, LEVER_SPOT.x, LEVER_SPOT.y, { face: 1 });
  if (r === 0) {
    // No fixed point: the plank only slides over the wet floor.
    yield pose(PC, 'press');
    c.place(PC, { pose: 'stand' });
    yield say(PC, T.stall.raufe.noBlock);
    return;
  }
  yield say(PC, T.stall.raufe.lift);
  yield pose(PC, 'press', { rest: true });
  c.drop('brett');
  c.set(f('rack'), 2);
  yield wait(0.5);
  c.place(PC, { pose: 'stand' });
  yield say(PC, T.stall.raufe.wedge);
}

function* tieRope(c: ScriptCtx): Script {
  const r = rack(c.s);
  if (r < 2) {
    yield say(PC, T.stall.raufe.noLiftForRope);
    return;
  }
  if (r >= 3) {
    yield say(PC, T.stall.raufe.lookTied);
    return;
  }
  yield walk(PC, PIN_SPOT.x, PIN_SPOT.y, { face: -1 });
  yield pose(PC, 'tie');
  c.drop('seil');
  c.set(f('rack'), 3);
  c.place(PC, { pose: 'stand' });
  yield say(PC, T.stall.raufe.tie);
}

function* pullPin(c: ScriptCtx): Script {
  const r = rack(c.s);
  if (r >= 4) {
    yield say(PC, T.stall.stift.lookOut);
    return;
  }
  if (r === 2) {
    yield say(PC, T.stall.raufe.noRopeYet);
    return;
  }
  if (r < 2) {
    yield* testPin(c);
    return;
  }
  yield walk(PC, PIN_SPOT.x, PIN_SPOT.y, { face: -1 });
  yield pose(PC, 'pin', { rest: true });
  c.set(f('rack'), 4);
  c.set(f('cut'));
  c.give('klotz');
  yield say(PC, T.stall.raufe.pin);
  c.place(PC, { pose: 'stand' });
  yield say(PC, T.stall.raufe.pinBack);
  c.journal('hand');
}

function* lowerRack(c: ScriptCtx): Script {
  const r = rack(c.s);
  if (r >= 5) {
    yield say(PC, r === 5 ? T.stall.raufe.lookLow : T.stall.raufe.lookDone);
    return;
  }
  if (r === 3) {
    yield say(PC, T.stall.raufe.tiedUse);
    return;
  }
  if (r < 3) {
    yield* testPin(c);
    return;
  }
  yield walk(PC, PIN_SPOT.x, PIN_SPOT.y, { face: -1 });
  yield say(PC, T.stall.raufe.lower);
  yield pose(PC, 'lower');
  c.set(f('rack'), 5);
  c.place(PC, { pose: 'stand' });
  yield say(PC, T.stall.raufe.lowered);
}

function* useRack(c: ScriptCtx): Script {
  const r = rack(c.s);
  if (r <= 1) yield* testPin(c);
  else if (r === 2) yield say(PC, T.stall.raufe.lifted);
  else if (r === 3) yield say(PC, T.stall.raufe.tiedUse);
  else if (r === 4) yield* lowerRack(c);
  else if (r === 5) yield say(PC, T.stall.raufe.lookLow);
  else yield* lieDown(c);
}

function* lieDown(c: ScriptCtx): Script {
  if (rack(c.s) < 6) {
    yield say(PC, T.stall.raufe.notReady);
    return;
  }
  const p = phase(c.s);
  if (p !== 'e3') {
    yield say(PC, p === 'm3' || p === 'd6' ? T.stall.raufe.day : T.stall.raufe.lookDone);
    return;
  }
  if (!c.is(f('healedSeen'))) {
    yield say(PC, T.stall.raufe.notTonight);
    return;
  }
  yield* sleepToSixthDay(c);
}

function rackLook(s: GameState): string | readonly string[] {
  switch (rack(s)) {
    case 0:
    case 1:
      return T.stall.raufe.look;
    case 2:
      return T.stall.raufe.lookLifted;
    case 3:
      return T.stall.raufe.lookTied;
    case 4:
      return T.stall.raufe.lookFree;
    case 5:
      return T.stall.raufe.lookLow;
    default:
      return T.stall.raufe.lookDone;
  }
}

/** The hand, cut on the pin in the morning: open. The same evening: closed, without a scab. */
function* lookHand(c: ScriptCtx): Script {
  const p = phase(c.s);
  if (p === 'e3' && !c.is(f('healedSeen'))) {
    yield pose(PC, 'handClosed', { rest: true });
    yield insert(palm('healed'));
    yield say(PC, T.stall.hand.closed);
    yield narrate(T.stall.hand.closedN);
    yield insert(null);
    c.set(f('healedSeen'));
    c.journal('hand', 'done');
    c.place(PC, { pose: 'stand' });
    yield* sleepToSixthDay(c);
    return;
  }
  if (c.is(f('healedSeen'))) {
    yield say(PC, T.stall.hand.later);
    return;
  }
  if (c.is(f('cut'))) {
    yield pose(PC, 'handOpen', { rest: true });
    yield insert(palm('cut'));
    yield say(PC, T.stall.hand.blood);
    yield insert(null);
    c.set(f('handOpenSeen'));
    c.place(PC, { pose: 'stand' });
    return;
  }
  yield say(PC, T.stall.hand.look);
}

const eveningDue = (s: GameState) => phase(s) === 'm3' && rack(s) === 6 && fl(s, 'eaten') && fl(s, 'handOpenSeen');

/** The cut to the evening of the same visit, in the same stall. */
function* eveningScript(c: ScriptCtx): Script {
  yield fade(1, 1.2);
  setPhase(c, 'e3');
  yield timeCard(T.visits.evening);
  if (c.s.room !== 'et_stall') {
    yield room('et_stall', 'abend');
    return;
  }
  c.place(PC, { x: 330, y: 380, facing: 1, pose: 'stand' });
  yield fade(0, 1);
}

function* sleepToSixthDay(c: ScriptCtx): Script {
  yield walk(PC, BED_SPOT.x, BED_SPOT.y, { face: 1 });
  yield say(PC, T.stall.raufe.lie);
  yield fade(1, 1.6);
  setPhase(c, 'p6');
  c.place(PC, { x: 450, y: 372, facing: -1, pose: 'stand' });
  yield checkpoint();
  yield timeCard(T.visits.v3);
  yield fade(0, 1);
  c.journal('steps');
}

/** Sitting still beside the stall door before dawn: steps, the jug set down, the feet standing. The
 * moment is held by the choice (no time limit); either way only feet go away and the jug stays. */
function* sitByDoor(c: ScriptCtx): Script {
  if (phase(c.s) !== 'p6') {
    yield say(PC, T.stall.platz.notNow);
    return;
  }
  yield walk(PC, SIT_DOOR.x, SIT_DOOR.y, { face: -1 });
  yield say(PC, T.stall.platz.sit);
  yield pose(PC, 'sit', { rest: true });
  c.place(PC, { pose: 'sitDoor' });
  if (c.is(f('feetDone'))) {
    // The moment has passed; it comes again tomorrow.
    yield say(PC, T.stall.feet.again);
    c.place(PC, { pose: 'stand' });
    return;
  }
  yield wait(1.2);
  yield insert(feetAt('stall', 'in'));
  yield narrate(T.stall.feet.n1);
  yield insert(feetAt('stall', 'stand'));
  yield narrate(T.stall.feet.n2);
  const pick: string = yield choice([
    { id: 'open', text: T.stall.feet.choiceOpen },
    { id: 'wait', text: T.stall.feet.choiceWait },
  ]);
  if (pick === 'open') {
    yield insert(null);
    c.place(PC, { pose: 'stand' });
    yield say(PC, T.stall.feet.open);
    c.set(f('doorOpened'));
    yield insert(feetAt('stall', 'away'));
    yield wait(1.4);
    yield narrate(T.stall.feet.openN);
  } else {
    yield insert(feetAt('stall', 'away'));
    yield wait(1.4);
    yield narrate(T.stall.feet.waitN);
  }
  yield insert(null);
  c.set(f('feetDone'));
  c.journal('steps', 'done');
  yield* daySix(c);
}

function* daySix(c: ScriptCtx): Script {
  yield fade(1, 1.2);
  setPhase(c, 'd6');
  c.place(PC, { x: 330, y: 380, facing: 1, pose: 'stand' });
  yield checkpoint();
  yield timeCard(T.visits.v3day);
  yield fade(0, 1);
  yield narrate(T.stall.d6);
  c.journal('field');
}

function* takeScythe(c: ScriptCtx): Script {
  if (!from('d6')(c.s)) {
    yield say(PC, T.stall.sense.early);
    return;
  }
  c.set(f('senseTaken'));
  c.give('sense');
  yield say(PC, T.stall.sense.take);
}

function stallDoorBlocked(s: GameState): string | null {
  return night(s) || (phase(s) === 'p6' && !fl(s, 'feetDone')) ? T.stall.tuer.dark : null;
}

const stall: RoomDef = {
  id: 'et_stall',
  title: T.rooms.stall,
  bg: (s) => (night(s) ? 'bg_et_stall_nacht' : 'bg_et_stall_tag'),
  width: 960,
  perspective: persp2(330, 180, 446, 230),
  shade: (s) => (phase(s) === 'p6' && fl(s, 'doorOpened') && !fl(s, 'feetDone') ? 0.45 : phase(s) === 'e3' ? 0.12 : phase(s) === 'e6' ? 0.3 : 0),
  shadeColor: 0x0a1028,
  actorTint: (s) => (night(s) ? 0x9aa0b8 : 0xffffff),
  layerTint: (s) => (night(s) ? 0x7c8298 : 0xffffff),
  walk: [{ outer: [20, 465, 790, 465, 800, 440, 780, 400, 700, 372, 620, 362, 300, 362, 250, 352, 90, 352, 20, 372] }],
  entries: {
    hof: { x: 165, y: 362, face: 1 },
    night: { x: 200, y: 378, face: 1 },
    abend: { x: 330, y: 380, face: 1 },
  },
  assets: [
    'bg_et_stall_nacht',
    'bg_et_stall_tag',
    ...RACK_IMAGE,
    'prop_raufe_1',
    'atlas/hand_et',
    'atlas/feet_et',
    'bg_et_hof',
  ],
  layers: [
    { id: 'sense', image: 'prop_sense', x: 0, y: 0, rect: [690, 96, 104, 210] as Rect4, depth: 'back', visible: not('senseTaken') },
    { id: 'brett', image: 'prop_brett', x: 0, y: 0, rect: [24, 376, 196, 100] as Rect4, depth: 'back', visible: not('brettTaken') },
    { id: 'seil', image: 'prop_seil', x: 0, y: 0, rect: [742, 392, 62, 36] as Rect4, depth: 'back', visible: not('seilTaken') },
    { id: 'raufe', image: (s) => (fl(s, 'pulling') ? 'prop_raufe_1' : RACK_IMAGE[rack(s)]), x: 0, y: 0, rect: RACK_RECT, depth: 350 },
    { id: 'fulcrum', image: 'prop_klotz', x: 0, y: 0, rect: [512, 330, 38, 26] as Rect4, depth: 351, visible: (s) => rack(s) === 1 },
  ],
  hotspots: [
    {
      id: 'tuer',
      name: T.stall.tuer.name,
      shape: R(90, 125, 155, 205),
      walkTo: { x: 165, y: 358, face: -1 as const },
      exit: { room: 'et_hof', entry: 'stall' },
      exitDir: 'left',
      exitBlocked: stallDoorBlocked,
      on: { look: T.stall.tuer.look },
      anyItem: scytheElsewhere,
    },
    {
      id: 'bretter',
      name: T.stall.bretter.name,
      shape: R(330, 70, 235, 130),
      walkTo: { x: 420, y: 368, face: 1 as const },
      verbs: ['look', 'listen'],
      on: { look: boardsLook, listen: boardsLook },
      anyItem: scytheElsewhere,
    },
    {
      id: 'raufe',
      name: T.stall.raufe.name,
      shape: R(330, 190, 240, 134),
      walkTo: { x: 450, y: 368, face: 1 as const },
      priority: 3,
      verbs: (s) => [...['look', 'use'], ...(rack(s) === 4 ? ['lower'] : []), ...(rack(s) === 6 ? ['lie'] : [])],
      on: { look: (c: ScriptCtx) => lines(PC, rackLook(c.s)), use: useRack, lower: lowerRack, lie: lieDown, lift: plankOnRack },
      items: { brett: plankOnRack, klotz: blockOnRack, seil: tieRope },
      anyItem: scytheElsewhere,
    },
    {
      id: 'pfosten',
      name: T.stall.pfosten.name,
      shape: R(562, 140, 40, 210),
      walkTo: PIN_SPOT,
      priority: 4,
      verbs: (s) => (rack(s) === 4 ? ['look', 'lower'] : ['look']),
      on: { look: (c: ScriptCtx) => lines(PC, rack(c.s) >= 3 ? T.stall.pfosten.lookTied : T.stall.pfosten.look), lower: lowerRack },
      items: { seil: tieRope, brett: plankOnRack, klotz: blockOnRack },
      anyItem: scytheElsewhere,
    },
    {
      id: 'stift',
      name: T.stall.stift.name,
      shape: R(584, 230, 30, 30),
      visible: (s) => rack(s) < 4,
      walkTo: PIN_SPOT,
      priority: 5,
      verbs: ['look', 'pull'],
      on: { look: T.stall.stift.look, pull: pullPin, use: pullPin, take: pullPin },
      items: { seil: tieRope, brett: plankOnRack },
      anyItem: scytheElsewhere,
    },
    {
      id: 'latte',
      name: T.stall.latte.name,
      shape: R(330, 326, 232, 24),
      walkTo: LEVER_SPOT,
      priority: 2,
      on: { look: T.stall.latte.look },
      items: { brett: plankOnRack },
    },
    {
      id: 'brett',
      name: T.stall.brett.name,
      shape: { poly: [24, 470, 60, 470, 222, 392, 210, 376] },
      visible: not('brettTaken'),
      walkTo: { x: 150, y: 420, face: -1 as const },
      priority: 2,
      verbs: ['look', 'take'],
      on: {
        look: T.stall.brett.look,
        take: function* (c: ScriptCtx): Script {
          c.set(f('brettTaken'));
          c.give('brett');
          yield say(PC, T.stall.brett.take);
        },
      },
    },
    {
      id: 'seil',
      name: T.stall.seil.name,
      shape: R(738, 386, 70, 46),
      visible: not('seilTaken'),
      walkTo: { x: 712, y: 420, face: 1 as const },
      priority: 2,
      verbs: ['look', 'take'],
      on: {
        look: T.stall.seil.look,
        take: function* (c: ScriptCtx): Script {
          c.set(f('seilTaken'));
          c.give('seil');
          yield say(PC, T.stall.seil.take);
        },
      },
    },
    {
      id: 'sense',
      name: T.stall.sense.name,
      shape: R(690, 96, 104, 214),
      visible: not('senseTaken'),
      walkTo: { x: 730, y: 392, face: 1 as const },
      priority: 2,
      verbs: ['look', 'take'],
      on: { look: T.stall.sense.look, take: takeScythe },
    },
    {
      id: 'platz',
      name: T.stall.platz.name,
      shape: R(246, 140, 56, 214),
      visible: at('p6'),
      walkTo: SIT_DOOR,
      priority: 4,
      verbs: ['look', 'sit'],
      on: { look: T.stall.platz.look, sit: sitByDoor, use: sitByDoor },
    },
    {
      // The wet straw in the corner by the goats (the walkable floor itself takes walk clicks).
      id: 'boden',
      name: T.stall.boden.name,
      shape: R(806, 436, 154, 34),
      walkTo: null,
      priority: 1,
      on: {
        look: function* (c: ScriptCtx): Script {
          yield say(PC, T.stall.boden.look);
          if (phase(c.s) === 'm3' && !c.seen('et.bed')) {
            c.mark('et.bed');
            c.journal('bed');
          }
        },
      },
    },
  ],
  prepare: (c: ScriptCtx) => {
    if (phase(c.s) === 'n1' && !c.seen('et.goatsIn')) c.place(ZIEGEN, { pose: 'stand' });
  },
  onEnter: function* (c: ScriptCtx): Script {
    if (phase(c.s) === 'n1' && !c.seen('et.n1')) {
      c.mark('et.n1');
      c.journal('night');
    }
  },
  rules: [{ id: 'evening', when: (s) => eveningDue(s), run: eveningScript }],
};

// ----------------------------------------------------------------------------------- the field

const MOW_SPOT = { x: 330, y: 404, face: 1 as const };
const STONE_SPOT = { x: 884, y: 414, face: 1 as const };

function uncleLook(s: GameState): string | readonly string[] {
  if (fl(s, 'swaths')) return T.feld.onkel.lookStands;
  return T.feld.onkel.look;
}

function* uncleTalk(c: ScriptCtx): Script {
  if (c.is(f('swaths'))) {
    yield say(PC, T.feld.onkel.talkAgain);
    return;
  }
  if (!c.is(f('talked'))) {
    c.set(f('talked'));
    yield say(PC, T.feld.onkel.talk);
    return;
  }
  yield say(PC, T.feld.onkel.talkAgain);
}

/** The blunt scythe held out to him: he offers the whetstone, withdraws his hand and sets it down. */
function* showScythe(c: ScriptCtx): Script {
  if (c.is(f('stoneDown'))) {
    yield say(PC, T.feld.onkel.talkAgain);
    return;
  }
  yield walk(PC, 590, 406, { face: 1 });
  yield say(PC, T.feld.onkel.showScythe);
  yield pose(ONKEL, 'notice', { rest: true });
  yield pose(ONKEL, 'offer', { rest: true });
  yield narrate(T.feld.onkel.offerN);
  yield walk(ONKEL, 884, 400, { face: 1 });
  c.set(f('stoneDown'));
  yield wait(0.5);
  yield walk(ONKEL, 770, 396, { face: -1 });
  yield pose(ONKEL, 'resume', { rest: true });
  c.place(ONKEL, { pose: 'mow', facing: -1 });
  yield narrate(T.feld.onkel.setDownN);
}

function* takeWhetstone(c: ScriptCtx): Script {
  if (!c.is(f('stoneDown')) || c.is(f('stoneTaken'))) {
    yield say(PC, T.feld.stein.look);
    return;
  }
  c.set(f('stoneTaken'));
  c.give('wetzstein');
  yield say(PC, T.feld.stein.take);
}

function* sharpen(c: ScriptCtx): Script {
  if (c.is(f('sharp'))) {
    yield say(PC, T.items.sense.lookSharp);
    return;
  }
  c.set(f('sharp'));
  yield say(PC, T.feld.sharpen);
}

function* mowScript(c: ScriptCtx): Script {
  if (!c.has('sense')) {
    yield say(PC, T.feld.feld.noScythe);
    return;
  }
  if (c.is(f('swaths'))) {
    yield say(PC, T.feld.feld.mowDone);
    return;
  }
  yield walk(PC, MOW_SPOT.x, MOW_SPOT.y, { face: 1 });
  if (!c.is(f('sharp'))) {
    yield pose(PC, 'mow');
    c.place(PC, { pose: 'stand' });
    c.set(f('triedDull'));
    yield say(PC, T.feld.feld.dull);
    return;
  }
  yield pose(PC, 'mow');
  c.set(f('swath1'));
  yield pose(PC, 'mow');
  c.set(f('swaths'));
  c.place(PC, { pose: 'stand' });
  yield narrate(T.feld.feld.mowN);
  // The help shows; he stops, stands, turns and goes.
  c.place(ONKEL, { pose: 'stand' });
  yield wait(1.6);
  yield narrate(T.feld.onkel.afterN);
  yield walk(ONKEL, 1030, 398, { direct: true, face: 1 });
  c.place(ONKEL, { room: null });
  c.set(f('uncleGone'));
}

/** Looking at the field once he has gone: the cut to the same field, mown by someone else. */
function* mownCut(c: ScriptCtx): Script {
  yield fade(1, 1.2);
  c.set(f('mown'));
  setPhase(c, 'e6');
  c.place(PC, { x: 420, y: 430, facing: 1, pose: 'stand' });
  yield checkpoint();
  yield timeCard(T.visits.v3evening);
  yield fade(0, 1);
  yield narrate(T.feld.feld.lookMownN);
  yield say(PC, T.feld.feld.lookMown);
  c.journal('field', 'done');
  c.journal('church');
}

function* fieldLook(c: ScriptCtx): Script {
  if (c.is(f('mown'))) {
    yield say(PC, T.feld.feld.lookMown);
    return;
  }
  if (c.is(f('uncleGone'))) {
    yield say(PC, T.feld.feld.after);
    yield* mownCut(c);
    return;
  }
  yield say(PC, T.feld.feld.look);
}

const feld: RoomDef = {
  id: 'et_feld',
  title: T.rooms.feld,
  bg: (s) => (fl(s, 'mown') ? 'bg_et_feld_gemaeht' : 'bg_et_feld'),
  width: 960,
  perspective: persp2(392, 200, 450, 228),
  shade: (s) => (fl(s, 'mown') ? 0.28 : 0),
  shadeColor: 0x3a1c10,
  actorTint: (s) => (fl(s, 'mown') ? 0xe0c0a0 : 0xffffff),
  walk: [{ outer: [0, 465, 960, 465, 960, 402, 900, 396, 800, 393, 600, 386, 400, 387, 200, 393, 160, 400, 0, 406] }],
  entries: {
    hof: { x: 40, y: 440, face: 1 },
    kirche: { x: 920, y: 440, face: -1 },
  },
  assets: ['bg_et_feld', 'bg_et_feld_gemaeht'],
  layers: [
    { id: 'seineBahn', image: 'prop_schwad', x: 0, y: 0, rect: [610, 396, 190, 67] as Rect4, depth: 'back', visible: not('mown') },
    { id: 'bahn1', image: 'prop_schwad', x: 0, y: 0, rect: [372, 392, 160, 56] as Rect4, depth: 'back', visible: (s) => fl(s, 'swath1') && !fl(s, 'mown') },
    { id: 'bahn2', image: 'prop_schwad', x: 0, y: 0, rect: [410, 414, 170, 60] as Rect4, depth: 'back', visible: (s) => fl(s, 'swaths') && !fl(s, 'mown') },
    { id: 'wetzstein', image: 'prop_wetzstein', x: 0, y: 0, rect: [914, 324, 28, 19] as Rect4, depth: 'back', visible: (s) => fl(s, 'stoneDown') && !fl(s, 'stoneTaken') },
  ],
  hotspots: [
    {
      id: 'feld',
      name: T.feld.feld.name,
      shape: R(0, 210, 960, 178),
      walkTo: MOW_SPOT,
      priority: -1,
      verbs: ['look', 'use'],
      on: { look: fieldLook, use: mowScript },
      items: { sense: mowScript },
    },
    {
      id: 'stein',
      name: T.feld.stein.name,
      shape: R(900, 316, 60, 58),
      walkTo: STONE_SPOT,
      priority: 3,
      verbs: (s) => (fl(s, 'stoneDown') && !fl(s, 'stoneTaken') ? ['look', 'take'] : ['look']),
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('stoneDown')) && !c.is(f('stoneTaken')) ? T.feld.stein.lookStone : T.feld.stein.look),
        take: takeWhetstone,
      },
    },
    {
      id: 'schwad',
      name: T.feld.schwad.name,
      shape: R(372, 392, 210, 82),
      visible: (s) => fl(s, 'swaths') && !fl(s, 'mown'),
      walkTo: null,
      priority: 2,
      on: { look: T.feld.schwad.look },
    },
    {
      id: 'hof',
      name: T.feld.hof.name,
      shape: R(0, 380, 36, 90),
      walkTo: { x: 18, y: 440, face: -1 as const },
      exit: { room: 'et_hof', entry: 'feld' },
      exitDir: 'left',
      exitBlocked: (s) => (fl(s, 'uncleGone') && !fl(s, 'mown') ? T.hof.feld.notYet : null),
      on: { look: T.feld.hof.look },
    },
    {
      id: 'kirche',
      name: T.feld.kirche.name,
      shape: R(924, 380, 36, 90),
      walkTo: { x: 944, y: 440, face: 1 as const },
      exit: { room: 'et_kirche', entry: 'feld' },
      exitDir: 'right',
      exitBlocked: (s) => (fl(s, 'mown') ? null : fl(s, 'uncleGone') ? T.feld.kirche.notNow : T.feld.kirche.notYet),
      on: { look: T.feld.kirche.look },
    },
  ],
  onEnter: function* (c: ScriptCtx): Script {
    if (phase(c.s) === 'd6' && !c.seen('et.field')) c.mark('et.field');
  },
};

// ------------------------------------------------------------------------------ the church steps

const STEP_SIT = { x: 560, y: 300, face: 1 as const };
const LAY_SPOT = { x: 520, y: 302, face: 1 as const };

/** On the steps (up to the top landing) figures are scaled for the floor below their feet. */
const stepsElevation = (x: number, y: number) => (x > 430 && x < 860 && y < 380 ? (380 - y) * 0.8 : 0);

function* sitSteps(c: ScriptCtx): Script {
  if (phase(c.s) !== 'e6') {
    yield say(PC, T.kirche.stufen.lookNight);
    return;
  }
  yield walk(PC, STEP_SIT.x, STEP_SIT.y, { face: 1 });
  yield say(PC, T.kirche.stufen.sit);
  yield pose(PC, 'sit', { rest: true });
  c.set(f('satSteps'));
  yield narrate(T.kirche.stufen.sitN);
  const pick: string = yield choice([
    { id: 'pray', text: T.kirche.beten.name },
    { id: 'sit', text: T.stall.feet.choiceWait },
  ]);
  if (pick === 'pray') yield say(PC, T.kirche.beten.pray);
  yield fade(1, 1.6);
  c.journal('church', 'done');
  setPhase(c, 'n11');
  c.place(PC, { pose: 'stand', facing: 1 });
  yield timeCard(T.visits.v4);
  yield room('et_gasse', 'arrive');
}

/** The boy on the upper step, the hand over his forehead, and away without looking back. */
function* layBoy(c: ScriptCtx): Script {
  if (!c.is(f('carrying'))) {
    yield say(PC, T.kirche.stufen.lookNight);
    return;
  }
  yield walk(PC, LAY_SPOT.x, LAY_SPOT.y, { face: 1 });
  yield checkpoint();
  yield say(PC, T.kirche.lay);
  yield pose(PC, 'layDown', { rest: true });
  yield say(PC, T.kirche.forehead);
  yield pose(PC, 'forehead', { rest: true });
  yield wait(1.2);
  c.place(JUNGE, { room: 'et_kirche', x: LAY_SPOT.x + 3, y: LAY_SPOT.y - 5, facing: -1, pose: 'step', hidden: false });
  // He rises where his knees were, at the boy's feet.
  c.place(PC, { pose: 'stand', gait: 'walk', x: LAY_SPOT.x - 46, y: LAY_SPOT.y + 2 });
  c.unset(f('carrying'));
  c.set(f('laid'));
  c.journal('step', 'done');
  yield narrate(T.kirche.leave);
  yield walk(PC, -90, 432, { direct: true, via: [[LAY_SPOT.x - 30, 384]], face: -1, anim: 'walk' });
  c.place(PC, { hidden: true });
  yield wait(1.6);
  yield pose(JUNGE, 'breath', { rest: true });
  yield narrate(T.kirche.breath);
  yield pose(JUNGE, 'awaken', { rest: true });
  c.place(JUNGE, { pose: 'seated' });
  yield narrate(T.kirche.end);
  yield wait(1.4);
  yield fade(1, 2.2);
  yield endChapter();
}

const kirche: RoomDef = {
  id: 'et_kirche',
  title: T.rooms.kirche,
  bg: (s) => (phase(s) === 'n11' ? 'bg_et_kirche_nacht' : 'bg_et_kirche'),
  width: 960,
  perspective: persp2(375, 168, 460, 212),
  elevation: stepsElevation,
  actorTint: (s) => (phase(s) === 'n11' ? 0x8e98bc : 0xf2d2b0),
  walk: [
    { outer: [0, 465, 960, 465, 960, 384, 900, 382, 330, 382, 300, 336, 0, 334] },
    { outer: [470, 386, 830, 386, 840, 294, 460, 294] },
  ],
  entries: {
    hof: { x: 930, y: 432, face: -1 },
    feld: { x: 930, y: 432, face: -1 },
    gasse: { x: 40, y: 430, face: 1 },
  },
  assets: ['bg_et_kirche', 'bg_et_kirche_nacht'],
  hotspots: [
    {
      id: 'stufen',
      name: T.kirche.stufen.name,
      shape: R(430, 284, 420, 44),
      walkTo: STEP_SIT,
      priority: 2,
      verbs: (s) => (fl(s, 'carrying') ? ['look', 'lay'] : phase(s) === 'e6' && !fl(s, 'satSteps') ? ['look', 'sit'] : ['look']),
      on: {
        look: (c: ScriptCtx) => lines(PC, phase(c.s) === 'n11' ? T.kirche.stufen.lookNight : T.kirche.stufen.look),
        sit: sitSteps,
        use: sitSteps,
        lay: layBoy,
      },
    },
    {
      id: 'tuer',
      name: T.kirche.tuer.name,
      shape: R(648, 92, 108, 196),
      walkTo: { x: 700, y: 300, face: 1 as const },
      verbs: ['look', 'pray'],
      on: { look: T.kirche.tuer.look, pray: T.kirche.beten.pray, use: T.kirche.tuer.look },
    },
    {
      id: 'gasse',
      name: T.kirche.gasse.name,
      shape: R(0, 334, 40, 136),
      walkTo: { x: 18, y: 430, face: -1 as const },
      exit: { room: 'et_gasse', entry: 'kirche' },
      exitDir: 'left',
      exitBlocked: (s) => (phase(s) === 'n11' ? (fl(s, 'carrying') ? T.kirche.stufen.lookNight : null) : T.kirche.gasse.notYet),
      on: { look: T.kirche.gasse.look },
    },
    {
      id: 'hof',
      name: T.kirche.hof.name,
      shape: R(924, 384, 36, 86),
      walkTo: { x: 944, y: 432, face: 1 as const },
      exit: { room: 'et_hof', entry: 'kirche' },
      exitDir: 'right',
      exitBlocked: (s) => (phase(s) === 'n11' ? T.kirche.hof.fire : null),
      on: { look: T.kirche.hof.look },
    },
  ],
};

// ------------------------------------------------------------------------------- the burning lane

const HOUSE_DOOR = { x: 705, y: 388, face: 1 as const };

function* wetCloth(c: ScriptCtx): Script {
  if (!c.has('tuch')) return;
  yield walk(PC, 236, 446, { face: -1 });
  c.drop('tuch');
  c.give('tuch_nass');
  yield say(PC, T.gasse.eimer.cloth);
}

function* enterHouse(c: ScriptCtx): Script {
  if (c.is(f('carrying'))) {
    yield say(PC, T.gasse.haus.withBoy);
    return;
  }
  if (c.is(f('boyOut'))) {
    yield say(PC, T.gasse.haus.withBoy);
    return;
  }
  if (!c.is(f('entered'))) {
    c.set(f('entered'));
    yield say(PC, T.gasse.haus.enter);
  }
  yield room('et_innen', 'door');
}

const gasse: RoomDef = {
  id: 'et_gasse',
  title: T.rooms.gasse,
  bg: 'bg_et_brand',
  width: 960,
  perspective: persp2(368, 158, 460, 206),
  actorTint: 0xe0aa84,
  walk: [{ outer: [0, 465, 960, 465, 940, 440, 860, 410, 770, 382, 600, 380, 440, 384, 390, 374, 250, 374, 212, 394, 216, 446, 0, 452] }],
  entries: {
    arrive: { x: 60, y: 456, face: 1 },
    kirche: { x: 60, y: 456, face: 1 },
    house: { x: 705, y: 390, face: -1 },
  },
  assets: ['bg_et_brand'],
  decor: [
    { id: 'menge', character: 'crowd', x: 330, y: 405 },
    { id: 'dach1', character: 'fire_et', x: 520, y: 182, scale: 0.5, alpha: 0.95, depth: -30000, phase: 0.3 },
    { id: 'dach2', character: 'fire_et', x: 700, y: 120, scale: 0.42, alpha: 0.9, depth: -30000, phase: 1.1 },
    { id: 'dach3', character: 'fire_et', x: 860, y: 96, scale: 0.38, alpha: 0.85, depth: -30000, phase: 0.7 },
    { id: 'tuerfeuer', character: 'fire_et', x: 684, y: 360, scale: 0.3, alpha: 0.9, depth: -30000, phase: 0.5 },
  ],
  ambient: [{ fx: 'motes', x: 420, y: 0, params: { area: '420,0,520,220', count: 30, vx: 8, vy: -46, size: 5, alpha: 0.9, tint: 0xffa040, depth: -20000 } }],
  hotspots: [
    {
      id: 'tuer',
      name: T.gasse.haus.name,
      shape: R(655, 180, 105, 182),
      walkTo: HOUSE_DOOR,
      priority: 2,
      exit: { room: 'et_innen', entry: 'door' },
      exitDir: 'up',
      verbs: ['go', 'look'],
      on: { go: enterHouse, use: enterHouse, look: T.gasse.haus.look },
    },
    { id: 'haus', name: T.gasse.haus.name, shape: R(430, 60, 530, 300), walkTo: null, on: { look: T.gasse.haus.look } },
    {
      id: 'eimer',
      name: T.gasse.eimer.name,
      shape: R(75, 345, 130, 95),
      walkTo: { x: 236, y: 446, face: -1 as const },
      priority: 1,
      verbs: ['look', 'use'],
      on: { look: T.gasse.eimer.look, use: T.gasse.eimer.use },
      items: { tuch: wetCloth, tuch_nass: (c: ScriptCtx) => lines(PC, T.gasse.eimer.wetAlready) },
      anyItem: () => T.gasse.eimer.use,
    },
    {
      id: 'menge',
      name: T.gasse.menschen.name,
      decor: 'menge',
      walkTo: null,
      verbs: (s) => (fl(s, 'carrying') ? ['look', 'give', 'talk'] : ['look', 'talk']),
      on: { look: T.gasse.menschen.look, talk: T.gasse.menschen.talk, give: T.gasse.menschen.give },
    },
    {
      id: 'erde',
      name: T.gasse.erde.name,
      shape: R(0, 372, 72, 70),
      visible: is('carrying'),
      walkTo: null,
      priority: -1,
      verbs: ['lay'],
      on: { lay: T.gasse.erde.lay },
    },
    {
      id: 'kirche',
      name: T.gasse.kirche.name,
      shape: R(0, 442, 34, 28),
      walkTo: { x: 14, y: 456, face: -1 as const },
      exit: { room: 'et_kirche', entry: 'gasse' },
      exitDir: 'left',
      exitBlocked: (s) => (fl(s, 'carrying') || fl(s, 'laid') ? null : T.gasse.kirche.notYet),
      on: { look: T.gasse.kirche.look },
    },
  ],
  prepare: (c: ScriptCtx) => c.place(PC, { gait: c.is(f('carrying')) ? 'carry' : 'walk', pose: c.is(f('carrying')) ? 'carryStand' : 'stand', hidden: false }),
  onEnter: function* (c: ScriptCtx): Script {
    if (!c.seen('et.gasse')) {
      c.mark('et.gasse');
      yield narrate(T.kirche.nightStart);
      c.journal('fire');
      yield checkpoint();
      return;
    }
    if (c.is(f('carrying')) && !c.seen('et.refused')) {
      // Out of the smoke with the boy: nobody takes him.
      c.mark('et.refused');
      yield walk(PC, 404, 452, { face: -1 });
      yield say(PC, T.gasse.menschen.give);
      yield say(PC, T.gasse.frau.lookAfter);
    }
  },
};

// ------------------------------------------------------------------------------ inside the house

const BEAM_SPOT = { x: 470, y: 424, face: 1 as const };
const BOY_SPOT = { x: 596, y: 430, face: 1 as const };
const crawling = (s: GameState) => fl(s, 'crawling');

function* crawlIn(c: ScriptCtx): Script {
  if (c.is(f('carrying'))) {
    yield say(PC, T.innen.junge.carried);
    return;
  }
  if (crawling(c.s)) {
    yield say(PC, T.innen.weg.crawlN);
    return;
  }
  c.set(f('crawling'));
  c.place(PC, { gait: 'crawl', pose: 'crawlRest' });
  yield walk(PC, 230, 420, { face: 1 });
  yield say(PC, T.innen.weg.crawlN);
}

function* pushBeam(c: ScriptCtx): Script {
  if (c.is(f('beamPushed'))) {
    yield say(PC, T.innen.balken.look);
    return;
  }
  if (!crawling(c.s)) {
    yield say(PC, T.innen.balken.noCrawl);
    return;
  }
  yield walk(PC, BEAM_SPOT.x, BEAM_SPOT.y, { face: 1 });
  yield say(PC, T.innen.balken.push);
  yield shake(0.3, 3);
  c.set(f('beamPushed'));
  yield narrate(T.innen.balken.pushN);
}

function* clothBoy(c: ScriptCtx): Script {
  if (!c.is(f('beamPushed'))) {
    yield say(PC, T.innen.junge.notYet);
    return;
  }
  if (!crawling(c.s)) {
    yield say(PC, T.innen.balken.noCrawl);
    return;
  }
  yield walk(PC, BOY_SPOT.x, BOY_SPOT.y, { face: 1 });
  c.drop('tuch_nass');
  c.set(f('clothOn'));
  yield say(PC, T.innen.junge.cloth);
}

/** Taking him from under the table: the beam comes down, Mijo covers the boy with his back. */
function* takeBoy(c: ScriptCtx): Script {
  if (!c.is(f('beamPushed'))) {
    yield say(PC, T.innen.junge.notYet);
    return;
  }
  if (!crawling(c.s)) {
    yield say(PC, T.innen.balken.noCrawl);
    return;
  }
  if (!c.is(f('clothOn'))) {
    yield say(PC, c.has('tuch') ? T.innen.junge.dryCloth : T.innen.junge.noCloth);
    return;
  }
  yield walk(PC, BOY_SPOT.x, BOY_SPOT.y, { face: 1 });
  yield checkpoint();
  c.place(JUNGE, { hidden: true });
  yield narrate(T.innen.junge.beamN);
  yield pose(PC, 'beam', { rest: true });
  yield shake(0.5, 6);
  yield narrate(T.innen.junge.beamN2);
  c.set(f('fallen'));
  c.set(f('carrying'));
  c.unset(f('crawling'));
  c.place(JUNGE, { room: null });
  c.place(PC, { pose: 'carryStand', gait: 'carry' });
  c.journal('fire', 'done');
  c.journal('boy');
  yield say(PC, T.innen.junge.carry);
}

function* leaveHouse(c: ScriptCtx): Script {
  if (c.is(f('carrying'))) {
    c.set(f('boyOut'));
    c.journal('boy', 'done');
    c.journal('step');
  }
  c.unset(f('crawling'));
  yield room('et_gasse', 'house');
}

const innen: RoomDef = {
  id: 'et_innen',
  title: T.rooms.innen,
  bg: 'bg_et_innen',
  width: 960,
  perspective: persp2(355, 240, 460, 290),
  actorTint: 0xd8a888,
  layerTint: 0xc89070,
  noWalk: (s) => !crawling(s) && !fl(s, 'carrying'),
  noWalkSay: T.innen.weg.walk,
  walk: [{ outer: [60, 465, 900, 465, 900, 420, 840, 384, 640, 380, 560, 374, 300, 374, 160, 364, 60, 370] }],
  entries: { door: { x: 112, y: 374, face: 1 } },
  assets: ['bg_et_innen', 'prop_balken'],
  layers: [
    { id: 'balken', image: 'prop_balken', x: 0, y: 0, rect: [548, 322, 150, 116] as Rect4, depth: 436, visible: not('beamPushed') },
    { id: 'balkenSeite', image: 'prop_balken', x: 0, y: 0, rect: [716, 352, 150, 116] as Rect4, depth: 466, visible: is('beamPushed') },
    { id: 'gefallen', image: 'prop_balken', x: 0, y: 0, rect: [500, 360, 120, 93] as Rect4, depth: 452, visible: is('fallen') },
  ],
  decor: [
    { id: 'glut', character: 'fire_et', x: 615, y: 372, scale: 0.27, alpha: 0.95, phase: 0.2, depth: 437, visible: not('beamPushed') },
    { id: 'glutSeite', character: 'fire_et', x: 790, y: 402, scale: 0.27, alpha: 0.95, phase: 0.6, depth: 467, visible: is('beamPushed') },
  ],
  hotspots: [
    {
      id: 'hinaus',
      name: T.innen.hinaus.name,
      shape: R(46, 91, 103, 264),
      walkTo: { x: 112, y: 376, face: -1 as const },
      priority: 2,
      exit: { room: 'et_gasse', entry: 'house' },
      exitDir: 'left',
      verbs: ['go', 'look'],
      on: { go: leaveHouse, use: leaveHouse, look: T.innen.hinaus.look },
    },
    {
      // The smoke under the ceiling: upright there is no way through.
      id: 'weg',
      name: T.innen.weg.name,
      shape: R(160, 10, 440, 170),
      walkTo: null,
      priority: -1,
      verbs: (s) => (fl(s, 'carrying') ? ['look'] : ['go', 'crawl', 'look']),
      on: { look: T.innen.weg.walk, go: (c: ScriptCtx) => lines(PC, crawling(c.s) ? T.innen.weg.crawlN : T.innen.weg.walk), crawl: crawlIn },
    },
    { id: 'kammer', name: T.innen.kammer.name, shape: R(170, 180, 150, 150), walkTo: null, on: { look: T.innen.kammer.look } },
    { id: 'feuer', name: T.innen.feuer.name, shape: R(440, 200, 110, 100), walkTo: null, on: { look: T.innen.feuer.look } },
    { id: 'tisch', name: T.innen.tisch.name, shape: R(600, 196, 360, 50), walkTo: null, on: { look: T.innen.tisch.look } },
    {
      id: 'balken',
      name: T.innen.balken.name,
      shape: R(548, 330, 150, 108),
      visible: not('beamPushed'),
      walkTo: null,
      priority: 3,
      verbs: ['look', 'push'],
      on: { look: T.innen.balken.look, push: pushBeam, use: pushBeam },
    },
  ],
  prepare: (c: ScriptCtx) => {
    // Every entry starts upright at the door; the smoke forces him down again.
    c.unset(f('crawling'));
    c.place(PC, { gait: 'walk', pose: 'stand' });
  },
  onEnter: function* (c: ScriptCtx): Script {
    if (c.seen('et.innen')) return;
    c.mark('et.innen');
    yield say(PC, T.innen.weg.walk);
  },
};

// ------------------------------------------------------------------------------------- chapter

export const elftageChapter: ChapterDef = {
  id: 'elftage',
  title: T.title,
  dateline: T.dateline,
  card: { image: 'bg_et_hof', lines: T.card },
  pc: { character: 'mijo_et', name: T.names.mijo, color: C.pc, relHeight: 1 },
  start: { room: 'et_hof', entry: 'start' },
  next: 'zaesur',
  journal: T.journal,
  items: [
    {
      id: 'sense',
      name: T.items.sense.name,
      icon: 'sense',
      look: (c: ScriptCtx) => lines(PC, c.is(f('sharp')) ? T.items.sense.lookSharp : T.items.sense.look),
      combine: { wetzstein: sharpen },
    },
    { id: 'brett', name: T.items.brett.name, icon: 'brett', look: T.items.brett.look },
    { id: 'klotz', name: T.items.klotz.name, icon: 'klotz', look: T.items.klotz.look },
    { id: 'seil', name: T.items.seil.name, icon: 'seil', look: T.items.seil.look },
    { id: 'wetzstein', name: T.items.wetzstein.name, icon: 'wetzstein', look: T.items.wetzstein.look, combine: { sense: sharpen } },
    { id: 'tuch', name: T.items.tuch.name, icon: 'tuch', look: T.items.tuch.look },
    { id: 'tuch_nass', name: T.items.tuchNass.name, icon: 'tuch_nass', look: T.items.tuchNass.look },
  ],
  self: {
    name: (s) => (fl(s, 'cut') && !fl(s, 'healedSeen') ? T.stall.hand.name : T.names.mijo),
    visible: (s) => !fl(s, 'carrying') && s.room !== 'et_innen',
    verbs: ['look'],
    on: {
      look: function* (c: ScriptCtx): Script {
        if (c.is(f('cut'))) yield* lookHand(c);
        else yield say(PC, T.stall.self.look);
      },
    },
  },
  actors: [
    {
      id: ZIEGEN,
      name: T.stall.ziegen.name,
      character: 'ziegen_et',
      relHeight: 0.46,
      color: C.ziegen,
      start: { room: 'et_stall', x: 868, y: 424, facing: -1, pose: 'stand' },
      verbs: ['look'],
      on: { look: goatsLook },
      anyItem: scytheElsewhere,
    },
    {
      id: ONKEL,
      name: T.names.onkel,
      character: 'uncle_et',
      color: C.onkel,
      start: { room: 'et_feld', x: 700, y: 396, facing: -1, pose: 'mow' },
      verbs: ['look', 'talk'],
      talkSpot: { x: 590, y: 406, face: 1 },
      on: { look: (c: ScriptCtx) => lines(PC, uncleLook(c.s)), talk: uncleTalk },
      items: { sense: showScythe },
    },
    {
      id: JUNGE,
      name: T.names.junge,
      character: 'boy_et',
      relHeight: 1.08,
      color: C.junge,
      start: { room: 'et_innen', x: 700, y: 352, facing: 1, pose: 'under' },
      verbs: (s) => (s.room === 'et_innen' ? ['look', 'take'] : ['look']),
      talkSpot: BOY_SPOT,
      on: {
        look: (c: ScriptCtx) => lines(PC, c.s.room === 'et_innen' && !c.is(f('beamPushed')) ? T.innen.junge.lookFar : T.innen.junge.look),
        take: takeBoy,
        carry: takeBoy,
      },
      items: { tuch_nass: clothBoy, tuch: (c: ScriptCtx) => lines(PC, T.innen.junge.dryCloth) },
    },
    {
      id: FRAU,
      name: T.names.frau,
      character: 'frau_et',
      color: C.frau,
      start: { room: 'et_gasse', x: 560, y: 450, facing: 1, pose: 'held' },
      verbs: (s) => (fl(s, 'carrying') ? ['look', 'give'] : ['look']),
      talkSpot: { x: 470, y: 446, face: 1 },
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('boyOut')) ? T.gasse.frau.lookAfter : T.gasse.frau.look),
        give: (c: ScriptCtx) => lines(PC, T.gasse.frau.lookAfter),
        talk: (c: ScriptCtx) => lines(PC, T.gasse.menschen.talk),
      },
    },
  ],
  dialogues: [],
  hint: (s) => {
    const p = phase(s);
    switch (p) {
      case 'pre':
        return { id: 'et.door', steps: T.hints.door };
      case 'n1':
        return { id: 'et.night', steps: T.hints.night };
      case 'm3':
        if (!fl(s, 'eaten')) return s.room === 'et_stall' ? { id: 'et.morning', steps: T.hints.morning } : { id: 'et.family', steps: T.hints.family };
        if (fl(s, 'cut') && !fl(s, 'handOpenSeen')) return { id: 'et.hand', steps: T.hints.hand };
        return { id: 'et.bed', steps: T.hints.bed };
      case 'e3':
        return { id: 'et.evening', steps: T.hints.evening };
      case 'p6':
        return { id: 'et.steps', steps: T.hints.steps };
      case 'd6':
        return fl(s, 'uncleGone') ? { id: 'et.mown', steps: T.hints.mown } : { id: 'et.field', steps: T.hints.field };
      case 'e6':
        return { id: 'et.church', steps: T.hints.church };
      default:
        if (s.room === 'et_innen') return { id: 'et.inside', steps: T.hints.inside };
        if (fl(s, 'carrying')) return s.room === 'et_kirche' ? { id: 'et.step', steps: T.hints.step } : { id: 'et.out', steps: T.hints.out };
        return { id: 'et.fire', steps: T.hints.fire };
    }
  },
  setup: (c: ScriptCtx) => {
    setPhase(c, 'pre');
    c.place(PC, { pose: 'stand', gait: 'walk' });
  },
  intro: function* (c: ScriptCtx): Script {
    yield narrate(T.intro);
    c.journal('door');
  },
  rooms: [hof, stall, feld, kirche, gasse, innen],
};
