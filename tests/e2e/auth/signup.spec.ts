import { test, expect } from '@playwright/test';
import { SignupPage } from '../page-objects/signup.page';
import { getE2EEnvironmentConfig } from '../fixtures/environment';

test.describe('Autenticação: Cadastro de Usuário', () => {
  test('deve renderizar campos obrigatórios e links para termos e privacidade no cadastro', async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    await expect(signupPage.emailInput).toBeVisible();
    await expect(signupPage.passwordInput).toBeVisible();

    const termsLink = page.getByRole('link', { name: /termos de uso/i });
    const privacyLink = page.getByRole('link', { name: /política de privacidade/i });

    await expect(termsLink).toBeVisible();
    await expect(privacyLink).toBeVisible();
  });
});
