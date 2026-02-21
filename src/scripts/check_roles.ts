export { };
const fs = require('fs');
const { Client } = require('pg');

async function run() {
    try {
        const envFile = fs.readFileSync('.env.local', 'utf8');
        const match = envFile.match(/DATABASE_URL=([^\n]+)/) || envFile.match(/SUPABASE_DB_URL=([^\n]+)/);
        if (!match) throw new Error('DB URL not found in .env.local');

        let rawUrl = match[1].replace(/['"]/g, '').trim();
        const client = new Client({ connectionString: rawUrl, ssl: { rejectUnauthorized: false } });
        await client.connect();

        const { rows } = await client.query(`
            SELECT tu.user_id, tu.tenant_id, r.name as role_name 
            FROM public.tenant_users tu 
            JOIN public.roles r ON r.id = tu.role_id
        `);
        console.log('User Roles mapped in DB:', rows);

        await client.end();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
