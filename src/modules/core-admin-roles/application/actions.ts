
'use server';

import { createAuthClient } from '@/infra/supabase/server-auth';
import { RolesRepository } from '../infrastructure/SupabaseRoleRepository';
import { verifyTenantAccess } from '@/core/auth/access';
import { revalidatePath } from 'next/cache';

export async function listRolesAction(tenantSlug: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'roles.view');

    const repo = new RolesRepository(supabase, tenantId);
    const roles = await repo.listRoles();

    // Map granular permissions back to legacy 'admin_role_apps' array structure to satisfy the untyped legacy UI
    return roles.map(r => ({
        ...r,
        admin_role_apps: r.permissions.map(p => ({ app_id: p }))
    }));
}

export async function createRoleAction(tenantSlug: string, formData: FormData) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'roles.manage');

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const appsJson = formData.get('apps') as string;
    const apps = appsJson ? JSON.parse(appsJson) : [];

    if (!name) throw new Error("Name is required");

    const repo = new RolesRepository(supabase, tenantId);
    const roleId = await repo.createRole(name, description);

    // After creating the role, immediately update its permissions based on the selected apps
    if (apps.length > 0) {
        await repo.updateRolePermissions(roleId, apps);
    }

    revalidatePath(`/admin/t/${tenantSlug}/apps/core-admin/roles`);
}

export async function updateRoleAction(tenantSlug: string, roleId: string, formData: FormData) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'roles.manage');

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const appsJson = formData.get('apps') as string;
    const apps = appsJson ? JSON.parse(appsJson) : [];

    if (!name) throw new Error("Name is required");

    const repo = new RolesRepository(supabase, tenantId);
    await repo.updateRole(roleId, name, description);

    // Refresh permissions
    await repo.updateRolePermissions(roleId, apps);

    revalidatePath(`/admin/t/${tenantSlug}/apps/core-admin/roles`);
}

export async function deleteRoleAction(tenantSlug: string, roleId: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'roles.manage');

    const repo = new RolesRepository(supabase, tenantId);
    await repo.deleteRole(roleId);

    revalidatePath(`/admin/t/${tenantSlug}/apps/core-admin/roles`);
}

export async function listPermissionsAction(tenantSlug: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'roles.view');

    const repo = new RolesRepository(supabase, tenantId);
    return await repo.listPermissions();
}
