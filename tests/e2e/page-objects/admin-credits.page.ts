import { Page, Locator } from '@playwright/test';

export class AdminCreditsPage {
  readonly page: Page;
  readonly customerSelect: Locator;
  readonly amountInput: Locator;
  readonly reasonInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.customerSelect = page.locator('select[name="customerId"], input[placeholder*="cliente" i]');
    this.amountInput = page.locator('input[name="amount"], input[name="credits"]');
    this.reasonInput = page.locator('textarea[name="reason"], input[name="reason"]');
    this.submitButton = page.getByRole('button', { name: /conceder|adicionar créditos/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/creditos');
    await this.page.waitForLoadState('domcontentloaded');
  }
}
