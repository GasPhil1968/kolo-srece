// Static content validation: every reference in the chapter data must resolve.
//   npx tsx tools/validate.ts
// Checks unique ids, rooms/entries/exits, images and atlases, characters and animations, item
// handlers and icons, verbs with labels, walk areas containing entries and walk targets, decor
// bindings, dialogue structure and non-empty texts. Exits non-zero on any error.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CHAPTERS, COMBATS } from '../src/content/chapters';
import { charMeta, imageMeta } from '../src/content/assets';
import { dyn, HotspotDef, RoomDef, Spot } from '../src/core/content';
import { indexContent } from '../src/core/engine';
import { NavMesh, WalkArea } from '../src/core/path';
import { emptyState } from '../src/core/state';
import { UI } from '../src/content/text/de/ui';

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);
const PUBLIC = join(process.cwd(), 'public', 'assets');

function imageExists(key: string): boolean {
  if (key.includes(':')) {
    const [atlas, frame] = key.split(':');
    const m = charMeta(atlas.replace(/^atlas\//, ''));
    return !!m && frame in m.frames;
  }
  const m = imageMeta(key);
  return !!m && existsSync(join(PUBLIC, m.file));
}

let idx;
try {
  idx = indexContent(CHAPTERS, COMBATS);
} catch (e) {
  err(String(e));
}

const s0 = emptyState();
const verbOk = (v: string) => v in UI.verbs || v === 'go';

for (const ch of CHAPTERS) {
  const where = `chapter ${ch.id}`;
  const rooms = new Map(ch.rooms.map((r) => [r.id, r] as const));
  const items = new Set(ch.items.map((i) => i.id));
  const allRooms = new Map(CHAPTERS.flatMap((c) => c.rooms.map((r) => [r.id, r] as const)));
  if (!rooms.get(ch.start.room)?.entries[ch.start.entry]) err(`${where}: start ${ch.start.room}/${ch.start.entry} missing`);
  if (ch.next && !CHAPTERS.some((c) => c.id === ch.next)) warn(`${where}: next chapter ${ch.next} not (yet) defined`);
  if (!charMeta(ch.pc.character)) err(`${where}: pc character ${ch.pc.character} unknown`);
  if (!imageExists(ch.card.image)) err(`${where}: card image ${ch.card.image} missing`);
  if (ch.card.cine && !imageExists(ch.card.cine)) err(`${where}: card cine ${ch.card.cine} missing`);
  for (const it of ch.items) {
    const icon = dyn(it.icon, s0);
    if (!existsSync(join(PUBLIC, 'items', `${icon}.webp`))) err(`${where}: item ${it.id} icon ${icon} missing`);
    for (const k of Object.keys(it.combine ?? {})) if (!items.has(k)) err(`${where}: item ${it.id} combines with unknown ${k}`);
  }
  for (const a of ch.actors) {
    const m = charMeta(a.character);
    if (!m) err(`${where}: actor ${a.id} character ${a.character} unknown`);
    if (a.start?.room && !rooms.has(a.start.room)) err(`${where}: actor ${a.id} starts in unknown room ${a.start.room}`);
    if (m && a.start?.pose && !m.anims[a.start.pose]) err(`${where}: actor ${a.id} pose ${a.start.pose} missing in ${a.character}`);
    for (const k of Object.keys(a.items ?? {})) if (!items.has(k)) err(`${where}: actor ${a.id} handles unknown item ${k}`);
    for (const v of Object.keys(a.on ?? {})) if (!verbOk(v)) err(`${where}: actor ${a.id} verb ${v} has no label`);
  }
  for (const d of ch.dialogues) {
    if (!ch.actors.some((a) => a.id === d.actor)) err(`${where}: dialogue ${d.id} actor ${d.actor} not in chapter`);
    const ids = new Set<string>();
    for (const o of d.options) {
      if (ids.has(o.id)) err(`${where}: dialogue ${d.id} duplicate option ${o.id}`);
      ids.add(o.id);
      if (!dyn(o.text, s0).trim()) err(`${where}: dialogue ${d.id} option ${o.id} empty`);
    }
  }
  for (const r of ch.rooms) checkRoom(ch.id, r, rooms, allRooms, items);
  try {
    ch.hint({ ...s0, chapter: ch.id, room: ch.start.room });
  } catch (e) {
    err(`${where}: hint() throws on a fresh state: ${e}`);
  }
}

function checkRoom(chId: string, r: RoomDef, rooms: Map<string, RoomDef>, allRooms: Map<string, RoomDef>, items: Set<string>): void {
  const where = `${chId}/${r.id}`;
  const bg = dyn(r.bg, s0);
  const bgm = imageMeta(bg);
  if (!bgm) err(`${where}: background ${bg} missing`);
  else if (Math.abs(bgm.w - r.width) > 1) warn(`${where}: width ${r.width} differs from background ${bgm.w}`);
  const nav = new NavMesh(dyn(r.walk, s0) as WalkArea[]);
  for (const [k, e] of Object.entries(r.entries)) if (!nav.isWalkable(e)) err(`${where}: entry ${k} (${e.x},${e.y}) outside walk area`);
  const decorIds = new Set((r.decor ?? []).map((d) => d.id));
  for (const l of r.layers ?? []) {
    const img = dyn(l.image, s0);
    if (!imageExists(img)) err(`${where}: layer ${l.id} image ${img} missing`);
    for (const fr of l.frames ?? []) if (!imageExists(fr)) err(`${where}: layer ${l.id} frame ${fr} missing`);
  }
  for (const d of r.decor ?? []) {
    const m = charMeta(d.character);
    if (!m) {
      err(`${where}: decor ${d.id} character ${d.character} unknown`);
      continue;
    }
    const anim = d.motion?.anim ?? (d.motion ? 'walk' : d.anim ?? 'stand');
    if (!m.anims[anim]) err(`${where}: decor ${d.id} animation ${anim} missing in ${d.character}`);
    if (d.follow && !decorIds.has(d.follow.id)) err(`${where}: decor ${d.id} follows unknown ${d.follow.id}`);
  }
  const ids = new Set<string>();
  for (const h of r.hotspots) {
    if (ids.has(h.id)) err(`${where}: duplicate hotspot ${h.id}`);
    ids.add(h.id);
    checkHotspot(where, h, nav, rooms, allRooms, items, decorIds);
  }
  for (const a of r.ambient ?? []) if (!['motes', 'birds'].includes(a.fx)) err(`${where}: unknown ambient effect ${a.fx}`);
}

function checkHotspot(
  where: string,
  h: HotspotDef,
  nav: NavMesh,
  _rooms: Map<string, RoomDef>,
  allRooms: Map<string, RoomDef>,
  items: Set<string>,
  decorIds: Set<string>,
): void {
  const w = `${where} hotspot ${h.id}`;
  if (!h.shape && !h.actor && !h.decor) err(`${w}: no shape, actor or decor`);
  if (h.decor && !decorIds.has(h.decor)) err(`${w}: bound to unknown decor ${h.decor}`);
  if (!dyn(h.name, s0).trim()) err(`${w}: empty name`);
  const ex = typeof h.exit === 'function' ? null : h.exit;
  if (ex) {
    const target = allRooms.get(ex.room);
    if (!target) err(`${w}: exit to unknown room ${ex.room}`);
    else if (!target.entries[ex.entry]) err(`${w}: exit to unknown entry ${ex.room}/${ex.entry}`);
  }
  if (h.walkTo && typeof h.walkTo !== 'function') {
    const sp = h.walkTo as Spot;
    if (!nav.isWalkable(sp)) err(`${w}: walkTo (${sp.x},${sp.y}) outside walk area`);
  }
  for (const k of Object.keys(h.items ?? {})) if (!items.has(k)) err(`${w}: handles unknown item ${k}`);
  for (const v of Object.keys(h.on ?? {})) if (!verbOk(v)) err(`${w}: verb ${v} has no label`);
  const verbs = typeof h.verbs === 'function' ? null : h.verbs;
  for (const v of verbs ?? []) {
    if (!verbOk(v)) err(`${w}: verb ${v} has no label`);
    if (v !== 'look' && v !== 'go' && !(h.on && v in h.on)) warn(`${w}: offers ${v} without a handler`);
  }
}

for (const wmsg of warnings) console.log(`warning: ${wmsg}`);
for (const e of errors) console.log(`ERROR: ${e}`);
console.log(`${CHAPTERS.length} chapters, ${CHAPTERS.reduce((n, c) => n + c.rooms.length, 0)} rooms: ${errors.length} errors, ${warnings.length} warnings`);
void idx;
process.exit(errors.length ? 1 : 0);
