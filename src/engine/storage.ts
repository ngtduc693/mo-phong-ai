/**
 * Lưu tiến trình bằng localStorage — có try/catch vì Safari chế độ riêng tư
 * hoặc máy trường học có thể chặn. Bị chặn thì vẫn chơi bình thường, chỉ không lưu.
 */

const KEY = 'mophongai.progress.v1';

export interface LevelProgress {
  stars: number;
  quizPassed: boolean;
  bestVisited?: number;
  bestPathLen?: number;
}

export interface ProgressData {
  v: 1;
  levels: Record<string, LevelProgress>;
  unlockedAll: boolean;
  sound: boolean;
  reduceMotion: boolean;
}

export function defaultProgress(): ProgressData {
  return { v: 1, levels: {}, unlockedAll: false, sound: false, reduceMotion: false };
}

let memoryFallback: ProgressData | null = null;
let storageBlocked = false;

function safeStorage(): Storage | null {
  if (storageBlocked) return null;
  try {
    const s = globalThis.localStorage;
    if (!s) {
      storageBlocked = true;
      return null;
    }
    return s;
  } catch {
    storageBlocked = true;
    return null;
  }
}

export function isStorageAvailable(): boolean {
  return safeStorage() !== null;
}

export function loadProgress(): ProgressData {
  const s = safeStorage();
  if (!s) return memoryFallback ?? defaultProgress();
  try {
    const raw = s.getItem(KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<ProgressData>;
    return {
      ...defaultProgress(),
      ...parsed,
      levels: parsed.levels && typeof parsed.levels === 'object' ? parsed.levels : {},
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(data: ProgressData): boolean {
  memoryFallback = data;
  const s = safeStorage();
  if (!s) return false;
  try {
    s.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    storageBlocked = true;
    return false;
  }
}

export function updateProgress(mutate: (data: ProgressData) => void): ProgressData {
  const data = loadProgress();
  mutate(data);
  saveProgress(data);
  return data;
}

export function recordLevelResult(
  levelId: string,
  result: { stars: number; quizPassed: boolean; visited?: number; pathLen?: number },
): { progress: ProgressData; newBest: boolean } {
  let newBest = false;
  const progress = updateProgress((data) => {
    const prev = data.levels[levelId] ?? { stars: 0, quizPassed: false };
    const stars = Math.max(prev.stars, result.stars);
    newBest = stars > prev.stars;
    data.levels[levelId] = {
      stars,
      quizPassed: prev.quizPassed || result.quizPassed,
      bestVisited:
        result.visited === undefined
          ? prev.bestVisited
          : Math.min(prev.bestVisited ?? Number.POSITIVE_INFINITY, result.visited),
      bestPathLen:
        result.pathLen === undefined
          ? prev.bestPathLen
          : Math.min(prev.bestPathLen ?? Number.POSITIVE_INFINITY, result.pathLen),
    };
  });
  return { progress, newBest };
}

export function setUnlockAll(value: boolean): ProgressData {
  return updateProgress((data) => {
    data.unlockedAll = value;
  });
}

export function setSound(on: boolean): ProgressData {
  return updateProgress((data) => {
    data.sound = on;
  });
}

export function setReduceMotion(on: boolean): ProgressData {
  return updateProgress((data) => {
    data.reduceMotion = on;
  });
}
