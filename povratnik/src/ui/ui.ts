// DOM interface over the canvas: HUD, speech, verbs, choices, cards, combat panel.
// The UI reads engine state every frame and turns clicks into engine intents.
import type { Engine, EngineEvent } from '../core/engine';
import type { GameScene, SceneHooks, Target } from '../view/scene';
import { dyn } from '../core/content';
import { UI, verbLabel } from '../content/text/de/ui';
import { imageMeta } from '../content/assets';
import { button, clear, el } from './dom';
import { Menus } from './menus';
import { Saves, SlotId, Store } from '../platform/storage';

const SCENE_H = 470;

export class GameUI implements SceneHooks {
  readonly root: HTMLElement;
  private hud!: HTMLElement;
  private line!: HTMLElement;
  private invBox!: HTMLElement;
  private speechEl: HTMLElement | null = null;
  private speechId = -1;
  private choicesEl: HTMLElement | null = null;
  private choiceId = -1;
  private verbsEl: HTMLElement | null = null;
  private cardEl: HTMLElement | null = null;
  private cardRef: unknown = null;
  private vignetteEl: HTMLElement | null = null;
  private vignetteRef: unknown = null;
  private combatEl: HTMLElement | null = null;
  private loadingEl: HTMLElement | null = null;
  private inspectEl: HTMLElement | null = null;
  private skipEl: HTMLElement | null = null;
  private cursorItem: HTMLImageElement;
  private toastEl: HTMLElement | null = null;
  private toastT = 0;
  selectedItem: string | null = null;
  private hovered: Target | null = null;
  private invPage = 0;
  private invSig = '';
  readonly menus: Menus;
  /** True while a menu or overlay pauses the game. */
  paused = true;
  private message = '';
  private messageT = 0;
  private lastMode = '';
  private touchHeld = false;

  constructor(
    private engine: Engine,
    private scene: GameScene,
    readonly saves: Saves,
    readonly store: Store,
    private applySettings: () => void,
  ) {
    this.root = document.getElementById('ui')!;
    this.buildHud();
    this.cursorItem = el('img', { class: 'cursor-item', alt: '' });
    this.cursorItem.style.display = 'none';
    this.root.append(this.cursorItem);
    this.menus = new Menus(this, engine);
    engine.on((e) => this.onEngine(e));
    window.addEventListener('keydown', (e) => this.onKey(e));
    window.addEventListener('mousemove', (e) => this.moveCursor(e));
    window.addEventListener('resize', () => this.fit());
    this.fit();
  }

  // ------------------------------------------------------------------ layout

  fit(): void {
    const stage = document.getElementById('stage')!;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const k = Math.min(w / 960, h / 600);
    stage.style.transform = `scale(${k})`;
    stage.style.left = `${Math.round((w - 960 * k) / 2)}px`;
    stage.style.top = `${Math.round((h - 600 * k) / 2)}px`;
    this.scene.game?.scale.updateBounds();
  }

  private stageScale(): { k: number; left: number; top: number } {
    const stage = document.getElementById('stage')!;
    const r = stage.getBoundingClientRect();
    return { k: r.width / 960, left: r.left, top: r.top };
  }

  private moveCursor(e: MouseEvent): void {
    if (!this.selectedItem) return;
    const s = this.stageScale();
    this.cursorItem.style.left = `${(e.clientX - s.left) / s.k}px`;
    this.cursorItem.style.top = `${(e.clientY - s.top) / s.k}px`;
  }

  // ------------------------------------------------------------------ HUD

  private buildHud(): void {
    this.hud = el('div', { class: 'hud', 'data-testid': 'hud' });
    this.line = el('div', { class: 'line', 'data-testid': 'action-line' });
    this.hud.append(this.line);
    const tiny: [string, string, () => void, string][] = [
      ['II', UI.hud.pause, () => this.menus.openPause(), 'pause'],
      ['?', UI.hud.help, () => this.menus.openHelp(), 'help'],
      ['□', UI.hud.fullscreen, () => this.toggleFullscreen(), 'fullscreen'],
      ['≡', UI.hud.options, () => this.menus.openOptions(), 'options'],
    ];
    tiny.forEach(([label, title, fn, id], i) => {
      const b = button(label, fn, 'tiny', { title, 'aria-label': title, 'data-testid': `hud-${id}` });
      b.style.left = `${808 + i * 36}px`;
      this.hud.append(b);
    });
    const slots: [string, string, () => void, string][] = [
      [UI.hud.journal, 'J', () => this.menus.openJournal(), 'journal'],
      [UI.hud.hint, 'H', () => this.requestHint(), 'hint'],
      [UI.hud.spots, 'Tab', () => this.toggleSpots(), 'spots'],
      [UI.hud.save, '', () => this.menus.openSaves('save'), 'save'],
      [UI.hud.load, '', () => this.menus.openSaves('load'), 'load'],
      [UI.hud.menu, 'Esc', () => this.menus.openPause(), 'menu'],
    ];
    slots.forEach(([label, key, fn, id], i) => {
      const b = button('', fn, 'slot', { 'data-testid': `hud-${id}` });
      b.append(label);
      if (key) b.append(el('span', { class: 'key', text: key }));
      b.style.left = `${19 + (i % 3) * 156}px`;
      b.style.top = `${i < 3 ? 43 : 87}px`;
      this.hud.append(b);
    });
    this.invBox = el('div', { class: 'inv', 'data-testid': 'inventory' });
    this.hud.append(this.invBox);
    this.root.append(this.hud);
  }

  private toggleFullscreen(): void {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } catch {
      /* not available */
    }
  }

  toggleSpots(): void {
    this.scene.highlight = !this.scene.highlight;
  }

  requestHint(): void {
    if (!this.engine.state.chapter) return;
    this.engine.intent({ k: 'hint' });
  }

  private renderInventory(): void {
    const inv = this.engine.state.inventory;
    const pages = Math.max(1, Math.ceil(inv.length / 6));
    if (this.invPage >= pages) this.invPage = pages - 1;
    const sig = `${inv.join(',')}|${this.invPage}|${this.selectedItem}`;
    if (sig === this.invSig) return;
    this.invSig = sig;
    clear(this.invBox);
    const slice = inv.slice(this.invPage * 6, this.invPage * 6 + 6);
    slice.forEach((id, i) => {
      const def = this.engine.content.items.get(id);
      if (!def) return;
      const name = dyn(def.name, this.engine.state);
      const b = el('button', { class: `item${this.selectedItem === id ? ' sel' : ''}`, type: 'button', title: name, 'aria-label': name, 'data-item': id });
      b.style.left = `${3 + i * 74}px`;
      b.append(el('img', { src: itemSrc(dyn(def.icon, this.engine.state)), alt: name }));
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.clickItem(id);
      });
      b.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.examine(id);
      });
      b.addEventListener('mouseenter', () => this.hoverItem(id));
      b.addEventListener('mouseleave', () => this.hoverItem(null));
      let pressT = 0;
      b.addEventListener('touchstart', () => (pressT = performance.now()), { passive: true });
      b.addEventListener('touchend', (ev) => {
        if (performance.now() - pressT > 450) {
          ev.preventDefault();
          this.examine(id);
        }
      });
      this.invBox.append(b);
    });
    if (pages > 1) {
      const prev = button('‹', () => {
        this.invPage = (this.invPage + pages - 1) % pages;
        this.renderInventory();
      }, 'page', { title: UI.hud.prev, 'aria-label': UI.hud.prev });
      prev.style.left = '-22px';
      const next = button('›', () => {
        this.invPage = (this.invPage + 1) % pages;
        this.renderInventory();
      }, 'page', { title: UI.hud.next, 'aria-label': UI.hud.next });
      next.style.left = '446px';
      this.invBox.append(prev, next);
    }
  }

  private hoveredItem: string | null = null;

  private hoverItem(id: string | null): void {
    this.hoveredItem = id;
  }

  private clickItem(id: string): void {
    if (this.engine.inputMode() !== 'free') return;
    this.closeVerbs();
    if (this.selectedItem === id) {
      this.selectItem(null);
      return;
    }
    if (this.selectedItem) {
      const a = this.selectedItem;
      this.selectItem(null);
      this.engine.intent({ k: 'useItem', item: a, target: `item:${id}` });
      return;
    }
    this.selectItem(id);
  }

  examine(id: string): void {
    if (this.engine.inputMode() !== 'free') return;
    this.selectItem(null);
    this.closeVerbs();
    this.engine.intent({ k: 'examine', item: id });
  }

  selectItem(id: string | null): void {
    this.selectedItem = id;
    if (id) {
      const def = this.engine.content.items.get(id);
      this.cursorItem.src = def ? itemSrc(dyn(def.icon, this.engine.state)) : '';
      this.cursorItem.style.display = 'block';
    } else this.cursorItem.style.display = 'none';
    this.invSig = '';
  }

  private itemName(id: string): string {
    const d = this.engine.content.items.get(id);
    return d ? dyn(d.name, this.engine.state) : id;
  }

  private renderLine(): void {
    const mode = this.engine.inputMode();
    let text = '';
    if (this.message && this.messageT > 0) {
      this.line.innerHTML = '';
      this.line.append(el('span', { class: 'msg', text: this.message }));
      return;
    }
    if (mode === 'free') {
      if (this.selectedItem) {
        const item = this.itemName(this.selectedItem);
        if (this.hoveredItem && this.hoveredItem !== this.selectedItem) text = UI.combineWith(item, this.itemName(this.hoveredItem));
        else if (this.hovered) text = UI.useOn(item, this.hovered.name);
        else text = UI.useWith(item);
      } else if (this.hoveredItem) text = this.itemName(this.hoveredItem);
      else if (this.hovered) text = this.hovered.exit ? `${UI.walk}: ${this.hovered.name}` : this.hovered.name;
    }
    if (this.line.textContent !== text) this.line.textContent = text;
  }

  // ------------------------------------------------------------------ scene hooks

  hover(t: Target | null): void {
    this.hovered = t;
    const canvas = this.scene.game.canvas;
    if (canvas) canvas.style.cursor = t ? (t.exit ? 'e-resize' : 'pointer') : 'default';
  }

  click(t: Target | null, wx: number, wy: number, sx: number, sy: number): void {
    if (this.paused) return;
    const mode = this.engine.inputMode();
    if (mode === 'speech' || mode === 'card') {
      this.engine.intent({ k: 'advance' });
      return;
    }
    if (mode !== 'free') return;
    const hadMenu = !!this.verbsEl;
    this.closeVerbs();
    if (this.selectedItem) {
      const item = this.selectedItem;
      this.selectItem(null);
      if (t) this.engine.intent({ k: 'useItem', item, target: t.id });
      else this.engine.intent({ k: 'walk', x: wx, y: wy });
      return;
    }
    if (!t) {
      if (!hadMenu) this.engine.intent({ k: 'walk', x: wx, y: wy });
      return;
    }
    const verbs = this.engine.verbsFor(t.id);
    if (t.exit && verbs.includes('go')) {
      this.engine.intent({ k: 'act', target: t.id, verb: 'go' });
      return;
    }
    if (verbs.length === 1) {
      this.engine.intent({ k: 'act', target: t.id, verb: verbs[0] });
      return;
    }
    this.openVerbs(t, verbs, sx, sy);
  }

  context(t: Target | null): void {
    if (this.paused) return;
    const mode = this.engine.inputMode();
    if (mode === 'speech' || mode === 'card') {
      this.engine.intent({ k: 'advance' });
      return;
    }
    if (mode !== 'free') return;
    this.closeVerbs();
    if (this.selectedItem) {
      this.selectItem(null);
      return;
    }
    if (t) this.engine.intent({ k: 'act', target: t.id, verb: 'look' });
  }

  loading(on: boolean): void {
    if (on && !this.loadingEl) {
      this.loadingEl = el('div', { class: 'loading', text: UI.loading });
      this.root.append(this.loadingEl);
    } else if (!on && this.loadingEl) {
      this.loadingEl.remove();
      this.loadingEl = null;
    }
  }

  running(): boolean {
    return !this.paused;
  }

  // ------------------------------------------------------------------ verbs

  private openVerbs(t: Target, verbs: string[], sx: number, sy: number): void {
    const box = el('div', { class: 'verbs', role: 'menu', 'data-testid': 'verbs' });
    box.append(el('div', { class: 'title', text: t.name }));
    verbs.forEach((v, i) => {
      const b = button(verbLabel(v), () => {
        this.closeVerbs();
        this.engine.intent({ k: 'act', target: t.id, verb: v });
      }, '', { role: 'menuitem', 'data-verb': v });
      b.title = `${i + 1}`;
      box.append(b);
    });
    // Keep inside the scene.
    const w = 150;
    const h = 30 + verbs.length * 33;
    box.style.left = `${Math.min(Math.max(4, sx - 20), 960 - w - 4)}px`;
    box.style.top = `${Math.min(Math.max(4, sy - 14), SCENE_H - h - 4)}px`;
    box.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.closeVerbs();
    });
    this.root.append(box);
    this.verbsEl = box;
    this.verbTarget = t;
    this.verbList = verbs;
  }

  private verbTarget: Target | null = null;
  private verbList: string[] = [];

  closeVerbs(): void {
    this.verbsEl?.remove();
    this.verbsEl = null;
    this.verbTarget = null;
  }

  // ------------------------------------------------------------------ per frame

  frame(dt: number): void {
    const e = this.engine;
    if (this.messageT > 0) this.messageT -= dt;
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0 && this.toastEl) {
        this.toastEl.remove();
        this.toastEl = null;
      }
    }
    const mode = e.inputMode();
    if (mode !== this.lastMode) {
      if (mode !== 'free') this.closeVerbs();
      this.hud.classList.toggle('disabled', mode !== 'free');
      this.lastMode = mode;
    }
    this.renderInventory();
    this.renderLine();
    this.renderSpeech();
    this.renderChoices();
    this.renderCard();
    this.renderVignette();
    this.renderCombat();
    this.renderSkip(mode);
    this.menus.frame();
  }

  private renderSkip(mode: string): void {
    const show = (mode === 'busy' || mode === 'speech') && !this.paused && !!this.engine.state.chapter;
    if (show && !this.skipEl) {
      this.skipEl = el('div', { class: 'skiphint', text: UI.skipHint });
      this.root.append(this.skipEl);
    } else if (!show && this.skipEl) {
      this.skipEl.remove();
      this.skipEl = null;
    }
  }

  private renderSpeech(): void {
    const sp = this.engine.speech;
    if (!sp) {
      if (this.speechEl) {
        this.speechEl.remove();
        this.speechEl = null;
        this.speechId = -1;
      }
      return;
    }
    if (sp.id !== this.speechId) {
      this.speechEl?.remove();
      this.speechId = sp.id;
      const color = this.engine.actorColor(sp.actor);
      if (sp.actor === null) {
        this.speechEl = el('div', { class: 'caption', 'data-testid': 'speech', text: sp.text });
      } else {
        this.speechEl = el('div', { class: 'speech', 'data-testid': 'speech', style: `color:${color}` });
        this.speechEl.append(el('span', { class: 'who', text: this.engine.actorName(sp.actor) }), sp.text);
      }
      this.speechEl.setAttribute('data-actor', sp.actor ?? 'narrator');
      this.root.append(this.speechEl);
    }
    if (sp.actor !== null && this.speechEl) {
      const anchor = this.scene.speechAnchor(sp.actor);
      if (anchor && anchor.x > -40 && anchor.x < 1000) {
        this.speechEl.classList.remove('caption', 'low');
        this.speechEl.classList.add('speech');
        const x = Math.min(Math.max(anchor.x, 200), 760);
        const y = Math.max(anchor.y - 8, 60);
        this.speechEl.style.left = `${x}px`;
        this.speechEl.style.top = `${y}px`;
      } else {
        // Speaker not visible (off-screen, other room): show as a caption with name.
        this.speechEl.classList.remove('speech');
        this.speechEl.classList.add('caption', 'low');
        this.speechEl.style.left = '';
        this.speechEl.style.top = '';
      }
    }
  }

  private renderChoices(): void {
    const cv = this.engine.choiceView;
    if (!cv) {
      if (this.choicesEl) {
        this.choicesEl.remove();
        this.choicesEl = null;
        this.choiceId = -1;
      }
      return;
    }
    if (cv.id === this.choiceId) return;
    this.choicesEl?.remove();
    this.choiceId = cv.id;
    const box = el('div', { class: 'choices', 'data-testid': 'choices', role: 'menu' });
    cv.options.forEach((o, i) => {
      const b = button('', () => this.engine.intent({ k: 'choose', id: o.id }), o.id === '__bye' ? 'bye' : '', { role: 'menuitem', 'data-choice': o.id });
      b.append(el('span', { class: 'n', text: `${i + 1}.` }), o.text);
      box.append(b);
    });
    this.root.append(box);
    this.choicesEl = box;
  }

  private renderCard(): void {
    const c = this.engine.cardView;
    if (!c) {
      if (this.cardEl) {
        this.cardEl.remove();
        this.cardEl = null;
        this.cardRef = null;
      }
      return;
    }
    if (this.cardRef !== c) {
      this.cardEl?.remove();
      this.cardRef = c;
      const idx = this.engine.content.order.indexOf(this.engine.state.chapter);
      const card = el('div', { class: c.kind === 'time' ? 'overlay card time' : 'overlay card', 'data-testid': 'card' });
      if (c.image) card.append(el('img', { class: 'bg', src: `assets/${imageMeta(c.image)?.file ?? `screens/${c.image}.webp`}`, alt: '' }));
      card.append(el('div', { class: 'shade' }));
      if (c.cine) {
        const cine = el('div', { class: 'cine', style: `background-image:url(assets/cine/${c.cine}.webp)` });
        card.append(cine);
      }
      const text = el('div', { class: 'text' });
      if (idx >= 0 && c.kind !== 'time') text.append(el('div', { class: 'chap', text: UI.card.chapter(idx + 1) }));
      text.append(el('h1', { text: c.title }));
      const [first, ...rest] = c.kind === 'time' ? ['', ...c.lines] : c.lines;
      if (first) text.append(el('div', { class: 'date', text: first }));
      for (const l of rest) text.append(el('p', { text: l }));
      card.append(text, el('div', { class: 'cont', text: UI.card.clickToContinue }));
      card.addEventListener('click', () => this.engine.intent({ k: 'advance' }));
      this.root.append(card);
      this.cardEl = card;
      requestAnimationFrame(() => card.classList.add('show'));
    }
    // Lines appear one by one across the card's duration.
    const ps = this.cardEl!.querySelectorAll('p');
    const span = Math.max(1, c.dur - 2);
    ps.forEach((p, i) => {
      const on = this.engine.settings.reducedMotion || c.t > 0.6 + (i * span) / Math.max(1, ps.length);
      p.classList.toggle('on', on);
    });
    const cine = this.cardEl!.querySelector('.cine') as HTMLElement | null;
    if (cine) {
      const f = this.engine.settings.reducedMotion ? 0 : Math.floor(c.t * 5) % 8;
      cine.style.backgroundPosition = `${-(f % 4) * 384}px ${-Math.floor(f / 4) * 216}px`;
    }
  }

  private renderVignette(): void {
    const v = this.engine.vignetteView;
    if (!v) {
      if (this.vignetteEl) {
        this.vignetteEl.remove();
        this.vignetteEl = null;
        this.vignetteRef = null;
      }
      return;
    }
    if (this.vignetteRef !== v) {
      this.vignetteEl?.remove();
      this.vignetteRef = v;
      const box = el('div', { class: 'overlay vignette', 'data-testid': 'vignette' });
      box.append(el('div', { class: 'strip', style: `background-image:url(assets/cine/${v.image}.webp)` }));
      box.append(el('div', { class: 'cap', 'data-testid': 'vignette-caption' }));
      box.append(el('div', { class: 'cont', text: UI.card.clickToContinue }));
      box.addEventListener('click', () => this.engine.intent({ k: 'advance' }));
      this.root.append(box);
      this.vignetteEl = box;
    }
    const strip = this.vignetteEl!.querySelector('.strip') as HTMLElement;
    const raw = Math.floor(v.t * v.fps);
    const f = this.engine.settings.reducedMotion ? v.frames - 1 : v.loop ? raw % v.frames : Math.min(v.frames - 1, raw);
    strip.style.backgroundPosition = `${-(f % 4) * 768}px ${-Math.floor(f / 4) * 432}px`;
    const cap = this.vignetteEl!.querySelector('.cap') as HTMLElement;
    const ci = v.captions.length ? Math.min(v.captions.length - 1, Math.floor((v.t / Math.max(0.01, v.dur)) * v.captions.length)) : -1;
    const ct = ci >= 0 ? v.captions[ci] : '';
    if (cap.textContent !== ct) cap.textContent = ct;
  }

  private renderCombat(): void {
    const c = this.engine.combat;
    if (!c) {
      if (this.combatEl) {
        this.combatEl.remove();
        this.combatEl = null;
      }
      return;
    }
    if (!this.combatEl) {
      this.combatEl = el('div', { class: 'combat', 'data-testid': 'combat' });
      this.root.append(this.combatEl);
      this.combatSig = '';
    }
    const acts = c.actions;
    const sig = `${c.phase}|${c.message}|${acts.map((a) => a.id).join(',')}|${c.failures}|${c.progress}`;
    if (sig !== this.combatSig) {
      this.combatSig = sig;
      clear(this.combatEl);
      this.combatEl.classList.toggle('decide', c.phase === 'cue');
      this.combatEl.classList.toggle('fail', c.phase === 'fail');
      this.combatEl.append(el('div', { class: 'cue', 'data-testid': 'combat-cue', text: c.message }));
      const row = el('div', { class: 'acts' });
      acts.forEach((a, i) => {
        const b = button(`${i + 1}  ${a.label}`, () => this.engine.intent({ k: 'combat', action: a.id }), 'btn', { 'data-action': a.id });
        row.append(b);
      });
      this.combatEl.append(row);
      const meter = el('div', { class: 'meter' });
      meter.append(el('div', { text: Number.isFinite(c.window) ? UI.combat.time : UI.combat.relaxed }));
      const bar = el('div', { class: 'bar' }, [el('i', { class: 'fill' })]);
      meter.append(bar);
      const prog = el('div', { class: 'pips' });
      for (let i = 0; i < c.def.steps.length; i++) prog.append(el('span', { class: i < c.progress ? 'on' : '' }));
      meter.append(el('div', { text: UI.combat.progress }), prog);
      if (c.failures) meter.append(el('div', { class: 'cuts', text: UI.combat.cuts(c.failures) }));
      this.combatEl.append(meter);
    }
    const fill = this.combatEl.querySelector('.fill') as HTMLElement | null;
    if (fill) {
      const decision = c.phase === 'cue';
      const frac = decision && Number.isFinite(c.window) ? c.timeLeft / c.window : decision ? 1 : 0;
      fill.style.width = `${Math.round(frac * 100)}%`;
    }
  }

  private combatSig = '';

  // ------------------------------------------------------------------ engine events

  private onEngine(e: EngineEvent): void {
    switch (e.k) {
      case 'hint':
        this.menus.showHint(e.text, e.level, e.of);
        break;
      case 'autosave':
        this.autosave();
        break;
      case 'error':
        console.error(e.text);
        this.toast(UI.error.script);
        break;
      case 'room':
        this.closeVerbs();
        this.selectItem(null);
        break;
      case 'chapter':
        this.menus.noteReached(e.chapter);
        break;
      case 'gameEnd':
        this.menus.openEnd();
        break;
      case 'script':
        if (e.id.startsWith('examine:')) {
          if (e.phase === 'start') this.showInspect(e.id.slice(8));
          else this.hideInspect();
        }
        break;
      default:
        break;
    }
  }

  private showInspect(item: string): void {
    this.hideInspect();
    const def = this.engine.content.items.get(item);
    if (!def) return;
    const box = el('div', { class: 'inspect', 'data-testid': 'inspect' });
    box.append(el('img', { src: itemSrc(dyn(def.icon, this.engine.state)), alt: '' }), el('div', { class: 'nm', text: dyn(def.name, this.engine.state) }));
    this.root.append(box);
    this.inspectEl = box;
  }

  private hideInspect(): void {
    this.inspectEl?.remove();
    this.inspectEl = null;
  }

  autosave(): void {
    if (!this.engine.state.chapter) return;
    this.writeSave('auto', true);
  }

  writeSave(slot: SlotId, quiet = false): boolean {
    const state = this.engine.saveData();
    const ch = this.engine.content.chapters.get(state.chapter);
    const room = this.engine.content.rooms.get(state.room);
    const ok = this.saves.write({
      meta: {
        slot,
        chapter: state.chapter,
        chapterTitle: ch?.title ?? state.chapter,
        roomTitle: room?.title ?? state.room,
        savedAt: Date.now(),
        playTime: Math.round(state.playTime),
        checkpoint: !this.engine.canSaveLive(),
      },
      state,
    });
    if (!quiet) this.toast(ok ? (this.engine.canSaveLive() ? UI.saves.saved : UI.saves.savedCheckpoint) : UI.saves.failed);
    else if (!ok) this.flash(UI.saves.failed);
    return ok;
  }

  flash(text: string): void {
    this.message = text;
    this.messageT = 3;
  }

  toast(text: string): void {
    this.toastEl?.remove();
    this.toastEl = el('div', { class: 'toast', 'data-testid': 'toast', text });
    this.root.append(this.toastEl);
    this.toastT = 2.6;
  }

  settingsChanged(): void {
    this.applySettings();
  }

  // ------------------------------------------------------------------ keyboard

  private onKey(e: KeyboardEvent): void {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!this.paused) this.toggleSpots();
      return;
    }
    if (this.menus.onKey(e)) return;
    const mode = this.engine.inputMode();
    if (e.key === 'Escape') {
      if (this.verbsEl) {
        this.closeVerbs();
        return;
      }
      if (this.selectedItem) {
        this.selectItem(null);
        return;
      }
      if (mode === 'card') {
        this.engine.intent({ k: 'advance' });
        this.engine.intent({ k: 'skip' });
        return;
      }
      if (mode === 'busy' || mode === 'speech' || mode === 'transition') {
        this.engine.intent({ k: 'skip' });
        return;
      }
      this.menus.openPause();
      return;
    }
    if (this.paused) return;
    if (e.key === ' ' || e.key === 'Enter') {
      if (mode === 'speech' || mode === 'card') {
        e.preventDefault();
        this.engine.intent({ k: 'advance' });
      }
      return;
    }
    if (/^[1-9]$/.test(e.key)) {
      const n = Number(e.key) - 1;
      if (mode === 'choice' && this.engine.choiceView) {
        const o = this.engine.choiceView.options[n];
        if (o) this.engine.intent({ k: 'choose', id: o.id });
        return;
      }
      if (mode === 'combat' && this.engine.combat) {
        const a = this.engine.combat.actions[n];
        if (a) this.engine.intent({ k: 'combat', action: a.id });
        return;
      }
      if (this.verbsEl && this.verbTarget) {
        const v = this.verbList[n];
        const t = this.verbTarget;
        if (v) {
          this.closeVerbs();
          this.engine.intent({ k: 'act', target: t.id, verb: v });
        }
      }
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'j') this.menus.openJournal();
    else if (k === 'h') this.requestHint();
    void this.touchHeld;
  }
}

export function itemSrc(icon: string): string {
  return `assets/items/${icon}.webp`;
}
