import crypto from 'crypto';

/**
 * Lista de domínios autorizados para onde o navegador do usuário pode ser redirecionado.
 */
const ALLOWED_MERCADO_PAGO_HOSTS = [
  'mercadopago.com',
  'mercadopago.com.br',
  'sandbox.mercadopago.com.br',
  'www.mercadopago.com.br',
  'www.mercadopago.com',
];

/**
 * Valida se a URL de redirecionamento fornecida pela API de Preferências pertence aos domínios oficiais do Mercado Pago.
 */
export function isValidMercadoPagoRedirectUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_MERCADO_PAGO_HOSTS.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
    );
  } catch {
    return false;
  }
}

/**
 * Executa comparação em tempo constante de strings para prevenir timing attacks.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Mascara e-mails para logs seguros em observabilidade (ex.: c***@email.com).
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') return '[NO_EMAIL]';
  const parts = email.split('@');
  if (parts.length !== 2) return '[INVALID_EMAIL]';
  const user = parts[0];
  const domain = parts[1];
  const maskedUser =
    user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : `${user[0] || ''}***`;
  return `${maskedUser}@${domain}`;
}

/**
 * Mascara CPF ocultando a maior parte dos dígitos.
 */
export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return '[NO_CPF]';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return '***.***.***-**';
  return `***.${clean.slice(3, 6)}.***-${clean.slice(9, 11)}`;
}

/**
 * Trunca identificadores para logs sem expor IDs completos quando não necessário.
 */
export function maskIdentifier(id: string | null | undefined): string {
  if (!id) return '[NONE]';
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}

/**
 * Sanitiza mensagens do provedor removendo tokens, e-mails ou dados confidenciais.
 */
export function sanitizeProviderMessage(msg: string | null | undefined): string {
  if (!msg || typeof msg !== 'string') return '';
  return msg
    .replace(/(?:TEST|APP_USR)-[a-zA-Z0-9_-]+/gi, '[REDACTED_TOKEN]')
    .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[REDACTED_EMAIL]')
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]')
    .slice(0, 300);
}

/**
 * Extrai apenas a origem e o pathname de uma URL, descartando query params e hash.
 */
export function extractOriginAndPath(urlStr: string | null | undefined): string | undefined {
  if (!urlStr || typeof urlStr !== 'string') return undefined;
  try {
    const parsed = new URL(urlStr);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return '[INVALID_URL]';
  }
}

/**
 * Extrai apenas a origem de uma URL (ex.: https://www.mercadopago.com.br).
 */
export function extractOrigin(urlStr: string | null | undefined): string | undefined {
  if (!urlStr || typeof urlStr !== 'string') return undefined;
  try {
    const parsed = new URL(urlStr);
    return parsed.origin;
  } catch {
    return '[INVALID_URL]';
  }
}

/**
 * Trunca o hash SHA-256 de uma string para observabilidade sem expor o identificador bruto.
 */
export function truncateHash(val: string | null | undefined): string | undefined {
  if (!val || typeof val !== 'string') return undefined;
  return crypto.createHash('sha256').update(val).digest('hex').slice(0, 8);
}

