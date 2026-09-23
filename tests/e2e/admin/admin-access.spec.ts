import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('Admin: Controle de Acesso', () => {
  test('deve bloquear acesso com credenciais inválidas em /admin/login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoAdminLogin();

    await page.fill('input[type="email"]', TEST_USERS.invalid.email);
    await page.fill('input[type="password"]', TEST_USERS.invalid.password);
    await page.getByRole('button', { name: /acessar/i }).click();

    // Deve permanecer na tela de login administrativo
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
