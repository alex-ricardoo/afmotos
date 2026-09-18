import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('Autenticação: Formulário de Login', () => {
  test('deve exibir mensagem de erro clara ao tentar login com senha incorreta', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoCustomerLogin();

    await loginPage.emailInput.fill(TEST_USERS.customer.email);
    await loginPage.passwordInput.fill(TEST_USERS.invalid.password);
    await loginPage.submitButton.click();

    // Aguarda e valida mensagem de erro de credenciais
    await expect(page.getByText(/e-mail ou senha incorretos|credenciais inválidas/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('botão de login deve permanecer desabilitado com campos vazios', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoCustomerLogin();

    // Botão de submissão do formulário
    await expect(loginPage.submitButton).toBeDisabled();
  });
});
