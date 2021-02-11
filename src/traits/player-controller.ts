import { Entity, Level, Trait, Vec2 } from '@nymphajs/core';
import { Killable, KILLABLE_TRAIT } from './killable';

export const PLAYER_CONTROLLER_TRAIT = 'playerController';

export class PlayerController extends Trait {
  private player: Entity | null = null;
  checkpoint = new Vec2(0, 0);

  constructor() {
    super(PLAYER_CONTROLLER_TRAIT);
  }

  setPlayer(entity: Entity) {
    this.player = entity;
  }

  update(entity: Entity, deltaTime: number, level: Level) {
    if (!this.player) {
      return;
    }

    if (!level.entities.has(this.player)) {
      const { x, y } = this.checkpoint;
      this.player.pos.set(x, y);
      this.player.getTrait<Killable>(KILLABLE_TRAIT).revive();
      level.entities.add(this.player);
    }
  }
}