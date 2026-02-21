import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
    await client.connect();

    // Check columns
    const resApps = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'organization_app_translations';
    `);

    console.log("organization_app_translations columns:");
    console.table(resApps.rows);

    const resSections = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'organization_section_translations';
    `);

    console.log("organization_section_translations columns:");
    console.table(resSections.rows);

    await client.end();
}
run();
