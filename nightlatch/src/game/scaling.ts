import type Phaser from 'phaser';
import { settings } from './services';

export const NATIVE_W = 320;
export const NATIVE_H = 180;

/** Integer (pixel-perfect) or fractional nearest-neighbour zoom to fit the window. */
export function applyScaling(game: Phaser.Game) {
  if (!game.canvas) {
    // Phaser builds its canvas when the page has finished parsing; scale once it exists
    game.events.once('ready', () => applyScaling(game));
    return;
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  const fit = Math.min(w / NATIVE_W, h / NATIVE_H);
  const zoom = settings.pixelPerfect ? Math.max(1, Math.floor(fit)) : Math.max(1, fit);
  game.scale.setZoom(zoom);
}

export function fadeAndRun(fn: () => unknown) {
  void fn();
}
