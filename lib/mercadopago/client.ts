import { MercadoPagoConfig, Payment, PaymentRefund, Preference } from 'mercadopago';

let mpClientInstance: MercadoPagoConfig | null = null;
let paymentInstance: Payment | null = null;
let refundInstance: PaymentRefund | null = null;
let preferenceInstance: Preference | null = null;

export function getMercadoPagoAccessToken(): string | null {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || null;
}

export function getMercadoPagoPublicKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ||
    null
  );
}

export function getMercadoPagoWebhookSecret(): string | null {
  return process.env.MERCADO_PAGO_WEBHOOK_SECRET || process.env.MP_WEBHOOK_SECRET || null;
}

export function isDevPaymentSimulationEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.ENABLE_DEV_PAYMENT_SIMULATION === 'true'
  );
}

export function getMercadoPagoClient(): MercadoPagoConfig {
  const token = getMercadoPagoAccessToken();
  if (!token) {
    throw new Error(
      'Mercado Pago Access Token não configurado. Defina MERCADO_PAGO_ACCESS_TOKEN ou MP_ACCESS_TOKEN.'
    );
  }

  if (!mpClientInstance) {
    mpClientInstance = new MercadoPagoConfig({
      accessToken: token,
      options: {
        timeout: 10000,
        idempotencyKey: undefined,
      },
    });
  }

  return mpClientInstance;
}

export function getPaymentClient(): Payment {
  if (!paymentInstance) {
    paymentInstance = new Payment(getMercadoPagoClient());
  }
  return paymentInstance;
}

export function getRefundClient(): PaymentRefund {
  if (!refundInstance) {
    refundInstance = new PaymentRefund(getMercadoPagoClient());
  }
  return refundInstance;
}

export function getPreferenceClient(): Preference {
  if (!preferenceInstance) {
    preferenceInstance = new Preference(getMercadoPagoClient());
  }
  return preferenceInstance;
}
