import { test, expect } from '@playwright/test';

test.describe('RBAC: Cliente Bloqueado em Rotas Administrativas', () => {
  test('qualquer acesso a rotas administrativas deve redirecionar para tela de login administrativa', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.goto('/admin/relatorios');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
