import { getStore } from '@netlify/blobs';

/* Vraća zbrojeve po danima. Ako je postavljena varijabla STATS_KEY,
   traži se ?key=... — inače je otvoreno. */

export default async (req) => {
  const url = new URL(req.url);
  const kljucOk = !process.env.STATS_KEY || url.searchParams.get('key') === process.env.STATS_KEY;
  if (!kljucOk) return new Response('nope', { status: 401 });

  const dana = Math.max(1, Math.min(90, parseInt(url.searchParams.get('dana') || '30', 10)));
  const store = getStore('tri-fildzana');

  const out = [];
  const sada = new Date();
  for (let i = 0; i < dana; i++) {
    const d = new Date(sada.getTime() - i * 86400000).toISOString().slice(0, 10);
    try {
      const rec = await store.get('dan-' + d, { type: 'json' });
      if (rec) out.push(rec);
    } catch { /* dan bez podataka */ }
  }

  /* ukupno preko svih dana */
  const zbroj = { posjeta: 0, sesija: 0, sekundi: 0, rundi: 0, partije: 0, rekord: 0 };
  const spoji = {};
  for (const d of out) {
    zbroj.posjeta += d.posjeta || 0;
    zbroj.sesija += d.sesija || 0;
    zbroj.sekundi += d.sekundi || 0;
    zbroj.rundi += d.rundi || 0;
    zbroj.partije += d.partije || 0;
    zbroj.rekord = Math.max(zbroj.rekord, d.rekord || 0);
    for (const polje of ['jezik', 'uredjaj', 'platforma', 'preglednik', 'zemlja', 'grad',
                         'izvor', 'ekran', 'piksel', 'zvuk', 'sezona', 'dogadjaj', 'trajanje']) {
      spoji[polje] = spoji[polje] || {};
      for (const [k, v] of Object.entries(d[polje] || {})) spoji[polje][k] = (spoji[polje][k] || 0) + v;
    }
  }
  zbroj.minuta = Math.round(zbroj.sekundi / 60);
  zbroj.prosjecnoSek = zbroj.sesija ? Math.round(zbroj.sekundi / zbroj.sesija) : 0;

  return new Response(JSON.stringify({ zbroj, spoji, dani: out }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
};

export const config = { path: '/api/stats' };
