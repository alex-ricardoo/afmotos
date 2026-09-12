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
