import { test, expect } from '@playwright/test';

test.describe('Consultas: Acompanhamento de Status', () => {
  test('redireciona para login ao tentar acessar status de consulta sem sessão', async ({ page }) => {
    await page.goto('/cliente/consultas');
    await expect(page).toHaveURL(/\/cliente\/login/);
  });
});
