/* TRI FILDŽANA — service worker.
   Jezgra igre ide u keš pri instalaciji; poslije radi i bez mreže.
   Navigacija: prvo mreža (da stignu nove verzije), pa keš.
   Ostalo: prvo keš, pa mreža. /api/ (statistika) se nikad ne kešira. */

var KES = 'tri-fildzana-v1';
var JEZGRA = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(KES).then(function(c){ return c.addAll(JEZGRA); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(kljucevi){
      return Promise.all(kljucevi.map(function(k){
        if(k !== KES) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  if(url.pathname.indexOf('/api/') === 0) return;          /* statistika ide direktno */
  if(url.pathname === '/stats.html') return;               /* uvijek svježa */

  if(req.mode === 'navigate'){
    /* prvo mreža — da nova verzija igre stigne čim postoji veza */
    e.respondWith(
      fetch(req).then(function(odg){
        var kopija = odg.clone();
        caches.open(KES).then(function(c){ c.put('/index.html', kopija); });
        return odg;
      }).catch(function(){
        return caches.match('/index.html');
      })
    );
    return;
  }

  /* sve ostalo: prvo keš, pa mreža (i usput u keš) */
  e.respondWith(
    caches.match(req).then(function(pogodak){
      if(pogodak) return pogodak;
      return fetch(req).then(function(odg){
        if(odg && odg.ok){
          var kopija = odg.clone();
          caches.open(KES).then(function(c){ c.put(req, kopija); });
        }
        return odg;
      });
    })
  );
});
