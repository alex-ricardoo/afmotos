import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { cleanPayload } from '../payload.ts';
import { createMercadoPagoPaymentRequestSnapshot } from '../request-snapshot.ts';

describe('Variação 4 — Análise de Compatibilidade e Serialização SDK mercadopago@3.6.1', () => {
  it('garante que Payment.create separa estritamente body de requestOptions e injeta X-Idempotency-Key nos headers', async () => {
    let interceptedUrl: string | null = null;
    let interceptedInit: RequestInit | undefined;

    const originalFetch = globalThis.fetch;
    const idempotencyKey = 'test-idempotency-key-uuid-v4-999';

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      interceptedUrl = typeof input === 'string' ? input : input.toString();
      interceptedInit = init;

      return new Response(
        JSON.stringify({
          id: 123456789,
          status: 'approved',
          status_detail: 'accredited',
          transaction_amount: 49.99,
          payment_method_id: 'master',
        }),
        {
          status: 201,
          headers: {
            'content-type': 'application/json',
            'x-request-id': 'req-mp-intercepted-12345',
          },
        },
      );
    };

    try {
      const config = new MercadoPagoConfig({
        accessToken: 'TEST-1234567890-abcdef-0987654321',
        options: { timeout: 5000 },
      });
      const payment = new Payment(config);

      const rawBody = {
        transaction_amount: 49.99,
        token: 'tok_test_card_123',
        description: 'Consulta Veicular - Placa ABC1D23',
        payment_method_id: 'master',
        installments: 1,
        payer: {
          email: 'comprador@teste.com',
          identification: {
            type: 'CPF',
            number: '12345678909',
          },
        },
        external_reference: 'cons-123-uuid',
      };

      const cleanedBody = cleanPayload(rawBody);

      const result = await payment.create({
        body: cleanedBody as Parameters<typeof payment.create>[0]['body'],
        requestOptions: {
          idempotencyKey,
        },
      });

      assert.equal(result.id, 123456789);
      assert.equal(result.status, 'approved');

      // 1. Valida URL da API Mercado Pago
      assert.ok(interceptedUrl);
      assert.equal(interceptedUrl, 'https://api.mercadopago.com/v1/payments');

      // 2. Valida Headers HTTP
      assert.ok(interceptedInit);
      const headers = interceptedInit.headers as Record<string, string>;
      assert.ok(headers);
      assert.equal(headers['Content-Type'], 'application/json');
      assert.equal(headers['Authorization'], 'Bearer TEST-1234567890-abcdef-0987654321');
      assert.equal(headers['X-Idempotency-Key'], idempotencyKey);
      assert.ok(headers['User-Agent']?.includes('MercadoPago Node.js SDK v3.6.1'));
      assert.ok(headers['X-Product-Id']);
      assert.ok(headers['X-Tracking-Id']);

      // 3. Valida Body HTTP Serializado
      const parsedBody = JSON.parse(String(interceptedInit.body));
      assert.equal(parsedBody.transaction_amount, 49.99);
      assert.equal(typeof parsedBody.transaction_amount, 'number');
      assert.equal(parsedBody.token, 'tok_test_card_123');
      assert.equal(parsedBody.payment_method_id, 'master');
      assert.equal(parsedBody.installments, 1);
      assert.equal(parsedBody.payer.email, 'comprador@teste.com');
      assert.equal(parsedBody.payer.identification.type, 'CPF');
      assert.equal(parsedBody.payer.identification.number, '12345678909');

      // 4. Garante que requestOptions JAMAIS entra dentro do body HTTP
      assert.equal('requestOptions' in parsedBody, false);
      assert.equal('idempotencyKey' in parsedBody, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('valida geração de snapshot sanitizado para comparação segura AF Motos x Moura’s Pizzas', () => {
    const body = cleanPayload({
      transaction_amount: 49.99,
      token: 'tok_very_secret_token_12345',
      payment_method_id: 'master',
      installments: 1,
      payer: {
        email: 'alex.ricardo@empresa.com.br',
        identification: {
          type: 'CPF',
          number: '12345678909',
        },
      },
      external_reference: 'uuid-referencia-ext-99',
    });

    const snapshot = createMercadoPagoPaymentRequestSnapshot(
      body,
      { idempotencyKey: 'idemp-secret-key-123' },
      { flowId: 'flow-test-123', tokenCreatedAt: Date.now() - 500 },
    );

    // Garante que NENHUM dado sensível vaza no snapshot
    assert.ok(snapshot.snapshotId);
    assert.equal(snapshot.request.token.present, true);
    assert.equal(snapshot.request.token.length, 'tok_very_secret_token_12345'.length);
    assert.ok(snapshot.request.token.hashTruncated);
    assert.notEqual(snapshot.request.token.hashTruncated, 'tok_very_secret_token_12345');

    assert.equal(snapshot.request.payer.email.domainOrHash, '@empresa.com.br');
    assert.equal(snapshot.request.payer.identification.digitCount, 11);
    assert.equal(snapshot.request.payer.identification.type, 'CPF');

    assert.ok(snapshot.request.idempotency.hashTruncated);
    assert.notEqual(snapshot.request.idempotency.hashTruncated, 'idemp-secret-key-123');
    assert.equal(snapshot.request.idempotency.fieldUsed, 'requestOptions.idempotencyKey');
  });
});
