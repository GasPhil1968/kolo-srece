/* Fuehrt das Spiel durch alle Zustaende und meldet jeden Fehler.
   Nur zum Pruefen - gehoert nicht zum Spiel selbst.                     */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 430 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  await page.goto('file://' + path.resolve('index.html'));
  await page.waitForTimeout(400);

  const steps = [];
  const step = async (name, fn) => {
    const before = errs.length;
    try { await fn(); } catch (e) { errs.push(`STEP ${name}: ${e.message}`); }
    await page.waitForTimeout(260);
    steps.push(`${errs.length === before ? 'ok  ' : 'FEHL'} ${name}`);
  };

  await step('entsperren + Intro beenden', () => page.evaluate(() => { __H.unlock(); __H.closeGate(); __H.endIntro(); }));
  await step('Menue', () => page.evaluate(() => __H.showScreen('main')));
  for (const scr of ['songs', 'drill', 'howto', 'setup', 'demo']) {
    await step('Bildschirm ' + scr, () => page.evaluate(s => __H.showScreen(s), scr));
  }
  await step('alle Lieder starten + spielen', () => page.evaluate(async () => {
    for (let i = 0; i < __H.SONGS.length; i++) {
      __H.startSong(i, 0);
      for (let k = 0; k < 10; k++) {
        __H.press(k % 8); __H.moveBellows(k % 2 ? .09 : -.09);
        await new Promise(r => setTimeout(r, 16));
        __H.releaseBtn(k % 8);
      }
    }
  }));
  await step('Register durchschalten', () => page.evaluate(async () => {
    for (let r = 0; r < __H.REGISTERS.length; r++) {
      __H.S.reg = r; __H.applyRegister();
      const h = __H.noteOn(3, 1); await new Promise(r2 => setTimeout(r2, 60)); __H.noteOff(h);
    }
    __H.S.reg = 0; __H.applyRegister();
  }));
  await step('alle Uebungen', () => page.evaluate(async () => {
    for (let i = 0; i < __H.DRILLS.length; i++) { __H.startDrill(i); await new Promise(r => setTimeout(r, 90)); }
  }));
  await step('Schwierigkeitsgrade', () => page.evaluate(async () => {
    for (let l = 0; l < __H.LEVELS.length; l++) { __H.S.level = l; __H.startSong(0, 0); await new Promise(r => setTimeout(r, 90)); }
    __H.S.level = 0;
  }));
  await step('Sprachen', () => page.evaluate(() => { ['de', 'sr', 'en'].forEach(l => { __H.setLang(l); __H.showScreen('setup'); }); __H.setLang('de'); }));
  await step('Demo mit Veselje', () => page.evaluate(() => __H.startDemo(2, 0, true)));
  await step('Demo beenden', () => page.evaluate(() => __H.endDemo()));
  await step('frei spielen', () => page.evaluate(async () => {
    __H.startFree();
    for (let k = 0; k < 16; k++) { __H.press(k % 8); await new Promise(r => setTimeout(r, 12)); __H.releaseBtn(k % 8); }
  }));
  await step('Pause + weiter', () => page.evaluate(() => { __H.goPause(); __H.goResume(); }));
  await step('Ergebnis', () => page.evaluate(() => { __H.startSong(0, 0); __H.finish(); }));
  await step('Bassbelegung Stradella', () => page.evaluate(() => {
    __H.startSong(4, 0);
    for (let d = 0; d < 7; d++) {
      const c = __H.stradella(d), b = __H.bassRoot(d, d % 2);
      if (!c.every(f => f > 40 && f < 2000)) throw new Error('Akkord ausserhalb: ' + c);
      if (!(b > 25 && b < 200)) throw new Error('Bass ausserhalb: ' + b);
    }
  }));
  await step('lebende Toene aufgeraeumt', () => page.evaluate(async () => {
    __H.startFree();
    for (let k = 0; k < 40; k++) { __H.press(k % 8); __H.releaseBtn(k % 8); }
    await new Promise(r => setTimeout(r, 400));
  }));

  const frames = await page.evaluate(() => new Promise(res => {
    let n = 0; const t0 = performance.now();
    const f = () => { n++; performance.now() - t0 < 2000 ? requestAnimationFrame(f) : res(n / 2); };
    requestAnimationFrame(f);
  }));

  await browser.close();
  steps.forEach(s => console.log(s));
  console.log(`\nBildrate im Leerlauf: ${frames.toFixed(1)} fps`);
  if (errs.length) { console.log('\n--- Fehler ---'); [...new Set(errs)].slice(0, 25).forEach(e => console.log(e)); process.exitCode = 1; }
  else console.log('keine Fehler');
})();
