
/* ============================================================
   Sektion 16  OBJEKTE
   ------------------------------------------------------------
   hs  : [x,y,w,h] im Raumkoordinatensystem
   go  : Zielpunkt zum Hinlaufen (null = kein Laufen)
   Verben: ansehen | nehmen | benutzen | reden | geben
   ============================================================ */

/* ------------------------------------------------------------
   ERINNERUNGSUNSCHAERFE
   ------------------------------------------------------------
   Details in den Erinnerungskapiteln stimmen nicht immer. Wer einen
   Hotspot ein zweites Mal untersucht, sieht, wie sich Kleinigkeiten
   korrigieren: ein Haus wird kleiner, ein Held unfreundlicher, ein
   Vater juenger. Rein optional, nie raetselrelevant -- der zweite
   Blick eroeffnet nichts und verschliesst nichts.
   ------------------------------------------------------------ */
/* unsch(id) gibt zurueck, wie weit sich die Erinnerung an diesen
   Gegenstand schon korrigiert hat: 0 = erste Fassung, 1 = wie es
   wirklich war. Der Wert laeuft weich hoch, waehrend die Korrektur
   gesprochen wird -- man sieht das Bild sich aendern, statt es
   umspringen zu sehen. Rein optisch, nie raetselrelevant. */
function unsch(id){ return G.unschaerfe[R.id + ':' + id] || 0; }
function updateUnschaerfe(dt){
  for (var k in G.gesehen){
    if (G.gesehen[k] < 2) continue;
    var v = G.unschaerfe[k] || 0;
    if (v < 1) G.unschaerfe[k] = Math.min(1, v + dt * 0.55);
  }
}
function schauen(id, erst, korrektur){
  var k = R.id + ':' + id;
  G.gesehen[k] = (G.gesehen[k] || 0) + 1;
  if (G.gesehen[k] >= 2 && korrektur){
    play([ { say:[PL, erst] }, { wait:0.4 }, { say:[NARR, korrektur] } ]);
  } else {
    say(PL, erst);
  }
}

/* ------------------------------------------------------------
   KAPITELFOLGE
   ------------------------------------------------------------
   Die Erinnerungen kommen in der Reihenfolge, in der sie kommen.
   Jedes Kapitel haengt an einem Ausloeser auf der Terrasse, und
   der Ausloeser ist nie ein Menue und nie bewusstes Nachdenken:
   ein Geruch, ein Radio, der Wind, die eigene Hand.
   ------------------------------------------------------------ */
var KAPITEL = [
  { nr:1, flag:'kap1Fertig', ausloeser:'feige',  ziel:{x:906,y:400} },
  { nr:2, flag:'kap2Fertig', ausloeser:'radio',  ziel:{x:352,y:410} },
  { nr:3, flag:'kap3Fertig', ausloeser:'kiste',  ziel:{x:830,y:430} },
  { nr:4, flag:'kap4Fertig', ausloeser:'ball',   ziel:{x:1000,y:420} },
  { nr:5, flag:'kap5Fertig', ausloeser:'selbst', ziel:{x:0,y:0} },
  { nr:6, flag:'kap6Fertig', ausloeser:'haus',   ziel:{x:190,y:400} },
  { nr:7, flag:'kap7Fertig', ausloeser:'mauer',  ziel:{x:1000,y:400} }
];
function naechstesKapitel(){
  for (var i = 0; i < KAPITEL.length; i++) if (!FLAG[KAPITEL[i].flag]) return KAPITEL[i];
  return null;
}
function istAusloeser(name){
  var k = naechstesKapitel();
  return !!(k && k.ausloeser === name);
}

/* ------------------------------------------------------------
   DIE KATZE ALS HINWEIS
   ------------------------------------------------------------
   Wer laenger nicht weiterkommt, bekommt keinen Hinweistext und kein
   Menue: die Katze dreht den Kopf. In den Erinnerungen, wo keine Katze
   ist, uebernimmt ein kaum sichtbares Flimmern dieselbe Aufgabe.
   ------------------------------------------------------------ */
function hinweisZiel(){
  if (R.id === 'terrasse'){
    if (!FLAG.prologVorbei){
      if (!FLAG.lukaGefragt) return { x:820, y:400 };
      if (!INV.has('taschenlampe')) return { x:300, y:300 };
      return { x:1120, y:400 };
    }
    if (FLAG.alleKapitel && !FLAG.kisteOffen) return { x:830, y:424 };
    if (FLAG.kisteOffen && !FLAG.finaleFertig) return { x:820, y:400 };
    var k = naechstesKapitel();
    if (k) return (k.ausloeser === 'selbst') ? { x:PL.x, y:PL.y - 90 } : k.ziel;
    return null;
  }
  if (typeof R.hinweis === 'function') return R.hinweis();
  return null;
}
function katzeZeigt(sofort){
  var z = hinweisZiel();
  if (!z) return;
  G.katzeZiel = z.x; G.katzeZeigt = sofort ? 7 : 5;
  G.katzeIdle = 55;
}
function updateKatze(dt){
  if (G.katzeZeigt > 0) G.katzeZeigt -= dt;
  if (G.seq || G.dlg || G.menu || G.cine || G.chapterCard) { G.katzeIdle = 45; return; }
  G.katzeIdle -= dt;
  if (G.katzeIdle <= 0) katzeZeigt(false);
}
/* Das Flimmern auf dem Hinweisziel. Bewusst schwach: es soll auffallen,
   wenn man danach sucht, und uebersehen werden, wenn nicht. */
function drawHinweis(){
  if (G.katzeZeigt <= 0) return;
  var z = hinweisZiel(); if (!z) return;
  var a = Math.min(1, G.katzeZeigt / 5) * (0.5 + 0.5 * Math.sin(G.t * 3.4));
  ctx.save();
  ctx.globalAlpha = a * 0.30;
  pixelGlow(z.x, z.y, 54, 46, '#ffe6a8', 0.7, 4);
  ctx.restore();
}

/* ============================================================
   RAHMEN · DIE TERRASSE
   ============================================================ */
var OBJ_TERRASSE = [
  { id:'haustuer', name:'Haustür', hs:[136,210,102,164], go:{x:200,y:440},
    ansehen:function(){
      schauen('haustuer',
        'Die Tür habe ich selbst eingehängt. Sie schließt, und das ist mehr, als man von den meisten Türen sagen kann.',
        'Sie schließt nicht ganz. Sie hat nie ganz geschlossen.');
    },
    benutzen:function(){
      if (istAusloeser('haus')){ triggerKapitel(6); return; }
      say(PL, ['Drin ist L. und der Fernseher läuft ohne Ton.', 'Ich bleibe draußen.']);
    } },

  { id:'fenstersims', name:'Fenstersims', hs:[286,174,112,94], go:{x:340,y:430},
    ansehen:function(){
      if (INV.has('taschenlampe')) { say(PL, 'Ein Sims. Sonst liegt hier alles, was man einmal im Jahr braucht.'); return; }
      say(PL, 'Auf dem Sims: eine Taschenlampe, zwei Schrauben und ein Feuerzeug, das nicht mehr geht.');
    },
    nehmen:function(){
      if (INV.has('taschenlampe')){ say(PL, 'Ich habe sie schon.'); return; }
      INV.add('taschenlampe');
      say(PL, 'Die Lampe nehme ich mit. In der Garage ist es dunkel wie in einem Sack.');
    } },

  { id:'radio', name:'Radio', hs:[228,292,82,46], go:{x:270,y:424},
    ansehen:function(){
      schauen('radio',
        radioAn ? 'Ein Sender aus Split. Halb Musik, halb Rauschen, und beides gehört dazu.'
                : 'Ein Kasten aus den Achtzigern. Er geht noch, weil ihn nie jemand ersetzt hat.',
        'Er war schon damals alt, als wir ihn bekommen haben. Er war immer schon alt.');
    },
    benutzen:function(){
      radioAn = !radioAn; G.autosaveT = 0.5;
      MUSIK.setModus(radioAn ? 'radio' : null);
      if (!radioAn){ say(PL, 'Aus.'); return; }
      if (istAusloeser('radio')){ triggerKapitel(2); return; }
      say(PL, ['Musik. Etwas Altes, aus Sarajevo.', 'L. hört es drinnen und dreht den Fernseher leiser.']);
    },
    nehmen:'Das Radio bleibt, wo es steht. Es steht dort seit dreiundzwanzig Jahren.' },

  { id:'tisch', name:'Tisch', hs:[184,302,148,122], go:{x:252,y:450},
    ansehen:'Steinplatte, selbst gesetzt. Sie steht schief, aber sie steht.' },

  { id:'bank', name:'Die Bank', hs:[316,286,190,136], go:{x:410,y:452},
    ansehen:function(){
      schauen('bank',
        'Metallgestell, Holzlatten, die Farbe an den Kanten weg. Sie stand schon hier, als das Haus noch keins war.',
        'Sie stand nicht schon hier. Ich habe sie 2007 in Makarska gekauft, gebraucht, für achtzig Kuna.');
    },
    benutzen:function(){
      if (PL.sitting){ PL.sit(false); say(PL, 'Also gut. Stehen wir wieder auf.'); return; }
      PL.walkTo(R.area, R.nodes, 566, 450, 1, function(){
        PL.sit(true);
        say(PL, 'So. Von hier sieht man alles, was man sehen muss.');
      });
    } },

  { id:'kaffee', name:'Kaffeetasse', hs:[194,286,48,36], go:{x:235,y:448},
    ansehen:function(){
      schauen('kaffee',
        'Halb voll, halb kalt. Ich trinke ihn trotzdem aus.',
        'Nicht halb voll. Sie steht seit dem Frühstück da.');
    },
    nehmen:'Sie steht gut, wo sie steht.' },

  { id:'katze', name:'Die Katze', hs:[900,390,144,68], go:{x:900,y:454},
    ansehen:function(){
      schauen('katze',
        'Sie hat keinen Namen. Sie kam mit dem Haus.',
        'Sie hat einen Namen. Ich sage ihn nur nicht laut.');
    },
    reden:function(){
      var s = ['Sie hört zu. Sie antwortet nicht, aber sie hört zu.',
               '„Und?" — Nichts. Sie dreht ein Ohr, mehr nicht.',
               'Mit der Katze kann man reden, ohne dass jemand nachfragt.'];
      say(PL, s[Math.floor(Math.random()*s.length)]);
      katzeZeigt(true);
    },
    nehmen:'Das haben wir vor Jahren einmal versucht.',
    benutzen:function(){ say(PL, 'Ich kraule sie hinter dem Ohr. Sie erlaubt es.'); katzeZeigt(true); } },

  { id:'feige', name:'Feigenbaum', hs:[470,42,340,354], go:{x:650,y:440},
    ansehen:function(){
      if (istAusloeser('feige')){ triggerKapitel(1); return; }
      schauen('feige',
        'Ich habe ihn 2005 gesetzt. Er ist größer als ich gedacht habe.',
        'Nicht 2005. 2006, im zweiten Sommer. Im ersten hatten wir kein Wasser.');
    },
    nehmen:function(){ say(PL, 'Zwei sind reif. Die anderen brauchen noch eine Woche.'); },
    benutzen:function(){
      if (istAusloeser('feige')){ triggerKapitel(1); return; }
      say(PL, 'Ich reibe ein Blatt zwischen den Fingern. Der Geruch bleibt zwei Tage in der Hand.');
    } },

  { id:'mauer', name:'Die Mauer', hs:[748,244,286,116], go:{x:875,y:432},
    ansehen:function(){
      if (istAusloeser('mauer')){ triggerKapitel(7); return; }
      schauen('mauer',
        'Trockenmauer, ohne Mörtel. Jeder Stein liegt so, dass der nächste ihn hält.',
        'Zwei Steine liegen falsch. Jure hat sie gelegt, und ich habe nichts gesagt.');
    },
    benutzen:function(){
      if (istAusloeser('mauer')){ triggerKapitel(7); return; }
      say(PL, 'Sie steht. Man muss sie nicht anfassen.');
    } },

  { id:'meer', name:'Das Meer', hs:[700,98,332,148], go:{x:900,y:426},
    ansehen:function(){
      schauen('meer',
        'Hinter der Mauer fängt das Meer an und hört so schnell nicht wieder auf.',
        'Von hier sieht man Hügel drüben. Als Kind habe ich geglaubt, dahinter kommt Italien. Es kommt Pelješac.');
    } },

  { id:'garage', name:'Garagentor', hs:[1044,190,182,176], go:{x:1120,y:446},
    ansehen:'Ein Tor aus Blech, größer als nötig. Dahinter steht alles, was nicht ins Haus durfte.',
    benutzen:function(){
      if (!FLAG.lukaGefragt){
        say(PL, ['Was soll ich in der Garage.', 'Nichts liegt dort, was heute jemand braucht.']);
        return;
      }
      changeRoom('garage', ROOM_GARAGE.entry);
    } },

  { id:'kiste_t', name:'Die Kiste', hs:[782,408,100,54], go:{x:830,y:458},
    when:function(){ return !!FLAG.kisteAufTerrasse; },
    ansehen:function(){
      if (FLAG.kisteOffen){ say(PL, 'Offen. Und es ist nichts Schlimmes drin. Das ist das Merkwürdige.'); return; }
      if (istAusloeser('kiste')){ triggerKapitel(3); return; }
      schauen('kiste_t',
        'Eine Munitionskiste. Sie war leer, als ich sie bekommen habe, und sie ist es nicht geblieben.',
        'Sie war nicht leer. Es war noch Farbe drin, weiße.');
    },
    benutzen:function(){
      if (FLAG.kisteOffen){ say(PL, 'Sie ist offen. Mehr muss ich nicht tun.'); return; }
      if (FLAG.alleKapitel){
        if (!FLAG.lukaDabei){ say(PL, ['Nicht allein.', 'Wenn schon, dann soll er dabei sein.']); return; }
        oeffneKiste(); return;
      }
      if (istAusloeser('kiste')){ triggerKapitel(3); return; }
      setFlag('kisteAngefasst', true);
      say(PL, ['Ich wische den Staub vom Deckel.', 'Mehr nicht.']);
    },
    nehmen:'Sie steht jetzt hier. Das reicht fürs Erste.' },

  { id:'ball', name:'Lukas Ball', hs:[960,420,54,44], go:{x:1000,y:454},
    when:function(){ return !!FLAG.prologVorbei; },
    ansehen:function(){
      if (istAusloeser('ball')){ triggerKapitel(4); return; }
      schauen('ball',
        'Ein Ball, halb platt, mit einem Vereinswappen, das ich nicht kenne.',
        'Doch. Ich kenne es. Ich will es nur nicht kennen.');
    },
    benutzen:function(){
      if (istAusloeser('ball')){ triggerKapitel(4); return; }
      say(PL, 'Ich stoppe ihn mit dem Fuß und schiebe ihn zurück. Es geht noch.');
    } }
];

/* ============================================================
   RAHMEN · DIE GARAGE
   ============================================================ */
var OBJ_GARAGE = [
  { id:'tor_raus', name:'Ausgang', hs:[40,110,190,260], go:{x:170,y:446},
    ansehen:'Draußen ist es hell. Hier drin riecht es nach Öl und nach 1986.',
    benutzen:function(){ changeRoom('terrasse', {x:1100,y:446,dir:-1}); } },

  { id:'regal_g', name:'Regal', hs:[326,146,198,220], go:{x:400,y:420},
    ansehen:function(){
      schauen('regal_g',
        'Vier Bretter, vier Jahrzehnte. Schrauben nach Größe sortiert, in Gläsern, die einmal Ajvar waren.',
        'Nicht nach Größe. Nach dem Jahr, in dem ich sie gekauft habe. Das weiß nur ich.');
    },
    nehmen:'Ich nehme nichts vom Regal. Wer etwas vom Regal nimmt, findet es nie wieder.' },

  { id:'netze', name:'Fischernetze', hs:[518,112,160,200], go:{x:540,y:424},
    ansehen:function(){
      schauen('netze',
        'Die Netze meines Schwagers. Er hat sie hiergelassen und ist nach Kanada.',
        'Er hat sie nicht hiergelassen. Ich habe sie ihm abgekauft, damit er das Geld für das Ticket hatte.');
    } },

  { id:'moped', name:'Tomos', hs:[540,376,130,80], go:{x:600,y:452},
    ansehen:function(){
      schauen('moped',
        'Ein Tomos, Baujahr 1974. Er springt an, wenn man ihn schiebt und dabei nicht flucht.',
        'Er springt seit vier Jahren nicht mehr an. Ich schiebe ihn trotzdem jedes Frühjahr einmal an.');
    },
    benutzen:'Heute nicht.' },

  { id:'plane', name:'Plane', hs:[700,376,190,84], go:{x:800,y:454},
    when:function(){ return !FLAG.planeWeg; },
    ansehen:'Eine grüne Plane. Darunter liegt etwas Eckiges, und ich weiß genau, was.',
    nehmen:function(){ this.benutzen(); },
    benutzen:function(){
      if (!INV.has('taschenlampe')){
        say(PL, ['Hier hinten sehe ich die Hand nicht vor Augen.', 'Ich bräuchte Licht.']);
        return;
      }
      setFlag('planeWeg', true);
      play([
        { fn:function(){ NPC.luka.walkTo(R.area, R.nodes, 720, 448, 1); } },
        { say:[PL, 'Nur eine Plane. Darunter liegt Gerümpel wie überall.'] },
        { wait:0.6 },
        { say:[NPC.luka, 'Deda! Was ist das für eine Kiste?'] },
        { wait:0.5 },
        { say:[PL, 'Eine Kiste.'] },
        { say:[NPC.luka, 'Ja, aber was für eine?'] },
        { wait:0.9 },
        { say:[PL, 'Eine alte.'] },
        { wait:0.7 },
        { say:[NARR, 'Ich hätte etwas anderes sagen können. Ich habe siebenundvierzig Jahre Zeit gehabt, mir etwas anderes zu überlegen.'] }
      ]);
    } },

  { id:'kiste_g', name:'Die Kiste', hs:[742,398,100,58], go:{x:790,y:456},
    when:function(){ return !!FLAG.planeWeg && !FLAG.kisteAufTerrasse; },
    ansehen:'Munitionskiste, Marine, ausgemustert. Der Deckel ist heller als der Rest, weil er nie in der Sonne stand.',
    benutzen:function(){ this.nehmen(); },
    nehmen:function(){
      setFlag('kisteAufTerrasse', true);
      play([
        { say:[NPC.luka, 'Nehmen wir sie mit raus?'] },
        { wait:0.6 },
        { say:[PL, 'Sie ist schwer.'] },
        { say:[NPC.luka, 'Ich helfe.'] },
        { wait:0.8 },
        { say:[NARR, 'Er hat geholfen. Elf Kilo, und er hat wirklich geholfen.'] },
        { fn:function(){
            setFlag('prologVorbei', true);
            wechselNachSequenz('terrasse', {x:1080,y:448,dir:-1});
          } }
      ]);
    } }
];

ROOM_TERRASSE.objects = OBJ_TERRASSE;
ROOM_GARAGE.objects = OBJ_GARAGE;
ROOM_GARAGE.npcs = [ { id:'luka', x:560, y:436, dir:1, when:function(){ return !FLAG.prologVorbei; } } ];
ROOM_GARAGE.hinweis = function(){
  if (!FLAG.planeWeg) return { x:800, y:410 };
  if (!FLAG.kisteAufTerrasse) return { x:790, y:414 };
  return { x:150, y:400 };
};
