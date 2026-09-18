import { test, expect } from '@playwright/test';

test.describe('Segurança: Fronteiras de Autorização e IDOR', () => {
  test('usuário anônimo ou comum não deve conseguir acessar relatórios confidenciais via URL direta', async ({ page }) => {
    await page.goto('/admin/historico-veicular');
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.goto('/admin/relatorios');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
