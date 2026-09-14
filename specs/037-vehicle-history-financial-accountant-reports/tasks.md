# Tasks: Relatório Financeiro e Operacional de Histórico Veicular

**Feature Directory**: `specs/037-vehicle-history-financial-accountant-reports`  
**Branch**: `feat/vehicle-history-financial-accountant-reports`  
**Date**: 2026-09-14  
**Status**: Ready for Execution  

---

## Phase 1: Camada de Dados e Migrations Aditivas

- [x] **TASK-001**: Criar migration `supabase/migrations/20260914160000_create_vehicle_history_financial_reports.sql`.
  - Criar tabela `public.vehicle_history_pricing_versions` com índices parciais e RLS.
  - Criar tabela `public.vehicle_lookup_provider_costs` com idempotência e constraints de status.
  - Adicionar colunas de snapshot financeiro em `public.customer_plate_consultations`.
  - Criar a view unificada `public.admin_vehicle_history_financial_view`.
  - Configurar políticas de RLS baseadas em `admin_profiles.auth_user_id = auth.uid()`.
  - Inserir seed da versão inicial ativa (Preço: R$ 39,90, Custo: R$ 30,00).

---

## Phase 2: Gestão e Versionamento de Precificação

- [x] **TASK-101**: Criar helper centralizado e serviços de precificação em `lib/settings/pricing-service.ts`.
  - Implementar `getVehicleHistoryPricingConfig()` com fallback seguro e tipagem estrita.
  - Implementar mutação atômica que desativa a versão anterior e insere a nova versão ativa.
  - Sincronizar com `site_settings.settings.vehicleHistory.price`.
- [x] **TASK-102**: Criar Server Action em `lib/actions/pricing.ts` com validação Zod e auditoria estruturada.
  - Registrar evento `vehicle_history_pricing.updated` em `consultation_audit_logs`.
- [x] **TASK-103**: Atualizar interface administrativa de configurações em `components/admin/settings/vehicle-history-tab.tsx`.
  - Adicionar bloco "Precificação e Custo do Histórico Veicular".
  - Exibir preço de venda, custo API Brasil, margem bruta estimada unitária e percentual.
  - Adicionar modal de confirmação reforçada para alteração tarifária.
  - Adicionar tabela com histórico de versões anteriores (vigência, responsável, notas).

---

## Phase 3: Instrumentação do Custo de Provedor e Fila de Entrega

- [x] **TASK-201**: Refatorar `lib/vehicle-lookup/config.ts` e `lib/vehicle-lookup/service.ts`.
  - Eliminar custo hardcoded `30.0`.
  - Injetar o snapshot de custo da versão vigente no momento da chamada live.
  - Gravar registro em `vehicle_lookup_provider_costs` para chamadas cobráveis.
  - Garantir classificação de custo zero (`not_applicable`) para fixtures de mock.
- [x] **TASK-202**: Atualizar worker de entrega em `lib/vehicle-delivery/delivery-service.ts`.
  - Registrar custo zero (`not_applicable`) quando a entrega ocorrer via Cache Hit local.
  - Registrar status `not_incurred` em caso de falta de saldo da API Brasil (HTTP 402 / InsufficientBalanceError).
  - Preencher `pricing_version_id` e colunas de snapshot em `customer_plate_consultations`.

---

## Phase 4: Central de Relatórios de Histórico Veicular

- [x] **TASK-301**: Criar queries de agregação analítica em `lib/reports/vehicle-history-queries.ts`.
  - Calcular somatórios de receita bruta, estornos confirmados, receita líquida e custo efetivo.
  - Implementar listagens paginadas das 3 visões: Consultas & Custos, Pagamentos & Estornos, Pacotes B2B & Créditos.
  - Aplicar timezone oficial `America/Sao_Paulo` nos agrupamentos por data.
- [x] **TASK-302**: Criar componentes de interface da aba de Histórico Veicular.
  - Criar `components/admin/reports/tabs/vehicle-history-tab.tsx`.
  - Criar sub-componentes: `VehicleHistoryKPIs`, `VehicleHistoryConsultationsTable`, `VehicleHistoryPaymentsTable`, `VehicleHistoryCreditsTable`.
- [x] **TASK-303**: Integrar a nova aba no dashboard geral em `components/admin/reports/reports-dashboard.tsx`.
  - Adicionar tab `historico-veicular` com ícone correspondente na barra de navegação.

---

## Phase 5: Informe Anual para o Contador e Exportação CSV

- [x] **TASK-401**: Criar queries de consolidação anual em `lib/reports/annual-accountant-queries.ts`.
  - Agrupar métricas financeiras e operacionais por mês (Janeiro a Dezembro) para o ano selecionado.
  - Excluir por padrão registros com `is_mock = true`.
- [x] **TASK-402**: Criar tela do Informe Anual em `components/admin/reports/tabs/vehicle-history-annual-tab.tsx`.
  - Seletor de ano de exercício (2026, 2027...).
  - Resumo de faturamento anual versus custos de provedores e saldo de créditos.
  - Tabela mensal estruturada com receita de gateway, estornos, pacotes e custos.
  - Exibição de disclaimer legal obrigatório de apoio gerencial.
- [x] **TASK-403**: Implementar Route Handler de exportação CSV em `app/api/admin/reports/vehicle-history/export-csv/route.ts`.
  - Gerar CSV com cabeçalhos sanitizados, BOM UTF-8 e separadores padronizados.
  - Garantir proteção de dados (mascaramento de pagamentos, exclusão de tokens).
  - Registrar evento de auditoria `vehicle_history_report.exported_csv`.

---

## Phase 6: Testes Automatizados e Homologação

- [x] **TASK-501**: Implementar suite de testes de versionamento em `lib/settings/__tests__/pricing-versioning.test.ts`.
  - Testar criação de versão, encerramento da anterior e bloqueio de recálculo retroativo.
- [x] **TASK-502**: Implementar suite de testes de custos e cache em `lib/vehicle-lookup/__tests__/cost-snapshot.test.ts`.
  - Testar custo zero para cache hits e registro correto para chamadas live.
- [x] **TASK-503**: Implementar suite de testes dos relatórios em `lib/reports/__tests__/vehicle-history-reports.test.ts`.
  - Testar apuração de receita líquida com estornos e separação de créditos B2B.
- [x] **TASK-504**: Validação de qualidade geral:
  - `npm test` (300 testes passando)
  - `npm run typecheck` (0 erros TypeScript)
  - `npm run lint` (0 erros)
