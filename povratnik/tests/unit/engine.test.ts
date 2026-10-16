import { describe, expect, it } from 'vitest';
import { Engine, indexContent } from '../../src/core/engine';
import type { ChapterDef, ScriptCtx } from '../../src/core/content';
import { say, pose, checkpoint, wait } from '../../src/core/cmd';

const meta = {
  characters: {
    hero: { walkSpeed: 200, anims: { stand: { frames: 1, fps: 1, loop: true }, walk: { frames: 8, fps: 10, loop: true }, sit: { frames: 4, fps: 8, loop: false } } },
    npc: { walkSpeed: 100, anims: { stand: { frames: 1, fps: 1, loop: true }, walk: { frames: 8, fps: 10, loop: true } } },
  },
};

function chapter(): ChapterDef {
  return {
    id: 't1',
    title: 'Test',
    dateline: 'Irgendwo, 1999',
    card: { image: 'x', lines: ['Eine Zeile.'] },
    pc: { character: 'hero', name: 'Held', color: '#fff' },
    start: { room: 'r1', entry: 'start' },
    next: null,
    journal: { j1: 'Die Kiste öffnen.' },
    hint: (s) => (s.flags['open'] ? null : { id: 'box', steps: ['Die Kiste klemmt.', 'Der Hebel liegt draußen.', 'Hebel an der Kiste benutzen.'] }),
    items: [
      { id: 'lever', name: 'Hebel', icon: 'i', look: 'Ein Eisenhebel.' },
      { id: 'rope', name: 'Seil', icon: 'i', look: 'Ein Seil.', combine: { lever: function* (c: ScriptCtx) { c.drop('rope'); c.set('tied'); yield say('pc', 'Festgebunden.'); } } },
    ],
    actors: [{ id: 'bob', name: 'Bob', character: 'npc', color: '#f00', start: { room: 'r1', x: 400, y: 200, facing: -1 }, on: { talk: (c) => c.dialogue('bob') } }],
    dialogues: [
      {
        id: 'bob',
        actor: 'bob',
        bye: 'Bis später.',
        options: [
          { id: 'a', text: 'Wer bist du?', run: function* () { yield say('bob', 'Bob.'); } },
          { id: 'b', text: 'Wo ist der Hebel?', when: (s) => !!s.flags['sawBox'], run: function* (c) { c.set('askedLever'); yield say('bob', 'Draußen.'); } },
        ],
      },
    ],
    rooms: [
      {
        id: 'r1',
        title: 'Raum',
        bg: 'bg',
        width: 1200,
        walk: [{ outer: [0, 150, 1200, 150, 1200, 260, 0, 260] }],
        perspective: { farY: 150, farScale: 0.8, nearY: 260, nearScale: 1 },
        entries: { start: { x: 100, y: 200, face: 1 }, back: { x: 1100, y: 200, face: -1 } },
        hotspots: [
          {
            id: 'box',
            name: 'Kiste',
            shape: { x: 600, y: 100, w: 80, h: 60 },
            walkTo: { x: 640, y: 200, face: 1 },
            on: {
              look: function* (c) { c.set('sawBox'); yield say('pc', 'Eine Kiste.'); },
              use: 'Sie klemmt.',
            },
            items: { lever: function* (c) { c.set('open'); c.journal('j1', 'done'); yield say('pc', 'Auf!'); yield checkpoint('opened'); yield wait(1); } },
          },
          { id: 'door', name: 'Tür', shape: { x: 1100, y: 80, w: 80, h: 140 }, walkTo: { x: 1150, y: 200 }, exit: { room: 'r2', entry: 'in' } },
        ],
      },
      {
        id: 'r2',
        title: 'Draußen',
        bg: 'bg2',
        width: 960,
        walk: [{ outer: [0, 150, 960, 150, 960, 260, 0, 260] }],
        perspective: { farY: 150, farScale: 0.8, nearY: 260, nearScale: 1 },
        entries: { in: { x: 100, y: 200, face: 1 } },
        hotspots: [
          { id: 'lever', name: 'Hebel', shape: { x: 300, y: 150, w: 40, h: 40 }, walkTo: { x: 320, y: 200 }, visible: (s) => !s.inventory.includes('lever') && !s.flags['open'], on: { take: function* (c) { c.give('lever'); yield say('pc', 'Genommen.'); } } },
          { id: 'back', name: 'Zurück', shape: { x: 0, y: 80, w: 60, h: 160 }, walkTo: { x: 30, y: 200 }, exit: { room: 'r1', entry: 'back' } },
        ],
        onEnter: function* (c) {
          if (!c.seen('r2.enter')) {
            c.mark('r2.enter');
            yield say('pc', 'Frische Luft.');
          }
        },
      },
    ],
    resumes: { opened: function* (c) { yield say('pc', 'Weiter nach dem Öffnen.'); } },
    intro: function* () { yield say('pc', 'Los gehts.'); yield pose('pc', 'sit'); },
  };
}

function boot(): Engine {
  const e = new Engine(indexContent([chapter()]), meta);
  e.instant = true;
  e.newChapter('t1');
  e.runUntilIdle();
  return e;
}

describe('Engine', () => {
  it('starts a chapter, shows the card, runs the intro and becomes idle', () => {
    const e = boot();
    expect(e.inputMode()).toBe('free');
    expect(e.state.room).toBe('r1');
    expect(e.log.some((l) => l.includes('Los gehts.'))).toBe(true);
  });

  it('solves the test puzzle with travel, pickup and item use', () => {
    const e = boot();
    e.intent({ k: 'act', target: 'box', verb: 'look' });
    e.runUntilIdle();
    expect(e.state.flags.sawBox).toBe(true);
    e.intent({ k: 'act', target: 'door', verb: 'go' });
    e.runUntilIdle();
    expect(e.state.room).toBe('r2');
    expect(e.log.some((l) => l.includes('Frische Luft.'))).toBe(true);
    e.intent({ k: 'act', target: 'lever', verb: 'take' });
    e.runUntilIdle();
    expect(e.state.inventory).toContain('lever');
    e.intent({ k: 'act', target: 'back', verb: 'go' });
    e.runUntilIdle();
    e.intent({ k: 'useItem', item: 'lever', target: 'box' });
    e.runUntilIdle();
    expect(e.state.flags.open).toBe(true);
    expect(e.state.journal.j1).toBe('done');
  });

  it('runs dialogue trees with conditional options and exits cleanly', () => {
    const e = boot();
    e.intent({ k: 'act', target: 'actor:bob', verb: 'talk' });
    expect(e.runUntilIdle()).toBe('choice');
    expect(e.choiceView!.options.map((o) => o.id)).toEqual(['a', '__bye']);
    e.intent({ k: 'choose', id: 'a' });
    expect(e.runUntilIdle()).toBe('choice');
    expect(e.choiceView!.options.map((o) => o.id)).toEqual(['__bye']);
    e.intent({ k: 'choose', id: '__bye' });
    expect(e.runUntilIdle()).toBe('free');
  });

  it('saves during a script restore the last stable point, checkpoints resume', () => {
    const e = boot();
    e.state.inventory.push('lever');
    e.instant = false;
    e.intent({ k: 'useItem', item: 'lever', target: 'box' });
    for (let i = 0; i < 400 && !e.state.flags.open; i++) e.update(1 / 30);
    // mid-script after the checkpoint: the save carries the resume marker
    for (let i = 0; i < 200 && e.inputMode() !== 'busy'; i++) e.update(1 / 30);
    for (let i = 0; i < 10; i++) e.update(1 / 30);
    const save = e.saveData();
    expect(save.flags.open).toBe(true);
    expect(save.resume).toBe('opened');
    const e2 = new Engine(indexContent([chapter()]), meta);
    e2.instant = true;
    expect(e2.load(save)).toBeNull();
    e2.runUntilIdle();
    expect(e2.log.some((l) => l.includes('Weiter nach dem Öffnen.'))).toBe(true);
    expect(e2.inputMode()).toBe('free');
  });

  it('a save during the chapter intro replays the intro', () => {
    const e = new Engine(indexContent([chapter()]), meta);
    e.newChapter('t1');
    e.update(0.1);
    expect(e.inputMode()).toBe('card');
    const save = e.saveData();
    expect(save.resume).toBe('@chapter');
    const e2 = new Engine(indexContent([chapter()]), meta);
    e2.instant = true;
    expect(e2.load(save)).toBeNull();
    e2.runUntilIdle();
    expect(e2.log.some((l) => l.includes('Los gehts.'))).toBe(true);
  });

  it('combines items in either order', () => {
    const e = boot();
    e.state.inventory.push('lever', 'rope');
    e.intent({ k: 'useItem', item: 'lever', target: 'item:rope' });
    e.runUntilIdle();
    expect(e.state.flags.tied).toBe(true);
    expect(e.state.inventory).not.toContain('rope');
  });

  it('progressive hints advance per request', () => {
    const e = boot();
    const got: string[] = [];
    e.on((ev) => {
      if (ev.k === 'hint') got.push(ev.text);
    });
    e.intent({ k: 'hint' });
    e.intent({ k: 'hint' });
    e.intent({ k: 'hint' });
    e.intent({ k: 'hint' });
    expect(got).toEqual(['Die Kiste klemmt.', 'Der Hebel liegt draußen.', 'Hebel an der Kiste benutzen.', 'Hebel an der Kiste benutzen.']);
  });

  it('a throwing script releases the input lock', () => {
    const ch = chapter();
    ch.rooms[0].hotspots.push({ id: 'bad', name: 'Fehler', shape: { x: 0, y: 0, w: 10, h: 10 }, on: { use: function* () { yield say('pc', 'a'); throw new Error('kaputt'); } } });
    const e = new Engine(indexContent([ch]), meta);
    e.instant = true;
    e.newChapter('t1');
    e.runUntilIdle();
    const errors: string[] = [];
    e.on((ev) => {
      if (ev.k === 'error') errors.push(ev.text);
    });
    e.intent({ k: 'act', target: 'bad', verb: 'use' });
    e.runUntilIdle();
    expect(errors.length).toBe(1);
    expect(e.inputMode()).toBe('free');
    expect(e.lockOwners()).toEqual([]);
  });
});
