import { describe, expect, it } from 'vitest';
import { NavMesh, pathLength } from '../../src/core/path';

describe('NavMesh', () => {
  // U-shaped room: a wall sticks up from the bottom in the middle.
  const u = new NavMesh([{ outer: [0, 0, 300, 0, 300, 200, 200, 200, 200, 60, 100, 60, 100, 200, 0, 200] }]);

  it('detects walkable points', () => {
    expect(u.isWalkable({ x: 50, y: 150 })).toBe(true);
    expect(u.isWalkable({ x: 150, y: 150 })).toBe(false);
    expect(u.isWalkable({ x: 150, y: 30 })).toBe(true);
  });

  it('walks around the wall', () => {
    const p = u.findPath({ x: 50, y: 180 }, { x: 250, y: 180 });
    expect(p.length).toBeGreaterThan(1);
    for (let i = 0; i < p.length; i++) expect(u.isWalkable(p[i])).toBe(true);
    const len = pathLength({ x: 50, y: 180 }, p);
    expect(len).toBeGreaterThan(350);
    expect(len).toBeLessThan(500);
  });

  it('clamps targets outside the area', () => {
    const p = u.findPath({ x: 50, y: 180 }, { x: 150, y: 190 });
    const end = p[p.length - 1];
    expect(u.isWalkable(end)).toBe(true);
  });

  it('respects holes', () => {
    const m = new NavMesh([{ outer: [0, 0, 400, 0, 400, 200, 0, 200], holes: [[150, 50, 250, 50, 250, 150, 150, 150]] }]);
    expect(m.isWalkable({ x: 200, y: 100 })).toBe(false);
    const p = m.findPath({ x: 100, y: 100 }, { x: 300, y: 100 });
    expect(p.length).toBeGreaterThan(1);
    expect(m.isWalkable({ x: 160, y: 40 })).toBe(true);
  });

  it('unions overlapping areas', () => {
    const m = new NavMesh([
      { outer: [0, 0, 100, 0, 100, 100, 0, 100] },
      { outer: [80, 40, 300, 40, 300, 80, 80, 80] },
    ]);
    const p = m.findPath({ x: 10, y: 10 }, { x: 290, y: 60 });
    expect(p.length).toBeGreaterThan(0);
    expect(p[p.length - 1].x).toBeCloseTo(290, 0);
  });
});
