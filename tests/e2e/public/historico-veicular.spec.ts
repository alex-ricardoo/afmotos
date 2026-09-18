import { test, expect } from '@playwright/test';
import { PublicPagesPage } from '../page-objects/public-pages.page';
import { assertNoSensitiveDataExposed } from '../fixtures/assertions';

test.describe('Páginas Públicas: Histórico Veicular', () => {
  test('deve renderizar a landing page de Histórico Veicular com SEO e sem segredos', async ({ page }) => {
    const publicPage = new PublicPagesPage(page);
    await publicPage.gotoVehicleHistory();

    await expect(page).toHaveTitle(/Histórico|Consulta/i);
    await assertNoSensitiveDataExposed(page);

    // Valida que a seção de conteúdo principal está visível
    const mainSection = page.locator('main').first();
    await expect(mainSection).toBeVisible();
  });
});
