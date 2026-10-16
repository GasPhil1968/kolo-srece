// Visual tour at normal speed: screenshots of speech, dialogue menus, documents, the map,
// a close-up puzzle and a chapter card, for human review. Not part of the pass/fail suite.
//   npm run build && npx tsx tests/e2e/tour.ts
import { mkdirSync, readFileSync } from 'node:fs';
import type { Page } from 'playwright';
import { bringIntoView, call, clickGame, gameShot, launch, serveDist, type NL } from './lib';

const OUT = 'reports/screens/tour';
mkdirSync(OUT, { recursive: true });
const { first, last } = JSON.parse(readFileSync('reports/raw/room_states.json', 'utf8')) as Record<string, Record<string, string>>;
const srv = await serveDist();
const s = await launch(srv.url);
const page = s.page;
let n = 0;
const shot = async (name: string) => gameShot(page, `${OUT}/${String(++n).padStart(2, '0')}_${name}.png`);
const idle = () => page.waitForFunction(() => (window.__NL as NL).idle(), null, { timeout: 60000, polling: 50 });
const load = async (json: string) => {
  await page.evaluate((j) => (window.__NL as NL).loadState(j), json);
  await idle();
  await page.waitForTimeout(400);
};
async function hs(p: Page, id: string, button: 'left' | 'right' = 'left') {
  const pt = await bringIntoView(p, 'hs', id);
  await clickGame(p, pt[0], pt[1], button);
}
async function npc(p: Page, id: string) {
  const pt = await call(p, 'npcPoint', id);
  if (!pt) throw new Error('npc not visible: ' + id);
  await clickGame(p, pt[0], pt[1]);
}
const waitFor = (fn: string, timeout = 20000) => page.waitForFunction(fn, null, { timeout, polling: 50 });

// 1. speech in Room 9
await load(first.hotel_room);
await hs(page, 'window', 'right');
await page.waitForTimeout(700);
await shot('speech_look');
await idle();
// 2. a dialogue menu with Mabel, and an NPC line
await load(first.office);
await page.waitForTimeout(300);
await npc(page, 'mabel');
await waitFor('window.__NL.ui().choosing');
await page.waitForTimeout(300);
await shot('dialogue_menu');
const opts = (await call(page, 'ui')).options;
await clickGame(page, opts[0].x, opts[0].y);
await page.waitForTimeout(1500);
await shot('dialogue_line');
await page.keyboard.press('Escape');
// 3. a document
await load(first.office);
await hs(page, 'filing_cabinet');
await waitFor("window.__NL.overlays().includes('doc')", 30000).catch(() => {});
await page.waitForTimeout(600);
await shot('document');
await page.keyboard.press('Escape');
// 4. the city map
await load(last.hotel_lobby);
const u = await call(page, 'ui');
await clickGame(page, u.buttons.map[0], u.buttons.map[1]);
await page.waitForTimeout(600);
const pins: { id: string; x: number; y: number }[] = await call(page, 'mapPins');
const pin = pins.find((p) => p.id === 'lantern') ?? pins[0];
await page.mouse.move(...(await (async () => {
  const c = await page.evaluate(() => document.querySelector('canvas')!.getBoundingClientRect().toJSON());
  return [c.x + ((pin.x + 0.5) * c.width) / 320, c.y + ((pin.y + 0.5) * c.height) / 180] as [number, number];
})()));
await page.waitForTimeout(300);
await shot('map');
await page.keyboard.press('Escape');
// 5. the notebook's timeline (chapter 5, evidence box open)
for (const [room, json] of Object.entries(first)) {
  const st = JSON.parse(json);
  if (st.room === 'holding_cell') {
    // as if Danny had just brought the evidence box: the timeline cards are in the notebook
    st.flags.c5_box = true;
    st.inv.push('gate_log', 'padlock');
    st.clues.push('gate_walter', 'gate_delaney', 'gus_statement', 'shift_roster', 'fire_log', 'report_time');
    const json = JSON.stringify(st);
    await load(json);
    const ui = await call(page, 'ui');
    await clickGame(page, ui.buttons.notebook[0], ui.buttons.notebook[1]);
    await page.waitForTimeout(400);
    await clickGame(page, 248, 14);
    await page.waitForTimeout(300);
    await clickGame(page, 200, 66);
    await page.waitForTimeout(150);
    await clickGame(page, 60, 66);
    await page.waitForTimeout(250);
    await shot('timeline_' + room);
    await page.keyboard.press('Escape');
    break;
  }
}
// 6. a close-up puzzle (Pike's drawer lock)
for (const json of Object.values(first)) {
  const st = JSON.parse(json);
  if (st.room === 'gazette' && st.chapter === 2) {
    st.flags.c2_desk_ok = true;
    st.flags.c2_saw_417 = true;
    await load(JSON.stringify(st));
    await hs(page, 'pike_drawer');
    await waitFor("window.__NL.overlays().includes('closeup')", 30000).catch(() => {});
    await page.waitForTimeout(500);
    const info = await call(page, 'closeupInfo');
    if (info) await clickGame(page, info.wheels[0].up[0], info.wheels[0].up[1]);
    await page.waitForTimeout(200);
    await shot('closeup_lock');
    await page.keyboard.press('Escape');
    break;
  }
}
// 7. a chapter card: finish chapter 1 at Pier 9
for (const json of Object.values(last)) {
  const st = JSON.parse(json);
  if (st.chapter === 1 && st.clues.includes('on_ice') && st.map.includes('pier9')) {
    await load(json);
    await page.evaluate(() => {
      void (window.__NL as NL).perform({ t: 'travel', loc: 'pier9' });
    });
    await waitFor("window.__NL.overlays().includes('card')", 120000).catch(() => {});
    await page.waitForTimeout(2200);
    await shot('chapter_card');
    break;
  }
}
console.log(`${n} screenshots in ${OUT}`, s.errors.length ? s.errors : '');
await s.browser.close();
srv.server.close();
