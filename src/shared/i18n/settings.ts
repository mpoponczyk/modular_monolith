export const FALLBACK_LOCALE = 'en';
export const SUPPORTED_LOCALES = ['en', 'pl', 'de', 'ua'] as const;
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
export const DEFAULT_NS = 'common';

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function normalizeLocale(input: string | undefined | null): Locale {
    if (!input) return FALLBACK_LOCALE;
    const found = SUPPORTED_LOCALES.find((l) => l === input);
    return found || FALLBACK_LOCALE;
}
