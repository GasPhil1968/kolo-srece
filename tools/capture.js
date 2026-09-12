/* Nimmt den echten Ausgang des Spiels auf und schreibt eine WAV-Datei.
   Nur zum Prüfen des Klangs — gehört nicht zum Spiel selbst.
   Aufruf: node tools/capture.js <szene> <sekunden> <ziel.wav>
   Szenen: demo:<lied>  tone:<griff>  scale  strokes                       */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');

const scene = process.argv[2] || 'demo:0';
const secs  = parseFloat(process.argv[3] || '6');
const out   = process.argv[4] || 'out.wav';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 430 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

  await page.goto('file://' + path.resolve('index.html'));
  await page.waitForTimeout(500);

  const pcm = await page.evaluate(async ({ scene, secs }) => {
    const G = window.__G;
    if (!G) throw new Error('window.__G fehlt');
    G.closeGate(); G.endIntro();
    const AC = G.ac();
    if (!AC) throw new Error('kein AudioContext');
    await AC.resume();
    for (let i = 0; i < 60 && !G.workletOn; i++) await new Promise(r => setTimeout(r, 50));
    if (!G.workletOn) throw new Error('AudioWorklet nicht gestartet');

    // Abgriff hinter dem Begrenzer
    const buf = [];
    const sp = AC.createScriptProcessor(4096, 2, 2);
    sp.onaudioprocess = e => {
      const L = e.inputBuffer.getChannelData(0), R = e.inputBuffer.getChannelData(1);
      const c = new Float32Array(L.length * 2);
      for (let i = 0; i < L.length; i++) { c[i * 2] = L[i]; c[i * 2 + 1] = R[i]; }
      buf.push(c);
      const o = e.outputBuffer.getChannelData(0); for (let i = 0; i < o.length; i++) o[i] = 0;
    };
    G.tap(sp);
    sp.connect(AC.destination);

    const [kind, arg] = scene.split(':');
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    if (kind === 'demo') G.startDemo(+arg || 0);
    else if (kind === 'tone') {
      G.startFree(); G.pitch(+arg || 0);
      (async () => { let d = 1; while (true) { G.bow(.75, d); G.onStroke(d, 1); await sleep(700); d = -d; } })();
    } else if (kind === 'scale') {
      G.startFree();
      (async () => { for (let i = 0; i <= 6; i++) { G.pitch(i); G.bow(.75, i % 2 ? -1 : 1); G.onStroke(i % 2 ? -1 : 1, 1); await sleep(650); } G.bow(0); })();
    } else if (kind === 'strokes') {
      G.startFree(); G.pitch(2);
      (async () => { let d = 1; for (let i = 0; i < 40; i++) { G.bow(.9, d); G.onStroke(d, 1.1); await sleep(220); d = -d; } G.bow(0); })();
    }
    await sleep(secs * 1000);
    sp.onaudioprocess = null;
    G.bow(0);

    let n = 0; for (const c of buf) n += c.length;
    const all = new Float32Array(n); let k = 0;
    for (const c of buf) { all.set(c, k); k += c.length; }
    return { rate: AC.sampleRate, data: Array.from(all) };
  }, { scene, secs });

  await browser.close();

  const { rate, data } = pcm;
  const frames = data.length / 2;
  const hdr = Buffer.alloc(44), body = Buffer.alloc(frames * 4);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + body.length, 4); hdr.write('WAVE', 8);
  hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
  hdr.writeUInt32LE(rate, 24); hdr.writeUInt32LE(rate * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34);
  hdr.write('data', 36); hdr.writeUInt32LE(body.length, 40);
  for (let i = 0; i < data.length; i++) {
    body.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(data[i] * 32767))), i * 2);
  }
  fs.writeFileSync(out, Buffer.concat([hdr, body]));
  console.log(`${out}  ${frames} frames @ ${rate} Hz  (${(frames / rate).toFixed(2)} s)`);
  if (errs.length) { console.log('--- Fehler ---'); errs.slice(0, 20).forEach(e => console.log(e)); process.exitCode = 1; }
  else console.log('keine Fehler');
})();
