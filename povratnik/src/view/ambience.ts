// Ambient effects composed from existing effect sprites: wind-blown dust motes (the visible wind in
// the Weide), birds crossing the sky, rain (the rain tile scrolled in two depths) and puddles (the
// ripple strip shimmering). Purely presentational; nothing here touches game state.
import Phaser from 'phaser';
import type { Engine } from '../core/engine';
import type { AmbientDef, RoomDef } from '../core/content';

interface Mote {
  sp: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ph: number;
}

interface Bird {
  sp: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  vx: number;
  ph: number;
}

interface RainSheet {
  sp: Phaser.GameObjects.TileSprite;
  vx: number;
  vy: number;
  alpha: number;
}

interface Ripple {
  a: Phaser.GameObjects.Image;
  b: Phaser.GameObjects.Image;
  alpha: number;
  ph: number;
}

interface Effect {
  def: AmbientDef;
  area: [number, number, number, number];
  motes: Mote[];
  birds: Bird[];
  rain: RainSheet[];
  ripples: Ripple[];
}

const num = (def: AmbientDef, key: string, fallback: number): number => {
  const v = def.params?.[key];
  return typeof v === 'number' ? v : fallback;
};

/** Small deterministic generator so effects look the same on every visit. */
function rand(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Ambience {
  private effects: Effect[] = [];

  constructor(private scene: Phaser.Scene) {}

  textures(room: RoomDef): string[] {
    const keys = new Set<string>();
    for (const a of room.ambient ?? []) {
      if (a.fx === 'motes') keys.add('fx_dust_mote');
      if (a.fx === 'birds') keys.add('atlas/bird');
      if (a.fx === 'rain') keys.add('fx_rain');
      if (a.fx === 'ripples') keys.add('prop_pfuetze');
    }
    return [...keys];
  }

  build(room: RoomDef, engine: Engine): void {
    this.clear();
    const reduced = engine.settings.reducedMotion;
    for (const def of room.ambient ?? []) {
      const area = (def.params?.area as string | undefined)?.split(',').map(Number) as [number, number, number, number] | undefined;
      const fx: Effect = { def, area: area && area.length === 4 ? area : [def.x, def.y, 400, 100], motes: [], birds: [], rain: [], ripples: [] };
      const r = rand(def.x * 31 + def.y * 17 + def.fx.length);
      const [ax, ay, aw, ah] = fx.area;
      if (def.fx === 'motes' && this.scene.textures.exists('fx_dust_mote')) {
        const count = Math.round(num(def, 'count', 24) * (reduced ? 0.5 : 1));
        const vx = num(def, 'vx', 40);
        const vy = num(def, 'vy', -3);
        const size = num(def, 'size', 3);
        for (let i = 0; i < count; i++) {
          const sp = this.scene.add.image(0, 0, 'fx_dust_mote');
          const k = 0.6 + r() * 0.8;
          sp.setDisplaySize(size * k, size * k);
          sp.setAlpha(num(def, 'alpha', 0.55) * (0.6 + r() * 0.4));
          sp.setDepth(num(def, 'depth', 45000));
          // Sunlit dust: additive, so the specks read against bright and dark ground alike.
          sp.setBlendMode(Phaser.BlendModes.ADD);
          if (typeof def.params?.tint === 'number') sp.setTint(def.params.tint);
          fx.motes.push({ sp, x: ax + r() * aw, y: ay + r() * ah, vx: vx * (0.7 + r() * 0.6) * (reduced ? 0.6 : 1), vy: vy * (0.5 + r()), ph: r() * 6.28 });
        }
      }
      if (def.fx === 'birds' && this.scene.textures.exists('atlas/bird')) {
        const count = num(def, 'count', 2);
        const speed = num(def, 'speed', 46);
        for (let i = 0; i < count; i++) {
          const sp = this.scene.add.sprite(0, 0, 'atlas/bird', 'f0');
          sp.setScale(num(def, 'scale', 0.16) * (0.85 + r() * 0.3));
          sp.setDepth(-40000);
          sp.setAlpha(0.85);
          const dir = num(def, 'dir', 1) * (r() < 0.2 ? -1 : 1);
          fx.birds.push({ sp, x: ax + r() * aw, y: ay + r() * ah, vx: dir * speed * (0.8 + r() * 0.4), ph: r() * 3 });
        }
      }
      if (def.fx === 'rain' && this.scene.textures.exists('fx_rain')) {
        // Two sheets of the same rain tile: the far one smaller, fainter and slower.
        const layers = num(def, 'layers', 2);
        const slow = reduced ? 0.5 : 1;
        for (let i = 0; i < layers; i++) {
          const k = 1 - i * 0.35;
          const sp = this.scene.add.tileSprite(ax, ay, aw, ah, 'fx_rain').setOrigin(0, 0);
          sp.setTileScale(num(def, 'scale', 1) * (1 - i * 0.3));
          sp.setDepth(num(def, 'depth', 46000) - i);
          sp.tilePositionX = r() * 256;
          sp.tilePositionY = r() * 256;
          const alpha = num(def, 'alpha', 0.26) * k;
          sp.setAlpha(alpha);
          fx.rain.push({ sp, vx: num(def, 'vx', -110) * k * slow, vy: num(def, 'vy', 560) * k * slow, alpha });
        }
      }
      if (def.fx === 'ripples' && this.scene.textures.exists('prop_pfuetze')) {
        // Puddles: the ripple strip twice, one mirrored, crossfading.
        const spots = String(def.params?.spots ?? '').split(';').filter(Boolean).map((q) => q.split(',').map(Number));
        for (const [x, y, w, h] of spots) {
          const mk = (flip: boolean) => this.scene.add.image(x, y, 'prop_pfuetze').setOrigin(0, 0).setDisplaySize(w, h).setFlipX(flip).setDepth(y);
          fx.ripples.push({ a: mk(false), b: mk(true), alpha: num(def, 'alpha', 0.9), ph: r() * 6.28 });
        }
      }
      this.effects.push(fx);
    }
  }

  update(dt: number, engine: Engine): void {
    const s = engine.state;
    const t = engine.clock;
    for (const fx of this.effects) {
      const on = !fx.def.visible || fx.def.visible(s);
      const [ax, ay, aw, ah] = fx.area;
      for (const m of fx.motes) {
        m.sp.setVisible(on);
        if (!on) continue;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.x > ax + aw) m.x -= aw;
        if (m.x < ax) m.x += aw;
        if (m.y < ay) m.y += ah;
        if (m.y > ay + ah) m.y -= ah;
        // Fade at the left and right edges of the area so wrapping is invisible.
        const edge = Math.min(1, (m.x - ax) / 40, (ax + aw - m.x) / 40);
        m.sp.setPosition(m.x, m.y + Math.sin(t * 1.7 + m.ph) * 3);
        m.sp.setAlpha(Math.max(0, edge) * num(fx.def, 'alpha', 0.55));
      }
      for (const sh of fx.rain) {
        sh.sp.setVisible(on);
        if (!on) continue;
        const sc = sh.sp.tileScaleX || 1;
        sh.sp.tilePositionX -= (sh.vx * dt) / sc;
        sh.sp.tilePositionY -= (sh.vy * dt) / sc;
        sh.sp.setAlpha(sh.alpha);
      }
      for (const rp of fx.ripples) {
        rp.a.setVisible(on);
        rp.b.setVisible(on);
        if (!on) continue;
        const w = 0.5 + 0.5 * Math.sin(t * num(fx.def, 'hz', 0.9) * 6.28 + rp.ph);
        rp.a.setAlpha(rp.alpha * w);
        rp.b.setAlpha(rp.alpha * (1 - w));
      }
      for (const b of fx.birds) {
        b.sp.setVisible(on);
        if (!on) continue;
        b.x += b.vx * dt;
        if (b.x > ax + aw + 40) b.x = ax - 40;
        if (b.x < ax - 40) b.x = ax + aw + 40;
        b.sp.setPosition(b.x, b.y + Math.sin(t * 0.9 + b.ph) * 6);
        b.sp.setFlipX(b.vx < 0);
        b.sp.setFrame(`f${Math.floor((t + b.ph) * 10) % 4}`);
      }
    }
  }

  clear(): void {
    for (const fx of this.effects) {
      for (const m of fx.motes) m.sp.destroy();
      for (const b of fx.birds) b.sp.destroy();
      for (const sh of fx.rain) sh.sp.destroy();
      for (const rp of fx.ripples) {
        rp.a.destroy();
        rp.b.destroy();
      }
    }
    this.effects = [];
  }
}
