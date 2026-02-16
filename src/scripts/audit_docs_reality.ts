// mateusz poponczyk

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DOCS_DIR = path.resolve(process.cwd(), 'docs/architecture');
const SRC_DIR = path.resolve(process.cwd(), 'src');

async function audit() {
    console.log('🔍 Starting Paranoid Documentation Audit...\n');
    let failed = false;
    let firstFailed = false;

    // 1. Audit 09_VERIFICATION_MODEL.md (Run Commands)
    console.log('📄 Auditing 09_VERIFICATION_MODEL.md commands...');
    const verificationModelPath = path.join(DOCS_DIR, '09_VERIFICATION_MODEL.md');
    if (!fs.existsSync(verificationModelPath)) {
        console.error('❌ 09_VERIFICATION_MODEL.md not found');
        failed = true;
    } else {
        const content = fs.readFileSync(verificationModelPath, 'utf8');
        const commands = content.match(/```bash\n([\s\S]*?)\n```/g);

        if (commands) {
            for (const cmdBlock of commands) {
                const cmdLines = cmdBlock.replace(/```bash\n|```/g, '').trim().split('\n');
                for (const cmd of cmdLines) {
                    if (cmd.trim()) {
                        try {
                            console.log(`> Executing: ${cmd}`);
                            execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
                            console.log('✅ PASS');
                        } catch (e) {
                            console.error(`❌ FAIL: Command failed: ${cmd}`);
                            failed = true;
                            console.log('DEBUG: Failed at command execution');
                        }
                    }
                }
            }
        }
    }
    if (failed) console.log('DEBUG: Failed after 09 verification');

    // 2. Audit 10_SECURITY_MODEL.md (File References)
    console.log('\n📄 Auditing 10_SECURITY_MODEL.md file references...');
    const secModelPath = path.join(DOCS_DIR, '10_SECURITY_MODEL.md');
    if (fs.existsSync(secModelPath)) {
        const content = fs.readFileSync(secModelPath, 'utf8');
        // Regex to find paths starting with src/
        const srcPaths = content.match(/src\/[\w\-\.\/]+/g);

        if (srcPaths) {
            const uniquePaths = Array.from(new Set(srcPaths));
            for (const filePath of uniquePaths) {
                const fullPath = path.resolve(process.cwd(), filePath);
                if (fs.existsSync(fullPath)) {
                    console.log(`✅ PASS: File exists: ${filePath}`);
                } else {
                    console.error(`❌ FAIL: Referenced file NOT found: ${filePath}`);
                    failed = true;
                    console.log('DEBUG: Failed at file existence');
                }
            }
        }
    }
    if (failed && !firstFailed) {
        console.log('DEBUG: Failed after 10 verification');
        firstFailed = true;
    }

    // 3. Audit 08_FAILURE_MODES.md (Redirect Reasons)
    console.log('\n📄 Auditing 08_FAILURE_MODES.md redirect reasons...');
    const failureModelPath = path.join(DOCS_DIR, '08_FAILURE_MODES.md');
    if (fs.existsSync(failureModelPath)) {
        const content = fs.readFileSync(failureModelPath, 'utf8');
        const reasons = [
            'reason=missing_cookie',
            'reason=invalid_signature',
            'reason=tenant_mismatch',
            'reason=session_revoked'
        ];

        // Check if these reasons exist in SRC code (specifically serverGuard.ts)
        const guardPath = path.join(SRC_DIR, 'core/security/serverGuard.ts');
        if (fs.existsSync(guardPath)) {
            const guardContent = fs.readFileSync(guardPath, 'utf8');
            for (const reason of reasons) {
                if (guardContent.includes(reason)) {
                    console.log(`✅ PASS: Code contains redirect reason: ${reason}`);
                } else {
                    console.error(`❌ FAIL: Code missing redirect reason: ${reason}`);
                    failed = true;
                    console.log('DEBUG: Failed at reason check');
                }
            }
        } else {
            console.error(`❌ FAIL: serverGuard.ts not found for verification`);
            failed = true;
        }
    }

    if (failed) {
        console.error('\n🚫 DOCUMENTATION AUDIT FAILED: Discrepancies found.');
        process.exit(1);
    } else {
        console.log('\n🛡️  DOCUMENTATION AUDIT PASSED: Docs match Reality.');
    }
}

audit();
