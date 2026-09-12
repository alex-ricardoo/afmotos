/**
 * Centralized Structured Payment Logger for Mercado Pago & Vehicle Consultation
 *
 * Complies with strict privacy rules:
 * - NEVER logs credit card numbers, CVVs, tokens, complete CPFs, complete emails, complete addresses, or secrets.
 * - Produces structured JSON objects compatible with Vercel Runtime Logs.
 * - Enables correlation across flowId, requestId, consultationId, transactionId, externalReference, and mpPaymentId.
 */

export interface PaymentLogContext {
  flowId?: string;
  requestId?: string;
  consultationId?: string;
  transactionId?: string;
  externalReference?: string;
  mercadoPagoPaymentId?: string;
  mercadoPagoRefundId?: string;
  userId?: string;
  userEmailMasked?: string;
  plate?: string;

  paymentMethodId?: string;
  paymentTypeId?: string;
  installments?: number;
  issuerProvided?: boolean;
  tokenPresent?: boolean;

  amount?: number;
  canonicalAmount?: number;
  currency?: string;

  lookupMode?: 'mock' | 'live';
  lookupProvider?: 'mock' | 'apibrasil';

  eventType?: string;
  webhookEventId?: string;
  webhookSignaturePresent?: boolean;
  webhookSignatureValid?: boolean;

  statusBefore?: string | null;
  statusAfter?: string | null;
  reason?: string;

  providerStatus?: number | string | null;
  providerStatusDetail?: string | null;
  providerMessage?: string | null;
  providerError?: string | null;
  causeCount?: number | null;
  causesSummary?: string[];

  errorCode?: string | null;
  errorMessage?: string | null;

  table?: string;
  operation?: string;

  addressPresent?: boolean;
  addressCompleteness?: {
    zipCode: boolean;
    streetName: boolean;
    streetNumber: boolean;
    neighborhood: boolean;
    city: boolean;
    federalUnit: boolean;
  };

  cpfPresent?: boolean;
  cpfLength?: number;

  durationMs?: number;
  environment?: 'development' | 'preview' | 'production' | 'test';

  [key: string]: unknown;
}

/**
 * Masks an email address: e.g. alex.ricardo1999@hotmail.com -> al***@hotmail.com
 */
export function maskEmail(email?: string | null): string | undefined {
  if (!email || typeof email !== 'string') return undefined;
  const parts = email.trim().split('@');
  if (parts.length !== 2) return '***@***';
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local.charAt(0)}***@${domain}`;
  }
  return `${local.substring(0, 2)}***@${domain}`;
}

/**
 * Masks a CPF or returns only metadata (presence and length)
 */
export function maskCpfMeta(cpf?: string | null): { cpfPresent: boolean; cpfLength: number } {
  if (!cpf || typeof cpf !== 'string') {
    return { cpfPresent: false, cpfLength: 0 };
  }
  const clean = cpf.replace(/\D/g, '');
  return { cpfPresent: clean.length > 0, cpfLength: clean.length };
}

/**
 * List of forbidden keys that must NEVER appear in logs
 */
const FORBIDDEN_KEYS = new Set([
  'token',
  'card_token',
  'cardtoken',
  'security_code',
  'cvv',
  'cvc',
  'card_number',
  'cardnumber',
  'card',
  'authorization',
  'access_token',
  'accesstoken',
  'mp_access_token',
  'mercado_pago_access_token',
  'webhook_secret',
  'mp_webhook_secret',
  'mercado_pago_webhook_secret',
  'apibrasil_token',
  'api_brasil_token',
  'supabase_service_role_key',
  'jwt',
  'cookie',
  'cookies',
  'x-signature',
  'xsignature',
  'signature',
  'password',
  'secret',
  'raw_payload',
  'rawpayload',
  'full_name',
  'first_name',
  'last_name',
  'street_name',
  'street_number',
  'zip_code',
  'identification_number',
  'number',
]);

/**
 * Recursively sanitizes an object to remove any sensitive or secret fields.
 */
export function sanitizeContext(data: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Block forbidden keys
    if (FORBIDDEN_KEYS.has(lowerKey)) {
      continue;
    }

    // Email masking
    if (lowerKey.includes('email') && typeof value === 'string') {
      safe[key] = maskEmail(value);
      continue;
    }

    // CPF masking (do not treat identification 'type' as a numeric document)
    if (
      (lowerKey.includes('cpf') || lowerKey.includes('identification')) &&
      !lowerKey.includes('type') &&
      typeof value === 'string'
    ) {
      const clean = value.replace(/\D/g, '');
      safe[`${key}Present`] = clean.length > 0;
      safe[`${key}Length`] = clean.length;
      continue;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      safe[key] = sanitizeContext(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      safe[key] = value.map((item) =>
        item && typeof item === 'object' ? sanitizeContext(item as Record<string, unknown>) : item,
      );
    } else {
      safe[key] = value;
    }
  }

  return safe;
}

/**
 * Normalizes Mercado Pago SDK / provider error into a safe diagnostic object.
 */
export function extractSafeError(error: unknown): {
  providerStatus: number | null;
  providerMessage: string;
  providerError: string | null;
  causeCount: number | null;
  causesSummary?: string[];
  errorCode?: string | null;
} {
  if (!error) {
    return {
      providerStatus: null,
      providerMessage: 'unknown_error',
      providerError: null,
      causeCount: null,
    };
  }

  let providerStatus: number | null = null;
  let providerMessage = 'unknown_error';
  let providerError: string | null = null;
  let causeCount: number | null = null;
  const causesSummary: string[] = [];
  let errorCode: string | null = null;

  if (error instanceof Error) {
    providerMessage = error.message;
    errorCode = error.name;

    const anyErr = error as unknown as Record<string, unknown>;
    if ('status' in anyErr && !isNaN(Number(anyErr.status))) {
      providerStatus = Number(anyErr.status);
    }
    if ('error' in anyErr && anyErr.error) {
      providerError = String(anyErr.error);
    }
    if ('causes' in anyErr && Array.isArray(anyErr.causes)) {
      causeCount = anyErr.causes.length;
      anyErr.causes.forEach((c: unknown) => {
        if (typeof c === 'string') {
          causesSummary.push(c);
        } else if (c && typeof c === 'object') {
          const item = c as Record<string, unknown>;
          const code = item.code ? `code:${String(item.code)}` : '';
          const desc = item.description ? `desc:${String(item.description)}` : '';
          causesSummary.push([code, desc].filter(Boolean).join(' ') || 'unknown_cause');
        }
      });
    }
  } else if (typeof error === 'object' && error !== null) {
    const anyObj = error as Record<string, unknown>;
    providerMessage = typeof anyObj.message === 'string' ? anyObj.message : 'non_error_object';
    if (anyObj.status && !isNaN(Number(anyObj.status))) {
      providerStatus = Number(anyObj.status);
    }
    if (anyObj.error) {
      providerError = String(anyObj.error);
    }
    if (Array.isArray(anyObj.causes)) {
      causeCount = anyObj.causes.length;
      anyObj.causes.forEach((c: unknown) => {
        if (typeof c === 'string') {
          causesSummary.push(c);
        } else if (c && typeof c === 'object') {
          const item = c as Record<string, unknown>;
          const code = item.code ? `code:${String(item.code)}` : '';
          const desc = item.description ? `desc:${String(item.description)}` : '';
          causesSummary.push([code, desc].filter(Boolean).join(' ') || 'unknown_cause');
        }
      });
    }
  } else {
    providerMessage = String(error);
  }

  return {
    providerStatus,
    providerMessage,
    providerError,
    causeCount,
    causesSummary: causesSummary.length > 0 ? causesSummary : undefined,
    errorCode,
  };
}

function getEnvironment(): 'development' | 'preview' | 'production' | 'test' {
  if (process.env.NODE_ENV === 'test') return 'test';
  if (process.env.VERCEL_ENV === 'production') return 'production';
  if (process.env.VERCEL_ENV === 'preview') return 'preview';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'development';
}

function logOutput(level: 'info' | 'warn' | 'error', event: string, context: PaymentLogContext) {
  const safeContext = sanitizeContext(context as Record<string, unknown>);
  const logEntry = {
    service: 'afmotos-payment',
    event,
    timestamp: new Date().toISOString(),
    environment: getEnvironment(),
    ...safeContext,
  };

  const serialized = JSON.stringify(logEntry);

  if (level === 'error') {
    console.error(serialized);
  } else if (level === 'warn') {
    console.warn(serialized);
  } else {
    console.info(serialized);
  }
}

export function paymentLogInfo(event: string, context: PaymentLogContext): void {
  logOutput('info', event, context);
}

export function paymentLogWarn(event: string, context: PaymentLogContext): void {
  logOutput('warn', event, context);
}

export function paymentLogError(event: string, context: PaymentLogContext): void {
  logOutput('error', event, context);
}
