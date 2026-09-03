
/* ============================================================
   Sektion 35  ZWISCHENSEQUENZEN
   ------------------------------------------------------------
   Drei Brueche in diesem Leben sind zu gross fuer eine
   Kapitelkarte und zu gross, um sie zu spielen: die Abreise
   1970, der Kriegsbeginn 1991, die Fahrt am Ende.

   Jede Sequenz ist eine Folge von Einstellungen. Eine
   Einstellung ist eine Zeichenfunktion mit eigener Bewegung und
   einem Satz darunter -- kein Dialog, keine Interaktion, nur
   Kamera. Klicken geht weiter, Escape ueberspringt.
   ============================================================ */
function starteCine(shots, onDone){
  G.cine = { active:true, shots:shots, i:0, t:0, onDone:onDone };
  MUSIK.setModus('karte');
}
function cineWeiter(){
  var c = G.cine; if (!c) return;
  if (c.t < 0.45) return;
  c.i++; c.t = 0;
  if (c.i >= c.shots.length) cineEnde();
}
function cineEnde(){
  var c = G.cine; if (!c) return;
  var cb = c.onDone;
  G.cine = null;
  MUSIK.setModus(radioAn && R && R.id === 'terrasse' ? 'radio' : null);
  if (cb) cb();
}
function cineKeydown(e){
  if (!G.cine) return;
  if (e.key === 'Escape'){ cineEnde(); return; }
  cineWeiter();
}
function updateCine(dt){
  var c = G.cine;
  if (IN.tap){ IN.tap = null; cineWeiter(); return; }
  c.t += dt;
  var s = c.shots[c.i];
  if (s && c.t > (s.dauer || 6)) cineWeiter();
}
function drawCine(){
  var c = G.cine, s = c.shots[c.i], t = c.t;
  ctx.fillStyle = '#080706'; ctx.fillRect(0, 0, LW, LH);
  /* Das Bild laeuft durch denselben groben Puffer wie die Spielwelt --
     eine Zwischensequenz, die feiner aufgeloest waere als das Spiel,
     wuerde wie ein Fremdkoerper wirken. */
  /* Ueberblendung statt Schnitt auf Schwarz.

     Vorher blendete jede Einstellung auf Null aus und die naechste
     von Null wieder auf -- dazwischen lag ein schwarzes Loch, und
     das zerlegte den Vorspann in acht Einzelbilder. Jetzt liegt die
     abgehende Einstellung, eingefroren auf ihrem letzten Moment,
     unter der ankommenden, und die kommt darueber hoch. Aus acht
     Bildern wird eine Bewegung.

     Nur die letzte Einstellung blendet noch aus -- danach kommt
     wirklich nichts mehr. */
  var UEBER = 1.1;
  var letzte = (c.i === c.shots.length - 1);
  gepixelt(function(){
    if (c.i > 0 && t < UEBER){
      var vor = c.shots[c.i - 1];
      if (vor.draw){
        ctx.save();
        if (!vor.studio){ ctx.beginPath(); ctx.rect(0, 66, LW, LH - 132); ctx.clip(); }
        ctx.globalAlpha = 1;
        vor.draw((vor.dauer || 6) * 0.98);
        ctx.restore();
      }
    }
    ctx.save();
    var auf = (c.i > 0) ? Math.min(1, t / UEBER) : Math.min(1, t / 1.0);
    var ab  = letzte ? Math.min(1, Math.max(0, ((s.dauer || 6) - t) / 0.9)) : 1;
    if (!s.studio){
      ctx.beginPath(); ctx.rect(0, 66, LW, LH - 132); ctx.clip();
    }
    ctx.globalAlpha = auf * ab;
    if (s.draw) s.draw(t);
    ctx.restore();
  }, LH);
  if (!s.studio){
    ctx.fillStyle = '#080706';
    ctx.fillRect(0, 0, LW, 66); ctx.fillRect(0, LH - 66, LW, 66);
  }
  /* Eine Einstellung, die eine Kapitelkarte traegt, setzt Titel und
     Zitat in die Bildmitte -- dieselbe Karte wie frueher, nur als
     Teil des Intros statt als eigener Zustand davor. */
  if (s.karte){
    zeichneKartenText(s.karte.zeilen, s.karte.zitat, t,
                      Math.min(1, Math.max(0, ((s.dauer || 6) - t) / 0.9)));
  }
  /* Eine Einstellung, die den Titel traegt, setzt ihn gross in die
     Bildmitte statt einer Zeile unten in die Letterbox. */
  if (s.titel){
    var aus2 = Math.min(1, Math.max(0, ((s.dauer || 6) - t) / 0.9));
    var aM = Math.max(0, Math.min(1, (t - 0.9) / 1.5)) * aus2;
    var aP = Math.max(0, Math.min(1, (t - 2.7) / 0.5)) * aus2;
    /* Ein weicher Schatten unter dem Zeichen, damit es auf dem hellen
       Wasser steht und nicht darin verschwindet. */
    if (aM > 0){
      ctx.save();
      ctx.globalAlpha = aM * 0.45;
      titelZeichnen(LW/2 + 5, LH/2 - 26, 0.78, 1, aP > 0 ? 1 : 0, '#1c1408');
      ctx.restore();
      titelZeichnen(LW/2, LH/2 - 32, 0.78, aM, aP, '#f4e6be');
    }
    var ua = Math.max(0, Math.min(1, (t - 3.4) / 1.3)) * aus2;
    if (ua > 0){
      ctx.globalAlpha = ua;
      txt(ue('Erinnerungen zwischen den Zeiten'), LW/2, LH/2 + 74 - (1 - ua) * 5, 27, '#e2cfa4', 'center', 'italic ');
      ctx.globalAlpha = 1;
    }
  }
  // Text
  if (s.text && s.studio){
    /* Ein Wort, klein und gesperrt, unter dem Zeichen. Es kommt spaet
       und geht mit dem Rest. */
    var sa = Math.max(0, Math.min(1, (t - 2.5) / 1.0)) *
             Math.min(1, Math.max(0, ((s.dauer || 6) - t) / 0.9));
    if (sa > 0){
      ctx.globalAlpha = sa;
      txt(ue(s.text[0]).split('').join(' '), LW/2, LH/2 + 126, 21, '#bda884', 'center');
      ctx.globalAlpha = 1;
    }
  } else if (s.text){
    /* Die Schrift war mit 19 Punkten auf ein Fenster von 960 Punkten
       gerechnet. Auf einem Telefon schrumpft dasselbe Bild auf gut
       ein Drittel -- aus 19 werden zwoelf, und zwoelf Punkte Kursiv
       auf einem dunklen Bild liest niemand mehr.

       Statt einer festen Groesse wird die groesste genommen, die noch
       in die Zeile passt. Der laengste Satz des Vorspanns braucht bei
       26 Punkten knapp 900 Punkte Breite und geht damit gerade so
       auf; wo er nicht aufgeht, wird die Schrift kleiner statt den
       Satz umzubrechen. Ein Umbruch mitten in einer Bildunterschrift
       liest sich schlechter als zwei Punkt weniger. */
    var maxb = LW - 96, gr = 26;
    for (var m = 0; m < s.text.length; m++)
      gr = Math.min(gr, zeilenGroesse(ue(s.text[m]), maxb, 26));
    var zh = Math.round(gr * 1.32);
    for (var i = 0; i < s.text.length; i++){
      var a = Math.max(0, Math.min(1, (t - (0.8 + i * 0.9)) / 0.9));
      var aus = Math.min(1, Math.max(0, ((s.dauer || 6) - t) / 0.6));
      if (a <= 0) continue;
      ctx.globalAlpha = a * aus;
      /* Die Zeile kommt nicht nur auf, sie steigt dabei ein paar Pixel.
         Reines Aufblenden wirkt wie eingeschaltet, das hier wie gesetzt.
         Der Block haengt an der letzten Zeile: so bleibt der Abstand
         zu den Punkten unten gleich, egal ob zwei oder drei Zeilen. */
      txt(ue(s.text[i]), LW/2,
          LH - 44 - (s.text.length - 1 - i) * zh + (1 - a) * 6,
          gr, '#ddd0b0', 'center', 'italic ');
      ctx.globalAlpha = 1;
    }
  }
  /* Auf der Studiokarte steht nichts ausser dem Zeichen: kein
     Hinweis, keine Fortschrittspunkte. Sie ist kein Teil der
     Erzaehlung, sondern das, was davor kommt. */
  if (!s.studio){
    var pa = Math.max(0, Math.min(1, (t - 2.6) / 1.2)) * (0.35 + 0.35 * Math.sin(G.t * 2.2));
    ctx.globalAlpha = pa;
    txt(ue('weiter'), LW - 40, LH - 18, 17, '#8a7f68', 'right', 'italic ');
    ctx.globalAlpha = 1;
    for (var d = 0; d < c.shots.length; d++){
      ctx.globalAlpha = d === c.i ? 0.8 : 0.25;
      ctx.fillStyle = '#c9a06a';
      ctx.fillRect(psnap(LW/2 - c.shots.length*7 + d*14), LH - 16, 8, 3);
    }
    ctx.globalAlpha = 1;
  }
}

/* Die groesste Schriftgroesse bis wunsch, bei der die Zeile noch in
   maxb passt. Misst mit derselben Font wie txt() -- sonst stimmt das
   Ergebnis fuer jede Schrift ausser der gemessenen nicht. */
function zeilenGroesse(s, maxb, wunsch){
  for (var g = wunsch; g > 13; g--){
    ctx.font = "italic " + g + "px 'Courier New', Courier, monospace";
    if (ctx.measureText(s).width <= maxb) return g;
  }
  return 13;
}

/* Eine Gestalt von hinten. In den Zwischensequenzen sieht man nie ein
   Gesicht -- man sieht Leute, die etwas ansehen, und sieht dasselbe wie
   sie. Damit das funktioniert, muss die Silhouette als Mensch lesen und
   nicht als Pfosten: Schultern, Hals, Kopf, ein Arm. */
function silhouette(x, y, h, col, arm){
  var b = h * 0.20;                      // Schulterbreite
  ctx.fillStyle = col;
  // Beine, zwei getrennte -- daran erkennt das Auge einen Menschen
  ctx.fillRect(psnap(x - b*0.42), psnap(y - h*0.44), psnap(b*0.34), psnap(h*0.44));
  ctx.fillRect(psnap(x + b*0.08), psnap(y - h*0.44), psnap(b*0.34), psnap(h*0.44));
  // Rumpf, nach oben etwas breiter
  ctx.fillRect(psnap(x - b*0.46), psnap(y - h*0.80), psnap(b*0.92), psnap(h*0.38));
  ctx.fillRect(psnap(x - b*0.56), psnap(y - h*0.80), psnap(b*1.12), psnap(h*0.12));
  // Hals und Kopf
  ctx.fillRect(psnap(x - b*0.16), psnap(y - h*0.86), psnap(b*0.32), psnap(h*0.06));
  ctx.fillRect(psnap(x - b*0.34), psnap(y - h*1.00), psnap(b*0.68), psnap(h*0.15));
  if (arm){
    ctx.fillRect(psnap(x + b*(arm > 0 ? 0.46 : -0.66)), psnap(y - h*0.76), psnap(b*0.2), psnap(h*0.34));
  }
  ctx.globalAlpha = 0.22;
  ell(x, y + 2, b*0.9, h*0.035, col, 0);
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------
   BRUCH 1 · Die Abreise, 1970
   ------------------------------------------------------------ */
function shotBahnhof(t){
  bandV(0, 0, LW, 300, [[0,'#3a3f48'],[0.6,'#4e535c'],[1,'#5f6470']], 6);
  // Bahnsteighalle: Traeger und Oberlicht
  for (var i = 0; i < 7; i++){
    pRect(i*150 + 20, 70, 14, 300, '#2e333a');
    line(i*150 + 27, 96, i*150 + 120, 140, 3, '#3a4048');
    line(i*150 + 120, 96, i*150 + 27, 140, 3, '#3a4048');
  }
  pRect(0, 60, LW, 16, '#262b31');
  ctx.globalAlpha = 0.22;
  for (var g = 0; g < 6; g++) pRect(g*160 + 40, 76, 100, 8, '#cfe0ea');
  ctx.globalAlpha = 1;
  // Der Zug, von der Seite, mit Dampf
  bandV(0, 300, LW, 90, [[0,'#4a4f56'],[1,'#33383e']], 4);
  var zx = -40 - Math.min(1, t / 7) * 60;
  ctx.save(); ctx.translate(zx, 0);
  for (var w = 0; w < 7; w++){
    var wx = 60 + w*160;
    pOutlineRect(wx, 190, 150, 116, '#6a3a30', '#161213');
    pRect(wx + 6, 196, 138, 10, '#8a4a3c');
    for (var f = 0; f < 3; f++){
      pOutlineRect(wx + 16 + f*44, 212, 34, 44, '#2a3038', '#161213');
      ctx.globalAlpha = 0.30; pRect(wx + 19 + f*44, 215, 14, 38, '#b8d0dc'); ctx.globalAlpha = 1;
    }
    pRect(wx, 288, 150, 18, '#4a2a22');
    ell(wx + 34, 314, 15, 15, '#1c1a18', 2.4);
    ell(wx + 114, 314, 15, 15, '#1c1a18', 2.4);
  }
  ctx.restore();
  // Bahnsteig
  bandV(0, 326, LW, 144, [[0,'#8a8578'],[0.5,'#787366'],[1,'#645f55']], 5);
  pRect(0, 326, LW, 5, '#a29c8c');
  ctx.globalAlpha = 0.5;
  for (var k = 0; k < 40; k++) pRect(k*26, 342 + (k%3)*30, 16, 4, '#5a564c');
  ctx.globalAlpha = 1;
  /* Zwei Leute und ein Koffer. Sie stehen nicht beieinander, und der
     Abstand waechst, solange die Einstellung laeuft -- das ist der
     ganze Inhalt dieses Bildes. */
  var abstand = 30 + Math.min(1, t / 6) * 96;
  silhouette(LW/2 - abstand, 452, 178, '#241f18', -1);
  silhouette(LW/2 + abstand, 452, 172, '#2e2a22', 0);
  pOutlineRect(LW/2 - abstand + 20, 414, 46, 34, '#5a4230', '#161213');
  pRect(LW/2 - abstand + 20, 428, 46, 5, '#3a2c1e');
  pRect(LW/2 - abstand + 38, 406, 12, 9, '#3a2c1e');
  // Dampf zieht durch das Bild
  ctx.globalAlpha = 0.10;
  for (var d = 0; d < 26; d++){
    var dx = ((d*83 + t*64) % (LW + 300)) - 150;
    var dy = 250 + Math.sin(d*1.7 + t) * 46;
    ctx.fillStyle = '#e8eef0';
    ctx.fillRect(psnap(dx), psnap(dy), psnap(26 + (d%5)*16), psnap(8 + (d%3)*6));
  }
  ctx.globalAlpha = 1;
  pixelGlow(LW/2, 130, 340, 200, '#dfe6ea', 0.12, 4);
}
function shotGrenze(t){
  bandV(0, 0, LW, 260, [[0,'#1e2634'],[0.6,'#39435a'],[1,'#6a6a70']], 6);
  // Nachtlandschaft, die vorbeizieht
  var v = t * 90;
  for (var l = 0; l < 3; l++){
    var hoehe = 60 + l*40, y = 250 + l*30;
    ctx.globalAlpha = 0.4 + l*0.2;
    for (var h = 0; h < 14; h++){
      var hx = ((h*140 - v*(0.4 + l*0.35)) % (LW + 280)) - 140;
      poly([hx, y, hx+70, y-hoehe*0.6, hx+140, y], l === 2 ? '#1a1e22' : '#232a33', 0);
    }
    ctx.globalAlpha = 1;
  }
  bandV(0, 330, LW, 140, [[0,'#1a1e24'],[1,'#0e1114']], 4);
  // Das Abteilfenster als Rahmen um alles
  ctx.fillStyle = '#0c0e12';
  ctx.fillRect(0, 0, 90, LH); ctx.fillRect(LW - 90, 0, 90, LH);
  ctx.fillRect(0, 0, LW, 74); ctx.fillRect(0, LH - 96, LW, 96);
  pOutlineRect(84, 68, LW - 168, LH - 158, 'rgba(0,0,0,0)', '#2a2e36');
  // Spiegelung: ein Gesicht in der Scheibe, kaum sichtbar
  ctx.globalAlpha = 0.16;
  pOutlineRect(560, 190, 90, 106, '#c9946a', '#3a2a1e');
  pRect(566, 196, 78, 30, '#2e2118');
  pRect(580, 236, 18, 12, '#efe7da'); pRect(612, 236, 18, 12, '#efe7da');
  ctx.globalAlpha = 1;
  // Ein Grenzlicht zieht vorbei
  var gx = ((t * 150) % (LW + 400)) - 200;
  pixelGlow(gx, 300, 120, 90, '#ffca6a', 0.4, 4);
}
function shotWohnheim(t){
  bandV(0, 0, LW, LH, [[0,'#2a2c30'],[0.5,'#33363c'],[1,'#212327']], 5);
  // Ein Flur mit vielen gleichen Tueren
  var flucht = LW/2;
  for (var i = 6; i >= 0; i--){
    var f = i / 6;
    var w = 40 + f * 300, h = 120 + f * 300;
    var x0 = flucht - w, x1 = flucht + w;
    ctx.fillStyle = mixHex('#3f434a', '#191b1e', f * 0.7);
    ctx.fillRect(psnap(x0), psnap(235 - h/2), psnap(x1 - x0), psnap(h));
    // Tuerenpaar in dieser Tiefe
    var tw = 20 + f * 70, th = 50 + f * 150;
    ctx.fillStyle = mixHex('#5a4a3a', '#20211f', f * 0.55);
    ctx.fillRect(psnap(x0 + 6), psnap(235 + h/2 - th), psnap(tw), psnap(th));
    ctx.fillRect(psnap(x1 - 6 - tw), psnap(235 + h/2 - th), psnap(tw), psnap(th));
  }
  // Neonroehre in der Mitte, sie flackert
  var fl = (Math.sin(t * 21) > -0.7) ? 1 : 0.35;
  ctx.globalAlpha = 0.85 * fl;
  pRect(flucht - 70, 96, 140, 8, '#e8f0f4');
  ctx.globalAlpha = 1;
  pixelGlow(flucht, 130, 260 * fl, 200 * fl, '#cfe0ea', 0.18, 4);
  /* Ein Koffer vor einer Tuer. Mehr ist von diesem Jahr nicht
     uebriggeblieben. */
  var ky = 380;
  pOutlineRect(flucht - 34, ky, 68, 48, '#5a4230', '#161213');
  pRect(flucht - 34, ky + 20, 68, 6, '#3a2c1e');
  pRect(flucht - 8, ky - 8, 16, 10, '#3a2c1e');
  ctx.globalAlpha = 0.3;
  ell(flucht, ky + 52, 60, 10, '#101214', 0);
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------
   BRUCH 2 · Der Krieg, 1991
   ------------------------------------------------------------ */
function shotFernseher(t){
  ctx.fillStyle = '#0c0e12'; ctx.fillRect(0, 0, LW, LH);
  // Ein einzelner Apparat, gross, in einem dunklen Zimmer
  ctx.save(); ctx.translate(LW/2, 250);
  pOutlineRect(-230, -160, 460, 320, '#4a423a', '#131113');
  pRect(-216, -146, 432, 292, '#1a1c20');
  var fl = 0.75 + 0.25 * Math.abs(Math.sin(t * 9));
  ctx.globalAlpha = fl;
  bandV(-206, -136, 412, 272, [[0,'#3f5a72'],[0.5,'#5a7286'],[1,'#33465a']], 6);
  ctx.globalAlpha = 1;
  /* Auf dem Schirm: eine Landkarte, aus der Stueck fuer Stueck
     Flaechen herausbrechen. Kein Gesicht, keine Rede -- die Karte
     allein sagt es. */
  var teile = [[-80,-90,70,60],[-6,-96,80,54],[-110,-24,66,64],[-30,-30,74,70],
               [48,-38,72,64],[-70,44,80,54],[16,38,76,58]];
  for (var i = 0; i < teile.length; i++){
    var weg = Math.max(0, Math.min(1, (t - 1.0 - i * 0.55) / 0.8));
    ctx.globalAlpha = 1 - weg * 0.92;
    var dx = teile[i][0] + weg * (teile[i][0] * 0.5), dy = teile[i][1] + weg * 40;
    ctx.fillStyle = mixHex('#8a9a6a', '#5a3a2e', i / teile.length);
    ctx.fillRect(psnap(dx), psnap(dy), psnap(teile[i][2]), psnap(teile[i][3]));
    ctx.globalAlpha = (1 - weg) * 0.5;
    ctx.fillStyle = '#e8e4d4';
    ctx.fillRect(psnap(dx), psnap(dy), psnap(teile[i][2]), 2);
  }
  ctx.globalAlpha = 1;
  // Laufschrift unten, nur als Balken
  pRect(-206, 108, 412, 26, '#8a1e18');
  ctx.globalAlpha = 0.85;
  for (var b = 0; b < 9; b++){
    var bx = -196 + ((b*70 + t*40) % 400);
    pRect(bx, 116, 40, 8, '#efe4d0');
  }
  ctx.globalAlpha = 1;
  // Zwei Knoepfe und ein Aufkleber
  ell(196, 120, 10, 10, '#8a8278', 2);
  pRect(-206, 150, 60, 8, '#6a6258');
  ctx.restore();
  pixelGlow(LW/2, 250, 420, 320, '#7fa0c4', 0.20, 5);
}
function shotHoerer(t){
  bandV(0, 0, LW, LH, [[0,'#171b26'],[0.55,'#22283a'],[1,'#101420']], 6);
  // Nur eine Hand und ein Hoerer, sehr gross
  ctx.save(); ctx.translate(LW/2, 300);
  var zittern = Math.sin(t * 2.6) * 1.6;
  pSegOutlined(-30 + zittern, 180, -10 + zittern, 30, 46, '#c9946a');
  pOutlineRect(-46 + zittern, -30, 92, 70, '#c9946a', SPRITE_INK);
  // Der Hoerer
  ctx.save(); ctx.translate(zittern, 0); ctx.rotate(-0.22);
  pOutlineRect(-24, -128, 48, 150, '#22262c', '#0e1014');
  pOutlineRect(-40, -150, 80, 34, '#2a2f36', '#0e1014');
  pOutlineRect(-40, 4, 80, 34, '#2a2f36', '#0e1014');
  pRect(-28, -142, 56, 18, '#14171b');
  pRect(-28, 12, 56, 18, '#14171b');
  ctx.restore();
  ctx.restore();
  /* Das Freizeichen als Ringe, die nach aussen laufen und nichts
     erreichen. Sie hoeren jedes Mal an derselben Stelle auf. */
  for (var i = 0; i < 4; i++){
    var ph = (t * 0.55 + i * 0.25) % 1;
    ctx.globalAlpha = (1 - ph) * 0.30;
    ctx.strokeStyle = '#8fb0c8'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(LW/2, 160, 30 + ph * 200, -0.9, 0.9);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  pixelGlow(LW/2, 200, 300, 240, '#5f7f9a', 0.14, 4);
}

/* ------------------------------------------------------------
   BRUCH 3 · Die Fahrt, 2018
   ------------------------------------------------------------ */
function shotKueste(t){
  bandV(0, 0, LW, 200, [[0,'#e8a862'],[0.5,'#f0cc94'],[1,'#e4e2ca']], 7);
  bandV(0, 190, LW, 130, [[0,'#3f7590'],[0.6,'#2f5c76'],[1,'#274c62']], 6);
  ctx.globalAlpha = 0.45;
  poly([0,196, 240,176, 520,190, 780,170, LW,186, LW,206, 0,206], '#7f8288', 0);
  ctx.globalAlpha = 1;
  for (var g = 0; g < 30; g++){
    var gy = 200 + g*4;
    var gw = 24 + Math.abs(Math.sin(t*0.8 + g*0.35)) * 76;
    ctx.globalAlpha = 0.14 + Math.abs(Math.sin(t*0.6 + g))*0.16;
    ctx.fillStyle = '#ffd8a0';
    ctx.fillRect(psnap(700 - gw/2), psnap(gy), psnap(gw), 3);
  }
  ctx.globalAlpha = 1;
  // Der Hang und die Strasse, die sich hindurchzieht
  poly([0,470, 0,330, 280,308, 600,332, 900,306, LW,326, LW,470], '#5f6648', 0);
  var v = t * 130;
  for (var z = 0; z < 6; z++){
    var zx = ((z*220 - v*0.5) % (LW + 440)) - 220;
    zypresse(zx, 350 + (z%2)*10, 84 + (z%3)*22, '#2e4632');
  }
  var ry = 400;
  ctx.fillStyle = '#8f8778';
  for (var d = 0; d < LW; d += 6) ctx.fillRect(d, psnap(ry + Math.sin(d*0.008)*12), 6, 40);
  ctx.fillStyle = '#d8d0b4';
  for (var m = 0; m < 44; m++){
    var mx = ((m*40 - v) % (LW + 80)) - 40;
    ctx.fillRect(psnap(mx), psnap(ry + 18 + Math.sin(mx*0.008)*12), 18, 3);
  }
  // Leitplanke
  for (var lp = 0; lp < 20; lp++){
    var lx = ((lp*60 - v*1.1) % (LW + 120)) - 60;
    pRect(lx, 372, 6, 22, '#8a8a82');
  }
  pRect(0, 366, LW, 6, '#b0b0a6');
  pixelGlow(760, 130, 320, 220, '#ffd28a', 0.20, 5);
}
function shotLandesinneres(t){
  bandV(0, 0, LW, 250, [[0,'#a8b6b4'],[0.6,'#c8ccbc'],[1,'#ddd6c0']], 6);
  // Karst, kahl, und immer derselbe Hang
  ctx.globalAlpha = 0.5;
  poly([0,262, 240,196, 500,246, 760,192, LW,238, LW,320, 0,320], '#8a9484', 0);
  ctx.globalAlpha = 1;
  poly([0,320, 300,280, 640,316, 960,278, LW,304, LW,470, 0,470], '#77836a', 0);
  var rr = seeded(1953);
  for (var i = 0; i < 60; i++){
    ctx.globalAlpha = 0.3 + rr()*0.3;
    ctx.fillStyle = '#ded6c2';
    ctx.fillRect(psnap(rr()*LW), psnap(300 + rr()*160), psnap(8 + rr()*22), psnap(4 + rr()*6));
  }
  ctx.globalAlpha = 1;
  // Trockenmauern, die niemand mehr repariert
  trockenmauer(0, 356, LW, 20, 91, '#cfc4a8', '#8a8070');
  trockenmauer(0, 414, LW, 16, 93, '#c8bda2', '#847a6a');
  // Ein Schild am Strassenrand, ohne dass man lesen muesste, was draufsteht
  var sx = LW - 60 - Math.min(1, t/6) * 300;
  pRect(sx, 300, 7, 96, '#8a8a82');
  pOutlineRect(sx - 60, 262, 130, 40, '#3a5a8a', '#161a20');
  ctx.globalAlpha = 0.9;
  pRect(sx - 48, 276, 82, 8, '#e8ecf0');
  ctx.globalAlpha = 1;
  pixelGlow(240, 120, 300, 200, '#fff0d0', 0.14, 4);
}
/* ------------------------------------------------------------
   Der Hof, noch einmal. Und diesmal stimmt er nicht mit dem
   ueberein, was gespielt wurde.
   ------------------------------------------------------------
   Die Erinnerungsunschaerfe korrigiert im ganzen Spiel nach
   unten: das Haus war kleiner, wir waren aermer, der Held war
   unfreundlicher, ich war nicht so tapfer. Das ist trocken und
   es stimmt, aber als Mechanik ist es nach dem dritten Mal
   berechenbar.

   Genau eine Korrektur geht in die andere Richtung, und sie
   kommt hier, ganz am Ende. In Kapitel 1 steht der Vater am
   rechten Bildrand und sieht zu, wie der Junge es falsch macht.
   Auf der Fahrt nach Rosko Polje kommt das Bild wieder -- und
   er steht daneben, die Hand am Rad.

   Das ist der Satz, den das Konzept unter "Ziel des Spiels"
   verspricht, und bis hierher stand er nirgends im Spiel: dass
   man ein Leben lang eine Fassung mit sich traegt, die
   schlechter ist als das, was war.
   ------------------------------------------------------------ */
function shotVater(t){
  bandV(0, 0, LW, 250, [[0,'#e8b878'],[0.5,'#f0d0a0'],[1,'#e6dcc0']], 6);
  ctx.globalAlpha = 0.42;
  poly([0,258, 240,206, 520,250, 800,198, LW,242, LW,320, 0,320], '#8f9a86', 0);
  ctx.globalAlpha = 1;
  poly([0,320, 320,286, 660,318, LW,290, LW,470, 0,470], '#7d8464', 0);
  bandV(0, 344, LW, 126, [[0,'#c4b89c'],[0.5,'#b2a68a'],[1,'#9c9074']], 6);
  var rr = seeded(1953);
  for (var i = 0; i < 50; i++){
    ctx.globalAlpha = 0.22 + rr()*0.22;
    ctx.fillStyle = rr() > 0.5 ? '#e0d8c2' : '#7a7058';
    ctx.fillRect(psnap(rr()*LW), psnap(352 + rr()*112), psnap(8+rr()*22), psnap(3+rr()*4));
  }
  ctx.globalAlpha = 1;
  // Das Haus, in der Groesse, auf die es sich korrigiert hat
  trockenmauer(96, 250, 190, 118, 31, '#d0c5aa', '#8a8068');
  poly([84, 252, 298, 252, 266, 210, 116, 210], '#9a9488', 2.6);
  pOutlineRect(160, 292, 44, 76, '#4a3a28', '#1a140e');
  pRect(240, 200, 16, 20, '#8a8068');
  // Der Karren
  ctx.save(); ctx.translate(560, 424);
  poly([-84, -54, 82, -54, 92, -30, -94, -30], '#7a6448', 2.8);
  for (var pl = 0; pl < 7; pl++) pRect(-80 + pl*24, -52, 18, 22, mixHex('#7a6448', pl%2?'#a08a68':'#5a4a34', 0.5));
  line(-92, -40, -168, -22, 7, '#6a5540');
  ell(56, -14, 30, 30, '#6a5540', 3.4);
  for (var sp = 0; sp < 8; sp++){ var a2 = sp*0.785; line(56, -14, 56+Math.cos(a2)*27, -14+Math.sin(a2)*27, 2.6, '#5a4a34'); }
  ell(-58, -12, 30, 30, '#6a5540', 3.4);
  for (var s2 = 0; s2 < 8; s2++){ var a3 = s2*0.785; line(-58, -12, -58+Math.cos(a3)*27, -12+Math.sin(a3)*27, 2.6, '#5a4a34'); }
  ctx.restore();
  /* Der Junge am Rad. Und der Vater -- nicht am Bildrand, wo er
     die ganze Erinnerung ueber gestanden hat, sondern daneben.
     Er kommt langsam ins Bild, waehrend die Einstellung laeuft. */
  silhouette(462, 452, 104, '#3a3026', 1);
  var naeher = Math.min(1, Math.max(0, (t - 1.6) / 3.4));
  var vx = 812 - naeher * 244;
  ctx.globalAlpha = 0.35 + naeher * 0.65;
  silhouette(vx, 452, 176, '#33291f', -1);
  ctx.globalAlpha = 1;
  // Seine Hand liegt am Rad, sobald er da ist
  if (naeher > 0.94){
    ctx.fillStyle = '#33291f';
    ctx.fillRect(psnap(528), psnap(404), psnap(26), psnap(7));
  }
  pixelGlow(140, 120, 300, 220, '#ffe8b8', 0.18, 4);
}

function shotGrab(t){
  bandV(0, 0, LW, 240, [[0,'#c88a52'],[0.5,'#e0b078'],[1,'#ddd0b0']], 7);
  ctx.globalAlpha = 0.45;
  poly([0,250, 260,206, 540,244, 820,200, LW,236, LW,300, 0,300], '#7f7d68', 0);
  ctx.globalAlpha = 1;
  poly([0,300, 320,272, 660,300, LW,278, LW,470, 0,470], '#5f6448', 0);
  // Eine Zypresse, eine Mauer, zwei Steine
  zypresse(760, 380, 150, '#28402c');
  zypresse(824, 386, 116, '#2e4632');
  trockenmauer(0, 352, LW, 34, 97, '#d8cdb4', '#968c78');
  ctx.save(); ctx.translate(LW/2 - 120, 434);
  for (var g = 0; g < 2; g++){
    var gx = g * 96;
    pOutlineRect(gx - 34, -92, 68, 92, '#c2bba8', '#3a3630');
    poly([gx - 34, -92, gx + 34, -92, gx + 22, -110, gx - 22, -110], '#b0a897', 2);
    ctx.globalAlpha = 0.5;
    pRect(gx - 22, -74, 44, 4, '#6a6458');
    pRect(gx - 18, -62, 36, 3, '#6a6458');
    pRect(gx - 14, -50, 28, 3, '#6a6458');
    ctx.globalAlpha = 1;
    // Ein Glas mit einer Kerze davor
    pOutlineRect(gx - 9, -18, 18, 18, 'rgba(220,235,240,0.45)', '#7a8288');
    ctx.globalAlpha = 0.6 + 0.4*Math.abs(Math.sin(t*3 + g));
    pRect(gx - 3, -14, 6, 9, '#ffc86a');
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  /* Ein grosser und ein kleiner, von hinten, vor den Steinen.
     Sie stehen nebeneinander. Das ist das ganze Bild. */
  silhouette(LW/2 + 132, 456, 186, '#33291f', 1);
  silhouette(LW/2 + 186, 456, 116, '#2a3a4a', 0);
  pixelGlow(180, 150, 320, 240, '#ffb870', 0.22, 5);
}

var CINES = {
  abreise: [
    { dauer:8.0, draw:shotBahnhof, text:['Sarajevo, Hauptbahnhof, 14. März 1970.',
                                         'Der Vertrag galt für zwei Jahre.'] },
    { dauer:7.0, draw:shotGrenze,  text:['Jesenice. Villach. München.',
                                         'Ich habe die ganze Nacht aus dem Fenster gesehen und nichts erkannt.'] },
    { dauer:7.5, draw:shotWohnheim, text:['Wohnheim, Zimmer 214. Vier Betten, vier Länder.',
                                          'Aus zwei Jahren wurden sechsunddreißig.'] }
  ],
  krieg: [
    { dauer:8.5, draw:shotFernseher, text:['Es fing damit an, dass die Karte im Fernsehen andere Farben bekam.',
                                           'Dann bekam sie Linien. Dann Lücken.'] },
    { dauer:7.5, draw:shotHoerer,    text:['Vier Wochen lang kam nur das Freizeichen.',
                                           'Man legt nicht auf, solange es tutet. Das ist das Schlimmste daran.'] }
  ],
  fahrt: [
    { dauer:7.5, draw:shotKueste, text:['Von Podaca nach Rosko Polje sind es hundertsechzig Kilometer.',
                                        'Die ersten vierzig fährt man am Meer entlang.'] },
    { dauer:7.0, draw:shotLandesinneres, text:['Dann biegt man ab, und das Meer ist weg.',
                                               'Danach wird alles Stein, und der Stein kennt einen noch.'] },
    { dauer:9.5, draw:shotVater, text:['Der Hof ist noch da. Kleiner, als ich ihn im Kopf hatte.',
                                       'Und mein Vater stand nicht am Rand und sah zu.',
                                       'Er stand daneben. Die ganze Zeit.'] },
    { dauer:9.0, draw:shotGrab, text:['Sie liegen nebeneinander, unter derselben Zypresse.',
                                      'Ich habe ihm gezeigt, welcher Stein wer ist. Mehr habe ich nicht gesagt.'] }
  ]
};
