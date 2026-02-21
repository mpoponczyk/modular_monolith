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

        console.log(`--- Orgs ---`);
        const orgs = await client.query('SELECT * FROM organizations');
        console.log(orgs.rows);

        console.log(`\n--- Companies ---`);
        const comps = await client.query('SELECT * FROM companies');
        console.log(comps.rows);

        console.log(`\n--- Tenants ---`);
        const tenants = await client.query('SELECT * FROM tenants');
        console.log(tenants.rows);

        console.log(`\n--- Roles ---`);
        const roles = await client.query('SELECT * FROM roles');
        console.log(roles.rows);

        console.log(`\n--- Permissions ---`);
        const perms = await client.query('SELECT * FROM permissions');
        console.log(perms.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
