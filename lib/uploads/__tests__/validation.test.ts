import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateImageFile } from '../validation.ts';

describe('validateImageFile input validation & sanitization', () => {
  it('rejects null or empty files', () => {
    // @ts-expect-error testing null
    const resNull = validateImageFile(null);
    assert.strictEqual(resNull.valid, false);

    const emptyBlob = new Blob([], { type: 'image/jpeg' });
    const resEmpty = validateImageFile(emptyBlob);
    assert.strictEqual(resEmpty.valid, false);
  });

  it('rejects files exceeding maximum size limit', () => {
    const largeBlob = new Blob([new Uint8Array(25 * 1024 * 1024)], { type: 'image/jpeg' });
    const res = validateImageFile(largeBlob, 20 * 1024 * 1024);
    assert.strictEqual(res.valid, false);
    assert.match(res.error || '', /20 MB/);
  });

  it('rejects non-image or unsupported MIME types', () => {
    const pdfBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    const resPdf = validateImageFile(pdfBlob);
    assert.strictEqual(resPdf.valid, false);

    const txtBlob = new Blob(['hello'], { type: 'text/plain' });
    const resTxt = validateImageFile(txtBlob);
    assert.strictEqual(resTxt.valid, false);
  });

  it('accepts allowed image MIME types and extracts clean extensions', () => {
    const jpegFile = new File([new Uint8Array(100)], 'foto.jpg', { type: 'image/jpeg' });
    const resJpeg = validateImageFile(jpegFile);
    assert.strictEqual(resJpeg.valid, true);
    assert.strictEqual(resJpeg.extension, 'jpg');

    const pngFile = new File([new Uint8Array(100)], 'foto.png', { type: 'image/png' });
    const resPng = validateImageFile(pngFile);
    assert.strictEqual(resPng.valid, true);
    assert.strictEqual(resPng.extension, 'png');

    const webpFile = new File([new Uint8Array(100)], 'foto.webp', { type: 'image/webp' });
    const resWebp = validateImageFile(webpFile);
    assert.strictEqual(resWebp.valid, true);
    assert.strictEqual(resWebp.extension, 'webp');
  });

  it('sanitizes unsafe filenames and path traversal attempts', () => {
    const maliciousFile = new File([new Uint8Array(100)], '../../../etc/passwd.jpg', {
      type: 'image/jpeg',
    });
    const res = validateImageFile(maliciousFile);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.sanitizedName?.includes('..'), false);
    assert.strictEqual(res.sanitizedName?.includes('/'), false);
  });
});
