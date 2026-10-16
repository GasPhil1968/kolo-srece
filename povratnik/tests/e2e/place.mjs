// Dev helper: start the sandbox, place actors at given points, screenshot.
import { chromium } from 'playwright';
const [url, out, ...pts] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(url);
await page.waitForSelector('[data-testid=title]');
await page.click('[data-testid=title-new]');
await page.waitForTimeout(500);
await page.keyboard.press('Escape');
await page.waitForTimeout(2500);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await page.evaluate(() => window.__pov.ui.menus.closeAll());
await page.evaluate((pts) => {
  const e = window.__pov.engine;
  const ids = ['pc', 'mijo96'];
  pts.forEach((p, i) => { const [x, y, f] = p.split(',').map(Number); e.placeActor(ids[i], { x, y, facing: f || 1 }); });
}, pts);
await page.waitForTimeout(100);
await page.evaluate((cx) => { const e = window.__pov.engine; e.intent; e['camLock'] = cx; }, Number(process.env.CAMX ?? 160));
await page.waitForTimeout(600);
await page.screenshot({ path: out });
await browser.close();
