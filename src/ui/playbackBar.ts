import type { ReplaySpeed, ReplayStatus } from '../engine/replay';
import { SPEEDS } from '../engine/replay';
import { t } from '../i18n';
import { el } from './dom';

export interface PlaybackHandlers {
  onPlay(): void;
  onPause(): void;
  onStep(): void;
  onBack(): void;
  onReset(): void;
  onSpeed(speed: ReplaySpeed): void;
}

export interface PlaybackApi {
  root: HTMLElement;
  setState(status: ReplayStatus, cursor: number, total: number): void;
  setSpeed(speed: number): void;
}

export function createPlaybackBar(handlers: PlaybackHandlers): PlaybackApi {
  const backBtn = el('button', {
    className: 'btn btn--ghost',
    text: `⏮ ${t('playback.back')}`,
    attrs: { type: 'button', title: t('playback.back') },
  });
  const playBtn = el('button', {
    className: 'btn btn--primary',
    text: `▶ ${t('playback.play')}`,
    attrs: { type: 'button', 'aria-pressed': 'false' },
  });
  const stepBtn = el('button', {
    className: 'btn',
    text: `⏭ ${t('playback.step')}`,
    attrs: { type: 'button' },
  });
  const resetBtn = el('button', {
    className: 'btn btn--ghost',
    text: `↺ ${t('playback.reset')}`,
    attrs: { type: 'button' },
  });
  const speedSelect = el('select', {
    className: 'speed-select',
    attrs: { 'aria-label': t('playback.speed') },
  });
  for (const speed of SPEEDS) {
    speedSelect.append(el('option', { text: `${speed}×`, attrs: { value: String(speed) } }));
  }
  speedSelect.value = '1';

  const progressText = el('span', { text: t('playback.idle') });
  const progressMax = el('span', { text: '' });
  const fill = el('div', { className: 'progressbar__fill' });
  const bar = el('div', {
    className: 'progressbar',
    attrs: { role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 1, 'aria-valuenow': 0 },
  });
  bar.append(fill);

  backBtn.addEventListener('click', () => handlers.onBack());
  stepBtn.addEventListener('click', () => handlers.onStep());
  resetBtn.addEventListener('click', () => handlers.onReset());
  playBtn.addEventListener('click', () => {
    const playing = playBtn.getAttribute('aria-pressed') === 'true';
    if (playing) handlers.onPause();
    else handlers.onPlay();
  });
  speedSelect.addEventListener('change', () => {
    handlers.onSpeed(Number(speedSelect.value) as ReplaySpeed);
  });

  const root = el('div', {
    className: 'playback',
    attrs: { role: 'group', 'aria-label': 'Điều khiển phát lại' },
    children: [
      el('div', {
        className: 'playback__row',
        children: [backBtn, playBtn, stepBtn, resetBtn, speedSelect],
      }),
      el('div', {
        className: 'playback__progress',
        children: [
          el('div', { className: 'playback__label', children: [progressText, progressMax] }),
          bar,
        ],
      }),
    ],
  });

  return {
    root,
    setState(status, cursor, total) {
      const playing = status === 'playing';
      playBtn.textContent = playing ? `⏸ ${t('playback.pause')}` : `▶ ${t('playback.play')}`;
      playBtn.setAttribute('aria-pressed', String(playing));
      // Nút Chạy/Bước luôn bấm được: lần bấm đầu sẽ tự tính toán mô phỏng.
      playBtn.disabled = false;
      stepBtn.disabled = total > 0 && cursor >= total;
      backBtn.disabled = cursor <= 0;
      const ratio = total === 0 ? 0 : cursor / total;
      fill.style.width = `${Math.round(ratio * 100)}%`;
      bar.setAttribute('aria-valuemax', String(total));
      bar.setAttribute('aria-valuenow', String(cursor));
      progressText.textContent = total === 0 ? t('playback.idle') : t('playback.progress', { i: cursor, n: total });
      progressMax.textContent =
        status === 'finished' ? '✓ xong' : status === 'playing' ? 'đang chạy…' : status === 'paused' ? 'tạm dừng' : '';
    },
    setSpeed(speed) {
      speedSelect.value = String(speed);
    },
  };
}
