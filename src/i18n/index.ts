import { vi, type TranslationKey } from './vi';

const dictionaries = { vi };

export type Locale = keyof typeof dictionaries;

let locale: Locale = 'vi';

export function setLocale(next: Locale): void {
  locale = next;
}

export function getLocale(): Locale {
  return locale;
}

export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  const dict = dictionaries[locale] ?? vi;
  let text: string = dict[key] ?? vi[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export type { TranslationKey };
