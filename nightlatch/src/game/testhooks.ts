// Hooks for automated browser tests (Playwright). Harmless in normal play.
import type Phaser from 'phaser';
import type { Action } from '../engine/game';
import { deserialize, serialize } from '../engine/state';
import { ctl } from './controller';

export function installTestHooks(game: Phaser.Game) {
  window.__NL = {
    ctl,
    ready: () => !!game.scene.getScene('title') && game.scene.isActive('title'),
    inGame: () => !!ctl.game && game.scene.isActive('room'),
    setFast: (v: boolean) => {
      ctl.fast = v;
    },
    state: () => (ctl.game ? JSON.parse(serialize(ctl.game.state)) : null),
    perform: (a: Action) => ctl.game.perform(a),
    busy: () => (ctl.game ? ctl.game.busy : 0),
    errors: () => (ctl.game ? ctl.game.errors : []),
    room: () => (ctl.game ? ctl.game.state.room : ''),
    loadState: async (json: string) => {
      const st = deserialize(json);
      const title = game.scene.getScene('title') as unknown as { launchGame(s: unknown): Promise<void> };
      await title.launchGame(st);
    },
    newGame: async () => {
      const title = game.scene.getScene('title') as unknown as { launchGame(s?: unknown): Promise<void> };
      await title.launchGame();
    },
  };
}
