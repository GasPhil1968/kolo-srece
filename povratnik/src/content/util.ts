// Small helpers for writing chapters.
import type { Perspective } from '../core/content';
import { ADULT_H } from './assets';

export const PC = 'pc';

/**
 * Pinhole perspective over flat ground: `horizon` is the eye-level line of the painting,
 * `h0` the height in pixels of a standing adult whose feet are at `y0` (measured from doors,
 * furniture and other architecture in the background).
 */
export function persp(horizon: number, y0: number, h0: number): Perspective {
  const s0 = h0 / ADULT_H;
  const y1 = y0 + 100;
  return { farY: y0, farScale: s0, nearY: y1, nearScale: (s0 * (y1 - horizon)) / (y0 - horizon) };
}

export const R = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });

/** Flag name helper per chapter prefix. */
export const flags = (prefix: string) => (n: string) => `${prefix}.${n}`;

/** Linear perspective through two measured points: an adult is h1 px tall at y1 and h2 px at y2. */
export function persp2(y1: number, h1: number, y2: number, h2: number): Perspective {
  return { farY: y1, farScale: h1 / ADULT_H, nearY: y2, nearScale: h2 / ADULT_H };
}
