// Regression: in the old Elf Tage, inspecting the scythe opened a dialogue that was never shown but held
// the input lock, so the game froze. Here every way of inspecting or using the scythe, in every visit
// where it can be reached, is played with real timing: the line must be visible (non-empty, owned by
// the speech view), must end on its own and on a click, and must hand the input back.
import { describe, expect, it } from 'vitest';
import { Sim } from '../../tools/sim/harness';
import { SOLVERS } from '../../tools/sim/solvers';
import type { Intent } from '../../src/core/engine';

const phaseOf = (sim: Sim) => (sim.engine.state.flags['et.phase'] as string | undefined) ?? 'pre';

/** Play the chapter with its solver (instant) until the predicate holds. */
function playUntil(pred: (sim: Sim) => boolean): Sim {
  const sim = new Sim({ instant: true });
  sim.start('elftage');
  for (let i = 0; i < 400 && !pred(sim); i++) {
    sim.settle();
    if (pred(sim)) break;
    const step = SOLVERS.elftage(sim);
    if (!step) throw new Error('solver stuck');
    sim.do(step);
  }
  sim.settle();
  expect(pred(sim)).toBe(true);
  return sim;
}

/** Run one intent with real timing and check the speech it produces. */
function inspect(sim: Sim, intent: Intent, opts: { dismiss: boolean }): string[] {
  const e = sim.engine;
  e.instant = false;
  expect(e.inputMode()).toBe('free');
  expect(e.intent(intent)).toBe(true);
  const seen: string[] = [];
  let t = 0;
  let clicked = false;
  while (t < 60) {
    e.update(1 / 60);
    t += 1 / 60;
    const mode = e.inputMode();
    if (e.speech) {
      // A line that holds the lock must be a real, visible line.
      expect(e.speech.text.trim().length).toBeGreaterThan(0);
      expect(mode).toBe('speech');
      if (!seen.includes(e.speech.text)) seen.push(e.speech.text);
      if (opts.dismiss && !clicked && e.speech.t > 0.3) {
        clicked = true;
        expect(e.intent({ k: 'advance' })).toBe(true);
      }
    } else if (mode === 'speech') throw new Error('speech mode without a speech view (invisible dialogue)');
    if (mode === 'free' && !e.isWalking('pc') && t > 0.1) break;
  }
  expect(e.inputMode()).toBe('free');
  expect(e.lockOwners()).toEqual([]);
  e.instant = true;
  return seen;
}

describe('Elf Tage: inspecting the scythe never leaves an invisible dialogue', () => {
  it('looking at the scythe on its hook (third morning) shows a line and returns control', () => {
    const sim = playUntil((s) => phaseOf(s) === 'm3' && s.engine.state.room === 'et_stall');
    for (const dismiss of [false, true]) {
      const lines = inspect(sim, { k: 'act', target: 'sense', verb: 'look' }, { dismiss });
      expect(lines.length).toBeGreaterThan(0);
    }
    // Taking it before the sixth day is refused with a visible line, not silently.
    expect(inspect(sim, { k: 'act', target: 'sense', verb: 'take' }, { dismiss: true }).length).toBe(1);
    expect(sim.engine.state.inventory).not.toContain('sense');
  });

  it('on the sixth day: hook, inventory look, use before the field, blunt and sharp swings', () => {
    const sim = playUntil((s) => phaseOf(s) === 'd6' && s.engine.state.room === 'et_stall');
    inspect(sim, { k: 'act', target: 'sense', verb: 'look' }, { dismiss: false });
    inspect(sim, { k: 'act', target: 'sense', verb: 'take' }, { dismiss: true });
    expect(sim.engine.state.inventory).toContain('sense');
    // Examining the item in the inventory (the old freeze) – both letting it run out and clicking it away.
    expect(inspect(sim, { k: 'examine', item: 'sense' }, { dismiss: false }).length).toBe(1);
    expect(inspect(sim, { k: 'examine', item: 'sense' }, { dismiss: true }).length).toBe(1);
    // Using it outside the field.
    expect(inspect(sim, { k: 'useItem', item: 'sense', target: 'raufe' }, { dismiss: true })).toContain('Auf seinem Feld.');
    expect(inspect(sim, { k: 'useItem', item: 'sense', target: 'self' }, { dismiss: true }).length).toBeGreaterThan(0);
    // On the field: the blunt swing, then sharpened, then examined again.
    const field = playUntil((s) => phaseOf(s) === 'd6' && s.engine.state.room === 'et_feld' && s.engine.state.inventory.includes('sense'));
    expect(inspect(field, { k: 'useItem', item: 'sense', target: 'feld' }, { dismiss: true }).length).toBe(1);
    expect(inspect(field, { k: 'examine', item: 'sense' }, { dismiss: false }).length).toBe(1);
  });

  it('after the field is mown the scythe still answers visibly', () => {
    const sim = playUntil((s) => phaseOf(s) === 'e6');
    expect(inspect(sim, { k: 'examine', item: 'sense' }, { dismiss: true })[0]).toContain('Schneide');
    expect(inspect(sim, { k: 'useItem', item: 'sense', target: 'feld' }, { dismiss: false })).toContain('Jetzt ist es gemäht.');
  });

  it('every inventory item of the chapter can be examined at any point without a lock', () => {
    const sim = playUntil((s) => phaseOf(s) === 'n11' && s.engine.state.room === 'et_gasse');
    for (const item of [...sim.engine.state.inventory]) {
      expect(inspect(sim, { k: 'examine', item }, { dismiss: true }).length).toBeGreaterThan(0);
    }
  });
});
