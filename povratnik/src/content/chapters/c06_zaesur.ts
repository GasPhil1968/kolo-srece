// Kapitel 6 – Zäsur. Sarajevo, später am selben Nachmittag, 1996. The pause between the two halves of the
// telling: MacLeod in Mijo's room after the Elf Tage. Chain: the empty cup held out (Mijo only tells over
// coffee) -> the last page of the Band, too small for the evening light (lamp on, Band into the light, the
// lens) -> "Slaven." with no year, place, killer or manner, and "Ich habe ihn getragen und nicht angesehen."
// -> the question MacLeod has held back for an hour. Wrong readings ("Er ist tot") are answered from the
// Band's own rule: every death in it says who and how. Optional: the returned letters, the back cover.
import type { ChapterDef, RoomDef, ScriptCtx } from '../../core/content';
import type { Script } from '../../core/cmd';
import { choice, endChapter, face, fade, narrate, say, vignette, wait, walk } from '../../core/cmd';
import type { GameState } from '../../core/state';
import { T } from '../text/de/c06_zaesur';
import { flags, PC, persp, R } from '../util';

const f = flags('za');
const MIJO = 'mijo96z';
const C = { pc: '#a9cbe8', mijo: '#e8c38a' };
type Rect4 = [number, number, number, number];
const fl = (s: GameState, n: string) => !!s.flags[f(n)];
const is = (n: string) => (s: GameState) => fl(s, n);
const not = (n: string) => (s: GameState) => !fl(s, n);

function* lines(actor: string, l: string | readonly string[]): Script {
  for (const t of typeof l === 'string' ? [l] : l) yield say(actor, t);
}

const TABLE_SPOT = { x: 940, y: 442, face: 1 as const };
const DESK_SPOT = { x: 230, y: 428, face: -1 as const };

// ------------------------------------------------------------------------------------- the cup

function* takeCup(c: ScriptCtx): Script {
  if (c.is(f('refilled'))) {
    yield say(PC, T.zimmer.tasseMac.takeFull);
    return;
  }
  c.set(f('cupTaken'));
  c.give('za_tasse');
  yield say(PC, T.zimmer.tasseMac.take);
}

function* cupBack(c: ScriptCtx): Script {
  if (!c.has('za_tasse')) return;
  c.drop('za_tasse');
  c.unset(f('cupTaken'));
  yield say(PC, T.refill.back);
}

/** The empty cup held out: Mijo comes back from the valley and makes coffee. */
function* refill(c: ScriptCtx): Script {
  if (c.is(f('refilled'))) return;
  yield say(PC, T.refill.hold);
  yield face(MIJO, PC);
  yield say(MIJO, T.refill.m1);
  yield say(PC, T.refill.p1);
  c.drop('za_tasse');
  c.unset(f('cupTaken'));
  c.set(f('dzezvaAway'));
  yield walk(MIJO, 785, 366, { face: -1 });
  c.place(MIJO, { hidden: true });
  yield fade(0.65, 0.6);
  yield narrate(T.refill.n1);
  c.place(MIJO, { hidden: false, x: 785, y: 368 });
  c.unset(f('dzezvaAway'));
  yield fade(0, 0.6);
  const pcX = c.s.actors[PC]?.x ?? 640;
  // Back to his place by the window, on the far side of MacLeod.
  yield walk(MIJO, pcX > 1000 ? Math.max(860, pcX - 110) : 1100, 440, { face: pcX > 1000 ? 1 : -1 });
  c.set(f('refilled'));
  yield narrate(T.refill.n2);
  yield face(MIJO, PC);
  yield say(MIJO, T.refill.m2);
  c.journal('tasse', 'done');
  c.journal('frage');
  if (!c.is(f('pageRead'))) c.journal('seite');
}

// ------------------------------------------------------------------------------------- the page

function* bandToLight(c: ScriptCtx): Script {
  if (!c.has('za_band')) return;
  yield walk(PC, DESK_SPOT.x, DESK_SPOT.y, { face: -1 });
  c.drop('za_band');
  c.set(f('bandDesk'));
  yield say(PC, c.is(f('lamp')) ? T.zimmer.bandPut : T.zimmer.bandPutDark);
}

function* toggleLamp(c: ScriptCtx): Script {
  if (c.is(f('lamp'))) {
    c.unset(f('lamp'));
    yield say(PC, T.zimmer.lampe.off);
  } else {
    c.set(f('lamp'));
    yield say(PC, T.zimmer.lampe.on);
  }
}

function* useLens(c: ScriptCtx): Script {
  if (!c.is(f('bandDesk'))) {
    yield say(PC, T.zimmer.lupe.nothing);
    return;
  }
  if (!c.is(f('lamp'))) {
    yield say(PC, T.zimmer.lupe.dark);
    return;
  }
  if (!c.is(f('pageRead'))) {
    yield vignette('cine_zaesur_a', { captions: ['„Slaven.“', '„Ich habe ihn getragen und nicht angesehen.“'], t: 7, fps: 3 });
    yield narrate(T.zimmer.lupe.readN);
    c.set(f('pageRead'));
    c.journal('seite', 'done');
    if (!c.is(f('refilled'))) c.journal('tasse');
  } else if (!c.is(f('cover'))) {
    yield narrate(T.zimmer.lupe.coverN);
    yield say(PC, T.zimmer.lupe.cover);
    c.set(f('cover'));
  } else {
    yield say(PC, T.zimmer.lupe.again);
  }
  c.unset(f('bandDesk'));
  c.give('za_band');
  yield say(PC, T.zimmer.lupe.back);
}

function* takeBandFromDesk(c: ScriptCtx): Script {
  c.unset(f('bandDesk'));
  c.give('za_band');
  yield say(PC, T.zimmer.bandHier.take);
}

// ------------------------------------------------------------------------------------ the question

function* talkMijo(c: ScriptCtx): Script {
  if (!c.is(f('refilled'))) {
    yield say(PC, T.zimmer.mijo.silent);
    yield say(PC, T.zimmer.mijo.silentWhy);
    return;
  }
  if (!c.is(f('pageRead'))) {
    yield say(MIJO, T.refill.m2);
    yield say(PC, T.zimmer.mijo.notYet);
    return;
  }
  yield* askScript(c);
}

function* bandOnMijo(c: ScriptCtx): Script {
  if (!c.is(f('refilled'))) {
    yield say(PC, T.zimmer.mijo.bandBefore);
    return;
  }
  if (!c.is(f('pageRead'))) {
    yield say(PC, T.zimmer.mijo.notYet);
    return;
  }
  yield say(PC, T.ask.put);
  yield* askScript(c);
}

/** Asked until the right reading is said; wrong readings are answered, nothing is lost. */
function* askScript(c: ScriptCtx): Script {
  yield face(MIJO, PC);
  for (;;) {
    const opts = [
      { id: 'who', text: T.ask.who },
      { id: 'dead', text: T.ask.dead },
      ...(c.is(f('letters')) && !c.is(f('askedLetters')) ? [{ id: 'letters', text: T.ask.letters }] : []),
      ...(c.is(f('cover')) && !c.is(f('askedCover')) ? [{ id: 'cover', text: T.ask.cover }] : []),
      { id: 'boy', text: T.ask.boy },
    ];
    const pick: string = yield choice(opts);
    yield say(PC, opts.find((o) => o.id === pick)!.text);
    if (pick === 'who') {
      yield say(MIJO, T.ask.whoA);
      yield say(MIJO, T.ask.whoB);
      return;
    }
    if (pick === 'dead') {
      yield say(MIJO, T.ask.deadA);
      yield say(PC, T.ask.deadP);
      yield say(MIJO, T.ask.deadB);
      return;
    }
    if (pick === 'letters') {
      c.set(f('askedLetters'));
      yield say(MIJO, T.ask.lettersA);
      continue;
    }
    if (pick === 'cover') {
      c.set(f('askedCover'));
      yield say(MIJO, T.ask.coverA);
      continue;
    }
    break;
  }
  yield say(PC, T.ask.f1);
  yield say(MIJO, T.ask.f2);
  yield say(PC, T.ask.f3);
  yield say(MIJO, T.ask.f4);
  yield wait(0.8);
  yield say(PC, T.ask.f5);
  yield say(MIJO, T.ask.f6);
  yield say(MIJO, T.ask.f7);
  yield say(PC, T.ask.f8);
  yield say(MIJO, T.ask.f9);
  c.set(f('asked'));
  c.journal('frage', 'done');
  yield vignette('cine_zaesur_b', { captions: [T.ask.end1, T.ask.end2], t: 9, fps: 3 });
  yield endChapter();
}

// --------------------------------------------------------------------------------------- room

const zimmer: RoomDef = {
  id: 'za_zimmer',
  title: T.rooms.zimmer,
  bg: 'bg_prolog',
  width: 1280,
  perspective: persp(178, 350, 190),
  shade: 0.16,
  shadeColor: 0x4a2410,
  actorTint: 0xf2d6b8,
  walk: [{ outer: [60, 462, 1240, 462, 1240, 436, 1095, 436, 1088, 429, 830, 429, 812, 370, 850, 360, 420, 360, 410, 410, 115, 412, 60, 440] }],
  entries: { start: { x: 640, y: 442, face: 1 } },
  assets: ['prop_lampe_an', 'prop_lampe_aus', 'prop_schublade_offen', 'cine_zaesur_a', 'cine_zaesur_b'],
  layers: [
    { id: 'lampe', image: (s) => (fl(s, 'lamp') ? 'prop_lampe_an' : 'prop_lampe_aus'), x: 0, y: 0, rect: [126, 249, 110, 76] as Rect4 },
    { id: 'notes', image: 'prop_notes', x: 0, y: 0, rect: [300, 309, 90, 22] as Rect4 },
    { id: 'lupe', image: 'prop_lupe', x: 0, y: 0, rect: [282, 318, 34, 9] as Rect4 },
    { id: 'schublade', image: 'prop_schublade_offen', x: 0, y: 0, rect: [270, 334, 58, 30] as Rect4 },
    { id: 'bandDesk', image: 'prop_band', x: 0, y: 0, rect: [190, 312, 30, 24] as Rect4, visible: is('bandDesk') },
    { id: 'band', image: 'prop_band', x: 0, y: 0, rect: [902, 336, 32, 26] as Rect4, visible: is('bandTable') },
    { id: 'dzezva', image: 'prop_dzezva', x: 0, y: 0, rect: [952, 318, 30, 34] as Rect4, visible: not('dzezvaAway') },
    { id: 'tasseMijo', image: 'prop_tasse_voll', x: 0, y: 0, rect: [880, 349, 28, 14] as Rect4 },
    { id: 'tasseZwei', image: 'prop_tasse_voll', x: 0, y: 0, rect: [1004, 351, 28, 14] as Rect4 },
    { id: 'tasseMac', image: (s) => (fl(s, 'refilled') ? 'prop_tasse_voll' : 'prop_tasse_leer'), x: 0, y: 0, rect: [1044, 354, 26, 13] as Rect4, visible: not('cupTaken') },
  ],
  decor: [
    { id: 'steam1', character: 'steam', x: 894, y: 350, scale: 0.16, alpha: 0.45, depth: -40000, visible: is('refilled') },
    { id: 'steam2', character: 'steam', x: 1057, y: 355, scale: 0.15, alpha: 0.45, depth: -40000, phase: 0.6, visible: is('refilled') },
  ],
  hotspots: [
    { id: 'regal', name: T.zimmer.regal.name, shape: R(55, 70, 240, 245), walkTo: { x: 255, y: 424, face: -1 as const }, on: { look: T.zimmer.regal.look, take: T.zimmer.regal.take } },
    {
      id: 'pult',
      name: T.zimmer.pult.name,
      shape: R(120, 318, 140, 30),
      walkTo: DESK_SPOT,
      on: { look: T.zimmer.pult.look, take: T.zimmer.pult.take },
      items: { za_band: bandToLight },
    },
    {
      id: 'lampe',
      name: T.zimmer.lampe.name,
      shape: R(126, 249, 110, 70),
      walkTo: DESK_SPOT,
      priority: 2,
      verbs: ['look', 'use'],
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('lamp')) ? T.zimmer.lampe.lookOn : T.zimmer.lampe.lookOff), use: toggleLamp },
      items: { za_band: bandToLight },
    },
    {
      id: 'bandDesk',
      name: T.zimmer.bandHier.name,
      shape: R(184, 306, 42, 34),
      visible: is('bandDesk'),
      walkTo: DESK_SPOT,
      priority: 4,
      verbs: ['look', 'take'],
      on: { look: T.zimmer.bandHier.look, take: takeBandFromDesk },
    },
    {
      id: 'lupe',
      name: T.zimmer.lupe.name,
      shape: R(276, 310, 46, 18),
      walkTo: DESK_SPOT,
      priority: 3,
      verbs: ['look', 'use', 'take'],
      on: { look: T.zimmer.lupe.look, use: useLens, take: T.zimmer.lupe.take },
      items: { za_band: bandToLight },
    },
    {
      id: 'schublade',
      name: T.zimmer.schublade.name,
      shape: R(262, 330, 76, 38),
      walkTo: DESK_SPOT,
      priority: 3,
      verbs: ['look', 'open', 'take'],
      on: {
        look: function* (c: ScriptCtx): Script {
          c.set(f('letters'));
          yield* lines(PC, T.zimmer.schublade.look);
        },
        open: T.zimmer.schublade.open,
        take: T.zimmer.schublade.take,
      },
    },
    { id: 'fensterL', name: T.zimmer.fensterL.name, shape: R(435, 110, 230, 165), walkTo: { x: 550, y: 366, face: 1 as const }, on: { look: T.zimmer.fensterL.look } },
    { id: 'heizung', name: T.zimmer.heizung.name, shape: R(460, 283, 170, 66), walkTo: { x: 545, y: 368, face: 1 as const }, on: { look: T.zimmer.heizung.look } },
    { id: 'tuer', name: T.zimmer.tuer.name, shape: R(725, 130, 120, 220), walkTo: { x: 785, y: 364, face: 1 as const }, verbs: ['look', 'use'], on: { look: T.zimmer.tuer.look, use: T.zimmer.tuer.look } },
    { id: 'bild', name: T.zimmer.bild.name, shape: R(880, 170, 65, 58), walkTo: { x: 905, y: 438, face: 1 as const }, on: { look: T.zimmer.bild.look } },
    { id: 'fensterR', name: T.zimmer.fensterR.name, shape: R(970, 110, 245, 165), walkTo: { x: 1060, y: 444, face: 1 as const }, on: { look: T.zimmer.fensterR.look } },
    { id: 'sofa', name: T.zimmer.sofa.name, shape: { poly: [940, 300, 1010, 278, 1280, 278, 1280, 400, 1090, 400, 1086, 380, 940, 375] }, walkTo: { x: 1180, y: 444, face: 1 as const }, on: { look: T.zimmer.sofa.look, use: T.zimmer.sofa.use } },
    {
      id: 'tasseMijo',
      name: T.zimmer.tasseMijo.name,
      shape: R(876, 343, 36, 22),
      walkTo: { x: 895, y: 440, face: 1 as const },
      priority: 4,
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('refilled')) ? T.zimmer.tasseMijo.lookFull : T.zimmer.tasseMijo.look), take: T.zimmer.tasseMijo.take },
      items: { za_tasse: T.refill.onTwo },
    },
    {
      id: 'tasseZwei',
      name: T.zimmer.tasseZwei.name,
      shape: R(1000, 345, 36, 22),
      walkTo: { x: 1015, y: 440, face: 1 as const },
      priority: 4,
      on: { look: T.zimmer.tasseZwei.look, take: T.zimmer.tasseZwei.take },
      items: { za_tasse: T.refill.onTwo },
    },
    {
      id: 'tasseMac',
      name: T.zimmer.tasseMac.name,
      shape: R(1040, 348, 32, 20),
      visible: not('cupTaken'),
      walkTo: { x: 1050, y: 440, face: 1 as const },
      priority: 4,
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('refilled')) ? T.zimmer.tasseMac.lookFull : T.zimmer.tasseMac.look), take: takeCup },
    },
    {
      id: 'dzezva',
      name: T.zimmer.dzezva.name,
      shape: R(948, 314, 38, 42),
      visible: not('dzezvaAway'),
      walkTo: { x: 960, y: 440, face: 1 as const },
      priority: 5,
      on: { look: T.zimmer.dzezva.look, take: T.zimmer.dzezva.use, use: T.zimmer.dzezva.use },
      items: { za_tasse: T.refill.onDzezva },
    },
    {
      id: 'band',
      name: T.zimmer.band.name,
      shape: R(896, 330, 44, 34),
      visible: is('bandTable'),
      walkTo: TABLE_SPOT,
      priority: 5,
      verbs: ['look', 'take'],
      on: {
        look: T.zimmer.band.look,
        take: function* (c: ScriptCtx): Script {
          c.unset(f('bandTable'));
          c.give('za_band');
          if (!c.is(f('pageRead'))) c.journal('seite');
          yield say(PC, T.zimmer.band.take);
        },
      },
    },
    {
      id: 'couchtisch',
      name: T.zimmer.couchtisch.name,
      shape: { poly: [822, 352, 1085, 352, 1085, 428, 822, 428] },
      walkTo: TABLE_SPOT,
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('bandTable')) ? T.zimmer.couchtisch.look : T.zimmer.couchtisch.lookAfter) },
      items: { za_tasse: cupBack, za_band: bandOnMijo },
    },
  ],
};

// ------------------------------------------------------------------------------------- chapter

export const zaesurChapter: ChapterDef = {
  id: 'zaesur',
  title: T.title,
  dateline: T.dateline,
  card: { image: 'intro_zaesur', lines: T.card },
  pc: { character: 'macleod', name: T.names.macleod, color: C.pc },
  start: { room: 'za_zimmer', entry: 'start' },
  next: 'romagna',
  journal: T.journal,
  items: [
    {
      id: 'za_band',
      name: T.items.band.name,
      icon: 'band',
      look: function* (c: ScriptCtx): Script {
        if (!c.is(f('pageRead'))) {
          yield* lines(PC, T.items.band.look);
          return;
        }
        yield* lines(PC, T.items.band.lookRead);
        yield say(PC, c.is(f('cover')) ? T.items.band.lookCover : T.items.band.coverHint);
      },
    },
    { id: 'za_tasse', name: T.items.tasse.name, icon: 'tasse', look: T.items.tasse.look },
  ],
  self: { name: T.names.macleod, verbs: ['look'], on: { look: T.zimmer.self.look } },
  actors: [
    {
      id: MIJO,
      name: T.names.mijo,
      character: 'mijo1996',
      color: C.mijo,
      start: { room: 'za_zimmer', x: 1084, y: 440, facing: 1 },
      verbs: ['look', 'talk'],
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('refilled')) ? T.zimmer.mijo.lookAfter : T.zimmer.mijo.look), talk: talkMijo },
      items: { za_tasse: refill, za_band: bandOnMijo },
    },
  ],
  dialogues: [],
  hint: (s) => {
    if (!fl(s, 'refilled')) return { id: 'za.tasse', steps: T.hints.tasse };
    if (!fl(s, 'pageRead')) return { id: 'za.seite', steps: T.hints.seite };
    return { id: 'za.frage', steps: T.hints.frage };
  },
  setup: (c: ScriptCtx) => {
    c.set(f('bandTable'));
  },
  intro: function* (c: ScriptCtx): Script {
    yield narrate(T.intro.n);
    yield say(PC, T.intro.a);
    yield say(PC, T.intro.b);
    c.journal('tasse');
  },
  rooms: [zimmer],
};
