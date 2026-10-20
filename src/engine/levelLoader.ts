import type { LevelConfig } from '../levels/types';
import { levelLoaders } from '../levels/registry';

const cache = new Map<string, Promise<LevelConfig>>();

export function isLevelImplemented(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(levelLoaders, id);
}

/**
 * Nạp cấu hình màn theo nhu cầu (code-split theo màn).
 * Kết quả được cache để chuyển qua lại không phải tải lại.
 */
export function loadLevelConfig(id: string): Promise<LevelConfig> {
  const cached = cache.get(id);
  if (cached) return cached;
  const loader = levelLoaders[id];
  if (!loader) return Promise.reject(new Error(`Màn "${id}" chưa được mở.`));
  const promise = loader().then((mod) => mod.config);
  cache.set(id, promise);
  return promise;
}
