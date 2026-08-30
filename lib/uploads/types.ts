export type ImageUploadProvider = 'supabase' | 'imgbb';

export type UploadImageContext =
  'motorcycle' | 'sell_request' | 'consignment_request' | 'site_settings' | 'profile' | 'other';

export interface UploadIntent {
  /** Unique client/session idempotent identifier for this upload attempt */
  uploadRequestId?: string;
  /** Context / entity type */
  entityType?: UploadImageContext;
  /** Related entity ID */
  entityId?: string;
  /** Optional file fingerprint or unique tag */
  fileFingerprint?: string;
}

export interface UploadImageInput {
  /** The binary File or Blob to upload */
  file: File | Blob;
  /** Business context for bucket/path organization */
  context: UploadImageContext;
  /** Related entity ID (e.g. motorcycleId, requestId, userId) */
  entityId?: string;
  /** Optional file name override or original name */
  fileName?: string;
  /** Optional accessibility / SEO alt text */
  altText?: string;
  /** Unique client request / idempotency tracking ID */
  uploadRequestId?: string;
  /** Abort signal for user cancellation */
  signal?: AbortSignal;
}

export interface UploadedImage {
  /** Provider that stored the file ('supabase' as primary, 'imgbb' as fallback) */
  provider: ImageUploadProvider;
  /** Canonical public URL for web display */
  publicUrl: string;
  /** Intermediate viewer / display URL if provided by ImgBB */
  displayUrl: string | null;
  /** Thumbnail URL if provided by ImgBB */
  thumbnailUrl: string | null;
  /** Relative storage path within Supabase Storage bucket (if provider === 'supabase') */
  storagePath: string | null;
  /** Delete URL if provided by ImgBB */
  deleteUrl: string | null;
  /** Original/sanitized file name */
  originalName: string | null;
  /** Validated MIME type */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Indicates whether ImgBB fallback was triggered */
  fallbackTriggered?: boolean;
}

export interface UploadServiceResult {
  success: boolean;
  image?: UploadedImage;
  error?: string;
  fallbackTriggered?: boolean;
}
