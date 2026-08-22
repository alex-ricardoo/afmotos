import { SUPABASE_STORAGE_BUCKETS } from './constants';

export interface ImageRecordLike {
  provider?: string | null;
  public_url?: string | null;
  storage_path?: string | null;
  display_url?: string | null;
  thumbnail_url?: string | null;
  url?: string | null;
}

/**
 * Resolves the canonical display URL for an image.
 * Works seamlessly with:
 * 1. ImgBB images (provider = 'imgbb', public_url)
 * 2. Supabase Storage images (provider = 'supabase', storage_path or public_url)
 * 3. Legacy images without provider (storage_path)
 * 4. External full URLs (http:// or https://)
 */
export function getImageSource(
  image?: ImageRecordLike | string | null,
  options?: { useThumbnail?: boolean; fallbackUrl?: string },
): string {
  const fallback = options?.fallbackUrl || '';

  if (!image) return fallback;

  // If passed directly as a string
  if (typeof image === 'string') {
    const trimmed = image.trim();
    if (!trimmed) return fallback;

    // Full URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // Relative storage path
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKETS.MOTORCYCLE_IMAGES}/${trimmed}`;
    }
    return trimmed;
  }

  // If thumbnail is requested and available
  if (options?.useThumbnail && image.thumbnail_url) {
    return image.thumbnail_url;
  }

  // 1. If explicit public_url exists, use it
  if (
    image.public_url &&
    (image.public_url.startsWith('http://') || image.public_url.startsWith('https://'))
  ) {
    return image.public_url;
  }

  // 2. If precomputed url exists
  if (image.url && (image.url.startsWith('http://') || image.url.startsWith('https://'))) {
    return image.url;
  }

  // 3. If storage_path is already an absolute URL
  if (
    image.storage_path &&
    (image.storage_path.startsWith('http://') || image.storage_path.startsWith('https://'))
  ) {
    return image.storage_path;
  }

  // 4. If storage_path is a relative path in Supabase bucket
  if (image.storage_path) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKETS.MOTORCYCLE_IMAGES}/${image.storage_path}`;
    }
    return image.storage_path;
  }

  // 5. Fallback to display_url if available
  if (image.display_url) {
    return image.display_url;
  }

  return fallback;
}
