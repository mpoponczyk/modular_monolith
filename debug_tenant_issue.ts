
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const userId = '9ba4ab2c-ba33-4ff3-a899-2048eb43e15a';
    console.log(`Debugging for user: ${userId}`);

    // 2. Call resolve_user_tenants RPC (Using Service Role to verify logic, but it uses auth.uid() usually?)
    // Wait, RPC `resolve_user_tenants` likely uses `auth.uid()`. 
    // We cannot easily simulate auth.uid() with service role unless we use `supabase.auth.signInWithPassword` 
    // BUT we can check the underlying tables `public.tenant_users`.

    console.log("--- Checking public.tenant_users ---");
    const { data: memberships, error: memberError } = await supabase
        .from('tenant_users')
        .select('*, tenant:tenants(*)')
        .eq('user_id', userId);

    if (memberError) console.error(memberError);
    console.log("Memberships:", JSON.stringify(memberships, null, 2));

    if (memberships?.length !== 1) {
        console.warn(`WARNING: User has ${memberships?.length} memberships. "Select Organization" screen is EXPECTED if > 1.`);
    } else {
        console.log("User has exactly 1 membership. 'Select Organization' screen is UNEXPECTED.");
    }

    // 3. Check tenant_modules RLS
    // Try to select from tenant_modules as if we were the user? 
    // Hard to simulate RLS directly here without signing in.
    // But we can check if policies exist.

    console.log("--- Checking tenant_modules count (Service Role) ---");
    const { count, error: countError } = await supabase
        .from('tenant_modules')
        .select('*', { count: 'exact', head: true });

    if (countError) console.error(countError);
    console.log(`Total tenant_modules rows: ${count}`);

    // We can try to sign in if we had password, but we don't.
}

main().catch(console.error);
