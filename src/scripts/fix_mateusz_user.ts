
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

async function fixUser() {
    const email = 'mateusz.poponczyk@gmail.com';
    const password = 'password123';
    // Use the same tenant as seed_admin (likely 'demo-tenant')
    const tenantSlug = 'demo-tenant';

    console.log(`🔧 Fixing User: ${email} -> ${password}`);

    // 1. Get or Create User
    const { data: { users } } = await supabase.auth.admin.listUsers();
    let user = users.find(u => u.email === email);

    if (!user) {
        console.log('Creating new user...');
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: 'Mateusz Poponczyk' }
        });
        if (error) {
            console.error('Error creating user:', error);
            process.exit(1);
        }
        user = data.user!;
        console.log('✅ User created:', user.id);
    } else {
        console.log('User exists, updating password...');
        const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
        if (error) {
            console.error('Error updating password:', error);
            process.exit(1);
        }
        console.log('✅ Password updated');
    }

    // 2. Get Tenant
    const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenantSlug)
        .single();

    if (tenantError || !tenantData) {
        console.error('❌ Tenant not found:', tenantSlug);
        console.log('Run seed_admin.ts first!');
        process.exit(1);
    }

    const tenantId = tenantData.id;
    console.log(`Target Tenant: ${tenantId} (${tenantSlug})`);

    // 3. Link User to Tenant (tenant_users)
    const { data: existingLink } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id);

    if (!existingLink || existingLink.length === 0) {
        // Find a role explicitly?
        // Let's try to find 'Owner' role
        const { data: roleData } = await supabase
            .from('roles') // try roles table first as seed_admin used it successfully last
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('name', 'Owner')
            .single();

        const payload: any = {
            tenant_id: tenantId,
            user_id: user.id
        };

        if (roleData) {
            payload.role_id = roleData.id;
        }

        const { error: linkError } = await supabase
            .from('tenant_users')
            .insert(payload);

        if (linkError) {
            console.error('Error linking user:', linkError);
            process.exit(1);
        }
        console.log('✅ User linked to tenant successfully');
    } else {
        console.log('ℹ️ User already linked to tenant');
    }

    console.log('🎉 Fix complete!');
}

fixUser();
