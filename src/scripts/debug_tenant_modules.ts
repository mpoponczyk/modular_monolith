
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function debug() {
    console.log('🕵️‍♂️ Debugging tenant_modules table (Authenticated User)...');

    const supabase = createClient(supabaseUrl, anonKey);

    // 1. Sign In
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
        email: 'section-admin@example.com',
        password: 'password123'
    });

    if (authError) {
        console.error('❌ Login Failed:', authError.message);
        return;
    }
    console.log('✅ Logged in as:', auth.user.id);

    const tenantId = '22a83baa-2246-4470-8b3c-f0bf1958aca4'; // Hardcoded Test Tenant ID

    // 2. Query tenant_modules
    console.log(`QUERYING tenant_modules for tenant ${tenantId}...`);
    const { data, error } = await supabase
        .from('tenant_modules')
        .select('module_id')
        .eq('tenant_id', tenantId);

    if (error) {
        console.error('❌ Error fetching tenant modules:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Success:', data);
    }
}

debug();
