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
    { name: "Admin Mgmt RPCs", file: "supabase/migrations/20260218130000_mnt_ferry_mgmt_rpcs.sql" }
];

async function applyPhase3() {
    // Strip sslmode=require if present to avoid conflict with ssl object
    const cleanConnectionString = connectionString?.split('?')[0];

    const client = new Client({
        connectionString: cleanConnectionString,
        ssl: { rejectUnauthorized: false }
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
                console.error(`❌ Error in ${step.name}:`, err.message);
                process.exit(1);
            }
        }

        console.log("\n🎉 Phase 3 Migration Complete!");

    } catch (e) {
        console.error("❌ Critical Error:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyPhase3();
