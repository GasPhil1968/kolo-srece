
/* ============================================================
   Sektion 17  SEQUENZER
   ------------------------------------------------------------
   Schritt = { say:[actor,lines] } | { wait:sec } | { walk:[a,x,y,dir] }
            | { mark:[a,'name'] } | { fn:function } | { face:[a,dir] }
            | { sit:[a,bool,dauer] } | { dlg:'knoten' }
   ============================================================ */
function play(list){ G.seq = list.slice(); G.si = 0; G.wait = 0; stepStart(); }
function stepStart(){
  if (!G.seq) return;
  if (G.si >= G.seq.length){ G.seq = null; return; }
  var s = G.seq[G.si];
  if (s.say){
    var a = s.say[0], lines = s.say[1];
    var text = (typeof lines === 'string') ? [lines] : lines;
    var chars = text.join(' ').length;
    a.say(text, 0); a.talkT = 99;
    G.wait = Math.max(1.5, Math.min(7, 1.0 + chars * 0.055));
  } else if (s.wait){ G.wait = s.wait; }
  else if (s.walk){
    var w = s.walk; G.wait = -1;
    w[0].walkTo(R.area, R.nodes, w[1], w[2], w[3] || 0, function(){ G.wait = 0; advance(); });
  } else if (s.mark){
    var mw = s.mark, mm = mark(R, mw[1]);
    if (!mm){ G.wait = 0.01; }
    else { G.wait = -1; mw[0].walkTo(R.area, R.nodes, mm.x, mm.y, mm.dir || 0, function(){ G.wait = 0; advance(); }); }
  } else if (s.sit){ s.sit[0].sit(s.sit[1] !== false); G.wait = s.sit[2] || 0.55; }
  else if (s.face){ s.face[0].dir = s.face[1]; G.wait = 0.01; }
  else if (s.fn){ var r = s.fn(); G.wait = (r === 'async') ? -1 : 0.01; }
  else if (s.dlg){ openDlg(s.dlg); G.wait = -1; }
  else G.wait = 0.01;
}
function advance(){
  if (!G.seq) return;
  var s = G.seq[G.si];
  if (s && s.say){ s.say[0].sayLines = null; s.say[0].talkT = 0; }
  G.si++; stepStart();
}
function updateSeq(dt){
  if (!G.seq) return;
  if (G.wait < 0) return;
  G.wait -= dt;
  if (G.skip && G.seq[G.si] && G.seq[G.si].say){ G.wait = 0; }
  if (G.wait <= 0) advance();
}
function say(a, lines){ play([ { say:[a, lines] } ]); }

/* ============================================================
   Sektion 18  DIALOGKERN
   ============================================================ */
function dialogOptions(defs){
  var out=[];
  for(var i=0;i<defs.length;i++){
    var d=defs[i], show=true;
    if(typeof d.when==='function') show=!!d.when();
    else if(typeof d.when==='string') show=!!FLAG[d.when];
    if(!show){ if(d.showLocked){ var lk=Object.assign({},d); lk.t=ue(lk.t); lk.disabled=true; lk.locked=true; out.push(lk); } continue; }
    var o=Object.assign({},d);
    o.t = ue(o.t);
    if(o.once && FLAG[o.once]){ o.done=true; o.disabled=true; }
    else if(o.once) o.fresh=true;
    out.push(o);
  }
  return out;
}
function openDlg(node, partner){
  if(partner) G.dlgPartner = partner.id || partner;
  G.dlg = { node:node, opts: DLGNODES[node] ? DLGNODES[node]() : [] };
  G.dlgSel = 0;
  for(var i=0;i<G.dlg.opts.length;i++) if(!G.dlg.opts[i].disabled){ G.dlgSel=i; break; }
  G.dialogTypeLen = 0; G.dialogTextTotal = 0; G.dialogTextKey = ''; G.dialogTickAt = 0;
  uiSound('confirm');
}
function closeDlg(){
  G.dlg = null; G.dlgSel = 0; G.dlgPartner = null;
  if (G.seq && G.wait < 0){ G.wait = 0; advance(); }
}
function pickDlg(i){
  var o = G.dlg && G.dlg.opts[i];
  if (!o || o.disabled){ uiSound('nav'); return; }
  uiSound('confirm');
  G.dlg = null; G.dlgSel = 0;
  if (o.once) setFlag(o.once, true);
  if (!o.go){ G.dlgPartner = null; if (G.seq && G.wait < 0){ G.wait = 0; advance(); } return; }
  var handler = DLG_RESP[o.go] || DLGNODES[o.go];
  if (typeof handler === 'function') handler();
}
function moveDlgSel(dir){
  if (!G.dlg || !G.dlg.opts.length) return;
  var n=G.dlg.opts.length, cur=G.dlgSel||0;
  for(var step=0;step<n;step++){
    cur=(cur+dir+n)%n;
    if(!G.dlg.opts[cur].disabled){ G.dlgSel=cur; uiSound('nav'); return; }
  }
}
