/* ============================================================
   Sektion 03  GEOMETRIE + WEGFINDUNG
   ------------------------------------------------------------
   Begehbare Flaeche = Vereinigung mehrerer Polygone.
   Weg = Sichtbarkeitsgraph ueber alle Polygonecken + Start/Ziel.
   ============================================================ */
function ptInPoly(x, y, p){
  var i, j, c = false, n = p.length;
  for (i = 0, j = n - 2; i < n; j = i, i += 2){
    var xi = p[i], yi = p[i+1], xj = p[j], yj = p[j+1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
  }
  return c;
}
function walkableAt(area, x, y){
  for (var k = 0; k < area.length; k++) if (ptInPoly(x, y, area[k])) return true;
  return false;
}
function segOK(area, ax, ay, bx, by){
  var dx = bx - ax, dy = by - ay, len = Math.sqrt(dx*dx + dy*dy);
  var n = Math.max(2, Math.ceil(len / 5));
  for (var i = 0; i <= n; i++){
    var t = i / n;
    if (!walkableAt(area, ax + dx*t, ay + dy*t)) return false;
  }
  return true;
}
function polyCentroid(p){
  var sx = 0, sy = 0, n = p.length / 2;
  for (var i = 0; i < p.length; i += 2){ sx += p[i]; sy += p[i+1]; }
  return { x: sx/n, y: sy/n };
}
function nearestWalkable(area, x, y){
  if (walkableAt(area, x, y)) return { x:x, y:y };
  var best = null, bd = 1e9;
  for (var k = 0; k < area.length; k++){
    var p = area[k];
    for (var i = 0; i < p.length; i += 2){
      var j = (i + 2) % p.length;
      var ax = p[i], ay = p[i+1], bx = p[j], by = p[j+1];
      var dx = bx-ax, dy = by-ay, L2 = dx*dx + dy*dy;
      var t = L2 ? Math.max(0, Math.min(1, ((x-ax)*dx + (y-ay)*dy) / L2)) : 0;
      var qx = ax + dx*t, qy = ay + dy*t;
      var d = (qx-x)*(qx-x) + (qy-y)*(qy-y);
      if (d < bd){ bd = d; best = { x:qx, y:qy }; }
    }
  }
  if (!best) return { x:x, y:y };
  // minimal nach innen ruecken
  var c = polyCentroid(area[0]);
  var vx = c.x - best.x, vy = c.y - best.y, vl = Math.hypot(vx, vy) || 1;
  var cand = { x: best.x + vx/vl*1.5, y: best.y + vy/vl*1.5 };
  return walkableAt(area, cand.x, cand.y) ? cand : best;
}
function buildNodes(area){
  var nodes = [];
  for (var k = 0; k < area.length; k++){
    var p = area[k], c = polyCentroid(p);
    for (var i = 0; i < p.length; i += 2){
      var vx = c.x - p[i], vy = c.y - p[i+1], vl = Math.hypot(vx, vy) || 1;
      var nx = p[i] + vx/vl*3, ny = p[i+1] + vy/vl*3;
      if (walkableAt(area, nx, ny)) nodes.push({ x:nx, y:ny });
    }
  }
  return nodes;
}
function findPath(area, nodes, sx, sy, tx, ty){
  var s = nearestWalkable(area, sx, sy), t = nearestWalkable(area, tx, ty);
  if (segOK(area, s.x, s.y, t.x, t.y)) return [ { x:t.x, y:t.y } ];
  var pts = [ s ].concat(nodes, [ t ]);
  var N = pts.length, S = 0, T = N - 1;
  var adj = [];
  for (var i = 0; i < N; i++) adj.push([]);
  for (var a = 0; a < N; a++) for (var b = a + 1; b < N; b++){
    if (segOK(area, pts[a].x, pts[a].y, pts[b].x, pts[b].y)){
      var d = Math.hypot(pts[a].x-pts[b].x, pts[a].y-pts[b].y);
      adj[a].push({ n:b, d:d }); adj[b].push({ n:a, d:d });
    }
  }
  var dist = new Array(N).fill(Infinity), prev = new Array(N).fill(-1), done = new Array(N).fill(false);
  dist[S] = 0;
  for (var it = 0; it < N; it++){
    var u = -1, bd = Infinity;
    for (var q = 0; q < N; q++) if (!done[q] && dist[q] < bd){ bd = dist[q]; u = q; }
    if (u < 0) break;
    done[u] = true;
    if (u === T) break;
    for (var e = 0; e < adj[u].length; e++){
      var v = adj[u][e].n, nd = dist[u] + adj[u][e].d;
      if (nd < dist[v]){ dist[v] = nd; prev[v] = u; }
    }
  }
  if (dist[T] === Infinity) return [ { x:t.x, y:t.y } ];
  var path = [], cur = T;
  while (cur !== -1 && cur !== S){ path.unshift({ x:pts[cur].x, y:pts[cur].y }); cur = prev[cur]; }
  return path.length ? path : [ { x:t.x, y:t.y } ];
}

/* ============================================================
   Sektion 04  ZEICHEN-HILFEN (Comic-Umriss-Stil)
   ============================================================ */
/* ------------------------------------------------------------
   TINTE
   ------------------------------------------------------------
   Die Kontur ist in einem Spiel, das fast nur aus Silhouetten
   besteht, keine Nebensache: sie ist ein Viertel der sichtbaren
   Flaeche. Reines Schwarz gehoert zu einem Krimi in einem
   Treppenhaus. Ein Nachmittag an der Adria braucht eine warme,
   dunkle Tinte -- dieselbe Zeichnung, aber die Figuren stehen
   dann IN der Sonne statt davor.

   INK        = Kontur der Hintergrundformen (stroke ueber L())
   SPRITE_INK = Kontur der Figuren und Sprites
   Beide werden pro Raum gesetzt, siehe setzeRaumTinte().
   ------------------------------------------------------------ */
var INK = '#2e1f16';
var SPRITE_INK = '#2a1a12';
/* Die Bedienleiste, die Dialogbox und das Menue sind kein Bild, sondern
   Bedienung. Sie folgen dem Bildstil nicht: eine Trennlinie im Inventar
   muss sichtbar sein, auch wenn im Bild gerade nichts umrandet wird. */
var IN_UI = false;
function L(w){
  /* Die Linienstaerke haengt am Stil: Tusche zieht dick durch, Gouache
     zeichnet gar keine Kontur, sondern haelt die Kante ueber die Farbe. */
  var f = (IN_UI || typeof STIL === 'undefined') ? 1 : STIL.linie;
  ctx.lineWidth = Math.max(0.0001, w * f);
  ctx.strokeStyle = (!IN_UI && typeof STIL !== 'undefined' && STIL.kontur === 'hart') ? '#12100e' : INK;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
}
function rr(x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}
function stiftAn(){ return IN_UI || (typeof STIL === 'undefined') || STIL.linie > 0.01; }
function box(x, y, w, h, fill, lw, r){
  rr(x, y, w, h, r || 0);
  if (fill){ ctx.fillStyle = fill; ctx.fill(); }
  if (lw && stiftAn()){ L(lw); ctx.stroke(); }
  else if (lw && fill){ /* gehaltene Kante statt Kontur */
    ctx.strokeStyle = konturFuer(fill); ctx.lineWidth = Math.max(1, lw * 0.7);
    ctx.lineJoin = 'round'; ctx.stroke();
  }
}
function poly(pts, fill, lw){
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i+1]);
  ctx.closePath();
  if (fill){ ctx.fillStyle = fill; ctx.fill(); }
  if (lw && stiftAn()){ L(lw); ctx.stroke(); }
  else if (lw && fill){
    ctx.strokeStyle = konturFuer(fill); ctx.lineWidth = Math.max(1, lw * 0.7);
    ctx.lineJoin = 'round'; ctx.stroke();
  }
}
function line(x1, y1, x2, y2, lw, col){
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  L(lw || 2); if (col) ctx.strokeStyle = col; ctx.stroke();
}
function ell(x, y, rx, ry, fill, lw){
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.2832);
  if (fill){ ctx.fillStyle = fill; ctx.fill(); }
  if (lw && stiftAn()){ L(lw); ctx.stroke(); }
  else if (lw && fill){
    ctx.strokeStyle = konturFuer(fill); ctx.lineWidth = Math.max(1, lw * 0.7);
    ctx.stroke();
  }
}
function txt(s, x, y, size, col, align, font){
  ctx.font = (font || '') + size + "px 'Courier New', Courier, monospace";
  ctx.fillStyle = col; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}
function wrap(s, maxw, size, font){
  ctx.font = (font || '') + size + "px 'Courier New', Courier, monospace";
  var words = s.split(' '), lines = [], cur = '';
  for (var i = 0; i < words.length; i++){
    var t = cur ? cur + ' ' + words[i] : words[i];
    if (ctx.measureText(t).width > maxw && cur){ lines.push(cur); cur = words[i]; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
/* ------------------------------------------------------------
   Gerasterte Flaechen: weiche Verlaeufe stehen gegen den harten
   Pixelrand der Figuren. Alles Weiche wird deshalb in feste
   Farbstufen zerlegt und auf das 2px-Raster gelegt.
   ------------------------------------------------------------ */
var ROOM_LIGHT_DEFAULT = { dir:1, rimColor:'#c7dcec', ambient:'#232c42', rim:0.4 };
function currentLight(){ return (typeof R!=='undefined' && R && R.light) || ROOM_LIGHT_DEFAULT; }
/* Randlicht auf der lichtzugewandten Kante eines Silhouettenblocks.
   side ist lokal (vor der dir-Spiegelung); erst hier wird mit der
   tatsaechlichen Blickrichtung der Figur zur Weltseite verrechnet,
   damit das Licht immer von derselben Weltseite zu kommen scheint,
   egal wohin die Figur schaut. */
function litEdge(x, y, w, h, side, actorDir, fillCol){
  var L = currentLight();
  var worldSide = side * (actorDir || 1);
  if (worldSide !== L.dir) return;
  var hi = mixHex(fillCol || '#8a7a68', L.rimColor, 0.55 + L.rim * 0.25);
  var sx = side > 0 ? psnap(x + w) - 3 : psnap(x);
  ctx.globalAlpha = 0.5 + L.rim * 0.4;
  ctx.fillStyle = hi;
  ctx.fillRect(sx, psnap(y) + 2, 3, Math.max(2, psnap(h) - 4));
  ctx.globalAlpha = 1;
}
/* Farbparser. Frueher verstand hex2rgb() ausschliesslich Hex-Strings.
   mixHex() gibt aber 'rgb(r,g,b)' zurueck, und dieses Ergebnis lief an
   mehreren Stellen wieder in einen Mischschritt hinein -- vor allem in
   roomLightWash(), wo der mittlere Stop selbst ein mixHex-Ergebnis ist.
   Beim erneuten Parsen wurde daraus parseInt('rg',16) === NaN, also
   'rgb(NaN,..)'. Canvas verwirft eine ungueltige fillStyle stillschweigend
   und behaelt die vorherige Farbe: der Lichtschleier hat deshalb nie das
   Raumlicht gemalt, sondern den Farbrest des vorigen Zeichenschritts.
   parseCol() nimmt jetzt beide Schreibweisen an. */
var COL_CACHE = {};
function parseCol(c){
  var hit = COL_CACHE[c];
  if (hit) return hit;
  var out;
  if (c.charAt(0) === '#'){
    var h = c.slice(1);
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    out = [ parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16) ];
  } else {
    var m = /(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+(-?[\d.]+)/.exec(c);
    out = m ? [ +m[1]|0, +m[2]|0, +m[3]|0 ] : [0,0,0];
  }
  COL_CACHE[c] = out;
  return out;
}
function hex2rgb(h){ return parseCol(h); }
/* Mischergebnisse werden gecacht: die Lichtrechnung fragt pro Frame
   immer wieder dieselben Farbpaare ab. */
var MIX_CACHE = {};
function mixHex(a, b, t){
  var q = t < 0 ? 0 : t > 1 ? 1 : t;
  var key = a + '|' + b + '|' + ((q * 255) | 0);
  var hit = MIX_CACHE[key];
  if (hit) return hit;
  var A = parseCol(a), B = parseCol(b);
  var r = Math.round(A[0]+(B[0]-A[0])*q), g = Math.round(A[1]+(B[1]-A[1])*q), bl = Math.round(A[2]+(B[2]-A[2])*q);
  var res = 'rgb('+r+','+g+','+bl+')';
  MIX_CACHE[key] = res;
  return res;
}
/* Vertikaler Verlauf in festen Stufen. stops = [[pos,farbe],...] */
function bandV(x, y, w, h, stops, steps){
  steps = steps || 7;
  if (typeof STIL !== 'undefined') steps = Math.max(2, Math.round(steps * STIL.banding));
  for (var i = 0; i < steps; i++){
    var t = steps > 1 ? i/(steps-1) : 0;
    var c = stopsAt(stops, t);
    var y0 = y + Math.round(h*i/steps/2)*2;
    var y1 = y + Math.round(h*(i+1)/steps/2)*2;
    ctx.fillStyle = c;
    ctx.fillRect(x, y0, w, Math.max(2, y1-y0));
  }
}
function stopsAt(stops, t){
  for (var i = 0; i < stops.length-1; i++){
    if (t <= stops[i+1][0]){
      var span = stops[i+1][0]-stops[i][0] || 1;
      return mixHex(stops[i][1], stops[i+1][1], (t-stops[i][0])/span);
    }
  }
  return stops[stops.length-1][1];
}
/* Lichtkegel als konzentrische Stufen statt Radialverlauf. */
/* Lichtkegel als konzentrische Stufen.

   Frueher wurde der Schein deckend ueber die Szene gemalt. Deckende helle
   Farbe verhaelt sich aber wie Nebel, nicht wie Licht: sie zieht alles
   darunter zur Lampenfarbe hin und nimmt ihm die Zeichnung. Der
   Schreibtisch verschwand so unter einem beigen Fleck, je heller die
   Lampe war -- also genau dort am meisten, wo man am meisten sehen will.

   Jetzt additiv ('lighter'). Additives Licht hebt vorhandene Farbe an,
   statt sie zu ersetzen: Holz bleibt Holz, wird aber warm und hell.
   Dunkle Stellen gewinnen dabei mehr als helle, was dem Verhalten einer
   echten Lampe entspricht. Die Stufigkeit des Rasters bleibt erhalten. */
function pixelGlow(cx, cy, rx, ry, col, aMax, steps){
  steps = steps || 5;
  var bandH = 8;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = col;
  for (var i = steps; i >= 1; i--){
    var f = i/steps;
    // Additiv traegt jede Stufe voll auf, darum deutlich flacher
    // dosiert als beim frueheren deckenden Auftrag.
    ctx.globalAlpha = aMax * (1 - f*f) * 0.42;
    var RX = rx*f, RY = ry*f;
    for (var yy = -RY; yy < RY; yy += bandH){
      var k = 1 - (yy+bandH/2)*(yy+bandH/2)/(RY*RY);
      if (k <= 0) continue;
      var hw = Math.round(RX*Math.sqrt(k)/4)*4;
      if (hw < 4) continue;
      ctx.fillRect(Math.round((cx-hw)/2)*2, Math.round((cy+yy)/2)*2, hw*2, bandH);
    }
  }
  ctx.restore();
}
/* Unregelmaessiger Fleck aus wenigen Rechtecken statt weicher Ellipse. */
function pixelBlob(x, y, w, h, col, alpha, rnd){
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = col;
  var rows = 3;
  for (var i = 0; i < rows; i++){
    var t = i/(rows-1) - 0.5;
    var ww = Math.round(w*(1-Math.abs(t)*0.55)/2)*2;
    var yy = Math.round((y + h*i/rows)/2)*2;
    var jitter = rnd ? Math.round((rnd()-0.5)*w*0.14/2)*2 : 0;
    ctx.fillRect(Math.round((x+(w-ww)/2+jitter)/2)*2, yy, ww, Math.max(2, Math.round(h/rows/2)*2));
  }
  ctx.restore();
}
/* Randabdunklung in Stufen, ohne Radialverlauf. */
function pixelVignette(){
  // Nur die Seiten und ein schmaler Deckenrand, in flachen Stufen.
  // Eine breite Oberkante wuerde als sichtbare Linie quer im Bild stehen.
  // Die Farbe wird in die Umgebungsfarbe des Raums getoent, damit die
  // Randabdunklung zum Kunstlicht der Szene gehoert statt neutral zu wirken.
  var L = currentLight();
  var vigCol = mixHex('#140a04', L.ambient, 0.32);
  var kraft = ((typeof VIG_STAERKE === 'number') ? VIG_STAERKE : 1) * ((typeof STIL !== 'undefined') ? STIL.vignette : 1);
  var steps = 8;
  ctx.save();
  ctx.fillStyle = vigCol;
  for (var i = 0; i < steps; i++){
    var w = Math.round((14 + i*13)/2)*2;
    ctx.globalAlpha = 0.038 * kraft;
    ctx.fillRect(0, 0, w, VIEW_H);
    ctx.fillRect(LW - w, 0, w, VIEW_H);
  }
  for (var j = 0; j < 4; j++){
    ctx.globalAlpha = 0.035 * kraft;
    ctx.fillRect(0, 0, LW, Math.round((10 + j*8)/2)*2);
    ctx.fillRect(0, VIEW_H - Math.round((8 + j*6)/2)*2, LW, Math.round((8 + j*6)/2)*2);
  }
  ctx.restore();
}
/* Horizontaler Verlauf in festen Stufen, Gegenstueck zu bandV. */
function bandH(x, y, w, h, stops, steps){
  steps = steps || 7;
  if (typeof STIL !== 'undefined') steps = Math.max(2, Math.round(steps * STIL.banding));
  for (var i = 0; i < steps; i++){
    var t = steps > 1 ? i/(steps-1) : 0;
    ctx.fillStyle = stopsAt(stops, t);
    var x0 = x + Math.round(w*i/steps/2)*2;
    var x1 = x + Math.round(w*(i+1)/steps/2)*2;
    ctx.fillRect(x0, y, Math.max(2, x1-x0), h);
  }
}
/* Duenner, gerichteter Lichtschleier ueber die ganze Szene: die
   lichtzugewandte Seite bekommt einen Hauch Randlichtfarbe, die
   abgewandte einen Hauch Umgebungsfarbe. Bindet Wand, Boden und
   Moebel an dasselbe Kunstlicht wie die Figuren.

   Frueher lief hier bandV, also ein Verlauf von OBEN nach UNTEN --
   das widersprach dem eigenen Zweck: L.dir ist eine Seitenangabe
   (1 = Licht von rechts), keine Hoehenangabe. Der Schleier hellte
   deshalb den Boden auf statt die Lichtseite. Jetzt bandH, und der
   Verlauf folgt tatsaechlich der Lichtrichtung des Raums.

   Zusaetzlich ein zweiter, vertikaler Durchgang: Raeume werden nach
   oben hin leicht in die Umgebungsfarbe gezogen. Das ist die
   Luftperspektive im Kleinen und gibt Waenden Hoehe, ohne dass in
   jedem Raum von Hand schattiert werden muesste. */
function roomLightWash(){
  var L = currentLight();
  var lit = L.rimColor, amb = L.ambient;
  ctx.save();

  // 1. Seitliches Kunstlicht, in Lichtrichtung.
  ctx.globalAlpha = 0.07;
  var gLeft  = L.dir > 0 ? amb : lit;
  var gRight = L.dir > 0 ? lit : amb;
  bandH(0, 0, R.w, VIEW_H, [[0, gLeft], [0.5, mixHex(gLeft, gRight, 0.5)], [1, gRight]], 7);

  // 2. Hoehenstaffelung: oben etwas mehr Umgebungsfarbe.
  ctx.globalAlpha = 0.05;
  bandV(0, 0, R.w, VIEW_H, [[0, amb], [0.45, mixHex(amb, lit, 0.35)], [1, lit]], 6);

  ctx.restore();
}
/* Schlagschatten auf dem Boden: ein Objekt der Breite w an der Stelle x
   wirft vom Licht weg einen flachen, gerasterten Keil. Bindet Moebel an
   den Boden, statt sie davorzustellen. */
function castShadow(x, groundY, w, len, alpha){
  var L = currentLight();
  var dir = -L.dir;                       // Schatten faellt vom Licht weg
  len = len || w * 0.9;
  ctx.save();
  ctx.fillStyle = mixHex('#0a0705', L.ambient, 0.35);
  var steps = 5;
  for (var i = 0; i < steps; i++){
    var f = i / steps;
    ctx.globalAlpha = (alpha === undefined ? 0.22 : alpha) * (1 - f) * 0.9;
    var sx = psnap(x + dir * len * f);
    var sw = psnap(w * (1 - f * 0.35));
    ctx.fillRect(sx, psnap(groundY + f * 5), Math.max(2, sw), 4);
  }
  ctx.restore();
}
function seeded(n){ var s = n * 9301 + 49297; return function(){ s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

/* ============================================================
   Sektion 05  FIGUREN
   ------------------------------------------------------------
   Rein prozedural. Ursprung = Fusspunkt (0,0), Figur waechst
   nach oben. Hoehe im Bezugsraum: 170 Einheiten.
   ============================================================ */
var FIGH = 170;

function Actor(cfg){
  this.id = cfg.id;
  this.name = cfg.name;
  this.x = cfg.x; this.y = cfg.y;
  this.dir = cfg.dir || 1;         // 1 = rechts, -1 = links
  this.pal = cfg.pal;
  this.build = cfg.build || {};
  this.path = null; this.pi = 0;
  this.phase = 0; this.speed = cfg.speed || 105;
  this.state = 'idle';
  this.talkT = 0; this.blink = 2 + Math.random() * 3;
  this.after = null;
  this.sayLines = null; this.sayT = 0;
  /* ein = Einblendung beim Auftritt. Wer von der Seite hereinlaeuft,
     faengt bei 0 an und ist nach gut einer halben Sekunde da. Ohne das
     erscheint er hart an der Kante der begehbaren Flaeche -- und die
     liegt bei den meisten Raeumen mitten im Bild. */
  this.ein = 1;
  this.visible = cfg.visible !== false;
  this.faceTarget = null;

  /* --- Animation ------------------------------------------- */
  this.pose  = newPose();          // geglaettete Ist-Pose
  this.tp    = newPose();          // Zielpose des aktuellen Zustands
  this.blend = cfg.blend || 11;    // Blendgeschwindigkeit pro Sekunde
  this.t     = Math.random() * 40; // eigene Zeitachse, damit Figuren nicht synchron atmen
  this.act   = null;               // { kind, t, dur, cb, fired }
  this.fidget = 2.5 + Math.random() * 4;
  this.fidgetKind = null; this.fidgetT = 0;
  this.fidgets = cfg.fidgets || ['weight'];
  this.gest = 0;                   // Gestenhuellkurve beim Sprechen
  this.gestSeed = Math.random() * 10;
  this.lookAt = null;              // Actor, zu dem der Kopf sich dreht
  this.sitting = false;            // sitzt auf einem Moebel
  this.hoehe = 0;                  // Erhoehung ueber dem Boden (Stein, Bank)
}

function newPose(){
  return {
    bob:0, lean:0, crouch:0, hipShift:0,
    headTurn:0, headTilt:0, headNod:0, brow:0,
    aBsw:0, aBbend:0, aFsw:0, aFbend:0,
    lFsw:0, lBsw:0, lFknee:0, lBknee:0, lFlift:0, lBlift:0,
    shrug:0, sit:0
  };
}
var POSE_KEYS = Object.keys(newPose());
function blendPose(cur, tgt, k){
  for (var i = 0; i < POSE_KEYS.length; i++){
    var key = POSE_KEYS[i];
    cur[key] += (tgt[key] - cur[key]) * k;
  }
}

Actor.prototype.walkTo = function(area, nodes, tx, ty, dirAfter, cb){
  this.sitting = false;            // wer losgeht, steht zuerst auf
  this.path = findPath(area, nodes, this.x, this.y, tx, ty);
  this.pi = 0; this.state = 'walk';
  this.after = cb || null; this.dirAfter = dirAfter || 0;
};
Actor.prototype.stop = function(){ this.path = null; this.state = 'idle'; };
Actor.prototype.sit = function(v){ this.sitting = !!v; if (v){ this.path = null; this.state = 'idle'; } };
Actor.prototype.say = function(lines, t){
  /* Die einzige Stelle, an der eine gesprochene Zeile entsteht --
     darum wird hier uebersetzt und nirgends sonst. */
  this.sayLines = ueListe((typeof lines === 'string') ? [ lines ] : lines);
  this.sayT = t || 0;
  this.gest = 1;
};
/* Kurze Koerperaktion: 'take' (buecken), 'reach' (greifen), 'push' (druecken).
   cb wird auf dem Hoehepunkt der Bewegung ausgeloest, nicht am Ende. */
Actor.prototype.doAct = function(kind, dur, cb){
  this.act = { kind:kind, t:0, dur:dur || 0.85, cb:cb || null, fired:false };
};

Actor.prototype.update = function(dt){
  this.t += dt;
  if (this.ein < 1) this.ein = Math.min(1, this.ein + dt * 1.9);
  this.blink -= dt;
  if (this.blink < -0.14) this.blink = 2.4 + Math.random() * 3.4;
  if (this.talkT > 0) this.talkT -= dt;
  if (this.sayT > 0){ this.sayT -= dt; if (this.sayT <= 0) this.sayLines = null; }

  // Aktion laeuft und blockiert das Laufen
  if (this.act){
    this.act.t += dt;
    var half = this.act.dur * 0.5;
    if (!this.act.fired && this.act.t >= half){
      this.act.fired = true;
      if (this.act.cb) this.act.cb();
    }
    if (this.act.t >= this.act.dur) this.act = null;
  }

  if (this.state === 'walk' && this.path && !this.act){
    var tgt = this.path[this.pi];
    var dx = tgt.x - this.x, dy = tgt.y - this.y, d = Math.hypot(dx, dy);
    var step = this.speed * dt * (0.55 + 0.45 * scaleAt(this.y));
    if (d <= step){
      this.x = tgt.x; this.y = tgt.y; this.pi++;
      if (this.pi >= this.path.length){
        this.path = null; this.state = 'idle';
        if (this.dirAfter) this.dir = this.dirAfter;
        var cb = this.after; this.after = null; if (cb) cb();
      }
    } else {
      this.x += dx / d * step; this.y += dy / d * step;
      if (Math.abs(dx) > 0.6) this.dir = dx > 0 ? 1 : -1;
      this.phase += step * 0.085;
    }
  }

  // Leerlauf-Marotten
  if (this.state !== 'walk' && !this.act){
    this.fidget -= dt;
    if (this.fidgetT > 0) this.fidgetT -= dt;
    else if (this.fidget <= 0){
      this.fidgetKind = this.fidgets[Math.floor(Math.random() * this.fidgets.length)];
      /* Dauer wird mitgeschrieben. computePose() hat bisher fest durch
         1.6 geteilt, obwohl hier 1.6 bis 2.8 gesetzt wird -- solange
         fidgetT groesser als 1.6 war, wurde (1 - fidgetT/1.6) negativ
         und die Marotte lief zuerst spiegelverkehrt an. Bei der
         Gewichtsverlagerung faellt das kaum auf, bei einer
         Schreibbewegung oder einem Kopfneigen sofort. */
      this.fidgetDur = 1.5 + Math.random() * 1.1;
      this.fidgetT = this.fidgetDur;
      this.fidget = 4.5 + Math.random() * 5;
    }
  } else { this.fidgetT = 0; }

  // Gestenhuellkurve klingt ab, wenn nicht mehr gesprochen wird
  var speaking = !!this.sayLines;
  this.gest += ((speaking ? 1 : 0) - this.gest) * Math.min(1, dt * 4.5);

  computePose(this);
  blendPose(this.pose, this.tp, Math.min(1, dt * this.blend));
};

/* ------------------------------------------------------------
   Zielpose aus Zustand, Aktion, Marotte und Sprechen
   ------------------------------------------------------------ */

/* ------------------------------------------------------------
   MAROTTEN — die eigene Bewegung jeder Figur
   ------------------------------------------------------------
   Vorher teilten sich fast alle Figuren dieselbe Gewichtsverlagerung,
   und Emin, Katib und Slaven hatten ueberhaupt keine. Dabei sind
   mehrere dieser Bewegungen im Roman ausdruecklich beschrieben und
   zum Teil sogar Traeger der Handlung:

     Emin   "Wenn er zuhoert, legt er den Kopf ein Stueck zur Seite."
            Genau daran erkennt Mijo, dass eine Zahl zu klein ist.
     Katib  "Er schreibt, ohne aufzusehen. Von rechts nach links."
     Frano  "Man sah es an seinen Schultern." Seine Angst, nicht seine Worte.
     Ivan   "...und er hob dabei die Hand, weil Leute Zahlen mit den
            Haenden sagen, und die Hand zeigte auch dreizehn."
     Vater  "Er kaute auf einem Grashalm."
     Zeman  "...die Angewohnheit, vor dem Sprechen einmal auszuatmen."

   Diese Bewegungen sind damit nicht Dekoration, sondern lesbare
   Information -- der Spieler muss den Emin ansehen koennen, um das
   Raetsel des Dorfplatzes zu loesen.
   ------------------------------------------------------------ */

/* Fortschritt der laufenden Marotte, 0 -> 1. Nutzt die tatsaechlich
   gewuerfelte Dauer statt einer festen Annahme. */
/* Loest eine bestimmte Marotte sofort und sichtbar aus, statt auf den
   Zufall zu warten. Gebraucht fuer Zeichen, die Information tragen:
   das Kopfneigen des Emin und die Schreibbewegung des Katib. */
function zeigeMarotte(a, kind, dauer){
  if (!a) return;
  a.fidgetKind = kind;
  a.fidgetDur = dauer || 1.8;
  a.fidgetT = a.fidgetDur;
  a.fidget = 5 + Math.random() * 4;
}
function fidgetPhase(a){
  var dur = a.fidgetDur || 1.6;
  var u = 1 - (a.fidgetT / dur);
  return u < 0 ? 0 : (u > 1 ? 1 : u);
}

/* f = Sinus-Huellkurve (0->1->0), u = linearer Fortschritt (0->1).
   Wiederholende Bewegungen (Schreiben, Haemmern) brauchen u, einmalige
   (Kopfneigen, Ausatmen) brauchen f. */
function applyFidget(p, kind, f, u){
  switch (kind){
    // --- die vier alten, unveraendert ---
    case 'weight': p.hipShift += f * 3.4; p.headTilt += f * 2.2; p.lFknee += f * 4; break;
    case 'beard':  p.aFsw += f * 26; p.aFbend += f * 44; p.headTilt += f * 3; break;
    case 'look':   p.headTurn += f * 5; p.headTilt -= f * 2; break;
    case 'shift':  p.lean += f * 3; p.shrug += f * 3; break;

    /* Emin im Leerlauf: er hoert zu und sieht dabei zu, wie die Maenner
       DASTEHEN, waehrend sie antworten. Ruhig und unauffaellig -- sein
       Kopfneigen darf hier NICHT vorkommen, sonst waere es blosses
       Rauschen und als Zeichen wertlos. */
    case 'lauschen':
      p.headTurn += Math.sin(u * Math.PI) * 3.5; p.lean += f * 1.4; p.brow += f * 0.25; break;

    /* Emin: der Kopf geht zur Seite und bleibt dort, waehrend er den
       Katib ansieht. Bewusst gross und langsam -- das ist das Zeichen,
       auf das der Spieler achten soll. Wird nur gezielt ausgeloest. */
    case 'kopfneigen':
      p.headTilt += f * 11; p.headTurn += f * 4; p.shrug += f * 1.2; break;

    /* Katib: die Schreibhand laeuft mehrfach von rechts nach links,
       der Kopf bleibt unten. Er sieht nie auf. */
    case 'schreiben':
      var w = Math.sin(u * Math.PI * 3);
      p.aFsw += 8 + w * 11; p.aFbend += 30 + w * 6;
      p.headTilt += 4; p.headNod += 2.5; break;

    /* Frano: die Angst sitzt in den Schultern, nicht im Gesicht. */
    case 'schultern':
      p.shrug += f * 7; p.headTilt -= f * 2.5; p.lean += f * 2; p.aBbend += f * 8; break;

    /* Ivan: er hebt die Hand und zeigt eine Zahl. */
    case 'zahlzeigen':
      p.aFsw += f * 18; p.aFbend += f * 64; p.headNod += f * 2; break;

    /* Rehberger: er notiert alles, sieht kurz auf, notiert weiter. */
    case 'notieren':
      var nw = Math.sin(u * Math.PI * 2);
      p.aFsw += 6 + nw * 7; p.aFbend += 34 + nw * 8;
      p.headNod += (u < 0.5 ? 3 : -2); break;

    /* Zeman: einmal ausatmen, bevor er etwas sagt. */
    case 'ausatmen':
      p.bob -= f * 2.6; p.shrug -= f * 2.2; p.lean += f * 1.6; break;

    /* Halil: der Hammer schlaegt, die Haende kennen den Weg. */
    case 'haemmern':
      var h = Math.max(0, Math.sin(u * Math.PI * 4));
      p.aFbend += h * 46; p.aFsw += h * 9; p.lean += h * 2; break;

    /* Anđa: sie wischt die Haende an der Schuerze ab und tut etwas. */
    case 'schuerze':
      var sw = Math.sin(u * Math.PI * 2);
      p.aFsw += 9 + sw * 9; p.aBsw += 7 - sw * 7; p.aFbend += 26; p.lean += f * 2; break;

    /* Vater: er kaut auf einem Grashalm. Kleine, gleichmaessige Bewegung. */
    case 'grashalm':
      p.headNod += Math.sin(u * Math.PI * 7) * 1.8; p.headTilt += f * 1.2; break;

    /* Alessandro: er prueft den Griff, ohne es zu bemerken. */
    case 'griff':
      p.aFbend += f * 20; p.aFsw += f * 6; p.shrug += f * 1.6; break;

    /* Slaven: er rueckt die Sense auf der Schulter zurecht. */
    case 'sense':
      p.shrug += f * 5; p.aBsw += f * 9; p.aBbend += f * 12; p.headTilt += f * 2; break;

    /* Nedžad: er sieht den Raum durch, ohne den Kopf viel zu bewegen. */
    case 'scan':
      p.headTurn += Math.sin(u * Math.PI * 2) * 6; p.brow += f * 0.3; break;

    /* Hauptmann: militaerischer Rundblick, Schultern zurueck. */
    case 'strammstehen':
      p.shrug += f * 3.4; p.lean -= f * 2; p.headTurn += Math.sin(u * Math.PI * 2) * 4; break;

    /* Luka, neun Jahre: er steht nie ganz still. Ein Fuss, eine
       Schulter, der Kopf -- irgendetwas ist immer in Bewegung. */
    case 'zappeln':
      p.bob += Math.sin(u * Math.PI * 5) * 2.2;
      p.lFknee += Math.max(0, Math.sin(u * Math.PI * 4)) * 9;
      p.headTurn += Math.sin(u * Math.PI * 3) * 4; p.shrug += f * 1.4; break;

    /* Der Lehrer: er zaehlt die Koepfe, und der Finger zaehlt mit. */
    case 'zaehlen':
      p.aFsw += 14 + Math.sin(u * Math.PI * 4) * 9; p.aFbend += 54;
      p.headTurn += Math.sin(u * Math.PI * 2) * 7; break;

    /* Winken von einer Tribuene: dieselbe Bewegung, hundertmal. */
    case 'winken':
      p.aFsw += 26; p.aFbend += 72 + Math.sin(u * Math.PI * 6) * 12;
      p.headTilt += f * 2; break;

    /* Yilmaz zeigt statt zu erklaeren. Das ist die ganze Sprache,
       die die beiden im ersten Jahr gemeinsam haben. */
    case 'zeigen':
      p.aFsw += f * 30; p.aFbend += f * 22; p.lean += f * 4; p.headTurn += f * 3; break;

    /* Komsija: er redet gern und lange, auch wenn niemand fragt. */
    case 'erzaehlen':
      p.aFsw += Math.sin(u * Math.PI * 3) * 12; p.aFbend += 18; p.headNod += f * 3; break;
  }
}

function computePose(a){
  var p = a.tp, t = a.t;
  for (var i = 0; i < POSE_KEYS.length; i++) p[POSE_KEYS[i]] = 0;

  if (a.state === 'walk' && a.path){
    var ph = a.phase;
    var s = Math.sin(ph), c = Math.cos(ph);
    p.lFsw =  s * 17;  p.lBsw = -s * 17;
    // Knie beugt sich, wenn das Bein nach hinten geht und beim Anheben
    p.lFknee = Math.max(0, -s) * 13 + Math.max(0, -c) * 4;
    p.lBknee = Math.max(0,  s) * 13 + Math.max(0,  c) * 4;
    p.lFlift = Math.max(0, -s) * 5;
    p.lBlift = Math.max(0,  s) * 5;
    p.bob    = -Math.abs(Math.sin(ph)) * 3.4 + 1.7;
    p.lean   = 4.5;
    p.aFsw   = -s * 14;  p.aBsw = s * 14;
    p.aFbend = 5 + Math.max(0, -s) * 5;
    p.aBbend = 5 + Math.max(0,  s) * 5;
    p.headNod = Math.sin(ph * 2) * 0.8;
    p.hipShift = c * 1.2;
  } else if (a.sitting){
    // Sitzhaltung: ruhiger als im Stehen, Haende auf den Oberschenkeln
    p.sit = 1;
    p.bob = Math.sin(t * 1.25) * 1.1;
    p.lean = 5;
    p.aFsw = 9; p.aFbend = -4;
    p.aBsw = 7; p.aBbend = -3;
    if (a.fidgetT > 0 && a.fidgetKind){
      var us = fidgetPhase(a);
      var fs = Math.sin(us * Math.PI);
      // Im Sitzen bleiben Huefte und Beine ruhig; Arme, Schultern und
      // Kopf spielen dieselbe Marotte wie im Stehen.
      var sitzPose = { headTilt:0, headTurn:0, headNod:0, shrug:0, lean:0,
                       aFsw:0, aBsw:0, aFbend:0, aBbend:0, bob:0, brow:0,
                       hipShift:0, lFknee:0, lBknee:0 };
      applyFidget(sitzPose, a.fidgetKind, fs, us);
      p.headTilt += sitzPose.headTilt; p.headTurn += sitzPose.headTurn;
      p.headNod  += sitzPose.headNod;  p.shrug    += sitzPose.shrug;
      p.aFsw += sitzPose.aFsw; p.aBsw += sitzPose.aBsw;
      p.aFbend += sitzPose.aFbend; p.aBbend += sitzPose.aBbend;
      p.brow += sitzPose.brow;
    }
  } else {
    // Ruhiges Atmen
    // Atmung: Brustkorb hebt sich, Schultern folgen leicht verzoegert
    p.bob = Math.sin(t * 1.35) * 1.55;
    p.shrug = Math.max(0, Math.sin(t * 1.35 - 0.5)) * 1.2;
    p.aFsw = Math.sin(t * 1.35 + 0.4) * 1.5;
    p.aBsw = -Math.sin(t * 1.35 + 0.4) * 1.5;
    p.aFbend = 3; p.aBbend = 3;
    if (a.build.armsCrossed){
      // Beim Sprechen loesen sich die verschraenkten Arme wieder
      var cross = 1 - Math.min(1, a.gest * 0.85);
      p.aFsw = 13 * cross; p.aBsw = 10 * cross;
      p.aFbend = 30 * cross; p.aBbend = 27 * cross; p.shrug = 2 * cross;
    }
    // Marotten
    if (a.fidgetT > 0 && a.fidgetKind){
      var u = fidgetPhase(a);                 // 0 .. 1 .. 0
      var f = Math.sin(u * Math.PI);
      applyFidget(p, a.fidgetKind, f, u);
    }
  }

  // Sprechen ueberlagert alles: Kopfnicken plus Handgeste
  if (a.gest > 0.02){
    var g = a.gest;
    p.headNod += Math.sin(t * 6.4 + a.gestSeed) * 2.4 * g;
    p.headTilt += Math.sin(t * 2.1 + a.gestSeed) * 1.8 * g;
    p.brow = (0.5 + 0.5 * Math.sin(t * 3.1 + a.gestSeed)) * g;
    // Grundton plus Welle: die Hand ruht nie ganz, betont aber schubweise
    var env = 0.4 + 0.6 * Math.max(0, Math.sin(t * 1.5 + a.gestSeed));
    p.aFsw  += (Math.sin(t * 3.4 + a.gestSeed) * 9 + Math.sin(t * 1.9) * 5) * g * env;
    p.aFbend += (22 + Math.sin(t * 2.6) * 12) * g * env;
    p.aBsw  += Math.sin(t * 2.7 + a.gestSeed + 2.1) * 4 * g * env;
    p.lean  += Math.sin(t * 1.1 + a.gestSeed) * 1.6 * g;
  }

  // Blickrichtung zum Gegenueber
  if (a.lookAt && a.lookAt.visible){
    var rel = (a.lookAt.x - a.x) * a.dir;
    p.headTurn += Math.max(-6, Math.min(6, rel * 0.05));
  }

  // Koerperaktion ueberschreibt die Arme
  if (a.act){
    var u = a.act.t / a.act.dur;
    var e = Math.sin(Math.min(Math.PI, u * Math.PI));   // 0 -> 1 -> 0
    if (a.act.kind === 'take'){
      // Huefte sinkt, Rumpf beugt vor, Hand geht zum Boden
      p.crouch = e * 30; p.lean = e * 22;
      p.aFsw = e * 19; p.aFbend = e * -15;
      p.aBsw = e * 7;  p.aBbend = e * -6;
      p.lFknee += e * 18; p.lBknee += e * 14;
      p.lFsw += e * 7;    p.lBsw -= e * 6;
      p.headTilt = -e * 6;                 // Kopf haelt gegen, Blick bleibt am Objekt
    } else if (a.act.kind === 'reach'){
      p.aFsw = e * 24; p.aFbend = e * 22; p.lean = e * 6; p.headTilt = -e * 3;
    } else if (a.act.kind === 'push'){
      p.aFsw = e * 22; p.aBsw = e * 16; p.aFbend = e * 6; p.aBbend = e * 6; p.lean = e * 12;
    }
  }
}

/* --- Zeichnen ------------------------------------------------ */
function drawActor(a){
  if (!a.visible) return;
  // WICHTIG: die Groesse haengt an a.y, weil das System y als Tiefe liest.
  // Wer auf etwas HOCHsteigt, ist aber nicht weiter weg. Darum eine
  // separate Hoehe (a.hoehe), die nur die Zeichenposition verschiebt und
  // den Massstab unberuehrt laesst -- sonst schrumpft eine Figur, sobald
  // sie auf einen Stein klettert.
  /* R.figurSkala erlaubt einem Raum, seine Figuren insgesamt groesser
     oder kleiner zu fuehren -- noetig, sobald ein gemalter Hintergrund
     in einem anderen Massstab angelegt ist als die gerechneten. */
  var s = scaleAt(a.y) * (a.build.tall || 1) * ((typeof R !== 'undefined' && R && R.figurSkala) || 1);
  var hoehe = a.hoehe || 0;
  ctx.save();
  ctx.translate(a.x, a.y - hoehe);
  /* Figurenschatten. Frueher eine mittig unter der Figur liegende
     Ellipse -- die las sich wie ein Sockel und ignorierte, dass jeder
     Raum eine erklaerte Lichtrichtung hat. Jetzt faellt der Schatten vom
     Licht weg, wird dabei laenger und schmaler und verliert nach aussen
     an Dichte. Zusammen mit dem harten Kernschatten direkt am Fuss steht
     die Figur damit auf dem Boden, statt darueber zu schweben.
     Wer erhoeht steht (hoehe > 0), wirft einen weiter versetzten und
     schwaecheren Schatten -- der Boden ist dann weiter weg. */
  var L = currentLight();
  var shadowCol = mixHex('#0c0805', L.ambient, 0.28);
  var away = -L.dir;
  var lift = hoehe > 0 ? 1 : 0;
  // Weicher, versetzter Wurfschatten
  ctx.globalAlpha = lift ? 0.10 : 0.20;
  ell(away * 13 * s, hoehe + 1 * s, 30 * s, 6.5 * s, shadowCol, 0);
  // Kernschatten direkt unter dem Fuss
  ctx.globalAlpha = lift ? 0.13 : 0.26;
  ell(away * 3 * s, hoehe, 17 * s, 5 * s, shadowCol, 0);
  ctx.globalAlpha = 1;
  if (typeof drawActorSprite !== 'function' || !drawActorSprite(a, s)){
    ctx.scale(s * a.dir, s);
    figure(a);
  }
  ctx.restore();
}

/* ============================================================
   PIXEL-SPRITES — Thimbleweed-artiger Figurenpass
   ------------------------------------------------------------
   Die Engine bleibt prozedural, aber die sichtbare Figur wird
   nun aus bewusst groben Pixelclustern aufgebaut. Keine Kurven,
   keine geglaetteten Gelenke: Silhouette, Gesicht, Kleidung und
   Animationen werden auf ein 2px-Logikraster quantisiert.
   ============================================================ */
/* ============================================================
   SCHATTIERUNG
   ------------------------------------------------------------
   Der Unterschied zwischen einer gefuellten Flaeche und einem
   gemalten Koerper sind drei bis fuenf Toene statt einem. Ein
   Pixelzeichner setzt sie von Hand: Grundton, Schattenseite,
   Lichtkante, dazu ein tiefer Ton in den Falten. Das laesst sich
   mechanisieren, weil die Lichtrichtung im Raum bekannt ist --
   und weil ohnehin jede Flaeche dieses Spiels durch dieselben
   vier Funktionen laeuft.

   Von hier an bekommt jeder Koerper, jeder Arm, jedes Brett und
   jeder Mauerstein automatisch eine helle und eine dunkle Kante.
   Das ist der groesste einzelne Schritt weg vom Baukasten und
   hin zu einem Bild.
   ============================================================ */
var TON_CACHE = {};
function tonVon(c, art){
  var key = c + '|' + art;
  var hit = TON_CACHE[key];
  if (hit) return hit;
  var res;
  if (art === 'licht')      res = mixHex(c, '#fff2dc', 0.30);
  else if (art === 'glanz') res = mixHex(c, '#fffaf0', 0.52);
  else if (art === 'schatten') res = mixHex(c, '#2a1c14', 0.32);
  else if (art === 'tief')  res = mixHex(c, '#170f0a', 0.55);
  else res = c;
  TON_CACHE[key] = res;
  return res;
}
/* Die Weltseite, von der das Licht kommt: 1 = von rechts. */
function lichtSeite(){
  var l = (typeof currentLight === 'function') ? currentLight() : null;
  return (l && l.dir) ? l.dir : 1;
}
/* Ein plastischer Block: Grundton, Lichtkante oben und auf der
   Lichtseite, Schatten unten und auf der Gegenseite. d ist die Breite
   der Kanten und richtet sich nach der Grobheit des Stils. */
function pKoerper(x, y, w, h, fill, ohneOben){
  var d = Math.max(1, (typeof STIL !== 'undefined' && STIL.dicke) ? STIL.dicke - 1 : SPRITE_GRID);
  var dir = lichtSeite();
  x = psnap(x); y = psnap(y); w = Math.max(d*2, psnap(w)); h = Math.max(d*2, psnap(h));
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  // Schattenseite
  ctx.fillStyle = tonVon(fill, 'schatten');
  ctx.fillRect(dir > 0 ? x : x + w - d, y, d, h);
  ctx.fillRect(x, y + h - d, w, d);
  // Lichtseite
  ctx.fillStyle = tonVon(fill, 'licht');
  ctx.fillRect(dir > 0 ? x + w - d : x, y + (ohneOben ? 0 : d), d, h - d);
  if (!ohneOben) ctx.fillRect(x + d, y, w - d*2, d);
}
/* Ein Glied: rundes Rohr statt flacher Balken. Entlang der Achse
   laeuft eine Lichtkante, auf der Gegenseite ein Schatten. */
function pGlied(x1, y1, x2, y2, breite, fill){
  var dir = lichtSeite();
  var dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  var nx = -dy / len, ny = dx / len;          // Normale zur Achse
  var d = Math.max(1, Math.round(breite * 0.26));
  var seite = (nx * dir >= 0) ? 1 : -1;       // welche Normale zeigt zum Licht
  pSeg(x1, y1, x2, y2, breite, fill);
  pSeg(x1 + nx*(breite/2 - d/2)*seite, y1 + ny*(breite/2 - d/2)*seite,
       x2 + nx*(breite/2 - d/2)*seite, y2 + ny*(breite/2 - d/2)*seite,
       d, tonVon(fill, 'licht'));
  pSeg(x1 - nx*(breite/2 - d/2)*seite, y1 - ny*(breite/2 - d/2)*seite,
       x2 - nx*(breite/2 - d/2)*seite, y2 - ny*(breite/2 - d/2)*seite,
       d, tonVon(fill, 'schatten'));
}

var SPRITE_GRID = 2;   // wird von setzeStil() gesetzt
/* Ein fester, von der Koordinate abgeleiteter Mini-Versatz. Immer
   derselbe Wert fuer dieselbe Zahl, darum flimmert nichts -- die
   Kanten sind nur nicht mehr exakt, und genau das unterscheidet eine
   gemalte Flaeche von einer gebauten. */
var WOBBLE_TAB = (function(){
  var t = [], r = seeded(8123);
  for (var i = 0; i < 64; i++) t.push(r() - 0.5);
  return t;
})();
function psnap(v){
  var g = Math.round(v / SPRITE_GRID) * SPRITE_GRID;
  var w = (typeof STIL !== 'undefined') ? STIL.wobble : 0;
  if (!w || IN_UI) return g;
  return g + WOBBLE_TAB[(Math.abs(Math.round(v * 13)) % 64)] * w;
}
function pRect(x,y,w,h,c){
  ctx.fillStyle=c;
  ctx.fillRect(psnap(x),psnap(y),Math.max(SPRITE_GRID,psnap(w)),Math.max(SPRITE_GRID,psnap(h)));
}
function pOutlineRect(x,y,w,h,fill,outline){
  x=psnap(x);y=psnap(y);w=psnap(w);h=psnap(h);
  var d = (!IN_UI && typeof STIL !== 'undefined' && STIL.dicke) ? STIL.dicke : Math.max(1, SPRITE_GRID);
  ctx.fillStyle=konturFuer(fill,outline);ctx.fillRect(x,y,w,h);
  var iw = Math.max(d, w-d*2), ih = Math.max(d, h-d*2);
  if (IN_UI || iw < d*3 || ih < d*3){
    ctx.fillStyle=fill; ctx.fillRect(x+d,y+d,iw,ih);
  } else {
    pKoerper(x+d, y+d, iw, ih, fill);
  }
}
/* Rumpf mit Schulterschraege und leichter Taillierung.

   Der Oberkoerper war ein glattes Rechteck. Bei einer Figur, die sonst
   fast nur aus Silhouette besteht, ist das die teuerste Vereinfachung im
   ganzen Sprite: ohne Schultern liest sich jede Gestalt als Brett, und
   alle Figuren sehen einander aehnlicher, als sie sollten. Der Umriss
   wird deshalb aus waagerechten Baendern unterschiedlicher Breite
   aufgebaut -- schmaler an den Schultern, voll an der Brust, wieder
   etwas enger zur Taille.

   Zwei Durchgaenge, nicht Band fuer Band: erst der gesamte Umriss, dann
   die Fuellung 2px eingerueckt. Zeichnete man jedes Band einzeln mit
   eigener Kontur, liefen die Konturlinien quer durch den Koerper. */
var PTORSO_PROFIL = [0.78, 0.92, 1.0, 1.0, 0.97, 0.92];
function pTorso(x,y,w,h,fill,outline){
  var prof = PTORSO_PROFIL, n = prof.length;
  var bh = Math.max(2, psnap(h / n));
  var i, bw, bx, by;
  ctx.fillStyle = konturFuer(fill, outline);
  for (i = 0; i < n; i++){
    bw = psnap(w * prof[i]); bx = psnap(x + (w - bw) / 2); by = psnap(y + i * bh);
    ctx.fillRect(bx, by, bw, bh);
  }
  var d2 = (!IN_UI && typeof STIL !== 'undefined' && STIL.dicke) ? STIL.dicke : Math.max(1, SPRITE_GRID);
  var dir = lichtSeite();
  ctx.fillStyle = fill;
  for (i = 0; i < n; i++){
    bw = psnap(w * prof[i]); bx = psnap(x + (w - bw) / 2); by = psnap(y + i * bh);
    var oben = (i === 0) ? d2 : 0, unten = (i === n - 1) ? d2 : 0;
    ctx.fillRect(bx + d2, by + oben, Math.max(d2, bw - d2*2), Math.max(d2, bh - oben - unten));
  }
  if (IN_UI) return;
  /* Der Rumpf ist keine Platte. Licht faellt auf die Brust der
     Lichtseite, die Gegenseite liegt im Schatten, und unter der
     Schulter zieht sich der Stoff. */
  for (i = 0; i < n; i++){
    bw = psnap(w * prof[i]); bx = psnap(x + (w - bw) / 2); by = psnap(y + i * bh);
    var ib = Math.max(d2, bw - d2*2), ix = bx + d2, iy = by + ((i===0)?d2:0);
    var ih2 = Math.max(d2, bh - ((i===0)?d2:0) - ((i===n-1)?d2:0));
    ctx.fillStyle = tonVon(fill, 'schatten');
    ctx.fillRect(dir > 0 ? ix : ix + ib - d2, iy, d2, ih2);
    ctx.fillStyle = tonVon(fill, 'licht');
    ctx.fillRect(dir > 0 ? ix + ib - d2*2 : ix + d2, iy, d2, ih2);
  }
  // Zwei Falten quer, dort wo sich Stoff staut
  ctx.fillStyle = tonVon(fill, 'schatten');
  var fy1 = psnap(y + bh * 2.2), fy2 = psnap(y + bh * 4.1);
  ctx.fillRect(psnap(x + w*0.22), fy1, psnap(w*0.34), d2);
  ctx.fillRect(psnap(x + w*0.40), fy2, psnap(w*0.32), d2);
  ctx.fillStyle = tonVon(fill, 'licht');
  ctx.fillRect(psnap(x + w*0.24), psnap(y + d2), psnap(w*0.5), d2);
}
function pSeg(x1,y1,x2,y2,width,col){
  x1=psnap(x1); y1=psnap(y1); x2=psnap(x2); y2=psnap(y2);
  var dx=x2-x1,dy=y2-y1,steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/2));
  var sz=Math.max(2,psnap(width));
  ctx.fillStyle=col;
  for(var i=0;i<=steps;i++){
    var t=i/steps, x=psnap(x1+dx*t), y=psnap(y1+dy*t);
    ctx.fillRect(x-sz/2,y-sz/2,sz,sz);
  }
}
function pSegOutlined(x1,y1,x2,y2,width,col){
  var kd = (!IN_UI && typeof STIL !== 'undefined' && STIL.dicke) ? STIL.dicke*2 : Math.max(2,SPRITE_GRID*2);
  pSeg(x1,y1,x2,y2,width+kd,konturFuer(col));
  if (IN_UI || width < 7) pSeg(x1,y1,x2,y2,width,col);
  else pGlied(x1,y1,x2,y2,width,col);
}
function pixelFigure(a){
  var p=a.pal,b=a.build,q=a.pose;
  // Sitzen senkt die Huefte auf die Sitzflaeche.
  var sitDrop=psnap(q.sit*18);
  // Vorbeugen wird als horizontaler Versatz umgesetzt, nicht als Drehung:
  // eine Rotation wuerde das Pixelraster zerreissen.
  var leanX=psnap(q.lean*0.7);
  var hipY=psnap(-78+q.bob+q.crouch+sitDrop);
  var shY=psnap(-128+q.bob+q.crouch*.55+sitDrop-q.shrug);
  var headY=psnap(-151+q.bob+q.crouch*.5+sitDrop-q.shrug);
  var shift=psnap(q.hipShift);
  ctx.save(); ctx.translate(shift,0);

  // Hinteres Bein
  pixelLeg(q.lBsw-q.sit*3,q.lBknee,q.lBlift,hipY,q.sit,p.trouser,p.shoe,false,b.barfuss);
  // hinterer Arm
  pixelArm(-17+leanX,shY+7,q.aBsw,q.aBbend,p.coat,p.skin,false);

  // Koerper — klare Silhouette, mit Randlicht auf der lichtzugewandten Kante
  var topW=b.vest?38:42;
  pTorso(-topW/2+leanX,shY,topW,50,p.coat,SPRITE_INK);
  litEdge(-topW/2+leanX,shY,topW,50,-1,a.dir,p.coat);
  litEdge(-topW/2+leanX,shY,topW,50, 1,a.dir,p.coat);
  if(b.shirt){
    pRect(-6+leanX,shY+4,12,39,p.shirt);
    pRect(-4+leanX,shY+2,8,8,p.skin);
  }
  if(b.vest){
    pRect(-15+leanX,shY+5,10,41,p.vest);
    pRect(5+leanX,shY+5,10,41,p.vest);
    pRect(-2+leanX,shY+10,4,34,p.shirt);
    // kleine helle Kante wie gepixelte Naht
    if(p.trim){pRect(-13+leanX,shY+8,2,30,p.trim);pRect(11+leanX,shY+8,2,30,p.trim);}
  }
  if(b.coatLong){
    var sway=(a.state==='walk')?psnap(Math.sin(a.phase)*4):0;
    pOutlineRect(-21+leanX,hipY-31-sway,18,39,p.coat,SPRITE_INK);
    pOutlineRect(3+leanX,hipY-31+sway,18,39,p.coat,SPRITE_INK);
    litEdge(-21+leanX,hipY-31-sway,18,39,-1,a.dir,p.coat);
    litEdge(3+leanX,hipY-31+sway,18,39, 1,a.dir,p.coat);
    pRect(-18+leanX,hipY-2,36,6,p.belt||'#241a12');
  }

  // vorderes Bein
  pixelLeg(q.lFsw+q.sit*3,q.lFknee,q.lFlift,hipY,q.sit,p.trouser,p.shoe,true,b.barfuss);
  // vorderer Arm
  pixelArm(17+leanX,shY+7,q.aFsw,q.aFbend,p.coat,p.skin,true);


  // Rock ueber den Beinen: verdeckt die obere Beinpartie, laesst Unter-
  // schenkel und Fuesse fuer die Gehanimation frei. Trapezform, unten
  // breiter als an der Taille, klassische lange Rocksilhouette.
  if(b.skirt){
    var skirtCol = p.skirt || p.trouser;
    poly([-15+leanX,hipY-8, 15+leanX,hipY-8, 21+leanX,hipY+30, -21+leanX,hipY+30], skirtCol, 3);
    if(p.trim) line(-15+leanX,hipY-6,15+leanX,hipY-6,1.6,p.trim);
  }
  /* Ledernes Wams des Soeldners: kurze, feste Weste ueber dem Hemd, mit
     Schnuerung vorn und breitem Guertel. Deutlich kuerzer und haerter in
     der Silhouette als der Bauernkittel. */
  if(b.wams){
    var wCol = p.wams || p.vest;
    var wTief = p.wamsTief || p.vest;
    pTorso(-19+leanX, shY+10, 38, 46, wCol, SPRITE_INK);
    // Schulterpartie etwas dunkler abgesetzt
    pRect(-19+leanX, shY+10, 38, 9, wTief);
    // Schnuerung
    for(var wl=0; wl<4; wl++){
      line(-5+leanX, shY+20+wl*8, 5+leanX, shY+24+wl*8, 1.4, '#c9b48c');
      line(5+leanX, shY+20+wl*8, -5+leanX, shY+24+wl*8, 1.4, '#c9b48c');
    }
    // breiter Guertel
    pRect(-20+leanX, hipY-8, 40, 10, p.belt || '#2e2418');
    pRect(-4+leanX, hipY-8, 9, 10, '#8a7448');
  }
  /* K. k. Waffenrock, ohne Rangabzeichen: dunkelblau, Stehkragen,
     zwei Reihen Messingknoepfe. Ein Zivilist im Dienst traegt ihn wie
     alle anderen -- nur der Kragen bleibt leer. */
  if(b.uniform){
    var uCol = p.uniform || p.coat;
    var uTief = p.uniformTief || uCol;
    pTorso(-20+leanX, shY+8, 40, 54, uCol, '#0c0f18');
    pRect(-20+leanX, shY+8, 40, 7, uTief);
    // Stehkragen
    pOutlineRect(-11+leanX, shY+1, 22, 9, p.kragen || uTief, '#0c0f18');
    // zwei Knopfreihen
    for(var uk=0; uk<5; uk++){
      ell(-8+leanX, shY+20+uk*8, 2.2, 2.2, p.knopf || '#c9a860', 0);
      ell(8+leanX, shY+20+uk*8, 2.2, 2.2, p.knopf || '#c9a860', 0);
    }
    // Koppel
    pRect(-21+leanX, hipY-6, 42, 8, p.belt || '#1e1a14');
    ell(0+leanX, hipY-2, 4, 4, p.knopf || '#c9a860', 0);
  }
  /* Arbeitsoverall mit Latz: die Silhouette des Werks. Zwei Traeger
     ueber der Schulter, breite Brusttasche, alles eine Nummer zu gross.
     Er ist Ausgabekleidung, kein Besitz -- darum sitzt er nie. */
  if(b.overall){
    var oCol = p.overall || '#3a4a5c';
    var oTief = p.overallTief || mixHex(oCol,'#000000',0.28);
    pTorso(-20+leanX, shY+12, 40, 52, oCol, '#0d1014');
    // Latz
    pRect(-13+leanX, shY+6, 26, 12, oCol);
    pRect(-13+leanX, shY+6, 26, 2, oTief);
    // Traeger
    pRect(-15+leanX, shY-1, 5, 10, oTief);
    pRect(10+leanX, shY-1, 5, 10, oTief);
    // Brusttasche mit Stift
    pRect(-8+leanX, shY+20, 14, 11, oTief);
    pRect(-3+leanX, shY+17, 2, 8, '#d8c060');
    // Beinstoff bis zum Knie, damit der Overall unten weitergeht
    pRect(-17+leanX, hipY-4, 34, 12, oCol);
  }
  /* Sakko mit Revers: Fernsehanzug, Funktionaer, Beamter. Der Kragen ist
     das ganze Zeichen -- ohne ihn liest sich jeder Anzug als Kittel. */
  if(b.sakko){
    var sCol = p.sakko || p.coat;
    var sIn = p.hemd || '#e4e0d4';
    pTorso(-21+leanX, shY+4, 42, 54, sCol, '#0c0c10');
    pRect(-6+leanX, shY+6, 12, 40, sIn);
    // Revers als zwei schraege Keile
    poly([-13+leanX,shY+4, -2+leanX,shY+6, -7+leanX,shY+30], mixHex(sCol,'#ffffff',0.12), 0);
    poly([13+leanX,shY+4, 2+leanX,shY+6, 7+leanX,shY+30], mixHex(sCol,'#000000',0.18), 0);
    // Krawatte
    if(p.krawatte){
      pRect(-3+leanX, shY+8, 6, 5, p.krawatte);
      poly([-4+leanX,shY+13, 4+leanX,shY+13, 2+leanX,shY+40, -2+leanX,shY+40], p.krawatte, 0);
    }
  }
  /* Kittelschuerze: L. traegt sie ueber allem, immer. Sie ist keine
     Tracht, sondern Arbeitskleidung, und sie hat Taschen. */
  if(b.schuerzeKleid){
    var szCol = p.schuerze || '#8a6a5c';
    poly([-14+leanX,shY+16, 14+leanX,shY+16, 18+leanX,hipY+22, -18+leanX,hipY+22], szCol, 2.6);
    pRect(-12+leanX, hipY-6, 24, 10, mixHex(szCol,'#000000',0.22));
    pRect(-15+leanX, hipY+2, 11, 9, mixHex(szCol,'#000000',0.14));
    pRect(4+leanX, hipY+2, 11, 9, mixHex(szCol,'#000000',0.14));
  }

  // Hals
  pOutlineRect(-6+leanX,headY+14,12,14,p.skin,SPRITE_INK);
  pixelHead(leanX,headY,p,b,a,q);

  /* Was einer in der Hand traegt, sagt mehr ueber ihn als seine Kleidung.
     Karton, Koffer, Kiste -- alle drei kommen in dieser Geschichte
     mehrfach vor, und alle drei haengen an derselben Hand wie in
     pixelArm() berechnet. */
  if(b.traegt){
    var thx = psnap(17+leanX + q.aFsw*0.66 + q.aFbend*0.34);
    var thy = psnap(shY+7 + 51 - q.aFbend*0.68);
    if(b.traegt === 'koffer'){
      pOutlineRect(thx-11, thy+6, 24, 30, p.koffer || '#5a4230', SPRITE_INK);
      pRect(thx-11, thy+18, 24, 3, mixHex(p.koffer||'#5a4230','#000000',0.35));
      pRect(thx-3, thy+2, 7, 6, '#3a2c1e');
    } else if(b.traegt === 'karton'){
      pOutlineRect(thx-14, thy+4, 30, 24, '#a8875c', SPRITE_INK);
      pRect(thx-14, thy+13, 30, 3, '#8a6c46');
      pRect(thx-2, thy+4, 4, 24, '#c9b48c');
    } else if(b.traegt === 'kiste'){
      pOutlineRect(thx-15, thy+2, 32, 26, p.kiste || '#6b5335', SPRITE_INK);
      pRect(thx-15, thy+9, 32, 3, '#4a3a24');
      pRect(thx-15, thy+20, 32, 3, '#4a3a24');
      pRect(thx-4, thy+12, 8, 6, '#b8973f');
    } else if(b.traegt === 'zweig'){
      pSeg(thx, thy+4, thx-4, thy-26, 3, '#5a4a2e');
      ell(thx-6, thy-22, 9, 6, '#5d7a44', 1.4);
      ell(thx+4, thy-14, 7, 5, '#4e6b3a', 1.4);
    }
  }
  ctx.restore();
}
function pixelLeg(swing,knee,lift,hipY,sit,trouser,shoe,front,barfuss){
  sit=sit||0;
  // Beim Sitzen wandert das Knie nach vorne auf Huefthoehe,
  // der Unterschenkel steht danach senkrecht auf dem Boden.
  var kx=psnap(swing*.43+knee*.28+sit*30), ky=psnap(hipY+39-lift*.15-sit*32);
  var fx=psnap(swing*.72+knee*.08+sit*24), fy=psnap(-6-lift);
  pSegOutlined(front?6:-6,hipY,kx+(front?4:-4),ky,11,trouser);
  pSegOutlined(kx+(front?4:-4),ky,fx+(front?4:-4),fy,10,trouser);
  if (barfuss){
    // Blosser Fuss: schmaler und flacher als ein Schuh, in Hautfarbe,
    // mit angedeuteten Zehen. Der Zwoelfjaehrige geht auf der Weide ohne
    // Schuhe -- das unterscheidet ihn auf den ersten Blick vom
    // Achtzehnjaehrigen, der Weste, Guertel und Schuhe traegt.
    pOutlineRect(fx-5,fy-5,front?17:15,7,shoe,SPRITE_INK);
    pRect(fx+(front?8:-2),fy-4,4,2,'#b07c52');
    pRect(fx+(front?12:-6),fy-4,3,2,'#b07c52');
  } else {
    // Schuhspitze zeigt in Blickrichtung
    pOutlineRect(fx-7,fy-7,front?21:19,9,shoe,SPRITE_INK);
    pRect(fx+7,fy-5,6,3,'#4a3b31');
  }
}
function pixelArm(sx,sy,sw,bend,sleeve,skin,front){
  var ex=psnap(sx+sw*.42), ey=psnap(sy+28-bend*.16);
  var hx=psnap(sx+sw*.66+bend*.34), hy=psnap(sy+51-bend*.68);
  pSegOutlined(sx,sy,ex,ey,10,sleeve);
  pSegOutlined(ex,ey,hx,hy,8,sleeve);
  pOutlineRect(hx-5,hy-4,10,11,skin,SPRITE_INK);
  if(front) pRect(hx+3,hy,3,5,'rgba(255,225,190,.35)');
}
/* Ein Hut, gezeichnet ueber dem Kopf. Ursprung ist die Kopfmitte,
   genau wie bei allen anderen Kopfbedeckungen. */
function dedoHut(X, cy, art, p){
  var kontur = konturFuer('#3a2a1e');
  var oben = cy - 22;
  if (art === 'sombrero'){
    /* Nach der Vorlage: dunkelrote Krempe mit Goldstickerei in
       symmetrischen Mustern, hellere Krone, Goldband und ein
       ovales Medaillon oben. Die Krempe ist breiter als die Figur --
       das ist der ganze Witz und muss es bleiben. */
    var rot = p.hutRot || '#a8291c', hell = p.hutHell || '#c2381f',
        gold = p.hutGold || '#d8901e';
    /* Die Krempe ist dick und faellt an den Enden ab -- in der Vorlage
       ist sie kein Brett, sondern eine Scheibe mit Rand. */
    pKoerper(X - 56, oben - 4, 112, 18, rot);
    pRect(X - 62, oben + 1, 8, 11, rot); pRect(X + 54, oben + 1, 8, 11, rot);
    pRect(X - 66, oben + 5, 6, 6, mixHex(rot, '#000000', 0.2));
    pRect(X + 60, oben + 5, 6, 6, mixHex(rot, '#000000', 0.2));
    /* Stickerei: zwei Rautenmuster und Striche, links und rechts gleich */
    ctx.fillStyle = gold;
    for (var sp = 0; sp < 2; sp++){
      var vz = sp ? 1 : -1, bx = X + vz * 36;
      ctx.fillRect(psnap(bx - 3), psnap(oben + 1), 6, 2);
      ctx.fillRect(psnap(bx - 1), psnap(oben - 1), 2, 6);
      ctx.fillRect(psnap(bx + vz * 9 - 3), psnap(oben + 4), 7, 2);
      ctx.fillRect(psnap(bx - vz * 10 - 3), psnap(oben + 4), 7, 2);
    }
    for (var d2 = 0; d2 < 7; d2++){
      ctx.fillRect(psnap(X - 52 + d2*17), psnap(oben + 9), 5, 2);
    }
    /* Goldband am Krempenrand */
    ctx.fillStyle = mixHex(gold, '#000000', 0.2);
    ctx.fillRect(psnap(X - 56), psnap(oben + 12), psnap(112), 2);
    /* Krone: niedrig und breit, nicht als Ofenrohr. Im ersten Versuch
       stand sie doppelt so hoch ueber der Krempe wie in der Vorlage. */
    pKoerper(X - 26, oben - 18, 52, 20, hell);
    pKoerper(X - 22, oben - 24, 44, 8, mixHex(hell, '#000000', 0.12));
    ctx.fillStyle = gold;
    ctx.fillRect(psnap(X - 26), psnap(oben - 6), psnap(52), 4);
    /* Medaillon vorn auf der Krone */
    ell(X, oben - 15, 10, 6, gold, 0);
    ell(X, oben - 15, 4, 3, mixHex(gold, '#7a3a0e', 0.5), 0);
  } else if (art === 'weihnacht'){
    var wr = '#a8262a';
    poly([X - 20, oben + 2, X + 20, oben + 2, X + 14, oben - 34, X + 2, oben - 46], wr, 2);
    pKoerper(X - 22, oben - 2, 44, 10, '#e8e4dc');
    ell(X + 4, oben - 48, 8, 7, '#e8e4dc', 1.6);
  } else if (art === 'doktor'){
    pKoerper(X - 13, oben - 14, 26, 14, '#241f26');
    ctx.fillStyle = '#1a161c';
    ctx.fillRect(psnap(X - 34), psnap(oben - 18), psnap(68), 5);
    ctx.fillStyle = '#332d38';
    ctx.fillRect(psnap(X - 34), psnap(oben - 18), psnap(68), 2);
    pSeg(X + 30, oben - 15, X + 32, oben + 4, 2, '#d8a838');
    ell(X + 32, oben + 7, 4, 4, '#d8a838', 0);
  } else if (art === 'alu'){
    var si = '#b8bcc0';
    poly([X - 19, oben + 2, X + 19, oben + 2, X + 3, oben - 40], si, 2);
    ctx.fillStyle = mixHex(si, '#ffffff', 0.5);
    for (var k = 0; k < 5; k++)
      ctx.fillRect(psnap(X - 14 + k*3), psnap(oben - 4 - k*7), 3, 8);
    ctx.fillStyle = mixHex(si, '#000000', 0.3);
    ctx.fillRect(psnap(X + 2), psnap(oben - 26), 3, 22);
  } else if (art === 'fez'){
    pKoerper(X - 15, oben - 26, 30, 28, '#9a2622');
    pKoerper(X - 16, oben - 2, 32, 6, mixHex('#9a2622', '#000000', 0.3));
    pSeg(X + 8, oben - 26, X + 16, oben + 6, 2, '#241f1a');
    ell(X + 17, oben + 8, 3, 3, '#241f1a', 0);
  } else if (art === 'bauhelm'){
    var ge = '#d8a81e';
    pKoerper(X - 20, oben - 20, 40, 22, ge);
    pRect(X - 26, oben - 2, 52, 6, mixHex(ge, '#000000', 0.2));
    ctx.fillStyle = mixHex(ge, '#ffffff', 0.4);
    ctx.fillRect(psnap(X - 3), psnap(oben - 20), 5, 20);
  } else if (art === 'zauber'){
    var bl = '#2e2a5a';
    poly([X - 21, oben + 2, X + 21, oben + 2, X - 2, oben - 54], bl, 2);
    pKoerper(X - 24, oben - 2, 48, 8, mixHex(bl, '#000000', 0.25));
    ctx.fillStyle = '#e8d060';
    var sterne = [[-8, -14], [4, -26], [-4, -38], [6, -8]];
    for (var st = 0; st < sterne.length; st++){
      ctx.fillRect(psnap(X + sterne[st][0]), psnap(oben + sterne[st][1]), 3, 3);
      ctx.fillRect(psnap(X + sterne[st][0] - 2), psnap(oben + sterne[st][1] + 1), 7, 1);
      ctx.fillRect(psnap(X + sterne[st][0] + 1), psnap(oben + sterne[st][1] - 2), 1, 7);
    }
  } else if (art === 'stroh'){
    var so = '#d4b464';
    pKoerper(X - 50, oben - 1, 100, 10, so);
    pRect(X - 54, oben + 2, 8, 5, so); pRect(X + 46, oben + 2, 8, 5, so);
    pKoerper(X - 16, oben - 17, 32, 17, mixHex(so, '#ffffff', 0.12));
    ctx.fillStyle = '#7a6a44';
    ctx.fillRect(psnap(X - 16), psnap(oben - 6), psnap(32), 3);
    ctx.globalAlpha = 0.35;
    for (var h = 0; h < 6; h++)
      ctx.fillRect(psnap(X - 44 + h*16), psnap(oben + 1), 2, 7);
    ctx.globalAlpha = 1;
  }
}

/* ============================================================
   DER KOPF
   ------------------------------------------------------------
   Der Kopf war bisher ein Rechteck mit zwei Augen darin. Bei
   einer Figur, die sonst fast nur Silhouette ist, ist das die
   teuerste Vereinfachung im ganzen Spiel: ein Rechteck hat
   keinen Schaedel, keine Braue, keine Wange und kein Kinn, und
   deshalb hat es auch keinen Ausdruck.

   Jetzt wird der Kopf aus abgestuften Baendern gebaut -- schmal
   an der Schaedeldecke, breit an den Schlaefen, wieder schmaler
   zum Kiefer -- und mit drei Hauttoenen modelliert: Grundton,
   Schattenseite, Lichtkante. Dazu kommen die Dinge, an denen
   ein Gesicht als Gesicht gelesen wird: der Schatten unter der
   Braue, der Nasenruecken mit einer hellen Kante und einem
   Schatten daneben, die Wange, die Kinn-Hals-Grenze.

   Die Aufteilung bleibt dieselbe wie vorher (Breite 36, Hoehe 42
   um cy), damit Muetzen, Tuecher und Baerte weiter passen.
   ============================================================ */
var KOPF_PROFIL = [
  /* [halbe Breite, Hoehe] von der Schaedeldecke bis zum Kinn */
  [13, 5], [16, 5], [18, 6], [18, 7], [17, 6], [15, 6], [12, 5], [9, 4]
];
function pixelHead(cx,cy,p,b,a,q){
  var tx = psnap((q?q.headTurn:0)*.45);
  var closed = a.blink < 0;
  var hs = b.headScale || 1;
  if (hs !== 1){ ctx.save(); ctx.translate(cx,cy); ctx.scale(hs,hs); ctx.translate(-cx,-cy); }

  var dir = lichtSeite();
  var haut   = p.skin;
  var hSch   = tonVon(haut, 'schatten');
  var hTief  = tonVon(haut, 'tief');
  var hLicht = tonVon(haut, 'licht');
  var kontur = konturFuer(haut);
  var d = Math.max(1, (typeof STIL !== 'undefined' && STIL.dicke) ? STIL.dicke - 1 : SPRITE_GRID);
  var X = cx + tx, oben = cy - 22;

  /* --- Ohr auf der abgewandten Seite, zuerst, damit der Kopf
         darueber liegt und es nicht absteht --- */
  var ohrX = X + (dir > 0 ? -19 : 15);
  pOutlineRect(ohrX, cy - 4, 5, 13, hSch, kontur);

  /* --- Der Schaedel als Baenderstapel --- */
  var y = oben;
  for (var i = 0; i < KOPF_PROFIL.length; i++){
    var hb = KOPF_PROFIL[i][0], hh = KOPF_PROFIL[i][1];
    // Kontur
    ctx.fillStyle = kontur;
    ctx.fillRect(psnap(X - hb - d), psnap(y), psnap(hb*2 + d*2), psnap(hh + d));
    y += hh;
  }
  y = oben;
  for (var j = 0; j < KOPF_PROFIL.length; j++){
    var jb = KOPF_PROFIL[j][0], jh = KOPF_PROFIL[j][1];
    ctx.fillStyle = haut;
    ctx.fillRect(psnap(X - jb), psnap(y), psnap(jb*2), psnap(jh));
    // Schattenseite und Lichtkante an jedem Band
    ctx.fillStyle = hSch;
    ctx.fillRect(psnap(dir > 0 ? X - jb : X + jb - d), psnap(y), d, psnap(jh));
    ctx.fillStyle = hLicht;
    ctx.fillRect(psnap(dir > 0 ? X + jb - d*2 : X - jb + d), psnap(y), d, psnap(jh));
    y += jh;
  }
  var kinnY = y;

  /* --- Brauenschatten: die Stirn springt vor, die Augen liegen
         darunter im Dunkeln. Das macht mehr fuers Gesicht als die
         Augen selbst. --- */
  var brow = psnap((q?q.brow:0)*2);
  ctx.fillStyle = hSch;
  ctx.fillRect(psnap(X-16), psnap(cy-9-brow), psnap(32), psnap(4));

  /* --- Augen --- */
  var aoL = X-13, aoR = X+4;
  ctx.fillStyle = kontur;
  ctx.fillRect(psnap(aoL), psnap(cy-8-brow), psnap(10), psnap(3));
  ctx.fillRect(psnap(aoR), psnap(cy-8-brow), psnap(10), psnap(3));
  if (closed){
    ctx.fillStyle = kontur;
    ctx.fillRect(psnap(aoL+1), psnap(cy-1), psnap(8), psnap(2));
    ctx.fillRect(psnap(aoR+1), psnap(cy-1), psnap(8), psnap(2));
  } else {
    ctx.fillStyle = '#efe9dc';
    ctx.fillRect(psnap(aoL+1), psnap(cy-3), psnap(8), psnap(6));
    ctx.fillRect(psnap(aoR+1), psnap(cy-3), psnap(8), psnap(6));
    // Lidschatten oben im Augapfel
    ctx.fillStyle = mixHex('#efe9dc', hSch, 0.45);
    ctx.fillRect(psnap(aoL+1), psnap(cy-3), psnap(8), d);
    ctx.fillRect(psnap(aoR+1), psnap(cy-3), psnap(8), d);
    var iris = p.augen || '#3a2a1c';
    ctx.fillStyle = iris;
    ctx.fillRect(psnap(aoL+4), psnap(cy-1), psnap(3), psnap(4));
    ctx.fillRect(psnap(aoR+4), psnap(cy-1), psnap(3), psnap(4));
  }

  /* --- Nase: ein Ruecken mit heller Kante und einem Schatten
         daneben, dazu ein Nasenloch. Zwei Toene genuegen, wenn sie
         richtig herum liegen. --- */
  var nX = X + (dir > 0 ? 0 : -2);
  ctx.fillStyle = hSch;
  ctx.fillRect(psnap(nX - (dir>0?2:0)), psnap(cy+1), psnap(5), psnap(9));
  ctx.fillStyle = hLicht;
  ctx.fillRect(psnap(nX + (dir>0?2:-2)), psnap(cy+1), d, psnap(8));
  ctx.fillStyle = hTief;
  ctx.fillRect(psnap(nX + (dir>0?-2:3)), psnap(cy+9), psnap(2), psnap(2));
  // Schatten, den die Nase auf die Wange wirft
  ctx.fillStyle = hSch;
  ctx.fillRect(psnap(nX + (dir>0?-5:5)), psnap(cy+5), psnap(3), psnap(5));

  /* --- Wange auf der Lichtseite --- */
  ctx.fillStyle = hLicht;
  ctx.fillRect(psnap(dir > 0 ? X+7 : X-13), psnap(cy+3), psnap(6), psnap(5));

  /* --- Mund. Drei Zustaende wie bisher, aber mit Unterlippe und
         dem Schatten darunter, sonst ist es ein Strich. --- */
  var talk = a.talkT > 0;
  var mf = talk ? (Math.floor(a.t*9)%3) : 0;
  var mY = cy + 15;
  ctx.fillStyle = '#3f1d18';
  if (mf === 1) ctx.fillRect(psnap(X-5), psnap(mY), psnap(12), psnap(5));
  else if (mf === 2){
    ctx.fillRect(psnap(X-7), psnap(mY), psnap(15), psnap(3));
    ctx.fillStyle = mixHex(haut, '#c26a58', 0.5);
    ctx.fillRect(psnap(X-3), psnap(mY+3), psnap(8), psnap(3));
  } else ctx.fillRect(psnap(X-6), psnap(mY), psnap(13), psnap(2));
  ctx.fillStyle = hLicht;
  ctx.fillRect(psnap(X-4), psnap(mY+4), psnap(9), d);
  ctx.fillStyle = hSch;
  ctx.fillRect(psnap(X-5), psnap(mY+6), psnap(11), d);

  /* --- Kinn-Hals-Grenze: ohne sie schwebt der Kopf --- */
  ctx.fillStyle = hTief;
  ctx.fillRect(psnap(X-9), psnap(kinnY-d), psnap(18), d);

  /* --- Haar. Es liegt auf dem Schaedel, folgt seiner Form und hat
         eine Lichtkante -- eine glatte Kappe sieht aus wie ein Helm. --- */
  var haar = p.hair, haarL = tonVon(haar, 'licht'), haarS = tonVon(haar, 'schatten');
  if (!b.glatze){
    ctx.fillStyle = haarS;
    ctx.fillRect(psnap(X-19), psnap(oben-3), psnap(38), psnap(11));
    ctx.fillStyle = haar;
    ctx.fillRect(psnap(X-18), psnap(oben-2), psnap(36), psnap(9));
    ctx.fillRect(psnap(X-20), psnap(oben+5), psnap(7), psnap(13));
    ctx.fillRect(psnap(X+13), psnap(oben+5), psnap(7), psnap(11));
    ctx.fillStyle = haarL;
    ctx.fillRect(psnap(dir>0 ? X+2 : X-14), psnap(oben-1), psnap(12), psnap(3));
  } else {
    /* Glatze: der Schaedel bekommt oben einen Glanz, seitlich bleibt
       ein Haarkranz stehen. */
    ctx.fillStyle = tonVon(haut, 'glanz');
    ctx.fillRect(psnap(dir>0 ? X+1 : X-11), psnap(oben+1), psnap(10), psnap(4));
    ctx.fillStyle = haar;
    ctx.fillRect(psnap(X-20), psnap(cy-13), psnap(8), psnap(14));
    ctx.fillRect(psnap(X+12), psnap(cy-13), psnap(8), psnap(12));
    ctx.fillStyle = haarL;
    ctx.fillRect(psnap(X-20), psnap(cy-13), psnap(8), psnap(3));
  }
  if (b.ponytail){
    ctx.fillStyle = haar;
    ctx.fillRect(psnap(X-24), psnap(cy-7), psnap(8), psnap(26));
    ctx.fillRect(psnap(X-29), psnap(cy+8), psnap(8), psnap(18));
    ctx.fillRect(psnap(X-27), psnap(cy+22), psnap(6), psnap(10));
  }
  // Kopftuch (Marama): deckt das Haar vollstaendig ab, faellt seitlich
  // bis zu den Schultern. Wichtigster Silhouetten-Unterschied zwischen
  // den Figuren -- ohne ihn liest sich jede Figur maennlich, egal welche
  // Hautfarbe die Palette traegt.
  if(b.headscarf){
    var scarfCol = p.scarf || p.trim || '#6b4a3a';
    pOutlineRect(cx-19+tx,cy-25,38,17,scarfCol,SPRITE_INK);
    pOutlineRect(cx-22+tx,cy-12,11,28,scarfCol,SPRITE_INK);
    pOutlineRect(cx+11+tx,cy-12,11,26,scarfCol,SPRITE_INK);
    line(cx-18+tx,cy-16,cx+17+tx,cy-16,1.4,'rgba(0,0,0,0.25)');
  }
  /* Weisse Matrosenmuetze der JNA-Marine. Flacher Teller mit schmalem
     Band -- das Erkennungszeichen des ganzen dritten Kapitels, und es
     muss auch bei 960x600 auf den ersten Blick lesen. */
  if(b.marinemuetze){
    pOutlineRect(cx-19+tx, cy-30, 38, 11, '#eef0ee', SPRITE_INK);
    pRect(cx-19+tx, cy-21, 38, 5, p.muetzenband || '#1c2a3e');
    pRect(cx-21+tx, cy-25, 4, 5, '#e2e4e2');
    pRect(cx+17+tx, cy-25, 4, 5, '#e2e4e2');
    // Ankerknopf vorn
    pRect(cx-2+tx, cy-20, 5, 3, '#c9a860');
  }
  /* Schirmmuetze: Offizier, Werkmeister, Zollbeamter. Ein Teller, ein
     Band, ein Schirm, der nach vorn steht. */
  if(b.schirmmuetze){
    var smC = p.muetze || '#26303f';
    pOutlineRect(cx-20+tx, cy-32, 40, 13, smC, SPRITE_INK);
    pRect(cx-20+tx, cy-21, 40, 6, mixHex(smC,'#000000',0.35));
    // Schirm nach vorn
    pOutlineRect(cx+4+tx, cy-17, 22, 5, '#14161c', SPRITE_INK);
    if(p.kokarde){ pRect(cx-3+tx, cy-30, 7, 7, p.kokarde); pRect(cx-1+tx, cy-28, 3, 3, '#8a1e18'); }
  }
  /* Schiebermuetze / Ballonmuetze: der Zivilist auf dem Dorf, in Mostar,
     auf der Baustelle. Weich, ohne Schirmband, vorn ueberhaengend. */
  if(b.muetze){
    var mzC = p.muetze || '#4a4438';
    pOutlineRect(cx-19+tx, cy-30, 38, 12, mzC, SPRITE_INK);
    pRect(cx-19+tx, cy-24, 38, 4, mixHex(mzC,'#000000',0.25));
    pOutlineRect(cx+6+tx, cy-21, 18, 4, mixHex(mzC,'#000000',0.4), SPRITE_INK);
  }
  /* ------------------------------------------------------------
     DEDOS HÜTE
     ------------------------------------------------------------
     In jedem Kapitel traegt Dedo einen anderen, voellig unpassenden
     Hut. Niemand erwaehnt das zuerst -- erst wenn der Spieler ihn
     darauf anspricht, gibt es einen Dialog, und jeder Hut hat seine
     eigene Geschichte.

     Damit das funktioniert, muss der Hut ein austauschbares Teil
     sein und nicht Bestandteil der Figur: b.hut traegt nur den
     Namen, gezeichnet wird hier. So kostet ein neuer Hut vier
     Zeilen und keinen neuen Sprite.
     ------------------------------------------------------------ */
  if (b.hut) dedoHut(cx + tx, cy, b.hut, p);

  /* Kopftuch, hinten geknotet: die Dorffrauen und Baba Roga. Anders als
     die Marama deckt es die Stirn mit und laesst das Gesicht klein. */
  if(b.tuch){
    var tuC = p.tuch || '#6b4a3a';
    pOutlineRect(cx-19+tx, cy-26, 38, 15, tuC, SPRITE_INK);
    pOutlineRect(cx-21+tx, cy-13, 10, 24, tuC, SPRITE_INK);
    pOutlineRect(cx+11+tx, cy-13, 10, 22, tuC, SPRITE_INK);
    pRect(cx-16+tx, cy-14, 32, 3, mixHex(tuC,'#000000',0.3));
  }
  /* Brille: zwei Rahmen und ein Steg. Wenige Pixel, aber sie machen aus
     einem Gesicht sofort einen, der liest. Wird nach den Augen noch
     einmal ueberzeichnet, damit die Glaeser davorliegen. */
  if(b.grey){
    pRect(cx-15+tx,cy-20,4,9,'#d8d1c6');
    pRect(cx+10+tx,cy-18,4,10,'#d8d1c6');
    pRect(cx-2+tx,cy-22,3,6,'#c8c1b6');
  }

  // Brauen / Augen — wenige Pixel, dadurch lesbarer auf Handy
  var brow=psnap((q?q.brow:0)*2);
  pRect(cx-12+tx,cy-8-brow,9,3,SPRITE_INK);
  pRect(cx+4+tx,cy-8-brow,9,3,SPRITE_INK);
  if(closed){
    pRect(cx-11+tx,cy-1,8,2,SPRITE_INK);
    pRect(cx+4+tx,cy-1,8,2,SPRITE_INK);
  }else{
    pRect(cx-11+tx,cy-2,8,7,'#eee7da');
    pRect(cx+4+tx,cy-2,8,7,'#eee7da');
    pRect(cx-6+tx,cy,3,4,'#17110d');
    pRect(cx+8+tx,cy,3,4,'#17110d');
  }
  if(b.brille){
    /* Die Vorlage zeigt eine sehr breite Brille mit violett getoenten
       Glaesern -- sie nimmt fast das ganze Gesicht ein und ist das
       Erkennungszeichen der Figur. Ein dunkler Rahmen allein reichte
       dafuer nicht: die Toenung ist der Punkt. */
    var brC = p.brille || '#2a2620';
    var glas = p.brilleGlas || null;
    var breit = b.brilleBreit ? 3 : 0;
    var lx = cx-14-breit+tx, rx = cx+3+tx, gw = 12+breit;
    if (glas){
      pRect(lx+1, cy-3, gw, 8, glas);
      pRect(rx+1, cy-3, gw, 8, glas);
      ctx.globalAlpha=0.5;
      pRect(lx+1, cy-3, gw, 2, mixHex(glas,'#ffffff',0.45));
      pRect(rx+1, cy-3, gw, 2, mixHex(glas,'#ffffff',0.45));
      ctx.globalAlpha=1;
    }
    pRect(lx, cy-4, gw+2, 2, brC); pRect(lx, cy+5, gw+2, 2, brC);
    pRect(lx, cy-4, 2, 11, brC);   pRect(lx+gw, cy-4, 2, 11, brC);
    pRect(rx, cy-4, gw+2, 2, brC); pRect(rx, cy+5, gw+2, 2, brC);
    pRect(rx, cy-4, 2, 11, brC);   pRect(rx+gw, cy-4, 2, 11, brC);
    pRect(cx-2+tx, cy-2, 5, 2, brC);
    pRect(lx-3, cy-3, 3, 2, brC); pRect(rx+gw+2, cy-3, 3, 2, brC);
    if (!glas){
      ctx.globalAlpha=0.22;
      pRect(lx+2, cy-2, 4, 4, '#dff0ff'); pRect(rx+2, cy-2, 4, 4, '#dff0ff');
      ctx.globalAlpha=1;
    }
  }
  // Nase
  pRect(cx+1+tx,cy+3,4,8,'#a66f53'); pRect(cx+4+tx,cy+9,5,3,'#8b5945');

  // Bartschatten von wenigen Tagen: nur Kinnlinie und Wangenansatz,
  // gepixelt mit Luecken, damit es nicht wie ein Vollbart wirkt.
  if(b.stubble){
    var sc=p.beard||p.hair;
    ctx.globalAlpha=0.72;
    pRect(cx-13+tx,cy+14,26,7,sc);
    pRect(cx-9+tx,cy+20,18,4,sc);
    pRect(cx-15+tx,cy+9,5,7,sc);
    pRect(cx+10+tx,cy+9,5,7,sc);
    ctx.globalAlpha=0.5;
    pRect(cx-11+tx,cy+10,9,3,sc);
    pRect(cx+2+tx,cy+10,9,3,sc);
    ctx.globalAlpha=1;
  }
  // Vollbart bleibt fuer andere Figuren verfuegbar
  if(b.beard){
    var bc=p.beard||p.hair;
    pRect(cx-16+tx,cy+8,6,12,bc); pRect(cx+11+tx,cy+8,6,12,bc);
    pRect(cx-12+tx,cy+14,25,12,bc); pRect(cx-8+tx,cy+23,17,6,bc);
    if(b.grey){
      pRect(cx-10+tx,cy+17,3,8,'#aaa397');pRect(cx+5+tx,cy+16,3,9,'#c4bdb2');
      pRect(cx-2+tx,cy+21,3,7,'#8f897f');
    }
  }
  if(b.moustache||(b.beard&&!b.stubble)){
    pRect(cx-11+tx,cy+10,10,4,p.mous||p.beard||p.hair);
    pRect(cx+1+tx,cy+10,11,4,p.mous||p.beard||p.hair);
  }

  // Stirn-/Alterslinien
  if(b.lines){pRect(cx-11+tx,cy-13,7,2,'#9b6c52');pRect(cx+5+tx,cy-13,7,2,'#9b6c52');}
  if (hs !== 1){ ctx.restore(); }
}
function figure(a){ pixelFigure(a); }
