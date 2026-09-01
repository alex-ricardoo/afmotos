# Implementation Plan: Registro, Controle e Relatórios de Comissões por Proposta

**Feature**: `022-registro-comissoes-propostas`  
**Date**: 2026-08-31

---

## 1. Visão Geral da Implementação

A implementação da funcionalidade de comissões por proposta será executada em fases ordenadas para garantir integridade financeira, conformidade com os princípios da Constituição da AF Motos e continuidade dos fluxos existentes (acordos em PDF, cadastro de vendas e relatórios gerenciais).

---

## 2. Arquivos a Criar e a Modificar

### 2.1 Banco de Dados / Migrations
- `[NEW]` `supabase/migrations/20260901000000_create_proposal_commissions.sql`
  - Criação de `public.proposal_commissions` e `public.proposal_commission_audit_logs`.
  - Constraints, índices de performance e RLS com `public.is_admin()`.
  - Migração/backfill seguro de dados legados de `sale_agreements`.

### 2.2 Camada de Domínio & Validação
- `[NEW]` `lib/validations/commission.ts`
  - Schemas Zod: `createCommissionSchema`, `updateCommissionSchema`, `confirmCommissionSchema`, `receiveCommissionSchema`, `cancelCommissionSchema`.
- `[NEW]` `lib/domain/commission-rules.ts`
  - Funções puras e testáveis: `calculateCommission`, `canTransitionCommissionStatus`, `isProposalSuccessful`, `isProposalCancelled`, `isProposalReportEligible`.
- `[NEW]` `types/commission.ts`
  - Interfaces TypeScript: `ProposalCommission`, `CommissionAuditLog`, `CommissionStatus`, `CommissionType`, `CommissionSummaryViewModel`.

### 2.3 Server Actions
- `[NEW]` `lib/actions/commissions.ts`
  - `getCommissionByProposalId(proposalId: string)`
  - `saveOrUpdateCommissionAction(payload: SaveCommissionPayload)`
  - `confirmCommissionAction(id: string, payload: ConfirmCommissionPayload)`
  - `receiveCommissionAction(id: string, payload: ReceiveCommissionPayload)`
  - `cancelCommissionAction(id: string, reason: string)`
  - `getCommissionAuditLogsAction(commissionId: string)`

### 2.4 Interface Administrativa (UI / Components)
- `[NEW]` `components/admin/commission-card.tsx`
  - Card dedicado de comissão para exibição e edição rápida com badges de status, valores previstos/confirmados/recebidos e alerta de elegibilidade.
- `[NEW]` `components/admin/commission-history-modal.tsx`
  - Modal com linha do tempo legível de alterações e justificativas.
- `[NEW]` `components/admin/commission-receive-modal.tsx`
  - Modal com formulário de baixa e recebimento financeiro.
- `[MODIFY]` `components/admin/proposal-detail-drawer.tsx`
  - Integração do `CommissionCard` na aba de atendimento e contratos, sincronização automática ao gerar acordo em PDF.
- `[MODIFY]` `lib/actions/leads.ts`
  - Sincronização ao atualizar status de leads: acionar cancelamento automático de comissões não recebidas quando lead for cancelado/perdido.
- `[MODIFY]` `lib/actions/sales.ts`
  - Sincronizar vínculo da venda com a comissão da proposta correspondente (`sale_id`).

### 2.5 Central de Relatórios & Exportações
- `[MODIFY]` `lib/reports/types.ts`
  - Novos campos em `OverviewReportData`, `SalesReportData` e `AnnualAccountantReportData` para comissões confirmadas, recebidas e pendentes.
- `[MODIFY]` `lib/reports/queries.ts`
  - Substituição da busca simplificada por agregação estruturada em `proposal_commissions` com filtro `eligible_for_reports = true`.
- `[MODIFY]` `lib/reports/export-csv.ts` e `lib/reports/export-xlsx.ts`
  - Adição da seção de comissões segregadas na exportação contábil.
- `[MODIFY]` `components/admin/reports/executive-overview-tab.tsx` e `sales-report-tab.tsx`
  - Exibição de cards informativos de receita de comissão e volume transacionado de terceiros.

---

## 3. Estratégia de Testes

### 3.1 Testes Unitários
- Cálculos matemáticos de comissão percentual e fixa (com arredondamentos corretos em BRL).
- Validações Zod (rejeição de percentual negativo, > 100%, valores nulos inválidos).
- Mapeador de estados (`isProposalSuccessful`, `isProposalCancelled`).
- Regras de transição proibidas (ex.: `received` -> `cancelled` direto sem estorno).

### 3.2 Testes de Integração
- Criar comissão na proposta e verificar geração de log de auditoria.
- Gerar acordo em PDF e atestar criação de comissão em status `proposed` com `eligible_for_reports = false`.
- Concluir venda e verificar transição para `confirmed` com `eligible_for_reports = true`.
- Cancelar proposta e atestar atualização para `cancelled` e remoção da receita do relatório.
- Executar consulta de relatório anual e verificar zero dupla contagem de vendas próprias vs comissões.

---

## 4. Plano de Rollout e Rollback

### Rollout
1. Execução da migration no banco Supabase.
2. Deploy das Server Actions e regras de domínio.
3. Deploy das atualizações no drawer de propostas e central de relatórios.
4. Verificação de integridade dos relatórios com o administrador da loja.

### Rollback
1. Caso ocorra inconsistência, as queries de relatório possuem fallback gracioso para ler registros legados.
2. A migration é estritamente aditiva (não remove colunas existentes de `sales`, `leads` ou `sale_agreements`).
