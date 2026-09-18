import { test, expect } from '@playwright/test';

test.describe('Laudo Veicular: Acesso e Ownership', () => {
  test('tentativa de acesso direto a laudo fictício por anônimo deve ser bloqueada', async ({ page }) => {
    await page.goto('/cliente/consultas/00000000-0000-0000-0000-000000000000');
    // Deve redirecionar para login ou 404
    const url = page.url();
    expect(url).toMatch(/\/login|\/404/);
  });
});
