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
  await page.waitForTimeout(500);

  const steps = [];
  const step = async (name, fn) => {
    const before = errs.length;
    try { await fn(); } catch (e) { errs.push(`STEP ${name}: ${e.message}`); }
    await page.waitForTimeout(260);
    steps.push(`${errs.length === before ? 'ok  ' : 'FEHL'} ${name}`);
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  await step('Startschirm + Intro', () => page.evaluate(() => { __G.closeGate(); }));
  await step('Intro laeuft 1 s', () => page.waitForTimeout(1000));
  await step('Intro beenden', () => page.evaluate(() => __G.endIntro()));
  await step('Worklet steht', () => page.evaluate(async () => {
    for (let i = 0; i < 40 && !__G.workletOn; i++) await new Promise(r => setTimeout(r, 50));
    if (!__G.workletOn) throw new Error('AudioWorklet nicht gestartet');
  }));
  for (const scr of ['songs', 'drills', 'howto', 'setup', 'main']) {
    await step('Bildschirm ' + scr, () => page.evaluate(s => __G.showScreen(s), scr));
  }
  await step('alle Lieder starten + spielen', () => page.evaluate(async () => {
    for (let i = 0; i < __G.SONGS.length; i++) {
      __G.startSong(i);
      for (let k = 0; k < 12; k++) {
        __G.pitch(k % 6); __G.bow(.8, k % 2 ? 1 : -1); __G.onStroke(k % 2 ? 1 : -1, 1);
        await new Promise(r => setTimeout(r, 60));
      }
      __G.bow(0);
    }
  }));
  await step('Instrumente durchschalten', () => page.evaluate(async () => {
    for (let i = 0; i < __G.INSTRUMENTS.length; i++) {
      __G.S.inst = i; __G.rebuild(); __G.applyInstrument();
      __G.pitch(3); __G.bow(.7, 1); await new Promise(r => setTimeout(r, 80)); __G.bow(0);
    }
    __G.S.inst = 0; __G.rebuild(); __G.applyInstrument();
  }));
  await step('alle Uebungen', () => page.evaluate(async () => {
    for (let i = 0; i < __G.DRILLS.length; i++) { __G.startDrill(i); __G.pitch(2); __G.bow(.6, 1); await new Promise(r => setTimeout(r, 120)); __G.bow(0); }
  }));
  await step('Schwierigkeitsgrade', () => page.evaluate(async () => {
    for (let l = 0; l < __G.LEVELS.length; l++) { __G.S.level = l; __G.startSong(0); await new Promise(r => setTimeout(r, 120)); }
    __G.S.level = 0;
  }));
  await step('Demo', () => page.evaluate(() => __G.startDemo(0)));
  await step('Demo laeuft 2,5 s', () => page.waitForTimeout(2500));
  await step('Demo beenden', () => page.evaluate(() => __G.endDemo()));
  await step('frei spielen mit Zeiger', async () => {
    await page.evaluate(() => __G.startFree());
    const pt = await page.evaluate(() => {
      const svg = document.getElementById('inst'), g = document.getElementById('local');
      const m = g.getScreenCTM(), p = svg.createSVGPoint();
      p.x = 520; p.y = 0; const q = p.matrixTransform(m);
      p.x = 150; p.y = 0; const n = p.matrixTransform(m);
      return { bx: q.x, by: q.y, nx: n.x, ny: n.y };
    });
    await page.mouse.move(pt.bx, pt.by); await page.mouse.down();
    for (let k = 0; k < 12; k++) { await page.mouse.move(pt.bx, pt.by + (k % 2 ? 40 : -40), { steps: 5 }); }
    await page.mouse.up();
    const revs = await page.evaluate(() => __G.S.revs);
    if (revs < 8) throw new Error('zu wenige Striche erkannt: ' + revs);
  });
  await step('Pause + weiter', () => page.evaluate(() => { __G.startSong(0); __G.goPause(); __G.goResume(); }));
  await step('Ergebnis', () => page.evaluate(() => { __G.startSong(0); __G.finish(); }));
  await step('Wertung: Strich im Fenster ist ČISTO', () => page.evaluate(async () => {
    __G.S.level = 1; __G.startSong(0);
    const n = __G.S.notes[0];
    __G.S.t0 = performance.now() - n.t;             // die erste Note ist jetzt faellig
    __G.pitch(n.pos); __G.bow(.8, 1); __G.onStroke(1, 1);
    if (n.grade !== 2) throw new Error('erwartet ČISTO, bekam ' + n.grade);
    __G.bow(0); __G.S.level = 0; __G.toMenu();
  }));
  await step('Wertung: kein Strich ist PROMAŠAJ', () => page.evaluate(async () => {
    __G.S.level = 1; __G.startSong(0);
    const n = __G.S.notes[0];
    __G.S.t0 = performance.now() - n.t - 600;
    __G.judgeFrame(performance.now() - __G.S.t0, performance.now());
    if (n.grade !== 0) throw new Error('erwartet PROMAŠAJ, bekam ' + n.grade);
    __G.S.level = 0; __G.toMenu();
  }));
  await step('Grafikstufen', () => page.evaluate(() => { ['full', 'lite', 'auto'].forEach(m => { __G.GFX.mode = m; }); }));
  await step('zurueck ins Menue', () => page.evaluate(() => __G.toMenu()));
  await page.waitForTimeout(300);

  console.log(steps.join('\n'));
  if (errs.length) { console.log('--- Fehler ---'); errs.slice(0, 20).forEach(e => console.log(e)); process.exitCode = 1; }
  else console.log('keine Fehler');
  await browser.close();
})();
