// The game engine core: one authoritative state, generator scripts, movement, interactions.
// Runs identically in the browser (driven by the renderer's clock) and in Node simulations.
import { clamp, dist, pointInPoly, pointInRect, toPoints, Vec } from './geom';
import { NavMesh, WalkArea } from './path';
import { cloneState, emptyState, Facing, FlagValue, GameState, SAVE_VERSION, validateStateShape } from './state';
import type { ChoiceOption, Cmd, Script, ScriptFn } from './cmd';
import {
  ActorDef,
  ChapterDef,
  DialogueDef,
  dyn,
  Handler,
  HotspotDef,
  ItemDef,
  RoomDef,
  ScriptCtx,
  Spot,
  Verb,
} from './content';
import { CombatRuntime, CombatDef } from './combat';
import { UI_LINES } from './uilines';

// ---------------------------------------------------------------------------------------------
// Asset metadata the logic needs (animation lengths, walking speed, sizes).

export interface AnimInfo {
  frames: number;
  fps: number;
  loop: boolean;
}

export interface CharacterInfo {
  anims: Record<string, AnimInfo>;
  /** World pixels per second at perspective scale 1. */
  walkSpeed: number;
  /** Visible height in world px of the standing figure at scale 1 for relHeight 1. */
  baseHeight?: number;
}

export interface AssetMeta {
  characters: Record<string, CharacterInfo>;
}

export interface Settings {
  /** 0.6 (slow) .. 1 .. 1.6 (fast) */
  textSpeed: number;
  /** If false, speech waits for a click. */
  autoAdvance: boolean;
  reducedMotion: boolean;
  reducedFlash: boolean;
  /** Sword fights without decision timers. */
  relaxedCombat: boolean;
}

export const DEFAULT_SETTINGS: Settings = { textSpeed: 1, autoAdvance: true, reducedMotion: false, reducedFlash: false, relaxedCombat: false };

// ---------------------------------------------------------------------------------------------
// Transient presentation state (never saved).

export interface SpeechView {
  actor: string | null;
  text: string;
  mood?: string;
  t: number;
  dur: number;
  id: number;
}

export interface ChoiceView {
  options: ChoiceOption[];
  id: number;
}

export interface CardView {
  title: string;
  lines: string[];
  image?: string;
  cine?: string;
  t: number;
  dur: number;
}

export interface VignetteView {
  image: string;
  frames: number;
  fps: number;
  captions: string[];
  loop: boolean;
  t: number;
  dur: number;
}

interface ActorRT {
  path: Vec[];
  speed: number;
  anim: { name: string; t: number; loop: boolean; times: number; rest: boolean } | null;
  walkT: number;
  arrivedFace?: Facing;
}

export type Intent =
  | { k: 'walk'; x: number; y: number }
  | { k: 'act'; target: string; verb: Verb }
  | { k: 'useItem'; item: string; target: string }
  | { k: 'examine'; item: string }
  | { k: 'advance' }
  | { k: 'choose'; id: string }
  | { k: 'skip' }
  | { k: 'combat'; action: string }
  | { k: 'hint' };

export type EngineEvent =
  | { k: 'room'; room: string }
  | { k: 'chapter'; chapter: string }
  | { k: 'autosave'; reason: string }
  | { k: 'hint'; text: string; level: number; of: number }
  | { k: 'message'; text: string }
  | { k: 'inventory' }
  | { k: 'error'; text: string }
  | { k: 'gameEnd' }
  | { k: 'script'; id: string; phase: 'start' | 'end' | 'abort' };

export type InputMode = 'free' | 'busy' | 'speech' | 'choice' | 'card' | 'combat' | 'transition';

interface Active {
  cmd: Cmd;
  /** Returns true when finished. */
  update(dt: number, instant: boolean): boolean;
  result?: unknown;
  /** Called on advance-intent (speech). */
  advance?(): void;
}

class Runner {
  current: Active | null = null;
  lastResult: unknown = undefined;
  startedAt: number;
  constructor(
    public readonly id: string,
    public readonly gen: Script,
    public readonly epoch: number,
    now: number,
  ) {
    this.startedAt = now;
  }
}

const PC = 'pc';
const MAX_STEPS_PER_FRAME = 2000;

export interface ContentIndex {
  chapters: Map<string, ChapterDef>;
  order: string[];
  rooms: Map<string, RoomDef>;
  actors: Map<string, ActorDef>;
  items: Map<string, ItemDef>;
  dialogues: Map<string, DialogueDef>;
  combats: Map<string, CombatDef>;
}

export function indexContent(chapters: ChapterDef[], combats: CombatDef[] = []): ContentIndex {
  const idx: ContentIndex = {
    chapters: new Map(),
    order: chapters.map((c) => c.id),
    rooms: new Map(),
    actors: new Map(),
    items: new Map(),
    dialogues: new Map(),
    combats: new Map(),
  };
  for (const c of chapters) {
    idx.chapters.set(c.id, c);
    for (const r of c.rooms) {
      if (idx.rooms.has(r.id)) throw new Error(`duplicate room ${r.id}`);
      idx.rooms.set(r.id, r);
    }
    for (const a of c.actors) {
      if (idx.actors.has(a.id)) throw new Error(`duplicate actor ${a.id}`);
      idx.actors.set(a.id, a);
    }
    for (const i of c.items) {
      if (idx.items.has(i.id)) throw new Error(`duplicate item ${i.id}`);
      idx.items.set(i.id, i);
    }
    for (const d of c.dialogues) {
      if (idx.dialogues.has(d.id)) throw new Error(`duplicate dialogue ${d.id}`);
      idx.dialogues.set(d.id, d);
    }
  }
  for (const cb of combats) idx.combats.set(cb.id, cb);
  return idx;
}

export class Engine {
  state: GameState = emptyState();
  /** Last state that is safe to save while a script runs. */
  private stable: GameState = emptyState();
  settings: Settings;
  instant = false;
  /** Current script, if any. Its presence is the input lock; it releases itself on end/abort/load. */
  private runner: Runner | null = null;
  private queue: { id: string; fn: ScriptFn }[] = [];
  private skipping = false;
  speech: SpeechView | null = null;
  choiceView: ChoiceView | null = null;
  cardView: CardView | null = null;
  vignetteView: VignetteView | null = null;
  fadeLevel = 0;
  private fadeTarget = 0;
  private fadeSpeed = 2;
  camX = 0;
  private camLock: number | null = null;
  private camSpeed = 0;
  shakeT = 0;
  shakeAmp = 0;
  fx = new Map<string, Record<string, number | string | boolean>>();
  combat: CombatRuntime | null = null;
  private lastCombat: 'won' | 'yielded' | null = null;
  private rt = new Map<string, ActorRT>();
  private nav = new Map<string, { key: string; mesh: NavMesh }>();
  private pendingAct: { intent: Intent; target: string } | null = null;
  private listeners: ((e: EngineEvent) => void)[] = [];
  private speechSeq = 0;
  private transition = false;
  /** Incremented on every load / new game: anything started before belongs to a dead world. */
  epoch = 0;
  clock = 0;
  readonly log: string[] = [];
  gameEnded = false;

  constructor(
    readonly content: ContentIndex,
    readonly meta: AssetMeta,
    settings: Partial<Settings> = {},
  ) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
  }

  // ------------------------------------------------------------------ events

  on(fn: (e: EngineEvent) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit(e: EngineEvent): void {
    for (const l of this.listeners) l(e);
  }

  private trace(msg: string): void {
    this.log.push(`[${this.clock.toFixed(2)}] ${msg}`);
    if (this.log.length > 4000) this.log.splice(0, 1000);
  }

  // ------------------------------------------------------------------ lookups

  get chapter(): ChapterDef {
    const c = this.content.chapters.get(this.state.chapter);
    if (!c) throw new Error(`unknown chapter ${this.state.chapter}`);
    return c;
  }

  get room(): RoomDef {
    const r = this.content.rooms.get(this.state.room);
    if (!r) throw new Error(`unknown room ${this.state.room}`);
    return r;
  }

  roomDef(id: string): RoomDef | undefined {
    return this.content.rooms.get(id);
  }

  navFor(room: RoomDef): NavMesh {
    const walk: WalkArea[] = dyn(room.walk, this.state);
    const key = JSON.stringify(walk);
    const cached = this.nav.get(room.id);
    if (cached && cached.key === key) return cached.mesh;
    const mesh = new NavMesh(walk);
    this.nav.set(room.id, { key, mesh });
    return mesh;
  }

  /** Perspective scale for a standard adult standing at y (linear, as a pinhole camera over flat ground). */
  scaleAt(y: number, room: RoomDef = this.room): number {
    const p = room.perspective;
    const t = (y - p.farY) / (p.nearY - p.farY || 1);
    return Math.max(0.05, p.farScale + (p.nearScale - p.farScale) * t);
  }

  actorDef(id: string): ActorDef | undefined {
    return this.content.actors.get(id);
  }

  actorName(id: string): string {
    if (id === PC) return this.chapter.pc.name;
    const d = this.actorDef(id);
    return d ? dyn(d.name, this.state) : id;
  }

  actorColor(id: string | null): string {
    if (id === null) return '#e9dcc0';
    if (id === PC) return this.chapter.pc.color;
    return this.actorDef(id)?.color ?? '#ffffff';
  }

  charInfo(character: string): CharacterInfo | undefined {
    return this.meta.characters[character];
  }

  /** Actors visible in the current room, in placement order. */
  roomActors(): string[] {
    const out: string[] = [];
    for (const [id, a] of Object.entries(this.state.actors)) if (a.room === this.state.room && !a.hidden) out.push(id);
    return out;
  }

  /** Current animation of an actor for the renderer: name, time, looping and repeat count. */
  actorAnim(id: string): { name: string; t: number; loop: boolean; times: number } {
    const a = this.state.actors[id];
    const r = this.rt.get(id);
    if (r?.anim) return { name: r.anim.name, t: r.anim.t, loop: r.anim.loop, times: r.anim.times };
    if (r && r.path.length) return { name: 'walk', t: r.walkT, loop: true, times: 1 };
    const info = a ? this.charInfo(a.character)?.anims[a.pose] : undefined;
    // A non-looping resting pose shows its last frame.
    if (info && !info.loop) return { name: a.pose, t: 1e6, loop: false, times: 1 };
    return { name: a?.pose ?? 'stand', t: this.clock, loop: true, times: 1 };
  }

  isWalking(id: string): boolean {
    return (this.rt.get(id)?.path.length ?? 0) > 0;
  }

  // ------------------------------------------------------------------ script context

  private makeCtx(): ScriptCtx {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const eng = this;
    const ctx: ScriptCtx = {
      get s() {
        return eng.state;
      },
      flag: (n) => eng.state.flags[n],
      is: (n) => !!eng.state.flags[n],
      num: (n) => Number(eng.state.flags[n] ?? 0),
      set: (n, v = true) => {
        eng.state.flags[n] = v;
        eng.trace(`set ${n}=${String(v)}`);
      },
      unset: (n) => {
        delete eng.state.flags[n];
      },
      inc: (n, by = 1) => {
        const v = Number(eng.state.flags[n] ?? 0) + by;
        eng.state.flags[n] = v;
        return v;
      },
      has: (i) => eng.state.inventory.includes(i),
      give: (i) => {
        if (!eng.content.items.has(i)) throw new Error(`unknown item ${i}`);
        if (!eng.state.inventory.includes(i)) {
          eng.state.inventory.push(i);
          eng.trace(`give ${i}`);
          eng.emit({ k: 'inventory' });
        }
      },
      drop: (i) => {
        const k = eng.state.inventory.indexOf(i);
        if (k >= 0) {
          eng.state.inventory.splice(k, 1);
          eng.trace(`drop ${i}`);
          eng.emit({ k: 'inventory' });
        }
      },
      journal: (id, status = 'open') => {
        if (!(id in eng.chapter.journal)) throw new Error(`unknown journal entry ${id}`);
        const prev = eng.state.journal[id];
        if (prev === 'done' && status === 'open') return;
        eng.state.journal[id] = status;
      },
      seen: (id) => !!eng.state.seen[id],
      mark: (id) => {
        eng.state.seen[id] = true;
      },
      place: (id, p) => eng.placeActor(id, p),
      dialogue: (id) => eng.dialogueScript(id),
      lines: (actor, text) => eng.linesScript(actor, text),
      pick: (key, alts) => {
        const n = Number(eng.state.flags[`_pick.${key}`] ?? 0);
        eng.state.flags[`_pick.${key}`] = n + 1;
        return alts[n % alts.length];
      },
      get chapter() {
        return eng.chapter;
      },
      get room() {
        return eng.room;
      },
      get reducedMotion() {
        return eng.settings.reducedMotion;
      },
      get combatResult() {
        return eng.lastCombat;
      },
      emit: (cmd) => cmd,
    };
    return ctx;
  }

  private *linesScript(actor: string, text: string | readonly string[]): Script {
    const list = typeof text === 'string' ? [text] : text;
    for (const t of list) yield { k: 'say', actor, text: t };
  }

  private *dialogueScript(id: string): Script {
    const d = this.content.dialogues.get(id);
    if (!d) throw new Error(`unknown dialogue ${id}`);
    const ctx = this.makeCtx();
    this.faceEachOther(PC, d.actor);
    if (d.open) yield* d.open(ctx);
    for (;;) {
      const opts = d.options.filter((o) => (!o.when || o.when(this.state)) && (o.repeat || !this.state.seen[`dlg:${d.id}.${o.id}`]));
      const choices: ChoiceOption[] = opts.map((o) => ({ id: o.id, text: dyn(o.text, this.state) }));
      choices.push({ id: '__bye', text: dyn(d.bye, this.state) });
      const picked = (yield { k: 'choice', options: choices }) as string;
      if (picked === '__bye') {
        const byeText = dyn(d.bye, this.state);
        if (!byeText.startsWith('(')) yield { k: 'say', actor: PC, text: byeText };
        if (d.close) yield* d.close(ctx);
        return;
      }
      const o = opts.find((x) => x.id === picked);
      if (!o) continue;
      this.state.seen[`dlg:${d.id}.${o.id}`] = true;
      const text = dyn(o.text, this.state);
      if (!text.startsWith('(')) yield { k: 'say', actor: PC, text };
      yield* o.run(ctx);
      if (o.exit) return;
    }
  }

  private faceEachOther(a: string, b: string): void {
    const A = this.state.actors[a];
    const B = this.state.actors[b];
    if (!A || !B || A.room !== B.room) return;
    if (Math.abs(A.x - B.x) < 1) return;
    A.facing = B.x > A.x ? 1 : -1;
    B.facing = A.x > B.x ? 1 : -1;
  }

  // ------------------------------------------------------------------ actors

  placeActor(id: string, p: Partial<{ room: string | null; x: number; y: number; facing: Facing; pose: string; hidden: boolean; character: string }>): void {
    let a = this.state.actors[id];
    if (!a) {
      const def = this.actorDef(id);
      a = this.state.actors[id] = {
        character: def?.character ?? 'unknown',
        room: null,
        x: 0,
        y: 0,
        facing: 1,
        pose: 'stand',
        hidden: false,
      };
    }
    Object.assign(a, p);
    const r = this.rt.get(id);
    if (r && (p.x !== undefined || p.y !== undefined || p.room !== undefined)) r.path = [];
    if (r && p.pose !== undefined) r.anim = null;
  }

  private rtOf(id: string): ActorRT {
    let r = this.rt.get(id);
    if (!r) {
      r = { path: [], speed: 0, anim: null, walkT: 0 };
      this.rt.set(id, r);
    }
    return r;
  }

  private startWalk(id: string, to: Vec, speed?: number, face?: Facing): boolean {
    const a = this.state.actors[id];
    if (!a || a.room !== this.state.room) return false;
    const room = this.room;
    const nav = this.navFor(room);
    const path = nav.findPath({ x: a.x, y: a.y }, to);
    const r = this.rtOf(id);
    r.anim = null;
    r.path = path;
    r.arrivedFace = face;
    r.speed = speed ?? this.charInfo(a.character)?.walkSpeed ?? 120;
    if (!path.length) {
      if (face) a.facing = face;
      return false;
    }
    return true;
  }

  private stepActors(dt: number): void {
    for (const [id, r] of this.rt) {
      const a = this.state.actors[id];
      if (!a) continue;
      if (r.anim) r.anim.t += dt;
      if (!r.path.length) continue;
      r.walkT += dt;
      let budget = (this.instant ? 1e9 : dt) * r.speed * this.scaleAt(a.y);
      while (budget > 0 && r.path.length) {
        const tgt = r.path[0];
        const d = dist(a, tgt);
        const dx = tgt.x - a.x;
        if (Math.abs(dx) > 0.5 && (Math.abs(dx) > Math.abs(tgt.y - a.y) * 0.35 || d < budget)) a.facing = dx > 0 ? 1 : -1;
        if (d <= budget) {
          a.x = tgt.x;
          a.y = tgt.y;
          budget -= d;
          r.path.shift();
        } else {
          a.x += ((tgt.x - a.x) / d) * budget;
          a.y += ((tgt.y - a.y) / d) * budget;
          budget = 0;
        }
      }
      if (!r.path.length) {
        r.walkT = 0;
        if (r.arrivedFace) a.facing = r.arrivedFace;
      }
    }
  }

  // ------------------------------------------------------------------ game lifecycle

  /** Start a chapter from its beginning (new game or chapter menu). */
  newChapter(chapterId: string, keep?: GameState): void {
    const ch = this.content.chapters.get(chapterId);
    if (!ch) throw new Error(`unknown chapter ${chapterId}`);
    this.resetRuntime();
    const s = emptyState();
    if (keep) {
      s.flags = { ...keep.flags };
      s.seen = { ...keep.seen };
      s.hintLevels = { ...keep.hintLevels };
      s.reached = [...keep.reached];
      s.playTime = keep.playTime;
    }
    s.chapter = ch.id;
    s.room = ch.start.room;
    if (!s.reached.includes(ch.id)) s.reached.push(ch.id);
    this.state = s;
    // Actors of this chapter start fresh.
    for (const a of ch.actors) {
      if (!a.start) continue;
      s.actors[a.id] = {
        character: a.character,
        room: a.start.room,
        x: a.start.x,
        y: a.start.y,
        facing: a.start.facing,
        pose: a.start.pose ?? 'stand',
        hidden: !!a.start.hidden,
      };
    }
    const entry = this.room.entries[ch.start.entry];
    if (!entry) throw new Error(`chapter ${ch.id}: unknown start entry ${ch.start.entry}`);
    s.actors[PC] = { character: ch.pc.character, room: ch.start.room, x: entry.x, y: entry.y, facing: entry.face ?? 1, pose: 'stand', hidden: false };
    // Journal entries are per chapter; earlier entries are dropped from the active view.
    s.journal = {};
    const ctx = this.makeCtx();
    ch.setup?.(ctx);
    this.snapCamera();
    this.fadeLevel = 1;
    this.fadeTarget = 1;
    this.stable = cloneState(this.state);
    this.emit({ k: 'chapter', chapter: ch.id });
    this.emit({ k: 'room', room: s.room });
    this.stable.resume = '@chapter';
    this.startScript(`chapter:${ch.id}`, this.chapterStartScript(ch));
  }

  /** Chapter card, intro and first room entry; a save taken before its end replays it. */
  private chapterStartScript(ch: ChapterDef): ScriptFn {
    const self = this;
    return function* (c: ScriptCtx): Script {
      self.fadeLevel = 1;
      self.fadeTarget = 1;
      yield { k: 'card', title: ch.title, lines: [ch.dateline, ...ch.card.lines], image: ch.card.image, cine: ch.card.cine };
      yield { k: 'fade', to: 0, t: 0.8 };
      if (ch.intro) yield* ch.intro(c);
      const r = self.room;
      if (r.onEnter) yield* r.onEnter(c);
      yield { k: 'checkpoint', resume: null };
    };
  }

  /** Load a saved state. Returns an error message or null. */
  load(data: unknown): string | null {
    const err = validateStateShape(data);
    if (err) return err;
    const s = cloneState(data as GameState);
    if (!this.content.chapters.has(s.chapter)) return `Kapitel ${s.chapter} unbekannt`;
    const room = this.content.rooms.get(s.room);
    if (!room) return `Raum ${s.room} unbekannt`;
    if (!s.actors[PC]) return 'Spielfigur fehlt';
    for (const i of s.inventory) if (!this.content.items.has(i)) return `Gegenstand ${i} unbekannt`;
    if (s.resume && s.resume !== '@chapter') {
      const ch = this.content.chapters.get(s.chapter)!;
      if (!ch.resumes?.[s.resume]) return `Fortsetzung ${s.resume} unbekannt`;
    }
    this.resetRuntime();
    this.state = s;
    // Never trust saved positions blindly: keep the player inside the walkable area.
    const pc = s.actors[PC];
    if (pc.room === s.room) {
      const nav = this.navFor(room);
      const p = nav.nearestWalkable(pc);
      pc.x = p.x;
      pc.y = p.y;
    }
    this.snapCamera();
    this.fadeLevel = 1;
    this.fadeTarget = 0;
    this.stable = cloneState(s);
    this.emit({ k: 'chapter', chapter: s.chapter });
    this.emit({ k: 'room', room: s.room });
    if (s.resume === '@chapter') {
      this.startScript(`chapter:${s.chapter}`, this.chapterStartScript(this.chapter));
    } else if (s.resume) {
      const id = s.resume;
      const fn = this.chapter.resumes![id];
      this.startScript(`resume:${id}`, fn);
    }
    this.trace(`load ${s.chapter}/${s.room}`);
    return null;
  }

  /** The state to write into a save slot right now. */
  saveData(): GameState {
    if (!this.runner && !this.transition && !this.queue.length) {
      const s = cloneState(this.state);
      s.resume = null;
      return s;
    }
    return cloneState(this.stable);
  }

  /** True if saving now captures the live state (false: last checkpoint). */
  canSaveLive(): boolean {
    return !this.runner && !this.transition && !this.queue.length;
  }

  private resetRuntime(): void {
    if (this.runner) this.emit({ k: 'script', id: this.runner.id, phase: 'abort' });
    this.runner = null;
    this.queue = [];
    this.skipping = false;
    this.speech = null;
    this.choiceView = null;
    this.cardView = null;
    this.vignetteView = null;
    this.combat = null;
    this.lastCombat = null;
    this.pendingAct = null;
    this.transition = false;
    this.fx.clear();
    this.rt.clear();
    this.camLock = null;
    this.shakeT = 0;
    this.gameEnded = false;
    this.epoch++;
  }

  // ------------------------------------------------------------------ input

  inputMode(): InputMode {
    if (this.transition) return 'transition';
    if (this.cardView || this.vignetteView) return 'card';
    if (this.choiceView) return 'choice';
    if (this.combat) return 'combat';
    if (this.speech) return 'speech';
    if (this.runner || this.queue.length) return 'busy';
    return 'free';
  }

  /** Human-readable owners of the current input lock (diagnostics). */
  lockOwners(): string[] {
    const o: string[] = [];
    if (this.transition) o.push('transition');
    if (this.runner) o.push(`script:${this.runner.id}`);
    if (this.choiceView) o.push('choice');
    if (this.cardView) o.push('card');
    if (this.vignetteView) o.push('vignette');
    if (this.combat) o.push(`combat:${this.combat.def.id}`);
    for (const q of this.queue) o.push(`queued:${q.id}`);
    return o;
  }

  intent(i: Intent): boolean {
    const mode = this.inputMode();
    switch (i.k) {
      case 'advance':
        if (this.cardView) {
          this.cardView.t = Math.max(this.cardView.t, this.cardView.dur);
          return true;
        }
        if (this.vignetteView) {
          this.vignetteView.t = this.vignetteView.dur;
          return true;
        }
        if (this.speech) {
          this.speech.t = this.speech.dur;
          return true;
        }
        return false;
      case 'skip':
        if (this.runner && !this.choiceView && !this.combat) {
          this.skipping = true;
          return true;
        }
        return false;
      case 'choose':
        if (!this.choiceView) return false;
        if (!this.choiceView.options.some((o) => o.id === i.id)) return false;
        if (this.runner?.current?.cmd.k === 'choice') {
          this.runner.current.result = i.id;
          this.choiceView = null;
          return true;
        }
        return false;
      case 'combat':
        if (!this.combat) return false;
        return this.combat.input(i.action);
      case 'hint':
        this.giveHint();
        return true;
      default:
        break;
    }
    if (mode !== 'free') return false;
    switch (i.k) {
      case 'walk': {
        this.pendingAct = null;
        this.startWalk(PC, { x: i.x, y: i.y });
        return true;
      }
      case 'act':
      case 'useItem': {
        const tgt = i.k === 'act' ? i.target : i.target;
        if (i.k === 'useItem' && !this.state.inventory.includes(i.item)) return false;
        if (i.k === 'useItem' && tgt.startsWith('item:')) {
          this.runInteraction(i);
          return true;
        }
        const spot = this.approachSpot(tgt);
        if (spot === undefined) return false;
        this.pendingAct = { intent: i, target: tgt };
        if (spot) {
          const moving = this.startWalk(PC, spot, undefined, spot.face);
          if (moving) return true;
        }
        this.pendingAct = null;
        this.runInteraction(i);
        return true;
      }
      case 'examine':
        if (!this.state.inventory.includes(i.item)) return false;
        this.runInteraction(i);
        return true;
    }
    return false;
  }

  /** Where the player stands to interact with target; null = in place; undefined = invalid target. */
  private approachSpot(target: string): Spot | null | undefined {
    if (target.startsWith('actor:')) {
      const id = target.slice(6);
      const a = this.state.actors[id];
      const def = this.actorDef(id);
      if (!a || a.room !== this.state.room || a.hidden || !def) return undefined;
      if (def.talkSpot) return dyn(def.talkSpot, this.state);
      const pc = this.state.actors[PC];
      const off = (def.talkOffset ?? 80) * this.scaleAt(a.y);
      const side = pc.x <= a.x ? -1 : 1;
      const nav = this.navFor(this.room);
      let spot = { x: a.x + side * off, y: a.y + 2 };
      if (!nav.isWalkable(spot)) {
        const alt = { x: a.x - side * off, y: a.y + 2 };
        spot = nav.isWalkable(alt) ? alt : nav.nearestWalkable(spot);
      }
      return { x: spot.x, y: spot.y, face: spot.x < a.x ? 1 : -1 };
    }
    const h = this.hotspot(target);
    if (!h) return undefined;
    if (h.walkTo === undefined) return null;
    return dyn(h.walkTo, this.state);
  }

  hotspot(id: string): HotspotDef | undefined {
    const h = this.room.hotspots.find((x) => x.id === id);
    if (!h) return undefined;
    if (h.visible && !h.visible(this.state)) return undefined;
    return h;
  }

  /** Hotspots currently interactable, highest priority first. */
  visibleHotspots(): HotspotDef[] {
    return this.room.hotspots.filter((h) => !h.visible || h.visible(this.state)).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /** Hit test in room coordinates (actors are tested by the view against their sprites). */
  hotspotAt(p: Vec): HotspotDef | undefined {
    for (const h of this.visibleHotspots()) {
      if (!h.shape) continue;
      if ('poly' in h.shape) {
        if (pointInPoly(p, toPoints(h.shape.poly))) return h;
      } else if (pointInRect(p, h.shape)) return h;
    }
    return undefined;
  }

  hotspotName(h: HotspotDef): string {
    return dyn(h.name, this.state);
  }

  verbsFor(target: string): Verb[] {
    if (target.startsWith('actor:')) {
      const def = this.actorDef(target.slice(6));
      if (!def) return [];
      if (def.verbs) return dyn(def.verbs, this.state);
      const v = new Set<Verb>(['look', 'talk']);
      for (const k of Object.keys(def.on ?? {})) v.add(k);
      return orderVerbs([...v]);
    }
    const h = this.hotspot(target);
    if (!h) return [];
    if (h.verbs) return dyn(h.verbs, this.state);
    if (h.exit && dyn(h.exit, this.state)) return ['go', 'look'];
    const v = new Set<Verb>(['look']);
    for (const k of Object.keys(h.on ?? {})) v.add(k);
    return orderVerbs([...v]);
  }

  // ------------------------------------------------------------------ interactions

  private runInteraction(i: Intent): void {
    const ctx = this.makeCtx();
    const generic = (key: keyof typeof UI_LINES) => ctx.pick(`generic.${key}`, UI_LINES[key]);
    let handler: Handler | undefined;
    let id = 'interaction';
    if (i.k === 'examine') {
      const it = this.content.items.get(i.item);
      handler = it?.look;
      id = `examine:${i.item}`;
    } else if (i.k === 'useItem' && i.target.startsWith('item:')) {
      const other = i.target.slice(5);
      if (other === i.item) return;
      const a = this.content.items.get(i.item);
      const b = this.content.items.get(other);
      if (!a || !b || !this.state.inventory.includes(other)) return;
      handler = a.combine?.[other] ?? b.combine?.[i.item] ?? a.combineFail?.(other, this.state) ?? b.combineFail?.(i.item, this.state) ?? generic('combine');
      id = `combine:${i.item}+${other}`;
    } else if (i.k === 'act' || i.k === 'useItem') {
      const tgt = i.target;
      if (tgt.startsWith('actor:')) {
        const aid = tgt.slice(6);
        const def = this.actorDef(aid);
        if (!def) return;
        this.faceEachOther(PC, aid);
        if (i.k === 'act') {
          handler = def.on?.[i.verb] ?? (i.verb === 'look' ? generic('lookPerson') : i.verb === 'talk' ? generic('talk') : generic('usePerson'));
        } else {
          handler = def.items?.[i.item] ?? def.anyItem?.(i.item, this.state) ?? generic('give');
        }
        id = `${i.k === 'act' ? i.verb : 'item'}:${aid}`;
      } else {
        const h = this.hotspot(tgt);
        if (!h) return;
        if (i.k === 'act') {
          const ex = h.exit ? dyn(h.exit, this.state) : null;
          if ((i.verb === 'go' || i.verb === 'use') && ex && !h.on?.[i.verb]) {
            const blocked = h.exitBlocked?.(this.state);
            if (blocked) handler = blocked;
            else {
              const target = ex;
              handler = function* (): Script {
                yield { k: 'room', room: target.room, entry: target.entry };
              };
            }
          } else {
            handler = h.on?.[i.verb] ?? (i.verb === 'look' ? generic('look') : i.verb === 'take' ? generic('take') : i.verb === 'talk' ? generic('talkThing') : generic('use'));
          }
          id = `${i.verb}:${h.id}`;
        } else {
          handler = h.items?.[i.item] ?? h.anyItem?.(i.item, this.state) ?? generic('useItem');
          id = `item:${i.item}>${h.id}`;
        }
      }
    }
    if (handler === undefined) return;
    const h = handler;
    this.trace(`interact ${id}`);
    this.startScript(id, typeof h === 'function' ? (h as ScriptFn) : (c: ScriptCtx) => c.lines(PC, h as string | readonly string[]));
  }

  // ------------------------------------------------------------------ scripts

  startScript(id: string, fn: ScriptFn): void {
    if (this.runner) {
      this.queue.push({ id, fn });
      return;
    }
    const ctx = this.makeCtx();
    let gen: Script;
    try {
      gen = fn(ctx);
    } catch (e) {
      this.fail(id, e);
      return;
    }
    this.runner = new Runner(id, gen, this.epoch, this.clock);
    this.emit({ k: 'script', id, phase: 'start' });
  }

  private fail(id: string, e: unknown): void {
    const text = `Skriptfehler in ${id}: ${e instanceof Error ? e.message : String(e)}`;
    this.trace(text);
    this.emit({ k: 'error', text });
    // Release everything the script held.
    this.runner = null;
    this.speech = null;
    this.choiceView = null;
    this.cardView = null;
    this.vignetteView = null;
    this.combat = null;
    this.transition = false;
    this.skipping = false;
    if (this.fadeTarget > 0) {
      this.fadeTarget = 0;
    }
  }

  private finishRunner(): void {
    const r = this.runner;
    if (!r) return;
    this.runner = null;
    this.skipping = false;
    this.speech = null;
    this.emit({ k: 'script', id: r.id, phase: 'end' });
    if (this.queue.length) {
      const n = this.queue.shift()!;
      this.startScript(n.id, n.fn);
    } else {
      this.stable = cloneState(this.state);
      this.stable.resume = null;
    }
  }

  private stepRunner(dt: number): void {
    let steps = 0;
    let first = true;
    while (this.runner) {
      const r = this.runner;
      if (r.epoch !== this.epoch) {
        this.runner = null;
        return;
      }
      if (++steps > MAX_STEPS_PER_FRAME) {
        this.fail(r.id, new Error('Endlosschleife im Skript'));
        return;
      }
      const instant = this.instant || this.skipping;
      if (r.current) {
        let done: boolean;
        try {
          done = r.current.update(first ? dt : 0, instant);
        } catch (e) {
          this.fail(r.id, e);
          return;
        }
        if (!done) return;
        if (this.runner !== r || r.epoch !== this.epoch) return; // chapter change / load replaced this script
        r.lastResult = r.current.result;
        r.current = null;
      }
      first = false;
      let res: IteratorResult<Cmd, unknown>;
      try {
        res = r.gen.next(r.lastResult);
      } catch (e) {
        this.fail(r.id, e);
        return;
      }
      r.lastResult = undefined;
      if (this.runner !== r) return; // load/abort happened inside the script
      if (res.done) {
        this.finishRunner();
        continue;
      }
      try {
        r.current = this.begin(res.value);
      } catch (e) {
        this.fail(r.id, e);
        return;
      }
    }
  }

  /** Create the active form of a command. */
  private begin(cmd: Cmd): Active {
    const eng = this;
    switch (cmd.k) {
      case 'say':
      case 'narrate': {
        const actor = cmd.k === 'say' ? cmd.actor : null;
        const text = cmd.text;
        if (!text.trim()) return { cmd, update: () => true };
        if (actor && actor !== PC) this.faceSpeaker(actor);
        const dur = this.speechDuration(text, cmd.k === 'narrate');
        const view: SpeechView = { actor, text, mood: cmd.k === 'say' ? cmd.mood : undefined, t: 0, dur, id: ++this.speechSeq };
        this.speech = view;
        this.trace(`${actor ?? 'narr'}: ${text}`);
        return {
          cmd,
          update(dt, instant) {
            if (eng.speech !== view) return true;
            view.t += dt;
            if (instant || view.t >= view.dur) {
              eng.speech = null;
              return true;
            }
            return false;
          },
        };
      }
      case 'walk': {
        const moving = this.startWalk(cmd.actor, { x: cmd.x, y: cmd.y }, cmd.speed, cmd.face);
        if (!moving) {
          // Unreachable or already there: arrive in place, never hang.
          const a = this.state.actors[cmd.actor];
          if (a && cmd.face) a.facing = cmd.face;
          return { cmd, update: () => true };
        }
        if (!cmd.wait) return { cmd, update: () => true };
        return { cmd, update: (_dt, instant) => (instant ? this.finishWalk(cmd.actor) : !this.isWalking(cmd.actor)) };
      }
      case 'waitActor':
        return { cmd, update: (_dt, instant) => (instant ? this.finishWalk(cmd.actor) : !this.isWalking(cmd.actor) && !this.rt.get(cmd.actor)?.anim) };
      case 'face': {
        const a = this.state.actors[cmd.actor];
        if (a) {
          if (typeof cmd.dir === 'number') a.facing = cmd.dir;
          else {
            const b = this.state.actors[cmd.dir];
            if (b && Math.abs(b.x - a.x) > 0.5) a.facing = b.x > a.x ? 1 : -1;
          }
        }
        return { cmd, update: () => true };
      }
      case 'pose': {
        const a = this.state.actors[cmd.actor];
        if (!a) throw new Error(`pose: unknown actor ${cmd.actor}`);
        const info = this.charInfo(a.character)?.anims[cmd.pose];
        if (!info) throw new Error(`pose: ${a.character} has no animation ${cmd.pose}`);
        const r = this.rtOf(cmd.actor);
        r.path = [];
        r.anim = { name: cmd.pose, t: 0, loop: cmd.loop, times: cmd.times, rest: cmd.rest };
        const dur = cmd.loop ? 0 : (info.frames * cmd.times) / info.fps;
        if (cmd.rest || cmd.loop) a.pose = cmd.pose;
        if (!cmd.wait) {
          if (!cmd.loop && !cmd.rest) {
            // Fire-and-forget one-shot: the animation clears itself when done (see update()).
          }
          return { cmd, update: () => true };
        }
        return {
          cmd,
          update: (_dt, instant) => {
            const rr = this.rt.get(cmd.actor);
            if (!rr?.anim || rr.anim.name !== cmd.pose) return true;
            if (instant || rr.anim.t >= dur) {
              if (!cmd.rest) rr.anim = null;
              else rr.anim.t = dur;
              return true;
            }
            return false;
          },
        };
      }
      case 'wait': {
        let t = 0;
        return { cmd, update: (dt, instant) => instant || (t += dt) >= cmd.t };
      }
      case 'fade': {
        this.fadeTarget = cmd.to;
        this.fadeSpeed = cmd.t > 0 ? 1 / cmd.t : 1000;
        return {
          cmd,
          update: (_dt, instant) => {
            if (instant) this.fadeLevel = this.fadeTarget;
            return Math.abs(this.fadeLevel - this.fadeTarget) < 1e-3;
          },
        };
      }
      case 'room':
        return this.beginRoomChange(cmd);
      case 'camera': {
        this.camLock = cmd.x;
        this.camSpeed = cmd.t > 0 ? 1 / cmd.t : 1000;
        return { cmd, update: () => true };
      }
      case 'choice': {
        if (!cmd.options.length) return { cmd, update: () => true, result: undefined };
        const view: ChoiceView = { options: cmd.options, id: ++this.speechSeq };
        this.speech = null;
        this.choiceView = view;
        const act: Active = {
          cmd,
          update: () => {
            if (act.result !== undefined) return true;
            if (this.choiceView !== view) {
              // Choice vanished without an answer (should not happen): choose the last (exit) option.
              act.result = cmd.options[cmd.options.length - 1].id;
              return true;
            }
            return false;
          },
        };
        return act;
      }
      case 'card': {
        const dur = cmd.t ?? Math.min(14, 4 + cmd.lines.join(' ').length * 0.045);
        const view: CardView = { title: cmd.title, lines: cmd.lines, image: cmd.image, cine: cmd.cine, t: 0, dur };
        this.cardView = view;
        return {
          cmd,
          update: (dt, instant) => {
            if (this.cardView !== view) return true;
            view.t += dt;
            if (instant || view.t >= view.dur) {
              this.cardView = null;
              return true;
            }
            return false;
          },
        };
      }
      case 'vignette': {
        const view: VignetteView = { image: cmd.image, frames: cmd.frames, fps: cmd.fps, captions: cmd.captions, loop: cmd.loop, t: 0, dur: cmd.t };
        this.vignetteView = view;
        return {
          cmd,
          update: (dt, instant) => {
            if (this.vignetteView !== view) return true;
            view.t += dt;
            if (instant || view.t >= view.dur) {
              this.vignetteView = null;
              return true;
            }
            return false;
          },
        };
      }
      case 'fx':
        if (cmd.on) this.fx.set(cmd.name, { ...(cmd.params ?? {}), _t0: this.clock });
        else this.fx.delete(cmd.name);
        return { cmd, update: () => true };
      case 'checkpoint': {
        this.stable = cloneState(this.state);
        this.stable.resume = cmd.resume;
        this.emit({ k: 'autosave', reason: cmd.resume ? `checkpoint:${cmd.resume}` : 'checkpoint' });
        return { cmd, update: () => true };
      }
      case 'shake':
        if (!this.settings.reducedMotion) {
          this.shakeT = cmd.t;
          this.shakeAmp = cmd.amp;
        }
        return { cmd, update: () => true };
      case 'combat': {
        const def = this.content.combats.get(cmd.id);
        if (!def) throw new Error(`unknown combat ${cmd.id}`);
        this.combat = new CombatRuntime(def, this.settings);
        this.lastCombat = null;
        return {
          cmd,
          update: (dt, instant) => {
            const c = this.combat;
            if (!c) return true;
            c.update(this.instant ? 0 : dt, instant && this.instant);
            if (c.outcome) {
              this.lastCombat = c.outcome;
              this.combat = null;
              return true;
            }
            return false;
          },
        };
      }
      case 'endChapter':
        return this.beginChapterEnd(cmd);
    }
  }

  private finishWalk(id: string): boolean {
    const r = this.rt.get(id);
    const a = this.state.actors[id];
    if (r && a && r.path.length) {
      const last = r.path[r.path.length - 1];
      a.x = last.x;
      a.y = last.y;
      r.path = [];
      r.walkT = 0;
      if (r.arrivedFace) a.facing = r.arrivedFace;
    }
    return true;
  }

  private faceSpeaker(actor: string): void {
    const a = this.state.actors[actor];
    const pc = this.state.actors[PC];
    if (!a || !pc || a.room !== pc.room || a.room !== this.state.room) return;
    // Only turn towards the player when not already facing them (no repeated flipping).
    if (Math.abs(pc.x - a.x) > 4) {
      const want: Facing = pc.x > a.x ? 1 : -1;
      if (a.facing !== want && !this.rt.get(actor)?.anim && a.pose === 'stand') a.facing = want;
    }
  }

  private speechDuration(text: string, narr: boolean): number {
    if (!this.settings.autoAdvance) return Infinity;
    const base = narr ? 2.2 : 1.6;
    return clamp(base + (text.length * 0.058) / clamp(this.settings.textSpeed, 0.4, 2), 2, 16);
  }

  private beginRoomChange(cmd: Extract<Cmd, { k: 'room' }>): Active {
    const target = this.content.rooms.get(cmd.room);
    if (!target) throw new Error(`unknown room ${cmd.room}`);
    const entry = target.entries[cmd.entry];
    if (!entry) throw new Error(`room ${cmd.room}: unknown entry ${cmd.entry}`);
    let phase: 'out' | 'in' = 'out';
    this.transition = true;
    this.fadeTarget = 1;
    this.fadeSpeed = 1 / 0.35;
    const epoch = this.epoch;
    return {
      cmd,
      update: (_dt, instant) => {
        if (epoch !== this.epoch) return true;
        if (phase === 'out') {
          if (instant) this.fadeLevel = 1;
          if (this.fadeLevel < 0.999) return false;
          // Swap rooms.
          this.state.room = target.id;
          this.placeActor(PC, { room: target.id, x: entry.x, y: entry.y, facing: entry.face ?? this.state.actors[PC].facing });
          for (const r of this.rt.values()) r.path = [];
          this.pendingAct = null;
          this.camLock = null;
          this.snapCamera();
          this.emit({ k: 'room', room: target.id });
          this.trace(`room ${target.id}`);
          phase = 'in';
          this.fadeTarget = 0;
          if (target.onEnter) this.queue.unshift({ id: `enter:${target.id}`, fn: target.onEnter });
          this.queue.push({ id: `autosave:${target.id}`, fn: autosaveScript });
          return false;
        }
        if (instant) this.fadeLevel = 0;
        if (this.fadeLevel > 0.001) return false;
        this.transition = false;
        return true;
      },
    };
  }

  private beginChapterEnd(cmd: Cmd): Active {
    const next = this.chapter.next;
    let t = 0;
    this.fadeTarget = 1;
    this.fadeSpeed = 1 / 1.2;
    return {
      cmd,
      update: (dt, instant) => {
        t += dt;
        if (!instant && (this.fadeLevel < 0.999 || t < 1.4)) return false;
        if (next && this.content.chapters.has(next)) {
          const keep = this.state;
          // newChapter resets the runtime; this runner is replaced by the chapter's own.
          this.newChapter(next, keep);
          this.emit({ k: 'autosave', reason: `chapter:${next}` });
        } else {
          this.gameEnded = true;
          this.emit({ k: 'gameEnd' });
        }
        return true;
      },
    };
  }

  // ------------------------------------------------------------------ hints

  currentHint(): { text: string; level: number; of: number } | null {
    const h = this.chapter.hint(this.state);
    if (!h || !h.steps.length) return null;
    const lvl = this.state.hintLevels[h.id] ?? 0;
    const i = Math.min(lvl, h.steps.length - 1);
    return { text: h.steps[i], level: i + 1, of: h.steps.length };
  }

  private giveHint(): void {
    const h = this.chapter.hint(this.state);
    if (!h || !h.steps.length) {
      this.emit({ k: 'hint', text: UI_LINES.noHint[0], level: 0, of: 0 });
      return;
    }
    const lvl = this.state.hintLevels[h.id] ?? 0;
    const i = Math.min(lvl, h.steps.length - 1);
    this.state.hintLevels[h.id] = Math.min(lvl + 1, h.steps.length);
    this.emit({ k: 'hint', text: h.steps[i], level: i + 1, of: h.steps.length });
  }

  // ------------------------------------------------------------------ main loop

  update(dtIn: number): void {
    const dt = clamp(dtIn, 0, 0.1);
    this.clock += dt;
    if (!this.gameEnded) this.state.playTime += dt;
    // Fades and camera.
    if (this.fadeLevel !== this.fadeTarget) {
      const step = this.instant ? 1 : dt * this.fadeSpeed;
      this.fadeLevel = this.fadeLevel < this.fadeTarget ? Math.min(this.fadeTarget, this.fadeLevel + step) : Math.max(this.fadeTarget, this.fadeLevel - step);
    }
    if (this.shakeT > 0) this.shakeT = Math.max(0, this.shakeT - dt);
    this.stepActors(dt);
    // Finished one-shot animations without waiters clear themselves.
    for (const [id, r] of this.rt) {
      if (!r.anim || r.anim.loop || r.anim.rest) continue;
      const a = this.state.actors[id];
      const info = a && this.charInfo(a.character)?.anims[r.anim.name];
      if (!info || r.anim.t >= (info.frames * r.anim.times) / info.fps) {
        const waiting = this.runner?.current?.cmd.k === 'pose' && (this.runner.current.cmd as { actor: string }).actor === id;
        if (!waiting) r.anim = null;
      }
    }
    if (this.runner) this.stepRunner(dt);
    else if (this.queue.length) {
      const n = this.queue.shift()!;
      this.startScript(n.id, n.fn);
      this.stepRunner(0);
    }
    if (!this.runner && this.pendingAct && !this.isWalking(PC)) {
      const p = this.pendingAct;
      this.pendingAct = null;
      const pcA = this.state.actors[PC];
      if (p.target.startsWith('actor:')) this.faceEachOther(PC, p.target.slice(6));
      else {
        const h = this.hotspot(p.target);
        const spot = h?.walkTo !== undefined && h ? dyn(h.walkTo, this.state) : null;
        if (spot?.face) pcA.facing = spot.face;
      }
      this.runInteraction(p.intent);
      if (this.runner) this.stepRunner(0);
    }
    if (!this.runner && !this.queue.length && !this.transition && !this.isWalking(PC) && !this.pendingAct) this.checkRules();
    this.updateCamera(dt);
  }

  private checkRules(): void {
    const room = this.room;
    for (const rule of room.rules ?? []) {
      const key = `rule:${room.id}.${rule.id}`;
      if (!rule.repeat && this.state.seen[key]) continue;
      let ok = false;
      try {
        ok = rule.when(this.state);
      } catch (e) {
        this.fail(key, e);
        return;
      }
      if (!ok) continue;
      if (!rule.repeat) this.state.seen[key] = true;
      this.startScript(key, rule.run);
      this.stepRunner(0);
      return;
    }
  }

  snapCamera(): void {
    const room = this.content.rooms.get(this.state.room);
    if (!room) return;
    const pc = this.state.actors[PC];
    const target = this.camLock ?? (pc && pc.room === room.id ? pc.x - 480 : 0);
    this.camX = clamp(target, 0, Math.max(0, room.width - 960));
  }

  private updateCamera(dt: number): void {
    const room = this.content.rooms.get(this.state.room);
    if (!room) return;
    const maxX = Math.max(0, room.width - 960);
    if (this.camLock !== null) {
      const tgt = clamp(this.camLock, 0, maxX);
      const step = this.instant ? Infinity : dt * this.camSpeed * Math.max(60, Math.abs(tgt - this.camX));
      this.camX = this.camX < tgt ? Math.min(tgt, this.camX + step) : Math.max(tgt, this.camX - step);
      return;
    }
    const pc = this.state.actors[PC];
    if (!pc || pc.room !== room.id) return;
    // Dead zone in the middle third; smooth follow outside it.
    const screenX = pc.x - this.camX;
    let tgt = this.camX;
    if (screenX < 340) tgt = pc.x - 340;
    else if (screenX > 620) tgt = pc.x - 620;
    tgt = clamp(tgt, 0, maxX);
    if (this.instant) this.camX = tgt;
    else this.camX += (tgt - this.camX) * Math.min(1, dt * 6);
  }

  /** Simulation helper: run until idle (or a choice / combat waits) with a step budget. */
  runUntilIdle(maxSeconds = 600, dt = 1 / 30): InputMode {
    let t = 0;
    while (t < maxSeconds) {
      const m = this.inputMode();
      if (m === 'choice' || m === 'combat') return m;
      if (m === 'free' && !this.isWalking(PC) && !this.pendingAct) return m;
      if (this.gameEnded) return m;
      this.update(dt);
      t += dt;
    }
    return this.inputMode();
  }
}

function orderVerbs(v: Verb[]): Verb[] {
  const order = ['go', 'look', 'take', 'use', 'talk'];
  return v.sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

function* autosaveScript(): Script {
  yield { k: 'checkpoint', resume: null };
}

export { PC, SAVE_VERSION };
export type { FlagValue };
