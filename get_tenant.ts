
import { Client } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
    const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!connectionString) throw new Error("No DB URL");

    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();
        const res = await client.query("SELECT tenant_id FROM tenant_users WHERE user_id = '9ba4ab2c-ba33-4ff3-a899-2048eb43e15a' LIMIT 1");
        console.log("Tenant ID:", res.rows[0]?.tenant_id);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

main();
