import { cellKey, type CellKey, type Grid } from './events';
import { mulberry32, shuffle } from './rng';

export interface GridSpec {
  w: number;
  h: number;
  /** Mật độ tường 0..0.6 (giới hạn để màn chơi luôn còn lối đi). */
  density: number;
  seed: number;
  start: CellKey;
  goal: CellKey;
}

export function idx(grid: { w: number }, x: number, y: number): number {
  return y * grid.w + x;
}

export function inBounds(grid: { w: number; h: number }, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < grid.w && y < grid.h;
}

/** Bốn ô kề (không chéo) – hướng cố định để kết quả tái lập. */
export function neighbors(grid: Grid, k: CellKey): CellKey[] {
  const comma = k.indexOf(',');
  const x = Number(k.slice(0, comma));
  const y = Number(k.slice(comma + 1));
  const out: CellKey[] = [];
  if (y > 0) out.push(cellKey(x, y - 1));
  if (x < grid.w - 1) out.push(cellKey(x + 1, y));
  if (y < grid.h - 1) out.push(cellKey(x, y + 1));
  if (x > 0) out.push(cellKey(x - 1, y));
  return out;
}

export function wallAt(grid: Grid, x: number, y: number): boolean {
  if (!inBounds(grid, x, y)) return true;
  return grid.walls[y * grid.w + x] === 1;
}

/**
 * Tạo lưới có tường ngẫu nhiên nhưng LUÔN còn ít nhất một đường đi từ start tới goal.
 * Cách làm: khoét trước một đường đi quanh co (random DFS trên lưới trống) rồi mới rải tường
 * ở các ô còn lại. Nhờ vậy học sinh không bao giờ gặp bản đồ "bịt kín" ngoài ý muốn.
 */
export function generateGrid(spec: GridSpec): Grid {
  const { w, h, start, goal } = spec;
  const density = Math.min(0.6, Math.max(0, spec.density));
  const rng = mulberry32(spec.seed);

  const walls = new Uint8Array(w * h);
  const reserved = new Set<CellKey>();
  reserved.add(start);
  reserved.add(goal);

  // 1) Khoét đường đi bảo đảm thông suốt.
  const seen = new Set<CellKey>([start]);
  const parent = new Map<CellKey, CellKey>();
  const stack: CellKey[] = [start];
  const emptyGrid: Grid = { w, h, walls };
  let guard = 0;
  while (stack.length > 0 && guard < w * h * 4) {
    guard += 1;
    const cur = stack.pop() as CellKey;
    if (cur === goal) break;
    const nbs = shuffle(rng, neighbors(emptyGrid, cur));
    for (const nb of nbs) {
      if (seen.has(nb)) continue;
      seen.add(nb);
      parent.set(nb, cur);
      stack.push(nb);
    }
  }
  let walk: CellKey | undefined = goal;
  while (walk !== undefined) {
    reserved.add(walk);
    walk = parent.get(walk);
  }

  // 2) Rải tường ở những ô không thuộc đường đi bảo đảm.
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const k = cellKey(x, y);
      if (reserved.has(k)) continue;
      if (rng() < density) walls[y * w + x] = 1;
    }
  }

  return { w, h, walls };
}

export function cloneGrid(grid: Grid): Grid {
  return { w: grid.w, h: grid.h, walls: Uint8Array.from(grid.walls) };
}

/** Bật/tắt tường tại một ô (dùng khi học sinh chỉnh bản đồ). */
export function toggleWall(grid: Grid, k: CellKey, on?: boolean): Grid {
  const next = cloneGrid(grid);
  const comma = k.indexOf(',');
  const x = Number(k.slice(0, comma));
  const y = Number(k.slice(comma + 1));
  if (!inBounds(next, x, y)) return next;
  const i = y * next.w + x;
  const wantWall = on ?? next.walls[i] !== 1;
  next.walls[i] = wantWall ? 1 : 0;
  return next;
}

/** Đếm số tường, hiển thị trong panel tham số. */
export function countWalls(grid: Grid): number {
  let n = 0;
  for (let i = 0; i < grid.walls.length; i += 1) if (grid.walls[i] === 1) n += 1;
  return n;
}
