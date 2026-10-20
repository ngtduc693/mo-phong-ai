import { describe, expect, it, vi } from 'vitest';
import { ReplayController } from '../replay';
import { applyChallenge, defaultParams, evaluateStars } from '../params';
import type { ParamDef, StarRule } from '../../levels/types';
import type { RunStats } from '../../core/events';

const TOTAL = 20;

function make(events = TOTAL) {
  return new ReplayController(events);
}

describe('ReplayController', () => {
  it('bắt đầu ở trạng thái idle, con trỏ 0', () => {
    const c = make();
    expect(c.cursor).toBe(0);
    expect(c.status).toBe('idle');
    expect(c.total).toBe(TOTAL);
  });

  it('step tiến từng sự kiện và dừng ở cuối', () => {
    const c = make(3);
    c.step();
    expect(c.cursor).toBe(1);
    c.step();
    c.step();
    expect(c.cursor).toBe(3);
    expect(c.status).toBe('finished');
    c.step();
    expect(c.cursor).toBe(3);
  });

  it('back lùi được và không lùi quá 0', () => {
    const c = make(5);
    c.step();
    c.step();
    c.back();
    expect(c.cursor).toBe(1);
    c.back();
    c.back();
    expect(c.cursor).toBe(0);
  });

  it('phát tự động theo thời gian, tăng tốc thì nhanh hơn', () => {
    const slow = make();
    slow.play();
    slow.tick(1000);
    const slowCursor = slow.cursor;
    const fast = make();
    fast.setSpeed(4);
    fast.play();
    fast.tick(1000);
    expect(slowCursor).toBeGreaterThan(0);
    expect(fast.cursor).toBeGreaterThanOrEqual(slowCursor * 3);
  });

  it('chạy hết thì chuyển finished và không vượt quá total', () => {
    const c = make(6);
    c.play();
    for (let i = 0; i < 40; i += 1) c.tick(1000);
    expect(c.cursor).toBe(6);
    expect(c.status).toBe('finished');
  });

  it('play sau khi finished thì chạy lại từ đầu', () => {
    const c = make(4);
    c.play();
    for (let i = 0; i < 20; i += 1) c.tick(1000);
    expect(c.cursor).toBe(4);
    c.play();
    expect(c.cursor).toBe(0);
    expect(c.status).toBe('playing');
  });

  it('reset đưa về đầu và phát sự kiện con trỏ', () => {
    const onCursor = vi.fn();
    const c = new ReplayController(5, { onCursor });
    c.step();
    c.step();
    c.reset();
    expect(c.cursor).toBe(0);
    expect(c.status).toBe('idle');
    expect(onCursor).toHaveBeenCalled();
  });

  it('pause dừng tick', () => {
    const c = make(30);
    c.play();
    c.tick(500);
    c.pause();
    const frozen = c.cursor;
    c.tick(5000);
    expect(c.cursor).toBe(frozen);
  });

  it('seek kẹp trong khoảng hợp lệ', () => {
    const c = make(10);
    c.seek(7);
    expect(c.cursor).toBe(7);
    c.seek(999);
    expect(c.cursor).toBe(10);
    c.seek(-5);
    expect(c.cursor).toBe(0);
  });
});

describe('tham số & sao', () => {
  const defs: ParamDef[] = [
    { key: 'density', label: 'Mật độ', kind: 'slider', min: 0, max: 0.3, step: 0.01, def: 0.1 },
    { key: 'algo', label: 'Thuật toán', kind: 'segmented', def: 'bfs', options: [{ value: 'bfs', label: 'BFS' }, { value: 'dfs', label: 'DFS' }] },
  ];

  it('defaultParams lấy giá trị mặc định', () => {
    expect(defaultParams(defs)).toEqual({ density: 0.1, algo: 'bfs' });
  });

  it('applyChallenge chỉ ghi các khóa hợp lệ', () => {
    const next = applyChallenge(defs, defaultParams(defs), {
      id: 'hard',
      label: 'Khó',
      desc: '',
      preset: { density: 0.3, algo: 'dfs', khongTonTai: 1 },
    });
    expect(next.density).toBe(0.3);
    expect(next.algo).toBe('dfs');
    expect(next).not.toHaveProperty('khongTonTai');
  });

  const stats: RunStats = { visited: 10, opened: 12, pathLen: 4 };
  const rules: StarRule[] = [
    { label: 'win', check: (s) => s.pathLen !== null },
    { label: '<=20', check: (s) => s.visited <= 20 },
    { label: '<=5', check: (s) => s.visited <= 5 },
  ];

  it('evaluateStars đếm số tiêu chí đạt', () => {
    expect(evaluateStars(rules, stats, {})).toBe(2);
    expect(evaluateStars(rules, { ...stats, visited: 3 }, {})).toBe(3);
    // Không tới đích vẫn có thể đạt tiêu chí phụ nếu luật không ràng buộc pathLen…
    expect(evaluateStars(rules, { ...stats, pathLen: null }, {})).toBe(1);
    // …nên luật sao trong level luôn tự kiểm tra pathLen (xem bfs-dfs).
    expect(evaluateStars([rules[0] as StarRule], { ...stats, pathLen: null }, {})).toBe(0);
  });
});
