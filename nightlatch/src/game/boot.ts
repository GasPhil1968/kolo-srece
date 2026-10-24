import Phaser from 'phaser';
import { charMetas } from './actor';
import { asset } from './assets';
import type { AssetManifest, CharMeta, RoomMeta } from './meta';
import { roomMetas } from './RoomScene';
import type { AudioManifest } from './services';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    this.load.json('manifest', asset('assets/manifest.json'));
    this.load.json('audioManifest', asset('assets/audio/manifest.json'));
    this.load.json('chapterStarts', asset('assets/chapter_starts.json'));
    this.load.bitmapFont('nl', asset('assets/fonts/nl.png'), asset('assets/fonts/nl.xml'));
    this.load.bitmapFont('nlo', asset('assets/fonts/nlo.png'), asset('assets/fonts/nlo.xml'));
  }

  create() {
    const man = this.cache.json.get('manifest') as AssetManifest & { docs?: string[] };
    const bar = this.add.rectangle(60, 100, 0, 3, 0xb9a77a).setOrigin(0, 0.5);
    this.add.rectangle(60, 100, 200, 3, 0x2a2418).setOrigin(0, 0.5).setDepth(-1);
    const label = this.add.bitmapText(160, 86, 'nlo', 'NIGHT LATCH').setOrigin(0.5).setTint(0xb9a77a);
    void label;
    this.load.on('progress', (v: number) => bar.setSize(200 * v, 3));
    this.load.atlas('ui', asset('assets/ui/ui.png'), asset('assets/ui/ui.json'));
    this.load.atlas('items', asset('assets/ui/items.png'), asset('assets/ui/items.json'));
    this.load.image('map', asset('assets/ui/map.png'));
    this.load.image('title', asset('assets/ui/title.png'));
    this.load.image('title_logo', asset('assets/ui/title_logo.png'));
    this.load.text('credits', asset('assets/credits.txt'));
    for (const r of man.rooms) this.load.json('room:' + r, asset(`assets/rooms/${r}/room.json`));
    for (const c of man.chars) this.load.json('char:' + c, asset(`assets/chars/${c}.json`));
    for (const d of man.docs ?? []) this.load.image('docimg:' + d, asset(`assets/docs/${d}.png`));
    const am = this.cache.json.get('audioManifest') as AudioManifest | undefined;
    if (am) {
      for (const [id, e] of Object.entries(am.sfx)) this.load.audio('sfx:' + id, asset('assets/audio/' + e.file));
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
        this.load.spritesheet(`char:${c}@${Math.round(sz.k * 100)}`, asset('assets/' + sz.file), {
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
