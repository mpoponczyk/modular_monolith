import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function fixAppIds() {
    console.log("Starting DB Module ID Fix...");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all organization_apps
    const { data: apps, error } = await supabaseAdmin
        .from('organization_apps')
        .select('id, module_id');

    if (error) {
        console.error("Failed to fetch apps:", error);
        return;
    }

    let updatedCount = 0;

    for (const app of apps) {
        if (app.module_id && app.module_id.includes('/')) {
            const newModuleId = app.module_id.replace(/\//g, '-');
            console.log(`Updating ${app.module_id} -> ${newModuleId}`);

            const { error: updateErr } = await supabaseAdmin
                .from('organization_apps')
                .update({ module_id: newModuleId })
                .eq('id', app.id);

            if (updateErr) {
                console.error(`❌ Failed to update ${app.id}:`, updateErr);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`✅ successfully updated ${updatedCount} app definitions.`);
}

fixAppIds().catch(console.error);
