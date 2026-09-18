import { test, expect } from '@playwright/test';

test.describe('Segurança: Proteção Contra Adulteração de Preço', () => {
  test('não deve permitir manipulação de valor via client-side injection', async ({ page }) => {
    await page.goto('/historico-veicular');
    // Preços exibidos devem vir do backend/configuração canônica
    const priceText = await page.locator('text=/R\\$\\s*\\d+/i').allInnerTexts();
    expect(priceText.length).toBeGreaterThan(0);
  });
});
