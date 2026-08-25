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
