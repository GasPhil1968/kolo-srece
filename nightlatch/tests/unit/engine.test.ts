// Unit tests for the pure game engine (no Phaser): conditions, saves, routes, scripts.
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../src/content';
import { compile, evalCond, terms } from '../../src/engine/cond';
import { Game } from '../../src/engine/game';
import { HeadlessPresenter } from '../../src/engine/presenter';
import { edgesFrom, routeTo } from '../../src/engine/route';
import { deserialize, newState, serialize } from '../../src/engine/state';
import type { Content } from '../../src/engine/types';

function state(patch: Partial<ReturnType<typeof newState>> = {}) {
  return { ...newState(), ...patch };
}

describe('conditions', () => {
  const s = state({ inv: ['lighter'], clues: ['on_ice'], chapter: 3, flags: { a: true, n: 2, w: 'yes' }, room: 'office', visited: ['office'] });
  it('evaluates prefixed terms', () => {
    expect(evalCond('has:lighter', s)).toBe(true);
    expect(evalCond('has:hat', s)).toBe(false);
    expect(evalCond('clue:on_ice & room:office & visited:office', s)).toBe(true);
  });
  it('handles flags, comparisons and chapter numbers', () => {
    expect(evalCond('a & n=2 & n>=2 & n<3 & w=yes', s)).toBe(true);
    expect(evalCond('chapter=3 & chapter>2 & chapter!=4', s)).toBe(true);
    expect(evalCond('missing', s)).toBe(false);
    expect(evalCond('missing=false', s)).toBe(true);
  });
  it('respects precedence and parentheses', () => {
    expect(evalCond('a | missing & missing', s)).toBe(true);
    expect(evalCond('(a | missing) & missing', s)).toBe(false);
    expect(evalCond('!(missing | !a)', s)).toBe(true);
    expect(evalCond('', s)).toBe(true);
  });
  it('rejects malformed expressions', () => {
    expect(() => compile('a & (b')).toThrow();
    expect(() => compile('bogus:x')).toThrow();
    expect(() => compile('a &')).toThrow();
  });
  it('lists the atomic terms of an expression', () => {
    expect(terms('!(has:x | c1_a) & chapter>=2')).toEqual(['has:x', 'c1_a', 'chapter>=2']);
  });
});

describe('saves', () => {
  it('round-trips a state exactly', () => {
    const s = state({ room: 'office', chapter: 4, inv: ['hat'], flags: { x: 1 }, npcs: { nora: { room: 'mission', at: 'x' } } });
    expect(serialize(deserialize(serialize(s)))).toBe(serialize(s));
  });
  it('rejects corrupt or foreign saves', () => {
    expect(() => deserialize('{}')).toThrow();
    expect(() => deserialize('not json')).toThrow();
    const bad = JSON.parse(serialize(state({ room: 'office' })));
    bad.inv = 'oops';
    expect(() => deserialize(JSON.stringify(bad))).toThrow();
  });
});

describe('the game', () => {
  async function started() {
    const p = new HeadlessPresenter();
    const g = new Game(CONTENT, p, newState());
    await g.start();
    return { g, p };
  }

  it('starts in Room 9, chapter 1, with an objective to follow', async () => {
    const { g } = await started();
    expect(g.state.room).toBe('hotel_room');
    expect(g.state.chapter).toBe(1);
    expect(g.objectives().some((o) => !o.done)).toBe(true);
    expect(g.hint()).not.toBe('');
  });

  it('takes the hat and files the note inside it', async () => {
    const { g } = await started();
    await g.perform({ t: 'use', target: { kind: 'hs', id: 'hat' } });
    expect(g.state.flags.c1_hat_taken).toBe(true);
    expect(g.state.clues).toContain('hat_note');
    expect(g.errors).toEqual([]);
  });

  it('ignores clicks on hidden hotspots and items you do not hold', async () => {
    const { g } = await started();
    await g.perform({ t: 'use', target: { kind: 'hs', id: 'hat' } });
    const before = serialize(g.state);
    await g.perform({ t: 'use', target: { kind: 'hs', id: 'hat' } }); // hidden once taken
    await g.perform({ t: 'item', item: 'booth_key', target: { kind: 'hs', id: 'door' } }); // not held
    const after = JSON.parse(serialize(g.state));
    const prev = JSON.parse(before);
    expect(after.flags).toEqual(prev.flags);
    expect(after.inv).toEqual(prev.inv);
  });

  it('keeps the city map closed while Rook is locked in', async () => {
    const { g } = await started();
    expect(g.canTravel()).toBe(false);
    await g.perform({ t: 'travel', loc: 'office' });
    expect(g.state.room).toBe('hotel_room');
  });

  it('only connects clues that belong together', async () => {
    const { g } = await started();
    g.state.clues.push('lethe_identified', 'lost_days', 'hat_note');
    await g.perform({ t: 'deduce', a: 'hat_note', b: 'lost_days' });
    expect(g.state.deds).toEqual([]);
    await g.perform({ t: 'deduce', a: 'lethe_identified', b: 'lost_days' });
    expect(g.state.deds).toContain('i_was_drugged');
  });
});

describe('routes', () => {
  it('finds a way from the office to the cellar of the Blue Lantern only when it is open', () => {
    const p = new HeadlessPresenter();
    const g = new Game(CONTENT, p, state({ room: 'office', chapter: 2, map: ['office', 'lantern', 'hotel'] }));
    const there = routeTo(g, 'lantern');
    expect(there?.map((e) => e.a.t)).toEqual(['travel']);
    expect(routeTo(g, 'lantern_cellar')).toBeNull();
    expect(g.state.room).toBe('office'); // routing never moves the player
  });
  it('lists the office exits: the street door (map) and the back stairs', () => {
    const p = new HeadlessPresenter();
    const g = new Game(CONTENT, p, state({ room: 'office', chapter: 2, map: ['office', 'hotel'] }));
    const vias = new Set(edgesFrom(g).map((e) => e.via));
    expect(vias).toEqual(new Set(['exit_door', 'exit_stairs_down']));
  });
});

describe('scripts', () => {
  const tiny: Content = {
    ...CONTENT,
    start: [{ chapter: 1 }, { goto: 'office' }, { set: 'x' }, { once: 'k', do: [{ inc: 'n' }] }, { once: 'k', do: [{ inc: 'n' }] },
      { if: 'n=1', then: [{ give: 'hat' }], else: [{ give: 'lighter' }] },
      { npc: 'nora', room: 'office', at: 'from_map' }, { npc: 'nora', hide: true }],
  };
  it('runs once-blocks once, branches and stages NPCs', async () => {
    const g = new Game(tiny, new HeadlessPresenter(), newState());
    await g.start();
    expect(g.state.flags.x).toBe(true);
    expect(g.state.flags.n).toBe(1);
    expect(g.state.inv).toEqual(['hat']);
    expect(g.state.npcs.nora).toBeUndefined(); // released back to its default placements
    expect(g.errors).toEqual([]);
  });
});
