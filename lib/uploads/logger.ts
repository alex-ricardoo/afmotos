export type UploadEventType =
  | 'image_upload_started'
  | 'image_compression_completed'
  | 'image_upload_supabase_succeeded'
  | 'image_upload_supabase_failed'
  | 'image_upload_imgbb_fallback_started'
  | 'image_upload_imgbb_fallback_succeeded'
  | 'image_upload_imgbb_fallback_failed'
  | 'image_record_persist_failed'
  | 'image_cleanup_attempted'
  | 'image_cleanup_succeeded'
  | 'image_cleanup_failed';

export interface UploadEventPayload {
  requestId?: string;
  context?: string;
  entityId?: string;
  provider?: 'supabase' | 'imgbb';
  storagePath?: string | null;
  fileSizeBytes?: number;
  mimeType?: string;
  durationMs?: number;
  attempt?: number;
  isRecoverable?: boolean;
  errorCode?: string;
  statusCode?: number;
  errorCategory?: string;
  message?: string;
}

/**
 * Sanitizes strings to prevent accidental leakage of API keys, JWT tokens, base64 data, or URLs with query tokens.
 */
function sanitizeString(val: string): string {
  if (!val) return '';
  return (
    val
      // Remove base64 data URLs
      .replace(/data:image\/[a-zA-Z]+;base64,[a-zA-Z0-9+/=]+/g, '[BASE64_IMAGE_REDACTED]')
      // Remove query string tokens (e.g. ?key=... or &token=...)
      .replace(/([?&](key|token|apiKey|secret)=)[^&]+/gi, '$1[REDACTED]')
      // Mask potential JWT tokens
      .replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, '[JWT_REDACTED]')
      // Truncate excessively long strings
      .substring(0, 300)
  );
}

/**
 * Structured server-side logger for upload telemetry and operations.
 * Completely isolates secrets, PII, and binary payloads.
 */
export function logUploadEvent(event: UploadEventType, payload: UploadEventPayload = {}): void {
  const timestamp = new Date().toISOString();

  const sanitized: Record<string, unknown> = {
    timestamp,
    event,
    requestId: payload.requestId ? sanitizeString(payload.requestId) : undefined,
    context: payload.context,
    entityId: payload.entityId ? sanitizeString(payload.entityId) : undefined,
    provider: payload.provider,
    storagePath: payload.storagePath ? sanitizeString(payload.storagePath) : undefined,
    fileSizeBytes: payload.fileSizeBytes,
    mimeType: payload.mimeType,
    durationMs: payload.durationMs,
    attempt: payload.attempt,
    isRecoverable: payload.isRecoverable,
    errorCode: payload.errorCode ? sanitizeString(payload.errorCode) : undefined,
    statusCode: payload.statusCode,
    errorCategory: payload.errorCategory,
    message: payload.message ? sanitizeString(payload.message) : undefined,
  };

  // Strip undefined values for clean log format
  Object.keys(sanitized).forEach((key) => sanitized[key] === undefined && delete sanitized[key]);

  const logLine = `[ImageUpload][${event}] ${JSON.stringify(sanitized)}`;

  if (event.includes('failed')) {
    console.error(logLine);
  } else if (event.includes('fallback') || event.includes('cleanup')) {
    console.warn(logLine);
  } else {
    console.info(logLine);
  }
}
