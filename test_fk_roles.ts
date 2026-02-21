import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
    await client.connect();
    
    // First remove orphans (or set null)
    await client.query(`
        UPDATE tenant_users 
        SET role_id = NULL 
        WHERE role_id IS NOT NULL 
          AND role_id NOT IN (SELECT id FROM roles);
    `);
    
    // Try FK again
    await client.query(`
        ALTER TABLE tenant_users
        ADD CONSTRAINT tenant_users_role_id_fkey
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
    `);
    
    // Finally, reload PostgREST schema cache
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    
    console.log("Cleanup complete, FK added, schema reloaded.");
    await client.end();
}
run();
