import Phaser from 'phaser';
import { LevelBfsDfsScene } from './levels/LevelBfsDfsScene';
import { MenuScene } from './MenuScene';
import { ResultScene } from './ResultScene';
import { WorldMapScene, type MapContext } from './WorldMapScene';
import type { LevelSceneApi, LevelSceneContext } from './types';

const WIDTH = 960;
const HEIGHT = 560;

function baseConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO, // WebGL nếu có, tự lùi về Canvas nếu không
    parent,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: '#dff2ff',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    fps: { target: 30, min: 20 }, // tiết kiệm pin cho máy yếu
    render: { antialias: true, powerPreference: 'low-power' },
    audio: { noAudio: true },
    banner: false,
    input: { activePointers: 2 },
  };
}

export interface MountedGame {
  ready: Promise<void>;
  destroy(): void;
  focus(): void;
}

function autoDestroyOnHide(getGame: () => Phaser.Game): () => void {
  const onHide = (): void => {
    try {
      getGame().destroy(true);
    } catch {
      /* trang đang đóng, bỏ qua */
    }
  };
  window.addEventListener('pagehide', onHide);
  return () => window.removeEventListener('pagehide', onHide);
}

export function mountLevel(parent: HTMLElement, ctx: LevelSceneContext): LevelSceneApi {
  const game = new Phaser.Game({
    ...baseConfig(parent),
    scene: [LevelBfsDfsScene, ResultScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set('level-ctx', ctx);
        g.registry.set('reduced-motion', ctx.reducedMotion);
      },
    },
  });

  const sceneOf = (): LevelBfsDfsScene | null =>
    (game.scene.getScene(LevelBfsDfsScene.KEY) as unknown as LevelBfsDfsScene | null) ?? null;

  const ready = new Promise<void>((resolve) => {
    game.events.once('ready', () => {
      const scene = sceneOf();
      if (scene) scene.whenReady().then(resolve, resolve);
      else resolve();
    });
    // Trường hợp game đã boot xong trước khi ta kịp gắn listener.
    window.setTimeout(() => {
      const scene = sceneOf();
      if (scene) scene.whenReady().then(resolve, resolve);
    }, 0);
  });

  const removeHide = autoDestroyOnHide(() => game);

  return {
    ready,
    setBoard: (board) => sceneOf()?.setBoard(board),
    setTool: (tool) => sceneOf()?.setTool(tool),
    setAlgo: (algo) => sceneOf()?.setAlgo(algo),
    renderAt: (events, cursor) => sceneOf()?.renderAt(events, cursor),
    stats: () => sceneOf()?.stats() ?? { visited: 0, opened: 1, pathLen: null, frontier: 1, status: 'running', current: null },
    celebrate: (stars) => sceneOf()?.celebrate(stars),
    exitCelebration: () => sceneOf()?.exitCelebration(),
    focus: () => {
      parent.focus();
      sceneOf()?.focus();
    },
    destroy: () => {
      removeHide();
      game.destroy(true);
    },
  };
}

export function mountWorldMap(parent: HTMLElement, ctx: MapContext): MountedGame {
  const game = new Phaser.Game({
    ...baseConfig(parent),
    scene: [WorldMapScene, MenuScene],
    callbacks: {
      preBoot: (g) => g.registry.set('map-ctx', ctx),
    },
  });
  const ready = new Promise<void>((resolve) => {
    game.events.once('ready', () => resolve());
    window.setTimeout(resolve, 1500);
  });
  const removeHide = autoDestroyOnHide(() => game);
  return {
    ready,
    focus: () => parent.focus(),
    destroy: () => {
      removeHide();
      game.destroy(true);
    },
  };
}
