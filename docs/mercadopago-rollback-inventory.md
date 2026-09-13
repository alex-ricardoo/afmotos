# Inventário de Rollback da Integração Mercado Pago

**Data**: 2026-09-12  
**Repositório**: alex-ricardoo/afmotos  
**Branch de Rollback**: `rollback/remove-mercadopago-bricks`  
**Commit Base de Referência (Pré-Mercado Pago)**: `b22df458b58fb503e18666967c790c71b6794c53`  
**Primeiro Commit Mercado Pago**: `2222791d970be61e10def0d1acd646e2ec620c09`  
**HEAD Analisado**: `fed0f026d9233210b3e6b4491603802dc2ef65c8`

---

## 1. Resumo Executivo do Inventário

A integração Mercado Pago adicionou Checkout Bricks (Payment Brick v2/v3), webhooks de notificação, diagnósticos locais, painel administrativo financeiro, serviços de processamento de cartão/PIX/boleto, e tabelas de auditoria no Supabase.

Neste rollback seguro:
- **Nenhum `git reset --hard`** é executado no `master`.
- O código Mercado Pago é removido ou revertido seletivamente na branch `rollback/remove-mercadopago-bricks`.
- As tabelas e migrações do Supabase são preservadas intactas para não causar perda de dados ou de auditoria.
- A página de pagamento é convertida para um aviso transparente e seguro de indisponibilidade temporária de pagamentos online, sem botões de cobrança e sem liberação indevida de consultas.

---

## 2. Classificação de Arquivos

### Categoria A — Exclusivamente Mercado Pago (Remover)
Arquivos e diretórios criados exclusivamente para Mercado Pago, sem utilidade após o rollback:

| Caminho | Tipo | Ação | Justificativa |
|---|---|---|---|
| `app/admin/transacoes-consultas/page.tsx` | Página Admin | Remover | Painel de visualização de transações Mercado Pago |
| `app/api/internal/mercadopago/diagnostic-variations/route.ts` | Route Handler | Remover | Diagnóstico local de variações de pagamento MP |
| `app/api/internal/mercadopago/health/route.ts` | Route Handler | Remover | Healthcheck de credenciais e webhook MP |
| `app/api/webhooks/mercadopago/route.ts` | Route Handler | Remover | Receptor de webhooks do Mercado Pago |
| `components/admin/transactions/transaction-detail-dialog.tsx` | Componente | Remover | Modal de detalhes da transação MP |
| `components/admin/transactions/transaction-table.tsx` | Componente | Remover | Tabela de transações MP |
| `components/customer/auto-refund-notice.tsx` | Componente | Remover | Aviso de estorno automático MP |
| `components/customer/boleto-payment-display.tsx` | Componente | Remover | Exibição de boleto gerado pelo MP |
| `components/customer/customer-payment-flow.tsx` | Componente | Remover | Orquestrador de pagamento Mercado Pago no cliente |
| `components/customer/payment-brick.tsx` | Componente | Remover | Wrapper do Mercado Pago Payment Brick |
| `components/customer/payment-security-notice.tsx` | Componente | Remover | Selos de segurança vinculados ao MP |
| `components/customer/payment-status-banner.tsx` | Componente | Remover | Banner de status de transação MP |
| `components/customer/pix-payment-display.tsx` | Componente | Remover | Exibição de QR Code PIX MP |
| `docs/mercadopago-afmotos-vs-mouras.md` | Documentação | Remover | Documento comparativo de teste MP |
| `lib/admin/transaction-actions.ts` | Server Actions | Remover | Ações de reembolso manual MP no admin |
| `lib/admin/transaction-queries.ts` | Queries | Remover | Consultas a `payment_transactions` e `webhook_events` |
| `lib/mercadopago/` (todos os 19 arquivos e testes) | Módulo | Remover | SDK, serviços, validação, snapshot, credenciais e testes |
| `lib/observability/__tests__/payment-logger.test.ts` | Teste | Remover | Testes do logger exclusivo de pagamentos MP |
| `lib/observability/payment-logger.ts` | Utilitário | Remover | Logger exclusivo de telemetria de pagamentos MP |
| `specs/026-mercadopago-vehicle-payment/` | Especificação | Remover | Especificação da feature de pagamento MP |

### Categoria B — Misto Mercado Pago + Consulta (Restaurar somente a parte anterior)
Arquivos compartilhados que foram editados para acomodar Mercado Pago:

| Caminho | Ação de Restauração |
|---|---|
| `app/cliente/consultas/[id]/page.tsx` | Remover importação de `AutoRefundNotice` e verificação de `auto_refund_attempted`. |
| `app/cliente/pagamento/[consultationId]/page.tsx` | Restaurar fluxo para exibir estado de indisponibilidade segura de pagamentos online para consultas pendentes (sem Brick, sem cobrança, sem liberação indevida). |
| `components/admin/admin-sidebar.tsx` | Remover link de navegação para `/admin/transacoes-consultas`. |
| `lib/customer/payment-service.ts` | Remover função `getPaymentStatus` que consultava transações MP. |
| `lib/vehicle-lookup/service.ts` | Remover simulação de erro da placa `ERR9999` criada para teste de estorno MP. |
| `package.json` | Remover dependência `mercadopago` e atualizar script de testes `test`. |
| `package-lock.json` | Regenerar com `npm install`. |

### Categoria C — Infraestrutura de Consulta / Tooling (Preservar)
Arquivos genéricos ou componentes que beneficiam a aplicação independentemente de Mercado Pago:

| Caminho | Decisão | Justificativa |
|---|---|---|
| `.prettierrc` | Preservar | Regra `"endOfLine": "auto"` resolve warnings de quebra de linha em Windows. |
| `app/cliente/pagamento/[consultationId]/loading.tsx` | Preservar | Layout de skeleton elegante para carregamento da página. |
| `components/customer/vehicle-consultation-benefits.tsx` | Preservar | Lista de benefícios oficiais do laudo veicular (utilizável em qualquer resumo). |
| `components/customer/vehicle-consultation-order-summary.tsx` | Preservar | Card com placa e valor do pedido veicular. |
| `lib/customer/queries.ts` | Preservar | Manter queries de consulta sem quebrar campos opcionais existentes no banco. |
| `lib/customer/types.ts` | Preservar | Tipos da área de cliente mantidos compatíveis. |

### Categoria D — Banco de Dados / Migrações Supabase (Não aplicar alteração destrutiva)
As migrações que adicionaram tabelas financeiras e colunas em `customer_plate_consultations`:

| Migração | Descrição | Decisão |
|---|---|---|
| `supabase/migrations/20260912110000_mercadopago_transactions_and_audit.sql` | Cria tabelas `payment_transactions`, `webhook_events`, `consultation_audit_logs` e colunas em `customer_plate_consultations` | **Manter intacta**. Não executar `DROP TABLE` nem `ALTER TABLE DROP COLUMN`. |
| `supabase/migrations/20260912170000_add_idempotency_key_to_payment_transactions.sql` | Adiciona chave de idempotência em `payment_transactions` | **Manter intacta**. |
| `supabase/migrations/20260912180000_add_provider_error_status_to_payment_transactions.sql` | Adiciona `provider_error` em `payment_transactions` | **Manter intacta**. |

---

## 3. Dependências e Rotas Afetadas

### Dependências NPM Removidas:
- `mercadopago` (^3.6.1)

### Rotas HTTP Desativadas:
- `POST /api/webhooks/mercadopago`
- `GET /api/internal/mercadopago/health`
- `GET /api/internal/mercadopago/diagnostic-variations`
- `POST /api/internal/mercadopago/diagnostic-variations`
- `/admin/transacoes-consultas`
