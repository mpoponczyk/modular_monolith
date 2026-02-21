import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log("--- STARTING FORCE LOGOUT EXPERIMENT ---");

    // 1. Log in as a test user (we'll use system.admin@example.com which we know exists from seed)
    console.log("1. Authenticating User A...");
    const { data: authData, error: authErr } = await anonClient.auth.signInWithPassword({
        email: 'system.admin@example.com',
        password: 'password123'
    });

    if (authErr) {
        console.error("Login failed:", authErr.message);
        return;
    }

    const accessToken = authData.session.access_token;
    const sessionId = authData.session.provider_token || authData.session.user.id; // getting the actual session ID can be tricky on client, let's fetch it via admin

    console.log("-> Success. Acquired Access Token (JWT).");

    // Fetch the exact session ID from DB for this user to delete
    const { data: sessions, error: sessionErr } = await adminClient
        .from('sessions')
        .select('id')
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

    if (sessionErr) {
        // Since auth.sessions is not accessible by default via simple admin client without schema specifying, let's use RPC or raw query if needed
    }

    // Actually, we can just delete ALL sessions for this user for the test
    console.log("2. Deleting auth.sessions row for User A...");
    const { error: delErr } = await adminClient.rpc('execute_sql', {
        sql_query: `DELETE FROM auth.sessions WHERE user_id = '${authData.user.id}'`
    });

    // Fallback if execute_sql doesn't exist: use the admin auth api to sign out all devices
    if (delErr) {
        console.log("Failed raw delete, using admin.signOut...");
        await adminClient.auth.admin.signOut(authData.user.id, 'global');
    } else {
        console.log("-> Success. Row deleted.");
    }

    // 3. Immediately call getUser() with the still-valid JWT
    console.log("3. Calling getUser() with the captured, technically unexpired JWT...");
    const testClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        },
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: userData, error: userErr } = await testClient.auth.getUser();

    console.log("--- RESULTS ---");
    if (userErr) {
        console.log("getUser() FAILED with error:");
        console.log(userErr.status, userErr.message);
    } else {
        console.log("getUser() SUCCEEDED returning user:");
        console.log(userData.user?.id);
    }
}

main().catch(console.error);
