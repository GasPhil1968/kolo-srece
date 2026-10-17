// Kapitel 10 – Das Lager. An der Straße nach Sarajevo, September 1878. A creek has taken the road; the
// column waits three days. Zeman of the finance ministry, building the land register, came back from
// Vitina with seventeen names for eleven men and asks the interpreter what is wrong with his form. The
// answer needs both rooms: the list (one man, three names, all of them right), the sketch of Vitina in
// the staff tent (forty-three numbered fields and a pasture without a number – like the pasture under the
// stone at home), the form with one line for "Eigentümer". Mijo draws the missing column himself. Zeman
// takes Vitina for an exception until the register box shows fourteen villages filled in the same way.
// "Wir schreiben es auf, und dann ist es so. Ohne Sie ginge es gar nicht." Lieutenant Rehberger notes
// everything under Landeskunde – including what became of the farmer from the tent, as Mijo translated him.
import type { ChapterDef, RoomDef, ScriptCtx } from '../../core/content';
import type { Script } from '../../core/cmd';
import { checkpoint, endChapter, fade, narrate, say } from '../../core/cmd';
import type { GameState } from '../../core/state';
import { T } from '../text/de/c10_lager';
import { flags, PC, persp2, R } from '../util';

const f = flags('lg');
const ZEMAN = 'lg_zeman';
const REHBERGER = 'lg_rehberger';
const C = { pc: '#d9cdb4', zeman: '#d8c49a', rehberger: '#b9c8e0' };
type Rect4 = [number, number, number, number];
const fl = (s: GameState, n: string) => !!s.flags[f(n)];
const has = (s: GameState, item: string) => s.inventory.includes(item);

function* lines(actor: string, l: string | readonly string[]): Script {
  for (const t of typeof l === 'string' ? [l] : l) yield say(actor, t);
}

function* exchange(rows: readonly (readonly [string, string])[]): Script {
  for (const [who, t] of rows) {
    if (who === 'n') yield narrate(t);
    else yield say(who === 'm' ? PC : who === 'z' ? ZEMAN : REHBERGER, t);
  }
}

// ========================================================================================== Das Lager

function* takeFolder(c: ScriptCtx): Script {
  if (c.is(f('mappe'))) {
    yield say(PC, T.lager.mappe.lookEmpty);
    return;
  }
  if (!c.is(f('met'))) {
    yield say(PC, T.lager.mappe.notYet);
    return;
  }
  c.set(f('mappe'));
  c.give('formular');
  c.give('liste');
  yield say(PC, T.lager.mappe.take);
}

function* coffee(c: ScriptCtx): Script {
  if (c.is(f('kaffee'))) {
    yield say(PC, T.lager.kessel.again);
    return;
  }
  c.set(f('kaffee'));
  yield say(PC, T.lager.kessel.use);
}

function* road(c: ScriptCtx): Script {
  if (!c.is(f('verstanden'))) {
    yield* lines(PC, T.lager.strasse.notYet);
    return;
  }
  yield fade(1, 1.2);
  c.journal('strasse', 'done');
  for (const t of T.lager.strasse.out) yield narrate(t);
  yield endChapter();
}

const lager: RoomDef = {
  id: 'lg_lager',
  title: T.rooms.lager,
  bg: 'bg_lager',
  width: 1240,
  perspective: persp2(300, 117, 462, 222),
  walk: [
    {
      outer: [340, 466, 760, 466, 800, 430, 720, 385, 650, 330, 560, 292, 430, 292, 340, 330, 320, 390],
      holes: [[455, 362, 590, 362, 590, 328, 455, 328]],
    },
  ],
  entries: { start: { x: 380, y: 440, face: 1 }, zelt: { x: 352, y: 336, face: 1 } },
  assets: ['prop_folder_empty', 'prop_folder_papers', 'prop_rifles'],
  layers: [
    { id: 'mappe', image: 'prop_folder_empty', x: 0, y: 0, rect: [229, 321, 70, 38] as Rect4, depth: 360 },
    { id: 'papiere', image: 'prop_folder_papers', x: 0, y: 0, rect: [237, 325, 54, 24] as Rect4, depth: 361, visible: (s) => !fl(s, 'mappe') },
    { id: 'gewehre', image: 'prop_rifles', x: 0, y: 0, rect: [414, 336, 63, 87] as Rect4, depth: 422 },
  ],
  decor: [
    { id: 'feuer', character: 'flame', x: 516, y: 346, scale: 0.42, alpha: 0.85, depth: 346 },
    { id: 'feuer2', character: 'flame', x: 716, y: 264, scale: 0.2, alpha: 0.8, depth: 264, phase: 0.4 },
  ],
  ambient: [{ fx: 'motes', x: 440, y: 230, params: { area: '440,230,160,110', count: 14, vx: 4, vy: -18, alpha: 0.6, size: 2 } }],
  hotspots: [
    {
      id: 'mappe',
      name: T.lager.mappe.name,
      shape: R(224, 316, 80, 46),
      walkTo: { x: 342, y: 372, face: -1 },
      priority: 3,
      verbs: ['look', 'take'],
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('mappe')) ? T.lager.mappe.lookEmpty : T.lager.mappe.look), take: takeFolder, use: takeFolder },
    },
    { id: 'feuer', name: T.lager.feuer.name, shape: R(462, 300, 120, 62), walkTo: null, priority: 1, on: { look: T.lager.feuer.look } },
    {
      id: 'kessel',
      name: T.lager.kessel.name,
      shape: R(340, 340, 70, 50),
      walkTo: { x: 420, y: 400, face: -1 },
      priority: 2,
      verbs: ['look', 'use'],
      on: { look: T.lager.kessel.look, use: coffee },
    },
    { id: 'gewehre', name: T.lager.gewehre.name, shape: R(414, 336, 63, 87), walkTo: null, priority: 2, verbs: ['look', 'take'], on: { look: T.lager.gewehre.look, take: T.lager.gewehre.take } },
    { id: 'zelte', name: T.lager.zelte.name, shape: R(260, 140, 200, 110), walkTo: null, priority: 0, on: { look: T.lager.zelte.look } },
    { id: 'wagen', name: T.lager.wagen.name, shape: R(505, 145, 200, 105), walkTo: null, priority: 0, on: { look: T.lager.wagen.look } },
    { id: 'berge', name: T.lager.berge.name, shape: R(300, 0, 940, 120), walkTo: null, priority: -1, on: { look: T.lager.berge.look } },
    {
      id: 'stabszelt',
      name: T.lager.stabszelt.name,
      shape: R(0, 100, 250, 170),
      walkTo: { x: 345, y: 334, face: -1 },
      priority: 1,
      exit: { room: 'lg_stab', entry: 'start' },
      exitDir: 'left',
      verbs: ['look', 'go'],
      on: { look: T.lager.stabszelt.look },
    },
    {
      id: 'strasse',
      name: T.lager.strasse.name,
      shape: R(780, 300, 460, 170),
      walkTo: { x: 770, y: 440, face: 1 },
      priority: 1,
      verbs: ['look', 'go'],
      on: { look: T.lager.strasse.look, go: road },
    },
  ],
  onEnter: function* (c: ScriptCtx): Script {
    if (c.is(f('arrived'))) return;
    c.set(f('arrived'));
    c.journal('zeman');
  },
};

// ======================================================================================== Stabszelt

function* readRegister(c: ScriptCtx): Script {
  if (c.is(f('register'))) {
    yield say(PC, T.stab.register.lookDone);
    return;
  }
  c.set(f('register'));
  yield* lines(PC, T.stab.register.read);
  yield narrate(T.stab.register.readN);
  yield checkpoint();
}

function* lookSketch(c: ScriptCtx): Script {
  if (c.is(f('weide'))) {
    yield say(PC, T.stab.flurkarte.lookAgain);
    return;
  }
  c.set(f('weide'));
  yield* lines(PC, T.stab.flurkarte.look);
}

const stab: RoomDef = {
  id: 'lg_stab',
  title: T.rooms.stab,
  bg: 'bg_stabszelt',
  width: 980,
  perspective: persp2(398, 165, 462, 196),
  walk: [{ outer: [60, 466, 920, 466, 920, 412, 760, 402, 660, 428, 300, 428, 170, 404, 60, 404] }],
  entries: { start: { x: 120, y: 440, face: 1 } },
  hotspots: [
    {
      id: 'register',
      name: T.stab.register.name,
      shape: R(612, 283, 140, 34),
      walkTo: { x: 700, y: 430, face: -1 },
      priority: 2,
      verbs: ['look', 'use', 'take'],
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('register')) ? T.stab.register.lookDone : T.stab.register.look),
        use: (c: ScriptCtx) => (c.is(f('register')) ? lines(PC, T.stab.register.lookDone) : lines(PC, T.stab.register.noForm)),
        take: T.stab.register.take,
      },
      items: { formular: readRegister, besitzbogen: readRegister },
    },
    { id: 'flurkarte', name: T.stab.flurkarte.name, shape: R(425, 328, 150, 26), walkTo: { x: 500, y: 436, face: -1 }, priority: 3, verbs: ['look'], on: { look: lookSketch } },
    { id: 'karte', name: T.stab.karte.name, shape: R(402, 238, 96, 64), walkTo: null, priority: 2, on: { look: T.stab.karte.look } },
    { id: 'lampe', name: T.stab.lampe.name, shape: R(372, 284, 34, 52), walkTo: null, priority: 3, on: { look: T.stab.lampe.look } },
    { id: 'maentel', name: T.stab.maentel.name, shape: R(300, 232, 52, 104), walkTo: null, priority: 1, on: { look: T.stab.maentel.look } },
    { id: 'feldbett', name: T.stab.feldbett.name, shape: R(758, 306, 222, 72), walkTo: null, priority: 1, on: { look: T.stab.feldbett.look } },
    {
      id: 'ausgang',
      name: T.stab.ausgang.name,
      shape: R(0, 190, 120, 220),
      walkTo: { x: 80, y: 440, face: -1 },
      priority: 1,
      exit: { room: 'lg_lager', entry: 'zelt' },
      exitDir: 'left',
      verbs: ['look', 'go'],
      on: { look: T.stab.ausgang.look },
    },
  ],
};

// ======================================================================================== the chapter

function* makeForm(c: ScriptCtx): Script {
  if (!c.is(f('namen'))) {
    yield say(PC, T.items.combineNoNamen);
    return;
  }
  if (!c.is(f('weide'))) {
    yield* lines(PC, T.items.combineNoWeide);
    return;
  }
  c.drop('formular');
  c.drop('liste');
  c.give('besitzbogen');
  yield* lines(PC, T.items.combine);
  yield narrate(T.items.combineN);
  yield checkpoint();
}

function* lookList(c: ScriptCtx): Script {
  if (c.is(f('namen'))) {
    yield say(PC, T.items.liste.lookAgain);
    return;
  }
  c.set(f('namen'));
  yield* lines(PC, T.items.liste.look);
  c.journal('formular');
}

function* understood(c: ScriptCtx): Script {
  yield* exchange(T.lager.zeman.vierzehnLines);
  c.drop('besitzbogen');
  c.set(f('verstanden'));
  c.journal('register', 'done');
  c.journal('strasse');
  yield checkpoint();
}

export const lagerChapter: ChapterDef = {
  id: 'lager',
  title: T.title,
  dateline: T.dateline,
  card: { image: 'intro_lager', cine: 'cine_lager_a', lines: T.card },
  pc: { character: 'mijo1878', name: T.names.mijo, color: C.pc },
  start: { room: 'lg_lager', entry: 'start' },
  next: null,
  journal: T.journal,
  items: [
    {
      id: 'formular',
      name: T.items.formular.name,
      icon: 'formular',
      look: () => lines(PC, T.items.formular.look),
      combine: { liste: makeForm },
    },
    { id: 'liste', name: T.items.liste.name, icon: 'zettel', look: lookList, combine: { formular: makeForm } },
    { id: 'besitzbogen', name: T.items.bogen.name, icon: 'besitzbogen', look: T.items.bogen.look },
  ],
  actors: [
    {
      id: ZEMAN,
      name: T.names.zeman,
      character: 'zeman',
      color: C.zeman,
      start: { room: 'lg_lager', x: 612, y: 404, facing: -1 },
      talkOffset: 80,
      verbs: ['look', 'talk'],
      on: { look: T.lager.zeman.look, talk: (c: ScriptCtx) => c.dialogue('lg_zeman') },
    },
    {
      id: REHBERGER,
      name: T.names.rehberger,
      character: 'rehberger',
      color: C.rehberger,
      start: { room: 'lg_stab', x: 640, y: 446, facing: -1 },
      talkOffset: 104,
      verbs: ['look', 'talk'],
      on: { look: T.stab.rehberger.look, talk: (c: ScriptCtx) => c.dialogue('lg_rehberger') },
    },
  ],
  dialogues: [
    {
      id: 'lg_zeman',
      actor: ZEMAN,
      open: function* (c: ScriptCtx): Script {
        if (!c.is(f('met'))) {
          c.set(f('met'));
          yield* exchange(T.lager.zeman.first);
          c.journal('zeman', 'done');
          c.journal('formular');
          return;
        }
        yield say(ZEMAN, c.is(f('verstanden')) ? T.lager.zeman.openDone : T.lager.zeman.open);
      },
      bye: T.lager.zeman.bye,
      options: [
        { id: 'namen', text: T.lager.zeman.namen, when: (s) => fl(s, 'namen'), run: () => exchange(T.lager.zeman.namenLines) },
        {
          id: 'spalte',
          text: T.lager.zeman.spalte,
          when: (s) => has(s, 'besitzbogen') && !fl(s, 'spalte'),
          run: function* (c: ScriptCtx): Script {
            yield* exchange(T.lager.zeman.spalteLines);
            c.set(f('spalte'));
            c.journal('formular', 'done');
            if (c.is(f('register'))) {
              yield* understood(c);
              return;
            }
            yield say(ZEMAN, T.lager.zeman.einDorf);
            c.journal('register');
          },
        },
        { id: 'wo', text: T.lager.zeman.woRegister, when: (s) => fl(s, 'spalte') && !fl(s, 'register'), run: () => lines(ZEMAN, T.lager.zeman.woRegisterA) },
        {
          id: 'vierzehn',
          text: T.lager.zeman.vierzehn,
          when: (s) => fl(s, 'spalte') && fl(s, 'register') && !fl(s, 'verstanden'),
          exit: true,
          run: understood,
        },
      ],
    },
    {
      id: 'lg_rehberger',
      actor: REHBERGER,
      open: function* (): Script {
        yield say(REHBERGER, T.stab.rehberger.open);
      },
      bye: T.stab.rehberger.bye,
      options: [
        { id: 'block', text: T.stab.rehberger.block, run: () => exchange(T.stab.rehberger.blockLines) },
        { id: 'enge', text: T.stab.rehberger.enge, when: (s) => !!s.flags['ko.bandaged'], run: () => exchange(T.stab.rehberger.engeLines) },
        {
          id: 'bauer',
          text: T.stab.rehberger.bauer,
          run: (c: ScriptCtx) => exchange(c.is('ko.protocolCurse') ? T.stab.rehberger.bauerFluch : T.stab.rehberger.bauerGut),
        },
        { id: 'karte', text: T.stab.rehberger.karte, run: () => exchange(T.stab.rehberger.karteLines) },
      ],
    },
  ],
  hint: (s) => {
    if (!fl(s, 'met')) return { id: 'lg.zeman', steps: T.hints.zeman };
    if (fl(s, 'verstanden')) return { id: 'lg.strasse', steps: T.hints.strasse };
    if (!fl(s, 'mappe')) return { id: 'lg.mappe', steps: T.hints.mappe };
    if (!fl(s, 'spalte')) {
      if (!fl(s, 'namen')) return { id: 'lg.namen', steps: T.hints.namen };
      if (!has(s, 'besitzbogen')) return fl(s, 'weide') ? { id: 'lg.bogen', steps: T.hints.bogen } : { id: 'lg.weide', steps: T.hints.weide };
      return { id: 'lg.spalte', steps: T.hints.spalte };
    }
    if (!fl(s, 'register')) return { id: 'lg.register', steps: T.hints.register };
    return { id: 'lg.vierzehn', steps: T.hints.vierzehn };
  },
  setup: (c: ScriptCtx) => {
    c.place(PC, { character: 'mijo1878', pose: 'stand', gait: 'walk' });
    // Started from the chapter menu: the gorge happened (he wore the dressing).
    if (c.flag('ko.bandaged') === undefined) c.set('ko.bandaged');
  },
  intro: function* (c: ScriptCtx): Script {
    yield narrate(T.intro.n1);
    yield say(PC, T.intro.a);
    c.journal('zeman');
  },
  rooms: [lager, stab],
};
