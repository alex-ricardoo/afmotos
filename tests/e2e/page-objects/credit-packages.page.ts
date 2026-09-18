import { Page, Locator } from '@playwright/test';

export class CreditPackagesPage {
  readonly page: Page;
  readonly packageCards: Locator;
  readonly checkoutButtons: Locator;
  readonly whatsappButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.packageCards = page.locator('[data-testid="package-card"], .package-card');
    this.checkoutButtons = page.getByRole('button', { name: /comprar|escolher|adquirir/i });
    this.whatsappButton = page.getByRole('link', { name: /whatsapp|falar com especialista/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/cliente/pacotes');
    await this.page.waitForLoadState('domcontentloaded');
  }
}
