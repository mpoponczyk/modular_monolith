import { getDynamicMenuItems } from '@/core/menu/dynamic';
import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { getDictionary, getLocaleFromCookies } from '@/shared/i18n/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { LayoutGrid, FileText, Settings, Users, Box, BarChart3, Shield } from 'lucide-react';

// Manual icon mapping or generic fallback
const ICON_MAP: Record<string, any> = {
    'dashboard': LayoutGrid,
    'users': Users,
    'settings': Settings,
    'finance': BarChart3,
    'security': Shield,
    // Add more as needed
};

export default async function AppLibraryPage({
    params
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    const authContext = await resolveAuthContext(tenantSlug);

    if (!authContext) {
        redirect('/login');
    }

    const { userContext, tenantContext } = authContext;
    // Strict Dynamic Menu (DB-driven)
    const menuItems = await getDynamicMenuItems(tenantContext.tenantId, tenantContext.slug);

    const locale = await getLocaleFromCookies();
    const dict = await getDictionary(locale, 'common');

    // Helper for translations
    const t = (key: string) => {
        const keys = key.split('.');
        let value: any = dict;
        for (const k of keys) {
            value = value?.[k];
        }
        return value || key;
    };

    // Grouping Logic
    const sections: Record<string, typeof menuItems> = {};

    menuItems.forEach(item => {
        const group = item.group || 'general';
        if (!sections[group]) {
            sections[group] = [];
        }
        sections[group].push(item);
    });

    // Fetch Translations in parallel
    const translationPromises = menuItems.map(async (item) => {
        const registryModule = require('@/core/moduleRegistry').moduleRegistry.getModule(item.id);
        if (registryModule?.getTranslations) {
            try {
                const trans = await registryModule.getTranslations(locale);
                console.log(`[i18n Debug] App ${item.id} lang ${locale} ->`, trans);
                return {
                    id: item.id,
                    name: trans?.name || item.name,
                    description: trans?.description || `Access the ${item.name} module.`
                };
            } catch (err) {
                console.error(`[i18n Error] App ${item.id} lang ${locale} threw:`, err);
            }
        } else {
            console.log(`[i18n Debug] App ${item.id} has no getTranslations method.`);
        }
        return {
            id: item.id,
            name: item.name,
            description: `Access the ${item.name} module.`
        };
    });

    const translatedModules = await Promise.all(translationPromises);
    const translationMap = new Map(translatedModules.map(t => [t.id, t]));

    const sectionKeys = Object.keys(sections).sort();

    // Fetch Translations for Groups (Sections) in parallel
    const sectionPromises = sectionKeys.map(async (sectionId) => {
        const rootModule = require('@/core/moduleRegistry').moduleRegistry.getModule(sectionId);
        if (rootModule?.getTranslations) {
            const trans = await rootModule.getTranslations(locale);
            return {
                id: sectionId,
                name: trans?.name || sectionId
            };
        }
        return {
            id: sectionId,
            name: sectionId
        };
    });

    const translatedSectionsList = await Promise.all(sectionPromises);
    const sectionTranslationMap = new Map(translatedSectionsList.map(t => [t.id, t.name]));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-foreground">{t('apps.title') !== 'apps.title' ? t('apps.title') : 'App Library'}</h1>
                <p className="text-muted-foreground mt-2">{t('dashboard.welcome')}</p>
            </div>

            <div className="grid gap-8">
                {sectionKeys.map(section => (
                    <div key={section} className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 capitalize">
                            {sectionTranslationMap.get(section) || section}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {sections[section].map(item => {
                                const Icon = ICON_MAP[item.id] || Box;
                                const trans = translationMap.get(item.id);

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.path}
                                        className="group block p-6 bg-card hover:bg-sidebar-accent border border-border rounded-xl transition-all hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="p-3 bg-sidebar-primary/10 text-sidebar-primary rounded-lg group-hover:bg-sidebar-primary group-hover:text-sidebar-primary-foreground transition-colors">
                                                <Icon size={24} />
                                            </div>
                                            <h3 className="font-semibold text-lg text-foreground group-hover:text-sidebar-accent-foreground">
                                                {trans?.name || item.name}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {trans?.description || `Access the ${item.name} module.`}
                                        </p>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
