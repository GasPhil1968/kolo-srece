// Small animated effects for the intro and the title screens: rain, fog, smoke, glints on
// water, a flickering light and lightning. Each effect draws into one Graphics object and is
// moved on by update(dt) from its scene.
import Phaser from 'phaser';
import { settings } from './services';

export interface Effect {
  update(dt: number): void;
  destroy(): void;
}

/** Slanted rain over the whole view (or a band of it). */
export function rain(scene: Phaser.Scene, count: number, depth = 5, alpha = 0.4): Effect {
  const g = scene.add.graphics().setDepth(depth);
  const drops = Array.from({ length: count }, () => ({ x: Math.random() * 340, y: Math.random() * 180, v: 150 + Math.random() * 120 }));
  return {
    update(dt) {
      g.clear();
      g.lineStyle(1, 0x8fa6c4, alpha);
      for (const d of drops) {
        d.y += (d.v * dt) / 1000;
        d.x -= ((d.v * dt) / 1000) * 0.15;
        if (d.y > 180) {
          d.y = -6;
          d.x = Math.random() * 340;
        }
        g.lineBetween(Math.round(d.x), Math.round(d.y), Math.round(d.x - 1), Math.round(d.y + 5));
      }
    },
    destroy: () => g.destroy(),
  };
}

/** Banks of fog drifting sideways, low over the ground. */
export function fog(scene: Phaser.Scene, y0: number, y1: number, density = 1, depth = 4): Effect {
  const g = scene.add.graphics().setDepth(depth);
  const banks = Array.from({ length: Math.round(7 * density) }, () => ({
    x: Math.random() * 420 - 50, y: y0 + Math.random() * (y1 - y0), w: 60 + Math.random() * 90, h: 6 + Math.random() * 10,
    v: (4 + Math.random() * 8) * (Math.random() < 0.5 ? -1 : 1), a: 0.05 + Math.random() * 0.07,
  }));
  return {
    update(dt) {
      g.clear();
      for (const b of banks) {
        b.x += (b.v * dt) / 1000;
        if (b.x > 380) b.x = -b.w - 20;
        if (b.x < -b.w - 40) b.x = 360;
        g.fillStyle(0xb8c4d0, b.a);
        g.fillEllipse(b.x + b.w / 2, b.y, b.w, b.h);
        g.fillStyle(0xb8c4d0, b.a * 0.6);
        g.fillEllipse(b.x + b.w / 2, b.y, b.w * 1.4, b.h * 1.8);
      }
    },
    destroy: () => g.destroy(),
  };
}

/** Smoke curling up from a few points, as from cigarettes in a bar. */
export function smoke(scene: Phaser.Scene, sources: [number, number][], depth = 4): Effect {
  const g = scene.add.graphics().setDepth(depth);
  const puffs: { x: number; y: number; r: number; life: number; dx: number }[] = [];
  let spawn = 0;
  return {
    update(dt) {
      spawn -= dt;
      if (spawn <= 0) {
        spawn = 140;
        const [sx, sy] = sources[Math.floor(Math.random() * sources.length)];
        puffs.push({ x: sx, y: sy, r: 1.5, life: 1, dx: (Math.random() - 0.5) * 6 });
      }
      g.clear();
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.life -= dt / 4200;
        if (p.life <= 0) {
          puffs.splice(i, 1);
          continue;
        }
        p.y -= (9 * dt) / 1000;
        p.x += (p.dx * dt) / 1000 + Math.sin(p.y / 7) * 0.08;
        p.r += (2.2 * dt) / 1000;
        g.fillStyle(0xc8c0c8, 0.16 * p.life);
        g.fillCircle(p.x, p.y, p.r);
      }
    },
    destroy: () => g.destroy(),
  };
}

/** Short bright lines that come and go on water. */
export function glints(scene: Phaser.Scene, x0: number, x1: number, y0: number, y1: number, depth = 3): Effect {
  const g = scene.add.graphics().setDepth(depth);
  const lines = Array.from({ length: 26 }, () => ({ x: 0, y: 0, w: 0, t: Math.random() * 3000 }));
  const place = (l: (typeof lines)[number]) => {
    l.x = x0 + Math.random() * (x1 - x0);
    l.y = Math.round(y0 + Math.random() * (y1 - y0));
    l.w = 2 + Math.random() * 6;
    l.t = 900 + Math.random() * 2400;
  };
  lines.forEach(place);
  return {
    update(dt) {
      g.clear();
      for (const l of lines) {
        l.t -= dt;
        if (l.t <= 0) place(l);
        const a = Math.max(0, Math.min(1, l.t / 500)) * 0.5;
        g.fillStyle(0xd8e4f0, a);
        g.fillRect(Math.round(l.x), l.y, Math.round(l.w), 1);
      }
    },
    destroy: () => g.destroy(),
  };
}

/** A coloured light over everything that buzzes and stutters, like neon. */
export function flicker(scene: Phaser.Scene, color: number, base: number, depth = 6): Effect {
  const r = scene.add.rectangle(0, 0, 320, 180, color, base).setOrigin(0, 0).setDepth(depth)
    .setBlendMode(Phaser.BlendModes.ADD);
  let t = 0;
  return {
    update(dt) {
      t -= dt;
      if (t <= 0) {
        t = 60 + Math.random() * 400;
        const out = !settings.reduceMotion && Math.random() < 0.12;
        r.setAlpha(out ? base * 0.2 : base * (0.75 + Math.random() * 0.5));
      }
    },
    destroy: () => r.destroy(),
  };
}

/** Now and then the sky lights up white, and the rain is louder for it (none with Less motion). */
export function lightning(scene: Phaser.Scene, depth = 7): Effect {
  const r = scene.add.rectangle(0, 0, 320, 180, 0xdfe8ff, 0).setOrigin(0, 0).setDepth(depth);
  let next = 4000 + Math.random() * 5000;
  let t = 0;
  return {
    update(dt) {
      if (settings.reduceMotion) return;
      t += dt;
      if (t < next) return;
      const k = t - next;
      // two quick strokes, then darkness again
      const a = k < 80 ? 0.45 : k < 160 ? 0.05 : k < 230 ? 0.3 : Math.max(0, 0.3 - (k - 230) / 600);
      r.setAlpha(a);
      if (k > 900) {
        t = 0;
        next = 6000 + Math.random() * 8000;
        r.setAlpha(0);
      }
    },
    destroy: () => r.destroy(),
  };
}

/** A dark wash down the bottom of the view so menu text stays readable over a picture. */
export function shade(scene: Phaser.Scene, from: number, depth = 8) {
  for (let i = 0; i < 12; i++) {
    const y = from + i * ((180 - from) / 12);
    scene.add.rectangle(0, y, 320, (180 - from) / 12 + 1, 0x050508, 0.05 + i * 0.05).setOrigin(0, 0).setDepth(depth);
  }
}
