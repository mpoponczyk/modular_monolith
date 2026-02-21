import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function run() {
    if (!process.env.DATABASE_URL) {
        console.error("Missing DATABASE_URL");
        return;
    }
    const connectionString = process.env.DATABASE_URL;

    const client = new Client({
        connectionString
    });

    try {
        await client.connect();

        // Test A.3: Get sample projects
        const { rows: projRows } = await client.query(`SELECT id, tenant_id, organization_id, scope_key FROM public.projects LIMIT 1`);
        console.log("--- PROJECT SAMPLE ---");
        console.dir(projRows, { depth: null });

        const { rows: compRows } = await client.query(`SELECT id, tenant_id, scope_key FROM public.companies LIMIT 1`);
        console.log("--- COMPANY SAMPLE ---");
        console.dir(compRows, { depth: null });

        // Test B.3: EXPLAIN PLAN
        if (projRows.length > 0) {
            const p = projRows[0];
            const prefix = `t:${p.tenant_id}/o:${p.organization_id}/%`;
            const { rows: explain } = await client.query(`EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM public.projects WHERE scope_key LIKE $1`, [prefix]);
            console.log("--- EXPLAIN PLAN ---");
            explain.forEach(r => console.log(r['QUERY PLAN']));
        }

        // Test D.4: EXPLAIN With get_requested_org_id()
        await client.query('BEGIN');
        await client.query(`SET LOCAL role = 'authenticated'`);
        await client.query(`SET LOCAL request.headers = '{"x-org-id": "00000000-0000-0000-0000-000000000000"}'`);
        const { rows: explainRls } = await client.query(`EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM public.projects`);
        console.log("--- RLS EXPLAIN PLAN ---");
        explainRls.forEach(r => console.log(r['QUERY PLAN']));
        await client.query('COMMIT');

        // Test C.4: Fail-closed proof
        console.log("--- FAIL CLOSED TESTS ---");

        // Case 1: missing org id
        await client.query('BEGIN');
        await client.query(`SET LOCAL role = 'authenticated'`);
        await client.query(`SET LOCAL request.headers = '{}'`);
        const { rows: rowsC1 } = await client.query(`SELECT count(*) FROM public.projects`);
        console.log("Missing org id count:", rowsC1[0].count);
        await client.query('COMMIT');

        // Case 2: forged org id
        await client.query('BEGIN');
        await client.query(`SET LOCAL role = 'authenticated'`);
        await client.query(`SET LOCAL request.headers = '{"x-org-id": "11111111-1111-1111-1111-111111111111"}'`);
        const { rows: rowsC2 } = await client.query(`SELECT count(*) FROM public.projects`);
        console.log("Forged org id count:", rowsC2[0].count);
        await client.query('COMMIT');

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
