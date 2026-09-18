import { test, expect } from '@playwright/test';

test.describe('Segurança: Bloqueio de Fraude via Query String no Retorno de Pagamento', () => {
  test('forjar status=approved na query string sem sessão e sem pagamento real não deve conceder acesso', async ({ page }) => {
    await page.goto('/cliente/pagamento?status=approved&collection_id=999999999');
    // Deve redirecionar para login de cliente
    await expect(page).toHaveURL(/\/cliente\/login/);
  });
});
