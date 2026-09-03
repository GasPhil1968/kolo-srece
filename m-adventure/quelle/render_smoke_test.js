const fs = require('fs');
const vm = require('vm');
const { createCanvas, Image } = require('@napi-rs/canvas');

const html = fs.readFileSync('../most.html', 'utf8');
const js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const canvas = createCanvas(1280, 600);
canvas.style = {};
canvas.addEventListener = () => {};
canvas.getBoundingClientRect = () => ({ left:0, top:0, width:1280, height:600 });

const rot = { style:{} };
const storage = new Map();
const document = {
  documentElement:{},
  body:{ appendChild(){}, removeChild(){} },
  getElementById(id){ return id === 'cv' ? canvas : rot; },
  createElement(tag){
    if (tag === 'canvas') {
      const c = createCanvas(1, 1);
      c.style = {};
      c.addEventListener = () => {};
      return c;
    }
    return { style:{}, click(){}, set href(v){}, set download(v){} };
  }
};
const sandbox = {
  console, document, Image,
  window:null,
  navigator:{ language:'de-DE', getGamepads:()=>[] },
  location:{ search:'' },
  localStorage:{
    getItem:k => storage.has(k) ? storage.get(k) : null,
    setItem:(k,v) => storage.set(k,String(v))
  },
  innerWidth:1280, innerHeight:600,
  addEventListener(){},
  ResizeObserver:undefined,
  visualViewport:undefined,
  requestAnimationFrame(){},
  setTimeout(){ return 0; }, clearTimeout(){},
  performance, Math, Date, JSON, Array, Object, String, Number, Boolean,
  RegExp, Map, Set, Uint8Array, Float32Array, Infinity, NaN,
  Blob:global.Blob,
  URL:{ createObjectURL(){ return ''; }, revokeObjectURL(){} }
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(js, sandbox, { filename:'most.html' });

function renderRoom(identity, room, out){
  sandbox.G.menu = null;
  sandbox.G.chapterCard = null;
  sandbox.G.cine = null;
  sandbox.G.intro = null;
  sandbox.G.fade = 0;
  sandbox.G.over = false;
  sandbox.G.dlg = null;
  sandbox.G.seq = null;
  sandbox.G.dialogAlpha = 0;
  sandbox.G.dlgSnapshot = null;
  sandbox.G.dialogLinesCache = null;
  sandbox.PL.sayLines = null;
  sandbox.setPlayerIdentity(identity);
  sandbox.bindRoom(room, sandbox.ROOMS[room].entry, true);
  sandbox.G.seq = null;
  sandbox.PL.sayLines = null;
  Object.keys(sandbox.NPC).forEach(k => { sandbox.NPC[k].sayLines = null; });
  sandbox.update(1/30);
  sandbox.render();
  fs.writeFileSync(out, canvas.toBuffer('image/png'));
}

(async function(){
  sandbox.bilderVorladen();
  await new Promise(resolve => setTimeout(resolve, 120));
  renderRoom('mAlt', 'terrasse', '../smoke-terrasse.png');
  sandbox.PL.say(['Das ist mein neues Porträt.']);
  sandbox.update(1/30);
  sandbox.render();
  fs.writeFileSync('../smoke-dialogue.png', canvas.toBuffer('image/png'));
  renderRoom('mKind', 'polje', '../smoke-kapitel1.png');
  renderRoom('mKind', 'weide', '../smoke-weide.png');
  renderRoom('mKind', 'kuca', '../smoke-kuca.png');
  renderRoom('mKind', 'bruecke', '../smoke-bruecke.png');
  renderRoom('mSchueler', 'mostar', '../smoke-mostar.png');
  sandbox.NPC.tiko.visible = true;
  sandbox.NPC.tiko.x = 1180;
  sandbox.NPC.tiko.y = 400;
  sandbox.NPC.tiko.dir = -1;
  sandbox.NPC.tiko.hoehe = 60;
  sandbox.render();
  fs.writeFileSync('../smoke-mostar-tiko.png', canvas.toBuffer('image/png'));
  renderRoom('mMarine', 'kaserne', '../smoke-kaserne.png');
  sandbox.FLAG.fahneGehisst = true;
  sandbox.FLAG.bordsteinFertig = true;
  sandbox.NPC.admiral.visible = true;
  sandbox.NPC.admiral.x = 1240;
  sandbox.NPC.admiral.y = 448;
  sandbox.NPC.admiral.dir = -1;
  sandbox.render();
  fs.writeFileSync('../smoke-kaserne-admiral.png', canvas.toBuffer('image/png'));
  sandbox.G.t = 39;
  renderRoom('mSarajevo', 'sarajevo', '../smoke-sarajevo.png');
  sandbox.applyNPCAppearance(sandbox.NPC.lena, sandbox.NPC.lena.npcDef, 'alt');
  sandbox.render();
  fs.writeFileSync('../smoke-lena-alt.png', canvas.toBuffer('image/png'));
  sandbox.bindRoom('mostar', sandbox.ROOM_MOSTAR.entry, true);
  sandbox.G.seq = null;
  sandbox.PL.visible = false;
  Object.keys(sandbox.NPC).forEach(k => { sandbox.NPC[k].visible = false; });
  const hitProbes = {
    rinne:[300,430], stand:[650,250], kleister:[945,430],
    plakat:[880,250], tribuene:[1100,400], bruecke2:[1160,210]
  };
  const hitResults = {};
  for (const [expected, point] of Object.entries(hitProbes)) {
    const hit = sandbox.hitObject(point[0], point[1]);
    hitResults[expected] = hit && hit.id;
    if (!hit || hit.id !== expected)
      throw new Error(`Mostar-Hotspot ${expected} trifft ${hit && hit.id}`);
  }
  sandbox.bindRoom('kaserne', sandbox.ROOM_KASERNE.entry, true);
  sandbox.G.seq = null;
  sandbox.PL.visible = false;
  Object.keys(sandbox.NPC).forEach(k => { sandbox.NPC[k].visible = false; });
  const kaserneProbes = {
    fahne_k:[760,150], bordstein:[830,405], kammer:[900,205],
    steg:[1110,430], boot:[1220,250], tor_k:[60,180]
  };
  const kaserneHits = {};
  for (const [expected, point] of Object.entries(kaserneProbes)) {
    const hit = sandbox.hitObject(point[0], point[1]);
    kaserneHits[expected] = hit && hit.id;
    if (!hit || hit.id !== expected)
      throw new Error(`Kaserne-Hotspot ${expected} trifft ${hit && hit.id}`);
  }
  sandbox.FLAG.kammerOffen = true;
  const materialHit = sandbox.hitObject(900,250);
  kaserneHits.material = materialHit && materialHit.id;
  if (!materialHit || materialHit.id !== 'material')
    throw new Error(`Kaserne-Hotspot material trifft ${materialHit && materialHit.id}`);

  sandbox.bindRoom('sarajevo', sandbox.ROOM_SARAJEVO.entry, true);
  sandbox.G.seq = null;
  sandbox.PL.visible = false;
  Object.keys(sandbox.NPC).forEach(k => { sandbox.NPC[k].visible = false; });
  const sarajevoProbes = {
    amt:[200,150], schalter:[480,250], kiosk:[760,250], fica:[920,320],
    tram:[600,430], stadion:[1200,200], lena_s:[330,350]
  };
  const sarajevoHits = {};
  for (const [expected, point] of Object.entries(sarajevoProbes)) {
    const hit = sandbox.hitObject(point[0], point[1]);
    sarajevoHits[expected] = hit && hit.id;
    if (!hit || hit.id !== expected)
      throw new Error(`Sarajevo-Hotspot ${expected} trifft ${hit && hit.id}`);
  }
  const roomPerf = {};
  for (const room of ['weide','kuca','polje','bruecke','mostar','kaserne','sarajevo']) {
    sandbox.bindRoom(room, sandbox.ROOMS[room].entry, true);
    sandbox.G.seq = null;
    sandbox.PL.sayLines = null;
    if (sandbox.NARR) sandbox.NARR.sayLines = null;
    Object.keys(sandbox.NPC).forEach(k => { sandbox.NPC[k].sayLines = null; });
    const perfStart = performance.now();
    for (let i = 0; i < 300; i++) {
      sandbox.update(1/60);
      sandbox.render();
    }
    roomPerf[room] = Number(((performance.now() - perfStart) / 300).toFixed(2));
  }
  if (sandbox.FRAME_FEHLER) throw new Error(`Frame errors: ${sandbox.FRAME_FEHLER}`);
  console.log(JSON.stringify({
    terraceBackground: sandbox.ROOM_TERRASSE.bild,
    poljeBackground: 'rosko_polje_1953',
    mostarBackground: sandbox.ROOM_MOSTAR.bild,
    kaserneBackground: sandbox.ROOM_KASERNE.bild,
    sarajevoBackground: sandbox.ROOM_SARAJEVO.bild,
    oldSprite: sandbox.M_SPRITE_KEY.mAlt,
    childSprite: sandbox.M_SPRITE_KEY.mKind,
    studentSprite: sandbox.M_SPRITE_KEY.mSchueler,
    marineSprite: sandbox.M_SPRITE_KEY.mMarine,
    sarajevoSprite: sandbox.M_SPRITE_KEY.mSarajevo,
    lukaSprite: sandbox.actorSpriteKey(sandbox.NPC.luka),
    lenaSprite: sandbox.actorSpriteKey(sandbox.NPC.lena),
    dedoSprite: sandbox.actorSpriteKey(sandbox.NPC.dedo),
    otacStandingSprite: sandbox.actorSpriteKey(Object.assign({}, sandbox.NPC.otac, { id:'otac', sitting:false })),
    otacSeatedSprite: sandbox.actorSpriteKey(Object.assign({}, sandbox.NPC.otac, { id:'otac', sitting:true })),
    majkaSprite: sandbox.actorSpriteKey(sandbox.NPC.majka),
    petarSprite: sandbox.actorSpriteKey(sandbox.NPC.petar),
    andrinSprite: sandbox.actorSpriteKey(sandbox.NPC.andrin),
    lehrerSprite: sandbox.actorSpriteKey(sandbox.NPC.lehrer),
    tikoSprite: sandbox.actorSpriteKey(sandbox.NPC.tiko),
    zdravkoSprite: sandbox.actorSpriteKey(sandbox.NPC.zdravko),
    admiralSprite: sandbox.actorSpriteKey(sandbox.NPC.admiral),
    safetSprite: sandbox.actorSpriteKey(sandbox.NPC.safet),
    mostarHotspots: hitResults,
    kaserneHotspots: kaserneHits,
    sarajevoHotspots: sarajevoHits,
    renderMsPerFrame: roomPerf,
    outputs:['smoke-terrasse.png','smoke-dialogue.png','smoke-kapitel1.png','smoke-weide.png','smoke-kuca.png','smoke-bruecke.png','smoke-mostar.png','smoke-mostar-tiko.png','smoke-kaserne.png','smoke-kaserne-admiral.png','smoke-sarajevo.png','smoke-lena-alt.png']
  }, null, 2));
})();
