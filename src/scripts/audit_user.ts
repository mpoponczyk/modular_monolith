import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({ connectionString: process.env.DATABASE_URL });
const USER_EMAIL = 'mateusz.poponczyk@gmail.com';

async function run() {
    await client.connect();

    try {
        const userRes = await client.query('SELECT id FROM auth.users WHERE email = $1', [USER_EMAIL]);
        if (userRes.rows.length === 0) { console.error(`❌ User not found`); return; }
        const userId = userRes.rows[0].id;
        console.log(`User ID: ${userId}\n`);

        console.log(`--- Existing Organizations ---`);
        const orgs = await client.query('SELECT * FROM organizations');
        orgs.rows.forEach(o => console.log(`Org: ID=${o.id}, Name=${o.name}, OwnerID=${o.owner_id || o.created_by || 'N/A'}`));

        console.log(`\n--- Existing Companies ---`);
        const comps = await client.query('SELECT id, name, organization_id FROM companies');
        comps.rows.forEach(c => console.log(`Company: ID=${c.id}, Name=${c.name}, OrgID=${c.organization_id}`));

        console.log(`\n--- Existing Tenants ---`);
        const tenants = await client.query('SELECT id, name, slug, company_id FROM tenants');
        tenants.rows.forEach(t => console.log(`Tenant: ID=${t.id}, Name=${t.name}, Slug=${t.slug}, CompID=${t.company_id}`));

        console.log(`\n--- User Companies ---`);
        const userComps = await client.query('SELECT * FROM company_users WHERE user_id = $1', [userId]);
        console.log(userComps.rows);

        console.log(`\n--- User Tenants ---`);
        const userTenants = await client.query(`
            SELECT t.name, t.slug, r.name as role_name, rp.permission_key
            FROM tenant_users tu
            JOIN tenants t ON tu.tenant_id = t.id
            LEFT JOIN roles r ON tu.role_id = r.id
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            WHERE tu.user_id = $1
        `, [userId]);
        console.log(userTenants.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
