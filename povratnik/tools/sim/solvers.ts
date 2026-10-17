// Goal-directed solvers: from ANY reachable state they choose the next action that progresses the
// chapter. Used for complete walkthroughs and to prove that random play never leads into a softlock.
import type { Intent } from '../../src/core/engine';
import { dyn } from '../../src/core/content';
import type { Sim } from './harness';

export type Solver = (sim: Sim) => Intent | null;

/** First exit (hotspot id) in the current room on a shortest route to `target` room. */
export function routeTo(sim: Sim, target: string): string | null {
  const e = sim.engine;
  const start = e.state.room;
  if (start === target) return null;
  const prev = new Map<string, { room: string; via: string }>();
  const queue = [start];
  const seen = new Set([start]);
  while (queue.length) {
    const r = queue.shift()!;
    const def = e.roomDef(r);
    if (!def) continue;
    for (const h of def.hotspots) {
      if (h.visible && !h.visible(e.state)) continue;
      const ex = h.exit ? dyn(h.exit, e.state) : null;
      if (!ex || seen.has(ex.room)) continue;
      if (r === start && h.exitBlocked?.(e.state)) continue;
      seen.add(ex.room);
      prev.set(ex.room, { room: r, via: h.id });
      if (ex.room === target) {
        let cur = target;
        let via = h.id;
        while (prev.get(cur)!.room !== start) {
          cur = prev.get(cur)!.room;
          via = prev.get(cur)!.via;
        }
        return via;
      }
      queue.push(ex.room);
    }
  }
  return null;
}

export const act = (target: string, verb: string): Intent => ({ k: 'act', target, verb });
export const use = (item: string, target: string): Intent => ({ k: 'useItem', item, target });
export const choose = (id: string): Intent => ({ k: 'choose', id });

/** Go to a room (returns the exit action) or null if already there. */
export function go(sim: Sim, room: string): Intent | null {
  if (sim.engine.state.room === room) return null;
  const via = routeTo(sim, room);
  if (!via) throw new Error(`no route from ${sim.engine.state.room} to ${room}`);
  return act(via, 'go');
}

/** Pick a preferred dialogue option if present, else leave. */
export function pickOption(sim: Sim, prefs: string[]): Intent {
  const opts = sim.options();
  for (const p of prefs) if (opts.includes(p)) return choose(p);
  return choose(opts.includes('__bye') ? '__bye' : opts[opts.length - 1]);
}

// ----------------------------------------------------------------------------------- chapter 1

export const solveSarajevo: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`sa.${n}`];
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    if (opts.includes('tell')) return choose('tell');
    if (opts.includes('calm')) return choose(opts.includes('rose') ? 'rose' : 'calm'); // report
    // Halil's dialogue: ask about the crater once it has been seen; otherwise leave.
    return pickOption(sim, fl('halilRose') ? [] : ['rose']);
  }
  if (!fl('band')) return go(sim, 'sa_zimmer') ?? use('band', 'couchtisch');
  if (!fl('task')) return go(sim, 'sa_zimmer') ?? act('actor:mijo96', 'talk');
  if (!s.inventory.includes('dzezva') && !fl('poured')) return go(sim, 'sa_zimmer') ?? act('dzezva', 'take');
  if (!fl('sawRose')) return go(sim, 'sa_gasse') ?? act('rose', 'look');
  if (!fl('repaired')) return go(sim, 'sa_sebilj') ?? use('dzezva', 'actor:halil');
  if (!fl('halilRose')) return go(sim, 'sa_sebilj') ?? act('actor:halil', 'talk');
  if (!fl('full')) return go(sim, 'sa_kafana') ?? use('dzezva', 'actor:nedzad');
  if (!fl('poured')) return go(sim, 'sa_zimmer') ?? use('dzezva', 'tasseMijo');
  if (!fl('reported')) return go(sim, 'sa_zimmer') ?? act('actor:mijo96', 'talk');
  return null;
};

// ----------------------------------------------------------------------------------- chapter 2

export const solveWeide: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`we.${n}`];
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    for (const want of ['rag', 'cloth', 'listen', 'still']) if (opts.includes(want)) return choose(want);
    if (opts.includes('later')) return choose('later');
    return pickOption(sim, []);
  }
  if (s.room === 'we_kuca') return fl('ate') ? act('bank', 'lie') : act('tisch', 'eat');
  if (!fl('counted')) return go(sim, 'we_weide') ?? act('herde', 'look');
  if (!fl('trail')) return go(sim, 'we_weide') ?? act('wacholder', 'look');
  if (!fl('found')) return go(sim, 'we_weide') ?? act('mauer', 'look');
  if (!fl('goatBack') && !s.inventory.includes('wacholder')) return go(sim, 'we_weide') ?? act('wacholder', 'take');
  if (!fl('goatBack')) return go(sim, 'we_weide') ?? use('wacholder', 'mauerEnde');
  if (!fl('lesson')) {
    if (!fl('sitting')) return go(sim, 'we_weide') ?? act('stein', 'climb');
    if (s.room === 'we_weide') return act('strasse', 'go');
    if (!fl('obsMiddle') || !fl('obsQuiet') || (!fl('q1') && fl('obsMiddle'))) return act('reiter1', 'look');
    if (!fl('obsBales')) return act('ballen0', 'look');
    if (!fl('obsMule')) return act('maultier', 'look');
    return act('reiter1', 'look');
  }
  if (s.room === 'we_tal') return act('zurueck', 'go');
  return act('pfad', 'go');
};

// ----------------------------------------------------------------------------------- chapter 3

export const solveDorf: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`do.${n}`];
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    for (const want of ['larger', 'silent']) if (opts.includes(want)) return choose(want);
    if (opts.includes('holz') && !fl('ivanAsked')) return choose('holz');
    if (opts.includes('give') && fl('ivanAsked')) return choose('give');
    return pickOption(sim, []);
  }
  if (s.room === 'do_abend') {
    if (!fl('taken')) return act('bank', 'take');
    if (!fl('ivanAsked')) return act('actor:ivan73', 'talk');
    if (!fl('given')) return use('kerbhoelzer', 'actor:otac73');
    return act('platz', 'go');
  }
  if (!fl('sawLuka') || !fl('sawStjepan')) return act('stall', 'watch');
  if (!fl('sawKatib')) return act('actor:katib73', 'look');
  if (!fl('rule')) return { k: 'examine', item: 'kerbholz' };
  return act('stall', 'watch');
};

// ----------------------------------------------------------------------------------- chapter 4

export const solvePovratnik: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`po.${n}`];
  const has = (i: string) => s.inventory.includes(i);
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    for (const want of ['up', 'hide']) if (opts.includes(want)) return choose(want);
    return pickOption(sim, []);
  }
  if (s.room === 'po_senke') return fl('ivoGone') ? act('waffen', 'use') : act('actor:ivo76', 'talk');
  if (s.room === 'po_bilder') return act('ich', 'stand');
  if (s.room === 'po_weg') {
    if (!fl('drank')) return act('quelle', 'drink');
    if (!has('krug') && !has('krug_schlinge')) return act('kapelle', 'take');
    if (has('krug') && !fl('full')) return use('krug', 'quelle');
    if (!has('krug_schlinge') && !has('streifen')) return act('self', 'tear');
    if (has('krug') && has('streifen')) return use('krug', 'item:streifen');
    return act('pfad', 'go');
  }
  if (!fl('stipanFled')) return fl('stipanCame') ? act('actor:stipan76', 'greet') : { k: 'walk', x: 520, y: 436 };
  return act('tuer', 'knock');
};

export const solveElftage: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`et.${n}`];
  const num = (n: string) => (typeof s.flags[`et.${n}`] === 'number' ? (s.flags[`et.${n}`] as number) : 0);
  const has = (i: string) => s.inventory.includes(i);
  const ph = typeof s.flags['et.phase'] === 'string' ? (s.flags['et.phase'] as string) : 'pre';
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    for (const want of ['wait', 'pray']) if (opts.includes(want)) return choose(want);
    return pickOption(sim, []);
  }
  switch (ph) {
    case 'pre':
      return go(sim, 'et_hof') ?? act('stall', 'go');
    case 'n1':
      return fl('goats') ? act('bretter', 'look') : act('actor:et_ziegen', 'look');
    case 'm3': {
      if (!fl('eaten')) {
        if (s.room !== 'et_hof') return go(sim, 'et_hof');
        return fl('clothSeen') ? act('essen', 'take') : act('essen', 'look');
      }
      if (!fl('klotzTaken')) return go(sim, 'et_hof') ?? act('klotz', 'take');
      if (s.room !== 'et_stall') return go(sim, 'et_stall');
      const r = num('rack');
      if (!fl('brettTaken')) return act('brett', 'take');
      if (!fl('seilTaken')) return act('seil', 'take');
      if (fl('cut') && !fl('handOpenSeen')) return act('self', 'look');
      if (r === 0) return use('klotz', 'raufe');
      if (r === 1) return use('brett', 'raufe');
      if (r === 2) return use('seil', 'pfosten');
      if (r === 3) return act('stift', 'pull');
      if (r === 4) return act('raufe', 'lower');
      if (r === 5) return use('klotz', 'raufe');
      return null;
    }
    case 'e3':
      return go(sim, 'et_stall') ?? act('self', 'look');
    case 'p6':
      return act('platz', 'sit');
    case 'd6': {
      if (!has('sense')) return go(sim, 'et_stall') ?? act('sense', 'take');
      if (s.room !== 'et_feld') return go(sim, 'et_feld');
      if (fl('uncleGone')) return act('feld', 'look');
      if (!fl('stoneDown')) return use('sense', 'actor:et_onkel');
      if (!fl('sharp')) return has('wetzstein') ? use('wetzstein', 'item:sense') : act('stein', 'take');
      return use('sense', 'feld');
    }
    case 'e6':
      return go(sim, 'et_kirche') ?? act('stufen', 'sit');
    default: {
      if (fl('carrying')) {
        if (s.room === 'et_innen') return act('hinaus', 'go');
        return go(sim, 'et_kirche') ?? act('stufen', 'lay');
      }
      if (s.room === 'et_innen') {
        if (!fl('beamPushed') || (!fl('clothOn') && has('tuch_nass')) || fl('clothOn')) {
          if (!fl('crawling')) return act('weg', 'crawl');
          if (!fl('beamPushed')) return act('balken', 'push');
          if (!fl('clothOn')) return use('tuch_nass', 'actor:et_junge');
          return act('actor:et_junge', 'take');
        }
        return act('hinaus', 'go');
      }
      if (s.room === 'et_gasse') return has('tuch') ? use('tuch', 'eimer') : act('tuer', 'go');
      return go(sim, 'et_gasse');
    }
  }
};

export const solveZaesur: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`za.${n}`];
  const has = (i: string) => s.inventory.includes(i);
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    return choose(opts.includes('boy') ? 'boy' : opts[opts.length - 1]);
  }
  if (!fl('refilled')) return has('za_tasse') ? use('za_tasse', 'actor:mijo96z') : act('tasseMac', 'take');
  if (!fl('pageRead')) {
    if (!fl('lamp')) return act('lampe', 'use');
    if (fl('bandDesk')) return act('lupe', 'use');
    return has('za_band') ? use('za_band', 'lampe') : act('band', 'take');
  }
  return act('actor:mijo96z', 'talk');
};

export const solveAncona: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`an.${n}`];
  const has = (i: string) => s.inventory.includes(i);
  if (e.inputMode() === 'combat' && e.combat) return { k: 'combat', action: e.combat.current.answer };
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    for (const p of ['true', 'meister', 'woher', 'geld', 'strike']) if (opts.includes(p)) return choose(p);
    return choose(opts[opts.length - 1]);
  }
  if (s.room === 'an_gasse') return fl('gassenTor') ? act('zurueck', 'go') : fl('spuren') ? act('tuer5', 'go') : act('spuren', 'look');
  if (s.room === 'an_hafen' && !fl('gassenTor')) return act('gasse', 'go');
  if (s.room === 'an_hafen') return act('tor6', 'go');
  if (!fl('risen')) return null;
  if (!fl('read')) return act('klinge', 'read');
  if (!fl('planksMoved')) return act('haufen', 'take');
  if (!fl('rigged')) {
    if (has('an_tau_haken')) return use('an_tau_haken', 'rolle');
    if (has('an_tau') && has('an_haken')) return use('an_tau', 'item:an_haken');
    return has('an_tau') ? act('haken', 'take') : act('tau', 'take');
  }
  if (!fl('hooked')) return act('balken', 'use');
  if (!fl('beamUp')) return has('an_salzsack') ? use('an_salzsack', 'rolle') : act('salzsack', 'take');
  return act('tor', 'go');
};

export const solveHerberge: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`hg.${n}`];
  if (e.inputMode() === 'combat' && e.combat) return { k: 'combat', action: e.combat.current.answer };
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    return choose(opts.includes('warum') ? 'warum' : opts[0]);
  }
  if (s.room === 'hg_stube') {
    if (!fl('eaten')) return act('teller', 'use');
    if (!fl('sahFuhrleute')) return act('fuhrleute', 'look');
    if (!fl('sahNass')) return act('nass', 'look');
    return act('tuer', 'go');
  }
  if (!fl('risen')) return null;
  return act('tor', 'go');
};

export const solveKolonne: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`ko.${n}`];
  const inv = (i: string) => s.inventory.includes(i);
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    for (const id of ['give', 'pole', 'onkel', 'inhalt', 'folge', 'leer', 'kraehen', 'rauch']) if (opts.includes(id)) return choose(id);
    if (opts.includes('ask') && !fl('fmGrund')) return choose('ask');
    if (opts.includes('schein') && fl('fmGrund') && !inv('schein') && !fl('unloaded')) return choose('schein');
    if (opts.includes('melden') && fl('lifted') && !fl('reported')) return choose('melden');
    return choose(opts.includes('__bye') ? '__bye' : opts[0]);
  }
  if (s.room === 'ko_enge') {
    if (!fl('wound')) return act('self', 'look');
    if (!fl('bloody')) return act('pferd', 'use');
    if (!fl('bandaged')) {
      if (inv('verband_blutig')) return use('verband_blutig', 'self');
      if (inv('verband')) return use('verband', 'pferd');
      return act('tornister', 'take');
    }
    return act('vorn', 'go');
  }
  if (s.room === 'ko_spitze') {
    if (!fl('sahKarren')) return act('karren', 'look');
    if (!fl('unloaded')) {
      if (inv('schein')) return use('schein', 'actor:ko_fuhrmann');
      return act(fl('fmGrund') ? 'actor:ko_hm' : 'actor:ko_fuhrmann', 'talk');
    }
    if (!fl('lifted')) return inv('stange') ? use('stange', 'actor:ko_fuhrmann') : act('stange', 'take');
    if (!fl('sahKraehen')) return act('hang', 'look');
    return act('actor:ko_hm', 'talk');
  }
  if (s.room === 'ko_zelt') {
    if (!fl('asked')) return act('bauer', 'talk');
    if (!fl('stopped')) return act('actor:ko_major', 'talk');
    return act('ausgang', 'go');
  }
  return null;
};

export const solveLager: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`lg.${n}`];
  const inv = (i: string) => s.inventory.includes(i);
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    for (const id of ['vierzehn', 'spalte']) if (opts.includes(id)) return choose(id);
    return choose(opts.includes('__bye') ? '__bye' : opts[0]);
  }
  if (!fl('met')) return go(sim, 'lg_lager') ?? act('actor:lg_zeman', 'talk');
  if (fl('verstanden')) return go(sim, 'lg_lager') ?? act('strasse', 'go');
  if (!fl('mappe')) return go(sim, 'lg_lager') ?? act('mappe', 'take');
  if (!fl('namen')) return { k: 'examine', item: 'liste' };
  if (!fl('weide')) return go(sim, 'lg_stab') ?? act('flurkarte', 'look');
  if (!fl('spalte') && !inv('besitzbogen')) return use('formular', 'item:liste');
  if (!fl('spalte')) return go(sim, 'lg_lager') ?? act('actor:lg_zeman', 'talk');
  if (!fl('register')) return go(sim, 'lg_stab') ?? use('besitzbogen', 'register');
  return go(sim, 'lg_lager') ?? act('actor:lg_zeman', 'talk');
};

export const solveHochzeit: Solver = (sim) => {
  const e = sim.engine;
  const s = e.state;
  const fl = (n: string) => !!s.flags[`hz.${n}`];
  const inv = (i: string) => s.inventory.includes(i);
  if (e.inputMode() === 'choice') {
    const opts = sim.options();
    for (const id of ['habe', 'hochzeit', 'gaeste', 'gruss']) if (opts.includes(id)) return choose(id);
    if (opts.includes('glas') && !fl('glas')) return choose('glas');
    if (opts.includes('keiner') && fl('gaeste') && !fl('plan')) return choose('keiner');
    return choose(opts.includes('__bye') ? '__bye' : opts[0]);
  }
  if (s.room === 'hz_kamm') {
    if (fl('befehl')) return act('weg', 'go');
    if (!fl('met') || (!fl('glas') && fl('hochzeit'))) return act('actor:hz_hm', 'talk');
    if (!fl('hochzeit') || !fl('gaeste')) return act('dorf', 'look');
    if (!inv('feldflasche')) return act('flasche', 'take');
    return act('actor:hz_hm', 'talk');
  }
  if (s.room === 'hz_gasse') {
    if (!fl('gruss')) return use('feldflasche', 'alter');
    return act('ende', 'go');
  }
  return null;
};

export const SOLVERS: Record<string, Solver> = {
  sarajevo: solveSarajevo,
  weide: solveWeide,
  dorf: solveDorf,
  povratnik: solvePovratnik,
  elftage: solveElftage,
  zaesur: solveZaesur,
  ancona: solveAncona,
  herberge: solveHerberge,
  kolonne: solveKolonne,
  lager: solveLager,
  hochzeit: solveHochzeit,
};
