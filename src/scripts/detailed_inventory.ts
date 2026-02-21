
import fs from 'fs';
import path from 'path';
import { moduleRegistry } from '../core/moduleRegistry';

const SOURCE_BASE = 'src/app/(admin)/admin/t/[tenantSlug]/apps';
const TARGET_BASE = 'src/modules';

function analyzeFile(filePath: string): { exists: boolean; size: number; hasUI: boolean; hasActions: boolean } {
    if (!fs.existsSync(filePath)) {
        return { exists: false, size: 0, hasUI: false, hasActions: false };
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return {
        exists: true,
        size: content.length,
        hasUI: content.includes('return') && (content.includes('div') || content.includes('Fragment') || content.includes('<')),
        hasActions: content.includes('server-auth') || content.includes('revalidatePath') || content.includes('createAuthClient'),
    };
}

function analyzeDirectory(dirPath: string): { exists: boolean; hasRepos: boolean; hasUI: boolean; hasActions: boolean } {
    if (!fs.existsSync(dirPath)) {
        return { exists: false, hasRepos: false, hasUI: false, hasActions: false };
    }

    let hasRepos = false;
    let hasUI = false;
    let hasActions = false;

    function scan(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                scan(fullPath);
            } else {
                const content = fs.readFileSync(fullPath, 'utf-8');
                if (file.includes('repository') || file.includes('Repository')) hasRepos = true;
                if (content.includes('return') && (content.includes('div') || content.includes('<'))) hasUI = true;
                if (content.includes('server-auth') || content.includes('createAuthClient')) hasActions = true;
            }
        }
    }
    scan(dirPath);
    return { exists: true, hasRepos, hasUI, hasActions };
}

async function inventory() {
    console.log("Starting Detailed App Inventory...");

    const modules = moduleRegistry.getModules();

    console.log("| App ID | Source (A) | Target (B) | Divergence | UI Loc | Actions Loc | Repos Loc | Truth |");
    console.log("|---|---|---|---|---|---|---|---|");

    for (const mod of modules) {
        const appId = mod.id;

        // A) Source: src/app/.../apps/<appId>
        const sourceDir = path.join(process.cwd(), SOURCE_BASE, appId);
        const sourcePage = path.join(sourceDir, 'page.tsx');
        const sourceAnalysis = analyzeFile(sourcePage);
        const sourceDirAnalysis = analyzeDirectory(sourceDir);

        // B) Target: src/modules/<module>/<app>
        let targetDir = '';
        if (appId.includes('/')) {
            const [modName, appName] = appId.split('/');
            targetDir = path.join(process.cwd(), TARGET_BASE, modName, appName);
        } else {
            targetDir = path.join(process.cwd(), TARGET_BASE, appId);
        }
        const targetAnalysis = analyzeDirectory(targetDir);

        // Comparison
        const sourceExists = sourceAnalysis.exists ? 'YES' : 'NO';
        const targetExists = targetAnalysis.exists ? 'YES' : 'NO';

        let divergence = 'N/A';
        if (sourceExists === 'YES' && targetExists === 'YES') {
            divergence = 'YES'; // Assume divergence if both exist, will need manual check or smarter diff
        } else {
            divergence = 'NO';
        }

        // Feature Location
        const uiLoc = sourceAnalysis.hasUI ? 'A' : (targetAnalysis.hasUI ? 'B' : 'NONE');
        const actionLoc = sourceDirAnalysis.hasActions ? 'A' : (targetAnalysis.hasActions ? 'B' : 'NONE');
        const repoLoc = targetAnalysis.hasRepos ? 'B' : 'NONE'; // Repos should only be in B

        // Source of Truth
        let truth = 'UNKNOWN';
        if (targetExists === 'YES' && sourceExists === 'NO') truth = 'B (Target)';
        else if (targetExists === 'NO' && sourceExists === 'YES') truth = 'A (Source)';
        else if (targetExists === 'YES' && sourceExists === 'YES') {
            // Heuristic: If B has Repos/Actions, it's likely Truth. If A has UI, it's likely "Pages".
            // Strict Architecture: B should be truth for Logic/Components, A for Routing.
            // But right now A likely contains the Page Component.
            truth = 'SPLIT (Merge Req)';
        } else {
            truth = 'MISSING';
        }

        console.log(`| \`${appId}\` | ${sourceExists} | ${targetExists} | ${divergence} | ${uiLoc} | ${actionLoc} | ${repoLoc} | ${truth} |`);
    }
}

inventory();
