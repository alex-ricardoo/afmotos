import { Page, Locator, expect } from '@playwright/test';

export class SignupPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly termsCheckbox: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"], input[placeholder*="nome" i]');
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.termsCheckbox = page.locator('input[type="checkbox"], [role="checkbox"]');
    this.submitButton = page.getByRole('button', { name: /cadastr|criar conta/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/cliente/cadastro');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillForm(name: string, email: string, password: string, acceptTerms: boolean = true): Promise<void> {
    if (await this.nameInput.count() > 0) {
      await this.nameInput.fill(name);
    }
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (acceptTerms && (await this.termsCheckbox.count() > 0)) {
      await this.termsCheckbox.check();
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
