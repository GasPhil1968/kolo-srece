import Phaser from 'phaser';
import type { Dir } from '../engine/types';
import type { CharMeta, Pt } from './meta';
import { audio } from './services';

export const charMetas: Record<string, CharMeta> = {};

export function sizeTag(k: number) {
  return String(Math.round(k * 100));
}

/** Create Phaser animations for a loaded character (once per size variant). */
export function ensureAnims(scene: Phaser.Scene, meta: CharMeta) {
  for (const sz of meta.sizes) {
    const tex = `char:${meta.id}@${sizeTag(sz.k)}`;
    if (!scene.textures.exists(tex)) continue;
    for (const [name, a] of Object.entries(meta.anims)) {
      const key = `${meta.id}@${sizeTag(sz.k)}:${name}`;
      if (scene.anims.exists(key)) continue;
      scene.anims.create({
        key,
        frames: a.frames.map((f) => ({ key: tex, frame: f })),
        frameRate: a.fps,
        repeat: a.loop ? -1 : 0,
      });
    }
  }
}

export class Actor {
  sprite: Phaser.GameObjects.Sprite;
  meta: CharMeta;
  dir: Dir = 'down';
  state: 'idle' | 'walk' | 'talk' | 'anim' = 'idle';
  size = 1;
  baseAnim = 'idle';
  pose = '';
  floor = 'wood';
  isPlayer = false;
  speed = 46;
  private walkToken = 0;
  private blinkAt = 0;
  private lastFrame = -1;
  scaleFn: (y: number) => number = () => 1;
  visible = true;

  constructor(public scene: Phaser.Scene, public id: string, x: number, y: number, dir: Dir = 'down') {
    const meta = charMetas[id];
    if (!meta) throw new Error('no char meta ' + id);
    this.meta = meta;
    this.dir = dir;
    this.sprite = scene.add.sprite(x, y, `char:${id}@100`, 0);
    this.sprite.setOrigin(meta.anchorX / meta.frameW, meta.anchorY / meta.frameH);
    ensureAnims(scene, meta);
    this.blinkAt = scene.time.now + 2000 + Math.random() * 3000;
    this.sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, (_a: unknown, frame: Phaser.Animations.AnimationFrame) => {
      if (this.state === 'walk' && this.isPlayer) {
        const i = frame.index - 1;
        if (i !== this.lastFrame) {
          this.lastFrame = i;
          const side = this.sprite.anims.currentAnim?.key.endsWith('walk_side');
          if ((side && (i === 1 || i === 5)) || (!side && (i === 0 || i === 3))) audio.footstep(this.floor);
        }
      }
    });
    this.idle();
  }

  get x() {
    return this.sprite.x;
  }
  get y() {
    return this.sprite.y;
  }

  setPos(x: number, y: number) {
    this.sprite.setPosition(Math.round(x), Math.round(y));
    this.updateScale();
  }

  /** Pick the closest pre-rendered size so pixels stay crisp. */
  updateScale() {
    const s = Phaser.Math.Clamp(this.scaleFn(this.sprite.y), 0.6, 1.2);
    let best = this.meta.sizes[0].k;
    for (const sz of this.meta.sizes) if (Math.abs(sz.k - s) < Math.abs(best - s)) best = sz.k;
    if (best !== this.size) {
      this.size = best;
      this.refreshAnim();
    }
    this.sprite.setDepth(this.sprite.y + 0.5);
  }

  animKey(name: string) {
    return `${this.id}@${sizeTag(this.size)}:${name}`;
  }

  has(name: string) {
    return !!this.meta.anims[name];
  }

  private dirAnim(base: string): { key: string; flip: boolean } {
    const d = this.dir;
    const pick = (n: string) => (this.has(n) ? n : null);
    let name: string | null = null;
    let flip = false;
    if (d === 'left' || d === 'right') {
      name = pick(`${base}_side`);
      flip = d === 'left';
    } else if (d === 'down') name = pick(`${base}_down`) ?? pick(`${base}_side`);
    else name = pick(`${base}_up`) ?? pick(`${base}_side`);
    if (!name) name = pick('idle_down') ?? pick('idle_side') ?? Object.keys(this.meta.anims)[0];
    return { key: this.animKey(name!), flip };
  }

  refreshAnim() {
    if (this.state === 'anim') return;
    const base = this.state === 'walk' ? 'walk' : this.state === 'talk' ? 'talk' : this.baseAnim;
    const { key, flip } = this.dirAnim(base);
    this.sprite.setFlipX(flip);
    if (base === 'idle') {
      this.sprite.anims.stop();
      const a = this.scene.anims.get(key);
      if (a) this.sprite.setFrame(a.frames[0].frame.name);
    } else if (this.sprite.anims.currentAnim?.key !== key || !this.sprite.anims.isPlaying) {
      this.sprite.play(key, true);
    }
  }

  face(d: Dir) {
    this.dir = d;
    this.refreshAnim();
  }

  faceTowards(x: number, y: number) {
    const dx = x - this.x;
    const dy = y - this.y;
    if (Math.abs(dx) >= Math.abs(dy) * 0.7) this.face(dx < 0 ? 'left' : 'right');
    else this.face(dy < 0 ? 'up' : 'down');
  }

  idle() {
    this.state = 'idle';
    this.refreshAnim();
  }

  talk(on: boolean) {
    if (this.state === 'walk' || this.state === 'anim') return;
    this.state = on ? 'talk' : 'idle';
    this.refreshAnim();
  }

  /** Walk along waypoints. Resolves when arrived (or interrupted). */
  walk(points: Pt[]): Promise<void> {
    const token = ++this.walkToken;
    this.state = 'walk';
    return new Promise((resolve) => {
      const next = (i: number) => {
        if (token !== this.walkToken) return resolve();
        if (i >= points.length) {
          this.state = 'idle';
          this.refreshAnim();
          return resolve();
        }
        const [tx, ty] = points[i];
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.5) return next(i + 1);
        if (Math.abs(dx) >= Math.abs(dy) * 0.8) this.dir = dx < 0 ? 'left' : 'right';
        else this.dir = dy < 0 ? 'up' : 'down';
        this.refreshAnim();
        const s = Phaser.Math.Clamp(this.scaleFn(this.y), 0.6, 1.2);
        const vertical = Math.abs(dy) > Math.abs(dx);
        const speed = this.speed * s * (vertical ? 0.62 : 1);
        const obj = { x: this.x, y: this.y };
        this.scene.tweens.add({
          targets: obj,
          x: tx,
          y: ty,
          duration: (dist / speed) * 1000,
          onUpdate: () => {
            if (token !== this.walkToken) return;
            this.sprite.setPosition(Math.round(obj.x), Math.round(obj.y));
            this.updateScale();
          },
          onComplete: () => next(i + 1),
        });
      };
      next(0);
    });
  }

  stopWalking() {
    this.walkToken++;
    this.scene.tweens.killTweensOf(this.sprite);
    if (this.state === 'walk') this.idle();
  }

  /** Play a one-shot animation (e.g. pickup_side). */
  play(name: string, hold = 0): Promise<void> {
    const n = this.has(`${name}_side`) && !this.has(name) ? `${name}_side` : name;
    if (!this.has(n)) return Promise.resolve();
    this.state = 'anim';
    const key = this.animKey(n);
    if (n.endsWith('_side')) this.sprite.setFlipX(this.dir === 'left');
    return new Promise((resolve) => {
      this.sprite.play(key);
      const meta = this.meta.anims[n];
      if (meta.loop) {
        this.scene.time.delayedCall(hold || 800, () => {
          this.state = 'idle';
          this.refreshAnim();
          resolve();
        });
        return;
      }
      this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.scene.time.delayedCall(hold || 120, () => {
          this.state = 'idle';
          this.refreshAnim();
          resolve();
        });
      });
    });
  }

  /** Hold a looping pose until changed (e.g. 'lie', 'shiver_side', 'play_side'). */
  hold(name: string) {
    if (!this.has(name)) return;
    this.state = 'anim';
    this.sprite.play(this.animKey(name), true);
  }

  release() {
    this.state = 'idle';
    this.refreshAnim();
  }

  tick(now: number) {
    if (this.state === 'idle' && now > this.blinkAt) {
      const { key } = this.dirAnim('idle');
      const a = this.scene.anims.get(key);
      if (a && a.frames.length > 1) {
        this.sprite.setFrame(a.frames[1].frame.name);
        this.scene.time.delayedCall(130, () => {
          if (this.state === 'idle') this.refreshAnim();
        });
      }
      this.blinkAt = now + 2500 + Math.random() * 4000;
    }
  }

  /** Approximate head-top y in world coordinates. */
  headY() {
    return this.y - 52 * this.size;
  }

  hitTest(x: number, y: number) {
    const w = 9 * this.size;
    return x > this.x - w && x < this.x + w && y > this.y - 50 * this.size && y < this.y;
  }

  destroy() {
    this.walkToken++;
    this.sprite.destroy();
  }
}
