export class UploadError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly isTransient: boolean;

  constructor(
    message: string,
    options?: { code?: string; statusCode?: number; isTransient?: boolean; cause?: unknown },
  ) {
    super(message);
    this.name = 'UploadError';
    this.code = options?.code || 'UPLOAD_FAILED';
    this.statusCode = options?.statusCode;
    this.isTransient = options?.isTransient ?? false;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export class StorageError extends UploadError {
  constructor(
    message: string,
    options?: { statusCode?: number; isTransient?: boolean; cause?: unknown; code?: string },
  ) {
    super(message, {
      code: options?.code || 'STORAGE_ERROR',
      statusCode: options?.statusCode,
      isTransient: options?.isTransient,
      cause: options?.cause,
    });
    this.name = 'StorageError';
  }
}

export class ImgBBError extends UploadError {
  constructor(
    message: string,
    options?: { statusCode?: number; isTransient?: boolean; cause?: unknown },
  ) {
    super(message, {
      code: 'IMGBB_ERROR',
      statusCode: options?.statusCode,
      isTransient: options?.isTransient,
      cause: options?.cause,
    });
    this.name = 'ImgBBError';
  }
}

// Alias for backwards compatibility if referenced
export const StorageFallbackError = StorageError;

/**
 * Evaluates whether an error encountered when interacting with Supabase Storage
 * is a transient, recoverable infrastructure failure that qualifies for retry / fallback.
 *
 * Strictly returns FALSE for client errors (400, 401, 403, 404, 413),
 * RLS violations, bucket misconfiguration, or validation issues.
 */
export function isRecoverableStorageError(error: unknown): boolean {
  if (!error) return false;

  // 1. Check direct statusCode if present
  const statusCode =
    typeof error === 'object' && error !== null && 'statusCode' in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : typeof error === 'object' && error !== null && 'status' in error
        ? Number((error as { status?: unknown }).status)
        : undefined;

  if (statusCode !== undefined && !isNaN(statusCode)) {
    // Non-recoverable client errors (Bad request, Unauthorized, Forbidden, Bucket Not Found, Entity Too Large)
    if ([400, 401, 403, 404, 409, 413, 422].includes(statusCode)) {
      return false;
    }

    // Recoverable server / gateway / rate limit errors
    if ([408, 429, 500, 502, 503, 504].includes(statusCode)) {
      return true;
    }
  }

  // 2. Check error codes (Node network codes & Supabase codes)
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  const nonRecoverableCodes = [
    '23505', // unique_violation
    '42501', // insufficient_privilege / RLS
    'NoSuchBucket',
    'InvalidBucketName',
    'EntityTooLarge',
    'KeyAlreadyExists',
    'INVALID_FILE',
    'UNAUTHORIZED',
    'FORBIDDEN',
  ];

  if (nonRecoverableCodes.includes(code)) {
    return false;
  }

  const recoverableCodes = [
    'ECONNRESET',
    'ECONNABORTED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_SOCKET',
  ];

  if (recoverableCodes.includes(code)) {
    return true;
  }

  // 3. Inspect error message & error name
  const name = (error as Error)?.name || '';
  if (name === 'AbortError' || name === 'TimeoutError') {
    return true;
  }

  const message = ((error as Error)?.message || String(error)).toLowerCase();

  // Explicit non-recoverable phrases
  const nonRecoverablePhrases = [
    'row-level security',
    'violates row-level security',
    'permission denied',
    'unauthorized',
    'jwt expired',
    'invalid jwt',
    'bucket not found',
    'nosuchbucket',
    'exceeds maximum',
    'too large',
    'entity too large',
    'formato de imagem não permitido',
    'invalid mime',
    'selecione uma imagem válida',
  ];

  for (const phrase of nonRecoverablePhrases) {
    if (message.includes(phrase)) {
      return false;
    }
  }

  // Explicit recoverable phrases
  const recoverablePhrases = [
    'timeout',
    'timed out',
    'econnreset',
    'econnaborted',
    'fetch failed',
    'network error',
    'networkerror',
    'failed to fetch',
    'service unavailable',
    'gateway timeout',
    'bad gateway',
    '503 service temporarily unavailable',
    '502 bad gateway',
    '504 gateway time-out',
    'internal server error',
    'database timeout',
  ];

  for (const phrase of recoverablePhrases) {
    if (message.includes(phrase)) {
      return true;
    }
  }

  // Default to non-recoverable for unknown/unclassified errors to prevent hiding config/RLS issues
  return false;
}
