
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

async function fix() {
    const email = 'mateusz.poponczyk@gmail.com';
    const tenantSlugToRemove = 'demo-tenant';

    console.log(`Removing ${tenantSlugToRemove} link for ${email}...`);

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found!');
        return;
    }

    // Get Tenant ID to remove
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenantSlugToRemove)
        .single();

    if (!tenant) {
        console.error('Tenant not found');
        return;
    }

    const { error } = await supabase
        .from('tenant_users')
        .delete()
        .eq('user_id', user.id)
        .eq('tenant_id', tenant.id);

    if (error) {
        console.error('Error removing link:', error);
    } else {
        console.log(`✅ Removed link to ${tenantSlugToRemove}`);
    }
}

fix();
