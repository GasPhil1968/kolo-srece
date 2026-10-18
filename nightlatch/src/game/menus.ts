// City map, pause menu (save/load/settings), title screen and ending.
import Phaser from 'phaser';
import { f, setLang, t } from '../i18n';
import { ctl } from './controller';
import { Overlay } from './overlays';
import { audio, deleteSave, latestSave, readSave, readSaveMeta, saveSettings, settings, SLOTS } from './services';
import { applyScaling, fadeAndRun } from './scaling';

const CREAM = 0xe8d8a8;
const DIM = 0x9a8a6a;
const HOT = 0xffffff;

function textButton(scene: Phaser.Scene, x: number, y: number, label: string, fn: () => void, opts: { scale?: number; tint?: number } = {}) {
  const tint = opts.tint ?? CREAM;
  const t = scene.add.bitmapText(x, y, 'nlo', label).setOrigin(0.5).setTint(tint).setScale(opts.scale ?? 1)
    .setInteractive({ useHandCursor: true });
  t.on('pointerover', () => {
    t.setTint(HOT);
    audio.sfx('ui_hover');
  });
  t.on('pointerout', () => t.setTint(tint));
  t.on('pointerdown', (p: Phaser.Input.Pointer) => {
    if (p.rightButtonDown()) return;
    audio.sfx('ui_click');
    fn();
  });
  return t;
}

// ------------------------------------------------------------------------ map ----
export class MapScene extends Overlay {
  constructor() {
    super('map');
  }
  create() {
    this.add.image(0, 0, 'map').setOrigin(0, 0).setInteractive().on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) this.close();
    });
    audio.sfx('paper_rustle');
    const g = ctl.game;
    const title = this.add.bitmapText(160, 4, 'nlo', 'BRACKWATER').setOrigin(0.5, 0).setTint(0xd8c890);
    const label = this.add.bitmapText(160, 168, 'nlo', 'Where to?').setOrigin(0.5, 0).setTint(CREAM);
    void title;
    const here = g.state.room;
    for (const loc of g.locations()) {
      const { room } = g.locationRoom(loc);
      const isHere = room === here || g.content.locations[loc.id]?.room === here;
      const pin = this.add.image(loc.x, loc.y, 'ui', isHere ? 'pin_here' : 'pin').setInteractive({ useHandCursor: true });
      const name = this.add.bitmapText(loc.x, loc.y - 7, 'nlo', loc.name).setOrigin(0.5, 1).setTint(CREAM).setVisible(false);
      pin.on('pointerover', () => {
        pin.setFrame(isHere ? 'pin_here' : 'pin_hi');
        name.setVisible(true);
        label.setText(isHere ? f('{0} (you are here)', t(loc.name)) : f('Go to {0}', t(loc.name)));
        audio.sfx('ui_hover');
      });
      pin.on('pointerout', () => {
        pin.setFrame(isHere ? 'pin_here' : 'pin');
        name.setVisible(false);
        label.setText('Where to?');
      });
      pin.on('pointerdown', () => {
        if (isHere) return this.close();
        audio.sfx('ui_click');
        this.close();
        void g.perform({ t: 'travel', loc: loc.id });
      });
    }
    this.closeButton(310, 9);
    this.onKey('ESC');
    this.onKey('M');
  }
}

// ----------------------------------------------------------------------- menu ----
export class MenuScene extends Overlay {
  private objs: Phaser.GameObjects.GameObject[] = [];
  private fromTitle = false;
  constructor() {
    super('menu');
  }
  init(data: { onClose?: () => void; fromTitle?: boolean; page?: string }) {
    super.init(data);
    this.fromTitle = !!data.fromTitle;
    this.startPage = data.page ?? 'main';
  }
  private startPage = 'main';
  create() {
    this.add.rectangle(0, 0, 320, 180, 0x000000, 0.72).setOrigin(0, 0).setInteractive()
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.rightButtonDown()) this.close();
      });
    this.add.image(160, 90, 'ui', 'menu_panel');
    this.onKey('ESC');
    this.page(this.startPage);
  }
  private clear() {
    for (const o of this.objs) o.destroy();
    this.objs = [];
  }
  private t(x: number, y: number, s: string, tint = DIM) {
    const o = this.add.bitmapText(x, y, 'nlo', s).setOrigin(0.5).setTint(tint);
    this.objs.push(o);
    return o;
  }
  private b(x: number, y: number, s: string, fn: () => void) {
    const o = textButton(this, x, y, s, fn);
    this.objs.push(o);
    return o;
  }
  page(name: string) {
    this.clear();
    if (name === 'main') {
      this.t(160, 40, 'PAUSED', CREAM);
      this.b(160, 60, 'Resume', () => this.close());
      this.b(160, 74, 'Save game', () => this.page('save'));
      this.b(160, 88, 'Load game', () => this.page('load'));
      this.b(160, 102, 'Settings', () => this.page('settings'));
      this.b(160, 116, 'Quit to title', () => this.page('quit'));
      this.t(160, 140, 'Tab/Space: show hotspots  N: notebook  M: map  H: hint', 0x7a6a50);
    } else if (name === 'save' || name === 'load') {
      this.t(160, 32, name === 'save' ? 'SAVE GAME' : 'LOAD GAME', CREAM);
      SLOTS.forEach((slot, i) => {
        const m = readSaveMeta(slot);
        const sl = slot === 'auto' ? t('Auto') : f('Slot {0}', slot);
        const label = m ? `${sl}: ${t(m.label)} (${fmtTime(m.time)})` : `${sl}: ${t('empty')}`;
        const canUse = name === 'save' ? slot !== 'auto' : !!m;
        const y = 48 + i * 12;
        if (canUse) {
          this.b(160, y, truncate(label, 52), () => {
            if (name === 'save') {
              ctl.save(slot);
              audio.sfx('pencil');
              this.page('save');
            } else {
              const st = readSave(slot);
              if (!st) {
                this.t(160, 140, 'That save is damaged.', 0xff8060);
                return;
              }
              this.close();
              fadeAndRun(() => (this.game.scene.getScene('title') as TitleScene).launchGame(st));
            }
          });
        } else this.t(160, y, truncate(label, 52), 0x5a5040);
      });
      if (name === 'save') this.t(160, 136, 'Click a slot to save. Autosaves happen at milestones.', 0x7a6a50);
      if (name === 'load') {
        this.b(270, 136, 'Delete...', () => this.page('delete'));
      }
      this.b(160, 150, 'Back', () => (this.fromTitle && name === 'load' ? this.close() : this.page('main')));
    } else if (name === 'delete') {
      this.t(160, 32, 'DELETE A SAVE', CREAM);
      SLOTS.forEach((slot, i) => {
        const m = readSaveMeta(slot);
        if (!m) return;
        this.b(160, 48 + i * 12, slot === 'auto' ? t('Delete autosave') : f('Delete slot {0}', slot), () => {
          deleteSave(slot);
          this.page('delete');
        });
      });
      this.b(160, 150, 'Back', () => this.page('load'));
    } else if (name === 'settings') {
      this.t(160, 32, 'SETTINGS', CREAM);
      const row = (y: number, label: string, value: string, dec: () => void, inc: () => void) => {
        this.t(110, y, label);
        this.b(170, y, '<', () => {
          dec();
          saveSettings();
          audio.refreshVolumes();
          this.page('settings');
        });
        this.t(205, y, value, CREAM);
        this.b(240, y, '>', () => {
          inc();
          saveSettings();
          audio.refreshVolumes();
          this.page('settings');
        });
      };
      const pct = (v: number) => `${Math.round(v * 100)}%`;
      row(52, 'Music', pct(settings.music), () => (settings.music = Math.max(0, settings.music - 0.1)),
        () => (settings.music = Math.min(1, settings.music + 0.1)));
      row(66, 'Sound', pct(settings.sfx), () => (settings.sfx = Math.max(0, settings.sfx - 0.1)),
        () => (settings.sfx = Math.min(1, settings.sfx + 0.1)));
      const speeds = [0.6, 1, 1.6];
      const sname = (v: number) => (v < 0.8 ? 'Slow' : v > 1.2 ? 'Fast' : 'Normal');
      row(80, 'Text speed', sname(settings.textSpeed), () => {
        const i = speeds.indexOf(settings.textSpeed);
        settings.textSpeed = speeds[Math.max(0, (i < 0 ? 1 : i) - 1)];
      }, () => {
        const i = speeds.indexOf(settings.textSpeed);
        settings.textSpeed = speeds[Math.min(2, (i < 0 ? 1 : i) + 1)];
      });
      row(94, 'Pixel-perfect', settings.pixelPerfect ? 'On' : 'Off', () => {
        settings.pixelPerfect = !settings.pixelPerfect;
        applyScaling(this.game);
      }, () => {
        settings.pixelPerfect = !settings.pixelPerfect;
        applyScaling(this.game);
      });
      row(108, 'Hints', settings.hints ? 'On' : 'Off', () => (settings.hints = !settings.hints),
        () => (settings.hints = !settings.hints));
      const flipLang = () => {
        settings.lang = settings.lang === 'de' ? 'en' : 'de';
        setLang(settings.lang);
        refreshAllText(this.game);
      };
      row(122, 'Language', settings.lang === 'de' ? 'Deutsch' : 'English', flipLang, flipLang);
      this.b(160, 138, this.scale.isFullscreen ? 'Leave fullscreen' : 'Fullscreen', () => {
        if (this.scale.isFullscreen) this.scale.stopFullscreen();
        else this.scale.startFullscreen();
        this.time.delayedCall(300, () => this.page('settings'));
      });
      this.b(160, 158, 'Back', () => (this.fromTitle ? this.close() : this.page('main')));
    } else if (name === 'quit') {
      this.t(160, 60, 'Return to the title screen?', CREAM);
      this.t(160, 74, 'Unsaved progress since the last autosave is lost.');
      this.b(130, 100, 'Yes', () => {
        this.close();
        fadeAndRun(() => (this.game.scene.getScene('title') as TitleScene).backToTitle());
      });
      this.b(190, 100, 'No', () => this.page('main'));
    }
  }
}

function fmtTime(sec: number) {
  const m = Math.floor((sec || 0) / 60);
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

// ---------------------------------------------------------------------- title ----
export class TitleScene extends Phaser.Scene {
  private menu: Phaser.GameObjects.GameObject[] = [];
  private rain!: Phaser.GameObjects.Graphics;
  private drops: { x: number; y: number; v: number }[] = [];
  constructor() {
    super('title');
  }
  create() {
    this.add.image(0, 0, 'title').setOrigin(0, 0);
    if (this.textures.exists('title_logo')) this.add.image(160, 40, 'title_logo');
    this.rain = this.add.graphics();
    for (let i = 0; i < 120; i++) this.drops.push({ x: Math.random() * 340, y: Math.random() * 180, v: 150 + Math.random() * 120 });
    audio.attach(this, this.cache.json.get('audioManifest'));
    audio.play('music', 'title');
    audio.play('amb', 'rain_street');
    this.buildMenu();
    this.add.bitmapText(316, 176, 'nl', 'v1.0').setOrigin(1, 1).setTint(0x4a4038);
  }
  buildMenu() {
    for (const o of this.menu) o.destroy();
    this.menu = [];
    const items: [string, () => void][] = [];
    const last = latestSave();
    if (last) items.push(['Continue', () => {
      const st = readSave(last);
      if (st) fadeAndRun(() => this.launchGame(st));
    }]);
    items.push(['New game', () => fadeAndRun(() => this.launchGame())]);
    items.push(['Load game', () => this.openMenu('load')]);
    items.push(['Settings', () => this.openMenu('settings')]);
    items.push(['Credits', () => this.showCredits()]);
    items.forEach(([label, fn], i) => {
      this.menu.push(textButton(this, 160, 104 + i * 13, label, fn));
    });
  }
  openMenu(page: string) {
    this.scene.run('menu', { fromTitle: true, page, onClose: () => this.buildMenu() });
    this.scene.bringToTop('menu');
  }
  showCredits() {
    this.scene.run('end', { creditsOnly: true, onClose: () => this.buildMenu() });
    this.scene.bringToTop('end');
  }
  update(_t: number, dt: number) {
    const g = this.rain;
    g.clear();
    g.lineStyle(1, 0x8fa6c4, 0.4);
    for (const d of this.drops) {
      d.y += (d.v * dt) / 1000;
      d.x -= (d.v * dt) / 1000 * 0.15;
      if (d.y > 180) {
        d.y = -6;
        d.x = Math.random() * 340;
      }
      g.lineBetween(Math.round(d.x), Math.round(d.y), Math.round(d.x - 1), Math.round(d.y + 5));
    }
  }

  /** Start a new game (no state) or resume a saved one. */
  async launchGame(state?: import('../engine/state').GameState) {
    const sm = this.scene;
    // Scene operations are queued until the next game step: let a running game shut down
    // completely before the new one is built, or the shutdown would tear the new room down.
    const nextStep = () => new Promise<void>((r) => this.game.events.once(Phaser.Core.Events.POST_STEP, () => r()));
    let stopped = false;
    for (const k of ['room', 'hud', 'notebook', 'map', 'menu', 'doc', 'closeup', 'card', 'end']) {
      if (sm.isActive(k) || sm.isPaused(k) || sm.isSleeping(k)) {
        sm.stop(k);
        stopped = true;
      }
    }
    if (stopped) await nextStep();
    ctl.newGame(state);
    sm.run('room');
    sm.run('hud');
    sm.bringToTop('hud');
    sm.sleep('title');
    await nextStep();
    const room = sm.get('room') as unknown as { loadRoom(id: string, at?: string): Promise<void> };
    audio.attach(sm.get('hud'), this.cache.json.get('audioManifest'));
    if (state) {
      const g = ctl.game;
      await room.loadRoom(state.room);
      const def = g.content.rooms[state.room];
      audio.play('music', g.pickVal(def.music) ?? null);
      audio.play('amb', g.pickVal(def.amb) ?? null);
      ctl.presenter.refresh();
    } else {
      await ctl.game.start();
    }
  }

  backToTitle() {
    const sm = this.scene;
    for (const k of ['room', 'hud', 'notebook', 'map', 'menu', 'doc', 'closeup', 'card', 'end']) if (sm.isActive(k)) sm.stop(k);
    sm.wake('title');
    sm.bringToTop('title');
    audio.attach(this, this.cache.json.get('audioManifest'));
    audio.play('music', 'title');
    audio.play('amb', 'rain_street');
    this.buildMenu();
  }
}

// -------------------------------------------------------------------- ending ----
export class EndScene extends Overlay {
  private creditsOnly = false;
  constructor() {
    super('end');
  }
  init(data: { onClose?: () => void; creditsOnly?: boolean }) {
    super.init(data);
    this.creditsOnly = !!data.creditsOnly;
  }
  create() {
    this.add.rectangle(0, 0, 320, 180, 0x000000, 1).setOrigin(0, 0).setInteractive();
    const lines = (this.cache.text.get('credits') as string | undefined)?.split('\n') ?? ['NIGHT LATCH'];
    if (!this.creditsOnly) audio.play('music', 'ending');
    const container = this.add.container(0, 190);
    let y = 0;
    for (const line of lines) {
      const big = line.startsWith('# ');
      const t = this.add.bitmapText(160, y, 'nlo', big ? line.slice(2) : line).setOrigin(0.5, 0)
        .setTint(big ? 0xe8d8a8 : 0xa89a7a).setScale(big ? 2 : 1).setMaxWidth(big ? 140 : 280).setCenterAlign();
      container.add(t);
      y += big ? 24 : 11;
    }
    const total = y + 200;
    const dur = ctl.fast ? 10 : total * 75;
    this.tweens.add({
      targets: container, y: -y - 20, duration: dur, ease: 'Linear',
      onComplete: () => this.finish(),
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown() || this.creditsOnly) this.finish();
    });
    this.onKey('ESC', () => this.finish());
  }
  finish() {
    if (this.creditsOnly) return this.close();
    const cb = this.onClose;
    this.onClose = null;
    cb?.();
    this.scene.stop();
    const title = this.scene.get('title') as TitleScene;
    title.backToTitle();
  }
}

export { Overlay };

/** After switching language: rebuild the title menu and refresh the HUD's texts. */
function refreshAllText(game: Phaser.Game) {
  const title = game.scene.getScene('title') as TitleScene;
  if (game.scene.isSleeping('title') === false && game.scene.isActive('title')) title.buildMenu();
  const hud = game.scene.getScene('hud') as unknown as { refresh?: () => void };
  if (game.scene.isActive('hud')) hud.refresh?.();
}
