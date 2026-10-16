// Modal overlay scenes: chapter cards, document viewer, close-up puzzles.
import Phaser from 'phaser';
import type { CloseupDef } from '../engine/types';
import { ctl } from './controller';
import { audio } from './services';

export abstract class Overlay extends Phaser.Scene {
  protected onClose: (() => void) | null = null;
  protected closing = false;

  init(data: { onClose?: () => void }) {
    this.onClose = data.onClose ?? null;
    this.closing = false;
    this.openedAt = performance.now();
  }

  /** When the overlay opened: the key press that opened it must not also close it. */
  protected openedAt = 0;

  protected onKey(key: string, fn: () => void = () => this.close()) {
    this.input.keyboard?.on(`keydown-${key}`, () => {
      if (performance.now() - this.openedAt > 200) fn();
    });
  }

  close() {
    if (this.closing) return;
    this.closing = true;
    const cb = this.onClose;
    this.onClose = null;
    this.scene.stop();
    cb?.();
  }

  /** Dim backdrop that swallows clicks to the room. */
  protected backdrop(alpha = 0.6) {
    return this.add.rectangle(0, 0, 320, 180, 0x000000, alpha).setOrigin(0, 0).setInteractive();
  }

  protected closeButton(x: number, y: number) {
    const b = this.add.image(x, y, 'ui', 'btn_close').setInteractive({ useHandCursor: true });
    b.on('pointerover', () => b.setFrame('btn_close_hi'));
    b.on('pointerout', () => b.setFrame('btn_close'));
    b.on('pointerdown', () => {
      audio.sfx('ui_click');
      this.close();
    });
    return b;
  }
}

// ----------------------------------------------------------------- chapter card ----
export class CardScene extends Overlay {
  private data0!: { title: string; sub?: string };
  constructor() {
    super('card');
  }
  init(data: { title: string; sub?: string; onClose?: () => void }) {
    super.init(data);
    this.data0 = data;
  }
  create() {
    const bg = this.add.rectangle(0, 0, 320, 180, 0x000000, 1).setOrigin(0, 0).setInteractive();
    const lines = this.data0.title.split('\n');
    const t1 = this.add.bitmapText(160, 70, 'nlo', lines[0]).setOrigin(0.5).setTint(0x9a8a6a).setAlpha(0);
    const t2 = this.add.bitmapText(160, 88, 'nlo', lines[1] ?? '').setOrigin(0.5).setScale(2).setTint(0xe8d8a8)
      .setAlpha(0);
    const t3 = this.add.bitmapText(160, 112, 'nlo', this.data0.sub ?? '').setOrigin(0.5).setTint(0x8a7a60)
      .setMaxWidth(260).setCenterAlign().setAlpha(0);
    audio.play('music', null);
    audio.sfx('chapter');
    if (ctl.fast && ctl.autoOverlays) {
      this.time.delayedCall(10, () => this.close());
      return;
    }
    this.tweens.add({ targets: [t1, t2, t3], alpha: 1, duration: 900, delay: (_t: unknown, _k: string, _v: number, i: number) => i * 350 });
    const done = () => {
      this.tweens.add({ targets: [t1, t2, t3], alpha: 0, duration: 600, onComplete: () => this.close() });
    };
    const timer = this.time.delayedCall(4200, done);
    bg.on('pointerdown', () => {
      timer.remove();
      done();
    });
  }
}

// -------------------------------------------------------------- document viewer ----
export class DocScene extends Overlay {
  private docId = '';
  constructor() {
    super('doc');
  }
  init(data: { id: string; onClose?: () => void }) {
    super.init(data);
    this.docId = data.id;
  }
  create() {
    const doc = ctl.game.content.docs[this.docId];
    this.backdrop(0.7).on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown() || !this.paper.getBounds().contains(p.x, p.y)) this.close();
    });
    audio.sfx(doc?.style === 'photo' ? 'page_turn' : 'paper_rustle');
    const style = doc?.style ?? 'paper';
    const frame = `doc_${style}`;
    this.paper = this.add.image(160, 90, 'ui', this.textures.get('ui').has(frame) ? frame : 'doc_paper');
    const pb = this.paper.getBounds();
    const ink = style === 'carbon' ? 0x1c2a52 : style === 'note' ? 0x2c3a6a : style === 'photo' ? 0xe8e0d0 : 0x2a2018;
    let y = pb.y + 8;
    const title = this.add.bitmapText(pb.x + 10, y, 'nl', (doc?.title ?? this.docId).toUpperCase()).setTint(ink);
    y += 13;
    if (doc?.image && this.textures.exists('docimg:' + doc.image)) {
      const img = this.add.image(160, y, 'docimg:' + doc.image).setOrigin(0.5, 0);
      y += img.height + 4;
    }
    const body = this.add.bitmapText(pb.x + 10, y, 'nl', doc?.text ?? '').setMaxWidth(pb.width - 20).setTint(ink);
    // paginate long documents by scrolling
    const maxH = pb.bottom - y - 8;
    const mask = this.make.graphics({}).fillRect(pb.x, y, pb.width, maxH).createGeometryMask();
    body.setMask(mask);
    if (body.height > maxH) {
      const more = this.add.bitmapText(pb.right - 8, pb.bottom - 4, 'nl', 'scroll ▼'.replace('▼', 'v'))
        .setOrigin(1, 1).setTint(0x7a6a50);
      let off = 0;
      const scroll = (d: number) => {
        off = Phaser.Math.Clamp(off + d, 0, body.height - maxH + 4);
        body.setY(y - off);
        more.setVisible(off < body.height - maxH);
      };
      this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => scroll(dy > 0 ? 10 : -10));
      this.input.keyboard?.on('keydown-DOWN', () => scroll(10));
      this.input.keyboard?.on('keydown-UP', () => scroll(-10));
    }
    void title;
    this.closeButton(pb.right - 2, pb.y + 2);
    this.onKey('ESC');
    this.onKey('SPACE');
    if (ctl.fast && ctl.autoOverlays) this.time.delayedCall(5, () => this.close());
  }
  private paper!: Phaser.GameObjects.Image;
}

// ------------------------------------------------------------------- close-ups ----
export class CloseupScene extends Overlay {
  private def!: CloseupDef;
  private digits: number[] = [];
  private texts: Phaser.GameObjects.BitmapText[] = [];
  private patches: [string, string][] = [];
  private pending: string | null = null;
  private gfx!: Phaser.GameObjects.Graphics;
  private jackPos: Record<string, [number, number]> = {};
  constructor() {
    super('closeup');
  }
  init(data: { def: CloseupDef; onClose?: () => void }) {
    super.init(data);
    this.def = data.def;
  }
  create() {
    // the scene object is reused for every close-up: reset what the last one left behind
    this.digits = [];
    this.texts = [];
    this.patches = [];
    this.pending = null;
    this.jackPos = {};
    this.backdrop(0.75).on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) this.close();
    });
    this.add.bitmapText(160, 8, 'nlo', this.def.title).setOrigin(0.5, 0).setTint(0xe8d8a8);
    if (this.def.kind === 'combo') this.buildCombo();
    else this.buildPatch();
    this.closeButton(306, 12);
    this.onKey('ESC');
    if (ctl.fast && ctl.autoOverlays) this.time.delayedCall(5, () => this.close());
  }

  private buildCombo() {
    const n = this.def.wheels ?? this.def.solution.length;
    this.digits = new Array(n).fill(0);
    this.add.image(160, 92, 'ui', 'lock_plate');
    const x0 = 160 - ((n - 1) * 26) / 2;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * 26;
      this.add.image(x, 88, 'ui', 'wheel');
      const t = this.add.bitmapText(x, 88, 'nlo', '0').setOrigin(0.5).setScale(2).setTint(0xf0e0b0);
      this.texts.push(t);
      const up = this.add.image(x, 64, 'ui', 'wheel_up').setInteractive({ useHandCursor: true });
      const dn = this.add.image(x, 112, 'ui', 'wheel_dn').setInteractive({ useHandCursor: true });
      up.on('pointerdown', () => this.turn(i, 1));
      dn.on('pointerdown', () => this.turn(i, -1));
    }
    const tryBtn = this.add.image(160, 140, 'ui', 'btn_try').setInteractive({ useHandCursor: true });
    tryBtn.on('pointerover', () => tryBtn.setFrame('btn_try_hi'));
    tryBtn.on('pointerout', () => tryBtn.setFrame('btn_try'));
    tryBtn.on('pointerdown', () => this.submit(this.digits.join('')));
    this.add.bitmapText(160, 164, 'nl', 'Click above/below a wheel to turn it. Right-click to step back.')
      .setOrigin(0.5).setTint(0x8a7a60);
  }

  private turn(i: number, d: number) {
    this.digits[i] = (this.digits[i] + d + 10) % 10;
    this.texts[i].setText(String(this.digits[i]));
    audio.sfx('wheel_click');
  }

  private buildPatch() {
    const jacks = this.def.jacks ?? [];
    this.add.image(160, 92, 'ui', 'patch_panel');
    this.gfx = this.add.graphics();
    const cols = Math.ceil(jacks.length / 2);
    jacks.forEach((j, i) => {
      const row = i < cols ? 0 : 1;
      const col = row === 0 ? i : i - cols;
      const x = 160 - ((cols - 1) * 44) / 2 + col * 44;
      const y = row === 0 ? 70 : 118;
      this.jackPos[j] = [x, y];
      const img = this.add.image(x, y, 'ui', 'jack').setInteractive({ useHandCursor: true });
      img.on('pointerdown', () => this.clickJack(j));
      this.add.bitmapText(x, row === 0 ? y - 12 : y + 12, 'nl', j).setOrigin(0.5).setTint(0xd0c090);
    });
    const done = this.add.image(160, 150, 'ui', 'btn_try').setInteractive({ useHandCursor: true });
    done.on('pointerdown', () => {
      const code = this.patches.map(([a, b]) => [a, b].sort().join('-')).sort().join(',');
      void this.submit(code);
    });
    const clear = this.add.bitmapText(250, 150, 'nlo', 'Pull cables').setOrigin(0.5).setTint(0xc09070)
      .setInteractive({ useHandCursor: true });
    clear.on('pointerdown', () => {
      this.patches = [];
      this.pending = null;
      this.drawCables();
    });
  }

  private clickJack(j: string) {
    audio.sfx('switch');
    if (!this.pending) {
      this.pending = j;
    } else if (this.pending === j) {
      this.pending = null;
    } else {
      this.patches = this.patches.filter(([a, b]) => a !== j && b !== j && a !== this.pending && b !== this.pending);
      this.patches.push([this.pending, j]);
      this.pending = null;
    }
    this.drawCables();
  }

  private drawCables() {
    const g = this.gfx;
    g.clear();
    for (const [a, b] of this.patches) {
      const [x1, y1] = this.jackPos[a];
      const [x2, y2] = this.jackPos[b];
      g.lineStyle(2, 0x8a1a14, 1);
      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(x1, y1), new Phaser.Math.Vector2((x1 + x2) / 2, Math.max(y1, y2) + 20),
        new Phaser.Math.Vector2(x2, y2));
      curve.draw(g, 24);
    }
    if (this.pending) {
      const [x, y] = this.jackPos[this.pending];
      g.lineStyle(1, 0xffe080, 1).strokeCircle(x, y, 7);
    }
  }

  private async submit(code: string) {
    const g = ctl.game;
    if (g.checkCode(this.def.id, code)) {
      audio.sfx(this.def.kind === 'combo' ? 'unlock' : 'switch');
      this.close();
      await g.trySolve(this.def.id, code);
    } else {
      await g.trySolve(this.def.id, code, true);
      this.cameras.main.shake(120, 0.01);
    }
  }
}
