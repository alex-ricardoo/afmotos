import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isRecoverableStorageError, UploadError, StorageError, ImgBBError } from '../errors.ts';

describe('Upload Errors & isRecoverableStorageError classification', () => {
  it('identifies recoverable HTTP status codes', () => {
    assert.strictEqual(isRecoverableStorageError({ statusCode: 500 }), true);
    assert.strictEqual(isRecoverableStorageError({ statusCode: 502 }), true);
    assert.strictEqual(isRecoverableStorageError({ statusCode: 503 }), true);
    assert.strictEqual(isRecoverableStorageError({ statusCode: 504 }), true);
    assert.strictEqual(isRecoverableStorageError({ statusCode: 408 }), true);
    assert.strictEqual(isRecoverableStorageError({ statusCode: 429 }), true);
    assert.strictEqual(isRecoverableStorageError({ status: 503 }), true);
  });

  it('rejects non-recoverable client and authorization HTTP status codes', () => {
    assert.strictEqual(isRecoverableStorageError({ statusCode: 400 }), false);
    assert.strictEqual(isRecoverableStorageError({ statusCode: 401 }), false);
    assert.strictEqual(isRecoverableStorageError({ statusCode: 403 }), false);
    assert.strictEqual(isRecoverableStorageError({ statusCode: 404 }), false);
    assert.strictEqual(isRecoverableStorageError({ statusCode: 409 }), false);
    assert.strictEqual(isRecoverableStorageError({ statusCode: 413 }), false);
    assert.strictEqual(isRecoverableStorageError({ statusCode: 422 }), false);
    assert.strictEqual(isRecoverableStorageError({ status: 403 }), false);
  });

  it('identifies recoverable network error codes', () => {
    assert.strictEqual(isRecoverableStorageError({ code: 'ECONNRESET' }), true);
    assert.strictEqual(isRecoverableStorageError({ code: 'ECONNABORTED' }), true);
    assert.strictEqual(isRecoverableStorageError({ code: 'ETIMEDOUT' }), true);
    assert.strictEqual(isRecoverableStorageError({ code: 'ENOTFOUND' }), true);
    assert.strictEqual(isRecoverableStorageError({ code: 'EAI_AGAIN' }), true);
  });

  it('rejects non-recoverable error codes (RLS, invalid bucket, uniqueness, etc.)', () => {
    assert.strictEqual(isRecoverableStorageError({ code: '42501' }), false);
    assert.strictEqual(isRecoverableStorageError({ code: '23505' }), false);
    assert.strictEqual(isRecoverableStorageError({ code: 'NoSuchBucket' }), false);
    assert.strictEqual(isRecoverableStorageError({ code: 'InvalidBucketName' }), false);
    assert.strictEqual(isRecoverableStorageError({ code: 'EntityTooLarge' }), false);
    assert.strictEqual(isRecoverableStorageError({ code: 'KeyAlreadyExists' }), false);
    assert.strictEqual(isRecoverableStorageError({ code: 'INVALID_FILE' }), false);
    assert.strictEqual(isRecoverableStorageError({ code: 'UNAUTHORIZED' }), false);
    assert.strictEqual(isRecoverableStorageError({ code: 'FORBIDDEN' }), false);
  });

  it('identifies timeout and abort error names', () => {
    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';
    assert.strictEqual(isRecoverableStorageError(abortErr), true);

    const timeoutErr = new Error('Request timed out');
    timeoutErr.name = 'TimeoutError';
    assert.strictEqual(isRecoverableStorageError(timeoutErr), true);
  });

  it('identifies recoverable phrases in error messages', () => {
    assert.strictEqual(isRecoverableStorageError(new Error('fetch failed')), true);
    assert.strictEqual(isRecoverableStorageError(new Error('Network error when connecting')), true);
    assert.strictEqual(isRecoverableStorageError(new Error('Service Unavailable')), true);
    assert.strictEqual(
      isRecoverableStorageError(new Error('DatabaseTimeout: connection closed')),
      true,
    );
    assert.strictEqual(isRecoverableStorageError(new Error('504 Gateway Time-out')), true);
  });

  it('strictly rejects non-recoverable security and validation phrases', () => {
    assert.strictEqual(
      isRecoverableStorageError(new Error('new row violates row-level security policy')),
      false,
    );
    assert.strictEqual(
      isRecoverableStorageError(new Error('permission denied for table motorcycle_images')),
      false,
    );
    assert.strictEqual(isRecoverableStorageError(new Error('unauthorized access')), false);
    assert.strictEqual(isRecoverableStorageError(new Error('jwt expired')), false);
    assert.strictEqual(
      isRecoverableStorageError(new Error('NoSuchBucket: bucket motorcycle-images')),
      false,
    );
    assert.strictEqual(
      isRecoverableStorageError(new Error('File exceeds maximum allowed size')),
      false,
    );
    assert.strictEqual(isRecoverableStorageError(new Error('Payload too large')), false);
    assert.strictEqual(
      isRecoverableStorageError(new Error('Formato de imagem não permitido')),
      false,
    );
  });

  it('returns false for null, undefined or empty errors', () => {
    assert.strictEqual(isRecoverableStorageError(null), false);
    assert.strictEqual(isRecoverableStorageError(undefined), false);
    assert.strictEqual(isRecoverableStorageError(''), false);
  });

  it('instantiates custom error classes correctly', () => {
    const uploadErr = new UploadError('Upload failed', {
      code: 'CUSTOM_ERR',
      statusCode: 500,
      isTransient: true,
    });
    assert.strictEqual(uploadErr.name, 'UploadError');
    assert.strictEqual(uploadErr.code, 'CUSTOM_ERR');
    assert.strictEqual(uploadErr.statusCode, 500);
    assert.strictEqual(uploadErr.isTransient, true);

    const storageErr = new StorageError('Storage error', { statusCode: 503 });
    assert.strictEqual(storageErr.name, 'StorageError');
    assert.strictEqual(storageErr.code, 'STORAGE_ERROR');
    assert.strictEqual(storageErr.statusCode, 503);

    const imgbbErr = new ImgBBError('ImgBB error', { statusCode: 429 });
    assert.strictEqual(imgbbErr.name, 'ImgBBError');
    assert.strictEqual(imgbbErr.code, 'IMGBB_ERROR');
    assert.strictEqual(imgbbErr.statusCode, 429);
  });
});
