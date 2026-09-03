
/* ============================================================
   Sektion 12  RAUMAUSGABE
   ------------------------------------------------------------
   Ueber jedem Bild liegt derselbe feine Rasterpunktschleier.
   Er bindet Hintergrund und Figuren aneinander -- ohne ihn
   sieht der gemalte Raum weicher aus als die harten Sprites.
   ============================================================ */
var DITHER_CACHE = {};
function getDitherCanvas(){
  /* Das Raster wird in der Aufloesung des Weltpuffers erzeugt und
     danach 1:1 in ihn hineingezeichnet. Wuerde man es in logischer
     Groesse bauen und beim Zeichnen verkleinern, fiele beim
     Herunterrechnen die Haelfte der Punkte weg -- aus einer
     gleichmaessigen Koernung wuerde ein zufaelliges Flimmern. */
  var breit = Math.ceil(R.w / WELT_PIX), hoch = Math.ceil((VIEW_H - 42) / WELT_PIX);
  var id = R.id + '|' + RASTER_COL + '|' + WELT_PIX;
  if (DITHER_CACHE[id]) return DITHER_CACHE[id];
  var c = document.createElement('canvas');
  c.width = Math.max(1, breit); c.height = Math.max(1, hoch);
  var cctx = c.getContext('2d');
  var saat = { terrasse:2018, garage:1942, polje:1953, bruecke:1888, mostar:1955,
               kaserne:1963, sarajevo:1974, werk:1971, telefon:1991, bau:2004,
               weide:1953, kuca:1953 }[R.id] || 1942;
  var rr = seeded(saat);
  /* Zwei Toene statt einem. Ein einzelnes dunkles Punktraster liest sich
     wie Schmutz auf dem Bildschirm; erst der helle Gegenpunkt macht
     daraus eine Oberflaeche -- Putz, Stein, Beton, Blech. */
  var hell = mixHex(RASTER_COL, '#ffffff', 0.72);
  for (var y = 0; y < c.height; y += 3){
    for (var x = 0; x < c.width; x += 3){
      var w = rr();
      if (w > 0.80){
        cctx.globalAlpha = 0.11; cctx.fillStyle = RASTER_COL;
        cctx.fillRect(x + (rr() > 0.5 ? 1 : 0), y, 1, 1);
      } else if (w > 0.66){
        cctx.globalAlpha = 0.06; cctx.fillStyle = hell;
        cctx.fillRect(x + (rr() > 0.5 ? 1 : 2), y + 1, 1, 1);
      }
    }
  }
  /* Eine zweite, grobe Lage in grossen Flecken: sie bricht die
     Regelmaessigkeit des Rasters, die sonst als Gitter sichtbar wird. */
  cctx.globalAlpha = 0.05; cctx.fillStyle = RASTER_COL;
  for (var b = 0; b < 90; b++){
    cctx.fillRect(Math.round(rr() * c.width), Math.round(rr() * c.height),
                  3 + Math.round(rr() * 5), 2 + Math.round(rr() * 2));
  }
  cctx.globalAlpha = 1;
  DITHER_CACHE[id] = c;
  return c;
}
function drawPixelDither(){
  if (STIL.korn === 'keins' || STIL.korn === 'papier') return;
  var c = getDitherCanvas();
  ctx.drawImage(c, 0, 0, c.width, c.height, 0, 42, c.width * WELT_PIX, c.height * WELT_PIX);
}
function drawRoom(T){
  setzeRaumTinte();
  /* Ein gemalter Hintergrund bringt sein Licht schon mit. Lichtschleier,
     Farbstich, Raster und Stilnachgang wuerden ihn ein zweites Mal
     behandeln und ihm genau das nehmen, wofuer man ihn gemalt hat. */
  if (zeichneRaumbild()){
    if (typeof R.ueberBild === 'function') R.ueberBild(T);
    return;
  }
  if (R.id === 'garage') drawGarage(T);
  else if (R.id === 'weide') drawWeide(T);
  else if (R.id === 'kuca') drawKuca(T);
  else if (R.id === 'polje') drawPolje(T);
  else if (R.id === 'bruecke') drawBruecke(T);
  else if (R.id === 'mostar') drawMostar(T);
  else if (R.id === 'kaserne') drawKaserne(T);
  else if (R.id === 'sarajevo') drawSarajevo(T);
  else if (R.id === 'werk') drawWerk(T);
  else if (R.id === 'telefon') drawTelefon(T);
  else if (R.id === 'bau') drawBau(T);
  else drawTerrasse(T);
  roomLightWash();
  applyGrade();
  drawPixelDither();
  applyStilPost();
}
