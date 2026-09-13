import { sanitizeProviderMessage } from './security.ts';

export type CheckoutProErrorCategory =
  | 'local_configuration_error'
  | 'local_validation_error'
  | 'local_database_error'
  | 'provider_http_error'
  | 'network_error'
  | 'provider_unknown_error';

export type ErrorOrigin = 'local' | 'database' | 'mercadopago_sdk' | 'mercadopago_api' | 'network';

export interface NormalizedCheckoutProError {
  category: CheckoutProErrorCategory;
  httpStatus: 401 | 403 | 404 | 422 | 500 | 502 | 503;
  errorName: string;
  errorOrigin: ErrorOrigin;
  providerHttpStatus?: number;
  providerMessageSanitized?: string;
  causeCount: number;
  safeClientMessage: string;
  safeClientCode: string;
}

export class CheckoutProLocalConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutProLocalConfigError';
  }
}

export class CheckoutProValidationError extends Error {
  readonly httpStatus: 400 | 401 | 403 | 404 | 422;
  readonly code: string;

  constructor(message: string, httpStatus: 400 | 401 | 403 | 404 | 422 = 422, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'CheckoutProValidationError';
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

export class CheckoutProDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutProDatabaseError';
  }
}

/**
 * Normaliza qualquer erro capturado durante o fluxo do Checkout Pro.
 * Extrai informações seguras de depuração e mapeia para códigos HTTP conformes:
 * - 401: sem sessão
 * - 403/404: consulta não encontrada ou não pertencente ao usuário
 * - 422: validação de negócio ou parâmetros inválidos
 * - 503: credencial ou configuração do provedor ausente/inválida
 * - 502: erro 5xx ou falha de rede do provedor
 * - 500: erro interno inesperado ou falha de banco
 */
export function normalizeCheckoutProError(err: unknown): NormalizedCheckoutProError {
  let errorName = 'UnknownError';
  let rawMessage = '';
  let providerHttpStatus: number | undefined;
  let causeCount = 0;
  let isNetwork = false;

  // 1. Instância de classes conhecidas
  if (err instanceof CheckoutProLocalConfigError) {
    return {
      category: 'local_configuration_error',
      httpStatus: 503,
      errorName: err.name,
      errorOrigin: 'local',
      providerHttpStatus: undefined,
      providerMessageSanitized: sanitizeProviderMessage(err.message),
      causeCount: 0,
      safeClientMessage: 'Serviço de pagamento temporariamente indisponível. Tente novamente mais tarde.',
      safeClientCode: 'CONFIGURATION_ERROR',
    };
  }

  if (err instanceof CheckoutProValidationError) {
    const status = err.httpStatus === 400 ? 422 : err.httpStatus;
    return {
      category: 'local_validation_error',
      httpStatus: status,
      errorName: err.name,
      errorOrigin: 'local',
      providerHttpStatus: undefined,
      providerMessageSanitized: sanitizeProviderMessage(err.message),
      causeCount: 0,
      safeClientMessage: err.message,
      safeClientCode: err.code,
    };
  }

  if (err instanceof CheckoutProDatabaseError) {
    return {
      category: 'local_database_error',
      httpStatus: 500,
      errorName: err.name,
      errorOrigin: 'database',
      providerHttpStatus: undefined,
      providerMessageSanitized: sanitizeProviderMessage(err.message),
      causeCount: 0,
      safeClientMessage: 'Erro ao registrar transação de pagamento. Tente novamente.',
      safeClientCode: 'DATABASE_ERROR',
    };
  }

  // 2. Análise de objetos (incluindo o que o SDK do Mercado Pago lança diretamente: plain object)
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;

    if (err instanceof Error) {
      errorName = err.name || 'Error';
      rawMessage = err.message || '';

      // Verifica erros de rede
      const errMsg = err.message.toLowerCase();
      if (
        errMsg.includes('fetch failed') ||
        errMsg.includes('econnrefused') ||
        errMsg.includes('etimedout') ||
        errMsg.includes('enotfound') ||
        errMsg.includes('socket') ||
        errMsg.includes('network') ||
        err.name === 'AbortError' ||
        err.name === 'TimeoutError'
      ) {
        isNetwork = true;
      }
    } else {
      // Objeto puro (ex.: o SDK do Mercado Pago faz `throw await response.json()`)
      errorName = (typeof obj.error === 'string' ? obj.error : 'MercadoPagoApiError');
      rawMessage = (typeof obj.message === 'string' ? obj.message : JSON.stringify(obj));
    }

    if (typeof obj.status === 'number') {
      providerHttpStatus = obj.status;
    } else if (typeof obj.status === 'string') {
      const parsed = parseInt(obj.status, 10);
      if (!isNaN(parsed)) providerHttpStatus = parsed;
    }

    if (Array.isArray(obj.cause)) {
      causeCount = obj.cause.length;
    } else if (obj.cause) {
      causeCount = 1;
    }
  } else if (typeof err === 'string') {
    rawMessage = err;
    errorName = 'StringError';
  }

  const sanitizedMessage = sanitizeProviderMessage(rawMessage);

  // 3. Classificação
  if (isNetwork) {
    return {
      category: 'network_error',
      httpStatus: 502,
      errorName,
      errorOrigin: 'network',
      providerHttpStatus,
      providerMessageSanitized: sanitizedMessage,
      causeCount,
      safeClientMessage: 'Falha de conexão com o provedor de pagamentos. Tente novamente.',
      safeClientCode: 'NETWORK_ERROR',
    };
  }

  // Se recebemos um status HTTP do Mercado Pago
  if (providerHttpStatus) {
    if (providerHttpStatus === 401 || providerHttpStatus === 403) {
      return {
        category: 'provider_http_error',
        httpStatus: 503,
        errorName,
        errorOrigin: 'mercadopago_api',
        providerHttpStatus,
        providerMessageSanitized: sanitizedMessage,
        causeCount,
        safeClientMessage: 'Serviço de pagamento temporariamente indisponível.',
        safeClientCode: 'PROVIDER_AUTHENTICATION_ERROR',
      };
    }

    if (providerHttpStatus >= 500) {
      return {
        category: 'provider_http_error',
        httpStatus: 502,
        errorName,
        errorOrigin: 'mercadopago_api',
        providerHttpStatus,
        providerMessageSanitized: sanitizedMessage,
        causeCount,
        safeClientMessage: 'O provedor de pagamentos está temporariamente indisponível. Tente novamente.',
        safeClientCode: 'PROVIDER_GATEWAY_ERROR',
      };
    }

    // Erros 4xx do Mercado Pago (ex.: 400 invalid_auto_return, etc.)
    return {
      category: 'provider_http_error',
      httpStatus: 422,
      errorName,
      errorOrigin: 'mercadopago_api',
      providerHttpStatus,
      providerMessageSanitized: sanitizedMessage,
      causeCount,
      safeClientMessage: 'Não foi possível iniciar o checkout com os parâmetros fornecidos.',
      safeClientCode: 'PROVIDER_VALIDATION_ERROR',
    };
  }

  // Verificação de erro de configuração local no texto da mensagem
  if (
    rawMessage.includes('MERCADO_PAGO_ACCESS_TOKEN') ||
    rawMessage.includes('ACCESS_TOKEN') ||
    rawMessage.includes('credential')
  ) {
    return {
      category: 'local_configuration_error',
      httpStatus: 503,
      errorName,
      errorOrigin: 'local',
      providerHttpStatus: undefined,
      providerMessageSanitized: sanitizedMessage,
      causeCount,
      safeClientMessage: 'Serviço de pagamento temporariamente indisponível. Tente novamente mais tarde.',
      safeClientCode: 'CONFIGURATION_ERROR',
    };
  }

  // Falha desconhecida
  return {
    category: 'provider_unknown_error',
    httpStatus: 500,
    errorName,
    errorOrigin: 'mercadopago_sdk',
    providerHttpStatus: undefined,
    providerMessageSanitized: sanitizedMessage,
    causeCount,
    safeClientMessage: 'Não foi possível iniciar o checkout no momento. Tente novamente.',
    safeClientCode: 'PREFERENCE_CREATION_FAILED',
  };
}
