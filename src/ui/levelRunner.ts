import type { CellKey, RunStats, SimEvent } from '../core/events';
import { toggleWall } from '../core/grid';
import { ReplayController, type ReplaySpeed, type ReplayStatus } from '../engine/replay';
import { applyChallenge, asNumber, asString, defaultParams, evaluateStars } from '../engine/params';
import { isLevelImplemented, loadLevelConfig } from '../engine/levelLoader';
import { isStorageAvailable, loadProgress, recordLevelResult } from '../engine/storage';
import type { BoardState, ChartData, ParamValues } from '../levels/types';
import { WORLD1 } from '../levels/world1';
import { t } from '../i18n';
import type { LevelSceneApi } from '../scenes/types';
import { createChart } from './chart';
import { el } from './dom';
import { createExplainPanel } from './explainPanel';
import { createHints } from './hints';
import { createParamsPanel } from './paramsPanel';
import { createPlaybackBar } from './playbackBar';
import { openResultOverlay, type ResultApi } from './resultPanel';

function toast(message: string, ms = 3200): void {
  const node = el('div', { className: 'toast', text: message });
  document.body.append(node);
  window.setTimeout(() => node.remove(), ms);
}

export async function startLevelPage(app: HTMLElement, levelId: string): Promise<void> {
  const config = await loadLevelConfig(levelId);
  const progress = loadProgress();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reducedMotion = progress.reduceMotion || prefersReduced;
  document.body.classList.toggle('reduce-motion', progress.reduceMotion);

  let params: ParamValues = defaultParams(config.params);
  const firstChallenge = config.challenges[0];
  if (firstChallenge) params = applyChallenge(config.params, params, firstChallenge);
  let seed = asNumber(params, 'seed', config.defaultSeed);
  let board: BoardState = config.createBoard(params, seed);

  // ----- Khung giao diện -----
  const stage = el('div', {
    className: 'game-stage',
    attrs: { tabindex: 0, role: 'application', 'aria-label': t('game.canvasLabel') },
  });
  const legend = el('p', {
    className: 'muted',
    attrs: { style: 'font-size:1rem;margin:0' },
    text: '🟦 ô đã xét · 🟨 ô đang xét · 🟧 đang chờ · 🟫 tường · ⭐ đích · vòng xanh = con trỏ bàn phím',
  });
  const playback = createPlaybackBar({
    onPlay: () => {
      if (!ensureRun()) return;
      controller?.play();
      ensureLoop();
    },
    onPause: () => controller?.pause(),
    onStep: () => {
      if (!ensureRun()) return;
      controller?.step();
    },
    onBack: () => controller?.back(),
    onReset: () => {
      controller?.reset();
      chart.setCursor(0);
    },
    onSpeed: (speed: ReplaySpeed) => controller?.setSpeed(speed),
  });
  const explain = createExplainPanel();
  const chart = createChart();
  const hints = createHints(config.hints);
  const paramsPanel = createParamsPanel({
    defs: config.params,
    challenges: config.challenges,
    initialValues: params,
    initialChallengeId: firstChallenge?.id,
    onChange: onParamChange,
  });

  const layout = el('div', {
    className: 'game-app',
    children: [
      el('div', {
        className: 'game-main',
        children: [stage, legend, playback.root, explain.root, config.chart ? chart.root : null],
      }),
      el('div', { className: 'game-side', children: [paramsPanel.root, hints] }),
    ],
  });
  app.replaceChildren(layout);

  // ----- Phaser (nạp động, chỉ khi học sinh thực sự chơi) -----
  const { mountLevel } = await import('../scenes/mount');
  let scene: LevelSceneApi | null = null;

  function onCellEdit(cell: CellKey): void {
    const tool = asString(params, 'editTool', 'wall');
    if (cell === board.start || cell === board.goal) return;
    if (tool === 'goal') {
      const grid = toggleWall(board.grid, cell, false);
      board = { ...board, goal: cell, grid };
      scene?.setBoard(board);
      clearRun();
      toast('Đã dời ngọn hải đăng!');
      return;
    }
    const grid = toggleWall(board.grid, cell);
    board = { ...board, grid };
    scene?.setBoard(board);
    clearRun();
  }

  scene = mountLevel(stage, {
    board,
    events: [],
    tool: asString(params, 'editTool', 'wall'),
    algo: asString(params, 'algo', 'bfs'),
    reducedMotion,
    onCellEdit,
  });
  await scene.ready;

  // ----- Trạng thái phát lại -----
  let events: SimEvent[] = [];
  let controller: ReplayController | null = null;
  let resultOpen = false;
  let currentOverlay: ResultApi | null = null;
  let rafId = 0;
  let lastTs = 0;

  if (!isStorageAvailable()) toast(t('storage.blocked'), 6000);

  function totalEvents(): number {
    return controller?.total ?? 0;
  }

  function onCursor(cursor: number): void {
    scene?.renderAt(events, cursor);
    const event = events[cursor - 1];
    if (event) explain.show(event.why);
    const stats = scene?.stats();
    if (stats) {
      explain.setStats({
        visited: stats.visited,
        opened: stats.opened,
        pathLen: stats.pathLen,
        frontier: stats.frontier,
      });
    }
    chart.setCursor(cursor);
    playback.setState(controller?.status ?? 'idle', cursor, totalEvents());
    if (event) handleTerminalEvent(event);
  }

  function onStatus(status: ReplayStatus): void {
    playback.setState(status, controller?.cursor ?? 0, totalEvents());
    if (status !== 'playing' && rafId !== 0) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
      lastTs = 0;
    }
  }

  function loop(timestamp: number): void {
    const dt = lastTs === 0 ? 16 : Math.min(120, timestamp - lastTs);
    lastTs = timestamp;
    controller?.tick(dt);
    if (controller && controller.status === 'playing') {
      rafId = window.requestAnimationFrame(loop);
    } else {
      rafId = 0;
      lastTs = 0;
    }
  }

  function ensureLoop(): void {
    if (rafId !== 0) return;
    lastTs = 0;
    rafId = window.requestAnimationFrame(loop);
  }

  function clearRun(): void {
    events = [];
    controller = null;
    resultOpen = false;
    if (currentOverlay) {
      currentOverlay.close();
      currentOverlay = null;
    }
    scene?.exitCelebration();
    scene?.renderAt([], 0);
    playback.setState('idle', 0, 0);
    chart.setCursor(0);
    explain.idle();
    if (rafId !== 0) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
      lastTs = 0;
    }
  }

  function ensureRun(): boolean {
    if (controller) return true;
    events = config.run({ params, seed, board });
    if (events.length === 0) {
      toast('Chưa có gì để chạy — thử đổi tham số nhé!');
      return false;
    }
    const chartData: ChartData | null = config.chart ? config.chart(events) : null;
    if (chartData) chart.setData(chartData, events.length);
    controller = new ReplayController(events.length, {
      onCursor: (cursor) => onCursor(cursor),
      onStatus,
    });
    onCursor(0);
    return true;
  }

  function onParamChange(values: ParamValues, key: string): void {
    params = values;
    seed = asNumber(params, 'seed', config.defaultSeed);
    if (key === 'editTool') {
      scene?.setTool(asString(params, 'editTool', 'wall'));
      return;
    }
    const algo = asString(params, 'algo', 'bfs');
    if (key === 'wallDensity' || key === 'seed' || key === '__challenge') {
      board = config.createBoard(params, seed);
      scene?.setBoard(board);
    }
    scene?.setAlgo(algo);
    clearRun();
  }


  function handleTerminalEvent(event: SimEvent): void {
    if (event.type === 'limit') {
      if (resultOpen) return;
      resultOpen = true;
      controller?.pause();
      showResult('limit', null);
      return;
    }
    if (event.type === 'done') {
      if (resultOpen) return;
      resultOpen = true;
      controller?.pause();
      showResult(event.win ? 'win' : 'lose', event.stats);
    }
  }

  function awardIfNeeded(stars: number, stats: RunStats | null): void {
    if (stars > 0) scene?.celebrate(stars);
    recordLevelResult(levelId, {
      stars,
      quizPassed: true,
      visited: stats?.visited,
      pathLen: stats?.pathLen ?? undefined,
    });
    // Cập nhật bản sao trong bộ nhớ để lần chơi lại không hỏi quiz lần nữa.
    progress.levels[levelId] = {
      stars: Math.max(progress.levels[levelId]?.stars ?? 0, stars),
      quizPassed: true,
      bestVisited: stats?.visited ?? progress.levels[levelId]?.bestVisited,
      bestPathLen: stats?.pathLen ?? progress.levels[levelId]?.bestPathLen,
    };
  }

  function showResult(kind: 'win' | 'lose' | 'limit', stats: RunStats | null): void {
    const stars = stats ? evaluateStars(config.stars, stats, params) : 0;
    const quizPassed = progress.levels[levelId]?.quizPassed ?? false;
    const criteria = config.stars.map((rule) => ({
      label: rule.label,
      achieved: stats ? rule.check(stats, params) : false,
    }));
    const nextLevel = nextImplementedLevel(levelId);
    currentOverlay = openResultOverlay({
      kind,
      stats,
      stars,
      criteria,
      quiz: config.quiz,
      quizPassed,
      bestStars: progress.levels[levelId]?.stars ?? 0,
      lessons: config.lessons,
      onQuizPassed: () => {
        awardIfNeeded(stars, stats);
        toast(stars > 0 ? `Đã lưu ${stars} sao cho màn này!` : 'Đã lưu tiến trình.');
      },
      onReplay: () => {
        clearRun();
        if (ensureRun()) {
          controller?.play();
          ensureLoop();
        }
      },
      onExit: () => {
        window.location.href = '/lo-trinh/';
      },
      onExplore: () => {
        resultOpen = false;
        currentOverlay = null;
        scene?.exitCelebration();
      },
      nextHref: nextLevel ? `/thuat-toan/${nextLevel.slug}/` : null,
    });

    if (quizPassed) awardIfNeeded(stars, stats);
  }

  playback.setState('idle', 0, 0);
  explain.idle();

  window.addEventListener('pagehide', () => {
    if (rafId !== 0) window.cancelAnimationFrame(rafId);
    scene?.destroy();
  });
}

function nextImplementedLevel(levelId: string): { id: string; slug: string } | null {
  const index = WORLD1.findIndex((l) => l.id === levelId);
  if (index < 0) return null;
  for (let i = index + 1; i < WORLD1.length; i += 1) {
    const candidate = WORLD1[i];
    if (candidate && isLevelImplemented(candidate.id)) return { id: candidate.id, slug: candidate.slug };
  }
  return null;
}

