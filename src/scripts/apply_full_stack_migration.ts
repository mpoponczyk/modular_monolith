import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// Load connection string from env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is not set.");
    process.exit(1);
}

const steps = [
    { name: "1. Base Schema (Tenants, Auth)", file: "src/db/schema.sql" },
    { name: "2. Core Hierarchy (Groups, Orgs)", file: "src/db/migrations/00000000000000_consolidated_schema.sql" },
    { name: "3. Ferry Booking Init", file: "supabase/migrations/20260218000000_mnt_ferry_booking_init.sql" },
    { name: "4. Ferry Booking Mutations", file: "supabase/migrations/20260218010000_mnt_ferry_booking_mutations.sql" },
    { name: "5. Ferry Booking Sales", file: "supabase/migrations/20260218030000_mnt_ferry_booking_sales.sql" },
    { name: "6. Sales Mutations", file: "supabase/migrations/20260218040000_mnt_sales_mutations.sql" },
    { name: "6.5. Sales RPC Fix", file: "supabase/migrations/20260218043000_fix_sales_rpcs.sql" },
    { name: "7. Add Ferry Capacity", file: "supabase/migrations/20260218050000_add_ferry_capacity.sql" },
    { name: "8. Data Migration (Clnt -> Mnt)", file: "supabase/migrations/20260218020000_migrate_clnt_data.sql" }
];

async function applyFullStack() {
    // Strip sslmode=require if present to avoid conflict with ssl object
    const cleanConnectionString = connectionString?.split('?')[0];

    const client = new Client({
        connectionString: cleanConnectionString,
        ssl: { rejectUnauthorized: false } // Handle potential SSL issues with Pooler
    });

    try {
        console.log("🔌 Connecting to database...");
        await client.connect();

        for (const step of steps) {
            console.log(`\n⏳ Applying: ${step.name}...`);
            const filePath = path.join(process.cwd(), step.file);

            if (!fs.existsSync(filePath)) {
                console.error(`❌ File not found: ${step.file}`);
                process.exit(1);
            }

            const sql = fs.readFileSync(filePath, 'utf-8');
            try {
                await client.query(sql);
                console.log(`✅ Success: ${step.name}`);
            } catch (err: any) {
                // Handle "relation already exists" gracefully for idempotent re-runs if possible,
                // but schema.sql crashes on "table tenants already exists".
                if (err.code === '42P07') { // duplicate_table
                    console.log(`⚠️  Notice: Table already exists, skipping/continuing... (${err.message})`);
                } else if (err.code === '42710') { // duplicate_object (constraint/index)
                    console.log(`⚠️  Notice: Object already exists, skipping... (${err.message})`);
                } else {
                    console.error(`❌ Error in ${step.name}:`, err.message);
                    console.error("Full Error:", err);
                    process.exit(1);
                }
            }
        }

        console.log("\n📊 Verifying Data Migration...");
        // Verify Routes Match
        const res = await client.query(`
            SELECT count(*) as count FROM public.mnt_routes 
            WHERE tenant_id = (SELECT id::text FROM public.tenants WHERE slug = 'test-zalew')
        `);
        console.log(`   - Verified mnt_routes count: ${res.rows[0].count}`);

        console.log("\n🎉 Full Stack Migration Complete!");

    } catch (e) {
        console.error("❌ Critical Error:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyFullStack();
