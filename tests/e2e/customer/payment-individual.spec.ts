import { test, expect } from '@playwright/test';

test.describe('Pagamentos: Tela de Pagamento Individual', () => {
  test('deve bloquear acesso direto desautenticado a pagamento individual', async ({ page }) => {
    await page.goto('/cliente/pagamento');
    await expect(page).toHaveURL(/\/cliente\/login/);
  });
});
