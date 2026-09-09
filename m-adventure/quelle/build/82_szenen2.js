
/* ============================================================
   Sektion 22  DER SCHALTER (Kapitel 4)
   ------------------------------------------------------------
   Man kauft nichts, man organisiert: der Antrag ist das Leichte,
   der Stempel ist das Schwere, und der Weg dorthin fuehrt ueber
   einen kaputten Fica.
   ============================================================ */
function redeSchalter(){
  if (FLAG.antragGestempelt){
    if (!INV.has('wohnungsschluessel')){
      INV.add('wohnungsschluessel');
      play([
        { say:[NARR, 'Zwei Zimmer, dritter Stock, Grbavica. Bezugsfertig in vier Monaten.'] },
        { wait:1.6 },
        { say:[PL, 'Vier Monate.'] },
        { wait:1.2 },
        { say:[NARR, 'Es wurden neun. Aber ich hatte den Schlüssel schon in der Hand, und das ist ein Unterschied.'] },
        { wait:1.8 },
        { say:[PL, 'Ich muss es L. sagen.'] }
      ]);
      return;
    }
    say(PL, 'Hier bin ich fertig. Jetzt zu L.');
    return;
  }
  if (!INV.has('antrag')){
    INV.add('antrag');
    play([
      { say:[NARR, 'Der Mann hinter dem Schalter hat nicht aufgesehen.'] },
      { wait:1.2 },
      { say:[PL, 'Guten Tag. Ich wollte —'] },
      { wait:0.9 },
      { say:[NARR, 'Formular. Ausfüllen. Nächster.'] },
      { wait:1.4 },
      { say:[PL, 'Ich habe es beim letzten Mal ausgefüllt.'] },
      { wait:1.2 },
      { say:[NARR, 'Dann ist es abgelaufen. Formular. Ausfüllen. Nächster.'] },
      { wait:1.8 },
      { say:[NARR, 'Ich habe es ausgefüllt. Es hat zwanzig Minuten gedauert, und die vierte Seite fragte nach dem, was auf der ersten stand.'] }
    ]);
    return;
  }
  if (!FLAG.nameBekannt){
    play([
      { say:[PL, 'Der Antrag ist ausgefüllt.'] },
      { wait:1.2 },
      { say:[NARR, 'Stempel fehlt. Zimmer vierzehn.'] },
      { wait:1.2 },
      { say:[PL, 'Zimmer vierzehn hat zu.'] },
      { wait:1.2 },
      { say:[NARR, 'Donnerstags.'] },
      { wait:1.2 },
      { say:[PL, 'Heute ist Donnerstag.'] },
      { wait:1.6 },
      { say:[NARR, 'Er hat genickt. Zustimmend. Das Gespräch war für ihn damit beendet und logisch abgeschlossen.'] },
      { wait:2.0 },
      { say:[PL, 'Ich brauche einen Namen. Irgendwo in diesem Haus sitzt einer, der einen Namen hat.'] }
    ]);
    return;
  }
  if (!INV.has('kaffee')){
    play([
      { say:[PL, 'Ich möchte zu Dževad.'] },
      { wait:1.4 },
      { say:[NARR, 'Er hat zum ersten Mal aufgesehen.'] },
      { wait:1.4 },
      { say:[NARR, 'Dževad bin ich.'] },
      { wait:1.6 },
      { say:[PL, '...'] },
      { wait:1.4 },
      { say:[NARR, 'Und? Was wollen Sie?'] },
      { wait:1.6 },
      { say:[PL, 'Nichts. Noch nichts.'] },
      { wait:1.8 },
      { say:[NARR, 'Man geht nicht mit leeren Händen zu jemandem, dessen Namen man gerade erst erfahren hat. Nicht weil er etwas erwartet. Weil man sonst wie ein Bittsteller aussieht, und Bittsteller bearbeitet man zuletzt.'] }
    ]);
    return;
  }
  setFlag('antragGestempelt', true);
  INV.drop('kaffee'); INV.drop('antrag'); INV.add('stempel');
  play([
    { fn:function(){ PL.doAct('reach', 0.9); } },
    { say:[PL, 'Der Antrag. Und der Kaffee ist mir übrig geblieben, ich trinke keinen.'] },
    { wait:1.8 },
    { say:[NARR, 'Ich trinke sechs Tassen am Tag. Er wusste das nicht und es war ihm auch egal.'] },
    { wait:1.8 },
    { say:[NARR, 'Er hat den Kaffee weggeräumt, ohne ihn anzusehen, und den Antrag genommen.'] },
    { wait:1.6 },
    { fn:function(){ uiSound('confirm'); } },
    { say:[NARR, 'Ein Stempel. Zwei Sekunden.'] },
    { wait:1.4 },
    { say:[NARR, 'Elf Monate hatte es gedauert, bis diese zwei Sekunden möglich waren.'] },
    { wait:1.8 },
    { say:[NARR, 'Kommen Sie Montag wegen der Zuweisung.'] },
    { wait:1.4 },
    { say:[PL, 'Ich komme Montag.'] }
  ]);
}

/* ============================================================
   Sektion 23  DAS TELEFON (Kapitel 6)
   ------------------------------------------------------------
   Vier Muenzen, drei Nummern und eine Vorwahl, die sich geaendert
   hat. Kein Scheitern: wer alle Muenzen verbraucht, bekommt bei
   Frau Sommer gewechselt -- es kostet nur Zeit, und Zeit hat er.
   ============================================================ */
DLGNODES.telefon_nummer = function(){
  return dialogOptions([
    { t:'Rosko Polje. Der Nachbar hat ein Telefon.', go:'t_polje' },
    { t:'Split. Die Nummer, die ich seit zehn Jahren habe.', go:'t_altSplit',
      when:function(){ return !FLAG.altSplitVersucht; } },
    { t:'Split. Mit der neuen Vorwahl.', go:'t_neuSplit', unlock:'VORWAHL',
      when:function(){ return !!FLAG.vorwahlBekannt; } },
    { t:'(Hörer auflegen.)', go:null, repeatable:true }
  ]);
};
function muenzeWeg(){
  FLAG.muenzenWeg = (FLAG.muenzenWeg || 0) + 1;
  G.autosaveT = 0.4;
}
function telefonieren(){
  if (FLAG.anrufGeschafft){ say(PL, 'Ich habe durchgekommen. Ein zweites Mal wäre Verschwendung.'); return; }
  if ((FLAG.muenzenWeg || 0) >= 4){
    play([
      { say:[PL, 'Kein Geld mehr im Schlitz.'] },
      { wait:1.4 },
      { say:[NPC.sommer, 'Warten Sie. Ich wechsle Ihnen einen Schein.'] },
      { wait:1.6 },
      { fn:function(){ FLAG.muenzenWeg = 0; INV.add('muenzen'); } },
      { say:[NARR, 'Sie hat den Schalter verlassen, um mir vier Markstücke zu geben. Das durfte sie nicht.'] },
      { wait:1.8 }
    ]);
    return;
  }
  if (!INV.has('muenzen')) INV.add('muenzen');
  play([
    { say:[PL, 'Münze rein. Wählscheibe.'] },
    { wait:0.9 },
    { dlg:'telefon_nummer' }
  ]);
}
DLG_RESP.t_polje = function(){
  muenzeWeg();
  play([
    { fn:function(){ uiSound('nav'); } },
    { say:[NARR, 'Kein Freizeichen. Nicht besetzt. Nichts.'] },
    { wait:1.6 },
    { say:[PL, 'Nach Bosnien geht gar nichts mehr.'] },
    { wait:1.6 },
    { say:[NARR, 'Die Münze kam nicht zurück. Sie kam nie zurück, auch wenn niemand abhob.'] },
    { wait:1.8 },
    { fn:function(){ setFlag('poljeVersucht', true); } }
  ]);
};
DLG_RESP.t_altSplit = function(){
  muenzeWeg(); setFlag('altSplitVersucht', true);
  play([
    { fn:function(){ uiSound('nav'); } },
    { say:[NARR, 'Kein Anschluss unter dieser Nummer.'] },
    { wait:1.6 },
    { say:[PL, 'Die Nummer habe ich seit zehn Jahren.'] },
    { wait:1.6 },
    { say:[NARR, 'Die Nummer stimmte. Das Land davor nicht mehr.'] },
    { wait:2.0 },
    { say:[PL, 'Vielleicht weiß die Frau von der Post etwas.'] }
  ]);
};
DLG_RESP.t_neuSplit = function(){
  muenzeWeg(); setFlag('anrufGeschafft', true);
  play([
    { fn:function(){ uiSound('confirm'); } },
    { say:[NARR, 'Es tutet. Zweimal. Dann nimmt jemand ab.'] },
    { wait:1.8 },
    { say:[PL, 'Ich bin es.'] },
    { wait:1.6 },
    { say:[NARR, 'Sie leben. Alle sechs. Sie sind bei der Schwester in Makarska.'] },
    { wait:2.0 },
    { say:[PL, 'Und das Haus?'] },
    { wait:1.8 },
    { say:[NARR, '...'] },
    { wait:1.6 },
    { say:[PL, 'Gut. Hauptsache, ihr seid alle da.'] },
    { wait:1.8 },
    { fn:function(){ uiSound('tick'); } },
    { say:[NARR, 'Das Tuten, das bedeutet, dass die Münze gleich alle ist.'] },
    { wait:1.4 },
    { say:[PL, 'Ich schicke ein Paket. Nächste Woche. Hörst du —'] },
    { wait:1.6 },
    { fn:function(){ uiSound('nav'); } },
    { say:[NARR, 'Sechzig Sekunden. Für sechzig Sekunden habe ich vier Wochen gebraucht.'] },
    { wait:2.0 }
  ]);
};

/* ============================================================
   Sektion 24  GEGENSTAENDE AUFEINANDER ANWENDEN
   ============================================================ */
function useItemOn(item, o){
  /* Kapitel 1: Achse fetten */
  if (item === 'speck' && (o.id === 'achse' || o.id === 'rad' || o.id === 'karren')){
    if (FLAG.achseGefettet){ say(PL, 'Die ist gefettet.'); return; }
    setFlag('achseGefettet', true); INV.drop('speck');
    play([
      { fn:function(){ PL.doAct('take', 1.0); } },
      { say:[PL, 'Ich reibe die Schwarte über die Achse, bis sie glänzt.'] },
      { wait:1.2 },
      { say:[PL, 'Fertig. Jetzt geht das Rad drauf.'] },
      { wait:1.0 },
      { say:[NARR, 'Die Schwarte habe ich zurückgebracht. Sie lag drei Tage später noch im Speiseplan.'] }
    ]);
    return;
  }
  if ((item === 'holzkeil' || item === 'radnagel') && (o.id === 'rad' || o.id === 'achse' || o.id === 'karren')){
    var radObj = null;
    for (var i = 0; i < OBJ.length; i++) if (OBJ[i].id === 'rad') radObj = OBJ[i];
    if (radObj) radObj.benutzen();
    return;
  }
  /* Kapitel 2: Fähnchen bauen */
  if (R.id === 'mostar'){
    if (item === 'zeitung' && o.id === 'plakat'){ o.benutzen(); return; }
    if ((item === 'zeitung' || item === 'stecken' || item === 'klebstoff') &&
        (o.id === 'stand' || o.id === 'rinne' || o.id === 'kleister')){
      say(PL, 'Ich habe alles zusammen. Es fehlt nur noch etwas Blaues.');
      return;
    }
  }
  /* Kapitel 3: streichen */
  if ((item === 'farbe' || item === 'pinsel') && o.id === 'bordstein'){ o.benutzen(); return; }
  if (item === 'fahne' && o.id === 'fahne_k'){ o.benutzen(); return; }
  if (item === 'kammerschluessel' && o.id === 'kammer'){ o.benutzen(); return; }
  /* Kapitel 4 */
  if (item === 'ersatzteil' && o.id === 'fica'){ o.benutzen(); return; }
  if (item === 'kaffee' && (o.id === 'schalter' || o.id === 'amt')){ redeSchalter(); return; }
  if (item === 'antrag' && (o.id === 'schalter' || o.id === 'amt')){ redeSchalter(); return; }
  /* Kapitel 5 */
  if (item === 'schluessel13' && o.id === 'maschine'){ o.benutzen(); return; }
  if (item === 'auftragszettel' && o.id === 'yilmaz_w'){ interactNPC(NPC.yilmaz, 'reden'); return; }
  /* Kapitel 6 */
  if ((item === 'schokolade' || item === 'medikamente') && o.id === 'paket'){ o.benutzen(); return; }
  if (item === 'zollformular' && o.id === 'paket'){ o.benutzen(); return; }
  if (item === 'zollformular' && o.id === 'post'){ say(PL, 'Ausgefüllt wird es hier draußen. Drinnen ist zu viel Publikum.'); return; }
  /* Kapitel 7 */
  if (item === 'zollstock' && (o.id === 'grenze' || o.id === 'rohbau')){
    var gr = null;
    for (var g = 0; g < OBJ.length; g++) if (OBJ[g].id === 'grenze') gr = OBJ[g];
    if (gr) gr.benutzen(); else say(PL, 'Hier gibt es nichts zu messen.');
    return;
  }
  /* Rahmen */
  if (item === 'taschenlampe' && (o.id === 'plane' || o.id === 'kiste_g')){ o.benutzen(); return; }
  if (item === 'foto' && o.id === 'luka'){ oeffneKiste(); return; }

  say(PL, 'Das passt nicht zusammen.');
}
function useItemOnItem(a, b){
  if (R.id === 'mostar'){
    var teile = ['zeitung','stecken','klebstoff'];
    if (teile.indexOf(a) >= 0 && teile.indexOf(b) >= 0){
      if (FLAG.faehnchenFertig){ say(PL, 'Es ist fertig.'); return; }
      if (!FLAG.papierRot){ say(PL, 'Erst muss das Papier Farbe bekommen. Grau winkt niemand.'); return; }
      if (!FLAG.tintenstift){ say(PL, 'Rot und weiß habe ich. Blau fehlt, und der Stern auch.'); return; }
      pruefeFaehnchen();
      return;
    }
  }
  if ((a === 'farbe' && b === 'pinsel') || (a === 'pinsel' && b === 'farbe')){
    say(PL, 'Beides zusammen ergibt einen weißen Bordstein. Aber nicht hier in der Luft.');
    return;
  }
  say(PL, 'Nein.');
}
