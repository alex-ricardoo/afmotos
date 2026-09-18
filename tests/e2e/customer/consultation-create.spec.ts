import { test, expect } from '@playwright/test';
import { E2E_TEST_PLATES } from '../fixtures/test-data';

test.describe('Consultas: Validação Sintática de Placa', () => {
  test('deve validar sintaxe e rejeitar caracteres inválidos no formulário público de consulta', async ({ page }) => {
    await page.goto('/historico-veicular');

    const plateInput = page.locator('input[placeholder*="placa" i], input[name="plate"]').first();
    if (await plateInput.count() > 0) {
      await plateInput.fill(E2E_TEST_PLATES.invalidFormat);
      const submitBtn = page.getByRole('button', { name: /consultar|pesquisar|buscar/i }).first();
      await submitBtn.click();
      // O input ou mensagem de erro deve acusar formato inválido
      await expect(page.locator('text=inválid, text=formato, [role="alert"]').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
