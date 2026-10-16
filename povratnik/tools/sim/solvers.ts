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
    if (opts.includes('what') || opts.includes('war')) return pickOption(sim, fl('halilRose') ? [] : ['rose']);
    return pickOption(sim, []);
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

export const SOLVERS: Record<string, Solver> = {
  sarajevo: solveSarajevo,
};
