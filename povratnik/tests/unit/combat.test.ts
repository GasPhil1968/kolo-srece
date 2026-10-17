import { describe, expect, it } from 'vitest';
import { CombatRuntime, type CombatDef } from '../../src/core/combat';
import { COMBATS } from '../../src/content/chapters';

const toy: CombatDef = {
  id: 'toy',
  pc: 'pc',
  pair: 'pair',
  actions: [
    { id: 'high', label: 'Hoch' },
    { id: 'low', label: 'Tief' },
    { id: 'back', label: 'Zurück' },
  ],
  intro: { pose: { pair: 'draw' }, text: 'Sie ziehen.', time: 1 },
  steps: [
    { id: 's1', cue: { pair: 'c1' }, cueText: 'Von unten.', actions: ['high', 'low', 'back'], answer: 'low', success: { pair: 'g1' }, successText: 'Gut.', fail: { pair: 'f' }, failText: 'Getroffen.' },
    { id: 's2', cue: { pair: 'c2' }, cueText: 'Quer.', actions: ['high', 'low', 'back'], answer: 'back', success: { pair: 'g2' }, successText: 'Gut.', fail: { pair: 'f' }, failText: 'Getroffen.', lesson: 'Zurück!' },
    { id: 's3', cue: { pair: 'c3' }, cueText: 'Von oben.', actions: ['high', 'low', 'back'], answer: 'high', success: { pair: 'g3' }, successText: 'Gut.', fail: { pair: 'f' }, failText: 'Getroffen.' },
  ],
  window: 2,
  lateText: 'Zu spät.',
  wonText: 'Gewonnen.',
};

function run(def: CombatDef, choose: (c: CombatRuntime) => string, opts: { relaxed?: boolean; limit?: number } = {}): CombatRuntime {
  const c = new CombatRuntime(def, { relaxedCombat: opts.relaxed });
  for (let i = 0; i < (opts.limit ?? 200) && !c.outcome; i++) {
    c.update(0, true);
    if (c.phase === 'cue') c.input(choose(c));
  }
  return c;
}

describe('CombatRuntime', () => {
  it('wins with the right answers and shows the intro first', () => {
    const c = new CombatRuntime(toy, {});
    expect(c.phase).toBe('intro');
    expect(c.actions).toEqual([]);
    const done = run(toy, (r) => r.current.answer);
    expect(done.outcome).toBe('won');
    expect(done.failures).toBe(0);
  });

  it('never wins by repeating one answer, and keeps offering the step after a failure', () => {
    for (const a of toy.actions) {
      const c = run(toy, () => a.id, { limit: 60 });
      expect(c.outcome).toBeNull();
      expect(c.failures).toBeGreaterThan(0);
      expect(['cue', 'fail', 'success']).toContain(c.phase);
    }
  });

  it('a failure is recoverable: the same step returns and then the fight goes on', () => {
    let first = true;
    const c = run(toy, (r) => {
      if (r.current.id === 's2' && first) {
        first = false;
        return 'high';
      }
      return r.current.answer;
    });
    expect(c.outcome).toBe('won');
    expect(c.failures).toBe(1);
    expect(c.history.filter((h) => h.step === 's2').map((h) => h.ok)).toEqual([false, true]);
  });

  it('a missed decision times out as a failure; relaxed mode has no time limit and grows nothing', () => {
    const c = new CombatRuntime(toy, {});
    c.update(1.2, false); // intro over
    expect(c.phase).toBe('cue');
    c.update(2.1, false);
    expect(c.phase).toBe('fail');
    expect(c.message.startsWith('Zu spät.')).toBe(true);
    expect(c.window).toBeGreaterThan(2);
    const r = new CombatRuntime(toy, { relaxedCombat: true });
    r.update(1.2, false);
    r.update(500, false);
    expect(r.phase).toBe('cue');
    expect(r.window).toBe(Infinity);
  });

  it('adds the remembered lesson to the explanation of a failure', () => {
    const c = run(toy, (r) => (r.current.id === 's2' ? 'low' : r.current.answer), { limit: 7 });
    expect(c.history.some((h) => h.step === 's2' && !h.ok)).toBe(true);
  });

  it('every fight in the game needs more than one kind of answer', () => {
    for (const def of COMBATS) {
      const answers = new Set(def.steps.map((s) => s.answer));
      expect(answers.size, def.id).toBeGreaterThan(1);
      for (const a of def.actions) {
        const c = run(def, () => a.id, { limit: 120 });
        expect(c.outcome, `${def.id} with ${a.id} only`).toBeNull();
      }
    }
  });
});
