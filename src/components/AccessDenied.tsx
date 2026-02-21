
'use client';

import React from 'react';
import { useTranslation } from '@/shared/i18n/client';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AccessDeniedProps {
    tenantSlug: string;
    requiredPermission?: string;
}

export default function AccessDenied({ tenantSlug, requiredPermission }: AccessDeniedProps) {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 rounded-full bg-red-100 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <ShieldAlert size={48} />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
                {t('access_denied.title')}
            </h1>
            <p className="mb-6 max-w-md text-muted-foreground">
                {t('access_denied.description')}
            </p>

            {requiredPermission && (
                <div className="mb-8 rounded-md bg-muted px-4 py-2 text-sm font-mono text-muted-foreground">
                    {t('access_denied.missing_permission')}: <span className="text-foreground">{requiredPermission}</span>
                </div>
            )}

            <Button asChild>
                <Link href={`/admin/t/${tenantSlug}/dashboard`}>
                    {t('access_denied.back_to_dashboard')}
                </Link>
            </Button>
        </div>
    );
}
