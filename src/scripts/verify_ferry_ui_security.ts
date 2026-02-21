
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

function runGrep(pattern: string, fileBlob: string): string[] {
    try {
        const cmd = `grep -l "${pattern}" ${fileBlob}`;
        const output = execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
        return output.split('\n').filter(Boolean);
    } catch (e) {
        return [];
    }
}

function checkFileContent(filePath: string, requiredPatterns: string[]) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const missing = requiredPatterns.filter(p => !content.includes(p));
    if (missing.length > 0) {
        console.log(`${RED}[FAIL] ${filePath} missing: ${missing.join(', ')}${RESET}`);
        return false;
    }
    console.log(`${GREEN}[PASS] ${filePath}${RESET}`);
    return true;
}

const UI_DIR = 'src/app/(admin)/admin/t/[tenantSlug]/apps/ferry-booking';

console.log("=== Verifying Security Patterns in Ferry Booking UI ===");

let passed = true;

// 1. Verify Pages have Auth/Tenant/RBAC
const pages = runGrep('export default async function', `${UI_DIR}/**/page.tsx`);
pages.forEach(file => {
    if (!checkFileContent(file, [
        'createAuthClient()',
        'resolveTenantForUser',
        'canAccessModule',
        'forbidden()'
    ])) {
        passed = false;
    }
});

// 2. Verify Actions have Auth/Tenant
const actions = runGrep('export async function', `${UI_DIR}/**/actions.ts`);
actions.forEach(file => {
    if (!checkFileContent(file, [
        'createAuthClient()',
        'resolveTenantForUser',
        'revalidatePath'
    ])) {
        passed = false;
    }
});

if (passed) {
    console.log(`\n${GREEN}All checks passed!${RESET}`);
    process.exit(0);
} else {
    console.log(`\n${RED}Security checks failed.${RESET}`);
    process.exit(1);
}
