import { test, expect } from '@playwright/test';

test.describe('Autenticação: Aceite Legal Mandatório', () => {
  test('tela de login e cadastro devem referenciar e vincular Termos e Política de Privacidade', async ({ page }) => {
    await page.goto('/cliente/login');

    const privacyLink = page.getByRole('link', { name: /política de privacidade/i });
    const termsLink = page.getByRole('link', { name: /termos de uso/i });

    await expect(privacyLink).toBeVisible();
    await expect(termsLink).toBeVisible();

    await expect(privacyLink).toHaveAttribute('href', '/politica-de-privacidade');
    await expect(termsLink).toHaveAttribute('href', '/termos-de-uso');
  });
});
