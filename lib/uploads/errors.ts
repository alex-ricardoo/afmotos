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

export class StorageFallbackError extends UploadError {
  constructor(message: string, cause?: unknown) {
    super(message, {
      code: 'STORAGE_FALLBACK_ERROR',
      isTransient: false,
      cause,
    });
    this.name = 'StorageFallbackError';
  }
}
