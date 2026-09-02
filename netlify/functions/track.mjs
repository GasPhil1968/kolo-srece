import { getStore } from '@netlify/blobs';

/* Sve se sprema samo kao zbroj po danu. Ne pišemo IP adrese ni bilo kakav
   trajni identifikator — sesijski id služi samo da se jedna sesija ne broji
   dvaput i nigdje se ne pohranjuje. */

const DANAS = () => new Date().toISOString().slice(0, 10);

function prazno(dan) {
  return {
    dan,
    posjeta: 0,          // pokretanja igre
    sesija: 0,           // zavrsene sesije
    sekundi: 0,          // ukupno odigrano
    rundi: 0,
    partije: 0,
    najduza: 0,
    rekord: 0,
    jezik: {},
    uredjaj: {},
    platforma: {},
    preglednik: {},
    zemlja: {},
    grad: {},
    izvor: {},
    ekran: {},
    piksel: { 0: 0, 1: 0 },
    zvuk: { 0: 0, 1: 0 },
    sezona: {},
    dogadjaj: {},
    trajanje: { '0-30s': 0, '30-120s': 0, '2-5min': 0, '5-15min': 0, '15min+': 0 }
  };
}

const plus = (o, k, n = 1) => { if (k === undefined || k === null || k === '') return; o[k] = (o[k] || 0) + n; };

function kanta(sek) {
  if (sek < 30) return '0-30s';
  if (sek < 120) return '30-120s';
  if (sek < 300) return '2-5min';
  if (sek < 900) return '5-15min';
  return '15min+';
}

export default async (req, context) => {
  if (req.method !== 'POST') return new Response('ok', { status: 200 });

  let p;
  try { p = await req.json(); } catch { return new Response('bad', { status: 400 }); }
  if (!p || p.v !== 1) return new Response('bad', { status: 400 });

  const store = getStore('tri-fildzana');
  const dan = DANAS();
  const kljuc = 'dan-' + dan;

  let d;
  try { d = (await store.get(kljuc, { type: 'json' })) || prazno(dan); }
  catch { d = prazno(dan); }

  const sek = Math.max(0, Math.min(24 * 3600, p.sek | 0));

  if (p.prvi) {
    d.posjeta++;
    plus(d.jezik, p.lang);
    plus(d.uredjaj, p.uredjaj);
    plus(d.platforma, p.platforma);
    plus(d.preglednik, p.preglednik);
    plus(d.izvor, p.izvor);
    plus(d.ekran, p.ekran);
    plus(d.piksel, p.pix ? 1 : 0);
    plus(d.zvuk, p.zvuk ? 1 : 0);
    /* Netlify daje grubu lokaciju iz svoje mreže — bez pohrane IP-a */
    plus(d.zemlja, context?.geo?.country?.code || '??');
    plus(d.grad, context?.geo?.city || '??');
  }

  if (p.kraj) {
    d.sesija++;
    d.sekundi += sek;
    d.rundi += Math.max(0, p.rundi | 0);
    d.partije += Math.max(0, p.partije | 0);
    d.najduza = Math.max(d.najduza, sek);
    d.rekord = Math.max(d.rekord, p.rekord | 0);
    plus(d.trajanje, kanta(sek));
    plus(d.sezona, String((p.sezona | 0) + 1));
  }

  if (Array.isArray(p.ev)) {
    for (const e of p.ev.slice(0, 60)) {
      const ime = String(e).split(':')[0].slice(0, 32);
      plus(d.dogadjaj, ime);
    }
  }

  try { await store.setJSON(kljuc, d); } catch { /* pri gužvi se zadnji upis gubi, prihvatljivo */ }

  return new Response('ok', {
    status: 200,
    headers: { 'Cache-Control': 'no-store' }
  });
};

export const config = { path: '/api/track' };
