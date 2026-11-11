// The animated intro: four short shots before the title screen. Brackwater in the rain, Pier 9
// at night, Room 9 with its lamp, and the street outside the Sorrento where the name comes up.
// A tap or a key skips it; Settings can switch it off.
import Phaser from 'phaser';
import { fog, flicker, glints, rain, type Effect } from './ambience';
import { audio, settings } from './services';

const SHOT_MS = [4500, 6000, 6000, 6500];

export class IntroScene extends Phaser.Scene {
  private effects: Effect[] = [];
  private layer: Phaser.GameObjects.GameObject[] = [];
  private leaving = false;

  constructor() {
    super('intro');
  }

  /** The intro plays at every start unless it is switched off (and never under test automation). */
  static wanted() {
    return settings.intro !== false && !navigator.webdriver;
  }

  create() {
    this.leaving = false;
    this.cameras.main.setBackgroundColor('#000000');
    audio.attach(this, this.cache.json.get('audioManifest'));
    audio.play('music', 'title');
    audio.play('amb', 'rain_street');
    const skip = this.add.bitmapText(316, 176, 'nlo', 'Tap to skip').setOrigin(1, 1).setTint(0x6a5a48).setDepth(50);
    this.tweens.add({ targets: skip, alpha: 0, delay: 3000, duration: 800 });
    this.input.on('pointerdown', () => this.finish());
    this.input.keyboard?.on('keydown', () => this.finish());
    let at = 0;
    SHOT_MS.forEach((ms, i) => {
      this.time.delayedCall(at, () => this.shot(i));
      at += ms;
    });
    this.time.delayedCall(at, () => this.finish());
  }

  update(_t: number, dt: number) {
    for (const e of this.effects) e.update(dt);
  }

  private clear() {
    for (const e of this.effects) e.destroy();
    for (const o of this.layer) o.destroy();
    this.effects = [];
    this.layer = [];
  }

  /** A line of text with a dark shadow, fading in and out over the shot. */
  private caption(text: string, y: number, ms: number, big = false) {
    const make = (dx: number, dy: number, tint: number) => {
      const t = this.add.bitmapText(160 + dx, y + dy, 'nlo', text).setOrigin(0.5).setCenterAlign().setMaxWidth(280)
        .setTint(tint).setDepth(40).setAlpha(0).setScale(big ? 2 : 1);
      this.layer.push(t);
      this.tweens.add({ targets: t, alpha: 1, duration: 700, delay: 400 });
      this.tweens.add({ targets: t, alpha: 0, duration: 600, delay: Math.max(1200, ms - 900) });
      return t;
    };
    make(1, 1, 0x000000);
    make(0, 0, big ? 0xe8d8a8 : 0xd9c9a0);
  }

  private shot(i: number) {
    if (this.leaving) return;
    this.clear();
    const ms = SHOT_MS[i];
    this.cameras.main.fadeIn(600, 0, 0, 0);
    const calm = settings.reduceMotion;
    if (i === 0) {
      this.effects.push(rain(this, 80, 5, 0.25));
      this.caption('BRACKWATER, OCTOBER 1951', 84, ms, true);
    } else if (i === 1) {
      const img = this.add.image(0, 18, 'tbg:pier9').setOrigin(0, 0);
      this.layer.push(img);
      if (!calm) this.tweens.add({ targets: img, x: -160, duration: ms, ease: 'Sine.easeInOut' });
      this.effects.push(glints(this, 0, 320, 86, 110), fog(this, 70, 150, 1.3), rain(this, 70, 5, 0.3));
      this.caption('A harbor city that keeps its secrets on ice.', 160, ms);
    } else if (i === 2) {
      const img = this.add.image(160, 90, 'tbg:hotel_room');
      this.layer.push(img, this.add.rectangle(0, 0, 320, 180, 0x000008, 0.45).setOrigin(0, 0).setDepth(2));
      if (!calm) this.tweens.add({ targets: img, scale: 1.08, duration: ms, ease: 'Sine.easeIn' });
      this.effects.push(flicker(this, 0xffc070, 0.06));
      this.caption('Thomas Rook keeps waking up in locked rooms.', 160, ms);
    } else {
      this.layer.push(this.add.image(0, 0, 'title').setOrigin(0, 0));
      this.effects.push(rain(this, 120, 5, 0.4));
      if (this.textures.exists('title_logo')) {
        const logo = this.add.image(160, 40, 'title_logo').setDepth(30).setAlpha(0).setScale(calm ? 1 : 0.92);
        this.layer.push(logo);
        this.tweens.add({ targets: logo, alpha: 1, scale: 1, duration: 1800, delay: 500, ease: 'Sine.easeOut' });
      }
      this.caption('The keys are always on his side of the door.', 150, ms);
    }
  }

  private finish() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.clear();
      this.scene.start('title');
    });
  }
}
