const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--mute-audio'] });
  const p = await b.newPage();
  await p.goto('file://' + path.resolve('index.html'));
  await p.waitForTimeout(300);
  const out = await p.evaluate(() => {
    const r = [];
    for (let i = 0; i < __H.SONGS.length; i++) {
      const s = __H.SONGS[i];
      __H.buildSong(s, 0, 1);
      // Zwischen den Strophen liegt eine Pause, die kein ganzes Vielfaches
      // des Schlags ist. Also wird je Strophenblock neu gezaehlt.
      let base = null, prev = null;
      const hits = new Set(), bass = [];
      __H.S.bassEvents.forEach(e => {
        const off = base === null ? NaN : (e.t - base) / s.beat;
        if (base === null || Math.abs(off - Math.round(off)) > 0.01) base = e.t;
        hits.add(Math.round((e.t - base) / s.beat) % s.meter);
        if (e.kind === 'b') bass.push(e.alt ? 'V' : 'I');
      });
      r.push({ titel: s.title, takt: s.meter,
               hits: [...hits].sort((a, c) => a - c), bass: bass.slice(0, 8).join(' ') });
    }
    return r;
  });
  await b.close();
  // 2/4 und 3/4 gehen durch, im Aksak sitzt die linke Hand auf den
  // Gruppenkoepfen: 7/8 = 2+2+3, 9/8 = 2+2+2+3.
  const soll = { 3: [0, 1, 2], 4: [0, 1, 2, 3], 7: [0, 2, 4], 9: [0, 2, 4, 6] };
  let bad = 0;
  out.forEach(o => {
    const okH = JSON.stringify(o.hits) === JSON.stringify(soll[o.takt]);
    const okB = /I V/.test(o.bass);
    if (!okH || !okB) bad++;
    console.log(`${okH && okB ? 'ok  ' : 'FEHL'} ${o.titel.padEnd(15)} ${o.takt}/8  linke Hand [${o.hits}] erwartet [${soll[o.takt]}]   Wechselbass: ${o.bass}`);
  });
  process.exitCode = bad ? 1 : 0;
})();
