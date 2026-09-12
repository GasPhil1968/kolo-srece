/* Igra sama protiv sebe — pametno i nasumično — da se vidi je li balans u redu.
   node tools/autoplay.js [partija]                                            */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const N = parseInt(process.argv[2] || '12', 10);
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => { window.__EPTEST = true; });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForTimeout(300);
  const K = parseFloat(process.env.RSCALE || '1');
  const res = await page.evaluate(([N, K]) => {
    if (K !== 1) EP.PITE.forEach(p => { p.r = Math.round(p.r*K); p.m = p.r*p.r/900; });
    const out = [];
    function landing(x, r){ let y = EP.PFLOOR - r; for (const b of EP.G.bodies){ const dx = Math.abs(b.x - x), rs = b.r + r; if (dx >= rs) continue; const cy = b.y - Math.sqrt(rs*rs - dx*dx); if (cy < y) y = cy; } return y; }
    function smartX(){
      const lvl = EP.G.cur, r = EP.PITE[lvl-1].r;
      let best = null, bestScore = -1e9;
      const xs = []; for (let x = EP.PL + r + 2; x <= EP.PR - r - 2; x += 12) xs.push(x);
      for (const x of xs){
        const ly = landing(x, r);
        let sc = ly;                         /* niže je bolje */
        for (const b of EP.G.bodies){ if (b.lvl === lvl){ const d = Math.hypot(b.x - x, b.y - ly); if (d < b.r + r + 6) sc += 600 + b.lvl*50; } }
        /* ne stavljaj malu na veliku ako ne spaja */
        if (sc > bestScore){ bestScore = sc; best = x; }
      }
      return best;
    }
    for (let g = 0; g < N; g++){
      const smart = g % 2 === 0;
      EP.newGame();
      let drops = 0, guard = 0;
      while (EP.G.st === EP.S.PLAYING && guard++ < 400){
        /* čekaj pitu */
        let w = 0; while (!EP.G.cur && w++ < 120) EP.update(1/60);
        if (!EP.G.cur) break;
        EP.G.dropX = smart ? smartX() : (EP.PL + 40 + Math.random()*(EP.PR - EP.PL - 80));
        for (let i = 0; i < 6; i++) EP.update(1/60);
        if (EP.dropPiece()) drops++;
        /* pusti da se smiri */
        for (let i = 0; i < 75; i++){ EP.update(1/60); if (EP.G.st !== EP.S.PLAYING) break; }
      }
      out.push({ smart, drops, score: EP.G.score, biggest: EP.G.biggest, combo: EP.G.bestCombo, playT: Math.round(EP.G.playT), bodies: EP.G.bodies.length });
    }
    return out;
  }, [N, K]);
  for (const r of res) console.log((r.smart ? 'PAMETNO ' : 'NASUMIČNO') + `  bacanja=${r.drops}  bodovi=${r.score}  najveća=${r.biggest}  combo=${r.combo}  t=${r.playT}s  tijela=${r.bodies}`);
  const avg = (k, f) => (res.filter(f).reduce((s, r) => s + r[k], 0) / res.filter(f).length).toFixed(1);
  console.log(`prosjek pametno: bacanja ${avg('drops', r => r.smart)} bodovi ${avg('score', r => r.smart)} najveća ${avg('biggest', r => r.smart)}`);
  console.log(`prosjek nasumično: bacanja ${avg('drops', r => !r.smart)} bodovi ${avg('score', r => !r.smart)} najveća ${avg('biggest', r => !r.smart)}`);
  await browser.close();
})();
