import { Resend } from 'resend';
import { IEmailService } from '@/core/application/ports/IEmailService';
import { getAdminEmailTemplate } from './templates/AdminEmailTemplate';

export class ResendEmailService implements IEmailService {

    async sendLoginChallenge(toEmail: string, tenantSlug: string, code: string, locale: string = 'en'): Promise<string | null> {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY missing. Printing code to console:', code);
            return null;
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        const t = {
            en: {
                subject: 'Security Alert: Login Attempt',
                title: 'Security Verification',
                login_attempt: `We observed a login attempt to your account for <strong>modMonolith</strong>.`,
                code_instruction: 'Below is your verification code:',
                warning: 'If you did not attempt to sign in, please contact the system administrator immediately.'
            },
            pl: {
                subject: 'Alert Bezpieczeństwa: Próba Logowania',
                title: 'Weryfikacja Bezpieczeństwa',
                login_attempt: `Zaobserwowaliśmy próbę logowania na Twoje konto do systemu <strong>modMonolith</strong>.`,
                code_instruction: 'Poniżej znajduje się Twój kod weryfikacyjny:',
                warning: 'Jeśli to nie Ty próbowałeś się zalogować, skontaktuj się natychmiast z administratorem systemu.'
            }
        };

        const dict = (t as any)[locale] || t.en;

        const htmlContent = `
            <h2>${dict.title}</h2>
            <p>${dict.login_attempt}</p>
            <p>${dict.code_instruction}</p>
            <div class="code-block">${code}</div>
            <p class="warning-text">${dict.warning}</p>
        `;

        // No image attachment, using CSS header
        const finalHtml = getAdminEmailTemplate(htmlContent, dict.subject);

        try {
            const { data, error } = await resend.emails.send({
                from: 'Admin <onboarding@resend.dev>',
                to: toEmail,
                subject: dict.subject,
                html: finalHtml,
                // No attachments
            });

            if (error) {
                console.error('Failed to send email:', error);
                throw new Error('Failed to send email challenge');
            }
            return data?.id || null;
        } catch (error) {
            console.error('Failed to send email:', error);
            throw new Error('Failed to send email challenge');
        }
    }

    async sendAdminEmail(toEmail: string, subject: string, htmlBody: string): Promise<string | null> {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY missing.');
            return null;
        }
        const resend = new Resend(process.env.RESEND_API_KEY);

        const finalHtml = getAdminEmailTemplate(htmlBody, subject);

        try {
            const { data, error } = await resend.emails.send({
                from: 'Admin <onboarding@resend.dev>',
                to: toEmail,
                subject: subject,
                html: finalHtml,
                // No attachments
            });

            if (error) {
                console.error('Failed to send admin email:', error);
                throw error;
            }
            return data?.id || null;
        } catch (error) {
            console.error('Failed to send admin email:', error);
            throw error;
        }
    }
}
