
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function applyMigration() {
    try {
        await client.connect();

        const sqlPath = path.resolve(process.cwd(), 'src/db/migrations/20260219000000_resolve_menu_rpc.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log(`Applying migration: ${path.basename(sqlPath)}`);
        await client.query(sql);
        console.log("Migration applied successfully.");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

applyMigration();
