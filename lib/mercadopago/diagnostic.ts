/**
 * -------------------------------------------------------------
 * Isolated Minimal Card Payment Diagnostic Module
 * -------------------------------------------------------------
 * Strictly isolated diagnostic execution for card payments in local development ONLY.
 * Strips optional parameters to isolate provider compatibility.
 *
 * MANDATORY SECURITY GATES:
 * - Blocked in Vercel Production
 * - Blocked in Vercel Preview
 * - Blocked when NODE_ENV !== 'development'
 * - Blocked unless ENABLE_MP_MINIMAL_DIAGNOSTIC === 'true'
 * - Never acts as a fallback or bypass in payment flow
 * - Never authorizes or triggers consultation release
 */

import type { Payment } from 'mercadopago';
import { type MercadoPagoPaymentStatus } from './types.ts';
import {
  paymentLogInfo,
  paymentLogError,
  paymentLogWarn,
  extractSafeError,
} from '../observability/payment-logger.ts';

export type MercadoPagoPaymentResponse = Awaited<ReturnType<Payment['create']>>;

export interface CreateMinimalCardPaymentParams {
  paymentClient: {
    create: (data: { body: Record<string, unknown> }) => Promise<MercadoPagoPaymentResponse>;
  };
  canonicalAmount: number;
  token: string;
  installments: number;
  paymentMethodId: string;
  userEmail: string;
  normalizedCpf: string;
  flowId: string;
  consultationId: string;
  transactionId?: string;
}

export interface MinimalCardPaymentDiagnosticResult {
  success: boolean;
  blocked?: boolean;
  reason?: string;
  mpPayment?: MercadoPagoPaymentResponse;
  error?: unknown;
  durationMs: number;
}

/**
 * Checks if the minimal diagnostic execution is permitted in current environment.
 */
export function isMinimalDiagnosticAllowed(): { allowed: boolean; reason?: string } {
  if (process.env.VERCEL_ENV === 'production') {
    return { allowed: false, reason: 'Bloqueado em ambiente Vercel Production.' };
  }
  if (process.env.VERCEL_ENV === 'preview') {
    return { allowed: false, reason: 'Bloqueado em ambiente Vercel Preview.' };
  }
  if (process.env.NODE_ENV !== 'development') {
    return { allowed: false, reason: 'Bloqueado fora de NODE_ENV=development.' };
  }
  if (process.env.ENABLE_MP_MINIMAL_DIAGNOSTIC !== 'true') {
    return {
      allowed: false,
      reason: 'Requer flag de ambiente ENABLE_MP_MINIMAL_DIAGNOSTIC=true.',
    };
  }
  return { allowed: true };
}

export async function createMinimalCardPaymentForDiagnostics(
  params: CreateMinimalCardPaymentParams,
): Promise<MinimalCardPaymentDiagnosticResult> {
  const gate = isMinimalDiagnosticAllowed();
  if (!gate.allowed) {
    paymentLogWarn('payment.diagnostic_minimal_blocked', {
      flowId: params.flowId,
      consultationId: params.consultationId,
      transactionId: params.transactionId,
      reason: gate.reason,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    });
    return {
      success: false,
      blocked: true,
      reason: gate.reason,
      durationMs: 0,
    };
  }

  const {
    paymentClient,
    canonicalAmount,
    token,
    installments,
    paymentMethodId,
    userEmail,
    normalizedCpf,
    flowId,
    consultationId,
    transactionId,
  } = params;

  paymentLogInfo('payment.diagnostic_minimal_started', {
    flowId,
    consultationId,
    transactionId,
    mode: 'minimal_card_diagnostic',
    canonicalAmount,
    amountType: typeof canonicalAmount,
    currency: 'BRL',
    tokenPresent: Boolean(token),
    paymentMethodId,
    paymentTypeId: 'credit_card',
    installments,
    issuerIncluded: false,
    externalReferenceIncluded: false,
    descriptionIncluded: false,
    addressIncluded: false,
    requestOptionsIncluded: false,
    idempotencySentToProvider: false,
    payerEmailPresent: Boolean(userEmail),
    cpfType: 'CPF',
    cpfLength: normalizedCpf.length,
  });

  const minimalCardPaymentBody = {
    transaction_amount: canonicalAmount,
    token,
    installments,
    payment_method_id: paymentMethodId,
    payer: {
      email: userEmail,
      identification: {
        type: 'CPF' as const,
        number: normalizedCpf,
      },
    },
  };

  const createStart = Date.now();
  try {
    const mpPayment = await paymentClient.create({
      body: minimalCardPaymentBody,
    });

    const durationMs = Date.now() - createStart;
    const mpPaymentId = mpPayment?.id ? String(mpPayment.id) : undefined;
    const mpStatus = (mpPayment?.status || 'pending') as MercadoPagoPaymentStatus;
    const statusDetail = mpPayment?.status_detail ? String(mpPayment.status_detail) : undefined;

    paymentLogInfo('payment.diagnostic_minimal_provider_create_succeeded', {
      flowId,
      consultationId,
      transactionId,
      mode: 'minimal_card_diagnostic',
      canonicalAmount,
      currency: 'BRL',
      paymentMethodId,
      providerStatus: mpStatus,
      providerMessage: statusDetail,
      providerPaymentIdPresent: Boolean(mpPaymentId),
      durationMs,
    });

    return {
      success: true,
      mpPayment,
      durationMs,
    };
  } catch (err: unknown) {
    const durationMs = Date.now() - createStart;
    const normalizedError = extractSafeError(err);

    paymentLogError('payment.diagnostic_minimal_provider_create_failed', {
      flowId,
      consultationId,
      transactionId,
      mode: 'minimal_card_diagnostic',
      canonicalAmount,
      currency: 'BRL',
      paymentMethodId,
      providerStatus: normalizedError.providerStatus,
      providerMessage: normalizedError.providerMessage,
      durationMs,
    });

    return {
      success: false,
      error: err,
      durationMs,
    };
  }
}

/**
 * -------------------------------------------------------------
 * Server-Side Diagnostic Test Variations (A, B, C)
 * -------------------------------------------------------------
 * Strictly isolated for local development opt-in testing.
 * NEVER executed automatically in production or preview.
 * NEVER releases consultation without real verified payment.
 */

export interface DiagnosticVariationParams {
  canonicalAmount: number;
  token: string;
  installments: number;
  userEmail: string;
  normalizedCpf: string;
  flowId: string;
  consultationId: string;
  brickIssuerId?: number | string | null;
  notificationUrl?: string | null;
}

export interface DiagnosticVariationCallData {
  body: Record<string, unknown>;
  requestOptions?: {
    idempotencyKey?: string;
  };
  idempotencyKey?: string;
}

/**
 * Validates if server-side diagnostic variations (A, B, C) are permitted.
 * Rules:
 * - VERCEL_ENV must NOT be 'production'
 * - VERCEL_ENV must NOT be 'preview'
 * - NODE_ENV must be 'development'
 * - ENABLE_MP_DIAGNOSTIC_TESTS must be 'true'
 */
export function isDiagnosticTestsAllowed(): { allowed: boolean; reason?: string } {
  if (process.env.VERCEL_ENV === 'production') {
    return { allowed: false, reason: 'Bloqueado em ambiente Vercel Production.' };
  }
  if (process.env.VERCEL_ENV === 'preview') {
    return { allowed: false, reason: 'Bloqueado em ambiente Vercel Preview.' };
  }
  if (process.env.NODE_ENV !== 'development') {
    return { allowed: false, reason: 'Bloqueado fora de NODE_ENV=development.' };
  }
  if (process.env.ENABLE_MP_DIAGNOSTIC_TESTS !== 'true') {
    return {
      allowed: false,
      reason: 'Requer flag de ambiente ENABLE_MP_DIAGNOSTIC_TESTS=true.',
    };
  }
  return { allowed: true };
}

export function assertDiagnosticTestsAllowed(): void {
  const gate = isDiagnosticTestsAllowed();
  if (!gate.allowed) {
    throw new Error(
      gate.reason ||
        'Testes diagnósticos A/B/C bloqueados em produção/preview ou sem ENABLE_MP_DIAGNOSTIC_TESTS=true.',
    );
  }
}

/**
 * Teste A:
 * - payload normal completo;
 * - payment_method_id=master;
 * - issuer_id somente quando retornado pelo Brick (sem fallback hardcoded);
 * - external_reference;
 * - notification_url;
 * - idempotency no requestOptions/header correto.
 */
export function buildVariationAPayload(
  params: DiagnosticVariationParams,
): DiagnosticVariationCallData {
  const idempotencyKey = crypto.randomUUID();

  // Validate issuer strictly from Brick
  const rawIssuer = params.brickIssuerId;
  const parsedIssuer =
    rawIssuer !== undefined && rawIssuer !== null && rawIssuer !== ''
      ? Number(rawIssuer)
      : undefined;
  const validIssuerId =
    parsedIssuer !== undefined &&
    Number.isInteger(parsedIssuer) &&
    parsedIssuer > 0 &&
    Number.isFinite(parsedIssuer)
      ? parsedIssuer
      : undefined;

  const body: Record<string, unknown> = {
    transaction_amount: Number(params.canonicalAmount.toFixed(2)),
    description: `Consulta Veicular - Diagnostico Variacao A`,
    payment_method_id: 'master',
    token: params.token,
    installments: Number(params.installments) || 1,
    payer: {
      email: params.userEmail.trim().toLowerCase(),
      identification: {
        type: 'CPF',
        number: params.normalizedCpf,
      },
    },
    external_reference: params.consultationId,
    metadata: {
      consultation_id: params.consultationId,
      flow_id: params.flowId,
      diagnostic_variation: 'A',
    },
  };

  if (validIssuerId) {
    body.issuer_id = validIssuerId;
  }

  if (params.notificationUrl && params.notificationUrl.startsWith('https://')) {
    body.notification_url = params.notificationUrl;
  }

  return {
    body,
    requestOptions: {
      idempotencyKey,
    },
    idempotencyKey,
  };
}

/**
 * Teste B:
 * - payload mínimo;
 * - sem issuer_id;
 * - sem external_reference;
 * - sem notification_url;
 * - mesma estrutura correta do SDK.
 * Usar somente local development e nunca como fallback.
 */
export function buildVariationBPayload(
  params: DiagnosticVariationParams,
): DiagnosticVariationCallData {
  const idempotencyKey = crypto.randomUUID();

  const body: Record<string, unknown> = {
    transaction_amount: Number(params.canonicalAmount.toFixed(2)),
    token: params.token,
    installments: Number(params.installments) || 1,
    payment_method_id: 'master',
    payer: {
      email: params.userEmail.trim().toLowerCase(),
      identification: {
        type: 'CPF',
        number: params.normalizedCpf,
      },
    },
  };

  return {
    body,
    requestOptions: {
      idempotencyKey,
    },
    idempotencyKey,
  };
}

/**
 * Teste C:
 * - payload completo sem issuer_id;
 * - todos os demais campos válidos.
 * Usar somente local development e nunca como fallback.
 */
export function buildVariationCPayload(
  params: DiagnosticVariationParams,
): DiagnosticVariationCallData {
  const idempotencyKey = crypto.randomUUID();

  const body: Record<string, unknown> = {
    transaction_amount: Number(params.canonicalAmount.toFixed(2)),
    description: `Consulta Veicular - Diagnostico Variacao C`,
    payment_method_id: 'master',
    token: params.token,
    installments: Number(params.installments) || 1,
    payer: {
      email: params.userEmail.trim().toLowerCase(),
      identification: {
        type: 'CPF',
        number: params.normalizedCpf,
      },
    },
    external_reference: params.consultationId,
    metadata: {
      consultation_id: params.consultationId,
      flow_id: params.flowId,
      diagnostic_variation: 'C',
    },
  };

  if (params.notificationUrl && params.notificationUrl.startsWith('https://')) {
    body.notification_url = params.notificationUrl;
  }

  return {
    body,
    requestOptions: {
      idempotencyKey,
    },
    idempotencyKey,
  };
}
