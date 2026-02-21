
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { moduleRegistry } from '../core/moduleRegistry';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function audit() {
    console.log('--- STRICT RUNTIME AUDIT ---');

    // 1. Get Registry IDs (Runtime)
    const registryModules = moduleRegistry.getModules();
    const registryIds = registryModules.map(m => m.id).sort();

    console.log(`REGISTRY COUNT: ${registryIds.length}`);

    // 2. Get DB IDs
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
        const resApps = await client.query('SELECT DISTINCT module_id FROM public.organization_apps ORDER BY module_id');
        const dbIds = resApps.rows.map(r => r.module_id).sort();

        console.log(`DB COUNT: ${dbIds.length}`);

        // 3. Output Lists
        console.log('\n=== LIST: REGISTRY (A) ===');
        registryIds.forEach(id => console.log(id));

        console.log('\n=== LIST: DATABASE (B) ===');
        dbIds.forEach(id => console.log(id));

        // 4. Diffs
        const aMinusB = registryIds.filter(x => !dbIds.includes(x));
        const bMinusA = dbIds.filter(x => !registryIds.includes(x));

        console.log('\n=== DIFF: A minus B (Missing in DB) ===');
        if (aMinusB.length === 0) console.log('(None)');
        else aMinusB.forEach(id => console.log(id));

        console.log('\n=== DIFF: B minus A (Ghost/Test Apps) ===');
        if (bMinusA.length === 0) console.log('(None)');
        else bMinusA.forEach(id => console.log(id));

        // 5. Check Test Modules
        if (bMinusA.length > 0) {
            console.log('\n=== GHOST CHECK ===');
            for (const mid of bMinusA) {
                const res = await client.query(`
                    SELECT oa.is_active, oa.tenant_id, COUNT(osi.id) as section_count
                    FROM public.organization_apps oa
                    LEFT JOIN public.organization_section_items osi ON oa.id = osi.organization_app_id
                    WHERE oa.module_id = $1
                    GROUP BY oa.id, oa.is_active, oa.tenant_id
                `, [mid]);
                res.rows.forEach(r => {
                    console.log(`[${mid}] Tenant: ${r.tenant_id} | Active: ${r.is_active} | Sections: ${r.section_count}`);
                });
            }
        }

    } catch (e) {
        console.error('Audit Failed:', e);
    } finally {
        await client.end();
        console.log('--- END AUDIT ---');
    }
}

audit();
