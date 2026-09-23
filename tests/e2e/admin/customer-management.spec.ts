import { test, expect } from '@playwright/test';

test.describe('Admin: Gestão de Clientes', () => {
  test('deve bloquear acesso à listagem de clientes para usuários sem autenticação admin', async ({ page }) => {
    await page.goto('/admin/clientes');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
