
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seed() {
    const email = 'admin@example.com';
    const password = 'admin1';
    const tenantSlug = 'demo-tenant';
    const tenantName = 'Demo Tenant';
    const roleName = 'Owner';

    console.log(`🌱 Seeding Admin: ${email} / ${password}`);

    // 1. Create User
    const { data: { users } } = await supabase.auth.admin.listUsers();
    let user = users.find(u => u.email === email);

    if (!user) {
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: 'Admin User' }
        });
        if (error) {
            console.error('Error creating user:', error);
            process.exit(1);
        }
        user = data.user!;
        console.log('✅ User created:', user.id);
    } else {
        console.log('ℹ️ User already exists:', user.id);
        await supabase.auth.admin.updateUserById(user.id, { password });
        console.log('✅ Password reset to admin1');
    }

    // 2. Create Tenant
    const { data: existingTenants } = await supabase.from('tenants').select('*').eq('slug', tenantSlug);
    let tenantId;
    if (existingTenants && existingTenants.length > 0) {
        tenantId = existingTenants[0].id;
        console.log('ℹ️ Tenant already exists:', tenantId);
    } else {
        const { data: newTenant, error: insertError } = await supabase
            .from('tenants')
            .insert({
                name: tenantName,
                slug: tenantSlug,
                status: 'active'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating tenant:', insertError);
            process.exit(1);
        }
        tenantId = newTenant.id;
        console.log('✅ Tenant created:', tenantId);
    }

    // 2.5 Find or Create Role
    let roleId = null;

    // Try to find ANY role for this tenant
    const { data: existingRoles } = await supabase.from('company_roles').select('id, name').eq('tenant_id', tenantId).limit(1);
    if (existingRoles && existingRoles.length > 0) {
        roleId = existingRoles[0].id;
        console.log('ℹ️ Found existing company_role:', existingRoles[0].name, roleId);
    } else {
        // Try to create WITHOUT permissions column
        const { data: createdRole, error: roleError } = await supabase
            .from('company_roles')
            .insert({
                tenant_id: tenantId,
                name: roleName
                // permissions removed
            })
            .select()
            .single();

        if (!roleError && createdRole) {
            roleId = createdRole.id;
            console.log('✅ Role created in company_roles:', roleId);
        } else {
            console.warn('⚠️ Failed to create company_role:', roleError?.message);
            // Try 'roles' table
            const { data: createdRole2, error: roleError2 } = await supabase
                .from('roles')
                .insert({
                    tenant_id: tenantId,
                    name: roleName
                })
                .select()
                .single();
            if (!roleError2 && createdRole2) {
                roleId = createdRole2.id;
                console.log('✅ Role created in roles:', roleId);
            }
        }
    }

    // 3. Link User to Tenant
    const { data: existingLink } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id);

    if (!existingLink || existingLink.length === 0) {
        const payload: any = {
            tenant_id: tenantId,
            user_id: user.id
        };
        if (roleId) {
            // Try explicit column naming if 'role_id' fails? 
            // Standard is role_id.
            payload.role_id = roleId;
        }

        const { error: linkError } = await supabase
            .from('tenant_users')
            .insert(payload);

        if (linkError) {
            console.error('Error linking user to tenant:', linkError);
            // If it still fails with P0001, maybe it needs a specific Role Name?
            process.exit(1);
        }
        console.log('✅ User linked to tenant');
    } else {
        console.log('ℹ️ User already linked to tenant');
    }

    console.log('🎉 Seed complete!');
}

seed();
