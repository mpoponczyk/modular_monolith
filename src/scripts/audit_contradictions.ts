
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function auditContradictions() {
    console.log('--- STRICT AUDIT START ---');

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

        // 1. Get DB Apps (Raw List)
        const resApps = await client.query('SELECT DISTINCT module_id FROM public.organization_apps ORDER BY module_id');
        const dbModules = resApps.rows.map(r => r.module_id);

        console.log(`DB_MODULES_COUNT: ${dbModules.length}`);
        console.log('DB_MODULES_LIST:');
        dbModules.forEach(m => console.log(`- ${m}`));

        console.log('---');

        // 2. Section Integrity
        const resSections = await client.query(`
            SELECT 
                s.id as section_id,
                ost.name as section_name,
                oa.module_id,
                oa.is_active,
                osi.is_enabled
            FROM public.organization_section_items osi
            JOIN public.organization_sections s ON osi.section_id = s.id
            JOIN public.organization_apps oa ON osi.organization_app_id = oa.id
            JOIN public.organization_section_translations ost ON s.id = ost.section_id
            WHERE ost.language_code = 'en'
            ORDER BY s.order_index, osi.order_index
        `);

        console.log('SECTION_MAPPING:');
        const sectionMap = new Map<string, string[]>();
        resSections.rows.forEach(r => {
            if (!sectionMap.has(r.section_name)) sectionMap.set(r.section_name, []);
            sectionMap.get(r.section_name)?.push(`${r.module_id} (Active: ${r.is_active}, Enabled: ${r.is_enabled})`);
        });

        sectionMap.forEach((mods, name) => {
            console.log(`SECTION [${name}]:`);
            mods.forEach(m => console.log(`  > ${m}`));
        });

    } catch (e) {
        console.error('Audit Failed:', e);
    } finally {
        await client.end();
        console.log('--- STRICT AUDIT END ---');
    }
}

auditContradictions();
