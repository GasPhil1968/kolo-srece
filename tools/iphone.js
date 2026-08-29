/* Prueft die Steuerung unter iPhone-Bedingungen: zwei Daumen, native
   Gesten, Knopfabstaende. Nur zum Pruefen - nicht Teil des Spiels.      */
const { chromium } = require('playwright');
const path = require('path');

const SIZES = [
  ['iPhone SE quer', 667, 375],
  ['iPhone 13 mini', 812, 375],
  ['iPhone 15 quer', 852, 393],
  ['iPhone 15 Pro Max', 932, 430]
];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const lines = [], fails = [];
  const check = (name, ok, detail) => {
    lines.push(`${ok ? 'ok  ' : 'FEHL'} ${name}${detail ? '  — ' + detail : ''}`);
    if (!ok) fails.push(name);
  };

  // ── Knopfabstaende auf allen vier Geraeten ───────────────────────────
  for (const [name, w, h] of SIZES) {
    const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await p.goto('file://' + path.resolve('index.html'));
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      __H.unlock(); __H.closeGate(); __H.endIntro(); __H.startFree();
      const svg = document.getElementById('inst'), m = document.getElementById('art').getScreenCTM();
      const ys = [];
      for (let i = 0; i < 8; i++) { const pt = svg.createSVGPoint(); pt.x = 0; pt.y = __H.btnY(i); ys.push(pt.matrixTransform(m).y); }
      const g = []; for (let i = 1; i < 8; i++) g.push(ys[i] - ys[i - 1]);
      return { min: Math.min(...g), max: Math.max(...g), coarse: __H.COARSE };
    });
    check(`Knopfspur ${name}`, r.coarse && r.min >= 28 && (r.max - r.min) < 1.5,
      `${r.min.toFixed(0)}–${r.max.toFixed(0)} px, gleichmäßig: ${(r.max - r.min) < 1.5}`);
    await p.close();
  }

  // ── Steuerung auf einem iPhone 15 ────────────────────────────────────
  const p = await browser.newPage({ viewport: { width: 852, height: 393 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve('index.html'));
  await p.waitForTimeout(300);
  await p.evaluate(() => { __H.unlock(); __H.closeGate(); __H.endIntro(); __H.startFree(); });

  // Zwei Daumen: rechts ein Ton halten, links den Balg ziehen.
  // Frueher nahm der zweite Finger dem ersten den Zeigerfang weg und der
  // gehaltene Ton brach ab.
  const zwei = await p.evaluate(() => {
    const svg = document.getElementById('inst'), st = document.getElementById('stage').getBoundingClientRect();
    const ev = (t, id, x, y) => svg.dispatchEvent(new PointerEvent(t, {
      pointerId: id, clientX: x, clientY: y, bubbles: true, cancelable: true, isPrimary: id === 1, pointerType: 'touch'
    }));
    const evW = (t, id, x, y) => window.dispatchEvent(new PointerEvent(t, {
      pointerId: id, clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch'
    }));
    const rx = st.left + st.width * .8, ry = st.top + st.height * .5;
    ev('pointerdown', 1, rx, ry);
    const gehalten = Object.keys(__H.S.held).length;
    const lx = st.left + st.width * .2, ly = st.top + st.height * .6;
    ev('pointerdown', 2, lx, ly);                       // zweiter Daumen links
    for (let i = 1; i <= 6; i++) evW('pointermove', 2, lx + i * 9, ly);
    const nachher = Object.keys(__H.S.held).length;
    const luft = __H.S.air;
    evW('pointerup', 2, lx + 54, ly);
    const nochGehalten = Object.keys(__H.S.held).length;
    evW('pointerup', 1, rx, ry);
    return { gehalten, nachher, nochGehalten, luft, leer: Object.keys(__H.S.held).length };
  });
  check('zwei Daumen: Ton bleibt beim zweiten Finger stehen',
    zwei.gehalten === 1 && zwei.nachher === 1 && zwei.nochGehalten === 1 && zwei.leer === 0);
  check('zweiter Daumen füllt den Balg', zwei.luft > 0.2, `Luft ${zwei.luft.toFixed(2)}`);

  // Tresenje: der Weg zwischen zwei Bildern muss Schritt fuer Schritt
  // abgelaufen werden, sonst gehen die Richtungswechsel verloren.
  const wechsel = await p.evaluate(() => {
    __H.startFree();
    const st = document.getElementById('stage').getBoundingClientRect();
    const svg = document.getElementById('inst');
    const lx = st.left + st.width * .2, ly = st.top + st.height * .6;
    svg.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, clientX: lx, clientY: ly, bubbles: true, cancelable: true, pointerType: 'touch' }));
    const vor = __H.S.revs;
    // sechs Wechsel, wie beim schnellen Ruetteln
    let x = lx;
    for (let k = 0; k < 6; k++) {
      for (let i = 0; i < 4; i++) { x += (k % 2 ? -14 : 14); window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 9, clientX: x, clientY: ly, bubbles: true, cancelable: true, pointerType: 'touch' })); }
    }
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 9, clientX: x, clientY: ly, bubbles: true, cancelable: true, pointerType: 'touch' }));
    return __H.S.revs - vor;
  });
  check('Tresenje: Richtungswechsel werden gezählt', wechsel >= 5, `${wechsel} Wechsel bei 6 Rüttlern`);

  // Native Gesten: im Spielbereich abgefangen, an Schaltflaechen nicht
  const gesten = await p.evaluate(() => {
    const mk = el => {
      const t = new Touch({ identifier: 1, target: el, clientX: 10, clientY: 10 });
      const e = new TouchEvent('touchstart', { touches: [t], targetTouches: [t], changedTouches: [t], bubbles: true, cancelable: true });
      el.dispatchEvent(e); return e.defaultPrevented;
    };
    const stage = mk(document.getElementById('stage'));
    const knopf = mk(document.getElementById('backBtn'));
    const dbl = new MouseEvent('dblclick', { bubbles: true, cancelable: true });
    document.body.dispatchEvent(dbl);
    return { stage, knopf, dbl: dbl.defaultPrevented };
  });
  check('Wischen/Zoom auf der Bühne abgefangen', gesten.stage === true);
  check('Schaltflächen behalten ihren Tipp', gesten.knopf === false);
  check('Doppeltipp-Zoom abgefangen', gesten.dbl === true);

  // Zurueck-Wischen: landet im Menue statt aus der Seite
  const zurueck = await p.evaluate(async () => {
    __H.startSong(0, 0);
    history.back();
    await new Promise(r => setTimeout(r, 250));
    return { modus: __H.S.mode, menue: __H.veil, url: location.href.slice(-11) };
  });
  check('Zurück-Wischen führt ins Menü, nicht aus dem Spiel',
    zurueck.menue === true && zurueck.modus === 'idle', `Modus ${zurueck.modus}, Menü ${zurueck.menue}`);

  // Ton nach dem Wechsel in eine andere App
  const ton = await p.evaluate(async () => {
    __H.startFree();
    const ac = __H.ac(); await ac.suspend();
    const vorher = ac.state;
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pageshow'));
    await new Promise(r => setTimeout(r, 250));
    return { vorher, nachher: ac.state };
  });
  check('Ton kommt nach dem App-Wechsel zurück', ton.nachher === 'running', `${ton.vorher} → ${ton.nachher}`);

  await p.close();
  await browser.close();

  lines.forEach(l => console.log(l));
  if (errs.length) { console.log('\n--- Fehler auf der Seite ---'); [...new Set(errs)].slice(0, 10).forEach(e => console.log(e)); }
  console.log(fails.length ? `\n${fails.length} von ${lines.length} fehlgeschlagen` : `\nalle ${lines.length} in Ordnung`);
  process.exitCode = (fails.length || errs.length) ? 1 : 0;
})();
