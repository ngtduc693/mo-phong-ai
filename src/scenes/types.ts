import type { CellKey, SimEvent } from '../core/events';
import type { BoardState } from '../levels/types';

export interface SceneStats {
  visited: number;
  opened: number;
  pathLen: number | null;
  frontier: number;
  status: 'running' | 'win' | 'lose' | 'limit';
  current: string | null;
}

/** Hợp đồng giữa ui/ (bộ điều khiển phát lại) và scenes/ (Phaser). */
export interface LevelSceneApi {
  ready: Promise<void>;
  setBoard(board: BoardState): void;
  setTool(tool: string): void;
  setAlgo(algo: string): void;
  renderAt(events: SimEvent[], cursor: number): void;
  stats(): SceneStats;
  celebrate(stars: number): void;
  exitCelebration(): void;
  focus(): void;
  destroy(): void;
}

export interface LevelSceneContext {
  board: BoardState;
  events: SimEvent[];
  tool: string;
  algo: string;
  reducedMotion: boolean;
  onCellEdit: (cell: CellKey) => void;
}
