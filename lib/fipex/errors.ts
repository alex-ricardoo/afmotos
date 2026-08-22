export type FipexErrorCode =
  'TIMEOUT' | 'RATE_LIMITED' | 'NOT_FOUND' | 'VALIDATION' | 'SERVER' | 'NETWORK' | 'PARSE';

export class FipexError extends Error {
  constructor(
    message: string,
    public readonly code: FipexErrorCode,
    public readonly status?: number,
    public readonly correlationId?: string,
  ) {
    super(message);
    this.name = 'FipexError';
  }
}

export const FIPEX_ERROR_MESSAGES: Record<FipexErrorCode, string> = {
  TIMEOUT: 'O serviço de consulta está temporariamente indisponível.',
  RATE_LIMITED: 'Muitas consultas em sequência. Aguarde alguns instantes.',
  NOT_FOUND: 'Veículo ou referência não encontrada para os parâmetros informados.',
  VALIDATION: 'Parâmetros de consulta inválidos.',
  SERVER: 'O serviço de consulta está temporariamente indisponível.',
  NETWORK: 'Verifique sua conexão com a internet.',
  PARSE: 'Não foi possível processar a resposta do serviço.',
};

export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof FipexError) {
    return FIPEX_ERROR_MESSAGES[error.code] || error.message;
  }
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return FIPEX_ERROR_MESSAGES.TIMEOUT;
    }
    return error.message;
  }
  return 'Ocorreu um erro inesperado ao consultar a Tabela FIPE.';
}
