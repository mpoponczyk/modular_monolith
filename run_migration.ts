
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
    const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("No DB URL found");
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase in some envs
    });

    try {
        await client.connect();
        console.log("Connected to DB");

        const sql = fs.readFileSync('/Users/Shared/Modular_Monolith/src/db/migrations/20260220160000_partners_legacy_fields.sql', 'utf-8');
        await client.query(sql);
        console.log("Migration executed successfully");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}

main();
