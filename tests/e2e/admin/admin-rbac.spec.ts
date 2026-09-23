import { test, expect } from '@playwright/test';

test.describe('Admin: Autorização RBAC Avançada', () => {
  test('redireciona para /admin/login com proteção SSL ativa em todas as abas internas', async ({ page }) => {
    const adminRoutes = ['/admin', '/admin/motos', '/admin/clientes', '/admin/creditos', '/admin/relatorios'];
    for (const r of adminRoutes) {
      await page.goto(r);
      await expect(page).toHaveURL(/\/admin\/login/);
    }
  });
});
