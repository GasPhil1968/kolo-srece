/* Provede igru kroz sva stanja i prijavi svaku grešku iz konzole.
   Samo za provjeru — nije dio igre.  node tools/smoke.js               */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0,3).join('\n')));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  await page.addInitScript(() => { window.__EPTEST = true; });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForTimeout(500);

  const steps = [];
  const step = async (name, fn) => {
    const before = errs.length;
    let info = '';
    try { info = await fn(); } catch (e) { errs.push(`STEP ${name}: ${e.message}`); }
    await page.waitForTimeout(120);
    steps.push(`${errs.length === before ? 'ok  ' : 'FAIL'} ${name}${info ? '  — ' + info : ''}`);
  };
  /* simulira n sekundi igre bez čekanja u realnom vremenu */
  const sim = (sec) => page.evaluate((sec) => { for (let i = 0; i < sec * 60; i++) { EP.update(1 / 60); } EP.render(); }, sec);
  const click = (id) => page.evaluate((id) => { EP.render(); const b = EP.btns().find(b => b.id === id); if (!b) throw new Error('nema dugmeta ' + id); EP.handle(id); return b.id; }, id);

  await step('meni renderovan', async () => page.evaluate(() => { EP.render(); return 'st=' + EP.G.st + ' btns=' + EP.btns().map(b => b.id).join(','); }));
  await step('KAKO SE IGRA', async () => { await click('howto'); await sim(1); return page.evaluate(() => 'st=' + EP.G.st); });
  await step('nazad', async () => { await click('back'); return page.evaluate(() => 'st=' + EP.G.st); });
  await step('STATISTIKA', async () => { await click('stats'); await sim(0.5); await click('back'); return page.evaluate(() => 'st=' + EP.G.st); });
  await step('IGRAJ', async () => { await click('play'); return page.evaluate(() => 'st=' + EP.G.st + ' cur=' + EP.G.cur + ' next=' + EP.G.next); });

  await step('30 bacanja + fizika', async () => {
    let merges0 = await page.evaluate(() => EP.META.merges);
    for (let i = 0; i < 30; i++) {
      await page.evaluate((i) => { EP.G.dropX = 120 + (i % 6) * 95; }, i);
      await sim(0.3);
      await page.evaluate(() => EP.dropPiece());
      await sim(0.9);
    }
    return page.evaluate((m0) => `bodies=${EP.G.bodies.length} score=${EP.G.score} merges=${EP.META.merges - m0} biggest=${EP.G.biggest}`, merges0);
  });
  await step('sva tijela u tepsiji', async () => page.evaluate(() => {
    const bad = EP.G.bodies.filter(b => b.x - b.r < EP.PL - 1 || b.x + b.r > EP.PR + 1 || b.y + b.r > EP.PFLOOR + 1);
    if (bad.length) throw new Error('van tepsije: ' + bad.length);
    return 'n=' + EP.G.bodies.length;
  }));
  await step('lančano spajanje (8 → 9)', async () => page.evaluate(() => {
    EP.G.bodies = [];
    EP.spawn(8, 200, 1000); EP.spawn(8, 470, 1000);
    EP.spawn(7, 300, 760); EP.spawn(7, 420, 760);
    for (let i = 0; i < 90; i++) EP.update(1 / 60);
    EP.render();
    const r = 'lvls=' + EP.G.bodies.map(b => b.lvl).sort().join(',') + ' biggest=' + EP.G.biggest + ' combo=' + EP.G.combo + ' st=' + EP.G.st;
    EP.G.bodies = []; EP.G.dangerT = 0;      /* carski burek viri preko linije — čistimo za dalje korake */
    return r;
  }));
  await step('pauza / nastavi', async () => {
    await click('pause'); const a = await page.evaluate(() => EP.G.st);
    const before = await page.evaluate(() => EP.G.bodies.map(b => b.y.toFixed(1)).join());
    await sim(1);
    const after = await page.evaluate(() => EP.G.bodies.map(b => b.y.toFixed(1)).join());
    if (before !== after) throw new Error('fizika radi u pauzi');
    await click('resume'); const b = await page.evaluate(() => EP.G.st);
    return 'st ' + a + ' → ' + b;
  });
  await step('zvuk on/off', async () => { await click('snd'); const a = await page.evaluate(() => EP.AU.on); await click('snd'); return 'on=' + a + ' → ' + await page.evaluate(() => EP.AU.on); });
  await step('jaje: burek sa sirom', async () => {
    await page.evaluate(() => EP.startEgg());
    await sim(0.5);
    const p0 = await page.evaluate(() => EP.G.egg && EP.G.egg.phase);
    await sim(4.5);
    const say = await page.evaluate(() => EP.KOM.say);
    await sim(3);
    const done = await page.evaluate(() => EP.G.egg === null);
    return `phase0=${p0} say="${say}" done=${done}`;
  });
  await step('crvena linija → kraj', async () => {
    await page.evaluate(() => { EP.G.bodies = []; for (let i = 0; i < 4; i++) EP.spawn(9, 200 + (i % 2) * 300, 700 + Math.floor(i / 2) * 320); });
    await sim(4);
    return page.evaluate(() => 'st=' + EP.G.st + ' dangerT=' + EP.G.dangerT.toFixed(2) + ' over="' + EP.G.overLine + '"');
  });
  await step('PONOVO', async () => { await sim(1); await click('again'); return page.evaluate(() => 'st=' + EP.G.st + ' bodies=' + EP.G.bodies.length + ' score=' + EP.G.score); });
  await step('localStorage', async () => page.evaluate(() => {
    const o = JSON.parse(localStorage.getItem('evolucija_pite_v1'));
    if (!o || o.games < 2) throw new Error('nije spremljeno: ' + JSON.stringify(o));
    return JSON.stringify(o);
  }));
  await step('POČETAK iz pauze', async () => { await click('pause'); await click('menu'); return page.evaluate(() => 'st=' + EP.G.st); });
  await step('resize (landscape + desktop)', async () => {
    await page.setViewportSize({ width: 844, height: 390 }); await sim(0.2);
    await page.setViewportSize({ width: 1400, height: 900 }); await sim(0.2);
    return page.evaluate(() => JSON.stringify(EP.mjere()));
  });
  await step('60 s performanse (update+render)', async () => page.evaluate(() => {
    EP.newGame();
    for (let i = 0; i < 40; i++) { EP.spawn(1 + (i % 5), 100 + (i * 37) % 500, 700 + (i * 53) % 400); }
    const t0 = performance.now();
    for (let i = 0; i < 600; i++) { EP.update(1 / 60); EP.render(); }
    const ms = (performance.now() - t0) / 600;
    return ms.toFixed(2) + ' ms/frame (headless)';
  }));

  console.log(steps.join('\n'));
  if (errs.length) { console.log('\nGREŠKE:\n' + errs.join('\n')); }
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})();
