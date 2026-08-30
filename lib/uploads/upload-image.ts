import { UPLOAD_LIMITS } from './constants';
import { isRecoverableStorageError, UploadError } from './errors';
import { uploadToImgBB } from './imgbb';
import { logUploadEvent } from './logger';
import { uploadToSupabaseStorage } from './supabase-storage';
import { UploadedImage, UploadImageInput } from './types';
import { validateImageFile } from './validation';

/**
 * Master image upload orchestrator following the strict Supabase-first strategy:
 * 1. Validate file format and size limits.
 * 2. Attempt primary upload via Supabase Storage.
 * 3. If transient recoverable error occurs, perform a single controlled retry with backoff & jitter (300-800ms).
 * 4. If Supabase fails again recoverably, activate ImgBB automatic fallback using the exact same compressed file.
 * 5. If any non-recoverable error occurs (RLS, permissions, bad request, file size limit), abort immediately without fallback.
 * 6. If both providers fail, throw normalized user-friendly error with full server telemetry.
 */
export async function uploadImage(input: UploadImageInput): Promise<UploadedImage> {
  const startTime = Date.now();
  const requestId = input.uploadRequestId || crypto.randomUUID();
  const originalSize = input.file.size;
  const mimeType = (input.file as File).type || 'image/jpeg';

  logUploadEvent('image_upload_started', {
    requestId,
    context: input.context,
    entityId: input.entityId,
    fileSizeBytes: originalSize,
    mimeType,
  });

  // Step 1: Pre-validation (reject bad files immediately before any network calls)
  const validation = validateImageFile(input.file);
  if (!validation.valid) {
    throw new UploadError(validation.error || 'Arquivo de imagem inválido.', {
      code: 'INVALID_FILE',
      isTransient: false,
      statusCode: 400,
    });
  }

  // Check user cancellation before starting
  if (input.signal?.aborted) {
    throw new UploadError('Upload cancelado pelo usuário.', {
      code: 'ABORTED',
      isTransient: false,
    });
  }

  // Step 2: Attempt 1 on Supabase Storage (Primary Provider)
  let supabaseAttempt = 1;
  let lastSupabaseError: unknown = null;

  while (supabaseAttempt <= 1 + UPLOAD_LIMITS.MAX_SUPABASE_RETRIES) {
    try {
      const supabaseResult = await uploadToSupabaseStorage(input);
      const durationMs = Date.now() - startTime;

      logUploadEvent('image_upload_supabase_succeeded', {
        requestId,
        context: input.context,
        entityId: input.entityId,
        provider: 'supabase',
        storagePath: supabaseResult.storagePath,
        fileSizeBytes: originalSize,
        mimeType,
        durationMs,
        attempt: supabaseAttempt,
      });

      return supabaseResult;
    } catch (err: unknown) {
      lastSupabaseError = err;
      const isRecoverable = isRecoverableStorageError(err);
      const errorCode =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : undefined;
      const statusCode =
        typeof err === 'object' && err !== null && 'statusCode' in err
          ? Number((err as { statusCode?: unknown }).statusCode)
          : undefined;

      logUploadEvent('image_upload_supabase_failed', {
        requestId,
        context: input.context,
        entityId: input.entityId,
        provider: 'supabase',
        attempt: supabaseAttempt,
        isRecoverable,
        errorCode,
        statusCode,
        message: (err as Error)?.message,
      });

      // If error is non-recoverable (e.g. 400, 401, 403, 413, RLS, NoSuchBucket, invalid mime), abort immediately!
      if (!isRecoverable) {
        // Human-friendly message for file size vs generic error
        if (
          statusCode === 413 ||
          errorCode === 'EntityTooLarge' ||
          (err as Error)?.message?.includes('too large')
        ) {
          throw new UploadError(
            'Esta imagem excede o tamanho máximo permitido. Tente usar uma imagem menor.',
            {
              code: 'ENTITY_TOO_LARGE',
              statusCode: 413,
              isTransient: false,
              cause: err,
            },
          );
        }

        throw new UploadError(
          (err as Error)?.message || 'Não foi possível salvar a imagem no armazenamento principal.',
          {
            code: errorCode || 'STORAGE_PERMANENT_ERROR',
            statusCode,
            isTransient: false,
            cause: err,
          },
        );
      }

      // If user aborted during request, do not retry
      if (input.signal?.aborted) {
        throw new UploadError('Upload cancelado pelo usuário.', {
          code: 'ABORTED',
          isTransient: false,
        });
      }

      // If we still have a retry available for Supabase
      if (supabaseAttempt <= UPLOAD_LIMITS.MAX_SUPABASE_RETRIES) {
        supabaseAttempt++;
        // Apply backoff with jitter (300ms - 800ms)
        const jitter =
          Math.random() *
          (UPLOAD_LIMITS.SUPABASE_RETRY_MAX_DELAY_MS - UPLOAD_LIMITS.SUPABASE_RETRY_MIN_DELAY_MS);
        const delayMs = UPLOAD_LIMITS.SUPABASE_RETRY_MIN_DELAY_MS + jitter;
        await new Promise((res) => setTimeout(res, delayMs));
        continue;
      }

      // Exhausted Supabase attempts with recoverable failure; break to fallback
      break;
    }
  }

  // Step 3: Trigger ImgBB Fallback (Only on recoverable Supabase failure)
  const hasImgbbKey = Boolean(process.env.IMGBB_API_KEY && process.env.IMGBB_API_KEY.trim() !== '');

  if (!hasImgbbKey) {
    logUploadEvent('image_upload_imgbb_fallback_failed', {
      requestId,
      context: input.context,
      entityId: input.entityId,
      provider: 'imgbb',
      errorCode: 'IMGBB_KEY_MISSING',
      message: 'IMGBB_API_KEY não configurada no servidor para acionar fallback.',
    });

    throw new UploadError(
      'Não foi possível enviar a imagem no momento. Por favor, tente novamente.',
      {
        code: 'PRIMARY_FAILED_NO_FALLBACK',
        isTransient: true,
        cause: lastSupabaseError,
      },
    );
  }

  logUploadEvent('image_upload_imgbb_fallback_started', {
    requestId,
    context: input.context,
    entityId: input.entityId,
    provider: 'imgbb',
    fileSizeBytes: originalSize,
    mimeType,
  });

  try {
    const imgbbResult = await uploadToImgBB(input);
    const durationMs = Date.now() - startTime;

    logUploadEvent('image_upload_imgbb_fallback_succeeded', {
      requestId,
      context: input.context,
      entityId: input.entityId,
      provider: 'imgbb',
      fileSizeBytes: originalSize,
      mimeType,
      durationMs,
    });

    return imgbbResult;
  } catch (imgbbError: unknown) {
    logUploadEvent('image_upload_imgbb_fallback_failed', {
      requestId,
      context: input.context,
      entityId: input.entityId,
      provider: 'imgbb',
      message: (imgbbError as Error)?.message,
      errorCode: (imgbbError as UploadError)?.code,
      statusCode: (imgbbError as UploadError)?.statusCode,
    });

    throw new UploadError(
      'Não foi possível enviar a imagem no momento. Por favor, tente novamente.',
      {
        code: 'ALL_PROVIDERS_FAILED',
        isTransient: true,
        cause: {
          supabaseError: lastSupabaseError,
          imgbbError,
        },
      },
    );
  }
}
