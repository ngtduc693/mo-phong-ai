import type { ChallengeDef, ParamDef, ParamValues } from '../levels/types';
import { applyChallenge, defaultParams } from '../engine/params';
import { t } from '../i18n';
import { el } from './dom';

export interface ParamsPanelOptions {
  defs: ParamDef[];
  challenges: ChallengeDef[];
  initialValues?: ParamValues;
  initialChallengeId?: string;
  onChange?: (values: ParamValues, key: string) => void;
  onChallenge?: (challenge: ChallengeDef) => void;
}

export interface ParamsPanelApi {
  root: HTMLElement;
  values(): ParamValues;
  setValues(next: ParamValues): void;
  setDisabled(disabled: boolean): void;
  challenge(): ChallengeDef | undefined;
}

function formatValue(def: ParamDef, value: number | string | boolean): string {
  if (def.kind !== 'slider') return String(value);
  const n = typeof value === 'number' ? value : def.def;
  if (def.unit === '%') return `${Math.round(n * 100)}%`;
  return `${n}${def.unit ?? ''}`;
}

const FLAVORS: Record<string, string> = {
  easy: 'làm theo hướng dẫn',
  medium: 'tự chọn tham số',
  hard: 'tình huống bẫy',
};

export function createParamsPanel(options: ParamsPanelOptions): ParamsPanelApi {
  const { defs, challenges } = options;
  const root = el('div', { className: 'params' });
  let values: ParamValues = options.initialValues ? { ...options.initialValues } : defaultParams(defs);
  let selected = challenges.find((c) => c.id === options.initialChallengeId) ?? challenges[0];
  const syncs: Array<(v: ParamValues) => void> = [];

  if (challenges.length > 0) {
    const list = el('div', {
      className: 'challenge-list',
      attrs: { role: 'group', 'aria-label': t('panel.challenge') },
    });
    const buttons = new Map<string, HTMLButtonElement>();
    for (const challenge of challenges) {
      const btn = el('button', {
        className: 'challenge',
        attrs: { type: 'button', 'aria-pressed': String(challenge === selected) },
        children: [
          el('strong', { text: `${challenge.label} — ${FLAVORS[challenge.id] ?? ''}` }),
          el('span', { text: challenge.desc }),
        ],
      });
      btn.addEventListener('click', () => {
        selected = challenge;
        for (const [id, b] of buttons) b.setAttribute('aria-pressed', String(id === challenge.id));
        values = applyChallenge(defs, values, challenge);
        for (const sync of syncs) sync(values);
        options.onChallenge?.(challenge);
        options.onChange?.(values, '__challenge');
      });
      buttons.set(challenge.id, btn);
      list.append(btn);
    }
    root.append(
      el('section', {
        className: 'panel',
        children: [el('h2', { className: 'panel__title', text: `🎯 ${t('panel.challenge')}` }), list],
      }),
    );
  }

  const fields = el('div');
  for (const def of defs) {
    const value = values[def.key] ?? def.def;
    const labelId = `param-${def.key}-label`;
    const helpId = def.help ? `param-${def.key}-help` : undefined;

    if (def.kind === 'slider') {
      const output = el('span', { className: 'field__value', text: formatValue(def, value) });
      const input = el('input', {
        attrs: {
          type: 'range',
          id: `param-${def.key}`,
          min: def.min,
          max: def.max,
          step: def.step,
          value: typeof value === 'number' ? value : def.def,
          'aria-describedby': helpId,
        },
      });
      input.addEventListener('input', () => {
        values[def.key] = Number(input.value);
        output.textContent = formatValue(def, values[def.key] as number);
        options.onChange?.(values, def.key);
      });
      fields.append(
        el('div', {
          className: 'field',
          children: [
            el('label', {
              className: 'field__label',
              attrs: { for: input.id, id: labelId },
              children: [el('span', { text: def.label }), output],
            }),
            input,
            def.help ? el('p', { className: 'field__help', attrs: { id: helpId }, text: def.help }) : null,
          ],
        }),
      );
      syncs.push((next) => {
        const v = next[def.key];
        if (typeof v === 'number') {
          input.value = String(v);
          output.textContent = formatValue(def, v);
        }
      });
      continue;
    }

    if (def.kind === 'segmented') {
      const group = el('div', { className: 'segmented', attrs: { role: 'group', 'aria-labelledby': labelId } });
      const buttons: Array<{ option: string; node: HTMLButtonElement }> = [];
      for (const option of def.options) {
        const btn = el('button', {
          className: 'segmented__btn',
          text: option.label,
          attrs: { type: 'button', 'aria-pressed': String(option.value === String(value)) },
        });
        btn.addEventListener('click', () => {
          values[def.key] = option.value;
          for (const b of buttons) b.node.setAttribute('aria-pressed', String(b.option === option.value));
          options.onChange?.(values, def.key);
        });
        buttons.push({ option: option.value, node: btn });
        group.append(btn);
      }
      fields.append(
        el('div', {
          className: 'field',
          children: [
            el('span', { className: 'field__label', attrs: { id: labelId }, text: def.label }),
            group,
            def.help ? el('p', { className: 'field__help', attrs: { id: helpId }, text: def.help }) : null,
          ],
        }),
      );
      syncs.push((next) => {
        const v = String(next[def.key]);
        for (const b of buttons) b.node.setAttribute('aria-pressed', String(b.option === v));
      });
      continue;
    }

    if (def.kind === 'select') {
      const select = el('select', { className: 'speed-select', attrs: { id: `param-${def.key}`, 'aria-describedby': helpId } });
      for (const option of def.options) {
        select.append(el('option', { text: option.label, attrs: { value: option.value } }));
      }
      select.value = String(value);
      select.addEventListener('change', () => {
        values[def.key] = select.value;
        options.onChange?.(values, def.key);
      });
      fields.append(
        el('div', {
          className: 'field',
          children: [
            el('label', { className: 'field__label', attrs: { for: select.id }, text: def.label }),
            select,
            def.help ? el('p', { className: 'field__help', attrs: { id: helpId }, text: def.help }) : null,
          ],
        }),
      );
      syncs.push((next) => {
        const v = next[def.key];
        if (typeof v === 'string') select.value = v;
      });
      continue;
    }

    const checkbox = el('input', { attrs: { type: 'checkbox', id: `param-${def.key}`, checked: Boolean(value) } });
    checkbox.addEventListener('change', () => {
      values[def.key] = checkbox.checked;
      options.onChange?.(values, def.key);
    });
    fields.append(
      el('div', {
        className: 'field',
        children: [
          el('label', { className: 'switch', attrs: { for: checkbox.id }, children: [checkbox, def.label] }),
          def.help ? el('p', { className: 'field__help', text: def.help }) : null,
        ],
      }),
    );
    syncs.push((next) => {
      checkbox.checked = Boolean(next[def.key]);
    });
  }

  root.append(
    el('section', {
      className: 'panel',
      children: [el('h2', { className: 'panel__title', text: `🎛️ ${t('panel.params')}` }), fields],
    }),
  );

  return {
    root,
    values: () => ({ ...values }),
    setValues(next) {
      values = { ...values, ...next };
      for (const sync of syncs) sync(values);
    },
    setDisabled(disabled) {
      const nodes = root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>(
        'input, select, button',
      );
      for (const node of Array.from(nodes)) node.disabled = disabled;
    },
    challenge: () => selected,
  };
}

