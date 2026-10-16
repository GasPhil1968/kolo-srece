// Quick browser smoke test: boot, title, new game, Room 9; screenshots + console errors.
import { chromium } from 'playwright';

const URL = process.env.NL_URL || 'http://localhost:5173/';
const OUT = process.env.NL_OUT || '/tmp/claude-0/-home-user-kolo-srece/6c97336e-6769-5f60-9596-454c3ff23451/scratchpad/prev';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type().toUpperCase() + ' ' + m.text()); });
await page.goto(URL);
await page.waitForFunction(() => window.__NL && window.__NL.ready(), null, { timeout: 30000 });
await page.waitForTimeout(800);
await page.screenshot({ path: OUT + '/e2e_title.png' });
await page.evaluate(() => window.__NL.setFast(false));
page.evaluate(() => window.__NL.newGame());
await page.waitForTimeout(9000);
await page.screenshot({ path: OUT + '/e2e_room9_a.png' });
// click through the opening lines
for (let i = 0; i < 8; i++) { await page.mouse.click(640, 300); await page.waitForTimeout(400); }
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + '/e2e_room9_b.png' });
console.log(JSON.stringify(await page.evaluate(() => ({ room: window.__NL.room(), busy: window.__NL.busy(), errs: window.__NL.errors() }))));
console.log(errors.join('\n'));
await browser.close();
