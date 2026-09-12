/* Snima ekrane u više veličina. Samo za provjeru.  node razvij-jufku/tools/shot.js [out]  */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const outDir = process.argv[2] || path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const sizes = { iphone: [390, 844], tablet: [820, 1180], desktop: [1440, 900] };
  for (const [name, [w, h]] of Object.entries(sizes)) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: name === 'desktop' ? 1 : 2 });
    await page.addInitScript(() => { window.__EPTEST = true; });
    await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
    await page.waitForTimeout(400);
    const sim = (sec) => page.evaluate((sec) => { for (let i = 0; i < sec * 60; i++) { EP.update(1 / 60); if (EP.G.st === EP.S.PLAYING && EP.G.phase === EP.PHASE.FIL) EP.filStep(1/60); } EP.render(); }, sec);
    const drag = (x0, y0, x1, y1, n, sps) => page.evaluate(([x0, y0, x1, y1, n, sps]) => {
      const m = EP.mjere(); const S = (x, y) => [x * m.SC + m.OX, y * m.SC + m.OY];
      EP.onDown(...S(x0, y0));
      for (let i = 1; i <= n; i++) { const t = i / n; EP.onMove(...S(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)); for (let k = 0; k < Math.max(1, Math.round(sps * 60)); k++) { EP.update(1/60); if (EP.G.phase === EP.PHASE.FIL) EP.filStep(1/60); } }
      EP.onUp(...S(x1, y1)); EP.render();
    }, [x0, y0, x1, y1, n, sps]);
    if (name === 'iphone') {
      await sim(1.6); await page.screenshot({ path: path.join(outDir, name + '-intro-test.png') });
      await sim(2.9); await page.screenshot({ path: path.join(outDir, name + '-intro-naslov.png') });
    }
    await sim(6);
    await page.screenshot({ path: path.join(outDir, name + '-menu.png') });
    await page.evaluate(() => EP.newGame());
    await sim(1);
    await page.evaluate(() => { EP.G.okl.p = 0.5; EP.G.okl.x = 360; EP.G.okl.y = 800; EP.render(); });
    if (name === 'iphone') await page.screenshot({ path: path.join(outDir, name + '-oklagija.png') });
    await page.evaluate(() => { EP.G.okl.p = 1; });
    await sim(0.2);
    /* razvijanje: s ruba prema van, okolo — kao pravi igrač */
    for (let round = 0; round < 5; round++) {
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2 + round * 0.26;
        const outer = await page.evaluate((a) => { const s = ((Math.round(a / (Math.PI*2/36)) % 36) + 36) % 36; return EP.D.rad[7][s]; }, a);
        if (outer > 320) continue;
        const r0 = outer * ((k % 2) ? 0.35 : 0.65), r1 = Math.min(r0 + 130, 345);
        const p0 = await page.evaluate(([a, r]) => EP.toScr(Math.cos(a) * r, Math.sin(a) * r), [a, r0]);
        const p1 = await page.evaluate(([a, r]) => EP.toScr(Math.cos(a) * r, Math.sin(a) * r), [a, r1]);
        await drag(p0.x, p0.y, p1.x, p1.y, 10, 0.03);
      }
      if (await page.evaluate(() => EP.D.cover) >= 0.97) break;
    }
    await page.evaluate(() => { const m = EP.mjere(); EP.onDown(300 * m.SC + m.OX, 900 * m.SC + m.OY); EP.NANA.say = 'E, vidi se šara. Tako.'; EP.NANA.sayT = 3; EP.render(); });
    await page.screenshot({ path: path.join(outDir, name + '-razvijanje.png') });
    await page.evaluate(() => { const m = EP.mjere(); EP.onUp(300 * m.SC + m.OX, 900 * m.SC + m.OY); });
    if (name === 'iphone') {
      await page.evaluate(() => EP.finishPhase());
      for (let k = 0; k < 5; k++) { const y = 720 + k * 50; await drag(180, y, 540, y, 16, 0.03); }
      await page.evaluate(() => { const m = EP.mjere(); EP.onDown(400 * m.SC + m.OX, 860 * m.SC + m.OY); EP.render(); });
      await page.screenshot({ path: path.join(outDir, name + '-fil.png') });
      await page.evaluate(() => { const m = EP.mjere(); EP.onUp(400 * m.SC + m.OX, 860 * m.SC + m.OY); EP.finishPhase(); });
      const yTop = await page.evaluate(() => EP.TCY - EP.R_T * EP.PERSP - 8);
      await drag(360, yTop, 360, yTop + 200, 14, 0.03);
      await page.screenshot({ path: path.join(outDir, name + '-motanje.png') });
      await drag(360, yTop + 200, 360, yTop + 440, 14, 0.03);
      await sim(2.6);
      await page.evaluate(() => { while (EP.G.pec.needle < 0.55) EP.update(1/60); EP.render(); });
      await page.screenshot({ path: path.join(outDir, name + '-pecenje.png') });
      await page.evaluate(() => { while (EP.G.pec.needle < 0.70) EP.update(1/60); EP.takeOut(); });
      await sim(1.6);
      await page.screenshot({ path: path.join(outDir, name + '-ocjena.png') });
      await page.evaluate(() => { EP.G.strikes = 3; EP.gameOver(); });
      await sim(1.5);
      await page.screenshot({ path: path.join(outDir, name + '-kraj.png') });
      await page.evaluate(() => { EP.G.st = EP.S.HOWTO; EP.render(); });
      await page.screenshot({ path: path.join(outDir, name + '-howto.png') });
      await page.evaluate(() => { EP.G.st = EP.S.STATS; EP.render(); });
      await page.screenshot({ path: path.join(outDir, name + '-stats.png') });
    }
    await page.close();
    console.log(name);
  }
  await browser.close();
})();
