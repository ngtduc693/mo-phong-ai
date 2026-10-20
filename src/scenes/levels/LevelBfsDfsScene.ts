import Phaser from 'phaser';
import { isWall, parseKey, type CellKey, type SimEvent } from '../../core/events';
import {
  applySearchEvent,
  initialSearchState,
  rebuildSearchState,
  type SearchState,
} from '../../core/pathfinding/searchState';
import type { LevelSceneContext } from '../types';

const BASE_W = 960;
const BASE_H = 560;
const HEADER = 74;

const COLOR = {
  sea: '#dff2ff',
  grassA: 0xdaf2e2,
  grassB: 0xcdecd8,
  wall: 0x8a5a3b,
  visited: 0xc7e2ff,
  frontier: 0xfff1c9,
  frontierStroke: 0xe07b21,
  current: 0xffd166,
  goalCell: 0xfff3c4,
  path: 0x0f7d59,
  robot: 0x1f8f66,
  robotFace: 0xf4fffa,
  ink: '#12303f',
  muted: '#47616e',
};

export class LevelBfsDfsScene extends Phaser.Scene {
  static readonly KEY = 'LevelBfsDfs';

  private ctx!: LevelSceneContext;
  private board!: LevelSceneContext['board'];
  private algo: 'bfs' | 'dfs' = 'bfs';
  private state!: SearchState;
  private simEvents: SimEvent[] = [];
  private cursor = 0;

  private boardLayer!: Phaser.GameObjects.Container;
  private overlays!: Phaser.GameObjects.Container;
  private pathGfx!: Phaser.GameObjects.Graphics;
  private highlight!: Phaser.GameObjects.Rectangle;
  private robot!: Phaser.GameObjects.Container;
  private goalArt!: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;

  private cell = 44;
  private originX = 0;
  private originY = HEADER + 12;
  private cursorCell: CellKey = '0,0';
  private keydown?: (event: KeyboardEvent) => void;
  private readyResolve?: () => void;
  private readonly readyPromise: Promise<void>;

  constructor() {
    super({ key: LevelBfsDfsScene.KEY });
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve;
    });
  }

  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  init(): void {
    this.ctx = this.registry.get('level-ctx') as LevelSceneContext;
    this.board = this.ctx.board;
    this.algo = this.ctx.algo === 'dfs' ? 'dfs' : 'bfs';
    this.simEvents = this.ctx.events;
    this.cursor = 0;
    this.cursorCell = this.board.start;
    this.state = initialSearchState({
      grid: this.board.grid,
      start: this.board.start,
      goal: this.board.goal,
      algo: this.algo,
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#dff2ff');
    this.drawBackdrop();

    this.add.text(28, 22, 'Bi-Bốp · Đảo Robot', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      color: COLOR.ink,
      fontStyle: 'bold',
    });
    this.statusText = this.add
      .text(BASE_W - 28, 28, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: COLOR.muted,
      })
      .setOrigin(1, 0);

    this.boardLayer = this.add.container(0, 0);
    this.overlays = this.add.container(0, 0);
    this.pathGfx = this.add.graphics();
    this.overlays.add(this.pathGfx);

    this.highlight = this.add.rectangle(0, 0, 10, 10, 0xffffff, 0);
    this.highlight.setStrokeStyle(3, 0x1d4ed8, 0.9);
    this.overlays.add(this.highlight);

    this.robot = this.createRobot();
    this.goalArt = this.createGoal();
    this.overlays.add(this.goalArt);

    this.buildBoard();
    this.bindInput();
    this.refresh();

    this.readyResolve?.();
    this.events.once('shutdown', () => this.cleanup());
  }

  private drawBackdrop(): void {
    const g = this.add.graphics();
    g.fillStyle(0xbfe8d8, 1);
    g.fillRoundedRect(12, 10, BASE_W - 24, BASE_H - 20, 26);
    g.fillStyle(0xf6e4b8, 1);
    g.fillRoundedRect(20, HEADER + 2, BASE_W - 40, BASE_H - HEADER - 22, 22);
    g.fillStyle(0xffffff, 0.25);
    for (let i = 0; i < 6; i += 1) {
      g.fillCircle(70 + i * 160, 46, 10 + (i % 3) * 4);
    }
  }

  private buildBoard(): void {
    this.boardLayer.removeAll(true);
    const grid = this.board.grid;
    const availableW = BASE_W - 60;
    const availableH = BASE_H - HEADER - 40;
    this.cell = Math.max(18, Math.floor(Math.min(availableW / grid.w, availableH / grid.h)));
    this.originX = Math.round((BASE_W - grid.w * this.cell) / 2);
    this.originY = Math.round(HEADER + (availableH - grid.h * this.cell) / 2);

    for (let y = 0; y < grid.h; y += 1) {
      for (let x = 0; x < grid.w; x += 1) {
        const base = (x + y) % 2 === 0 ? COLOR.grassA : COLOR.grassB;
        const rect = this.add.rectangle(
          this.originX + x * this.cell + this.cell / 2,
          this.originY + y * this.cell + this.cell / 2,
          this.cell - 2,
          this.cell - 2,
          base,
        );
        rect.setData('base', base);
        rect.setData('cell', `${x},${y}`);
        this.boardLayer.add(rect);
      }
    }
    this.drawGoalArt();
  }

  private createRobot(): Phaser.GameObjects.Container {
    const size = this.cell;
    const c = this.add.container(0, 0);
    const body = this.add.graphics();
    body.fillStyle(0x0a5c41, 1);
    body.fillCircle(0, 0, size * 0.34);
    body.fillStyle(COLOR.robot, 1);
    body.fillCircle(0, -size * 0.02, size * 0.29);
    body.lineStyle(3, 0x0a5c41, 1);
    body.lineBetween(0, -size * 0.3, 0, -size * 0.42);
    body.fillStyle(0xffc93c, 1);
    body.fillCircle(0, -size * 0.45, size * 0.06);
    body.fillStyle(COLOR.robotFace, 1);
    body.fillCircle(-size * 0.11, -size * 0.06, size * 0.08);
    body.fillCircle(size * 0.11, -size * 0.06, size * 0.08);
    body.fillStyle(0x12303f, 1);
    body.fillCircle(-size * 0.1, -size * 0.055, size * 0.035);
    body.fillCircle(size * 0.12, -size * 0.055, size * 0.035);
    body.lineStyle(2.5, 0x12303f, 1);
    body.beginPath();
    body.arc(0, size * 0.05, size * 0.12, 0.15 * Math.PI, 0.85 * Math.PI);
    body.strokePath();
    c.add(body);
    c.setDepth(5);
    return c;
  }

  private createGoal(): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    const glow = this.add.circle(0, 0, this.cell * 0.42, 0xffe08a, 0.55);
    const star = this.add.graphics();
    star.fillStyle(0xe8a514, 1);
    star.lineStyle(2, 0x8a6300, 1);
    const outer = this.cell * 0.32;
    const inner = outer * 0.45;
    const pts: Phaser.Geom.Point[] = [];
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      pts.push(new Phaser.Geom.Point(Math.cos(angle) * radius, Math.sin(angle) * radius));
    }
    star.fillPoints(pts, true);
    star.strokePoints(pts, true);
    c.add([glow, star]);
    c.setDepth(4);
    return c;
  }

  private drawGoalArt(): void {
    if (!this.goalArt) return;
    const pos = this.cellCenter(this.board.goal);
    this.goalArt.setPosition(pos.x, pos.y);
  }

  private bindInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const cell = this.cellAt(pointer.worldX, pointer.worldY);
      if (!cell) return;
      this.cursorCell = cell;
      this.ctx.onCellEdit(cell);
      this.refresh();
    });

    const target = this.game.canvas.parentElement;
    if (!target) return;
    this.keydown = (event: KeyboardEvent) => {
      const moves: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      const delta = moves[event.key];
      if (delta) {
        event.preventDefault();
        const { x, y } = parseKey(this.cursorCell);
        const nx = Math.min(this.board.grid.w - 1, Math.max(0, x + delta[0]));
        const ny = Math.min(this.board.grid.h - 1, Math.max(0, y + delta[1]));
        this.cursorCell = `${nx},${ny}`;
        this.refresh();
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.ctx.onCellEdit(this.cursorCell);
        this.refresh();
      }
    };
    target.addEventListener('keydown', this.keydown);
  }

  private cleanup(): void {
    if (this.game?.canvas?.parentElement && this.keydown) {
      this.game.canvas.parentElement.removeEventListener('keydown', this.keydown);
    }
    this.keydown = undefined;
  }

  private cellCenter(cell: CellKey): { x: number; y: number } {
    const { x, y } = parseKey(cell);
    return {
      x: this.originX + x * this.cell + this.cell / 2,
      y: this.originY + y * this.cell + this.cell / 2,
    };
  }

  private cellAt(px: number, py: number): CellKey | null {
    const gx = Math.floor((px - this.originX) / this.cell);
    const gy = Math.floor((py - this.originY) / this.cell);
    if (gx < 0 || gy < 0 || gx >= this.board.grid.w || gy >= this.board.grid.h) return null;
    return `${gx},${gy}`;
  }

  setBoard(board: LevelSceneContext['board']): void {
    this.board = board;
    this.cursor = 0;
    this.simEvents = [];
    this.state = initialSearchState({
      grid: board.grid,
      start: board.start,
      goal: board.goal,
      algo: this.algo,
    });
    this.buildBoard();
    this.refresh();
  }

  setTool(tool: string): void {
    this.ctx.tool = tool;
  }

  setAlgo(algo: string): void {
    const next = algo === 'dfs' ? 'dfs' : 'bfs';
    if (next === this.algo) return;
    this.algo = next;
    this.state = rebuildSearchState(
      { grid: this.board.grid, start: this.board.start, goal: this.board.goal, algo: this.algo },
      this.simEvents,
      this.cursor,
    );
    this.refresh();
  }

  renderAt(events: SimEvent[], cursor: number): void {
    this.simEvents = events;
    if (cursor >= this.cursor) {
      for (let i = this.cursor; i < cursor && i < events.length; i += 1) {
        const e = events[i];
        if (e) applySearchEvent(this.state, e);
      }
    } else {
      this.state = rebuildSearchState(
        { grid: this.board.grid, start: this.board.start, goal: this.board.goal, algo: this.algo },
        events,
        cursor,
      );
    }
    this.cursor = cursor;
    this.refresh();
  }


  stats() {
    return {
      visited: this.state.visited.length,
      opened: this.state.stats.opened,
      pathLen: this.state.stats.pathLen,
      frontier: this.state.frontier.length,
      status: this.state.status,
      current: this.state.current,
    };
  }

  refresh(): void {
    if (!this.boardLayer) return;
    const state = this.state;
    const pathSet = new Set(state.path ?? []);

    for (const child of this.boardLayer.list) {
      const rect = child as Phaser.GameObjects.Rectangle;
      const key = rect.getData('cell') as CellKey | undefined;
      if (!key) continue;
      const base = rect.getData('base') as number;
      if (isWall(this.board.grid, key)) {
        rect.setFillStyle(COLOR.wall);
        rect.setStrokeStyle(2, 0x5d3a24, 1);
      } else if (key === state.current) {
        rect.setFillStyle(COLOR.current);
        rect.setStrokeStyle(2, 0xc79200, 1);
      } else if (pathSet.has(key)) {
        rect.setFillStyle(0xbfe9cf);
        rect.setStrokeStyle(2, COLOR.path, 0.9);
      } else if (state.frontierSet.has(key)) {
        rect.setFillStyle(COLOR.frontier);
        rect.setStrokeStyle(2, COLOR.frontierStroke, 1);
      } else if (state.visitedSet.has(key)) {
        rect.setFillStyle(COLOR.visited);
        rect.setStrokeStyle(1, 0x9dc4e6, 0.8);
      } else {
        rect.setFillStyle(base);
        rect.setStrokeStyle(1, 0xffffff, 0.6);
      }
    }

    this.pathGfx.clear();
    if (state.path && state.path.length > 1) {
      this.pathGfx.lineStyle(Math.max(4, this.cell * 0.2), COLOR.path, 0.85);
      const points = state.path.map((cell) => this.cellCenter(cell));
      const first = points[0];
      if (first) {
        this.pathGfx.beginPath();
        this.pathGfx.moveTo(first.x, first.y);
        for (let i = 1; i < points.length; i += 1) {
          const p = points[i];
          if (p) this.pathGfx.lineTo(p.x, p.y);
        }
        this.pathGfx.strokePath();
      }
    }

    const robotPos = state.current ? this.cellCenter(state.current) : this.cellCenter(this.board.start);
    if (this.ctx.reducedMotion || (this.robot.x === 0 && this.robot.y === 0)) {
      this.robot.setPosition(robotPos.x, robotPos.y);
    } else {
      this.tweens.add({ targets: this.robot, x: robotPos.x, y: robotPos.y, duration: 140, ease: 'Sine.out' });
    }

    this.drawGoalArt();
    const cursorPos = this.cellCenter(this.cursorCell);
    this.highlight.setPosition(cursorPos.x, cursorPos.y);
    this.highlight.setSize(this.cell - 4, this.cell - 4);

    const label = state.algo === 'dfs' ? 'Ngăn xếp' : 'Hàng đợi';
    const pathLabel = state.path ? `Đường: ${state.path.length - 1} bước` : 'chưa tới đích';
    this.statusText.setText(
      `${label}: ${state.frontier.length}   ·   Đã xét: ${state.visited.length}   ·   ${pathLabel}`,
    );
  }

  celebrate(stars: number): void {
    this.scene.pause();
    this.scene.launch('ResultScene', { stars });
  }

  exitCelebration(): void {
    if (this.scene.isActive('ResultScene')) this.scene.stop('ResultScene');
    if (this.scene.isPaused()) this.scene.resume();
  }

  focus(): void {
    this.game.canvas.parentElement?.focus();
  }
}

