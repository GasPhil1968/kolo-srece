"use strict";
/* ============================================================
   M. — Erinnerungen zwischen den Zeiten
   Point-and-Click-Adventure nach dem Spielkonzept "M. Adventure v2".
   Engine und Bildsprache aus HIGHLANDER: POVRATNIK v2.2 uebernommen.

   Sektion 01  DISPLAY
   ============================================================ */
/* ------------------------------------------------------------
   DIE BREITE RICHTET SICH NACH DEM GERAET
   ------------------------------------------------------------
   Die Hoehe steht fest: 470 Spielflaeche plus 130 Verbleiste.
   Die Breite nicht. Ein Telefon im Querformat ist 2,17 zu 1,
   ein Bildschirm 1,78 zu 1 -- bei fester Breite bleiben links
   und rechts schwarze Balken, und je schmaler das Geraet, desto
   breiter die Balken.

   Statt das Bild zu verzerren oder zu beschneiden, waechst das
   Sichtfeld: LW wird so gewaehlt, dass LW/LH dem Geraet
   entspricht. Man sieht dann mehr vom Raum, nicht ein breiter
   gezogenes Bild -- die Figuren behalten ihre Proportion und
   jeder Bildpunkt bleibt quadratisch.

   Nach oben ist bei 1280 Schluss, weil das die Breite des
   schmalsten Raums ist. Waere LW groesser als ein Raum, sieht
   man rechts an ihm vorbei ins Leere -- schlimmer als ein
   Balken. Bei 1280 zu 600 bleibt auf einem 2,17-Telefon ein
   Rest von knapp zwei Prozent. Der faellt nicht auf.
   ------------------------------------------------------------ */
var LW_MIN = 960, LW_MAX = 1280;
var LW = 960, LH = 600;          // LW wird von resize() nachgefuehrt
var VIEW_H = 470;                // Spielflaeche (Rest = Verbleiste)
var UI_Y = VIEW_H;
var cv = document.getElementById('cv');
var ctx = cv.getContext('2d');
var PIX = 1;
var DPR = 1, ox = 0, oy = 0, sc = 1;

/* ------------------------------------------------------------
   ZWEI EBENEN
   ------------------------------------------------------------
   Die Spielwelt wird in halber Aufloesung gezeichnet (480x235)
   und danach mit Nearest-Neighbor verdoppelt. Erst dadurch ist
   das Bild wirklich gepixelt: jede Kante, jeder Verlauf und
   jeder Schatten liegt auf einem echten, doppelt so grossen
   Bildpunkt, statt nur so auszusehen.

   Die Bedienleiste, die Dialogbox und alle Schrift werden
   danach in voller Aufloesung darueber gezeichnet. Genau daran
   ist die Vorlage gescheitert -- dort lief beides durch
   denselben Puffer, und fillText() wurde dabei zu grauen
   Kloetzen. Getrennte Ebenen loesen das: harte Pixel im Bild,
   lesbare Schrift darueber.

   WELT_PIX bestimmt die Grobheit. 2 = klassische Pixel-Art,
   1 = wie vorher (fuer Vergleiche per ?fein=1 in der Adresse).
   ------------------------------------------------------------ */
var WELT_PIX = 2;   // wird von setzeStil() gesetzt
var WCV = document.createElement('canvas');
var WCTX = WCV.getContext('2d');
function welteAufbauen(){
  WCV.width  = Math.ceil(LW / WELT_PIX);
  WCV.height = Math.ceil(LH / WELT_PIX);   // volle Hoehe, damit auch
  WCTX.imageSmoothingEnabled = false;      // Karten und Vorspann hineinpassen
}
welteAufbauen();
/* Zeichnet fn() in den groben Puffer und legt das Ergebnis verdoppelt
   auf den Bildschirm. hoehe begrenzt den uebertragenen Ausschnitt --
   die Spielwelt reicht nur bis VIEW_H, eine Kapitelkarte bis LH. */
function gepixelt(fn, hoehe){
  hoehe = hoehe || LH;
  var haupt = ctx;
  ctx = WCTX;
  ctx.setTransform(1/WELT_PIX, 0, 0, 1/WELT_PIX, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, LW, LH);
  try { fn(); } finally {
    ctx = haupt;
    ctx.setTransform(PIX, 0, 0, PIX, 0, 0);
    ctx.imageSmoothingEnabled = false;
    var sh = Math.ceil(hoehe / WELT_PIX);
    ctx.drawImage(WCV, 0, 0, WCV.width, sh, 0, 0, LW, sh * WELT_PIX);
  }
}

function resize(){
  var w = window.innerWidth, h = window.innerHeight;
  /* In einem eingebetteten Rahmen kann die Groesse kurzzeitig null sein
     -- etwa solange der Rahmen noch nicht sichtbar ist. Dann darf hier
     nichts gerechnet werden, sonst bleibt eine Leinwand der Groesse
     null stehen, und das Spiel ist unsichtbar. */
  if (w < 2 || h < 2) return;
  DPR = 1;
  var soll = Math.round(LH * (w / h) / 2) * 2;   // gerade Zahl, wegen WELT_PIX = 2
  soll = Math.max(LW_MIN, Math.min(LW_MAX, soll));
  if (soll !== LW){ LW = soll; UI_Y = VIEW_H; welteAufbauen(); }
  sc = Math.min(w / LW, h / LH);
  var cw = Math.round(LW * sc), ch = Math.round(LH * sc);
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  cv.width = Math.round(LW * PIX); cv.height = Math.round(LH * PIX);
  ctx.imageSmoothingEnabled = false;
  var r = cv.getBoundingClientRect(); ox = r.left; oy = r.top;
  document.getElementById('rot').style.display = (h > w * 1.05 && w < 700) ? 'flex' : 'none';
}

/* ------------------------------------------------------------
   NACHMESSEN
   ------------------------------------------------------------
   resize() hing vorher allein am resize-Ereignis des Fensters. Das
   genuegt fuer eine eigene Seite, aber nicht in einem eingebetteten
   Rahmen: dort bekommt die Seite ihre endgueltige Groesse erst nach
   dem Laden, und wenn das Ereignis nicht ankommt oder zu frueh
   kommt, behaelt die Leinwand die Groesse von vorher. Auf dem Handy
   sah das Spiel deshalb aus wie ein Briefmarke in einem schwarzen
   Rahmen -- der Rahmen war in beiden Richtungen groesser als das
   Bild, was es unmoeglich macht, dass der Massstab stimmt.

   Darum jetzt vier Wege, und der letzte faengt alles auf:
     1. das resize-Ereignis wie bisher,
     2. ein ResizeObserver auf dem Wurzelelement,
     3. das visualViewport, das auf dem Handy zusaetzlich wandert,
     4. eine Messung pro Bild -- ein Zahlenvergleich, sonst nichts.
   ------------------------------------------------------------ */
var LETZTE_B = 0, LETZTE_H = 0;
function passeAn(erzwingen){
  var w = Math.round(window.innerWidth), h = Math.round(window.innerHeight);
  if (w < 2 || h < 2) return;
  if (!erzwingen && w === LETZTE_B && h === LETZTE_H) return;
  LETZTE_B = w; LETZTE_H = h;
  resize();
}
window.addEventListener('resize', function(){ passeAn(true); });
window.addEventListener('orientationchange', function(){
  passeAn(true); setTimeout(function(){ passeAn(true); }, 140);
});
try {
  if (window.ResizeObserver){
    new ResizeObserver(function(){ passeAn(true); }).observe(document.documentElement);
  }
} catch(e){}
try {
  if (window.visualViewport){
    window.visualViewport.addEventListener('resize', function(){ passeAn(true); });
  }
} catch(e){}
/* Sicherheitsnetz fuer Rahmen, die erst spaet ihre Groesse bekommen. */
[60, 200, 600, 1500].forEach(function(ms){ setTimeout(function(){ passeAn(true); }, ms); });

function toLogical(cx, cy){
  var r = cv.getBoundingClientRect();
  return { x: (cx - r.left) / sc, y: (cy - r.top) / sc };
}

/* ============================================================
   Sektion 02  EINGABE
   ============================================================ */
var IN = { x:0, y:0, down:false, tap:null, holdT:0, hadHold:false, right:false };
var GAMEPAD_OK = true;

function pos(e){ var t = (e.touches && e.touches[0]) || e; return toLogical(t.clientX, t.clientY); }

cv.addEventListener('contextmenu', function(e){ e.preventDefault(); });
cv.addEventListener('pointermove', function(e){ var p = pos(e); IN.x = p.x; IN.y = p.y; });
cv.addEventListener('pointerdown', function(e){
  var p = pos(e); IN.x = p.x; IN.y = p.y; IN.down = true; IN.holdT = 0; IN.hadHold = false;
  IN.right = (e.button === 2);
  e.preventDefault();
});
cv.addEventListener('pointerup', function(e){
  var p = pos(e); IN.x = p.x; IN.y = p.y;
  if (IN.down && !IN.hadHold) IN.tap = { x:p.x, y:p.y, right: IN.right };
  IN.down = false; IN.right = false;
  e.preventDefault();
});
cv.addEventListener('pointercancel', function(){ IN.down = false; });
window.addEventListener('keydown', function(e){
  if (G.menu && G.menu.active){ menuKeydown(e); return; }
  if (G.cine && G.cine.active){ cineKeydown(e); return; }
  if (G.chapterCard && G.chapterCard.active){ chapterCardKeydown(e); return; }
  if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); saveGame(false); uiSound('confirm'); return; }
  if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='l'){ e.preventDefault(); loadGame(false); uiSound('confirm'); return; }

  if (G.dlg){
    if (e.key === 'Escape'){ e.preventDefault(); closeDlg(); uiSound('nav'); return; }
    if (e.key === 'ArrowDown' || e.key === 's'){ e.preventDefault(); moveDlgSel(1); return; }
    if (e.key === 'ArrowUp' || e.key === 'w'){ e.preventDefault(); moveDlgSel(-1); return; }
    if (e.key === 'Enter'){ e.preventDefault(); pickDlg(G.dlgSel >= 0 ? G.dlgSel : 0); return; }
    if (/^[1-9]$/.test(e.key)){
      var idx = parseInt(e.key, 10) - 1;
      if (G.dlg.opts[idx]){ e.preventDefault(); G.dlgSel = idx; pickDlg(idx); }
      return;
    }
  }
  if ((e.key === ' ' || e.key === 'Enter') && dialogueVisible() && G.dialogTypeLen < G.dialogTextTotal){
    e.preventDefault(); G.dialogTypeLen = G.dialogTextTotal; uiSound('tick'); return;
  }
  /* Die Katze als Hinweissystem laesst sich auch bewusst rufen.
     Der Konzepttext will kein Hinweismenue -- eine Taste ist keines. */
  if (e.key === 'h' || e.key === 'H'){ katzeZeigt(true); return; }
  /* V erzeugt aus dem laufenden Raum eine Malvorlage und einen Plan
     mit Laufflaeche, Hotspots und Figurenmassstab. */
  if ((e.key === 'v' || e.key === 'V') && !G.menu && !G.cine){ vorlageSpeichern(); return; }
  if (e.key === 'Escape') G.skip = true;
  if (e.key === ' ') G.skip = true;
});

var SND = { ctx:null, gpPrev:{up:false,down:false,ok:false} };
function ensureAudio(){
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!SND.ctx) SND.ctx = new AC();
  if (SND.ctx.state === 'suspended') SND.ctx.resume();
  return SND.ctx;
}
function uiSound(type){
  var ac = ensureAudio();
  if (!ac) return;
  var o = ac.createOscillator(), g = ac.createGain(), f = 440, dur = 0.045, wave = 'square';
  if (type === 'nav'){ f = 540; dur = 0.035; wave = 'triangle'; }
  else if (type === 'confirm'){ f = 760; dur = 0.06; wave = 'square'; }
  else if (type === 'tick'){ f = 660; dur = 0.02; wave = 'triangle'; }
  else if (type === 'erinnerung'){ f = 300; dur = 0.5; wave = 'sine'; }
  o.type = wave; o.frequency.value = f;
  g.gain.value = 0.0001;
  o.connect(g); g.connect(ac.destination);
  var t = ac.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(type === 'erinnerung' ? 0.05 : 0.028, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.01);
}
