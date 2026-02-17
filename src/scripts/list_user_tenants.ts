
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

async function check() {
    const email = 'mateusz.poponczyk@gmail.com';
    console.log(`Checking tenants for ${email}...`);

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found!');
        return;
    }

    const { data: links, error } = await supabase
        .from('tenant_users')
        .select(`
            tenant_id,
            tenants (
                id,
                name,
                slug,
                status
            )
        `)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching links:', error);
        return;
    }

    console.log(`Found ${links.length} tenant links:`);
    links.forEach((l: any) => {
        console.log(`- [${l.tenants.status}] ${l.tenants.name} (${l.tenants.slug}) ID: ${l.tenants.id}`);
    });
}

check();
