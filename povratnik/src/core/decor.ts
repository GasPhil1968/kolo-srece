// Placement of decor figures over time. Pure and deterministic, so the renderer and the tests agree
// on where a moving figure is at any clock value.
import type { DecorDef } from './content';
import type { Facing } from './state';

export interface DecorPlacement {
  x: number;
  y: number;
  facing: Facing;
  alpha: number;
  /** Seconds into the current animation (for walk cycles). */
  t: number;
  anim: string;
  /** Not on screen (between two passes of a looping path). */
  hidden: boolean;
}

function pathLength(path: [number, number][]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) len += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  return len;
}

/** Where a decor figure stands at `clock` (seconds of game time). Followers are placed by the caller. */
export function placeDecor(d: DecorDef, clock: number): DecorPlacement {
  const base: DecorPlacement = {
    x: d.x,
    y: d.y,
    facing: d.facing ?? 1,
    alpha: d.alpha ?? 1,
    t: clock + (d.phase ?? 0),
    anim: d.anim ?? 'stand',
    hidden: false,
  };
  const m = d.motion;
  if (!m || m.path.length < 2) return base;
  const len = pathLength(m.path);
  const period = Math.max(m.period, len / m.speed);
  const tc = (((clock + (m.offset ?? 0)) % period) + period) % period;
  let along = tc * m.speed;
  if (along > len) return { ...base, hidden: true, alpha: 0 };
  const fade = m.fade ?? 0;
  const fadeA = fade > 0 ? Math.min(1, along / fade, (len - along) / fade) : 1;
  for (let i = 1; i < m.path.length; i++) {
    const [x0, y0] = m.path[i - 1];
    const [x1, y1] = m.path[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (along <= seg || i === m.path.length - 1) {
      const k = seg > 0 ? Math.min(1, along / seg) : 0;
      return {
        x: x0 + (x1 - x0) * k,
        y: y0 + (y1 - y0) * k,
        facing: x1 < x0 ? -1 : x1 > x0 ? 1 : base.facing,
        alpha: base.alpha * Math.max(0, fadeA),
        t: clock + (d.phase ?? 0),
        anim: m.anim ?? 'walk',
        hidden: false,
      };
    }
    along -= seg;
  }
  return base;
}
