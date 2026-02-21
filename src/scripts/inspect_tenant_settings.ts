import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

async function checkSettings() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query(`SELECT count(*) FROM public.tenant_settings`);
        console.log('Rows in tenant_settings:', res.rows[0].count);

        const res2 = await client.query(`SELECT * FROM public.tenant_settings LIMIT 1`);
        if (res2.rows.length > 0) {
            console.log('Sample row:', JSON.stringify(res2.rows[0], null, 2));
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

checkSettings();
