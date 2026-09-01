// Erzeugt preview.jpg (1200x630) aus der ?demo-Szene fuer die Linkvorschau.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const url = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?demo';
  await page.goto(url);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.resolve(__dirname, '..', 'preview.jpg'), type: 'jpeg', quality: 88 });
  await browser.close();
})();
