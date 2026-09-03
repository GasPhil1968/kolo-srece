
/* ============================================================
   Sektion 04b  STILE
   ------------------------------------------------------------
   Der ganze sichtbare Charakter dieses Spiels haengt an einer
   Handvoll Stellen: an der Kontur, an der Grobheit des Pixels,
   an der Frage, ob Verlaeufe in Stufen oder weich laufen, und
   an dem, was zum Schluss ueber das fertige Bild gelegt wird.

   Kein Raum zeichnet selbst eine Kontur oder ein Korn -- alles
   laeuft durch dieselben Hilfsfunktionen. Darum ist ein
   vollstaendiger Stilwechsel hier keine Neuzeichnung von zwoelf
   Raeumen, sondern ein anderer Satz Regeln fuer diese
   Hilfsfunktionen. Umschalten geht im Hauptmenue oder ueber
   ?stil=gouache in der Adresse.

     pixel    Grobes Raster, warme dunkle Kontur, Punktkorn.
              Klassisches Adventure-Pixelbild.
     gouache  Keine gezeichnete Kontur, sondern gehaltene Kanten:
              jede Flaeche bekommt ihre eigene, dunklere Fassung
              ihrer selbst. Weiche Verlaeufe, Papierkorn.
     tusche   Harte schwarze Umrisse, flache Farbe, kein Korn.
              Comic, Ligne claire.
     riso     Zwei Druckfarben, grobes Korn, versetzter Anschnitt.
              Wie ein Risodruck aus einem Kleinverlag.
   ============================================================ */
var STILE = {
  pixel: {
    name:'Pixel', weltPix:2, grid:2, kontur:'warm', linie:1.0, dicke:0,
    banding:1.0, korn:'punkte', vignette:1.0, post:null, sonne:1.0, wobble:0
  },
  gouache: {
    /* wobble: jede Koordinate bekommt einen festen, winzigen Versatz.
       Dadurch ist keine Kante mehr exakt gerade, und zwar immer an
       derselben Stelle -- es flimmert nicht, es sieht nur nicht mehr
       gebaut aus, sondern gemalt. */
    name:'Gouache', weltPix:1, grid:1, kontur:'gehalten', linie:0.0, dicke:2,
    banding:3.2, korn:'papier', vignette:0.55, post:'papier', sonne:1.25, wobble:1.1
  },
  tusche: {
    name:'Tusche', weltPix:1, grid:1, kontur:'hart', linie:2.8, dicke:3,
    banding:0.30, korn:'keins', vignette:0.40, post:'flach', sonne:0.5, wobble:0.5
  },
  riso: {
    name:'Riso', weltPix:2, grid:2, kontur:'hart', linie:1.4, dicke:2,
    banding:0.5, korn:'grob', vignette:0.7, post:'duoton', sonne:0.8, wobble:0
  }
};
var STIL_NAME = (function(){
  var m = /[?&]stil=(\w+)/.exec(location.search);
  if (m && STILE[m[1]]) return m[1];
  try { var s = localStorage.getItem('most.stil'); if (s && STILE[s]) return s; } catch(e){}
  return 'pixel';
})();
var STIL = STILE[STIL_NAME];

function setzeStil(name){
  if (!STILE[name]) return;
  STIL_NAME = name; STIL = STILE[name];
  try { localStorage.setItem('most.stil', name); } catch(e){}
  WELT_PIX = STIL.weltPix;
  SPRITE_GRID = STIL.grid;
  welteAufbauen();
  /* Alles, was vom Stil abhaengt und zwischengespeichert wird, muss
     weg: Raster, Papier und die Portraits. */
  DITHER_CACHE = {};
  KORN_CACHE = {};
  PORTRAIT_CACHE = {};
}

/* ------------------------------------------------------------
   GEHALTENE KANTE
   ------------------------------------------------------------
   Im Gouache-Stil wird keine Kontur gezeichnet. Stattdessen
   bekommt jede Flaeche eine dunklere Fassung ihrer selbst als
   Rand -- das ist, was Malerei tut und was eine Zeichnung nicht
   tut, und es ist der groesste einzelne Unterschied zwischen
   den beiden Bildwelten.
   ------------------------------------------------------------ */
function konturFuer(fill, vorgabe){
  if (IN_UI) return vorgabe || SPRITE_INK;
  if (STIL.kontur === 'hart') return '#12100e';
  if (STIL.kontur === 'gehalten'){
    if (!fill || typeof fill !== 'string') return vorgabe || SPRITE_INK;
    return mixHex(fill, '#2a1c14', 0.42);
  }
  return vorgabe || SPRITE_INK;
}

/* ------------------------------------------------------------
   KORN UND NACHBEHANDLUNG
   ------------------------------------------------------------ */
var KORN_CACHE = {};
function getKornCanvas(art, breit, hoch){
  var id = art + '|' + breit + 'x' + hoch;
  if (KORN_CACHE[id]) return KORN_CACHE[id];
  var c = document.createElement('canvas');
  c.width = Math.max(1, breit); c.height = Math.max(1, hoch);
  var g = c.getContext('2d');
  var rr = seeded(art === 'papier' ? 4711 : 1907);
  if (art === 'papier'){
    /* Papier ist nicht koernig, sondern fleckig: grosse, sehr schwache
       Unregelmaessigkeiten, dazwischen ein paar Fasern. Ein feines
       Rauschen sieht nach Fernsehstoerung aus, nicht nach Buetten. */
    for (var f = 0; f < 900; f++){
      var w = 3 + rr()*26, h = 3 + rr()*22;
      g.globalAlpha = 0.012 + rr()*0.030;
      g.fillStyle = rr() > 0.5 ? '#6a5a44' : '#fff6e2';
      g.fillRect(rr()*c.width, rr()*c.height, w, h);
    }
    for (var s = 0; s < 90; s++){
      g.globalAlpha = 0.020 + rr()*0.028;
      g.fillStyle = rr() > 0.4 ? '#8a7a60' : '#fffaf0';
      var sx = rr()*c.width, sy = rr()*c.height, sl = 12 + rr()*80;
      g.fillRect(sx, sy, rr() > 0.5 ? sl : 1, rr() > 0.5 ? 1 : sl);
    }
    /* Pinselzuege. Gouache wird in Bahnen aufgetragen, und man sieht,
       wo der Pinsel abgesetzt hat -- lange, sehr schwache waagerechte
       Streifen mit ungleichen Enden. Ohne sie bleibt eine gefuellte
       Flaeche eine gefuellte Flaeche. */
    for (var z = 0; z < 130; z++){
      var zy = rr()*c.height, zx = rr()*c.width;
      var zl = 40 + rr()*260, zh = 2 + rr()*7;
      g.globalAlpha = 0.014 + rr()*0.030;
      g.fillStyle = rr() > 0.5 ? '#7a6a4e' : '#fff8ea';
      g.fillRect(zx, zy, zl, zh);
      g.globalAlpha *= 0.6;
      g.fillRect(zx + zl*0.2, zy + zh, zl*0.5, 1);
    }
  } else {
    // Grobes Druckkorn fuer den Risostil: unregelmaessige Punkte
    for (var p = 0; p < 2600; p++){
      g.globalAlpha = 0.05 + rr()*0.10;
      g.fillStyle = rr() > 0.5 ? '#1a1a24' : '#fff2e0';
      var d = 1 + Math.round(rr()*2);
      g.fillRect(Math.round(rr()*c.width), Math.round(rr()*c.height), d, d);
    }
  }
  g.globalAlpha = 1;
  KORN_CACHE[id] = c;
  return c;
}

/* Wird am Ende von drawRoom() ueber das fertige Bild gelegt. */
function applyStilPost(){
  if (!STIL.post) return;
  var breit = Math.ceil(R.w / WELT_PIX), hoch = Math.ceil(VIEW_H / WELT_PIX);
  if (STIL.post === 'papier'){
    var c = getKornCanvas('papier', breit, hoch);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(c, 0, 0, c.width, c.height, 0, 0, breit * WELT_PIX, hoch * WELT_PIX);
    ctx.globalAlpha = 0.55;
    ctx.drawImage(c, 0, 0, c.width, c.height, -7, 5, breit * WELT_PIX, hoch * WELT_PIX);
    /* Ein warmer Hauch ueber allem: gemalte Bilder haben nie ein
       neutrales Weiss, weil das Papier keins ist. */
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#f0e2c4';
    ctx.fillRect(0, 0, R.w, VIEW_H);
    ctx.restore();
  } else if (STIL.post === 'tusche'){
    /* Versuch und Irrtum, festgehalten: das fertige Bild versetzt ueber
       sich selbst zu multiplizieren erzeugt zwar an jeder Hell-Dunkel-
       Grenze eine dunkle Kante, aber eben auch ein Doppelbild ueberall
       dort, wo eine Flaeche weich verlaeuft -- der Himmel zerfiel in
       Bloecke. Konturen fuer den Hintergrund lassen sich nicht
       nachtraeglich errechnen; sie muessen beim Zeichnen des Raums
       entstehen. Der Stil beschraenkt sich darum auf das, was ehrlich
       geht: harte Umrisse an Figuren und Moebeln, flache Farbe. */
  } else if (STIL.post === 'flach'){
    /* Tusche: die Mitteltoene werden zusammengezogen, damit die Farbe
       flach steht und die Linie die Arbeit macht. */
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, R.w, VIEW_H);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#fff4dc';
    ctx.fillRect(0, 0, R.w, VIEW_H);
    ctx.restore();
  } else if (STIL.post === 'duoton'){
    /* Zwei Druckfarben. Erst alle Farbe herausnehmen, dann die dunkle
       Farbe multiplizieren und die helle darueberlegen -- so entsteht
       ein Druck, der nur zwei Durchgaenge hatte. Die beiden Farben
       richten sich nach dem Farbstich des Kapitels, damit Deutschland
       kalt gedruckt ist und die Adria warm. */
    var g2 = GRADES[(R && R.grade) || 'adria'] || GRADES.adria;
    var dunkel = mixHex('#2e2a86', g2.col, 0.30);
    var hell   = mixHex('#fff2d8', g2.col, 0.20);
    ctx.save();
    // 1. Alle Farbe heraus -- ein Risodruck kennt nur seine eigenen.
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = 1; ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, R.w, VIEW_H);
    // 2. Das Papier: es hebt die Tiefen an, denn Papier ist nie schwarz.
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.46; ctx.fillStyle = hell;
    ctx.fillRect(0, 0, R.w, VIEW_H);
    // 3. Kontrast, damit zwei Farben ueberhaupt reichen.
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.85; ctx.fillStyle = '#909090';
    ctx.fillRect(0, 0, R.w, VIEW_H);
    // 4. Der Druckgang, leicht versetzt aufgetragen wie in echt.
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.9; ctx.fillStyle = dunkel;
    ctx.fillRect(-3, 2, R.w + 6, VIEW_H);
    ctx.restore();
    // Der Versatz des zweiten Durchgangs: ein Hauch danebengedruckt
    var k = getKornCanvas('grob', breit, hoch);
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.drawImage(k, 0, 0, k.width, k.height, 2, 0, breit * WELT_PIX, hoch * WELT_PIX);
    ctx.restore();
  }
}
