
/* ============================================================
   Sektion 07b  KAPITEL 1 · DIE DREI WEITEREN RAEUME
   ------------------------------------------------------------
   Das Konzept empfiehlt, Prolog und Kapitel 1 zuerst vollstaendig
   fertigzustellen und erst danach ueber den Rest zu entscheiden.
   Kapitel 1 ist darum kein einzelner Bildschirm mehr, sondern
   vier: die Weide oben, der Hof, das Haus und die Bruecke unten.
   Der Weg fuehrt einmal hinunter und wieder herauf, und das ist
   im Karst der ganze Tagesablauf.
   ============================================================ */

var ROOM_WEIDE = {
  id:'weide',
  title:'ÜBER ROSKO POLJE · MORGEN',
  bild:'weide_rosko_1953',
  ueberBild:drawWeideDynamik,
  light:{ dir:1, rimColor:'#fff4d0', ambient:'#48503e', rim:0.34 },
  grade:'ausgeblichen',
  w:1300,
  nearY:462, farY:344,
  area:[[ 60,462, 1240,462, 1220,346, 1000,346, 1000,388, 820,388, 820,346,
          520,346, 520,376, 300,376, 300,346, 80,346 ]],
  entry:{ x:200, y:450, dir:1 },
  npcs:[ { id:'otac', x:550, y:452, dir:-1, sit:true, hoehe:28 } ],
  marks:{
    vater:   { x:505, y:450, dir:1 },
    herde:   { x:820, y:448, dir:1 },
    fels:    { x:1040, y:446, dir:1 },
    wacholder:{ x:380, y:444, dir:-1 },
    kante:   { x:240, y:452, dir:-1 },
    pfad:    { x:1200, y:452, dir:1 }
  }
};

var ROOM_KUCA = {
  id:'kuca',
  title:'DAS HAUS',
  bild:'kuca_1953',
  light:{ dir:-1, rimColor:'#ffcf88', ambient:'#2a2018', rim:0.52 },
  grade:'ausgeblichen',
  w:1280,
  nearY:458, farY:342,
  area:[[ 70,458, 1180,458, 1162,344, 660,344, 660,388, 470,388, 470,344, 88,344 ]],
  entry:{ x:180, y:446, dir:1 },
  npcs:[ { id:'majka', x:540, y:442, dir:1 } ],
  marks:{
    tuer:    { x:150, y:446, dir:-1 },
    herd:    { x:640, y:448, dir:1 },
    mutter:  { x:560, y:444, dir:1 },
    tisch:   { x:830, y:450, dir:1 },
    bett:    { x:1080, y:446, dir:1 },
    mehlsack:{ x:410, y:448, dir:-1 },
    bild:    { x:910, y:430, dir:1 }
  }
};

defineRoom(ROOM_WEIDE);
defineRoom(ROOM_KUCA);

/* Die Aussicht ins Tal bleibt beim Scrollen zurueck: sie ist weit weg,
   und sie ist der Grund, warum man hier heraufsteigt. */
ROOM_WEIDE.parallax = [
  { name:'tal', factor:0.34, clip:[0, 120, 1300, 210], draw:function(T){
      if (!bildQuelle('weide_rosko_1953')) weideTal(T);
    } }
];
