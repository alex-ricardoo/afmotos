import crypto from 'crypto';

/**
 * Calculates deterministic SHA-256 hash of legal document text for integrity proof.
 * Returns 64 lowercase hexadecimal characters.
 */
export function calculateContentHash(content: string): string {
  if (!content || typeof content !== 'string') {
    throw new Error('Conteúdo inválido para cálculo de hash');
  }
  // Normalize line endings to avoid CRLF vs LF hash divergence
  const normalized = content.replace(/\r\n/g, '\n').trim();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Anonymizes client IP address using a salt for GDPR / LGPD compliance.
 * Never logs or returns raw IP.
 */
export function hashClientIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  // Take first IP if comma-separated from proxy/load balancer
  const cleanIp = ip.split(',')[0].trim();
  const salt = process.env.LEGAL_AUDIT_SALT || 'afmotos-legal-audit-salt-2026';
  return crypto.createHash('sha256').update(`${cleanIp}-${salt}`).digest('hex');
}

/**
 * Categorizes User-Agent header into high-level categories to avoid excessive fingerprinting.
 */
export function categorizeUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();

  const isMobile = /android|iphone|ipod|mobile/.test(ua);
  const isTablet = /ipad|tablet/.test(ua);

  let browser = 'other';
  if (/edg\//.test(ua)) browser = 'edge';
  else if (/chrome\//.test(ua)) browser = 'chrome';
  else if (/safari\//.test(ua) && !/chrome\//.test(ua)) browser = 'safari';
  else if (/firefox\//.test(ua)) browser = 'firefox';

  const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
  return `${device}-${browser}`;
}

/**
 * Generates an official LGPD protocol number (e.g. LGPD-202609-AB12).
 */
export function generateProtocolNumber(): string {
  const now = new Date();
  const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `LGPD-${yearMonth}-${randomHex}`;
}
