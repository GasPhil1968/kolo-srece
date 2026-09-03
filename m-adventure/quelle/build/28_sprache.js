
/* ============================================================
   Sektion 04e  SPRACHE
   ------------------------------------------------------------
   Das Konzept verlangt Deutsch und Kroatisch von Anfang an
   parallel und Texte "in einer externen Tabelle, nie hart im
   Code". Der zweite Teil ist hier ein Zielkonflikt: die Saetze
   stehen in Dialogbaeumen und Sequenzen, wo sie hingehoeren,
   und sie herauszuloesen wuerde jede Szene unleserlich machen.

   Der Ausweg: der deutsche Satz IST der Schluessel. Uebersetzt
   wird zentral an den drei Stellen, an denen Text den Weg auf
   den Bildschirm nimmt -- Sprechzeile, Dialogoption, Name eines
   Gegenstands. Damit ist die Tabelle unten tatsaechlich extern
   im Sinne des Konzepts: sie laesst sich als Ganzes an eine
   Uebersetzung geben, ohne dass jemand Programmcode ansieht.

   Was in der Tabelle fehlt, faellt auf Deutsch zurueck. Es gibt
   also nie eine leere Zeile und nie einen Schluessel im Bild --
   eine halbe Uebersetzung ist spielbar.

   Stand: Bedienung, Menue, Gegenstaende und Kapitel 1
   vollstaendig. Die spaeteren Kapitel folgen, wenn der Vertical
   Slice steht -- so herum empfiehlt es das Konzept selbst.
   ============================================================ */
var SPRACHEN = ['de', 'hr', 'en'];
var SPRACH_NAME = { de:'DE', hr:'BKS', en:'EN' };

/* ------------------------------------------------------------
   WELCHE SPRACHE BEIM ERSTEN START
   ------------------------------------------------------------
   navigator.languages ist keine Menge, sondern eine Rangliste --
   die Person hat sie im Betriebssystem selbst in diese Reihenfolge
   gebracht. Wer 'de-DE' vor 'hr' stellt, will Deutsch lesen, auch
   wenn er Kroatisch kann. Deshalb gewinnt der erste Eintrag, der
   ueberhaupt passt, und nicht der vermeintlich naehere.

   BKS steht hier fuer Bosnisch/Kroatisch/Serbisch. Slowenisch und
   Mazedonisch sind eigene Sprachen und keine Varianten davon; sie
   landen trotzdem hier, weil das Spiel in Jugoslawien spielt und
   BKS fuer diese Leserschaft naeher liegt als Englisch. Wem das
   nicht passt, der stellt im Menue um -- die Wahl wird gemerkt.

   Das Land zaehlt nur, wenn die Sprache nichts hergibt: 'de-BA'
   ist ein Deutschsprachiger in Bosnien und bekommt Deutsch. */
var BKS_SPRACHE = /^(hr|bs|sr|sh|cnr|sl|mk)\b/i;
var BKS_LAND    = /-(HR|BA|RS|ME|XK|SI|MK)\b/i;

function spracheErkennen(){
  var liste = [];
  try {
    if (navigator.languages && navigator.languages.length) liste = [].slice.call(navigator.languages);
    else if (navigator.language) liste = [navigator.language];
  } catch(e){}
  for (var i = 0; i < liste.length; i++){
    var s = String(liste[i] || '');
    if (/^de\b/i.test(s))    return 'de';
    if (BKS_SPRACHE.test(s)) return 'hr';
    if (/^en\b/i.test(s))    return 'en';
    if (BKS_LAND.test(s))    return 'hr';   // erst wenn die Sprache nichts hergibt
  }
  return 'en';
}

var SPRACHE_ERKANNT = false;
var SPRACHE = (function(){
  if (/[?&]hr=1/.test(location.search)) return 'hr';
  if (/[?&]en=1/.test(location.search)) return 'en';
  if (/[?&]de=1/.test(location.search)) return 'de';
  try {
    var s = localStorage.getItem('most.sprache');
    if (SPRACHEN.indexOf(s) >= 0) return s;   // eigene Wahl schlaegt Erkennung
  } catch(e){}
  SPRACHE_ERKANNT = true;
  return spracheErkennen();
})();
function setzeSprache(s){
  SPRACHE = (SPRACHEN.indexOf(s) >= 0) ? s : 'de';
  try { localStorage.setItem('most.sprache', SPRACHE); } catch(e){}
  PORTRAIT_CACHE = {};
}
/* Die Tabelle wird erst beim Nachschlagen geholt, nicht beim Laden:
   HR und EN stehen weiter unten in der Datei und existieren zu diesem
   Zeitpunkt noch nicht. */
function sprachTabelle(){
  if (SPRACHE === 'hr') return (typeof HR !== 'undefined') ? HR : null;
  if (SPRACHE === 'en') return (typeof EN !== 'undefined') ? EN : null;
  return null;
}
/* ue() nimmt einen deutschen Satz und gibt die Uebersetzung zurueck,
   falls es eine gibt. Alles andere bleibt, wie es ist. */
function ue(s){
  if (SPRACHE === 'de' || typeof s !== 'string') return s;
  var t = sprachTabelle();
  if (!t) return s;
  var h = t[s];
  return (h === undefined) ? s : h;
}
/* satz() ist ue() fuer Saetze, in die Namen eingesetzt werden. Noetig,
   weil sich die Wortstellung zwischen den Sprachen verschiebt: aus
   "Was sagt M.?" wird "What does M. say?" -- ein blosses Voranstellen
   des uebersetzten Anfangs wuerde das nicht hergeben. */
function satz(schluessel){
  var s = ue(schluessel);
  for (var i = 1; i < arguments.length; i++) s = s.replace('%s', arguments[i]);
  return s;
}
function ueListe(a){
  if (SPRACHE === 'de' || !a) return a;
  if (typeof a === 'string') return ue(a);
  var out = [];
  for (var i = 0; i < a.length; i++) out.push(ue(a[i]));
  return out;
}
