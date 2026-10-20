import type { ChartData } from '../levels/types';
import { t } from '../i18n';
import { el } from './dom';

export interface ChartApi {
  root: HTMLElement;
  setData(data: ChartData, totalX: number): void;
  setCursor(cursor: number): void;
}

const W = 320;
const H = 120;
const PAD = { left: 30, right: 8, top: 10, bottom: 18 };

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
  return node;
}

export function createChart(): ChartApi {
  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'chart',
    role: 'img',
    'aria-label': t('panel.chart'),
  });
  const gridLayer = svgEl('g', {});
  const seriesLayer = svgEl('g', {});
  const cursorLine = svgEl('line', {
    x1: PAD.left,
    x2: PAD.left,
    y1: PAD.top,
    y2: H - PAD.bottom,
    class: 'chart__cursor',
    visibility: 'hidden',
  });
  const maxLabel = svgEl('text', {
    x: 4,
    y: PAD.top + 8,
    'font-size': 9,
    fill: '#47616e',
  });
  const zeroLabel = svgEl('text', {
    x: 4,
    y: H - PAD.bottom,
    'font-size': 9,
    fill: '#47616e',
  });
  zeroLabel.textContent = '0';
  const axisX = svgEl('line', {
    x1: PAD.left,
    x2: W - PAD.right,
    y1: H - PAD.bottom,
    y2: H - PAD.bottom,
    class: 'chart__axis',
  });
  const axisY = svgEl('line', { x1: PAD.left, x2: PAD.left, y1: PAD.top, y2: H - PAD.bottom, class: 'chart__axis' });
  svg.append(gridLayer, seriesLayer, axisX, axisY, cursorLine, maxLabel, zeroLabel);

  const legend = el('div', { className: 'chart__legend' });
  const root = el('section', {
    className: 'panel',
    children: [el('h2', { className: 'panel__title', text: `📈 ${t('panel.chart')}` }), svg, legend],
  });

  let total = 1;
  const xOf = (x: number): number => {
    const span = W - PAD.left - PAD.right;
    return PAD.left + (total <= 0 ? 0 : (x / total) * span);
  };

  return {
    root,
    setData(data: ChartData, totalX: number) {
      total = Math.max(1, totalX);
      seriesLayer.replaceChildren();
      gridLayer.replaceChildren();
      for (const line of svg.querySelectorAll('.chart__axis')) line.setAttribute('class', 'chart__axis');
      const allValues = data.series.flatMap((s) => s.points.map((p) => p.y));
      const maxY = Math.max(1, ...allValues);
      maxLabel.textContent = String(maxY);

      // Lưới ngang nhẹ ở 50% và 100%.
      for (const ratio of [0.5, 1]) {
        const y = H - PAD.bottom - ratio * (H - PAD.top - PAD.bottom);
        gridLayer.append(
          svgEl('line', { x1: PAD.left, x2: W - PAD.right, y1: y, y2: y, stroke: '#e6f0ea', 'stroke-width': 1 }),
        );
      }

      data.series.forEach((series, index) => {
        const points = series.points
          .map((p) => {
            const y = H - PAD.bottom - (p.y / maxY) * (H - PAD.top - PAD.bottom);
            return `${xOf(p.x).toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' ');
        seriesLayer.append(
          svgEl('polyline', {
            points,
            class: index === 0 ? 'chart__line-visited' : 'chart__line-opened',
          }),
        );
      });

      legend.replaceChildren(
        ...data.series.map((s) => el('span', { text: s.label })),
      );
    },
    setCursor(cursor: number) {
      if (cursor <= 0) {
        cursorLine.setAttribute('visibility', 'hidden');
        return;
      }
      cursorLine.setAttribute('visibility', 'visible');
      const x = xOf(cursor);
      cursorLine.setAttribute('x1', String(x));
      cursorLine.setAttribute('x2', String(x));
    },
  };
}
