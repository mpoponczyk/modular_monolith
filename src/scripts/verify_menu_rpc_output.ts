
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function verify() {
    await client.connect();
    try {
        // 1. Find a valid user for the tenant
        console.log("Finding valid user...");
        const userRes = await client.query(`
            SELECT user_id FROM public.tenant_users 
            WHERE tenant_id = '22a83baa-2246-4470-8b3c-f0bf1958aca4' 
            LIMIT 1
        `);

        if (userRes.rows.length === 0) {
            console.error("No users found for test tenant.");
            return;
        }

        const userId = userRes.rows[0].user_id;
        console.log(`Found User: ${userId}`);

        // 2. Set the JWT claim to impersonate (standard Supabase trick for RLS testing in SQL)
        // Note: auth.uid() reads from request.jwt.claim.sub
        await client.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [userId]);
        // Also need to set role to authenticated?
        await client.query(`SET ROLE authenticated`);

        console.log("Calling resolve_menu_structure...");
        const res = await client.query(`
            SELECT * FROM public.resolve_menu_structure(
                '22a83baa-2246-4470-8b3c-f0bf1958aca4',
                'en'
            )
        `);
        console.log("Result (First Section):");
        if (res.rows.length > 0) {
            console.log(JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log("No menu sections returned.");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

verify();
