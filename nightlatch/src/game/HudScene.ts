import Phaser from 'phaser';
import type { OptionDef } from '../engine/types';
import { ctl } from './controller';
import { runOverlay } from './presenter';
import type { RoomScene } from './RoomScene';
import { audio, settings } from './services';

const PANEL_Y = 144;
const SLOT_X0 = 63;
const SLOT_W = 28;
const SLOTS = 7;

export class HudScene extends Phaser.Scene {
  sentence!: Phaser.GameObjects.BitmapText;
  slots: Phaser.GameObjects.Image[] = [];
  icons: Phaser.GameObjects.Image[] = [];
  scroll = 0;
  cursorItem!: Phaser.GameObjects.Image;
  hoverSlot = -1;
  private toasts: { text: string; color: number }[] = [];
  private toastBusy = false;
  private dialogObjs: Phaser.GameObjects.GameObject[] = [];
  private pickResolve: ((v: string | null) => void) | null = null;
  private buttons: Record<string, Phaser.GameObjects.Image> = {};
  private hintObjs: Phaser.GameObjects.GameObject[] = [];
  private choosing = false;
  /** Where the current dialogue options are drawn (for the browser tests). */
  private optInfo: { id: string; text: string; x: number; y: number; exit: boolean; present: boolean }[] = [];
  private optDialog = '';

  constructor() {
    super('hud');
  }

  get room(): RoomScene {
    return this.scene.get('room') as RoomScene;
  }

  create() {
    // the HUD is restarted for every game launched (new game or load): start from scratch
    this.slots = [];
    this.icons = [];
    this.buttons = {};
    this.toasts = [];
    this.toastBusy = false;
    this.dialogObjs = [];
    this.hintObjs = [];
    this.choosing = false;
    this.optInfo = [];
    this.pickResolve = null;
    this.scroll = 0;
    this.hoverSlot = -1;
    this.add.image(0, PANEL_Y, 'ui', 'panel').setOrigin(0, 0);
    this.sentence = this.add.bitmapText(160, PANEL_Y + 2, 'nlo', '').setOrigin(0.5, 0).setTint(0xd8c8a0);
    for (let i = 0; i < SLOTS; i++) {
      const x = SLOT_X0 + i * SLOT_W;
      const s = this.add.image(x, PANEL_Y + 23, 'ui', 'slot').setInteractive();
      s.on('pointerover', () => this.onSlotHover(i));
      s.on('pointerout', () => this.onSlotHover(-1));
      s.on('pointerdown', (p: Phaser.Input.Pointer) => this.onSlotDown(i, p));
      this.slots.push(s);
      this.icons.push(this.add.image(x, PANEL_Y + 23, 'items', 'none').setVisible(false));
    }
    const btn = (key: string, frame: string, x: number, label: string, fn: () => void) => {
      const b = this.add.image(x, PANEL_Y + 23, 'ui', frame).setInteractive();
      b.on('pointerover', () => {
        b.setFrame(frame + '_hi');
        this.sentence.setText(label);
      });
      b.on('pointerout', () => {
        b.setFrame(frame);
        this.updateSentence();
      });
      b.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.rightButtonDown()) return;
        if (this.isBlocked()) return;
        audio.sfx('ui_click');
        fn();
      });
      this.buttons[key] = b;
    };
    btn('notebook', 'btn_notebook', 13, 'Notebook (N)', () => this.openNotebook());
    btn('map', 'btn_map', 36, 'City map (M)', () => this.openMap());
    btn('hint', 'btn_hint', 285, 'Hint (H)', () => this.showHint());
    btn('menu', 'btn_menu', 308, 'Menu (Esc)', () => this.openMenu());
    const arrow = (frame: string, x: number, d: number) => {
      const a = this.add.image(x, PANEL_Y + 23, 'ui', frame).setInteractive();
      a.on('pointerdown', () => {
        const n = ctl.game.state.inv.length;
        this.scroll = Phaser.Math.Clamp(this.scroll + d, 0, Math.max(0, n - SLOTS));
        this.refresh();
      });
      return a;
    };
    arrow('arrow_l', 52, -1);
    arrow('arrow_r', 260, 1);
    this.cursorItem = this.add.image(0, 0, 'items', 'none').setVisible(false).setDepth(5000).setAlpha(0.95);
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.cursorItem.setPosition(Math.round(p.x) + 6, Math.round(p.y) + 6);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown() && this.pickResolve && p.y >= PANEL_Y) {
        const r = this.pickResolve;
        this.pickResolve = null;
        r(null);
        this.updateSentence();
      }
    });
    const kb = this.input.keyboard!;
    kb.on('keydown-N', () => !this.isBlocked() && this.openNotebook());
    kb.on('keydown-M', () => !this.isBlocked() && this.openMap());
    kb.on('keydown-H', () => !this.isBlocked() && this.showHint());
    kb.on('keydown-ESC', () => !this.isBlocked() && this.openMenu());
    kb.on('keydown-F', () => (this.scale.isFullscreen ? this.scale.stopFullscreen() : this.scale.startFullscreen()));
    const onHover = () => this.updateSentence();
    const onChange = () => this.refresh();
    const onMap = () => this.openMap();
    this.room.events.on('hover', onHover);
    this.room.events.on('held', onChange);
    this.room.events.on('changed', onChange);
    this.room.events.on('openMap', onMap);
    this.events.once('shutdown', () => {
      this.room.events.off('hover', onHover);
      this.room.events.off('held', onChange);
      this.room.events.off('changed', onChange);
      this.room.events.off('openMap', onMap);
    });
    this.refresh();
  }

  isBlocked() {
    return !ctl.game || ctl.game.busy > 0 || ctl.inputLocked > 0 || this.choosing;
  }

  // ---------------------------------------------------------------- inventory ----
  refresh() {
    if (!ctl.game || !this.sys.isActive()) return; // stopped (e.g. back at the title)
    const inv = ctl.game.state.inv;
    this.scroll = Phaser.Math.Clamp(this.scroll, 0, Math.max(0, inv.length - SLOTS));
    for (let i = 0; i < SLOTS; i++) {
      const id = inv[this.scroll + i];
      const icon = this.icons[i];
      if (id && this.textures.get('items').has(id)) {
        icon.setFrame(id).setVisible(true).setAlpha(ctl.heldItem === id ? 0.35 : 1);
      } else icon.setVisible(false);
      this.slots[i].setFrame(this.pickResolve ? 'slot_hi' : 'slot');
    }
    if (ctl.heldItem && this.textures.get('items').has(ctl.heldItem)) {
      this.cursorItem.setFrame(ctl.heldItem).setVisible(true);
    } else this.cursorItem.setVisible(false);
    const mapOk = this.mapAvailable();
    this.buttons.map?.setAlpha(mapOk ? 1 : 0.35);
    this.updateSentence();
  }

  mapAvailable() {
    const g = ctl.game;
    if (!g?.state.room) return false;
    return g.canTravel();
  }

  itemName(id: string) {
    return ctl.game.content.items[id]?.name ?? id;
  }

  updateSentence() {
    if (!ctl.game || this.choosing || !this.sys.isActive()) return;
    if (this.pickResolve) {
      this.sentence.setText('Show what? (right-click to cancel)');
      return;
    }
    const held = ctl.heldItem;
    const slotItem = this.hoverSlot >= 0 ? ctl.game.state.inv[this.scroll + this.hoverSlot] : undefined;
    const h = this.room.hover;
    let s = '';
    if (slotItem) {
      s = held && held !== slotItem ? `Use ${this.itemName(held)} with ${this.itemName(slotItem)}` : this.itemName(slotItem);
    } else if (held) {
      s = h ? `Use ${this.itemName(held)} with ${h.name}` : `Use ${this.itemName(held)} with...`;
    } else if (h) s = `${h.verb} ${h.name}`;
    else if (!ctl.game.busy) s = '';
    this.sentence.setText(s);
  }

  private onSlotHover(i: number) {
    this.hoverSlot = i;
    if (i >= 0 && ctl.game.state.inv[this.scroll + i]) this.slots[i].setFrame('slot_hi');
    else for (const s of this.slots) s.setFrame(this.pickResolve ? 'slot_hi' : 'slot');
    this.updateSentence();
  }

  private async onSlotDown(i: number, p: Phaser.Input.Pointer) {
    const g = ctl.game;
    const id = g.state.inv[this.scroll + i];
    if (!id) return;
    if (this.pickResolve) {
      const r = this.pickResolve;
      this.pickResolve = null;
      r(id);
      this.refresh();
      return;
    }
    if (this.isBlocked()) return;
    if (p.rightButtonDown()) {
      ctl.heldItem = null;
      this.refresh();
      await g.perform({ t: 'examine', item: id });
      this.refresh();
      return;
    }
    if (ctl.heldItem && ctl.heldItem !== id) {
      const a = ctl.heldItem;
      ctl.heldItem = null;
      this.refresh();
      await g.perform({ t: 'combine', a, b: id });
      this.refresh();
      return;
    }
    ctl.heldItem = ctl.heldItem === id ? null : id;
    audio.sfx('ui_click');
    this.refresh();
  }

  /** Evidence selection for "Show..." dialogue options. */
  pickItem(_prompt: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.pickResolve = resolve;
      this.refresh();
    });
  }

  // ------------------------------------------------------------------ dialogue ----
  chooseOption(options: OptionDef[], dialogId = ''): Promise<OptionDef> {
    this.choosing = true;
    this.optDialog = dialogId;
    this.sentence.setText('');
    return new Promise((resolve) => {
      let page = 0;
      const per = 5;
      const draw = () => {
        for (const o of this.dialogObjs) o.destroy();
        this.dialogObjs = [];
        const shown = options.slice(page * per, page * per + per);
        const more = options.length > per;
        this.optInfo = [];
        const lines = shown.length + (more ? 1 : 0);
        const h = lines * 10 + 6;
        const top = 180 - h;
        const bg = this.add.image(0, top, 'ui', 'dialog_bg').setOrigin(0, 0).setDisplaySize(320, h).setDepth(4000)
          .setInteractive();
        this.dialogObjs.push(bg);
        shown.forEach((o, i) => {
          const t = this.add.bitmapText(8, top + 4 + i * 10, 'nlo', truncate(o.text, 72)).setTint(0xb8a070)
            .setDepth(4001).setInteractive({ useHandCursor: true });
          t.on('pointerover', () => t.setTint(0xffffff));
          t.on('pointerout', () => t.setTint(0xb8a070));
          t.on('pointerdown', () => {
            for (const ob of this.dialogObjs) ob.destroy();
            this.dialogObjs = [];
            this.optInfo = [];
            this.choosing = false;
            audio.sfx('ui_click');
            resolve(o);
          });
          this.dialogObjs.push(t);
          this.optInfo.push({ id: o.id, text: o.text, x: 14, y: top + 8 + i * 10, exit: o.next === 'exit', present: !!o.present });
        });
        if (more) {
          const t = this.add.bitmapText(8, top + 4 + shown.length * 10, 'nlo', '... more').setTint(0x7f7f9f).setDepth(4001)
            .setInteractive();
          t.on('pointerdown', () => {
            page = (page + 1) % Math.ceil(options.length / per);
            draw();
          });
          this.dialogObjs.push(t);
          this.optInfo.push({ id: '__more', text: '... more', x: 14, y: top + 8 + shown.length * 10, exit: false, present: false });
        }
      };
      draw();
    });
  }

  testInfo() {
    const inv = ctl.game?.state.inv ?? [];
    return {
      choosing: this.choosing,
      dialog: this.optDialog,
      options: [...this.optInfo],
      picking: !!this.pickResolve,
      scroll: this.scroll,
      slots: Array.from({ length: SLOTS }, (_, i) => ({ item: inv[this.scroll + i] ?? null, x: SLOT_X0 + i * SLOT_W, y: PANEL_Y + 23 })),
      arrows: { left: [52, PANEL_Y + 23], right: [260, PANEL_Y + 23] },
      buttons: { notebook: [13, PANEL_Y + 23], map: [36, PANEL_Y + 23], hint: [285, PANEL_Y + 23], menu: [308, PANEL_Y + 23] },
      held: ctl.heldItem,
      sentence: this.sentence?.text ?? '',
    };
  }

  // -------------------------------------------------------------------- toasts ----
  toast(text: string, color = 0xe8d8b0) {
    if (!this.sys.isActive()) return;
    this.toasts.push({ text, color });
    if (!this.toastBusy) this.nextToast();
  }

  private nextToast() {
    const t = this.toasts.shift();
    if (!t) {
      this.toastBusy = false;
      return;
    }
    this.toastBusy = true;
    const txt = this.add.bitmapText(316, PANEL_Y - 3, 'nlo', t.text).setOrigin(1, 1).setTint(t.color).setDepth(3000)
      .setAlpha(0);
    this.tweens.add({
      targets: txt, alpha: 1, duration: ctl.fast ? 1 : 200, yoyo: true, hold: ctl.fast ? 1 : 1700,
      onComplete: () => {
        txt.destroy();
        this.nextToast();
      },
    });
  }

  // ------------------------------------------------------------------ overlays ----
  openNotebook() {
    void runOverlay('notebook', {});
  }

  openMap() {
    if (!this.mapAvailable()) {
      this.toast("I can't leave from here.", 0xc0a080);
      return;
    }
    void runOverlay('map', {});
  }

  openMenu() {
    void runOverlay('menu', {});
  }

  showHint() {
    if (!settings.hints) {
      this.toast('Hints are switched off in the settings.', 0xc0a080);
      return;
    }
    for (const o of this.hintObjs) o.destroy();
    const text = ctl.game.hint();
    const t = this.add.bitmapText(160, 20, 'nlo', 'Hint: ' + text).setMaxWidth(280).setOrigin(0.5, 0).setTint(0xffe2a0)
      .setDepth(4500);
    const bg = this.add.rectangle(160, 16, t.width + 10, t.height + 8, 0x06060a, 0.85).setOrigin(0.5, 0)
      .setStrokeStyle(1, 0x7a6230).setDepth(4499);
    this.hintObjs = [bg, t];
    this.time.delayedCall(Math.max(4000, text.length * 70), () => {
      bg.destroy();
      t.destroy();
    });
  }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
