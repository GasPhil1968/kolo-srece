// Visual staging helper for authoring: node tests/e2e/stage.mjs <url> <outdir> <steps.json>
// steps: [{ "chapter": "weide" } | { "eval": "js" } | { "wait": ms } | { "shot": "name" } | { "click": [x, y] } | { "key": "Tab" }]
// "eval" runs in the page with `e` = engine, `ui`, `scene` in scope. Debug overlay via ?debug=1 in the URL.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const [url, outdir, stepsFile] = process.argv.slice(2);
const steps = JSON.parse(readFileSync(stepsFile, 'utf8'));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') console.log('console', m.type(), m.text());
});
page.on('requestfailed', (r) => console.log('requestfailed', r.url()));
await page.goto(url);
await page.waitForSelector('[data-testid=title]');
for (const st of steps) {
  if (st.chapter) {
    await page.evaluate((id) => {
      window.__pov.ui.menus['leaveTitle']();
      window.__pov.engine.newChapter(id);
    }, st.chapter);
    await page.waitForTimeout(300);
  }
  if (st.eval) {
    const r = await page.evaluate((code) => {
      const e = window.__pov.engine;
      const ui = window.__pov.ui;
      const scene = window.__pov.scene;
      // eslint-disable-next-line no-new-func
      return new Function('e', 'ui', 'scene', code)(e, ui, scene);
    }, st.eval);
    if (r !== undefined) console.log('eval ->', JSON.stringify(r));
  }
  if (st.wait) await page.waitForTimeout(st.wait);
  if (st.click) await page.mouse.click(st.click[0], st.click[1]);
  if (st.key) await page.keyboard.press(st.key);
  if (st.shot) await page.screenshot({ path: `${outdir}/${st.shot}.png` });
}
await browser.close();
