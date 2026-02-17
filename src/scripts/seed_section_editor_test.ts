
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

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seed() {
    console.log('🌱 Seeding Section Editor Test Environment...');

    const TEST_TENANT_SLUG = 'test-tenant';
    const TEST_ORG_NAME = 'Test Section Org';
    const ADMIN_EMAIL = 'mateusz.poponczyk@gmail.com';
    const MEMBER_EMAIL = 'matix1730@gmail.com';
    const PASSWORD = 'password123';

    // 1. Create Tenant
    let tenantId: string;
    const { data: existingTenants } = await supabase.from('tenants').select('*').eq('slug', TEST_TENANT_SLUG);

    if (existingTenants && existingTenants.length > 0) {
        tenantId = existingTenants[0].id;
        console.log('ℹ️ Tenant exists:', tenantId);
    } else {
        const { data: newTenant, error } = await supabase.from('tenants').insert({
            name: 'Test Tenant',
            slug: TEST_TENANT_SLUG,
            status: 'active'
        }).select().single();

        if (error) { console.error('Error creating tenant:', error); process.exit(1); }
        tenantId = newTenant.id;
        console.log('✅ Tenant created:', tenantId);
    }

    // 1.5 Create Owner Group (Required for Organization.owner_group_id)
    let ownerGroupId: string;
    // Check if group exists via name/tenant - tricky as group has no unique name per tenant constraint usually? 
    // Assuming standard group name 'Owners'.
    const { data: existingGroups } = await supabase.from('groups').select('*').eq('tenant_id', tenantId).eq('name', 'Owners');
    if (existingGroups && existingGroups.length > 0) {
        ownerGroupId = existingGroups[0].id;
        console.log('ℹ️ Owner Group exists:', ownerGroupId);
    } else {
        const { data: newGroup, error: groupError } = await supabase.from('groups').insert({
            tenant_id: tenantId,
            name: 'Owners'
        }).select().single();
        if (groupError) { console.error('Error creating owner group:', groupError); process.exit(1); }
        ownerGroupId = newGroup.id;
        console.log('✅ Owner Group created:', ownerGroupId);
    }

    // 2. Create Organization
    let orgId: string;
    const { data: existingOrgs } = await supabase.from('organizations').select('*').eq('tenant_id', tenantId).eq('name', TEST_ORG_NAME);

    if (existingOrgs && existingOrgs.length > 0) {
        orgId = existingOrgs[0].id;
        console.log('ℹ️ Organization exists:', orgId);
    } else {
        const { data: newOrg, error } = await supabase.from('organizations').insert({
            tenant_id: tenantId,
            name: TEST_ORG_NAME,
            owner_group_id: ownerGroupId // Providing required FK
        }).select().single();

        if (error) { console.error('Error creating org:', error); process.exit(1); }
        orgId = newOrg.id;
        console.log('✅ Organization created:', orgId);
    }

    // 3. Create Users
    for (const email of [ADMIN_EMAIL, MEMBER_EMAIL]) {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        let user = users.find(u => u.email === email);
        if (!user) {
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password: PASSWORD,
                email_confirm: true,
                user_metadata: { full_name: email.split('@')[0] }
            });
            if (error) { console.error(`Error creating ${email}:`, error); process.exit(1); }
            console.log(`✅ User created: ${email} (${data.user!.id})`);
        } else {
            console.log(`ℹ️ User exists: ${email}`);
        }
    }

    // 4. Assign Roles (Strict Owner vs Member)
    // We need to find the users again to get IDs
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const adminUser = users.find(u => u.email === ADMIN_EMAIL)!;
    const memberUser = users.find(u => u.email === MEMBER_EMAIL)!;

    // Create Owner Group / Role linkage
    // This part depends on the specific RBAC implementation (company_users / group_members).
    // The migration checks:
    // EXISTS (SELECT 1 FROM public.company_users cu ... WHERE ... cu.user_id = auth.uid()) OR
    // EXISTS (SELECT 1 FROM public.organizations org ... WHERE ... org.owner_group_id IN (SELECT group_id FROM public.group_members ...))

    // Strategy:
    // Admin -> Add to 'Owner' Group of the Org (if Owner Group exists) OR link as Company User with 'Owner' role.
    // Member -> Link as Company User with 'Member' role.

    // Let's create a Company for this Org (common pattern in this DB?)
    // Or just link to Tenant Users?
    // Check 'company_users' table.

    // 4.1 Create Company linked to Org?
    // public.org_companies(organization_id, company_id)
    // public.companies(id, tenant_id, name)

    // We probably need a Company to link users to.
    let companyId: string;
    const { data: existingCompanies } = await supabase.from('companies').select('*').eq('tenant_id', tenantId).eq('name', TEST_ORG_NAME);
    if (existingCompanies && existingCompanies.length > 0) {
        companyId = existingCompanies[0].id;
    } else {
        const { data: newCompany, error } = await supabase.from('companies').insert({
            tenant_id: tenantId,
            name: TEST_ORG_NAME
        }).select().single();
        if (error) { console.error('Error creating company:', error); process.exit(1); }
        companyId = newCompany.id;
        console.log('✅ Company created:', companyId);
    }

    // Link Company to Org
    const { error: linkOrgError } = await supabase.from('org_companies').upsert({
        organization_id: orgId,
        company_id: companyId,
        tenant_id: tenantId
    }, { onConflict: 'organization_id, company_id', ignoreDuplicates: true });
    if (linkOrgError && linkOrgError.code !== '23505') { console.error('Error linking org-company:', linkOrgError); }

    // 4.2 Link Users to Company
    // Admin needs OWNER privileges.
    // The RPC checks: is_org_owner.
    // We need to ensure 'is_org_owner' logic passes for Admin.
    // Usually implies being in the 'owner_group_id' OF THE ORGANIZATION.

    // We already have ownerGroupId from step 1.5.

    if (ownerGroupId) { // Should always be true
        // Add Admin to Owner Group
        const { error: gmError } = await supabase.from('group_members').upsert({
            group_id: ownerGroupId,
            user_id: adminUser.id,
            tenant_id: tenantId
        }, { onConflict: 'group_id, user_id', ignoreDuplicates: true });
        if (gmError) console.error('Error adding admin to group:', gmError);
        console.log('✅ Admin added to Owner Group');
    }

    // Add Member to Company Users (but NOT Owner Group)
    const { error: cuError } = await supabase.from('company_users').upsert({
        company_id: companyId,
        user_id: memberUser.id,
        tenant_id: tenantId
    }, { onConflict: 'company_id, user_id', ignoreDuplicates: true });
    if (cuError) console.error('Error adding member:', cuError);
    console.log('✅ Member added to Company Users');

    // 4.3 Populate tenant_users (CRITICAL for Implicit Resolution)
    for (const userId of [adminUser.id, memberUser.id]) {
        await supabase.from('tenant_users').upsert({
            tenant_id: tenantId,
            user_id: userId
        }, { onConflict: 'tenant_id, user_id', ignoreDuplicates: true });
    }
    console.log('✅ Users added to tenant_users (Implicit Resolution Fix)');

    // 5. Populate Organization Apps
    const MODULES = ['module-a', 'module-b', 'module-c'];
    for (const mod of MODULES) {
        await supabase.from('organization_apps').upsert({
            tenant_id: tenantId,
            organization_id: orgId,
            module_id: mod,
            is_active: true
        }, { onConflict: 'organization_id, module_id', ignoreDuplicates: true });
    }
    console.log('✅ Dummy Apps injected');

    // 6. Populate Languages
    await supabase.from('organization_languages').upsert({
        tenant_id: tenantId,
        organization_id: orgId,
        language_code: 'en',
        is_default: true
    }, { onConflict: 'organization_id, language_code', ignoreDuplicates: true });

    await supabase.from('organization_languages').upsert({
        tenant_id: tenantId,
        organization_id: orgId,
        language_code: 'pl',
        is_default: false
    }, { onConflict: 'organization_id, language_code', ignoreDuplicates: true });
    console.log('✅ Languages (en, pl) injected');

    console.log('\n--- TEST ENVIRONMENT READY ---');
    console.log(`Tenant ID: ${tenantId}`);
    console.log(`Org ID:    ${orgId}`);
    console.log(`Admin:     ${ADMIN_EMAIL}`);
    console.log(`Member:    ${MEMBER_EMAIL}`);
    console.log('------------------------------\n');
}

seed();
