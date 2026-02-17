
import dotenv from 'dotenv';
import path from 'path';
import { Resend } from 'resend';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkStatus() {
    console.log('🔍 Checking Email Status...');

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY is missing');
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailId = '5ea8f58b-2d84-42ae-848d-2da08d0607ef'; // ID from previous debug run

    try {
        const data = await resend.emails.get(emailId);
        console.log('📄 Email Status:', JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error('❌ Failed to get status:', e.message);
    }
}

checkStatus();
