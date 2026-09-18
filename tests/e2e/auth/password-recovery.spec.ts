import { test, expect } from '@playwright/test';

test.describe('Autenticação: Recuperação de Senha', () => {
  test('deve validar sintaxe de e-mail na tela de login/recuperação', async ({ page }) => {
    await page.goto('/cliente/login');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('email_invalido_sem_arroba');

    // Validação nativa HTML5 de email
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValid).toBe(false);
  });
});
