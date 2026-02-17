
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const MAPPINGS = [
    { oldEmail: 'section-admin@example.com', newEmail: 'mateusz.poponczyk@gmail.com', password: 'password123' },
    { oldEmail: 'section-member@example.com', newEmail: 'matix1730@gmail.com', password: 'password123' }
];

async function migrate() {
    console.log('🔄 Migrating Test User Emails...');
    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    for (const { oldEmail, newEmail, password } of MAPPINGS) {
        // 1. Check if New Email exists
        const { data: { users: newUsers } } = await supabase.auth.admin.listUsers();
        const existingNewUser = newUsers.find(u => u.email === newEmail);

        if (existingNewUser) {
            console.log(`✅ User ${newEmail} already exists (${existingNewUser.id}).`);
        } else {
            // 2. Create New User
            console.log(`Creating user ${newEmail}...`);
            const { data, error } = await supabase.auth.admin.createUser({
                email: newEmail,
                password: password,
                email_confirm: true,
                user_metadata: { full_name: newEmail.split('@')[0] }
            });

            if (error) {
                console.error(`❌ Failed to create ${newEmail}:`, error.message);
            } else {
                console.log(`✅ Created ${newEmail} (${data.user.id})`);
            }
        }

        // 3. Delete Old User (Optional, but cleaner for "change" semantic)
        const { data: { users: oldUsers } } = await supabase.auth.admin.listUsers();
        const existingOldUser = oldUsers.find(u => u.email === oldEmail);

        if (existingOldUser) {
            console.log(`🗑 Deleting old user ${oldEmail} (${existingOldUser.id})...`);
            const { error: delError } = await supabase.auth.admin.deleteUser(existingOldUser.id);
            if (delError) console.error('Error deleting old user:', delError);
            else console.log('✅ Deleted old user.');
        }
    }
}

migrate();
