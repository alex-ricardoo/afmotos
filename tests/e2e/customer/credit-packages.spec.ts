import { test, expect } from '@playwright/test';

test.describe('Pacotes de Crédito: Vitrine', () => {
  test('deve exigir autenticação para vitrine de pacotes no portal do cliente', async ({ page }) => {
    await page.goto('/cliente/pacotes');
    await expect(page).toHaveURL(/\/cliente\/login/);
  });
});
