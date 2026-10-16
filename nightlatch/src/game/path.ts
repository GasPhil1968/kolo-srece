// Walkable-area navigation: polygons with holes, visibility-graph A*.
import type { Pt } from './meta';

export interface Area {
  poly: Pt[];
  holes: Pt[][];
}

function pointInPoly(x: number, y: number, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) inside = !inside;
  }
  return inside;
}

function segIntersect(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return ((d1 > 1e-6 && d2 < -1e-6) || (d1 < -1e-6 && d2 > 1e-6)) &&
    ((d3 > 1e-6 && d4 < -1e-6) || (d3 < -1e-6 && d4 > 1e-6));
}

function cross(a: Pt, b: Pt, c: Pt): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function closestOnSeg(p: Pt, a: Pt, b: Pt): Pt {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1e-9;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return [a[0] + dx * t, a[1] + dy * t];
}

export class NavMesh {
  areas: Area[];
  extraHoles: Pt[][] = [];
  private nodes: Pt[] = [];
  private edges: [Pt, Pt][] = [];

  constructor(areas: Area[]) {
    this.areas = areas.map((a) => ({ poly: a.poly.map((p) => [p[0], p[1]] as Pt), holes: a.holes ?? [] }));
    this.rebuild();
  }

  setBlocks(holes: Pt[][]) {
    this.extraHoles = holes;
    this.rebuild();
  }

  private allHoles(): Pt[][] {
    return [...this.areas.flatMap((a) => a.holes), ...this.extraHoles];
  }

  private rebuild() {
    this.edges = [];
    const rings: Pt[][] = [...this.areas.map((a) => a.poly), ...this.allHoles()];
    for (const r of rings) for (let i = 0; i < r.length; i++) this.edges.push([r[i], r[(i + 1) % r.length]]);
    // graph nodes: polygon/hole vertices nudged slightly into the walkable area
    this.nodes = [];
    for (const r of rings) {
      for (let i = 0; i < r.length; i++) {
        const p = r[i];
        for (const [dx, dy] of [[2, 2], [-2, 2], [2, -2], [-2, -2], [3, 0], [-3, 0], [0, 3], [0, -3]]) {
          const q: Pt = [p[0] + dx, p[1] + dy];
          if (this.inside(q[0], q[1])) {
            this.nodes.push(q);
            break;
          }
        }
      }
    }
  }

  inside(x: number, y: number): boolean {
    for (const a of this.areas) {
      if (!pointInPoly(x, y, a.poly)) continue;
      if (a.holes.some((h) => pointInPoly(x, y, h))) continue;
      if (this.extraHoles.some((h) => pointInPoly(x, y, h))) continue;
      return true;
    }
    return false;
  }

  /** Nearest walkable point to p. */
  clamp(p: Pt): Pt {
    if (this.inside(p[0], p[1])) return p;
    let best: Pt = p;
    let bd = Infinity;
    for (const [a, b] of this.edges) {
      const c = closestOnSeg(p, a, b);
      const d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2;
      if (d < bd) {
        // nudge towards the inside
        for (const s of [1, 2, 3, 4, 6]) {
          for (const [dx, dy] of [[0, 0], [s, 0], [-s, 0], [0, s], [0, -s], [s, s], [-s, s], [s, -s], [-s, -s]]) {
            const q: Pt = [c[0] + dx, c[1] + dy];
            if (this.inside(q[0], q[1])) {
              const dq = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
              if (dq < bd) {
                bd = dq;
                best = q;
              }
            }
          }
        }
      }
    }
    if (bd === Infinity && this.nodes.length) {
      // fall back to the nearest graph node
      for (const n of this.nodes) {
        const d = (n[0] - p[0]) ** 2 + (n[1] - p[1]) ** 2;
        if (d < bd) {
          bd = d;
          best = n;
        }
      }
    }
    return best;
  }

  visible(a: Pt, b: Pt): boolean {
    for (const [c, d] of this.edges) if (segIntersect(a, b, c, d)) return false;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const steps = Math.max(1, Math.ceil(len / 4));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (!this.inside(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return false;
    }
    return true;
  }

  /** Path from a to b (b is clamped). Returns waypoints excluding a. */
  find(a: Pt, bRaw: Pt): Pt[] {
    const start = this.clamp(a);
    const goal = this.clamp(bRaw);
    if (this.visible(start, goal)) return [goal];
    const nodes = [start, goal, ...this.nodes];
    const n = nodes.length;
    const g = new Array(n).fill(Infinity);
    const f = new Array(n).fill(Infinity);
    const prev = new Array(n).fill(-1);
    const closed = new Array(n).fill(false);
    g[0] = 0;
    f[0] = Math.hypot(goal[0] - start[0], goal[1] - start[1]);
    const visCache = new Map<number, boolean>();
    const vis = (i: number, j: number) => {
      const k = i < j ? i * 4096 + j : j * 4096 + i;
      let v = visCache.get(k);
      if (v === undefined) {
        v = this.visible(nodes[i], nodes[j]);
        visCache.set(k, v);
      }
      return v;
    };
    for (;;) {
      let cur = -1;
      let best = Infinity;
      for (let i = 0; i < n; i++) if (!closed[i] && f[i] < best) {
        best = f[i];
        cur = i;
      }
      if (cur === -1) break;
      if (cur === 1) break;
      closed[cur] = true;
      for (let j = 0; j < n; j++) {
        if (closed[j] || j === cur) continue;
        if (!vis(cur, j)) continue;
        const d = g[cur] + Math.hypot(nodes[j][0] - nodes[cur][0], nodes[j][1] - nodes[cur][1]);
        if (d < g[j]) {
          g[j] = d;
          prev[j] = cur;
          f[j] = d + Math.hypot(goal[0] - nodes[j][0], goal[1] - nodes[j][1]);
        }
      }
    }
    if (prev[1] === -1) return [goal]; // unreachable: walk straight (presenter clamps)
    const out: Pt[] = [];
    for (let c = 1; c !== 0 && c !== -1; c = prev[c]) out.unshift(nodes[c]);
    return out;
  }

  /** Is goal reachable from start? (used by validators) */
  reachable(a: Pt, b: Pt): boolean {
    const start = this.clamp(a);
    const goal = this.clamp(b);
    if (this.visible(start, goal)) return true;
    const path = this.find(start, goal);
    let p = start;
    for (const q of path) {
      if (!this.visible(p, q)) return false;
      p = q;
    }
    return true;
  }
}
