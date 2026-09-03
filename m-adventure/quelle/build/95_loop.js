
/* ============================================================
   Sektion 31  EINGABE-AUFLOESUNG
   ============================================================ */
function handleTap(p){
  if (G.menu && G.menu.active) return;
  if (G.chapterCard) return;
  if (G.cine && G.cine.active) return;
  if (G.over){ if (G.endCard > 1.4) zurueckInsHauptmenue(); return; }
  if (G.dlg){
    var closeR = getDialogueCloseButtonRect();
    if (closeR && p.x > closeR.x && p.x < closeR.x + closeR.w && p.y > closeR.y && p.y < closeR.y + closeR.h){
      closeDlg(); uiSound('nav'); return;
    }
    for (var i = 0; i < G.dlg.opts.length; i++){
      var dr = getDialogueOptionRect(i);
      if (p.x > dr.x && p.x < dr.x + dr.w && p.y > dr.y - 18 && p.y < dr.y + 8){ pickDlg(i); return; }
    }
    return;
  }
  if (G.seq){
    if (dialogueVisible() && G.dialogTypeLen < G.dialogTextTotal){ G.dialogTypeLen = G.dialogTextTotal; uiSound('tick'); }
    else G.skip = true;
    return;
  }
  if (p.y >= UI_Y){
    var mr=menuBtnRect(), sr=saveRect(), lr=loadRect();
    if (p.x>mr.x&&p.x<mr.x+mr.w&&p.y>mr.y&&p.y<mr.y+mr.h){ zurueckInsHauptmenue(); return; }
    if (p.x>sr.x&&p.x<sr.x+sr.w&&p.y>sr.y&&p.y<sr.y+sr.h){ saveGame(false); uiSound('confirm'); return; }
    if (p.x>lr.x&&p.x<lr.x+lr.w&&p.y>lr.y&&p.y<lr.y+lr.h){ loadGame(false); uiSound('confirm'); return; }
    for (var v = 0; v < VERBS.length; v++){
      var r = verbRect(v);
      if (p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h){
        G.verb = VERBS[v].id; G.selItem = null; uiSound('nav'); return;
      }
    }
    for (var s = 0; s < 6; s++){
      var ir = invRect(s), id = INV.items[s];
      if (!id) continue;
      if (p.x > ir.x && p.x < ir.x + ir.w && p.y > ir.y && p.y < ir.y + ir.h){
        if (id === 'autoschluessel' && FLAG.finaleBereit && !FLAG.finaleFertig &&
            (G.verb === 'benutzen' || G.verb === 'nehmen')){ nimmSchluessel(); return; }
        if (G.verb === 'ansehen'){ say(PL, ITEMS[id] ? ITEMS[id].desc : id); return; }   // say() uebersetzt selbst
        if (G.verb === 'geben'){ G.selItem = id; return; }
        if (G.selItem && G.selItem !== id){ var a = G.selItem; G.selItem = null; useItemOnItem(a, id); return; }
        G.selItem = (G.selItem === id) ? null : id;
        return;
      }
    }
    return;
  }
  var rx = p.x + G.camx, ry = p.y;
  var o = hitObject(rx, ry);
  G.katzeIdle = 55; G.katzeZeigt = 0;
  if (o){
    var verb = p.right ? (o.actor && o.actor !== PL ? 'reden' : (DEFVERB[o.id] || 'ansehen')) : G.verb;
    if (G.selItem) verb = 'benutzen';
    interact(o, verb);
  } else {
    G.selItem = null;
    PL.walkTo(R.area, R.nodes, rx, ry, 0);
  }
}

/* ============================================================
   Sektion 32  HAUPTSCHLEIFE
   ============================================================ */
var DEBUG = /[?&]debug=1/.test(location.search);
var last = 0, FRAME_FEHLER = 0, FRAME_LETZTER = '';

function frame(ts){
  var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
  G.t += dt;
  /* Ein Zahlenvergleich pro Bild. Er kostet nichts und faengt jede
     Groessenaenderung auf, die kein Ereignis gemeldet hat. */
  passeAn(false);
  try { update(dt); } catch(e){ frameFehler('update', e); }
  try { render(); } catch(e){ frameFehler('render', e); }
  requestAnimationFrame(frame);
}
function frameFehler(wo, e){
  FRAME_FEHLER++;
  var t = wo + ': ' + (e && e.message ? e.message : e);
  if (t !== FRAME_LETZTER){
    FRAME_LETZTER = t;
    if (typeof console !== 'undefined' && console.warn) console.warn('Frame-Fehler abgefangen —', t, e && e.stack);
  }
  if (FRAME_FEHLER % 120 === 0){ G.seq = null; G.wait = 0; G.dlg = null; G.dlgPartner = null; }
}

function update(dt){
  if (G.menu && G.menu.active){ MUSIK.tick(dt); updateMenu(dt); return; }
  if (G.chapterCard){ MUSIK.tick(dt); updateChapterCard(dt); return; }
  if (G.cine && G.cine.active){ MUSIK.tick(dt); updateCine(dt); return; }
  MUSIK.tick(dt);
  /* Das Radio steht auf der Terrasse und ist nur dort zu hoeren. */
  if (MUSIK.modus === 'radio' && R.id !== 'terrasse') MUSIK.setModus(null);
  else if (radioAn && !MUSIK.modus && R.id === 'terrasse' && !G.chapterCard) MUSIK.setModus('radio');
  if (SAVE_NOTE.t > 0) SAVE_NOTE.t = Math.max(0, SAVE_NOTE.t - dt);
  if (G.autosaveT > 0){ G.autosaveT -= dt; if (G.autosaveT <= 0) autosave(); }

  if (IN.down){ IN.holdT += dt; if (IN.holdT > 0.45 && !IN.hadHold){ IN.hadHold = true; IN.tap = { x:IN.x, y:IN.y, right:true }; } }
  if (IN.tap){ handleTap(IN.tap); IN.tap = null; }

  updateSeq(dt);
  G.skip = false;
  updateKatze(dt);
  updateUnschaerfe(dt);
  /* Das Faehnchen kann in jeder Reihenfolge entstehen; geprueft wird
     einmal pro Bild, damit keine Kombination vergessen werden kann. */
  if (R.id === 'mostar' && !FLAG.faehnchenFertig && !G.seq) pruefeFaehnchen();
  /* Das Finale: sobald erzaehlt ist, liegen die Autoschluessel bereit. */
  if (FLAG.finaleBereit && !FLAG.finaleFertig && !G.seq && !G.dlg && !INV.has('autoschluessel')){
    INV.add('autoschluessel');
  }
  if (INV.has('autoschluessel') && !FLAG.finaleFertig && G.selItem === 'autoschluessel' && !G.seq && !G.dlg){
    G.selItem = null; nimmSchluessel();
  }

  var speaker = getCurrentSpeaker();
  if (speaker && speaker.sayLines){
    var rawKey = speaker.id + '|' + speaker.sayLines.join('\n');
    if (rawKey !== G.dialogTextKey){
      G.dialogTextKey = rawKey;
      G.dialogLinesCache = dialogueLines(speaker);
      var total = 0;
      for (var tk = 0; tk < G.dialogLinesCache.length; tk++) total += G.dialogLinesCache[tk].length;
      G.dialogTypeLen = 0; G.dialogTextTotal = total; G.dialogTickAt = 0; G.dialogPopT = 0.22;
    } else if (G.dialogTypeLen < G.dialogTextTotal){
      G.dialogTypeLen = Math.min(G.dialogTextTotal, G.dialogTypeLen + dt * 62);
      var whole = Math.floor(G.dialogTypeLen);
      if (whole >= G.dialogTickAt + 6){ G.dialogTickAt = whole; uiSound('tick'); }
    }
  } else {
    G.dialogTextKey = ''; G.dialogTypeLen = 0; G.dialogTextTotal = 0; G.dialogTickAt = 0; G.dialogLinesCache = null;
  }
  if (G.dialogPopT > 0) G.dialogPopT = Math.max(0, G.dialogPopT - dt);

  if (G.dlg && GAMEPAD_OK && navigator.getGamepads){
    var pads = null;
    try { pads = navigator.getGamepads(); } catch(e){ GAMEPAD_OK = false; }
    var gp = pads && pads[0];
    if (gp){
      var up = (!!gp.buttons[12] && gp.buttons[12].pressed) || gp.axes[1] < -0.65;
      var down = (!!gp.buttons[13] && gp.buttons[13].pressed) || gp.axes[1] > 0.65;
      var ok = (!!gp.buttons[0] && gp.buttons[0].pressed) || (!!gp.buttons[9] && gp.buttons[9].pressed);
      if (up && !SND.gpPrev.up) moveDlgSel(-1);
      if (down && !SND.gpPrev.down) moveDlgSel(1);
      if (ok && !SND.gpPrev.ok) pickDlg(G.dlgSel >= 0 ? G.dlgSel : 0);
      SND.gpPrev.up = up; SND.gpPrev.down = down; SND.gpPrev.ok = ok;
    }
  } else { SND.gpPrev.up = SND.gpPrev.down = SND.gpPrev.ok = false; }

  var nearNpc = null, nearD = 1e9;
  for (var ni = 0; ni < ACTORS.length; ni++){
    var na = ACTORS[ni];
    if (na === PL || !na.visible) continue;
    var nd = Math.abs(PL.x - na.x) + Math.abs(PL.y - na.y) * 0.4;
    if (nd < 230 && nd < nearD){ nearD = nd; nearNpc = na; }
  }
  PL.lookAt = nearNpc;
  for (var li = 0; li < ACTORS.length; li++) if (ACTORS[li] !== PL) ACTORS[li].lookAt = (ACTORS[li] === nearNpc ? PL : null);
  /* Auch Menschen werden von der Erinnerung korrigiert. Ein Held wird
     beim zweiten Hinsehen unfreundlicher, ein Vater juenger. Beides
     bleibt unkommentiert. */
  if (R.id === 'sarajevo' && NPC.safet.visible && unsch('stadion') + unsch('safet') > 0.5){
    NPC.safet.build = mergeFlat(NPC_DEFS.safet.build, { armsCrossed:true });
  }
  if ((R.id === 'polje' || R.id === 'weide') && NPC.otac.visible && unsch('vater') > 0.5){
    NPC.otac.build = mergeFlat(NPC_DEFS.otac.build, { grey:false, stubble:false, tall:1.16 });
  }
  for (var i = 0; i < ACTORS.length; i++){ var av = ACTORS[i]; if (av === PL || av.visible) av.update(dt); }
  schlendernTick(dt);
  for (var ta = 0; ta < ACTORS.length; ta++) ACTORS[ta].talkT = ACTORS[ta].sayLines ? 99 : 0;

  var want = Math.max(0, Math.min(ROOMW - LW, PL.x - LW / 2));
  G.camx += (want - G.camx) * Math.min(1, dt * 3.4);

  if (IN.y < UI_Y && !G.dlg){
    var ho = hitObject(IN.x + G.camx, IN.y);
    G.hover = ho ? ho.id : null;
  } else if (IN.y >= UI_Y){
    G.hover = null;
    for (var s = 0; s < 6; s++){
      var ir = invRect(s), id = INV.items[s];
      if (id && IN.x > ir.x && IN.x < ir.x + ir.w && IN.y > ir.y && IN.y < ir.y + ir.h) G.hover = id;
    }
  }

  var dTarget = dialogueVisible() ? 1 : 0;
  G.dialogAlpha += (dTarget - G.dialogAlpha) * Math.min(1, dt * 10);

  var fstep = G.fadeRate * dt;
  if (G.fade < G.fadeTo) G.fade = Math.min(G.fadeTo, G.fade + fstep);
  else if (G.fade > G.fadeTo) G.fade = Math.max(G.fadeTo, G.fade - fstep);
  updateRoomChange();
  if (G.over){ G.endCard += dt; if (MUSIK.modus !== 'karte') MUSIK.setModus('karte'); }
}

function render(){
  ctx.setTransform(PIX, 0, 0, PIX, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, LW, LH);

  if (G.menu && G.menu.active){ drawMainMenu(); return; }
  if (G.chapterCard){ drawChapterCard(); return; }
  if (G.cine && G.cine.active){ drawCine(); return; }

  /* --- Ebene 1: die Welt, grob gepixelt --------------------- */
  var HAUPT = ctx;
  ctx = WCTX;
  ctx.setTransform(1/WELT_PIX, 0, 0, 1/WELT_PIX, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, LW, VIEW_H);

  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, LW, VIEW_H); ctx.clip();

  var pxl = R.parallax || [];
  for (var pi = 0; pi < pxl.length; pi++){
    var pl = pxl[pi];
    ctx.save();
    ctx.translate(-G.camx, 0);
    if (pl.clip){ ctx.beginPath(); ctx.rect(pl.clip[0], pl.clip[1], pl.clip[2], pl.clip[3]); ctx.clip(); }
    ctx.translate(G.camx * (1 - pl.factor), 0);
    pl.draw(G.t);
    ctx.restore();
  }

  ctx.translate(-G.camx, 0);
  drawRoom(G.t);

  var drawables = [];
  for (var i = 0; i < ACTORS.length; i++) if (ACTORS[i].visible) drawables.push({ y:ACTORS[i].y, a:ACTORS[i] });
  var fg = R.foreground || [];
  for (var f = 0; f < fg.length; f++) drawables.push({ y:fg[f].y, layer:fg[f] });
  drawables.sort(function(p,q){ return p.y - q.y; });
  for (var d = 0; d < drawables.length; d++){
    if (drawables[d].a){
      var fig = drawables[d].a;
      if (fig.ein < 1){
        ctx.save(); ctx.globalAlpha = fig.ein; drawActor(fig); ctx.restore();
      } else drawActor(fig);
    }
    else if (drawables[d].layer && drawables[d].layer.draw) drawables[d].layer.draw();
  }

  /* Baba Roga im Finale: zum ersten Mal ganz im Bild und ohne
     Schrecken. Sie wird auch hier nicht kommentiert. */
  if (R.id === 'bau' && FLAG.rogaFinale) babaRoga(1240, 452, G.t, 0.85, true);

  drawHinweis();

  if (DEBUG){
    for (var k = 0; k < R.area.length; k++){ poly(R.area[k], null, 0); ctx.strokeStyle = '#39ff88'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 1.4;
    for (var q = 0; q < OBJ.length; q++){ var h = OBJ[q].hs; ctx.strokeRect(h[0], h[1], h[2], h[3]); }
    ctx.fillStyle = '#39ff88';
    for (var n = 0; n < R.nodes.length; n++) ctx.fillRect(R.nodes[n].x - 2, R.nodes[n].y - 2, 4, 4);
  }
  ctx.restore();

  pixelVignette();

  /* --- Ebene 2: Schrift und Bedienung, voll aufgeloest ------ */
  ctx = HAUPT;
  ctx.setTransform(PIX, 0, 0, PIX, 0, 0);
  ctx.imageSmoothingEnabled = false;
  var wh = Math.ceil(VIEW_H / WELT_PIX);
  ctx.drawImage(WCV, 0, 0, WCV.width, wh, 0, 0, LW, wh * WELT_PIX);

  /* Die Ortsmarke stand als gelbe Schrift ohne Rueckhalt im Bild und
     verschwand ueber hellem Himmel oder heller Mauer. Sie bekommt
     jetzt eine dunkle Unterlage, die nach rechts ausblendet, und
     einen Schatten -- damit liest sie auf jedem Untergrund, ohne wie
     ein Kasten auszusehen. */
  var otA = Math.max(0, 1 - Math.max(0, (G.t - G.roomEnteredAt) - 4) / 2.2) * (1 - G.dialogAlpha);
  if (otA > 0.01){
    var otT = ue(R.title);
    ctx.font = "bold 20px 'Courier New', Courier, monospace";
    var otW = ctx.measureText(otT).width;
    ctx.save();
    ctx.globalAlpha = otA * 0.62;
    var g = ctx.createLinearGradient(0, 0, otW + 90, 0);
    g.addColorStop(0, 'rgba(10,8,6,0.92)');
    g.addColorStop(0.72, 'rgba(10,8,6,0.72)');
    g.addColorStop(1, 'rgba(10,8,6,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 18, otW + 90, 30);
    ctx.restore();
    ctx.globalAlpha = otA * 0.85;
    txt(otT, 25, 41, 20, '#1a1206', 'left', 'bold ');
    ctx.globalAlpha = otA;
    txt(otT, 24, 40, 20, '#ffd06a', 'left', 'bold ');
  }
  ctx.globalAlpha = 1;

  drawUI();
  drawDialogueOverlay();

  if (G.fade > 0.01){ ctx.fillStyle = 'rgba(10,8,6,' + G.fade + ')'; ctx.fillRect(0, 0, LW, LH); }
  if (G.over) drawEndCard();
}

function drawEndCard(){
  ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, LW, LH);
  var t = G.endCard;
  // Eine Strasse, die ins Landesinnere fuehrt, und ein Auto darauf
  gepixelt(function(){
  ctx.save();
  ctx.globalAlpha = Math.min(1, t / 1.6);
  bandV(0, 0, LW, 250, [[0,'#e8a862'],[0.6,'#f0cc94'],[1,'#e2dcc0']], 6);
  ctx.globalAlpha = Math.min(1, t/1.6) * 0.5;
  poly([0,258, 260,196, 540,244, 820,190, LW,232, LW,320, 0,320], '#8a8f78', 0);
  ctx.globalAlpha = Math.min(1, t/1.6);
  poly([0,470, 0,320, 300,300, 640,326, 960,296, LW,318, LW,470], '#6a6a4e', 0);
  var ry = 400;
  ctx.fillStyle = '#8f8778';
  for (var d = 0; d < LW; d += 6) ctx.fillRect(d, psnap(ry + Math.sin(d*0.008)*14), 6, 34);
  ctx.fillStyle = '#d8d0b4';
  for (var s = 0; s < LW; s += 26) ctx.fillRect(s, psnap(ry + 16 + Math.sin(s*0.008)*14), 14, 3);
  var ax = -160 + Math.min(1, t/8) * (LW + 260);
  var ay = ry + Math.sin(ax*0.008)*14 - 4;
  ctx.save(); ctx.translate(ax, ay);
  pOutlineRect(-34, -26, 68, 22, '#7a8a94', '#1a1a16');
  poly([-22, -26, 20, -26, 12, -42, -14, -42], '#8fa0aa', 2);
  pRect(-12, -40, 20, 12, '#3a4a52');
  ell(-20, -2, 8, 8, '#1c1a18', 1.8); ell(20, -2, 8, 8, '#1c1a18', 1.8);
  ctx.restore();
  ctx.restore();
  }, LH);
  ctx.globalAlpha = 0.5 * Math.min(1, t/1.6);
  ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, LW, LH);
  ctx.globalAlpha = 1;

  var a1 = Math.max(0, Math.min(1, (t - 1.2) / 1.2));
  var a1p = Math.max(0, Math.min(1, (t - 2.0) / 0.5));
  titelZeichnen(LW/2 + 4, LH/2 - 58, 0.5, a1 * 0.4, a1p * 0.4, '#140e06');
  titelZeichnen(LW/2, LH/2 - 62, 0.5, a1, a1p, '#eeddb2');
  var a2 = Math.max(0, Math.min(1, (t - 2.4) / 1.2));
  ctx.globalAlpha = a2;
  txt('Ein Leben in Erinnerungen', LW/2, LH/2 + 6, 22, '#c2b291', 'center', 'italic ');
  ctx.globalAlpha = 1;
  var a3 = Math.max(0, Math.min(1, (t - 3.6) / 1.4));
  ctx.globalAlpha = a3 * 0.85;
  var ql = wrap('„Kein großes Happy End. Ein stilles, friedliches Ankommen im eigenen Leben."', 620, 18, 'italic ');
  for (var q = 0; q < ql.length; q++)
    txt(ql[q], LW/2, LH/2 + 54 + q*24, 18, '#a2957c', 'center', 'italic ');
  ctx.globalAlpha = 1;
  var pa = Math.max(0, Math.min(1, (t - 5.5) / 1.2)) * (0.55 + 0.45 * Math.sin(G.t * 2.2));
  ctx.globalAlpha = pa;
  txt('Klicken, um zum Hauptmenü zurückzukehren', LW/2, LH - 50, 17, '#8a7f68', 'center', 'italic ');
  ctx.globalAlpha = 1;
}

/* ============================================================
   Sektion 33  START
   ============================================================ */
resize();
setzeStil(STIL_NAME);
bilderVorladen();
setPlayerIdentity('mAlt');
bindRoom('terrasse', ROOM_TERRASSE.entry, true);
/* Erst der Film, dann die Frage. Wer ihn kennt, klickt sich durch oder
   drueckt Escape -- danach steht das Menue da. */
starteVorspann(function(){ openMainMenu(); });
requestAnimationFrame(frame);
