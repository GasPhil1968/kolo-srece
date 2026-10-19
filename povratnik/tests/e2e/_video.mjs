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
  const loadErr = await page.evaluate(() => {
    const e = window.__pov.engine;
    e.newChapter('ancona');
    const s = JSON.parse(JSON.stringify(e.state));
    s.room = 'an_hafen'; s.resume = 'after';
    return e.load(s);
  });
  console.log('load', loadErr);
} else {
  await page.evaluate(() => {
    const e = window.__pov.engine;
    e.newChapter('romagna');
    for (const k of ['warnung', 'wasser', 'tomRoute', 'postWer', 'spuren']) e.state.flags['rm.' + k] = true;
    e.state.room = 'rm_fluss'; e.state.actors.pc.room = 'rm_fluss'; e.state.actors.pc.x = 420; e.state.actors.pc.y = 440;
  });
  await page.waitForTimeout(1500);
}
const started = Date.now();
let lastAct = 0;
let lastTrace = 0;
let fought = false;
while (Date.now() - started < 200000) {
  await page.waitForTimeout(300);
  const step = await page.evaluate(() => {
    const e = window.__pov.engine;
    const m = e.inputMode();
    if (m === 'combat') return null;
    if (m === 'speech' || m === 'card') return { k: 'advance' };
    if (m === 'combat' && e.combat) return { k: 'combat', action: e.combat.current.answer };
    if (m === 'choice') {
      const opts = (e.choice ?? e.choiceView)?.options ?? [];
      const pick = opts.find((o) => o.id === 'strike') ?? opts[0];
      return pick ? { k: 'choose', id: pick.id } : null;
    }
    return null;
  });
  if (step) await page.evaluate((i) => window.__pov.engine.intent(i), step);
  if (Date.now() - lastTrace > 5000) {
    lastTrace = Date.now();
    const tr = await page.evaluate(() => { const e = window.__pov.engine; return { t: Math.round(e.clock), mode: e.inputMode(), room: e.state.room, resume: e.state.resume, choice: e.choiceView ? e.choiceView.options.map((o) => o.id).join(',') : '' }; });
    console.log('trace', JSON.stringify(tr), JSON.stringify(step));
  }
  if (which !== 'ancona' && !fought && Date.now() - lastAct > 4000) {
    lastAct = Date.now();
    const mode = await page.evaluate(() => window.__pov.engine.inputMode());
    if (mode === 'free') await page.evaluate(() => window.__pov.engine.intent({ k: 'act', target: 'weide', verb: 'go' }));
  }
  if (await page.evaluate(() => window.__pov.engine.inputMode() === 'combat')) fought = true;
  if (which === 'ancona' && Date.now() - started > 3000 && !globalThis.__logged) { globalThis.__logged = 1; console.log('ancona state', await page.evaluate(() => ({ room: window.__pov.engine.state.room, mode: window.__pov.engine.inputMode(), resume: window.__pov.engine.state.resume }))); }
  const done = await page.evaluate(() => window.__pov.engine.inputMode() === 'free' && (window.__pov.engine.state.chapter !== 'ancona' || window.__pov.engine.state.flags['an.quickeningDone'] !== undefined));
  if (done && which === 'ancona') break;
}
await page.waitForTimeout(3000);
console.log('errors', errors.length ? errors.slice(0, 3) : 'none', 'fought', fought, await page.evaluate(() => ({ room: window.__pov.engine.state.room, mode: window.__pov.engine.inputMode() })));
console.log('engine log tail', JSON.stringify(await page.evaluate(() => window.__pov.engine.log.slice(-12))));
await ctx.close();
await browser.close();
