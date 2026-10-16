// Visual check: screenshot rooms with the debug overlay. node tests/e2e/rooms.mjs <url> <outdir> room:entry:camX ...
import { chromium } from 'playwright';
const [url, outdir, ...specs] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text()); });
await page.goto(url);
await page.waitForSelector('[data-testid=title]');
await page.click('[data-testid=title-new]');
await page.waitForTimeout(400);
for (let i = 0; i < 12; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
await page.evaluate(() => window.__pov.ui.menus.closeAll());
for (const spec of specs) {
  const [room, entry, camx] = spec.split(':');
  await page.evaluate(([room, entry]) => window.__povGoto(room, entry), [room, entry]);
  await page.waitForTimeout(1200);
  if (camx !== undefined) await page.evaluate((cx) => { window.__pov.engine.camX = cx; window.__pov.engine['camLock'] = cx; }, Number(camx));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outdir}/${room}-${camx ?? 0}.png` });
}
await browser.close();
