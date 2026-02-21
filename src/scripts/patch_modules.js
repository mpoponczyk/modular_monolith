const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(process.cwd(), 'src/modules');

const DELETE_README_TEMPLATE = `# Deleting the \`[module-name]\` module

To completely remove this module from the Strict Modular Monolith architecture, perform the following steps:

1.  **Remove Registration:** Delete the module's entry strictly from \`src/core/moduleRegistry.ts\`.
2.  **Database Cleanup:** Drop all specific tables and enums listed in \`sql/schema.sql\` within the database.
3.  **Delete Files:** Remove the entire \`src/modules/[module-name]\` directory.
4.  **UI/Routes Removal:** Any legacy dynamic routes mapping to this module should gracefully 404.
`;

const README_TEMPLATE = `# [module-name]

## Domain
Core business logic and types for [module-name].

## Application
Server actions and use cases.

## Infrastructure
External services and Supabase repositories.

## UI
React components and pages.
`;

const modules = [
    'core-admin-cockpits', 'core-admin-planning', 'core-admin-roles', 'core-admin-sessions',
    'core-admin-settings', 'core-admin-users', 'crm-customers', 'crm-partners',
    'example-dashboard', 'ferry-booking-ferries', 'ferry-booking-invoices', 'ferry-booking-orders',
    'ferry-booking-reservations', 'ferry-booking-routes', 'ferry-booking-services', 'ferry-booking-trips',
    'ferry-planning-calendar', 'ferry-planning-gantt', 'ferry-planning-templates', 'ferry-pricing-profiles',
    'ferry-pricing-routes', 'ferry-reporting-manifests', 'ferry-reporting-sales'
];

for (const mod of modules) {
    const modDir = path.join(MODULES_DIR, mod);
    if (!fs.existsSync(modDir)) {
        console.warn(`Warning: Module directory not found: ${modDir}`);
        continue;
    }

    // 1. DELETE_README.md
    const deleteReadmePath = path.join(modDir, 'DELETE_README.md');
    fs.writeFileSync(deleteReadmePath, DELETE_README_TEMPLATE.replace(/\[module-name\]/g, mod));
    console.log(`Patched DELETE_README.md for ${mod}`);

    // 2. README.md
    const readmePath = path.join(modDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
        fs.writeFileSync(readmePath, README_TEMPLATE.replace(/\[module-name\]/g, mod));
        console.log(`Created README.md for ${mod}`);
    }

    // 3. For specific modules missing folders
    if (['ferry-pricing-profiles', 'ferry-pricing-routes'].includes(mod)) {
        console.log(`Scaffolding missing directories for ${mod}...`);

        // locales
        const localesDir = path.join(modDir, 'locales');
        if (!fs.existsSync(localesDir)) fs.mkdirSync(localesDir);
        for (const lang of ['en.json', 'pl.json']) {
            const langPath = path.join(localesDir, lang);
            if (!fs.existsSync(langPath)) {
                fs.writeFileSync(langPath, '{\n\n}');
            }
        }

        // translations
        const transDir = path.join(modDir, 'translations');
        if (!fs.existsSync(transDir)) fs.mkdirSync(transDir);
        const transReadmePath = path.join(transDir, 'README.md');
        if (!fs.existsSync(transReadmePath)) {
            fs.writeFileSync(transReadmePath, '# Translations\n');
        }

        // sql
        const sqlDir = path.join(modDir, 'sql');
        if (!fs.existsSync(sqlDir)) fs.mkdirSync(sqlDir);
        for (const sqlFile of ['schema.sql', 'policies.sql', 'rpc.sql']) {
            const sqlPath = path.join(sqlDir, sqlFile);
            if (!fs.existsSync(sqlPath)) {
                let content = '';
                if (sqlFile === 'policies.sql') content = '-- Enforce RLS\n';
                else if (sqlFile === 'rpc.sql') content = '-- No RPCs\n';
                else if (sqlFile === 'schema.sql') content = '-- Schema definition\n';
                fs.writeFileSync(sqlPath, content);
            }
        }
        console.log(`Scaffolded missing structures for ${mod}`);
    }
}
console.log('Automated patching of documentation and structures complete.');
