import { test, expect } from '@playwright/test';

test.describe('Créditos: Visualização e Extrato', () => {
  test('deve exigir autenticação para visualizar extrato de créditos', async ({ page }) => {
    await page.goto('/cliente/creditos');
    await expect(page).toHaveURL(/\/cliente\/login/);
  });
});
