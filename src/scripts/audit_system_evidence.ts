
import fs from 'fs';
import path from 'path';
import { moduleRegistry } from '../core/moduleRegistry';

// Canonical list from moduleRegistry
const apps = [
    'ferry-booking/ferries',
    'ferry-booking/services',
    'ferry-booking/trips',
    'ferry-booking/reservations',
    'ferry-booking/orders',
    'ferry-booking/invoices',
    'ferry-booking/routes',
    'ferry-planning/calendar',
    'ferry-planning/templates',
    'ferry-planning/gantt',
    'ferry-pricing/profiles',
    'ferry-pricing/routes',
    'crm/partners',
    'crm/customers',
    'ferry-reporting/manifests',
    'ferry-reporting/sales',
    'core-admin/users',
    'core-admin/roles',
    'core-admin/sessions',
    'core-admin/settings',
    'core-admin/cockpits',
    'core-admin/planning',
    'example-dashboard'
];

const ROOT = path.resolve(__dirname, '../../');

async function audit() {
    console.log('# AUTOMATED STRICT AUDIT REPORT\n');
    console.log(`**Date:** ${new Date().toISOString()}`);
    console.log(`**Scope:** ${apps.length} Applications\n`);

    console.log('| App ID | Actions | Perms Check | Repo Layer | Tenant Filter | Security | Verdict |');
    console.log('| :--- | :---: | :---: | :---: | :---: | :---: | :---: |');

    let passCount = 0;

    for (const appId of apps) {
        const modulePath = path.join(ROOT, 'src/modules', appId);
        const actionsPath = path.join(modulePath, 'actions.ts');
        let infraPath = path.join(modulePath, 'infrastructure');

        let hasActions = fs.existsSync(actionsPath);
        let hasPerms = false;
        let hasRepo = fs.existsSync(infraPath);
        let hasTenantFilter = false;
        let isSecure = true; // Default to true, false if violations found

        // 1. Check Actions & Permissions
        if (hasActions) {
            const content = fs.readFileSync(actionsPath, 'utf-8');
            hasPerms = content.includes('verifyTenantAccess') || content.includes('verifyActionPermission');

            // Security Check 1: Browser Client in Actions
            if (content.includes('@/infra/supabase/client')) {
                isSecure = false;
            }
        } else {
            // Some apps might not have actions (read-only views using only client components? unlikely in this strict architecture)
            // But strict rules say: UI -> App -> Domain.
            // If no actions, maybe only page.tsx?
            // Let's assume actions.ts is required for "Functional Correctness" (CRUD) implies Server Actions.
        }

        // 2. Check Repository & Tenant Isolation
        if (!hasRepo && appId.includes('/')) {
            // Fallback to parent infrastructure (e.g. ferry-booking/infrastructure)
            const parentInfra = path.join(ROOT, 'src/modules', appId.split('/')[0], 'infrastructure');
            if (fs.existsSync(parentInfra)) {
                infraPath = parentInfra;
                hasRepo = true;
            }
        }

        if (hasRepo) {
            const files = fs.readdirSync(infraPath).filter(f => f.endsWith('.ts'));
            if (files.length === 0) {
                // No files in infrastructure?
                hasRepo = false;
            } else {
                for (const file of files) {
                    const content = fs.readFileSync(path.join(infraPath, file), 'utf-8');

                    // Tenant Filter Check: .eq('tenant_id') OR .rpc(..., { p_tenant_id })
                    const hasEqTenant = content.includes(".eq('tenant_id'") || content.includes('.eq("tenant_id"');
                    const hasRpcTenant = content.includes('.rpc(') && (content.includes('p_tenant_id') || content.includes('tenant_id'));

                    if (hasEqTenant || hasRpcTenant) {
                        hasTenantFilter = true;
                    }

                    // Security Check 2: Browser Client in Repo
                    if (content.includes('@/infra/supabase/client')) {
                        isSecure = false;
                    }
                }
            }
        }

        // Verdict
        // Pass if: Has Actions AND Has Perms AND Has Repo AND Has Tenant Filter AND Is Secure
        // Example Dashboard might be exception?
        if (appId === 'example-dashboard') {
            // If it has no actions/repo, it's just a UI. 
            // Logic: If NO actions, pass if NO Repo.
            if (!hasActions && !hasRepo) {
                // It's a view-only empty shell?
                // Valid.
            }
        }

        const passed = hasActions && hasPerms && hasRepo && hasTenantFilter && isSecure;
        if (passed) passCount++;

        const reasons = [];
        if (!hasActions) reasons.push('No Actions');
        if (!hasPerms) reasons.push('No Perms Check');
        if (!hasRepo) reasons.push('No Repo');
        if (!hasTenantFilter) reasons.push('No Tenant Filter');
        if (!isSecure) reasons.push('Insecure Client');

        console.log(`| \`${appId}\` | ${hasActions ? '✅' : '❌'} | ${hasPerms ? '✅' : '❌'} | ${hasRepo ? '✅' : '❌'} | ${hasTenantFilter ? '✅' : '❌'} | ${isSecure ? '✅' : '❌'} | ${passed ? 'PASS' : 'FAIL'} | ${!passed ? reasons.join(', ') : ''} |`);
    }

    console.log(`\n**Summary:** ${passCount}/${apps.length} Passed Strict Checks.`);

    if (passCount === apps.length) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

audit();
