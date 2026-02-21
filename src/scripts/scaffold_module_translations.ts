import fs from 'fs';
import path from 'path';

const MODULES_DIR = path.join(process.cwd(), 'src', 'modules');

const getTranslationInjectCode = () => `    getTranslations: async (locale: string) => {
        try {
            return (await import(\`./locales/\${locale}.json\`)).default;
        } catch {
            return null;
        }
    }`;

async function scaffoldTranslations() {
    const modules = fs.readdirSync(MODULES_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    let updatedCount = 0;

    for (const modName of modules) {
        // Skip core-admin modules as they already have it
        if (modName.startsWith('core-admin')) continue;

        const modPath = path.join(MODULES_DIR, modName);
        const indexTsPath = path.join(modPath, 'index.ts');
        const localesDir = path.join(modPath, 'locales');

        if (!fs.existsSync(indexTsPath)) continue;

        // 1. Create locales folder
        if (!fs.existsSync(localesDir)) {
            fs.mkdirSync(localesDir, { recursive: true });
        }

        // 2. Generate en.json and pl.json if missing
        const humanName = modName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        const enJsonPath = path.join(localesDir, 'en.json');
        if (!fs.existsSync(enJsonPath)) {
            fs.writeFileSync(enJsonPath, JSON.stringify({
                name: humanName,
                description: `Access the ${humanName} module.`
            }, null, 4));
        }

        const plJsonPath = path.join(localesDir, 'pl.json');
        if (!fs.existsSync(plJsonPath)) {
            fs.writeFileSync(plJsonPath, JSON.stringify({
                name: humanName,
                description: `Dostęp do modułu ${humanName}.`
            }, null, 4));
        }

        // 3. Inject getTranslations into index.ts
        let indexContent = fs.readFileSync(indexTsPath, 'utf-8');

        // Check if it already has getTranslations
        if (!indexContent.includes('getTranslations:')) {
            // Find the end of the ModuleDefinition object (usually ends with '};\n')
            // This is a naive but effective regex for our specific scaffolding format
            const regex = /routes:\s*\[[\s\S]*?\]\s*\n\s*};\n/g;
            const match = regex.exec(indexContent);

            if (match) {
                // We add it right before the last closing brace of the module definition
                indexContent = indexContent.replace(/routes:\s*\[([\s\S]*?)\]\n\s*};\n/g,
                    (full, inner) => `routes: [\n${inner}\n    ],\n${getTranslationInjectCode()}\n};\n`);

                // Fallback simpler replacement if the above fails formatting check
                if (!indexContent.includes('getTranslations:')) {
                    indexContent = indexContent.replace(/};\n?$/, `,\n${getTranslationInjectCode()}\n};\n`);
                }

                fs.writeFileSync(indexTsPath, indexContent);
                console.log(`✅ Patched: ${modName}`);
                updatedCount++;
            } else {
                console.log(`⚠️  Could not patch ${modName} via Regex. Try fallback.`);
                // Fallback
                const fallbackRegex = /};\n*$/g;
                if (fallbackRegex.test(indexContent)) {
                    indexContent = indexContent.replace(fallbackRegex, `,\n${getTranslationInjectCode()}\n};\n`);
                    fs.writeFileSync(indexTsPath, indexContent);
                    console.log(`✅ Patched fallback: ${modName}`);
                    updatedCount++;
                }
            }
        } else {
            console.log(`ℹ️  Skipped (Already has getTranslations): ${modName}`);
        }
    }

    console.log(`Finished processing. Updated ${updatedCount} modules.`);
}

scaffoldTranslations().catch(console.error);
