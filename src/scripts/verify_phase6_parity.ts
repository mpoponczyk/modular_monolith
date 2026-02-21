
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function verifyParity() {
    console.log('Verifying Phase 6 Parity (Direct DB)...');

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

        // 1. Check Apps Inventory
        const resApps = await client.query('SELECT module_id, organization_id FROM public.organization_apps');
        const apps = resApps.rows;
        console.log(`Found ${apps.length} total app instances.`);

        // 2. Check Standard Sections
        const resSec = await client.query("SELECT name FROM public.organization_section_translations WHERE language_code = 'en'");
        const sections = resSec.rows;

        const uniqueSections = Array.from(new Set(sections.map((s: any) => s.name)));
        console.log('Unique Sections found:', uniqueSections);

        // 3. Strict Parity Check
        const legacyMapping = [
            'ferry-booking/ferries', 'ferry-booking/routes', 'ferry-booking/trips', 'ferry-booking/reservations',
            'ferry-booking/orders', 'ferry-booking/invoices', 'ferry-booking/services',
            'ferry-planning/gantt', 'ferry-planning/calendar', 'ferry-planning/templates',
            'ferry-reporting/manifests', 'crm/partners', 'ferry-reporting/sales', 'ferry-pricing/profiles',
            'core-admin/users', 'core-admin/roles', 'core-admin/sessions', 'core-admin/settings',
            'core-admin/cockpits', 'core-admin/planning'
        ];

        console.log('Verifying presence of ALL 20 Legacy Apps in DB...');
        const missingApps: string[] = [];
        const uniqueDbModules = new Set(apps.map((a: any) => a.module_id));

        for (const legacyId of legacyMapping) {
            if (!uniqueDbModules.has(legacyId)) {
                missingApps.push(legacyId);
            }
        }

        if (missingApps.length > 0) {
            console.error('FAIL: Missing Tiles in DB:', missingApps);
            process.exit(1);
        }

        console.log('SUCCESS: All 20 Legacy Tiles are present in the Database.');
        console.log('Verification Complete.');

    } catch (e) {
        console.error('Verification Failed:', e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

verifyParity();
