/* Rendert eine feste Testphrase der Šargija offline (SARGIJA.render) als WAV.
   Nur zum Pruefen/Vergleichen - gehoert nicht zum Spiel selbst.
   Aufruf: node tools/shargija-render.js <ausgabe.wav> [instrument 0|1|2] [html] */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const out = process.argv[2] || 'render.wav', inst = +(process.argv[3] || 0);
/* SOUND='{"buzz":0}' setzt Klangregler fuer diesen Lauf */
const snd = process.env.SOUND ? JSON.parse(process.env.SOUND) : null;
const html = path.resolve(process.argv[4] || path.join(__dirname, '../shargija/index.html'));

/* Melodie (Kad ja pođoh na Bembašu), Tremolo, Legato-Bundwechsel, harte Einzelschläge */
function phrase() {
  const ev = []; let t = 0.3; const q = 0.32;
  const mel = [3, 3, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0];
  mel.forEach((f, i) => { ev.push({ t, f, d: i % 2 ? -1 : 1, p: i % 2 ? .75 : 1, fresh: i && mel[i - 1] !== f }); t += q / 2; });
  t += .3;
  for (let i = 0; i < 40; i++) { const f = i < 20 ? 4 : 5; ev.push({ t, f, d: i % 2 ? -1 : 1, p: .8, fresh: i === 20 }); t += 1 / 16; }
  t += .5;
  ev.push({ t, f: 2, d: 1, p: 1.1 }); ev.push({ t: t + .35, f: 3, tie: 1 }); ev.push({ t: t + .7, f: 4, tie: 1 });
  ev.push({ t: t + 1.05, f: 3, tie: 1 }); t += 2;
  for (const p of [1.4, 1.4, .5]) { ev.push({ t, f: 0, d: 1, p }); t += 1.4; }
  return { ev, secs: t + 2.5 };
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--mute-audio'] });
  /* Worklets laden nicht von file:// - ein kleiner Server liefert den Ordner aus. */
  const http = require('http'), dir = path.dirname(html);
  const srv = http.createServer((q, r) => {
    const f = path.join(dir, decodeURIComponent(q.url.split(/[?#]/)[0]));
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream' }); r.end(d); });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const p = await b.newPage();
  /* Die Spielschleife bleibt stehen, damit nichts in die Aufnahme spielt. */
  await p.addInitScript(() => { window.requestAnimationFrame = () => 0;
    let sd = 20251002; Math.random = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296; });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:' + srv.address().port + '/' + path.basename(html) + '#dev'); await p.waitForTimeout(500);
  const { ev, secs } = phrase();
  const b64 = await p.evaluate(async ([ev, secs, inst, snd]) => {
    if (snd && window.SARGIJA.SOUND) Object.assign(window.SARGIJA.SOUND, snd);
    /* Das Spiel laeuft waehrend des Renderns weiter und kann sich (Intro,
       Demo) in den Offline-Kontext mischen. Faellt ein Abschnitt dabei
       stumm aus, wird neu gerendert.                                    */
    let buf;
    for (let tries = 0; tries < 4; tries++) {
      buf = await window.SARGIJA.render(secs, ev, inst);
      const d = buf.getChannelData(0), W = buf.sampleRate / 2; let ok = true;
      for (let i = 0; i + W < buf.sampleRate * (secs - 4); i += W) {
        let e = 0; for (let k = i; k < i + W; k++) e += d[k] * d[k];
        if (Math.sqrt(e / W) < .001) { ok = false; break; }
      }
      if (ok) break;
    }
    const n = buf.length, L = buf.getChannelData(0), R = buf.getChannelData(1);
    const dv = new DataView(new ArrayBuffer(44 + n * 4)); let o = 0;
    const s = x => { for (const c of x) dv.setUint8(o++, c.charCodeAt(0)); };
    s('RIFF'); dv.setUint32(o, 36 + n * 4, true); o += 4; s('WAVEfmt ');
    dv.setUint32(o, 16, true); o += 4; dv.setUint16(o, 1, true); o += 2; dv.setUint16(o, 2, true); o += 2;
    dv.setUint32(o, buf.sampleRate, true); o += 4; dv.setUint32(o, buf.sampleRate * 4, true); o += 4;
    dv.setUint16(o, 4, true); o += 2; dv.setUint16(o, 16, true); o += 2; s('data'); dv.setUint32(o, n * 4, true); o += 4;
    for (let i = 0; i < n; i++) for (const c of [L, R]) { const v = Math.max(-1, Math.min(1, c[i] || 0)); dv.setInt16(o, v * 32767, true); o += 2; }
    let bin = ''; const u = new Uint8Array(dv.buffer);
    for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(bin);
  }, [ev, secs, inst, snd]);
  fs.writeFileSync(out, Buffer.from(b64, 'base64'));
  console.log('wrote', out, secs.toFixed(1) + 's', errs.length ? errs : '');
  await b.close(); srv.close();
})();
