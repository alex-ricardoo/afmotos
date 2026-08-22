import { FipexError } from './errors';

const FIPEX_BASE_URL = 'https://api.fipex.com.br';
const DEFAULT_TIMEOUT_MS = 10000;

export type FipexRequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
};

/**
 * Cliente HTTP isolado para a API fipeX com suporte a timeout, retries limitados e cancelamento.
 */
export async function fipexFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
  options: FipexRequestOptions = {},
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 1, signal } = options;

  const url = new URL(path.startsWith('/') ? path : `/${path}`, FIPEX_BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Se o caller passar um signal, cancelar se o caller cancelar
    const abortHandler = () => controller.abort();
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeoutId);
        throw new FipexError('Requisição cancelada.', 'TIMEOUT');
      }
      signal.addEventListener('abort', abortHandler);
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', abortHandler);

      if (response.status === 429) {
        if (attempt < retries) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }
        throw new FipexError('Limite de requisições excedido.', 'RATE_LIMITED', 429);
      }

      if (response.status === 404) {
        throw new FipexError('Recurso não encontrado.', 'NOT_FOUND', 404);
      }

      if (response.status >= 500) {
        if (attempt < retries) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        throw new FipexError(
          'Servidor fipeX temporariamente indisponível.',
          'SERVER',
          response.status,
        );
      }

      if (!response.ok) {
        throw new FipexError(
          `Erro na consulta: ${response.statusText}`,
          'VALIDATION',
          response.status,
        );
      }

      try {
        const json = await response.json();
        return json as T;
      } catch {
        throw new FipexError('Resposta JSON inválida.', 'PARSE');
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', abortHandler);

      lastError = err;

      if (err instanceof FipexError) {
        throw err;
      }

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new FipexError('Tempo limite de consulta excedido.', 'TIMEOUT');
        }
        if (attempt < retries) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        throw new FipexError(err.message, 'NETWORK');
      }
    }
  }

  throw lastError instanceof FipexError
    ? lastError
    : new FipexError('Falha ao conectar com o serviço fipeX.', 'NETWORK');
}
