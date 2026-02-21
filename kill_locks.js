const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        console.log("Terminating blocking PIDs...");
        await client.query("SELECT pg_terminate_backend(320862)");
        console.log("Terminated 320862");
        await client.query("SELECT pg_terminate_backend(325427)");
        console.log("Terminated 325427");
        await client.query("SELECT pg_terminate_backend(328642)");
        console.log("Terminated 328642 (My cleanup script)");
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
