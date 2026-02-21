import { moduleRegistry } from '../core/moduleRegistry';

async function testTranslations() {
    console.log("Testing Translations for 'core-admin-users'...");
    const mod = moduleRegistry.getModule('core-admin-users');

    if (!mod) {
        console.log("Module not found!");
        return;
    }

    if (!mod.getTranslations) {
        console.log("Module has no getTranslations method!");
        return;
    }

    try {
        const en = await mod.getTranslations('en');
        console.log("EN ->", en);
    } catch (e) {
        console.error("Failed EN:", e);
    }

    try {
        const pl = await mod.getTranslations('pl');
        console.log("PL ->", pl);
    } catch (e) {
        console.error("Failed PL:", e);
    }
}

testTranslations().catch(console.error);
