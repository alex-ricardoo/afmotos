import {
  CheckoutProUrlResolutionError,
} from './error-normalizer.ts';
import { getCredentialMode } from './client.ts';

export type DeploymentEnvironment = 'production' | 'preview' | 'development' | 'test';

export interface ResolvedCheckoutProUrls {
  appUrl: string;
  appUrlOrigin: string;
  backUrls: {
    success: string;
    pending: string;
    failure: string;
  };
  backUrlScheme: 'https' | 'http';
  backUrlHost: string;
  notificationUrl: string | undefined;
  notificationUrlPresent: boolean;
  notificationUrlOrigin: string | undefined;
  autoReturnConfigured: boolean;
  autoReturn: 'approved' | undefined;
  environment: DeploymentEnvironment;
}

export interface ResolveUrlOptions {
  transactionId: string;
  environmentOverride?: DeploymentEnvironment;
  allowProductionInPreview?: boolean;
  returnPathPrefix?: string;
}

/**
 * Identifica o ambiente de deployment com base nas variáveis da plataforma e credenciais.
 */
export function getDeploymentEnvironment(): DeploymentEnvironment {
  const vercelEnv = process.env.VERCEL_ENV?.toLowerCase().trim();
  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'preview';
  if (vercelEnv === 'development') return 'development';

  const mpCheckoutMode = process.env.MERCADO_PAGO_CHECKOUT_MODE?.toLowerCase().trim();
  if (mpCheckoutMode === 'production') return 'production';

  // Se o token configurado é de produção (APP_USR-), o ambiente de pagamento é estritamente produção
  const credentialMode = getCredentialMode();
  if (credentialMode === 'production') return 'production';

  const nodeEnv = process.env.NODE_ENV?.toLowerCase().trim();
  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'test') return 'test';

  return 'development';
}

/**
 * Verifica se um host é loopback ou localhost.
 */
export function isLoopbackOrLocal(host: string): boolean {
  const clean = host.toLowerCase().trim();
  if (
    clean === 'localhost' ||
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === '0.0.0.0' ||
    clean.endsWith('.localhost') ||
    clean.endsWith('.local')
  ) {
    return true;
  }
  return /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(clean);
}

/**
 * Sanitiza e valida uma URL candidata. Rejeita query strings, hashes e espaços.
 */
export function sanitizeAndValidateCandidateUrl(rawUrl: string | undefined): URL {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('URL não fornecida');
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error('URL vazia');
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`Formato de URL inválido: ${trimmed}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Protocolo não suportado: ${parsed.protocol}`);
  }

  // Rejeita query params ou hash em URL base
  if (parsed.search || parsed.hash) {
    throw new Error('URL base não deve conter parâmetros de query (?) ou hash (#)');
  }

  return parsed;
}

/**
 * Resolve a URL base da aplicação respeitando a ordem de preferência:
 * 1. MERCADO_PAGO_APP_URL
 * 2. NEXT_PUBLIC_APP_URL
 * 3. APP_URL
 * 4. VERCEL_PROJECT_PRODUCTION_URL (somente em Production)
 * 5. VERCEL_URL (em Preview)
 * 6. Fallback localhost:3000 (estritamente em Development local)
 */
function resolveCandidateAppUrl(env: DeploymentEnvironment): string | undefined {
  // 1. MERCADO_PAGO_APP_URL
  const mpAppUrl = process.env.MERCADO_PAGO_APP_URL?.trim();
  if (mpAppUrl) return mpAppUrl;

  // 2. NEXT_PUBLIC_APP_URL
  const nextAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (nextAppUrl) return nextAppUrl;

  // 3. APP_URL
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) return appUrl;

  // 4. Vercel System Env em Production
  if (env === 'production') {
    const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (vercelProdUrl) {
      return `https://${vercelProdUrl}`;
    }
  }

  // 5. Vercel System Env em Preview
  if (env === 'preview') {
    const vercelUrl = process.env.VERCEL_URL?.trim();
    if (vercelUrl) {
      return `https://${vercelUrl}`;
    }
  }

  // 6. Fallback exclusivo de Development
  if (env === 'development' || env === 'test') {
    return 'http://localhost:3000';
  }

  return undefined;
}

/**
 * Validador e resolvedor central de URLs para o Checkout Pro.
 * Garante que Production falhe fechado se houver tentativa de uso de localhost ou HTTP.
 */
export function resolveCheckoutProUrls(options: ResolveUrlOptions): ResolvedCheckoutProUrls {
  const { transactionId, environmentOverride } = options;

  if (!transactionId || typeof transactionId !== 'string' || !transactionId.trim()) {
    throw new Error('transactionId é obrigatório para resolver URLs de retorno.');
  }

  const env = environmentOverride || getDeploymentEnvironment();
  const credentialMode = getCredentialMode();

  // Regra de segurança: Em Preview, credenciais APP_USR só podem ser usadas com autorização expressa
  if (env === 'preview' && credentialMode === 'production' && !options.allowProductionInPreview) {
    throw new CheckoutProUrlResolutionError(
      'Uso de credenciais de produção APP_USR proibido em ambiente Preview sem autorização explícita.',
      'CHECKOUT_PRO_INVALID_PREVIEW_URL',
    );
  }

  const candidateAppUrl = resolveCandidateAppUrl(env);

  if (!candidateAppUrl) {
    if (env === 'production') {
      throw new CheckoutProUrlResolutionError(
        'Nenhuma URL base de aplicação (MERCADO_PAGO_APP_URL ou NEXT_PUBLIC_APP_URL) configurada em Production.',
        'CHECKOUT_PRO_INVALID_PRODUCTION_APP_URL',
      );
    }
    throw new CheckoutProUrlResolutionError(
      'Não foi possível resolver a URL base da aplicação.',
      'CHECKOUT_PRO_INVALID_URL',
    );
  }

  let parsedAppUrl: URL;
  try {
    parsedAppUrl = sanitizeAndValidateCandidateUrl(candidateAppUrl);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'URL base inválida';
    if (env === 'production') {
      throw new CheckoutProUrlResolutionError(
        `URL base de Production inválida: ${msg}`,
        'CHECKOUT_PRO_INVALID_PRODUCTION_APP_URL',
      );
    }
    throw new CheckoutProUrlResolutionError(
      `URL base da aplicação inválida: ${msg}`,
      'CHECKOUT_PRO_INVALID_URL',
    );
  }

  const isLocal = isLoopbackOrLocal(parsedAppUrl.hostname);

  // Validação estrita para Production: PROIBIDO HTTP e PROIBIDO localhost/loopback
  if (env === 'production') {
    if (parsedAppUrl.protocol !== 'https:') {
      throw new CheckoutProUrlResolutionError(
        `Production exige protocolo HTTPS obrigatório para Checkout Pro. Recebido: ${parsedAppUrl.protocol}`,
        'CHECKOUT_PRO_INVALID_PRODUCTION_APP_URL',
      );
    }
    if (isLocal) {
      throw new CheckoutProUrlResolutionError(
        `Production não permite hostname local/loopback (${parsedAppUrl.hostname}) para Checkout Pro.`,
        'CHECKOUT_PRO_INVALID_PRODUCTION_APP_URL',
      );
    }
  }

  // Validação estrita para Preview: PROIBIDO localhost/loopback e PROIBIDO HTTP
  if (env === 'preview') {
    if (parsedAppUrl.protocol !== 'https:') {
      throw new CheckoutProUrlResolutionError(
        `Preview exige protocolo HTTPS obrigatório para Checkout Pro. Recebido: ${parsedAppUrl.protocol}`,
        'CHECKOUT_PRO_INVALID_PREVIEW_URL',
      );
    }
    if (isLocal) {
      throw new CheckoutProUrlResolutionError(
        `Preview não permite hostname local/loopback (${parsedAppUrl.hostname}) para Checkout Pro.`,
        'CHECKOUT_PRO_INVALID_PREVIEW_URL',
      );
    }
  }

  // Montagem da URL base normalizada sem barra final
  const cleanPath =
    parsedAppUrl.pathname === '/' ? '' : parsedAppUrl.pathname.replace(/\/$/, '');
  const normalizedAppUrl = `${parsedAppUrl.origin}${cleanPath}`;

  // Resolução das 3 back_urls da aplicação
  const basePath = options.returnPathPrefix || '/cliente/pagamento/retorno';
  const backUrls = {
    success: `${normalizedAppUrl}${basePath}/${transactionId}?result=success`,
    pending: `${normalizedAppUrl}${basePath}/${transactionId}?result=pending`,
    failure: `${normalizedAppUrl}${basePath}/${transactionId}?result=failure`,
  };

  const backUrlScheme = (parsedAppUrl.protocol === 'https:' ? 'https' : 'http') as 'https' | 'http';
  const isHttpsSuccess = backUrls.success.startsWith('https://');

  // auto_return só pode ser configurado se success for HTTPS válida
  const autoReturnConfigured = isHttpsSuccess;
  const autoReturn = autoReturnConfigured ? 'approved' : undefined;

  // Resolução de Webhook Notification URL
  let notificationUrl: string | undefined;
  const rawWebhookUrl = process.env.MERCADO_PAGO_WEBHOOK_URL?.trim();

  if (rawWebhookUrl) {
    try {
      const parsedWebhook = sanitizeAndValidateCandidateUrl(rawWebhookUrl);
      const isWebhookLocal = isLoopbackOrLocal(parsedWebhook.hostname);

      if (parsedWebhook.protocol === 'https:' && !isWebhookLocal) {
        notificationUrl = parsedWebhook.href;
      } else if (env === 'production') {
        throw new CheckoutProUrlResolutionError(
          `MERCADO_PAGO_WEBHOOK_URL em Production deve ser HTTPS pública válida. Recebido: ${rawWebhookUrl}`,
          'CHECKOUT_PRO_INVALID_PRODUCTION_WEBHOOK_URL',
        );
      }
    } catch (err: unknown) {
      if (err instanceof CheckoutProUrlResolutionError) throw err;
      const msg = err instanceof Error ? err.message : 'URL de webhook inválida';
      if (env === 'production') {
        throw new CheckoutProUrlResolutionError(
          `MERCADO_PAGO_WEBHOOK_URL inválida em Production: ${msg}`,
          'CHECKOUT_PRO_INVALID_PRODUCTION_WEBHOOK_URL',
        );
      }
    }
  } else if (env === 'production') {
    // Em Production, se MERCADO_PAGO_WEBHOOK_URL não for explícita, deriva da base HTTPS oficial
    notificationUrl = `${normalizedAppUrl}/api/webhooks/mercadopago`;
  }

  let notificationUrlOrigin: string | undefined;
  if (notificationUrl) {
    try {
      notificationUrlOrigin = new URL(notificationUrl).origin;
    } catch {
      notificationUrlOrigin = undefined;
    }
  }

  return {
    appUrl: normalizedAppUrl,
    appUrlOrigin: parsedAppUrl.origin,
    backUrls,
    backUrlScheme,
    backUrlHost: parsedAppUrl.host,
    notificationUrl,
    notificationUrlPresent: !!notificationUrl,
    notificationUrlOrigin,
    autoReturnConfigured,
    autoReturn,
    environment: env,
  };
}
