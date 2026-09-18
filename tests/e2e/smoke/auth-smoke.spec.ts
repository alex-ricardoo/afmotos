import { test, expect } from '@playwright/test';

test.describe('Smoke: Autenticação e Guards', () => {
  test('deve renderizar /cliente/login e /admin/login sem falhas 500', async ({ page }) => {
    const customerLoginRes = await page.goto('/cliente/login');
    expect(customerLoginRes?.status()).toBeLessThan(400);

    const adminLoginRes = await page.goto('/admin/login');
    expect(adminLoginRes?.status()).toBeLessThan(400);
  });
});
