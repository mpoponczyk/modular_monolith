
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspect() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        // 1. List Tables
        const resTables = await client.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        console.log('--- TABLES ---');
        resTables.rows.forEach(r => console.log(`${r.table_schema}.${r.table_name}`));

        // 2. Describe tenant_users
        console.log('\n--- TENANT_USERS COLUMNS ---');
        const resTu = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'tenant_users';
        `);
        resTu.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

        // 3. Check for roles table
        console.log('\n--- ROLES TABLE CONTENT ---');
        try {
            const resRoles = await client.query('SELECT * FROM public.roles');
            if (resRoles.rows.length === 0) console.log('(Empty)');
            resRoles.rows.forEach(r => console.log(JSON.stringify(r)));
        } catch (e) {
            console.log('Error querying roles:', (e as any).message);
        }

        // 4. Check Triggers on tenant_users
        console.log('\n--- TRIGGERS ON TENANT_USERS ---');
        const resTrig = await client.query(`
            SELECT trigger_name, event_manipulation, action_statement, action_orientation
            FROM information_schema.triggers
            WHERE event_object_table = 'tenant_users';
        `);
        resTrig.rows.forEach(r => console.log(`${r.trigger_name}: ${r.event_manipulation}`));

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await client.end();
    }
}

inspect();
