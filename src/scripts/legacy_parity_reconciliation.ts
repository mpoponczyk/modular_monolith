
import { moduleRegistry } from '../core/moduleRegistry';

// 1. Set L: The 20 Active Legacy Apps (Strict Binary Scoring)
const L = new Set([
    'core-admin/users',
    'core-admin/roles',
    'core-admin/sessions',
    'core-admin/settings',
    'core-admin/cockpits',
    'core-admin/planning',
    'ferry-booking/ferries',
    'ferry-booking/routes',
    'ferry-booking/trips',
    'ferry-booking/reservations',
    'ferry-booking/orders',
    'ferry-booking/invoices',
    'ferry-booking/services',
    'ferry-planning/gantt',
    'ferry-planning/calendar',
    'ferry-planning/templates',
    'ferry-reporting/manifests',
    'ferry-reporting/sales',
    'ferry-pricing/profiles',
    'crm/partners'
]);

// Wrapper modules to exclude from R
const WRAPPERS = new Set([
    'core-admin',
    'crm',
    'dashboard',
    'ferry-booking',
    'ferry-planning',
    'ferry-pricing',
    'ferry-reporting'
]);

async function audit() {
    console.log('--- STRICT RECONCILIATION REPORT ---');

    // 2. Set R: Registry Apps
    const allModules = moduleRegistry.getModules();
    const R = new Set<string>();

    allModules.forEach(m => {
        if (!WRAPPERS.has(m.id)) {
            R.add(m.id);
        }
    });

    const listL = Array.from(L).sort();
    const listR = Array.from(R).sort();

    // 3. Mathematical Operations
    const intersection = listL.filter(x => R.has(x));
    const L_minus_R = listL.filter(x => !R.has(x));
    const R_minus_L = listR.filter(x => !L.has(x));

    console.log(`\n1. Set L (Legacy Definition) [|L| = ${L.size}]`);
    listL.forEach(x => console.log(`  ${x}`));

    console.log(`\n2. Set R (Current Registry) [|R| = ${R.size}]`);
    listR.forEach(x => console.log(`  ${x}`));

    console.log(`\n3. Operations`);
    console.log(`   L ⊆ R ? ${L_minus_R.length === 0}`);
    console.log(`   R ⊆ L ? ${R_minus_L.length === 0}`);
    console.log(`   |L| = ${L.size}`);
    console.log(`   |R| = ${R.size}`);

    console.log(`\n4. Differences`);

    console.log(`\n   L \\ R (Missing Legacy Parity):`);
    if (L_minus_R.length === 0) console.log('   (Empty - SUCCESS)');
    else L_minus_R.forEach(x => console.log(`   - ${x}`));

    console.log(`\n   R \\ L (Enhancements / New Apps):`);
    if (R_minus_L.length === 0) console.log('   (Empty)');
    else R_minus_L.forEach(x => console.log(`   + ${x}`));

    console.log('--- END REPORT ---');
}

audit();
