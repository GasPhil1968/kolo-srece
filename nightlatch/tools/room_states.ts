// Records a save state for the first and last visit of every room during one canonical
// playthrough. The browser tests load these to screenshot every room in context.
//   npx tsx tools/room_states.ts  ->  reports/raw/room_states.json
import { mkdirSync, writeFileSync } from 'node:fs';
import { CONTENT } from '../src/content';
import { serialize } from '../src/engine/state';
import { Sim, readySteps } from './sim/harness';
import { STEPS } from './walkthrough';

const sim = new Sim(CONTENT, 1);
await sim.start();
const first: Record<string, string> = {};
const last: Record<string, string> = {};
const record = () => {
  const s = sim.game.state;
  if (!s.room || s.ended) return;
  const json = serialize(s);
  if (!first[s.room]) first[s.room] = json;
  last[s.room] = json;
};
record();
const origAct = sim.act.bind(sim);
sim.act = async (a) => {
  await origAct(a);
  record();
};
for (let i = 0; i < 600 && !sim.game.state.ended; i++) {
  const ready = readySteps(sim.game, STEPS);
  if (!ready.length) break;
  await sim.runStep(ready[0]);
}
mkdirSync('reports/raw', { recursive: true });
writeFileSync('reports/raw/room_states.json', JSON.stringify({ first, last }));
const missing = Object.keys(CONTENT.rooms).filter((r) => !first[r]);
console.log(`room states: ${Object.keys(first).length} rooms` + (missing.length ? `, never visited: ${missing.join(', ')}` : ''));
