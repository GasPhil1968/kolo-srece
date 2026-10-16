// The detective's notebook: case objectives, clues, people, deductions, timeline.
import Phaser from 'phaser';
import { ctl } from './controller';
import { Overlay } from './overlays';
import { audio } from './services';

type Tab = 'case' | 'clues' | 'people' | 'deduce' | 'timeline';
const INK = 0x2a2232;
const INK_SOFT = 0x5a5068;
const HILITE = 0x8a2a1a;

export class NotebookScene extends Overlay {
  private tab: Tab = 'case';
  private objs: Phaser.GameObjects.GameObject[] = [];
  private listScroll = 0;
  private selected: string | null = null;
  private deduceA: string | null = null;
  private deduceB: string | null = null;
  private slots: (string | null)[] = [];
  private pickedCard: string | null = null;
  static lastTab: Tab = 'case';

  constructor() {
    super('notebook');
  }

  create() {
    this.backdrop(0.55).on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) this.close();
    });
    this.add.image(160, 92, 'ui', 'notebook');
    audio.sfx('page_turn');
    const tabs: [Tab, string][] = [['case', 'Case'], ['clues', 'Clues'], ['people', 'People'], ['deduce', 'Deduce'],
      ['timeline', 'Timeline']];
    tabs.forEach(([t, label], i) => {
      const x = 40 + i * 52;
      const img = this.add.image(x, 14, 'ui', 'tab').setInteractive({ useHandCursor: true });
      const txt = this.add.bitmapText(x, 14, 'nl', label).setOrigin(0.5).setTint(0x3a2a20);
      img.on('pointerdown', () => {
        audio.sfx('page_turn');
        this.tab = t;
        this.listScroll = 0;
        this.selected = null;
        this.render();
      });
      void txt;
    });
    this.closeButton(305, 14);
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    this.input.keyboard?.on('keydown-N', () => this.close());
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      this.listScroll = Math.max(0, this.listScroll + (dy > 0 ? 1 : -1));
      this.render();
    });
    this.tab = NotebookScene.lastTab;
    const tl = this.activeTimeline();
    if (tl && !ctl.game.state.flags['tl_' + tl.id]) this.slots = new Array(tl.order.length).fill(null);
    this.render();
  }

  close() {
    NotebookScene.lastTab = this.tab;
    super.close();
  }

  private clear() {
    for (const o of this.objs) o.destroy();
    this.objs = [];
  }

  private text(x: number, y: number, s: string, tint = INK, maxW = 0) {
    const t = this.add.bitmapText(x, y, 'nl', s).setTint(tint);
    if (maxW) t.setMaxWidth(maxW);
    this.objs.push(t);
    return t;
  }

  private button(x: number, y: number, s: string, fn: () => void, tint = HILITE) {
    const t = this.text(x, y, s, tint).setInteractive({ useHandCursor: true });
    t.on('pointerover', () => t.setTint(0xd04020));
    t.on('pointerout', () => t.setTint(tint));
    t.on('pointerdown', fn);
    return t;
  }

  private activeTimeline() {
    return Object.values(ctl.game.content.timelines).find((t) => ctl.game.cond(t.when));
  }

  render() {
    this.clear();
    const g = ctl.game;
    const L = 26;
    const R = 166;
    const T = 28;
    if (this.tab === 'case') {
      const ch = g.chapterDef();
      this.text(L, T, ch ? `CHAPTER ${ch.n}` : 'THE CASE', INK_SOFT);
      this.text(L, T + 11, ch ? ch.title : '', INK, 130);
      let y = T + 30;
      for (const { def, done } of g.objectives()) {
        const t = this.text(L + 8, y, def.text, done ? INK_SOFT : INK, 122);
        this.objs.push(this.add.image(L + 2, y + 3, 'ui', done ? 'check_on' : 'check_off'));
        y += t.height + 4;
        if (y > 150) break;
      }
      this.text(R, T, 'WHAT I KNOW', INK_SOFT);
      const recent = [...g.state.deds].reverse().slice(0, 6);
      let y2 = T + 13;
      for (const d of recent) {
        const t = this.text(R, y2, '— ' + g.content.deductions[d].title, INK, 128);
        y2 += t.height + 3;
      }
      if (!recent.length) this.text(R, y2, 'Not much. Yet.', INK_SOFT);
      this.button(R, 152, '[ Ask for a hint ]', () => {
        const h = g.hint();
        this.text(R, 120, h, HILITE, 128);
      });
      return;
    }
    if (this.tab === 'clues' || this.tab === 'people') {
      const ids = this.tab === 'clues' ? [...g.state.clues].reverse() : g.state.people;
      const getTitle = (id: string) => (this.tab === 'clues' ? g.content.clues[id]?.title : g.content.people[id]?.name) ?? id;
      const per = 12;
      const start = Math.min(this.listScroll, Math.max(0, ids.length - per));
      ids.slice(start, start + per).forEach((id, i) => {
        const sel = id === this.selected;
        this.button(L, T + i * 10, (sel ? '> ' : '') + truncate(getTitle(id), 26), () => {
          this.selected = id;
          this.render();
        }, sel ? HILITE : INK);
      });
      if (!ids.length) this.text(L, T, 'Nothing yet.', INK_SOFT);
      if (ids.length > per) this.text(L, 152, `${start + 1}-${Math.min(ids.length, start + per)} of ${ids.length} (wheel)`, INK_SOFT);
      if (this.selected) {
        if (this.tab === 'clues') {
          const c = g.content.clues[this.selected];
          this.text(R, T, c.title.toUpperCase(), HILITE, 128);
          this.text(R, T + 14, c.text, INK, 128);
          if (c.doc) this.button(R, 152, '[ Read the document ]', () => {
            this.close();
            void g.runTop([{ doc: c.doc! }]);
          });
        } else {
          const pd = g.content.people[this.selected];
          if (pd.portrait && this.textures.get('ui').has('face_' + pd.portrait)) {
            this.objs.push(this.add.image(R + 14, T + 14, 'ui', 'face_' + pd.portrait));
          }
          this.text(R + 32, T, pd.name.toUpperCase(), HILITE, 100);
          let txt = pd.text;
          for (const [c, note] of pd.notes ?? []) if (g.cond(c)) txt += '\n— ' + note;
          this.text(R, T + 32, txt, INK, 128);
        }
      }
      return;
    }
    if (this.tab === 'deduce') {
      this.text(L, T, 'Link two clues that belong together.', INK_SOFT, 130);
      const ids = [...g.state.clues].reverse();
      const per = 11;
      const start = Math.min(this.listScroll, Math.max(0, ids.length - per));
      ids.slice(start, start + per).forEach((id, i) => {
        const on = id === this.deduceA || id === this.deduceB;
        this.button(L, T + 14 + i * 10, (on ? '* ' : '') + truncate(g.content.clues[id].title, 26), () => {
          if (this.deduceA === id) this.deduceA = null;
          else if (this.deduceB === id) this.deduceB = null;
          else if (!this.deduceA) this.deduceA = id;
          else this.deduceB = id;
          audio.sfx('pencil');
          this.render();
        }, on ? HILITE : INK);
      });
      this.text(R, T, 'FIRST', INK_SOFT);
      this.text(R, T + 10, this.deduceA ? g.content.clues[this.deduceA].title : '—', INK, 128);
      this.text(R, T + 40, 'SECOND', INK_SOFT);
      this.text(R, T + 50, this.deduceB ? g.content.clues[this.deduceB].title : '—', INK, 128);
      if (this.deduceA && this.deduceB) {
        this.button(R, T + 84, '[ Connect them ]', () => {
          const a = this.deduceA!;
          const b = this.deduceB!;
          this.deduceA = this.deduceB = null;
          this.close();
          void g.perform({ t: 'deduce', a, b });
        });
      }
      this.text(R, 140, `${g.state.deds.length} deductions made.`, INK_SOFT);
      return;
    }
    if (this.tab === 'timeline') {
      const tl = this.activeTimeline();
      if (!tl) {
        this.text(L, T, "There's no timeline to put together right now.", INK_SOFT, 260);
        return;
      }
      this.text(L, T, tl.title.toUpperCase(), HILITE, 280);
      if (g.state.flags['tl_' + tl.id]) {
        tl.order.forEach((c, i) => {
          const clue = g.content.clues[c];
          this.text(L, T + 14 + i * 11, `${clue.time ?? ''}  ${clue.title}`, INK, 280);
        });
        this.text(L, 150, 'Settled.', INK_SOFT);
        return;
      }
      if (this.slots.length !== tl.order.length) this.slots = new Array(tl.order.length).fill(null);
      const have = tl.order.filter((c) => g.state.clues.includes(c));
      // slots
      this.text(L, T + 12, 'Click a card, then a slot.', INK_SOFT);
      this.slots.forEach((c, i) => {
        const label = c ? `${g.content.clues[c].time ?? ''} ${truncate(g.content.clues[c].title, 22)}` : '...........';
        this.button(L, T + 24 + i * 11, `${i + 1}. ${label}`, () => {
          if (this.pickedCard) {
            const prev = this.slots.indexOf(this.pickedCard);
            if (prev >= 0) this.slots[prev] = null;
            this.slots[i] = this.pickedCard;
            this.pickedCard = null;
          } else this.slots[i] = null;
          audio.sfx('paper_slide');
          this.render();
        }, c ? INK : INK_SOFT);
      });
      // cards
      this.text(R, T + 12, 'CARDS', INK_SOFT);
      const cards = have.filter((c) => !this.slots.includes(c));
      cards.forEach((c, i) => {
        const on = c === this.pickedCard;
        this.button(R, T + 24 + i * 11, `${on ? '> ' : ''}${g.content.clues[c].time ?? '?'} ${truncate(g.content.clues[c].title, 18)}`,
          () => {
            this.pickedCard = on ? null : c;
            this.render();
          }, on ? HILITE : INK);
      });
      if (have.length < tl.order.length) {
        this.text(R, 136, `I'm missing ${tl.order.length - have.length} piece(s) of this.`, INK_SOFT, 128);
      }
      if (this.slots.every((s) => s)) {
        this.button(L, 152, '[ Check the timeline ]', () => {
          const order = this.slots as string[];
          this.close();
          void g.perform({ t: 'timeline', id: tl.id, order });
        });
      }
    }
  }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
