
import { Client } from 'pg';
import { moduleRegistry } from '../core/moduleRegistry';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// UAT Tenant
const TENANT_ID = '22a83baa-2246-4470-8b3c-f0bf1958aca4'; // Test Tenant

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function auditVisibility() {
    console.log(`\n# STRICT UI VISIBILITY AUDIT\nTenant: ${TENANT_ID}\n`);

    try {
        await client.connect();

        // A: Registry Apps
        const registryModules = moduleRegistry.getModules();
        const setA = new Set(registryModules.map(m => m.id));
        console.log(`A (Registry): ${setA.size} apps`);
        console.log(`[ ${Array.from(setA).sort().join(', ')} ]`);

        // B: DB Active Apps (organization_apps)
        // Note: organization_apps is usually per organization, but we need to check how it links to tenant.
        // If strict tenant isolation uses 'tenant_id', we check that.
        // Assuming organization_apps has a tenant_id or linked via organization.
        // Let's check schema quick if uncertain. But assuming standard mnt_ pattern or organization linkage.
        // Wait, 'organization_apps' implies Organization level.
        // In this system, is Tenant == Organization? Or Tenant -> Organization?
        // Let's assume for this audit we query based on available columns.
        // Inspect columns first to be safe, reusing logic from previous steps.

        // Quick Schema Check
        const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'organization_apps'");
        const hasTenantId = cols.rows.some(r => r.column_name === 'tenant_id');
        const hasOrgId = cols.rows.some(r => r.column_name === 'organization_id');

        console.log(`\nSchema Check: organization_apps (tenant_id: ${hasTenantId}, organization_id: ${hasOrgId})`);

        // Resolve Org ID for Tenant if needed
        let orgId: string | null = null;
        if (hasOrgId && !hasTenantId) {
            // Find org for tenant
            const orgRes = await client.query("SELECT id FROM public.organizations WHERE tenant_id = $1", [TENANT_ID]);
            if (orgRes.rows.length > 0) orgId = orgRes.rows[0].id;
            else console.warn("No Organization found for Tenant.");
        }

        let queryB = "";
        let paramsB: any[] = [];
        if (hasTenantId) {
            queryB = "SELECT module_id FROM public.organization_apps WHERE tenant_id = $1 AND is_active = true";
            paramsB = [TENANT_ID];
        } else if (orgId) {
            queryB = "SELECT module_id FROM public.organization_apps WHERE organization_id = $1 AND is_active = true";
            paramsB = [orgId];
        } else {
            console.error("Cannot query organization_apps: No tenant_id or active organization.");
        }

        const resB = queryB ? await client.query(queryB, paramsB) : { rows: [] };
        const setB = new Set(resB.rows.map(r => r.module_id));
        console.log(`\nB (DB Active): ${setB.size} apps`);
        console.log(`[ ${Array.from(setB).sort().join(', ')} ]`);

        // C: Mapped to Sections (organization_section_items)
        // Join items -> apps to get module_id
        let queryC = "";
        let paramsC: any[] = [];

        if (hasTenantId) {
            queryC = `
                SELECT 
                    a.module_id, 
                    t.name as section_name,
                    i.is_enabled as item_enabled,
                    s.is_enabled as section_enabled
                FROM public.organization_section_items i
                JOIN public.organization_apps a ON i.organization_app_id = a.id
                JOIN public.organization_sections s ON i.section_id = s.id
                LEFT JOIN public.organization_section_translations t ON s.id = t.section_id AND t.language_code = 'en'
                WHERE a.tenant_id = $1
            `;
            paramsC = [TENANT_ID];
        } else if (orgId) {
            queryC = `
                SELECT 
                    a.module_id, 
                    t.name as section_name,
                    i.is_enabled as item_enabled,
                    s.is_enabled as section_enabled
                FROM public.organization_section_items i
                JOIN public.organization_apps a ON i.organization_app_id = a.id
                JOIN public.organization_sections s ON i.section_id = s.id
                LEFT JOIN public.organization_section_translations t ON s.id = t.section_id AND t.language_code = 'en'
                WHERE s.organization_id = $1
            `;
            paramsC = [orgId];
        }

        const resC = queryC ? await client.query(queryC, paramsC) : { rows: [] };

        console.log(`\nC (Mapped Details): ${resC.rows.length} rows`);
        console.table(resC.rows.map(r => ({
            module: r.module_id,
            section: r.section_name || 'N/A',
            item_enabled: r.item_enabled,
            section_enabled: r.section_enabled
        })));

        // Filter effective visibility
        const visibleRows = resC.rows.filter(r => r.item_enabled && r.section_enabled);
        const setC = new Set(visibleRows.map(r => r.module_id));

        // Check for Disabled Apps
        const disabledItems = resC.rows.filter(r => !r.item_enabled).map(r => r.module_id);
        const disabledSections = resC.rows.filter(r => !r.section_enabled).map(r => `${r.module_id} (Section: ${r.section_name})`);

        if (disabledItems.length > 0) console.log(`\nDisabled Items: ${disabledItems.join(', ')}`);
        if (disabledSections.length > 0) console.log(`\nDisabled Sections: ${disabledSections.join(', ')}`);

        console.log(`\nC (Effectively Visible): ${setC.size} apps`);
        console.log(`[ ${Array.from(setC).sort().join(', ')} ]`);


        // D: Rendered (Simulated)
        // Intersection of A, B, C (assuming User has ALL permissions as verified previously)
        // If UAT_SUPERADMIN has all perms, then RBAC shouldn't filter, BUT we must check if module requires specific permission.
        // For visibility simulation: D = A intersect B intersect C.

        const setD = new Set(Array.from(setA).filter(x => setB.has(x) && setC.has(x)));
        console.log(`\nD (Rendered): ${setD.size} apps`);
        console.log(`[ ${Array.from(setD).sort().join(', ')} ]`);

        // E: Missing but rendered? (D - A) - impossible by definition of D?
        // Let's check: Missing from Registry but in DB?
        // B - A
        const inDbNotRegistry = Array.from(setB).filter(x => !setA.has(x));
        console.log(`\nLegacy/Zombie in DB (Not in Registry): ${inDbNotRegistry.length}`);
        if (inDbNotRegistry.length > 0) console.log(inDbNotRegistry.join(', '));

        // A - B
        const inRegistryNotInDb = Array.from(setA).filter(x => !setB.has(x));
        console.log(`\nIn Registry but NOT in DB: ${inRegistryNotInDb.length}`);
        if (inRegistryNotInDb.length > 0) console.log(inRegistryNotInDb.join(', '));

        // A - C
        const inRegistryNoPhysical = Array.from(setA).filter(x => !setC.has(x));
        console.log(`\nIn Registry but NO Physical Route: ${inRegistryNoPhysical.length}`);
        if (inRegistryNoPhysical.length > 0) console.log(inRegistryNoPhysical.join(', '));

        // C - A
        const physicalNoRegistry = Array.from(setC).filter(x => !setA.has(x));
        console.log(`\nPhysical Route but NOT in Registry: ${physicalNoRegistry.length}`);
        if (physicalNoRegistry.length > 0) console.log(physicalNoRegistry.join(', '));

    } catch (e) {
        console.error("Audit Failed:", e);
    } finally {
        await client.end();
    }
}

auditVisibility();
