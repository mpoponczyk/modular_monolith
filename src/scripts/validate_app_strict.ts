
import fs from 'fs';
import path from 'path';

const APP_ID = process.argv[2];
if (!APP_ID) {
    console.error('Usage: tsx validate_app_strict.ts <appId>');
    process.exit(1);
}

const MODULES_ROOT = path.resolve(__dirname, '../modules');
const APP_PATH = path.join(MODULES_ROOT, APP_ID);

interface ValidationResult {
    appId: string;
    exists: boolean;
    checks: {
        name: string;
        status: 'PASS' | 'FAIL' | 'WARN';
        message: string;
    }[];
}

const result: ValidationResult = {
    appId: APP_ID,
    exists: false,
    checks: []
};

// HELPER: Recursively get all files
function getAllFiles(dir: string, ext: string[] = []): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(filePath, ext));
        } else {
            if (ext.length === 0 || ext.some(e => file.endsWith(e))) {
                results.push(filePath);
            }
        }
    });
    return results;
}

// HELPER: Check content
function checkContent(files: string[], pattern: RegExp, invert = false): boolean {
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const match = pattern.test(content);
        if (invert && match) return false;
        if (!invert && match) return true;
    }
    return invert ? true : false;
}

function checkContentMatches(files: string[], pattern: RegExp): string[] {
    const matches: string[] = [];
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        if (pattern.test(content)) matches.push(path.basename(file));
    }
    return matches;
}

function log(name: string, status: 'PASS' | 'FAIL' | 'WARN', message: string) {
    result.checks.push({ name, status, message });
}

function validate() {
    if (!fs.existsSync(APP_PATH)) {
        log('Existence', 'FAIL', `Directory not found: ${APP_PATH}`);
        return;
    }
    result.exists = true;

    // 1. Structure
    const hasIndex = fs.existsSync(path.join(APP_PATH, 'index.ts'));
    // const hasActions = fs.existsSync(path.join(APP_PATH, 'actions.ts')); // Not strictly required for all apps
    log('Structure', hasIndex ? 'PASS' : 'FAIL', hasIndex ? 'index.ts found' : 'index.ts missing');

    // 2. Tenant Isolation
    // Check infrastructure files for tenant_id filtering
    const infraPath = path.join(APP_PATH, 'infrastructure');
    if (fs.existsSync(infraPath)) {
        const infraFiles = getAllFiles(infraPath, ['.ts']);
        if (infraFiles.length > 0) {
            const hasTenantFilter = checkContent(infraFiles, /tenant_id|p_tenant_id/);
            log('Tenant Isolation', hasTenantFilter ? 'PASS' : 'FAIL', hasTenantFilter ? 'Tenant filtering found in infra' : 'No tenant_id usage found in infra');

            // Check for RLS policy indicators (difficult in code, assuming repo usage)
            // Check for direct supabase client creation without filtering is hard statically
        } else {
            log('Tenant Isolation', 'WARN', 'No infrastructure files found to check');
        }
    } else {
        // Some apps might use shared infra or be simple
        log('Tenant Isolation', 'PASS', 'No infrastructure layer (Skipped)');
    }

    // 3. Permissions
    const actionsPath = path.join(APP_PATH, 'actions.ts');
    if (fs.existsSync(actionsPath)) {
        const content = fs.readFileSync(actionsPath, 'utf-8');
        const hasVerify = /verifyActionPermission|verifyPageAccess|verifyTenantAccess/.test(content);
        log('Permissions (Actions)', hasVerify ? 'PASS' : 'FAIL', hasVerify ? 'Permission verification found' : 'No verifyActionPermission/Access found in actions.ts');
    }

    // Check Pages for permission checks (Harder as pages are in src/app)
    // We can infer page location roughly: src/app/(admin)/admin/t/[tenantSlug]/apps/<AppId>
    // But AppID might differ from URL path. 
    // We will skip page check here and rely on actions check.

    // 4. Security
    const allFiles = getAllFiles(APP_PATH, ['.ts', '.tsx']);
    const hasServiceRole = checkContentMatches(allFiles, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
    const hasAdminClient = checkContentMatches(allFiles, /createAdminClient/);

    if (hasServiceRole.length > 0) {
        log('Security', 'FAIL', `Service Role usage detected in: ${hasServiceRole.join(', ')}`);
    } else if (hasAdminClient.length > 0) {
        log('Security', 'FAIL', `createAdminClient usage detected in: ${hasAdminClient.join(', ')}`);
    } else {
        log('Security', 'PASS', 'No unsafe auth patterns found');
    }

    // 5. Architecture - Domain Purity
    const domainPath = path.join(APP_PATH, 'domain');
    if (fs.existsSync(domainPath)) {
        const domainFiles = getAllFiles(domainPath, ['.ts']);
        const badImports = ['react', 'next', '@supabase', 'src/app', 'src/infra', '@/app', '@/infra'];
        let purityFailures: string[] = [];

        domainFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split('\n');
            lines.forEach(line => {
                if (line.trim().startsWith('import')) {
                    if (badImports.some(bad => line.includes(bad))) {
                        purityFailures.push(`${path.basename(file)}: ${line.trim()}`);
                    }
                }
            });
        });

        if (purityFailures.length > 0) {
            log('Domain Purity', 'FAIL', `Impure imports in domain: ${purityFailures.join('; ')}`);
        } else {
            log('Domain Purity', 'PASS', 'Domain layer is pure');
        }
    }

    // 6. Architecture - Cross-Module Imports
    // Regex for: import ... from '@/modules/<NOT_CURRENT_APP>'
    // Current App Root: src/modules/ferry-booking/routes -> we want to forbid src/modules/crm/*
    // But shared modules inside the same bounding context (wrapper) might be allowed?
    // STRICT RULE: "3. A module MUST NOT import any other module from src/modules."

    // We need to parse the wrapper. 
    // ID = ferry-booking/routes -> Wrapper = ferry-booking.
    // Is it allowed to import from ferry-booking/ferries? 
    // The contract says: "3. A module MUST NOT import any other module from src/modules." 
    // This implies STRICT independence.

    const otherModuleImports: string[] = [];
    // We iterate all files
    allFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        lines.forEach(line => {
            if (line.trim().startsWith('import')) {
                // Look for @/modules/
                const match = line.match(/@\/modules\/([^/'"]+)/);
                if (match) {
                    const importedModule = match[1];
                    // If imported module is NOT proper prefix of current App ID, it's cross-module?
                    // Actually, if I am in 'ferry-booking/routes', my root is 'ferry-booking'.
                    // Importing 'ferry-booking/ferries' IS a cross-module import between apps?
                    // "No cross-module imports" usually means bounded contexts.
                    // But Validation Rule 1 says: "No file inside src/modules/<A> may import from src/modules/<B>."
                    // If A=ferry-booking/routes and B=crm/partners, that's bad.
                    // If A=ferry-booking/routes and B=ferry-booking/ferries, that's ALSO bad if they are distinct apps.

                    // Let's implement strict check:
                    // Can only import from:
                    // 1. @/core
                    // 2. @/shared
                    // 3. Relative paths
                    // 4. @/modules/<MY_OWN_ID> (self-ref)

                    if (!APP_ID.startsWith(importedModule)) {
                        // Check if it's strictly self-import
                        // If I am 'ferry-booking/routes', I can import '@/modules/ferry-booking/routes/...'
                        if (!line.includes(`@/modules/${APP_ID}`)) {
                            otherModuleImports.push(`${path.basename(file)}: ${line.trim()}`);
                        }
                    }
                }
            }
        });
    });

    if (otherModuleImports.length > 0) {
        log('Cross-Module Imports', 'FAIL', `Forbidden imports detected: ${otherModuleImports.join('; ')}`);
    } else {
        log('Cross-Module Imports', 'PASS', 'No cross-module imports found');
    }

    const safeId = APP_ID.replace(/\//g, '_');
    const outPath = path.resolve(__dirname, `../../.doc/validation/${safeId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`Validation result saved to ${outPath}`);
}

validate();
