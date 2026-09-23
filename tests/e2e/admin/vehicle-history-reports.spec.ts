import { test, expect } from '@playwright/test';

test.describe('Admin: Relatórios Gerenciais e Contábeis', () => {
  test('deve bloquear relatórios financeiros para anônimos', async ({ page }) => {
    await page.goto('/admin/relatorios');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
