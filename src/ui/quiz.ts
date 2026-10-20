import type { QuizQuestion } from '../levels/types';
import { t } from '../i18n';
import { el } from './dom';

export interface QuizOptions {
  questions: QuizQuestion[];
  onPassed?: () => void;
  /** Hiện tiêu đề mục (mặc định có). */
  withHeading?: boolean;
}

export interface QuizApi {
  root: HTMLElement;
  reset(): void;
  isPassed(): boolean;
}

export function createQuiz(options: QuizOptions): QuizApi {
  const { questions } = options;
  let passed = false;
  const form = el('form', { attrs: { novalidate: true } });
  const feedbackNodes: Array<{ node: HTMLElement; question: QuizQuestion; inputs: HTMLInputElement[] }> = [];

  questions.forEach((question, index) => {
    const fieldset = el('fieldset', { className: 'quiz__question' });
    fieldset.append(
      el('legend', { text: `${index + 1}. ${question.question}` }),
    );
    const inputs: HTMLInputElement[] = [];
    question.options.forEach((option, optionIndex) => {
      const inputId = `quiz-${question.id}-${optionIndex}`;
      const input = el('input', {
        attrs: { type: 'radio', name: `quiz-${question.id}`, id: inputId, value: optionIndex },
      });
      inputs.push(input);
      fieldset.append(
        el('label', {
          className: 'quiz__option',
          attrs: { for: inputId },
          children: [input, el('span', { text: option })],
        }),
      );
    });
    const feedback = el('p', { className: 'quiz__feedback', attrs: { hidden: true, 'aria-live': 'polite' } });
    fieldset.append(feedback);
    feedbackNodes.push({ node: feedback, question, inputs });
    form.append(fieldset);
  });

  const submit = el('button', {
    className: 'btn btn--primary',
    text: t('panel.quizCheck'),
    attrs: { type: 'submit' },
  });
  const summary = el('p', { className: 'muted', attrs: { 'aria-live': 'polite' } });
  form.append(submit, summary);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (passed) return;
    let allCorrect = true;
    for (const { node, question, inputs } of feedbackNodes) {
      const chosen = inputs.findIndex((input) => input.checked);
      node.hidden = false;
      node.classList.remove('is-correct', 'is-wrong');
      if (chosen === -1) {
        allCorrect = false;
        node.classList.add('is-wrong');
        node.textContent = 'Bạn chưa chọn đáp án cho câu này.';
        continue;
      }
      if (chosen === question.answer) {
        node.classList.add('is-correct');
        node.textContent = `✓ ${t('panel.quizCorrect')} ${question.explain}`;
      } else {
        allCorrect = false;
        node.classList.add('is-wrong');
        node.textContent = `✗ ${t('panel.quizWrong')} ${question.explain}`;
      }
    }

    if (allCorrect) {
      passed = true;
      for (const { inputs } of feedbackNodes) for (const input of inputs) input.disabled = true;
      submit.disabled = true;
      summary.textContent = 'Bạn đã hiểu bài — sao đang được trao!';
      options.onPassed?.();
    } else {
      summary.textContent = 'Còn câu chưa đúng, sửa lại rồi bấm kiểm tra nhé.';
    }
  });

  const root = el('section', {
    className: 'panel quiz',
    children: [
      options.withHeading === false
        ? null
        : el('h2', { className: 'panel__title', text: `🧠 ${t('panel.quiz')}` }),
      el('p', { className: 'panel__subtitle', text: t('panel.quizIntro') }),
      form,
    ],
  });

  return {
    root,
    reset() {
      passed = false;
      form.reset();
      for (const { node, inputs } of feedbackNodes) {
        node.hidden = true;
        node.textContent = '';
        for (const input of inputs) input.disabled = false;
      }
      submit.disabled = false;
      summary.textContent = '';
    },
    isPassed: () => passed,
  };
}
