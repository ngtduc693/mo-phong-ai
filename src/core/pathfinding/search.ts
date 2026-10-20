import {
  type CellKey,
  type Grid,
  type RunStats,
  type SearchAlgo,
  type SimEvent,
} from '../events';
import { neighbors, wallAt } from '../grid';

export interface SearchParams {
  grid: Grid;
  start: CellKey;
  goal: CellKey;
  algo: SearchAlgo;
  /** Chặn vòng lặp vô hạn (yêu cầu độ bền). */
  maxSteps?: number;
}

export const DEFAULT_MAX_STEPS = 3000;

function fmt(cell: CellKey): string {
  const comma = cell.indexOf(',');
  return `(${cell.slice(0, comma)}, ${cell.slice(comma + 1)})`;
}

function structureName(algo: SearchAlgo): string {
  return algo === 'bfs' ? 'hàng đợi' : 'ngăn xếp';
}

function ruleName(algo: SearchAlgo): string {
  return algo === 'bfs' ? 'FIFO (vào trước ra trước)' : 'LIFO (vào sau ra trước)';
}

/**
 * Generator BFS/DFS. Mỗi lần .next() phát ra đúng một sự kiện kèm lời giải thích
 * tiếng Việt, để lớp scenes/ui chỉ việc diễn hoạt và đọc lên.
 *
 * Kết quả tái lập: cùng grid/start/goal/algo => cùng chuỗi sự kiện.
 */
export function* runSearch(params: SearchParams): Generator<SimEvent> {
  const { grid, start, goal, algo } = params;
  const maxSteps = params.maxSteps ?? DEFAULT_MAX_STEPS;

  const frontier: CellKey[] = [];
  const inFrontier = new Set<CellKey>();
  const visited = new Set<CellKey>();
  const parent = new Map<CellKey, CellKey>();

  const push = (cell: CellKey, from: CellKey | null): void => {
    parent.set(cell, from ?? cell);
    frontier.push(cell);
    inFrontier.add(cell);
  };

  push(start, null);
  let steps = 0;

  while (frontier.length > 0) {
    steps += 1;
    if (steps > maxSteps) {
      yield {
        type: 'limit',
        why: `Robot đi lòng vòng quá lâu (đã xét ${maxSteps} bước). Thử giảm mật độ tường hoặc đổi thuật toán nhé!`,
      };
      return;
    }

    const current = algo === 'bfs' ? (frontier.shift() as CellKey) : (frontier.pop() as CellKey);
    inFrontier.delete(current);

    if (visited.has(current)) continue;
    visited.add(current);

    const left = frontier.length;
    const position = algo === 'bfs' ? 'đầu hàng đợi' : 'đỉnh ngăn xếp';
    yield {
      type: 'visit',
      cell: current,
      why:
        algo === 'bfs'
          ? `Mở ô ${fmt(current)} vì nó nằm ở ${position} (${ruleName(algo)}). Hàng đợi còn ${left} ô chờ.`
          : `Mở ô ${fmt(current)} vì nó nằm ở ${position} (${ruleName(algo)}) — robot ưu tiên đi sâu. Ngăn xếp còn ${left} ô chờ.`,
    };

    if (current === goal) {
      const cells = reconstruct(parent, start, goal);
      yield {
        type: 'path',
        cells,
        why: `Chạm đích! Truy vết ngược theo dấu vết từng ô, ta được đường đi dài ${cells.length - 1} bước.`,
      };
      const stats: RunStats = { visited: visited.size, opened: parent.size, pathLen: cells.length - 1 };
      yield {
        type: 'done',
        win: true,
        stats,
        why:
          algo === 'bfs'
            ? `Hoàn thành! BFS mở ${stats.visited} ô và vì duyệt theo từng lớp nên đường tìm được là NGẮN NHẤT.`
            : `Hoàn thành! DFS mở ${stats.visited} ô; vì cứ đi sâu nên đường tìm được có thể dài hơn đường ngắn nhất.`,
      };
      return;
    }

    for (const nb of neighbors(grid, current)) {
      if (wallAt(grid, ...toXY(nb))) continue;
      if (visited.has(nb) || inFrontier.has(nb)) continue;
      push(nb, current);
      yield {
        type: 'open',
        cell: nb,
        parent: current,
        why:
          algo === 'bfs'
            ? `Từ ô ${fmt(current)} thấy ô ${fmt(nb)} chưa thăm, xếp vào CUỐI hàng đợi.`
            : `Từ ô ${fmt(current)} thấy ô ${fmt(nb)} chưa thăm, đẩy lên ĐỈNH ngăn xếp.`,
      };
    }
  }

  yield {
    type: 'noPath',
    why: `${structureName(algo)} đã trống mà robot vẫn chưa tới đích — bản đồ này không có đường đi.`,
  };
  yield {
    type: 'done',
    win: false,
    stats: { visited: visited.size, opened: parent.size, pathLen: null },
    why: `Đã xét hết ${visited.size} ô có thể tới mà không gặp đích. Thử giảm mật độ tường hoặc dời đích nhé!`,
  };
}

function toXY(cell: CellKey): [number, number] {
  const comma = cell.indexOf(',');
  return [Number(cell.slice(0, comma)), Number(cell.slice(comma + 1))];
}

function reconstruct(parent: Map<CellKey, CellKey>, start: CellKey, goal: CellKey): CellKey[] {
  const path: CellKey[] = [];
  let cur: CellKey | undefined = goal;
  let guard = 0;
  while (cur !== undefined && guard < 10_000) {
    guard += 1;
    path.push(cur);
    if (cur === start) break;
    const next = parent.get(cur);
    if (next === undefined || next === cur) break;
    cur = next;
  }
  return path.reverse();
}
