import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

function mimeFromContentType(contentType: string | null) {
  const mime = contentType?.split(';')[0].trim().toLowerCase();
  return mime && mime.startsWith('image/') ? mime : null;
}

// In-memory cache for resolved logo Data URI to ensure high performance
let cachedLogoKey: string | null = null;
let cachedLogoDataUri: string | null = null;

/**
 * Normalizes any image buffer (WebP, PNG, JPEG, SVG, AVIF) to a high-DPI
 * PNG Data URI supported 100% reliably by @react-pdf/renderer.
 */
export async function normalizeToPdfPng(buffer: Buffer): Promise<string | null> {
  if (!buffer || buffer.length === 0) return null;
  try {
    const pngBuffer = await sharp(buffer)
      .resize({ width: 300, height: 300, fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 8 })
      .toBuffer();
    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  } catch (err) {
    console.warn('[PDF_LOGO] Falha ao converter imagem para PNG compatível:', err);
    return null;
  }
}

/**
 * Decodes and normalizes a Data URI string to a PDF-safe PNG Data URI.
 */
async function dataUriToPdfPng(dataUri: string): Promise<string | null> {
  try {
    const base64Index = dataUri.indexOf('base64,');
    if (base64Index === -1) return null;
    const base64Data = dataUri.slice(base64Index + 7);
    const buffer = Buffer.from(base64Data, 'base64');
    return await normalizeToPdfPng(buffer);
  } catch (err) {
    console.warn('[PDF_LOGO] Falha ao processar Data URI:', err);
    return null;
  }
}

export async function loadPdfImage(source: string | null | undefined): Promise<string | null> {
  if (!source) return null;
  try {
    const response = await fetch(source, { cache: 'no-store' });
    const mime = mimeFromContentType(response.headers.get('content-type'));
    console.info('[TechnicalSheetPDF] Imagem remota recebida', {
      sourceHost: new URL(source).hostname,
      status: response.status,
      contentType: response.headers.get('content-type'),
      mime,
    });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > 15 * 1024 * 1024) return null;
    const normalized =
      mime === 'image/jpeg' || mime === 'image/png'
        ? buffer
        : await sharp(buffer).jpeg({ quality: 88 }).toBuffer();
    const outputMime = mime === 'image/jpeg' || mime === 'image/png' ? mime : 'image/jpeg';
    console.info('[TechnicalSheetPDF] Imagem preparada', {
      sourceHost: new URL(source).hostname,
      inputMime: mime,
      outputMime,
      bytes: normalized.length,
    });
    return `data:${outputMime};base64,${normalized.toString('base64')}`;
  } catch {
    console.warn('[TechnicalSheetPDF] Falha ao carregar imagem remota');
    return null;
  }
}

export async function loadLocalPdfImage(fileName: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', fileName);
    const buffer = await fs.readFile(filePath);
    return await normalizeToPdfPng(buffer);
  } catch {
    return null;
  }
}

/**
 * Resolves the logo for PDF generation from the database settings with robust fallbacks:
 * 1. Checks database site_settings for pre-saved Base64 (settings.branding.logoBase64 or settings.logo_base64)
 * 2. Checks database site_settings for custom URL (settings.branding.logoUrl, settings.logo_path, etc.)
 *    Supports WebP, PNG, JPEG, SVG — automatically converts to standard PNG for @react-pdf/renderer.
 * 3. Falls back to reading local public/logo.png or public/logo.jpg from disk.
 * 4. Always returns a valid Data URI ("data:image/png;base64,...") or null so @react-pdf/renderer NEVER hangs or renders blank boxes.
 */
export async function resolvePdfLogo(settings?: any): Promise<string | null> {
  const settingsObj = (settings?.settings || settings) as any;
  const branding = settingsObj?.branding;

  // 1. Direct Base64 from database
  const dbBase64 = branding?.logoBase64 || settingsObj?.logo_base64;
  if (typeof dbBase64 === 'string' && dbBase64.startsWith('data:image/')) {
    if (cachedLogoKey === dbBase64 && cachedLogoDataUri) {
      return cachedLogoDataUri;
    }
    const converted = await dataUriToPdfPng(dbBase64);
    if (converted) {
      cachedLogoKey = dbBase64;
      cachedLogoDataUri = converted;
      return converted;
    }
  }

  // 2. Custom Logo URL from database settings
  const customUrl: string | null =
    branding?.logoUrl ||
    branding?.logoPath ||
    settingsObj?.branding?.logoUrl ||
    settingsObj?.branding?.logoPath ||
    settingsObj?.logo_path ||
    settingsObj?.logo_url ||
    (settings as any)?.logo_url ||
    (settings as any)?.logo_path ||
    null;

  if (typeof customUrl === 'string' && customUrl.trim().length > 0) {
    const trimmedUrl = customUrl.trim();

    if (cachedLogoKey === trimmedUrl && cachedLogoDataUri) {
      return cachedLogoDataUri;
    }

    if (trimmedUrl.startsWith('data:image/')) {
      const converted = await dataUriToPdfPng(trimmedUrl);
      if (converted) {
        cachedLogoKey = trimmedUrl;
        cachedLogoDataUri = converted;
        return converted;
      }
    } else if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      try {
        const res = await fetch(trimmedUrl, {
          cache: 'no-store',
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          const converted = await normalizeToPdfPng(buffer);
          if (converted) {
            cachedLogoKey = trimmedUrl;
            cachedLogoDataUri = converted;
            return converted;
          }
        } else {
          console.warn('[PDF_LOGO] Falha HTTP ao buscar logo da base:', res.status, trimmedUrl);
        }
      } catch (err) {
        console.warn('[PDF_LOGO] Falha ao carregar logo remota da base de dados:', err);
      }
    } else if (trimmedUrl.startsWith('/') || !trimmedUrl.includes('://')) {
      // Relative local file
      const cleaned = trimmedUrl.replace(/^\//, '');
      const localResult = await loadLocalPdfImage(cleaned);
      if (localResult) {
        cachedLogoKey = trimmedUrl;
        cachedLogoDataUri = localResult;
        return localResult;
      }
    }
  }

  // 3. Fallback to local default files in public/
  const fallback = (await loadLocalPdfImage('logo.png')) || (await loadLocalPdfImage('logo.jpg')) || null;
  return fallback;
}
