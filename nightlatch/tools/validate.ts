// Static validation: every reference in the game content must resolve (rooms, hotspots,
// points, objects, items, clues, dialogs, sounds, sprites, conditions), and the art,
// audio and walkthrough contracts must agree. Also writes docs/PUZZLE_GRAPH.md.
//
//   npx tsx tools/validate.ts            # report, exit 1 on errors
//   npx tsx tools/validate.ts --strict   # warnings count as errors
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { CONTENT } from '../src/content';
import { compile, terms } from '../src/engine/cond';
import type { Cond, DialogDef, HotspotDef, RoomDef, Script, Step } from '../src/engine/types';
import type { WAct } from './sim/harness';
import { Sim, readySteps } from './sim/harness';
import { STEPS } from './walkthrough';

const C = CONTENT;
const ASSETS = 'public/assets';

type Level = 'error' | 'warn';
const issues: { level: Level; where: string; msg: string }[] = [];
const error = (where: string, msg: string) => issues.push({ level: 'error', where, msg });
const warn = (where: string, msg: string) => issues.push({ level: 'warn', where, msg });

// ------------------------------------------------------------------ asset metadata
interface Pt { x: number; y: number; face?: string }
interface RoomMeta {
  w: number;
  h: number;
  hotspots: Record<string, { poly: [number, number][]; walk?: [number, number]; face?: string }>;
  walk: { poly: [number, number][]; holes?: [number, number][][] }[];
  points: Record<string, Pt>;
  objects: Record<string, { state: boolean; baseline: number | null; depth: number | null; variants?: string[] }>;
  variants: string[];
  anims: Record<string, { variants?: string[] }>;
  floor?: string;
}
interface CharMeta { anims: Record<string, unknown>; sizes: { k: number; file: string }[] }
interface AudioEntry { file: string; loop?: boolean; volume?: number }
interface AudioManifest { music: Record<string, AudioEntry>; amb: Record<string, AudioEntry>; sfx: Record<string, AudioEntry> }

const readJson = <T>(p: string): T | undefined => (existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as T) : undefined);

const rooms: Record<string, RoomMeta | undefined> = {};
for (const id of Object.keys(C.rooms)) {
  const m = readJson<RoomMeta>(`${ASSETS}/rooms/${id}/room.json`);
  if (!m) error(`room ${id}`, 'no art: public/assets/rooms/' + id + '/room.json is missing');
  else {
    rooms[id] = m;
    const v = m.variants?.length ? m.variants : [];
    for (const f of ['bg.png', ...v.map((x) => `bg_${x}.png`)]) {
      if (!existsSync(`${ASSETS}/rooms/${id}/${f}`)) error(`room ${id}`, `missing image ${f}`);
    }
    const files: string[] = [];
    for (const [o, om] of Object.entries(m.objects ?? {})) for (const v of ['', ...(om.variants ?? [])]) files.push(`obj_${o}${v ? '_' + v : ''}.png`);
    for (const [a, am] of Object.entries(m.anims ?? {})) for (const v of ['', ...(am.variants ?? [])]) files.push(`anim_${a}${v ? '_' + v : ''}.png`);
    for (const f of files) if (!existsSync(`${ASSETS}/rooms/${id}/${f}`)) error(`room ${id}`, `missing ${f}`);
    for (const [a, am] of Object.entries(m.anims ?? {})) for (const v of am.variants ?? []) if (!v || !(m.variants ?? []).includes(v)) error(`room ${id}`, `anim ${a} has a strip for unknown variant '${v}'`);
  }
}
const chars: Record<string, CharMeta> = {};
for (const f of readdirSync(`${ASSETS}/chars`)) {
  if (!f.endsWith('.json') || f === 'index.json') continue;
  const id = f.slice(0, -5);
  chars[id] = readJson<CharMeta>(`${ASSETS}/chars/${f}`)!;
  for (const s of chars[id].sizes) if (!existsSync(`${ASSETS}/${s.file}`)) error(`sprite ${id}`, `missing ${s.file}`);
}
const audio = readJson<AudioManifest>(`${ASSETS}/audio/manifest.json`);
if (!audio) error('audio', 'public/assets/audio/manifest.json is missing');
else {
  for (const kind of ['music', 'amb', 'sfx'] as const) {
    for (const [id, e] of Object.entries(audio[kind])) if (!existsSync(`${ASSETS}/audio/${e.file}`)) error(`audio ${kind}`, `${id}: file ${e.file} missing`);
  }
}
const itemAtlas = readJson<{ frames: Record<string, unknown> | { filename: string }[] }>(`${ASSETS}/ui/items.json`);
const itemFrames = new Set<string>(
  !itemAtlas ? [] : Array.isArray(itemAtlas.frames) ? itemAtlas.frames.map((f) => f.filename) : Object.keys(itemAtlas.frames),
);
if (!itemAtlas) error('items', 'public/assets/ui/items.json is missing');
for (const f of ['ui/map.png', 'ui/title.png', 'ui/title_logo.png', 'ui/ui.png', 'fonts/nl.png', 'fonts/nlo.png', 'credits.txt']) {
  if (!existsSync(`${ASSETS}/${f}`)) error('ui', `missing ${f}`);
}
const manifest = readJson<{ rooms: string[]; chars: string[]; docs?: string[] }>(`${ASSETS}/manifest.json`);
if (manifest) {
  for (const r of Object.keys(C.rooms)) if (rooms[r] && !manifest.rooms.includes(r)) error('manifest', `room ${r} not listed in assets/manifest.json (run art/build_manifest.py)`);
  for (const c of Object.keys(chars)) if (!manifest.chars.includes(c)) error('manifest', `sprite ${c} not listed in assets/manifest.json`);
}

// ------------------------------------------------------------------ geometry
function inPoly(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) inside = !inside;
  }
  return inside;
}
function walkable(m: RoomMeta, x: number, y: number): boolean {
  return m.walk.some((a) => inPoly(x, y, a.poly) && !(a.holes ?? []).some((h) => inPoly(x, y, h)));
}

// ------------------------------------------------------------------ references
const flagsSet = new Set<string>(['game_complete']);
const flagsUsed = new Map<string, string>();
const onceKeys = new Set<string>();
const sfxUsed = new Map<string, string>();
const musicUsed = new Map<string, string>();
const ambUsed = new Map<string, string>();
const speakers = new Set<string>(['rook', ...Object.keys(C.npcs)]);
const playerSprites = new Set<string>(['rook', ...(C.playerSprite ?? []).map(([, s]) => s)]);
const seenKeysUsed = new Map<string, string>();
const conds: [Cond, string][] = [];

function point(room: string, at: string, where: string, standing = true) {
  const m = rooms[room];
  if (!m) return;
  const p = m.points?.[at];
  if (!p) return error(where, `room ${room} has no point '${at}'`);
  if (standing && !at.startsWith('wake') && !walkable(m, p.x, p.y)) warn(where, `point ${room}.${at} (${p.x},${p.y}) is outside the walkable area`);
}

function cond(c: Cond | undefined, where: string) {
  if (c === undefined || c === '') return;
  conds.push([c, where]);
  try {
    compile(c);
  } catch (e) {
    return error(where, String((e as Error).message));
  }
  for (const t of terms(c)) {
    const m = /^([A-Za-z_][\w.]*)(?::([\w.]+))?/.exec(t);
    if (!m) continue;
    const [, head, arg] = m;
    if (arg !== undefined) {
      const ok: Record<string, boolean> = {
        has: !!C.items[arg],
        clue: !!C.clues[arg],
        ded: !!C.deductions[arg],
        visited: !!C.rooms[arg],
        room: !!C.rooms[arg],
        read: !!C.docs[arg],
        map: !!C.locations[arg],
        person: !!C.people[arg],
        seen: true,
      };
      if (head === 'seen') seenKeysUsed.set(arg, where);
      else if (!ok[head]) error(where, `condition "${c}": unknown ${head} '${arg}'`);
    } else if (!['true', 'false', 'chapter'].includes(head) && !/^\d/.test(head)) {
      flagsUsed.set(head, where);
    }
  }
}

interface Ctx { room?: string; npc?: string; where: string }

function script(sc: Script | undefined, ctx: Ctx) {
  if (!sc) return;
  if (!Array.isArray(sc)) return error(ctx.where, 'script is not an array');
  let room = ctx.room;
  sc.forEach((st, i) => {
    const where = `${ctx.where}[${i}]`;
    room = step(st, { ...ctx, room, where }) ?? room;
  });
}

/** Validate one step; returns the room the script continues in if the step changes it. */
function step(st: Step, ctx: Ctx): string | undefined {
  const w = ctx.where;
  if (typeof st === 'string') return;
  if ('say' in st) {
    if (st.who && !speakers.has(st.who)) error(w, `unknown speaker '${st.who}'`);
    return;
  }
  if ('narrate' in st) return;
  if ('set' in st) {
    if (typeof st.set === 'string') flagsSet.add(st.set);
    else for (const k of Object.keys(st.set)) flagsSet.add(k);
    return;
  }
  if ('unset' in st) return void flagsSet.add(st.unset);
  if ('inc' in st) return void flagsSet.add(st.inc);
  if ('give' in st) return void (C.items[st.give] || error(w, `give: unknown item ${st.give}`));
  if ('take' in st) return void (C.items[st.take] || error(w, `take: unknown item ${st.take}`));
  if ('clue' in st) return void (C.clues[st.clue] || error(w, `clue: unknown ${st.clue}`));
  if ('person' in st) return void (C.people[st.person] || error(w, `person: unknown ${st.person}`));
  if ('unlock' in st) return void (C.locations[st.unlock] || error(w, `unlock: unknown location ${st.unlock}`));
  if ('sfx' in st) return void sfxUsed.set(st.sfx, w);
  if ('music' in st) return void (st.music && musicUsed.set(st.music, w));
  if ('amb' in st) return void (st.amb && ambUsed.set(st.amb, w));
  if ('walk' in st) {
    if (st.who && st.who !== 'rook' && !C.npcs[st.who]) error(w, `walk: unknown actor ${st.who}`);
    if (typeof st.walk === 'string') {
      if (ctx.room) point(ctx.room, st.walk, w, !st.who || st.who === 'rook');
      else if (!Object.values(rooms).some((m) => m?.points?.[st.walk as string])) error(w, `walk: no room has point '${st.walk}'`);
    }
    return;
  }
  if ('face' in st && !('npc' in st)) {
    if (st.who && st.who !== 'rook' && !C.npcs[st.who]) error(w, `face: unknown actor ${st.who}`);
    return;
  }
  if ('anim' in st) {
    const name = st.anim.replace(/^hold:/, '');
    const sprites = !st.who || st.who === 'rook' ? [...playerSprites] : [C.npcs[st.who]?.sprite].filter(Boolean) as string[];
    if (st.who && st.who !== 'rook' && !C.npcs[st.who]) error(w, `anim: unknown actor ${st.who}`);
    for (const sp of sprites) if (chars[sp] && !chars[sp].anims[name]) error(w, `anim '${name}' missing on sprite ${sp}`);
    return;
  }
  if ('goto' in st) {
    if (!C.rooms[st.goto]) error(w, `goto: unknown room ${st.goto}`);
    else if (st.at) point(st.goto, st.at, w, false);
    return st.goto;
  }
  if ('dialog' in st) {
    const d = C.dialogs[st.dialog];
    if (!d) error(w, `dialog: unknown ${st.dialog}`);
    else if (st.node && !d.nodes[st.node]) error(w, `dialog ${st.dialog}: unknown node ${st.node}`);
    return;
  }
  if ('if' in st) {
    cond(st.if, w);
    script(st.then, { ...ctx, where: w + '.then' });
    script(st.else, { ...ctx, where: w + '.else' });
    return;
  }
  if ('pick' in st) {
    st.pick.forEach((p, i) => {
      cond(p.when, `${w}.pick${i}`);
      script(p.do, { ...ctx, where: `${w}.pick${i}` });
    });
    return;
  }
  if ('once' in st) {
    onceKeys.add('once:' + st.once);
    script(st.do, { ...ctx, where: w + '.once' });
    script(st.else, { ...ctx, where: w + '.else' });
    return;
  }
  if ('random' in st) {
    st.random.forEach((s, i) => script(s, { ...ctx, where: `${w}.random${i}` }));
    return;
  }
  if ('doc' in st) return void (C.docs[st.doc] || error(w, `doc: unknown ${st.doc}`));
  if ('closeup' in st) return void (C.closeups[st.closeup] || error(w, `closeup: unknown ${st.closeup}`));
  if ('npc' in st) {
    if (!C.npcs[st.npc]) error(w, `npc: unknown ${st.npc}`);
    if (!st.hide && st.room) {
      if (!C.rooms[st.room]) error(w, `npc: unknown room ${st.room}`);
      else if (st.at) point(st.room, st.at, w, false);
    }
    return;
  }
  if ('stash' in st) {
    if (Array.isArray(st.stash)) for (const it of st.stash) if (!C.items[it]) error(w, `stash: unknown item ${it}`);
    return;
  }
  // wait, fade, card, chapter, autosave, shake, flash, blur, end, stop, hint, unstash: nothing to resolve
  return;
}

// ------------------------------------------------------------------ rooms
const walkthroughHotspots = new Map<string, Set<string>>();
for (const s of STEPS) {
  for (const a of s.do) {
    if ('target' in a && a.target.kind === 'hs' && s.room) {
      if (!walkthroughHotspots.has(s.room)) walkthroughHotspots.set(s.room, new Set());
      walkthroughHotspots.get(s.room)!.add(a.target.id);
    }
  }
}

function hotspotChecks(room: RoomDef, id: string, h: HotspotDef, m: RoomMeta | undefined) {
  const where = `room ${room.id} hotspot ${id}`;
  if (m && !m.hotspots[id]) error(where, 'no polygon in room.json (unclickable)');
  cond(h.when, where + '.when');
  if (!h.look && !h.use && !h.exit && !h.items) warn(where, 'has no look/use/exit/items');
  if (!h.look) warn(where, 'no look text');
  script(h.look, { room: room.id, where: where + '.look' });
  script(h.use, { room: room.id, where: where + '.use' });
  script(h.anyItem, { room: room.id, where: where + '.anyItem' });
  for (const [it, sc] of Object.entries(h.items ?? {})) {
    if (!C.items[it]) error(where, `items: unknown item ${it}`);
    script(sc, { room: room.id, where: `${where}.items.${it}` });
  }
  if (h.exit) {
    cond(h.exit.when, where + '.exit.when');
    script(h.exit.blocked, { room: room.id, where: where + '.exit.blocked' });
    if (!h.exit.map) {
      if (!C.rooms[h.exit.to]) error(where, `exit to unknown room '${h.exit.to}'`);
      else point(h.exit.to, h.exit.at ?? 'start', where + '.exit');
    }
  }
}

for (const room of Object.values(C.rooms)) {
  const m = rooms[room.id];
  const where = `room ${room.id}`;
  for (const [id, h] of Object.entries(room.hotspots)) hotspotChecks(room, id, h, m);
  if (m) {
    for (const id of Object.keys(m.hotspots)) if (!room.hotspots[id]) warn(where, `art hotspot '${id}' has no content (players can see it but not click it)`);
    for (const [id, o] of Object.entries(m.objects ?? {})) {
      if (o.state && !(room.objects && id in room.objects)) warn(where, `state object '${id}' is never shown (no condition in content)`);
    }
    for (const id of Object.keys(room.objects ?? {})) {
      if (!m.objects?.[id]) error(where, `object '${id}' not in room.json`);
      else if (!m.objects[id].state) warn(where, `object '${id}' is static art, its condition is ignored`);
    }
    for (const [c, v] of room.variant ?? []) {
      cond(c, where + '.variant');
      if (v && !m.variants?.includes(v)) error(where, `variant '${v}' not in room.json`);
    }
    if (!m.points?.start) error(where, "no 'start' point");
    if (m.floor && audio) {
      for (let n = 1; n <= 3; n++) if (!audio.sfx[`footstep_${m.floor}_${n}`]) error('audio', `footstep_${m.floor}_${n} missing (floor of ${room.id})`);
    }
  }
  for (const [c] of Object.entries(room.objects ?? {})) cond(room.objects![c], `${where}.objects.${c}`);
  for (const v of [room.music, room.amb]) {
    if (v === undefined) continue;
    const list = typeof v === 'string' ? [['true', v] as [string, string]] : v;
    for (const [c, track] of list) {
      cond(c, where + '.music/amb');
      (v === room.music ? musicUsed : ambUsed).set(track, where);
    }
  }
  if (room.music === undefined) warn(where, 'no music');
  cond(room.dark, where + '.dark');
  cond(room.noPlayer, where + '.noPlayer');
  for (const b of room.blocks ?? []) cond(b.when, where + '.blocks');
  script(room.enter, { room: room.id, where: where + '.enter' });
  for (const pl of room.npcs ?? []) {
    const pw = `${where} npc ${pl.id}@${pl.at}`;
    const def = C.npcs[pl.id];
    if (!def) error(pw, 'unknown npc');
    point(room.id, pl.at, pw, false); // NPCs may stand behind counters
    cond(pl.when, pw + '.when');
    script(pl.look, { room: room.id, npc: pl.id, where: pw + '.look' });
    script(pl.talk, { room: room.id, npc: pl.id, where: pw + '.talk' });
    script(pl.anyItem, { room: room.id, npc: pl.id, where: pw + '.anyItem' });
    for (const [it, sc] of Object.entries(pl.items ?? {})) {
      if (!C.items[it]) error(pw, `items: unknown item ${it}`);
      script(sc, { room: room.id, npc: pl.id, where: `${pw}.items.${it}` });
    }
    if (pl.pose && def && chars[def.sprite] && !chars[def.sprite].anims[pl.pose] && !chars[def.sprite].anims[pl.pose + '_side']) {
      error(pw, `pose '${pl.pose}' missing on sprite ${def.sprite}`);
    }
  }
}

// ------------------------------------------------------------------ everything else
for (const n of Object.values(C.npcs)) {
  const w = `npc ${n.id}`;
  if (!chars[n.sprite]) error(w, `sprite '${n.sprite}' missing`);
  script(n.look, { npc: n.id, where: w + '.look' });
  script(n.talk, { npc: n.id, where: w + '.talk' });
  script(n.anyItem, { npc: n.id, where: w + '.anyItem' });
  for (const [it, sc] of Object.entries(n.items ?? {})) {
    if (!C.items[it]) error(w, `items: unknown item ${it}`);
    script(sc, { npc: n.id, where: `${w}.items.${it}` });
  }
}
for (const sp of playerSprites) if (!chars[sp]) error('player', `sprite ${sp} missing`);
for (const [c] of C.playerSprite ?? []) cond(c, 'playerSprite');

function dialogChecks(d: DialogDef) {
  const w = `dialog ${d.id}`;
  if (!C.npcs[d.npc]) error(w, `unknown npc ${d.npc}`);
  if (d.start && !d.nodes[d.start]) error(w, `start node ${d.start} missing`);
  if (!d.nodes[d.start ?? 'root']) error(w, 'no root node');
  for (const [nid, n] of Object.entries(d.nodes)) {
    const nw = `${w}.${nid}`;
    script(n.lines, { npc: d.npc, where: nw + '.lines' });
    const ids = new Set<string>();
    for (const o of n.options) {
      const ow = `${nw}.${o.id}`;
      if (ids.has(o.id)) error(ow, 'duplicate option id in node');
      ids.add(o.id);
      cond(o.when, ow + '.when');
      script(o.do, { npc: d.npc, where: ow + '.do' });
      if (o.next && o.next !== 'exit' && !d.nodes[o.next]) error(ow, `next node '${o.next}' missing`);
      for (const [it, sc] of Object.entries(o.present ?? {})) {
        if (it !== 'default' && !C.items[it]) error(ow, `present: unknown item ${it}`);
        script(sc, { npc: d.npc, where: `${ow}.present.${it}` });
      }
    }
    // a node with options must offer some way out: an unconditional exit, or options that lead elsewhere
    if (n.options.length && !n.options.some((o) => o.next === 'exit' && !o.when) && !n.options.some((o) => o.next && o.next !== nid)) {
      warn(nw, 'no unconditional way out of this node (check that one always becomes available)');
    }
  }
}
Object.values(C.dialogs).forEach(dialogChecks);

for (const it of Object.values(C.items)) {
  const w = `item ${it.id}`;
  if (itemAtlas && !itemFrames.has(it.id)) error(w, 'no icon in ui/items atlas');
  if (it.doc && !C.docs[it.doc]) error(w, `doc ${it.doc} missing`);
  script(it.look, { where: w + '.look' });
  for (const [o, sc] of Object.entries(it.combine ?? {})) {
    if (!C.items[o]) error(w, `combine: unknown item ${o}`);
    script(sc, { where: `${w}.combine.${o}` });
  }
}
for (const c of Object.values(C.clues)) if (c.doc && !C.docs[c.doc]) error(`clue ${c.id}`, `doc ${c.doc} missing`);
for (const d of Object.values(C.deductions)) {
  const w = `deduction ${d.id}`;
  for (const x of [...d.a, ...d.b]) if (!C.clues[x]) error(w, `unknown clue ${x}`);
  cond(d.when, w + '.when');
  script(d.then, { where: w + '.then' });
}
for (const t of Object.values(C.timelines)) {
  const w = `timeline ${t.id}`;
  for (const x of t.order) if (!C.clues[x]) error(w, `unknown clue ${x}`);
  cond(t.when, w + '.when');
  script(t.solved, { where: w + '.solved' });
  flagsSet.add('tl_' + t.id);
}
for (const cu of Object.values(C.closeups)) {
  const w = `closeup ${cu.id}`;
  cond(cu.knownWhen, w + '.knownWhen');
  script(cu.solved, { where: w + '.solved' });
  script(cu.wrong, { where: w + '.wrong' });
  flagsSet.add('cu_' + cu.id);
  if (cu.kind === 'combo' && !/^\d+$/.test(cu.solution)) error(w, 'combination must be digits');
  if (cu.kind === 'patch') {
    for (const pair of cu.solution.split(',')) for (const j of pair.split('-')) if (!cu.jacks?.includes(j)) error(w, `patch jack ${j} not in jacks`);
  }
}
for (const l of Object.values(C.locations)) {
  const w = `location ${l.id}`;
  if (!C.rooms[l.room]) error(w, `unknown room ${l.room}`);
  else point(l.room, l.at ?? 'from_map', w);
  cond(l.when, w + '.when');
  for (const [c, r, at] of l.rooms ?? []) {
    cond(c, w + '.rooms');
    if (!C.rooms[r]) error(w, `unknown room ${r}`);
    else point(r, at ?? l.at ?? 'from_map', w);
  }
}
for (const p of Object.values(C.people)) for (const [c] of p.notes ?? []) cond(c, `person ${p.id}`);
for (const ch of C.chapters) {
  cond(ch.complete, `chapter ${ch.n}.complete`);
  for (const o of ch.objectives) {
    cond(o.when, `chapter ${ch.n} objective ${o.id}.when`);
    cond(o.done, `chapter ${ch.n} objective ${o.id}.done`);
    if (!o.hints.length) warn(`chapter ${ch.n} objective ${o.id}`, 'no hints');
  }
}
for (const wt of C.watch ?? []) {
  cond(wt.when, `watch ${wt.id}`);
  script(wt.do, { where: `watch ${wt.id}` });
}
script(C.start, { where: 'start' });

// sounds the engine plays directly (presenter, HUD, menus)
const codeSfx = new Map<string, string>();
for (const dir of ['src/game', 'src/engine']) {
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.ts')) continue;
    const src = readFileSync(`${dir}/${f}`, 'utf8');
    for (const m of src.matchAll(/\bsfx\(\s*'([a-z0-9_]+)'/g)) codeSfx.set(m[1], `${dir}/${f}`);
  }
}
if (audio) {
  for (const [id, w] of [...sfxUsed, ...codeSfx]) if (!audio.sfx[id]) error(w, `sfx '${id}' not in audio manifest`);
  for (const [id, w] of musicUsed) if (!audio.music[id]) error(w, `music '${id}' not in audio manifest`);
  for (const [id, w] of ambUsed) if (!audio.amb[id]) error(w, `ambience '${id}' not in audio manifest`);
}

// flags: used in conditions but never set anywhere is almost always a typo
for (const [f, w] of flagsUsed) if (!flagsSet.has(f)) error(w, `flag '${f}' is tested but never set`);
// seen: keys must be dialog options, once-keys or watcher ids
const optionKeys = new Set<string>();
for (const d of Object.values(C.dialogs)) for (const n of Object.values(d.nodes)) for (const o of n.options) optionKeys.add(`${d.id}.${o.id}`);
for (const [k, w] of seenKeysUsed) {
  if (!optionKeys.has(k) && !onceKeys.has(k) && !k.startsWith('watch:')) error(w, `seen:${k} matches no dialog option`);
}

// ------------------------------------------------------------------ walkthrough contract
const stepIds = new Set<string>();
for (const s of STEPS) {
  const w = `walkthrough ${s.id}`;
  if (stepIds.has(s.id)) error(w, 'duplicate step id');
  stepIds.add(s.id);
  cond(s.when, w + '.when');
  cond(s.done, w + '.done');
  if (s.room && !C.rooms[s.room]) error(w, `unknown room ${s.room}`);
  for (const a of s.do as WAct[]) {
    if (a.t === 'go') {
      if (!C.rooms[a.room]) error(w, `go: unknown room ${a.room}`);
      continue;
    }
    if ('target' in a) {
      if (a.target.kind === 'hs' && s.room && !C.rooms[s.room]?.hotspots[a.target.id]) error(w, `hotspot ${a.target.id} not in ${s.room}`);
      if (a.target.kind === 'npc' && !C.npcs[a.target.id]) error(w, `unknown npc ${a.target.id}`);
    }
    if ('item' in a && !C.items[a.item]) error(w, `unknown item ${a.item}`);
  }
}

// ------------------------------------------------------------------ puzzle graph
// Dependencies are measured, not guessed: one canonical headless playthrough records which
// step first made each condition atom true; a step's parents are the steps that made its
// preconditions true.
function atoms(c: string): string[] {
  return c.split('|')[0].split('&').map((x) => x.trim().replace(/^\(+|\)+$/g, '')).filter((x) => x && !x.startsWith('!') && x !== 'true');
}
const parents = new Map<string, Set<string>>();
{
  const sim = new Sim(CONTENT, 1);
  await sim.start();
  const madeBy = new Map<string, string>();
  const allAtoms = new Set(STEPS.flatMap((st) => atoms(st.when)));
  const note = (by: string) => {
    for (const a of allAtoms) if (!madeBy.has(a) && sim.game.cond(a)) madeBy.set(a, by);
  };
  note('start');
  for (let i = 0; i < 600 && !sim.game.state.ended; i++) {
    const ready = readySteps(sim.game, STEPS);
    if (!ready.length) break;
    const st = ready[0];
    const ch = sim.game.state.chapter;
    const ps = new Set<string>();
    for (const a of atoms(st.when)) {
      const by = madeBy.get(a);
      if (by && by !== 'start' && STEPS.find((x) => x.id === by)?.chapter === st.chapter) ps.add(by);
    }
    parents.set(st.id, ps);
    if (!(await sim.runStep(st))) error(`walkthrough ${st.id}`, 'canonical playthrough could not complete this step');
    note(st.id);
    if (sim.game.state.chapter !== ch) for (const a of allAtoms) if (!sim.game.cond(a)) madeBy.delete(a);
  }
  if (!sim.game.state.ended) error('walkthrough', 'canonical playthrough did not reach the ending');
  for (const st of STEPS) {
    if (parents.has(st.id)) continue; // not needed on the canonical route (optional, or done by another step)
    const ps = new Set<string>();
    for (const a of atoms(st.when)) {
      const by = madeBy.get(a);
      if (by && by !== 'start' && by !== st.id && STEPS.find((x) => x.id === by)?.chapter === st.chapter) ps.add(by);
    }
    parents.set(st.id, ps);
  }
}
let md = '# Night Latch — Puzzle dependency graph\n\n';
md += 'Generated by `npm run validate` from `tools/walkthrough.ts`, the machine-checked critical path. ';
md += 'An arrow A → B means that completing step A is what made a precondition of step B true, measured in a headless playthrough. ';
md += 'Steps without arrows are available from the chapter start. ';
md += 'The automated playtests execute these steps in randomized valid orders (see `docs/TEST_REPORT.md`).\n\n';
for (let ch = 1; ch <= 8; ch++) {
  const steps = STEPS.filter((s) => s.chapter === ch);
  md += `## Chapter ${ch}: ${C.chapters[ch - 1]?.title ?? ''}\n\n\`\`\`mermaid\nflowchart TD\n`;
  const nodeId = (id: string) => id.replace(/\./g, '_');
  md += `  start${ch}((start))\n`;
  for (const s of steps) md += `  ${nodeId(s.id)}["${s.id.split('.')[1]}${s.room ? ' @ ' + s.room : ''}${s.optional ? ' (optional)' : ''}"]\n`;
  for (const s of steps) {
    const ps = parents.get(s.id) ?? new Set<string>();
    if (!ps.size) md += `  start${ch} --> ${nodeId(s.id)}\n`;
    for (const p of ps) md += `  ${nodeId(p)} --> ${nodeId(s.id)}\n`;
  }
  md += '```\n\n| step | where | needs | done when | actions |\n|---|---|---|---|---|\n';
  for (const s of steps) {
    const acts = (s.do as WAct[]).map((a) => (a.t === 'go' ? `go ${a.room}` : 'target' in a ? `${a.t} ${'item' in a ? a.item + ' → ' : ''}${a.target.id}` : a.t === 'examine' ? `examine ${a.item}` : a.t === 'combine' || a.t === 'deduce' ? `${a.t} ${a.a} + ${a.b}` : a.t)).join('; ');
    md += `| ${s.id} | ${s.room ?? '—'} | \`${s.when}\` | \`${s.done}\` | ${acts}${s.say ? ' (says: ' + s.say.join(', ') + ')' : ''} |\n`;
  }
  md += '\n';
}
writeFileSync('docs/PUZZLE_GRAPH.md', md);

// ------------------------------------------------------------------ report
const strict = process.argv.includes('--strict');
const errs = issues.filter((i) => i.level === 'error');
const warns = issues.filter((i) => i.level === 'warn');
const dedupe = (l: typeof issues) => [...new Map(l.map((i) => [`${i.where}|${i.msg}`, i])).values()];
for (const i of dedupe(errs)) console.log(`ERROR ${i.where}: ${i.msg}`);
if (!process.argv.includes('--quiet')) for (const i of dedupe(warns)) console.log(`warn  ${i.where}: ${i.msg}`);
console.log(
  `\nvalidated ${Object.keys(C.rooms).length} rooms, ${Object.keys(C.dialogs).length} dialogs, ${Object.keys(C.items).length} items, ` +
    `${Object.keys(C.clues).length} clues, ${conds.length} conditions, ${STEPS.length} walkthrough steps: ` +
    `${dedupe(errs).length} errors, ${dedupe(warns).length} warnings`,
);
if (dedupe(errs).length || (strict && dedupe(warns).length)) process.exit(1);
