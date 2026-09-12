/* Snima ekrane u više veličina. Samo za provjeru.  node tools/shot.js [out]  */
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
  const sizes = { iphone: [390, 844], android: [360, 780], tablet: [820, 1180], desktop: [1440, 900], landscape: [844, 390] };
  for (const [name, [w, h]] of Object.entries(sizes)) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: name === 'desktop' ? 1 : 2 });
    await page.addInitScript(() => { window.__EPTEST = true; });
    await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
    await page.waitForTimeout(400);
    const sim = (sec) => page.evaluate((sec) => { for (let i = 0; i < sec * 60; i++) EP.update(1 / 60); EP.render(); }, sec);
    await sim(1.2);
    await page.screenshot({ path: path.join(outDir, name + '-menu.png') });
    await page.evaluate(() => { EP.newGame(); for (let i = 0; i < 14; i++) EP.spawn(1 + (i % 6), 120 + (i * 83) % 480, 800 + (i * 61) % 300); EP.G.dropX = 300; });
    await sim(3);
    await page.evaluate(() => { EP.KOM.say = 'Nemoj sve na jednu stranu.'; EP.KOM.sayT = 3; EP.render(); });
    await page.screenshot({ path: path.join(outDir, name + '-igra.png') });
    if (name === 'iphone') {
      await page.evaluate(() => { EP.spawn(8, 200, 900); EP.spawn(8, 470, 900); });
      await page.evaluate(() => { for (let i = 0; i < 8; i++) EP.update(1 / 60); EP.render(); });
      await page.screenshot({ path: path.join(outDir, name + '-merge.png') });
      await page.evaluate(() => { EP.handle('howto'); EP.render(); });
      await page.screenshot({ path: path.join(outDir, name + '-howto.png') });
      await page.evaluate(() => { EP.G.st = EP.S.STATS; EP.render(); });
      await page.screenshot({ path: path.join(outDir, name + '-stats.png') });
      await page.evaluate(() => { EP.newGame(); EP.G.score = 1234; EP.G.biggest = 7; EP.gameOver(); });
      await sim(1.5);
      await page.screenshot({ path: path.join(outDir, name + '-over.png') });
      await page.evaluate(() => { EP.newGame(); EP.startEgg(); });
      await sim(0.6);
      await page.screenshot({ path: path.join(outDir, name + '-jaje.png') });
    }
    await page.close();
    console.log(name);
  }
  await browser.close();
})();
