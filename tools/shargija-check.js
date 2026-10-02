/* Prueft shargija/index.html mit den Engine-Grafiken v2: Fehler, fehlende Bilder, Screenshots.
   Nur zum Pruefen - gehoert nicht zum Spiel selbst.  Aufruf: node tools/shargija-check.js [ausgabeordner] */
const { chromium } = require('playwright');
const path = require('path');
const out = process.argv[2] || '.';
const [VW, VH] = (process.argv[3] || '900x430').split('x').map(Number);
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', '--allow-file-access-from-files']
  });
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  const errs = [], missing = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  page.on('requestfailed', r => missing.push(r.url()));
  await page.goto('file://' + path.resolve(__dirname, '../shargija/index.html') + '#dev');
  await page.waitForTimeout(800);
  const shot = n => page.screenshot({ path: path.join(out, n + '.png') });
  await shot('01-start');
  await page.mouse.click(VW / 2, VH / 2); await page.waitForTimeout(600); await shot('02-after-click');
  await page.mouse.click(VW / 2, VH / 2); await page.waitForTimeout(3500); await shot('03-menu');
  const visit = async (sel, name) => {
    try { await page.locator(sel).first().click({ timeout: 1500 }); await page.waitForTimeout(500); await shot(name); }
    catch (e) { errs.push('STEP ' + name + ': ' + e.message.split('\n')[0]); }
  };
  const back = () => page.locator('button.back:visible').first().click({ timeout: 1500 }).catch(() => {}).then(() => page.waitForTimeout(400));
  for (const [i, n] of [[0, 'songs'], [1, 'practice'], [4, 'howto'], [5, 'settings']]) {
    await visit(`.nav button >> nth=${i}`, '04-' + n); await back();
  }
  await visit('.nav button >> nth=0', '05-songs');
  await visit('.card .crow button.p:visible', '06-play'); await page.waitForTimeout(2500); await shot('07-play-later');
  const info = await page.evaluate(() => ({
    painted: [...document.querySelectorAll('[data-painted]')].map(e => e.dataset.painted)
      .reduce((a, k) => (a[k] = (a[k] || 0) + 1, a), {}),
    broken: [...document.querySelectorAll('img')].filter(i => i.complete && !i.naturalWidth).length
  }));
  console.log(JSON.stringify(info, null, 1));
  console.log('ERRORS', errs.length, errs.slice(0, 10));
  console.log('FAILED REQUESTS', missing.length, missing.slice(0, 10));
  await browser.close();
})();
