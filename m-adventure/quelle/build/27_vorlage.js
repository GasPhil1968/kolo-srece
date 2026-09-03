
/* ============================================================
   Sektion 04d  MALVORLAGEN
   ------------------------------------------------------------
   Wer einen Raum von Hand malen will, braucht zwei Dinge: das
   Bild in genau der Groesse, die die Engine erwartet, und die
   Information, wo darin der Boden liegt, wo die Figur laufen
   darf und wo die Hotspots sitzen. Sonst malt man ein schoenes
   Bild, auf dem die Figur in der Wand steht.

   Taste V erzeugt beides aus dem laufenden Raum:

     m-<raum>-vorlage.png      der Hintergrund, so wie ihn die
                               Engine zeichnet, ohne Figuren,
                               ohne Bedienleiste, in Weltaufloesung
     m-<raum>-plan.png         dasselbe Bild mit eingezeichneter
                               Laufflaeche, Hotspots und Ankern

   Ueber die Vorlage wird gemalt, der Plan bleibt daneben liegen.
   Das fertige Bild kommt als bild:'m-polje.png' an den Raum,
   und ab da zeichnet die Engine den Raum nicht mehr selbst.
   ============================================================ */
function vorlageZeichnen(mitPlan){
  var breit = Math.ceil(R.w / WELT_PIX), hoch = Math.ceil(VIEW_H / WELT_PIX);
  var c = document.createElement('canvas');
  c.width = breit; c.height = hoch;
  var g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  var haupt = ctx, altCam = G.camx;
  ctx = g;
  ctx.setTransform(1/WELT_PIX, 0, 0, 1/WELT_PIX, 0, 0);
  G.camx = 0;
  try {
    var pxl = R.parallax || [];
    for (var pi = 0; pi < pxl.length; pi++){
      var pl = pxl[pi];
      ctx.save();
      if (pl.clip){ ctx.beginPath(); ctx.rect(pl.clip[0], pl.clip[1], pl.clip[2], pl.clip[3]); ctx.clip(); }
      pl.draw(G.t);
      ctx.restore();
    }
    drawRoom(G.t);
    var fg = R.foreground || [];
    for (var f = 0; f < fg.length; f++) if (fg[f].draw) fg[f].draw();
    if (mitPlan){
      /* Der Plan. Gruen = begehbar, rot = Hotspot, gelb = Ankerpunkt,
         dazu die Bodenlinie vorn und hinten mit dem Massstab, in dem
         eine Figur dort zu zeichnen ist. */
      ctx.save();
      ctx.globalAlpha = 0.22; ctx.fillStyle = '#00ff88';
      for (var k = 0; k < R.area.length; k++){
        var pts = R.area[k];
        ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
        for (var q = 2; q < pts.length; q += 2) ctx.lineTo(pts[q], pts[q+1]);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 2;
      for (var k2 = 0; k2 < R.area.length; k2++){
        var p2 = R.area[k2];
        ctx.beginPath(); ctx.moveTo(p2[0], p2[1]);
        for (var q2 = 2; q2 < p2.length; q2 += 2) ctx.lineTo(p2[q2], p2[q2+1]);
        ctx.closePath(); ctx.stroke();
      }
      ctx.strokeStyle = '#ff4a4a'; ctx.lineWidth = 1.6;
      for (var o = 0; o < OBJ.length; o++){
        var h = OBJ[o].hs;
        ctx.strokeRect(h[0], h[1], h[2], h[3]);
        txt(OBJ[o].id, h[0] + 3, h[1] + 12, 11, '#ff8a8a', 'left', 'bold ');
      }
      ctx.fillStyle = '#ffd23a';
      for (var mk in (R.marks || {})){
        var m = R.marks[mk];
        ctx.fillRect(m.x - 3, m.y - 3, 7, 7);
        txt(mk, m.x + 7, m.y + 4, 11, '#ffd23a', 'left');
      }
      // Massstab: wie gross eine Figur vorn und hinten ist
      var nY = (R.nearY || SC_NEAR_Y), fY = (R.farY || SC_FAR_Y);
      ctx.strokeStyle = '#3ad2ff'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(0, nY); ctx.lineTo(R.w, nY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, fY); ctx.lineTo(R.w, fY); ctx.stroke();
      ctx.strokeRect(24, nY - FIGH * scaleAt(nY), 34, FIGH * scaleAt(nY));
      ctx.strokeRect(24, fY - FIGH * scaleAt(fY), 34, FIGH * scaleAt(fY));
      txt('Figur vorn  ' + Math.round(FIGH * scaleAt(nY)) + 'px', 64, nY - 6, 12, '#3ad2ff', 'left', 'bold ');
      txt('Figur hinten ' + Math.round(FIGH * scaleAt(fY)) + 'px', 64, fY - 6, 12, '#3ad2ff', 'left', 'bold ');
      txt(R.id + '  ' + breit + 'x' + hoch + '  (Weltaufloesung, WELT_PIX=' + WELT_PIX + ')',
          8, 16, 13, '#ffffff', 'left', 'bold ');
      ctx.restore();
    }
  } finally {
    ctx = haupt; G.camx = altCam;
    ctx.setTransform(PIX, 0, 0, PIX, 0, 0);
  }
  return c;
}
function vorlageSpeichern(){
  if (!DATEI_MOEGLICH){ flashNote('Malvorlage nur in der Download-Fassung'); return; }
  try {
    ['vorlage', 'plan'].forEach(function(art){
      var c = vorlageZeichnen(art === 'plan');
      var a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = 'm-' + R.id + '-' + art + '.png';
      document.body.appendChild(a); a.click();
      setTimeout(function(){ document.body.removeChild(a); }, 800);
    });
    flashNote('Vorlage und Plan gespeichert');
  } catch(e){ flashNote('Export nicht möglich'); }
}
