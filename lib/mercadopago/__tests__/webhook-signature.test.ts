import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  validateWebhookSignature,
  resolveMercadoPagoWebhookResourceId,
  parseSignatureHeader,
} from '../webhook-service.ts';
import {
  isValidMercadoPagoRedirectUrl,
  maskEmail,
  maskCpf,
  maskIdentifier,
  timingSafeCompare,
  timingSafeCompareHexBuffers,
  isValidSha256Hex,
} from '../security.ts';
import {
  TEST_WEBHOOK_SECRET,
  buildOfficialManifest,
  computeHmacSha256,
  createRealPaymentWebhookFixture,
} from './fixtures/webhook-fixtures.ts';

describe('Mercado Pago Real Webhook Signature & Security', () => {
  const originalSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
  });

  afterEach(() => {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = originalSecret;
  });

  // T01: Assinatura válida com template exato oficial
  it('T01: valida assinatura legítima com template oficial id:{id};request-id:{req};ts:{ts};', () => {
    const fixture = createRealPaymentWebhookFixture();
    const headers = new Headers({
      'x-signature': fixture.signatureHeader,
      'x-request-id': fixture.requestId,
    });

    const res = validateWebhookSignature(headers, fixture.resourceId);
    assert.equal(res.isValid, true);
    assert.equal(res.resourceId, fixture.resourceId);
    assert.equal(res.timestamp, fixture.timestamp);
    assert.equal(res.receivedDigestLength, 64);
    assert.equal(res.expectedDigestLength, 64);
    assert.ok(res.manifestHash);
  });

  // T02: Ordem invertida no cabeçalho x-signature
  it('T02: aceita cabeçalho com ordem invertida (v1 antes de ts)', () => {
    const fixture = createRealPaymentWebhookFixture(TEST_WEBHOOK_SECRET, { order: 'v1_first' });
    const headers = new Headers({
      'x-signature': fixture.signatureHeader,
      'x-request-id': fixture.requestId,
    });

    const res = validateWebhookSignature(headers, fixture.resourceId);
    assert.equal(res.isValid, true);
    assert.equal(res.timestamp, fixture.timestamp);
  });

  // T03: Espaços em branco opcionais
  it('T03: tolera espaços ao redor de vírgulas e sinais de igual no cabeçalho', () => {
    const fixture = createRealPaymentWebhookFixture(TEST_WEBHOOK_SECRET, { spaces: true });
    const headers = new Headers({
      'x-signature': fixture.signatureHeader,
      'x-request-id': fixture.requestId,
    });

    const res = validateWebhookSignature(headers, fixture.resourceId);
    assert.equal(res.isValid, true);
  });

  // T04: Campos adicionais desconhecidos no cabeçalho
  it('T04: tolera parâmetros adicionais sem quebrar o parser', () => {
    const fixture = createRealPaymentWebhookFixture(TEST_WEBHOOK_SECRET, { extraFields: true });
    const headers = new Headers({
      'x-signature': fixture.signatureHeader,
      'x-request-id': fixture.requestId,
    });

    const res = validateWebhookSignature(headers, fixture.resourceId);
    assert.equal(res.isValid, true);
  });

  // T05: Cabeçalho x-signature ausente
  it('T05: rejeita quando x-signature estiver ausente', () => {
    const headers = new Headers({
      'x-request-id': 'req-uuid-123',
    });

    const res = validateWebhookSignature(headers, '177857907601');
    assert.equal(res.isValid, false);
    assert.equal(res.reasonCode, 'missing_signature');
  });

  // T06: Cabeçalho x-request-id ausente
  it('T06: rejeita quando x-request-id estiver ausente', () => {
    const headers = new Headers({
      'x-signature': 'ts=1704067200,v1=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    });

    const res = validateWebhookSignature(headers, '177857907601');
    assert.equal(res.isValid, false);
    assert.equal(res.reasonCode, 'missing_request_id');
  });

  // T07: Resource ID ausente
  it('T07: rejeita quando o identificador de recurso for nulo ou vazio', () => {
    const headers = new Headers({
      'x-signature': 'ts=1704067200,v1=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      'x-request-id': 'req-uuid-123',
    });

    const res = validateWebhookSignature(headers, null);
    assert.equal(res.isValid, false);
    assert.equal(res.reasonCode, 'missing_resource_id');
  });

  // T08: Digest não hexadecimal
  it('T08: rejeita quando v1 contiver caracteres não hexadecimais', () => {
    const headers = new Headers({
      'x-signature': 'ts=1704067200,v1=ZZZZZZ0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      'x-request-id': 'req-uuid-123',
    });

    const res = validateWebhookSignature(headers, '177857907601');
    assert.equal(res.isValid, false);
    assert.equal(res.reasonCode, 'invalid_digest_format');
  });

  // T09: Digest com tamanho diferente de 64 caracteres
  it('T09: rejeita quando v1 possuir comprimento divergente de 64 hexadecimais', () => {
    const headers = new Headers({
      'x-signature': 'ts=1704067200,v1=abc123',
      'x-request-id': 'req-uuid-123',
    });

    const res = validateWebhookSignature(headers, '177857907601');
    assert.equal(res.isValid, false);
    assert.equal(res.reasonCode, 'digest_length_mismatch');
  });

  // T10: Digest alterado / mismatch
  it('T10: rejeita quando a assinatura não conferir com o hash esperado', () => {
    const headers = new Headers({
      'x-signature': 'ts=1704067200,v1=0000000000000000000000000000000000000000000000000000000000000000',
      'x-request-id': 'req-uuid-123',
    });

    const res = validateWebhookSignature(headers, '177857907601');
    assert.equal(res.isValid, false);
    assert.equal(res.reasonCode, 'signature_mismatch');
  });

  // T11: Segredo de webhook ausente no servidor
  it('T11: rejeita de forma controlada quando MERCADO_PAGO_WEBHOOK_SECRET estiver ausente', () => {
    delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;

    const headers = new Headers({
      'x-signature': 'ts=1704067200,v1=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      'x-request-id': 'req-uuid-123',
    });

    const res = validateWebhookSignature(headers, '177857907601');
    assert.equal(res.isValid, false);
    assert.equal(res.reasonCode, 'missing_webhook_secret');
  });

  // T12: Extração de resource ID com payload.data.id string
  it('T12: extrai resourceId quando data.id do payload for string', () => {
    const req = new Request('https://afmotos.vercel.app/api/webhooks/mercadopago');
    const payload = {
      action: 'payment.created',
      data: { id: '177857907601' },
    };

    const id = resolveMercadoPagoWebhookResourceId(req, payload);
    assert.equal(id, '177857907601');
  });

  // T13: Extração de resource ID com payload.data.id numérico
  it('T13: extrai resourceId quando data.id do payload for número', () => {
    const req = new Request('https://afmotos.vercel.app/api/webhooks/mercadopago');
    const payload = {
      action: 'payment.created',
      data: { id: 177857907601 },
    };

    const id = resolveMercadoPagoWebhookResourceId(req, payload);
    assert.equal(id, '177857907601');
  });

  // T14: Extração de resource ID a partir da query string
  it('T14: extrai resourceId de query params (data.id e id) com normalização segura', () => {
    const reqWithDataId = new Request(
      'https://afmotos.vercel.app/api/webhooks/mercadopago?data.id=177857907601&type=payment',
    );
    assert.equal(resolveMercadoPagoWebhookResourceId(reqWithDataId, {}), '177857907601');

    const reqWithAlphaQuery = new Request(
      'https://afmotos.vercel.app/api/webhooks/mercadopago?data.id=ORD-1234ABC',
    );
    assert.equal(resolveMercadoPagoWebhookResourceId(reqWithAlphaQuery, null), 'ord-1234abc');

    const reqWithGenericId = new Request(
      'https://afmotos.vercel.app/api/webhooks/mercadopago?id=99887766',
    );
    assert.equal(resolveMercadoPagoWebhookResourceId(reqWithGenericId, null), '99887766');

    const reqEmpty = new Request('https://afmotos.vercel.app/api/webhooks/mercadopago');
    assert.equal(resolveMercadoPagoWebhookResourceId(reqEmpty, {}), null);
  });

  // Verificações complementares de segurança e mascaramento
  it('valida redirecionamentos para hosts oficiais do Mercado Pago', () => {
    assert.equal(
      isValidMercadoPagoRedirectUrl(
        'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123',
      ),
      true,
    );
    assert.equal(
      isValidMercadoPagoRedirectUrl(
        'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=123',
      ),
      true,
    );
    assert.equal(isValidMercadoPagoRedirectUrl('https://evil-site.com/mercadopago'), false);
  });

  it('mascara dados confidenciais nos utilitários de segurança', () => {
    assert.equal(maskEmail('cliente@example.com'), 'c***e@example.com');
    assert.equal(maskCpf('12345678901'), '***.456.***-01');
    assert.equal(maskIdentifier('1234567890abcdef'), '1234...cdef');
  });

  it('valida utilitários de comparação de buffers hexadecimais', () => {
    const hashA = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
    const hashB = 'ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789';
    const hashC = '1111110123456789abcdef0123456789abcdef0123456789abcdef0123456789';

    assert.equal(isValidSha256Hex(hashA), true);
    assert.equal(isValidSha256Hex(hashB), true);
    assert.equal(isValidSha256Hex('curto'), false);
    assert.equal(timingSafeCompareHexBuffers(hashA, hashB), true);
    assert.equal(timingSafeCompareHexBuffers(hashA, hashC), false);
    assert.equal(timingSafeCompare('foo', 'foo'), true);
    assert.equal(timingSafeCompare('foo', 'bar'), false);
  });
});
