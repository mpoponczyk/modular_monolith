import { cookies } from 'next/headers';
import {
    FALLBACK_LOCALE,
    LOCALE_COOKIE_NAME,
    Locale,
    normalizeLocale
} from './settings';

export async function getLocaleFromCookies(): Promise<Locale> {
    const cookieStore = await cookies();
    const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    return normalizeLocale(value);
}

export async function getDictionary(locale: Locale, namespace: 'common' | 'auth'): Promise<Record<string, string>> {
    try {
        // Dynamic import based on locale and namespace from shared/i18n/locales
        const dict = (await import(`@/shared/i18n/locales/${locale}/${namespace}.json`)).default;
        return dict;
    } catch (error) {
        console.warn(`[I18n] Failed to load dictionary for ${locale}/${namespace}, falling back to ${FALLBACK_LOCALE}`);
        try {
            const fallback = (await import(`@/shared/i18n/locales/${FALLBACK_LOCALE}/${namespace}.json`)).default;
            return fallback;
        } catch (e) {
            console.error(`[I18n] Critical: Fallback dictionary missing for ${namespace}`);
            return {};
        }
    }
}

export function createT(dict: Record<string, string>) {
    return (key: string, vars?: Record<string, string | number>) => {
        let text = dict[key] || key;
        if (vars) {
            for (const [k, v] of Object.entries(vars)) {
                text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
            }
        }
        return text;
    };
}

export async function getT(namespace: 'common' | 'auth' = 'common') {
    const locale = await getLocaleFromCookies();
    const dict = await getDictionary(locale, namespace);
    return createT(dict);
}
