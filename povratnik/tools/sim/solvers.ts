// Goal-directed solvers: from ANY reachable state they choose the next action that progresses the
// chapter. Used for complete walkthroughs and to prove that random play never leads into a softlock.
import type { Intent } from '../../src/core/engine';
import { dyn } from '../../src/core/content';
import type { Sim } from './harness';

export type Solver = (sim: Sim) => Intent | null;

/** First exit (hotspot id) in the current room on a shortest route to `target` room. */
export function routeTo(sim: Sim, target: string): string | null {
  const e = sim.engine;
  const start = e.state.room;
  if (start === target) return null;
  const prev = new Map<string, { room: string; via: string }>();
  const queue = [start];
  const seen = new Set([start]);
  while (queue.length) {
    const r = queue.shift()!;
    const def = e.roomDef(r);
    if (!def) continue;
    for (const h of def.hotspots) {
      if (h.visible && !h.visible(e.state)) continue;
      const ex = h.exit ? dyn(h.exit, e.state) : null;
      if (!ex || seen.has(ex.room)) continue;
      if (r === start && h.exitBlocked?.(e.state)) continue;
      seen.add(ex.room);
      prev.set(ex.room, { room: r, via: h.id });
      if (ex.room === target) {
        let cur = target;
        let via = h.id;
        while (prev.get(cur)!.room !== start) {
          cur = prev.get(cur)!.room;
          via = prev.get(cur)!.via;
        }
        return via;
      }
      queue.push(ex.room);
    }
  }
  return null;
}

export const act = (target: string, verb: string): Intent => ({ k: 'act', target, verb });
export const use = (item: string, target: string): Intent => ({ k: 'useItem', item, target });
export const choose = (id: string): Intent => ({ k: 'choose', id });

/** Go to a room (returns the exit action) or null if already there. */
export function go(sim: Sim, room: string): Intent | null {
  if (sim.engine.state.room === room) return null;
  const via = routeTo(sim, room);
  if (!via) throw new Error(`no route from ${sim.engine.state.room} to ${room}`);
  return act(via, 'go');
}

/** Pick a preferred dialogue option if present, else leave. */
export function pickOption(sim: Sim, prefs: string[]): Intent {
  const opts = sim.options();
  for (const p of prefs) if (opts.includes(p)) return choose(p);
  return choose(opts.includes('__bye') ? '__bye' : opts[opts.length - 1]);
}

// ----------------------------------------------------------------------------------- chapter 1

export const solveSarajevo: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`sa.${n}`];
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    if (opts.includes('tell')) return choose('tell');
    if (opts.includes('calm')) return choose(opts.includes('rose') ? 'rose' : 'calm'); // report
    // Halil's dialogue: ask about the crater once it has been seen; otherwise leave.
    return pickOption(sim, fl('halilRose') ? [] : ['rose']);
  }
  if (!fl('band')) return go(sim, 'sa_zimmer') ?? use('band', 'couchtisch');
  if (!fl('task')) return go(sim, 'sa_zimmer') ?? act('actor:mijo96', 'talk');
  if (!s.inventory.includes('dzezva') && !fl('poured')) return go(sim, 'sa_zimmer') ?? act('dzezva', 'take');
  if (!fl('sawRose')) return go(sim, 'sa_gasse') ?? act('rose', 'look');
  if (!fl('repaired')) return go(sim, 'sa_sebilj') ?? use('dzezva', 'actor:halil');
  if (!fl('halilRose')) return go(sim, 'sa_sebilj') ?? act('actor:halil', 'talk');
  if (!fl('full')) return go(sim, 'sa_kafana') ?? use('dzezva', 'actor:nedzad');
  if (!fl('poured')) return go(sim, 'sa_zimmer') ?? use('dzezva', 'tasseMijo');
  if (!fl('reported')) return go(sim, 'sa_zimmer') ?? act('actor:mijo96', 'talk');
  return null;
};

// ----------------------------------------------------------------------------------- chapter 2

export const solveWeide: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`we.${n}`];
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    for (const want of ['rag', 'cloth', 'listen', 'still']) if (opts.includes(want)) return choose(want);
    if (opts.includes('later')) return choose('later');
    return pickOption(sim, []);
  }
  if (s.room === 'we_kuca') return fl('ate') ? act('bank', 'lie') : act('tisch', 'eat');
  if (!fl('counted')) return go(sim, 'we_weide') ?? act('herde', 'look');
  if (!fl('trail')) return go(sim, 'we_weide') ?? act('wacholder', 'look');
  if (!fl('found')) return go(sim, 'we_weide') ?? act('mauer', 'look');
  if (!fl('goatBack') && !s.inventory.includes('wacholder')) return go(sim, 'we_weide') ?? act('wacholder', 'take');
  if (!fl('goatBack')) return go(sim, 'we_weide') ?? use('wacholder', 'mauerEnde');
  if (!fl('lesson')) {
    if (!fl('sitting')) return go(sim, 'we_weide') ?? act('stein', 'climb');
    if (s.room === 'we_weide') return act('strasse', 'go');
    if (!fl('obsMiddle') || !fl('obsQuiet') || (!fl('q1') && fl('obsMiddle'))) return act('reiter1', 'look');
    if (!fl('obsBales')) return act('ballen0', 'look');
    if (!fl('obsMule')) return act('maultier', 'look');
    return act('reiter1', 'look');
  }
  if (s.room === 'we_tal') return act('zurueck', 'go');
  return act('pfad', 'go');
};

// ----------------------------------------------------------------------------------- chapter 3

export const solveDorf: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`do.${n}`];
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    for (const want of ['larger', 'silent']) if (opts.includes(want)) return choose(want);
    if (opts.includes('holz') && !fl('ivanAsked')) return choose('holz');
    if (opts.includes('give') && fl('ivanAsked')) return choose('give');
    return pickOption(sim, []);
  }
  if (s.room === 'do_abend') {
    if (!fl('taken')) return act('bank', 'take');
    if (!fl('ivanAsked')) return act('actor:ivan73', 'talk');
    if (!fl('given')) return use('kerbhoelzer', 'actor:otac73');
    return act('platz', 'go');
  }
  if (!fl('sawLuka') || !fl('sawStjepan')) return act('stall', 'watch');
  if (!fl('sawKatib')) return act('actor:katib73', 'look');
  if (!fl('rule')) return { k: 'examine', item: 'kerbholz' };
  return act('stall', 'watch');
};

export const SOLVERS: Record<string, Solver> = {
  sarajevo: solveSarajevo,
  weide: solveWeide,
  dorf: solveDorf,
};
