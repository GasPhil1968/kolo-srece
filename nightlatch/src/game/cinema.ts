// Animated chapter openings and endings. Each chapter opens over the locked room it starts in,
// with that room's weather or light, and ends on a line about what the chapter settled.
import Phaser from 'phaser';
import { fog, flicker, rain, smoke, type Effect } from './ambience';
import { CHAPTERS } from '../content/chapters';
import { ctl } from './controller';
import { Overlay } from './overlays';
import { audio, settings } from './services';
import { t } from '../i18n';

/** The locked room each chapter opens in (texture keys 'tbg:<room>'). */
export const OPENING_ROOMS = ['hotel_room', 'cold_store', 'darkroom', 'halcyon_cell', 'holding_cell', 'lantern_cellar',
  'calypso_hold', 'radio_booth'];

/** What each chapter settles, for its ending card. */
export const CHAPTER_ENDINGS: Record<number, string> = {
  1: 'Deacon kept his promise. The proof is on ice at Pier 9.',
  2: 'Lethe. Six days switched off, and a reporter who forgot his own name.',
  3: 'There is no sister. The woman who hired me works at Halcyon House.',
  4: 'Halcyon keeps a file on me, and Room 8 has been mine before.',
  5: 'The hatch was locked. Frank Delaney wrote that it was open.',
  6: 'I hid Nora from everyone, myself included. She was safe the whole time.',
  7: 'The Calypso is meant to sink, the way the Meridian burned.',
  8: 'Brackwater heard it on the air. No more locked rooms.',
};

const WORDS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];

/** The room's own atmosphere: rain at the window, cold mist, a red safelight, a ship that rocks... */
function atmosphere(scene: Phaser.Scene, n: number, bg: Phaser.GameObjects.Image): Effect[] {
  const calm = settings.reduceMotion;
  switch (n) {
    case 1: return [rain(scene, 50, 5, 0.22), flicker(scene, 0xffc070, 0.05)];
    case 2: return [fog(scene, 60, 170, 1.6)];
    case 3: return [flicker(scene, 0xff2020, 0.1)];
    case 4: return [fog(scene, 90, 170, 0.8), flicker(scene, 0xc0e0ff, 0.04)];
    case 5: return [flicker(scene, 0x8090a0, 0.03)];
    case 6: return [smoke(scene, [[90, 140], [200, 136], [260, 142]])];
    case 7:
      if (!calm) scene.tweens.add({ targets: bg, y: bg.y + 2.5, angle: 0.6, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return [fog(scene, 100, 170, 1)];
    default: return [flicker(scene, 0xff3030, 0.06)];
  }
}

/** The opening room as a backdrop: darkened, drifting slowly closer. */
function backdrop(scene: Phaser.Scene, n: number, dim: number, push: number, ms: number) {
  const bg = scene.add.image(160, 90, 'tbg:' + OPENING_ROOMS[n - 1]).setScale(1.25).setAlpha(0);
  scene.add.rectangle(0, 0, 320, 180, 0x000000, dim).setOrigin(0, 0).setDepth(9);
  scene.tweens.add({ targets: bg, alpha: 1, duration: 900 });
  if (!settings.reduceMotion) scene.tweens.add({ targets: bg, scale: 1.25 + push, duration: ms, ease: 'Sine.easeInOut' });
  return bg;
}

/** Text with a dark shadow, faded in after a delay. */
function line(scene: Phaser.Scene, x: number, y: number, text: string, tint: number, delay: number, scale = 1, width = 280) {
  const objs = [0x000000, tint].map((c, i) =>
    scene.add.bitmapText(x + (i ? 0 : 1), y + (i ? 0 : 1), 'nlo', text).setOrigin(0.5).setCenterAlign().setMaxWidth(width)
      .setScale(scale).setTint(c).setDepth(20).setAlpha(0));
  scene.tweens.add({ targets: objs, alpha: 1, duration: 700, delay });
  return objs;
}

// ----------------------------------------------------------------- chapter opening ----
export class ChapterIntroScene extends Overlay {
  private info!: { title: string; sub?: string; chapter?: number };
  private effects: Effect[] = [];
  constructor() {
    super('card');
  }
  init(data: { title: string; sub?: string; chapter?: number; onClose?: () => void }) {
    super.init(data);
    this.info = data;
  }
  update(_t: number, dt: number) {
    for (const e of this.effects) e.update(dt);
  }
  create() {
    this.effects = [];
    const n = this.info.chapter ?? ctl.game?.state.chapter ?? 0;
    const click = this.add.rectangle(0, 0, 320, 180, 0x000000, 1).setOrigin(0, 0).setInteractive().setDepth(0);
    audio.play('music', null);
    audio.sfx('chapter');
    if (ctl.fast && ctl.autoOverlays) {
      this.time.delayedCall(10, () => this.close());
      return;
    }
    // translated whole, then split: the heading and the name are one entry in the German text
    const lines = t(this.info.title).split('\n');
    const MS = 5600;
    if (n >= 1 && n <= 8 && this.textures.exists('tbg:' + OPENING_ROOMS[n - 1])) {
      const bg = backdrop(this, n, 0.5, 0.08, MS);
      this.effects = atmosphere(this, n, bg);
    }
    line(this, 160, 62, lines[0], 0x9a8a6a, 300);
    // the title comes up letter by letter
    const title = lines[1] ?? '';
    const big = this.add.bitmapText(160, 84, 'nlo', '').setOrigin(0.5).setScale(2).setTint(0xe8d8a8).setDepth(20);
    const shadow = this.add.bitmapText(161, 85, 'nlo', '').setOrigin(0.5).setScale(2).setTint(0x000000).setDepth(19);
    const shown = { k: 0 };
    this.tweens.add({
      targets: shown, k: title.length, duration: Math.max(500, title.length * 70), delay: 900,
      onUpdate: () => {
        const s = title.slice(0, Math.round(shown.k));
        big.setText(s);
        shadow.setText(s);
      },
    });
    // a rule draws out under it, like a line under a case name
    const rule = this.add.rectangle(160, 100, 150, 1, 0xb9a77a, 0.9).setDepth(20).setScale(0, 1);
    this.tweens.add({ targets: rule, scaleX: 1, duration: 800, delay: 1500, ease: 'Sine.easeOut' }); // grows from the middle
    line(this, 160, 114, this.info.sub ?? '', 0x8a7a60, 1900, 1, 260);
    const done = () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.close());
    };
    const timer = this.time.delayedCall(MS, done);
    click.on('pointerdown', () => {
      timer.remove();
      done();
    });
  }
}

// ------------------------------------------------------------------ chapter ending ----
export class ChapterOutroScene extends Overlay {
  private n = 1;
  private effects: Effect[] = [];
  constructor() {
    super('outro');
  }
  init(data: { chapter: number; onClose?: () => void }) {
    super.init(data);
    this.n = data.chapter;
  }
  update(_t: number, dt: number) {
    for (const e of this.effects) e.update(dt);
  }
  create() {
    this.effects = [];
    const n = this.n;
    const def = CHAPTERS.find((c) => c.n === n);
    const click = this.add.rectangle(0, 0, 320, 180, 0x000000, 1).setOrigin(0, 0).setInteractive().setDepth(0);
    if (ctl.fast && ctl.autoOverlays) {
      this.time.delayedCall(10, () => this.close());
      return;
    }
    const MS = 5800;
    this.cameras.main.fadeIn(500, 0, 0, 0);
    if (this.textures.exists('tbg:' + OPENING_ROOMS[n - 1])) {
      // the room the chapter began in, drawn back from, as if the door has finally closed behind him
      const bg = backdrop(this, n, 0.65, -0.12, MS);
      bg.setScale(1.37);
      this.effects = atmosphere(this, n, bg);
    }
    line(this, 160, 58, `END OF CHAPTER ${WORDS[n - 1] ?? n}`, 0x9a8a6a, 200);
    line(this, 160, 76, def?.title ?? '', 0xe8d8a8, 600, 2);
    const rule = this.add.rectangle(160, 92, 150, 1, 0xb9a77a, 0.9).setDepth(20);
    this.tweens.add({ targets: rule, scaleX: 0, duration: 900, delay: MS - 1600, ease: 'Sine.easeIn' });
    line(this, 160, 112, CHAPTER_ENDINGS[n] ?? '', 0xd9c9a0, 1400, 1, 260);
    const done = () => {
      this.cameras.main.fadeOut(700, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.close());
    };
    const timer = this.time.delayedCall(MS, done);
    click.on('pointerdown', () => {
      timer.remove();
      done();
    });
  }
}
