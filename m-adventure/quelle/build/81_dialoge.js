
/* ============================================================
   Sektion 21  DIALOGE
   ------------------------------------------------------------
   Multiple Choice mit trockenen oder tiefen Antworten. Dialekt-
   faerbung sparsam: Verstaendlichkeit vor Kolorit.
   ============================================================ */
/* ------------------------------------------------------------
   DEDO MURATOVIĆ
   ------------------------------------------------------------
   Er taucht in sechs Kapiteln auf, und M. hat ihn bisher jedes Mal
   wortgleich dasselbe gefragt: "Was machst du hier?" und "Was ist
   das für ein Hut?". Sechs Begegnungen, die gleich anfangen, sind
   fünf Begegnungen zu viel -- der Witz der Figur ist ja gerade,
   dass sie jedes Mal woanders steht und etwas anderes treibt.

   Die Frage richtet sich jetzt danach, wo man ist und was er dort
   gerade tut. Die Antworten dahinter bleiben, wo sie waren: sie
   waren nie das Problem. */
var DEDO_FRAGE = {
  polje:    'Was machst du hier?',
  mostar:   'Sie standen eben noch nicht da.',
  kaserne:  'Wie kommen Sie hier überhaupt herein?',
  sarajevo: 'Sie schon wieder.',
  werk:     'Sie arbeiten hier nicht.',
  bau:      'Das ist mein Grundstück.',
  terrasse: 'Sie sitzen auf meinem Platz.'
};
/* Der Hut wechselt mit dem Kapitel, also wechselt auch die Frage.
   "Was ist das für ein Hut?" geht beim Strohhut. Beim Bauhelm in
   einer Kaserne wäre es die falsche Verwunderung. */
var DEDO_HUTFRAGE = {
  polje:    'Was ist das für ein Hut?',
  mostar:   'Einen Fez trägt hier sonst keiner mehr.',
  kaserne:  'Ein Bauhelm. In einer Kaserne.',
  sarajevo: 'Woher hat man hier einen Sombrero?',
  werk:     'Sind Sie Arzt?',
  bau:      'Es ist August.'
};
/* Eine zweite Frage, die es nur in diesem Kapitel gibt. Sie ist der
   Grund, warum sich ein zweiter Besuch bei ihm lohnt -- und an zwei
   Stellen bringt sie einen Hinweis, der weiterhilft. Den Hinweis,
   nicht die Lösung: gelöst wird weiter selbst. */
var DEDO_ORTFRAGE = {
  polje:    'Kennst du meinen Vater?',
  mostar:   'Kommt er wirklich hier vorbei?',
  kaserne:  'Wie lange sind Sie schon hier?',
  sarajevo: 'Kennen Sie jemanden bei der Wohnungsvergabe?',
  werk:     'Können Sie das hier lesen?',
  bau:      'Wie tief muss so ein Fundament?'
};


var DLGNODES = {

  /* ---- Rahmen: Luka, der juengste Enkel ---- */
  luka: function(){
    return dialogOptions([
      { t:'Was machst du da?', go:'l_was', once:'q_l_was' },
      { t:'Wo ist dein Ball?', go:'l_ball', once:'q_l_ball',
        when:function(){ return !FLAG.lukaGefragt; } },
      { t:'Frag deine Baka, die weiß das besser.', go:'l_baka', once:'q_l_baka' },
      { t:'Was ist in der Kiste, willst du wissen.', go:'l_kiste', once:'q_l_kiste',
        when:function(){ return !!FLAG.kisteAufTerrasse && !FLAG.alleKapitel; } },
      { t:'Setz dich. Ich erzähle dir etwas.', go:'l_finale', unlock:'JETZT',
        when:function(){ return !!FLAG.alleKapitel && !FLAG.lukaDabei; } },
      { t:'(Nichts sagen.)', go:null, repeatable:true }
    ]);
  },

  /* ---- Kapitel 1 ---- */
  otac: function(){
    /* Derselbe Mann, zwei Orte. Oben auf der Weide geht es um die
       Herde, unten auf dem Hof um den Karren. */
    if (R.id === 'weide'){
      return dialogOptions([
        { t:'Elf sind es.', go:'ow_elf', once:'q_ow_elf', when:function(){ return !!FLAG.gezaehlt && !FLAG.ziegeGefunden; } },
        { t:'Zwölf. Sie stand im Schatten.', go:'ow_zwoelf', unlock:'ZWÖLF',
          when:function(){ return !!FLAG.ziegeGefunden && !FLAG.vaterAuftrag; } },
        { t:'Was ist heute zu tun?', go:'ow_auftrag', unlock:'AUFTRAG',
          when:function(){ return !!FLAG.vaterAuftrag; } },
        { t:'Sitzt du da den ganzen Tag?', go:'ow_sitzen', once:'q_ow_sitzen' },
        { t:'(Nichts.)', go:null, repeatable:true }
      ]);
    }
    return dialogOptions([
      { t:'Das Rad ist ab.', go:'o_rad', once:'q_o_rad' },
      { t:'Womit soll ich es festmachen?', go:'o_womit', once:'q_o_womit',
        when:function(){ return !!FLAG.keilVersucht; } },
      { t:'Es sitzt. Sieh es dir an.', go:'o_fertig', unlock:'FERTIG',
        when:function(){ return !!FLAG.radRepariert && !FLAG.vaterEinverstanden; } },
      { t:'Warum gehen wir nicht auch weg?', go:'o_weggehen', once:'q_o_weggehen' },
      { t:'(Nichts.)', go:null, repeatable:true }
    ]);
  },
  majka: function(){
    return dialogOptions([
      { t:'Ich hole das Mehl.', go:'m_mehl', once:'q_m_mehl' },
      { t:'Die Achse ist trocken. Darf ich die Schwarte?', go:'m_achse', unlock:'SCHWARTE',
        when:function(){ return !FLAG.speckErlaubt; } },
      { t:'Der Sack ist leer.', go:'m_sack', once:'q_m_sack',
        when:function(){ return !!FLAG.sackGesehen; } },
      { t:'Wann gibt es etwas zu essen?', go:'m_essen', once:'q_m_essen' },
      { t:'(Weitergehen.)', go:null, repeatable:true }
    ]);
  },
  andrin: function(){
    return dialogOptions([
      { t:'Warten Sie auf jemanden?', go:'a_warten', once:'q_a_warten' },
      { t:'Was steht in dem Buch?', go:'a_buch', once:'q_a_buch' },
      { t:'Wer hat die Brücke gebaut?', go:'a_bruecke', once:'q_a_bruecke' },
      { t:'Wohnen Sie hier?', go:'a_wohnen', once:'q_a_wohnen' },
      { t:'Ich muss weiter. Das Mehl.', go:'a_ende', unlock:'WEITER',
        when:function(){ return !!(FLAG.q_a_warten && FLAG.q_a_bruecke); } },
      { t:'(Nichts sagen.)', go:null, repeatable:true }
    ]);
  },

  petar: function(){
    return dialogOptions([
      { t:'Was ist das für ein Kasten?', go:'p_kasten', once:'q_p_kasten' },
      { t:'Warum steht er draußen?', go:'p_draussen', once:'q_p_draussen' },
      { t:'Geht er noch?', go:'p_kaputt', once:'q_p_kaputt',
        when:function(){ return !!FLAG.q_p_kasten && !FLAG.radioRepariert; } },
      { t:'Es läuft.', go:'p_laeuft', once:'q_p_laeuft',
        when:function(){ return !!FLAG.radioRepariert; } },
      { t:'Was lernt man bei Ihnen?', go:'p_schule', once:'q_p_schule' },
      { t:'(Weitergehen.)', go:null, repeatable:true }
    ]);
  },

  /* ---- Kapitel 2 ---- */
  lehrer: function(){
    return dialogOptions([
      { t:'Ich habe kein Fähnchen.', go:'le_kein', once:'q_le_kein' },
      { t:'Wo bekommt man denn eins?', go:'le_wo', once:'q_le_wo',
        when:function(){ return !!FLAG.q_le_kein; } },
      { t:'Darf ich Ihren Tintenstift?', go:'le_stift', unlock:'BLAU',
        when:function(){ return !!FLAG.papierRot && !FLAG.tintenstift; } },
      { t:'Warum müssen wir überhaupt winken?', go:'le_warum', once:'q_le_warum' },
      { t:'(Nichts.)', go:null, repeatable:true }
    ]);
  },
  stand: function(){
    return dialogOptions([
      { t:'Was kostet die Zeitung?', go:'s_preis', once:'q_s_preis' },
      { t:'Der Umzug kommt diese Straße herunter.', go:'s_tipp', unlock:'TIPP',
        when:function(){ return !!FLAG.q_s_preis && !FLAG.retoureBekommen; } },
      { t:'Haben Sie etwas von gestern?', go:'s_gestern', once:'q_s_gestern',
        when:function(){ return !!FLAG.q_s_preis; } },
      { t:'(Weitergehen.)', go:null, repeatable:true }
    ]);
  },

  /* ---- Kapitel 3 ---- */
  zdravko: function(){
    return dialogOptions([
      { t:'Befehle, Narednik?', go:'z_befehle', once:'q_z_befehle' },
      { t:'Alle drei um neun Uhr?', go:'z_drei', once:'q_z_drei',
        when:function(){ return !!FLAG.befehleGehoert; } },
      { t:'Der Kammerschlüssel.', go:'z_schluessel', unlock:'SCHLÜSSEL',
        when:function(){ return !!FLAG.befehleGehoert && !INV.has('kammerschluessel') && !FLAG.kammerZu; } },
      { t:'Hier, der Schlüssel. Kammer ist zu.', go:'z_abgabe', unlock:'ABGABE',
        when:function(){ return !!FLAG.kammerZu && INV.has('kammerschluessel'); } },
      { t:'Wer ist Admiral Pivopija?', go:'z_admiral', once:'q_z_admiral',
        when:function(){ return !!FLAG.befehleGehoert; } },
      { t:'(Stillgestanden.)', go:null, repeatable:true }
    ]);
  },

  /* ---- Kapitel 4 ---- */
  lena: function(){
    return dialogOptions([
      { t:'Ich gehe zum Amt.', go:'n_amt', once:'q_n_amt' },
      { t:'Zwei Zimmer werden nicht reichen.', go:'n_zimmer', once:'q_n_zimmer' },
      { t:'Was soll ich denen sagen?', go:'n_sagen', once:'q_n_sagen',
        when:function(){ return !!FLAG.q_n_amt; } },
      { t:'Ich habe den Schlüssel.', go:'n_schluessel', unlock:'SCHLÜSSEL',
        when:function(){ return INV.has('wohnungsschluessel'); } },
      { t:'(Nichts.)', go:null, repeatable:true }
    ]);
  },
  kiosk: function(){
    return dialogOptions([
      { t:'Was ist mit Ihrem Auto?', go:'k_auto', once:'q_k_auto' },
      { t:'Ich hätte eine Düse. Zufällig.', go:'k_duese', unlock:'TAUSCH',
        when:function(){ return !!FLAG.ficaGehoert && !FLAG.ficaRepariert; } },
      { t:'Kennen Sie jemanden im Wohnungsamt?', go:'k_amt', once:'q_k_amt',
        when:function(){ return !!FLAG.gefallenGetan; } },
      { t:'Einen Kaffee für den Herrn am Schalter.', go:'k_kaffee', unlock:'KAFFEE',
        when:function(){ return !!FLAG.gefallenGetan && !FLAG.kaffeeBekommen; } },
      { t:'(Weitergehen.)', go:null, repeatable:true }
    ]);
  },
  safet: function(){
    return dialogOptions([
      { t:'Ein Autogramm für meine Jungs?', go:'sa_auto', unlock:'FRAGEN',
        when:function(){ return !FLAG.safetGetroffen; } },
      { t:'Sie spielen gut.', go:'sa_gut', once:'q_sa_gut' },
      { t:'(Weitergehen.)', go:null, repeatable:true }
    ]);
  },

  /* ---- Kapitel 5 ---- */
  krause: function(){
    return dialogOptions([
      { t:'(Ihn ansehen und warten.)', go:'kr_warten', once:'q_kr_warten' },
      { t:'(Auf den Zettel zeigen.)', go:'kr_zeigen',
        when:function(){ return !!FLAG.zettelBekommen && !FLAG.skizzeBekommen; } },
      { t:'(Auf die Maschine zeigen und nicken.)', go:'kr_maschine',
        when:function(){ return !!FLAG.maschineLaeuft; } },
      { t:'(Nichts sagen.)', go:null, repeatable:true }
    ]);
  },
  yilmaz: function(){
    return dialogOptions([
      { t:'(Den Zettel hinhalten.)', go:'y_zettel',
        when:function(){ return !!FLAG.zettelBekommen && !FLAG.skizzeBekommen; } },
      { t:'Türkisch? Deutsch?', go:'y_sprache', once:'q_y_sprache' },
      { t:'Wie lange sind Sie schon hier?', go:'y_lange', once:'q_y_lange' },
      { t:'Was ist zwölf?', go:'y_zwoelf', once:'q_y_zwoelf',
        when:function(){ return !!FLAG.tafelGesehen; } },
      { t:'(Nichts.)', go:null, repeatable:true }
    ]);
  },

  /* ---- Kapitel 6 ---- */
  sommer: function(){
    return dialogOptions([
      { t:'Kommt ein Paket nach Split durch?', go:'so_paket', once:'q_so_paket' },
      { t:'Was schreibt man in die Zollerklärung?', go:'so_zoll', unlock:'ZOLL',
        when:function(){ return INV.has('zollformular') && !FLAG.zollRichtig; } },
      { t:'Die Leitung nach Split ist tot.', go:'so_leitung', once:'q_so_leitung' },
      { t:'Medikamente — darf ich die schicken?', go:'so_medi', once:'q_so_medi',
        when:function(){ return !!FLAG.pSchoko; } },
      { t:'(Weitergehen.)', go:null, repeatable:true }
    ]);
  },
  lena_entscheidung: function(){
    return dialogOptions([
      { t:'Ihm sagen, was im Radio kam.', go:'le_sagen' },
      { t:'Nichts sagen. Nicht heute.', go:'le_schweigen' }
    ]);
  },

  /* ---- Dedo Muratović ----
     Ein Knoten fuer alle Kapitel. Was er sagt, haengt am Raum; was der
     Spieler fragen kann, an seinem Hut. Der Hut wird nie von ihm selbst
     erwaehnt -- die Option erscheint, weil der Spieler ihn sieht, und
     verschwindet, sobald danach gefragt wurde. */
  dedo: function(){
    var hut = dedoHutName();
    return dialogOptions([
      { t: DEDO_HUTFRAGE[R.id] || 'Was ist das für ein Hut?', go:'d_hut', unlock:'HUT',
        when:function(){ return !!hut && !FLAG['hut_' + hut]; } },
      { t: DEDO_FRAGE[R.id] || 'Was machst du hier?', go:'d_hier', once:'q_d_hier_' + R.id },
      { t: DEDO_ORTFRAGE[R.id] || '', go:'d_ort', once:'q_d_ort_' + R.id,
        when:function(){ return !!DEDO_ORTFRAGE[R.id]; } },
      { t:'Wie alt bist du eigentlich?', go:'d_alter', once:'q_d_alter' },
      { t:'Kennen wir uns?', go:'d_kennen', once:'q_d_kennen',
        when:function(){ return !!FLAG.dedoSchonGetroffen; } },
      { t:'(Weitergehen.)', go:null, repeatable:true }
    ]);
  },

  /* ---- Kapitel 6, aus L.s Sicht ---- */
  mann: function(){
    return dialogOptions([
      { t:'Und?', go:'mn_und', once:'q_mn_und' },
      { t:'Du frierst.', go:'mn_frieren', once:'q_mn_frieren' },
      { t:'(Nichts sagen.)', go:null, repeatable:true }
    ]);
  },

  /* ---- Kapitel 7 ---- */
  jure: function(){
    return dialogOptions([
      { t:'Die Steine liegen falsch.', go:'j_steine', once:'q_j_steine' },
      { t:'Wer unterschreibt so etwas?', go:'j_amt', once:'q_j_amt' },
      { t:'Jure. Ich brauche Hilfe.', go:'j_hilfe', unlock:'BITTEN',
        when:function(){ return !!(FLAG.q_j_steine && FLAG.q_j_amt) && !FLAG.jureHilft; } },
      { t:'Warum bist du eigentlich geblieben?', go:'j_geblieben', once:'q_j_geblieben' },
      { t:'(Nichts.)', go:null, repeatable:true }
    ]);
  },
  gestalt: function(){
    return dialogOptions([ { t:'Guten Abend.', go:'g_abend' } ]);
  }
};

/* ============================================================
   ANTWORTEN
   ============================================================ */
var DLG_RESP = {

  /* ---- Luka ---- */
  l_was: function(){
    play([
      { say:[NPC.luka, 'Nichts. Ich langweile mich.'] },
      { wait:0.8 },
      { say:[PL, 'Das ist auch etwas.'] },
      { wait:0.8 },
      { say:[NPC.luka, 'Papa sagt, du sagst so was, damit man aufhört zu fragen.'] },
      { wait:1.0 },
      { say:[PL, 'Dein Papa ist ein kluger Mann.'] },
      { dlg:'luka' }
    ]);
  },
  l_ball: function(){
    setFlag('lukaGefragt', true);
    play([
      { say:[NPC.luka, 'In der Garage. Ich komme nicht dran, da ist alles zu.'] },
      { wait:0.9 },
      { say:[PL, 'In der Garage ist nichts, was du brauchst.'] },
      { wait:0.9 },
      { say:[NPC.luka, 'Mein Ball.'] },
      { wait:1.1 },
      { say:[PL, '...'] },
      { wait:0.9 },
      { say:[PL, 'Also gut. Aber du fasst nichts an.'] },
      { wait:0.8 },
      { say:[NARR, 'Er hat etwas angefasst.'] }
    ]);
  },
  l_baka: function(){
    play([
      { say:[NPC.luka, 'Baka sagt, ich soll dich fragen.'] },
      { wait:1.0 },
      { say:[PL, 'Baka sagt viel.'] },
      { wait:0.8 },
      { say:[NPC.luka, 'Sie sagt, du erzählst nie was.'] },
      { wait:1.2 },
      { say:[PL, 'Es gibt nichts zu erzählen. Ich bin geboren, ich habe gearbeitet, jetzt sitze ich hier.'] },
      { wait:1.4 },
      { say:[NPC.luka, 'Das war jetzt aber schnell.'] },
      { dlg:'luka' }
    ]);
  },
  l_kiste: function(){
    play([
      { say:[NPC.luka, 'Ja.'] },
      { wait:1.2 },
      { say:[PL, 'Nichts Besonderes.'] },
      { wait:1.0 },
      { say:[NPC.luka, 'Warum machst du sie dann nicht auf?'] },
      { wait:1.6 },
      { say:[PL, 'Weil nichts Besonderes drin ist.'] },
      { wait:1.4 },
      { say:[NARR, 'Er hat mich angesehen, wie ein Neunjähriger jemanden ansieht, der gerade schlecht gelogen hat.'] }
    ]);
  },
  l_finale: function(){
    setFlag('lukaDabei', true);
    play([
      { fn:function(){ NPC.luka.walkTo(R.area, R.nodes, 760, 448, -1); } },
      { say:[NPC.luka, 'Über was?'] },
      { wait:1.2 },
      { say:[PL, 'Über eine Kiste.'] },
      { wait:1.6 },
      { say:[NARR, 'Er hat sich hingesetzt, ohne zu fragen, wie lange es dauert.'] }
    ]);
  },

  /* ---- Kapitel 1 ---- */
  o_rad: function(){
    setFlag('achseGesehen', true);
    play([
      { say:[NPC.otac, 'Ich sehe es.'] },
      { wait:1.2 },
      { say:[PL, 'Machst du es?'] },
      { wait:1.4 },
      { say:[NPC.otac, 'Nein.'] },
      { wait:1.2 },
      { say:[NPC.otac, 'Ich habe zwölf Jahre gebraucht, bis mein Vater mich einen Karren hat richten lassen. Du bist elf. Du bist mir voraus.'] },
      { wait:1.4 },
      { say:[PL, 'Und wenn ich es falsch mache?'] },
      { wait:1.2 },
      { say:[NPC.otac, 'Dann machst du es zweimal.'] },
      { dlg:'otac' }
    ]);
  },
  o_womit: function(){
    play([
      { say:[NPC.otac, 'Was hält Holz?'] },
      { wait:1.2 },
      { say:[PL, 'Holz?'] },
      { wait:1.0 },
      { say:[NPC.otac, 'Bis zum ersten Stein.'] },
      { wait:1.4 },
      { say:[NPC.otac, 'Was hält Eisen?'] },
      { wait:1.3 },
      { say:[PL, 'Eisen.'] },
      { wait:1.2 },
      { say:[NPC.otac, 'Und wo ist auf diesem Hof Eisen, das man entbehren kann?'] },
      { wait:1.6 },
      { say:[PL, '...'] },
      { wait:1.4 },
      { say:[NPC.otac, 'Denk nach. Und geh nicht ins Haus, deine Mutter hat genug zu tun.'] },
      { fn:function(){ setFlag('eisenHinweis', true); } }
    ]);
  },
  o_fertig: function(){
    setFlag('vaterEinverstanden', true);
    play([
      { fn:function(){ NPC.otac.walkTo(R.area, R.nodes, 740, 452, -1); } },
      { wait:0.6 },
      { fn:function(){ NPC.otac.doAct('take', 1.2); } },
      { wait:1.4 },
      { say:[NPC.otac, 'Hm.'] },
      { wait:1.6 },
      { say:[NPC.otac, 'Der Splint vom Brunnen.'] },
      { wait:1.4 },
      { say:[PL, 'Der Eimer hängt an einer Schnur.'] },
      { wait:1.4 },
      { say:[NPC.otac, 'Ich weiß.'] },
      { wait:1.6 },
      { say:[NPC.otac, 'Fahr los. Und sag dem Müller, ich zähle mit.'] },
      { wait:1.4 },
      { say:[NARR, 'Das war das Lob. Es hat mir für zwei Jahre gereicht.'] }
    ]);
  },
  o_weggehen: function(){
    play([
      { say:[NPC.otac, 'Wohin?'] },
      { wait:1.2 },
      { say:[PL, 'Der Sohn vom Ivo ist in Deutschland.'] },
      { wait:1.4 },
      { say:[NPC.otac, 'Der Sohn vom Ivo hat kein Feld.'] },
      { wait:1.6 },
      { say:[NPC.otac, 'Wer weggeht, hat nichts zu verlieren. Wir haben das hier.'] },
      { wait:1.8 },
      { say:[NARR, 'Achtzehn Jahre später bin ich weggegangen. Er hat mich zum Bus gebracht und nichts gesagt.'] },
      { dlg:'otac' }
    ]);
  },
  m_mehl: function(){
    setFlag('achseGesehen', true);
    play([
      { say:[NPC.majka, 'Mit dem Karren?'] },
      { wait:1.0 },
      { say:[PL, 'Ja.'] },
      { wait:1.0 },
      { say:[NPC.majka, 'Der Karren steht schief seit Dienstag.'] },
      { wait:1.2 },
      { say:[PL, 'Ich mache ihn.'] },
      { wait:1.4 },
      { say:[NPC.majka, 'Dann mach ihn. Aber die Achse ist trocken, und trocken geht kein Rad drauf.'] },
      { wait:1.6 },
      { say:[NARR, 'Sie hat nicht gesagt, womit man eine Achse fettet. Sie hat gewartet, ob ich es weiß.'] }
    ]);
  },
  m_achse: function(){
    setFlag('speckErlaubt', true);
    play([
      { say:[NPC.majka, 'Die Schwarte hängt am Haken.'] },
      { wait:1.2 },
      { say:[PL, 'Danke.'] },
      { wait:1.0 },
      { say:[NPC.majka, 'Und bring sie zurück. Die ist noch gut.'] },
      { wait:1.4 },
      { say:[PL, 'Zurückbringen? Nach dem Fetten?'] },
      { wait:1.2 },
      { say:[NPC.majka, 'Du hast mich verstanden.'] },
      { wait:1.6 },
      { say:[NARR, 'Ich habe sie zurückgebracht. Sie lag drei Tage später noch im Speiseplan.'] }
    ]);
  },
  m_sack: function(){
    play([
      { say:[NPC.majka, 'Ich weiß.'] },
      { wait:1.4 },
      { say:[PL, 'Für wie lange reicht es noch?'] },
      { wait:1.6 },
      { say:[NPC.majka, 'Bis du zurück bist.'] },
      { wait:1.8 },
      { say:[NARR, 'Das war keine Aufmunterung. Das war eine Zeitangabe.'] }
    ]);
  },
  m_essen: function(){
    play([
      { say:[NPC.majka, 'Wenn das Mehl da ist.'] },
      { wait:1.4 },
      { say:[PL, 'Und wenn es nicht kommt?'] },
      { wait:1.4 },
      { say:[NPC.majka, 'Dann gibt es Zwiebeln.'] },
      { wait:1.6 },
      { say:[NARR, 'Es gab oft Zwiebeln. Ich esse sie bis heute gern, und ich weiß nicht, ob das trotzig ist oder ehrlich.'] },
      { dlg:'majka' }
    ]);
  },
  ow_elf: function(){
    play([
      { say:[NPC.otac, 'Zähl noch mal.'] },
      { wait:1.4 },
      { say:[PL, 'Ich habe zweimal gezählt.'] },
      { wait:1.4 },
      { say:[NPC.otac, 'Dann hast du zweimal dasselbe falsch gemacht.'] },
      { wait:1.8 },
      { say:[NPC.otac, 'Du zählst, was hell ist.'] },
      { wait:2.0 },
      { say:[PL, '...'] }
    ]);
  },
  ow_zwoelf: function(){
    setFlag('vaterAuftrag', true);
    play([
      { say:[NPC.otac, 'Gut.'] },
      { wait:1.4 },
      { say:[NPC.otac, 'Dann geh runter. Der Karren steht schief seit Dienstag, und im Sack ist nichts mehr.'] },
      { wait:1.8 },
      { say:[PL, 'Allein?'] },
      { wait:1.4 },
      { say:[NPC.otac, 'Ich komme nach. Einer muss bei den Ziegen bleiben.'] },
      { wait:1.6 },
      { say:[NPC.otac, 'Bei allen zwölf.'] },
      { wait:1.8 },
      { say:[NARR, 'Er ist nachgekommen. Er ist immer nachgekommen, und immer erst dann, wenn nichts mehr zu machen war.'] }
    ]);
  },
  ow_auftrag: function(){
    play([
      { say:[NPC.otac, 'Karren richten. Mehl holen. Vor dem Dunkeln zurück.'] },
      { wait:1.6 },
      { say:[PL, 'Und wenn ich den Karren nicht hinkriege?'] },
      { wait:1.6 },
      { say:[NPC.otac, 'Dann kriegst du ihn morgen hin.'] },
      { wait:1.8 },
      { say:[NARR, 'Es hat nie jemand gesagt, dass etwas nicht geht. Es hieß immer nur, dass es länger dauert.'] }
    ]);
  },
  ow_sitzen: function(){
    play([
      { say:[NPC.otac, 'Nein.'] },
      { wait:1.4 },
      { say:[PL, 'Es sieht so aus.'] },
      { wait:1.4 },
      { say:[NPC.otac, 'Ich passe auf.'] },
      { wait:1.6 },
      { say:[PL, 'Worauf?'] },
      { wait:1.6 },
      { say:[NPC.otac, 'Darauf, dass du aufpasst.'] },
      { wait:2.0 },
      { say:[NARR, 'Vierzig war er da. Er sah aus wie sechzig, und ich habe ihn für alt gehalten.'] }
    ]);
  },

  a_warten: function(){
    play([
      { say:[NPC.andrin, 'Nein. Ich sehe nur.'] },
      { wait:1.2 },
      { say:[PL, 'Was denn?'] },
      { wait:1.2 },
      { say:[NPC.andrin, 'Die Brücke.'] },
      { wait:1.4 },
      { say:[PL, 'Die ist immer da.'] },
      { wait:1.4 },
      { say:[NPC.andrin, 'Eben.'] },
      { dlg:'andrin' }
    ]);
  },
  a_buch: function(){
    play([
      { say:[NPC.andrin, 'Noch nichts. Ich schreibe es.'] },
      { wait:1.4 },
      { say:[PL, 'Worüber?'] },
      { wait:1.2 },
      { say:[NPC.andrin, 'Über Leute, die an einem Fluss wohnen.'] },
      { wait:1.4 },
      { say:[PL, 'Das sind wir.'] },
      { wait:1.4 },
      { say:[NPC.andrin, 'Ja.'] },
      { wait:1.6 },
      { say:[PL, 'Steht da auch was Gutes drin?'] },
      { wait:1.6 },
      { say:[NPC.andrin, 'Es steht drin, was war. Das Gute muss der Leser selber finden.'] },
      { dlg:'andrin' }
    ]);
  },
  a_bruecke: function(){
    play([
      { say:[NPC.andrin, 'Leute, die schon lange tot sind.'] },
      { wait:1.3 },
      { say:[NPC.andrin, 'Und sie haben sie nicht für sich gebaut. Eine Brücke baut man immer für die, die danach kommen.'] },
      { wait:1.8 },
      { say:[PL, 'Warum baut man dann eine?'] },
      { wait:1.6 },
      { say:[NPC.andrin, 'Weil ein Fluss nur eine Sache kann: trennen.'] },
      { wait:1.8 },
      { say:[NPC.andrin, 'Und weil es Leute gibt, die das nicht hinnehmen.'] },
      { wait:2.0 },
      { say:[NPC.andrin, 'Eine Brücke bauen heißt, den Fluss nicht mehr zu fürchten.'] },
      { wait:2.2 },
      { say:[NARR, 'Ich war elf. Ich habe das Wort hinnehmen nicht gekannt. Ich habe es an diesem Tag gelernt.'] },
      { dlg:'andrin' }
    ]);
  },
  p_kasten: function(){
    play([
      { say:[NPC.petar, 'Ein Radio.'] },
      { wait:1.2 },
      { say:[PL, 'Ich weiß, wie ein Radio aussieht.'] },
      { wait:1.2 },
      { say:[NPC.petar, 'Dann weißt du mehr als die meisten hier.'] },
      { wait:1.6 },
      { say:[NPC.petar, 'Ich habe ihn aus Mostar. Getauscht gegen zwei Winter Nachhilfe.'] },
      { wait:1.8 },
      { dlg:'petar' }
    ]);
  },
  p_draussen: function(){
    play([
      { say:[NPC.petar, 'Weil drinnen niemand zuhört.'] },
      { wait:1.4 },
      { say:[PL, 'Und draußen?'] },
      { wait:1.2 },
      { say:[NPC.petar, 'Draußen bleiben sie stehen und tun so, als gingen sie vorbei.'] },
      { wait:1.8 },
      { say:[NARR, 'Er hatte recht. Meine Mutter ist zweimal am Tag vorbeigegangen, und sie hatte dort nichts zu tun.'] },
      { wait:1.8 },
      { dlg:'petar' }
    ]);
  },
  p_kaputt: function(){
    setFlag('radioGefragt', true);
    play([
      { say:[NPC.petar, 'Seit Ostern nicht mehr.'] },
      { wait:1.3 },
      { say:[PL, 'Was fehlt ihm?'] },
      { wait:1.2 },
      { say:[NPC.petar, 'Wenn ich das wüsste, stünde er nicht hier draußen und schwiege.'] },
      { wait:1.8 },
      { say:[NPC.petar, 'Sieh du nach. Du hast kleinere Hände.'] },
      { wait:1.8 },
      { dlg:'petar' }
    ]);
  },
  p_laeuft: function(){
    play([
      { say:[NPC.petar, 'Es läuft.'] },
      { wait:1.4 },
      { say:[NPC.petar, 'Und der Draht dafür lag zwei Jahre in eurer Küche und hat nichts getan.'] },
      { wait:1.8 },
      { say:[PL, 'Er war ein Wecker.'] },
      { wait:1.2 },
      { say:[NPC.petar, 'Er war Kupfer. Ein Wecker war er nur nebenbei.'] },
      { wait:2.0 },
      { say:[NARR, 'Diesen Satz habe ich sechsunddreißig Jahre später in einer deutschen Halle wieder gebraucht.'] },
      { wait:1.8 },
      { dlg:'petar' }
    ]);
  },
  p_schule: function(){
    play([
      { say:[NPC.petar, 'Rechnen. Schreiben. Und wo die Dinge herkommen.'] },
      { wait:1.6 },
      { say:[PL, 'Mein Vater sagt, ich lerne das auf dem Feld.'] },
      { wait:1.6 },
      { say:[NPC.petar, 'Auf dem Feld lernst du, wo das Brot herkommt. Das ist die Hälfte.'] },
      { wait:2.0 },
      { say:[NARR, 'Ich habe die andere Hälfte nie gelernt. Meine Kinder schon.'] },
      { wait:1.8 },
      { dlg:'petar' }
    ]);
  },

  a_wohnen: function(){
    play([
      { say:[NPC.andrin, 'Ich habe hier gewohnt. Lange her.'] },
      { wait:1.4 },
      { say:[PL, 'Und jetzt?'] },
      { wait:1.2 },
      { say:[NPC.andrin, 'Jetzt wohne ich in Belgrad und komme hierher, um nachzudenken.'] },
      { wait:1.6 },
      { say:[PL, 'Kann man nicht überall nachdenken?'] },
      { wait:1.6 },
      { say:[NPC.andrin, 'Doch. Aber nicht über alles.'] },
      { dlg:'andrin' }
    ]);
  },
  a_ende: function(){
    setFlag('andrinGesprochen', true);
    play([
      { say:[NPC.andrin, 'Geh nur.'] },
      { wait:1.2 },
      { say:[NPC.andrin, 'Wie heißt du?'] },
      { wait:1.2 },
      { say:[PL, 'M.'] },
      { wait:1.4 },
      { say:[NPC.andrin, 'Gut. Dann weiß ich, wer über die Brücke gegangen ist.'] },
      { wait:1.8 },
      { say:[NARR, 'Neun Jahre später habe ich sein Bild in der Zeitung gesehen. Es stand etwas von einem Preis darunter.'] },
      { wait:1.6 },
      { say:[NARR, 'Ich habe es niemandem erzählt. Wer hätte mir das geglaubt.'] }
    ]);
  },

  /* ---- Kapitel 2 ---- */
  le_kein: function(){
    setFlag('lehrerGefragt', true);
    play([
      { say:[NPC.lehrer, 'Dann besorgst du dir eins.'] },
      { wait:1.2 },
      { say:[PL, 'Ich habe kein Geld.'] },
      { wait:1.2 },
      { say:[NPC.lehrer, 'Das habe ich nicht gefragt.'] },
      { wait:1.6 },
      { say:[NPC.lehrer, 'In zwanzig Minuten kommt er hier durch. Bis dahin hat jeder aus dieser Klasse ein Fähnchen.'] },
      { wait:1.6 },
      { say:[NPC.lehrer, 'Jeder.'] },
      { dlg:'lehrer' }
    ]);
  },
  le_wo: function(){
    play([
      { say:[NPC.lehrer, 'Das ist nicht meine Aufgabe.'] },
      { wait:1.4 },
      { say:[PL, 'Was ist Ihre Aufgabe?'] },
      { wait:1.4 },
      { say:[NPC.lehrer, 'Zählen.'] },
      { wait:1.6 },
      { say:[NARR, 'Er hat uns dreimal gezählt und ist dreimal auf eine andere Zahl gekommen. Er hat es nie gemerkt.'] },
      { dlg:'lehrer' }
    ]);
  },
  le_stift: function(){
    setFlag('tintenstift', true);
    play([
      { say:[NPC.lehrer, 'Wozu.'] },
      { wait:1.2 },
      { say:[PL, 'Für das Fähnchen.'] },
      { wait:1.4 },
      { say:[NPC.lehrer, 'Hm. Wenigstens einer denkt mit.'] },
      { wait:1.4 },
      { say:[PL, 'Der Stift ist blau.'] },
      { wait:1.2 },
      { say:[NPC.lehrer, 'Tintenstifte sind immer blau. Zurückgeben.'] },
      { wait:1.4 },
      { fn:function(){ pruefeFaehnchen(); } }
    ]);
  },
  le_warum: function(){
    play([
      { say:[NPC.lehrer, 'Weil es Freude ist.'] },
      { wait:1.4 },
      { say:[PL, 'Und wenn man keine hat?'] },
      { wait:1.6 },
      { say:[NPC.lehrer, '...'] },
      { wait:1.4 },
      { say:[NPC.lehrer, 'Dann winkt man trotzdem, und am Montag reden wir nicht darüber.'] },
      { wait:1.8 },
      { say:[NARR, 'Er war kein schlechter Mann. Er hatte drei Kinder und eine Frau, die krank war.'] },
      { dlg:'lehrer' }
    ]);
  },
  s_preis: function(){
    play([
      { say:[PL, 'Was kostet die Zeitung?'] },
      { wait:1.0 },
      { say:[NARR, 'Zehn Dinar. Ich hatte null.'] },
      { wait:1.4 },
      { say:[PL, 'Und wenn ich nur eine Seite nehme?'] },
      { wait:1.2 },
      { say:[NARR, 'Er hat gelacht. Nicht böse. Aber er hat gelacht.'] },
      { dlg:'stand' }
    ]);
  },
  s_gestern: function(){
    play([
      { say:[NARR, 'Gestern gehört dem Verlag, hat er gesagt. Was übrig bleibt, geht zurück.'] },
      { wait:1.4 },
      { say:[PL, 'Und was zerrissen ist?'] },
      { wait:1.4 },
      { say:[NARR, 'Was zerrissen ist, geht auch zurück. Aber niemand zählt nach.'] },
      { wait:1.6 },
      { say:[PL, 'Aha.'] },
      { dlg:'stand' }
    ]);
  },
  s_tipp: function(){
    setFlag('retoureBekommen', true);
    play([
      { say:[PL, 'Der Umzug kommt hier herunter. Nicht über die Hauptstraße.'] },
      { wait:1.4 },
      { say:[NARR, 'Er hat aufgehört, Zigaretten zu sortieren.'] },
      { wait:1.2 },
      { say:[PL, 'Ich habe es beim Lehrer gehört. In zwanzig Minuten.'] },
      { wait:1.6 },
      { say:[NARR, 'Er hat den Stand um zwei Meter geschoben, an die Ecke. Dann hat er mir ein halbes Blatt hingelegt, ohne mich anzusehen.'] },
      { wait:1.8 },
      { say:[NARR, 'So funktionierte das. Niemand schenkte etwas. Alle tauschten, und Information war die härteste Währung.'] }
    ]);
  },

  /* ---- Kapitel 3 ---- */
  z_befehle: function(){
    setFlag('befehleGehoert', true);
    play([
      { say:[NPC.zdravko, 'MATROSE!'] },
      { wait:0.9 },
      { say:[NPC.zdravko, 'Erstens: Die Flagge wird um Punkt neun Uhr gehisst. Punkt neun.'] },
      { wait:1.4 },
      { say:[NPC.zdravko, 'Zweitens: Der Bordstein ist bis neun Uhr weiß. Bis neun.'] },
      { wait:1.4 },
      { say:[NPC.zdravko, 'Drittens: Die Kammer ist um neun Uhr verschlossen und der Schlüssel bei mir. Um neun.'] },
      { wait:1.8 },
      { say:[PL, 'Narednik, das ist —'] },
      { wait:1.0 },
      { say:[NPC.zdravko, 'WAS?'] },
      { wait:1.2 },
      { say:[PL, '— vollkommen klar, Narednik.'] },
      { wait:1.4 },
      { fn:function(){ INV.add('befehl1'); INV.add('befehl2'); INV.add('befehl3'); } },
      { say:[NARR, 'Es war zehn vor neun.'] }
    ]);
  },
  z_drei: function(){
    play([
      { say:[NPC.zdravko, 'Um neun.'] },
      { wait:1.2 },
      { say:[PL, 'Ich bin einer.'] },
      { wait:1.4 },
      { say:[NPC.zdravko, 'Und ich bin Narednik. Wir haben beide unser Kreuz zu tragen.'] },
      { wait:1.6 },
      { say:[NPC.zdravko, 'Der Admiral kommt um neun Uhr fünf. Bis dahin sieht alles aus, als wäre es immer so gewesen.'] },
      { wait:1.8 },
      { say:[NARR, 'Das ist die eigentliche Regel jeder Armee, und niemand schreibt sie auf.'] },
      { dlg:'zdravko' }
    ]);
  },
  z_schluessel: function(){
    INV.add('kammerschluessel');
    play([
      { say:[NPC.zdravko, 'Hier. Und ich will ihn um neun zurück.'] },
      { wait:1.2 },
      { say:[PL, 'Um neun.'] },
      { wait:1.0 },
      { say:[NPC.zdravko, 'Um neun.'] }
    ]);
  },
  z_abgabe: function(){
    INV.drop('kammerschluessel');
    play([
      { say:[NPC.zdravko, '...'] },
      { wait:1.4 },
      { say:[NPC.zdravko, 'Neun Uhr null.'] },
      { wait:1.4 },
      { say:[NPC.zdravko, 'Matrose, ich weiß nicht, wie Sie das gemacht haben, und ich werde es nicht fragen.'] },
      { wait:1.8 },
      { say:[PL, 'Danke, Narednik.'] },
      { wait:1.2 },
      { say:[NPC.zdravko, 'Das war kein Lob. Gehen Sie zum Steg, der Admiral will die Leute sehen.'] }
    ]);
  },
  z_admiral: function(){
    play([
      { say:[NPC.zdravko, 'Pivopija ist nicht sein Name.'] },
      { wait:1.4 },
      { say:[PL, 'Sondern?'] },
      { wait:1.2 },
      { say:[NPC.zdravko, 'Sein Name ist egal. Pivopija ist, was er ist.'] },
      { wait:1.6 },
      { say:[NPC.zdravko, 'Und bevor Sie grinsen, Matrose: der Mann hat 1943 auf Vis vierzig Leute von einem brennenden Boot geholt.'] },
      { wait:1.8 },
      { say:[NPC.zdravko, 'Man darf über ihn lachen. Aber man muss wissen, worüber man lacht.'] },
      { dlg:'zdravko' }
    ]);
  },

  /* ---- Kapitel 4 ---- */
  n_amt: function(){
    setFlag('lenaGefragt', true);
    play([
      { say:[NPC.lena, 'Zum wievielten Mal?'] },
      { wait:1.2 },
      { say:[PL, 'Vierten.'] },
      { wait:1.2 },
      { say:[NPC.lena, 'Nimm den Antrag mit. Und geh nicht vor elf, vor elf ist er schlecht gelaunt.'] },
      { wait:1.6 },
      { say:[PL, 'Woher weißt du das?'] },
      { wait:1.2 },
      { say:[NPC.lena, 'Ich war schon dreimal dort, während du gearbeitet hast.'] },
      { wait:1.8 },
      { say:[NARR, 'Sie hat nie gesagt, dass sie dort war. Ich habe es an diesem Tag zum ersten Mal erfahren.'] }
    ]);
  },
  n_zimmer: function(){
    play([
      { say:[NPC.lena, 'Nein.'] },
      { wait:1.4 },
      { say:[PL, 'Wir sind zu viert.'] },
      { wait:1.2 },
      { say:[NPC.lena, 'Wir werden zu fünft.'] },
      { wait:1.8 },
      { say:[PL, '...'] },
      { wait:1.6 },
      { say:[NPC.lena, 'Jetzt geh zum Amt.'] },
      { dlg:'lena' }
    ]);
  },
  n_sagen: function(){
    play([
      { say:[NPC.lena, 'Nichts von uns. Die kennen uns nicht.'] },
      { wait:1.4 },
      { say:[NPC.lena, 'Sag ihnen, was in ihren Formularen steht. Wort für Wort.'] },
      { wait:1.6 },
      { say:[NPC.lena, 'Und wenn einer keine Zeit hat, dann hast du Zeit. Mehr als er.'] },
      { wait:1.8 },
      { say:[NARR, 'Das ist die beste Verhandlungslehre, die ich je bekommen habe, und sie hat vier Sätze gedauert.'] },
      { dlg:'lena' }
    ]);
  },
  n_schluessel: function(){
    play([
      { say:[NPC.lena, 'Zeig.'] },
      { wait:1.2 },
      { fn:function(){ NPC.lena.doAct('reach', 0.9); } },
      { wait:1.2 },
      { say:[NPC.lena, 'Dritter Stock.'] },
      { wait:1.4 },
      { say:[PL, 'Kein Aufzug.'] },
      { wait:1.2 },
      { say:[NPC.lena, 'Gut. Dann bleiben die Kinder schlank.'] },
      { wait:1.8 },
      { fn:function(){ beendeKapitel(4); } }
    ]);
  },
  k_auto: function(){
    setFlag('ficaGehoert', true);
    play([
      { say:[NARR, 'Er hat zwanzig Minuten geredet. Zusammengefasst: die Düse ist hin, es gibt keine, und ohne Auto kommt er nicht zum Bruder seiner Frau nach Ilidža.'] },
      { wait:1.8 },
      { say:[PL, 'Und was macht der Bruder Ihrer Frau?'] },
      { wait:1.4 },
      { say:[NARR, 'Nichts, hat er gesagt. Er sitzt im Wohnungsamt und macht nichts.'] },
      { wait:1.8 },
      { say:[PL, '...'] },
      { wait:1.2 },
      { say:[NARR, 'Manchmal ist ein Gespräch ein Türöffner, und man merkt es erst am letzten Satz.'] }
    ]);
  },
  k_duese: function(){
    play([
      { say:[PL, 'Ich hätte eine Düse. Sie liegt seit einem Jahr in meiner Tasche.'] },
      { wait:1.4 },
      { fn:function(){ INV.add('ersatzteil'); } },
      { say:[NARR, 'Man wirft so etwas nicht weg. Man wartet, bis jemand kommt, der es braucht.'] },
      { wait:1.6 },
      { say:[PL, 'Ich baue sie ein. Und wir reden nicht über Geld.'] },
      { wait:1.6 },
      { say:[NARR, 'Über Geld zu reden hätte alles kaputt gemacht. Geld ist eine Schuld, die man begleicht. Ein Gefallen ist eine, die bleibt.'] }
    ]);
  },
  k_amt: function(){
    play([
      { say:[NARR, 'Er hat genickt, ist in den Kiosk gegangen und hat telefoniert. Vier Minuten.'] },
      { wait:1.6 },
      { say:[NARR, 'Dann kam er heraus und sagte: Geh morgen um elf. Frag nach Dževad. Sag nichts von mir.'] },
      { wait:1.8 },
      { fn:function(){ setFlag('nameBekannt', true); } },
      { say:[PL, 'Und wenn er fragt, wer mich schickt?'] },
      { wait:1.4 },
      { say:[NARR, 'Dann schickt dich niemand, hat er gesagt. Genau das ist der Punkt.'] }
    ]);
  },
  k_kaffee: function(){
    setFlag('kaffeeBekommen', true);
    INV.add('kaffee');
    play([
      { say:[NARR, 'Er hat ein Päckchen auf den Tresen gelegt und weggesehen.'] },
      { wait:1.4 },
      { say:[PL, 'Das ist keine Bestechung.'] },
      { wait:1.4 },
      { say:[NARR, 'Natürlich nicht. Es ist Kaffee. Bestechung ist, wenn man dafür etwas verlangt.'] },
      { wait:1.6 },
      { say:[NARR, 'Man verlangt nichts. Man stellt ihn hin und geht.'] }
    ]);
  },
  sa_auto: function(){ safetSzene(); },
  sa_gut: function(){
    play([
      { say:[NPC.safet, 'Danke.'] },
      { wait:1.4 },
      { say:[NARR, 'Er hat es gesagt, wie man Bescheid gibt. Nicht unhöflich. Nur fertig.'] },
      { dlg:'safet' }
    ]);
  },

  /* ---- Kapitel 5 ---- */
  kr_warten: function(){
    setFlag('zettelBekommen', true);
    play([
      { say:[NPC.krause, 'So, Herr... äh. Sie machen heute die Zwölfer, ja? Zettel hab ich Ihnen geschrieben.'] },
      { wait:1.6 },
      { say:[NPC.krause, 'Anschlag auf zwölf, Vorschub wie gehabt, und wenn was klemmt, holen Sie mich.'] },
      { wait:1.8 },
      { say:[PL, 'Ja.'] },
      { wait:1.2 },
      { say:[NPC.krause, 'Gut. Alles klar?'] },
      { wait:1.2 },
      { say:[PL, 'Ja.'] },
      { wait:1.6 },
      { say:[NARR, 'Ja war das einzige Wort, das ich sicher konnte. Es hat mich das erste halbe Jahr durchgebracht und einmal fast einen Finger gekostet.'] }
    ]);
  },
  kr_zeigen: function(){
    play([
      { fn:function(){ PL.doAct('reach', 0.9); } },
      { say:[NPC.krause, 'Ja, der Zettel. Steht doch alles drauf.'] },
      { wait:1.6 },
      { say:[NPC.krause, 'Zwölf. Da. Zwölf!'] },
      { wait:1.4 },
      { say:[NARR, 'Er hat lauter gesprochen. Das machen alle. Als ob Lautstärke eine Sprache wäre.'] },
      { wait:1.8 },
      { fn:function(){ NPC.krause.walkTo(R.area, R.nodes, 380, 440, -1); } },
      { say:[PL, 'Er geht.'] }
    ]);
  },
  kr_maschine: function(){
    play([
      { fn:function(){ NPC.krause.walkTo(R.area, R.nodes, 760, 446, 1); } },
      { wait:1.2 },
      { say:[NPC.krause, 'Sieh an.'] },
      { wait:1.4 },
      { fn:function(){ NPC.krause.doAct('reach', 1.0); } },
      { say:[NPC.krause, 'Zwölf Komma null. Passt.'] },
      { wait:1.6 },
      { say:[NPC.krause, 'Sagen Sie mal, verstehen Sie mich eigentlich?'] },
      { wait:1.8 },
      { say:[PL, 'Ja.'] },
      { wait:1.4 },
      { say:[NPC.krause, 'Dachte ich mir.'] },
      { wait:1.6 },
      { say:[NARR, 'Er hat es nicht böse gemeint. Er hat es einfach nie überprüft, und ich habe ihn nie gezwungen.'] }
    ]);
  },
  y_zettel: function(){
    setFlag('skizzeBekommen', true);
    INV.add('skizze');
    play([
      { fn:function(){ PL.doAct('reach', 0.8); } },
      { say:[NPC.yilmaz, 'Hm.'] },
      { wait:1.2 },
      { say:[NPC.yilmaz, 'Zwölf.'] },
      { wait:1.0 },
      { say:[PL, 'Maschine zwölf?'] },
      { wait:1.2 },
      { say:[NPC.yilmaz, 'Nein.'] },
      { wait:1.4 },
      { fn:function(){ NPC.yilmaz.doAct('take', 1.4); } },
      { say:[NARR, 'Er hat den Zimmermannsbleistift genommen und auf die Pappe gezeichnet.'] },
      { wait:1.6 },
      { say:[NARR, 'Ein Rechteck. Eine Linie. Ein kleiner Pfeil dazwischen, und daneben: 12.'] },
      { wait:1.8 },
      { say:[NPC.yilmaz, 'Zwölf hier. Nicht Maschine. Hier.'] },
      { wait:1.6 },
      { say:[PL, 'Millimeter.'] },
      { wait:1.2 },
      { say:[NPC.yilmaz, 'Millimeter.'] },
      { wait:1.6 },
      { say:[NPC.yilmaz, 'Und Schlüssel dreizehn. Spind.'] },
      { wait:1.4 },
      { say:[NARR, 'Zwei Zeichnungen und vier Wörter. Der Meister hatte sieben Wörter gebraucht und nichts erklärt.'] }
    ]);
  },
  y_sprache: function(){
    play([
      { say:[NPC.yilmaz, 'Türkisch. Deutsch — so.'] },
      { wait:1.2 },
      { fn:function(){ NPC.yilmaz.doAct('reach', 0.7); } },
      { say:[NARR, 'Er hat die Hand gewackelt. Das heißt in jeder Sprache dasselbe.'] },
      { wait:1.4 },
      { say:[PL, 'Bei mir auch so.'] },
      { wait:1.2 },
      { say:[NPC.yilmaz, 'Gut. Dann verstehen wir uns.'] },
      { wait:1.6 },
      { say:[NARR, 'Wir haben uns elf Jahre lang verstanden und nie herausgefunden, in welcher Sprache.'] },
      { dlg:'yilmaz' }
    ]);
  },
  y_lange: function(){
    play([
      { say:[NPC.yilmaz, 'Ein Jahr. Zwei Monate.'] },
      { wait:1.4 },
      { say:[PL, 'Und?'] },
      { wait:1.2 },
      { say:[NPC.yilmaz, 'Und drei Jahre noch. Dann Haus.'] },
      { wait:1.6 },
      { say:[PL, 'Wo?'] },
      { wait:1.2 },
      { say:[NPC.yilmaz, 'Zu Hause.'] },
      { wait:1.8 },
      { say:[NARR, 'Er ist 2009 in Duisburg gestorben. Seine Enkel wohnen dort. Das Haus steht und ist leer.'] },
      { dlg:'yilmaz' }
    ]);
  },
  y_zwoelf: function(){
    play([
      { say:[NPC.yilmaz, 'Kommt drauf an, wo es steht.'] },
      { wait:1.6 },
      { say:[NPC.yilmaz, 'An der Wand: Maschine. Auf dem Zettel: Maß.'] },
      { wait:1.8 },
      { say:[PL, 'Woher weiß man das?'] },
      { wait:1.4 },
      { say:[NPC.yilmaz, 'Man macht es falsch. Einmal.'] },
      { dlg:'yilmaz' }
    ]);
  },

  /* ---- Kapitel 6 ---- */
  so_paket: function(){
    setFlag('sommerGefragt', true);
    play([
      { say:[NPC.sommer, 'Nach Split? Ja. Nach Split geht das noch.'] },
      { wait:1.4 },
      { say:[PL, 'Und weiter?'] },
      { wait:1.4 },
      { say:[NPC.sommer, 'Weiter... da kann ich Ihnen nichts sagen. Da ist die Post nicht mehr zuständig.'] },
      { wait:1.8 },
      { say:[NPC.sommer, 'Aber es kommt an, wenn es jemanden in Split gibt, der es abholt.'] },
      { wait:1.8 },
      { say:[PL, 'Es gibt jemanden in Split.'] },
      { wait:1.4 },
      { say:[NPC.sommer, 'Dann rufen Sie ihn an.'] }
    ]);
  },
  so_zoll: function(){
    setFlag('zollRichtig', true);
    play([
      { say:[NPC.sommer, 'Ich darf Ihnen nicht sagen, was Sie schreiben sollen.'] },
      { wait:1.6 },
      { say:[PL, 'Verstehe.'] },
      { wait:1.4 },
      { say:[NPC.sommer, 'Ich kann Ihnen nur sagen, was zurückkommt.'] },
      { wait:1.6 },
      { say:[NPC.sommer, 'Alles, wo ein Wert drinsteht. Und alles, wo Arzneimittel steht.'] },
      { wait:1.8 },
      { say:[NPC.sommer, 'Was durchgeht, ist Gebrauchte Kleidung und Lebensmittel. Geschenk. Ohne Handelswert.'] },
      { wait:2.0 },
      { say:[PL, 'Und die Tabletten?'] },
      { wait:1.4 },
      { say:[NPC.sommer, 'Welche Tabletten?'] },
      { wait:1.8 },
      { say:[NARR, 'Sie hat mich dabei angesehen. Sie war einundfünfzig, aus Recklinghausen, und sie hat nie in ihrem Leben eine Vorschrift gebrochen.'] },
      { wait:2.0 },
      { say:[NARR, 'An diesem Nachmittag hat sie eine umschifft, ohne einen einzigen falschen Satz zu sagen.'] }
    ]);
  },
  so_leitung: function(){
    play([
      { say:[NPC.sommer, 'Nach Bosnien kommen Sie gar nicht durch, das ist seit Wochen so.'] },
      { wait:1.6 },
      { say:[PL, 'Und nach Split?'] },
      { wait:1.2 },
      { say:[NPC.sommer, 'Split ist Kroatien. Da geht manchmal was. Meistens morgens.'] },
      { wait:1.6 },
      { say:[NPC.sommer, 'Und die Vorwahl hat sich geändert. Das wissen viele nicht.'] },
      { wait:1.8 },
      { fn:function(){ setFlag('vorwahlBekannt', true); } },
      { say:[NARR, 'Das war die wichtigste Auskunft, die ich in diesem Winter bekommen habe, und sie hat nichts gekostet.'] }
    ]);
  },
  so_medi: function(){
    play([
      { say:[NPC.sommer, 'Da drüben ist die Apotheke.'] },
      { wait:1.4 },
      { say:[NPC.sommer, 'Fragen Sie nicht mich. Fragen Sie den Apotheker, was man braucht, wenn es kalt ist und kein Arzt da.'] },
      { wait:2.0 },
      { say:[PL, 'Danke.'] },
      { dlg:'sommer' }
    ]);
  },
  le_sagen: function(){ lenaEnde(true); },
  le_schweigen: function(){ lenaEnde(false); },

  /* ------------------------------------------------------------
     Der Hut-Gag. Jeder Hut hat seine eigene Geschichte, und jede wird
     genau einmal erzaehlt. Danach ist die Option weg -- ein Running
     Gag, den man nachschlagen kann, ist keiner mehr.
     ------------------------------------------------------------ */
  d_hut: function(){
    var hut = dedoHutName();
    setFlag('hut_' + hut, true);
    var texte = {
      sombrero: [
        [PL, 'Was ist das für ein Hut?'],
        [NPC.dedo, 'Ein Hut.'],
        [PL, 'Das ist ein Sombrero.'],
        [NPC.dedo, 'Wenn du das sagst.'],
        [PL, 'Woher hast du den?'],
        [NPC.dedo, 'Getauscht. Gegen zwei Kilo Zwiebeln.'],
        [PL, 'Von wem?'],
        [NPC.dedo, 'Von einem, der zwei Kilo Zwiebeln brauchte.']
      ],
      stroh: [
        [PL, 'Der Hut ist etwas groß.'],
        [NPC.dedo, 'Der Schatten ist genau richtig.'],
        [PL, 'Man sieht dein Gesicht nicht mehr.'],
        [NPC.dedo, 'Das ist der zweite Vorteil.']
      ],
      fez: [
        [PL, 'Ein Fez.'],
        [NPC.dedo, 'Von meinem Großvater.'],
        [PL, 'Und er hat ihn dir gegeben?'],
        [NPC.dedo, 'Er hat nicht widersprochen.']
      ],
      bauhelm: [
        [PL, 'Arbeitest du auf dem Bau?'],
        [NPC.dedo, 'Nein.'],
        [PL, 'Warum der Helm?'],
        [NPC.dedo, 'Weil oben immer etwas herunterkommt. Irgendwann.']
      ],
      doktor: [
        [PL, 'Hast du studiert?'],
        [NPC.dedo, 'Nein.'],
        [PL, 'Und der Hut?'],
        [NPC.dedo, 'Der hat studiert.']
      ],
      alu: [
        [PL, 'Warum Alufolie?'],
        [NPC.dedo, 'Gegen die Gedanken.'],
        [PL, 'Deine oder die von anderen?'],
        [NPC.dedo, '...'],
        [NPC.dedo, 'Gute Frage.']
      ],
      weihnacht: [
        [PL, 'Es ist Juli.'],
        [NPC.dedo, 'Ich weiß.'],
        [PL, 'Und?'],
        [NPC.dedo, 'Im Dezember trägt die jeder. Da fällt man nicht auf.']
      ],
      zauber: [
        [PL, 'Kannst du zaubern?'],
        [NPC.dedo, 'Nein.'],
        [PL, 'Wozu dann der Hut?'],
        [NPC.dedo, 'Damit die Leute fragen, ob ich zaubern kann.']
      ]
    };
    var reihe = texte[hut] || [[NPC.dedo, 'Ein Hut ist ein Hut.']];
    var schritte = [];
    for (var i = 0; i < reihe.length; i++){
      schritte.push({ say:[reihe[i][0], reihe[i][1]] });
      if (i % 2 === 1) schritte.push({ wait:0.5 });
    }
    schritte.push({ dlg:'dedo' });
    play(schritte);
  },
  d_hier: function(){
    setFlag('dedoSchonGetroffen', true);
    var nach = {
      polje:   [[NPC.dedo, 'Nägel.'], [PL, 'Die sind alle krumm.'],
                [NPC.dedo, 'Die sind krumm. Gerade Nägel kann jeder verkaufen.'],
                [PL, 'Ich brauche Eisen. Für ein Rad.'],
                [NPC.dedo, 'Dann nimm einen.'],
                [PL, 'Was kostet er?'],
                [NPC.dedo, 'Frag mich, wenn das Rad hält.']],
      mostar:  [[NPC.dedo, 'Fähnchen.'], [PL, 'Du hast nur drei.'],
                [NPC.dedo, 'Mehr Menschen als Fahnen. Das nenn ich Optimismus.']],
      kaserne: [[NPC.dedo, 'Ich koche.'], [PL, 'Ist das Suppe?'],
                [NPC.dedo, 'Nein. Das ist Wasser mit militärischer Ausbildung.']],
      sarajevo:[[NPC.dedo, 'Ich verkaufe.'], [PL, 'Was?'],
                [NPC.dedo, 'Kommt drauf an, wer fragt.']],
      werk:    [[NPC.dedo, 'Ich putze nicht. Ich verschiebe nur den Dreck.'],
                [PL, 'Funktioniert das?'],
                [NPC.dedo, 'Seit dreißig Jahren. Frag die Politik.']],
      bau:     [[NPC.dedo, 'Ich angle.'], [PL, 'Beißt heute nichts?'],
                [NPC.dedo, 'Doch.'], [NPC.dedo, 'Die Zeit.'],
                [PL, 'Kann man die essen?'],
                [NPC.dedo, 'Nein. Aber sie frisst uns.']],
      terrasse:[[NPC.dedo, 'Ich sitze.'], [PL, 'Und sonst?'],
                [NPC.dedo, 'Sonst reicht das.']]
    };
    var reihe = nach[R.id] || [[NPC.dedo, 'Nichts Besonderes.']];
    /* In Rosko Polje ist dieses Gespraech zugleich der Zugang zum
       Eisen -- Dedo ist hier ausnahmsweise Teil der Loesung. */
    if (R.id === 'polje') setFlag('dedoNagelAngeboten', true);
    var schritte = [];
    for (var i = 0; i < reihe.length; i++){
      schritte.push({ say:[reihe[i][0], reihe[i][1]] });
      schritte.push({ wait:0.5 });
    }
    schritte.push({ dlg:'dedo' });
    play(schritte);
  },
  /* Die zweite Frage, die es nur in diesem Kapitel gibt. In Sarajevo
     und im Werk gibt er dabei einen Hinweis -- einen Hinweis, nicht
     die Lösung. Er nimmt niemandem das Rätsel ab, er stellt sich nur
     kurz daneben. */
  d_ort: function(){
    setFlag('dedoSchonGetroffen', true);
    var nach = {
      polje:   [[NPC.dedo, 'Deinen Vater kenne ich nicht.'],
                [NPC.dedo, 'Ich kenne seine Achse. Die war schon vor dir krumm.'],
                [PL, 'Woher weißt du das?'],
                [NPC.dedo, 'Weil jede Achse hier krumm ist. Man muss nichts wissen, um recht zu haben.']],
      mostar:  [[NPC.dedo, 'Er kommt vorbei.'], [PL, 'Woher weißt du das?'],
                [NPC.dedo, 'Weil sie die Straße gekehrt haben.'],
                [NPC.dedo, 'Gekehrt wird hier nur für Besuch und für Beerdigungen.']],
      kaserne: [[NPC.dedo, 'Länger als der Narednik.'], [PL, 'Und keiner fragt?'],
                [NPC.dedo, 'Doch. Jeden Morgen fragt einer.'],
                [NPC.dedo, 'Und jeden Morgen ist es ein anderer, und er fragt den Falschen.']],
      sarajevo:[[NPC.dedo, 'Bei der Vergabe kenne ich niemanden.'],
                [PL, 'Schade.'],
                [NPC.dedo, 'Ich kenne den, der den Stempel wegschließt, wenn er in die Pause geht.'],
                [PL, 'Und der ist?'],
                [NPC.dedo, 'Derselbe, der sich über den Kaffee hier beschwert. Jeden Tag um halb elf.']],
      werk:    [[NPC.dedo, 'Lesen kann ich das nicht. Ich bin kein Deutscher.'],
                [PL, 'Ich auch nicht.'],
                [NPC.dedo, 'Dann sind wir schon zwei.'], [NPC.dedo, 'Frag den Türken.'],
                [PL, 'Der spricht auch kein Deutsch.'],
                [NPC.dedo, 'Nein. Aber er kann zeichnen.']],
      bau:     [[NPC.dedo, 'So tief, dass es hält.'], [PL, 'Das ist keine Zahl.'],
                [NPC.dedo, 'Nein. Zahlen kommen vom Amt.'],
                [NPC.dedo, 'Und das Amt hat hier noch nie ein Haus gebaut.']]
    };
    var reihe = nach[R.id] || [[NPC.dedo, 'Da fragst du den Falschen.']];
    var schritte = [];
    for (var i = 0; i < reihe.length; i++){
      schritte.push({ say:[reihe[i][0], reihe[i][1]] });
      schritte.push({ wait:0.5 });
    }
    schritte.push({ dlg:'dedo' });
    play(schritte);
  },
  d_alter: function(){
    /* Er antwortet jedes Mal anders, und keine Antwort ist glaubhafter
       als die andere. Der Spieler erfaehrt es nie. */
    var a = ['Dreiundsechzig.', 'Achtundsiebzig.', 'Hundertvier.',
             'Alt genug, um mich über Rückenschmerzen zu beschweren.'];
    play([
      { say:[NPC.dedo, a[Math.floor(Math.random() * a.length)]] },
      { wait:1.2 },
      { say:[PL, 'Letztes Mal war es eine andere Zahl.'] },
      { wait:1.2 },
      { say:[NPC.dedo, 'Letztes Mal war es letztes Mal.'] },
      { wait:1.4 },
      { dlg:'dedo' }
    ]);
  },
  d_kennen: function(){
    play([
      { say:[NPC.dedo, 'Kann sein.'] },
      { wait:1.4 },
      { say:[PL, 'Du warst schon einmal da.'] },
      { wait:1.4 },
      { say:[NPC.dedo, 'Ich bin immer schon einmal da gewesen.'] },
      { wait:1.8 },
      { say:[NARR, 'Ich habe nie herausgefunden, ob es derselbe Mann war. Ich habe auch nie ernsthaft danach gefragt.'] },
      { wait:1.4 },
      { dlg:'dedo' }
    ]);
  },

  mn_und: function(){
    play([
      { say:[NPC.mann, 'Alles gut.'] },
      { wait:1.4 },
      { say:[PL, 'Alles gut.'] },
      { wait:1.4 },
      { say:[NPC.mann, 'Sie sind bei deiner Schwester. Alle sechs.'] },
      { wait:1.6 },
      { say:[PL, 'Und das Haus?'] },
      { wait:1.8 },
      { say:[NPC.mann, 'Das Paket muss morgen zur Post.'] },
      { wait:1.8 },
      { say:[NARR, 'Das war seine Art zu antworten. Ich habe sechsundvierzig Jahre gebraucht, um sie zu lernen, und dann konnte ich sie besser als er.'] }
    ]);
  },
  mn_frieren: function(){
    play([
      { say:[NPC.mann, 'Nein.'] },
      { wait:1.4 },
      { say:[PL, 'Du frierst seit 1974.'] },
      { wait:1.6 },
      { say:[NPC.mann, '...'] },
      { wait:1.4 },
      { say:[NPC.mann, 'Ein bisschen.'] }
    ]);
  },

  /* ---- Kapitel 7 ---- */
  j_steine: function(){
    play([
      { say:[NPC.jure, 'Wer sagt das?'] },
      { wait:1.2 },
      { say:[PL, 'Ich.'] },
      { wait:1.4 },
      { say:[NPC.jure, 'Du warst vierzig Jahre in Deutschland.'] },
      { wait:1.6 },
      { say:[PL, 'Und davor elf Jahre hier.'] },
      { wait:1.8 },
      { say:[NPC.jure, '...'] },
      { wait:1.4 },
      { say:[NPC.jure, 'Na gut. Dann leg sie um.'] },
      { dlg:'jure' }
    ]);
  },
  j_amt: function(){
    play([
      { say:[NPC.jure, 'Kommt drauf an, was fehlt.'] },
      { wait:1.4 },
      { say:[PL, 'Eine Unterschrift.'] },
      { wait:1.2 },
      { say:[NPC.jure, 'Dann fehlt nichts. Dann fehlt nur ein Nachmittag.'] },
      { wait:1.8 },
      { say:[PL, 'Elf Jahre fehlen.'] },
      { wait:1.6 },
      { say:[NPC.jure, 'Weil du nie gefragt hast.'] },
      { wait:2.0 },
      { say:[NARR, 'Er hatte recht. Ich habe elf Jahre lang Formulare eingereicht und kein einziges Mal jemanden gefragt.'] },
      { dlg:'jure' }
    ]);
  },
  j_hilfe: function(){
    setFlag('jureHilft', true);
    play([
      { say:[NPC.jure, '...'] },
      { wait:1.6 },
      { say:[NPC.jure, 'Sag das noch mal.'] },
      { wait:1.4 },
      { say:[PL, 'Ich brauche Hilfe, Jure.'] },
      { wait:1.8 },
      { say:[NPC.jure, 'Vierzehn Jahre. Vierzehn Jahre warte ich auf diesen Satz.'] },
      { wait:2.0 },
      { say:[NPC.jure, 'Morgen um sechs. Bring Wasser mit, ich bring den Neffen.'] },
      { wait:1.8 },
      { say:[NARR, 'In diesem Land ist Hilfe keine Frage von Können. Sie ist eine Frage davon, ob man richtig fragt, und richtig heißt: überhaupt.'] }
    ]);
  },
  j_geblieben: function(){
    play([
      { say:[NPC.jure, 'Wer sollte auf die Ziegen aufpassen.'] },
      { wait:1.6 },
      { say:[PL, 'Du hast keine Ziegen.'] },
      { wait:1.4 },
      { say:[NPC.jure, 'Jetzt nicht mehr.'] },
      { wait:2.0 },
      { say:[NARR, 'Mehr hat er dazu nie gesagt, und ich habe nie wieder gefragt.'] },
      { dlg:'jure' }
    ]);
  },
  g_abend: function(){ gestaltSzene(); }
};

/* Das Faehnchen entsteht erst, wenn Papier, Stecken, Kleister, Rot und
   Blau zusammenkommen. Geprueft an einer Stelle, damit die Reihenfolge
   dem Spieler ueberlassen bleibt. */
function pruefeFaehnchen(){
  if (FLAG.faehnchenFertig) return;
  if (!(INV.has('zeitung') && INV.has('stecken') && INV.has('klebstoff') && FLAG.papierRot && FLAG.tintenstift)) return;
  setFlag('faehnchenFertig', true);
  INV.drop('zeitung'); INV.drop('stecken'); INV.drop('klebstoff');
  INV.add('faehnchen');
  play([
    { fn:function(){ PL.doAct('take', 1.2); } },
    { say:[PL, 'Papier auf den Stecken. Kleister drauf. Rot ist rot, weiß ist weiß.'] },
    { wait:1.2 },
    { say:[PL, 'Und der Stern kommt mit dem Tintenstift.'] },
    { wait:1.4 },
    { say:[PL, 'Er ist blau statt gelb. Aber er ist ein Stern.'] },
    { wait:1.6 },
    { say:[NARR, 'Von hinten konnte man lesen: Sarajevo — Vardar 1:3.'] }
  ]);
}
