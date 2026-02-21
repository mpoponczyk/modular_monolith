
import { moduleRegistry } from '../core/moduleRegistry';
import fs from 'fs';
import path from 'path';

const WRAPPERS = new Set([
    'core-admin',
    'crm',
    'ferry-booking',
    'ferry-planning',
    'ferry-pricing',
    'ferry-reporting',
    'dashboard',
    'example-dashboard'
]);

async function generate() {
    console.log('Generating Canonical App List...');

    const modules = moduleRegistry.getModules();
    const apps = modules
        .filter(m => !WRAPPERS.has(m.id))
        .sort((a, b) => a.id.localeCompare(b.id));

    let content = '# Canonical App Validation List\n\n';
    content += `Generated on: ${new Date().toISOString()}\n`;
    content += `Total Apps: ${apps.length}\n\n`;
    content += '| # | Module ID | Name | Type |\n';
    content += '|---|-----------|------|------|\n';

    apps.forEach((app, index) => {
        content += `| ${index + 1} | \`${app.id}\` | ${app.name} | App |\n`;
    });

    const outputPath = path.resolve(__dirname, '../../.doc/full_app_validation_list.md');
    fs.writeFileSync(outputPath, content);
    console.log(`Saved to ${outputPath}`);

    // Also output strict list for automation
    const listPath = path.resolve(__dirname, '../../.doc/app_ids.txt');
    fs.writeFileSync(listPath, apps.map(a => a.id).join('\n'));
}

generate();
