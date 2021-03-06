import {
  TimedScene,
  Entity,
  GameContext,
  Level,
  SceneRunner,
  Timer,
  Scene,
} from '@nymphajs/core';
import { CanvasModule } from '@nymphajs/dom-api';
import { loadEntities } from './entities';
import { setupKeyboard } from './input';
import { createCollisionLayer } from './layers/collision-layer';
import { createColorLayer } from './layers/color-layer';
import { createDashboardLayer } from './layers/dashboard-layer';
import { createPlayerProgressLayer } from './layers/player-progress-layer';
import { createTextLayer } from './layers/text-layer';
import { loadFont } from './loaders/font-loader';
import { createLevelLoader } from './loaders/level-loader';
import { createPlayerEnv, findPlayers, makePlayer } from './player';
import { BrickCollisionHandler } from './tiles/brick';
import { CoinCollisionHandler } from './tiles/coin';
import { GroundCollisionHandler } from './tiles/ground';

async function main(canvas: HTMLCanvasElement) {
  const videoContext = canvas.getContext('2d')!;
  const audioContext = new AudioContext();

  const [entityFactory, font] = await Promise.all([
    loadEntities(audioContext),
    loadFont(),
  ]);

  const loadLevel = createLevelLoader(entityFactory);
  const sceneRunner = new SceneRunner();

  const mario = entityFactory.mario();
  makePlayer(mario, 'MARIO');

  const inputRouter = setupKeyboard(window);
  inputRouter.addReceiver(mario);

  async function runLevel(name: string) {
    const loadScreen = new Scene();
    loadScreen.compositor.addLayer(createColorLayer('#000'));
    loadScreen.compositor.addLayer(createTextLayer(font, `Loading ${name}...`));
    sceneRunner.addScene(loadScreen);
    sceneRunner.runNext();

    const level = await loadLevel(name);

    level.events.listen<any>(
      Level.EVENT_TRIGGER,
      (spec: TriggerSpec, trigger: Entity, touches: Set<Entity>) => {
        if (spec.type === 'goto') {
          for (const _ of findPlayers(touches)) {
            runLevel(spec.name);
            return;
          }
        }
      }
    );

    const playerProgressLayer = createPlayerProgressLayer(font, level);
    const dashboardLayer = createDashboardLayer(font, level);

    mario.pos.set(0, 0);
    mario.vel.set(0, 0);
    level.entities.add(mario);

    const playerEnv = createPlayerEnv(mario);
    level.entities.add(playerEnv);

    const waitScreen = new TimedScene();
    waitScreen.compositor.addLayer(createColorLayer('#000'));
    waitScreen.compositor.addLayer(dashboardLayer);
    waitScreen.compositor.addLayer(playerProgressLayer);
    sceneRunner.addScene(waitScreen);

    level.compositor.addLayer(createCollisionLayer(level));
    level.compositor.addLayer(dashboardLayer);

    level.tileCollider.addCollisionHandler(new GroundCollisionHandler());
    level.tileCollider.addCollisionHandler(new BrickCollisionHandler());
    level.tileCollider.addCollisionHandler(new CoinCollisionHandler());

    sceneRunner.addScene(level);

    sceneRunner.runNext();
  }

  const gameContext: GameContext = {
    deltaTime: 0,
    videoContext,
    audioContext,
    entityFactory,
  };

  function update(deltaTime: number) {
    gameContext.deltaTime = deltaTime;
    sceneRunner.update(gameContext);
  }

  const timer = new Timer(1 / 60);
  timer.setUpdateFn(update);
  timer.start();
  runLevel('1-1');
}

const canvasModule = new CanvasModule();
const { canvas } = canvasModule.init('#canvas-container');

const start = () => {
  window.removeEventListener('click', start);
  main(canvas);
};
window.addEventListener('click', start);
