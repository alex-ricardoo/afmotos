import { test, expect } from '@playwright/test';
import { getE2EEnvironmentConfig } from '../fixtures/environment';

test.describe('Admin: Cadastro de Moto', () => {
  test('deve respeitar flag E2E_RUN_ADMIN_MUTATION_TESTS para criação de motos', async () => {
    const config = getE2EEnvironmentConfig();
    if (!config.runAdminMutationTests) {
      test.skip(true, 'Teste ignorado: E2E_RUN_ADMIN_MUTATION_TESTS=false');
    }
  });
});
