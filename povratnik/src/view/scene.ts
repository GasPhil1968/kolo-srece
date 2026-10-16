// Phaser renderer for the engine state: room, layers, actors, ambience and fades.
// It never changes game state itself; player input goes to the UI as targets and then to the
// engine as intents.
import Phaser from 'phaser';
import type { Engine } from '../core/engine';
import { dyn, LayerDef, RoomDef } from '../core/content';
import { ADULT_H, charMeta, imageMeta, CharMeta } from '../content/assets';
import { pointInPoly, toPoints } from '../core/geom';
import { Ambience } from './ambience';

export const R = 2;
export const VIEW_W = 960;
export const VIEW_H = 470;

export interface Target {
  /** 'actor:<id>' or a hotspot id */
  id: string;
  name: string;
  exit: boolean;
}

export interface SceneHooks {
  /** Pointer moved over the scene (room coords) with the target under it (or null). */
  hover(t: Target | null, sx: number, sy: number): void;
  /** Left click on the scene. */
  click(t: Target | null, wx: number, wy: number, sx: number, sy: number): void;
  /** Right click on the scene. */
  context(t: Target | null, wx: number, wy: number, sx: number, sy: number): void;
  /** Assets of the current room are loading (true) or ready (false). */
  loading(on: boolean): void;
  /** Should the engine advance this frame? (false while a menu is open) */
  running(): boolean;
  /** After the engine stepped and visuals synced. */
  frame(dt: number): void;
}

interface ActorView {
  sprite: Phaser.GameObjects.Sprite;
  character: string;
}

export class GameScene extends Phaser.Scene {
  engine!: Engine;
  hooks!: SceneHooks;
  private bg: Phaser.GameObjects.Image | null = null;
  private bgKey = '';
  private actorViews = new Map<string, ActorView>();
  private layerViews = new Map<string, Phaser.GameObjects.Image | Phaser.GameObjects.Sprite>();
  private fadeRect!: Phaser.GameObjects.Rectangle;
  private roomId = '';
  private loadingKeys = new Set<string>();
  private ready = false;
  private ambience!: Ambience;
  highlight = false;
  private highlightGfx!: Phaser.GameObjects.Graphics;
  /** Accumulated dt while the engine is held (hidden tab etc.). */
  private lastHover: string | null = null;

  constructor() {
    super({ key: 'game' });
  }

  init(data: { engine: Engine; hooks: SceneHooks }): void {
    this.engine = data.engine;
    this.hooks = data.hooks;
  }

  create(): void {
    const cam = this.cameras.main;
    cam.setOrigin(0, 0);
    cam.setZoom(R);
    cam.setViewport(0, 0, VIEW_W * R, VIEW_H * R);
    cam.setBackgroundColor('#000000');
    this.fadeRect = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x000000, 1).setOrigin(0, 0).setScrollFactor(0).setDepth(100000);
    this.highlightGfx = this.add.graphics().setDepth(90000);
    this.ambience = new Ambience(this);
    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on('gameout', () => this.hooks.hover(null, -1, -1));
    this.load.on(Phaser.Loader.Events.FILE_COMPLETE, (key: string) => {
      this.loadingKeys.delete(key);
      this.settle();
    });
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      this.loadingKeys.delete(file.key);
      this.failedAssets.push(file.key);
      console.error(`Grafik konnte nicht geladen werden: ${file.key}`);
      this.settle();
    });
    this.load.on(Phaser.Loader.Events.COMPLETE, () => this.settle());
  }

  // ---------------------------------------------------------------- assets

  private textureFor(key: string): { texture: string; frame?: string } {
    const i = key.indexOf(':');
    if (i > 0) return { texture: key.slice(0, i), frame: key.slice(i + 1) };
    return { texture: key };
  }

  /** Queue a texture (image key or atlas key) for loading; returns false if already present. */
  private queueTexture(texKey: string): boolean {
    if (this.textures.exists(texKey) || this.loadingKeys.has(texKey)) return false;
    if (texKey.startsWith('chars/') || texKey.startsWith('atlas/')) {
      this.load.atlas(texKey, `assets/${texKey}.webp`, `assets/${texKey}.json`);
    } else {
      const m = imageMeta(texKey);
      if (!m) {
        console.warn(`unknown image ${texKey}`);
        return false;
      }
      this.load.image(texKey, `assets/${m.file}`);
    }
    this.loadingKeys.add(texKey);
    return true;
  }

  private roomTextures(room: RoomDef): string[] {
    const s = this.engine.state;
    const keys = new Set<string>();
    keys.add(dyn(room.bg, s));
    for (const l of room.layers ?? []) {
      keys.add(this.textureFor(dyn(l.image, s)).texture);
      for (const f of l.frames ?? []) keys.add(this.textureFor(f).texture);
    }
    for (const [, a] of Object.entries(s.actors)) {
      if (a.room !== room.id) continue;
      const m = charMeta(a.character);
      if (m) {
        keys.add(m.atlas);
        for (const k of Object.keys(m.extra ?? {})) keys.add(k);
      }
    }
    for (const k of room.assets ?? []) keys.add(k);
    for (const k of this.ambience.textures(room)) keys.add(k);
    return [...keys];
  }

  private waiters: { keys: string[]; resolve: () => void }[] = [];
  readonly failedAssets: string[] = [];

  private settle(): void {
    this.waiters = this.waiters.filter((w) => {
      const done = w.keys.every((k) => this.textures.exists(k) || !this.loadingKeys.has(k));
      if (done) w.resolve();
      return !done;
    });
  }

  /** Load textures; resolves when all are present (or failed - failures are reported). */
  private ensure(keys: string[]): Promise<void> {
    const missing = keys.filter((k) => !this.textures.exists(k));
    if (!missing.length) return Promise.resolve();
    return new Promise((resolve) => {
      let queued = 0;
      for (const k of missing) if (this.queueTexture(k)) queued++;
      this.waiters.push({ keys: missing, resolve });
      if (queued && !this.load.isLoading()) this.load.start();
      this.settle();
    });
  }

  /** Preload rooms the player is likely to visit next (exits of the current room). */
  private preloadNeighbours(room: RoomDef): void {
    const s = this.engine.state;
    const next = new Set<string>();
    for (const h of room.hotspots) {
      const ex = h.exit ? dyn(h.exit, s) : null;
      if (ex) next.add(ex.room);
    }
    const keys: string[] = [];
    for (const id of next) {
      const r = this.engine.roomDef(id);
      if (r) keys.push(...this.roomTextures(r));
    }
    let queued = 0;
    for (const k of keys) if (this.queueTexture(k)) queued++;
    if (queued && !this.load.isLoading()) this.load.start();
  }

  /** Drop textures of other chapters (texture memory stays bounded). */
  releaseUnused(keep: Set<string>): void {
    for (const key of this.textures.getTextureKeys()) {
      if (key.startsWith('__') || keep.has(key) || key.startsWith('fx/')) continue;
      if (key.startsWith('bg_') || key.startsWith('chars/') || key.startsWith('atlas/') || key.startsWith('prop_')) this.textures.remove(key);
    }
  }

  // ---------------------------------------------------------------- room build

  private async buildRoom(): Promise<void> {
    const engine = this.engine;
    const room = engine.room;
    this.ready = false;
    this.hooks.loading(true);
    const id = room.id;
    await this.ensure(this.roomTextures(room));
    if (engine.state.room !== id) return; // superseded by another change
    this.clearRoom();
    this.roomId = id;
    this.bgKey = dyn(room.bg, engine.state);
    this.bg = this.add.image(0, 0, this.bgKey).setOrigin(0, 0).setDepth(-100000);
    this.ambience.build(room, engine);
    this.ready = true;
    this.hooks.loading(false);
    this.preloadNeighbours(room);
  }

  private clearRoom(): void {
    this.bg?.destroy();
    this.bg = null;
    for (const v of this.actorViews.values()) v.sprite.destroy();
    this.actorViews.clear();
    for (const v of this.layerViews.values()) v.destroy();
    this.layerViews.clear();
    this.ambience.clear();
  }

  // ---------------------------------------------------------------- frame

  override update(_time: number, deltaMs: number): void {
    const engine = this.engine;
    const dt = Math.min(deltaMs / 1000, 0.1);
    if (engine.state.room && engine.state.room !== this.roomId && !this.building) {
      this.building = true;
      this.buildRoom().finally(() => {
        this.building = false;
      });
    }
    if (this.ready && this.roomId === engine.state.room && this.hooks.running()) engine.update(dt);
    if (this.ready && this.roomId === engine.state.room) this.sync(dt);
    this.fadeRect.setAlpha(this.ready ? engine.fadeLevel : 1);
    this.hooks.frame(dt);
  }

  private building = false;

  private sync(dt: number): void {
    const engine = this.engine;
    const s = engine.state;
    const room = engine.room;
    // Background variant changes (e.g. field before/after mowing).
    const bgKey = dyn(room.bg, s);
    if (bgKey !== this.bgKey && this.textures.exists(bgKey)) {
      this.bgKey = bgKey;
      this.bg?.setTexture(bgKey);
    } else if (bgKey !== this.bgKey) this.ensure([bgKey]);
    // Camera
    const cam = this.cameras.main;
    let sx = engine.camX;
    let sy = 0;
    if (engine.shakeT > 0) {
      sx += (Math.random() - 0.5) * engine.shakeAmp;
      sy += (Math.random() - 0.5) * engine.shakeAmp;
    }
    cam.setScroll(sx, sy);
    this.syncLayers(room);
    this.syncActors(room);
    this.ambience.update(dt, engine);
    this.drawHighlight(room);
  }

  private syncLayers(room: RoomDef): void {
    const s = this.engine.state;
    for (const l of room.layers ?? []) {
      const visible = !l.visible || l.visible(s);
      let v = this.layerViews.get(l.id);
      if (!visible) {
        if (v) v.setVisible(false);
        continue;
      }
      const imgKey = l.frames ? l.frames[Math.floor(this.engine.clock * (l.fps ?? 6)) % l.frames.length] : dyn(l.image, s);
      const tf = this.textureFor(imgKey);
      if (!this.textures.exists(tf.texture)) {
        this.ensure([tf.texture]);
        continue;
      }
      if (!v) {
        v = this.add.image(l.x, l.y, tf.texture, tf.frame);
        this.layerViews.set(l.id, v);
      } else if (v.texture.key !== tf.texture || (tf.frame && v.frame.name !== tf.frame)) v.setTexture(tf.texture, tf.frame);
      v.setVisible(true);
      v.setPosition(l.x, l.y);
      v.setOrigin(l.origin?.[0] ?? 0, l.origin?.[1] ?? 0);
      v.setAlpha(l.alpha ?? 1);
      v.setScale(l.scale ?? 1);
      v.setFlipX(!!l.flipX);
      v.setDepth(layerDepth(l));
    }
  }

  private syncActors(room: RoomDef): void {
    const engine = this.engine;
    const s = engine.state;
    const seen = new Set<string>();
    const tint = room.actorTint !== undefined ? dyn(room.actorTint, s) : 0xffffff;
    for (const id of engine.roomActors()) {
      const a = s.actors[id];
      const meta = charMeta(a.character);
      if (!meta) continue;
      if (!this.textures.exists(meta.atlas)) {
        this.ensure([meta.atlas, ...Object.keys(meta.extra ?? {})]);
        continue;
      }
      seen.add(id);
      let v = this.actorViews.get(id);
      if (!v || v.character !== a.character) {
        v?.sprite.destroy();
        v = { sprite: this.add.sprite(a.x, a.y, meta.atlas, firstFrame(meta)), character: a.character };
        this.actorViews.set(id, v);
      }
      const anim = engine.actorAnim(id);
      const am = meta.anims[anim.name] ?? meta.anims.stand;
      const n = am.frames.length;
      const total = n * Math.max(1, anim.times);
      let fi = Math.floor(anim.t * am.fps + 1e-6);
      if (anim.loop) fi = ((fi % n) + n) % n;
      else fi = Math.min(fi, total - 1) % n;
      if (!anim.loop && Math.floor(anim.t * am.fps + 1e-6) >= total) fi = n - 1;
      const frameName = am.frames[fi];
      const atlas = am.atlas ?? meta.atlas;
      if (!this.textures.exists(atlas)) {
        this.ensure([atlas]);
        continue;
      }
      const fm = (am.atlas ? meta.extra?.[am.atlas]?.[frameName] : meta.frames[frameName]) ?? meta.frames[frameName];
      const sp = v.sprite;
      if (sp.texture.key !== atlas || sp.frame.name !== frameName) sp.setTexture(atlas, frameName);
      const flip = a.facing < 0;
      sp.setFlipX(flip);
      if (fm) sp.setOrigin(flip ? 1 - fm.ax : fm.ax, fm.ay);
      const def = engine.actorDef(id);
      const rel = id === 'pc' ? engine.chapter.pc.relHeight ?? 1 : def?.relHeight ?? 1;
      const scale = (ADULT_H * engine.scaleAt(a.y) * rel) / am.refH;
      sp.setScale(scale);
      sp.setPosition(a.x, a.y);
      sp.setDepth(a.y);
      sp.setTint(tint);
      sp.setVisible(true);
    }
    for (const [id, v] of this.actorViews) {
      if (!seen.has(id)) {
        v.sprite.destroy();
        this.actorViews.delete(id);
      }
    }
  }

  // ---------------------------------------------------------------- queries for the UI

  /** Screen position (logical, scene area) above an actor's head for speech. */
  speechAnchor(actorId: string): { x: number; y: number } | null {
    const v = this.actorViews.get(actorId);
    const a = this.engine.state.actors[actorId];
    if (!v || !a || a.room !== this.engine.state.room) return null;
    const top = v.sprite.getTopCenter();
    return { x: a.x - this.cameras.main.scrollX, y: (top.y ?? a.y - 150) - this.cameras.main.scrollY };
  }

  actorBounds(actorId: string): Phaser.Geom.Rectangle | null {
    const v = this.actorViews.get(actorId);
    return v ? v.sprite.getBounds() : null;
  }

  /** Target under a room-space point: actors (pixel-accurate) first, then hotspots. */
  targetAt(wx: number, wy: number): Target | null {
    const engine = this.engine;
    const s = engine.state;
    // Actors sorted front to back.
    const ids = [...this.actorViews.keys()].filter((id) => id !== 'pc' && engine.actorDef(id)).sort((a, b) => s.actors[b].y - s.actors[a].y);
    for (const id of ids) {
      const sp = this.actorViews.get(id)!.sprite;
      if (!sp.visible) continue;
      const b = sp.getBounds();
      if (!b.contains(wx, wy)) continue;
      if (this.alphaAt(sp, wx, wy) > 40 || this.nearBody(sp, wx, wy)) {
        const def = engine.actorDef(id)!;
        return { id: `actor:${id}`, name: dyn(def.name, s), exit: false };
      }
    }
    const h = engine.hotspotAt({ x: wx, y: wy });
    if (h) return { id: h.id, name: engine.hotspotName(h), exit: !!(h.exit && dyn(h.exit, s)) };
    return null;
  }

  /** Generous hit area: anywhere within the central body column counts. */
  private nearBody(sp: Phaser.GameObjects.Sprite, wx: number, wy: number): boolean {
    const b = sp.getBounds();
    const cx = sp.x;
    return Math.abs(wx - cx) < b.width * 0.22 && wy > b.y + b.height * 0.05 && wy < b.bottom;
  }

  private alphaAt(sp: Phaser.GameObjects.Sprite, wx: number, wy: number): number {
    const local = sp.getLocalPoint(wx, wy);
    let fx = Math.floor(local.x);
    const fy = Math.floor(local.y);
    if (sp.flipX) fx = sp.frame.width - 1 - fx;
    if (fx < 0 || fy < 0 || fx >= sp.frame.width || fy >= sp.frame.height) return 0;
    return this.textures.getPixelAlpha(fx, fy, sp.texture.key, sp.frame.name) ?? 0;
  }

  // ---------------------------------------------------------------- input

  private toWorld(p: Phaser.Input.Pointer): { wx: number; wy: number; sx: number; sy: number } {
    const cam = this.cameras.main;
    const sx = p.x / R;
    const sy = p.y / R;
    return { wx: sx + cam.scrollX, wy: sy + cam.scrollY, sx, sy };
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.ready) return;
    const { wx, wy, sx, sy } = this.toWorld(p);
    if (sy > VIEW_H) {
      this.hooks.hover(null, sx, sy);
      return;
    }
    const t = this.targetAt(wx, wy);
    this.lastHover = t?.id ?? null;
    this.hooks.hover(t, sx, sy);
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (!this.ready) return;
    const { wx, wy, sx, sy } = this.toWorld(p);
    if (sy > VIEW_H) return;
    const t = this.targetAt(wx, wy);
    if (p.rightButtonDown()) this.hooks.context(t, wx, wy, sx, sy);
    else this.hooks.click(t, wx, wy, sx, sy);
  }

  private drawHighlight(room: RoomDef): void {
    const g = this.highlightGfx;
    g.clear();
    if (!this.highlight || this.engine.inputMode() !== 'free') return;
    for (const h of this.engine.visibleHotspots()) {
      if (!h.shape) continue;
      let cx: number;
      let cy: number;
      if ('poly' in h.shape) {
        const pts = toPoints(h.shape.poly);
        cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
        cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
        if (!pointInPoly({ x: cx, y: cy }, pts)) {
          cx = pts[0].x;
          cy = pts[0].y;
        }
      } else {
        cx = h.shape.x + h.shape.w / 2;
        cy = h.shape.y + h.shape.h / 2;
      }
      const exit = !!(h.exit && dyn(h.exit, this.engine.state));
      g.fillStyle(exit ? 0x9fd0ff : 0xffe2a0, 0.9);
      g.fillCircle(cx, cy, 5);
      g.lineStyle(2, 0x000000, 0.7);
      g.strokeCircle(cx, cy, 6);
    }
    for (const [id, v] of this.actorViews) {
      if (id === 'pc' || !this.engine.actorDef(id)) continue;
      const b = v.sprite.getBounds();
      g.fillStyle(0xffe2a0, 0.9);
      g.fillCircle(b.centerX, b.y + b.height * 0.3, 5);
      g.lineStyle(2, 0x000000, 0.7);
      g.strokeCircle(b.centerX, b.y + b.height * 0.3, 6);
    }
    void room;
  }

  get hoveredId(): string | null {
    return this.lastHover;
  }
}

function layerDepth(l: LayerDef): number {
  if (l.depth === 'back' || l.depth === undefined) return -50000;
  if (l.depth === 'front') return 50000;
  return l.depth;
}

function firstFrame(m: CharMeta): string {
  return m.anims.stand?.frames[0] ?? Object.keys(m.frames)[0];
}
