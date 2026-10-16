// Ambient effects composed from existing effect sprites (smoke, fire, dust, rain, birds).
import Phaser from 'phaser';
import type { Engine } from '../core/engine';
import type { RoomDef } from '../core/content';

export class Ambience {
  private objects: Phaser.GameObjects.GameObject[] = [];

  constructor(private scene: Phaser.Scene) {}

  textures(_room: RoomDef): string[] {
    return [];
  }

  build(_room: RoomDef, _engine: Engine): void {
    this.clear();
  }

  update(_dt: number, _engine: Engine): void {
    /* filled per effect */
  }

  clear(): void {
    for (const o of this.objects) o.destroy();
    this.objects = [];
    void this.scene;
  }
}
