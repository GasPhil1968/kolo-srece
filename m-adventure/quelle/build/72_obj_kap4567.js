
/* ============================================================
   KAPITEL 4 · SARAJEVO, 1970er
   ------------------------------------------------------------
   Spielbares Ziel: eine Wohnung ueber Beziehungen, Tausch-
   geschaefte und Geduld organisieren. Man kauft nichts.
   ============================================================ */
var OBJ_SARAJEVO = [
  { id:'amt', name:'Das Amt', hs:[90,58,670,302], go:{x:440,y:444},
    ansehen:function(){
      schauen('amt',
        'Wohnungsamt. Vierundzwanzig Fenster, und hinter jedem sitzt einer, der nicht zuständig ist.',
        'Achtzehn Fenster. Ich habe sie später einmal gezählt, als ich wieder dort war.');
    },
    benutzen:function(){ redeSchalter(); } },

  { id:'schalter', name:'Schalter', hs:[430,220,100,124], go:{x:500,y:442},
    ansehen:function(){
      if (FLAG.antragGestempelt) return say(PL, 'Der Mann hinter dem Schalter sieht mich zum ersten Mal an wie einen Menschen.');
      say(PL, 'Ein Schalter mit einer Öffnung, die genau so hoch ist, dass man sich bücken muss.');
    },
    reden:function(){ redeSchalter(); },
    benutzen:function(){ redeSchalter(); } },

  { id:'kiosk', name:'Kiosk', hs:[688,188,154,210], go:{x:760,y:450},
    ansehen:function(){
      schauen('kiosk',
        'Zeitungen, Zigaretten, Kaffee, Streichhölzer, Rasierklingen. Und Neuigkeiten, die teurer sind als alles andere.',
        'Kaffee gab es nicht immer. In manchen Monaten gab es keinen, und dann gab es auch keine Neuigkeiten.');
    },
    reden:function(){ openDlg('kiosk', null); },
    nehmen:function(){
      if (FLAG.kaffeeBekommen && !INV.has('kaffee') && !FLAG.kaffeeAbgelegt){
        INV.add('kaffee'); say(PL, 'Ein Päckchen Kaffee. Er hat es mir hingelegt, ohne etwas zu sagen.'); return;
      }
      say(PL, 'Ohne Geld nehme ich hier nichts.');
    } },

  { id:'fica', name:'Der Fića', hs:[844,268,190,126], go:{x:920,y:456},
    ansehen:function(){
      if (FLAG.ficaRepariert) return say(PL, 'Er läuft. Nicht gut, aber er läuft.');
      schauen('fica',
        'Ein Zastava 750, Haube offen. Er steht hier seit drei Tagen und der Kioskmann redet von nichts anderem.',
        'Vier Tage. Und er hat von nichts anderem geredet, weil er sonst über die Wohnung hätte reden müssen, die er nicht bekommt.');
    },
    benutzen:function(){
      if (FLAG.ficaRepariert){ say(PL, 'Fertig.'); return; }
      if (!INV.has('ersatzteil')){ say(PL, 'Die Düse ist verstopft. Man bräuchte eine neue.'); return; }
      if (!FLAG.ficaGehoert){ say(PL, 'Erst soll er mir sagen, was er hat. Sonst repariere ich das Falsche.'); return; }
      INV.drop('ersatzteil'); setFlag('ficaRepariert', true);
      play([
        { fn:function(){ PL.doAct('take', 1.1); } },
        { say:[PL, 'Düse raus, Düse rein.'] },
        { wait:0.9 },
        { say:[PL, 'Anlassen.'] },
        { wait:0.8 },
        { say:[NARR, 'Er ist beim dritten Mal angesprungen. Das ist bei einem Fića ein sehr gutes Ergebnis.'] },
        { fn:function(){ setFlag('gefallenGetan', true); } }
      ]);
    } },

  { id:'tram', name:'Straßenbahn', hs:[0,394,1400,66], go:{x:1000,y:452},
    ansehen:function(){
      schauen('tram',
        'Die Sechser. Sie kommt alle elf Minuten und ist immer voll.',
        'Alle zwanzig. Und sie war nicht immer voll, nur wenn ich sie brauchte.');
    } },

  { id:'stadion', name:'Stadion', hs:[1010,110,390,270], go:{x:1180,y:448},
    ansehen:function(){
      schauen('stadion',
        'Grbavica. Von draußen ein Betonring, von drinnen der einzige Ort, wo alle dasselbe wollen.',
        'Nicht alle. Aber näher dran als sonst irgendwo.');
    },
    benutzen:'Heute spielt niemand. Heute ist Training, und Training kostet nichts, weil man nichts sieht.' },

  { id:'lena_s', name:'L.', hs:[300,320,80,140], go:{x:400,y:448},
    ansehen:'Sie hat den Antrag zweimal gelesen, bevor ich ihn überhaupt hatte.' }
];
ROOM_SARAJEVO.objects = OBJ_SARAJEVO;
ROOM_SARAJEVO.hinweis = function(){
  if (!FLAG.lenaGefragt) return { x:330, y:400 };
  if (!INV.has('antrag')) return { x:500, y:400 };
  if (!FLAG.ficaGehoert) return { x:760, y:400 };
  if (!FLAG.ficaRepariert) return { x:920, y:420 };
  if (!FLAG.kaffeeBekommen) return { x:760, y:400 };
  if (!FLAG.antragGestempelt) return { x:500, y:400 };
  if (!FLAG.safetGetroffen) return { x:1150, y:400 };
  return { x:400, y:400 };
};

/* ============================================================
   KAPITEL 5 · DAS WERK, DEUTSCHLAND 1970er
   ------------------------------------------------------------
   Spielbares Ziel: ohne Deutschkenntnisse den Arbeitsauftrag
   verstehen -- ueber Gesten, Piktogramme und einen Kollegen.
   ============================================================ */
var OBJ_WERK = [
  { id:'spind', name:'Spind', hs:[236,218,190,144], go:{x:300,y:444},
    ansehen:function(){
      schauen('spind',
        'Vier Spinde. Auf einem klebt ein Streifen mit meinem Namen, falsch geschrieben.',
        'Nicht falsch. Nur ohne die Zeichen, die es auf der Schreibmaschine nicht gab.');
    },
    benutzen:function(){
      if (INV.has('schluessel13') || FLAG.werkFertig){ say(PL, 'Ich habe, was ich brauche.'); return; }
      if (!FLAG.skizzeBekommen){ say(PL, 'Ein Spind mit Arbeitszeug. Ich weiß noch nicht, was ich davon brauche.'); return; }
      INV.add('schluessel13');
      play([
        { fn:function(){ PL.doAct('reach', 0.8); } },
        { say:[PL, 'Ein Maulschlüssel. Dreizehn.'] },
        { wait:0.6 },
        { say:[PL, 'Auf der Skizze steht dreizehn. Das verstehe ich.'] }
      ]);
    } },

  { id:'zettel_w', name:'Der Zettel', hs:[620,394,60,40], go:{x:660,y:446},
    when:function(){ return !!FLAG.zettelBekommen; },
    ansehen:function(){
      schauen('zettel_w',
        'Sieben Wörter in Schreibschrift. Ich erkenne eine 12 und einen Pfeil. Der Rest ist ein Zaun.',
        'Es waren fünf Wörter. Zwei davon habe ich für Wörter gehalten, es waren Kürzel.');
      setFlag('zettelGelesen', true);
    },
    nehmen:'Ich habe ihn. In der Hand hilft er auch nicht mehr.' },

  { id:'tafel', name:'Aushangtafel', hs:[944,210,142,108], go:{x:1000,y:440},
    ansehen:function(){
      if (!FLAG.zettelGelesen){ say(PL, 'Eine Tafel voller Schrift. Ich fange gar nicht erst an.'); return; }
      setFlag('tafelGesehen', true);
      play([
        { say:[PL, 'Auf der Tafel ist ein Bild: eine Hand, ein Kreis, ein rotes Band.'] },
        { wait:0.8 },
        { say:[PL, 'Und daneben eine Zahl. Zwölf.'] },
        { wait:0.7 },
        { say:[PL, 'Zwölf steht auch auf meinem Zettel. Aber welche Zwölf ist welche.'] }
      ]);
    } },

  { id:'maschine', name:'Die Maschine', hs:[750,250,140,210], go:{x:830,y:452},
    ansehen:function(){
      if (FLAG.maschineLaeuft) return say(PL, 'Sie läuft. Zwölf Stück in der Stunde, wie es scheint.');
      schauen('maschine',
        'Eine Presse. Ein Handrad, ein Fußschalter, zwei Lampen und ein Schild, das ich nicht lesen kann.',
        'Es war keine Presse. Es war eine Stanze, und der Unterschied hat mich später zwei Finger fast gekostet.');
    },
    benutzen:function(){
      if (FLAG.maschineLaeuft){ say(PL, 'Sie läuft.'); return; }
      if (!FLAG.skizzeBekommen){
        say(PL, ['Ich könnte alles Mögliche drücken.', 'Am ersten Tag drückt man nichts, was man nicht versteht.']);
        return;
      }
      if (!INV.has('schluessel13')){ say(PL, 'Die Skizze zeigt einen Schlüssel. Ich habe keinen.'); return; }
      INV.drop('schluessel13'); setFlag('maschineLaeuft', true);
      play([
        { fn:function(){ PL.doAct('take', 1.2); } },
        { say:[PL, 'Mutter lösen. Anschlag auf zwölf. Mutter fest.'] },
        { wait:1.0 },
        { say:[PL, 'Fußschalter.'] },
        { wait:0.9 },
        { fn:function(){ uiSound('confirm'); } },
        { say:[PL, 'Sie läuft.'] },
        { wait:1.1 },
        { say:[NARR, 'Zwölf Millimeter. Nicht Maschine zwölf. Zwölf Millimeter Anschlag. Das ganze Wort war eine Maßangabe.'] }
      ]);
    } },

  { id:'kisten_w', name:'Werkstückkisten', hs:[1080,368,120,90], go:{x:1140,y:452},
    ansehen:'Pappkisten mit Werkstücken. Auf der Seite ist Platz, auf den man mit Bleistift zeichnen kann.' },

  { id:'kantine', name:'Kantinentür', hs:[1264,208,120,158], go:{x:1290,y:450},
    ansehen:function(){
      schauen('kantine',
        'Hinter der Tür reden sie laut und alle gleichzeitig. Ich verstehe drei Wörter von hundert.',
        'Zwei. Und eins davon habe ich falsch verstanden.');
    },
    benutzen:function(){
      if (!FLAG.maschineLaeuft){ say(PL, 'Pause ist, wenn die Maschine läuft. Nicht vorher.'); return; }
      if (FLAG.kantineGehoert){ beendeKapitel(5); return; }
      kantineSzene();
    } },

  { id:'meister_w', name:'Meister Krause', hs:[490,300,80,150], go:{x:580,y:444},
    ansehen:'Klemmbrett, Kittel, Bleistift hinterm Ohr. Er ist nicht unfreundlich, er ist nur schon woanders.' },

  { id:'yilmaz_w', name:'Yılmaz', hs:[860,300,80,150], go:{x:840,y:446},
    ansehen:'Derselbe Overall wie meiner, nur eingelaufen. Er ist ein Jahr länger hier.' }
];
ROOM_WERK.objects = OBJ_WERK;
ROOM_WERK.hinweis = function(){
  if (!FLAG.zettelBekommen) return { x:520, y:400 };
  if (!FLAG.zettelGelesen) return { x:660, y:410 };
  if (!FLAG.tafelGesehen) return { x:1000, y:260 };
  if (!FLAG.skizzeBekommen) return { x:900, y:400 };
  if (!INV.has('schluessel13')) return { x:300, y:290 };
  if (!FLAG.maschineLaeuft) return { x:820, y:340 };
  return { x:1290, y:400 };
};

/* ============================================================
   KAPITEL 6 · DEUTSCHLAND, WINTER 1991
   ------------------------------------------------------------
   Spielbares Ziel: mit begrenzten Muenzen die Familie erreichen
   und ein Hilfspaket packen, das durch den Zoll kommt.
   Danach ein kurzer Perspektivwechsel: eine Szene aus L.s Sicht.
   ============================================================ */
var OBJ_TELEFON = [
  { id:'zelle', name:'Telefonzelle', hs:[370,254,124,200], go:{x:430,y:452},
    ansehen:function(){
      schauen('zelle',
        'Gelb, verglast, innen wärmer als draußen. Der Hörer riecht nach allen, die vor mir da waren.',
        'Sie war nicht wärmer. Sie war nur windstill, und das habe ich für Wärme gehalten.');
    },
    benutzen:function(){ telefonieren(); } },

  { id:'apparat', name:'Der Apparat', hs:[418,300,60,66], go:{x:450,y:450},
    ansehen:function(){
      var n = 4 - (FLAG.muenzenWeg || 0);
      say(PL, ['Münzschlitz, Wählscheibe, ein Hörer an einem Metallschlauch.',
               'Ich habe noch ' + n + ' Markstücke. Jedes ist ungefähr eine Minute, wenn die Leitung steht.']);
    },
    benutzen:function(){ telefonieren(); } },

  { id:'paket', name:'Das Paket', hs:[652,392,96,66], go:{x:700,y:454},
    ansehen:function(){
      if (FLAG.paketZu) return say(PL, 'Zu, beschriftet, erklärt. Jetzt hängt es an anderen.');
      var drin = [];
      if (FLAG.pKaffee) drin.push('Kaffee');
      if (FLAG.pSchoko) drin.push('Schokolade');
      if (FLAG.pMedi) drin.push('Medikamente');
      if (!drin.length) return say(PL, 'Ein leerer Karton. Alles, was hineinkommt, muss auch wieder herauskommen — drüben.');
      say(PL, 'Drin sind: ' + drin.join(', ') + '.');
    },
    benutzen:function(){
      if (FLAG.paketZu){ say(PL, 'Es ist zu.'); return; }
      if (!(FLAG.pKaffee && FLAG.pSchoko && FLAG.pMedi)){
        say(PL, 'Noch nicht voll. Und ein halb volles Paket schickt man nicht über tausend Kilometer.');
        return;
      }
      if (!INV.has('zollformular')){ say(PL, 'Ohne Zollerklärung bleibt es in Villach stehen.'); return; }
      if (!FLAG.zollRichtig){ say(PL, 'Erst muss ich wissen, was auf das Formular gehört. Sonst kommt es zurück.'); return; }
      setFlag('paketZu', true); INV.drop('zollformular');
      play([
        { fn:function(){ PL.doAct('take', 1.1); } },
        { say:[PL, 'Zukleben. Schnur drum. Adresse.'] },
        { wait:0.9 },
        { say:[PL, '„Gebrauchte Kleidung und Lebensmittel. Geschenk. Ohne Handelswert."'] },
        { wait:1.0 },
        { say:[NARR, 'Es ist angekommen. Sechs Wochen später, aber es ist angekommen.'] }
      ]);
    } },

  { id:'schaufenster', name:'Schaufenster', hs:[786,232,198,130], go:{x:860,y:444},
    ansehen:function(){
      setFlag('tvGesehen', true);
      schauen('schaufenster',
        'Vier Fernseher, vier Mal dasselbe Bild. Ein Mann am Rednerpult, und darunter läuft Schrift durch.',
        'Es war nicht dasselbe Bild. Auf einem lief Sport. Den habe ich nicht angesehen.');
    },
    benutzen:function(){
      if (FLAG.tudzGehoert){ say(PL, 'Ich habe genug gesehen.'); return; }
      tudzmanicSzene();
    } },

  { id:'post', name:'Postamt', hs:[1004,208,260,158], go:{x:1050,y:446},
    ansehen:'Gelb, geheizt, und drinnen sitzt jemand, der die Regeln kennt.',
    benutzen:function(){
      if (INV.has('zollformular') || FLAG.paketZu){ say(PL, 'Ich habe das Formular.'); return; }
      INV.add('zollformular');
      say(PL, 'Ein grüner Vordruck. Zwei Zeilen, und in diesen zwei Zeilen steckt alles.');
    } },

  { id:'laden', name:'Der Laden', hs:[1120,244,150,120], go:{x:1180,y:448},
    ansehen:'Ein Laden, in dem es alles gibt, was man einpacken kann.',
    benutzen:function(){
      var neu = [];
      if (!FLAG.pKaffee){ setFlag('pKaffee', true); neu.push('Kaffee'); }
      else if (!FLAG.pSchoko){ setFlag('pSchoko', true); neu.push('Schokolade'); }
      else if (!FLAG.pMedi){
        if (!FLAG.sommerGefragt){ say(PL, ['Medikamente. Ich weiß nicht, welche, und ich weiß nicht, ob sie durchkommen.', 'Ich sollte fragen.']); return; }
        setFlag('pMedi', true); neu.push('Medikamente');
      }
      if (!neu.length){ say(PL, 'Mehr passt nicht in den Karton, und mehr wäre auch verdächtig.'); return; }
      say(PL, neu[0] + '. Ins Paket damit.');
    } },

  { id:'heim', name:'Nach Hause', hs:[0,354,150,116], go:{x:150,y:450},
    ansehen:'Zweihundert Meter, dritter Stock, und L. sitzt vor dem Fernseher, ohne ihn zu sehen.',
    benutzen:function(){
      if (!FLAG.paketZu || !FLAG.anrufGeschafft){ say(PL, 'Nicht so. Nicht bevor beides steht.'); return; }
      lenaSzene();
    } }
];
ROOM_TELEFON.objects = OBJ_TELEFON;
ROOM_TELEFON.npcs = [ { id:'sommer', x:1000, y:438, dir:-1 },
                      { id:'lena', x:210, y:444, dir:1, appearance:'base', when:function(){ return !!FLAG.lenaKommt; } } ];
ROOM_TELEFON.hinweis = function(){
  if (!FLAG.sommerGefragt) return { x:1000, y:400 };
  if (!FLAG.anrufGeschafft) return { x:440, y:340 };
  if (!(FLAG.pKaffee && FLAG.pSchoko && FLAG.pMedi)) return { x:1180, y:400 };
  if (!INV.has('zollformular')) return { x:1050, y:400 };
  if (!FLAG.zollRichtig) return { x:1000, y:400 };
  if (!FLAG.paketZu) return { x:700, y:410 };
  return { x:150, y:410 };
};

/* ============================================================
   KAPITEL 7 · PODACA, 2004 BIS 2018
   ------------------------------------------------------------
   Rueckkehr und Hausbau als Raetselkette ueber mehrere Sommer:
   Material, Genehmigungen, Nachbarn. Am Ende eine Abendbegegnung.
   ============================================================ */
var OBJ_BAU = [
  { id:'rohbau', name:'Der Rohbau', hs:[180,270,400,190], go:{x:420,y:450},
    ansehen:function(){
      if (FLAG.kap7Fertig || FLAG.dachDrauf) return say(PL, 'Zwei Geschosse und ein Dach. Von hier aus sieht es aus wie ein Haus.');
      schauen('rohbau',
        'Bodenplatte, vier Stützen, eine Decke. Aus dem Dach stehen die Eisen in den Himmel, wie überall hier.',
        'Die Eisen standen elf Jahre so. Das ist hier keine Bauruine, das ist eine Absichtserklärung.');
    },
    benutzen:function(){
      if (FLAG.dachDrauf){ say(PL, 'Fertig für dieses Jahr.'); return; }
      if (!FLAG.steineDa){ say(PL, 'Ohne Steine kein Mauerwerk.'); return; }
      if (!FLAG.moertelDa){ say(PL, 'Ohne Mörtel liegen die Steine nur nebeneinander.'); return; }
      if (!FLAG.genehmigungDa){ say(PL, ['Ich könnte mauern.', 'Aber wenn das Papier nicht kommt, mauere ich für den Bagger.']); return; }
      if (!FLAG.grenzeGeklaert){ say(PL, 'Erst die zwölf Zentimeter. Sonst mauere ich in Jures Garten.'); return; }
      setFlag('dachDrauf', true); setFlag('abendGekommen', true);
      play([
        { fn:function(){ PL.doAct('take', 1.3); } },
        { say:[PL, 'Stein. Mörtel. Stein.'] },
        { wait:1.0 },
        { say:[NPC.jure, 'Du legst sie zu eng.'] },
        { say:[PL, 'Ich weiß.'] },
        { say:[NPC.jure, 'Und?'] },
        { say:[PL, 'Und ich lege sie trotzdem so.'] },
        { wait:1.2 },
        { say:[NARR, 'Es ist der einzige Streit, den wir in vierzehn Jahren hatten, und er hat vier Sätze gedauert.'] },
        { wait:0.9 },
        { say:[NARR, 'Dann wurde es Abend.'] },
        { fn:function(){ NPC.jure.visible = false; setFlag('abendGekommen', true); } }
      ]);
    } },

  { id:'mischer', name:'Betonmischer', hs:[510,376,110,86], go:{x:560,y:452},
    ansehen:function(){
      if (FLAG.moertelDa) return say(PL, 'Er dreht sich. Solange er sich dreht, geht es voran.');
      say(PL, 'Ein Mischer, geliehen. Er läuft, wenn man ihn anwirft und dabei etwas sagt, das man nicht aufschreibt.');
    },
    benutzen:function(){
      if (FLAG.moertelDa){ say(PL, 'Läuft.'); return; }
      if (!FLAG.steineDa){ say(PL, 'Erst die Steine. Mörtel wartet nicht.'); return; }
      setFlag('moertelDa', true); setFlag('mischerLaeuft', true);
      play([
        { fn:function(){ PL.doAct('push', 0.9); } },
        { say:[PL, 'Zement, Sand, Wasser aus der Zisterne. Drei zu eins.'] },
        { wait:0.9 },
        { say:[NPC.jure, 'Vier zu eins.'] },
        { say:[PL, 'Drei.'] },
        { wait:0.7 },
        { say:[NPC.jure, 'Bei dir zu Hause vielleicht.'] },
        { wait:0.9 },
        { say:[PL, 'Das hier ist zu Hause, Jure.'] },
        { wait:1.2 }
      ]);
    } },

  { id:'steine_b', name:'Steinhaufen', hs:[840,410,130,54], go:{x:880,y:454},
    ansehen:function(){
      if (FLAG.steineDa) return say(PL, 'Genug für eine Wand. Mehr brauche ich dieses Jahr nicht.');
      schauen('steine_b',
        'Kalkstein aus dem Steinbruch bei Zaostrog. Es fehlt ungefähr ein Drittel.',
        'Es fehlte die Hälfte. Und der Steinbruch war nicht bei Zaostrog.');
    },
    nehmen:function(){
      if (FLAG.steineDa){ say(PL, 'Sie liegen gut da, wo sie liegen.'); return; }
      if (!FLAG.jureHilft){ say(PL, ['Allein bekomme ich sie nicht rüber.', 'Und fragen muss man hier richtig.']); return; }
      setFlag('steineDa', true);
      play([
        { fn:function(){ NPC.jure.walkTo(R.area, R.nodes, 830, 450, 1); } },
        { say:[NPC.jure, 'Zu zweit. Du hebst, ich rede.'] },
        { wait:0.9 },
        { say:[PL, 'Wie immer.'] },
        { wait:1.0 },
        { say:[NARR, 'Er hat gehoben. Er redet nur, damit man ihn nicht dabei lobt.'] }
      ]);
    } },

  { id:'amtstisch', name:'Klapptisch', hs:[970,392,124,64], go:{x:1030,y:448},
    ansehen:function(){
      if (FLAG.genehmigungDa) return say(PL, 'Ein Stempel, zwei Unterschriften und elf Jahre. Sie gilt rückwirkend.');
      say(PL, ['Vier Papiere, mit Steinen beschwert.', 'Auf dreien steht dasselbe. Auf dem vierten fehlt eine Unterschrift.']);
    },
    benutzen:function(){
      if (FLAG.genehmigungDa){ say(PL, 'Sie liegt hier und gilt.'); return; }
      if (!FLAG.jureHilft){ say(PL, 'Ich weiß nicht, wer unterschreiben muss. Jure weiß es.'); return; }
      setFlag('genehmigungDa', true); INV.add('genehmigung');
      play([
        { say:[PL, 'Jure hat einen Neffen im Amt in Makarska.'] },
        { wait:0.8 },
        { say:[NPC.jure, 'Kein Neffe. Der Sohn meiner Schwägerin.'] },
        { say:[PL, 'Also ein Neffe.'] },
        { say:[NPC.jure, 'Also nicht.'] },
        { wait:1.0 },
        { say:[NARR, 'Am Ende war es ein Neffe. Und es hat nichts gekostet außer zwei Nachmittage und einem Mittagessen.'] }
      ]);
    },
    nehmen:'Die Papiere bleiben unter den Steinen. Hier weht es.' },

  { id:'zollstock_b', name:'Zollstock', hs:[1000,376,50,26], go:{x:1030,y:446},
    ansehen:'Gelbes Holz, deutsche Marke. Seit 1974 dasselbe Stück.',
    nehmen:function(){
      if (INV.has('zollstock')){ say(PL, 'Ich habe ihn.'); return; }
      INV.add('zollstock');
      say(PL, 'Den nehme ich. Ohne ihn baue ich nichts.');
    } },

  { id:'grenze', name:'Grundstücksgrenze', hs:[600,404,240,58], go:{x:700,y:456},
    ansehen:function(){
      if (FLAG.grenzeGeklaert) return say(PL, 'Zwölf Zentimeter. Die Mauer steht jetzt zwölf Zentimeter weiter innen.');
      say(PL, ['Ein Stein im Boden mit einem eingehauenen Kreuz. Das ist die Grenze.', 'Die Bodenplatte ist ein Stück darüber hinaus.']);
    },
    benutzen:function(){
      if (FLAG.grenzeGeklaert){ say(PL, 'Erledigt.'); return; }
      if (!INV.has('zollstock')){ say(PL, 'Messen wäre ehrlicher als schätzen.'); return; }
      setFlag('grenzeGeklaert', true);
      play([
        { fn:function(){ PL.doAct('take', 1.0); } },
        { say:[PL, 'Zwölf Zentimeter.'] },
        { wait:0.8 },
        { say:[NPC.jure, 'Zwölf Zentimeter sieht kein Mensch.'] },
        { wait:0.9 },
        { say:[PL, 'Ich sehe sie.'] },
        { wait:1.0 },
        { say:[PL, 'Die Mauer geht zwölf Zentimeter nach innen.'] },
        { wait:1.1 },
        { say:[NARR, 'Zwölf Zentimeter Wohnfläche. Und dreißig Jahre nichts, worüber man reden muss.'] }
      ]);
    } },

  { id:'meer_b', name:'Die Bucht', hs:[930,120,470,230], go:{x:1150,y:440},
    ansehen:function(){
      schauen('meer_b',
        'Von hier oben sieht man bis Hvar. Deswegen dieses Grundstück und kein anderes.',
        'Man sieht nicht bis Hvar. Man sieht Brač. Ich habe es dreizehn Jahre falsch gesagt und niemand hat mich korrigiert.');
    } },

  { id:'gestalt_b', name:'Jemand am Hang', hs:[1240,300,120,160], go:{x:1250,y:450},
    when:function(){ return !!FLAG.abendGekommen && !FLAG.gestaltGesprochen; },
    ansehen:'Da kommt einer den Hang herauf. Um diese Zeit kommt hier niemand herauf.',
    reden:function(){ gestaltSzene(); },
    benutzen:function(){ gestaltSzene(); } }
];
ROOM_BAU.objects = OBJ_BAU;
ROOM_BAU.hinweis = function(){
  if (!INV.has('zollstock')) return { x:1030, y:400 };
  if (!FLAG.jureHilft) return { x:640, y:400 };
  if (!FLAG.genehmigungDa) return { x:1030, y:410 };
  if (!FLAG.grenzeGeklaert) return { x:700, y:420 };
  if (!FLAG.steineDa) return { x:880, y:420 };
  if (!FLAG.moertelDa) return { x:560, y:410 };
  if (!FLAG.dachDrauf) return { x:420, y:400 };
  return { x:1250, y:400 };
};
