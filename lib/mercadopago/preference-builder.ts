import { Preference } from 'mercadopago';
import { getPreferenceClient, isTestMode } from './client.ts';
import { isValidMercadoPagoRedirectUrl } from './security.ts';
import { type CreatePreferenceParams, type CreatePreferenceResult } from './types.ts';
import { CheckoutProValidationError } from './error-normalizer.ts';
import {
  resolveCheckoutProUrls,
  type DeploymentEnvironment,
} from './checkout-pro-urls.ts';

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
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.local')
    ) {
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
export function buildPreferenceBody(
  params: CreatePreferenceParams,
  options?: { environmentOverride?: DeploymentEnvironment; allowProductionInPreview?: boolean },
): PreferenceCreateBody {
  const { consultationId, transactionId, userId, customerEmail, unitPrice, plate } = params;

  const numericPrice = Math.round(Number(unitPrice) * 100) / 100;
  if (isNaN(numericPrice) || numericPrice <= 0) {
    throw new CheckoutProValidationError('Valor da consulta inválido para pagamento.', 422, 'INVALID_PRICE');
  }

  const cleanPlate = (plate || '').trim().toUpperCase();
  if (!cleanPlate) {
    throw new CheckoutProValidationError('Placa do veículo não informada.', 422, 'INVALID_PLATE');
  }

  // Resolução centralizada de URLs garantindo conformidade por ambiente
  const resolvedUrls = resolveCheckoutProUrls({
    transactionId,
    environmentOverride: options?.environmentOverride,
    allowProductionInPreview: options?.allowProductionInPreview,
  });

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
    back_urls: resolvedUrls.backUrls,
    auto_return: resolvedUrls.autoReturn,
    notification_url: resolvedUrls.notificationUrl,
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
