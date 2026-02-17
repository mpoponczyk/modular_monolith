import { getMenuItems } from '@/core/menu';
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
    const menuItems = getMenuItems(tenantContext, userContext);

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

    const sectionKeys = Object.keys(sections).sort();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-foreground">{t('apps.title')}</h1>
                <p className="text-muted-foreground mt-2">{t('dashboard.welcome')}</p>
            </div>

            <div className="grid gap-8">
                {sectionKeys.map(section => (
                    <div key={section} className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 capitalize">
                            {t(`apps.sections.${section}`) || section}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {sections[section].map(item => {
                                const Icon = ICON_MAP[item.id] || Box;
                                const isActive = item.path === `/admin/t/${tenantSlug}`; // Dashboard check

                                return (
                                    <Link
                                        key={item.id}
                                        href={`/admin/t/${tenantSlug}${item.path.replace('/admin', '')}`} // Fix path generation if needed, menu.ts usually returns full path /admin/[module]
                                        // Wait, menu.ts returns `/admin/${m.id}`. The tenant path is `/admin/t/${tenantSlug}/${m.id}` hopefully?
                                        // Let's check menu.ts again.
                                        // menu.ts returns path: `/admin/${m.id}`. 
                                        // We need to construct the tenant URL: `/admin/t/${tenantSlug}/${m.id}`.
                                        // BUT current menu items might already be handled by Sidebar logic.
                                        // Actually `item.path` in menu.ts is generic `/admin/module`.
                                        // In `HeaderAdminLayout`, it was doing: `/admin/t/${tenantSlug}${item.path}`.
                                        // So if item.path is `/admin/dashboard`, result is `/admin/t/slug/admin/dashboard` - WRONG.
                                        // Let's check HeaderAdminLayout again.

                                        className="group block p-6 bg-card hover:bg-sidebar-accent border border-border rounded-xl transition-all hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="p-3 bg-sidebar-primary/10 text-sidebar-primary rounded-lg group-hover:bg-sidebar-primary group-hover:text-sidebar-primary-foreground transition-colors">
                                                <Icon size={24} />
                                            </div>
                                            <h3 className="font-semibold text-lg text-foreground group-hover:text-sidebar-accent-foreground">
                                                {item.name}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {/* Description if available in module definition, else generic */}
                                            Access the {item.name} module.
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
