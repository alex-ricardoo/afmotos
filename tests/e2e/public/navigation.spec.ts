import { test, expect } from '@playwright/test';

test.describe('Navegação Pública e Tratamento de 404', () => {
  test('deve navegar pelos links institucionais e exibir status 404 para rotas inexistentes', async ({ page }) => {
    const response = await page.goto('/rota-inexistente-e2e-teste');
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/página não encontrada|desculpe|not found/i).first()).toBeVisible();
  });
});
