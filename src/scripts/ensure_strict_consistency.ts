
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { moduleRegistry } from '../core/moduleRegistry';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Defined Exclusions
const WRAPPER_MODULES = new Set([
    'core-admin',
    'crm',
    'ferry-booking',
    'ferry-planning',
    'ferry-pricing',
    'ferry-reporting',
    'dashboard'
]);

const TEST_ARTIFACTS = new Set([
    'module-a',
    'module-b',
    'module-c'
]);

const LEGACY_MAP: Record<string, string> = {
    'users': 'core-admin/users',
    'roles': 'core-admin/roles',
    'settings': 'core-admin/settings'
};

async function ensureConsistency() {
    console.log('--- STRICT CONSISTENCY AUDIT (V3) ---');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 0. Get Context (Tenant + Org)
        const ctxRes = await client.query('SELECT tenant_id, organization_id FROM public.organization_apps WHERE organization_id IS NOT NULL AND is_active = true LIMIT 1');
        if (ctxRes.rows.length === 0) {
            throw new Error('CRITICAL: No active app found with valid organization_id to use as template.');
        }
        const { tenant_id, organization_id } = ctxRes.rows[0];
        console.log(`CONTEXT: Tenant=${tenant_id} | Org=${organization_id}`);

        // 1. Build Set A (Registry Apps)
        const registryModules = moduleRegistry.getModules();
        const setA = new Set<string>();
        registryModules.forEach(m => {
            if (!WRAPPER_MODULES.has(m.id)) setA.add(m.id);
        });
        console.log(`SET A (Registry): ${setA.size} items`);

        // 2. Build Set B (DB Active Apps)
        // We perform the iterative fix loop
        let attempts = 0;
        let success = false;

        while (attempts < 3 && !success) {
            attempts++;
            console.log(`\n--- ITERATION ${attempts} ---`);

            const res = await client.query('SELECT id, module_id, is_active FROM public.organization_apps WHERE is_active = true AND tenant_id = $1', [tenant_id]);

            const setB = new Set<string>();
            const dbMap = new Map<string, string>(); // mid -> id

            res.rows.forEach(r => {
                const mid = r.module_id;
                dbMap.set(mid, r.id);
                if (!WRAPPER_MODULES.has(mid) && !TEST_ARTIFACTS.has(mid)) {
                    setB.add(mid);
                }
            });

            const aMinusB = Array.from(setA).filter(x => !setB.has(x));
            const bMinusA = Array.from(setB).filter(x => !setA.has(x));

            console.log(`A - B: ${aMinusB.length} items`, aMinusB);
            console.log(`B - A: ${bMinusA.length} items`, bMinusA);

            if (aMinusB.length === 0 && bMinusA.length === 0) {
                success = true;
                break;
            }

            // FIXES
            let actionTaken = false;

            // B - A: Legacy / Ghosts
            for (const ghostId of bMinusA) {
                if (LEGACY_MAP[ghostId]) {
                    const targetId = LEGACY_MAP[ghostId];
                    console.log(`> Handling Legacy '${ghostId}' -> '${targetId}'`);

                    if (setB.has(targetId)) {
                        // Target already active. Deactivate ghost.
                        console.log(`  FIX: Deactivating redundant legacy '${ghostId}'`);
                        await client.query('UPDATE public.organization_apps SET is_active = false WHERE module_id = $1 AND tenant_id = $2', [ghostId, tenant_id]);
                    } else {
                        // Target missing. Rename/Merge.
                        // Check if target exists but inactive?
                        const checkTarget = await client.query('SELECT id FROM public.organization_apps WHERE module_id = $1 AND tenant_id = $2', [targetId, tenant_id]);
                        if (checkTarget.rows.length > 0) {
                            console.log(`  FIX: Activating target '${targetId}' and deactivating ghost '${ghostId}'`);
                            await client.query('UPDATE public.organization_apps SET is_active = true WHERE module_id = $1 AND tenant_id = $2', [targetId, tenant_id]);
                            await client.query('UPDATE public.organization_apps SET is_active = false WHERE module_id = $1 AND tenant_id = $2', [ghostId, tenant_id]);
                        } else {
                            console.log(`  FIX: Renaming '${ghostId}' to '${targetId}'`);
                            await client.query('UPDATE public.organization_apps SET module_id = $1 WHERE module_id = $2 AND tenant_id = $3', [targetId, ghostId, tenant_id]);
                        }
                    }
                    actionTaken = true;
                } else {
                    console.log(`> Disable Ghost '${ghostId}'`);
                    await client.query('UPDATE public.organization_apps SET is_active = false WHERE module_id = $1 AND tenant_id = $2', [ghostId, tenant_id]);
                    actionTaken = true;
                }
            }

            // A - B: Missing
            for (const missingId of aMinusB) {
                console.log(`> Inserting Missing '${missingId}'`);
                // Check if exists inactive
                const check = await client.query('SELECT id FROM public.organization_apps WHERE module_id = $1 AND tenant_id = $2', [missingId, tenant_id]);
                if (check.rows.length > 0) {
                    await client.query('UPDATE public.organization_apps SET is_active = true WHERE id = $1', [check.rows[0].id]);
                } else {
                    await client.query(
                        'INSERT INTO public.organization_apps (tenant_id, organization_id, module_id, is_active) VALUES ($1, $2, $3, true)',
                        [tenant_id, organization_id, missingId]
                    );
                }
                actionTaken = true;
            }

            if (!actionTaken && !success) {
                console.warn('WARNING: Mismatch exists but no actions taken?');
                break;
            }
        }

        // REPORT
        console.log('\n--- FINAL REPORT ---');
        // Final Fetch
        const resFinal = await client.query('SELECT module_id FROM public.organization_apps WHERE is_active = true AND tenant_id = $1 ORDER BY module_id', [tenant_id]);
        const finalDb = new Set<string>();
        resFinal.rows.forEach(r => {
            if (!WRAPPER_MODULES.has(r.module_id) && !TEST_ARTIFACTS.has(r.module_id)) {
                finalDb.add(r.module_id);
            }
        });

        const finalA = Array.from(setA).sort();
        const finalB = Array.from(finalDb).sort();

        console.log('FINAL SET A (Registry):');
        finalA.forEach(x => console.log(x));
        console.log('\nFINAL SET B (Database):');
        finalB.forEach(x => console.log(x));

        const finalAMinusB = finalA.filter(x => !finalDb.has(x));
        const finalBMinusA = Array.from(finalDb).filter(x => !setA.has(x));

        if (finalAMinusB.length === 0 && finalBMinusA.length === 0) {
            console.log('\n✅ SUCCESS: A_minus_B = {} AND B_minus_A = {}');
        } else {
            console.log('\n❌ FAILURE: Inconsistencies Remain');
            console.log('A - B:', finalAMinusB);
            console.log('B - A:', finalBMinusA);
        }

    } catch (e) {
        console.error('Audit Failed:', e);
    } finally {
        await client.end();
    }
}

ensureConsistency();
