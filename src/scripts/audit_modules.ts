import * as fs from 'fs';
import * as path from 'path';

const MODULES_DIR = path.join(process.cwd(), 'src/modules');

const EXPECTED_MODULES = [
    'core-admin-cockpits', 'core-admin-planning', 'core-admin-roles', 'core-admin-sessions',
    'core-admin-settings', 'core-admin-users', 'crm-customers', 'crm-partners', 'example-dashboard',
    'ferry-booking-ferries', 'ferry-booking-invoices', 'ferry-booking-orders', 'ferry-booking-reservations',
    'ferry-booking-routes', 'ferry-booking-services', 'ferry-booking-trips', 'ferry-planning-calendar',
    'ferry-planning-gantt', 'ferry-planning-templates', 'ferry-pricing-profiles', 'ferry-pricing-routes',
    'ferry-reporting-manifests', 'ferry-reporting-sales'
];

interface AuditResult {
    moduleName: string;
    appId: string;
    structure: 'PASS' | 'FAIL' | 'PARTIAL';
    content: 'PASS' | 'FAIL' | 'PARTIAL';
    sql: 'PASS' | 'FAIL' | 'PARTIAL' | 'N/A';
    translations: 'PASS' | 'FAIL' | 'PARTIAL' | 'N/A';
    routing: 'PASS' | 'FAIL' | 'PARTIAL';
    security: 'PASS' | 'FAIL' | 'PARTIAL' | 'N/A';
    missingItems: string[];
    defects: string[];
}

function auditModule(moduleName: string): AuditResult {
    const modDir = path.join(MODULES_DIR, moduleName);
    const result: AuditResult = {
        moduleName,
        appId: moduleName,
        structure: 'PASS',
        content: 'PASS',
        sql: 'PASS',
        translations: 'PASS',
        routing: 'PASS',
        security: 'PASS',
        missingItems: [],
        defects: []
    };

    if (!fs.existsSync(modDir)) {
        result.structure = 'FAIL';
        result.defects.push('Module directory does not exist');
        return result;
    }

    // A) Structure Check
    const requiredFiles = ['index.ts', 'README.md', 'DELETE_README.md'];
    const requiredDirs = ['ui', 'application', 'infrastructure', 'domain', 'sql', 'translations'];

    for (const f of requiredFiles) {
        if (!fs.existsSync(path.join(modDir, f))) {
            result.structure = 'PARTIAL';
            result.missingItems.push(`File: ${f}`);
        }
    }

    // Check if Dirs exist. If they don't, check README for justification
    const readmePath = path.join(modDir, 'README.md');
    let readmeContent = '';
    if (fs.existsSync(readmePath)) readmeContent = fs.readFileSync(readmePath, 'utf8');

    for (const d of requiredDirs) {
        if (!fs.existsSync(path.join(modDir, d))) {
            if (!readmeContent.includes(d) && !readmeContent.toLowerCase().includes('n/a')) {
                result.structure = 'PARTIAL';
                result.missingItems.push(`Dir: ${d}`);
            }
        }
    }
    if (result.missingItems.length > 3) result.structure = 'FAIL';

    // B) Content Check
    // index.ts
    const idxPath = path.join(modDir, 'index.ts');
    if (fs.existsSync(idxPath)) {
        const idxContent = fs.readFileSync(idxPath, 'utf8');
        if (!idxContent.includes('ModuleDefinition')) result.defects.push('index.ts: missing ModuleDefinition');
        if (!idxContent.includes('routes:') || idxContent.includes('routes: []')) result.defects.push('index.ts: empty or missing routes array');
    }

    // DELETE_README.md
    const delPath = path.join(modDir, 'DELETE_README.md');
    if (fs.existsSync(delPath)) {
        const delContent = fs.readFileSync(delPath, 'utf8');
        if (!delContent.includes('code') || !delContent.includes('delete') || delContent.length < 50) {
            result.content = 'PARTIAL';
            result.defects.push('DELETE_README.md appears incomplete or template-like');
        }
    }

    // README.md completeness
    const requiredReadmeSections = ['Purpose', 'routes', 'Permissions', 'Data model', 'RLS', 'UI parity', 'verify', 'risks'];
    for (const section of requiredReadmeSections) {
        if (!readmeContent.toLowerCase().includes(section.toLowerCase())) {
            result.content = 'PARTIAL';
            result.defects.push(`README.md missing section covering: ${section}`);
        }
    }

    // UI Content
    const uiDir = path.join(modDir, 'ui');
    if (fs.existsSync(uiDir)) {
        const uiFiles = fs.readdirSync(uiDir).filter(f => f.endsWith('.tsx'));
        if (uiFiles.length === 0) {
            result.defects.push('ui: No .tsx files found');
            result.content = 'PARTIAL';
        } else {
            // Very basic check against "query DB directly" in page
            for (const uf of uiFiles) {
                const ufc = fs.readFileSync(path.join(uiDir, uf), 'utf8');
                if (ufc.includes('createClient') || (ufc.includes('.from("') || ufc.includes(".from('") || ufc.includes(".from(`"))) {
                    result.defects.push(`ui/${uf} seems to query DB directly`);
                    result.content = 'FAIL';
                }
            }
        }
    }

    // Actions
    let hasActions = false;
    const actionsPath = path.join(modDir, 'application', 'actions.ts');
    if (fs.existsSync(actionsPath)) {
        hasActions = true;
        const ac = fs.readFileSync(actionsPath, 'utf8');
        if (!ac.includes('verifyTenantAccess') && !ac.includes('verifyActionPermission')) {
            result.security = 'PARTIAL';
            result.defects.push('application/actions.ts: missing verifyTenantAccess / verifyActionPermission');
        }
    }

    // Infra
    const infraDir = path.join(modDir, 'infrastructure');
    if (fs.existsSync(infraDir)) {
        const infraFiles = fs.readdirSync(infraDir).filter(f => f.endsWith('.ts'));
        for (const inf of infraFiles) {
            const inc = fs.readFileSync(path.join(infraDir, inf), 'utf8');
            if (inc.includes('createBrowserClient')) {
                result.security = 'FAIL';
                result.defects.push(`infrastructure/${inf}: Uses createBrowserClient`);
            }
            if (inc.includes('DATABASE_URL')) {
                result.security = 'FAIL';
                result.defects.push(`infrastructure/${inf}: Uses raw DATABASE_URL bypassing RLS`);
            }
            if (!inc.includes('tenant_id') && !inc.includes('tenantSlug')) {
                result.defects.push(`infrastructure/${inf}: Might not filter tenant_id (check manually)`);
            }
        }
    }

    // SQL
    const sqlDir = path.join(modDir, 'sql');
    if (fs.existsSync(sqlDir)) {
        const sqlFiles = ['schema.sql', 'policies.sql', 'rpc.sql', 'indexes.sql'];
        for (const sf of sqlFiles) {
            const sp = path.join(sqlDir, sf);
            if (fs.existsSync(sp)) {
                const sc = fs.readFileSync(sp, 'utf8');
                if (sf === 'policies.sql' && !sc.includes('ENABLE ROW LEVEL SECURITY')) {
                    result.sql = 'PARTIAL';
                    result.defects.push(`sql/policies.sql: RLS not strictly enforced in file`);
                }
                if (sf === 'rpc.sql' && sc.length > 50 && !sc.includes('SECURITY DEFINER')) {
                    result.sql = 'PARTIAL';
                    result.defects.push(`sql/rpc.sql: Missing SECURITY DEFINER`);
                }
                if (sf === 'rpc.sql' && sc.length > 50 && (!sc.includes('REVOKE ALL') || !sc.includes('GRANT EXECUTE'))) {
                    result.sql = 'PARTIAL';
                    result.defects.push(`sql/rpc.sql: Missing REVOKE ALL / GRANT EXECUTE`);
                }
            }
        }
    } else {
        if (!readmeContent.includes('sql') && !readmeContent.toLowerCase().includes('n/a')) {
            result.sql = 'PARTIAL';
            result.defects.push('sql dir missing without justification');
        } else {
            result.sql = 'N/A';
        }
    }

    // Translations
    const transDir = path.join(modDir, 'translations');
    if (!fs.existsSync(transDir)) {
        if (!readmeContent.includes('translations') && !readmeContent.toLowerCase().includes('n/a')) {
            result.translations = 'PARTIAL';
            result.defects.push('translations dir missing without justification');
        } else {
            result.translations = 'N/A';
        }
    }

    // Cross imports check
    // Recursively check all .ts, .tsx files
    function checkCrossImports(dir: string) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const f of files) {
            const p = path.join(dir, f.name);
            if (f.isDirectory()) {
                checkCrossImports(p);
            } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
                const c = fs.readFileSync(p, 'utf8');
                if (c.includes('@/modules/') || c.includes('../modules/')) {
                    // Filter allowed imports (e.g. core) if any, or just flag
                    const matches = c.match(/@\/modules\/[a-zA-Z0-9_-]+/g) || [];
                    for (const m of matches) {
                        const importedMod = m.replace('@/modules/', '');
                        if (importedMod !== moduleName && !importedMod.startsWith('core-')) {
                            // result.defects.push(`Cross-import in ${p}: ${m}`);
                            // We will flag it, but let's be lenient for certain shared domains if documented, but strictly:
                            result.defects.push(`Cross-module import: ${m} in ${f.name}`);
                        }
                    }
                }
            }
        }
    }
    checkCrossImports(modDir);

    if (result.defects.length > 0 && result.content === 'PASS') result.content = 'PARTIAL';

    return result;
}

const allResults = EXPECTED_MODULES.map(auditModule);
fs.writeFileSync('audit_results.json', JSON.stringify(allResults, null, 2));

console.log("Audit script completed. Results written to audit_results.json");
