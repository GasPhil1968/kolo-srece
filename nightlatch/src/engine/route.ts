// Room-graph navigation: the ways out of a room (exits and, from the street, the city
// map) and the shortest sequence of actions to reach another room. Used by the playtest
// simulator and by the browser tests' hooks.
import type { Action, Game } from './game';

export interface Edge {
  to: string;
  a: Action;
  /** The exit hotspot used (for map travel: the street door that opens the map). */
  via: string;
}

export function edgesFrom(g: Game): Edge[] {
  const out: Edge[] = [];
  for (const [id, h] of g.hotspots()) {
    if (!h.exit || !g.cond(h.exit.when)) continue;
    if (h.exit.map) {
      for (const l of g.locations()) out.push({ to: g.locationRoom(l).room, a: { t: 'travel', loc: l.id }, via: id });
    } else out.push({ to: h.exit.to, a: { t: 'use', target: { kind: 'hs', id } }, via: id });
  }
  return out;
}

/** Breadth-first shortest path from the current room. Leaves the game state untouched. */
export function routeTo(g: Game, target: string): Edge[] | null {
  const start = g.state.room;
  if (start === target) return [];
  const prev = new Map<string, { from: string; e: Edge }>();
  const queue = [start];
  const seen = new Set([start]);
  try {
    while (queue.length) {
      const r = queue.shift()!;
      g.state.room = r;
      for (const e of edgesFrom(g)) {
        if (seen.has(e.to) || !g.content.rooms[e.to]) continue;
        seen.add(e.to);
        prev.set(e.to, { from: r, e });
        if (e.to === target) {
          const path: Edge[] = [];
          let cur = target;
          while (cur !== start) {
            const p = prev.get(cur)!;
            path.unshift(p.e);
            cur = p.from;
          }
          return path;
        }
        queue.push(e.to);
      }
    }
    return null;
  } finally {
    g.state.room = start;
  }
}
