// Save states at the start of every chapter, for "Chapters" on the title menu. They come from
// one canonical playthrough of the walkthrough: each is the autosave the chapter's opening
// writes, so loading one is exactly what a player would load. The game shows these as they
// are, so a chapter starts with everything the earlier ones established.
//   npx tsx tools/chapter_starts.ts  ->  public/assets/chapter_starts.json
import { writeFileSync } from 'node:fs';
import { CONTENT } from '../src/content';
import { deserialize, serialize } from '../src/engine/state';
import { Sim, readySteps } from './sim/harness';
import { STEPS } from './walkthrough';

const SEED = 1;
const sim = new Sim(CONTENT, SEED);
await sim.start();
const out: Record<string, string> = { 1: sim.p.autosaves.find((a) => deserialize(a.json).chapter === 1)?.json ?? serialize(sim.game.state) };
let ch = 1;
for (let i = 0; i < 400 && !sim.game.state.ended; i++) {
  const ready = readySteps(sim.game, STEPS);
  if (!ready.length) break;
  const before = sim.p.autosaves.length;
  await sim.runStep(ready[0]);
  if (sim.game.state.chapter !== ch) {
    ch = sim.game.state.chapter;
    // the first autosave written after the chapter changed is the chapter's opening
    const opening = sim.p.autosaves.slice(before).find((a) => deserialize(a.json).chapter === ch);
    out[ch] = opening?.json ?? serialize(sim.game.state);
  }
}
if (!sim.game.state.ended) throw new Error('canonical playthrough did not finish: ' + sim.log.slice(-3).join(' / '));
if (Object.keys(out).length !== 8) throw new Error(`expected 8 chapter starts, got ${Object.keys(out).length}`);
writeFileSync('public/assets/chapter_starts.json', JSON.stringify(out));
console.log('chapter starts:', Object.entries(out).map(([n, j]) => `${n}: ${(j.length / 1024).toFixed(0)} KB`).join(', '));
