/* Igra sama crta ikonu i naslovnu sliku.  node razvij-jufku/tools/icons.js */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 400, height: 700 } });
  await page.addInitScript(() => { window.__EPTEST = true; });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForTimeout(300);
  const root = path.resolve(__dirname, '..');
  for (const s of [192, 512]) {
    const d = await page.evaluate((s) => EP.icon(s), s);
    fs.writeFileSync(path.join(root, 'icon-' + s + '.png'), Buffer.from(d.split(',')[1], 'base64'));
  }
  const c = await page.evaluate(() => EP.cover());
  fs.writeFileSync(path.join(root, 'og-cover.jpg'), Buffer.from(c.split(',')[1], 'base64'));
  console.log('icon-192.png, icon-512.png, og-cover.jpg');
  await browser.close();
})();
