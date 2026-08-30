import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { resolveImageUrl, getImageSource } from '../image-url.ts';

describe('resolveImageUrl & getImageSource URL Resolver', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
  });

  it('returns fallback URL when image is empty, null or undefined', () => {
    assert.strictEqual(resolveImageUrl(null, { fallbackUrl: '/fallback.jpg' }), '/fallback.jpg');
    assert.strictEqual(
      resolveImageUrl(undefined, { fallbackUrl: '/fallback.jpg' }),
      '/fallback.jpg',
    );
    assert.strictEqual(resolveImageUrl('', { fallbackUrl: '/fallback.jpg' }), '/fallback.jpg');
    assert.strictEqual(resolveImageUrl(null), '');
  });

  it('resolves direct external URL strings', () => {
    const url = 'https://i.ibb.co/abc123/moto.webp';
    assert.strictEqual(resolveImageUrl(url), url);
    assert.strictEqual(getImageSource(url), url);
  });

  it('resolves relative Supabase storage path strings', () => {
    const relativePath = 'motorcycles/moto-123/uuid-456.webp';
    const expected =
      'https://xyz.supabase.co/storage/v1/object/public/motorcycle-images/motorcycles/moto-123/uuid-456.webp';
    assert.strictEqual(resolveImageUrl(relativePath), expected);
    assert.strictEqual(getImageSource(relativePath), expected);
  });

  it('resolves ImageRecord with public_url (ImgBB or Supabase direct)', () => {
    const record = {
      provider: 'imgbb',
      public_url: 'https://i.ibb.co/test/photo.jpg',
      storage_path: null,
    };
    assert.strictEqual(resolveImageUrl(record), 'https://i.ibb.co/test/photo.jpg');
  });

  it('resolves ImageRecord with storage_path in Supabase bucket', () => {
    const record = {
      provider: 'supabase',
      public_url: null,
      storage_path: 'motorcycles/789/image.jpg',
    };
    const expected =
      'https://xyz.supabase.co/storage/v1/object/public/motorcycle-images/motorcycles/789/image.jpg';
    assert.strictEqual(resolveImageUrl(record), expected);
  });

  it('resolves thumbnail_url when useThumbnail is true', () => {
    const record = {
      provider: 'imgbb',
      public_url: 'https://i.ibb.co/test/full.jpg',
      thumbnail_url: 'https://i.ibb.co/test/thumb.jpg',
    };
    assert.strictEqual(
      resolveImageUrl(record, { useThumbnail: true }),
      'https://i.ibb.co/test/thumb.jpg',
    );
    assert.strictEqual(
      resolveImageUrl(record, { useThumbnail: false }),
      'https://i.ibb.co/test/full.jpg',
    );
  });

  it('resolves display_url as fallback when public_url is missing', () => {
    const record = {
      display_url: 'https://ibb.co/viewer/123',
    };
    assert.strictEqual(resolveImageUrl(record), 'https://ibb.co/viewer/123');
  });

  it('maintains getImageSource as an exact alias of resolveImageUrl', () => {
    assert.strictEqual(getImageSource, resolveImageUrl);
  });
});
