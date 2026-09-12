import crypto from 'crypto';
import { validateMercadoPagoEnvironment, getSafeCredentialFingerprint } from './credentials.ts';

export interface MercadoPagoPaymentRequestSnapshot {
  snapshotId: string;
  timestamp: string;
  flowId?: string;
  sdkVersion: string;
  environment: {
    nodeEnv: string;
    vercelEnv: string;
  };
  credentials: {
    mode: 'test' | 'production' | 'invalid' | 'missing';
    publicKeyFingerprint: string | null;
    accessTokenFingerprint: string | null;
  };
  request: {
    transaction_amount: {
      type: string;
      value: unknown;
    };
    token: {
      present: boolean;
      type: string;
      length: number;
      hashTruncated: string | null;
      ageMs: number | null;
    };
    payment_method_id?: unknown;
    payment_type_id?: unknown;
    installments: {
      type: string;
      value: unknown;
    };
    issuer: {
      present: boolean;
      type: string;
      maskedValue: string | null;
      origin: 'brick' | 'omitted' | 'unknown';
    };
    payer: {
      email: {
        present: boolean;
        domainOrHash: string | null;
      };
      identification: {
        type: string | null;
        digitCount: number;
      };
      address: {
        present: boolean;
        keysPresent: string[];
      };
    };
    description: {
      present: boolean;
      length: number;
    };
    external_reference: {
      present: boolean;
      length: number;
      hashTruncated: string | null;
    };
    metadata: {
      present: boolean;
      keysAndTypes: Array<{ key: string; type: string }>;
    };
    notification_url: {
      present: boolean;
      originAndPath: string | null;
    };
    nullPaths: string[];
    undefinedPaths: string[];
    bodyKeys: string[];
    requestOptionsKeys: string[];
    idempotency: {
      present: boolean;
      hashTruncated: string | null;
      fieldUsed: 'requestOptions.idempotencyKey' | 'none';
    };
  };
}

export interface SnapshotContext {
  flowId?: string;
  consultationId?: string;
  tokenCreatedAt?: number;
  submitAttemptNumber?: number;
  paymentTypeId?: string;
  issuerProvidedByBrick?: boolean;
  issuerSource?: 'brick' | 'omitted' | 'unknown';
  rawUncleanedBody?: Record<string, unknown>;
}

/**
 * Finds all paths in an object that have null or undefined values.
 */
function findNullAndUndefinedPaths(
  obj: unknown,
  prefix = '',
): { nullPaths: string[]; undefinedPaths: string[] } {
  const nullPaths: string[] = [];
  const undefinedPaths: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return { nullPaths, undefinedPaths };
  }

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (value === null) {
      nullPaths.push(currentPath);
    } else if (value === undefined) {
      undefinedPaths.push(currentPath);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = findNullAndUndefinedPaths(value, currentPath);
      nullPaths.push(...nested.nullPaths);
      undefinedPaths.push(...nested.undefinedPaths);
    }
  }

  return { nullPaths, undefinedPaths };
}

/**
 * Creates a strictly sanitized, secure snapshot of the exact request payload and options
 * sent to the Mercado Pago SDK (Payment.create).
 *
 * NEVER exposes tokens, complete CPFs, emails, card data, or secret keys.
 */
export function createMercadoPagoPaymentRequestSnapshot(
  body: Record<string, unknown>,
  requestOptions?: { idempotencyKey?: string; [key: string]: unknown },
  context: SnapshotContext = {},
): MercadoPagoPaymentRequestSnapshot {
  const snapshotId = `snap_${crypto.randomUUID()}`;
  const now = new Date();
  const envValidation = validateMercadoPagoEnvironment();

  // Find null and undefined paths from raw body (or current body)
  const sourceForInspection = context.rawUncleanedBody || body;
  const { nullPaths, undefinedPaths } = findNullAndUndefinedPaths(sourceForInspection);

  // Compute secure token metadata
  const tokenVal = body.token;
  const isTokenString = typeof tokenVal === 'string';
  const tokenPresent = Boolean(tokenVal) && isTokenString && tokenVal.trim().length > 0;
  const tokenHashTruncated =
    tokenPresent && isTokenString
      ? crypto.createHash('sha256').update(tokenVal).digest('hex').substring(0, 12)
      : null;

  const tokenAgeMs =
    context.tokenCreatedAt && Number.isFinite(context.tokenCreatedAt)
      ? Math.max(0, now.getTime() - context.tokenCreatedAt)
      : null;

  // Compute secure issuer metadata
  const issuerVal = body.issuer_id;
  const hasIssuer = Boolean(issuerVal);
  let maskedIssuer: string | null = null;
  if (hasIssuer) {
    const str = String(issuerVal);
    maskedIssuer = str.length > 2 ? `***${str.slice(-2)}` : '***';
  }

  // Compute secure payer metadata
  const payerObj = (body.payer && typeof body.payer === 'object' ? body.payer : {}) as Record<
    string,
    unknown
  >;
  const emailVal = payerObj.email;
  let emailDomainOrHash: string | null = null;
  if (typeof emailVal === 'string' && emailVal.trim().length > 0) {
    if (emailVal.includes('@')) {
      emailDomainOrHash = `@${emailVal.split('@')[1]}`;
    } else {
      emailDomainOrHash = crypto
        .createHash('sha256')
        .update(emailVal)
        .digest('hex')
        .substring(0, 8);
    }
  }

  const identObj = (
    payerObj.identification && typeof payerObj.identification === 'object'
      ? payerObj.identification
      : {}
  ) as Record<string, unknown>;
  const identNumber = typeof identObj.number === 'string' ? identObj.number : '';
  const digitCount = identNumber.replace(/\D/g, '').length;

  const addressObj = payerObj.address;
  const hasAddress = Boolean(addressObj) && typeof addressObj === 'object';
  const addressKeysPresent = hasAddress ? Object.keys(addressObj as Record<string, unknown>) : [];

  // Description metadata
  const descVal = body.description;
  const descLength = typeof descVal === 'string' ? descVal.length : 0;

  // External reference metadata
  const extRef = body.external_reference;
  const isExtRefString = typeof extRef === 'string';
  const extRefHashTruncated =
    isExtRefString && extRef.length > 0
      ? crypto.createHash('sha256').update(extRef).digest('hex').substring(0, 8)
      : null;

  // Metadata keys and types
  const metadataObj = body.metadata;
  const metadataKeysAndTypes: Array<{ key: string; type: string }> = [];
  if (metadataObj && typeof metadataObj === 'object' && !Array.isArray(metadataObj)) {
    for (const [k, v] of Object.entries(metadataObj as Record<string, unknown>)) {
      metadataKeysAndTypes.push({ key: k, type: typeof v });
    }
  }

  // Notification url origin + path
  const notifUrl = body.notification_url;
  let notifOriginAndPath: string | null = null;
  if (typeof notifUrl === 'string' && notifUrl.length > 0) {
    try {
      const parsed = new URL(notifUrl);
      notifOriginAndPath = `${parsed.origin}${parsed.pathname}`;
    } catch {
      notifOriginAndPath = 'invalid_url_format';
    }
  }

  // Idempotency key metadata
  const idempotencyKey = requestOptions?.idempotencyKey;
  const hasIdempotency = typeof idempotencyKey === 'string' && idempotencyKey.trim().length > 0;
  const idempotencyHashTruncated = hasIdempotency
    ? crypto.createHash('sha256').update(idempotencyKey).digest('hex').substring(0, 8)
    : null;

  // Public & Access token fingerprints
  const pk =
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
  const at = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  const pkFp = pk ? getSafeCredentialFingerprint(pk).fingerprint : null;
  const atFp = at ? getSafeCredentialFingerprint(at).fingerprint : null;

  return {
    snapshotId,
    timestamp: now.toISOString(),
    flowId: context.flowId,
    sdkVersion: '3.6.1',
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      vercelEnv: process.env.VERCEL_ENV || 'local',
    },
    credentials: {
      mode: envValidation.providerCredentialMode,
      publicKeyFingerprint: pkFp,
      accessTokenFingerprint: atFp,
    },
    request: {
      transaction_amount: {
        type: typeof body.transaction_amount,
        value: body.transaction_amount,
      },
      token: {
        present: tokenPresent,
        type: typeof body.token,
        length: isTokenString ? tokenVal.length : 0,
        hashTruncated: tokenHashTruncated,
        ageMs: tokenAgeMs,
      },
      payment_method_id: body.payment_method_id,
      payment_type_id: context.paymentTypeId || body.payment_type_id,
      installments: {
        type: typeof body.installments,
        value: body.installments,
      },
      issuer: {
        present: hasIssuer,
        type: typeof body.issuer_id,
        maskedValue: maskedIssuer,
        origin: hasIssuer
          ? context.issuerSource || (context.issuerProvidedByBrick ? 'brick' : 'unknown')
          : 'omitted',
      },
      payer: {
        email: {
          present: Boolean(emailVal),
          domainOrHash: emailDomainOrHash,
        },
        identification: {
          type: typeof identObj.type === 'string' ? identObj.type : null,
          digitCount,
        },
        address: {
          present: hasAddress,
          keysPresent: addressKeysPresent,
        },
      },
      description: {
        present: Boolean(descVal),
        length: descLength,
      },
      external_reference: {
        present: Boolean(extRef),
        length: isExtRefString ? extRef.length : 0,
        hashTruncated: extRefHashTruncated,
      },
      metadata: {
        present: Boolean(metadataObj),
        keysAndTypes: metadataKeysAndTypes,
      },
      notification_url: {
        present: Boolean(notifUrl),
        originAndPath: notifOriginAndPath,
      },
      nullPaths,
      undefinedPaths,
      bodyKeys: Object.keys(body),
      requestOptionsKeys: requestOptions ? Object.keys(requestOptions) : [],
      idempotency: {
        present: hasIdempotency,
        hashTruncated: idempotencyHashTruncated,
        fieldUsed: hasIdempotency ? 'requestOptions.idempotencyKey' : 'none',
      },
    },
  };
}
