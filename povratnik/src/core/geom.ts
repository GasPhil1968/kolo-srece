// Plane geometry for walkable areas, hotspots and hit tests. Pure functions.

export interface Vec {
  x: number;
  y: number;
}

/** A polygon as a flat list of points (x0, y0, x1, y1, ...), clockwise or counter-clockwise. */
export type FlatPoly = readonly number[];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function toPoints(p: FlatPoly): Vec[] {
  const out: Vec[] = [];
  for (let i = 0; i + 1 < p.length; i += 2) out.push({ x: p[i], y: p[i + 1] });
  return out;
}

export function rectPoly(r: Rect): FlatPoly {
  return [r.x, r.y, r.x + r.w, r.y, r.x + r.w, r.y + r.h, r.x, r.y + r.h];
}

export function dist(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Even-odd point-in-polygon test. Points on the boundary count as inside within eps. */
export function pointInPoly(pt: Vec, poly: readonly Vec[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > pt.y !== b.y > pt.y) {
      const x = ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x;
      if (pt.x < x) inside = !inside;
    }
  }
  if (inside) return true;
  return distToPolyEdge(pt, poly) < 0.01;
}

export function pointInRect(pt: Vec, r: Rect): boolean {
  return pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;
}

export function closestOnSegment(p: Vec, a: Vec, b: Vec): Vec {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { x: a.x, y: a.y };
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

export function distToPolyEdge(p: Vec, poly: readonly Vec[]): number {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const c = closestOnSegment(p, poly[j], poly[i]);
    best = Math.min(best, dist(p, c));
  }
  return best;
}

export function closestOnPolyEdge(p: Vec, poly: readonly Vec[]): Vec {
  let best = Infinity;
  let bestPt: Vec = { x: poly[0].x, y: poly[0].y };
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const c = closestOnSegment(p, poly[j], poly[i]);
    const d = dist(p, c);
    if (d < best) {
      best = d;
      bestPt = c;
    }
  }
  return bestPt;
}

function orient(a: Vec, b: Vec, c: Vec): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

/** Proper intersection of segments ab and cd (touching at endpoints does not count). */
export function segmentsCross(a: Vec, b: Vec, c: Vec, d: Vec): boolean {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  const eps = 1e-9;
  return ((o1 > eps && o2 < -eps) || (o1 < -eps && o2 > eps)) && ((o3 > eps && o4 < -eps) || (o3 < -eps && o4 > eps));
}

export function polyArea(poly: readonly Vec[]): number {
  let s = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += (poly[j].x + poly[i].x) * (poly[j].y - poly[i].y);
  return s / 2;
}

export function polyBounds(poly: readonly Vec[]): Rect {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of poly) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
