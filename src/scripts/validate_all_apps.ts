
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const APP_LIST_PATH = path.resolve(__dirname, '../../.doc/app_ids.txt');
const REPORT_PATH = path.resolve(__dirname, '../../.doc/full_validation_report.md');
const SINGLE_SCRIPT = path.resolve(__dirname, 'validate_app_strict.ts');
const VALIDATION_DIR = path.resolve(__dirname, '../../.doc/validation');

async function run() {
    console.log('Starting Batch Validation...');

    if (!fs.existsSync(APP_LIST_PATH)) {
        console.error('App list not found:', APP_LIST_PATH);
        process.exit(1);
    }

    const content = fs.readFileSync(APP_LIST_PATH, 'utf-8');
    const apps = content.trim().split('\n').filter(Boolean);

    let reportMd = '# Strict Full System Validation Report\n\n';
    reportMd += `Generated on: ${new Date().toISOString()}\n\n`;
    reportMd += '| App ID | Functional | Isolation | Security & Arch | Overall |\n';
    reportMd += '|---|---|---|---|---|\n';

    let totalPass = 0;
    let totalFail = 0;

    for (const appId of apps) {
        const id = appId.trim();
        console.log(`Validating ${id}...`);

        try {
            // run single validation script
            const cmd = `npx tsx "${SINGLE_SCRIPT}" "${id}"`;
            execSync(cmd, { stdio: 'inherit' }); // pipe output to see logs

            const safeId = id.replace(/\//g, '_');
            const resultPath = path.join(VALIDATION_DIR, `${safeId}.json`);

            if (!fs.existsSync(resultPath)) {
                console.error(`Result file not found for ${id}`);
                reportMd += `| \`${id}\` | ERROR | ERROR | ERROR | ❌ |\n`;
                totalFail++;
                continue;
            }

            const result = JSON.parse(fs.readFileSync(resultPath, 'utf-8'));
            const checks = result.checks;

            // Analyze Results
            // Functional: Structure PASS
            const struct = checks.find((c: any) => c.name === 'Structure')?.status === 'PASS';
            const funcStatus = struct ? 'PASS' : 'FAIL';

            // Isolation: Tenant Isolation PASS or WARN (if skipped)
            const isoCheck = checks.find((c: any) => c.name === 'Tenant Isolation');
            const isoStatus = isoCheck?.status || 'FAIL';

            // Security: PASS
            const secCheck = checks.find((c: any) => c.name === 'Security');
            const secStatus = secCheck?.status || 'FAIL';

            // Architecture: Domain Purity + Cross-Module
            const domainCheck = checks.find((c: any) => c.name === 'Domain Purity');
            const crossCheck = checks.find((c: any) => c.name === 'Cross-Module Imports');
            const archPass = (domainCheck?.status === 'PASS' || domainCheck?.status === undefined) &&
                (crossCheck?.status === 'PASS' || crossCheck?.status === undefined);
            const archStatus = archPass ? 'PASS' : 'FAIL';

            const overall = (funcStatus === 'PASS' && isoStatus !== 'FAIL' && secStatus === 'PASS' && archStatus === 'PASS') ? '✅' : '❌';

            if (overall === '✅') totalPass++; else totalFail++;

            reportMd += `| \`${id}\` | ${funcStatus} | ${isoStatus} | ${archStatus} | ${overall} |\n`;

            if (overall === '❌') {
                reportMd += `\n<details><summary>Failure Details for ${id}</summary>\n\n`;
                checks.forEach((c: any) => {
                    if (c.status !== 'PASS') {
                        reportMd += `- **${c.name}**: ${c.status} - ${c.message}\n`;
                    }
                });
                reportMd += `\n</details>\n\n`;
            }

        } catch (e) {
            console.error(`Execution error for ${id}:`, e);
            reportMd += `| \`${id}\` | EXEC ERR | EXEC ERR | EXEC ERR | ❌ |\n`;
            totalFail++;
        }
    }

    reportMd += `\n**Summary**: ${totalPass} PASS, ${totalFail} FAIL\n`;
    reportMd += `**Verdict**: ${totalFail === 0 ? 'GO' : 'NO-GO'}\n`;

    fs.writeFileSync(REPORT_PATH, reportMd);
    console.log(`Report saved to ${REPORT_PATH}`);
}

run();
