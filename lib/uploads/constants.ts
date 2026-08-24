export const UPLOAD_LIMITS = {
  /** Maximum uncompressed file size accepted for uploads (20 MB) */
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024,
  /** Maximum server-side ImgBB provider limit (32 MB) */
  MAX_IMGBB_FILE_SIZE_BYTES: 32 * 1024 * 1024,
  /** Request timeout for ImgBB API in milliseconds (15 seconds) */
  IMGBB_TIMEOUT_MS: 15000,
  /** Maximum retries on transient errors for ImgBB */
  MAX_IMGBB_RETRIES: 2,
  /** Base retry delay in milliseconds */
  RETRY_BASE_DELAY_MS: 500,
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
} as const;

export const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
