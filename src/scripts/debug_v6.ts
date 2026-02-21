import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    // Check raw data
    // Diagnostic
    const rlsCheck = await client.query(`SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname LIKE 'audit_%' ORDER BY relname`);
    console.log("RLS Status:", rlsCheck.rows);

    await client.query('BEGIN');

    // Check with roles
    await client.query(`
        SET LOCAL role = 'authenticated';
        SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
        SET LOCAL request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "app_metadata": {"tenant_id": "22a83baa-2246-4470-8b3c-f0bf1958aca4"}, "active_org_id": "78a0b0d3-35f6-45ef-acf5-7f4c2cdd8db4"}';
    `);

    // test RLS conditions individually
    const res3 = await client.query(`
        SELECT COALESCE(
            NULLIF(current_setting('request.jwt.claim.tenant_id', true), ''),
            NULLIF(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'tenant_id'
        )::uuid AS coalesce
    `);
    console.log("tenant_id eval:", res3.rows[0].coalesce);

    const res4 = await client.query(`
        SELECT (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'active_org_id')::uuid AS uuid
    `);
    console.log("org_id eval:", res4.rows[0].uuid);

    const res_orgs = await client.query(`SELECT * FROM audit_organizations`);
    console.log("Orgs:", res_orgs.rows);

    const res_gms = await client.query(`SELECT * FROM audit_group_members WHERE user_id = '33333333-3333-3333-3333-333333333333'`);
    console.log("Target GMs:", res_gms.rows);

    const res5 = await client.query(`
        SELECT count(*) FROM audit_group_members gm
        JOIN audit_organizations o ON gm.group_id = o.owner_group_id
        WHERE gm.user_id = '33333333-3333-3333-3333-333333333333'
        AND gm.tenant_id = '22a83baa-2246-4470-8b3c-f0bf1958aca4'
    `);
    console.log("EXISTS eval count:", res5.rows[0].count);

    const res6 = await client.query(`SELECT count(*) FROM audit_projects`);
    console.log("RLS active count:", res6.rows[0].count);

    await client.query('COMMIT');
    await client.end();
}
run();
