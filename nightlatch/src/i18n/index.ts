// Language support. English is the source text; German comes from de.json (all content
// strings) and ui.ts (interface). Every BitmapText passes through t() (see main.ts), so any
// string shown on screen is translated; composite strings use templates via f().
import DE_CONTENT from './de.json';
import { UI_DE } from './ui';

export type Lang = 'en' | 'de';
let lang: Lang = 'en';
const DE: Record<string, string> = { ...(DE_CONTENT as Record<string, string>), ...UI_DE };
let upper: Map<string, string> | null = null;

export function setLang(l: Lang) {
  lang = l;
}
export function getLang(): Lang {
  return lang;
}

/** English lines the engine builds at run time, with their German templates. */
const DYNAMIC: [RegExp, string][] = [
  [/^That doesn't hold together\. (\d+) of (\d+) events sit right\.$/, "That doesn't hold together. {0} of {1} events sit right."],
];

/** Translate one string (unknown strings pass through unchanged). */
export function t(s: string): string {
  if (lang === 'en' || !s) return s;
  const d = DE[s];
  if (d !== undefined) return d;
  for (const [re, tpl] of DYNAMIC) {
    const m = re.exec(s);
    if (m) return f(tpl, ...m.slice(1).map(t));
  }
  if (s.includes('\n')) return s.split('\n').map(t).join('\n');
  // headings shown in capitals: "CHAPTER ONE\nRoom Nine" cards are handled by their own keys
  if (!/[a-z]/.test(s) && /[A-Z]{2}/.test(s)) {
    if (!upper) {
      upper = new Map();
      for (const [k, v] of Object.entries(DE)) upper.set(k.toUpperCase(), v.toUpperCase());
    }
    return upper.get(s) ?? s;
  }
  return s;
}

/** Translate a template and fill {0}, {1}… with already-translated arguments. */
export function f(template: string, ...args: (string | number)[]): string {
  return t(template).replace(/\{(\d)\}/g, (_, i) => String(args[Number(i)] ?? ''));
}
