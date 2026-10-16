// Headless playtest harness: runs the real game logic (src/engine + src/content) with
// scripted or randomized players. Nothing here re-implements game rules: every action
// goes through Game.perform exactly as a mouse click in the browser does.
import { enumerateActions, actionKey } from '../../src/engine/actions';
import { Game, type Action } from '../../src/engine/game';
import { HeadlessPresenter } from '../../src/engine/presenter';
import { edgesFrom, routeTo } from '../../src/engine/route';
import { cloneState, deserialize, newState, serialize, type GameState } from '../../src/engine/state';
import type { CloseupDef, Content, DialogDef, OptionDef } from '../../src/engine/types';

export type WAct = Action | { t: 'go'; room: string };

export interface WStep {
  id: string;
  chapter: number;
  room?: string;
  when: string;
  done: string;
  do: WAct[];
  say?: string[];
  show?: string[];
  optional?: boolean;
}

/** Where each chapter's locked room is: the chapter start must land the player there. */
export const CHAPTER_START_ROOM: Record<number, string> = {
  1: 'hotel_room', 2: 'cold_store', 3: 'darkroom', 4: 'halcyon_cell',
  5: 'holding_cell', 6: 'lantern_cellar', 7: 'calypso_hold', 8: 'radio_booth',
};

/** Small deterministic PRNG (mulberry32) for the playtest agents. */
export class Rng {
  constructor(private s: number) {}
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n: number) {
    return Math.floor(this.next() * n);
  }
  range(a: number, b: number) {
    return a + this.int(b - a + 1);
  }
  pick<T>(a: T[]): T {
    return a[this.int(a.length)];
  }
  chance(p: number) {
    return this.next() < p;
  }
  shuffle<T>(a: T[]): T[] {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }
}

export interface RunStats {
  actions: number;
  dialogChoices: number;
  saves: number;
  loads: number;
  autosaves: number;
  roomChanges: number;
  transitions: number;
  wrongItemTries: number;
  outOfOrderTries: number;
}

export class SimPresenter extends HeadlessPresenter {
  sayPlan: string[] = [];
  showPlan: string[] = [];
  rng: Rng;
  mode: 'plan' | 'random' = 'plan';
  dialogBudget = 0;
  stats: RunStats;
  game!: Game;
  autosaves: { label: string; json: string }[] = [];
  sfxPlayed = new Set<string>();
  musicPlayed = new Set<string>();
  lastOpt: OptionDef | null = null;
  pendingCodes: { id: string; code: string }[] = [];
  /** If > 0: walk out of a planned conversation at the n-th chance (set per step by the explorer). */
  impatient = 0;

  constructor(rng: Rng, stats: RunStats) {
    super();
    this.rng = rng;
    this.stats = stats;
    this.chooser = (opts, d) => this.chooseOpt(opts, d);
    this.presenter = () => this.pickShow();
    this.closeupHandler = (def) => this.onCloseup(def);
  }

  override autosave(label: string) {
    this.stats.autosaves++;
    this.autosaves.push({ label, json: serialize(this.game.state) });
  }
  override sfx(id: string) {
    this.sfxPlayed.add(id);
  }
  override music(id: string | null) {
    if (id) this.musicPlayed.add(id);
  }

  private chooseOpt(opts: OptionDef[], d: DialogDef): OptionDef {
    const o = this.chooseOptInner(opts, d);
    this.lastOpt = o;
    return o;
  }

  private chooseOptInner(opts: OptionDef[], d: DialogDef): OptionDef {
    this.stats.dialogChoices++;
    this.dialogBudget++;
    const seen = (o: OptionDef) => this.game.state.seen.includes(`${d.id}.${o.id}`);
    const exit = opts.find((o) => o.next === 'exit');
    // Leaving: take the exit if there is one; otherwise look for a new option that might open one.
    const leave = (): OptionDef => {
      if (exit) return exit;
      const fresh = opts.filter((o) => !seen(o));
      return fresh.length ? fresh[0] : this.rng.pick(opts);
    };
    if (this.dialogBudget > 40) return leave();
    if (this.mode === 'plan' && this.impatient > 0 && exit) {
      // an impatient player walks out of a conversation once (after a few lines), then has to come back
      if (--this.impatient === 0) return exit;
    }
    if (this.mode === 'plan') {
      for (const id of this.sayPlan) {
        const o = opts.find((x) => x.id === id);
        if (o && !(seen(o) && o.next !== 'exit' && !o.present)) return o;
      }
      return leave();
    }
    // random: a curious player tries new lines first, and leaves after a while
    if (this.rng.chance(Math.min(0.85, this.dialogBudget * 0.06))) return leave();
    const fresh = opts.filter((o) => !seen(o) && o.next !== 'exit');
    if (fresh.length && this.rng.chance(0.75)) return this.rng.pick(fresh);
    return this.rng.pick(opts);
  }

  private pickShow(): string | null {
    const inv = this.game.state.inv;
    const opt = this.lastOpt?.id ?? '';
    if (this.mode === 'plan') {
      for (const entry of this.showPlan) {
        const [oid, it] = entry.includes(':') ? entry.split(':') : ['', entry];
        if ((oid === '' || oid === opt) && inv.includes(it)) return it;
      }
      return null;
    }
    if (!inv.length || this.rng.chance(0.15)) return null;
    return this.rng.pick(inv);
  }

  private onCloseup(def: CloseupDef) {
    const g = this.game;
    const codes: string[] = [];
    if (this.mode === 'random' && this.rng.chance(0.5)) codes.push(randomCode(def, this.rng));
    const known = g.cond(def.knownWhen) ? def.solution : null;
    if (known && (this.mode === 'plan' || this.rng.chance(0.8))) codes.push(known);
    // the closeup UI calls trySolve after the script returns; queue the inputs
    this.pendingCodes.push(...codes.map((c) => ({ id: def.id, code: c })));
  }
}

function randomCode(def: CloseupDef, rng: Rng): string {
  if (def.kind === 'combo') {
    let s = '';
    for (let i = 0; i < def.solution.length; i++) s += String(rng.int(10));
    return s;
  }
  const j = def.jacks ?? [];
  if (j.length < 2) return '';
  return [rng.pick(j), rng.pick(j)].sort().join('-');
}

export class Sim {
  game: Game;
  p: SimPresenter;
  rng: Rng;
  stats: RunStats = {
    actions: 0, dialogChoices: 0, saves: 0, loads: 0, autosaves: 0, roomChanges: 0, transitions: 0,
    wrongItemTries: 0, outOfOrderTries: 0,
  };
  log: string[] = [];
  violations: string[] = [];
  exceptions: string[] = [];
  failedTransitions: string[] = [];
  /** Every action key performed (coverage). */
  seen = new Set<string>();
  /** Every item ever held (coverage). */
  held = new Set<string>();
  recent: string[] = [];
  maxChapter = 0;
  /** Check that an open objective (and so a hint) exists after every action. */
  checkHints = true;

  constructor(public content: Content, seed: number, state?: GameState) {
    this.rng = new Rng(seed);
    this.p = new SimPresenter(this.rng, this.stats);
    this.game = new Game(content, this.p, state ?? newState());
    this.p.game = this.game;
    this.maxChapter = this.game.state.chapter;
  }

  async start() {
    await this.guard('start', () => this.game.start());
    await this.flushCodes();
    this.observe();
    this.check();
  }

  /** Run game code, turning exceptions into recorded failures. */
  private async guard(what: string, fn: () => Promise<unknown>) {
    try {
      await fn();
    } catch (e) {
      const err = e as Error;
      this.exceptions.push(`${what}: ${err?.stack?.split('\n').slice(0, 3).join(' | ') ?? String(e)}`);
      this.game.busy = 0;
    }
  }

  async flushCodes() {
    while (this.p.pendingCodes.length) {
      const { id, code } = this.p.pendingCodes.shift()!;
      await this.guard(`closeup ${id}`, () => this.game.trySolve(id, code));
    }
  }

  private observe() {
    const s = this.game.state;
    for (const i of s.inv) this.held.add(i);
    this.maxChapter = Math.max(this.maxChapter, s.chapter);
  }

  async act(a: Action) {
    this.p.dialogBudget = 0;
    const before = { chapter: this.game.state.chapter, room: this.game.state.room };
    const key = actionKey(a);
    this.seen.add(key);
    this.recent.push(key);
    if (this.recent.length > 25) this.recent.shift();
    await this.guard(key, () => this.game.perform(a));
    await this.flushCodes();
    this.stats.actions++;
    const s = this.game.state;
    if (s.room !== before.room) this.stats.roomChanges++;
    if (s.chapter !== before.chapter) this.transition(before.chapter, key);
    this.observe();
    this.check(a);
  }

  /** A chapter change must move forward by one, after the previous chapter is complete, through its locked room. */
  private transition(from: number, key: string) {
    const s = this.game.state;
    this.stats.transitions++;
    const prev = this.content.chapters.find((c) => c.n === from);
    if (s.chapter !== from + 1) this.failedTransitions.push(`chapter ${from} -> ${s.chapter} after ${key}`);
    else if (prev && !this.game.cond(prev.complete)) this.failedTransitions.push(`chapter ${from} ended without its completion condition (${prev.complete}) after ${key}`);
    const want = CHAPTER_START_ROOM[s.chapter];
    if (want && !s.visited.includes(want)) this.failedTransitions.push(`chapter ${s.chapter} started without entering ${want} (now in ${s.room})`);
  }

  /** Invariants that must hold after every action. */
  check(a?: Action) {
    const s = this.game.state;
    const c = this.content;
    const where = a ? ` after ${actionKey(a)}` : '';
    if (new Set(s.inv).size !== s.inv.length) this.violations.push('duplicate inventory items' + where);
    for (const i of s.inv) if (!c.items[i]) this.violations.push(`unknown item ${i}` + where);
    for (const i of s.stash) if (s.inv.includes(i)) this.violations.push(`item ${i} both stashed and held` + where);
    if (!s.room || !c.rooms[s.room]) this.violations.push(`unknown room ${s.room}` + where);
    for (const cl of s.clues) if (!c.clues[cl]) this.violations.push(`unknown clue ${cl}` + where);
    for (const d of s.deds) if (!c.deductions[d]) this.violations.push(`unknown deduction ${d}` + where);
    for (const l of s.map) if (!c.locations[l]) this.violations.push(`unknown location ${l}` + where);
    if (this.game.errors.length) {
      for (const e of this.game.errors) this.violations.push('script error: ' + e + where);
      this.game.errors = [];
    }
    if (this.game.busy !== 0) this.violations.push('busy counter not zero' + where);
    if (s.chapter < 1 || s.chapter > 8) this.violations.push(`chapter out of range: ${s.chapter}` + where);
    if (this.checkHints && !s.ended && !this.game.objectives().some((o) => !o.done)) {
      const ch = this.game.chapterDef();
      if (ch && !this.game.cond(ch.complete)) this.violations.push(`no open objective (no hint available) in chapter ${s.chapter}, room ${s.room}` + where);
    }
  }

  /** Ways out of the current room: open exits and, from the street, the city map. */
  edges(): { to: string; a: Action }[] {
    return edgesFrom(this.game);
  }

  /** Breadth-first route over the room graph (exits and map pins). */
  route(target: string): Action[] | null {
    return routeTo(this.game, target)?.map((e) => e.a) ?? null;
  }

  async go(room: string): Promise<boolean> {
    const ch = this.game.state.chapter;
    for (let guard = 0; guard < 8 && this.game.state.room !== room; guard++) {
      if (this.game.state.chapter !== ch || this.game.state.ended) return false;
      const path = this.route(room);
      if (!path) return false;
      if (!path.length) return true;
      await this.act(path[0]);
    }
    return this.game.state.room === room;
  }

  /** Execute a walkthrough step. Returns false if its completion condition fails. */
  async runStep(st: WStep): Promise<boolean> {
    this.p.mode = 'plan';
    this.p.sayPlan = st.say ?? [];
    this.p.showPlan = st.show ?? [];
    if (st.room && !(await this.go(st.room))) {
      if (this.game.cond(st.done)) return true;
      this.log.push(`step ${st.id}: cannot reach ${st.room} from ${this.game.state.room}`);
      return false;
    }
    for (const a of st.do) {
      if (this.game.cond(st.done) || this.game.state.ended) break;
      if (a.t === 'go') {
        if (!(await this.go(a.room)) && !this.game.cond(st.done)) {
          this.log.push(`step ${st.id}: cannot reach ${a.room}`);
          return false;
        }
      } else await this.act(a);
    }
    return this.game.cond(st.done);
  }

  /** Random actions: anything a player could click, including wrong items, pairs and orders. */
  async noise(n: number, opts: { pairs?: number; moves?: boolean } = {}) {
    this.p.mode = 'random';
    for (let i = 0; i < n; i++) {
      if (this.game.state.ended) break;
      let acts = enumerateActions(this.game, { allItemPairs: this.rng.chance(opts.pairs ?? 0.5), allCluePairs: this.rng.chance(0.1) });
      if (opts.moves === false) acts = acts.filter((a) => a.t !== 'travel');
      if (!acts.length) break;
      let a = this.rng.pick(acts);
      if (a.t === 'timeline' && this.rng.chance(0.6)) a = { ...a, order: this.rng.shuffle(a.order) };
      if (a.t === 'item' || a.t === 'combine') this.stats.wrongItemTries++;
      await this.act(a);
    }
    this.p.mode = 'plan';
  }

  /** A curious player: talk to everyone in the room, trying lines not heard before. */
  async chat() {
    this.p.mode = 'random';
    for (const n of this.game.npcsHere()) {
      if (this.game.state.ended) break;
      await this.act({ t: 'use', target: { kind: 'npc', id: n.id } });
    }
    this.p.mode = 'plan';
  }

  /** Rapid location switching: hop along random exits and map pins. */
  async hop(n: number) {
    this.p.mode = 'random';
    for (let i = 0; i < n && !this.game.state.ended; i++) {
      const e = this.edges();
      if (!e.length) break;
      await this.act(this.rng.pick(e).a);
    }
    this.p.mode = 'plan';
  }

  /** Load a save into a brand-new Game, as the title menu does (no enter scripts re-run). */
  load(json: string) {
    const st = deserialize(json);
    this.stats.loads++;
    if (serialize(st) !== json) this.violations.push('save/load roundtrip changed the state');
    this.game = new Game(this.content, this.p, st);
    this.p.game = this.game;
    this.check();
  }

  /** Save the current state and immediately load it. */
  saveLoad() {
    this.stats.saves++;
    this.load(serialize(this.game.state));
  }

  snapshot(): GameState {
    return cloneState(this.game.state);
  }
}

/** Steps whose preconditions hold and which are not yet done. */
export function readySteps(g: Game, steps: WStep[]): WStep[] {
  return steps.filter((s) => s.chapter === g.state.chapter && g.cond(s.when) && !g.cond(s.done));
}
