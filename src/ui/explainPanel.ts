import { t } from '../i18n';
import { el } from './dom';

export interface ExplainStats {
  visited: number;
  opened: number;
  pathLen: number | null;
  frontier: number;
}

export interface ExplainApi {
  root: HTMLElement;
  show(text: string): void;
  idle(): void;
  setStats(stats: ExplainStats): void;
}

export function createExplainPanel(): ExplainApi {
  const text = el('p', {
    className: 'explain__text',
    text: t('panel.explainIdle'),
    attrs: { 'aria-live': 'polite' },
  });
  const statRow = el('div', { className: 'stat-row' });
  const root = el('section', {
    className: 'panel explain',
    children: [
      el('h2', { className: 'panel__title', text: `💡 ${t('panel.explain')}` }),
      text,
      statRow,
    ],
  });

  let lastStats: ExplainStats | null = null;

  function renderStats(stats: ExplainStats): void {
    statRow.replaceChildren(
      el('span', {
        className: 'stat',
        children: ['Ô đã xét: ', el('b', { text: String(stats.visited) })],
      }),
      el('span', {
        className: 'stat',
        children: ['Đang chờ: ', el('b', { text: String(stats.frontier) })],
      }),
      el('span', {
        className: 'stat',
        children: ['Đã phát hiện: ', el('b', { text: String(stats.opened) })],
      }),
      el('span', {
        className: 'stat',
        children: ['Đường đi: ', el('b', { text: stats.pathLen === null ? '—' : `${stats.pathLen} bước` })],
      }),
    );
  }

  renderStats({ visited: 0, opened: 1, pathLen: null, frontier: 1 });

  return {
    root,
    show(message) {
      text.textContent = message;
      text.classList.remove('is-fresh');
      // Ép trình duyệt tính lại animation để có hiệu ứng nhẹ mỗi bước.
      void text.offsetWidth;
      text.classList.add('is-fresh');
      if (lastStats) renderStats(lastStats);
    },
    idle() {
      text.textContent = t('panel.explainIdle');
      text.classList.remove('is-fresh');
      renderStats({ visited: 0, opened: 1, pathLen: null, frontier: 1 });
    },
    setStats(stats) {
      lastStats = stats;
      renderStats(stats);
    },
  };
}
