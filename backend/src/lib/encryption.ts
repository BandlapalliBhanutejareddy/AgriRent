import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET = process.env.BANK_ENCRYPTION_KEY || process.env.JWT_SECRET || 'agrorent-secure-financial-vault-key-32b';
// Derive a 32-byte key consistently via SHA-256
const KEY = crypto.createHash('sha256').update(SECRET).digest();

/**
 * Encrypt sensitive financial data (e.g. account numbers) using AES-256-GCM
 */
export function encryptFinancialData(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt sensitive financial data using AES-256-GCM
 */
export function decryptFinancialData(encryptedPayload: string): string | null {
  try {
    const [ivHex, authTagHex, encryptedText] = encryptedPayload.split(':');
    if (!ivHex || !authTagHex || !encryptedText) return null;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

