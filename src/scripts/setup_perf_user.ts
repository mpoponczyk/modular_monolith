
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const databaseUrl = process.env.DATABASE_URL!;

if (!supabaseUrl || !supabaseKey || !databaseUrl) {
    console.error('Missing env vars');
    process.exit(1);
}

const pool = new pg.Pool({
    connectionString: databaseUrl,
});

async function main() {
    console.log('🚀 Setting up Performance Test User...');

    // RECOVERY MODE: Use existing user from previous failed run
    const email = 'mateusz.poponczyk+perf1771518349697@gmail.com';
    const password = 'performance_test_password_123!';
    const tenantSlug = 'test-tenant';
    const userId = 'eb364b5b-7a12-438e-b485-6804e4417aa4';

    // 1. Sign Up (SKIPPED - User exists)
    console.log(`1. Skipping Signup (User ${userId} exists)...`);

    // 2. Confirm Email via DB
    console.log('2. Confirming email in DB...');
    const client = await pool.connect();
    try {
        await client.query(`
            UPDATE auth.users
            SET email_confirmed_at = now()
            WHERE id = $1
        `, [userId]);
        console.log('   Email confirmed.');

        // 3. Link to Tenant
        console.log(`3. Linking to tenant: ${tenantSlug}...`);

        // Find Tenant ID
        const tenantRes = await client.query(`SELECT id FROM public.tenants WHERE slug = $1`, [tenantSlug]);
        if (tenantRes.rows.length === 0) {
            console.error(`Tenant ${tenantSlug} not found!`);
            // Fallback to creating it? No, assume it exists or fail.
            // Actually, let's list tenants to be helpful.
            const allTenants = await client.query('SELECT slug FROM public.tenants');
            console.log('Available tenants:', allTenants.rows.map(r => r.slug).join(', '));

            // Try 'demo-tenant' or 'default'?
            // Check if we can find ANY tenant to link to.
            if (allTenants.rows.length > 0) {
                const fallback = allTenants.rows[0].slug;
                console.log(`Fallback to ${fallback}`);
                // Update tenantSlug variable? Logic too complex for script.
                process.exit(1);
            }
            process.exit(1);
        }
        var tenantId = tenantRes.rows[0].id;

        // Find Role
        const roleRes = await client.query(`SELECT id FROM public.roles WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
        let roleId = null;
        if (roleRes.rows.length > 0) {
            roleId = roleRes.rows[0].id;
        } else {
            // Try company_roles
            const companyRoleRes = await client.query(`SELECT id FROM public.company_roles WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
            if (companyRoleRes.rows.length > 0) {
                roleId = companyRoleRes.rows[0].id;
            }
        }

        if (!roleId) {
            console.error('No role found for tenant!');
            process.exit(1);
        }

        // Check if linkage exists
        const existingLink = await client.query(
            `SELECT * FROM public.tenant_users WHERE tenant_id = $1 AND user_id = $2`,
            [tenantId, userId]
        );

        if (existingLink.rows.length === 0) {
            await client.query(`
                INSERT INTO public.tenant_users (tenant_id, user_id, role_id)
                VALUES ($1, $2, $3)
            `, [tenantId, userId, roleId]);
            console.log('   User linked to tenant.');
        } else {
            console.log('   User already linked to tenant.');
        }

    } finally {
        client.release();
    }

    // 4. Login to get Tokens using SSR client to capture precise cookie encoding
    console.log('4. Logging in to get tokens (via SSR wrapper)...');

    let ssrCookies: Record<string, string> = {};
    const { createServerClient } = await import('@supabase/ssr');

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() { return []; },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => {
                    ssrCookies[name] = value;
                });
            }
        }
    });

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('Login Error:', loginError.message);
        process.exit(1);
    }

    const session = loginData.session!;
    console.log('\n✅ FAILURE PROOF TOKENS:');

    // Cookie Helper for Supabase SSR:
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    const cookieName = `sb-${projectRef}-auth-token`;

    // Fallback if setAll wasn't called (it should be on signIn)
    let cookieValue = ssrCookies[cookieName];
    if (!cookieValue) {
        console.warn(`WARNING: ${cookieName} not set by createServerClient during signIn.`);
        // Just find the first sb-* cookie
        const firstKey = Object.keys(ssrCookies).find(k => k.startsWith('sb-'));
        if (firstKey) {
            console.log(`Found alternative cookie name: ${firstKey}`);
            cookieValue = ssrCookies[firstKey];
        }
    }

    console.log(`COOKIE_NAME=${cookieName}`);
    console.log(`COOKIE_VALUE=${cookieValue}`);

    // 5. Generate 2FA Cookie (Bypass Middleware)
    console.log('5. Generating 2FA Cookie...');

    // Minimal implementation of signTwoFaCookie to avoid import issues
    const secret = process.env.TWOFA_COOKIE_SECRET;
    if (!secret) {
        console.error('Missing TWOFA_COOKIE_SECRET');
        process.exit(1);
    }

    const payload = {
        tenantId,
        tenantSlug,
        userId,
        sessionId: session.user.id, // simplified, usually session ID
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
    };

    // Web Crypto in Node
    const { webcrypto } = await import('node:crypto');
    const encoder = new TextEncoder();
    const key = await webcrypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const data = JSON.stringify(payload);
    const signatureBuffer = await webcrypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(data)
    );

    const toBase64Url = (str: string) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const bufferToHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)).map(x => x.toString(16).padStart(2, '0')).join('');

    const token = `${toBase64Url(data)}.${bufferToHex(signatureBuffer)}`;
    console.log(`TWOFA_COOKIE=${token}`);

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
