
import { getLocaleFromCookies } from '@/shared/i18n/server';
import { verifyPageAccess } from '@/core/auth/actions';
import { listUsersAction, getRolesAction } from '../application/actions';
import { UsersContent } from './users-content';
import { AdminPageHeader } from "@/components/admin-page-header";

export default async function UsersPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const { tenantSlug } = await params;

    // Fetch dependencies for users module exactly as legacy
    const users = await listUsersAction(tenantSlug);
    const roles = await getRolesAction(tenantSlug);

    // Hardcoded logic for root user validation (as it was in original module porting)
    const currentUserIsRoot = false;

    return (
        <div className="space-y-6 animate-in fade-in">
            <AdminPageHeader
                titleKey="admin.usersTitle"
                subtitleKey="admin.users.subtitle"
                title="Technical Users"
                description="Manage administrator accounts and role assignments"
            />

            <div className="px-4 md:px-12 pb-12">
                <UsersContent
                    tenantSlug={tenantSlug}
                    users={users}
                    roles={roles}
                    currentUserIsRoot={currentUserIsRoot}
                />
            </div>
        </div>
    );
}
