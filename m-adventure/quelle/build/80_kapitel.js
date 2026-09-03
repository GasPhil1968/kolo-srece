
/* ============================================================
   Sektion 19  ZEITWECHSEL
   ------------------------------------------------------------
   Uebergaenge sind immer natuerlich: ein Geruch, ein Ton, der
   Wind. Nie ein harter Schnitt, nie ein Menue, nie bewusstes
   Nachdenken. Die Rueckkehr in die Gegenwart endet jedes Mal mit
   einer kleinen, stillen Reaktion von M.
   ============================================================ */
var KAP_DATEN = {
  1:{ raum:'weide',    ident:'mKind',     motiv:'karren',
      zeilen:[{text:'ERSTES KAPITEL',size:20,color:'#a89a78'},
              {text:'Rosko Polje',size:40,color:'#e8dcc0'},
              {text:'1953',size:24,color:'#c2b291',italic:true}],
      zitat:'Wir waren nicht arm. Arm waren die, die weggegangen sind.' },
  2:{ raum:'mostar',   ident:'mSchueler', motiv:'fahnen',
      zeilen:[{text:'ZWEITES KAPITEL',size:20,color:'#a89a78'},
              {text:'Mostar',size:40,color:'#e8dcc0'},
              {text:'1955',size:24,color:'#c2b291',italic:true}],
      zitat:'Begeisterung war eine Schulaufgabe. Man konnte sie bestehen oder nicht.' },
  3:{ raum:'kaserne',  ident:'mMarine',   motiv:'schiff',
      zeilen:[{text:'DRITTES KAPITEL',size:20,color:'#a89a78'},
              {text:'Die Marine',size:40,color:'#e8dcc0'},
              {text:'Adria, 1960er',size:24,color:'#c2b291',italic:true}],
      zitat:'In der Armee gibt es für jedes Problem drei Vorschriften und keine Zeit.' },
  4:{ raum:'sarajevo', ident:'mSarajevo', motiv:'fenster',
      zeilen:[{text:'VIERTES KAPITEL',size:20,color:'#a89a78'},
              {text:'Sarajevo',size:40,color:'#e8dcc0'},
              {text:'1970er',size:24,color:'#c2b291',italic:true}],
      zitat:'Eine Wohnung bekam man nicht. Eine Wohnung organisierte man.' },
  5:{ raum:'werk',     ident:'mWerk',     motiv:'band',
      zeilen:[{text:'FÜNFTES KAPITEL',size:20,color:'#a89a78'},
              {text:'Das Werk',size:40,color:'#e8dcc0'},
              {text:'Deutschland, 1970er',size:24,color:'#c2b291',italic:true}],
      zitat:'Ich habe zwei Jahre gebraucht, bis ich gemerkt habe, dass sie nicht über mich reden.' },
  6:{ raum:'telefon',  ident:'mMann',     motiv:'zelle',
      zeilen:[{text:'SECHSTES KAPITEL',size:20,color:'#a89a78'},
              {text:'Vier Markstücke',size:40,color:'#e8dcc0'},
              {text:'Deutschland, Winter 1991',size:24,color:'#c2b291',italic:true}],
      zitat:'Das Schlimmste war nicht, was im Fernsehen kam. Das Schlimmste war das Freizeichen.' },
  7:{ raum:'bau',      ident:'mAlt',      motiv:'rohbau',
      zeilen:[{text:'SIEBTES KAPITEL',size:20,color:'#a89a78'},
              {text:'Der Hausbau',size:40,color:'#e8dcc0'},
              {text:'Podaca, 2004 bis 2018',size:24,color:'#c2b291',italic:true}],
      zitat:'Ein Haus baut man nicht in einem Sommer. Man baut es in vierzehn.' }
};

/* Der Ausloeser: ein Satz, ein Geruch, ein Ton. Danach die
   Kapitelkarte, danach erst der Raum. */
var KAP_AUSLOESER = {
  1:[ { say:[null,'Ich reibe ein Feigenblatt zwischen den Fingern.'] },
      { wait:0.9 },
      { say:[null,'Milchsaft. Bitter. Und plötzlich riecht es nach trockener Erde und nach Ochse.'] },
      { wait:1.2 } ],
  2:[ { say:[null,'Aus dem Radio kommt ein Marsch.'] },
      { wait:0.9 },
      { say:[null,'Blechbläser, drei Viertel, immer dieselben acht Takte.'] },
      { wait:0.8 },
      { say:[null,'Ich kenne ihn. Ich kenne ihn auswendig, und ich habe ihn nie gelernt.'] },
      { wait:1.2 } ],
  3:[ { say:[null,'Ich lege die Hand auf den Deckel.'] },
      { wait:1.0 },
      { say:[null,'Das Holz ist warm. Es war damals kalt, und es hat nach Farbe gerochen.'] },
      { wait:1.3 } ],
  4:[ { say:[null,'Der Ball rollt gegen meinen Fuß.'] },
      { wait:0.8 },
      { say:[null,'Ich stoppe ihn, ohne hinzusehen. Das kann ich noch.'] },
      { wait:1.0 },
      { say:[null,'Und auf einmal ist es kalt und ich stehe vor einem Betonring in Grbavica.'] },
      { wait:1.2 } ],
  5:[ { say:[null,'Ich sehe auf meine Hände.'] },
      { wait:1.0 },
      { say:[null,'Der Nagel am linken Zeigefinger ist seit 1974 anders gewachsen.'] },
      { wait:1.2 } ],
  6:[ { say:[null,'Drinnen klingelt das Telefon.'] },
      { wait:1.0 },
      { say:[null,'L. geht ran. Sie sagt zweimal ja und einmal gut.'] },
      { wait:0.9 },
      { say:[null,'Es gab eine Zeit, da war ein Telefon keine Selbstverständlichkeit, sondern eine Rechnung in Münzen.'] },
      { wait:1.2 } ],
  7:[ { say:[null,'Ich fahre mit der Hand über die Mauer.'] },
      { wait:0.9 },
      { say:[null,'Der dritte Stein von links wackelt. Er hat immer gewackelt.'] },
      { wait:1.2 } ]
};

/* Vor zwei Kapiteln steht ein Bruch, der zu gross ist, um ihn zu
   spielen: die Abreise nach Deutschland und der Kriegsbeginn. Beide
   laufen als Zwischensequenz, bevor die Kapitelkarte kommt. */

/* ============================================================
   DAS KAPITEL-INTRO
   ------------------------------------------------------------
   Vor jedem Kapitel stand bisher eine Karte: Titel, Jahreszahl,
   ein Zitat, weiter per Klick. Das benennt ein Kapitel, aber es
   erzaehlt keines. Wer nach zwei Wochen weiterspielt, weiss
   nicht mehr, was im letzten passiert ist -- und schlimmer: er
   weiss nicht, worum es jetzt geht und worauf er achten soll.

   Das Intro macht daraus vier Einstellungen: ein Rueckblick auf
   das, was war, die Karte in der Mitte, und danach zweimal das,
   was jetzt ansteht. Der Ausblick hat zwei Einstellungen und der
   Rueckblick eine -- woher man kommt, ist die kuerzere Haelfte.

   Es laeuft als gewoehnliche Zwischensequenz: gleiche Letterbox,
   gleiche Ueberblendung, Klick geht weiter, Escape ueberspringt.
   ============================================================ */

/* Eine Einstellung, was im Kapitel davor geschehen ist. Bei
   Kapitel 1 gibt es kein Davor -- dort steht, wie die Erinnerung
   ueberhaupt aufgegangen ist. */
var KAP_RUECKBLICK = {
  1:['Der Geruch von Wacholder hat mich zurückgeworfen.',
     'Fünfundsechzig Jahre, und er ist sofort wieder da.'],
  2:['Der Karren fuhr wieder, das Mehl kam ins Haus.',
     'Was ich dafür hergegeben habe, hat mich später mehr beschäftigt als der Hunger.'],
  3:['In Mostar habe ich gelernt, dass man mitmachen kann, ohne dabei zu sein.',
     'Das hat sich später als brauchbar erwiesen. Öfter, als mir lieb ist.'],
  4:['Die Kiste kam mit mir nach Hause, und gefragt hat nie jemand danach.',
     'Solche Dinge bekommt man, wenn man nicht danach fragt.'],
  5:['In Sarajevo hatten wir eine Adresse, eine Arbeit und einen Winter ohne Kohle.',
     'Es hat gereicht. Genau so weit, wie es reichen musste.'],
  6:['In der Halle war ich irgendwann der, den man holt, wenn eine Maschine steht.',
     'Meinen Namen hat trotzdem keiner richtig ausgesprochen.'],
  7:['Der Krieg ist vorbeigegangen wie Wetter: über andere.',
     'Ich habe ihn in einer beheizten Wohnung überstanden und mich davon nie ganz freigesprochen.']
};

/* Zwei Einstellungen, worum es jetzt geht. Die erste setzt Ort und
   Jahr, die zweite sagt, was im Weg steht -- ohne die Loesung zu
   verraten. Ein Kapitel soll man verstanden haben, bevor es
   anfaengt; geloest werden will es trotzdem selbst. */
var KAP_AUSBLICK = {
  1:[['Rosko Polje hatte elf Häuser und keinen Strom.',
      'Im Sommer 1953 war ich elf Jahre alt, und der Karren stand seit drei Tagen.'],
     ['Ohne Karren kein Mehl, ohne Mehl kein Brot.',
      'An dem Tag habe ich gelernt, dass man Dinge nicht findet, sondern eintauscht.']],
  2:[['Zwei Jahre später ging ich in Mostar zur Schule.',
      'Dreißig Kilometer von zu Hause und eine andere Welt.'],
     ['Am dritten Mai fuhr Tito durch die Stadt, und die Klasse sollte winken.',
      'Begeisterung stand auf dem Stundenplan. Ich hatte kein Fähnchen.']],
  3:[['Mit achtzehn kam ich zur Marine. Adria, graues Schiff, weiße Farbe.',
      'Vier Jahre Farbe, Appell und Warten.'],
     ['Was ich aus diesen Jahren mitgenommen habe, war eine ausgemusterte Munitionskiste.',
      'Sie hat mir nie gehört. Sie steht heute noch in meiner Garage.']],
  4:[['Danach Sarajevo. Die Arbeit war schnell gefunden, das Zimmer nicht.',
      'Auf der Liste stand ich auf Platz zweihundertelf, und die Liste bewegte sich nicht.'],
     ['Vier Seiten Antrag, drei Fragen doppelt, ein fehlender Stempel.',
      'Ich musste herausfinden, wer den Stempel hat — und was ihm fehlt.']],
  5:[['1971 bin ich nach Deutschland gefahren. Für zwei Jahre, habe ich gesagt.',
      'Es wurden sechsunddreißig.'],
     ['Am ersten Tag bekam ich einen Zettel: sieben Wörter in deutscher Schreibschrift.',
      'Ich erkannte die Zahl zwölf und einen Pfeil. Der Rest war ein Zaun.']],
  6:[['Winter 1991. Im Fernsehen liefen Orte, deren Namen hier niemand aussprechen konnte.',
      'Meine Leute wohnen bei Split. Ein Telefon hatten wir nicht.'],
     ['An der Ecke steht eine Zelle, und in meiner Tasche sind vier Markstücke.',
      'Jedes ist eine Minute, wenn die Leitung steht.']],
  7:[['2004. Podaca, zweihundert Meter Land zwischen einem Berg und dem Wasser.',
      'Ich baue ein Haus. Ich bin zweiundsechzig und habe Zeit.'],
     ['Jure sagt, ich soll tragen lassen. Jure sagt viel.',
      'Die Blase in der Wasserwaage soll in diesem Haus zum ersten Mal in der Mitte stehen.']]
};

/* Baut die Einstellungen. Die Motive kommen aus den Kapitelkarten:
   der Rueckblick bekommt das des vorigen Kapitels, alles danach das
   des neuen. So sieht man den Wechsel, statt ihn zu lesen. */
function kapitelIntro(n){
  var d = KAP_DATEN[n]; if (!d) return [];
  var vor = KAP_DATEN[n-1];
  var mNeu = KAP_MOTIVE[d.motiv] || null;
  var mVor = (vor && KAP_MOTIVE[vor.motiv]) || mNeu;
  /* Das Motiv wird abgedunkelt, sonst steht der Text darauf und nicht
     davor. Wichtig: die vorhandene Deckung wird multipliziert, nicht
     ueberschrieben -- die Sequenz blendet Einstellungen ineinander,
     und ein festes globalAlpha wuerde diese Ueberblendung aushebeln.

     Die Karte bekommt zusaetzlich einen weichen Schleier hinter dem
     Titelblock. Ein Motiv wie das Schiff hat helle Stellen genau
     dort, wo die Zeile 'DRITTES KAPITEL' steht -- gleichmaessiges
     Abdunkeln nimmt dem ganzen Bild Licht und loest das nicht. */
  function gedaempft(fn, versatz, tiefe, karte){
    return function(t){
      var vorher = ctx.globalAlpha;
      if (fn) fn(t + (versatz || 0));
      ctx.globalAlpha = vorher * tiefe;
      ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, LW, LH);
      ctx.globalAlpha = vorher;
      if (karte) weicherSchleier(LH/2 - 200, LH/2 + 190, 0.52);
      ctx.globalAlpha = vorher;
    };
  }
  var shots = [];
  if (KAP_RUECKBLICK[n])
    shots.push({ dauer:9.0, draw:gedaempft(mVor, 0, 0.46), text:KAP_RUECKBLICK[n] });
  /* Die Karte traegt den Titel, nicht das Bild -- 0,44 liess vom Motiv
     zu viel stehen, und die kleine Zeile 'DRITTES KAPITEL' lag genau
     auf Mast und Reling. Bei 0,66 ist das Motiv nur noch angedeutet,
     und darum geht es an dieser Stelle auch. */
  shots.push({ dauer:8.0, draw:gedaempft(mNeu, 0, 0.66, true), karte:d });
  (KAP_AUSBLICK[n] || []).forEach(function(zeilen, i){
    shots.push({ dauer:9.0, draw:gedaempft(mNeu, 4 + i * 5, 0.42), text:zeilen });
  });
  return shots;
}

/* Karte und Auftritt in einem Schritt: erst das Intro, dann der Raum,
   und die Figuren laufen hinein statt schon dazustehen. */
function starteKapitel(n, danach){
  var d = KAP_DATEN[n];
  starteCine(kapitelIntro(n), function(){
    setPlayerIdentity(d.ident);
    bindRoom(d.raum, ROOMS[d.raum].entry, true);
    figurenAuftritt();
    G.fade = 1; G.fadeTo = 0; G.fadeRate = 0.9;
    if (danach) danach();
  });
}

var KAP_BRUCH = { 5:'abreise', 6:'krieg' };
function triggerKapitel(n){
  var d = KAP_DATEN[n]; if (!d) return;
  var schritte = (KAP_AUSLOESER[n] || []).map(function(s){
    if (s.say && s.say[0] === null) return { say:[PL, s.say[1]] };
    return s;
  });
  var karte = function(){ starteKapitel(n); };
  schritte.push({ fn:function(){
    G.seq = null; G.si = 0; G.wait = 0;
    var bruch = KAP_BRUCH[n];
    if (bruch && CINES[bruch]) starteCine(CINES[bruch], karte);
    else karte();
  } });
  play(schritte);
}

/* Rueckkehr in die Gegenwart. Immer mit einer kleinen, stillen
   Reaktion -- sie zeigt, dass die Erinnerung etwas bewegt hat, ohne
   dass jemand darueber redet. */
var KAP_RUECKKEHR = {
  1:['Der Splint. Ich habe ihn jahrelang aufgehoben und dann verloren.',
     'Man hebt die falschen Dinge auf.',
     'Und die Melodie ist noch da. Die hat nie jemand aufgehoben, die war einfach da.'],
  2:['Ich habe gewunken. Das habe ich nie jemandem erzählt.',
     'Es war ein Fähnchen aus einer Zeitung. Genau genommen habe ich dem Mann Fußballergebnisse entgegengehalten.'],
  3:['Die Kiste. Sie hat mir nie gehört, und sie hat mich siebenundvierzig Jahre begleitet.'],
  4:['Zwei Zimmer, dritter Stock. Der erste Ort, der uns gehört hat, ohne uns zu gehören.'],
  5:['Zwölf Millimeter.','Ich habe drei Wochen gebraucht, um zu verstehen, was auf dem Zettel stand. Danach habe ich elf Jahre dort gearbeitet.'],
  6:['Vier Markstücke.','Ich habe danach nie wieder Kleingeld weggegeben, ohne nachzusehen, was es ist.'],
  7:['Das Haus steht. Es hat vierzehn Sommer gedauert und es steht.']
};
function beendeKapitel(n){
  setFlag('kap' + n + 'Fertig', true);
  leereInventar();
  var reaktion = (KAP_RUECKKEHR[n] || []).slice();
  G.seq = null; G.si = 0; G.wait = 0; G.dlg = null;
  setPlayerIdentity('mAlt');
  bindRoom('terrasse', { x:640, y:452, dir:-1 }, true);
  G.fade = 1; G.fadeTo = 0; G.fadeRate = 0.55;
  var schritte = [ { wait:1.6 } ];
  for (var i = 0; i < reaktion.length; i++){ schritte.push({ say:[PL, reaktion[i]] }); schritte.push({ wait:0.5 }); }
  schritte.push({ fn:function(){
    if (naechstesKapitel() === null){
      setFlag('alleKapitel', true);
      play([
        { wait:0.8 },
        { say:[NPC.luka, 'Deda.'] },
        { wait:0.7 },
        { say:[NPC.luka, 'Du hast die ganze Zeit auf die Kiste geschaut.'] },
        { wait:1.2 },
        { say:[PL, 'Habe ich?'] },
        { wait:1.0 }
      ]);
    }
  } });
  play(schritte);
}

/* ============================================================
   Sektion 20  SZENEN
   ============================================================ */

/* Kapitel 2: der Aufmarsch. Leise Satire auf verordnete
   Begeisterung -- die Pointe ist, dass M. mitmacht. */
function tikoSzene(){
  setFlag('gewunken', true);
  NPC.tiko.visible = true; NPC.tiko.x = 1180; NPC.tiko.y = 400; NPC.tiko.dir = -1;
  NPC.tiko.hoehe = 60;
  play([
    { say:[NPC.lehrer, 'Aufstellen! Und Fähnchen hoch, alle!'] },
    { wait:0.9 },
    { say:[PL, 'Ich halte ein Stück Zeitung an einem Stecken in die Luft.'] },
    { wait:0.9 },
    { say:[NARR, 'Auf der Rückseite standen die Fußballergebnisse vom Sonntag. Sarajevo hatte eins zu drei verloren.'] },
    { wait:1.2 },
    { say:[NPC.tiko, '...'] },
    { wait:1.0 },
    { say:[NPC.tiko, 'Braver Junge.'] },
    { wait:1.4 },
    { say:[PL, 'Er hat mich angesehen. Zwei Sekunden. Vielleicht eine.'] },
    { wait:0.9 },
    { say:[NARR, 'Er hat mich nicht angesehen. Ich stand in der dritten Reihe und war einen Meter fünfzig groß.'] },
    { wait:1.0 },
    { say:[NPC.lehrer, 'Winken! Alle!'] },
    { wait:0.8 },
    { say:[PL, 'Ich winke.'] },
    { wait:1.4 },
    { fn:function(){ NPC.tiko.visible = false; setFlag('kap2Andenken', true); beendeKapitel(2); } }
  ]);
}

/* Kapitel 3: die Ansprache des Admirals ueber Disziplin und Schnaps
   als Hoehepunkt. Absurde Militaerkomoedie, ohne Klamauk. */
function admiralSzene(){
  setFlag('admiralGehoert', true);
  NPC.admiral.visible = true; NPC.admiral.x = 1240; NPC.admiral.y = 448; NPC.admiral.dir = -1;
  play([
    { walk:[PL, 1180, 450, 1] },
    { say:[NPC.zdravko, 'Der Admiral. Stillgestanden, Augen geradeaus, und niemand atmet.'] },
    { wait:1.0 },
    { say:[NPC.admiral, 'Männer.'] },
    { wait:1.2 },
    { say:[NPC.admiral, 'Disziplin ist wie Rakija.'] },
    { wait:1.4 },
    { say:[NPC.admiral, 'Zu wenig, und es passiert nichts. Zu viel, und es passiert alles gleichzeitig.'] },
    { wait:1.5 },
    { say:[NPC.admiral, 'Wer das begriffen hat, ist Soldat. Wer es nicht begriffen hat, ist Offizier.'] },
    { wait:1.6 },
    { say:[NPC.zdravko, 'Genosse Admiral, Sie sind Offizier.'] },
    { wait:1.3 },
    { say:[NPC.admiral, 'Eben.'] },
    { wait:1.6 },
    { say:[NPC.admiral, 'Und wer hat heute die Fahne gehisst, den Bordstein gestrichen und die Kammer verschlossen? Gleichzeitig?'] },
    { wait:1.2 },
    { say:[PL, 'Matrose M., Genosse Admiral.'] },
    { wait:1.2 },
    { say:[NPC.admiral, 'Wie?'] },
    { wait:1.0 },
    { say:[PL, 'Nach Vorschrift.'] },
    { wait:1.5 },
    { say:[NPC.admiral, 'Narednik. Geben Sie dem Mann eine Kiste.'] },
    { wait:1.2 },
    { say:[NPC.zdravko, 'Eine... Kiste, Genosse Admiral?'] },
    { wait:1.0 },
    { say:[NPC.admiral, 'Wir haben keine Orden. Wir haben Kisten.'] },
    { wait:1.6 },
    { fn:function(){ INV.add('kiste'); } },
    { say:[NARR, 'Ich habe die Kiste bekommen und niemand hat je aufgeschrieben, wofür.'] },
    { wait:1.0 },
    { say:[NARR, 'Sie steht heute auf meiner Terrasse.'] },
    { wait:1.4 },
    { fn:function(){ NPC.admiral.visible = false; beendeKapitel(3); } }
  ]);
}

/* Kapitel 4: die unsympathische Begegnung vor dem Stadion. Der
   historische Gast bleibt bewusst im Hintergrund und unhoeflich. */
function safetSzene(){
  setFlag('safetGetroffen', true);
  play([
    { say:[PL, 'Entschuldigung. Meine Jungs — könnten Sie...'] },
    { wait:0.9 },
    { say:[NPC.safet, 'Ja ja.'] },
    { wait:1.1 },
    { say:[PL, 'Ich habe kein Papier dabei. Vielleicht auf den...'] },
    { wait:0.9 },
    { say:[NPC.safet, 'Ich hab Training.'] },
    { wait:1.4 },
    { fn:function(){ NPC.safet.walkTo(R.area, R.nodes, 1330, 444, 1); } },
    { wait:1.6 },
    { say:[PL, 'Er hat nicht gelogen. Er hatte wirklich Training.'] },
    { wait:1.0 },
    { say:[NARR, 'Zwanzig Jahre später haben meine Söhne mir erzählt, was für ein großartiger Spieler er war. Ich habe zugestimmt.'] },
    { wait:1.2 },
    { say:[NARR, 'Man kann beides gleichzeitig, und die meisten Leute merken es nicht einmal.'] },
    { wait:1.2 }
  ]);
}

/* Kapitel 5: die Kantine. Die Studentenunruhen laufen als
   Hintergrundgeraeusch -- M. versteht Bruchstuecke, der Spieler auch.
   Das ist historisch ehrlicher als eine Szene mit Dutschke darin. */
function kantineSzene(){
  setFlag('kantineGehoert', true);
  play([
    { say:[PL, 'Ich mache die Tür einen Spalt auf.'] },
    { wait:0.9 },
    { say:[NARR, '„...schke hat gesagt, dass die Verhältnisse..."'] },
    { wait:0.9 },
    { say:[NARR, '„...quatsch, der liegt im Krankenhaus, das war doch..."'] },
    { wait:0.9 },
    { say:[NARR, '„...Springer... und ihr wollt mir erzählen..."'] },
    { wait:1.1 },
    { say:[PL, 'Ich verstehe: „gesagt". „Krankenhaus". „ihr".'] },
    { wait:1.2 },
    { say:[PL, 'Und dass sie sich streiten. Das versteht man in jeder Sprache.'] },
    { wait:1.3 },
    { say:[NPC.yilmaz, 'Politik.'] },
    { wait:0.8 },
    { say:[PL, 'Über was?'] },
    { wait:0.9 },
    { say:[NPC.yilmaz, 'Über Studenten. Studenten haben Zeit.'] },
    { wait:1.3 },
    { say:[NPC.yilmaz, 'Wir haben Schicht.'] },
    { wait:1.5 },
    { fn:function(){ INV.add('ausweis'); } },
    { say:[NPC.krause, 'Herr... M. So. Ihr Ausweis. Willkommen im Betrieb.'] },
    { wait:1.3 },
    { say:[PL, 'Danke.'] },
    { wait:0.7 },
    { say:[NARR, 'Das war das erste deutsche Wort, das ich hundertprozentig richtig verwendet habe.'] },
    { wait:1.3 },
    { fn:function(){ beendeKapitel(5); } }
  ]);
}

/* Kapitel 6a: der Fernseher im Schaufenster. Der historische Gast
   spricht, aber man hoert ihn durch Glas. */
function tudzmanicSzene(){
  setFlag('tudzGehoert', true);
  play([
    { say:[PL, 'Vier Geräte, vier Mal derselbe Mann.'] },
    { wait:1.0 },
    { say:[NARR, 'Der Ton ist aus. Man sieht nur, wie er die Hand hebt und wieder senkt.'] },
    { wait:1.2 },
    { say:[NARR, 'Unten läuft Schrift durch, auf Deutsch, und die verstehe ich inzwischen.'] },
    { wait:1.4 },
    { say:[PL, 'Ich stehe hier im Mantel vor einem Schaufenster und lese, was mit meinem Dorf passiert.'] },
    { wait:1.5 },
    { say:[PL, 'Hinter mir gehen Leute einkaufen.'] },
    { wait:1.4 },
    { say:[NARR, 'Sie hätten auch nichts tun können. Ich war ja auch nur einkaufen.'] },
    { wait:1.4 }
  ]);
}

/* Kapitel 6b: Optionaler Perspektivwechsel. Eine kurze Szene aus
   L.s Sicht -- damit sie mehr ist als Kulisse. Der Spieler fuehrt
   fuer eine Minute sie, nicht ihn. */
function lenaSzene(){
  setFlag('lenaKommt', true);
  setPlayerIdentity('lena');
  // M. wird fuer diese Szene zur Nebenfigur.
  NPC.jure.visible = false;
  play([
    { fn:function(){
        /* M. bleibt im Bild: er steht bei der Zelle, wo ihn der Spieler
           eben noch gefuehrt hat. Nur die Kamera wechselt die Seite. */
        NPC.mann.visible = true; NPC.mann.x = 470; NPC.mann.y = 450; NPC.mann.dir = -1;
        NPC.mann.pose = newPose(); NPC.mann.tp = newPose();
        PL.x = 180; PL.y = 448; PL.dir = 1; G.camx = 0;
      } },
    { say:[PL, 'Er steht seit zwanzig Minuten bei der Zelle.'] },
    { wait:1.2 },
    { say:[PL, 'Ich habe von oben gesehen, wie er den Hörer aufgelegt hat und stehen geblieben ist.'] },
    { wait:1.4 },
    { walk:[PL, 380, 450, 1] },
    { wait:0.6 },
    { say:[PL, 'Und?'] },
    { wait:1.2 },
    { say:[PL, 'Er sagt: alles gut. Er sagt immer alles gut.'] },
    { wait:1.4 },
    { dlg:'lena_entscheidung' }
  ]);
}
function lenaEnde(gesagt){
  var schritte = gesagt
    ? [ { say:[PL, 'Ich habe es im Radio gehört. Vor dir.'] },
        { wait:1.2 },
        { say:[PL, 'Rosko Polje. Sie haben es im Radio gesagt.'] },
        { wait:1.6 },
        { say:[PL, 'Er hat nichts gesagt. Er hat mir den Karton gegeben, damit ich etwas zu tragen habe.'] },
        { wait:1.6 },
        { say:[NARR, 'Sie hat es mir gesagt. Ich habe siebenundzwanzig Jahre so getan, als hätte ich es zuerst gewusst.'] },
        { wait:1.6 } ]
    : [ { say:[PL, 'Ich sage nichts.'] },
        { wait:1.4 },
        { say:[PL, 'Er hat heute genug telefoniert.'] },
        { wait:1.5 },
        { say:[PL, 'Wir gehen zusammen hoch. Er trägt den Karton, ich die Tüte.'] },
        { wait:1.6 },
        { say:[NARR, 'Sie hat es mir erst 2003 erzählt. Ich habe nicht gefragt, warum nicht früher.'] },
        { wait:1.6 } ];
  schritte.push({ fn:function(){ NPC.mann.visible = false; setPlayerIdentity('mMann'); beendeKapitel(6); } });
  play(schritte);
}

/* Kapitel 7: die Abendbegegnung. Eine Symbolfigur der Erinnerung,
   nie beim Namen genannt. Danach kehrt Baba Roga wieder und
   verliert wortlos ihren Schrecken. */
function gestaltSzene(){
  setFlag('gestaltGesprochen', true);
  NPC.gestalt.visible = true; NPC.gestalt.x = 1300; NPC.gestalt.y = 448; NPC.gestalt.dir = -1;
  play([
    { walk:[NPC.gestalt, 1180, 448, -1] },
    { say:[PL, 'Guten Abend.'] },
    { wait:1.0 },
    { say:[NPC.gestalt, 'Guten Abend. Sie bauen.'] },
    { wait:1.0 },
    { say:[PL, 'Seit elf Jahren.'] },
    { wait:1.2 },
    { say:[NPC.gestalt, 'Das ist keine lange Zeit für ein Haus aus Stein.'] },
    { wait:1.5 },
    { say:[PL, 'Sind Sie vom Amt?'] },
    { wait:1.2 },
    { say:[NPC.gestalt, 'Nein.'] },
    { wait:1.4 },
    { say:[NPC.gestalt, 'Darf ich?'] },
    { wait:0.9 },
    { fn:function(){ NPC.gestalt.doAct('reach', 1.2); } },
    { wait:1.4 },
    { say:[NPC.gestalt, 'Sie haben ihn nicht behauen.'] },
    { wait:1.1 },
    { say:[PL, 'Er passt so.'] },
    { wait:1.3 },
    { say:[NPC.gestalt, 'Ja. Das ist der schwierigere Weg.'] },
    { wait:1.6 },
    { say:[NPC.gestalt, 'Man muss länger suchen, welcher wohin gehört. Dafür muss man nichts wegnehmen.'] },
    { wait:1.8 },
    { say:[PL, 'Sind Sie Steinmetz?'] },
    { wait:1.4 },
    { say:[NPC.gestalt, 'Ich war einer. Lange her.'] },
    { wait:1.6 },
    { say:[NPC.gestalt, 'Gute Nacht.'] },
    { walk:[NPC.gestalt, 1360, 448, 1] },
    { wait:1.0 },
    { fn:function(){ NPC.gestalt.visible = false; setFlag('rogaFinale', true); } },
    { say:[PL, 'Am Hang steht noch jemand.'] },
    { wait:1.6 },
    { say:[PL, 'Eine alte Frau mit einem Stock. Sie geht denselben Weg hinunter.'] },
    { wait:1.8 },
    { say:[NARR, 'Als Kind habe ich mich vor ihr gefürchtet. An diesem Abend habe ich ihr nachgesehen und gedacht: sie sollte nicht allein im Dunkeln gehen.'] },
    { wait:2.0 },
    { fn:function(){ INV.add('zollstock'); beendeKapitel(7); } }
  ]);
}

/* ============================================================
   DAS FINALE
   ============================================================ */
function oeffneKiste(){
  setFlag('kisteOffen', true);
  play([
    { say:[PL, 'Also gut.'] },
    { wait:1.2 },
    { fn:function(){ PL.doAct('take', 1.2); } },
    { say:[PL, 'Die Schnalle klemmt. Sie hat immer geklemmt.'] },
    { wait:1.4 },
    { say:[NPC.luka, 'Was ist das?'] },
    { wait:0.9 },
    { say:[PL, 'Eine Mütze.'] },
    { wait:1.1 },
    { say:[NPC.luka, 'Und das?'] },
    { wait:0.9 },
    { say:[PL, 'Briefe. Von deiner Baka, als ich in Deutschland war.'] },
    { wait:1.5 },
    { say:[NPC.luka, 'Und das Foto?'] },
    { wait:1.4 },
    { say:[PL, 'Das sind elf Leute vor einem Steinhaus.'] },
    { wait:1.6 },
    { say:[NPC.luka, 'Wer davon bist du?'] },
    { wait:1.8 },
    { say:[PL, 'Der Kleine links. Ohne Schuhe.'] },
    { wait:2.0 },
    { fn:function(){ INV.add('foto'); setFlag('erzaehltZumErstenMal', true); } },
    { say:[NARR, 'Und dann habe ich erzählt. Zum ersten Mal, und es hat vier Stunden gedauert.'] },
    { wait:1.6 },
    { say:[NPC.luka, 'Deda. Können wir da mal hinfahren?'] },
    { wait:2.0 },
    { say:[PL, '...'] },
    { wait:1.4 },
    { fn:function(){ setFlag('finaleBereit', true); } },
    { say:[NARR, 'Die Autoschlüssel liegen drinnen auf dem Kühlschrank. Sie liegen dort seit 2006.'] },
    { wait:1.8 }
  ]);
}
function nimmSchluessel(){
  setFlag('finaleFertig', true);
  play([
    { say:[PL, 'Ich hole die Schlüssel.'] },
    { wait:1.4 },
    { say:[NPC.luka, 'Jetzt?'] },
    { wait:1.0 },
    { say:[PL, 'Jetzt.'] },
    { wait:1.8 },
    { say:[NARR, 'Von Podaca nach Rosko Polje sind es hundertsechzig Kilometer und vierundsechzig Jahre.'] },
    { wait:2.0 },
    { say:[NARR, 'Wir sind am Nachmittag losgefahren. L. hat Wasser eingepackt und nichts gefragt.'] },
    { wait:2.2 },
    { fn:function(){
        G.seq = null; G.si = 0; G.wait = 0;
        starteCine(CINES.fahrt, function(){ G.over = true; G.endCard = 0; });
      } }
  ]);
}
