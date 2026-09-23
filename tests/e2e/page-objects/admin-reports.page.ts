import { Page, Locator } from '@playwright/test';

export class AdminReportsPage {
  readonly page: Page;
  readonly reportsContainer: Locator;
  readonly dateFilter: Locator;
  readonly exportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.reportsContainer = page.locator('[data-testid="reports-container"], main');
    this.dateFilter = page.locator('input[type="date"], [data-testid="date-range-picker"]');
    this.exportButton = page.getByRole('button', { name: /exportar|download/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/relatorios');
    await this.page.waitForLoadState('domcontentloaded');
  }
}
