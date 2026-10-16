// Kapitel 3 – Der Dorfplatz. Neretva-Tal, September 1473. Mijo ist achtzehn und hütet die Herde
// des Dorfes; er schneidet für jedes Haus ein Kerbholz.
// Evening: the village hides cattle before the Ottoman census. The father wants every tally stick out
// of sight; Ivan (honest: 13 sheep, a big household) wants his kept. Mijo keeps Ivan's stick.
// Counting day: watch two households at the table (Luka's true nine passes; Stjepan's false eleven
// makes the Emin tilt his head until Frano adds to it), see that the Katib writes only what Frano says,
// and work out what happens to Ivan's honest thirteen. Then Ivan's turn: show the stick or keep silent –
// the father's hand decides either way. Three seconds.
import type { ChapterDef, ScriptCtx } from '../../core/content';
import type { Script } from '../../core/cmd';
import { checkpoint, endChapter, face, fade, narrate, pose, say, wait, waitActor, walk } from '../../core/cmd';
import type { GameState } from '../../core/state';
import { T } from '../text/de/c03_dorf';
import { flags, PC, persp, R } from '../util';

const f = flags('do');
const OTAC = 'otac73';
const IVAN = 'ivan73';
const STJ = 'stjepan73';
const LUKA = 'luka73';
const EMIN = 'emin73';
const KATIB = 'katib73';
const FRANO = 'frano73';
const C = { pc: '#e9d7b0', otac: '#d7b98f', ivan: '#c9d1a0', stj: '#d9b48a', luka: '#cfc5b4', emin: '#b9d3c6', katib: '#d6c09a', frano: '#e0b3a0' };
type Rect4 = [number, number, number, number];
const is = (n: string) => (s: GameState) => !!s.flags[f(n)];

function* lines(actor: string, l: string | readonly string[]): Script {
  for (const t of typeof l === 'string' ? [l] : l) yield say(actor, t);
}

// ------------------------------------------------------------------------------- evening village

function* giveBundle(c: ScriptCtx): Script {
  if (!c.has('kerbhoelzer')) return;
  if (!c.is(f('ivanAsked'))) {
    yield say(PC, T.otac.giveNoIvan);
    c.journal('ivan');
    return;
  }
  yield face(OTAC, PC);
  yield say(PC, T.otac.give);
  c.drop('kerbhoelzer');
  yield say(OTAC, T.otac.giveIvanQ);
  yield say(PC, T.otac.giveIvanA);
  yield wait(0.8);
  yield say(OTAC, T.otac.giveIvanB);
  yield say(OTAC, T.otac.giveIvanC);
  c.give('kerbholz');
  c.set(f('given'));
  c.journal('hoelzer', 'done');
  c.journal('ivan', 'done');
  c.journal('platz');
}

const abend = {
  id: 'do_abend',
  title: T.rooms.abend,
  bg: 'bg_dorfabend',
  width: 1240,
  perspective: persp(226, 380, 81),
  walk: [{ outer: [40, 468, 1210, 468, 1210, 404, 900, 400, 640, 398, 260, 392, 40, 394] }],
  entries: { start: { x: 60, y: 432, face: 1 as const } },
  actorTint: 0xc8bfd8,
  layers: [
    { id: 'herd', image: 'prop_herd_return', x: 0, y: 0, rect: [40, 250, 182, 80] as Rect4, depth: 330 },
    { id: 'tallies', image: 'prop_tally13', x: 0, y: 0, rect: [806, 371, 44, 15] as Rect4, depth: 395, visible: (s: GameState) => !s.flags[f('taken')] },
  ],
  decor: [
    { id: 'smoke1', character: 'smoke', x: 318, y: 238, scale: 0.9, alpha: 0.42, depth: -40000 },
    { id: 'smoke2', character: 'smoke', x: 372, y: 230, scale: 0.75, alpha: 0.35, depth: -40000, phase: 0.8 },
  ],
  hotspots: [
    { id: 'rauch', name: T.abend.rauch.name, shape: R(270, 110, 170, 120), walkTo: null, on: { look: T.abend.rauch.look } },
    { id: 'herde', name: T.abend.herde.name, shape: R(40, 248, 186, 84), walkTo: { x: 150, y: 410, face: -1 as const }, on: { look: T.abend.herde.look } },
    {
      id: 'bank',
      name: T.abend.bank.name,
      shape: R(752, 352, 160, 44),
      priority: 2,
      walkTo: { x: 830, y: 410, face: 1 as const },
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('taken')) ? T.abend.bank.empty : T.abend.bank.look),
        take: function* (c: ScriptCtx): Script {
          if (c.is(f('taken'))) {
            yield say(PC, T.abend.bank.empty);
            return;
          }
          c.set(f('taken'));
          c.give('kerbhoelzer');
          yield say(PC, T.abend.bank.take);
          c.journal('ivan');
        },
      },
    },
    { id: 'tisch', name: T.abend.tisch.name, shape: R(715, 328, 300, 30), walkTo: { x: 900, y: 410, face: 1 as const }, on: { look: T.abend.tisch.look } },
    { id: 'haeuser', name: T.abend.haeuser.name, shape: R(400, 210, 300, 100), walkTo: null, on: { look: T.abend.haeuser.look } },
    { id: 'berge', name: T.abend.berge.name, shape: R(0, 50, 260, 70), walkTo: null, on: { look: T.abend.berge.look } },
    {
      id: 'platz',
      name: T.abend.platz.name,
      shape: R(1196, 380, 44, 90),
      walkTo: { x: 1196, y: 436, face: 1 as const },
      exit: { room: 'do_platz', entry: 'start' },
      exitDir: 'right' as const,
      exitBlocked: (s: GameState) => (s.flags[f('given')] ? null : s.flags[f('taken')] ? T.abend.platz.blockedIvan : T.abend.platz.blocked),
      on: { look: T.abend.platz.look },
    },
  ],
};

// --------------------------------------------------------------------------------- counting day

const TABLE_SPOT = { x: 444, y: 456 };

/** One household at the table: the villager steps up, Frano asks and translates, the Katib writes. */
function* household(c: ScriptCtx, who: string, home: { x: number; y: number }, say1: string, fr: string, tilt: boolean): Script {
  yield walk(PC, 860, 448, { face: -1 });
  yield walk(who, TABLE_SPOT.x, TABLE_SPOT.y, { face: 1 });
  yield face(FRANO, who);
  yield say(FRANO, T.count.ask);
  yield say(who, say1);
  yield face(FRANO, EMIN);
  yield say(FRANO, fr);
  if (tilt) {
    yield pose(KATIB, 'wait', { loop: true });
    yield narrate(T.count.stjepanN1);
    yield say(FRANO, T.count.stjepan3);
    yield narrate(T.count.stjepanN2);
  } else yield narrate(T.count.lukaN);
  yield pose(KATIB, 'write', { loop: true });
  yield face(FRANO, -1);
  yield walk(who, home.x, home.y, { face: 1 });
}

function* watchScript(c: ScriptCtx): Script {
  if (!c.is(f('arrived'))) return;
  if (!c.is(f('sawLuka'))) {
    yield* household(c, LUKA, { x: 352, y: 458 }, T.count.luka1, T.count.luka2, false);
    c.set(f('sawLuka'));
    yield say(PC, T.count.lukaM);
    return;
  }
  if (!c.is(f('sawStjepan'))) {
    yield* household(c, STJ, { x: 176, y: 458 }, T.count.stjepan1, T.count.stjepan2, true);
    c.set(f('sawStjepan'));
    yield say(PC, T.count.stjepanM);
    c.journal('rule');
    return;
  }
  if (!c.is(f('rule'))) {
    yield say(PC, T.platz.stall.watchLater);
    c.journal('rule');
    return;
  }
  yield* climax(c);
}

/** Mijo's reasoning about Ivan's number (examining Ivan's stick on the square). */
function* thinkScript(c: ScriptCtx): Script {
  if (c.room.id !== 'do_platz' || !c.is(f('arrived'))) {
    yield* lines(PC, T.items.kerbholz.look);
    return;
  }
  if (c.is(f('rule'))) {
    yield say(PC, T.think.known);
    return;
  }
  const missing: string[] = [];
  if (!c.is(f('sawLuka'))) missing.push(T.think.missingTable);
  else if (!c.is(f('sawStjepan'))) missing.push(T.think.missingStjepan);
  if (!c.is(f('sawKatib'))) missing.push(T.think.missingKatib);
  if (missing.length) {
    yield say(PC, T.think.notYet);
    for (const m of missing) yield say(PC, m);
    return;
  }
  yield say(PC, T.think.q);
  const pick: string = yield {
    k: 'choice',
    options: [
      { id: 'stays', text: T.think.stays },
      { id: 'smaller', text: T.think.smaller },
      { id: 'larger', text: T.think.larger },
    ],
  };
  if (pick === 'stays') {
    yield say(PC, T.think.staysA);
    return;
  }
  if (pick === 'smaller') {
    yield say(PC, T.think.smallerA);
    return;
  }
  yield say(PC, T.think.largerA);
  yield say(PC, T.think.largerB);
  yield narrate(T.think.largerN);
  c.set(f('rule'));
  c.journal('rule', 'done');
  c.journal('watch', 'done');
  c.journal('ivanTurn');
}

function* climax(c: ScriptCtx): Script {
  yield checkpoint();
  yield walk(PC, 878, 448, { face: -1 });
  yield face(OTAC, -1);
  yield narrate(T.climax.n0);
  yield walk(IVAN, TABLE_SPOT.x, TABLE_SPOT.y, { face: 1 });
  yield face(FRANO, IVAN);
  yield say(FRANO, T.count.ask);
  yield say(IVAN, T.climax.ivan);
  yield face(FRANO, EMIN);
  yield say(FRANO, T.climax.frano);
  yield narrate(T.climax.n1);
  yield narrate(T.climax.n2);
  const pick: string = yield { k: 'choice', options: [{ id: 'show', text: T.climax.show }, { id: 'silent', text: T.climax.silent }] };
  if (pick === 'show') {
    c.set(f('triedToShow'));
    yield walk(PC, 846, 450, { face: -1 });
    yield face(OTAC, PC);
    yield narrate(T.climax.showN);
    yield say(OTAC, T.climax.showV);
  } else {
    c.set(f('keptSilent'));
    yield face(OTAC, PC);
    yield narrate(T.climax.silentN);
  }
  yield narrate(T.climax.three);
  // The held silence: nothing moves, nothing can be clicked.
  yield wait(3);
  yield narrate(T.climax.after1);
  yield walk(IVAN, 416, 456, { face: 1 });
  yield narrate(T.climax.after2);
  yield fade(1, 1.2);
  c.set(f('counted'));
  c.journal('ivanTurn', 'done');
  yield narrate(c.is(f('triedToShow')) ? T.climax.reflectShow : T.climax.reflectSilent);
  yield narrate(T.climax.reflect2);
  yield narrate(T.ivan.after);
  yield narrate(T.climax.end1);
  yield endChapter();
}

const platz = {
  id: 'do_platz',
  title: T.rooms.platz,
  bg: 'bg_dorfplatz',
  width: 1100,
  perspective: persp(280, 385, 86),
  walk: [
    {
      outer: [40, 468, 1080, 468, 1080, 414, 900, 404, 640, 404, 620, 410, 40, 414],
      // The crowd, the stall and the Katib's stool stand on the square.
      holes: [
        [146, 434, 364, 434, 364, 452, 146, 452],
        [560, 418, 722, 418, 722, 440, 560, 440],
        [728, 428, 772, 428, 772, 448, 728, 448],
      ],
    },
  ],
  entries: { start: { x: 868, y: 446, face: -1 as const } },
  // On the counting day the village stands on the square: the evening's people move there.
  prepare: (c: ScriptCtx) => {
    if (c.s.actors[OTAC]?.room !== 'do_platz') c.place(OTAC, { room: 'do_platz', x: 920, y: 440, facing: -1, hidden: false });
    if (c.s.actors[IVAN]?.room !== 'do_platz') c.place(IVAN, { room: 'do_platz', x: 416, y: 456, facing: 1, hidden: false });
    if (c.s.actors[STJ]?.room !== 'do_platz') c.place(STJ, { room: 'do_platz', x: 176, y: 458, facing: 1, hidden: false });
  },
  layers: [
    { id: 'stall', image: 'prop_counting_stall', x: 0, y: 0, rect: [556, 273, 168, 163] as Rect4, depth: 436, visible: is('arrived') },
    { id: 'stool', image: 'prop_stool', x: 0, y: 0, rect: [736, 410, 31, 34] as Rect4, depth: 443, visible: is('arrived') },
  ],
  decor: [{ id: 'crowd', character: 'crowd', x: 255, y: 444 }],
  ambient: [{ fx: 'birds', x: 280, y: 24, params: { area: '260,20,240,70', count: 2, speed: 34, scale: 0.14 } }],
  hotspots: [
    {
      id: 'stall',
      name: T.platz.stall.name,
      shape: R(556, 273, 168, 163),
      visible: is('arrived'),
      walkTo: { x: 860, y: 448, face: -1 as const },
      verbs: ['look', 'watch', 'take'],
      on: { look: T.platz.stall.look, watch: watchScript, take: T.platz.stall.take },
      items: {
        kerbholz: (c: ScriptCtx) => (c.is(f('rule')) ? watchScript(c) : lines(PC, T.think.tableEarly)),
      },
    },
    { id: 'kirche', name: T.platz.kirche.name, shape: R(54, 60, 300, 240), walkTo: null, on: { look: T.platz.kirche.look } },
    { id: 'pferch', name: T.platz.pferch.name, shape: R(150, 300, 470, 96), walkTo: null, on: { look: T.platz.pferch.look } },
    { id: 'menge', name: T.platz.menge.name, decor: 'crowd', walkTo: null, on: { look: T.platz.menge.look, take: T.platz.menge.take } },
    { id: 'baum', name: T.platz.baum.name, shape: R(860, 0, 240, 340), walkTo: null, on: { look: T.platz.baum.look } },
    { id: 'haus', name: T.platz.haus.name, shape: R(690, 270, 170, 90), walkTo: null, priority: 1, on: { look: T.platz.haus.look } },
  ],
  onEnter: function* (c: ScriptCtx): Script {
    if (c.is(f('arrived'))) return;
    yield narrate(T.abend.platz.go);
    yield face(OTAC, PC);
    yield say(OTAC, T.platz.enterA);
    yield say(PC, T.platz.enterB);
    yield say(OTAC, T.platz.enterC);
    yield face(OTAC, -1);
    yield narrate(T.platz.enterN1);
    c.place(EMIN, { room: 'do_platz', x: 1130, y: 446, facing: -1, hidden: false });
    c.place(FRANO, { room: 'do_platz', x: 1180, y: 452, facing: -1, hidden: false });
    c.place(KATIB, { room: 'do_platz', x: 1230, y: 446, facing: -1, hidden: false, character: 'katib' });
    yield walk(EMIN, 568, 444, { direct: true, wait: false, face: -1 });
    yield walk(FRANO, 512, 452, { direct: true, wait: false, face: -1 });
    yield walk(KATIB, 738, 446, { direct: true, face: -1 });
    yield waitActor(EMIN);
    yield waitActor(FRANO);
    c.place(KATIB, { character: 'katib_sit', facing: -1 });
    c.set(f('arrived'));
    yield pose(KATIB, 'sit', { rest: true });
    c.place(KATIB, { pose: 'write' });
    yield narrate(T.platz.enterN2);
    c.journal('platz', 'done');
    c.journal('watch');
    yield checkpoint();
  },
};

// ------------------------------------------------------------------------------------ chapter

export const dorfChapter: ChapterDef = {
  id: 'dorf',
  title: T.title,
  dateline: T.dateline,
  card: { image: 'intro_kap2', cine: 'cine_kap2_a', lines: T.card },
  pc: { character: 'mijo1473', name: T.names.mijo, color: C.pc, relHeight: 0.97 },
  start: { room: 'do_abend', entry: 'start' },
  next: 'povratnik',
  journal: T.journal,
  items: [
    { id: 'kerbhoelzer', name: T.items.kerbhoelzer.name, icon: 'kerbhoelzer', look: T.items.kerbhoelzer.look },
    { id: 'kerbholz', name: T.items.kerbholz.name, icon: 'kerbholz', look: thinkScript },
  ],
  actors: [
    {
      id: OTAC,
      name: T.names.otac,
      character: 'otac',
      color: C.otac,
      start: { room: 'do_abend', x: 1000, y: 406, facing: -1 },
      on: {
        look: (c: ScriptCtx) => lines(PC, c.room.id === 'do_platz' ? [T.vater.look] : T.otac.look),
        talk: (c: ScriptCtx) => (c.room.id === 'do_platz' ? lines(OTAC, c.pick('do.vater', [T.vater.talk, T.vater.talk2])) : c.dialogue('otac73')),
      },
      items: { kerbhoelzer: giveBundle, kerbholz: (c: ScriptCtx) => lines(OTAC, c.room.id === 'do_platz' ? T.vater.talk2 : T.otac.giveIvanC) },
    },
    {
      id: IVAN,
      name: T.names.ivan,
      character: 'ivan',
      color: C.ivan,
      start: { room: 'do_abend', x: 452, y: 414, facing: 1 },
      on: {
        look: (c: ScriptCtx) => lines(PC, c.room.id === 'do_platz' ? T.ivan.platzLook : T.ivan.look),
        talk: (c: ScriptCtx) => (c.room.id === 'do_platz' ? lines(IVAN, T.ivan.platzTalk) : c.dialogue('ivan73')),
      },
      items: { kerbhoelzer: (c: ScriptCtx) => c.dialogue('ivan73') },
    },
    {
      id: STJ,
      name: T.names.stjepan,
      character: 'dorfalter',
      color: C.stj,
      start: { room: 'do_abend', x: 640, y: 408, facing: -1 },
      on: {
        look: (c: ScriptCtx) => lines(PC, c.room.id === 'do_platz' ? T.stjepan.platzLook : T.stjepan.look),
        talk: (c: ScriptCtx) => (c.room.id === 'do_platz' ? lines(PC, T.stjepan.platzLook) : c.dialogue('stjepan73')),
      },
    },
    {
      id: LUKA,
      name: T.names.luka,
      character: 'bauer',
      color: C.luka,
      start: { room: 'do_platz', x: 352, y: 458, facing: 1 },
      on: { look: T.luka.look, talk: (c: ScriptCtx) => lines(LUKA, T.luka.talk) },
    },
    {
      id: EMIN,
      name: T.names.emin,
      character: 'emin',
      color: C.emin,
      start: { room: null, x: 1130, y: 446, facing: -1 },
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('sawStjepan')) ? [T.emin.look[0], T.emin.lookAfter] : T.emin.look),
        talk: (c: ScriptCtx) => lines(PC, T.emin.talk),
      },
    },
    {
      id: KATIB,
      name: T.names.katib,
      character: 'katib',
      color: C.katib,
      start: { room: null, x: 1230, y: 446, facing: -1 },
      on: {
        look: function* (c: ScriptCtx): Script {
          c.set(f('sawKatib'));
          yield* lines(PC, T.katib.look);
        },
        talk: (c: ScriptCtx) => lines(PC, T.katib.talk),
      },
    },
    {
      id: FRANO,
      name: T.names.frano,
      character: 'frano',
      color: C.frano,
      start: { room: null, x: 1180, y: 452, facing: -1 },
      on: { look: T.frano.look, talk: (c: ScriptCtx) => c.dialogue('frano73') },
    },
  ],
  dialogues: [
    {
      id: 'otac73',
      actor: OTAC,
      open: function* (c: ScriptCtx): Script {
        yield say(OTAC, c.is(f('given')) ? T.otac.openDone : T.otac.open);
        if (!c.is(f('given'))) c.journal('hoelzer');
      },
      bye: T.otac.bye,
      options: [
        {
          id: 'stjepan',
          text: T.otac.stjepan,
          run: function* (): Script {
            yield say(OTAC, T.otac.stjepanA);
            yield wait(0.6);
            yield say(OTAC, T.otac.stjepanB);
          },
        },
        { id: 'hoelzer', text: T.otac.hoelzer, run: () => lines(OTAC, [T.otac.hoelzerA, T.otac.hoelzerB]) },
        { id: 'morgen', text: T.otac.morgen, run: () => lines(OTAC, T.otac.morgenA) },
        {
          id: 'give',
          text: T.otac.give,
          when: (s) => s.inventory.includes('kerbhoelzer'),
          repeat: true,
          exit: true,
          run: giveBundle,
        },
      ],
    },
    {
      id: 'ivan73',
      actor: IVAN,
      open: function* (): Script {
        yield say(IVAN, T.ivan.open);
      },
      bye: T.ivan.bye,
      options: [
        {
          id: 'schafe',
          text: T.ivan.schafe,
          run: function* (): Script {
            yield say(IVAN, T.ivan.schafeA);
            yield say(PC, T.ivan.schafeB);
            yield say(IVAN, T.ivan.schafeC);
          },
        },
        { id: 'zaehlung', text: T.ivan.zaehlung, run: () => lines(IVAN, [T.ivan.zaehlungA, T.ivan.zaehlungB]) },
        {
          id: 'holz',
          text: T.ivan.holz,
          when: (s) => s.inventory.includes('kerbhoelzer'),
          run: function* (c: ScriptCtx): Script {
            yield say(IVAN, T.ivan.holzA);
            yield say(IVAN, T.ivan.holzB);
            c.set(f('ivanAsked'));
            c.journal('ivan', 'done');
          },
        },
      ],
    },
    {
      id: 'stjepan73',
      actor: STJ,
      open: function* (): Script {
        yield say(STJ, T.stjepan.open);
      },
      bye: T.stjepan.bye,
      options: [
        {
          id: 'wieviel',
          text: T.stjepan.wieviel,
          run: function* (c: ScriptCtx): Script {
            yield say(STJ, T.stjepan.wievielA);
            yield say(PC, T.stjepan.wievielQ);
            yield say(STJ, T.stjepan.wievielB);
            c.set(f('stjepanLie'));
          },
        },
        { id: 'angst', text: T.stjepan.angst, run: () => lines(STJ, T.stjepan.angstA) },
      ],
    },
    {
      id: 'frano73',
      actor: FRANO,
      open: function* (): Script {
        yield say(FRANO, T.frano.open);
      },
      bye: T.frano.bye,
      options: [
        { id: 'woher', text: T.frano.woher, run: () => lines(FRANO, T.frano.woherA) },
        { id: 'schwer', text: T.frano.schwer, run: () => lines(FRANO, [T.frano.schwerA, T.frano.schwerB]) },
      ],
    },
  ],
  hint: (s) => {
    const fl = (n: string) => !!s.flags[f(n)];
    if (s.room === 'do_abend' || !s.room) {
      if (!fl('taken')) return { id: 'do.hoelzer', steps: T.hints.hoelzer };
      if (!fl('ivanAsked')) return { id: 'do.ivan', steps: T.hints.ivan };
      if (!fl('given')) return { id: 'do.give', steps: T.hints.give };
      return { id: 'do.platz', steps: T.hints.platz };
    }
    if (!fl('sawLuka') || !fl('sawStjepan') || !fl('sawKatib')) return { id: 'do.watch', steps: T.hints.watch };
    if (!fl('rule')) return { id: 'do.rule', steps: T.hints.rule };
    return { id: 'do.turn', steps: T.hints.turn };
  },
  intro: function* (c: ScriptCtx): Script {
    yield narrate(T.intro.n1);
    yield walk(PC, 230, 430, { face: 1 });
    yield narrate(T.intro.n2);
    c.journal('hoelzer');
  },
  rooms: [abend, platz] as ChapterDef['rooms'],
};

