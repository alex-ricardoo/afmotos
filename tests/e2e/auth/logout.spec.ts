import { test, expect } from '@playwright/test';

test.describe('Autenticação: Encerramento de Sessão (Logout)', () => {
  test('usuário não autenticado ao tentar acessar logout deve ser mantido ou redirecionado com segurança', async ({ page }) => {
    await page.goto('/cliente');
    await expect(page).toHaveURL(/\/cliente\/login/);
  });
});
