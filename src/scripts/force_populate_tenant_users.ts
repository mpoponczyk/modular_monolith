
import { Client } from 'pg';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: '.env.local' });

async function fix() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    console.log('🔌 Connecting to DB...');
    await client.connect();
    console.log('✅ Connected.');

    try {
        const emails = ['section-admin@example.com', 'section-member@example.com'];
        const slug = 'test-section-editor';

        console.log(`🔎 Looking up Tenant: ${slug}`);
        const resTenant = await client.query('SELECT id FROM tenants WHERE slug = $1', [slug]);
        if (resTenant.rows.length === 0) {
            throw new Error(`Tenant ${slug} not found!`);
        }
        const tenantId = resTenant.rows[0].id;
        console.log(`✅ Tenant Found: ${tenantId}`);

        for (const email of emails) {
            console.log(`🔎 Looking up User: ${email}`);
            // Auth users are in auth.users schema
            const resUser = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);

            if (resUser.rows.length === 0) {
                console.error(`❌ User ${email} NOT FOUND in auth.users!`);
                continue;
            }

            const userId = resUser.rows[0].id;
            console.log(`✅ User Found: ${userId}`);

            console.log(`🛠 Inserting into tenant_users...`);
            await client.query(`
                INSERT INTO public.tenant_users (tenant_id, user_id)
                VALUES ($1, $2)
                ON CONFLICT (tenant_id, user_id) DO NOTHING
            `, [tenantId, userId]);
            console.log(`✅ Inserted/Verified ${email} in tenant_users`);
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await client.end();
    }
}

fix();
