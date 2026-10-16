// Walkable areas and shortest paths (visibility graph + A*). Pure, deterministic.
import { closestOnPolyEdge, dist, FlatPoly, pointInPoly, toPoints, Vec } from './geom';

export interface WalkArea {
  outer: FlatPoly;
  holes?: FlatPoly[];
}

interface Area {
  outer: Vec[];
  holes: Vec[][];
}

const STEP = 3; // sampling step for line-of-sight tests, in world pixels
const NUDGE = 2.5; // graph nodes sit this far inside the walkable area

export class NavMesh {
  private areas: Area[];
  private nodes: Vec[] = [];
  private adj: number[][] = [];

  constructor(walk: readonly WalkArea[]) {
    this.areas = walk.map((a) => ({ outer: toPoints(a.outer), holes: (a.holes ?? []).map(toPoints) }));
    this.buildGraph();
  }

  get areaCount(): number {
    return this.areas.length;
  }

  isWalkable(p: Vec): boolean {
    for (const a of this.areas) {
      if (!pointInPoly(p, a.outer)) continue;
      let inHole = false;
      for (const h of a.holes) {
        if (pointInPolyStrict(p, h)) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
    return false;
  }

  /** Closest walkable point to p (p itself if walkable). */
  nearestWalkable(p: Vec): Vec {
    if (this.isWalkable(p)) return { x: p.x, y: p.y };
    let best: Vec | null = null;
    let bestD = Infinity;
    for (const a of this.areas) {
      for (const ring of [a.outer, ...a.holes]) {
        const c = closestOnPolyEdge(p, ring);
        // step slightly towards walkable interior
        for (const cand of nudgeCandidates(c)) {
          if (!this.isWalkable(cand)) continue;
          const d = dist(p, cand);
          if (d < bestD) {
            bestD = d;
            best = cand;
          }
        }
      }
    }
    if (best) return best;
    // Degenerate fallback: first vertex of first area.
    const v = this.areas[0]?.outer[0];
    return v ? { x: v.x, y: v.y } : { x: p.x, y: p.y };
  }

  lineOfSight(a: Vec, b: Vec): boolean {
    const d = dist(a, b);
    const n = Math.max(1, Math.ceil(d / STEP));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (!this.isWalkable({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return false;
    }
    return true;
  }

  /** Shortest walkable path from a to b (b is clamped to the walkable area). Includes b, excludes a. */
  findPath(from: Vec, to: Vec): Vec[] {
    const a = this.nearestWalkable(from);
    const b = this.nearestWalkable(to);
    if (this.lineOfSight(a, b)) return [b];
    const N = this.nodes.length;
    const startIdx = N;
    const goalIdx = N + 1;
    const pts = [...this.nodes, a, b];
    const extra: number[][] = [[], []];
    for (let i = 0; i < N; i++) {
      if (this.lineOfSight(a, this.nodes[i])) extra[0].push(i);
      if (this.lineOfSight(this.nodes[i], b)) extra[1].push(i);
    }
    const goalNeighbors = new Set(extra[1]);
    const neighbors = (i: number): number[] => {
      if (i === startIdx) return extra[0];
      const base = this.adj[i];
      return goalNeighbors.has(i) ? [...base, goalIdx] : base;
    };
    // A*
    const g = new Map<number, number>([[startIdx, 0]]);
    const came = new Map<number, number>();
    const open = new Set<number>([startIdx]);
    const h = (i: number) => dist(pts[i], b);
    while (open.size) {
      let cur = -1;
      let curF = Infinity;
      for (const i of open) {
        const f = (g.get(i) ?? Infinity) + h(i);
        if (f < curF) {
          curF = f;
          cur = i;
        }
      }
      if (cur === goalIdx) {
        const path: Vec[] = [];
        let k: number | undefined = cur;
        while (k !== undefined && k !== startIdx) {
          path.push({ x: pts[k].x, y: pts[k].y });
          k = came.get(k);
        }
        return path.reverse();
      }
      open.delete(cur);
      const gc = g.get(cur) ?? Infinity;
      for (const nb of neighbors(cur)) {
        const cand = gc + dist(pts[cur], pts[nb]);
        if (cand < (g.get(nb) ?? Infinity)) {
          g.set(nb, cand);
          came.set(nb, cur);
          open.add(nb);
        }
      }
    }
    // Unreachable (separate islands): stay where we are.
    return [];
  }

  private buildGraph(): void {
    const nodes: Vec[] = [];
    for (const a of this.areas) {
      for (const ring of [a.outer, ...a.holes]) {
        for (let i = 0; i < ring.length; i++) {
          const prev = ring[(i + ring.length - 1) % ring.length];
          const cur = ring[i];
          const next = ring[(i + 1) % ring.length];
          // Inward bisector candidates; keep the one that is walkable.
          const v1 = norm({ x: prev.x - cur.x, y: prev.y - cur.y });
          const v2 = norm({ x: next.x - cur.x, y: next.y - cur.y });
          let bis = norm({ x: v1.x + v2.x, y: v1.y + v2.y });
          if (bis.x === 0 && bis.y === 0) bis = { x: -v1.y, y: v1.x };
          for (const s of [1, -1]) {
            const p = { x: cur.x + bis.x * NUDGE * s, y: cur.y + bis.y * NUDGE * s };
            if (this.isWalkable(p)) {
              nodes.push(p);
              break;
            }
          }
        }
      }
    }
    // Deduplicate near-identical nodes.
    const uniq: Vec[] = [];
    for (const n of nodes) if (!uniq.some((u) => dist(u, n) < 1)) uniq.push(n);
    this.nodes = uniq;
    this.adj = uniq.map(() => []);
    for (let i = 0; i < uniq.length; i++) {
      for (let j = i + 1; j < uniq.length; j++) {
        if (this.lineOfSight(uniq[i], uniq[j])) {
          this.adj[i].push(j);
          this.adj[j].push(i);
        }
      }
    }
  }
}

function norm(v: Vec): Vec {
  const l = Math.hypot(v.x, v.y);
  return l < 1e-9 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l };
}

function nudgeCandidates(c: Vec): Vec[] {
  const out: Vec[] = [c];
  for (const r of [1.5, 3, 5]) {
    for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * Math.PI * 2;
      out.push({ x: c.x + Math.cos(ang) * r, y: c.y + Math.sin(ang) * r });
    }
  }
  return out;
}

/** Point strictly inside polygon (boundary counts as outside) - used for holes. */
function pointInPolyStrict(pt: Vec, poly: readonly Vec[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > pt.y !== b.y > pt.y) {
      const x = ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x;
      if (pt.x < x) inside = !inside;
    }
  }
  return inside;
}

export function pathLength(from: Vec, path: readonly Vec[]): number {
  let len = 0;
  let p = from;
  for (const q of path) {
    len += dist(p, q);
    p = q;
  }
  return len;
}
