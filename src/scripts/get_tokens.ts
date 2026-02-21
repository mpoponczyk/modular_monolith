
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
    console.log('Authenticating...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try standard test user
    const email = 'mateusz.poponczyk@gmail.com';
    const password = 'password'; // Assumption: Test password

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('Login failed:', error.message);
        // Fallback: Use Service Role to sign in as user?
        // Service Role cannot "sign in" usually, but can generate link.
        // Or we can just use the Service Key to impersonate? 
        // Next.js middleware checks for 'sb-auth-token' cookie.
        process.exit(1);
    }

    if (data.session) {
        console.log('Login successful.');
        const { access_token, refresh_token } = data.session;

        // Construct cookie string (approximate format for Supabase SSR)
        // Usually: sb-access-token=...; sb-refresh-token=...
        // But Next.js SSR helper often uses a single base64 blob or specific chunks.
        // Let's print the tokens and we can try to use them or debugging.

        // Actually, clearer to use a headless browser script if complex cookie structure is needed.
        // But let's try just getting the tokens first.
        console.log(`ACCESS_TOKEN=${access_token}`);
        console.log(`REFRESH_TOKEN=${refresh_token}`);
    }
}

main();
