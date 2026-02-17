
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

// Clients

// 1. Service Role Client (for cleanup/checking state)
const supabaseService = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// 2. Admin Client (Owner)
const supabaseAdmin = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
    auth: { autoRefreshToken: false, persistSession: false }
});

// 3. Member Client (Non-Owner)
const supabaseMember = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function verify() {
    console.log('🔍 Verifying Section Editor Strictness...\n');

    const ADMIN_EMAIL = 'section-admin@example.com';
    const MEMBER_EMAIL = 'section-member@example.com';
    const PASSWORD = 'password123';
    const TEST_ORG_NAME = 'Test Section Org';

    // 1. Authenticate Admin
    const { data: adminAuth, error: adminError } = await supabaseAdmin.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: PASSWORD
    });
    if (adminError) { console.error('Admin Login Failed:', adminError); return; }
    console.log('✅ Admin Authenticated');

    // 2. Authenticate Member
    const { data: memberAuth, error: memberError } = await supabaseMember.auth.signInWithPassword({
        email: MEMBER_EMAIL,
        password: PASSWORD
    });
    if (memberError) { console.error('Member Login Failed:', memberError); return; }
    console.log('✅ Member Authenticated');

    // 3. Get Organization Context (via Service Role)
    const { data: orgData, error: orgError } = await supabaseService
        .from('organizations')
        .select('*')
        .eq('name', TEST_ORG_NAME)
        .single();

    if (orgError) { console.error('Org Fetch Failed:', orgError); return; }
    const tenantId = orgData.tenant_id;
    const orgId = orgData.id;
    console.log(`ℹ️ Testing against Org: ${orgId} (Tenant: ${tenantId})`);

    // --- TEST 1: ADMIN CREATE SECTION ---
    console.log('\n--- TEST 1: Admin Create Section ---');
    const { data: sectionId, error: createError } = await supabaseAdmin.rpc('create_organization_section', {
        p_tenant_id: tenantId,
        p_org_id: orgId,
        p_translations: { en: "Test Section A", pl: "Sekcja Testowa A" },
        p_order_index: 10
    });

    if (createError) {
        console.error('❌ Admin Create Failed:', createError);
    } else {
        console.log(`✅ Admin Created Section: ${sectionId}`);
    }

    if (!sectionId) return; // Stop if failed

    // --- TEST 2: MEMBER CREATE SECTION (SHOULD FAIL) ---
    console.log('--- TEST 2: Member Create Section (Should Fail) ---');
    const { error: memberCreateError } = await supabaseMember.rpc('create_organization_section', {
        p_tenant_id: tenantId,
        p_org_id: orgId,
        p_translations: { en: "Hacked Section" },
        p_order_index: 999
    });

    if (memberCreateError) {
        console.log(`✅ Member Create Failed as expected: ${memberCreateError.message}`);
    } else {
        console.error('❌ Member Create SUCCEEDED (Security Breach!)');
    }

    // --- TEST 3: ADMIN UPDATE SECTION ---
    console.log('--- TEST 3: Admin Update Section ---');
    const { error: updateError } = await supabaseAdmin.rpc('update_organization_section', {
        p_tenant_id: tenantId,
        p_org_id: orgId,
        p_section_id: sectionId,
        p_translations: { en: "Test Section A (Updated)" },
        p_is_partial: true
    });

    if (updateError) console.error('❌ Admin Update Failed:', updateError);
    else console.log('✅ Admin Update Succeeded');

    // --- TEST 4: MEMBER DELETE SECTION (SHOULD FAIL) ---
    console.log('--- TEST 4: Member Delete Section (Should Fail) ---');
    const { error: memberDeleteError } = await supabaseMember.rpc('delete_organization_section', {
        p_tenant_id: tenantId,
        p_org_id: orgId,
        p_section_id: sectionId
    });

    if (memberDeleteError) console.log(`✅ Member Delete Failed as expected: ${memberDeleteError.message}`);
    else console.error('❌ Member Delete SUCCEEDED (Security Breach!)');

    // --- TEST 5: ADMIN DELETE SECTION ---
    console.log('--- TEST 5: Admin Delete Section ---');
    const { error: deleteError } = await supabaseAdmin.rpc('delete_organization_section', {
        p_tenant_id: tenantId,
        p_org_id: orgId,
        p_section_id: sectionId
    });

    if (deleteError) console.error('❌ Admin Delete Failed:', deleteError);
    else console.log('✅ Admin Delete Succeeded');


    // Summary
    console.log('\n--- VERIFICATION COMPLETE ---');
}

verify();
