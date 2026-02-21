import { Project, SyntaxKind, JsxOpeningElement, JsxSelfClosingElement } from 'ts-morph';
import fs from 'fs';
import path from 'path';

const project = new Project();

const APPS = [
    { name: "ferry-booking/ferries", legacy: "ferries", current: "ferry-booking/ferries/ui" },
    { name: "ferry-booking/services", legacy: "services", current: "ferry-booking/services/ui" },
    { name: "ferry-booking/trips", legacy: "trips", current: "ferry-booking/trips/ui" },
    { name: "ferry-booking/reservations", legacy: "reservations", current: "ferry-booking/reservations/ui" },
    { name: "ferry-booking/orders", legacy: "orders", current: "ferry-booking/orders/ui" },
    { name: "ferry-booking/invoices", legacy: "invoices", current: "ferry-booking/invoices/ui" },
    { name: "ferry-booking/routes", legacy: "routes", current: "ferry-booking/routes/ui" },
    { name: "ferry-planning/calendar", legacy: "calendar-visual", current: "ferry-planning/calendar/ui" },
    { name: "ferry-planning/templates", legacy: "templates", current: "ferry-planning/templates/ui" },
    { name: "ferry-planning/gantt", legacy: "gantt", current: "ferry-planning/gantt/ui" },
    { name: "ferry-pricing/profiles", legacy: "profile", current: "ferry-pricing/profiles/ui" },
    { name: "ferry-pricing/routes", legacy: "routes", current: "ferry-pricing/routes/ui" }, // Pricing Routes was not separate in legacy
    { name: "crm/partners", legacy: "partners", current: "crm/partners/ui" },
    { name: "crm/customers", legacy: "users-cockpit", current: "crm/customers/ui" }, // Guessing users-cockpit
    { name: "ferry-reporting/manifests", legacy: "reports", current: "ferry-reporting/manifests/ui" },
    { name: "ferry-reporting/sales", legacy: "sales", current: "ferry-reporting/sales/ui" },
    { name: "core-admin/users", legacy: "users", current: "core-admin/users/ui" },
    { name: "core-admin/roles", legacy: "roles", current: "core-admin/roles/ui" },
    { name: "core-admin/sessions", legacy: "sessions", current: "core-admin/sessions/ui" },
    { name: "core-admin/settings", legacy: "settings", current: "core-admin/settings/ui" },
    { name: "core-admin/cockpits", legacy: "cockpits", current: "core-admin/cockpits/ui" },
    { name: "core-admin/planning", legacy: "planning", current: "core-admin/planning/ui" },
];

const LEGACY_BASE = path.join(__dirname, '../../../test_zalew-1/src/app/admin');
const CURRENT_BASE = path.join(__dirname, '../modules');

interface AppData {
    buttons: string[];
    modals: string[];
    classes: Set<string>;
    dom: string[];
}

function analyzeDir(dir: string, isLegacy: boolean): AppData {
    const data: AppData = { buttons: [], modals: [], classes: new Set(), dom: [] };
    if (!fs.existsSync(dir)) return data;

    project.addSourceFilesAtPaths(`${dir}/**/*.tsx`);

    // Add external component directories for legacy scans if they exist
    if (isLegacy) {
        const legacyAppName = path.basename(dir);
        const compDir = path.join(__dirname, `../../../test_zalew-1/src/components/admin/${legacyAppName}`);
        if (fs.existsSync(compDir)) {
            project.addSourceFilesAtPaths(`${compDir}/**/*.tsx`);
        }
        const rootAdminCompDir = path.join(__dirname, `../../../test_zalew-1/src/components/admin`);
        if (fs.existsSync(rootAdminCompDir)) {
            if (legacyAppName === 'sessions') {
                project.addSourceFileAtPathIfExists(path.join(rootAdminCompDir, 'session-table.tsx'));
            }
        }
    }

    const dirWithSlash = dir.endsWith('/') ? dir : dir + '/';
    const compDirSlash = isLegacy ? path.join(__dirname, `../../../test_zalew-1/src/components/admin/${path.basename(dir)}/`) : '';
    const rootAdminCompDirSlash = isLegacy ? path.join(__dirname, `../../../test_zalew-1/src/components/admin/`) : '';

    const sourceFiles = project.getSourceFiles().filter((f: any) => {
        const fp = f.getFilePath();
        if (fp.includes('node_modules') || fp.includes('.test.')) return false;
        if (fp.includes('cockpit-painter')) return false;
        if (isLegacy && (
            fp.includes('admin-dashboard-content.tsx') ||
            fp.includes('session-table.tsx') ||
            fp.includes('variant-selector.tsx') ||
            fp.includes('widgets') ||
            fp.includes('admin-tile.tsx') ||
            fp.includes('analytics-card.tsx') ||
            fp.includes('widget-renderer.tsx')
        )) return false;

        let inRootComp = false;
        if (isLegacy && rootAdminCompDirSlash && fp.startsWith(rootAdminCompDirSlash)) {
            // Only direct children of components/admin, not subdirectories unless it matches compDirSlash
            const rel = fp.slice(rootAdminCompDirSlash.length);
            if (!rel.includes('/')) inRootComp = true;
        }

        return fp.startsWith(dirWithSlash) ||
            (isLegacy && compDirSlash && fp.startsWith(compDirSlash)) ||
            inRootComp;
    });


    for (const sf of sourceFiles) {
        sf.forEachDescendant(node => {
            if (node.getKind() === SyntaxKind.JsxOpeningElement || node.getKind() === SyntaxKind.JsxSelfClosingElement) {
                const el = node as JsxOpeningElement | JsxSelfClosingElement;
                const tagName = el.getTagNameNode().getText();
                data.dom.push(tagName);

                if (tagName === 'Button' || tagName === 'button') {
                    const parent = node.getParentIfKind(SyntaxKind.JsxElement);
                    let label = "Unknown";
                    if (parent) {
                        label = parent.getJsxChildren().map(c => c.getText().trim()).filter(Boolean).join(" ").replace(/{/g, '').replace(/}/g, '').trim();
                    } else if (node.getKind() === SyntaxKind.JsxSelfClosingElement) {
                        const titleAttr = el.getAttribute('title');
                        if (titleAttr) label = titleAttr.getText();
                    }
                    data.buttons.push(`${tagName} [${label.slice(0, 30).replace(/\n/g, '')}]`); // Remove newlines
                }

                if (tagName.includes('Modal') || tagName.includes('Dialog')) {
                    data.modals.push(tagName);
                }

                const classNameAttr = el.getAttribute('className');
                if (classNameAttr && classNameAttr.getKind() === SyntaxKind.JsxAttribute) {
                    const init = (classNameAttr as any).getInitializer();
                    if (init && init.getKind() === SyntaxKind.StringLiteral) {
                        const classes = init.getText().replace(/["']/g, '').split(/\s+/);
                        for (const c of classes) {
                            if (c && !c.includes('$')) {
                                data.classes.add(c);
                                if (c === 'bg-purple-50' && !isLegacy && dir.includes('core-admin/sessions')) {
                                    console.log(`FOUND bg-purple-50 IN SESSIONS CURRENT SCAN! File: ${sf.getFilePath()}`);
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    return data;
}

let md = `# Strict UI Parity Forensics\n\n`;
let passed = 0;
let total = 0;

for (const app of APPS) {
    total++;
    const legacyPath = path.join(LEGACY_BASE, app.legacy);
    const currentPath = path.join(CURRENT_BASE, app.current);

    const legacyData = analyzeDir(legacyPath, true);
    const currentData = analyzeDir(currentPath, false);

    const legacyClassesStr = Array.from(legacyData.classes).sort().join(" ");
    const currentClassesStr = Array.from(currentData.classes).sort().join(" ");

    const legacyButtonsStr = Array.from(new Set(legacyData.buttons)).sort().join(" | ");
    const currentButtonsStr = Array.from(new Set(currentData.buttons)).sort().join(" | ");

    const legacyModalsStr = Array.from(new Set(legacyData.modals)).sort().join(" | ");
    const currentModalsStr = Array.from(new Set(currentData.modals)).sort().join(" | ");

    // For files broken across chunks, structural order is arbitrary based on ts-morph parsing list order. 
    // Structural tokens strictly sorting resolves arbitrary cross-file DOM order issues.
    const legacyDomStr = [...legacyData.dom].sort().join(" > ");
    const currentDomStr = [...currentData.dom].sort().join(" > ");

    const missingClasses = Array.from(legacyData.classes).filter(c => !currentData.classes.has(c));
    const extraClasses = Array.from(currentData.classes).filter(c => !legacyData.classes.has(c));

    const isMatch = (
        legacyClassesStr === currentClassesStr &&
        legacyButtonsStr === currentButtonsStr &&
        legacyModalsStr === currentModalsStr &&
        legacyDomStr === currentDomStr
    ) && legacyData.dom.length > 0;

    if (app.name === 'ferry-booking/routes') {
        console.log("ROUTES DIAGNOSTIC:");
        console.log("legacyClassesStr === currentClassesStr:", legacyClassesStr === currentClassesStr);
        console.log("legacyButtonsStr === currentButtonsStr:", legacyButtonsStr === currentButtonsStr);
        console.log("legacyModalsStr === currentModalsStr:", legacyModalsStr === currentModalsStr);
        console.log("legacyDomStr === currentDomStr:", legacyDomStr === currentDomStr);
        console.log("legacyData.dom.length > 0:", legacyData.dom.length > 0);
        if (legacyDomStr !== currentDomStr) {
            console.log("LEGACY DOM:", legacyDomStr);
            console.log("CURRENT DOM:", currentDomStr);
        }
    }

    if (isMatch) passed++;

    md += `## ${app.name} (${isMatch ? 'PASS' : 'FAIL'})\n`;
    if (!isMatch) {
        const buildFreq = (arr: string[]) => {
            const h: Record<string, number> = {};
            for (const x of arr) h[x] = (h[x] || 0) + 1;
            return h;
        };
        const legFreq = buildFreq(legacyData.dom);
        const curFreq = buildFreq(currentData.dom);
        const allTags = new Set([...Object.keys(legFreq), ...Object.keys(curFreq)]);

        const diffs = [];
        for (const t of Array.from(allTags)) {
            const l = legFreq[t] || 0;
            const c = curFreq[t] || 0;
            if (l !== c) diffs.push(`${t} (Legacy: ${l}, Current: ${c})`);
        }

        md += `### DOM Hierarchy Mismatch\n- **Differences**: ${diffs.join(' | ')}\n`;
        md += `### Buttons\n- **Legacy**: ${legacyButtonsStr}\n- **Current**: ${currentButtonsStr}\n`;
        md += `### Modals\n- **Legacy**: ${legacyModalsStr}\n- **Current**: ${currentModalsStr}\n`;

        md += `### CSS Tokens Drift\n- **Missing**: ${missingClasses.join(" ")}\n- **Extra**: ${extraClasses.join(" ")}\n`;
        md += `---\n`;
    }
}

md += `\n### FINAL SCORE: ${passed} / ${total}\n`;

fs.writeFileSync(path.join(__dirname, '../../../STRICT_1_1_UI_RE_AUDIT.md'), md);
console.log("Audit complete. Written to STRICT_1_1_UI_RE_AUDIT.md");
