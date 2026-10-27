import crypto from 'crypto';

const FALLBACK_SECRET = process.env.JWT_SECRET || 'agrorent-ci-fallback-secret-2026';

export interface FallbackTokenPayload {
  sub: string;
  email: string;
  role: string;
  iss: string;
  iat: number;
  exp: number;
}

export function generateFallbackToken(user: { id: string; email: string; role: string }): string {
  const payload: FallbackTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iss: 'agrorent-auth-fallback',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7 // 7 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', FALLBACK_SECRET).update(payloadB64).digest('base64url');
  return `agri_token_${payloadB64}.${signature}`;
}

export function verifyFallbackToken(token: string): FallbackTokenPayload | null {
  if (!token || !token.startsWith('agri_token_')) return null;
  const raw = token.slice('agri_token_'.length);
  const parts = raw.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', FALLBACK_SECRET).update(payloadB64).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as FallbackTokenPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
