/**
 * Tiện ích cho tham số màn chơi: giá trị mặc định, preset thử thách, tính sao.
 * Thuần TypeScript, không DOM.
 */
import type { RunStats } from '../core/events';
import type { ChallengeDef, ParamDef, ParamValues, StarRule } from '../levels/types';

export function defaultParams(defs: ParamDef[]): ParamValues {
  const out: ParamValues = {};
  for (const def of defs) out[def.key] = def.def;
  return out;
}

export function applyChallenge(defs: ParamDef[], base: ParamValues, challenge: ChallengeDef): ParamValues {
  const known = new Set(defs.map((d) => d.key));
  const next: ParamValues = { ...base };
  for (const [key, value] of Object.entries(challenge.preset)) {
    if (known.has(key)) next[key] = value;
  }
  return next;
}

export function clampParams(defs: ParamDef[], values: ParamValues): ParamValues {
  const out: ParamValues = { ...values };
  for (const def of defs) {
    const v = out[def.key];
    if (def.kind === 'slider') {
      const n = typeof v === 'number' && Number.isFinite(v) ? v : def.def;
      out[def.key] = Math.min(def.max, Math.max(def.min, n));
    } else if (def.kind === 'select' || def.kind === 'segmented') {
      const ok = typeof v === 'string' && def.options.some((o) => o.value === v);
      out[def.key] = ok ? v : def.def;
    } else if (def.kind === 'toggle') {
      out[def.key] = typeof v === 'boolean' ? v : def.def;
    }
  }
  return out;
}

export function asNumber(values: ParamValues, key: string, fallback: number): number {
  const v = values[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function asString(values: ParamValues, key: string, fallback: string): string {
  const v = values[key];
  return typeof v === 'string' ? v : fallback;
}

export function asBoolean(values: ParamValues, key: string, fallback: boolean): boolean {
  const v = values[key];
  return typeof v === 'boolean' ? v : fallback;
}

/** Đếm số tiêu chí đạt được (1-3 sao). */
export function evaluateStars(rules: StarRule[], stats: RunStats, params: ParamValues): number {
  let stars = 0;
  for (const rule of rules) {
    if (rule.check(stats, params)) stars += 1;
  }
  return Math.max(0, Math.min(rules.length, stars));
}
