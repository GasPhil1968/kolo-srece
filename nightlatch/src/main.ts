import Phaser from 'phaser';
import { BootScene } from './game/boot';
import { ctl } from './game/controller';
import { HudScene } from './game/HudScene';
import { IntroScene } from './game/intro';
import { EndScene, MapScene, MenuScene, TitleScene } from './game/menus';
import { NotebookScene } from './game/notebook';
import { CloseupScene, DocScene } from './game/overlays';
import { ChapterIntroScene, ChapterOutroScene } from './game/cinema';
import { RoomScene } from './game/RoomScene';
import { applyScaling } from './game/scaling';
import { fitCamera, RES } from './game/res';
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
  width: 320 * RES,
  height: 180 * RES,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  backgroundColor: '#000000',
  disableContextMenu: true,
  scale: { mode: Phaser.Scale.NONE, zoom: 2 },
  audio: { disableWebAudio: false },
  input: { mouse: { preventDefaultWheel: true }, touch: !isTouch }, // touches arrive as mouse events (touch.ts)
  fps: { target: 60 },
  scene: [BootScene, IntroScene, TitleScene, RoomScene, HudScene, NotebookScene, MapScene, MenuScene, DocScene, CloseupScene,
    ChapterIntroScene, ChapterOutroScene, EndScene],
});

ctl.phaser = game;
// every scene but the room keeps the 320 x 180 layout through its camera (the room sets its own)
game.events.once(Phaser.Core.Events.READY, () => {
  for (const s of game.scene.scenes) {
    if (s.sys.settings.key === 'room') continue;
    s.events.on(Phaser.Scenes.Events.CREATE, () => fitCamera(s));
  }
});
applyScaling(game);
if (isTouch) {
  // Phaser maps touches through the canvas's box and a scale it only recomputes on refresh()
  let box = '';
  const refreshBox = () => {
    const r = game.canvas.getBoundingClientRect();
    const k = `${r.left},${r.top},${r.width},${r.height}`;
    if (k !== box) {
      box = k;
      game.scale.refresh();
    }
  };
  game.events.once(Phaser.Core.Events.READY, () => installTouch(game.canvas, refreshBox));
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
// fast-forward while Shift is held: lines end at once and walking is ten times as fast
const ffMarker = document.createElement('div');
ffMarker.textContent = '>>';
ffMarker.style.cssText = 'position:fixed;top:6px;right:10px;color:#e8d8a8;font:bold 16px monospace;display:none;z-index:20;pointer-events:none';
document.body.appendChild(ffMarker);
const setFastForward = (on: boolean) => {
  if (ctl.fastForward === on) return;
  ctl.fastForward = on;
  ffMarker.style.display = on ? 'block' : 'none';
  if (on) ctl.presenter?.skip();
};
window.addEventListener('keydown', (e) => e.key === 'Shift' && setFastForward(true));
window.addEventListener('keyup', (e) => e.key === 'Shift' && setFastForward(false));
window.addEventListener('blur', () => setFastForward(false));
installTestHooks(game);

// play-time clock
setInterval(() => {
  if (ctl.game && !document.hidden) ctl.game.state.time += 1;
}, 1000);
