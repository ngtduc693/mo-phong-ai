import type { LevelConfig } from './types';

/** Màn đã triển khai. Thêm màn = thêm một dòng ở đây (dynamic import để tách bundle). */
export const levelLoaders: Record<string, () => Promise<{ config: LevelConfig }>> = {
  'bfs-dfs': () => import('./bfs-dfs'),
};

export const implementedLevelIds: string[] = Object.keys(levelLoaders);
