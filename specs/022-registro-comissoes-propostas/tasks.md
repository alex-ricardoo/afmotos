# Tasks: Registro, Controle e Relatórios de Comissões por Proposta

**Feature**: `022-registro-comissoes-propostas`  
**Date**: 2026-08-31  
**Status**: [X] Completed

---

## Fase 0 — Auditoria de Status e Fluxos Existentes

### [X] TSK-001: Mapeamento de Status e Estruturas de Propostas, Vendas e Acordos
- **Descrição**: Auditar todos os fluxos de leads, solicitações de venda, geração de contratos PDF e registro de vendas para consolidar os mapeamentos de transição de status.
- **Arquivos**: `lib/admin/proposal-view-model.ts`, `lib/actions/leads.ts`, `lib/actions/sales.ts`.
- **Status**: Concluído.

---

## Fase 1 — Schema, Constraints, RLS e Tipos

### [X] TSK-101: Criação da Migration das Tabelas de Comissões e Auditoria
- **Descrição**: Criar a migration SQL contendo a tabela `public.proposal_commissions`, `public.proposal_commission_audit_logs`, chaves estrangeiras, índices e políticas RLS.
- **Arquivos**: `supabase/migrations/20260901000000_create_proposal_commissions.sql`.
- **Status**: Concluído.

### [X] TSK-102: Tipagem TypeScript e Contratos de Domínio
- **Descrição**: Definir os tipos TypeScript e interfaces para comissões, snapshots de auditoria e view models.
- **Arquivos**: `types/commission.ts`.
- **Status**: Concluído.

### [X] TSK-103: Schemas de Validação Runtime com Zod
- **Descrição**: Criar schemas Zod para validação rigorosa de entrada em criação, edição, baixa e cancelamento de comissões.
- **Arquivos**: `lib/validations/commission.ts`.
- **Status**: Concluído.

---

## Fase 2 — Domínio, Cálculo e Máquina de Estados

### [X] TSK-201: Implementação das Funções Puras de Domínio e Regras de Negócio
- **Descrição**: Implementar lógica de cálculo financeiro (percentual/fixo), máquina de estados de transição e regras de elegibilidade para relatórios.
- **Arquivos**: `lib/domain/commission-rules.ts`.
- **Status**: Concluído.

### [X] TSK-202: Testes Unitários de Domínio e Validações
- **Descrição**: Criar suite de testes unitários automatizados para garantir cobertura total das regras matemáticas e de estado.
- **Arquivos**: `lib/domain/commission-rules.ts`, `lib/validations/commission.ts`.
- **Status**: Concluído.

---

## Fase 3 — UI de Comissão na Proposta

### [X] TSK-301: Componente de Exibição e Edição de Comissão (`CommissionCard`)
- **Descrição**: Construir o componente visual com design system consistente para exibição de valores (previsto, confirmado, recebido), badges de status e botões de ação rápida.
- **Arquivos**: `components/admin/commission-card.tsx`.
- **Status**: Concluído.

### [X] TSK-302: Integração do Card de Comissão no Drawer de Propostas
- **Descrição**: Acoplar o `CommissionCard` no `proposal-detail-drawer.tsx`, integrando com a aba de contratos e fechamento e conectando ao carregamento dinâmico da comissão.
- **Arquivos**: `components/admin/proposal-detail-drawer.tsx`.
- **Status**: Concluído.

---

## Fase 4 — Auditoria e Edição Controlada

### [X] TSK-401: Server Actions para CRUD e Auditoria de Comissões
- **Descrição**: Implementar Server Actions com criação de snapshots automáticos em `proposal_commission_audit_logs` a cada alteração.
- **Arquivos**: `lib/actions/commissions.ts`.
- **Status**: Concluído.

### [X] TSK-402: Modal de Histórico de Auditoria (`CommissionHistoryModal`)
- **Descrição**: Criar modal na interface exibindo a linha do tempo legível das alterações de valor e status da comissão.
- **Arquivos**: `components/admin/commission-history-modal.tsx`.
- **Status**: Concluído.

---

## Fase 5 — Integração com Acordo e Venda

### [X] TSK-501: Integração com Geração de Acordo em PDF
- **Descrição**: Atualizar a rota `/api/agreements/generate` para sincronizar automaticamente com a tabela `proposal_commissions`, vinculando `sale_agreement_id`.
- **Arquivos**: `app/api/agreements/generate/route.ts`, `lib/actions/leads.ts`.
- **Status**: Concluído.

### [X] TSK-502: Integração com o Módulo de Vendas
- **Descrição**: Ao cadastrar uma venda de moto consignada, vincular o `sale_id`, preencher `final_sale_value` e atualizar o status da comissão para `confirmed` com `eligible_for_reports = true`.
- **Arquivos**: `lib/actions/sales.ts`.
- **Status**: Concluído.

### [X] TSK-503: Modal de Baixa e Recebimento Financeiro (`CommissionReceiveModal`)
- **Descrição**: Criar modal para registrar data de recebimento, método de pagamento e número de comprovante, marcando a comissão como `received`.
- **Arquivos**: `components/admin/commission-receive-modal.tsx`.
- **Status**: Concluído.

---

## Fase 6 — Integração com Relatórios e Exportação

### [X] TSK-601: Atualização das Queries da Central de Relatórios
- **Descrição**: Atualizar `lib/reports/queries.ts` para agregar comissões elegíveis de `proposal_commissions`, diferenciando Regime de Competência e Regime de Caixa.
- **Arquivos**: `lib/reports/queries.ts`, `lib/reports/types.ts`.
- **Status**: Concluído.

### [X] TSK-602: Atualização dos Componentes Visuais de Relatórios
- **Descrição**: Adicionar cards de KPI na Visão Geral Executiva e na aba de Vendas para receitas de comissão confirmadas e recebidas.
- **Arquivos**: `components/admin/reports/tabs/overview-tab.tsx`, `components/admin/reports/tabs/sales-tab.tsx`.
- **Status**: Concluído.

### [X] TSK-603: Atualização das Exportações Contábeis (CSV/XLSX)
- **Descrição**: Incluir a planilha/seção de comissões de intermediação nos arquivos de exportação contábil anual com mascaramento de dados sensíveis.
- **Arquivos**: `lib/reports/export-csv.ts`, `lib/reports/export-xlsx.ts`.
- **Status**: Concluído.

---

## Fase 7 — Segurança, Concorrência e Dados Legados

### [X] TSK-701: Backfill e Compatibilidade com Dados Legados
- **Descrição**: Criar script de backfill idempotente para criar registros de comissão a partir de acordos e vendas existentes.
- **Arquivos**: `supabase/migrations/20260901000000_create_proposal_commissions.sql`.
- **Status**: Concluído.

### [X] TSK-702: Proteção de Idempotência e Concorrência
- **Descrição**: Implementar travas contra duplo clique em Server Actions de confirmação e baixa de comissões.
- **Arquivos**: `lib/actions/commissions.ts`.
- **Status**: Concluído.

---

## Fase 8 — Testes, Rollout e Documentação

### [X] TSK-801: Testes de Integração End-to-End e Verificação Geral
- **Descrição**: Executar bateria de testes manuais e automatizados cobrindo todo o fluxo da proposta à exportação contábil.
- **Arquivos**: `specs/022-registro-comissoes-propostas/quickstart.md`.
- **Status**: Concluído.
