// Automated playtest campaign: thousands of deterministic simulated players run the real
// game logic (src/engine + src/content) through the same Game.perform() entry point the
// browser uses. Every run is reproducible from its seed.
//
//   npx tsx tools/playtest.ts --runs 2000            # full campaign, 4 worker processes
//   npx tsx tools/playtest.ts --runs 50 --only chaos --workers 1
//   npx tsx tools/playtest.ts --replay 1234          # re-run one run id with a verbose log
//
// Writes reports/playtest-report.json, reports/playtest-runs.csv and docs/TEST_REPORT.md.
import { fork } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { CONTENT } from '../src/content';
import { deserialize, serialize } from '../src/engine/state';
import { Rng, Sim, readySteps, type WStep } from './sim/harness';
import { STEPS } from './walkthrough';

const argv = process.argv.slice(2);
const arg = (name: string, def: string) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : def;
};
const RUNS = Number(arg('runs', '2000'));
const SEED = Number(arg('seed', '1'));
/** --seeds 1,2,3 runs one full campaign per seed and reports them together. */
const SEEDS = arg('seeds', '') ? arg('seeds', '').split(',').map(Number) : [SEED];
const ONLY = arg('only', '');
const WORKERS = Math.max(1, Number(arg('workers', String(Math.min(4, cpus().length)))));
const REPLAY = arg('replay', '');

// ------------------------------------------------------------------ categories
interface Category { id: string; share: number; desc: string }
const CATEGORIES: Category[] = [
  { id: 'critical', share: 0.08, desc: 'Critical path: walkthrough steps executed in a random valid order, no detours.' },
  { id: 'explorer', share: 0.22, desc: 'Random valid order plus bursts of random actions between steps: every hotspot and NPC, wrong items on everything, wrong item combinations, repeated and random dialogue, random evidence, random deductions and timeline orders, wrong codes.' },
  { id: 'saveload', share: 0.14, desc: 'Save and load into a brand-new Game after milestones, reload the latest autosave, and roll back to older saves.' },
  { id: 'chapter', share: 0.24, desc: 'Start from each chapter’s opening save, play randomly for 40–250 actions, then the solver must still finish the chapter (softlock detection).' },
  { id: 'chaos', share: 0.12, desc: 'Long random sessions (150–600 actions incl. rapid travel and save/load) from a random chapter; the solver must then finish the whole game.' },
  { id: 'rapid', share: 0.08, desc: 'Rapid location switching: 10–40 random exits/map hops between every step.' },
  { id: 'outoforder', share: 0.12, desc: 'Before each step, try the actions of up to three steps that are not available yet (out-of-order triggers), then continue.' },
];

function schedule(runs: number): string[] {
  const cats = ONLY ? CATEGORIES.filter((c) => c.id === ONLY) : CATEGORIES;
  const total = cats.reduce((a, c) => a + c.share, 0);
  const out: string[] = [];
  cats.forEach((c, i) => {
    const n = i === cats.length - 1 ? runs - out.length : Math.round((runs * c.share) / total);
    for (let k = 0; k < n; k++) out.push(c.id);
  });
  // interleave so every worker gets a mix
  const rng = new Rng(SEED);
  return rng.shuffle(out);
}

// ------------------------------------------------------------------ run results
interface RunResult {
  id: number;
  campaign: number;
  category: string;
  seed: number;
  ok: boolean;
  reason: string;
  startChapter: number;
  endChapter: number;
  ended: boolean;
  steps: number;
  actions: number;
  dialogChoices: number;
  saves: number;
  loads: number;
  autosaves: number;
  roomChanges: number;
  transitions: number;
  wrongItemTries: number;
  outOfOrderTries: number;
  violations: string[];
  exceptions: string[];
  failedTransitions: string[];
  softlock: string;
  recent: string[];
  ms: number;
  // coverage
  rooms: string[];
  clues: string[];
  deds: string[];
  docs: string[];
  items: string[];
  options: string[];
  hotspots: string[];
  travel: string[];
  sfx: string[];
  music: string[];
}

// ------------------------------------------------------------------ the solver
/** Plays walkthrough steps in a random valid order until `until` holds or the game ends. */
async function solve(sim: Sim, rng: Rng, until: () => boolean, between?: (lastOk: boolean) => Promise<void>): Promise<{ reason: string; steps: number; softlock: string }> {
  const fails = new Map<string, number>();
  let steps = 0;
  let guard = 0;
  while (!sim.game.state.ended && !until()) {
    if (++guard > 900) return { reason: 'step budget exhausted', steps, softlock: '' };
    const all = readySteps(sim.game, STEPS);
    const ready = all.filter((s) => (fails.get(s.id) ?? 0) < 3);
    if (!ready.length) {
      const g = sim.game;
      const where = `chapter ${g.state.chapter}, room ${g.state.room}`;
      if (all.length) return { reason: `steps keep failing (${all.map((s) => s.id).join(', ')}) in ${where}: ${sim.log.slice(-1)[0] ?? ''}`, steps, softlock: '' };
      const open = g.objectives().filter((o) => !o.done).map((o) => o.def.id).join(', ');
      return { reason: `no applicable step in ${where}`, steps, softlock: `${where}; open objectives: ${open || 'none'}` };
    }
    const st = rng.pick(ready);
    const ok = await sim.runStep(st);
    if (ok) {
      steps++;
      fails.clear(); // progress can make a failed step possible again
    } else fails.set(st.id, (fails.get(st.id) ?? 0) + 1);
    if (between && !sim.game.state.ended && !until()) await between(ok);
  }
  return { reason: '', steps, softlock: '' };
}

// ------------------------------------------------------------------ chapter openings
/** States at the start of each chapter, from one canonical playthrough. */
async function chapterOpenings(): Promise<Record<number, string>> {
  const sim = new Sim(CONTENT, SEED);
  await sim.start();
  const out: Record<number, string> = { 1: serialize(sim.game.state) };
  let ch = 1;
  for (let i = 0; i < 400 && !sim.game.state.ended; i++) {
    const ready = readySteps(sim.game, STEPS);
    if (!ready.length) break;
    await sim.runStep(ready[0]);
    if (sim.game.state.chapter !== ch) {
      ch = sim.game.state.chapter;
      // the autosave written by the chapter opening is exactly what a player would load
      const auto = [...sim.p.autosaves].reverse().find((a) => deserialize(a.json).chapter === ch);
      out[ch] = auto?.json ?? serialize(sim.game.state);
    }
  }
  if (!sim.game.state.ended) throw new Error('canonical playthrough did not finish: ' + sim.log.slice(-3).join(' / '));
  return out;
}

// ------------------------------------------------------------------ one run
async function runOne(id: number, category: string, openings: Record<number, string>, verbose = false): Promise<RunResult> {
  const seed = SEED * 1000003 + id;
  const rng = new Rng(seed ^ 0x5bd1e995);
  const t0 = performance.now();
  let startChapter = 1;
  let sim: Sim;
  let target: () => boolean;
  let between: ((lastOk: boolean) => Promise<void>) | undefined;

  if (category === 'chapter' || category === 'chaos') {
    startChapter = category === 'chapter' ? 1 + (id % 8) : 1 + rng.int(8);
    sim = new Sim(CONTENT, seed, startChapter === 1 ? undefined : deserialize(openings[startChapter]));
    if (startChapter === 1) await sim.start();
  } else {
    sim = new Sim(CONTENT, seed);
    await sim.start();
  }
  sim.p.logging = verbose;
  target = () => sim.game.state.ended;
  let rollbacks = 0;
  const milestones: string[] = [];

  switch (category) {
    case 'explorer':
      between = async (lastOk) => {
        if (rng.chance(0.65)) await sim.noise(rng.range(1, 14), { pairs: 0.6 });
        if (rng.chance(0.3)) await sim.chat();
        // walk out of the next conversation now and then (never twice running on the same step)
        sim.p.impatient = lastOk && rng.chance(0.15) ? rng.range(1, 8) : 0;
      };
      break;
    case 'saveload':
      between = async () => {
        milestones.push(serialize(sim.game.state));
        const r = rng.next();
        if (r < 0.45) sim.saveLoad();
        else if (r < 0.6 && sim.p.autosaves.length) sim.load(sim.p.autosaves[sim.p.autosaves.length - 1].json);
        else if (r < 0.66 && milestones.length > 4 && rollbacks < 6) {
          rollbacks++;
          sim.load(milestones[milestones.length - 1 - rng.range(1, 3)]);
        }
      };
      break;
    case 'chapter': {
      await sim.noise(rng.range(40, 250), { pairs: 0.5 });
      const ch = startChapter;
      target = () => sim.game.state.ended || sim.game.state.chapter > ch;
      break;
    }
    case 'chaos': {
      const budget = rng.range(150, 600);
      while (sim.stats.actions < budget && !sim.game.state.ended) {
        const r = rng.next();
        if (r < 0.6) await sim.noise(rng.range(5, 30), { pairs: 0.4 });
        else if (r < 0.9) await sim.hop(rng.range(3, 15));
        else sim.saveLoad();
      }
      break;
    }
    case 'rapid':
      between = async () => {
        await sim.hop(rng.range(10, 40));
      };
      break;
    case 'outoforder':
      between = async () => {
        const g = sim.game;
        const later = STEPS.filter((s) => s.chapter === g.state.chapter && !g.cond(s.when) && !g.cond(s.done));
        for (const st of rng.shuffle(later).slice(0, 3)) {
          if (g.state.ended) break;
          sim.stats.outOfOrderTries++;
          sim.p.sayPlan = st.say ?? [];
          sim.p.showPlan = st.show ?? [];
          if (st.room && !(await sim.go(st.room))) continue;
          for (const a of st.do) if (a.t !== 'go' && !sim.game.state.ended) await sim.act(a);
        }
      };
      break;
  }

  const res = await solve(sim, rng, target, between);
  const s = sim.game.state;
  const reachedTarget = target();
  const violations = [...new Set(sim.violations)];
  const ok = !res.reason && reachedTarget && !violations.length && !sim.exceptions.length && !sim.failedTransitions.length;
  const optionKeys = s.seen.filter((k) => /^[a-z0-9_]+\.[a-z0-9_]+$/.test(k));
  const result: RunResult = {
    id, campaign: SEED, category, seed, ok,
    reason: res.reason || (!reachedTarget ? 'target not reached' : violations[0] ?? sim.exceptions[0] ?? sim.failedTransitions[0] ?? ''),
    startChapter, endChapter: s.chapter, ended: s.ended,
    steps: res.steps,
    ...sim.stats,
    violations: violations.slice(0, 10),
    exceptions: sim.exceptions.slice(0, 5),
    failedTransitions: sim.failedTransitions.slice(0, 5),
    softlock: res.softlock,
    recent: ok ? [] : [...sim.recent],
    ms: Math.round(performance.now() - t0),
    rooms: s.visited, clues: s.clues, deds: s.deds, docs: s.read, items: [...sim.held],
    options: optionKeys,
    hotspots: [...sim.seen].filter((k) => k.startsWith('look:hs:') || k.startsWith('use:hs:')).map((k) => k.split(':')[2]),
    travel: [...sim.seen].filter((k) => k.startsWith('travel:')).map((k) => k.slice(7)),
    sfx: [...sim.p.sfxPlayed], music: [...sim.p.musicPlayed],
  };
  if (verbose) {
    console.log(sim.p.log.join('\n'));
    console.log(JSON.stringify({ ...result, rooms: undefined, clues: undefined, deds: undefined, docs: undefined, items: undefined, options: undefined, hotspots: undefined, travel: undefined, sfx: undefined, music: undefined }, null, 1));
    console.log('log:', sim.log.join('\n'));
  }
  return result;
}

// ------------------------------------------------------------------ workers
async function worker(k: number, n: number) {
  const plan = schedule(RUNS);
  const openings = await chapterOpenings();
  const results: RunResult[] = [];
  for (let i = k; i < plan.length; i += n) results.push(await runOne(i, plan[i], openings));
  process.send!({ results });
}

async function main() {
  if (REPLAY) {
    const plan = schedule(RUNS);
    const id = Number(REPLAY);
    await runOne(id, plan[id], await chapterOpenings(), true);
    return;
  }
  const t0 = Date.now();
  const all: RunResult[] = [];
  for (const seed of SEEDS) {
    const plan = schedule(RUNS);
    console.log(`playtest: ${plan.length} runs, seed ${seed}, ${WORKERS} worker process(es)`);
    const base = argv.filter((a, i) => !['--seeds', '--seed'].includes(a) && !['--seeds', '--seed'].includes(argv[i - 1]));
    const parts = await Promise.all(
      Array.from({ length: WORKERS }, (_, k) =>
        new Promise<RunResult[]>((resolve, reject) => {
          const child = fork(process.argv[1], [...base, '--seed', String(seed), '--worker', String(k), '--of', String(WORKERS)], { execArgv: process.execArgv });
          let got: RunResult[] | null = null;
          child.on('message', (m: { results: RunResult[] }) => (got = m.results));
          child.on('exit', (code) => (got ? resolve(got) : reject(new Error(`worker ${k} exited with ${code}`))));
        }),
      ),
    );
    all.push(...parts.flat().sort((a, b) => a.id - b.id));
  }
  report(all, Date.now() - t0);
}

// ------------------------------------------------------------------ report
function report(results: RunResult[], ms: number) {
  mkdirSync('reports', { recursive: true });
  const C = CONTENT;
  const sum = (f: (r: RunResult) => number, rs = results) => rs.reduce((a, r) => a + f(r), 0);
  const avg = (f: (r: RunResult) => number, rs = results) => (rs.length ? sum(f, rs) / rs.length : 0);
  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const union = (f: (r: RunResult) => string[]) => new Set(results.flatMap(f));

  const cov = {
    rooms: union((r) => r.rooms), clues: union((r) => r.clues), deds: union((r) => r.deds), docs: union((r) => r.docs),
    items: union((r) => r.items), options: union((r) => r.options), hotspots: union((r) => r.hotspots), travel: union((r) => r.travel),
    sfx: union((r) => r.sfx), music: union((r) => r.music),
  };
  const allOptions: string[] = [];
  for (const d of Object.values(C.dialogs)) for (const n of Object.values(d.nodes)) for (const o of n.options) allOptions.push(`${d.id}.${o.id}`);
  const allHotspots = [...new Set(Object.values(C.rooms).flatMap((r) => Object.keys(r.hotspots)))];
  // documents opened by scripts or items; the rest are read from clue entries in the notebook
  // (a UI action the simulator does not take; the browser tests open the notebook)
  const scriptDocs = new Set<string>();
  const walk = (x: unknown): void => {
    if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === 'object') {
      const o = x as Record<string, unknown>;
      if (typeof o.doc === 'string' && !('title' in o)) scriptDocs.add(o.doc);
      Object.values(o).forEach(walk);
    }
  };
  walk(C.rooms);
  walk(C.dialogs);
  walk(C.items);
  walk(C.npcs);
  walk(C.watch);
  walk(C.start);
  walk(C.closeups);
  walk(C.deductions);
  walk(C.timelines);
  const docsReachable = Object.keys(C.docs).filter((d) => scriptDocs.has(d));
  const unreachable = {
    rooms: Object.keys(C.rooms).filter((x) => !cov.rooms.has(x)),
    locations: Object.values(C.locations).filter((l) => l.when !== 'false').map((l) => l.id).filter((x) => !cov.travel.has(x)),
    clues: Object.keys(C.clues).filter((x) => !cov.clues.has(x)),
    deductions: Object.keys(C.deductions).filter((x) => !cov.deds.has(x)),
    items: Object.keys(C.items).filter((x) => !cov.items.has(x)),
    docs: docsReachable.filter((x) => !cov.docs.has(x)),
    dialogOptions: allOptions.filter((x) => !cov.options.has(x)),
    hotspots: allHotspots.filter((x) => !cov.hotspots.has(x)),
  };
  const byCat = CATEGORIES.map((c) => {
    const rs = results.filter((r) => r.category === c.id);
    const done = rs.filter((r) => r.ok);
    return {
      id: c.id, desc: c.desc, runs: rs.length, passed: done.length, failed: rs.length - done.length,
      avgActions: Math.round(avg((r) => r.actions, rs)), avgSteps: Math.round(avg((r) => r.steps, rs)),
      avgMs: Math.round(avg((r) => r.ms, rs)),
    };
  }).filter((c) => c.runs);
  const fullGames = results.filter((r) => r.category !== 'chapter');
  const finished = fullGames.filter((r) => r.ended && r.ok);
  const totals = {
    runs: results.length, passed: passed.length, failed: failed.length,
    actions: sum((r) => r.actions), dialogChoices: sum((r) => r.dialogChoices), saves: sum((r) => r.saves), loads: sum((r) => r.loads),
    autosaves: sum((r) => r.autosaves), roomChanges: sum((r) => r.roomChanges), chapterTransitions: sum((r) => r.transitions),
    wrongItemTries: sum((r) => r.wrongItemTries), outOfOrderTries: sum((r) => r.outOfOrderTries),
    endingsReached: results.filter((r) => r.ended).length,
    exceptions: sum((r) => r.exceptions.length), runsWithViolations: results.filter((r) => r.violations.length).length,
    failedTransitions: sum((r) => r.failedTransitions.length), softlocks: results.filter((r) => r.softlock).length,
    saveLoadFailures: results.filter((r) => r.violations.some((v) => v.includes('save/load'))).length,
    avgActionsToFinish: Math.round(avg((r) => r.actions, finished)), avgStepsToFinish: Math.round(avg((r) => r.steps, finished)),
    durationSec: Math.round(ms / 1000),
  };
  const reasons = new Map<string, number>();
  for (const r of failed) {
    const key = r.reason.replace(/\d+/g, '#').slice(0, 160);
    reasons.set(key, (reasons.get(key) ?? 0) + 1);
  }
  const json = {
    generated: new Date().toISOString(), seeds: SEEDS, runsPerSeed: RUNS, workers: WORKERS, node: process.version,
    totals, categories: byCat,
    perSeed: SEEDS.map((sd) => {
      const rs = results.filter((r) => r.campaign === sd);
      return { seed: sd, runs: rs.length, passed: rs.filter((r) => r.ok).length, failed: rs.filter((r) => !r.ok).length, actions: sum((r) => r.actions, rs) };
    }),
    failureReasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]).map(([reason, count]) => ({ reason, count })),
    failures: failed.slice(0, 60).map((r) => ({ id: r.id, campaign: r.campaign, category: r.category, seed: r.seed, startChapter: r.startChapter, endChapter: r.endChapter, reason: r.reason, softlock: r.softlock, violations: r.violations, exceptions: r.exceptions, failedTransitions: r.failedTransitions, recent: r.recent })),
    coverage: Object.fromEntries(Object.entries(cov).map(([k, v]) => [k, v.size])),
    unreachable,
  };
  writeFileSync('reports/playtest-report.json', JSON.stringify(json, null, 1));
  const cols = ['campaign', 'id', 'category', 'seed', 'ok', 'startChapter', 'endChapter', 'ended', 'steps', 'actions', 'dialogChoices', 'saves', 'loads', 'autosaves', 'roomChanges', 'transitions', 'wrongItemTries', 'outOfOrderTries', 'ms', 'reason'] as const;
  writeFileSync('reports/playtest-runs.csv', [cols.join(','), ...results.map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(','))].join('\n') + '\n');

  // console summary
  console.log(`\n${totals.runs} runs in ${totals.durationSec}s: ${totals.passed} passed, ${totals.failed} failed`);
  for (const c of byCat) console.log(`  ${c.id.padEnd(11)} ${String(c.passed).padStart(5)}/${String(c.runs).padEnd(5)} avg ${c.avgActions} actions`);
  console.log(`actions ${totals.actions}, dialog choices ${totals.dialogChoices}, saves ${totals.saves}, loads ${totals.loads}, endings ${totals.endingsReached}`);
  console.log(`exceptions ${totals.exceptions}, runs with violations ${totals.runsWithViolations}, failed transitions ${totals.failedTransitions}, softlock candidates ${totals.softlocks}`);
  for (const f of json.failureReasons.slice(0, 15)) console.log(`  ${String(f.count).padStart(4)}x ${f.reason}`);
  for (const [k, v] of Object.entries(unreachable)) if (v.length) console.log(`never reached ${k} (${v.length}): ${v.slice(0, 30).join(', ')}`);
  writeMarkdown(json, results);
}

function writeMarkdown(json: ReturnType<typeof JSON.parse>, results: RunResult[]) {
  const t = json.totals;
  const C = CONTENT;
  let md = `# Night Latch — Automated playtest report\n\n`;
  const cmd = json.seeds.length > 1 ? 'npm run playtest:sweep' : 'npm run playtest';
  md += `Generated ${json.generated} by \`${cmd}\` (\`tools/playtest.ts\`): ${json.seeds.length} campaign(s) of ${json.runsPerSeed} runs, seed(s) ${json.seeds.join(', ')}, Node ${json.node}.\n\n`;
  md += `> **These are automated simulations, not human playtests.** Each run is a scripted or randomized virtual player driving the real game logic `;
  md += `(\`src/engine\` + \`src/content\`, the same code the browser build runs) through \`Game.perform()\`, the entry point every mouse click uses. `;
  md += `Rendering, input, animation timing and audio are exercised separately by the Playwright browser tests: see [BROWSER_TEST_REPORT.md](BROWSER_TEST_REPORT.md).\n\n`;
  md += `## Summary\n\n| | |\n|---|---|\n`;
  md += `| Runs executed | **${t.runs}** |\n| Passed | **${t.passed}** |\n| Failed | **${t.failed}** |\n`;
  md += `| Game endings reached | ${t.endingsReached} |\n| Chapter transitions | ${t.chapterTransitions} |\n`;
  md += `| Player actions simulated | ${t.actions.toLocaleString('en-US')} |\n| Dialogue choices | ${t.dialogChoices.toLocaleString('en-US')} |\n`;
  md += `| Wrong item / combination attempts | ${t.wrongItemTries.toLocaleString('en-US')} |\n| Out-of-order attempts | ${t.outOfOrderTries.toLocaleString('en-US')} |\n`;
  md += `| Saves / loads (fresh Game per load) | ${t.saves} / ${t.loads} |\n| Autosaves written | ${t.autosaves} |\n| Room changes | ${t.roomChanges.toLocaleString('en-US')} |\n`;
  md += `| Exceptions | ${t.exceptions} |\n| Runs with invariant violations | ${t.runsWithViolations} |\n| Failed chapter transitions | ${t.failedTransitions} |\n`;
  md += `| Softlock candidates | ${t.softlocks} |\n| Save/load failures | ${t.saveLoadFailures} |\n`;
  md += `| Average actions to finish the game | ${t.avgActionsToFinish} |\n| Average walkthrough steps to finish | ${t.avgStepsToFinish} |\n| Wall-clock time | ${t.durationSec} s |\n\n`;
  if (json.seeds.length > 1) {
    md += `## Campaigns\n\n| Seed | Runs | Passed | Failed | Actions |\n|---|---|---|---|---|\n`;
    for (const p of json.perSeed) md += `| ${p.seed} | ${p.runs} | ${p.passed} | ${p.failed} | ${p.actions.toLocaleString('en-US')} |\n`;
    md += '\n';
  }
  md += `## Categories\n\n| Category | What it does | Runs | Passed | Failed | Avg actions |\n|---|---|---|---|---|---|\n`;
  for (const c of json.categories) md += `| ${c.id} | ${c.desc} | ${c.runs} | ${c.passed} | ${c.failed} | ${c.avgActions} |\n`;
  md += `\n## Invariants checked after every action\n\n`;
  md += `- no exceptions; no script errors (unknown items, rooms, dialogs, nodes, points…); the interpreter is idle again\n`;
  md += `- inventory has no duplicates or unknown items; nothing is both held and confiscated\n- the room, clues, deductions and map pins all exist\n`;
  md += `- chapters only move forward, one at a time, after the previous chapter’s completion condition, through the next chapter’s locked room\n`;
  md += `- an open objective exists at all times, so the hint button always has something to say\n`;
  md += `- save → load round-trips are lossless, and play continues correctly in a brand-new \`Game\` built from the save\n`;
  md += `- softlock detection: from wherever random play leaves the game, the solver must still be able to finish the chapter or the game\n\n`;
  md += `## Coverage across all runs\n\n| Content | Reached | Total |\n|---|---|---|\n`;
  const total: Record<string, number> = {
    rooms: Object.keys(C.rooms).length, clues: Object.keys(C.clues).length, deds: Object.keys(C.deductions).length, docs: Object.keys(C.docs).length,
    items: Object.keys(C.items).length, travel: Object.values(C.locations).filter((l) => l.when !== 'false').length,
  };
  const label: Record<string, string> = { rooms: 'Rooms', clues: 'Clues', deds: 'Deductions', docs: 'Documents read', items: 'Items held', travel: 'Map locations travelled to', options: 'Dialogue options chosen', hotspots: 'Hotspots interacted with' };
  for (const [k, v] of Object.entries(json.coverage as Record<string, number>)) {
    if (!label[k]) continue;
    md += `| ${label[k]} | ${v} | ${total[k] ?? '—'} |\n`;
  }
  md += `\n### Never reached\n\n`;
  const un = json.unreachable as Record<string, string[]>;
  let anyUn = false;
  for (const [k, v] of Object.entries(un)) {
    if (!v.length) continue;
    anyUn = true;
    md += `- **${k}** (${v.length}): ${v.join(', ')}\n`;
  }
  if (!anyUn) md += `Nothing: every room, location, clue, deduction, item, document, dialogue option and hotspot was reached by at least one simulated player.\n`;
  md += `\n## Failures\n\n`;
  if (!json.failures.length) md += `None. All ${t.runs} runs reached their goal without exceptions, invariant violations, failed transitions or softlocks.\n`;
  else {
    md += `| Count | Reason |\n|---|---|\n`;
    for (const f of json.failureReasons) md += `| ${f.count} | ${String(f.reason).replace(/\|/g, '\\|')} |\n`;
    md += `\nReplay any run with \`npx tsx tools/playtest.ts --runs ${json.runsPerSeed} --seed <seed> --replay <id>\`. First failures (seed/id): ${json.failures.slice(0, 20).map((f: { id: number; campaign: number }) => `${f.campaign}/${f.id}`).join(', ')}.\n`;
  }
  if (existsSync('docs/BUGS_FIXED.md')) md += '\n' + readFileSync('docs/BUGS_FIXED.md', 'utf8').replace(/^# .*\n/, '## Bugs the automated tests found (all fixed)\n');
  md += `\n## Reproducing\n\n\`\`\`\nnpm run validate        # static content/art/audio contract check\nnpm run playtest        # one campaign: ${json.runsPerSeed} runs, seed 1 (~15 s)\nnpm run playtest:sweep  # six campaigns, seeds 1-6 (this report when it lists six seeds)\nnpm run e2e             # Playwright browser tests (after npm run build)\n\`\`\`\n`;
  md += `\nPer-run results: \`reports/playtest-runs.csv\`; machine-readable summary: \`reports/playtest-report.json\`.\n`;
  void results;
  writeFileSync('docs/TEST_REPORT.md', md);
}

if (argv.includes('--worker')) {
  void worker(Number(arg('worker', '0')), Number(arg('of', '1')));
} else {
  void main();
}

export type { WStep };
