
/* ============================================================
   Sektion 13  ZUSTAND
   ============================================================ */
var FLAG = {};
var INV = {
  items: [],
  add: function(id){ if (!this.has(id)){ this.items.push(id); if (typeof G!=='undefined') G.autosaveT=0.5; } },
  has: function(id){ for (var i=0;i<this.items.length;i++) if (this.items[i]===id) return true; return false; },
  drop: function(id){ this.items = this.items.filter(function(a){ return a !== id; }); if (typeof G!=='undefined') G.autosaveT=0.5; }
};
/* Das Inventar leert sich beim Kapitelwechsel. Genau ein Stueck pro
   Kapitel bleibt und wandert in die Kiste in der Gegenwart -- so steht
   es im Konzept, und es ist der Grund, warum sich die Terrasse
   veraendert, ohne dass irgendwo eine Fortschrittsanzeige noetig waere. */
function leereInventar(behalten){
  INV.items = behalten ? INV.items.filter(function(i){ return i === behalten; }) : [];
  if (typeof G!=='undefined') G.autosaveT = 0.4;
}

var ITEMS = {
  /* Rahmen */
  taschenlampe:{ name:'Taschenlampe', desc:'Sie liegt seit Jahren im Schrank neben der Tür. Der Kontakt wackelt, aber sie geht an, wenn man sie schüttelt.' },
  autoschluessel:{ name:'Autoschlüssel', desc:'Ein Schlüssel, zwei Ringe, ein Plastikanhänger von einer Tankstelle, die es nicht mehr gibt.' },
  foto:{ name:'Das Foto', desc:'Elf Leute vor einem Steinhaus. Sechs davon leben noch. Auf der Rückseite steht eine Jahreszahl in Bleistift.' },
  /* Kapitel 1 */
  wacholder:{ name:'Wacholderzweig', desc:'Frisch abgebrochen, die Beeren blau bereift. Zwischen den Fingern zerrieben hält sich der Geruch zwei Tage. Länger.' },
  speck:{ name:'Speckschwarte', desc:'Trocken, salzig, und viel zu schade zum Wegwerfen. Bei uns wurde sie zuerst gegessen und dann noch zweimal benutzt.' },
  holzkeil:{ name:'Holzkeil', desc:'Aus dem Stapel hinter dem Haus. Buche, hart, an einer Seite schon einmal eingeschlagen.' },
  radnagel:{ name:'Radnagel', desc:'Der Splint, der das Rad auf der Achse hält. Handgeschmiedet, krumm, unersetzlich.' },
  wecker:{ name:'Alter Wecker', desc:'Er geht seit zwei Jahren nicht mehr. Aufgehoben hat ihn trotzdem jeder, weil Blech Blech bleibt.' },
  kupferdraht:{ name:'Kupferdraht', desc:'Aus der Spule im Wecker. Dünn, weich und lang genug für das, was gebraucht wird.' },
  mehl:{ name:'Sack Mehl', desc:'Fünfzehn Kilo aus dem Nachbardorf. Er riecht nach Staub und nach dem, was man daraus macht.' },
  /* Kapitel 2 */
  zeitung:{ name:'Zeitungsblatt', desc:'Ein halbes Blatt Oslobođenje, drei Tage alt. Eine Seite Politik, eine Seite Fußball.' },
  stecken:{ name:'Holzstecken', desc:'Aus der Rinne am Straßenrand. Gerade genug, um etwas daran zu befestigen.' },
  faehnchen:{ name:'Papierfähnchen', desc:'Rot, weiß, blau, ein Stern in der Mitte. Selbst gemacht, und man sieht es. Von hinten sieht man auch, aus welcher Zeitung.' },
  klebstoff:{ name:'Klebreis', desc:'Ein Löffel voll vom Stand. Kalt, klebrig und für Papier besser als für Menschen.' },
  /* Kapitel 3 */
  befehl1:{ name:'Befehl: Fahne', desc:'„Die Flagge ist um 0900 zu hissen." Unterschrift unleserlich. Es ist 0850.' },
  befehl2:{ name:'Befehl: Bordstein', desc:'„Der Bordstein ist bis 0900 weiß zu streichen." Dieselbe unleserliche Unterschrift.' },
  befehl3:{ name:'Befehl: Kammer', desc:'„Die Kammer ist um 0900 verschlossen und der Schlüssel abzugeben." Auch 0900. Auch dieselbe Schrift.' },
  farbe:{ name:'Farbeimer', desc:'Weiße Farbe, halb voll, mit einer Haut oben drauf. Die Marine streicht damit alles, was nicht wegläuft.' },
  pinsel:{ name:'Pinsel', desc:'Borsten hart wie Draht. Er wurde nach dem letzten Mal nicht ausgewaschen, und das war vor einem Jahr.' },
  kammerschluessel:{ name:'Kammerschlüssel', desc:'Schwer, kalt, an einem Bindfaden. Wer ihn hat, ist verantwortlich.' },
  kiste:{ name:'Holzkiste', desc:'Munitionskiste, ausgemustert. Deckel, Schnalle, Aufschrift. Man bekommt sie, wenn man nicht danach fragt.' },
  /* Kapitel 4 */
  kaffee:{ name:'Päckchen Kaffee', desc:'Kein Geschenk, keine Bestechung. Eine Höflichkeit, die zufällig auf dem Tisch liegen bleibt.' },
  antrag:{ name:'Wohnungsantrag', desc:'Vier Seiten. Drei davon fragen nach Dingen, die im dritten Absatz schon stehen.' },
  stempel:{ name:'Gestempelter Antrag', desc:'Derselbe Antrag. Ein Stempel mehr, und damit ein anderes Dokument.' },
  ersatzteil:{ name:'Vergaserdüse', desc:'Für einen Fića. Sie lag ein Jahr in meiner Tasche, weil man so etwas nicht wegwirft, bevor man weiß, wer sie braucht.' },
  wohnungsschluessel:{ name:'Wohnungsschlüssel', desc:'Zwei Zimmer, dritter Stock, kein Aufzug. Der schwerste leichte Gegenstand, den ich je getragen habe.' },
  /* Kapitel 5 */
  ausweis:{ name:'Werksausweis', desc:'Ein Foto, eine Nummer, ein Name, den hier niemand richtig ausspricht. Er gilt trotzdem.' },
  auftragszettel:{ name:'Der Zettel', desc:'Sieben Wörter in deutscher Schreibschrift. Ich erkenne die Zahl 12 und einen Pfeil. Der Rest ist ein Zaun.' },
  skizze:{ name:'Die Skizze', desc:'Yılmaz hat sie mit dem Zimmermannsbleistift auf die Kistenpappe gezeichnet. Sie ist besser als der Zettel.' },
  schluessel13:{ name:'Schlüssel 13', desc:'Maulschlüssel, Dreizehner. Blank an den Backen, wie alle Werkzeuge, die wirklich benutzt werden.' },
  /* Kapitel 6 */
  muenzen:{ name:'Vier Markstücke', desc:'Vier Münzen. Jede ist eine Minute nach Split, wenn die Leitung steht, und nichts, wenn sie es nicht tut.' },
  zollformular:{ name:'Zollerklärung', desc:'Grüner Vordruck. Eine Zeile für den Inhalt, eine für den Wert. Was man hineinschreibt, entscheidet, ob es ankommt.' },
  schokolade:{ name:'Tafel Schokolade', desc:'Für die Kinder in Split, die keine Kinder mehr sind. Man packt so etwas trotzdem ein.' },
  medikamente:{ name:'Medikamente', desc:'Aus der Apotheke an der Ecke. Frau Sommer hat gefragt, wofür. Ich habe gesagt: für alle.' },
  /* Kapitel 7 */
  zollstock:{ name:'Zollstock', desc:'Gelbes Holz, deutsche Marke, seit 1974 dasselbe Stück. Er hat mehr Häuser gesehen als ich.' },
  genehmigung:{ name:'Baugenehmigung', desc:'Ein Stempel, zwei Unterschriften, elf Jahre. Sie gilt rückwirkend, und niemand weiß mehr, warum das ging.' },
  zement:{ name:'Sack Zement', desc:'Fünfzig Kilo. Jure sagt, ich soll ihn tragen lassen. Jure sagt viel.' },
  wasserwaage:{ name:'Wasserwaage', desc:'Die Blase steht in der Mitte. Sie steht in diesem Haus zum ersten Mal in der Mitte.' }
};

/* ------------------------------------------------------------
   SPEICHERN
   ------------------------------------------------------------ */
/* Ob diese Seite dem Spieler ueberhaupt eine Datei geben darf. In
   einem eingebetteten Rahmen -- etwa als veroeffentlichte Seite --
   ist das gesperrt, und ein Download-Link tut dort stillschweigend
   nichts. Das ist die schlechteste Art zu scheitern, also wird es
   vorher geprueft und ehrlich gesagt. Der Spielstand liegt ohnehin
   im Browser und funktioniert auch dort. */
var DATEI_MOEGLICH = (function(){ try { return window.self === window.top; } catch(e){ return false; } })();

var SAVE_KEY = 'most.save.v1';
var AUTO_KEY = SAVE_KEY + '.auto';
var SAVE_VERSION = 1;
var SAVE_NOTE = { text:'', t:0 };
var SAVE_MEM = null, AUTO_MEM = null, SAVE_EXISTS = false;
var WORLD = { rooms:{} };
function roomState(id){ if(!WORLD.rooms[id]) WORLD.rooms[id]={visited:false,npcs:{}}; if(!WORLD.rooms[id].npcs) WORLD.rooms[id].npcs={}; return WORLD.rooms[id]; }
function setFlag(k,v){ FLAG[k]=v; if(typeof G!=='undefined') G.autosaveT=0.65; return v; }
function copyPlain(o){ return JSON.parse(JSON.stringify(o)); }
function flashNote(text){ SAVE_NOTE.text = text; SAVE_NOTE.t = 2.0; }
function syncRoomNPCs(room){
  if(!room || !room.npcs) return;
  var st=roomState(room.id);
  room.npcs.forEach(function(spec){
    var a=actorById(spec.id); if(!a) return;
    st.npcs[spec.id]={x:a.x,y:a.y,dir:a.dir,sit:!!a.sitting,hoehe:a.hoehe||0};
  });
}
function makeSave(){
  syncRoomNPCs(R);
  return { version:SAVE_VERSION, room:R.id,
    player:{x:PL.x,y:PL.y,dir:PL.dir}, playerIdentity:PL.identityKey || 'mAlt',
    inventory:INV.items.slice(), flags:copyPlain(FLAG), world:copyPlain(WORLD),
    radioAn:!!radioAn, verb:G.verb, savedAt:Date.now() };
}
function storeSet(roh, slot){
  var auto = (slot === 'auto'), key = auto ? AUTO_KEY : SAVE_KEY;
  try { localStorage.setItem(key, roh); if (auto) AUTO_MEM = roh; else SAVE_MEM = roh; return 'dauerhaft'; }
  catch(e){ if (auto) AUTO_MEM = roh; else SAVE_MEM = roh; return 'sitzung'; }
}
function storeGet(slot){
  var auto = (slot === 'auto'), key = auto ? AUTO_KEY : SAVE_KEY;
  try { var v = localStorage.getItem(key); if (v) return v; } catch(e){}
  return auto ? AUTO_MEM : SAVE_MEM;
}
function storeGetNeuester(){
  var h = storeGet('hand'), a = storeGet('auto');
  if (!h) return a; if (!a) return h;
  try { return (JSON.parse(a).savedAt||0) > (JSON.parse(h).savedAt||0) ? a : h; } catch(e){ return h; }
}
function spielstandAlsDatei(){
  if (!DATEI_MOEGLICH){ flashNote('Gespeichert im Browser dieser Seite'); return false; }
  try{
    var blob = new Blob([JSON.stringify(makeSave())], {type:'application/json'});
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'm-spielstand.json';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    return true;
  }catch(e){ return false; }
}
function spielstandAusDatei(){
  if (!DATEI_MOEGLICH){ flashNote('Kein Spielstand vorhanden'); return false; }
  try{
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json'; inp.style.display = 'none';
    inp.addEventListener('change', function(){
      var f = inp.files && inp.files[0]; if (!f) return;
      var leser = new FileReader();
      leser.onload = function(){
        SAVE_MEM = String(leser.result);
        try { localStorage.setItem(SAVE_KEY, SAVE_MEM); } catch(e){}
        SAVE_EXISTS = true;
        flashNote(loadGame(true) ? 'Spielstand geladen' : 'Spielstand unlesbar');
      };
      leser.readAsText(f);
      document.body.removeChild(inp);
    });
    document.body.appendChild(inp); inp.click();
    return true;
  }catch(e){ return false; }
}
try { SAVE_EXISTS = !!(localStorage.getItem(SAVE_KEY) || localStorage.getItem(AUTO_KEY)); } catch(e){ SAVE_EXISTS = false; }
function saveGame(silent){
  var roh;
  try { roh = JSON.stringify(makeSave()); }
  catch(e){ if (!silent) flashNote('Speichern fehlgeschlagen'); return false; }
  var art = storeSet(roh, silent ? 'auto' : 'hand');
  SAVE_EXISTS = true;
  if (!silent){
    if (art === 'dauerhaft') flashNote('Spiel gespeichert');
    else { flashNote('Nur für diese Sitzung — Datei wird geladen'); spielstandAlsDatei(); }
  }
  return true;
}
function hasSave(){ return SAVE_EXISTS; }
function autosave(){ saveGame(true); }
function loadGame(silent){
  var raw = silent ? storeGetNeuester() : (storeGet('hand') || storeGet('auto')), data = null;
  if (!raw){ if (!silent){ flashNote('Kein Spielstand — Datei wählen'); spielstandAusDatei(); } return false; }
  try { data = JSON.parse(raw); } catch(e){ if(!silent) flashNote('Spielstand beschädigt'); return false; }
  if (!data || !ROOMS[data.room]){ if(!silent) flashNote('Spielstand inkompatibel'); return false; }
  G.seq=null; G.dlg=null; G.wait=0; G.roomChanging=null; G.fade=0; G.fadeTo=0; G.over=false; G.endCard=0;
  ACTORS.forEach(function(a){ a.sayLines=null; a.stop(); a.visible=(a===PL); });
  INV.items = Array.isArray(data.inventory) ? data.inventory.filter(function(id){ return !!ITEMS[id]; }) : [];
  Object.keys(FLAG).forEach(function(k){ delete FLAG[k]; });
  if (data.flags) Object.keys(data.flags).forEach(function(k){ FLAG[k]=data.flags[k]; });
  WORLD = data.world && data.world.rooms ? data.world : {rooms:{}};
  radioAn = !!data.radioAn;
  G.verb = VERBS.some(function(v){return v.id===data.verb;}) ? data.verb : 'ansehen';
  Object.keys(ROOMS).forEach(function(id){ ROOMS[id].state.visited=!!roomState(id).visited; });
  var e=data.player||ROOMS[data.room].entry||{x:300,y:446,dir:1};
  setPlayerIdentity(PL_IDENTITIES[data.playerIdentity] ? data.playerIdentity : 'mAlt');
  bindRoom(data.room,{x:+e.x||300,y:+e.y||446,dir:e.dir===-1?-1:1},true);
  if (!silent) flashNote('Spielstand geladen');
  return true;
}

var G = {
  t: 0, camx: 0, verb: 'ansehen', selItem: null, hover: null,
  seq: null, si: 0, wait: 0, skip: false,
  dlg: null, over: false, fade: 0, fadeTo: 0, endCard: 0,
  roomChanging:null, roomEnteredAt:0, autosaveT:0, fadeRate:0.8,
  dialogAlpha:0, dialogTypeLen:0, dialogTextTotal:0, dialogTextKey:'', dialogTickAt:0,
  dialogPopT:0, dlgSnapshot:null, dialogLinesCache:null,
  dlgSel:0, dlgPartner:null, menu:null, chapterCard:null, cine:null, intro:null,
  /* Die Katze als Hinweissystem: G.katzeIdle zaehlt herunter, solange
     nichts geschieht. Bei null schaut sie dorthin, wo es weitergeht. */
  katzeIdle: 55, katzeZeigt: 0, katzeZiel: 0,
  /* Erinnerungsunschaerfe: wie oft ein Hotspot schon angesehen wurde,
     und wie weit sich das Bild davon schon korrigiert hat. */
  gesehen: {}, unschaerfe: {}
};

/* ============================================================
   Sektion 14  FIGUREN DES SPIELS
   ============================================================ */
var PL = new Actor({ id:'m', name:'M.', x:300, y:446, dir:1,
  pal: PAL.mAlt, build:{ vest:true, shirt:true, moustache:true, lines:true, grey:true, tall:1.04 },
  speed:96, fidgets:['weight','look','shift'] });
PL.identityKey = 'mAlt';

/* M. ist in jedem Kapitel eine andere Groesse und dieselbe Person.
   Haut und Haar kommen aus derselben Familie von Werten (siehe PAL),
   die Statur waechst und schrumpft wieder. */
var PL_IDENTITIES = {
  mAlt:      { name:'M.', pal:PAL.mAlt, speed:88,
               build:{ vest:true, shirt:true, moustache:true, lines:true, grey:true, tall:1.04 } },
  mKind:     { name:'M.', pal:PAL.mKind, speed:104,
               build:{ shirt:true, barfuss:true, tall:0.70, headScale:1.34 } },
  mSchueler: { name:'M.', pal:PAL.mSchueler, speed:108,
               build:{ shirt:true, vest:true, tall:0.82, headScale:1.20 } },
  mMarine:   { name:'M.', pal:PAL.mMarine, speed:112,
               build:{ shirt:true, uniform:true, marinemuetze:true, tall:1.06 } },
  mSarajevo: { name:'M.', pal:PAL.mSarajevo, speed:106,
               build:{ shirt:true, vest:true, stubble:true, tall:1.08 } },
  mWerk:     { name:'M.', pal:PAL.mWerk, speed:104,
               build:{ shirt:true, overall:true, stubble:true, tall:1.08 } },
  mMann:     { name:'M.', pal:PAL.mMann, speed:98,
               build:{ shirt:true, coatLong:true, moustache:true, tall:1.07 } },
  /* Der Perspektivwechsel in Kapitel 6: eine kurze Szene aus L.s Sicht.
     Sie ist im Konzept ausdruecklich vorgesehen, damit L. mehr ist als
     Kulisse. */
  lena:      { name:'L.', pal:PAL.lena, speed:94,
               build:{ shirt:true, skirt:true, schuerzeKleid:true, tall:0.96 } }
};
function setPlayerIdentity(key){
  var id = PL_IDENTITIES[key] || PL_IDENTITIES.mAlt;
  PL.name = id.name; PL.pal = id.pal; PL.build = id.build; PL.speed = id.speed;
  PL.identityKey = key;
  PORTRAIT_CACHE = {};
}

var NPC_DEFS = {
  luka:{ id:'luka', name:'Luka', pal:PAL.luka,
    build:{ shirt:true, tall:0.66, headScale:1.36 }, speed:132, blend:12,
    fidgets:['zappeln','look','zappeln'], dialog:'luka',
    look:'Neun Jahre alt und der Einzige, der fragt, statt zu wissen.' },
  lena:{ id:'lena', name:'L.', pal:PAL.lena,
    build:{ shirt:true, skirt:true, schuerzeKleid:true, tall:0.96 }, speed:92, blend:9,
    fidgets:['schuerze','weight','schuerze'], dialog:'lena',
    look:'Sie sortiert etwas, während sie zuhört. Sie hört trotzdem alles.',
    appearances:{
      alt:{ pal:PAL.lenaAlt, build:{ shirt:true, skirt:true, schuerzeKleid:true, tuch:false, tall:0.94 } }
    } },
  otac:{ id:'otac', name:'Vater', pal:PAL.otac,
    build:{ vest:true, shirt:true, stubble:true, muetze:true, tall:1.14 }, speed:78, blend:7,
    fidgets:['grashalm','weight','grashalm'], dialog:'otac',
    look:'Einundvierzig, und er sieht aus wie sechzig. Hände, die abends nicht mehr ganz aufgehen.' },
  majka:{ id:'majka', name:'Mutter', pal:PAL.majka,
    build:{ shirt:true, skirt:true, schuerzeKleid:true, tuch:true, tall:0.98 }, speed:86, blend:8,
    fidgets:['schuerze','schuerze','weight'], dialog:'majka',
    look:'Sie steht nie still. Wenn sie still steht, ist etwas passiert.' },
  andrin:{ id:'andrin', name:'Der Fremde', pal:PAL.andrin,
    build:{ shirt:true, sakko:true, muetze:true, brille:true, grey:true, tall:1.06 }, speed:64, blend:6,
    fidgets:['lauschen','weight','lauschen'], dialog:'andrin',
    look:'Ein Mann in einem Mantel, der zu warm ist für den Tag. Er hat es nicht eilig, und das fällt hier auf.' },
  /* Der Dorfschullehrer aus Kapitel 1. Bewusst eine eigene Figur und
     nicht derselbe wie der Lehrer in Mostar: zwei Doerfer, zwei Leute,
     und der eine hat ein Radio und der andere eine Fahnenordnung. */
  petar:{ id:'petar', name:'Lehrer Petar', pal:PAL.petar,
    build:{ shirt:true, vest:true, brille:true, tall:1.02 }, speed:80, blend:9,
    fidgets:['scan','zaehlen'], dialog:'petar',
    look:'Er hat als Einziger im Dorf Bücher und als Einziger im Dorf keine Ziege. Beides fällt auf.' },
  lehrer:{ id:'lehrer', name:'Der Lehrer', pal:PAL.lehrer,
    build:{ shirt:true, sakko:true, moustache:true, tall:1.08 }, speed:84, blend:8,
    fidgets:['zaehlen','scan','zaehlen'], dialog:'lehrer',
    look:'Er zählt uns dreimal, und dreimal kommt eine andere Zahl heraus.' },
  tiko:{ id:'tiko', name:'Josip Broz Tiko', pal:PAL.tiko,
    build:{ shirt:true, uniform:true, schirmmuetze:true, brille:true, grey:true, tall:1.10 },
    speed:70, blend:5, fidgets:['winken','strammstehen','winken'], dialog:'tiko',
    look:'Weiß von oben bis unten, und die Sonne arbeitet für ihn.' },
  zdravko:{ id:'zdravko', name:'Narednik Zdravko', pal:PAL.zdravko,
    build:{ shirt:true, uniform:true, schirmmuetze:true, moustache:true, tall:1.10 },
    speed:80, blend:8, fidgets:['strammstehen','scan','ausatmen'], dialog:'zdravko',
    look:'Er brüllt gern und meint es selten. Das muss man einmal begriffen haben.' },
  admiral:{ id:'admiral', name:'Admiral Pivopija', pal:PAL.admiral,
    build:{ shirt:true, uniform:true, schirmmuetze:true, moustache:true, beard:true, grey:true, tall:1.12 },
    speed:62, blend:5, fidgets:['erzaehlen','ausatmen','erzaehlen'], dialog:'admiral',
    look:'Weiße Uniform, goldene Knöpfe, und eine Nase, die ihre eigene Geschichte erzählt.' },
  safet:{ id:'safet', name:'Safet Sušović', pal:PAL.safet,
    build:{ shirt:true, vest:true, tall:1.09 }, speed:118, blend:9,
    fidgets:['scan','weight','scan'], dialog:'safet',
    look:'Er sieht an einem vorbei, auch wenn man direkt vor ihm steht. Das ist keine Absicht. Das ist Übung.' },
  yilmaz:{ id:'yilmaz', name:'Yılmaz', pal:PAL.yilmaz,
    build:{ shirt:true, overall:true, moustache:true, tall:1.07 }, speed:96, blend:9,
    fidgets:['zeigen','weight','zeigen'], dialog:'yilmaz',
    look:'Ein Jahr länger hier als ich. Ein Jahr ist hier ein großer Vorsprung.' },
  krause:{ id:'krause', name:'Meister Krause', pal:PAL.krause,
    build:{ shirt:true, sakko:true, muetze:true, brille:true, moustache:true, grey:true, tall:1.08 },
    speed:82, blend:7, fidgets:['notieren','scan','notieren'], dialog:'krause',
    look:'Er ist nicht unfreundlich. Er hat nur nie darüber nachgedacht, dass ich ihn nicht verstehe.' },
  sommer:{ id:'sommer', name:'Frau Sommer', pal:PAL.sommer,
    build:{ shirt:true, skirt:true, schuerzeKleid:true, tall:0.97 }, speed:88, blend:9,
    fidgets:['schuerze','lauschen','schuerze'], dialog:'sommer',
    look:'Sie will helfen und darf nicht. Beides sieht man ihr an.' },
  jure:{ id:'jure', name:'Jure', pal:PAL.jure,
    build:{ shirt:true, vest:true, muetze:true, moustache:true, stubble:true, tall:1.07 },
    speed:86, blend:8, fidgets:['erzaehlen','erzaehlen','weight'], dialog:'jure',
    look:'Der Nachbar. Er weiß alles besser und hilft trotzdem jedes Mal.' },
  /* M. selbst als Nebenfigur. Gebraucht fuer den Perspektivwechsel in
     Kapitel 6: waehrend der Spieler L. fuehrt, muss er dastehen. */
  mann:{ id:'mann', name:'M.', pal:PAL.mMann,
    build:{ shirt:true, coatLong:true, moustache:true, tall:1.07 }, speed:98, blend:8,
    fidgets:['weight','ausatmen','look'], dialog:'mann',
    look:'Er steht da, als hätte er den Hörer noch in der Hand.' },
  /* Dedo Muratović. Sein Alter kennt niemand, er behauptet je nach
     Gespraech 63, 78, 104 oder "alt genug, um mich über Rückenschmerzen
     zu beschweren". Er ist Haendler, Hausmeister, Hafenarbeiter oder
     sitzt einfach auf einer Bank -- und wirkt, als waere er schon immer
     dort gewesen. Der Spieler erfaehrt nie, wer er wirklich ist.

     Marotten: er erzaehlt, und er atmet vorher aus. Nichts ueberrascht
     ihn. Der Hut wird pro Raum ueber appearances gesetzt. */
  dedo:{ id:'dedo', name:'Dedo Muratović', pal:PAL.dedo,
    build:{ shirt:true, sakko:true, moustache:true, beard:true, brille:true,
            brilleBreit:true, lines:true, tall:1.02 },
    speed:58, blend:5, fidgets:['erzaehlen','ausatmen','weight','erzaehlen'],
    dialog:'dedo',
    look:'Ein alter Mann, den nichts überrascht. Er sieht aus, als wäre er schon immer dort gewesen.',
    appearances:{
      sombrero:{ build:{ shirt:true, sakko:true, moustache:true, beard:true, brille:true, brilleBreit:true, lines:true, tall:1.02, hut:'sombrero' } },
      stroh:   { build:{ shirt:true, sakko:true, moustache:true, beard:true, brille:true, brilleBreit:true, lines:true, tall:1.02, hut:'stroh' } },
      fez:     { build:{ shirt:true, sakko:true, moustache:true, beard:true, brille:true, brilleBreit:true, lines:true, tall:1.02, hut:'fez' } },
      bauhelm: { build:{ shirt:true, sakko:true, moustache:true, beard:true, brille:true, brilleBreit:true, lines:true, tall:1.02, hut:'bauhelm' } },
      doktor:  { build:{ shirt:true, sakko:true, moustache:true, beard:true, brille:true, brilleBreit:true, lines:true, tall:1.02, hut:'doktor' } },
      alu:     { build:{ shirt:true, sakko:true, moustache:true, beard:true, brille:true, brilleBreit:true, lines:true, tall:1.02, hut:'alu' } },
      weihnacht:{ build:{ shirt:true, sakko:true, moustache:true, beard:true, brille:true, brilleBreit:true, lines:true, tall:1.02, hut:'weihnacht' } },
      zauber:  { build:{ shirt:true, sakko:true, moustache:true, beard:true, brille:true, brilleBreit:true, lines:true, tall:1.02, hut:'zauber' } },
      ohne:    { build:{ shirt:true, sakko:true, moustache:true, beard:true, brille:true, brilleBreit:true, lines:true, tall:1.02 } }
    } },
  gestalt:{ id:'gestalt', name:'Der Abendgast', pal:PAL.gestalt,
    build:{ shirt:true, vest:true, beard:true, grey:true, tall:1.12 }, speed:58, blend:5,
    fidgets:['lauschen','ausatmen','lauschen'], dialog:'gestalt',
    look:'Staub im Haar, Staub an den Händen. Die Hände sind zu groß für den Rest von ihm.' }
};

/* Der Hut, den Dedo im aktuellen Raum traegt. Er steckt in seinem
   build, weil er dort gezeichnet wird -- diese Funktion liest ihn nur
   aus, damit Dialog und Zeichnung nie auseinanderlaufen koennen. */
function dedoHutName(){
  return (NPC.dedo && NPC.dedo.build && NPC.dedo.build.hut) || '';
}

function mergeFlat(base, over){
  var out={}, k; base=base||{}; over=over||{};
  for(k in base) out[k]=base[k];
  for(k in over) out[k]=over[k];
  return out;
}
function applyNPCAppearance(a, def, appearance){
  def=def||a.npcDef||{};
  var app=(def.appearances&&appearance&&def.appearances[appearance])||null;
  a.pal=mergeFlat(def.pal, app&&app.pal);
  a.build=mergeFlat(def.build, app&&app.build);
  a.appearanceId=appearance||'base';
  return a;
}
function createNPC(def){
  var a=new Actor({id:def.id,name:def.name,x:0,y:440,dir:-1,pal:def.pal,build:def.build,
    speed:def.speed||92,blend:def.blend||9,fidgets:def.fidgets||['weight']});
  a.npcDef=def; a.visible=false; a.appearanceId='base'; return a;
}
var ACTORS = [ PL ];
var NPC = {};
Object.keys(NPC_DEFS).forEach(function(k){ NPC[k] = createNPC(NPC_DEFS[k]); ACTORS.push(NPC[k]); });

/* Die Erzaehlstimme. Nicht der Junge auf dem Feld erzaehlt, sondern der
   Mann von 2018, der sich daran erinnert. Er hat kein Portraet in der
   Dialogbox -- er ist nicht im Raum, er ist die Erinnerung selbst. */
var NARR = createNPC(NPC_DEFS.luka);
NARR.id = 'narrator'; NARR.name = 'M., später'; NARR.visible = false;
NARR.pal = PAL.mAlt; NARR.build = { vest:true, shirt:true, moustache:true, grey:true };
ACTORS.push(NARR);
function isNarrator(a){ return a === NARR; }
function actorById(id){ for(var i=0;i<ACTORS.length;i++) if(ACTORS[i].id===id) return ACTORS[i]; return null; }
var OBJ = [];

/* ============================================================
   Sektion 15  RAUMWECHSEL
   ============================================================ */
function bindRoom(id, entry, fromLoad){
  var nr = ROOMS[id], prev = R;
  if (!nr) return false;
  if (prev && prev!==nr && typeof prev.onExit==='function') prev.onExit(nr.id);
  if (prev && prev!==nr && !fromLoad) syncRoomNPCs(prev);
  R = nr; ROOMW = nr.w; OBJ = R.objects;
  var e = entry || nr.entry || {x:300,y:446,dir:1};
  PL.x=e.x; PL.y=e.y; PL.dir=(e.dir===-1?-1:1); PL.stop();
  ACTORS.forEach(function(a){
    if(a===PL) return;
    a.visible=false; a.stop(); a.sayLines=null; a.act=null; a.sitting=false; a.hoehe=0;
  });
  var rs = roomState(id);
  (nr.npcs||[]).forEach(function(spec){
    if (spec.when && !spec.when()) return;
    var a=actorById(spec.id); if(!a) return;
    applyNPCAppearance(a, a.npcDef, spec.appearance || 'base');
    var saved = rs.npcs && rs.npcs[spec.id];
    a.x = saved&&isFinite(saved.x) ? +saved.x : spec.x;
    a.y = saved&&isFinite(saved.y) ? +saved.y : spec.y;
    a.dir = saved ? (saved.dir===1?1:-1) : (spec.dir===1?1:-1);
    a.sitting = saved ? !!saved.sit : !!spec.sit;
    a.hoehe = saved && isFinite(saved.hoehe) ? +saved.hoehe : (spec.hoehe || 0);
    a.visible = true; a.ein = 1; a.stop();
    /* Die Marke merken: davon aus schlendert er, und dorthin kehrt er
       zurueck. Ohne festen Bezugspunkt wandert er ueber Zufallsschritte
       irgendwann quer durch den Raum. */
    a.marke = { x:spec.x, y:spec.y };
    a.schlendert = spec.schlendert || 0;
    a.schlenderT = 3 + Math.random() * 4;
    if (a.sitting){ a.state='idle'; a.path=null; }
    a.pose=newPose(); a.tp=newPose(); a.gest=0;
  });
  PL.act=null; PL.pose=newPose(); PL.tp=newPose(); PL.gest=0; PL.ein=1;
  rs.visited=true; nr.state.visited=true;
  G.camx = Math.max(0, Math.min(Math.max(0,ROOMW-LW), PL.x-LW/2));
  G.hover=null; G.selItem=null; G.roomEnteredAt=G.t; G.dlgPartner=null;
  G.katzeIdle = 55; G.katzeZeigt = 0;
  if (typeof nr.onEnter==='function') nr.onEnter(prev ? prev.id : null, !!fromLoad);
  if (!fromLoad) G.autosaveT = 0.35;
  return true;
}
/* ------------------------------------------------------------
   AUFTRITT
   ------------------------------------------------------------
   Ein Kapitel fing bisher damit an, dass alle schon dastanden. Das
   liest sich wie ein aufgeschlagenes Bild und nicht wie ein Anfang.
   Jetzt kommen sie herein: jede Figur startet ein Stueck neben ihrer
   Marke, laeuft hin und blendet dabei auf.

   Nicht von ausserhalb des Bildes -- dafuer ist auf einem Telefon
   kein Platz mehr, seit das Sichtfeld bis 1280 reicht und die Raeume
   1280 bis 1400 breit sind. Der Weg beginnt am Rand der begehbaren
   Flaeche, und die Einblendung deckt den Moment, in dem jemand dort
   auftaucht.

   Wer sitzt, bleibt sitzen. Der Fremde auf der Bruecke sitzt schon,
   bevor M. hinkommt -- das ist der Punkt der Szene. */
function figurenAuftritt(){
  if (!R || !R.area) return;
  function auftritt(a, zx, zy, zdir, weite){
    if (!a || !a.visible || a.sitting) return;
    var von = (zx > ROOMW * 0.5) ? zx + weite : zx - weite;
    var p = nearestWalkable(R.area, von, zy);
    if (!p) return;
    if (Math.abs(p.x - zx) < 45) return;   // kein Platz zum Anlaufen
    a.x = p.x; a.y = p.y; a.ein = 0;
    a.dir = (zx > p.x) ? 1 : -1;
    a.walkTo(R.area, R.nodes, zx, zy, zdir || a.dir);
  }
  var e = R.entry || { x:PL.x, y:PL.y, dir:1 };
  auftritt(PL, e.x, e.y, e.dir, 210);
  (R.npcs || []).forEach(function(spec){
    if (spec.when && !spec.when()) return;
    if (spec.sit) return;
    auftritt(actorById(spec.id), spec.x, spec.y, spec.dir, 165);
  });
}

/* ------------------------------------------------------------
   SCHLENDERN
   ------------------------------------------------------------
   Dedo stand in jedem Kapitel auf seiner Marke und ruehrte sich
   nicht. Zusammen damit, dass er zweimal fast am Bildrand stand,
   sah er aus wie hingestellt und vergessen.

   Er geht jetzt in einem kleinen Umkreis herum: ein paar Schritte,
   stehen bleiben, wieder ein paar Schritte. Waehrend eines
   Gesprächs oder einer Sequenz nicht -- wer wegläuft, während man
   mit ihm redet, ist keine Figur, sondern ein Fehler.

   Es gilt fuer jeden, der schlendert:0 nicht gesetzt hat, aber
   gesetzt ist es bisher nur bei ihm. */
function schlendernTick(dt){
  if (G.dlg || G.seq || G.cine || G.chapterCard || G.menu || G.roomChanging) return;
  for (var i = 0; i < ACTORS.length; i++){
    var a = ACTORS[i];
    if (a === PL || !a.visible || !a.schlendert || a.sitting) continue;
    if (a.path || a.sayLines || a.act){ a.schlenderT = 4 + Math.random() * 5; continue; }
    if (G.dlgPartner === a){ a.schlenderT = 4; continue; }
    a.schlenderT -= dt;
    if (a.schlenderT > 0) continue;
    a.schlenderT = 5 + Math.random() * 7;
    var m = a.marke || { x:a.x, y:a.y };
    var zx = m.x + (Math.random() * 2 - 1) * a.schlendert;
    var zy = m.y + (Math.random() * 2 - 1) * 14;
    var q = nearestWalkable(R.area, zx, zy);
    if (!q) continue;
    if (Math.abs(q.x - a.x) < 24) continue;    // lohnt den Weg nicht
    a.walkTo(R.area, R.nodes, q.x, q.y, Math.random() > 0.5 ? 1 : -1);
  }
}

function changeRoom(id, entry){
  if (!ROOMS[id] || G.roomChanging || G.seq || G.dlg) return false;
  PL.stop(); G.selItem=null; G.hover=null;
  G.roomChanging = { id:id, entry:entry, swapped:false };
  G.fadeRate = 3.6; G.fadeTo = 1;
  return true;
}
/* Raumwechsel als letzter Schritt einer Sequenz: erst die Sequenz
   beenden, dann wechseln -- sonst laeuft ein Schritt in den neuen Raum. */
function wechselNachSequenz(id, entry){
  G.seq=null; G.si=0; G.wait=0; G.dlg=null; G.dlgPartner=null;
  return changeRoom(id, entry);
}
function updateRoomChange(){
  var tr = G.roomChanging;
  if (!tr) return;
  if (!tr.swapped && G.fade >= 0.999){ bindRoom(tr.id, tr.entry); tr.swapped = true; G.fadeTo = 0; }
  else if (tr.swapped && G.fade <= 0.001){ G.roomChanging = null; G.fadeRate = 0.8; }
}
