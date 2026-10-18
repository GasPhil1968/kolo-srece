import Phaser from 'phaser';
import { BootScene } from './game/boot';
import { ctl } from './game/controller';
import { HudScene } from './game/HudScene';
import { EndScene, MapScene, MenuScene, TitleScene } from './game/menus';
import { NotebookScene } from './game/notebook';
import { CardScene, CloseupScene, DocScene } from './game/overlays';
import { RoomScene } from './game/RoomScene';
import { applyScaling } from './game/scaling';
import { loadSettings } from './game/services';
import { installTestHooks } from './game/testhooks';
import { t } from './i18n';
import { installTouch, isTouch } from './game/touch';

loadSettings();

// Every on-screen text goes through the translator (BitmapText's constructor uses setText too).
const textProto = Phaser.GameObjects.BitmapText.prototype as unknown as { setText(v: string | string[]): unknown };
const setTextRaw = textProto.setText;
textProto.setText = function (this: unknown, v: string | string[]) {
  return setTextRaw.call(this, Array.isArray(v) ? v.map(t) : typeof v === 'string' ? t(v) : v);
};

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 320,
  height: 180,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  backgroundColor: '#000000',
  disableContextMenu: true,
  scale: { mode: Phaser.Scale.NONE, zoom: 4 },
  audio: { disableWebAudio: false },
  input: { mouse: { preventDefaultWheel: true }, touch: !isTouch }, // touches arrive as mouse events (touch.ts)
  fps: { target: 60 },
  scene: [BootScene, TitleScene, RoomScene, HudScene, NotebookScene, MapScene, MenuScene, DocScene, CloseupScene,
    CardScene, EndScene],
});

ctl.phaser = game;
applyScaling(game);
if (isTouch) {
  game.events.once(Phaser.Core.Events.READY, () => installTouch(game.canvas));
  // phones: go fullscreen and landscape with the first touch
  document.addEventListener('touchend', () => {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    try {
      const p = el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.();
      Promise.resolve(p).then(() => (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock?.('landscape')).catch(() => {});
    } catch { /* not allowed here */ }
  }, { once: true });
}
window.addEventListener('resize', () => applyScaling(game));
installTestHooks(game);

// play-time clock
setInterval(() => {
  if (ctl.game && !document.hidden) ctl.game.state.time += 1;
}, 1000);
