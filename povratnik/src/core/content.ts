// Content model: chapters, rooms, hotspots, actors, items, dialogues. Chapters are data plus
// generator scripts; they never touch the renderer.
import type { Rect, FlatPoly } from './geom';
import type { WalkArea } from './path';
import type { Facing, FlagValue, GameState } from './state';
import type { Cmd, Script, ScriptFn } from './cmd';

export type Cond = (s: GameState) => boolean;
export type Dyn<T> = T | ((s: GameState) => T);

export function dyn<T>(v: Dyn<T>, s: GameState): T {
  return typeof v === 'function' ? (v as (s: GameState) => T)(s) : v;
}

/** look | take | use | talk, plus chapter verbs such as crawl, carry, lay, pray, sit. */
export type Verb = string;

/** A handler is a line (or lines) the player character says, or a script. */
export type Handler = string | readonly string[] | ScriptFn;

export interface Perspective {
  /** y of the far walk line and the scale of a standard adult there. */
  farY: number;
  farScale: number;
  nearY: number;
  nearScale: number;
}

export interface Spot {
  x: number;
  y: number;
  face?: Facing;
}

export interface HotspotDef {
  id: string;
  name: Dyn<string>;
  /** Screen shape in room coordinates. Actor hotspots follow the actor and need no shape. */
  shape?: Rect | { poly: FlatPoly };
  /** Bind the hotspot to an actor (its sprite is the click area). */
  actor?: string;
  /** Bind the hotspot to a (possibly moving) decor figure; its sprite is the click area. */
  decor?: string;
  visible?: Cond;
  /** Where the player walks before acting; null = act from the current position. */
  walkTo?: Dyn<Spot | null>;
  /** Verbs offered in the action menu. Default: look + those with handlers. */
  verbs?: Dyn<Verb[]>;
  /** Verb handlers. */
  on?: Partial<Record<Verb, Handler>>;
  /** Item-on-hotspot handlers keyed by item id. */
  items?: Partial<Record<string, Handler>>;
  /** Fallback for items without a specific handler (explain the obstacle!). */
  anyItem?: (item: string, s: GameState) => Handler | undefined;
  /** If set, the primary click walks there and leaves the room. */
  exit?: Dyn<{ room: string; entry: string } | null>;
  /** Exit refused: return a line that explains why (null = allowed). */
  exitBlocked?: (s: GameState) => string | null;
  /** Cursor hint for exits: arrow direction. */
  exitDir?: 'left' | 'right' | 'up' | 'down';
  /** Lower draws first in hit tests (higher wins). Actors default 10, hotspots 0. */
  priority?: number;
}

export interface LayerDef {
  id: string;
  /** Texture key, or 'atlas:frame'. */
  image: Dyn<string>;
  x: number;
  y: number;
  /** Origin in the image, default [0, 0]. */
  origin?: [number, number];
  /** Depth: a y baseline compared with actor feet; 'back' (behind all) or 'front' (above all). */
  depth?: number | 'back' | 'front';
  visible?: Cond;
  alpha?: number;
  scale?: number;
  flipX?: boolean;
  /** Animated layer: frame keys cycled at fps. */
  frames?: string[];
  fps?: number;
  /** Place the image into this rectangle (x, y, w, h) instead of x/y + scale. */
  rect?: [number, number, number, number];
  /** Hidden actors drawn as part of this layer (a seated pair): speech is anchored above the layer
   * at the given fraction of its width. */
  speakers?: Record<string, number>;
}

/** Non-interactive figure drawn like an actor (perspective scale, planted anchor, y-sorted). */
export interface DecorDef {
  id: string;
  character: string;
  anim?: string;
  x: number;
  y: number;
  facing?: Facing;
  relHeight?: number;
  visible?: Cond;
  /** Fixed depth (otherwise its y). */
  depth?: number;
  /** Fixed scale multiplier instead of the room perspective (e.g. birds in the sky). */
  scale?: number;
  alpha?: number;
  /** Animation clock offset in seconds, so neighbours do not move in sync. */
  phase?: number;
  /** Walk along a path and re-enter from its start (caravans, columns, flying birds). */
  motion?: DecorMotion;
  /** Ride along with another decor figure (a bale on a horse), offset in the leader's source pixels. */
  follow?: DecorFollow;
}

export interface DecorMotion {
  /** Polyline in room coordinates. */
  path: [number, number][];
  /** Room pixels per second along the path. */
  speed: number;
  /** Seconds from one entry to the next (>= path length / speed). */
  period: number;
  /** Seconds into the cycle at clock 0 (spacing within a column). */
  offset?: number;
  /** Pixels over which the figure fades in and out at both ends. */
  fade?: number;
  /** Animation while moving (default 'walk'). */
  anim?: string;
}

export interface DecorFollow {
  id: string;
  dx: number;
  dy: number;
  /** Hop height in source pixels and hops per second (soft loads bounce with the gait). */
  bob?: number;
  bobHz?: number;
}

export interface AmbientDef {
  /** Effect name understood by the view (smoke, fire, dust, birds, rain, ...). */
  fx: string;
  x: number;
  y: number;
  visible?: Cond;
  params?: Record<string, number | string | boolean>;
}

export interface RuleDef {
  id: string;
  when: Cond;
  run: ScriptFn;
  /** Rules fire once unless repeat is true (they must then change state to stop). */
  repeat?: boolean;
}

export interface RoomDef {
  id: string;
  title: string;
  bg: Dyn<string>;
  width: number;
  height?: number;
  walk: Dyn<WalkArea[]>;
  perspective: Perspective;
  entries: Record<string, Spot>;
  hotspots: HotspotDef[];
  layers?: LayerDef[];
  decor?: DecorDef[];
  ambient?: AmbientDef[];
  /** Multiply tint for actors in this room (night scenes), e.g. 0x9aa6c8. */
  actorTint?: Dyn<number>;
  /** Multiply tint for prop layers (a daylight prop in a night room). Occluders (occ_*), which are cut
   * from the background itself, are never tinted. */
  layerTint?: Dyn<number>;
  /** Darken the whole picture for dusk and night (0..1) with this colour (default deep blue). */
  shade?: Dyn<number>;
  shadeColor?: number;
  /** Raised walkable ground (steps, a platform), in screen pixels above the floor at (x, y): figures
   * standing there are scaled for the floor point below them, not for the higher spot on screen. */
  elevation?: (x: number, y: number) => number;
  /** The player cannot walk here (lying in cover, a painted full frame). Interactions happen in place. */
  noWalk?: Dyn<boolean>;
  /** What the player character says when a walk is refused in a no-walk room (null = nothing). */
  noWalkSay?: Dyn<string | null>;
  onEnter?: ScriptFn;
  /** Synchronous state set-up at the moment the room is swapped in, before it fades in
   * (e.g. people who came home ahead of the player). No commands. */
  prepare?: (c: ScriptCtx) => void;
  rules?: RuleDef[];
  /** Asset bundles this room needs (backgrounds, props, character atlases). */
  assets?: string[];
}

export interface ActorDef {
  id: string;
  name: Dyn<string>;
  character: string;
  /** Height relative to a standard adult (child ~0.75). */
  relHeight?: number;
  start?: { room: string | null; x: number; y: number; facing: Facing; pose?: string; hidden?: boolean };
  /** Text colour for speech (CSS). */
  color: string;
  /** Portrait key for the dialogue box ('sheet:row'), optional. */
  portrait?: string;
  verbs?: Dyn<Verb[]>;
  on?: Partial<Record<Verb, Handler>>;
  items?: Partial<Record<string, Handler>>;
  anyItem?: (item: string, s: GameState) => Handler | undefined;
  /** Where the player stands to talk: offset from the actor (x is mirrored to the player's side). */
  talkOffset?: number;
  /** Fixed spot to stand at instead (e.g. in front of a counter). */
  talkSpot?: Dyn<Spot>;
}

export interface SelfDef {
  name: Dyn<string>;
  visible?: Cond;
  verbs?: Dyn<Verb[]>;
  on?: Partial<Record<Verb, Handler>>;
  items?: Partial<Record<string, Handler>>;
}

export interface ItemDef {
  id: string;
  name: Dyn<string>;
  /** Icon texture key ('atlas:frame'). */
  icon: Dyn<string>;
  look: Handler;
  /** Combination handlers keyed by the other item id (order-independent). */
  combine?: Partial<Record<string, Handler>>;
  /** Fallback text when combined with something unhandled. */
  combineFail?: (other: string, s: GameState) => Handler | undefined;
}

export interface DialogueOption {
  id: string;
  text: Dyn<string>;
  when?: Cond;
  /** Options vanish after use unless repeat is true. */
  repeat?: boolean;
  /** Ends the conversation after running. */
  exit?: boolean;
  run: ScriptFn;
}

export interface DialogueDef {
  id: string;
  actor: string;
  /** Opening exchange each time the dialogue starts (may vary with state). */
  open?: ScriptFn;
  options: DialogueOption[];
  /** The always-available goodbye line. */
  bye: Dyn<string>;
  close?: ScriptFn;
}

export interface HintDef {
  id: string;
  steps: readonly string[];
}

export interface JournalDef {
  [id: string]: string;
}

export interface ChapterDef {
  id: string;
  /** Short display name, e.g. "Elf Tage". */
  title: string;
  /** Date and place line for the chapter card. */
  dateline: string;
  card: { image: string; cine?: string; lines: readonly string[] };
  /** Character key the player controls in this chapter. */
  pc: { character: string; name: string; color: string; portrait?: string; relHeight?: number };
  start: { room: string; entry: string };
  rooms: RoomDef[];
  actors: ActorDef[];
  items: ItemDef[];
  dialogues: DialogueDef[];
  journal: JournalDef;
  /** Current hint for the player's situation (progressive steps). */
  hint: (s: GameState) => HintDef | null;
  /** Chapter state defaults applied when the chapter starts fresh (e.g. via chapter menu). */
  setup?: (c: ScriptCtx) => void;
  /** Runs after the chapter card. */
  intro?: ScriptFn;
  /** Resumable sequences for checkpoints, keyed by id. */
  resumes?: Record<string, ScriptFn>;
  /** The player character as a target (target id 'self'): looking at oneself, tearing a shirt, … */
  self?: SelfDef;
  next: string | null;
  /** Bundles to preload for the chapter. */
  assets?: string[];
}

/** What scripts may do synchronously; commands are yielded separately. */
export interface ScriptCtx {
  readonly s: GameState;
  flag(name: string): FlagValue | undefined;
  is(name: string): boolean;
  num(name: string): number;
  set(name: string, v?: FlagValue): void;
  unset(name: string): void;
  inc(name: string, by?: number): number;
  has(item: string): boolean;
  give(item: string): void;
  drop(item: string): void;
  journal(id: string, status?: 'open' | 'done'): void;
  seen(id: string): boolean;
  mark(id: string): void;
  place(actor: string, p: Partial<{ room: string | null; x: number; y: number; facing: Facing; pose: string; hidden: boolean; character: string; gait: string }>): void;
  /** Run a dialogue tree with its options until the player leaves. */
  dialogue(id: string): Script;
  /** Speak lines in sequence for the player character. */
  lines(actor: string, text: string | readonly string[]): Script;
  /** Cycle through alternatives (deterministic, per key). */
  pick(key: string, alternatives: readonly string[]): string;
  /** Chapter-level helpers. */
  readonly chapter: ChapterDef;
  readonly room: RoomDef;
  readonly reducedMotion: boolean;
  /** Last combat result. */
  readonly combatResult: 'won' | 'yielded' | null;
  emit(cmd: Cmd): Cmd;
}

export interface ContentRegistry {
  chapters: ChapterDef[];
}
