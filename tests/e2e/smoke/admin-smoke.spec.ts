import { test, expect } from '@playwright/test';

test.describe('Smoke: Painel Administrativo', () => {
  test('deve renderizar tela de login restrito com status HTTP válido', async ({ page }) => {
    const res = await page.goto('/admin/login');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { name: /AF Motos/i })).toBeVisible();
  });
});
