
/* ============================================================
   Sektion 04c  BILDQUELLEN
   ------------------------------------------------------------
   Bis hierher zeichnet jeder Raum sich selbst als Programm. Das
   hat einen Vorteil, den man nicht unterschaetzen sollte -- die
   ganze Welt passt in eine Datei, jeder Raum ist in Sekunden
   geaendert, und ein Stilwechsel greift ueberall gleichzeitig.
   Es hat aber eine harte Obergrenze: ein Programm setzt keine
   Falte in ein Hemd und keinen Schatten unter eine Bodenplatte.

   Diese Sektion oeffnet den zweiten Weg. Ein Raum darf statt
   seiner Zeichenfunktion ein fertiges Bild mitbringen. Alles
   andere bleibt, wie es ist: Wegfindung, Hotspots, Verdeckung,
   Figuren, Dialoge. Beide Arten von Raeumen koennen im selben
   Spiel nebeneinander stehen, und ein Raum ohne Bild zeichnet
   sich weiter selbst -- man kann also Raum fuer Raum umstellen,
   ohne dass das Spiel dazwischen kaputt ist.

   Bilder gehoeren in Weltaufloesung geliefert (Raumbreite/2 mal
   235), dann haben gemalte und gerechnete Raeume dieselbe
   Koernung. Groessere Bilder werden hart heruntergerechnet.
   ============================================================ */
var BILDER = {};
function bildQuelle(quelle){
  if (!quelle) return null;
  if (typeof EINGEBETTETE_BILDER !== 'undefined' && EINGEBETTETE_BILDER[quelle])
    quelle = EINGEBETTETE_BILDER[quelle];
  var b = BILDER[quelle];
  if (b === undefined){
    b = new Image();
    b.__fertig = false; b.__fehler = false;
    b.onload  = function(){ b.__fertig = true; };
    b.onerror = function(){ b.__fehler = true; if (DEBUG) console.warn('Bild fehlt:', String(quelle).slice(0,60)); };
    b.src = quelle;
    BILDER[quelle] = b;
  }
  return b.__fertig ? b : null;
}
function bilderVorladen(){
  if (typeof EINGEBETTETE_BILDER === 'undefined') return;
  Object.keys(EINGEBETTETE_BILDER).forEach(function(key){ bildQuelle(key); });
}

/* Die wichtigsten wiederkehrenden Figuren benutzen ein gemeinsames
   4x3-Sheet: vier Ruhe-, vier Geh- und vier Aktionsbilder. Nicht
   umgestellte Nebenfiguren fallen weiterhin sicher auf figure() zurueck. */
var M_SPRITE_KEY = {
  mAlt:'m_alt_sheet', mKind:'m_kind_sheet', mSchueler:'m_schueler_sheet',
  mMarine:'m_marine_sheet', mSarajevo:'m_sarajevo_sheet',
  lena:'lena_sheet'
};
function actorSpriteKey(a){
  if (a === PL) return M_SPRITE_KEY[a.identityKey] || null;
  if (a.id === 'luka') return 'luka_sheet';
  if (a.id === 'lena') return a.appearanceId === 'alt' ? 'lena_alt_sheet' : 'lena_sheet';
  if (a.id === 'dedo') return 'dedo_sheet';
  if (a.id === 'otac') return a.sitting ? 'otac_sitz_sheet' : 'otac_stand_sheet';
  if (a.id === 'majka') return 'majka_sheet';
  if (a.id === 'petar') return 'petar_sheet';
  if (a.id === 'andrin') return 'andrin_sheet';
  if (a.id === 'lehrer') return 'lehrer_sheet';
  if (a.id === 'tiko') return 'tiko_sheet';
  if (a.id === 'zdravko') return 'zdravko_sheet';
  if (a.id === 'admiral') return 'admiral_sheet';
  if (a.id === 'safet') return 'safet_sheet';
  return null;
}
function actorSpriteFrame(a){
  if (a.act){
    if (a.act.kind === 'take') return 10;
    return 11;
  }
  if (a.state === 'walk' && a.path) return 4 + (Math.floor(a.phase * 1.15) & 3);
  if (a.sayLines) return 8 + (Math.floor(a.t * 3.2) & 1);
  return Math.floor(a.t * 1.35) & 3;
}
function drawActorSprite(a, s){
  var key = actorSpriteKey(a);
  if (!key) return false;
  var b = bildQuelle(key);
  if (!b) return false;
  var frame = actorSpriteFrame(a), col = frame & 3, row = Math.floor(frame / 4);
  var fw = b.width / 4, fh = b.height / 3;
  ctx.save();
  ctx.scale(s * a.dir, s);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(b, col * fw, row * fh, fw, fh, -64, -160, 128, 160);
  /* Dedo bleibt eine Figur, seine wechselnden Huete bleiben dagegen
     eine eigene Spielebene. So funktioniert jeder Kapitelhut mit dem
     neuen Sheet weiter, ohne neun nahezu gleiche Grafiken zu laden. */
  if (a.id === 'dedo' && a.build && a.build.hut)
    dedoHut(0, -125, a.build.hut, a.pal);
  ctx.restore();
  return true;
}

/* Das neue grosse Portraet wird nur fuer den alten M. eingesetzt.
   Die vorhandene Live-Zeichnung bleibt als sofortiger Fallback aktiv,
   solange das Bild laedt und fuer alle anderen Lebensphasen. */
function drawActorPortraitImage(actor, pop){
  if (actor !== PL || actor.identityKey !== 'mAlt') return false;
  var b = bildQuelle('m_alt_portrait');
  if (!b) return false;
  ctx.save();
  ctx.scale(pop || 1, pop || 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(b, 0, 0, b.width, b.height, -65, -78, 130, 130);
  ctx.restore();
  return true;
}
/* Zeichnet das Raumbild formatfuellend. Gibt false zurueck, wenn kein
   Bild da ist -- dann uebernimmt die Zeichenfunktion des Raums, und
   zwar auch waehrend das Bild noch laedt. Es gibt darum nie einen
   leeren Rahmen. */
function zeichneRaumbild(){
  var b = bildQuelle(R && R.bild);
  if (!b) return false;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(b, 0, 0, b.width, b.height, 0, 0, R.w, VIEW_H);
  return true;
}
