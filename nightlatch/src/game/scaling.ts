import { RES } from './res';
import { isRotated, isTouch } from './touch';
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
  // played rotated, the picture's width runs along the screen's height
  const w = isRotated() ? window.innerHeight : window.innerWidth;
  const h = isRotated() ? window.innerWidth : window.innerHeight;
  const fit = Math.min(w / NATIVE_W, h / NATIVE_H);
  // touch screens are small: fill them, even without whole-number pixels
  const zoom = settings.pixelPerfect && !isTouch ? Math.max(1, Math.floor(fit)) : Math.max(1, fit);
  game.scale.setZoom(zoom / RES);
  game.scale.refresh();
}

export function fadeAndRun(fn: () => unknown) {
  void fn();
}
