const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const userId = '9ba4ab2c-ba33-4ff3-a899-2048eb43e15a';
    const tenantId = '22a83baa-2246-4470-8b3c-f0bf1958aca4'; // test-tenant

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
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .single();
        
    console.log("Error:", error);
    console.log("Data:", JSON.stringify(data, null, 2));
}

run();
