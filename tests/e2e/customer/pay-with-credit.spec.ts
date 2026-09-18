import { test, expect } from '@playwright/test';
import { getE2EEnvironmentConfig } from '../fixtures/environment';

test.describe('Créditos: Consumo de 1 Crédito para Consulta', () => {
  test('deve respeitar flag de segurança E2E_RUN_CREDIT_TESTS', async () => {
    const config = getE2EEnvironmentConfig();
    if (!config.runCreditTests) {
      test.skip(true, 'Teste ignorado: E2E_RUN_CREDIT_TESTS=false');
    }
  });
});
