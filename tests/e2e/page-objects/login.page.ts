import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly googleButton: Locator;
  readonly signupLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.getByRole('button', { name: /entrar no meu painel|acessar painel/i });
    this.googleButton = page.getByRole('button', { name: /google/i });
    this.signupLink = page.getByRole('link', { name: /cadastre-se/i });
    this.errorMessage = page.locator('text=E-mail ou senha incorretos, text=Credenciais inválidas, [role="alert"]').first();
  }

  async gotoCustomerLogin(): Promise<void> {
    await this.page.goto('/cliente/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoAdminLogin(): Promise<void> {
    await this.page.goto('/admin/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectLoginError(): Promise<void> {
    await expect(this.page.locator('text=incorreto, text=incorretos, text=inválid, text=erro, [role="alert"]').first()).toBeVisible({ timeout: 5000 });
  }
}
