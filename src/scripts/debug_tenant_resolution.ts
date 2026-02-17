
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
    auth: { autoRefreshToken: false, persistSession: false }
});

async function debug() {
    console.log('🔍 Debugging Tenant Resolution...\n');

    const EMAIL = 'section-admin@example.com';

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) { console.error('List Users Error:', userError); return; }

    const user = users.find(u => u.email === EMAIL);
    if (!user) { console.error(`User ${EMAIL} not found!`); return; }

    console.log(`User Found: ${user.id} (${user.email})`);

    // 2. Check tenant_users (Direct)
    console.log('\n--- Checking tenant_users ---');
    const { data: tenantUsers, error: tuError } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('user_id', user.id);

    if (tuError) console.error('tenant_users Error:', tuError);
    else {
        console.log(`tenant_users count: ${tenantUsers?.length}`);
        console.log(tenantUsers);
    }

    // 3. Check company_users (Indirect)
    console.log('\n--- Checking company_users ---');
    const { data: companyUsers, error: cuError } = await supabase
        .from('company_users')
        .select('*, company:companies(*)')
        .eq('user_id', user.id);

    if (cuError) console.error('company_users Error:', cuError);
    else {
        console.log(`company_users count: ${companyUsers?.length}`);
        console.log(JSON.stringify(companyUsers, null, 2));
    }

    // 4. Check orgs (Indirect)
    // Link via Owner Group
    console.log('\n--- Checking Owner Groups ---');
    const { data: groupMembers, error: gmError } = await supabase
        .from('group_members')
        .select('*, group:groups(*)')
        .eq('user_id', user.id);

    if (gmError) console.error('group_members Error:', gmError);
    else {
        console.log(`group_members count: ${groupMembers?.length}`);
        console.log(JSON.stringify(groupMembers, null, 2));
    }

    if ((tenantUsers || []).length === 0) {
        console.log('\n⚠️  CONCLUSION: User missing from `tenant_users` table. Implicit resolution relies on this table.');
    }
}

debug();
