export const UPLOAD_LIMITS = {
  /** Maximum uncompressed file size accepted for uploads (20 MB) */
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024,
  /** Maximum server-side ImgBB provider limit (32 MB) */
  MAX_IMGBB_FILE_SIZE_BYTES: 32 * 1024 * 1024,
  /** Request timeout for Supabase Storage in milliseconds (10 seconds) */
  SUPABASE_TIMEOUT_MS: 10000,
  /** Maximum retries on transient recoverable errors for Supabase Storage (1 retry) */
  MAX_SUPABASE_RETRIES: 1,
  /** Min backoff delay for Supabase retry in milliseconds */
  SUPABASE_RETRY_MIN_DELAY_MS: 300,
  /** Max backoff delay for Supabase retry in milliseconds */
  SUPABASE_RETRY_MAX_DELAY_MS: 800,
  /** Request timeout for ImgBB API in milliseconds (15 seconds) */
  IMGBB_TIMEOUT_MS: 15000,
  /** Maximum retries on transient errors for ImgBB fallback (1 retry) */
  MAX_IMGBB_RETRIES: 1,
  /** Base retry delay for ImgBB in milliseconds */
  IMGBB_RETRY_BASE_DELAY_MS: 500,
} as const;

export const ALLOWED_IMAGE_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

export const SUPABASE_STORAGE_BUCKETS = {
  MOTORCYCLE_IMAGES: 'motorcycle-images',
  AGREEMENTS: 'agreements',
} as const;

export const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
