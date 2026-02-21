const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    await client.connect();
    const res = await client.query(`
    SELECT relname as table_name, n_live_tup::numeric as row_count
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC
  `);
    console.table(res.rows);
    await client.end();
}

main().catch(console.error);
