import { evalCond } from './cond';
import type { Presenter } from './presenter';
import { addUnique, newState, rand, type GameState } from './state';
import type {
  ChapterDef, CloseupDef, Content, DialogDef, Dir, HotspotDef, LocationDef, NpcDef, NpcPlacement,
  ObjectiveDef, OptionDef, RoomDef, Script, Step,
} from './types';

export type Target = { kind: 'hs' | 'npc'; id: string };
export type Action =
  | { t: 'look'; target: Target }
  | { t: 'use'; target: Target }
  | { t: 'item'; item: string; target: Target }
  | { t: 'combine'; a: string; b: string }
  | { t: 'examine'; item: string }
  | { t: 'travel'; loc: string }
  | { t: 'deduce'; a: string; b: string }
  | { t: 'timeline'; id: string; order: string[] };

class StopSignal extends Error {
  constructor() { super('stop'); }
}

export interface NpcHere {
  id: string;
  def: NpcDef;
  at: string;
  face?: Dir;
  pose?: string;
  placement?: NpcPlacement;
}

export class Game {
  state: GameState;
  busy = 0;
  /** Set when a step references something missing; surfaced by tests. */
  errors: string[] = [];
  private dialogDepth = 0;

  constructor(public content: Content, public p: Presenter, state?: GameState) {
    this.state = state ?? newState();
  }

  // ------------------------------------------------------------------- queries ----
  cond(c?: string) {
    return evalCond(c, this.state);
  }

  room(id = this.state.room): RoomDef {
    const r = this.content.rooms[id];
    if (!r) throw new Error(`unknown room ${id}`);
    return r;
  }

  hotspots(): [string, HotspotDef][] {
    return Object.entries(this.room().hotspots).filter(([, h]) => this.cond(h.when));
  }

  npcsHere(roomId = this.state.room): NpcHere[] {
    const out: NpcHere[] = [];
    const seen = new Set<string>();
    for (const [id, ov] of Object.entries(this.state.npcs)) {
      seen.add(id);
      if (ov && ov.room === roomId) {
        const def = this.content.npcs[id];
        const placement = this.content.rooms[roomId]?.npcs?.find((p) => p.id === id && p.at === ov.at);
        if (def) out.push({ id, def, at: ov.at, face: ov.face, placement, pose: placement?.pose });
      }
    }
    for (const pl of this.content.rooms[roomId]?.npcs ?? []) {
      if (seen.has(pl.id)) continue;
      if (!this.cond(pl.when)) continue;
      if (out.some((n) => n.id === pl.id)) continue;
      const def = this.content.npcs[pl.id];
      if (def) out.push({ id: pl.id, def, at: pl.at, face: pl.face, placement: pl, pose: pl.pose });
    }
    return out;
  }

  pickVal(v: string | [string, string][] | undefined): string | undefined {
    if (v === undefined || typeof v === 'string') return v;
    for (const [c, val] of v) if (this.cond(c)) return val;
    return undefined;
  }

  variant(roomId = this.state.room): string {
    const r = this.content.rooms[roomId];
    return (r?.variant && this.pickVal(r.variant)) || '';
  }

  objectsVisible(roomId = this.state.room): string[] {
    const r = this.content.rooms[roomId];
    return Object.entries(r?.objects ?? {}).filter(([, c]) => this.cond(c)).map(([k]) => k);
  }

  locations(): LocationDef[] {
    return Object.values(this.content.locations).filter((l) => this.state.map.includes(l.id) && this.cond(l.when));
  }

  locationRoom(l: LocationDef): { room: string; at?: string } {
    for (const [c, room, at] of l.rooms ?? []) if (this.cond(c)) return { room, at };
    return { room: l.room, at: l.at };
  }

  chapterDef(n = this.state.chapter): ChapterDef | undefined {
    return this.content.chapters.find((c) => c.n === n);
  }

  objectives(): { def: ObjectiveDef; done: boolean }[] {
    const ch = this.chapterDef();
    if (!ch) return [];
    return ch.objectives.filter((o) => this.cond(o.when)).map((def) => ({ def, done: this.cond(def.done) }));
  }

  /** Next hint for the first open objective; each call escalates one tier. */
  hint(peek = false): string {
    const open = this.objectives().find((o) => !o.done);
    if (!open) return 'Nothing pressing. Maybe I should keep moving.';
    const tier = this.state.hintTier[open.def.id] ?? 0;
    const text = open.def.hints[Math.min(tier, open.def.hints.length - 1)];
    if (!peek) this.state.hintTier[open.def.id] = Math.min(tier + 1, open.def.hints.length - 1);
    return text;
  }

  // ------------------------------------------------------------------- actions ----
  async perform(a: Action): Promise<void> {
    this.busy++;
    this.state.actions++;
    try {
      switch (a.t) {
        case 'look': await this.runTop(this.lookScript(a.target)); break;
        case 'use': await this.use(a.target); break;
        case 'item': await this.runTop(this.itemScript(a.item, a.target)); break;
        case 'combine': await this.runTop(this.combineScript(a.a, a.b)); break;
        case 'examine': await this.examine(a.item); break;
        case 'travel': await this.travel(a.loc); break;
        case 'deduce': await this.deduce(a.a, a.b); break;
        case 'timeline': await this.timeline(a.id, a.order); break;
      }
      await this.runWatchers();
    } finally {
      this.busy--;
      this.p.refresh();
    }
  }

  private defaultLine(kind: keyof Content['defaults']): string {
    const list = this.content.defaults[kind];
    return list[Math.floor(rand(this.state) * list.length) % list.length];
  }

  lookScript(t: Target): Script {
    if (t.kind === 'hs') {
      const h = this.room().hotspots[t.id];
      if (!h || !this.cond(h.when)) return []; // hidden hotspots can't be clicked
      return h.look ?? [this.defaultLine('look')];
    }
    const n = this.npcsHere().find((x) => x.id === t.id);
    if (!n) return [];
    return n.placement?.look ?? n.def.look ?? [this.defaultLine('look')];
  }

  private async use(t: Target) {
    if (t.kind === 'npc') {
      const n = this.npcsHere().find((x) => x.id === t.id);
      if (!n) return;
      return this.runTop(n.placement?.talk ?? n.def.talk ?? [this.defaultLine('talk')]);
    }
    const h = this.room().hotspots[t.id];
    if (!h || !this.cond(h.when)) return;
    if (h.exit) {
      if (!this.cond(h.exit.when)) return this.runTop(h.exit.blocked ?? ["It won't open."]);
      if (h.exit.map) {
        // the browser opens the city map; the simulator uses travel actions instead
        return;
      }
      return this.runTop([{ goto: h.exit.to, at: h.exit.at }]);
    }
    return this.runTop(h.use ?? [this.defaultLine('use')]);
  }

  itemScript(item: string, t: Target): Script {
    if (!this.state.inv.includes(item)) return [];
    if (t.kind === 'hs') {
      const h = this.room().hotspots[t.id];
      if (!h || !this.cond(h.when)) return [];
      return h.items?.[item] ?? h.anyItem ?? [this.defaultLine('item')];
    }
    const n = this.npcsHere().find((x) => x.id === t.id);
    if (!n) return [];
    return n.placement?.items?.[item] ?? n.def.items?.[item] ?? n.placement?.anyItem ?? n.def.anyItem ??
      [this.defaultLine('item')];
  }

  combineScript(a: string, b: string): Script {
    if (a === b || !this.state.inv.includes(a) || !this.state.inv.includes(b)) return [];
    const ia = this.content.items[a];
    const ib = this.content.items[b];
    return ia?.combine?.[b] ?? ib?.combine?.[a] ?? [this.defaultLine('combine')];
  }

  async examine(item: string) {
    const def = this.content.items[item];
    if (!def || !this.state.inv.includes(item)) return;
    await this.runTop(def.look);
    if (def.doc) await this.runTop([{ doc: def.doc }]);
  }

  /** The city map can only be opened from a room with an open way out to the street. */
  canTravel(): boolean {
    return this.hotspots().some(([, h]) => h.exit?.map && this.cond(h.exit.when)) && this.locations().length > 0;
  }

  async travel(loc: string) {
    const l = this.content.locations[loc];
    if (!l || !this.canTravel() || !this.locations().includes(l)) return;
    const { room, at } = this.locationRoom(l);
    if (room === this.state.room) return;
    await this.runTop([{ goto: room, at: at ?? 'from_map' }]);
  }

  findDeduction(a: string, b: string) {
    return Object.values(this.content.deductions).find(
      (d) => ((d.a.includes(a) && d.b.includes(b)) || (d.a.includes(b) && d.b.includes(a))) && this.cond(d.when),
    );
  }

  async deduce(a: string, b: string) {
    if (!this.state.clues.includes(a) || !this.state.clues.includes(b) || a === b) return;
    const d = this.findDeduction(a, b);
    if (!d) {
      this.p.sfx('error');
      await this.runTop([this.defaultLine('combine').replace('those', 'those two')]);
      return;
    }
    if (this.state.deds.includes(d.id)) {
      await this.runTop(["I've already worked that one out."]);
      return;
    }
    this.state.deds.push(d.id);
    this.p.notify('deduction', d.id);
    this.p.sfx('deduction');
    await this.runTop(d.then ?? []);
  }

  async timeline(id: string, order: string[]) {
    const def = this.content.timelines[id];
    if (!def || !this.cond(def.when)) return;
    const key = 'tl_' + id;
    if (this.state.flags[key]) {
      await this.runTop(['The timeline is already settled.']);
      return;
    }
    const right = def.order.filter((c, i) => order[i] === c).length;
    if (right === def.order.length && order.length === def.order.length) {
      this.state.flags[key] = true;
      this.p.sfx('deduction');
      await this.runTop(def.solved);
    } else {
      this.p.sfx('error');
      await this.runTop([`That doesn't hold together. ${right} of ${def.order.length} events sit right.`]);
    }
  }

  checkCode(id: string, code: string): boolean {
    return this.content.closeups[id]?.solution === code;
  }

  /** Fire one-shot watcher scripts whose conditions have become true. */
  async runWatchers() {
    for (let round = 0; round < 6; round++) {
      let fired = false;
      for (const w of this.content.watch ?? []) {
        const key = 'watch:' + w.id;
        if (this.state.seen.includes(key) || !this.cond(w.when)) continue;
        this.state.seen.push(key);
        fired = true;
        await this.runTop(w.do);
      }
      if (!fired) return;
    }
  }

  /** Called by closeup UIs (or the simulator) with a code. Returns true when solved. */
  async trySolve(id: string, code: string, quiet = false): Promise<boolean> {
    const def = this.content.closeups[id];
    if (!def) return false;
    const key = 'cu_' + id;
    if (this.state.flags[key]) return true;
    if (code === def.solution) {
      this.state.flags[key] = true;
      this.busy++;
      try {
        await this.runTop(def.solved);
        await this.runWatchers();
      } finally {
        this.busy--;
        this.p.refresh();
      }
      return true;
    }
    this.p.sfx('error');
    if (def.wrong && !quiet) await this.runTop(def.wrong);
    return false;
  }

  // ------------------------------------------------------------------- scripts ----
  async start() {
    this.busy++;
    try {
      await this.runTop(this.content.start);
    } finally {
      this.busy--;
      this.p.refresh();
    }
  }

  async runTop(script: Script) {
    try {
      await this.run(script);
    } catch (e) {
      if (!(e instanceof StopSignal)) throw e;
    }
  }

  async run(script: Script | undefined): Promise<void> {
    if (!script) return;
    for (const step of script) await this.step(step);
  }

  private err(msg: string) {
    this.errors.push(msg);
  }

  private async step(st: Step): Promise<void> {
    const s = this.state;
    if (typeof st === 'string') return this.p.say('rook', st);
    if ('say' in st) return this.p.say(st.who ?? 'rook', st.say);
    if ('narrate' in st) return this.p.narrate(st.narrate);
    if ('set' in st) {
      if (typeof st.set === 'string') s.flags[st.set] = true;
      else Object.assign(s.flags, st.set);
      this.p.refresh();
      return;
    }
    if ('unset' in st) {
      delete s.flags[st.unset];
      this.p.refresh();
      return;
    }
    if ('inc' in st) {
      s.flags[st.inc] = (Number(s.flags[st.inc]) || 0) + (st.by ?? 1);
      return;
    }
    if ('give' in st) {
      if (!this.content.items[st.give]) this.err(`give: unknown item ${st.give}`);
      if (addUnique(s.inv, st.give)) {
        s.stash = s.stash.filter((i) => i !== st.give);
        if (!st.silent) {
          this.p.sfx('pickup');
          this.p.notify('item', st.give);
        }
      }
      this.p.refresh();
      return;
    }
    if ('take' in st) {
      s.inv = s.inv.filter((i) => i !== st.take);
      s.stash = s.stash.filter((i) => i !== st.take);
      this.p.refresh();
      return;
    }
    if ('clue' in st) {
      if (!this.content.clues[st.clue]) this.err(`clue: unknown ${st.clue}`);
      if (addUnique(s.clues, st.clue) && !st.silent) {
        this.p.sfx('pencil');
        this.p.notify('clue', st.clue);
      }
      return;
    }
    if ('person' in st) {
      if (!this.content.people[st.person]) this.err(`person: unknown ${st.person}`);
      if (addUnique(s.people, st.person)) this.p.notify('person', st.person);
      return;
    }
    if ('unlock' in st) {
      if (!this.content.locations[st.unlock]) this.err(`unlock: unknown location ${st.unlock}`);
      if (addUnique(s.map, st.unlock) && !st.silent) this.p.notify('unlock', st.unlock);
      return;
    }
    if ('sfx' in st) return this.p.sfx(st.sfx);
    if ('music' in st) return this.p.music(st.music);
    if ('amb' in st) return this.p.amb(st.amb);
    if ('walk' in st) return this.p.walk(st.who ?? 'rook', st.walk);
    if ('face' in st && !('npc' in st)) return this.p.face(st.who ?? 'rook', st.face);
    if ('anim' in st) return this.p.anim(st.who ?? 'rook', st.anim);
    if ('goto' in st) {
      if (!this.content.rooms[st.goto]) {
        this.err(`goto: unknown room ${st.goto}`);
        return;
      }
      s.room = st.goto;
      addUnique(s.visited, st.goto);
      await this.p.changeRoom(st.goto, st.at);
      await this.run(this.content.rooms[st.goto].enter);
      return;
    }
    if ('dialog' in st) return this.dialog(st.dialog, st.node);
    if ('if' in st) return this.run(this.cond(st.if) ? st.then : st.else);
    if ('pick' in st) {
      const b = st.pick.find((x) => this.cond(x.when));
      return this.run(b?.do);
    }
    if ('once' in st) {
      const key = 'once:' + st.once;
      if (s.seen.includes(key)) return this.run(st.else);
      s.seen.push(key);
      return this.run(st.do);
    }
    if ('wait' in st) return this.p.wait(st.wait);
    if ('fade' in st) return this.p.fade(st.fade, st.ms ?? 600);
    if ('card' in st) return this.p.card(st.card, st.sub);
    if ('chapter' in st) {
      // a new chapter starts with clean staging: every NPC back to its default placements
      if (s.chapter !== st.chapter) s.npcs = {};
      s.chapter = st.chapter;
      return;
    }
    if ('doc' in st) {
      if (!this.content.docs[st.doc]) this.err(`doc: unknown ${st.doc}`);
      addUnique(s.read, st.doc);
      return this.p.doc(st.doc);
    }
    if ('closeup' in st) {
      const def = this.content.closeups[st.closeup];
      if (!def) return this.err(`closeup: unknown ${st.closeup}`);
      if (s.flags['cu_' + def.id]) return;
      return this.p.closeup(def);
    }
    if ('autosave' in st) return this.p.autosave(st.autosave);
    if ('npc' in st) {
      if (!this.content.npcs[st.npc]) this.err(`npc: unknown ${st.npc}`);
      // staging override; `hide` (or no room) releases the NPC back to its conditional default placements
      if (!st.hide && st.room && st.at) s.npcs[st.npc] = { room: st.room, at: st.at, face: st.face };
      else delete s.npcs[st.npc];
      this.p.refresh();
      return;
    }
    if ('shake' in st) return this.p.effect('shake', st.shake);
    if ('flash' in st) return this.p.effect('flash', st.flash);
    if ('blur' in st) return this.p.effect('blur', st.blur);
    if ('end' in st) {
      s.ended = true;
      return this.p.end();
    }
    if ('stop' in st) throw new StopSignal();
    if ('random' in st) {
      const i = Math.floor(rand(s) * st.random.length) % st.random.length;
      return this.run(st.random[i]);
    }
    if ('hint' in st) return;
    if ('stash' in st) {
      const list = st.stash === 'all' ? [...s.inv] : st.stash;
      for (const it of list) {
        if (s.inv.includes(it)) {
          s.inv = s.inv.filter((x) => x !== it);
          addUnique(s.stash, it);
        }
      }
      this.p.notify('lost', list.join(','));
      this.p.refresh();
      return;
    }
    if ('unstash' in st) {
      for (const it of s.stash) addUnique(s.inv, it);
      s.stash = [];
      this.p.sfx('pickup');
      this.p.refresh();
      return;
    }
    this.err('unknown step ' + JSON.stringify(st));
  }

  // ------------------------------------------------------------------- dialog ----
  optionKey(d: DialogDef, o: OptionDef) {
    return `${d.id}.${o.id}`;
  }

  availableOptions(d: DialogDef, node: string): OptionDef[] {
    const n = d.nodes[node];
    if (!n) return [];
    return n.options.filter((o) => this.cond(o.when) && !(o.once && this.state.seen.includes(this.optionKey(d, o))));
  }

  private async dialog(id: string, startNode?: string) {
    const d = this.content.dialogs[id];
    if (!d) return this.err(`dialog: unknown ${id}`);
    let node = startNode ?? d.start ?? 'root';
    let entering = true;
    this.dialogDepth++;
    try {
      for (let guard = 0; guard < 200; guard++) {
        const n = d.nodes[node];
        if (!n) {
          this.err(`dialog ${id}: missing node ${node}`);
          break;
        }
        if (entering && n.lines) await this.run(n.lines);
        const opts = this.availableOptions(d, node);
        if (opts.length === 0) break;
        const choice = await this.p.choose(opts, d);
        if (!choice || !opts.includes(choice)) break;
        addUnique(this.state.seen, this.optionKey(d, choice));
        try {
          if (choice.say !== false) await this.p.say('rook', choice.say ?? choice.text);
          if (choice.present) {
            const item = await this.p.present(choice.text);
            if (item !== null) {
              const sc = choice.present[item] ?? choice.present.default;
              await this.run(sc ?? ["Never mind."]);
            }
          }
          await this.run(choice.do);
        } catch (e) {
          if (e instanceof StopSignal) break;
          throw e;
        }
        if (choice.next === 'exit') break;
        if (choice.next) {
          node = choice.next;
          entering = true;
        } else entering = false;
        if (guard === 199) this.err(`dialog ${id}: 200 choices without leaving (no way out of node ${node}?)`);
      }
    } finally {
      this.dialogDepth--;
    }
  }

  get inDialog() {
    return this.dialogDepth > 0;
  }
}

export type { CloseupDef };
