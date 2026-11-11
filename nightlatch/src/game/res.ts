// The picture is rendered at twice the rooms' pixel resolution (640 x 360). Rooms, interface and
// text keep their 320 x 180 pixel grid through a camera zoom; figures and portraits are drawn at
// twice the density and shown at half scale, so they carry four times the detail.
import type Phaser from 'phaser';

export const RES = 2;
export const VIEW_W = 320;
export const VIEW_FULL_H = 180;

/** Zoom a scene's camera so its world keeps the 320 x 180 layout on the larger canvas. */
export function fitCamera(scene: Phaser.Scene) {
  const cam = scene.cameras.main;
  cam.setViewport(0, 0, VIEW_W * RES, VIEW_FULL_H * RES);
  cam.setZoom(RES);
  cam.centerOn(VIEW_W / 2, VIEW_FULL_H / 2);
}
