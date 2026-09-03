
/* ============================================================
   Sektion 10  HINTERGRUENDE · KINDHEIT UND MARINE
   ============================================================ */

/* ------------------------------------------------------------
   Rosko Polje, 1953. Karst. Der Boden ist Stein mit etwas Erde
   dazwischen, und alles, was hier waechst, hat sich das erkaempft.
   ------------------------------------------------------------ */
function drawPolje(T){
  var rr = seeded(1953);
  var poljeBild = bildQuelle('rosko_polje_1953');
  if (poljeBild){
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(poljeBild, 0, 0, poljeBild.width, poljeBild.height, 0, 0, 1400, 470);
  } else {
  // Himmel, gebleicht
  bandV(0, 0, 1400, 230, [[0,'#9fbcc9'],[0.55,'#c4d2cc'],[1,'#e2e2d2']], 7);
  // Gegenhang, drei Staffeln
  ctx.globalAlpha = 0.42;
  poly([0,240, 240,176, 520,222, 800,168, 1080,214, 1400,180, 1400,270, 0,270], '#8a9484', 0);
  ctx.globalAlpha = 0.62;
  poly([0,268, 300,224, 620,262, 900,220, 1200,258, 1400,232, 1400,310, 0,310], '#77836a', 0);
  ctx.globalAlpha = 1;
  poly([0,320, 340,282, 700,316, 1020,278, 1400,308, 1400,360, 0,360], '#67734f', 0);
  // Kalkfelsen im Hang, weiss und poroes
  for (var i = 0; i < 34; i++){
    var fx = rr()*1400, fy = 240 + rr()*110;
    ctx.globalAlpha = 0.4 + rr()*0.3;
    ctx.fillStyle = '#ded6c2';
    ctx.fillRect(psnap(fx), psnap(fy), psnap(10+rr()*26), psnap(4+rr()*8));
  }
  ctx.globalAlpha = 1;

  // Boden: Steinplatten und trockene Erde
  bandV(0, 348, 1400, 122, [[0,'#c2b89c'],[0.5,'#b3a888'],[1,'#9c9174']], 6);
  for (var st = 0; st < 60; st++){
    var sx = rr()*1400, sy = 356 + rr()*106;
    ctx.globalAlpha = 0.22 + rr()*0.2;
    ctx.fillStyle = rr() > 0.5 ? '#e0d8c2' : '#7a7058';
    ctx.fillRect(psnap(sx), psnap(sy), psnap(8 + rr()*22), psnap(3 + rr()*4));
  }
  ctx.globalAlpha = 1;
  // Der Weg nach rechts, ins Nachbardorf
  ctx.globalAlpha = 0.4;
  for (var w = 0; w < 40; w++)
    pRect(1150 + w*7, 400 + Math.sin(w*0.3)*24, 8, 4, '#d8cfb4');
  ctx.globalAlpha = 1;
  }

  if (!poljeBild){
  /* Das Haus. Beim zweiten Hinsehen schrumpft es -- genau das, was
     die Erinnerung mit Haeusern der Kindheit macht. Der Massstab
     laeuft weich, waehrend der Erzaehler die Korrektur spricht, und
     niemand weist im Spiel darauf hin. */
  ctx.save();
  var hu = unsch('haus');
  ctx.translate(330, 358);
  ctx.scale(1 - hu * 0.20, 1 - hu * 0.22);
  ctx.translate(-330, -358);
  trockenmauer(210, 208, 240, 150, 31, '#d0c5aa', '#8a8068');
  poly([196, 210, 464, 210, 424, 158, 236, 158], '#9a9488', 2.6);
  for (var d = 0; d < 9; d++) pRect(210 + d*28, 166, 24, 44, mixHex('#9a9488', d%2?'#c8c2b4':'#6a655c', 0.4));
  // Tuer und ein Fenster ohne Glas
  pOutlineRect(292, 262, 56, 96, '#4a3a28', '#1a140e');
  for (var db = 0; db < 5; db++) pRect(296, 268 + db*18, 48, 3, '#3a2c1e');
  pOutlineRect(378, 250, 44, 40, '#241c14', '#1a140e');
  pRect(398, 250, 3, 40, '#4a3a28'); pRect(378, 268, 44, 3, '#4a3a28');
  // Der Kamin gehoert zum Haus und muss mit ihm schrumpfen
  pRect(410, 140, 20, 24, '#8a8068');
  ctx.restore();
  // Rauch aus dem Kamin: es gibt Feuer, aber wenig
  var kx0 = 330 + (410 + 4 - 330) * (1 - unsch('haus') * 0.20);
  var ky0 = 358 + (140 - 358) * (1 - unsch('haus') * 0.22);
  ctx.globalAlpha = 0.22;
  for (var s = 0; s < 7; s++){
    var sy = ky0 - 2 - ((T*13 + s*17) % 120);
    ctx.fillStyle = '#d8d4c8';
    ctx.fillRect(psnap(kx0 + Math.sin(T*0.8+s)*9), psnap(sy), psnap(6+s), psnap(5+s*0.7));
  }
  ctx.globalAlpha = 1;

  // Der Brunnen: ein Loch mit einer Mauer drumherum, kein Bilderbuch
  trockenmauer(538, 322, 90, 40, 47, '#d8cdb4', '#8f8570');
  ell(583, 322, 45, 11, '#241f1a', 2.4);
  ell(583, 322, 38, 8, '#100e0c', 0);
  line(546, 322, 546, 258, 4, '#5a4a34');
  line(620, 322, 620, 258, 4, '#5a4a34');
  line(542, 258, 624, 258, 4, '#5a4a34');
  line(583, 258, 583, 288, 2, '#3a332a');
  pOutlineRect(572, 288, 22, 18, '#6a5a44', '#1a140e');
  }

  // Der Ochsenkarren. Ein Rad steht schief -- das ist die Aufgabe.
  ctx.save(); ctx.translate(700, 452);
  // Ladeflaeche
  poly([-84, -54, 82, -54, 92, -30, -94, -30], '#7a6448', 2.8);
  for (var pl = 0; pl < 7; pl++) pRect(-80 + pl*24, -52, 18, 22, mixHex('#7a6448', pl%2?'#a08a68':'#5a4a34', 0.5));
  // Seitenbretter
  pRect(-88, -76, 8, 26, '#6a5540'); pRect(80, -76, 8, 26, '#6a5540');
  // Deichsel nach vorn
  line(-92, -40, -168, -22, 7, '#6a5540');
  line(-168, -22, -190, -18, 5, '#5a4a34');
  // Hinterrad, heil
  ell(56, -14, 30, 30, '#6a5540', 3.4);
  ell(56, -14, 8, 8, '#4a3a28', 2.4);
  for (var sp = 0; sp < 8; sp++){
    var a2 = sp * 0.785;
    line(56, -14, 56 + Math.cos(a2)*27, -14 + Math.sin(a2)*27, 2.6, '#5a4a34');
  }
  // Vorderrad: abgerutscht, liegt schief im Staub
  ctx.save();
  ctx.translate(-58, -8);
  ctx.rotate(FLAG.radRepariert ? 0 : 0.42);
  ell(0, 0, 30, 30, '#6a5540', 3.4);
  ell(0, 0, 8, 8, '#4a3a28', 2.4);
  for (var sp2 = 0; sp2 < 8; sp2++){
    var a3 = sp2 * 0.785;
    line(0, 0, Math.cos(a3)*27, Math.sin(a3)*27, 2.6, '#5a4a34');
  }
  ctx.restore();
  if (!FLAG.radRepariert){
    // Der Karren haengt auf der Achse: sichtbar schief
    pRect(-96, -30, 20, 14, '#4a3a28');
    ctx.globalAlpha = 0.5; pixelBlob(-90, -8, 60, 16, '#8a7a5c', 0.6, rr); ctx.globalAlpha = 1;
  }
  ctx.restore();

  // Holzstapel und Werkzeug rechts
  for (var h = 0; h < 5; h++){
    for (var h2 = 0; h2 < 4 - Math.floor(h/2); h2++)
      ell(880 + h2*22 + h*4, 442 - h*13, 11, 8, mixHex('#7a6244','#b89a6c', (h+h2)%3/3), 1.8);
  }
  line(946, 448, 962, 396, 5, '#6a5a3c');
  poly([958, 396, 984, 384, 990, 398, 964, 408], '#8a8a8e', 2);

  // Wacholder und Salbei im Karst
  for (var b = 0; b < 16; b++){
    var wx = rr()*1400, wy = 372 + rr()*88;
    ell(wx, wy, 10 + rr()*8, 6 + rr()*4, rr() > 0.5 ? '#5d6a42' : '#6f7a4e', 1.4);
    ell(wx-4, wy-4, 5, 4, '#7d8a5c', 0);
  }
  // Baba Roga am rechten Bildrand, hinter dem Holzstapel.
  // Sie steht dort ohne Anlass und wird nie erwaehnt.
  if (!FLAG.rogaGesehen1 || !FLAG.kap1Fertig)
    babaRoga(1352, 396, T, 0.38 + Math.sin(T*0.4)*0.06, false);

  /* Der Schemel des Lehrers mit seinem Radio. Es ist das einzige
     Geraet im Dorf, das Strom braucht, und es steht draussen, weil
     drinnen niemand zuhoert. */
  pRect(374, 442, 40, 6, '#6a5638');
  pRect(378, 448, 5, 14, '#5a4830'); pRect(405, 448, 5, 14, '#5a4830');
  radioApparat(394, 442, !!FLAG.radioRepariert, T);
  if (FLAG.radioRepariert){
    /* Wenn es laeuft, sieht man das: drei Boegen ueber dem Kasten. */
    for (var kl = 0; kl < 3; kl++){
      var kp = ((T * 0.7 + kl * 0.33) % 1);
      ctx.globalAlpha = 0.5 * (1 - kp);
      ell(408 + kp * 26, 410 - kp * 22, 4 + kp * 9, 3 + kp * 7, '#e8d8a8', 1.2);
    }
    ctx.globalAlpha = 1;
  }

  pixelGlow(1120, 90, 340, 230, '#fff4d0', 0.14, 4);
}

/* ------------------------------------------------------------
   Die Bruecke. Sie ist im Konzept das Motiv des ganzen Spiels:
   zwei Ufer, ein Bogen dazwischen, und einer, der darueber
   nachdenkt, statt hinueberzugehen.
   ------------------------------------------------------------ */
function drawBruecke(T){
  var rr = seeded(1888);
  bandV(0, 0, 1280, 200, [[0,'#a8bfc4'],[0.6,'#cdd6c8'],[1,'#e6e2d0']], 6);
  // Haenge links und rechts, bewaldet
  ctx.globalAlpha = 0.5;
  poly([0,224, 200,156, 420,206, 640,150, 880,198, 1060,164, 1280,192, 1280,290, 0,290], '#6f7d5c', 0);
  ctx.globalAlpha = 1;
  poly([0,270, 260,224, 540,262, 820,218, 1060,240, 1280,264, 1280,340, 0,340], '#4f5c3e', 0);
  for (var b = 0; b < 26; b++){
    var bx = rr()*1280, by = 212 + rr()*66;
    var g = rr() > 0.5 ? '#41552f' : '#4e6438';
    pRect(bx-16, by, 32, 18, g); pRect(bx-9, by-10, 20, 14, g); pRect(bx+7, by-4, 14, 12, mixHex(g,'#000000',0.2));
  }

  /* Der Fluss liegt im Mittelgrund, quer durchs Bild. Der Spieler steht
     nicht auf der Bruecke, sondern auf dem Weg diesseits -- so sieht man
     den Bogen ganz, und das ist der Sinn dieses Bildes. */
  bandV(0, 268, 1280, 82, [[0,'#5f7f86'],[0.5,'#47656e'],[1,'#33505a']], 6);
  for (var s = 0; s < 22; s++){
    var wx = rr()*1280, wy = 280 + rr()*62;
    ell(wx, wy, 7+rr()*11, 3+rr()*4, mixHex('#8a8f88','#d8d4c4', rr()), 1.4);
  }
  ctx.globalAlpha = 0.3;
  for (var f = 0; f < 26; f++){
    var fy = 274 + (f*3) % 72;
    var fx = ((f*97 + T*24) % 1340) - 60;
    ctx.fillStyle = '#c6dce0';
    ctx.fillRect(psnap(fx), psnap(fy), psnap(18 + (f%4)*12), 2);
  }
  ctx.globalAlpha = 1;

  /* Die Bruecke: ein einziger Bogen, osmanisch, aus Kalkstein.
     Fahrbahn bei y 214, Bogenfuss bei y 300 -- sie steht damit ganz im
     Mittelgrund und wird vom Weg im Vordergrund nicht verdeckt. */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(280, 300);
  ctx.quadraticCurveTo(550, 150, 820, 300);
  ctx.lineTo(820, 308); ctx.lineTo(280, 308); ctx.closePath();
  ctx.fillStyle = '#cfc4a8'; ctx.fill();
  L(3); ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(326, 302);
  ctx.quadraticCurveTo(550, 186, 774, 302);
  ctx.closePath(); ctx.clip();
  bandV(320, 170, 460, 140, [[0,'#3e5a62'],[1,'#28424c']], 5);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(326, 302);
  ctx.quadraticCurveTo(550, 186, 774, 302);
  L(3); ctx.stroke();
  ctx.restore();
  // Keilsteine des Bogens
  for (var k = 0; k < 15; k++){
    var t2 = k / 14, ang = Math.PI * (1 - t2);
    var kx = 550 + Math.cos(ang) * 224, ky = 302 - Math.sin(ang) * 116;
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(-ang + Math.PI/2);
    pOutlineRect(-8, -5, 16, 17, mixHex('#cfc4a8','#efe6ce', (k%3)/3), '#7a7060');
    ctx.restore();
  }
  // Fahrbahn und Bruestung der Bruecke
  trockenmauer(200, 232, 700, 22, 61, '#e0d6bc', '#a89e86');
  trockenmauer(200, 194, 700, 40, 63, '#d8ceb4', '#9a9078');
  pRect(psnap(196), psnap(190), psnap(708), 6, '#efe6ce');
  // Auf- und Abgang links und rechts
  poly([0,268, 200,254, 200,232, 0,246], '#c4b99e', 2.4);
  poly([900,254, 1280,274, 1280,252, 900,232], '#c4b99e', 2.4);

  /* Die Muehle. Beim zweiten Hinsehen liegt sie weiter weg, als sie
     in der Erinnerung lag -- der Weg dorthin war laenger. */
  ctx.save();
  var mu = unsch('muehle');
  ctx.translate(1108, 250); ctx.scale(1 - mu*0.24, 1 - mu*0.24); ctx.translate(-980, -246 + mu*10);
  pOutlineRect(946, 196, 62, 50, '#8a7a5e', '#1a140e');
  poly([936, 196, 1018, 196, 1000, 168, 954, 168], '#5a4a34', 2.4);
  ell(1016, 224, 19, 19, '#4a3a28', 2.6);
  ctx.save(); ctx.translate(1016, 224); ctx.rotate(T * 0.4);
  for (var mr = 0; mr < 6; mr++){ ctx.rotate(1.047); line(0, 0, 18, 0, 3, '#5a4a34'); }
  ctx.restore();
  ctx.restore();

  /* Der Weg diesseits, auf dem der Karren steht und der Junge wartet. */
  bandV(0, 340, 1100, 130, [[0,'#c2b89c'],[0.5,'#b0a68a'],[1,'#988e74']], 5);
  ctx.globalAlpha = 0.5;
  for (var p = 0; p < 44; p++)
    pRect(rr()*1100, 352 + rr()*110, 12 + rr()*16, 4, rr()>0.5 ? '#d4cbb0' : '#7d7460');
  ctx.globalAlpha = 1;
  // Grasbueschel am Wegrand
  for (var gb = 0; gb < 14; gb++){
    var gx = rr()*1100, gy = 348 + rr()*24;
    ell(gx, gy, 9+rr()*6, 5+rr()*3, rr()>0.5 ? '#5d6a42' : '#6f7a4e', 1.2);
  }

  /* Die niedrige Bruestung am Weg. Auf ihr sitzt der Fremde -- deshalb
     liegt sie genau auf der Sitzhoehe des Ankerpunkts (y 404, hoehe 34). */
  trockenmauer(420, 404, 520, 34, 67, '#ded4ba', '#a29883');
  pRect(psnap(416), psnap(400), psnap(528), 6, '#efe6ce');

  pixelGlow(120, 120, 300, 200, '#ffeec4', 0.15, 4);
}

/* ------------------------------------------------------------
   Mostar, 1955. Fahnen ueber der Strasse, ein Aufmarsch, der
   gleich beginnt, und ein Junge ohne Faehnchen.
   ------------------------------------------------------------ */
function drawMostar(T){
  var rr = seeded(1955);
  bandV(0, 0, 1400, 200, [[0,'#7fa8c4'],[0.6,'#b4cdd4'],[1,'#dfe4d8']], 7);
  // Haeuserzeile links, oesterreichisch-osmanisch gemischt
  for (var h = 0; h < 5; h++){
    var hx = -40 + h*180, hh = 200 + (h%3)*40;
    bandV(hx, 350-hh, 172, hh, [[0,'#d8c8a8'],[0.5,'#c4b28e'],[1,'#a89676']], 5);
    ziegeldach(hx-8, 350-hh-24, 188, 26, '#9a5636', 20+h);
    for (var f = 0; f < 3; f++){
      for (var g = 0; g < 2; g++){
        var fx = hx + 26 + g*84, fy = 350-hh+40+f*56;
        if (fy > 300) continue;
        pOutlineRect(fx, fy, 44, 46, '#33323a', '#1a1a16');
        ctx.globalAlpha = 0.3; pRect(fx+3, fy+3, 18, 40, '#9ac0d8'); ctx.globalAlpha = 1;
        fensterladen(fx-6, fy-3, 56, 52, '#4a5a6a', rr() > 0.5);
      }
    }
  }
  // Rechts: Tribuene und die Bruecke im Hintergrund
  bandV(900, 120, 500, 236, [[0,'#cfc0a0'],[0.5,'#bdac88'],[1,'#a29070']], 5);
  ziegeldach(890, 96, 520, 28, '#8a5030', 33);
  // Die Alte Bruecke, ganz hinten und ganz klein
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(1180, 300); ctx.quadraticCurveTo(1270, 232, 1360, 300);
  ctx.lineWidth = 12; ctx.strokeStyle = '#d8cfb8'; ctx.stroke();
  ctx.globalAlpha = 1;
  // Tribuene: ein Podest, rot bespannt, mit Mikrofon
  pOutlineRect(1060, 288, 250, 74, '#8a2a26', '#1a1210');
  pRect(1066, 294, 238, 6, '#a83a32');
  for (var tb = 0; tb < 6; tb++) pRect(1080 + tb*40, 302, 26, 54, '#6f2220');
  pRect(1150, 250, 8, 40, '#3a3a3e');
  ell(1154, 246, 7, 6, '#2a2a2e', 1.6);
  /* Das Portraet ueber der Tribuene. Es war groesser als er, sagt die
     Erinnerung. Beim zweiten Hinsehen war ich einfach kleiner. */
  ctx.save();
  var pu = unsch('tribuene');
  ctx.translate(1170, 280); ctx.scale(1 - pu*0.28, 1 - pu*0.28); ctx.translate(-1170, -280);
  pOutlineRect(1112, 150, 116, 130, '#c9bfa4', '#2a241c');
  pRect(1122, 160, 96, 110, '#8a94a0');
  ell(1170, 198, 26, 30, '#6a747e', 0);
  poly([1136, 270, 1204, 270, 1194, 232, 1146, 232], '#5a646e', 0);
  ctx.restore();

  // Fahnenschnuere quer ueber die Strasse
  for (var l = 0; l < 3; l++){
    var ly = 118 + l*30;
    ctx.strokeStyle = '#5a5044'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var x = 0; x <= 1400; x += 20) ctx.lineTo(x, ly + Math.sin(x*0.006 + l)*16 + Math.sin(T*0.6 + x*0.01)*3);
    ctx.stroke();
    for (var fl = 0; fl < 28; fl++){
      var fx2 = fl*50 + l*16;
      var fy2 = ly + Math.sin(fx2*0.006 + l)*16 + Math.sin(T*0.6 + fx2*0.01)*3;
      var flap = Math.sin(T*2.4 + fl)*3;
      poly([fx2, fy2, fx2+18, fy2+4+flap, fx2+2, fy2+22], fl%3===0 ? '#c22a2a' : (fl%3===1 ? '#e8e4d4' : '#2f4f8a'), 0);
      if (fl%3===0) pRect(fx2+5, fy2+6, 4, 4, '#e8d84a');
    }
  }

  // Boden: Kopfsteinpflaster
  bandV(0, 350, 1400, 120, [[0,'#a49a8a'],[0.5,'#948a7c'],[1,'#7e766a']], 6);
  for (var c = 0; c < 200; c++){
    var cx = rr()*1400, cy = 356 + rr()*110;
    ctx.globalAlpha = 0.28 + rr()*0.24;
    ctx.fillStyle = rr() > 0.5 ? '#bcb2a2' : '#6a6258';
    ctx.fillRect(psnap(cx), psnap(cy), psnap(8+rr()*8), psnap(5+rr()*4));
  }
  ctx.globalAlpha = 1;
  // Die Rinne in der Strassenmitte -- hier liegt, was heruntergefallen ist
  ctx.globalAlpha = 0.5;
  for (var rn = 0; rn < 100; rn++) pRect(rn*14, 428 + Math.sin(rn*0.2)*4, 12, 6, '#5a544c');
  ctx.globalAlpha = 1;

  // Der Zeitungsstand: hier gibt es Papier, aber nicht umsonst
  ctx.save(); ctx.translate(700, 444);
  pOutlineRect(-56, -104, 112, 66, '#6a5a3e', '#1a140e');
  poly([-68, -104, 68, -104, 56, -128, -56, -128], '#8a3a2e', 2.4);
  pRect(-52, -100, 104, 58, '#c9bfa4');
  for (var z = 0; z < 6; z++){
    pOutlineRect(-48 + (z%3)*34, -96 + Math.floor(z/3)*28, 30, 24, '#e2ddcc', '#7a7264');
    pRect(-44 + (z%3)*34, -92 + Math.floor(z/3)*28, 22, 3, '#5a544c');
    pRect(-44 + (z%3)*34, -86 + Math.floor(z/3)*28, 16, 2, '#7a7264');
  }
  pRect(-56, -38, 112, 38, '#5a4a34');
  ctx.restore();

  // Plakatwand
  pOutlineRect(830, 216, 118, 92, '#b8ae94', '#2a241c');
  pRect(836, 222, 106, 80, '#c9422e');
  ctx.globalAlpha = 0.85;
  pRect(846, 232, 86, 8, '#f0e8d0'); pRect(846, 246, 66, 6, '#f0e8d0');
  pRect(846, 262, 76, 6, '#f0e8d0'); pRect(846, 276, 46, 6, '#f0e8d0');
  ctx.globalAlpha = 1;
  line(852, 308, 852, 362, 5, '#6a6258'); line(928, 308, 928, 362, 5, '#6a6258');

  /* Die Menge steht am gegenueberliegenden Strassenrand, mit dem
     Ruecken zu uns. Silhouetten ohne Gesichter: verordnete Begeisterung
     hat keine Einzelnen, und sie soll auch keine bekommen. */
  ctx.globalAlpha = 0.62;
  for (var m = 0; m < 44; m++){
    var mx = 40 + m*31 + Math.sin(m*2.1)*7, my = 366 + (m%3)*5;
    var bob = Math.sin(T*1.2 + m)*1.4;
    var dunkel = ['#3a3630','#463f36','#332f2a','#4e463a'][m%4];
    ctx.fillStyle = dunkel;
    ctx.fillRect(psnap(mx), psnap(my-40+bob), 14, 40);
    ctx.fillRect(psnap(mx+1), psnap(my-51+bob), 12, 12);
    // Ein Drittel von ihnen haelt ein Faehnchen hoch
    if (m % 3 === 0){
      ctx.fillStyle = '#5a5044';
      ctx.fillRect(psnap(mx+12), psnap(my-74+bob), 2, 26);
      ctx.fillStyle = (m%6===0) ? '#8a2a22' : '#c2bda8';
      ctx.fillRect(psnap(mx+14), psnap(my-74+bob), 12, 8);
    }
  }
  ctx.globalAlpha = 1;
  pixelGlow(180, 100, 300, 220, '#fff0c8', 0.13, 4);
}

/* Leichte, bewegliche Ebene ueber dem gemalten Mostar. Die Kulisse
   selbst bleibt statisch und billig zu zeichnen; nur Wimpel und Menge
   bewegen sich. Das bewahrt den Festtag, ohne die Bildrate zu belasten. */
function drawMostarDynamik(T){
  for (var l = 0; l < 3; l++){
    var ly = 104 + l*28;
    ctx.strokeStyle = '#51483d'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var x = 0; x <= 1400; x += 20)
      ctx.lineTo(x, ly + Math.sin(x*0.006 + l)*14 + Math.sin(T*0.55 + x*0.01)*2.5);
    ctx.stroke();
    for (var fl = 0; fl < 28; fl++){
      var fx = fl*50 + l*16;
      var fy = ly + Math.sin(fx*0.006 + l)*14 + Math.sin(T*0.55 + fx*0.01)*2.5;
      var flap = Math.sin(T*2.2 + fl)*2.5;
      poly([fx,fy, fx+18,fy+4+flap, fx+2,fy+21],
           fl%3===0 ? '#b9322d' : (fl%3===1 ? '#e7dfcc' : '#315285'), 0);
      if (fl%3===0) pRect(fx+5, fy+6, 4, 4, '#d8c84a');
    }
  }

  /* Zuschauer stehen nur vor der Tribuene. Kiosk, Rinne und Plakat
     bleiben damit lesbar und anklickbar. */
  ctx.globalAlpha = 0.70;
  for (var m = 0; m < 15; m++){
    var mx = 970 + m*27 + Math.sin(m*2.1)*5, my = 382 + (m%3)*5;
    var bob = Math.sin(T*1.15 + m)*1.2;
    var dunkel = ['#39342d','#463e34','#302c28','#504638'][m%4];
    ell(mx+6, my-43+bob, 6, 7, dunkel, 0);
    pRect(mx-3, my-34+bob, 19, 34, dunkel);
    pRect(mx-7, my-31+bob, 5, 27, mixHex(dunkel,'#000000',0.12));
    pRect(mx+17, my-31+bob, 5, 27, mixHex(dunkel,'#000000',0.12));
    if (m % 3 === 0){
      pRect(mx+11, my-72+bob, 2, 25, '#51483d');
      pRect(mx+13, my-72+bob, 12, 8, m%2 ? '#c4bdab' : '#982d28');
    }
  }
  ctx.globalAlpha = 1;

  /* Der Kleister ist ein Raetselgegenstand und muss unabhaengig vom
     Hintergrundzustand sichtbar bleiben. */
  ctx.save(); ctx.translate(945, 450);
  poly([-17,0, 17,0, 14,-30, -14,-30], '#887d68', 2);
  ell(0,-30,14,4,'#d2c4a0',1.5);
  line(-12,-29, 12,-37,2,'#5c5142');
  ctx.restore();
}

/* ------------------------------------------------------------
   Marinestuetzpunkt, 1960er. Blech, Salz, frische Farbe und drei
   Befehle, die einander ausschliessen.
   ------------------------------------------------------------ */
function drawKaserne(T){
  var rr = seeded(1963);
  bandV(0, 0, 1400, 220, [[0,'#6f9ec0'],[0.6,'#a8c8d8'],[1,'#d4e2e4']], 7);
  // Meer hinten rechts
  bandV(900, 218, 500, 60, [[0,'#41748e'],[1,'#2f5f7a']], 4);
  ctx.globalAlpha = 0.4;
  for (var g = 0; g < 40; g++) pRect(900 + rr()*500, 224 + rr()*52, 8, 2, '#cfe4ea');
  ctx.globalAlpha = 1;
  // Ein graues Schiff am Steg
  ctx.save(); ctx.translate(1210, 276);
  poly([-170, 0, 150, 0, 130, -32, -150, -26], '#6a7278', 2.6);
  pRect(-150, -26, 280, 6, '#7f878c');
  pOutlineRect(-40, -70, 80, 46, '#79818a', '#1a1e22');
  pRect(-34, -64, 68, 8, '#3a4248');
  pRect(-6, -104, 8, 36, '#79818a');
  pRect(-24, -96, 44, 6, '#5f676e');
  line(2, -104, 60, -60, 1.6, '#3a4248');
  line(2, -104, -60, -56, 1.6, '#3a4248');
  // Nummer am Bug
  pRect(-134, -18, 6, 12, '#dfe4e6'); pRect(-124, -18, 6, 12, '#dfe4e6');
  ctx.restore();

  // Boden: Beton mit Fugen und Salzraendern
  bandV(0, 352, 1400, 118, [[0,'#b0aa9c'],[0.5,'#a09a8c'],[1,'#8a857a']], 6);
  ctx.globalAlpha = 0.4;
  for (var p = 0; p < 22; p++) pRect(p*66, 352, 3, 118, '#7a7468');
  for (var p2 = 0; p2 < 5; p2++) pRect(0, 360 + p2*26, 1400, 3, '#7a7468');
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.2;
  for (var sz = 0; sz < 30; sz++) pixelBlob(rr()*1400, 370 + rr()*90, 30, 12, '#e0e4e2', 0.5, rr);
  ctx.globalAlpha = 1;

  // Kasernengebaeude links: gelb verputzt, JNA-Standard
  bandV(-20, 120, 620, 240, [[0,'#d8c88c'],[0.5,'#c4b070'],[1,'#a89658']], 6);
  pRect(-20, 116, 620, 12, '#8a7a48');
  ziegeldach(-30, 92, 640, 30, '#8a4a36', 8);
  for (var f = 0; f < 6; f++){
    var fx = 30 + f*98;
    pOutlineRect(fx, 176, 56, 68, '#2e3640', '#1a1a16');
    ctx.globalAlpha = 0.28; pRect(fx+4, 180, 24, 60, '#a8ccdc'); ctx.globalAlpha = 1;
    pRect(fx+26, 176, 4, 68, '#c4b070'); pRect(fx, 206, 56, 4, '#c4b070');
  }
  // Tuer zur Kammer
  pOutlineRect(1010, 214, 88, 146, '#4a5a52', '#1a1a16');
  pRect(1016, 220, 76, 6, '#3f4f48');
  pRect(1080, 288, 10, 6, '#a8a8a0');
  pRect(1026, 228, 56, 26, '#33413c');
  ctx.globalAlpha = 0.8;
  for (var lt = 0; lt < 4; lt++) pRect(1032 + lt*13, 238, 8, 6, '#c9c4b0');
  ctx.globalAlpha = 1;
  // Rechts eine Lagerbaracke aus Wellblech
  bandV(600, 190, 420, 170, [[0,'#8f9aa0'],[0.5,'#7d888e'],[1,'#66717a']], 5);
  for (var wb = 0; wb < 34; wb++) pRect(600 + wb*12, 190, 5, 170, 'rgba(255,255,255,0.07)');
  ziegeldach(590, 168, 440, 24, '#5f6a70', 14);

  // Fahnenmast in der Mitte
  line(760, 356, 760, 118, 5, '#c8ccc8');
  ell(760, 114, 5, 5, '#c9a860', 1.4);
  if (FLAG.fahneGehisst){
    var wehen = Math.sin(T*2.2)*4;
    poly([764, 124, 856, 130+wehen, 852, 172+wehen, 764, 166], '#c22a2a', 0);
    poly([764, 124, 856, 130+wehen, 854, 146+wehen, 764, 141], '#2f4f8a', 0);
    pRect(800, 140, 12, 12, '#e8d84a');
  }
  // Der Farbeimer, der Pinsel und das, was schon gestrichen ist
  ctx.save(); ctx.translate(900, 448);
  poly([-16, 0, 16, 0, 13, -26, -13, -26], '#8a8a86', 2.2);
  ell(0, -26, 13, 4, FLAG.farbeBenutzt ? '#7a8a94' : '#dfe4e6', 1.6);
  line(-12, -26, 12, -34, 2, '#6a6a66');
  if (!FLAG.pinselWeg){ line(20, -4, 34, -30, 4, '#8a6a44'); pRect(30, -38, 8, 12, '#dfe4e6'); }
  ctx.restore();
  // Der Bordstein, halb weiss gestrichen
  pRect(820, 402, 340, 10, '#8f8a80');
  pRect(820, 402, FLAG.bordsteinFertig ? 340 : 130, 10, '#e4e8e6');

  // Der Steg nach rechts
  for (var pl = 0; pl < 12; pl++) pRect(1180 + pl*20, 428, 16, 40, mixHex('#6a5a44','#a89474', (pl%3)/3));
  pixelGlow(1150, 120, 330, 220, '#ffeec8', 0.14, 4);
}

/* Bewegliche und zustandsabhaengige Elemente ueber dem gemalten Raum.
   Der teure Architekturteil bleibt als festes Bild im Speicher; nur diese
   wenigen Pixel muessen in jedem Frame neu gezeichnet werden. */
function drawKaserneDynamik(T){
  if (FLAG.fahneGehisst){
    var wehen = Math.sin(T*2.2)*4;
    poly([764,124,856,130+wehen,852,172+wehen,764,166], '#c22a2a', 0);
    poly([764,124,856,130+wehen,854,146+wehen,764,141], '#2f4f8a', 0);
    pRect(800,140,12,12,'#e8d84a');
  }
  ctx.save(); ctx.translate(900,448);
  poly([-16,0,16,0,13,-26,-13,-26], '#777d80', 2.2);
  ell(0,-26,13,4, FLAG.farbeBenutzt ? '#7a8a94' : '#edf0ec', 1.6);
  line(-12,-26,12,-34,2,'#62686a');
  if (!FLAG.pinselWeg){
    line(20,-4,34,-30,4,'#7a5b3c');
    pRect(30,-38,8,12,'#edf0ec');
  }
  ctx.restore();
  /* Die neue Kulisse hat die echte Kaimauer bereits im Bild. Dieser
     schmale Zustandstreifen zeigt trotzdem eindeutig, wie weit M. ist. */
  pRect(820,402,238,9,'rgba(72,74,72,0.72)');
  pRect(820,402, FLAG.bordsteinFertig ? 238 : 92,9,'#e7e9e3');
}
