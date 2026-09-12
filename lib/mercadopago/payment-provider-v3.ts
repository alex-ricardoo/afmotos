import { MercadoPagoConfig, Payment } from 'mercadopago';
import {
  type MercadoPagoPaymentProvider,
  type CreateCardPaymentInput,
  type CreateCardPaymentResult,
} from './payment-provider.ts';

/**
 * Adapter implementation for Mercado Pago SDK v3 (mercadopago@^3.6.1)
 * Encapsulates the v3 Payment.create call with idempotency and sanitized payload.
 */
export class MercadoPagoPaymentProviderV3 implements MercadoPagoPaymentProvider {
  readonly version = 'v3' as const;
  private client: MercadoPagoConfig;
  private paymentApi: Payment;

  constructor(accessToken?: string) {
    const token = accessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN is required for MercadoPagoPaymentProviderV3');
    }
    this.client = new MercadoPagoConfig({
      accessToken: token,
      options: { timeout: 10000 },
    });
    this.paymentApi = new Payment(this.client);
  }

  async createCardPayment(input: CreateCardPaymentInput): Promise<CreateCardPaymentResult> {
    try {
      const cleanBody: Record<string, unknown> = {
        transaction_amount: input.transactionAmount,
        token: input.token,
        description: input.description,
        installments: input.installments,
        payment_method_id: input.paymentMethodId,
        payer: {
          email: input.payerEmail,
          identification: {
            type: 'CPF',
            number: input.payerCpf,
          },
        },
      };

      if (input.issuerId !== undefined && Number.isInteger(input.issuerId) && input.issuerId > 0) {
        cleanBody.issuer_id = input.issuerId;
      }

      if (input.externalReference) {
        cleanBody.external_reference = input.externalReference;
      }

      if (input.notificationUrl && input.notificationUrl.startsWith('https://')) {
        cleanBody.notification_url = input.notificationUrl;
      }

      if (input.metadata && Object.keys(input.metadata).length > 0) {
        cleanBody.metadata = input.metadata;
      }

      const response = await this.paymentApi.create({
        body: cleanBody,
        requestOptions: {
          idempotencyKey: input.idempotencyKey,
        },
      });

      if (!response || !response.id) {
        return {
          success: false,
          status: response?.status || 'provider_error',
          statusDetail: response?.status_detail || 'no_payment_id_returned',
          error: {
            type: 'MPServerError',
            statusCode: 500,
            message: 'Mercado Pago created response without payment ID',
          },
        };
      }

      return {
        success: response.status === 'approved',
        paymentId: String(response.id),
        status: String(response.status),
        statusDetail: response.status_detail ? String(response.status_detail) : undefined,
      };
    } catch (err: unknown) {
      const errorObj = err as {
        status?: number;
        statusCode?: number;
        message?: string;
        cause?: unknown;
      };

      const statusCode = errorObj?.status ?? errorObj?.statusCode ?? 500;
      const message = errorObj?.message || 'Error processing payment in Mercado Pago v3';

      return {
        success: false,
        status: 'provider_error',
        statusDetail: 'exception_thrown',
        rawStatus: statusCode,
        error: {
          type: statusCode >= 500 ? 'MPServerError' : 'MPClientError',
          statusCode,
          message,
        },
      };
    }
  }

  async getPayment(paymentId: string): Promise<Record<string, unknown>> {
    const payment = await this.paymentApi.get({ id: paymentId });
    return (payment || {}) as unknown as Record<string, unknown>;
  }
}
