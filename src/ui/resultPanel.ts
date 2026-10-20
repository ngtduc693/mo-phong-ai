import type { RunStats } from '../core/events';
import type { QuizQuestion } from '../levels/types';
import { t } from '../i18n';
import { el } from './dom';
import { createQuiz } from './quiz';

export interface StarCriterion {
  label: string;
  achieved: boolean;
}

export interface ResultOptions {
  kind: 'win' | 'lose' | 'limit';
  stats: RunStats | null;
  stars: number;
  criteria: StarCriterion[];
  quiz: QuizQuestion[];
  quizPassed: boolean;
  /** Kỷ lục đã lưu của màn (để nhắc học sinh nếu lượt này kém hơn). */
  bestStars?: number;
  lessons: string[];
  onQuizPassed: () => void;
  onReplay: () => void;
  onExit: () => void;
  onExplore: () => void;
  nextHref?: string | null;
  nextLabel?: string;
}

export interface ResultApi {
  root: HTMLElement;
  close(): void;
}

export function renderStars(stars: number, total = 3): HTMLElement {
  const wrap = el('span', {
    className: 'stars',
    attrs: { role: 'img', 'aria-label': `${stars}/${total} sao` },
  });
  for (let i = 0; i < total; i += 1) {
    wrap.append(
      el('span', {
        className: `stars__item${i < stars ? ' is-on' : ''}`,
        text: i < stars ? '★' : '☆',
        attrs: { 'aria-hidden': 'true' },
      }),
    );
  }
  return wrap;
}

function statsLine(stats: RunStats | null): string {
  if (!stats) return '';
  const parts = [`Ô đã xét: ${stats.visited}`, `Ô đã phát hiện: ${stats.opened}`];
  parts.push(stats.pathLen === null ? 'Chưa tới được đích' : `Đường đi: ${stats.pathLen} bước`);
  return parts.join(' · ');
}

export function openResultOverlay(options: ResultOptions): ResultApi {
  const previousFocus = document.activeElement as HTMLElement | null;
  const titleId = 'result-title';
  const isWin = options.kind === 'win';

  const title =
    options.kind === 'win' ? t('result.win') : options.kind === 'limit' ? t('result.limit') : t('result.lose');
  const subtitle =
    options.kind === 'win'
      ? statsLine(options.stats)
      : options.kind === 'limit'
        ? 'Robot đã đi lòng vòng quá lâu nên mình dừng lại cho đỡ mệt. Thử giảm mật độ tường hoặc đổi thuật toán nhé!'
        : 'Đã xét hết các ô có thể tới mà chưa gặp đích. Thử dời đích hoặc giảm mật độ tường xem sao!';

  const starsSection = el('div', { className: 'overlay__section', attrs: { hidden: true } });
  const starBig = renderStars(options.stars, 3);
  starBig.classList.add('stars--big');
  const criteriaList = el('ul', { className: 'star-list' });
  for (const criterion of options.criteria) {
    criteriaList.append(
      el('li', {
        attrs: { 'data-achieved': String(criterion.achieved) },
        children: [criterion.achieved ? '★' : '☆', el('span', { text: criterion.label })],
      }),
    );
  }
  starsSection.append(
    el('h3', { className: 'panel__title', text: `⭐ ${t('panel.stars')}` }),
    starBig,
    criteriaList,
  );

  if (options.bestStars !== undefined && options.bestStars > options.stars) {
    starsSection.append(
      el('p', {
        className: 'muted',
        text: `Kỷ lục của bạn ở màn này: ${'★'.repeat(options.bestStars)}${'☆'.repeat(3 - options.bestStars)} — vẫn được giữ nhé!`,
      }),
    );
  }

  const lessonsSection = el('div', {
    className: 'overlay__section',
    children: [
      el('h3', { className: 'panel__title', text: `📚 ${t('panel.lessons')}` }),
      el('ul', {
        className: 'lesson-list',
        children: options.lessons.map((lesson) => el('li', { text: lesson })),
      }),
    ],
  });

  const actions = el('div', { className: 'overlay__actions' });
  const replayBtn = el('button', {
    className: 'btn btn--primary',
    text: `↻ ${t('result.playAgain')}`,
    attrs: { type: 'button' },
  });
  replayBtn.addEventListener('click', () => {
    close();
    options.onReplay();
  });
  actions.append(replayBtn);

  if (isWin) {
    const exploreBtn = el('button', {
      className: 'btn',
      text: t('result.keepExploring'),
      attrs: { type: 'button' },
    });
    exploreBtn.addEventListener('click', () => {
      close();
      options.onExplore();
    });
    actions.append(exploreBtn);
  }

  if (isWin && options.nextHref) {
    actions.append(
      el('a', {
        className: 'btn btn--ghost',
        text: `${t('result.next')} →`,
        attrs: { href: options.nextHref },
      }),
    );
  }

  const exitBtn = el('a', {
    className: 'btn btn--ghost',
    text: `🗺️ ${t('result.backToMap')}`,
    attrs: { href: '/lo-trinh' },
  });
  actions.append(exitBtn);

  const quizMount = el('div', { className: 'overlay__section' });
  const card = el('div', {
    className: 'overlay__card',
    attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, tabindex: -1 },
    children: [
      el('h2', { className: 'overlay__title', attrs: { id: titleId }, text: title }),
      el('p', { className: 'overlay__sub', text: subtitle }),
      isWin ? quizMount : null,
      starsSection,
      lessonsSection,
      actions,
    ],
  });

  const root = el('div', { className: 'overlay', children: [card] });

  let quizPassed = options.quizPassed;
  let awarded = false;

  function revealStars(): void {
    starsSection.hidden = false;
    if (!awarded) {
      awarded = true;
      options.onQuizPassed();
    }
  }

  if (isWin) {
    if (quizPassed) {
      revealStars();
    } else {
      const quiz = createQuiz({
        questions: options.quiz,
        withHeading: false,
        onPassed: () => {
          quizPassed = true;
          revealStars();
        },
      });
      quizMount.append(
        el('h3', { className: 'panel__title', text: `🧠 ${t('panel.quiz')}` }),
        el('p', { className: 'panel__subtitle', text: 'Trả lời đúng để nhận sao cho màn này nhé.' }),
        quiz.root,
      );
      // Bỏ khung panel lồng nhau cho gọn.
      quiz.root.classList.remove('panel');
    }
  }

  function close(): void {
    root.remove();
    document.removeEventListener('keydown', onKey);
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && isWin) {
      event.preventDefault();
      close();
      options.onExplore();
    }
  }

  document.addEventListener('keydown', onKey);
  document.body.append(root);
  card.focus();

  return { root, close };
}
