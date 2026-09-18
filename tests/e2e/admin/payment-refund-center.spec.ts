import { test, expect } from '@playwright/test';

test.describe('Admin: Central de Pagamentos e Estornos', () => {
  test('deve bloquear acesso à central de pagamentos e estornos para anônimos', async ({ page }) => {
    await page.goto('/admin/pagamentos-consultas');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
