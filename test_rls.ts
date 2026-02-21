import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
    await client.connect();
    const res = await client.query(`
        SELECT tablename, policyname, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename IN ('tenant_users', 'roles', 'role_permissions', 'permissions')
    `);
    console.table(res.rows);
    await client.end();
}
run();
