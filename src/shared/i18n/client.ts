'use client';

import React, { createContext, useContext } from 'react';
import { createT } from './server'; // Reusing createT logic is fine if pure function, but better to duplicate for client bundle purity? 
// Actually createT in server.ts is just a function, we can duplicate minimal logic here to avoid importing server file in client accidentally if Next.js complains.
// Let's duplicate createsT logic to be safe and dependency-free.

type TFunction = (key: string, vars?: Record<string, string | number>) => string;

const I18nContext = createContext<TFunction | null>(null);

export function I18nProvider({
    dict,
    children
}: {
    dict: Record<string, string>;
    children: React.ReactNode;
}) {
    // Memoize or just create function
    const t: TFunction = (key, vars) => {
        let text = dict[key] || key;
        if (vars) {
            for (const [k, v] of Object.entries(vars)) {
                text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
            }
        }
        return text;
    };

    return React.createElement(I18nContext.Provider, { value: t }, children);
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return { t: context };
}
