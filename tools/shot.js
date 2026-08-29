/* Macht Bildschirmfotos einzelner Zustaende. Nur zum Pruefen.           */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const outDir = process.argv[2] || '.';
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const page = await browser.newPage({ viewport: { width: 1000, height: 460 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve('index.html'));
  await page.waitForTimeout(400);
  const shots = {
    menu: () => { __H.unlock(); __H.closeGate(); __H.endIntro(); __H.showScreen('main'); },
    spiel: () => { __H.showScreen('main'); __H.startSong(0, 0); __H.S.energy = .8; __H.press(4); __H.press(2); __H.S.bel = .8; },
    veselje: () => { __H.startDemo(0, 0, true); __H.S.energy = 1; __H.S.solo = 1; __H.S.soloEnd = performance.now() + 9000; },
    lieder: () => { __H.showScreen('songs'); },
    einstellungen: () => { __H.showScreen('setup'); }
  };
  for (const [name, fn] of Object.entries(shots)) {
    await page.evaluate(`(${fn.toString()})()`);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outDir, name + '.png') });
    console.log(name);
  }
  await browser.close();
})();
