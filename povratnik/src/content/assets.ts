// Asset metadata shared by the engine (animation lengths) and the renderer (files, anchors).
// The JSON files are produced by tools/assets/*.py from the original artwork.
import sharedChars from './generated/characters.shared.json';
import images from './generated/images.json';
import type { AssetMeta } from '../core/engine';

export interface FrameMeta {
  w: number;
  h: number;
  /** Anchor (planted foot point) in normalised frame coordinates. */
  ax: number;
  ay: number;
}

export interface AnimMeta {
  frames: string[];
  fps: number;
  loop: boolean;
  /** Source pixel height of a full standing figure in this animation's sheet. */
  refH: number;
  /** Optional per-animation atlas override (actions drawn on other sheets). */
  atlas?: string;
}

export interface CharMeta {
  atlas: string;
  walkSpeed: number;
  anims: Record<string, AnimMeta>;
  frames: Record<string, FrameMeta>;
  /** Extra atlases whose frames this character uses (key -> frames). */
  extra?: Record<string, Record<string, FrameMeta>>;
}

export interface ImageMeta {
  file: string;
  w: number;
  h: number;
}

const extraChars: Record<string, CharMeta> = {};

/** Register additional characters (chapter-specific sheets). */
export function registerChars(c: Record<string, CharMeta>): void {
  Object.assign(extraChars, c);
}

export function charMeta(key: string): CharMeta | undefined {
  return extraChars[key] ?? (sharedChars as unknown as Record<string, CharMeta>)[key];
}

export function allCharKeys(): string[] {
  return [...new Set([...Object.keys(sharedChars), ...Object.keys(extraChars)])];
}

export function imageMeta(key: string): ImageMeta | undefined {
  return (images as Record<string, ImageMeta>)[key];
}

/** Standard adult visible height in world px at perspective scale 1. */
export const ADULT_H = 190;

export function engineMeta(): AssetMeta {
  const characters: AssetMeta['characters'] = {};
  for (const k of allCharKeys()) {
    const c = charMeta(k)!;
    const anims: Record<string, { frames: number; fps: number; loop: boolean }> = {};
    for (const [n, a] of Object.entries(c.anims)) anims[n] = { frames: a.frames.length, fps: a.fps, loop: a.loop };
    characters[k] = { anims, walkSpeed: c.walkSpeed };
  }
  return { characters };
}
