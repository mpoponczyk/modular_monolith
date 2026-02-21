
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { moduleRegistry } from '../core/moduleRegistry'; // direct import attempt

dotenv.config({ path: '.env.local' });

const TENANT_ID = '22a83baa-2246-4470-8b3c-f0bf1958aca4'; // Test Tenant

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function audit() {
    await client.connect();

    console.log("Starting Strict App Audit...");

    // 1. Get DB Apps
    const dbAppsRes = await client.query(`
        SELECT id, module_id, is_active 
        FROM organization_apps 
        WHERE tenant_id = $1
    `, [TENANT_ID]);

    const dbApps = dbAppsRes.rows;
    console.log(`Found ${dbApps.length} apps in DB.`);

    // 2. Get Registry Modules
    const registryModules = moduleRegistry.getModules();
    console.log(`Found ${registryModules.length} modules in Registry.`);

    // 3. Audit Each App
    const results = [];

    for (const dbApp of dbApps) {
        const moduleId = dbApp.module_id;
        console.log(`\n--- Auditing: ${moduleId} ---`);

        const report = {
            app: moduleId,
            route: `/admin/t/[tenant]/${moduleId}`, // Standard Admin Route
            physicalFile: '',
            registry: 'MISSING',
            dbEntry: 'PRESENT',
            permissionRequired: 'UNKNOWN',
            permissionPresent: 'UNKNOWN', // Hard to check effectively in this script without user context, skipping for now or assume true if visible
            rlsOk: 'ASSUMED_OK', // RLS is on table, if we see it here, we have access via postgres user. Logic check needed.
            errorType: 'NONE',
            rootCause: 'NONE'
        };

        // Registry Check
        const regMod = registryModules.find(m => m.id === moduleId);
        if (regMod) {
            report.registry = 'PRESENT';
            report.permissionRequired = regMod.permissions?.requiredPermissions ? regMod.permissions.requiredPermissions.join(', ') : 'NONE';
        } else {
            report.errorType = 'REGISTRY_MISMATCH';
            report.rootCause = 'Registry mismatch';
        }

        // Physical File Check
        // Correct path construction: src/app/(admin)/admin/t/[tenantSlug]/apps/[...moduleId]/page.tsx
        // If moduleId has slashes, it maps to folders.
        // e.g. ferry-booking/routes -> src/app/(admin)/admin/t/[tenantSlug]/apps/ferry-booking/routes/page.tsx
        // BUT wait, is it `apps` or direct?
        // Listing showed `apps/ferry-booking/...`.
        // So path is `src/app/(admin)/admin/t/[tenantSlug]/apps/${moduleId}/page.tsx`

        const appPath = path.resolve(process.cwd(), `src/app/(admin)/admin/t/[tenantSlug]/apps/${moduleId}/page.tsx`);
        const relativePath = `src/app/(admin)/admin/t/[tenantSlug]/apps/${moduleId}/page.tsx`;

        if (fs.existsSync(appPath)) {
            report.physicalFile = 'EXISTS';

            // Content Check
            const content = fs.readFileSync(appPath, 'utf-8');
            if (content.includes('export default')) {
                // ok
            } else {
                report.physicalFile = 'EXISTS_NO_DEFAULT_EXPORT';
                report.errorType = 'INVALID_PAGE_COMPONENT';
                report.rootCause = 'Missing export default';
            }

        } else {
            report.physicalFile = 'MISSING';
            report.errorType = '404_NOT_FOUND';
            report.rootCause = 'Missing page.tsx';
        }

        // Final Classification if not already set
        if (report.errorType === 'NONE') {
            if (report.registry === 'MISSING') {
                report.errorType = 'REGISTRY_SYNC_FAIL';
                report.rootCause = 'Database has app, Registry does not';
            }
        }

        results.push(report);

        // Print Report Block
        console.log(`APP: ${report.app}`);
        console.log(`Route: ${report.route}`);
        console.log(`Physical File: ${relativePath} [${report.physicalFile}]`);
        console.log(`Registry: ${report.registry}`);
        console.log(`DB Entry: ${report.dbEntry} (Active: ${dbApp.is_active})`);
        console.log(`Permission Required: ${report.permissionRequired}`);
        console.log(`Error Type: ${report.errorType}`);
        console.log(`ROOT CAUSE: ${report.rootCause}`);
    }

    await client.end();
}

audit();
