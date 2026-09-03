
/* ============================================================
   KAPITEL 1a · DIE WEIDE
   ------------------------------------------------------------
   Der Auftakt. Spielbares Ziel: die Herde stimmt nicht. Der Vater
   zaehlt zwoelf, M. zaehlt elf. Die Loesung ist keine Suche,
   sondern eine Beobachtung -- man muss den Schatten ansehen und
   nicht die Tiere. Damit ist die Lehre des Kapitels gesetzt,
   bevor das erste Werkzeug in die Hand kommt.
   ============================================================ */
var OBJ_WEIDE = [
  { id:'herde', name:'Die Ziegen', hs:[320,392,600,80], go:{x:700,y:456},
    ansehen:function(){
      if (FLAG.ziegeGefunden){ say(PL, 'Zwölf. Jetzt stimmt es.'); return; }
      setFlag('gezaehlt', true);
      play([
        { fn:function(){ PL.doAct('reach', 0.9); } },
        { say:[PL, 'Eins, zwei, drei... neun, zehn, elf.'] },
        { wait:0.9 },
        { say:[PL, 'Elf.'] },
        { wait:1.0 },
        { say:[NPC.otac, 'Zwölf.'] },
        { wait:1.2 },
        { say:[PL, 'Elf, Vater.'] },
        { wait:1.4 },
        { say:[NPC.otac, 'Zwölf.'] },
        { wait:1.6 },
        { say:[NARR, 'Er hat nicht hingesehen. Er hat den ganzen Morgen nicht hingesehen.'] }
      ]);
    },
    nehmen:'Man nimmt keine Ziege. Eine Ziege kommt mit oder sie kommt nicht.' },

  { id:'fels', name:'Der große Fels', hs:[990,326,130,132], go:{x:1040,y:450},
    ansehen:function(){
      schauen('fels',
        'Ein Kalkblock, so hoch wie das Haus. Am Morgen wirft er einen Schatten bis zum Wacholder.',
        'So hoch wie das Haus war er nicht. Er ging mir bis zur Schulter, als ich zwanzig war.');
    },
    benutzen:'Draufklettern kann man. Es sieht von oben genauso aus.' },

  { id:'schatten', name:'Der Schatten des Felsens', hs:[890,428,180,42], go:{x:960,y:456},
    ansehen:function(){
      if (FLAG.ziegeGefunden){ say(PL, 'Leerer Schatten. Sie steht jetzt bei den anderen.'); return; }
      if (!FLAG.gezaehlt){
        say(PL, ['Der Schatten vom Felsen. Um diese Zeit ist er lang.']);
        return;
      }
      setFlag('ziegeGefunden', true);
      play([
        { say:[PL, 'Im Schatten ist es dunkler als die Ziegen hell sind.'] },
        { wait:1.2 },
        { say:[PL, 'Da steht eine.'] },
        { wait:1.4 },
        { say:[PL, 'Zwölf.'] },
        { wait:1.6 },
        { say:[NPC.otac, 'Ich weiß.'] },
        { wait:1.4 },
        { say:[PL, 'Warum hast du nichts gesagt?'] },
        { wait:1.6 },
        { say:[NPC.otac, 'Weil du dann elf gezählt hättest und mir geglaubt.'] },
        { wait:1.8 },
        { say:[NARR, 'Das ist die einzige Lektion, die er mir je mit Absicht beigebracht hat, und ich habe sechzig Jahre davon gelebt.'] },
        { fn:function(){ setFlag('lektion', true); } }
      ]);
    } },

  { id:'wacholderbusch', name:'Wacholder', hs:[336,384,90,74], go:{x:380,y:450},
    ansehen:function(){
      schauen('wacholderbusch',
        'Wacholder. Er wächst hier überall und nirgendwo sonst so.',
        'Er wächst überall. Ich habe das erst in Deutschland gemerkt, als es ihn nicht gab.');
    },
    nehmen:function(){
      if (INV.has('wacholder') || FLAG.wacholderAb){ say(PL, 'Einer reicht.'); return; }
      setFlag('wacholderAb', true); INV.add('wacholder');
      play([
        { fn:function(){ PL.doAct('take', 0.9); } },
        { say:[PL, 'Zwischen den Fingern zerrieben hält sich der Geruch zwei Tage.'] },
        { wait:1.2 },
        { say:[NARR, 'Länger. Viel länger.'] }
      ]);
    } },

  { id:'kante', name:'Die Kante', hs:[0,384,300,86], go:{x:240,y:454},
    ansehen:function(){
      schauen('kante',
        'Von hier sieht man das ganze Tal. Die Straße unten ist ein heller Strich.',
        'Man sieht nicht das ganze Tal. Man sieht bis zur Biegung, und dahinter fängt an, was ich nicht kannte.');
    } },

  { id:'vater_w', name:'Vater', hs:[505,272,92,150], go:{x:490,y:454},
    ansehen:'Er sitzt auf dem Stein und kaut auf einem Grashalm. So sitzt er, seit ich denken kann.' },

  { id:'pfad', name:'Der Pfad hinunter', hs:[1150,370,150,100], go:{x:1200,y:454},
    ansehen:'Zwanzig Minuten hinunter, vierzig herauf. So ist das hier.',
    benutzen:function(){
      if (!FLAG.ziegeGefunden){
        say(PL, ['Nicht, solange die Herde nicht stimmt.', 'Wenn eine fehlt und ich gehe, ist es meine Schuld.']);
        return;
      }
      if (!FLAG.vaterAuftrag){
        say(PL, 'Erst soll der Vater sagen, was zu tun ist.');
        return;
      }
      changeRoom('polje', ROOM_POLJE.entry);
    } },

  { id:'rogaW', name:'Am Waldrand', hs:[10,300,80,120], go:null,
    when:function(){ return !FLAG.rogaGesehen0; },
    ansehen:function(){
      setFlag('rogaGesehen0', true);
      play([
        { say:[PL, 'Am Waldrand steht etwas.'] },
        { wait:1.3 },
        { say:[NPC.otac, 'Was.'] },
        { wait:1.1 },
        { say:[PL, 'Nichts.'] },
        { wait:1.6 }
      ]);
    } }
];
ROOM_WEIDE.objects = OBJ_WEIDE;
ROOM_WEIDE.hinweis = function(){
  if (!FLAG.gezaehlt) return { x:700, y:420 };
  if (!FLAG.ziegeGefunden) return { x:960, y:432 };
  if (!FLAG.vaterAuftrag) return { x:550, y:390 };
  return { x:1200, y:420 };
};
ROOM_WEIDE.onEnter = function(von, ausLadung){
  if (ausLadung || FLAG.weideBegonnen) return;
  setFlag('weideBegonnen', true);
  play([
    { wait:1.0 },
    { say:[NARR, 'Im Sommer war ich oben, bevor es hell wurde, und unten, wenn es dunkel wurde.'] },
    { wait:0.8 },
    { say:[NARR, 'Dazwischen passierte nichts, und das war das Beste am ganzen Jahr.'] },
    { wait:1.0 },
    { say:[NPC.otac, 'Zähl sie.'] }
  ]);
};

/* ============================================================
   KAPITEL 1b · DAS HAUS
   ============================================================ */
var OBJ_KUCA = [
  { id:'tuer_k', name:'Tür', hs:[52,145,158,285], go:{x:150,y:448},
    ansehen:'Nach draußen. Von drinnen ist sie das hellste Ding im Raum.',
    benutzen:function(){ changeRoom('polje', {x:330,y:446,dir:1}); } },

  { id:'herd', name:'Der Herd', hs:[500,170,245,270], go:{x:640,y:452},
    ansehen:function(){
      schauen('herd',
        'Eine offene Feuerstelle mit einem Rauchfang darüber. Der Kessel hängt am Haken, seit ich denken kann.',
        'Der Kessel hing nicht immer. Er kam 1949, und davor gab es einen aus Ton.');
    },
    benutzen:'Da hat nur die Mutter etwas zu suchen. Das ist keine Regel, das ist Erfahrung.' },

  { id:'speck', name:'Die Speckschwarte', hs:[548,220,74,70], go:{x:600,y:452},
    when:function(){ return !FLAG.speckWeg; },
    ansehen:'Am Haken neben dem Rauchfang. Sie ist hart und salzig und viel zu schade zum Wegwerfen.',
    nehmen:function(){
      if (INV.has('speck')){ say(PL, 'Ich habe sie.'); return; }
      if (!FLAG.speckErlaubt){
        say(PL, ['Die Schwarte gehört der Mutter.', 'Ohne zu fragen fasse ich sie nicht an.']);
        return;
      }
      setFlag('speckWeg', true); INV.add('speck');
      play([
        { fn:function(){ PL.doAct('take', 0.9); } },
        { say:[PL, 'Und zurückbringen, hat sie gesagt.'] },
        { wait:1.0 },
        { say:[NARR, 'Speck war bei uns Werkzeug, Medizin und Festessen, in dieser Reihenfolge.'] }
      ]);
    } },

  { id:'mehlsack', name:'Der Mehlsack', hs:[366,310,112,132], go:{x:410,y:454},
    ansehen:function(){
      if (FLAG.mehlGebracht){ say(PL, 'Voll. Fünfzehn Kilo. Das reicht bis Michaeli.'); return; }
      schauen('mehlsack',
        'Er liegt flach. Ganz unten ist noch eine Handbreit, und die ist für morgen.',
        'Es war keine Handbreit. Es war nichts drin, und die Mutter hat es niemandem gesagt.');
      setFlag('sackGesehen', true);
    },
    benutzen:function(){
      if (INV.has('mehl')){
        var m = null;
        for (var i = 0; i < OBJ.length; i++) if (OBJ[i].id === 'mutter_k') m = OBJ[i];
        if (m) m.reden.call(m);
        return;
      }
      say(PL, 'Leer bleibt leer, wenn man ihn schüttelt.');
    } },

  { id:'tisch_k', name:'Der Tisch', hs:[730,328,220,126], go:{x:830,y:454},
    ansehen:function(){
      schauen('tisch_k',
        'Zwei Schüsseln stehen schon da. Wir sind fünf.',
        'Wir waren sieben, bis zum Winter davor. Die Schüsseln haben nie gefehlt.');
    } },

  { id:'lampe_k', name:'Petroleumlampe', hs:[776,278,62,86], go:{x:800,y:452},
    ansehen:function(){
      schauen('lampe_k',
        'Sie wird angezündet, wenn es wirklich nötig ist. Petroleum kostet Geld.',
        'Sie wurde nie angezündet. Wir sind schlafen gegangen, wenn es dunkel wurde.');
    },
    nehmen:'Die bleibt auf dem Tisch.' },

  { id:'wecker_k', name:'Alter Wecker', hs:[836,298,62,60], go:{x:860,y:452},
    ansehen:function(){
      if (INV.has('wecker') || INV.has('kupferdraht') || FLAG.radioRepariert){
        PL.say(['Der Platz auf dem Tisch ist wieder frei.']); return;
      }
      schauen('wecker_k',
        'Ein Blechwecker. Er steht seit zwei Jahren auf derselben Minute.',
        'Halb vier. Ich habe jahrelang gedacht, das sei die Uhrzeit gewesen, als er stehen blieb. Es war einfach die Minute, in der ihn keiner mehr aufgezogen hat.');
    },
    nehmen:function(){
      if (INV.has('wecker') || INV.has('kupferdraht') || FLAG.radioRepariert){
        PL.say(['Habe ich schon.']); return true;
      }
      INV.add('wecker');
      play([
        { fn:function(){ PL.doAct('take', 0.9); } },
        { say:[PL, 'Er geht sowieso nicht mehr.'] }
      ]);
      return true;
    } },

  { id:'bett_k', name:'Das Bett', hs:[958,296,276,164], go:{x:1080,y:452},
    ansehen:function(){
      schauen('bett_k',
        'Ein Gestell, Stroh, drei Decken. Wir schlafen quer, dann passen alle.',
        'Es passten nicht alle. Ich habe bis vierzehn auf der Bank am Herd geschlafen und es für einen Vorzug gehalten.');
    } },

  { id:'bild_k', name:'Das Bild', hs:[866,132,102,122], go:{x:910,y:440},
    ansehen:function(){
      schauen('bild_k',
        'Ein Bild an der Wand. Vom Rauch ist nicht mehr zu erkennen, wer darauf ist.',
        'Es war eine Hochzeit. Meine Eltern. Ich habe es erst gewusst, als ich es 1991 aus dem Rahmen genommen habe.');
    },
    nehmen:'Das hängt da, seit es das Haus gibt.' },

  { id:'mutter_k', name:'Mutter', hs:[486,276,108,182], go:{x:486,y:448},
    ansehen:'Sie steht nie still. Wenn sie still steht, ist etwas passiert.',
    reden:function(){
      if (INV.has('mehl')){
        setFlag('mehlGebracht', true); INV.drop('mehl');
        play([
          { fn:function(){ PL.doAct('take', 1.1); } },
          { say:[PL, 'Fünfzehn Kilo.'] },
          { wait:1.2 },
          { say:[NPC.majka, 'Stell ihn dorthin.'] },
          { wait:1.4 },
          { say:[PL, 'Der Karren steht wieder gerade.'] },
          { wait:1.4 },
          { say:[NPC.majka, 'Ich weiß.'] },
          { wait:1.6 },
          { say:[NPC.majka, 'Wasch dir die Hände, es gibt gleich etwas.'] },
          { wait:1.8 },
          { say:[NARR, 'Das war alles. Und es war genug.'] },
          { wait:1.4 },
          { fn:function(){ beendeKapitel(1); } }
        ]);
        return;
      }
      openDlg('majka', NPC.majka);
    } }
];
ROOM_KUCA.objects = OBJ_KUCA;
ROOM_KUCA.hinweis = function(){
  if (INV.has('mehl')) return { x:540, y:372 };
  if (!FLAG.speckErlaubt) return { x:540, y:372 };
  if (!INV.has('speck') && !FLAG.speckWeg) return { x:585, y:250 };
  return { x:150, y:400 };
};
