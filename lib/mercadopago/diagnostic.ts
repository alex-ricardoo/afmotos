/**
 * -------------------------------------------------------------
 * Isolated Minimal Card Payment Diagnostic Module (Section 2 & 3)
 * -------------------------------------------------------------
 * Strictly isolated diagnostic execution for card payments in development,
 * preview, and sandbox/test environments.
 * Strips all optional parameters to test provider compatibility.
 * Never used as a bypass in production.
 */

import type { Payment } from 'mercadopago';
import { type MercadoPagoPaymentStatus } from './types.ts';
import {
  paymentLogInfo,
  paymentLogError,
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
  mpPayment?: MercadoPagoPaymentResponse;
  error?: unknown;
  durationMs: number;
}

export async function createMinimalCardPaymentForDiagnostics(
  params: CreateMinimalCardPaymentParams,
): Promise<MinimalCardPaymentDiagnosticResult> {
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

  paymentLogInfo('payment.diagnostic_minimal_request_built', {
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

  const createStart = Date.now();
  paymentLogInfo('payment.diagnostic_minimal_provider_create_started', {
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
      providerStatus: mpStatus,
      providerMessage: statusDetail,
      providerPaymentIdPresent: Boolean(mpPaymentId),
      providerPaymentStatus: mpStatus,
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
      providerStatus: normalizedError.providerStatus,
      providerMessage: normalizedError.providerMessage,
      providerPaymentIdPresent: false,
      providerPaymentStatus: null,
      durationMs,
    });

    return {
      success: false,
      error: err,
      durationMs,
    };
  }
}
