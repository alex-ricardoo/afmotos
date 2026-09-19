import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('No Boleto UI Regression Test', () => {
  const projectRoot = process.cwd();

  const userFacingFiles = [
    'app/cliente/pagamento/[consultationId]/page.tsx',
    'components/vehicle-history/vehicle-history-pricing.tsx',
    'components/vehicle-history/vehicle-history-how-it-works.tsx',
    'components/vehicle-history/vehicle-history-faq-data.ts',
    'components/customer/customer-credits-view.tsx',
    'components/admin/credit-package-offers-manager.tsx',
    'app/(public)/politica-de-privacidade/page.tsx',
    'app/(public)/termos-de-uso/page.tsx',
    'components/customer/payment-simulation.tsx',
  ];

  for (const relativePath of userFacingFiles) {
    it(`garante que ${relativePath} não contém nenhuma menção ativa a boleto`, () => {
      const fullPath = path.join(projectRoot, relativePath);
      assert.ok(fs.existsSync(fullPath), `Arquivo deve existir: ${relativePath}`);

      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Busca ocorrências de 'boleto' ou 'boletos'
      const matches = content.match(/boleto[s]?/gi);
      
      assert.equal(
        matches,
        null,
        `Arquivo ${relativePath} contém menções a boleto que deveriam ser removidas: ${matches?.join(', ')}`,
      );
    });
  }
});
