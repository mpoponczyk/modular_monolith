
import dotenv from 'dotenv';
import path from 'path';
import { ResendEmailService } from '../infra/email/ResendEmailService';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function sendFinalTests() {
    console.log('📧 Sending Final 4 Email Variants with Tracking and Delay...');

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY is missing via dotenv.');
        return;
    }

    const emailService = new ResendEmailService();
    const targetEmail = 'mateusz.poponczyk@gmail.com';

    try {
        // 1. English Generic Template
        console.log(`1️⃣ Sending English Template to ${targetEmail}...`);
        const id1 = await emailService.sendAdminEmail(
            targetEmail,
            'Welcome to modMonolith',
            `
            <h2>Welcome Admin</h2>
            <p>This is a standard notification in <strong>English</strong>.</p>
            <p>The system is operating normally.</p>
            <a href="#" class="btn">View Dashboard</a>
            `
        );
        console.log(`✅ Sent! ID: ${id1}`);
        await delay(1000); // Wait 1s to respect rate limit

        // 2. Polish Generic Template
        console.log(`2️⃣ Sending Polish Template to ${targetEmail}...`);
        const id2 = await emailService.sendAdminEmail(
            targetEmail,
            'Witamy w modMonolith',
            `
            <h2>Witaj Administratorze</h2>
            <p>To jest standardowe powiadomienie w języku <strong>Polskim</strong>.</p>
            <p>System działa poprawnie.</p>
            <a href="#" class="btn">Zobacz Panel</a>
            `
        );
        console.log(`✅ Sent! ID: ${id2}`);
        await delay(1000); // Wait 1s

        // 3. English 2FA Code
        console.log(`3️⃣ Sending English 2FA Code to ${targetEmail}...`);
        const id3 = await emailService.sendLoginChallenge(
            targetEmail,
            'mod-monolith-EN',
            '123456',
            'en'
        );
        console.log(`✅ Sent! ID: ${id3}`);
        await delay(1000); // Wait 1s

        // 4. Polish 2FA Code
        console.log(`4️⃣ Sending Polish 2FA Code to ${targetEmail}...`);
        const id4 = await emailService.sendLoginChallenge(
            targetEmail,
            'mod-monolith-PL',
            '654321',
            'pl'
        );
        console.log(`✅ Sent! ID: ${id4}`);

    } catch (e: any) {
        console.error('❌ Failed to send emails:', e.message);
    }
}

sendFinalTests();
