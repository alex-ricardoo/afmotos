import { test, expect } from '@playwright/test';

test.describe('Smoke: Área do Cliente e Roteamento', () => {
  test('rotas do cliente devem responder com status HTTP válido (redirecionamento ou renderização)', async ({ page }) => {
    const response = await page.goto('/cliente/login');
    expect(response?.status()).toBeLessThan(400);
  });
});
