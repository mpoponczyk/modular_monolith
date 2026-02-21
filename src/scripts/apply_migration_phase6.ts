
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function applyMigration() {
    console.log('Connecting to DB...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected.');

        const sqlPath = path.resolve(__dirname, '../db/migrations/20260218160000_phase6_parity.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying Migration:', sqlPath);
        await client.query(sql);
        console.log('✅ Migration applied successfully.');

    } catch (e) {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyMigration();
