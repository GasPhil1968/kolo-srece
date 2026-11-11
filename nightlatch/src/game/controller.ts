// Glue between the logic Game and the Phaser scenes.
import type Phaser from 'phaser';
import { Game } from '../engine/game';
import { newState, type GameState } from '../engine/state';
import { CONTENT } from '../content';
import { RuntimePresenter } from './presenter';
import { markChapterPlayed, updateSaveMeta, writeSave } from './services';
import { RES } from './res';
import { isTouch } from './touch';

export const ctl = {
  game: null as unknown as Game,
  presenter: null as unknown as RuntimePresenter,
  phaser: null as unknown as Phaser.Game,
  /** Wall-clock play time accounting */
  lastTick: 0,
  /** Item currently held as the cursor */
  heldItem: null as string | null,
  inputLocked: 0,
  /** Fast mode for automated browser tests: skips waits/tweens. */
  fast: false,
  /** In fast mode, close cards/documents/close-ups by themselves (off when a test clicks them). */
  autoOverlays: true,
  /** Walking speed multiplier (browser tests walk faster). */
  walkMul: 1,
  /** Fast-forward is held (Shift): lines end at once, walking runs ten times as fast. */
  fastForward: false,
  /** Played with a touch screen: tap / hold instead of left / right click. */
  touch: isTouch,

  newGame(state?: GameState) {
    this.presenter = this.presenter ?? new RuntimePresenter();
    this.game = new Game(CONTENT, this.presenter, state ?? newState());
    this.heldItem = null;
    return this.game;
  },

  roomName(id?: string): string {
    const rid = id ?? ctl.game.state.room;
    return CONTENT.rooms[rid]?.name ?? rid;
  },

  /** A small picture of the room, taken a moment after it was entered, for the save slots. */
  thumb: '' as string,
  captureThumb() {
    const r = this.phaser?.renderer as unknown as { snapshotArea?(x: number, y: number, w: number, h: number, cb: (img: unknown) => void): void };
    if (!r?.snapshotArea) return;
    try {
      r.snapshotArea(0, 0, 320 * RES, 144 * RES, (img) => {
        if (!(img instanceof HTMLImageElement)) return;
        const c = document.createElement('canvas');
        c.width = 80;
        c.height = 36;
        const g = c.getContext('2d');
        if (!g) return;
        g.drawImage(img, 0, 0, 80, 36);
        this.thumb = c.toDataURL('image/png');
      });
    } catch {
      /* no picture this time */
    }
  },

  save(slot: string, label?: string) {
    const s = this.game.state;
    markChapterPlayed(s.chapter);
    writeSave(slot, s, label ?? `Chapter ${s.chapter} — ${this.roomName()}`, this.roomName());
    if (this.thumb) updateSaveMeta(slot, { thumb: this.thumb });
  },
};

declare global {
  interface Window {
    __NL?: unknown;
  }
}
