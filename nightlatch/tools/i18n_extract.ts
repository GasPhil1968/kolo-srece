// Collect every player-visible English string in the content (for translation).
//   npx tsx tools/i18n_extract.ts  -> src/i18n/strings.json (sorted, unique)
import { writeFileSync } from 'node:fs';
import { CONTENT } from '../src/content';

const SKIP = new Set(['id', 'when', 'done', 'if', 'set', 'unset', 'inc', 'give', 'take', 'clue', 'person', 'unlock', 'sfx', 'music',
  'amb', 'walk', 'face', 'anim', 'goto', 'at', 'dialog', 'node', 'once', 'closeup', 'npc', 'room', 'sprite', 'color', 'portrait',
  'next', 'kind', 'solution', 'style', 'image', 'file', 'who', 'mood', 'knownWhen', 'complete', 'to', 'pose', 'variant',
  'stash', 'jacks', 'verbKey', 'flash']);
// player-visible fields: a one-word lower-case name like 'bed' is text there, not a condition
const TEXT_KEYS = new Set(['name', 'title', 'verb', 'label', 'text', 'sub', 'card']);
const out = new Set<string>();
const isCond = (s: string) => /^[!( ]*[a-z_][\w.:]*([ ]*[=<>!]+[ ]*[\w.-]+)?([ ]*[&|][ ]*[!( ]*[a-z_][\w.:]*([ ]*[=<>!]+[ ]*[\w.-]+)?[ )]*)*[ )]*$/.test(s);
function walk(x: unknown, key: string) {
  if (typeof x === 'string') {
    if (SKIP.has(key)) return;
    if (key === 'doc' && !/\s/.test(x)) return;
    if (isCond(x) && !/[A-Z]/.test(x) && !TEXT_KEYS.has(key)) return;
    if (!/[A-Za-z]/.test(x)) return;
    out.add(x);
  } else if (Array.isArray(x)) {
    // [cond, value] pairs (music, variants, notes, playerSprite) — first element is a condition
    if (x.length === 2 && typeof x[0] === 'string' && typeof x[1] === 'string' && isCond(x[0])) {
      if (key === 'notes') out.add(x[1]);
      return;
    }
    x.forEach((v) => walk(v, key === 'objects' ? 'when' : key));
  } else if (x && typeof x === 'object') {
    for (const [k, v] of Object.entries(x)) {
      if (k === 'objects' || k === 'music' || k === 'amb' || k === 'variant' || k === 'playerSprite' || k === 'blocks') continue;
      walk(v, k);
    }
  }
}
walk(CONTENT, '');
const list = [...out].sort();
writeFileSync('src/i18n/strings.json', JSON.stringify(list, null, 1));
console.log(list.length, 'strings', list.reduce((a, s) => a + s.length, 0), 'chars');
