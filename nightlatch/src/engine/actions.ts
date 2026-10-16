// Enumerate what a player could do right now (used by the simulator and debug tools).
import type { Action, Game } from './game';

export interface EnumOptions {
  /** Include item-on-everything pairs (large). */
  allItemPairs?: boolean;
  /** Include every clue pair for deductions (large); otherwise only defined pairs + a few. */
  allCluePairs?: boolean;
}

export function enumerateActions(g: Game, opts: EnumOptions = {}): Action[] {
  const out: Action[] = [];
  const s = g.state;
  if (!s.room || s.ended) return out;
  const hs = g.hotspots();
  const npcs = g.npcsHere();
  for (const [id] of hs) {
    out.push({ t: 'look', target: { kind: 'hs', id } });
    out.push({ t: 'use', target: { kind: 'hs', id } });
  }
  for (const n of npcs) {
    out.push({ t: 'look', target: { kind: 'npc', id: n.id } });
    out.push({ t: 'use', target: { kind: 'npc', id: n.id } });
  }
  for (const item of s.inv) {
    out.push({ t: 'examine', item });
    for (const [id, h] of hs) {
      if (opts.allItemPairs || h.items?.[item]) out.push({ t: 'item', item, target: { kind: 'hs', id } });
    }
    for (const n of npcs) {
      const has = n.placement?.items?.[item] ?? n.def.items?.[item];
      if (opts.allItemPairs || has) out.push({ t: 'item', item, target: { kind: 'npc', id: n.id } });
    }
    for (const other of s.inv) {
      if (other <= item) continue;
      const def = g.content.items[item];
      const odef = g.content.items[other];
      if (opts.allItemPairs || def?.combine?.[other] || odef?.combine?.[item]) out.push({ t: 'combine', a: item, b: other });
    }
  }
  // travel (only where the room lets you out onto the street)
  if (hs.some(([, h]) => h.exit?.map && g.cond(h.exit.when))) {
    for (const l of g.locations()) out.push({ t: 'travel', loc: l.id });
  }
  // deductions
  const clues = s.clues;
  for (const d of Object.values(g.content.deductions)) {
    if (s.deds.includes(d.id) || !g.cond(d.when)) continue;
    for (const a of d.a) for (const b of d.b) {
      if (clues.includes(a) && clues.includes(b)) out.push({ t: 'deduce', a, b });
    }
  }
  if (opts.allCluePairs) {
    for (let i = 0; i < clues.length; i++) for (let j = i + 1; j < clues.length; j++) {
      out.push({ t: 'deduce', a: clues[i], b: clues[j] });
    }
  }
  for (const tl of Object.values(g.content.timelines)) {
    if (!g.cond(tl.when)) continue;
    if (tl.order.every((c) => clues.includes(c))) out.push({ t: 'timeline', id: tl.id, order: [...tl.order] });
  }
  return out;
}

export function actionKey(a: Action): string {
  switch (a.t) {
    case 'look':
    case 'use':
      return `${a.t}:${a.target.kind}:${a.target.id}`;
    case 'item':
      return `item:${a.item}>${a.target.kind}:${a.target.id}`;
    case 'combine':
      return `combine:${a.a}+${a.b}`;
    case 'examine':
      return `examine:${a.item}`;
    case 'travel':
      return `travel:${a.loc}`;
    case 'deduce':
      return `deduce:${a.a}+${a.b}`;
    case 'timeline':
      return `timeline:${a.id}:${a.order.join(',')}`;
  }
}
