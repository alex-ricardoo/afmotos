/**
 * Mercado Pago Payment Provider Abstraction
 * Defines the unified interface for v2 and v3 payment adapters.
 */

export interface CreateCardPaymentInput {
  transactionAmount: number;
  token: string;
  description: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: number;
  payerEmail: string;
  payerCpf: string;
  externalReference: string;
  notificationUrl?: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
}

export interface CreateCardPaymentResult {
  success: boolean;
  paymentId?: string;
  status: string;
  statusDetail?: string;
  rawStatus?: number;
  error?: {
    type: 'MPServerError' | 'MPClientError' | 'NetworkError' | 'Unknown';
    statusCode?: number;
    message: string;
  };
}

export interface MercadoPagoPaymentProvider {
  readonly version: 'v2' | 'v3';
  createCardPayment(input: CreateCardPaymentInput): Promise<CreateCardPaymentResult>;
  getPayment(paymentId: string): Promise<Record<string, unknown>>;
}

export type ProviderAdapterVersion = 'v2' | 'v3';

export function resolveActiveProviderAdapter(): ProviderAdapterVersion {
  const configured = process.env.MERCADO_PAGO_PROVIDER_ADAPTER?.trim().toLowerCase();
  if (configured === 'v2') {
    return 'v2';
  }
  return 'v3';
}
