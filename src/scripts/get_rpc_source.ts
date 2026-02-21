import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
    await client.connect();

    // Check RPC body
    const res = await client.query(`
        SELECT prosrc 
        FROM pg_proc 
        WHERE proname = 'resolve_menu_structure';
    `);

    console.log(res.rows[0]?.prosrc || "Function not found");

    await client.end();
}
run();
