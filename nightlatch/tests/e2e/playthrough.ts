// Full playthrough in a real browser, driven by real mouse and keyboard input: clicks on
// hotspots and characters, inventory slots, dialogue options, map pins and puzzle wheels.
// Text is sped up (fast mode) and walking is 3x faster; everything else is the game as a
// player sees it. The route is the machine-checked walkthrough in tools/walkthrough.ts.
import { mkdirSync } from 'node:fs';
import type { Page } from 'playwright';
import type { Action } from '../../src/engine/game';
import type { WAct, WStep } from '../../tools/sim/harness';
import { STEPS } from '../../tools/walkthrough';
import { CONTENT } from '../../src/content';
import { call, clickButton, clickGame, gameShot, toPage, type NL } from './lib';

export interface PlaythroughResult {
  ok: boolean;
  steps: number;
  clicks: number;
  chapters: number[];
  ended: boolean;
  failure?: string;
  log: string[];
  ms: number;
}

const SHOTS = 'reports/screens/playthrough';

export async function playthrough(page: Page, opts: { maxMinutes?: number; shots?: boolean } = {}): Promise<PlaythroughResult> {
  const t0 = Date.now();
  const deadline = t0 + (opts.maxMinutes ?? 40) * 60000;
  const log: string[] = [];
  const res: PlaythroughResult = { ok: false, steps: 0, clicks: 0, chapters: [], ended: false, log, ms: 0 };
  if (opts.shots !== false) mkdirSync(SHOTS, { recursive: true });
  let plan = { say: [] as string[], show: [] as string[] };
  let lastOpt = '';

  let current = 'start';
  page.on('pageerror', (e) => log.push(`PAGEERROR during ${current}: ${e.message} ${(e.stack ?? '').split('\n').slice(0, 8).join(' | ')}`));
  const ui = () => call(page, 'ui');
  const cond = (e: string) => call<boolean>(page, 'cond', e);
  const click = async (gx: number, gy: number, button: 'left' | 'right' = 'left') => {
    res.clicks++;
    await clickGame(page, gx, gy, button);
  };
  const sleep = (ms: number) => page.waitForTimeout(ms);

  /** Answer whatever the game is waiting for, until it is idle again. */
  async function settle(limitMs = 90000) {
    const end = Date.now() + limitMs;
    await sleep(120);
    for (;;) {
      if (Date.now() > end) throw new Error('game did not settle: ' + JSON.stringify(await call(page, 'overlays')));
      if (await call(page, 'ended')) return;
      if (await call(page, 'idle')) return;
      const u = await ui();
      const overlays: string[] = await call(page, 'overlays');
      if (overlays.includes('end')) return;
      if (u.choosing && u.options.length) {
        await chooseOption(u);
        continue;
      }
      if (u.picking) {
        await pickEvidence(u);
        continue;
      }
      if (overlays.includes('closeup')) {
        await solveCloseup();
        continue;
      }
      if (overlays.includes('doc') || overlays.includes('map') || overlays.includes('notebook') || overlays.includes('menu')) {
        await page.keyboard.press('Escape');
        await sleep(150);
        continue;
      }
      await sleep(80);
    }
  }

  async function chooseOption(u: NL) {
    const seen: string[] = (await call(page, 'state')).seen;
    const opts = u.options as { id: string; x: number; y: number; exit: boolean; present: boolean }[];
    const isSeen = (o: { id: string }) => seen.includes(`${u.dialog}.${o.id}`);
    let pick = null as null | (typeof opts)[number];
    for (const id of plan.say) {
      const o = opts.find((x) => x.id === id);
      if (o && !(isSeen(o) && !o.exit && !o.present)) {
        pick = o;
        break;
      }
    }
    pick ??= opts.find((o) => o.exit) ?? opts.find((o) => !isSeen(o) && o.id !== '__more') ?? opts.find((o) => o.id === '__more') ?? opts[0];
    lastOpt = pick.id;
    log.push(`  choose ${u.dialog}.${pick.id}`);
    await click(pick.x, pick.y);
    await sleep(100);
  }

  async function pickEvidence(u: NL) {
    const inv: string[] = (await call(page, 'state')).inv;
    let want: string | null = null;
    for (const entry of plan.show) {
      const [oid, it] = entry.includes(':') ? entry.split(':') : ['', entry];
      if ((oid === '' || oid === lastOpt) && inv.includes(it)) {
        want = it;
        break;
      }
    }
    if (!want) {
      log.push('  show: (cancel)');
      await click(160, 150, 'right');
      await sleep(100);
      return;
    }
    log.push(`  show ${want}`);
    await clickSlot(want, 'left', u);
    await sleep(100);
  }

  async function solveCloseup() {
    const info = await call(page, 'closeupInfo');
    if (!info) return;
    log.push(`  closeup ${info.id}`);
    if (info.kind === 'combo') {
      for (let i = 0; i < info.wheels.length; i++) {
        const want = Number(info.solution[i]);
        const turns = (want - info.digits[i] + 10) % 10;
        for (let k = 0; k < turns; k++) await click(info.wheels[i].up[0], info.wheels[i].up[1]);
      }
    } else {
      for (const pair of String(info.solution).split(',')) {
        const [a, b] = pair.split('-');
        await click(info.jacks[a][0], info.jacks[a][1]);
        await click(info.jacks[b][0], info.jacks[b][1]);
      }
    }
    await click(info.tryButton[0], info.tryButton[1]);
    await sleep(300);
  }

  async function clickSlot(item: string, button: 'left' | 'right', u0?: NL) {
    for (let tries = 0; tries < 30; tries++) {
      const u = tries === 0 && u0 ? u0 : await ui();
      const slot = u.slots.find((s: { item: string | null }) => s.item === item);
      if (slot) {
        await click(slot.x, slot.y, button);
        return;
      }
      const inv: string[] = (await call(page, 'state')).inv;
      const idx = inv.indexOf(item);
      if (idx < 0) throw new Error(`item ${item} not in inventory`);
      const arrow = idx < u.scroll ? u.arrows.left : u.arrows.right;
      await click(arrow[0], arrow[1]);
      await sleep(60);
    }
    throw new Error(`could not scroll to ${item}`);
  }

  /** Bring a hotspot/NPC on screen by walking towards it, then return its screen point. */
  async function targetPoint(kind: 'hs' | 'npc', id: string): Promise<[number, number]> {
    for (let tries = 0; tries < 6; tries++) {
      const pt: [number, number] | null = await call(page, kind === 'hs' ? 'hotspotPoint' : 'npcPoint', id);
      if (pt) return pt;
      const wx: number | null = await call(page, kind === 'hs' ? 'hotspotWorldX' : 'npcWorldX', id);
      if (wx === null) throw new Error(`${kind} ${id} is not in room ${await call(page, 'room')}`);
      const cam: number = await call(page, 'cameraX');
      const sx = wx > cam + 160 ? 300 : 20;
      const fp: [number, number] | null = await call(page, 'floorPoint', sx);
      if (!fp) throw new Error(`no floor to walk towards ${id}`);
      await click(fp[0], fp[1]);
      await settle();
    }
    throw new Error(`${kind} ${id} never came on screen`);
  }

  async function doAction(a: Action) {
    switch (a.t) {
      case 'look':
      case 'use': {
        const [x, y] = await targetPoint(a.target.kind, a.target.id);
        log.push(`${a.t} ${a.target.kind}:${a.target.id}`);
        await click(x, y, a.t === 'look' ? 'right' : 'left');
        break;
      }
      case 'item': {
        const [x, y] = await targetPoint(a.target.kind, a.target.id);
        log.push(`item ${a.item} -> ${a.target.id}`);
        await clickSlot(a.item, 'left');
        await sleep(60);
        await click(x, y);
        break;
      }
      case 'combine':
        log.push(`combine ${a.a} + ${a.b}`);
        await clickSlot(a.a, 'left');
        await sleep(60);
        await clickSlot(a.b, 'left');
        break;
      case 'examine':
        log.push(`examine ${a.item}`);
        await clickSlot(a.item, 'right');
        break;
      case 'travel':
        throw new Error('travel is done through goTo');
      case 'deduce':
        log.push(`deduce ${a.a} + ${a.b} (notebook)`);
        await notebookDeduce(a.a, a.b);
        break;
      case 'timeline':
        log.push(`timeline ${a.id} (notebook)`);
        await notebookTimeline(a.order);
        break;
    }
    await settle();
  }

  // ---- the notebook, by mouse: tabs at the top, lists of clue buttons, wheel to scroll
  const TABS: Record<string, number> = { case: 40, clues: 92, people: 144, deduce: 196, timeline: 248 };
  const short = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '\u2026' : s);

  async function openNotebookTab(tab: string) {
    const ui0 = await ui();
    await click(ui0.buttons.notebook[0], ui0.buttons.notebook[1]);
    await page.waitForFunction(() => ((window.__NL as NL).overlays() as string[]).includes('notebook'), null, { timeout: 10000 });
    await sleep(150);
    await click(TABS[tab], 14);
    await sleep(150);
  }

  /** Click the notebook text button whose label matches, scrolling the list with the wheel. */
  async function clickNoteButton(match: (text: string) => boolean, what: string) {
    for (let scroll = 0; scroll < 40; scroll++) {
      const btns: { text: string; x: number; y: number }[] = await call(page, 'buttons', 'notebook');
      const b = btns.find((x) => match(x.text));
      if (b) {
        await click(b.x, b.y);
        await sleep(120);
        return;
      }
      const [wx, wy] = await toPage(page, 80, 80);
      await page.mouse.move(wx, wy);
      await page.mouse.wheel(0, 100);
      await sleep(80);
    }
    throw new Error(`notebook: no button for ${what}`);
  }

  async function notebookDeduce(a: string, b: string) {
    await openNotebookTab('deduce');
    for (const id of [a, b]) {
      const title = short(CONTENT.clues[id].title, 26);
      // the list starts from the top again after each click; scroll back up first
      for (let k = 0; k < 20; k++) await page.mouse.wheel(0, -100);
      await clickNoteButton((t) => t === title, `clue ${id}`);
    }
    await clickNoteButton((t) => t.includes('Connect them'), 'connect');
  }

  async function notebookTimeline(order: string[]) {
    await openNotebookTab('timeline');
    for (let i = 0; i < order.length; i++) {
      const c = CONTENT.clues[order[i]];
      await clickNoteButton((t) => t === `${c.time ?? '?'} ${short(c.title, 18)}`, `card ${order[i]}`);
      await clickNoteButton((t) => t.startsWith(`${i + 1}. `), `slot ${i + 1}`);
    }
    await clickNoteButton((t) => t.includes('Check the timeline'), 'check');
  }

  async function travel(via: string, loc: string) {
    const [x, y] = await targetPoint('hs', via);
    log.push(`map via ${via} -> ${loc}`);
    await click(x, y);
    await page.waitForFunction(() => ((window.__NL as NL).overlays() as string[]).includes('map'), null, { timeout: 20000 });
    await sleep(150);
    const pins: { id: string; x: number; y: number }[] = await call(page, 'mapPins');
    const pin = pins.find((p) => p.id === loc);
    if (!pin) throw new Error(`no map pin for ${loc}`);
    await click(pin.x, pin.y);
    await settle();
  }

  async function goTo(room: string): Promise<boolean> {
    const ch = await call<number>(page, 'chapter');
    for (let i = 0; i < 8; i++) {
      if ((await call(page, 'room')) === room) return true;
      if ((await call<number>(page, 'chapter')) !== ch) return false;
      const path: { a: Action; via: string }[] | null = await call(page, 'route', room);
      if (!path) return false;
      if (!path.length) return true;
      const e = path[0];
      if (e.a.t === 'travel') await travel(e.via, e.a.loc);
      else await doAction(e.a);
    }
    return (await call(page, 'room')) === room;
  }

  async function runStep(st: WStep): Promise<boolean> {
    plan = { say: st.say ?? [], show: st.show ?? [] };
    current = st.id;
    log.push(`[${st.id}]`);
    if (st.room && !(await goTo(st.room))) return cond(st.done);
    for (const a of st.do as WAct[]) {
      if ((await cond(st.done)) || (await call(page, 'ended'))) break;
      if (a.t === 'go') {
        if (!(await goTo(a.room)) && !(await cond(st.done))) return false;
      } else await doAction(a);
    }
    return cond(st.done);
  }

  try {
    await call(page, 'setFast', true);
    await page.evaluate(() => {
      const n = window.__NL as NL;
      n.ctl.autoOverlays = false;
      n.ctl.walkMul = 3;
    });
    await clickButton(page, 'title', 'New game');
    await page.waitForFunction(() => (window.__NL as NL).inGame(), null, { timeout: 30000 });
    await settle();
    let chapter = 0;
    const fails = new Map<string, number>();
    while (!(await call(page, 'ended'))) {
      if (Date.now() > deadline) throw new Error('time limit reached');
      const ch = await call<number>(page, 'chapter');
      if (ch !== chapter) {
        chapter = ch;
        res.chapters.push(ch);
        if (opts.shots !== false) await gameShot(page, `${SHOTS}/chapter${ch}_start.png`);
      }
      let next: WStep | null = null;
      for (const s of STEPS) {
        if (s.chapter !== ch || (fails.get(s.id) ?? 0) >= 2) continue;
        if ((await cond(s.when)) && !(await cond(s.done))) {
          next = s;
          break;
        }
      }
      if (!next) throw new Error(`no walkthrough step applicable in chapter ${ch} at ${await call(page, 'room')}`);
      const ok = await runStep(next);
      if (ok) {
        res.steps++;
        fails.clear();
      } else {
        fails.set(next.id, (fails.get(next.id) ?? 0) + 1);
        log.push(`  step ${next.id} not done yet`);
      }
    }
    res.ended = true;
    if (opts.shots !== false) {
      await sleep(500);
      await gameShot(page, `${SHOTS}/ending.png`);
    }
    res.ok = true;
  } catch (e) {
    res.failure = (e as Error).message;
    log.push('FAILED: ' + res.failure);
    if (opts.shots !== false) await gameShot(page, `${SHOTS}/failure.png`).catch(() => {});
  }
  res.ms = Date.now() - t0;
  return res;
}
