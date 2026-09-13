import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isCacheEntryEligibleForPaidProduction,
  isMockRawResponsePayload,
  type CacheEligibilityCandidate,
} from '../cache-eligibility.ts';
import { classifyProviderFailure } from '../failure-classifier.ts';

test('T01 - Cache Live Concluído em Produção é Elegível', () => {
  const liveRecord: CacheEligibilityCandidate = {
    id: 'vpc-live-123',
    status: 'COMPLETED',
    is_mock: false,
    mode: 'live',
    provider: 'apibrasil',
    raw_response: {
      placa: 'ABC1234',
      marca: 'HONDA',
      modelo: 'CB 600F',
    },
    consulted_at: new Date().toISOString(),
  };

  const result = isCacheEntryEligibleForPaidProduction({
    runtimeEnvironment: 'production',
    cacheRecord: liveRecord,
    isPaidTransaction: true,
  });

  assert.equal(result.eligible, true, 'Cache live concluído deve ser elegível em produção');
  assert.equal(result.nextAction, 'USE_CACHE');
  assert.equal(result.reasonCode, undefined);
});

test('T02 - Cache Mock em Produção é Rejeitado', () => {
  const mockRecord: CacheEligibilityCandidate = {
    id: '4b6f3e33-ce83-43a6-b146-fc27b9b3d129',
    status: 'COMPLETED',
    is_mock: true,
    mode: 'mock',
    provider: 'apibrasil',
    raw_response: {
      message: 'Consulta simulada (Mock Fallback)',
      data: {
        placa: 'PFX3G12',
        marca: 'Marca Fictícia',
        modelo: 'SUV Conceito Flex',
      },
    },
    consulted_at: new Date().toISOString(),
  };

  const result = isCacheEntryEligibleForPaidProduction({
    runtimeEnvironment: 'production',
    cacheRecord: mockRecord,
    isPaidTransaction: true,
  });

  assert.equal(result.eligible, false, 'Cache mock deve ser categoricamente rejeitado em produção');
  assert.equal(result.reasonCode, 'MOCK_CACHE_IN_PRODUCTION');
  assert.equal(result.nextAction, 'CALL_LIVE_PROVIDER');
});

test('T03 - Cache com provider = mock é Rejeitado', () => {
  const mockProviderRecord: CacheEligibilityCandidate = {
    id: 'vpc-mock-provider',
    status: 'COMPLETED',
    is_mock: false,
    mode: 'live',
    provider: 'mock',
    raw_response: { placa: 'ABC1234' },
    consulted_at: new Date().toISOString(),
  };

  const result = isCacheEntryEligibleForPaidProduction({
    runtimeEnvironment: 'production',
    cacheRecord: mockProviderRecord,
    isPaidTransaction: true,
  });

  assert.equal(result.eligible, false);
  assert.equal(result.reasonCode, 'INVALID_PROVIDER');
  assert.equal(result.nextAction, 'CALL_LIVE_PROVIDER');
});

test('T04 - Cache com Payload de Fixture Disfarçado é Rejeitado', () => {
  const sneakyFixtureRecord: CacheEligibilityCandidate = {
    id: 'vpc-sneaky',
    status: 'COMPLETED',
    is_mock: false,
    mode: 'live',
    provider: 'apibrasil',
    raw_response: {
      message: 'Consulta simulada (Mock Fallback)',
      data: {
        placa: 'PFX3G12',
        marca: 'Marca Fictícia',
      },
    },
    consulted_at: new Date().toISOString(),
  };

  const result = isCacheEntryEligibleForPaidProduction({
    runtimeEnvironment: 'production',
    cacheRecord: sneakyFixtureRecord,
    isPaidTransaction: true,
  });

  assert.equal(result.eligible, false, 'Payload com texto de mock deve ser rejeitado');
  assert.equal(result.reasonCode, 'MOCK_CACHE_IN_PRODUCTION');
});

test('T05 - Cache sem is_mock Confiável (null ou undefined) é Rejeitado', () => {
  const legacyUnknownRecord: CacheEligibilityCandidate = {
    id: 'vpc-legacy',
    status: 'COMPLETED',
    is_mock: null,
    mode: 'live',
    provider: 'apibrasil',
    raw_response: { placa: 'ABC1234' },
    consulted_at: new Date().toISOString(),
  };

  const result = isCacheEntryEligibleForPaidProduction({
    runtimeEnvironment: 'production',
    cacheRecord: legacyUnknownRecord,
    isPaidTransaction: true,
  });

  assert.equal(result.eligible, false);
  assert.equal(result.reasonCode, 'UNKNOWN_CACHE_ORIGIN');
  assert.equal(result.nextAction, 'CALL_LIVE_PROVIDER');
});

test('T06 - Cache com Status Não Concluído é Rejeitado', () => {
  const processingRecord: CacheEligibilityCandidate = {
    id: 'vpc-pending',
    status: 'PROCESSING',
    is_mock: false,
    mode: 'live',
    provider: 'apibrasil',
    raw_response: { placa: 'ABC1234' },
  };

  const result = isCacheEntryEligibleForPaidProduction({
    runtimeEnvironment: 'production',
    cacheRecord: processingRecord,
    isPaidTransaction: true,
  });

  assert.equal(result.eligible, false);
  assert.equal(result.reasonCode, 'STATUS_NOT_COMPLETED');
});

test('T07 - Cache Vazio ou sem Payload é Rejeitado', () => {
  const emptyRecord: CacheEligibilityCandidate = {
    id: 'vpc-empty',
    status: 'COMPLETED',
    is_mock: false,
    mode: 'live',
    provider: 'apibrasil',
    raw_response: null,
  };

  const result = isCacheEntryEligibleForPaidProduction({
    runtimeEnvironment: 'production',
    cacheRecord: emptyRecord,
    isPaidTransaction: true,
  });

  assert.equal(result.eligible, false);
  assert.equal(result.reasonCode, 'INCOMPLETE_RESULT');
});

test('T08 - Cache Expirado por TTL é Rejeitado', () => {
  const expiredDate = new Date(Date.now() - 3600 * 1000 * 25).toISOString(); // 25 horas atrás
  const expiredRecord: CacheEligibilityCandidate = {
    id: 'vpc-expired',
    status: 'COMPLETED',
    is_mock: false,
    mode: 'live',
    provider: 'apibrasil',
    raw_response: { placa: 'ABC1234' },
    consulted_at: expiredDate,
  };

  const result = isCacheEntryEligibleForPaidProduction({
    runtimeEnvironment: 'production',
    cacheRecord: expiredRecord,
    isPaidTransaction: true,
    ttlSeconds: 86400, // 24h
  });

  assert.equal(result.eligible, false);
  assert.equal(result.reasonCode, 'EXPIRED_CACHE');
  assert.equal(result.nextAction, 'CALL_LIVE_PROVIDER');
});

test('T09 - Cache Mock em Desenvolvimento Sem Pagamento Real é Permitido', () => {
  const devMockRecord: CacheEligibilityCandidate = {
    id: 'vpc-dev-mock',
    status: 'COMPLETED',
    is_mock: true,
    mode: 'mock',
    provider: 'apibrasil',
    raw_response: { message: 'Consulta simulada' },
  };

  const result = isCacheEntryEligibleForPaidProduction({
    runtimeEnvironment: 'development',
    cacheRecord: devMockRecord,
    isPaidTransaction: false,
  });

  assert.equal(
    result.eligible,
    true,
    'Mock em desenvolvimento para testes locais deve ser permitido',
  );
  assert.equal(result.nextAction, 'USE_CACHE');
});

test('T10 - Modo Mock em Produção Gera Falha Permanente e Bloqueio', () => {
  const classified = classifyProviderFailure('MOCK_MODE_IN_PRODUCTION');

  assert.equal(classified.failureClass, 'permanent');
  assert.equal(classified.failureCode, 'APIBRASIL_MOCK_MODE_IN_PRODUCTION');
  assert.ok(classified.errorMessageSafe.includes('Ambiente de produção configurado indevidamente'));
});

test('T11 - Detector de Fixture Mock Identifica Padrões Conhecidos', () => {
  assert.equal(isMockRawResponsePayload({ message: 'Consulta simulada (Mock Fallback)' }), true);
  assert.equal(
    isMockRawResponsePayload({ dados: { marca: 'Marca Fictícia', modelo: 'SUV Conceito Flex' } }),
    true,
  );
  assert.equal(isMockRawResponsePayload({ is_mock: true }), true);
  assert.equal(
    isMockRawResponsePayload({
      placa: 'ABC1234',
      marca: 'HONDA',
      modelo: 'CIVIC TOURING',
    }),
    false,
  );
});

test('T12 - Verificação de Regras de UI e Selo Oficial', () => {
  // Simula lógica da UI:
  const checkOfficialStatus = (
    status: string,
    paymentStatus: string,
    isMock: boolean,
    mode: string,
  ) => {
    return (
      status === 'completed' && paymentStatus === 'paid' && isMock === false && mode === 'live'
    );
  };

  // Mock em produção paga
  assert.equal(
    checkOfficialStatus('completed', 'paid', true, 'mock'),
    false,
    'Mock nunca pode exibir Laudo Oficial',
  );

  // Live em produção paga
  assert.equal(
    checkOfficialStatus('completed', 'paid', false, 'live'),
    true,
    'Live deve exibir Laudo Oficial',
  );

  // Não pago
  assert.equal(
    checkOfficialStatus('completed', 'unpaid', false, 'live'),
    false,
    'Não pago não pode exibir Laudo Oficial',
  );
});

test('T13 - Higienização de Logs e Ausência de Vazamento de Tokens', () => {
  const sensitiveError = 'Error with token Bearer secret-apibrasil-token-998822 in request';
  const classified = classifyProviderFailure(sensitiveError);

  assert.ok(!classified.errorMessageSafe.includes('secret-apibrasil-token-998822'));
  assert.ok(!classified.errorMessageSafe.includes('Bearer'));
});

test('T14 - Reprocessamento Rejeita Pagamento Não Aprovado', async () => {
  const { reprocessMockedPaidConsultation } = await import('../reprocess-service.ts');

  const mockDb: unknown = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (table === 'payment_transactions') {
              return {
                data: { id: 'tx-1', status: 'pending', consultation_id: 'cpc-1' },
                error: null,
              };
            }
            return { data: { id: 'cpc-1' }, error: null };
          },
        }),
      }),
    }),
  };

  const res = await reprocessMockedPaidConsultation({
    transactionId: 'tx-1',
    customDb: mockDb,
  });

  assert.equal(res.success, false);
  assert.equal(res.status, 'unapproved_payment');
  assert.equal(res.actionTaken, 'NO_OP');
});

test('T15 - Reprocessamento Rejeita Transação sem mp_payment_id', async () => {
  const { reprocessMockedPaidConsultation } = await import('../reprocess-service.ts');

  const mockDb: unknown = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (table === 'payment_transactions') {
              return {
                data: {
                  id: 'tx-2',
                  status: 'approved',
                  mp_payment_id: null,
                  consultation_id: 'cpc-2',
                },
                error: null,
              };
            }
            return { data: { id: 'cpc-2' }, error: null };
          },
        }),
      }),
    }),
  };

  const res = await reprocessMockedPaidConsultation({
    transactionId: 'tx-2',
    customDb: mockDb,
  });

  assert.equal(res.success, false);
  assert.equal(res.status, 'missing_mp_payment_id');
});

test('T16 - Reprocessamento Não Altera Consulta que Já Possui Laudo Live', async () => {
  const { reprocessMockedPaidConsultation } = await import('../reprocess-service.ts');

  const mockDb: unknown = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (table === 'payment_transactions') {
              return {
                data: {
                  id: 'tx-3',
                  status: 'approved',
                  mp_payment_id: '12345',
                  consultation_id: 'cpc-3',
                },
                error: null,
              };
            }
            if (table === 'customer_plate_consultations') {
              return {
                data: { id: 'cpc-3', source_consultation_id: 'vpc-live', status: 'completed' },
                error: null,
              };
            }
            if (table === 'vehicle_plate_consultations') {
              return {
                data: { id: 'vpc-live', is_mock: false, mode: 'live', status: 'COMPLETED' },
                error: null,
              };
            }
            return { data: null, error: null };
          },
        }),
      }),
    }),
  };

  const res = await reprocessMockedPaidConsultation({
    transactionId: 'tx-3',
    customDb: mockDb,
  });

  assert.equal(res.success, true);
  assert.equal(res.actionTaken, 'ALREADY_LIVE');
});
