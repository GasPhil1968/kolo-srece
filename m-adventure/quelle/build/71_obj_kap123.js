
/* ============================================================
   KAPITEL 1 · ROSKO POLJE 1953
   ------------------------------------------------------------
   Spielbares Ziel: den Ochsenkarren reparieren, um Mehl aus dem
   Nachbardorf zu holen. Die Raetsellogik folgt der Mangelwirt-
   schaft: man kauft nichts, man organisiert.
   ============================================================ */
var OBJ_POLJE = [
  { id:'haus', name:'Das Haus', hs:[196,156,268,204], go:{x:340,y:436},
    ansehen:function(){
      schauen('haus',
        'Ein Raum, ein Ofen, fünf Menschen. Die Mauern sind so dick, dass es drinnen im August kalt ist.',
        'Es waren nicht fünf. Sieben, bis zum Winter davor.');
    },
    benutzen:function(){ changeRoom('kuca', ROOM_KUCA.entry); } },

  { id:'radio_p', name:'Das Radio', hs:[366,398,72,54], go:{x:392,y:452},
    ansehen:function(){
      if (FLAG.radioRepariert){
        PL.say(['Es läuft. Es läuft und es hört so bald nicht wieder auf.']); return;
      }
      schauen('radio_p',
        'Ein Kasten aus Holz mit einem Stoffgitter. Der Lehrer hat ihn aus Mostar mitgebracht.',
        'Es war ein Volksempfänger. Woher er den hatte, hat er nie gesagt, und keiner hat gefragt.');
    },
    benutzen:function(){
      if (FLAG.radioRepariert){ PL.say(['Ich lasse es laufen.']); return; }
      if (!FLAG.radioOffen){
        setFlag('radioOffen', true);
        play([
          { fn:function(){ PL.doAct('reach', 0.9); } },
          { say:[PL, 'Die Rückwand ist nur eingehakt.'] },
          { wait:1.2 },
          { say:[PL, 'Da drin hat eine Maus gewohnt. Und sie hatte Hunger auf die Wicklung.'] },
          { wait:1.6 },
          { say:[PL, 'Zwei Finger breit Draht fehlen.'] }
        ]);
        return;
      }
      PL.say(['Ohne Draht wird das nichts.']);
    },
    geben:function(item){
      if (item !== 'kupferdraht'){ PL.say(['Das gehört da nicht hinein.']); return true; }
      if (!FLAG.radioOffen){ PL.say(['Erst muss ich sehen, was fehlt.']); return true; }
      INV.drop('kupferdraht'); setFlag('radioRepariert', true);
      play([
        { fn:function(){ PL.doAct('reach', 1.3); } },
        { wait:1.4 },
        { say:[PL, 'Zwei Enden, eine Windung, festdrehen.'] },
        { wait:1.6 },
        { say:[NARR, 'Erst kommt nichts. Dann ein Rauschen, und im Rauschen etwas, das kein Rauschen ist.'] },
        { wait:2.0 },
        { fn:function(){ if (NPC.petar && NPC.petar.visible) NPC.petar.dir = -1; } },
        { say:[NARR, 'Eine Frauenstimme, zwei Akkorde, ein Lied, das hier jeder kennt und keiner gelernt hat.'] },
        { wait:2.2 },
        { say:[NPC.petar, 'Da.'] },
        { wait:1.4 },
        { say:[NPC.petar, 'Das kommt aus Zagreb. Über sechshundert Kilometer, durch die Luft, in diesen Kasten.'] },
        { wait:2.0 },
        { say:[PL, 'Und wie kommt es da rein?'] },
        { wait:1.4 },
        { say:[NPC.petar, 'Das erkläre ich dir, wenn du in die Schule kommst.'] },
        { wait:1.8 },
        { say:[NARR, 'Ich bin nie in seine Schule gekommen. Die Melodie habe ich behalten.'] },
        { wait:1.6 }
      ]);
      return true;
    },
    nehmen:'Das gehört dem Lehrer. Und es ist schwerer als ich.' },

  { id:'petar', name:'Lehrer Petar', hs:[440,300,80,148], go:{x:432,y:444},
    ansehen:'Er hat als Einziger im Dorf Bücher und als Einziger im Dorf keine Ziege. Beides fällt auf.',
    reden:function(){ openDlg('petar', NPC.petar); },
    /* Ein Inventar-auf-Inventar gibt es in dieser Engine nicht, und
       dafuer eines einzufuehren waere zu viel Motor fuer ein Raetsel.
       Also oeffnet Petar den Wecker. Das ist ohnehin die bessere
       Fassung: er ist damit beteiligt und nicht bloss der, der auf
       das kaputte Radio zeigt. */
    geben:function(item){
      if (item === 'wecker'){
        INV.drop('wecker'); INV.add('kupferdraht'); setFlag('weckerGeoeffnet', true);
        play([
          { say:[NPC.petar, 'Ein Wecker.'] },
          { wait:1.2 },
          { say:[PL, 'Er geht nicht mehr.'] },
          { wait:1.2 },
          { say:[NPC.petar, 'Das ist auch nicht, wofür wir ihn brauchen.'] },
          { wait:1.6 },
          { fn:function(){ NPC.petar.doAct('reach', 1.4); } },
          { wait:1.8 },
          { say:[NARR, 'Er klappt ihn mit dem Taschenmesser auf, als hätte er das schon hundertmal gemacht.'] },
          { wait:1.8 },
          { say:[NPC.petar, 'Die Spule. Kupfer, lackiert.'] },
          { wait:1.4 },
          { say:[NPC.petar, 'Wickel ab, was du brauchst, und keinen Finger mehr.'] }
        ]);
        return true;
      }
      if (item === 'kupferdraht'){ PL.say(['Er soll es nicht machen. Ich mache es.']); return true; }
      return false;
    } },

  { id:'brunnen', name:'Brunnen', hs:[532,246,104,120], go:{x:580,y:444},
    ansehen:function(){
      if (FLAG.nagelGeholt){
        say(PL, 'Der Eimer hängt jetzt an einer Schnur. Er hängt schlechter, aber er hängt.');
        return;
      }
      schauen('brunnen',
        'Kein Wasser drin um diese Zeit. Der Eimer hängt am Haken, und der Haken hängt an einem Splint aus Eisen.',
        'Der Splint war schon damals das Wertvollste am ganzen Brunnen.');
    },
    nehmen:function(){
      if (FLAG.nagelGeholt){ say(PL, 'Ich habe ihn schon.'); return; }
      if (!FLAG.keilVersucht){
        say(PL, ['Ein Splint aus Eisen. Der hält.', 'Aber dann hält der Eimer nicht mehr, und ohne Eimer kein Wasser.']);
        return;
      }
      setFlag('nagelGeholt', true);
      INV.add('radnagel');
      play([
        { say:[PL, 'Der Eimer kann warten. Das Mehl nicht.'] },
        { fn:function(){ } },
        { wait:0.6 },
        { say:[PL, 'Ich binde den Eimer mit der Schnur an. Das hält bis heute Abend.'] },
        { wait:0.7 },
        { say:[NARR, 'Es hat bis 1961 gehalten.'] }
      ]);
    },
    benutzen:function(){ say(PL, 'Ich kurble. Es kommt nichts. Um zwei Uhr kommt hier nie etwas.'); } },

  { id:'karren', name:'Ochsenkarren', hs:[600,376,208,84], go:{x:700,y:456},
    ansehen:function(){
      if (FLAG.radRepariert){ say(PL, 'Er steht gerade. Man kann ihn ziehen.'); return; }
      schauen('karren',
        'Der Karren hängt schief. Das Vorderrad ist von der Achse gerutscht.',
        'Er hing nicht schief. Er lag. Das Rad war ganz ab.');
    },
    benutzen:function(){
      if (!FLAG.radRepariert){ say(PL, 'So fährt er keine hundert Schritte.'); return; }
      if (!FLAG.vaterEinverstanden){ say(PL, 'Erst muss der Vater es sehen. Sonst gehe ich zweimal.'); return; }
      say(PL, 'Er steht. Jetzt kann ich los.');
    } },

  { id:'achse', name:'Achse', hs:[620,428,120,34], go:{x:700,y:458},
    ansehen:function(){
      if (FLAG.radRepariert){ say(PL, 'Fett drauf, Splint durch, Rad drauf. So macht man das.'); return; }
      if (FLAG.achseGefettet){ say(PL, 'Die Achse ist gefettet. Jetzt fehlt nur noch etwas, das das Rad hält.'); return; }
      say(PL, ['Die Achse ist trocken wie ein Stein.', 'Ohne Fett geht das Rad nicht drauf, und wenn es draufgeht, frisst es sich fest.']);
    },
    nehmen:'Die Achse gehört zum Karren.' },

  { id:'rad', name:'Vorderrad', hs:[600,412,80,64], go:{x:660,y:458},
    ansehen:function(){
      if (FLAG.radRepariert){ say(PL, 'Es sitzt. Ein bisschen krumm, aber es sitzt.'); return; }
      schauen('rad',
        'Das Rad ist heil. Nur der Splint, der es auf der Achse hält, ist weg.',
        'Der Splint war nicht weg. Ich hatte ihn verloren, drei Tage vorher, und es niemandem gesagt.');
    },
    benutzen:function(){
      if (FLAG.radRepariert){ say(PL, 'Fertig ist fertig.'); return; }
      if (!FLAG.achseGefettet){ say(PL, 'Trocken geht es nicht auf die Achse. Ich brauche Fett.'); return; }
      if (INV.has('radnagel')){
        INV.drop('radnagel'); setFlag('radRepariert', true); leereInventar();
        play([
          { fn:function(){ PL.doAct('take', 1.1); } },
          { say:[PL, 'Rad drauf. Splint durch. Umbiegen.'] },
          { wait:0.9 },
          { say:[PL, 'Es sitzt.'] },
          { wait:0.7 },
          { say:[NARR, 'Es war das erste Mal, dass ich etwas repariert habe, von dem etwas abhing. Ich war elf.'] },
          { fn:function(){ setFlag('vaterFragen', true); } }
        ]);
        return;
      }
      if (INV.has('holzkeil')){
        setFlag('keilVersucht', true); INV.drop('holzkeil');
        play([
          { fn:function(){ PL.doAct('take', 1.0); } },
          { say:[PL, 'Der Keil geht durch das Loch. Fast.'] },
          { wait:0.8 },
          { say:[PL, 'Er hält, solange nichts passiert.'] },
          { wait:0.6 },
          { say:[NPC.otac, 'Bis zum ersten Stein, Sohn. Dann liegt das Rad im Graben und du unter dem Karren.'] },
          { wait:0.5 },
          { say:[NPC.otac, 'Holz hält Holz. Eisen hält Eisen.'] }
        ]);
        return;
      }
      say(PL, 'Ohne etwas, das durch das Loch geht, wird das nichts.');
    } },

  { id:'holzstapel', name:'Holzstapel', hs:[856,382,140,74], go:{x:900,y:456},
    ansehen:'Buchenholz für den Winter, und der Winter ist weit. Ein paar Scheite sind schon gespalten.',
    nehmen:function(){
      if (INV.has('holzkeil') || FLAG.keilVersucht){ say(PL, 'Ich habe genug Holz.'); return; }
      INV.add('holzkeil');
      say(PL, 'Ein Keil aus Buche. Hart genug, sagt man.');
    } },

  { id:'vater', name:'Vater', hs:[970,300,80,150], go:{x:950,y:440},
    ansehen:function(){
      schauen('vater',
        'Er kaut auf einem Grashalm und sieht zu, wie ich es falsch mache.',
        'Einundvierzig war er. Ich habe ihn immer als alten Mann in Erinnerung, und er war jünger als meine Söhne heute.');
    } },

  { id:'weg', name:'Der Weg', hs:[1150,370,250,100], go:{x:1300,y:450},
    ansehen:'Nach rechts, über den Hügel, ins Nachbardorf. Zwei Stunden hin, drei zurück, wenn der Karren voll ist.',
    benutzen:function(){
      if (!FLAG.radRepariert){ say(PL, 'Nicht ohne Karren. Fünfzehn Kilo Mehl trage ich nicht auf dem Rücken.'); return; }
      if (!FLAG.vaterEinverstanden){ say(PL, 'Der Vater soll es erst sehen.'); return; }
      play([
        { say:[PL, 'Also los.'] },
        { fn:function(){ wechselNachSequenz('bruecke', ROOM_BRUECKE.entry); } }
      ]);
    } },

  /* Dedo, am Wegrand, mit einer Kiste krummer Naegel. Er ist hier
     wirklich Teil der Loesung -- der zweite Weg zum Radsplint neben
     dem Eisen am Brunnen. Er verlangt nichts dafuer; man muss nur
     fragen, und das ist in diesem Spiel die eigentliche Huerde. */
  { id:'naegel', name:'Kiste mit Nägeln', hs:[1140,414,90,46], go:{x:1150,y:452},
    when:function(){ return !FLAG.nagelVonDedo; },
    ansehen:function(){
      schauen('naegel',
        'Eine Kiste voll Nägel. Jeder einzelne krumm.',
        'Nicht jeder. Zwei waren gerade, und die hat er nicht hergegeben.');
    },
    nehmen:function(){
      if (INV.has('radnagel')){ say(PL, 'Ich habe schon Eisen.'); return; }
      if (!FLAG.dedoNagelAngeboten){
        say(PL, ['Die gehören ihm.', 'Ich müsste fragen.']);
        return;
      }
      setFlag('nagelVonDedo', true); setFlag('nagelGeholt', true);
      INV.add('radnagel');
      play([
        { fn:function(){ PL.doAct('take', 0.9); } },
        { say:[PL, 'Danke.'] },
        { wait:1.0 },
        { say:[NPC.dedo, 'Bring ihn zurück, wenn der Karren durchhält.'] },
        { wait:1.2 },
        { say:[PL, 'Und wenn nicht?'] },
        { wait:1.0 },
        { say:[NPC.dedo, 'Dann behalt ihn. Dann hast du ihn gebraucht.'] },
        { wait:1.6 },
        { say:[NARR, 'Ich habe ihn nicht zurückgebracht. Der Karren hat bis 1961 gehalten.'] }
      ]);
    } },

  { id:'rogaP', name:'Etwas am Feldrand', hs:[1320,290,70,120], go:null,
    when:function(){ return !FLAG.rogaGesehen1; },
    ansehen:function(){
      setFlag('rogaGesehen1', true);
      play([
        { say:[PL, 'Da steht jemand am Feldrand.'] },
        { wait:1.1 },
        { say:[PL, 'Nein. Da steht ein Wacholder.'] },
        { wait:1.4 }
      ]);
    } }
];
ROOM_POLJE.objects = OBJ_POLJE;
ROOM_POLJE.hinweis = function(){
  /* Es gibt jetzt zwei Wege zum Eisen: den Brunnen und Dedo. Der
     Hinweis zeigt auf den, der naeher liegt. */
  if (FLAG.keilVersucht && !FLAG.nagelGeholt && FLAG.dedoNagelAngeboten) return { x:1150, y:420 };
  if (!FLAG.speckErlaubt || (!INV.has('speck') && !FLAG.achseGefettet)) return { x:330, y:300 };
  if (!FLAG.achseGefettet) return { x:700, y:430 };
  if (!FLAG.keilVersucht) return { x:900, y:410 };
  if (!FLAG.nagelGeholt) return { x:580, y:300 };
  if (!FLAG.radRepariert) return { x:640, y:430 };
  if (!FLAG.vaterEinverstanden) return { x:1010, y:390 };
  return { x:1300, y:420 };
};

/* ============================================================
   KAPITEL 1b · DIE BRÜCKE
   ============================================================ */
var OBJ_BRUECKE = [
  { id:'bruestung', name:'Brüstung', hs:[230,312,680,72], go:{x:720,y:454},
    ansehen:function(){
      schauen('bruestung',
        'Kalkstein, glatt gegriffen. Hier haben schon viele gestanden und ins Wasser gesehen.',
        'Vier. Ich habe sie später gezählt: der Müller, zwei Hirten und der Fremde. Das Dorf hatte nicht mehr Leute, die Zeit hatten.');
    },
    benutzen:'Ich lehne mich an und sehe hinunter. Das Wasser hat es eiliger als ich.' },

  { id:'wasser', name:'Der Fluss', hs:[286,354,654,112], go:{x:820,y:454},
    ansehen:function(){
      schauen('wasser',
        'Es ist grün und kalt und hat unter der Brücke keine Eile.',
        'Es war braun. Es war immer braun, außer im Mai.');
    } },

  { id:'bogen', name:'Der Bogen', hs:[250,278,570,128], go:{x:640,y:456},
    ansehen:function(){
      if (!FLAG.andrinGesprochen){ say(PL, 'Ein Bogen aus Stein. Er steht seit vierhundert Jahren, sagt der Müller.'); return; }
      say(PL, ['Jeder Stein drückt auf den nächsten. Deswegen fällt keiner.', 'Wenn man einen herausnimmt, fallen alle.']);
    } },

  { id:'muehle', name:'Mühle', hs:[820,178,244,190], go:{x:930,y:424},
    ansehen:function(){
      schauen('muehle',
        'Hier hole ich das Mehl. Der Müller nimmt ein Zehntel und redet nicht viel.',
        'Er nahm ein Achtel. Wir haben es gewusst und nichts gesagt, weil er der einzige Müller war.');
    },
    benutzen:function(){
      if (!FLAG.andrinGesprochen){
        say(PL, ['Der Müller mahlt noch. Ich muss warten.', 'Auf der Brüstung sitzt einer und wartet auch.']);
        return;
      }
      if (INV.has('mehl')){ say(PL, 'Ich habe den Sack. Jetzt zurück.'); return; }
      INV.add('mehl');
      play([
        { say:[PL, 'Fünfzehn Kilo. Er hat mir beim Aufladen geholfen.'] },
        { wait:0.7 },
        { say:[NARR, 'Er hat nicht geholfen. Ich habe es allein aufgeladen und drei Tage nichts heben können.'] }
      ]);
    } },

  { id:'zurueck', name:'Der Rückweg', hs:[0,352,150,118], go:{x:130,y:452},
    ansehen:'Zurück nach Rosko Polje. Bergauf, mit vollem Karren.',
    benutzen:function(){
      if (!INV.has('mehl')){ say(PL, 'Ohne Mehl brauche ich gar nicht erst heimzugehen.'); return; }
      changeRoom('polje', { x:1240, y:450, dir:-1 });
    } },

  { id:'rogaB', name:'Am anderen Ufer', hs:[1030,190,70,130], go:null,
    when:function(){ return !!FLAG.andrinGesprochen && !FLAG.rogaGesehen2; },
    ansehen:function(){
      setFlag('rogaGesehen2', true);
      play([
        { say:[PL, 'Drüben, hinter der Mühle, steht wieder jemand.'] },
        { wait:1.2 },
        { say:[NPC.andrin, 'Wo?'] },
        { wait:1.0 },
        { say:[PL, 'Jetzt nicht mehr.'] },
        { wait:1.2 }
      ]);
    } }
];
ROOM_BRUECKE.objects = OBJ_BRUECKE;
ROOM_BRUECKE.hinweis = function(){
  if (!FLAG.andrinGesprochen) return { x:620, y:326 };
  if (!INV.has('mehl')) return { x:930, y:246 };
  return { x:130, y:410 };
};
/* Mit vollem Sack fuehrt der Weg zurueck ins Haus, nicht ins Menue:
   das Kapitel endet dort, wo es angefangen hat. */
ROOM_POLJE.hinweisMitMehl = true;

/* ============================================================
   KAPITEL 2 · MOSTAR 1955
   ------------------------------------------------------------
   Spielbares Ziel: ein Papierfaehnchen auftreiben, ohne Geld und
   ohne Beziehungen. Leise Satire auf verordnete Begeisterung.
   ============================================================ */
var OBJ_MOSTAR = [
  { id:'rinne', name:'Straßenrinne', hs:[80,382,800,70], go:{x:520,y:456},
    ansehen:function(){
      schauen('rinne',
        'In der Rinne liegt, was heute schon heruntergefallen ist. Ein Kamm, ein Schuhband, ein Stecken.',
        'Kein Kamm. Ein Kamm wäre etwas wert gewesen, den hätte jemand aufgehoben.');
    },
    nehmen:function(){
      if (INV.has('stecken') || FLAG.faehnchenFertig){ say(PL, 'Einer reicht.'); return; }
      INV.add('stecken');
      say(PL, 'Ein Stecken. Gerade genug für das, was ich vorhabe.');
    } },

  { id:'stand', name:'Zeitungsstand', hs:[548,176,204,226], go:{x:650,y:450},
    ansehen:function(){
      schauen('stand',
        'Zeitungen, Zigaretten einzeln, und ein Mann, der genau weiß, was jedes Stück kostet.',
        'Zigaretten einzeln gab es erst später. 1955 gab es nur ganze Schachteln und keine Kunden dafür.');
    },
    reden:function(){ openDlg('stand', null); },
    nehmen:function(){
      if (INV.has('zeitung') || FLAG.faehnchenFertig){ say(PL, 'Ich habe schon eins.'); return; }
      if (FLAG.retoureBekommen){
        INV.add('zeitung');
        say(PL, 'Ein halbes Blatt von gestern. Für ihn Abfall, für mich Material.');
        return;
      }
      say(PL, ['Nehmen kann ich nichts. Das hier ist sein Geschäft und nicht mein Feld.']);
    } },

  { id:'kleister', name:'Kleistereimer', hs:[918,404,58,52], go:{x:945,y:452},
    ansehen:'Ein Eimer Kleister. Die Plakatkleber sind zum Essen und haben ihn stehen lassen.',
    nehmen:function(){
      if (INV.has('klebstoff') || FLAG.faehnchenFertig){ say(PL, 'Ich habe genug.'); return; }
      INV.add('klebstoff');
      say(PL, 'Einen Finger voll. Mehr braucht kein Fähnchen.');
    } },

  { id:'plakat', name:'Plakatwand', hs:[820,180,150,188], go:{x:880,y:440},
    ansehen:function(){
      schauen('plakat',
        'Rot mit weißer Schrift. Die Farbe ist noch feucht, man riecht sie bis hierher.',
        'Sie war nicht feucht. Sie war seit einer Woche trocken, und ich habe eine Stunde gebraucht, bis ich das gemerkt habe.');
      setFlag('plakatGesehen', true);
    },
    nehmen:'Ein Plakat abreißen, an diesem Tag, in dieser Stadt. Nein.',
    benutzen:function(){
      if (!INV.has('zeitung')){ say(PL, 'Womit denn?'); return; }
      if (FLAG.papierRot){ say(PL, 'Das Papier ist schon rot genug.'); return; }
      setFlag('papierRot', true);
      play([
        { fn:function(){ PL.doAct('reach', 0.8); } },
        { say:[PL, 'Ich drücke das Papier auf die feuchte Stelle.'] },
        { wait:0.8 },
        { say:[PL, 'Rot. Und weiß, wo es weiß war. Es fehlt eine Farbe.'] }
      ]);
    } },

  { id:'tribuene', name:'Tribüne', hs:[972,246,350,194], go:{x:1110,y:448},
    ansehen:function(){
      schauen('tribuene',
        'Rot bespannt, ein Mikrofon, ein Bild von ihm, das größer ist als er.',
        'Das Bild war nicht größer als er. Ich war kleiner.');
    },
    benutzen:function(){
      if (!FLAG.faehnchenFertig){ say(PL, 'Ohne Fähnchen gehe ich da nicht hin.'); return; }
      if (FLAG.gewunken){ say(PL, 'Ich habe gewunken. Einmal reicht.'); return; }
      tikoSzene();
    } },

  { id:'gasse', name:'Gasse', hs:[1250,360,150,110], go:{x:1300,y:452},
    ansehen:'Runter zur Neretva. Da würde ich jetzt lieber sein.',
    benutzen:function(){ say(PL, 'Der Lehrer zählt gleich wieder. Wer fehlt, ist am Montag dran.'); } },

  { id:'bruecke2', name:'Die alte Brücke', hs:[1028,170,236,142], go:{x:1100,y:442},
    ansehen:function(){
      schauen('bruecke2',
        'Von hier sieht man sie nur halb. Ein Bogen, weiter nichts.',
        'Es ist derselbe Bogen wie zu Hause, nur größer und berühmt. Das habe ich damals nicht gewusst.');
    } }
];
ROOM_MOSTAR.objects = OBJ_MOSTAR;
ROOM_MOSTAR.hinweis = function(){
  if (!FLAG.lehrerGefragt) return { x:430, y:400 };
  if (!INV.has('stecken')) return { x:520, y:430 };
  if (!FLAG.retoureBekommen) return { x:650, y:350 };
  if (!INV.has('zeitung')) return { x:650, y:360 };
  if (!FLAG.papierRot) return { x:880, y:270 };
  if (!INV.has('klebstoff')) return { x:945, y:420 };
  if (!FLAG.tintenstift) return { x:430, y:400 };
  if (!FLAG.faehnchenFertig) return { x:PL.x, y:PL.y - 60 };
  return { x:1110, y:400 };
};

/* ============================================================
   KAPITEL 3 · MARINESTÜTZPUNKT, 1960er
   ------------------------------------------------------------
   Spielbares Ziel: vor der Inspektion drei einander wider-
   sprechende Befehle gleichzeitig erfuellen.
   ============================================================ */
var OBJ_KASERNE = [
  { id:'fahne_k', name:'Fahnenmast', hs:[726,110,72,250], go:{x:760,y:440},
    ansehen:function(){
      if (FLAG.fahneGehisst){ say(PL, 'Sie steht oben. Pünktlich, auf die Minute.'); return; }
      if (FLAG.leineGeknotet) return say(PL, ['Die Leine ist an der Kammertür festgemacht.', 'Wer die Tür schließt, hisst die Fahne. Das ist keine Vorschrift, aber es ist auch keine Übertretung.']);
      if (INV.has('fahne')) return say(PL, 'Die Fahne habe ich. Die Leine hängt frei.');
      say(PL, 'Ein Mast, eine Leine, keine Fahne. Die Fahne liegt in der Kammer, und die Kammer ist zu.');
    },
    benutzen:function(){
      if (FLAG.fahneGehisst){ say(PL, 'Fertig.'); return; }
      if (!INV.has('fahne')){ say(PL, 'Ohne Fahne kann ich am Mast ziehen, so lange ich will.'); return; }
      if (FLAG.leineGeknotet){ say(PL, 'Alles vorbereitet. Jetzt fehlt nur noch die Tür.'); return; }
      setFlag('leineGeknotet', true); INV.drop('fahne');
      play([
        { fn:function(){ PL.doAct('reach', 0.9); } },
        { say:[PL, 'Fahne an die Leine. Und das andere Ende...'] },
        { wait:0.8 },
        { say:[PL, 'Das andere Ende an die Kammertür.'] },
        { wait:0.9 },
        { say:[NARR, 'Drei Befehle, eine Bewegung. Das war das Erste, was mir die Armee beigebracht hat, und es war nicht das, was sie beibringen wollte.'] }
      ]);
    } },

  { id:'bordstein', name:'Bordstein', hs:[816,394,250,26], go:{x:900,y:452},
    ansehen:function(){
      if (FLAG.bordsteinFertig){ say(PL, 'Weiß bis zum Ende. Es sieht so aus, als hätte es einen Sinn.'); return; }
      say(PL, ['Vierzig Meter Bordstein. Die Hälfte ist von letztem Jahr noch weiß.', 'Die andere Hälfte nicht.']);
    },
    benutzen:function(){
      if (FLAG.bordsteinFertig){ say(PL, 'Der ist fertig.'); return; }
      if (!INV.has('farbe') || !INV.has('pinsel')){ say(PL, 'Ohne Farbe und Pinsel wird das nichts.'); return; }
      setFlag('bordsteinFertig', true); setFlag('farbeBenutzt', true);
      INV.drop('farbe'); INV.drop('pinsel');
      play([
        { fn:function(){ PL.doAct('take', 1.2); } },
        { say:[PL, 'Zwanzig Meter. Der Pinsel ist hart wie ein Brett.'] },
        { wait:1.0 },
        { say:[PL, 'Fertig. Es glänzt sogar.'] },
        { wait:0.7 },
        { say:[NARR, 'Am nächsten Tag hat es geregnet und die Farbe war Kalk. Aber die Inspektion war vorbei.'] }
      ]);
    } },

  { id:'kammer', name:'Kammer', hs:[846,190,132,174], go:{x:900,y:444},
    ansehen:function(){
      if (FLAG.kammerZu) return say(PL, 'Verschlossen. Und die Leine ist gespannt.');
      if (FLAG.kammerOffen) return say(PL, 'Offen. Drinnen: Farbe, Pinsel, eine Fahne und dreißig Jahre Marine.');
      say(PL, 'Die Materialkammer. Verschlossen, wie sich das gehört.');
    },
    benutzen:function(){
      if (FLAG.kammerZu){ say(PL, 'Zu ist zu.'); return; }
      if (!FLAG.kammerOffen){
        if (!INV.has('kammerschluessel')){ say(PL, 'Abgeschlossen. Der Schlüssel hängt beim Narednik.'); return; }
        setFlag('kammerOffen', true);
        play([
          { fn:function(){ PL.doAct('reach', 0.7); } },
          { say:[PL, 'Auf.'] },
          { wait:0.5 },
          { say:[PL, 'Farbe. Pinsel. Eine Fahne, zusammengelegt wie ein Hemd.'] }
        ]);
        return;
      }
      // Offen und alles geholt: zumachen
      if (!FLAG.leineGeknotet){
        say(PL, ['Wenn ich jetzt zumache, komme ich nicht mehr an die Fahne.', 'Erst das andere.']);
        return;
      }
      if (!FLAG.bordsteinFertig){
        say(PL, ['Die Farbe steht noch draußen und der Bordstein ist halb.', 'Erst fertig streichen.']);
        return;
      }
      setFlag('kammerZu', true); setFlag('fahneGehisst', true);
      play([
        { fn:function(){ PL.doAct('push', 1.0); } },
        { say:[PL, 'Tür zu.'] },
        { wait:0.7 },
        { fn:function(){ uiSound('confirm'); } },
        { say:[PL, 'Und oben geht die Fahne hoch.'] },
        { wait:1.2 },
        { say:[NPC.zdravko, 'MATROSE!'] },
        { wait:0.8 },
        { say:[NPC.zdravko, '...'] },
        { wait:0.9 },
        { say:[NPC.zdravko, 'Neun Uhr. Alles drei. Wie?'] },
        { say:[PL, 'Nach Vorschrift, Narednik.'] },
        { wait:1.0 },
        { say:[NPC.zdravko, 'Das ist die schlimmste Antwort, die es gibt, und ich kann nichts dagegen sagen.'] },
        { fn:function(){ setFlag('dreiBefehleErfuellt', true); } }
      ]);
    } },

  { id:'material', name:'Material in der Kammer', hs:[856,220,112,82], go:{x:900,y:442},
    when:function(){ return !!FLAG.kammerOffen && !FLAG.kammerZu; },
    ansehen:'Farbe, Pinsel, Fahne. Genau das, was drei verschiedene Leute gleichzeitig von mir wollen.',
    nehmen:function(){
      var neu = [];
      if (!INV.has('farbe') && !FLAG.bordsteinFertig){ INV.add('farbe'); neu.push('Farbe'); }
      if (!INV.has('pinsel') && !FLAG.bordsteinFertig){ INV.add('pinsel'); neu.push('Pinsel'); }
      if (!INV.has('fahne') && !FLAG.leineGeknotet){ INV.add('fahne'); neu.push('Fahne'); }
      if (!neu.length){ say(PL, 'Ich habe alles, was ich brauche.'); return; }
      say(PL, neu.join(', ') + '. Mehr ist da nicht, was mich angeht.');
    } },

  { id:'steg', name:'Steg', hs:[1070,340,330,130], go:{x:1250,y:452},
    ansehen:function(){
      schauen('steg',
        'Zwölf Planken, dann Wasser, dann das Boot. Auf dem Steg raucht man, wenn keiner hinsieht.',
        'Neun Planken. Und es hat immer jemand hingesehen.');
    },
    benutzen:function(){
      if (!FLAG.dreiBefehleErfuellt){ say(PL, 'Neun Uhr. Nicht jetzt.'); return; }
      if (FLAG.admiralGehoert){ beendeKapitel(3); return; }
      admiralSzene();
    } },

  { id:'boot', name:'Das Boot', hs:[1150,190,250,150], go:{x:1180,y:446},
    ansehen:function(){
      schauen('boot',
        'Ein Torpedoboot. Grau, laut, und es fährt nie weiter als bis Vis.',
        'Es ist nie gefahren, solange ich dort war. Nicht ein einziges Mal.');
    } },

  { id:'tor_k', name:'Wachtor', hs:[0,76,152,286], go:{x:170,y:452},
    ansehen:'Raus geht hier keiner ohne Zettel. Und Zettel gibt es nur mit Grund.',
    benutzen:'Nicht vor der Inspektion.' }
];
ROOM_KASERNE.objects = OBJ_KASERNE;
ROOM_KASERNE.hinweis = function(){
  if (!FLAG.befehleGehoert) return { x:520, y:400 };
  if (!INV.has('kammerschluessel')) return { x:520, y:400 };
  if (!FLAG.kammerOffen) return { x:900, y:400 };
  if (!INV.has('fahne') && !FLAG.leineGeknotet) return { x:900, y:400 };
  if (!FLAG.leineGeknotet) return { x:760, y:380 };
  if (!FLAG.bordsteinFertig) return { x:900, y:410 };
  if (!FLAG.kammerZu) return { x:900, y:400 };
  return { x:1250, y:420 };
};
