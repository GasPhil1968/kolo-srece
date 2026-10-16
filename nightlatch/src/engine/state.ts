import type { Dir, Val } from './types';

export const SAVE_VERSION = 1;

export interface GameState {
  v: number;
  chapter: number;
  room: string;
  pos: { x: number; y: number; face: Dir };
  inv: string[];
  /** Items held aside while the player is searched/robbed (Ch5, Ch7). */
  stash: string[];
  flags: Record<string, Val>;
  clues: string[];
  deds: string[];
  people: string[];
  map: string[];
  seen: string[];
  visited: string[];
  read: string[];
  /** NPC overrides set by {npc} steps: id -> {room, at, face} or hidden. */
  npcs: Record<string, { room: string; at: string; face?: Dir } | null>;
  hintTier: Record<string, number>;
  time: number;
  rng: number;
  ended: boolean;
  /** Monotonic counter of performed actions (for stats). */
  actions: number;
}

export function newState(): GameState {
  return {
    v: SAVE_VERSION,
    chapter: 0,
    room: '',
    pos: { x: 160, y: 120, face: 'down' },
    inv: [],
    stash: [],
    flags: {},
    clues: [],
    deds: [],
    people: [],
    map: [],
    seen: [],
    visited: [],
    read: [],
    npcs: {},
    hintTier: {},
    time: 0,
    rng: 0x9e3779b9,
    ended: false,
    actions: 0,
  };
}

export function cloneState(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s));
}

export function serialize(s: GameState): string {
  return JSON.stringify(s);
}

/** Parse and validate a saved state. Throws on corrupt data. */
export function deserialize(json: string): GameState {
  const raw = JSON.parse(json);
  if (!raw || typeof raw !== 'object') throw new Error('save: not an object');
  if (raw.v !== SAVE_VERSION) throw new Error(`save: version ${raw.v} unsupported`);
  const base = newState();
  const s: GameState = { ...base, ...raw };
  const arrays: (keyof GameState)[] = ['inv', 'stash', 'clues', 'deds', 'people', 'map', 'seen', 'visited', 'read'];
  for (const k of arrays) {
    if (!Array.isArray(s[k])) throw new Error(`save: ${String(k)} is not an array`);
  }
  if (typeof s.room !== 'string' || typeof s.chapter !== 'number') throw new Error('save: bad room/chapter');
  if (!s.pos || typeof s.pos.x !== 'number' || typeof s.pos.y !== 'number') s.pos = base.pos;
  if (!s.flags || typeof s.flags !== 'object') throw new Error('save: bad flags');
  if (!s.npcs || typeof s.npcs !== 'object') s.npcs = {};
  if (!s.hintTier || typeof s.hintTier !== 'object') s.hintTier = {};
  return s;
}

/** Deterministic xorshift32 stored in the state, so playthroughs are reproducible. */
export function rand(s: GameState): number {
  let x = s.rng | 0 || 0x12345678;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  s.rng = x >>> 0;
  return (s.rng % 1_000_000) / 1_000_000;
}

export function addUnique(arr: string[], v: string): boolean {
  if (arr.includes(v)) return false;
  arr.push(v);
  return true;
}
