import { Page, Locator, expect } from '@playwright/test';

export class VehicleHistoryPage {
  readonly page: Page;
  readonly plateInput: Locator;
  readonly searchButton: Locator;
  readonly useCreditButton: Locator;
  readonly reportContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.plateInput = page.locator('input[name="plate"], input[placeholder*="placa" i]').first();
    this.searchButton = page.getByRole('button', { name: /consultar|pesquisar|buscar/i });
    this.useCreditButton = page.getByRole('button', { name: /usar.*crédito/i });
    this.reportContainer = page.locator('[data-testid="vehicle-report"], .vehicle-report');
  }

  async goto(): Promise<void> {
    await this.page.goto('/historico-veicular');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoConsultas(): Promise<void> {
    await this.page.goto('/cliente/consultas');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async enterPlate(plate: string): Promise<void> {
    await this.plateInput.fill(plate);
  }

  async submitSearch(): Promise<void> {
    await this.searchButton.click();
  }
}
