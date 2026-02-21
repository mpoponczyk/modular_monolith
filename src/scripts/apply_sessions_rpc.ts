
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    const filePath = path.join(process.cwd(), 'src/db/migrations/20260219050000_sessions_rpc.sql');
    // I'll assume the file needs to be copied from artifacts first, but I can also just include the content here if I can't access artifacts easily from the script.
    // Actually, I can't easily access the artifacts dir from this script running in the user's CWD unless I copy it.
    // So I will just embed the SQL in this script for simplicity and reliability.

    const sql = `
-- Strict RPC for Admin Session View
-- 2026-02-19 05:00:00

-- Function to get all sessions for a tenant (Admin Only)
create or replace function public.get_tenant_sessions(p_tenant_id uuid)
returns setof public.twofa_sessions
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
begin
    -- 1. Strict Tenant Membership Check
    perform public.verify_tenant_membership(p_tenant_id);

    -- 2. Return Sessions (Ordered by Expiry)
    return query
    select *
    from public.twofa_sessions
    where tenant_id = p_tenant_id
    order by expires_at desc;
end;
$$;

-- Security Grants
revoke all on function public.get_tenant_sessions(uuid) from public, anon;
grant execute on function public.get_tenant_sessions(uuid) to authenticated;
`;

    console.log('Applying migration...');

    // Method 1: direct via valid postgres connection if pg is available?
    // The user environment has 'pg' installed based on previous context.
    // But using supabase-js rpc might not work for raw sql unless we have an exec_sql rpc.
    // Most valid way in this environment is usually via 'pg' connection string if available.

    // Let's try to use the 'pg' library with DATABASE_URL

    const { Client } = require('pg');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        await client.query(sql);
        console.log('Migration applied successfully.');
    } catch (err) {
        console.error('Error applying migration:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyMigration();
