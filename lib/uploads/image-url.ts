import { SUPABASE_STORAGE_BUCKETS } from './constants.ts';

export interface ImageRecordLike {
  provider?: string | null;
  public_url?: string | null;
  storage_path?: string | null;
  display_url?: string | null;
  thumbnail_url?: string | null;
  url?: string | null;
}

export interface ResolveImageUrlOptions {
  useThumbnail?: boolean;
  fallbackUrl?: string;
  bucket?: string;
}

/**
 * Universal image URL resolver for the AF Motos platform.
 * Transparently resolves images from:
 * 1. Supabase Storage (provider = 'supabase', storage_path or public_url)
 * 2. ImgBB (provider = 'imgbb', public_url, display_url, thumbnail_url)
 * 3. Legacy records without explicit provider
 * 4. External full URLs (http:// or https://)
 */
export function resolveImageUrl(
  image?: ImageRecordLike | string | null,
  options?: ResolveImageUrlOptions,
): string {
  const fallback = options?.fallbackUrl || '';
  const bucketName = options?.bucket || SUPABASE_STORAGE_BUCKETS.MOTORCYCLE_IMAGES;

  if (!image) return fallback;

  // 1. If passed directly as a string (URL or relative path)
  if (typeof image === 'string') {
    const trimmed = image.trim();
    if (!trimmed) return fallback;

    // Full absolute URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // Relative storage path
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${trimmed}`;
    }
    return trimmed;
  }

  // 2. If thumbnail is specifically requested and available
  if (options?.useThumbnail && image.thumbnail_url) {
    return image.thumbnail_url;
  }

  // 3. If explicit canonical public_url exists
  if (
    image.public_url &&
    (image.public_url.startsWith('http://') || image.public_url.startsWith('https://'))
  ) {
    return image.public_url;
  }

  // 4. If precomputed url exists
  if (image.url && (image.url.startsWith('http://') || image.url.startsWith('https://'))) {
    return image.url;
  }

  // 5. If storage_path is already an absolute URL
  if (
    image.storage_path &&
    (image.storage_path.startsWith('http://') || image.storage_path.startsWith('https://'))
  ) {
    return image.storage_path;
  }

  // 6. If storage_path is a relative path in Supabase bucket
  if (image.storage_path) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${image.storage_path}`;
    }
    return image.storage_path;
  }

  // 7. Fallback to display_url if available
  if (image.display_url) {
    return image.display_url;
  }

  return fallback;
}

/**
 * Backward-compatible alias for resolveImageUrl.
 */
export const getImageSource = resolveImageUrl;
