import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatSiteDomain, resolveCurrentSiteDomain, formatStoreInstagram } from '../../pdf/domain.ts';

describe('PDF Domain Resolution Engine', () => {
  it('should format domain with http/https correctly', () => {
    const res1 = formatSiteDomain('https://afmotos.com.br/');
    assert.strictEqual(res1.fullUrl, 'https://afmotos.com.br');
    assert.strictEqual(res1.displayDomain, 'afmotos.com.br');

    const res2 = formatSiteDomain('http://localhost:3000');
    assert.strictEqual(res2.fullUrl, 'http://localhost:3000');
    assert.strictEqual(res2.displayDomain, 'localhost:3000');

    const res3 = formatSiteDomain('meusite.com.br');
    assert.strictEqual(res3.fullUrl, 'https://meusite.com.br');
    assert.strictEqual(res3.displayDomain, 'meusite.com.br');
  });

  it('should resolve from x-forwarded-host header with proto', () => {
    const req = {
      headers: new Headers({
        'x-forwarded-host': 'afmotos.com.br',
        'x-forwarded-proto': 'https',
      }),
    };
    const res = resolveCurrentSiteDomain(req as any);
    assert.strictEqual(res.fullUrl, 'https://afmotos.com.br');
    assert.strictEqual(res.displayDomain, 'afmotos.com.br');
  });

  it('should resolve from host header for localhost', () => {
    const req = {
      headers: new Headers({
        host: 'localhost:3000',
      }),
    };
    const res = resolveCurrentSiteDomain(req as any);
    assert.strictEqual(res.fullUrl, 'http://localhost:3000');
    assert.strictEqual(res.displayDomain, 'localhost:3000');
  });

  it('should resolve from origin header if host is not present', () => {
    const req = {
      headers: new Headers({
        origin: 'https://preview.afmotos.com',
      }),
    };
    const res = resolveCurrentSiteDomain(req as any);
    assert.strictEqual(res.fullUrl, 'https://preview.afmotos.com');
    assert.strictEqual(res.displayDomain, 'preview.afmotos.com');
  });

  it('should resolve from referer header if host and origin are not present', () => {
    const req = {
      headers: new Headers({
        referer: 'https://afmotos.com.br/admin/vendas/123',
      }),
    };
    const res = resolveCurrentSiteDomain(req as any);
    assert.strictEqual(res.fullUrl, 'https://afmotos.com.br');
    assert.strictEqual(res.displayDomain, 'afmotos.com.br');
  });

  it('should use explicit override if provided', () => {
    const req = {
      headers: new Headers({
        host: 'otherdomain.com',
      }),
    };
    const res = resolveCurrentSiteDomain(req as any, 'https://customsite.com.br');
    assert.strictEqual(res.fullUrl, 'https://customsite.com.br');
    assert.strictEqual(res.displayDomain, 'customsite.com.br');
  });

  it('should fallback to default site URL when no request or window is provided', () => {
    const res = resolveCurrentSiteDomain(null);
    assert.ok(res.fullUrl.length > 0);
    assert.ok(res.displayDomain.length > 0);
  });
});

describe('Store Instagram Resolution Engine for PDFs', () => {
  it('should format full Instagram URL correctly', () => {
    const res = formatStoreInstagram('https://www.instagram.com/afveiculospe/');
    assert.deepStrictEqual(res, {
      fullUrl: 'https://www.instagram.com/afveiculospe/',
      displayHandle: '@afveiculospe',
    });
  });

  it('should format Instagram URL with query parameters', () => {
    const res = formatStoreInstagram('https://instagram.com/afveiculospe?igsh=MXJ5aDJ4bmY=');
    assert.strictEqual(res?.displayHandle, '@afveiculospe');
    assert.strictEqual(res?.fullUrl, 'https://instagram.com/afveiculospe?igsh=MXJ5aDJ4bmY=');
  });

  it('should format @handle directly', () => {
    const res = formatStoreInstagram('@afveiculospe');
    assert.deepStrictEqual(res, {
      fullUrl: 'https://www.instagram.com/afveiculospe/',
      displayHandle: '@afveiculospe',
    });
  });

  it('should format plain username directly', () => {
    const res = formatStoreInstagram('afveiculospe');
    assert.deepStrictEqual(res, {
      fullUrl: 'https://www.instagram.com/afveiculospe/',
      displayHandle: '@afveiculospe',
    });
  });

  it('should extract from database site_settings record', () => {
    const dbRecord = {
      site_name: 'AF Veículos PE',
      settings: {
        socialLinks: {
          instagram: 'https://www.instagram.com/afveiculospe/',
        },
      },
    };
    const res = formatStoreInstagram(dbRecord);
    assert.deepStrictEqual(res, {
      fullUrl: 'https://www.instagram.com/afveiculospe/',
      displayHandle: '@afveiculospe',
    });
  });

  it('should extract from legacy site_settings record', () => {
    const dbRecord = {
      site_name: 'AF Veículos PE',
      settings: {
        instagram_url: 'https://www.instagram.com/afveiculospe/',
      },
    };
    const res = formatStoreInstagram(dbRecord);
    assert.deepStrictEqual(res, {
      fullUrl: 'https://www.instagram.com/afveiculospe/',
      displayHandle: '@afveiculospe',
    });
  });

  it('should extract from public resolved settings object', () => {
    const resolvedSettings = {
      siteName: 'AF Veículos PE',
      socialLinks: [
        { key: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/afveiculospe/' },
      ],
    };
    const res = formatStoreInstagram(resolvedSettings);
    assert.deepStrictEqual(res, {
      fullUrl: 'https://www.instagram.com/afveiculospe/',
      displayHandle: '@afveiculospe',
    });
  });

  it('should return null for null, empty or missing instagram', () => {
    assert.strictEqual(formatStoreInstagram(null), null);
    assert.strictEqual(formatStoreInstagram(undefined), null);
    assert.strictEqual(formatStoreInstagram(''), null);
    assert.strictEqual(formatStoreInstagram('   '), null);
    assert.strictEqual(formatStoreInstagram({ settings: {} }), null);
  });
});

