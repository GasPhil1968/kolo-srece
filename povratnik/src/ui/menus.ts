// Title screen, pause menu, save/load, options, chapter selection, journal, hints, help.
import type { Engine } from '../core/engine';
import { UI } from '../content/text/de/ui';
import { button, clear, el } from './dom';
import type { GameUI } from './ui';
import { saveSettings, SlotId, SLOT_IDS } from '../platform/storage';
import { APP_VERSION } from '../version';
import { assetUrl } from '../platform/assetUrl';

type Layer = { el: HTMLElement; kind: string; onClose?: () => void };

export class Menus {
  private stack: Layer[] = [];
  private hintEl: HTMLElement | null = null;
  private titleOpen = false;

  constructor(
    private ui: GameUI,
    private engine: Engine,
  ) {}

  get open(): boolean {
    return this.stack.length > 0;
  }

  private push(kind: string, panel: HTMLElement, opts: { dim?: boolean; onClose?: () => void } = {}): HTMLElement {
    const wrap = el('div', { class: 'overlay', 'data-testid': `menu-${kind}` });
    if (opts.dim !== false) wrap.append(el('div', { class: 'dim' }));
    wrap.append(panel);
    wrap.addEventListener('mousedown', (e) => e.stopPropagation());
    wrap.addEventListener('contextmenu', (e) => e.preventDefault());
    this.ui.root.append(wrap);
    this.stack.push({ el: wrap, kind, onClose: opts.onClose });
    this.syncPause();
    const first = panel.querySelector('button') as HTMLButtonElement | null;
    first?.focus({ preventScroll: true });
    return wrap;
  }

  close(kind?: string): void {
    const i = kind ? this.stack.map((l) => l.kind).lastIndexOf(kind) : this.stack.length - 1;
    if (i < 0) return;
    const [l] = this.stack.splice(i, 1);
    l.el.remove();
    l.onClose?.();
    this.syncPause();
  }

  closeAll(): void {
    while (this.stack.length) this.close();
  }

  private syncPause(): void {
    this.ui.paused = this.stack.length > 0 || this.titleOpen;
  }

  frame(): void {
    /* nothing animated */
  }

  onKey(e: KeyboardEvent): boolean {
    if (this.hintEl && (e.key === 'Escape' || e.key === 'Enter')) {
      this.closeHint();
      return true;
    }
    if (!this.stack.length) return this.titleOpen;
    if (e.key === 'Escape') {
      const top = this.stack[this.stack.length - 1];
      if (top.kind !== 'title' && top.kind !== 'end') this.close();
      return true;
    }
    return true;
  }

  // ---------------------------------------------------------------- title

  openTitle(): void {
    this.closeAll();
    this.closeHint();
    this.titleOpen = true;
    const box = el('div', { class: 'overlay title', 'data-testid': 'title' });
    box.append(el('img', { class: 'logo', src: assetUrl('screens/logo.webp'), alt: UI.gameTitle }));
    box.append(el('div', { class: 'sub', text: UI.subtitle }));
    const menu = el('div', { class: 'menu' });
    const latest = this.ui.saves.latest();
    if (latest) menu.append(button(UI.title.continue, () => this.loadFile(latest.state), 'btn', { 'data-testid': 'title-continue' }));
    menu.append(button(UI.title.newGame, () => this.newGame(), 'btn', { 'data-testid': 'title-new' }));
    menu.append(button(UI.title.load, () => this.openSaves('load'), 'btn', { 'data-testid': 'title-load' }));
    menu.append(button(UI.title.chapters, () => this.openChapters(), 'btn', { 'data-testid': 'title-chapters' }));
    menu.append(button(UI.title.options, () => this.openOptions(), 'btn', { 'data-testid': 'title-options' }));
    menu.append(button(UI.title.help, () => this.openHelp(), 'btn', { 'data-testid': 'title-help' }));
    menu.append(button(UI.title.credits, () => this.openCredits(), 'btn', { 'data-testid': 'title-credits' }));
    box.append(menu);
    box.append(el('div', { class: 'silent', text: UI.title.silent }));
    box.append(el('div', { class: 'version', text: `v${APP_VERSION}` }));
    box.addEventListener('contextmenu', (e) => e.preventDefault());
    this.ui.root.append(box);
    this.titleEl = box;
    this.syncPause();
    (menu.querySelector('button') as HTMLButtonElement | null)?.focus({ preventScroll: true });
  }

  private titleEl: HTMLElement | null = null;

  private leaveTitle(): void {
    this.titleEl?.remove();
    this.titleEl = null;
    this.titleOpen = false;
    this.closeAll();
    this.syncPause();
  }

  private newGame(): void {
    const start = () => {
      this.leaveTitle();
      this.engine.newChapter(this.engine.content.order[0]);
      this.ui.autosave();
    };
    if (this.ui.saves.read('auto')) this.confirm(UI.title.newGame + '? ' + UI.saves.autosaveNote, start);
    else start();
  }

  loadFile(state: unknown): void {
    const err = this.engine.load(state);
    if (err) {
      this.ui.toast(UI.saves.loadFailed(err));
      return;
    }
    this.leaveTitle();
  }

  // ---------------------------------------------------------------- pause

  openPause(): void {
    if (this.titleOpen || !this.engine.state.chapter) return;
    if (this.stack.some((l) => l.kind === 'pause')) return;
    this.ui.closeVerbs();
    const p = el('div', { class: 'panel' });
    p.append(el('h2', { text: UI.pause.heading }));
    const col = el('div', { style: 'display:flex;flex-direction:column;gap:8px;min-width:260px' });
    col.append(button(UI.pause.resume, () => this.close('pause'), 'btn', { 'data-testid': 'pause-resume' }));
    col.append(button(UI.pause.save, () => this.openSaves('save'), 'btn', { 'data-testid': 'pause-save' }));
    col.append(button(UI.pause.load, () => this.openSaves('load'), 'btn', { 'data-testid': 'pause-load' }));
    col.append(button(UI.pause.options, () => this.openOptions(), 'btn', { 'data-testid': 'pause-options' }));
    col.append(button(UI.pause.help, () => this.openHelp(), 'btn'));
    col.append(button(UI.pause.toTitle, () => this.confirm(UI.pause.confirmTitle, () => this.openTitle()), 'btn', { 'data-testid': 'pause-title' }));
    p.append(col);
    this.push('pause', p);
  }

  // ---------------------------------------------------------------- saves

  openSaves(mode: 'save' | 'load'): void {
    if (mode === 'save' && (!this.engine.state.chapter || this.titleOpen)) return;
    const p = el('div', { class: 'panel slots', style: 'width:640px' });
    p.append(el('h2', { text: mode === 'save' ? UI.saves.saveHeading : UI.saves.loadHeading }));
    const list = el('div');
    const render = () => {
      clear(list);
      for (const e of this.ui.saves.list()) {
        if (mode === 'save' && e.slot === 'auto') continue;
        const label = e.slot === 'auto' ? UI.saves.auto : UI.saves.slot(SLOT_IDS.indexOf(e.slot));
        const what = el('div', { class: 'what' });
        if (e.error) what.append(UI.saves.broken);
        else if (e.file) {
          const m = e.file.meta;
          what.append(`${m.chapterTitle} – ${m.roomTitle}`);
          what.append(el('small', { text: `${new Date(m.savedAt).toLocaleString('de-DE')} · ${UI.saves.playTime(Math.round(m.playTime / 60))}` }));
        } else what.append(UI.saves.empty);
        let act: HTMLButtonElement;
        if (mode === 'save') {
          act = button(UI.pause.save, () => {
            const go = () => {
              this.ui.writeSave(e.slot as SlotId);
              render();
            };
            if (e.file) this.confirm(UI.saves.overwrite, go);
            else go();
          }, 'btn small', { 'data-testid': `save-${e.slot}` });
        } else {
          act = button(UI.title.load, () => {
            if (!e.file) return;
            this.loadFile(e.file.state);
          }, 'btn small', { 'data-testid': `load-${e.slot}` });
          act.disabled = !e.file;
        }
        list.append(el('div', { class: 'slotrow' }, [el('div', { text: label }), what, act]));
      }
    };
    render();
    p.append(list);
    p.append(el('p', { class: 'note', text: UI.saves.autosaveNote }));
    p.append(button(UI.options.close, () => this.close('saves'), 'btn small'));
    this.push('saves', p);
  }

  // ---------------------------------------------------------------- options

  openOptions(): void {
    const s = this.engine.settings;
    const p = el('div', { class: 'panel', style: 'width:600px' });
    p.append(el('h2', { text: UI.options.heading }));
    const speedRow = el('div', { class: 'row' });
    speedRow.append(el('div', { text: UI.options.textSpeed }));
    const speeds: [string, number][] = [
      [UI.options.slow, 0.65],
      [UI.options.normal, 1],
      [UI.options.fast, 1.5],
    ];
    const sb = el('div', { style: 'display:flex;gap:6px' });
    const renderSpeed = () => {
      clear(sb);
      for (const [label, v] of speeds) {
        sb.append(
          button(label, () => {
            s.textSpeed = v;
            persist();
            renderSpeed();
          }, `btn small${Math.abs(s.textSpeed - v) < 0.01 ? ' on' : ''}`),
        );
      }
    };
    renderSpeed();
    speedRow.append(sb);
    p.append(speedRow);
    const toggle = (label: string, hint: string, key: 'autoAdvance' | 'reducedMotion' | 'reducedFlash' | 'relaxedCombat') => {
      const row = el('div', { class: 'row' });
      const txt = el('div', {}, [label, el('div', { class: 'note', text: hint })]);
      const b = button('', () => {
        s[key] = !s[key];
        persist();
        b.textContent = s[key] ? UI.options.on : UI.options.off;
        b.classList.toggle('on', s[key]);
      }, `btn small${s[key] ? ' on' : ''}`, { 'data-testid': `opt-${key}` });
      b.textContent = s[key] ? UI.options.on : UI.options.off;
      row.append(txt, b);
      p.append(row);
    };
    toggle(UI.options.autoAdvance, UI.options.autoAdvanceHint, 'autoAdvance');
    toggle(UI.options.reducedMotion, UI.options.reducedMotionHint, 'reducedMotion');
    toggle(UI.options.reducedFlash, UI.options.reducedFlashHint, 'reducedFlash');
    toggle(UI.options.relaxedCombat, UI.options.relaxedCombatHint, 'relaxedCombat');
    const persist = () => {
      saveSettings(this.ui.store, s);
      this.ui.settingsChanged();
    };
    p.append(button(UI.options.close, () => this.close('options'), 'btn small'));
    this.push('options', p);
  }

  // ---------------------------------------------------------------- chapters

  noteReached(ch: string): void {
    const reached = this.reached();
    if (!reached.includes(ch)) {
      reached.push(ch);
      this.ui.store.write('reached', JSON.stringify(reached));
    }
  }

  private reached(): string[] {
    try {
      const r = JSON.parse(this.ui.store.read('reached') ?? '[]');
      return Array.isArray(r) ? r.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }

  openChapters(): void {
    // Every chapter can be started directly; a chapter starts from its own beginning.
    const p = el('div', { class: 'panel', style: 'width:620px' });
    p.append(el('h2', { text: UI.chapters.heading }));
    this.engine.content.order.forEach((id, i) => {
      const ch = this.engine.content.chapters.get(id)!;
      const row = el('div', { class: 'row' });
      row.append(el('div', {}, [`${i + 1}. ${ch.title}`, el('div', { class: 'note', text: ch.dateline })]));
      const b = button(UI.chapters.start, () => {
        this.leaveTitle();
        this.engine.newChapter(id);
        this.ui.autosave();
      }, 'btn small', { 'data-testid': `chapter-${id}` });
      row.append(b);
      p.append(row);
    });
    p.append(el('p', { class: 'note', text: UI.chapters.note }));
    p.append(button(UI.options.close, () => this.close('chapters'), 'btn small'));
    this.push('chapters', p);
  }

  // ---------------------------------------------------------------- journal & hints

  openJournal(): void {
    if (!this.engine.state.chapter || this.titleOpen) return;
    if (this.stack.some((l) => l.kind === 'journal')) {
      this.close('journal');
      return;
    }
    const ch = this.engine.chapter;
    const p = el('div', { class: 'panel journal', style: 'width:640px' });
    p.append(el('h2', { text: `${UI.journal.heading} – ${ch.title}` }));
    const entries = Object.entries(this.engine.state.journal);
    const open = entries.filter(([, v]) => v === 'open');
    const done = entries.filter(([, v]) => v === 'done');
    if (!entries.length) p.append(el('p', { class: 'note', text: UI.journal.empty }));
    if (open.length) {
      p.append(el('h3', { text: UI.journal.open }));
      const ul = el('ul');
      for (const [id] of open) ul.append(el('li', { text: ch.journal[id] ?? id }));
      p.append(ul);
    }
    if (done.length) {
      p.append(el('h3', { text: UI.journal.done }));
      const ul = el('ul');
      for (const [id] of done) ul.append(el('li', { class: 'done', text: ch.journal[id] ?? id }));
      p.append(ul);
    }
    p.append(button(UI.journal.close, () => this.close('journal'), 'btn small'));
    this.push('journal', p);
  }

  showHint(text: string, level: number, of: number): void {
    this.closeHint();
    const box = el('div', { class: 'hintbox', 'data-testid': 'hint' });
    box.append(el('div', { class: 'lvl', text: of ? `${UI.hint.heading} · ${UI.hint.of(level, of)}` : UI.hint.heading }));
    box.append(el('p', { text }));
    const row = el('div', { style: 'display:flex;gap:8px' });
    if (of && level < of) row.append(button(UI.hint.more, () => this.ui.requestHint(), 'btn small', { 'data-testid': 'hint-more' }));
    row.append(button(UI.hint.close, () => this.closeHint(), 'btn small', { 'data-testid': 'hint-close' }));
    box.append(row);
    box.addEventListener('mousedown', (e) => e.stopPropagation());
    this.ui.root.append(box);
    this.hintEl = box;
  }

  closeHint(): void {
    this.hintEl?.remove();
    this.hintEl = null;
  }

  // ---------------------------------------------------------------- misc

  openHelp(): void {
    const p = el('div', { class: 'panel help', style: 'width:700px' });
    p.append(el('h2', { text: UI.help.heading }));
    const t = el('table');
    for (const [a, b] of UI.help.rows) t.append(el('tr', {}, [el('td', { text: a }), el('td', { text: b })]));
    p.append(t);
    p.append(el('p', { class: 'note', text: UI.title.silent }));
    p.append(button(UI.help.close, () => this.close('help'), 'btn small'));
    this.push('help', p);
  }

  openCredits(): void {
    const p = el('div', { class: 'panel', style: 'width:640px' });
    p.append(el('h2', { text: UI.credits.heading }));
    for (const l of UI.credits.lines) p.append(el('p', { text: l }));
    p.append(button(UI.credits.close, () => this.close('credits'), 'btn small'));
    this.push('credits', p);
  }

  openEnd(): void {
    const box = el('div', { class: 'panel end', style: 'background:#000;border:0;box-shadow:none;width:960px;height:600px;max-height:none' });
    box.append(el('h1', { text: UI.end.heading }));
    box.append(button(UI.end.toTitle, () => this.openTitle(), 'btn', { 'data-testid': 'end-title' }));
    this.push('end', box, { dim: false });
  }

  confirm(text: string, yes: () => void): void {
    const p = el('div', { class: 'panel', style: 'width:520px' });
    p.append(el('p', { text }));
    const row = el('div', { style: 'display:flex;gap:10px' });
    row.append(
      button(UI.confirm.yes, () => {
        this.close('confirm');
        yes();
      }, 'btn', { 'data-testid': 'confirm-yes' }),
    );
    row.append(button(UI.confirm.no, () => this.close('confirm'), 'btn', { 'data-testid': 'confirm-no' }));
    p.append(row);
    this.push('confirm', p);
  }
}
