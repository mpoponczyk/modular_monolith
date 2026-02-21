import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // using admin to see raw data
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function checkMenuData() {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const supabaseAnon = createClient(supabaseUrl, anonKey);

    const { data: tenant } = await supabaseAdmin.from('tenants').select('*').eq('slug', 'test-tenant').single();
    if (!tenant) return console.log('Tenant "test-tenant" missing');

    console.log(`Checking menu data for tenant ${tenant.id} (${tenant.slug})`);

    const { data: apps } = await supabaseAdmin.from('organization_apps').select('*').eq('tenant_id', tenant.id);
    console.log(`organization_apps count: ${apps?.length || 0}`);

    const { data: sections } = await supabaseAdmin.from('organization_sections').select('*').eq('tenant_id', tenant.id);
    console.log(`organization_sections count: ${sections?.length || 0}`);

    const { data: items } = await supabaseAdmin.from('organization_section_items').select('*').eq('tenant_id', tenant.id);
    console.log(`organization_section_items count: ${items?.length || 0}`);

    // Auth as the user to test the RPC
    const { data: auth, error: loginErr } = await supabaseAnon.auth.signInWithPassword({
        email: 'mateusz.poponczyk@gmail.com',
        password: 'password123'
    });

    if (loginErr) {
        console.error("Login failed:", loginErr.message);
        return;
    }

    // Call RPC as user
    console.log("Calling resolve_menu_structure...");
    const { data: rpcData, error: rpcErr } = await supabaseAnon.rpc('resolve_menu_structure', {
        p_tenant_id: tenant.id,
        p_locale: 'en'
    });

    if (rpcErr) {
        console.error("RPC Error:", rpcErr);
    } else {
        console.log(`RPC returned ${rpcData?.length || 0} sections.`);
        if (rpcData && rpcData.length > 0) {
            console.log(JSON.stringify(rpcData, null, 2));
        }
    }
}

checkMenuData().catch(console.error);
