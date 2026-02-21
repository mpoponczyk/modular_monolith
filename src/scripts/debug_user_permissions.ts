import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Find a test user and tenant
    const { data: tu, error: tuError } = await supabase
        .from('tenant_users')
        .select('user_id, tenant_id')
        .limit(1)
        .single();

    if (tuError || !tu) {
        console.error('No tenant user found:', tuError);
        return;
    }

    console.log(`Testing with User: ${tu.user_id}, Tenant: ${tu.tenant_id}`);

    // 2. Run the exact query from SupabaseUserRepository
    const { data, error } = await supabase
        .from('tenant_users')
        .select(`
            role_id,
            roles!inner (
                id,
                tenant_id,
                role_permissions!inner (
                    permissions!inner (
                        key
                    )
                )
            )
        `)
        .eq('tenant_id', tu.tenant_id)
        .eq('user_id', tu.user_id)
        .single();

    console.log('--- Query Result ---');
    console.log(JSON.stringify(data, null, 2));

    if (error) {
        console.error('Query Error:', error);
    }
}

run();
