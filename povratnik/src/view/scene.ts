// Phaser renderer for the engine state: room, layers, actors, ambience and fades.
// It never changes game state itself; player input goes to the UI as targets and then to the
// engine as intents.
import Phaser from 'phaser';
import type { Engine } from '../core/engine';
import { dyn, LayerDef, RoomDef } from '../core/content';
import { ADULT_H, charMeta, imageMeta, CharMeta, FrameMeta } from '../content/assets';
import { pointInPoly, toPoints } from '../core/geom';
import { Ambience } from './ambience';
import { FxLayer } from './fx';
import { placeDecor, DecorPlacement } from '../core/decor';

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
  /** Dusk and night: darkens the picture under the fade and above everything in the room. */
  private shadeRect!: Phaser.GameObjects.Rectangle;
  private roomId = '';
  private loadingKeys = new Set<string>();
  private ready = false;
  private ambience!: Ambience;
  private fxLayer!: FxLayer;
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
    this.shadeRect = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x0a1028, 1).setOrigin(0, 0).setScrollFactor(0).setDepth(60000).setVisible(false);
    this.highlightGfx = this.add.graphics().setDepth(90000);
    this.ambience = new Ambience(this);
    this.fxLayer = new FxLayer(this);
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
    for (const d of room.decor ?? []) {
      const m = charMeta(d.character);
      if (m) keys.add(m.atlas);
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
    for (const v of this.decorViews.values()) v.destroy();
    this.decorViews.clear();
    for (const v of this.layerViews.values()) v.destroy();
    this.layerViews.clear();
    this.ambience.clear();
    this.fxLayer.clear();
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
    this.syncInsert();
    const shade = room.shade !== undefined ? dyn(room.shade, s) : 0;
    this.shadeRect.setFillStyle(room.shadeColor ?? 0x0a1028, 1).setAlpha(shade).setVisible(shade > 0.001);
    this.ambience.update(dt, engine);
    this.fxLayer.update(engine, (keys) => void this.ensure(keys), (id, k) => this.actorPoint(id, k));
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
      v.setAlpha(l.alpha ?? 1);
      v.setFlipX(!!l.flipX);
      v.setTint(room.layerTint !== undefined && !imgKey.startsWith('occ_') ? dyn(room.layerTint, s) : 0xffffff);
      v.setDepth(layerDepth(l));
      if (l.rect) {
        v.setOrigin(0, 0);
        v.setPosition(l.rect[0], l.rect[1]);
        v.setDisplaySize(l.rect[2], l.rect[3]);
      } else {
        v.setPosition(l.x, l.y);
        const fm = tf.frame ? atlasFrameMeta(tf.texture, tf.frame) : undefined;
        if (l.origin) v.setOrigin(l.origin[0], l.origin[1]);
        else if (fm) v.setOrigin(l.flipX ? 1 - fm.ax : fm.ax, fm.ay);
        else v.setOrigin(0, 0);
        v.setScale(l.scale ?? 1);
      }
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
      const def = engine.actorDef(id);
      const rel = id === 'pc' ? engine.chapter.pc.relHeight ?? 1 : def?.relHeight ?? 1;
      this.applyFigure(v.sprite, meta, anim.name, anim.t, anim.loop, anim.times, a.x, a.y, a.facing, rel, tint);
    }
    for (const [id, v] of this.actorViews) {
      if (!seen.has(id)) {
        v.sprite.destroy();
        this.actorViews.delete(id);
      }
    }
    // Decor figures (non-interactive unless a hotspot is bound to them). Leaders before followers.
    const dseen = new Set<string>();
    const placed = new Map<string, { p: DecorPlacement; scale: number }>();
    const decor = [...(room.decor ?? [])].sort((a, b) => (a.follow ? 1 : 0) - (b.follow ? 1 : 0));
    for (const d of decor) {
      if (d.visible && !d.visible(s)) continue;
      const meta = charMeta(d.character);
      if (!meta || !this.textures.exists(meta.atlas)) continue;
      let p = placeDecor(d, engine.clock);
      if (d.follow) {
        const lead = placed.get(d.follow.id);
        if (!lead || lead.p.hidden) continue;
        const bob = d.follow.bob ? Math.abs(Math.sin(Math.PI * (d.follow.bobHz ?? 1) * engine.clock)) * d.follow.bob : 0;
        p = {
          ...p,
          x: lead.p.x + d.follow.dx * lead.scale * lead.p.facing,
          y: lead.p.y,
          facing: lead.p.facing,
          alpha: lead.p.alpha * (d.alpha ?? 1),
        };
        this.decorLift.set(d.id, (d.follow.dy - bob) * lead.scale);
      }
      if (p.hidden) continue;
      dseen.add(d.id);
      let sp = this.decorViews.get(d.id);
      if (!sp) {
        sp = this.add.sprite(p.x, p.y, meta.atlas, firstFrame(meta));
        this.decorViews.set(d.id, sp);
      }
      this.applyFigure(sp, meta, p.anim, p.t, true, 1, p.x, p.y, p.facing, d.relHeight ?? 1, tint, d.scale);
      const lift = this.decorLift.get(d.id);
      if (lift) sp.setY(p.y + lift);
      sp.setDepth(d.depth ?? (d.follow ? p.y + 0.5 : p.y));
      sp.setAlpha(p.alpha);
      placed.set(d.id, { p, scale: sp.scaleX });
    }
    for (const [id, sp] of this.decorViews) {
      if (!dseen.has(id)) {
        sp.destroy();
        this.decorViews.delete(id);
      }
    }
  }

  private decorViews = new Map<string, Phaser.GameObjects.Sprite>();
  private decorLift = new Map<string, number>();

  // ---------------------------------------------------------------- close-up insert

  private insertFrame: Phaser.GameObjects.Rectangle | null = null;
  private insertImg: Phaser.GameObjects.Image | null = null;
  private insertSprite: Phaser.GameObjects.Sprite | null = null;
  private insertShade: Phaser.GameObjects.Rectangle | null = null;
  private insertBand: Phaser.GameObjects.Rectangle | null = null;
  private insertBandEdge: Phaser.GameObjects.Rectangle | null = null;
  private insertMaskGfx: Phaser.GameObjects.Graphics | null = null;
  private insertMaskKey = '';

  /** A framed close-up in screen space above the room (below fades and the interface). */
  private syncInsert(): void {
    const v = this.engine.insertView;
    if (!v) {
      this.insertFrame?.setVisible(false);
      this.insertImg?.setVisible(false);
      this.insertShade?.setVisible(false);
      this.insertBand?.setVisible(false);
      this.insertBandEdge?.setVisible(false);
      this.insertSprite?.setVisible(false);
      return;
    }
    const x0 = Math.round((VIEW_W - v.w) / 2);
    const y0 = Math.round((VIEW_H - v.h) / 2) - 16;
    if (!this.insertFrame) this.insertFrame = this.add.rectangle(0, 0, 10, 10, 0x000000, 1).setOrigin(0, 0).setScrollFactor(0).setDepth(70000);
    this.insertFrame.setPosition(x0 - 4, y0 - 4).setSize(v.w + 8, v.h + 8).setStrokeStyle(2, 0xb59a6a, 0.9).setVisible(true);
    if (v.bg && v.crop && this.textures.exists(v.bg)) {
      const [cx, cy, cw, ch] = v.crop;
      const zx = v.w / cw;
      const zy = v.h / ch;
      if (!this.insertImg) this.insertImg = this.add.image(0, 0, v.bg).setOrigin(0, 0).setScrollFactor(0).setDepth(70001);
      if (this.insertImg.texture.key !== v.bg) this.insertImg.setTexture(v.bg);
      this.insertImg.setCrop(cx, cy, cw, ch).setScale(zx, zy).setPosition(x0 - cx * zx, y0 - cy * zy).setVisible(true);
    } else {
      if (v.bg && !this.textures.exists(v.bg)) this.ensure([v.bg]);
      this.insertImg?.setVisible(false);
    }
    if (!this.insertShade) this.insertShade = this.add.rectangle(0, 0, 10, 10, 0x0a1028, 1).setOrigin(0, 0).setScrollFactor(0).setDepth(70001.5);
    this.insertShade.setPosition(x0, y0).setSize(v.w, v.h).setAlpha(v.shade ?? 0).setVisible((v.shade ?? 0) > 0.001);
    if (!this.insertBand) {
      this.insertBand = this.add.rectangle(0, 0, 10, 10, 0x140f0b, 1).setOrigin(0, 0).setScrollFactor(0).setDepth(70003);
      this.insertBandEdge = this.add.rectangle(0, 0, 10, 2, 0x8a7350, 0.8).setOrigin(0, 0).setScrollFactor(0).setDepth(70003.5);
    }
    const band = v.band ?? 0;
    this.insertBand.setPosition(x0, y0).setSize(v.w, band).setVisible(band > 0);
    this.insertBandEdge!.setPosition(x0, y0 + band - 1).setSize(v.w, 2).setVisible(band > 0);
    const sp = v.sprite;
    const meta = sp ? charMeta(sp.character) : undefined;
    if (!sp || !meta || !this.textures.exists(meta.atlas)) {
      if (meta) this.ensure([meta.atlas]);
      this.insertSprite?.setVisible(false);
      return;
    }
    const am = meta.anims[sp.anim] ?? meta.anims.stand;
    const raw = Math.floor((this.engine.clock - v.t0) * am.fps + 1e-6);
    const n = am.frames.length;
    const frame = am.frames[am.loop ? ((raw % n) + n) % n : Math.min(n - 1, Math.max(0, raw))];
    if (!this.insertSprite) {
      this.insertSprite = this.add.sprite(0, 0, meta.atlas, frame).setScrollFactor(0).setDepth(70002);
      // The figure never spills over the panel's frame.
      this.insertMaskGfx = this.make.graphics({}, false).setScrollFactor(0);
      this.insertSprite.setMask(this.insertMaskGfx.createGeometryMask());
    }
    if (this.insertSprite.texture.key !== meta.atlas || this.insertSprite.frame.name !== frame) this.insertSprite.setTexture(meta.atlas, frame);
    const fm = meta.frames[frame];
    this.insertSprite.setFlipX(!!sp.flip);
    if (fm) this.insertSprite.setOrigin(sp.flip ? 1 - fm.ax : fm.ax, fm.ay);
    this.insertSprite.setScale(sp.scale).setPosition(x0 + sp.x, y0 + sp.y).setTint(v.tint ?? 0xffffff).setVisible(true);
    const key = `${x0},${y0},${v.w},${v.h}`;
    if (this.insertMaskKey !== key && this.insertMaskGfx) {
      this.insertMaskKey = key;
      this.insertMaskGfx.clear().fillStyle(0xffffff, 1).fillRect(x0, y0, v.w, v.h);
    }
  }

  /** Set frame, anchor, facing, perspective scale and depth of a figure sprite. */
  private applyFigure(
    sp: Phaser.GameObjects.Sprite,
    meta: CharMeta,
    animName: string,
    t: number,
    loop: boolean,
    times: number,
    x: number,
    y: number,
    facing: number,
    rel: number,
    tint: number,
    fixedScale?: number,
  ): void {
    const am = meta.anims[animName] ?? meta.anims.stand;
    const n = am.frames.length;
    const total = n * Math.max(1, times);
    const raw = Math.floor(t * am.fps + 1e-6);
    let fi: number;
    if (loop) fi = ((raw % n) + n) % n;
    else fi = raw >= total ? n - 1 : raw % n;
    const frameName = am.frames[fi];
    const atlas = am.atlas ?? meta.atlas;
    if (!this.textures.exists(atlas)) {
      this.ensure([atlas]);
      return;
    }
    const fm = (am.atlas ? meta.extra?.[am.atlas]?.[frameName] : meta.frames[frameName]) ?? meta.frames[frameName];
    if (sp.texture.key !== atlas || sp.frame.name !== frameName) sp.setTexture(atlas, frameName);
    const flip = facing !== (am.facing ?? meta.facing ?? 1);
    sp.setFlipX(flip);
    if (fm) sp.setOrigin(flip ? 1 - fm.ax : fm.ax, fm.ay);
    const scale = fixedScale ?? (ADULT_H * this.engine.scaleAt(y, undefined, x) * rel) / am.refH;
    sp.setScale(scale);
    sp.setPosition(x, y);
    sp.setDepth(y);
    sp.setTint(tint);
    sp.setVisible(true);
  }

  // ---------------------------------------------------------------- queries for the UI

  /** Screen position (logical, scene area) above an actor's head for speech. */
  speechAnchor(actorId: string): { x: number; y: number } | null {
    const v = this.actorViews.get(actorId);
    const a = this.engine.state.actors[actorId];
    if (a && a.room === this.engine.state.room && a.hidden) {
      // Drawn as part of a layer (e.g. seated on the Steinblock)?
      for (const l of this.engine.room.layers ?? []) {
        const frac = l.speakers?.[actorId];
        const lv = this.layerViews.get(l.id);
        if (frac === undefined || !lv || !lv.visible) continue;
        const b = lv.getBounds();
        return { x: b.x + b.width * frac - this.cameras.main.scrollX, y: b.y - this.cameras.main.scrollY };
      }
      // Painted as part of another figure (a pair of fighters): a fixed point in the room.
      const spot = this.engine.room.speakers?.[actorId];
      if (spot) {
        const p = dyn(spot, this.engine.state);
        return { x: p.x - this.cameras.main.scrollX, y: p.y - this.cameras.main.scrollY };
      }
      return null;
    }
    if (!v || !a || a.room !== this.engine.state.room) return null;
    const top = v.sprite.getTopCenter();
    return { x: a.x - this.cameras.main.scrollX, y: (top.y ?? a.y - 150) - this.cameras.main.scrollY };
  }

  /** A measured point of an actor's current frame (e.g. his sword hand) in room coordinates. */
  actorPoint(actorId: string, k: number): { x: number; y: number } | null {
    const v = this.actorViews.get(actorId);
    const a = this.engine.state.actors[actorId];
    if (!v || !a || !v.sprite.visible) return null;
    const p = charMeta(a.character)?.points?.[v.sprite.frame.name]?.[k];
    if (!p) return null;
    const dir = v.sprite.flipX ? -1 : 1;
    return { x: v.sprite.x + p[0] * Math.abs(v.sprite.scaleX) * dir, y: v.sprite.y + p[1] * v.sprite.scaleY };
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
    // The player character, when the chapter makes it a target (looking at oneself, the torn shirt).
    if (engine.selfTarget()) {
      const v = this.actorViews.get('pc');
      if (v && v.sprite.visible && v.sprite.getBounds().contains(wx, wy) && (this.alphaAt(v.sprite, wx, wy) > 40 || this.nearBody(v.sprite, wx, wy))) {
        return { id: 'self', name: dyn(engine.chapter.self!.name, s), exit: false };
      }
    }
    // Hotspots bound to (moving) decor figures, front to back.
    const bound = engine
      .visibleHotspots()
      .filter((h) => h.decor && this.decorViews.has(h.decor))
      .sort((a, b) => this.decorViews.get(b.decor!)!.depth - this.decorViews.get(a.decor!)!.depth);
    for (const h of bound) {
      const sp = this.decorViews.get(h.decor!)!;
      if (!sp.visible || sp.alpha < 0.3 || !sp.getBounds().contains(wx, wy)) continue;
      if (this.alphaAt(sp, wx, wy) > 40 || this.nearBody(sp, wx, wy)) return { id: h.id, name: engine.hotspotName(h), exit: false };
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

  /** Authoring overlay (?debug=1 or F9): walk areas, hotspot shapes, entries. */
  debug = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');

  private drawDebug(room: RoomDef): void {
    const g = this.highlightGfx;
    const s = this.engine.state;
    for (const area of dyn(room.walk, s)) {
      for (const ring of [area.outer, ...(area.holes ?? [])]) {
        g.lineStyle(2, ring === area.outer ? 0x00ff66 : 0xff3366, 0.9);
        g.beginPath();
        for (let i = 0; i < ring.length; i += 2) {
          if (i === 0) g.moveTo(ring[i], ring[i + 1]);
          else g.lineTo(ring[i], ring[i + 1]);
        }
        g.closePath();
        g.strokePath();
      }
    }
    for (const h of room.hotspots) {
      if (!h.shape) continue;
      const vis = !h.visible || h.visible(s);
      g.lineStyle(1, vis ? 0xffcc00 : 0x777777, 0.9);
      if ('poly' in h.shape) {
        const p = h.shape.poly;
        g.beginPath();
        for (let i = 0; i < p.length; i += 2) {
          if (i === 0) g.moveTo(p[i], p[i + 1]);
          else g.lineTo(p[i], p[i + 1]);
        }
        g.closePath();
        g.strokePath();
      } else g.strokeRect(h.shape.x, h.shape.y, h.shape.w, h.shape.h);
      const w = h.walkTo !== undefined ? dyn(h.walkTo, s) : null;
      if (w) {
        g.fillStyle(0x33aaff, 1);
        g.fillCircle(w.x, w.y, 3);
      }
    }
    for (const e of Object.values(room.entries)) {
      g.fillStyle(0xff66ff, 1);
      g.fillRect(e.x - 3, e.y - 3, 6, 6);
    }
  }

  private drawHighlight(room: RoomDef): void {
    const g = this.highlightGfx;
    g.clear();
    if (this.debug) this.drawDebug(room);
    if (!this.highlight || this.engine.inputMode() !== 'free') return;
    for (const h of this.engine.visibleHotspots()) {
      if (h.decor) {
        const sp = this.decorViews.get(h.decor);
        if (!sp || !sp.visible) continue;
        const b = sp.getBounds();
        g.fillStyle(0xffe2a0, 0.9);
        g.fillCircle(b.centerX, b.y + b.height * 0.35, 5);
        g.lineStyle(2, 0x000000, 0.7);
        g.strokeCircle(b.centerX, b.y + b.height * 0.35, 6);
        continue;
      }
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

/** Frame metadata of an atlas frame ('atlas/<key>' + frame name), if the atlas is a known sheet. */
function atlasFrameMeta(texture: string, frame: string): FrameMeta | undefined {
  if (!texture.startsWith('atlas/') && !texture.startsWith('chars/')) return undefined;
  const key = texture.slice(texture.indexOf('/') + 1);
  return charMeta(key)?.frames[frame];
}
