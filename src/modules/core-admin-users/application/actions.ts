'use server';

import { createAuthClient } from '@/infra/supabase/server-auth';
import { verifyTenantAccess } from '@/core/auth/access';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/infra/database.types';

// Helper to create admin client dynamically for this module
function getAdminClient() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

export async function listUsersAction(tenantSlug: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'users.view');
    const adminClient = getAdminClient();

    // In legacy it was auth_profiles. In monolith it's admin_profiles.
    const { data: profiles } = await adminClient
        .from('admin_profiles')
        .select('*, admin_roles(name), tenant_users!inner(tenant_id)')
        .eq('tenant_users.tenant_id', tenantId);

    return profiles || [];
}

export async function getRolesAction(tenantSlug: string) {
    const supabase = createAuthClient();
    await verifyTenantAccess(supabase, tenantSlug, 'users.view');
    const adminClient = getAdminClient();

    const { data: roles } = await adminClient
        .from('admin_roles')
        .select('*');

    return roles || [];
}

export async function createUser(tenantSlug: string, data: any) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'users.manage');
    const adminClient = getAdminClient();

    // [SECURITY] Generate Invitation Link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const { data: inviteData, error: authError } = await adminClient.auth.admin.generateLink({
        type: 'invite',
        email: data.email,
        options: {
            redirectTo: `${siteUrl}/admin/auth/update?type=password`
        }
    });

    if (authError || !inviteData.user) throw new Error(authError?.message || "Błąd generowania zaproszenia");

    // Insert into admin_profiles
    const { error: profileError } = await adminClient
        .from('admin_profiles')
        .insert({
            id: inviteData.user.id,
            role_id: data.roleId || null,
            is_superadmin: data.isSuperadmin,
            first_name: data.firstName,
            last_name: data.lastName,
            login: data.login,
            phone: data.phone,
            email: data.email,
            is_active: false
        } as any);

    if (profileError) {
        // cleanup auth user
        await adminClient.auth.admin.deleteUser(inviteData.user.id);
        throw new Error(profileError.message);
    }

    // Bind to current tenant
    const { error: tenantUserError } = await adminClient
        .from('tenant_users')
        .insert({
            tenant_id: tenantId,
            user_id: inviteData.user.id
        } as any);

    if (tenantUserError) {
        await adminClient.auth.admin.deleteUser(inviteData.user.id);
        await adminClient.from('admin_profiles').delete().eq('id', inviteData.user.id);
        throw new Error(`Failed to bind user to tenant: ${tenantUserError.message}`);
    }
}

export async function updateUser(tenantSlug: string, id: string, data: any) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'users.manage');
    const adminClient = getAdminClient();

    // Guard: Verify target user belongs to this tenant
    const { data: tenantCheck } = await adminClient
        .from('tenant_users')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', id)
        .single();

    if (!tenantCheck) throw new Error("Unauthorized");

    // 1. Get current profile to check if email changed
    const { data: currentProfile } = await adminClient
        .from('admin_profiles')
        .select('email')
        .eq('id', id)
        .single() as any;

    const emailChanged = currentProfile && currentProfile.email !== data.email;

    // 2. Update Auth User if email changed
    if (emailChanged) {
        const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
            email: data.email,
            email_confirm: true
        });
        if (authError) throw new Error(`Błąd aktualizacji e-mail w Auth: ${authError.message}`);
    }

    // 3. Update Profile
    const { error } = await adminClient
        .from('admin_profiles')
        .update({
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            role_id: data.roleId,
            is_superadmin: data.isSuperadmin
        } as any)
        .eq('id', id);

    if (error) throw new Error(error.message);
}

export async function deleteUser(tenantSlug: string, id: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'users.manage');
    const adminClient = getAdminClient();

    const { data: tenantCheck } = await adminClient
        .from('tenant_users')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', id)
        .single();
    if (!tenantCheck) throw new Error("Unauthorized");

    const { error } = await adminClient.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);
}

export async function lockUser(tenantSlug: string, id: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'users.manage');
    const adminClient = getAdminClient();

    const { data: tenantCheck } = await adminClient
        .from('tenant_users')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', id)
        .single();
    if (!tenantCheck) throw new Error("Unauthorized");

    const { error } = await adminClient
        .from('admin_profiles')
        .update({
            is_active: false,
            locked_at: new Date().toISOString()
        } as any)
        .eq('id', id);

    if (error) throw new Error(error.message);

    await adminClient.auth.admin.signOut(id);
    await adminClient.from('auth_trusted_devices').delete().eq('user_id', id);
}

export async function unlockUser(tenantSlug: string, id: string, email: string, firstName: string, lastName: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'users.manage');
    const adminClient = getAdminClient();

    const { data: tenantCheck } = await adminClient
        .from('tenant_users')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', id)
        .single();
    if (!tenantCheck) throw new Error("Unauthorized");

    const { error: profileError } = await adminClient
        .from('admin_profiles')
        .update({
            failed_attempts: 0,
            locked_at: null,
            is_active: true
        } as any)
        .eq('id', id);

    if (profileError) throw new Error(profileError.message);

    await adminClient.auth.admin.signOut(id);
    await adminClient.from('auth_trusted_devices').delete().eq('user_id', id);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
            redirectTo: `${siteUrl}/admin/auth/update?type=password`
        }
    });
}

export async function resetUserPassword(tenantSlug: string, id: string, email: string, firstName: string, lastName: string) {
    const supabase = createAuthClient();
    const { tenantId } = await verifyTenantAccess(supabase, tenantSlug, 'users.manage');
    const adminClient = getAdminClient();

    const { data: tenantCheck } = await adminClient
        .from('tenant_users')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', id)
        .single();
    if (!tenantCheck) throw new Error("Unauthorized");

    await adminClient.auth.admin.signOut(id);
    await adminClient.from('auth_trusted_devices').delete().eq('user_id', id);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
            redirectTo: `${siteUrl}/admin/auth/update?type=password`
        }
    });

    return { success: true };
}
