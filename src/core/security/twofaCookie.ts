import { createHmac } from 'crypto';

interface TwoFaPayload {
    tenantSlug: string;
    userId: string;
    sessionId: string;
    exp: number;
    iat: number;
}

const SECRET = process.env.TWOFA_COOKIE_SECRET || process.env.NEXTAUTH_SECRET;

if (!SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL SECURITY: TWOFA_COOKIE_SECRET is missing in production.');
    }
    console.warn('SECURITY WARNING: Using dev secret for 2FA. Do not use in production.');
}

const USED_SECRET = SECRET || 'dev-secret-do-not-use-in-prod';

export function signTwoFaCookie(payload: TwoFaPayload): string {
    const data = JSON.stringify(payload);
    const signature = createHmac('sha256', USED_SECRET).update(data).digest('hex');
    return `${Buffer.from(data).toString('base64')}.${signature}`;
}

export function verifyTwoFaCookie(token: string): TwoFaPayload | null {
    try {
        const [b64Data, signature] = token.split('.');
        if (!b64Data || !signature) return null;

        const data = Buffer.from(b64Data, 'base64').toString();
        const expectedSignature = createHmac('sha256', USED_SECRET).update(data).digest('hex');

        if (signature !== expectedSignature) return null;

        const payload = JSON.parse(data) as TwoFaPayload;

        // Expiry Check
        if (Date.now() / 1000 > payload.exp) return null;

        return payload;
    } catch (e) {
        return null;
    }
}
