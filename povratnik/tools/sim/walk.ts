// Print a full solver walkthrough transcript for a chapter: npx tsx tools/sim/walk.ts sarajevo
import { Sim } from './harness';
import { SOLVERS } from './solvers';

const chapter = process.argv[2] ?? 'sarajevo';
const sim = new Sim({ instant: true });
sim.start(chapter);
let n = 0;
while (sim.engine.state.chapter === chapter && !sim.engine.gameEnded && n < 300) {
  sim.settle();
  if (sim.engine.state.chapter !== chapter || sim.engine.gameEnded) break;
  const step = SOLVERS[chapter](sim);
  if (!step) {
    console.log('NO STEP');
    break;
  }
  sim.do(step);
  sim.settle();
  n++;
}
console.log(sim.engine.log.filter((l) => !l.includes('set _pick')).join('\n'));
console.log(`steps=${n} ended=${sim.engine.gameEnded} chapter=${sim.engine.state.chapter} errors=${sim.errors.length} playTime=${sim.engine.state.playTime.toFixed(1)}`);
