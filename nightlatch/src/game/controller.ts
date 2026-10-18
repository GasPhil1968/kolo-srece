// Glue between the logic Game and the Phaser scenes.
import type Phaser from 'phaser';
import { Game } from '../engine/game';
import { newState, type GameState } from '../engine/state';
import { CONTENT } from '../content';
import { RuntimePresenter } from './presenter';
import { writeSave } from './services';
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

  save(slot: string, label?: string) {
    const s = this.game.state;
    writeSave(slot, s, label ?? `Chapter ${s.chapter} — ${this.roomName()}`, this.roomName());
  },
};

declare global {
  interface Window {
    __NL?: unknown;
  }
}
