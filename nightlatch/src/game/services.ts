// Settings, save slots and audio — browser-side services.
import Phaser from 'phaser';
import { deserialize, serialize, type GameState } from '../engine/state';

// --------------------------------------------------------------------- settings ----
export interface Settings {
  music: number;
  sfx: number;
  textSpeed: number; // 0.6 slow, 1 normal, 1.6 fast
  pixelPerfect: boolean;
  hints: boolean;
}

const SETTINGS_KEY = 'nightlatch.settings';
export const settings: Settings = { music: 0.7, sfx: 0.8, textSpeed: 1, pixelPerfect: true, hints: true };

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) Object.assign(settings, JSON.parse(raw));
  } catch {
    /* storage unavailable */
  }
}

export function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------------------------ saves ----
export interface SaveMeta {
  slot: string;
  label: string;
  chapter: number;
  room: string;
  date: number;
  time: number;
}

const PREFIX = 'nightlatch.save.';
const memoryStore = new Map<string, string>();

function storeGet(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return memoryStore.get(k) ?? null;
  }
}

function storeSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {
    memoryStore.set(k, v);
  }
}

function storeDel(k: string) {
  try {
    localStorage.removeItem(k);
  } catch {
    memoryStore.delete(k);
  }
}

export const SLOTS = ['auto', '1', '2', '3', '4', '5', '6'];

export function writeSave(slot: string, state: GameState, label: string, roomName: string) {
  const meta: SaveMeta = { slot, label, chapter: state.chapter, room: roomName, date: Date.now(), time: state.time };
  storeSet(PREFIX + slot, JSON.stringify({ meta, state: serialize(state) }));
}

export function readSaveMeta(slot: string): SaveMeta | null {
  const raw = storeGet(PREFIX + slot);
  if (!raw) return null;
  try {
    return JSON.parse(raw).meta as SaveMeta;
  } catch {
    return null;
  }
}

export function readSave(slot: string): GameState | null {
  const raw = storeGet(PREFIX + slot);
  if (!raw) return null;
  try {
    return deserialize(JSON.parse(raw).state);
  } catch (e) {
    console.warn('corrupt save', slot, e);
    return null;
  }
}

export function deleteSave(slot: string) {
  storeDel(PREFIX + slot);
}

export function latestSave(): string | null {
  let best: SaveMeta | null = null;
  for (const s of SLOTS) {
    const m = readSaveMeta(s);
    if (m && (!best || m.date > best.date)) best = m;
  }
  return best?.slot ?? null;
}

// ------------------------------------------------------------------------ audio ----
interface AudioEntry {
  file: string;
  duration?: number;
  loop?: boolean;
  volume?: number;
}
export interface AudioManifest {
  music: Record<string, AudioEntry>;
  amb: Record<string, AudioEntry>;
  sfx: Record<string, AudioEntry>;
}

export class AudioDirector {
  manifest: AudioManifest = { music: {}, amb: {}, sfx: {} };
  private scene!: Phaser.Scene;
  private current: Record<'music' | 'amb', { id: string; snd: Phaser.Sound.BaseSound | null } | null> = {
    music: null,
    amb: null,
  };
  private pending: Record<'music' | 'amb', string | null> = { music: null, amb: null };
  private ducked = 1;

  attach(scene: Phaser.Scene, manifest: AudioManifest | undefined) {
    this.scene = scene;
    if (manifest) this.manifest = manifest;
  }

  private base(kind: 'music' | 'amb', id: string) {
    const e = this.manifest[kind][id];
    const v = e?.volume ?? 0.8;
    return v * (kind === 'music' ? settings.music : settings.sfx * 0.9) * (kind === 'music' ? this.ducked : 1);
  }

  play(kind: 'music' | 'amb', id: string | null) {
    if (!this.scene) return;
    const cur = this.current[kind];
    if (cur && cur.id === id) return;
    this.pending[kind] = id;
    if (cur?.snd) {
      const snd = cur.snd as Phaser.Sound.WebAudioSound;
      this.scene.tweens.add({ targets: snd, volume: 0, duration: 700, onComplete: () => snd.destroy() });
    }
    this.current[kind] = id ? { id, snd: null } : null;
    if (!id) return;
    const entry = this.manifest[kind][id];
    if (!entry) return;
    const key = `${kind}:${id}`;
    const start = () => {
      if (this.pending[kind] !== id || this.current[kind]?.id !== id) return;
      if (!this.scene.cache.audio.exists(key)) return;
      const snd = this.scene.sound.add(key, { loop: entry.loop !== false, volume: 0 });
      snd.play();
      this.current[kind] = { id, snd };
      this.scene.tweens.add({ targets: snd, volume: this.base(kind, id), duration: 900 });
    };
    if (this.scene.cache.audio.exists(key)) start();
    else {
      this.scene.load.audio(key, 'assets/audio/' + entry.file);
      this.scene.load.once(`filecomplete-audio-${key}`, start);
      this.scene.load.start();
    }
  }

  sfx(id: string, volume = 1) {
    if (!this.scene) return;
    const entry = this.manifest.sfx[id];
    const key = `sfx:${id}`;
    if (!entry || !this.scene.cache.audio.exists(key)) return;
    this.scene.sound.play(key, { volume: (entry.volume ?? 0.8) * settings.sfx * volume });
  }

  footstep(floor: string) {
    const n = 1 + Math.floor(Math.random() * 3);
    this.sfx(`footstep_${floor}_${n}`, 0.55);
  }

  duck(on: boolean) {
    this.ducked = on ? 0.45 : 1;
    this.refreshVolumes();
  }

  refreshVolumes() {
    for (const kind of ['music', 'amb'] as const) {
      const c = this.current[kind];
      if (c?.snd) (c.snd as Phaser.Sound.WebAudioSound).setVolume(this.base(kind, c.id));
    }
  }

  stopAll() {
    this.play('music', null);
    this.play('amb', null);
  }
}

export const audio = new AudioDirector();
