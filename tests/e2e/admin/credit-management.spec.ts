import { test, expect } from '@playwright/test';

test.describe('Admin: Gestão de Créditos', () => {
  test('deve bloquear tela de concessão de créditos para não-administradores', async ({ page }) => {
    await page.goto('/admin/creditos');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
