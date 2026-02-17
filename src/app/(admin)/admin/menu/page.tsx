
import React from 'react';
import { createAuthClient } from '@/infra/supabase/server-auth';
import { SectionService } from '@/modules/organization-menu-manager/application/SectionService';
import SectionManager from '@/modules/organization-menu-manager/ui/SectionManager';
import { redirect } from 'next/navigation';

export default async function SectionEditorPage() {
    const supabase = createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Resolve Organizational Context
    // Strict RLS will limit this to orgs the user has access to.
    // For MVP, we pick the first one.
    // Ideally, this should come from a route param or user preference.
    const { data: org, error } = await supabase
        .from('organizations')
        .select('id, tenant_id, name')
        .limit(1)
        .single();

    if (error || !org) {
        return (
            <div className="p-10 text-center text-slate-500">
                <h1 className="text-2xl font-bold mb-4">No Organization Context</h1>
                <p>You do not appear to be a member of any organization.</p>
                <div className="mt-4 text-xs font-mono bg-slate-100 p-2 rounded inline-block text-left">
                    Error: {error?.message || 'No org found'}
                </div>
            </div>
        );
    }

    // Auth Check for Admin Role?
    // SectionService RPCs will fail if not owner.
    // But we can let them see the UI and fail on write if they are just a member.
    // Or we can check owner_group_id here for better UX.

    // Fetch Data
    const [sections, sectionTranslations, sectionItems, itemsApps, languages] = await Promise.all([
        SectionService.getSections(org.tenant_id, org.id),
        SectionService.getSectionTranslations(org.tenant_id, org.id),
        SectionService.getSectionItems(org.tenant_id, org.id),
        SectionService.getOrganizationApps(org.tenant_id, org.id),
        SectionService.getOrganizationLanguages(org.tenant_id, org.id)
    ]);

    // apps passed to UI should be the fetched apps list
    // itemsApps is OrganizationApp[]

    const appTranslations: any[] = []; // Placeholder

    return (
        <div className="container mx-auto py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Menu Editor</h1>
                <p className="text-slate-500">Managing Menu for: <span className="font-semibold text-slate-700">{org.name}</span></p>
            </div>

            <SectionManager
                tenantId={org.tenant_id}
                orgId={org.id}
                sections={sections}
                sectionTranslations={sectionTranslations}
                sectionItems={sectionItems}
                apps={itemsApps}
                languages={languages}
                appTranslations={appTranslations}
            />
        </div>
    );
}
