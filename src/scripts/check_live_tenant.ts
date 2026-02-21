import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';
    const client = new Client({ connectionString });
    try {
        await client.connect();

        // Let's find all tenant users for 'test-tenant'
        const tSql = `SELECT id FROM public.tenants WHERE slug = 'test-tenant'`;
        const resT = await client.query(tSql);
        if (resT.rowCount === 0) return console.log('no test_tenant');
        const tenantId = resT.rows[0].id;

        console.log('Tenant:', tenantId);

        const tuSql = `SELECT * FROM public.tenant_users WHERE tenant_id = $1`;
        const resTU = await client.query(tuSql, [tenantId]);
        console.table(resTU.rows);

        for (const tu of resTU.rows) {
            console.log(`Checking role ${tu.role_id} for user ${tu.user_id}`);
            const rpSql = `SELECT COUNT(*) as count FROM public.role_permissions WHERE role_id = $1`;
            const resRP = await client.query(rpSql, [tu.role_id]);
            console.log(`Permissions count: ${resRP.rows[0].count}`);
        }

    } catch (e) {
        console.error('Query Failed:', e);
    } finally {
        await client.end();
    }
}
run();
