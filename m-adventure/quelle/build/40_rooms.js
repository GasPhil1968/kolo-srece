
/* ============================================================
   Sektion 07  RAUMRAHMEN
   ------------------------------------------------------------
   Jeder Raum traegt alles selbst: Geometrie, Hotspots, Anker,
   Verdeckungsebenen, Lichtstimmung und Farbstich.

   Der Farbstich (grade) ist im Konzept eine ausdrueckliche
   Forderung: Gegenwart in warmen Adria-Toenen, Kindheit
   ausgeblichen, Deutschland kuehl und grau, Rueckkehr wieder warm.
   Er liegt darum nicht in den Hintergrundfunktionen, sondern als
   eine Zahl am Raum -- so kann er nirgends vergessen werden.
   ============================================================ */
var ROOMW = 1280;
var SC_NEAR_Y = 462, SC_NEAR = 1.00, SC_FAR_Y = 336, SC_FAR = 0.62;
function scaleAt(y){
  var nearY = (R && R.nearY) || SC_NEAR_Y, farY = (R && R.farY) || SC_FAR_Y;
  var near = (R && R.nearS) || SC_NEAR, far = (R && R.farS) || SC_FAR;
  var t = (y - farY) / (nearY - farY);
  t = Math.max(0, Math.min(1.15, t));
  return far + (near - far) * t;
}

var ROOMS = {};
function defineRoom(r){
  r.nodes      = buildNodes(r.area);
  r.state      = r.state || { visited:false };
  r.objects    = r.objects || [];
  r.marks      = r.marks || {};
  r.foreground = r.foreground || [];
  r.parallax   = r.parallax || [];
  ROOMS[r.id]  = r;
  return r;
}
function mark(room, name){
  var m = (room.marks || {})[name];
  return m || null;
}

/* Farbstiche. amount 0 = keiner. Wird nach roomLightWash() aufgetragen,
   damit er auch das Kunstlicht des Raums mitfaerbt. */
var GRADES = {
  /* col/a  = Farbschleier, ent = Entsaettigung
     ink    = Kontur der Hintergrundformen
     sink   = Kontur der Figuren
     raster = Farbe des feinen Punktrasters ueber dem Bild
     vig    = Staerke der Randabdunklung (1 = wie im Innenraum) */
  adria:       { col:'#ffb968', a:0.10, ent:0.00, ink:'#33241a', sink:'#2c1c12', raster:'#3a2410', vig:0.45 },
  ausgeblichen:{ col:'#e8ddc4', a:0.14, ent:0.26, ink:'#332c22', sink:'#2c261e', raster:'#2e2a22', vig:0.50 },
  ausflug:     { col:'#e0d8b8', a:0.11, ent:0.16, ink:'#312a1e', sink:'#2a2318', raster:'#2a2418', vig:0.55 },
  see:         { col:'#9ac0d8', a:0.10, ent:0.10, ink:'#1e2830', sink:'#1a222a', raster:'#16202c', vig:0.50 },
  stadt:       { col:'#c9a882', a:0.09, ent:0.10, ink:'#2a201a', sink:'#241a14', raster:'#241a12', vig:0.70 },
  kalt:        { col:'#9aaec4', a:0.17, ent:0.34, ink:'#1b2028', sink:'#161b22', raster:'#101418', vig:1.00 },
  nacht:       { col:'#7f92b4', a:0.15, ent:0.24, ink:'#151828', sink:'#111422', raster:'#0c1020', vig:1.00 },
  rueckkehr:   { col:'#ffc078', a:0.09, ent:0.00, ink:'#33241a', sink:'#2c1c12', raster:'#3a2410', vig:0.45 }
};
/* Innenraeume behalten die harte Tinte und die volle Vignette: dort ist
   die Dunkelheit Absicht und kein Stilbruch. */
var RAUM_TINTE = {
  garage: { ink:'#1a1410', sink:'#160f0a', raster:'#100c14', vig:1.15 },
  werk:   { ink:'#1b2028', sink:'#161b22', raster:'#101418', vig:1.10 }
};
function setzeRaumTinte(){
  var g = GRADES[(R && R.grade) || 'adria'] || GRADES.adria;
  var eig = RAUM_TINTE[R && R.id] || null;
  INK        = (eig && eig.ink)    || g.ink    || '#2e1f16';
  SPRITE_INK = (eig && eig.sink)   || g.sink   || '#2a1a12';
  RASTER_COL = (eig && eig.raster) || g.raster || '#10111a';
  VIG_STAERKE= (eig && eig.vig !== undefined) ? eig.vig : (g.vig === undefined ? 1 : g.vig);
}
var RASTER_COL = '#3a2410', VIG_STAERKE = 0.45;
/* Aussenlicht. In den Adria-Kapiteln kommt das Licht nicht aus einer
   Lampe, sondern von oben und von der Seite, und es ist zu viel davon.
   Additiv aufgetragen: es hebt die vorhandene Farbe an, statt sie
   zuzudecken -- Stein bleibt Stein und wird trotzdem heiss. */
var SONNENRAEUME = { adria:1, rueckkehr:1, ausflug:0.75, ausgeblichen:0.6, see:0.7, stadt:0.4 };
function applySonne(){
  var k = (SONNENRAEUME[(R && R.grade) || ''] || 0) * ((typeof STIL !== 'undefined') ? STIL.sonne : 1);
  if (!k) return;
  var L = currentLight();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  var lit = mixHex('#000000', L.rimColor || '#ffd9a0', 1);
  // Seitliches Sonnenlicht in Lichtrichtung, in flachen Stufen
  var stufen = 7;
  for (var i = 0; i < stufen; i++){
    var f = i / (stufen - 1);
    var x = L.dir > 0 ? R.w * f : R.w * (1 - f);
    ctx.globalAlpha = 0.030 * k * f * f;
    ctx.fillStyle = lit;
    ctx.fillRect(psnap(Math.min(x, x)), 0, Math.ceil(R.w / stufen) + 2, VIEW_H);
  }
  // Und ein Hauch von oben, damit die Luft ueber dem Boden flimmert
  for (var j = 0; j < 5; j++){
    ctx.globalAlpha = 0.016 * k * (1 - j / 5);
    ctx.fillStyle = lit;
    ctx.fillRect(0, psnap(j * 26), R.w, 26);
  }
  ctx.restore();
}
function applyGrade(){
  applySonne();
  var g = GRADES[(R && R.grade) || 'adria'];
  if (!g) return;
  ctx.save();
  if (g.ent > 0){
    /* Entsaettigung als Graustufenschleier: kein Filter, sondern eine
       gerasterte Deckschicht, damit die Pixeloptik erhalten bleibt. */
    ctx.globalAlpha = g.ent * 0.5;
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, R.w, VIEW_H);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = g.a;
  ctx.fillStyle = g.col;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillRect(0, 0, R.w, VIEW_H);
  ctx.restore();
}

/* ------------------------------------------------------------
   RAHMEN · Podaca, Sommer 2018 — die Terrasse
   Der Hub. Er veraendert sich mit jedem Kapitel: was M. erinnert
   hat, steht danach als Gegenstand auf der Terrasse.
   ------------------------------------------------------------ */
var ROOM_TERRASSE = {
  id:'terrasse',
  title:'PODACA · SOMMER 2018',
  bild:'terrasse_podaca_2018',
  ueberBild:drawTerrasseBildOverlay,
  light:{ dir:1, rimColor:'#ffd9a0', ambient:'#3a4a5e', rim:0.42 },
  grade:'adria',
  w:1280,
  area:[[ 60,462, 1220,462, 1200,352, 1010,352, 1010,382, 866,382, 866,352,
          520,352, 520,372, 300,372, 300,352, 90,352 ]],
  entry:{ x:300, y:446, dir:1 },
  npcs:[ { id:'luka', x:820, y:440, dir:-1 } ],
  marks:{
    haustuer:{ x:190, y:440, dir:-1 },
    radio:   { x:270, y:414, dir:1 },
    tisch:   { x:252, y:444, dir:1 },
    bank:    { x:410, y:446, dir:1 },
    feige:   { x:650, y:430, dir:1 },
    garage:  { x:1140, y:444, dir:1 },
    mauer:   { x:875, y:430, dir:1 },
    kiste:   { x:830, y:454, dir:-1 }
  }
};

/* ------------------------------------------------------------
   RAHMEN · Die Garage. Alles, was nicht ins Haus durfte.
   ------------------------------------------------------------ */
var ROOM_GARAGE = {
  id:'garage',
  title:'DIE GARAGE',
  light:{ dir:-1, rimColor:'#ffd08a', ambient:'#241c1e', rim:0.5 },
  grade:'adria',
  w:1280,
  nearY:458, farY:344,
  area:[[ 70,458, 1180,458, 1160,346, 640,346, 640,392, 470,392, 470,346, 90,346 ]],
  entry:{ x:180, y:444, dir:1 },
  npcs:[],
  marks:{
    tor:    { x:150, y:444, dir:-1 },
    regal:  { x:400, y:414, dir:1 },
    moped:  { x:600, y:440, dir:1 },
    plane:  { x:790, y:442, dir:1 },
    netze:  { x:500, y:420, dir:1 }
  }
};

/* ------------------------------------------------------------
   KAPITEL 1 · Rosko Polje, 1953. Hunger, Feldarbeit, ein Karren
   mit gebrochener Achse. Baba Roga steht am Bildrand.
   ------------------------------------------------------------ */
var ROOM_POLJE = {
  id:'polje',
  title:'ROSKO POLJE · 1953',
  light:{ dir:1, rimColor:'#fff0c8', ambient:'#3e4a44', rim:0.30 },
  grade:'ausgeblichen',
  w:1400,
  area:[[ 50,462, 1360,462, 1340,348, 1150,348, 1150,392, 980,392, 980,348,
          640,348, 640,376, 420,376, 420,348, 70,348 ]],
  entry:{ x:250, y:450, dir:1 },
  npcs:[ { id:'otac', x:1010, y:436, dir:-1 },
          { id:'petar', x:470, y:440, dir:1 },
          /* Kapitel 1: der junge Nagelhaendler mit dem Strohhut. */
          { id:'dedo', x:900, y:444, dir:-1, appearance:'stroh', schlendert:120 } ],
  marks:{
    haus:    { x:330, y:432, dir:-1 },
    petar:   { x:432, y:444, dir:1 },
    radio_p: { x:392, y:448, dir:-1 },
    majka:   { x:490, y:430, dir:-1 },
    karren:  { x:700, y:450, dir:1 },
    achse:   { x:730, y:452, dir:1 },
    holz:    { x:900, y:440, dir:1 },
    vater:   { x:950, y:438, dir:1 },
    weg:     { x:1300, y:448, dir:1 },
    brunnen: { x:580, y:440, dir:-1 }
  }
};

/* ------------------------------------------------------------
   KAPITEL 1b · Die Bruecke. Ein Fremder sitzt auf der Bruestung
   und schaut ins Wasser, als haette er Zeit.
   ------------------------------------------------------------ */
var ROOM_BRUECKE = {
  id:'bruecke',
  title:'DIE BRÜCKE',
  bild:'bruecke_1953',
  light:{ dir:-1, rimColor:'#ffe8b8', ambient:'#3a4a52', rim:0.34 },
  grade:'ausgeblichen',
  w:1280,
  nearY:462, farY:352,
  area:[[ 60,462, 1220,462, 1200,352, 944,352, 944,442, 416,442, 416,352, 80,352 ]],
  entry:{ x:150, y:452, dir:1 },
  npcs:[ { id:'andrin', x:620, y:452, dir:-1, sit:true, hoehe:112 } ],
  marks:{
    zurueck: { x:130, y:452, dir:-1 },
    fremder: { x:560, y:440, dir:1 },
    bruestung:{ x:720, y:440, dir:1 },
    wasser:  { x:820, y:448, dir:1 },
    muehle:  { x:930, y:420, dir:1 }
  }
};

/* ------------------------------------------------------------
   KAPITEL 2 · Mostar, 1955. Aufmarsch, Fahnen, ein Lehrer, der
   zaehlt, und ein Junge ohne Faehnchen.
   ------------------------------------------------------------ */
var ROOM_MOSTAR = {
  id:'mostar',
  title:'MOSTAR · 1955',
  bild:'mostar_1955',
  ueberBild:drawMostarDynamik,
  light:{ dir:-1, rimColor:'#ffe6b0', ambient:'#3e3a48', rim:0.36 },
  grade:'ausflug',
  w:1400,
  area:[[ 50,462, 1360,462, 1340,350, 1120,350, 1120,388, 940,388, 940,350,
          700,350, 700,382, 480,382, 480,350, 70,350 ]],
  entry:{ x:180, y:450, dir:1 },
  npcs:[ { id:'lehrer', x:420, y:440, dir:1 },
          /* Kapitel 2: drei Faehnchen, ein Fez. */
          { id:'dedo', x:560, y:446, dir:1, appearance:'fez', schlendert:130 } ],
  marks:{
    lehrer:  { x:490, y:442, dir:-1 },
    stand:   { x:650, y:444, dir:1 },
    plakat:  { x:880, y:436, dir:1 },
    tribuene:{ x:1110, y:444, dir:1 },
    gasse:   { x:1300, y:450, dir:1 },
    rinne:   { x:520, y:452, dir:1 },
    bruecke2:{ x:1100, y:440, dir:1 }
  }
};

/* ------------------------------------------------------------
   KAPITEL 3 · Marinestuetzpunkt, 1960er. Drei Befehle, ein
   Vormittag, eine Inspektion. Und eine Holzkiste.
   ------------------------------------------------------------ */
var ROOM_KASERNE = {
  id:'kaserne',
  title:'MARINESTÜTZPUNKT · ADRIA, 1960er',
  light:{ dir:1, rimColor:'#e8f4ff', ambient:'#2e3c50', rim:0.44 },
  grade:'see',
  w:1400,
  bild:'kaserne_1960',
  ueberBild:drawKaserneDynamik,
  area:[[ 60,462, 1350,462, 1330,352, 1140,352, 1140,390, 960,390, 960,352,
          660,352, 660,380, 430,380, 430,352, 80,352 ]],
  entry:{ x:210, y:452, dir:1 },
  npcs:[ { id:'zdravko', x:520, y:442, dir:1 },
          /* Kapitel 3: Feldkoch, Bauhelm. */
          { id:'dedo', x:1060, y:446, dir:-1, appearance:'bauhelm', schlendert:100 } ],
  marks:{
    narednik:{ x:590, y:444, dir:-1 },
    fahne:   { x:760, y:436, dir:1 },
    farbe:   { x:900, y:448, dir:1 },
    kammer:  { x:900, y:440, dir:1 },
    steg:    { x:1250, y:450, dir:1 },
    boot:    { x:1180, y:444, dir:1 },
    tor:     { x:170, y:450, dir:-1 }
  }
};

/* ------------------------------------------------------------
   KAPITEL 4 · Sarajevo, 1970er. Wohnungsamt, Tauschgeschaefte,
   ein Stadion und ein Mann, der weitergeht.
   ------------------------------------------------------------ */
var ROOM_SARAJEVO = {
  id:'sarajevo',
  title:'SARAJEVO · 1970er',
  light:{ dir:1, rimColor:'#ffd7a0', ambient:'#33303e', rim:0.34 },
  grade:'stadt',
  w:1400,
  bild:'sarajevo_1970',
  ueberBild:drawSarajevoDynamik,
  area:[[ 50,462, 1360,462, 1340,350, 1160,350, 1160,392, 980,392, 980,350,
          620,350, 620,384, 400,384, 400,350, 70,350 ]],
  entry:{ x:200, y:452, dir:1 },
  npcs:[ { id:'lena', x:330, y:444, dir:1 }, { id:'safet', x:1150, y:438, dir:-1 },
          /* Kapitel 4: sein grosser Auftritt. Markt, Sombrero. */
          { id:'dedo', x:620, y:450, dir:1, appearance:'sombrero', schlendert:140 } ],
  marks:{
    lena:    { x:400, y:446, dir:-1 },
    amt:     { x:440, y:440, dir:1 },
    schalter:{ x:500, y:438, dir:1 },
    kiosk:   { x:760, y:444, dir:1 },
    tram:    { x:1000, y:448, dir:1 },
    stadion: { x:1180, y:444, dir:1 },
    safet:   { x:1100, y:440, dir:1 }
  }
};

/* ------------------------------------------------------------
   KAPITEL 5 · Deutschland, 1970er. Erster Arbeitstag. Kein Wort
   Deutsch, ein Auftrag, ein Kollege, eine Kantine im Hintergrund.
   ------------------------------------------------------------ */
var ROOM_WERK = {
  id:'werk',
  title:'DEUTSCHLAND · DAS WERK, 1970er',
  light:{ dir:-1, rimColor:'#dfe8f0', ambient:'#2a2f38', rim:0.40 },
  grade:'kalt',
  w:1400,
  area:[[ 60,462, 1350,462, 1330,352, 1130,352, 1130,394, 950,394, 950,352,
          650,352, 650,386, 420,386, 420,352, 80,352 ]],
  entry:{ x:200, y:452, dir:1 },
  npcs:[ { id:'yilmaz', x:900, y:442, dir:-1 }, { id:'krause', x:520, y:440, dir:1 },
          /* Kapitel 5: Hausmeister mit Besen. Doktorhut, warum auch immer. */
          { id:'dedo', x:470, y:446, dir:1, appearance:'doktor', schlendert:110 } ],
  marks:{
    meister: { x:580, y:442, dir:-1 },
    zettel:  { x:660, y:440, dir:1 },
    maschine:{ x:820, y:448, dir:1 },
    yilmaz:  { x:840, y:444, dir:1 },
    tafel:   { x:1000, y:436, dir:1 },
    kiste:   { x:1140, y:446, dir:1 },
    kantine: { x:1290, y:448, dir:1 },
    spind:   { x:300, y:438, dir:-1 }
  }
};

/* ------------------------------------------------------------
   KAPITEL 6 · Deutschland, 1991/92. Eine Telefonzelle, eine
   Handvoll Muenzen, ein Paket, das durch den Zoll muss.
   ------------------------------------------------------------ */
var ROOM_TELEFON = {
  id:'telefon',
  title:'DEUTSCHLAND · WINTER 1991',
  light:{ dir:1, rimColor:'#ffd98a', ambient:'#1e2436', rim:0.5 },
  grade:'nacht',
  w:1300,
  area:[[ 60,462, 1250,462, 1230,354, 1040,354, 1040,392, 860,392, 860,354,
          560,354, 560,386, 340,386, 340,354, 80,354 ]],
  entry:{ x:190, y:450, dir:1 },
  npcs:[ { id:'sommer', x:1000, y:438, dir:-1 } ],
  marks:{
    zelle:   { x:430, y:446, dir:1 },
    apparat: { x:470, y:444, dir:1 },
    paket:   { x:700, y:448, dir:1 },
    schaufenster:{ x:860, y:440, dir:1 },
    post:    { x:1050, y:442, dir:1 },
    sommer:  { x:930, y:440, dir:1 },
    heim:    { x:150, y:448, dir:-1 }
  }
};

/* ------------------------------------------------------------
   KAPITEL 7 · Podaca, 2004 bis 2018. Der Hausbau als Raetselkette
   ueber mehrere Sommer. Am Abend kommt jemand den Hang herauf.
   ------------------------------------------------------------ */
var ROOM_BAU = {
  id:'bau',
  title:'PODACA · DER HAUSBAU',
  light:{ dir:-1, rimColor:'#ffcf8a', ambient:'#3a3446', rim:0.42 },
  grade:'rueckkehr',
  w:1400,
  area:[[ 60,462, 1350,462, 1330,352, 1130,352, 1130,392, 930,392, 930,352,
          620,352, 620,384, 380,384, 380,352, 80,352 ]],
  entry:{ x:200, y:452, dir:1 },
  npcs:[ { id:'jure', x:640, y:442, dir:1 },
          /* Kapitel 7: am Meer, mit der Angel. Weihnachtsmuetze im Juli. */
          { id:'dedo', x:880, y:452, dir:-1, appearance:'weihnacht', schlendert:150 } ],
  marks:{
    rohbau:  { x:420, y:436, dir:-1 },
    mischer: { x:560, y:448, dir:1 },
    jure:    { x:720, y:444, dir:-1 },
    steine:  { x:880, y:448, dir:1 },
    amtstisch:{ x:1030, y:442, dir:1 },
    hang:    { x:1250, y:448, dir:1 },
    meer:    { x:1150, y:436, dir:1 }
  }
};

ROOM_TERRASSE.foreground = [
  { name:'brueckung_reben', y:466, draw:function(){ terrasseVordergrund(); } }
];
ROOM_WERK.foreground = [
  { name:'foerderband', y:452, draw:function(){ werkBandVorn(); } }
];
ROOM_BAU.foreground = [
  { name:'geruest_vorn', y:456, draw:function(){ bauGeruestVorn(); } }
];
ROOM_TERRASSE.parallax = [
  { name:'meer', factor:0.35, clip:[520, 96, 350, 258], draw:function(T){ terrasseMeer(T); } }
];
ROOM_BAU.parallax = [
  { name:'bucht', factor:0.38, clip:[930, 100, 470, 254], draw:function(T){ bauBucht(T); } }
];

defineRoom(ROOM_TERRASSE);
defineRoom(ROOM_GARAGE);
defineRoom(ROOM_POLJE);
defineRoom(ROOM_BRUECKE);
defineRoom(ROOM_MOSTAR);
defineRoom(ROOM_KASERNE);
defineRoom(ROOM_SARAJEVO);
defineRoom(ROOM_WERK);
defineRoom(ROOM_TELEFON);
defineRoom(ROOM_BAU);
var R = ROOM_TERRASSE;
