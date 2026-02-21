import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is not set.");
    process.exit(1);
}

async function debugState() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log("📊 Debugging Database State...");

        // 1. Check Tenants
        const resTenants = await client.query(`SELECT * FROM public.tenants`);
        console.log(`\n🏢 Tenants (${resTenants.rowCount}):`);
        resTenants.rows.forEach(r => console.log(`   - ${r.name} (${r.slug}) ID: ${r.id}`));

        // 2. Check Legacy Routes
        const resClntRoutes = await client.query(`SELECT count(*) as count FROM public.clnt_routes`);
        console.log(`\n🕸️  clnt_routes count: ${resClntRoutes.rows[0].count}`);

        // 3. Check MNT Routes
        const resMntRoutes = await client.query(`SELECT count(*) as count FROM public.mnt_routes`);
        console.log(`\n🚢 mnt_routes count: ${resMntRoutes.rows[0].count}`);

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await client.end();
    }
}

debugState();
