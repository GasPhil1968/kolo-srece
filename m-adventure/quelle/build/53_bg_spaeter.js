
/* ============================================================
   Sektion 11  HINTERGRUENDE · SARAJEVO, DEUTSCHLAND, RUECKKEHR
   ============================================================ */

/* ------------------------------------------------------------
   Sarajevo, 1970er. Ein Amt, ein Kiosk, eine Strassenbahn und
   ein Stadion. Man kauft hier nichts, man organisiert.
   ------------------------------------------------------------ */
function drawSarajevo(T){
  var rr = seeded(1974);
  bandV(0, 0, 1400, 210, [[0,'#8aa2b4'],[0.55,'#b6c2c4'],[1,'#d8d6c8']], 7);
  // Berge um die Stadt, immer sichtbar
  ctx.globalAlpha = 0.45;
  poly([0,214, 220,132, 470,196, 720,124, 980,190, 1220,140, 1400,182, 1400,260, 0,260], '#6f7d76', 0);
  ctx.globalAlpha = 1;
  // Haeuser am Hang, klein und dicht
  for (var hh = 0; hh < 60; hh++){
    var hx = rr()*1400, hy = 176 + rr()*72;
    ctx.globalAlpha = 0.5;
    pRect(hx, hy, 14, 12, mixHex('#c9bfa4','#8a8072', rr()));
    pRect(hx-2, hy-4, 18, 5, '#8a4a36');
    ctx.globalAlpha = 1;
  }

  // Boden: Asphalt mit Flicken, Bordstein
  bandV(0, 350, 1400, 120, [[0,'#7a766e'],[0.5,'#6c6862'],[1,'#5c5854']], 6);
  ctx.globalAlpha = 0.25;
  for (var a = 0; a < 26; a++) pixelBlob(rr()*1400, 366 + rr()*94, 40 + rr()*50, 16, '#3f3c38', 0.7, rr);
  ctx.globalAlpha = 1;
  pRect(0, 352, 1400, 6, '#8f8a80');

  // Das Amtsgebaeude: oesterreichisch, gelb, mit zu vielen Fenstern
  bandV(430, 96, 480, 264, [[0,'#d8c48a'],[0.5,'#c4ae70'],[1,'#a8945c']], 6);
  pRect(430, 92, 480, 12, '#8a7a48');
  /* Vierundzwanzig Fenster, sagt die Erinnerung. Achtzehn, sagt der
     Erzaehler beim zweiten Hinsehen -- und dann sind es achtzehn.
     Die aeussere Spalte blendet sich weg, waehrend er das sagt. */
  var au = unsch('amt');
  for (var r2 = 0; r2 < 3; r2++){
    for (var c2 = 0; c2 < 6; c2++){
      var fx = 456 + c2*74, fy = 124 + r2*72;
      if (c2 === 5){ ctx.globalAlpha = 1 - au; if (au > 0.97) continue; }
      pOutlineRect(fx, fy, 46, 56, '#2e3038', '#1a1a16');
      ctx.globalAlpha = (c2 === 5 ? (1-au) : 1) * 0.26;
      pRect(fx+3, fy+3, 20, 50, '#a8ccdc');
      ctx.globalAlpha = (c2 === 5) ? (1-au) : 1;
      pRect(fx+21, fy, 4, 56, '#c4ae70');
      ctx.globalAlpha = 1;
    }
  }
  // Eingang mit Stufen und Schild
  pOutlineRect(590, 240, 110, 120, '#4a4038', '#1a1a16');
  pRect(596, 246, 98, 6, '#3a332c');
  pRect(596, 252, 46, 102, '#5a5048'); pRect(648, 252, 46, 102, '#5a5048');
  pRect(560, 356, 170, 6, '#a8a094'); pRect(568, 362, 154, 6, '#98907e');
  pOutlineRect(608, 210, 76, 26, '#b8b0a0', '#2a241c');
  ctx.globalAlpha = 0.8;
  pRect(614, 218, 62, 4, '#3a352c'); pRect(614, 226, 44, 3, '#3a352c');
  ctx.globalAlpha = 1;

  // Kiosk: Zeitungen, Zigaretten, Kaffee und alles, was man braucht
  ctx.save(); ctx.translate(860, 444);
  pOutlineRect(-54, -116, 108, 116, '#3f6a5e', '#141a18');
  pRect(-48, -110, 96, 52, '#2a3a36');
  ctx.globalAlpha = 0.3; pRect(-48, -110, 40, 52, '#a8ccdc'); ctx.globalAlpha = 1;
  pRect(-48, -54, 96, 8, '#4f7a6e');
  poly([-64, -116, 64, -116, 56, -136, -56, -136], '#c9422e', 2.4);
  for (var w = 0; w < 4; w++) pRect(-44 + w*24, -50, 18, 22, mixHex('#d8cfb4','#8a3a2e', (w%2)));
  pRect(20, -104, 26, 36, '#e2ddcc');
  ctx.restore();

  // Strassenbahnschiene und ein Wagen, der langsam durchfaehrt
  pRect(0, 424, 1400, 4, '#7a7468'); pRect(0, 444, 1400, 4, '#7a7468');
  var tx = ((T * 26) % 2200) - 500;
  if (tx > -420 && tx < 1420){
    ctx.save(); ctx.translate(tx, 430);
    pOutlineRect(-180, -110, 360, 110, '#c94a2e', '#1a1210');
    pRect(-174, -104, 348, 8, '#e26a44');
    for (var tw = 0; tw < 6; tw++){
      pOutlineRect(-160 + tw*56, -92, 44, 46, '#2e3a44', '#1a1210');
      ctx.globalAlpha = 0.3; pRect(-157 + tw*56, -89, 18, 40, '#b8d8e4'); ctx.globalAlpha = 1;
    }
    pRect(-176, -36, 352, 22, '#8a3a24');
    ell(-120, 0, 14, 14, '#1c1a18', 2.2); ell(110, 0, 14, 14, '#1c1a18', 2.2);
    line(-20, -110, -10, -160, 3, '#6a6a66'); line(-10, -160, 60, -168, 3, '#6a6a66');
    ctx.restore();
  }
  pRect(0, 268, 1400, 3, '#5a5a56');

  // Stadionmauer rechts: Beton, Plakate, ein Tor
  bandV(1160, 150, 240, 210, [[0,'#b0aa9c'],[0.5,'#9e9789'],[1,'#867f74']], 5);
  pRect(1160, 146, 240, 10, '#7a7468');
  for (var sp = 0; sp < 6; sp++) pRect(1176 + sp*38, 156, 8, 204, '#8a847a');
  pOutlineRect(1244, 232, 92, 128, '#3f4a52', '#1a1a16');
  for (var gt = 0; gt < 8; gt++) pRect(1250 + gt*11, 238, 5, 116, '#333c44');
  pOutlineRect(1188, 170, 180, 48, '#2f4f8a', '#1a1a16');
  ctx.globalAlpha = 0.85;
  pRect(1198, 182, 120, 10, '#e8e4d4'); pRect(1198, 198, 84, 8, '#e8d84a');
  ctx.globalAlpha = 1;

  // Pfuetze, in der sich die Fassade spiegelt
  ctx.globalAlpha = 0.28;
  ell(500, 460, 70, 12, '#a8bcc4', 0);
  ctx.globalAlpha = 1;
  pixelGlow(240, 110, 320, 220, '#ffe4b0', 0.12, 4);
}

/* Die Strassenbahn bleibt lebendig, waehrend die detailreiche Stadt nur
   einmal als Bild dekodiert wird. Sie liegt absichtlich hinter Figuren. */
function drawSarajevoDynamik(T){
  var tx = ((T * 26) % 2200) - 500;
  if (tx <= -420 || tx >= 1420) return;
  ctx.save(); ctx.translate(tx,430);
  pOutlineRect(-180,-110,360,110,'#b7442d','#1a1210');
  pRect(-174,-104,348,8,'#dc6643');
  for (var tw=0; tw<6; tw++){
    pOutlineRect(-160+tw*56,-92,44,46,'#2e3a44','#1a1210');
    ctx.globalAlpha=0.28;
    pRect(-157+tw*56,-89,18,40,'#b8d8e4');
    ctx.globalAlpha=1;
  }
  pRect(-176,-36,352,22,'#803723');
  ell(-120,0,14,14,'#1c1a18',2.2);
  ell(110,0,14,14,'#1c1a18',2.2);
  line(-20,-110,-10,-160,3,'#5d5e5c');
  line(-10,-160,60,-168,3,'#5d5e5c');
  ctx.restore();
}

/* ------------------------------------------------------------
   Das Werk, 1970er. Kuehl, laut, geordnet. Alles ist beschriftet,
   und nichts davon kann M. lesen.
   ------------------------------------------------------------ */
var werkTakt = 0;
function werkBandVorn(){
  /* Das Foerderband laeuft quer durch den Vordergrund. Wer dahinter
     steht, wird davon halb verdeckt -- das ist der Grund, warum es hier
     als eigene Ebene liegt und nicht im Hintergrund. */
  var t = werkTakt;
  pRect(0, 440, 1400, 26, '#4a5058');
  pRect(0, 436, 1400, 6, '#6a7078');
  for (var i = 0; i < 100; i++){
    var bx = ((i*28 - t*40) % 1428) - 28;
    pRect(bx, 442, 20, 22, mixHex('#3a4048','#5a626a', (i%3)/3));
  }
  for (var s = 0; s < 12; s++){
    var sx = s*124 + 20;
    pRect(sx, 464, 12, 8, '#33383e');
  }
  // Werkstuecke auf dem Band
  for (var w = 0; w < 9; w++){
    var wx = ((w*160 - t*40) % 1560) - 80;
    pOutlineRect(wx, 418, 46, 24, '#8a8f94', '#22262a');
    pRect(wx+6, 422, 34, 6, '#a8adb2');
    ell(wx+23, 430, 7, 7, '#3a4048', 1.6);
  }
}
function drawWerk(T){
  werkTakt = T;
  var rr = seeded(1971);
  // Hallendach mit Sheddaechern und Oberlicht
  bandV(0, 0, 1400, 130, [[0,'#3a4048'],[0.6,'#4a5058'],[1,'#3e444c']], 5);
  for (var sd = 0; sd < 7; sd++){
    var sx = sd*200;
    poly([sx, 130, sx+100, 40, sx+200, 130], '#33383e', 0);
    pOutlineRect(sx+104, 44, 88, 76, '#8fa4b4', '#22262a');
    ctx.globalAlpha = 0.35;
    pRect(sx+108, 48, 40, 68, '#cfe0ea'); ctx.globalAlpha = 1;
    for (var gl = 0; gl < 3; gl++) pRect(sx+104, 60 + gl*22, 88, 3, '#3a4048');
  }
  // Traeger und Rohre unter dem Dach
  pRect(0, 128, 1400, 12, '#565c64');
  for (var tr = 0; tr < 9; tr++){
    pRect(tr*160 + 40, 132, 10, 60, '#4a5058');
    line(tr*160 + 45, 140, tr*160 + 125, 176, 2.4, '#5a626a');
    line(tr*160 + 125, 140, tr*160 + 45, 176, 2.4, '#5a626a');
  }
  pRect(0, 154, 1400, 9, '#7a5f3a');
  pRect(0, 176, 1400, 7, '#4a6a6a');
  // Leuchtstoffroehren
  for (var lr = 0; lr < 10; lr++){
    pRect(lr*146 + 30, 190, 96, 8, '#e8f0f4');
    ctx.globalAlpha = 0.10; pixelGlow(lr*146 + 78, 200, 130, 90, '#e8f0f4', 0.5, 3); ctx.globalAlpha = 1;
  }
  // Wand: hellgrau lackiert bis Brusthoehe, darueber Beton
  bandV(0, 196, 1400, 106, [[0,'#8f959c'],[1,'#787e86']], 4);
  bandV(0, 296, 1400, 62, [[0,'#5e6a72'],[1,'#4e5a62']], 4);
  pRect(0, 292, 1400, 6, '#3a4248');

  // Boden: Estrich mit gelben Markierungen
  bandV(0, 352, 1400, 118, [[0,'#77797c'],[0.5,'#6a6c70'],[1,'#5c5e62']], 5);
  ctx.globalAlpha = 0.7;
  pRect(0, 396, 1400, 6, '#c9a02e'); pRect(0, 410, 1400, 3, '#c9a02e');
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.18;
  for (var oi = 0; oi < 18; oi++) pixelBlob(rr()*1400, 400 + rr()*66, 34, 12, '#33383e', 0.7, rr);
  ctx.globalAlpha = 1;
  // Spind links
  for (var sp = 0; sp < 4; sp++){
    pOutlineRect(240 + sp*46, 222, 44, 136, '#4a6a72', '#1a2226');
    pRect(246 + sp*46, 232, 32, 12, '#33474e');
    ell(276 + sp*46, 292, 3, 3, '#a8b0b4', 0);
  }
  // Die Maschine: Presse mit Handrad und Fussschalter
  ctx.save(); ctx.translate(820, 440);
  pOutlineRect(-70, -190, 140, 190, '#5a636b', '#1a1e22');
  pRect(-62, -184, 124, 26, '#3a4248');
  pRect(-54, -150, 108, 70, '#424a52');
  ctx.globalAlpha = 0.3; pRect(-54, -150, 44, 70, '#8fb4c4'); ctx.globalAlpha = 1;
  // Handrad
  ell(52, -120, 22, 22, '#7a4a3a', 3);
  ell(52, -120, 6, 6, '#3a2a22', 1.8);
  for (var hr = 0; hr < 6; hr++){ var ha = hr*1.047 + T*0.4*(FLAG.maschineLaeuft?1:0); line(52, -120, 52+Math.cos(ha)*19, -120+Math.sin(ha)*19, 2.4, '#8a5a44'); }
  // Kontrolllampen
  ell(-40, -170, 6, 6, FLAG.maschineLaeuft ? '#5ad86a' : '#3a4a3e', 1.4);
  ell(-22, -170, 6, 6, FLAG.maschineLaeuft ? '#3a3a2e' : '#e05a3a', 1.4);
  // Fussschalter
  pOutlineRect(-40, -18, 40, 18, '#c9a02e', '#1a1e22');
  // Piktogrammschild an der Maschine
  pOutlineRect(-66, -110, 40, 44, '#e8e4d4', '#22262a');
  pRect(-60, -104, 28, 4, '#c22a2a');
  ell(-46, -88, 9, 9, '#33383e', 1.6);
  pRect(-52, -76, 14, 4, '#33383e');
  ctx.restore();

  // Palette mit Kisten
  ctx.save(); ctx.translate(1140, 452);
  for (var pk = 0; pk < 3; pk++){
    pOutlineRect(-50 + pk*4, -30 - pk*30, 96, 30, mixHex('#8a6a44','#b89a6c',(pk%2)*0.4), '#1a140e');
    pRect(-44 + pk*4, -24 - pk*30, 84, 3, '#6a5030');
  }
  pRect(-56, -8, 112, 8, '#7a6244');
  ctx.restore();

  // Die Tafel mit dem Schichtplan und den Piktogrammen
  pOutlineRect(950, 216, 130, 96, '#2e3a34', '#1a1a16');
  ctx.globalAlpha = 0.9;
  for (var ta = 0; ta < 5; ta++) pRect(958, 226 + ta*16, 40 + (ta%3)*26, 4, '#dfe4dc');
  ctx.globalAlpha = 1;
  pRect(1040, 226, 32, 32, '#e8e4d4');
  pRect(1044, 230, 24, 6, '#c22a2a'); ell(1056, 246, 8, 8, '#33383e', 1.4);

  // Kantinentuer ganz rechts, mit Fensterchen und Stimmengewirr
  pOutlineRect(1270, 214, 106, 146, '#5a6a5e', '#1a1a16');
  pOutlineRect(1292, 236, 62, 54, '#a8c4cc', '#1a1a16');
  ctx.globalAlpha = 0.4; pRect(1296, 240, 26, 46, '#dfeef4'); ctx.globalAlpha = 1;
  pRect(1360, 288, 10, 6, '#a8a8a0');
  // Aus der Kantine faellt warmes Licht -- der einzige warme Punkt hier
  ctx.globalAlpha = 0.4;
  poly([1270, 214, 1376, 214, 1400, 470, 1180, 470], '#ffd68c', 0);
  ctx.globalAlpha = 1;

}

/* ------------------------------------------------------------
   Deutschland, Winter 1991. Eine Telefonzelle, ein Schaufenster,
   in dem der Krieg laeuft, und ein Paket, das durch muss.
   ------------------------------------------------------------ */
function drawTelefon(T){
  var rr = seeded(1991);
  // Abendhimmel, tief
  bandV(0, 0, 1300, 200, [[0,'#1a2032'],[0.6,'#2e3a50'],[1,'#4a4a58']], 7);
  // Haeuserzeile: Nachkriegsbau, Waschbeton, wenig Fantasie
  bandV(0, 118, 1300, 244, [[0,'#5a5a58'],[0.5,'#4e4e4c'],[1,'#414140']], 5);
  pRect(0, 114, 1300, 8, '#33332f');
  for (var r2 = 0; r2 < 3; r2++){
    for (var c2 = 0; c2 < 13; c2++){
      var fx = 24 + c2*98, fy = 134 + r2*66;
      var an = ((c2*3 + r2*7) % 5) < 2;
      pOutlineRect(fx, fy, 54, 48, an ? '#e8c26a' : '#2a2e34', '#1a1a18');
      if (an){
        ctx.globalAlpha = 0.5; pRect(fx+4, fy+4, 22, 40, '#fff0c0'); ctx.globalAlpha = 1;
        pRect(fx+30, fy+18, 18, 26, '#c9a05a');
      } else { ctx.globalAlpha = 0.24; pRect(fx+4, fy+4, 22, 40, '#7a90a4'); ctx.globalAlpha = 1; }
    }
  }
  // Erdgeschoss: Ladenzeile
  bandV(0, 240, 1300, 122, [[0,'#3a3f44'],[1,'#2e3236']], 4);
  // Gehweg: nasse Platten, Schnee an den Raendern
  bandV(0, 354, 1300, 116, [[0,'#4a4e52'],[0.5,'#42464a'],[1,'#383c40']], 5);
  ctx.globalAlpha = 0.4;
  for (var p = 0; p < 22; p++) pRect(p*60, 354, 3, 116, '#5a5e62');
  for (var p2 = 0; p2 < 5; p2++) pRect(0, 362 + p2*24, 1300, 3, '#5a5e62');
  ctx.globalAlpha = 1;
  // Schneereste
  ctx.globalAlpha = 0.5;
  for (var sn = 0; sn < 26; sn++) pixelBlob(rr()*1300, 440 + rr()*28, 30 + rr()*40, 10, '#c8d4dc', 0.6, rr);
  ctx.globalAlpha = 1;
  // Spiegelungen im nassen Boden
  ctx.globalAlpha = 0.16;
  pRect(390, 400, 90, 70, '#d8a82a');
  pRect(1030, 400, 110, 70, '#c9a02e');
  ctx.globalAlpha = 1;
  // Schaufenster mit Fernsehern: hier laeuft der Krieg
  pOutlineRect(790, 236, 190, 122, '#1a2026', '#0e1114');
  ctx.globalAlpha = 0.2; pRect(796, 242, 70, 110, '#8fb4c4'); ctx.globalAlpha = 1;
  for (var tv = 0; tv < 4; tv++){
    var tvx = 806 + (tv%2)*88, tvy = 254 + Math.floor(tv/2)*54;
    pOutlineRect(tvx, tvy, 74, 46, '#4a423a', '#0e1114');
    var flack = 0.6 + 0.4*Math.abs(Math.sin(T*7 + tv*1.3));
    ctx.globalAlpha = flack;
    pRect(tvx+5, tvy+5, 64, 34, mixHex('#33506a','#a8c0d0', (Math.sin(T*3+tv)+1)/2));
    ctx.globalAlpha = 1;
    // Auf jedem Schirm dasselbe Gesicht, nur Balken
    ctx.globalAlpha = 0.7;
    pRect(tvx+26, tvy+12, 20, 22, '#c9b48c');
    pRect(tvx+8, tvy+34, 58, 5, '#c22a2a');
    ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = 0.14;
  pixelGlow(886, 300, 300, 200, '#8fb4d8', 0.6, 4); ctx.globalAlpha = 1;

  // Postamt rechts
  pOutlineRect(1010, 214, 250, 148, '#3f4a52', '#141a1e');
  pOutlineRect(1040, 250, 96, 112, '#c9a02e', '#141a1e');
  pRect(1046, 258, 84, 8, '#a8841e');
  pOutlineRect(1160, 246, 74, 58, '#e8e4d4', '#141a1e');
  pRect(1168, 254, 58, 6, '#33383e'); pRect(1168, 266, 40, 5, '#33383e');
  pRect(1168, 278, 50, 5, '#c22a2a');
  // Postgelbes Licht auf den Gehweg
  ctx.globalAlpha = 0.28;
  poly([1040, 250, 1136, 250, 1180, 470, 980, 470], '#ffd66a', 0);
  ctx.globalAlpha = 1;

  // Die Telefonzelle: gelb, verglast, das Zentrum des Kapitels
  ctx.save(); ctx.translate(430, 452);
  pOutlineRect(-56, -190, 112, 190, '#d8a82a', '#1a1408');
  pRect(-50, -184, 100, 8, '#f0c04a');
  pOutlineRect(-46, -172, 92, 130, '#22303a', '#1a1408');
  ctx.globalAlpha = 0.24; pRect(-42, -168, 36, 122, '#b8d8e8'); ctx.globalAlpha = 1;
  pRect(-2, -172, 4, 130, '#d8a82a');
  pRect(-46, -110, 92, 4, '#d8a82a');
  // Innen: der Apparat
  pOutlineRect(4, -140, 34, 44, '#3a3f44', '#1a1408');
  pRect(8, -136, 26, 14, '#5a6068');
  for (var kb = 0; kb < 9; kb++) pRect(10 + (kb%3)*9, -118 + Math.floor(kb/3)*7, 6, 5, '#8a9098');
  pRect(-8, -138, 12, 30, '#22262a');
  // Muenzschlitz, hell
  pRect(20, -146, 12, 4, '#c9c4b0');
  // Dach und Lampe
  poly([-62, -190, 62, -190, 56, -204, -56, -204], '#c9982a', 2.4);
  ctx.globalAlpha = 0.7; pRect(-30, -186, 60, 5, '#fff0b0'); ctx.globalAlpha = 1;
  ctx.restore();
  pixelGlow(430, 330, 210, 190, '#ffd66a', 0.22, 5);

  // Der Karton auf dem Gehweg, halb gepackt
  ctx.save(); ctx.translate(700, 452);
  if (FLAG.paketZu){
    pOutlineRect(-46, -54, 92, 54, '#a8875c', '#1a140e');
    pRect(-46, -30, 92, 5, '#8a6c46');
    pRect(-4, -54, 8, 54, '#c9b48c');
    pRect(-30, -46, 46, 12, '#e8e4d4');
    pRect(-26, -42, 34, 3, '#33383e');
  } else {
    pOutlineRect(-46, -48, 92, 48, '#a8875c', '#1a140e');
    poly([-46, -48, -60, -70, 32, -70, 46, -48], '#b8975c', 2);
    poly([46, -48, 60, -72, -32, -72, -46, -48], '#98764c', 2);
    // Inhalt: Kaffee, Zucker, Schokolade, eine Jacke
    pRect(-34, -44, 22, 14, '#5a3a24');
    pRect(-8, -46, 20, 16, '#c9c4b0');
    pRect(16, -44, 18, 12, '#8a2a3a');
  }
  ctx.restore();

  // Schneeflocken, wenige und langsam
  ctx.globalAlpha = 0.5;
  for (var sf = 0; sf < 50; sf++){
    var fx2 = (sf*97 + Math.sin(T*0.5 + sf)*30) % 1300;
    var fy2 = ((sf*53 + T*22) % 470);
    ctx.fillStyle = '#e8f0f4';
    ctx.fillRect(psnap(fx2), psnap(fy2), 2, 2);
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------
   Podaca, der Hausbau. Zwischen 2004 und 2018, aber es sieht
   jeden Sommer gleich aus: halb fertig, und das Meer wartet.
   ------------------------------------------------------------ */
function bauBucht(T){
  /* Ueberhang nach links, damit der Ausschnitt bei jeder Kamera-
     position gefuellt ist -- die Fernlage wandert langsamer mit. */
  var x0 = 540, x1 = 1460;
  bandV(x0, 100, x1-x0, 76, [[0,'#f0b070'],[0.5,'#e8c48c'],[1,'#dcd4b8']], 6);
  /* Hvar und dahinter Brac: zwei lange, flache Striche im Dunst.
     Keine Felsnadeln, keine Buchten -- von hier sieht man nur, dass
     da drueben Land ist. */
  ctx.globalAlpha = 0.34;
  poly([x0,178, 760,170, 940,163, 1140,168, 1320,162, x1,170, x1,186, x0,186], '#8a97a2', 0);
  ctx.globalAlpha = 0.20;
  poly([x0,170, 900,158, 1180,164, x1,157, x1,176, x0,176], '#94a1ac', 0);
  ctx.globalAlpha = 1;
  bandV(x0, 184, x1-x0, 140, [[0,'#31677f'],[0.5,'#2a5a73'],[1,'#254e66']], 6);
  // Der tuerkise Saum ueber dem Kies, direkt unter der Kueste
  bandV(x0, 318, x1-x0, 30, [[0,'#3f8fa4'],[0.6,'#69b8b6'],[1,'#93d2c6']], 4);
  // Sonnenstrasse auf dem Wasser
  for (var i = 0; i < 34; i++){
    var gy = 190 + i*4;
    var gw = 20 + Math.abs(Math.sin(T*0.9 + i*0.4))*54;
    ctx.globalAlpha = 0.20 + Math.abs(Math.sin(T + i))*0.18;
    ctx.fillStyle = '#ffd8a0';
    ctx.fillRect(psnap(1150 - gw/2), psnap(gy), psnap(gw), 3);
  }
  ctx.globalAlpha = 1;
}
function bauGeruestVorn(){
  /* Ein Geruest steht nur dort, wo gemauert wird -- ueber die ganze
     Bildbreite gezogen wuerde es wie ein Zaun wirken und den Blick auf
     die Bucht zerschneiden, der der eigentliche Grund fuer dieses
     Grundstueck ist. */
  var x0 = 130, x1 = 640;
  pRect(x0, 300, x1-x0, 8, '#8a8a80');
  pRect(x0, 305, x1-x0, 3, '#66665e');
  pRect(x0, 372, x1-x0, 7, '#8a8a80');
  for (var i = 0; i < 4; i++){
    var gx = x0 + 16 + i*160;
    pRect(gx, 300, 8, 168, '#8a8a80');
    pRect(gx+2, 300, 3, 168, '#a6a69c');
    line(gx+6, 306, gx+150, 368, 2.2, '#7a7a70');
  }
  // Ein Brett auf dem Geruest, mit Zementeimer
  pRect(x0+90, 286, 210, 14, '#8a7248');
  poly([x0+180, 286, x0+214, 286, x0+210, 258, x0+184, 258], '#8a8a86', 2);
  line(x0+214, 268, x0+236, 276, 2.4, '#6a6a66');
}
function drawBau(T){
  var rr = seeded(2004);
  bandV(0, 0, 1400, 150, [[0,'#e4a866'],[0.5,'#eec48c'],[1,'#e2dcc4']], 7);
  /* Das Biokovo. Es steht zwei Kilometer hinter dem Wasser fast
     senkrecht und laeuft oben aus dem Bild -- man baut hier nicht an
     einem Huegel, man baut auf dem schmalen Streifen davor. Ohne
     diesen Berg ist Podaca irgendein Mittelmeerort. */
  biokovo(-60, 1060, 300, 290, 0.42, 0.86);
  /* Davor der Karsthang. Im August ist daran nichts gruen: grauer
     Fels, brauner Boden, und was waechst, waechst grau. */
  poly([0,286, 300,258, 620,290, 936,262, 936,470, 0,470], '#8f8a70', 0);
  poly([0,470, 0,330, 320,308, 650,336, 936,306, 936,470], '#7d7860', 0);
  for (var st = 0; st < 40; st++){
    var sx2 = rr()*936, sy2 = 270 + rr()*110;
    ctx.globalAlpha = 0.3 + rr()*0.3;
    ctx.fillStyle = rr() > 0.5 ? '#c8c2ac' : '#6a6553';
    ctx.fillRect(psnap(sx2), psnap(sy2), psnap(10+rr()*26), psnap(4+rr()*6));
  }
  ctx.globalAlpha = 1;
  // Trockene Buesche: Salbei, Rosmarin, Ginster. Graugruen, nicht gruen.
  for (var b = 0; b < 26; b++){
    var bx = rr()*930, by = 280 + rr()*110;
    ell(bx, by, 11+rr()*9, 7+rr()*5, rr()>0.5 ? '#6a7358' : '#7a8062', 1.2);
    ell(bx-4, by-4, 6, 4, '#8a8f6e', 0);
  }
  // Aleppokiefern am Hang. Zypressen stehen hier nur beim Friedhof.
  pinie(150, 330, 1.05, 3);
  pinie(232, 344, 0.86, 8);
  pinie(70, 352, 0.72, 12);
  // Agaven an der alten Terrassenmauer
  trockenmauer(0, 352, 940, 16, 55, '#cfc4a8', '#8a8272');
  agave(96, 356, 0.8); agave(300, 358, 0.68); agave(560, 356, 0.74);
  ctx.save(); ctx.translate(760, 350);
  pSegOutlined(0, 0, -6, -46, 12, '#7a7060');
  for (var ob = 0; ob < 7; ob++)
    ell(-34 + ob*11, -62 - (ob%3)*10, 16, 11, ob%2 ? '#8e9880' : '#7c876c', 1.4);
  ctx.restore();

  // Boden: Bauschutt, Erde, Betonstaub
  bandV(0, 368, 1400, 102, [[0,'#c2b79c'],[0.5,'#b0a58a'],[1,'#9a9076']], 6);
  ctx.globalAlpha = 0.3;
  for (var sc = 0; sc < 70; sc++)
    pRect(rr()*1400, 360 + rr()*104, 6 + rr()*16, 4, rr()>0.5 ? '#dcd4bc' : '#7a7260');
  ctx.globalAlpha = 1;
  // Reifenspuren
  ctx.globalAlpha = 0.22;
  for (var ts = 0; ts < 60; ts++){ pRect(ts*24, 430 + Math.sin(ts*0.2)*8, 16, 5, '#6a6252'); pRect(ts*24, 452 + Math.sin(ts*0.2)*8, 16, 5, '#6a6252'); }
  ctx.globalAlpha = 1;

  // Der Rohbau: Betonskelett mit halb gemauerten Waenden
  ctx.save(); ctx.translate(300, 462);
  // Bodenplatte
  pRect(-120, -14, 400, 16, '#c2b9a2');
  // Stuetzen und Decke
  for (var st = 0; st < 4; st++) pRect(-110 + st*126, -180, 20, 168, '#c8bfa6');
  pRect(-120, -196, 400, 20, '#ccc3ac');
  pRect(-120, -196, 400, 5, '#dad2bc');
  // Zweites Geschoss, nur angefangen
  if (FLAG.kap7Fertig || FLAG.dachDrauf){
    for (var s2 = 0; s2 < 4; s2++) pRect(-110 + s2*126, -330, 20, 138, '#c8bfa6');
    ziegeldach(-136, -368, 432, 40, '#a85c3a', 41);
  } else {
    for (var s3 = 0; s3 < 4; s3++) pRect(-110 + s3*126, -262, 20, 68, '#c8bfa6');
    // Bewehrungseisen, die in den Himmel stehen -- das Wahrzeichen
    for (var e = 0; e < 12; e++){
      var ex = -108 + Math.floor(e/3)*126 + (e%3)*7;
      line(ex, -262, ex + Math.sin(e)*4, -302, 2.4, '#8a6a4a');
    }
  }
  // Ausgemauerte Felder
  trockenmauer(-90, -176, 106, 164, 71, '#d8cdb4', '#9a9078');
  trockenmauer(36, -176, 106, 100, 73, '#d0c5aa', '#928872');
  if (FLAG.steineDa) trockenmauer(162, -176, 106, 132, 77, '#d8cdb4', '#9a9078');
  // Fensterloch mit Sturz
  pRect(-70, -140, 60, 4, '#8a8478');
  pOutlineRect(-70, -136, 60, 56, '#2e3a3e', '#1a1a16');
  ctx.restore();

  // Der Betonmischer
  ctx.save(); ctx.translate(560, 452);
  pRect(-34, -14, 68, 14, '#5a5a52');
  ell(-30, 0, 12, 12, '#2a2a26', 2); ell(30, 0, 12, 12, '#2a2a26', 2);
  ctx.save(); ctx.translate(0, -52); ctx.rotate(FLAG.mischerLaeuft ? Math.sin(T*3)*0.1 - 0.35 : -0.35);
  poly([-30, 22, 30, 22, 24, -22, -24, -22], '#e8a02a', 2.6);
  ell(0, -22, 24, 8, '#c98a24', 2);
  ctx.restore();
  pRect(-8, -30, 16, 18, '#4a4a44');
  line(28, -40, 46, -20, 3.4, '#5a5a52');
  ctx.restore();

  // Steinhaufen und Sandhaufen
  for (var sh = 0; sh < 14; sh++){
    var shx = 850 + (sh%5)*22, shy = 452 - Math.floor(sh/5)*13;
    pOutlineRect(shx, shy - 12, 26, 12, mixHex('#cfc4a8','#a89a80', (sh%3)/3), '#5a5448');
  }
  poly([940, 462, 1050, 462, 1010, 414, 970, 414], '#d8c48c', 2);
  ctx.globalAlpha = 0.3; poly([940, 462, 1050, 462, 1030, 440, 950, 440], '#b8a470', 0); ctx.globalAlpha = 1;
  line(1040, 462, 1064, 400, 4, '#7a6a4a');
  poly([1060, 400, 1084, 392, 1088, 404, 1064, 412], '#8a8a8e', 2);

  // Der Klapptisch mit den Genehmigungen: das eigentliche Hindernis
  ctx.save(); ctx.translate(1030, 448);
  poly([-56, -46, 56, -46, 62, -38, -62, -38], '#c9bfa4', 2.4);
  pRect(-46, -38, 6, 38, '#7a7a72'); pRect(40, -38, 6, 38, '#7a7a72');
  for (var pp = 0; pp < 4; pp++){
    ctx.save(); ctx.translate(-34 + pp*24, -50); ctx.rotate((pp-1.5)*0.06);
    pOutlineRect(-12, -4, 26, 8, '#e8e4d4', '#7a7264');
    ctx.restore();
  }
  pRect(-4, -54, 14, 5, '#8a2a2a');
  ctx.restore();

  // Die Gestalt am Hang: erst am Abend, erst wenn alles andere getan ist
  if (FLAG.abendGekommen && !FLAG.gestaltGesprochen){
    ctx.globalAlpha = 0.7;
    babaRoga(1330, 400, T, 0.30, false);
    ctx.globalAlpha = 1;
  }
  pixelGlow(1180, 130, 340, 240, FLAG.abendGekommen ? '#ff9a5a' : '#fff0c0', 0.18, 5);
}
