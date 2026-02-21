
import fs from 'fs';
import path from 'path';
import { moduleRegistry } from '../core/moduleRegistry';

const SOURCE_BASE = 'src/app/(admin)/admin/t/[tenantSlug]/apps';
const TARGET_BASE = 'src/modules';

async function inventory() {
    console.log("Starting App Inventory...");

    const modules = moduleRegistry.getModules();
    const inventory = [];

    // console.logHeader
    console.log("| App ID | Source (src/app/.../apps) | Target (src/modules/...) | Status |");
    console.log("|---|---|---|---|");

    for (const mod of modules) {
        // App ID: e.g. "ferry-booking/routes" or "core-admin"
        const appId = mod.id;

        // Source Path: src/app/(admin)/admin/t/[tenantSlug]/apps/<appId>/page.tsx
        const sourcePath = path.join(process.cwd(), SOURCE_BASE, appId, 'page.tsx');
        const sourceExists = fs.existsSync(sourcePath);

        // Target Path: src/modules/<module>/<app>/...
        // Need to parse appId to guess target structure.
        // Convention: <module>/<app> or just <module> if simple?
        // Actually, let's look at where the module definition is imported from in registry?
        // We can't runtime check imports easily here without AST.
        // But we can check standard locations.

        let targetPath = '';
        let targetExists = false;

        if (appId.includes('/')) {
            const [modName, appName] = appId.split('/');
            targetPath = path.join(process.cwd(), TARGET_BASE, modName, appName);
            // Check for ui/Page.tsx or similar? Or just directory?
            // "Target exists" usually means the MODULE CODE exists.
            targetExists = fs.existsSync(targetPath);
        } else {
            targetPath = path.join(process.cwd(), TARGET_BASE, appId);
            targetExists = fs.existsSync(targetPath);
        }

        let status = '';
        if (sourceExists && targetExists) status = 'DIVERGED (Check Content)';
        else if (sourceExists && !targetExists) status = 'SOURCE_ONLY (Needs Extraction)';
        else if (!sourceExists && targetExists) status = 'TARGET_ONLY (Router Ready?)';
        else status = 'MISSING_BOTH (Not Implemented)';

        inventory.push({ appId, sourceExists, targetExists, status });

        console.log(`| \`${appId}\` | ${sourceExists ? '✅' : '❌'} | ${targetExists ? '✅' : '❌'} | ${status} |`);
    }
}

inventory();
