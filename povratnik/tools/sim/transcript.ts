// Walkthrough transcript: plays a chapter with its solver from the start (no random prefix) and prints
// every action, line, card, choice, close-up and room change in order. Used to read a chapter end to end.
//   npx tsx tools/sim/transcript.ts elftage [--out reports/transcript-elftage.txt]
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Sim } from './harness';
import { SOLVERS } from './solvers';
import type { Cmd } from '../../src/core/cmd';
import { dyn } from '../../src/core/content';

const args = process.argv.slice(2);
const chapter = args[0];
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : null;
if (!chapter || !SOLVERS[chapter]) {
  console.error(`usage: transcript.ts <${Object.keys(SOLVERS).join('|')}> [--out file]`);
  process.exit(2);
}

const sim = new Sim({ instant: true });
const lines: string[] = [];
const eng = sim.engine as unknown as { begin(cmd: Cmd): unknown };
const begin = eng.begin.bind(sim.engine);
eng.begin = (cmd: Cmd) => {
  switch (cmd.k) {
    case 'say': {
      const e = sim.engine;
      const def = e.actorDef(cmd.actor);
      const who = cmd.actor === 'pc' ? e.chapter.pc.name : def ? dyn(def.name, e.state) : cmd.actor;
      lines.push(`  ${who.toUpperCase()}: ${cmd.text}`);
      break;
    }
    case 'vignette':
      lines.push(`  [${cmd.image}${cmd.captions.length ? ': ' + cmd.captions.join(' / ') : ''}]`);
      break;
    case 'narrate':
      lines.push(`  (${cmd.text})`);
      break;
    case 'card':
      lines.push(`== ${cmd.title}${cmd.lines.length ? ' – ' + cmd.lines.join(' / ') : ''} ==`);
      break;
    case 'choice':
      lines.push(`  ? ${cmd.options.map((o) => o.text).join(' | ')}`);
      break;
    case 'room':
      lines.push(`-> ${cmd.room} (${cmd.entry})`);
      break;
    case 'insert':
      if (cmd.spec?.sprite) lines.push(`  [close-up: ${cmd.spec.sprite.character} ${cmd.spec.sprite.anim}]`);
      break;
    case 'endChapter':
      lines.push('== Ende des Kapitels ==');
      break;
  }
  return begin(cmd);
};

sim.start(chapter);
const solver = SOLVERS[chapter];
let guard = 0;
while (sim.engine.state.chapter === chapter && !sim.engine.gameEnded) {
  if (++guard > 400) throw new Error('solver exceeded 400 steps');
  sim.settle();
  if (sim.engine.state.chapter !== chapter || sim.engine.gameEnded) break;
  const step = solver(sim);
  if (!step) throw new Error(`solver found no next step in ${sim.engine.state.room}`);
  const label = step.k === 'act' ? `${step.verb} ${step.target}` : step.k === 'useItem' ? `${step.item} -> ${step.target}` : step.k === 'choose' ? `choose ${step.id}` : step.k;
  lines.push(`> ${label}`);
  sim.do(step);
}
sim.settle();
const text = lines.join('\n') + '\n';
if (out) {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, text);
  console.log(`${lines.length} lines -> ${out}`);
} else process.stdout.write(text);
