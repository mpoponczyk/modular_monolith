
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function inspect() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        const tables = ['tenant_modules', 'tenant_users'];

        for (const table of tables) {
            console.log(`\n🔍 Policies for table: ${table}`);
            const res = await client.query(`
                SELECT polname, polcmd, pg_get_expr(polqual, polrelid) as qual, pg_get_expr(polwithcheck, polrelid) as with_check 
                FROM pg_policy 
                JOIN pg_class ON pg_policy.polrelid = pg_class.oid 
                WHERE pg_class.relname = $1
            `, [table]);

            if (res.rows.length === 0) {
                console.log('   (No policies found)');
            } else {
                res.rows.forEach(r => {
                    console.log(`   - Policy: ${r.polname}`);
                    console.log(`     Command: ${r.polcmd}`);
                    console.log(`     Using: ${r.qual}`);
                    console.log(`     With Check: ${r.with_check}`);
                });
            }
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await client.end();
    }
}

inspect();
