// Kapitel 1 – Der Band. Sarajevo, Frühjahr 1996. MacLeod bei Mijo.
// Puzzle chain: Band on the table -> questions -> coffee errand (leaking džezva -> Halil rivets it ->
// Nedžad fills it) -> pour -> report what the city keeps silent (the red-filled shell crater, asked of Halil).
import type { ChapterDef, ScriptCtx } from '../../core/content';
import type { Script } from '../../core/cmd';
import { checkpoint, endChapter, face, pose, say, vignette, wait, walk } from '../../core/cmd';
import { T } from '../text/de/c01_sarajevo';
import { flags, PC, persp, R } from '../util';

const f = flags('sa');
const MIJO = 'mijo96';
const NED = 'nedzad';
const HAL = 'halil';
const C = { pc: '#a9cbe8', mijo: '#e8c38a', ned: '#e3b98d', hal: '#cfd6a2' };

function* lines(actor: string, l: string | readonly string[]): Script {
  for (const t of typeof l === 'string' ? [l] : l) yield say(actor, t);
}


// ------------------------------------------------------------------------------------------- rooms

const zimmer = {
  id: 'sa_zimmer',
  title: T.rooms.zimmer,
  bg: 'bg_prolog',
  width: 1280,
  perspective: persp(178, 350, 190),
  walk: [{ outer: [60, 462, 1240, 462, 1240, 436, 1095, 436, 1088, 429, 830, 429, 812, 370, 850, 360, 420, 360, 410, 410, 115, 412, 60, 440] }],
  entries: { door: { x: 785, y: 366, face: 1 as const } },
  layers: [
    { id: 'lampe', image: 'prop_lampe_aus', x: 0, y: 0, rect: [126, 249, 110, 76] as [number, number, number, number] },
    { id: 'notes', image: 'prop_notes', x: 0, y: 0, rect: [300, 309, 90, 22] as [number, number, number, number] },
    { id: 'lupe', image: 'prop_lupe', x: 0, y: 0, rect: [282, 318, 34, 9] as [number, number, number, number] },
    { id: 'band', image: 'prop_band', x: 0, y: 0, rect: [902, 336, 32, 26] as [number, number, number, number], visible: (s: { flags: Record<string, unknown> }) => !!s.flags[f('band')] },
    {
      id: 'dzezva',
      image: 'prop_dzezva',
      x: 0,
      y: 0,
      rect: [952, 318, 30, 34] as [number, number, number, number],
      visible: (s: { inventory: string[] }) => !s.inventory.includes('dzezva'),
    },
    { id: 'tasseMijo', image: (s: { flags: Record<string, unknown> }) => (s.flags[f('poured')] ? 'prop_tasse_voll' : 'prop_tasse_leer'), x: 0, y: 0, rect: [880, 349, 28, 14] as [number, number, number, number] },
    { id: 'tasseZwei', image: 'prop_tasse_voll', x: 0, y: 0, rect: [1004, 351, 28, 14] as [number, number, number, number] },
    {
      id: 'tasseMac',
      image: (s: { flags: Record<string, unknown> }) => (s.flags[f('poured')] ? 'prop_tasse_voll' : 'prop_tasse_leer'),
      x: 0,
      y: 0,
      rect: [1044, 354, 26, 13] as [number, number, number, number],
      visible: (s: { flags: Record<string, unknown> }) => !!s.flags[f('thirdCup')],
    },
  ],
  decor: [
    { id: 'steam1', character: 'steam', x: 894, y: 350, scale: 0.16, alpha: 0.45, depth: -40000, visible: (s: { flags: Record<string, unknown> }) => !!s.flags[f('poured')] },
    { id: 'steam2', character: 'steam', x: 1057, y: 355, scale: 0.15, alpha: 0.45, depth: -40000, phase: 0.6, visible: (s: { flags: Record<string, unknown> }) => !!s.flags[f('poured')] },
  ],
  hotspots: [
    { id: 'regal', name: T.zimmer.regal.name, shape: R(55, 70, 240, 245), walkTo: { x: 255, y: 424, face: -1 as const }, on: { look: T.zimmer.regal.look, take: T.zimmer.regal.take } },
    { id: 'pult', name: T.zimmer.pult.name, shape: R(120, 318, 285, 88), walkTo: { x: 300, y: 424, face: -1 as const }, on: { look: T.zimmer.pult.look, take: T.zimmer.pult.take } },
    { id: 'lampe', name: T.zimmer.lampe.name, shape: R(126, 249, 110, 76), walkTo: { x: 200, y: 428, face: -1 as const }, on: { look: T.zimmer.lampe.look, use: T.zimmer.lampe.use }, priority: 2 },
    { id: 'lupe', name: T.zimmer.lupe.name, shape: R(276, 312, 46, 16), walkTo: { x: 300, y: 424, face: -1 as const }, on: { look: T.zimmer.lupe.look, take: T.zimmer.lupe.take }, priority: 3 },
    { id: 'fensterL', name: T.zimmer.fensterL.name, shape: R(435, 110, 230, 165), walkTo: { x: 550, y: 366, face: 1 as const }, on: { look: T.zimmer.fensterL.look } },
    { id: 'heizung', name: T.zimmer.heizung.name, shape: R(460, 283, 170, 66), walkTo: { x: 545, y: 368, face: 1 as const }, on: { look: T.zimmer.heizung.look, use: T.zimmer.heizung.use } },
    {
      id: 'tuer',
      name: T.zimmer.tuer.name,
      shape: R(725, 130, 120, 220),
      walkTo: { x: 785, y: 364, face: 1 as const },
      exit: { room: 'sa_flur', entry: 'room' },
      exitBlocked: (s: { flags: Record<string, unknown> }) => (!s.flags[f('band')] ? T.generic.bandHere : !s.flags[f('task')] ? T.pour.noTask : null),
      on: { look: T.zimmer.tuer.look },
    },
    { id: 'bild', name: T.zimmer.bild.name, shape: R(880, 170, 65, 58), walkTo: { x: 905, y: 438, face: 1 as const }, on: { look: T.zimmer.bild.look } },
    { id: 'fensterR', name: T.zimmer.fensterR.name, shape: R(970, 110, 245, 165), walkTo: { x: 1080, y: 444, face: 1 as const }, on: { look: T.zimmer.fensterR.look } },
    { id: 'sofa', name: T.zimmer.sofa.name, shape: { poly: [940, 300, 1010, 278, 1280, 278, 1280, 400, 1090, 400, 1086, 380, 940, 375] }, walkTo: { x: 1180, y: 444, face: 1 as const }, on: { look: T.zimmer.sofa.look, use: T.zimmer.sofa.use } },
    {
      id: 'tasseMijo',
      name: T.zimmer.tasseMijo.name,
      shape: R(876, 343, 36, 22),
      walkTo: { x: 895, y: 440, face: 1 as const },
      priority: 4,
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('poured')) ? T.zimmer.tasseMijo.lookFull : T.zimmer.tasseMijo.look),
        take: T.zimmer.tasseMijo.take,
      },
      items: { dzezva: pourScript, band: placeBand },
    },
    {
      id: 'tasseZwei',
      name: T.zimmer.tasseZwei.name,
      shape: R(1000, 345, 36, 22),
      walkTo: { x: 1015, y: 440, face: 1 as const },
      priority: 4,
      on: {
        look: function* (c: ScriptCtx): Script {
          c.set(f('sawCups'));
          yield* lines(PC, T.zimmer.tasseZwei.look);
        },
        take: T.zimmer.tasseZwei.take,
      },
      items: {
        dzezva: (c: ScriptCtx) => (c.is(f('full')) ? lines(MIJO, T.zimmer.tasseZwei.pour) : lines(PC, T.generic.dzezvaWrong)),
        band: placeBand,
      },
    },
    {
      id: 'tasseMac',
      name: T.zimmer.tasseMac.name,
      shape: R(1040, 348, 32, 20),
      visible: (s: { flags: Record<string, unknown> }) => !!s.flags[f('thirdCup')],
      walkTo: { x: 1050, y: 440, face: 1 as const },
      priority: 4,
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('poured')) ? T.zimmer.tasseMac.lookFull : T.zimmer.tasseMac.look),
        take: T.zimmer.tasseMac.take,
      },
      items: { dzezva: pourScript },
    },
    {
      id: 'dzezva',
      name: T.zimmer.dzezva.name,
      shape: R(948, 314, 38, 42),
      visible: (s: { inventory: string[] }) => !s.inventory.includes('dzezva'),
      walkTo: { x: 960, y: 440, face: 1 as const },
      priority: 5,
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('poured')) ? T.items.dzezva.lookFixed : T.zimmer.dzezva.look),
        take: function* (c: ScriptCtx): Script {
          if (!c.is(f('task'))) {
            yield say(PC, T.zimmer.dzezva.takeEarly);
            return;
          }
          if (c.is(f('poured'))) {
            yield say(PC, T.items.dzezva.lookFixed[0]);
            return;
          }
          c.give('dzezva');
          c.journal('coffee');
          yield say(PC, T.items.dzezva.look[1]);
        },
      },
    },
    {
      id: 'couchtisch',
      name: T.zimmer.couchtisch.name,
      shape: { poly: [822, 352, 1085, 352, 1085, 428, 822, 428] },
      walkTo: { x: 940, y: 442, face: 1 as const },
      on: { look: (c: ScriptCtx) => lines(PC, c.is(f('band')) ? T.zimmer.couchtisch.lookAfter : T.zimmer.couchtisch.look) },
      items: { band: placeBand, dzezva: pourScript },
    },
  ],
  onEnter: function* (c: ScriptCtx): Script {
    // Coming back from the city with the task given: a third cup waits on the table.
    if (c.is(f('task')) && !c.is(f('thirdCup'))) c.set(f('thirdCup'));
    if (c.is(f('full')) && !c.is(f('poured')) && !c.seen('sa.thirdCupSeen')) {
      c.mark('sa.thirdCupSeen');
      yield say(PC, T.pour.a);
    }
  },
};

function* placeBand(c: ScriptCtx): Script {
  if (c.is(f('band'))) return;
  c.drop('band');
  c.set(f('band'));
  c.journal('band', 'done');
  yield face(MIJO, PC);
  yield say(MIJO, T.dlgMijo.open1);
  c.journal('ask');
  yield* c.dialogue('mijo');
}

function* pourScript(c: ScriptCtx): Script {
  if (!c.is(f('full'))) {
    yield say(PC, T.zimmer.dzezva.look[1]);
    return;
  }
  if (c.is(f('poured'))) return;
  yield walk(PC, 940, 442, { face: 1 });
  if (!c.is(f('thirdCup'))) c.set(f('thirdCup'));
  if (!c.seen('sa.thirdCupSeen')) {
    c.mark('sa.thirdCupSeen');
    yield say(PC, T.pour.a);
  }
  yield say(PC, T.pour.b);
  c.drop('dzezva');
  c.set(f('poured'));
  c.journal('coffee', 'done');
  yield say(PC, T.pour.b2);
  yield face(MIJO, PC);
  yield say(MIJO, T.pour.c);
  yield wait(0.4);
  c.journal('report');
  yield checkpoint();
  yield* reportScript(c);
}

function* reportScript(c: ScriptCtx): Script {
  yield face(MIJO, PC);
  yield say(MIJO, T.report.ask);
  const opts = [];
  if (c.is(f('halilRose'))) opts.push({ id: 'rose', text: T.report.rose });
  if (c.is(f('nedzadTwo'))) opts.push({ id: 'two', text: T.report.twoCups });
  if (c.is(f('repaired'))) opts.push({ id: 'dz', text: T.report.dzezva });
  if (c.is(f('sawSign'))) opts.push({ id: 'sign', text: T.report.sign });
  opts.push({ id: 'calm', text: T.report.calm });
  const pick: string = yield { k: 'choice', options: opts };
  const text = opts.find((o) => o.id === pick)!.text;
  yield say(PC, text);
  if (pick === 'rose') {
    yield say(MIJO, T.report.roseA);
    yield say(MIJO, T.report.roseB);
    yield say(MIJO, T.report.roseC);
    c.set(f('reported'));
    c.journal('report', 'done');
    c.journal('look', 'done');
    yield say(MIJO, T.report.sit);
    yield vignette('cine_prolog_b', { captions: [T.report.end1, T.report.end2], t: 11, fps: 4 });
    yield endChapter();
    return;
  }
  if (pick === 'two') yield say(MIJO, T.report.twoCupsA);
  else if (pick === 'dz') yield say(MIJO, T.report.dzezvaA);
  else if (pick === 'sign') yield say(MIJO, T.report.signA);
  else yield say(MIJO, T.report.calmA);
  c.set(f('reportTried'));
  yield say(MIJO, T.report.again);
}

const flur = {
  id: 'sa_flur',
  title: T.rooms.flur,
  bg: 'bg_landing',
  width: 1080,
  perspective: persp(186, 352, 188),
  walk: [{ outer: [60, 410, 1010, 410, 1010, 392, 905, 380, 905, 356, 60, 356] }],
  entries: { room: { x: 375, y: 364, face: 1 as const }, stairs: { x: 950, y: 396, face: -1 as const } },
  hotspots: [
    { id: 'tuer', name: T.flur.tuer.name, shape: R(300, 95, 150, 253), walkTo: { x: 375, y: 362, face: 1 as const }, exit: { room: 'sa_zimmer', entry: 'door' }, on: { look: T.flur.tuer.look } },
    { id: 'treppe', name: T.flur.treppe.name, shape: R(905, 205, 110, 185), walkTo: { x: 960, y: 396, face: 1 as const }, exit: { room: 'sa_gasse', entry: 'house' }, exitDir: 'down' as const, on: { look: T.flur.treppe.look } },
    { id: 'mantel', name: T.flur.mantel.name, shape: R(185, 155, 90, 140), walkTo: { x: 235, y: 366, face: -1 as const }, on: { look: T.flur.mantel.look, take: T.flur.mantel.take } },
    { id: 'fenster', name: T.flur.fenster.name, shape: R(683, 90, 152, 170), walkTo: { x: 760, y: 362, face: 1 as const }, on: { look: T.flur.fenster.look } },
    { id: 'narbe', name: T.flur.narbe.name, shape: R(555, 120, 85, 85), walkTo: { x: 600, y: 362, face: 1 as const }, on: { look: T.flur.narbe.look } },
    { id: 'lampe', name: T.flur.lampe.name, shape: R(470, 10, 72, 62), walkTo: { x: 505, y: 370 }, on: { look: T.flur.lampe.look } },
    { id: 'schalter', name: T.flur.schalter.name, shape: R(450, 183, 20, 22), walkTo: { x: 465, y: 362, face: 1 as const }, on: { look: T.flur.schalter.look, use: T.flur.schalter.use }, priority: 2 },
  ],
};

const gasse = {
  id: 'sa_gasse',
  title: T.rooms.gasse,
  bg: 'bg_gasse',
  width: 1400,
  perspective: persp(207, 380, 193),
  walk: [
    { outer: [40, 462, 1370, 462, 1370, 380, 1000, 376, 985, 352, 960, 336, 912, 336, 890, 352, 870, 376, 330, 376, 300, 372, 150, 372, 40, 380] },
  ],
  entries: { house: { x: 240, y: 388, face: 1 as const }, kafana: { x: 1252, y: 392, face: -1 as const }, alley: { x: 935, y: 352, face: -1 as const } },
  layers: [
    { id: 'nummer', image: 'prop_hausnummer3', x: 0, y: 0, rect: [201, 68, 26, 19] as [number, number, number, number] },
    { id: 'schild', image: 'prop_strassenschild', x: 0, y: 0, rect: [424, 190, 64, 30] as [number, number, number, number] },
    { id: 'plane', image: 'prop_fensterplane', x: 0, y: 0, rect: [349, 150, 54, 78] as [number, number, number, number] },
    { id: 'rose', image: 'prop_rose', x: 0, y: 0, rect: [640, 418, 86, 34] as [number, number, number, number] },
    { id: 'tonne', image: 'prop_muelltonne', x: 0, y: 0, rect: [1312, 344, 66, 86] as [number, number, number, number], depth: 428 },
    { id: 'kafanaSchild', image: 'prop_kafana_schild', x: 0, y: 0, rect: [1196, 128, 118, 26] as [number, number, number, number] },
  ],
  hotspots: [
    { id: 'haustuer', name: T.gasse.haustuer.name, shape: R(160, 85, 105, 215), walkTo: { x: 240, y: 384, face: -1 as const }, exit: { room: 'sa_flur', entry: 'stairs' }, on: { look: T.gasse.haustuer.look } },
    { id: 'nummer', name: T.gasse.nummer.name, shape: R(198, 64, 32, 26), walkTo: { x: 240, y: 384, face: -1 as const }, on: { look: T.gasse.nummer.look }, priority: 2 },
    {
      id: 'schild',
      name: T.gasse.schild.name,
      shape: R(420, 186, 72, 38),
      walkTo: { x: 455, y: 386, face: 1 as const },
      on: {
        look: function* (c: ScriptCtx): Script {
          c.set(f('sawSign'));
          yield* lines(PC, T.gasse.schild.look);
        },
      },
      items: {
        zettel: function* (c: ScriptCtx): Script {
          c.set(f('sawSign'));
          yield* lines(PC, T.gasse.schild.zettel);
        },
      },
      priority: 2,
    },
    { id: 'plane', name: T.gasse.plane.name, shape: R(340, 145, 75, 110), walkTo: { x: 380, y: 384, face: 1 as const }, on: { look: T.gasse.plane.look } },
    {
      id: 'rose',
      name: T.gasse.rose.name,
      shape: R(636, 412, 94, 44),
      walkTo: { x: 610, y: 446, face: 1 as const },
      priority: 3,
      on: {
        look: function* (c: ScriptCtx): Script {
          c.set(f('sawRose'));
          c.journal('look');
          yield* lines(PC, T.gasse.rose.look);
        },
        take: T.gasse.rose.take,
        use: T.gasse.rose.use,
      },
    },
    { id: 'putz', name: T.gasse.putz.name, shape: R(420, 30, 95, 140), walkTo: { x: 470, y: 384, face: 1 as const }, on: { look: T.gasse.putz.look } },
    { id: 'waesche', name: T.gasse.waesche.name, shape: R(550, 160, 165, 78), walkTo: { x: 630, y: 384, face: 1 as const }, on: { look: T.gasse.waesche.look } },
    { id: 'laterne', name: T.gasse.laterne.name, shape: R(1150, 88, 42, 62), walkTo: { x: 1160, y: 386, face: 1 as const }, on: { look: T.gasse.laterne.look } },
    { id: 'tonne', name: T.gasse.tonne.name, shape: R(1310, 340, 70, 92), walkTo: { x: 1300, y: 446, face: 1 as const }, on: { look: T.gasse.tonne.look, take: T.gasse.tonne.take } },
    { id: 'kafanaTuer', name: T.gasse.kafanaTuer.name, shape: R(1208, 150, 94, 192), walkTo: { x: 1255, y: 386, face: 1 as const }, exit: { room: 'sa_kafana', entry: 'door' }, on: { look: T.gasse.kafanaTuer.look } },
    { id: 'ende', name: T.gasse.ende.name, shape: R(872, 250, 130, 96), walkTo: { x: 936, y: 340, face: 1 as const }, exit: { room: 'sa_sebilj', entry: 'alley' }, exitDir: 'up' as const, on: { look: T.gasse.ende.look } },
    { id: 'fenster', name: T.gasse.fenster.name, shape: R(1050, 190, 50, 80), walkTo: { x: 1060, y: 388, face: 1 as const }, on: { look: T.gasse.fenster.look } },
  ],
};

const kafana = {
  id: 'sa_kafana',
  title: T.rooms.kafana,
  bg: 'bg_kafana',
  width: 1160,
  perspective: persp(222, 405, 203),
  walk: [{ outer: [40, 466, 676, 466, 676, 424, 40, 424] }],
  entries: { door: { x: 112, y: 436, face: 1 as const } },
  layers: [
    { id: 'zeitung', image: 'prop_zeitung', x: 0, y: 0, rect: [512, 333, 66, 14] as [number, number, number, number] },
    { id: 'tasse', image: 'prop_tasse_kafana', x: 0, y: 0, rect: [356, 334, 28, 16] as [number, number, number, number] },
    { id: 'counter', image: 'prop_kafana_counter', x: 0, y: 0, rect: [690, 261, 510, 179] as [number, number, number, number], depth: 440 },
    { id: 'radio', image: (s: { flags: Record<string, unknown> }) => (s.flags[f('radio')] ? 'prop_radio_an' : 'prop_radio_aus'), x: 0, y: 0, rect: [1046, 266, 60, 32] as [number, number, number, number], depth: 441 },
  ],
  decor: [
    { id: 'man', character: 'kafana_man', x: 300, y: 418, facing: 1 as const },
    { id: 'woman', character: 'kafana_woman', x: 470, y: 418, facing: 1 as const, phase: 3.2 },
    { id: 'rakija', character: 'kafana_rakija', x: 664, y: 420, facing: -1 as const, phase: 6.4 },
    { id: 'flame', character: 'flame', x: 668, y: 372, scale: 0.36, depth: -40000, alpha: 0.9 },
    { id: 'steam', character: 'steam', x: 370, y: 334, scale: 0.13, alpha: 0.4, depth: -40000 },
  ],
  hotspots: [
    { id: 'ausgang', name: T.kafana.ausgang.name, shape: R(45, 165, 145, 240), walkTo: { x: 110, y: 432, face: -1 as const }, exit: { room: 'sa_gasse', entry: 'kafana' }, exitDir: 'left' as const, on: { look: T.kafana.ausgang.look } },
    { id: 'ofen', name: T.kafana.ofen.name, shape: R(628, 40, 104, 360), walkTo: { x: 650, y: 444, face: 1 as const }, on: { look: T.kafana.ofen.look, use: T.kafana.ofen.use } },
    { id: 'maentel', name: T.kafana.maentel.name, shape: R(222, 178, 72, 112), walkTo: { x: 260, y: 440, face: -1 as const }, on: { look: T.kafana.maentel.look } },
    { id: 'regal', name: T.kafana.regal.name, shape: R(808, 108, 140, 162), walkTo: { x: 668, y: 446, face: 1 as const }, on: { look: T.kafana.regal.look } },
    { id: 'fenster', name: T.kafana.fenster.name, shape: R(950, 95, 182, 160), walkTo: { x: 668, y: 446, face: 1 as const }, on: { look: T.kafana.fenster.look } },
    { id: 'tische', name: T.kafana.tische.name, shape: R(240, 340, 375, 70), walkTo: { x: 430, y: 440, face: 1 as const }, on: { look: T.kafana.tische.look } },
    {
      id: 'zeitung',
      name: T.kafana.zeitung.name,
      shape: R(506, 326, 78, 24),
      walkTo: { x: 545, y: 440, face: 1 as const },
      priority: 3,
      on: {
        look: function* (c: ScriptCtx): Script {
          c.set(f('sawNewspaper'));
          yield* lines(PC, T.kafana.zeitung.look);
        },
        take: T.kafana.zeitung.take,
      },
    },
    { id: 'tasse', name: T.kafana.tasse.name, shape: R(350, 328, 40, 22), walkTo: { x: 380, y: 440, face: 1 as const }, priority: 3, on: { look: T.kafana.tasse.look } },
    {
      id: 'radio',
      name: T.kafana.radio.name,
      shape: R(1042, 262, 68, 38),
      walkTo: { x: 668, y: 446, face: 1 as const },
      priority: 3,
      on: {
        look: (c: ScriptCtx) => lines(PC, c.is(f('radio')) ? T.kafana.radio.lookOn : T.kafana.radio.look),
        use: function* (c: ScriptCtx): Script {
          if (c.is(f('radio'))) {
            c.unset(f('radio'));
            yield say(PC, T.kafana.radio.useOff);
          } else {
            c.set(f('radio'));
            yield say(PC, T.kafana.radio.use);
          }
        },
      },
    },
    { id: 'gast', name: T.kafana.gast.name, shape: R(250, 330, 105, 95), walkTo: { x: 330, y: 440, face: 1 as const }, on: { look: T.kafana.gast.look } },
    { id: 'gaestin', name: T.kafana.gaestin.name, shape: R(410, 330, 100, 95), walkTo: { x: 470, y: 440, face: 1 as const }, on: { look: T.kafana.gaestin.look } },
    { id: 'stehend', name: T.kafana.stehend.name, shape: R(630, 300, 70, 125), walkTo: { x: 600, y: 444, face: 1 as const }, on: { look: T.kafana.stehend.look } },
  ],
};

const sebilj = {
  id: 'sa_sebilj',
  title: T.rooms.sebilj,
  bg: 'bg_sebilj',
  width: 1180,
  perspective: persp(270, 345, 84),
  walk: [{ outer: [30, 466, 1150, 466, 1150, 380, 760, 374, 700, 372, 300, 372, 30, 384] }],
  entries: { alley: { x: 60, y: 428, face: 1 as const } },
  layers: [{ id: 'stand', image: 'prop_kaffeestand', x: 0, y: 0, rect: [104, 300, 160, 142] as [number, number, number, number], depth: 440 }],
  decor: [
    { id: 'water', character: 'sebilj_water', x: 488, y: 322, scale: 0.42, alpha: 0.85, depth: -40000 },
    { id: 'p1', character: 'pigeon', x: 560, y: 392, scale: 0.34, facing: 1 as const },
    { id: 'p2', character: 'pigeon', x: 602, y: 386, scale: 0.32, facing: -1 as const, phase: 2.1 },
    { id: 'p3', character: 'pigeon', x: 641, y: 394, scale: 0.34, facing: 1 as const, phase: 4.3 },
    { id: 'p4', character: 'pigeon', x: 690, y: 388, scale: 0.33, facing: -1 as const, phase: 6.2 },
    { id: 'p5', character: 'pigeon', x: 735, y: 396, scale: 0.35, facing: 1 as const, phase: 1.3 },
    { id: 'steam', character: 'steam', x: 188, y: 330, scale: 0.2, alpha: 0.35, depth: 441 },
    { id: 'glow', character: 'flame', x: 190, y: 372, scale: 0.18, alpha: 0.8, depth: 441 },
  ],
  hotspots: [
    { id: 'ausgang', name: T.sebilj.ausgang.name, shape: R(0, 330, 60, 140), walkTo: { x: 40, y: 430, face: -1 as const }, exit: { room: 'sa_gasse', entry: 'alley' }, exitDir: 'left' as const, on: { look: T.sebilj.ausgang.look } },
    { id: 'brunnen', name: T.sebilj.brunnen.name, shape: R(305, 0, 360, 340), walkTo: { x: 488, y: 384, face: 1 as const }, on: { look: T.sebilj.brunnen.look, use: T.sebilj.brunnen.use } },
    { id: 'staendeL', name: T.sebilj.staende.name, shape: R(0, 190, 300, 108), walkTo: { x: 200, y: 400, face: -1 as const }, on: { look: T.sebilj.staende.look } },
    { id: 'staendeR', name: T.sebilj.staende.name, shape: R(800, 200, 380, 150), walkTo: { x: 860, y: 400, face: 1 as const }, on: { look: T.sebilj.staende.look } },
    { id: 'kaffeestand', name: T.sebilj.kaffeestand.name, shape: R(104, 300, 160, 142), walkTo: { x: 290, y: 440, face: -1 as const }, priority: 2, on: { look: T.sebilj.kaffeestand.look } },
    { id: 'tauben', name: T.sebilj.tauben.name, shape: R(540, 368, 220, 36), walkTo: { x: 640, y: 430, face: 1 as const }, priority: 2, on: { look: T.sebilj.tauben.look } },
  ],
};

// ------------------------------------------------------------------------------------------- chapter

export const sarajevo: ChapterDef = {
  id: 'sarajevo',
  title: T.title,
  dateline: T.dateline,
  card: { image: 'intro_prolog', cine: 'cine_prolog_a', lines: T.card },
  pc: { character: 'macleod', name: T.names.macleod, color: C.pc },
  start: { room: 'sa_zimmer', entry: 'door' },
  next: 'weide',
  journal: T.journal,
  items: [
    { id: 'band', name: T.items.band.name, icon: 'band', look: T.items.band.look },
    { id: 'zettel', name: T.items.zettel.name, icon: 'zettel', look: T.items.zettel.look },
    {
      id: 'dzezva',
      name: (s) => (s.flags[f('full')] ? T.items.dzezva.nameFull : T.items.dzezva.name),
      icon: 'dzezva',
      look: (c: ScriptCtx) => lines(PC, c.is(f('full')) ? T.items.dzezva.lookFull : c.is(f('repaired')) ? T.items.dzezva.lookFixed : T.items.dzezva.look),
    },
  ],
  actors: [
    {
      id: MIJO,
      name: T.names.mijo,
      character: 'mijo1996',
      color: C.mijo,
      start: { room: 'sa_zimmer', x: 1150, y: 440, facing: 1 },
      on: {
        look: T.zimmer.mijo.look,
        talk: function* (c: ScriptCtx): Script {
          if (!c.is(f('band'))) {
            yield say(PC, T.zimmer.mijo.bandNotYet);
            return;
          }
          if (c.is(f('poured')) && !c.is(f('reported'))) {
            yield* reportScript(c);
            return;
          }
          yield* c.dialogue('mijo');
        },
      },
      items: {
        band: T.zimmer.mijo.bandOnHim,
        dzezva: pourScript,
      },
    },
    {
      id: NED,
      name: T.names.nedzad,
      character: 'nedzad_bar',
      color: C.ned,
      start: { room: 'sa_kafana', x: 985, y: 404, facing: -1, pose: 'polish' },
      talkSpot: { x: 668, y: 448, face: 1 },
      on: { look: T.nedzad.look, talk: (c: ScriptCtx) => c.dialogue('nedzad') },
      items: {
        dzezva: function* (c: ScriptCtx): Script {
          yield pose(NED, 'gesture');
          if (c.is(f('full'))) {
            yield say(NED, T.nedzad.fillDone);
          } else if (!c.is(f('repaired'))) {
            yield say(NED, T.nedzad.leak);
            yield say(NED, T.nedzad.leakA);
            yield say(NED, T.nedzad.leakB);
            c.set(f('leakShown'));
            c.journal('repair');
          } else {
            yield say(NED, T.nedzad.fill);
            yield say(PC, T.nedzad.fillA);
            yield pose(NED, 'wipe', { times: 1 });
            c.set(f('full'));
            yield say(NED, T.nedzad.fillB);
          }
          yield pose(NED, 'polish', { loop: true });
        },
        band: T.nedzad.band,
      },
    },
    {
      id: HAL,
      name: T.names.halil,
      character: 'halil_anvil',
      color: C.hal,
      start: { room: 'sa_sebilj', x: 978, y: 452, facing: -1, pose: 'hammer' },
      talkSpot: { x: 880, y: 450, face: 1 },
      on: { look: T.halil.look, talk: (c: ScriptCtx) => c.dialogue('halil') },
      items: {
        dzezva: function* (c: ScriptCtx): Script {
          if (c.is(f('full'))) {
            yield say(HAL, T.halil.full);
            return;
          }
          if (c.is(f('repaired'))) {
            yield say(PC, T.halil.repairDone);
            return;
          }
          yield pose(HAL, 'rest', { loop: true });
          yield say(PC, T.halil.repairA);
          yield say(HAL, T.halil.repairB);
          yield say(PC, T.halil.repairQ);
          yield say(HAL, T.halil.repairC);
          yield say(HAL, T.halil.repairD);
          yield pose(HAL, 'hammer', { loop: true });
          yield wait(2.2);
          yield say(PC, T.halil.repairE);
          yield pose(HAL, 'rest', { loop: true });
          c.set(f('repaired'));
          c.journal('repair', 'done');
          yield say(HAL, T.halil.repairF);
          yield say(HAL, T.halil.repairG);
          yield pose(HAL, 'hammer', { loop: true });
        },
        band: T.halil.band,
      },
    },
  ],
  dialogues: [
    {
      id: 'mijo',
      actor: MIJO,
      open: function* (c: ScriptCtx): Script {
        if (c.seen('sa.mijoTalked')) yield say(MIJO, c.is(f('task')) ? T.dlgMijo.tellAgain : T.dlgMijo.openLater);
        c.mark('sa.mijoTalked');
      },
      bye: T.dlgMijo.bye,
      options: [
        {
          id: 'expected',
          text: T.dlgMijo.expected,
          run: (c) => lines(MIJO, [T.dlgMijo.expectedA, T.dlgMijo.expectedB]),
        },
        {
          id: 'who',
          text: T.dlgMijo.who,
          run: function* (): Script {
            yield say(MIJO, T.dlgMijo.whoA);
            yield say(PC, T.dlgMijo.whoQ);
            yield say(MIJO, T.dlgMijo.whoB);
          },
        },
        { id: 'why', text: T.dlgMijo.why, run: () => lines(MIJO, [T.dlgMijo.whyA, T.dlgMijo.whyB]) },
        { id: 'killed', text: T.dlgMijo.killed, when: (s) => !!s.seen['dlg:mijo.who'], run: () => lines(MIJO, [T.dlgMijo.killedA, T.dlgMijo.killedB]) },
        {
          id: 'cups',
          text: T.dlgMijo.cups,
          when: (s) => !!s.flags[f('sawCups')],
          run: function* (): Script {
            yield say(MIJO, T.dlgMijo.cupsA);
            yield say(PC, T.dlgMijo.cupsQ);
            yield say(MIJO, T.dlgMijo.cupsB);
            yield wait(0.6);
            yield say(MIJO, T.dlgMijo.cupsC);
          },
        },
        {
          id: 'halil',
          text: T.dlgMijo.halilDz,
          when: (s) => !!s.flags[f('repaired')] && !s.flags[f('poured')],
          run: () => lines(MIJO, [T.dlgMijo.halilDzA, T.dlgMijo.halilDzB]),
        },
        {
          id: 'tell',
          text: T.dlgMijo.tell,
          when: (s) => !s.flags[f('task')],
          exit: true,
          run: function* (c: ScriptCtx): Script {
            yield say(MIJO, T.dlgMijo.tellA);
            yield say(MIJO, T.dlgMijo.tellB);
            yield say(MIJO, T.dlgMijo.tellC);
            yield say(MIJO, T.dlgMijo.tellD);
            c.set(f('task'));
            c.journal('ask', 'done');
            c.journal('coffee');
            c.journal('look');
          },
        },
      ],
    },
    {
      id: 'nedzad',
      actor: NED,
      open: function* (c: ScriptCtx): Script {
        yield pose(NED, 'rest', { loop: true });
        yield say(NED, c.seen('sa.nedzadMet') ? T.nedzad.openAgain : T.nedzad.open);
        c.mark('sa.nedzadMet');
      },
      close: function* (): Script {
        yield pose(NED, 'polish', { loop: true });
      },
      bye: T.nedzad.bye,
      options: [
        {
          id: 'coffee',
          text: T.nedzad.coffee,
          repeat: true,
          run: function* (c: ScriptCtx): Script {
            if (c.seen('sa.coffeeJoke')) {
              yield say(PC, T.nedzad.coffeeC);
              return;
            }
            c.mark('sa.coffeeJoke');
            yield say(NED, T.nedzad.coffeeA);
            yield say(PC, T.nedzad.coffeeQ);
            yield say(NED, T.nedzad.coffeeB);
            yield say(PC, T.nedzad.coffeeC);
          },
        },
        {
          id: 'mijo',
          text: T.nedzad.mijo,
          run: function* (): Script {
            yield say(NED, T.nedzad.mijoA);
            yield say(PC, T.nedzad.mijoQ);
            yield say(NED, T.nedzad.mijoB);
          },
        },
        {
          id: 'two',
          text: T.nedzad.two,
          when: (s) => !!s.flags[f('sawCups')],
          run: function* (c: ScriptCtx): Script {
            yield say(NED, T.nedzad.twoA);
            yield wait(0.5);
            yield say(NED, T.nedzad.twoB);
            yield say(PC, T.nedzad.twoQ);
            yield say(NED, T.nedzad.twoC);
            c.set(f('nedzadTwo'));
          },
        },
        {
          id: 'rose',
          text: T.nedzad.rose,
          when: (s) => !!s.flags[f('sawRose')],
          run: function* (): Script {
            yield say(NED, T.nedzad.roseA);
            yield say(NED, T.nedzad.roseB);
            yield say(NED, T.nedzad.roseC);
          },
        },
        { id: 'quiet', text: T.nedzad.quiet, run: () => lines(NED, T.nedzad.quietA) },
      ],
    },
    {
      id: 'halil',
      actor: HAL,
      open: function* (c: ScriptCtx): Script {
        if (!c.seen('sa.halilMet')) {
          c.mark('sa.halilMet');
          yield say(PC, T.halil.open);
        }
      },
      bye: T.halil.bye,
      options: [
        { id: 'what', text: T.halil.what, run: () => lines(HAL, [T.halil.whatA, T.halil.whatB]) },
        {
          id: 'rose',
          text: T.halil.rose,
          when: (s) => !!s.flags[f('sawRose')],
          run: function* (c: ScriptCtx): Script {
            yield pose(HAL, 'rest', { loop: true });
            yield say(PC, T.halil.roseA);
            yield say(HAL, T.halil.roseB);
            yield say(HAL, T.halil.roseC);
            yield say(PC, T.halil.roseQ);
            yield wait(0.8);
            yield say(HAL, T.halil.roseD);
            yield say(HAL, T.halil.roseE);
            c.set(f('halilRose'));
            yield pose(HAL, 'hammer', { loop: true });
          },
        },
        { id: 'war', text: T.halil.war, run: () => lines(HAL, T.halil.warA) },
        { id: 'news', text: T.halil.newspaper, when: (s) => !!s.flags[f('sawNewspaper')], run: () => lines(HAL, T.halil.newspaperA) },
      ],
    },
  ],
  hint: (s) => {
    const fl = s.flags;
    if (!fl[f('band')]) return { id: 'sa.band', steps: T.hints.band };
    if (!fl[f('task')]) return { id: 'sa.ask', steps: T.hints.ask };
    if (!s.inventory.includes('dzezva') && !fl[f('poured')]) return { id: 'sa.take', steps: T.hints.take };
    if (!fl[f('repaired')]) return { id: 'sa.repair', steps: T.hints.repair };
    if (!fl[f('full')]) return { id: 'sa.fill', steps: T.hints.fill };
    if (!fl[f('poured')]) return { id: 'sa.pour', steps: T.hints.pour };
    if (!fl[f('reported')]) return { id: 'sa.report', steps: T.hints.report };
    return null;
  },
  setup: (c) => {
    c.give('band');
    c.give('zettel');
  },
  intro: function* (c: ScriptCtx): Script {
    yield face(MIJO, 1);
    yield say(PC, T.intro.a);
    yield say(MIJO, T.intro.b);
    yield say(PC, T.intro.c);
    yield face(MIJO, -1);
    yield wait(0.4);
    yield say(MIJO, T.intro.d);
    c.journal('band');
  },
  rooms: [zimmer, flur, gasse, kafana, sebilj] as ChapterDef['rooms'],
};
