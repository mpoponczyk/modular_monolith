
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function cleanup() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        const oldSlug = 'test-section-editor';
        const newSlug = 'test-tenant';
        const newName = 'Test Tenant';

        // 1. Check if Target Slug exists
        const resTarget = await client.query('SELECT id FROM tenants WHERE slug = $1', [newSlug]);
        let targetTenantId;

        if (resTarget.rows.length > 0) {
            targetTenantId = resTarget.rows[0].id;
            console.log(`ℹ️ Target tenant ${newSlug} already exists (${targetTenantId}). Using it.`);

            // If old one exists, delete it (users will be re-linked later)
            const resOld = await client.query('DELETE FROM tenants WHERE slug = $1 RETURNING id', [oldSlug]);
            if ((resOld.rowCount ?? 0) > 0) console.log(`🗑 Deleted old tenant ${oldSlug}`);

        } else {
            // Rename old one if exists
            const resRename = await client.query(
                `UPDATE tenants SET name = $1, slug = $2 WHERE slug = $3 RETURNING id`,
                [newName, newSlug, oldSlug]
            );
            if (resRename.rows.length > 0) {
                targetTenantId = resRename.rows[0].id;
                console.log(`✅ Renamed ${oldSlug} -> ${newName}`);
            } else {
                // Both missing -> Create New
                const resCreate = await client.query(
                    `INSERT INTO tenants (name, slug, status) VALUES ($1, $2, 'active') RETURNING id`,
                    [newName, newSlug]
                );
                targetTenantId = resCreate.rows[0].id;
                console.log(`✅ Created new ${newName} (${targetTenantId})`);
            }
        }

        // 2. Delete ALL OTHER Tenants
        console.log(`🔥 Deleting ALL other tenants (excluding ${targetTenantId})...`);
        const resDelete = await client.query(
            `DELETE FROM tenants WHERE id != $1 AND slug != 'system'`,
            [targetTenantId]
        );
        console.log(`✅ Deleted ${resDelete.rowCount} other tenants.`);

        // 2.5 Ensure System Roles EXIST for Target Tenant (Critical for Trigger)
        // We know the trigger enforce_tenant_user_role_consistency checks public.roles
        const rolesToEnsure = ['Owner', 'Member'];
        for (const rName of rolesToEnsure) {
            await client.query(
                `INSERT INTO roles (tenant_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [targetTenantId, rName]
            );
            console.log(`✅ Ensured role '${rName}' exists for tenant.`);
        }

        // 3. Ensure Test Users are linked to Target Tenant
        const emails = ['mateusz.poponczyk@gmail.com', 'matix1730@gmail.com'];

        // Fetch Role IDs
        const resOwner = await client.query('SELECT id FROM roles WHERE tenant_id = $1 AND name = $2', [targetTenantId, 'Owner']);
        const resMember = await client.query('SELECT id FROM roles WHERE tenant_id = $1 AND name = $2', [targetTenantId, 'Member']);

        const ownerRoleId = resOwner.rows[0]?.id;
        const memberRoleId = resMember.rows[0]?.id;

        for (const email of emails) {
            const resUser = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
            if (resUser.rows.length > 0) {
                const userId = resUser.rows[0].id;
                const roleId = email.includes('mateusz') ? ownerRoleId : memberRoleId;

                if (roleId) {
                    // Manual UPSERT to avoid ON CONFLICT constraint issues
                    const resUpdate = await client.query(
                        `UPDATE tenant_users SET role_id = $3 WHERE tenant_id = $1 AND user_id = $2`,
                        [targetTenantId, userId, roleId]
                    );

                    if ((resUpdate.rowCount ?? 0) === 0) {
                        await client.query(
                            `INSERT INTO tenant_users (tenant_id, user_id, role_id) VALUES ($1, $2, $3)`,
                            [targetTenantId, userId, roleId]
                        );
                        console.log(`✅ Inserted ${email} linked to ${newSlug} with role ${roleId}`);
                    } else {
                        console.log(`✅ Updated ${email} role to ${roleId}`);
                    }
                } else {
                    // Fallback check
                    const resCheck = await client.query(
                        `SELECT 1 FROM tenant_users WHERE tenant_id = $1 AND user_id = $2`,
                        [targetTenantId, userId]
                    );
                    if ((resCheck.rowCount ?? 0) === 0) {
                        await client.query(
                            `INSERT INTO tenant_users (tenant_id, user_id) VALUES ($1, $2)`,
                            [targetTenantId, userId]
                        );
                        console.log(`✅ Inserted ${email} (no role)`);
                    }
                }
                console.log(`✅ Ensured ${email} linked to ${newSlug} with role ${roleId}`);
            }
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await client.end();
    }
}

cleanup();
