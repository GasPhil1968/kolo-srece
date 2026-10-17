// Script commands. Scripts are generator functions that yield these plain objects; the
// engine executes each one (instantly in simulations, timed in the browser) and resumes.
import type { Facing } from './state';
import type { ScriptCtx } from './content';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Script = Generator<Cmd, any, any>;
export type ScriptFn = (c: ScriptCtx) => Script;

export interface ChoiceOption {
  id: string;
  text: string;
}

export type Cmd =
  | { k: 'say'; actor: string; text: string; mood?: string }
  | { k: 'narrate'; text: string }
  | { k: 'walk'; actor: string; x: number; y: number; wait: boolean; speed?: number; face?: Facing; direct?: boolean; via?: [number, number][]; anim?: string }
  | { k: 'face'; actor: string; dir: Facing | string }
  | { k: 'pose'; actor: string; pose: string; loop: boolean; wait: boolean; times: number; rest: boolean }
  | { k: 'waitActor'; actor: string }
  | { k: 'wait'; t: number }
  | { k: 'fade'; to: number; t: number }
  | { k: 'room'; room: string; entry: string }
  | { k: 'camera'; x: number | null; t: number }
  | { k: 'choice'; options: ChoiceOption[] }
  | { k: 'card'; title: string; lines: string[]; image?: string; cine?: string; t?: number; kind?: 'time' }
  | { k: 'vignette'; image: string; frames: number; fps: number; captions: string[]; t: number; loop: boolean }
  | { k: 'fx'; name: string; on: boolean; params?: Record<string, number | string | boolean> }
  | { k: 'checkpoint'; resume: string | null }
  | { k: 'shake'; t: number; amp: number }
  | { k: 'combat'; id: string }
  | { k: 'insert'; spec: InsertSpec | null }
  | { k: 'endChapter' };

/** A framed close-up over the scene (the father's feet at the door, a palm): a crop of a background,
 * optionally magnified, and one animated figure. Panel coordinates are in screen pixels. */
export interface InsertSpec {
  w: number;
  h: number;
  bg?: string;
  /** Region of `bg` to show (x, y, w, h); it is scaled to fill the panel. */
  crop?: [number, number, number, number];
  sprite?: { character: string; anim: string; x: number; y: number; scale: number; flip?: boolean };
  /** Darken the background crop (0..1): the same place before dawn. */
  shade?: number;
  /** Multiply tint for the figure (night light). */
  tint?: number;
  /** Height of a dark band across the top of the panel: the bottom edge of a closed door, so that a
   * figure standing behind it shows only its feet in the gap below. */
  band?: number;
}

export const say = (actor: string, text: string, mood?: string): Cmd => ({ k: 'say', actor, text, mood });
export const narrate = (text: string): Cmd => ({ k: 'narrate', text });
/** Walk along the walk area. direct: straight lines through `via` to the target, ignoring the
 * walk area (animals behind walls, figures entering from off-screen). */
export const walk = (
  actor: string,
  x: number,
  y: number,
  opts: { wait?: boolean; speed?: number; face?: Facing; direct?: boolean; via?: [number, number][]; anim?: string } = {},
): Cmd => ({
  k: 'walk',
  actor,
  x,
  y,
  wait: opts.wait ?? true,
  speed: opts.speed,
  face: opts.face,
  direct: opts.direct,
  via: opts.via,
  anim: opts.anim,
});
export const face = (actor: string, dir: Facing | string): Cmd => ({ k: 'face', actor, dir });
/** Play a pose animation. loop: keeps looping (never waits); rest: keep the last frame afterwards. */
export const pose = (actor: string, name: string, opts: { loop?: boolean; wait?: boolean; times?: number; rest?: boolean } = {}): Cmd => ({
  k: 'pose',
  actor,
  pose: name,
  loop: opts.loop ?? false,
  wait: opts.wait ?? !opts.loop,
  times: opts.times ?? 1,
  rest: opts.rest ?? false,
});
export const waitActor = (actor: string): Cmd => ({ k: 'waitActor', actor });
export const wait = (t: number): Cmd => ({ k: 'wait', t });
export const fade = (to: number, t = 0.5): Cmd => ({ k: 'fade', to, t });
export const room = (roomId: string, entry: string): Cmd => ({ k: 'room', room: roomId, entry });
export const camera = (x: number | null, t = 1): Cmd => ({ k: 'camera', x, t });
export const choice = (options: ChoiceOption[]): Cmd => ({ k: 'choice', options });
export const card = (title: string, lines: string[], opts: { image?: string; cine?: string; t?: number } = {}): Cmd => ({
  k: 'card',
  title,
  lines,
  ...opts,
});
/** A passage of time inside a chapter ("Der dritte Morgen."): a short black card without the chapter label. */
export const timeCard = (title: string, lines: string[] = [], t?: number): Cmd => ({
  k: 'card',
  title,
  lines,
  kind: 'time',
  t: t ?? Math.min(9, 2.8 + lines.join(' ').length * 0.045),
});
/** Animated cinematic strip (4 x 2 frames of 384 x 216). Plays once and holds unless loop. */
export const vignette = (image: string, opts: { frames?: number; fps?: number; caption?: string; captions?: string[]; t?: number; loop?: boolean } = {}): Cmd => ({
  k: 'vignette',
  image,
  frames: opts.frames ?? 8,
  fps: opts.fps ?? 6,
  captions: opts.captions ?? (opts.caption ? [opts.caption] : []),
  t: opts.t ?? 4,
  loop: opts.loop ?? false,
});
export const fx = (name: string, on: boolean, params?: Record<string, number | string | boolean>): Cmd => ({ k: 'fx', name, on, params });
export const checkpoint = (resume: string | null = null): Cmd => ({ k: 'checkpoint', resume });
export const shake = (t = 0.4, amp = 4): Cmd => ({ k: 'shake', t, amp });
export const combat = (id: string): Cmd => ({ k: 'combat', id });
export const endChapter = (): Cmd => ({ k: 'endChapter' });
export const insert = (spec: InsertSpec | null): Cmd => ({ k: 'insert', spec });
