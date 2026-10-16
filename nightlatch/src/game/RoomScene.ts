import Phaser from 'phaser';
import type { Action, Target } from '../engine/game';
import type { Dir } from '../engine/types';
import { Actor, charMetas } from './actor';
import { ctl } from './controller';
import type { Pt, RoomMeta } from './meta';
import { NavMesh } from './path';
import { audio } from './services';

export const VIEW_H = 144;
export const roomMetas: Record<string, RoomMeta> = {};

interface HoverInfo {
  target: Target;
  name: string;
  verb: string;
  x: number;
  y: number;
}

/** Animated rain streaks inside rectangular regions. */
class Rain {
  g: Phaser.GameObjects.Graphics;
  drops: { x: number; y: number; v: number; l: number; r: number }[] = [];
  constructor(scene: Phaser.Scene, public regions: NonNullable<RoomMeta['rain']>) {
    this.g = scene.add.graphics().setDepth(5000);
    for (let ri = 0; ri < regions.length; ri++) {
      const r = regions[ri];
      const n = Math.round(((r.w * r.h) / (r.kind === 'outdoor' ? 90 : 60)) * r.density);
      for (let i = 0; i < n; i++) {
        this.drops.push({ x: r.x + Math.random() * r.w, y: r.y + Math.random() * r.h, v: 160 + Math.random() * 90,
          l: r.kind === 'outdoor' ? 4 + Math.random() * 4 : 2 + Math.random() * 3, r: ri });
      }
    }
  }
  update(dt: number) {
    const g = this.g;
    g.clear();
    for (const d of this.drops) {
      const r = this.regions[d.r];
      d.y += d.v * dt;
      d.x -= d.v * dt * 0.12;
      if (d.y > r.y + r.h) {
        d.y = r.y - d.l;
        d.x = r.x + Math.random() * r.w;
      }
      if (d.x < r.x) d.x += r.w;
      const top = Math.max(r.y, d.y);
      const bot = Math.min(r.y + r.h, d.y + d.l);
      if (bot <= top) continue;
      g.lineStyle(1, r.kind === 'outdoor' ? 0x8fa6c4 : 0x6f8aa8, r.kind === 'outdoor' ? 0.55 : 0.45);
      g.lineBetween(Math.round(d.x), Math.round(top), Math.round(d.x - (bot - top) * 0.12), Math.round(bot));
    }
  }
  destroy() {
    this.g.destroy();
  }
}

export class RoomScene extends Phaser.Scene {
  meta!: RoomMeta;
  roomId = '';
  nav!: NavMesh;
  player!: Actor;
  npcs = new Map<string, Actor>();
  bg?: Phaser.GameObjects.Image;
  objects = new Map<string, Phaser.GameObjects.Image>();
  animSprites = new Map<string, Phaser.GameObjects.Sprite>();
  rain?: Rain;
  hover: HoverInfo | null = null;
  private actToken = 0;
  private markers: Phaser.GameObjects.GameObject[] = [];
  private variantNow = '';
  blurFx?: Phaser.FX.Blur | null;

  constructor() {
    super('room');
  }

  create() {
    this.cameras.main.setViewport(0, 0, 320, VIEW_H);
    this.cameras.main.setRoundPixels(true);
    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.keyboard?.on('keydown-TAB', (e: KeyboardEvent) => {
      e.preventDefault();
      this.showHotspots();
    });
    this.input.keyboard?.on('keydown-SPACE', () => this.showHotspots());
    this.events.once('shutdown', () => this.clearRoom());
  }

  // ----------------------------------------------------------------- loading ----
  private texturesFor(id: string): [string, string][] {
    const m = roomMetas[id];
    const list: [string, string][] = [[`room:${id}:bg`, `assets/rooms/${id}/bg.png`]];
    for (const v of m.variants ?? []) list.push([`room:${id}:bg_${v}`, `assets/rooms/${id}/bg_${v}.png`]);
    for (const [name, o] of Object.entries(m.objects ?? {})) {
      list.push([`room:${id}:obj:${name}`, `assets/rooms/${id}/obj_${name}.png`]);
      for (const v of o.variants ?? []) list.push([`room:${id}:obj:${name}_${v}`, `assets/rooms/${id}/obj_${name}_${v}.png`]);
    }
    return list;
  }

  ensureLoaded(id: string): Promise<void> {
    const m = roomMetas[id];
    if (!m) return Promise.reject(new Error('no room meta ' + id));
    const missing = this.texturesFor(id).filter(([k]) => !this.textures.exists(k));
    const anims: [string, string, { frameWidth: number; frameHeight: number }][] = [];
    for (const [n, a] of Object.entries(m.anims ?? {})) {
      for (const v of ['', ...(a.variants ?? [])]) {
        const suffix = v ? `${n}_${v}` : n;
        if (!this.textures.exists(`room:${id}:anim:${suffix}`)) {
          anims.push([`room:${id}:anim:${suffix}`, `assets/rooms/${id}/anim_${suffix}.png`, { frameWidth: a.w, frameHeight: a.h }]);
        }
      }
    }
    if (!missing.length && !anims.length) return Promise.resolve();
    return new Promise((resolve) => {
      for (const [k, url] of missing) this.load.image(k, url);
      for (const [k, url, frame] of anims) this.load.spritesheet(k, url, frame);
      this.load.once('complete', () => resolve());
      this.load.start();
    });
  }

  clearRoom() {
    this.bg?.destroy();
    this.bg = undefined;
    for (const o of this.objects.values()) o.destroy();
    this.objects.clear();
    for (const s of this.animSprites.values()) s.destroy();
    this.animSprites.clear();
    for (const n of this.npcs.values()) n.destroy();
    this.npcs.clear();
    this.rain?.destroy();
    this.rain = undefined;
    this.player?.destroy();
    for (const m of this.markers) m.destroy();
    this.markers = [];
  }

  async loadRoom(id: string, at?: string) {
    await this.ensureLoaded(id);
    this.clearRoom();
    this.roomId = id;
    if (this.hover) {
      this.hover = null; // nothing is under the pointer in the new room until it moves
      this.events.emit('hover', null);
    }
    const m = (this.meta = roomMetas[id]);
    this.nav = new NavMesh(m.walk.map((w) => ({ poly: w.poly, holes: w.holes })));
    this.cameras.main.setBounds(0, 0, m.w, VIEW_H);
    this.variantNow = ctl.game.variant(id);
    this.bg = this.add.image(0, 0, this.bgKey()).setOrigin(0, 0).setDepth(-1000);
    for (const [name, a] of Object.entries(m.anims ?? {})) {
      for (const v of ['', ...(a.variants ?? [])]) {
        const key = `room:${id}:anim:${v ? `${name}_${v}` : name}`;
        if (!this.anims.exists(`${key}:loop`)) {
          this.anims.create({ key: `${key}:loop`, frames: this.anims.generateFrameNumbers(key, {}), frameRate: a.fps, repeat: -1 });
        }
      }
      // ambient animations sort against characters by their depth (a floor y); none = part of the backdrop
      const s = this.add.sprite(a.x, a.y, this.animTex(name), 0).setOrigin(0, 0).setDepth(a.depth ?? -900);
      s.play({ key: `${this.animTex(name)}:loop`, startFrame: Math.floor(Math.random() * a.frames) });
      this.animSprites.set(name, s);
    }
    if (m.rain?.length) this.rain = new Rain(this, m.rain);
    // player
    const s = ctl.game.state;
    let px = s.pos.x;
    let py = s.pos.y;
    let face: Dir = s.pos.face;
    const pt = at ? m.points[at] : undefined;
    if (pt) {
      px = pt.x;
      py = pt.y;
      face = pt.face ?? face;
    } else if (at || !this.nav.inside(px, py)) {
      const st = m.points.start ?? m.points[Object.keys(m.points)[0]];
      if (st) {
        px = st.x;
        py = st.y;
        face = st.face ?? face;
      }
    }
    [px, py] = this.nav.clamp([px, py]);
    this.player = new Actor(this, this.playerSprite(), px, py, face);
    this.player.isPlayer = true;
    this.player.floor = m.floor ?? 'wood';
    this.player.scaleFn = this.scaleFn();
    this.player.updateScale();
    this.player.idle();
    s.pos = { x: px, y: py, face };
    this.refresh();
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 1, 0, 0);
    this.cameras.main.centerOn(px, VIEW_H / 2);
  }

  playerSprite(): string {
    const g = ctl.game;
    for (const [c, id] of g.content.playerSprite ?? []) if (g.cond(c) && charMetas[id]) return id;
    return 'rook';
  }

  /** Swap the player sprite in place (e.g. when Rook puts his hat on). */
  private syncPlayerSprite() {
    const want = this.playerSprite();
    if (this.player && this.player.id !== want) {
      const { x, y, dir } = { x: this.player.x, y: this.player.y, dir: this.player.dir };
      const visible = this.player.sprite.visible;
      this.player.destroy();
      this.player = new Actor(this, want, x, y, dir);
      this.player.isPlayer = true;
      this.player.floor = this.meta.floor ?? 'wood';
      this.player.scaleFn = this.scaleFn();
      this.player.updateScale();
      this.player.sprite.setVisible(visible);
      this.cameras.main.startFollow(this.player.sprite, true, 0.12, 1, 0, 0);
    }
  }

  scaleFn() {
    const sc = this.meta.scale;
    if (!sc) return () => 1;
    return (y: number) => {
      const t = (y - sc.yFar) / (sc.yNear - sc.yFar || 1);
      return Math.min(1, sc.sFar + (sc.sNear - sc.sFar) * t);
    };
  }

  private bgKey() {
    const v = this.variantNow;
    return v && this.textures.exists(`room:${this.roomId}:bg_${v}`) ? `room:${this.roomId}:bg_${v}` : `room:${this.roomId}:bg`;
  }

  /** Sync objects, NPCs, variant and blocks with the logic state. */
  refresh() {
    if (!this.meta || !ctl.game || !this.sys.isActive()) return;
    const g = ctl.game;
    if (g.state.room !== this.roomId) return;
    const v = g.variant(this.roomId);
    if (v !== this.variantNow) {
      this.variantNow = v;
      this.bg?.setTexture(this.bgKey());
      for (const [name, img] of this.objects) img.setTexture(this.objKey(name));
      for (const [name, spr] of this.animSprites) {
        const frame = spr.anims.currentFrame?.index ?? 0;
        spr.play({ key: `${this.animTex(name)}:loop`, startFrame: Math.max(0, frame - 1) });
      }
    }
    const visible = new Set(g.objectsVisible(this.roomId));
    for (const [name, o] of Object.entries(this.meta.objects ?? {})) {
      const want = o.state ? visible.has(name) : o.baseline !== null || o.depth !== null;
      let img = this.objects.get(name);
      if (want && !img) {
        img = this.add.image(o.x, o.y, this.objKey(name)).setOrigin(0, 0);
        img.setDepth(o.depth ?? o.baseline ?? -500);
        this.objects.set(name, img);
      } else if (!want && img) {
        img.destroy();
        this.objects.delete(name);
      }
    }
    // NPCs
    const here = g.npcsHere(this.roomId);
    const ids = new Set(here.map((n) => n.id));
    for (const [id, a] of this.npcs) if (!ids.has(id)) {
      a.destroy();
      this.npcs.delete(id);
    }
    for (const n of here) {
      const pt = this.meta.points[n.at];
      if (!pt) continue;
      let a = this.npcs.get(n.id);
      const sprite = n.def.sprite;
      if (!charMetas[sprite]) continue;
      if (!a) {
        a = new Actor(this, sprite, pt.x, pt.y, n.face ?? pt.face ?? 'down');
        const fixed = pt.scale;
        a.scaleFn = fixed ? () => fixed : this.scaleFn();
        a.updateScale();
        if (n.pose && a.has(n.pose)) a.hold(n.pose);
        this.npcs.set(n.id, a);
      } else if (Math.abs(a.x - pt.x) > 1 || Math.abs(a.y - pt.y) > 1) {
        if (a.state !== 'walk') a.setPos(pt.x, pt.y);
      }
    }
    this.syncPlayerSprite();
    // dynamic blocks
    const room = g.content.rooms[this.roomId];
    const blocks = (room.blocks ?? []).filter((b) => g.cond(b.when)).map((b) => b.poly as Pt[]);
    this.nav.setBlocks(blocks);
    this.player.setPos(this.player.x, this.player.y);
    const noPlayer = room.noPlayer ? g.cond(room.noPlayer) : false;
    this.player.sprite.setVisible(!noPlayer);
  }

  private animTex(name: string) {
    const v = this.variantNow;
    const a = this.meta.anims[name];
    return v && a?.variants?.includes(v) ? `room:${this.roomId}:anim:${name}_${v}` : `room:${this.roomId}:anim:${name}`;
  }

  private objKey(name: string) {
    const v = this.variantNow;
    const k = `room:${this.roomId}:obj:${name}_${v}`;
    return v && this.textures.exists(k) ? k : `room:${this.roomId}:obj:${name}`;
  }

  // ------------------------------------------------------------------- input ----
  actorFor(who: string): Actor | null {
    if (who === 'rook') return this.player;
    return this.npcs.get(who) ?? null;
  }

  /** What is under the pointer (world coords)? NPCs first, then smallest hotspot. */
  pick(x: number, y: number): HoverInfo | null {
    const g = ctl.game;
    const npcsHere = g.npcsHere(this.roomId);
    let bestN: HoverInfo | null = null;
    let bestDepth = -Infinity;
    for (const n of npcsHere) {
      const a = this.npcs.get(n.id);
      if (!a || !a.sprite.visible) continue;
      if (a.hitTest(x, y) && a.sprite.depth > bestDepth) {
        bestDepth = a.sprite.depth;
        bestN = { target: { kind: 'npc', id: n.id }, name: n.def.name, verb: n.def.verb ?? 'Talk to', x: a.x, y: a.y - 30 };
      }
    }
    if (bestN) return bestN;
    let best: HoverInfo | null = null;
    let bestArea = Infinity;
    for (const [id, h] of g.hotspots()) {
      const hm = this.meta.hotspots[id];
      if (!hm?.poly) continue;
      if (!pointIn(x, y, hm.poly)) continue;
      const area = polyArea(hm.poly);
      if (area < bestArea) {
        bestArea = area;
        const verb = h.verb ?? (h.exit ? 'Go to' : 'Use');
        const c = centroid(hm.poly);
        best = { target: { kind: 'hs', id }, name: h.name, verb, x: c[0], y: c[1] };
      }
    }
    return best;
  }

  private onMove(p: Phaser.Input.Pointer) {
    if (!this.meta || p.y >= VIEW_H || ctl.inputLocked) {
      if (this.hover) {
        this.hover = null;
        this.events.emit('hover', null);
      }
      return;
    }
    const h = this.pick(p.worldX, p.worldY);
    if (h?.target.id !== this.hover?.target.id || h?.target.kind !== this.hover?.target.kind) {
      this.hover = h;
      this.events.emit('hover', h);
    }
  }

  private onDown(p: Phaser.Input.Pointer) {
    if (!this.meta || ctl.inputLocked) return;
    if (p.y >= VIEW_H) return;
    if (ctl.game.busy || ctl.game.inDialog) {
      ctl.presenter.skip();
      return;
    }
    const right = p.rightButtonDown();
    const target = this.pick(p.worldX, p.worldY);
    if (right) {
      if (ctl.heldItem) {
        ctl.heldItem = null;
        this.events.emit('held', null);
        return;
      }
      if (target) void this.act({ t: 'look', target: target.target }, target, false);
      return;
    }
    if (target) {
      const action: Action = ctl.heldItem
        ? { t: 'item', item: ctl.heldItem, target: target.target }
        : { t: 'use', target: target.target };
      if (ctl.heldItem) {
        ctl.heldItem = null;
        this.events.emit('held', null);
      }
      void this.act(action, target, true);
    } else {
      if (ctl.heldItem) {
        ctl.heldItem = null;
        this.events.emit('held', null);
      }
      this.actToken++;
      void this.walkPlayer([p.worldX, p.worldY]);
    }
  }

  async walkPlayer(to: Pt) {
    const path = this.nav.find([this.player.x, this.player.y], to);
    this.player.stopWalking();
    await this.player.walk(path);
    ctl.game.state.pos = { x: this.player.x, y: this.player.y, face: this.player.dir };
  }

  /** Walk to the target if needed, then perform the logic action. */
  async act(action: Action, info: HoverInfo, walk: boolean) {
    const token = ++this.actToken;
    const g = ctl.game;
    if (walk) {
      let to: Pt | null = null;
      let face: Dir | undefined;
      if (info.target.kind === 'hs') {
        const hm = this.meta.hotspots[info.target.id];
        const def = g.room(this.roomId).hotspots[info.target.id];
        if (!def?.noWalk && hm?.walk) {
          to = hm.walk;
          face = hm.face;
        }
      } else {
        const a = this.npcs.get(info.target.id);
        if (a) {
          const side = this.player.x < a.x ? -1 : 1;
          to = [a.x + side * 22 * a.size, a.y + 1];
          if (!this.nav.inside(to[0], to[1])) to = [a.x - side * 22 * a.size, a.y + 1];
        }
      }
      if (to) {
        const path = this.nav.find([this.player.x, this.player.y], to);
        this.player.stopWalking();
        await this.player.walk(path);
        if (token !== this.actToken) return;
        ctl.game.state.pos = { x: this.player.x, y: this.player.y, face: this.player.dir };
      }
      if (info.target.kind === 'npc') {
        const a = this.npcs.get(info.target.id);
        if (a) {
          this.player.faceTowards(a.x, a.y);
          a.faceTowards(this.player.x, this.player.y);
        }
      } else if (face) this.player.face(face);
      else this.player.faceTowards(info.x, info.y);
    } else {
      this.player.stopWalking();
      this.player.faceTowards(info.x, info.y);
    }
    if (token !== this.actToken) return;
    // map exits open the city map
    if (action.t === 'use' && info.target.kind === 'hs') {
      const def = g.room(this.roomId).hotspots[info.target.id];
      if (def?.exit?.map && g.cond(def.exit.when)) {
        this.events.emit('openMap');
        return;
      }
    }
    await g.perform(action);
    this.events.emit('changed');
  }

  showHotspots() {
    for (const m of this.markers) m.destroy();
    this.markers = [];
    const g = ctl.game;
    if (!g || g.busy) return;
    for (const [id, h] of g.hotspots()) {
      const hm = this.meta.hotspots[id];
      if (!hm?.poly) continue;
      const [cx, cy] = centroid(hm.poly);
      const dot = this.add.image(Math.round(cx), Math.round(cy), 'ui', 'marker').setDepth(9000);
      const t = this.add.bitmapText(Math.round(cx), Math.round(cy) - 9, 'nlo', h.name).setOrigin(0.5, 1).setDepth(9001)
        .setTint(0xe8d8a8);
      this.markers.push(dot, t);
    }
    for (const n of g.npcsHere(this.roomId)) {
      const a = this.npcs.get(n.id);
      if (!a) continue;
      const t = this.add.bitmapText(Math.round(a.x), Math.round(a.headY()) - 2, 'nlo', n.def.name).setOrigin(0.5, 1)
        .setDepth(9001).setTint(0xa8e0ff);
      this.markers.push(t);
    }
    this.time.delayedCall(1600, () => {
      for (const m of this.markers) m.destroy();
      this.markers = [];
    });
  }

  setBlur(level: number) {
    const cam = this.cameras.main;
    if (level > 0) {
      if (!this.blurFx && cam.postFX) this.blurFx = cam.postFX.addBlur(1, 1, 1, level);
      else if (this.blurFx) this.blurFx.strength = level;
    } else if (this.blurFx) {
      cam.postFX.remove(this.blurFx);
      this.blurFx = null;
    }
  }

  update(time: number, delta: number) {
    if (!this.meta) return;
    this.player?.tick(time);
    for (const n of this.npcs.values()) n.tick(time);
    this.rain?.update(delta / 1000);
  }

  stepAudio() {
    audio.sfx('pickup');
  }
}

function pointIn(x: number, y: number, poly: Pt[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) inside = !inside;
  }
  return inside;
}

function polyArea(poly: Pt[]) {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
  return Math.abs(a / 2);
}

function centroid(poly: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p[0];
    y += p[1];
  }
  return [x / poly.length, y / poly.length];
}
