# Environment Contract: E2E Testing Guardrails

Este contrato define a interface de configuração, as variáveis de ambiente mandatórias e as regras de bloqueio estrito para execução de testes E2E.

---

## Variáveis de Ambiente e Esquema

```typescript
export interface E2EEnvironmentConfig {
  /**
   * URL base alvo da execução dos testes.
   * Exemplo: "http://localhost:3000" ou "https://af-motos-preview.vercel.app"
   */
  E2E_BASE_URL: string;

  /**
   * E-mail e senha de conta isolada para testes com perfil de cliente.
   */
  E2E_TEST_CUSTOMER_EMAIL?: string;
  E2E_TEST_CUSTOMER_PASSWORD?: string;

  /**
   * E-mail e senha de conta isolada para testes com perfil administrativo.
   */
  E2E_TEST_ADMIN_EMAIL?: string;
  E2E_TEST_ADMIN_PASSWORD?: string;

  /**
   * Permissão mestra para executar ações que realizem criação, alteração ou exclusão de dados.
   * Valor padrão: false
   */
  E2E_ALLOW_DESTRUCTIVE: boolean;

  /**
   * Permissão para executar testes de movimentação e consumo de créditos de consulta.
   * Valor padrão: false
   */
  E2E_RUN_CREDIT_TESTS: boolean;

  /**
   * Permissão para simular fluxos de pagamento (Mercado Pago em Sandbox).
   * Valor padrão: false
   */
  E2E_RUN_PAYMENT_SIMULATION: boolean;

  /**
   * Permissão para cadastrar ou editar motocicletas e clientes no painel admin.
   * Valor padrão: false
   */
  E2E_RUN_ADMIN_MUTATION_TESTS: boolean;

  /**
   * Permissão para acionar rotinas de limpeza de dados E2E_ ao final da suíte.
   * Valor padrão: false
   */
  E2E_RUN_CLEANUP: boolean;
}
```

---

## Regras de Validação em Runtime

1. **Guardrail de Produção**:
   ```typescript
   if (url.hostname === 'afmotos.vercel.app' || url.hostname.endsWith('.afmotos.com.br')) {
     if (config.E2E_ALLOW_DESTRUCTIVE) {
       throw new Error(
         'CRITICAL SAFETY VIOLATION: E2E_ALLOW_DESTRUCTIVE is strictly prohibited when targeting production environments!'
       );
     }
   }
   ```
2. **Exigência de Modo Sandbox no Mercado Pago**:
   - Testes que envolvam checkout não podem prosseguir se `MERCADO_PAGO_CHECKOUT_MODE !== 'test'`.
3. **Exigência de Modo Mock na API Brasil**:
   - Testes automatizados de consulta veicular exigem `VEHICLE_LOOKUP_MODE === 'mock'`.
