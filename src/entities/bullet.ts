import { Entity, GameContext, Level, Trait } from '@nymphajs/core';
import { Renderable, SpriteSheet } from '@nymphajs/dom-api';
import { loadSpriteSheet } from '../loaders/sprite-loader';
import { Gravity } from '../traits/gravity';
import { Killable } from '../traits/killable';
import { Stomper } from '../traits/stomper';
import { Velocity } from '../traits/velocity';

export async function loadBullet() {
  return loadSpriteSheet('bullet').then(createBulletFactory);
}

class Behavior extends Trait {
  private gravity = new Gravity();

  collides(us: Entity, them: Entity) {
    const killable = us.get(Killable);
    if (killable.dead) {
      return;
    }

    if (them.has(Stomper)) {
      if (them.vel.y > us.vel.y) {
        killable.kill();
        us.vel.set(100, -200);
      } else {
        them.get(Killable).kill();
      }
    }
  }

  update(entity: Entity, gameContext: GameContext, level: Level) {
    if (entity.get(Killable).dead) {
      this.gravity.update(entity, gameContext, level);
    }
  }
}

function createBulletFactory(sprite: SpriteSheet) {
  function drawBullet(bullet: Renderable, context: CanvasRenderingContext2D) {
    sprite.draw('bullet', context, 0, 0, bullet.vel.x < 0);
  }

  return function createBullet() {
    const bullet = new Renderable();
    bullet.size.set(16, 14);
    bullet.vel.set(80, 0);

    bullet.addTrait(new Velocity());
    bullet.addTrait(new Behavior());
    bullet.addTrait(new Killable());

    bullet.draw = (ctx) => drawBullet(bullet, ctx);

    return bullet;
  };
}
