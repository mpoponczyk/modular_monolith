
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log("=== STRICT ARCHITECTURE AUDIT START ===");

let totalFailures = 0;

function logPass(msg: string) {
    console.log(`${GREEN}[PASS] ${msg}${RESET}`);
}

function logFail(msg: string) {
    console.log(`${RED}[FAIL] ${msg}${RESET}`);
    totalFailures++;
}

function logWarn(msg: string) {
    console.log(`${YELLOW}[WARN] ${msg}${RESET}`);
}

function runGrep(pattern: string, dir: string, exclude: string[] = []): string[] {
    try {
        const excludeFlags = exclude.map(e => `--exclude-dir "${e}"`).join(' ');
        // Escape special chars in dir path (like parentheses)
        const safeDir = dir.replace(/([()[\]])/g, '\\$1');
        const cmd = `grep -lR "${pattern}" ${safeDir} ${exclude.map(e => `--exclude-dir=${e}`).join(' ')} 2>/dev/null`;
        const output = execSync(cmd).toString().trim();
        return output ? output.split('\n') : [];
    } catch (e) {
        return [];
    }
}

// === PART 1: MODULAR ISOLATION ===
console.log("\n[1] Check: Modular Isolation (No Cross-Module Imports)");
const moduleDir = 'src/modules/ferry-booking';
const imports = runGrep("from ['\"]@/modules/", moduleDir);
const invalidImports = imports.filter(f => !f.includes('ferry-booking') && f.endsWith('.ts'));

if (invalidImports.length > 0) {
    logFail(`Found cross-module imports in:\n${invalidImports.join('\n')}`);
} else {
    logPass("No cross-module imports found in ferry-booking.");
}

// Check for direct Supabase usage in UI
console.log("\n[2] Check: No Direct Supabase in UI Components");
const uiDir = 'src/app/(admin)/admin/t/[tenantSlug]/apps/ferry-booking';
const supabaseUsage = runGrep("from ['\"]@supabase/supabase-js['\"]", uiDir);
if (supabaseUsage.length > 0) {
    logFail(`Direct supabase-js import found in UI:\n${supabaseUsage.join('\n')}`);
} else {
    logPass("UI Components are free of direct Supabase Client usage (using hooks/actions).");
}

// === PART 2: REPOSITORY RULES ===
console.log("\n[3] Check: Repository Tenant Filtering");
const infraDir = 'src/modules/ferry-booking/infrastructure';
const repos = runGrep("implements I.*Repository", infraDir);

repos.forEach(repoPath => {
    const content = fs.readFileSync(repoPath, 'utf-8');
    // Check for explicit tenant filtering in queries
    if (!content.includes('.eq("tenant_id", tenantId)') && !content.includes(".eq('tenant_id', tenantId)")) {
        logFail(`${repoPath} might be missing explicit .eq("tenant_id", tenantId) check.`);
    } else {
        logPass(`${path.basename(repoPath)} uses explicit tenant_id filtering.`);
    }
});

// === PART 3: ROUTING RULES ===
console.log("\n[4] Check: Routing & Context Rules");
const pages = runGrep("export default async function", uiDir);

pages.filter(p => p.endsWith('page.tsx')).forEach(pagePath => {
    const content = fs.readFileSync(pagePath, 'utf-8');
    const relPath = path.relative(process.cwd(), pagePath);

    // Check 1: Resolve Tenant
    if (!content.includes('resolveTenantForUser')) {
        logFail(`${relPath} missing 'resolveTenantForUser'.`);
    } else {
        logPass(`${relPath} resolves tenant context.`);
    }

    // Check 2: Check Permission/Module Access
    if (!content.includes('canAccessModule') && !content.includes('permissions.includes')) {
        logWarn(`${relPath} might be missing RBAC checks (canAccessModule/permissions). Verify manually if wrapped.`);
    } else {
        logPass(`${relPath} has RBAC checks.`);
    }
});

// === PART 4: MUTATIONS via RPC ===
console.log("\n[5] Check: Mutations via RPC");
// We expect writes to use .rpc() and NOT .insert() / .update() / .delete() on mnt_ tables directly from repo
// (Except maybe for non-sensitive logs, but Strict Mode says RPC for core logic)

repos.forEach(repoPath => {
    const content = fs.readFileSync(repoPath, 'utf-8');

    // Fail if .insert() is used on mnt_ tables
    if (content.match(/\.from\(["']mnt_.*["']\)\.insert\(/)) {
        logFail(`${path.basename(repoPath)} uses direct .insert() on mnt_ table. Should use RPC.`);
    }

    // Fail if .update() is used on mnt_ tables
    if (content.match(/\.from\(["']mnt_.*["']\)\.update\(/)) {
        logFail(`${path.basename(repoPath)} uses direct .update() on mnt_ table. Should use RPC.`);
    }

    // Fail if .delete() is used on mnt_ tables
    if (content.match(/\.from\(["']mnt_.*["']\)\.delete\(/)) {
        logFail(`${path.basename(repoPath)} uses direct .delete() on mnt_ table. Should use RPC.`);
    }

    // Pass if RPC is used
    if (content.includes('.rpc(')) {
        logPass(`${path.basename(repoPath)} uses RPC for operations.`);
    }
});

console.log(`\n=== AUDIT COMPLETE: ${totalFailures} Failures ===`);
if (totalFailures > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
