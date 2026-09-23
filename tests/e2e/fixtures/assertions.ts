import { expect, Page } from '@playwright/test';

/**
 * Asserções customizadas para laudos veiculares, badges de status e segurança
 */

export async function assertNoSensitiveDataExposed(page: Page): Promise<void> {
  const content = await page.content();

  // Verifica que segredos críticos não estão expostos no DOM renderizado
  expect(content).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'); // Chave JWT padrão de service role
  expect(content).not.toContain('APP_USR-'); // Access token de produção Mercado Pago
  expect(content).not.toContain('TEST-'); // Access token de teste Mercado Pago
}

export async function assertToastMessage(page: Page, expectedPattern: RegExp | string): Promise<void> {
  const toast = page.locator('[data-sonner-toast]');
  await expect(toast).toBeVisible({ timeout: 5000 });
  await expect(toast).toContainText(expectedPattern);
}

export async function assertReportIntegrity(page: Page): Promise<void> {
  // Valida que elementos essenciais do laudo existem
  const reportContainer = page.locator('[data-testid="vehicle-report"], .vehicle-report, main');
  await expect(reportContainer).toBeVisible();

  // Garante que não há tokens expostos
  await assertNoSensitiveDataExposed(page);
}
