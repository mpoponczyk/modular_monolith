
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function inspect() {
    await client.connect();

    // Inspect organization_section_items Columns
    console.log('\n--- ORGANIZATION_SECTION_ITEMS ---');
    const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organization_section_items'");
    console.table(cols.rows);

    // Inspect Constraints for organization_section_items to see FKs
    const cons = await client.query(`
        SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'organization_section_items'
    `);
    console.table(cons.rows.map(r => ({
        col: r.column_name,
        fk_table: r.foreign_table_name,
        fk_col: r.foreign_column_name
    })));

    await client.end();
}

inspect();
