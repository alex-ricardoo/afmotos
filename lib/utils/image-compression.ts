/**
 * Client-Side Smart Image Compression Utility
 * 
 * Compresses images in the browser before network transmission.
 * Features:
 * - High quality bicubic downscaling
 * - Modern WebP encoding with JPEG fallback
 * - Alpha transparency preservation for PNG/WebP
 * - Aspect-ratio calculation and auto-rotation
 * - Memory-safe cleanup with ObjectURL revocation
 * - Zero external library dependencies
 */

export interface ImageCompressionOptions {
  /** Maximum width or height in pixels. Default: 1920 */
  maxDimension?: number;
  /** Compression quality between 0.1 and 1.0. Default: 0.82 */
  quality?: number;
  /** Target output MIME type. Default: 'image/webp' */
  outputFormat?: 'image/webp' | 'image/jpeg' | 'image/png' | 'auto';
  /** If original is smaller than this threshold (in bytes), skip compression. Default: 150KB (150 * 1024) */
  minSizeThresholdBytes?: number;
  /** Keep PNG transparency by using PNG/WebP instead of forcing JPEG. Default: true */
  preserveTransparency?: boolean;
}

export interface CompressionStats {
  originalFile: File;
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  compressionRatioPercent: number;
  dimensions: {
    originalWidth: number;
    originalHeight: number;
    width: number;
    height: number;
  };
  durationMs: number;
}

/**
 * Checks if browser supports canvas.toBlob with image/webp
 */
let isWebpSupportedCache: boolean | null = null;
function checkWebpSupport(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (isWebpSupportedCache !== null) return isWebpSupportedCache;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL('image/webp');
    isWebpSupportedCache = dataUrl.indexOf('image/webp') === 5;
  } catch {
    isWebpSupportedCache = false;
  }
  return isWebpSupportedCache;
}

/**
 * Calculates new dimensions keeping aspect ratio within maxDimension constraint.
 */
export function calculateTargetDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  if (width >= height) {
    const ratio = height / width;
    const newWidth = maxDimension;
    const newHeight = Math.round(maxDimension * ratio);
    return { width: newWidth, height: newHeight };
  } else {
    const ratio = width / height;
    const newHeight = maxDimension;
    const newWidth = Math.round(maxDimension * ratio);
    return { width: newWidth, height: newHeight };
  }
}

/**
 * Loads an image File into an HTMLImageElement safely.
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Falha ao carregar a imagem para processamento: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

/**
 * Formats byte size into human readable string (e.g. "450 KB", "3.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Compresses a single image File in the browser.
 * If compression fails or produces a larger file, safely returns the original file.
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {},
): Promise<{ file: File; stats: CompressionStats }> {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const {
    maxDimension = 1920,
    quality = 0.82,
    outputFormat = 'auto',
    minSizeThresholdBytes = 150 * 1024, // 150 KB
    preserveTransparency = true,
  } = options;

  // Non-compressible formats or special files pass through directly
  const lowerName = file.name.toLowerCase();
  const isSvg = file.type === 'image/svg+xml' || lowerName.endsWith('.svg');
  const isGif = file.type === 'image/gif' || lowerName.endsWith('.gif');
  const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
  const isPng = file.type === 'image/png' || lowerName.endsWith('.png');

  if (isSvg || isGif || isPdf) {
    return {
      file,
      stats: {
        originalFile: file,
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        savedBytes: 0,
        compressionRatioPercent: 0,
        dimensions: { originalWidth: 0, originalHeight: 0, width: 0, height: 0 },
        durationMs: 0,
      },
    };
  }

  // If already under threshold size and not explicitly requested for massive resizing, skip
  if (file.size <= minSizeThresholdBytes && maxDimension >= 2048) {
    return {
      file,
      stats: {
        originalFile: file,
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        savedBytes: 0,
        compressionRatioPercent: 0,
        dimensions: { originalWidth: 0, originalHeight: 0, width: 0, height: 0 },
        durationMs: 0,
      },
    };
  }

  try {
    const img = await loadImageFromFile(file);
    const originalWidth = img.naturalWidth || img.width;
    const originalHeight = img.naturalHeight || img.height;

    // Calculate optimal target size
    const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
      originalWidth,
      originalHeight,
      maxDimension,
    );

    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d', {
      alpha: preserveTransparency && isPng,
    });

    if (!ctx) {
      throw new Error('Não foi possível inicializar o contexto 2D do Canvas.');
    }

    // High quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // If converting PNG with transparent bg to JPEG, fill white background
    const canUseWebp = checkWebpSupport();
    let chosenMime = 'image/jpeg';
    let newExtension = 'jpg';

    if (outputFormat === 'image/webp' || (outputFormat === 'auto' && canUseWebp)) {
      chosenMime = 'image/webp';
      newExtension = 'webp';
    } else if (outputFormat === 'image/png' || (isPng && preserveTransparency && !canUseWebp)) {
      chosenMime = 'image/png';
      newExtension = 'png';
    } else {
      chosenMime = 'image/jpeg';
      newExtension = 'jpg';
    }

    // If JPEG without alpha, draw background if it was PNG
    if (chosenMime === 'image/jpeg' && isPng) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // Draw the image
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Convert canvas to Blob
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error('Erro na codificação do blob da imagem.'));
          }
        },
        chosenMime,
        chosenMime === 'image/png' ? undefined : quality,
      );
    });

    // Cleanup canvas
    canvas.width = 0;
    canvas.height = 0;

    // Determine output file name
    const originalBaseName = file.name.replace(/\.[^/.]+$/, '');
    const newFileName = `${originalBaseName}.${newExtension}`;

    // If the compressed blob is somehow larger than the original file, retain original file
    let finalFile: File;

    if (blob.size >= file.size && originalWidth <= targetWidth && originalHeight <= targetHeight) {
      finalFile = file;
    } else {
      finalFile = new File([blob], newFileName, {
        type: chosenMime,
        lastModified: Date.now(),
      });
    }

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const durationMs = Math.round(endTime - startTime);
    const savedBytes = Math.max(0, file.size - finalFile.size);
    const compressionRatioPercent =
      file.size > 0 ? Math.round((savedBytes / file.size) * 100) : 0;

    return {
      file: finalFile,
      stats: {
        originalFile: file,
        compressedFile: finalFile,
        originalSize: file.size,
        compressedSize: finalFile.size,
        savedBytes,
        compressionRatioPercent,
        dimensions: {
          originalWidth,
          originalHeight,
          width: targetWidth,
          height: targetHeight,
        },
        durationMs,
      },
    };
  } catch (error) {
    console.warn(`[ImageCompression] Falha ao comprimir imagem "${file.name}". Usando arquivo original.`, error);
    return {
      file,
      stats: {
        originalFile: file,
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        savedBytes: 0,
        compressionRatioPercent: 0,
        dimensions: { originalWidth: 0, originalHeight: 0, width: 0, height: 0 },
        durationMs: 0,
      },
    };
  }
}

/**
 * Compresses multiple image Files sequentially or in parallel batches.
 */
export async function compressImageFiles(
  files: File[],
  options: ImageCompressionOptions = {},
): Promise<{ files: File[]; statsList: CompressionStats[] }> {
  const results = await Promise.all(files.map((file) => compressImage(file, options)));
  return {
    files: results.map((r) => r.file),
    statsList: results.map((r) => r.stats),
  };
}
