import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatSiteDomain, resolveCurrentSiteDomain } from '../../pdf/domain.ts';

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
