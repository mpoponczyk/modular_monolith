
import { Client } from 'pg';
import { moduleRegistry } from '../core/moduleRegistry';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// EMAIL TO VALIDATE
const UAT_USER_EMAIL = 'mateusz.poponczyk@gmail.com';
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
}

const client = new Client({
    connectionString: DATABASE_URL,
});

async function ensureUatPermissions() {
    console.log(`\n# STRICT UAT PREPARATION (Direct DB)\nTarget User: ${UAT_USER_EMAIL}\n`);
    const logLines: string[] = [`# STRICT UAT PREPARATION REPORT`, `Target: ${UAT_USER_EMAIL}`, `Date: ${new Date().toISOString()}`, ``];

    try {
        await client.connect();

        // STEP 1: RESOLVE USER CONTEXT
        console.log('Resolving User...');
        const userRes = await client.query('SELECT id, email FROM auth.users WHERE email = $1', [UAT_USER_EMAIL]);

        if (userRes.rows.length === 0) {
            console.error('CRITICAL: User not found in auth.users');
            process.exit(1);
        }

        const user = userRes.rows[0];
        console.log(`User Found: ${user.id}`);
        logLines.push(`## 1. User Context`, `- User ID: \`${user.id}\``, `- Email: \`${user.email}\``);

        // Get Tenant Link
        const tenantRes = await client.query(`
            SELECT tu.tenant_id, t.slug, t.name 
            FROM public.tenant_users tu
            JOIN public.tenants t ON tu.tenant_id = t.id
            WHERE tu.user_id = $1
        `, [user.id]);

        if (tenantRes.rows.length === 0) {
            console.error('CRITICAL: User has no tenant links');
            process.exit(1);
        }

        const activeTenant = tenantRes.rows[0];
        const tenantId = activeTenant.tenant_id;
        console.log(`Active Tenant: ${tenantId} (${activeTenant.name})`);
        logLines.push(`- Tenant ID: \`${tenantId}\``, `- Tenant Name: \`${activeTenant.name}\``);

        // STEP 2: ENUMERATE REQUIRED PERMISSIONS
        console.log('\nEnumerating Required Permissions...');
        const requiredPermissions = new Set<string>();
        const modules = moduleRegistry.getModules();

        for (const mod of modules) {
            if (mod.permissions?.requiredPermissions) {
                mod.permissions.requiredPermissions.forEach(p => requiredPermissions.add(p));
            }
        }
        console.log(`Total Required Permissions: ${requiredPermissions.size}`);
        logLines.push(`\n## 2. Required Permissions`, `- Total: ${requiredPermissions.size}`, `- Modules: ${modules.length}`);

        // STEP 3: ENUMERATE EFFECTIVE PERMISSIONS
        console.log('\nEnumerating Effective Permissions...');

        let effectivePermissions = new Set<string>();
        let assignedRoleNames: string[] = [];

        // Correct chain: tenant_users(role_id) -> roles(id) -> role_permissions(permission_key)
        const rolesRes = await client.query(`
            SELECT r.name, rp.permission_key as permission
            FROM public.tenant_users tu
            JOIN public.roles r ON tu.role_id = r.id
            JOIN public.role_permissions rp ON r.id = rp.role_id
            WHERE tu.user_id = $1 AND tu.tenant_id = $2
        `, [user.id, tenantId]);

        rolesRes.rows.forEach(r => {
            assignedRoleNames.push(r.name);
            effectivePermissions.add(r.permission);
        });

        // Deduplicate role names
        assignedRoleNames = Array.from(new Set(assignedRoleNames));

        console.log(`Assigned Roles: ${assignedRoleNames.join(', ')}`);
        console.log(`Total Effective Permissions: ${effectivePermissions.size}`);
        logLines.push(`\n## 3. Effective Permissions`, `- Roles: ${assignedRoleNames.join(', ')}`, `- Count: ${effectivePermissions.size}`);

        // STEP 4: MATHEMATICAL VALIDATION
        console.log('\nValidating...');
        const missingPermissions = Array.from(requiredPermissions).filter(p => !effectivePermissions.has(p));
        logLines.push(`\n## 4. Validation`, `- Missing Count: ${missingPermissions.length}`);

        if (missingPermissions.length === 0) {
            console.log('✅ PASS: User has ALL required permissions.');
            logLines.push(`✅ **PASS**: User is a SUPERSET of all app permissions.`);
        } else {
            console.log(`❌ FAIL: Missing ${missingPermissions.length} permissions.`);
            console.log('Initiating Remediation...');

            const roleName = 'UAT_SUPERADMIN';

            // Upsert Role
            let roleId;
            const roleRes = await client.query('SELECT id FROM public.roles WHERE tenant_id = $1 AND name = $2', [tenantId, roleName]);
            if (roleRes.rows.length === 0) {
                const newRole = await client.query(`
                    INSERT INTO public.roles (tenant_id, name, description)
                    VALUES ($1, $2, 'Auto-generated UAT Superadmin')
                    RETURNING id
                 `, [tenantId, roleName]);
                roleId = newRole.rows[0].id;
            } else {
                roleId = roleRes.rows[0].id;
            }

            // Upsert Permissions into permissions table first (metadata)
            // Even if we don't link via ID, we should populate the permission registry.
            const permKeysRes = await client.query('SELECT key FROM public.permissions');
            const existingPermKeys = new Set(permKeysRes.rows.map(r => r.key));

            for (const p of Array.from(requiredPermissions)) {
                if (!existingPermKeys.has(p)) {
                    try {
                        await client.query("INSERT INTO public.permissions (key, description) VALUES ($1, 'UAT Auto')", [p]);
                        existingPermKeys.add(p);
                    } catch (e) {
                        console.log(`Error inserting permission ${p} metadata:`, e);
                    }
                }
            }

            // Assign to role via keys
            await client.query('DELETE FROM public.role_permissions WHERE role_id = $1', [roleId]);

            for (const p of Array.from(requiredPermissions)) {
                await client.query('INSERT INTO public.role_permissions (role_id, permission_key, tenant_id) VALUES ($1, $2, $3)', [roleId, p, tenantId]);
            }

            // Assign Role to User (Update tenant_users)
            await client.query('UPDATE public.tenant_users SET role_id = $1 WHERE user_id = $2 AND tenant_id = $3', [roleId, user.id, tenantId]);

            console.log(`Remediation Complete. Assigned ${roleName} to user in tenant_users.`);
            logLines.push(`\n## 5. Remediation`, `- Created/Updated Role UAT_SUPERADMIN`, `- Assigned ${requiredPermissions.size} permissions`);
        }

    } catch (err) {
        console.error('Script Error:', err);
        logLines.push(`\n## ERROR`, `Script failed: ${err}`);
        process.exit(1);
    } finally {
        const reportPath = path.resolve('.doc/UAT_ADMIN_VALIDATION_REPORT.md');
        fs.writeFileSync(reportPath, logLines.join('\n'));
        console.log(`Report saved to ${reportPath}`);
        await client.end();
    }
}

ensureUatPermissions();
