
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TENANT_ID = '22a83baa-2246-4470-8b3c-f0bf1958aca4'; // Test Tenant

async function testQuery() {
    console.log("Testing Dynamic Menu Query...");

    // Use Service Role to bypass RLS for syntax check, 
    // OR use Anon key if we want to test RLS (but we need a user token then).
    // Let's first test if the Query Structure is valid for PostgREST.

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('organization_sections')
        .select(`
            id,
            order_index,
            is_enabled,
            organization_section_translations!inner(name),
            organization_section_items!inner(
                id,
                order_index,
                is_enabled,
                organization_apps!inner(
                    module_id,
                    is_active
                )
            )
        `)
        .eq('tenant_id', TENANT_ID)
        .eq('is_enabled', true)
        .eq('organization_section_translations.language_code', 'en')
        .order('order_index');

    if (error) {
        console.error("Query Failed:", JSON.stringify(error, null, 2));
    } else {
        console.log("Query Success! Rows:", data.length);
        // console.log(JSON.stringify(data, null, 2));
    }
}

testQuery();
