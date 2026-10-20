/**
 * Lớp core: kiểu dữ liệu và sự kiện mô phỏng.
 * TUYỆT ĐỐI không import Phaser hay DOM ở đây (xem kiến trúc 3 lớp).
 */

export type CellKey = string; // dạng "x,y"

export interface Grid {
  readonly w: number;
  readonly h: number;
  /** walls[y * w + x] === 1 nghĩa là ô có tường. */
  readonly walls: Uint8Array;
}

export type SearchAlgo = 'bfs' | 'dfs';

export interface RunStats {
  /** Số ô đã mở (lấy ra khỏi hàng đợi / ngăn xếp để xét). */
  visited: number;
  /** Số ô đã được phát hiện và đưa vào cấu trúc dữ liệu. */
  opened: number;
  /** Độ dài đường đi tìm được (số bước), null nếu không tới đích. */
  pathLen: number | null;
}

export interface SimEventBase {
  type: string;
  /** Lời giải thích tiếng Việt cho học sinh, gắn liền với sự kiện. */
  why: string;
}

export interface SearchOpenEvent extends SimEventBase {
  type: 'open';
  cell: CellKey;
  parent: CellKey;
}

export interface SearchVisitEvent extends SimEventBase {
  type: 'visit';
  cell: CellKey;
}

export interface SearchPathEvent extends SimEventBase {
  type: 'path';
  cells: CellKey[];
}

export interface SearchNoPathEvent extends SimEventBase {
  type: 'noPath';
}

export interface SearchDoneEvent extends SimEventBase {
  type: 'done';
  win: boolean;
  stats: RunStats;
}

export interface SearchLimitEvent extends SimEventBase {
  type: 'limit';
}

export type SimEvent =
  | SearchOpenEvent
  | SearchVisitEvent
  | SearchPathEvent
  | SearchNoPathEvent
  | SearchDoneEvent
  | SearchLimitEvent;

export function cellKey(x: number, y: number): CellKey {
  return `${x},${y}`;
}

export function parseKey(k: CellKey): { x: number; y: number } {
  const comma = k.indexOf(',');
  return { x: Number(k.slice(0, comma)), y: Number(k.slice(comma + 1)) };
}

export function indexOfCell(grid: Grid, k: CellKey): number {
  const { x, y } = parseKey(k);
  return y * grid.w + x;
}

export function isWall(grid: Grid, k: CellKey): boolean {
  return grid.walls[indexOfCell(grid, k)] === 1;
}
