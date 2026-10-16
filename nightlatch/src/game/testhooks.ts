// Hooks for automated browser tests (Playwright). They only read state and report where
// things are on screen, so tests can drive the game with real mouse clicks. Harmless in
// normal play.
import type Phaser from 'phaser';
import type { Action } from '../engine/game';
import { routeTo } from '../engine/route';
import { deserialize, serialize } from '../engine/state';
import { ctl } from './controller';
import type { HudScene } from './HudScene';
import type { RoomScene } from './RoomScene';

const OVERLAYS = ['notebook', 'map', 'menu', 'doc', 'closeup', 'card', 'end'];

export function installTestHooks(game: Phaser.Game) {
  const room = () => game.scene.getScene('room') as RoomScene;
  const hud = () => game.scene.getScene('hud') as HudScene;
  const active = (k: string) => game.scene.isActive(k);
  window.__NL = {
    ctl,
    ready: () => !!game.scene.getScene('title') && game.scene.isActive('title'),
    inGame: () => !!ctl.game && active('room'),
    setFast: (v: boolean) => {
      ctl.fast = v;
    },
    state: () => (ctl.game ? JSON.parse(serialize(ctl.game.state)) : null),
    saveJson: () => (ctl.game ? serialize(ctl.game.state) : null),
    perform: (a: Action) => ctl.game.perform(a),
    busy: () => (ctl.game ? ctl.game.busy : 0),
    errors: () => (ctl.game ? ctl.game.errors : []),
    room: () => (ctl.game ? ctl.game.state.room : ''),
    overlays: () => OVERLAYS.filter(active),
    /** Nothing running: no script, dialogue, walk, transition or overlay. */
    idle: () => {
      const g = ctl.game;
      if (!g || !active('room')) return false;
      const r = room();
      return g.busy === 0 && !g.inDialog && ctl.inputLocked === 0 && r.player?.state !== 'walk' && !OVERLAYS.some(active);
    },
    /** A screen point (game coords) inside a hotspot that picks this hotspot; null if off screen. */
    hotspotPoint: (id: string) => {
      const r = room();
      const hm = r.meta?.hotspots[id];
      if (!hm?.poly) return null;
      const cam = r.cameras.main;
      const xs = hm.poly.map((p) => p[0]);
      const ys = hm.poly.map((p) => p[1]);
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      let best: [number, number] | null = null;
      let bestD = Infinity;
      for (let y = Math.ceil(y0); y <= y1; y += 1) {
        for (let x = Math.ceil(x0); x <= x1; x += 1) {
          const sx = x - cam.scrollX;
          if (sx < 2 || sx > 317 || y < 2 || y > 141) continue;
          const hit = r.pick(x, y);
          if (hit?.target.kind !== 'hs' || hit.target.id !== id) continue;
          const d = (x - cx) ** 2 + (y - cy) ** 2;
          if (d < bestD) {
            bestD = d;
            best = [sx, y];
          }
        }
      }
      return best;
    },
    /** World x of a hotspot's centre, to walk towards it when it is off screen. */
    hotspotWorldX: (id: string) => {
      const hm = room().meta?.hotspots[id];
      if (!hm?.poly) return null;
      const xs = hm.poly.map((p) => p[0]);
      return (Math.min(...xs) + Math.max(...xs)) / 2;
    },
    cameraX: () => room().cameras.main.scrollX,
    /** A floor point (game coords) at roughly this screen x with no hotspot or NPC under it. */
    floorPoint: (sx: number) => {
      const r = room();
      const cam = r.cameras.main;
      for (const dx of [0, -6, 6, -12, 12, -20, 20, -30, 30]) {
        for (let y = 140; y > 60; y -= 2) {
          const wx = cam.scrollX + sx + dx;
          if (!r.nav.inside(wx, y) || r.pick(wx, y)) continue;
          return [sx + dx, y];
        }
      }
      return null;
    },
    npcWorldX: (id: string) => room().npcs.get(id)?.x ?? null,
    npcPoint: (id: string) => {
      const r = room();
      const a = r.npcs.get(id);
      if (!a) return null;
      const cam = r.cameras.main;
      for (const dy of [12, 18, 8, 24, 4, 30]) {
        const x = Math.round(a.x);
        const y = Math.round(a.y - dy * a.size);
        const hit = r.pick(x, y);
        if (hit?.target.kind === 'npc' && hit.target.id === id) return [x - cam.scrollX, y];
      }
      return null;
    },
    playerPos: () => {
      const p = room().player;
      return p ? [p.x - room().cameras.main.scrollX, p.y] : null;
    },
    /** HUD state: dialogue options, evidence picking, inventory slots, sentence line. */
    ui: () => {
      const h = hud();
      return h.testInfo();
    },
    cond: (expr: string) => (ctl.game ? ctl.game.cond(expr) : false),
    chapter: () => (ctl.game ? ctl.game.state.chapter : 0),
    ended: () => !!ctl.game?.state.ended,
    /** Next moves towards a room: [{action, via exit hotspot}] or null. */
    route: (target: string) => (ctl.game ? routeTo(ctl.game, target)?.map((e) => ({ a: e.a, via: e.via })) ?? null : null),
    /** Clickable text buttons in a scene (title menu, pause menu, save slots...). */
    buttons: (key: string) => {
      const sc = game.scene.getScene(key);
      if (!sc || !game.scene.isActive(key)) return [];
      return sc.children.list
        .filter((o) => o.type === 'BitmapText' && (o as Phaser.GameObjects.BitmapText).input?.enabled)
        .map((o) => {
          const t = o as Phaser.GameObjects.BitmapText;
          const b = t.getBounds();
          return { text: t.text, x: b.centerX, y: b.centerY };
        });
    },
    /** Close-up puzzle layout: wheel buttons, digits, jacks and the try button. */
    closeupInfo: () => {
      if (!active('closeup')) return null;
      const sc = game.scene.getScene('closeup') as unknown as {
        def: { id: string; kind: string; wheels?: number; solution: string; jacks?: string[] };
        digits: number[];
        jackPos: Record<string, [number, number]>;
      };
      const def = sc.def;
      const n = def.wheels ?? def.solution.length;
      const x0 = 160 - ((n - 1) * 26) / 2;
      return {
        id: def.id, kind: def.kind, digits: [...sc.digits], solution: def.solution,
        wheels: Array.from({ length: def.kind === 'combo' ? n : 0 }, (_, i) => ({ up: [x0 + i * 26, 64], down: [x0 + i * 26, 112] })),
        jacks: { ...sc.jackPos },
        tryButton: def.kind === 'combo' ? [160, 140] : [160, 150],
        close: [306, 12],
      };
    },
    /** Phaser's smoothed frame rate. */
    fps: () => game.loop.actualFps,
    /** Frames actually rendered during the next `ms` milliseconds, as frames per second. */
    measureFps: (ms = 1000) =>
      new Promise<number>((resolve) => {
        let frames = 0;
        const t0 = performance.now();
        const tick = (t: number) => {
          frames++;
          if (t - t0 < ms) requestAnimationFrame(tick);
          else resolve((frames * 1000) / (t - t0));
        };
        requestAnimationFrame(tick);
      }),
    texHas: (key: string, frame?: string) => game.textures.exists(key) && (frame === undefined || game.textures.get(key).has(frame)),
    hudIcons: () => {
      const h = hud() as unknown as { icons: Phaser.GameObjects.Image[] };
      return h.icons.map((i) => ({ visible: i.visible, frame: i.frame.name, alpha: i.alpha, depth: i.depth }));
    },
    mapPins: () => {
      if (!active('map') || !ctl.game) return [];
      return ctl.game.locations().map((l) => ({ id: l.id, x: l.x, y: l.y }));
    },
    loadState: async (json: string) => {
      const st = deserialize(json);
      const title = game.scene.getScene('title') as unknown as { launchGame(s: unknown): Promise<void> };
      for (const k of OVERLAYS) if (active(k)) game.scene.stop(k);
      await title.launchGame(st);
    },
    newGame: async () => {
      const title = game.scene.getScene('title') as unknown as { launchGame(s?: unknown): Promise<void> };
      await title.launchGame();
    },
  };
}
