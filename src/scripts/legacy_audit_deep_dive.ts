
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Manually extract registry IDs to avoid compilation issues with complex module imports in a script
const registryPath = path.resolve(__dirname, '../core/moduleRegistry.ts');
const registryContent = fs.readFileSync(registryPath, 'utf8');
const registryMatches = registryContent.matchAll(/id:\s*['"]([^'"]+)['"]/g);
const registryIds = Array.from(registryMatches).map(m => m[1]).sort();

async function audit() {
    console.log('--- START RAW OUTPUT ---');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. DB List
        const resApps = await client.query('SELECT DISTINCT module_id FROM public.organization_apps ORDER BY module_id');
        const dbIds = resApps.rows.map(r => r.module_id).sort();

        // 2. Lists
        console.log('1. LISTS');
        console.log('Registry (A):');
        registryIds.forEach(id => console.log(`  ${id}`));
        console.log('\nDatabase (B):');
        dbIds.forEach(id => console.log(`  ${id}`));

        // 3. Diffs
        console.log('\n2. DIFFS');
        const aMinusB = registryIds.filter(x => !dbIds.includes(x));
        const bMinusA = dbIds.filter(x => !registryIds.includes(x));

        console.log('A minus B (In Registry, Not in DB):');
        aMinusB.forEach(id => console.log(`  ${id}`));

        console.log('B minus A (In DB, Not in Registry):');
        bMinusA.forEach(id => console.log(`  ${id}`));

        // 4. Module A/B/C Check
        console.log('\n3. GHOST ARTIFACT CHECK (module-a, module-b, module-c)');
        const ghosts = ['module-a', 'module-b', 'module-c'];

        for (const mid of ghosts) {
            const res = await client.query(`
                SELECT oa.is_active, oa.tenant_id, COUNT(osi.id) as section_count
                FROM public.organization_apps oa
                LEFT JOIN public.organization_section_items osi ON oa.id = osi.organization_app_id
                WHERE oa.module_id = $1
                GROUP BY oa.id, oa.is_active, oa.tenant_id
            `, [mid]);

            if (res.rows.length === 0) {
                console.log(`[${mid}] NOT FOUND in DB`);
            } else {
                res.rows.forEach(r => {
                    console.log(`[${mid}] Tenant: ${r.tenant_id} | Active: ${r.is_active} | Sections: ${r.section_count}`);
                });
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
        console.log('--- END RAW OUTPUT ---');
    }
}

audit();
