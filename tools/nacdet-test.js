// Rauchtest fuer den Nacional Detektor: Seite laden, Spiel starten,
// eine Messung per Halten des Zeigers durchfuehren, Fehler zaehlen.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
  await page.goto(url);
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/claude-0/-home-user-kolo-srece/e9eb926b-5c1d-57b8-abdd-d418038033e8/scratchpad/menu.png' });

  await page.click('#btnStart');
  await page.waitForTimeout(800);

  // Naechsten Fussgaenger finden und den Zeiger dort halten
  const c = await page.evaluate(() => {
    const p = game.peds[0];
    const cc = pedCenter(p);
    const r = scene.getBoundingClientRect();
    return { x: r.left + cc.x, y: r.top + cc.y, kind: p.kind };
  });
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  // Ziel bewegt sich; Fixierung folgt automatisch — 1.6 s halten
  await page.waitForTimeout(1600);
  await page.mouse.up();
  await page.waitForTimeout(300);

  const state = await page.evaluate(() => ({
    score: game.score, combo: game.combo, state: game.state,
    ticket: document.getElementById('ticket').classList.contains('show'),
    peds: game.peds.length,
  }));
  await page.screenshot({ path: '/tmp/claude-0/-home-user-kolo-srece/e9eb926b-5c1d-57b8-abdd-d418038033e8/scratchpad/play.png' });

  // Rundenende erzwingen
  await page.evaluate(() => { game.timeLeft = 0.01; });
  await page.waitForTimeout(300);
  const overVisible = await page.evaluate(() => !document.getElementById('over').hidden);
  await page.screenshot({ path: '/tmp/claude-0/-home-user-kolo-srece/e9eb926b-5c1d-57b8-abdd-d418038033e8/scratchpad/over.png' });

  console.log(JSON.stringify({ state, overVisible, errors }, null, 2));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
