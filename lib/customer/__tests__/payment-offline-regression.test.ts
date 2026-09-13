import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

describe('Mercado Pago Rollback & Payment Offline Regression Tests', () => {
  it('garante que nenhum endpoint Mercado Pago existe ou está ativo', () => {
    const forbiddenEndpoints = [
      'app/api/webhooks/mercadopago/route.ts',
      'app/api/internal/mercadopago/diagnostic-variations/route.ts',
      'app/api/internal/mercadopago/health/route.ts',
      'app/api/mp/process-payment/route.ts',
      'app/admin/transacoes-consultas/page.tsx',
    ];

    for (const endpoint of forbiddenEndpoints) {
      const fullPath = path.join(projectRoot, endpoint);
      assert.equal(
        fs.existsSync(fullPath),
        false,
        `Endpoint proibido não deve existir no repositório: ${endpoint}`,
      );
    }
  });

  it('garante que o módulo lib/mercadopago foi completamente removido', () => {
    const mpDir = path.join(projectRoot, 'lib/mercadopago');
    assert.equal(fs.existsSync(mpDir), false, 'Diretório lib/mercadopago deve ter sido removido');
  });

  it('garante que o componente Payment Brick e correlatos foram removidos', () => {
    const removedComponents = [
      'components/customer/payment-brick.tsx',
      'components/customer/payment-security-notice.tsx',
      'components/customer/payment-status-banner.tsx',
      'components/customer/pix-payment-display.tsx',
      'components/customer/boleto-payment-display.tsx',
      'components/customer/auto-refund-notice.tsx',
      'components/customer/customer-payment-flow.tsx',
    ];

    for (const comp of removedComponents) {
      const fullPath = path.join(projectRoot, comp);
      assert.equal(
        fs.existsSync(fullPath),
        false,
        `Componente Mercado Pago não deve existir: ${comp}`,
      );
    }
  });

  it('garante que a página de pagamento exibe indisponibilidade segura sem cobrança ou liberação indevida', () => {
    const paymentPagePath = path.join(
      projectRoot,
      'app/cliente/pagamento/[consultationId]/page.tsx',
    );
    assert.equal(fs.existsSync(paymentPagePath), true, 'Página de pagamento deve existir');

    const content = fs.readFileSync(paymentPagePath, 'utf-8');

    // Mensagem transparente de indisponibilidade
    assert.ok(
      content.includes('Pagamentos online estão temporariamente indisponíveis'),
      'Página deve conter o aviso explícito de pagamentos online indisponíveis',
    );

    // Validação estrita de autorização
    assert.ok(
      content.includes('consultation.user_id === user.id'),
      'Página deve validar que o usuário autenticado é proprietário da consulta',
    );

    // Redirecionamento se já concluída
    assert.ok(
      content.includes("consultation.status === 'completed'"),
      'Página deve redirecionar consultas já concluídas para o laudo',
    );

    // Ausência de botões de cobrança ou simulação
    assert.equal(
      content.includes('confirmPayment'),
      false,
      'Página não deve invocar confirmPayment nem simulação automática',
    );
    assert.equal(content.includes('PaymentBrick'), false, 'Página não deve conter PaymentBrick');
    assert.equal(
      content.includes('createCardPayment'),
      false,
      'Página não deve invocar chamadas de cobrança',
    );
  });

  it('garante que não existem imports de pacotes Mercado Pago em código de produção', () => {
    const dirsToScan = ['app', 'components', 'lib'];
    const forbiddenPatterns = [
      /from\s+['"]mercadopago['"]/,
      /from\s+['"]mercadopago-v2['"]/,
      /from\s+['"]@mercadopago\/sdk-react['"]/,
      /from\s+['"].*mercadopago.*['"]/,
    ];

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.next') {
            scanDir(fullPath);
          }
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          // Ignore the regression test file itself
          if (fullPath.includes('payment-offline-regression.test.ts')) continue;

          const content = fs.readFileSync(fullPath, 'utf-8');
          for (const pattern of forbiddenPatterns) {
            assert.equal(
              pattern.test(content),
              false,
              `Arquivo ${fullPath} contém importação proibida: ${pattern}`,
            );
          }
        }
      }
    }

    for (const d of dirsToScan) {
      const fullDir = path.join(projectRoot, d);
      if (fs.existsSync(fullDir)) {
        scanDir(fullDir);
      }
    }
  });

  it('garante que a dependência mercadopago não consta no package.json', () => {
    const pkgPath = path.join(projectRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    assert.equal(
      'mercadopago' in (pkg.dependencies || {}),
      false,
      'mercadopago não deve constar em dependencies',
    );
    assert.equal(
      '@mercadopago/sdk-react' in (pkg.dependencies || {}),
      false,
      '@mercadopago/sdk-react não deve constar em dependencies',
    );
    assert.equal(
      'mercadopago-v2' in (pkg.dependencies || {}),
      false,
      'mercadopago-v2 não deve constar em dependencies',
    );
  });
});
