import { test, expect } from '@playwright/test';

test.describe('Autorização: Proteção de Rotas para Anônimos', () => {
  const protectedRoutes = [
    '/cliente',
    '/cliente/perfil',
    '/cliente/consultas',
    '/cliente/creditos',
    '/cliente/pacotes',
    '/admin',
    '/admin/motos',
    '/admin/clientes',
  ];

  for (const route of protectedRoutes) {
    test(`deve bloquear acesso anônimo à rota ${route} e redirecionar para login`, async ({ page }) => {
      await page.goto(route);
      const url = page.url();
      expect(url).toMatch(/\/login/);
    });
  }
});
