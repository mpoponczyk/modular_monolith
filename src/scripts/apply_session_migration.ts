import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

async function run() {
    try {
        const fileToRun = process.argv[2];
        if (!fileToRun) throw new Error('Please provide a migration file path as argument.');

        const envFile = fs.readFileSync('.env.local', 'utf8');
        const match = envFile.match(/DATABASE_URL=([^\n]+)/) || envFile.match(/SUPABASE_DB_URL=([^\n]+)/);
        if (!match) throw new Error('DB URL not found in .env.local');

        let rawUrl = match[1].replace(/['"]/g, '').trim();
        console.log(`Connecting to database to run: ${fileToRun}`);

        const client = new Client({ connectionString: rawUrl, ssl: { rejectUnauthorized: false } });
        await client.connect();

        const sql = fs.readFileSync(fileToRun, 'utf8');
        await client.query(sql);
        console.log(`Migration ${fileToRun} applied successfully.`);
        await client.end();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
