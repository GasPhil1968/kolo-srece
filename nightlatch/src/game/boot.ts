import Phaser from 'phaser';
import { charMetas } from './actor';
import type { AssetManifest, CharMeta, RoomMeta } from './meta';
import { roomMetas } from './RoomScene';
import type { AudioManifest } from './services';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    this.load.json('manifest', 'assets/manifest.json');
    this.load.json('audioManifest', 'assets/audio/manifest.json');
    this.load.bitmapFont('nl', 'assets/fonts/nl.png', 'assets/fonts/nl.xml');
    this.load.bitmapFont('nlo', 'assets/fonts/nlo.png', 'assets/fonts/nlo.xml');
  }

  create() {
    const man = this.cache.json.get('manifest') as AssetManifest & { docs?: string[] };
    const bar = this.add.rectangle(60, 100, 0, 3, 0xb9a77a).setOrigin(0, 0.5);
    this.add.rectangle(60, 100, 200, 3, 0x2a2418).setOrigin(0, 0.5).setDepth(-1);
    const label = this.add.bitmapText(160, 86, 'nlo', 'NIGHT LATCH').setOrigin(0.5).setTint(0xb9a77a);
    void label;
    this.load.on('progress', (v: number) => bar.setSize(200 * v, 3));
    this.load.atlas('ui', 'assets/ui/ui.png', 'assets/ui/ui.json');
    this.load.atlas('items', 'assets/ui/items.png', 'assets/ui/items.json');
    this.load.image('map', 'assets/ui/map.png');
    this.load.image('title', 'assets/ui/title.png');
    this.load.image('title_logo', 'assets/ui/title_logo.png');
    this.load.text('credits', 'assets/credits.txt');
    for (const r of man.rooms) this.load.json('room:' + r, `assets/rooms/${r}/room.json`);
    for (const c of man.chars) this.load.json('char:' + c, `assets/chars/${c}.json`);
    for (const d of man.docs ?? []) this.load.image('docimg:' + d, `assets/docs/${d}.png`);
    const am = this.cache.json.get('audioManifest') as AudioManifest | undefined;
    if (am) {
      for (const [id, e] of Object.entries(am.sfx)) this.load.audio('sfx:' + id, 'assets/audio/' + e.file);
    }
    this.load.once('complete', () => this.second(man));
    this.load.start();
  }

  private second(man: AssetManifest) {
    for (const r of man.rooms) roomMetas[r] = this.cache.json.get('room:' + r) as RoomMeta;
    for (const c of man.chars) {
      const meta = this.cache.json.get('char:' + c) as CharMeta;
      charMetas[c] = meta;
      for (const sz of meta.sizes) {
        this.load.spritesheet(`char:${c}@${Math.round(sz.k * 100)}`, 'assets/' + sz.file, {
          frameWidth: meta.frameW,
          frameHeight: meta.frameH,
        });
      }
    }
    this.load.once('complete', () => {
      document.getElementById('boot')?.remove();
      this.scene.start('title');
    });
    this.load.start();
  }
}
