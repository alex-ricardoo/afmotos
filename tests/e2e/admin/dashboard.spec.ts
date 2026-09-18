import { test, expect } from '@playwright/test';

test.describe('Admin: Dashboard Gerencial', () => {
  test('deve proteger rota do dashboard contra acessos anônimos', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
