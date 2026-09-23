import { Page, Locator } from '@playwright/test';

export class AdminMotorcyclesPage {
  readonly page: Page;
  readonly newMotorcycleButton: Locator;
  readonly titleInput: Locator;
  readonly priceInput: Locator;
  readonly brandInput: Locator;
  readonly modelInput: Locator;
  readonly yearInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newMotorcycleButton = page.getByRole('link', { name: /nova moto|adicionar/i });
    this.titleInput = page.locator('input[name="title"]');
    this.priceInput = page.locator('input[name="price"]');
    this.brandInput = page.locator('input[name="brand"]');
    this.modelInput = page.locator('input[name="model"]');
    this.yearInput = page.locator('input[name="year"]');
    this.saveButton = page.getByRole('button', { name: /salvar|cadastrar/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/motos');
    await this.page.waitForLoadState('domcontentloaded');
  }
}
