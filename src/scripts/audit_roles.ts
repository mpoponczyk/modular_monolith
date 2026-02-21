import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { moduleRegistry } from '../core/moduleRegistry';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function runRoleAudit() {
    console.log("==================================================");
    console.log("🛡️ STRICT ROLE & PERMISSION AUDIT FOR 23 APPS 🛡️");
    console.log("==================================================\n");

    const emailToAudit = 'mateusz.poponczyk@gmail.com';

    // 1. Get registry modules
    const modules = moduleRegistry.getModules();
    console.log(`📡 Analyzing ${modules.length} registered modules...`);

    const requiredPermissionsSet = new Set<string>();
    const modulePermMap: Record<string, string[]> = {};

    for (const mod of modules) {
        const perms = mod.permissions?.requiredPermissions || [];
        modulePermMap[mod.id] = perms;
        perms.forEach(p => requiredPermissionsSet.add(p));
    }

    console.log(`\n📋 Modules & their Declared Roles/Permissions:`);
    for (const [modId, perms] of Object.entries(modulePermMap)) {
        if (perms.length === 0) {
            console.log(`   🔸 ${modId}: PUBLIC/NO PERMS (Anyone with tenant access)`);
        } else {
            console.log(`   🔹 ${modId}: ${perms.join(', ')}`);
        }
    }

    const uniquePerms = Array.from(requiredPermissionsSet);
    console.log(`\n🔑 Unique Required Permissions Across System (${uniquePerms.length}):`);
    console.log(uniquePerms.length > 0 ? `   [ ${uniquePerms.join(', ')} ]` : "   None.");

    // 2. Connect to DB as Admin
    console.log("\n🔌 Connecting to Database...");
    if (!serviceRoleKey) {
        console.error("❌ SUPABASE_SERVICE_ROLE_KEY missing from .env.local!");
        process.exit(1);
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const supabaseAnon = createClient(supabaseUrl, anonKey);

    // 3. Verify Permissions exist in DB
    let globalPermsInDb: string[] = [];
    const { data: dbPerms, error: dbPermError } = await supabaseAdmin
        .from('permissions')
        .select('*');

    if (dbPermError) {
        console.log(`   ⚠️ Table 'permissions' not accessible: ${dbPermError.message}`);
    } else {
        globalPermsInDb = dbPerms.map(p => p.key || p.name);
        console.log(`   ✅ Found ${globalPermsInDb.length} formal permission dictionary entries.`);

        const missingPerms = uniquePerms.filter(p => !globalPermsInDb.includes(p));
        if (missingPerms.length > 0) {
            console.log(`   ❌ ERROR: The following declared permissions DO NOT exist in DB dictionary:`);
            console.log(`      ${missingPerms.join(', ')}`);
        } else {
            console.log(`   ✅ All ${uniquePerms.length} declared module permissions exist in DB dictionary.`);
        }
    }

    // 4. Authenticate target user
    console.log(`\n👤 Authenticating user: ${emailToAudit}`);
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
        email: emailToAudit,
        password: 'password123'
    });

    if (authError) {
        console.log(`   ❌ ERROR logging in: ${authError.message}`);
        process.exit(1);
    }
    const userId = authData.user.id;
    console.log(`   ✅ Logged in successfully. ID: ${userId}`);

    // 5. Get User's Tenant Context & Roles
    console.log(`\n🏢 Fetching specific tenant roles for user...`);
    const { data: tenantUser, error: tuError } = await supabaseAdmin
        .from('tenant_users')
        .select(`
            tenant_id,
            role_id,
            tenant:tenants!inner(slug)
        `)
        .eq('user_id', userId)
        .limit(1)
        .single();

    if (tuError) {
        console.log(`   ❌ ERROR fetching tenant_users: ${tuError.message}`);
        process.exit(1);
    }

    const tenantId = tenantUser.tenant_id;
    const roleId = tenantUser.role_id;
    const tenantSlug = Array.isArray(tenantUser.tenant) ? tenantUser.tenant[0].slug : (tenantUser.tenant as any).slug;

    console.log(`   ✅ Bound to Tenant: ${tenantSlug} (ID: ${tenantId})`);
    console.log(`   ✅ Assigned Role ID: ${roleId}`);

    if (!roleId) {
        console.log(`   ❌ User has no role assigned in this tenant! Cannot have any permissions.`);
        process.exit(1);
    }

    // 6. Extrapolate User Permissions
    const { data: rolePerms, error: rpError } = await supabaseAdmin
        .from('role_permissions')
        .select(`
            permission:permissions(key)
        `)
        .eq('role_id', roleId);

    let userAssignedPermissions: string[] = [];
    if (rpError) {
        console.log(`   ⚠️ Error querying role_permissions: ${rpError.message}`);
        const { data: rawRP, error: rawRPError } = await supabaseAdmin
            .from('role_permissions')
            .select('*')
            .eq('role_id', roleId);
        if (!rawRPError && rawRP) {
            userAssignedPermissions = rawRP.map(rp => rp.permission_key || rp.permission_id);
        }
    } else {
        userAssignedPermissions = rolePerms.map(rp => (rp.permission as any)?.key).filter(Boolean);
    }

    console.log(`   ✅ User implicitly holds ${userAssignedPermissions.length} structured permissions.`);

    const hasWildcard = userAssignedPermissions.includes('*') || userAssignedPermissions.includes('admin.*');
    console.log(`   ⭐ Wildcard present? ${hasWildcard}`);

    // 7. Audit: Does this user have access to all 23 apps?
    console.log(`\n⚖️ AUDIT: 23-App Access Validation for '${emailToAudit}'`);
    let passedCount = 0;
    let failedCount = 0;

    for (const mod of modules) {
        const reqPerms = mod.permissions?.requiredPermissions || [];
        if (reqPerms.length === 0) {
            console.log(`   ✅ PASS: ${mod.id.padEnd(30)} -> No permissions required.`);
            passedCount++;
            continue;
        }

        if (hasWildcard) {
            console.log(`   ✅ PASS: ${mod.id.padEnd(30)} -> Granted via wildcard (*).`);
            passedCount++;
            continue;
        }

        const missing = reqPerms.filter(p => !userAssignedPermissions.includes(p));

        if (missing.length === 0) {
            console.log(`   ✅ PASS: ${mod.id.padEnd(30)} -> User holds [${reqPerms.join(', ')}].`);
            passedCount++;
        } else {
            console.log(`   ❌ FAIL: ${mod.id.padEnd(30)} -> User missing [${missing.join(', ')}].`);
            failedCount++;
        }
    }

    console.log("\n==================================================");
    console.log(`🏁 AUDIT SUMMARY 🏁`);
    console.log(`Total Apps: ${modules.length}`);
    console.log(`Passed:     ${passedCount}`);
    console.log(`Failed:     ${failedCount}`);

    if (failedCount > 0) {
        console.log(`\n❌ VERDICT: User lacks some required roles. Action Required.`);
        process.exit(1);
    } else {
        console.log(`\n✅ VERDICT: PERFECT 23-APP R.B.A.C ADHERENCE.`);
        console.log(`User ${emailToAudit} has full designated access to all activated apps.`);
    }

}

runRoleAudit().catch(console.error);
