const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        // Check what is currently running
        const sql = `
      SELECT pid, state, wait_event_type, wait_event, query, query_start, now() - query_start AS duration
      FROM pg_stat_activity
      WHERE state = 'active' AND pid <> pg_backend_pid();
    `;
        const result = await client.query(sql);
        console.table(result.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
