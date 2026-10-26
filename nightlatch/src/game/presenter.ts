// Runtime implementation of the Presenter: animates, speaks, waits for the player.
import Phaser from 'phaser';
import type { Presenter } from '../engine/presenter';
import type { CloseupDef, DialogDef, Dir, OptionDef } from '../engine/types';
import { f, t } from '../i18n';
import { ctl } from './controller';
import { RoomScene } from './RoomScene';
import { audio, settings } from './services';

type HudLike = {
  chooseOption(options: OptionDef[], dialogId?: string): Promise<OptionDef>;
  pickItem(prompt: string): Promise<string | null>;
  toast(text: string, color?: number): void;
  refresh(): void;
  setFaces(left: string | null, right: string | null): void;
  setSpeech(text: string | null, color?: number): void;
};

export class RuntimePresenter implements Presenter {
  private skipFn: (() => void) | null = null;
  private lineObjs: Phaser.GameObjects.GameObject[] = [];
  /** The other person in the current conversation (shown on the right). */
  private partner: string | null = null;

  private get room(): RoomScene {
    return ctl.phaser.scene.getScene('room') as RoomScene;
  }
  private get hud(): HudLike {
    return ctl.phaser.scene.getScene('hud') as unknown as HudLike;
  }

  /** Rook and the other person in the conversation turn to look at each other. */
  private facePartners() {
    const room = this.room;
    if (!room.sys.isActive() || !this.partner) return;
    const rook = room.actorFor('rook');
    const other = room.actorFor(this.partner);
    if (!rook || !other || !other.sprite.visible) return;
    rook.faceTowards(other.x, other.y);
    other.faceTowards(rook.x, rook.y);
  }

  /** Called by input handlers: finish the current line/wait early. */
  skip() {
    const f = this.skipFn;
    this.skipFn = null;
    f?.();
  }

  private holdFor(ms: number): Promise<void> {
    if (ctl.fast) return Promise.resolve();
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        timer.remove();
        this.skipFn = null;
        resolve();
      };
      const timer = this.room.time.delayedCall(ms, finish);
      // ignore the click that started the action
      this.room.time.delayedCall(150, () => {
        if (!done) this.skipFn = finish;
      });
    });
  }

  private lineMs(text: string) {
    return (1100 + text.length * 48) / settings.textSpeed;
  }

  private clearLine() {
    for (const o of this.lineObjs) o.destroy();
    this.lineObjs = [];
  }

  async say(who: string, text: string) {
    const scene = this.room;
    if (!scene.sys.isActive()) return;
    // Rook alone (looking, thinking) is narration: no box, no faces
    if (who === 'rook' && !this.partner) return this.narrate(text);
    const g = ctl.game;
    const npc = g.content.npcs[who];
    const actor = scene.actorFor(who);
    const color = Phaser.Display.Color.HexStringToColor(who === 'rook' ? '#f2e3b3' : npc?.color ?? '#ffffff').color;
    // Rook on the left; the other person in the conversation on the right
    if (who !== 'rook') this.partner = who;
    this.hud.setFaces('rook', this.partner);
    this.facePartners();
    this.hud.setSpeech(text, color);
    actor?.talk(true);
    audio.duck(true);
    await this.holdFor(this.lineMs(text));
    actor?.talk(false);
    audio.duck(false);
    this.hud.setSpeech(null);
  }

  async narrate(text: string) {
    const scene = this.room;
    if (!scene.sys.isActive()) return;
    this.clearLine();
    this.partner = null;
    this.hud.setFaces(null, null);
    // the narrator has no box: the words sit on the picture, with a dark shadow to stay readable
    const shadow = scene.add.bitmapText(0, 0, 'nlo', text).setMaxWidth(280).setCenterAlign().setTint(0x000000)
      .setDepth(10000).setScrollFactor(0);
    const t = scene.add.bitmapText(0, 0, 'nlo', text).setMaxWidth(280).setCenterAlign().setTint(0xd9c9a0).setDepth(10001)
      .setScrollFactor(0);
    shadow.setOrigin(0.5, 0).setPosition(161, 9);
    t.setOrigin(0.5, 0).setPosition(160, 8);
    this.lineObjs.push(shadow, t);
    await this.holdFor(this.lineMs(text) * 1.1);
    this.clearLine();
  }

  async walk(who: string, target: string | [number, number]) {
    const scene = this.room;
    const a = scene.actorFor(who);
    if (!a) return;
    let to: [number, number];
    let face: Dir | undefined;
    if (typeof target === 'string') {
      const p = scene.meta.points[target];
      if (!p) return;
      to = [p.x, p.y];
      face = p.face;
    } else to = target;
    if (ctl.fast) {
      a.setPos(to[0], to[1]);
    } else if (who === 'rook') {
      const path = scene.nav.find([a.x, a.y], to);
      a.stopWalking();
      await a.walk(path);
    } else {
      a.stopWalking();
      await a.walk([to]);
    }
    if (face) a.face(face);
    if (who === 'rook') ctl.game.state.pos = { x: a.x, y: a.y, face: a.dir };
  }

  face(who: string, dir: Dir) {
    this.room.actorFor(who)?.face(dir);
  }

  async anim(who: string, name: string) {
    const a = this.room.actorFor(who);
    if (!a) return;
    if (name === 'idle' || name === 'release') return a.release();
    if (name.startsWith('hold:')) return a.hold(name.slice(5));
    if (ctl.fast) return;
    await a.play(name);
  }

  async changeRoom(room: string, at?: string) {
    const scene = this.room;
    const cam = scene.cameras.main;
    ctl.inputLocked++;
    try {
      if (scene.roomId && !ctl.fast) await fadeCam(cam, 'out', 260);
      await scene.loadRoom(room, at);
      const g = ctl.game;
      const def = g.content.rooms[room];
      audio.play('music', g.pickVal(def.music) ?? null);
      audio.play('amb', g.pickVal(def.amb) ?? null);
      this.hud.refresh();
      if (!ctl.fast) await fadeCam(cam, 'in', 260);
    } finally {
      ctl.inputLocked--;
    }
  }

  sfx(id: string) {
    audio.sfx(id);
  }
  music(id: string | null) {
    audio.play('music', id);
  }
  amb(id: string | null) {
    audio.play('amb', id);
  }

  wait(ms: number) {
    if (ctl.fast) return Promise.resolve();
    return new Promise<void>((r) => this.room.time.delayedCall(ms, () => r()));
  }

  fade(dir: 'out' | 'in', ms: number) {
    if (ctl.fast) {
      const cam = this.room.cameras.main;
      if (dir === 'in') cam.resetFX();
      return Promise.resolve();
    }
    return fadeCam(this.room.cameras.main, dir, ms);
  }

  card(title: string, sub?: string) {
    return runOverlay('card', { title, sub });
  }

  doc(id: string) {
    return runOverlay('doc', { id });
  }

  closeup(def: CloseupDef) {
    return runOverlay('closeup', { def });
  }

  async choose(options: OptionDef[], dialog: DialogDef) {
    if (dialog.npc) this.partner = dialog.npc;
    this.hud.setFaces('rook', this.partner);
    this.facePartners();
    const picked = await this.hud.chooseOption(options, dialog.id);
    this.hud.setFaces(null, null);
    return picked;
  }

  present(prompt: string) {
    return this.hud.pickItem(prompt);
  }

  notify(kind: 'item' | 'clue' | 'unlock' | 'deduction' | 'person' | 'lost', id: string) {
    const g = ctl.game;
    const c = g.content;
    const text =
      kind === 'item' ? f('Got: {0}', t(c.items[id]?.name ?? id)) :
      kind === 'clue' ? f('Notebook: {0}', t(c.clues[id]?.title ?? id)) :
      kind === 'unlock' ? f('New location: {0}', t(c.locations[id]?.name ?? id)) :
      kind === 'deduction' ? f('Deduction: {0}', t(c.deductions[id]?.title ?? id)) :
      kind === 'person' ? f('New file: {0}', t(c.people[id]?.name ?? id)) :
      'Your pockets feel lighter.';
    const color = kind === 'deduction' ? 0xffd27a : kind === 'clue' ? 0xc8e0a0 : kind === 'unlock' ? 0x9fd0ff : 0xe8d8b0;
    if (kind === 'clue') audio.sfx('pencil');
    if (kind === 'deduction') audio.sfx('clue');
    this.hud.toast(text, color);
  }

  refresh() {
    this.room.refresh();
    this.hud.refresh();
  }

  autosave(label: string) {
    try {
      ctl.save('auto', label);
    } catch (e) {
      console.warn('autosave failed', e);
    }
  }

  effect(kind: 'shake' | 'flash' | 'blur', value: number | string) {
    const cam = this.room.cameras.main;
    if (ctl.fast && kind !== 'blur') return;
    if (kind === 'shake') cam.shake(Number(value) || 250, 0.012);
    else if (kind === 'flash') {
      const c = Phaser.Display.Color.HexStringToColor(String(value || '#ffffff'));
      cam.flash(300, c.red, c.green, c.blue);
    } else this.room.setBlur(Number(value) || 0);
  }

  end() {
    return runOverlay('end', {});
  }
}

export function fadeCam(cam: Phaser.Cameras.Scene2D.Camera, dir: 'out' | 'in', ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (dir === 'out') {
      cam.fadeOut(ms, 0, 0, 0);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => resolve());
    } else {
      cam.fadeIn(ms, 0, 0, 0);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => resolve());
    }
  });
}

/** Launch an overlay scene and resolve when it closes. */
export function runOverlay(key: string, data: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => {
    const sp = ctl.phaser.scene;
    ctl.inputLocked++;
    // the hover sentence belongs to the room, not to whatever is opening over it
    const hud = sp.getScene('hud') as unknown as { sentence?: Phaser.GameObjects.BitmapText };
    if (sp.isActive('hud') && hud.sentence?.active) hud.sentence.setText('');
    const done = () => {
      ctl.inputLocked = Math.max(0, ctl.inputLocked - 1);
      resolve();
    };
    if (sp.isActive(key)) sp.stop(key);
    sp.run(key, { ...data, onClose: done });
    sp.bringToTop(key);
  });
}
