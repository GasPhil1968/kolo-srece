
/* ============================================================
   Sektion 26  BENUTZEROBERFLAECHE
   ------------------------------------------------------------
   Warme, gedeckte Leiste statt der kuehlen Neonfarben eines
   Krimis: dieses Spiel ist keine Ermittlung, sondern ein
   Nachmittag auf einer Terrasse.
   ============================================================ */
var UI_ACC = '#e0a44a', UI_ACC2 = '#7fb8a4', UI_DIM = '#5a4a38';
function drawUI(){
  IN_UI = true;
  box(0, UI_Y, LW, LH - UI_Y, '#120e0a', 0, 0);
  line(0, UI_Y + 1, LW, UI_Y + 1, 3, '#6a4f2e');
  ctx.globalAlpha = 0.08;
  for (var i = 0; i < LW; i += 6) line(i, UI_Y + 3, i, LH, 1, '#b08a50');
  ctx.globalAlpha = 1;

  txt(statusLine(), LW/2, UI_Y + 26, 19, UI_ACC, 'center', 'bold ');

  for (var v = 0; v < VERBS.length; v++){
    var r = verbRect(v);
    var on = (G.verb === VERBS[v].id);
    box(r.x, r.y, r.w, r.h, on ? '#3a2a18' : '#1a1410', 2.2, 1);
    ctx.strokeStyle = on ? UI_ACC : '#4a3826'; ctx.lineWidth = 2; ctx.stroke();
    txt(ue(VERBS[v].label), r.x + r.w/2, r.y + r.h/2 + 7, 18, on ? '#fff0d4' : '#b8a184', 'center', 'bold ');
  }

  box(348, UI_Y + 40, 596, 84, '#0c0906', 2, 1);
  ctx.strokeStyle = '#4a3826'; ctx.lineWidth = 2; ctx.stroke();
  for (var s = 0; s < 6; s++){
    var ir = invRect(s);
    line(ir.x + ir.w, ir.y + 6, ir.x + ir.w, ir.y + ir.h - 6, 1.4, 'rgba(140,110,70,0.5)');
    var id = INV.items[s];
    if (!id) continue;
    if (G.selItem === id) box(ir.x + 3, ir.y + 3, ir.w - 6, ir.h - 6, '#4a3418', 2, 1);
    drawIcon(id, ir.x + ir.w/2, ir.y + ir.h/2);
  }
  if (INV.items.length > 6){
    txt('+' + (INV.items.length - 6), 936, UI_Y + 118, 13, '#8a7454', 'right');
  }

  var mr=menuBtnRect(), sr=saveRect(), lr=loadRect();
  box(mr.x,mr.y,mr.w,mr.h,'#2b1d13',1.8,4); ctx.strokeStyle='#6d4a2a';ctx.lineWidth=1.8;ctx.stroke();
  box(sr.x,sr.y,sr.w,sr.h,'#2b1d13',1.8,4); ctx.strokeStyle='#6d4a2a';ctx.lineWidth=1.8;ctx.stroke();
  box(lr.x,lr.y,lr.w,lr.h,'#2b1d13',1.8,4); ctx.strokeStyle='#6d4a2a';ctx.lineWidth=1.8;ctx.stroke();
  txt('M',mr.x+mr.w/2,mr.y+17,15,'#bfa679','center','bold ');
  txt('S',sr.x+sr.w/2,sr.y+17,15,'#bfa679','center','bold ');
  txt('L',lr.x+lr.w/2,lr.y+17,15,hasSave()?'#bfa679':'#65513c','center','bold ');
  var utipp = null;
  if (IN.x>mr.x&&IN.x<mr.x+mr.w&&IN.y>mr.y&&IN.y<mr.y+mr.h) utipp='Hauptmenü';
  else if (IN.x>sr.x&&IN.x<sr.x+sr.w&&IN.y>sr.y&&IN.y<sr.y+sr.h) utipp='Speichern';
  else if (IN.x>lr.x&&IN.x<lr.x+lr.w&&IN.y>lr.y&&IN.y<lr.y+lr.h) utipp='Laden';
  if (utipp) txt(ue(utipp), LW-16, UI_Y+46, 13, '#8a7f68', 'right', 'italic ');
  if (SAVE_NOTE.t>0){
    var a=Math.min(1,SAVE_NOTE.t*2); ctx.globalAlpha=a;
    box(LW/2-100,UI_Y-37,200,27,'rgba(20,12,7,0.88)',1.5,5);
    ctx.strokeStyle='#8a6a3a';ctx.lineWidth=1.5;ctx.stroke();
    txt(ue(SAVE_NOTE.text),LW/2,UI_Y-18,15,'#e2c58f','center'); ctx.globalAlpha=1;
  }
  IN_UI = false;
}
function verbRect(i){
  var c = i % 3, r = Math.floor(i / 3);
  return { x: 16 + c * 108, y: UI_Y + 42 + r * 42, w: 100, h: 36 };
}
function invRect(i){ return { x: 352 + i * 98, y: UI_Y + 44, w: 96, h: 76 }; }
function menuBtnRect(){ return {x:874,y:UI_Y+7,w:24,h:24}; }
function saveRect(){ return {x:902,y:UI_Y+7,w:24,h:24}; }
function loadRect(){ return {x:930,y:UI_Y+7,w:24,h:24}; }

/* Inventarsymbole. Jedes Stueck wird gezeichnet, nicht beschriftet --
   die Leiste soll wie ein Regal aussehen, nicht wie eine Liste. */
function drawIcon(id, cx, cy){
  var vorher = IN_UI; IN_UI = true;
  ctx.save(); ctx.translate(cx, cy);
  if (id === 'taschenlampe'){
    ctx.rotate(-0.3);
    box(-20, -8, 30, 16, '#3f4a52', 2.4, 2);
    poly([10, -12, 24, -16, 24, 16, 10, 12], '#5a6a72', 2.4);
    ell(24, 0, 5, 12, '#ffe9a8', 1.8);
    box(-14, -10, 6, 20, '#c9a02e', 1.6, 1);
  } else if (id === 'autoschluessel'){
    ctx.rotate(-0.35);
    box(-22, -9, 20, 18, '#2e3a3e', 2.2, 3);
    box(-2, -3.5, 26, 7, '#b8b0a0', 2, 1);
    box(16, 3, 5, 7, '#b8b0a0', 1.8, 1);
    box(22, 3, 4, 5, '#b8b0a0', 1.8, 1);
    ell(-12, 0, 3, 3, '#c9a02e', 0);
  } else if (id === 'foto'){
    ctx.rotate(0.08);
    box(-22, -18, 44, 38, '#efe8d6', 2.4, 0);
    box(-18, -14, 36, 26, '#93a09a', 0, 0);
    for (var f = 0; f < 6; f++){ pRect(-15 + f*6, -4, 4, 12, '#4a5450'); pRect(-15 + f*6, -8, 4, 4, '#c9ac8c'); }
    pRect(-18, -14, 36, 4, '#7f8c86');
  } else if (id === 'speck'){
    poly([-20, 8, 20, 10, 18, -8, -18, -10], '#e0c0a8', 2.4);
    poly([-20, 8, 20, 10, 19, 2, -19, 0], '#a8705a', 0);
    pRect(-12, -6, 20, 4, '#f0dcc8');
  } else if (id === 'holzkeil'){
    poly([-20, 10, 20, 2, 20, -4, -20, 4], '#a8875c', 2.4);
    pRect(-16, 2, 30, 2, '#7a6244');
  } else if (id === 'radnagel'){
    ctx.rotate(0.5);
    pRect(-3, -20, 6, 34, '#7a7a72');
    pRect(-7, -22, 14, 6, '#8a8a82');
    pRect(-3, 12, 9, 5, '#6a6a62');
  } else if (id === 'mehl'){
    poly([-18, 18, 18, 18, 14, -14, -14, -14], '#d8cdb0', 2.6);
    poly([-14, -14, 14, -14, 8, -20, -8, -20], '#c2b596', 2);
    pRect(-10, 0, 20, 8, '#a89878');
  } else if (id === 'zeitung'){
    ctx.rotate(-0.1);
    box(-20, -16, 40, 34, '#e4ddc8', 2.4, 0);
    pRect(-16, -12, 32, 4, '#3a352c');
    for (var z = 0; z < 5; z++) pRect(-16, -4 + z*5, 14 + (z%3)*6, 2, '#6a6254');
    pRect(2, -4, 14, 12, '#8a8478');
  } else if (id === 'stecken'){
    ctx.rotate(-0.4);
    pRect(-2, -22, 5, 44, '#8a7248');
    pRect(-2, -10, 5, 3, '#6a5638');
  } else if (id === 'faehnchen'){
    pRect(-14, -20, 3, 40, '#8a7248');
    poly([-11, -20, 18, -14, -11, -6], '#c22a2a', 0);
    poly([-11, -6, 18, -12, 18, -4, -11, 2], '#e8e4d4', 0);
    pRect(0, -16, 6, 6, '#3a4a8a');
  } else if (id === 'klebstoff'){
    poly([-14, 14, 14, 14, 11, -8, -11, -8], '#8a8a86', 2.2);
    ell(0, -8, 11, 4, '#d8d0b8', 1.4);
    line(6, -8, 16, -20, 2.4, '#7a6244');
  } else if (id === 'befehl1' || id === 'befehl2' || id === 'befehl3'){
    ctx.rotate(id === 'befehl2' ? 0.1 : (id === 'befehl3' ? -0.12 : 0));
    box(-18, -22, 36, 44, '#e8e2d0', 2.2, 0);
    pRect(-13, -17, 26, 3, '#3a352c');
    for (var b = 0; b < 4; b++) pRect(-13, -9 + b*6, 18 + (b%2)*6, 2, '#6a6254');
    pRect(-13, 13, 14, 3, '#2f4f8a');
  } else if (id === 'farbe'){
    poly([-15, 16, 15, 16, 12, -12, -12, -12], '#8a8a86', 2.4);
    ell(0, -12, 12, 4, '#eef0ec', 1.6);
    line(-11, -12, 11, -20, 2, '#6a6a66');
  } else if (id === 'pinsel'){
    ctx.rotate(0.4);
    pRect(-3, -4, 6, 24, '#8a6a44');
    pRect(-5, -18, 10, 14, '#dfe4e6');
    pRect(-5, -6, 10, 4, '#9a9a96');
  } else if (id === 'fahne'){
    poly([-18, -12, 18, -12, 18, 12, -18, 12], '#c22a2a', 2);
    poly([-18, -12, 18, -12, 18, -2, -18, -2], '#2f4f8a', 0);
    pRect(-6, -6, 12, 12, '#e8d84a');
  } else if (id === 'kammerschluessel'){
    ctx.rotate(-0.4);
    ell(-14, 0, 9, 9, '#8a8a82', 3);
    box(-6, -3.5, 30, 7, '#8a8a82', 2.6, 2);
    box(16, 3, 5, 8, '#8a8a82', 2.4, 1);
  } else if (id === 'kiste'){
    box(-22, -14, 44, 28, '#7a5f3c', 2.6, 1);
    pRect(-18, -6, 36, 3, '#5a4429');
    pRect(-22, -18, 44, 6, '#8a6f4c');
    pRect(-4, -18, 8, 8, '#b8973f');
  } else if (id === 'kaffee'){
    box(-16, -20, 32, 40, '#8a3a2e', 2.4, 2);
    pRect(-12, -14, 24, 12, '#e8dcc0');
    pRect(-10, -10, 20, 3, '#5a3a24');
    ell(0, 6, 9, 7, '#3a2418', 0);
  } else if (id === 'antrag' || id === 'stempel' || id === 'genehmigung' || id === 'zollformular'){
    box(-19, -22, 38, 44, id === 'zollformular' ? '#c8dcc0' : '#eee8d6', 2.4, 0);
    pRect(-14, -17, 28, 3, '#3a352c');
    for (var p = 0; p < 5; p++) pRect(-14, -8 + p*6, 16 + (p%3)*8, 2, '#6a6254');
    if (id === 'stempel' || id === 'genehmigung'){
      ctx.globalAlpha = 0.8;
      ell(8, 10, 11, 8, 'rgba(70,60,150,0.55)', 0);
      ctx.strokeStyle = '#3a3a8a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(8, 10, 11, 8, -0.2, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  } else if (id === 'ersatzteil'){
    ell(0, 0, 8, 8, '#b8b0a0', 2.4);
    pRect(-3, -18, 6, 14, '#9a9288');
    pRect(-9, -4, 18, 4, '#8a8278');
    ell(0, 0, 3, 3, '#2a2620', 0);
  } else if (id === 'wohnungsschluessel'){
    ctx.rotate(-0.4);
    ell(-14, 0, 9, 9, '#c9a06a', 3);
    ell(-14, 0, 3.4, 3.4, '#2b1d13', 0);
    box(-6, -3.5, 28, 7, '#c9a06a', 2.6, 2);
    box(14, 3, 5, 8, '#c9a06a', 2.4, 1);
  } else if (id === 'ausweis'){
    box(-22, -15, 44, 30, '#dfe0d8', 2.4, 2);
    pRect(-18, -11, 15, 18, '#7a8a94');
    ell(-10.5, -6, 4, 4, '#a8b0b4', 0);
    for (var aw = 0; aw < 3; aw++) pRect(2, -9 + aw*7, 16 - aw*3, 3, '#5a5a54');
  } else if (id === 'auftragszettel' || id === 'skizze'){
    ctx.rotate(id === 'skizze' ? 0.12 : -0.08);
    box(-20, -15, 40, 30, id === 'skizze' ? '#c2a276' : '#eee8d6', 2.2, 0);
    if (id === 'skizze'){
      ctx.strokeStyle = '#2a2620'; ctx.lineWidth = 2;
      ctx.strokeRect(-13, -8, 18, 12);
      line(9, -2, -3, -2, 2, '#2a2620');
      txt('12', 6, 12, 12, '#2a2620', 'center', 'bold ');
    } else {
      for (var az = 0; az < 4; az++){
        ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (var ax = -15; ax < 15; ax += 3) ctx.lineTo(ax, -9 + az*6 + Math.sin(ax)*1.6);
        ctx.stroke();
      }
    }
  } else if (id === 'schluessel13'){
    ctx.rotate(0.5);
    pRect(-4, -16, 8, 32, '#a8a8a0');
    pRect(-8, -20, 16, 8, '#a8a8a0'); pRect(-3, -20, 6, 5, '#12100e');
    pRect(-8, 12, 16, 8, '#a8a8a0'); pRect(-3, 15, 6, 5, '#12100e');
  } else if (id === 'muenzen'){
    var n = 4 - (FLAG.muenzenWeg || 0);
    for (var m = 0; m < Math.max(0, n); m++){
      ell(-14 + (m%2)*17, -8 + Math.floor(m/2)*17, 8, 8, '#c9c4b0', 2);
      ell(-14 + (m%2)*17, -8 + Math.floor(m/2)*17, 4, 4, '#a8a394', 0);
    }
  } else if (id === 'schokolade'){
    box(-20, -13, 40, 26, '#8a2a3a', 2.4, 1);
    for (var sk = 0; sk < 3; sk++) pRect(-15 + sk*11, -9, 8, 18, '#6a1f2c');
    pRect(-20, -3, 40, 3, '#a83a4a');
  } else if (id === 'medikamente'){
    box(-18, -16, 36, 32, '#e8ecec', 2.4, 2);
    pRect(-13, -11, 26, 6, '#3a7a5a');
    pRect(-13, -1, 18, 3, '#7a8a88');
    pRect(-13, 5, 12, 3, '#7a8a88');
    poly([9, 2, 15, 2, 15, 8, 9, 8], '#c22a2a', 0);
  } else if (id === 'zollstock'){
    for (var zs = 0; zs < 4; zs++)
      pRect(-16 + zs*4, -18 + zs*9, 6, 20, zs%2 ? '#d8c060' : '#e8d484');
  } else if (id === 'zement'){
    poly([-18, 16, 18, 16, 14, -12, -14, -12], '#9a968c', 2.6);
    pRect(-11, -6, 22, 6, '#7a766c');
    pRect(-8, 2, 16, 3, '#7a766c');
  } else if (id === 'wasserwaage'){
    box(-22, -7, 44, 14, '#c9a02e', 2.4, 1);
    box(-6, -5, 12, 10, '#dfe8e8', 1.6, 1);
    ell(0, 0, 3, 3, '#5ad86a', 0);
  } else {
    /* Rueckfall: ein Gegenstand, den es gibt, aber fuer den noch
       niemand ein Symbol gezeichnet hat. Lieber ein ehrliches
       Paeckchen als ein leeres Feld. */
    box(-18, -16, 36, 32, '#8a7a5c', 2.4, 2);
    pRect(-14, -12, 28, 4, '#6a5a44');
  }
  ctx.restore();
  IN_UI = vorher;
}
function statusLine(){
  if (G.dlg) return satz('Was sagt %s?', PL.name);
  var vt = '';
  for (var i = 0; i < VERBS.length; i++) if (VERBS[i].id === G.verb) vt = ue(VERBS[i].label);
  if (G.selItem){
    var n = ITEMS[G.selItem] ? ITEMS[G.selItem].name : G.selItem;
    return (G.hover && G.hover !== G.selItem)
      ? satz('Benutze %s mit %s', n, hoverName())
      : satz('Benutze %s mit …', n);
  }
  return vt + (G.hover ? ' ' + hoverName() : '');
}
function hoverName(){
  if (!G.hover) return '';
  if (G.hover === 'selbst') return ue('Mich selbst');
  if (ITEMS[G.hover]) return ue(ITEMS[G.hover].name);
  var a = actorById(G.hover); if (a) return a.name;
  for (var i = 0; i < OBJ.length; i++) if (OBJ[i].id === G.hover) return ue(OBJ[i].name);
  return '';
}
