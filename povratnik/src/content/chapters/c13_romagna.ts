// Kapitel 13 – Der zweite Tote. Romagna, Juli 1505. Mijo keeps the company's books. Gattamelata, a second
// immortal who joined the company a month ago, has been asking where Mijo sleeps. Alessandro warns him.
// The player works out the danger from the water book (tent 9 takes fourteen jugs for nobody) and from
// the boy who carries the water to the riverbed at night. At the riverbed the ground tells where the
// man waits (his footprints end at the willow). The fight is a duel; the decisive move is the disarm, a
// grip on the wrist that Mijo knows from the pasture. What happens to Gattamelata afterwards is left open:
// let him go, make him name the man who pays, or finish it.
import type { ChapterDef, RoomDef, ScriptCtx } from '../../core/content';
import type { CombatDef } from '../../core/combat';
import type { Script } from '../../core/cmd';
import { checkpoint, choice, combat, endChapter, fade, narrate, pose, room, say, walk } from '../../core/cmd';
import type { GameState } from '../../core/state';
import { T } from '../text/de/c13_romagna';
import { flags, PC, persp2, R } from '../util';

const f = flags('rm');
const ALE = 'rm_alessandro';
const FERR = 'rm_ferrante';
const TOM = 'rm_tomasino';
const POST = 'rm_posten';
const GAT = 'rm_gattamelata';
const C = { pc: '#d9cdb4', ale: '#e2b778', ferr: '#d8c49a', tom: '#c9b98a', post: '#b8c2d0', gat: '#c9a88a' };
const fl = (s: GameState, n: string) => !!s.flags[f(n)];

function* lines(actor: string, l: string | readonly string[]): Script {
  for (const t of typeof l === 'string' ? [l] : l) yield say(actor, t);
}

function* rows(rowsIn: readonly (readonly [string, string])[]): Script {
  for (const [who, t] of rowsIn) {
    if (who === 'n') yield narrate(t);
    else yield say(who === 'm' ? PC : who === 'a' ? ALE : who === 'g' ? GAT : who === 'f' ? FERR : who === 't' ? TOM : POST, t);
  }
}

// ============================================================================================= Lager

function* warnen(c: ScriptCtx): Script {
  if (c.is(f('warnung'))) {
    yield say(ALE, T.alessandro.look);
    return;
  }
  c.set(f('warnung'));
  yield* rows(T.alessandro.warnung);
  const pick: string = yield choice([
    { id: 'frage', text: T.alessandro.frage },
    { id: 'nein', text: T.alessandro.nein },
  ]);
  if (pick === 'frage') {
    yield say(PC, T.alessandro.frage);
    yield say(ALE, T.alessandro.frageA);
  } else {
    yield say(PC, T.alessandro.nein);
    yield say(ALE, T.alessandro.neinA);
  }
  c.journal('warnung', 'done');
  c.journal('wasser');
  yield checkpoint();
}

function* tomasinoFragen(c: ScriptCtx): Script {
  if (!c.is(f('tomFirst'))) {
    c.set(f('tomFirst'));
    yield say(TOM, T.tomasino.first);
  }
  const pick: string = yield choice([
    { id: 'wohin', text: T.tomasino.wohin },
    { id: 'bye', text: T.tomasino.bye },
  ]);
  if (pick !== 'wohin') {
    yield say(PC, T.tomasino.bye);
    return;
  }
  yield say(PC, T.tomasino.wohin);
  yield say(TOM, T.tomasino.wohinA);
  c.set(f('tomRoute'));
  yield say(PC, T.tomasino.zelt);
  yield say(TOM, T.tomasino.zeltA);
  yield say(PC, T.tomasino.zeltWeiter);
  yield say(TOM, T.tomasino.zeltWeiterA);
  c.journal('tomasino', 'done');
  c.journal('spuren');
  yield checkpoint();
}

const lager: RoomDef = {
  id: 'rm_lager',
  title: T.rooms.lager,
  bg: 'bg_romagna_lager',
  width: 1300,
  perspective: persp2(300, 140, 462, 220),
  walk: [{ outer: [40, 470, 1260, 470, 1260, 384, 40, 384] }],
  entries: { start: { x: 160, y: 440, face: 1 }, schreib: { x: 200, y: 440, face: 1 }, vorwerk: { x: 1200, y: 440, face: -1 } },
  assets: ['bg_romagna_lager', 'chars/alessandro', 'atlas/tomasino'],
  hotspots: [
    {
      id: 'schreib',
      name: T.rooms.schreib,
      shape: R(0, 110, 230, 290),
      walkTo: { x: 210, y: 440, face: 1 },
      priority: 1,
      exit: { room: 'rm_schreib', entry: 'lager' },
      exitDir: 'left',
      verbs: ['look', 'go'],
      on: { look: T.schreib.ausgang.look },
    },
    {
      id: 'vorwerk',
      name: T.rooms.vorwerk,
      shape: R(1080, 150, 220, 300),
      walkTo: { x: 1190, y: 440, face: -1 },
      priority: 1,
      exit: { room: 'rm_vorwerk', entry: 'lager' },
      exitDir: 'right',
      verbs: ['look', 'go'],
      on: { look: T.vorwerk.palisade.look },
    },
  ],
  onEnter: function* (c: ScriptCtx): Script {
    c.journal('warnung');
  },
};

// ========================================================================================== Schreibstube

function* lookLedger(c: ScriptCtx): Script {
  if (c.is(f('wasser'))) {
    yield say(PC, T.schreib.table.again);
    return;
  }
  c.set(f('wasser'));
  yield* lines(PC, T.schreib.table.look);
  c.journal('wasser', 'done');
  yield checkpoint();
}

function* ferrante(c: ScriptCtx): Script {
  if (!c.is(f('ferrMet'))) {
    c.set(f('ferrMet'));
    yield say(FERR, T.ferrante.first);
  }
  const pick: string = yield choice([
    { id: 'wasser', text: T.ferrante.frage },
    { id: 'bye', text: T.ferrante.bye },
  ]);
  if (pick === 'bye') {
    yield say(PC, T.ferrante.bye);
    return;
  }
  yield say(PC, T.ferrante.frage);
  yield say(FERR, T.ferrante.wasser);
  yield narrate(T.ferrante.frageN);
  c.journal('wasser', 'done');
}

const schreib: RoomDef = {
  id: 'rm_schreib',
  title: T.rooms.schreib,
  bg: 'bg_romagna_schreibstube',
  width: 1300,
  perspective: persp2(300, 140, 462, 220),
  walk: [{ outer: [60, 470, 1240, 470, 1240, 390, 60, 390] }],
  entries: { lager: { x: 160, y: 440, face: 1 } },
  assets: ['bg_romagna_schreibstube', 'atlas/ferrante'],
  hotspots: [
    {
      id: 'buch',
      name: T.schreib.table.name,
      shape: R(470, 300, 260, 120),
      walkTo: { x: 600, y: 440, face: 1 },
      priority: 3,
      verbs: ['look', 'use'],
      on: { look: lookLedger, use: lookLedger },
    },
    { id: 'kassette', name: T.schreib.kassette.name, shape: R(200, 320, 130, 90), walkTo: null, priority: 1, on: { look: T.schreib.kassette.look } },
    { id: 'lampe', name: T.schreib.lampe.name, shape: R(600, 240, 50, 70), walkTo: null, priority: 1, on: { look: T.schreib.lampe.look } },
    { id: 'kruege', name: T.schreib.krüge.name, shape: R(980, 320, 180, 120), walkTo: null, priority: 1, on: { look: T.schreib.krüge.look } },
    {
      id: 'ausgang',
      name: T.schreib.ausgang.name,
      shape: R(0, 150, 120, 300),
      walkTo: { x: 120, y: 440, face: -1 },
      priority: 1,
      exit: { room: 'rm_lager', entry: 'schreib' },
      exitDir: 'left',
      verbs: ['look', 'go'],
      on: { look: T.schreib.ausgang.look },
    },
  ],
};

// ============================================================================================ Vorwerk

function* posten(c: ScriptCtx): Script {
  if (!c.is(f('postMet'))) {
    c.set(f('postMet'));
    yield say(POST, T.vorwerk.posten.first);
  }
  const pick: string = yield choice([
    { id: 'wer', text: T.vorwerk.posten.wer },
    { id: 'tauschen', text: T.vorwerk.posten.tauschen },
    { id: 'bye', text: T.vorwerk.posten.bye },
  ]);
  if (pick === 'bye') {
    yield say(PC, T.vorwerk.posten.bye);
    return;
  }
  if (pick === 'wer') {
    yield say(PC, T.vorwerk.posten.wer);
    yield say(POST, T.vorwerk.posten.werA);
    c.set(f('postWer'));
  } else {
    yield say(PC, T.vorwerk.posten.tauschen);
    yield say(POST, T.vorwerk.posten.tauschenA);
    c.set(f('postTausch'));
  }
  c.journal('vorwerk', 'done');
  c.journal('spuren');
  yield checkpoint();
}

const vorwerk: RoomDef = {
  id: 'rm_vorwerk',
  title: T.rooms.vorwerk,
  bg: 'bg_romagna_vorwerk',
  width: 1300,
  perspective: persp2(300, 150, 462, 220),
  walk: [{ outer: [60, 470, 1240, 470, 1240, 390, 60, 390] }],
  entries: { lager: { x: 1160, y: 440, face: -1 }, tor: { x: 1040, y: 440, face: -1 } },
  assets: ['bg_romagna_vorwerk', 'atlas/posten_romagna'],
  hotspots: [
    { id: 'palisade', name: T.vorwerk.palisade.name, shape: R(0, 80, 1300, 260), walkTo: null, priority: 0, on: { look: T.vorwerk.palisade.look } },
    { id: 'feuer', name: T.vorwerk.feuer.name, shape: R(610, 200, 90, 110), walkTo: null, priority: 1, on: { look: T.vorwerk.feuer.look } },
    {
      id: 'tor',
      name: T.vorwerk.tor.name,
      shape: R(980, 260, 180, 160),
      walkTo: { x: 1040, y: 440, face: -1 },
      priority: 2,
      exit: { room: 'rm_fluss', entry: 'tor' },
      exitDir: 'down',
      verbs: ['look', 'go'],
      on: {
        look: T.vorwerk.tor.look,
        go: function* (c: ScriptCtx): Script {
          if (!c.is(f('postWer')) && !c.is(f('postTausch'))) {
            yield say(PC, T.vorwerk.tor.notYet);
            return;
          }
          yield say(PC, T.vorwerk.tor.go);
          yield fade(1, 0.6);
          yield room('rm_fluss', 'tor');
        },
      },
    },
    {
      id: 'lager',
      name: T.rooms.lager,
      shape: R(0, 380, 120, 80),
      walkTo: { x: 60, y: 440, face: 1 },
      priority: 1,
      exit: { room: 'rm_lager', entry: 'vorwerk' },
      exitDir: 'left',
      verbs: ['look', 'go'],
      on: { look: T.vorwerk.palisade.look },
    },
  ],
};

// ============================================================================================ Flussbett

function* readTracks(c: ScriptCtx): Script {
  c.set(f('spuren'));
  yield* lines(PC, T.fluss.spuren.look);
  c.journal('spuren', 'done');
  c.journal('ende');
  yield checkpoint();
}

function* approachWillow(c: ScriptCtx): Script {
  if (!c.is(f('spuren'))) {
    yield say(PC, T.fluss.weide.early);
    return;
  }
  yield walk(PC, 880, 440, { face: -1 });
  yield checkpoint('duel');
  yield* duel(c);
}

function* duel(c: ScriptCtx): Script {
  c.place(GAT, { hidden: false, x: 960, y: 440, facing: -1, pose: 'guard' });
  yield narrate(T.combat.intro);
  yield combat(romagnaDuel.id);
  yield* aftermath(c);
}

function* aftermath(c: ScriptCtx): Script {
  c.set(f('won'));
  c.place(GAT, { pose: 'kniet' });
  yield pose(GAT, 'kniet', { loop: true });
  yield narrate(T.nachher.n1);
  yield say(PC, T.nachher.m1);
  yield say(GAT, T.nachher.g1);
  yield narrate(T.nachher.n2);
  const pick: string = yield choice([
    { id: 'gehen', text: T.nachher.ende.gehen },
    { id: 'fragen', text: T.nachher.ende.fragen },
    { id: 'weiter', text: T.nachher.ende.weiter },
  ]);
  if (pick === 'gehen') {
    c.set(f('frei'));
    yield* lines(PC, T.nachher.gehen);
    yield say(ALE, T.nachher.alessandroGehen);
  } else if (pick === 'fragen') {
    c.set(f('ausgefragt'));
    yield say(PC, T.nachher.fragen[0]);
    yield say(GAT, T.nachher.fragen[1]);
    yield narrate(T.nachher.fragen[2]);
    yield say(ALE, T.nachher.alessandroFragen);
  } else {
    c.set(f('tot'));
    yield pose(PC, 'angriff', { loop: true });
    for (const t of T.nachher.weiter) yield narrate(t);
    yield say(ALE, T.nachher.alessandroWeiter);
  }
  c.journal('ende', 'done');
  yield fade(1, 1.0);
  yield endChapter();
}

const fluss: RoomDef = {
  id: 'rm_fluss',
  title: T.rooms.fluss,
  bg: 'bg_romagna_flussbett',
  width: 1300,
  perspective: persp2(300, 130, 462, 220),
  walk: [{ outer: [40, 470, 1260, 470, 1260, 384, 40, 384] }],
  entries: { tor: { x: 1000, y: 440, face: -1 } },
  assets: ['bg_romagna_flussbett', 'atlas/gattamelata_romagna', 'prop_schwert_boden'],
  // The sword lies where it fell once the man is disarmed (the riverbed sprite, drawn from the delivered art).
  layers: [{ id: 'schwertBoden', image: 'prop_schwert_boden', x: 0, y: 0, rect: [820, 418, 200, 75] as [number, number, number, number], depth: 440, visible: (s) => !!s.flags[f('won')] }],
  hotspots: [
    {
      id: 'spuren',
      name: T.fluss.spuren.name,
      shape: R(260, 380, 620, 90),
      walkTo: { x: 420, y: 440, face: 1 },
      priority: 2,
      verbs: ['look'],
      on: { look: readTracks },
    },
    {
      id: 'weide',
      name: T.fluss.weide.name,
      shape: R(850, 230, 230, 230),
      walkTo: { x: 880, y: 440, face: -1 },
      priority: 2,
      verbs: ['look', 'go'],
      on: { look: T.fluss.weide.look, go: approachWillow },
    },
    { id: 'stein', name: T.fluss.stein.name, shape: R(520, 340, 180, 90), walkTo: null, priority: 1, on: { look: T.fluss.stein.look } },
    { id: 'ufer', name: T.fluss.ufer.name, shape: R(0, 260, 300, 200), walkTo: null, priority: 0, on: { look: T.fluss.ufer.look } },
    {
      id: 'schwert',
      name: T.fluss.schwert.name,
      shape: R(820, 418, 200, 75),
      visible: (st) => !!st.flags[f('won')],
      walkTo: { x: 800, y: 452, face: 1 },
      priority: 3,
      verbs: ['look'],
      on: { look: T.fluss.schwert.look },
    },
    {
      id: 'tor',
      name: T.rooms.vorwerk,
      shape: R(0, 380, 160, 90),
      walkTo: { x: 60, y: 440, face: 1 },
      priority: 1,
      exit: { room: 'rm_vorwerk', entry: 'tor' },
      exitDir: 'up',
      verbs: ['look', 'go'],
      on: { look: T.fluss.enter },
    },
  ],
};

// ========================================================================================= Duell

const GUARD = 'guard';

export const romagnaDuel: CombatDef = {
  id: 'rm_duell',
  pc: PC,
  opp: GAT,
  actions: (['parieren', 'ausweichen', 'stoss', 'greifen', 'entwaffnen'] as const).map((id) => ({ id, label: T.combat.actions[id] })),
  intro: { pose: { pc: GUARD, opp: GUARD, pcX: 880, oppX: 960 }, text: T.combat.intro, time: 2.0 },
  window: 5,
  lateText: T.combat.late,
  wonText: T.combat.won,
  steps: [
    {
      id: 'hoch',
      cue: { pc: GUARD, opp: 'hoch', pcX: 880, oppX: 960 },
      cueText: T.combat.steps.hoch.cue,
      actions: ['parieren', 'ausweichen', 'stoss', 'greifen'],
      answer: 'parieren',
      success: { pc: 'stoss', opp: GUARD, pcX: 880, oppX: 960 },
      successText: T.combat.steps.hoch.good,
      fail: { pc: 'getroffen', opp: 'angriff', pcX: 880, oppX: 940 },
      failText: T.combat.steps.hoch.fail,
      wrong: T.combat.steps.hoch.wrong,
    },
    {
      id: 'stoss',
      cue: { pc: GUARD, opp: 'angriff', pcX: 880, oppX: 940 },
      cueText: T.combat.steps.stoss.cue,
      actions: ['ausweichen', 'parieren', 'stoss', 'greifen'],
      answer: 'ausweichen',
      success: { pc: 'tief', opp: 'angriff', pcX: 870, oppX: 940 },
      successText: T.combat.steps.stoss.good,
      fail: { pc: 'getroffen', opp: 'angriff', pcX: 880, oppX: 940 },
      failText: T.combat.steps.stoss.fail,
      wrong: T.combat.steps.stoss.wrong,
    },
    {
      id: 'entwaffnen',
      cue: { pc: GUARD, opp: GUARD, pcX: 880, oppX: 960 },
      cueText: T.combat.steps.entwaffnen.cue,
      actions: ['entwaffnen', 'parieren', 'ausweichen', 'stoss'],
      answer: 'entwaffnen',
      success: { pc: 'entwaffnen', opp: 'geduckt', pcX: 880, oppX: 940 },
      successText: T.combat.steps.entwaffnen.good,
      fail: { pc: 'getroffen', opp: GUARD, pcX: 880, oppX: 960 },
      failText: T.combat.steps.entwaffnen.fail,
      wrong: T.combat.steps.entwaffnen.wrong,
      lesson: T.combat.steps.entwaffnen.lesson,
    },
  ],
};

// ============================================================================================ Kapitel

export const romagnaChapter: ChapterDef = {
  id: 'romagna',
  title: T.title,
  dateline: T.dateline,
  // Placeholder picture until a Romagna card is painted: the inn card of chapter 8.
  card: { image: 'intro_hof', lines: T.card },
  pc: { character: 'mijo1505', name: T.names.mijo, color: C.pc },
  start: { room: 'rm_lager', entry: 'start' },
  next: 'ancona',
  journal: T.journal,
  items: [],
  actors: [
    { id: ALE, name: T.names.alessandro, character: 'alessandro', color: C.ale, start: { room: 'rm_lager', x: 560, y: 440, facing: 1, pose: 'stand' }, verbs: ['look', 'talk'], on: { look: T.alessandro.look, talk: warnen } },
    { id: FERR, name: T.names.ferrante, character: 'ferrante', color: C.ferr, start: { room: 'rm_schreib', x: 760, y: 440, facing: -1, pose: 'stand' }, verbs: ['look', 'talk'], on: { look: T.ferrante.look, talk: ferrante } },
    { id: TOM, name: T.names.tomasino, character: 'tomasino', color: C.tom, start: { room: 'rm_lager', x: 360, y: 440, facing: 1, pose: 'stand' }, verbs: ['look', 'talk'], on: { look: T.tomasino.look, talk: tomasinoFragen } },
    { id: POST, name: T.names.posten, character: 'posten_romagna', color: C.post, start: { room: 'rm_vorwerk', x: 600, y: 440, facing: 1, pose: 'stand' }, verbs: ['look', 'talk'], on: { look: T.vorwerk.posten.look, talk: posten } },
    { id: GAT, name: T.names.gattamelata, character: 'gattamelata_romagna', color: C.gat, start: { room: 'rm_fluss', x: 960, y: 440, facing: -1, pose: 'stand', hidden: true }, verbs: [] },
  ],
  dialogues: [],
  hint: (s) => {
    if (s.room === 'rm_lager' && !fl(s, 'warnung')) return { id: 'rm.warnung', steps: T.hints.warnung };
    if (!fl(s, 'wasser')) return { id: 'rm.wasser', steps: T.hints.wasser };
    if (!fl(s, 'tomRoute')) return { id: 'rm.tomasino', steps: T.hints.tomasino };
    if (!fl(s, 'postWer') && !fl(s, 'postTausch')) return { id: 'rm.vorwerk', steps: T.hints.vorwerk };
    if (!fl(s, 'spuren')) return { id: 'rm.spuren', steps: T.hints.spuren };
    if (!fl(s, 'won')) return { id: 'rm.kampf', steps: T.hints.kampf };
    return { id: 'rm.ende', steps: T.hints.ende };
  },
  setup: (c: ScriptCtx) => {
    c.place(PC, { character: 'mijo1505', pose: 'stand', gait: 'walk' });
  },
  intro: function* (c: ScriptCtx): Script {
    yield narrate(T.intro.n1);
    yield narrate(T.intro.n2);
    yield say(PC, T.intro.a);
    c.journal('warnung');
  },
  resumes: { duel, aftermath },
  rooms: [lager, schreib, vorwerk, fluss],
};

