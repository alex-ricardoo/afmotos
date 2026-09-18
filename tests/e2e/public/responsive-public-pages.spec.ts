import { test, expect } from '@playwright/test';

test.describe('Responsividade de Páginas Públicas', () => {
  test('deve renderizar Home adequadamente em viewport mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const mainHeader = page.locator('header, nav').first();
    await expect(mainHeader).toBeVisible();

    // Valida que a página não possui scroll horizontal quebrado no body
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // tolerância de subpixel
  });
});
