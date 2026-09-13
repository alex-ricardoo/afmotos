import { type ProviderFailureClass } from '../mercadopago/types.ts';
import { InsufficientBalanceError, InvalidTokenError } from '../vehicle-lookup/service.ts';

export interface ClassifiedProviderFailure {
  failureClass: ProviderFailureClass;
  failureCode: string;
  errorMessageSafe: string;
  httpStatus: number | null;
  retryAfterSeconds: number | null;
  isInsufficientCredits: boolean;
}

/**
 * Classifica de forma estrita, segura e sanitizada qualquer falha ocorrida
 * durante a busca veicular na API Brasil ou no pipeline de entrega.
 */
export function classifyProviderFailure(
  error: unknown,
  httpStatus?: number | null,
  retryAfterHeader?: string | null,
): ClassifiedProviderFailure {
  const errMsg = error instanceof Error ? error.message : String(error || '');
  const lowerMsg = errMsg.toLowerCase();

  // 1. Extrai Retry-After se informado
  let retryAfterSeconds: number | null = null;
  if (retryAfterHeader) {
    const parsed = parseInt(retryAfterHeader, 10);
    if (!isNaN(parsed) && parsed > 0) {
      retryAfterSeconds = Math.min(parsed, 3600); // Teto defensivo de 1h
    }
  }

  // 2. Saldo / Crédito Insuficiente (FALHA PERMANENTE OPERACIONAL)
  if (
    error instanceof InsufficientBalanceError ||
    lowerMsg.includes('saldo') ||
    lowerMsg.includes('recarreg') ||
    lowerMsg.includes('insufficient credits') ||
    lowerMsg.includes('sem saldo') ||
    httpStatus === 402
  ) {
    return {
      failureClass: 'permanent',
      failureCode: 'APIBRASIL_INSUFFICIENT_CREDITS',
      errorMessageSafe: 'Saldo ou crédito insuficiente na conta corporativa do provedor.',
      httpStatus: httpStatus || 402,
      retryAfterSeconds: null,
      isInsufficientCredits: true,
    };
  }

  // 3. Credencial / Token Inválido / 401 / 403 (FALHA PERMANENTE)
  if (
    error instanceof InvalidTokenError ||
    lowerMsg.includes('token') ||
    lowerMsg.includes('autentic') ||
    lowerMsg.includes('unauthorized') ||
    httpStatus === 401 ||
    httpStatus === 403
  ) {
    return {
      failureClass: 'permanent',
      failureCode: 'APIBRASIL_AUTH_ERROR',
      errorMessageSafe: 'Falha de credencial ou autorização com a API oficial.',
      httpStatus: httpStatus || (httpStatus === 403 ? 403 : 401),
      retryAfterSeconds: null,
      isInsufficientCredits: false,
    };
  }

  // 4. Modo Mock em Produção (FALHA PERMANENTE OPERACIONAL)
  if (
    lowerMsg.includes('mock mode in production') ||
    lowerMsg.includes('modo mock') ||
    lowerMsg.includes('mock em produção')
  ) {
    return {
      failureClass: 'permanent',
      failureCode: 'APIBRASIL_MOCK_MODE_IN_PRODUCTION',
      errorMessageSafe: 'Ambiente de produção configurado indevidamente em modo simulado.',
      httpStatus: 500,
      retryAfterSeconds: null,
      isInsufficientCredits: false,
    };
  }

  // 5. Configuração Ausente (FALHA PERMANENTE)
  if (lowerMsg.includes('não configurad') || lowerMsg.includes('missing token')) {
    return {
      failureClass: 'permanent',
      failureCode: 'APIBRASIL_CONFIGURATION_ERROR',
      errorMessageSafe: 'Configuração do provedor de consulta veicular ausente.',
      httpStatus: 500,
      retryAfterSeconds: null,
      isInsufficientCredits: false,
    };
  }

  // 6. Placa Inválida / Formato Rejeitado (FALHA PERMANENTE)
  if (
    lowerMsg.includes('placa inválida') ||
    lowerMsg.includes('formato inválido') ||
    httpStatus === 400 ||
    httpStatus === 422
  ) {
    return {
      failureClass: 'permanent',
      failureCode: 'APIBRASIL_INVALID_REQUEST',
      errorMessageSafe: 'Formato de placa veicular não aceito pelas bases oficiais.',
      httpStatus: httpStatus || 400,
      retryAfterSeconds: null,
      isInsufficientCredits: false,
    };
  }

  // 7. Limite de Taxa / Rate Limit (FALHA TRANSITÓRIA)
  if (httpStatus === 429 || lowerMsg.includes('too many requests') || lowerMsg.includes('rate limit')) {
    return {
      failureClass: 'transient',
      failureCode: 'APIBRASIL_RATE_LIMIT',
      errorMessageSafe: 'Taxa máxima de requisições excedida momentaneamente.',
      httpStatus: 429,
      retryAfterSeconds: retryAfterSeconds || 60,
      isInsufficientCredits: false,
    };
  }

  // 8. Timeout / Abort (FALHA TRANSITÓRIA)
  if (
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('tempo limite') ||
    lowerMsg.includes('aborterror') ||
    httpStatus === 408 ||
    httpStatus === 504
  ) {
    return {
      failureClass: 'transient',
      failureCode: 'APIBRASIL_TIMEOUT',
      errorMessageSafe: 'Tempo limite esgotado na comunicação com os servidores oficiais.',
      httpStatus: httpStatus || 504,
      retryAfterSeconds: null,
      isInsufficientCredits: false,
    };
  }

  // 9. Erro de Rede / DNS / Conexão (FALHA TRANSITÓRIA)
  if (
    lowerMsg.includes('econnrefused') ||
    lowerMsg.includes('econnreset') ||
    lowerMsg.includes('etimedout') ||
    lowerMsg.includes('enotfound') ||
    lowerMsg.includes('fetch failed') ||
    lowerMsg.includes('network error')
  ) {
    return {
      failureClass: 'transient',
      failureCode: 'APIBRASIL_NETWORK_ERROR',
      errorMessageSafe: 'Instabilidade de conexão de rede momentânea.',
      httpStatus: httpStatus || 503,
      retryAfterSeconds: null,
      isInsufficientCredits: false,
    };
  }

  // 10. Erro de Servidor Provedor 500, 502, 503 (FALHA TRANSITÓRIA)
  if (httpStatus && [500, 502, 503].includes(httpStatus)) {
    return {
      failureClass: 'transient',
      failureCode: 'APIBRASIL_SERVER_ERROR',
      errorMessageSafe: 'Servidor do provedor oficial temporariamente indisponível.',
      httpStatus,
      retryAfterSeconds: null,
      isInsufficientCredits: false,
    };
  }

  // 11. Schema de Resposta Inválido (FALHA DESCONHECIDA)
  if (lowerMsg.includes('resposta inválida') || lowerMsg.includes('json parse') || lowerMsg.includes('syntaxerror')) {
    return {
      failureClass: 'unknown',
      failureCode: 'APIBRASIL_INVALID_RESPONSE',
      errorMessageSafe: 'Resposta fora do padrão recebida da base oficial.',
      httpStatus: httpStatus || 502,
      retryAfterSeconds: null,
      isInsufficientCredits: false,
    };
  }

  // 12. Fallback Genérico
  return {
    failureClass: 'unknown',
    failureCode: 'APIBRASIL_UNKNOWN_ERROR',
    errorMessageSafe: 'Instabilidade temporária na consulta veicular.',
    httpStatus: httpStatus || null,
    retryAfterSeconds: null,
    isInsufficientCredits: false,
  };
}
