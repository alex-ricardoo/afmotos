import { test, expect } from '@playwright/test';

test.describe('Admin: Configurações de Preço e Custos', () => {
  test('deve exigir login administrativo para acessar configurações de preço de consulta', async ({ page }) => {
    await page.goto('/admin/historico-veicular');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
