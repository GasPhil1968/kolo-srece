/* Prueft den Offline-Modus wie am iPad: einmal online oeffnen, dann Netz UND Server weg,
   neu laden, durch die Menues gehen und ein Lied spielen.
   Nur zum Pruefen - gehoert nicht zum Spiel.  Aufruf: node tools/shargija-offline-test.js [ordner] [BxH] */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = path.resolve(process.argv[2] || path.join(__dirname, '../shargija'));
const [VW, VH] = (process.argv[3] || '1180x820').split('x').map(Number);
const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript', png: 'image/png', jpg: 'image/jpeg', webmanifest: 'application/manifest+json' };
(async () => {
  let hits = 0;
  const srv = http.createServer((q, r) => {
    hits++;
    let f = path.join(dir, decodeURIComponent(q.url.split(/[?#]/)[0]));
    if (f.endsWith('/')) f += 'index.html';
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'Content-Type': TYPES[f.split('.').pop()] || 'application/octet-stream' }); r.end(d); });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const url = 'http://127.0.0.1:' + srv.address().port + '/';
  const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [], failed = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('requestfailed', r => failed.push(r.url()));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

  // 1. online
  await p.goto(url);
  const toast = await p.waitForSelector('#offToast', { timeout: 60000 }).then(() => true, () => false);
  const cached = await p.evaluate(async () => { const ks = await caches.keys(); let n = 0;
    for (const k of ks) n += (await (await caches.open(k)).keys()).length; return { caches: ks, n }; });
  console.log('online: Meldung "Offline bereit":', toast, '| gespeichert:', cached.n, 'Dateien in', cached.caches.join(','));

  // 2. Netz und Server weg
  await new Promise(r => srv.close(r)); await ctx.setOffline(true);
  const before = hits; errs.length = 0; failed.length = 0;
  await p.reload(); await p.waitForTimeout(1200);
  const gate = await p.evaluate(() => !!document.querySelector('#gate, .gate, [id*=gate]') || document.body.innerText.length > 0);
  await p.mouse.click(VW / 2, VH / 2); await p.waitForTimeout(700); await p.mouse.click(VW / 2, VH / 2); await p.waitForTimeout(3500);
  await p.screenshot({ path: path.join(process.env.OUT || '.', 'offline-menu.png') });
  await p.locator('.nav button').first().click(); await p.waitForTimeout(600);
  await p.locator('.card .crow button.p').first().click(); await p.waitForTimeout(1500);
  for (let i = 0; i < 30; i++) { await p.keyboard.press(i % 2 ? 'k' : 'Space'); await p.waitForTimeout(120); }
  await p.screenshot({ path: path.join(process.env.OUT || '.', 'offline-play.png') });
  const st = await p.evaluate(() => ({ broken: [...document.querySelectorAll('image')].filter(i => !i.getAttribute('href')).length,
    painted: document.querySelectorAll('[data-painted]').length }));
  console.log('offline: Seite da:', gate, '| Grafiken:', st.painted, '| Fehler:', errs, '| fehlgeschlagene Anfragen:', failed, '| Serverzugriffe offline:', hits - before);
  await b.close();
  process.exit(toast && cached.n > 50 && !errs.length && !failed.length ? 0 : 1);
})();
