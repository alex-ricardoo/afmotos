import { Page, Locator } from '@playwright/test';

export class PaymentPage {
  readonly page: Page;
  readonly statusContainer: Locator;
  readonly pixQrCode: Locator;
  readonly returnButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statusContainer = page.locator('[data-testid="payment-status"], .payment-status');
    this.pixQrCode = page.locator('[data-testid="pix-qrcode"], svg, img[alt*="pix" i]');
    this.returnButton = page.getByRole('link', { name: /voltar|ir para o painel/i });
  }

  async gotoReturnUrl(status: string, collectionId: string = '12345'): Promise<void> {
    await this.page.goto(`/cliente/pagamento?status=${status}&collection_id=${collectionId}`);
    await this.page.waitForLoadState('domcontentloaded');
  }
}
