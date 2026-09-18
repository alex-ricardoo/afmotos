import { Page, Locator } from '@playwright/test';

export class AdminPaymentsPage {
  readonly page: Page;
  readonly transactionsTable: Locator;
  readonly refundButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.transactionsTable = page.locator('table, [role="table"]');
    this.refundButton = page.getByRole('button', { name: /estornar|refund/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/pagamentos-consultas');
    await this.page.waitForLoadState('domcontentloaded');
  }
}
