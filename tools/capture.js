/* Nimmt den echten Ausgang des Spiels auf und schreibt eine WAV-Datei.
   Nur zum Prüfen des Klangs — gehört nicht zum Spiel selbst.
   Aufruf: node tools/capture.js <szene> <sekunden> <ziel.wav>          */
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
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

  await page.goto('file://' + path.resolve('index.html'));
  await page.waitForTimeout(500);

  const pcm = await page.evaluate(async ({ scene, secs }) => {
    const H = window.__H;
    if (!H) throw new Error('window.__H fehlt');
    H.unlock();
    const AC = H.ac();
    if (!AC) throw new Error('kein AudioContext');
    await AC.resume();

    // Abgriff direkt hinter dem Kompressor
    const buf = [];
    const sp = AC.createScriptProcessor(4096, 2, 2);
    sp.onaudioprocess = e => {
      const L = e.inputBuffer.getChannelData(0), R = e.inputBuffer.getChannelData(1);
      const c = new Float32Array(L.length * 2);
      for (let i = 0; i < L.length; i++) { c[i * 2] = L[i]; c[i * 2 + 1] = R[i]; }
      buf.push(c);
      const o = e.outputBuffer.getChannelData(0); for (let i = 0; i < o.length; i++) o[i] = 0;
    };
    H.tap(sp);
    sp.connect(AC.destination);

    const [kind, arg, vol] = scene.split(':');
    if (vol !== undefined) H.setVolume(parseFloat(vol));
    if (kind === 'demo') H.startDemo(+arg, 0, false);
    else if (kind === 'fest') H.startDemo(+arg, 0, true);
    else if (kind === 'note') { H.S.mode = 'free'; H.S.air = 1; H.S.press = 1; H.noteOn(+arg, 1); }
    else if (kind === 'reg') {
      H.S.reg = +arg; H.applyRegister();
      H.S.mode = 'free'; H.S.air = 1; H.S.press = 1;
      const h = H.noteOn(0, 1); setTimeout(() => H.noteOff(h), 1600);
    }
    else if (kind === 'scale') {
      H.S.mode = 'free'; H.S.air = 1; H.S.press = 1;
      let i = 0;
      const iv = setInterval(() => { const h = H.noteOn(i, 1); setTimeout(() => H.noteOff(h), 380); if (++i > 7) clearInterval(iv); }, 420);
    }
    await new Promise(r => setTimeout(r, secs * 1000));
    sp.onaudioprocess = null;

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
