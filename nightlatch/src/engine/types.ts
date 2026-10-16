// Core data types shared by the game runtime and the headless simulator.

export type Val = boolean | number | string;
export type Dir = 'up' | 'down' | 'left' | 'right';
export type Cond = string; // see cond.ts for the grammar

/** A script is a list of steps. A bare string is a line spoken by Rook. */
export type Script = Step[];

export type Step =
  | string
  | { say: string; who?: string; mood?: string }
  | { narrate: string }
  | { set: string | Record<string, Val> }
  | { unset: string }
  | { inc: string; by?: number }
  | { give: string; silent?: boolean }
  | { take: string }
  | { clue: string; silent?: boolean }
  | { person: string }
  | { unlock: string; silent?: boolean }
  | { sfx: string }
  | { music: string | null }
  | { amb: string | null }
  | { walk: string | [number, number]; who?: string }
  | { face: Dir; who?: string }
  | { anim: string; who?: string }
  | { goto: string; at?: string }
  | { dialog: string; node?: string }
  | { if: Cond; then: Script; else?: Script }
  | { pick: { when?: Cond; do: Script }[] }
  | { once: string; do: Script; else?: Script }
  | { wait: number }
  | { fade: 'out' | 'in'; ms?: number }
  | { card: string; sub?: string }
  | { chapter: number }
  | { doc: string }
  | { closeup: string }
  | { autosave: string }
  /** Stage an NPC somewhere for a scene; `hide` (or no room) releases it back to its default placements. */
  | { npc: string; room?: string; at?: string; face?: Dir; hide?: boolean }
  | { shake: number }
  | { flash: string }
  | { blur: number }
  | { end: true }
  | { stop: true }
  | { random: Script[] }
  | { hint: string }
  | { stash: 'all' | string[] }
  | { unstash: true };

export interface HotspotDef {
  name: string;
  /** Verb shown for left click (default "Use", exits default "Go to"). */
  verb?: string;
  when?: Cond;
  look?: Script;
  use?: Script;
  items?: Record<string, Script>;
  anyItem?: Script;
  /** Exit to another room (left click). */
  exit?: { to: string; at?: string; when?: Cond; blocked?: Script; map?: boolean };
  /** Don't walk before acting (e.g. things seen from afar). */
  noWalk?: boolean;
}

export interface NpcDef {
  id: string;
  name: string;
  color: string; // speech colour, CSS hex
  sprite: string;
  look?: Script;
  talk?: Script;
  items?: Record<string, Script>;
  anyItem?: Script;
  verb?: string;
}

export interface NpcPlacement {
  id: string;
  at: string; // room point id
  when?: Cond;
  face?: Dir;
  pose?: string; // e.g. 'sit' for sprites with sitting frames
  /** Overrides that apply only in this room/placement. */
  look?: Script;
  talk?: Script;
  items?: Record<string, Script>;
  anyItem?: Script;
}

export interface RoomDef {
  id: string;
  name: string;
  /** music track id, or [cond, track] pairs (first match) ending with a default */
  music?: string | [Cond, string][];
  amb?: string | [Cond, string][];
  variant?: [Cond, string][];
  objects?: Record<string, Cond>;
  hotspots: Record<string, HotspotDef>;
  npcs?: NpcPlacement[];
  enter?: Script;
  /** Walkable-area overrides: hotspot ids or polygons are handled by the presenter. */
  blocks?: { when: Cond; poly: [number, number][] }[];
  dark?: Cond; // if true, presenter renders the room darker (fallback)
  noPlayer?: Cond; // hide the player (cutscene-only rooms)
}

export interface ItemDef {
  id: string;
  name: string;
  look: Script;
  combine?: Record<string, Script>;
  /** Readable document shown in the viewer when examined. */
  doc?: string;
  evidence?: boolean;
}

export interface ClueDef {
  id: string;
  title: string;
  text: string;
  doc?: string;
  /** Timeline card time label, if this clue is a timeline card. */
  time?: string;
}

export interface DeductionDef {
  id: string;
  a: string[];
  b: string[];
  title: string;
  text: string;
  when?: Cond;
  then?: Script;
}

export interface TimelineDef {
  id: string;
  title: string;
  when: Cond;
  /** Clue ids in the correct chronological order. */
  order: string[];
  solved: Script;
}

export interface OptionDef {
  id: string;
  text: string;
  /** What Rook says when choosing it (default: the option text; false = nothing). */
  say?: string | false;
  when?: Cond;
  once?: boolean;
  do?: Script;
  next?: string; // node id, 'exit' ends the conversation; default: stay on node
  /** "Show..." option: item -> script, with optional default. */
  present?: Record<string, Script>;
}

export interface DialogNode {
  lines?: Script;
  options: OptionDef[];
}

export interface DialogDef {
  id: string;
  npc: string;
  start?: string;
  nodes: Record<string, DialogNode>;
}

export interface DocDef {
  id: string;
  title: string;
  style?: 'paper' | 'note' | 'newspaper' | 'carbon' | 'file' | 'photo' | 'card' | 'telegram';
  text: string;
  image?: string; // optional picture shown above the text
}

export interface CloseupDef {
  id: string;
  kind: 'combo' | 'patch';
  title: string;
  /** combination digits (combo) or required patch pairs (patch) */
  solution: string;
  /** For the simulator: whether a knowledgeable player could enter it now. */
  knownWhen: Cond;
  solved: Script;
  wrong?: Script;
  wheels?: number;
  /** patch: available jacks */
  jacks?: string[];
}

export interface ObjectiveDef {
  id: string;
  text: string;
  when?: Cond;
  done: Cond;
  hints: string[];
}

export interface ChapterDef {
  n: number;
  title: string;
  sub: string;
  objectives: ObjectiveDef[];
  /** Chapter is complete when this condition holds (the end script has run). */
  complete: Cond;
}

export interface LocationDef {
  id: string;
  name: string;
  room: string;
  at?: string;
  x: number;
  y: number;
  /** Shown when this condition holds AND (unlocked via {unlock}). */
  when?: Cond;
  /** Room to use instead depending on state, first match. */
  rooms?: [Cond, string, string?][];
}

export interface PersonDef {
  id: string;
  name: string;
  text: string;
  /** Later notes appended when the condition holds. */
  notes?: [Cond, string][];
  portrait?: string;
}

export interface Content {
  rooms: Record<string, RoomDef>;
  items: Record<string, ItemDef>;
  npcs: Record<string, NpcDef>;
  dialogs: Record<string, DialogDef>;
  clues: Record<string, ClueDef>;
  deductions: Record<string, DeductionDef>;
  timelines: Record<string, TimelineDef>;
  docs: Record<string, DocDef>;
  closeups: Record<string, CloseupDef>;
  chapters: ChapterDef[];
  locations: Record<string, LocationDef>;
  people: Record<string, PersonDef>;
  /** Default responses when nothing specific is defined. */
  defaults: { look: string[]; use: string[]; item: string[]; talk: string[]; combine: string[] };
  start: Script;
  /** Scripts that fire once, after any action, as soon as their condition holds. */
  watch?: { id: string; when: Cond; do: Script }[];
  /** Player sprite by condition (first match), default 'rook'. */
  playerSprite?: [Cond, string][];
}
