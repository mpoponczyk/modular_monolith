export interface IEmailService {
    sendLoginChallenge(toEmail: string, tenantSlug: string, code: string): Promise<void>;
}
