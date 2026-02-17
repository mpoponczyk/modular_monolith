
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Use ANON key to simulate client/auth user

async function debug() {
    console.log('🕵️‍♂️ Debugging RPC resolve_user_tenants...');

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Sign In
    const email = 'section-admin@example.com';
    const password = 'password123';

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('❌ Login Failed:', authError.message);
        return;
    }
    console.log(`✅ Logged in as ${authData.user.id}`);

    // 2. Call RPC
    const { data: tenants, error: rpcError } = await supabase.rpc('resolve_user_tenants');

    if (rpcError) {
        console.error('❌ RPC Failed:', rpcError);
    } else {
        console.log('✅ RPC Result:', JSON.stringify(tenants, null, 2));
    }
}

debug();
