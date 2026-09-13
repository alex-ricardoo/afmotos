import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { CheckoutProLocalConfigError } from './error-normalizer.ts';

export const SDK_VERSION = '2.12.0';

let mpConfigInstance: MercadoPagoConfig | null = null;
let lastAccessToken: string | null = null;

/**
 * Identifica o modo da credencial: test, production ou invalid.
 */
export function getCredentialMode(): 'test' | 'production' | 'invalid' {
  const token = (process.env.MERCADO_PAGO_ACCESS_TOKEN || '').trim();
  if (token.startsWith('TEST-')) return 'test';
  if (token.startsWith('APP_USR-')) return 'production';
  return 'invalid';
}

/**
 * Retorna uma instância de configuração do Mercado Pago SDK.
 * Lança erro seguro se MERCADO_PAGO_ACCESS_TOKEN não estiver configurado ou for inválido.
 */
export function getMercadoPagoConfig(): MercadoPagoConfig {
  const rawToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!rawToken || rawToken.trim() === '') {
    throw new CheckoutProLocalConfigError('MERCADO_PAGO_ACCESS_TOKEN não configurado no servidor.');
  }

  const trimmedToken = rawToken.trim();
  const mode = getCredentialMode();
  if (mode === 'invalid') {
    throw new CheckoutProLocalConfigError(
      'MERCADO_PAGO_ACCESS_TOKEN possui formato inválido (deve iniciar com TEST- ou APP_USR-).',
    );
  }

  if (!mpConfigInstance || lastAccessToken !== trimmedToken) {
    mpConfigInstance = new MercadoPagoConfig({
      accessToken: trimmedToken,
      options: { timeout: 10000 },
    });
    lastAccessToken = trimmedToken;
  }

  return mpConfigInstance;
}

/**
 * Retorna o cliente da API de Preferências do Mercado Pago.
 */
export function getPreferenceClient(): Preference {
  return new Preference(getMercadoPagoConfig());
}

/**
 * Retorna o cliente da API de Pagamentos do Mercado Pago para consulta autoritativa.
 */
export function getPaymentClient(): Payment {
  return new Payment(getMercadoPagoConfig());
}

/**
 * Identifica se a aplicação está em modo de teste/sandbox.
 */
export function isTestMode(): boolean {
  const mode = process.env.MERCADO_PAGO_CHECKOUT_MODE;
  if (mode === 'production') {
    return false;
  }
  const tokenMode = getCredentialMode();
  return mode === 'test' || tokenMode === 'test';
}

/**
 * Utilitário interno para testes para resetar a instância singleton do cliente.
 */
export function resetMercadoPagoConfigForTesting(): void {
  mpConfigInstance = null;
  lastAccessToken = null;
}
