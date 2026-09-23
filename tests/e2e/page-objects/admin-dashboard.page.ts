import { Page, Locator } from '@playwright/test';

export class AdminDashboardPage {
  readonly page: Page;
  readonly motorcyclesMenu: Locator;
  readonly customersMenu: Locator;
  readonly creditsMenu: Locator;
  readonly paymentsMenu: Locator;
  readonly reportsMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.motorcyclesMenu = page.getByRole('link', { name: /motos|estoque/i });
    this.customersMenu = page.getByRole('link', { name: /clientes/i });
    this.creditsMenu = page.getByRole('link', { name: /créditos/i });
    this.paymentsMenu = page.getByRole('link', { name: /pagamentos/i });
    this.reportsMenu = page.getByRole('link', { name: /relatórios/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('domcontentloaded');
  }
}
