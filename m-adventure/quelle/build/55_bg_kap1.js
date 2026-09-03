
/* ============================================================
   Sektion 11b  HINTERGRUENDE · WEIDE UND HAUS
   ============================================================ */

/* Ziege. Vier Rechtecke, zwei Hoerner und ein Euter -- mehr braucht
   ein Tier nicht, das man aus dreissig Metern zaehlen soll. */
function ziege(x, y, s, t, seed, imSchatten){
  s = s || 1;
  var rr = seeded(seed || 3);
  ctx.save(); ctx.translate(psnap(x), psnap(y)); ctx.scale(s, s);
  var kau = Math.sin(t * 2.4 + seed) * 1.2;
  var fell = imSchatten ? '#6a6258' : (rr() > 0.5 ? '#d8cdb4' : '#b8ab92');
  var dunkel = mixHex(fell, '#000000', 0.35);
  // Rumpf
  pOutlineRect(-22, -30, 44, 22, fell, SPRITE_INK);
  // Beine
  pRect(-16, -10, 5, 12, dunkel); pRect(-6, -10, 5, 12, dunkel);
  pRect(6, -10, 5, 12, dunkel);  pRect(15, -10, 5, 12, dunkel);
  // Hals und Kopf, gesenkt zum Grasen
  pSeg(-18, -26, -32, -16 + kau, 8, fell);
  pOutlineRect(-42, -22 + kau, 20, 13, fell, SPRITE_INK);
  // Hoerner nach hinten
  pSeg(-30, -22 + kau, -22, -34 + kau, 3, '#8a7a5c');
  pSeg(-26, -22 + kau, -18, -33 + kau, 3, '#8a7a5c');
  // Auge und Bart
  pRect(-38, -18 + kau, 3, 3, '#1a1610');
  pRect(-40, -10 + kau, 4, 6, mixHex(fell,'#ffffff',0.3));
  // Schwanz
  pRect(20, -30, 5, 7, fell);
  ctx.restore();
}

/* Das Tal, von oben. Es liegt so weit unten, dass man die Strasse
   darin fuer einen Kratzer haelt. */
function weideTal(T){
  var x0 = -200, x1 = 1500;
  bandV(x0, 120, x1-x0, 74, [[0,'#9db4bd'],[0.6,'#b8c4bc'],[1,'#cdd2c0']], 6);
  ctx.globalAlpha = 0.5;
  poly([x0,196, 200,158, 520,190, 860,150, 1200,186, x1,160, x1,220, x0,220], '#8b9686', 0);
  ctx.globalAlpha = 1;
  bandV(x0, 214, x1-x0, 116, [[0,'#8d9a78'],[0.5,'#7a8767'],[1,'#697655']], 6);
  // Die Strasse unten im Tal
  var ry = 286;
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#d8cfb4';
  for (var d = x0; d < x1; d += 8) ctx.fillRect(psnap(d), psnap(ry + Math.sin(d*0.006)*8), 8, 4);
  ctx.globalAlpha = 1;
  // Ein paar Daecher: das Nachbardorf
  var rr = seeded(1953);
  for (var h = 0; h < 16; h++){
    var hx = 300 + rr()*800, hy = 250 + rr()*54;
    ctx.globalAlpha = 0.6;
    pRect(hx, hy, 12, 8, '#a89880');
    pRect(hx-2, hy-4, 16, 5, '#8a5a42');
    ctx.globalAlpha = 1;
  }
}

/* ------------------------------------------------------------
   Die Weide. Kalk, Wacholder, Ziegen und ein Vater, der auf
   einem Stein sitzt und einen Grashalm kaut.
   ------------------------------------------------------------ */
function drawWeide(T){
  var rr = seeded(1953);
  bandV(0, 0, 1300, 140, [[0,'#a8c0cc'],[0.6,'#c8d4c8'],[1,'#dfe0cc']], 6);
  // Der Hang, auf dem man steht
  poly([0,470, 0,332, 300,314, 660,336, 980,310, 1300,330, 1300,470], '#8d9670', 0);
  poly([0,470, 0,382, 320,366, 700,388, 1010,364, 1300,382, 1300,470], '#7c8560', 0);
  // Kalkboden
  bandV(0, 344, 1300, 126, [[0,'#c8c0a4'],[0.5,'#b8b092'],[1,'#a29a7e']], 6);
  for (var i = 0; i < 90; i++){
    var kx = rr()*1300, ky = 350 + rr()*116;
    ctx.globalAlpha = 0.24 + rr()*0.26;
    ctx.fillStyle = rr() > 0.5 ? '#e4dcc6' : '#7e7660';
    ctx.fillRect(psnap(kx), psnap(ky), psnap(8 + rr()*24), psnap(3 + rr()*5));
  }
  ctx.globalAlpha = 1;
  // Wacholderbueschel
  for (var b = 0; b < 22; b++){
    var wx = rr()*1300, wy = 356 + rr()*100;
    ell(wx, wy, 11 + rr()*9, 7 + rr()*5, rr() > 0.5 ? '#586a3e' : '#6a7a4a', 1.4);
    ell(wx-5, wy-5, 6, 5, '#7d8a58', 0);
  }
  /* Der grosse Fels. Rechts, und er wirft am Morgen einen Schatten,
     der breiter ist als er selbst. In diesem Schatten steht die
     zwoelfte Ziege -- man sieht sie erst, wenn man den Schatten
     ansieht und nicht die Herde. */
  ctx.save(); ctx.translate(1060, 452);
  ctx.globalAlpha = 0.30;
  poly([-150, 0, 40, 0, 10, -18, -128, -22], '#3f4436', 0);
  ctx.globalAlpha = 1;
  poly([-52, 0, 50, 0, 38, -96, -14, -122, -46, -74], '#c4bca4', 3);
  poly([-52, 0, 0, 0, -6, -92, -46, -74], mixHex('#c4bca4','#000000',0.22), 0);
  for (var f = 0; f < 7; f++)
    pRect(-44 + f*13, -30 - (f%3)*22, 9, 5, mixHex('#c4bca4','#8a8270', 0.6));
  ctx.restore();
  /* Der Stein, auf dem der Vater sitzt. Er sitzt darauf, seit ich
     denken kann, und er hat ihn nie erwaehnt. */
  ctx.save(); ctx.translate(640, 452);
  ctx.globalAlpha = 0.26;
  poly([-72, 0, 58, 0, 40, -12, -58, -14], '#4a5040', 0);
  ctx.globalAlpha = 1;
  poly([-62, 2, 58, 2, 48, -34, -32, -44, -56, -26], '#c0b89e', 2.6);
  poly([-62, 2, -4, 2, -8, -38, -56, -26], mixHex('#c0b89e','#000000',0.2), 0);
  pRect(-38, -24, 18, 5, mixHex('#c0b89e','#8a8270',0.6));
  pRect(8, -30, 22, 5, mixHex('#c0b89e','#8a8270',0.6));
  ctx.restore();

  /* Die Herde. Elf stehen im Licht, und sie muessen gross genug sein,
     dass man sie tatsaechlich zaehlen kann -- das ist die Aufgabe. */
  var plaetze = [[400,414],[510,432],[612,410],[706,446],[800,424],[884,452],
                 [556,462],[344,450],[752,406],[848,438],[452,468]];
  for (var z = 0; z < plaetze.length; z++)
    ziege(plaetze[z][0], plaetze[z][1], 0.92 + (z%3)*0.07, T, z + 1, false);
  // Und die zwoelfte im Schatten des Felsens
  if (!FLAG.ziegeGefunden) ziege(978, 448, 0.88, T, 12, true);
  else ziege(918, 428, 0.90, T, 12, false);

  // Wacholderstrauch links, an dem man einen Zweig abbrechen kann
  ctx.save(); ctx.translate(380, 452);
  pSegOutlined(0, 0, -4, -34, 9, '#6a5a3e');
  for (var w = 0; w < 8; w++){
    var a = -0.4 - w*0.32;
    ell(Math.cos(a)*24 - 4, -40 + Math.sin(a)*16, 13, 9, w%2 ? '#4e6234' : '#5c7040', 1.4);
  }
  if (!FLAG.wacholderAb){
    ell(-10, -54, 4, 4, '#5b7fa6', 1); ell(8, -46, 4, 4, '#4a6a86', 1);
  }
  ctx.restore();

  // Die Kante nach vorn links: hier sieht man ins Tal hinunter
  poly([0,470, 0,400, 150,392, 260,414, 300,470], '#b0a888', 0);
  poly([0,470, 0,428, 130,420, 240,438, 270,470], '#9a9276', 0);

  /* Baba Roga steht am Rand der Baumgruppe. Sie tut nichts.
     Sie wird nie kommentiert. */
  if (!FLAG.rogaGesehen0) babaRoga(52, 388, T, 0.32 + Math.sin(T*0.4)*0.05, false);

  pixelGlow(1180, 70, 340, 220, '#fff8dc', 0.16, 4);
}

/* Bewegliche Spielelemente ueber dem gemalten Weidebild. Die Ziegen
   bleiben einzeln zaehlbar, der Wacholder reagiert auf das Inventar und
   Baba Roga verschwindet weiterhin erst nach der Beobachtung. */
function drawWeideDynamik(T){
  var plaetze = [[400,414],[510,432],[612,410],[706,446],[800,424],[884,452],
                 [556,462],[344,450],[752,406],[848,438],[452,468]];
  for (var z = 0; z < plaetze.length; z++)
    ziege(plaetze[z][0], plaetze[z][1], 0.92 + (z%3)*0.07, T, z + 1, false);
  if (!FLAG.ziegeGefunden) ziege(978, 448, 0.88, T, 12, true);
  else ziege(918, 428, 0.90, T, 12, false);

  ctx.save(); ctx.translate(380, 452);
  pSegOutlined(0, 0, -4, -34, 9, '#6a5a3e');
  for (var w = 0; w < 8; w++){
    var a = -0.4 - w*0.32;
    ell(Math.cos(a)*24 - 4, -40 + Math.sin(a)*16, 13, 9, w%2 ? '#4e6234' : '#5c7040', 1.4);
  }
  if (!FLAG.wacholderAb){
    ell(-10, -54, 4, 4, '#5b7fa6', 1); ell(8, -46, 4, 4, '#4a6a86', 1);
  }
  ctx.restore();

  if (!FLAG.rogaGesehen0) babaRoga(52, 388, T, 0.32 + Math.sin(T*0.4)*0.05, false);
}

/* ------------------------------------------------------------
   Das Haus. Ein Raum. Der Ofen ist das Zentrum, weil er das
   Einzige ist, das im Winter warm ist.
   ------------------------------------------------------------ */
function drawKuca(T){
  var rr = seeded(1468);
  // Wand aus Bruchstein, innen verputzt und rauchgeschwaerzt
  bandV(0, 0, 1280, 470, [[0,'#8a7a62'],[0.5,'#7a6a52'],[1,'#5f5443']], 6);
  trockenmauer(0, 60, 1280, 290, 21, '#b0a184', '#6f6552');
  ctx.globalAlpha = 0.30;
  for (var i = 0; i < 18; i++){
    var bx = rr()*1280, by = 60 + rr()*180, br = 26 + rr()*54;
    pixelBlob(bx-br, by, br*2, br*0.7, '#1e1810', 0.7, rr);
  }
  ctx.globalAlpha = 1;
  // Deckenbalken, niedrig
  pRect(0, 46, 1280, 16, '#3f3427');
  for (var b = 0; b < 9; b++) pRect(30 + b*140, 46, 22, 30, '#4a3d2d');
  // Kraeuter und Mais haengen an den Balken
  for (var k = 0; k < 12; k++){
    var kx = 90 + k*96;
    pSeg(kx, 62, kx + 2, 96, 3, '#6a5a3c');
    if (k % 2){ ell(kx + 2, 104, 8, 12, '#8a7a3e', 1.4); pRect(kx - 2, 96, 9, 5, '#7a6a34'); }
    else { for (var h = 0; h < 3; h++) ell(kx - 4 + h*5, 100 + h*3, 5, 9, '#5f6a3c', 1); }
  }

  // Der Boden: gestampfte Erde, kein Belag
  bandV(0, 342, 1280, 128, [[0,'#7a6a52'],[0.5,'#6a5c46'],[1,'#574c3a']], 6);
  ctx.globalAlpha = 0.25;
  for (var s = 0; s < 46; s++)
    pRect(rr()*1280, 350 + rr()*112, 8 + rr()*18, 4, rr()>0.5 ? '#8f8068' : '#463c2e');
  ctx.globalAlpha = 1;
  // Der Lichtstreifen der Tuer liegt auf dem Boden
  ctx.globalAlpha = 0.20;
  poly([120, 470, 200, 356, 330, 356, 300, 470], '#ffe6b0', 0);
  ctx.globalAlpha = 1;

  // Die Tuer nach draussen, links. Von drinnen ist sie das hellste Ding.
  pOutlineRect(96, 196, 92, 158, '#4a3a28', '#1a140e');
  ctx.globalAlpha = 0.85;
  bandV(102, 202, 80, 146, [[0,'#fff2cc'],[0.6,'#e6d2a2'],[1,'#c2ab7e']], 5);
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.42;
  poly([182, 210, 420, 340, 420, 470, 100, 470, 100, 356], '#ffe6b0', 0);
  ctx.globalAlpha = 1;

  /* Die rechte Wand. Reine Kulisse -- sie fuellt das Bild auf breiten
     Geraeten und traegt keinen einzigen Hotspot. In einem Haus wie
     diesem stand dort das, was man im Winter braucht. */
  pOutlineRect(966, 226, 200, 12, '#5f5140', '#211a12');    // Brett an der Wand
  for (var g1 = 0; g1 < 6; g1++){                            // Toepfe und Glaeser
    var gh = 18 + (g1 % 3) * 9;
    pOutlineRect(978 + g1*32, 226 - gh, 22, gh,
                 ['#8a6a44','#6f5f4a','#7a5a38','#5f5a4a','#84674a','#6a5440'][g1], '#2a221a');
    pRect(978 + g1*32, 226 - gh, 22, 4, '#a08862');
  }
  for (var z1 = 0; z1 < 7; z1++)                             // Knoblauch am Balken
    ell(1000 + z1*26, 92 + (z1%2)*10, 7, 11, '#cdbd9a', 1.2);
  pOutlineRect(1010, 396, 150, 58, '#5a4830', '#1e1610');    // Truhe
  pRect(1016, 402, 138, 6, '#6f5a3c');
  pRect(1076, 414, 18, 12, '#37302a');
  for (var s1 = 0; s1 < 3; s1++)                             // Reisig daneben
    pSeg(1196 + s1*10, 452, 1186 + s1*14, 366 - s1*12, 4, '#5f4f36');

  /* Der Herd. Ein offener Rauchfang ueber einer Feuerstelle, kein
     Ofen -- den gab es hier erst zwanzig Jahre spaeter. */
  ctx.save(); ctx.translate(640, 456);
  trockenmauer(-70, -104, 140, 104, 33, '#a89a80', '#6a6052');
  poly([-92, -104, 92, -104, 62, -190, -62, -190], '#5f5140', 3);
  pRect(-62, -196, 124, 10, '#4a4030');
  // Feuer
  var fl = 0.7 + 0.3*Math.abs(Math.sin(T*4.1));
  pRect(-40, -30, 80, 12, '#241a12');
  for (var f = 0; f < 6; f++){
    var fx2 = -32 + f*13, fh = (10 + (f%3)*9) * fl;
    ctx.globalAlpha = 0.9;
    poly([fx2, -30, fx2+10, -30, fx2+5, -30-fh], f%2 ? '#e8952a' : '#f0c04a', 0);
    ctx.globalAlpha = 1;
  }
  pRect(-44, -34, 88, 5, '#4a3020');
  // Kessel am Haken
  pSeg(0, -186, 0, -110, 3, '#3a342c');
  pOutlineRect(-26, -108, 52, 42, '#3f3a34', '#161210');
  ell(0, -108, 26, 8, '#2a2622', 2);
  ctx.globalAlpha = 0.25;
  for (var d = 0; d < 5; d++){
    var dy = -120 - ((T*16 + d*14) % 66);
    pRect(-8 + Math.sin(T + d)*7, dy, 7, 7, '#ded6c4');
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  pixelGlow(640, 420, 260, 180, '#ff9a3a', 0.26, 5);

  // Der Tisch, niedrig, mit einer Petroleumlampe
  ctx.save(); ctx.translate(380, 452);
  poly([-84, -54, 84, -54, 94, -44, -94, -44], '#7a6448', 2.6);
  pRect(-72, -44, 12, 44, '#6a5540'); pRect(60, -44, 12, 44, '#6a5540');
  pRect(-84, -30, 168, 6, '#6a5540');
  pOutlineRect(-14, -84, 26, 30, '#c9bfa4', '#4a4034');
  pRect(-8, -78, 14, 18, '#e8c26a');
  pRect(-6, -92, 10, 10, '#8a8278');
  // Zwei Schuesseln und ein Loeffel
  ell(-52, -56, 17, 6, '#a89678', 1.8);
  ell(30, -56, 17, 6, '#a89678', 1.8);
  pRect(48, -58, 20, 3, '#8a7a5c');
  ctx.restore();

  // Der Mehlsack, links, und er ist leer
  ctx.save(); ctx.translate(300, 456);
  if (FLAG.mehlGebracht){
    poly([-26, 0, 26, 0, 20, -60, -20, -60], '#d8cdb0', 2.6);
    poly([-20, -60, 20, -60, 12, -70, -12, -70], '#c2b596', 2);
    pRect(-14, -40, 28, 8, '#a89878');
  } else {
    poly([-24, 0, 24, 0, 14, -22, -14, -22], '#c9bfa4', 2.4);
    poly([-14, -22, 14, -22, 8, -30, -8, -30], '#b0a68c', 2);
    ctx.globalAlpha = 0.4;
    pRect(-18, -6, 36, 4, '#a09680');
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // Das Bett: ein Gestell, Stroh, drei Decken fuer fuenf Leute
  ctx.save(); ctx.translate(820, 452);
  pOutlineRect(-72, -46, 148, 46, '#6a5540', '#1a140e');
  pRect(-66, -40, 136, 12, '#c2b48c');
  pRect(-66, -30, 136, 10, '#8a6a54');
  pRect(-40, -50, 44, 12, '#d8cdb4');
  pRect(-76, -76, 10, 76, '#5a4a34'); pRect(66, -76, 10, 76, '#5a4a34');
  ctx.restore();

  /* Das Bild an der Wand. Was darauf zu sehen ist, sagt niemand --
     in diesen Haeusern hing entweder ein Heiliger oder eine Hochzeit,
     und beides sah nach zwanzig Jahren Rauch gleich aus. */
  ctx.save(); ctx.translate(460, 220);
  pOutlineRect(-32, -40, 64, 80, '#5a4a34', '#1a140e');
  bandV(-26, -34, 52, 68, [[0,'#8a7a5c'],[1,'#5f5240']], 4);
  ctx.globalAlpha = 0.5;
  ell(0, -8, 15, 19, '#c9b48c', 0);
  pRect(-13, 12, 26, 22, '#7a6a4a');
  ctx.globalAlpha = 1;
  ctx.restore();

}
