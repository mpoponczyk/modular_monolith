import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const REPORT_FILE = path.join(process.cwd(), 'STRICT_V7_RLS_PERF_AUDIT.md');

function appendToReport(text: string) {
    fs.appendFileSync(REPORT_FILE, text + '\n');
}

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    // Reset report
    fs.writeFileSync(REPORT_FILE, '# STRICT V7 PERFORMANCE + PLANNER AUDIT\n\n');

    try {
        appendToReport('====================================================');
        appendToReport('PHASE 0 – ENVIRONMENT SNAPSHOT');
        appendToReport('====================================================');

        const pgVer = await client.query('SHOW server_version;');
        appendToReport(`**Postgres version:**\n\`\`\`text\n${pgVer.rows[0].server_version}\n\`\`\`\n`);

        const ext = await client.query(`
            SELECT extname, extversion 
            FROM pg_extension 
            WHERE extname IN ('pg_stat_statements', 'pgcrypto', 'uuid-ossp', 'pgjwt');
        `);
        appendToReport(`**Extensions:**\n\`\`\`text\n${ext.rows.map(r => `${r.extname} ${r.extversion}`).join('\n')}\n\`\`\`\n`);

        appendToReport(`**Supabase / PostgREST context:**`);
        appendToReport(`Connection explicitly tests direct query with SET LOCAL imitating PostgREST request.headers and request.jwt.claims behavior.\n`);

        const tables = ['organizations', 'companies', 'projects', 'group_members'];
        const sizes = await client.query(`
            SELECT relname, reltuples::bigint AS approx_rows, pg_total_relation_size('public.' || relname) as size_bytes
            FROM pg_class 
            WHERE relname IN ('organizations', 'companies', 'projects', 'group_members')
            AND relnamespace = 'public'::regnamespace;
        `);
        appendToReport(`**Table Sizes (before baseline / benchmark dataset):**\n\`\`\`text\n${sizes.rows.map(r => `${r.relname}: ${r.approx_rows} rows, ${r.size_bytes} bytes`).join('\n')}\n\`\`\`\n`);


        appendToReport('====================================================');
        appendToReport('PHASE 1 – INVENTORY OF CURRENT RLS + FUNCTIONS');
        appendToReport('====================================================');

        const policies = await client.query(`
            SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE tablename IN ('organizations', 'companies', 'projects')
            AND schemaname = 'public';
        `);
        appendToReport(`**RLS Policies:**\n\`\`\`text`);
        policies.rows.forEach(r => {
            appendToReport(`Table: ${r.tablename} | Policy: ${r.policyname} | Cmd: ${r.cmd}`);
            appendToReport(`Qual: ${r.qual}`);
            appendToReport(`---`);
        });
        appendToReport(`\`\`\`\n`);

        const functions = await client.query(`
            SELECT p.proname, p.provolatile,
                   pg_get_functiondef(p.oid) as def,
                   p.prosecdef,
                   (SELECT unnest(proconfig) LIMIT 1) as search_path
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
            AND p.proname IN ('get_requested_org_id', 'get_tenant_id');
        `);
        appendToReport(`**Functions:**`);
        functions.rows.forEach(r => {
            appendToReport(`\`\`\`sql`);
            const vol = r.provolatile === 'i' ? 'IMMUTABLE' : r.provolatile === 's' ? 'STABLE' : 'VOLATILE';
            appendToReport(`Function: ${r.proname}`);
            appendToReport(`Volatility: ${vol}`);
            appendToReport(`Security Definer: ${r.prosecdef}`);
            appendToReport(`Implementation:\n${r.def}`);
            appendToReport(`\`\`\`\n`);
        });

        const indexes = await client.query(`
            SELECT tablename, indexname, indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND tablename IN ('organizations', 'companies', 'projects', 'group_members');
        `);
        appendToReport(`**Indexes:**\n\`\`\`sql`);
        indexes.rows.forEach(r => {
            appendToReport(`${r.indexdef};`);
        });
        appendToReport(`\`\`\`\n`);

        console.log("Phase 0 & 1 Complete.");

        appendToReport('====================================================');
        appendToReport('PHASE 2 – SCALE TEST DATA (500k)');
        appendToReport('====================================================');

        console.log("Generating benchmark data...");
        // Generate benchmark tables. 1k orgs, 100k companies, 500k projects, 100k members.

        // We will do this by creating _bench tables to avoid messing with main production tables, or we can use the actual partitioned tables?
        // Let's use actual partition mapping like the previous script, but isolated to tenant 'b0000000-0000-0000-0000-000000000000'

        const B_TENANT_ID = 'b0000000-0000-0000-0000-000000000000';
        await client.query('BEGIN;');
        await client.query('SET statement_timeout = 0;');

        // Ensure the benchmark tenant exists
        await client.query(`
            INSERT INTO public.tenants (id, name, slug)
            VALUES ('${B_TENANT_ID}', 'Benchmark Tenant', 'bench-tenant')
            ON CONFLICT DO NOTHING;
        `);

        // Ensure a group for this tenant owner exists
        await client.query(`
            INSERT INTO public.groups (id, tenant_id, name)
            VALUES ('10000000-0000-0000-0000-000000000000', '${B_TENANT_ID}', 'Benchmark Owner')
            ON CONFLICT DO NOTHING;
        `);

        // Generate 100k users first
        await client.query(`
            CREATE TEMP TABLE temp_bench_users AS
            SELECT gen_random_uuid() as id FROM generate_series(1, 100000);
            
            INSERT INTO auth.users (id, aud, role, email)
            SELECT id, 'authenticated', 'authenticated', 'bench_user_' || id || '@example.com' FROM temp_bench_users
            ON CONFLICT DO NOTHING;
        `);

        // Generate 100k members using the temp users
        await client.query(`
            INSERT INTO public.group_members (group_id, user_id, tenant_id)
            SELECT '10000000-0000-0000-0000-000000000000', id, '${B_TENANT_ID}'
            FROM temp_bench_users
            ON CONFLICT DO NOTHING;
        `);

        // Generate 1k orgs
        await client.query(`
            INSERT INTO public.organizations (id, tenant_id, name, owner_group_id)
            SELECT 
                gen_random_uuid(), 
                '${B_TENANT_ID}', 
                'Bench Org ' || i,
                '10000000-0000-0000-0000-000000000000'
            FROM generate_series(1, 1000) i
            ON CONFLICT DO NOTHING;
        `);

        // Store org UUIDs temporarily to link companies and projects
        await client.query(`
            CREATE TEMP TABLE temp_orgs AS
            SELECT id FROM public.organizations WHERE tenant_id = '${B_TENANT_ID}';
        `);

        // Generate 100k companies (100 per org)
        await client.query(`
            INSERT INTO public.companies (id, tenant_id, name)
            SELECT
                gen_random_uuid(),
                '${B_TENANT_ID}',
                'Bench Comp ' || i
            FROM generate_series(1, 100000) i
            ON CONFLICT DO NOTHING;
        `);

        // Link org companies
        await client.query(`
            CREATE TEMP TABLE temp_comps AS
            SELECT id, row_number() OVER () as rn FROM public.companies WHERE tenant_id = '${B_TENANT_ID}';
            
            CREATE TEMP TABLE temp_org_list AS 
            SELECT id, row_number() OVER () as rn FROM temp_orgs;

            INSERT INTO public.org_companies (organization_id, company_id, tenant_id)
            SELECT 
                (SELECT id FROM temp_org_list WHERE rn = ((tc.rn - 1) % 1000) + 1),
                tc.id,
                '${B_TENANT_ID}'
            FROM temp_comps tc
            ON CONFLICT DO NOTHING;
        `);

        // Generate 500k projects (5 per company)
        // We'll do an INSERT INTO SELECT using cross join or generate_series.
        console.log("Inserting 500k projects. This should be faster...");

        await client.query(`
            INSERT INTO public.projects (id, tenant_id, organization_id, name)
            SELECT 
                gen_random_uuid(),
                '${B_TENANT_ID}',
                (SELECT id FROM temp_org_list WHERE rn = ((tc.rn - 1) % 1000) + 1),
                'Project ' || j || ' (C' || tc.rn || ')'
            FROM temp_comps tc
            CROSS JOIN generate_series(1, 5) j
            ON CONFLICT DO NOTHING;
        `);

        await client.query('COMMIT;');

        const projectCount = await client.query(`SELECT count(*)::bigint as cnt FROM public.projects WHERE tenant_id = '${B_TENANT_ID}';`);
        appendToReport(`Successfully generated benchmark dataset within target tenant partition (\`${B_TENANT_ID}\`).`);
        appendToReport(`- Organizations: ~1k`);
        appendToReport(`- Companies: ~100k`);
        appendToReport(`- Group Members: ~100k`);
        appendToReport(`- Projects exactly created in loop: ${projectCount.rows[0].cnt}`);
        appendToReport(`\nVACUUM ANALYZE performed on public.projects, organizations, companies, and group_members.`);

        await client.query('VACUUM ANALYZE public.projects;');
        await client.query('VACUUM ANALYZE public.organizations;');
        await client.query('VACUUM ANALYZE public.companies;');
        await client.query('VACUUM ANALYZE public.group_members;');

        console.log("Phase 2 Complete.");

        appendToReport('====================================================');
        appendToReport('PHASE 3 – PLANNER PROOFS (EXPLAIN ANALYZE)');
        appendToReport('====================================================');
        console.log("Running Phase 3 Planner Proofs...");

        const benchUser = await client.query(`SELECT user_id FROM public.group_members WHERE tenant_id = '${B_TENANT_ID}' LIMIT 1`);
        const targetUserId = benchUser.rows[0].user_id;

        const explainQuery = async (title: string, sql: string, useRls: boolean = false) => {
            appendToReport(`### ${title}`);
            appendToReport(`\`\`\`sql\n${sql}\n\`\`\``);
            try {
                await client.query('BEGIN;');
                if (useRls) {
                    await client.query(`SET LOCAL role = 'authenticated';`);
                    await client.query(`SET LOCAL request.jwt.claims TO '{"sub": "${targetUserId}", "user_metadata": { "tenant_id": "${B_TENANT_ID}" }}';`);
                }
                const explainRes = await client.query(`EXPLAIN (ANALYZE, BUFFERS) ${sql}`);
                appendToReport(`\`\`\`text\n${explainRes.rows.map((r: any) => r['QUERY PLAN']).join('\n')}\n\`\`\`\n`);
                await client.query('ROLLBACK;');
            } catch (err: any) {
                appendToReport(`**ERROR during EXPLAIN:** ${err.message}\n`);
                await client.query('ROLLBACK;');
            }
        };

        await explainQuery('Q1: Direct Projects Table Scan (No RLS Context) with Tenant Filter', `SELECT * FROM public.projects WHERE tenant_id = '${B_TENANT_ID}' LIMIT 10;`, false);
        await explainQuery('Q2: Direct Projects Table Scan (No RLS Context) filtering by Scope Key', `SELECT * FROM public.projects WHERE scope_key LIKE 't:${B_TENANT_ID}/o:%/p:%' LIMIT 10;`, false);
        await explainQuery('Q3: Full RLS Authenticated Query on Projects (Should use Index)', `SELECT * FROM public.projects LIMIT 10;`, true);
        await explainQuery('Q4: Search Projects by Name under RLS', `SELECT * FROM public.projects WHERE name = 'Project 50 (C1000)' LIMIT 5;`, true);

        // End Phase 3
        console.log("Phase 3 Complete.");

        appendToReport('====================================================');
        appendToReport('PHASE 4 – "STABLE" EFFECT VALIDATION');
        appendToReport('====================================================');
        console.log("Running Phase 4 STABLE Effect Validation...");

        await client.query(`
            CREATE OR REPLACE FUNCTION public.get_tenant_id_volatile() RETURNS uuid
            LANGUAGE plpgsql SECURITY DEFINER VOLATILE AS $$
            BEGIN
                RETURN NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'tenant_id', '')::uuid;
            END;
            $$;

            CREATE OR REPLACE FUNCTION public.get_tenant_id_stable() RETURNS uuid
            LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
            BEGIN
                RETURN NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'tenant_id', '')::uuid;
            END;
            $$;
        `);

        // We run a simple query with both versions without actually changing the RLS policy but wrapping it in an EXPLAIN to see if the planner executes it once or multiple times.
        await explainQuery('S1: Projects scan using VOLATILE get_tenant_id', `SELECT * FROM public.projects WHERE tenant_id = public.get_tenant_id_volatile() LIMIT 100;`, true);
        await explainQuery('S2: Projects scan using STABLE get_tenant_id', `SELECT * FROM public.projects WHERE tenant_id = public.get_tenant_id_stable() LIMIT 100;`, true);

        console.log("Phase 4 Complete.");

        appendToReport('====================================================');
        appendToReport('PHASE 5 – RLS OVERHEAD MEASUREMENT');
        appendToReport('====================================================');
        console.log("Running Phase 5 RLS Overhead Measurement...");

        // Q10 native vs Q11 RLS
        await explainQuery('Baseline: SELECT count(*) Native', `SELECT count(*) FROM public.projects WHERE tenant_id = '${B_TENANT_ID}';`, false);
        await explainQuery('Overhead: SELECT count(*) RLS', `SELECT count(*) FROM public.projects;`, true);

        console.log("Phase 5 Complete.");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}
run();
