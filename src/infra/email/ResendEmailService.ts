// mateusz poponczyk
import { Resend } from 'resend';
import { IEmailService } from '@/core/application/ports/IEmailService';

// Ensure RESEND_API_KEY is available in environment
const resend = new Resend(process.env.RESEND_API_KEY);

export class ResendEmailService implements IEmailService {
    async sendLoginChallenge(toEmail: string, tenantSlug: string, code: string): Promise<void> {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY missing. Printing code to console:', code);
            return;
        }

        try {
            await resend.emails.send({
                from: 'Admin <onboarding@resend.dev>', // Or configured domain
                to: toEmail,
                subject: `Your Login Code for ${tenantSlug}`,
                html: `
                    <p>Your login code for tenant <strong>${tenantSlug}</strong> is:</p>
                    <h2>${code}</h2>
                    <p>This code expires in 5 minutes.</p>
                `
            });
        } catch (error) {
            console.error('Failed to send email:', error);
            throw new Error('Failed to send email challenge');
        }
    }
}
