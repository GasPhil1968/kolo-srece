// Kapitel 2 – Der Steinblock. Oberes Neretva-Tal, Frühsommer 1467. Mijo ist zwölf.
// Puzzle chain: count the flock -> goat hair in the juniper -> fallen stone, the goat in the hollow
// behind the wall -> calling and climbing fail -> a juniper sprig, crushed, laid UPWIND at the end of
// the wall (the morning wind blows from the valley) -> the goat climbs out. Then the Steinblock: watch
// the Ragusan caravan (riders in the middle of the road and silent; bales hop = cloth; slow mule with
// small sacks = salt), answer the father, hear his two lessons. Evening: lie on the children's bench
// and listen; asking aloud stops the adults, staying still hears the rest.
import type { ChapterDef, ScriptCtx } from '../../core/content';
import type { Script } from '../../core/cmd';
import { checkpoint, endChapter, face, fade, narrate, pose, room, say, wait, walk } from '../../core/cmd';
import type { GameState } from '../../core/state';
import { T } from '../text/de/c02_weide';
import { flags, PC, persp, R } from '../util';

const f = flags('we');
const OTAC = 'otac';
const ANDJA = 'andja';
const KOM = 'komsija';
const GOAT = 'gescheckte';
const C = { pc: '#e9d7b0', otac: '#d7b98f', andja: '#e7a99a', kom: '#b9c99a' };
type Rect4 = [number, number, number, number];
const is = (n: string) => (s: GameState) => !!s.flags[f(n)];
const not = (n: string) => (s: GameState) => !s.flags[f(n)];

function* lines(actor: string, l: string | readonly string[]): Script {
  for (const t of typeof l === 'string' ? [l] : l) yield say(actor, t);
}

// ------------------------------------------------------------------------------------ the pasture

/** The goat hears the scent: she climbs out of the hollow behind the wall and eats at the wall's end. */
function* lureScript(c: ScriptCtx): Script {
  if (c.is(f('goatBack'))) return;
  if (!c.is(f('found'))) {
    yield say(PC, T.weide.mauerEnde.notYet);
    return;
  }
  yield walk(PC, 722, 390, { face: 1 });
  yield* lines(PC, T.weide.mauerEnde.lure);
  c.drop('wacholder');
  c.set(f('baitLaid'));
  yield walk(PC, 548, 404, { face: 1 });
  yield say(PC, T.weide.mauerEnde.wait);
  yield wait(1.2);
  c.place(GOAT, { room: 'we_weide', x: 1086, y: 334, hidden: false, facing: -1 });
  yield walk(GOAT, 760, 352, { direct: true, via: [[1004, 302], [905, 299], [812, 306], [764, 330]], speed: 80 });
  yield say(PC, T.weide.mauerEnde.there);
  yield pose(GOAT, 'eat', { loop: true });
  c.set(f('goatBack'));
  c.journal('goat', 'done');
  c.journal('lure', 'done');
  yield walk(OTAC, 640, 392, { face: -1 });
  yield face(PC, OTAC);
  yield say(OTAC, T.weide.goatDone.q);
  yield say(PC, c.is(f('called')) ? T.weide.goatDone.aCalled : T.weide.goatDone.aSilent);
  yield say(OTAC, T.weide.goatDone.q2);
  yield say(PC, T.weide.goatDone.a2);
  yield wait(0.5);
  yield say(OTAC, T.weide.climb.father);
  c.journal('stone');
  yield walk(GOAT, 724, 368, { direct: true, speed: 50 });
  yield pose(GOAT, 'graze', { loop: true });
}

function* climbScript(c: ScriptCtx): Script {
  if (!c.is(f('counted'))) {
    yield say(PC, T.weide.stein.notCounted);
    return;
  }
  if (!c.is(f('goatBack'))) {
    yield say(PC, T.weide.stein.missing);
    return;
  }
  if (c.is(f('lesson'))) {
    yield say(PC, T.weide.stein.done);
    return;
  }
  yield walk(OTAC, 652, 388, { face: -1 });
  yield fade(1, 0.6);
  c.set(f('sitting'));
  c.place(PC, { x: 626, y: 392, hidden: true });
  c.place(OTAC, { hidden: true });
  yield fade(0, 0.8);
  yield say(OTAC, T.weide.climb.up1);
  yield say(OTAC, T.weide.climb.up2);
  c.journal('stone', 'done');
  c.journal('road');
}

/** After the last answer: down from the block, the flock goes home. */
function* climbDown(c: ScriptCtx): Script {
  yield fade(1, 0.6);
  c.unset(f('sitting'));
  c.place(PC, { x: 606, y: 396, hidden: false, facing: -1 });
  c.place(OTAC, { x: 660, y: 392, hidden: false, facing: -1 });
  yield fade(0, 0.8);
  c.journal('home');
}

const weide = {
  id: 'we_weide',
  title: T.rooms.weide,
  bg: 'bg_weide',
  width: 1180,
  perspective: persp(110, 395, 169),
  walk: [{ outer: [40, 468, 1100, 468, 1100, 436, 1040, 420, 960, 404, 840, 392, 730, 384, 520, 386, 480, 406, 40, 412] }],
  entries: {
    start: { x: 96, y: 440, face: 1 as const },
    stein: { x: 626, y: 392, face: 1 as const },
  },
  layers: [
    { id: 'wall', image: 'occ_weide_wall', x: 0, y: 0, rect: [735, 274, 445, 95] as Rect4, depth: 352 },
    { id: 'juniper', image: 'prop_juniper_wool', x: 0, y: 0, rect: [404, 336, 96, 80] as Rect4, depth: 416 },
    {
      id: 'sitters',
      image: 'prop_stone_sitters',
      x: 0,
      y: 0,
      rect: [584, 86, 79, 60] as Rect4,
      depth: 240,
      visible: is('sitting'),
      speakers: { [OTAC]: 0.27, [PC]: 0.74 },
    },
  ],
  decor: [
    { id: 'g1', character: 'goat', anim: 'graze', x: 528, y: 354, facing: 1 as const, relHeight: 0.48 },
    { id: 'g2', character: 'goat', anim: 'graze', x: 664, y: 360, facing: -1 as const, relHeight: 0.48, phase: 4.1 },
    { id: 'g3', character: 'goat', anim: 'graze', x: 604, y: 338, facing: 1 as const, relHeight: 0.48, phase: 8.3 },
  ],
  ambient: [
    { fx: 'motes', x: 0, y: 140, params: { area: '0,150,1180,300', count: 56, vx: 44, vy: -5, size: 13, alpha: 0.8 } },
    { fx: 'birds', x: 60, y: 30, params: { area: '40,24,520,70', count: 2, speed: 40, scale: 0.15 } },
  ],
  hotspots: [
    {
      id: 'herde',
      name: T.weide.herde.name,
      shape: { poly: [60, 228, 920, 228, 920, 300, 724, 340, 700, 374, 524, 374, 500, 338, 60, 338] },
      visible: not('sitting'),
      walkTo: { x: 520, y: 396, face: 1 as const },
      verbs: ['look', 'count', 'take'],
      on: {
        look: countScript,
        count: countScript,
        take: T.weide.herde.take,
      },
      items: { wacholder: T.weide.wacholder.lure },
    },
    {
      id: 'wacholder',
      name: T.weide.wacholder.name,
      shape: R(400, 332, 104, 86),
      priority: 3,
      visible: not('sitting'),
      walkTo: { x: 382, y: 426, face: 1 as const },
      on: {
        look: function* (c: ScriptCtx): Script {
          if (c.is(f('goatBack'))) {
            yield say(PC, T.weide.wacholder.lookAfter);
            return;
          }
          if (!c.is(f('counted'))) {
            yield say(PC, T.weide.wacholder.look);
            return;
          }
          c.set(f('trail'));
          yield* lines(PC, T.weide.wacholder.lookTrail);
        },
        take: function* (c: ScriptCtx): Script {
          if (c.has('wacholder') || c.is(f('baitLaid'))) {
            yield say(PC, T.weide.wacholder.takeAgain);
            return;
          }
          c.give('wacholder');
          yield say(PC, T.weide.wacholder.take);
        },
      },
      items: { wacholder: T.weide.wacholder.lure },
    },
    {
      id: 'mauer',
      name: T.weide.mauer.name,
      shape: R(830, 278, 210, 88),
      visible: not('sitting'),
      walkTo: { x: 900, y: 400, face: 1 as const },
      verbs: (s: GameState) => (s.flags[f('found')] && !s.flags[f('goatBack')] ? ['look', 'call', 'climb'] : ['look', 'call']),
      on: {
        look: function* (c: ScriptCtx): Script {
          if (c.is(f('goatBack'))) {
            yield say(PC, T.weide.mauer.look[0]);
            return;
          }
          if (c.is(f('found'))) {
            yield say(PC, T.weide.mauer.lookFound);
            return;
          }
          if (!c.is(f('trail'))) {
            yield* lines(PC, T.weide.mauer.look);
            return;
          }
          yield* lines(PC, T.weide.mauer.lookTrail);
          c.set(f('found'));
          c.journal('lure');
        },
        call: function* (c: ScriptCtx): Script {
          if (c.is(f('goatBack'))) {
            yield say(PC, T.weide.herde.full[0]);
            return;
          }
          if (!c.is(f('found'))) {
            yield say(PC, T.weide.mauer.callBefore);
            return;
          }
          c.set(f('called'));
          yield* lines(PC, T.weide.mauer.call);
        },
        climb: (c: ScriptCtx) => lines(PC, c.is(f('found')) ? T.weide.mauer.climb : T.weide.mauer.look),
      },
      items: { wacholder: (c: ScriptCtx) => lines(PC, c.is(f('found')) ? T.weide.mauer.lure : T.weide.mauerEnde.notYet) },
    },
    {
      id: 'mauerEnde',
      name: T.weide.mauerEnde.name,
      shape: R(735, 318, 95, 54),
      priority: 2,
      visible: not('sitting'),
      walkTo: { x: 720, y: 390, face: 1 as const },
      on: { look: T.weide.mauerEnde.look },
      items: { wacholder: lureScript },
    },
    {
      id: 'mauerBaum',
      name: T.weide.mauerBaum.name,
      shape: R(1040, 268, 140, 88),
      visible: not('sitting'),
      walkTo: { x: 1040, y: 424, face: 1 as const },
      on: { look: T.weide.mauerBaum.look },
      items: { wacholder: (c: ScriptCtx) => lines(PC, c.is(f('found')) ? T.weide.mauerBaum.lure : T.weide.mauerEnde.notYet) },
    },
    {
      id: 'wind',
      name: T.weide.wind.name,
      shape: R(600, 0, 580, 70),
      visible: not('sitting'),
      walkTo: null,
      on: { look: T.weide.wind.look },
    },
    {
      id: 'stein',
      name: T.weide.stein.name,
      shape: R(512, 116, 226, 120),
      visible: not('sitting'),
      walkTo: { x: 624, y: 390, face: 1 as const },
      verbs: ['look', 'climb'],
      on: { look: T.weide.stein.look, climb: climbScript, use: climbScript },
      items: { wacholder: (c: ScriptCtx) => lines(PC, c.is(f('found')) ? ['Zu weit weg von ihr. Bis der Geruch bei ihr ist, hat der Wind ihn zerrissen.'] : [T.weide.mauerEnde.notYet]) },
    },
    { id: 'tal', name: T.weide.tal.name, shape: R(0, 112, 500, 106), visible: not('sitting'), walkTo: null, on: { look: T.weide.tal.look } },
    { id: 'baum', name: T.weide.baum.name, shape: R(880, 42, 185, 190), visible: not('sitting'), walkTo: null, on: { look: T.weide.baum.look } },
    { id: 'mauerLinks', name: T.weide.mauerLinks.name, shape: R(0, 298, 410, 104), visible: not('sitting'), walkTo: null, on: { look: T.weide.mauerLinks.look } },
    {
      id: 'pfad',
      name: T.weide.pfad.name,
      shape: R(0, 380, 46, 90),
      visible: not('sitting'),
      walkTo: { x: 52, y: 440, face: -1 as const },
      exit: { room: 'we_kuca', entry: 'door' },
      exitDir: 'left' as const,
      exitBlocked: (s: GameState) => (!s.flags[f('goatBack')] ? T.weide.pfad.blockedGoat : !s.flags[f('lesson')] ? T.weide.pfad.blockedFather : null),
      on: { look: T.weide.pfad.look },
    },
    // Seated on the Steinblock.
    {
      id: 'strasse',
      name: T.weide.sitting.strasse,
      shape: R(0, 112, 500, 120),
      visible: is('sitting'),
      walkTo: null,
      exit: { room: 'we_tal', entry: 'view' },
      exitDir: 'left' as const,
      on: { look: T.weide.sitting.strasseLook },
    },
    {
      id: 'vaterSitzend',
      name: T.weide.sitting.vater,
      shape: R(584, 84, 40, 62),
      visible: is('sitting'),
      walkTo: null,
      priority: 3,
      verbs: ['look', 'talk'],
      on: { look: T.weide.sitting.vaterLook, talk: (c: ScriptCtx) => askPending(c, true) },
    },
    {
      id: 'hinunter',
      name: T.weide.sitting.down,
      shape: R(512, 146, 226, 90),
      visible: is('sitting'),
      walkTo: null,
      verbs: ['look', 'down'],
      on: { look: T.weide.sitting.downLook, down: (c: ScriptCtx) => (c.is(f('lesson')) ? climbDown(c) : lines(PC, T.weide.sitting.downEarly)) },
    },
  ],
  rules: [{ id: 'down', when: (s: GameState) => !!s.flags[f('sitting')] && !!s.flags[f('lesson')], run: climbDown, repeat: true }],
};

function* countScript(c: ScriptCtx): Script {
  if (c.is(f('goatBack'))) {
    yield* lines(PC, T.weide.herde.full);
    return;
  }
  if (c.is(f('counted'))) {
    yield say(PC, T.weide.herde.again);
    return;
  }
  yield* lines(PC, T.weide.herde.count);
  c.set(f('counted'));
  c.journal('count', 'done');
  c.journal('goat');
}

// ------------------------------------------------------------------------------ the caravan view

const RIDER_PATH: [number, number][] = [
  [330, 452],
  [1430, 452],
];
const PERIOD = 54;
const GAP = 2.9;
const riders = [0, 1, 2, 3, 4, 5].map((i) => ({
  id: `r${i}`,
  character: i % 2 === 0 ? 'reiter_a' : 'reiter_b',
  x: 330,
  y: 452,
  relHeight: 1.33,
  motion: { path: RIDER_PATH, speed: 40, period: PERIOD, offset: -i * GAP, fade: 60 },
}));

const tal = {
  id: 'we_tal',
  title: T.rooms.tal,
  bg: 'bg_taltest',
  width: 1760,
  perspective: persp(150, 452, 79),
  walk: [{ outer: [0, 440, 1760, 440, 1760, 470, 0, 470] }],
  entries: { view: { x: 880, y: 455, face: 1 as const } },
  decor: [
    ...riders,
    { id: 'b0', character: 'ballen', x: 0, y: 0, relHeight: 0.2876, follow: { id: 'r0', dx: -58, dy: -136, bob: 5, bobHz: 2 } },
    { id: 'b2', character: 'ballen', x: 0, y: 0, relHeight: 0.2876, follow: { id: 'r2', dx: -58, dy: -136, bob: 5, bobHz: 2 } },
    { id: 'b4', character: 'ballen', x: 0, y: 0, relHeight: 0.2876, follow: { id: 'r4', dx: -58, dy: -136, bob: 5, bobHz: 2 } },
    {
      id: 'mule',
      character: 'maultier',
      x: 330,
      y: 452,
      relHeight: 0.86,
      motion: { path: RIDER_PATH, speed: 33, period: PERIOD, offset: -6 * GAP - 1.5, fade: 60 },
    },
  ],
  ambient: [{ fx: 'birds', x: 400, y: 40, params: { area: '420,30,900,90', count: 3, speed: 36, scale: 0.13 } }],
  hotspots: [
    ...riders.map((r) => ({
      id: `reiter${r.id.slice(1)}`,
      name: T.tal.reiter.name,
      decor: r.id,
      walkTo: null,
      priority: 5,
      on: { look: lookRiders },
    })),
    ...['b0', 'b2', 'b4'].map((b) => ({ id: `ballen${b.slice(1)}`, name: T.tal.ballen.name, decor: b, walkTo: null, priority: 6, on: { look: lookBales } })),
    { id: 'maultier', name: T.tal.maultier.name, decor: 'mule', walkTo: null, priority: 5, on: { look: lookMule } },
    { id: 'strasseTal', name: T.tal.strasse.name, shape: R(330, 418, 1100, 50), walkTo: null, on: { look: (c: ScriptCtx) => lookAndAsk(c, T.tal.strasse.look) } },
    { id: 'fluss', name: T.tal.fluss.name, shape: R(560, 226, 280, 92), walkTo: null, on: { look: (c: ScriptCtx) => lookAndAsk(c, T.tal.fluss.look) } },
    { id: 'stadt', name: T.tal.stadt.name, shape: R(860, 222, 300, 76), walkTo: null, on: { look: (c: ScriptCtx) => lookAndAsk(c, T.tal.stadt.look) } },
    {
      id: 'zurueck',
      name: T.tal.zurueck.name,
      shape: R(400, 0, 960, 56),
      walkTo: null,
      exit: { room: 'we_weide', entry: 'stein' },
      exitDir: 'up' as const,
      on: { look: T.tal.zurueck.look },
    },
  ],
  onEnter: function* (c: ScriptCtx): Script {
    if (!c.seen('we.talEntered')) {
      c.mark('we.talEntered');
      yield say(OTAC, T.tal.enter);
    }
  },
};

function* lookAndAsk(c: ScriptCtx, text: string): Script {
  yield say(PC, text);
  yield* askPending(c, false);
}

function* lookRiders(c: ScriptCtx): Script {
  if (!c.is(f('obsMiddle'))) {
    c.set(f('obsMiddle'));
    yield* lines(PC, T.tal.reiter.middle);
  } else if (!c.is(f('obsQuiet'))) {
    c.set(f('obsQuiet'));
    yield* lines(PC, T.tal.reiter.quiet);
  } else yield say(PC, T.tal.reiter.both);
  yield* askPending(c, false);
}

function* lookBales(c: ScriptCtx): Script {
  c.set(f('obsBales'));
  yield* lines(PC, T.tal.ballen.look);
  yield* askPending(c, false);
}

function* lookMule(c: ScriptCtx): Script {
  c.set(f('obsMule'));
  yield* lines(PC, T.tal.maultier.look);
  yield* askPending(c, false);
}

/** The father asks the next question once Mijo has seen what it needs (or when spoken to). */
function* askPending(c: ScriptCtx, spokenTo: boolean): Script {
  if (c.is(f('lesson'))) {
    if (spokenTo) yield say(OTAC, T.tal.lessonEnd);
    return;
  }
  if (!c.is(f('q1'))) {
    const ready = c.is(f('obsMiddle')) && c.is(f('obsQuiet'));
    if (!ready && !spokenTo) return;
    if (!ready) {
      yield say(PC, T.tal.noAnswerYet);
      yield say(OTAC, T.tal.laterA);
      return;
    }
    yield* question1(c);
    if (!c.is(f('q1'))) return;
  }
  if (!c.is(f('q2'))) {
    const ready = c.is(f('obsBales')) && c.is(f('obsMule'));
    if (!ready) {
      if (spokenTo || !c.seen('we.q2Asked')) {
        c.mark('we.q2Asked');
        yield say(OTAC, T.tal.q2Wait);
      }
      return;
    }
    yield* question2(c);
    if (!c.is(f('q2'))) return;
  }
  yield* question3(c);
}

function* question1(c: ScriptCtx): Script {
  yield say(OTAC, T.tal.q1);
  const pick: string = yield {
    k: 'choice',
    options: [
      { id: 'turks', text: T.tal.q1Turks },
      { id: 'hung', text: T.tal.q1Hung },
      { id: 'rag', text: T.tal.q1Rag },
      { id: 'later', text: T.tal.later },
    ],
  };
  if (pick === 'later') {
    yield say(PC, T.tal.later);
    yield say(OTAC, T.tal.laterA);
    return;
  }
  if (pick === 'turks') {
    yield say(PC, T.tal.q1Turks);
    yield say(OTAC, T.tal.q1TurksA);
    return;
  }
  if (pick === 'hung') {
    yield say(PC, T.tal.q1Hung);
    yield say(OTAC, T.tal.q1HungA);
    return;
  }
  yield say(PC, T.tal.q1Rag);
  yield say(OTAC, T.tal.q1RagA);
  yield say(PC, T.tal.q1RagB);
  yield say(OTAC, T.tal.q1RagC);
  c.set(f('q1'));
}

function* question2(c: ScriptCtx): Script {
  yield say(OTAC, T.tal.q2);
  const pick: string = yield {
    k: 'choice',
    options: [
      { id: 'grain', text: T.tal.q2Grain },
      { id: 'arms', text: T.tal.q2Arms },
      { id: 'cloth', text: T.tal.q2Cloth },
      { id: 'later', text: T.tal.later },
    ],
  };
  if (pick === 'later') {
    yield say(PC, T.tal.later);
    yield say(OTAC, T.tal.laterA);
    return;
  }
  if (pick === 'grain') {
    yield say(PC, T.tal.q2Grain);
    yield say(OTAC, T.tal.q2GrainA);
    return;
  }
  if (pick === 'arms') {
    yield say(PC, T.tal.q2Arms);
    yield say(OTAC, T.tal.q2ArmsA);
    return;
  }
  yield say(PC, T.tal.q2Cloth);
  yield say(OTAC, T.tal.q2ClothA);
  yield say(PC, T.tal.q2ClothB);
  yield say(PC, T.tal.q2ClothC);
  yield say(OTAC, T.tal.q2ClothD);
  c.set(f('q2'));
}

function* question3(c: ScriptCtx): Script {
  if (!c.seen('we.q3Intro')) {
    c.mark('we.q3Intro');
    yield say(OTAC, T.tal.q3a);
    yield say(PC, T.tal.q3aA);
    yield say(OTAC, T.tal.q3b);
    yield say(PC, T.tal.q3bA);
  }
  yield say(OTAC, T.tal.q3);
  const pick: string = yield {
    k: 'choice',
    options: [
      { id: 'like', text: T.tal.q3Like },
      { id: 'polite', text: T.tal.q3Polite },
      { id: 'listen', text: T.tal.q3Listen },
    ],
  };
  if (pick === 'like') {
    yield say(PC, T.tal.q3Like);
    yield say(OTAC, T.tal.q3LikeA);
    return;
  }
  if (pick === 'polite') {
    yield say(PC, T.tal.q3Polite);
    yield say(OTAC, T.tal.q3PoliteA);
    return;
  }
  yield say(PC, T.tal.q3Listen);
  yield wait(0.6);
  yield say(OTAC, T.tal.lesson1);
  yield say(OTAC, T.tal.lesson2);
  yield wait(0.5);
  yield say(OTAC, T.tal.lesson3);
  yield say(OTAC, T.tal.lesson4);
  yield say(OTAC, T.tal.lesson5);
  c.set(f('lesson'));
  c.journal('road', 'done');
  yield say(OTAC, T.tal.lessonEnd);
  yield checkpoint();
  // Back on the block; the room rule `down` brings both down (also after loading a save taken here).
  if (c.room.id === 'we_tal') yield room('we_weide', 'stein');
}

// ------------------------------------------------------------------------------------ the house

function* nightScript(c: ScriptCtx): Script {
  if (!c.is(f('ate'))) {
    yield say(PC, T.kuca.bank.notYet);
    return;
  }
  yield walk(PC, 772, 462, { face: 1 });
  yield fade(1, 0.6);
  c.place(PC, { hidden: true });
  yield fade(0, 0.8);
  yield narrate(T.kuca.bank.lie);
  yield face(ANDJA, 1);
  yield face(KOM, -1);
  yield face(OTAC, 1);
  yield say(KOM, T.night.a);
  yield say(OTAC, T.night.b);
  yield say(KOM, T.night.c);
  yield wait(1.2);
  yield face(ANDJA, 1);
  yield say(ANDJA, T.night.d);
  yield say(KOM, T.night.e);
  yield say(OTAC, T.night.f);
  yield say(ANDJA, T.night.g);
  const pick: string = yield { k: 'choice', options: [{ id: 'still', text: T.night.still }, { id: 'ask', text: T.night.ask }] };
  if (pick === 'ask') {
    c.set(f('asked'));
    yield face(KOM, 1);
    yield wait(0.8);
    yield say(OTAC, T.night.askA);
    yield wait(1.4);
    yield face(KOM, -1);
    yield say(OTAC, T.night.askB);
    yield say(KOM, T.night.askC);
    yield narrate(T.night.askN);
  } else {
    c.set(f('silent'));
    yield say(KOM, T.night.h);
    yield say(OTAC, T.night.i);
    yield say(ANDJA, T.night.j);
    yield say(OTAC, T.night.k);
    yield say(KOM, T.night.l);
    yield wait(0.8);
    yield say(ANDJA, T.night.m);
    yield wait(1.5);
    yield say(OTAC, T.night.n);
    yield say(KOM, T.night.o);
    yield narrate(T.night.stillN1);
    yield narrate(T.night.stillN2);
  }
  c.journal('listen', 'done');
  yield narrate(T.night.end);
  yield fade(1, 1.2);
  yield endChapter();
}

const kuca = {
  id: 'we_kuca',
  title: T.rooms.kuca,
  bg: 'bg_kuca',
  width: 900,
  perspective: persp(134, 330, 220),
  walk: [
    {
      outer: [40, 468, 860, 468, 860, 456, 700, 456, 452, 457, 444, 352, 262, 345, 236, 340, 40, 350],
      holes: [[370, 394, 470, 394, 470, 422, 370, 422]],
    },
  ],
  entries: { door: { x: 70, y: 440, face: 1 as const } },
  actorTint: 0xf2d6b0,
  layers: [{ id: 'bench', image: 'occ_kuca_bench', x: 0, y: 0, rect: [374, 339, 95, 80] as Rect4, depth: 412 }],
  // The father came home with the flock ahead of Mijo.
  prepare: (c: ScriptCtx) => {
    if (c.s.actors[OTAC]?.room !== 'we_kuca') c.place(OTAC, { room: 'we_kuca', x: 322, y: 352, facing: 1, hidden: false, pose: 'stand' });
  },
  decor: [{ id: 'fire', character: 'flame', x: 98, y: 334, scale: 0.62, alpha: 0.95, depth: -40000 }],
  hotspots: [
    {
      id: 'hinaus',
      name: T.kuca.hinaus.name,
      shape: R(0, 300, 40, 170),
      walkTo: { x: 60, y: 440, face: -1 as const },
      verbs: ['look', 'go'],
      on: { look: T.kuca.hinaus.look, go: T.kuca.hinaus.blocked },
    },
    { id: 'herd', name: T.kuca.herd.name, shape: R(30, 120, 180, 215), walkTo: { x: 120, y: 384, face: -1 as const }, on: { look: T.kuca.herd.look, use: T.kuca.herd.use } },
    { id: 'truhe', name: T.kuca.truhe.name, shape: R(265, 228, 215, 96), walkTo: { x: 360, y: 380, face: 1 as const }, on: { look: T.kuca.truhe.look } },
    { id: 'kraeuter', name: T.kuca.kraeuter.name, shape: R(250, 56, 240, 110), walkTo: null, on: { look: T.kuca.kraeuter.look } },
    { id: 'fenster', name: T.kuca.fenster.name, shape: R(500, 95, 130, 120), walkTo: null, on: { look: T.kuca.fenster.look } },
    {
      id: 'tisch',
      name: T.kuca.tisch.name,
      shape: R(440, 258, 305, 62),
      walkTo: { x: 470, y: 460, face: 1 as const },
      verbs: ['look', 'eat', 'take'],
      on: {
        look: T.kuca.tisch.look,
        eat: function* (c: ScriptCtx): Script {
          if (c.is(f('ate'))) {
            yield say(PC, T.kuca.tisch.eaten);
            return;
          }
          c.set(f('ate'));
          yield* lines(PC, T.kuca.tisch.eat);
        },
        take: T.kuca.tisch.cheese,
      },
    },
    {
      id: 'bank',
      name: T.kuca.bank.name,
      shape: R(712, 270, 178, 168),
      walkTo: { x: 772, y: 462, face: 1 as const },
      verbs: ['look', 'lie'],
      on: { look: T.kuca.bank.look, lie: nightScript, use: nightScript },
    },
  ],
  onEnter: function* (c: ScriptCtx): Script {
    if (c.seen('we.kucaEntered')) return;
    c.mark('we.kucaEntered');
    yield narrate(T.weide.pfad.evening);
    yield face(ANDJA, -1);
    yield say(ANDJA, T.kuca.enter.a);
    yield say(OTAC, T.kuca.enter.b);
    yield say(PC, T.kuca.enter.c);
    yield say(ANDJA, T.kuca.enter.d);
    yield face(ANDJA, 1);
    c.journal('home', 'done');
    c.journal('listen');
  },
};

// ------------------------------------------------------------------------------------ chapter

export const weideChapter: ChapterDef = {
  id: 'weide',
  title: T.title,
  dateline: T.dateline,
  card: { image: 'intro_kap1', cine: 'cine_kap1_a', lines: T.card },
  pc: { character: 'mijo1467', name: T.names.mijo, color: C.pc, relHeight: 0.8 },
  start: { room: 'we_weide', entry: 'start' },
  next: 'dorf',
  journal: T.journal,
  items: [
    {
      id: 'wacholder',
      name: T.items.wacholder.name,
      icon: 'wacholder',
      look: T.items.wacholder.look,
    },
  ],
  actors: [
    {
      id: OTAC,
      name: T.names.otac,
      character: 'otac',
      color: C.otac,
      start: { room: 'we_weide', x: 592, y: 392, facing: -1 },
      on: {
        look: T.otac.look,
        talk: (c: ScriptCtx) => (c.room.id === 'we_kuca' ? lines(OTAC, T.andja.talkAfter) : c.dialogue('otac')),
      },
      items: { wacholder: T.otac.noGoat },
    },
    {
      id: GOAT,
      name: T.names.goat,
      character: 'goat',
      relHeight: 0.48,
      color: C.pc,
      start: { room: 'we_weide', x: 1086, y: 334, facing: -1, pose: 'graze', hidden: true },
      verbs: ['look'],
      on: { look: (c: ScriptCtx) => lines(PC, T.weide.herde.full) },
    },
    {
      id: ANDJA,
      name: T.names.andja,
      character: 'andja',
      color: C.andja,
      start: { room: 'we_kuca', x: 234, y: 350, facing: 1 },
      on: { look: T.andja.look, talk: (c: ScriptCtx) => c.dialogue('andja') },
    },
    {
      id: KOM,
      name: T.names.komsija,
      character: 'komsija',
      color: C.kom,
      start: { room: 'we_kuca', x: 414, y: 356, facing: -1 },
      on: { look: T.komsija.look, talk: (c: ScriptCtx) => c.dialogue('komsija') },
    },
  ],
  dialogues: [
    {
      id: 'otac',
      actor: OTAC,
      open: function* (c: ScriptCtx): Script {
        yield say(OTAC, c.is(f('counted')) && !c.seen('we.otacCounted') ? T.otac.openGoat : T.otac.open);
        if (c.is(f('counted'))) c.mark('we.otacCounted');
      },
      bye: T.otac.bye,
      options: [
        {
          id: 'gescheckte',
          text: T.otac.gescheckte,
          when: (s) => !!s.flags[f('counted')] && !s.flags[f('goatBack')],
          run: function* (): Script {
            yield say(OTAC, T.otac.gescheckteA);
            yield say(PC, T.otac.gescheckteQ);
            yield say(OTAC, T.otac.gescheckteB);
            yield say(OTAC, T.otac.gescheckteC);
          },
        },
        {
          id: 'ruf',
          text: T.otac.ruf,
          when: (s) => !!s.flags[f('called')] && !s.flags[f('goatBack')],
          run: () => lines(OTAC, [T.otac.rufA, T.otac.rufB]),
        },
        { id: 'strasse', text: T.otac.strasse, run: () => lines(OTAC, [T.otac.strasseA, T.otac.strasseB]) },
        { id: 'hirte', text: T.otac.hirte, run: () => lines(OTAC, [T.otac.hirteA, T.otac.hirteB, T.otac.hirteC]) },
        {
          id: 'namen',
          text: T.otac.namen,
          when: (s) => !!s.flags[f('goatBack')],
          run: function* (): Script {
            yield say(OTAC, T.otac.namenA);
            yield say(PC, T.otac.namenB);
            yield narrate(T.otac.namenN);
          },
        },
      ],
    },
    {
      id: 'andja',
      actor: ANDJA,
      open: function* (c: ScriptCtx): Script {
        yield say(ANDJA, c.is(f('ate')) ? T.andja.talkAfter : T.andja.talk);
      },
      bye: T.andja.bye,
      options: [{ id: 'goat', text: T.andja.goat, run: () => lines(ANDJA, T.andja.goatA) }],
    },
    {
      id: 'komsija',
      actor: KOM,
      open: function* (): Script {
        yield say(KOM, T.komsija.open);
      },
      bye: T.komsija.bye,
      options: [
        { id: 'woher', text: T.komsija.woher, run: () => lines(KOM, T.komsija.woherA) },
        { id: 'neues', text: T.komsija.neues, run: () => lines(KOM, [T.komsija.neuesA, T.komsija.neuesB]) },
        {
          id: 'reiter',
          text: T.komsija.reiter,
          run: function* (): Script {
            yield face(KOM, OTAC);
            yield say(KOM, T.komsija.reiterA);
            yield narrate(T.komsija.reiterN);
            yield face(KOM, PC);
          },
        },
      ],
    },
  ],
  hint: (s) => {
    const fl = (n: string) => !!s.flags[f(n)];
    if (s.room === 'we_kuca') return fl('ate') ? { id: 'we.sleep', steps: T.hints.sleep } : { id: 'we.eat', steps: T.hints.eat };
    if (!fl('counted')) return { id: 'we.count', steps: T.hints.count };
    if (!fl('trail')) return { id: 'we.trail', steps: T.hints.trail };
    if (!fl('found')) return { id: 'we.found', steps: T.hints.found };
    if (!fl('goatBack')) return { id: 'we.lure', steps: T.hints.lure };
    if (!fl('sitting') && !fl('lesson')) return { id: 'we.climb', steps: T.hints.climb };
    if (!fl('lesson')) return s.room === 'we_tal' ? { id: 'we.watch', steps: T.hints.watch } : { id: 'we.look', steps: T.hints.look };
    return { id: 'we.home', steps: T.hints.home };
  },
  intro: function* (c: ScriptCtx): Script {
    yield walk(PC, 210, 436, { face: 1 });
    yield face(OTAC, PC);
    yield say(OTAC, T.intro.a);
    yield say(PC, T.intro.b);
    yield say(OTAC, T.intro.c);
    yield face(OTAC, 1);
    yield narrate(T.intro.narr);
    c.journal('count');
  },
  resumes: {},
  rooms: [weide, tal, kuca] as ChapterDef['rooms'],
};
