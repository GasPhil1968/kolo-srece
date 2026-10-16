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

loadSettings();

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
  input: { mouse: { preventDefaultWheel: true } },
  fps: { target: 60 },
  scene: [BootScene, TitleScene, RoomScene, HudScene, NotebookScene, MapScene, MenuScene, DocScene, CloseupScene,
    CardScene, EndScene],
});

ctl.phaser = game;
applyScaling(game);
window.addEventListener('resize', () => applyScaling(game));
installTestHooks(game);

// play-time clock
setInterval(() => {
  if (ctl.game && !document.hidden) ctl.game.state.time += 1;
}, 1000);
