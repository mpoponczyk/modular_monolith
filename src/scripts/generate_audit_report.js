const fs = require('fs');
const path = require('path');

const results = JSON.parse(fs.readFileSync('audit_results.json', 'utf8'));

let md = '# Full Per-Module Content Audit Report\n\n';

md += '## 1. Master Table\n\n';
md += '| moduleName | appId | structure | content | sql | translations | routing | security | functional | cleanup | verdict |\n';
md += '|---|---|---|---|---|---|---|---|---|---|---|\n';

for (const r of results) {
    // Determine overall verdict based on fields
    const hasFail = r.structure === 'FAIL' || r.content === 'FAIL' || r.sql === 'FAIL' || r.translations === 'FAIL' || r.routing === 'FAIL' || r.security === 'FAIL';
    const hasPartial = r.structure === 'PARTIAL' || r.content === 'PARTIAL' || r.sql === 'PARTIAL' || r.translations === 'PARTIAL' || r.routing === 'PARTIAL' || r.security === 'PARTIAL';

    let verdict = 'GO';
    if (hasFail) verdict = 'NO-GO (FAIL)';
    else if (hasPartial) verdict = 'NO-GO (PARTIAL)';

    md += `| ${r.moduleName} | ${r.appId} | ${r.structure} | ${r.content} | ${r.sql} | ${r.translations} | ${r.routing} | ${r.security} | UNKNOWN | UNKNOWN | **${verdict}** |\n`;
}

md += '\n## 2. Defects (FAIL/PARTIAL details)\n\n';

for (const r of results) {
    if (r.defects.length > 0 || r.missingItems.length > 0) {
        md += `### ${r.moduleName}\n`;
        if (r.missingItems.length > 0) {
            md += `- **Missing Items**:\n`;
            for (const item of r.missingItems) {
                md += `  - ${item}\n`;
            }
        }
        if (r.defects.length > 0) {
            md += `- **Defects**:\n`;
            for (const defect of r.defects) {
                md += `  - ${defect}\n`;
            }
        }
        md += '\n';
    }
}

md += '## 3. Final Verdict & Top 10 Fixes\n\n';
md += '**Final Verdict**: **NO-GO**\n\n';
md += '### Top 10 Fixes to reach GO\n\n';
md += '1. **Populate `README.md` for all modules**: Standardize and fill all mandatory sections (Purpose, routes, Permissions, Data model, RLS, UI parity, verify, risks) across all modules (Rule violation: Scope Mandatory Section D).\n';
md += '2. **Complete `DELETE_README.md` for all modules**: Provide executable instructions for real DB and codebase removal (Rule violation: Scope Mandatory Section E).\n';
md += '3. **Create missing foundational structure for `example-dashboard`, `ferry-pricing-profiles`, `ferry-pricing-routes`**: Generate missing READMEs, sql folders, translation folders (Rule violation: Required Module Shape).\n';
md += '4. **Resolve Cross-Module Imports**: Eliminate strict cross-module import leaks identified in Gantt, Calendar, Pricing Routes, and Reporting (Rule violation: `global.md` - No cross-module imports).\n';
md += '5. **Audit Direct DB UI Queries**: Refactor UI components in Ferries, Reservations, Trips, Gantt, and Manifests that appear to invoke `createClient` or `.from()` bypassing the application/infrastructure layers (Rule violation: `global.md` - No business logic in UI).\n';
md += '6. **Enforce Strict RLS Statements**: Add explicit `ENABLE ROW LEVEL SECURITY` identifiers inside the SQL schema/policies files for compliance checks (Rule violation: Security Enforcement).\n';
md += '7. **Fix `core-admin-sessions` RPC Security**: Add strictly missing `SECURITY DEFINER` and `REVOKE ALL / GRANT EXECUTE` to the sessions RPC SQL scripts.\n';
md += '8. **Fix `example-dashboard` entry paths**: Populate the `routes` array within `index.ts` to connect the module to the router hierarchy.\n';
md += '9. **Test Full Translations Matrix**: Verify namespace resolution and completeness for all locales, filling missing ones.\n';
md += '10. **Perform Cleanup Audits**: Validate that the legacy UI routing in `src/app/.../apps` is physically purged and functional routing is strictly bound to registry IDs.\n';

fs.writeFileSync('audit_report.md', md);
