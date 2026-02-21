import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'; // Fallback for local docker

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log("--- STARTING ABSOLUTE FORCE LOGOUT EXPERIMENT ---");

    const tempEmail = `test.audit.${Date.now()}@example.com`;
    const tempPassword = 'AuditPassword123!';

    console.log(`1. Creating temporary user: ${tempEmail}`);
    const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        email_confirm: true
    });

    if (createErr) {
        console.error("Failed to create temp user:", createErr);
        return;
    }
    const userId = createData.user.id;

    console.log("2. Logging in to acquire Access Token...");
    const { data: authData, error: authErr } = await anonClient.auth.signInWithPassword({
        email: tempEmail,
        password: tempPassword
    });

    if (authErr) {
        console.error("Login failed:", authErr);
        await adminClient.auth.admin.deleteUser(userId);
        return;
    }

    const accessToken = authData.session.access_token;
    console.log("-> Success. Acquired Access Token.");

    console.log("3. Deleting auth.sessions row DIRECTLY via Postgres...");
    const pgClient = new Client({ connectionString: DB_URL });
    try {
        await pgClient.connect();
        const res = await pgClient.query(`DELETE FROM auth.sessions WHERE user_id = $1 RETURNING id`, [userId]);
        console.log(`-> Success. Deleted ${res.rowCount} session rows.`);
    } catch (e) {
        console.error("-> Failed to delete from Postgres:", e);
    } finally {
        await pgClient.end();
    }

    console.log("4. Immediately calling getUser() with the unexpired JWT...");
    const testClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        },
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: userData, error: userErr } = await testClient.auth.getUser();

    console.log("--- EXPERIMENT RESULTS ---");
    if (userErr) {
        console.log("VERDICT: getUser() FAILED synchronously.");
        console.log("Error details:", userErr.status, userErr.message);
    } else {
        console.log("VERDICT: getUser() SUCCEEDED returning user.");
        console.log("User ID:", userData.user?.id);
    }

    console.log("5. Cleaning up temp user...");
    await adminClient.auth.admin.deleteUser(userId);
    console.log("DONE.");
}

main().catch(console.error);
