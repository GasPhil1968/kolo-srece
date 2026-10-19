import { chromium } from 'playwright';
import path from 'node:path';
const [,, outDir, which] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: outDir, size: { width: 1280, height: 720 } } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('file://' + path.resolve('standalone/index.html'));
await page.waitForSelector('[data-testid=title]', { timeout: 90000 });
await page.evaluate(() => window.__pov.ui.menus['leaveTitle']());
await page.waitForTimeout(1500);
if (which === 'ancona') {
  await page.evaluate(() => {
    const e = window.__pov.engine;
    e.newChapter('ancona');
    const s = JSON.parse(JSON.stringify(e.state));
    s.room = 'an_duell'; s.resume = 'after';
    e.load(s);
  });
} else {
  await page.evaluate(() => {
    const e = window.__pov.engine;
    e.newChapter('romagna');
    for (const k of ['warnung', 'wasser', 'tomRoute', 'postWer', 'spuren']) e.state.flags['rm.' + k] = true;
    e.state.room = 'rm_fluss'; e.state.actors.pc.room = 'rm_fluss'; e.state.actors.pc.x = 420; e.state.actors.pc.y = 440;
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__pov.engine.intent({ k: 'act', target: 'weide', verb: 'go' }));
}
const started = Date.now();
while (Date.now() - started < 200000) {
  await page.waitForTimeout(300);
  const step = await page.evaluate(() => {
    const e = window.__pov.engine;
    const m = e.inputMode();
    if (m === 'speech') return { k: 'advance' };
    if (m === 'combat' && e.combat) return { k: 'combat', action: e.combat.current.answer };
    if (m === 'choice') {
      const opts = (e.choice ?? e.choiceView)?.options ?? [];
      const pick = opts.find((o) => o.id === 'strike') ?? opts[0];
      return pick ? { k: 'choose', id: pick.id } : null;
    }
    return null;
  });
  if (step) await page.evaluate((i) => window.__pov.engine.intent(i), step);
  const done = await page.evaluate(() => window.__pov.engine.inputMode() === 'free' && (window.__pov.engine.state.chapter !== 'ancona' || window.__pov.engine.state.flags['an.quickeningDone'] !== undefined));
  if (done && which === 'ancona') break;
}
await page.waitForTimeout(3000);
console.log('errors', errors.length ? errors.slice(0, 3) : 'none');
await ctx.close();
await browser.close();
