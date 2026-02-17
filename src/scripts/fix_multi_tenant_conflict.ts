
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fix() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        const conflictingSlug = 'demo-tenant';
        const emails = ['section-admin@example.com', 'section-member@example.com'];

        console.log(`🔎 Looking up Conflicting Tenant: ${conflictingSlug}`);
        const resTenant = await client.query('SELECT id FROM tenants WHERE slug = $1', [conflictingSlug]);
        if (resTenant.rows.length === 0) {
            console.log('ℹ️ Conflicting tenant not found, nothing to remove.');
            return;
        }
        const tenantId = resTenant.rows[0].id;

        for (const email of emails) {
            console.log(`🔎 Looking up User: ${email}`);
            const resUser = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
            if (resUser.rows.length === 0) {
                console.log(`⚠️ User ${email} not found!`);
                continue;
            }
            const userId = resUser.rows[0].id;

            console.log(`🛠 Removing ${email} from ${conflictingSlug}...`);
            await client.query('DELETE FROM tenant_users WHERE tenant_id = $1 AND user_id = $2', [tenantId, userId]);
            console.log(`✅ Removed ${email} from ${conflictingSlug}.`);
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await client.end();
    }
}

fix();
