import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({ connectionString: process.env.DATABASE_URL });
const USER_EMAIL = 'mateusz.poponczyk@gmail.com';
const ORG_NAME = 'test_org';
const COMPANY_NAME = 'test_company';
const TENANT_NAME = 'test-tenant'; // Important: we use slug here for lookup

async function run() {
    await client.connect();

    try {
        await client.query('BEGIN');

        // 1. Get User
        const userRes = await client.query('SELECT id FROM auth.users WHERE email = $1', [USER_EMAIL]);
        if (userRes.rows.length === 0) throw new Error("User not found");
        const userId = userRes.rows[0].id;
        console.log(`✅ User identified: ${userId}`);

        // 2. Locate Test Tenant ID
        let tenantRes = await client.query('SELECT id, name FROM tenants WHERE slug = $1 LIMIT 1', [TENANT_NAME]);
        if (tenantRes.rows.length === 0) {
            console.log(`Creating test tenant...`);
            tenantRes = await client.query(`INSERT INTO tenants (name, slug, status, config) VALUES ($1, $2, 'active', '{}') RETURNING id`, ['Test Tenant', TENANT_NAME]);
        }
        const tenantId = tenantRes.rows[0].id;
        console.log(`✅ Tenant ID: ${tenantId}`);

        // 3. Upsert Organization
        let orgRes = await client.query('SELECT id FROM organizations WHERE name = $1 LIMIT 1', [ORG_NAME]);
        let orgId;
        if (orgRes.rows.length === 0) {
            console.log(`Creating organization: ${ORG_NAME}`);
            let groupRes = await client.query('SELECT id FROM groups LIMIT 1');
            let groupId;
            if (groupRes.rows.length === 0) {
                groupRes = await client.query(`INSERT INTO groups (name, tenant_id) VALUES ('Test Group', $1) RETURNING id`, [tenantId]);
            }
            groupId = groupRes.rows[0].id;

            orgRes = await client.query(
                `INSERT INTO organizations (name, tenant_id, owner_group_id) VALUES ($1, $2, $3) RETURNING id`,
                [ORG_NAME, tenantId, groupId]
            );
        }
        orgId = orgRes.rows[0].id;
        console.log(`✅ Org: ${orgId}`);

        // 4. Upsert Company
        let compRes = await client.query('SELECT id FROM companies WHERE name = $1 LIMIT 1', [COMPANY_NAME]);
        let compId;
        if (compRes.rows.length === 0) {
            console.log(`Creating company: ${COMPANY_NAME}`);
            compRes = await client.query(
                `INSERT INTO companies (name, tenant_id) VALUES ($1, $2) RETURNING id`,
                [COMPANY_NAME, tenantId]
            );
        }
        compId = compRes.rows[0].id;
        console.log(`✅ Company: ${compId}`);

        // 5. Assign User to Company
        console.log(`Assigning user to company...`);
        let companyRoles = await client.query('SELECT id FROM company_roles LIMIT 1');
        let compRoleId;
        if (companyRoles.rows.length === 0) {
            const newRole = await client.query(`INSERT INTO company_roles (name) VALUES ('OWNER') RETURNING id`);
            compRoleId = newRole.rows[0].id;
        } else {
            compRoleId = companyRoles.rows[0].id;
        }

        await client.query(`
            INSERT INTO company_users (company_id, user_id, role_id, tenant_id) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
        `, [compId, userId, compRoleId, tenantId]);

        // Ensure '*' permission physically exists
        await client.query(`
            INSERT INTO permissions (key, description) 
            VALUES ('*', 'Global Access')
            ON CONFLICT DO NOTHING
        `);

        // 6. Assign User to ALL Tenants
        const allTenants = await client.query('SELECT id, slug FROM tenants');
        for (const t of allTenants.rows) {
            console.log(`Assigning user to Tenant: ${t.slug} (${t.id}) as SUPERADMIN`);

            // Generate Role isolated for this Tenant
            let roleRes = await client.query("SELECT id FROM roles WHERE name = 'UAT_SUPERADMIN' AND tenant_id = $1 LIMIT 1", [t.id]);
            let roleId;
            if (roleRes.rows.length === 0) {
                roleRes = await client.query(`INSERT INTO roles (name, description, tenant_id) VALUES ('UAT_SUPERADMIN', 'Auto-generated', $1) RETURNING id`, [t.id]);
            }
            roleId = roleRes.rows[0].id;

            // Map the Role to the global '*'
            await client.query(`
                INSERT INTO role_permissions (role_id, permission_key, tenant_id) 
                VALUES ($1, '*', $2)
                ON CONFLICT DO NOTHING
            `, [roleId, t.id]);

            // Map the User
            const existingTu = await client.query(
                `SELECT role_id FROM tenant_users WHERE tenant_id = $1 AND user_id = $2`,
                [t.id, userId]
            );

            if (existingTu.rows.length === 0) {
                await client.query(`
                    INSERT INTO tenant_users (tenant_id, user_id, role_id) 
                    VALUES ($1, $2, $3)
                `, [t.id, userId, roleId]);
            } else {
                await client.query(`
                    UPDATE tenant_users SET role_id = $3 WHERE tenant_id = $1 AND user_id = $2
                `, [t.id, userId, roleId]);
            }
        }

        await client.query('COMMIT');
        console.log(`\n🎉 Audyt i naprawa zakończona pomyślnie. ${USER_EMAIL} posiada teraz wszystkie wymagane uprawnienia globalne.`);

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Setup failed:", e);
    } finally {
        await client.end();
    }
}
run();
