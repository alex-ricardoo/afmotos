import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

describe('Mercado Pago Checkout Pro & Bricks Elimination Regression Tests', () => {
  it('garante que nenhum endpoint proibido de Bricks/diagnósticos antigos existe', () => {
    const forbiddenEndpoints = [
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
        `Endpoint proibido de Bricks não deve existir no repositório: ${endpoint}`,
      );
    }
  });

  it('garante que os novos endpoints oficiais de Checkout Pro existem', () => {
    const requiredEndpoints = [
      'app/api/mp/checkout-pro/preferences/route.ts',
      'app/api/mp/transactions/[transactionId]/status/route.ts',
      'app/api/webhooks/mercadopago/route.ts',
      'app/cliente/pagamento/retorno/[transactionId]/page.tsx',
    ];

    for (const endpoint of requiredEndpoints) {
      const fullPath = path.join(projectRoot, endpoint);
      assert.equal(
        fs.existsSync(fullPath),
        true,
        `Endpoint essencial de Checkout Pro deve existir: ${endpoint}`,
      );
    }
  });

  it('garante que o módulo oficial lib/mercadopago está estruturado', () => {
    const mpDir = path.join(projectRoot, 'lib/mercadopago');
    assert.equal(fs.existsSync(mpDir), true, 'Diretório lib/mercadopago deve existir para Checkout Pro');

    const requiredModules = [
      'client.ts',
      'preference-builder.ts',
      'webhook-service.ts',
      'payment-status-mapper.ts',
      'consultation-releaser.ts',
      'security.ts',
      'observability.ts',
      'types.ts',
    ];

    for (const mod of requiredModules) {
      const fullPath = path.join(mpDir, mod);
      assert.equal(fs.existsSync(fullPath), true, `Módulo essencial deve existir: ${mod}`);
    }
  });

  it('garante que os componentes de Checkout Bricks foram completamente removidos', () => {
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
        `Componente legado de Checkout Bricks não deve existir: ${comp}`,
      );
    }
  });

  it('garante que a página de pagamento possui validação estrita e aciona Checkout Pro', () => {
    const paymentPagePath = path.join(
      projectRoot,
      'app/cliente/pagamento/[consultationId]/page.tsx',
    );
    assert.equal(fs.existsSync(paymentPagePath), true, 'Página de pagamento deve existir');

    const content = fs.readFileSync(paymentPagePath, 'utf-8');

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

    // Ausência de componentes de cartão/Bricks locais
    assert.equal(content.includes('PaymentBrick'), false, 'Página não deve conter PaymentBrick');
    assert.equal(
      content.includes('createCardPayment'),
      false,
      'Página não deve invocar chamadas de cobrança direta de cartão',
    );

    // Presença do botão de Checkout Pro
    assert.ok(
      content.includes('CheckoutProButton'),
      'Página deve conter o botão oficial de Checkout Pro',
    );
  });

  it('garante que a SDK do frontend @mercadopago/sdk-react não consta no package.json e mercadopago está fixado', () => {
    const pkgPath = path.join(projectRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    assert.equal(
      pkg.dependencies?.mercadopago,
      '2.12.0',
      'mercadopago deve estar fixado na versão 2.12.0 no backend',
    );
    assert.equal(
      '@mercadopago/sdk-react' in (pkg.dependencies || {}),
      false,
      '@mercadopago/sdk-react não deve constar em dependencies (frontend seguro)',
    );
    assert.equal(
      'mercadopago-v2' in (pkg.dependencies || {}),
      false,
      'mercadopago-v2 não deve constar em dependencies',
    );
  });
});
