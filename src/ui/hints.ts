import type { ChartData, ChartSeries, HintDef } from '../levels/types';
import { t } from '../i18n';
import { el } from './dom';

export function createHints(hints: HintDef[]): HTMLElement {
  const list = el('div', { className: 'hints' });
  for (const hint of hints) {
    const details = el('details', {
      className: 'hint',
      children: [
        el('summary', { text: `${'⭐'.repeat(hint.tier)} ${hint.title}` }),
        el('p', { text: hint.text }),
      ],
    });
    list.append(details);
  }
  return el('section', {
    className: 'panel',
    children: [el('h2', { className: 'panel__title', text: `🧭 ${t('panel.hints')}` }), list],
  });
}

/** Hàm dựng dữ liệu biểu đồ mặc định cho các màn "số liệu tăng dần". */
export function lineChart(labels: [string, string], values: Array<{ i: number; a: number; b: number }>): ChartData {
  const series: ChartSeries[] = [
    { label: labels[0], points: values.map((v) => ({ x: v.i, y: v.a })) },
    { label: labels[1], points: values.map((v) => ({ x: v.i, y: v.b })) },
  ];
  return { series };
}
