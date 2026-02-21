import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
    await client.connect();
    const userId = '9ba4ab2c-ba33-4ff3-a899-2048eb43e15a'; // mateusz.poponczyk@gmail.com

    const res = await client.query(`
        SELECT t.id, t.name, t.slug 
        FROM tenants t
        JOIN tenant_users tu ON tu.tenant_id = t.id
        WHERE tu.user_id = $1;
    `, [userId]);

    console.table(res.rows);
    await client.end();
}
run();
