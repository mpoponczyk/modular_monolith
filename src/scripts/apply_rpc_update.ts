
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function apply() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 5000,
    });

    console.log('Connecting to DB...');
    await client.connect();
    console.log('Connected.');

    try {
        const sqlPath = path.resolve('src/db/migrations/20260216223000_resolve_user_tenants.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying SQL...');
        await client.query(sql);
        console.log('✅ Applied successfully.');
    } catch (e) {
        console.error('❌ Error applying SQL:', e);
    } finally {
        await client.end();
    }
}

apply();
