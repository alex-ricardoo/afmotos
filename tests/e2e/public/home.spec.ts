import { test, expect } from '@playwright/test';
import { PublicPagesPage } from '../page-objects/public-pages.page';
import { assertNoSensitiveDataExposed } from '../fixtures/assertions';

test.describe('Páginas Públicas: Home e Vitrine', () => {
  test('deve carregar a Home com título, meta tags e sem segredos expostos', async ({ page }) => {
    const publicPage = new PublicPagesPage(page);
    await publicPage.gotoHome();

    await expect(page).toHaveTitle(/AF Motos/i);
    await assertNoSensitiveDataExposed(page);

    // Verifica presença de pelo menos um heading h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });
});
