import {
  maskIdentifier,
  sanitizeProviderMessage,
  extractOriginAndPath,
  extractOrigin,
  truncateHash,
} from './security.ts';

export type CheckoutProLogEvent =
  // 19 eventos obrigatórios do fluxo de criação de preferência
  | 'checkout_pro.preference_auth_started'
  | 'checkout_pro.preference_auth_resolved'
  | 'checkout_pro.preference_consultation_lookup_started'
  | 'checkout_pro.preference_consultation_loaded'
  | 'checkout_pro.preference_price_lookup_started'
  | 'checkout_pro.preference_price_resolved'
  | 'checkout_pro.urls_resolved'
  | 'checkout_pro.preference_transaction_create_started'
  | 'checkout_pro.preference_transaction_create_succeeded'
  | 'checkout_pro.preference_transaction_create_failed'
  | 'checkout_pro.preference_body_build_started'
  | 'checkout_pro.preference_body_built'
  | 'checkout_pro.preference_client_initialization_started'
  | 'checkout_pro.preference_client_initialization_succeeded'
  | 'checkout_pro.preference_create_invoked'
  | 'checkout_pro.preference_create_succeeded'
  | 'checkout_pro.preference_create_threw'
  | 'checkout_pro.preference_transaction_update_started'
  | 'checkout_pro.preference_transaction_update_succeeded'
  | 'checkout_pro.preference_create_failed'
  // Eventos de ciclo de vida e webhooks existentes
  | 'checkout_pro.preference_create_started'
  | 'checkout_pro.redirect_started'
  | 'checkout_pro.return_page_loaded'
  | 'checkout_pro.status_polled'
  | 'checkout_pro.webhook_received'
  | 'checkout_pro.webhook_signature_verified'
  | 'checkout_pro.webhook_signature_rejected'
  | 'checkout_pro.payment_fetch_started'
  | 'checkout_pro.payment_fetch_succeeded'
  | 'checkout_pro.payment_fetch_failed'
  | 'checkout_pro.transaction_updated'
  | 'checkout_pro.consultation_release_started'
  | 'checkout_pro.consultation_release_succeeded'
  | 'checkout_pro.consultation_release_failed'
  | 'checkout_pro.reconciliation_started'
  | 'checkout_pro.reconciliation_completed';

export interface LogContext {
  flowId?: string;
  consultationId?: string;
  transactionId?: string;
  durationMs?: number;
  environment?: string;
  amount?: { type: string; value: number } | number;
  credentialMode?: 'test' | 'production' | 'invalid';
  sdkVersion?: string;
  itemCount?: number;
  itemQuantity?: number;
  unitPrice?: { type: string; value: number } | number;
  externalReference?: { presence: boolean; hashTruncated?: string };
  metadataKeys?: string[];
  backUrls?: { presence: boolean; originsAndPaths?: Record<string, string> };
  notificationUrl?: { presence: boolean; originAndPath?: string };
  paymentMethodsKeys?: string[];
  preferenceId?: string | { presence: boolean; masked?: string };
  initPoint?: { presence: boolean; origin?: string };
  errorName?: string;
  errorOrigin?: string;
  providerHttpStatus?: number;
  providerMessageSanitized?: string;
  causeCount?: number;
  requestId?: string;

  // Campos de resolução de URLs do Checkout Pro (sanitizados)
  appUrlOrigin?: string;
  backUrlScheme?: 'https' | 'http';
  backUrlHost?: string;
  notificationUrlPresent?: boolean;
  notificationUrlOrigin?: string;
  autoReturnConfigured?: boolean;
  reasonCode?: string;

  // Compatibilidade com webhooks/reconciliação

  status?: string;
  statusDetail?: string;
  paymentId?: string;
  signatureValid?: boolean;
  httpStatus?: number;
  errorMessage?: string;
}

/**
 * Emite um log estruturado e estritamente sanitizado para observabilidade do Checkout Pro.
 * Nunca registra:
 * - Access Token
 * - Webhook Secret
 * - Preferência completa
 * - Valores de metadata
 * - E-mail completo
 * - CPF
 * - Token
 * - Headers completos
 * - Raw response
 * - URL de checkout completa
 */
export function logCheckoutProEvent(
  event: CheckoutProLogEvent,
  context: LogContext = {},
  level: 'info' | 'warn' | 'error' = 'info',
): void {
  const sanitizedContext: Record<string, unknown> = {
    event,
    timestamp: new Date().toISOString(),
    environment: context.environment || process.env.MERCADO_PAGO_CHECKOUT_MODE || 'development',
  };

  if (context.flowId) sanitizedContext.flowId = context.flowId;
  if (context.consultationId) sanitizedContext.consultationId = context.consultationId;
  if (context.transactionId) sanitizedContext.transactionId = context.transactionId;
  if (typeof context.durationMs === 'number') sanitizedContext.durationMs = context.durationMs;

  // Credencial mode
  if (context.credentialMode) {
    sanitizedContext.credentialMode = context.credentialMode;
  }

  // SDK version
  if (context.sdkVersion) {
    sanitizedContext.sdkVersion = context.sdkVersion;
  }

  // Amount sanitizado (type e value)
  if (context.amount !== undefined) {
    if (typeof context.amount === 'number') {
      sanitizedContext.amount = { type: 'number', value: context.amount };
    } else {
      sanitizedContext.amount = context.amount;
    }
  }

  // Items
  if (typeof context.itemCount === 'number') sanitizedContext.itemCount = context.itemCount;
  if (typeof context.itemQuantity === 'number') sanitizedContext.itemQuantity = context.itemQuantity;

  // Unit price (type e value)
  if (context.unitPrice !== undefined) {
    if (typeof context.unitPrice === 'number') {
      sanitizedContext.unitPrice = { type: 'number', value: context.unitPrice };
    } else {
      sanitizedContext.unitPrice = context.unitPrice;
    }
  }

  // External reference (presence e hashTruncated apenas)
  if (context.externalReference) {
    sanitizedContext.externalReference = context.externalReference;
  }

  // Metadata keys only (nunca valores)
  if (context.metadataKeys) {
    sanitizedContext.metadataKeys = context.metadataKeys;
  }

  // Back URLs (presence e origin/path apenas)
  if (context.backUrls) {
    sanitizedContext.backUrls = context.backUrls;
  }

  // Notification URL (presence e origin/path apenas)
  if (context.notificationUrl) {
    sanitizedContext.notificationUrl = context.notificationUrl;
  }

  // Payment methods configuration keys only
  if (context.paymentMethodsKeys) {
    sanitizedContext.paymentMethodsKeys = context.paymentMethodsKeys;
  }

  // Preference ID (presença e mascarado)
  if (context.preferenceId) {
    if (typeof context.preferenceId === 'string') {
      sanitizedContext.preferenceId = {
        presence: true,
        masked: maskIdentifier(context.preferenceId),
      };
    } else {
      sanitizedContext.preferenceId = context.preferenceId;
    }
  }

  // Init point (presença e origin apenas)
  if (context.initPoint) {
    sanitizedContext.initPoint = context.initPoint;
  }

  // Erro seguro
  if (context.errorName) sanitizedContext.errorName = context.errorName;
  if (context.errorOrigin) sanitizedContext.errorOrigin = context.errorOrigin;
  if (typeof context.providerHttpStatus === 'number') {
    sanitizedContext.providerHttpStatus = context.providerHttpStatus;
  }
  if (context.providerMessageSanitized) {
    sanitizedContext.providerMessageSanitized = sanitizeProviderMessage(
      context.providerMessageSanitized,
    );
  }
  if (typeof context.causeCount === 'number') {
    sanitizedContext.causeCount = context.causeCount;
  }
  if (context.requestId) {
    sanitizedContext.requestId = context.requestId;
  }

  // Campos de resolução de URLs (sempre sanitizados, sem paths ou query params)
  if (context.appUrlOrigin) sanitizedContext.appUrlOrigin = context.appUrlOrigin;
  if (context.backUrlScheme) sanitizedContext.backUrlScheme = context.backUrlScheme;
  if (context.backUrlHost) sanitizedContext.backUrlHost = context.backUrlHost;
  if (typeof context.notificationUrlPresent === 'boolean') {
    sanitizedContext.notificationUrlPresent = context.notificationUrlPresent;
  }
  if (context.notificationUrlOrigin) {
    sanitizedContext.notificationUrlOrigin = context.notificationUrlOrigin;
  }
  if (typeof context.autoReturnConfigured === 'boolean') {
    sanitizedContext.autoReturnConfigured = context.autoReturnConfigured;
  }
  if (context.reasonCode) sanitizedContext.reasonCode = context.reasonCode;

  // Propriedades herdadas para compatibilidade de webhooks/reconciliação

  if (context.paymentId) sanitizedContext.paymentId = maskIdentifier(context.paymentId);
  if (context.status) sanitizedContext.status = context.status;
  if (context.statusDetail) sanitizedContext.statusDetail = context.statusDetail;
  if (typeof context.signatureValid === 'boolean') {
    sanitizedContext.signatureValid = context.signatureValid;
  }
  if (typeof context.httpStatus === 'number') {
    sanitizedContext.httpStatus = context.httpStatus;
  }
  if (context.errorMessage) {
    sanitizedContext.errorMessage = sanitizeProviderMessage(context.errorMessage);
  }

  const logPayload = JSON.stringify(sanitizedContext);

  if (level === 'error') {
    console.error(`[CHECKOUT_PRO] ${logPayload}`);
  } else if (level === 'warn') {
    console.warn(`[CHECKOUT_PRO] ${logPayload}`);
  } else {
    console.log(`[CHECKOUT_PRO] ${logPayload}`);
  }
}

export { extractOriginAndPath, extractOrigin, truncateHash };
