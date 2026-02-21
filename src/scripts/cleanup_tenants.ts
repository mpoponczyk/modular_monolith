import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
    await client.connect();
    const userId = '9ba4ab2c-ba33-4ff3-a899-2048eb43e15a'; // mateusz.poponczyk@gmail.com
    const testTenantId = '22a83baa-2246-4470-8b3c-f0bf1958aca4';

    // Delete from all except test-tenant
    const res = await client.query(`
        DELETE FROM tenant_users 
        WHERE user_id = $1 AND tenant_id != $2;
    `, [userId, testTenantId]);

    console.log(`Deleted ${res.rowCount} extraneous tenant memberships for user.`);
    await client.end();
}
run();
