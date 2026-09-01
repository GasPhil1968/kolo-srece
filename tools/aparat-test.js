// Rauchtest fuer aparat.html: laden, Knopf halten, loslassen, Fehler zaehlen.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('file://' + path.resolve(__dirname, '..', 'aparat.html'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/claude-0/-home-user-kolo-srece/e9eb926b-5c1d-57b8-abdd-d418038033e8/scratchpad/aparat-idle.png' });

  const box = await page.locator('#btn').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1400);
  const during = await page.evaluate(() => ({
    measuring: document.body.classList.contains('measuring'),
    warble: warble !== null,
  }));
  await page.screenshot({ path: '/tmp/claude-0/-home-user-kolo-srece/e9eb926b-5c1d-57b8-abdd-d418038033e8/scratchpad/aparat-measure.png' });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({
    verdict: document.getElementById('verdict').classList.contains('show'),
    warble: warble !== null,
  }));
  await page.screenshot({ path: '/tmp/claude-0/-home-user-kolo-srece/e9eb926b-5c1d-57b8-abdd-d418038033e8/scratchpad/aparat-done.png' });

  // Kurzer Tipp: Messung muss von selbst zu Ende laufen und das Urteil zeigen
  await page.waitForTimeout(2600);
  await page.mouse.down();
  await page.waitForTimeout(120);
  await page.mouse.up();
  const tapMid = await page.evaluate(() => ({
    measuring: document.body.classList.contains('measuring'),
    warble: warble !== null,
  }));
  await page.waitForTimeout(1200);
  const tapEnd = await page.evaluate(() => ({
    verdict: document.getElementById('verdict').classList.contains('show'),
    warble: warble !== null,
  }));

  console.log(JSON.stringify({ during, after, tapMid, tapEnd, errors }, null, 2));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
