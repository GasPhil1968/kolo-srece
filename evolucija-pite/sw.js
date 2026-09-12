/* EVOLUCIJA PITE — service worker.
   Jezgra igre ide u keš pri instalaciji; poslije radi i bez mreže.
   Navigacija: prvo mreža (da stignu nove verzije), pa keš.
   Ostalo: prvo keš, pa mreža. Putanje su relativne — radi i u podfolderu. */

var KES = 'evolucija-pite-v1';
var BAZA = self.registration.scope;
var JEZGRA = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png']
  .map(function(p){ return new URL(p, BAZA).href; });

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(KES).then(function(c){ return c.addAll(JEZGRA); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(kljucevi){
      return Promise.all(kljucevi.map(function(k){ if(k !== KES) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(function(odg){
        var kopija = odg.clone();
        caches.open(KES).then(function(c){ c.put(JEZGRA[1], kopija); });
        return odg;
      }).catch(function(){
        return caches.match(JEZGRA[1]);
      })
    );
    return;
  }
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
