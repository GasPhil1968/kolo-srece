
/* ============================================================
   Sektion 09  HINTERGRUENDE · GEGENWART
   ============================================================ */
var radioAn = false;
var moewen = [];
for (var mi = 0; mi < 5; mi++) moewen.push({ x:Math.random()*900, y:130+Math.random()*70, s:0.5+Math.random()*0.6, p:Math.random()*6 });

/* Das Meer hinter der Bruestung. Eigene Fernlage: es soll beim Scrollen
   zurueckbleiben, weil es weiter weg ist als alles andere im Bild. */
function terrasseMeer(T){
  var x0 = 380, x1 = 1000;
  bandV(x0, 96, x1-x0, 84, [[0,'#8fbdd8'],[0.6,'#c4dae4'],[1,'#e2ecec']], 6);
  /* Gegenueber liegt Hvar: eine lange, flache, graublaue Insel, die
     fast den ganzen Horizont einnimmt. Keine Bucht, keine Halbinsel,
     keine Kykladenfelsen -- ein Strich mit einem Buckel in der Mitte,
     und im Dunst sieht man ihn manchmal gar nicht. */
  ctx.globalAlpha = 0.42;
  poly([x0,182, 470,175, 610,166, 700,163, 810,170, 900,167, x1,174, x1,192, x0,192], '#8798a4', 0);
  ctx.globalAlpha = 0.22;
  poly([560,170, 700,158, 840,168, 840,186, 560,186], '#7c8d9c', 0);
  ctx.globalAlpha = 1;
  /* Das Wasser. Ueber dem weissen Kiesgrund ist es dicht am Ufer
     tuerkis und wird nach draussen schlagartig tief. Dieser harte
     Farbsprung ist das Erkennungszeichen dieser Kueste. */
  bandV(x0, 190, x1-x0, 96, [[0,'#2f6f92'],[0.5,'#27607f'],[1,'#20536f']], 5);
  bandV(x0, 284, x1-x0, 44, [[0,'#3f8fa4'],[0.55,'#63b4b4'],[1,'#8fd0c4']], 5);
  // Der Kiesstreifen darunter, fast weiss
  bandV(x0, 326, x1-x0, 28, [[0,'#c8ccc0'],[0.5,'#dcdccc'],[1,'#c4c4b4']], 4);
  var rr = seeded(2018);
  for (var k = 0; k < 60; k++){
    ctx.globalAlpha = 0.3 + rr()*0.3;
    ctx.fillStyle = rr() > 0.5 ? '#eeeade' : '#a8a898';
    ctx.fillRect(psnap(x0 + rr()*(x1-x0)), psnap(328 + rr()*24), psnap(3+rr()*5), 2);
  }
  ctx.globalAlpha = 1;
  // Glitzern, nur auf dem tiefen Wasser
  for (var i = 0; i < 70; i++){
    var gx = x0 + rr()*(x1-x0), gy = 196 + rr()*86;
    var f = 0.35 + 0.65*Math.abs(Math.sin(T*1.4 + gx*0.05 + gy*0.02));
    ctx.globalAlpha = f * 0.42;
    ctx.fillStyle = '#dff0f4';
    ctx.fillRect(psnap(gx), psnap(gy), 4 + (rr()>0.7?4:0), 2);
  }
  ctx.globalAlpha = 1;
  for (var m = 0; m < moewen.length; m++){
    var mv = moewen[m];
    var mx = x0 + ((mv.x + T*11*mv.s) % (x1-x0));
    var my = mv.y + Math.sin(T*0.8 + mv.p)*7;
    ctx.fillStyle = '#f0f4f4';
    var fl = Math.sin(T*4 + mv.p)*3;
    ctx.fillRect(psnap(mx), psnap(my), 5, 2);
    ctx.fillRect(psnap(mx-5), psnap(my-fl), 5, 2);
    ctx.fillRect(psnap(mx+5), psnap(my+fl), 5, 2);
  }
}

function terrasseVordergrund(){
  /* Die Weinreben ueber der Pergola. Sie liegen als Verdeckungsebene
     vor allem anderen -- wer unter ihnen durchgeht, bekommt ihren
     Schatten aufs Gesicht, und genau das macht diese Terrasse aus. */
  var rr = seeded(88);
  ctx.save();
  for (var i = 0; i < 22; i++){
    var bx = 40 + i*58 + rr()*20, by = 62 + rr()*26;
    var g = rr() > 0.5 ? '#3f6a34' : '#4f7a3e';
    pRect(bx-16, by, 32, 14, g);
    pRect(bx-8, by-8, 18, 12, g);
    pRect(bx+8, by+4, 14, 10, mixHex(g,'#000000',0.2));
  }
  // Ranken
  ctx.strokeStyle = '#5a4a34'; ctx.lineWidth = 3;
  for (var k = 0; k < 5; k++){
    ctx.beginPath();
    for (var x = 0; x <= 1280; x += 20) ctx.lineTo(x, 74 + k*8 + Math.sin(x*0.02 + k)*5);
    ctx.stroke();
  }
  // Trauben
  for (var tb = 0; tb < 7; tb++){
    var tx = 120 + tb*170, ty = 96;
    for (var b2 = 0; b2 < 9; b2++)
      ell(tx + (b2%3)*7 - 7, ty + Math.floor(b2/3)*7, 4, 4, '#4a3560', 0);
  }
  ctx.restore();
}

function drawTerrasse(T){
  var rr = seeded(2018);
  // Himmel
  bandV(0, 0, ROOMW, 200, [[0,'#5f9fc4'],[0.6,'#9ccadd'],[1,'#d8e8ec']], 7);
  /* Hauswand links. Kein weisser Putz: geschnittener Kalkstein, wie
     ihn hier jedes Haus hat, das aelter ist als der Tourismus. Wo
     spaeter verputzt wurde, ist der Putz abgefallen und der Stein
     kommt wieder durch -- das ist der eigentliche Wandcharakter
     dieser Kueste und der groesste Unterschied zu jedem weiss
     gekalkten Inselhaus in der Aegaeis. */
  trockenmauer(0, 0, 520, 380, 17, '#c8bda2', '#8e8574');
  // Putzreste in einem schmutzigen Ocker, in unregelmaessigen Feldern
  var putz = [[0,40,210,170],[236,86,180,140],[62,246,300,110],[380,20,140,120]];
  for (var pf = 0; pf < putz.length; pf++){
    ctx.globalAlpha = 0.82;
    bandV(putz[pf][0], putz[pf][1], putz[pf][2], putz[pf][3],
          [[0,'#cfc2a4'],[0.5,'#c2b394'],[1,'#ab9d80']], 5);
    ctx.globalAlpha = 1;
    // Abbruchkante unten, wo der Putz abgeplatzt ist
    ctx.globalAlpha = 0.5;
    for (var ab = 0; ab < putz[pf][2]; ab += 8)
      pRect(putz[pf][0] + ab, putz[pf][1] + putz[pf][3] - Math.round(rr()*10),
            8, Math.round(rr()*10) + 2, '#a1997f');
    ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = 0.12;
  for (var i = 0; i < 20; i++){
    var px = rr()*520, py = 40 + rr()*300, pr = 14 + rr()*40;
    pixelBlob(px-pr, py, pr*2, pr*0.7, '#6a5f4a', 0.5, rr);
  }
  ctx.globalAlpha = 1;
  ziegeldach(-20, -6, 560, 44, '#96674c', 3);
  // Haustuer
  pOutlineRect(140, 214, 96, 158, '#4a6a52', '#1a1a16');
  for (var d = 0; d < 6; d++) pRect(146, 220 + d*26, 84, 3, '#3a5a42');
  pRect(146, 220, 84, 60, '#3f5f48');
  ell(224, 296, 4, 4, '#c9a860', 1.4);
  // Fenster mit Laden
  pOutlineRect(310, 190, 118, 108, '#2a3038', '#1a1a16');
  pRect(316, 196, 106, 96, '#3f5060');
  ctx.globalAlpha = 0.35; pRect(316, 196, 50, 96, '#9ac0d8'); ctx.globalAlpha = 1;
  fensterladen(302, 186, 134, 116, '#4a6a52', true);
  // Kabel und Stromzaehler, das Ehrlichste am Haus
  line(240, 178, 500, 168, 2, '#2a2620');
  pOutlineRect(252, 152, 26, 22, '#b8b0a0', '#2a2620');

  // Bruestung zum Meer (Mitte), Trockenmauer
  trockenmauer(520, 264, 350, 90, 12, '#e8dcc0', '#9a8f76');
  pRect(psnap(514), psnap(258), psnap(362), 8, '#efe6ce');
  /* Was auf der Bruestung steht, ist nie ein Satz: ein Tontopf, ein
     aufgeschnittener Oelkanister, ein alter Eimer. */
  blumentopf(560, 258, 'topf', 3);
  blumentopf(646, 258, 'kanister', 7);
  blumentopf(730, 258, 'eimer', 11);
  blumentopf(816, 258, 'topf', 13);
  // Und eine Agave, die niemand gepflanzt hat
  agave(880, 262, 0.72);

  /* Rechte Seite: die Garage. Sie ist juenger als das Haus, also
     Betonstein statt Kalkstein -- und darum grauer und langweiliger.
     Auf dem Dach stehen die Bewehrungseisen fuer das Stockwerk, das
     nie gebaut wurde. Auch das gehoert hierher. */
  bandV(870, 0, 410, 380, [[0,'#bdb7a4'],[0.5,'#aca696'],[1,'#96907f']], 6);
  ctx.globalAlpha = 0.35;
  for (var bs = 0; bs < 9; bs++) pRect(870, 30 + bs*40, 410, 3, '#8a8474');
  for (var bv = 0; bv < 6; bv++) pRect(884 + bv*68, 0, 3, 380, '#8a8474');
  ctx.globalAlpha = 1;
  pRect(860, 26, 430, 12, '#a8a292');
  for (var eb = 0; eb < 9; eb++){
    var ebx = 900 + eb*42;
    line(ebx, 26, ebx + Math.sin(eb*2.1)*5, -12 - (eb%3)*9, 2.4, '#7a6248');
  }
  pOutlineRect(1050, 196, 170, 164, '#5a5f62', '#1a1a16');
  for (var g2 = 0; g2 < 7; g2++) pRect(1056, 202 + g2*22, 158, 4, '#4a4f52');
  pRect(1122, 280, 26, 8, '#8a8a86');
  // Rostspuren am Tor
  ctx.globalAlpha = 0.4;
  pixelBlob(1060, 320, 40, 30, '#8a5a34', 0.6, rr);
  pixelBlob(1180, 250, 34, 40, '#7a4a2c', 0.5, rr);
  ctx.globalAlpha = 1;
  /* Der Feigenbaum. "Groesser als ich gedacht habe", sagt M. Beim
     zweiten Hinsehen ist er es nicht. */
  feigenbaum(940, 384, 1.0 - unsch('feige') * 0.14, T);

  // Boden: Betonplatten mit Fugen, sonnenverbrannt
  bandV(0, 352, ROOMW, 118, [[0,'#c4b89c'],[0.5,'#b3a68a'],[1,'#9e9276']], 6);
  /* Die Bodenplatten. Zwei Dinge unterscheiden einen Boden von einer
     Wand, und beide sind hier noetig: die Reihen werden nach vorn
     hoeher, weil sie naeher sind, und der Kontrast bleibt flach,
     weil das Licht von oben kommt und nicht von der Seite. Mit
     kraeftigen Kanten sah derselbe Boden aus wie eine gekachelte
     Wand, die zufaellig unten liegt. */
  var prr = seeded(77);
  var pyy = 352;
  while (pyy < 470){
    var tiefe = (pyy - 352) / 118;                 // 0 hinten, 1 vorn
    var ph = Math.round(9 + tiefe * 16);
    var pxx = -30 - prr() * 40;
    while (pxx < ROOMW){
      var pw = Math.round((44 + prr() * 34) * (0.72 + tiefe * 0.6));
      var pton = mixHex('#9c9074', '#bcb094', 0.35 + prr() * 0.55);
      ctx.fillStyle = pton;
      ctx.fillRect(psnap(pxx), psnap(pyy), psnap(pw - 2), psnap(ph - 2));
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = tonVon(pton, 'licht');
      ctx.fillRect(psnap(pxx), psnap(pyy), psnap(pw - 2), 2);
      ctx.fillStyle = tonVon(pton, 'schatten');
      ctx.fillRect(psnap(pxx), psnap(pyy + ph - 4), psnap(pw - 2), 2);
      ctx.globalAlpha = 1;
      if (prr() > 0.9){
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = tonVon(pton, 'schatten');
        ctx.fillRect(psnap(pxx + 6 + prr()*(pw-18)), psnap(pyy + 3 + prr()*(ph-8)), 4, 2);
        ctx.globalAlpha = 1;
      }
      pxx += pw;
    }
    pyy += ph;
  }
  // Gras in den Fugen, dort wo nie jemand geht
  for (var fg = 0; fg < 22; fg++){
    var fx2 = prr() * ROOMW, fy2 = 356 + prr() * 100;
    ctx.fillStyle = prr() > 0.5 ? '#6a7450' : '#7a8258';
    ctx.fillRect(psnap(fx2), psnap(fy2), 2, psnap(3 + prr()*4));
    ctx.fillRect(psnap(fx2 + 3), psnap(fy2 + 1), 2, psnap(2 + prr()*3));
  }
  /* Die Bruestung wirft einen Schatten auf den Boden. Mauer und
     Boden sind aus demselben Kalkstein, und ohne diese Kante gehen
     sie ineinander ueber. */
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#3a3226';
  ctx.fillRect(psnap(506), psnap(352), psnap(378), 9);
  ctx.globalAlpha = 0.14;
  ctx.fillRect(psnap(506), psnap(361), psnap(378), 7);
  ctx.globalAlpha = 1;
  // Schatten der Pergola auf dem Boden: das eigentliche Motiv
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#2a2418';
  for (var s2 = 0; s2 < 18; s2++){
    var sx = 30 + s2*70 + Math.sin(T*0.4 + s2)*4;
    ctx.fillRect(psnap(sx), 352, 26, 118);
  }
  ctx.globalAlpha = 1;

  // Moebel
  terrassentisch(640, 448, 140);
  metallbank(548, 450, 1);
  terrassenstuhl(748, 446, -1);
  radioApparat(352, 420, radioAn, T);
  // Auf dem Tisch: Kaffeetasse, Aschenbecher, Zeitung
  poly([604, 402, 626, 402, 623, 386, 607, 386], '#e6e0d2', 2);
  ell(615, 386, 8, 3, '#3a2a18', 0);
  ell(668, 398, 14, 5, '#8a8a86', 1.8);
  ctx.globalAlpha = 0.7; poly([690, 400, 726, 400, 722, 392, 686, 392], '#d8d4c4', 1.4); ctx.globalAlpha = 1;

  // Die Kiste, sobald sie aus der Garage geholt wurde
  if (FLAG.kisteAufTerrasse){
    holzkiste(830, 456, 1.0, FLAG.kisteOffen ? 'offen' : (FLAG.kisteAngefasst ? 'angefasst' : 'zu'));
  }
  // Erinnerungsstuecke, die sich im Lauf des Spiels ansammeln.
  // Die Terrasse wird damit Stueck fuer Stueck zur begehbaren Biographie.
  zeigeAndenken(T);

  // Die Katze
  var katzenBlick = G.katzeZeigt > 0 ? G.katzeZiel : null;
  katze(470, 448, T, katzenBlick, G.katzeZeigt > 0);

  // Sonnenschein von rechts ueber dem Meer
  pixelGlow(1180, 90, 320, 220, '#ffe0a0', 0.16, 4);
}

/* Dynamische Ebene ueber dem gemalten Terrassenbild. Der teure Raum bleibt
   statisch; nur Zustandsaenderungen und kleine Lebenszeichen werden pro Bild
   gezeichnet. */
function drawTerrasseBildOverlay(T){
  if (radioAn){
    ctx.globalAlpha = 0.8 + Math.sin(T * 5) * 0.16;
    pRect(279, 303, 4, 3, '#e8b84a');
    ctx.globalAlpha = 1;
  }
  if (FLAG.kisteAufTerrasse)
    holzkiste(830, 456, 1.0, FLAG.kisteOffen ? 'offen' : (FLAG.kisteAngefasst ? 'angefasst' : 'zu'));

  /* Erinnerungsstuecke sammeln sich sichtbar auf Tisch und Mauer. */
  if (FLAG.kap1Fertig){ pSeg(790, 270, 806, 250, 3, '#6a5a3e'); ell(804,250,7,4,'#66704c',1); }
  if (FLAG.kap2Fertig){ pSeg(815, 270, 815, 242, 2, '#8a7a5c'); poly([816,242,838,247,816,254], '#c22a2a', 0); }
  if (FLAG.kap3Fertig){ pOutlineRect(360, 300, 34, 10, '#eef0ee', '#1a1a16'); pRect(360,308,34,4,'#141c30'); }
  if (FLAG.kap4Fertig){ ell(158,248,5,5,'#c9a06a',1); pRect(157,252,3,12,'#c9a06a'); }
  if (FLAG.kap5Fertig) pOutlineRect(266, 306, 24, 15, '#d8d4c4', '#2a2620');
  if (FLAG.kap6Fertig){ pOutlineRect(292,306,22,13,'#e8b83a','#2a2620'); ell(320,310,4,4,'#c9c4b0',1); }
  if (FLAG.kap7Fertig) for (var z=0; z<4; z++) pRect(404+z*3,276+z*14,4,16,z%2?'#d8c060':'#e8d484');

  /* Die Katze ist Teil des Bildes. Beim Hinweis bekommt sie nur ein kleines,
     atmendes Aufmerksamkeitszeichen; das eigentliche Ziel markiert drawHinweis. */
  if (G.katzeZeigt > 0){
    ctx.globalAlpha = 0.35 + Math.sin(T * 4) * 0.15;
    ell(967, 392, 32, 9, '#ffd06a', 0);
    ctx.globalAlpha = 1;
  }
}

/* Was M. erinnert hat, steht danach hier. Jedes Kapitel legt genau ein
   Stueck ab -- der Spieler sieht seinen Fortschritt, ohne dass ihm
   irgendwo eine Liste gezeigt wird. */
function zeigeAndenken(T){
  /* Kapitel 1: der Wacholderzweig, auf der Mauer. Er ist laengst
     trocken, und er riecht immer noch. */
  if (FLAG.kap1Fertig){
    pSeg(544, 254, 556, 232, 3, '#6a5a3e');
    ell(552, 234, 8, 5, '#6a7250', 1.2);
    ell(560, 240, 6, 4, '#5c6644', 1.2);
    ell(546, 242, 5, 4, '#6a7250', 1.2);
    ell(556, 228, 2.4, 2.4, '#5b7fa6', 0);
  }
  // Kapitel 2: das Papierfaehnchen, in einem Glas
  if (FLAG.kap2Fertig){
    pOutlineRect(586, 236, 14, 22, 'rgba(210,230,235,0.5)', '#8a9aa0');
    pSeg(593, 236, 593, 208, 2, '#8a7a5c');
    poly([594, 208, 616, 213, 594, 220], '#c22a2a', 0);
    pRect(600, 212, 5, 5, '#e8e4d4');
  }
  // Kapitel 3: die Matrosenmuetze, auf der Banklehne
  if (FLAG.kap3Fertig){
    pOutlineRect(514, 356, 34, 10, '#eef0ee', '#1a1a16');
    pRect(514, 364, 34, 4, '#141c30');
  }
  // Kapitel 4: der Wohnungsschluessel, am Nagel neben der Tuer
  if (FLAG.kap4Fertig){
    pRect(psnap(258), psnap(226), 3, 3, '#8a8a86');
    ell(259, 236, 5, 5, '#c9a06a', 1.4);
    pRect(258, 240, 3, 12, '#c9a06a');
    pRect(258, 249, 6, 3, '#c9a06a');
  }
  // Kapitel 5: der Werksausweis, unter dem Aschenbecher
  if (FLAG.kap5Fertig){
    pOutlineRect(650, 392, 22, 14, '#d8d4c4', '#2a2620');
    pRect(653, 395, 7, 8, '#7a8a94');
    pRect(662, 396, 8, 2, '#5a5a54'); pRect(662, 400, 6, 2, '#5a5a54');
  }
  // Kapitel 6: die Telefonkarte und drei Muenzen auf dem Tisch
  if (FLAG.kap6Fertig){
    pOutlineRect(596, 396, 20, 12, '#e8b83a', '#2a2620');
    pRect(599, 399, 6, 6, '#c9a038');
    ell(682, 384, 4, 4, '#c9c4b0', 1.2);
    ell(692, 388, 4, 4, '#c9c4b0', 1.2);
  }
  // Kapitel 7: der Zollstock des Hausbaus, an der Wand
  if (FLAG.kap7Fertig){
    for (var z = 0; z < 4; z++)
      pRect(psnap(464 + z*3), psnap(300 + z*14), 4, 16, z%2 ? '#d8c060' : '#e8d484');
  }
}

/* ------------------------------------------------------------
   Die Garage. Dunkel, voll, und nichts davon war je eine
   Entscheidung -- es hat sich angesammelt.
   ------------------------------------------------------------ */
function drawGarage(T){
  var rr = seeded(1942);
  // Rueckwand: Beton, feucht
  bandV(0, 0, 1280, 470, [[0,'#3e3a34'],[0.5,'#4a443c'],[1,'#332e28']], 6);
  ctx.globalAlpha = 0.14;
  for (var i = 0; i < 20; i++){
    var bx = rr()*1280, by = 30 + rr()*300, br = 20 + rr()*50;
    pixelBlob(bx-br, by, br*2, br*0.6, '#1e1a16', 0.6, rr);
  }
  ctx.globalAlpha = 1;
  // Deckenbalken
  for (var b = 0; b < 8; b++) pRect(0 + b*170, 0, 26, 62, '#2a251f');
  pRect(0, 56, 1280, 8, '#241f1a');
  // Das offene Tor links: das einzige Licht im Raum
  pOutlineRect(60, 120, 150, 240, '#e8dcbc', '#1a1610');
  bandV(64, 124, 142, 232, [[0,'#fff0cc'],[0.6,'#e8d4a4'],[1,'#c9b482']], 5);
  ctx.globalAlpha = 0.5;
  poly([206, 130, 470, 300, 470, 460, 70, 460, 70, 350], '#ffe6b0', 0);
  ctx.globalAlpha = 1;
  // Regal rechts der Tuer
  pOutlineRect(330, 150, 190, 210, '#4a3f30', '#181410');
  for (var s = 0; s < 4; s++){
    pRect(334, 156 + s*52, 182, 6, '#5a4c38');
    // Kram auf jedem Brett
    for (var k = 0; k < 5; k++){
      var kx = 342 + k*36 + rr()*8, kh = 12 + rr()*22;
      var farbe = ['#7a6a4a','#5a6a72','#8a5a3a','#4a5a44','#7a7266'][Math.floor(rr()*5)];
      pRect(kx, 156 + s*52 - kh, 22, kh, farbe);
      pRect(kx, 156 + s*52 - kh, 22, 3, mixHex(farbe,'#ffffff',0.2));
    }
  }
  // Fischernetze an der Wand
  ctx.strokeStyle = 'rgba(180,190,170,0.34)'; ctx.lineWidth = 1.4;
  for (var n = 0; n < 14; n++){
    ctx.beginPath();
    ctx.moveTo(540 + n*8, 120);
    ctx.lineTo(520 + n*10, 300 + Math.sin(n)*14);
    ctx.stroke();
  }
  for (var n2 = 0; n2 < 8; n2++){
    ctx.beginPath();
    ctx.moveTo(534, 130 + n2*22);
    ctx.lineTo(660, 138 + n2*22);
    ctx.stroke();
  }
  // Korken am Netz
  for (var kk = 0; kk < 9; kk++) ell(548 + kk*13, 138 + (kk%3)*46, 4, 6, '#b8925c', 1.2);

  // Boden: Beton mit Oelflecken
  bandV(0, 346, 1280, 124, [[0,'#4a443c'],[0.5,'#3e3830'],[1,'#2e2a24']], 5);
  ctx.globalAlpha = 0.4;
  pixelBlob(560, 400, 130, 40, '#1a1614', 0.7, rr);
  pixelBlob(300, 430, 90, 26, '#1c1816', 0.5, rr);
  ctx.globalAlpha = 1;

  // Die Tomos: ein Moped, das seit zwanzig Jahren fast faehrt
  ctx.save(); ctx.translate(600, 440);
  ell(-40, -14, 16, 16, '#1c1a18', 2.6); ell(42, -14, 16, 16, '#1c1a18', 2.6);
  ell(-40, -14, 6, 6, '#8a8a86', 1.4); ell(42, -14, 6, 6, '#8a8a86', 1.4);
  poly([-38, -34, 30, -38, 44, -22, -30, -18], '#8a3a2e', 2.4);
  pRect(-14, -56, 34, 20, '#6a2f26');
  pRect(-20, -60, 30, 8, '#4a4a4e');
  line(20, -56, 44, -70, 4, '#7a7a7e');
  line(38, -74, 52, -68, 3.4, '#4a4438');
  ctx.restore();

  // Die Plane rechts, und was darunter liegt
  if (!FLAG.planeWeg){
    poly([700, 452, 880, 452, 866, 384, 716, 388], '#5a6a5e', 2.6);
    ctx.globalAlpha = 0.3;
    poly([716, 388, 866, 384, 858, 402, 722, 406], '#8a9a8e', 0); ctx.globalAlpha = 1;
    pRect(760, 386, 60, 5, '#4a5a4e');
  } else if (!FLAG.kisteAufTerrasse){
    holzkiste(790, 452, 1.0, FLAG.kisteAngefasst ? 'angefasst' : 'zu');
  }
  /* Die rechte Haelfte war der Bootsschuppen, bevor die Garage eine
     Garage war. Was hier steht, steht nur da: kein Hotspot, nichts
     zum Anfassen. Es fuellt das Bild auf breiten Geraeten, und auf
     schmalen sieht man es gar nicht erst. */
  pOutlineRect(956, 370, 224, 16, '#6a5638', '#1c1610');   // Werkbank
  pRect(968, 386, 13, 64, '#4a3c28'); pRect(1154, 386, 13, 64, '#4a3c28');
  for (var w1 = 0; w1 < 6; w1++){
    var wh = 9 + (w1 % 3) * 11;
    pRect(974 + w1*34, 370 - wh, 19, wh,
          ['#7a6a4a','#5a6a72','#8a5a3a','#4a5a44','#7a7266','#6a5a3a'][w1]);
  }
  for (var t1 = 0; t1 < 5; t1++)                            // Werkzeug an der Wand
    pSeg(986 + t1*42, 244, 986 + t1*42, 292 + (t1%2)*26, 3, '#4a4438');
  for (var r1 = 0; r1 < 4; r1++)                            // Tauwerk am Nagel
    ell(1116, 226 + r1*9, 27 - r1*2, 7, '#9a8a66', 1.6);
  pOutlineRect(1028, 410, 34, 40, '#4a5a44', '#161a14');    // Kanister
  pRect(1038, 402, 12, 10, '#3a4a36');
  pSeg(1216, 450, 1182, 178, 7, '#8a7450');                 // zwei Riemen in der Ecke
  pSeg(1240, 450, 1212, 184, 7, '#7a6644');
  pRect(1174, 178, 18, 48, '#93794f'); pRect(1204, 184, 16, 44, '#836b45');

  // Staub im Lichtkegel
  ctx.globalAlpha = 0.16;
  for (var st = 0; st < 40; st++){
    var sx2 = 90 + ((st*37 + T*9) % 340), sy2 = 150 + ((st*61 + T*5) % 280);
    ctx.fillStyle = '#ffeec8';
    ctx.fillRect(psnap(sx2), psnap(sy2), 2, 2);
  }
  ctx.globalAlpha = 1;
  pixelGlow(190, 250, 260, 240, '#ffe0a0', 0.22, 5);
}
