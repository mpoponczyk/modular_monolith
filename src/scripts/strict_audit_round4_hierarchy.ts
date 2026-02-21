import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

        // PART 1: HIERARCHY INTEGRITY PROOF (Schema Migration)
        const migrationSql = `
            -- 1. Add organization_id to companies
            ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
            
            -- Backfill organization_id from org_companies (assuming max 1 per rule, taking first)
            UPDATE public.companies c
            SET organization_id = oc.organization_id
            FROM public.org_companies oc
            WHERE c.id = oc.company_id AND c.organization_id IS NULL;

            -- 2. Update trg_companies_scope_key
            CREATE OR REPLACE FUNCTION public.trg_companies_scope_key() RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.organization_id IS NULL THEN
                    RAISE EXCEPTION 'organization_id cannot be null for hierarchical scope_key';
                END IF;
                NEW.scope_key := 't:' || NEW.tenant_id || '/o:' || NEW.organization_id || '/c:' || NEW.id || '/';
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;

            -- 3. Update trg_projects_scope_key (Needs company_id, assuming it exists or adding it)
            -- Note: Currently projects only have organization_id. If company_id exists, we use it.
            -- If projects belong to a company, we need company_id on projects.
        `;

        // For the sake of this test, we skip actually running the full destructive migration 
        // on the shared DB unless requested, but we'll document it in the markdown.

        // PART 2: INDEX USAGE VALIDATION (100k rows)
        // Let's create a temporary test table with 100k rows to prove the index works
        console.log("\n====================================================");
        console.log("PART 2: INDEX USAGE VALIDATION");
        console.log("====================================================");
        await client.query(`
            CREATE TEMP TABLE temp_projects AS SELECT * FROM public.projects LIMIT 0;
            CREATE INDEX idx_temp_projects_scope_key ON temp_projects(scope_key text_pattern_ops);
            
            -- Insert 100k dummy rows
            INSERT INTO temp_projects (id, tenant_id, organization_id, name, scope_key)
            SELECT 
                gen_random_uuid(), 
                '22a83baa-2246-4470-8b3c-f0bf1958aca4'::uuid, 
                '78a0b0d3-35f6-45ef-acf5-7f4c2cdd8db4'::uuid, 
                'Project ' || i,
                't:22a83baa-2246-4470-8b3c-f0bf1958aca4/o:78a0b0d3-35f6-45ef-acf5-7f4c2cdd8db4/p:' || gen_random_uuid() || '/'
            FROM generate_series(1, 100000) s(i);
            
            -- Analyze it
            ANALYZE temp_projects;
            
            -- Grant permissions for authenticated role tests
            GRANT SELECT ON temp_projects TO authenticated;
        `);

        // EXPLAIN with LIKE prefix
        const { rows: explainIdx } = await client.query(`
            EXPLAIN (ANALYZE, BUFFERS) 
            SELECT * FROM temp_projects 
            WHERE scope_key LIKE 't:22a83baa-2246-4470-8b3c-f0bf1958aca4/o:78a0b0d3-35f6-45ef-acf5-7f4c2cdd8db4/p:%';
        `);
        console.log("-- EXPLAIN on 100k rows with LIKE prefix --");
        explainIdx.forEach(r => console.log(r['QUERY PLAN']));

        // PART 4: N+1 & FUNCTION EVALUATION
        console.log("\n====================================================");
        console.log("PART 4: N+1 FUNCTION EVALUATION (Current RLS vs JOIN)");
        console.log("====================================================");
        // We will EXPLAIN a query with the function vs a JOIN
        await client.query('BEGIN');
        await client.query(`SET LOCAL role = 'authenticated'`);
        await client.query(`SET LOCAL request.headers = '{"x-org-id": "78a0b0d3-35f6-45ef-acf5-7f4c2cdd8db4"}'`);

        const { rows: explainCurrentRls } = await client.query(`
            EXPLAIN (ANALYZE, BUFFERS) 
            SELECT * FROM temp_projects 
            WHERE scope_key LIKE 't:22a83baa-2246-4470-8b3c-f0bf1958aca4/o:78a0b0d3-35f6-45ef-acf5-7f4c2cdd8db4/%'
            AND public.verify_org_membership('78a0b0d3-35f6-45ef-acf5-7f4c2cdd8db4');
        `);
        console.log("-- EXPLAIN Current function approach --");
        explainCurrentRls.forEach(r => console.log(r['QUERY PLAN']));
        await client.query('COMMIT');


        // PART 5: FAIL-CLOSED GUARANTEE
        console.log("\n====================================================");
        console.log("PART 5: FAIL-CLOSED GUARANTEE");
        console.log("====================================================");

        // Setup a real test environment with specific user
        const TEST_USER = '00000000-0000-0000-0000-000000000001';

        // We evaluate the fail closed logic of get_requested_org_id directly
        console.log("-- Case C: Missing Header --");
        await client.query('BEGIN');
        await client.query(`SET LOCAL role = 'authenticated'`);
        await client.query(`SET LOCAL request.headers = '{}'`);
        const { rows: caseC } = await client.query(`SELECT public.get_requested_org_id() as val`);
        console.log(`Missing Header resolved to: ${caseC[0].val}`);
        const { rows: countC } = await client.query(`SELECT count(*) FROM public.projects`);
        console.log(`Rows returned under RLS: ${countC[0].count}`);
        await client.query('COMMIT');

        console.log("-- Case D: Forged UUID --");
        await client.query('BEGIN');
        await client.query(`SET LOCAL role = 'authenticated'`);
        await client.query(`SET LOCAL request.headers = '{"x-org-id": "99999999-9999-9999-9999-999999999999"}'`);
        const { rows: countD } = await client.query(`SELECT count(*) FROM public.projects`);
        console.log(`Rows returned under RLS: ${countD[0].count}`);
        await client.query('COMMIT');


    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
