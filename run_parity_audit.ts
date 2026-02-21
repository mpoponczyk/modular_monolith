import * as fs from 'fs';
import * as path from 'path';

const legacyBase = '/Users/Shared/test_zalew-1/src/app/admin';
const modularBase = '/Users/Shared/Modular_Monolith/src/modules';

const apps = [
    { name: 'ferries', legacy: 'ferries', curr: 'ferry-booking/ferries' },
    { name: 'services', legacy: 'services', curr: 'ferry-booking/services' },
    { name: 'trips', legacy: 'trips', curr: 'ferry-booking/trips' },
    { name: 'reservations', legacy: 'reservations', curr: 'ferry-booking/reservations' },
    { name: 'orders', legacy: 'orders', curr: 'ferry-booking/orders' },
    { name: 'invoices', legacy: 'invoices', curr: 'ferry-booking/invoices' },
    { name: 'routes (booking)', legacy: 'routes', curr: 'ferry-booking/routes' },
    { name: 'calendar', legacy: 'calendar-visual', curr: 'ferry-planning/calendar' },
    { name: 'templates', legacy: 'templates', curr: 'ferry-planning/templates' },
    { name: 'gantt', legacy: 'gantt', curr: 'ferry-planning/gantt' },
    { name: 'profiles', legacy: 'pricing-profiles', curr: 'ferry-pricing/profiles' }, // try pricing-profiles or similar
    { name: 'routes (pricing)', legacy: 'routes', curr: 'ferry-pricing/routes' }, // might be same legacy route?
    { name: 'partners', legacy: 'partners', curr: 'crm/partners' },
    { name: 'customers', legacy: 'customers', curr: 'crm/customers' },
    { name: 'manifests', legacy: 'manifests', curr: 'ferry-reporting/manifests' },
    { name: 'sales', legacy: 'sales', curr: 'ferry-reporting/sales' },
    { name: 'users', legacy: 'users', curr: 'core-admin/users' },
    { name: 'roles', legacy: 'roles', curr: 'core-admin/roles' },
    { name: 'sessions', legacy: 'sessions', curr: 'core-admin/sessions' },
    { name: 'settings', legacy: 'settings', curr: 'core-admin/settings' },
    { name: 'cockpits', legacy: 'cockpits', curr: 'core-admin/cockpits' },
    { name: 'planning', legacy: 'planning', curr: 'core-admin/planning' },
    { name: 'example-dashboard', legacy: 'test/dashboard', curr: 'example-dashboard' } // probably not a priority
];

function analyzeDir(dirPath: string) {
    let result = {
        hasPage: false,
        hasList: false,
        hasForm: false,
        hasDetails: false,
        hasModal: false,
        components: [] as string[],
        buttons: [] as string[],
        fileCount: 0,
        contentRaw: ''
    };

    if (!fs.existsSync(dirPath)) return null;

    const readRecursive = (currentDir: string) => {
        const files = fs.readdirSync(currentDir);
        for (const file of files) {
            const fullPath = path.join(currentDir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                readRecursive(fullPath);
            } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
                result.fileCount++;
                const content = fs.readFileSync(fullPath, 'utf8');
                result.contentRaw += content + '\n';
                if (file.toLowerCase().includes('page')) result.hasPage = true;
                if (file.toLowerCase().includes('list')) result.hasList = true;
                if (file.toLowerCase().includes('form')) result.hasForm = true;
                if (file.toLowerCase().includes('detail') || file.toLowerCase().includes('[id]')) result.hasDetails = true;
                if (file.toLowerCase().includes('modal') || file.toLowerCase().includes('dialog')) result.hasModal = true;

                // naive button scan
                const buttonMatches = content.match(/<Button[^>]*>[\s\S]*?<\/Button>/g);
                if (buttonMatches) {
                    buttonMatches.forEach(b => {
                        const clean = b.replace(/<[^>]+>/g, '').trim();
                        if (clean && !result.buttons.includes(clean)) result.buttons.push(clean);
                    });
                }
            }
        }
    };

    readRecursive(dirPath);
    return result;
}

const audit = apps.map(app => {
    let legacyFound = false;
    let legacyPath = path.join(legacyBase, app.legacy);

    // Attempt fallback paths for some ambiguous ones
    if (!fs.existsSync(legacyPath)) {
        if (app.name === 'profiles') legacyPath = path.join(legacyBase, 'pricing'); // Just guessing
        if (app.name === 'customers') legacyPath = path.join(legacyBase, 'users'); // Just guessing
        if (app.name === 'manifests') legacyPath = path.join(legacyBase, 'reports'); // Just guessing
    }

    const currPath = path.join(modularBase, app.curr, 'ui');

    const legacyStats = analyzeDir(legacyPath);
    // some legacy apps use subfolders like admin/[feature]/components
    // but typically everything was inside the page file or near it.

    const currStats = analyzeDir(currPath);

    return {
        name: app.name,
        legacyPath,
        currPath: app.curr,
        legacyExists: !!legacyStats,
        currExists: !!currStats,
        legacy: legacyStats,
        curr: currStats
    };
});

console.log(JSON.stringify(audit, null, 2));

