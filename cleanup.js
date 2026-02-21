const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to db. Starting cleanup...");

        const sql = `
      SET statement_timeout = 0;
      BEGIN;

      -- Drop tables created in strict_audit_v6.ts
      DROP TABLE IF EXISTS audit_projects CASCADE;
      DROP TABLE IF EXISTS audit_companies CASCADE;
      DROP TABLE IF EXISTS audit_organizations CASCADE;
      DROP TABLE IF EXISTS audit_group_members CASCADE;
      DROP TABLE IF EXISTS audit_groups CASCADE;
      
      -- Delete rows created in v7_audit_runner.ts
      DELETE FROM public.projects WHERE tenant_id = 'b0000000-0000-0000-0000-000000000000';
      DELETE FROM public.org_companies WHERE tenant_id = 'b0000000-0000-0000-0000-000000000000';
      DELETE FROM public.companies WHERE tenant_id = 'b0000000-0000-0000-0000-000000000000';
      DELETE FROM public.organizations WHERE tenant_id = 'b0000000-0000-0000-0000-000000000000';
      DELETE FROM public.group_members WHERE tenant_id = 'b0000000-0000-0000-0000-000000000000';
      DELETE FROM public.groups WHERE tenant_id = 'b0000000-0000-0000-0000-000000000000';
      DELETE FROM public.tenants WHERE id = 'b0000000-0000-0000-0000-000000000000';
      
      -- Finally auth.users
      DELETE FROM auth.users WHERE email LIKE 'bench_user_%@example.com';
      COMMIT;
    `;

        console.log("Executing SQL...");
        await client.query(sql);
        console.log("Cleanup completed successfully.");

    } catch (err) {
        console.error("Cleanup failed:", err);
        await client.query('ROLLBACK;');
    } finally {
        await client.end();
    }
}

run();
