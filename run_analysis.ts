
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
    const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("No DB URL found");
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to DB");

        const sql = fs.readFileSync('/Users/Shared/Modular_Monolith/explain_queries.sql', 'utf-8');

        // Split by semicolon to run multiple queries contextually, but pg might not support multiple statements in one go for EXPLAIN?
        // Let's run them one by one.
        const queries = sql.split(';').filter(q => q.trim().length > 0);

        for (const q of queries) {
            console.log("---------------------------------------------------");
            console.log("Running Query Analysis:");
            // console.log(q.trim()); 
            const res = await client.query(q);
            console.log("PLAN:");
            res.rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
        }

    } catch (e) {
        console.error("Analysis failed:", e);
    } finally {
        await client.end();
    }
}

main();
