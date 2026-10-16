// Small helpers that keep content files readable.
import type { Script, Step } from '../engine/types';

/** Line spoken by an NPC. */
export const S = (who: string, text: string): Step => ({ say: text, who });
/** Narration caption (Rook's voice-over). */
export const N = (text: string): Step => ({ narrate: text });
/** Conditional branches, first match wins. */
export const pick = (...branches: { when?: string; do: Script }[]): Step => ({ pick: branches });
export const when = (c: string, ...steps: Step[]) => ({ when: c, do: steps });
export const otherwise = (...steps: Step[]) => ({ do: steps });
export const once = (key: string, d: Script, e?: Script): Step => ({ once: key, do: d, else: e });
export const iff = (c: string, then: Script, els?: Script): Step => ({ if: c, then, else: els });
export const anim = (name: string, who = 'rook'): Step => ({ anim: name, who });
export const walk = (to: string | [number, number], who = 'rook'): Step => ({ walk: to, who });
export const face = (dir: 'up' | 'down' | 'left' | 'right', who = 'rook'): Step => ({ face: dir, who });
export const sfx = (id: string): Step => ({ sfx: id });
export const set = (f: string): Step => ({ set: f });
export const give = (item: string): Step => ({ give: item });
export const take = (item: string): Step => ({ take: item });
export const clue = (id: string): Step => ({ clue: id });
export const wait = (ms: number): Step => ({ wait: ms });

/** Pick up: crouch animation + sound + item. */
export const pickup = (item: string, line?: string): Step[] => [anim('pickup'), give(item), ...(line ? [line] : [])];
