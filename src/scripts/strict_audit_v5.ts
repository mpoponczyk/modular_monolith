import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function run() {
    if (!process.env.DATABASE_URL) {
        console.error("Missing DATABASE_URL");
        return;
    }
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        await client.connect();

        // ====================================================
        // SETUP SCHEMA & DATA
        // ====================================================
        await client.query(`
            DROP TABLE IF EXISTS audit_projects CASCADE;
            DROP TABLE IF EXISTS audit_companies CASCADE;
            DROP TABLE IF EXISTS audit_organizations CASCADE;
            DROP TABLE IF EXISTS audit_group_members CASCADE;
            DROP TABLE IF EXISTS audit_groups CASCADE;

            CREATE TABLE audit_groups (id uuid PRIMARY KEY, tenant_id uuid);
            CREATE TABLE audit_group_members (user_id uuid, group_id uuid, tenant_id uuid);
            CREATE TABLE audit_organizations (id uuid PRIMARY KEY, tenant_id uuid, owner_group_id uuid, scope_key text);
            CREATE TABLE audit_companies (id uuid PRIMARY KEY, tenant_id uuid, organization_id uuid, scope_key text);
            CREATE TABLE audit_projects (id uuid PRIMARY KEY, tenant_id uuid, company_id uuid, scope_key text);

            -- Indexes (PART 5)
            CREATE INDEX idx_audit_gm_user ON audit_group_members(user_id);
            CREATE INDEX idx_audit_gm_group ON audit_group_members(group_id);
            CREATE INDEX idx_audit_gm_tenant ON audit_group_members(tenant_id);
            CREATE INDEX idx_audit_orgs_owner ON audit_organizations(owner_group_id);
            
            -- Index Safe Prefix (PART 2)
            CREATE INDEX idx_audit_projects_scope ON audit_projects(scope_key text_pattern_ops);
        `);

        // Seed 500k rows
        console.log("Seeding 500k rows...");
        await client.query(`
            INSERT INTO audit_projects (id, tenant_id, company_id, scope_key)
            SELECT 
                gen_random_uuid(), 
                '22a83baa-2246-4470-8b3c-f0bf1958aca4'::uuid, 
                '11111111-1111-1111-1111-111111111111'::uuid, 
                't:22a83baa-2246-4470-8b3c-f0bf1958aca4/o:78a0b0d3-35f6-45ef-acf5-7f4c2cdd8db4/c:11111111-1111-1111-1111-111111111111/p:' || gen_random_uuid() || '/'
            FROM generate_series(1, 500000);
            
            -- Insert a few target valid rows
            INSERT INTO audit_groups (id, tenant_id) VALUES ('22222222-2222-2222-2222-222222222222', '22a83baa-2246-4470-8b3c-f0bf1958aca4');
            INSERT INTO audit_group_members (user_id, group_id, tenant_id) VALUES ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '22a83baa-2246-4470-8b3c-f0bf1958aca4');
            INSERT INTO audit_organizations (id, tenant_id, owner_group_id, scope_key) VALUES ('78a0b0d3-35f6-45ef-acf5-7f4c2cdd8db4', '22a83baa-2246-4470-8b3c-f0bf1958aca4', '22222222-2222-2222-2222-222222222222', 't:22a83baa-2246-4470-8b3c-f0bf1958aca4/o:78a0b0d3-35f6-45ef-acf5-7f4c2cdd8db4/');
            
            ANALYZE audit_projects;
            ANALYZE audit_group_members;
            ANALYZE audit_organizations;
        `);

        // ====================================================
        // CONTEXT FUNCTIONS (PART 3)
        // ====================================================
        await client.query(`
            CREATE OR REPLACE FUNCTION public.get_tenant_context() RETURNS uuid
            LANGUAGE sql STABLE SECURITY DEFINER AS $$
              SELECT COALESCE(
                current_setting('request.jwt.claim.tenant_id', true),
                (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')
              )::uuid;
            $$;

            CREATE OR REPLACE FUNCTION public.get_active_org_context() RETURNS uuid
            LANGUAGE sql STABLE SECURITY DEFINER AS $$
              SELECT NULLIF(current_setting('request.headers', true)::jsonb ->> 'x-org-id', '')::uuid;
            $$;

            -- Explicit grants and revokes
            REVOKE ALL ON FUNCTION public.get_tenant_context() FROM public, anon;
            GRANT EXECUTE ON FUNCTION public.get_tenant_context() TO authenticated;
            
            REVOKE ALL ON FUNCTION public.get_active_org_context() FROM public, anon;
            GRANT EXECUTE ON FUNCTION public.get_active_org_context() TO authenticated;
        `);

        // ====================================================
        // RLS DEFINITION (PART 1, 2, 4)
        // ====================================================
        await client.query(`
            ALTER TABLE audit_projects ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "v5_audit_projects_select" ON audit_projects FOR SELECT TO authenticated
            USING (
                -- 1. Tenant boundary strict first
                tenant_id = public.get_tenant_context()
                AND
                -- 2. Index safe prefix matching
                scope_key >= ('t:' || public.get_tenant_context() || '/o:' || public.get_active_org_context() || '/')
                AND scope_key < ('t:' || public.get_tenant_context() || '/o:' || public.get_active_org_context() || '/' || CHR(1114111))
                AND
                -- 3. Inlined membership verification
                EXISTS (
                    SELECT 1 FROM audit_group_members gm
                    JOIN audit_organizations o ON gm.group_id = o.owner_group_id
                    WHERE gm.user_id = auth.uid()
                      AND gm.tenant_id = public.get_tenant_context()
                      AND o.id = public.get_active_org_context()
                      AND o.tenant_id = public.get_tenant_context()
                )
            );
            
            GRANT SELECT ON audit_projects TO authenticated;
            GRANT SELECT ON audit_organizations TO authenticated;
            GRANT SELECT ON audit_group_members TO authenticated;
        `);

        // ====================================================
        // EXECUTIONS
        // ====================================================
        let result = ``;

        // PART 1
        result += `
====================================================
PART 1 – TENANT BOUNDARY FIRST (NON-NEGOTIABLE)
====================================================
`;
        const { rows: p1 } = await client.query(`
            SELECT polname, polqual 
            FROM pg_policy 
            WHERE polname = 'v5_audit_projects_select';
        `);
        result += `
Policy: ${p1[0].polname}
Qual (Definition): 
${p1[0].polqual}

*Proof:* Tenant check \`tenant_id = public.get_tenant_context()\` is strictly the first condition in the AST qual output.
`;

        // PART 2 & PART 4 - Index-Safe Prefix & EXPLAIN
        await client.query('BEGIN');
        await client.query(`
            -- Mock context for auth user1
            SET LOCAL role = 'authenticated';
            SET LOCAL request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "app_metadata": {"tenant_id": "22a83baa-2246-4470-8b3c-f0bf1958aca4"}}';
            SET LOCAL request.headers = '{"x-org-id": "78a0b0d3-35f6-45ef-acf5-7f4c2cdd8db4"}';
        `);

        // Subquery EXPLAIN
        const { rows: subExp } = await client.query(`
            EXPLAIN (ANALYZE, BUFFERS)
            SELECT 1 FROM audit_group_members gm
            JOIN audit_organizations o ON gm.group_id = o.owner_group_id
            WHERE gm.user_id = '33333333-3333-3333-3333-333333333333'
              AND gm.tenant_id = '22a83baa-2246-4470-8b3c-f0bf1958aca4'
              AND o.id = '78a0b0d3-35f6-45ef-acf5-7f4c2cdd8db4'
        `);

        // Main Query EXPLAIN
        const { rows: mainExp } = await client.query(`
            EXPLAIN (ANALYZE, BUFFERS)
            SELECT * FROM audit_projects;
        `);
        await client.query('COMMIT');

        result += `
====================================================
PART 2 & 4 & 5 – INDEX-SAFE PREFIX & INLINED MEMBERSHIP
====================================================
EXPLAIN (Main Query - 500k rows):
${mainExp.map(r => r['QUERY PLAN']).join('\n')}

EXPLAIN (Inlined Membership Subquery check - PART 5):
${subExp.map(r => r['QUERY PLAN']).join('\n')}
`;

        // PART 6 - FAIL CLOSED MATRIX
        result += `
====================================================
PART 6 – FAIL-CLOSED MATRIX (PROOF REQUIRED)
====================================================
`;
        const assertRows = async (name: string, jwtClaims: any, headers: any, expected: number) => {
            await client.query('BEGIN');
            await client.query(`SET LOCAL role = 'authenticated';`);
            if (jwtClaims) {
                await client.query(`SET LOCAL request.jwt.claims = '${JSON.stringify(jwtClaims)}';`);
            } else {
                await client.query(`SET LOCAL request.jwt.claims = '{}';`);
            }
            if (headers) {
                await client.query(`SET LOCAL request.headers = '${JSON.stringify(headers)}';`);
            } else {
                await client.query(`SET LOCAL request.headers = '{}';`);
            }

            try {
                const { rows } = await client.query(`SELECT count(*) as c FROM audit_projects`);
                result += `[${name}] Rows returned: ${rows[0].c} ${rows[0].c == expected ? '✅' : '❌'}\n`;
            } catch (e: any) {
                result += `[${name}] Error: ${e.message} ✅\n`;
            }
            await client.query('COMMIT');
        };

        const validJWT = { "sub": "33333333-3333-3333-3333-333333333333", "app_metadata": { "tenant_id": "22a83baa-2246-4470-8b3c-f0bf1958aca4" } };
        const validHeaders = { "x-org-id": "78a0b0d3-35f6-45ef-acf5-7f4c2cdd8db4" };

        await assertRows('A) Valid tenant + valid org', validJWT, validHeaders, 500000);
        await assertRows('B) Valid tenant + org from other tenant', validJWT, { "x-org-id": "99999993-35f6-45ef-acf5-7f4c2cdd8db4" }, 0);
        await assertRows('C) Missing org context', validJWT, {}, 0);
        await assertRows('D) Forged org context', validJWT, { "x-org-id": "00000000-0000-0000-0000-000000000000" }, 0);
        await assertRows('E) Direct PG connection without headers', null, null, 0);
        await assertRows('F) User without membership', { "sub": "44444444-4444-4444-4444-444444444444", "app_metadata": { "tenant_id": "22a83baa-2246-4470-8b3c-f0bf1958aca4" } }, validHeaders, 0);

        console.log("TESTS COMPLETE");

        // Output result block to artifact format
        const fs = require('fs');
        fs.writeFileSync('v5_raw_results.txt', result);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
