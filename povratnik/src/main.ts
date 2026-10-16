// Boot: engine (logic), Phaser scene (renderer), DOM interface (text and controls).
import Phaser from 'phaser';
import './ui/styles.css';
import { DEFAULT_SETTINGS, Engine, indexContent } from './core/engine';
import { CHAPTERS, COMBATS } from './content/chapters';
import { engineMeta } from './content/assets';
import { GameScene, R, VIEW_H, VIEW_W } from './view/scene';
import { GameUI } from './ui/ui';
import { browserStore, loadSettings, Saves } from './platform/storage';

declare global {
  interface Window {
    __pov?: { engine: Engine; ui: GameUI; scene: GameScene; game: Phaser.Game };
  }
}

const store = browserStore;
const settings = loadSettings(store, DEFAULT_SETTINGS);
const engine = new Engine(indexContent(CHAPTERS, COMBATS), engineMeta(), settings);
const scene = new GameScene();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'canvas-host',
  width: VIEW_W * R,
  height: 600 * R,
  zoom: 1 / R,
  backgroundColor: '#000000',
  banner: false,
  disableContextMenu: true,
  render: { antialias: true, pixelArt: false, roundPixels: false, powerPreference: 'high-performance' },
  scale: { mode: Phaser.Scale.NONE },
  input: { touch: true, mouse: true, keyboard: false, gamepad: false },
  fps: { target: 60, smoothStep: true },
  scene: [],
});

let ui: GameUI;
game.events.once(Phaser.Core.Events.READY, () => {
  ui = new GameUI(engine, scene, new Saves(store), store, () => {
    engine.settings = { ...engine.settings };
  });
  game.scene.add('game', scene, true, { engine, hooks: ui });
  window.__pov = { engine, ui, scene, game };
  ui.fit();
  ui.menus.openTitle();
  void VIEW_H;
});
