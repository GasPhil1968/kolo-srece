
/* ============================================================
   Sektion 08  BAUTEILE
   ------------------------------------------------------------
   Wiederkehrende Gegenstaende. Alles gerastert, alles ohne
   weiche Verlaeufe, damit es neben den Figuren steht und nicht
   dahinter verschwimmt.
   ============================================================ */

/* Trockenmauer aus Kalkstein. Sie steht in diesem Spiel in jedem
   zweiten Bild: in Rosko Polje, in Podaca, am Hausbau. Immer dieselbe
   Machart, immer andere Farbe -- so bleibt der Ort erkennbar und die
   Herkunft der Steine auch. */
function trockenmauer(x, y, w, h, seed, hell, dunkel){
  var rr = seeded(seed || 7);
  hell = hell || '#d8cdb4'; dunkel = dunkel || '#8f8570';
  var dir = lichtSeite();
  ctx.fillStyle = dunkel;
  ctx.fillRect(psnap(x), psnap(y), psnap(w), psnap(h));
  var yy = y + 2;
  while (yy < y + h - 2){
    var rowH = 8 + Math.floor(rr() * 8);
    var xx = x + 2;
    while (xx < x + w - 2){
      var bw = 14 + Math.floor(rr() * 26);
      if (xx + bw > x + w - 2) bw = x + w - 2 - xx;
      if (bw < 5) break;
      var bh = Math.min(rowH - 2, y + h - 2 - yy);
      var t = 0.35 + rr() * 0.6;
      var grund = mixHex(dunkel, hell, t);
      /* Jeder Stein bekommt eine Oberkante im Licht und eine
         Unterkante im Schatten. Das ist der Unterschied zwischen
         einem Mauermuster und einer Mauer: erst die Fuge, die
         Schatten wirft, macht aus Rechtecken Steine. */
      ctx.fillStyle = grund;
      ctx.fillRect(psnap(xx), psnap(yy), psnap(bw - 2), psnap(bh));
      if (bh >= 6){
        ctx.fillStyle = tonVon(grund, 'licht');
        ctx.fillRect(psnap(xx), psnap(yy), psnap(bw - 2), 2);
        ctx.fillStyle = tonVon(grund, 'schatten');
        ctx.fillRect(psnap(xx), psnap(yy + bh - 2), psnap(bw - 2), 2);
        // Seitliche Kante, je nach Lichtrichtung
        ctx.fillStyle = tonVon(grund, dir > 0 ? 'schatten' : 'licht');
        ctx.fillRect(psnap(xx), psnap(yy + 2), 2, psnap(bh - 4));
        ctx.fillStyle = tonVon(grund, dir > 0 ? 'licht' : 'schatten');
        ctx.fillRect(psnap(xx + bw - 4), psnap(yy + 2), 2, psnap(bh - 4));
        // Ein paar Steine sind angeschlagen
        if (rr() > 0.82){
          ctx.fillStyle = tonVon(grund, 'schatten');
          ctx.fillRect(psnap(xx + 3 + rr()*(bw-10)), psnap(yy + 2 + rr()*(bh-5)), 3, 2);
        }
      }
      xx += bw;
    }
    yy += rowH;
  }
}

/* Dachziegel, mediterran: halbrund, ueberlappend, in der Sonne fast rot,
   im Schatten braun. Als Reihe gezeichnet, nicht als Flaeche. */
function ziegeldach(x, y, w, h, col, seed){
  var rr = seeded(seed || 11);
  col = col || '#a85c3a';
  poly([x, y+h, x+w, y+h, x+w-14, y, x+14, y], mixHex(col,'#000000',0.35), 0);
  for (var i = 0; i < w; i += 11){
    var t = i / w;
    var x0 = x + 14 + (w - 28) * t;
    ctx.fillStyle = mixHex(col, rr() > 0.5 ? '#ffd2a0' : '#5a2a1c', 0.12 + rr() * 0.2);
    ctx.fillRect(psnap(x0), psnap(y), 8, psnap(h));
    ctx.fillStyle = 'rgba(20,10,6,0.30)';
    ctx.fillRect(psnap(x0 + 8), psnap(y), 3, psnap(h));
  }
  ctx.fillStyle = mixHex(col,'#ffe0b0',0.3);
  ctx.fillRect(psnap(x), psnap(y+h-4), psnap(w), 4);
}

/* Fensterladen, gruen, halb angelehnt. Das eine Detail, an dem man in
   diesem Spiel Dalmatien von Bosnien unterscheidet. */
function fensterladen(x, y, w, h, col, offen){
  col = col || '#4a6a52';
  var lw = offen ? w * 0.34 : w * 0.5;
  pOutlineRect(x, y, lw, h, col, '#141a14');
  pOutlineRect(x + w - lw, y, lw, h, mixHex(col,'#000000',0.16), '#141a14');
  for (var i = 0; i < h - 8; i += 6){
    ctx.fillStyle = 'rgba(12,20,14,0.35)';
    ctx.fillRect(psnap(x+3), psnap(y+4+i), psnap(lw-6), 2);
    ctx.fillRect(psnap(x+w-lw+3), psnap(y+4+i), psnap(lw-6), 2);
  }
}

/* Feigenbaum: grosse, gelappte Blaetter, wenige, dafuer gross. Er wirft
   den Schatten, in dem auf dieser Terrasse alles stattfindet. */
function feigenbaum(x, y, s, t){
  s = s || 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  var wiegen = Math.sin(t * 0.55) * 2.2;
  pSegOutlined(0, 0, -4, -70, 13, '#6a5c4a');
  pSegOutlined(-4, -60, -34, -96, 8, '#6a5c4a');
  pSegOutlined(-4, -66, 30, -104, 8, '#6a5c4a');
  pSegOutlined(-4, -74, 4, -116, 7, '#6a5c4a');
  var blaetter = [[-46,-108,20],[-18,-124,23],[16,-128,22],[44,-112,19],[-38,-84,17],
                  [34,-86,17],[0,-146,19],[-58,-88,14],[58,-92,14],[-4,-100,21]];
  for (var i = 0; i < blaetter.length; i++){
    var b = blaetter[i], bx = b[0] + wiegen * (0.4 + i * 0.06), by = b[1], r = b[2];
    var gr = (i % 3 === 0) ? '#4f7a3e' : (i % 3 === 1 ? '#5d8a46' : '#436a34');
    // Feigenblatt: drei Lappen, gepixelt
    pRect(bx - r, by - r*0.5, r*2, r*1.0, gr);
    pRect(bx - r*0.7, by - r, r*0.55, r*0.7, gr);
    pRect(bx + r*0.15, by - r, r*0.55, r*0.7, gr);
    pRect(bx - r*0.25, by - r*1.1, r*0.5, r*0.6, gr);
    ctx.globalAlpha = 0.35;
    pRect(bx - r*0.8, by + r*0.2, r*1.6, 3, mixHex(gr,'#000000',0.4));
    ctx.globalAlpha = 1;
  }
  // Zwei Feigen, dunkelviolett
  ell(-24, -92, 6, 7, '#5a3a58', 1.6);
  ell(28, -78, 5, 6, '#6a4460', 1.6);
  ctx.restore();
}

/* Zypresse. Steht am Rand jedes dalmatinischen Bildes und braucht
   genau vier Rechtecke. */
function zypresse(x, y, h, col){
  col = col || '#2e4632';
  var w = h * 0.20;
  poly([x - w*0.5, y, x + w*0.5, y, x + w*0.34, y - h*0.55, x, y - h, x - w*0.34, y - h*0.55], col, 0);
  ctx.globalAlpha = 0.4;
  poly([x, y, x + w*0.5, y, x + w*0.34, y - h*0.55, x, y - h], mixHex(col,'#000000',0.4), 0);
  ctx.globalAlpha = 1;
}

/* Die Katze. Sie liegt, sie sitzt, sie schaut -- und wenn der Spieler
   feststeckt, schaut sie genau dorthin, wo es weitergeht. Das ist im
   Konzept das ganze Hinweissystem, und es soll keines sein, das nach
   einem Menue aussieht. */
function katze(x, y, t, blickX, wach){
  ctx.save(); ctx.translate(psnap(x), psnap(y));
  var atem = Math.sin(t * 1.6) * 1.2;
  var kf = '#c9a06a', dunkel = '#8a6a44';
  // Koerper
  pOutlineRect(-20, -14 + atem, 40, 15, kf, '#1a120c');
  pRect(-16, -12 + atem, 30, 4, mixHex(kf,'#ffe0b0',0.3));
  // Streifen
  for (var s = 0; s < 4; s++) pRect(-12 + s*8, -13 + atem, 3, 12, dunkel);
  // Schwanz, wedelt
  var sw = Math.sin(t * 1.1) * 8;
  pSeg(-19, -6 + atem, -32, -10 + atem + sw, 4, kf);
  pSeg(-32, -10 + atem + sw, -38, -18 + atem + sw*1.4, 3, dunkel);
  // Beine
  pRect(-14, -2 + atem, 5, 5, kf); pRect(8, -2 + atem, 5, 5, kf);
  // Kopf, dreht sich zum Hinweis
  var dreh = 0;
  if (blickX !== null && blickX !== undefined) dreh = Math.max(-6, Math.min(6, (blickX - x) * 0.02));
  var kx = 18 + dreh, ky = -24 + atem;
  pOutlineRect(kx - 9, ky, 18, 15, kf, '#1a120c');
  // Ohren
  poly([kx-9, ky+1, kx-9, ky-8, kx-2, ky+1], kf, 1.6);
  poly([kx+9, ky+1, kx+9, ky-8, kx+2, ky+1], kf, 1.6);
  // Augen: geschlossen, wenn sie schlaeft
  if (wach){
    pRect(kx - 6, ky + 5, 4, 4, '#1a3a24');
    pRect(kx + 2, ky + 5, 4, 4, '#1a3a24');
    pRect(kx - 5, ky + 6, 2, 3, '#0c1a10');
    pRect(kx + 3, ky + 6, 2, 3, '#0c1a10');
  } else {
    pRect(kx - 6, ky + 6, 5, 2, '#1a120c');
    pRect(kx + 2, ky + 6, 5, 2, '#1a120c');
  }
  pRect(kx - 1, ky + 10, 3, 2, '#c26a68');
  // Schnurrhaare
  ctx.globalAlpha = 0.6;
  pRect(kx + 6, ky + 9, 8, 1, '#efe4d0'); pRect(kx - 14, ky + 9, 8, 1, '#efe4d0');
  ctx.globalAlpha = 1;
  ctx.restore();
}

/* Baba Roga. Sie steht immer am Bildrand, immer halb verdeckt, immer
   zu gross fuer ihren Platz. Sie wird nie kommentiert. Im Finale steht
   sie zum ersten Mal ganz im Bild und ist dann nur noch eine alte Frau. */
function babaRoga(x, y, t, alpha, ganz){
  ctx.save();
  ctx.globalAlpha = alpha === undefined ? 0.5 : alpha;
  ctx.translate(psnap(x), psnap(y));
  var wiegen = Math.sin(t * 0.7) * 1.5;
  var h = ganz ? 1 : 1.14;
  ctx.scale(1, h);
  var koerper = ganz ? '#4a4450' : '#1c1820';
  // Rock als breiter Kegel
  poly([-22, 0, 22, 0, 13, -62, -13, -62], koerper, 0);
  // Rumpf, gebeugt
  pRect(-13 + wiegen, -96, 26, 36, koerper);
  pRect(-17 + wiegen, -92, 8, 26, mixHex(koerper,'#000000',0.3));
  // Arm mit Stock
  pSeg(10 + wiegen, -88, 20 + wiegen, -50, 5, koerper);
  pSeg(22 + wiegen, -96, 26 + wiegen, 0, 3, ganz ? '#6a5a44' : '#0e0c12');
  // Kopf im Tuch
  pRect(-11 + wiegen, -118, 22, 24, koerper);
  pRect(-13 + wiegen, -120, 26, 12, mixHex(koerper,'#000000',0.2));
  if (ganz){
    // Im Finale hat sie ein Gesicht, und es ist ein gewoehnliches.
    pRect(-6 + wiegen, -106, 4, 4, '#efe7da'); pRect(2 + wiegen, -106, 4, 4, '#efe7da');
    pRect(-5 + wiegen, -105, 2, 2, '#241c16'); pRect(3 + wiegen, -105, 2, 2, '#241c16');
    pRect(-4 + wiegen, -98, 8, 2, '#6a4a44');
    pRect(-9 + wiegen, -112, 18, 4, '#b8b0a4');
  } else {
    // Sonst nur zwei helle Punkte, und die sind zu weit auseinander.
    ctx.globalAlpha = (alpha === undefined ? 0.5 : alpha) * 1.5;
    pRect(-8 + wiegen, -108, 3, 3, '#c8d8d0'); pRect(5 + wiegen, -108, 3, 3, '#c8d8d0');
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

/* Die Holzkiste aus der Marinezeit. Sie ist der Motor der
   Rahmenhandlung und muss darum in jedem Zustand sofort lesbar sein:
   verschlossen, angefasst, offen. */
function holzkiste(x, y, s, zustand){
  s = s || 1;
  ctx.save(); ctx.translate(psnap(x), psnap(y)); ctx.scale(s, s);
  var holz = '#7a5f3c', tief = '#5a4429';
  // Korpus
  pOutlineRect(-42, -34, 84, 34, holz, '#160f08');
  for (var i = 0; i < 4; i++) pRect(-40, -32 + i*8, 80, 2, tief);
  // Eckbeschlaege
  pRect(-42, -34, 5, 34, '#4a4a4e'); pRect(37, -34, 5, 34, '#4a4a4e');
  if (zustand === 'offen'){
    // Deckel aufgeklappt nach hinten
    poly([-42, -34, 42, -34, 50, -66, -34, -66], mixHex(holz,'#000000',0.2), 2.4);
    pRect(-40, -32, 80, 6, '#241a10');
    // Inhalt: Muetze, Briefe, ein Foto
    pRect(-30, -30, 24, 7, '#e4e6e2');
    pRect(-30, -25, 24, 3, '#1c2a3e');
    pRect(0, -30, 20, 8, '#e0dcc8');
    pRect(2, -28, 16, 1, '#8a7a5c'); pRect(2, -25, 12, 1, '#8a7a5c');
    pRect(22, -30, 14, 10, '#c9bfa8');
    pRect(24, -28, 10, 6, '#7a8a94');
  } else {
    // Deckel geschlossen, mit Schnalle
    pOutlineRect(-44, -44, 88, 12, mixHex(holz,'#ffd8a0',0.10), '#160f08');
    pRect(-6, -40, 12, 12, '#b8973f');
    pRect(-3, -37, 6, 6, '#3a2e18');
    if (zustand === 'angefasst'){
      // Staub weggewischt: ein heller Streifen quer ueber den Deckel
      ctx.globalAlpha = 0.5;
      pRect(-38, -42, 60, 5, '#d8c8a8');
      ctx.globalAlpha = 1;
    } else {
      // Staub
      ctx.globalAlpha = 0.35;
      pRect(-44, -44, 88, 5, '#cfc8b8');
      ctx.globalAlpha = 1;
    }
  }
  // Aufschrift, kyrillisch angedeutet: nur Balken, nie Buchstaben
  ctx.globalAlpha = 0.55;
  for (var k = 0; k < 5; k++) pRect(-24 + k*10, -18, 6, 3, '#33291c');
  ctx.globalAlpha = 1;
  ctx.restore();
}

/* Die Metallbank.
   ------------------------------------------------------------
   Sie steht in der Bildvorlage und ist der Ort, an dem er sitzt --
   schwarzes Gestell aus Rundstahl, Holzlatten dazwischen, die Farbe
   an den Kanten weg. Vorher standen hier weisse Plastikstuehle: die
   gibt es in ganz Dalmatien, aber auf ihnen sitzt niemand vierzehn
   Jahre lang denselben Nachmittag.
   ------------------------------------------------------------ */
function metallbank(x, y, dir){
  dir = dir || 1;
  ctx.save(); ctx.translate(psnap(x), psnap(y)); ctx.scale(dir, 1);
  var eisen = '#2a2724', holz = '#8a6038';
  /* Die Masse muessen zur Figur passen: sie ist 170 Einheiten hoch und
     damit etwa 1,75 m. Eine Sitzflaeche liegt bei 45 cm, also bei 44
     Einheiten -- im ersten Versuch lag sie bei 30 und die Bank sah aus
     wie ein Stapel Bretter auf dem Boden. */
  var sitz = -44, lehne = -94;

  /* Hintere Rahmenrohre, sie tragen die Lehne */
  pSegOutlined(-42, 0, -40, lehne, 6, eisen);
  pSegOutlined(42, 0, 40, lehne, 6, eisen);
  /* Lehnenlatten, drei mit Luecke */
  for (var r = 0; r < 3; r++)
    pKoerper(-38, lehne + 6 + r*14, 76, 9, mixHex(holz, '#3a2418', 0.10 + r*0.05));
  /* Strebe von der Lehne zur Sitzflaeche */
  pSegOutlined(-40, sitz - 4, -38, lehne + 8, 5, eisen);
  pSegOutlined(40, sitz - 4, 38, lehne + 8, 5, eisen);
  /* Sitzrahmen */
  pSegOutlined(-46, sitz, 46, sitz, 5, eisen);
  /* Sitzlatten, drei mit Luecke */
  for (var i = 0; i < 3; i++)
    pKoerper(-44, sitz - 2 + i*11, 88, 9, mixHex(holz, '#000000', i * 0.05));
  /* Vordere Beine, nur bis zur Sitzflaeche */
  pSegOutlined(-40, 0, -42, sitz + 4, 6, eisen);
  pSegOutlined(40, 0, 42, sitz + 4, 6, eisen);
  /* Querrohr unten, das die Beine verbindet */
  pSegOutlined(-40, -8, 40, -8, 4, eisen);
  /* Die Farbe ist an den Oberkanten weg */
  ctx.globalAlpha = 0.45;
  pRect(-44, sitz - 2, 88, 2, mixHex(holz, '#ffe0b0', 0.45));
  pRect(-38, lehne + 6, 76, 2, mixHex(holz, '#ffe0b0', 0.35));
  ctx.globalAlpha = 1;
  /* Fuesse */
  pRect(-46, -3, 10, 4, eisen); pRect(36, -3, 10, 4, eisen);
  ctx.restore();
}

/* Plastikstuhl und Holztisch der Terrasse. Der Stuhl ist weiss und
   billig und steht in ganz Dalmatien; genau deshalb gehoert er hin. */
function terrassenstuhl(x, y, dir){
  dir = dir || 1;
  ctx.save(); ctx.translate(psnap(x), psnap(y)); ctx.scale(dir, 1);
  pOutlineRect(-20, -22, 40, 7, '#dcd8ce', '#3a3830');
  pOutlineRect(-18, -56, 34, 36, '#e4e0d6', '#3a3830');
  for (var i = 0; i < 4; i++) pRect(-14, -52 + i*8, 26, 2, '#c2beb2');
  line(-17, -15, -20, 0, 3.4, '#3a3830');
  line(15, -15, 19, 0, 3.4, '#3a3830');
  line(-13, -16, -11, -2, 3, '#3a3830');
  ctx.restore();
}
function terrassentisch(x, y, w){
  w = w || 130;
  ctx.save(); ctx.translate(psnap(x), psnap(y));
  // Platte aus Stein, Kante sichtbar
  poly([-w/2, -46, w/2, -46, w/2 + 10, -34, -w/2 - 10, -34], '#cfc4a8', 2.6);
  pRect(-w/2 - 10, -36, w + 20, 5, '#a89a80');
  // Fuss
  pRect(-14, -34, 28, 32, '#8f8570');
  pRect(-24, -4, 48, 6, '#7a7060');
  ctx.restore();
}

/* Das Radio. Ein Kasten aus den Achtzigern, der 2018 noch laeuft, weil
   ihn niemand ersetzt hat. Die Skala leuchtet, wenn er an ist. */
function radioApparat(x, y, an, t){
  ctx.save(); ctx.translate(psnap(x), psnap(y));
  pOutlineRect(-30, -26, 60, 26, '#5a4a3a', '#1a120c');
  pRect(-26, -22, 30, 18, '#33291f');
  for (var i = 0; i < 5; i++) pRect(-24, -20 + i*4, 26, 2, '#4a3d2e');
  // Skala
  pRect(6, -22, 20, 8, an ? '#e8c26a' : '#3a3228');
  if (an){
    ctx.globalAlpha = 0.8;
    pRect(8 + ((t * 6) % 16), -21, 2, 6, '#c2422a');
    ctx.globalAlpha = 1;
  }
  ell(16, -8, 4, 4, '#b8a068', 1.4);
  ell(26, -8, 3, 3, '#b8a068', 1.4);
  // Antenne
  line(24, -26, 34, -58, 2, '#8a8a8e');
  if (an) pixelGlow(0, -14, 60, 40, '#ffd08a', 0.13, 3);
  ctx.restore();
}

/* ============================================================
   Sektion 08b  WAS PODACA VON GRIECHENLAND UNTERSCHEIDET
   ------------------------------------------------------------
   Weiss verputzte Waende, satte Ziegel, Zypressen und gruene
   Huegel ergeben irgendein Mittelmeer. Podaca liegt aber unter
   dem Biokovo, und das ist keine Landschaft, sondern eine Wand:
   1700 Meter grauer Kalk, die zwei Kilometer hinter dem Wasser
   fast senkrecht stehen. Dazu kommt, was hier sonst noch anders
   ist als auf einer Postkarte:

     · Die Haeuser sind aus Stein, nicht verputzt. Wo Putz ist,
       faellt er ab und der Stein kommt durch.
     · Die Ziegel sind ausgeblichen und nie alle gleich alt.
     · Im August ist nichts gruen. Alles ist grau und braun,
       ausser dem, was gegossen wird.
     · Es waechst Kiefer, nicht Zypresse. Zypressen stehen bei
       Friedhoefen und vor Kirchen, nicht am Hang.
     · Und Blumen stehen in dem, was gerade da war: in alten
       Oelkanistern.
   ============================================================ */

/* Das Biokovo. Eine graue Kalkwand mit waagerechten Schichten und
   Schuttfaechern am Fuss. Sie soll oben aus dem Bild laufen -- ein
   Berg, den man ganz sieht, ist kein Biokovo. */
function biokovo(x0, x1, basisY, hoehe, dunst, abfall){
  dunst = (dunst === undefined) ? 0.35 : dunst;
  /* abfall: wie weit der Kamm zum rechten Ende hin absinkt. Ein Berg,
     der an einer senkrechten Kante aufhoert, ist eine Kulisse. */
  abfall = (abfall === undefined) ? 0 : abfall;
  var b = x1 - x0, rr = seeded(1762);
  var grund = mixHex('#7c8188', '#b8c4cc', dunst);
  var tief  = mixHex('#5f666e', '#a8b6c0', dunst);
  var hell  = mixHex('#a8aca8', '#cdd6da', dunst);
  // Der Grat: unregelmaessig, aber steil
  var pts = [x0, basisY];
  var n = 14;
  for (var i = 0; i <= n; i++){
    var t = i / n;
    // Der Kamm faellt zum rechten Ende hin ab, wenn abfall gesetzt ist
    var senke = abfall ? (1 - abfall * Math.pow(Math.max(0, (t - 0.45) / 0.55), 1.6)) : 1;
    var kamm = basisY - hoehe * senke * (0.52 + 0.48 * Math.sin(t * 2.3 + 0.7) + (rr() - 0.5) * 0.16);
    pts.push(x0 + b * t, kamm);
  }
  pts.push(x1, basisY);
  poly(pts, grund, 0);
  // Waagerechte Schichten -- Kalk liegt in Baenken
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (var q = 2; q < pts.length; q += 2) ctx.lineTo(pts[q], pts[q+1]);
  ctx.closePath(); ctx.clip();
  for (var s = 0; s < 16; s++){
    var sy = basisY - hoehe * (s / 16) - 4;
    ctx.globalAlpha = 0.10 + rr() * 0.12;
    ctx.fillStyle = (s % 2) ? hell : tief;
    ctx.fillRect(psnap(x0), psnap(sy), psnap(b), psnap(3 + rr() * 5));
  }
  // Schluchten, die von oben herunterlaufen
  for (var g = 0; g < 9; g++){
    var gx = x0 + rr() * b;
    ctx.globalAlpha = 0.16 + rr() * 0.14;
    ctx.fillStyle = tief;
    for (var d = 0; d < 12; d++)
      ctx.fillRect(psnap(gx + Math.sin(d * 0.7) * 9), psnap(basisY - hoehe * 0.9 + d * hoehe / 12),
                   psnap(5 + rr() * 7), psnap(hoehe / 12 + 2));
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // Schuttfaecher am Fuss: der Berg bricht ab und liegt unten
  for (var f = 0; f < 7; f++){
    var fx = x0 + (f + 0.5) * b / 7 + (rr() - 0.5) * 40;
    var fw = 40 + rr() * 70, fh = 14 + rr() * 22;
    ctx.globalAlpha = 0.5;
    poly([fx - fw/2, basisY, fx + fw/2, basisY, fx + fw*0.18, basisY - fh, fx - fw*0.18, basisY - fh],
         mixHex(hell, '#c8c0ac', 0.4), 0);
    ctx.globalAlpha = 1;
  }
}

/* Aleppokiefer. Krummer, kahler Stamm, die Krone flach und
   schirmfoermig, dunkel und blaugruen. Sie steht hier ueberall am
   Hang -- und sie ist der Baum, den man mit Zypresse verwechselt,
   wenn man nur Postkarten kennt. */
function pinie(x, y, s, seed){
  s = s || 1;
  var rr = seeded(seed || 5);
  ctx.save(); ctx.translate(psnap(x), psnap(y)); ctx.scale(s, s);
  var neig = (rr() - 0.5) * 16;
  pSegOutlined(0, 0, neig * 0.5, -34, 9, '#6a5a4a');
  pSegOutlined(neig * 0.5, -34, neig, -62, 7, '#6f5f4e');
  // Zwei, drei Aeste, die waagerecht abgehen
  pSeg(neig, -58, neig - 26, -70, 4, '#6a5a4a');
  pSeg(neig, -62, neig + 24, -72, 4, '#6a5a4a');
  // Die Krone: flache Polster, nicht rund
  var kr = ['#3f5647', '#48624f', '#354a3e'];
  var polster = [[-30,-74,30,12],[6,-80,32,13],[-10,-88,30,11],[24,-70,22,10],[-38,-66,22,9]];
  for (var i = 0; i < polster.length; i++){
    var p = polster[i];
    pRect(neig + p[0], p[1], p[2], p[3], kr[i % 3]);
    pRect(neig + p[0] + 4, p[1] - 4, p[2] - 10, 6, kr[(i + 1) % 3]);
  }
  ctx.globalAlpha = 0.35;
  pRect(neig - 32, -68, 66, 4, '#2a3a30');
  ctx.globalAlpha = 1;
  ctx.restore();
}

/* Agave. Eine Rosette steifer, grauer Blaetter. Sie steht an jeder
   zweiten Mauer und wird nie gepflanzt -- sie ist einfach da. */
function agave(x, y, s){
  s = s || 1;
  ctx.save(); ctx.translate(psnap(x), psnap(y)); ctx.scale(s, s);
  var winkel = [-1.5, -1.15, -0.8, -0.45, -0.1, -1.9, -2.25, -2.6, -3.0];
  for (var i = 0; i < winkel.length; i++){
    var a = winkel[i], l = 22 + (i % 3) * 9;
    var ex = Math.cos(a) * l, ey = Math.sin(a) * l * 0.9;
    pSeg(0, 0, ex, ey, 6 - (i % 2), i % 2 ? '#7d8a6e' : '#6e7c62');
    pRect(ex, ey, 2, 2, '#8a7a5c');
  }
  pRect(-5, -4, 10, 6, '#5f6a52');
  ctx.restore();
}

/* Blumenkuebel, wie sie hier wirklich stehen: ein Tontopf, ein
   aufgeschnittener Oelkanister, ein alter Eimer. Nie dreimal
   dasselbe -- das ist der Unterschied zwischen einem Haus, in dem
   jemand wohnt, und einer Ferienanlage. */
function blumentopf(x, y, art, seed){
  var rr = seeded(seed || 9);
  ctx.save(); ctx.translate(psnap(x), psnap(y));
  if (art === 'kanister'){
    pOutlineRect(-15, -30, 30, 30, '#c9c4b0', SPRITE_INK);
    pRect(-15, -30, 30, 4, '#9a958a');
    pRect(-11, -24, 12, 9, '#8a3a2e');   // verblichenes Etikett
    pRect(4, -20, 7, 5, '#5a6a7a');
  } else if (art === 'eimer'){
    poly([-13, 0, 13, 0, 15, -24, -15, -24], '#7a8a90', 2.2);
    pRect(-15, -26, 30, 4, '#8a9aa0');
    ctx.strokeStyle = '#5a6a70'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -26, 14, 3.4, 6.0); ctx.stroke();
  } else {
    poly([-14, 0, 14, 0, 11, -26, -11, -26], '#a8623c', 2.2);
    pRect(-14, -28, 28, 5, '#b06a42');
    ctx.globalAlpha = 0.3;
    pRect(-12, -14, 24, 8, '#7a4a30');   // Kalkrand vom Giessen
    ctx.globalAlpha = 1;
  }
  // Was drin waechst: Geranie, Basilikum oder halb vertrocknet
  var gruen = ['#4a6a3e', '#587a46', '#3f5c36'];
  for (var i = 0; i < 6; i++){
    var bx = -11 + (i % 3) * 11 + (rr() - 0.5) * 4;
    var by = -30 - Math.floor(i / 3) * 8 - rr() * 6;
    ell(bx, by, 7 + rr() * 3, 5 + rr() * 2, gruen[i % 3], 0);
  }
  if (rr() > 0.35){
    ell(-6 + rr() * 12, -44 - rr() * 6, 5, 4, '#b8352e', 0);
    ell(2 + rr() * 8, -40 - rr() * 5, 4, 3, '#c2483a', 0);
  }
  ctx.restore();
}
