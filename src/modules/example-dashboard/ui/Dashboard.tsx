// mateusz poponczyk
/**
 * Simple Dashboard Output
 * PURE UI - No Business Logic
 */
import React from 'react';
import { getDictionary, getLocaleFromCookies } from '@/shared/i18n/server';

export const DashboardComponent = async () => {
    const locale = await getLocaleFromCookies();
    const dict = await getDictionary(locale, 'common');

    // Simple helper if not using getT
    const t = (key: string) => {
        const keys = key.split('.');
        let value: any = dict;
        for (const k of keys) {
            value = value?.[k];
        }
        return value || key;
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
            <p>{t('dashboard.welcome')}</p>
        </div>
    );
};
