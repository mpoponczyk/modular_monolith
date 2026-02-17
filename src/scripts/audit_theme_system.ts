
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../');

function checkFileExists(relativePath: string): boolean {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) {
        console.error(`❌ File missing: ${relativePath}`);
        return false;
    }
    return true;
}

function checkContent(relativePath: string, pattern: RegExp, expected: boolean = true): boolean {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) return false;
    const content = fs.readFileSync(fullPath, 'utf-8');
    const hasPattern = pattern.test(content);
    if (hasPattern !== expected) {
        console.error(`❌ Content check failed for ${relativePath}. Expected pattern ${pattern} to be ${expected}, got ${hasPattern}`);
        return false;
    }
    return true;
}

async function runAudit() {
    console.log("🔍 Starting Strict Theme System Audit...");
    let errors = 0;

    // 1. Database Schema
    if (!checkFileExists('src/db/migrations/20260217210000_user_preferences.sql')) errors++;
    if (!checkContent('src/db/migrations/20260217210000_user_preferences.sql', /alter table public\.user_preferences enable row level security;/i, true)) errors++;
    if (!checkContent('src/db/migrations/20260217210000_user_preferences.sql', /create policy "Users can view own preferences"/i, true)) errors++;

    // 2. Architecture (Ports & Adapters)
    if (!checkFileExists('src/core/ports/IUserPreferenceRepository.ts')) errors++;
    if (!checkContent('src/core/ports/IUserPreferenceRepository.ts', /interface IUserPreferenceRepository/, true)) errors++;

    if (!checkFileExists('src/infra/repositories/SupabaseUserPreferenceRepository.ts')) errors++;
    if (!checkContent('src/infra/repositories/SupabaseUserPreferenceRepository.ts', /implements IUserPreferenceRepository/, true)) errors++;

    // 3. UI Branding (Static "modMonolith")
    // LegacyHeader (Server Component)
    if (!checkContent('src/components/legacy/admin/LegacyHeader.tsx', /modMonolith/, true)) errors++;
    // HeaderAdminLayout (Legacy Layout Header)
    if (!checkContent('src/components/legacy/admin/HeaderAdminLayout.tsx', /modMonolith/, true)) errors++;
    // LegacyAdminLayout (Original Layout Header)
    if (!checkContent('src/components/legacy/admin/LegacyAdminLayout.tsx', /modMonolith/, true)) errors++;

    // 4. UI Branding (No Tenant Name or "FerryAdmin")
    if (!checkContent('src/components/legacy/admin/LegacyHeader.tsx', /FerryAdmin/, false)) errors++;
    if (!checkContent('src/components/legacy/admin/HeaderAdminLayout.tsx', /FerryAdmin/, false)) errors++;
    if (!checkContent('src/components/legacy/admin/LegacyAdminLayout.tsx', /FerryAdmin/, false)) errors++;

    // 5. Isolation (Client Components must NOT import Server Components)
    // LegacyHeader is now a Server Component.
    if (!checkContent('src/app/(admin)/admin/t/[tenantSlug]/2fa/TwoFactorForm.tsx', /LegacyHeader/, false)) {
        console.error('TwoFactorForm imports LegacyHeader (Server Component)!');
        errors++;
    }
    if (!checkContent('src/components/legacy/auth/LegacyLoginLayout.tsx', /LegacyHeader/, false)) {
        console.error('LegacyLoginLayout imports LegacyHeader (Server Component)!');
        errors++;
    }

    if (!checkContent('src/components/legacy/admin/LegacyHeader.tsx', /SupabaseUserPreferenceRepository/, false)) {
        console.error('LegacyHeader imports Concrete Infrastructure!');
        errors++;
    }
    if (!checkContent('src/components/legacy/admin/HeaderAdminLayout.tsx', /SupabaseUserPreferenceRepository/, false)) {
        console.error('HeaderAdminLayout imports Concrete Infrastructure!');
        errors++;
    }
    if (!checkContent('src/components/legacy/admin/LegacyAdminLayout.tsx', /SupabaseUserPreferenceRepository/, false)) {
        console.error('LegacyAdminLayout imports Concrete Infrastructure!');
        errors++;
    }

    // 6. User Dropdown Integration
    if (!checkContent('src/components/ui/UserDropdown.tsx', /ThemeSwitcher/, true)) errors++;

    if (errors === 0) {
        console.log("✅ Audit Passed: Theme System adheres to strict architectural standards.");
    } else {
        console.error(`❌ Audit Failed with ${errors} errors.`);
        process.exit(1);
    }
}

runAudit();
