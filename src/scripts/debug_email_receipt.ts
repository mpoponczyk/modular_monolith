
import dotenv from 'dotenv';
import path from 'path';
import { Resend } from 'resend';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugSend() {
    console.log('🔍 Debugging Resend Email Delivery...');

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY is missing in .env.local');
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const targetEmail = 'mateusz.poponczyk@gmail.com';

    console.log(`📨 Attempting to send to: ${targetEmail}`);

    try {
        const data = await resend.emails.send({
            from: 'Admin <onboarding@resend.dev>',
            to: targetEmail,
            subject: 'Debug Email Delivery Test',
            html: '<p>If you see this, the API key is working.</p>'
        });

        console.log('✅ API Response:', JSON.stringify(data, null, 2));

        if (data.error) {
            console.error('⚠️ API returned an error object:', data.error);
        } else {
            console.log('🚀 Email reportedly sent. Check Resend Dashboard logs if not received.');
        }

    } catch (e: any) {
        console.error('❌ Exception during send:', e.message);
        console.error(e);
    }
}

debugSend();
