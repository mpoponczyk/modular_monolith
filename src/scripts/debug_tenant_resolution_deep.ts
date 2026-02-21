
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const CLIENT_EMAIL = 'mateusz.poponczyk@gmail.com';
const TENANT_ID = '22a83baa-2246-4470-8b3c-f0bf1958aca4';

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function debugTenant() {
    console.log(`\n# DEBUG TENANT RESOLUTION\nUser: ${CLIENT_EMAIL}\nTenant: ${TENANT_ID}\n`);

    try {
        await client.connect();

        // 1. Get User ID
        const userRes = await client.query("SELECT id, email FROM auth.users WHERE email = $1", [CLIENT_EMAIL]);
        if (userRes.rows.length === 0) {
            console.error("User not found!");
            return;
        }
        const userId = userRes.rows[0].id;
        console.log(`User ID: ${userId}`);

        // 2. Get Tenant Details
        const tenantRes = await client.query("SELECT * FROM public.tenants WHERE id = $1", [TENANT_ID]);
        if (tenantRes.rows.length === 0) {
            console.error("Tenant not found!");
            return;
        }
        const tenant = tenantRes.rows[0];
        console.log(`Tenant Slug: ${tenant.slug}`);
        console.log(`Tenant Status: ${tenant.status}`); // If applicable

        // 3. Check Membership
        const memberRes = await client.query("SELECT * FROM public.tenant_users WHERE tenant_id = $1 AND user_id = $2", [TENANT_ID, userId]);
        if (memberRes.rows.length > 0) {
            console.log("✅ User is a member of this tenant.");
        } else {
            console.error("❌ User is NOT a member of this tenant via tenant_users.");
        }

        // 4. Check RLS Policies on 'tenants'
        const policiesRes = await client.query("SELECT * FROM pg_policies WHERE tablename = 'tenants'");
        console.log("\nRLS Policies on 'tenants':");
        console.table(policiesRes.rows.map(r => ({ name: r.policyname, cmd: r.cmd, roles: r.roles })));

    } catch (e) {
        console.error("Debug Failed:", e);
    } finally {
        await client.end();
    }
}

debugTenant();
