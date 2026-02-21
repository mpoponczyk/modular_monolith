import { Project, SyntaxKind, JsxOpeningElement, JsxSelfClosingElement } from 'ts-morph';
import path from 'path';

const project = new Project();
project.addSourceFilesAtPaths('/Users/Shared/test_zalew-1/src/app/admin/sessions/**/*.tsx');
project.addSourceFilesAtPaths('/Users/Shared/test_zalew-1/src/components/admin/sessions/**/*.tsx');
project.addSourceFileAtPathIfExists('/Users/Shared/test_zalew-1/src/components/admin/session-table.tsx');

const sourceFiles = project.getSourceFiles();
console.log("Source files loaded:");
sourceFiles.forEach(sf => console.log(sf.getFilePath()));

const dom: string[] = [];
for (const sf of sourceFiles) {
    console.log("\nParsing: " + sf.getFilePath());
    sf.forEachDescendant(node => {
        if (node.getKind() === SyntaxKind.JsxOpeningElement || node.getKind() === SyntaxKind.JsxSelfClosingElement) {
            const el = node as JsxOpeningElement | JsxSelfClosingElement;
            const tagName = el.getTagNameNode().getText();
            console.log("Found tag:", tagName);
            dom.push(tagName);
        }
    });
}
console.log("\nTotal DOM:", dom.join(" > "));
