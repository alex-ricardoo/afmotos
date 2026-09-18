import { test, expect } from '@playwright/test';
import { getE2EEnvironmentConfig } from '../fixtures/environment';

test.describe('Área do Cliente: Perfil', () => {
  test('deve exigir autenticação para acessar tela de perfil', async ({ page }) => {
    await page.goto('/cliente/perfil');
    await expect(page).toHaveURL(/\/cliente\/login/);
  });
});
