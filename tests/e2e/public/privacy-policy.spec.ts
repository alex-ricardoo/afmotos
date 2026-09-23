import { test, expect } from '@playwright/test';
import { PublicPagesPage } from '../page-objects/public-pages.page';
import { assertNoSensitiveDataExposed } from '../fixtures/assertions';

test.describe('Páginas Públicas: Política de Privacidade', () => {
  test('deve carregar política de privacidade com conteúdo e conformidade LGPD', async ({ page }) => {
    const publicPage = new PublicPagesPage(page);
    await publicPage.gotoPrivacyPolicy();

    await expect(page).toHaveTitle(/Privacidade/i);
    await assertNoSensitiveDataExposed(page);

    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();
    await expect(mainContent).toContainText(/dados|privacidade/i);
  });
});
