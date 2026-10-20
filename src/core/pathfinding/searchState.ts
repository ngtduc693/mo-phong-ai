import type { CellKey, Grid, RunStats, SearchAlgo, SimEvent } from '../events';
import { runSearch, type SearchParams } from './search';

export type SearchStatus = 'running' | 'win' | 'lose' | 'limit';

export interface SearchState {
  grid: Grid;
  start: CellKey;
  goal: CellKey;
  algo: SearchAlgo;
  /** Các ô đã mở, theo đúng thứ tự mở. */
  visited: CellKey[];
  visitedSet: Set<CellKey>;
  /** Hàng đợi (BFS) hoặc ngăn xếp (DFS) – phần tử đầu mảng là "đầu hàng đợi". */
  frontier: CellKey[];
  frontierSet: Set<CellKey>;
  parent: Map<CellKey, CellKey>;
  current: CellKey | null;
  path: CellKey[] | null;
  status: SearchStatus;
  stats: RunStats;
}

export interface SearchInit {
  grid: Grid;
  start: CellKey;
  goal: CellKey;
  algo: SearchAlgo;
}

export function initialSearchState(init: SearchInit): SearchState {
  const parent = new Map<CellKey, CellKey>();
  parent.set(init.start, init.start);
  return {
    grid: init.grid,
    start: init.start,
    goal: init.goal,
    algo: init.algo,
    visited: [],
    visitedSet: new Set(),
    frontier: [init.start],
    frontierSet: new Set([init.start]),
    parent,
    current: null,
    path: null,
    status: 'running',
    stats: { visited: 0, opened: 1, pathLen: null },
  };
}

/** Áp một sự kiện lên state (mutate rồi trả lại chính state đó cho nhanh). */
export function applySearchEvent(state: SearchState, event: SimEvent): SearchState {
  switch (event.type) {
    case 'open': {
      state.frontier.push(event.cell);
      state.frontierSet.add(event.cell);
      state.parent.set(event.cell, event.parent);
      state.stats.opened = state.parent.size;
      break;
    }
    case 'visit': {
      const at = state.frontier.indexOf(event.cell);
      if (at >= 0) state.frontier.splice(at, 1);
      state.frontierSet.delete(event.cell);
      state.visited.push(event.cell);
      state.visitedSet.add(event.cell);
      state.current = event.cell;
      state.stats.visited = state.visited.length;
      break;
    }
    case 'path': {
      state.path = event.cells;
      state.status = 'win';
      state.stats.pathLen = event.cells.length - 1;
      state.current = event.cells[event.cells.length - 1] ?? state.current;
      break;
    }
    case 'noPath': {
      state.status = 'lose';
      break;
    }
    case 'limit': {
      state.status = 'limit';
      break;
    }
    case 'done': {
      state.stats = { ...event.stats };
      if (event.win) state.status = 'win';
      else if (state.status !== 'limit') state.status = 'lose';
      break;
    }
  }
  return state;
}

/** Dựng lại state tại vị trí cursor (dùng cho nút "Lùi 1 bước" và khi đổi tốc độ). */
export function rebuildSearchState(init: SearchInit, events: SimEvent[], cursor: number): SearchState {
  const state = initialSearchState(init);
  for (let i = 0; i < cursor && i < events.length; i += 1) {
    const e = events[i];
    if (e) applySearchEvent(state, e);
  }
  return state;
}

export interface SeriesPoint {
  /** Số sự kiện đã phát (chính là cursor). */
  i: number;
  visited: number;
  opened: number;
}

/** Chuỗi số liệu cho biểu đồ nhỏ (một lượt, O(n)). */
export function searchSeries(events: SimEvent[]): SeriesPoint[] {
  const out: SeriesPoint[] = [{ i: 0, visited: 0, opened: 1 }];
  let visited = 0;
  let opened = 1;
  for (let i = 0; i < events.length; i += 1) {
    const e = events[i];
    if (e?.type === 'visit') visited += 1;
    else if (e?.type === 'open') opened += 1;
    out.push({ i: i + 1, visited, opened });
  }
  return out;
}

/** Chạy trọn thuật toán thành mảng sự kiện (được chặn bởi maxSteps). */
export function runSearchToArray(params: SearchParams): SimEvent[] {
  const events: SimEvent[] = [];
  for (const e of runSearch(params)) events.push(e);
  return events;
}
