// mateusz poponczyk

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function validate() {
    console.log('🚀 Starting 2FA Validation...');

    // 1. Create a Test Tenant (if possible, or use existing)
    // We'll try to find an existing tenant or create one.
    // Ideally we assume some data exists or we create it.
    // Let's create a dummy user and tenant.

    // Create Dummy User
    const email = `val_${Date.now()}@example.com`;
    const password = 'password123';

    console.log('Creating Test User...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (userError) {
        console.error('❌ Failed to create user:', userError);
        return;
    }
    const userId = userData.user.id;
    console.log('✅ User Created:', userId);

    // Create Test Tenant
    console.log('Creating Test Tenant...');
    const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({ name: 'Validation Tenant', slug: `val-${Date.now()}` })
        .select()
        .single();

    if (tenantError) {
        console.error('❌ Failed to create tenant:', tenantError);
        // Clean up user
        await supabase.auth.admin.deleteUser(userId);
        return;
    }
    const tenantId = tenantData.id;
    console.log('✅ Tenant Created:', tenantId);

    // Add User to Tenant
    console.log('Adding User to Tenant...');
    const { error: memberError } = await supabase
        .from('tenant_users')
        .insert({ tenant_id: tenantId, user_id: userId, role_id: null }); // Assuming role_id is nullable or handled by triggers/defaults? 
    // Wait, role_id IS NOT NULL in schema.sql but referencing roles.
    // We need a role. "Admin" usually exists or we create one.

    if (memberError) {
        // Try to fetch a role first
        const { data: roleData } = await supabase.from('roles').select('id').eq('tenant_id', tenantId).limit(1).single();
        let roleId = roleData?.id;

        if (!roleId) {
            const { data: newRole } = await supabase.from('roles').insert({ tenant_id: tenantId, name: 'Member' }).select().single();
            roleId = newRole.id;
        }

        const { error: memberRetryError } = await supabase
            .from('tenant_users')
            .insert({ tenant_id: tenantId, user_id: userId, role_id: roleId });

        if (memberRetryError) {
            console.error('❌ Failed to add user to tenant:', memberRetryError);
            return;
        }
    }
    console.log('✅ User added to Tenant');

    // Authenticate as User (to call RPCs as authenticated)
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (signInError) {
        console.error('❌ Failed to sign in:', signInError);
        return;
    }

    const userClient = createClient(SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } }
    });

    console.log('\n🔍 Pre-check: Tables Existence (Service Role)');
    const { error: tableError } = await supabase.from('login_challenges').select('id').limit(1);
    if (tableError) {
        if (tableError.code === '42P01') {
            console.error('❌ Critical: Table "login_challenges" NOT FOUND. Migration not applied.');
            console.log('👉 Please run "manual_migration_bundle.sql" in Supabase SQL Editor.');
            await cleanup(supabase, tenantId, userId);
            process.exit(1);
        } else {
            console.error('⚠️ Warning: Could not check table existence:', tableError.message);
        }
    } else {
        console.log('✅ Table "login_challenges" found.');
    }

    try {
        // TEST 1: create_login_challenge
        console.log('\n🧪 TEST 1: create_login_challenge');
        const { data: code, error: rpcError } = await userClient.rpc('create_login_challenge', { p_tenant_id: tenantId });

        if (rpcError) {
            console.error('❌ Failed:', rpcError);
            // If function not found, it means Migration NOT applied.
            if (rpcError.code === '42883') console.error('⚠️ RPC not found. Did you apply the migration?');
        } else {
            console.log('✅ Challenge Created. Code:', code);

            // TEST 2: verify_login_challenge
            console.log('\n🧪 TEST 2: verify_login_challenge');
            const { data: sessionId, error: verifyError } = await userClient.rpc('verify_login_challenge', {
                p_tenant_id: tenantId,
                p_code: code
            });

            if (verifyError) {
                console.error('❌ Failed:', verifyError);
            } else {
                console.log('✅ Verified! Session ID:', sessionId);

                // TEST 3: validate_twofa_session
                console.log('\n🧪 TEST 3: validate_twofa_session');
                const { data: isValid, error: validateError } = await userClient.rpc('validate_twofa_session', {
                    p_tenant_id: tenantId,
                    p_session_id: sessionId
                });
                if (validateError) console.error('❌ Failed:', validateError);
                else console.log(`✅ Session Valid: ${isValid}`);


                // TEST 4: Replay Protection (Verify same code again)
                console.log('\n🧪 TEST 4: Replay Protection (Verify same code)');
                const { data: replaySession, error: replayError } = await userClient.rpc('verify_login_challenge', {
                    p_tenant_id: tenantId,
                    p_code: code
                });
                if (replayError) console.log('✅ Blocked (Expected):', replayError.message);
                else console.error('❌ Failed: Should have blocked replay but returned:', replaySession);
            }
        }

    } catch (e) {
        console.error('Unexpected error:', e);
    } finally {
        await cleanup(supabase, tenantId, userId);
    }
}

async function cleanup(client: any, tenantId: string, userId: string) {
    console.log('\n🧹 Cleaning up...');
    if (tenantId) await client.from('tenants').delete().eq('id', tenantId);
    if (userId) await client.auth.admin.deleteUser(userId);
}

validate().catch(console.error);
