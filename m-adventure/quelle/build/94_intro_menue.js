
/* ============================================================
   Sektion 29  VORSPANN
   ------------------------------------------------------------
   Der Vorspann lief frueher als eigener Zustand mit drei
   Standbildern. Er ist jetzt eine gewoehnliche Zwischensequenz
   (siehe Sektion 36) und benutzt damit dieselbe Letterbox,
   dieselbe Ueberblendung, dieselben Fortschrittspunkte und
   dasselbe Ueberspringen wie die drei Brueche im Spiel. Ein
   Vorspann, der anders bedient wird als der Rest, ist eine
   unnoetige zweite Regel.
   ============================================================ */
/* Der Vorspann laeuft jetzt vor dem Hauptmenue, nicht mehr dahinter.
   Damit ist er das erste, was man sieht -- so wie bei den Spielen, an
   denen sich dieses hier orientiert: erst das Zeichen des Hauses, dann
   die Geschichte, und erst danach die Frage, was man tun moechte.
   Beides bleibt trennbar: starteVorspann() ist der Film, beginneProlog()
   die erste Szene. "Neues Spiel" springt direkt in die Szene, weil den
   Film in dem Moment schon jeder gesehen hat. Klick geht weiter,
   Escape ueberspringt -- wie bei jeder anderen Zwischensequenz auch. */
function starteVorspann(danach){ starteCine(CINES.vorspann, danach); }

function beginneProlog(){
    setPlayerIdentity('mAlt');
    PL.sitting = false;
    bindRoom('terrasse', ROOM_TERRASSE.entry, true);
    G.fade = 1; G.fadeTo = 0; G.fadeRate = 0.7;
    play([
      { wait:1.4 },
      { say:[PL, 'Halb sechs. Die Sonne steht schon über Pelješac.'] },
      { wait:0.9 },
      { say:[PL, 'Die Enkel sind seit Dienstag da. Das Haus ist voll und ich sitze draußen.'] },
      { wait:1.0 },
      { say:[NARR, 'So fängt jeder Nachmittag an, seit vierzehn Jahren. An diesem hier ist etwas anders, und ich weiß es noch nicht.'] }
    ]);
}

/* ============================================================
   Sektion 30  HAUPTMENUE
   ============================================================ */
/* ------------------------------------------------------------
   ZWEI EBENEN
   ------------------------------------------------------------
   Vorher standen neun Zeilen untereinander -- zwei, mit denen man
   anfaengt, und sieben Kapitelspruenge, die man beim ersten Mal gar
   nicht braucht. Dazu vier Stilknoepfe, drei Sprachknoepfe und eine
   Hinweiszeile: sechzehn Dinge zum Anklicken, jedes in einem eigenen
   Kasten. Das Bild dahinter kam nicht mehr durch.

   Jetzt liegt oben nur, womit man wirklich anfaengt. Die Kapitel
   sind einen Schritt entfernt -- wer sie sucht, findet sie, und wer
   das Spiel zum ersten Mal oeffnet, sieht drei Zeilen und das Meer.
   ------------------------------------------------------------ */
var KAP_NAMEN = ['Rosko Polje · 1953','Mostar · 1955','Die Marine · 1960er',
                 'Sarajevo · 1970er','Das Werk · 1970er','Vier Markstücke · 1991',
                 'Der Hausbau · 2004'];
function menuItems(){
  if (G.menu && G.menu.ebene === 'kapitel'){
    var kap = [];
    for (var i = 1; i <= 7; i++){
      (function(nr){
        kap.push({ id:'kap'+nr, label:KAP_NAMEN[nr-1], action:function(){ menuStartKapitel(nr); } });
      })(i);
    }
    kap.push({ id:'zurueck', label:'Zurück', action:function(){ menuEbene('haupt'); } });
    return kap;
  }
  var items = [ { id:'neu', label:'Neues Spiel', action:menuStartNewGame } ];
  if (hasSave()) items.push({ id:'fortsetzen', label:'Fortsetzen', action:menuContinue });
  items.push({ id:'kapitel', label:'Kapitel wählen', action:function(){ menuEbene('kapitel'); } });
  return items;
}
/* rt ist die Zeit der Zeilen, t die des ganzen Menues. Getrennt, damit
   beim Ebenenwechsel die Zeilen neu hereinlaufen, Titel und Fusszeile
   aber stehen bleiben -- sonst blitzt bei jedem Klick das ganze Menue
   noch einmal auf. Der Startwert schiebt die Zeilen hinter den Titel. */
function openMainMenu(){ G.menu = { active:true, sel:0, t:0, rt:-1.35, ebene:'haupt' }; }
function menuEbene(e){
  G.menu.ebene = e; G.menu.sel = 0; G.menu.rt = 0;
  uiSound('confirm');
}
function zurueckInsHauptmenue(){
  saveGame(true);
  MUSIK.setModus(null);
  G.seq=null; G.wait=0; G.dlg=null; G.dlgPartner=null; G.dlgSnapshot=null;
  G.cine=null; G.chapterCard=null;
  G.selItem=null; G.over=false; G.endCard=0;
  G.fade=0; G.fadeTo=0; G.roomChanging=null;
  ACTORS.forEach(function(a){ a.sayLines = null; });
  uiSound('confirm');
  openMainMenu();
}
function menuResetState(){
  Object.keys(FLAG).forEach(function(k){ delete FLAG[k]; });
  G.gesehen = {}; G.unschaerfe = {};
  G.seq=null; G.dlg=null; G.dlgPartner=null; G.over=false; G.endCard=0;
  G.fade=0; G.fadeTo=0; G.roomChanging=null;
  INV.items = [];
  radioAn = false;
  WORLD = { rooms:{} };
}
function menuStartNewGame(){
  G.menu = null; menuResetState();
  beginneProlog();
}
function menuContinue(){ if (loadGame(true)){ G.menu = null; flashNote('Spielstand geladen'); } }
function menuStartKapitel(nr){
  G.menu = null; menuResetState();
  /* Kapitelanwahl: alles davor gilt als erlebt, damit der Rahmen
     stimmig ist und die Terrasse die richtigen Andenken zeigt. */
  setFlag('prologVorbei', true); setFlag('planeWeg', true); setFlag('kisteAufTerrasse', true);
  setFlag('lukaGefragt', true);
  for (var i = 1; i < nr; i++) setFlag('kap' + i + 'Fertig', true);
  starteKapitel(nr);
}
function updateMenu(dt){
  if (IN.tap){
    var t = IN.tap; IN.tap = null;
    var sp = menuSprachHitTest(t.x, t.y);
    if (sp){ setzeSprache(sp); uiSound('confirm'); return; }
    var st = menuStilHitTest(t.x, t.y);
    if (st){ setzeStil(st); uiSound('confirm'); return; }
    var hit = menuHitTest(t.x, t.y);
    if (hit !== null){ G.menu.sel = hit; menuItems()[hit].action(); return; }
    return;
  }
  G.menu.t += dt; G.menu.rt += dt;
}
var STIL_ORDER = ['pixel','gouache','tusche','riso'];
function stilRect(i){
  var bw = 108, luecke = 10;
  var ges = STIL_ORDER.length * bw + (STIL_ORDER.length - 1) * luecke;
  return { x: Math.round(LW/2 - ges/2 + i * (bw + luecke)), y: LH - 100, w: bw, h: 28 };
}
/* Zeichnen und Treffer holen ihre Masse aus derselben Funktion. Vorher
   standen sie doppelt im Code, mit leicht verschiedenen Zahlen -- der
   anklickbare Bereich lag um ein paar Punkte neben dem, was man sah. */
function menuZeile(i, anzahl){
  /* Acht Zeilen ruecken enger zusammen und fangen tiefer an: bei 36
     Punkten Abstand und einem Anfang auf halber Hoehe minus 118 lag
     die erste Zeile genau auf der Grundlinie der Ueberschrift. */
  var viele = anzahl > 5;
  var sp = viele ? 34 : 48;
  var top = LH/2 - (viele ? 96 : 62);
  return { x: LW/2 - 190, y: top + i * sp - 16, w: 380, h: 32 };
}
function menuHitTest(px, py){
  var n = menuItems().length;
  for (var i = 0; i < n; i++){
    var r = menuZeile(i, n);
    if (px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h) return i;
  }
  return null;
}
function menuStilHitTest(px, py){
  for (var i = 0; i < STIL_ORDER.length; i++){
    var r = stilRect(i);
    if (px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h) return STIL_ORDER[i];
  }
  return null;
}
var SPR_ORDER = ['de','hr','en'];
function sprachRect(i){ return { x: LW/2 - 95 + i*64, y: LH - 60, w: 58, h: 24 }; }
function menuSprachHitTest(px, py){
  for (var i = 0; i < SPR_ORDER.length; i++){
    var r = sprachRect(i);
    if (px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h) return SPR_ORDER[i];
  }
  return null;
}
/* ------------------------------------------------------------
   DAS HAUPTMENUE
   ------------------------------------------------------------
   Ein Menue ist der erste Eindruck und meistens der lieblosetste
   Bildschirm eines Spiels: ein Verlauf, ein Titel, eine Liste.
   Hier ist es stattdessen die Szene, um die es geht -- die
   Terrasse am Abend, das Meer, die Mauer, die Katze --, und die
   Liste liegt darin.

   Alles bewegt sich langsam und nichts fordert Aufmerksamkeit:
   das Wasser, das Licht auf dem Wasser, die Blaetter der Feige,
   ein Ohr der Katze. Der Bildaufbau laeuft durch denselben
   groben Puffer wie das Spiel, die Schrift darueber in voller
   Aufloesung.
   ------------------------------------------------------------ */
function menuHintergrund(t){
  /* Abendhimmel */
  bandV(0, 0, LW, 300, [[0,'#243a52'],[0.35,'#7a6a72'],[0.72,'#e0996a'],[1,'#f2c894']], 9);
  /* Ein paar Wolkenbaender, die kaum wandern */
  var rr = seeded(1942);
  for (var w = 0; w < 9; w++){
    var wy = 60 + rr() * 150;
    var wx = ((rr() * LW) + t * (3 + w * 0.6)) % (LW + 300) - 150;
    var ww = 110 + rr() * 220;
    ctx.globalAlpha = 0.10 + rr() * 0.10;
    ctx.fillStyle = w % 2 ? '#ffd8a8' : '#6a5a6e';
    ctx.fillRect(psnap(wx), psnap(wy), psnap(ww), psnap(5 + rr() * 7));
  }
  ctx.globalAlpha = 1;
  /* Halbinsel */
  ctx.globalAlpha = 0.5;
  poly([0,296, 220,278, 470,290, 720,272, LW,286, LW,310, 0,310], '#4a4a56', 0);
  ctx.globalAlpha = 1;
  /* Meer */
  bandV(0, 300, LW, 130, [[0,'#2e5468'],[0.5,'#27485c'],[1,'#213c4e']], 6);
  /* Sonnenstrasse, kurz unter der Sonne */
  for (var g = 0; g < 15; g++){
    var tief = g / 14;
    var gy = 304 + g * 5;
    var gw = (20 + tief * 70) * (0.5 + Math.abs(Math.sin(t * 0.8 + g * 0.5)) * 0.85);
    ctx.globalAlpha = (0.26 - tief * 0.14) + Math.abs(Math.sin(t * 0.6 + g)) * 0.12;
    ctx.fillStyle = '#ffcf90';
    ctx.fillRect(psnap(690 - gw / 2), psnap(gy), psnap(gw), 3);
  }
  ctx.globalAlpha = 1;
  /* Die Bruestung der Terrasse, ganz vorn */
  trockenmauer(0, 386, LW, 46, 12, '#c9bda0', '#7d7462');
  pRect(0, psnap(382), LW, 6, '#dcd0b2');
  bandV(0, 430, LW, 170, [[0,'#8a7d64'],[0.5,'#6f6553'],[1,'#544c3f']], 6);
  ctx.globalAlpha = 0.30;
  for (var f = 0; f < 40; f++)
    pRect(rr() * LW, 436 + rr() * 150, 10 + rr() * 22, 4, rr() > 0.5 ? '#a2977c' : '#463f34');
  ctx.globalAlpha = 1;
  /* Zwei Blumentoepfe auf der Mauer */
  for (var b = 0; b < 2; b++){
    var bx = b ? LW - 92 : 74;
    poly([bx-15, 386, bx+15, 386, bx+11, 356, bx-11, 356], '#a8583a', 2);
    for (var bl = 0; bl < 5; bl++)
      ell(bx - 12 + (bl % 3) * 12, 352 - Math.floor(bl / 3) * 8, 8, 6, bl % 2 ? '#9a2f38' : '#46603a', 1.2);
  }
  /* Die Feige greift von rechts ins Bild */
  feigenbaum(LW - 34, 470, 1.25, t);
  /* Und die Katze sitzt auf der Mauer, wo sie immer sitzt */
  katze(150, 384, t, null, false);
  pixelGlow(690, 268, 300, 200, '#ffbe78', 0.26, 5);
  pixelVignette();
}

/* Der Schleier laeuft ueber die ganze Breite und nur nach oben und
   unten aus. Ein Schleier mit seitlicher Kante bekommt eine Form, und
   sobald er eine Form hat, liegt ein Gegenstand im Bild statt einer
   Abdunklung -- der erste Versuch sah aus wie ein Fass hinter dem
   Menue. Ueber die volle Breite gibt es keine Silhouette, die
   auffallen koennte. */
function weicherSchleier(oben, unten, deckung){
  var stufen = 30, h = unten - oben;
  ctx.save();
  ctx.fillStyle = '#0a0806';
  for (var i = 0; i < stufen; i++){
    var f = (i + 0.5) / stufen;
    ctx.globalAlpha = deckung * Math.pow(Math.sin(f * Math.PI), 0.55);
    ctx.fillRect(0, psnap(oben + h * f), LW, Math.ceil(h / stufen) + 1);
  }
  ctx.restore();
}

function drawMainMenu(){
  var cx = LW / 2, cy = LH / 2, mt = G.menu.t, rt = G.menu.rt;
  gepixelt(function(){ menuHintergrund(mt); }, LH);

  var items = menuItems();
  var kapitelEbene = G.menu.ebene === 'kapitel';

  /* Ein dunkler Schleier hinter der Spalte. Er muss nach allen vier
     Seiten auslaufen -- ein Rechteck mit harten Kanten liegt wie ein
     Kasten im Bild und macht aus der Szene eine Tapete dahinter. */
  /* Das untere Ende liegt hinter dem Bildrand. Der Schleier laeuft zu
     beiden Seiten weich aus -- endete er bei der letzten Zeile, saessen
     Stil- und Sprachwahl darunter auf hellem Stein und waeren nicht
     mehr zu lesen. Vorher trug sie jeweils ein eigener Kasten; ohne
     die Kaesten muss der Schleier das uebernehmen. */
  weicherSchleier(cy - 232, LH + 150, 0.66);

  /* Der Titel: dasselbe gezeichnete Zeichen wie im Vorspann. Er baut
     sich beim Oeffnen einmal auf und bleibt dann stehen. */
  var aM = Math.max(0, Math.min(1, (mt - 0.15) / 0.9));
  var aP = Math.max(0, Math.min(1, (mt - 0.95) / 0.4));
  titelZeichnen(cx + 3, cy - 183, 0.52, aM * 0.32, aP * 0.32, '#140e06');
  titelZeichnen(cx, cy - 186, 0.52, aM, aP, '#f0dfb4');

  /* Auf der Kapitelebene weicht der Untertitel der Ueberschrift: zwei
     Zeilen Kleingedrucktes uebereinander sind eine zu viel. */
  var aU = Math.max(0, Math.min(1, (mt - 1.3) / 0.9));
  ctx.globalAlpha = aU;
  txt(ue(kapitelEbene ? 'Kapitel wählen' : 'Erinnerungen zwischen den Zeiten'),
      cx, cy - 134 - (1 - aU) * 4, 20, '#c8b287', 'center', 'italic ');
  ctx.globalAlpha = 1;

  /* Die Zeilen stehen frei. Vorher hatte jede einen gefuellten Kasten
     mit Rahmen -- neun Rechtecke uebereinander, und davor noch die
     Knoepfe unten. Das Bild dahinter war nur noch Hintergrund.

     Jetzt markiert die Auswahl statt eines Kastens ein Winkel links
     und ein Strich darunter. Das reicht: die Zeile, auf der man steht,
     ist heller als die anderen, und mehr muss ein Menue nicht sagen. */
  for (var i = 0; i < items.length; i++){
    var ein = Math.max(0, Math.min(1, (rt - i * 0.07) / 0.45));
    if (ein <= 0) continue;
    var r = menuZeile(i, items.length);
    var on = i === G.menu.sel;
    var ueber = IN.x > r.x && IN.x < r.x + r.w && IN.y > r.y && IN.y < r.y + r.h;
    var zurueck = items[i].id === 'zurueck';
    ctx.save();
    ctx.globalAlpha = ein;
    ctx.translate((1 - ein) * -16 + ((on || ueber) ? 5 : 0), 0);
    if (on){
      poly([cx - 152, r.y + 9, cx - 143, r.y + 15, cx - 152, r.y + 21], '#e8b45c', 0);
      ctx.globalAlpha = ein * 0.42;
      pRect(cx - 88, r.y + 27, 176, 1, '#e8b45c');
      ctx.globalAlpha = ein;
    }
    txt(ue(items[i].label), cx, r.y + 22, zurueck ? 18 : 21,
        on ? '#fff2d8' : (ueber ? '#e4d7b6' : (zurueck ? '#9a8c70' : '#b8aa88')),
        'center', 'bold ');
    ctx.restore();
  }

  /* Stil und Sprache: dieselben Schalter, nur ohne Kasten und Rahmen.
     Der aktive traegt einen kurzen Strich unter sich -- dieselbe
     Marke wie oben, damit das Menue eine Sprache spricht. */
  var aB = Math.max(0, Math.min(1, (mt - 2.1) / 0.7));
  ctx.globalAlpha = aB;
  for (var q = 0; q < STIL_ORDER.length; q++){
    var r2 = stilRect(q), aktiv = STIL_ORDER[q] === STIL_NAME;
    var hov = IN.x > r2.x && IN.x < r2.x + r2.w && IN.y > r2.y && IN.y < r2.y + r2.h;
    txt(STILE[STIL_ORDER[q]].name, r2.x + r2.w/2, r2.y + 19, 15,
        aktiv ? '#f4e5bc' : (hov ? '#d2c4a2' : '#9d8f72'), 'center', aktiv ? 'bold ' : '');
    if (aktiv){ ctx.globalAlpha = aB * 0.55; pRect(r2.x + r2.w/2 - 22, r2.y + 25, 44, 1, '#c9a06a'); ctx.globalAlpha = aB; }
  }
  for (var sq = 0; sq < SPR_ORDER.length; sq++){
    var qr = sprachRect(sq), qa = SPR_ORDER[sq] === SPRACHE;
    var qu = IN.x > qr.x && IN.x < qr.x + qr.w && IN.y > qr.y && IN.y < qr.y + qr.h;
    txt(SPRACH_NAME[SPR_ORDER[sq]] || SPR_ORDER[sq].toUpperCase(), qr.x + qr.w/2, qr.y + 17, 15,
        qa ? '#e6f4ec' : (qu ? '#b6cbc0' : '#8e9c93'), 'center', qa ? 'bold ' : '');
    if (qa){ ctx.globalAlpha = aB * 0.55; pRect(qr.x + qr.w/2 - 16, qr.y + 23, 32, 1, '#7fb8a4'); ctx.globalAlpha = aB; }
  }
  /* Die Hinweiszeile stand voll ausgeschrieben da und war die
     laengste Zeile im ganzen Menue. Was man im Menue braucht, sind
     zwei Tasten; der Rest gehoert ins Spiel und steht dort auch. */
  ctx.globalAlpha = aB * (0.42 + 0.22 * (0.5 + 0.5 * Math.sin(mt * 1.5)));
  txt(ue('Pfeiltasten und Enter, oder Klick'), cx, LH - 16, 13, '#94836a', 'center', 'italic ');
  ctx.globalAlpha = 1;
}

function menuKeydown(e){
  var items = menuItems();
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
    e.preventDefault();
    var i = STIL_ORDER.indexOf(STIL_NAME);
    i = (i + (e.key === 'ArrowRight' ? 1 : -1) + STIL_ORDER.length) % STIL_ORDER.length;
    setzeStil(STIL_ORDER[i]); uiSound('nav'); return;
  }
  if (e.key === 'ArrowDown'){ e.preventDefault(); G.menu.sel = (G.menu.sel+1) % items.length; uiSound('nav'); return; }
  if (e.key === 'ArrowUp'){ e.preventDefault(); G.menu.sel = (G.menu.sel-1+items.length) % items.length; uiSound('nav'); return; }
  if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); items[G.menu.sel].action(); return; }
  if (e.key === 'Escape' && G.menu.ebene === 'kapitel'){
    e.preventDefault(); menuEbene('haupt'); return;
  }
}
