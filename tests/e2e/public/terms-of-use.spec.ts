import { test, expect } from '@playwright/test';
import { PublicPagesPage } from '../page-objects/public-pages.page';
import { assertNoSensitiveDataExposed } from '../fixtures/assertions';

test.describe('Páginas Públicas: Termos de Uso e Redirects Canônicos', () => {
  test('deve carregar termos de uso e redirecionar /termos para a rota canônica', async ({ page }) => {
    const publicPage = new PublicPagesPage(page);
    await publicPage.gotoTerms();

    await expect(page).toHaveTitle(/Termos/i);
    await assertNoSensitiveDataExposed(page);

    // Testa redirect canônico
    await page.goto('/termos');
    await expect(page).toHaveURL(/\/termos-de-uso/);
  });
});
