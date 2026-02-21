import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function insertMissingPerms() {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const missingPerms = [
        'calendar.view',
        'templates.view',
        'gantt.view',
        'profiles.view',
        'pricing_routes.view',
        'customers.view',
        'sales.view',
        'cockpits.view'
    ];

    console.log("Injecting missing permissions to dictionary...");

    // Insert them sequentially to handle constraint violations safely
    for (const p of missingPerms) {
        // Assume schema is { key, description } or { id, key }
        const { error } = await supabaseAdmin
            .from('permissions')
            .upsert({
                key: p,
                description: `Auto-generated permission for ${p}`
            }, { onConflict: 'key' });

        if (error) {
            console.error(`❌ Failed to inject ${p}:`, error.message);
            // It might just be 'name' instead of 'key'. Let's check error message.
            if (error.message.includes("Could not find the 'key' column")) {
                await supabaseAdmin.from('permissions').upsert({ name: p }, { onConflict: 'name' });
            }
        } else {
            console.log(`✅ Upserted ${p}`);
        }
    }

    console.log("Done.");
}

insertMissingPerms().catch(console.error);
