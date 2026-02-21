
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function proveIt() {
    console.log('--- RAW EVIDENCE START ---');

    if (!process.env.DATABASE_URL) {
        console.error('Missing DATABASE_URL');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Counts
        const countSec = await client.query('SELECT count(*) FROM public.organization_sections');
        console.log(`count(*) organization_sections: ${countSec.rows[0].count}`);

        const countApps = await client.query('SELECT count(*) FROM public.organization_apps');
        console.log(`count(*) organization_apps: ${countApps.rows[0].count}`);

        const countItems = await client.query('SELECT count(*) FROM public.organization_section_items');
        console.log(`count(*) organization_section_items: ${countItems.rows[0].count}`);

        console.log('---');

        // 2. List module_id per tenant (Active Only)
        const appsRes = await client.query(`
            SELECT tenant_id, module_id 
            FROM public.organization_apps 
            WHERE is_active = true 
            ORDER BY tenant_id
        `);

        console.log('list module_id per tenant (active only):');
        const grouped: Record<string, string[]> = {};
        appsRes.rows.forEach((app: any) => {
            if (!grouped[app.tenant_id]) grouped[app.tenant_id] = [];
            grouped[app.tenant_id].push(app.module_id);
        });

        Object.entries(grouped).forEach(([tid, modules]) => {
            console.log(`Tenant ${tid}:`);
            modules.forEach(m => console.log(`  - ${m}`));
        });

        console.log('---');

        // 3. M:N Proof (Sections with Apps)
        // Manual join logic to match previous attempt, or DB join
        const itemsRes = await client.query(`
            SELECT 
                s.id as section_id,
                ost.name as section_name,
                oa.module_id
            FROM public.organization_section_items osi
            JOIN public.organization_sections s ON osi.section_id = s.id
            JOIN public.organization_apps oa ON osi.organization_app_id = oa.id
            JOIN public.organization_section_translations ost ON s.id = ost.section_id
            WHERE osi.is_enabled = true AND ost.language_code = 'en'
            ORDER BY s.order_index, osi.order_index
        `);

        console.log('list sections with their mapped apps (M:N proof):');
        const sectionMap = new Map<string, string[]>();

        itemsRes.rows.forEach((row: any) => {
            if (!sectionMap.has(row.section_name)) sectionMap.set(row.section_name, []);
            sectionMap.get(row.section_name)?.push(row.module_id);
        });

        sectionMap.forEach((modules, name) => {
            console.log(`Result: Section [${name}] contains:`);
            modules.forEach(m => console.log(`  > ${m}`));
        });

        console.log('--- RAW EVIDENCE END ---');

    } catch (e) {
        console.error('Proof Failed:', e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

proveIt();
