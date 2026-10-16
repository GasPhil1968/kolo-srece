// Condition expressions.
//
//   expr   := or
//   or     := and ('|' and)*
//   and    := unary ('&' unary)*
//   unary  := '!' unary | '(' expr ')' | term
//   term   := has:ITEM | clue:ID | ded:ID | seen:KEY | visited:ROOM | read:DOC | map:LOC
//           | person:ID | room:ROOM | chapter OP N | FLAG | FLAG OP VALUE | true | false
//   OP     := = | != | >= | <= | > | <
import type { GameState, } from './state';

export type CondFn = (s: GameState) => boolean;

const cache = new Map<string, CondFn>();

export function evalCond(expr: string | undefined, s: GameState): boolean {
  if (expr === undefined || expr === '') return true;
  return compile(expr)(s);
}

export function compile(expr: string): CondFn {
  let fn = cache.get(expr);
  if (!fn) {
    fn = new Parser(expr).parse();
    cache.set(expr, fn);
  }
  return fn;
}

/** Collect every atomic term in an expression (used by validators). */
export function terms(expr: string): string[] {
  return expr
    .replace(/[()!&|]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

class Parser {
  private i = 0;
  constructor(private src: string) {}

  parse(): CondFn {
    const fn = this.or();
    this.ws();
    if (this.i < this.src.length) throw new Error(`cond: unexpected '${this.src.slice(this.i)}' in "${this.src}"`);
    return fn;
  }

  private ws() {
    while (this.i < this.src.length && /\s/.test(this.src[this.i])) this.i++;
  }

  private or(): CondFn {
    const parts = [this.and()];
    for (;;) {
      this.ws();
      if (this.src[this.i] === '|') {
        this.i++;
        parts.push(this.and());
      } else break;
    }
    return parts.length === 1 ? parts[0] : (s) => parts.some((p) => p(s));
  }

  private and(): CondFn {
    const parts = [this.unary()];
    for (;;) {
      this.ws();
      if (this.src[this.i] === '&') {
        this.i++;
        parts.push(this.unary());
      } else break;
    }
    return parts.length === 1 ? parts[0] : (s) => parts.every((p) => p(s));
  }

  private unary(): CondFn {
    this.ws();
    const c = this.src[this.i];
    if (c === '!') {
      this.i++;
      const inner = this.unary();
      return (s) => !inner(s);
    }
    if (c === '(') {
      this.i++;
      const inner = this.or();
      this.ws();
      if (this.src[this.i] !== ')') throw new Error(`cond: missing ) in "${this.src}"`);
      this.i++;
      return inner;
    }
    return this.term();
  }

  private term(): CondFn {
    this.ws();
    const m = /^([A-Za-z_][\w.]*)(?::([\w.]+))?\s*(?:(!=|>=|<=|=|>|<)\s*([\w.-]+))?/.exec(this.src.slice(this.i));
    if (!m) throw new Error(`cond: bad term at '${this.src.slice(this.i)}' in "${this.src}"`);
    this.i += m[0].length;
    const [, head, arg, op, rhs] = m;
    if (arg !== undefined) {
      switch (head) {
        case 'has': return (s) => s.inv.includes(arg);
        case 'clue': return (s) => s.clues.includes(arg);
        case 'ded': return (s) => s.deds.includes(arg);
        case 'seen': return (s) => s.seen.includes(arg);
        case 'visited': return (s) => s.visited.includes(arg);
        case 'read': return (s) => s.read.includes(arg);
        case 'map': return (s) => s.map.includes(arg);
        case 'person': return (s) => s.people.includes(arg);
        case 'room': return (s) => s.room === arg;
        default: throw new Error(`cond: unknown prefix ${head}: in "${this.src}"`);
      }
    }
    if (head === 'true') return () => true;
    if (head === 'false') return () => false;
    const get = head === 'chapter' ? (s: GameState) => s.chapter : (s: GameState) => s.flags[head];
    if (!op) return (s) => truthy(get(s));
    const num = Number(rhs);
    const isNum = rhs !== undefined && rhs !== '' && !Number.isNaN(num);
    switch (op) {
      case '=': return (s) => eq(get(s), rhs!, isNum, num);
      case '!=': return (s) => !eq(get(s), rhs!, isNum, num);
      case '>=': return (s) => toNum(get(s)) >= num;
      case '<=': return (s) => toNum(get(s)) <= num;
      case '>': return (s) => toNum(get(s)) > num;
      case '<': return (s) => toNum(get(s)) < num;
    }
    throw new Error('cond: unreachable');
  }
}

function truthy(v: unknown): boolean {
  return v !== undefined && v !== false && v !== 0 && v !== '' && v !== null;
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function eq(v: unknown, rhs: string, isNum: boolean, num: number): boolean {
  if (rhs === 'true') return v === true;
  if (rhs === 'false') return !truthy(v);
  if (isNum) return toNum(v) === num;
  return String(v ?? '') === rhs;
}
