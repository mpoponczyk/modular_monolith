
import fs from 'fs';
import path from 'path';

const DOCS_DIR = path.resolve(process.cwd(), 'docs/architecture');
const OUTPUT_FILE = path.resolve(process.cwd(), 'docs/Modular_monolith_architecture_v0.0.2-prealfa.doc');

const HEADER = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
        <meta charset='utf-8'>
        <title>Modular Monolith Architecture - v0.0.2-prealpha</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.5; }
            h1 { color: #2c3e50; border-bottom: 2px solid #eee; }
            h2 { color: #34495e; margin-top: 20px; }
            h3 { color: #7f8c8d; }
            code { font-family: monospace; }
            pre { background: #f8f9fa; padding: 10px; border: 1px solid #ddd; }
            blockquote { border-left: 4px solid #ddd; padding-left: 10px; color: #777; }
        </style>
    </head>
    <body>
    <div style="text-align:center; padding: 50px;">
        <h1>Modular Monolith Architecture</h1>
        <h2>Documentation Bundle</h2>
        <h3>Release: v0.0.2-prealpha</h3>
    </div>
    <br/><hr/><br/>
`;

const FOOTER = `
    </body>
    </html>
`;

function simpleMarkdownToHtml(markdown: string): string {
    let html = markdown;

    // Headers
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');

    // Code Blocks (Pre)
    html = html.replace(/```([\s\S]*?)```/gm, '<pre>$1</pre>');

    // Inline Code
    html = html.replace(/`([^`]+)`/gm, '<code style="background:#e0e0e0; padding:2px;">$1</code>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gm, '<b>$1</b>');

    // Lists
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');

    // Paragraphs vs Breaks
    // Split by double newline to identify paragraphs
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(p => {
        if (p.trim().startsWith('<h') || p.trim().startsWith('<li') || p.trim().startsWith('<pre')) {
            return p;
        }
        return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('\n<br/>\n');

    return html;
}

function generate() {
    const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md')).sort();

    let content = HEADER;

    files.forEach((file, index) => {
        const filePath = path.join(DOCS_DIR, file);
        const mdContent = fs.readFileSync(filePath, 'utf-8');

        const htmlContent = simpleMarkdownToHtml(mdContent);

        content += `
        <div style="page-break-before: always;"></div>
        <h1>File: ${file}</h1>
        <hr/>
        ${htmlContent}
        `;
    });

    content += FOOTER;

    fs.writeFileSync(OUTPUT_FILE, content);
    console.log(`Generated ${OUTPUT_FILE}`);
}

generate();
