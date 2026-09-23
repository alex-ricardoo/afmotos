import { test, expect } from '@playwright/test';

test.describe('Admin: Gestão de Ofertas de Pacotes', () => {
  test('deve proteger área de pacotes do admin', async ({ page }) => {
    await page.goto('/admin/historico-veicular');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
