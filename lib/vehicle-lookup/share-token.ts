import crypto from 'crypto';

export const SHARE_TOKEN_PREFIX = 'vt_';
export const TOKEN_BYTES = 32; // 256 bits of entropy

/**
 * Generates a cryptographically secure, URL-safe random token for public vehicle report sharing.
 * Example format: vt_8hD2kLm9... (~46 chars)
 */
export function generateShareToken(): string {
  const randomBytes = crypto.randomBytes(TOKEN_BYTES);
  const base64UrlString = randomBytes.toString('base64url');
  return `${SHARE_TOKEN_PREFIX}${base64UrlString}`;
}

/**
 * Computes deterministic SHA-256 hash of the share token for safe persistence in database.
 * Returns 64 lowercase hexadecimal characters.
 */
export function hashShareToken(token: string): string {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token provided for hashing');
  }
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Validates that a string matches the required share token format.
 */
export function isValidShareToken(token: unknown): token is string {
  if (typeof token !== 'string') return false;
  const trimmed = token.trim();
  if (!trimmed.startsWith(SHARE_TOKEN_PREFIX)) return false;
  
  const payload = trimmed.slice(SHARE_TOKEN_PREFIX.length);
  // Base64url without padding for 32 bytes yields exactly 43 characters
  if (payload.length < 40 || payload.length > 50) return false;
  
  // Base64url charset: A-Z, a-z, 0-9, -, _
  return /^[A-Za-z0-9_-]+$/.test(payload);
}

/**
 * Anonymizes client IP address using a salt for GDPR / LGPD compliance.
 */
export function hashClientIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.SHARE_AUDIT_SALT || 'afmotos-share-ip-salt-2026';
  return crypto.createHash('sha256').update(`${ip}-${salt}`).digest('hex');
}
