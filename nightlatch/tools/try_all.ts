import { CONTENT } from '../src/content';
import { Sim, readySteps } from './sim/harness';
import { STEPS } from './walkthrough';

const sim = new Sim(CONTENT, Number(process.argv[2] ?? 1));
sim.p.logging = process.argv.includes('--log');
await sim.start();
let n = 0;
for (let i = 0; i < 600 && !sim.game.state.ended; i++) {
  const ready = readySteps(sim.game, STEPS);
  if (!ready.length) {
    console.log('NO READY STEPS at chapter', sim.game.state.chapter, 'room', sim.game.state.room);
    break;
  }
  const st = ready[0];
  const ok = await sim.runStep(st);
  n++;
  if (!ok) {
    console.log('FAIL ' + st.id + ' room=' + sim.game.state.room + ' ch=' + sim.game.state.chapter);
    console.log(sim.log.slice(-5).join('\n'));
    console.log('inv', sim.game.state.inv.join(','), '| stash', sim.game.state.stash.join(','));
    console.log(sim.p.log.slice(-30).join('\n'));
    break;
  }
}
if (process.argv.includes('--tail')) console.log(sim.p.log.slice(-Number(process.env.TAIL ?? 60)).join('\n'));
console.log('steps', n, 'ended', sim.game.state.ended, 'chapter', sim.game.state.chapter, 'actions', sim.stats.actions);
console.log('violations', [...new Set(sim.violations)].slice(0, 20));
