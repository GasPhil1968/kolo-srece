"""Erzeugt shargija/sw.js: Service Worker, der das Spiel komplett offline speichert.
Die Versionsnummer ist ein Hash ueber alle Dateien - nach jeder Aenderung laedt
das Geraet beim naechsten Online-Start die neue Fassung.
Aufruf: python3 tools/shargija-pwa.py"""
import hashlib, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shargija')
# Grafiken, die das Spiel nie laedt (bleiben im Repo, gehen nicht in den Offline-Speicher)
UNUSED = ('environment_full', 'dancer_female.png', 'dancer_male.png', 'fx_', 'instrument_peg',
          'instrument_head_base_', 'note_pointer_', 'hand_fret.png', 'manifest.json')
files = ['index.html', 'manifest.webmanifest', 'preview.jpg', 'icon-192.png', 'icon-512.png',
         'apple-touch-icon.png', 'favicon-32.png']
for f in sorted(os.listdir(os.path.join(ROOT, 'assets'))):
    if f.endswith('.png') and not any(f.startswith(u) or f == u for u in UNUSED):
        files.append('assets/' + f)
h = hashlib.sha256()
for f in files:
    h.update(f.encode()); h.update(open(os.path.join(ROOT, f), 'rb').read())
ver = h.hexdigest()[:10]
size = sum(os.path.getsize(os.path.join(ROOT, f)) for f in files)
lst = ',\n  '.join('"./' + f + '"' for f in files)
sw = f'''/* Šargija offline — von tools/shargija-pwa.py erzeugt, nicht von Hand aendern.
   {len(files)} Dateien, {size/1e6:.1f} MB. */
const CACHE = "sargija-{ver}";
const FILES = [
  "./",
  {lst}
];
self.addEventListener("install", e => {{
  // cache:"reload" — am Browser-Zwischenspeicher vorbei, sonst kämen alte Bilder in die neue Fassung
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(f => new Request(f, {{cache: "reload"}}))))
    .then(() => self.skipWaiting()));
}});
self.addEventListener("activate", e => {{
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith("sargija-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => self.clients.matchAll({{includeUncontrolled: true}}))
    .then(cs => cs.forEach(c => c.postMessage({{t: "offline-ready", n: FILES.length}}))));
}});
/* Erst der Speicher, dann das Netz: offline startet das Spiel sofort,
   online kommt eine neue Fassung über einen neuen Service Worker.        */
self.addEventListener("fetch", e => {{
  const r = e.request;
  if (r.method !== "GET") return;
  e.respondWith(caches.match(r, {{ignoreSearch: true}}).then(hit => {{
    if (hit) return hit;
    if (r.mode === "navigate") return caches.match("./index.html").then(i => i || fetch(r));
    return fetch(r);
  }}));
}});
'''
open(os.path.join(ROOT, 'sw.js'), 'w').write(sw)
print(f'sw.js: {len(files)} Dateien, {size/1e6:.1f} MB, Version {ver}')
