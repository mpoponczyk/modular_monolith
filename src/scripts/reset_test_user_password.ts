
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetPassword() {
    const email = 'mateusz.poponczyk@gmail.com';
    const newPassword = 'password123';

    console.log(`🔄 Attempting to reset password for ${email}...`);

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('❌ Failed to list users:', listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error(`❌ User ${email} not found in auth.users!`);
        console.log('Available users:', users.map(u => u.email).join(', '));
        return;
    }

    const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    );

    if (error) {
        console.error('❌ Failed to update password:', error);
    } else {
        console.log(`✅ Password successfully reset for ${email}`);
        console.log(`🔑 New Password: ${newPassword}`);
        console.log(`🆔 User ID: ${user.id}`);
        // Auto-confirm the email if not confirmed
        if (!user.email_confirmed_at) {
            const { error: confirmError } = await supabase.auth.admin.updateUserById(
                user.id,
                { email_confirm: true }
            );
            if (confirmError) console.error('⚠️ Failed to auto-confirm email:', confirmError);
            else console.log('✅ Email manually confirmed.');
        }
    }
}

resetPassword();
