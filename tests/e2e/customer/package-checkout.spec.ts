import { test, expect } from '@playwright/test';
import { getE2EEnvironmentConfig } from '../fixtures/environment';

test.describe('Checkout de Pacotes: Simulação Segura', () => {
  test('deve respeitar flag E2E_RUN_PAYMENT_SIMULATION', async () => {
    const config = getE2EEnvironmentConfig();
    if (!config.runPaymentSimulation) {
      test.skip(true, 'Teste ignorado: E2E_RUN_PAYMENT_SIMULATION=false');
    }
  });
});
