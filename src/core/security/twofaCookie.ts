// mateusz poponczyk

export interface TwoFaPayload {
    tenantId: string;
    tenantSlug: string;
    userId: string;
    sessionId: string;
    exp: number;
    iat: number;
}

// 1. SECRET HANDLING (STRICT)
const RAW_SECRET = process.env.TWOFA_COOKIE_SECRET;
const DEV_SECRET = 'dev-secret-do-not-use-in-prod';

// Throw in production if secret is missing
if (!RAW_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY: TWOFA_COOKIE_SECRET is missing in production.');
}

const USED_SECRET = RAW_SECRET ?? DEV_SECRET;

// 2. ENCODING HELPERS
// 2. ENCODING HELPERS (Web Standard)
function toBase64Url(str: string): string {
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): string {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = str.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    return atob(padded);
}

async function getSecretKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    return crypto.subtle.importKey(
        'raw',
        encoder.encode(USED_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

// Hex conversion helpers
function bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

function hexToBuffer(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

/**
 * Sign a 2FA Cookie (Async)
 * Format: <base64url(jsonData)>.<hexSignature>
 */
export async function signTwoFaCookie(payload: TwoFaPayload): Promise<string> {
    const data = JSON.stringify(payload);
    const key = await getSecretKey();
    const encoder = new TextEncoder();

    // Requirement 2: Signature part is HEX string of HMAC-SHA256
    const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(data)
    );

    const signatureHex = bufferToHex(signatureBuffer);
    return `${toBase64Url(data)}.${signatureHex}`;
}

/**
 * Verify a 2FA Cookie (Async)
 * Checks signature (constant-time via SubteCrypto) and payload validity
 */
export async function verifyTwoFaCookie(token: string): Promise<TwoFaPayload | null> {
    try {
        const parts = token.split('.');
        if (parts.length !== 2) return null;

        const [b64Data, signatureHex] = parts;
        if (!b64Data || !signatureHex) return null;

        // Verify Signature using Web Crypto (Handles timing safety)
        const key = await getSecretKey();
        const encoder = new TextEncoder();
        const data = fromBase64Url(b64Data);

        let signatureBytes: Uint8Array;
        try {
            signatureBytes = hexToBuffer(signatureHex);
        } catch {
            return null;
        }

        const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            signatureBytes as unknown as BufferSource,
            encoder.encode(data)
        );

        if (!isValid) return null;

        const payload = JSON.parse(data);

        // Requirement 5: Strict Payload Validation
        if (
            typeof payload.tenantId !== 'string' ||
            typeof payload.tenantSlug !== 'string' ||
            typeof payload.userId !== 'string' ||
            typeof payload.sessionId !== 'string' ||
            typeof payload.exp !== 'number' ||
            typeof payload.iat !== 'number'
        ) {
            return null;
        }

        // UUID Format Check (Simple Regex)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(payload.tenantId)) return null;
        if (!uuidRegex.test(payload.userId)) return null;
        if (!uuidRegex.test(payload.sessionId)) return null;

        const now = Date.now() / 1000;

        // Logical Checks
        // 1. Expired
        if (now > payload.exp) return null;

        // 2. Issued in Future (Skew check)
        if (payload.iat > now + 30) return null;

        // 3. Expiry before Issue
        if (payload.exp <= payload.iat) return null;

        // 4. Max Duration check (24h)
        if (payload.exp - payload.iat > 24 * 60 * 60) return null;

        return payload as TwoFaPayload;

    } catch (e) {
        return null;
    }
}
