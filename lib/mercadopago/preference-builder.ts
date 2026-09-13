import { Preference } from 'mercadopago';
import { getPreferenceClient, isTestMode } from './client.ts';
import { isValidMercadoPagoRedirectUrl } from './security.ts';
import { type CreatePreferenceParams, type CreatePreferenceResult } from './types.ts';
import { CheckoutProValidationError } from './error-normalizer.ts';

export type PreferenceCreateBody = Parameters<Preference['create']>[0]['body'];


/**
 * Remove recursivamente campos undefined, null ou strings vazias do objeto.
 */
export function removeEmptyFields<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleaned = removeEmptyFields(value);
      if (Object.keys(cleaned).length > 0) {
        result[key] = cleaned;
      }
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

/**
 * Verifica se a URL é HTTPS pública válida (não localhost/127.0.0.1).
 */
export function isValidPublicHttpsUrl(urlStr: string | null | undefined): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  if (!urlStr.startsWith('https://')) return false;
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Constrói e limpa o corpo da Preferência do Mercado Pago Checkout Pro.
 */
export function buildPreferenceBody(params: CreatePreferenceParams): PreferenceCreateBody {

  const { consultationId, transactionId, userId, customerEmail, unitPrice, plate } = params;

  const numericPrice = Math.round(Number(unitPrice) * 100) / 100;
  if (isNaN(numericPrice) || numericPrice <= 0) {
    throw new CheckoutProValidationError('Valor da consulta inválido para pagamento.', 422, 'INVALID_PRICE');
  }

  const cleanPlate = (plate || '').trim().toUpperCase();
  if (!cleanPlate) {
    throw new CheckoutProValidationError('Placa do veículo não informada.', 422, 'INVALID_PLATE');
  }

  // Base URL para back_urls
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

  // URL pública de notificação - omitida em ambiente local sem túnel HTTPS
  const rawWebhookUrl = process.env.MERCADO_PAGO_WEBHOOK_URL || `${appUrl}/api/webhooks/mercadopago`;
  const notificationUrl = isValidPublicHttpsUrl(rawWebhookUrl) ? rawWebhookUrl : undefined;

  const backUrls = {
    success: `${appUrl}/cliente/pagamento/retorno/${transactionId}?result=success`,
    pending: `${appUrl}/cliente/pagamento/retorno/${transactionId}?result=pending`,
    failure: `${appUrl}/cliente/pagamento/retorno/${transactionId}?result=failure`,
  };

  // O Mercado Pago rejeita estritamente `auto_return: 'approved'` se back_urls.success não for HTTPS
  const isHttpsSuccess = backUrls.success.startsWith('https://');
  const autoReturn = isHttpsSuccess ? 'approved' : undefined;

  const rawBody: Record<string, any> = {
    items: [
      {
        id: 'vehicle-consultation',
        title: `Consulta Veicular Placa ${cleanPlate}`,
        description: `Histórico veicular completo para a placa ${cleanPlate}`,
        quantity: 1,
        unit_price: numericPrice,
        currency_id: 'BRL',
      },
    ],
    payer: customerEmail ? { email: customerEmail.trim() } : undefined,
    external_reference: transactionId,
    metadata: {
      transaction_id: transactionId,
      consultation_id: consultationId,
      user_id: userId,
      product: 'vehicle_consultation',
    },
    back_urls: backUrls,
    auto_return: autoReturn,
    notification_url: notificationUrl,
    payment_methods: {
      installments: 12,
    },
  };

  return removeEmptyFields(rawBody) as PreferenceCreateBody;
}

/**
 * Constrói e envia o payload oficial da Preferência Checkout Pro para o Mercado Pago.
 */
export async function createCheckoutProPreference(
  params: CreatePreferenceParams,
): Promise<CreatePreferenceResult> {
  const preferenceBody = buildPreferenceBody(params);

  const preferenceClient = getPreferenceClient();
  const response = await preferenceClient.create({ body: preferenceBody });

  if (!response.id) {
    throw new Error('Mercado Pago não retornou ID de preferência válido.');
  }

  const testEnvironment = isTestMode();
  const initPoint = response.init_point || '';
  const sandboxInitPoint = response.sandbox_init_point || '';

  // Escolhe a URL de redirecionamento apropriada com base no ambiente
  const chosenUrl = testEnvironment && sandboxInitPoint ? sandboxInitPoint : initPoint;

  if (!chosenUrl || !isValidMercadoPagoRedirectUrl(chosenUrl)) {
    throw new Error(`URL de redirecionamento inválida ou não autorizada: ${chosenUrl}`);
  }

  return {
    preferenceId: response.id,
    redirectUrl: chosenUrl,
    initPoint,
    sandboxInitPoint,
    environment: testEnvironment ? 'test' : 'production',
  };
}
