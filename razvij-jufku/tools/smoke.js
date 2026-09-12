/* Provede igru kroz cijelu jednu pitu i sva stanja, prijavi greške iz konzole.
   Samo za provjeru — nije dio igre.  node razvij-jufku/tools/smoke.js       */
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
    await page.waitForTimeout(80);
    steps.push(`${errs.length === before ? 'ok  ' : 'FAIL'} ${name}${info ? '  — ' + info : ''}`);
  };
  const sim = (sec) => page.evaluate((sec) => { for (let i = 0; i < sec * 60; i++) { EP.update(1 / 60); if (EP.G.st === EP.S.PLAYING && EP.G.phase === EP.PHASE.FIL) EP.filStep(1/60); } EP.render(); }, sec);
  const click = (id) => page.evaluate((id) => { EP.render(); const b = EP.btns().find(b => b.id === id); if (!b) throw new Error('nema dugmeta ' + id + ' (ima: ' + EP.btns().map(b=>b.id).join(',') + ')'); EP.handle(id); return b.id; }, id);
  /* povuci prstom po ekranu (virtuelne koordinate) u n koraka */
  const drag = (x0, y0, x1, y1, n, secPerStep) => page.evaluate(([x0, y0, x1, y1, n, sps]) => {
    const m = EP.mjere(); const S = (x, y) => [x * m.SC + m.OX, y * m.SC + m.OY];
    EP.onDown(...S(x0, y0));
    for (let i = 1; i <= n; i++) {
      const t = i / n; EP.onMove(...S(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t));
      for (let k = 0; k < Math.max(1, Math.round(sps * 60)); k++) { EP.update(1/60); if (EP.G.phase === EP.PHASE.FIL) EP.filStep(1/60); }
    }
    EP.onUp(...S(x1, y1));
    EP.render();
  }, [x0, y0, x1, y1, n, secPerStep]);

  await step('intro → meni', async () => { await sim(6); return page.evaluate(() => { EP.render(); return 'st=' + EP.G.st + ' btns=' + EP.btns().map(b => b.id).join(',') + ' thin=' + EP.D.thin.toFixed(2); }); });
  await step('KAKO SE IGRA / NAZAD', async () => { await click('howto'); await sim(0.5); await click('back'); return page.evaluate(() => 'st=' + EP.G.st); });
  await step('STATISTIKA / NAZAD', async () => { await click('stats'); await sim(0.3); await click('back'); return page.evaluate(() => 'st=' + EP.G.st); });
  await step('IGRAJ → oklagija', async () => { await click('play'); return page.evaluate(() => 'st=' + EP.G.st + ' faza=' + EP.G.phase + ' pita=' + EP.PITE[EP.G.pita].name); });
  await step('oklagija naprijed-nazad', async () => {
    for (let i = 0; i < 6; i++) { await drag(360, 760, 360, 920, 8, 0.02); await drag(360, 920, 360, 760, 8, 0.02); }
    await sim(0.2);
    return page.evaluate(() => 'p=' + EP.G.okl.p.toFixed(2) + ' faza=' + EP.G.phase + ' ready=' + EP.D.ready);
  });
  await step('razvijanje: s ruba prema van, okolo', async () => {
    const before = await page.evaluate(() => ({ thin: EP.D.thin, cover: EP.D.cover }));
    let strokes = 0;
    for (let round = 0; round < 6; round++) {
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2 + round * 0.26;
        const outer = await page.evaluate((a) => { const s = Math.round(a / (Math.PI*2/36)) % 36; return EP.D.rad[7][(s+36)%36]; }, a);
        if (outer > 320) continue;
        const r0 = outer * ((k % 2) ? 0.35 : 0.65), r1 = Math.min(r0 + 130, 345);
        const p0 = await page.evaluate(([a, r]) => EP.toScr(Math.cos(a) * r, Math.sin(a) * r), [a, r0]);
        const p1 = await page.evaluate(([a, r]) => EP.toScr(Math.cos(a) * r, Math.sin(a) * r), [a, r1]);
        await drag(p0.x, p0.y, p1.x, p1.y, 10, 0.03); strokes++;
      }
      const cov = await page.evaluate(() => EP.D.cover);
      if (cov >= 0.97) break;
    }
    await sim(0.5);
    return page.evaluate((b) => `poteza=${window.__strokes} thin ${b.thin.toFixed(2)}→${EP.D.thin.toFixed(2)} rub ${b.cover.toFixed(2)}→${EP.D.cover.toFixed(2)} rupe=${EP.D.holes} minT=${EP.D.minT.toFixed(3)} t=${EP.G.raz.time.toFixed(1)}s dry=${EP.D.dry.toFixed(2)}`.replace('undefined', String(0)), before).then(r => r.replace('poteza=0', 'poteza=' + strokes));
  });
  await step('brzo trzanje → rupa', async () => {
    const h0 = await page.evaluate(() => EP.D.holes);
    for (let i = 0; i < 6; i++) { await drag(360, 900, 660, 900, 2, 0.004); await drag(360, 900, 60, 900, 2, 0.004); }
    await sim(0.3);
    return page.evaluate((h0) => 'rupe ' + h0 + '→' + EP.D.holes, h0);
  });
  await step('brašno', async () => { await page.evaluate(() => { EP.D.sticky = 0.8; }); await click('flour'); return page.evaluate(() => 'sticky=' + EP.D.sticky + ' flour=' + EP.D.flour); });
  await step('GOTOVO → fil', async () => { await click('done'); return page.evaluate(() => 'faza=' + EP.G.phase + ' thin=' + EP.G.raz.thin.toFixed(2) + ' rub=' + EP.G.raz.cover.toFixed(2)); });
  await step('fil kašikom', async () => {
    for (let k = 0; k < 6; k++) { const y = 700 + k * 45; await drag(160, y, 560, y, 20, 0.03); }
    await sim(0.3);
    return page.evaluate(() => 'zdjela=' + EP.G.fil.bowl.toFixed(2) + ' tačaka=' + EP.G.fil.pts.length + ' faza=' + EP.G.phase);
  });
  await step('GOTOVO → motanje', async () => { if (await page.evaluate(() => EP.G.phase === EP.PHASE.FIL)) await click('done'); return page.evaluate(() => 'faza=' + EP.G.phase + ' fil=' + EP.G.fil.score.toFixed(2)); });
  await step('povuci čaršaf', async () => {
    const yTop = await page.evaluate(() => EP.TCY - EP.R_T * EP.PERSP - 8);
    await drag(360, yTop, 360, yTop + 420, 30, 0.03);
    await sim(2.5);
    return page.evaluate(() => 'p=' + EP.G.mot.p.toFixed(2) + ' coil=' + EP.G.mot.coil.toFixed(2) + ' faza=' + EP.G.phase + ' puklo=' + EP.G.mot.snapped);
  });
  await step('pečenje: skini na taman', async () => {
    await sim(0.9);
    await page.evaluate(() => { while (EP.G.pec.needle < 0.70) EP.update(1/60); EP.takeOut(); });
    await sim(1.2);
    return page.evaluate(() => 'bake=' + EP.G.pec.bake.toFixed(2) + ' faza=' + EP.G.phase + ' ocjena=' + EP.G.grade.total + ' (' + [EP.G.grade.tanko, EP.G.grade.rub, EP.G.grade.rupe, EP.G.grade.fil, EP.G.grade.pec].join('/') + ') bodovi=' + EP.G.score + ' "' + EP.G.verdict + '"');
  });
  await step('SLJEDEĆA PITA', async () => { await sim(1); await click('next'); return page.evaluate(() => 'pita=' + EP.G.idx + ' ' + EP.PITE[EP.G.pita].name + ' faza=' + EP.G.phase); });
  await step('pauza / nastavi', async () => { await click('pause'); const a = await page.evaluate(() => EP.G.st); await click('resume'); return 'st ' + a + ' → ' + await page.evaluate(() => EP.G.st); });
  await step('zvuk on/off', async () => { await click('snd'); const a = await page.evaluate(() => EP.AU.on); await click('snd'); return 'on=' + a + ' → ' + await page.evaluate(() => EP.AU.on); });
  await step('tri loše pite → kraj', async () => {
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => { EP.G.okl.p = 1; });
      await sim(0.1);
      await page.evaluate(() => { EP.finishPhase(); });           /* razvijanje bez ičega */
      await page.evaluate(() => { EP.finishPhase(); });           /* fil prazan */
      await page.evaluate(() => { EP.G.mot.p = 1; });
      await sim(2.6);
      await page.evaluate(() => { while (EP.G.pec.needle < 0.99 && !EP.G.pec.taken) EP.update(1/60); });
      await sim(1.5);
      const st = await page.evaluate(() => EP.G.phase);
      if (st === 5) await page.evaluate(() => { EP.nextPita(); });
    }
    await sim(0.5);
    return page.evaluate(() => 'st=' + EP.G.st + ' strikes=' + EP.G.strikes + ' over="' + EP.G.overLine + '"');
  });
  await step('PONOVO', async () => { await sim(1); await click('again'); return page.evaluate(() => 'st=' + EP.G.st + ' pita=' + EP.G.idx + ' bodovi=' + EP.G.score); });
  await step('localStorage', async () => page.evaluate(() => {
    const o = JSON.parse(localStorage.getItem('razvij_jufku_v1'));
    if (!o || o.games < 2) throw new Error('nije spremljeno: ' + JSON.stringify(o));
    return JSON.stringify(o);
  }));
  await step('POČETAK iz pauze', async () => { await click('pause'); await click('menu'); return page.evaluate(() => 'st=' + EP.G.st); });
  await step('resize (landscape + desktop)', async () => {
    await page.setViewportSize({ width: 844, height: 390 }); await sim(0.2);
    await page.setViewportSize({ width: 1400, height: 900 }); await sim(0.2);
    return page.evaluate(() => JSON.stringify(EP.mjere()));
  });
  await step('performanse razvijanja (update+render)', async () => page.evaluate(() => {
    EP.newGame(); EP.G.okl.p = 1; EP.update(1/60);
    EP.handDown(0, 0);
    const t0 = performance.now();
    for (let i = 0; i < 300; i++) { EP.handMove(Math.cos(i*0.1)*80, Math.sin(i*0.1)*80, 1/60); EP.update(1/60); EP.render(); }
    return ((performance.now() - t0)/300).toFixed(2) + ' ms/frame (headless)';
  }));

  console.log(steps.join('\n'));
  if (errs.length) console.log('\nGREŠKE:\n' + errs.join('\n'));
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})();
