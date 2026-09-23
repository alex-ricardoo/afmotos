import { Page, Locator, expect } from '@playwright/test';

export class PublicPagesPage {
  readonly page: Page;
  readonly navHome: Locator;
  readonly navCatalog: Locator;
  readonly navVehicleHistory: Locator;
  readonly footerTerms: Locator;
  readonly footerPrivacy: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navHome = page.locator('nav').getByRole('link', { name: /início|home/i });
    this.navCatalog = page.locator('nav').getByRole('link', { name: /estoque|motos/i });
    this.navVehicleHistory = page.locator('nav').getByRole('link', { name: /histórico|consulta/i });
    this.footerTerms = page.getByRole('link', { name: /termos de uso/i });
    this.footerPrivacy = page.getByRole('link', { name: /política de privacidade/i });
  }

  async gotoHome(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoCatalog(): Promise<void> {
    await this.page.goto('/motos');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoVehicleHistory(): Promise<void> {
    await this.page.goto('/historico-veicular');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoTerms(): Promise<void> {
    await this.page.goto('/termos-de-uso');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoPrivacyPolicy(): Promise<void> {
    await this.page.goto('/politica-de-privacidade');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifyHeading(expectedText: RegExp | string): Promise<void> {
    const heading = this.page.locator('h1').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(expectedText);
  }
}
