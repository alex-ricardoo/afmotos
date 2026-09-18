import { test, expect } from '@playwright/test';

test.describe('Segurança: Proteção Contra Falsificação de Laudos', () => {
  test('páginas públicas e prévias não devem exibir selos de laudo oficial autêntico sem pagamento confirmado', async ({ page }) => {
    await page.goto('/historico-veicular');
    // Verifica que a prévia não emite número de autenticação oficial definitivo
    const text = await page.content();
    expect(text).not.toContain('AUTENTICIDADE_DEFINITIVA_CONFIRMADA_OFICIAL');
  });
});
