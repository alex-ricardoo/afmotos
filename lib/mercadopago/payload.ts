/**
 * Mercado Pago Payload Sanitation and Construction Utilities
 *
 * Strips all undefined and null fields recursively to ensure
 * exact compatibility with Mercado Pago SDK and provider schemas.
 */

export function cleanPayload<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      const nested = cleanPayload(value as Record<string, unknown>);
      if (Object.keys(nested).length > 0) {
        result[key] = nested;
      }
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

export interface BuildPaymentBodyParams {
  canonicalPrice: number;
  plate: string;
  paymentMethodId: string;
  payerEmail: string;
  payerFirstName?: string;
  payerLastName?: string;
  normalizedCpf: string;
  consultationId: string;
  userId: string;
  flowId: string;
  transactionId?: string;
  token?: string;
  installments?: number;
  issuerId?: number;
  webhookUrl?: string | null;
  payerAddress?: {
    zip_code: string;
    street_name: string;
    street_number: string;
    neighborhood: string;
    city: string;
    federal_unit: string;
  };
}

export function buildPaymentRequestBody(params: BuildPaymentBodyParams): Record<string, unknown> {
  const {
    canonicalPrice,
    plate,
    paymentMethodId,
    payerEmail,
    payerFirstName = 'Cliente',
    payerLastName = 'AF Motos',
    normalizedCpf,
    consultationId,
    userId,
    flowId,
    transactionId,
    token,
    installments,
    issuerId,
    webhookUrl,
    payerAddress,
  } = params;

  const payerPayload: Record<string, unknown> = {
    email: payerEmail.trim().toLowerCase(),
    first_name: payerFirstName,
    last_name: payerLastName,
    identification: {
      type: 'CPF',
      number: normalizedCpf,
    },
  };

  if (payerAddress) {
    payerPayload.address = {
      zip_code: payerAddress.zip_code.replace(/\D/g, ''),
      street_name: payerAddress.street_name,
      street_number: String(payerAddress.street_number || 'S/N'),
      neighborhood: payerAddress.neighborhood,
      city: payerAddress.city,
      federal_unit: payerAddress.federal_unit.toUpperCase(),
    };
  }

  const rawBody: Record<string, unknown> = {
    transaction_amount: Number(canonicalPrice.toFixed(2)),
    description: `Consulta Veicular - Placa ${plate}`,
    payment_method_id: paymentMethodId,
    payer: payerPayload,
    external_reference: consultationId,
    metadata: {
      consultation_id: consultationId,
      user_id: userId,
      plate,
      flow_id: flowId,
      transaction_id: transactionId,
    },
  };

  if (token) {
    rawBody.token = token;
  }
  if (installments) {
    rawBody.installments = Number(installments) || 1;
  }
  if (issuerId) {
    rawBody.issuer_id = issuerId;
  }
  if (webhookUrl && webhookUrl.startsWith('https://')) {
    rawBody.notification_url = webhookUrl;
  }

  return cleanPayload(rawBody);
}
