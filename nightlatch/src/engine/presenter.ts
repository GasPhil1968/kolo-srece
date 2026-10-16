import type { CloseupDef, DialogDef, Dir, OptionDef } from './types';

/**
 * Everything the script interpreter needs from the outside world. The Phaser runtime
 * animates and waits; the headless simulator resolves immediately and lets a policy
 * choose dialogue options, evidence and closeup inputs.
 */
export interface Presenter {
  say(who: string, text: string): Promise<void>;
  narrate(text: string): Promise<void>;
  walk(who: string, target: string | [number, number]): Promise<void>;
  face(who: string, dir: Dir): void;
  anim(who: string, name: string): Promise<void>;
  changeRoom(room: string, at?: string): Promise<void>;
  sfx(id: string): void;
  music(id: string | null): void;
  amb(id: string | null): void;
  wait(ms: number): Promise<void>;
  fade(dir: 'out' | 'in', ms: number): Promise<void>;
  card(title: string, sub?: string): Promise<void>;
  doc(id: string): Promise<void>;
  closeup(def: CloseupDef): Promise<void>;
  choose(options: OptionDef[], dialog: DialogDef): Promise<OptionDef>;
  /** Ask the player to pick an inventory item to show; null = cancelled. */
  present(prompt: string): Promise<string | null>;
  notify(kind: 'item' | 'clue' | 'unlock' | 'deduction' | 'person' | 'lost', id: string): void;
  refresh(): void;
  autosave(label: string): void;
  effect(kind: 'shake' | 'flash' | 'blur', value: number | string): void;
  end(): Promise<void>;
}

/** No-op presenter used by tests; a policy hook decides interactive choices. */
export class HeadlessPresenter implements Presenter {
  log: string[] = [];
  logging = false;
  chooser: (options: OptionDef[], dialog: DialogDef) => OptionDef = (o) => o[0];
  presenter: (prompt: string) => string | null = () => null;
  closeupHandler: (def: CloseupDef) => void = () => {};
  roomChanges = 0;
  ended = false;

  private l(s: string) {
    if (this.logging) this.log.push(s);
  }
  async say(who: string, text: string) { this.l(`${who}: ${text}`); }
  async narrate(text: string) { this.l(`~ ${text}`); }
  async walk() {}
  face() {}
  async anim() {}
  async changeRoom(room: string) { this.roomChanges++; this.l(`[room ${room}]`); }
  sfx(_id: string) {}
  music(_id: string | null) {}
  amb(_id: string | null) {}
  async wait() {}
  async fade() {}
  async card(title: string) { this.l(`[card ${title}]`); }
  async doc(id: string) { this.l(`[doc ${id}]`); }
  async closeup(def: CloseupDef) { this.closeupHandler(def); }
  async choose(options: OptionDef[], dialog: DialogDef) { return this.chooser(options, dialog); }
  async present(prompt: string) { return this.presenter(prompt); }
  notify(kind: string, id: string) { this.l(`(+${kind} ${id})`); }
  refresh() {}
  autosave(_label: string) {}
  effect() {}
  async end() { this.ended = true; }
}
