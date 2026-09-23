import { Page, Locator, expect } from '@playwright/test';

export class CustomerDashboardPage {
  readonly page: Page;
  readonly creditBalance: Locator;
  readonly consultationsList: Locator;
  readonly newConsultationButton: Locator;
  readonly packagesLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.creditBalance = page.locator('[data-testid="credit-balance"], text=/crédito/i').first();
    this.consultationsList = page.locator('[data-testid="consultations-table"], table, [role="table"]').first();
    this.newConsultationButton = page.getByRole('link', { name: /nova consulta|consultar placa/i });
    this.packagesLink = page.getByRole('link', { name: /comprar créditos|pacotes/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/cliente');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifyDashboardLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/cliente/);
  }
}
