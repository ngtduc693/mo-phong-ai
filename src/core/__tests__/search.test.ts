import { describe, expect, it } from 'vitest';
import { cellKey, parseKey, type CellKey, type Grid } from '../events';
import { generateGrid, neighbors, wallAt } from '../grid';
import type { SearchParams } from '../pathfinding/search';
import {
  applySearchEvent,
  initialSearchState,
  rebuildSearchState,
  runSearchToArray,
  searchSeries,
} from '../pathfinding/searchState';
import { mulberry32 } from '../rng';

function gridFromAscii(rows: string[]): Grid {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const walls = new Uint8Array(w * h);
  rows.forEach((row, y) => {
    for (let x = 0; x < w; x += 1) {
      walls[y * w + x] = row[x] === '#' ? 1 : 0;
    }
  });
  return { w, h, walls };
}

/** BFS "sạch" để kiểm chứng độ dài đường ngắn nhất. */
function shortestDistance(grid: Grid, start: CellKey, goal: CellKey): number | null {
  const dist = new Map<CellKey, number>([[start, 0]]);
  const queue: CellKey[] = [start];
  while (queue.length > 0) {
    const cur = queue.shift() as CellKey;
    if (cur === goal) return dist.get(cur) ?? null;
    for (const nb of neighbors(grid, cur)) {
      const { x, y } = parseKey(nb);
      if (wallAt(grid, x, y) || dist.has(nb)) continue;
      dist.set(nb, (dist.get(cur) ?? 0) + 1);
      queue.push(nb);
    }
  }
  return null;
}

function runs(params: SearchParams) {
  return runSearchToArray(params);
}

describe('rng', () => {
  it('cùng seed cho cùng dãy số', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('seed khác cho dãy khác', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('generateGrid', () => {
  it('tái lập được với cùng seed', () => {
    const spec = { w: 12, h: 8, density: 0.25, seed: 7, start: '0,0', goal: '11,7' };
    const g1 = generateGrid(spec);
    const g2 = generateGrid(spec);
    expect(Array.from(g1.walls)).toEqual(Array.from(g2.walls));
  });

  it('start và goal luôn mở', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const g = generateGrid({ w: 12, h: 8, density: 0.5, seed, start: '0,0', goal: '11,7' });
      expect(wallAt(g, 0, 0)).toBe(false);
      expect(wallAt(g, 11, 7)).toBe(false);
    }
  });

  it('luôn còn đường đi dù mật độ tường cao', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const g = generateGrid({ w: 12, h: 8, density: 0.6, seed, start: '0,0', goal: '11,7' });
      expect(shortestDistance(g, '0,0', '11,7')).not.toBeNull();
    }
  });
});

describe('BFS', () => {
  const openField = gridFromAscii(['....', '....', '....']);

  it('tìm đường ngắn nhất trên lưới trống', () => {
    const events = runs({ grid: openField, start: '0,0', goal: '3,2', algo: 'bfs' });
    const done = events.find((e) => e.type === 'done');
    expect(done && done.type === 'done' && done.win).toBe(true);
    expect(done && done.type === 'done' && done.stats.pathLen).toBe(5);
  });

  it('thứ tự mở ô không giảm theo khoảng cách (duyệt theo lớp)', () => {
    const maze = gridFromAscii(['.....', '.###.', '.#.#.', '.#...', '.....']);
    const events = runs({ grid: maze, start: '0,0', goal: '3,4', algo: 'bfs' });
    const dist = new Map<CellKey, number>();
    const queue: CellKey[] = ['0,0'];
    dist.set('0,0', 0);
    while (queue.length > 0) {
      const cur = queue.shift() as CellKey;
      for (const nb of neighbors(maze, cur)) {
        const { x, y } = parseKey(nb);
        if (wallAt(maze, x, y) || dist.has(nb)) continue;
        dist.set(nb, (dist.get(cur) ?? 0) + 1);
        queue.push(nb);
      }
    }
    const visitedOrder = events
      .filter((e) => e.type === 'visit')
      .map((e) => (e as { cell: CellKey }).cell);
    expect(visitedOrder.length).toBeGreaterThan(3);
    const distances = visitedOrder.map((c) => dist.get(c) ?? 0);
    for (let i = 1; i < distances.length; i += 1) {
      expect(distances[i] as number).toBeGreaterThanOrEqual(distances[i - 1] as number);
    }
  });

  it('đường đi liền kề nhau và không xuyên tường', () => {
    const maze = gridFromAscii(['.....', '.###.', '.#.#.', '.#...', '.....']);
    const events = runs({ grid: maze, start: '0,0', goal: '3,4', algo: 'bfs' });
    const pathEvent = events.find((e) => e.type === 'path');
    expect(pathEvent).toBeDefined();
    if (!pathEvent || pathEvent.type !== 'path') throw new Error('thiếu path');
    expect(pathEvent.cells[0]).toBe('0,0');
    expect(pathEvent.cells[pathEvent.cells.length - 1]).toBe('3,4');
    for (const cell of pathEvent.cells) {
      const { x, y } = parseKey(cell);
      expect(wallAt(maze, x, y)).toBe(false);
    }
    for (let i = 1; i < pathEvent.cells.length; i += 1) {
      const a = parseKey(pathEvent.cells[i - 1] as CellKey);
      const b = parseKey(pathEvent.cells[i] as CellKey);
      expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
    }
    expect(pathEvent.cells.length - 1).toBe(shortestDistance(maze, '0,0', '3,4'));
  });
});



describe('DFS', () => {
  const maze = gridFromAscii(['.....', '.###.', '.#.#.', '.#...', '.....']);

  it('vẫn tìm ra đường đi', () => {
    const events = runs({ grid: maze, start: '0,0', goal: '3,4', algo: 'dfs' });
    const done = events.find((e) => e.type === 'done');
    expect(done && done.type === 'done' && done.win).toBe(true);
  });

  it('không mở cùng một ô hai lần', () => {
    const events = runs({ grid: maze, start: '0,0', goal: '3,4', algo: 'dfs' });
    const visited = events.filter((e) => e.type === 'visit').map((e) => (e as { cell: string }).cell);
    expect(new Set(visited).size).toBe(visited.length);
  });

  it('tái lập được với cùng seed/tham số', () => {
    const g = generateGrid({ w: 14, h: 10, density: 0.2, seed: 99, start: '0,0', goal: '13,9' });
    const a = runs({ grid: g, start: '0,0', goal: '13,9', algo: 'dfs' });
    const b = runs({ grid: g, start: '0,0', goal: '13,9', algo: 'dfs' });
    expect(a.map((e) => e.why)).toEqual(b.map((e) => e.why));
  });
});

describe('giới hạn bước và trường hợp không có đường', () => {
  it('phát sự kiện limit khi vượt maxSteps', () => {
    const g = gridFromAscii(['....', '....', '....', '....']);
    const events = runs({ grid: g, start: '0,0', goal: '3,3', algo: 'dfs', maxSteps: 1 });
    expect(events.some((e) => e.type === 'limit')).toBe(true);
    expect(events.some((e) => e.type === 'done')).toBe(false);
  });

  it('báo không có đường khi đích bị vây kín', () => {
    const g = gridFromAscii(['.#.', '###', '...']);
    const events = runs({ grid: g, start: '0,0', goal: '2,0', algo: 'bfs' });
    expect(events.some((e) => e.type === 'noPath')).toBe(true);
    const done = events.find((e) => e.type === 'done');
    expect(done && done.type === 'done' && done.win).toBe(false);
  });
});


describe('reducer & biểu đồ', () => {
  const g = gridFromAscii(['.....', '.###.', '.#.#.', '.#...', '.....']);
  const init = { grid: g, start: '0,0', goal: '3,4', algo: 'bfs' as const };

  it('rebuild tại cursor cuối cho cùng kết quả với chạy tuần tự', () => {
    const events = runs(init);
    const linear = initialSearchState(init);
    for (const e of events) applySearchEvent(linear, e);
    const rebuilt = rebuildSearchState(init, events, events.length);
    expect(rebuilt.stats).toEqual(linear.stats);
    expect(rebuilt.path).toEqual(linear.path);
    expect(rebuilt.status).toBe('win');
  });

  it('lùi bước thì bỏ đúng các ô đã mở', () => {
    const events = runs(init);
    const cursor = 5;
    const visitsBefore = events.slice(0, cursor).filter((e) => e.type === 'visit').length;
    const expectedCurrent =
      (events
        .slice(0, cursor)
        .filter((e) => e.type === 'visit')
        .pop() as { cell?: string } | undefined)?.cell ?? null;
    const state = rebuildSearchState(init, events, cursor);
    expect(state.visited.length).toBe(visitsBefore);
    expect(state.current).toBe(expectedCurrent);
  });

  it('chuỗi biểu đồ dài bằng số sự kiện + 1 và đơn điệu', () => {
    const events = runs(init);
    const series = searchSeries(events);
    expect(series.length).toBe(events.length + 1);
    for (let i = 1; i < series.length; i += 1) {
      expect((series[i] as { visited: number }).visited).toBeGreaterThanOrEqual(
        (series[i - 1] as { visited: number }).visited,
      );
    }
  });

  it('ô bắt đầu luôn nằm trong đường đi', () => {
    const events = runs({ ...init, algo: 'dfs' });
    const path = events.find((e) => e.type === 'path');
    if (!path || path.type !== 'path') throw new Error('thiếu path');
    expect(path.cells).toContain('0,0');
    expect(path.cells[0]).toBe(cellKey(0, 0));
  });
});
