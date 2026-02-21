
import { Client } from 'pg';
import { moduleRegistry } from '../core/moduleRegistry';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TENANT_ID = '22a83baa-2246-4470-8b3c-f0bf1958aca4'; // Test Tenant

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function fixVisibility() {
    console.log(`\n# STRICT UI VISIBILITY FIX\nTenant: ${TENANT_ID}\n`);

    try {
        await client.connect();

        // 1. Get Organization ID
        const orgRes = await client.query("SELECT id FROM public.organizations WHERE tenant_id = $1", [TENANT_ID]);
        if (orgRes.rows.length === 0) throw new Error("No organization found for tenant");
        const orgId = orgRes.rows[0].id;
        console.log(`Organization ID: ${orgId}`);

        // 2. Identify Missing Apps (Registry - DB)
        const appsRes = await client.query("SELECT module_id FROM public.organization_apps WHERE tenant_id = $1", [TENANT_ID]);
        const dbApps = new Set(appsRes.rows.map(r => r.module_id));
        const registryModules = moduleRegistry.getModules();

        const missingApps = registryModules.filter(m => !dbApps.has(m.id));
        console.log(`\nFound ${missingApps.length} apps missing from DB: ${missingApps.map(m => m.id).join(', ')}`);

        // 3. Insert Missing Apps
        for (const m of missingApps) {
            console.log(`Inserting app: ${m.id}`);
            await client.query(`
                INSERT INTO public.organization_apps (tenant_id, organization_id, module_id, is_active)
                VALUES ($1, $2, $3, true)
            `, [TENANT_ID, orgId, m.id]);
        }

        // 4. Ensure Map to Sections
        // We need to know which section each app belongs to.
        // We'll use registry `menuGroup` as a hint, and map to DB Section ID.

        // Fetch Sections
        const secRes = await client.query("SELECT id, name FROM public.organization_sections s LEFT JOIN public.organization_section_translations t ON s.id = t.section_id AND t.language_code = 'en' WHERE s.tenant_id = $1", [TENANT_ID]);
        const sectionMap = new Map<string, string>(); // Name -> ID
        secRes.rows.forEach(r => {
            if (r.name) sectionMap.set(r.name, r.id);
        });

        console.log(`\nExisting Sections: ${Array.from(sectionMap.keys()).join(', ')}`);

        // Default mapping logic if section missing or needs mapping
        // Registry Group -> DB Section Name
        const groupMapping: Record<string, string> = {
            'System': 'System',
            'Business': 'Operations', // Map "Business" to "Operations" ? Or create "Business"?
            'Operations': 'Operations',
            'Sales': 'Sales',
            'Reporting': 'Reporting',
            'Scheduling': 'Scheduling'
        };

        // Re-fetch apps to get IDs
        const allAppsRes = await client.query("SELECT id, module_id FROM public.organization_apps WHERE tenant_id = $1", [TENANT_ID]);
        const appIdMap = new Map<string, string>();
        allAppsRes.rows.forEach(r => appIdMap.set(r.module_id, r.id));

        // Check Mappings
        const itemsRes = await client.query("SELECT organization_app_id FROM public.organization_section_items i JOIN public.organization_sections s ON i.section_id = s.id WHERE s.tenant_id = $1", [TENANT_ID]);
        const mappedAppIds = new Set(itemsRes.rows.map(r => r.organization_app_id));

        const unmappedModules = registryModules.filter(m => {
            const appId = appIdMap.get(m.id);
            return appId && !mappedAppIds.has(appId);
        });

        console.log(`\nFound ${unmappedModules.length} unmapped apps: ${unmappedModules.map(m => m.id).join(', ')}`);

        for (const m of unmappedModules) {
            const appId = appIdMap.get(m.id)!;
            const regGroup = m.layout.menuGroup || 'System';
            const targetSectionName = groupMapping[regGroup] || regGroup;

            let sectionId = sectionMap.get(targetSectionName);
            if (!sectionId) {
                console.log(`Section '${targetSectionName}' not found. Creating...`);
                // Create section logic (simplified for script)
                const newSectionRes = await client.query(`
                    INSERT INTO public.organization_sections (tenant_id, organization_id, is_enabled, order_index)
                    VALUES ($1, $2, true, 99) RETURNING id
                `, [TENANT_ID, orgId]);
                sectionId = newSectionRes.rows[0].id;

                // Insert Item
                await client.query(`
                    INSERT INTO public.organization_section_items (tenant_id, organization_app_id, section_id, order_index, is_enabled)
                    VALUES ($1, $2, $3, 99, true)
                `, [TENANT_ID, orgId, sectionId]);

                if (targetSectionName) {
                    sectionMap.set(targetSectionName as string, sectionId as string);
                }
            }

            console.log(`Mapping ${m.id} to ${targetSectionName}`);
            await client.query(`
                INSERT INTO public.organization_section_items (tenant_id, organization_id, section_id, organization_app_id, order_index, is_enabled)
                VALUES ($1, $2, $3, $4, $5, true)
            `, [TENANT_ID, orgId, sectionId, appId, m.layout.order || 0]);
        }

        console.log("\nFix Complete.");

    } catch (e) {
        console.error("Fix Failed:", e);
    } finally {
        await client.end();
    }
}

fixVisibility();
