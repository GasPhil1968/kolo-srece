// Kapitel 4 – Povratnik. Sommer 1476. Opens with the short transition "Vierzig Sekunden": the hollow on
// the pass, Ivo sent home, one decision, the fall (non-graphic), the burial. Then the waking in the grave
// (the painted full frames with the grave dug open), the two-day return – water from the spring, a jug
// from the wayside chapel carried in a sling torn from his shirt, the woman on the path (hide or be seen)
// – and the night in the village: Stipan's "… Mijo?", the voices behind the window, the bolted door, the
// breathing behind it, the raised fist held eleven seconds, and leaving without knocking.
import type { ChapterDef, ScriptCtx } from '../../core/content';
import type { Script } from '../../core/cmd';
import { camera, checkpoint, endChapter, face, fade, narrate, pose, room, say, wait, walk } from '../../core/cmd';
import type { GameState } from '../../core/state';
import { T } from '../text/de/c04_povratnik';
import { flags, PC, persp, R } from '../util';

const f = flags('po');
const IVO = 'ivo76';
const RAIDER = 'raider76';
const FRAU = 'frau76';
const STIPAN = 'stipan76';
const VA = 'stimmeA76';
const VB = 'stimmeB76';
const C = { pc: '#e9d7b0', ivo: '#d9c79f', frau: '#cdbb9a', stipan: '#c6c2ae', voice: '#b7c3d8' };
type Rect4 = [number, number, number, number];
const is = (n: string) => (s: GameState) => !!s.flags[f(n)];
const not = (n: string) => (s: GameState) => !s.flags[f(n)];

function* lines(actor: string, l: string | readonly string[]): Script {
  for (const t of typeof l === 'string' ? [l] : l) yield say(actor, t);
}

// ------------------------------------------------------------------------- Vierzig Sekunden

function* sendIvo(c: ScriptCtx): Script {
  if (c.is(f('ivoGone'))) return;
  yield face(IVO, PC);
  yield say(PC, T.senke.ivo.talk);
  yield pose(IVO, 'pray', { loop: true });
  yield wait(1.6);
  c.set(f('ivoGone'));
  c.journal('ivo', 'done');
  yield walk(IVO, 1540, 430, { direct: true, face: 1 });
  c.place(IVO, { room: null });
  c.journal('wait');
  // Once the boy is gone, the forty seconds begin.
  yield* fortySeconds(c);
}

function* fortySeconds(c: ScriptCtx): Script {
  if (c.is(f('fell'))) return;
  if (!c.is(f('ivoGone'))) {
    yield* sendIvo(c);
    return;
  }
  yield wait(0.8);
  yield narrate(T.senke.n40a);
  yield narrate(T.senke.n40b);
  yield fade(1, 0.9);
  c.set(f('after'));
  c.place(RAIDER, { room: 'po_senke', x: 1240, y: 410, facing: -1, hidden: false });
  yield fade(0, 0.9);
  yield walk(RAIDER, 900, 408, { direct: true, face: -1 });
  const pick: string = yield { k: 'choice', options: [{ id: 'stay', text: T.senke.stay }, { id: 'up', text: T.senke.up }] };
  if (pick === 'stay') {
    c.set(f('stayedDown'));
    yield narrate(T.senke.stayN);
    yield walk(RAIDER, 800, 406, { direct: true, face: -1 });
  } else {
    c.set(f('rose'));
    yield narrate(T.senke.upN);
  }
  c.journal('wait', 'done');
  c.place(PC, { pose: 'helmetStand' });
  yield pose(PC, 'thrust', { rest: true });
  yield pose(PC, 'helmet', { rest: true });
  yield narrate(T.senke.cap);
  // The cut lands on the third frame of the stroke; the body only falls then.
  yield pose(RAIDER, 'strike', { wait: false, rest: true });
  yield wait(0.66);
  yield pose(PC, 'death', { rest: true });
  c.place(PC, { pose: 'deathRest' });
  c.place(RAIDER, { pose: 'after' });
  c.set(f('fell'));
  yield wait(1.4);
  yield fade(1, 1.6);
  yield wait(1);
  yield narrate(T.senke.after);
  yield room('po_bilder', 'view');
}

const senke = {
  id: 'po_senke',
  title: T.rooms.senke,
  bg: (s: GameState) => (s.flags[f('after')] ? 'bg_pass_senke' : 'bg_pass_senke_vorher'),
  width: 1440,
  perspective: persp(150, 400, 195),
  noWalk: true,
  walk: [{ outer: [100, 420, 1340, 420, 1340, 390, 100, 390] }],
  entries: { start: { x: 660, y: 404, face: 1 as const } },
  assets: ['bg_pass_senke'],
  decor: [{ id: 'staub', character: 'staub', x: 760, y: 128, scale: 0.18, alpha: 0.85, depth: -40000, visible: not('after') }],
  hotspots: [
    { id: 'stein', name: T.senke.stein.name, shape: R(190, 250, 330, 100), walkTo: null, on: { look: T.senke.stein.look } },
    {
      id: 'waffen',
      name: T.senke.waffen.name,
      shape: R(580, 286, 560, 96),
      walkTo: null,
      verbs: ['look', 'take', 'use'],
      on: { look: T.senke.waffen.look, take: T.senke.waffen.take, use: fortySeconds },
    },
    { id: 'staub', name: T.senke.staub.name, shape: R(640, 90, 260, 70), walkTo: null, visible: not('after'), priority: 2, on: { look: T.senke.staub.look } },
    { id: 'tal', name: T.senke.tal.name, shape: R(560, 60, 520, 120), walkTo: null, on: { look: T.senke.tal.look } },
    {
      id: 'ich',
      name: T.senke.mijo.name,
      shape: R(560, 360, 200, 52),
      walkTo: null,
      priority: 3,
      verbs: ['look', 'stand'],
      on: { look: T.senke.mijo.look, stand: fortySeconds },
    },
  ],
};

// ------------------------------------------------------------------ the burial and the waking

const BURIAL = [0, 1, 2, 3, 4, 5].map((i) => `bg_burial_${i}`);
const WAKE = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `bg_erde_${i}`);

function* showFrame(c: ScriptCtx, key: string, hold: number, crossfade = 0.35): Script {
  yield fade(1, crossfade);
  c.set(f('bild'), key);
  yield fade(0, crossfade);
  yield wait(hold);
}

const bilder = {
  id: 'po_bilder',
  title: T.rooms.bilder,
  bg: (s: GameState) => (typeof s.flags[f('bild')] === 'string' ? (s.flags[f('bild')] as string) : 'bg_burial_0'),
  width: 960,
  perspective: persp(150, 400, 195),
  noWalk: true,
  walk: [{ outer: [100, 440, 860, 440, 860, 420, 100, 420] }],
  entries: { view: { x: 480, y: 430, face: 1 as const } },
  assets: [...BURIAL, ...WAKE],
  prepare: (c: ScriptCtx) => c.place(PC, { hidden: true, pose: 'stand' }),
  hotspots: [
    {
      id: 'ich',
      name: T.grab.mijo.name,
      shape: R(495, 232, 90, 150),
      visible: is('woke'),
      walkTo: null,
      priority: 3,
      verbs: ['look', 'stand'],
      on: {
        look: T.grab.mijo.look,
        stand: function* (c: ScriptCtx): Script {
          yield* lines(PC, T.grab.mijo.stand);
          c.journal('rise', 'done');
          c.journal('drink');
          yield room('po_weg', 'arrive');
        },
      },
    },
    { id: 'grab', name: T.grab.grab.name, shape: R(330, 258, 160, 110), visible: is('woke'), walkTo: null, on: { look: T.grab.grab.look } },
    { id: 'graeberL', name: T.grab.graeber.name, shape: R(20, 200, 300, 100), visible: is('woke'), walkTo: null, on: { look: T.grab.graeber.look } },
    { id: 'graeberR', name: T.grab.graeber.name, shape: R(610, 220, 350, 110), visible: is('woke'), walkTo: null, on: { look: T.grab.graeber.look } },
    { id: 'tal', name: T.grab.tal.name, shape: R(300, 20, 660, 120), visible: is('woke'), walkTo: null, on: { look: T.grab.tal.look } },
  ],
  onEnter: function* (c: ScriptCtx): Script {
    if (c.is(f('woke'))) return;
    for (const key of BURIAL) yield* showFrame(c, key, 1.5);
    yield fade(1, 1.2);
    yield wait(1.2);
    yield narrate(T.grab.n1);
    c.set(f('buried'));
    for (const [i, key] of WAKE.entries()) {
      yield* showFrame(c, key, i === 0 ? 1.6 : 1.2, i === 0 ? 0.8 : 0.3);
      if (i === 6) yield narrate(T.grab.n2);
    }
    c.set(f('woke'));
    c.journal('rise');
    yield checkpoint();
  },
};

// ------------------------------------------------------------------------------- the return

function* drinkScript(c: ScriptCtx): Script {
  if (c.is(f('drank'))) {
    yield say(PC, T.weg.quelle.washed);
    return;
  }
  yield walk(PC, 548, 362, { face: -1 });
  yield pose(PC, 'drink');
  yield pose(PC, 'retch');
  yield pose(PC, 'drink');
  yield pose(PC, 'wash');
  yield pose(PC, 'spit');
  yield narrate(T.weg.quelle.drinkN);
  yield pose(PC, 'neck');
  c.set(f('drank'));
  c.journal('drink', 'done');
  // Kneeling at the spring he is in plain sight: someone comes up the path.
  if (!c.is(f('womanSeen'))) yield* womanScript(c);
  c.journal('jug');
}

function* fillScript(c: ScriptCtx): Script {
  if (!c.is(f('drank'))) {
    yield* drinkScript(c);
    return;
  }
  if (c.is(f('full'))) {
    yield say(PC, T.weg.quelle.fillDone);
    return;
  }
  if (c.has('krug_schlinge')) {
    yield say(PC, T.weg.combineEmpty);
    return;
  }
  yield walk(PC, 548, 362, { face: -1 });
  yield pose(PC, 'drink');
  yield say(PC, T.weg.quelle.fill);
  c.set(f('full'));
}

function* slingScript(c: ScriptCtx): Script {
  if (!c.has('krug') || !c.has('streifen')) return;
  if (!c.is(f('full'))) {
    yield say(PC, T.weg.combineEmpty);
    return;
  }
  c.drop('krug');
  c.drop('streifen');
  c.give('krug_schlinge');
  c.journal('jug', 'done');
  c.journal('home');
  yield say(PC, T.weg.combine);
}

function* tearScript(c: ScriptCtx): Script {
  if (c.is(f('torn'))) {
    yield say(PC, T.weg.mijo.torn);
    return;
  }
  c.set(f('torn'));
  c.give('streifen');
  yield say(PC, T.weg.mijo.tear);
}

function* womanScript(c: ScriptCtx): Script {
  c.set(f('womanSeen'));
  c.place(FRAU, { room: 'po_weg', x: 1470, y: 446, facing: -1, hidden: false });
  yield walk(PC, 600, 420, { face: 1 });
  // Show the path: Mijo at the spring on the left, the woman coming up on the right.
  yield camera(400, 1.2);
  yield walk(FRAU, 1250, 446, { direct: true, face: -1 });
  yield narrate(T.weg.womanA);
  const pick: string = yield { k: 'choice', options: [{ id: 'hide', text: T.weg.hide }, { id: 'stand', text: T.weg.stand }] };
  if (pick === 'hide') {
    c.set(f('hid'));
    yield walk(PC, 862, 386, { face: 1 });
    yield pose(PC, 'freeze', { loop: true });
    yield walk(FRAU, 640, 448, { direct: true, face: -1 });
    yield narrate(T.weg.hideN);
    yield walk(FRAU, -80, 450, { direct: true, face: -1 });
    c.place(FRAU, { room: null });
    yield walk(PC, 860, 432, { face: 1 });
  } else {
    c.set(f('wasSeen'));
    yield walk(FRAU, 1060, 446, { direct: true, face: -1 });
    yield narrate(T.weg.standN1);
    yield narrate(T.weg.standN2);
    yield face(FRAU, 1);
    yield walk(FRAU, 1520, 446, { direct: true, face: 1 });
    c.place(FRAU, { room: null });
    yield narrate(T.weg.standN3);
  }
  yield camera(null, 1);
  c.set(f('womanDone'));
}

function* journeyScript(c: ScriptCtx): Script {
  yield walk(PC, 1380, 432, { face: 1 });
  yield fade(1, 1.2);
  yield narrate(T.weg.go1);
  yield narrate(T.weg.go2);
  yield narrate(T.weg.go3);
  c.journal('home', 'done');
  c.place(PC, { gait: 'slow' });
  yield narrate(T.weg.go4);
  yield room('po_dorf', 'west');
}

function pathBlocked(s: GameState): string | null {
  if (!s.flags[f('drank')]) return T.weg.pfad.noDrink;
  if (s.inventory.includes('krug_schlinge')) return null;
  if (!s.inventory.includes('krug')) return T.weg.pfad.noJug;
  if (!s.flags[f('full')]) return T.weg.pfad.emptyJug;
  return T.weg.pfad.inHand;
}

const weg = {
  id: 'po_weg',
  title: T.rooms.weg,
  bg: 'bg_rueckweg',
  width: 1440,
  perspective: persp(85, 420, 155),
  walk: [{ outer: [40, 468, 1400, 468, 1400, 346, 1100, 342, 1095, 372, 960, 376, 960, 384, 760, 384, 760, 376, 640, 374, 620, 366, 580, 360, 400, 358, 300, 370, 40, 380] }],
  entries: { arrive: { x: 60, y: 440, face: 1 as const } },
  layers: [{ id: 'juniper', image: 'occ_rw_juniper', x: 0, y: 0, rect: [638, 209, 453, 201] as Rect4, depth: 404 }],
  decor: [{ id: 'jet', character: 'quellwasser', x: 413, y: 243, scale: 0.79, alpha: 0.9, depth: -40000 }],
  hotspots: [
    {
      id: 'quelle',
      name: T.weg.quelle.name,
      shape: R(416, 255, 160, 95),
      walkTo: { x: 548, y: 362, face: -1 as const },
      verbs: ['look', 'drink', 'use'],
      on: { look: T.weg.quelle.look, drink: drinkScript, use: drinkScript },
      items: { krug: fillScript, krug_schlinge: fillScript, streifen: (c: ScriptCtx) => lines(PC, T.weg.quelle.noJug) },
    },
    {
      id: 'kapelle',
      name: T.weg.kapelle.name,
      shape: R(294, 72, 172, 122),
      walkTo: { x: 360, y: 372, face: -1 as const },
      verbs: ['look', 'take', 'pray'],
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('jugTaken')) ? T.weg.kapelle.lookTaken : T.weg.kapelle.look),
        take: function* (c: ScriptCtx): Script {
          if (c.is(f('jugTaken'))) {
            yield say(PC, T.weg.kapelle.taken);
            return;
          }
          yield fade(1, 0.5);
          c.set(f('jugTaken'));
          c.give('krug');
          yield fade(0, 0.5);
          yield* lines(PC, T.weg.kapelle.take);
        },
        pray: T.weg.kapelle.pray,
      },
    },
    {
      id: 'wacholder',
      name: T.weg.wacholder.name,
      shape: { poly: [656, 344, 700, 292, 740, 236, 857, 210, 945, 249, 1020, 293, 1089, 356, 1060, 370, 660, 370] },
      walkTo: { x: 640, y: 440, face: 1 as const },
      on: { look: T.weg.wacholder.look, take: T.weg.wacholder.take },
    },
    { id: 'tal', name: T.weg.tal.name, shape: R(1100, 140, 340, 160), walkTo: null, on: { look: T.weg.tal.look } },
    {
      id: 'pfad',
      name: T.weg.pfad.name,
      shape: R(1360, 330, 80, 140),
      walkTo: { x: 1372, y: 432, face: 1 as const },
      verbs: ['look', 'go'],
      on: {
        look: T.weg.pfad.look,
        go: function* (c: ScriptCtx): Script {
          const blocked = pathBlocked(c.s);
          if (blocked) {
            yield say(PC, blocked);
            return;
          }
          yield* journeyScript(c);
        },
      },
    },
  ],
  // Coming from the painted grave frames: Mijo is on his feet again, walking wearily.
  prepare: (c: ScriptCtx) => c.place(PC, { hidden: false, gait: 'weary', pose: 'stand' }),
  onEnter: function* (c: ScriptCtx): Script {
    if (c.seen('po.wegEntered')) return;
    c.mark('po.wegEntered');
    yield pose(PC, 'spit');
    yield say(PC, T.weg.arrive);
  },
};

// ----------------------------------------------------------------------------- the village

function* stipanScript(c: ScriptCtx): Script {
  if (c.is(f('stipanFled'))) return;
  yield face(PC, STIPAN);
  yield pose(PC, 'half', { rest: true });
  yield pose(STIPAN, 'near', { rest: true });
  yield pose(STIPAN, 'recognize', { rest: true });
  yield say(STIPAN, T.dorf.stipan);
  yield pose(STIPAN, 'drop', { rest: true });
  yield narrate(T.dorf.stipanN);
  c.set(f('bucket'));
  c.set(f('stipanFled'));
  yield walk(STIPAN, 1560, 438, { direct: true, face: 1, anim: 'run', speed: 300 });
  c.place(STIPAN, { room: null });
  yield wait(1.2);
  c.place(PC, { pose: 'stand' });
  c.journal('door');
}

function* windowScript(c: ScriptCtx): Script {
  if (c.is(f('voices'))) {
    yield say(PC, T.dorf.fenster.call);
    return;
  }
  yield walk(PC, 1122, 434, { face: 1 });
  yield pose(PC, 'neck', { wait: false });
  yield say(VA, T.dorf.fenster.v1);
  yield say(VB, T.dorf.fenster.v2);
  yield wait(0.8);
  yield say(VA, T.dorf.fenster.v3);
  yield narrate(T.dorf.fenster.after);
  c.set(f('voices'));
}

function* doorScript(c: ScriptCtx): Script {
  if (!c.is(f('voices'))) yield* windowScript(c);
  yield checkpoint();
  yield walk(PC, 1232, 436, { face: 1 });
  yield pose(PC, 'listen', { loop: true });
  yield narrate(T.dorf.tuer.listen);
  yield narrate(T.dorf.tuer.listenN);
  c.set(f('listened'));
  yield narrate(T.dorf.tuer.knock);
  yield pose(PC, 'raise', { rest: true });
  yield narrate(T.dorf.tuer.hold);
  yield wait(2.4);
  yield pose(PC, 'lower', { rest: true });
  yield narrate(T.dorf.tuer.lower);
  c.journal('door', 'done');
  c.place(PC, { pose: 'stand' });
  yield walk(PC, -60, 438, { direct: true, face: -1, anim: 'slow', speed: 64 });
  yield narrate(T.dorf.tuer.leave);
  yield fade(1, 1.4);
  yield endChapter();
}

const dorf = {
  id: 'po_dorf',
  title: T.rooms.dorf,
  bg: 'bg_dorf_1476_nacht',
  width: 1440,
  perspective: persp(345, 422, 187),
  walk: [{ outer: [40, 452, 1400, 452, 1400, 428, 1040, 426, 700, 420, 40, 420] }],
  entries: { west: { x: 60, y: 436, face: 1 as const } },
  actorTint: 0x7484b0,
  layers: [
    { id: 'fenster', image: 'prop_fenster_nacht', x: 0, y: 0, rect: [1055, 186, 115, 105] as Rect4, depth: 'back' as const },
    { id: 'eimer', image: 'prop_eimer_gefallen', x: 0, y: 0, rect: [884, 412, 54, 40] as Rect4, depth: 452, visible: is('bucket') },
  ],
  hotspots: [
    {
      id: 'fenster',
      name: T.dorf.fenster.name,
      shape: R(1060, 186, 110, 104),
      walkTo: { x: 1122, y: 434, face: 1 as const },
      verbs: ['look', 'listen', 'call'],
      on: { look: T.dorf.fenster.look, listen: windowScript, call: windowScript },
    },
    {
      id: 'tuer',
      name: T.dorf.tuer.name,
      shape: R(1248, 214, 77, 208),
      walkTo: { x: 1232, y: 436, face: 1 as const },
      verbs: ['look', 'listen', 'knock', 'open'],
      on: {
        look: T.dorf.tuer.look,
        listen: doorScript,
        knock: doorScript,
        open: T.dorf.tuer.open,
      },
      anyItem: () => T.dorf.tuer.open,
    },
    { id: 'eimer', name: T.dorf.eimer.name, shape: R(880, 408, 62, 46), visible: is('bucket'), walkTo: { x: 860, y: 440, face: 1 as const }, priority: 3, on: { look: T.dorf.eimer.look } },
    { id: 'gasse', name: T.dorf.gasse.name, shape: R(200, 300, 500, 110), walkTo: null, on: { look: T.dorf.gasse.look } },
    { id: 'haeuser', name: T.dorf.haeuser.name, shape: R(0, 150, 700, 150), walkTo: null, on: { look: T.dorf.haeuser.look } },
  ],
  rules: [
    {
      id: 'stipanComes',
      when: (s: GameState) => !s.flags[f('stipanCame')] && (s.actors.pc?.x ?? 0) > 360,
      run: function* (c: ScriptCtx): Script {
        c.set(f('stipanCame'));
        c.place(STIPAN, { room: 'po_dorf', x: 1460, y: 438, facing: -1, hidden: false });
        yield walk(STIPAN, 940, 438, { direct: true, face: -1 });
      },
    },
    {
      id: 'stipanSees',
      when: (s: GameState) => !!s.flags[f('stipanCame')] && !s.flags[f('stipanFled')] && (s.actors.pc?.x ?? 0) > 760,
      run: stipanScript,
    },
  ],
  onEnter: function* (c: ScriptCtx): Script {
    if (c.seen('po.dorfEntered')) return;
    c.mark('po.dorfEntered');
    yield walk(PC, 300, 436, { face: 1 });
  },
};

// ------------------------------------------------------------------------------------ chapter

export const povratnikChapter: ChapterDef = {
  id: 'povratnik',
  title: T.title,
  dateline: T.dateline,
  card: { image: 'bg_pass_senke_vorher', lines: T.card },
  pc: { character: 'mijo1476', name: T.names.mijo, color: C.pc, relHeight: 1 },
  start: { room: 'po_senke', entry: 'start' },
  next: 'elftage',
  journal: T.journal,
  items: [
    {
      id: 'krug',
      name: (s) => (s.flags[f('full')] ? T.items.krug.nameFull : T.items.krug.name),
      icon: 'krug',
      look: (c: ScriptCtx) => lines(PC, c.is(f('full')) ? T.items.krug.lookFull : T.items.krug.look),
      combine: { streifen: slingScript },
    },
    { id: 'streifen', name: T.items.streifen.name, icon: 'streifen', look: T.items.streifen.look, combine: { krug: slingScript } },
    { id: 'krug_schlinge', name: T.items.krugSchlinge.name, icon: 'krug_schlinge', look: T.items.krugSchlinge.look },
  ],
  self: {
    name: T.weg.mijo.name,
    visible: (s) => s.room === 'po_weg' || s.room === 'po_dorf',
    verbs: (s) => (s.room === 'po_weg' ? ['look', 'tear'] : ['look']),
    on: {
      look: (c: ScriptCtx) => lines(PC, T.weg.mijo.look),
      tear: tearScript,
    },
    items: { krug: (c: ScriptCtx) => lines(PC, c.is(f('torn')) ? [T.weg.combineEmpty] : [T.weg.pfad.inHand]) },
  },
  actors: [
    {
      id: IVO,
      name: T.names.ivo,
      character: 'ivo',
      relHeight: 0.82,
      color: C.ivo,
      start: { room: 'po_senke', x: 1010, y: 406, facing: -1, pose: 'point' },
      verbs: ['look', 'talk'],
      on: { look: T.senke.ivo.look, talk: sendIvo },
    },
    {
      id: RAIDER,
      name: T.names.raider,
      character: 'raider',
      color: C.voice,
      start: { room: null, x: 1240, y: 410, facing: -1 },
      verbs: ['look'],
      on: { look: [T.senke.staub.look[0]] },
    },
    {
      id: FRAU,
      name: T.names.frau,
      character: 'frau',
      color: C.frau,
      start: { room: null, x: 1470, y: 446, facing: -1 },
      verbs: ['look'],
      on: { look: [T.weg.womanA] },
    },
    {
      id: STIPAN,
      name: T.names.stipan,
      character: 'stipan',
      color: C.stipan,
      start: { room: null, x: 1460, y: 438, facing: -1 },
      verbs: ['look', 'greet'],
      on: { look: T.dorf.stipanLook, greet: stipanScript, talk: stipanScript },
    },
    { id: VA, name: T.names.voiceA, character: 'otac', color: C.voice, start: { room: null, x: 0, y: 0, facing: 1 } },
    { id: VB, name: T.names.voiceB, character: 'andja', color: C.voice, start: { room: null, x: 0, y: 0, facing: 1 } },
  ],
  dialogues: [],
  hint: (s) => {
    const fl = (n: string) => !!s.flags[f(n)];
    if (s.room === 'po_senke') return fl('ivoGone') ? { id: 'po.wait', steps: T.hints.wait } : { id: 'po.ivo', steps: T.hints.ivo };
    if (s.room === 'po_bilder') return fl('woke') ? { id: 'po.stand', steps: T.hints.stand } : null;
    if (s.room === 'po_weg') {
      if (!fl('drank')) return { id: 'po.drink', steps: T.hints.drink };
      if (!s.inventory.includes('krug_schlinge') && !(s.inventory.includes('krug') && fl('full'))) return { id: 'po.jug', steps: T.hints.jug };
      if (!s.inventory.includes('krug_schlinge')) return { id: 'po.sling', steps: T.hints.sling };
      return { id: 'po.go', steps: T.hints.go };
    }
    if (!fl('stipanFled')) return { id: 'po.stipan', steps: T.hints.stipan };
    return { id: 'po.door', steps: T.hints.door };
  },
  setup: (c) => {
    c.place(PC, { pose: 'prone' });
  },
  intro: function* (c: ScriptCtx): Script {
    yield narrate(T.intro.n1);
    yield narrate(T.intro.n2);
    yield pose(IVO, 'point', { rest: true });
    c.journal('ivo');
  },
  rooms: [senke, bilder, weg, dorf] as ChapterDef['rooms'],
};

