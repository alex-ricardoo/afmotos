import { test, expect } from '@playwright/test';

test.describe('Smoke: Páginas Públicas Essenciais', () => {
  test('deve carregar Home e Catálogo sem falhas 500', async ({ page }) => {
    const homeResponse = await page.goto('/');
    expect(homeResponse?.status()).toBeLessThan(400);

    const catalogResponse = await page.goto('/motos');
    expect(catalogResponse?.status()).toBeLessThan(400);

    const historyResponse = await page.goto('/historico-veicular');
    expect(historyResponse?.status()).toBeLessThan(400);
  });
});
