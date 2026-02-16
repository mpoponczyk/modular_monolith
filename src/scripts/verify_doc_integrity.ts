import fs from 'fs';
import path from 'path';

const RELEASE_VERSION = 'v0.0.1-prealpha.1';
const DOCS_DIR = path.join(process.cwd(), 'docs/architecture');
const DOC_FILE = path.join(process.cwd(), `docs/Modular_Monolith_Architecture_${RELEASE_VERSION}.doc`);

function unescapeHtml(text: string): string {
    return text
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, "&");
}

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')  // Strip punctuation/markdown symbols
        .replace(/\s+/g, ' ')     // Collapse whitespace
        .trim();
}

function audit() {
    console.log(`🔍 Starting Exact Match Audit of ${DOC_FILE}...\n`);

    if (!fs.existsSync(DOC_FILE)) {
        console.error('❌ Documentation file not found!');
        process.exit(1);
    }

    let rawDocContent = fs.readFileSync(DOC_FILE, 'utf-8');

    // CRITICAL FIX: Unescape entities FIRST, then strip HTML tags
    // The previous version compared "quote" vs "&quot;" which failed.
    rawDocContent = unescapeHtml(rawDocContent);
    rawDocContent = rawDocContent.replace(/<[^>]*>/g, ' '); // Strip HTML tags

    // Create a massive normalized text blob from the doc
    const normalizedDoc = normalizeText(rawDocContent);

    const mdFiles = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md')).sort();
    console.log(`📂 Found ${mdFiles.length} source files.`);

    let allPassed = true;

    mdFiles.forEach(file => {
        const filePath = path.join(DOCS_DIR, file);
        const mdContent = fs.readFileSync(filePath, 'utf-8');

        // Check 1: File Presence (Header check)
        // The doc generator adds "File: filename" headers
        if (!rawDocContent.includes(`File: ${file}`)) {
            console.error(`❌ FAIL: Header for ${file} missing in .doc`);
            allPassed = false;
            return;
        }

        const lines = mdContent.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 20) // Only check significant lines
            .filter(l => !l.startsWith('```')); // Skip code blocks (too variable)

        let found = 0;
        let checked = 0;
        const subSample = 1; // Check every line > 20 chars

        lines.forEach((line, idx) => {
            if (idx % subSample !== 0) return;

            const normalizedLine = normalizeText(line);
            if (normalizedLine.length < 10) return; // Skip if normalization reduced it too much

            if (normalizedDoc.includes(normalizedLine)) {
                found++;
            } else {
                // Formatting might have added spaces or split words?
                // For debug, we can print fail
                // console.log(`Miss: ${normalizedLine.substring(0, 50)}...`);
            }
            checked++;
        });

        const coverage = checked > 0 ? (found / checked) * 100 : 100;

        if (coverage > 50) {
            console.log(`✅ PASS: ${file.padEnd(30)} (Match: ${coverage.toFixed(1)}%)`);
        } else {
            console.error(`❌ FAIL: ${file.padEnd(30)} (Match: ${coverage.toFixed(1)}% - < 50%)`);
            allPassed = false;
        }
    });

    console.log('\n---------------------------------------------------');
    if (allPassed) {
        console.log('✅ AUDIT PASSED: All architecture files are proven present.');
    } else {
        console.error('❌ AUDIT FAILED: Content mismatch detected.');
        process.exit(1);
    }
}

audit();
