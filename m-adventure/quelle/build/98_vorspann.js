
/* ============================================================
   Sektion 36  DER VORSPANN
   ------------------------------------------------------------
   Ein Vorspann hat drei Aufgaben und nur drei: den Ort zeigen,
   den Mann zeigen, und die Frage stellen, die das Spiel traegt.
   Erklaeren darf er nichts.

   Sieben Einstellungen, jede mit einer Kamerabewegung und
   hoechstens zwei Saetzen. Die Reihenfolge geht von aussen nach
   innen -- Kueste, Haus, Mann, Haende -- und kippt dann in das,
   was nicht gezeigt wird: eine zugenagelte Kiste im Dunkeln.
   Erst danach kommt der Titel, und erst danach faengt das Spiel
   an. Klicken geht weiter, Escape ueberspringt alles.
   ============================================================ */

/* 1 · Die Kueste. Dieselbe Komposition wie das Titelbild des
   Menues: viel Berg, viel Wasser, wenig Land. Die Kamera wandert
   dabei langsam nach rechts. */
/* ============================================================
   BEWEGTE KLEINIGKEITEN
   ------------------------------------------------------------
   Der Vorspann bestand aus Bildern, durch die eine Kamera fuhr.
   Das liest sich als Diaschau: was sich bewegt, ist der Rahmen,
   nicht die Welt. Die Stuecke hier bewegen sich selbst -- ein
   Vogel, der durchzieht, Waesche im Wind, Rauch aus einem Kamin,
   ein Boot, das nicht ankommt.

   Keines davon traegt Handlung. Sie sagen nur, dass dieser Ort
   weiterlaeuft, waehrend jemand davon erzaehlt -- und genau das
   fehlte: die Bilder sahen aus wie angehalten.
   ============================================================ */

/* Eine Moewe, klein und weit weg. Der Fluegelschlag ist keine
   Sinuskurve -- eine Moewe schlaegt kurz und segelt lang. Die
   dritte Potenz drueckt den Ausschlag nach unten und laesst nur
   die Spitzen stehen. Mit reinem Sinus flattert sie wie ein
   Falter. */
function moewe(x, y, s, t, ph){
  var f = Math.pow(Math.abs(Math.sin(t * 2.4 + ph)), 3);
  var yy = y + Math.sin(t * 0.7 + ph) * 4 * s;
  var sp = 11 * s, hoch = (1.5 + f * 7.5) * s;
  ctx.globalAlpha = 0.85;
  poly([x - sp, yy - hoch, x - sp*0.42, yy - hoch*0.12, x, yy + 1.6*s,
        x + sp*0.42, yy - hoch*0.12, x + sp, yy - hoch,
        x + sp*0.48, yy - hoch*0.5, x, yy - 1.4*s, x - sp*0.48, yy - hoch*0.5],
       '#eae6da', 0);
  ctx.globalAlpha = 1;
}

/* Ein paar davon, versetzt, quer durchs Bild. Sie laufen ueber den
   Rand hinaus, damit keine im Bild aufploppt. */
function moewenzug(t, anzahl, hoehe, tempo, streu){
  for (var i = 0; i < anzahl; i++){
    var lauf = ((t * tempo + i * 0.41 + streu * 0.17) % 1.4) - 0.2;
    var x = -70 + lauf * (LW + 140);
    if (x < -50 || x > LW + 50) continue;
    moewe(x, hoehe + (i % 4) * 24, 0.66 + (i % 3) * 0.3, t, i * 2.1 + streu);
  }
}

/* Wellenkaemme auf einem flachen Wasserband. Sie wandern langsam,
   und je weiter unten, desto schneller -- das ist der billigste
   Weg zu Tiefe, den es gibt. */
function wellen(x, y, w, h, t, dichte, farbe){
  for (var i = 0; i < dichte; i++){
    var f = i / dichte;
    var wx = ((i * 137 + t * (9 + f * 30)) % (w + 130)) - 65 + x;
    ctx.globalAlpha = 0.16 + f * 0.16;
    ctx.fillStyle = farbe || '#cfe0e4';
    ctx.fillRect(psnap(wx), psnap(y + f * h), psnap(9 + (i % 5) * 10), 2);
  }
  ctx.globalAlpha = 1;
}

/* Rauch. Steigt, wird breiter, wird durchsichtig und faengt von
   vorne an. Das Einblenden unten ist wichtig: sonst erscheint alle
   paar Sekunden eine fertige Wolke aus dem Nichts. */
function rauch(x, y, t, hoehe, deckung){
  for (var i = 0; i < 9; i++){
    var pz = ((t * 0.2 + i / 9) % 1);
    ctx.globalAlpha = (deckung || 0.22) * (1 - pz) * Math.min(1, pz / 0.14);
    ell(x + Math.sin(pz * 4.2 + i) * (5 + pz * 17), y - pz * hoehe,
        3 + pz * 11, (3 + pz * 11) * 0.78, '#cfc8bc', 0);
  }
  ctx.globalAlpha = 1;
}

/* Ein Segelboot, weit draussen. Es wiegt und kommt nirgends an. */
function boot(x, y, s, t){
  ctx.save();
  ctx.translate(psnap(x), psnap(y + Math.sin(t * 0.9) * 1.6));
  ctx.rotate(Math.sin(t * 1.1) * 0.04); ctx.scale(s, s);
  poly([-21, 0, 21, 0, 15, 8, -15, 8], '#e4dccc', 1.6);
  pRect(-2, -19, 2, 19, '#8a8272');
  poly([0, -19, 11, -4, 0, -4], '#f2eee2', 0);
  ctx.restore();
}

/* Ein Waeschestueck an der Leine. Ein blosses Rechteck liest sich
   als Plakat an der Wand -- erst Klammer, Kragen und Aermel machen
   daraus etwas, das haengt. Der Wind kommt in zwei Frequenzen: eine
   lange Boe und ein kurzes Zittern darauf. Mit nur einer sieht es
   aus wie ein Metronom. */
function waescheStueck(cx, cy, art, br, ho, farbe, t, ph){
  var weh = Math.sin(t * 1.5 + ph) * 0.13 + Math.sin(t * 4.1 + ph) * 0.035;
  ctx.save(); ctx.translate(psnap(cx), psnap(cy)); ctx.rotate(weh);
  pRect(-2, -5, 4, 6, '#3a3228');                       // Klammer
  pRect(-br/2, 0, br, ho, farbe);
  if (art === 'hemd'){                                   // Aermel und Kragen
    pRect(-br/2 - 6, 3, 7, Math.round(ho * 0.46), farbe);
    pRect(br/2 - 1, 3, 7, Math.round(ho * 0.46), farbe);
    pRect(-4, 0, 8, 4, mixHex(farbe, '#000000', 0.22));
  }
  pRect(-br/2, 0, br, 3, mixHex(farbe, '#ffffff', 0.30));
  pRect(-br/2, ho - 3, br, 3, mixHex(farbe, '#000000', 0.18));
  ctx.restore();
}

/* Die Leine haengt ueber der Mauer, auf der Meerseite -- dort haengt
   sie an dieser Kueste auch. Vor der Mauer sah sie aus wie etwas,
   das jemand an den Stein geklebt hat: Stein darueber, Stein
   darunter, und nichts, woran sie haengen koennte. Gegen den Himmel
   ist sofort klar, was es ist.

   Die Leine selbst wird aus Rechtecken gesetzt, nicht gestrichen:
   ein Strich von 1,4 Punkten verschwindet im halbierten Bildraster. */
function waescheleine(x, y, w, t){
  var hang = 12;
  for (var i = 0; i <= w; i += 3){
    var f = i / w;
    pRect(x + i, y + Math.sin(f * Math.PI) * hang, 3, 2, '#6f6656');
  }
  var st = [['hemd', 29, 39, '#e2dcc8'], ['tuch', 21, 33, '#5f7f92'],
            ['hemd', 26, 36, '#c9a86a']];
  for (var k = 0; k < st.length; k++){
    var ff = (k + 1) / (st.length + 1);
    waescheStueck(x + w * ff, y + Math.sin(ff * Math.PI) * hang + 1,
                  st[k][0], st[k][1], st[k][2], st[k][3], t, k * 0.9);
  }
}

function vsKueste(t){
  var fahrt = Math.min(1, t / 8) * 70;
  ctx.save(); ctx.translate(-fahrt, 0);
  bandV(-40, 60, LW+120, 200, [[0,'#f0a85e'],[0.45,'#f6cc92'],[1,'#eee0c4']], 7);
  bandV(-40, 244, LW+120, 226, [[0,'#33697f'],[0.5,'#2b5c74'],[1,'#245066']], 6);
  ctx.globalAlpha = 0.34;
  poly([260,244, 560,238, 780,233, 940,238, LW+80,234, LW+80,250, 260,250], '#8a97a2', 0);
  ctx.globalAlpha = 1;
  /* Die Sonnenstrasse. Sie gehoert unter die Sonne und hoert kurz
     danach auf -- vorher lief sie ueber die ganze Bildhoehe hinunter
     und stapelte sich zu einer Saeule, die mit Wasser nichts zu tun
     hatte. Nach hinten wird sie schmaler, weil dort weniger Meer
     zwischen den Wellen liegt. */
  for (var g = 0; g < 16; g++){
    var tief = g / 15;
    var gy = 252 + g * 6;
    var gw = (16 + tief * 62) * (0.55 + Math.abs(Math.sin(t*0.9 + g*0.55)) * 0.75);
    ctx.globalAlpha = (0.30 - tief * 0.16) + Math.abs(Math.sin(t*0.7 + g)) * 0.14;
    ctx.fillStyle = '#ffd8a0';
    ctx.fillRect(psnap(898 - gw/2), psnap(gy), psnap(gw), 3);
  }
  ctx.globalAlpha = 1;
  biokovo(-160, 620, 366, 336, 0.30, 0.92);
  poly([-40,470, -40,352, 300,338, 560,318, 700,300, 760,306, 700,470], '#8a8570', 0);
  poly([-40,470, -40,398, 320,384, 600,346, 700,330, 720,470], '#78735f', 0);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(-40,470); ctx.lineTo(-40,340); ctx.lineTo(720,300); ctx.lineTo(760,470); ctx.closePath(); ctx.clip();
  trockenmauer(-60, 386, 800, 13, 61, '#cfc4a8', '#8a8272');
  trockenmauer(-60, 430, 800, 11, 63, '#c8bda2', '#847c6c');
  ctx.restore();
  var haus = [[120,404,72,40],[266,392,60,34],[402,368,54,30],[512,348,44,25],[602,330,34,20]];
  for (var h = 0; h < haus.length; h++){
    var hh = haus[h];
    trockenmauer(hh[0], hh[1], hh[2], hh[3], 19 + h, '#c8bda2', '#8e8574');
    ziegeldach(hh[0]-8, hh[1]-Math.round(hh[3]*0.36), hh[2]+16, Math.round(hh[3]*0.36), '#96674c', 7+h);
    pRect(hh[0]+Math.round(hh[2]*0.3), hh[1]+Math.round(hh[3]*0.3),
          Math.max(5,Math.round(hh[2]*0.16)), Math.max(6,Math.round(hh[3]*0.34)),
          (h===0) ? '#e8c26a' : '#3a4048');
  }
  var kf = [[64,412,0.42],[196,400,0.36],[338,382,0.32],[456,360,0.26],[560,340,0.22],[248,442,0.5]];
  for (var k = 0; k < kf.length; k++) pinie(kf[k][0], kf[k][1], kf[k][2], k+3);
  agave(52, 452, 0.55); agave(312, 428, 0.44);
  /* Das Meer rechts der Landzunge bewegt sich, das Boot treibt darauf
     und kommt in den acht Sekunden nirgends an. Aus dem ersten Haus
     steigt Rauch -- damit ist das Dorf bewohnt und nicht nur gebaut. */
  wellen(700, 254, LW - 620, 74, t, 22, '#bcd4dc');
  boot(778 + Math.sin(t * 0.12) * 26, 268, 0.72, t);
  /* Der Rauch stand vor dem hellen Hang und war praktisch unsichtbar.
     Vom dritten Haus aus steigt er gegen den Berg, und dort liest er. */
  rauch(414, 340, t, 76, 0.34);
  moewenzug(t, 4, 138, 0.052, 0);
  ctx.restore();
  pixelGlow(880, 250, 300, 200, '#ffd28a', 0.24, 5);
}

/* 2 · Die Terrasse, von aussen. Niemand darin. Zwei Stuehle, und
   nur einer ist benutzt -- das ist die erste stille Auskunft
   ueber diesen Haushalt. */
function vsTerrasse(t, katzeBlick, katzeWach){
  bandV(0, 60, LW, 150, [[0,'#8fbdd8'],[0.6,'#c4dae4'],[1,'#e2ecec']], 6);
  bandV(0, 196, LW, 90, [[0,'#2f6f92'],[0.6,'#27607f'],[1,'#20536f']], 5);
  ctx.globalAlpha = 0.4;
  poly([0,200, 300,194, 620,190, LW,196, LW,208, 0,208], '#8798a4', 0);
  ctx.globalAlpha = 1;
  wellen(0, 212, LW, 66, t, 20, '#bcd4dc');
  moewenzug(t, 3, 112, 0.046, 1.3);
  /* Die Waesche haengt vor dem Wasser und hinter der Mauer -- also
     hier, zwischen beiden Zeichenschritten, und nicht spaeter. */
  waescheleine(586, 230, 192, t);
  trockenmauer(0, 282, LW, 74, 12, '#e8dcc0', '#9a8f76');
  pRect(0, psnap(276), LW, 7, '#efe6ce');
  blumentopf(140, 276, 'topf', 3);
  blumentopf(268, 276, 'kanister', 7);
  blumentopf(392, 276, 'eimer', 11);
  agave(520, 280, 0.7);
  // Boden
  var prr = seeded(77), pyy = 356;
  while (pyy < 470){
    var tiefe = (pyy - 356) / 114, ph = Math.round(9 + tiefe * 16), pxx = -30 - prr()*40;
    while (pxx < LW){
      var pw = Math.round((44 + prr()*34) * (0.72 + tiefe*0.6));
      var pt = mixHex('#8f8468', '#ab9f84', 0.35 + prr()*0.55);
      ctx.fillStyle = pt; ctx.fillRect(psnap(pxx), psnap(pyy), psnap(pw-2), psnap(ph-2));
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = tonVon(pt,'licht'); ctx.fillRect(psnap(pxx), psnap(pyy), psnap(pw-2), 2);
      ctx.fillStyle = tonVon(pt,'schatten'); ctx.fillRect(psnap(pxx), psnap(pyy+ph-4), psnap(pw-2), 2);
      ctx.globalAlpha = 1;
      pxx += pw;
    }
    pyy += ph;
  }
  /* Die Mauer wirft einen Schatten auf den Boden. Ohne ihn liegen
     Mauer und Boden aus demselben Stein bündig aneinander und das
     Bild liest sich als eine einzige gekachelte Flaeche. */
  ctx.globalAlpha = 0.30;
  ctx.fillStyle = '#3a3226';
  ctx.fillRect(0, psnap(356), LW, 9);
  ctx.globalAlpha = 0.16;
  ctx.fillRect(0, psnap(365), LW, 7);
  ctx.globalAlpha = 1;
  feigenbaum(806, 400, 1.15, t);
  terrassentisch(430, 436, 150);
  terrassenstuhl(324, 434, 1);
  terrassenstuhl(548, 434, -1);
  poly([398, 392, 420, 392, 417, 376, 401, 376], '#e6e0d2', 2);
  radioApparat(560, 404, false, t);
  katze(230, 442, t, (katzeBlick === undefined) ? null : katzeBlick, !!katzeWach);
  /* Waesche vor der Mauer. Sie haengt seit dem Morgen dort und
     bewegt sich als einziges Ding im Bild schnell genug, dass man
     es merkt, ohne hinzusehen. */
  // Rebenschatten wandert langsam ueber den Boden
  ctx.globalAlpha = 0.14; ctx.fillStyle = '#2a2418';
  for (var s = 0; s < 16; s++)
    ctx.fillRect(psnap(10 + s*62 + Math.sin(t*0.3 + s)*5), 356, 24, 114);
  ctx.globalAlpha = 1;
  pixelGlow(940, 150, 300, 220, '#ffdf9a', 0.18, 5);
}

/* 3 · Der Mann. Er sitzt im Stuhl und sieht aufs Wasser. Gezeichnet
   wird die echte Spielfigur, nicht eine eigene Fassung fuer den
   Vorspann -- wer hier sitzt, ist derselbe, den man gleich fuehrt. */
function vsMann(t){
  /* Naeher heran: dieselbe Terrasse, aber die Kamera steht dichter
     am Stuhl. Statt einer eigenen Fassung wird das ganze Bild um
     den Stuhl herum vergroessert -- so kann nichts auseinanderlaufen. */
  ctx.save();
  ctx.translate(LW/2, 436); ctx.scale(1.42, 1.42); ctx.translate(-556, -452);
  vsTerrasse(t * 0.35);
  var alt = { x:PL.x, y:PL.y, dir:PL.dir, sit:PL.sitting, sk:R.figurSkala,
              pose:PL.pose, tp:PL.tp, blink:PL.blink };
  PL.x = 548; PL.y = 452; PL.dir = 1; PL.sitting = true; R.figurSkala = 1;
  /* Die Pose wird sonst ueber mehrere Bilder eingeblendet, und
     waehrend einer Zwischensequenz laeuft update() nicht. Sie wird
     darum hier direkt gesetzt, sonst steht er im Stuhl. */
  PL.pose = newPose(); PL.tp = newPose();
  PL.pose.sit = 1; PL.pose.lean = 5;
  PL.pose.aFsw = 9; PL.pose.aFbend = -4;
  PL.pose.aBsw = 7; PL.pose.aBbend = -3;
  PL.pose.bob = Math.sin(t * 1.25) * 1.1;
  /* Er sieht nicht die ganze Einstellung lang geradeaus. Der Kopf
     geht langsam aufs Wasser hinaus und kommt zurueck -- eine
     Bewegung ueber gut fuenfzehn Sekunden, also nie ganz zu Ende. */
  PL.pose.headTurn = 3 + Math.sin(t * 0.41) * 5.5;
  PL.pose.lean = 5 + Math.sin(t * 0.33) * 1.5;
  /* Der Lidschlag laeuft sonst in update(), und update() steht
     waehrend einer Zwischensequenz still. Hier wird er aus der Zeit
     gerechnet: alle 3,7 Sekunden einer, gut ein Zehntel lang. */
  PL.blink = ((t % 3.7) > 3.58) ? -0.06 : 1.4;
  /* Die vordere Hand hebt sich einmal langsam und legt sich wieder
     ab. Kein Winken -- das Gewicht des Arms bleibt drin. */
  var heb = (t > 3.4) ? Math.max(0, Math.sin((t - 3.4) * 0.5)) : 0;
  PL.pose.aFsw = 9 - heb * 25;
  PL.pose.aFbend = -4 - heb * 20;
  var her = Math.min(1, t / 1.8);
  ctx.globalAlpha = her;
  try { drawActor(PL); } catch(e){}
  ctx.globalAlpha = 1;
  PL.x = alt.x; PL.y = alt.y; PL.dir = alt.dir; PL.sitting = alt.sit;
  R.figurSkala = alt.sk; PL.pose = alt.pose; PL.tp = alt.tp; PL.blink = alt.blink;
  ctx.restore();
  pixelGlow(920, 150, 280, 200, '#ffdf9a', 0.14, 4);
}

/* Eine Hand, gross. Vier Finger mit sichtbaren Zwischenraeumen, die
   ueber die vordere Kante haengen, und ein Daumen, der zur Seite
   steht -- ohne beides liest sich eine Hand als Brett. */
function grosseHand(x, y, spiegel, greif, haut){
  ctx.save(); ctx.translate(psnap(x), psnap(y)); ctx.scale(spiegel, 1);
  var sch = tonVon(haut, 'schatten'), tief = tonVon(haut, 'tief');
  // Unterarm, der ins Bild laeuft
  pGlied(-150, 78, -34, 22, 50, haut);
  // Handruecken
  pKoerper(-42, -6, 104, 52, haut);
  // Knoechel als vier Buckel auf der Oberkante
  for (var k = 0; k < 4; k++){
    ctx.fillStyle = tonVon(haut, 'licht');
    ctx.fillRect(psnap(-32 + k*25), psnap(-8), psnap(15), 5);
  }
  // Vier Finger, die ueber die Kante haengen. Die Zwischenraeume
  // sind wichtiger als die Finger selbst.
  for (var f = 0; f < 4; f++){
    var fx = -34 + f*25;
    var lang = (52 - f*6) * (1 - greif * 0.45);
    var knick = greif * 14;
    pGlied(fx + 8, 40, fx + 8 + knick, 40 + lang, 19, haut);
    ctx.fillStyle = tief;
    ctx.fillRect(psnap(fx - 1), psnap(38), 4, psnap(lang * 0.9));
    // Nagel
    ctx.fillStyle = mixHex(haut, '#f0d8c0', 0.4);
    ctx.fillRect(psnap(fx + 3 + knick), psnap(40 + lang - 12), 10, 8);
  }
  // Daumen, seitlich abgespreizt
  pGlied(-44, 12, -84, 44, 22, haut);
  ctx.fillStyle = mixHex(haut, '#f0d8c0', 0.4);
  ctx.fillRect(psnap(-92), psnap(38), 10, 9);
  // Sehnen auf dem Handruecken
  ctx.fillStyle = sch;
  for (var s2 = 0; s2 < 3; s2++) ctx.fillRect(psnap(-24 + s2*24), psnap(4), 3, 28);
  ctx.restore();
}

function vsHaende(t){
  /* Die einzige Einstellung ohne Horizont. Was in diesen Haenden
     steht, sagt im ganzen Spiel niemand. */
  bandV(0, 60, LW, 410, [[0,'#9a8a6c'],[0.5,'#84765c'],[1,'#5f5442']], 6);
  ctx.globalAlpha = 0.07;
  for (var i = 0; i < 26; i++)
    pixelBlob(30 + i*38, 74 + (i%7)*52, 54, 16, '#4a4132', 0.6, seeded(i+2));
  ctx.globalAlpha = 1;
  // Die Armlehne, quer durchs Bild
  pKoerper(-20, 316, LW+40, 40, '#8a6a44');
  pKoerper(-20, 354, LW+40, 26, '#664d2f');
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(0, psnap(380), LW, 8);
  ctx.globalAlpha = 1;
  var haut = PAL.mAlt.skin;
  var atem = Math.sin(t * 1.1) * 2;
  /* Zwei Frequenzen uebereinander: die langsame ist der Atem, die
     schnelle das, was nach sechsunddreissig Jahren uebrig bleibt. */
  var zittern = Math.sin(t * 8.7) * 0.5 + Math.sin(t * 4.3) * 0.35;
  grosseHand(266 + zittern, 300 + atem, 1, 0, haut);
  var greif = Math.max(0, Math.sin((t - 2.6) * 0.85)) * (t > 2.6 ? 1 : 0);
  grosseHand(720 - zittern * 0.8, 300 + atem * 0.7, -1, greif, haut);
  pixelGlow(LW - 40, 120, 320, 260, '#ffd9a0', 0.16, 4);
}

/* 5 · Die Garage. Der erste Bruch: kein Horizont, kein Licht, und
   etwas, das zugedeckt ist. Die Kamera faehrt langsam darauf zu. */
function vsKiste(t){
  var zoom = 1 + Math.min(1, t / 7) * 0.22;
  ctx.save();
  ctx.translate(LW/2, 300); ctx.scale(zoom, zoom); ctx.translate(-LW/2, -300);
  bandV(0, 60, LW, 410, [[0,'#3e3a34'],[0.5,'#332e28'],[1,'#221f1b']], 6);
  var rr = seeded(1942);
  ctx.globalAlpha = 0.16;
  for (var i = 0; i < 16; i++){
    var bx = rr()*LW, by = 80 + rr()*280, br = 24 + rr()*54;
    pixelBlob(bx-br, by, br*2, br*0.6, '#141210', 0.6, rr);
  }
  ctx.globalAlpha = 1;
  for (var b = 0; b < 5; b++) pRect(b*210, 60, 26, 54, '#2a251f');
  /* Draussen geht zweimal jemand am Torspalt vorbei. Man sieht ihn
     nicht, nur das Licht wird kurz schwaecher -- in dieser Garage
     ist das die einzige Bewegung, die es gibt. */
  var vorbei = Math.max(0, 1 - Math.abs((t % 4.6) - 2.9) * 2.6);
  // Lichtstreifen aus dem Torspalt
  ctx.globalAlpha = 0.34 * (1 - vorbei * 0.72);
  poly([130, 60, 196, 60, 396, 470, 232, 470], '#ffe0a0', 0);
  ctx.globalAlpha = 1;
  // Regal, angeschnitten
  pOutlineRect(-30, 150, 150, 220, '#4a3f30', '#181410');
  for (var s = 0; s < 4; s++) pRect(-26, 156 + s*54, 142, 6, '#5a4c38');
  // Der Boden
  bandV(0, 386, LW, 84, [[0,'#463f36'],[1,'#2a2620']], 4);
  /* Die Kiste. Sie ist der Grund fuer diese Einstellung, also steht
     sie in der Mitte und im Licht -- die Plane ist so weit
     zurueckgeschlagen, dass Deckel und Schnalle zu sehen sind, und
     kein Stueck weiter. */
  ctx.save(); ctx.translate(500, 424);
  holzkiste(0, 0, 2.0, 'zu');
  poly([-130, 6, -6, 6, -26, -78, -116, -66], '#4e5c52', 2.6);
  ctx.globalAlpha = 0.28;
  poly([-116, -66, -26, -78, -38, -56, -108, -46], '#8a9a8e', 0);
  ctx.globalAlpha = 1;
  ctx.restore();
  // Der Lichtstreifen faellt quer ueber den Deckel
  ctx.save();
  ctx.globalAlpha = 0.22 * (1 - vorbei * 0.72);
  poly([300, 60, 372, 60, 640, 470, 430, 470], '#ffe6b0', 0);
  ctx.restore();
  // Staub im Licht
  ctx.globalAlpha = 0.18;
  for (var st = 0; st < 44; st++){
    var sx = 150 + ((st*41 + t*8) % 300), sy = 90 + ((st*67 + t*4) % 330);
    ctx.fillStyle = '#ffeec8';
    ctx.fillRect(psnap(sx), psnap(sy), 2, 2);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  pixelGlow(200, 200, 220, 300, '#ffe0a0', 0.16, 4);
}

/* 6 · Der Ball. Er rollt quer durchs Bild und bleibt liegen. Mehr
   passiert nicht, und mehr braucht es nicht: ab hier ist jemand
   da, der fragt. */
function vsBall(t){
  /* Erst hiess dieses Bild "Mauer und Boden mit Ball" -- und weil
     beide aus demselben Stein sind, sah es aus wie eine Kachelwand
     mit einem Ball davor. Es ist jetzt wieder die Terrasse aus
     Einstellung zwei, damit man ueberhaupt erkennt, wo der Ball
     hereinrollt. Wiedererkennung ist hier mehr wert als ein neues
     Bild. */
  /* Die Katze schlaeft, bis der Ball hereinkommt -- dann hebt sie
     den Kopf und sieht ihm nach. Sie ist die einzige im Bild, die
     das Kind bemerkt. */
  var ballX = -50 + (1 - Math.pow(1 - Math.min(1, t / 3.4), 3)) * 340;
  vsTerrasse(t * 0.3, (t > 0.7) ? ballX : null, t > 0.7);
  /* Der Ball rollt herein, wird langsamer und bleibt am Stuhlbein
     liegen. Danach faellt der Schatten eines Kindes ins Bild --
     das Kind selbst sieht man im ganzen Vorspann nicht. */
  var lauf = Math.min(1, t / 3.4);
  var e = 1 - Math.pow(1 - lauf, 3);
  var bx = -50 + e * 340;
  var hop = Math.abs(Math.sin(lauf * 11)) * (1 - lauf) * 26;
  var by = 430 - hop;
  ctx.globalAlpha = 0.3 - hop * 0.006;
  ell(bx, 448, 26, 7, '#2a2418', 0);
  ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(bx, by); ctx.rotate(e * 8);
  ell(0, 0, 22, 22, '#dcd6c4', 2.6);
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, 20, 0, 6.2832); ctx.clip();
  poly([-8,-24, 8,-24, 12,-6, 0,3, -12,-6], '#33383e', 0);
  poly([-24,8, -10,2, -5,17, -14,24], '#33383e', 0);
  poly([24,8, 10,2, 5,17, 14,24], '#33383e', 0);
  ctx.restore();
  ctx.globalAlpha = 0.3;
  ell(-7, -8, 8, 6, '#ffffff', 0);
  ctx.globalAlpha = 1;
  ctx.restore();
  /* Der Schatten des Kindes faellt von links ins Bild. Er wird
     laenger, waehrend es naeher kommt, und bleibt dann stehen. */
  var sch = Math.max(0, Math.min(1, (t - 3.8) / 1.8));
  if (sch > 0){
    ctx.globalAlpha = 0.26 * sch;
    var sl = 150 * sch;
    poly([0, 470, 0, 356, 40 + sl, 366, 76 + sl, 470], '#241f18', 0);
    // Kopf und Schultern des Schattens auf dem Boden
    ell(56 + sl, 380, 20, 12, '#241f18', 0);
    ctx.globalAlpha = 1;
  }
  pixelGlow(920, 150, 280, 200, '#ffdf9a', 0.14, 4);
}

/* 7 · Der Titel. Ueber dem Meer, weil das Spiel dort endet. */

/* ============================================================
   DIE STUDIOKARTE
   ------------------------------------------------------------
   Die Spiele, an denen sich dieses hier orientiert, fingen alle
   gleich an: Schwarzbild, das Zeichen des Hauses, ein Wort
   darunter, Stille. Erst danach das Spiel. Der Reiz daran ist,
   dass nichts passiert -- man sitzt vor einem schwarzen Schirm
   und weiss, gleich geht es los.

   Die Buchstaben sind nicht gesetzt, sondern gebaut: aus
   denselben Bloecken wie alles andere im Spiel, mit derselben
   Licht- und Schattenkante. Ein Schriftzug aus einer Systemfont
   waere das einzige Bild im ganzen Vorspann, das nicht aus
   dieser Welt kaeme.
   ------------------------------------------------------------ */

/* Ein Buchstabe als Liste von Bloecken, in einem Raster von
   100 x 140 Einheiten. So bleibt er skalierbar und behaelt bei
   jeder Groesse dieselben Proportionen. */
var LOGO_F = [
  [  0,   0,  26, 140],   // Stamm
  [ 20,   0,  74,  26],   // Kopfbalken
  [ 20,  56,  56,  24]    // Mittelbalken
];
var LOGO_G = [
  [ 16,   0,  78,  26],   // oben
  [  0,  16,  26, 108],   // links
  [ 16, 114,  78,  26],   // unten
  [ 68,  74,  26,  50],   // rechts unten
  [ 46,  66,  48,  22]    // Querbalken
];
/* Auf Schwarz bekommt das Zeichen nur eine Lichtkante und keine
   Schattenseite: ein dunkler Rand auf dunklem Grund liest nicht als
   Plastizitaet, sondern als abgefallener Block daneben. Zuerst alle
   Grundflaechen, dann alle Kanten -- sonst zieht die Kante des einen
   Blocks eine Naht durch den naechsten. */
function logoBloecke(bloecke, x, y, s, farbe){
  var i, b, d = Math.max(2, Math.round(4 * s));
  /* Erst alle Grundflaechen, damit die Form geschlossen ist. */
  ctx.fillStyle = farbe;
  for (i = 0; i < bloecke.length; i++){
    b = bloecke[i];
    ctx.fillRect(psnap(x + b[0]*s), psnap(y + b[1]*s), psnap(b[2]*s), psnap(b[3]*s));
  }
  /* Die Fase bekommen nur die grossen Bloecke. Eine Schraege ist aus
     vielen kurzen Stufen gebaut; gaebe man jeder einzelnen eine helle
     Ober- und eine dunkle Unterkante, waere aus dem Strich eine
     Leiter geworden -- genau das ist beim ersten Versuch passiert. */
  var gross = 24;
  ctx.fillStyle = tonVon(farbe, 'licht');
  for (i = 0; i < bloecke.length; i++){
    b = bloecke[i];
    if (b[3] < gross) continue;
    ctx.fillRect(psnap(x + b[0]*s), psnap(y + b[1]*s), psnap(b[2]*s), d);
  }
  ctx.fillStyle = tonVon(farbe, 'schatten');
  for (i = 0; i < bloecke.length; i++){
    b = bloecke[i];
    if (b[3] < gross) continue;
    ctx.fillRect(psnap(x + b[0]*s), psnap(y + (b[1]+b[3])*s - d), psnap(b[2]*s), d);
  }
}

/* ------------------------------------------------------------
   DER TITEL
   ------------------------------------------------------------
   Das Spiel heisst M. -- ein Buchstabe und ein Punkt, so wie die
   Figur im ganzen Text heisst. Ein einzelner Buchstabe ist als
   Titel nur dann stark, wenn er auch als Zeichen gebaut ist und
   nicht als Zeile Text: darum dieselben Bloecke und dieselbe
   Lichtkante wie beim Zeichen des Hauses.

   Der Punkt kommt spaeter als der Buchstabe und einzeln. Er ist
   die Pointe des Titels: ein Mann, der wenig sagt, und dahinter
   ein Punkt statt eines Ausrufezeichens.
   ------------------------------------------------------------ */
var LOGO_M = [
  /* Raster 140 x 140. Ein M ist ungefaehr so breit wie hoch; im ersten
     Entwurf war es auf hundert Einheiten gequetscht, und der
     Innenraum zwischen den Schraegen blieb so eng, dass er als Kerbe
     las statt als Gegenform. */
  [   0,   0,  30, 140],   // linker Stamm
  [ 110,   0,  30, 140],   // rechter Stamm
  [  30,   0,  20,  15],   // Schraege von links, in Stufen nach innen
  [  36,  14,  20,  15],
  [  42,  28,  20,  15],
  [  48,  42,  20,  15],
  [  54,  56,  20,  15],
  [  60,  70,  20,  15],
  [  90,   0,  20,  15],   // Schraege von rechts
  [  84,  14,  20,  15],
  [  78,  28,  20,  15],
  [  72,  42,  20,  15],
  [  66,  56,  20,  15]
];
var LOGO_PUNKT = [ [ 152, 112,  28,  28 ] ];

/* aM = Deckkraft des Buchstabens, aP die des Punkts. Beide getrennt,
   weil der Punkt spaeter kommt. */
function titelZeichnen(cx, cy, s, aM, aP, farbe){
  farbe = farbe || '#f2e2b8';
  var breite = 180 * s;
  var x = Math.round(cx - breite / 2);
  var y = Math.round(cy - 140 * s / 2);
  if (aM > 0){
    ctx.save(); ctx.globalAlpha = Math.min(1, aM);
    logoBloecke(LOGO_M, x, y, s, farbe);
    ctx.restore();
  }
  if (aP > 0){
    /* Der Punkt faellt die letzten Pixel herunter und bleibt liegen. */
    var fall = (1 - Math.min(1, aP)) * 14 * s;
    ctx.save(); ctx.globalAlpha = Math.min(1, aP);
    logoBloecke(LOGO_PUNKT, x, y - fall, s, farbe);
    ctx.restore();
  }
}

function vsStudio(t){
  ctx.fillStyle = '#07070a';
  ctx.fillRect(0, 0, LW, LH);

  /* Das Zeichen baut sich auf: erst F, dann G, jeder Buchstabe
     faehrt aus dem Schwarz heran und kommt zur Ruhe. */
  var s = 1.15;
  var breiteF = 96 * s, breiteG = 96 * s, luecke = 34 * s;
  var gesamt = breiteF + luecke + breiteG;
  var x0 = Math.round((LW - gesamt) / 2);
  var y0 = Math.round(LH/2 - 140 * s / 2) - 20;

  var aF = Math.max(0, Math.min(1, (t - 0.5) / 0.9));
  var aG = Math.max(0, Math.min(1, (t - 1.1) / 0.9));
  var weichF = 1 - Math.pow(1 - aF, 3);
  var weichG = 1 - Math.pow(1 - aG, 3);

  if (aF > 0){
    ctx.save();
    ctx.globalAlpha = weichF;
    logoBloecke(LOGO_F, x0 - (1 - weichF) * 54, y0, s, '#d8bc84');
    ctx.restore();
  }
  if (aG > 0){
    ctx.save();
    ctx.globalAlpha = weichG;
    logoBloecke(LOGO_G, x0 + breiteF + luecke + (1 - weichG) * 54, y0, s, '#d8bc84');
    ctx.restore();
  }

  /* Kein Lichtstreif ueber den Buchstaben. Der Versuch sah auf
     Schwarz nicht nach Licht aus, sondern nach einem Balken, der
     quer ueber dem Zeichen liegt -- additiv aufgetragenes Weiss
     braucht eine Flaeche, auf der es etwas anheben kann, und die
     gibt es hier nicht. Die einzige Bewegung ist jetzt die Linie,
     die sich unter dem Zeichen nach aussen zieht. Das genuegt.
     ---------------------------------------------------------- */

  // Feine Linie unter dem Zeichen, dann das Wort
  var aL = Math.max(0, Math.min(1, (t - 2.1) / 1.0));
  if (aL > 0){
    ctx.globalAlpha = aL * 0.5;
    ctx.fillStyle = '#8a7450';
    var lb = gesamt * aL;
    ctx.fillRect(psnap(LW/2 - lb/2), psnap(y0 + 140 * s + 26), psnap(lb), 3);
    ctx.globalAlpha = 1;
  }
}

function vsTitel(t){
  bandV(0, 60, LW, 190, [[0,'#e8a862'],[0.5,'#f2cc94'],[1,'#e8e4cc']], 7);
  bandV(0, 236, LW, 234, [[0,'#31677f'],[0.55,'#2a5a73'],[1,'#254e66']], 6);
  ctx.globalAlpha = 0.32;
  poly([0,238, 300,231, 600,226, 900,231, LW,227, LW,244, 0,244], '#8a97a2', 0);
  ctx.globalAlpha = 1;
  /* Sonnenstrasse, kurz unter der Sonne. Ueber die ganze Bildhoehe
     gezogen wurde daraus eine Saeule statt einer Spiegelung. */
  for (var g = 0; g < 18; g++){
    var tief = g / 17;
    var gy = 244 + g * 5;
    var gw = (18 + tief * 74) * (0.55 + Math.abs(Math.sin(t*0.8 + g*0.5)) * 0.8);
    ctx.globalAlpha = (0.26 - tief * 0.13) + Math.abs(Math.sin(t*0.55 + g)) * 0.12;
    ctx.fillStyle = '#ffd8a0';
    ctx.fillRect(psnap(LW/2 - gw/2), psnap(gy), psnap(gw), 3);
  }
  ctx.globalAlpha = 1;
  /* Ein Bogen, ganz schwach, aus dem Wasser gedacht. Er traegt das
     Motiv des Spiels weiter, auch wenn es nicht mehr so heisst:
     zwei Ufer und etwas dazwischen. */
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.beginPath();
  ctx.moveTo(150, 470); ctx.quadraticCurveTo(LW/2, 190, LW-150, 470);
  ctx.lineWidth = 34; ctx.strokeStyle = '#f0e2c4'; ctx.stroke();
  ctx.restore();
  pixelGlow(LW/2, 210, 300, 200, '#ffd28a', 0.20, 5);
}

CINES.vorspann = [
  { dauer:5.2, draw:vsStudio, studio:true, text:['präsentiert'] },
  { dauer:8.5, draw:vsKueste,   text:['Podaca, an der Adria.',
                                      'Zweihundert Meter Land zwischen einem Berg und dem Wasser.'] },
  { dauer:7.5, draw:vsTerrasse, text:['Das Haus ist fertig. Seit vier Jahren ist es fertig.',
                                      'Vierzehn Sommer hat es gedauert.'] },
  { dauer:7.5, draw:vsMann,     text:['Hier sitzt er jeden Nachmittag.',
                                      'Er sagt, er denke an nichts.'] },
  { dauer:7.5, draw:vsHaende,   text:['Sechsunddreißig Jahre Deutschland stehen in diesen Händen.',
                                      'Sonst nirgends.'] },
  { dauer:8.0, draw:vsKiste,    text:['In der Garage steht eine Kiste.',
                                      'Sie ist zu, seit er sie bekommen hat.'] },
  { dauer:7.0, draw:vsBall,     text:['Diesen Sommer sind die Enkel da.',
                                      'Der jüngste fragt.'] },
  { dauer:9.0, draw:vsTitel,    titel:true }
];
