// Headless game runner over the production engine and content (no renderer).
import { Engine, EngineEvent, indexContent, Intent, InputMode } from '../../src/core/engine';
import { CHAPTERS, COMBATS } from '../../src/content/chapters';
import { engineMeta } from '../../src/content/assets';
import { cloneState, validateStateShape } from '../../src/core/state';
import { dyn } from '../../src/core/content';

export interface SimOptions {
  instant?: boolean;
  dt?: number;
}

export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }
  next(): number {
    // mulberry32
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n: number): number {
    return Math.floor(this.next() * n);
  }
  pick<T>(a: readonly T[]): T {
    return a[this.int(a.length)];
  }
}

export class Sim {
  readonly engine: Engine;
  readonly events: EngineEvent[] = [];
  readonly actions: string[] = [];
  errors: string[] = [];
  autosaves = 0;
  lastAutosave: unknown = null;
  dt: number;

  constructor(opts: SimOptions = {}) {
    this.engine = new Engine(indexContent(CHAPTERS, COMBATS), engineMeta());
    this.engine.instant = opts.instant ?? true;
    this.dt = opts.dt ?? 1 / 30;
    this.engine.on((e) => {
      this.events.push(e);
      if (e.k === 'error') this.errors.push(e.text);
      if (e.k === 'autosave') {
        this.autosaves++;
        this.lastAutosave = this.engine.saveData();
      }
    });
  }

  start(chapter: string): void {
    this.engine.newChapter(chapter);
    this.settle();
  }

  /** Advance until idle, a choice or combat waits; returns the mode. Fails on timeouts. */
  settle(maxSeconds = 900): InputMode {
    const e = this.engine;
    let t = 0;
    for (;;) {
      const m = e.inputMode();
      if (m === 'choice' || m === 'combat') return m;
      if (m === 'free' && !e.isWalking('pc')) {
        // one more tick lets rules fire
        e.update(this.dt);
        if (e.inputMode() === 'free' && !e.isWalking('pc')) return 'free';
      }
      if (e.gameEnded) return e.inputMode();
      e.update(this.dt);
      t += this.dt;
      if (t > maxSeconds) throw new Error(`stuck in mode ${e.inputMode()} owners=${e.lockOwners().join(',')} room=${e.state.room}`);
    }
  }

  do(i: Intent, label?: string): boolean {
    const ok = this.engine.intent(i);
    this.actions.push(`${label ?? JSON.stringify(i)}${ok ? '' : ' (refused)'}`);
    return ok;
  }

  act(target: string, verb: string): boolean {
    return this.do({ k: 'act', target, verb }, `act ${verb} ${target}`);
  }

  use(item: string, target: string): boolean {
    return this.do({ k: 'useItem', item, target }, `use ${item} -> ${target}`);
  }

  choose(id: string): boolean {
    return this.do({ k: 'choose', id }, `choose ${id}`);
  }

  options(): string[] {
    return this.engine.choiceView?.options.map((o) => o.id) ?? [];
  }

  /** Save/load roundtrip through JSON (as the browser does). */
  saveLoad(): string | null {
    const data = JSON.parse(JSON.stringify(this.engine.saveData()));
    const shapeErr = validateStateShape(data);
    if (shapeErr) return `save shape: ${shapeErr}`;
    const err = this.engine.load(data);
    this.actions.push(`saveLoad${err ? ` ERROR ${err}` : ''}`);
    return err;
  }

  snapshot() {
    return cloneState(this.engine.state);
  }

  /** Currently interactive targets (hotspots and visible actors with defs). */
  targets(): string[] {
    const e = this.engine;
    const out = e.visibleHotspots().map((h) => h.id);
    for (const id of e.roomActors()) if (id !== 'pc' && e.actorDef(id)) out.push(`actor:${id}`);
    return out;
  }

  exits(): string[] {
    const e = this.engine;
    return e.visibleHotspots().filter((h) => h.exit && dyn(h.exit, e.state)).map((h) => h.id);
  }
}
