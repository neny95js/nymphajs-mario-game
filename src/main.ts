import { GameContext, Timer } from '@nymphajs/core';
import { CanvasModule } from '@nymphajs/dom-api';
import { loadEntities } from './entities';
import { setupKeyboard } from './input';
import { createCollisionLayer } from './layers/collision-layer';
import { createDashboardLayer } from './layers/dashboard-layer';
import { loadFont } from './loaders/font-loader';
import { createLevelLoader } from './loaders/level-loader';
import { createPlayer, createPlayerEnv } from './player';
import { BrickCollisionHandler } from './tiles/brick';
import { CoinCollisionHandler } from './tiles/coin';
import { GroundCollisionHandler } from './tiles/ground';
import { Player, PLAYER_TRAIT } from './traits/player';

async function main(canvas: HTMLCanvasElement) {
  const videoContext = canvas.getContext('2d')!;
  const audioContext = new AudioContext();

  const [entityFactory, font] = await Promise.all([
    loadEntities(audioContext),
    loadFont(),
  ]);

  const loadLevel = createLevelLoader(entityFactory);
  const level = await loadLevel('1-2');

  level.tileCollider.addCollisionHandler(new GroundCollisionHandler());
  level.tileCollider.addCollisionHandler(new BrickCollisionHandler());
  level.tileCollider.addCollisionHandler(new CoinCollisionHandler());

  const mario = createPlayer(entityFactory.mario());
  mario.getTrait<Player>(PLAYER_TRAIT).displayName = 'MARIO';
  level.entities.add(mario);

  const inputRouter = setupKeyboard(window);
  inputRouter.addReceiver(mario);

  const playerEnv = createPlayerEnv(mario);
  level.entities.add(playerEnv);

  level.compositor.addLayer(createCollisionLayer(level));
  level.compositor.addLayer(createDashboardLayer(font, level));

  const gameContext: GameContext = {
    deltaTime: 0,
    videoContext,
    audioContext,
    entityFactory,
  };

  function update(deltaTime: number) {
    gameContext.deltaTime = deltaTime;
    level.update(gameContext);
    level.draw(gameContext);
  }

  const timer = new Timer(1 / 60);
  timer.setUpdateFn(update);
  timer.start();

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      console.log('Animation stopped!');
      cancelAnimationFrame(timer.animationFrameId);
      level.musicController.player?.stopTrack();
    }
  });
}

const canvasModule = new CanvasModule();
const { canvas } = canvasModule.init('#canvas-container');

const start = () => {
  window.removeEventListener('click', start);
  main(canvas);
};
window.addEventListener('click', start);
