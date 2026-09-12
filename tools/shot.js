/* Macht Bildschirmfotos einzelner Zustaende. Nur zum Pruefen.           */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const outDir = process.argv[2] || '.';
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve('index.html'));
  await page.waitForTimeout(400);
  const shots = {
    start: () => {},
    intro: () => { __G.closeGate(); },
    menu: () => { __G.endIntro(); __G.showScreen('main'); },
    lieder: () => { __G.showScreen('songs'); },
    anleitung: () => { __G.showScreen('howto'); },
    frei: () => { __G.startFree(); __G.pitch(3); __G.bow(.8, 1); __G.S.bowPos = 40; __G.S.energy = .5; },
    lied: () => { __G.startSong(0); __G.S.t0 = performance.now() - 2600; __G.pitch(3); __G.bow(.7, -1); __G.S.energy = .6; },
    solo: () => { __G.startFree(); __G.pitch(4); __G.bow(.9, 1); __G.S.energy = 1; __G.S.solo = 1; __G.S.soloStart = performance.now() - 3000; __G.S.soloEnd = performance.now() + 6000; },
    ergebnis: () => { __G.startSong(0); __G.S.clean = 30; __G.S.total = 40; __G.S.near = 6; __G.S.miss = 4; __G.S.maxCombo = 14; __G.finish(); }
  };
  const waits = { intro: 3300, frei: 700, lied: 700, solo: 900 };
  for (const [name, fn] of Object.entries(shots)) {
    await page.evaluate(`(${fn.toString()})()`);
    await page.waitForTimeout(waits[name] || 500);
    await page.screenshot({ path: path.join(outDir, name + '.png') });
    console.log(name);
  }
  await browser.close();
})();
