import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveActiveProviderAdapter, type CreateCardPaymentInput } from '../payment-provider.ts';
import { getPaymentProvider } from '../payment-provider-factory.ts';
import { MercadoPagoPaymentProviderV2 } from '../payment-provider-v2.ts';
import { MercadoPagoPaymentProviderV3 } from '../payment-provider-v3.ts';

describe('Mercado Pago Payment Provider Adapter Architecture (Feature 027)', () => {
  // Garantir token de teste para o runner
  process.env.MERCADO_PAGO_ACCESS_TOKEN =
    process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-mock-token-for-tests';
  it('deve resolver o adapter padrão como v3 quando a variável de ambiente não estiver definida', () => {
    const originalEnv = process.env.MERCADO_PAGO_PROVIDER_ADAPTER;
    try {
      delete process.env.MERCADO_PAGO_PROVIDER_ADAPTER;
      assert.equal(resolveActiveProviderAdapter(), 'v3');
    } finally {
      process.env.MERCADO_PAGO_PROVIDER_ADAPTER = originalEnv;
    }
  });

  it('deve resolver o adapter como v2 quando MERCADO_PAGO_PROVIDER_ADAPTER for configurado com v2', () => {
    const originalEnv = process.env.MERCADO_PAGO_PROVIDER_ADAPTER;
    try {
      process.env.MERCADO_PAGO_PROVIDER_ADAPTER = 'v2';
      assert.equal(resolveActiveProviderAdapter(), 'v2');
    } finally {
      process.env.MERCADO_PAGO_PROVIDER_ADAPTER = originalEnv;
    }
  });

  it('deve instanciar MercadoPagoPaymentProviderV2 quando solicitado v2', () => {
    const provider = getPaymentProvider('v2');
    assert.equal(provider.version, 'v2');
    assert.ok(provider instanceof MercadoPagoPaymentProviderV2);
  });

  it('deve instanciar MercadoPagoPaymentProviderV3 quando solicitado v3', () => {
    const provider = getPaymentProvider('v3');
    assert.equal(provider.version, 'v3');
    assert.ok(provider instanceof MercadoPagoPaymentProviderV3);
  });

  it('o adapter v2 deve tratar erro técnico e mapear para provider_error sem expor access token', async () => {
    const provider = new MercadoPagoPaymentProviderV2('TEST-FAKE-TOKEN-12345');
    const input: CreateCardPaymentInput = {
      transactionAmount: 49.99,
      token: 'fake-token-test',
      description: 'Consulta Teste',
      installments: 1,
      paymentMethodId: 'master',
      payerEmail: 'teste@exemplo.com',
      payerCpf: '12345678909',
      externalReference: 'ref-123',
      idempotencyKey: 'idemp-123',
    };

    const result = await provider.createCardPayment(input);
    assert.equal(result.success, false);
    assert.equal(result.status, 'provider_error');
    assert.ok(result.error);
    // Certifica ausência de token de acesso na mensagem de erro
    assert.equal(result.error.message.includes('TEST-FAKE-TOKEN-12345'), false);
  });

  it('o adapter v3 deve tratar erro técnico e mapear para provider_error sem expor access token', async () => {
    const provider = new MercadoPagoPaymentProviderV3('TEST-FAKE-TOKEN-12345');
    const input: CreateCardPaymentInput = {
      transactionAmount: 49.99,
      token: 'fake-token-test',
      description: 'Consulta Teste',
      installments: 1,
      paymentMethodId: 'master',
      payerEmail: 'teste@exemplo.com',
      payerCpf: '12345678909',
      externalReference: 'ref-123',
      idempotencyKey: 'idemp-123',
    };

    const result = await provider.createCardPayment(input);
    assert.equal(result.success, false);
    assert.equal(result.status, 'provider_error');
    assert.ok(result.error);
    assert.equal(result.error.message.includes('TEST-FAKE-TOKEN-12345'), false);
  });
});
