import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// Load connection string from env or default
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is not set.");
    console.error("Please export DATABASE_URL='postgres://user:pass@host:port/db' and try again.");
    process.exit(1);
}

async function applyPhase3() {
    const client = new Client({ connectionString });
    const migrationFile = path.join(process.cwd(), 'supabase/migrations/20260218020000_migrate_clnt_data.sql');

    if (!fs.existsSync(migrationFile)) {
        console.error(`❌ Migration file not found: ${migrationFile}`);
        process.exit(1);
    }

    try {
        console.log("🔌 Connecting to database...");
        await client.connect();

        console.log(`📜 Applying migration: ${path.basename(migrationFile)}...`);
        const sql = fs.readFileSync(migrationFile, 'utf-8');
        await client.query(sql);
        console.log("✅ Migration applied successfully.");

        console.log("\n📊 Verifying Data Integrity...");

        // Verify Locations
        const resLocations = await client.query(`
            SELECT count(*) as count FROM public.mnt_locations 
            WHERE tenant_id = (SELECT id FROM public.tenants WHERE slug = 'test-zalew')
        `);
        console.log(`   - mnt_locations count: ${resLocations.rows[0].count}`);

        // Verify Ferries
        const resFerries = await client.query(`
            SELECT count(*) as count FROM public.mnt_ferries 
            WHERE tenant_id = (SELECT id FROM public.tenants WHERE slug = 'test-zalew')
        `);
        console.log(`   - mnt_ferries count: ${resFerries.rows[0].count}`);

        // Verify Routes
        const resRoutes = await client.query(`
            SELECT count(*) as count FROM public.mnt_routes 
            WHERE tenant_id = (SELECT id FROM public.tenants WHERE slug = 'test-zalew')
        `);
        console.log(`   - mnt_routes count: ${resRoutes.rows[0].count}`);

    } catch (e) {
        console.error("❌ Error applying migration:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyPhase3();
