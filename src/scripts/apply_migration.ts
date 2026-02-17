import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54321/postgres';

async function applyMigration(file: string) {
    const filePath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log(`Applying ${file}...`);
        await client.query(sql);
        console.log('✅ Success!');
    } catch (e) {
        console.error('❌ Error:', e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: tsx apply_migration.ts <file>');
    process.exit(1);
}

applyMigration(args[0]);
