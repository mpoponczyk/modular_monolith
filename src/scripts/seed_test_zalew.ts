import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is not set.");
    process.exit(1);
}

async function seedTenant() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log("🌱 Seeding 'test-zalew' tenant...");

        const res = await client.query(`
            INSERT INTO public.tenants (name, slug, status)
            VALUES ('Test Zalew', 'test-zalew', 'active')
            ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
        `);

        console.log(`✅ Tenant 'test-zalew' created/updated. ID: ${res.rows[0].id}`);

    } catch (e) {
        console.error("❌ Error seeding tenant:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

seedTenant();
