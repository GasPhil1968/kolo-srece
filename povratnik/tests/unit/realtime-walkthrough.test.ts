// Every chapter played through by its solver with real timing (the simulations run instantly, where a
// wait that can never end in real time - an animation that is kept on its last frame, a line nobody can
// see - passes unnoticed). The reader needs time for every line (readTime) and for every choice, as a
// player would; the player must get control back within two minutes of game time after every action.
import { describe, expect, it } from 'vitest';
import { Sim } from '../../tools/sim/harness';
import { SOLVERS } from '../../tools/sim/solvers';

const DT = 1 / 30;

/** How long a reader needs before a line can be clicked on: a short settle plus reading speed (German
 * prose read at about 14 characters per second) - so the time measured is what a player spends. */
export const readTime = (text: string): number => 1.5 + text.length / 14;
/** Deciding among the options on screen: two seconds plus reading them. */
const choiceTime = (texts: string[]): number => 2 + texts.join(' ').length / 14;

function playRealtime(chapter: string): { steps: number; seconds: number } {
  const sim = new Sim({ instant: false, dt: DT });
  const e = sim.engine;
  e.newChapter(chapter);
  let seconds = 0;
  let steps = 0;
  let decided = 0;
  const done = () => e.gameEnded || e.state.chapter !== chapter;
  while (!done()) {
    let waited = 0;
    for (;;) {
      const m = e.inputMode();
      if (m === 'choice') {
        // A reader reads the options, then decides.
        const opts = sim.options();
        if (decided === 0) decided = choiceTime(opts);
        if (decided > 0) {
          decided -= DT;
          e.update(DT);
          seconds += DT;
          continue;
        }
      }
      if (done() || m === 'choice' || (m === 'combat' && e.combat?.phase === 'cue')) break;
      if (m === 'free' && !e.isWalking('pc')) {
        // One more tick lets rules fire; they may take control again.
        e.update(DT);
        seconds += DT;
        if (e.inputMode() === 'free' && !e.isWalking('pc')) break;
        continue;
      }
      if (e.speech) {
        expect(e.speech.text.trim().length, 'visible line').toBeGreaterThan(0);
        if (e.speech.t > readTime(e.speech.text)) e.intent({ k: 'advance' });
      } else if (m === 'speech') throw new Error(`${chapter}: speech mode without a line`);
      if (m === 'card' && waited > 4) e.intent({ k: 'advance' });
      e.update(DT);
      waited += DT;
      seconds += DT;
      if (waited > 120) throw new Error(`${chapter}: no control after 120 s (mode ${m}, owners ${e.lockOwners().join(',')}, room ${e.state.room})`);
    }
    if (done()) break;
    decided = 0;
    const step = SOLVERS[chapter](sim);
    if (!step) throw new Error(`${chapter}: solver found no next step in ${e.state.room}`);
    sim.do(step);
    if (++steps > 400) throw new Error(`${chapter}: more than 400 solver steps`);
  }
  expect(sim.errors).toEqual([]);
  return { steps, seconds };
}

describe('real-time walkthroughs', () => {
  for (const chapter of Object.keys(SOLVERS)) {
    it(`${chapter} can be finished with real timing`, () => {
      const r = playRealtime(chapter);
      console.log(`${chapter}: ${r.steps} actions, ${(r.seconds / 60).toFixed(1)} min of game time (reading time included)`);
      expect(r.steps).toBeGreaterThan(0);
    }, 120_000);
  }
});
