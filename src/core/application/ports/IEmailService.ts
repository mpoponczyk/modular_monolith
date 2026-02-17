// mateusz poponczyk
export interface IEmailService {
    sendLoginChallenge(toEmail: string, tenantSlug: string, code: string, locale?: string): Promise<string | null>;

}
