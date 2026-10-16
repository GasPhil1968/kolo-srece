// Browser test cases. Each gets a fresh page and returns what it checked.
import { mkdirSync, readFileSync } from 'node:fs';
import type { Page } from 'playwright';
import { call, clickButton, clickGame, gameShot, toPage, type NL } from './lib';
import { playthrough } from './playthrough';

export interface Check {
  name: string;
  ok: boolean;
  info?: string;
}
export interface CaseResult {
  name: string;
  ok: boolean;
  checks: Check[];
  ms: number;
  error?: string;
  extra?: Record<string, unknown>;
}

const SHOTS = 'reports/screens';
const sleep = (page: Page, ms: number) => page.waitForTimeout(ms);
const state = (page: Page) => call(page, 'state');

async function settle(page: Page, ms = 30000) {
  const end = Date.now() + ms;
  await sleep(page, 120);
  while (Date.now() < end) {
    if (await call(page, 'idle')) return;
    const ov: string[] = await call(page, 'overlays');
    if (ov.includes('doc')) await page.keyboard.press('Escape');
    await sleep(page, 80);
  }
  throw new Error('not idle after ' + ms + ' ms');
}

async function hs(page: Page, id: string): Promise<[number, number]> {
  const p = await call(page, 'hotspotPoint', id);
  if (!p) throw new Error(`hotspot ${id} not on screen`);
  return p;
}

async function newGame(page: Page) {
  await call(page, 'setFast', true);
  await page.evaluate(() => {
    const n = window.__NL as NL;
    n.ctl.autoOverlays = false;
    n.ctl.walkMul = 3;
  });
  await clickButton(page, 'title', 'New game');
  await page.waitForFunction(() => (window.__NL as NL).inGame(), null, { timeout: 30000 });
  await settle(page, 60000);
}

type Body = (page: Page, check: (name: string, ok: boolean, info?: string) => void) => Promise<Record<string, unknown> | void>;

export const CASES: { name: string; body: Body }[] = [
  {
    name: 'Title screen and menu',
    body: async (page, check) => {
      mkdirSync(SHOTS, { recursive: true });
      await sleep(page, 800);
      await gameShot(page, `${SHOTS}/title.png`);
      const btns: { text: string }[] = await call(page, 'buttons', 'title');
      const labels = btns.map((b) => b.text.trim());
      check('title menu offers New game', labels.some((l) => l.startsWith('New game')), labels.join(' | '));
      check('title menu offers Settings and Credits', labels.some((l) => l.startsWith('Settings')) && labels.some((l) => l.startsWith('Credits')));
      const canvas = await page.evaluate(() => {
        const c = document.querySelector('canvas')!;
        return { w: c.width, h: c.height, css: getComputedStyle(c).imageRendering };
      });
      check('canvas renders at native 320x180', canvas.w === 320 && canvas.h === 180, JSON.stringify(canvas));
      check('nearest-neighbour scaling (image-rendering: pixelated)', /pixelated|crisp/.test(canvas.css), canvas.css);
      await clickButton(page, 'title', 'Credits');
      await sleep(page, 600);
      const ov: string[] = await call(page, 'overlays');
      check('credits open from the title menu', ov.includes('end'), ov.join(','));
      await gameShot(page, `${SHOTS}/credits.png`);
      await page.mouse.click(640, 360);
      await sleep(page, 600);
      check('credits close on click', !((await call(page, 'overlays')) as string[]).includes('end'));
    },
  },
  {
    name: 'New game and mouse interaction in Room 9',
    body: async (page, check) => {
      await newGame(page);
      check('new game starts in Room 9 (hotel_room)', (await call(page, 'room')) === 'hotel_room');
      check('chapter 1', (await call(page, 'chapter')) === 1);
      await gameShot(page, `${SHOTS}/room9_start.png`);
      // hover shows the sentence line
      const [hx, hy] = await hs(page, 'hat');
      const [px, py] = await toPage(page, hx, hy);
      await page.mouse.move(px, py, { steps: 4 });
      await sleep(page, 150);
      const sentence: string = (await call(page, 'ui')).sentence;
      check('hovering a hotspot names verb and object', /take hat/i.test(sentence), sentence);
      // right click = look
      const before = (await state(page)).actions;
      await clickGame(page, hx, hy, 'right');
      await settle(page);
      check('right-click looks (an action runs)', (await state(page)).actions === before + 1);
      // left click = use: walk there, take the hat, read the note inside
      await clickGame(page, hx, hy);
      await settle(page);
      const st = await state(page);
      check('left-click walks over and takes the hat', st.flags.c1_hat_taken === true);
      check('the hat note is filed in the notebook', st.clues.includes('hat_note'));
      // inventory: the newspaper under the bed
      await clickGame(page, ...(await hs(page, 'bed')));
      await settle(page);
      check('searching the bed finds the newspaper', (await state(page)).inv.includes('newspaper'));
      const slot = (await call(page, 'ui')).slots.find((s: { item: string }) => s.item === 'newspaper');
      await clickGame(page, slot.x, slot.y);
      await sleep(page, 150);
      check('clicking an inventory slot picks the item up', (await call(page, 'ui')).held === 'newspaper');
      await clickGame(page, 160, 130, 'right');
      await sleep(page, 150);
      check('right-click drops a held item', (await call(page, 'ui')).held === null);
      const acts = (await state(page)).actions;
      await clickGame(page, slot.x, slot.y, 'right');
      await settle(page);
      check('right-click on an item examines it', (await state(page)).actions === acts + 1);
      // HUD buttons
      const ui = await call(page, 'ui');
      await clickGame(page, ui.buttons.notebook[0], ui.buttons.notebook[1]);
      await sleep(page, 400);
      check('notebook button opens the notebook', ((await call(page, 'overlays')) as string[]).includes('notebook'));
      await gameShot(page, `${SHOTS}/notebook.png`);
      await page.keyboard.press('Escape');
      await sleep(page, 300);
      check('Escape closes the notebook', !((await call(page, 'overlays')) as string[]).includes('notebook'));
      await clickGame(page, ui.buttons.map[0], ui.buttons.map[1]);
      await sleep(page, 300);
      check('the city map is unavailable while locked in', !((await call(page, 'overlays')) as string[]).includes('map'));
      const tiers = JSON.stringify((await state(page)).hintTier);
      await clickGame(page, ui.buttons.hint[0], ui.buttons.hint[1]);
      await sleep(page, 300);
      check('hint button gives a hint (hint tier advances)', JSON.stringify((await state(page)).hintTier) !== tiers);
      await gameShot(page, `${SHOTS}/hint.png`);
      await settle(page);
      // read a document from a clue in the notebook
      await clickGame(page, ui.buttons.notebook[0], ui.buttons.notebook[1]);
      await sleep(page, 300);
      await clickGame(page, 92, 14); // Clues tab
      await sleep(page, 200);
      await clickButton(page, 'notebook', 'Note in my hatband');
      await sleep(page, 200);
      await clickButton(page, 'notebook', '[ Read the document ]');
      await sleep(page, 400);
      check('a clue\'s document opens from the notebook', ((await call(page, 'overlays')) as string[]).includes('doc'));
      await gameShot(page, `${SHOTS}/notebook_doc.png`);
      await page.keyboard.press('Escape');
      await settle(page);
      await page.keyboard.press('n');
      await sleep(page, 300);
      const dbg = await page.evaluate(() => {
        const n = window.__NL as NL;
        return { ov: n.overlays(), busy: n.busy(), lock: n.ctl.inputLocked, idle: n.idle() };
      });
      check('N opens the notebook', dbg.ov.includes('notebook'), JSON.stringify(dbg));
      await page.keyboard.press('Escape');
      await sleep(page, 300);
    },
  },
  {
    name: 'Save, load and settings through the pause menu',
    body: async (page, check) => {
      await newGame(page);
      await clickGame(page, ...(await hs(page, 'hat')));
      await settle(page);
      const ui = await call(page, 'ui');
      await clickGame(page, ui.buttons.menu[0], ui.buttons.menu[1]);
      await sleep(page, 300);
      check('menu button opens the pause menu', ((await call(page, 'overlays')) as string[]).includes('menu'));
      await gameShot(page, `${SHOTS}/menu.png`);
      await clickButton(page, 'menu', 'Save game');
      await sleep(page, 200);
      await clickButton(page, 'menu', 'Slot 1');
      await sleep(page, 200);
      const saved = await page.evaluate(() => localStorage.getItem('nightlatch.save.1'));
      check('saving to slot 1 writes the save', !!saved);
      await clickButton(page, 'menu', 'Back');
      await clickButton(page, 'menu', 'Resume');
      await sleep(page, 200);
      // change the world after saving
      await clickGame(page, ...(await hs(page, 'wardrobe')));
      await settle(page);
      check('after saving, the wardrobe is opened', (await state(page)).flags.c1_wardrobe_open === true);
      await page.keyboard.press('Escape');
      await sleep(page, 300);
      await clickButton(page, 'menu', 'Load game');
      await sleep(page, 200);
      await clickButton(page, 'menu', 'Slot 1');
      await page.waitForFunction(() => (window.__NL as NL).inGame() && (window.__NL as NL).idle(), null, { timeout: 30000 });
      await sleep(page, 400);
      const st = await state(page);
      check('loading slot 1 restores the saved state', st.flags.c1_hat_taken === true && !st.flags.c1_wardrobe_open, JSON.stringify(st.flags));
      check('loaded game is in the saved room', st.room === 'hotel_room');
      const icons: { visible: boolean; frame: string }[] = await call(page, 'hudIcons');
      const shown = icons.filter((i) => i.visible).map((i) => i.frame);
      check('inventory icons are drawn after loading', shown.length === Math.min(7, st.inv.length) && st.inv.slice(0, 7).every((it: string) => shown.includes(it)), `${shown.join(',')} vs ${st.inv.join(',')}`);
      check('autosave slot exists after the chapter opening', !!(await page.evaluate(() => localStorage.getItem('nightlatch.save.auto'))));
      // settings
      await page.keyboard.press('Escape');
      await sleep(page, 300);
      await clickButton(page, 'menu', 'Settings');
      await sleep(page, 200);
      const btns: { text: string; x: number; y: number }[] = await call(page, 'buttons', 'menu');
      const musicUp = btns.filter((b) => b.text === '>').sort((a, b) => a.y - b.y)[0];
      const before = JSON.parse((await page.evaluate(() => localStorage.getItem('nightlatch.settings'))) ?? '{"music":0.7}').music ?? 0.7;
      await clickGame(page, musicUp.x, musicUp.y);
      await sleep(page, 200);
      const musicDown = ((await call(page, 'buttons', 'menu')) as { text: string; x: number; y: number }[]).filter((b) => b.text === '<').sort((a, b) => a.y - b.y)[0];
      await clickGame(page, musicDown.x, musicDown.y);
      await clickGame(page, musicDown.x, musicDown.y);
      await sleep(page, 200);
      const after = JSON.parse((await page.evaluate(() => localStorage.getItem('nightlatch.settings'))) ?? '{}').music;
      check('music volume setting changes and persists', Math.abs(after - Math.max(0, Math.min(1, before + 0.1) - 0.2)) < 0.011, `${before} -> ${after}`);
      await gameShot(page, `${SHOTS}/settings.png`);
      await page.reload();
      await page.waitForFunction(() => (window.__NL as NL)?.ready(), null, { timeout: 60000 });
      const kept = JSON.parse((await page.evaluate(() => localStorage.getItem('nightlatch.settings'))) ?? '{}').music;
      check('settings survive a page reload', Math.abs(kept - after) < 1e-9);
      const labels = ((await call(page, 'buttons', 'title')) as { text: string }[]).map((b) => b.text);
      check('title offers Continue once a save exists', labels.some((l) => /continue/i.test(l)), labels.join(' | '));
    },
  },
  {
    name: 'Every room renders (screenshots)',
    body: async (page, check) => {
      const out = `${SHOTS}/rooms`;
      mkdirSync(out, { recursive: true });
      const { first } = JSON.parse(readFileSync('reports/raw/room_states.json', 'utf8')) as { first: Record<string, string> };
      let n = 0;
      const fps: Record<string, number> = {};
      for (const [room, json] of Object.entries(first)) {
        await page.evaluate((j) => (window.__NL as NL).loadState(j), json);
        await page.waitForFunction(() => (window.__NL as NL).idle(), null, { timeout: 30000 });
        await sleep(page, 700); // let loading finish, then count frames with the room's animations running
        fps[room] = Math.round(await call<number>(page, 'measureFps', 1000));
        const ok = (await call(page, 'room')) === room;
        check(`room ${room} loads and renders`, ok);
        await gameShot(page, `${out}/${room}.png`);
        n++;
      }
      const worst = Math.min(...Object.values(fps));
      check('frame rate stays near 60 FPS in every room (software-rendered Chromium)', worst >= 55, JSON.stringify(fps));
      return { rooms: n, fpsMin: worst, fpsAvg: Math.round(Object.values(fps).reduce((a, b) => a + b, 0) / n) };
    },
  },
  {
    name: 'Complete playthrough with real mouse input',
    body: async (page, check) => {
      const r = await playthrough(page, { maxMinutes: Number(process.env.NL_MINUTES ?? 45) });
      check('the game can be finished from New game to the ending', r.ok && r.ended, r.failure);
      check('all eight chapters were played', [1, 2, 3, 4, 5, 6, 7, 8].every((c) => r.chapters.includes(c)), r.chapters.join(','));
      return { steps: r.steps, clicks: r.clicks, minutes: +(r.ms / 60000).toFixed(1), failure: r.failure, tail: r.log.slice(-15) };
    },
  },
];
