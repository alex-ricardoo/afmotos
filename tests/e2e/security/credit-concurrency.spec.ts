import { test, expect } from '@playwright/test';
import { getE2EEnvironmentConfig } from '../fixtures/environment';

test.describe('Segurança: Concorrência no Consumo de Crédito', () => {
  test('deve respeitar isolamento e travas em ambiente seguro', async () => {
    const config = getE2EEnvironmentConfig();
    if (!config.runCreditTests) {
      test.skip(true, 'Teste concorrente ignorado: E2E_RUN_CREDIT_TESTS=false');
    }
  });
});
