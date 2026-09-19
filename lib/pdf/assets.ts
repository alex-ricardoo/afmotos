import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

function mimeFromContentType(contentType: string | null) {
  const mime = contentType?.split(';')[0].trim().toLowerCase();
  return mime && mime.startsWith('image/') ? mime : null;
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
    if (!response.ok || !mime) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > 12 * 1024 * 1024) return null;
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
    const mime = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

/**
 * Resolves the logo for PDF generation from the database settings with robust fallbacks:
 * 1. Checks database site_settings for pre-saved Base64 (settings.branding.logoBase64 or settings.logo_base64)
 * 2. Checks database site_settings for custom URL (settings.branding.logoUrl or settings.logo_path)
 *    If it is a data URI, returns it directly.
 *    If it is an HTTP/HTTPS URL, attempts to fetch it with a strict 2s timeout and convert to Base64.
 * 3. Falls back to reading local public/logo.jpg or public/logo.png from disk.
 * 4. Always returns a valid Data URI ("data:image/...;base64,...") or null so @react-pdf/renderer NEVER hangs or renders blank boxes.
 */
export async function resolvePdfLogo(settings?: any): Promise<string | null> {
  const settingsObj = (settings?.settings || settings) as any;
  const branding = settingsObj?.branding;

  // 1. Direct Base64 from database (highest priority, 0 network overhead)
  const dbBase64 = branding?.logoBase64 || settingsObj?.logo_base64;
  if (typeof dbBase64 === 'string' && dbBase64.startsWith('data:image/')) {
    return dbBase64;
  }

  // 2. Custom Logo URL from database
  const customUrl = branding?.logoUrl || settingsObj?.logo_path || (settings as any)?.logo_url;
  if (typeof customUrl === 'string' && customUrl.trim().length > 0) {
    if (customUrl.startsWith('data:image/')) {
      return customUrl;
    }
    if (customUrl.startsWith('http://') || customUrl.startsWith('https://')) {
      try {
        const res = await fetch(customUrl, {
          cache: 'no-store',
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || 'image/jpeg';
          const buffer = Buffer.from(await res.arrayBuffer());
          if (buffer.length > 0) {
            return `data:${contentType};base64,${buffer.toString('base64')}`;
          }
        }
      } catch (err) {
        console.warn('[PDF_LOGO] Falha ao carregar logo remota da base de dados, usando fallback local:', err);
      }
    }
  }

  // 3. Fallback to local files
  return (await loadLocalPdfImage('logo.jpg')) || (await loadLocalPdfImage('logo.png')) || null;
}

