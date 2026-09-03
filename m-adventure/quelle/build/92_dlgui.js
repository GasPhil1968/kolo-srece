
/* ============================================================
   Sektion 27  DIALOGDARSTELLUNG
   ------------------------------------------------------------
   Zwei Portraits, ein Textfeld, Schreibmaschinenausgabe. Der
   Erzaehler bekommt kein Gesicht: er ist nicht im Raum, er ist
   der Mann von 2018, der sich erinnert -- sein Text steht
   zentriert und kursiv zwischen zwei feinen Linien.
   ============================================================ */
function getCurrentSpeaker(){
  for (var i = 0; i < ACTORS.length; i++) if (ACTORS[i].sayLines) return ACTORS[i];
  return null;
}
function getDialoguePartner(){
  var p = G.dlgPartner ? actorById(G.dlgPartner) : null;
  if (p && p !== PL) return p;
  var sp = getCurrentSpeaker();
  if (sp && sp !== PL) return sp;
  for (var i = 0; i < ACTORS.length; i++) if (ACTORS[i] !== PL && ACTORS[i].visible) return ACTORS[i];
  return NARR;
}
function sindDieselbePerson(a, b){
  if (!a || !b) return false;
  if (a === b) return true;
  return a.name === b.name;
}
function istSelbstgespraech(){
  if (G.dlg) return false;
  var p = G.dlgPartner ? actorById(G.dlgPartner) : null;
  if (p && p !== PL && !sindDieselbePerson(p, PL)) return false;
  var sp = getCurrentSpeaker();
  if (!sp) return true;
  return sindDieselbePerson(sp, PL);
}
function dialogueVisible(){
  if (G.dlg) return true;
  for (var i = 0; i < ACTORS.length; i++) if (ACTORS[i].sayLines) return true;
  return false;
}
function getDialogueMode(speaker, textLines, options){
  if (G.dlg) return 'gespraech';
  if (textLines && textLines.length >= 4) return 'gespraech';
  return 'notiz';
}
var DLG_WRAP_W = 400, DLG_MAX_LINES = 8;
function dialogueLines(speaker){
  if (!speaker || !speaker.sayLines) return null;
  var out = [];
  for (var i = 0; i < speaker.sayLines.length; i++)
    out = out.concat(wrap(speaker.sayLines[i], DLG_WRAP_W, 20));
  return out.slice(0, DLG_MAX_LINES);
}
function getVisibleDialogueLines(lines){
  if (!lines || !lines.length) return [];
  var remain = Math.floor(G.dialogTypeLen), out = [];
  for (var i = 0; i < lines.length; i++){
    if (remain <= 0) break;
    var part = lines[i].slice(0, remain);
    if (part.length) out.push(part);
    remain -= lines[i].length;
  }
  return out;
}
function getDialoguePanelRect(mode, lineCount, optionCount){
  var w = (mode === 'gespraech') ? 528 : 496;
  var h = (mode === 'gespraech') ? 138 : 126;
  if (optionCount) h = Math.min(398, 74 + optionCount * 34);
  else if (lineCount) h = Math.min(268, 74 + lineCount * 24);
  return { x:Math.round((LW - w) / 2), y:52, w:w, h:h };
}
function fitText(str, maxw, size){
  ctx.font = size + "px 'Courier New', Courier, monospace";
  if (ctx.measureText(str).width <= maxw) return str;
  var cut = str;
  while (cut.length > 4 && ctx.measureText(cut + '…').width > maxw) cut = cut.slice(0, -1);
  return cut + '…';
}
function getDialogueOptionRect(i){
  var options = G.dlg ? G.dlg.opts : null;
  var mode = getDialogueMode(getCurrentSpeaker(), null, options);
  var r = getDialoguePanelRect(mode, 0, options ? options.length : 0);
  return { x:r.x + 28, y:r.y + 52 + i * 34, w:r.w - 56, h:26 };
}
function getDialogueCloseRect(r){ return { x:r.x + r.w - 28, y:r.y - 12, w:24, h:20 }; }
function getDialogueCloseButtonRect(){
  if (!G.dlg) return null;
  var mode = getDialogueMode(getCurrentSpeaker(), null, G.dlg.opts);
  return getDialogueCloseRect(getDialoguePanelRect(mode, 0, G.dlg.opts.length));
}

var PORTRAIT_CACHE = {};
function drawPortraitLive(actor, isSpeakingNow){
  /* Das Gesicht ist Bild, nicht Bedienung: es folgt dem Stil. */
  var vorherUI = IN_UI; IN_UI = false;
  var p = actor.pal, b = actor.build;
  var pop = isSpeakingNow ? 1 + Math.max(0, G.dialogPopT / 0.22) * 0.05 : 1;
  var hoch = !!(b && (b.marinemuetze || b.schirmmuetze || b.muetze || b.tuch));
  var pScale = hoch ? 1.56 : 1.78;
  var pY = hoch ? 66 : 58;
  ctx.save();
  ctx.translate(0, pY + (actor.pose ? actor.pose.bob * 0.4 : 0));
  ctx.scale(pScale * pop, pScale * pop);
  pOutlineRect(-25, -15, 50, 32, p.coat, SPRITE_INK);
  if (b.vest){
    pRect(-19, -12, 12, 28, p.vest);
    pRect(7, -12, 12, 28, p.vest);
    if (p.trim){ pRect(-17, -10, 2, 22, p.trim); pRect(15, -10, 2, 22, p.trim); }
  }
  if (b.overall){ pRect(-13, -15, 26, 12, p.overall || p.coat); pRect(-15, -15, 5, 10, '#2a3644'); pRect(10, -15, 5, 10, '#2a3644'); }
  if (b.sakko){
    pRect(-7, -15, 14, 26, p.hemd || '#e4e0d4');
    poly([-15,-15, -3,-13, -8,4], mixHex(p.sakko || p.coat,'#ffffff',0.12), 0);
    poly([15,-15, 3,-13, 8,4], mixHex(p.sakko || p.coat,'#000000',0.18), 0);
    if (p.krawatte) pRect(-3, -13, 6, 22, p.krawatte);
  } else if (b.shirt) pRect(-7, -15, 14, 24, p.shirt);
  if (b.uniform){
    pRect(-25, -15, 50, 8, p.uniformTief || p.coat);
    ell(-8, 0, 2, 2, p.knopf || '#c9a860', 0); ell(8, 0, 2, 2, p.knopf || '#c9a860', 0);
  }
  if (b.coatLong){
    pOutlineRect(-25, -15, 9, 32, p.coat, SPRITE_INK);
    pOutlineRect(16, -15, 9, 32, p.coat, SPRITE_INK);
  }
  pOutlineRect(-6, -27, 12, 14, p.skin, SPRITE_INK);
  pixelHead(0, -46, p, b, actor, actor.pose || { headTurn:0, brow:0 });
  ctx.restore();
  IN_UI = vorherUI;
}
function drawDialoguePortrait(actor, cx, cy, active, isSpeakingNow){
  ctx.save();
  ctx.translate(cx, cy);
  var ringAktiv = '#e0a44a', ringPassiv = '#4f4234';
  var fuellAktiv = '#2e2416', fuellPassiv = '#1a150d';
  ell(4, 6, 72, 84, 'rgba(0,0,0,0.32)', 0);
  ell(0, 0, 72, 84, active ? ringAktiv : ringPassiv, 4);
  ctx.save();
  ctx.beginPath(); ctx.ellipse(0, 0, 66, 78, 0, 0, 6.2832); ctx.clip();
  bandV(-90, -90, 180, 180, [[0, active ? fuellAktiv : fuellPassiv],[1, active ? '#160f07' : '#0f0b06']], 6);
  ctx.globalAlpha = active ? 0.12 : 0.06;
  ctx.fillStyle = ringAktiv;
  ctx.fillRect(-44, -52, 88, 10); ctx.fillRect(-34, -40, 68, 8);
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = false;
  if (typeof drawActorPortraitImage !== 'function' ||
      !drawActorPortraitImage(actor, active && isSpeakingNow ? 1 + Math.max(0, G.dialogPopT / 0.22) * 0.05 : 1))
    drawPortraitLive(actor, active && isSpeakingNow);
  ctx.restore();
  if (!active) ell(0, 0, 66, 78, 'rgba(0,0,0,0.30)', 0);
  box(-40, 64, 80, 15, active ? fuellAktiv : fuellPassiv, 2, 3);
  ctx.strokeStyle = active ? ringAktiv : ringPassiv; ctx.lineWidth = 1.4; ctx.stroke();
  txt(fitText(ue(actor.name), 74, 11), 0, 75, 11, active ? '#f0dfc0' : '#8a7f68', 'center', 'bold ');
  ctx.restore();
}
function drawDialogueCursor(x, y, mode){
  var bob = Math.sin(G.t * 7.5) * 2.5;
  var col = mode === 'gespraech' ? '#e0a44a' : '#7fb8a4';
  ctx.save(); ctx.translate(x + bob, y);
  poly([0, -7, 11, 0, 0, 7], col, 1.6);
  line(11, 0, 17, 0, 1.6, col);
  ctx.restore();
}
function hudCorner(x, y, dx, dy, col){
  var len = 16;
  ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(x, y + dy*len); ctx.lineTo(x, y); ctx.lineTo(x + dx*len, y);
  ctx.stroke();
}
function drawDialogueShell(mode, title, r, erzaehler){
  var accent = erzaehler ? '#c9a06a' : (mode === 'gespraech' ? '#e0a44a' : '#7fb8a4');
  var accentDim = erzaehler ? '#5f4a33' : (mode === 'gespraech' ? '#5a4426' : '#33564c');
  box(r.x + 7, r.y + 8, r.w, r.h, 'rgba(0,0,0,0.38)', 0, 4);
  if (erzaehler) bandV(r.x, r.y, r.w, r.h, [[0,'#221a12'],[0.55,'#150f0a'],[1,'#0b0806']], 6);
  else bandV(r.x, r.y, r.w, r.h, [[0,'#1c1710'],[0.55,'#120e09'],[1,'#080605']], 6);
  ctx.strokeStyle = accentDim; ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.save();
  ctx.globalAlpha = 0.05; ctx.fillStyle = accent;
  for (var py = r.y + 10; py < r.y + r.h - 6; py += 6)
    for (var px = r.x + 10; px < r.x + r.w - 6; px += 6) ctx.fillRect(px, py, 1, 1);
  ctx.restore();
  hudCorner(r.x, r.y, 1, 1, accent);
  hudCorner(r.x + r.w, r.y, -1, 1, accent);
  hudCorner(r.x, r.y + r.h, 1, -1, accent);
  hudCorner(r.x + r.w, r.y + r.h, -1, -1, accent);
  var tw = Math.max(96, title.length * 9 + 34);
  box(r.x + 16, r.y - 12, tw, 20, '#120e09', 2, 3);
  ctx.strokeStyle = accent; ctx.lineWidth = 1.6; ctx.strokeRect(r.x + 16, r.y - 12, tw, 20);
  poly([r.x + 20, r.y - 7, r.x + 20, r.y + 3, r.x + 29, r.y - 2], accent, 0);
  txt(title, r.x + 38, r.y + 2, 13, accent, 'left', 'bold ');
  line(r.x + 16, r.y + 12, r.x + 16 + tw, r.y + 12, 1, accentDim);
  var cr = getDialogueCloseRect(r);
  box(cr.x, cr.y, cr.w, cr.h, '#120e09', 2, 3);
  ctx.strokeStyle = accent; ctx.lineWidth = 1.6; ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);
  line(cr.x + 7, cr.y + 6, cr.x + cr.w - 7, cr.y + cr.h - 6, 2, accent);
  line(cr.x + cr.w - 7, cr.y + 6, cr.x + 7, cr.y + cr.h - 6, 2, accent);
}
function drawNotebookPanel(title, textLines, options, hotIndex, speaker, mode, partnerOverride, alleinFlag){
  IN_UI = true;
  mode = mode || 'notiz';
  var r = getDialoguePanelRect(mode, textLines ? textLines.length : 0, options ? options.length : 0);
  var accent = mode === 'gespraech' ? '#e0a44a' : '#7fb8a4';
  ctx.save();
  var istErz = isNarrator(speaker) && !(options && options.length);
  drawDialogueShell(mode, title, r, istErz);
  var partner = partnerOverride || getDialoguePartner();
  var allein = (alleinFlag !== undefined) ? alleinFlag : istSelbstgespraech();
  if (istErz){
    /* kein Portrait */
  } else if (allein){
    var einzig = (speaker && sindDieselbePerson(speaker, PL)) ? speaker : PL;
    drawDialoguePortrait(einzig, 96, r.y + 82, true, !!speaker);
  } else {
    var leftActive = !speaker || speaker === PL || !!G.dlg;
    var rightActive = !speaker || speaker === partner || !!G.dlg;
    drawDialoguePortrait(PL, 96, r.y + 82, leftActive, speaker === PL);
    drawDialoguePortrait(partner, LW - 96, r.y + 82, rightActive, speaker === partner);
  }
  if (textLines && textLines.length){
    var tx = istErz ? (r.x + r.w/2) : ((mode === 'gespraech') ? r.x + 62 : r.x + 38);
    var ty = r.y + 52;
    if (istErz){
      var lx0 = r.x + 54, lx1 = r.x + r.w - 54;
      ctx.globalAlpha = 0.45; ctx.fillStyle = '#8a7450';
      ctx.fillRect(lx0, ty - 26, lx1 - lx0, 1);
      ctx.fillRect(lx0, ty + textLines.length * 24 - 12, lx1 - lx0, 1);
      ctx.globalAlpha = 1;
    }
    for (var i = 0; i < textLines.length; i++){
      txt(textLines[i], tx, ty + i * 24, istErz ? 19 : 20,
          istErz ? '#e2caa0' : '#f0e8d8',
          istErz ? 'center' : 'left',
          istErz ? 'italic ' : '');
    }
    if (G.dialogTypeLen < G.dialogTextTotal) drawDialogueCursor(r.x + r.w - 24, r.y + r.h - 18, mode);
  }
  if (options && options.length){
    for (var j = 0; j < options.length; j++){
      var opt = options[j], or = getDialogueOptionRect(j), disabled = !!opt.disabled;
      if (j === hotIndex && !disabled){
        box(or.x - 2, or.y - 18, or.w + 4, 24, 'rgba(224,164,74,0.13)', 1.4, 3);
        ctx.strokeStyle = accent; ctx.lineWidth = 1.4; ctx.strokeRect(or.x - 2, or.y - 18, or.w + 4, 24);
        drawDialogueCursor(or.x - 18, or.y - 5, mode);
      }
      var numCol = disabled ? '#5a5040' : accent;
      var textCol = disabled ? '#5a5040' : '#e8e0d0';
      txt((j + 1) + '.', or.x + 4, or.y, 17, numCol, 'left', 'bold ');
      if (opt._renderCacheW !== or.w || opt._renderCacheDisabled !== disabled){
        opt._renderCacheW = or.w; opt._renderCacheDisabled = disabled;
        var prefix0 = opt.done ? '✓ ' : (opt.locked ? '× ' : '');
        var label0 = (opt.fresh && !disabled) ? ue(opt.unlock || 'NEU') : (opt.done ? ue('GEFRAGT') : null);
        var chipW0 = 0;
        if (label0){
          ctx.font = "bold 9px 'Courier New', Courier, monospace";
          chipW0 = Math.ceil(ctx.measureText(label0).width) + 12;
        }
        opt._label = label0; opt._chipW = chipW0;
        opt._renderText = fitText(prefix0 + opt.t, or.w - 34 - (chipW0 ? chipW0 + 10 : 0), 17);
      }
      txt(opt._renderText, or.x + 28, or.y, 17, textCol);
      if (opt._label){
        var chipX = or.x + or.w - opt._chipW;
        if (opt.fresh && !disabled){
          box(chipX, or.y - 16, opt._chipW, 17, '#3a2a16', 1.4, 3);
          ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.strokeRect(chipX, or.y - 16, opt._chipW, 17);
          txt(opt._label, chipX + opt._chipW/2, or.y - 3, 9, '#ffe0a8', 'center', 'bold ');
        } else {
          box(chipX, or.y - 16, opt._chipW, 17, '#1a150e', 0, 3);
          txt(opt._label, chipX + opt._chipW/2, or.y - 3, 9, '#6a604e', 'center', 'bold ');
        }
      }
    }
    txt(ue('Tippen oder Zahl drücken'), r.x + r.w - 18, r.y + r.h - 12, 12, '#5a5040', 'right');
  }
  ctx.restore();
  IN_UI = false;
}
function dialogPopEase(a){ return 0.90 + 0.10 * a + 0.035 * Math.sin(Math.min(1, a) * Math.PI); }
function drawDialogueOverlay(){
  var visible = dialogueVisible();
  if (visible){
    var speaker = getCurrentSpeaker();
    var fullLines = null, visibleLines = null, opts = null;
    if (speaker && speaker.sayLines){
      fullLines = G.dialogLinesCache;
      visibleLines = getVisibleDialogueLines(fullLines);
    }
    if (G.dlg) opts = G.dlg.opts;
    var mode = getDialogueMode(speaker, fullLines, opts);
    var title = G.dlg ? ue('Gespräch') : (speaker ? (isNarrator(speaker) ? ue('M., später') : speaker.name) : ue('Gespräch'));
    G.dlgSnapshot = { title:title, visibleLines:visibleLines, opts:opts, mode:mode,
      speaker: speaker || PL, partner: getDialoguePartner(), allein: istSelbstgespraech() };
  }
  if (!visible && G.dialogAlpha <= 0.02){ G.dlgSnapshot = null; return; }
  if (G.dialogAlpha <= 0.02) return;
  var snap = G.dlgSnapshot;
  if (!snap) return;
  var hot = visible ? getDlgHoverIndex() : -1;
  var pop = dialogPopEase(G.dialogAlpha);
  var panelR = getDialoguePanelRect(snap.mode, snap.visibleLines ? snap.visibleLines.length : 0,
                                    snap.opts ? snap.opts.length : 0);
  var pcx = panelR.x + panelR.w/2, pcy = panelR.y + panelR.h/2;
  ctx.save();
  ctx.globalAlpha = G.dialogAlpha;
  ctx.translate(pcx, pcy); ctx.scale(pop, pop); ctx.translate(-pcx, -pcy);
  ctx.translate(0, (1 - G.dialogAlpha) * -12);
  drawNotebookPanel(snap.title, snap.visibleLines, snap.opts, hot, snap.speaker, snap.mode, snap.partner, snap.allein);
  ctx.restore();
}
function getDlgHoverIndex(){
  if (!G.dlg) return -1;
  for (var i = 0; i < G.dlg.opts.length; i++){
    var r = getDialogueOptionRect(i);
    if (IN.x > r.x && IN.x < r.x + r.w && IN.y > r.y - 18 && IN.y < r.y + 8){
      if (!G.dlg.opts[i].disabled) return i;
    }
  }
  var sel = (G.dlgSel >= 0 ? G.dlgSel : 0), n = G.dlg.opts.length;
  for (var k = 0; k < n; k++){
    var idx = (sel + k) % n;
    if (!G.dlg.opts[idx].disabled) return idx;
  }
  return -1;
}
