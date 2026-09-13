import crypto from 'crypto';

export interface SafeProviderError {
  provider: 'mercadopago';
  errorName: string | null;
  errorMessage: string | null;
  httpStatus: number | null;
  apiCode: string | null;
  causeCode: string | null;
  causeMessage: string | null;
  retryable: boolean;
  requestIdMasked: string | null;
  errorHash?: string;
}

/**
 * Sanitiza recursivamente strings para evitar vazamento de credenciais,
 * tokens, CPFs, números de cartão e chaves sensíveis.
 */
export function sanitizeSensitiveText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/APP_USR-[a-zA-Z0-9_-]+/g, '[REDACTED_ACCESS_TOKEN]')
    .replace(/TEST-[a-zA-Z0-9_-]+/g, '[REDACTED_TEST_TOKEN]')
    .replace(/Bearer\s+[a-zA-Z0-9_.-]+/gi, 'Bearer [REDACTED_BEARER]')
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[REDACTED_CPF]')
    .replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CARD]')
    .replace(/client_secret=[^&\s]+/gi, 'client_secret=[REDACTED]')
    .replace(/access_token=[^&\s]+/gi, 'access_token=[REDACTED]');
}

/**
 * Mascara o request ID ou trace ID da requisição mantendo apenas os primeiros e últimos caracteres.
 */
function maskRequestId(id: unknown): string | null {
  if (!id || typeof id !== 'string') return null;
  const trimmed = id.trim();
  if (trimmed.length <= 8) return '***';
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

/**
 * Determina de forma puramente funcional se um status HTTP ou código de erro é passível de retry.
 */
function isErrorRetryable(httpStatus: number | null, codeOrMessage: string | null): boolean {
  if (httpStatus) {
    if (httpStatus === 429) return true;
    if (httpStatus >= 500 && httpStatus <= 599) return true;
    if (httpStatus >= 400 && httpStatus < 500) return false;
  }
  if (codeOrMessage) {
    const text = codeOrMessage.toLowerCase();
    if (
      text.includes('timeout') ||
      text.includes('timed out') ||
      text.includes('etimedout') ||
      text.includes('econnreset') ||
      text.includes('enotfound') ||
      text.includes('network') ||
      text.includes('socket hang up') ||
      text.includes('gateway') ||
      text.includes('temporarily unavailable')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Converte qualquer erro retornado ou lançado pelo SDK/API do Mercado Pago
 * em uma estrutura segura, padronizada e imune a "[object Object]".
 */
export function serializeMercadoPagoError(error: unknown): SafeProviderError {
  if (error === null || error === undefined) {
    return {
      provider: 'mercadopago',
      errorName: null,
      errorMessage: 'Mercado Pago operation failed with null or undefined error',
      httpStatus: null,
      apiCode: null,
      causeCode: null,
      causeMessage: null,
      retryable: false,
      requestIdMasked: null,
    };
  }

  const errObj = typeof error === 'object' ? (error as Record<string, unknown>) : {};

  // 1. Extração do Nome do Erro
  let errorName: string | null = null;
  if (typeof errObj.name === 'string' && errObj.name.trim() !== '') {
    errorName = sanitizeSensitiveText(errObj.name.trim());
  } else if (error instanceof Error) {
    errorName = error.name;
  }

  // 2. Extração do Status HTTP
  let httpStatus: number | null = null;
  const rawStatus =
    errObj.status ||
    errObj.statusCode ||
    (typeof errObj.response === 'object' && errObj.response !== null
      ? (errObj.response as Record<string, unknown>).status
      : undefined) ||
    (typeof errObj.api_response === 'object' && errObj.api_response !== null
      ? (errObj.api_response as Record<string, unknown>).status
      : undefined);

  if (
    typeof rawStatus === 'number' &&
    Number.isInteger(rawStatus) &&
    rawStatus >= 100 &&
    rawStatus <= 599
  ) {
    httpStatus = rawStatus;
  } else if (typeof rawStatus === 'string') {
    const parsed = parseInt(rawStatus, 10);
    if (!isNaN(parsed) && parsed >= 100 && parsed <= 599) {
      httpStatus = parsed;
    }
  }

  // 3. Extração da Mensagem Principal
  let rawMessage: string | null = null;
  if (typeof errObj.message === 'string' && errObj.message.trim() !== '') {
    rawMessage = errObj.message.trim();
  } else if (error instanceof Error && error.message.trim() !== '') {
    rawMessage = error.message.trim();
  } else if (typeof errObj.error === 'string' && errObj.error.trim() !== '') {
    rawMessage = errObj.error.trim();
  }

  // 4. Extração do Código de Erro da API
  let apiCode: string | null = null;
  if (typeof errObj.code === 'string' || typeof errObj.code === 'number') {
    apiCode = String(errObj.code).trim();
  } else if (typeof errObj.error === 'string') {
    apiCode = errObj.error.trim();
  }

  // 5. Extração de Causa / Sub-erros (Mercado Pago cause array)
  let causeCode: string | null = null;
  let causeMessage: string | null = null;

  const rawCause = errObj.cause;
  if (Array.isArray(rawCause) && rawCause.length > 0) {
    const firstCause = rawCause[0];
    if (typeof firstCause === 'object' && firstCause !== null) {
      const fcObj = firstCause as Record<string, unknown>;
      if (fcObj.code !== undefined && fcObj.code !== null) {
        causeCode = String(fcObj.code).trim();
      }
      if (typeof fcObj.description === 'string' && fcObj.description.trim() !== '') {
        causeMessage = sanitizeSensitiveText(fcObj.description.trim());
      } else if (typeof fcObj.message === 'string' && fcObj.message.trim() !== '') {
        causeMessage = sanitizeSensitiveText(fcObj.message.trim());
      }
    } else if (typeof firstCause === 'string') {
      causeMessage = sanitizeSensitiveText(firstCause.trim());
    }
  } else if (typeof rawCause === 'string' && rawCause.trim() !== '') {
    causeMessage = sanitizeSensitiveText(rawCause.trim());
  } else if (typeof rawCause === 'object' && rawCause !== null) {
    const causeObj = rawCause as Record<string, unknown>;
    if (causeObj.code !== undefined && causeObj.code !== null) {
      causeCode = String(causeObj.code).trim();
    }
    if (typeof causeObj.description === 'string') {
      causeMessage = sanitizeSensitiveText(causeObj.description.trim());
    } else if (typeof causeObj.message === 'string') {
      causeMessage = sanitizeSensitiveText(causeObj.message.trim());
    }
  }

  // 6. Extração do Request ID
  const requestId =
    errObj.requestId ||
    errObj.request_id ||
    errObj['x-request-id'] ||
    (typeof errObj.headers === 'object' && errObj.headers !== null
      ? (errObj.headers as Record<string, unknown>)['x-request-id']
      : undefined);
  const requestIdMasked = maskRequestId(requestId);

  // 7. Sanitização de Mensagem
  let errorMessage: string | null = rawMessage ? sanitizeSensitiveText(rawMessage) : null;

  // Garantia absoluta contra "[object Object]"
  if (errorMessage && errorMessage.includes('[object Object]')) {
    errorMessage = null;
  }

  // Se nenhum detalhe legível foi obtido, calcular hash curto do objeto de erro sanitizado
  let errorHash: string | undefined;
  if (!errorMessage && !apiCode && !causeCode && !causeMessage && !httpStatus) {
    errorMessage = 'Mercado Pago refund failed without structured provider details';
    try {
      const sanitizedDump = JSON.stringify(errObj);
      errorHash = crypto.createHash('sha256').update(sanitizedDump).digest('hex').slice(0, 8);
    } catch {
      errorHash = 'unserializable';
    }
  }

  const retryable = isErrorRetryable(
    httpStatus,
    `${errorMessage || ''} ${apiCode || ''} ${causeMessage || ''}`,
  );

  return {
    provider: 'mercadopago',
    errorName,
    errorMessage,
    httpStatus,
    apiCode,
    causeCode,
    causeMessage,
    retryable,
    requestIdMasked,
    ...(errorHash ? { errorHash } : {}),
  };
}
