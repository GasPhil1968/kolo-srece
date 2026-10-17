// Effects started and stopped by scripts (fx command), drawn from existing artwork only:
//   bolt   – one discharge sequence of an atlas whose cells carry measured end points; each frame is
//            placed by a rotation and a uniform scale that put its first point on (ax, ay) and its
//            second on (bx, by) (the dead man's neck and the living man's sword hand). No shearing.
//            With `to` set to an actor id, the second point follows that actor's measured point
//            (his sword hand in whatever frame he is in).
//   flash  – the screen whitens and fades (dur seconds).
//   dark   – the screen goes (nearly) black while the effect runs.
//   glow   – an additive light sprite at a point, pulsing.
//   sprite – an animated figure of an atlas thrown from (x, y) to (x2, y2) on an arc, turning, then
//            resting there (debris, spray, dust, the likeness over the body, birds leaving).
// Reduced flash: flashes are reduced to a faint tint, discharges and glows are dimmed and do not pulse.
// Nothing here changes game state.
import Phaser from 'phaser';
import type { Engine } from '../core/engine';
import { charMeta } from '../content/assets';
import { dyn } from '../core/content';

type Params = Record<string, number | string | boolean> & { _t0: number };

/** Room position of an actor's measured point in its current frame (null if it has none). */
export type PointOf = (actor: string, k: number) => { x: number; y: number } | null;

interface FxView {
  kind: string;
  objs: Phaser.GameObjects.GameObject[];
}

const num = (p: Params, k: string, d: number): number => (typeof p[k] === 'number' ? (p[k] as number) : d);
const str = (p: Params, k: string, d: string): string => (typeof p[k] === 'string' ? (p[k] as string) : d);

export class FxLayer {
  private views = new Map<string, FxView>();

  constructor(private scene: Phaser.Scene) {}

  /** Textures an effect needs (to load them with the room). */
  static textures(p: Record<string, number | string | boolean>): string[] {
    const out: string[] = [];
    const ch = typeof p.character === 'string' ? charMeta(p.character) : undefined;
    if (ch) out.push(ch.atlas);
    const at = typeof p.atlas === 'string' ? charMeta(p.atlas) : undefined;
    if (at) out.push(at.atlas);
    if (typeof p.image === 'string') out.push(p.image);
    return out;
  }

  update(engine: Engine, ensure: (keys: string[]) => void, pointOf: PointOf): void {
    const active = engine.fx as Map<string, Params>;
    for (const [name, v] of this.views) {
      if (!active.has(name)) {
        for (const o of v.objs) o.destroy();
        this.views.delete(name);
      }
    }
    const reduced = engine.settings.reducedFlash;
    for (const [name, p] of active) {
      const kind = str(p, 'kind', name);
      const t = engine.clock - p._t0;
      const missing = FxLayer.textures(p).filter((k) => !this.scene.textures.exists(k));
      if (missing.length) {
        ensure(missing);
        continue;
      }
      let v = this.views.get(name);
      if (!v) {
        v = { kind, objs: this.create(kind, p) };
        this.views.set(name, v);
      }
      this.draw(v, p, t, reduced, engine, pointOf);
    }
  }

  private create(kind: string, p: Params): Phaser.GameObjects.GameObject[] {
    const sc = this.scene;
    switch (kind) {
      case 'flash':
      case 'dark': {
        const color = kind === 'dark' ? 0x000000 : num(p, 'color', 0xf4f8ff);
        return [sc.add.rectangle(0, 0, 960, 470, color, 1).setOrigin(0, 0).setScrollFactor(0).setDepth(kind === 'dark' ? 64000 : 64500)];
      }
      case 'glow': {
        const img = sc.add.image(0, 0, str(p, 'image', 'fx_neck')).setBlendMode(Phaser.BlendModes.ADD).setDepth(num(p, 'depth', 52000));
        return [img];
      }
      case 'bolt': {
        const meta = charMeta(str(p, 'atlas', 'qbolt'))!;
        const first = meta.anims[str(p, 'anim', 'one')]?.frames[0] ?? Object.keys(meta.frames)[0];
        const n = Math.max(1, Math.round(num(p, 'n', 1)));
        return Array.from({ length: n }, () => sc.add.sprite(0, 0, meta.atlas, first).setBlendMode(Phaser.BlendModes.ADD).setDepth(num(p, 'depth', 52000)));
      }
      default: {
        const meta = charMeta(str(p, 'character', ''));
        if (!meta) return [];
        const anim = meta.anims[str(p, 'anim', 'stand')] ?? meta.anims.stand;
        return [sc.add.sprite(0, 0, meta.atlas, anim.frames[0]).setDepth(num(p, 'depth', num(p, 'y2', num(p, 'y', 400))))];
      }
    }
  }

  private draw(v: FxView, p: Params, t: number, reduced: boolean, engine: Engine, pointOf: PointOf): void {
    switch (v.kind) {
      case 'flash': {
        const r = v.objs[0] as Phaser.GameObjects.Rectangle;
        const dur = num(p, 'dur', 0.5);
        const peak = num(p, 'alpha', 0.85) * (reduced ? 0.18 : 1);
        r.setAlpha(Math.max(0, peak * (1 - t / dur)));
        break;
      }
      case 'dark': {
        const r = v.objs[0] as Phaser.GameObjects.Rectangle;
        const fadeIn = num(p, 'fadeIn', 0.6);
        r.setAlpha(num(p, 'alpha', 0.93) * Math.min(1, t / Math.max(0.01, fadeIn)));
        break;
      }
      case 'glow': {
        const img = v.objs[0] as Phaser.GameObjects.Image;
        const size = num(p, 'size', 80);
        const grow = Math.min(1, t / num(p, 'grow', 0.6));
        const pulse = reduced ? 0 : 0.18 * Math.sin(t * num(p, 'hz', 5) * Math.PI * 2);
        img.setPosition(num(p, 'x', 0), num(p, 'y', 0));
        img.setDisplaySize(size * grow, size * grow);
        img.setAlpha(Math.max(0, (num(p, 'alpha', 0.9) + pulse) * (reduced ? 0.6 : 1)));
        break;
      }
      case 'bolt': {
        const meta = charMeta(str(p, 'atlas', 'qbolt'))!;
        const am = meta.anims[str(p, 'anim', 'one')];
        if (!am) break;
        const fps = num(p, 'fps', am.fps) * (reduced ? 0.6 : 1);
        const base = Math.min(am.frames.length - 1, Math.floor(t * fps));
        const ax = num(p, 'ax', 0);
        const ay = num(p, 'ay', 0);
        const target = typeof p.to === 'string' ? pointOf(p.to, 0) : null;
        const bx = target ? target.x : num(p, 'bx', 0);
        const by = target ? target.y : num(p, 'by', 0);
        const n = v.objs.length;
        // A long discharge is drawn as n shorter ones end to end (less magnification, more forks).
        v.objs.forEach((o, i) => {
          const sp = o as Phaser.GameObjects.Sprite;
          const frame = am.frames[Math.min(am.frames.length - 1, Math.max(0, base - (i % 2)))];
          const pts = meta.points?.[frame];
          const fm = meta.frames[frame];
          if (!pts || !fm) return;
          if (sp.frame.name !== frame) sp.setFrame(frame);
          const sx = ax + ((bx - ax) * i) / n;
          const sy = ay + ((by - ay) * i) / n;
          const ex = ax + ((bx - ax) * (i + 1)) / n;
          const ey = ay + ((by - ay) * (i + 1)) / n;
          // Similarity transform (rotation + uniform scale): cell point 0 -> segment start, point 1 -> end.
          const [p0, p1] = pts;
          const cellAng = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
          const worldAng = Math.atan2(ey - sy, ex - sx);
          const k = Math.hypot(ex - sx, ey - sy) / Math.max(1, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]));
          const rot = worldAng - cellAng;
          // The sprite's origin is the cell's top-left corner (anchor 0,0 in the sheet).
          sp.setOrigin(fm.ax, fm.ay);
          sp.setScale(k);
          sp.setRotation(rot);
          const c = Math.cos(rot);
          const s = Math.sin(rot);
          sp.setPosition(sx - k * (c * p0[0] - s * p0[1]), sy - k * (s * p0[0] + c * p0[1]));
          sp.setAlpha(num(p, 'alpha', 1) * (reduced ? 0.55 : 1));
        });
        break;
      }
      default: {
        const sp = v.objs[0] as Phaser.GameObjects.Sprite | undefined;
        if (!sp) break;
        const meta = charMeta(str(p, 'character', ''));
        if (!meta) break;
        const am = meta.anims[str(p, 'anim', 'stand')] ?? meta.anims.stand;
        const delay = num(p, 'delay', 0);
        const tt = t - delay;
        sp.setVisible(tt >= 0);
        if (tt < 0) break;
        const n = am.frames.length;
        const raw = Math.floor(tt * am.fps);
        const frame = am.frames[am.loop ? raw % n : Math.min(n - 1, raw)];
        if (sp.frame.name !== frame) sp.setFrame(frame);
        const fm = meta.frames[frame];
        const flip = num(p, 'facing', 1) !== (am.facing ?? meta.facing ?? 1);
        sp.setFlipX(flip);
        if (fm) sp.setOrigin(flip ? 1 - fm.ax : fm.ax, fm.ay);
        const dur = num(p, 'dur', 0);
        const u = dur > 0 ? Math.min(1, tt / dur) : 1;
        const x0 = num(p, 'x', 0);
        const y0 = num(p, 'y', 0);
        const x1 = num(p, 'x2', x0);
        const y1 = num(p, 'y2', y0);
        const arc = num(p, 'arc', 0);
        // Thrown objects: horizontal at constant speed, vertical eased in (falling), plus a lift arc.
        const ease = num(p, 'fall', 0) ? u * u : u;
        sp.setPosition(x0 + (x1 - x0) * u, y0 + (y1 - y0) * ease - arc * 4 * u * (1 - u));
        sp.setRotation(num(p, 'spin', 0) * u + num(p, 'rot', 0));
        sp.setScale(num(p, 'scale', 1));
        let alpha = num(p, 'alpha', 1);
        const fadeOut = num(p, 'fadeOut', 0);
        if (fadeOut > 0) alpha *= Math.max(0, Math.min(1, (num(p, 'life', 1e9) - tt) / fadeOut));
        sp.setAlpha(alpha);
        // Things in the room take the room's light; light itself (lit: 0) does not.
        sp.setTint(num(p, 'lit', 1) && engine.room.actorTint !== undefined ? dyn(engine.room.actorTint, engine.state) : 0xffffff);
        break;
      }
    }
  }

  clear(): void {
    for (const v of this.views.values()) for (const o of v.objs) o.destroy();
    this.views.clear();
  }
}
