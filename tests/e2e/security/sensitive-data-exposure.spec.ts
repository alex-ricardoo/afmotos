import { test, expect } from '@playwright/test';
import { assertNoSensitiveDataExposed } from '../fixtures/assertions';

test.describe('Segurança: Auditoria de Ausência de Segredos no DOM', () => {
  const routesToAudit = [
    '/',
    '/motos',
    '/historico-veicular',
    '/cliente/login',
    '/admin/login',
    '/termos-de-uso',
    '/politica-de-privacidade',
  ];

  for (const route of routesToAudit) {
    test(`rota ${route} não deve vazar credenciais ou tokens de serviço no HTML`, async ({ page }) => {
      await page.goto(route);
      await assertNoSensitiveDataExposed(page);
    });
  }
});
