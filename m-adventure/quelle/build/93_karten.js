
/* ============================================================
   Sektion 28  KAPITELKARTEN
   ------------------------------------------------------------
   Jedes Kapitel bekommt ein bewegtes Bild statt einer Textkarte
   auf Schwarz: ein einziges Zeichen, das den Ton setzt, bevor
   der erste Raum sichtbar wird.
   ============================================================ */
function motivKarren(t){
  bandV(0, 0, LW, 250, [[0,'#b6c6c2'],[0.6,'#d4d8c8'],[1,'#e8e2cc']], 6);
  ctx.globalAlpha = 0.45;
  poly([0,262, 220,196, 470,246, 720,190, LW,236, LW,320, 0,320], '#8d9784', 0);
  ctx.globalAlpha = 1;
  bandV(0, 244, LW, 226, [[0,'#c0b69a'],[0.4,'#aca285'],[1,'#948a70']], 7);
  var rr = seeded(1953);
  for (var i = 0; i < 60; i++){
    ctx.globalAlpha = 0.2 + rr()*0.2;
    ctx.fillStyle = rr() > 0.5 ? '#ded6c0' : '#7a7058';
    ctx.fillRect(psnap(rr()*LW), psnap(310 + rr()*150), psnap(8+rr()*20), 4);
  }
  ctx.globalAlpha = 1;
  // Ein Rad, allein im Staub, das langsam zur Ruhe kommt
  var wob = Math.max(0, 1 - t*0.32);
  ctx.save();
  ctx.translate(LW/2, 372);
  ctx.rotate(Math.sin(t*4.2) * 0.35 * wob);
  ell(0, 0, 62, 62, '#6a5540', 4.4);
  ell(0, 0, 15, 15, '#4a3a28', 3);
  for (var s = 0; s < 8; s++){
    var a = s * 0.785;
    line(0, 0, Math.cos(a)*56, Math.sin(a)*56, 4, '#5a4a34');
  }
  ctx.restore();
  ctx.globalAlpha = 0.28;
  ell(LW/2, 438, 80, 14, '#5a5040', 0);
  ctx.globalAlpha = 1;
  pixelGlow(LW - 140, 110, 300, 200, '#fff4d0', 0.15, 4);
}
function motivFahnen(t){
  bandV(0, 0, LW, 300, [[0,'#7fa8c4'],[0.55,'#b8ccd0'],[1,'#d8d0b8']], 6);
  // Haeuserzeile als Silhouette, mit Daechern statt Kanten
  var rr = seeded(1955);
  for (var h = 0; h < 8; h++){
    var hx = -40 + h*140, hw = 150, hoehe = 190 + (h%3)*44 + (h%2)*18;
    var hy = 470 - hoehe;
    ctx.globalAlpha = 0.55;
    poly([hx, 470, hx, hy, hx+hw/2, hy-26, hx+hw, hy, hx+hw, 470], '#59503f', 0);
    ctx.globalAlpha = 0.42;
    for (var f = 0; f < 6; f++){
      var fx = hx + 22 + (f%2)*66, fy = hy + 34 + Math.floor(f/2)*54;
      if (fy > 430) continue;
      ctx.fillStyle = '#3a352c';
      ctx.fillRect(psnap(fx), psnap(fy), 34, 40);
    }
    ctx.globalAlpha = 1;
  }
  // Vier Fahnenschnuere quer ueber die Strasse
  for (var l = 0; l < 4; l++){
    var ly = 96 + l*52;
    ctx.strokeStyle = '#3f3a30'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var x = 0; x <= LW; x += 20) ctx.lineTo(x, ly + Math.sin(x*0.006 + l)*22 + Math.sin(t*0.7 + x*0.01)*4);
    ctx.stroke();
    for (var fl = 0; fl < 20; fl++){
      var fx2 = fl*50 + l*14;
      var fy2 = ly + Math.sin(fx2*0.006 + l)*22 + Math.sin(t*0.7 + fx2*0.01)*4;
      var flap = Math.sin(t*2.6 + fl + l)*4;
      poly([fx2, fy2, fx2+20, fy2+5+flap, fx2+3, fy2+28], fl%3===0 ? '#a8241f' : (fl%3===1 ? '#ddd6c4' : '#2b4880'), 0);
    }
  }
  /* Und ganz vorn, gross und schief: das eine Faehnchen, das aus einer
     Zeitung gemacht ist. Es ist der Gegenstand des Kapitels und muss
     entsprechend gross im Bild stehen. */
  ctx.save();
  ctx.translate(196, 470);
  ctx.rotate(Math.sin(t*1.1)*0.045 - 0.06);
  pRect(-6, -300, 11, 300, '#7a6440');
  pRect(-6, -300, 4, 300, '#98805a');
  // Das Blatt: rot gedrueckt, weiss geblieben, blauer Stern
  poly([5, -300, 168, -268, 5, -244], '#b8322a', 0);
  poly([5, -244, 168, -266, 168, -240, 5, -214], '#e2dbc6', 0);
  ctx.globalAlpha = 0.45;
  for (var z = 0; z < 5; z++) pRect(38, -256 + z*10, 84 - z*12, 3, '#5a5248');
  ctx.globalAlpha = 1;
  poly([62, -284, 76, -258, 104, -256, 82, -240, 90, -214, 64, -228, 40, -212, 46, -240, 26, -258, 54, -260], '#2f4a86', 0);
  ctx.restore();
  pixelGlow(760, 120, 300, 220, '#fff0c8', 0.14, 4);
}
function motivSchiff(t){
  bandV(0, 0, LW, 236, [[0,'#5f8fb4'],[0.6,'#a8c8d8'],[1,'#dceaea']], 6);
  // Die Kueste drueben, flach
  ctx.globalAlpha = 0.5;
  poly([0,238, 240,222, 520,234, 780,218, LW,230, LW,252, 0,252], '#7a8288', 0);
  ctx.globalAlpha = 1;
  bandV(0, 246, LW, 224, [[0,'#3f7290'],[0.5,'#2f5f7c'],[1,'#22475e']], 7);
  for (var i = 0; i < 120; i++){
    var wx = (i*37 + t*16) % LW, wy = 258 + (i*13)%180;
    ctx.globalAlpha = 0.14 + Math.abs(Math.sin(t + i))*0.20;
    ctx.fillStyle = '#cfe4ea';
    ctx.fillRect(psnap(wx), psnap(wy), 10 + (i%4)*6, 2);
  }
  ctx.globalAlpha = 1;
  // Das graue Boot, breitseits, mit Wellenkringel darunter
  var sx = LW/2 + Math.sin(t*0.5)*16, sy = 320 + Math.sin(t*0.9)*3;
  ctx.save(); ctx.translate(sx, sy);
  poly([-230, 0, 210, 0, 176, -44, -204, -38], '#5f676e', 3);
  pRect(-204, -38, 380, 8, '#79818a');
  pOutlineRect(-54, -96, 108, 60, '#6f777f', '#161a1e');
  pRect(-46, -88, 92, 12, '#3a4248');
  for (var pf = 0; pf < 5; pf++) pRect(-38 + pf*19, -68, 12, 14, '#2e363c');
  pRect(-8, -168, 12, 76, '#79818a');
  pRect(-34, -152, 62, 8, '#5f676e');
  line(2, -168, 96, -100, 1.8, '#3a4248');
  line(2, -168, -92, -96, 1.8, '#3a4248');
  // Flagge am Heck
  var weh = Math.sin(t*2.4)*3;
  poly([172, -44, 216, -38+weh, 214, -20+weh, 172, -26], '#c22a2a', 0);
  poly([172, -44, 216, -38+weh, 215, -30+weh, 172, -36], '#2f4f8a', 0);
  // Nummer am Bug
  pRect(-184, -26, 8, 16, '#dfe4e6'); pRect(-170, -26, 8, 16, '#dfe4e6');
  ctx.restore();
  ctx.globalAlpha = 0.22;
  ell(sx, sy + 10, 250, 12, '#16323f', 0);
  ctx.globalAlpha = 1;
  // Der Steg im Vordergrund, von dem aus man zusieht
  ctx.fillStyle = '#3a2f22';
  for (var pl = 0; pl < 26; pl++)
    ctx.fillRect(psnap(pl*40), psnap(430), 36, 40);
  ctx.fillStyle = '#4c3f2e';
  ctx.fillRect(0, psnap(426), LW, 6);
  // Poller mit Tau
  ctx.save(); ctx.translate(120, 428);
  pOutlineRect(-20, -46, 40, 46, '#4a4a50', '#121216');
  pRect(-24, -52, 48, 10, '#5a5a62');
  ctx.strokeStyle = '#8a7a58'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(30, -6, 24, 3.6, 6.0); ctx.stroke();
  ctx.beginPath(); ctx.arc(34, -2, 30, 3.5, 5.9); ctx.stroke();
  ctx.restore();
  pixelGlow(200, 90, 300, 200, '#fff0c8', 0.14, 4);
}
function motivFenster(t){
  bandV(0, 0, LW, LH, [[0,'#2e2a24'],[1,'#16130f']], 5);
  // Eine Fassade voller Fenster, in einem davon brennt Licht
  var rr = seeded(1974);
  for (var r2 = 0; r2 < 5; r2++){
    for (var c = 0; c < 9; c++){
      var fx = 60 + c*100, fy = 60 + r2*84;
      var an = (r2 === 2 && c === 4);
      pOutlineRect(fx, fy, 62, 60, an ? '#e8c26a' : '#2a3038', '#0e0c0a');
      if (an){
        ctx.globalAlpha = 0.6; pRect(fx+5, fy+5, 26, 50, '#fff0c0'); ctx.globalAlpha = 1;
        // Zwei Silhouetten im hellen Fenster
        ctx.fillStyle = '#4a3a24';
        ctx.fillRect(psnap(fx+16), psnap(fy+22), 10, 34);
        ctx.fillRect(psnap(fx+15), psnap(fy+14), 12, 10);
        ctx.fillRect(psnap(fx+34), psnap(fy+26), 10, 30);
        ctx.fillRect(psnap(fx+33), psnap(fy+18), 12, 10);
      } else {
        ctx.globalAlpha = 0.14 + rr()*0.12; pRect(fx+5, fy+5, 26, 50, '#7a90a4'); ctx.globalAlpha = 1;
      }
      pRect(fx+29, fy, 4, 60, '#1a1a16');
    }
  }
  ctx.globalAlpha = 0.16;
  pixelGlow(460, 250, 320, 240, '#ffd68c', 0.7, 5);
  ctx.globalAlpha = 1;
}
function motivBand(t){
  bandV(0, 0, LW, LH, [[0,'#4a5058'],[0.5,'#3c424a'],[1,'#2c3138']], 5);
  for (var lr = 0; lr < 6; lr++){
    pRect(lr*170 + 30, 60, 110, 10, '#e8f0f4');
    ctx.globalAlpha = 0.10; pixelGlow(lr*170 + 85, 74, 150, 110, '#e8f0f4', 0.5, 3); ctx.globalAlpha = 1;
  }
  // Das Band, quer, endlos
  pRect(0, 300, LW, 46, '#4a5058');
  pRect(0, 292, LW, 10, '#6a7078');
  for (var i = 0; i < 60; i++){
    var bx = ((i*32 - t*54) % (LW+64)) - 32;
    pRect(bx, 304, 24, 38, mixHex('#3a4048','#5a626a', (i%3)/3));
  }
  for (var w = 0; w < 12; w++){
    var wx = ((w*140 - t*54) % (LW+280)) - 140;
    pOutlineRect(wx, 258, 72, 38, '#8a8f94', '#22262a');
    pRect(wx+10, 264, 52, 10, '#a8adb2');
    ell(wx+36, 278, 11, 11, '#3a4048', 2);
  }
  // Zwei Haende, die nach demselben Werkstueck greifen
  ctx.save(); ctx.translate(LW/2, 470);
  pSegOutlined(-140, 0, -60, -110, 22, '#3a4a5c');
  pOutlineRect(-72, -128, 26, 24, '#c9946a', '#100c09');
  pSegOutlined(150, 0, 66, -104, 22, '#3a4a5c');
  pOutlineRect(52, -122, 26, 24, '#a87850', '#100c09');
  ctx.restore();
}
function motivZelle(t){
  bandV(0, 0, LW, LH, [[0,'#141a28'],[0.55,'#22283a'],[1,'#2e3340']], 6);
  // Schnee
  for (var s = 0; s < 130; s++){
    var fx = (s*67 + Math.sin(t*0.4 + s)*44) % LW;
    var fy = ((s*41 + t*30) % LH);
    ctx.globalAlpha = 0.3 + (s%4)*0.16;
    ctx.fillStyle = '#e8f0f4';
    ctx.fillRect(psnap(fx), psnap(fy), 2 + (s%3), 2 + (s%3));
  }
  ctx.globalAlpha = 1;
  // Die Zelle, gross und allein
  ctx.save(); ctx.translate(LW/2, 452);
  pOutlineRect(-110, -370, 220, 370, '#d8a82a', '#1a1408');
  pRect(-100, -358, 200, 14, '#f0c04a');
  pOutlineRect(-92, -336, 184, 254, '#22303a', '#1a1408');
  ctx.globalAlpha = 0.24; pRect(-84, -328, 72, 238, '#b8d8e8'); ctx.globalAlpha = 1;
  pRect(-6, -336, 8, 254, '#d8a82a');
  pRect(-92, -212, 184, 8, '#d8a82a');
  // Eine Silhouette im Inneren, den Hoerer am Ohr
  ctx.fillStyle = '#141a1e';
  ctx.fillRect(psnap(-32), psnap(-268), 58, 186);
  ctx.fillRect(psnap(-26), psnap(-300), 46, 40);
  ctx.fillRect(psnap(16), psnap(-292), 12, 26);
  poly([-120, -370, 120, -370, 108, -394, -108, -394], '#c9982a', 2.6);
  ctx.restore();
  pixelGlow(LW/2, 240, 300, 300, '#ffd66a', 0.20, 5);
}
function motivRohbau(t){
  bandV(0, 0, LW, 240, [[0,'#e2a05e'],[0.5,'#e8c48c'],[1,'#dcd8c0']], 7);
  bandV(0, 230, LW, 100, [[0,'#3a6478'],[1,'#2b5065']], 5);
  ctx.globalAlpha = 0.4;
  poly([0,236, 240,222, 520,232, 800,216, LW,230, LW,250, 0,250], '#6a6a72', 0);
  ctx.globalAlpha = 1;
  bandV(0, 322, LW, 148, [[0,'#a89e86'],[0.5,'#968c74'],[1,'#7f7663']], 5);
  // Das Betonskelett gegen die Sonne
  ctx.save(); ctx.translate(LW/2 - 200, 460);
  pRect(-40, -16, 480, 18, '#8a8272');
  for (var s = 0; s < 4; s++) pRect(0 + s*140, -230, 26, 216, '#9a9284');
  pRect(-20, -252, 460, 24, '#a29a8a');
  for (var e = 0; e < 14; e++){
    var ex = 4 + Math.floor(e/3)*140 + (e%3)*9;
    line(ex, -252, ex + Math.sin(e*2.1)*7, -308 - (e%3)*14, 3, '#7a5a3a');
  }
  // Eine halb gemauerte Wand
  trockenmauer(30, -212, 116, 196, 91, '#d8cdb4', '#9a9078');
  trockenmauer(170, -212, 116, 120, 93, '#d0c5aa', '#928872');
  ctx.restore();
  // Die Sonne geht dahinter unter
  pixelGlow(LW/2 + 210, 250, 300 + Math.sin(t*0.6)*26, 260, '#ff9a4a', 0.26, 5);
}
var KAP_MOTIVE = { karren:motivKarren, fahnen:motivFahnen, schiff:motivSchiff,
                   fenster:motivFenster, band:motivBand, zelle:motivZelle, rohbau:motivRohbau };

function starteKapitelkarte(d, onDone){
  G.chapterCard = { t:0, lines:d.zeilen, quote:d.zitat, motif:d.motiv, onDone:onDone };
  MUSIK.setModus('karte');
}
function dismissChapterCard(){
  var c = G.chapterCard; if (!c) return;
  var cb = c.onDone;
  G.chapterCard = null;
  MUSIK.setModus(radioAn ? 'radio' : null);
  if (cb) cb();
  G.fade = 1; G.fadeTo = 0; G.fadeRate = 1.1;
}
function updateChapterCard(dt){
  var c = G.chapterCard;
  if (IN.tap){ IN.tap = null; if (c.t > 0.5) dismissChapterCard(); return; }
  c.t += dt;
}
function chapterCardKeydown(){ if (G.chapterCard && G.chapterCard.t > 0.5) dismissChapterCard(); }
/* Titelzeilen und Zitat einer Kapitelkarte. Steht als eigene
   Funktion, weil die Karte jetzt an zwei Stellen vorkommt: als
   eigener Zustand (drawChapterCard) und als eine Einstellung im
   Kapitel-Intro. Zweimal derselbe Code waere zweimal derselbe
   spaetere Fehler. aus blendet am Ende der Einstellung weg. */
function zeichneKartenText(zeilen, zitat, t, aus){
  var n = zeilen.length;
  var cy = LH/2 - (n-1) * 26 - 18;
  for (var i = 0; i < n; i++){
    var ln = zeilen[i];
    var la = Math.max(0, Math.min(1, (t - (0.5 + i * 0.42)) / 0.7)) * aus;
    if (la <= 0) continue;
    /* Erst ein Schatten, dann die Zeile. Die Motive haben helle
       Stellen genau dort, wo der Text steht -- das Bild weiter
       abzudunkeln nimmt ihm das Licht und loest es trotzdem nicht.
       Ein versetzter dunkler Abzug traegt die Schrift auf jedem
       Untergrund, so wie beim Titel im Vorspann. */
    ctx.globalAlpha = la * 0.7;
    txt(ue(ln.text), LW/2 + 2, cy + i * 52 + 2, ln.size || 26, '#0c0904',
        'center', ln.italic ? 'italic ' : '');
    ctx.globalAlpha = la;
    txt(ue(ln.text), LW/2, cy + i * 52, ln.size || 26, ln.color || '#e0d3b0',
        'center', ln.italic ? 'italic ' : '');
    ctx.globalAlpha = 1;
  }
  if (!zitat) return;
  var qa = Math.max(0, Math.min(1, (t - (0.5 + n * 0.42)) / 0.9)) * aus;
  if (qa <= 0) return;
  var qy = cy + n * 52 + 30;
  ctx.globalAlpha = qa * 0.55;
  ctx.fillStyle = '#8a7a58'; ctx.fillRect(LW/2 - 70, qy - 22, 140, 2);
  ctx.globalAlpha = qa;
  var ql = wrap('„' + ue(zitat) + '“', Math.min(660, LW - 140), 20, 'italic ');
  for (var q = 0; q < ql.length; q++){
    ctx.globalAlpha = qa * 0.7;
    txt(ql[q], LW/2 + 2, qy + 14 + q * 26, 20, '#0c0904', 'center', 'italic ');
    ctx.globalAlpha = qa;
    txt(ql[q], LW/2, qy + 12 + q * 26, 20, '#c2b291', 'center', 'italic ');
  }
  ctx.globalAlpha = 1;
}

function drawChapterCard(){
  var c = G.chapterCard, t = c.t;
  ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, LW, LH);
  var mfn = c.motif && KAP_MOTIVE[c.motif];
  if (mfn){
    gepixelt(function(){
      ctx.save();
      ctx.globalAlpha = Math.min(1, t / 1.2);
      ctx.beginPath(); ctx.rect(0, 0, LW, LH); ctx.clip();
      mfn(t);
      ctx.restore();
    }, LH);
    ctx.globalAlpha = 0.48 * Math.min(1, t / 1.2);
    ctx.fillStyle = '#0a0806';
    ctx.fillRect(0, 0, LW, LH);
    ctx.globalAlpha = 1;
  }
  zeichneKartenText(c.lines, c.quote, t, 1);
  var pa = Math.max(0, Math.min(1, (t - 2.4) / 1.2)) * (0.5 + 0.5 * Math.sin(G.t * 2.2));
  ctx.globalAlpha = pa;
  txt(ue('Klicken, um weiterzugehen'), LW/2, LH - 44, 17, '#9a8e78', 'center', 'italic ');
  ctx.globalAlpha = 1;
}
