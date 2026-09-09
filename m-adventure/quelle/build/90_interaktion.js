
/* ============================================================
   Sektion 25  INTERAKTION
   ============================================================ */
var VERBS = [
  { id:'ansehen',  label:'Ansehen'  }, { id:'nehmen',   label:'Nehmen'   },
  { id:'benutzen', label:'Benutzen' }, { id:'reden',    label:'Reden mit'},
  { id:'geben',    label:'Geben'    }, { id:'gehen',    label:'Gehen zu' }
];
var DEFVERB = {
  haustuer:'benutzen', garage:'benutzen', tor_raus:'benutzen', plane:'benutzen',
  kiste_g:'nehmen', kiste_t:'benutzen', radio:'benutzen', bank:'benutzen',
  fenstersims:'nehmen', weg:'benutzen', zurueck:'benutzen', muehle:'benutzen',
  rad:'benutzen', holzstapel:'nehmen', brunnen:'nehmen', rinne:'nehmen',
  kleister:'nehmen', tribuene:'benutzen', kammer:'benutzen', material:'nehmen',
  bordstein:'benutzen', fahne_k:'benutzen', steg:'benutzen', schalter:'reden',
  kiosk:'reden', fica:'benutzen', maschine:'benutzen', kantine:'benutzen',
  spind:'benutzen', tafel:'ansehen', zelle:'benutzen', apparat:'benutzen',
  paket:'benutzen', post:'benutzen', laden:'benutzen', heim:'benutzen',
  mischer:'benutzen', steine_b:'nehmen', amtstisch:'benutzen', grenze:'benutzen',
  zollstock_b:'nehmen', rohbau:'benutzen', gestalt_b:'reden', katze:'ansehen',
  schaufenster:'benutzen', stand:'reden', ball:'benutzen', feige:'ansehen'
};

/* Sich selbst ansehen. Der Text richtet sich nach dem Lebensalter --
   und in der Gegenwart nach dem, was gerade an den Haenden dran ist. */
function selbstAnsehen(){
  var id = PL.identityKey || 'mAlt';
  if (id === 'mAlt' && R.id === 'terrasse'){
    if (istAusloeser('selbst')){ triggerKapitel(5); return; }
    say(PL, ['Sechsundsiebzig. Hemd offen, Sandalen, und seit acht Jahren keine Uhr mehr.',
             'Die Hände sind das Einzige, das noch aussieht wie Arbeit.']);
    return;
  }
  var texte = {
    mKind:['Elf. Barfuß, weil im August niemand Schuhe trägt, der nicht muss.',
           'Die Hose war vom Nachbarsjungen und wird nach mir noch zwei überleben.'],
    mSchueler:['Dreizehn. Erste eigene Schuhe, gekauft eine Nummer zu groß.',
               'Sie sind immer noch eine Nummer zu groß.'],
    mMarine:['Weiß, blau, eine Mütze. Ich sehe darin aus wie jemand, den man auf ein Plakat malt.',
             'Ich bin einundzwanzig und weiß nicht, wo Vis liegt.'],
    mSarajevo:['Hemd, Weste, drei Tage Bart. Zwei Kinder, ein drittes unterwegs, zwei Zimmer beantragt.'],
    mWerk:['Ein Overall mit einer Nummer, die nicht meine ist. Er riecht nach dem, der ihn vorher hatte.'],
    mMann:['Ein Mantel aus dem Kaufhaus, gekauft, weil hier andere Winter sind.',
           'Neunundvierzig. Und zum ersten Mal in meinem Leben habe ich Geld in der Tasche und kann nichts damit machen.'],
    lena:['Ich habe die Schürze angelassen. Ich bin nur schnell runter.',
          'Man geht so nicht auf die Straße. Ich gehe trotzdem.']
  };
  say(PL, texte[id] || 'Ich.');
}

function hitObject(rx, ry){
  if (G.verb === 'ansehen' && PL.visible){
    var scp = scaleAt(PL.y);
    if (rx > PL.x-26*scp && rx < PL.x+26*scp && ry > PL.y-FIGH*scp && ry < PL.y+6){
      return { id:'selbst', name:'Mich selbst', actor:PL, selbst:true,
               go:{ x:PL.x, y:PL.y }, ansehen:function(){ selbstAnsehen(); } };
    }
  }
  for (var ai = ACTORS.length-1; ai >= 0; ai--){
    var a = ACTORS[ai];
    if (a === PL || !a.visible) continue;
    var sca = scaleAt(a.y);
    if (rx > a.x-30*sca && rx < a.x+30*sca && ry > a.y-FIGH*sca - (a.hoehe||0) && ry < a.y+6){
      var side = (PL.x < a.x) ? -1 : 1;
      return { id:a.id, name:a.name, actor:a, go:{ x:a.x + side*72, y:a.y+6 } };
    }
  }
  for (var i = OBJ.length-1; i >= 0; i--){
    var o = OBJ[i];
    if (o.when && !o.when()) continue;
    var h = o.hs;
    if (rx >= h[0] && rx <= h[0]+h[2] && ry >= h[1] && ry <= h[1]+h[3]) return o;
  }
  return null;
}

function interactNPC(npc, verb){
  var def = npc.npcDef || {};
  npc.stop();
  var side = (PL.x < npc.x) ? -1 : 1;
  PL.walkTo(R.area, R.nodes, npc.x + side*72, npc.y + 6, (npc.x >= PL.x ? 1 : -1), function(){
    npc.dir = (PL.x < npc.x ? -1 : 1);
    G.dlgPartner = npc.id;
    if (verb === 'geben' && G.selItem){
      gebeItem(G.selItem, npc); G.selItem = null; return;
    }
    if (verb === 'ansehen'){ say(PL, def.look || ('Das ist ' + npc.name + '.')); return; }
    if (verb === 'nehmen'){ say(PL, 'Menschen nehme ich mir nicht.'); return; }
    openDlg(def.dialog || 'luka', npc);
  });
}
function gebeItem(item, npc){
  if (item === 'kaffee' && npc === NPC.lena){ say(PL, 'Sie trinkt keinen. Sie hat nie welchen getrunken.'); return; }
  if (item === 'faehnchen' && npc === NPC.lehrer){
    say(NPC.lehrer, 'Sehen Sie. Geht doch.');
    return;
  }
  if (item === 'skizze' && npc === NPC.krause){
    say(NPC.krause, 'Was ist das denn? Ach so. Ja. Genau das meine ich.');
    return;
  }
  if (item === 'foto' && npc === NPC.luka){ oeffneKiste(); return; }
  say(npc, 'Danke. Aber das brauche ich nicht.');
}

function interact(o, verb){
  if (!o) return;
  if (o.actor && o.actor !== PL){ interactNPC(o.actor, verb); return; }
  if (verb === 'gehen'){ PL.walkTo(R.area, R.nodes, o.go ? o.go.x : PL.x, o.go ? o.go.y : PL.y, 0); return; }
  var target = o.go || { x:PL.x, y:PL.y };
  PL.walkTo(R.area, R.nodes, target.x, target.y, 0, function(){
    var run = function(){
      if (G.selItem){ var it = G.selItem; G.selItem = null; useItemOn(it, o); return; }
      var r = o[verb];
      if (typeof r === 'function') r.call(o);
      else if (typeof r === 'string') say(PL, r);
      else say(PL, fallback(verb, o.name));
    };
    if (G.selItem) PL.doAct('reach', 0.75, run);
    else if (verb === 'nehmen') PL.doAct('take', 0.95, run);
    else if (verb === 'benutzen') PL.doAct('reach', 0.7, run);
    else run();
  });
}
function fallback(verb, name){
  switch (verb){
    case 'nehmen':   return 'Das kann ich nicht mitnehmen.';
    case 'benutzen': return 'Damit komme ich nicht weiter.';
    case 'reden':    return 'Es antwortet nicht.';
    case 'geben':    return 'Dazu müsste ich erst etwas in der Hand haben.';
    default:         return 'Nichts Besonderes.';
  }
}
