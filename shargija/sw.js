/* Šargija offline — von tools/shargija-pwa.py erzeugt, nicht von Hand aendern.
   56 Dateien, 12.8 MB. */
const CACHE = "sargija-a251598227";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./preview.jpg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./favicon-32.png",
  "./assets/dancer_female_body.png",
  "./assets/dancer_female_legs.png",
  "./assets/dancer_male_body.png",
  "./assets/dancer_male_legs.png",
  "./assets/environment_floor.png",
  "./assets/environment_sky.png",
  "./assets/hand_fret_back.png",
  "./assets/hand_fret_front.png",
  "./assets/hand_pick.png",
  "./assets/instrument_body_kra.png",
  "./assets/instrument_body_sar.png",
  "./assets/instrument_body_saz.png",
  "./assets/instrument_bridge.png",
  "./assets/instrument_head_4_kra.png",
  "./assets/instrument_head_4_sar.png",
  "./assets/instrument_head_4_saz.png",
  "./assets/instrument_head_6_kra.png",
  "./assets/instrument_head_6_sar.png",
  "./assets/instrument_head_6_saz.png",
  "./assets/instrument_neck_kra.png",
  "./assets/instrument_neck_sar.png",
  "./assets/instrument_neck_saz.png",
  "./assets/instrument_tailpiece.png",
  "./assets/note_diamond_clean.png",
  "./assets/note_diamond_miss.png",
  "./assets/note_diamond_near.png",
  "./assets/note_diamond_normal.png",
  "./assets/note_grace_clean.png",
  "./assets/note_grace_miss.png",
  "./assets/note_grace_near.png",
  "./assets/note_grace_normal.png",
  "./assets/note_open_clean.png",
  "./assets/note_open_miss.png",
  "./assets/note_open_near.png",
  "./assets/note_open_normal.png",
  "./assets/player.png",
  "./assets/prop_banknote.png",
  "./assets/prop_bulb.png",
  "./assets/ui_card_disabled.png",
  "./assets/ui_card_highlighted.png",
  "./assets/ui_card_normal.png",
  "./assets/ui_card_pressed.png",
  "./assets/ui_card_selected.png",
  "./assets/ui_control_disabled.png",
  "./assets/ui_control_highlighted.png",
  "./assets/ui_control_normal.png",
  "./assets/ui_control_pressed.png",
  "./assets/ui_control_selected.png",
  "./assets/ui_panel_normal.png"
];
self.addEventListener("install", e => {
  // cache:"reload" — am Browser-Zwischenspeicher vorbei, sonst kämen alte Bilder in die neue Fassung
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(f => new Request(f, {cache: "reload"}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith("sargija-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => self.clients.matchAll({includeUncontrolled: true}))
    .then(cs => cs.forEach(c => c.postMessage({t: "offline-ready", n: FILES.length}))));
});
/* Erst der Speicher, dann das Netz: offline startet das Spiel sofort,
   online kommt eine neue Fassung über einen neuen Service Worker.        */
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  e.respondWith(caches.match(r, {ignoreSearch: true}).then(hit => {
    if (hit) return hit;
    if (r.mode === "navigate") return caches.match("./index.html").then(i => i || fetch(r));
    return fetch(r);
  }));
});
