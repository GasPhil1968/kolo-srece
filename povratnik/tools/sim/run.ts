// Seeded simulations against the production engine and content.
//   npx tsx tools/sim/run.ts --runs 2000 [--chapter sarajevo] [--seed 1] [--report reports/sim.json]
// Every run: start a chapter, play a random prefix of 0-150 actions (any verb on any target, any item
// on anything, random dialogue choices, walking, skipping, hints, save/load round trips), check the
// invariants after every step, then let the chapter's solver finish the chapter from wherever the
// random play left it. A run fails on any script error, stuck input lock, invalid save, refused load
// or if the solver cannot finish the chapter (softlock).
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Sim, Rng } from './harness';
import { SOLVERS } from './solvers';
import { dyn } from '../../src/core/content';
import type { Intent } from '../../src/core/engine';

interface RunResult {
  seed: number;
  chapter: string;
  ok: boolean;
  randomSteps: number;
  solverSteps: number;
  saveLoads: number;
  error?: string;
  log?: string[];
}

const args = process.argv.slice(2);
const arg = (name: string, def?: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const RUNS = Number(arg('runs', '200'));
const BASE = Number(arg('seed', '1'));
const ONLY = arg('chapter');
const REPORT = arg('report', 'reports/sim-results.json') as string;
const VERBOSE = args.includes('--verbose');

function checkInvariants(sim: Sim): string | null {
  const e = sim.engine;
  if (sim.errors.length) return `script error: ${sim.errors.join(' | ')}`;
  const s = e.state;
  if (new Set(s.inventory).size !== s.inventory.length) return 'duplicate inventory item';
  const ch = e.content.chapters.get(s.chapter);
  if (!ch) return `unknown chapter ${s.chapter}`;
  for (const j of Object.keys(s.journal)) if (!(j in ch.journal)) return `unknown journal entry ${j}`;
  const pc = s.actors.pc;
  if (!pc || pc.room !== s.room) return 'player not in current room';
  const room = e.room;
  const nav = e.navFor(room);
  // Scripted walks may leave the walk area (off-screen exits); free play may not.
  if (e.inputMode() === 'free' && !e.gameEnded && !pc.hidden && !nav.isWalkable(pc)) {
    const n = nav.nearestWalkable(pc);
    if (Math.hypot(n.x - pc.x, n.y - pc.y) > 4) return `player off walkable area at ${pc.x.toFixed(0)},${pc.y.toFixed(0)} in ${room.id}`;
  }
  if (e.inputMode() === 'choice' && !e.choiceView?.options.length) return 'empty choice';
  if (e.speech && !e.speech.text.trim()) return 'invisible speech';
  return null;
}

function randomIntent(sim: Sim, rng: Rng): Intent | 'saveload' {
  const e = sim.engine;
  const mode = e.inputMode();
  if (mode === 'choice') {
    const opts = sim.options();
    return { k: 'choose', id: rng.pick(opts) };
  }
  if (mode === 'combat' && e.combat) {
    const acts = e.combat.actions;
    if (acts.length) return { k: 'combat', action: rng.pick(acts).id };
  }
  const r = rng.next();
  if (r < 0.04) return 'saveload';
  if (r < 0.06) return { k: 'hint' };
  if (r < 0.1) {
    const room = e.room;
    return { k: 'walk', x: rng.int(room.width), y: 300 + rng.int(170) };
  }
  const inv = e.state.inventory;
  if (r < 0.3 && inv.length) {
    const item = rng.pick(inv);
    const others = inv.filter((i) => i !== item);
    if (others.length && rng.next() < 0.3) return { k: 'useItem', item, target: `item:${rng.pick(others)}` };
    if (rng.next() < 0.2) return { k: 'examine', item };
    const t = sim.targets();
    if (t.length) return { k: 'useItem', item, target: rng.pick(t) };
  }
  const targets = sim.targets();
  if (!targets.length) return { k: 'hint' };
  const target = rng.pick(targets);
  const verbs = e.verbsFor(target);
  // Mostly offered verbs, sometimes arbitrary ones (robustness).
  const verb = verbs.length && rng.next() < 0.9 ? rng.pick(verbs) : rng.pick(['look', 'take', 'use', 'talk', 'go', 'crawl', 'carry']);
  return { k: 'act', target, verb };
}

function runOne(seed: number, chapter: string): RunResult {
  const rng = new Rng(seed);
  const sim = new Sim({ instant: true });
  const res: RunResult = { seed, chapter, ok: false, randomSteps: 0, solverSteps: 0, saveLoads: 0 };
  const solver = SOLVERS[chapter];
  try {
    sim.start(chapter);
    const steps = rng.int(151);
    for (let i = 0; i < steps; i++) {
      if (sim.engine.state.chapter !== chapter || sim.engine.gameEnded) break;
      const it = randomIntent(sim, rng);
      if (it === 'saveload') {
        res.saveLoads++;
        const err = sim.saveLoad();
        if (err) throw new Error(`load failed: ${err}`);
      } else {
        sim.do(it);
        // Occasionally interrupt a running script with a save/load (save during actions).
        if (rng.next() < 0.05 && sim.engine.inputMode() !== 'free') {
          res.saveLoads++;
          const err = sim.saveLoad();
          if (err) throw new Error(`load during action failed: ${err}`);
        }
        if (rng.next() < 0.05) sim.do({ k: 'skip' });
      }
      sim.settle();
      res.randomSteps++;
      const bad = checkInvariants(sim);
      if (bad) throw new Error(bad);
    }
    // Solver phase.
    let guard = 0;
    let lastSig = '';
    let same = 0;
    while (sim.engine.state.chapter === chapter && !sim.engine.gameEnded) {
      if (++guard > 400) throw new Error('solver exceeded 400 steps');
      sim.settle();
      if (sim.engine.state.chapter !== chapter || sim.engine.gameEnded) break;
      const step = solver(sim);
      if (!step) throw new Error('solver found no next step (softlock?)');
      const sig = JSON.stringify(step) + JSON.stringify(sim.engine.state.flags) + sim.engine.state.room + sim.engine.state.inventory.join();
      if (sig === lastSig) {
        if (++same > 6) throw new Error(`solver repeats ${JSON.stringify(step)} without progress`);
      } else same = 0;
      lastSig = sig;
      sim.do(step);
      sim.settle();
      res.solverSteps++;
      const bad = checkInvariants(sim);
      if (bad) throw new Error(bad);
    }
    res.ok = true;
  } catch (err) {
    res.error = err instanceof Error ? err.message : String(err);
    res.log = sim.actions.slice(-40).concat(sim.engine.log.slice(-25));
  }
  return res;
}

const chapters = Object.keys(SOLVERS).filter((c) => !ONLY || c === ONLY);
const results: RunResult[] = [];
const t0 = Date.now();
for (let i = 0; i < RUNS; i++) {
  const chapter = chapters[i % chapters.length];
  const r = runOne(BASE + i, chapter);
  results.push(r);
  if (!r.ok) {
    console.log(`FAIL seed=${r.seed} chapter=${r.chapter}: ${r.error}`);
    if (VERBOSE && r.log) console.log('  ' + r.log.join('\n  '));
  }
}
const failed = results.filter((r) => !r.ok);
const byChapter: Record<string, { runs: number; ok: number; randomSteps: number; saveLoads: number }> = {};
for (const r of results) {
  const b = (byChapter[r.chapter] ??= { runs: 0, ok: 0, randomSteps: 0, saveLoads: 0 });
  b.runs++;
  if (r.ok) b.ok++;
  b.randomSteps += r.randomSteps;
  b.saveLoads += r.saveLoads;
}
const summary = {
  generatedAt: new Date().toISOString(),
  runs: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  seconds: (Date.now() - t0) / 1000,
  byChapter,
  failures: failed.slice(0, 50),
};
mkdirSync(dirname(REPORT), { recursive: true });
writeFileSync(REPORT, JSON.stringify(summary, null, 2));
console.log(`${summary.passed}/${summary.runs} runs passed in ${summary.seconds.toFixed(1)} s -> ${REPORT}`);
for (const [c, b] of Object.entries(byChapter)) console.log(`  ${c}: ${b.ok}/${b.runs} ok, ${b.randomSteps} random steps, ${b.saveLoads} save/load`);
void dyn;
process.exit(failed.length ? 1 : 0);
