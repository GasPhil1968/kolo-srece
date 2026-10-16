// Browser persistence for saves and settings (localStorage). All access is guarded: private
// browsing or a full quota degrade to "not saved" messages, never to a crash.
import type { GameState } from '../core/state';
import type { Settings } from '../core/engine';

export const SLOT_IDS = ['auto', 's1', 's2', 's3', 's4', 's5', 's6'] as const;
export type SlotId = (typeof SLOT_IDS)[number];

export interface SaveMeta {
  slot: SlotId;
  chapter: string;
  chapterTitle: string;
  roomTitle: string;
  savedAt: number;
  playTime: number;
  /** True if the save captured the last checkpoint instead of the live moment. */
  checkpoint: boolean;
}

export interface SaveFile {
  meta: SaveMeta;
  state: GameState;
}

const PREFIX = 'povratnik.v8.';

export interface Store {
  read(key: string): string | null;
  write(key: string, value: string): boolean;
  remove(key: string): void;
}

export const browserStore: Store = {
  read(key) {
    try {
      return window.localStorage.getItem(PREFIX + key);
    } catch {
      return null;
    }
  },
  write(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  },
};

export function memoryStore(): Store {
  const m = new Map<string, string>();
  return {
    read: (k) => m.get(k) ?? null,
    write: (k, v) => {
      m.set(k, v);
      return true;
    },
    remove: (k) => {
      m.delete(k);
    },
  };
}

export class Saves {
  constructor(private store: Store) {}

  write(file: SaveFile): boolean {
    return this.store.write(`save.${file.meta.slot}`, JSON.stringify(file));
  }

  read(slot: SlotId): SaveFile | { error: string } | null {
    const raw = this.store.read(`save.${slot}`);
    if (!raw) return null;
    try {
      const f = JSON.parse(raw) as SaveFile;
      if (!f || typeof f !== 'object' || !f.meta || !f.state) return { error: 'Spielstand beschädigt' };
      return f;
    } catch {
      return { error: 'Spielstand beschädigt' };
    }
  }

  remove(slot: SlotId): void {
    this.store.remove(`save.${slot}`);
  }

  list(): { slot: SlotId; file: SaveFile | null; error?: string }[] {
    return SLOT_IDS.map((slot) => {
      const r = this.read(slot);
      if (r && 'error' in r) return { slot, file: null, error: r.error };
      return { slot, file: r };
    });
  }

  latest(): SaveFile | null {
    let best: SaveFile | null = null;
    for (const e of this.list()) if (e.file && (!best || e.file.meta.savedAt > best.meta.savedAt)) best = e.file;
    return best;
  }
}

export function loadSettings(store: Store, defaults: Settings): Settings {
  const raw = store.read('settings');
  if (!raw) return { ...defaults };
  try {
    const s = JSON.parse(raw) as Partial<Settings>;
    const out = { ...defaults };
    if (typeof s.textSpeed === 'number' && s.textSpeed >= 0.4 && s.textSpeed <= 2) out.textSpeed = s.textSpeed;
    if (typeof s.autoAdvance === 'boolean') out.autoAdvance = s.autoAdvance;
    if (typeof s.reducedMotion === 'boolean') out.reducedMotion = s.reducedMotion;
    if (typeof s.reducedFlash === 'boolean') out.reducedFlash = s.reducedFlash;
    if (typeof s.relaxedCombat === 'boolean') out.relaxedCombat = s.relaxedCombat;
    return out;
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(store: Store, s: Settings): void {
  store.write('settings', JSON.stringify(s));
}
