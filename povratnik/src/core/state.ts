// The one authoritative, serializable game state. Everything a save needs, nothing transient.

export const SAVE_VERSION = 1;

export type Facing = 1 | -1;
export type FlagValue = boolean | number | string;

export interface ActorPlacement {
  /** Sprite character key (e.g. 'mijo1476'). */
  character: string;
  room: string | null;
  x: number;
  y: number;
  facing: Facing;
  /** Persistent resting pose ('stand', 'sit', 'lie', ...). Transient script poses are not saved. */
  pose: string;
  hidden: boolean;
  /** Walking animation when not the default 'walk' (e.g. 'weary' on the way home in 1476). */
  gait?: string;
}

export interface GameState {
  version: number;
  chapter: string;
  room: string;
  /** The player character is always actor 'pc'; its character key changes with the period. */
  actors: Record<string, ActorPlacement>;
  flags: Record<string, FlagValue>;
  inventory: string[];
  /** Ids of dialogue options / lines already used, looked-at hotspots etc. */
  seen: Record<string, true>;
  /** Journal entry id -> 'open' | 'done', in insertion order. */
  journal: Record<string, 'open' | 'done'>;
  hintLevels: Record<string, number>;
  /** Chapters the player has reached (for the chapter menu). */
  reached: string[];
  /** Resumable sequence to restart after loading (set by checkpoint commands). */
  resume: string | null;
  /** Play time in seconds (counted only while the game runs and is visible). */
  playTime: number;
}

export function emptyState(): GameState {
  return {
    version: SAVE_VERSION,
    chapter: '',
    room: '',
    actors: {},
    flags: {},
    inventory: [],
    seen: {},
    journal: {},
    hintLevels: {},
    reached: [],
    resume: null,
    playTime: 0,
  };
}

export function cloneState(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s)) as GameState;
}

/** Structural validation of untrusted save data. Returns an error message or null. */
export function validateStateShape(x: unknown): string | null {
  if (!x || typeof x !== 'object') return 'kein Objekt';
  const s = x as Record<string, unknown>;
  if (s.version !== SAVE_VERSION) return `unbekannte Version ${String(s.version)}`;
  if (typeof s.chapter !== 'string' || typeof s.room !== 'string') return 'Kapitel/Raum fehlt';
  if (!s.actors || typeof s.actors !== 'object') return 'Figuren fehlen';
  for (const [id, a] of Object.entries(s.actors as Record<string, unknown>)) {
    const p = a as Record<string, unknown>;
    if (!p || typeof p !== 'object') return `Figur ${id} defekt`;
    if (typeof p.x !== 'number' || typeof p.y !== 'number' || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return `Figur ${id}: Position defekt`;
    if (p.facing !== 1 && p.facing !== -1) return `Figur ${id}: Blickrichtung defekt`;
    if (typeof p.character !== 'string' || typeof p.pose !== 'string') return `Figur ${id}: Daten defekt`;
    if (p.room !== null && typeof p.room !== 'string') return `Figur ${id}: Raum defekt`;
  }
  if (!s.flags || typeof s.flags !== 'object') return 'Zustände fehlen';
  if (!Array.isArray(s.inventory) || !s.inventory.every((i) => typeof i === 'string')) return 'Inventar defekt';
  if (!s.seen || typeof s.seen !== 'object') return 'Verlauf fehlt';
  if (!s.journal || typeof s.journal !== 'object') return 'Journal fehlt';
  if (!s.hintLevels || typeof s.hintLevels !== 'object') return 'Hinweise fehlen';
  if (!Array.isArray(s.reached)) return 'Kapitelliste fehlt';
  if (s.resume !== null && typeof s.resume !== 'string') return 'Fortsetzung defekt';
  if (typeof s.playTime !== 'number') return 'Spielzeit fehlt';
  return null;
}
